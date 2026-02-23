import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IHealthProvider, TokenResult, RawHealthData } from './health-provider.interface';
import { HealthIntegrationDocument } from '../schemas/health-integration.schema';

@Injectable()
export class SamsungHealthProvider implements IHealthProvider {
  readonly providerName = 'samsung_health';
  private readonly logger = new Logger(SamsungHealthProvider.name);
  private readonly baseUrl = 'https://api.samsunghealth.com';

  private readonly dataTypeMapping: Record<string, string> = {
    'heart_rate': 'heart_rate',
    'blood_pressure': 'blood_pressure',
    'blood_glucose': 'blood_glucose',
    'body_temperature': 'body_temperature',
    'oxygen_saturation': 'oxygen_saturation',
    'weight': 'weight',
    'height': 'height',
    'step_count': 'steps',
    'steps': 'steps',
    'calories': 'calories_burned',
    'calories_burned': 'calories_burned',
    'distance': 'distance',
    'sleep': 'sleep',
    'exercise': 'activity',
    'activity': 'activity',
  };

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  isAvailable(): boolean {
    return !!(
      this.configService.get('SAMSUNG_HEALTH_CLIENT_ID') &&
      this.configService.get('SAMSUNG_HEALTH_CLIENT_SECRET')
    );
  }

  async getAuthUrl(userId: string, state: string): Promise<string> {
    const clientId = this.configService.get('SAMSUNG_HEALTH_CLIENT_ID');
    const redirectUri = this.configService.get('SAMSUNG_HEALTH_REDIRECT_URI');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });

    return `https://account.samsung.com/oauth2/authorize?${params.toString()}`;
  }

  async exchangeToken(code: string): Promise<TokenResult> {
    const clientId = this.configService.get('SAMSUNG_HEALTH_CLIENT_ID');
    const clientSecret = this.configService.get('SAMSUNG_HEALTH_CLIENT_SECRET');
    const redirectUri = this.configService.get('SAMSUNG_HEALTH_REDIRECT_URI');

    const response = await firstValueFrom(
      this.httpService.post('https://account.samsung.com/oauth2/token', {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    );

    const { access_token, refresh_token, expires_in } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }

  async refreshToken(integration: HealthIntegrationDocument): Promise<TokenResult> {
    const clientId = this.configService.get('SAMSUNG_HEALTH_CLIENT_ID');
    const clientSecret = this.configService.get('SAMSUNG_HEALTH_CLIENT_SECRET');

    const response = await firstValueFrom(
      this.httpService.post('https://account.samsung.com/oauth2/token', {
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: integration.authTokens.refreshToken,
        grant_type: 'refresh_token',
      }),
    );

    const { access_token, expires_in, refresh_token } = response.data;

    return {
      accessToken: access_token,
      refreshToken: refresh_token || integration.authTokens.refreshToken,
      expiresAt: new Date(Date.now() + expires_in * 1000),
    };
  }

  async fetchHealthData(
    integration: HealthIntegrationDocument,
    dataTypes: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<RawHealthData[]> {
    const { accessToken } = integration.authTokens;
    const results: RawHealthData[] = [];

    for (const dataType of dataTypes) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(
            `${this.baseUrl}/v1/data/${dataType}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              } as any,
              params: {
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
              },
            },
          ),
        );

        const items = response.data.items || [];
        for (const item of items) {
          results.push({
            dataType: this.dataTypeMapping[dataType] || dataType,
            value: {
              primary: item.value,
              secondary: item.secondary_value,
              unit: item.unit,
              details: item.additional_info,
            },
            recordedAt: new Date(item.start_time),
            metadata: {
              externalId: item.id,
              deviceType: item.device_uuid,
            },
          });
        }
      } catch (error) {
        this.logger.error(`Error fetching ${dataType} from Samsung Health: ${error.message}`);
      }
    }

    return results;
  }

  async revokeAccess(integration: HealthIntegrationDocument): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `https://account.samsung.com/oauth2/revoke`,
          { token: integration.authTokens.accessToken },
        ),
      );
    } catch (error) {
      this.logger.error(`Error revoking Samsung Health access: ${error.message}`);
    }
  }

  supportsWebhook(): boolean {
    return false;
  }
}
