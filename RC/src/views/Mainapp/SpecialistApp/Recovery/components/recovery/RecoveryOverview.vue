<template>
  <div class="recovery-overview">
    <!-- Profile Summary Row -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-card__icon summary-card__icon--sky">
          <v-icon name="hi-calendar" scale="1" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__value">{{ data?.profile_summary?.sobriety_days || 0 }}</span>
          <span class="summary-card__label">Sobriety Days</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-card__icon summary-card__icon--emerald">
          <v-icon name="hi-trending-up" scale="1" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__value">{{ data?.profile_summary?.longest_streak || 0 }}</span>
          <span class="summary-card__label">Longest Streak</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-card__icon summary-card__icon--amber">
          <v-icon name="hi-exclamation" scale="1" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__value">{{ data?.profile_summary?.total_relapses || 0 }}</span>
          <span class="summary-card__label">Total Relapses</span>
        </div>
      </div>
      <div class="summary-card">
        <div :class="['summary-card__icon', `summary-card__icon--${riskColor}`]">
          <v-icon name="hi-shield-exclamation" scale="1" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__value">{{ data?.risk?.score ?? 0 }}/100</span>
          <span class="summary-card__label">Risk Score ({{ capitalise(data?.risk?.level || 'low') }})</span>
        </div>
      </div>
    </div>

    <!-- Profile Details Row -->
    <div class="details-row">
      <div class="detail-chip" v-if="data?.profile_summary?.primary_substance">
        <v-icon name="hi-beaker" scale="0.7" />
        <span>{{ data.profile_summary.primary_substance }}</span>
      </div>
      <div class="detail-chip" v-if="data?.profile_summary?.care_level">
        <v-icon name="hi-clipboard-check" scale="0.7" />
        <span>{{ formatCareLevel(data.profile_summary.care_level) }}</span>
      </div>
      <div class="detail-chip" v-if="data?.profile_summary?.status">
        <v-icon name="hi-status-online" scale="0.7" />
        <span>{{ capitalise(data.profile_summary.status) }}</span>
      </div>
    </div>

    <!-- Risk Gauge -->
    <div class="section-block">
      <h4 class="section-title">
        <v-icon name="hi-shield-exclamation" scale="0.8" />
        Current Risk Level
      </h4>
      <div class="risk-gauge-container">
        <svg viewBox="0 0 200 120" class="risk-gauge">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#E2E8F0" stroke-width="12" stroke-linecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" :stroke="riskGaugeColor" stroke-width="12" stroke-linecap="round" :stroke-dasharray="gaugeArc" :stroke-dashoffset="0" />
          <text x="100" y="85" text-anchor="middle" :fill="riskGaugeColor" font-size="28" font-weight="700">{{ data?.risk?.score ?? 0 }}</text>
          <text x="100" y="102" text-anchor="middle" fill="#64748B" font-size="11">/100</text>
        </svg>
        <div :class="['risk-level-badge', `risk-level-badge--${data?.risk?.level || 'low'}`]">
          {{ capitalise(data?.risk?.level || 'low') }}
        </div>
      </div>
    </div>

    <!-- 30-Day Mood Trend -->
    <div v-if="data?.mood_trend_30d?.length" class="section-block">
      <h4 class="section-title">
        <v-icon name="hi-trending-up" scale="0.8" />
        30-Day Mood &amp; Craving Trend
      </h4>
      <div class="chart-container">
        <canvas ref="moodChartRef" />
      </div>
    </div>

    <!-- Quick Stats Row -->
    <div class="section-block">
      <h4 class="section-title">
        <v-icon name="hi-chart-bar" scale="0.8" />
        Recovery Activity
      </h4>
      <div class="quick-stats">
        <div class="quick-stat">
          <span class="quick-stat__value">{{ data?.counts?.screenings || 0 }}</span>
          <span class="quick-stat__label">Screenings</span>
        </div>
        <div class="quick-stat">
          <span class="quick-stat__value">{{ data?.counts?.exercises || 0 }}</span>
          <span class="quick-stat__label">Exercises</span>
        </div>
        <div class="quick-stat">
          <span class="quick-stat__value">{{ data?.counts?.risk_assessments || 0 }}</span>
          <span class="quick-stat__label">Risk Reports</span>
        </div>
        <div class="quick-stat">
          <span class="quick-stat__value">{{ data?.counts?.milestones || 0 }}</span>
          <span class="quick-stat__label">Milestones</span>
        </div>
      </div>
    </div>

    <!-- Recovery Plan -->
    <div class="section-block">
      <h4 class="section-title">
        <v-icon name="hi-clipboard-list" scale="0.8" />
        Recovery Plan
        <button v-if="!showPlanBuilder && !data?.recovery_plan" class="create-plan-btn" @click="showPlanBuilder = true">
          <v-icon name="hi-plus" scale="0.7" />
          Create Plan
        </button>
        <button v-if="!showPlanBuilder && data?.recovery_plan" class="create-plan-btn create-plan-btn--outline" @click="showPlanBuilder = true">
          <v-icon name="hi-pencil" scale="0.7" />
          Revise Plan
        </button>
      </h4>

      <!-- Existing Plan Display -->
      <div v-if="data?.recovery_plan && !showPlanBuilder" class="plan-display">
        <div class="plan-display__header">
          <div>
            <h5 class="plan-display__name">{{ data.recovery_plan.plan_name }}</h5>
            <span :class="['plan-status-badge', `plan-status-badge--${data.recovery_plan.status}`]">
              {{ data.recovery_plan.status }}
            </span>
          </div>
          <span v-if="data.recovery_plan.next_review_date" class="plan-display__review">
            Review: {{ formatDate(data.recovery_plan.next_review_date) }}
          </span>
        </div>

        <!-- Progress Indicator -->
        <div v-if="data.recovery_plan.stages?.length" class="plan-progress">
          <div class="plan-progress__bar">
            <div class="plan-progress__fill" :style="{ width: planGoalProgress.pct + '%' }" />
          </div>
          <div class="plan-progress__stats">
            <span class="plan-progress__pct">{{ planGoalProgress.pct }}%</span>
            <span class="plan-progress__detail">
              {{ planGoalProgress.done }}/{{ planGoalProgress.total }} goals · {{ planStageProgress.done }}/{{ planStageProgress.total }} stages
            </span>
          </div>
        </div>

        <!-- Stages with Goals & Interventions -->
        <div v-if="data.recovery_plan.stages?.length" class="plan-stages-summary">
          <div
            v-for="(stage, si) in data.recovery_plan.stages"
            :key="si"
            :class="['plan-stage-item', { 'plan-stage-item--active': stage.status === 'in_progress', 'plan-stage-item--done': stage.status === 'completed', 'plan-stage-item--expanded': expandedPlanStage === si }]"
          >
            <div class="plan-stage-item__header" @click="expandedPlanStage = expandedPlanStage === si ? null : si">
              <div class="plan-stage-item__num">
                <template v-if="stage.status === 'completed'">
                  <v-icon name="hi-check" scale="0.6" />
                </template>
                <template v-else>{{ si + 1 }}</template>
              </div>
              <div class="plan-stage-item__info">
                <span class="plan-stage-item__name">{{ formatStageName(stage.name) }}</span>
                <span class="plan-stage-item__meta">
                  {{ stage.goals?.length || 0 }} goals
                  <template v-if="stage.estimated_duration_weeks"> · {{ stage.estimated_duration_weeks }}w</template>
                </span>
              </div>
              <span :class="['plan-stage-status', `plan-stage-status--${stage.status || 'pending'}`]">
                {{ { pending: 'Upcoming', in_progress: 'Active', completed: 'Done', skipped: 'Skipped' }[stage.status || 'pending'] }}
              </span>
              <v-icon :name="expandedPlanStage === si ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.7" class="plan-stage-item__chevron" />
            </div>

            <!-- Expanded: Goals -->
            <div v-if="expandedPlanStage === si" class="plan-stage-detail">
              <div v-if="stage.goals?.length" class="plan-stage-detail__section">
                <span class="plan-stage-detail__label">Goals</span>
                <div v-for="(goal, gi) in stage.goals" :key="gi" class="plan-goal-row">
                  <div :class="['plan-goal-row__dot', { 'plan-goal-row__dot--done': goal.status === 'completed' }]">
                    <v-icon v-if="goal.status === 'completed'" name="hi-check" scale="0.45" />
                  </div>
                  <div class="plan-goal-row__content">
                    <span class="plan-goal-row__desc">{{ goal.description }}</span>
                    <span v-if="goal.measurable_target" class="plan-goal-row__target">
                      <v-icon name="hi-chart-bar" scale="0.5" /> {{ goal.measurable_target }}
                    </span>
                    <span v-if="goal.target_date" class="plan-goal-row__date">
                      Due {{ formatDate(goal.target_date) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Expanded: Interventions -->
              <div v-if="stage.interventions?.length" class="plan-stage-detail__section">
                <span class="plan-stage-detail__label">Interventions</span>
                <div v-for="(intv, ii) in stage.interventions" :key="ii" class="plan-intv-row">
                  <span class="plan-intv-row__type">{{ formatStageName(intv.type) }}</span>
                  <span class="plan-intv-row__desc">{{ intv.description }}</span>
                  <span v-if="intv.frequency" class="plan-intv-row__freq">{{ intv.frequency }}</span>
                </div>
              </div>

              <p v-if="!stage.goals?.length && !stage.interventions?.length" class="plan-stage-detail__empty">
                No goals or interventions defined for this stage.
              </p>
            </div>
          </div>
        </div>

        <!-- Relapse Prevention Summary -->
        <div v-if="hasPlanRelapsePrevention" class="plan-relapse-summary">
          <div v-if="data.recovery_plan.relapse_prevention?.personal_triggers?.length" class="plan-detail">
            <span class="plan-detail__label">Triggers</span>
            <div class="plan-tags">
              <span v-for="(t, i) in data.recovery_plan.relapse_prevention.personal_triggers.slice(0, 5)" :key="i" class="plan-tag plan-tag--rose">{{ t }}</span>
            </div>
          </div>
          <div v-if="data.recovery_plan.relapse_prevention?.coping_strategies?.length" class="plan-detail">
            <span class="plan-detail__label">Coping Strategies</span>
            <div class="plan-tags">
              <span v-for="(s, i) in data.recovery_plan.relapse_prevention.coping_strategies.slice(0, 5)" :key="i" class="plan-tag plan-tag--sky">{{ s }}</span>
            </div>
          </div>
        </div>

        <!-- Plan Actions -->
        <div class="plan-display__actions">
          <button
            v-if="data.recovery_plan.status === 'draft'"
            class="action-btn action-btn--primary"
            :disabled="activatingPlan"
            @click="activatePlan"
          >
            <v-icon v-if="!activatingPlan" name="hi-play" scale="0.7" />
            <span v-if="activatingPlan" class="btn-spinner" />
            {{ activatingPlan ? 'Activating...' : 'Activate Plan' }}
          </button>
          <button
            v-if="data.recovery_plan.status === 'draft'"
            class="action-btn action-btn--ghost action-btn--danger-text"
            :disabled="abandoningPlan"
            @click="abandonPlan"
          >
            {{ abandoningPlan ? 'Abandoning...' : 'Discard Draft' }}
          </button>
        </div>
      </div>

      <!-- No Plan + Create Prompt -->
      <div v-if="!data?.recovery_plan && !showPlanBuilder" class="no-plan-prompt">
        <div class="no-plan-prompt__icon">
          <v-icon name="hi-clipboard-list" scale="1.5" />
        </div>
        <p>No recovery plan has been created for this patient yet.</p>
        <div class="no-plan-prompt__actions">
          <button class="action-btn action-btn--ai" :disabled="aiGenerating" @click="generateWithAI">
            <v-icon v-if="!aiGenerating" name="hi-sparkles" scale="0.7" />
            <span v-if="aiGenerating" class="btn-spinner" />
            {{ aiGenerating ? 'Generating...' : 'Generate with AI' }}
          </button>
          <button class="action-btn action-btn--primary" @click="showPlanBuilder = true">
            <v-icon name="hi-plus" scale="0.7" />
            Create Manually
          </button>
        </div>
      </div>

      <!-- Plan Builder Form -->
      <div v-if="showPlanBuilder" class="plan-builder">
        <div class="plan-builder__header">
          <h5>{{ data?.recovery_plan ? 'Revise Recovery Plan' : 'Create Recovery Plan' }}</h5>
          <div class="plan-builder__header-actions">
            <button v-if="!aiGenerating" class="action-btn action-btn--ai action-btn--small" @click="generateWithAI">
              <v-icon name="hi-sparkles" scale="0.6" />
              Generate with AI
            </button>
            <button v-else class="action-btn action-btn--ai action-btn--small" disabled>
              <span class="btn-spinner" />
              Generating...
            </button>
            <button class="action-btn action-btn--ghost" @click="closePlanBuilder">Cancel</button>
          </div>
        </div>

        <div class="plan-builder__form">
          <div class="form-field">
            <label>
              Plan Name <span class="required">*</span>
              <span class="tooltip" title="A descriptive name for this recovery plan that identifies the programme type and duration">
                <v-icon name="hi-information-circle" scale="0.65" />
              </span>
            </label>
            <input v-model="planForm.plan_name" type="text" placeholder="e.g. 12-Week Alcohol Detox &amp; Stabilisation Programme" />
          </div>

          <div class="form-field">
            <label>
              Next Review Date
              <span class="tooltip" title="When this plan should be formally reviewed with the patient. Typically 2-4 weeks for early stages, 4-8 weeks for maintenance">
                <v-icon name="hi-information-circle" scale="0.65" />
              </span>
            </label>
            <input v-model="planForm.next_review_date" type="date" />
          </div>

          <!-- Stages -->
          <div class="form-section">
            <div class="form-section__header">
              <label>
                Treatment Stages
                <span class="tooltip" title="Define the sequential phases of recovery. Each stage can have its own goals and interventions. Common flow: Assessment → Detox → Stabilisation → Active Treatment → Maintenance → Aftercare">
                  <v-icon name="hi-information-circle" scale="0.65" />
                </span>
              </label>
              <button class="action-btn action-btn--small" @click="addStage">
                <v-icon name="hi-plus" scale="0.6" /> Add Stage
              </button>
            </div>

            <p v-if="!planForm.stages.length" class="form-hint">
              Add treatment stages to structure the patient's recovery journey. Each stage contains specific goals and therapeutic interventions.
            </p>

            <div v-for="(stage, si) in planForm.stages" :key="si" class="stage-card">
              <div class="stage-card__top">
                <select v-model="stage.name" title="Select the treatment phase for this stage">
                  <option value="" disabled>Select treatment phase...</option>
                  <option v-for="sn in stageNames" :key="sn" :value="sn">{{ formatStageName(sn) }}</option>
                </select>
                <input
                  v-model.number="stage.estimated_duration_weeks"
                  type="number"
                  min="1"
                  placeholder="Duration (weeks)"
                  class="stage-card__weeks"
                  title="Estimated number of weeks for this stage"
                />
                <button class="action-btn action-btn--danger-icon" title="Remove this stage" @click="planForm.stages.splice(si, 1)">
                  <v-icon name="hi-x" scale="0.7" />
                </button>
              </div>

              <!-- Goals -->
              <div class="stage-card__section">
                <span class="stage-card__section-label">
                  Goals
                  <span class="tooltip" title="Specific, measurable objectives for this stage. Each goal should have a clear target and timeline">
                    <v-icon name="hi-information-circle" scale="0.55" />
                  </span>
                </span>
                <div v-for="(goal, gi) in stage.goals" :key="gi" class="inline-row">
                  <input
                    v-model="goal.description"
                    type="text"
                    :placeholder="goalPlaceholders[si % goalPlaceholders.length]"
                    class="inline-row__main"
                    title="Describe the specific recovery goal"
                  />
                  <input
                    v-model="goal.measurable_target"
                    type="text"
                    :placeholder="targetPlaceholders[gi % targetPlaceholders.length]"
                    class="inline-row__sub"
                    title="How will you measure success? e.g. number of sessions, days sober, score improvement"
                  />
                  <input v-model="goal.target_date" type="date" class="inline-row__date" title="Target completion date for this goal" />
                  <button class="action-btn action-btn--danger-icon" title="Remove goal" @click="stage.goals.splice(gi, 1)">
                    <v-icon name="hi-x" scale="0.6" />
                  </button>
                </div>
                <button class="action-btn action-btn--tiny" @click="addGoal(si)">+ Add Goal</button>
              </div>

              <!-- Interventions -->
              <div class="stage-card__section">
                <span class="stage-card__section-label">
                  Interventions
                  <span class="tooltip" title="Therapeutic activities and treatments prescribed for this stage. Specify the type, details, and how often">
                    <v-icon name="hi-information-circle" scale="0.55" />
                  </span>
                </span>
                <div v-for="(intv, ii) in stage.interventions" :key="ii" class="inline-row">
                  <select v-model="intv.type" class="inline-row__select" title="Select the type of therapeutic intervention">
                    <option value="" disabled>Intervention type...</option>
                    <option v-for="it in interventionTypes" :key="it" :value="it">{{ formatStageName(it) }}</option>
                  </select>
                  <input
                    v-model="intv.description"
                    type="text"
                    :placeholder="interventionPlaceholders[intv.type] || 'Describe the intervention...'"
                    class="inline-row__main"
                    title="Specific details about this intervention"
                  />
                  <input
                    v-model="intv.frequency"
                    type="text"
                    :placeholder="frequencyPlaceholders[ii % frequencyPlaceholders.length]"
                    class="inline-row__sub"
                    title="How often this intervention occurs, e.g. weekly, twice weekly, daily"
                  />
                  <button class="action-btn action-btn--danger-icon" title="Remove intervention" @click="stage.interventions.splice(ii, 1)">
                    <v-icon name="hi-x" scale="0.6" />
                  </button>
                </div>
                <button class="action-btn action-btn--tiny" @click="addIntervention(si)">+ Add Intervention</button>
              </div>
            </div>
          </div>

          <!-- Relapse Prevention -->
          <div class="form-section">
            <label class="form-section__title">
              Relapse Prevention
              <span class="tooltip" title="Identify risk factors and build a safety net. This information helps the patient and care team recognise early warning signs and respond effectively">
                <v-icon name="hi-information-circle" scale="0.65" />
              </span>
            </label>

            <div class="form-field">
              <label class="form-field__sub">
                Personal Triggers
                <span class="tooltip" title="Situations, emotions, people, or environments that increase the patient's urge to use substances">
                  <v-icon name="hi-information-circle" scale="0.55" />
                </span>
              </label>
              <div class="tag-input-wrap">
                <div v-if="planForm.relapse_prevention.personal_triggers.length" class="plan-tags">
                  <span v-for="(t, i) in planForm.relapse_prevention.personal_triggers" :key="i" class="plan-tag plan-tag--rose plan-tag--removable">
                    {{ t }}
                    <button @click="planForm.relapse_prevention.personal_triggers.splice(i, 1)">
                      <v-icon name="hi-x" scale="0.5" />
                    </button>
                  </span>
                </div>
                <input v-model="triggerInput" type="text" placeholder="e.g. Social gatherings with alcohol, work stress, relationship conflict" @keydown.enter.prevent="addTag('personal_triggers', 'triggerInput')" />
              </div>
            </div>

            <div class="form-field">
              <label class="form-field__sub">
                Warning Signs
                <span class="tooltip" title="Behavioural, emotional, or physical changes that indicate the patient may be approaching relapse">
                  <v-icon name="hi-information-circle" scale="0.55" />
                </span>
              </label>
              <div class="tag-input-wrap">
                <div v-if="planForm.relapse_prevention.warning_signs.length" class="plan-tags">
                  <span v-for="(w, i) in planForm.relapse_prevention.warning_signs" :key="i" class="plan-tag plan-tag--amber plan-tag--removable">
                    {{ w }}
                    <button @click="planForm.relapse_prevention.warning_signs.splice(i, 1)">
                      <v-icon name="hi-x" scale="0.5" />
                    </button>
                  </span>
                </div>
                <input v-model="warningInput" type="text" placeholder="e.g. Isolating from friends, skipping check-ins, irritability, sleep disruption" @keydown.enter.prevent="addTag('warning_signs', 'warningInput')" />
              </div>
            </div>

            <div class="form-field">
              <label class="form-field__sub">
                Coping Strategies
                <span class="tooltip" title="Healthy alternatives and techniques the patient can use when experiencing cravings or facing triggers">
                  <v-icon name="hi-information-circle" scale="0.55" />
                </span>
              </label>
              <div class="tag-input-wrap">
                <div v-if="planForm.relapse_prevention.coping_strategies.length" class="plan-tags">
                  <span v-for="(c, i) in planForm.relapse_prevention.coping_strategies" :key="i" class="plan-tag plan-tag--emerald plan-tag--removable">
                    {{ c }}
                    <button @click="planForm.relapse_prevention.coping_strategies.splice(i, 1)">
                      <v-icon name="hi-x" scale="0.5" />
                    </button>
                  </span>
                </div>
                <input v-model="copingInput" type="text" placeholder="e.g. Call sponsor, 5-4-3-2-1 grounding exercise, go for a walk, attend AA meeting" @keydown.enter.prevent="addTag('coping_strategies', 'copingInput')" />
              </div>
            </div>

            <div class="form-field">
              <label class="form-field__sub">
                Emergency Plan
                <span class="tooltip" title="Step-by-step instructions for what to do if the patient is in crisis or at immediate risk of relapse or harm">
                  <v-icon name="hi-information-circle" scale="0.55" />
                </span>
              </label>
              <textarea v-model="planForm.relapse_prevention.emergency_plan" rows="4" placeholder="1. Call your sponsor or accountability partner immediately&#10;2. Remove yourself from the triggering environment&#10;3. Contact the crisis helpline: Samaritans 116 123 or FRANK 0300 123 6600&#10;4. If in immediate danger, call 999&#10;5. Attend the nearest AA/NA meeting or contact your care team" />
            </div>
          </div>

          <!-- Submit -->
          <div class="plan-builder__actions">
            <button class="action-btn action-btn--ghost" @click="closePlanBuilder">Cancel</button>
            <button class="action-btn action-btn--primary" :disabled="planSaving || !planForm.plan_name.trim()" @click="submitPlan">
              <v-icon v-if="!planSaving" name="hi-check" scale="0.7" />
              {{ planSaving ? 'Saving...' : 'Create Plan' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Crisis Events -->
    <div v-if="data?.crisis_events?.length" class="section-block">
      <h4 class="section-title">
        <v-icon name="hi-exclamation-circle" scale="0.8" />
        Recent Crisis Events
      </h4>
      <div class="crisis-list">
        <div v-for="(event, i) in data.crisis_events" :key="i" class="crisis-item">
          <div :class="['crisis-dot', `crisis-dot--${event.severity || 'moderate'}`]" />
          <div class="crisis-info">
            <span class="crisis-type">{{ capitalise(event.type || 'Crisis') }}</span>
            <span class="crisis-meta">
              {{ formatDate(event.date) }}
              <span :class="['crisis-severity', `crisis-severity--${event.severity}`]">{{ capitalise(event.severity || 'unknown') }}</span>
              <span v-if="event.resolved" class="crisis-resolved">Resolved</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Check-ins Preview -->
    <div v-if="data?.recent_logs?.length" class="section-block">
      <h4 class="section-title">
        <v-icon name="hi-clipboard-check" scale="0.8" />
        Recent Check-ins (Last 7 Days)
      </h4>
      <div class="checkin-preview">
        <div v-for="(log, i) in data.recent_logs" :key="i" class="checkin-mini">
          <span class="checkin-mini__date">{{ formatDateShort(log.date) }}</span>
          <span :class="['checkin-mini__sober', log.sober_today ? 'checkin-mini__sober--yes' : 'checkin-mini__sober--no']">
            {{ log.sober_today ? 'Sober' : 'Relapse' }}
          </span>
          <div class="checkin-mini__mood">
            <div class="mood-bar">
              <div class="mood-bar__fill" :style="{ width: `${(log.mood_score || 0) * 10}%` }" />
            </div>
            <span class="mood-bar__label">{{ log.mood_score || '-' }}</span>
          </div>
          <span class="checkin-mini__craving" v-if="log.craving_intensity != null">
            Craving: {{ log.craving_intensity }}/10
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import Chart from 'chart.js/auto';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';

const $toast = useToast();

const props = defineProps({
  data: { type: Object, default: null },
  patientId: { type: String, default: '' },
});

const emit = defineEmits(['plan-created']);

const moodChartRef = ref(null);
let chartInstance = null;

// Plan Display
const expandedPlanStage = ref(0);

// Plan Actions
const activatingPlan = ref(false);
const abandoningPlan = ref(false);

// Plan Builder
const showPlanBuilder = ref(false);
const planSaving = ref(false);
const aiGenerating = ref(false);
const triggerInput = ref('');
const warningInput = ref('');
const copingInput = ref('');

const stageNames = ['assessment', 'detox', 'stabilization', 'active_treatment', 'maintenance', 'aftercare'];
const interventionTypes = ['individual_therapy', 'group_therapy', 'medication', 'peer_support', 'family_therapy', 'psychoeducation', 'harm_reduction'];

const goalPlaceholders = [
  'Achieve 30 consecutive days of sobriety',
  'Complete medical detoxification safely',
  'Attend 3 therapy sessions per week',
  'Develop 5 healthy coping strategies',
  'Establish a consistent sleep routine (10pm–6am)',
  'Rebuild one key family relationship',
];

const targetPlaceholders = [
  '30 days sober verified by check-ins',
  'PHQ-9 score below 10',
  'Attend 12/12 scheduled sessions',
  '3 new coping skills demonstrated',
  '90% daily check-in compliance',
  'Complete AUDIT-C with score ≤ 3',
];

const interventionPlaceholders = {
  individual_therapy: 'e.g. Weekly CBT sessions focused on relapse triggers and cognitive distortions',
  group_therapy: 'e.g. 12-step facilitation group, Tuesdays and Thursdays 6–7:30 PM',
  medication: 'e.g. Naltrexone 50mg daily for alcohol craving reduction',
  peer_support: 'e.g. Weekly peer mentor check-in with assigned recovery coach',
  family_therapy: 'e.g. Bi-weekly family systems therapy addressing codependency patterns',
  psychoeducation: 'e.g. Substance use disorder psychoeducation module — understanding the disease model',
  harm_reduction: 'e.g. Naloxone training and supervised safer-use education sessions',
};

const frequencyPlaceholders = [
  'Weekly — every Monday at 10:00 AM',
  'Twice weekly — Tue & Thu',
  'Daily for first 2 weeks, then weekly',
  'Fortnightly review sessions',
  'As needed (PRN) with minimum monthly',
];

let stageCounter = 0;
let goalCounter = 0;

const createEmptyForm = () => ({
  plan_name: '',
  next_review_date: '',
  stages: [],
  relapse_prevention: {
    personal_triggers: [],
    warning_signs: [],
    coping_strategies: [],
    safe_activities: [],
    emergency_plan: '',
    high_risk_situations: [],
  },
});

const planForm = ref(createEmptyForm());

function formatStageName(name) {
  if (!name) return '';
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function addStage() {
  stageCounter++;
  planForm.value.stages.push({
    stage_id: `stage_${stageCounter}_${Date.now()}`,
    name: '',
    order: planForm.value.stages.length + 1,
    estimated_duration_weeks: null,
    goals: [],
    interventions: [],
  });
}

function addGoal(si) {
  goalCounter++;
  planForm.value.stages[si].goals.push({
    goal_id: `goal_${goalCounter}_${Date.now()}`,
    description: '',
    measurable_target: '',
    target_date: '',
  });
}

function addIntervention(si) {
  planForm.value.stages[si].interventions.push({
    type: '',
    description: '',
    frequency: '',
  });
}

function addTag(field, inputRef) {
  const val = inputRef === 'triggerInput' ? triggerInput.value.trim()
    : inputRef === 'warningInput' ? warningInput.value.trim()
    : copingInput.value.trim();
  if (val) {
    planForm.value.relapse_prevention[field].push(val);
    if (inputRef === 'triggerInput') triggerInput.value = '';
    else if (inputRef === 'warningInput') warningInput.value = '';
    else copingInput.value = '';
  }
}

function closePlanBuilder() {
  showPlanBuilder.value = false;
  planForm.value = createEmptyForm();
  triggerInput.value = '';
  warningInput.value = '';
  copingInput.value = '';
}

async function generateWithAI() {
  if (!props.patientId || aiGenerating.value) return;
  aiGenerating.value = true;
  try {
    const response = await apiFactory.$_generateAIRecoveryPlan(props.patientId);
    const result = response.data?.data || response.data?.result || response.data;
    const plan = result?.generated_plan;
    if (!plan) {
      $toast.error('AI did not return a valid plan. Please try again.');
      return;
    }

    // Pre-fill the form with AI-generated data
    planForm.value.plan_name = plan.plan_name || '';
    planForm.value.next_review_date = plan.next_review_date || '';
    planForm.value.stages = (plan.stages || []).map((s) => ({
      stage_id: s.stage_id || `ai_stage_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: s.name || '',
      order: s.order || 1,
      estimated_duration_weeks: s.estimated_duration_weeks || null,
      goals: (s.goals || []).map((g) => ({
        goal_id: g.goal_id || `ai_goal_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        description: g.description || '',
        measurable_target: g.measurable_target || '',
        target_date: g.target_date || '',
      })),
      interventions: (s.interventions || []).map((i) => ({
        type: i.type || '',
        description: i.description || '',
        frequency: i.frequency || '',
      })),
    }));
    planForm.value.relapse_prevention = {
      personal_triggers: plan.relapse_prevention?.personal_triggers || [],
      warning_signs: plan.relapse_prevention?.warning_signs || [],
      coping_strategies: plan.relapse_prevention?.coping_strategies || [],
      safe_activities: plan.relapse_prevention?.safe_activities || [],
      emergency_plan: plan.relapse_prevention?.emergency_plan || '',
      high_risk_situations: plan.relapse_prevention?.high_risk_situations || [],
    };

    // Open the plan builder with pre-filled data
    showPlanBuilder.value = true;

    const creditsMsg = result.credits_remaining === 'unlimited'
      ? 'Unlimited credits'
      : `${result.credits_remaining} credit${result.credits_remaining === 1 ? '' : 's'} remaining`;
    $toast.success(`AI plan generated — review and edit before saving. ${creditsMsg}`);
  } catch (err) {
    console.error('Error generating AI plan:', err);
    const msg = err?.response?.data?.message || 'Failed to generate AI plan';
    $toast.error(msg);
  } finally {
    aiGenerating.value = false;
  }
}

async function activatePlan() {
  const planId = props.data?.recovery_plan?._id;
  if (!planId || activatingPlan.value) return;
  activatingPlan.value = true;
  try {
    await apiFactory.$_activatePlan(planId);
    $toast.success('Plan activated — patient can now see goals and begin working on them');
    emit('plan-created');
  } catch (err) {
    console.error('Error activating plan:', err);
    $toast.error(err?.response?.data?.message || 'Failed to activate plan');
  } finally {
    activatingPlan.value = false;
  }
}

async function abandonPlan() {
  const planId = props.data?.recovery_plan?._id;
  if (!planId || abandoningPlan.value) return;
  abandoningPlan.value = true;
  try {
    await apiFactory.$_abandonPlan(planId, 'Discarded by specialist');
    $toast.success('Draft plan discarded');
    emit('plan-created');
  } catch (err) {
    console.error('Error abandoning plan:', err);
    $toast.error(err?.response?.data?.message || 'Failed to discard plan');
  } finally {
    abandoningPlan.value = false;
  }
}

async function submitPlan() {
  if (!planForm.value.plan_name.trim() || !props.patientId) return;
  planSaving.value = true;
  try {
    const payload = {
      patient_id: props.patientId,
      plan_name: planForm.value.plan_name,
      stages: planForm.value.stages.filter(s => s.name).map(s => ({
        ...s,
        goals: s.goals.filter(g => g.description.trim()),
        interventions: s.interventions.filter(i => i.type && i.description.trim()),
      })),
      relapse_prevention: planForm.value.relapse_prevention,
    };
    if (planForm.value.next_review_date) {
      payload.next_review_date = planForm.value.next_review_date;
    }
    await apiFactory.$_createPlanForPatient(payload);
    $toast.success('Recovery plan created successfully');
    closePlanBuilder();
    emit('plan-created');
  } catch (err) {
    console.error('Error creating recovery plan:', err);
    $toast.error(err?.response?.data?.message || 'Failed to create plan');
  } finally {
    planSaving.value = false;
  }
}

const planGoalProgress = computed(() => {
  const stages = props.data?.recovery_plan?.stages || [];
  const total = stages.reduce((s, st) => s + (st.goals?.length || 0), 0);
  const done = stages.reduce((s, st) => s + (st.goals?.filter(g => g.status === 'completed').length || 0), 0);
  return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
});

const planStageProgress = computed(() => {
  const stages = props.data?.recovery_plan?.stages || [];
  const total = stages.length;
  const done = stages.filter(s => s.status === 'completed').length;
  return { total, done };
});

const hasPlanRelapsePrevention = computed(() => {
  const rp = props.data?.recovery_plan?.relapse_prevention;
  if (!rp) return false;
  return (rp.personal_triggers?.length > 0) || (rp.coping_strategies?.length > 0) || (rp.warning_signs?.length > 0);
});

const riskColor = computed(() => {
  const level = props.data?.risk?.level || 'low';
  return { low: 'emerald', moderate: 'amber', high: 'rose', critical: 'rose' }[level] || 'emerald';
});

const riskGaugeColor = computed(() => {
  const level = props.data?.risk?.level || 'low';
  return { low: '#10B981', moderate: '#F59E0B', high: '#F43F5E', critical: '#DC2626' }[level] || '#10B981';
});

const gaugeArc = computed(() => {
  const score = props.data?.risk?.score ?? 0;
  const totalArc = 251; // approximate arc length for 180deg with radius 80
  const filled = (score / 100) * totalArc;
  return `${filled} ${totalArc}`;
});

function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function formatCareLevel(level) {
  if (!level) return '';
  return level.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderChart() {
  if (!moodChartRef.value || !props.data?.mood_trend_30d?.length) return;
  if (chartInstance) chartInstance.destroy();

  const labels = props.data.mood_trend_30d.map((d) => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
  const moodData = props.data.mood_trend_30d.map((d) => d.mood);
  const cravingData = props.data.mood_trend_30d.map((d) => d.craving);

  chartInstance = new Chart(moodChartRef.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Mood',
          data: moodData,
          borderColor: '#0288D1',
          backgroundColor: 'rgba(2, 136, 209, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#0288D1',
        },
        {
          label: 'Craving',
          data: cravingData,
          borderColor: '#F43F5E',
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#F43F5E',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, pointStyle: 'circle', padding: 16 } },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { stepSize: 2 },
        },
        x: {
          grid: { display: false },
          ticks: { maxRotation: 45, font: { size: 10 } },
        },
      },
    },
  });
}

