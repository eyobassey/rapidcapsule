import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FraudAlert,
  FraudAlertDocument,
  FraudAlertType,
  FraudAlertSeverity,
  FraudAlertStatus,
  FraudAlertAction,
} from '../entities/fraud-alert.entity';
import { AuditLogService } from './audit-log.service';
import { AuditAction, AuditEntityType } from '../entities/audit-log.entity';

export interface CreateFraudAlertDto {
  alert_type: FraudAlertType;
  severity: FraudAlertSeverity;
  prescription?: string | Types.ObjectId;
  patient?: string | Types.ObjectId;
  patient_name?: string;
  patient_email?: string;
  order?: string | Types.ObjectId;
  pharmacy?: string | Types.ObjectId;
  description: string;
  evidence?: Record<string, any>;
  related_prescriptions?: string[];
  related_orders?: string[];
  risk_score?: number;
  risk_indicators?: string[];
  is_auto_generated?: boolean;
  detection_method?: string;
}

export interface FraudAlertQueryDto {
  status?: FraudAlertStatus;
  severity?: FraudAlertSeverity;
  alert_type?: FraudAlertType;
  patient?: string;
  assigned_to?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
}

export interface UpdateFraudAlertDto {
  status?: FraudAlertStatus;
  assigned_to?: string;
  resolution?: string;
}

@Injectable()
export class FraudAlertService {
  private readonly logger = new Logger(FraudAlertService.name);

  constructor(
    @InjectModel(FraudAlert.name)
    private fraudAlertModel: Model<FraudAlertDocument>,
    private auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateFraudAlertDto): Promise<FraudAlertDocument> {
    const alertData: any = {
      ...dto,
      prescription: dto.prescription
        ? new Types.ObjectId(dto.prescription)
        : undefined,
      patient: dto.patient ? new Types.ObjectId(dto.patient) : undefined,
      order: dto.order ? new Types.ObjectId(dto.order) : undefined,
      pharmacy: dto.pharmacy ? new Types.ObjectId(dto.pharmacy) : undefined,
      related_prescriptions: dto.related_prescriptions?.map(
        (id) => new Types.ObjectId(id),
      ),
      related_orders: dto.related_orders?.map((id) => new Types.ObjectId(id)),
    };

    const alert = new this.fraudAlertModel(alertData);
    const saved = await alert.save();

    // Log the creation
    await this.auditLogService.logCreate(
      AuditEntityType.PRESCRIPTION,
      saved._id,
      undefined,
      `Fraud alert created: ${dto.alert_type} - ${dto.severity}`,
      { alert_type: dto.alert_type, severity: dto.severity },
    );

    return saved;
  }

