import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Vital, VitalDocument } from '../../vitals/entities/vital.entity';
import {
  HealthCheckup,
  HealthCheckupDocument,
} from '../../health-checkup/entities/health-checkup.entity';
import {
  AdvancedHealthScore,
  AdvancedHealthScoreDocument,
} from '../../advanced-health-score/entities/advanced-health-score.entity';
import {
  Prescription,
  PrescriptionDocument,
} from '../../prescriptions/entities/prescription.entity';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
} from '../../appointments/entities/appointment.entity';
import {
  EkaPatientMemory,
  EkaPatientMemoryDocument,
} from '../../eka/entities/eka-patient-memory.entity';
import {
  EkaConversation,
  EkaConversationDocument,
} from '../../eka/entities/eka-conversation.entity';
import {
  HealthIntegration,
  HealthIntegrationDocument,
  IntegrationStatus,
} from '../../health-integrations/schemas/health-integration.schema';
import {
  RecoveryProfile,
  RecoveryProfileDocument,
} from '../../recovery/entities/recovery-profile.entity';
import {
  SobrietyLog,
  SobrietyLogDocument,
} from '../../recovery/entities/sobriety-log.entity';
import { Session, SessionDocument } from '../../auth/entities/session.entity';
import { Wallet, WalletDocument } from '../../wallets/entities/wallet.entity';
import {
  PharmacyOrder,
  PharmacyOrderDocument,
} from '../../pharmacy/entities/pharmacy-order.entity';
import {
  HealthTip,
  HealthTipDocument,
  TipStatus,
} from '../../health-tips/entities/health-tip.entity';

// ─── DrEkaPatientContext ─────────────────────────────────────────────────────

export interface DrEkaVitalSnapshot {
  latest: { value: number | string; unit: string; date: Date } | null;
  previous: { value: number | string; unit: string; date: Date } | null;
  average_7d: number | null;
  average_30d: number | null;
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  readings_count_7d: number;
  readings_count_30d: number;
  is_abnormal: boolean;
}

export interface DrEkaPatientContext {
  // Identity
  patient: {
    id: string;
    first_name: string;
    last_name: string;
    age: number | null;
    gender: string | null;
    blood_type: string | null;
    genotype: string | null;
    bmi: number | null;
    marital_status: string | null;
  };

  // Onboarding
  onboarding: {
    completed_steps: string[];
    missing_steps: string[];
    completion_percentage: number;
    has_emergency_contacts: boolean;
    has_medical_history: boolean;
    has_allergies: boolean;
    has_risk_factors: boolean;
  };

  // Medical Background
  medical: {
    chronic_conditions: string[];
    current_medications: {
      name: string;
      strength?: string;
      dosage?: string;
      frequency?: string;
      reason?: string;
    }[];
    past_surgeries: { procedure: string; year?: string; notes?: string }[];
    family_history: { condition: string; relation?: string }[];
    drug_allergies: {
      drug_name: string;
      reaction?: string;
      severity?: string;
    }[];
    food_allergies: {
      food_name: string;
      reaction?: string;
      severity?: string;
    }[];
    environmental_allergies: {
      allergen: string;
      reaction?: string;
      severity?: string;
    }[];
    pre_existing_conditions: {
      name: string;
      start_date?: string;
      is_active: boolean;
    }[];
    immunizations: { vaccine: string; date?: string }[];
  };

  // Risk Factors
  risk_factors: {
    is_smoker: boolean | null;
    alcohol_consumption: string | null;
    exercise_frequency: string | null;
    diet_type: string | null;
    sleep_hours: number | null;
    stress_level: string | null;
    weight_status: string | null;
    has_recent_injuries: string | null;
  };

  // Vitals (all types with trends)
  vitals: Record<string, DrEkaVitalSnapshot>;

  // Health Score
  health_score: {
    basic: {
      current: number | null;
      status: string | null;
      breakdown: Record<string, any> | null;
    };
    advanced: {
      current: number | null;
      previous: number | null;
      trend: string;
      domain_scores: Record<string, number> | null;
    };
  };

  // Health Checkups
  checkups: {
    total: number;
    last_checkup_date: Date | null;
    days_since_last_checkup: number | null;
    recent_conditions: string[];
    recent_triage_levels: string[];
    has_emergency_evidence: boolean;
    specialist_recommendations: string[];
    lifestyle_tips: string[];
  };

  // Appointments
  appointments: {
    total_completed: number;
    upcoming: {
      date: Date;
      specialist: string;
      category: string;
    }[];
    overdue_follow_ups: {
      original_date: Date;
      specialist: string;
      follow_up_timeframe: string;
    }[];
    last_appointment: {
      date: Date;
      specialist: string;
      diagnosis: string | null;
      treatment_plan: string | null;
    } | null;
    recent_clinical_notes_summary: string | null;
  };

  // Prescriptions & Pharmacy
  prescriptions: {
    active: {
      drug_name: string;
      dose: string;
      interval: string;
      period: string;
      prescribed_at: Date;
      prescribed_by: string;
    }[];
    total_active: number;
    potential_interactions: string[];
    recent_pharmacy_orders: {
      drug_name: string;
      status: string;
      ordered_at: Date;
      delivered_at: Date | null;
    }[];
    refills_due: string[];
  };

  // Recovery (if enrolled)
  recovery: {
    is_enrolled: boolean;
    sobriety_days: number | null;
    risk_level: string | null;
    mood_trend: { average_7d: number; direction: string } | null;
    craving_trend: { average_7d: number; direction: string } | null;
    last_check_in: Date | null;
    milestones: string[];
    coping_strategies_used: string[];
    screening_summary: string | null;
  } | null;

  // Eka Insights
  eka: {
    key_facts: string[];
    recent_health_concerns: string[];
    conversation_count: number;
    last_conversation_date: Date | null;
  };

  // Wearables
  wearables: {
    connected: boolean;
    providers: string[];
    last_sync: Date | null;
    sync_stale: boolean;
  };

