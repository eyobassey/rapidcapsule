import { HealthDataContext } from '../services/data.service';

export function buildAIInsightPrompt(ctx: HealthDataContext): string {
  const profileSummary = buildProfileSummary(ctx);
  const vitalsSummary = buildVitalsSummary(ctx);
  const activitySummary = buildActivitySummary(ctx);
  const sleepSummary = buildSleepSummary(ctx);
  const mentalHealthSummary = buildMentalHealthSummary(ctx);
  const conditionsSummary = buildConditionsSummary(ctx);
  const lifestyleSummary = buildLifestyleSummary(ctx);
  const prescriptionsSummary = buildPrescriptionsSummary(ctx);
  const appointmentsSummary = buildAppointmentsSummary(ctx);
  const checkupsSummary = buildCheckupsSummary(ctx);
  const recoverySummary = buildRecoverySummary(ctx);
  const wearableSummary = buildWearableSummary(ctx);

  return `You are a compassionate health advisor for ${ctx.first_name}, a patient on the Rapid Capsule telemedicine platform. Generate personalized, actionable health insights based on their comprehensive health profile.

## Patient Profile
${profileSummary}

## Recent Vitals
${vitalsSummary}

## Activity Summary
${activitySummary}

## Sleep Summary
${sleepSummary}

## Mental Health Summary
${mentalHealthSummary}

## Medical Background
${conditionsSummary}

## Lifestyle Factors
${lifestyleSummary}

## Active Prescriptions
${prescriptionsSummary}

## Recent Appointments & Diagnoses
${appointmentsSummary}

## Recent Health Checkups
${checkupsSummary}

## Recovery Context
${recoverySummary}

## Wearable & Device Status
${wearableSummary}

## Your Task
Generate 3-5 personalized health insights for ${ctx.first_name}. Each insight should be:
1. Specifically relevant to their profile (reference specific data points)
2. Actionable with clear, achievable steps
3. Encouraging and positive in tone
4. Medically sound but not diagnostic

## Output Format
Respond with a JSON object containing an array of insights:
{
  "insights": [
    {
      "title": "Brief, engaging title (max 60 chars)",
      "content": "Detailed insight (150-250 words) addressing ${ctx.first_name} directly, referencing specific aspects of their health data, and providing actionable advice",
      "category": "vitals|lifestyle|nutrition|fitness|mental_health|preventive_care|chronic_condition|medication|sleep|hydration",
      "priority": "high|medium|low",
      "action_text": "Optional CTA button text",
      "action_route": "Optional route like /app/patient/appointmentsv2/book",
      "tags": ["relevant", "tags"]
    }
  ],
  "summary": "A brief 2-sentence overall health encouragement for ${ctx.first_name}"
}

## Important Guidelines
- Always address ${ctx.first_name} by name
- Focus on areas where they can make improvements
- Celebrate positive aspects of their health
- Avoid diagnostic language - use phrases like "consider discussing with your doctor"
- Be culturally sensitive and avoid assumptions
- Include at least one encouraging/positive insight
- Reference specific numbers from their data when relevant
- Do NOT include phone numbers or region-specific medical contacts
- If recovery context is present, be sensitive and supportive about their journey
- When prescriptions are active, mention the importance of adherence without being preachy

IMPORTANT: Respond ONLY with valid JSON, no markdown formatting.`;
}

function buildProfileSummary(ctx: HealthDataContext): string {
  const parts = [`Name: ${ctx.first_name}`];
  if (ctx.age) parts.push(`Age: ${ctx.age} years`);
  if (ctx.gender) parts.push(`Gender: ${ctx.gender}`);
  if (ctx.bmi) parts.push(`BMI: ${ctx.bmi.toFixed(1)}`);
  if (ctx.blood_type) parts.push(`Blood Type: ${ctx.blood_type}`);
  if (ctx.genotype) parts.push(`Genotype: ${ctx.genotype}`);
  if (ctx.basic_health_score) parts.push(`Basic Health Score: ${ctx.basic_health_score}/100`);
  return parts.join('\n');
}

