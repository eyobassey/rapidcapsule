<template>
  <div class="patient-details-page">
    <!-- Ambient Background -->
    <div class="ambient-bg">
      <div class="orb orb--1" />
      <div class="orb orb--2" />
      <div class="orb orb--3" />
    </div>

    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="back-btn" @click="router.push('/app/specialist/pharmacy/patients')">
        <v-icon name="hi-arrow-left" scale="1.1" />
      </button>
      <h1 class="mobile-title">Patient</h1>
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.1" />
      </button>
    </header>

    <!-- Page Container -->
    <div class="page-container">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs">
        <router-link to="/app/specialist" class="breadcrumb-item">
          <v-icon name="hi-home" scale="0.7" />
          Home
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <router-link to="/app/specialist/pharmacy" class="breadcrumb-item">
          Pharmacy
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <router-link to="/app/specialist/pharmacy/patients" class="breadcrumb-item">
          Patients
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">{{ patient.full_name || 'Patient' }}</span>
      </nav>

      <div class="patient-details-container">
        <!-- Skeleton Loading -->
        <template v-if="isLoading">
          <div class="skeleton-hero" />
          <div class="skeleton-card" />
          <div class="skeleton-card skeleton-card--sm" />
          <div class="skeleton-card" />
        </template>

        <template v-else>
          <!-- Hero Section -->
          <section class="hero">
            <div class="hero__content">
              <button class="back-link desktop-only" @click="router.push('/app/specialist/pharmacy/patients')">
                <v-icon name="hi-arrow-left" scale="0.8" />
                <span>Back to Patients</span>
              </button>
              <div class="hero__badge">
                <div class="badge-pulse"></div>
                <v-icon name="hi-user-circle" />
                <span>Patient Profile</span>
              </div>
              <h1 class="hero__title">
                {{ getFirstName(patient.full_name) }}<br/>
                <span class="hero__title-accent">{{ getLastName(patient.full_name) }}</span>
              </h1>
              <div class="hero__meta">
                <span v-if="patient.gender" class="meta-item">
                  <v-icon :name="patient.gender === 'Male' ? 'io-male' : 'io-female'" scale="0.75" />
                  {{ patient.gender }}
                </span>
                <span v-if="patient.date_of_birth" class="meta-item">
                  <v-icon name="hi-calendar" scale="0.75" />
                  {{ calculateAge(patient.date_of_birth) }} years
                </span>
              </div>
              <div class="hero__stats">
                <div class="hero-stat">
                  <span class="hero-stat__value">{{ prescriptionsTotal || 0 }}</span>
                  <span class="hero-stat__label">Prescriptions</span>
                </div>
                <div class="hero-stat">
                  <span class="hero-stat__value">{{ appointmentsTotal || 0 }}</span>
                  <span class="hero-stat__label">Appointments</span>
                </div>
                <div class="hero-stat">
                  <span class="hero-stat__value">{{ checkupsTotal || 0 }}</span>
                  <span class="hero-stat__label">Checkups</span>
                </div>
              </div>
            </div>
            <div class="hero__visual">
              <div class="patient-orb">
                <div class="orb-glow"></div>
                <div class="orb-ring orb-ring--1"></div>
                <div class="orb-ring orb-ring--2"></div>
                <div class="orb-center">
                  <RcAvatar
                    :model-value="patient.profile_image"
                    :first-name="getFirstName(patient.full_name)"
                    :last-name="getLastName(patient.full_name)"
                    size="lg"
                    class="orb-avatar"
                  />
                </div>
              </div>
              <button class="prescribe-fab" @click="createPrescription">
                <v-icon name="hi-plus" scale="1.2" />
                <span>Prescribe</span>
              </button>
            </div>
          </section>

          <!-- Bento Grid Section -->
          <div class="bento-grid">
            <!-- Contact Card - Spans 2 columns -->
            <div class="bento-card bento-card--contact">
              <div class="bento-card__header">
                <div class="bento-card__icon bento-card__icon--sky">
                  <v-icon name="hi-identification" scale="0.9" />
                </div>
                <div class="bento-card__title">
                  <h3>Contact Information</h3>
                  <p>Patient contact details</p>
                </div>
              </div>
              <div class="contact-details-grid">
                <div class="contact-detail">
                  <div class="contact-detail__indicator contact-detail__indicator--sky" />
                  <div class="contact-detail__content">
                    <span class="contact-detail__label">Email Address</span>
                    <span class="contact-detail__value">{{ patient.email }}</span>
                  </div>
                  <button class="contact-detail__action" @click="copyToClipboard(patient.email)">
                    <v-icon name="hi-clipboard-copy" scale="0.7" />
                  </button>
                </div>
                <div class="contact-detail">
                  <div class="contact-detail__indicator contact-detail__indicator--emerald" />
                  <div class="contact-detail__content">
                    <span class="contact-detail__label">Phone Number</span>
                    <span class="contact-detail__value">{{ patient.phone || 'Not provided' }}</span>
                  </div>
                  <a v-if="patient.phone" :href="`tel:${patient.phone}`" class="contact-detail__action">
                    <v-icon name="hi-phone" scale="0.7" />
                  </a>
                </div>
              </div>
            </div>

            <!-- Quick Info Cards -->
            <div class="bento-card bento-card--info">
              <div class="info-card-inner info-card--violet">
                <div class="info-card__icon">
                  <v-icon name="hi-calendar" scale="1" />
                </div>
                <div class="info-card__content">
                  <span class="info-card__label">Date of Birth</span>
                  <span class="info-card__value">{{ formatDate(patient.date_of_birth) }}</span>
                  <span class="info-card__sub">{{ calculateAge(patient.date_of_birth) }} years old</span>
                </div>
              </div>
            </div>

            <div class="bento-card bento-card--info">
              <div class="info-card-inner info-card--amber">
                <div class="info-card__icon">
                  <v-icon :name="patient.gender === 'Male' ? 'io-male' : 'io-female'" scale="1" />
                </div>
                <div class="info-card__content">
                  <span class="info-card__label">Gender</span>
                  <span class="info-card__value">{{ patient.gender || 'Not specified' }}</span>
                </div>
              </div>
            </div>

            <!-- Health Scores Card -->
            <div class="bento-card bento-card--scores">
              <div class="scores-card">
                <div class="scores-card__header">
                  <div class="scores-card__icon">
                    <v-icon name="hi-heart" scale="1" />
                  </div>
                  <div class="scores-card__title">
                    <h4>Health Scores</h4>
                    <span>Patient wellness metrics</span>
                  </div>
                </div>
                <div class="scores-card__content">
                  <div class="score-pill" :class="getScoreClass(healthScores.basic?.score)">
                    <div class="score-pill__ring" :style="getScoreRingStyle(healthScores.basic?.score)" />
                    <div class="score-pill__inner">
                      <span class="score-pill__label">Basic</span>
                      <span class="score-pill__value">{{ healthScores.basic?.score ?? '--' }}</span>
                    </div>
                  </div>
                  <div class="score-pill" :class="getScoreClass(healthScores.advanced?.overall_score)">
                    <div class="score-pill__ring" :style="getScoreRingStyle(healthScores.advanced?.overall_score)" />
                    <div class="score-pill__inner">
                      <span class="score-pill__label">Advanced</span>
                      <span class="score-pill__value">{{ healthScores.advanced?.overall_score ?? '--' }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="healthScores.basic_history?.length > 1" class="scores-card__trend">
                  <v-icon :name="getScoreTrendIcon()" scale="0.6" />
                  <span>{{ getScoreTrendLabel() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="quick-actions">
            <div class="actions-group primary-actions">
              <button class="action-btn primary" @click="bookAppointment">
                <v-icon name="hi-calendar" scale="1" />
                <span>Book Appointment</span>
              </button>
              <button class="action-btn" @click="createPrescription">
                <v-icon name="ri-capsule-fill" scale="1" />
                <span>Write Prescription</span>
              </button>
              <button class="action-btn" @click="addClinicalNote()">
                <v-icon name="hi-document-text" scale="1" />
                <span>Add Clinical Note</span>
              </button>
            </div>
            <div class="actions-group contact-actions">
              <button
                v-if="patientPhone"
                class="contact-btn call"
                @click="callPatient"
                title="Call Patient"
              >
                <v-icon name="hi-phone" scale="1" />
              </button>
              <button
                v-if="patientEmail"
                class="contact-btn email"
                @click="emailPatient"
                title="Send Email"
              >
                <v-icon name="hi-mail" scale="1" />
              </button>
              <button
                class="contact-btn star"
                :class="{ starred: isStarred }"
                @click="toggleStar"
                :title="isStarred ? 'Unstar Patient' : 'Star Patient'"
              >
                <v-icon :name="isStarred ? 'hi-solid-star' : 'hi-star'" scale="1" />
              </button>
            </div>
          </div>

          <!-- Premium Tabs Section -->
          <div class="tabs-section">
            <div class="tabs-container">
              <div class="tabs-header">
                <h3>Patient Records</h3>
                <p>View medical history, prescriptions, vitals, and checkups</p>
              </div>
              <div class="tabs-nav">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  :class="['tab-button', { active: activeTab === tab.id }]"
                  @click="switchTab(tab.id)"
                >
                  <div class="tab-button__icon">
                    <v-icon :name="tab.icon" scale="0.85" />
                  </div>
                  <span class="tab-button__label">{{ tab.label }}</span>
                  <span v-if="getTabCount(tab.id)" class="tab-button__count">{{ getTabCount(tab.id) }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Tab Content -->
          <div class="tab-content glass-card">
            <PatientMedicalHistoryTab
              v-if="activeTab === 'medical-history'"
              :medical-history="medicalHistory"
            />

            <PatientPrescriptionsTab
              v-if="activeTab === 'prescriptions'"
              :patient-id="patientId"
              @view-prescription="viewPrescription"
              @create-prescription="createPrescription"
            />

            <PatientVitalsTab
              v-if="activeTab === 'vitals'"
              :vitals="vitals"
              :loading="loadingVitals"
              @view-vital-history="openVitalHistoryModal"
            />

            <PatientCheckupsTab
              v-if="activeTab === 'checkups'"
              :patient-id="patientId"
            />

            <PatientAppointmentsTab
              v-if="activeTab === 'appointments'"
              :patient-id="patientId"
              @add-clinical-note="addClinicalNote"
            />

            <PatientTimelineTab
              v-if="activeTab === 'timeline'"
              :patient-id="patientId"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- Vital History Modal -->
    <VitalHistoryModal
      :is-open="isVitalHistoryModalOpen"
      :vital-type="selectedVitalType"
      :patient-id="patientId"
      @close="closeVitalHistoryModal"
    />

    <!-- Clinical Note Modal -->
    <ClinicalNoteModal
      :is-open="showClinicalNoteModal"
      :appointment="selectedAppointmentForNote"
      :existing-note="editingClinicalNote"
      @close="closeClinicalNoteModal"
      @saved="handleClinicalNoteSaved"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import RcAvatar from '@/components/RCAvatar';
import apiFactory from '@/services/apiFactory';
import PatientMedicalHistoryTab from './components/PatientMedicalHistoryTab.vue';
import PatientPrescriptionsTab from './components/PatientPrescriptionsTab.vue';
import PatientVitalsTab from './components/PatientVitalsTab.vue';
import PatientCheckupsTab from './components/PatientCheckupsTab.vue';
import PatientAppointmentsTab from './components/PatientAppointmentsTab.vue';
import PatientTimelineTab from './components/PatientTimelineTab.vue';
import VitalHistoryModal from './components/VitalHistoryModal.vue';
import ClinicalNoteModal from '@/views/Mainapp/SpecialistApp/SpecialistAppointments/modals/ClinicalNoteModal.vue';
import { usePharmacy } from './composables/usePharmacy';

const router = useRouter();
const route = useRoute();
const $toast = useToast();
const { formatDate, calculateAge } = usePharmacy();

const isLoading = ref(true);
const loadingVitals = ref(false);
const patient = ref({});
const medicalHistory = ref({});
const vitals = ref([]);
const prescriptionsTotal = ref(0);
const checkupsTotal = ref(0);
const appointmentsTotal = ref(0);
const healthScores = ref({});
const activeTab = ref('medical-history');
const isVitalHistoryModalOpen = ref(false);
const selectedVitalType = ref('');

// Star/Favorite functionality
const isStarred = ref(false);

// Clinical Note Modal
const showClinicalNoteModal = ref(false);
const selectedAppointmentForNote = ref(null);
const editingClinicalNote = ref(null);

// Timeline & Dependents
const timelineData = ref({ items: [], pagination: null });
const dependents = ref([]);

const tabs = [
  { id: 'medical-history', label: 'Medical History', icon: 'hi-clipboard-list' },
  { id: 'prescriptions', label: 'Prescriptions', icon: 'ri-capsule-line' },
  { id: 'vitals', label: 'Vitals', icon: 'hi-heart' },
  { id: 'checkups', label: 'Health Checkups', icon: 'hi-shield-check' },
  { id: 'appointments', label: 'Appointments', icon: 'hi-calendar' },
  { id: 'timeline', label: 'Timeline', icon: 'hi-clock' },
];

// Computed
const patientPhone = computed(() => {
  const phone = patient.value?.phone || patient.value?.profile?.phone_number;
  if (phone?.number) {
    let countryCode = phone.country_code || '';
    if (countryCode && !countryCode.startsWith('+')) {
      countryCode = '+' + countryCode;
    }
    return countryCode ? `${countryCode}${phone.number}` : phone.number;
  }
  return phone || '';
});

const patientEmail = computed(() => {
  return patient.value?.email || patient.value?.profile?.contact?.email || '';
});

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

function getTabCount(tabId) {
  switch (tabId) {
    case 'prescriptions':
      return prescriptionsTotal.value || null;
    case 'vitals':
      return vitals.value.length || null;
    case 'checkups':
      return checkupsTotal.value || null;
    case 'appointments':
      return appointmentsTotal.value || null;
    case 'timeline':
      return timelineData.value.pagination?.total || timelineData.value.items?.length || null;
    default:
      return null;
  }
}

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard.writeText(text);
  $toast.success('Copied to clipboard');
}

function getScoreClass(score) {
  if (!score && score !== 0) return 'score--unknown';
  if (score >= 80) return 'score--excellent';
  if (score >= 60) return 'score--good';
  if (score >= 40) return 'score--fair';
  return 'score--poor';
}

function getScoreRingStyle(score) {
  if (!score && score !== 0) return { '--progress': '0%' };
  return { '--progress': `${score}%` };
}

function getScoreTrendIcon() {
  const history = healthScores.value.basic_history || [];
  if (history.length < 2) return 'hi-minus';
  const latest = history[0]?.score || 0;
  const previous = history[1]?.score || 0;
  if (latest > previous) return 'hi-trending-up';
  if (latest < previous) return 'hi-trending-down';
  return 'hi-minus';
}

function getScoreTrendLabel() {
  const history = healthScores.value.basic_history || [];
  if (history.length < 2) return 'No trend data';
  const latest = history[0]?.score || 0;
  const previous = history[1]?.score || 0;
  const diff = latest - previous;
  if (diff > 0) return `+${diff} from last`;
  if (diff < 0) return `${diff} from last`;
  return 'Stable';
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

function openVitalHistoryModal(vitalType) {
  selectedVitalType.value = vitalType;
  isVitalHistoryModalOpen.value = true;
}

function closeVitalHistoryModal() {
  isVitalHistoryModalOpen.value = false;
  selectedVitalType.value = '';
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
  // Only vitals still uses props - other tabs manage their own data
  if (tab === 'vitals' && !vitals.value.length) {
    await fetchVitals();
  }
  // Timeline is handled by its own component
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

async function fetchPrescriptionsCount() {
  try {
    const response = await apiFactory.$_getPharmacyPatientPrescriptions(patientId, { page: 1, limit: 1 });
    const result = response.data?.data || response.data?.result;
    if (result) {
      prescriptionsTotal.value = result.total || 0;
    }
  } catch (error) {
    console.error('Error fetching prescriptions count:', error);
  }
}

async function fetchCheckupsCount() {
  try {
    const response = await apiFactory.$_getPharmacyPatientHealthCheckups(patientId, { page: 1, limit: 1 });
    const result = response.data?.data || response.data?.result;
    if (result) {
      checkupsTotal.value = result.total || 0;
    }
  } catch (error) {
    console.error('Error fetching checkups count:', error);
  }
}

async function fetchAppointmentsCount() {
  try {
    // Just fetch page 1 with limit 1 to get the total count for hero stats
    const response = await apiFactory.$_getPharmacyPatientAppointments(patientId, { page: 1, limit: 1 });
    const result = response.data?.data || response.data?.result;
    if (result) {
      appointmentsTotal.value = result.total || 0;
    }
  } catch (error) {
    console.error('Error fetching appointments count:', error);
  }
}

async function fetchHealthScores() {
  try {
    const response = await apiFactory.$_getPharmacyPatientHealthScores(patientId);
    const result = response.data?.data || response.data?.result;
    if (result) {
      healthScores.value = result;
    }
  } catch (error) {
    console.error('Error fetching health scores:', error);
  }
}

// Star/Favorite Toggle
async function toggleStar() {
  if (!patient.value) return;
  try {
    const newStarred = !isStarred.value;
    await apiFactory.$_togglePatientStar(patientId, { starred: newStarred });
    isStarred.value = newStarred;
    $toast.success(newStarred ? 'Patient starred' : 'Patient unstarred');
  } catch (error) {
    console.error('Error toggling star:', error);
    $toast.error('Failed to update star status');
  }
}

// Quick Actions
function bookAppointment() {
  router.push({
    path: '/app/specialist/specialist-appointments',
    query: { patientId: patientId },
  });
}

function addClinicalNote(apt = null) {
  selectedAppointmentForNote.value = apt;
  if (apt?.clinical_notes?.length > 0) {
    editingClinicalNote.value = apt.clinical_notes[0];
  } else {
    editingClinicalNote.value = null;
  }
  showClinicalNoteModal.value = true;
}

function closeClinicalNoteModal() {
  showClinicalNoteModal.value = false;
  selectedAppointmentForNote.value = null;
  editingClinicalNote.value = null;
}

function handleClinicalNoteSaved() {
  showClinicalNoteModal.value = false;
  selectedAppointmentForNote.value = null;
  editingClinicalNote.value = null;
  $toast.success('Clinical note saved successfully');
}

function callPatient() {
  if (patientPhone.value) {
    window.open(`tel:${patientPhone.value.replace(/\s/g, '')}`, '_self');
  }
}

function emailPatient() {
  if (patientEmail.value) {
    window.open(`mailto:${patientEmail.value}?subject=Regarding your healthcare`, '_blank');
  }
}

// Timeline
async function fetchTimelineData(page = 1) {
  try {
    const response = await apiFactory.$_getSpecialistPatientTimeline(patientId, { page, limit: 20 });
    const data = response.data?.data || response.data;
    timelineData.value = {
      items: data.timeline || data.items || [],
      pagination: data.pagination || null,
    };
  } catch (error) {
    console.error('Error fetching timeline:', error);
  }
}

function formatEventType(type) {
  const types = {
    appointment: 'Appointment',
    prescription: 'Prescription',
    health_checkup: 'Health Checkup',
    pharmacy_order: 'Pharmacy Order',
    purchase: 'Purchase',
    vital: 'Vital Recorded',
  };
  return types[type] || type;
}

function getTimelineIcon(type) {
  const icons = {
    appointment: 'hi-calendar',
    prescription: 'ri-capsule-line',
    health_checkup: 'hi-clipboard-check',
    pharmacy_order: 'hi-shopping-bag',
    purchase: 'hi-shopping-cart',
    vital: 'hi-heart',
  };
  return icons[type] || 'hi-clock';
}

function getTimelineDescription(event) {
  const { type, data } = event;
  switch (type) {
    case 'appointment':
      return `${data?.appointmentType || 'Consultation'} appointment - ${data?.status || 'Scheduled'}`;
    case 'prescription':
      return `Prescription with ${data?.medicationCount || 0} medication(s) - ${data?.status || 'Created'}`;
    case 'health_checkup':
      return `AI Health checkup completed${data?.triageLevel ? ` - ${data.triageLevel} triage` : ''}`;
    case 'pharmacy_order':
      return `Pharmacy order placed - ${data?.itemCount || 0} item(s)`;
    default:
      return 'Activity recorded';
  }
}

onMounted(async () => {
  await fetchPatientDetails();
  await Promise.all([
    fetchMedicalHistory(),
    fetchHealthScores(),
    fetchAppointmentsCount(),
    fetchPrescriptionsCount(),
    fetchCheckupsCount(),
  ]);
});
</script>

<style scoped lang="scss">
// Design System Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$violet: #8B5CF6;
$violet-light: #EDE9FE;
$rose: #F43F5E;
$rose-light: #FFE4E6;

// Base Layout
.patient-details-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  overflow-x: hidden;
}

// Ambient Background
.ambient-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;

  &--1 {
    width: 400px;
    height: 400px;
    background: $sky-light;
    top: -100px;
    right: -100px;
  }

  &--2 {
    width: 300px;
    height: 300px;
    background: rgba($violet, 0.15);
    bottom: 20%;
    left: -80px;
    animation-delay: -7s;
  }

  &--3 {
    width: 250px;
    height: 250px;
    background: rgba($emerald, 0.12);
    top: 50%;
    right: 15%;
    animation-delay: -14s;
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.05); }
  50% { transform: translate(-10px, 15px) scale(0.95); }
  75% { transform: translate(15px, 10px) scale(1.02); }
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: $size-12 $size-16;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  align-items: center;
  justify-content: space-between;

  @include responsive(tab-portrait) {
    display: flex;
  }

  .back-btn, .menu-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    border-radius: $size-10;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-g-36;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($sky, 0.1);
      color: $sky-dark;
    }
  }

  .mobile-title {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

// Page Container
.page-container {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 100px;
  }
}

// Breadcrumbs
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: $size-8;
  margin-bottom: $size-20;
  font-size: $size-13;

  @include responsive(tab-portrait) {
    display: none;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: $size-4;
    color: $color-g-54;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: $sky-dark;
    }
  }

  .breadcrumb-separator {
    color: $color-g-67;
  }

  .breadcrumb-current {
    color: $color-g-21;
    font-weight: $fw-medium;
  }
}

