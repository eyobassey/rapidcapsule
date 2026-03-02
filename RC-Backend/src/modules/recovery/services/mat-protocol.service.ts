import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Drug, DrugDocument } from '../../pharmacy/entities/drug.entity';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
  RecoveryStatus,
} from '../entities/recovery-profile.entity';
import {
  AddictionScreening,
  AddictionScreeningDocument,
} from '../entities/addiction-screening.entity';
import {
  SpecialistPrescription,
  SpecialistPrescriptionDocument,
} from '../../prescriptions/entities/specialist-prescription.entity';
import { User, UserDocument } from '../../users/entities/user.entity';

export interface MATEligibilityResult {
  eligible: boolean;
  blockers: string[];
  warnings: string[];
  patient_profile?: {
    primary_substance: string;
    sobriety_days: number;
    care_level: string;
    last_screening_date?: Date;
  };
}

export interface MATDrugInteraction {
  drug_name: string;
  severity: 'warning' | 'hard_block';
  reason: string;
}

export interface TaperingScheduleEntry {
  week: number;
  dose: string;
  notes?: string;
}

@Injectable()
export class MATProtocolService {
  private readonly logger = new Logger(MATProtocolService.name);

  constructor(
    @InjectModel(Drug.name)
    private readonly drugModel: Model<DrugDocument>,
    @InjectModel(RecoveryProfile.name)
    private readonly profileModel: Model<RecoveryProfileDocument>,
    @InjectModel(AddictionScreening.name)
    private readonly screeningModel: Model<AddictionScreeningDocument>,
    @InjectModel(SpecialistPrescription.name)
    private readonly prescriptionModel: Model<SpecialistPrescriptionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Get all MAT medications from the drug catalog.
   */
  async getMATMedications(targetCondition?: string) {
    const query: any = { is_mat_medication: true, is_active: true };
    if (targetCondition) {
      query['mat_protocol.target_conditions'] = targetCondition;
    }
    return this.drugModel
      .find(query)
      .select(
        'name generic_name strength dosage_form mat_protocol images selling_price',
      )
      .lean();
  }

  /**
   * Get MAT protocol details for a specific drug.
   */
  async getMATProtocol(drugId: string) {
    const drug = await this.drugModel.findOne({
      _id: new Types.ObjectId(drugId),
      is_mat_medication: true,
    });
    if (!drug) throw new NotFoundException('MAT medication not found');
    return drug.toObject();
  }

  /**
   * Verify specialist is authorized to prescribe MAT.
   */
  async verifySpecialistAuthorization(specialistId: string): Promise<{
    authorized: boolean;
    reasons: string[];
  }> {
    const specialist = await this.userModel
      .findById(specialistId)
      .select('user_type mat_waiver profile specialist_category')
      .lean();

    if (!specialist) {
      return { authorized: false, reasons: ['Specialist not found'] };
    }

    const reasons: string[] = [];

    if (specialist.user_type !== 'Specialist') {
      reasons.push('User is not a specialist');
    }

    if (!(specialist as any).mat_waiver) {
      reasons.push(
        'Specialist does not have a MAT prescribing waiver on file',
      );
    }

    return { authorized: reasons.length === 0, reasons };
  }

  /**
   * Check patient eligibility for MAT enrollment.
   */
  async checkPatientEligibility(
    patientId: string,
    drugId: string,
  ): Promise<MATEligibilityResult> {
    const blockers: string[] = [];
    const warnings: string[] = [];

    // 1. Active recovery profile required
    const profile = await this.profileModel
      .findOne({
        user: new Types.ObjectId(patientId),
        status: { $in: [RecoveryStatus.ACTIVE, RecoveryStatus.PAUSED] },
        deleted_at: { $exists: false },
      })
      .lean();

    if (!profile) {
      blockers.push(
        'Patient must have an active recovery profile to receive MAT',
      );
      return { eligible: false, blockers, warnings };
    }

    // 2. Check recent screening (within 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentScreening = await this.screeningModel
      .findOne({
        user: new Types.ObjectId(patientId),
        created_at: { $gte: thirtyDaysAgo },
        deleted_at: { $exists: false },
      })
      .sort({ created_at: -1 })
      .lean();

    if (!recentScreening) {
      blockers.push(
        'A validated addiction screening within the last 30 days is required before MAT initiation',
      );
    }

    // 3. Check drug-specific eligibility
    const drug = await this.drugModel.findById(drugId).lean();
    if (!drug || !drug.is_mat_medication) {
      blockers.push('Selected drug is not a MAT medication');
      return { eligible: false, blockers, warnings };
    }

    // Check target conditions match patient's substance history
    const patientSubstances = (profile.substance_use_history || []).map(
      (s: any) => s.substance?.toLowerCase(),
    );
    const targetConditions = drug.mat_protocol?.target_conditions || [];

    const conditionMatch = targetConditions.some((tc: string) =>
      patientSubstances.some(
        (ps: string) => ps && tc.toLowerCase().includes(ps),
      ),
    );

    if (targetConditions.length > 0 && !conditionMatch) {
      warnings.push(
        `This medication targets ${targetConditions.join(', ')} but patient's recorded substances are ${patientSubstances.filter(Boolean).join(', ') || 'none'}. Verify clinical appropriateness.`,
      );
    }

    // 4. Check for critical drug interactions with current prescriptions
    const interactions = await this.checkDrugInteractions(patientId, drugId);
    const hardBlocks = interactions.filter((i) => i.severity === 'hard_block');
    const interactionWarnings = interactions.filter(
      (i) => i.severity === 'warning',
    );

    for (const block of hardBlocks) {
      blockers.push(
        `CRITICAL interaction: ${block.drug_name} — ${block.reason}`,
      );
    }
    for (const warn of interactionWarnings) {
      warnings.push(`Drug interaction: ${warn.drug_name} — ${warn.reason}`);
    }

    // 5. Naloxone co-prescribe suggestion
    if (drug.mat_protocol?.naloxone_coprescribe) {
      warnings.push(
        'Naloxone co-prescription is recommended with this MAT medication',
      );
    }

    // 6. Check consent
    if (!profile.consent?.treatment_consent) {
      blockers.push('Patient has not provided treatment consent');
    }

    const primarySub = (profile.substance_use_history || []).find(
      (s: any) => s.is_primary,
    );
    const sobrietyDays = profile.sobriety_start_date
      ? Math.floor(
          (Date.now() - new Date(profile.sobriety_start_date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    return {
      eligible: blockers.length === 0,
      blockers,
      warnings,
      patient_profile: {
        primary_substance: primarySub?.substance || 'unknown',
        sobriety_days: sobrietyDays,
        care_level: (profile as any).care_level || 'unknown',
        last_screening_date: recentScreening
          ? (recentScreening as any).created_at
          : undefined,
      },
    };
  }

  /**
   * Check drug interactions between MAT drug and patient's current medications.
   */
  async checkDrugInteractions(
    patientId: string,
    matDrugId: string,
  ): Promise<MATDrugInteraction[]> {
    const matDrug = await this.drugModel.findById(matDrugId).lean();
    if (!matDrug?.mat_protocol?.drug_interactions_critical) return [];

    // Get patient's active prescriptions
    const activePrescriptions = await this.prescriptionModel
      .find({
        patient_id: new Types.ObjectId(patientId),
        status: { $in: ['signed', 'sent_to_patient', 'sent_to_pharmacy', 'dispensed'] },
      })
      .select('items')
      .lean();

    const currentDrugNames = new Set<string>();
    for (const rx of activePrescriptions) {
      for (const item of rx.items || []) {
        if ((item as any).drug_name) {
          currentDrugNames.add((item as any).drug_name.toLowerCase());
        }
        if ((item as any).generic_name) {
          currentDrugNames.add((item as any).generic_name.toLowerCase());
        }
      }
    }

    const interactions: MATDrugInteraction[] = [];
    for (const critical of matDrug.mat_protocol.drug_interactions_critical) {
      if (currentDrugNames.has(critical.drug_name.toLowerCase())) {
        interactions.push({
          drug_name: critical.drug_name,
          severity: critical.severity as 'warning' | 'hard_block',
          reason: critical.reason,
        });
      }
    }

    return interactions;
  }

  /**
   * Generate a tapering schedule for a MAT medication.
   */
  generateTaperingSchedule(
    drugId: string,
    currentDose: string,
    targetDose: string,
    weeksDuration: number,
  ): TaperingScheduleEntry[] {
    const current = parseFloat(currentDose) || 0;
    const target = parseFloat(targetDose) || 0;

    if (current <= target || weeksDuration <= 0) {
      return [{ week: 1, dose: currentDose, notes: 'Maintain current dose' }];
    }

    const schedule: TaperingScheduleEntry[] = [];
    const reductionPerWeek = (current - target) / weeksDuration;

    for (let week = 1; week <= weeksDuration; week++) {
      const dose = Math.max(target, current - reductionPerWeek * week);
      const roundedDose = Math.round(dose * 10) / 10;

      let notes: string | undefined;
      if (week === 1) notes = 'Begin taper — monitor for withdrawal symptoms';
      else if (week === weeksDuration) notes = 'Final target dose reached';
      else if (week % 4 === 0) notes = 'Monthly review recommended';

      schedule.push({
        week,
        dose: `${roundedDose}mg`,
        notes,
      });
    }

    return schedule;
  }

  /**
   * Get MAT compliance summary for a patient.
   */
  async getComplianceSummary(patientId: string) {
    const profile = await this.profileModel
      .findOne({
        user: new Types.ObjectId(patientId),
        deleted_at: { $exists: false },
      })
      .lean();

    if (!profile) throw new NotFoundException('Recovery profile not found');

    // Get MAT prescriptions
    const matDrugs = await this.drugModel
      .find({ is_mat_medication: true })
      .select('_id name')
      .lean();
    const matDrugIds = matDrugs.map((d) => d._id);

    const matPrescriptions = await this.prescriptionModel
      .find({
        patient_id: new Types.ObjectId(patientId),
        'items.drug_id': { $in: matDrugIds },
        status: {
          $in: ['signed', 'sent_to_patient', 'sent_to_pharmacy', 'dispensed', 'delivered'],
        },
      })
      .sort({ created_at: -1 })
      .lean();

    // Check screening compliance
    const screeningInterval =
      matPrescriptions[0]?.items?.[0]
        ? 30
        : 30; // default 30 days

    const lastScreening = await this.screeningModel
      .findOne({
        user: new Types.ObjectId(patientId),
        deleted_at: { $exists: false },
      })
      .sort({ created_at: -1 })
      .lean();

    const screeningDueDate = lastScreening
      ? new Date(
          new Date((lastScreening as any).created_at).getTime() +
            screeningInterval * 24 * 60 * 60 * 1000,
        )
      : null;
    const screeningOverdue = screeningDueDate
      ? screeningDueDate < new Date()
      : true;

    return {
      active_mat_prescriptions: matPrescriptions.length,
      current_medications: matPrescriptions.slice(0, 5).map((rx) => ({
        prescription_id: rx._id,
        prescription_number: rx.prescription_number,
        status: rx.status,
        items: (rx.items || []).map((item: any) => ({
          drug_name: item.drug_name,
          dosage: item.dosage,
          quantity: item.quantity,
        })),
      })),
      screening_compliance: {
        last_screening_date: lastScreening
          ? (lastScreening as any).created_at
          : null,
        next_due: screeningDueDate,
        overdue: screeningOverdue,
      },
      outcomes: (profile as any).outcomes || {},
    };
  }

  /**
   * Suggest naloxone co-prescription when prescribing opioid MAT.
   */
  async getNaloxoneSuggestion(drugId: string) {
    const drug = await this.drugModel.findById(drugId).lean();
    if (!drug?.mat_protocol?.naloxone_coprescribe) {
      return { recommended: false };
    }

    // Find naloxone in catalog
    const naloxone = await this.drugModel
      .find({
        generic_name: { $regex: /naloxone/i },
        is_active: true,
      })
      .select('name generic_name strength dosage_form selling_price images')
      .lean();

    return {
      recommended: true,
      reason:
        'Naloxone co-prescription is recommended for patients receiving opioid-based MAT to prevent accidental overdose',
      available_products: naloxone,
    };
  }
}
