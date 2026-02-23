import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IHealthProvider, TokenResult, RawHealthData } from '../health-provider.interface';
import { HealthIntegrationDocument } from '../../schemas/health-integration.schema';
import { OWClientService } from './ow-client.service';
import { OWUserMapping, OWUserMappingDocument } from '../../schemas/ow-user-mapping.schema';

/**
 * Base class for providers that route through the Open Wearables sidecar.
 * Subclasses only need to specify providerName and data type mappings.
 */
export abstract class OWBaseProvider implements IHealthProvider {
  abstract readonly providerName: string;
  protected abstract readonly logger: Logger;

  /** Map from OW timeseries type → RapidCapsule HealthDataType value */
  protected abstract readonly dataTypeMapping: Record<string, string>;

  constructor(
    protected owClient: OWClientService,
    protected owUserMappingModel: Model<OWUserMappingDocument>,
  ) {}

  isAvailable(): boolean {
    return this.owClient.isConfigured() && this.owClient.getCachedAvailability();
  }

  async getAuthUrl(userId: string, state: string): Promise<string> {
    const owUserId = await this.getOrCreateOWUser(userId);
    return this.owClient.getAuthUrl(this.providerName, owUserId);
  }

  async exchangeToken(code: string): Promise<TokenResult> {
    // OW handles the token exchange internally via the OAuth redirect flow.
    // We just store a marker token indicating the connection is managed by OW.
    return {
      accessToken: 'ow_managed',
      expiresAt: new Date('2099-12-31'),
    };
  }

  async refreshToken(integration: HealthIntegrationDocument): Promise<TokenResult> {
    // OW manages token refresh internally
    return {
      accessToken: 'ow_managed',
      expiresAt: new Date('2099-12-31'),
    };
  }

  async fetchHealthData(
    integration: HealthIntegrationDocument,
    dataTypes: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<RawHealthData[]> {
    const owUserId = await this.getOWUserId(integration.userId.toString());
    if (!owUserId) {
      this.logger.warn(`No OW user mapping for RC user ${integration.userId}`);
      return [];
    }

    // Trigger a sync in OW first
    try {
      await this.owClient.syncUserData(this.providerName, owUserId);
    } catch (error) {
      this.logger.warn(`OW sync trigger failed for ${this.providerName}: ${error.message}`);
    }

    const results: RawHealthData[] = [];

    // Fetch timeseries data
    try {
      const timeseries = await this.owClient.getTimeseries(owUserId, {
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      });

      for (const item of timeseries.data || []) {
        const mappedType = this.dataTypeMapping[item.type];
        if (!mappedType) continue;
        if (dataTypes.length > 0 && !dataTypes.includes(mappedType) && !dataTypes.includes(item.type)) continue;

        results.push({
          dataType: mappedType,
          value: {
            primary: item.value,
            unit: item.unit,
          },
          recordedAt: new Date(item.timestamp),
          metadata: {
            externalId: `ow_${this.providerName}_${item.timestamp}`,
            deviceType: item.source || this.providerName,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error fetching timeseries from OW for ${this.providerName}: ${error.message}`);
    }

    return results;
  }

  async revokeAccess(integration: HealthIntegrationDocument): Promise<void> {
    const owUserId = await this.getOWUserId(integration.userId.toString());
    if (owUserId) {
      await this.owClient.disconnectProvider(this.providerName, owUserId);
    }
  }

  supportsWebhook(): boolean {
    return true;
  }

  // ─── OW User Mapping ─────────────────────────────────────────

  protected async getOrCreateOWUser(rcUserId: string): Promise<string> {
    const existing = await this.owUserMappingModel.findOne({
      userId: new Types.ObjectId(rcUserId),
    });

    if (existing) return existing.owUserId;

    // Create user in OW
    const owUser = await this.owClient.createUser(rcUserId);

    await this.owUserMappingModel.create({
      userId: new Types.ObjectId(rcUserId),
      owUserId: owUser.id,
    });

    return owUser.id;
  }

  protected async getOWUserId(rcUserId: string): Promise<string | null> {
    const mapping = await this.owUserMappingModel.findOne({
      userId: new Types.ObjectId(rcUserId),
    });
    return mapping?.owUserId || null;
  }
}
