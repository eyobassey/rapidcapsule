<template>
  <div class="safety-plan">
    <!-- Emergency banner -->
    <div class="safety-plan__emergency">
      <svg class="safety-plan__emergency-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div class="safety-plan__emergency-text">
        <strong>If you are in immediate danger, call 999</strong>
        <a href="tel:999" class="safety-plan__emergency-call">
          <svg class="safety-plan__phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
          </svg>
          Call 999 Now
        </a>
      </div>
    </div>

    <!-- Crisis resources -->
    <div v-if="data.crisis_resources && data.crisis_resources.length" class="safety-plan__crisis">
      <h4 class="safety-plan__section-heading">Crisis Resources</h4>
      <div class="safety-plan__crisis-grid">
        <div
          v-for="(resource, idx) in data.crisis_resources"
          :key="idx"
          class="safety-plan__crisis-card"
        >
          <div class="safety-plan__crisis-info">
            <span class="safety-plan__crisis-name">{{ resource.name }}</span>
            <span v-if="resource.available" class="safety-plan__crisis-available">
              {{ resource.available }}
            </span>
          </div>
          <a
            :href="'tel:' + resource.phone"
            class="safety-plan__crisis-phone"
          >
            <svg class="safety-plan__phone-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
            </svg>
            {{ resource.phone }}
          </a>
        </div>
      </div>
    </div>

    <!-- Safety plan steps (expandable/collapsible) -->
    <div v-if="data.steps && data.steps.length" class="safety-plan__steps">
      <h4 class="safety-plan__section-heading">Your Safety Plan</h4>
      <div
        v-for="(step, idx) in data.steps"
        :key="idx"
        class="safety-plan__step"
        :class="{ 'safety-plan__step--open': openSteps[idx] }"
      >
        <button
          class="safety-plan__step-header"
          @click="toggleStep(idx)"
        >
          <span class="safety-plan__step-number">{{ idx + 1 }}</span>
          <span class="safety-plan__step-title">{{ step.title }}</span>
          <svg
            class="safety-plan__step-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <div v-if="openSteps[idx]" class="safety-plan__step-body">
          <p>{{ step.description }}</p>
        </div>
      </div>
    </div>

    <!-- Footer note -->
    <div class="safety-plan__footer">
      <p>This safety plan was created with your AI companion. Share it with your care team.</p>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

const openSteps = reactive({})

function toggleStep(idx) {
  openSteps[idx] = !openSteps[idx]
}
</script>

<style scoped lang="scss">
.safety-plan {
  padding: 16px;
  overflow-y: auto;
  max-height: 100%;

  /* Emergency banner */
  &__emergency {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.08));
    border: 1px solid rgba(252, 165, 165, 0.3);
    border-radius: 12px;
    margin-bottom: 16px;
  }

  &__emergency-icon {
    width: 24px;
    height: 24px;
    color: #DC2626;
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__emergency-text {
    display: flex;
    flex-direction: column;
    gap: 8px;

    strong {
      font-size: 14px;
      color: #fca5a5;
    }
  }

  &__emergency-call {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: #DC2626;
    color: #FFFFFF;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: background 0.2s;
    width: fit-content;

    &:hover {
      background: #B91C1C;
    }
  }

  &__phone-icon {
    width: 16px;
    height: 16px;
  }

  /* Section heading */
  &__section-heading {
    font-size: 13px;
    font-weight: 700;
    color: #0ea5e9;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin: 0 0 10px;
  }

  /* Crisis resources */
  &__crisis {
    margin-bottom: 16px;
  }

  &__crisis-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__crisis-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 12px 14px;
  }

  &__crisis-info {
    display: flex;
    flex-direction: column;
  }

  &__crisis-name {
    font-size: 13px;
    font-weight: 600;
    color: #f8fafc;
  }

  &__crisis-available {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
  }

  &__crisis-phone {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    background: #4FC3F7;
    color: #FFFFFF;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.2s;
    white-space: nowrap;

    &:hover {
      background: #0ea5e9;
    }
  }

  &__phone-icon-sm {
    width: 14px;
    height: 14px;
  }

  /* Safety plan steps */
  &__steps {
    margin-bottom: 16px;
  }

  &__step {
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    margin-bottom: 6px;
    overflow: hidden;
    transition: box-shadow 0.2s;

    &--open {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  }

  &__step-header {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 14px;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;

    &:hover {
      background: rgba(14, 165, 233, 0.1);
    }
  }

  &__step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    min-width: 26px;
    border-radius: 50%;
    background: rgba(14, 165, 233, 0.15);
    color: #0ea5e9;
    font-size: 12px;
    font-weight: 700;
  }

  &__step-title {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
    color: #f8fafc;
  }

  &__step-chevron {
    width: 18px;
    height: 18px;
    color: #64748b;
    transition: transform 0.2s;
    flex-shrink: 0;

    .safety-plan__step--open & {
      transform: rotate(180deg);
    }
  }

  &__step-body {
    padding: 0 14px 14px;
    padding-left: 50px;

    p {
      font-size: 13px;
      color: #f8fafc;
      line-height: 1.6;
      margin: 0;
    }
  }

  /* Footer */
  &__footer {
    padding: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;

    p {
      font-size: 11px;
      color: #64748b;
      margin: 0;
      line-height: 1.5;
    }
  }
}
</style>
