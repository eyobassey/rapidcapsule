import {
  Controller,
  Post,
  Body,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  HealthIntegration,
  HealthIntegrationDocument,
  IntegrationProvider,
  IntegrationStatus,
} from './schemas/health-integration.schema';
import {
  HealthData,
  HealthDataDocument,
} from './schemas/health-data.schema';
import { OWUserMapping, OWUserMappingDocument } from './schemas/ow-user-mapping.schema';
import { SyncLog, SyncLogDocument, SyncType, SyncStatus } from './schemas/sync-log.schema';
import { HealthIntegrationsService } from './health-integrations.service';
import { WebsocketGateway } from '../../core/websocket/websocket.gateway';
import { RawHealthData } from './providers/health-provider.interface';

@ApiTags('Health Integrations Webhooks')
@Controller('health-integrations/webhooks')
export class HealthIntegrationsWebhookController {
  private readonly logger = new Logger(HealthIntegrationsWebhookController.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(HealthIntegration.name)
    private healthIntegrationModel: Model<HealthIntegrationDocument>,
    @InjectModel(HealthData.name)
    private healthDataModel: Model<HealthDataDocument>,
    @InjectModel(OWUserMapping.name)
    private owUserMappingModel: Model<OWUserMappingDocument>,
    @InjectModel(SyncLog.name)
    private syncLogModel: Model<SyncLogDocument>,
    private healthIntegrationsService: HealthIntegrationsService,
    private websocketGateway: WebsocketGateway,
  ) {}