.patient-details-container {
  display: flex;
  flex-direction: column;
  gap: $size-20;
}

// Hero Section
.hero {
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 32px;
  padding: 48px 56px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 48px;
  align-items: center;
  min-height: 320px;
  box-shadow:
    0 25px 80px rgba($sky-dark, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  &::before {
    content: '';
    position: absolute;
    top: -60%;
    right: -20%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 36px 32px;
    min-height: auto;
  }

  @media (max-width: 768px) {
    padding: 28px 24px;
    border-radius: 24px;
  }
}

.hero__content {
  position: relative;
  z-index: 2;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateX(-4px);
  }

  &.desktop-only {
    @media (max-width: 768px) {
      display: none;
    }
  }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;

  .badge-pulse {
    width: 8px;
    height: 8px;
    background: #4ade80;
    border-radius: 50%;
    animation: pulse-glow 2s ease-in-out infinite;
  }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
}

.hero__title {
  font-size: 52px;
  font-weight: 800;
  color: white;
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin-bottom: 16px;

  @media (max-width: 1024px) {
    font-size: 40px;
  }

  @media (max-width: 768px) {
    font-size: 32px;
  }
}

.hero__title-accent {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__meta {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    background: rgba(255, 255, 255, 0.1);
    padding: 6px 12px;
    border-radius: 8px;
  }
}

