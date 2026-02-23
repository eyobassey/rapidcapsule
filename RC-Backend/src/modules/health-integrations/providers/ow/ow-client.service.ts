import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface OWUser {
  id: string;
  external_id: string;
}

export interface OWConnection {
  provider: string;
  status: string;
  connected_at?: string;
}

export interface OWTimeseriesData {
  data: Array<{
    type: string;
    value: number;
    unit: string;
    timestamp: string;
    source?: string;
  }>;
  pagination?: {
    next_cursor: string;
    has_more: boolean;
  };
}

@Injectable()
export class OWClientService {
  private readonly logger = new Logger(OWClientService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private available: boolean | null = null;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get('OPEN_WEARABLES_URL', 'http://localhost:8000') + '/api/v1';
    this.apiKey = this.configService.get('OPEN_WEARABLES_API_KEY', '');
  }

  private get headers() {
    return {
      'X-Open-Wearables-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    } as any;
  }

  /**
   * Check if the OW sidecar is reachable.
   * Result is cached for 60 seconds to avoid hammering.
   */
  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users?limit=1`, {
          headers: this.headers,
          timeout: 3000,
        }),
      );
      this.available = true;
      return true;
    } catch {
      this.available = false;
      return false;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getCachedAvailability(): boolean {
    return this.available ?? false;
  }

  async createUser(externalId: string): Promise<OWUser> {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/users`,
        { external_id: externalId },
        { headers: this.headers },
      ),
    );
    return response.data;
  }

  async getUser(owUserId: string): Promise<OWUser | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/users/${owUserId}`, {
          headers: this.headers,
        }),
      );
      return response.data;
    } catch {
      return null;
    }
  }

  async getAuthUrl(provider: string, owUserId: string): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/oauth/${provider}/authorize?user_id=${owUserId}`,
        { headers: this.headers },
      ),
    );
    return response.data.authorization_url || response.data.url;
  }

  async getUserConnections(owUserId: string): Promise<OWConnection[]> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/users/${owUserId}/connections`, {
        headers: this.headers,
      }),
    );
    return response.data.data || response.data;
  }

  async syncUserData(provider: string, owUserId: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/providers/${provider}/users/${owUserId}/sync`,
        {},
        { headers: this.headers },
      ),
    );
    return response.data;
  }

  async getTimeseries(
    owUserId: string,
    params?: { type?: string; start_time?: string; end_time?: string; cursor?: string },
  ): Promise<OWTimeseriesData> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/users/${owUserId}/timeseries`, {
        headers: this.headers,
        params,
      }),
    );
    return response.data;
  }

  async getWorkouts(
    owUserId: string,
    params?: { start_time?: string; end_time?: string },
  ): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/users/${owUserId}/events/workouts`, {
        headers: this.headers,
        params,
      }),
    );
    return response.data;
  }

  async getSleep(
    owUserId: string,
    params?: { start_time?: string; end_time?: string },
  ): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/users/${owUserId}/events/sleep`, {
        headers: this.headers,
        params,
      }),
    );
    return response.data;
  }

  async disconnectProvider(provider: string, owUserId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.delete(
          `${this.baseUrl}/users/${owUserId}/connections/${provider}`,
          { headers: this.headers },
        ),
      );
    } catch (error) {
      this.logger.warn(`Failed to disconnect ${provider} in OW: ${error.message}`);
    }
  }
}
