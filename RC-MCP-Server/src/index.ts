import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadData, registerTools } from "./tools.js";
import { registerResources } from "./resources.js";

async function main() {
  // Load API catalog (live Swagger or static fallback) before starting
  await loadData();

  const server = new McpServer({
    name: "rapidcapsule-api",
    version: "1.1.0",
  });

  registerTools(server);
  registerResources(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