onMounted(() => {
  nextTick(() => renderChart());
});

watch(() => props.data, () => {
  nextTick(() => renderChart());
}, { deep: true });
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;

.recovery-overview {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// Summary Grid
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;

  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 500px) { grid-template-columns: 1fr; }
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--sky { background: linear-gradient(135deg, $sky-light, rgba($sky, 0.2)); color: $sky-dark; }
    &--emerald { background: linear-gradient(135deg, $emerald-light, rgba($emerald, 0.2)); color: $emerald; }
    &--amber { background: linear-gradient(135deg, $amber-light, rgba($amber, 0.2)); color: $amber; }
    &--rose { background: linear-gradient(135deg, $rose-light, rgba($rose, 0.2)); color: $rose; }
  }

  &__info { display: flex; flex-direction: column; gap: 2px; }
  &__value { font-size: 20px; font-weight: 700; color: $color-g-21; }
  &__label { font-size: 12px; color: $color-g-54; font-weight: 500; }
}

// Details Row
.details-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba($sky, 0.08);
  border: 1px solid rgba($sky, 0.15);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: $sky-dark;
}

// Sections
.section-block {
  padding: 20px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: $color-g-21;
  margin-bottom: 16px;

  svg { color: $sky-dark; }
}

// Risk Gauge
.risk-gauge-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.risk-gauge {
  width: 180px;
  height: 110px;
}

