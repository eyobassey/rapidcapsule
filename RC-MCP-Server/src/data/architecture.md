# Rapid Capsule — Architecture Guide for Mobile Integration

## Overview
Rapid Capsule is a telemedicine platform connecting patients with medical specialists. The mobile app integrates with the Patient Backend API.

## Tech Stack
- **Backend**: NestJS (TypeScript) REST API + WebSocket
- **Database**: MongoDB with Mongoose ODM
- **Auth**: JWT Bearer tokens + OAuth (Google, Apple)
- **Payments**: Paystack (card payments, wallet funding, subscriptions)
- **Video**: Zoom SDK (appointment meetings)
- **File Storage**: AWS S3 (presigned URLs for uploads/downloads)
- **AI Services**: Infermedica (symptom checker), Claude AI (health summaries), OpenFDA (drug safety)
- **Notifications**: Brevo SMTP (email), Twilio (SMS), WebSocket (real-time)

## API Base URL
- **Production**: `https://api.rapidcapsule.com/api`
- **Local Development**: `http://localhost:5020/api`

## Standard Response Format
Every endpoint returns:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```
Error responses:
```json
{
  "statusCode": 400|401|403|404|500,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Authentication Flow

### Registration
1. `POST /api/users` — Create account (email, password, user_type)
2. User receives email verification OTP
3. `POST /api/auth/otp/verify` — Verify email OTP
4. `PATCH /api/users` — Complete profile setup (name, DOB, health info)

### Login
1. `POST /api/auth/login` — Returns JWT access token + refresh token
2. Include token in all subsequent requests: `Authorization: Bearer <token>`
3. Optional: `POST /api/auth/2fa/verify` — If 2FA is enabled

### OAuth
- `POST /api/auth/google/alt-login` — Google sign-in (send idToken)
- `POST /api/auth/apple` — Apple sign-in (send identityToken)

### Biometric Login (WebAuthn/FIDO2)
1. `POST /api/auth/biometric/register/options` — Get registration challenge
2. `POST /api/auth/biometric/register/verify` — Complete registration
3. `POST /api/auth/biometric/login/options` — Get auth challenge
4. `POST /api/auth/biometric/login/verify` — Complete biometric login

### Token Handling
- Access tokens are JWT, include in `Authorization: Bearer <token>` header
- Tokens expire (check for 401 responses to trigger refresh)
- Sessions can be managed via `/api/auth/sessions`

## User Types
| Type | Description | Key Features |
|------|-------------|--------------|
| Patient | Main app users | Book appointments, health checkups, pharmacy orders, vitals |
| Specialist | Healthcare providers | Manage appointments, write prescriptions, video consultations |
| Lifeguard | Emergency responders | Emergency response features |

## Core Feature Modules

### Health Checkup (AI Symptom Checker)
Uses Infermedica API for AI-powered symptom assessment. Flow:
1. Begin checkup → 2. Parse symptoms → 3. Answer interview questions → 4. Get diagnosis

### Appointments
Book specialist consultations with Zoom video integration. Supports:
- Finding available specialists by category/time
- Payment processing via Paystack or wallet
- Rescheduling and cancellation
- Post-appointment ratings and notes

### Pharmacy
Full e-pharmacy with drug catalog, OTC purchases, and prescription fulfillment:
- Drug search with category/manufacturer filters
- Drug interaction checking
- OTC and prescription order workflows
- Order tracking and delivery management
- Wallet and card payment options

### Prescriptions
Specialist-created prescriptions linked to pharmacy orders. Supports file uploads for external prescriptions.

### Vitals Monitoring
Track blood pressure, heart rate, temperature, blood sugar, BMI, oxygen saturation. Feeds into health score calculations.

### Wallet & Payments
Dual wallet system — patient wallet for purchases, specialist wallet for earnings. Paystack integration for card payments and bank withdrawals.

## File Uploads
Use presigned S3 URLs:
1. `GET /api/users/file/presigned-url?fileName=photo.jpg&fileType=image/jpeg`
2. Upload file directly to the returned S3 URL via PUT
3. Use the S3 key in subsequent API calls

## Pagination
Most list endpoints support:
- `?page=1&limit=20` — Page-based pagination
- `?sort=created_at&order=desc` — Sorting
- `?search=keyword` — Text search (where applicable)

## WebSocket Events
The backend uses Socket.IO for real-time features:
- Notification delivery
- Appointment status updates
- Chat/messaging (where applicable)
