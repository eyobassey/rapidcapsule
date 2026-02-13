import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { fetchOpenAPISpec } from "./openapi-fetcher.js";
import { transformToApiCatalog, type ApiCatalog } from "./openapi-transformer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Endpoint {
  method: string;
  path: string;
  summary: string;
  auth: boolean;
  body?: Record<string, string>;
  query?: Record<string, string>;
  params?: Record<string, string>;
  response?: string;
}

interface EntityField {
  type: string;
  required?: boolean;
  ref?: string;
  enum?: string[];
  default?: string | number | boolean;
  fields?: Record<string, EntityField>;
}

interface Entity {
  collection: string;
  description: string;
  fields: Record<string, EntityField>;
}

type EntityCatalog = Record<string, Entity>;

// Module-level state
let catalog: ApiCatalog = {};
let entities: EntityCatalog = {};
let lastRefresh: Date | null = null;
let dataSource: "live" | "static" = "static";

function loadJSON<T>(filename: string): T {
  const filePath = join(__dirname, "data", filename);
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

/**
 * Load API catalog from live Swagger endpoint, falling back to static JSON.
 * Entity schemas always come from static file (Mongoose schemas aren't in OpenAPI).
 */
export async function loadData(): Promise<void> {
  // Always load entities from static file (Mongoose schemas)
  try {
    entities = loadJSON<EntityCatalog>("entities.json");
  } catch {
    console.error("[MCP] Warning: Could not load static entities.json");
    entities = {};
  }

  // Try live Swagger fetch for API catalog
  const spec = await fetchOpenAPISpec();
  if (spec && spec.paths && Object.keys(spec.paths).length > 0) {
    catalog = transformToApiCatalog(spec);
    lastRefresh = new Date();
    dataSource = "live";
    const endpointCount = Object.values(catalog).reduce(
      (sum, mod) => sum + mod.endpoints.length,
      0
    );
    console.error(
      `[MCP] Loaded API docs from live Swagger (${Object.keys(catalog).length} modules, ${endpointCount} endpoints)`
    );
  } else {
    // Fallback to static files
    try {
      catalog = loadJSON<ApiCatalog>("api-catalog.json");
      dataSource = "static";
      const endpointCount = Object.values(catalog).reduce(
        (sum, mod) => sum + mod.endpoints.length,
        0
      );
      console.error(
        `[MCP] Backend unavailable, using static API catalog (${Object.keys(catalog).length} modules, ${endpointCount} endpoints)`
      );
    } catch {
      console.error("[MCP] Warning: Could not load static api-catalog.json");
      catalog = {};
      dataSource = "static";
    }
  }
}

export function registerTools(server: McpServer): void {
  // Tool 1: List all modules
  server.tool(
    "list_modules",
    "List all API modules with their endpoint counts and descriptions",
    {},
    async () => {
      const modules = Object.entries(catalog).map(([key, mod]) => ({
        module: key,
        name: mod.name,
        basePath: mod.basePath,
        description: mod.description,
        endpointCount: mod.endpoints.length,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { dataSource, moduleCount: modules.length, modules },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // Tool 2: Get module details
  server.tool(
    "get_module",
    "Get all endpoints and details for a specific API module",
    {
      module: z
        .string()
        .describe(
          "Module key (e.g. 'auth', 'pharmacy-orders', 'appointments')"
        ),
    },
    async ({ module: moduleKey }) => {
      // Try exact match first, then case-insensitive
      let mod = catalog[moduleKey];
      if (!mod) {
        const key = Object.keys(catalog).find(
          (k) => k.toLowerCase() === moduleKey.toLowerCase()
        );
        if (key) mod = catalog[key];
      }

      if (!mod) {
        const available = Object.keys(catalog).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: `Module "${moduleKey}" not found. Available modules: ${available}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(mod, null, 2),
          },
        ],
      };
    }
  );

  // Tool 3: Search endpoints
  server.tool(
    "search_api",
    "Search API endpoints by keyword, HTTP method, or path pattern",
    {
      query: z
        .string()
        .describe("Search keyword (matches path, summary, or module name)"),
      method: z
        .string()
        .optional()
        .describe("Filter by HTTP method: GET, POST, PATCH, DELETE"),
    },
    async ({ query, method }) => {
      const results: Array<{
        module: string;
        basePath: string;
        endpoint: Endpoint;
      }> = [];
      const q = query.toLowerCase();
      const m = method?.toUpperCase();

      for (const [key, mod] of Object.entries(catalog)) {
        for (const ep of mod.endpoints) {
          const matchesQuery =
            ep.path.toLowerCase().includes(q) ||
            ep.summary.toLowerCase().includes(q) ||
            mod.name.toLowerCase().includes(q) ||
            key.toLowerCase().includes(q);
          const matchesMethod = !m || ep.method === m;

          if (matchesQuery && matchesMethod) {
            results.push({
              module: key,
              basePath: mod.basePath,
              endpoint: ep,
            });
          }
        }
      }

      if (results.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No endpoints found matching "${query}"${method ? ` with method ${method}` : ""}`,
            },
          ],
        };
      }

      const formatted = results.map((r) => ({
        module: r.module,
        method: r.endpoint.method,
        fullPath: `${r.basePath}${r.endpoint.path}`,
        summary: r.endpoint.summary,
        auth: r.endpoint.auth,
        body: r.endpoint.body,
        query: r.endpoint.query,
        response: r.endpoint.response,
      }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(formatted, null, 2),
          },
        ],
      };
    }
  );

  // Tool 4: Get entity schema
  server.tool(
    "get_entity",
    "Get Mongoose entity schema definition with all fields and types",
    {
      entity: z
        .string()
        .describe(
          "Entity name (e.g. 'User', 'Appointment', 'Drug', 'PharmacyOrder')"
        ),
    },
    async ({ entity }) => {
      // Try exact match first, then case-insensitive
      let match = entities[entity];
      if (!match) {
        const key = Object.keys(entities).find(
          (k) => k.toLowerCase() === entity.toLowerCase()
        );
        if (key) match = entities[key];
      }

      if (!match) {
        const available = Object.keys(entities).join(", ");
        return {
          content: [
            {
              type: "text" as const,
              text: `Entity "${entity}" not found. Available entities: ${available}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ [entity]: match }, null, 2),
          },
        ],
      };
    }
  );

  // Tool 5: Refresh API docs from live Swagger
  server.tool(
    "refresh_api_docs",
    "Refresh API documentation from the live Swagger endpoint. Use when the backend has been restarted or endpoints have changed.",
    {},
    async () => {
      const previousSource = dataSource;
      const previousModuleCount = Object.keys(catalog).length;
      const previousEndpointCount = Object.values(catalog).reduce(
        (sum, mod) => sum + mod.endpoints.length,
        0
      );

      await loadData();

      const newModuleCount = Object.keys(catalog).length;
      const newEndpointCount = Object.values(catalog).reduce(
        (sum, mod) => sum + mod.endpoints.length,
        0
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                status: "refreshed",
                source: dataSource,
                previous_source: previousSource,
                modules: newModuleCount,
                previous_modules: previousModuleCount,
                endpoints: newEndpointCount,
                previous_endpoints: previousEndpointCount,
                entities: Object.keys(entities).length,
                last_refresh: lastRefresh?.toISOString() || null,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
