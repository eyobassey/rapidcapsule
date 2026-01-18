/**
 * Health Score Calculator
 *
 * Calculates a comprehensive health score based on various health metrics.
 * Used in both patient dashboard and admin panel for consistency.
 *
 * Score Range: 0-100
 * - 90-100: Excellent
 * - 70-89: Good
 * - 50-69: Fair
 * - 0-49: Poor
 */

/**
 * Calculate BMI score deduction
 * @param {number|null} bmi - Body Mass Index value
 * @returns {Object} - { points: number, status: string, message: string }
 */
export const calculateBMIScore = (bmi) => {
  if (!bmi || isNaN(bmi)) {
    return { points: 0, status: 'unknown', message: 'BMI data not available' };
  }

  const bmiNum = parseFloat(bmi);

  if (bmiNum >= 35) {
    return { points: -15, status: 'severe', message: 'Severe obesity - high health risk' };
  }
  if (bmiNum >= 30) {
    return { points: -10, status: 'high', message: 'Obesity - increased health risk' };
  }
  if (bmiNum >= 25) {
    return { points: -5, status: 'moderate', message: 'Overweight - monitor weight' };
  }
  if (bmiNum < 18.5) {
    return { points: -8, status: 'moderate', message: 'Underweight - nutritional attention needed' };
  }
  return { points: 0, status: 'normal', message: 'Healthy BMI range' };
};

/**
 * Calculate Blood Pressure score deduction
 * @param {string|null} bloodPressure - BP in format "systolic/diastolic"
 * @returns {Object} - { points: number, status: string, message: string }
 */
export const calculateBloodPressureScore = (bloodPressure) => {
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

  // Hypertensive Crisis
  if (systolic >= 180 || diastolic >= 120) {
    return { points: -15, status: 'critical', message: 'Hypertensive crisis - seek immediate care' };
  }
  // High Stage 2
  if (systolic >= 140 || diastolic >= 90) {
    return { points: -12, status: 'high', message: 'High blood pressure (Stage 2)' };
  }
  // High Stage 1 (130-139 systolic OR 80-89 diastolic, but not exactly 120/80)
  if (systolic >= 130 || diastolic > 80) {
    return { points: -7, status: 'moderate', message: 'High blood pressure (Stage 1)' };
  }
  // Elevated (120-129 systolic OR diastolic exactly 80)
  if (systolic >= 120 || diastolic === 80) {
    return { points: -3, status: 'elevated', message: 'Elevated blood pressure' };
  }
  // Low blood pressure
  if (systolic < 90 || diastolic < 60) {
    return { points: -5, status: 'low', message: 'Low blood pressure' };
  }

  return { points: 0, status: 'normal', message: 'Normal blood pressure' };
};

/**
 * Calculate Pulse Rate score deduction
 * @param {number|string|null} pulseRate - Heart rate in bpm
 * @returns {Object} - { points: number, status: string, message: string }
 */
export const calculatePulseRateScore = (pulseRate) => {
  if (!pulseRate) {
    return { points: 0, status: 'unknown', message: 'Pulse rate data not available' };
  }

  const pulse = parseInt(pulseRate);
  if (isNaN(pulse)) {
    return { points: 0, status: 'unknown', message: 'Invalid pulse rate value' };
  }

  // Severe bradycardia or tachycardia
  if (pulse < 40 || pulse > 120) {
    return { points: -10, status: 'severe', message: pulse < 40 ? 'Severe bradycardia' : 'Severe tachycardia' };
  }
  // Moderate deviation
  if (pulse < 50 || pulse > 110) {
    return { points: -7, status: 'moderate', message: pulse < 50 ? 'Bradycardia' : 'Tachycardia' };
  }
  // Mild deviation
  if (pulse < 60 || pulse > 100) {
    return { points: -3, status: 'mild', message: pulse < 60 ? 'Low resting heart rate' : 'Elevated heart rate' };
  }

  return { points: 0, status: 'normal', message: 'Normal heart rate' };
};

/**
 * Calculate Body Temperature score deduction
 * @param {number|string|null} temperature - Temperature value
 * @param {string} unit - Temperature unit ('°C' or '°F')
 * @returns {Object} - { points: number, status: string, message: string }
 */
