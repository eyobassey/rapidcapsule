# Apple Sign-In Setup Guide for Rapid Capsule

## Current Error: "Invalid client id or web redirect url"

This error occurs because the Apple Developer Console needs to be configured with the correct Service ID and return URLs.

## Apple Developer Console Configuration Required

### 1. App ID Configuration
Go to [Apple Developer Console](https://developer.apple.com/) → **Certificates, Identifiers & Profiles** → **Identifiers**

**App ID:** `com.rapidcapsules.login`
- Enable **Sign In with Apple** capability

### 2. Service ID Configuration (CRITICAL)
Create or edit a **Service ID** (not App ID) for web authentication:

**Service ID:** `com.rapidcapsules.login` 
- **Description:** Rapid Capsule Web Sign-In
- Enable **Sign In with Apple**
- Click **Configure** next to "Sign In with Apple"

### 3. Domain and Return URL Configuration
In the Service ID configuration, add:

**Domains:**
```
rapidcapsule.com
```

**Return URLs:**
```
https://rapidcapsule.com/login
https://rapidcapsule.com/signup/patient  
https://rapidcapsule.com/signup/specialist
https://rapidcapsule.com/lifeguard/signup
```

### 4. Key Configuration
**Key ID:** `MJWJG28MU9`
- Enable **Sign In with Apple**
- Associate with App ID: `com.rapidcapsules.login`

### 5. Private Key File
Ensure the `.p8` private key file is uploaded to AWS S3:
- **File name:** `AuthKey_MJWJG28MU9.p8`
- **Bucket:** Your AWS bucket configured in ecosystem.config.js

## Environment Variables (Already Configured)
```
APPLE_CLIENT_ID: "com.rapidcapsules.login"
APPLE_TEAM_ID: "NS5XW2Q4P8" 
APPLE_KEY_ID: "MJWJG28MU9"
```

## Code Configuration (Already Fixed)
All frontend files now use:
- **Client ID:** `com.rapidcapsules.login`
- **Redirect URI:** Dynamic based on `window.location.origin`

## Important Notes
1. **Service ID vs App ID:** Web Sign-In requires a Service ID configuration, not just an App ID
2. **Exact Domain Match:** Apple requires exact domain matching (no www, no trailing slashes unless specified)
3. **Protocol:** Must use HTTPS for production
4. **Propagation Time:** Changes can take 15-30 minutes to take effect

## Testing
After configuring Apple Developer Console:
1. Wait 15-30 minutes for changes to propagate
2. Clear browser cache
3. Try Apple Sign-In again
4. Check browser console for detailed error messages

## Common Issues
- **Domain not verified:** Ensure `rapidcapsule.com` is added to domains list
- **Return URL mismatch:** Add the exact URL shown in browser during sign-in attempt
- **Service ID vs App ID confusion:** Web authentication requires Service ID configuration

Last Updated: September 2025