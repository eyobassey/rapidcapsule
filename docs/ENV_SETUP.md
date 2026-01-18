# Environment Setup Guide

## Patient Backend (.env) - RC-Backend

```bash
# Database
MONGO_URL=mongodb://127.0.0.1:27017/rapid_capsule

# Server
PORT=5020
NODE_ENV=production
BASE_URL=http://localhost:5020

# JWT
JWTKEY=your_secret_key
TOKEN_EXPIRATION=24h

# External APIs
INFERMEDICA_APP_ID=your_app_id
INFERMEDICA_API_KEY=your_api_key
ZOOM_API_KEY=your_zoom_key
ZOOM_API_SECRET_KEY=your_zoom_secret

# Payment (Paystack)
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Communications
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token

# File Storage (AWS S3)
AWS_ACCESS_KEY=your_aws_key
AWS_ACCESS_SECRET_KEY=your_aws_secret
AWS_BUCKET_NAME=your_bucket_name

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
APPLE_CLIENT_ID=com.rapidcapsules.login
APPLE_TEAM_ID=your_apple_team_id
```

---

## Admin Backend (.env) - RC_Admin_Backend

```bash
# Database (Shared with patient backend)
MONGO_URL=mongodb://127.0.0.1:27017/rapid_capsule

# Server
PORT=5021
NODE_ENV=production
BASE_URL=http://localhost:5021

# JWT (Shared authentication)
JWTKEY=your_secret_key
TOKEN_EXPIRATION=24h

# Admin-specific configurations
ADMIN_SESSION_TIMEOUT=8h
ADMIN_PASSWORD_POLICY=strict
```

---

## Patient Frontend (.env) - RC

```bash
VUE_APP_API_GATEWAY=http://localhost:5020
VUE_APP_GOOGLE_KEY=your_google_web_client_id
VUE_APP_SOCKET_URL=wss://rapidcapsule.com
VUE_APP_CLOUDINARY_URL=https://api.cloudinary.com/v1_1
VUE_APP_CLOUDINARY_PRESET=rapidCapsule
```

---

## Admin Frontend (.env) - RC_Admin_UI

```bash
VITE_API_BASE_URL=http://localhost:5021
VITE_APP_TITLE=Rapid Capsule Admin
VITE_APP_DESCRIPTION=Administrative Dashboard for Rapid Capsule Healthcare Platform
```

---

## PM2 Configuration (ecosystem.config.js)

```javascript
module.exports = {
  apps: [
    {
      name: 'RC-Frontend',
      script: 'serve',
      args: '-s dist -l 3000',
      cwd: './RC',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'RC-Backend',
      script: 'dist/main.js',
      cwd: './RC-Backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production', PORT: 5020 }
    },
    {
      name: 'RC-Admin-Frontend',
      script: 'serve',
      args: '-s dist -l 8080',
      cwd: './RC_Admin_UI',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production' }
    },
    {
      name: 'RC-Backend-Admin',
      script: 'dist/main.js',
      cwd: './RC_Admin_Backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: { NODE_ENV: 'production', PORT: 5021 }
    }
  ]
}
```

---

## Technology Stack Reference

### Patient Frontend (Vue.js)
| Package | Version | Purpose |
|---------|---------|---------|
| Vue.js | 3.2.47 | Framework |
| Vue Router | 4.0.3 | Routing |
| Vuex | 4.1.0 | State management |
| Axios | 1.2.1 | HTTP client |
| ApexCharts | 3.37.2 | Data visualization |
| Chart.js | 4.3.0 | Charts |
| Vee-Validate | 4.10.6 | Validation |
| Socket.io Client | 4.6.1 | Real-time |
| Vue Paystack | 2.0.4 | Payments |

### Admin Frontend (Vue.js + Vuetify)
| Package | Version | Purpose |
|---------|---------|---------|
| Vue.js | 3.3.4 | Framework |
| Vue Router | 4.2.4 | Routing |
| Pinia | 2.1.6 | State management |
| Vuetify | 3.3.15 | UI framework |
| Axios | 1.4.0 | HTTP client |
| Vite | 4.1.4 | Build tool |
| ApexCharts | 3.41.1 | Charts |

### Backend (NestJS)
| Package | Version | Purpose |
|---------|---------|---------|
| NestJS | 9.0.0 | Framework |
| TypeScript | 4.7.4 | Language |
| Mongoose | 6.8.1 | MongoDB ODM |
| Passport JWT | 4.0.1 | Authentication |
| Class Validator | 0.14.0 | Validation |
| Bcrypt | 5.1.0 | Password hashing |
| Helmet | 6.0.1 | Security headers |
| AWS SDK | 2.1290.0 | File storage |
| Nodemailer | 6.8.0 | Email |
| Socket.io | 9.3.12 | Real-time |

### Infrastructure
| Component | Details |
|-----------|---------|
| Process Manager | PM2 (4 services) |
| Web Server | Nginx (reverse proxy) |
| SSL | Cloudflare |
| Node Version | 16+ |
| Package Manager | Yarn |
| Database | MongoDB |
