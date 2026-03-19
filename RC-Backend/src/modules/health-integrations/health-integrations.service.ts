import { Injectable, HttpException, HttpStatus, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  HealthIntegration,
  HealthIntegrationDocument,
  IntegrationProvider,
  IntegrationStatus,
  ProviderType,
} from './schemas/health-integration.schema';
import {
  HealthData,
  HealthDataDocument,
  HealthDataType,
} from './schemas/health-data.schema';
import {
  SyncLog,
  SyncLogDocument,
  SyncType,
  SyncStatus,
} from './schemas/sync-log.schema';
import { ConnectIntegrationDto } from './dto/connect-integration.dto';
import { SyncHealthDataDto } from './dto/sync-health-data.dto';
import { UpdateSyncSettingsDto } from './dto/update-sync-settings.dto';
import { VitalsService } from '../vitals/vitals.service';
import { ProviderRegistry } from './providers/provider.registry';
import { GoogleFitProvider } from './providers/google-fit.provider';
import { SamsungHealthProvider } from './providers/samsung-health.provider';
import { AppleHealthProvider } from './providers/apple-health.provider';
import { RawHealthData } from './providers/health-provider.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OWClientService } from './providers/ow/ow-client.service';
import { GarminProvider } from './providers/ow/garmin.provider';
import { PolarProvider } from './providers/ow/polar.provider';
import { SuuntoProvider } from './providers/ow/suunto.provider';
import { WhoopProvider } from './providers/ow/whoop.provider';

// Default data types to fetch per provider
const DEFAULT_DATA_TYPES: Record<string, string[]> = {
  [IntegrationProvider.GOOGLE_FIT]: [
    'heart_rate', 'steps', 'weight', 'blood_pressure', 'blood_glucose',
    'sleep', 'calories_burned', 'distance', 'oxygen_saturation', 'body_temperature',
    'body_fat', 'active_minutes', 'hydration', 'muscle_mass', 'bone_mass', 'body_water', 'visceral_fat', 'bmr',
  ],
  [IntegrationProvider.APPLE_HEALTH]: [
    'heart_rate', 'steps', 'weight', 'blood_pressure', 'blood_glucose',
    'sleep', 'calories_burned', 'distance', 'oxygen_saturation', 'body_temperature',
    'respiratory_rate', 'body_fat', 'active_minutes', 'hydration', 'muscle_mass', 'bone_mass', 'body_water', 'visceral_fat', 'bmr',
  ],
};

// Providers that route through Open Wearables sidecar
const OW_PROVIDERS = new Set([
  IntegrationProvider.GARMIN,
  IntegrationProvider.POLAR,
  IntegrationProvider.SUUNTO,
  IntegrationProvider.WHOOP,
]);

@Injectable()
export class HealthIntegrationsService implements OnModuleInit {
  private readonly logger = new Logger(HealthIntegrationsService.name);

  constructor(
    @InjectModel(HealthIntegration.name)
    private healthIntegrationModel: Model<HealthIntegrationDocument>,
    @InjectModel(HealthData.name)
    private healthDataModel: Model<HealthDataDocument>,
    @InjectModel(SyncLog.name)
    private syncLogModel: Model<SyncLogDocument>,
    private vitalsService: VitalsService,
    private providerRegistry: ProviderRegistry,
    private googleFitProvider: GoogleFitProvider,
    private samsungHealthProvider: SamsungHealthProvider,
    private appleHealthProvider: AppleHealthProvider,
    private owClientService: OWClientService,
    private garminProvider: GarminProvider,
    private polarProvider: PolarProvider,
    private suuntoProvider: SuuntoProvider,
    private whoopProvider: WhoopProvider,
    private eventEmitter: EventEmitter2,
  ) {}

