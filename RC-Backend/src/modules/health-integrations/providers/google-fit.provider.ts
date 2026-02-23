import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IHealthProvider, TokenResult, RawHealthData } from './health-provider.interface';
import { HealthIntegrationDocument } from '../schemas/health-integration.schema';

@Injectable()
export class GoogleFitProvider implements IHealthProvider {
  readonly providerName = 'google_fit';
  private readonly logger = new Logger(GoogleFitProvider.name);
  private readonly baseUrl = 'https://www.googleapis.com/fitness/v1';

  private readonly scopes = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.activity.write',
    'https://www.googleapis.com/auth/fitness.blood_glucose.read',
    'https://www.googleapis.com/auth/fitness.blood_glucose.write',
    'https://www.googleapis.com/auth/fitness.blood_pressure.read',
    'https://www.googleapis.com/auth/fitness.blood_pressure.write',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.body.write',
    'https://www.googleapis.com/auth/fitness.body_temperature.read',
    'https://www.googleapis.com/auth/fitness.body_temperature.write',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.write',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.sleep.write',
  ];

  private readonly dataTypeMapping: Record<string, string> = {
    'heart_rate': 'heart_rate',
    'blood_pressure': 'blood_pressure',
    'blood_glucose': 'blood_glucose',
    'body_temperature': 'body_temperature',
    'oxygen_saturation': 'oxygen_saturation',
    'weight': 'weight',
    'height': 'height',
    'steps': 'steps',
    'calories_burned': 'calories_burned',
    'distance': 'distance',
    'sleep': 'sleep',
    'activity': 'activity',
    'com.google.heart_rate.bpm': 'heart_rate',
    'com.google.blood_pressure': 'blood_pressure',
    'com.google.blood_glucose': 'blood_glucose',
    'com.google.body.temperature': 'body_temperature',
    'com.google.oxygen_saturation': 'oxygen_saturation',
    'com.google.weight': 'weight',
    'com.google.height': 'height',
    'com.google.step_count.delta': 'steps',
    'com.google.calories.expended': 'calories_burned',
    'com.google.distance.delta': 'distance',
    'com.google.sleep.segment': 'sleep',
    'com.google.activity.segment': 'activity',
    'body_fat': 'body_fat',
    'active_minutes': 'active_minutes',
    'hydration': 'hydration',
    'muscle_mass': 'muscle_mass',
    'bone_mass': 'bone_mass',
    'body_water': 'body_water',
    'visceral_fat': 'visceral_fat',
    'bmr': 'bmr',
    'com.google.body.fat.percentage': 'body_fat',
    'com.google.active_minutes': 'active_minutes',
    'com.google.hydration': 'hydration',
    'com.google.body.muscle.mass': 'muscle_mass',
    'com.google.bone_mass': 'bone_mass',
    'com.google.body.water': 'body_water',
    'com.google.body.fat.visceral': 'visceral_fat',
    'com.google.bmr': 'bmr',
  };

  private readonly unitMapping: Record<string, string> = {
    'com.google.heart_rate.bpm': 'bpm',
    'com.google.blood_pressure': 'mmHg',
    'com.google.blood_glucose': 'mg/dL',
    'com.google.body.temperature': '°C',
    'com.google.oxygen_saturation': '%',
    'com.google.weight': 'kg',
    'com.google.height': 'cm',
    'com.google.step_count.delta': 'steps',
    'com.google.calories.expended': 'kcal',
    'com.google.distance.delta': 'm',
    'com.google.sleep.segment': 'hours',
    'com.google.activity.segment': 'min',
    'com.google.body.fat.percentage': '%',
    'com.google.active_minutes': 'min',
    'com.google.hydration': 'L',
    'com.google.body.muscle.mass': 'kg',
    'com.google.bone_mass': 'kg',
    'com.google.body.water': '%',
    'com.google.body.fat.visceral': 'level',
    'com.google.bmr': 'kcal',
  };

  private readonly dataSourceIds: Record<string, string> = {
    'heart_rate': 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
    'steps': 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
    'calories': 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
    'calories_burned': 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
    'distance': 'derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta',
    'weight': 'derived:com.google.weight:com.google.android.gms:merge_weight',
    'blood_pressure': 'derived:com.google.blood_pressure:com.google.android.gms:merged',
    'blood_glucose': 'derived:com.google.blood_glucose:com.google.android.gms:merged',
    'oxygen_saturation': 'derived:com.google.oxygen_saturation:com.google.android.gms:merged',
    'body_temperature': 'derived:com.google.body.temperature:com.google.android.gms:merged',
    'body_fat': 'derived:com.google.body.fat.percentage:com.google.android.gms:merged',
    'active_minutes': 'derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes',
    'hydration': 'derived:com.google.hydration:com.google.android.gms:merged',
    'muscle_mass': 'derived:com.google.body.muscle.mass:com.google.android.gms:merged',
    'bone_mass': 'derived:com.google.bone_mass:com.google.android.gms:merged',
    'body_water': 'derived:com.google.body.water:com.google.android.gms:merged',
    'visceral_fat': 'derived:com.google.body.fat.visceral:com.google.android.gms:merged',
    'bmr': 'derived:com.google.bmr:com.google.android.gms:merged',
  };

  // Data types that use the Sessions API instead of Datasets API
  private readonly sessionBasedTypes = new Set(['sleep']);

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {}

  isAvailable(): boolean {
    return !!(
      this.configService.get('GOOGLE_FIT_CLIENT_ID') &&
      this.configService.get('GOOGLE_FIT_CLIENT_SECRET')
    );
  }

  async getAuthUrl(userId: string, state: string): Promise<string> {
    const clientId = this.configService.get('GOOGLE_FIT_CLIENT_ID');
    const redirectUri = this.configService.get('GOOGLE_FIT_REDIRECT_URI');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeToken(code: string): Promise<TokenResult> {
    const clientId = this.configService.get('GOOGLE_FIT_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_FIT_CLIENT_SECRET');
    const redirectUri = this.configService.get('GOOGLE_FIT_REDIRECT_URI');

    const response = await firstValueFrom(
      this.httpService.post('https://oauth2.googleapis.com/token', {
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
    const clientId = this.configService.get('GOOGLE_FIT_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_FIT_CLIENT_SECRET');

    const response = await firstValueFrom(
      this.httpService.post('https://oauth2.googleapis.com/token', {
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
        if (this.sessionBasedTypes.has(dataType)) {
          // Sleep uses the Sessions API
          const sessionResults = await this.fetchSessionData(accessToken as string, dataType, startDate, endDate);
          results.push(...sessionResults);
          continue;
        }

        const dataSourceId = this.dataSourceIds[dataType] || dataType;
        const startNanos = `${startDate.getTime()}000000`;
        const endNanos = `${endDate.getTime()}000000`;

        const response = await firstValueFrom(
          this.httpService.get(
            `${this.baseUrl}/users/me/dataSources/${dataSourceId}/datasets/${startNanos}-${endNanos}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              } as any,
            },
          ),
        );

        const points = response.data.point || [];
        for (const point of points) {
          const values = point.value || [];
          const primaryValue = values[0];

          results.push({
            dataType: this.dataTypeMapping[dataType] || dataType,
            value: {
              primary: primaryValue?.fpVal || primaryValue?.intVal,
              unit: this.unitMapping[point.dataTypeName] || point.dataTypeName,
              details: values.length > 1 ? { values } : undefined,
            },
            recordedAt: new Date(parseInt(point.startTimeNanos) / 1000000),
            metadata: {
              externalId: point.dataSourceId,
              deviceType: point.device?.type,
              deviceModel: point.device?.model,
            },
          });
        }
      } catch (error) {
        this.logger.error(`Error fetching ${dataType} from Google Fit: ${error.message}`);
      }
    }

    return results;
  }

  private async fetchSessionData(
    accessToken: string,
    dataType: string,
    startDate: Date,
    endDate: Date,
  ): Promise<RawHealthData[]> {
    const results: RawHealthData[] = [];

    // Google Fit Sessions API for sleep
    // activityType 72 = sleep
    const startTimeMillis = startDate.getTime();
    const endTimeMillis = endDate.getTime();

    const response = await firstValueFrom(
      this.httpService.get(
        `${this.baseUrl}/users/me/sessions?startTime=${new Date(startTimeMillis).toISOString()}&endTime=${new Date(endTimeMillis).toISOString()}&activityType=72`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          } as any,
        },
      ),
    );

    const sessions = response.data.session || [];
    for (const session of sessions) {
      const startMillis = parseInt(session.startTimeMillis);
      const endMillis = parseInt(session.endTimeMillis);
      const durationHours = ((endMillis - startMillis) / (1000 * 60 * 60)).toFixed(1);

      results.push({
        dataType: 'sleep',
        value: {
          primary: parseFloat(durationHours),
          unit: 'hours',
          details: {
            sessionName: session.name,
            activityType: session.activityType,
            startTime: new Date(startMillis).toISOString(),
            endTime: new Date(endMillis).toISOString(),
          },
        },
        recordedAt: new Date(startMillis),
        metadata: {
          externalId: session.id,
          deviceType: session.application?.packageName,
        },
      });
    }

    this.logger.log(`Fetched ${results.length} sleep sessions from Google Fit`);
    return results;
  }

  async revokeAccess(integration: HealthIntegrationDocument): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `https://oauth2.googleapis.com/revoke?token=${integration.authTokens.accessToken}`,
        ),
      );
    } catch (error) {
      this.logger.error(`Error revoking Google Fit access: ${error.message}`);
    }
  }

  supportsWebhook(): boolean {
    return false;
  }
}