function buildVitalsSummary(ctx: HealthDataContext): string {
  const parts: string[] = [];
  if (ctx.vitals.blood_pressure) {
    const bp = ctx.vitals.blood_pressure;
    parts.push(`- Blood Pressure: ${bp.systolic}/${bp.diastolic} mmHg (recorded ${formatDate(bp.updated_at)})`);
  }
  if (ctx.vitals.blood_sugar) {
    parts.push(
      `- Blood Sugar: ${ctx.vitals.blood_sugar.value} ${ctx.vitals.blood_sugar.unit} (recorded ${formatDate(ctx.vitals.blood_sugar.updated_at)})`,
    );
  }
  if (ctx.vitals.pulse_rate) {
    parts.push(`- Pulse Rate: ${ctx.vitals.pulse_rate.value} bpm (recorded ${formatDate(ctx.vitals.pulse_rate.updated_at)})`);
  }
  if (ctx.vitals.temperature) {
    parts.push(
      `- Temperature: ${ctx.vitals.temperature.value}${ctx.vitals.temperature.unit} (recorded ${formatDate(ctx.vitals.temperature.updated_at)})`,
    );
  }
  if (ctx.vitals.weight) {
    parts.push(`- Weight: ${ctx.vitals.weight.value} ${ctx.vitals.weight.unit}`);
  }
  if (ctx.body_composition.body_fat) {
    parts.push(`- Body Fat: ${ctx.body_composition.body_fat.value}${ctx.body_composition.body_fat.unit}`);
  }
  if (ctx.body_composition.muscle_mass) {
    parts.push(`- Muscle Mass: ${ctx.body_composition.muscle_mass.value} ${ctx.body_composition.muscle_mass.unit}`);
  }
  if (ctx.body_composition.hydration) {
    parts.push(`- Hydration: ${ctx.body_composition.hydration.value}${ctx.body_composition.hydration.unit}`);
  }
  if (ctx.body_composition.visceral_fat) {
    parts.push(`- Visceral Fat: ${ctx.body_composition.visceral_fat.value} ${ctx.body_composition.visceral_fat.unit}`);
  }
  if (ctx.days_since_last_vitals !== null) {
    parts.push(`- Days since last vitals logged: ${ctx.days_since_last_vitals}`);
  }
  return parts.length > 0 ? parts.join('\n') : 'No recent vitals recorded';
}

function buildActivitySummary(ctx: HealthDataContext): string {
  const av = ctx.activity_vitals;
  const parts: string[] = [];

  if (av.steps_today !== null) {
    parts.push(`- Steps Today: ${av.steps_today.toLocaleString()}`);
  }
  if (av.steps_7d_avg !== null) {
    parts.push(`- Steps (7-day average): ${av.steps_7d_avg.toLocaleString()}`);
  }
  if (av.calories_burned !== null) {
    parts.push(`- Calories Burned (latest): ${av.calories_burned.toLocaleString()} kcal`);
  }
  if (av.active_minutes !== null) {
    parts.push(`- Active Minutes (latest): ${av.active_minutes} min`);
  }
  if (av.distance) {
    parts.push(`- Distance (latest): ${av.distance.value} ${av.distance.unit}`);
  }

  return parts.length > 0 ? parts.join('\n') : 'No activity data available';
}

function buildSleepSummary(ctx: HealthDataContext): string {
  const sv = ctx.sleep_vitals;
  const parts: string[] = [];

  if (sv.last_night_hours !== null) {
    parts.push(`- Last Night: ${sv.last_night_hours} hours`);
  }
  if (sv.average_7d !== null) {
    parts.push(`- 7-Day Average: ${sv.average_7d} hours`);
  }
  if (sv.quality_trend) {
    parts.push(`- Sleep Trend: ${sv.quality_trend}`);
  }

  // Also include profile-reported sleep if available
  if (ctx.sleep_hours !== null && sv.last_night_hours === null) {
    parts.push(`- Self-Reported Average: ${ctx.sleep_hours} hours/night`);
  }

  return parts.length > 0 ? parts.join('\n') : 'No sleep data available';
}

function buildMentalHealthSummary(ctx: HealthDataContext): string {
  const mh = ctx.mental_health_vitals;
  const parts: string[] = [];

  if (mh.stress_level) {
    parts.push(`- Stress Level: ${mh.stress_level.value}/10 (recorded ${formatDate(mh.stress_level.updated_at)})`);
  }
  if (mh.mood_score) {
    parts.push(`- Mood Score: ${mh.mood_score.value}/10 (recorded ${formatDate(mh.mood_score.updated_at)})`);
  }
  if (mh.anxiety_level) {
    parts.push(`- Anxiety Level: ${mh.anxiety_level.value}/10 (recorded ${formatDate(mh.anxiety_level.updated_at)})`);
  }
  if (mh.motivation_level) {
    parts.push(`- Motivation Level: ${mh.motivation_level.value}/10 (recorded ${formatDate(mh.motivation_level.updated_at)})`);
  }
  if (mh.mood_trend) {
    parts.push(`- Mood Trend: ${mh.mood_trend}`);
  }

  // Include profile-reported stress if no vital data
  if (ctx.stress_level && !mh.stress_level) {
    parts.push(`- Self-Reported Stress: ${ctx.stress_level}`);
  }

  // Include Eka insights if available
  if (ctx.eka_insights.recent_health_concerns.length > 0) {
    parts.push(`- AI Companion Noted Concerns: ${ctx.eka_insights.recent_health_concerns.slice(0, 5).join('; ')}`);
  }

  return parts.length > 0 ? parts.join('\n') : 'No mental health data available';
}