.risk-level-badge {
  display: inline-flex;
  padding: 6px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  margin-top: 8px;

  &--low { background: rgba($emerald, 0.1); color: $emerald; }
  &--moderate { background: rgba($amber, 0.1); color: darken($amber, 10%); }
  &--high { background: rgba($rose, 0.1); color: $rose; }
  &--critical { background: rgba(#DC2626, 0.1); color: #DC2626; }
}

// Chart
.chart-container {
  height: 220px;
  position: relative;

  canvas {
    width: 100% !important;
    height: 100% !important;
  }
}

// Quick Stats
.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;

  @media (max-width: 600px) { grid-template-columns: repeat(2, 1fr); }
}

.quick-stat {
  text-align: center;
  padding: 16px;
  background: rgba($sky-light, 0.4);
  border-radius: 12px;

  &__value { display: block; font-size: 24px; font-weight: 700; color: $sky-dark; }
  &__label { display: block; font-size: 11px; color: $color-g-54; font-weight: 500; margin-top: 4px; }
}

// Create Plan Button (inline with section title)
.create-plan-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 16px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  border: none;
  background: linear-gradient(135deg, $sky-dark 0%, #01579B 100%);
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba($sky-dark, 0.3); }

  &--outline {
    background: transparent;
    border: 1px solid rgba($sky, 0.3);
    color: $sky-dark;
    &:hover { background: rgba($sky, 0.08); }
  }
}

