# WhatsApp Integration Module

This module provides WhatsApp Business API integration via Twilio for the Rapid Capsule platform, enabling prescription uploads, account linking, and pharmacist communication.

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886  # Your Twilio WhatsApp number

# Optional: Enable test mode (bypasses signature validation)
TWILIO_TEST_MODE=true
```

### 2. Twilio Webhook Configuration

In your Twilio Console:

1. Go to **Messaging > Try it out > Send a WhatsApp message**
2. Configure your Sandbox settings (or production number)
3. Set the webhook URL for incoming messages:
   ```
   https://api.rapidcapsule.com/webhooks/whatsapp/twilio
   ```
4. Set the status callback URL:
   ```
   https://api.rapidcapsule.com/webhooks/whatsapp/twilio/status
   ```
5. Ensure HTTP POST method is selected

### 3. For Local Development

Use ngrok or similar to expose your local server:

```bash
ngrok http 5020
```

Then update Twilio webhooks to use the ngrok URL:
```
https://abc123.ngrok.io/webhooks/whatsapp/twilio
```

## API Endpoints

### Production Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhooks/whatsapp/twilio` | Main webhook for incoming WhatsApp messages |
| POST | `/webhooks/whatsapp/twilio/status` | Status callback for message delivery |

### Test Endpoints (Non-Production Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/webhooks/whatsapp/test` | Simulate WhatsApp messages |
| POST | `/webhooks/whatsapp/test/session` | Get current session state |
| POST | `/webhooks/whatsapp/test/reset` | Reset session to IDLE |

## Testing Locally

### 1. Send a Test Message

```bash
curl -X POST http://localhost:5020/webhooks/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+2341234567890",
    "body": "hi"
  }'
```

Response:
```json
{
  "success": true,
  "testMode": true,
  "input": {
    "from": "+2341234567890",
    "body": "hi",
    "type": "text"
  },
  "session": {
    "id": "...",
    "flow": "IDLE",
    "step": 0
  },
  "identity": {
    "id": "...",
    "verified": false,
    "patientId": null
  },
  "response": "Welcome to Rapid Capsule Pharmacy!..."
}
```

### 2. Check Session State

```bash
curl -X POST http://localhost:5020/webhooks/whatsapp/test/session \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+2341234567890"
  }'
```

### 3. Reset Session

```bash
curl -X POST http://localhost:5020/webhooks/whatsapp/test/reset \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+2341234567890"
  }'
```

### 4. Test Prescription Upload (with image)

```bash
curl -X POST http://localhost:5020/webhooks/whatsapp/test \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+2341234567890",
    "body": "1",
    "imageUrl": "https://example.com/prescription.jpg"
  }'
```

## User Flows

### 1. Account Verification Flow

```
User: hi
Bot: Welcome to Rapid Capsule Pharmacy!
     Do you have an existing Rapid Capsule account?
     1. Yes, Link Account
     2. No, Create Account

User: 1
Bot: Please enter your registered email or phone number:

User: user@example.com
Bot: I've sent a 6-digit verification code to your email. Please enter it here.

User: 123456
Bot: Account linked successfully! Hello John, your WhatsApp is now connected.
     [Main Menu]
```

### 2. Prescription Upload Flow

```
User: 1 (from menu)
Bot: Please send a clear photo of your prescription.
     Tips for best results:
     - Good lighting
     - Straight angle
     - Full prescription visible

User: [sends image]
Bot: Prescription received!
     I'm analyzing your prescription now. This usually takes 1-2 minutes.
     I'll notify you when it's ready.
```

### 3. Global Commands

These commands work in any state:

| Command | Action |
|---------|--------|
| `menu` / `hi` / `hello` / `start` | Show main menu |
| `help` | Show help information |
| `cancel` | Cancel current action |
| `human` / `pharmacist` | Request pharmacist assistance |
| `stop` | Opt out of messages |

## Architecture

```
src/modules/whatsapp/
├── constants/
│   ├── messages.constant.ts    # All message templates
│   ├── rate-limits.constant.ts # Rate limiting config
│   ├── session.constant.ts     # Session timeouts
│   └── sla.constant.ts         # SLA configurations
├── controllers/
│   └── whatsapp-webhook.controller.ts
├── dto/
│   └── twilio-webhook.dto.ts
├── entities/
│   ├── whatsapp-identity.entity.ts      # Phone-patient binding
│   ├── whatsapp-session.entity.ts       # Conversation state
│   ├── whatsapp-audit-log.entity.ts     # Message logging
│   ├── whatsapp-rate-limit.entity.ts    # Rate limiting
│   └── whatsapp-prescription-queue.entity.ts  # Pharmacist queue
├── handlers/
│   ├── base-flow.handler.ts             # Base handler class
│   ├── verification-flow.handler.ts     # Account verification
│   └── prescription-flow.handler.ts     # Prescription upload
├── services/
│   ├── whatsapp-identity.service.ts     # Identity management
│   ├── whatsapp-session.service.ts      # Session management
│   ├── whatsapp-rate-limiter.service.ts # Rate limiting
│   ├── whatsapp-audit.service.ts        # Audit logging
│   ├── whatsapp-twilio.service.ts       # Twilio integration
│   └── whatsapp-flow.service.ts         # Message routing
└── whatsapp.module.ts
```

## Flow Types

| Flow Type | Description |
|-----------|-------------|
| `IDLE` | Default state, showing main menu |
| `VERIFICATION` | Initial account verification |
| `ACCOUNT_LINK` | Linking WhatsApp to existing account |
| `PRESCRIPTION_UPLOAD` | Uploading and processing prescription |
| `ORDER_CREATION` | Creating order from prescription (coming soon) |
| `PHARMACIST_CHAT` | Handoff to human pharmacist |

## Security Features

- **Webhook Signature Validation**: Verifies Twilio webhook signatures in production
- **Rate Limiting**: Prevents abuse with configurable limits per action type
- **OTP Verification**: 6-digit codes with attempt limits and expiry
- **PII Redaction**: Sensitive data is redacted in audit logs
- **Session Timeouts**: Automatic session expiry for security

## Database Collections

- `whatsapp_identities` - Phone number to patient mappings
- `whatsapp_sessions` - Active conversation sessions (TTL indexed)
- `whatsapp_audit_logs` - Message and event logs
- `whatsapp_rate_limits` - Rate limiting counters (TTL indexed)
- `whatsapp_prescription_queues` - Pharmacist review queue

## Troubleshooting

### Messages not being received

1. Check Twilio webhook URL is correct
2. Verify webhook is accessible (not blocked by firewall)
3. Check Twilio console for error logs
4. Ensure signature validation is passing (or disabled in test mode)

### Session not persisting

1. Check MongoDB connection
2. Verify session TTL hasn't expired (30 min idle, 4 hr max)
3. Check for any errors in session service logs

### Rate limiting issues

1. Check rate limit counters in database
2. Verify limits in `rate-limits.constant.ts`
3. Wait for TTL expiry or manually clear limits
