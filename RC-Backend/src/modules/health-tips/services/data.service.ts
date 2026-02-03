import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Vital, VitalDocument } from '../../vitals/entities/vital.entity';
import { HealthCheckup, HealthCheckupDocument } from '../../health-checkup/entities/health-checkup.entity';
import { AdvancedHealthScore, AdvancedHealthScoreDocument } from '../../advanced-health-score/entities/advanced-health-score.entity';

export interface HealthDataContext {
  user_id: string;
  first_name: string;
  age: number | null;
  gender: 'Male' | 'Female' | null;
  bmi: number | null;
  blood_type: string | null;
  genotype: string | null;

  is_smoker: boolean | null;
  alcohol_consumption: 'never' | 'occasional' | 'moderate' | 'heavy' | null;
  exercise_frequency: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  diet_type: string | null;
  sleep_hours: number | null;
  stress_level: 'low' | 'moderate' | 'high' | 'very_high' | null;

  chronic_conditions: string[];
  current_medications: Array<{ name: string; dosage?: string }>;
  allergies: {
    drug: string[];
    food: string[];
    environmental: string[];
  };
  family_history: Array<{ condition: string; relation: string }>;

  vitals: {
    blood_pressure: { systolic: number; diastolic: number; updated_at: Date } | null;
    blood_sugar: { value: number; unit: string; updated_at: Date } | null;
    pulse_rate: { value: number; updated_at: Date } | null;
    temperature: { value: number; unit: string; updated_at: Date } | null;
    weight: { value: number; unit: string; updated_at: Date } | null;
  };

  vitals_history: {
    blood_pressure: Array<{ systolic: number; diastolic: number; recorded_at: Date }>;
    blood_sugar: Array<{ value: number; recorded_at: Date }>;
  };

  basic_health_score: number | null;
  advanced_health_score: {
    overall: number | null;
    domains: Record<string, number>;
  } | null;

  recent_checkups: Array<{
    date: Date;
    triage_level: string;
    top_conditions: Array<{ name: string; probability: number }>;
    has_emergency: boolean;
  }>;

  last_vitals_logged: Date | null;
  last_checkup_date: Date | null;
  last_appointment_date: Date | null;
  days_since_last_vitals: number | null;
  days_since_last_checkup: number | null;
}

