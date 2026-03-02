import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  PharmacyOrder,
  PharmacyOrderDocument,
  PharmacyOrderStatus,
} from '../entities/pharmacy-order.entity';
import { Drug, DrugDocument } from '../entities/drug.entity';
import {
  SuspiciousActivityLog,
  SuspiciousActivityLogDocument,
  SuspiciousActivityType,
  SuspiciousActivitySeverity,
} from '../entities/suspicious-activity-log.entity';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
  RecoveryStatus,
} from '../../recovery/entities/recovery-profile.entity';
import {
  SpecialistPrescription,
  SpecialistPrescriptionDocument,
} from '../../prescriptions/entities/specialist-prescription.entity';
import { PurchaseType, ScheduleClass } from '../enums';

/**
 * Validation issue for a cart item
 */
export interface ValidationIssue {
  drugId: string;
  drugName: string;
  issue:
    | 'EXCEEDS_ORDER_LIMIT'
    | 'EXCEEDS_PERIOD_LIMIT'
    | 'CONTROLLED_SUBSTANCE'
    | 'REQUIRES_PRESCRIPTION'
    | 'MIN_AGE_REQUIRED'
    | 'DRUG_NOT_FOUND'
    | 'DRUG_UNAVAILABLE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  allowed?: number;
  requested?: number;
  purchasedInPeriod?: number;
  periodDays?: number;
}

/**
 * Result of cart validation
 */
export interface CartValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: {
    totalItems: number;
    validItems: number;
    invalidItems: number;
    hasControlledSubstances: boolean;
    requiresPrescription: boolean;
  };
}

/**
 * Cart item to validate
 */
export interface CartItemToValidate {
  drugId: string;
  quantity: number;
}

/**
 * Default purchase limits by purchase type when drug-specific limits aren't set
 */
const DEFAULT_LIMITS: Record<
  PurchaseType,
  { perOrder: number; perPeriod: number; periodDays: number }
> = {
  [PurchaseType.OTC_GENERAL]: { perOrder: 10, perPeriod: 50, periodDays: 30 },
  [PurchaseType.OTC_RESTRICTED]: { perOrder: 5, perPeriod: 20, periodDays: 30 },
  [PurchaseType.PHARMACY_ONLY]: { perOrder: 3, perPeriod: 10, periodDays: 30 },
  [PurchaseType.PRESCRIPTION_ONLY]: { perOrder: 1, perPeriod: 3, periodDays: 30 },
  [PurchaseType.CONTROLLED]: { perOrder: 1, perPeriod: 1, periodDays: 30 },
};

/**
 * Schedule-based limits for controlled substances
 */
const SCHEDULE_LIMITS: Record<
  ScheduleClass,
  { perOrder: number; perPeriod: number; periodDays: number }
> = {
  [ScheduleClass.OTC]: { perOrder: 10, perPeriod: 50, periodDays: 30 },
  [ScheduleClass.RX_ONLY]: { perOrder: 1, perPeriod: 3, periodDays: 30 },
  [ScheduleClass.SCHEDULE_V]: { perOrder: 1, perPeriod: 2, periodDays: 30 },
  [ScheduleClass.SCHEDULE_IV]: { perOrder: 1, perPeriod: 1, periodDays: 30 },
  [ScheduleClass.SCHEDULE_III]: { perOrder: 1, perPeriod: 1, periodDays: 30 },
  [ScheduleClass.SCHEDULE_II]: { perOrder: 1, perPeriod: 1, periodDays: 30 },
};

@Injectable()
export class AbusePreventionService {
  private readonly logger = new Logger(AbusePreventionService.name);

  constructor(
    @InjectModel(PharmacyOrder.name)
    private readonly orderModel: Model<PharmacyOrderDocument>,
    @InjectModel(Drug.name)
    private readonly drugModel: Model<DrugDocument>,
    @InjectModel(SuspiciousActivityLog.name)
    private readonly suspiciousActivityModel: Model<SuspiciousActivityLogDocument>,
    @InjectModel(RecoveryProfile.name)
    private readonly recoveryProfileModel: Model<RecoveryProfileDocument>,
    @InjectModel(SpecialistPrescription.name)
    private readonly prescriptionModel: Model<SpecialistPrescriptionDocument>,
  ) {}