  async onModuleInit() {
    // Register direct providers
    this.providerRegistry.register(this.googleFitProvider);
    this.providerRegistry.register(this.samsungHealthProvider);
    this.providerRegistry.register(this.appleHealthProvider);

    // Register OW-proxied providers (only if OW sidecar is configured)
    if (this.owClientService.isConfigured()) {
      const owAvailable = await this.owClientService.isAvailable();
      if (owAvailable) {
        this.providerRegistry.register(this.garminProvider);
        this.providerRegistry.register(this.polarProvider);
        this.providerRegistry.register(this.suuntoProvider);
        this.providerRegistry.register(this.whoopProvider);
        this.logger.log('Open Wearables sidecar is available — OW providers registered');
      } else {
        this.logger.warn('Open Wearables sidecar is configured but not reachable — OW providers skipped');
      }
    } else {
      this.logger.log('Open Wearables not configured — OW providers skipped');
    }

    this.logger.log(
      `Health providers registered: ${this.providerRegistry.getAllProviderNames().join(', ')}`,
    );
    this.logger.log(
      `Available providers: ${this.providerRegistry.getAvailableProviderNames().join(', ') || 'none'}`,
    );
  }

  // ─── Query Methods ──────────────────────────────────────────────

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

  async getAvailableProviders() {
    return this.providerRegistry.getAvailableProviders().map((p) => ({
      name: p.providerName,
      supportsWebhook: p.supportsWebhook(),
      providerType: OW_PROVIDERS.has(p.providerName as IntegrationProvider)
        ? ProviderType.OPEN_WEARABLES
        : ProviderType.DIRECT,
    }));
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
      if (filters.startDate) query.recordedAt.$gte = filters.startDate;
      if (filters.endDate) query.recordedAt.$lte = filters.endDate;
    }