@Injectable()
export class HealthTipsDataService {
  private readonly logger = new Logger(HealthTipsDataService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Vital.name)
    private vitalModel: Model<VitalDocument>,
    @InjectModel(HealthCheckup.name)
    private healthCheckupModel: Model<HealthCheckupDocument>,
    @InjectModel(AdvancedHealthScore.name)
    private advancedScoreModel: Model<AdvancedHealthScoreDocument>,
  ) {}

  async buildHealthContext(userId: Types.ObjectId): Promise<HealthDataContext> {
    const [user, vitals, recentCheckups, advancedScore] = await Promise.all([
      this.userModel.findById(userId).lean(),
      this.vitalModel.findOne({ userId }).lean(),
      this.healthCheckupModel
        .find({ user: userId })
        .sort({ created_at: -1 })
        .limit(5)
        .lean(),
      this.advancedScoreModel
        .findOne({ user_id: userId, status: 'completed' })
        .sort({ created_at: -1 })
        .lean(),
    ]);

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const profile = user.profile || {};
    const riskFactors = profile.health_risk_factors || {};
    const medicalHistory = user.medical_history || {};
    const userAllergies = user.allergies || {};

    // Calculate age
    let age: number | null = null;
    if (profile.date_of_birth) {
      const dob = new Date(profile.date_of_birth);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    // Calculate BMI
    let bmi: number | null = null;
    const height = profile.basic_health_info?.height;
    const weight = profile.basic_health_info?.weight;
    if (height?.value && weight?.value) {
      const heightM = height.unit === 'cm' ? height.value / 100 : height.value;
      const weightKg = weight.unit === 'lb' ? weight.value * 0.453592 : weight.value;
      if (heightM > 0) {
        bmi = weightKg / (heightM * heightM);
      }
    }

    // Parse vitals
    const parsedVitals = this.parseVitals(vitals);

    // Parse vitals history
    const vitalsHistory = this.parseVitalsHistory(vitals);

    // Parse checkups
    const parsedCheckups = recentCheckups.map((c: any) => ({
      date: c.created_at,
      triage_level: c.response?.data?.triage_level || 'unknown',
      top_conditions: (c.response?.data?.conditions || []).slice(0, 3).map((cond: any) => ({
        name: cond.common_name || cond.name,
        probability: Math.round((cond.probability || 0) * 100),
      })),
      has_emergency: c.response?.data?.has_emergency_evidence || false,
    }));

    // Calculate days since
    const lastVitalsDate = this.getLastVitalsDate(vitals);
    const lastCheckupDate = (recentCheckups[0] as any)?.created_at || null;

    const now = new Date();
    const daysSinceVitals = lastVitalsDate
      ? Math.floor((now.getTime() - new Date(lastVitalsDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const daysSinceCheckup = lastCheckupDate
      ? Math.floor((now.getTime() - new Date(lastCheckupDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Parse smoking status
    let isSmoker: boolean | null = null;
    if (riskFactors.is_smoker !== undefined) {
      isSmoker = riskFactors.is_smoker === true || riskFactors.is_smoker === 'yes';
    }

    return {
      user_id: userId.toString(),
      first_name: profile.first_name || 'Patient',
      age,
      gender: profile.gender as 'Male' | 'Female' | null,
      bmi,
      blood_type: (profile as any).blood_type || null,
      genotype: (profile as any).genotype || null,

      is_smoker: isSmoker,
      alcohol_consumption: riskFactors.alcohol_consumption || null,
      exercise_frequency: riskFactors.exercise_frequency || null,
      diet_type: riskFactors.diet_type || null,
      sleep_hours: riskFactors.sleep_hours || null,
      stress_level: riskFactors.stress_level || null,

      chronic_conditions: medicalHistory.chronic_conditions || [],
      current_medications: (medicalHistory.current_medications || []).map((m: any) => ({
        name: m.name,
        dosage: m.dosage,
      })),
      allergies: {
        drug: (userAllergies.drug_allergies || []).map((a: any) => a.drug_name),
        food: (userAllergies.food_allergies || []).map((a: any) => a.food_name),
        environmental: (userAllergies.environmental_allergies || []).map((a: any) => a.allergen),
      },
      family_history: (medicalHistory.family_history || []).map((h: any) => ({
        condition: h.condition,
        relation: h.relation || 'unknown',
      })),

      vitals: parsedVitals,
      vitals_history: vitalsHistory,

      basic_health_score: user.basic_health_score?.score || null,
      advanced_health_score: advancedScore
        ? {
            overall: advancedScore.report?.overall_score || null,
            domains: (advancedScore.report?.domain_scores || []).reduce(
              (acc: Record<string, number>, d: any) => {
                acc[d.domain] = d.score;
                return acc;
              },
              {},
            ),
          }
        : null,

      recent_checkups: parsedCheckups,

      last_vitals_logged: lastVitalsDate,
      last_checkup_date: lastCheckupDate,
      last_appointment_date: null, // TODO: fetch from appointments if needed
      days_since_last_vitals: daysSinceVitals,
      days_since_last_checkup: daysSinceCheckup,
    };
  }

  private parseVitals(vitals: any): HealthDataContext['vitals'] {
    if (!vitals) {
      return {
        blood_pressure: null,
        blood_sugar: null,
        pulse_rate: null,
        temperature: null,
        weight: null,
      };
    }

    // Get most recent of each vital type
    const getLatest = (arr: any[]) => (arr && arr.length > 0 ? arr[arr.length - 1] : null);

    const bp = getLatest(vitals.blood_pressure);
    const bs = getLatest(vitals.blood_sugar_level);
    const pr = getLatest(vitals.pulse_rate);
    const temp = getLatest(vitals.body_temp);
    const wt = getLatest(vitals.body_weight);

    let parsedBP: { systolic: number; diastolic: number; updated_at: Date } | null = null;
    if (bp?.value) {
      const parts = bp.value.toString().split('/');
      if (parts.length === 2) {
        parsedBP = {
          systolic: parseInt(parts[0], 10),
          diastolic: parseInt(parts[1], 10),
          updated_at: bp.updatedAt || new Date(),
        };
      }
    }

    return {
      blood_pressure: parsedBP,
      blood_sugar: bs?.value
        ? {
            value: parseFloat(bs.value),
            unit: bs.unit || 'mg/dL',
            updated_at: bs.updatedAt || new Date(),
          }
        : null,
      pulse_rate: pr?.value
        ? {
            value: parseInt(pr.value, 10),
            updated_at: pr.updatedAt || new Date(),
          }
        : null,
      temperature: temp?.value
        ? {
            value: parseFloat(temp.value),
            unit: temp.unit || '°C',
            updated_at: temp.updatedAt || new Date(),
          }
        : null,
      weight: wt?.value
        ? {
            value: parseFloat(wt.value),
            unit: wt.unit || 'kg',
            updated_at: wt.updatedAt || new Date(),
          }
        : null,
    };
  }

  private parseVitalsHistory(vitals: any): HealthDataContext['vitals_history'] {
    if (!vitals) {
      return {
        blood_pressure: [],
        blood_sugar: [],
      };
    }

    const bpHistory = (vitals.blood_pressure || []).slice(-10).map((bp: any) => {
      const parts = (bp.value || '').toString().split('/');
      return {
        systolic: parseInt(parts[0], 10) || 0,
        diastolic: parseInt(parts[1], 10) || 0,
        recorded_at: bp.updatedAt || new Date(),
      };
    });

    const bsHistory = (vitals.blood_sugar_level || []).slice(-10).map((bs: any) => ({
      value: parseFloat(bs.value) || 0,
      recorded_at: bs.updatedAt || new Date(),
    }));

    return {
      blood_pressure: bpHistory,
      blood_sugar: bsHistory,
    };
  }

  private getLastVitalsDate(vitals: any): Date | null {
    if (!vitals) return null;

    const dates: Date[] = [];

    const checkArray = (arr: any[]) => {
      if (arr && arr.length > 0) {
        const latest = arr[arr.length - 1];
        if (latest?.updatedAt) {
          dates.push(new Date(latest.updatedAt));
        }
      }
    };

    checkArray(vitals.blood_pressure);
    checkArray(vitals.blood_sugar_level);
    checkArray(vitals.pulse_rate);
    checkArray(vitals.body_temp);
    checkArray(vitals.body_weight);

    if (dates.length === 0) return null;

    return dates.reduce((latest, d) => (d > latest ? d : latest), dates[0]);
  }
}
