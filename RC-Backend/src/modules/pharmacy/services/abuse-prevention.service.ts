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
   * Log suspicious activity for admin review
   */
  async logSuspiciousActivity(
    patientId: Types.ObjectId | string,
    drugId: string,
    reason: string,
    details: any,
  ): Promise<void> {
    this.logger.warn(
      `Suspicious activity detected - Patient: ${patientId}, Drug: ${drugId}, Reason: ${reason}`,
      details,
    );

    // TODO: Store in a separate collection for admin review
    // TODO: Send notification to admin if critical
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