// No Plan Prompt
.no-plan-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px;
  text-align: center;

  &__icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, $sky-light, rgba($sky, 0.2));
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;
    margin-bottom: 14px;
  }

  p {
    font-size: 14px;
    color: $color-g-54;
    margin-bottom: 16px;
  }

  &__actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    justify-content: center;
  }
}

// Action Buttons
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &--primary {
    background: linear-gradient(135deg, $sky-dark 0%, #01579B 100%);
    color: white;
    &:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba($sky-dark, 0.3); }
    &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
  }
  &--ghost {
    background: transparent;
    color: $color-g-54;
    &:hover { background: rgba(0,0,0,0.04); }
  }
  &--small {
    font-size: 12px;
    padding: 6px 14px;
    background: rgba($sky, 0.1);
    color: $sky-dark;
    border-radius: 8px;
    &:hover { background: rgba($sky, 0.2); }
  }
  &--tiny {
    font-size: 11px;
    padding: 4px 10px;
    background: transparent;
    color: $sky-dark;
    border-radius: 6px;
    &:hover { background: rgba($sky, 0.08); }
  }
  &--danger-icon {
    padding: 4px;
    background: transparent;
    color: $rose;
    border-radius: 6px;
    &:hover { background: rgba($rose, 0.1); }
  }
  &--ai {
    background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
    color: white;
    &:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(#7C3AED, 0.35); }
    &:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

    &.action-btn--small {
      background: linear-gradient(135deg, #7C3AED 0%, #A855F7 100%);
      color: white;
      &:hover { background: linear-gradient(135deg, #6D28D9 0%, #9333EA 100%); }
    }
  }
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

// Plan Builder
.plan-builder {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h5 { font-size: 16px; font-weight: 700; color: $color-g-21; margin: 0; }
  }

  &__header-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 16px;
    border-top: 1px solid rgba($color-g-92, 0.4);
  }
}

.form-field {
  label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: $color-g-54;
    margin-bottom: 6px;
  }

  .required { color: $rose; }

  input[type="text"],
  input[type="date"],
  textarea {
    width: 100%;
    padding: 10px 14px;
    font-size: 13px;
    border: 1px solid rgba($color-g-92, 0.6);
    border-radius: 10px;
    background: white;
    color: $color-g-21;
    outline: none;
    transition: border-color 0.2s;
    &:focus { border-color: $sky-dark; box-shadow: 0 0 0 3px rgba($sky, 0.1); }
    &::placeholder { color: #94A3B8; }
  }

  textarea { resize: vertical; font-family: inherit; }

  &__sub {
    font-size: 11px !important;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: $color-g-54 !important;
  }
}

.tooltip {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
  color: #94A3B8;
  cursor: help;
  vertical-align: middle;

  &:hover { color: $sky-dark; }
}

.form-hint {
  font-size: 13px;
  color: #94A3B8;
  font-style: italic;
  margin: 0;
  padding: 12px 0;
}

.form-section {
  padding: 16px;
  background: rgba(#F1F5F9, 0.5);
  border-radius: 14px;
  border: 1px solid rgba($color-g-92, 0.4);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    label { font-size: 14px; font-weight: 700; color: $color-g-21; }
  }

  &__title {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: $color-g-21;
    margin-bottom: 14px;
  }
}

.stage-card {
  padding: 14px;
  background: white;
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 12px;
  margin-bottom: 10px;

  &__top {
    display: flex;
    gap: 8px;
    align-items: center;

    select {
      flex: 1;
      padding: 8px 12px;
      font-size: 13px;
      border: 1px solid rgba($color-g-92, 0.6);
      border-radius: 8px;
      background: white;
      color: $color-g-21;
      outline: none;
      &:focus { border-color: $sky-dark; }
    }
  }

  &__weeks {
    width: 80px;
    padding: 8px 10px;
    font-size: 13px;
    border: 1px solid rgba($color-g-92, 0.6);
    border-radius: 8px;
    outline: none;
    &:focus { border-color: $sky-dark; }
  }

  &__section {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed rgba($color-g-92, 0.5);
  }

  &__section-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: $color-g-54;
    margin-bottom: 8px;
  }
}

.inline-row {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 6px;

  input, select {
    padding: 7px 10px;
    font-size: 12px;
    border: 1px solid rgba($color-g-92, 0.6);
    border-radius: 8px;
    background: white;
    color: $color-g-21;
    outline: none;
    &:focus { border-color: $sky-dark; }
    &::placeholder { color: #94A3B8; }
  }

  &__main { flex: 2; }
  &__sub { flex: 1; }
  &__date { width: 130px; }
  &__select { width: 150px; }
}

.tag-input-wrap {
  input {
    width: 100%;
    padding: 8px 12px;
    font-size: 12px;
    border: 1px solid rgba($color-g-92, 0.6);
    border-radius: 8px;
    background: white;
    margin-top: 6px;
    outline: none;
    &:focus { border-color: $sky-dark; }
    &::placeholder { color: #94A3B8; }
  }
}

.plan-tag--amber { background: rgba($amber, 0.1); color: darken($amber, 10%); }

.plan-tag--removable {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  button {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
    display: inline-flex;
    opacity: 0.6;
    &:hover { opacity: 1; }
  }
}

// Recovery Plan Display
.plan-display {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__name {
    font-size: 16px;
    font-weight: 700;
    color: $color-g-21;
    margin: 0 0 6px 0;
  }

  &__review {
    font-size: 12px;
    color: $color-g-54;
    padding: 4px 10px;
    background: rgba($sky, 0.08);
    border-radius: 8px;
  }
}

.plan-status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: capitalize;

  &--draft { background: rgba($amber, 0.1); color: darken($amber, 10%); }
  &--active { background: rgba($emerald, 0.1); color: $emerald; }
  &--completed { background: rgba($sky, 0.1); color: $sky-dark; }
  &--abandoned { background: rgba($rose, 0.1); color: $rose; }
}

.plan-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__bar {
    height: 6px;
    background: rgba($color-g-92, 0.35);
    border-radius: 3px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, $sky-dark 0%, $emerald 100%);
    transition: width 0.4s ease;
    min-width: 0;
  }

  &__stats {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  &__pct {
    font-size: 20px;
    font-weight: 800;
    color: $sky-dark;
    line-height: 1;
  }

  &__detail {
    font-size: 12px;
    color: $color-g-54;
    font-weight: 500;
  }
}

.plan-stages-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-stage-item {
  background: rgba(#F1F5F9, 0.5);
  border: 1px solid rgba($color-g-92, 0.3);
  border-radius: 10px;
  transition: all 0.2s;
  overflow: hidden;

  &--active {
    background: rgba($sky, 0.06);
    border-color: rgba($sky, 0.3);
  }
  &--done {
    background: rgba($emerald, 0.04);
    border-color: rgba($emerald, 0.2);
  }
  &--expanded {
    border-color: rgba($sky, 0.4);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    cursor: pointer;
    &:hover { background: rgba(0, 0, 0, 0.02); }
  }

  &__chevron {
    color: $color-g-54;
    flex-shrink: 0;
  }

  &__num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    background: rgba($color-g-92, 0.3);
    color: $color-g-54;
    flex-shrink: 0;
  }
  &--active &__num { background: rgba($sky, 0.15); color: $sky-dark; }
  &--done &__num { background: rgba($emerald, 0.15); color: $emerald; }

  &__info { flex: 1; }
  &__name { display: block; font-size: 13px; font-weight: 600; color: $color-g-21; }
  &__meta { display: block; font-size: 11px; color: $color-g-54; margin-top: 2px; }
}

.plan-stage-detail {
  padding: 0 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: $color-g-54;
  }

  &__empty {
    font-size: 13px;
    color: #94A3B8;
    font-style: italic;
    margin: 0;
  }
}

