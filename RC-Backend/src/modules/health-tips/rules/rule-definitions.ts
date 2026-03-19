import { HealthDataContext } from '../services/data.service';
import { TipCategory, TipPriority } from '../entities/health-tip.entity';

export interface HealthRule {
  id: string;
  name: string;
  description: string;
  category: TipCategory;
  priority: TipPriority;
  condition: (ctx: HealthDataContext) => boolean;
  generateTip: (ctx: HealthDataContext) => {
    title: string;
    content: string;
    action_text?: string;
    action_route?: string;
    icon?: string;
    tags?: string[];
  };
  cooldown_days: number;
  expiration_days: number;
  max_displays: number;
  enabled: boolean;
}

export const HEALTH_RULES: HealthRule[] = [
  // ========================================
  // VITALS RULES
  // ========================================
  {
    id: 'BP_HIGH_STAGE2',
    name: 'Stage 2 Hypertension Alert',
    description: 'Alerts when blood pressure indicates stage 2 hypertension',
    category: TipCategory.VITALS,
    priority: TipPriority.URGENT,
    condition: (ctx) => {
      if (!ctx.vitals.blood_pressure) return false;
      const { systolic, diastolic } = ctx.vitals.blood_pressure;
      return systolic >= 140 || diastolic >= 90;
    },
    generateTip: (ctx) => {
      const { systolic, diastolic } = ctx.vitals.blood_pressure!;
      return {
        title: 'High Blood Pressure Alert',
        content: `${ctx.first_name}, your recent blood pressure reading (${systolic}/${diastolic} mmHg) is in the Stage 2 hypertension range. This requires attention. Consider scheduling a consultation with a healthcare provider to discuss management options.`,
        action_text: 'Book Appointment',
        action_route: '/app/patient/appointmentsv2/book',
        icon: 'hi-exclamation-triangle',
        tags: ['hypertension', 'urgent', 'blood-pressure'],
      };
    },
    cooldown_days: 1,
    expiration_days: 3,
    max_displays: 3,
    enabled: true,
  },

  {
    id: 'BP_ELEVATED',
    name: 'Elevated Blood Pressure Notice',
    description: 'Notices when blood pressure is elevated but not critical',
    category: TipCategory.VITALS,
    priority: TipPriority.HIGH,
    condition: (ctx) => {
      if (!ctx.vitals.blood_pressure) return false;
      const { systolic, diastolic } = ctx.vitals.blood_pressure;
      return (systolic >= 120 && systolic < 140) || (diastolic >= 80 && diastolic < 90);
    },
    generateTip: (ctx) => ({
      title: 'Keep an Eye on Your Blood Pressure',
      content: `${ctx.first_name}, your blood pressure is slightly elevated. Try reducing sodium intake, managing stress, and staying active. Monitor regularly and track any changes.`,
      action_text: 'Log Blood Pressure',
      action_route: '/app/patient/health-monitor/vitals',
      icon: 'hi-heart',
      tags: ['blood-pressure', 'monitoring'],
    }),
    cooldown_days: 3,
    expiration_days: 7,
    max_displays: 5,
    enabled: true,
  },

  {
    id: 'BLOOD_SUGAR_HIGH',
    name: 'High Blood Sugar Alert',
    description: 'Alerts when fasting blood sugar is high',
    category: TipCategory.VITALS,
    priority: TipPriority.URGENT,
    condition: (ctx) => {
      if (!ctx.vitals.blood_sugar) return false;
      return ctx.vitals.blood_sugar.value >= 126;
    },
    generateTip: (ctx) => ({
      title: 'Blood Sugar Needs Attention',
      content: `${ctx.first_name}, your blood sugar reading of ${ctx.vitals.blood_sugar!.value} ${ctx.vitals.blood_sugar!.unit} is above the normal range. Consider consulting with a healthcare provider about diabetes screening and management.`,
      action_text: 'Book Consultation',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'hi-beaker',
      tags: ['blood-sugar', 'diabetes', 'urgent'],
    }),
    cooldown_days: 1,
    expiration_days: 3,
    max_displays: 3,
    enabled: true,
  },

  {
    id: 'BLOOD_SUGAR_PREDIABETES',
    name: 'Prediabetes Range Notice',
    description: 'Notices when blood sugar indicates prediabetes',
    category: TipCategory.VITALS,
    priority: TipPriority.HIGH,
    condition: (ctx) => {
      if (!ctx.vitals.blood_sugar) return false;
      const value = ctx.vitals.blood_sugar.value;
      return value >= 100 && value < 126;
    },
    generateTip: (ctx) => ({
      title: 'Blood Sugar in Prediabetes Range',
      content: `${ctx.first_name}, your blood sugar is in the prediabetes range. Good news: lifestyle changes can help! Focus on reducing refined carbs, increasing fiber intake, and regular physical activity.`,
      action_text: 'View Nutrition Tips',
      action_route: '/app/patient/health-tips',
      icon: 'hi-chart-bar',
      tags: ['blood-sugar', 'prediabetes', 'lifestyle'],
    }),
    cooldown_days: 7,
    expiration_days: 14,
    max_displays: 5,
    enabled: true,
  },

  {
    id: 'VITALS_OUTDATED',
    name: 'Vitals Not Logged Recently',
    description: 'Reminds users to log vitals when overdue',
    category: TipCategory.VITALS,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => {
      return ctx.days_since_last_vitals !== null && ctx.days_since_last_vitals > 14;
    },
    generateTip: (ctx) => ({
      title: 'Time to Check Your Vitals',
      content: `${ctx.first_name}, it's been ${ctx.days_since_last_vitals} days since you last logged your vitals. Regular monitoring helps track your health trends and catch issues early.`,
      action_text: 'Log Vitals Now',
      action_route: '/app/patient/health-monitor/vitals',
      icon: 'hi-clipboard-check',
      tags: ['vitals', 'monitoring', 'reminder'],
    }),
    cooldown_days: 7,
    expiration_days: 14,
    max_displays: 3,
    enabled: true,
  },

  {
    id: 'PULSE_RATE_HIGH',
    name: 'Elevated Resting Heart Rate',
    description: 'Alerts when pulse rate is consistently high',
    category: TipCategory.VITALS,
    priority: TipPriority.HIGH,
    condition: (ctx) => {
      if (!ctx.vitals.pulse_rate) return false;
      return ctx.vitals.pulse_rate.value > 100;
    },
    generateTip: (ctx) => ({
      title: 'Elevated Heart Rate Detected',
      content: `${ctx.first_name}, your resting heart rate of ${ctx.vitals.pulse_rate!.value} bpm is higher than normal. This could be due to stress, dehydration, or other factors. Consider consulting a doctor if this persists.`,
      action_text: 'Book Appointment',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'hi-heart',
      tags: ['heart-rate', 'cardiovascular'],
    }),
    cooldown_days: 3,
    expiration_days: 7,
    max_displays: 3,
    enabled: true,
  },

  // ========================================
  // LIFESTYLE RULES
  // ========================================
  {
    id: 'SMOKER_HEALTH_RISK',
    name: 'Smoking Cessation Encouragement',
    description: 'Encourages smokers to consider quitting',
    category: TipCategory.LIFESTYLE,
    priority: TipPriority.HIGH,
    condition: (ctx) => ctx.is_smoker === true,
    generateTip: (ctx) => ({
      title: 'Your Path to Smoke-Free Health',
      content: `${ctx.first_name}, quitting smoking is one of the best things you can do for your health. Within 20 minutes of quitting, your heart rate drops. Within 12 hours, carbon monoxide levels normalize. Consider speaking with a doctor about cessation aids.`,
      action_text: 'Book Consultation',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'fa-lungs',
      tags: ['smoking', 'lifestyle', 'respiratory'],
    }),
    cooldown_days: 14,
    expiration_days: 30,
    max_displays: 2,
    enabled: true,
  },

  {
    id: 'HEAVY_ALCOHOL',
    name: 'Alcohol Consumption Awareness',
    description: 'Provides awareness about heavy alcohol consumption',
    category: TipCategory.LIFESTYLE,
    priority: TipPriority.HIGH,
    condition: (ctx) => ctx.alcohol_consumption === 'heavy',
    generateTip: (ctx) => ({
      title: 'Understanding Alcohol Impact',
      content: `${ctx.first_name}, heavy alcohol consumption can affect your liver, heart, and overall health. Consider reducing intake gradually. If you need support, speaking with a healthcare provider can help.`,
      action_text: 'Learn More',
      action_route: '/app/patient/health-tips',
      icon: 'hi-information-circle',
      tags: ['alcohol', 'lifestyle', 'liver'],
    }),
    cooldown_days: 30,
    expiration_days: 60,
    max_displays: 2,
    enabled: true,
  },

  {
    id: 'SEDENTARY_LIFESTYLE',
    name: 'Physical Activity Encouragement',
    description: 'Encourages sedentary users to increase activity',
    category: TipCategory.FITNESS,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => ctx.exercise_frequency === 'sedentary',
    generateTip: (ctx) => ({
      title: 'Small Steps, Big Impact',
      content: `${ctx.first_name}, starting with just 10 minutes of walking daily can improve your health significantly. Regular physical activity reduces heart disease risk, improves mood, and boosts energy levels. Start small and build up gradually.`,
      action_text: 'Set Activity Goal',
      action_route: '/app/patient/health-monitor',
      icon: 'hi-lightning-bolt',
      tags: ['exercise', 'fitness', 'cardiovascular'],
    }),
    cooldown_days: 7,
    expiration_days: 14,
    max_displays: 5,
    enabled: true,
  },

  {
    id: 'POOR_SLEEP',
    name: 'Sleep Improvement Tips',
    description: 'Provides tips for users with poor sleep',
    category: TipCategory.SLEEP,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => ctx.sleep_hours !== null && ctx.sleep_hours < 6,
    generateTip: (ctx) => ({
      title: 'Improve Your Sleep Quality',
      content: `${ctx.first_name}, you're averaging ${ctx.sleep_hours} hours of sleep. Adults need 7-9 hours for optimal health. Try establishing a consistent bedtime, limiting screen time before bed, and creating a cool, dark sleep environment.`,
      action_text: 'View Sleep Tips',
      action_route: '/app/patient/health-tips',
      icon: 'hi-moon',
      tags: ['sleep', 'lifestyle', 'recovery'],
    }),
    cooldown_days: 7,
    expiration_days: 14,
    max_displays: 3,
    enabled: true,
  },

  {
    id: 'HIGH_STRESS',
    name: 'Stress Management Resources',
    description: 'Provides stress management tips for high-stress users',
    category: TipCategory.MENTAL_HEALTH,
    priority: TipPriority.HIGH,
    condition: (ctx) => ctx.stress_level === 'high' || ctx.stress_level === 'very_high',
    generateTip: (ctx) => ({
      title: 'Managing Your Stress',
      content: `${ctx.first_name}, chronic stress can impact your physical and mental health. Consider techniques like deep breathing, meditation, or speaking with a therapist. Even 5 minutes of mindfulness daily can help.`,
      action_text: 'Talk to a Specialist',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'hi-emoji-happy',
      tags: ['stress', 'mental-health', 'wellness'],
    }),
    cooldown_days: 7,
    expiration_days: 14,
    max_displays: 3,
    enabled: true,
  },

  // ========================================
  // BMI & WEIGHT RULES
  // ========================================
  {
    id: 'BMI_OBESE',
    name: 'Obesity Health Awareness',
    description: 'Provides awareness for users with obese BMI',
    category: TipCategory.NUTRITION,
    priority: TipPriority.HIGH,
    condition: (ctx) => ctx.bmi !== null && ctx.bmi >= 30,
    generateTip: (ctx) => ({
      title: 'Weight Management Support',
      content: `${ctx.first_name}, your BMI of ${ctx.bmi!.toFixed(1)} indicates obesity, which increases risk of heart disease, diabetes, and other conditions. A balanced approach combining diet and exercise can help. Consider consulting a dietitian.`,
      action_text: 'Book Dietitian',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'hi-scale',
      tags: ['weight', 'bmi', 'nutrition'],
    }),
    cooldown_days: 14,
    expiration_days: 30,
    max_displays: 2,
    enabled: true,
  },

  {
    id: 'BMI_OVERWEIGHT',
    name: 'Overweight Health Tips',
    description: 'Provides tips for overweight users',
    category: TipCategory.NUTRITION,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => ctx.bmi !== null && ctx.bmi >= 25 && ctx.bmi < 30,
    generateTip: (ctx) => ({
      title: 'Healthy Weight Goals',
      content: `${ctx.first_name}, your BMI of ${ctx.bmi!.toFixed(1)} is in the overweight range. Small changes like reducing portion sizes, choosing whole grains, and adding more vegetables can help you reach a healthier weight.`,
      action_text: 'View Nutrition Tips',
      action_route: '/app/patient/health-tips',
      icon: 'hi-scale',
      tags: ['weight', 'bmi', 'nutrition'],
    }),
    cooldown_days: 14,
    expiration_days: 30,
    max_displays: 3,
    enabled: true,
  },

  {
    id: 'BMI_UNDERWEIGHT',
    name: 'Underweight Health Notice',
    description: 'Provides guidance for underweight users',
    category: TipCategory.NUTRITION,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => ctx.bmi !== null && ctx.bmi < 18.5,
    generateTip: (ctx) => ({
      title: 'Nourishing Your Body',
      content: `${ctx.first_name}, your BMI of ${ctx.bmi!.toFixed(1)} is below the healthy range. Focus on nutrient-dense foods like nuts, avocados, and lean proteins. Consider consulting a healthcare provider to rule out underlying issues.`,
      action_text: 'Book Consultation',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'hi-scale',
      tags: ['weight', 'bmi', 'nutrition'],
    }),
    cooldown_days: 14,
    expiration_days: 30,
    max_displays: 3,
    enabled: true,
  },

  // ========================================
  // CHRONIC CONDITION RULES
  // ========================================
  {
    id: 'DIABETIC_MONITORING',
    name: 'Diabetes Monitoring Reminder',
    description: 'Reminds diabetic patients to monitor blood sugar',
    category: TipCategory.CHRONIC_CONDITION,
    priority: TipPriority.HIGH,
    condition: (ctx) => {
      const hasCondition = ctx.chronic_conditions.some(
        (c) => c.toLowerCase().includes('diabetes') || c.toLowerCase().includes('diabetic'),
      );
      return hasCondition && (ctx.days_since_last_vitals === null || ctx.days_since_last_vitals > 3);
    },
    generateTip: (ctx) => ({
      title: 'Time for Blood Sugar Check',
      content: `${ctx.first_name}, as someone managing diabetes, regular blood sugar monitoring is crucial. Track your levels to help maintain good control and prevent complications.`,
      action_text: 'Log Blood Sugar',
      action_route: '/app/patient/health-monitor/vitals',
      icon: 'hi-beaker',
      tags: ['diabetes', 'blood-sugar', 'monitoring'],
    }),
    cooldown_days: 3,
    expiration_days: 7,
    max_displays: 10,
    enabled: true,
  },

  {
    id: 'HYPERTENSIVE_MONITORING',
    name: 'Hypertension Monitoring Reminder',
    description: 'Reminds hypertensive patients to monitor BP',
    category: TipCategory.CHRONIC_CONDITION,
    priority: TipPriority.HIGH,
    condition: (ctx) => {
      const hasCondition = ctx.chronic_conditions.some(
        (c) => c.toLowerCase().includes('hypertension') || c.toLowerCase().includes('high blood pressure'),
      );
      return hasCondition && (ctx.days_since_last_vitals === null || ctx.days_since_last_vitals > 3);
    },
    generateTip: (ctx) => ({
      title: 'Blood Pressure Check Due',
      content: `${ctx.first_name}, monitoring your blood pressure regularly helps manage hypertension effectively. Consistent tracking allows you and your doctor to adjust treatment as needed.`,
      action_text: 'Log Blood Pressure',
      action_route: '/app/patient/health-monitor/vitals',
      icon: 'hi-heart',
      tags: ['hypertension', 'blood-pressure', 'monitoring'],
    }),
    cooldown_days: 3,
    expiration_days: 7,
    max_displays: 10,
    enabled: true,
  },

  // ========================================
  // PREVENTIVE CARE RULES
  // ========================================
  {
    id: 'HEALTH_CHECKUP_DUE',
    name: 'Regular Health Checkup Reminder',
    description: 'Reminds users to do periodic health checkups',
    category: TipCategory.PREVENTIVE_CARE,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => {
      return ctx.days_since_last_checkup !== null && ctx.days_since_last_checkup > 30;
    },
    generateTip: (ctx) => ({
      title: 'Time for a Health Checkup',
      content: `${ctx.first_name}, it's been ${ctx.days_since_last_checkup} days since your last health assessment. Regular checkups help identify potential issues early when they're easier to address.`,
      action_text: 'Start Health Checkup',
      action_route: '/app/patient/health-checkup',
      icon: 'hi-clipboard-check',
      tags: ['checkup', 'preventive', 'assessment'],
    }),
    cooldown_days: 14,
    expiration_days: 30,
    max_displays: 3,
    enabled: true,
  },

  {
    id: 'FAMILY_HISTORY_AWARENESS',
    name: 'Family History Health Awareness',
    description: 'Alerts users with family history of serious conditions',
    category: TipCategory.PREVENTIVE_CARE,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => {
      const riskyConditions = ['heart disease', 'diabetes', 'cancer', 'stroke', 'hypertension'];
      return ctx.family_history.some((h) => riskyConditions.some((c) => h.condition.toLowerCase().includes(c)));
    },
    generateTip: (ctx) => ({
      title: 'Family History Matters',
      content: `${ctx.first_name}, based on your family health history, you may have elevated risk for certain conditions. Regular screenings and a healthy lifestyle can help reduce your risk. Discuss with your doctor about appropriate preventive measures.`,
      action_text: 'Book Screening',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'hi-user-group',
      tags: ['family-history', 'preventive', 'screening'],
    }),
    cooldown_days: 60,
    expiration_days: 90,
    max_displays: 2,
    enabled: true,
  },

  {
    id: 'SENIOR_BONE_HEALTH',
    name: 'Senior Bone Health Awareness',
    description: 'Bone health tips for seniors',
    category: TipCategory.PREVENTIVE_CARE,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => ctx.age !== null && ctx.age >= 50,
    generateTip: (ctx) => ({
      title: 'Maintaining Strong Bones',
      content: `${ctx.first_name}, bone density naturally decreases with age. Ensure adequate calcium and vitamin D intake, do weight-bearing exercises, and discuss bone density screening with your doctor.`,
      action_text: 'Book Consultation',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'hi-shield-check',
      tags: ['bone-health', 'senior', 'preventive'],
    }),
    cooldown_days: 60,
    expiration_days: 90,
    max_displays: 2,
    enabled: true,
  },

  // ========================================
  // HYDRATION & WELLNESS
  // ========================================
  {
    id: 'HYDRATION_REMINDER',
    name: 'Daily Hydration Reminder',
    description: 'General hydration reminder for all users',
    category: TipCategory.HYDRATION,
    priority: TipPriority.LOW,
    condition: () => true,
    generateTip: (ctx) => ({
      title: 'Stay Hydrated Today',
      content: `${ctx.first_name}, proper hydration supports every bodily function. Aim for 8 glasses of water daily. Pro tip: Keep a water bottle with you and set reminders to drink regularly.`,
      icon: 'hi-beaker',
      tags: ['hydration', 'wellness', 'daily'],
    }),
    cooldown_days: 3,
    expiration_days: 1,
    max_displays: 0,
    enabled: true,
  },

  // ========================================
  // MEDICATION RULES
  // ========================================
  {
    id: 'MEDICATION_REVIEW',
    name: 'Medication Review Reminder',
    description: 'Reminds users with multiple medications to review with doctor',
    category: TipCategory.MEDICATION,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => ctx.current_medications.length >= 3,
    generateTip: (ctx) => ({
      title: 'Medication Review Recommended',
      content: `${ctx.first_name}, you're currently taking ${ctx.current_medications.length} medications. Consider scheduling a medication review with your doctor to ensure they're all working well together and still necessary.`,
      action_text: 'Book Review',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'hi-collection',
      tags: ['medication', 'review', 'safety'],
    }),
    cooldown_days: 90,
    expiration_days: 120,
    max_displays: 1,
    enabled: true,
  },

  // ========================================
  // SLEEP RULES (NEW)
  // ========================================
  {
    id: 'SLEEP_INSUFFICIENT',
    name: 'Insufficient Sleep from Vitals',
    description: 'Alerts when tracked sleep data shows less than 6 hours',
    category: TipCategory.SLEEP,
    priority: TipPriority.HIGH,
    condition: (ctx) => {
      return ctx.sleep_vitals.last_night_hours !== null && ctx.sleep_vitals.last_night_hours < 6;
    },
    generateTip: (ctx) => ({
      title: 'You Need More Rest',
      content: `${ctx.first_name}, your tracked sleep last night was only ${ctx.sleep_vitals.last_night_hours} hours. Consistently sleeping under 6 hours increases your risk of heart disease, weakens immunity, and impairs cognitive function. Try setting a bedtime alarm and winding down 30 minutes before sleep.`,
      action_text: 'View Sleep Tips',
      action_route: '/app/patient/health-tips',
      icon: 'hi-moon',
      tags: ['sleep', 'insufficient', 'health-risk'],
    }),
    cooldown_days: 2,
    expiration_days: 3,
    max_displays: 5,
    enabled: true,
  },

  {
    id: 'SLEEP_INCONSISTENT',
    name: 'Inconsistent Sleep Pattern',
    description: 'Detects high sleep variance over 7 days indicating irregular patterns',
    category: TipCategory.SLEEP,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => {
      if (ctx.sleep_vitals.average_7d === null) return false;
      // quality_trend declining suggests inconsistency
      return ctx.sleep_vitals.quality_trend === 'declining';
    },
    generateTip: (ctx) => ({
      title: 'Your Sleep Pattern Is Irregular',
      content: `${ctx.first_name}, your sleep data shows a declining pattern over the past week (averaging ${ctx.sleep_vitals.average_7d} hours). Irregular sleep disrupts your circadian rhythm and affects energy, mood, and metabolism. Try going to bed and waking up at the same time every day, even on weekends.`,
      action_text: 'Track Sleep',
      action_route: '/app/patient/health-monitor/vitals',
      icon: 'hi-moon',
      tags: ['sleep', 'consistency', 'circadian'],
    }),
    cooldown_days: 7,
    expiration_days: 14,
    max_displays: 3,
    enabled: true,
  },

  // ========================================
  // ACTIVITY RULES (NEW)
  // ========================================
  {
    id: 'STEPS_LOW_ACTIVITY',
    name: 'Low Daily Steps',
    description: 'Alerts when average daily steps are below 3000',
    category: TipCategory.FITNESS,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => {
      return ctx.activity_vitals.steps_7d_avg !== null && ctx.activity_vitals.steps_7d_avg < 3000;
    },
    generateTip: (ctx) => ({
      title: 'Let\'s Get Moving',
      content: `${ctx.first_name}, your average daily steps over the past week is ${ctx.activity_vitals.steps_7d_avg?.toLocaleString()}. Health guidelines recommend at least 7,000-10,000 steps per day. Try taking short walks after meals, using stairs instead of elevators, or setting hourly movement reminders.`,
      action_text: 'Set Step Goal',
      action_route: '/app/patient/health-monitor',
      icon: 'hi-lightning-bolt',
      tags: ['steps', 'activity', 'fitness'],
    }),
    cooldown_days: 5,
    expiration_days: 7,
    max_displays: 5,
    enabled: true,
  },

  {
    id: 'STEPS_GREAT_ACTIVITY',
    name: 'Great Daily Steps',
    description: 'Positive reinforcement when steps exceed 10,000 per day',
    category: TipCategory.FITNESS,
    priority: TipPriority.LOW,
    condition: (ctx) => {
      return ctx.activity_vitals.steps_7d_avg !== null && ctx.activity_vitals.steps_7d_avg > 10000;
    },
    generateTip: (ctx) => ({
      title: 'Outstanding Activity Level!',
      content: `${ctx.first_name}, you're averaging ${ctx.activity_vitals.steps_7d_avg?.toLocaleString()} steps per day - that's excellent! Staying this active significantly reduces your risk of cardiovascular disease, improves mental health, and helps maintain a healthy weight. Keep up the fantastic work!`,
      icon: 'hi-star',
      tags: ['steps', 'activity', 'positive', 'fitness'],
    }),
    cooldown_days: 7,
    expiration_days: 7,
    max_displays: 3,
    enabled: true,
  },

  // ========================================
  // MENTAL HEALTH RULES (NEW)
  // ========================================
  {
    id: 'STRESS_ELEVATED',
    name: 'Elevated Stress Level from Vitals',
    description: 'Alerts when measured stress level exceeds 7',
    category: TipCategory.MENTAL_HEALTH,
    priority: TipPriority.HIGH,
    condition: (ctx) => {
      return ctx.mental_health_vitals.stress_level !== null &&
        ctx.mental_health_vitals.stress_level.value > 7;
    },
    generateTip: (ctx) => ({
      title: 'Your Stress Levels Are High',
      content: `${ctx.first_name}, your measured stress level is ${ctx.mental_health_vitals.stress_level!.value}/10. Prolonged high stress can lead to elevated blood pressure, weakened immunity, and sleep disruption. Try box breathing (4 seconds in, hold 4, out 4, hold 4), take a short walk, or reach out to a mental health professional.`,
      action_text: 'Talk to a Specialist',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'hi-emoji-sad',
      tags: ['stress', 'mental-health', 'elevated'],
    }),
    cooldown_days: 3,
    expiration_days: 7,
    max_displays: 5,
    enabled: true,
  },

  {
    id: 'MOOD_DECLINING',
    name: 'Declining Mood Pattern',
    description: 'Alerts when mood score shows a declining trend over 3+ days',
    category: TipCategory.MENTAL_HEALTH,
    priority: TipPriority.HIGH,
    condition: (ctx) => {
      return ctx.mental_health_vitals.mood_trend === 'declining';
    },
    generateTip: (ctx) => {
      const moodValue = ctx.mental_health_vitals.mood_score?.value;
      const moodText = moodValue !== undefined ? ` (currently ${moodValue}/10)` : '';
      return {
        title: 'Your Mood Has Been Dipping',
        content: `${ctx.first_name}, your mood scores have been trending downward recently${moodText}. This is worth paying attention to. Consider journaling your feelings, maintaining social connections, getting regular exercise, and ensuring adequate sleep. If low mood persists, talking to a mental health professional can make a real difference.`,
        action_text: 'Book Consultation',
        action_route: '/app/patient/appointmentsv2/book',
        icon: 'hi-emoji-sad',
        tags: ['mood', 'mental-health', 'declining'],
      };
    },
    cooldown_days: 5,
    expiration_days: 7,
    max_displays: 3,
    enabled: true,
  },

  {
    id: 'ANXIETY_HIGH',
    name: 'High Anxiety Level',
    description: 'Alerts when measured anxiety level exceeds 7',
    category: TipCategory.MENTAL_HEALTH,
    priority: TipPriority.HIGH,
    condition: (ctx) => {
      return ctx.mental_health_vitals.anxiety_level !== null &&
        ctx.mental_health_vitals.anxiety_level.value > 7;
    },
    generateTip: (ctx) => ({
      title: 'Anxiety Level Needs Attention',
      content: `${ctx.first_name}, your anxiety level is at ${ctx.mental_health_vitals.anxiety_level!.value}/10. High anxiety can affect your sleep, digestion, and overall well-being. Grounding techniques like the 5-4-3-2-1 method (name 5 things you see, 4 you touch, etc.) can help in the moment. Consider speaking with a therapist for longer-term strategies.`,
      action_text: 'Talk to a Specialist',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'hi-emoji-sad',
      tags: ['anxiety', 'mental-health', 'elevated'],
    }),
    cooldown_days: 3,
    expiration_days: 7,
    max_displays: 5,
    enabled: true,
  },

  // ========================================
  // BODY COMPOSITION RULES (NEW)
  // ========================================
  {
    id: 'HYDRATION_LOW',
    name: 'Low Hydration Level',
    description: 'Alerts when measured hydration percentage is below healthy threshold',
    category: TipCategory.HYDRATION,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => {
      if (!ctx.body_composition.hydration) return false;
      // Normal hydration is typically 45-65% for adults
      return ctx.body_composition.hydration.value < 45;
    },
    generateTip: (ctx) => ({
      title: 'Your Hydration Is Low',
      content: `${ctx.first_name}, your measured hydration level is ${ctx.body_composition.hydration!.value}%, which is below the healthy range (45-65%). Dehydration affects energy, concentration, and kidney function. Aim to drink water consistently throughout the day - not just when thirsty. Set reminders and carry a water bottle with you.`,
      action_text: 'Log Water Intake',
      action_route: '/app/patient/health-monitor/vitals',
      icon: 'hi-beaker',
      tags: ['hydration', 'dehydration', 'body-composition'],
    }),
    cooldown_days: 3,
    expiration_days: 5,
    max_displays: 5,
    enabled: true,
  },

  {
    id: 'BODY_FAT_HIGH',
    name: 'High Body Fat Percentage',
    description: 'Alerts when body fat exceeds healthy range (30% female / 25% male)',
    category: TipCategory.NUTRITION,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => {
      if (!ctx.body_composition.body_fat) return false;
      const threshold = ctx.gender === 'Female' ? 30 : 25;
      return ctx.body_composition.body_fat.value > threshold;
    },
    generateTip: (ctx) => {
      const threshold = ctx.gender === 'Female' ? 30 : 25;
      return {
        title: 'Body Fat Percentage Above Target',
        content: `${ctx.first_name}, your body fat is ${ctx.body_composition.body_fat!.value}%, which is above the recommended ${threshold}% for ${ctx.gender === 'Female' ? 'women' : 'men'}. A combination of regular cardiovascular exercise, strength training, and a balanced diet rich in lean protein and vegetables can help. Consider working with a dietitian for a personalized plan.`,
        action_text: 'Book Dietitian',
        action_route: '/app/patient/appointmentsv2/book',
        icon: 'hi-scale',
        tags: ['body-fat', 'body-composition', 'nutrition'],
      };
    },
    cooldown_days: 14,
    expiration_days: 30,
    max_displays: 3,
    enabled: true,
  },

  // ========================================
  // APPOINTMENT & PRESCRIPTION RULES (NEW)
  // ========================================
  {
    id: 'FOLLOW_UP_DUE',
    name: 'Follow-Up Appointment Needed',
    description: 'Alerts when a recent appointment indicated follow-up but none is booked',
    category: TipCategory.PREVENTIVE_CARE,
    priority: TipPriority.HIGH,
    condition: (ctx) => {
      if (ctx.recent_appointments.length === 0) return false;
      // Check if any recent appointment requires follow-up
      return ctx.recent_appointments.some(
        (appt) =>
          appt.follow_up_required !== null &&
          appt.follow_up_required !== 'No follow-up needed' &&
          appt.status === 'COMPLETED',
      );
    },
    generateTip: (ctx) => {
      const apptWithFollowUp = ctx.recent_appointments.find(
        (appt) =>
          appt.follow_up_required !== null &&
          appt.follow_up_required !== 'No follow-up needed' &&
          appt.status === 'COMPLETED',
      );
      const diagnosis = apptWithFollowUp?.primary_diagnosis
        ? ` regarding ${apptWithFollowUp.primary_diagnosis}`
        : '';
      return {
        title: 'Follow-Up Appointment Recommended',
        content: `${ctx.first_name}, a recent consultation${diagnosis} indicated that a follow-up is needed (${apptWithFollowUp?.follow_up_required}). Scheduling your follow-up ensures continuity of care and helps your provider track your progress.`,
        action_text: 'Book Follow-Up',
        action_route: '/app/patient/appointmentsv2/book',
        icon: 'hi-calendar',
        tags: ['follow-up', 'appointment', 'continuity'],
      };
    },
    cooldown_days: 7,
    expiration_days: 14,
    max_displays: 3,
    enabled: true,
  },

  {
    id: 'PRESCRIPTION_ADHERENCE',
    name: 'Prescription Adherence Check',
    description: 'Reminds patients with active prescriptions about adherence',
    category: TipCategory.MEDICATION,
    priority: TipPriority.MEDIUM,
    condition: (ctx) => {
      return ctx.active_prescriptions.length > 0;
    },
    generateTip: (ctx) => {
      const drugNames = ctx.active_prescriptions
        .slice(0, 3)
        .map((p) => p.drug_name)
        .join(', ');
      const moreText =
        ctx.active_prescriptions.length > 3
          ? ` and ${ctx.active_prescriptions.length - 3} more`
          : '';
      return {
        title: 'Stay on Track with Your Medications',
        content: `${ctx.first_name}, you have active prescriptions for ${drugNames}${moreText}. Taking medications as prescribed is essential for effective treatment. Set daily reminders, use a pill organizer, and don't skip doses even if you feel better. If you experience side effects, consult your doctor before stopping.`,
        action_text: 'View Prescriptions',
        action_route: '/app/patient/prescriptions',
        icon: 'hi-collection',
        tags: ['medication', 'adherence', 'prescription'],
      };
    },
    cooldown_days: 14,
    expiration_days: 30,
    max_displays: 3,
    enabled: true,
  },

  // ========================================
  // RECOVERY RULES (NEW)
  // ========================================
  {
    id: 'RECOVERY_CRAVING_SPIKE',
    name: 'Recovery Craving Spike Alert',
    description: 'Alerts when craving levels have spiked significantly in recovery',
    category: TipCategory.MENTAL_HEALTH,
    priority: TipPriority.URGENT,
    condition: (ctx) => {
      if (!ctx.recovery_context.is_enrolled) return false;
      return ctx.recovery_context.recent_craving_avg !== null &&
        ctx.recovery_context.recent_craving_avg >= 7;
    },
    generateTip: (ctx) => ({
      title: 'Craving Support Available',
      content: `${ctx.first_name}, your recent craving levels have been elevated (averaging ${ctx.recovery_context.recent_craving_avg}/10). This is a normal part of recovery, and reaching out for support is a sign of strength. Use your coping strategies, contact your support network, or speak with your counselor. You've come so far${ctx.recovery_context.sobriety_days ? ` - ${ctx.recovery_context.sobriety_days} days of sobriety is an achievement` : ''}.`,
      action_text: 'Talk to Counselor',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'hi-shield-check',
      tags: ['recovery', 'craving', 'support', 'urgent'],
    }),
    cooldown_days: 2,
    expiration_days: 3,
    max_displays: 5,
    enabled: true,
  },

  {
    id: 'RECOVERY_MOOD_LOW',
    name: 'Recovery Low Mood Pattern',
    description: 'Alerts when mood is consistently below 4 in recovery context',
    category: TipCategory.MENTAL_HEALTH,
    priority: TipPriority.HIGH,
    condition: (ctx) => {
      if (!ctx.recovery_context.is_enrolled) return false;
      return ctx.recovery_context.recent_mood_avg !== null &&
        ctx.recovery_context.recent_mood_avg < 4;
    },
    generateTip: (ctx) => ({
      title: 'Your Mood Needs Attention',
      content: `${ctx.first_name}, your mood has been consistently low recently (averaging ${ctx.recovery_context.recent_mood_avg}/10). Low mood during recovery can increase vulnerability to relapse. Please reach out to your care team, attend a support session, or use the companion chat. Small steps like a short walk, connecting with a friend, or journaling can also help lift your spirits.`,
      action_text: 'Talk to Care Team',
      action_route: '/app/patient/appointmentsv2/book',
      icon: 'hi-emoji-sad',
      tags: ['recovery', 'mood', 'mental-health', 'support'],
    }),
    cooldown_days: 3,
    expiration_days: 5,
    max_displays: 5,
    enabled: true,
  },

  // ========================================
  // WEARABLE RULES (NEW)
  // ========================================
  {
    id: 'WEARABLE_SYNC_STALE',
    name: 'Wearable Sync Stale',
    description: 'Alerts when a connected wearable has not synced in 48 hours',
    category: TipCategory.VITALS,
    priority: TipPriority.LOW,
    condition: (ctx) => {
      if (!ctx.wearable_connected) return false;
      // If wearable is connected but no vitals logged in 2+ days
      return ctx.days_since_last_vitals !== null && ctx.days_since_last_vitals >= 2;
    },
    generateTip: (ctx) => {
      const providers = ctx.wearable_providers.join(', ');
      return {
        title: 'Sync Your Wearable',
        content: `${ctx.first_name}, your connected device (${providers}) hasn't synced data in ${ctx.days_since_last_vitals} days. Regular syncing ensures your health data is up-to-date and helps us provide better insights. Open the health integrations settings to check your connection.`,
        action_text: 'Check Connection',
        action_route: '/app/patient/health-monitor/integrations',
        icon: 'hi-refresh',
        tags: ['wearable', 'sync', 'device', 'reminder'],
      };
    },
    cooldown_days: 3,
    expiration_days: 7,
    max_displays: 3,
    enabled: true,
  },
];