export const calculateTemperatureScore = (temperature, unit = '°C') => {
  if (!temperature) {
    return { points: 0, status: 'unknown', message: 'Temperature data not available' };
  }

  let tempC = parseFloat(temperature);
  if (isNaN(tempC)) {
    return { points: 0, status: 'unknown', message: 'Invalid temperature value' };
  }

  // Convert to Celsius if needed
  if (unit === '°F' || unit === 'F') {
    tempC = (tempC - 32) * 5 / 9;
  }

  // Hypothermia or High fever
  if (tempC < 35 || tempC > 39) {
    return { points: -10, status: 'severe', message: tempC < 35 ? 'Hypothermia - seek care' : 'High fever - seek care' };
  }
  // Fever
  if (tempC > 38) {
    return { points: -7, status: 'moderate', message: 'Fever detected' };
  }
  // Low-grade fever
  if (tempC > 37.2) {
    return { points: -3, status: 'mild', message: 'Slightly elevated temperature' };
  }
  // Slightly low
  if (tempC < 36.1) {
    return { points: -2, status: 'mild', message: 'Slightly low temperature' };
  }

  return { points: 0, status: 'normal', message: 'Normal body temperature' };
};

/**
 * Calculate Blood Sugar score deduction
 * @param {number|string|null} bloodSugar - Blood sugar level
 * @param {string} unit - Unit ('mg/dL' or 'mmol/L')
 * @returns {Object} - { points: number, status: string, message: string }
 */
export const calculateBloodSugarScore = (bloodSugar, unit = 'mg/dL') => {
  if (!bloodSugar) {
    return { points: 0, status: 'unknown', message: 'Blood sugar data not available' };
  }

  let sugarMgDl = parseFloat(bloodSugar);
  if (isNaN(sugarMgDl)) {
    return { points: 0, status: 'unknown', message: 'Invalid blood sugar value' };
  }

  // Convert mmol/L to mg/dL if needed
  if (unit === 'mmol/L') {
    sugarMgDl = sugarMgDl * 18;
  }

  // Severe hypoglycemia or very high
  if (sugarMgDl < 54 || sugarMgDl > 200) {
    return { points: -10, status: 'severe', message: sugarMgDl < 54 ? 'Severe hypoglycemia' : 'Very high blood sugar' };
  }
  // Diabetic range or hypoglycemia
  if (sugarMgDl < 70 || sugarMgDl > 125) {
    return { points: -7, status: 'high', message: sugarMgDl < 70 ? 'Low blood sugar' : 'Diabetic range' };
  }
  // Pre-diabetic
  if (sugarMgDl > 100) {
    return { points: -4, status: 'moderate', message: 'Pre-diabetic range' };
  }

  return { points: 0, status: 'normal', message: 'Normal blood sugar' };
};

/**
 * Calculate Triage Level score deduction from health checkups
 * Uses recovery detection: if the most recent checkup is 'self_care',
 * the user is considered recovered regardless of previous serious checkups
 * @param {Array} healthCheckups - Array of health checkup records (sorted by date, newest first)
 * @returns {Object} - { points: number, status: string, message: string, recentTriage: string }
 */
export const calculateTriageScore = (healthCheckups) => {
  if (!healthCheckups || !Array.isArray(healthCheckups) || healthCheckups.length === 0) {
    return { points: 0, status: 'unknown', message: 'No health checkup data', recentTriage: null };
  }

  // Get the most recent checkup with triage data
  const recentCheckup = healthCheckups.find(c =>
    c.response?.data?.triage_level || c.triage_level
  );

  if (!recentCheckup) {
    return { points: 0, status: 'unknown', message: 'No triage data available', recentTriage: null };
  }

  const triageLevel = recentCheckup.response?.data?.triage_level || recentCheckup.triage_level;

  // Recovery detection: if most recent checkup is self_care, user is considered healthy/recovered
  // No penalty applied regardless of previous serious checkups
  if (triageLevel === 'self_care') {
    return {
      points: 0,
      status: 'normal',
      message: 'Healthy - self-care appropriate',
      recentTriage: triageLevel
    };
  }

  // Check if this is a recent checkup (within last 14 days) to apply penalty
  const checkupDate = new Date(recentCheckup.created_at || recentCheckup.createdAt);
  const daysSinceCheckup = (new Date() - checkupDate) / (1000 * 60 * 60 * 24);

  // If checkup is older than 14 days without a follow-up, assume recovered
  if (daysSinceCheckup > 14) {
    return {
      points: 0,
      status: 'normal',
      message: 'Previous checkup - consider follow-up',
      recentTriage: triageLevel
    };
  }

  const triageScores = {
    'emergency': { points: -20, status: 'critical', message: 'Emergency care recommended' },
    'emergency_ambulance': { points: -20, status: 'critical', message: 'Emergency ambulance recommended' },
    'consultation_24': { points: -12, status: 'high', message: 'See doctor within 24 hours' },
    'consultation': { points: -7, status: 'moderate', message: 'Medical consultation recommended' },
  };

  const result = triageScores[triageLevel] || { points: -3, status: 'mild', message: 'Health checkup completed' };
  return { ...result, recentTriage: triageLevel };
};