.plan-goal-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 1px solid rgba($color-g-92, 0.25);

  &__dot {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid rgba($color-g-92, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;

    &--done {
      border-color: $emerald;
      background: rgba($emerald, 0.1);
      color: $emerald;
    }
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__desc {
    font-size: 13px;
    font-weight: 500;
    color: $color-g-21;
    line-height: 1.4;
  }

  &__target {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: $sky-dark;
    font-weight: 500;
  }

  &__date {
    font-size: 11px;
    color: $color-g-54;
  }
}

.plan-intv-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  border: 1px solid rgba($color-g-92, 0.25);

  &__type {
    font-size: 11px;
    font-weight: 700;
    color: white;
    background: linear-gradient(135deg, $sky-dark, #01579B);
    padding: 2px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }

  &__desc {
    flex: 1;
    font-size: 13px;
    color: $color-g-21;
    min-width: 150px;
  }

  &__freq {
    font-size: 11px;
    color: $color-g-54;
    background: rgba($color-g-92, 0.2);
    padding: 2px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }
}

.plan-stage-status {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 8px;
  white-space: nowrap;

  &--pending { background: rgba($color-g-92, 0.3); color: $color-g-54; }
  &--in_progress { background: rgba($sky, 0.12); color: $sky-dark; }
  &--completed { background: rgba($emerald, 0.1); color: $emerald; }
  &--skipped { background: rgba($amber, 0.1); color: darken($amber, 10%); }
}

.plan-relapse-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba($color-g-92, 0.4);
}

