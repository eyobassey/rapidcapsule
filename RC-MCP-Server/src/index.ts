import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createServer } from "http";
import { loadData, registerTools } from "./tools.js";
import { registerResources } from "./resources.js";

const PORT = parseInt(process.env.MCP_PORT || "3100", 10);
const BASE_PATH = process.env.MCP_BASE_PATH || "/mcp";
const useSSE = process.argv.includes("--sse") || !!process.env.MCP_PORT;

async function main() {
  // Load API catalog (live Swagger or static fallback) before starting
  await loadData();

  if (useSSE) {
    await startSSE();
  } else {
    await startStdio();
  }
}

async function startStdio() {
  const server = new McpServer({
    name: "rapidcapsule-api",
    version: "1.1.0",
  });

  registerTools(server);
  registerResources(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

async function startSSE() {
  // Track active SSE sessions
  const sessions = new Map<string, SSEServerTransport>();

  const httpServer = createServer(async (req, res) => {
    // CORS headers for cross-origin access
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://localhost:${PORT}`);

    // SSE connection endpoint — clients GET /sse to open a stream
    if (url.pathname === "/sse" && req.method === "GET") {
      const server = new McpServer({
        name: "rapidcapsule-api",
        version: "1.1.0",
      });

      registerTools(server);
      registerResources(server);

      const transport = new SSEServerTransport(`${BASE_PATH}/messages`, res);
      sessions.set(transport.sessionId, transport);

      transport.onclose = () => {
        sessions.delete(transport.sessionId);
      };

      await server.connect(transport);
      await transport.start();
      return;
    }

    // Message endpoint — clients POST JSON-RPC messages to /messages?sessionId=xxx
    if (url.pathname === "/messages" && req.method === "POST") {
      const sessionId = url.searchParams.get("sessionId");
      if (!sessionId || !sessions.has(sessionId)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid or missing sessionId" }));
        return;
      }

      const transport = sessions.get(sessionId)!;
      await transport.handlePostMessage(req, res);
      return;
    }

    // Health check
    if (url.pathname === "/" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          name: "rapidcapsule-api",
          version: "1.1.0",
          transport: "sse",
          activeSessions: sessions.size,
          sse_endpoint: `/sse`,
          message_endpoint: `/messages`,
        })
      );
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  httpServer.listen(PORT, () => {
    console.error(`[MCP] SSE server listening on http://localhost:${PORT}`);
    console.error(`[MCP] SSE endpoint: http://localhost:${PORT}/sse`);
  });
}

main().catch(console.error);