.hero__stats {
  display: flex;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 12px;
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &__value {
    font-size: 26px;
    font-weight: 700;
    color: white;
    line-height: 1.1;

    @media (max-width: 768px) {
      font-size: 20px;
    }
  }

  &__label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
  }
}

.hero__visual {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;

  @media (max-width: 1024px) {
    display: none;
  }
}

.patient-orb {
  position: relative;
  width: 160px;
  height: 160px;
}

.orb-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 0.4; }
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

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

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.orb-center {
  position: absolute;
  inset: 28px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.orb-avatar {
  border: 3px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}

.prescribe-fab {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 28px;
  padding: 12px 24px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.2); opacity: 0; }
}

// Glass Card
.glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
}

// Bento Grid
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.bento-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  &--contact {
    grid-column: span 2;
    padding: 24px;

    @media (max-width: 768px) {
      grid-column: span 1;
    }
  }

  &--info {
    padding: 0;
    overflow: hidden;
  }

  &--alert {
    grid-column: span 2;
    padding: 0;
    border: 1px solid rgba(#ef4444, 0.2);
    background: rgba(#fef2f2, 0.8);

    @media (max-width: 1200px) {
      grid-column: span 2;
    }

    @media (max-width: 768px) {
      grid-column: span 1;
    }
  }

  &--safe {
    grid-column: span 2;
    padding: 20px;
    border: 1px solid rgba($emerald, 0.15);
    background: rgba(#ecfdf5, 0.8);

    @media (max-width: 1200px) {
      grid-column: span 2;
    }

    @media (max-width: 768px) {
      grid-column: span 1;
    }
  }

  &__header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 20px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &--sky {
      background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
      color: $sky-dark;
    }
  }

  &__title {
    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: 2px;
    }

    p {
      font-size: 12px;
      color: $color-g-54;
    }
  }
}

