const SWAGGER_URL =
  process.env.SWAGGER_URL || "http://localhost:5020/api/docs-json";

export interface OpenAPISpec {
  openapi: string;
  info: { title: string; version: string };
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components?: {
    schemas?: Record<string, OpenAPISchema>;
    securitySchemes?: Record<string, unknown>;
  };
  tags?: Array<{ name: string; description?: string }>;
}

export interface OpenAPIOperation {
  tags?: string[];
  summary?: string;
  operationId?: string;
  security?: Array<Record<string, string[]>>;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    content?: {
      "application/json"?: { schema: OpenAPISchema };
    };
  };
  responses?: Record<
    string,
    { description?: string; content?: Record<string, { schema: OpenAPISchema }> }
  >;
}

export interface OpenAPIParameter {
  name: string;
  in: "query" | "path" | "header";
  required?: boolean;
  schema: OpenAPISchema;
  description?: string;
}

export interface OpenAPISchema {
  type?: string;
  properties?: Record<string, OpenAPISchema>;
  required?: string[];
  $ref?: string;
  items?: OpenAPISchema;
  enum?: (string | number)[];
  format?: string;
  description?: string;
  default?: unknown;
  allOf?: OpenAPISchema[];
  oneOf?: OpenAPISchema[];
  anyOf?: OpenAPISchema[];
  nullable?: boolean;
}

export async function fetchOpenAPISpec(): Promise<OpenAPISpec | null> {
  try {
    const response = await fetch(SWAGGER_URL, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return (await response.json()) as OpenAPISpec;
  } catch {
    return null;
  }
}
