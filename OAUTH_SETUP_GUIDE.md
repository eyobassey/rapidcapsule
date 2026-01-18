# OAuth Setup Guide for Rapid Capsule

## Google OAuth Configuration

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 Client ID (should match: `1011516150558-2k8jte2tjojl7k5oi6fmfpsl0j3r57cl.apps.googleusercontent.com`)

### Configure Authorized JavaScript Origins

Add ALL of the following origins:
```
https://rapidcapsule.com
https://www.rapidcapsule.com
http://localhost:3000
http://localhost:8080
http://localhost:5020
http://127.0.0.1:3000
http://127.0.0.1:8080
http://127.0.0.1:5020
```

### Configure Authorized Redirect URIs

Add ALL of the following redirect URIs:
```
https://rapidcapsule.com
https://rapidcapsule.com/login
https://rapidcapsule.com/signup/patient
https://rapidcapsule.com/signup/specialist
https://www.rapidcapsule.com
https://www.rapidcapsule.com/login
https://www.rapidcapsule.com/signup/patient
https://www.rapidcapsule.com/signup/specialist
http://localhost:3000
http://localhost:3000/login
http://localhost:3000/signup/patient
http://localhost:3000/signup/specialist
http://localhost:8080
http://localhost:8080/login
http://localhost:8080/signup/patient
http://localhost:8080/signup/specialist
```

### Important Notes:
- The `vue3-google-login` library uses the Google Identity Services SDK
- It requires EXACT matches for origins and redirect URIs
- Both HTTP and HTTPS versions should be added if you use both
- Include www and non-www versions for production

---

## Apple Sign-In Configuration

### Apple Developer Console Setup

1. Go to [Apple Developer](https://developer.apple.com/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Select **Identifiers** > **App IDs**
4. Find or create `com.rapidcapsules.login`

### Configure Services

1. Enable **Sign In with Apple** capability
2. Configure your app:
   - **Primary App ID**: `com.rapidcapsules.login`
   - **Team ID**: `NS5XW2Q4P8`

### Configure Web Authentication

1. Go to **Certificates, Identifiers & Profiles** > **Keys**
2. Create or update key with **Key ID**: `MJWJG28MU9`
3. Enable **Sign in with Apple**
4. Configure domains and redirect URLs:

**Domains**:
```
rapidcapsule.com
www.rapidcapsule.com
```

**Return URLs**:
```
https://rapidcapsule.com/login
https://rapidcapsule.com/signup/patient
https://rapidcapsule.com/signup/specialist
https://www.rapidcapsule.com/login
https://www.rapidcapsule.com/signup/patient
https://www.rapidcapsule.com/signup/specialist
```

### Download Private Key

1. Download the `.p8` private key file
2. Upload it to AWS S3 bucket with name: `AuthKey_MJWJG28MU9.p8`
3. Ensure the backend can access it from S3

---

## Environment Variables (Already Configured)

### Backend (ecosystem.config.js)
```javascript
GOOGLE_CLIENT_ID: "1011516150558-2k8jte2tjojl7k5oi6fmfpsl0j3r57cl.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET: "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"
APPLE_CLIENT_ID: "com.rapidcapsules.login"
APPLE_TEAM_ID: "NS5XW2Q4P8"
APPLE_KEY_ID: "MJWJG28MU9"
```

### Frontend (ecosystem.config.js)
```javascript
VUE_APP_GOOGLE_KEY: "1011516150558-2k8jte2tjojl7k5oi6fmfpsl0j3r57cl.apps.googleusercontent.com"
```

---

## Testing OAuth

### Local Development
1. Access the app at `http://localhost:3000` or `http://localhost:8080`
2. Try signing in with Google/Apple
3. Check browser console for errors

### Production
1. Access the app at `https://rapidcapsule.com`
2. Try signing in with Google/Apple
3. Monitor server logs: `pm2 logs RC-Backend`

---

## Common Issues and Solutions

### Google OAuth Errors

**Error: redirect_uri_mismatch**
- Solution: Add the exact URL shown in the error message to Google Cloud Console

**Error: Invalid client**
- Solution: Verify the Client ID matches in both frontend and backend

### Apple Sign-In Errors

**Error: Invalid request**
- Solution: Verify the Client ID is exactly `com.rapidcapsules.login`

**Error: Invalid grant**
- Solution: Check that the private key is correctly uploaded to S3

---

## Verification Steps

1. **Check current configuration:**
   ```bash
   grep "GOOGLE_CLIENT_ID\|APPLE_CLIENT_ID" /home/username/development/ecosystem.config.js
   ```

2. **Restart services after changes:**
   ```bash
   pm2 restart all
   ```

3. **Monitor logs:**
   ```bash
   pm2 logs RC-Backend --lines 100
   ```

4. **Test endpoints:**
   ```bash
   curl -X POST https://rapidcapsule.com/api/auth/google/alt-login \
     -H "Content-Type: application/json" \
     -d '{"token": "test_token", "user_type": "Patient"}'
   ```

---

Last Updated: September 2025