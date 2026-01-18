# Google Calendar API Setup Guide

This guide walks you through setting up Google Calendar API integration for Rapid Capsule appointments with Google Meet links.

## ✅ SERVICE ACCOUNT SETUP (PRODUCTION - RECOMMENDED)

Service accounts are designed for server-to-server authentication and are ideal for production environments.

### Prerequisites
- Google account with admin access
- Access to Google Cloud Console
- Service account JSON file (already configured at `config/google-service-account.json`)

### Critical Step: Share Your Calendar

**You MUST share your Google Calendar with the service account email:**

1. Open [Google Calendar](https://calendar.google.com)
2. On the left sidebar, find your calendar under "My calendars"
3. Click the three dots next to your calendar name > **Settings and sharing**
4. Scroll to "Share with specific people"
5. Click **Add people**
6. Enter: `rapid-capsule-calendar-service@rapidcapsule-469818.iam.gserviceaccount.com`
7. Set permission: **Make changes to events**
8. Click **Send**

**That's it!** The backend is already configured to use the service account automatically.

### Alternative: Use a Dedicated Calendar

Instead of your primary calendar, you can create a dedicated calendar for appointments:

1. In Google Calendar, click the **+** next to "Other calendars"
2. Select **Create new calendar**
3. Name: **Rapid Capsule Appointments**
4. Click **Create calendar**
5. Share this calendar with the service account (steps above)
6. Copy the **Calendar ID** from calendar settings
7. Update the code to use this calendar ID instead of 'primary'

---

## OAuth Setup (Development/Testing Only)

## Prerequisites
- Google account with admin access
- Access to Google Cloud Console

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID

## Step 2: Enable Google Calendar API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on it and press **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External** (or Internal if using Google Workspace)
   - App name: **Rapid Capsule**
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add the following scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Save and continue

4. Back to **Create OAuth client ID**:
   - Application type: **Web application**
   - Name: **Rapid Capsule Backend**
   - Authorized redirect URIs: Add `http://localhost:5020/api/auth/google/callback` (or your production URL)
   - Click **Create**

5. Download the credentials JSON or copy:
   - **Client ID**
   - **Client Secret**

## Step 4: Get Refresh Token

You need to generate a refresh token once. Run this helper script in your backend:

```bash
cd /home/username/development/RC-Backend
node scripts/get-google-refresh-token.js
```

Or manually:

1. Create a temporary script `scripts/get-google-refresh-token.js`:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
  prompt: 'consent',
});

console.log('Authorize this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Your refresh token:', tokens.refresh_token);
    console.log('\nAdd this to your .env file:');
    console.log(`GOOGLE_CALENDAR_REFRESH_TOKEN=${tokens.refresh_token}`);
  } catch (error) {
    console.error('Error getting tokens:', error);
  }
});
```

2. Run the script:
```bash
node scripts/get-google-refresh-token.js
```

3. Visit the URL shown, authorize the app
4. Copy the authorization code and paste it back
5. Save the refresh token provided

## Step 5: Update Environment Variables

Add these to your `.env` file:

```bash
# Google Calendar API Configuration
GOOGLE_CALENDAR_CLIENT_ID=your_client_id_here
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALENDAR_REFRESH_TOKEN=your_refresh_token_here
GOOGLE_CALENDAR_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob
```

## Step 6: Test the Integration

1. Restart your backend:
```bash
pm2 restart RC-Backend
```

2. Try creating a Google Meet appointment from the frontend
3. Check the logs for successful calendar event creation:
```bash
pm2 logs RC-Backend --lines 50
```

## Important Notes

### Google Meet Conference Creation
- Your Google account must have Google Workspace (formerly G Suite) to create Google Meet conferences
- Free Gmail accounts can create calendar events but not Google Meet links
- If you're using a free Gmail account, calendar invites will be sent but without Google Meet links

### Scopes Required
- `https://www.googleapis.com/auth/calendar` - Full calendar access
- `https://www.googleapis.com/auth/calendar.events` - Create/edit events

### Security Best Practices
1. Never commit `.env` file with credentials
2. Use environment-specific credentials (dev/staging/production)
3. Regularly rotate your OAuth credentials
4. Monitor API usage in Google Cloud Console
5. Set up quota alerts to prevent unexpected charges

### Troubleshooting

**"Invalid grant" error:**
- Your refresh token may have expired
- Regenerate the refresh token using the script above

**"Insufficient permissions" error:**
- Ensure you've added both required scopes
- Regenerate the refresh token with correct scopes

**"Calendar event created but no Google Meet link":**
- Check that you're using a Google Workspace account (not free Gmail)
- Ensure the account has Google Meet enabled

**"Failed to create Google Calendar event":**
- Check your API quota in Google Cloud Console
- Verify credentials are correct in `.env`
- Check backend logs for detailed error messages

## API Quota Limits

Google Calendar API has the following quotas (as of 2025):
- **Queries per day**: 1,000,000
- **Queries per 100 seconds per user**: 5,000
- **Queries per 100 seconds**: 50,000

For production use with high traffic, you may need to request quota increases from Google.

## Alternative: Service Account Approach

For production environments, consider using a Service Account instead of OAuth:

1. Create a Service Account in Google Cloud Console
2. Enable domain-wide delegation
3. Share a dedicated calendar with the service account
4. Update the code to use service account credentials

This approach doesn't require refresh tokens and is more suitable for server-to-server authentication.

---

**Last Updated**: October 25, 2025
**Version**: 1.0.0
