const Anthropic = require("@anthropic-ai/sdk");

const { tools } = require("./tools");

const { toolFunctions } = require("./functions");

const MAX_ITERATIONS = 5; // hard stop-condition guardrail

const SYSTEM_PROMPT = `You are a fraud case investigation assistant. Given a case ID,
investigate it using the available tools and produce a 3-sentence risk summary with a
recommendation (escalate / routine review / clear). Only call get_identity_verification
if the case summary suggests a possible identity inconsistency. Do not call tools you
don't need.`;

// --- The reusable dispatch logic. Pulled out on its own so it can be
// unit-tested with a FAKE response (no API call) — see test-mock-agent.js ---
function extractToolUseBlocks(message) {
  return message.content.filter((block) => block.type === "tool_use");
}

async function executeTool(block) {
  const fn = toolFunctions[block.name];
  if (!fn) {
    return { error: `Unknown tool requested: ${block.name}` };
  }
  return fn(block.input);
}

async function runToolLoop(message, log) {
  const toolUseBlocks = extractToolUseBlocks(message);
  const toolResults = [];
  for (const block of toolUseBlocks) {
    const result = await executeTool(block);
    log.push({ tool: block.name, input: block.input, result });
    toolResults.push({
      type: "tool_result",
      tool_use_id: block.id,
      content: JSON.stringify(result),
    });
  }
  return toolResults;
}

// --- The live-API loop ---
async function investigateCase(caseId) {
  // The SDK reads the key from the environment; no secret appears in code.
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const log = [];
  const messages = [{ role: "user", content: `Investigate case ${caseId}.` }];
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6", // swap for any current model
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });
    messages.push({ role: "assistant", content: response.content });
    if (response.stop_reason !== "tool_use") {
      const finalText = response.content.find((b) => b.type === "text")?.text || "";
      return { summary: finalText, log };
    }
    const toolResults = await runToolLoop(response, log);
    messages.push({ role: "user", content: toolResults });
  }
  return { summary: "Stopped: max iterations reached without a final answer.", log };
}

module.exports = { investigateCase, extractToolUseBlocks, executeTool, runToolLoop };

// CLI entry point: `node agent.js C-1002`
if (require.main === module) {
  const caseId = process.argv[2];
  if (!caseId) {
    console.error("Usage: node agent.js <case_id>");
    process.exit(1);
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Set ANTHROPIC_API_KEY in your environment first.");
    process.exit(1);
  }
  investigateCase(caseId).then(({ summary, log }) => {
    console.log("\n--- Tool call log ---");
    console.log(JSON.stringify(log, null, 2));
    console.log("\n--- Final summary ---");
    console.log(summary);
  });
}
