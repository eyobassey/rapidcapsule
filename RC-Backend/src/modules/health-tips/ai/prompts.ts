import { HealthDataContext } from '../services/data.service';

export function buildAIInsightPrompt(ctx: HealthDataContext): string {
  const profileSummary = buildProfileSummary(ctx);
  const vitalsSummary = buildVitalsSummary(ctx);
  const conditionsSummary = buildConditionsSummary(ctx);
  const lifestyleSummary = buildLifestyleSummary(ctx);
  const checkupsSummary = buildCheckupsSummary(ctx);

  return `You are a compassionate health advisor for ${ctx.first_name}, a patient on the Rapid Capsule telemedicine platform. Generate personalized, actionable health insights based on their comprehensive health profile.

## Patient Profile
${profileSummary}

## Recent Vitals
${vitalsSummary}

## Medical Background
${conditionsSummary}

## Lifestyle Factors
${lifestyleSummary}

## Recent Health Checkups
${checkupsSummary}

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
  if (ctx.days_since_last_vitals !== null) {
    parts.push(`- Days since last vitals logged: ${ctx.days_since_last_vitals}`);
  }
  return parts.length > 0 ? parts.join('\n') : 'No recent vitals recorded';
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

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