/**
 * Calculate Risk Factors score deduction
 * @param {Object} profile - User profile object
 * @param {number|null} bmi - BMI value (to avoid double counting)
 * @returns {Object} - { points: number, factors: Array, message: string }
 */
export const calculateRiskFactorsScore = (profile, bmi = null) => {
  const factors = [];
  let points = 0;

  if (!profile) {
    return { points: 0, factors: [], message: 'Profile data not available' };
  }

  const healthRiskFactors = profile.health_risk_factors || {};

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
  if (profile.date_of_birth) {
    const birthDate = new Date(profile.date_of_birth);
    const today = new Date();
    const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));

    if (age >= 65) {
      factors.push({ name: 'Advanced Age (65+)', level: 'medium', points: -3 });
      points -= 3;
    } else if (age >= 45) {
      factors.push({ name: 'Middle Age (45+)', level: 'low', points: -1 });
      points -= 1;
    }
  }

  // Pre-existing conditions
  const conditions = profile.pre_existing_conditions || [];
  if (conditions.length > 0) {
    const conditionPoints = Math.min(conditions.length * 2, 6); // Max -6 points
    factors.push({ name: `${conditions.length} Pre-existing Condition(s)`, level: 'medium', points: -conditionPoints });
    points -= conditionPoints;
  }

  return {
    points,
    factors,
    message: factors.length > 0 ? `${factors.length} risk factor(s) identified` : 'No significant risk factors'
  };
};

/**
 * Calculate Data Completeness bonus
 * @param {Object} data - Object containing vitals, checkups, profile
 * @returns {Object} - { points: number, completeness: number, message: string }
 */
export const calculateDataCompletenessBonus = (data) => {
  const { vitals, healthCheckups, profile } = data;
  let points = 0;
  let completedItems = 0;
  const totalItems = 5;

  // Has recent vitals
  if (vitals && Object.keys(vitals).length > 0) {
    const hasRecentVitals = vitals.body_weight || vitals.blood_pressure ||
                           vitals.pulse_rate || vitals.body_temp || vitals.blood_sugar_level;
    if (hasRecentVitals) {
      points += 2;
      completedItems += 1;
    }
  }

  // Has health checkup in last 90 days
  if (healthCheckups && healthCheckups.length > 0) {
    const recentCheckup = healthCheckups[0];
    const checkupDate = new Date(recentCheckup.created_at || recentCheckup.createdAt);
    const daysSinceCheckup = (new Date() - checkupDate) / (1000 * 60 * 60 * 24);

    if (daysSinceCheckup <= 90) {
      points += 2;
      completedItems += 1;
    }
  }

  // Profile completeness
  if (profile) {
    if (profile.date_of_birth) completedItems += 1;
    if (profile.gender) completedItems += 1;
    if (profile.basic_health_info?.height?.value && profile.basic_health_info?.weight?.value) {
      points += 1;
      completedItems += 1;
    }
  }

  const completeness = Math.round((completedItems / totalItems) * 100);

  return {
    points,
    completeness,
    message: completeness >= 80 ? 'Profile well maintained' : 'Consider completing your health profile'
  };
};

/**
 * Check if user has minimum data to calculate a meaningful health score
 * @param {Object} data - All health data
 * @returns {Object} - { isComplete: boolean, completedItems: Array, missingItems: Array, progress: number }
 */
export const checkDataCompleteness = (data) => {
  const { bmi, vitals = {}, healthCheckups = [], profile = {} } = data;

  // Check height and weight with strict validation
  const height = profile?.basic_health_info?.height?.value;
  const weight = profile?.basic_health_info?.weight?.value;
  const hasHeight = height && !isNaN(parseFloat(height)) && parseFloat(height) > 0;
  const hasWeight = weight && !isNaN(parseFloat(weight)) && parseFloat(weight) > 0;

  const items = {
    profile: {
      label: 'Add your basic info (height/weight)',
      completed: hasHeight && hasWeight
    },
    vitals: {
      label: 'Record your vitals',
      completed: !!(vitals?.blood_pressure || vitals?.body_temp || vitals?.pulse_rate || vitals?.blood_sugar_level)
    },
    healthCheckup: {
      label: 'Complete a health checkup',
      completed: healthCheckups && healthCheckups.length > 0
    }
  };

  const completedItems = Object.entries(items)
    .filter(([_, item]) => item.completed)
    .map(([key, item]) => ({ key, label: item.label }));

  const missingItems = Object.entries(items)
    .filter(([_, item]) => !item.completed)
    .map(([key, item]) => ({ key, label: item.label }));

  const progress = Math.round((completedItems.length / Object.keys(items).length) * 100);

  // Require at least 2 items to show a real score
  const isComplete = completedItems.length >= 2;

  return {
    isComplete,
    completedItems,
    missingItems,
    progress,
    totalItems: Object.keys(items).length
  };
};

