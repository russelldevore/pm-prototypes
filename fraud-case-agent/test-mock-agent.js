// Validates the agent's dispatch/tool-execution logic using a HAND-BUILT fake
// response shaped like what the real Anthropic API would return.
// No API key, no network call, no tokens spent.
const { extractToolUseBlocks, executeTool, runToolLoop } = require("./agent");

async function run() {
  let passed = 0;
  let failed = 0;
  function check(label, condition) {
    if (condition) {
      console.log(`  PASS  ${label}`);
      passed++;
    } else {
      console.log(`  FAIL  ${label}`);
      failed++;
    }
  }
  // --- Fixture 1: fake response where the model requests get_case_summary ---
  console.log("\nFixture 1: model requests get_case_summary(C-1002)");
  const fakeResponse1 = {
    stop_reason: "tool_use",
    content: [
      { type: "text", text: "I'll pull the case summary first." },
      {
        type: "tool_use",
        id: "toolu_fake_001",
        name: "get_case_summary",
        input: { case_id: "C-1002" },
      },
    ],
  };
  const blocks1 = extractToolUseBlocks(fakeResponse1);
  check("extracts exactly one tool_use block", blocks1.length === 1);
  check("extracted block targets get_case_summary", blocks1[0].name === "get_case_summary");
  const result1 = await executeTool(blocks1[0]);
  check("get_case_summary returns real mock data for C-1002", result1.case_id === "C-1002");
  check("C-1002 correctly shows velocity_flag=false", result1.velocity_flag === false);
  const log1 = [];
  const toolResults1 = await runToolLoop(fakeResponse1, log1);
  check("runToolLoop logs exactly one call", log1.length === 1);
  check("runToolLoop returns a tool_result block", toolResults1[0].type === "tool_result");
  check("tool_result is linked to the original tool_use_id", toolResults1[0].tool_use_id === "toolu_fake_001");
  // --- Fixture 2: model requests an UNKNOWN tool (hallucinated tool name) ---
  console.log("\nFixture 2: model requests a tool that doesn't exist (error handling)");
  const fakeResponse2 = {
    stop_reason: "tool_use",
    content: [
      {
        type: "tool_use",
        id: "toolu_fake_002",
        name: "get_credit_bureau_report", // not a registered tool
        input: { case_id: "C-1002" },
      },
    ],
  };
  const blocks2 = extractToolUseBlocks(fakeResponse2);
  const result2 = await executeTool(blocks2[0]);
  check("unknown tool name returns a graceful error, not a crash", !!result2.error);
  // --- Fixture 3: model is DONE (no tool call) ---
  console.log("\nFixture 3: model returns a final answer, no tool_use");
  const fakeResponse3 = {
    stop_reason: "end_turn",
    content: [{ type: "text", text: "This case shows no fraud indicators. Recommend: clear." }],
  };
  const blocks3 = extractToolUseBlocks(fakeResponse3);
  check("no tool_use blocks extracted when the model is finished", blocks3.length === 0);
  // --- Fixture 4: case ID that doesn't exist ---
  console.log("\nFixture 4: tool called with an invalid case_id");
  const result4 = await executeTool({
    name: "get_case_summary",
    input: { case_id: "C-9999" },
  });
  check("missing case_id returns a graceful error, not a crash", !!result4.error);
  console.log(`\n${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

run();
