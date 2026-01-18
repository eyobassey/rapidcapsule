import { google, calendar_v3 } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';

export type CreateCalendarEventType = {
  summary: string;
  description?: string;
  start_time: Date;
  end_time: Date;
  attendees: Array<{ email: string; displayName?: string }>;
  conferenceData?: boolean;
  calendarId?: string; // Allow specifying which calendar to use
};

export class GoogleCalendar {
  private calendar: calendar_v3.Calendar;
  private authType: 'service_account' | 'oauth';
  private oauth2Client?: any;

  constructor() {
    // Try service account first (recommended for production)
    const serviceAccountPath = path.join(
      process.cwd(),
      'config',
      'google-service-account.json',
    );

    if (fs.existsSync(serviceAccountPath)) {
      // Use service account authentication
      const auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events',
        ],
      });

      this.calendar = google.calendar({ version: 'v3', auth });
      this.authType = 'service_account';
      console.log('Google Calendar initialized with Service Account authentication');
    } else {
      // Fallback to OAuth (for development)
      const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
      const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';

      if (!clientId || !clientSecret) {
        throw new Error('Google Calendar credentials not configured');
      }

      this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

      // Set refresh token if available
      const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
      if (refreshToken) {
        this.oauth2Client.setCredentials({
          refresh_token: refreshToken,
        });
      }

      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      this.authType = 'oauth';
      console.log('Google Calendar initialized with OAuth authentication');
    }
  }

  /**
   * Create a calendar event with optional Google Meet conference
   */
  async createEvent({
    summary,
    description,
    start_time,
    end_time,
    attendees,
    conferenceData = true,
    calendarId = 'primary',
  }: CreateCalendarEventType) {
    try {
      const event = {
        summary,
        description,
        start: {
          dateTime: start_time.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: end_time.toISOString(),
          timeZone: 'UTC',
        },
        attendees: attendees.map((attendee) => ({
          email: attendee.email,
          displayName: attendee.displayName,
        })),
        conferenceData: conferenceData
          ? {
              createRequest: {
                requestId: `meet-${Date.now()}`,
                conferenceSolutionKey: {
                  type: 'hangoutsMeet',
                },
              },
            }
          : undefined,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
        guestsCanModify: false,
        guestsCanInviteOthers: false,
        sendUpdates: 'all', // Send email invitations to all attendees
      };

      const response = await this.calendar.events.insert({
        calendarId,
        conferenceDataVersion: conferenceData ? 1 : 0,
        sendUpdates: 'all',
        requestBody: event,
      });

      return {
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
        meetingUrl: response.data.conferenceData?.entryPoints?.find(
          (entry) => entry.entryPointType === 'video',
        )?.uri,
        hangoutLink: response.data.hangoutLink,
      };
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error.message);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    eventId: string,
    updates: Partial<CreateCalendarEventType>,
    calendarId: string = 'primary',
  ) {
    try {
      const event: any = {};

      if (updates.summary) event.summary = updates.summary;
      if (updates.description) event.description = updates.description;
      if (updates.start_time) {
        event.start = {
          dateTime: updates.start_time.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (updates.end_time) {
        event.end = {
          dateTime: updates.end_time.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (updates.attendees) {
        event.attendees = updates.attendees.map((attendee) => ({
          email: attendee.email,
          displayName: attendee.displayName,
        }));
      }

      const response = await this.calendar.events.patch({
        calendarId,
        eventId,
        sendUpdates: 'all',
        requestBody: event,
      });

      return {
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
        meetingUrl: response.data.conferenceData?.entryPoints?.find(
          (entry) => entry.entryPointType === 'video',
        )?.uri,
      };
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error.message);
      throw error;
    }
  }

  /**
   * Cancel/delete a calendar event
   */
  async cancelEvent(eventId: string, calendarId: string = 'primary') {
    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: 'all',
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to cancel Google Calendar event:', error.message);
      throw error;
    }
  }

  /**
   * Get event details
   */
  async getEvent(eventId: string, calendarId: string = 'primary') {
    try {
      const response = await this.calendar.events.get({
        calendarId,
        eventId,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get Google Calendar event:', error.message);
      throw error;
    }
  }

  /**
   * Get the service account email (for sharing calendar)
   */
  getServiceAccountEmail(): string | null {
    if (this.authType === 'service_account') {
      const serviceAccountPath = path.join(
        process.cwd(),
        'config',
        'google-service-account.json',
      );
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
      return serviceAccount.client_email;
    }
    return null;
  }

  /**
   * Generate authorization URL for user consent
   * Use this to get initial refresh token
   */
  getAuthUrl() {
    if (!this.oauth2Client) {
      throw new Error('OAuth not configured - using service account');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens
   * Use this once to get the refresh token
   */
  async getTokenFromCode(code: string) {
    if (!this.oauth2Client) {
      throw new Error('OAuth not configured - using service account');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }
}
