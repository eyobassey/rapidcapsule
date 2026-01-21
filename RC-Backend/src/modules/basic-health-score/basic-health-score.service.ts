import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import {
  BasicHealthScoreHistory,
  BasicHealthScoreHistoryDocument,
  ScoreChangeTrigger,
} from './entities/basic-health-score-history.entity';
import { Vital, VitalDocument } from '../vitals/entities/vital.entity';
import { HealthCheckup, HealthCheckupDocument } from '../health-checkup/entities/health-checkup.entity';

export interface BasicHealthScoreResult {
  score: number | null;
  status: string;
  statusMessage: string;
  breakdown: any;
  isComplete: boolean;
}

@Injectable()
export class BasicHealthScoreService {
  private readonly logger = new Logger(BasicHealthScoreService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(BasicHealthScoreHistory.name)
    private historyModel: Model<BasicHealthScoreHistoryDocument>,
    @InjectModel(Vital.name) private vitalModel: Model<VitalDocument>,
    @InjectModel(HealthCheckup.name) private healthCheckupModel: Model<HealthCheckupDocument>,
  ) {}

  /**
   * Calculate and store basic health score for a user
   * This is the single source of truth - matches frontend calculation exactly
   */
  async calculateAndStoreScore(
    userId: string | Types.ObjectId,
    trigger: ScoreChangeTrigger,
    triggerDetails?: string,
  ): Promise<BasicHealthScoreResult> {
    const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    try {
      // Fetch all required data using models directly
      const [user, vitalsData, healthCheckups] = await Promise.all([
        this.userModel.findById(userIdObj).exec(),
        this.findUserVitals(userIdObj),
        this.healthCheckupModel
          .find({ user: userIdObj })
          .sort({ created_at: -1 })
          .limit(10)
          .exec(),
      ]);

      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        return { score: null, status: 'incomplete', statusMessage: 'User not found', breakdown: null, isComplete: false };
      }

      const profile = user.profile;
      const vitals = vitalsData;
      const preExistingConditions = user.pre_existing_conditions || [];

      // Get previous score for history
      const previousScore = user.basic_health_score?.score ?? null;

      // Calculate the score using the exact same logic as frontend
      const result = this.calculateScore(vitals, profile, healthCheckups, preExistingConditions);

      // Create data snapshot for audit
      const dataSnapshot = this.createDataSnapshot(vitals, profile, healthCheckups, preExistingConditions);

      // Store history record
      await this.historyModel.create({
        user_id: userIdObj,
        score: result.score,
        previous_score: previousScore,
        status: result.status,
        trigger,
        trigger_details: triggerDetails || this.getTriggerDescription(trigger),
        breakdown: result.breakdown,
        data_snapshot: dataSnapshot,
      });

      // Update user's current score
      await this.userModel.findByIdAndUpdate(userIdObj, {
        basic_health_score: {
          score: result.score,
          status: result.status,
          breakdown: result.breakdown,
          updated_at: new Date(),
        },
      });

      this.logger.log(`Basic health score updated for user ${userId}: ${previousScore} -> ${result.score} (trigger: ${trigger})`);

      return result;
    } catch (error) {
      this.logger.error(`Error calculating basic health score for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's current basic health score (from stored value)
   */
  async getCurrentScore(userId: string | Types.ObjectId): Promise<any> {
    const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const user = await this.userModel.findById(userIdObj).select('basic_health_score').exec();
    return user?.basic_health_score || null;
  }

  /**
   * Get score history for a user
   */
  async getScoreHistory(
    userId: string | Types.ObjectId,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ history: BasicHealthScoreHistoryDocument[]; total: number }> {
    const userIdObj = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      this.historyModel
        .find({ user_id: userIdObj })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.historyModel.countDocuments({ user_id: userIdObj }),
    ]);

    return { history, total };
  }

  /**
   * Calculate score - matches frontend health-score-calculator.js exactly
   */
  private calculateScore(
    vitals: any,
    profile: any,
    healthCheckups: any[],
    preExistingConditions: any[],
  ): BasicHealthScoreResult {
    // Helper to get most recent vital
    const getMostRecent = (arr: any[]) => {
      if (!arr || arr.length === 0) return null;
      return arr.reduce((a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime();
        const dateB = new Date(b.updatedAt || 0).getTime();
        return dateA > dateB ? a : b;
      });
    };

    // Check data completeness
    const hasVitals = vitals && (
      vitals.blood_pressure?.length > 0 ||
      vitals.body_temp?.length > 0 ||
      vitals.pulse_rate?.length > 0 ||
      vitals.blood_sugar_level?.length > 0
    );
    const hasHeightWeight = profile?.basic_health_info?.height?.value && profile?.basic_health_info?.weight?.value;
    const hasCheckups = healthCheckups && healthCheckups.length > 0;

    let completedItems = 0;
    if (hasHeightWeight) completedItems++;
    if (hasVitals) completedItems++;
    if (hasCheckups) completedItems++;

    // Need at least 2 items (matching frontend)
    if (completedItems < 2) {
      return {
        score: null,
        status: 'incomplete',
        statusMessage: 'Complete your health profile to unlock your score',
        breakdown: null,
        isComplete: false,
      };
    }

    let totalScore = 100;
    const breakdown: any = {};

    // 1. BMI Score
    breakdown.bmi = this.calculateBMIScore(profile);
    totalScore += breakdown.bmi.points;

    // 2. Blood Pressure Score
    const bpVital = getMostRecent(vitals?.blood_pressure);
    breakdown.bloodPressure = this.calculateBloodPressureScore(bpVital?.value);
    totalScore += breakdown.bloodPressure.points;

    // 3. Pulse Rate Score
    const prVital = getMostRecent(vitals?.pulse_rate);
    breakdown.pulseRate = this.calculatePulseRateScore(prVital?.rate || prVital?.value);
    totalScore += breakdown.pulseRate.points;

    // 4. Temperature Score
    const tempVital = getMostRecent(vitals?.body_temp);
    breakdown.temperature = this.calculateTemperatureScore(tempVital?.temp || tempVital?.value, tempVital?.unit);
    totalScore += breakdown.temperature.points;

    // 5. Blood Sugar Score
    const bsVital = getMostRecent(vitals?.blood_sugar_level);
    breakdown.bloodSugar = this.calculateBloodSugarScore(bsVital?.level || bsVital?.value, bsVital?.unit);
    totalScore += breakdown.bloodSugar.points;

    // 6. Triage Score from Health Checkups
    breakdown.triage = this.calculateTriageScore(healthCheckups);
    totalScore += breakdown.triage.points;

    // 7. Risk Factors Score
    breakdown.riskFactors = this.calculateRiskFactorsScore(profile, preExistingConditions);
    totalScore += breakdown.riskFactors.points;

    // 8. Data Completeness Bonus
    breakdown.dataCompleteness = this.calculateDataCompletenessBonus(vitals, healthCheckups, hasHeightWeight);
    totalScore += breakdown.dataCompleteness.points;

    // Clamp score
    totalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

    // Determine status
    let status: string, statusMessage: string;
    if (totalScore >= 90) {
      status = 'excellent';
      statusMessage = 'Excellent health status';
    } else if (totalScore >= 70) {
      status = 'good';
      statusMessage = 'Good health status';
    } else if (totalScore >= 50) {
      status = 'fair';
      statusMessage = 'Fair health status - some areas need attention';
    } else {
      status = 'poor';
      statusMessage = 'Health status needs attention';
    }

    return {
      score: totalScore,
      status,
      statusMessage,
      breakdown,
      isComplete: true,
    };
  }

  private calculateBMIScore(profile: any): any {
    const weight = profile?.basic_health_info?.weight?.value;
    const height = profile?.basic_health_info?.height?.value;

    if (!weight || !height) {
      return { points: 0, status: 'unknown', message: 'BMI data not available' };
    }

    const heightM = height > 3 ? height / 100 : height;
    const bmi = weight / (heightM * heightM);

    if (bmi >= 35) {
      return { points: -15, status: 'severe', message: 'Severe obesity - high health risk', value: bmi };
    }
    if (bmi >= 30) {
      return { points: -10, status: 'high', message: 'Obesity - increased health risk', value: bmi };
    }
    if (bmi >= 25) {
      return { points: -5, status: 'moderate', message: 'Overweight - monitor weight', value: bmi };
    }
    if (bmi < 18.5) {
      return { points: -8, status: 'moderate', message: 'Underweight - nutritional attention needed', value: bmi };
    }
    return { points: 0, status: 'normal', message: 'Healthy BMI range', value: bmi };
  }

  private calculateBloodPressureScore(bloodPressure: string): any {
    if (!bloodPressure || typeof bloodPressure !== 'string') {
      return { points: 0, status: 'unknown', message: 'Blood pressure data not available' };
    }

    const parts = bloodPressure.split('/');
    if (parts.length !== 2) {
      return { points: 0, status: 'unknown', message: 'Invalid blood pressure format' };
    }

    const systolic = parseInt(parts[0]);
    const diastolic = parseInt(parts[1]);

    if (isNaN(systolic) || isNaN(diastolic)) {
      return { points: 0, status: 'unknown', message: 'Invalid blood pressure values' };
    }

    if (systolic >= 180 || diastolic >= 120) {
      return { points: -15, status: 'critical', message: 'Hypertensive crisis - seek immediate care', value: bloodPressure };
    }
    if (systolic >= 140 || diastolic >= 90) {
      return { points: -12, status: 'high', message: 'High blood pressure (Stage 2)', value: bloodPressure };
    }
    if (systolic >= 130 || diastolic > 80) {
      return { points: -7, status: 'moderate', message: 'High blood pressure (Stage 1)', value: bloodPressure };
    }
    if (systolic >= 120 || diastolic === 80) {
      return { points: -3, status: 'elevated', message: 'Elevated blood pressure', value: bloodPressure };
    }
    if (systolic < 90 || diastolic < 60) {
      return { points: -5, status: 'low', message: 'Low blood pressure', value: bloodPressure };
    }
    return { points: 0, status: 'normal', message: 'Normal blood pressure', value: bloodPressure };
  }

  private calculatePulseRateScore(pulseRate: any): any {
    if (!pulseRate) {
      return { points: 0, status: 'unknown', message: 'Pulse rate data not available' };
    }

    const pulse = parseInt(pulseRate);
    if (isNaN(pulse)) {
      return { points: 0, status: 'unknown', message: 'Invalid pulse rate value' };
    }

    if (pulse < 40 || pulse > 120) {
      return { points: -10, status: 'severe', message: pulse < 40 ? 'Severe bradycardia' : 'Severe tachycardia', value: pulse };
    }
    if (pulse < 50 || pulse > 110) {
      return { points: -7, status: 'moderate', message: pulse < 50 ? 'Bradycardia' : 'Tachycardia', value: pulse };
    }
    if (pulse < 60 || pulse > 100) {
      return { points: -3, status: 'mild', message: pulse < 60 ? 'Low resting heart rate' : 'Elevated heart rate', value: pulse };
    }
    return { points: 0, status: 'normal', message: 'Normal heart rate', value: pulse };
  }

  private calculateTemperatureScore(temperature: any, unit?: string): any {
    if (!temperature) {
      return { points: 0, status: 'unknown', message: 'Temperature data not available' };
    }

    let tempC = parseFloat(temperature);
    if (isNaN(tempC)) {
      return { points: 0, status: 'unknown', message: 'Invalid temperature value' };
    }

    // Convert to Celsius if in Fahrenheit
    if (unit === '°F' || unit === 'F' || tempC > 50) {
      tempC = (tempC - 32) * 5 / 9;
    }

    if (tempC < 35 || tempC > 39) {
      return { points: -10, status: 'severe', message: tempC < 35 ? 'Hypothermia - seek care' : 'High fever - seek care', value: tempC };
    }
    if (tempC > 38) {
      return { points: -7, status: 'moderate', message: 'Fever detected', value: tempC };
    }
    if (tempC > 37.2) {
      return { points: -3, status: 'mild', message: 'Slightly elevated temperature', value: tempC };
    }
    if (tempC < 36.1) {
      return { points: -2, status: 'mild', message: 'Slightly low temperature', value: tempC };
    }
    return { points: 0, status: 'normal', message: 'Normal body temperature', value: tempC };
  }

  private calculateBloodSugarScore(bloodSugar: any, unit?: string): any {
    if (!bloodSugar) {
      return { points: 0, status: 'unknown', message: 'Blood sugar data not available' };
    }

    let sugarMgDl = parseFloat(bloodSugar);
    if (isNaN(sugarMgDl)) {
      return { points: 0, status: 'unknown', message: 'Invalid blood sugar value' };
    }

    // Convert mmol/L to mg/dL if needed
    if (unit === 'mmol/L' || sugarMgDl < 30) {
      sugarMgDl = sugarMgDl * 18;
    }

    if (sugarMgDl < 54 || sugarMgDl > 200) {
      return { points: -10, status: 'severe', message: sugarMgDl < 54 ? 'Severe hypoglycemia' : 'Very high blood sugar', value: sugarMgDl };
    }
    if (sugarMgDl < 70 || sugarMgDl > 125) {
      return { points: -7, status: 'high', message: sugarMgDl < 70 ? 'Low blood sugar' : 'Diabetic range', value: sugarMgDl };
    }
    if (sugarMgDl > 100) {
      return { points: -4, status: 'moderate', message: 'Pre-diabetic range', value: sugarMgDl };
    }
    return { points: 0, status: 'normal', message: 'Normal blood sugar', value: sugarMgDl };
  }

  private calculateTriageScore(healthCheckups: any[]): any {
    if (!healthCheckups || healthCheckups.length === 0) {
      return { points: 0, status: 'unknown', message: 'No health checkup data', recentTriage: null };
    }

    const recentCheckup = healthCheckups.find(c =>
      c.response?.data?.triage_level || c.triage_level
    );

    if (!recentCheckup) {
      return { points: 0, status: 'unknown', message: 'No triage data available', recentTriage: null };
    }

    const triageLevel = recentCheckup.response?.data?.triage_level || recentCheckup.triage_level;
    const checkupDate = new Date(recentCheckup.created_at || recentCheckup.createdAt);
    const daysSinceCheckup = (Date.now() - checkupDate.getTime()) / (1000 * 60 * 60 * 24);

    // Recovery detection
    if (triageLevel === 'self_care') {
      return { points: 0, status: 'normal', message: 'Healthy - self-care appropriate', recentTriage: triageLevel };
    }

    // If older than 14 days, assume recovered
    if (daysSinceCheckup > 14) {
      return { points: 0, status: 'normal', message: 'Previous checkup - consider follow-up', recentTriage: triageLevel };
    }

    const triageScores: Record<string, any> = {
      'emergency': { points: -20, status: 'critical', message: 'Emergency care recommended' },
      'emergency_ambulance': { points: -20, status: 'critical', message: 'Emergency ambulance recommended' },
      'consultation_24': { points: -12, status: 'high', message: 'See doctor within 24 hours' },
      'consultation': { points: -7, status: 'moderate', message: 'Medical consultation recommended' },
    };

    const result = triageScores[triageLevel] || { points: -3, status: 'mild', message: 'Health checkup completed' };
    return { ...result, recentTriage: triageLevel };
  }

  private calculateRiskFactorsScore(profile: any, preExistingConditions: any[]): any {
    const factors: any[] = [];
    let points = 0;

    const healthRiskFactors = profile?.health_risk_factors || {};

    // Smoking
    if (healthRiskFactors.is_smoker && healthRiskFactors.is_smoker !== 'No') {
      factors.push({ name: 'Smoking', level: 'high', points: -5 });
      points -= 5;
    }

    // Recent injuries
    if (healthRiskFactors.has_recent_injuries && healthRiskFactors.has_recent_injuries !== 'No') {
      factors.push({ name: 'Recent Injuries', level: 'medium', points: -3 });
      points -= 3;
    }

    // Age-based risk
    if (profile?.date_of_birth) {
      const birthDate = new Date(profile.date_of_birth);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      if (age >= 65) {
        factors.push({ name: 'Advanced Age (65+)', level: 'medium', points: -3 });
        points -= 3;
      } else if (age >= 45) {
        factors.push({ name: 'Middle Age (45+)', level: 'low', points: -1 });
        points -= 1;
      }
    }

    // Pre-existing conditions
    if (preExistingConditions && preExistingConditions.length > 0) {
      const conditionPoints = Math.min(preExistingConditions.length * 2, 6);
      factors.push({ name: `${preExistingConditions.length} Pre-existing Condition(s)`, level: 'medium', points: -conditionPoints });
      points -= conditionPoints;
    }

    return {
      points,
      factors,
      message: factors.length > 0 ? `${factors.length} risk factor(s) identified` : 'No significant risk factors',
    };
  }

  private calculateDataCompletenessBonus(vitals: any, healthCheckups: any[], hasHeightWeight: boolean): any {
    let points = 0;
    let completedItems = 0;
    const totalItems = 5;

    // Has recent vitals
    const hasVitals = vitals && (
      vitals.blood_pressure?.length > 0 ||
      vitals.body_temp?.length > 0 ||
      vitals.pulse_rate?.length > 0 ||
      vitals.blood_sugar_level?.length > 0
    );
    if (hasVitals) {
      points += 2;
      completedItems += 1;
    }

    // Has health checkup in last 90 days
    if (healthCheckups && healthCheckups.length > 0) {
      const recentCheckup = healthCheckups[0];
      const checkupDate = new Date(recentCheckup?.created_at || recentCheckup?.createdAt);
      const daysSinceCheckup = (Date.now() - checkupDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceCheckup <= 90) {
        points += 2;
        completedItems += 1;
      }
    }

    // Has height/weight
    if (hasHeightWeight) {
      points += 1;
      completedItems += 1;
    }

    const completeness = Math.round((completedItems / totalItems) * 100);

    return {
      points,
      completeness,
      message: completeness >= 80 ? 'Profile well maintained' : 'Consider completing your health profile',
    };
  }

  private createDataSnapshot(vitals: any, profile: any, healthCheckups: any[], preExistingConditions: any[]): any {
    const getMostRecent = (arr: any[]) => {
      if (!arr || arr.length === 0) return null;
      return arr.reduce((a, b) => {
        const dateA = new Date(a.updatedAt || 0).getTime();
        const dateB = new Date(b.updatedAt || 0).getTime();
        return dateA > dateB ? a : b;
      });
    };

    return {
      vitals_snapshot: {
        blood_pressure: getMostRecent(vitals?.blood_pressure)?.value,
        pulse_rate: getMostRecent(vitals?.pulse_rate)?.value || getMostRecent(vitals?.pulse_rate)?.rate,
        body_temp: getMostRecent(vitals?.body_temp)?.value || getMostRecent(vitals?.body_temp)?.temp,
        blood_sugar: getMostRecent(vitals?.blood_sugar_level)?.value || getMostRecent(vitals?.blood_sugar_level)?.level,
      },
      profile_snapshot: {
        height: profile?.basic_health_info?.height?.value,
        weight: profile?.basic_health_info?.weight?.value,
        date_of_birth: profile?.date_of_birth,
        is_smoker: profile?.health_risk_factors?.is_smoker,
        has_recent_injuries: profile?.health_risk_factors?.has_recent_injuries,
        pre_existing_conditions_count: preExistingConditions?.length || 0,
      },
      recent_checkup_triage: healthCheckups?.[0]?.response?.data?.triage_level || healthCheckups?.[0]?.triage_level,
    };
  }

  private getTriggerDescription(trigger: ScoreChangeTrigger): string {
    const descriptions: Record<ScoreChangeTrigger, string> = {
      [ScoreChangeTrigger.VITALS_UPDATED]: 'Vitals were updated',
      [ScoreChangeTrigger.HEALTH_CHECKUP_COMPLETED]: 'Health checkup was completed',
      [ScoreChangeTrigger.PROFILE_UPDATED]: 'Profile information was updated',
      [ScoreChangeTrigger.MANUAL_RECALCULATION]: 'Score was manually recalculated',
      [ScoreChangeTrigger.INITIAL_CALCULATION]: 'Initial score calculation',
    };
    return descriptions[trigger];
  }

  /**
   * Find user's vitals directly from the model
   * Returns vitals in the format expected by the score calculator
   */
  private async findUserVitals(userId: Types.ObjectId): Promise<any> {
    const vital = await this.vitalModel.findOne({ userId }).exec();
    if (!vital) {
      return null;
    }
    return {
      blood_pressure: vital.blood_pressure || [],
      body_temp: vital.body_temp || [],
      pulse_rate: vital.pulse_rate || [],
      blood_sugar_level: vital.blood_sugar_level || [],
    };
  }
}
