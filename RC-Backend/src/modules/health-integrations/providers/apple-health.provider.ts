import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IHealthProvider, TokenResult, RawHealthData } from './health-provider.interface';
import { HealthIntegrationDocument } from '../schemas/health-integration.schema';

@Injectable()
export class AppleHealthProvider implements IHealthProvider {
  readonly providerName = 'apple_health';
  private readonly logger = new Logger(AppleHealthProvider.name);

  private readonly dataTypeMapping: Record<string, string> = {
    'HKQuantityTypeIdentifierHeartRate': 'heart_rate',
    'HKQuantityTypeIdentifierBloodPressureSystolic': 'blood_pressure',
    'HKQuantityTypeIdentifierBloodGlucose': 'blood_glucose',
    'HKQuantityTypeIdentifierBodyTemperature': 'body_temperature',
    'HKQuantityTypeIdentifierOxygenSaturation': 'oxygen_saturation',
    'HKQuantityTypeIdentifierBodyMass': 'weight',
    'HKQuantityTypeIdentifierHeight': 'height',
    'HKQuantityTypeIdentifierStepCount': 'steps',
    'HKQuantityTypeIdentifierActiveEnergyBurned': 'calories_burned',
    'HKQuantityTypeIdentifierDistanceWalkingRunning': 'distance',
    'HKCategoryTypeIdentifierSleepAnalysis': 'sleep',
    'HKWorkoutTypeIdentifier': 'activity',
  };

  constructor(private configService: ConfigService) {}

  isAvailable(): boolean {
    // Apple Health is always available as a push-based provider
    // (data comes from the mobile app, no API credentials needed)
    return !!this.configService.get('APPLE_HEALTH_APP_ID');
  }

  async getAuthUrl(userId: string, state: string): Promise<string | null> {
    // Apple HealthKit doesn't use OAuth — data is pushed from the native app
    return null;
  }

  async exchangeToken(code: string): Promise<TokenResult> {
    // No token exchange for Apple Health — data comes via native app push
    return {
      accessToken: 'native_app',
      expiresAt: new Date('2099-12-31'),
    };
  }

  async refreshToken(integration: HealthIntegrationDocument): Promise<TokenResult> {
    // No-op — Apple Health doesn't use OAuth tokens
    return {
      accessToken: 'native_app',
      expiresAt: new Date('2099-12-31'),
    };
  }

  async fetchHealthData(
    integration: HealthIntegrationDocument,
    dataTypes: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<RawHealthData[]> {
    // Apple Health is push-based only — data is received via the callback endpoint
    // This method returns an empty array; actual data arrives through handleAppleHealthCallback
    this.logger.debug('Apple Health is push-based; data arrives via native app callback');
    return [];
  }

  /**
   * Process health data pushed from the native iOS app.
   */
  processIncomingData(healthData: Array<{ type: string; value: any; date: Date; uuid?: string; sourceName?: string }>): RawHealthData[] {
    return healthData.map((data) => ({
      dataType: this.dataTypeMapping[data.type] || data.type,
      value: typeof data.value === 'object' ? data.value : { primary: data.value },
      recordedAt: new Date(data.date),
      metadata: {
        externalId: data.uuid,
        deviceType: data.sourceName,
      },
    }));
  }

  async revokeAccess(integration: HealthIntegrationDocument): Promise<void> {
    // No server-side revocation — user disconnects via the native app
    this.logger.debug('Apple Health disconnect — user must revoke in iOS Health app');
  }

  supportsWebhook(): boolean {
    return false;
  }
}