  /**
   * Validate cart items against purchase limits
   */
  async validateCart(
    patientId: Types.ObjectId | string,
    items: CartItemToValidate[],
    patientAge?: number,
  ): Promise<CartValidationResult> {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];
    let validItems = 0;
    let hasControlledSubstances = false;
    let requiresPrescription = false;

    for (const item of items) {
      const validation = await this.validateCartItem(
        patientId,
        item,
        patientAge,
      );

      if (validation.issues.length > 0) {
        issues.push(...validation.issues);
      } else {
        validItems++;
      }

      if (validation.warnings.length > 0) {
        warnings.push(...validation.warnings);
      }

      if (validation.isControlled) {
        hasControlledSubstances = true;
      }

      if (validation.requiresPrescription) {
        requiresPrescription = true;
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
      summary: {
        totalItems: items.length,
        validItems,
        invalidItems: items.length - validItems,
        hasControlledSubstances,
        requiresPrescription,
      },
    };
  }

  /**
   * Validate a single cart item
   */
  private async validateCartItem(
    patientId: Types.ObjectId | string,
    item: CartItemToValidate,
    patientAge?: number,
  ): Promise<{
    issues: ValidationIssue[];
    warnings: ValidationIssue[];
    isControlled: boolean;
    requiresPrescription: boolean;
  }> {
    const issues: ValidationIssue[] = [];
    const warnings: ValidationIssue[] = [];

    // Find the drug
    const drug = await this.drugModel.findById(item.drugId);

    if (!drug) {
      issues.push({
        drugId: item.drugId,
        drugName: 'Unknown',
        issue: 'DRUG_NOT_FOUND',
        severity: 'CRITICAL',
        message: 'Drug not found in catalog',
      });
      return { issues, warnings, isControlled: false, requiresPrescription: false };
    }

    // Check if drug is available
    if (!drug.is_active || !drug.is_available) {
      issues.push({
        drugId: item.drugId,
        drugName: drug.name,
        issue: 'DRUG_UNAVAILABLE',
        severity: 'HIGH',
        message: `${drug.name} is currently unavailable for purchase`,
      });
      return { issues, warnings, isControlled: false, requiresPrescription: false };
    }

    const isControlled = this.isControlledSubstance(drug);
    const requiresPrescription = drug.requires_prescription;

    // Check minimum age requirement
    if (drug.min_age > 0 && patientAge !== undefined && patientAge < drug.min_age) {
      issues.push({
        drugId: item.drugId,
        drugName: drug.name,
        issue: 'MIN_AGE_REQUIRED',
        severity: 'HIGH',
        message: `${drug.name} requires a minimum age of ${drug.min_age} years`,
        allowed: drug.min_age,
        requested: patientAge,
      });
    }

    // Check per-order limit
    const perOrderLimit = this.getPerOrderLimit(drug);
    if (item.quantity > perOrderLimit) {
      issues.push({
        drugId: item.drugId,
        drugName: drug.name,
        issue: 'EXCEEDS_ORDER_LIMIT',
        severity: isControlled ? 'CRITICAL' : 'HIGH',
        message: `Maximum ${perOrderLimit} units of ${drug.name} per order`,
        allowed: perOrderLimit,
        requested: item.quantity,
      });
    }

    // Check rolling period limit
    const periodLimit = this.getPeriodLimit(drug);
    const periodDays = this.getPeriodDays(drug);

    if (periodLimit > 0) {
      const purchasedInPeriod = await this.getPurchaseHistory(
        patientId,
        item.drugId,
        periodDays,
      );

      if (purchasedInPeriod + item.quantity > periodLimit) {
        const remaining = Math.max(0, periodLimit - purchasedInPeriod);
        issues.push({
          drugId: item.drugId,
          drugName: drug.name,
          issue: 'EXCEEDS_PERIOD_LIMIT',
          severity: isControlled ? 'CRITICAL' : 'HIGH',
          message: `You have purchased ${purchasedInPeriod} units of ${drug.name} in the last ${periodDays} days. Maximum allowed: ${periodLimit}. You can purchase up to ${remaining} more units.`,
          allowed: remaining,
          requested: item.quantity,
          purchasedInPeriod,
          periodDays,
        });
      } else if (purchasedInPeriod + item.quantity > periodLimit * 0.8) {
        // Warning when approaching limit (80%)
        warnings.push({
          drugId: item.drugId,
          drugName: drug.name,
          issue: 'EXCEEDS_PERIOD_LIMIT',
          severity: 'LOW',
          message: `You're approaching the purchase limit for ${drug.name}. ${periodLimit - purchasedInPeriod - item.quantity} units remaining in your ${periodDays}-day allowance.`,
          allowed: periodLimit,
          requested: item.quantity,
          purchasedInPeriod,
          periodDays,
        });
      }
    }

    // Warning for controlled substances
    if (isControlled) {
      warnings.push({
        drugId: item.drugId,
        drugName: drug.name,
        issue: 'CONTROLLED_SUBSTANCE',
        severity: 'MEDIUM',
        message: `${drug.name} is a controlled substance and requires a valid prescription with special verification.`,
      });
    }

    // Warning for prescription required
    if (requiresPrescription && !isControlled) {
      warnings.push({
        drugId: item.drugId,
        drugName: drug.name,
        issue: 'REQUIRES_PRESCRIPTION',
        severity: 'MEDIUM',
        message: `${drug.name} requires a valid prescription to purchase.`,
      });
    }

    return { issues, warnings, isControlled, requiresPrescription };
  }

