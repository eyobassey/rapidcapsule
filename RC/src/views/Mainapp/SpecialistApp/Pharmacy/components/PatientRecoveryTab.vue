<template>
  <div class="recovery-tab">
    <!-- Header -->
    <div class="recovery-tab__header">
      <div class="recovery-tab__title-row">
        <span class="recovery-tab__count">{{ hasProfile ? 'Active' : 'Inactive' }}</span>
        <span class="recovery-tab__label">Recovery Profile</span>
      </div>
    </div>

    <!-- No Recovery Profile -->
    <div v-if="!loading && !hasProfile" class="empty-state">
      <div class="empty-state__visual">
        <div class="empty-orb">
          <div class="empty-ring empty-ring--1" />
          <div class="empty-ring empty-ring--2" />
          <div class="empty-center">
            <v-icon name="gi-medicine-pills" scale="2" />
          </div>
        </div>
      </div>
      <div class="empty-state__content">
        <h3>No Recovery Profile</h3>
        <p>This patient does not have an active recovery profile yet</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="loading-state">
      <div class="loading-spinner" />
      <span>Loading recovery data...</span>
    </div>

    <!-- Recovery Content -->
    <template v-else>
      <!-- Sub-tabs -->
      <div class="recovery-tab__nav">
        <button
          v-for="tab in subTabs"
          :key="tab.id"
          :class="['sub-tab', { active: activeSubTab === tab.id }]"
          @click="activeSubTab = tab.id"
        >
          <v-icon :name="tab.icon" scale="0.75" />
          <span>{{ tab.label }}</span>
          <span v-if="tab.count != null" class="sub-tab__count">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Sub-tab Content -->
      <div class="recovery-tab__content">
        <RecoveryOverview
          v-if="activeSubTab === 'overview'"
          :data="recoveryData"
        />

        <RecoveryCheckins
          v-if="activeSubTab === 'checkins'"
          :patient-id="patientId"
        />

        <RecoveryScreenings
          v-if="activeSubTab === 'screenings'"
          :patient-id="patientId"
        />

        <RecoveryExercises
          v-if="activeSubTab === 'exercises'"
          :patient-id="patientId"
        />

        <RecoveryRiskReports
          v-if="activeSubTab === 'risk-reports'"
          :patient-id="patientId"
        />

        <RecoveryMilestones
          v-if="activeSubTab === 'milestones'"
          :patient-id="patientId"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';
import RecoveryOverview from './recovery/RecoveryOverview.vue';
import RecoveryCheckins from './recovery/RecoveryCheckins.vue';
import RecoveryScreenings from './recovery/RecoveryScreenings.vue';
import RecoveryExercises from './recovery/RecoveryExercises.vue';
import RecoveryRiskReports from './recovery/RecoveryRiskReports.vue';
import RecoveryMilestones from './recovery/RecoveryMilestones.vue';

const props = defineProps({
  patientId: { type: String, required: true },
});

const $toast = useToast();
const loading = ref(false);
const recoveryData = ref(null);
const hasProfile = ref(false);
const activeSubTab = ref('overview');

const subTabs = computed(() => [
  { id: 'overview', label: 'Overview', icon: 'hi-view-grid', count: null },
  { id: 'checkins', label: 'Check-ins', icon: 'hi-clipboard-check', count: recoveryData.value?.counts?.screenings != null ? null : null },
  { id: 'screenings', label: 'Screenings', icon: 'hi-document-report', count: recoveryData.value?.counts?.screenings },
  { id: 'exercises', label: 'Exercises', icon: 'hi-sparkles', count: recoveryData.value?.counts?.exercises },
  { id: 'risk-reports', label: 'Risk Reports', icon: 'hi-shield-exclamation', count: recoveryData.value?.counts?.risk_assessments },
  { id: 'milestones', label: 'Milestones', icon: 'hi-star', count: recoveryData.value?.counts?.milestones },
]);

onMounted(() => fetchRecoveryData());

watch(() => props.patientId, () => {
  activeSubTab.value = 'overview';
  fetchRecoveryData();
});

async function fetchRecoveryData() {
  loading.value = true;
  try {
    const response = await apiFactory.$_getPatientRecoveryData(props.patientId);
    const result = response.data?.data || response.data?.result || response.data;
    if (result?.has_recovery_profile === false) {
      hasProfile.value = false;
      recoveryData.value = null;
    } else {
      hasProfile.value = true;
      recoveryData.value = result;
    }
  } catch (error) {
    console.error('Error fetching recovery data:', error);
    $toast.error('Failed to load recovery data');
    hasProfile.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$rose: #F43F5E;

.recovery-tab {
  min-height: 200px;
}

.recovery-tab__header {
  margin-bottom: 20px;
}

.recovery-tab__title-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.recovery-tab__count {
  font-size: 28px;
  font-weight: 700;
  color: $sky-dark;
}

.recovery-tab__label {
  font-size: 14px;
  color: $color-g-54;
  font-weight: 500;
}

// Sub-tabs Navigation
.recovery-tab__nav {
  display: flex;
  gap: 6px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 14px;
  margin-bottom: 24px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar { display: none; }
}

.sub-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: $color-g-54;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: rgba($sky, 0.08);
    color: $sky-dark;
  }

  &.active {
    background: linear-gradient(135deg, $sky-dark 0%, $sky-darker 100%);
    color: white;
    box-shadow: 0 4px 12px rgba($sky-dark, 0.3);
  }

  &__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
    background: rgba(0, 0, 0, 0.1);
  }

  &.active &__count {
    background: rgba(255, 255, 255, 0.25);
  }
}

.recovery-tab__content {
  min-height: 200px;
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;

  span {
    font-size: 14px;
    color: $color-g-54;
  }
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border: 3px solid rgba($sky, 0.2);
  border-top-color: $sky-dark;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;

  &__visual {
    margin-bottom: 24px;
  }

  &__content {
    h3 {
      font-size: 18px;
      font-weight: 700;
      color: $color-g-21;
      margin-bottom: 8px;
    }
    p {
      font-size: 14px;
      color: $color-g-54;
    }
  }
}

.empty-orb {
  position: relative;
  width: 100px;
  height: 100px;
}

.empty-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba($sky, 0.25);

  &--1 {
    inset: 0;
    animation: spin-slow 20s linear infinite;
  }
  &--2 {
    inset: 12px;
    border-style: dashed;
    animation: spin-slow 15s linear infinite reverse;
  }
}

.empty-center {
  position: absolute;
  inset: 24px;
  background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sky-dark;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
