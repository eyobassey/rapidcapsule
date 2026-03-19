import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../users/entities/user.entity';
import { Vital, VitalDocument } from '../../vitals/entities/vital.entity';
import { HealthCheckup, HealthCheckupDocument } from '../../health-checkup/entities/health-checkup.entity';
import { AdvancedHealthScore, AdvancedHealthScoreDocument } from '../../advanced-health-score/entities/advanced-health-score.entity';
import { Prescription, PrescriptionDocument } from '../../prescriptions/entities/prescription.entity';
import { Appointment, AppointmentDocument } from '../../appointments/entities/appointment.entity';
import { EkaPatientMemory, EkaPatientMemoryDocument } from '../../eka/entities/eka-patient-memory.entity';
import { HealthIntegration, HealthIntegrationDocument, IntegrationStatus } from '../../health-integrations/schemas/health-integration.schema';
import { RecoveryProfile, RecoveryProfileDocument } from '../../recovery/entities/recovery-profile.entity';
import { SobrietyLog, SobrietyLogDocument } from '../../recovery/entities/sobriety-log.entity';

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

  activity_vitals: {
    steps_today: number | null;
    steps_7d_avg: number | null;
    calories_burned: number | null;
    active_minutes: number | null;
    distance: { value: number; unit: string } | null;
  };

  sleep_vitals: {
    last_night_hours: number | null;
    average_7d: number | null;
    quality_trend: 'improving' | 'declining' | 'stable' | null;
  };

  mental_health_vitals: {
    stress_level: { value: number; updated_at: Date } | null;
    mood_score: { value: number; updated_at: Date } | null;
    anxiety_level: { value: number; updated_at: Date } | null;
    motivation_level: { value: number; updated_at: Date } | null;
    mood_trend: 'improving' | 'declining' | 'stable' | null;
  };

  body_composition: {
    body_fat: { value: number; unit: string; updated_at: Date } | null;
    muscle_mass: { value: number; unit: string; updated_at: Date } | null;
    hydration: { value: number; unit: string; updated_at: Date } | null;
    visceral_fat: { value: number; unit: string; updated_at: Date } | null;
  };

  active_prescriptions: Array<{
    drug_name: string;
    dose: string;
    interval: string;
    period: string;
    prescribed_at: Date;
  }>;

  recent_appointments: Array<{
    date: Date;
    category: string;
    status: string;
    primary_diagnosis: string | null;
    follow_up_required: string | null;
    treatment_plan_summary: string | null;
  }>;

  recovery_context: {
    is_enrolled: boolean;
    sobriety_days: number | null;
    risk_level: string | null;
    recent_mood_avg: number | null;
    recent_craving_avg: number | null;
    today_checked_in: boolean;
  };

  eka_insights: {
    recent_health_concerns: string[];
    key_facts: string[];
  };

  wearable_connected: boolean;
  wearable_providers: string[];

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
    @InjectModel(Prescription.name)
    private prescriptionModel: Model<PrescriptionDocument>,
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(EkaPatientMemory.name)
    private ekaPatientMemoryModel: Model<EkaPatientMemoryDocument>,
    @InjectModel(HealthIntegration.name)
    private healthIntegrationModel: Model<HealthIntegrationDocument>,
    @InjectModel(RecoveryProfile.name)
    private recoveryProfileModel: Model<RecoveryProfileDocument>,
    @InjectModel(SobrietyLog.name)
    private sobrietyLogModel: Model<SobrietyLogDocument>,
  ) {}

  async buildHealthContext(userId: Types.ObjectId): Promise<HealthDataContext> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      user,
      vitals,
      recentCheckups,
      advancedScore,
      prescriptions,
      appointments,
      ekaMemory,
      integrations,
      recoveryProfile,
      recentSobrietyLogs,
    ] = await Promise.all([
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
      this.prescriptionModel
        .find({
          patient: userId,
          created_at: { $gte: thirtyDaysAgo },
        })
        .populate({ path: 'items.drug', select: 'name', options: { _recursed: true } })
        .sort({ created_at: -1 })
        .limit(20)
        .lean(),
      this.appointmentModel
        .find({
          patient: userId,
          created_at: { $gte: ninetyDaysAgo },
        })
        .select('start_time category status clinical_notes created_at')
        .sort({ created_at: -1 })
        .limit(10)
        .lean<any[]>(),
      this.ekaPatientMemoryModel.findOne({ user: userId }).lean(),
      this.healthIntegrationModel
        .find({ userId, status: IntegrationStatus.CONNECTED })
        .lean(),
      this.recoveryProfileModel
        .findOne({ user: userId, status: { $ne: 'archived' }, deleted_at: { $exists: false } })
        .lean(),
      this.sobrietyLogModel
        .find({ user: userId, log_date: { $gte: sevenDaysAgo } })
        .sort({ log_date: -1 })
        .limit(7)
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

    // Parse activity vitals
    const activityVitals = this.parseActivityVitals(vitals);

    // Parse sleep vitals
    const sleepVitals = this.parseSleepVitals(vitals);

    // Parse mental health vitals
    const mentalHealthVitals = this.parseMentalHealthVitals(vitals);

    // Parse body composition
    const bodyComposition = this.parseBodyComposition(vitals);

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

    // Parse prescriptions
    const activePrescriptions = this.parsePrescriptions(prescriptions);

    // Parse appointments
    const recentAppointments = this.parseAppointments(appointments);
    const lastAppointmentDate = appointments.length > 0 ? (appointments[0] as any).created_at : null;

    // Parse Eka insights
    const ekaInsights = this.parseEkaInsights(ekaMemory);

    // Parse wearable integrations
    const wearableConnected = integrations.length > 0;
    const wearableProviders = integrations.map((i: any) => i.provider);

    // Parse recovery context
    const recoveryContext = this.parseRecoveryContext(
      recoveryProfile,
      recentSobrietyLogs,
      todayStart,
    );

    // Calculate days since
    const lastVitalsDate = this.getLastVitalsDate(vitals);
    const lastCheckupDate = (recentCheckups[0] as any)?.created_at || null;

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

      activity_vitals: activityVitals,
      sleep_vitals: sleepVitals,
      mental_health_vitals: mentalHealthVitals,
      body_composition: bodyComposition,

      active_prescriptions: activePrescriptions,
      recent_appointments: recentAppointments,

      recovery_context: recoveryContext,
      eka_insights: ekaInsights,

      wearable_connected: wearableConnected,
      wearable_providers: wearableProviders,

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
      last_appointment_date: lastAppointmentDate,
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

  private parseActivityVitals(vitals: any): HealthDataContext['activity_vitals'] {
    if (!vitals) {
      return {
        steps_today: null,
        steps_7d_avg: null,
        calories_burned: null,
        active_minutes: null,
        distance: null,
      };
    }

    const getLatest = (arr: any[]) => (arr && arr.length > 0 ? arr[arr.length - 1] : null);

    // Steps: get today's entry and calculate 7-day average
    const stepsArr = vitals.steps || [];
    const latestSteps = getLatest(stepsArr);
    let stepsToday: number | null = null;
    let steps7dAvg: number | null = null;

    if (latestSteps?.value) {
      const latestDate = new Date(latestSteps.updatedAt || new Date());
      const today = new Date();
      // If the latest entry is from today, use it
      if (
        latestDate.getFullYear() === today.getFullYear() &&
        latestDate.getMonth() === today.getMonth() &&
        latestDate.getDate() === today.getDate()
      ) {
        stepsToday = parseInt(latestSteps.value, 10) || null;
      }
    }

    // 7-day average for steps
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSteps = stepsArr.filter(
      (s: any) => s.updatedAt && new Date(s.updatedAt) >= sevenDaysAgo,
    );
    if (recentSteps.length > 0) {
      const total = recentSteps.reduce(
        (sum: number, s: any) => sum + (parseInt(s.value, 10) || 0),
        0,
      );
      steps7dAvg = Math.round(total / recentSteps.length);
    }

    // Calories burned (latest)
    const latestCalories = getLatest(vitals.calories_burned);
    const caloriesBurned = latestCalories?.value
      ? parseInt(latestCalories.value, 10)
      : null;

    // Active minutes (latest)
    const latestActiveMin = getLatest(vitals.active_minutes);
    const activeMinutes = latestActiveMin?.value
      ? parseInt(latestActiveMin.value, 10)
      : null;

    // Distance (latest)
    const latestDistance = getLatest(vitals.distance);
    const distance = latestDistance?.value
      ? { value: parseFloat(latestDistance.value), unit: latestDistance.unit || 'km' }
      : null;

    return {
      steps_today: stepsToday,
      steps_7d_avg: steps7dAvg,
      calories_burned: caloriesBurned,
      active_minutes: activeMinutes,
      distance,
    };
  }

  private parseSleepVitals(vitals: any): HealthDataContext['sleep_vitals'] {
    if (!vitals) {
      return { last_night_hours: null, average_7d: null, quality_trend: null };
    }

    const sleepArr = vitals.sleep || [];
    const getLatest = (arr: any[]) => (arr && arr.length > 0 ? arr[arr.length - 1] : null);

    const latestSleep = getLatest(sleepArr);
    const lastNightHours = latestSleep?.value ? parseFloat(latestSleep.value) : null;

    // 7-day average
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSleep = sleepArr.filter(
      (s: any) => s.updatedAt && new Date(s.updatedAt) >= sevenDaysAgo,
    );

    let average7d: number | null = null;
    let qualityTrend: 'improving' | 'declining' | 'stable' | null = null;

    if (recentSleep.length > 0) {
      const total = recentSleep.reduce(
        (sum: number, s: any) => sum + (parseFloat(s.value) || 0),
        0,
      );
      average7d = Math.round((total / recentSleep.length) * 10) / 10;

      // Compute trend: compare first half average to second half
      if (recentSleep.length >= 4) {
        const mid = Math.floor(recentSleep.length / 2);
        const firstHalf = recentSleep.slice(0, mid);
        const secondHalf = recentSleep.slice(mid);
        const firstAvg =
          firstHalf.reduce((s: number, v: any) => s + (parseFloat(v.value) || 0), 0) /
          firstHalf.length;
        const secondAvg =
          secondHalf.reduce((s: number, v: any) => s + (parseFloat(v.value) || 0), 0) /
          secondHalf.length;
        const diff = secondAvg - firstAvg;
        if (diff > 0.5) qualityTrend = 'improving';
        else if (diff < -0.5) qualityTrend = 'declining';
        else qualityTrend = 'stable';
      }
    }

    return { last_night_hours: lastNightHours, average_7d: average7d, quality_trend: qualityTrend };
  }

  private parseMentalHealthVitals(vitals: any): HealthDataContext['mental_health_vitals'] {
    if (!vitals) {
      return {
        stress_level: null,
        mood_score: null,
        anxiety_level: null,
        motivation_level: null,
        mood_trend: null,
      };
    }

    const getLatest = (arr: any[]) => (arr && arr.length > 0 ? arr[arr.length - 1] : null);

    const parseVitalEntry = (entry: any): { value: number; updated_at: Date } | null => {
      if (!entry?.value) return null;
      return {
        value: parseFloat(entry.value),
        updated_at: entry.updatedAt || new Date(),
      };
    };

    const stressLatest = getLatest(vitals.stress_level);
    const moodLatest = getLatest(vitals.mood_score);
    const anxietyLatest = getLatest(vitals.anxiety_level);
    const motivationLatest = getLatest(vitals.motivation_level);

    // Mood trend: compare last 3+ entries
    let moodTrend: 'improving' | 'declining' | 'stable' | null = null;
    const moodArr = vitals.mood_score || [];
    if (moodArr.length >= 3) {
      const recentMoods = moodArr.slice(-6);
      if (recentMoods.length >= 3) {
        const mid = Math.floor(recentMoods.length / 2);
        const firstHalf = recentMoods.slice(0, mid);
        const secondHalf = recentMoods.slice(mid);
        const firstAvg =
          firstHalf.reduce((s: number, v: any) => s + (parseFloat(v.value) || 0), 0) /
          firstHalf.length;
        const secondAvg =
          secondHalf.reduce((s: number, v: any) => s + (parseFloat(v.value) || 0), 0) /
          secondHalf.length;
        const diff = secondAvg - firstAvg;
        if (diff > 0.5) moodTrend = 'improving';
        else if (diff < -0.5) moodTrend = 'declining';
        else moodTrend = 'stable';
      }
    }

    return {
      stress_level: parseVitalEntry(stressLatest),
      mood_score: parseVitalEntry(moodLatest),
      anxiety_level: parseVitalEntry(anxietyLatest),
      motivation_level: parseVitalEntry(motivationLatest),
      mood_trend: moodTrend,
    };
  }

  private parseBodyComposition(vitals: any): HealthDataContext['body_composition'] {
    if (!vitals) {
      return { body_fat: null, muscle_mass: null, hydration: null, visceral_fat: null };
    }

    const getLatest = (arr: any[]) => (arr && arr.length > 0 ? arr[arr.length - 1] : null);

    const parseCompositionEntry = (
      entry: any,
      defaultUnit: string,
    ): { value: number; unit: string; updated_at: Date } | null => {
      if (!entry?.value) return null;
      return {
        value: parseFloat(entry.value),
        unit: entry.unit || defaultUnit,
        updated_at: entry.updatedAt || new Date(),
      };
    };

    return {
      body_fat: parseCompositionEntry(getLatest(vitals.body_fat), '%'),
      muscle_mass: parseCompositionEntry(getLatest(vitals.muscle_mass), 'kg'),
      hydration: parseCompositionEntry(getLatest(vitals.hydration), '%'),
      visceral_fat: parseCompositionEntry(getLatest(vitals.visceral_fat), 'level'),
    };
  }

  private parsePrescriptions(prescriptions: any[]): HealthDataContext['active_prescriptions'] {
    if (!prescriptions || prescriptions.length === 0) return [];

    const results: HealthDataContext['active_prescriptions'] = [];

    for (const rx of prescriptions) {
      const items = rx.items || [];
      for (const item of items) {
        const drugName =
          (item.drug as any)?.name || (typeof item.drug === 'string' ? item.drug : 'Unknown Drug');
        const dose = item.dose
          ? `${item.dose.quantity || ''} ${item.dose.dosage_form || ''}`.trim()
          : '';
        const interval = item.interval
          ? `${item.interval.time || ''} ${item.interval.unit || ''}`.trim()
          : '';
        const period = item.period
          ? `${item.period.number || ''} ${item.period.unit || ''}`.trim()
          : '';

        results.push({
          drug_name: drugName,
          dose,
          interval,
          period,
          prescribed_at: rx.created_at || new Date(),
        });
      }
    }

    return results;
  }

  private parseAppointments(appointments: any[]): HealthDataContext['recent_appointments'] {
    if (!appointments || appointments.length === 0) return [];

    return appointments.map((appt: any) => {
      // Extract primary diagnosis and follow-up from clinical notes
      let primaryDiagnosis: string | null = null;
      let followUpRequired: string | null = null;
      let treatmentPlanSummary: string | null = null;

      const notes = appt.clinical_notes || [];
      if (notes.length > 0) {
        // Find the latest non-draft or the latest note
        const latestNote =
          notes.find((n: any) => !n.is_draft && n.confirmed_accurate) ||
          notes[notes.length - 1];

        if (latestNote) {
          primaryDiagnosis =
            latestNote.assessment_diagnosis?.primary_diagnosis || null;
          followUpRequired =
            latestNote.treatment_plan?.follow_up_required || null;
          treatmentPlanSummary =
            latestNote.treatment_plan?.patient_instructions || null;
        }
      }

      return {
        date: appt.start_time || appt.created_at,
        category: appt.category || 'General',
        status: appt.status || 'OPEN',
        primary_diagnosis: primaryDiagnosis,
        follow_up_required: followUpRequired,
        treatment_plan_summary: treatmentPlanSummary,
      };
    });
  }

  private parseEkaInsights(ekaMemory: any): HealthDataContext['eka_insights'] {
    if (!ekaMemory) {
      return { recent_health_concerns: [], key_facts: [] };
    }

    // Extract health-related key facts
    const keyFacts: string[] = ekaMemory.key_facts || [];
    const healthKeywords = [
      'pain', 'ache', 'symptom', 'condition', 'diagnosis', 'medication',
      'allergy', 'surgery', 'hospital', 'treatment', 'disease', 'illness',
      'fever', 'fatigue', 'insomnia', 'anxiety', 'depression', 'stress',
      'headache', 'nausea', 'dizzy', 'breathing', 'heart', 'blood',
    ];

    const healthConcerns = keyFacts.filter((fact) =>
      healthKeywords.some((keyword) => fact.toLowerCase().includes(keyword)),
    );

    return {
      recent_health_concerns: healthConcerns.slice(0, 10),
      key_facts: keyFacts.slice(0, 20),
    };
  }

  private parseRecoveryContext(
    recoveryProfile: any,
    recentLogs: any[],
    todayStart: Date,
  ): HealthDataContext['recovery_context'] {
    if (!recoveryProfile) {
      return {
        is_enrolled: false,
        sobriety_days: null,
        risk_level: null,
        recent_mood_avg: null,
        recent_craving_avg: null,
        today_checked_in: false,
      };
    }

    // Calculate sobriety days
    let sobrietyDays: number | null = null;
    if (recoveryProfile.sobriety_start_date) {
      const sobrietyStart = new Date(recoveryProfile.sobriety_start_date);
      sobrietyDays = Math.floor(
        (Date.now() - sobrietyStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (sobrietyDays < 0) sobrietyDays = 0;
    }

    // Calculate recent mood and craving averages from sobriety logs
    let recentMoodAvg: number | null = null;
    let recentCravingAvg: number | null = null;
    let todayCheckedIn = false;

    if (recentLogs && recentLogs.length > 0) {
      const moodScores = recentLogs
        .filter((l: any) => l.mood_score != null)
        .map((l: any) => l.mood_score);
      if (moodScores.length > 0) {
        recentMoodAvg =
          Math.round((moodScores.reduce((a: number, b: number) => a + b, 0) / moodScores.length) * 10) / 10;
      }

      const cravingScores = recentLogs
        .filter((l: any) => l.craving_intensity != null)
        .map((l: any) => l.craving_intensity);
      if (cravingScores.length > 0) {
        recentCravingAvg =
          Math.round(
            (cravingScores.reduce((a: number, b: number) => a + b, 0) / cravingScores.length) * 10,
          ) / 10;
      }

      // Check if today has a log
      todayCheckedIn = recentLogs.some((l: any) => {
        const logDate = new Date(l.log_date);
        return logDate >= todayStart;
      });
    }

    return {
      is_enrolled: true,
      sobriety_days: sobrietyDays,
      risk_level: recoveryProfile.current_risk_level || null,
      recent_mood_avg: recentMoodAvg,
      recent_craving_avg: recentCravingAvg,
      today_checked_in: todayCheckedIn,
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
    checkArray(vitals.steps);
    checkArray(vitals.sleep);
    checkArray(vitals.calories_burned);
    checkArray(vitals.distance);
    checkArray(vitals.respiratory_rate);
    checkArray(vitals.spo2);
    checkArray(vitals.stress_level);
    checkArray(vitals.body_fat);
    checkArray(vitals.active_minutes);
    checkArray(vitals.hydration);
    checkArray(vitals.muscle_mass);
    checkArray(vitals.bone_mass);
    checkArray(vitals.body_water);
    checkArray(vitals.visceral_fat);
    checkArray(vitals.bmr);
    checkArray(vitals.craving_level);
    checkArray(vitals.mood_score);
    checkArray(vitals.anxiety_level);
    checkArray(vitals.motivation_level);

    if (dates.length === 0) return null;

    return dates.reduce((latest, d) => (d > latest ? d : latest), dates[0]);
  }
}