  /**
   * Get purchase history for a specific drug within a time period
   */
  async getPurchaseHistory(
    patientId: Types.ObjectId | string,
    drugId: string,
    days: number,
  ): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.orderModel.aggregate([
      {
        $match: {
          patient: new Types.ObjectId(patientId),
          created_at: { $gte: startDate },
          status: {
            $nin: [
              PharmacyOrderStatus.CANCELLED,
              PharmacyOrderStatus.REFUNDED,
            ],
          },
        },
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.drug': new Types.ObjectId(drugId),
        },
      },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: '$items.quantity' },
        },
      },
    ]);

    return result[0]?.totalQuantity || 0;
  }

  /**
   * Get complete purchase history for a patient (all drugs)
   */
  async getPatientPurchaseHistory(
    patientId: Types.ObjectId | string,
    days: number = 30,
  ): Promise<
    Array<{
      drugId: string;
      drugName: string;
      totalQuantity: number;
      orderCount: number;
    }>
  > {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.orderModel.aggregate([
      {
        $match: {
          patient: new Types.ObjectId(patientId),
          created_at: { $gte: startDate },
          status: {
            $nin: [
              PharmacyOrderStatus.CANCELLED,
              PharmacyOrderStatus.REFUNDED,
            ],
          },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.drug',
          drugName: { $first: '$items.drug_name' },
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          drugId: { $toString: '$_id' },
          drugName: 1,
          totalQuantity: 1,
          orderCount: 1,
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);

    return result;
  }

  /**
   * Check if a drug is a controlled substance
   */
  private isControlledSubstance(drug: DrugDocument): boolean {
    return (
      drug.purchase_type === PurchaseType.CONTROLLED ||
      [
        ScheduleClass.SCHEDULE_II,
        ScheduleClass.SCHEDULE_III,
        ScheduleClass.SCHEDULE_IV,
        ScheduleClass.SCHEDULE_V,
      ].includes(drug.schedule_class)
    );
  }

  /**
   * Get per-order limit for a drug
   */
  private getPerOrderLimit(drug: DrugDocument): number {
    // Drug-specific limit takes priority
    if (drug.max_quantity_per_order && drug.max_quantity_per_order > 0) {
      return drug.max_quantity_per_order;
    }

    // Check schedule class for controlled substances
    if (this.isControlledSubstance(drug)) {
      return SCHEDULE_LIMITS[drug.schedule_class]?.perOrder || 1;
    }

    // Fall back to purchase type defaults
    return DEFAULT_LIMITS[drug.purchase_type]?.perOrder || 10;
  }

  /**
   * Get period limit for a drug
   */
  private getPeriodLimit(drug: DrugDocument): number {
    // Drug-specific limit takes priority
    if (drug.max_quantity_per_period && drug.max_quantity_per_period > 0) {
      return drug.max_quantity_per_period;
    }

    // Check schedule class for controlled substances
    if (this.isControlledSubstance(drug)) {
      return SCHEDULE_LIMITS[drug.schedule_class]?.perPeriod || 1;
    }

    // Fall back to purchase type defaults
    return DEFAULT_LIMITS[drug.purchase_type]?.perPeriod || 0;
  }

  /**
   * Get period days for a drug
   */
  private getPeriodDays(drug: DrugDocument): number {
    // Drug-specific period takes priority
    if (drug.period_days && drug.period_days > 0) {
      return drug.period_days;
    }

    // Check schedule class for controlled substances
    if (this.isControlledSubstance(drug)) {
      return SCHEDULE_LIMITS[drug.schedule_class]?.periodDays || 30;
    }

    // Fall back to purchase type defaults
    return DEFAULT_LIMITS[drug.purchase_type]?.periodDays || 30;
  }

  /**
   * Validate items before order creation (to be called from PharmacyOrderService)
   */
  async validateBeforeOrder(
    patientId: Types.ObjectId | string,
    items: Array<{ drug: string; quantity: number }>,
    patientAge?: number,
  ): Promise<void> {
    const cartItems: CartItemToValidate[] = items.map((item) => ({
      drugId: item.drug,
      quantity: item.quantity,
    }));

    const validation = await this.validateCart(patientId, cartItems, patientAge);

    if (!validation.valid) {
      const criticalIssues = validation.issues.filter(
        (i) => i.severity === 'CRITICAL' || i.severity === 'HIGH',
      );

      if (criticalIssues.length > 0) {
        const errorMessages = criticalIssues
          .map((i) => i.message)
          .join('; ');
        throw new BadRequestException(
          `Order validation failed: ${errorMessages}`,
        );
      }
    }
  }

  /**
   * Check if patient is a verified MAT patient (bypasses standard controlled substance limits).
   */
  async isVerifiedMATPatient(patientId: Types.ObjectId | string): Promise<boolean> {
    const profile = await this.recoveryProfileModel
      .findOne({
        user: new Types.ObjectId(patientId),
        status: { $in: [RecoveryStatus.ACTIVE, RecoveryStatus.PAUSED] },
        deleted_at: { $exists: false },
      })
      .lean();
    return !!profile;
  }

  /**
   * Check if a drug is a MAT medication for the given patient.
   * MAT patients get exempted from standard controlled substance purchase limits
   * for their prescribed MAT medications.
   */
  async checkMATExemption(
    patientId: Types.ObjectId | string,
    drugId: string,
  ): Promise<boolean> {
    const drug = await this.drugModel.findById(drugId).lean();
    if (!drug?.is_mat_medication) return false;

    const isMAT = await this.isVerifiedMATPatient(patientId);
    if (!isMAT) return false;

    // Verify the patient has an active prescription for this MAT medication
    const hasActivePrescription = await this.prescriptionModel.exists({
      patient_id: new Types.ObjectId(patientId),
      'items.drug_id': new Types.ObjectId(drugId),
      status: { $in: ['signed', 'sent_to_patient', 'sent_to_pharmacy', 'dispensed', 'delivered'] },
    });

    return !!hasActivePrescription;
  }

  /**
   * Cross-patient monitoring: detect patterns across patients.
   * - Same drug from multiple specialists
   * - Same drug from multiple pharmacies
   * - Dose escalation
   */
  async runCrossPatientMonitoring(
    patientId: Types.ObjectId | string,
    drugId: string,
    days = 90,
  ): Promise<void> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const prescriptions = await this.prescriptionModel
      .find({
        patient_id: new Types.ObjectId(patientId),
        'items.drug_id': new Types.ObjectId(drugId),
        created_at: { $gte: startDate },
        status: { $nin: ['cancelled', 'expired'] },
      })
      .select('specialist_id items pharmacy_id created_at')
      .lean();

    if (prescriptions.length < 2) return;

    const drug = await this.drugModel.findById(drugId).lean();
    const drugName = drug?.name || 'Unknown drug';

    // Check multiple specialists for same drug
    const specialistIds = [
      ...new Set(prescriptions.map((p) => p.specialist_id?.toString()).filter(Boolean)),
    ];
    if (specialistIds.length >= 2) {
      await this.logSuspiciousActivity(
        patientId,
        drugId,
        `${drugName} prescribed by ${specialistIds.length} different specialists in ${days} days`,
        {
          activity_type: SuspiciousActivityType.MULTIPLE_SPECIALISTS,
          severity: specialistIds.length >= 3
            ? SuspiciousActivitySeverity.CRITICAL
            : SuspiciousActivitySeverity.HIGH,
          specialists_involved: specialistIds.map((id) => new Types.ObjectId(id)),
          prescriptions_involved: prescriptions.map((p) => p._id),
        },
      );
    }

    // Check multiple pharmacies
    const pharmacyIds = [
      ...new Set(
        prescriptions
          .map((p) => (p as any).pharmacy_id?.toString())
          .filter(Boolean),
      ),
    ];
    if (pharmacyIds.length >= 2) {
      await this.logSuspiciousActivity(
        patientId,
        drugId,
        `${drugName} dispensed by ${pharmacyIds.length} different pharmacies in ${days} days`,
        {
          activity_type: SuspiciousActivityType.MULTIPLE_PHARMACIES,
          severity: SuspiciousActivitySeverity.HIGH,
          pharmacies_involved: pharmacyIds.map((id) => new Types.ObjectId(id)),
          prescriptions_involved: prescriptions.map((p) => p._id),
        },
      );
    }

    // Check dose escalation
    const sortedRx = [...prescriptions].sort(
      (a, b) =>
        new Date((a as any).created_at).getTime() -
        new Date((b as any).created_at).getTime(),
    );
    for (let i = 1; i < sortedRx.length; i++) {
      const prevItem = (sortedRx[i - 1].items || []).find(
        (it: any) => it.drug_id?.toString() === drugId,
      ) as any;
      const currItem = (sortedRx[i].items || []).find(
        (it: any) => it.drug_id?.toString() === drugId,
      ) as any;

      if (prevItem?.quantity && currItem?.quantity) {
        const increase =
          (currItem.quantity - prevItem.quantity) / prevItem.quantity;
        if (increase >= 0.5) {
          await this.logSuspiciousActivity(
            patientId,
            drugId,
            `${drugName} quantity increased by ${Math.round(increase * 100)}% (${prevItem.quantity} → ${currItem.quantity})`,
            {
              activity_type: SuspiciousActivityType.DOSE_ESCALATION,
              severity: increase >= 1.0
                ? SuspiciousActivitySeverity.CRITICAL
                : SuspiciousActivitySeverity.HIGH,
              previous_dose: `${prevItem.quantity}`,
              current_dose: `${currItem.quantity}`,
              prescriptions_involved: [sortedRx[i - 1]._id, sortedRx[i]._id],
            },
          );
        }
      }
    }
  }

  /**
   * Log suspicious activity and persist to DB.
   */
  async logSuspiciousActivity(
    patientId: Types.ObjectId | string,
    drugId: string,
    reason: string,
    details: {
      activity_type: SuspiciousActivityType;
      severity: SuspiciousActivitySeverity;
      specialists_involved?: Types.ObjectId[];
      pharmacies_involved?: Types.ObjectId[];
      prescriptions_involved?: any[];
      previous_dose?: string;
      current_dose?: string;
      quantity_requested?: number;
      quantity_allowed?: number;
      period_days?: number;
      additional_context?: string;
    },
  ): Promise<void> {
    this.logger.warn(
      `Suspicious activity detected - Patient: ${patientId}, Drug: ${drugId}, Reason: ${reason}`,
      details,
    );

    const record = await this.suspiciousActivityModel.create({
      patient: new Types.ObjectId(patientId),
      drug: drugId ? new Types.ObjectId(drugId) : undefined,
      activity_type: details.activity_type,
      severity: details.severity,
      message: reason,
      details: {
        specialists_involved: details.specialists_involved,
        pharmacies_involved: details.pharmacies_involved,
        prescriptions_involved: details.prescriptions_involved,
        previous_dose: details.previous_dose,
        current_dose: details.current_dose,
        quantity_requested: details.quantity_requested,
        quantity_allowed: details.quantity_allowed,
        period_days: details.period_days,
        additional_context: details.additional_context,
      },
      admin_notified:
        details.severity === SuspiciousActivitySeverity.CRITICAL ||
        details.severity === SuspiciousActivitySeverity.HIGH,
    });

    this.logger.log(`Suspicious activity logged: ${record._id}`);
  }

  /**
   * Get suspicious activity logs for admin review.
   */
  async getSuspiciousActivityLogs(filters: {
    patient_id?: string;
    severity?: string;
    activity_type?: string;
    reviewed?: boolean;
    page?: number;
    limit?: number;
  }) {
    const query: any = { deleted_at: { $exists: false } };

    if (filters.patient_id) {
      query.patient = new Types.ObjectId(filters.patient_id);
    }
    if (filters.severity) {
      query.severity = filters.severity;
    }
    if (filters.activity_type) {
      query.activity_type = filters.activity_type;
    }
    if (filters.reviewed !== undefined) {
      query.reviewed_by = filters.reviewed
        ? { $exists: true }
        : { $exists: false };
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.suspiciousActivityModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('patient', 'profile.first_name profile.last_name email')
        .populate('drug', 'name generic_name strength')
        .populate('reviewed_by', 'profile.first_name profile.last_name')
        .lean(),
      this.suspiciousActivityModel.countDocuments(query),
    ]);

    return {
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  /**
   * Review/resolve a suspicious activity log.
   */
  async reviewSuspiciousActivity(
    logId: string,
    reviewerId: string,
    resolution: string,
  ) {
    const result = await this.suspiciousActivityModel.findByIdAndUpdate(
      logId,
      {
        $set: {
          reviewed_by: new Types.ObjectId(reviewerId),
          reviewed_at: new Date(),
          resolution,
        },
      },
      { new: true },
    );
    if (!result) throw new BadRequestException('Activity log not found');
    return result.toObject();
  }

  /**
   * Get remaining purchase allowance for a drug
   */
  async getRemainingAllowance(
    patientId: Types.ObjectId | string,
    drugId: string,
  ): Promise<{
    perOrder: number;
    perPeriod: number;
    periodDays: number;
    purchasedInPeriod: number;
    remainingInPeriod: number;
  }> {
    const drug = await this.drugModel.findById(drugId);

    if (!drug) {
      throw new BadRequestException('Drug not found');
    }

    const perOrder = this.getPerOrderLimit(drug);
    const perPeriod = this.getPeriodLimit(drug);
    const periodDays = this.getPeriodDays(drug);
    const purchasedInPeriod = await this.getPurchaseHistory(
      patientId,
      drugId,
      periodDays,
    );
    const remainingInPeriod = Math.max(0, perPeriod - purchasedInPeriod);

    return {
      perOrder,
      perPeriod,
      periodDays,
      purchasedInPeriod,
      remainingInPeriod,
    };
  }
}
