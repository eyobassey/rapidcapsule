# RapidCapsule MCP Server

Model Context Protocol (MCP) server that gives AI coding assistants (Claude Code, Cursor, etc.) full knowledge of the RapidCapsule API — 544 endpoints, 50 modules, and 19 entity schemas.

Auto-syncs from the live Swagger/OpenAPI endpoint so it's always up to date.

## Quick Setup

### 1. Install & Build

```bash
cd RC-MCP-Server
npm install
npm run build
```

### 2. Add to Claude Code

**If you're running the backend locally (port 5020):**

```bash
claude mcp add rapidcapsule-api -- node /absolute/path/to/RC-MCP-Server/dist/index.js
```

**If you're NOT running the backend (e.g. mobile app development):**

```bash
claude mcp add rapidcapsule-api \
  -e SWAGGER_URL=https://rapidcapsule.com/api/docs-json \
  -- node /absolute/path/to/RC-MCP-Server/dist/index.js
```

### 3. Verify

Restart Claude Code and ask: "What API modules are available?" — it should list all 50 modules.

## Available Tools

| Tool | Description |
|------|-------------|
| `list_modules` | List all API modules with endpoint counts |
| `get_module` | Get all endpoints for a specific module (e.g. `pharmacy-drugs`, `appointments`) |
| `search_api` | Search endpoints by keyword or HTTP method |
| `get_entity` | Get Mongoose entity schema (e.g. `User`, `Drug`, `PharmacyOrder`) |
| `refresh_api_docs` | Re-fetch from live Swagger (use after backend deploys) |

## How It Works

1. On startup, fetches the OpenAPI spec from the Swagger endpoint
2. Transforms it into a module-based catalog grouped by API tags
3. Falls back to static JSON files (`src/data/`) if the backend is unreachable
4. Entity schemas (Mongoose) always load from static files since they aren't in OpenAPI

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SWAGGER_URL` | `http://localhost:5020/api/docs-json` | OpenAPI/Swagger JSON endpoint |

## Project Structure

```
RC-MCP-Server/
├── src/
│   ├── index.ts              # Entry point
│   ├── tools.ts              # MCP tool definitions
│   ├── resources.ts          # MCP resource definitions
│   ├── openapi-fetcher.ts    # Fetches live OpenAPI spec
│   ├── openapi-transformer.ts # Converts OpenAPI to MCP catalog format
│   └── data/
│       ├── api-catalog.json  # Static fallback (API endpoints)
│       ├── entities.json     # Mongoose entity schemas
│       └── architecture.md   # System architecture docs
├── dist/                     # Compiled output (after npm run build)
├── package.json
└── tsconfig.json
```

## Updating Static Fallback Files

The static JSON files in `src/data/` are used when the backend is unreachable. To update them, run the MCP server with the backend running and use the `refresh_api_docs` tool, or manually regenerate them.

## Author

Bassey Eyo (eyobassey@gmail.com)
