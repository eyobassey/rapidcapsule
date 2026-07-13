# AGENTS.md

Project overview and standard commands live in `README.md`, `CLAUDE.md`, and `docs/ENV_SETUP.md`. This file adds cloud-agent-specific setup/run guidance.

## Cursor Cloud specific instructions

Rapid Capsule is a telemedicine monorepo with four runnable services plus a shared MongoDB. The `RC-MCP-Server` directory is developer tooling and is not part of the product.

### Services (dev mode)

| Service | Dir | Dev command | Port | Notes |
|---------|-----|-------------|------|-------|
| Patient backend | `RC-Backend` | `yarn start:dev` | 5020 | NestJS, global prefix `/api`, Swagger at `/api/docs` |
| Admin backend | `RC_Admin_Backend` | `yarn start:dev` | 5021 | NestJS, global prefix `/api`, Swagger at `/api/docs` |
| Patient frontend | `RC` | `yarn serve` | 8080 (dev) | Vue CLI; talks to 5020 via absolute `VUE_APP_API_GATEWAY` |
| Admin frontend | `RC_Admin_UI` | `yarn dev` | 5173 (dev) | Vite, base `/admin/`, listens on IPv6 `[::1]:5173` |

Package manager is **yarn** for all four (some dirs also contain a stray `package-lock.json`; ignore it). The dependency-refresh update script already runs `yarn install` in each service on VM startup.

### Required background services (NOT started by the update script — start them each session)

These are installed in the VM image but must be started manually; the update script intentionally does not start services.

1. **MongoDB** — a single-node **replica set** is required (Mongoose transactions are used in accounting migrations). No systemd in this VM, so run `mongod` directly:
   ```
   mongod --dbpath /var/lib/mongodb --logpath /var/log/mongodb/mongod.log --bind_ip 127.0.0.1 --port 27017 --replSet rs0
   ```
   First time only, initiate the set: `mongosh --quiet --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:27017'}]})"`. DB name is `rapid_capsule`.

2. **Local SMTP sink on 127.0.0.1:587** — the backends send email on registration, login OTP, and password reset. The mailer hardcodes port 587 and the caller does not catch send failures, so **a failed email send crashes the patient backend** (unhandled promise rejection). Run a throwaway sink so these flows succeed:
   ```
   sudo python3 -m aiosmtpd -n -l 127.0.0.1:587
   ```
   `SMTP_HOST=127.0.0.1` / `SMTP_PORT=587` are set in the backend `.env` files.

3. **nginx reverse proxy (only needed to use the Admin UI in a browser)** — the Admin UI calls the backend with relative paths like `/admin-api/...` (and patient `/api/...`), which are served by nginx in production; there is no Vite dev proxy. A config is provided at `/etc/nginx/conf.d/rapidcapsule.conf` that maps `/admin-api/* → 5021/api/*`, `/api/* → 5020/api/*`, and everything else → the Vite dev server. Start with `sudo nginx` (reload with `sudo nginx -s reload`) and open `http://localhost:8081/admin/`. Because of this, `RC_Admin_UI/.env` sets `VITE_API_BASE_URL=/admin-api` (relative), NOT `http://localhost:5021` as in `docs/ENV_SETUP.md` — the absolute value omits the `/api` prefix and breaks store requests. The patient frontend (`RC`) does not need nginx (it uses an absolute API URL).

### Environment files

`.env` files are gitignored and created during setup. Minimum working values: backends need `MONGO_URL` (include `?replicaSet=rs0&directConnection=true`), `PORT`, `JWTKEY`, `TOKEN_EXPIRATION`; `RC` needs `VUE_APP_API_GATEWAY=http://localhost:5020`; `RC_Admin_UI` needs `VITE_API_BASE_URL=/admin-api`. Both backends have **no default PORT** — it must be set.

### Auth flow gotchas (patient backend)

- `POST /api/users` registers a patient. `POST /api/auth/login` **requires `user_type` in the body** (e.g. `"Patient"`), otherwise it returns "No user found".
- New accounts have **email 2FA on by default**: login returns "OTP has been sent", and you must call `POST /api/auth/otp/verify` with the 6-digit code to receive the JWT. In this VM email is sinked, so read the code from Mongo: `db.tokens.find({type:'OTP'}).sort({_id:-1}).limit(1)`.
- Login also requires a verified email; for a test account set it directly: `db.users.updateOne({'profile.contact.email':'<email>'},{$set:{is_email_verified:true}})`.
- Admin users live in the `admins` collection; create via admin backend `POST /api/users` (roles: `Admin` / `Super Admin`), then `POST /api/auth/login`.

### Known pre-existing issues (not environment problems)

- The patient frontend (`RC`) dev server starts but **fails to compile** two committed modules: `src/views/Website/EkaChat.vue` (template syntax error) and `src/views/Mainapp/patient-dashboard.vue` (references a missing image asset). Both are statically imported by the router, so the patient SPA does not render. These are app bugs, not setup issues.
- All four services have pre-existing `yarn lint` errors; the lint tooling itself works. Note the backend `lint` scripts run `eslint --fix`, which rewrites source files — revert with `git checkout` if you only meant to check.
