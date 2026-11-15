import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["node_modules/tsx/dist/cli.mjs", "src/mcp-server.ts"],
});
const client = new Client({ name: "smoke", version: "1.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("Schema properties:", Object.keys(tools.tools[0].inputSchema.properties));

console.log("--- new key (repoPath) ---");
console.log(JSON.stringify(await client.callTool({
  name: "review_repository",
  arguments: { repoPath: "C:\\Users\\quxay\\ai-repo-inspector" },
}), null, 2));

console.log("--- old key (repo_path) ---");
try {
  console.log(JSON.stringify(await client.callTool({
    name: "review_repository",
    arguments: { repo_path: "C:\\Users\\quxay\\ai-repo-inspector" },
  }), null, 2));
} catch (e) {
  console.log("Rejected:", e.message);
}
await client.close();