/**
 * Main function to calculate comprehensive health score
 * @param {Object} data - All health data
 * @returns {Object} - Complete health score breakdown
 */
export const calculateHealthScore = (data) => {
  const {
    bmi,
    vitals = {},
    healthCheckups = [],
    profile = {}
  } = data;

  // Check if user has minimum data for a meaningful score
  const dataStatus = checkDataCompleteness(data);

  // If user doesn't have enough data, return incomplete state
  if (!dataStatus.isComplete) {
    return {
      score: null,
      status: 'incomplete',
      statusMessage: 'Complete your health profile to unlock your score',
      statusColor: '#9ca3af', // gray
      isComplete: false,
      dataStatus,
      breakdown: null,
      lastUpdated: new Date().toISOString()
    };
  }

  // Start with base score of 100
  let totalScore = 100;
  const breakdown = {};

  // 1. BMI Score
  breakdown.bmi = calculateBMIScore(bmi);
  totalScore += breakdown.bmi.points;

  // 2. Blood Pressure Score
  const bp = vitals.blood_pressure?.value || vitals.blood_pressure;
  breakdown.bloodPressure = calculateBloodPressureScore(bp);
  totalScore += breakdown.bloodPressure.points;

  // 3. Pulse Rate Score
  const pulse = vitals.pulse_rate?.value || vitals.pulse_rate || vitals.heart_rate;
  breakdown.pulseRate = calculatePulseRateScore(pulse);
  totalScore += breakdown.pulseRate.points;

  // 4. Temperature Score
  const temp = vitals.body_temp?.value || vitals.temperature;
  const tempUnit = vitals.body_temp?.unit || '°C';
  breakdown.temperature = calculateTemperatureScore(temp, tempUnit);
  totalScore += breakdown.temperature.points;

  // 5. Blood Sugar Score
  const sugar = vitals.blood_sugar_level?.value || vitals.blood_sugar;
  const sugarUnit = vitals.blood_sugar_level?.unit || 'mg/dL';
  breakdown.bloodSugar = calculateBloodSugarScore(sugar, sugarUnit);
  totalScore += breakdown.bloodSugar.points;

  // 6. Triage Score from Health Checkups
  breakdown.triage = calculateTriageScore(healthCheckups);
  totalScore += breakdown.triage.points;

  // 7. Risk Factors Score
  breakdown.riskFactors = calculateRiskFactorsScore(profile, bmi);
  totalScore += breakdown.riskFactors.points;

  // 8. Data Completeness Bonus
  breakdown.dataCompleteness = calculateDataCompletenessBonus({ vitals, healthCheckups, profile });
  totalScore += breakdown.dataCompleteness.points;

  // Clamp score between 0 and 100
  totalScore = Math.max(0, Math.min(100, totalScore));

  // Determine overall status
  let status, statusMessage, statusColor;
  if (totalScore >= 90) {
    status = 'excellent';
    statusMessage = 'Excellent health status';
    statusColor = '#10b981'; // green
  } else if (totalScore >= 70) {
    status = 'good';
    statusMessage = 'Good health status';
    statusColor = '#3b82f6'; // blue
  } else if (totalScore >= 50) {
    status = 'fair';
    statusMessage = 'Fair health status - some areas need attention';
    statusColor = '#f59e0b'; // orange
  } else {
    status = 'poor';
    statusMessage = 'Health status needs attention';
    statusColor = '#ef4444'; // red
  }

  // Generate suggestions based on breakdown
  const suggestions = generateSuggestions(breakdown);

  return {
    score: Math.round(totalScore),
    status,
    statusMessage,
    statusColor,
    isComplete: true,
    dataStatus,
    breakdown,
    suggestions,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * Generate actionable suggestions based on health score breakdown
 * @param {Object} breakdown - Health score breakdown object
 * @returns {Array} - Array of suggestion objects
 */
export const generateSuggestions = (breakdown) => {
  const suggestions = [];

  if (!breakdown) return suggestions;

  // BMI suggestions
  if (breakdown.bmi?.points < 0) {
    suggestions.push({
      category: 'bmi',
      icon: 'fa-weight',
      color: breakdown.bmi.points <= -10 ? 'error' : 'warning',
      title: breakdown.bmi.message,
      points: breakdown.bmi.points,
      action: breakdown.bmi.status === 'severe' || breakdown.bmi.status === 'high'
        ? 'Consider consulting a nutritionist'
        : 'Monitor your diet and exercise'
    });
  }

  // Blood pressure suggestions
  if (breakdown.bloodPressure?.points < 0) {
    suggestions.push({
      category: 'bloodPressure',
      icon: 'fa-heartbeat',
      color: breakdown.bloodPressure.points <= -12 ? 'error' : 'warning',
      title: breakdown.bloodPressure.message,
      points: breakdown.bloodPressure.points,
      action: breakdown.bloodPressure.status === 'critical'
        ? 'Seek immediate medical attention'
        : 'Monitor regularly and reduce sodium intake'
    });
  }

  // Temperature suggestions
  if (breakdown.temperature?.points < 0) {
    suggestions.push({
      category: 'temperature',
      icon: 'fa-thermometer-half',
      color: breakdown.temperature.points <= -7 ? 'error' : 'warning',
      title: breakdown.temperature.message,
      points: breakdown.temperature.points,
      action: breakdown.temperature.status === 'severe'
        ? 'Seek medical attention immediately'
        : 'Rest and stay hydrated'
    });
  }

  // Pulse rate suggestions
  if (breakdown.pulseRate?.points < 0) {
    suggestions.push({
      category: 'pulseRate',
      icon: 'hi-heart',
      color: breakdown.pulseRate.points <= -7 ? 'error' : 'warning',
      title: breakdown.pulseRate.message,
      points: breakdown.pulseRate.points,
      action: 'Monitor your heart rate and consult if persistent'
    });
  }

  // Blood sugar suggestions
  if (breakdown.bloodSugar?.points < 0) {
    suggestions.push({
      category: 'bloodSugar',
      icon: 'bi-droplet-fill',
      color: breakdown.bloodSugar.points <= -7 ? 'error' : 'warning',
      title: breakdown.bloodSugar.message,
      points: breakdown.bloodSugar.points,
      action: breakdown.bloodSugar.status === 'severe'
        ? 'Seek immediate medical attention'
        : 'Monitor your diet and blood sugar levels'
    });
  }

  // Triage suggestions
  if (breakdown.triage?.points < 0) {
    suggestions.push({
      category: 'triage',
      icon: 'fa-stethoscope',
      color: breakdown.triage.points <= -12 ? 'error' : 'warning',
      title: breakdown.triage.message,
      points: breakdown.triage.points,
      action: breakdown.triage.status === 'critical'
        ? 'Follow up on your health checkup recommendations'
        : 'Schedule a follow-up if symptoms persist'
    });
  }

  // Risk factors suggestions
  if (breakdown.riskFactors?.points < 0 && breakdown.riskFactors.factors?.length > 0) {
    breakdown.riskFactors.factors.forEach(factor => {
      suggestions.push({
        category: 'riskFactor',
        icon: 'hi-exclamation-circle',
        color: factor.level === 'high' ? 'error' : 'warning',
        title: factor.name,
        points: factor.points,
        action: factor.name.includes('Smoking')
          ? 'Consider smoking cessation programs'
          : 'Discuss with your healthcare provider'
      });
    });
  }

  return suggestions;
};

/**
 * Get health score class for styling
 * @param {number} score - Health score value
 * @returns {string} - CSS class name
 */
export const getHealthScoreClass = (score) => {
  if (score >= 90) return 'health-excellent';
  if (score >= 70) return 'health-good';
  if (score >= 50) return 'health-fair';
  return 'health-poor';
};

/**
 * Get health score description
 * @param {number} score - Health score value
 * @returns {string} - Description text
 */
export const getHealthScoreDescription = (score) => {
  if (score >= 90) return 'Excellent health status with minimal risk factors. Keep up the great work!';
  if (score >= 70) return 'Good health status with manageable factors. Continue monitoring your health.';
  if (score >= 50) return 'Fair health status. Some areas require attention and lifestyle adjustments.';
  return 'Your health needs attention. Please consult with a healthcare provider.';
};

export default {
  calculateHealthScore,
  calculateBMIScore,
  calculateBloodPressureScore,
  calculatePulseRateScore,
  calculateTemperatureScore,
  calculateBloodSugarScore,
  calculateTriageScore,
  calculateRiskFactorsScore,
  calculateDataCompletenessBonus,
  checkDataCompleteness,
  generateSuggestions,
  getHealthScoreClass,
  getHealthScoreDescription
};