  async findAll(query: FraudAlertQueryDto): Promise<{
    docs: FraudAlertDocument[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const {
      status,
      severity,
      alert_type,
      patient,
      assigned_to,
      start_date,
      end_date,
      page = 1,
      limit = 20,
    } = query;

    const filter: any = {};

    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (alert_type) filter.alert_type = alert_type;
    if (patient) filter.patient = new Types.ObjectId(patient);
    if (assigned_to) filter.assigned_to = new Types.ObjectId(assigned_to);

    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) filter.created_at.$gte = new Date(start_date);
      if (end_date) filter.created_at.$lte = new Date(end_date);
    }

    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.fraudAlertModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('patient', 'profile.first_name profile.last_name email')
        .populate('assigned_to', 'profile.first_name profile.last_name')
        .lean()
        .exec(),
      this.fraudAlertModel.countDocuments(filter),
    ]);

    return {
      docs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<FraudAlertDocument> {
    const alert = await this.fraudAlertModel
      .findById(id)
      .populate('patient', 'profile.first_name profile.last_name email phone')
      .populate('assigned_to', 'profile.first_name profile.last_name email')
      .populate('resolved_by', 'profile.first_name profile.last_name')
      .lean()
      .exec();

    if (!alert) {
      throw new NotFoundException('Fraud alert not found');
    }

    return alert;
  }

  async update(
    id: string,
    dto: UpdateFraudAlertDto,
    userId: string,
    userName?: string,
  ): Promise<FraudAlertDocument> {
    const alert = await this.fraudAlertModel.findById(id);

    if (!alert) {
      throw new NotFoundException('Fraud alert not found');
    }

    const oldStatus = alert.status;

    if (dto.status) {
      alert.status = dto.status;

      if (
        dto.status === FraudAlertStatus.RESOLVED ||
        dto.status === FraudAlertStatus.FALSE_POSITIVE ||
        dto.status === FraudAlertStatus.CONFIRMED_FRAUD
      ) {
        alert.resolved_by = new Types.ObjectId(userId);
        alert.resolved_by_name = userName;
        alert.resolved_at = new Date();
      }
    }

    if (dto.assigned_to) {
      alert.assigned_to = new Types.ObjectId(dto.assigned_to);
      alert.assigned_at = new Date();
    }

    if (dto.resolution) {
      alert.resolution = dto.resolution;
    }

    alert.updated_at = new Date();
    const saved = await alert.save();

    // Log the update
    await this.auditLogService.logStatusChange(
      AuditEntityType.PRESCRIPTION,
      saved._id,
      oldStatus,
      dto.status || oldStatus,
      new Types.ObjectId(userId),
      `Fraud alert updated`,
    );

    return saved;
  }

  async addAction(
    id: string,
    action: string,
    userId: string,
    userName?: string,
    notes?: string,
  ): Promise<FraudAlertDocument> {
    const alert = await this.fraudAlertModel.findById(id);

    if (!alert) {
      throw new NotFoundException('Fraud alert not found');
    }

    const actionEntry: FraudAlertAction = {
      action,
      performed_by: new Types.ObjectId(userId),
      performed_by_name: userName,
      performed_at: new Date(),
      notes,
    };

    alert.actions.push(actionEntry);
    alert.updated_at = new Date();

    return await alert.save();
  }

  async assignTo(
    id: string,
    assigneeId: string,
    assigneeName: string,
    assignedBy: string,
  ): Promise<FraudAlertDocument> {
    const alert = await this.fraudAlertModel.findById(id);

    if (!alert) {
      throw new NotFoundException('Fraud alert not found');
    }

    alert.assigned_to = new Types.ObjectId(assigneeId);
    alert.assigned_to_name = assigneeName;
    alert.assigned_at = new Date();
    alert.status = FraudAlertStatus.INVESTIGATING;
    alert.updated_at = new Date();

    await this.addAction(
      id,
      'Assigned for investigation',
      assignedBy,
      undefined,
      `Assigned to ${assigneeName}`,
    );

    return await alert.save();
  }

  async resolve(
    id: string,
    status: FraudAlertStatus.RESOLVED | FraudAlertStatus.FALSE_POSITIVE | FraudAlertStatus.CONFIRMED_FRAUD,
    resolution: string,
    userId: string,
    userName?: string,
  ): Promise<FraudAlertDocument> {
    const alert = await this.fraudAlertModel.findById(id);

    if (!alert) {
      throw new NotFoundException('Fraud alert not found');
    }

    alert.status = status;
    alert.resolution = resolution;
    alert.resolved_by = new Types.ObjectId(userId);
    alert.resolved_by_name = userName;
    alert.resolved_at = new Date();
    alert.updated_at = new Date();

    await this.addAction(id, `Resolved as ${status}`, userId, userName, resolution);

    return await alert.save();
  }

  async blockPatient(
    id: string,
    userId: string,
    userName?: string,
  ): Promise<FraudAlertDocument> {
    const alert = await this.fraudAlertModel.findById(id);

    if (!alert) {
      throw new NotFoundException('Fraud alert not found');
    }

    alert.patient_blocked = true;
    alert.patient_blocked_at = new Date();
    alert.updated_at = new Date();

    await this.addAction(
      id,
      'Patient account blocked',
      userId,
      userName,
      'Patient blocked due to fraud alert',
    );

    return await alert.save();
  }

  async getStats(): Promise<{
    total: number;
    by_status: Record<string, number>;
    by_severity: Record<string, number>;
    by_type: Record<string, number>;
    new_today: number;
    resolved_today: number;
    avg_resolution_time_hours: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      total,
      byStatus,
      bySeverity,
      byType,
      newToday,
      resolvedToday,
      resolutionTimes,
    ] = await Promise.all([
      this.fraudAlertModel.countDocuments(),
      this.fraudAlertModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.fraudAlertModel.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      this.fraudAlertModel.aggregate([
        { $group: { _id: '$alert_type', count: { $sum: 1 } } },
      ]),
      this.fraudAlertModel.countDocuments({
        created_at: { $gte: today },
      }),
      this.fraudAlertModel.countDocuments({
        resolved_at: { $gte: today },
      }),
      this.fraudAlertModel.aggregate([
        {
          $match: {
            resolved_at: { $exists: true },
            created_at: { $exists: true },
          },
        },
        {
          $project: {
            resolution_time: {
              $subtract: ['$resolved_at', '$created_at'],
            },
          },
        },
        {
          $group: {
            _id: null,
            avg_time: { $avg: '$resolution_time' },
          },
        },
      ]),
    ]);

    const avgResolutionTimeMs = resolutionTimes[0]?.avg_time || 0;
    const avgResolutionTimeHours = avgResolutionTimeMs / (1000 * 60 * 60);

    return {
      total,
      by_status: byStatus.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {},
      ),
      by_severity: bySeverity.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {},
      ),
      by_type: byType.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {},
      ),
      new_today: newToday,
      resolved_today: resolvedToday,
      avg_resolution_time_hours: Math.round(avgResolutionTimeHours * 10) / 10,
    };
  }

  async getPatientAlerts(patientId: string): Promise<FraudAlertDocument[]> {
    return this.fraudAlertModel
      .find({ patient: new Types.ObjectId(patientId) })
      .sort({ created_at: -1 })
      .lean()
      .exec();
  }

  async getUnassigned(): Promise<FraudAlertDocument[]> {
    return this.fraudAlertModel
      .find({
        status: FraudAlertStatus.NEW,
        assigned_to: { $exists: false },
      })
      .sort({ severity: -1, created_at: 1 })
      .limit(50)
      .lean()
      .exec();
  }

  // Auto-detection methods
  async detectDuplicatePrescription(
    prescriptionId: string,
    patientId: string,
    imageHash: string,
  ): Promise<FraudAlertDocument | null> {
    // Check for existing prescriptions with same hash
    // This would query the prescription fingerprint collection
    // Implementation depends on fingerprint service
    return null;
  }

  async detectEarlyRefill(
    patientId: string,
    drugId: string,
    lastFillDate: Date,
    daysSupply: number,
  ): Promise<FraudAlertDocument | null> {
    const expectedNextFillDate = new Date(lastFillDate);
    expectedNextFillDate.setDate(expectedNextFillDate.getDate() + daysSupply);

    const now = new Date();
    const daysEarly = Math.floor(
      (expectedNextFillDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysEarly > 7) {
      return this.create({
        alert_type: FraudAlertType.EARLY_REFILL,
        severity:
          daysEarly > 14 ? FraudAlertSeverity.HIGH : FraudAlertSeverity.MEDIUM,
        patient: patientId,
        description: `Patient attempting to refill ${daysEarly} days early`,
        evidence: {
          drug_id: drugId,
          last_fill_date: lastFillDate,
          days_supply: daysSupply,
          expected_next_fill: expectedNextFillDate,
          days_early: daysEarly,
        },
        risk_indicators: ['early_refill_attempt'],
        is_auto_generated: true,
        detection_method: 'refill_date_check',
      });
    }

    return null;
  }

  async detectQuantityAbuse(
    patientId: string,
    drugId: string,
    requestedQuantity: number,
    maxAllowed: number,
  ): Promise<FraudAlertDocument | null> {
    if (requestedQuantity > maxAllowed * 1.5) {
      return this.create({
        alert_type: FraudAlertType.QUANTITY_ABUSE,
        severity: FraudAlertSeverity.MEDIUM,
        patient: patientId,
        description: `Patient requesting ${requestedQuantity} units (max allowed: ${maxAllowed})`,
        evidence: {
          drug_id: drugId,
          requested_quantity: requestedQuantity,
          max_allowed: maxAllowed,
          excess_percentage:
            ((requestedQuantity - maxAllowed) / maxAllowed) * 100,
        },
        risk_indicators: ['quantity_excess'],
        is_auto_generated: true,
        detection_method: 'quantity_limit_check',
      });
    }

    return null;
  }
}
