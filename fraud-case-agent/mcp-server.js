// MCP server for the fraud case agent's tools.
//
// Exposes the same two tools the agent loop uses (get_case_summary,
// get_identity_verification) over the Model Context Protocol, so any MCP
// client (Claude Desktop, Claude Code) can investigate cases with them.
//
// It reuses tools.js (schemas) and functions.js (mock implementations)
// unchanged: one definition of each tool, two ways to reach it.
// No API key is needed here; the MCP client supplies the model.

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { tools } = require("./tools");
const { toolFunctions } = require("./functions");

const server = new Server(
  { name: "fraud-case-tools", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// MCP spells the schema field "inputSchema"; the Anthropic API spells it "input_schema".
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.input_schema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const fn = toolFunctions[name];
  if (!fn) {
    return { isError: true, content: [{ type: "text", text: `Unknown tool: ${name}` }] };
  }
  const result = fn(args || {});
  // A lookup that finds nothing is reported as a tool error, so the client
  // sees the failure explicitly (the C-1004 vendor-failure case).
  return {
    isError: Boolean(result.error),
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  };
});

async function main() {
  await server.connect(new StdioServerTransport());
  // Log to stderr only: stdout carries the protocol messages.
  console.error("fraud-case-tools MCP server running on stdio");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
