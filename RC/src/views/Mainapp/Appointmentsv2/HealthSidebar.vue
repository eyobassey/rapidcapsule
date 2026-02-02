<template>
  <aside class="v2-health-sidebar">
    <div class="sidebar-inner">
      <h3 class="sidebar-title">Patient Health Summary</h3>

      <!-- Vitals Snapshot Card (Dark Navy) -->
      <div class="vitals-card">
        <div class="vitals-bg-icon">
          <v-icon name="fa-heartbeat" scale="4" />
        </div>
        <div class="vitals-header">
          <span class="vitals-label">My Vitals</span>
          <button class="vitals-update-btn" @click="openVitalsModal">
            <v-icon name="hi-pencil" scale="0.6" />
            Update
          </button>
        </div>
        <div class="vitals-date" v-if="vitalsDate">Last updated: {{ vitalsDate }}</div>
        <div class="vitals-grid">
          <div class="vital-item">
            <div class="vital-icon pulse">
              <v-icon name="hi-heart" scale="0.7" />
            </div>
            <div class="vital-info">
              <div class="vital-name">Heart Rate</div>
              <div class="vital-value">
                {{ vitals.heartRate || '--' }}
                <span class="vital-unit">bpm</span>
              </div>
            </div>
          </div>
          <div class="vital-item">
            <div class="vital-icon pressure">
              <v-icon name="fa-heartbeat" scale="0.7" />
            </div>
            <div class="vital-info">
              <div class="vital-name">Blood Pressure</div>
              <div class="vital-value">{{ vitals.bloodPressure || '--' }}</div>
            </div>
          </div>
          <div class="vital-item">
            <div class="vital-icon weight">
              <v-icon name="fa-weight" scale="0.7" />
            </div>
            <div class="vital-info">
              <div class="vital-name">Weight</div>
              <div class="vital-value">
                {{ vitals.weight || '--' }}
                <span class="vital-unit">kg</span>
              </div>
            </div>
          </div>
          <div class="vital-item">
            <div class="vital-icon temp">
              <v-icon name="fa-thermometer-half" scale="0.7" />
            </div>
            <div class="vital-info">
              <div class="vital-name">Temperature</div>
              <div class="vital-value">
                {{ vitals.temperature || '--' }}
                <span class="vital-unit" v-if="vitals.temperature">°C</span>
              </div>
            </div>
          </div>
          <div class="vital-item">
            <div class="vital-icon sugar">
              <v-icon name="bi-droplet-fill" scale="0.7" />
            </div>
            <div class="vital-info">
              <div class="vital-name">Blood Sugar</div>
              <div class="vital-value">
                {{ vitals.bloodSugar || '--' }}
                <span class="vital-unit" v-if="vitals.bloodSugar">mg/dL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vitals Update Modal -->
      <div v-if="showVitalsModal" class="vitals-modal-overlay" @click.self="closeVitalsModal">
        <div class="vitals-modal">
          <div class="vitals-modal__header">
            <div class="header-content">
              <div class="header-icon">
                <v-icon name="hi-heart" scale="1" />
              </div>
              <div class="header-text">
                <h3>Update Vitals</h3>
                <p>Enter your latest health measurements</p>
              </div>
            </div>
            <button class="close-btn" @click="closeVitalsModal">
              <v-icon name="hi-x" scale="0.9" />
            </button>
          </div>

          <div class="vitals-modal__body">
            <!-- Heart Rate -->
            <div class="vital-input-group">
              <label>
                <span class="vital-icon-sm pulse"><v-icon name="hi-heart" scale="0.6" /></span>
                Heart Rate
              </label>
              <div class="input-row">
                <input
                  type="number"
                  v-model="vitalForm.heartRate"
                  placeholder="72"
                  class="vital-input"
                />
                <span class="unit">bpm</span>
              </div>
            </div>

            <!-- Blood Pressure -->
            <div class="vital-input-group">
              <label>
                <span class="vital-icon-sm pressure"><v-icon name="fa-heartbeat" scale="0.6" /></span>
                Blood Pressure
              </label>
              <div class="input-row bp-row">
                <input
                  type="number"
                  v-model="vitalForm.bpSystolic"
                  placeholder="120"
                  class="vital-input"
                />
                <span class="bp-divider">/</span>
                <input
                  type="number"
                  v-model="vitalForm.bpDiastolic"
                  placeholder="80"
                  class="vital-input"
                />
                <span class="unit">mmHg</span>
              </div>
            </div>

            <!-- Weight -->
            <div class="vital-input-group">
              <label>
                <span class="vital-icon-sm weight"><v-icon name="fa-weight" scale="0.6" /></span>
                Weight
              </label>
              <div class="input-row">
                <input
                  type="number"
                  v-model="vitalForm.weight"
                  placeholder="70"
                  step="0.1"
                  class="vital-input"
                />
                <select v-model="vitalForm.weightUnit" class="unit-select">
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>

            <!-- Temperature -->
            <div class="vital-input-group">
              <label>
                <span class="vital-icon-sm temp"><v-icon name="fa-thermometer-half" scale="0.6" /></span>
                Temperature
              </label>
              <div class="input-row">
                <input
                  type="number"
                  v-model="vitalForm.temperature"
                  placeholder="36.5"
                  step="0.1"
                  class="vital-input"
                />
                <select v-model="vitalForm.tempUnit" class="unit-select">
                  <option value="°C">°C</option>
                  <option value="°F">°F</option>
                </select>
              </div>
            </div>

            <!-- Blood Sugar -->
            <div class="vital-input-group">
              <label>
                <span class="vital-icon-sm sugar"><v-icon name="bi-droplet-fill" scale="0.6" /></span>
                Blood Sugar
              </label>
              <div class="input-row">
                <input
                  type="number"
                  v-model="vitalForm.bloodSugar"
                  placeholder="90"
                  class="vital-input"
                />
                <select v-model="vitalForm.bloodSugarUnit" class="unit-select">
                  <option value="mg/dL">mg/dL</option>
                  <option value="mmol/L">mmol/L</option>
                </select>
              </div>
            </div>
          </div>

          <div class="vitals-modal__footer">
            <button class="cancel-btn" @click="closeVitalsModal">Cancel</button>
            <button
              class="save-btn"
              :class="{ loading: isSaving }"
              :disabled="isSaving || !hasAnyInput"
              @click="saveVitals"
            >
              <span v-if="!isSaving">
                <v-icon name="hi-check" scale="0.8" />
                Save Vitals
              </span>
              <span v-else class="loading-state">
                <span class="spinner"></span>
                Saving...
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Last Checkup Card -->
      <div class="info-card">
        <div class="card-header">
          <h4 class="card-title">Last Appointment</h4>
          <router-link to="/app/patient/appointments" class="card-link">View All</router-link>
        </div>
        <div class="checkup-item" v-if="lastCheckup">
          <div class="checkup-avatar">
            <rc-avatar
              size="sm"
              :firstName="lastCheckup.firstName || ''"
              :lastName="lastCheckup.lastName || ''"
              :modelValue="lastCheckup.profileImage"
            />
          </div>
          <div class="checkup-info">
            <div class="checkup-title">{{ lastCheckup.title || 'General Consultation' }}</div>
            <div class="checkup-subtitle">{{ lastCheckup.doctor || 'Doctor' }} • {{ lastCheckup.ago || 'Recently' }}</div>
            <div class="checkup-badges">
              <span class="badge badge-success">Completed</span>
              <span class="badge badge-gray" v-if="lastCheckup.followUp">Follow-up needed</span>
            </div>
          </div>
        </div>
        <div class="no-data" v-else>
          <v-icon name="hi-information-circle" scale="0.85" />
          <span>No recent appointments</span>
        </div>
      </div>

      <!-- AI Insights Card -->
      <div class="ai-card">
        <div class="ai-header">
          <div class="ai-icon">
            <v-icon name="fa-magic" scale="0.8" />
          </div>
          <h4 class="ai-title">AI Insights</h4>
        </div>
        <p class="ai-text" v-if="lastHealthCheckup">
          Based on your reported <span class="highlight-dark">{{ symptoms }}</span> and history, we recommend a
          <span class="highlight-sky">{{ recommendedSpecialty }}</span> consultation.
        </p>
        <p class="ai-text" v-else>
          Complete a health checkup to get personalized recommendations from our AI system.
        </p>
        <button class="ai-btn" v-if="lastHealthCheckup" @click="applyRecommendation">
          Apply Recommendation
        </button>
        <router-link to="/app/patient/health-checkup" class="ai-btn" v-else>
          Start Health Checkup
        </router-link>
      </div>

      <!-- Support Card -->
      <div class="support-card">
        <v-icon name="fa-headset" scale="1" class="support-icon" />
        <div class="support-content">
          <div class="support-title">Need Assistance?</div>
          <p class="support-text">Our support team is available 24/7 to help you book.</p>
          <a href="mailto:support@rapidcapsule.com" class="support-link">Start Chat</a>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toast-notification';
