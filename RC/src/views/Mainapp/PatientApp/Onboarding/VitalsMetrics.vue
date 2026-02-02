<template>
  <div class="step-container">
    <div class="step-scroll">
      <div class="step-content">
        <div class="step-header">
          <button class="back-btn" @click="goBack">
            <v-icon name="hi-arrow-left" scale="0.9" />
            <span>Back</span>
          </button>
          <div class="step-info">
            <span class="step-badge optional">Step 5 of 9 - Optional</span>
            <h1 class="step-title">Vitals & Health Metrics</h1>
            <p class="step-description">
              Record your basic health metrics for accurate health assessments.
            </p>
          </div>
        </div>

        <div class="form-sections">
          <div class="form-section">
            <h2 class="section-title">Body Measurements</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Height</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    v-model="vitalsMetrics.height"
                    class="form-input"
                    placeholder="e.g., 175"
                  />
                  <select v-model="vitalsMetrics.height_unit" class="unit-select">
                    <option value="cm">cm</option>
                    <option value="ft">ft</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Weight</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    v-model="vitalsMetrics.weight"
                    class="form-input"
                    placeholder="e.g., 70"
                  />
                  <select v-model="vitalsMetrics.weight_unit" class="unit-select">
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- BMI Display -->
            <div v-if="bmi" class="bmi-display">
              <div class="bmi-value">
                <span class="bmi-number">{{ bmi }}</span>
                <span class="bmi-label">BMI</span>
              </div>
              <div class="bmi-category" :style="{ color: bmiCategory?.color }">
                {{ bmiCategory?.label }}
              </div>
            </div>
          </div>

          <div class="form-section">
            <h2 class="section-title">Blood Pressure</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Systolic (top number)</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    v-model="vitalsMetrics.blood_pressure.systolic"
                    class="form-input"
                    placeholder="e.g., 120"
                  />
                  <span class="unit-label">mmHg</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Diastolic (bottom number)</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    v-model="vitalsMetrics.blood_pressure.diastolic"
                    class="form-input"
                    placeholder="e.g., 80"
                  />
                  <span class="unit-label">mmHg</span>
                </div>
              </div>
            </div>

            <!-- Blood Pressure Status Display -->
            <div v-if="bloodPressureStatus" class="vital-status-display" :class="bloodPressureStatus.class">
              <div class="vital-status-icon">
                <v-icon :name="bloodPressureStatus.icon" scale="1.2" />
              </div>
              <div class="vital-status-info">
                <span class="vital-status-reading">{{ vitalsMetrics.blood_pressure.systolic }}/{{ vitalsMetrics.blood_pressure.diastolic }} mmHg</span>
                <span class="vital-status-label" :style="{ color: bloodPressureStatus.color }">{{ bloodPressureStatus.label }}</span>
              </div>
              <div class="vital-status-description">{{ bloodPressureStatus.description }}</div>
            </div>
          </div>

          <div class="form-section">
            <h2 class="section-title">Other Vitals</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Heart Rate</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    v-model="vitalsMetrics.heart_rate"
                    class="form-input"
                    placeholder="e.g., 72"
                  />
                  <span class="unit-label">bpm</span>
                </div>
                <!-- Heart Rate Status -->
                <div v-if="heartRateStatus" class="vital-inline-status" :style="{ backgroundColor: heartRateStatus.bgColor }">
                  <v-icon :name="heartRateStatus.icon" scale="0.8" :style="{ color: heartRateStatus.color }" />
                  <span :style="{ color: heartRateStatus.color }">{{ heartRateStatus.label }}</span>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Temperature</label>
                <div class="input-with-unit">
                  <input
                    type="number"
                    step="0.1"
                    v-model="vitalsMetrics.temperature"
                    class="form-input"
                    placeholder="e.g., 36.5"
                  />
                  <span class="unit-label">°C</span>
                </div>
                <!-- Temperature Status -->
                <div v-if="temperatureStatus" class="vital-inline-status" :style="{ backgroundColor: temperatureStatus.bgColor }">
                  <v-icon :name="temperatureStatus.icon" scale="0.8" :style="{ color: temperatureStatus.color }" />
                  <span :style="{ color: temperatureStatus.color }">{{ temperatureStatus.label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="step-footer">
          <button class="btn-skip" @click="skipStep">
            Skip for now
          </button>
          <div class="footer-actions">
            <button class="btn-secondary" @click="saveAndExit">
              Save & Exit
            </button>
            <button class="btn-primary" @click="saveAndContinue">
              <span>Continue</span>
              <v-icon name="hi-arrow-right" scale="0.8" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { usePatientOnboardingState } from './composables/usePatientOnboardingState';

const router = useRouter();
const store = useStore();
const $http = inject('$http');
const { vitalsMetrics, bmi, bmiCategory, completeStep, saveProgress, goToStep } = usePatientOnboardingState();

const isSaving = ref(false);

// Blood Pressure Status (based on AHA guidelines)
const bloodPressureStatus = computed(() => {
  const systolic = parseInt(vitalsMetrics.blood_pressure.systolic);
  const diastolic = parseInt(vitalsMetrics.blood_pressure.diastolic);

  if (!systolic || !diastolic) return null;

  // Hypertensive Crisis
  if (systolic > 180 || diastolic > 120) {
    return {
      label: 'Hypertensive Crisis',
      description: 'Seek emergency medical attention immediately',
      color: '#DC2626',
      bgColor: '#FEE2E2',
      icon: 'hi-exclamation',
      class: 'status-critical',
    };
  }
  // Stage 2 Hypertension
  if (systolic >= 140 || diastolic >= 90) {
    return {
      label: 'Stage 2 Hypertension',
      description: 'High blood pressure - consult your doctor',
      color: '#DC2626',
      bgColor: '#FEE2E2',
      icon: 'hi-exclamation-circle',
      class: 'status-high',
    };
  }
  // Stage 1 Hypertension
  if (systolic >= 130 || diastolic >= 80) {
    return {
      label: 'Stage 1 Hypertension',
      description: 'Elevated - lifestyle changes recommended',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      icon: 'hi-exclamation',
      class: 'status-elevated',
    };
  }
  // Elevated
  if (systolic >= 120 && systolic < 130 && diastolic < 80) {
    return {
      label: 'Elevated',
      description: 'Higher than optimal - monitor regularly',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      icon: 'hi-trending-up',
      class: 'status-elevated',
    };
  }
  // Low Blood Pressure
  if (systolic < 90 || diastolic < 60) {
    return {
      label: 'Low Blood Pressure',
      description: 'Below normal range - consult if symptomatic',
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      icon: 'hi-trending-down',
      class: 'status-low',
    };
  }
  // Normal
  return {
    label: 'Normal',
    description: 'Your blood pressure is within healthy range',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: 'hi-check-circle',
    class: 'status-normal',
  };
});

// Heart Rate Status (resting heart rate for adults)
const heartRateStatus = computed(() => {
  const hr = parseInt(vitalsMetrics.heart_rate);
  if (!hr) return null;

  if (hr < 40) {
    return { label: 'Very Low', color: '#3B82F6', bgColor: '#DBEAFE', icon: 'hi-trending-down' };
  }
  if (hr < 60) {
    return { label: 'Low (Bradycardia)', color: '#3B82F6', bgColor: '#DBEAFE', icon: 'hi-arrow-down' };
  }
  if (hr <= 100) {
    return { label: 'Normal', color: '#10B981', bgColor: '#D1FAE5', icon: 'hi-check-circle' };
  }
  if (hr <= 120) {
    return { label: 'Elevated (Tachycardia)', color: '#F59E0B', bgColor: '#FEF3C7', icon: 'hi-arrow-up' };
  }
  return { label: 'High', color: '#DC2626', bgColor: '#FEE2E2', icon: 'hi-exclamation-circle' };
});

// Temperature Status (in Celsius)
const temperatureStatus = computed(() => {
  const temp = parseFloat(vitalsMetrics.temperature);
  if (!temp) return null;

  if (temp < 35) {
    return { label: 'Hypothermia', color: '#3B82F6', bgColor: '#DBEAFE', icon: 'hi-trending-down' };
  }
  if (temp < 36.1) {
    return { label: 'Low', color: '#3B82F6', bgColor: '#DBEAFE', icon: 'hi-arrow-down' };
  }
  if (temp <= 37.2) {
    return { label: 'Normal', color: '#10B981', bgColor: '#D1FAE5', icon: 'hi-check-circle' };
  }
  if (temp <= 38) {
    return { label: 'Low-grade Fever', color: '#F59E0B', bgColor: '#FEF3C7', icon: 'hi-arrow-up' };
  }
  if (temp <= 39) {
    return { label: 'Fever', color: '#F59E0B', bgColor: '#FEF3C7', icon: 'hi-fire' };
  }
  return { label: 'High Fever', color: '#DC2626', bgColor: '#FEE2E2', icon: 'hi-exclamation-circle' };
});

const goBack = () => goToStep(4);

// Save vitals to backend
const saveVitalsToBackend = async () => {
  try {
    isSaving.value = true;
    const promises = [];

    // Save height/weight to user profile (basic_health_info)
    if (vitalsMetrics.height || vitalsMetrics.weight) {
      promises.push(
        $http.$_updateUser({
          profile: {
            basic_health_info: {
              ...(vitalsMetrics.height && {
                height: {
                  value: parseFloat(vitalsMetrics.height),
                  unit: vitalsMetrics.height_unit || 'cm',
                },
              }),
              ...(vitalsMetrics.weight && {
                weight: {
                  value: parseFloat(vitalsMetrics.weight),
                  unit: vitalsMetrics.weight_unit || 'kg',
                },
              }),
            },
          },
        })
      );
    }

    // Save blood pressure to vitals collection
    if (vitalsMetrics.blood_pressure.systolic && vitalsMetrics.blood_pressure.diastolic) {
      const bpValue = `${vitalsMetrics.blood_pressure.systolic}/${vitalsMetrics.blood_pressure.diastolic}`;
      promises.push(
        store.dispatch('vitalsManagement/addVitals', {
          name: 'Blood Pressure',
          value: bpValue,
          unit: 'mmHg',
        })
      );
    }

    // Save heart rate (pulse rate) to vitals collection
    if (vitalsMetrics.heart_rate) {
      promises.push(
        store.dispatch('vitalsManagement/addVitals', {
          name: 'Pulse Rate',
          value: vitalsMetrics.heart_rate.toString(),
          unit: 'bpm',
        })
      );
    }

    // Save temperature to vitals collection
    if (vitalsMetrics.temperature) {
      promises.push(
        store.dispatch('vitalsManagement/addVitals', {
          name: 'Body Temperature',
          value: vitalsMetrics.temperature.toString(),
          unit: '°C',
        })
      );
    }

    await Promise.all(promises);
    // Refresh user profile in store
    await store.dispatch('authenticate', localStorage.getItem('token') || sessionStorage.getItem('token'));
    return true;
  } catch (error) {
    console.error('Failed to save vitals:', error);
    return false;
  } finally {
    isSaving.value = false;
  }
};

const skipStep = () => {
  saveProgress();
  goToStep(6);
};

const saveAndExit = async () => {
  await saveVitalsToBackend();
  saveProgress();
  router.push({ name: 'Patient Dashboard' });
};

const saveAndContinue = async () => {
  const saved = await saveVitalsToBackend();

  if ((vitalsMetrics.height || vitalsMetrics.weight) && saved) {
    completeStep('vitalsMetrics');
  }
  saveProgress();
  goToStep(6);
};
</script>

<style scoped lang="scss">
@import './styles/step-common.scss';

.input-with-unit {
  display: flex;
  gap: 0.5rem;

  .form-input {
    flex: 1;
  }
}

.unit-select {
  width: 80px;
  padding: 0.75rem;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #64748B;
  background: #F8FAFC;
}

.unit-label {
  display: flex;
  align-items: center;
  padding: 0 1rem;
  background: #F1F5F9;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #64748B;
}

.bmi-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
  border-radius: 0.75rem;
  margin-top: 1.5rem;
}

.bmi-value {
  text-align: center;

  .bmi-number {
    display: block;
    font-size: 2rem;
    font-weight: 700;
    color: #0277BD;
  }

  .bmi-label {
    font-size: 0.75rem;
    color: #0288D1;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

.bmi-category {
  font-size: 1.125rem;
  font-weight: 600;
}

// Blood Pressure Status Display
.vital-status-display {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  margin-top: 1rem;

  &.status-normal {
    background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  }

  &.status-elevated {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  }

  &.status-high, &.status-critical {
    background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  }

  &.status-low {
    background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  }
}

.vital-status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  flex-shrink: 0;
}

.vital-status-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.vital-status-reading {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1A365D;
}

.vital-status-label {
  font-size: 0.875rem;
  font-weight: 600;
}

.vital-status-description {
  font-size: 0.75rem;
  color: #64748B;
  margin-left: auto;
  max-width: 200px;
  text-align: right;

  @media (max-width: 640px) {
    display: none;
  }
}

// Inline status for heart rate and temperature
.vital-inline-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