function buildConditionsSummary(ctx: HealthDataContext): string {
  const parts: string[] = [];
  if (ctx.chronic_conditions.length > 0) {
    parts.push(`Chronic Conditions: ${ctx.chronic_conditions.join(', ')}`);
  }
  if (ctx.current_medications.length > 0) {
    parts.push(`Current Medications: ${ctx.current_medications.map((m) => m.name).join(', ')}`);
  }
  const allAllergies = [...ctx.allergies.drug, ...ctx.allergies.food, ...ctx.allergies.environmental];
  if (allAllergies.length > 0) {
    parts.push(`Known Allergies: ${allAllergies.join(', ')}`);
  }
  if (ctx.family_history.length > 0) {
    parts.push(`Family History: ${ctx.family_history.map((h) => `${h.condition} (${h.relation})`).join(', ')}`);
  }
  return parts.length > 0 ? parts.join('\n') : 'No significant medical history recorded';
}

function buildLifestyleSummary(ctx: HealthDataContext): string {
  const parts: string[] = [];
  if (ctx.is_smoker !== null) parts.push(`Smoking: ${ctx.is_smoker ? 'Yes' : 'No'}`);
  if (ctx.alcohol_consumption) parts.push(`Alcohol: ${ctx.alcohol_consumption}`);
  if (ctx.exercise_frequency) parts.push(`Exercise: ${ctx.exercise_frequency}`);
  if (ctx.sleep_hours) parts.push(`Sleep: ${ctx.sleep_hours} hours/night`);
  if (ctx.stress_level) parts.push(`Stress Level: ${ctx.stress_level}`);
  if (ctx.diet_type) parts.push(`Diet: ${ctx.diet_type}`);
  return parts.length > 0 ? parts.join('\n') : 'Lifestyle data not available';
}

function buildPrescriptionsSummary(ctx: HealthDataContext): string {
  if (ctx.active_prescriptions.length === 0) {
    return 'No active prescriptions in the last 30 days';
  }

  return ctx.active_prescriptions
    .slice(0, 10)
    .map((rx) => {
      const parts = [`- ${rx.drug_name}`];
      if (rx.dose) parts.push(`Dose: ${rx.dose}`);
      if (rx.interval) parts.push(`Every ${rx.interval}`);
      if (rx.period) parts.push(`For ${rx.period}`);
      parts.push(`(Prescribed ${formatDate(rx.prescribed_at)})`);
      return parts.join(', ');
    })
    .join('\n');
}

function buildAppointmentsSummary(ctx: HealthDataContext): string {
  if (ctx.recent_appointments.length === 0) {
    return 'No recent appointments in the last 90 days';
  }

  return ctx.recent_appointments
    .slice(0, 5)
    .map((appt) => {
      const parts = [`- ${formatDate(appt.date)}: ${appt.category} (${appt.status})`];
      if (appt.primary_diagnosis) {
        parts.push(`  Diagnosis: ${appt.primary_diagnosis}`);
      }
      if (appt.follow_up_required && appt.follow_up_required !== 'No follow-up needed') {
        parts.push(`  Follow-up: ${appt.follow_up_required}`);
      }
      if (appt.treatment_plan_summary) {
        parts.push(`  Instructions: ${appt.treatment_plan_summary.substring(0, 150)}`);
      }
      return parts.join('\n');
    })
    .join('\n');
}

function buildCheckupsSummary(ctx: HealthDataContext): string {
  if (!ctx.recent_checkups || ctx.recent_checkups.length === 0) {
    return 'No recent health checkups on record';
  }
  return ctx.recent_checkups
    .slice(0, 3)
    .map((c) => {
      const conditions = c.top_conditions.map((tc) => `${tc.name} (${tc.probability}%)`).join(', ');
      return `- ${formatDate(c.date)}: Triage: ${c.triage_level}${c.has_emergency ? ' [EMERGENCY]' : ''}, Conditions: ${conditions || 'None identified'}`;
    })
    .join('\n');
}

function buildRecoverySummary(ctx: HealthDataContext): string {
  const rc = ctx.recovery_context;

  if (!rc.is_enrolled) {
    return 'Not enrolled in recovery programme';
  }

  const parts: string[] = ['Enrolled in Recovery Programme'];
  if (rc.sobriety_days !== null) {
    parts.push(`- Sobriety Days: ${rc.sobriety_days}`);
  }
  if (rc.risk_level) {
    parts.push(`- Current Risk Level: ${rc.risk_level}`);
  }
  if (rc.recent_mood_avg !== null) {
    parts.push(`- Recent Mood Average (7-day): ${rc.recent_mood_avg}/10`);
  }
  if (rc.recent_craving_avg !== null) {
    parts.push(`- Recent Craving Average (7-day): ${rc.recent_craving_avg}/10`);
  }
  parts.push(`- Checked In Today: ${rc.today_checked_in ? 'Yes' : 'No'}`);

  return parts.join('\n');
}

function buildWearableSummary(ctx: HealthDataContext): string {
  if (!ctx.wearable_connected) {
    return 'No wearable devices connected';
  }

  const parts = [`Connected Providers: ${ctx.wearable_providers.join(', ')}`];
  if (ctx.days_since_last_vitals !== null) {
    parts.push(`Last Data Sync: ${ctx.days_since_last_vitals === 0 ? 'Today' : `${ctx.days_since_last_vitals} day(s) ago`}`);
  }

  return parts.join('\n');
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
