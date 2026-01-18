import { get, patch, post, put } from '../axios';
import axios from 'axios';

export type CreateMeetingType = {
  topic: string;
  start_time: Date;
  duration?: string;
};

export enum MeetingStatus {
  END = 'end',
  RECOVER = 'recover',
}

export class Zoom {
  private baseUrl = 'https://api.zoom.us/v2/';
  private readonly accountId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.accountId = <string>process.env.ZOOM_ACCOUNT_ID;
    this.clientId = <string>process.env.ZOOM_CLIENT_ID;
    this.clientSecret = <string>process.env.ZOOM_CLIENT_SECRET;

    console.log('[Zoom] Using Server-to-Server OAuth credentials:', {
      accountId: this.accountId ? `${this.accountId.substring(0, 4)}...` : 'MISSING',
      clientId: this.clientId ? `${this.clientId.substring(0, 4)}...` : 'MISSING',
      clientSecret: this.clientSecret ? `${this.clientSecret.substring(0, 4)}...` : 'MISSING'
    });
  }

  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      console.log('[Zoom] Using cached access token');
      return this.accessToken;
    }

    // Get new access token using Server-to-Server OAuth
    const authUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.accountId}`;
    const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    console.log('[Zoom] Requesting new access token');

    try {
      const response = await axios.post(authUrl, null, {
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + ((response.data.expires_in - 300) * 1000);

      console.log('[Zoom] Access token obtained successfully');
      return this.accessToken as string;
    } catch (error) {
      console.error('[Zoom] Failed to get access token:', error.response?.data || error.message);
      throw new Error(`Zoom authentication failed: ${error.response?.data?.reason || error.message}`);
    }
  }

  private async getHeaders() {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    };
  }

  async createMeeting({ topic, start_time, duration }: CreateMeetingType) {
    const url = `${this.baseUrl}users/me/meetings`;
    const settings = this.settings({ topic, start_time, duration });
    const headers = await this.getHeaders();
    return await post(url, { ...settings }, { headers });
  }

  async cancelMeeting(meetingId: string, meetingStatus: MeetingStatus) {
    const url = `${this.baseUrl}meetings/${meetingId}/status`;
    const body = { action: meetingStatus };
    const headers = await this.getHeaders();
    return await put(url, { ...body }, { headers });
  }

  async rescheduleMeeting({ meetingId, topic, start_time, duration }) {
    const url = `${this.baseUrl}meetings/${meetingId}`;
    const settings = this.settings({ topic, start_time, duration });
    const headers = await this.getHeaders();
    return await patch(url, { ...settings }, { headers });
  }

  async getPastMeetingDetails(meetingId: string) {
    const url = `${this.baseUrl}past_meetings/${meetingId}`;
    const headers = await this.getHeaders();
    return await get(url, { headers });
  }

  // Clinical Notes API
  async listClinicalNotes(meetingId: string, pageSize: number = 30, nextPageToken?: string) {
    let url = `${this.baseUrl}clinical_notes/notes?meeting_id=${meetingId}&page_size=${pageSize}`;
    if (nextPageToken) {
      url += `&next_page_token=${nextPageToken}`;
    }
    const headers = await this.getHeaders();
    return await get(url, { headers });
  }

  async getClinicalNote(noteId: string) {
    const url = `${this.baseUrl}clinical_notes/notes/${noteId}`;
    const headers = await this.getHeaders();
    return await get(url, { headers });
  }

  async updateClinicalNote(noteId: string, completed: boolean) {
    const url = `${this.baseUrl}clinical_notes/notes/${noteId}`;
    const headers = await this.getHeaders();
    return await patch(url, { completed }, { headers });
  }

  private settings({ topic, start_time, duration = '5' }) {
    return {
      topic,
      type: 2,
      start_time,
      duration,
      agenda: 'Scheduled Appointment',
      settings: {
        // alternative_hosts,
        host_video: 'true',
        participant_video: 'true',
        join_before_host: 'true',
        mute_upon_entry: 'false',
        auto_recording: 'cloud',
      },
    };
  }
}