.contact-details-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-detail {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  border: 1px solid rgba($color-g-92, 0.5);

  &__indicator {
    width: 4px;
    height: 32px;
    border-radius: 4px;
    flex-shrink: 0;

    &--sky { background: linear-gradient(180deg, $sky 0%, $sky-dark 100%); }
    &--emerald { background: linear-gradient(180deg, $emerald 0%, darken($emerald, 10%) 100%); }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__label {
    display: block;
    font-size: 11px;
    color: $color-g-54;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 3px;
  }

  &__value {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: $color-g-21;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__action {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: rgba($sky, 0.08);
    color: $sky-dark;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
    text-decoration: none;

    &:hover {
      background: rgba($sky, 0.15);
      transform: scale(1.05);
    }
  }
}

// Info Cards
.info-card-inner {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -30%;
    right: -30%;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    opacity: 0.1;
  }

  &.info-card--violet {
    background: linear-gradient(135deg, rgba($violet, 0.04) 0%, rgba($violet, 0.08) 100%);
    &::before { background: $violet; }
    .info-card__icon { background: rgba($violet, 0.12); color: $violet; }
  }

  &.info-card--amber {
    background: linear-gradient(135deg, rgba($amber, 0.04) 0%, rgba($amber, 0.08) 100%);
    &::before { background: $amber; }
    .info-card__icon { background: rgba($amber, 0.12); color: $amber; }
  }
}

.info-card__icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}