  // Location & Activity
  activity: {
    last_login: Date | null;
    current_ip: string | null;
    previous_ip: string | null;
    location_changed: boolean;
    current_location: string | null;
    previous_location: string | null;
  };

  // Engagement
  engagement: {
    health_tips_acted: number;
    health_tips_dismissed: number;
    health_tips_total: number;
    notification_preferences: Record<string, boolean>;
    days_since_registration: number;
  };

  // Wallet
  wallet: {
    balance: number;
    currency: string;
  };
}

// ─── Vital Type Config ───────────────────────────────────────────────────────

const VITAL_TYPES = [
  'body_temp',
  'body_weight',
  'blood_pressure',
  'blood_sugar_level',
  'pulse_rate',
  'spo2',
  'steps',
  'sleep',
  'calories_burned',
  'distance',
  'respiratory_rate',
  'stress_level',
  'body_fat',
  'active_minutes',
  'hydration',
  'muscle_mass',
  'bone_mass',
  'body_water',
  'visceral_fat',
  'bmr',
  'craving_level',
  'mood_score',
  'anxiety_level',
  'motivation_level',
] as const;

/**
 * Normal ranges for detecting abnormal readings.
 * Key = vital type, value = { min, max } of normal range.
 * Blood pressure uses systolic value parsed from "120/80" format.
 */