.plan-display__actions {
  display: flex;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid rgba($color-g-92, 0.3);
}

.action-btn--danger-text {
  color: $rose !important;
  &:hover { background: rgba($rose, 0.06) !important; }
}

.plan-detail {
  &__label { display: block; font-size: 11px; font-weight: 600; color: $color-g-54; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px; }
  &__value { font-size: 15px; font-weight: 600; color: $color-g-21; }
}

.plan-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.plan-tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;

  &--emerald { background: rgba($emerald, 0.1); color: darken($emerald, 10%); }
  &--rose { background: rgba($rose, 0.1); color: $rose; }
  &--sky { background: rgba($sky, 0.1); color: $sky-dark; }
}

// Crisis Events
.crisis-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.crisis-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.crisis-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-top: 5px;
  flex-shrink: 0;

  &--low { background: $emerald; }
  &--moderate { background: $amber; }
  &--high, &--critical { background: $rose; }
}

.crisis-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.crisis-type {
  font-size: 14px;
  font-weight: 600;
  color: $color-g-21;
}

.crisis-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: $color-g-54;
}

.crisis-severity {
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;

  &--low { background: rgba($emerald, 0.1); color: $emerald; }
  &--moderate { background: rgba($amber, 0.1); color: darken($amber, 10%); }
  &--high { background: rgba($rose, 0.1); color: $rose; }
  &--critical { background: rgba(#DC2626, 0.1); color: #DC2626; }
}

.crisis-resolved {
  padding: 2px 8px;
  background: rgba($emerald, 0.1);
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: $emerald;
}

// Check-in Preview
.checkin-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkin-mini {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba($color-g-92, 0.4);
  border-radius: 10px;

  &__date {
    font-size: 13px;
    font-weight: 600;
    color: $color-g-36;
    min-width: 60px;
  }

  &__sober {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 8px;

    &--yes { background: rgba($emerald, 0.1); color: $emerald; }
    &--no { background: rgba($rose, 0.1); color: $rose; }
  }

  &__mood {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__craving {
    font-size: 12px;
    color: $color-g-54;
    white-space: nowrap;
  }
}

.mood-bar {
  flex: 1;
  height: 6px;
  background: rgba($color-g-92, 0.5);
  border-radius: 3px;
  overflow: hidden;

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, $rose 0%, $amber 40%, $emerald 100%);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: $color-g-36;
    min-width: 16px;
  }
}
</style>
