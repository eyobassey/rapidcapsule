import { get, patch, post, put } from '../axios';
import axios from 'axios';
import * as crypto from 'crypto';

export type CreateMeetingType = {
  topic: string;
  start_time: Date;
  duration?: string;
  alternative_hosts?: string; // Comma-separated email addresses
};

export type ZoomParticipant = {
  id: string;
  user_id: string;
  name: string;
  user_email: string;
  join_time: string;
  leave_time: string;
  duration: number;
  registrant_id?: string;
  failover?: boolean;
  status?: string;
};

export type ZoomRecording = {
  id: string;
  meeting_id: string;
  recording_start: string;
  recording_end: string;
  file_type: string;
  file_extension: string;
  file_size: number;
  play_url: string;
  download_url: string;
  status: string;
  recording_type: string;
};

export type ZoomRecordingsResponse = {
  uuid: string;
  id: number;
  host_id: string;
  host_email: string;
  topic: string;
  start_time: string;
  duration: number;
  total_size: number;
  recording_count: number;
  share_url: string;
  password: string;
  recording_files: ZoomRecording[];
};

export type ZoomTranscript = {
  recording_id: string;
  recording_start: string;
  recording_end: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  file_extension: string;
  download_url: string;
  status: string;
  transcript_content?: string;
};

