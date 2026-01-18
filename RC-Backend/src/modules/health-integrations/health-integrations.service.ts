import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  HealthIntegration,
  HealthIntegrationDocument,
  IntegrationProvider,
  IntegrationStatus,
} from './schemas/health-integration.schema';
import {
  HealthData,
  HealthDataDocument,
  HealthDataType,
} from './schemas/health-data.schema';
import { ConnectIntegrationDto } from './dto/connect-integration.dto';
import { SyncHealthDataDto } from './dto/sync-health-data.dto';
import { UpdateSyncSettingsDto } from './dto/update-sync-settings.dto';
import { VitalsService } from '../vitals/vitals.service';

@Injectable()
export class HealthIntegrationsService {
  private googleFitBaseUrl = 'https://www.googleapis.com/fitness/v1';
  private samsungHealthBaseUrl = 'https://api.samsunghealth.com';

  constructor(
    @InjectModel(HealthIntegration.name)
    private healthIntegrationModel: Model<HealthIntegrationDocument>,
    @InjectModel(HealthData.name)
    private healthDataModel: Model<HealthDataDocument>,
    private httpService: HttpService,
    private configService: ConfigService,
    private vitalsService: VitalsService,
  ) {}

  async debugGoogleFitConfig() {
    const clientId = this.configService.get('GOOGLE_FIT_CLIENT_ID');
    const redirectUri = this.configService.get('GOOGLE_FIT_REDIRECT_URI');
    const sampleState = 'test123';
    
    const scopes = [
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

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: sampleState,
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return {
      clientId,
      redirectUri,
      authUrl,
      message: 'Check if the redirectUri matches exactly what you configured in Google Cloud Console'
    };
  }

  async getUserIntegrations(userId: string) {
    return this.healthIntegrationModel.find({
      userId: new Types.ObjectId(userId),
      isActive: true,
    });
  }

  async getIntegrationStatus(userId: string, provider: IntegrationProvider) {
    const integration = await this.healthIntegrationModel.findOne({
      userId: new Types.ObjectId(userId),
      provider,
      isActive: true,
    });

    if (!integration) {
      return { status: IntegrationStatus.DISCONNECTED, provider };
    }

    return {
      status: integration.status,
      provider: integration.provider,
      lastSyncedAt: integration.lastSyncedAt,
      metadata: integration.metadata,
    };
  }

  async connectIntegration(userId: string, connectDto: ConnectIntegrationDto) {
    const existingIntegration = await this.healthIntegrationModel.findOne({
      userId: new Types.ObjectId(userId),
      provider: connectDto.provider,
    });

    if (existingIntegration && existingIntegration.status === IntegrationStatus.CONNECTED) {
      throw new HttpException('Integration already connected', HttpStatus.BAD_REQUEST);
    }

    let authUrl: string;
    const state = Buffer.from(`${userId}:${Date.now()}`).toString('base64');

    switch (connectDto.provider) {
      case IntegrationProvider.GOOGLE_FIT:
        authUrl = this.generateGoogleFitAuthUrl(state);
        break;
      case IntegrationProvider.SAMSUNG_HEALTH:
        authUrl = this.generateSamsungHealthAuthUrl(state);
        break;
      case IntegrationProvider.APPLE_HEALTH:
        // Apple HealthKit requires native app integration
        return {
          provider: IntegrationProvider.APPLE_HEALTH,
          requiresNativeApp: true,
          instructions: 'Please use the Rapid Capsule mobile app to connect Apple Health',
        };
      default:
        throw new HttpException('Unsupported provider', HttpStatus.BAD_REQUEST);
    }

    const integration = await this.healthIntegrationModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        provider: connectDto.provider,
      },
      {
        status: IntegrationStatus.PENDING,
        metadata: {
          ...connectDto.metadata,
          dataTypes: connectDto.dataTypes,
        },
        syncSettings: {
          autoSync: connectDto.autoSync ?? true,
          syncDirection: connectDto.syncDirection ?? 'bidirectional',
          dataMapping: {},
        },
      },
      { upsert: true, new: true },
    );