.info-card__content {
  position: relative;
  z-index: 1;
}

.info-card__label {
  display: block;
  font-size: 11px;
  color: $color-g-54;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
}

.info-card__value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: $color-g-21;
}

.info-card__sub {
  display: block;
  font-size: 12px;
  color: $color-g-54;
  margin-top: 4px;
}

// Alert Card (Allergies)
.alert-card {
  padding: 20px;

  &__header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(#ef4444, 0.15);
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse-alert 2s ease-in-out infinite;
  }

  &__title {
    h4 {
      font-size: 15px;
      font-weight: 600;
      color: #dc2626;
      margin-bottom: 2px;
    }

    span {
      font-size: 12px;
      color: #b91c1c;
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

@keyframes pulse-alert {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.alert-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  background: rgba(#ef4444, 0.1);
  border: 1px solid rgba(#ef4444, 0.2);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: #dc2626;
}

// Safe Card (No Allergies)
.safe-card {
  display: flex;
  align-items: center;
  gap: 14px;

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba($emerald, 0.12);
    color: $emerald;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__content {
    h4 {
      font-size: 15px;
      font-weight: 600;
      color: #059669;
      margin-bottom: 2px;
    }

    p {
      font-size: 13px;
      color: #047857;
    }
  }
}

// Health Scores Card
.bento-card--scores {
  grid-column: span 2;
  padding: 0;
  background: linear-gradient(135deg, rgba($emerald, 0.03) 0%, rgba($sky, 0.05) 100%);
  border: 1px solid rgba($emerald, 0.15);

  @media (max-width: 768px) {
    grid-column: span 1;
  }
}

.scores-card {
  padding: 20px;

  &__header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba($emerald, 0.15) 0%, rgba($sky, 0.15) 100%);
    color: $emerald;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__title {
    h4 {
      font-size: 15px;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: 2px;
    }

    span {
      font-size: 12px;
      color: $color-g-54;
    }
  }

  &__content {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
  }

  &__trend {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
    color: $color-g-54;

    svg {
      color: $emerald;
    }
  }
}

.score-pill {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);

  &__ring {
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background: conic-gradient(
      currentColor var(--progress, 0%),
      rgba($color-g-92, 0.3) var(--progress, 0%)
    );
    mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #fff calc(100% - 6px));
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #fff calc(100% - 6px));
  }

  &__inner {
    position: relative;
    z-index: 1;
    text-align: center;
  }

  &__label {
    display: block;
    font-size: 10px;
    color: $color-g-54;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 2px;
  }

  &__value {
    font-size: 22px;
    font-weight: 800;
  }

  &.score--excellent {
    .score-pill__ring { background: conic-gradient($emerald var(--progress, 0%), rgba($color-g-92, 0.3) var(--progress, 0%)); }
    .score-pill__value { color: $emerald; }
  }

  &.score--good {
    .score-pill__ring { background: conic-gradient(#22C55E var(--progress, 0%), rgba($color-g-92, 0.3) var(--progress, 0%)); }
    .score-pill__value { color: #22C55E; }
  }

  &.score--fair {
    .score-pill__ring { background: conic-gradient($amber var(--progress, 0%), rgba($color-g-92, 0.3) var(--progress, 0%)); }
    .score-pill__value { color: $amber; }
  }

  &.score--poor {
    .score-pill__ring { background: conic-gradient($rose var(--progress, 0%), rgba($color-g-92, 0.3) var(--progress, 0%)); }
    .score-pill__value { color: $rose; }
  }

  &.score--unknown {
    .score-pill__ring { background: conic-gradient($color-g-67 var(--progress, 0%), rgba($color-g-92, 0.3) var(--progress, 0%)); }
    .score-pill__value { color: $color-g-54; }
  }
}

// Quick Actions Section
.quick-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);

  @include responsive(tab-portrait) {
    flex-direction: column;
    align-items: stretch;
  }
}

.actions-group {
  display: flex;
  gap: 10px;

  &.primary-actions {
    flex: 1;

    @include responsive(tab-portrait) {
      flex-wrap: wrap;
    }
  }

  &.contact-actions {
    @include responsive(tab-portrait) {
      justify-content: center;
      margin-top: 8px;
    }
  }
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba($sky, 0.08);
  border: 1px solid rgba($sky, 0.15);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: $sky-dark;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  svg {
    flex-shrink: 0;
  }

  &:hover {
    background: rgba($sky, 0.15);
    border-color: rgba($sky, 0.25);
    transform: translateY(-1px);
  }

  &.primary {
    background: linear-gradient(135deg, $sky-dark, $sky);
    border-color: transparent;
    color: white;

    &:hover {
      background: linear-gradient(135deg, darken($sky-dark, 5%), darken($sky, 5%));
      box-shadow: 0 4px 12px rgba($sky-dark, 0.3);
    }
  }

  @include responsive(phone) {
    padding: 10px 12px;
    font-size: 12px;
    flex: 1;
    justify-content: center;
  }
}

.contact-btn {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: $color-g-54;

  &:hover {
    transform: translateY(-2px);
  }

  &.call {
    &:hover {
      background: rgba($emerald, 0.1);
      border-color: rgba($emerald, 0.2);
      color: $emerald;
    }
  }

  &.email {
    &:hover {
      background: rgba($sky, 0.1);
      border-color: rgba($sky, 0.2);
      color: $sky-dark;
    }
  }

  &.star {
    &:hover {
      background: rgba($amber, 0.1);
      border-color: rgba($amber, 0.2);
      color: $amber;
    }

    &.starred {
      background: rgba($amber, 0.15);
      border-color: rgba($amber, 0.25);
      color: $amber;

      &:hover {
        background: rgba($amber, 0.2);
      }
    }
  }
}

// Premium Tabs Section
.tabs-section {
  margin-bottom: 20px;
}

.tabs-container {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  padding: 20px 24px;
}

.tabs-header {
  margin-bottom: 16px;

  h3 {
    font-size: 17px;
    font-weight: 700;
    color: $color-g-21;
    margin-bottom: 4px;
  }

  p {
    font-size: 13px;
    color: $color-g-54;
  }
}

.tabs-nav {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar { display: none; }
}

.tab-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: rgba($color-g-97, 0.6);
  border: 1px solid transparent;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  color: $color-g-54;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.25s ease;

  &:hover {
    background: rgba($sky, 0.06);
    color: $color-g-36;
    border-color: rgba($sky, 0.1);
  }

  &.active {
    background: linear-gradient(135deg, rgba($sky, 0.12) 0%, rgba($sky-dark, 0.08) 100%);
    border-color: rgba($sky, 0.2);
    color: $sky-dark;
    font-weight: 600;

    .tab-button__icon {
      background: rgba($sky-dark, 0.12);
      color: $sky-dark;
    }

    .tab-button__count {
      background: $sky-dark;
      color: white;
    }
  }

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba($color-g-67, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;
  }

  &__label {
    @media (max-width: 600px) {
      display: none;
    }
  }

  &__count {
    padding: 3px 10px;
    background: $color-g-92;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    color: $color-g-54;
    transition: all 0.25s ease;
  }
}

// Tab Content
.tab-content {
  min-height: 300px;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

// Skeleton
.skeleton-hero {
  height: 180px;
  border-radius: $size-20;
  background: linear-gradient(90deg, rgba($sky, 0.1) 25%, rgba($sky, 0.2) 50%, rgba($sky, 0.1) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-card {
  height: 160px;
  border-radius: $size-16;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;

  &--sm { height: 60px; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