export type ZoomMeetingNote = {
  note_id: string;
  meeting_id: string;
  content: string;
  created_at: string;
  updated_at: string;
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

  async createMeeting({ topic, start_time, duration, alternative_hosts }: CreateMeetingType) {
    const url = `${this.baseUrl}users/me/meetings`;
    const headers = await this.getHeaders();

    // First try with alternative hosts if provided
    if (alternative_hosts) {
      try {
        const settings = this.settings({ topic, start_time, duration, alternative_hosts });
        return await post(url, { ...settings }, { headers });
      } catch (error: any) {
        // Any error with alternative hosts - retry without them
        // Common issues: user not in org, user not licensed, user not eligible
        console.log(`[Zoom] Meeting creation with alternative host (${alternative_hosts}) failed, retrying without: ${error?.message}`);
        try {
          const settingsWithoutAltHost = this.settings({ topic, start_time, duration });
          return await post(url, { ...settingsWithoutAltHost }, { headers });
        } catch (retryError: any) {
          console.error(`[Zoom] Meeting creation failed even without alternative host: ${retryError?.message}`);
          throw retryError;
        }
      }
    }

    // No alternative hosts provided
    const settings = this.settings({ topic, start_time, duration });
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

  /**
   * Verify Zoom webhook signature
   * @param body - Raw request body as string
   * @param signature - x-zm-signature header value
   * @param timestamp - x-zm-request-timestamp header value
   * @param secretToken - Zoom webhook secret token from app credentials
   * @returns boolean indicating if signature is valid
   */
  static verifyWebhookSignature(
    body: string,
    signature: string,
    timestamp: string,
    secretToken: string,
  ): boolean {
    const message = `v0:${timestamp}:${body}`;
    const hash = crypto.createHmac('sha256', secretToken).update(message).digest('hex');
    const expectedSignature = `v0=${hash}`;
    return signature === expectedSignature;
  }

  /**
   * Generate Zoom URL validation response for webhook endpoint verification
   * @param plainToken - The plain_token from Zoom's validation request
   * @param secretToken - Zoom webhook secret token
   * @returns Object with plainToken and encryptedToken for response
   */
  static generateUrlValidationResponse(
    plainToken: string,
    secretToken: string,
  ): { plainToken: string; encryptedToken: string } {
    const encryptedToken = crypto
      .createHmac('sha256', secretToken)
      .update(plainToken)
      .digest('hex');
    return { plainToken, encryptedToken };
  }

  /**
   * Get participants from a past meeting
   * @param meetingId - Zoom meeting ID (can be UUID for recurring meetings)
   * @returns Array of participants with join/leave times
   */
  async getPastMeetingParticipants(meetingId: string): Promise<ZoomParticipant[]> {
    const participants: ZoomParticipant[] = [];
    let nextPageToken = '';

    try {
      // Double-encode UUID if it contains slashes (for recurring meetings)
      const encodedMeetingId = meetingId.includes('/')
        ? encodeURIComponent(encodeURIComponent(meetingId))
        : meetingId;

      do {
        const url = `${this.baseUrl}past_meetings/${encodedMeetingId}/participants${
          nextPageToken ? `?next_page_token=${nextPageToken}` : ''
        }`;
        const headers = await this.getHeaders();
        const response = await get(url, { headers });

        if (response.data?.participants) {
          participants.push(...response.data.participants);
        }
        nextPageToken = response.data?.next_page_token || '';
      } while (nextPageToken);

      console.log(`[Zoom] Retrieved ${participants.length} participants for meeting ${meetingId}`);
      return participants;
    } catch (error) {
      console.error('[Zoom] Failed to get meeting participants:', error.response?.data || error.message);
      // Return empty array instead of throwing - meeting might not have happened
      return [];
    }
  }

  /**
   * Get recordings for a meeting
   * @param meetingId - Zoom meeting ID
   * @returns Recording details including URLs and password
   */
  async getMeetingRecordings(meetingId: string): Promise<ZoomRecordingsResponse | null> {
    try {
      // Double-encode UUID if it contains slashes
      const encodedMeetingId = meetingId.includes('/')
        ? encodeURIComponent(encodeURIComponent(meetingId))
        : meetingId;

      const url = `${this.baseUrl}meetings/${encodedMeetingId}/recordings`;
      const headers = await this.getHeaders();
      const response = await get(url, { headers });

      console.log(`[Zoom] Retrieved recordings for meeting ${meetingId}`);
      return response.data;
    } catch (error) {
      // 404 means no recordings exist
      if (error.response?.status === 404) {
        console.log(`[Zoom] No recordings found for meeting ${meetingId}`);
        return null;
      }
      console.error('[Zoom] Failed to get meeting recordings:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get meeting details by ID
   * @param meetingId - Zoom meeting ID
   * @returns Meeting details
   */
  async getMeetingDetails(meetingId: string) {
    const url = `${this.baseUrl}meetings/${meetingId}`;
    const headers = await this.getHeaders();
    return await get(url, { headers });
  }

  /**
   * Get meeting transcript
   * @param meetingId - Zoom meeting ID or UUID
   * @returns Transcript content or null if not available
   */
  async getMeetingTranscript(meetingId: string): Promise<{ transcript_url?: string; vtt_content?: string } | null> {
    try {
      // First get recordings to find transcript files
      const recordings = await this.getMeetingRecordings(meetingId);
      if (!recordings?.recording_files) return null;

      // Find transcript/VTT file in recordings
      const transcriptFile = recordings.recording_files.find(
        (f) => f.file_type === 'TRANSCRIPT' || f.recording_type === 'audio_transcript'
      );

      if (!transcriptFile) {
        console.log(`[Zoom] No transcript found for meeting ${meetingId}`);
        return null;
      }

      console.log(`[Zoom] Found transcript for meeting ${meetingId}`);
      return {
        transcript_url: transcriptFile.download_url,
      };
    } catch (error) {
      console.error('[Zoom] Failed to get meeting transcript:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Download and parse VTT transcript content
   * @param downloadUrl - Transcript download URL
   * @returns Parsed transcript text
   */
  async downloadTranscriptContent(downloadUrl: string): Promise<string | null> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text',
      });

      // Parse VTT format to plain text
      const vttContent = response.data;
      // Remove VTT headers and timestamps, keep just the text
      const lines = vttContent.split('\n');
      const textLines: string[] = [];

      for (const line of lines) {
        // Skip VTT header, timestamps, and empty lines
        if (
          line.startsWith('WEBVTT') ||
          line.match(/^\d+$/) ||
          line.match(/^\d{2}:\d{2}/) ||
          line.trim() === ''
        ) {
          continue;
        }
        textLines.push(line.trim());
      }

      return textLines.join(' ');
    } catch (error) {
      console.error('[Zoom] Failed to download transcript:', error.message);
      return null;
    }
  }

  /**
   * Get meeting summary/notes from Zoom (requires Meeting Summary feature)
   * Note: Meeting summary content is only available via API if the meeting was created
   * with auto_start_meeting_summary: true in the settings.
   *
   * @param meetingId - Zoom meeting ID or UUID
   * @returns Meeting summary or null if not available
   */
  async getMeetingSummary(meetingId: string): Promise<{
    summary?: string;
    next_steps?: string[];
    summary_title?: string;
    summary_start_time?: string;
    summary_end_time?: string;
    edited_summary?: string[];
  } | null> {
    try {
      // Double-encode UUID if it contains slashes or special characters
      let encodedMeetingId = meetingId;
      if (meetingId.includes('/') || meetingId.includes('+') || meetingId.includes('=')) {
        encodedMeetingId = encodeURIComponent(encodeURIComponent(meetingId));
      }

      const url = `${this.baseUrl}meetings/${encodedMeetingId}/meeting_summary`;
      const headers = await this.getHeaders();

      console.log(`[Zoom] Fetching meeting summary for ${meetingId}`);
      const response = await get(url, { headers });

      if (response.data) {
        const data = response.data;
        console.log(`[Zoom] Retrieved meeting summary for ${meetingId}:`, {
          hasTitle: !!data.summary_title,
          hasSummaryDetails: !!data.summary_details,
          hasSummaryContent: !!(data.summary_details?.summary_overview || data.summary_content),
          hasNextSteps: !!(data.summary_details?.next_steps?.length || data.next_steps?.length),
        });

        // Handle various response formats from Zoom API
        const summaryContent = data.summary_details?.summary_overview
          || data.summary_content
          || data.meeting_summary
          || data.summary;

        const nextSteps = data.summary_details?.next_steps
          || data.next_steps
          || [];

        return {
          summary: summaryContent,
          next_steps: nextSteps,
          summary_title: data.summary_title,
          summary_start_time: data.summary_start_time,
          summary_end_time: data.summary_end_time,
          edited_summary: data.summary_details?.edited_summary || data.edited_summary,
        };
      }
      return null;
    } catch (error) {
      // 404 or 400 means no summary available
      if (error.response?.status === 404 || error.response?.status === 400) {
        console.log(`[Zoom] No meeting summary found for ${meetingId}:`, error.response?.data?.message);
        return null;
      }
      // 3001 error code means summary not yet available or feature not enabled
      if (error.response?.data?.code === 3001) {
        console.log(`[Zoom] Meeting summary not available (code 3001) for ${meetingId}`);
        return null;
      }
      console.error('[Zoom] Failed to get meeting summary:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * List all meeting summaries within a date range
   * Note: This endpoint requires the meeting_summary:read:admin scope
   *
   * @param from - Start date (YYYY-MM-DD format)
   * @param to - End date (YYYY-MM-DD format)
   * @param pageSize - Number of results per page (default 30, max 300)
   * @returns Array of meeting summaries or empty array
   */
  async listMeetingSummaries(
    from: string,
    to: string,
    pageSize: number = 30
  ): Promise<Array<{
    meeting_uuid: string;
    meeting_id: number;
    meeting_host_id: string;
    meeting_host_email: string;
    meeting_topic: string;
    summary_start_time: string;
    summary_end_time: string;
  }>> {
    try {
      const url = `${this.baseUrl}meetings/meeting_summaries?from=${from}&to=${to}&page_size=${pageSize}`;
      const headers = await this.getHeaders();

      console.log(`[Zoom] Listing meeting summaries from ${from} to ${to}`);
      const response = await get(url, { headers });

      if (response.data?.summaries) {
        console.log(`[Zoom] Found ${response.data.summaries.length} meeting summaries`);
        return response.data.summaries;
      }
      return [];
    } catch (error) {
      console.error('[Zoom] Failed to list meeting summaries:', error.response?.data || error.message);
      return [];
    }
  }

  private settings({ topic, start_time, duration = '5', alternative_hosts }: CreateMeetingType & { duration?: string }) {
    const meetingSettings: any = {
      host_video: 'true',
      participant_video: 'true',
      join_before_host: 'true',
      mute_upon_entry: 'false',
      auto_recording: 'cloud',
      waiting_room: false,
      // Enable AI Companion meeting summary - required for API access to summary content
      auto_start_meeting_summary: true,
    };

    // Add alternative host if provided (allows specialist to control meeting)
    if (alternative_hosts) {
      meetingSettings.alternative_hosts = alternative_hosts;
      meetingSettings.alternative_hosts_email_notification = true;
      console.log(`[Zoom] Setting alternative host: ${alternative_hosts}`);
    }

    return {
      topic,
      type: 2,
      start_time,
      duration,
      agenda: 'Scheduled Appointment',
      settings: meetingSettings,
    };
  }
}