    return this.healthDataModel
      .find(query)
      .sort({ recordedAt: -1 })
      .limit(100)
      .populate('integrationId', 'provider metadata');
  }

  async getSyncLogs(userId: string, limit = 20) {
    return this.syncLogModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ startedAt: -1 })
      .limit(limit);
  }

  // ─── Connection Methods ─────────────────────────────────────────

  async connectIntegration(userId: string, connectDto: ConnectIntegrationDto) {
    const existingIntegration = await this.healthIntegrationModel.findOne({
      userId: new Types.ObjectId(userId),
      provider: connectDto.provider,
    });

    if (existingIntegration && existingIntegration.status === IntegrationStatus.CONNECTED) {
      throw new HttpException('Integration already connected', HttpStatus.BAD_REQUEST);
    }

    const provider = this.providerRegistry.getProvider(connectDto.provider);
    if (!provider || !provider.isAvailable()) {
      throw new HttpException(
        `Provider ${connectDto.provider} is not available`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const state = Buffer.from(`${userId}:${connectDto.provider}:${Date.now()}`).toString('base64');
    const authUrl = await provider.getAuthUrl(userId, state);

    // Apple Health (and other push-based) don't return an auth URL
    if (authUrl === null) {
      return {
        provider: connectDto.provider,
        requiresNativeApp: true,
        instructions: 'Please use the Rapid Capsule mobile app to connect this provider',
      };
    }

    const providerType = OW_PROVIDERS.has(connectDto.provider)
      ? ProviderType.OPEN_WEARABLES
      : ProviderType.DIRECT;

    await this.healthIntegrationModel.findOneAndUpdate(
      {
        userId: new Types.ObjectId(userId),
        provider: connectDto.provider,
      },
      {
        status: IntegrationStatus.PENDING,
        providerType,
        metadata: {
          ...connectDto.metadata,
          syncFrequency: connectDto.metadata?.syncFrequency || 'hourly',
          dataTypes: connectDto.dataTypes?.length
            ? connectDto.dataTypes
            : DEFAULT_DATA_TYPES[connectDto.provider] || [],
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
      provider: connectDto.provider,
    };
  }

  async handleOAuthCallback(userId: string, providerName: string, code: string) {
    const provider = this.providerRegistry.getProvider(providerName);
    if (!provider) {
      throw new HttpException(`Unknown provider: ${providerName}`, HttpStatus.BAD_REQUEST);
    }

    try {
      const tokens = await provider.exchangeToken(code);

      const integration = await this.healthIntegrationModel.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          provider: providerName,
        },
        {
          status: IntegrationStatus.CONNECTED,
          authTokens: {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresAt: tokens.expiresAt,
          },
          lastSyncedAt: new Date(),
        },
        { new: true },
      );

      // Trigger initial sync if we have data types configured
      if (integration && integration.metadata?.dataTypes?.length) {
        this.syncProviderData(integration, SyncType.MANUAL).catch((err) =>
          this.logger.error(`Initial sync failed for ${providerName}: ${err.message}`),
        );
      }

      return {
        success: true,
        provider: providerName,
        status: IntegrationStatus.CONNECTED,
      };
    } catch (error) {
      this.logger.error(`OAuth callback error for ${providerName}: ${error.message}`);

      await this.healthIntegrationModel.findOneAndUpdate(
        { userId: new Types.ObjectId(userId), provider: providerName },
        { status: IntegrationStatus.ERROR },
      );

      throw new HttpException(
        `Failed to connect ${providerName}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async handleAppleHealthCallback(userId: string, authData: any) {
    try {
      const integration = await this.healthIntegrationModel.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          provider: IntegrationProvider.APPLE_HEALTH,
        },
        {
          status: IntegrationStatus.CONNECTED,
          providerType: ProviderType.DIRECT,
          metadata: {
            ...authData.metadata,
            deviceId: authData.deviceId,
          },
          lastSyncedAt: new Date(),
        },
        { upsert: true, new: true },
      );

      return {
        success: true,
        provider: IntegrationProvider.APPLE_HEALTH,
        status: IntegrationStatus.CONNECTED,
      };
    } catch (error) {
      this.logger.error(`Apple Health callback error: ${error.message}`);
      throw new HttpException(
        'Failed to connect Apple Health',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ─── Sync Methods ───────────────────────────────────────────────

  async syncHealthData(userId: string, providerName: IntegrationProvider, syncDto: SyncHealthDataDto) {
    const integration = await this.healthIntegrationModel.findOne({
      userId: new Types.ObjectId(userId),
      provider: providerName,
      status: IntegrationStatus.CONNECTED,
    });

    if (!integration) {
      throw new HttpException('Integration not connected', HttpStatus.BAD_REQUEST);
    }

    // Apple Health: process pushed data directly
    if (providerName === IntegrationProvider.APPLE_HEALTH && syncDto.healthData) {
      return this.processAppleHealthPush(integration, syncDto);
    }

    return this.syncProviderData(integration, SyncType.MANUAL, syncDto);
  }

  async syncProviderData(
    integration: HealthIntegrationDocument,
    syncType: SyncType,
    syncDto?: SyncHealthDataDto,
  ) {
    const provider = this.providerRegistry.getProvider(integration.provider);
    if (!provider) {
      throw new HttpException(`Provider ${integration.provider} not registered`, HttpStatus.BAD_REQUEST);
    }

    // Create sync log entry
    const syncLog = new this.syncLogModel({
      userId: integration.userId,
      integrationId: integration._id,
      provider: integration.provider,
      syncType,
      status: SyncStatus.STARTED,
      dataTypes: syncDto?.dataTypes || integration.metadata?.dataTypes || [],
      startedAt: new Date(),
    });
    await syncLog.save();

    try {
      // Refresh token if expired or expiring within 2 minutes
      await this.ensureValidToken(integration, provider);

      const dataTypes = syncDto?.dataTypes || integration.metadata?.dataTypes || [];
      const startDate = syncDto?.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = syncDto?.endDate || new Date();

      const rawData = await provider.fetchHealthData(integration, dataTypes, startDate, endDate);

      let recordsSyncedToVitals = 0;
      for (const data of rawData) {
        const healthData = await this.saveHealthData(integration, data);
        if (healthData?.isSyncedToVitals) recordsSyncedToVitals++;
      }

      // Update sync log
      syncLog.status = SyncStatus.COMPLETED;
      syncLog.recordsProcessed = rawData.length;
      syncLog.recordsSyncedToVitals = recordsSyncedToVitals;
      syncLog.completedAt = new Date();
      await syncLog.save();

      // Update integration last sync
      integration.lastSyncedAt = new Date();
      await integration.save();

      // Emit event for health insights trigger
      if (recordsSyncedToVitals > 0) {
        this.eventEmitter.emit('health_data.synced', {
          userId: integration.userId.toString(),
          provider: integration.provider,
          dataTypes: rawData.map((d: any) => d.data_type).filter(Boolean),
        });
      }

      return {
        provider: integration.provider,
        syncedCount: rawData.length,
        syncedToVitals: recordsSyncedToVitals,
        lastSyncedAt: integration.lastSyncedAt,
      };
    } catch (error) {
      syncLog.status = SyncStatus.FAILED;
      syncLog.error = error.message;
      syncLog.completedAt = new Date();
      await syncLog.save();

      this.logger.error(`Sync failed for ${integration.provider}: ${error.message}`);
      throw error;
    }
  }

  private async processAppleHealthPush(
    integration: HealthIntegrationDocument,
    syncDto: SyncHealthDataDto,
  ) {
    const incomingData = this.appleHealthProvider.processIncomingData(syncDto.healthData || []);
    let recordsSyncedToVitals = 0;

    for (const data of incomingData) {
      const healthData = await this.saveHealthData(integration, data);
      if (healthData?.isSyncedToVitals) recordsSyncedToVitals++;
    }

    integration.lastSyncedAt = new Date();
    await integration.save();

    return {
      provider: IntegrationProvider.APPLE_HEALTH,
      syncedCount: incomingData.length,
      syncedToVitals: recordsSyncedToVitals,
      lastSyncedAt: integration.lastSyncedAt,
    };
  }

  private async saveHealthData(
    integration: HealthIntegrationDocument,
    rawData: RawHealthData,
  ): Promise<HealthDataDocument> {
    // Deduplicate: skip if same user+source+dataType+recordedAt+value already exists
    const existing = await this.healthDataModel.findOne({
      userId: integration.userId,
      source: integration.provider,
      dataType: rawData.dataType,
      recordedAt: rawData.recordedAt,
      'value.primary': rawData.value.primary,
    });

    if (existing) {
      return existing;
    }

    const healthData = new this.healthDataModel({
      userId: integration.userId,
      integrationId: integration._id,
      source: integration.provider,
      dataType: rawData.dataType,
      value: rawData.value,
      recordedAt: rawData.recordedAt,
      syncedAt: new Date(),
      metadata: rawData.metadata,
    });

    await healthData.save();

    // Auto-sync to vitals if enabled
    if (integration.syncSettings?.autoSync) {
      await this.syncToVitals(healthData);
    }

    // Recovery critical vitals check (overdose/withdrawal detection)
    this.checkCriticalVitals(
      integration.userId.toString(),
      rawData.dataType,
      rawData.value?.primary,
      rawData.value,
    );

    return healthData;
  }

  /**
   * Post-sync hook: check for critical vital signs that may indicate
   * opioid overdose, alcohol withdrawal, or inactivity emergency.
   * Emits events consumed by the recovery CrisisInterventionService.
   */
  private checkCriticalVitals(
    userId: string,
    dataType: string,
    primaryValue: number | undefined,
    fullValue: any,
  ) {
    if (primaryValue === undefined || primaryValue === null) return;

    // Opioid overdose indicators
    if (dataType === HealthDataType.OXYGEN_SATURATION && primaryValue < 92) {
      this.logger.warn(
        `CRITICAL: SpO2 ${primaryValue}% for user ${userId} — possible opioid overdose`,
      );
      this.eventEmitter.emit('recovery.wearable_crisis', {
        userId,
        crisisType: 'overdose_suspected',
        triggerSource: 'wearable_spo2',
        severity: primaryValue < 85 ? 'life_threatening' : 'high',
        detectionData: {
          vital_type: 'spo2',
          value: primaryValue,
          threshold: 92,
          unit: '%',
        },
      });
    }

    if (dataType === HealthDataType.RESPIRATORY_RATE && primaryValue < 10) {
      this.logger.warn(
        `CRITICAL: Respiratory rate ${primaryValue}/min for user ${userId} — possible opioid overdose`,
      );
      this.eventEmitter.emit('recovery.wearable_crisis', {
        userId,
        crisisType: 'overdose_suspected',
        triggerSource: 'wearable_respiratory_rate',
        severity: primaryValue < 6 ? 'life_threatening' : 'high',
        detectionData: {
          vital_type: 'respiratory_rate',
          value: primaryValue,
          threshold: 10,
          unit: 'breaths/min',
        },
      });
    }

    // Alcohol withdrawal indicator
    if (dataType === HealthDataType.HEART_RATE && primaryValue > 130) {
      this.logger.warn(
        `WARNING: Heart rate ${primaryValue}bpm for user ${userId} — possible withdrawal tachycardia`,
      );
      this.eventEmitter.emit('recovery.wearable_crisis', {
        userId,
        crisisType: 'severe_withdrawal',
        triggerSource: 'wearable_heart_rate',
        severity: primaryValue > 160 ? 'life_threatening' : 'high',
        detectionData: {
          vital_type: 'heart_rate',
          value: primaryValue,
          threshold: 130,
          unit: 'bpm',
        },
      });
    }

    // Inactivity check: 0 steps for extended period
    if (dataType === HealthDataType.STEPS && primaryValue === 0) {
      const recordedHour = fullValue?.metadata?.hour || new Date().getHours();
      // Only alert during waking hours (8AM-10PM) for 6+ hour zero-step windows
      if (recordedHour >= 8 && recordedHour <= 22) {
        this.eventEmitter.emit('recovery.wearable_wellness_check', {
          userId,
          triggerSource: 'wearable_inactivity',
          detectionData: {
            vital_type: 'steps',
            value: 0,
            note: 'Zero steps detected during waking hours',
          },
        });
      }
    }
  }

  // ─── Vitals Sync ────────────────────────────────────────────────

  private readonly vitalTypeMapping: Record<string, string> = {
    [HealthDataType.HEART_RATE]: 'pulse_rate',
    [HealthDataType.BLOOD_PRESSURE]: 'blood_pressure',
    [HealthDataType.BLOOD_GLUCOSE]: 'blood_sugar_level',
    [HealthDataType.BODY_TEMPERATURE]: 'body_temp',
    [HealthDataType.WEIGHT]: 'body_weight',
    [HealthDataType.OXYGEN_SATURATION]: 'spo2',
    [HealthDataType.STEPS]: 'steps',
    [HealthDataType.SLEEP]: 'sleep',
    [HealthDataType.CALORIES_BURNED]: 'calories_burned',
    [HealthDataType.DISTANCE]: 'distance',
    [HealthDataType.RESPIRATORY_RATE]: 'respiratory_rate',
    [HealthDataType.STRESS_LEVEL]: 'stress_level',
    [HealthDataType.BODY_FAT]: 'body_fat',
    [HealthDataType.ACTIVE_MINUTES]: 'active_minutes',
    [HealthDataType.HYDRATION]: 'hydration',
    [HealthDataType.MUSCLE_MASS]: 'muscle_mass',
    [HealthDataType.BONE_MASS]: 'bone_mass',
    [HealthDataType.BODY_WATER]: 'body_water',
    [HealthDataType.VISCERAL_FAT]: 'visceral_fat',
    [HealthDataType.BMR]: 'bmr',
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
    'com.google.distance.delta': 'km',
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

  private normalizeUnit(rawUnit: string): string {
    return this.unitMapping[rawUnit] || rawUnit;
  }

  // Round numeric values to sensible precision based on vital type
  private readonly integerVitals = new Set([
    'steps', 'calories_burned', 'active_minutes', 'bmr', 'pulse_rate', 'stress_level',
  ]);

  private formatVitalValue(raw: number | undefined, vitalType: string): string {
    if (raw === undefined || raw === null) return '';
    if (this.integerVitals.has(vitalType)) return Math.round(raw).toString();
    // 1 decimal for most vitals (weight, body_fat, sleep, etc.)
    return parseFloat(raw.toFixed(1)).toString();
  }

  async syncToVitals(healthData: HealthDataDocument) {
    const vitalType = this.vitalTypeMapping[healthData.dataType];
    if (!vitalType) return;

    try {
      const vitalEntry = {
        value: this.formatVitalValue(healthData.value.primary, vitalType),
        unit: this.normalizeUnit(healthData.value.unit || ''),
        updatedAt: healthData.recordedAt,
      };

      const vitalData = { [vitalType]: vitalEntry };

      const vital = await this.vitalsService.createVitals(
        vitalData as any,
        new Types.ObjectId(healthData.userId.toString()),
      );

      healthData.isSyncedToVitals = true;
      healthData.vitalId = vital._id;
      await healthData.save();

      return vital;
    } catch (error) {
      this.logger.error(`Error syncing to vitals: ${error.message}`);
    }
  }

  async pushToVitals(userId: string, dataIds: string[]) {
    const healthDataItems = await this.healthDataModel.find({
      _id: { $in: dataIds.map((id) => new Types.ObjectId(id)) },
      userId: new Types.ObjectId(userId),
      isSyncedToVitals: false,
    });

    const syncResults: Array<{ healthDataId: any; vitalId: any; dataType: HealthDataType }> = [];

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

    return { syncedCount: syncResults.length, results: syncResults };
  }

  // ─── Token Refresh ──────────────────────────────────────────────

  /**
   * Check if token is expired or near expiry, and refresh if needed.
   * Called before any provider API call to avoid mid-request failures.
   */
  private async ensureValidToken(
    integration: HealthIntegrationDocument,
    provider: any,
  ) {
    if (!integration.authTokens?.expiresAt || !integration.authTokens?.refreshToken) {
      return; // No expiry info or no refresh token (e.g. Apple Health)
    }

    const twoMinutesFromNow = new Date(Date.now() + 2 * 60 * 1000);
    if (new Date(integration.authTokens.expiresAt) > twoMinutesFromNow) {
      return; // Token still valid
    }

    this.logger.log(`Token expiring soon for ${integration.provider}, refreshing...`);
    try {
      const tokens = await provider.refreshToken(integration);
      integration.authTokens.accessToken = tokens.accessToken;
      integration.authTokens.refreshToken = tokens.refreshToken || integration.authTokens.refreshToken;
      integration.authTokens.expiresAt = tokens.expiresAt;
      await integration.save();
    } catch (error) {
      this.logger.error(`Pre-call token refresh failed for ${integration.provider}: ${error.message}`);
      throw new HttpException('Token refresh failed — please reconnect', HttpStatus.UNAUTHORIZED);
    }
  }

  async refreshExpiredTokens() {
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

    const expiringIntegrations = await this.healthIntegrationModel.find({
      status: IntegrationStatus.CONNECTED,
      isActive: true,
      'authTokens.expiresAt': { $lt: fiveMinutesFromNow },
      'authTokens.refreshToken': { $exists: true, $ne: null },
    });

    this.logger.log(`Found ${expiringIntegrations.length} integrations needing token refresh`);

    for (const integration of expiringIntegrations) {
      try {
        const provider = this.providerRegistry.getProvider(integration.provider);
        if (!provider) continue;

        const tokens = await provider.refreshToken(integration);

        await this.healthIntegrationModel.findByIdAndUpdate(integration._id, {
          'authTokens.accessToken': tokens.accessToken,
          'authTokens.refreshToken': tokens.refreshToken || integration.authTokens.refreshToken,
          'authTokens.expiresAt': tokens.expiresAt,
        });

        this.logger.log(`Refreshed token for ${integration.provider} (user: ${integration.userId})`);
      } catch (error) {
        this.logger.error(
          `Token refresh failed for ${integration.provider} (user: ${integration.userId}): ${error.message}`,
        );

        await this.healthIntegrationModel.findByIdAndUpdate(integration._id, {
          status: IntegrationStatus.ERROR,
        });
      }
    }
  }

  // ─── Settings & Disconnect ──────────────────────────────────────

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

  async disconnectIntegration(userId: string, providerName: IntegrationProvider) {
    const integration = await this.healthIntegrationModel.findOne({
      userId: new Types.ObjectId(userId),
      provider: providerName,
    });

    if (!integration) {
      throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
    }

    // Attempt to revoke access at the provider
    const provider = this.providerRegistry.getProvider(providerName);
    if (provider) {
      try {
        await provider.revokeAccess(integration);
      } catch (error) {
        this.logger.warn(`Provider-side revocation failed for ${providerName}: ${error.message}`);
      }
    }

    await this.healthIntegrationModel.findByIdAndUpdate(integration._id, {
      status: IntegrationStatus.DISCONNECTED,
      isActive: false,
      authTokens: {},
    });

    return {
      success: true,
      provider: providerName,
      status: IntegrationStatus.DISCONNECTED,
    };
  }

  // ─── Debug (keep for testing) ───────────────────────────────────

  async debugGoogleFitConfig() {
    const provider = this.providerRegistry.getProvider('google_fit') as GoogleFitProvider;
    if (!provider || !provider.isAvailable()) {
      return { available: false, message: 'Google Fit is not configured' };
    }

    const authUrl = await provider.getAuthUrl('debug', 'test123');
    return {
      available: true,
      authUrl,
      message: 'Check if the redirectUri matches exactly what you configured in Google Cloud Console',
    };
  }
}
