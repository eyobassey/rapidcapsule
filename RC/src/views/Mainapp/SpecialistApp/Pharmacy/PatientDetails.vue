<template>
  <div class="page-content">
    <TopBar showButtons type="title-only" title="Pharmacy / Patient" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="patient-details-container">
        <!-- Skeleton Loading -->
        <template v-if="isLoading">
          <div class="skeleton-hero" />
          <div class="skeleton-card" />
          <div class="skeleton-card skeleton-card--sm" />
          <div class="skeleton-card" />
        </template>

        <template v-else>
          <!-- Hero Section with Patient Info -->
          <div class="hero-section">
            <div class="hero-content">
              <button class="hero-back" @click="router.push('/app/specialist/pharmacy/patients')">
                <v-icon name="hi-arrow-left" scale="0.75" />
                Patients
              </button>
              <div class="hero-patient">
                <RcAvatar
                  :model-value="patient.profile_image"
                  :first-name="getFirstName(patient.full_name)"
                  :last-name="getLastName(patient.full_name)"
                  size="lg"
                  class="hero-avatar"
                />
                <div class="hero-patient-info">
                  <h1 class="hero-title">{{ patient.full_name }}</h1>
                  <div class="hero-meta">
                    <span v-if="patient.gender" class="hero-meta-item">
                      <v-icon name="hi-user" scale="0.7" />
                      {{ patient.gender }}
                    </span>
                    <span v-if="patient.date_of_birth" class="hero-meta-item">
                      <v-icon name="hi-calendar" scale="0.7" />
                      {{ calculateAge(patient.date_of_birth) }}
                    </span>
                    <span v-if="patient.email" class="hero-meta-item">
                      <v-icon name="hi-mail" scale="0.7" />
                      {{ patient.email }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="hero-actions">
              <button class="hero-action-btn" @click="createPrescription">
                <v-icon name="hi-plus" scale="0.85" />
                New Prescription
              </button>
            </div>
          </div>

          <!-- Patient Contact Card -->
          <div class="contact-card">
            <div class="section-title">
              <v-icon name="hi-identification" scale="0.9" />
              <h2>Contact Information</h2>
            </div>
            <div class="contact-grid">
              <div class="contact-item">
                <div class="contact-item__icon">
                  <v-icon name="hi-mail" scale="0.8" />
                </div>
                <div class="contact-item__details">
                  <span class="label">Email</span>
                  <span class="value">{{ patient.email }}</span>
                </div>
              </div>
              <div class="contact-item">
                <div class="contact-item__icon">
                  <v-icon name="hi-phone" scale="0.8" />
                </div>
                <div class="contact-item__details">
                  <span class="label">Phone</span>
                  <span class="value">{{ patient.phone || 'Not provided' }}</span>
                </div>
              </div>
              <div class="contact-item">
                <div class="contact-item__icon">
                  <v-icon name="hi-calendar" scale="0.8" />
                </div>
                <div class="contact-item__details">
                  <span class="label">Date of Birth</span>
                  <span class="value">{{ formatDate(patient.date_of_birth) }}</span>
                </div>
              </div>
              <div class="contact-item">
                <div class="contact-item__icon">
                  <v-icon name="hi-user" scale="0.8" />
                </div>
                <div class="contact-item__details">
                  <span class="label">Gender</span>
                  <span class="value">{{ patient.gender || 'Not specified' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="tabs-card">
            <div class="tabs">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                :class="['tab', { active: activeTab === tab.id }]"
                @click="switchTab(tab.id)"
              >
                <v-icon :name="tab.icon" scale="0.8" />
                {{ tab.label }}
              </button>
            </div>
          </div>

          <!-- Tab Content -->
          <div class="tab-content">
            <PatientMedicalHistoryTab
              v-if="activeTab === 'medical-history'"
              :medical-history="medicalHistory"
            />

            <PatientPrescriptionsTab
              v-if="activeTab === 'prescriptions'"
              :prescriptions="prescriptions"
              :loading="loadingPrescriptions"
              @view-prescription="viewPrescription"
              @create-prescription="createPrescription"
            />

            <PatientVitalsTab
              v-if="activeTab === 'vitals'"
              :vitals="vitals"
              :loading="loadingVitals"
            />

            <PatientCheckupsTab
              v-if="activeTab === 'checkups'"
              :checkups="healthCheckups"
              :loading="loadingCheckups"
            />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import TopBar from '@/components/Navigation/top-bar';
import RcAvatar from '@/components/RCAvatar';
import apiFactory from '@/services/apiFactory';
import PatientMedicalHistoryTab from './components/PatientMedicalHistoryTab.vue';
import PatientPrescriptionsTab from './components/PatientPrescriptionsTab.vue';
import PatientVitalsTab from './components/PatientVitalsTab.vue';
import PatientCheckupsTab from './components/PatientCheckupsTab.vue';
import { usePharmacy } from './composables/usePharmacy';

const router = useRouter();
const route = useRoute();
const $toast = useToast();
const { formatDate, calculateAge } = usePharmacy();

const isLoading = ref(true);
const loadingPrescriptions = ref(false);
const loadingVitals = ref(false);
const loadingCheckups = ref(false);
const patient = ref({});
const medicalHistory = ref({});
const prescriptions = ref([]);
const vitals = ref([]);
const healthCheckups = ref([]);
const activeTab = ref('medical-history');

const tabs = [
  { id: 'medical-history', label: 'Medical History', icon: 'hi-clipboard-list' },
  { id: 'prescriptions', label: 'Prescriptions', icon: 'ri-capsule-line' },
  { id: 'vitals', label: 'Vitals', icon: 'hi-heart' },
  { id: 'checkups', label: 'Health Checkups', icon: 'hi-shield-check' },
];

const patientId = route.params.id;

function getFirstName(name) {
  if (!name) return '';
  return name.split(' ')[0] || '';
}

function getLastName(name) {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function switchTab(tabId) {
  activeTab.value = tabId;
  loadTabData(tabId);
}

function createPrescription() {
  router.push({
    path: '/app/specialist/pharmacy/prescriptions/create',
    query: { patient: patientId },
  });
}

function viewPrescription(id) {
  router.push(`/app/specialist/pharmacy/prescriptions/${id}`);
}

async function fetchPatientDetails() {
  try {
    isLoading.value = true;
    const response = await apiFactory.$_getPharmacyPatientDetails(patientId);
    const result = response.data?.data || response.data?.result;
    if (result) {
      patient.value = result;
    }
  } catch (error) {
    console.error('Error fetching patient details:', error);
    $toast.error('Failed to load patient details');
  } finally {
    isLoading.value = false;
  }
}

async function fetchMedicalHistory() {
  try {
    const response = await apiFactory.$_getPharmacyPatientMedicalHistory(patientId);
    const result = response.data?.data || response.data?.result;
    if (result) {
      medicalHistory.value = result;
    }
  } catch (error) {
    console.error('Error fetching medical history:', error);
  }
}

async function loadTabData(tab) {
  if (tab === 'prescriptions' && !prescriptions.value.length) {
    await fetchPrescriptions();
  } else if (tab === 'vitals' && !vitals.value.length) {
    await fetchVitals();
  } else if (tab === 'checkups' && !healthCheckups.value.length) {
    await fetchHealthCheckups();
  }
}

async function fetchPrescriptions() {
  try {
    loadingPrescriptions.value = true;
    const response = await apiFactory.$_getPharmacyPatientPrescriptions(patientId, { page: 1, limit: 20 });
    const result = response.data?.data || response.data?.result;
    if (result) {
      prescriptions.value = result.docs || [];
    }
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
  } finally {
    loadingPrescriptions.value = false;
  }
}

async function fetchVitals() {
  try {
    loadingVitals.value = true;
    const response = await apiFactory.$_getPharmacyPatientVitals(patientId);
    const result = response.data?.data || response.data?.result;
    if (result) {
      vitals.value = result || [];
    }
  } catch (error) {
    console.error('Error fetching vitals:', error);
  } finally {
    loadingVitals.value = false;
  }
}

async function fetchHealthCheckups() {
  try {
    loadingCheckups.value = true;
    const response = await apiFactory.$_getPharmacyPatientHealthCheckups(patientId, 5);
    const result = response.data?.data || response.data?.result;
    if (result) {
      healthCheckups.value = result || [];
    }
  } catch (error) {
    console.error('Error fetching health checkups:', error);
  } finally {
    loadingCheckups.value = false;
  }
}

onMounted(async () => {
  await fetchPatientDetails();
  await fetchMedicalHistory();
});
</script>

<style scoped lang="scss">
.page-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  padding: 0 128px;

  @include responsive(tab-portrait) {
    padding: 0;
  }

  @include responsive(phone) {
    padding: 0;
  }

  &__body {
    width: 100%;
    flex-grow: 1;
    padding: $size-24 $size-32;
    overflow-y: auto;

    @include responsive(phone) {
      padding: $size-16;
    }

    &::-webkit-scrollbar {
      display: none;
    }
  }
}

.patient-details-container {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: $size-20;
  padding-bottom: $size-32;
}

// Skeleton Hero
.skeleton-hero {
  border-radius: $size-20;
  height: 160px;
  background: linear-gradient(135deg, rgba(14, 174, 196, 0.15) 0%, rgba(14, 174, 196, 0.08) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;

  @include responsive(phone) {
    height: 200px;
    border-radius: $size-12;
  }
}

// Hero Section
.hero-section {
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: $size-20;
  padding: $size-24 $size-28;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(14, 174, 196, 0.25);
  color: white;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  @include responsive(tab-portrait) {
    flex-direction: column;
    align-items: flex-start;
    gap: $size-16;
    padding: $size-20;
    border-radius: $size-16;
  }

  @include responsive(phone) {
    padding: $size-16;
    border-radius: $size-12;
  }

  .hero-content {
    z-index: 1;
    flex: 1;

    .hero-back {
      display: inline-flex;
      align-items: center;
      gap: $size-4;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      font-size: $size-12;
      font-weight: $fw-medium;
      padding: $size-4 $size-10;
      border-radius: $size-8;
      cursor: pointer;
      margin-bottom: $size-14;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }

    .hero-patient {
      display: flex;
      align-items: center;
      gap: $size-16;

      @include responsive(phone) {
        flex-direction: column;
        align-items: flex-start;
        gap: $size-12;
      }
    }

    .hero-avatar {
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      flex-shrink: 0;
    }

    .hero-patient-info {
      .hero-title {
        font-size: $size-22;
        font-weight: $fw-bold;
        margin-bottom: $size-6;

        @include responsive(phone) {
          font-size: $size-18;
        }
      }

      .hero-meta {
        display: flex;
        align-items: center;
        gap: $size-14;
        flex-wrap: wrap;

        .hero-meta-item {
          display: flex;
          align-items: center;
          gap: $size-4;
          font-size: $size-13;
          opacity: 0.9;

          svg {
            opacity: 0.8;
          }
        }
      }
    }
  }

  .hero-actions {
    z-index: 1;

    .hero-action-btn {
      display: flex;
      align-items: center;
      gap: $size-8;
      padding: $size-10 $size-18;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      border-radius: $size-10;
      font-size: $size-13;
      font-weight: $fw-semi-bold;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

// Section Title Pattern
.section-title {
  display: flex;
  align-items: center;
  gap: $size-10;
  margin-bottom: $size-16;

  svg {
    color: #0EAEC4;
  }

  h2 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

// Skeleton Loading
.skeleton-card {
  border-radius: $size-16;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  height: 160px;

  &--sm { height: 56px; }
  &--lg { height: 220px; }
}


// Contact Card
.contact-card {
  background: $color-white;
  padding: $size-24;
  border-radius: $size-16;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  @include responsive(phone) {
    padding: $size-16;
  }
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-14;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.contact-item {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-12 $size-14;
  background: $color-g-97;
  border-radius: $size-10;

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: $size-8;
    background: rgba(#0EAEC4, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      color: #0EAEC4;
    }
  }

  &__details {
    display: flex;
    flex-direction: column;
    gap: $size-2;
    min-width: 0;

    .label {
      font-size: $size-11;
      color: $color-g-54;
      font-weight: $fw-medium;
    }

    .value {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

// Tabs
.tabs-card {
  background: $color-white;
  border-radius: $size-16;
  padding: $size-6;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.tabs {
  display: flex;
  gap: $size-4;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
}

.tab {
  display: flex;
  align-items: center;
  gap: $size-6;
  padding: $size-10 $size-16;
  border: none;
  background: none;
  font-size: $size-13;
  font-weight: $fw-medium;
  color: $color-g-54;
  cursor: pointer;
  white-space: nowrap;
  border-radius: $size-10;
  transition: all 0.2s ease;

  &:hover {
    color: $color-g-36;
    background: $color-g-97;
  }

  &.active {
    color: #0EAEC4;
    background: rgba(14, 174, 196, 0.1);
    font-weight: $fw-semi-bold;
  }
}

.tab-content {
  min-height: 300px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
