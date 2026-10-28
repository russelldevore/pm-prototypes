// Zero-cost check of the MCP server: starts it, lists its tools, and calls
// each one, with no model and no API key. Run: node test-mcp-client.js

const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");

let passed = 0;
let failed = 0;
function check(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  ok ? passed++ : failed++;
}

async function main() {
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await client.connect(
    new StdioClientTransport({ command: "node", args: [__dirname + "/mcp-server.js"] })
  );

  const { tools } = await client.listTools();
  check("server lists 2 tools", tools.length === 2);
  check(
    "tool names match tools.js",
    tools.map((t) => t.name).sort().join(",") === "get_case_summary,get_identity_verification"
  );

  const summary = await client.callTool({ name: "get_case_summary", arguments: { case_id: "C-1001" } });
  check("C-1001 summary returns data", !summary.isError && summary.content[0].text.includes("velocity_flag"));

  const identity = await client.callTool({ name: "get_identity_verification", arguments: { case_id: "C-1002" } });
  check("C-1002 identity returns data", !identity.isError);

  const missing = await client.callTool({ name: "get_identity_verification", arguments: { case_id: "C-1004" } });
  check("C-1004 missing identity record is flagged as an error", missing.isError === true);

  const bogus = await client.callTool({ name: "not_a_tool", arguments: {} });
  check("unknown tool name is rejected", bogus.isError === true);

  await client.close();
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