import RcAvatar from '@/components/RCAvatar';

const store = useStore();
const $http = inject('$_HTTP');
const booking = inject('bookingStateV2', null);
const toast = useToast();

const vitals = ref({
  bloodPressure: null,
  heartRate: null,
  temperature: null,
  weight: null,
  bloodSugar: null,
});

const vitalsDate = ref('');
const lastCheckup = ref(null);
const lastHealthCheckup = ref(null);

// Vitals Modal state
const showVitalsModal = ref(false);
const isSaving = ref(false);
const vitalForm = ref({
  heartRate: '',
  bpSystolic: '',
  bpDiastolic: '',
  weight: '',
  weightUnit: 'kg',
  temperature: '',
  tempUnit: '°C',
  bloodSugar: '',
  bloodSugarUnit: 'mg/dL',
});

const hasAnyInput = computed(() => {
  return !!(
    vitalForm.value.heartRate ||
    (vitalForm.value.bpSystolic && vitalForm.value.bpDiastolic) ||
    vitalForm.value.weight ||
    vitalForm.value.temperature ||
    vitalForm.value.bloodSugar
  );
});

const openVitalsModal = () => {
  // Pre-fill with current values if available
  vitalForm.value = {
    heartRate: vitals.value.heartRate || '',
    bpSystolic: vitals.value.bloodPressure ? vitals.value.bloodPressure.split('/')[0] : '',
    bpDiastolic: vitals.value.bloodPressure ? vitals.value.bloodPressure.split('/')[1] : '',
    weight: vitals.value.weight || '',
    weightUnit: 'kg',
    temperature: vitals.value.temperature || '',
    tempUnit: '°C',
    bloodSugar: vitals.value.bloodSugar || '',
    bloodSugarUnit: 'mg/dL',
  };
  showVitalsModal.value = true;
};

