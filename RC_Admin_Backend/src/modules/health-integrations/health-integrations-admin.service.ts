import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  HealthIntegration,
  HealthIntegrationDocument,
} from './entities/health-integration.entity';
import {
  SyncLog,
  SyncLogDocument,
} from './entities/sync-log.entity';

@Injectable()
export class HealthIntegrationsAdminService {
  constructor(
    @InjectModel(HealthIntegration.name)
    private healthIntegrationModel: Model<HealthIntegrationDocument>,
    @InjectModel(SyncLog.name)
    private syncLogModel: Model<SyncLogDocument>,
  ) {}

  async getPatientIntegrations(patientId: string) {
    return this.healthIntegrationModel
      .find({ userId: new Types.ObjectId(patientId) })
      .sort({ updatedAt: -1 });
  }

  async getPatientSyncLogs(patientId: string, limit = 50) {
    return this.syncLogModel
      .find({ userId: new Types.ObjectId(patientId) })
      .sort({ startedAt: -1 })
      .limit(limit);
  }

  async getOverviewStats() {
    const [
      totalIntegrations,
      connectedIntegrations,
      errorIntegrations,
      providerBreakdown,
      recentSyncs,
    ] = await Promise.all([
      this.healthIntegrationModel.countDocuments(),
      this.healthIntegrationModel.countDocuments({ status: 'connected', isActive: true }),
      this.healthIntegrationModel.countDocuments({ status: 'error' }),
      this.healthIntegrationModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$provider', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.syncLogModel
        .find()
        .sort({ startedAt: -1 })
        .limit(20)
        .populate('userId', 'email profile.first_name profile.last_name'),
    ]);

    const failedSyncsLast24h = await this.syncLogModel.countDocuments({
      status: 'failed',
      startedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    return {
      totalIntegrations,
      connectedIntegrations,
      errorIntegrations,
      failedSyncsLast24h,
      providerBreakdown,
      recentSyncs,
    };
  }

  async disconnectIntegration(integrationId: string) {
    return this.healthIntegrationModel.findByIdAndUpdate(
      integrationId,
      {
        status: 'disconnected',
        isActive: false,
        authTokens: {},
      },
      { new: true },
    );
  }
}
