import type {
  OpenAPISpec,
  OpenAPISchema,
  OpenAPIParameter,
} from "./openapi-fetcher.js";

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

interface Module {
  name: string;
  basePath: string;
  description: string;
  endpoints: Endpoint[];
}

export type ApiCatalog = Record<string, Module>;

/**
 * Transform an OpenAPI 3.0 spec into the MCP api-catalog format,
 * grouping endpoints by their @ApiTags value.
 */
export function transformToApiCatalog(spec: OpenAPISpec): ApiCatalog {
  const catalog: ApiCatalog = {};
  const schemas = spec.components?.schemas || {};
  const tagDescriptions = new Map<string, string>();

  for (const tag of spec.tags || []) {
    if (tag.description) tagDescriptions.set(tag.name, tag.description);
  }

  for (const [fullPath, methods] of Object.entries(spec.paths)) {
    for (const [httpMethod, operation] of Object.entries(methods)) {
      if (httpMethod === "parameters") continue;

      const tag = operation.tags?.[0] || "Uncategorized";
      const moduleKey = slugify(tag);

      if (!catalog[moduleKey]) {
        catalog[moduleKey] = {
          name: tag,
          basePath: extractBasePath(fullPath),
          description: tagDescriptions.get(tag) || "",
          endpoints: [],
        };
      }

      const requiresAuth = hasAuth(operation.security);
      const bodyFields = extractBody(operation.requestBody, schemas);
      const queryParams = extractParams(operation.parameters, "query");
      const pathParams = extractParams(operation.parameters, "path");
      const responseSummary = extractResponse(operation.responses, schemas);

      catalog[moduleKey].endpoints.push({
        method: httpMethod.toUpperCase(),
        path: stripApiPrefix(fullPath, catalog[moduleKey].basePath),
        summary: operation.summary || operation.operationId || "",
        auth: requiresAuth,
        ...(bodyFields && Object.keys(bodyFields).length > 0 && { body: bodyFields }),
        ...(queryParams && Object.keys(queryParams).length > 0 && { query: queryParams }),
        ...(pathParams && Object.keys(pathParams).length > 0 && { params: pathParams }),
        ...(responseSummary && { response: responseSummary }),
      });
    }
  }

  // Update basePath to the longest common prefix of all endpoint paths
  for (const mod of Object.values(catalog)) {
    if (mod.endpoints.length > 0) {
      // basePath was set from first endpoint; leave it as-is
    }
  }

  return catalog;
}

// --- Helper functions ---

function slugify(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractBasePath(fullPath: string): string {
  // "/api/auth/login" -> "/api/auth"
  // "/api/pharmacy/drugs/:id" -> "/api/pharmacy/drugs"
  const parts = fullPath.split("/").filter(Boolean);
  // Take up to the first parameterized segment or the second-to-last
  const baseParts: string[] = [];
  for (const part of parts) {
    if (part.startsWith("{") || part.startsWith(":")) break;
    baseParts.push(part);
  }
  // Remove the last segment (it's usually the action)
  if (baseParts.length > 2) {
    return "/" + baseParts.slice(0, -1).join("/");
  }
  return "/" + baseParts.join("/");
}

function stripApiPrefix(fullPath: string, basePath: string): string {
  if (fullPath.startsWith(basePath)) {
    const remainder = fullPath.slice(basePath.length);
    return remainder || "/";
  }
  // Fallback: just strip /api prefix
  return fullPath.replace(/^\/api/, "") || "/";
}

function hasAuth(
  security?: Array<Record<string, string[]>>
): boolean {
  if (!security || security.length === 0) return false;
  return security.some(
    (s) => "JWT-auth" in s || "bearer" in s || "Trial-token" in s
  );
}

function extractBody(
  requestBody: { content?: { "application/json"?: { schema: OpenAPISchema } } } | undefined,
  schemas: Record<string, OpenAPISchema>
): Record<string, string> | undefined {
  const schema = requestBody?.content?.["application/json"]?.schema;
  if (!schema) return undefined;
  return schemaToFieldMap(schema, schemas, 0);
}

function extractParams(
  parameters: OpenAPIParameter[] | undefined,
  location: "query" | "path"
): Record<string, string> | undefined {
  if (!parameters) return undefined;
  const filtered = parameters.filter((p) => p.in === location);
  if (filtered.length === 0) return undefined;

  const fields: Record<string, string> = {};
  for (const p of filtered) {
    fields[p.name] = describeType(p.schema, p.required !== false);
  }
  return fields;
}

function extractResponse(
  responses:
    | Record<string, { description?: string; content?: Record<string, { schema: OpenAPISchema }> }>
    | undefined,
  schemas: Record<string, OpenAPISchema>
): string | undefined {
  if (!responses) return undefined;

  // Try 200, 201 responses
  for (const code of ["200", "201"]) {
    const resp = responses[code];
    if (resp?.content?.["application/json"]?.schema) {
      const schema = resolveRef(
        resp.content["application/json"].schema,
        schemas
      );
      if (schema.properties) {
        const keys = Object.keys(schema.properties).join(", ");
        return `{ ${keys} }`;
      }
      if (schema.type === "array" && schema.items) {
        const itemSchema = resolveRef(schema.items, schemas);
        if (itemSchema.properties) {
          const keys = Object.keys(itemSchema.properties).join(", ");
          return `[{ ${keys} }]`;
        }
      }
    }
    if (resp?.description) {
      return resp.description;
    }
  }
  return undefined;
}

function schemaToFieldMap(
  schema: OpenAPISchema,
  schemas: Record<string, OpenAPISchema>,
  depth: number
): Record<string, string> | undefined {
  if (depth > 5) return undefined;

  const resolved = resolveRef(schema, schemas);
  if (!resolved.properties) return undefined;

  const required = new Set(resolved.required || []);
  const fields: Record<string, string> = {};

  for (const [name, prop] of Object.entries(resolved.properties)) {
    const resolvedProp = resolveRef(prop, schemas);
    fields[name] = describeType(resolvedProp, required.has(name));
  }
  return fields;
}

function resolveRef(
  schema: OpenAPISchema,
  schemas: Record<string, OpenAPISchema>
): OpenAPISchema {
  if (schema.$ref) {
    const refName = schema.$ref.replace("#/components/schemas/", "");
    return schemas[refName] || schema;
  }
  if (schema.allOf) {
    // Merge allOf schemas
    const merged: OpenAPISchema = { type: "object", properties: {}, required: [] };
    for (const sub of schema.allOf) {
      const resolved = resolveRef(sub, schemas);
      if (resolved.properties) {
        merged.properties = { ...merged.properties, ...resolved.properties };
      }
      if (resolved.required) {
        merged.required = [...(merged.required || []), ...resolved.required];
      }
    }
    return merged;
  }
  return schema;
}

function describeType(schema: OpenAPISchema, required?: boolean): string {
  let type = schema.type || "any";

  if (schema.enum) {
    type = schema.enum.map(String).join(" | ");
  } else if (schema.type === "array" && schema.items) {
    const itemType = schema.items.$ref
      ? schema.items.$ref.replace("#/components/schemas/", "")
      : schema.items.type || "any";
    type = `${itemType}[]`;
  } else if (schema.format) {
    type = `${type} (${schema.format})`;
  } else if (schema.$ref) {
    type = schema.$ref.replace("#/components/schemas/", "");
  }

  if (schema.default !== undefined) {
    type += ` (default: ${JSON.stringify(schema.default)})`;
  }

  if (required === false) {
    type += " (optional)";
  }

  return type;
}