const closeVitalsModal = () => {
  showVitalsModal.value = false;
};

const saveVitals = async () => {
  isSaving.value = true;
  const today = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toTimeString().slice(0, 5);
  const recordedAt = `${today}T${currentTime}:00`;

  try {
    const promises = [];

    // Save Heart Rate (Pulse Rate)
    if (vitalForm.value.heartRate) {
      promises.push(
        store.dispatch('vitalsManagement/updateVitals', {
          name: 'Pulse Rate',
          value: vitalForm.value.heartRate,
          unit: 'bpm',
          recorded_at: recordedAt,
        })
      );
    }

    // Save Blood Pressure
    if (vitalForm.value.bpSystolic && vitalForm.value.bpDiastolic) {
      promises.push(
        store.dispatch('vitalsManagement/updateVitals', {
          name: 'Blood Pressure',
          value: `${vitalForm.value.bpSystolic}/${vitalForm.value.bpDiastolic}`,
          unit: 'mmHg',
          recorded_at: recordedAt,
        })
      );
    }

    // Save Weight
    if (vitalForm.value.weight) {
      promises.push(
        store.dispatch('vitalsManagement/updateVitals', {
          name: 'Body Weight',
          value: vitalForm.value.weight,
          unit: vitalForm.value.weightUnit,
          recorded_at: recordedAt,
        })
      );
    }

    // Save Temperature
    if (vitalForm.value.temperature) {
      promises.push(
        store.dispatch('vitalsManagement/updateVitals', {
          name: 'Body Temperature',
          value: vitalForm.value.temperature,
          unit: vitalForm.value.tempUnit,
          recorded_at: recordedAt,
        })
      );
    }

    // Save Blood Sugar
    if (vitalForm.value.bloodSugar) {
      promises.push(
        store.dispatch('vitalsManagement/updateVitals', {
          name: 'Blood Sugar Level',
          value: vitalForm.value.bloodSugar,
          unit: vitalForm.value.bloodSugarUnit,
          recorded_at: recordedAt,
        })
      );
    }

    if (promises.length > 0) {
      await Promise.all(promises);
      toast.success('Vitals updated successfully!');

      // Refresh vitals data immediately
      await fetchRecentVitals();
      closeVitalsModal();
    } else {
      toast.warning('Please enter at least one vital measurement');
    }
  } catch (error) {
    console.error('Error saving vitals:', error);
    toast.error('Failed to save vitals. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

const userProfile = computed(() => store.state.userProfile);

const symptoms = computed(() => {
  return lastHealthCheckup.value?.request?.symptoms?.[0]?.name || 'symptoms';
});

const recommendedSpecialty = computed(() => {
  if (lastHealthCheckup.value?.response?.data?.specialist_recommendations?.length) {
    return lastHealthCheckup.value.response.data.specialist_recommendations[0].name || 'General Practitioner';
  }
  return 'General Practitioner';
});

const applyRecommendation = () => {
  if (booking && recommendedSpecialty.value) {
    // Set the recommended category in booking state
    booking.category.specialist_category = recommendedSpecialty.value;
    booking.category.aiSuggested = true;
  }
};

onMounted(async () => {
  await Promise.allSettled([
    fetchRecentVitals(),
    fetchLastCheckup(),
  ]);
});

const fetchRecentVitals = async () => {
  try {
    const userId = userProfile.value?._id || userProfile.value?.id;
    if (!userId) return;

    const { data } = await $http.$_getOneUserVitals(userId);
    const vitalsData = data?.data || data;

    // Helper to get the latest value from an array of vitals readings
    const getLatestValue = (arr) => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
      // Sort by updatedAt or take last entry
      const sorted = [...arr].sort((a, b) =>
        new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
      return sorted[0]?.value || null;
    };

    // Helper to get the latest date from vitals arrays
    const getLatestDate = (vitalsObj) => {
      const dates = [];
      ['blood_pressure', 'pulse_rate', 'body_weight', 'body_temp', 'blood_sugar_level'].forEach(key => {
        if (vitalsObj[key] && Array.isArray(vitalsObj[key]) && vitalsObj[key].length > 0) {
          const latestEntry = vitalsObj[key][vitalsObj[key].length - 1];
          if (latestEntry?.updatedAt) {
            dates.push(new Date(latestEntry.updatedAt));
          }
        }
      });
      if (dates.length === 0) return null;
      return new Date(Math.max(...dates));
    };

    // Handle array of vitals records (multiple records)
    if (Array.isArray(vitalsData) && vitalsData.length > 0) {
      // Sort by date descending and get most recent
      const sorted = vitalsData.sort((a, b) =>
        new Date(b.createdAt || b.created_at || b.date || 0) - new Date(a.createdAt || a.created_at || a.date || 0)
      );
      const recent = sorted[0];

      vitals.value = {
        bloodPressure: getLatestValue(recent.blood_pressure),
        heartRate: getLatestValue(recent.pulse_rate),
        temperature: getLatestValue(recent.body_temp),
        weight: getLatestValue(recent.body_weight),
        bloodSugar: getLatestValue(recent.blood_sugar_level),
      };

      // Calculate how recent
      const vitalsDateVal = getLatestDate(recent) || new Date(recent.createdAt || recent.created_at || recent.date);
      if (vitalsDateVal) {
        const now = new Date();
        const diffDays = Math.floor((now - vitalsDateVal) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) vitalsDate.value = 'Today';
        else if (diffDays === 1) vitalsDate.value = 'Yesterday';
        else if (diffDays < 7) vitalsDate.value = `${diffDays}d ago`;
        else vitalsDate.value = `${Math.floor(diffDays / 7)}w ago`;
      }
    } else if (vitalsData && typeof vitalsData === 'object' && !Array.isArray(vitalsData)) {
      // Single vitals object
      vitals.value = {
        bloodPressure: getLatestValue(vitalsData.blood_pressure),
        heartRate: getLatestValue(vitalsData.pulse_rate),
        temperature: getLatestValue(vitalsData.body_temp),
        weight: getLatestValue(vitalsData.body_weight),
        bloodSugar: getLatestValue(vitalsData.blood_sugar_level),
      };

      const vitalsDateVal = getLatestDate(vitalsData);
      if (vitalsDateVal) {
        const now = new Date();
        const diffDays = Math.floor((now - vitalsDateVal) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) vitalsDate.value = 'Today';
        else if (diffDays === 1) vitalsDate.value = 'Yesterday';
        else if (diffDays < 7) vitalsDate.value = `${diffDays}d ago`;
        else vitalsDate.value = `${Math.floor(diffDays / 7)}w ago`;
      } else {
        vitalsDate.value = 'Recent';
      }
    }
  } catch (error) {
    console.log('Could not fetch vitals:', error);
  }
};

const fetchLastCheckup = async () => {
  try {
    // Fetch completed appointments using the patient endpoint
    const { data } = await $http.$_getPatientAppointments({
      currentPage: 1,
      pageLimit: 10,
      status: 'COMPLETED',
    });
    const appointments = data?.data || data || [];

    if (Array.isArray(appointments) && appointments.length > 0) {
      // Sort by date descending and get the most recent
      const sortedAppointments = [...appointments].sort((a, b) =>
        new Date(b.date || b.start_time || b.createdAt) - new Date(a.date || a.start_time || a.createdAt)
      );
      const lastApt = sortedAppointments[0];

      // Calculate how long ago
      const aptDate = new Date(lastApt.date || lastApt.start_time || lastApt.createdAt);
      const now = new Date();
      const diffDays = Math.floor((now - aptDate) / (1000 * 60 * 60 * 24));
      let agoText = 'Recently';
      if (diffDays === 0) agoText = 'Today';
      else if (diffDays === 1) agoText = 'Yesterday';
      else if (diffDays < 7) agoText = `${diffDays} days ago`;
      else if (diffDays < 14) agoText = '1 week ago';
      else if (diffDays < 30) agoText = `${Math.floor(diffDays / 7)} weeks ago`;
      else if (diffDays < 60) agoText = '1 month ago';
      else agoText = `${Math.floor(diffDays / 30)} months ago`;

      lastCheckup.value = {
        title: lastApt.category || lastApt.specialist_category || 'Consultation',
        doctor: lastApt.specialist?.full_name || 'Specialist',
        firstName: lastApt.specialist?.profile?.first_name || '',
        lastName: lastApt.specialist?.profile?.last_name || '',
        profileImage: lastApt.specialist?.profile?.profile_photo || null,
        ago: agoText,
        followUp: false,
      };
    }

    // Also try to fetch health checkups for AI insights
    const userId = userProfile.value?._id || userProfile.value?.id;
    if (userId) {
      try {
        const healthData = await $http.$_getAllHealthCheckups(userId, { limit: 1 });
        if (healthData?.data?.data?.length) {
          lastHealthCheckup.value = healthData.data.data[0];
        }
      } catch (e) {
        // Health checkup fetch failed, but that's ok
      }
    }
  } catch (error) {
    console.log('Could not fetch appointments:', error);
  }
};
</script>

<style scoped lang="scss">
// V2 Colors
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-orange: #FF9800;
$v2-orange-light: #FFF3E0;
$v2-orange-dark: #F57C00;
$v2-navy: #1A365D;
$v2-success: #4CAF50;

.v2-health-sidebar {
  width: 320px;
  height: 100%;
  background: white;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  flex-shrink: 0;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }

  @media (max-width: 1024px) {
    display: none;
  }
}

.sidebar-inner {
  padding: 24px 24px 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.sidebar-title {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 4px;
}

// Dark Navy Vitals Card
.vitals-card {
  background: linear-gradient(135deg, $v2-navy 0%, #334155 100%);
  border-radius: 16px;
  padding: 18px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(26, 54, 93, 0.3);
}

.vitals-bg-icon {
  position: absolute;
  top: 0;
  right: 0;
  padding: 12px;
  opacity: 0.08;
  color: white;
}

.vitals-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.vitals-label {
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.vitals-update-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.vitals-date {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 14px;
}

.vitals-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.vital-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.08);
  padding: 10px 12px;
  border-radius: 10px;

  .vital-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.pulse { background: linear-gradient(135deg, #ef4444, #dc2626); }
    &.pressure { background: linear-gradient(135deg, #ec4899, #db2777); }
    &.weight { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    &.temp { background: linear-gradient(135deg, #f97316, #ea580c); }
    &.sugar { background: linear-gradient(135deg, #0ea5e9, #0284c7); }

    svg {
      color: white;
    }
  }

  .vital-info {
    flex: 1;
  }

  .vital-name {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 2px;
  }

  .vital-value {
    font-size: 16px;
    font-weight: 700;
    color: white;
  }

  .vital-unit {
    font-size: 11px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.6);
  }
}

// Vitals Modal
.vitals-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.vitals-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);

  &__header {
    background: linear-gradient(135deg, $v2-sky 0%, $v2-sky-dark 100%);
    padding: 20px;
    border-radius: 16px 16px 0 0;
    position: relative;

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        color: white;
      }
    }

    .header-text {
      flex: 1;

      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: white;
      }

      p {
        margin: 2px 0 0;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.85);
      }
    }

    .close-btn {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      padding: 6px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }

      svg {
        color: white;
      }
    }
  }

  &__body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__footer {
    display: flex;
    gap: 10px;
    padding: 16px 20px;
    border-top: 1px solid #e2e8f0;

    .cancel-btn {
      flex: 1;
      padding: 12px;
      background: #f1f5f9;
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #e2e8f0;
      }
    }

    .save-btn {
      flex: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px;
      background: linear-gradient(135deg, $v2-sky 0%, $v2-sky-dark 100%);
      border: none;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba($v2-sky, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .loading-state {
        display: flex;
        align-items: center;
        gap: 6px;

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      }
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.vital-input-group {
  label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 8px;
  }

  .vital-icon-sm {
    width: 22px;
    height: 22px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.pulse { background: linear-gradient(135deg, #ef4444, #dc2626); }
    &.pressure { background: linear-gradient(135deg, #ec4899, #db2777); }
    &.weight { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    &.temp { background: linear-gradient(135deg, #f97316, #ea580c); }
    &.sugar { background: linear-gradient(135deg, #0ea5e9, #0284c7); }

    svg {
      color: white;
    }
  }

  .input-row {
    display: flex;
    align-items: center;
    gap: 8px;

    &.bp-row {
      .vital-input {
        width: 70px;
        text-align: center;
      }

      .bp-divider {
        font-size: 18px;
        font-weight: 600;
        color: #94a3b8;
      }
    }
  }

  .vital-input {
    flex: 1;
    padding: 10px 12px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: $v2-sky;
    }

    &::placeholder {
      color: #cbd5e1;
      font-weight: 400;
    }
  }

  .unit {
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    min-width: 45px;
  }

  .unit-select {
    padding: 10px 8px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    background: white;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: $v2-sky;
    }
  }
}

// Info Cards
.info-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0;
}

.card-link {
  font-size: 12px;
  color: $v2-sky;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.checkup-item {
  display: flex;
  gap: 12px;
}

.checkup-avatar {
  flex-shrink: 0;

  :deep(.avatar) {
    width: 44px !important;
    height: 44px !important;
    padding: 0;
    border: none;
  }
}

.checkup-info {
  flex: 1;
}

.checkup-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2px;
}

.checkup-subtitle {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.checkup-badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.badge {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 9999px;

  &.badge-success {
    background: #dcfce7;
    color: #15803d;
  }

  &.badge-gray {
    background: #e2e8f0;
    color: #475569;
  }
}

.no-data {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #94a3b8;

  svg {
    color: #cbd5e1;
  }
}

// AI Card
.ai-card {
  background: rgba($v2-sky-light, 0.4);
  border: 1px solid rgba($v2-sky, 0.2);
  border-radius: 16px;
  padding: 20px;
}

.ai-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.ai-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: $v2-sky;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 15px rgba(79, 195, 247, 0.3);
}

.ai-title {
  font-size: 14px;
  font-weight: 700;
  color: $v2-navy;
  margin: 0;
}

.ai-text {
  font-size: 12px;
  color: #475569;
  line-height: 1.6;
  margin: 0 0 12px;

  .highlight-dark {
    font-weight: 600;
    color: #1e293b;
  }

  .highlight-sky {
    font-weight: 600;
    color: $v2-sky-dark;
  }
}

.ai-btn {
  display: block;
  width: 100%;
  padding: 10px 16px;
  background: white;
  border: 1px solid rgba($v2-sky, 0.3);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  color: $v2-sky-dark;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: $v2-sky;
    color: white;
    border-color: $v2-sky;
  }
}

// Support Card
.support-card {
  background: $v2-orange-light;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.support-icon {
  color: $v2-orange-dark;
  margin-top: 2px;
  flex-shrink: 0;
}

.support-content {
  flex: 1;
}

.support-title {
  font-size: 12px;
  font-weight: 700;
  color: $v2-orange-dark;
  margin-bottom: 4px;
}

.support-text {
  font-size: 10px;
  color: #475569;
  margin: 0 0 8px;
  line-height: 1.5;
}

.support-link {
  font-size: 10px;
  font-weight: 700;
  color: $v2-navy;
  text-decoration: underline;
}
</style>