    return {
      authUrl,
      integrationId: integration._id,
      provider: connectDto.provider,
    };
  }

  private generateGoogleFitAuthUrl(state: string): string {
    const clientId = this.configService.get('GOOGLE_FIT_CLIENT_ID');
    const redirectUri = this.configService.get('GOOGLE_FIT_REDIRECT_URI');
    
    const scopes = [
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

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private generateSamsungHealthAuthUrl(state: string): string {
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

  async handleGoogleFitCallback(userId: string, code: string) {
    const clientId = this.configService.get('GOOGLE_FIT_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_FIT_CLIENT_SECRET');
    const redirectUri = this.configService.get('GOOGLE_FIT_REDIRECT_URI');

    try {
      const tokenResponse = await firstValueFrom(
        this.httpService.post('https://oauth2.googleapis.com/token', {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      const integration = await this.healthIntegrationModel.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          provider: IntegrationProvider.GOOGLE_FIT,
        },
        {
          status: IntegrationStatus.CONNECTED,
          authTokens: {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: new Date(Date.now() + expires_in * 1000),
          },
          lastSyncedAt: new Date(),
        },
        { new: true },
      );

      if (integration) {
        // Trigger initial sync
        await this.syncGoogleFitData(integration);
      }

      return {
        success: true,
        provider: IntegrationProvider.GOOGLE_FIT,
        status: IntegrationStatus.CONNECTED,
      };
    } catch (error) {
      console.error('Google Fit callback error:', error);
      throw new HttpException(
        'Failed to connect Google Fit',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async handleSamsungHealthCallback(userId: string, code: string) {
    const clientId = this.configService.get('SAMSUNG_HEALTH_CLIENT_ID');
    const clientSecret = this.configService.get('SAMSUNG_HEALTH_CLIENT_SECRET');
    const redirectUri = this.configService.get('SAMSUNG_HEALTH_REDIRECT_URI');

    try {
      const tokenResponse = await firstValueFrom(
        this.httpService.post('https://account.samsung.com/oauth2/token', {
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      const integration = await this.healthIntegrationModel.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          provider: IntegrationProvider.SAMSUNG_HEALTH,
        },
        {
          status: IntegrationStatus.CONNECTED,
          authTokens: {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: new Date(Date.now() + expires_in * 1000),
          },
          lastSyncedAt: new Date(),
        },
        { new: true },
      );

      if (integration) {
        // Trigger initial sync
        await this.syncSamsungHealthData(integration);
      }

      return {
        success: true,
        provider: IntegrationProvider.SAMSUNG_HEALTH,
        status: IntegrationStatus.CONNECTED,
      };
    } catch (error) {
      console.error('Samsung Health callback error:', error);
      throw new HttpException(
        'Failed to connect Samsung Health',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async handleAppleHealthCallback(userId: string, authData: any) {
    // Apple HealthKit data comes from the mobile app
    try {
      const integration = await this.healthIntegrationModel.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          provider: IntegrationProvider.APPLE_HEALTH,
        },
        {
          status: IntegrationStatus.CONNECTED,
          metadata: {
            ...authData.metadata,
            deviceId: authData.deviceId,
          },
          lastSyncedAt: new Date(),
        },
        { new: true },
      );

      return {
        success: true,
        provider: IntegrationProvider.APPLE_HEALTH,
        status: IntegrationStatus.CONNECTED,
      };
    } catch (error) {
      console.error('Apple Health callback error:', error);
      throw new HttpException(
        'Failed to connect Apple Health',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async syncHealthData(userId: string, provider: IntegrationProvider, syncDto: SyncHealthDataDto) {
    const integration = await this.healthIntegrationModel.findOne({
      userId: new Types.ObjectId(userId),
      provider,
      status: IntegrationStatus.CONNECTED,
    });

    if (!integration) {
      throw new HttpException('Integration not connected', HttpStatus.BAD_REQUEST);
    }

    let syncResults;
    switch (provider) {
      case IntegrationProvider.GOOGLE_FIT:
        syncResults = await this.syncGoogleFitData(integration, syncDto);
        break;
      case IntegrationProvider.SAMSUNG_HEALTH:
        syncResults = await this.syncSamsungHealthData(integration, syncDto);
        break;
      case IntegrationProvider.APPLE_HEALTH:
        syncResults = await this.processAppleHealthData(integration, syncDto);
        break;
      default:
        throw new HttpException('Unsupported provider', HttpStatus.BAD_REQUEST);
    }

    integration.lastSyncedAt = new Date();
    await integration.save();

    return syncResults;
  }

  private async syncGoogleFitData(
    integration: HealthIntegrationDocument,
    syncDto?: SyncHealthDataDto,
  ) {
    const { accessToken } = integration.authTokens;
    const dataTypes = syncDto?.dataTypes || integration.metadata.dataTypes || [];
    const startTime = syncDto?.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endTime = syncDto?.endDate || new Date();

    const syncedData: HealthDataDocument[] = [];

    for (const dataType of dataTypes) {
      try {
        const dataSourceId = this.getGoogleFitDataSourceId(dataType);
        const response = await firstValueFrom(
          this.httpService.get(
            `${this.googleFitBaseUrl}/users/me/dataSources/${dataSourceId}/datasets/${startTime.getTime()}000000-${endTime.getTime()}000000`,
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
          const healthData = await this.saveHealthData(
            integration,
            dataType,
            point,
            IntegrationProvider.GOOGLE_FIT,
          );
          syncedData.push(healthData);
        }
      } catch (error) {
        console.error(`Error syncing ${dataType} from Google Fit:`, error);
      }
    }

    return {
      provider: IntegrationProvider.GOOGLE_FIT,
      syncedCount: syncedData.length,
      lastSyncedAt: new Date(),
    };
  }

  private async syncSamsungHealthData(
    integration: HealthIntegrationDocument,
    syncDto?: SyncHealthDataDto,
  ) {
    const { accessToken } = integration.authTokens;
    const dataTypes = syncDto?.dataTypes || integration.metadata.dataTypes || [];
    const startTime = syncDto?.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endTime = syncDto?.endDate || new Date();

    const syncedData: HealthDataDocument[] = [];

    for (const dataType of dataTypes) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(
            `${this.samsungHealthBaseUrl}/v1/data/${dataType}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              } as any,
              params: {
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
              },
            },
          ),
        );

        const items = response.data.items || [];
        for (const item of items) {
          const healthData = await this.saveHealthData(
            integration,
            dataType,
            item,
            IntegrationProvider.SAMSUNG_HEALTH,
          );
          syncedData.push(healthData);
        }
      } catch (error) {
        console.error(`Error syncing ${dataType} from Samsung Health:`, error);
      }
    }

    return {
      provider: IntegrationProvider.SAMSUNG_HEALTH,
      syncedCount: syncedData.length,
      lastSyncedAt: new Date(),
    };
  }

  private async processAppleHealthData(
    integration: HealthIntegrationDocument,
    syncDto: SyncHealthDataDto,
  ) {
    // Apple HealthKit data is sent directly from the mobile app
    const syncedData: HealthDataDocument[] = [];

    if (syncDto.healthData) {
      for (const data of syncDto.healthData) {
        const healthData = await this.saveHealthData(
          integration,
          data.type,
          data,
          IntegrationProvider.APPLE_HEALTH,
        );
        syncedData.push(healthData);
      }
    }

    return {
      provider: IntegrationProvider.APPLE_HEALTH,
      syncedCount: syncedData.length,
      lastSyncedAt: new Date(),
    };
  }

  private async saveHealthData(
    integration: HealthIntegrationDocument,
    dataType: string,
    rawData: any,
    provider: IntegrationProvider,
  ) {
    const mappedData = this.mapHealthData(dataType, rawData, provider);

    const healthData = new this.healthDataModel({
      userId: integration.userId,
      integrationId: integration._id,
      source: provider,
      dataType: mappedData.dataType,
      value: mappedData.value,
      recordedAt: mappedData.recordedAt,
      syncedAt: new Date(),
      metadata: mappedData.metadata,
    });

    await healthData.save();

    // Auto-sync to vitals if enabled
    if (integration.syncSettings?.autoSync) {
      await this.syncToVitals(healthData);
    }

    return healthData;
  }

  private mapHealthData(dataType: string, rawData: any, provider: IntegrationProvider) {
    let mappedType: HealthDataType;
    let value: any;
    let recordedAt: Date;
    let metadata: any = {};

    switch (provider) {
      case IntegrationProvider.GOOGLE_FIT:
        mappedType = this.mapGoogleFitDataType(dataType);
        value = this.extractGoogleFitValue(rawData);
        recordedAt = new Date(parseInt(rawData.startTimeNanos) / 1000000);
        metadata = {
          externalId: rawData.dataSourceId,
          deviceType: rawData.device?.type,
          deviceModel: rawData.device?.model,
        };
        break;

      case IntegrationProvider.SAMSUNG_HEALTH:
        mappedType = this.mapSamsungHealthDataType(dataType);
        value = this.extractSamsungHealthValue(rawData);
        recordedAt = new Date(rawData.start_time);
        metadata = {
          externalId: rawData.id,
          deviceType: rawData.device_uuid,
        };
        break;

      case IntegrationProvider.APPLE_HEALTH:
        mappedType = this.mapAppleHealthDataType(dataType);
        value = rawData.value;
        recordedAt = new Date(rawData.date);
        metadata = {
          externalId: rawData.uuid,
          deviceType: rawData.sourceName,
        };
        break;

      default:
        throw new Error('Unsupported provider');
    }

    return {
      dataType: mappedType,
      value,
      recordedAt,
      metadata,
    };
  }

  private mapGoogleFitDataType(dataType: string): HealthDataType {
    const mapping = {
      'com.google.heart_rate.bpm': HealthDataType.HEART_RATE,
      'com.google.blood_pressure': HealthDataType.BLOOD_PRESSURE,
      'com.google.blood_glucose': HealthDataType.BLOOD_GLUCOSE,
      'com.google.body.temperature': HealthDataType.BODY_TEMPERATURE,
      'com.google.oxygen_saturation': HealthDataType.OXYGEN_SATURATION,
      'com.google.weight': HealthDataType.WEIGHT,
      'com.google.height': HealthDataType.HEIGHT,
      'com.google.step_count.delta': HealthDataType.STEPS,
      'com.google.calories.expended': HealthDataType.CALORIES_BURNED,
      'com.google.distance.delta': HealthDataType.DISTANCE,
      'com.google.sleep.segment': HealthDataType.SLEEP,
      'com.google.activity.segment': HealthDataType.ACTIVITY,
    };
    return mapping[dataType] || HealthDataType.ACTIVITY;
  }

  private mapSamsungHealthDataType(dataType: string): HealthDataType {
    const mapping = {
      'heart_rate': HealthDataType.HEART_RATE,
      'blood_pressure': HealthDataType.BLOOD_PRESSURE,
      'blood_glucose': HealthDataType.BLOOD_GLUCOSE,
      'body_temperature': HealthDataType.BODY_TEMPERATURE,
      'oxygen_saturation': HealthDataType.OXYGEN_SATURATION,
      'weight': HealthDataType.WEIGHT,
      'height': HealthDataType.HEIGHT,
      'step_count': HealthDataType.STEPS,
      'calories': HealthDataType.CALORIES_BURNED,
      'distance': HealthDataType.DISTANCE,
      'sleep': HealthDataType.SLEEP,
      'exercise': HealthDataType.ACTIVITY,
    };
    return mapping[dataType] || HealthDataType.ACTIVITY;
  }

  private mapAppleHealthDataType(dataType: string): HealthDataType {
    const mapping = {
      'HKQuantityTypeIdentifierHeartRate': HealthDataType.HEART_RATE,
      'HKQuantityTypeIdentifierBloodPressureSystolic': HealthDataType.BLOOD_PRESSURE,
      'HKQuantityTypeIdentifierBloodGlucose': HealthDataType.BLOOD_GLUCOSE,
      'HKQuantityTypeIdentifierBodyTemperature': HealthDataType.BODY_TEMPERATURE,
      'HKQuantityTypeIdentifierOxygenSaturation': HealthDataType.OXYGEN_SATURATION,
      'HKQuantityTypeIdentifierBodyMass': HealthDataType.WEIGHT,
      'HKQuantityTypeIdentifierHeight': HealthDataType.HEIGHT,
      'HKQuantityTypeIdentifierStepCount': HealthDataType.STEPS,
      'HKQuantityTypeIdentifierActiveEnergyBurned': HealthDataType.CALORIES_BURNED,
      'HKQuantityTypeIdentifierDistanceWalkingRunning': HealthDataType.DISTANCE,
      'HKCategoryTypeIdentifierSleepAnalysis': HealthDataType.SLEEP,
      'HKWorkoutTypeIdentifier': HealthDataType.ACTIVITY,
    };
    return mapping[dataType] || HealthDataType.ACTIVITY;
  }

  private extractGoogleFitValue(rawData: any) {
    const values = rawData.value || [];
    if (values.length === 0) return {};

    const value = values[0];
    return {
      primary: value.fpVal || value.intVal,
      unit: rawData.dataTypeName,
      details: values.length > 1 ? values : undefined,
    };
  }

  private extractSamsungHealthValue(rawData: any) {
    return {
      primary: rawData.value,
      secondary: rawData.secondary_value,
      unit: rawData.unit,
      details: rawData.additional_info,
    };
  }

  private getGoogleFitDataSourceId(dataType: string): string {
    const dataSourceIds = {
      'heart_rate': 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm',
      'steps': 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
      'calories': 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended',
      'distance': 'derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta',
      'weight': 'derived:com.google.weight:com.google.android.gms:merge_weight',
      'blood_pressure': 'derived:com.google.blood_pressure:com.google.android.gms:merged',
      'blood_glucose': 'derived:com.google.blood_glucose:com.google.android.gms:merged',
    };
    return dataSourceIds[dataType] || dataType;
  }

  async syncToVitals(healthData: HealthDataDocument) {
    const vitalTypeMapping = {
      [HealthDataType.HEART_RATE]: 'pulse_rate',
      [HealthDataType.BLOOD_PRESSURE]: 'blood_pressure',
      [HealthDataType.BLOOD_GLUCOSE]: 'blood_sugar_level',
      [HealthDataType.BODY_TEMPERATURE]: 'body_temp',
      [HealthDataType.WEIGHT]: 'body_weight',
    };

    const vitalType = vitalTypeMapping[healthData.dataType];
    if (!vitalType) return;

    try {
      // Create vitals data in the format expected by VitalsService
      const vitalData = {
        body_temp: vitalType === 'body_temp' ? [{
          value: String(healthData.value.primary || ''),
          unit: healthData.value.unit || '',
          updatedAt: healthData.recordedAt,
        }] : [],
        body_weight: vitalType === 'body_weight' ? [{
          value: String(healthData.value.primary || ''),
          unit: healthData.value.unit || '',
          updatedAt: healthData.recordedAt,
        }] : [],
        blood_pressure: vitalType === 'blood_pressure' ? [{
          value: String(healthData.value.primary || ''),
          unit: healthData.value.unit || '',
          updatedAt: healthData.recordedAt,
        }] : [],
        blood_sugar_level: vitalType === 'blood_sugar_level' ? [{
          value: String(healthData.value.primary || ''),
          unit: healthData.value.unit || '',
          updatedAt: healthData.recordedAt,
        }] : [],
        pulse_rate: vitalType === 'pulse_rate' ? [{
          value: String(healthData.value.primary || ''),
          unit: healthData.value.unit || '',
          updatedAt: healthData.recordedAt,
        }] : [],
      };

      const vital = await this.vitalsService.createVitals(vitalData as any, new Types.ObjectId(healthData.userId.toString()));
      
      healthData.isSyncedToVitals = true;
      healthData.vitalId = vital._id;
      await healthData.save();

      return vital;
    } catch (error) {
      console.error('Error syncing to vitals:', error);
    }
  }

  async pushToVitals(userId: string, dataIds: string[]) {
    const healthDataItems = await this.healthDataModel.find({
      _id: { $in: dataIds.map(id => new Types.ObjectId(id)) },
      userId: new Types.ObjectId(userId),
      isSyncedToVitals: false,
    });

    const syncResults: Array<{
      healthDataId: any;
      vitalId: any;
      dataType: HealthDataType;
    }> = [];

    for (const healthData of healthDataItems) {
      const vital = await this.syncToVitals(healthData);
      if (vital) {
        syncResults.push({
          healthDataId: healthData._id,
          vitalId: vital._id,
          dataType: healthData.dataType,
        });
      }
    }

    return {
      syncedCount: syncResults.length,
      results: syncResults,
    };
  }

  async getHealthData(userId: string, filters: any) {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters.provider) {
      query.source = filters.provider;
    }

    if (filters.dataType) {
      query.dataType = filters.dataType;
    }

    if (filters.startDate || filters.endDate) {
      query.recordedAt = {};
      if (filters.startDate) {
        query.recordedAt.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.recordedAt.$lte = filters.endDate;
      }
    }

    return this.healthDataModel
      .find(query)
      .sort({ recordedAt: -1 })
      .limit(100)
      .populate('integrationId', 'provider metadata');
  }

  async updateSyncSettings(
    userId: string,
    provider: IntegrationProvider,
    updateDto: UpdateSyncSettingsDto,
  ) {
    const integration = await this.healthIntegrationModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        provider,
      },
      {
        $set: {
          'syncSettings.autoSync': updateDto.autoSync,
          'syncSettings.syncDirection': updateDto.syncDirection,
          'metadata.syncFrequency': updateDto.syncFrequency,
          'metadata.dataTypes': updateDto.dataTypes,
        },
      },
      { new: true },
    );

    if (!integration) {
      throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
    }

    return integration;
  }

  async disconnectIntegration(userId: string, provider: IntegrationProvider) {
    const integration = await this.healthIntegrationModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        provider,
      },
      {
        status: IntegrationStatus.DISCONNECTED,
        isActive: false,
        authTokens: {},
      },
      { new: true },
    );

    if (!integration) {
      throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
    }

    return {
      success: true,
      provider,
      status: IntegrationStatus.DISCONNECTED,
    };
  }
}