  @Post('open-wearables')
  @Throttle({ default: { ttl: 60000, limit: 60 } })
  @ApiOperation({ summary: 'Receive Open Wearables webhook', description: 'Receive and process health data webhook from Open Wearables sidecar, validates signature, maps data types, and syncs to vitals' })
  @ApiResponse({ status: 200, description: 'Webhook data processed' })
  @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
  @ApiResponse({ status: 400, description: 'Invalid payload structure' })
  async handleOWWebhook(
    @Body() payload: any,
    @Headers('x-ow-signature') signature: string,
  ) {
    // Validate webhook signature
    this.validateWebhookSignature(payload, signature);

    // Validate payload structure
    this.validateWebhookPayload(payload);

    const { user_id: owUserId, provider, event_type, data } = payload;

    // Map OW user → RC user
    const mapping = await this.owUserMappingModel.findOne({ owUserId });
    if (!mapping) {
      this.logger.warn(`Webhook received for unknown OW user: ${owUserId}`);
      return { received: true, processed: false, reason: 'unknown_user' };
    }

    const rcUserId = mapping.userId.toString();

    // Find the integration
    const integration = await this.healthIntegrationModel.findOne({
      userId: mapping.userId,
      provider,
      status: IntegrationStatus.CONNECTED,
    });

    if (!integration) {
      this.logger.warn(`No active integration for user ${rcUserId}, provider ${provider}`);
      return { received: true, processed: false, reason: 'no_integration' };
    }

    // Create sync log
    const syncLog = new this.syncLogModel({
      userId: mapping.userId,
      integrationId: integration._id,
      provider,
      syncType: SyncType.WEBHOOK,
      status: SyncStatus.STARTED,
      startedAt: new Date(),
    });
    await syncLog.save();

    try {
      // Process the incoming data
      const healthDataItems = this.mapOWWebhookData(data, provider);
      let syncedToVitals = 0;

      for (const item of healthDataItems) {
        const healthData = new this.healthDataModel({
          userId: mapping.userId,
          integrationId: integration._id,
          source: provider,
          dataType: item.dataType,
          value: item.value,
          recordedAt: item.recordedAt,
          syncedAt: new Date(),
          metadata: item.metadata,
        });
        await healthData.save();

        // Auto-sync to vitals if enabled
        if (integration.syncSettings?.autoSync) {
          const vital = await this.healthIntegrationsService.syncToVitals(healthData);
          if (vital) syncedToVitals++;
        }
      }

      // Update sync log
      syncLog.status = SyncStatus.COMPLETED;
      syncLog.recordsProcessed = healthDataItems.length;
      syncLog.recordsSyncedToVitals = syncedToVitals;
      syncLog.completedAt = new Date();
      await syncLog.save();

      // Update integration last sync
      integration.lastSyncedAt = new Date();
      await integration.save();

      // Notify user via WebSocket
      this.websocketGateway.emitToUser(rcUserId, 'health:data:new', {
        provider,
        count: healthDataItems.length,
        syncedToVitals,
      });

      return {
        received: true,
        processed: true,
        recordsProcessed: healthDataItems.length,
      };
    } catch (error) {
      syncLog.status = SyncStatus.FAILED;
      syncLog.error = error.message;
      syncLog.completedAt = new Date();
      await syncLog.save();

      this.logger.error(`Webhook processing failed: ${error.message}`);
      throw new HttpException('Webhook processing failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private validateWebhookSignature(payload: any, signature: string) {
    const secret = this.configService.get('OW_WEBHOOK_SECRET');
    if (!secret) {
      this.logger.warn('OW_WEBHOOK_SECRET not configured — skipping signature validation');
      return;
    }

    if (!signature) {
      throw new HttpException('Missing webhook signature', HttpStatus.UNAUTHORIZED);
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new HttpException('Invalid webhook signature', HttpStatus.UNAUTHORIZED);
    }
  }

  private validateWebhookPayload(payload: any) {
    if (!payload || typeof payload !== 'object') {
      throw new HttpException('Invalid webhook payload', HttpStatus.BAD_REQUEST);
    }

    if (!payload.user_id || typeof payload.user_id !== 'string') {
      throw new HttpException('Missing or invalid user_id in payload', HttpStatus.BAD_REQUEST);
    }

    if (!payload.provider || typeof payload.provider !== 'string') {
      throw new HttpException('Missing or invalid provider in payload', HttpStatus.BAD_REQUEST);
    }

    if (!Array.isArray(payload.data)) {
      throw new HttpException('Missing or invalid data array in payload', HttpStatus.BAD_REQUEST);
    }

    // Limit payload size: max 500 data points per webhook
    if (payload.data.length > 500) {
      throw new HttpException(
        'Payload too large: maximum 500 data points per webhook',
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }
  }

  private mapOWWebhookData(data: any[], provider: string): RawHealthData[] {
    if (!Array.isArray(data)) return [];

    const typeMapping: Record<string, string> = {
      'heart_rate': 'heart_rate',
      'heart_rate_variability': 'heart_rate',
      'steps': 'steps',
      'calories_active': 'calories_burned',
      'distance': 'distance',
      'spo2': 'oxygen_saturation',
      'stress': 'stress_level',
      'respiration_rate': 'respiratory_rate',
      'body_weight': 'weight',
      'body_temperature': 'body_temperature',
      'blood_pressure_systolic': 'blood_pressure',
      'blood_glucose': 'blood_glucose',
    };

    return data
      .filter((item) => item && typeof item.type === 'string' && typeMapping[item.type])
      .filter((item) => {
        // Validate value is a finite number
        const val = Number(item.value);
        if (!Number.isFinite(val)) return false;
        // Validate timestamp produces a valid date
        const date = new Date(item.timestamp);
        if (isNaN(date.getTime())) return false;
        // Reject future timestamps (> 1 hour ahead)
        if (date.getTime() > Date.now() + 3600000) return false;
        return true;
      })
      .map((item) => ({
        dataType: typeMapping[item.type],
        value: {
          primary: Number(item.value),
          unit: typeof item.unit === 'string' ? item.unit.slice(0, 20) : '',
        },
        recordedAt: new Date(item.timestamp),
        metadata: {
          externalId: `ow_webhook_${item.timestamp}`,
          deviceType: provider,
        },
      }));
  }
}