const NORMAL_RANGES: Record<string, { min: number; max: number }> = {
  body_temp: { min: 36.1, max: 37.5 },
  pulse_rate: { min: 60, max: 100 },
  spo2: { min: 95, max: 100 },
  blood_sugar_level: { min: 70, max: 140 },
  respiratory_rate: { min: 12, max: 20 },
  body_fat: { min: 10, max: 30 },
  blood_pressure: { min: 90, max: 140 }, // systolic
  bmr: { min: 1000, max: 3000 },
};

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class DrEkaDataService {
  private readonly logger = new Logger(DrEkaDataService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Vital.name)
    private vitalModel: Model<VitalDocument>,
    @InjectModel(HealthCheckup.name)
    private healthCheckupModel: Model<HealthCheckupDocument>,
    @InjectModel(AdvancedHealthScore.name)
    private advancedScoreModel: Model<AdvancedHealthScoreDocument>,
    @InjectModel(Prescription.name)
    private prescriptionModel: Model<PrescriptionDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(EkaPatientMemory.name)
    private ekaMemoryModel: Model<EkaPatientMemoryDocument>,
    @InjectModel(EkaConversation.name)
    private ekaConversationModel: Model<EkaConversationDocument>,
    @InjectModel(HealthIntegration.name)
    private healthIntegrationModel: Model<HealthIntegrationDocument>,
    @InjectModel(RecoveryProfile.name)
    private recoveryProfileModel: Model<RecoveryProfileDocument>,
    @InjectModel(SobrietyLog.name)
    private sobrietyLogModel: Model<SobrietyLogDocument>,
    @InjectModel(Session.name)
    private sessionModel: Model<SessionDocument>,
    @InjectModel(Wallet.name)
    private walletModel: Model<WalletDocument>,
    @InjectModel(PharmacyOrder.name)
    private pharmacyOrderModel: Model<PharmacyOrderDocument>,
    @InjectModel(HealthTip.name)
    private healthTipModel: Model<HealthTipDocument>,
  ) {}

  // ─── Main Builder ──────────────────────────────────────────────────────────

  async buildPatientContext(
    userId: string | Types.ObjectId,
  ): Promise<DrEkaPatientContext> {
    const uid =
      typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      user,
      vitals,
      recentCheckups,
      totalCheckups,
      advancedScores,
      prescriptions,
      completedAppointments,
      upcomingAppointments,
      recentCompletedAppointments,
      ekaMemory,
      lastConversation,
      integrations,
      recoveryProfile,
      recentSobrietyLogs,
      recentSessions,
      wallet,
      recentOrders,
      healthTipStats,
    ] = await Promise.all([
      // 1. User profile
      this.userModel.findById(uid).lean(),

      // 2. Vitals doc
      this.vitalModel.findOne({ userId: uid }).lean(),

      // 3. Recent health checkups (last 10)
      this.healthCheckupModel
        .find({ user: uid, deleted_at: { $exists: false } })
        .sort({ created_at: -1 })
        .limit(10)
        .lean(),

      // 4. Total checkup count
      this.healthCheckupModel.countDocuments({
        user: uid,
        deleted_at: { $exists: false },
      }),

      // 5. Advanced health scores (last 2 for trend)
      this.advancedScoreModel
        .find({ user_id: uid, status: 'completed' })
        .sort({ created_at: -1 })
        .limit(2)
        .lean(),

      // 6. Prescriptions (last 90 days)
      this.prescriptionModel
        .find({ patient: uid, created_at: { $gte: ninetyDaysAgo } })
        .populate({
          path: 'items.drug',
          select: 'name',
          options: { _recursed: true },
        })
        .populate({
          path: 'prescribed_by',
          select: 'profile.first_name profile.last_name',
          options: { _recursed: true },
        })
        .sort({ created_at: -1 })
        .lean<any[]>(),

      // 7. Total completed appointments
      this.appointmentModel.countDocuments({
        patient: uid,
        status: AppointmentStatus.COMPLETED,
      }),

      // 8. Upcoming appointments
      this.appointmentModel
        .find({
          patient: uid,
          start_time: { $gte: now },
          status: { $in: [AppointmentStatus.OPEN, AppointmentStatus.RESCHEDULED] },
        })
        .populate({
          path: 'specialist',
          select: 'profile.first_name profile.last_name professional_practice.category',
          options: { _recursed: true },
        })
        .sort({ start_time: 1 })
        .limit(5)
        .lean<any[]>(),

      // 9. Recent completed appointments (last 90 days) for clinical notes
      this.appointmentModel
        .find({
          patient: uid,
          status: AppointmentStatus.COMPLETED,
          created_at: { $gte: ninetyDaysAgo },
        })
        .populate({
          path: 'specialist',
          select: 'profile.first_name profile.last_name',
          options: { _recursed: true },
        })
        .select(
          'start_time category clinical_notes specialist created_at status',
        )
        .sort({ created_at: -1 })
        .limit(10)
        .lean<any[]>(),

      // 10. Eka patient memory
      this.ekaMemoryModel.findOne({ user: uid }).lean(),

      // 11. Last Eka conversation date
      this.ekaConversationModel
        .findOne({ user: uid, is_active: true })
        .sort({ updated_at: -1 })
        .select('updated_at')
        .lean(),

      // 12. Health integrations (wearables)
      this.healthIntegrationModel
        .find({ userId: uid, status: IntegrationStatus.CONNECTED })
        .lean(),

      // 13. Recovery profile
      this.recoveryProfileModel
        .findOne({
          user: uid,
          status: { $ne: 'archived' },
          deleted_at: { $exists: false },
        })
        .lean(),

      // 14. Recent sobriety logs (last 14 days for trend calculation)
      this.sobrietyLogModel
        .find({
          user: uid,
          log_date: {
            $gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
          },
        })
        .sort({ log_date: -1 })
        .lean(),

      // 15. Recent login sessions (last 2)
      this.sessionModel
        .find({ userId: uid, isRevoked: false })
        .sort({ lastActiveAt: -1 })
        .limit(2)
        .select('ipAddress city country location lastActiveAt created_at')
        .lean(),

      // 16. Wallet
      this.walletModel.findOne({ userId: uid }).lean(),

      // 17. Recent pharmacy orders (last 90 days)
      this.pharmacyOrderModel
        .find({ patient: uid, created_at: { $gte: ninetyDaysAgo } })
        .sort({ created_at: -1 })
        .limit(10)
        .lean(),

      // 18. Health tip engagement stats
      this.healthTipModel
        .aggregate([
          { $match: { user_id: uid } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              acted: {
                $sum: {
                  $cond: [{ $eq: ['$status', TipStatus.ACTED_UPON] }, 1, 0],
                },
              },
              dismissed: {
                $sum: {
                  $cond: [{ $eq: ['$status', TipStatus.DISMISSED] }, 1, 0],
                },
              },
            },
          },
        ])
        .then((r) => r[0] || { total: 0, acted: 0, dismissed: 0 }),
    ]);

    if (!user) {
      throw new Error(`User not found: ${uid}`);
    }

    const profile = (user as any).profile || {};
    const riskFactors = profile.health_risk_factors || {};
    const medicalHistory = (user as any).medical_history || {};
    const userAllergies = (user as any).allergies || {};

    // Build each section
    const patient = this.buildPatientIdentity(user as any);
    const onboarding = this.buildOnboarding(user as any);
    const medical = this.buildMedical(medicalHistory, userAllergies, user as any);
    const risk_factors = this.buildRiskFactors(riskFactors);
    const vitalsData = this.buildVitals(vitals, now);
    const health_score = this.buildHealthScore(user as any, advancedScores);
    const checkups = this.buildCheckups(recentCheckups, totalCheckups, now);
    const appointments = this.buildAppointments(
      completedAppointments,
      upcomingAppointments,
      recentCompletedAppointments,
      now,
    );
    const prescriptionsData = this.buildPrescriptions(
      prescriptions,
      recentOrders,
    );
    const recovery = this.buildRecovery(recoveryProfile, recentSobrietyLogs);
    const eka = this.buildEka(ekaMemory, lastConversation);
    const wearables = this.buildWearables(integrations, now);
    const activity = this.buildActivity(recentSessions);
    const engagement = this.buildEngagement(
      healthTipStats,
      user as any,
    );
    const walletData = this.buildWallet(wallet);

    return {
      patient,
      onboarding,
      medical,
      risk_factors,
      vitals: vitalsData,
      health_score,
      checkups,
      appointments,
      prescriptions: prescriptionsData,
      recovery,
      eka,
      wearables,
      activity,
      engagement,
      wallet: walletData,
    };
  }

  // ─── Patient Identity ──────────────────────────────────────────────────────

  private buildPatientIdentity(user: any): DrEkaPatientContext['patient'] {
    const profile = user.profile || {};

    let age: number | null = null;
    if (profile.date_of_birth) {
      const dob = new Date(profile.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        age--;
      }
    }

    let bmi: number | null = null;
    const height = profile.basic_health_info?.height;
    const weight = profile.basic_health_info?.weight;
    if (height?.value && weight?.value) {
      const heightM = height.unit === 'cm' ? height.value / 100 : height.value;
      const weightKg =
        weight.unit === 'lb' ? weight.value * 0.453592 : weight.value;
      if (heightM > 0) {
        bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
      }
    }

    return {
      id: user._id.toString(),
      first_name: profile.first_name || 'Patient',
      last_name: profile.last_name || '',
      age,
      gender: profile.gender || null,
      blood_type: profile.blood_type || null,
      genotype: profile.genotype || null,
      bmi,
      marital_status: profile.marital_status || null,
    };
  }

  // ─── Onboarding ────────────────────────────────────────────────────────────

  private buildOnboarding(user: any): DrEkaPatientContext['onboarding'] {
    const profile = user.profile || {};
    const steps: string[] = [];
    const missing: string[] = [];

    // Check each onboarding step
    const checks: [string, boolean][] = [
      ['basic_info', !!(profile.first_name && profile.last_name)],
      ['date_of_birth', !!profile.date_of_birth],
      ['gender', !!profile.gender],
      ['contact_phone', !!profile.contact?.phone?.number],
      ['height_weight', !!(profile.basic_health_info?.height?.value && profile.basic_health_info?.weight?.value)],
      ['blood_type', !!profile.blood_type],
      ['genotype', !!profile.genotype],
      ['emergency_contacts', !!(user.emergency_contacts && user.emergency_contacts.length > 0)],
      ['medical_history', !!(user.medical_history && (user.medical_history.chronic_conditions?.length > 0 || user.medical_history.past_surgeries?.length > 0 || user.medical_history.current_medications?.length > 0))],
      ['allergies', user.allergies?.has_allergies !== undefined],
      ['risk_factors', !!(profile.health_risk_factors && Object.keys(profile.health_risk_factors).length > 0)],
      ['email_verified', !!user.is_email_verified],
    ];

    for (const [step, completed] of checks) {
      if (completed) {
        steps.push(step);
      } else {
        missing.push(step);
      }
    }

    const total = checks.length;
    const completionPercentage = Math.round((steps.length / total) * 100);

    return {
      completed_steps: steps,
      missing_steps: missing,
      completion_percentage: completionPercentage,
      has_emergency_contacts:
        !!(user.emergency_contacts && user.emergency_contacts.length > 0),
      has_medical_history:
        !!(user.medical_history &&
          (user.medical_history.chronic_conditions?.length > 0 ||
            user.medical_history.past_surgeries?.length > 0 ||
            user.medical_history.current_medications?.length > 0)),
      has_allergies: user.allergies?.has_allergies === true,
      has_risk_factors:
        !!(user.profile?.health_risk_factors &&
          Object.keys(user.profile.health_risk_factors).length > 0),
    };
  }

  // ─── Medical ───────────────────────────────────────────────────────────────

  private buildMedical(
    medicalHistory: any,
    allergies: any,
    user: any,
  ): DrEkaPatientContext['medical'] {
    return {
      chronic_conditions: medicalHistory.chronic_conditions || [],
      current_medications: (medicalHistory.current_medications || []).map(
        (m: any) => ({
          name: m.name || 'Unknown',
          strength: m.strength,
          dosage: m.dosage,
          frequency: m.frequency,
          reason: m.reason,
        }),
      ),
      past_surgeries: (medicalHistory.past_surgeries || []).map((s: any) => ({
        procedure: s.procedure || 'Unknown',
        year: s.year,
        notes: s.notes,
      })),
      family_history: (medicalHistory.family_history || []).map((h: any) => ({
        condition: h.condition || 'Unknown',
        relation: h.relation,
      })),
      drug_allergies: (allergies.drug_allergies || []).map((a: any) => ({
        drug_name: a.drug_name || 'Unknown',
        reaction: a.reaction,
        severity: a.severity,
      })),
      food_allergies: (allergies.food_allergies || []).map((a: any) => ({
        food_name: a.food_name || 'Unknown',
        reaction: a.reaction,
        severity: a.severity,
      })),
      environmental_allergies: (
        allergies.environmental_allergies || []
      ).map((a: any) => ({
        allergen: a.allergen || 'Unknown',
        reaction: a.reaction,
        severity: a.severity,
      })),
      pre_existing_conditions: (user.pre_existing_conditions || []).map(
        (c: any) => ({
          name: c.name || 'Unknown',
          start_date: c.start_date,
          is_active: c.is_condition_exists ?? true,
        }),
      ),
      immunizations: (medicalHistory.immunizations || []).map((i: any) => ({
        vaccine: i.vaccine || 'Unknown',
        date: i.date,
      })),
    };
  }

  // ─── Risk Factors ──────────────────────────────────────────────────────────

  private buildRiskFactors(
    riskFactors: any,
  ): DrEkaPatientContext['risk_factors'] {
    let isSmoker: boolean | null = null;
    if (riskFactors.is_smoker !== undefined) {
      isSmoker =
        riskFactors.is_smoker === true || riskFactors.is_smoker === 'yes';
    }

    return {
      is_smoker: isSmoker,
      alcohol_consumption: riskFactors.alcohol_consumption || null,
      exercise_frequency: riskFactors.exercise_frequency || null,
      diet_type: riskFactors.diet_type || null,
      sleep_hours: riskFactors.sleep_hours ?? null,
      stress_level: riskFactors.stress_level || null,
      weight_status: riskFactors.weight_status || null,
      has_recent_injuries: riskFactors.has_recent_injuries || null,
    };
  }

  // ─── Vitals ────────────────────────────────────────────────────────────────

  private buildVitals(
    vitals: any,
    now: Date,
  ): Record<string, DrEkaVitalSnapshot> {
    const result: Record<string, DrEkaVitalSnapshot> = {};
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prevSevenStart = new Date(
      now.getTime() - 14 * 24 * 60 * 60 * 1000,
    );

    for (const vitalType of VITAL_TYPES) {
      const readings: any[] = vitals?.[vitalType] || [];
      if (readings.length === 0) {
        result[vitalType] = {
          latest: null,
          previous: null,
          average_7d: null,
          average_30d: null,
          trend: 'insufficient_data',
          readings_count_7d: 0,
          readings_count_30d: 0,
          is_abnormal: false,
        };
        continue;
      }

      // Latest and previous
      const latest = readings[readings.length - 1];
      const previous = readings.length > 1 ? readings[readings.length - 2] : null;

      // Parse value for numeric computation
      const parseVal = (entry: any): number => {
        if (!entry?.value) return NaN;
        const val = entry.value.toString();
        // Blood pressure: take systolic
        if (vitalType === 'blood_pressure' && val.includes('/')) {
          return parseFloat(val.split('/')[0]);
        }
        return parseFloat(val);
      };

      // Filter by time ranges
      const last7d = readings.filter(
        (r: any) => r.updatedAt && new Date(r.updatedAt) >= sevenDaysAgo,
      );
      const last30d = readings.filter(
        (r: any) => r.updatedAt && new Date(r.updatedAt) >= thirtyDaysAgo,
      );
      const prev7d = readings.filter(
        (r: any) =>
          r.updatedAt &&
          new Date(r.updatedAt) >= prevSevenStart &&
          new Date(r.updatedAt) < sevenDaysAgo,
      );

      // Compute averages
      const computeAvg = (arr: any[]): number | null => {
        const nums = arr.map(parseVal).filter((n) => !isNaN(n));
        if (nums.length === 0) return null;
        return (
          Math.round(
            (nums.reduce((a, b) => a + b, 0) / nums.length) * 10,
          ) / 10
        );
      };

      const avg7d = computeAvg(last7d);
      const avg30d = computeAvg(last30d);
      const prevAvg7d = computeAvg(prev7d);

      // Trend
      let trend: DrEkaVitalSnapshot['trend'] = 'insufficient_data';
      if (avg7d !== null && prevAvg7d !== null) {
        const diff = avg7d - prevAvg7d;
        const threshold = prevAvg7d * 0.05; // 5% change
        // For vitals where lower is better (stress, craving, anxiety), declining means value decreasing = improving
        const lowerIsBetter = [
          'stress_level',
          'craving_level',
          'anxiety_level',
          'body_fat',
          'visceral_fat',
        ].includes(vitalType);

        if (Math.abs(diff) <= threshold) {
          trend = 'stable';
        } else if (lowerIsBetter) {
          trend = diff < 0 ? 'improving' : 'declining';
        } else {
          // For most vitals, a change is context-dependent.
          // Simple heuristic: if within normal range and stable, 'stable'.
          // If moving toward normal range, 'improving'. Away, 'declining'.
          const range = NORMAL_RANGES[vitalType];
          if (range && avg7d !== null) {
            const midNormal = (range.min + range.max) / 2;
            const distCurrent = Math.abs(avg7d - midNormal);
            const distPrev = Math.abs(prevAvg7d - midNormal);
            trend = distCurrent < distPrev ? 'improving' : 'declining';
          } else {
            // No normal range defined: use direction for vitals like mood/motivation (higher=better)
            const higherIsBetter = [
              'mood_score',
              'motivation_level',
              'spo2',
              'active_minutes',
              'steps',
              'sleep',
              'hydration',
            ].includes(vitalType);
            if (higherIsBetter) {
              trend = diff > 0 ? 'improving' : 'declining';
            } else {
              trend = 'stable'; // Default for ambiguous vitals
            }
          }
        }
      } else if (last7d.length >= 2) {
        trend = 'stable'; // Have some data but not enough for prev period comparison
      }

      // Abnormal check
      let isAbnormal = false;
      const latestNum = parseVal(latest);
      if (!isNaN(latestNum) && NORMAL_RANGES[vitalType]) {
        const range = NORMAL_RANGES[vitalType];
        isAbnormal = latestNum < range.min || latestNum > range.max;
      }

      result[vitalType] = {
        latest: latest
          ? {
              value: latest.value,
              unit: latest.unit || '',
              date: latest.updatedAt || new Date(),
            }
          : null,
        previous: previous
          ? {
              value: previous.value,
              unit: previous.unit || '',
              date: previous.updatedAt || new Date(),
            }
          : null,
        average_7d: avg7d,
        average_30d: avg30d,
        trend,
        readings_count_7d: last7d.length,
        readings_count_30d: last30d.length,
        is_abnormal: isAbnormal,
      };
    }

    return result;
  }

  // ─── Health Score ──────────────────────────────────────────────────────────

  private buildHealthScore(
    user: any,
    advancedScores: any[],
  ): DrEkaPatientContext['health_score'] {
    const basicScore = user.basic_health_score;
    const latestAdvanced = advancedScores?.[0];
    const prevAdvanced = advancedScores?.[1];

    let advancedTrend = 'insufficient_data';
    if (latestAdvanced?.report?.overall_score != null && prevAdvanced?.report?.overall_score != null) {
      const diff =
        latestAdvanced.report.overall_score -
        prevAdvanced.report.overall_score;
      if (Math.abs(diff) < 3) advancedTrend = 'stable';
      else advancedTrend = diff > 0 ? 'improving' : 'declining';
    }

    const domainScores =
      latestAdvanced?.report?.domain_scores?.reduce(
        (acc: Record<string, number>, d: any) => {
          if (d.domain && d.score != null) acc[d.domain] = d.score;
          return acc;
        },
        {} as Record<string, number>,
      ) || null;

    return {
      basic: {
        current: basicScore?.score ?? null,
        status: basicScore?.status || null,
        breakdown: basicScore?.breakdown || null,
      },
      advanced: {
        current: latestAdvanced?.report?.overall_score ?? null,
        previous: prevAdvanced?.report?.overall_score ?? null,
        trend: advancedTrend,
        domain_scores: domainScores,
      },
    };
  }

  // ─── Health Checkups ───────────────────────────────────────────────────────

  private buildCheckups(
    recentCheckups: any[],
    totalCheckups: number,
    now: Date,
  ): DrEkaPatientContext['checkups'] {
    const lastCheckupDate =
      recentCheckups.length > 0 ? recentCheckups[0].created_at : null;
    const daysSinceLastCheckup = lastCheckupDate
      ? Math.floor(
          (now.getTime() - new Date(lastCheckupDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    const conditions: string[] = [];
    const triageLevels: string[] = [];
    let hasEmergency = false;
    const specialistRecs: string[] = [];
    const lifestyleTips: string[] = [];

    for (const checkup of recentCheckups) {
      const response = checkup.response?.data;
      if (!response) continue;

      // Conditions
      const topConditions = (response.conditions || [])
        .slice(0, 3)
        .map((c: any) => c.common_name || c.name)
        .filter(Boolean);
      conditions.push(...topConditions);

      // Triage
      if (response.triage_level) {
        triageLevels.push(response.triage_level);
      }

      // Emergency
      if (response.has_emergency_evidence) {
        hasEmergency = true;
      }

      // Specialist recommendations from AI summary
      const summary = checkup.claude_summary?.content;
      if (summary?.recommendations) {
        specialistRecs.push(...summary.recommendations);
      }
      if (summary?.lifestyle_tips) {
        lifestyleTips.push(...summary.lifestyle_tips);
      }
    }

    return {
      total: totalCheckups,
      last_checkup_date: lastCheckupDate,
      days_since_last_checkup: daysSinceLastCheckup,
      recent_conditions: [...new Set(conditions)].slice(0, 15),
      recent_triage_levels: triageLevels.slice(0, 10),
      has_emergency_evidence: hasEmergency,
      specialist_recommendations: [...new Set(specialistRecs)].slice(0, 10),
      lifestyle_tips: [...new Set(lifestyleTips)].slice(0, 10),
    };
  }

  // ─── Appointments ──────────────────────────────────────────────────────────

  private buildAppointments(
    totalCompleted: number,
    upcoming: any[],
    recentCompleted: any[],
    now: Date,
  ): DrEkaPatientContext['appointments'] {
    // Upcoming appointments
    const upcomingList = upcoming.map((a: any) => {
      const specialist = a.specialist;
      const specialistName = specialist
        ? `${specialist.profile?.first_name || ''} ${specialist.profile?.last_name || ''}`.trim()
        : 'Unknown';
      return {
        date: a.start_time,
        specialist: specialistName,
        category: a.category || 'General',
      };
    });

    // Last completed appointment with clinical data
    let lastAppointment: DrEkaPatientContext['appointments']['last_appointment'] =
      null;
    let recentClinicalNotesSummary: string | null = null;
    const overdueFollowUps: DrEkaPatientContext['appointments']['overdue_follow_ups'] =
      [];

    if (recentCompleted.length > 0) {
      const lastAppt = recentCompleted[0];
      const specialist = lastAppt.specialist;
      const specialistName = specialist
        ? `${specialist.profile?.first_name || ''} ${specialist.profile?.last_name || ''}`.trim()
        : 'Unknown';

      // Extract clinical notes
      const notes = lastAppt.clinical_notes || [];
      const latestNote =
        notes.find((n: any) => !n.is_draft && n.confirmed_accurate) ||
        (notes.length > 0 ? notes[notes.length - 1] : null);

      let diagnosis: string | null = null;
      let treatmentPlan: string | null = null;
      if (latestNote) {
        diagnosis =
          latestNote.assessment_diagnosis?.primary_diagnosis || null;
        treatmentPlan =
          latestNote.treatment_plan?.patient_instructions || null;
      }

      lastAppointment = {
        date: lastAppt.start_time || lastAppt.created_at,
        specialist: specialistName,
        diagnosis,
        treatment_plan: treatmentPlan,
      };

      // Build clinical notes summary from recent appointments
      const noteSummaries: string[] = [];
      for (const appt of recentCompleted.slice(0, 5)) {
        const apptNotes = appt.clinical_notes || [];
        const confirmedNote =
          apptNotes.find((n: any) => !n.is_draft && n.confirmed_accurate) ||
          (apptNotes.length > 0 ? apptNotes[apptNotes.length - 1] : null);
        if (confirmedNote?.assessment_diagnosis?.clinical_impression) {
          noteSummaries.push(
            confirmedNote.assessment_diagnosis.clinical_impression,
          );
        }
      }
      if (noteSummaries.length > 0) {
        recentClinicalNotesSummary = noteSummaries.join(' | ');
      }

      // Check for overdue follow-ups
      for (const appt of recentCompleted) {
        const apptNotes = appt.clinical_notes || [];
        for (const note of apptNotes) {
          const tp = note.treatment_plan;
          if (
            tp?.follow_up_required &&
            tp.follow_up_required !== 'No follow-up needed' &&
            tp.follow_up_timeframe
          ) {
            const followUpDays = this.parseFollowUpTimeframe(
              tp.follow_up_timeframe,
            );
            const apptDate = new Date(
              appt.start_time || appt.created_at,
            );
            const followUpDeadline = new Date(
              apptDate.getTime() + followUpDays * 24 * 60 * 60 * 1000,
            );

            if (followUpDeadline < now) {
              const specName = appt.specialist
                ? `${appt.specialist.profile?.first_name || ''} ${appt.specialist.profile?.last_name || ''}`.trim()
                : 'Unknown';
              overdueFollowUps.push({
                original_date: apptDate,
                specialist: specName,
                follow_up_timeframe: tp.follow_up_timeframe,
              });
            }
          }
        }
      }
    }

    return {
      total_completed: totalCompleted,
      upcoming: upcomingList,
      overdue_follow_ups: overdueFollowUps,
      last_appointment: lastAppointment,
      recent_clinical_notes_summary: recentClinicalNotesSummary,
    };
  }

  // ─── Prescriptions & Pharmacy ──────────────────────────────────────────────

  private buildPrescriptions(
    prescriptions: any[],
    recentOrders: any[],
  ): DrEkaPatientContext['prescriptions'] {
    const activeItems: DrEkaPatientContext['prescriptions']['active'] = [];
    const allDrugNames: string[] = [];

    for (const rx of prescriptions) {
      const prescriber = rx.prescribed_by;
      const prescriberName = prescriber
        ? `${prescriber.profile?.first_name || ''} ${prescriber.profile?.last_name || ''}`.trim()
        : 'Unknown';

      for (const item of rx.items || []) {
        const drugName =
          (item.drug as any)?.name ||
          (typeof item.drug === 'string' ? item.drug : 'Unknown Drug');
        const dose = item.dose
          ? `${item.dose.quantity || ''} ${item.dose.dosage_form || ''}`.trim()
          : '';
        const interval = item.interval
          ? `${item.interval.time || ''} ${item.interval.unit || ''}`.trim()
          : '';
        const period = item.period
          ? `${item.period.number || ''} ${item.period.unit || ''}`.trim()
          : '';

        activeItems.push({
          drug_name: drugName,
          dose,
          interval,
          period,
          prescribed_at: rx.created_at || new Date(),
          prescribed_by: prescriberName,
        });

        allDrugNames.push(drugName);
      }
    }

    // Detect potential drug interactions (simple: flag if same drug prescribed multiple times)
    const drugCount: Record<string, number> = {};
    for (const name of allDrugNames) {
      const key = name.toLowerCase();
      drugCount[key] = (drugCount[key] || 0) + 1;
    }
    const potentialInteractions: string[] = [];
    for (const [drug, count] of Object.entries(drugCount)) {
      if (count > 1) {
        potentialInteractions.push(
          `${drug} prescribed ${count} times in last 90 days`,
        );
      }
    }

    // Also check pharmacy order interactions
    for (const order of recentOrders) {
      if (order.has_interaction_warnings && order.drug_interactions) {
        for (const interaction of order.drug_interactions) {
          potentialInteractions.push(
            `${interaction.drug1_name} + ${interaction.drug2_name}: ${interaction.severity} - ${interaction.description}`,
          );
        }
      }
    }

    // Recent pharmacy orders
    const pharmacyOrders: DrEkaPatientContext['prescriptions']['recent_pharmacy_orders'] =
      [];
    for (const order of recentOrders) {
      for (const item of order.items || []) {
        pharmacyOrders.push({
          drug_name: item.drug_name || 'Unknown',
          status: order.status,
          ordered_at: order.created_at,
          delivered_at: order.actual_delivery_date || null,
        });
      }
    }

    // Refills due: check items with require_refill
    const refillsDue: string[] = [];
    for (const rx of prescriptions) {
      for (const item of rx.items || []) {
        if (item.require_refill) {
          const drugName =
            (item.drug as any)?.name || 'Unknown Drug';
          refillsDue.push(drugName);
        }
      }
    }

    return {
      active: activeItems,
      total_active: activeItems.length,
      potential_interactions: [...new Set(potentialInteractions)],
      recent_pharmacy_orders: pharmacyOrders.slice(0, 20),
      refills_due: [...new Set(refillsDue)],
    };
  }

  // ─── Recovery ──────────────────────────────────────────────────────────────

  private buildRecovery(
    recoveryProfile: any,
    recentLogs: any[],
  ): DrEkaPatientContext['recovery'] {
    if (!recoveryProfile) {
      return {
        is_enrolled: false,
        sobriety_days: null,
        risk_level: null,
        mood_trend: null,
        craving_trend: null,
        last_check_in: null,
        milestones: [],
        coping_strategies_used: [],
        screening_summary: null,
      };
    }

    // Calculate sobriety days
    let sobrietyDays: number | null = null;
    if (recoveryProfile.sobriety_start_date) {
      const start = new Date(recoveryProfile.sobriety_start_date);
      sobrietyDays = Math.floor(
        (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (sobrietyDays < 0) sobrietyDays = 0;
    }

    // Split logs into this week and last week for trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = recentLogs.filter(
      (l: any) => new Date(l.log_date) >= sevenDaysAgo,
    );
    const lastWeek = recentLogs.filter(
      (l: any) => new Date(l.log_date) < sevenDaysAgo,
    );

    // Mood trend
    let moodTrend: { average_7d: number; direction: string } | null = null;
    const thisWeekMoods = thisWeek
      .filter((l: any) => l.mood_score != null)
      .map((l: any) => l.mood_score);
    const lastWeekMoods = lastWeek
      .filter((l: any) => l.mood_score != null)
      .map((l: any) => l.mood_score);

    if (thisWeekMoods.length > 0) {
      const avg =
        Math.round(
          (thisWeekMoods.reduce((a: number, b: number) => a + b, 0) /
            thisWeekMoods.length) *
            10,
        ) / 10;
      let direction = 'stable';
      if (lastWeekMoods.length > 0) {
        const prevAvg =
          lastWeekMoods.reduce((a: number, b: number) => a + b, 0) /
          lastWeekMoods.length;
        const diff = avg - prevAvg;
        if (diff > 0.5) direction = 'improving';
        else if (diff < -0.5) direction = 'declining';
      }
      moodTrend = { average_7d: avg, direction };
    }

    // Craving trend
    let cravingTrend: { average_7d: number; direction: string } | null = null;
    const thisWeekCravings = thisWeek
      .filter((l: any) => l.craving_intensity != null)
      .map((l: any) => l.craving_intensity);
    const lastWeekCravings = lastWeek
      .filter((l: any) => l.craving_intensity != null)
      .map((l: any) => l.craving_intensity);

    if (thisWeekCravings.length > 0) {
      const avg =
        Math.round(
          (thisWeekCravings.reduce((a: number, b: number) => a + b, 0) /
            thisWeekCravings.length) *
            10,
        ) / 10;
      let direction = 'stable';
      if (lastWeekCravings.length > 0) {
        const prevAvg =
          lastWeekCravings.reduce((a: number, b: number) => a + b, 0) /
          lastWeekCravings.length;
        const diff = avg - prevAvg;
        // For cravings, decreasing is improving
        if (diff < -0.5) direction = 'improving';
        else if (diff > 0.5) direction = 'declining';
      }
      cravingTrend = { average_7d: avg, direction };
    }

    // Last check-in date
    const lastCheckIn =
      recentLogs.length > 0
        ? new Date(recentLogs[0].log_date)
        : null;

    // Coping strategies used (aggregate unique)
    const copingStrategies: string[] = [];
    for (const log of recentLogs) {
      if (log.coping_strategies_used) {
        copingStrategies.push(...log.coping_strategies_used);
      }
    }

    // Milestones
    const milestones: string[] = [];
    if (sobrietyDays !== null) {
      if (sobrietyDays >= 1) milestones.push('1 day sober');
      if (sobrietyDays >= 7) milestones.push('1 week sober');
      if (sobrietyDays >= 30) milestones.push('1 month sober');
      if (sobrietyDays >= 90) milestones.push('3 months sober');
      if (sobrietyDays >= 180) milestones.push('6 months sober');
      if (sobrietyDays >= 365) milestones.push('1 year sober');
    }

    // Screening summary
    let screeningSummary: string | null = null;
    if (recoveryProfile.outcomes) {
      const o = recoveryProfile.outcomes;
      screeningSummary = `Enrollment score: ${o.screening_score_at_enrollment ?? 'N/A'}, Current score: ${o.screening_score_current ?? 'N/A'}, Days in program: ${o.days_in_program ?? 0}`;
    }

    return {
      is_enrolled: true,
      sobriety_days: sobrietyDays,
      risk_level: recoveryProfile.current_risk_level || null,
      mood_trend: moodTrend,
      craving_trend: cravingTrend,
      last_check_in: lastCheckIn,
      milestones,
      coping_strategies_used: [...new Set(copingStrategies)],
      screening_summary: screeningSummary,
    };
  }

  // ─── Eka Insights ──────────────────────────────────────────────────────────

  private buildEka(
    ekaMemory: any,
    lastConversation: any,
  ): DrEkaPatientContext['eka'] {
    if (!ekaMemory) {
      return {
        key_facts: [],
        recent_health_concerns: [],
        conversation_count: 0,
        last_conversation_date: null,
      };
    }

    const keyFacts: string[] = ekaMemory.key_facts || [];
    const healthKeywords = [
      'pain', 'ache', 'symptom', 'condition', 'diagnosis', 'medication',
      'allergy', 'surgery', 'hospital', 'treatment', 'disease', 'illness',
      'fever', 'fatigue', 'insomnia', 'anxiety', 'depression', 'stress',
      'headache', 'nausea', 'dizzy', 'breathing', 'heart', 'blood',
      'chronic', 'injury', 'cancer', 'diabetes', 'asthma', 'hypertension',
    ];

    const healthConcerns = keyFacts.filter((fact) =>
      healthKeywords.some((keyword) =>
        fact.toLowerCase().includes(keyword),
      ),
    );

    return {
      key_facts: keyFacts.slice(0, 30),
      recent_health_concerns: healthConcerns.slice(0, 15),
      conversation_count: ekaMemory.conversation_count || 0,
      last_conversation_date: lastConversation?.updated_at || null,
    };
  }

  // ─── Wearables ─────────────────────────────────────────────────────────────

  private buildWearables(
    integrations: any[],
    now: Date,
  ): DrEkaPatientContext['wearables'] {
    const connected = integrations.length > 0;
    const providers = integrations.map((i: any) => i.provider);

    let lastSync: Date | null = null;
    for (const integration of integrations) {
      const syncDate =
        integration.lastSyncedAt || integration.metadata?.lastSyncDate;
      if (syncDate) {
        const d = new Date(syncDate);
        if (!lastSync || d > lastSync) {
          lastSync = d;
        }
      }
    }

    const syncStale =
      connected && lastSync
        ? now.getTime() - lastSync.getTime() > 48 * 60 * 60 * 1000
        : connected; // If connected but never synced, consider stale

    return {
      connected,
      providers,
      last_sync: lastSync,
      sync_stale: syncStale,
    };
  }

  // ─── Location & Activity ───────────────────────────────────────────────────

  private buildActivity(
    sessions: any[],
  ): DrEkaPatientContext['activity'] {
    if (!sessions || sessions.length === 0) {
      return {
        last_login: null,
        current_ip: null,
        previous_ip: null,
        location_changed: false,
        current_location: null,
        previous_location: null,
      };
    }

    const current = sessions[0];
    const previous = sessions.length > 1 ? sessions[1] : null;

    const currentLocation = current.location || null;
    const previousLocation = previous?.location || null;
    const locationChanged =
      !!(currentLocation &&
        previousLocation &&
        currentLocation !== previousLocation);

    return {
      last_login: current.lastActiveAt || current.created_at || null,
      current_ip: current.ipAddress || null,
      previous_ip: previous?.ipAddress || null,
      location_changed: locationChanged,
      current_location: currentLocation,
      previous_location: previousLocation,
    };
  }

  // ─── Engagement ────────────────────────────────────────────────────────────

  private buildEngagement(
    tipStats: any,
    user: any,
  ): DrEkaPatientContext['engagement'] {
    const notifPrefs =
      user.device_integration?.notification_preferences || {};

    // Days since registration
    let daysSinceRegistration = 0;
    if (user.created_at) {
      daysSinceRegistration = Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }

    return {
      health_tips_acted: tipStats?.acted || 0,
      health_tips_dismissed: tipStats?.dismissed || 0,
      health_tips_total: tipStats?.total || 0,
      notification_preferences: {
        health_reminders: notifPrefs.health_reminders ?? true,
        medication_reminders: notifPrefs.medication_reminders ?? true,
        wellness_tips: notifPrefs.wellness_tips ?? true,
      },
      days_since_registration: daysSinceRegistration,
    };
  }

  // ─── Wallet ────────────────────────────────────────────────────────────────

  private buildWallet(wallet: any): DrEkaPatientContext['wallet'] {
    return {
      balance: wallet?.available_balance ?? 0,
      currency: wallet?.currency || 'NGN',
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Parses follow-up timeframe strings like "1 week", "2 weeks", "1 month" into days.
   */
  private parseFollowUpTimeframe(timeframe: string): number {
    const lower = timeframe.toLowerCase().trim();
    const match = lower.match(/^(\d+)\s*(week|month|day)/);
    if (match) {
      const num = parseInt(match[1], 10);
      const unit = match[2];
      switch (unit) {
        case 'day':
          return num;
        case 'week':
          return num * 7;
        case 'month':
          return num * 30;
      }
    }
    // Common string patterns
    if (lower.includes('week')) return 7;
    if (lower.includes('month')) return 30;
    if (lower.includes('year')) return 365;
    return 14; // Default 2 weeks
  }
}
