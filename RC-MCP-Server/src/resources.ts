import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function registerResources(server: McpServer): void {
  // Resource 1: Architecture overview
  server.resource(
    "architecture",
    "rapidcapsule://architecture",
    {
      description: "Rapid Capsule system architecture, tech stack, auth flow, and mobile integration guide",
      mimeType: "text/markdown",
    },
    async () => {
      const content = readFileSync(
        join(__dirname, "data", "architecture.md"),
        "utf-8"
      );
      return {
        contents: [
          {
            uri: "rapidcapsule://architecture",
            mimeType: "text/markdown",
            text: content,
          },
        ],
      };
    }
  );

  // Resource 2: Auth guide
  server.resource(
    "auth-guide",
    "rapidcapsule://auth-guide",
    {
      description: "JWT authentication flow, guards, OAuth, biometric login, and token handling",
      mimeType: "text/markdown",
    },
    async () => {
      const authGuide = `# Rapid Capsule Authentication Guide

## JWT Authentication
All authenticated endpoints require: \`Authorization: Bearer <token>\`

### Guards Used by Endpoints
- **JwtAuthGuard** — Most endpoints (validates JWT token)
- **LocalAuthGuard** — Login endpoint only (validates email/password)
- **IsEmailVerified** — Enforced during login
- **IsUserActive** — Enforced during login
- **DoesUserExist** — Registration endpoint
- **AdminOrJwtGuard** — Some appointment endpoints (allows admin header override)
- **TrialGuard** — Trial/demo endpoints (validates trial token instead of JWT)

### Login Flow
\`\`\`
POST /api/auth/login
Body: { "email": "user@example.com", "password": "..." }
Response: { "statusCode": 200, "message": "Success", "data": { "token": "eyJ...", "user": { ... } } }
\`\`\`

### Google OAuth
\`\`\`
POST /api/auth/google/alt-login
Body: { "idToken": "google_id_token", "user_type": "Patient" }
\`\`\`

### Apple OAuth
\`\`\`
POST /api/auth/apple
Body: { "identityToken": "apple_identity_token", "user_type": "Patient", "fullName": { "givenName": "...", "familyName": "..." } }
\`\`\`

### 2FA Flow
1. \`POST /api/auth/2fa/generate\` — Returns QR code / secret
2. User scans with authenticator app
3. \`POST /api/auth/2fa/turn-on\` — Enables 2FA with code verification
4. On login: \`POST /api/auth/2fa/verify\` — Required if 2FA enabled

### Biometric / Passkey Flow
1. \`POST /api/auth/biometric/register/options\` — Get WebAuthn registration challenge
2. \`POST /api/auth/biometric/register/verify\` — Complete registration with authenticator response
3. \`POST /api/auth/biometric/login/options\` — Get authentication challenge
4. \`POST /api/auth/biometric/login/verify\` — Complete login with signed challenge

### Session Management
- \`GET /api/auth/sessions\` — List active sessions (device, IP, last active)
- \`DELETE /api/auth/sessions/:sessionId\` — Revoke specific session
- \`POST /api/auth/sessions/revoke-all-other\` — Revoke all except current

### Password Reset
1. \`POST /api/auth/forgot-password\` — Sends reset email/OTP
2. \`POST /api/auth/reset-password\` — Reset with token + new password

### Email/Phone Change
- \`PATCH /api/auth/change-email-address\` — Initiates email change (sends verification)
- \`PATCH /api/auth/verify-email-address-change\` — Confirms with OTP
- \`PATCH /api/auth/change-phone-number\` — Initiates phone change
- \`PATCH /api/auth/verify-phone-number-change\` — Confirms with OTP
`;

      return {
        contents: [
          {
            uri: "rapidcapsule://auth-guide",
            mimeType: "text/markdown",
            text: authGuide,
          },
        ],
      };
    }
  );

  // Resource 3: Response format
  server.resource(
    "response-format",
    "rapidcapsule://response-format",
    {
      description: "Standard API response format, error handling, and pagination patterns",
      mimeType: "text/markdown",
    },
    async () => {
      const responseFormat = `# Rapid Capsule API Response Format

## Success Response
All successful responses are wrapped by the ResponseInterceptor:
\`\`\`json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
\`\`\`

The \`data\` field contains the actual response payload. The \`message\` defaults to "Success" but controllers can override it.

## Error Responses
NestJS exception filters return:
\`\`\`json
{
  "statusCode": 400,
  "message": "Validation failed" | "Specific error message",
  "error": "Bad Request"
}
\`\`\`

### Common Status Codes
| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (POST that creates a resource) |
| 400 | Bad Request (validation errors, malformed input) |
| 401 | Unauthorized (missing/invalid/expired JWT) |
| 403 | Forbidden (valid JWT but insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal Server Error |

## Validation Errors
Class-validator returns detailed field-level errors:
\`\`\`json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be at least 8 characters"],
  "error": "Bad Request"
}
\`\`\`

## Pagination Pattern
List endpoints typically accept:
- \`page\` (number, default 1)
- \`limit\` (number, default 20)
- \`sort\` (field name)
- \`order\` ("asc" | "desc")
- \`search\` (text search where supported)

Paginated responses include:
\`\`\`json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "result": [ ... ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
\`\`\`

## File Upload Pattern
For file uploads (profile images, prescriptions, documents):
1. Get a presigned S3 URL: \`GET /api/users/file/presigned-url?fileName=photo.jpg&fileType=image/jpeg\`
2. Upload file directly to S3: \`PUT <presigned_url>\` with file body
3. Reference the S3 key in subsequent API calls

## Multi-Currency
Monetary amounts include currency info. The API supports multiple currencies (NGN, USD, GBP, etc.). Use \`GET /api/users/detect-currency\` to auto-detect from IP.
`;

      return {
        contents: [
          {
            uri: "rapidcapsule://response-format",
            mimeType: "text/markdown",
            text: responseFormat,
          },
        ],
      };
    }
  );
}
