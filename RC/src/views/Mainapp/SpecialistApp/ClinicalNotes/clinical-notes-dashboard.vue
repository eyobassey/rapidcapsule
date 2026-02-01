<template>
  <div class="page-content">
    <TopBar showButtons type="title-only" :title="isPatientMode ? 'Patient Clinical Notes' : 'Clinical Notes'" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="notes-container">
        <!-- Hero Banner (when in patient mode) -->
        <div v-if="isPatientMode && patient" class="hero-banner">
          <div class="hero-top">
            <button @click="goBack" class="back-link">
              <v-icon name="hi-arrow-left" scale="0.9" />
              <span>Back to Patient</span>
            </button>
            <button class="create-note-btn" @click="openCreateNoteModal">
              <v-icon name="hi-plus" scale="0.9" />
              Create Clinical Note
            </button>
          </div>
          <div class="hero-main">
            <div class="patient-header">
              <div class="patient-avatar">
                <div class="avatar-wrapper">
                  <img v-if="getPatientImage()" :src="getPatientImage()" :alt="getPatientName()" @error="$event.target.style.display='none'" />
                  <span v-else class="avatar-initials">{{ getPatientInitials() }}</span>
                </div>
              </div>
              <div class="patient-info">
                <span class="patient-badge">Clinical Notes</span>
                <h1 class="patient-name">{{ getPatientName() }}</h1>
                <div class="patient-meta">
                  <span v-if="patient?.profile?.gender" class="meta-item">
                    <v-icon name="hi-user" scale="0.7" />
                    {{ patient.profile.gender }}
                  </span>
                  <span v-if="patient?.profile?.date_of_birth" class="meta-item">
                    <v-icon name="hi-calendar" scale="0.7" />
                    {{ calculateAge(patient.profile.date_of_birth) }} years old
                  </span>
                  <span v-if="patient?.email" class="meta-item">
                    <v-icon name="hi-mail" scale="0.7" />
                    {{ patient.email }}
                  </span>
                  <span v-if="patient?.profile?.phone_number" class="meta-item">
                    <v-icon name="hi-phone" scale="0.7" />
                    {{ patient.profile.phone_number }}
                  </span>
                </div>
              </div>
            </div>
            <div class="hero-stats" v-if="notes.length">
              <div class="stat-card">
                <span class="stat-value">{{ notes.length }}</span>
                <span class="stat-label">Total Notes</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Hero Section (when not in patient mode) -->
        <div v-else class="hero-section">
          <div class="hero-content">
            <h1 class="hero-title">
              <v-icon name="hi-document-text" scale="1" />
              Clinical Notes
            </h1>
            <p class="hero-subtitle">View and manage your clinical notes from appointments</p>
          </div>
          <div v-if="notes.length" class="hero-stat-pill">
            <span class="hero-stat-pill__value">{{ notes.length }}</span>
            <span class="hero-stat-pill__label">Notes</span>
          </div>
        </div>

        <!-- Search & Filters -->
        <div class="filters-card">
          <div class="search-input-wrapper">
            <v-icon name="hi-search" scale="0.9" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search notes by content or patient name..."
            />
            <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
              <v-icon name="hi-x" scale="0.8" />
            </button>
          </div>
          <div class="filters-row">
            <div class="filter-group">
              <label>Patient</label>
              <select v-model="patientFilter">
                <option value="all">All Patients</option>
                <option v-for="name in uniquePatients" :key="name" :value="name">
                  {{ name }}
                </option>
              </select>
            </div>
            <div class="filter-group">
              <label>Platform</label>
              <select v-model="platformFilter">
                <option value="all">All Platforms</option>
                <option value="zoom">Zoom Notes</option>
                <option value="custom">Custom Notes</option>
              </select>
            </div>
            <div class="filter-actions">
              <button class="export-btn" :disabled="!filteredNotes.length || isExporting" @click="exportPdf">
                <v-icon name="hi-download" scale="0.75" />
                {{ isExporting ? 'Exporting...' : 'Export PDF' }}
              </button>
              <router-link to="/app/specialist/clinical-notes/templates" class="templates-link">
                <v-icon name="hi-template" scale="0.8" />
                Templates
              </router-link>
            </div>
          </div>
        </div>

        <!-- Shimmer Loading -->
        <template v-if="isLoading">
          <div class="skeleton-card" v-for="i in 4" :key="i" />
        </template>

        <!-- Notes List -->
        <template v-else>
          <div v-if="filteredNotes.length" class="notes-list">
            <div
              v-for="note in filteredNotes"
              :key="note.note_id"
              class="note-card"
              @click="openNoteDetails(note)"
            >
              <div class="note-card__header">
                <div class="note-card__info">
                  <h3 class="note-card__patient">{{ note.patient_name }}</h3>
                  <span class="note-card__date">{{ formatNoteDate(note.created_at) }}</span>
                </div>
                <div class="note-card__badges">
                  <span
                    class="status-badge"
                    :class="note.platform === 'zoom' ? 'status-badge--zoom' : 'status-badge--custom'"
                  >
                    {{ note.platform === 'zoom' ? 'Zoom' : 'Custom' }}
                  </span>
                  <span v-if="note.completed" class="status-badge status-badge--completed">
                    Completed
                  </span>
                  <span v-else class="status-badge status-badge--progress">
                    In Progress
                  </span>
                  <button
                    v-if="getLinkedPrescriptions(note).length"
                    class="status-badge status-badge--prescription status-badge--clickable"
                    @click.stop="openRxDetails(note)"
                  >
                    <v-icon name="ri-capsule-line" scale="0.55" />
                    {{ getLinkedPrescriptions(note).length }} Rx
                  </button>
                </div>
              </div>

              <p class="note-card__text">{{ truncateText(note.content, 150) }}</p>

              <div class="note-card__footer">
                <div class="note-card__footer-left">
                  <!-- Specialist Info -->
                  <div class="note-card__specialist">
                    <div class="specialist-avatar">
                      <img v-if="note.specialist_image" :src="note.specialist_image" :alt="note.specialist_name" @error="$event.target.style.display='none'" />
                      <span v-else class="avatar-initials">{{ getSpecialistInitials(note.specialist_name) }}</span>
                    </div>
                    <div class="specialist-info">
                      <span class="specialist-name">Dr. {{ note.specialist_name }}</span>
                      <span v-if="note.specialist_specialty" class="specialist-specialty">{{ note.specialist_specialty }}</span>
                    </div>
                  </div>
                  <div class="note-card__meta-group">
                    <div class="note-card__meta">
                      <v-icon name="hi-video-camera" scale="0.7" />
                      <span>{{ note.meeting_channel }}</span>
                    </div>
                    <div class="note-card__meta">
                      <v-icon name="hi-clock" scale="0.7" />
                      <span>{{ formatTimeAgo(note.created_at) }}</span>
                    </div>
                  </div>
                </div>
                <div class="note-card__footer-right">
                  <button
                    class="note-card__prescription-btn"
                    @click.stop="createPrescriptionFromNote(note)"
                    title="Create Prescription"
                  >
                    <v-icon name="ri-capsule-line" scale="0.8" />
                    <span>Prescribe</span>
                  </button>
                  <div class="card-arrow">
                    <v-icon name="hi-chevron-right" scale="0.85" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-section">
            <div class="empty-section__icon">
              <v-icon name="hi-document-text" scale="1.8" />
            </div>
            <h3>No clinical notes found</h3>
            <p>Clinical notes from your appointments will appear here</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Note Details Modal -->
    <NoteDetailsModal
      v-if="selectedNote"
      v-model="isModalOpen"
      :note="selectedNote"
      @updated="fetchClinicalNotes"
    />

    <!-- Linked Prescriptions Modal -->
    <div v-if="showRxModal" class="rx-modal-overlay" @click.self="showRxModal = false">
      <div class="rx-modal">
        <div class="rx-modal__header">
          <h3>
            <v-icon name="ri-capsule-line" scale="0.85" />
            Linked Prescriptions
          </h3>
          <button class="rx-modal__close" @click="showRxModal = false">
            <v-icon name="hi-x" scale="0.9" />
          </button>
        </div>

        <div v-if="loadingRxDetails" class="rx-modal__loading">
          <div class="skeleton-item" v-for="i in 2" :key="i" />
        </div>

        <div v-else class="rx-modal__body">
          <div v-for="rx in rxDetails" :key="rx._id" class="rx-card">
            <div class="rx-card__header">
              <div class="rx-card__info">
                <span class="rx-card__number">{{ rx.prescription_number }}</span>
                <span class="rx-card__status" :class="`rx-status--${rx.status?.toLowerCase()}`">
                  {{ rx.status?.replace(/_/g, ' ') }}
                </span>
              </div>
              <button class="rx-card__view" @click="viewPrescription(rx._id)">
                View
                <v-icon name="hi-chevron-right" scale="0.6" />
              </button>
            </div>
            <div v-if="rx.items?.length" class="rx-card__items">
              <div v-for="(item, idx) in rx.items" :key="idx" class="rx-item">
                <div class="rx-item__name">
                  <v-icon name="ri-capsule-line" scale="0.6" />
                  <span>{{ item.drug_name }}</span>
                </div>
                <div class="rx-item__details">
                  <span v-if="item.dosage" class="rx-item__tag">{{ item.dosage }}</span>
                  <span v-if="item.frequency" class="rx-item__tag">{{ item.frequency }}</span>
                  <span v-if="item.duration" class="rx-item__tag">{{ item.duration }}</span>
                  <span class="rx-item__qty">x{{ item.quantity }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Link Selector Modal -->
    <div v-if="showLinkSelector" class="link-selector-overlay" @click.self="cancelLinkSelector">
      <div class="link-selector-modal">
        <div class="link-selector-header">
          <h3>
            <v-icon name="hi-link" scale="0.9" />
            Link Clinical Note
          </h3>
          <button class="close-btn" @click="cancelLinkSelector">
            <v-icon name="hi-x" scale="0.9" />
          </button>
        </div>
        <div class="link-selector-body">
          <p class="link-description">
            Select a completed appointment or health checkup to link this clinical note to:
          </p>

          <!-- Link Type Tabs -->
          <div class="link-type-tabs">
            <button
              :class="['tab-btn', { active: selectedLinkType === 'appointment' }]"
              @click="selectedLinkType = 'appointment'"
            >
              <v-icon name="hi-calendar" scale="0.8" />
              Appointments
              <span class="count">{{ patientAppointments.length }}</span>
            </button>
            <button
              :class="['tab-btn', { active: selectedLinkType === 'checkup' }]"
              @click="selectedLinkType = 'checkup'"
            >
              <v-icon name="fa-robot" scale="0.8" />
              Health Checkups
              <span class="count">{{ patientHealthCheckups.length }}</span>
            </button>
            <button
              :class="['tab-btn', { active: selectedLinkType === 'none' }]"
              @click="selectedLinkType = 'none'"
            >
              <v-icon name="hi-document-text" scale="0.8" />
              No Link
            </button>
          </div>

          <!-- Appointment List -->
          <div v-if="selectedLinkType === 'appointment'" class="link-items-list">
            <div v-if="!patientAppointments.length" class="empty-list">
              <v-icon name="hi-calendar" scale="1.5" />
              <p>No completed appointments found</p>
            </div>
            <label
              v-for="apt in patientAppointments"
              :key="apt.id || apt._id"
              class="link-item"
              :class="{ selected: selectedAppointmentForNote?.id === apt.id || selectedAppointmentForNote?._id === apt._id }"
            >
              <input
                type="radio"
                name="appointment"
                :value="apt"
                v-model="selectedAppointmentForNote"
              />
              <div class="link-item-content">
                <div class="link-item-main">
                  <span class="link-item-date">{{ formatLinkDate(apt.start_time || apt.date) }}</span>
                  <span class="link-item-type">{{ apt.appointment_type || 'Consultation' }}</span>
                </div>
                <div class="link-item-meta">
                  <span v-if="apt.specialist?.name">Dr. {{ apt.specialist.name }}</span>
                  <span v-if="apt.duration_minutes">{{ apt.duration_minutes }} min</span>
                </div>
              </div>
              <v-icon v-if="selectedAppointmentForNote?.id === apt.id || selectedAppointmentForNote?._id === apt._id" name="hi-check-circle" scale="1" class="check-icon" />
            </label>
          </div>

          <!-- Health Checkup List -->
          <div v-if="selectedLinkType === 'checkup'" class="link-items-list">
            <div v-if="!patientHealthCheckups.length" class="empty-list">
              <v-icon name="fa-robot" scale="1.5" />
              <p>No health checkups found</p>
            </div>
            <label
              v-for="checkup in patientHealthCheckups"
              :key="checkup.id"
              class="link-item"
              :class="{ selected: selectedCheckupForNote?.id === checkup.id }"
            >
              <input
                type="radio"
                name="checkup"
                :value="checkup"
                v-model="selectedCheckupForNote"
              />
              <div class="link-item-content">
                <div class="link-item-main">
                  <span class="link-item-date">{{ formatLinkDate(checkup.date) }}</span>
                  <span class="link-item-triage" :class="getTratriageClass(checkup.triage_level)">
                    {{ checkup.triage_level || 'Unknown' }}
                  </span>
                </div>
                <div class="link-item-meta">
                  <span v-if="checkup.conditions?.length">
                    {{ checkup.conditions[0]?.name || 'Health Assessment' }}
                  </span>
                  <span v-if="checkup.symptoms?.length">{{ checkup.symptoms.length }} symptoms</span>
                </div>
              </div>
              <v-icon v-if="selectedCheckupForNote?.id === checkup.id" name="hi-check-circle" scale="1" class="check-icon" />
            </label>
          </div>

          <!-- No Link Option -->
          <div v-if="selectedLinkType === 'none'" class="no-link-section">
            <div class="no-link-info">
              <v-icon name="hi-information-circle" scale="1.2" />
              <p>Create a standalone clinical note without linking to a specific appointment or health checkup.</p>
            </div>
          </div>
        </div>
        <div class="link-selector-footer">
          <button class="cancel-btn" @click="cancelLinkSelector">Cancel</button>
          <button class="confirm-btn" @click="confirmLinkAndCreate">
            <v-icon name="hi-plus" scale="0.8" />
            Create Note
          </button>
        </div>
      </div>
    </div>

    <!-- Clinical Note Modal -->
    <ClinicalNoteModal
      :is-open="showCreateNoteModal"
      :appointment="selectedAppointmentForNote"
      :existing-note="null"
      @close="closeClinicalNoteModal"
      @saved="handleClinicalNoteSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import { format, formatDistanceToNow } from 'date-fns';
import TopBar from '@/components/Navigation/top-bar';
import apiFactory from '@/services/apiFactory';
import NoteDetailsModal from './note-details-modal.vue';
import ClinicalNoteModal from '@/views/Mainapp/SpecialistApp/SpecialistAppointments/modals/ClinicalNoteModal.vue';

const router = useRouter();
const route = useRoute();

defineEmits(['openSideNav']);

const $toast = useToast();

// Patient-specific mode state
const patientId = computed(() => route.query.patientId);
const isPatientMode = computed(() => !!patientId.value);
const patient = ref(null);
const patientLoading = ref(false);
const patientAppointments = ref([]);  // Completed appointments for linking
const patientHealthCheckups = ref([]);  // Completed health checkups for linking

// Create note modal state
const showCreateNoteModal = ref(false);
const showLinkSelector = ref(false);
const selectedLinkType = ref('appointment');  // 'appointment' or 'checkup'
const selectedAppointmentForNote = ref(null);
const selectedCheckupForNote = ref(null);

const isLoading = ref(true);
const isExporting = ref(false);
const notes = ref([]);
const linkedPrescriptionsMap = ref({});
const searchQuery = ref('');
const platformFilter = ref('all');
const patientFilter = ref('all');
const selectedNote = ref(null);
const isModalOpen = ref(false);
const showRxModal = ref(false);
const rxDetails = ref([]);
const loadingRxDetails = ref(false);

const uniquePatients = computed(() => {
  const names = new Set(notes.value.map(n => n.patient_name).filter(Boolean));
  return [...names].sort();
});

const filteredNotes = computed(() => {
  let filtered = notes.value;

  if (patientFilter.value !== 'all') {
    filtered = filtered.filter(note => note.patient_name === patientFilter.value);
  }

  if (platformFilter.value !== 'all') {
    filtered = filtered.filter(note => note.platform === platformFilter.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(note =>
      note.content.toLowerCase().includes(query) ||
      note.patient_name.toLowerCase().includes(query)
    );
  }

  return filtered;
});

function formatNoteDate(date) {
  return format(new Date(date), 'MMM dd, yyyy \'at\' h:mm a');
}

function formatTimeAgo(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

function openNoteDetails(note) {
  selectedNote.value = note;
  isModalOpen.value = true;
}

async function openRxDetails(note) {
  const prescriptions = getLinkedPrescriptions(note);
  if (!prescriptions.length) return;
  showRxModal.value = true;
  loadingRxDetails.value = true;
  rxDetails.value = [];
  try {
    const details = await Promise.all(
      prescriptions.map(async (p) => {
        const response = await apiFactory.$_getSpecialistPrescriptionDetails(p._id);
        return response.data?.data || response.data?.result;
      })
    );
    rxDetails.value = details.filter(Boolean);
  } catch (error) {
    console.error('Error fetching prescription details:', error);
    $toast.error('Failed to load prescription details');
  } finally {
    loadingRxDetails.value = false;
  }
}

function viewPrescription(id) {
  showRxModal.value = false;
  router.push(`/app/specialist/pharmacy/prescriptions/${id}`);
}

function createPrescriptionFromNote(note) {
  const query = {};
  if (note.patient_id) query.patient = note.patient_id;
  if (note.appointment_id) {
    query.linkAppointment = note.appointment_id;
    if (note.note_id) {
      query.linkNote = `${note.appointment_id}:${note.note_id}`;
    }
  }
  router.push({ path: '/app/specialist/pharmacy/prescriptions/create', query });
}

function getLinkedPrescriptions(note) {
  const apptMap = linkedPrescriptionsMap.value[note.appointment_id];
  if (!apptMap) return [];
  return apptMap.filter(p => p.linked_notes?.includes(note.note_id) || p.linked_appointment);
}

async function fetchLinkedPrescriptions() {
  const appointmentIds = [...new Set(notes.value.map(n => n.appointment_id).filter(Boolean))];
  if (!appointmentIds.length) return;
  try {
    const response = await apiFactory.$_getPrescriptionsForAppointments(appointmentIds);
    const result = response.data?.data || response.data?.result;
    if (result) {
      linkedPrescriptionsMap.value = result;
    }
  } catch (error) {
    console.error('Error fetching linked prescriptions:', error);
  }
}

async function fetchClinicalNotes() {
  try {
    isLoading.value = true;
    const response = await apiFactory.$_getSpecialistClinicalNotes();
    if (response.data?.data) {
      let allNotes = response.data.data;
      // Filter by patient if in patient mode
      if (isPatientMode.value && patientId.value) {
        allNotes = allNotes.filter(note => note.patient_id === patientId.value);
      }
      notes.value = allNotes;
      fetchLinkedPrescriptions();
    }
  } catch (error) {
    console.error('Error fetching clinical notes:', error);
    $toast.error('Failed to load clinical notes');
  } finally {
    isLoading.value = false;
  }
}

// Fetch patient details when in patient mode
async function fetchPatientDetails() {
  if (!patientId.value) return;
  patientLoading.value = true;
  try {
    const response = await apiFactory.$_getSpecialistPatientDetails(patientId.value);
    const data = response.data?.data || response.data;
    patient.value = data?.patient || data;
  } catch (error) {
    console.error('Error fetching patient:', error);
  } finally {
    patientLoading.value = false;
  }
}

// Fetch completed appointments for linking
async function fetchPatientAppointments() {
  if (!patientId.value) return;
  try {
    const response = await apiFactory.$_getPatientFullHealthRecords(patientId.value, {
      appointmentsPage: 1,
      appointmentsLimit: 50,
    });
    const data = response.data?.data || response.data;
    const appointments = data.appointments?.items || data.appointments || [];
    // Filter to only completed appointments
    patientAppointments.value = appointments.filter(apt =>
      apt.status?.toUpperCase() === 'COMPLETED'
    );
  } catch (error) {
    console.error('Error fetching appointments:', error);
  }
}

// Fetch health checkups for linking
async function fetchPatientHealthCheckups() {
  if (!patientId.value) return;
  try {
    const response = await apiFactory.$_getPatientFullHealthRecords(patientId.value, {
      checkupsPage: 1,
      checkupsLimit: 50,
    });
    const data = response.data?.data || response.data;
    patientHealthCheckups.value = data.health_checkups?.items || [];
  } catch (error) {
    console.error('Error fetching health checkups:', error);
  }
}

// Open create note modal with link selector
function openCreateNoteModal() {
  if (isPatientMode.value) {
    // Show link selector first
    showLinkSelector.value = true;
    selectedLinkType.value = 'appointment';
    selectedAppointmentForNote.value = null;
    selectedCheckupForNote.value = null;
  } else {
    // No patient context, just navigate to clinical notes page
    $toast.warning('Please select a patient first');
  }
}

// Confirm link selection and open note modal
function confirmLinkAndCreate() {
  if (selectedLinkType.value === 'appointment' && selectedAppointmentForNote.value) {
    showLinkSelector.value = false;
    showCreateNoteModal.value = true;
  } else if (selectedLinkType.value === 'checkup' && selectedCheckupForNote.value) {
    showLinkSelector.value = false;
    showCreateNoteModal.value = true;
  } else if (selectedLinkType.value === 'none') {
    // Create note without linking
    showLinkSelector.value = false;
    showCreateNoteModal.value = true;
  } else {
    $toast.warning('Please select an item to link or choose "No Link"');
  }
}

function cancelLinkSelector() {
  showLinkSelector.value = false;
  selectedAppointmentForNote.value = null;
  selectedCheckupForNote.value = null;
}

function closeClinicalNoteModal() {
  showCreateNoteModal.value = false;
  selectedAppointmentForNote.value = null;
  selectedCheckupForNote.value = null;
}

function handleClinicalNoteSaved() {
  showCreateNoteModal.value = false;
  selectedAppointmentForNote.value = null;
  selectedCheckupForNote.value = null;
  $toast.success('Clinical note saved successfully');
  fetchClinicalNotes();
}

// Get patient profile image URL - use profile_image first as backend returns presigned URL there
function getPatientImage() {
  // Backend returns presigned URL in profile_image, so check that first
  const profileImage = patient.value?.profile?.profile_image ||
                       patient.value?.profile?.profile_photo ||
                       patient.value?.profile_image;
  if (!profileImage) return '';
  // If it's already a full URL (presigned or otherwise), use it directly
  if (profileImage.startsWith('http')) return profileImage;
  // Fallback for relative paths (shouldn't happen with proper backend response)
  return '';
}

// Get patient initials
function getPatientInitials() {
  const firstName = patient.value?.profile?.first_name || patient.value?.first_name || '';
  const lastName = patient.value?.profile?.last_name || patient.value?.last_name || '';
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'P';
}

// Get specialist initials from name
function getSpecialistInitials(name) {
  if (!name) return 'Dr';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

// Get patient full name
function getPatientName() {
  const profile = patient.value?.profile || patient.value;
  if (!profile) return 'Patient';
  return `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Patient';
}

// Go back to patient dashboard
function goBack() {
  if (patientId.value) {
    router.push(`/app/specialist/patients/${patientId.value}`);
  } else {
    router.back();
  }
}

// Calculate age from date of birth
function calculateAge(dob) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Format date for link items
function formatLinkDate(date) {
  if (!date) return '-';
  return format(new Date(date), 'MMM dd, yyyy \'at\' h:mm a');
}

// Get triage level class
function getTratriageClass(level) {
  const classes = {
    emergency: 'triage-emergency',
    emergency_ambulance: 'triage-emergency',
    consultation_24: 'triage-urgent',
    consultation: 'triage-moderate',
    self_care: 'triage-low',
  };
  return classes[level?.toLowerCase()] || 'triage-default';
}

async function exportPdf() {
  if (!filteredNotes.value.length) return;
  isExporting.value = true;

  try {
    const html2pdf = (await import('html2pdf.js')).default;

    const patientLabel = patientFilter.value !== 'all' ? patientFilter.value : 'All Patients';
    const dateStr = format(new Date(), 'MMM dd, yyyy');

    let notesHtml = `
      <div style="font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #1a1a1a;">
        <div style="border-bottom: 2px solid #0EAEC4; padding-bottom: 12px; margin-bottom: 24px;">
          <h1 style="font-size: 22px; margin: 0 0 4px; color: #0e7490;">Clinical Notes Report</h1>
          <p style="font-size: 13px; color: #666; margin: 0;">Patient: ${patientLabel} | Generated: ${dateStr}</p>
          <p style="font-size: 13px; color: #666; margin: 4px 0 0;">${filteredNotes.value.length} note(s)</p>
        </div>
    `;

    for (const note of filteredNotes.value) {
      const noteDate = formatNoteDate(note.created_at);
      const status = note.completed ? 'Completed' : 'In Progress';
      const statusColor = note.completed ? '#059669' : '#d97706';
      const platform = note.platform === 'zoom' ? 'Zoom' : 'Custom';

      notesHtml += `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="font-size: 15px; color: #1a1a1a;">${note.patient_name}</strong>
            <span style="font-size: 11px; color: ${statusColor}; background: ${statusColor}1a; padding: 2px 8px; border-radius: 10px;">${status}</span>
          </div>
          <p style="font-size: 11px; color: #666; margin: 0 0 10px;">
            ${noteDate} | ${note.meeting_channel || '-'} | ${platform}
          </p>
          <div style="background: #f9fafb; border-radius: 6px; padding: 12px; white-space: pre-wrap; font-size: 13px; line-height: 1.6; color: #374151;">
            ${note.content}
          </div>
        </div>
      `;
    }

    notesHtml += '</div>';

    const container = document.createElement('div');
    container.innerHTML = notesHtml;
    document.body.appendChild(container);

    const filename = patientFilter.value !== 'all'
      ? `clinical-notes-${patientFilter.value.replace(/\s+/g, '-').toLowerCase()}.pdf`
      : 'clinical-notes-all.pdf';

    await html2pdf().set({
      margin: [10, 10, 10, 10],
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    }).from(container).save();

    document.body.removeChild(container);
    $toast.success('PDF exported successfully');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    $toast.error('Failed to export PDF');
  } finally {
    isExporting.value = false;
  }
}

onMounted(async () => {
  // If in patient mode, load patient data first
  if (isPatientMode.value) {
    await Promise.all([
      fetchPatientDetails(),
      fetchPatientAppointments(),
      fetchPatientHealthCheckups(),
    ]);
  }
  fetchClinicalNotes();
});
</script>

<style scoped lang="scss">
.page-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 0;
  background: #F8FAFC;

  @include responsive(tab-portrait) {
    padding: 0;
  }

  &__body {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    height: 100%;
    overflow-y: auto;
    padding-bottom: 100px;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 3px;
    }
  }
}

.notes-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $size-24;
  padding: 0 $size-48;
  padding-bottom: $size-32;

  @media (max-width: 768px) {
    padding: 0 $size-16;
  }
}

// Hero Banner (matching Patient Dashboard)
.hero-banner {
  background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 50%, #0288D1 100%);
  border-radius: $size-24;
  padding: $size-24 $size-32;
  margin-top: $size-24;
  color: white;
  box-shadow: 0 10px 40px rgba(79, 195, 247, 0.3);

  @media (max-width: 768px) {
    padding: $size-20;
    border-radius: $size-16;
  }
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $size-24;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: $size-8;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  padding: $size-10 $size-16;
  border-radius: $size-8;
  color: white;
  font-size: $size-14;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.create-note-btn {
  display: inline-flex;
  align-items: center;
  gap: $size-8;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: $size-10 $size-20;
  border-radius: $size-8;
  color: white;
  font-size: $size-14;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
}

.hero-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $size-32;

  @media (max-width: 992px) {
    flex-direction: column;
  }
}

.patient-header {
  display: flex;
  gap: $size-20;
  align-items: flex-start;
}

.patient-avatar {
  .avatar-wrapper {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid rgba(255, 255, 255, 0.3);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      font-size: 28px;
      font-weight: 700;
      color: white;
    }
  }
}

.patient-info {
  .patient-badge {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    padding: $size-4 $size-12;
    border-radius: $size-12;
    font-size: $size-12;
    font-weight: 500;
    margin-bottom: $size-8;
  }

  .patient-name {
    font-size: $size-28;
    font-weight: 700;
    margin: 0 0 $size-12;
    line-height: 1.2;
  }

  .patient-meta {
    display: flex;
    flex-wrap: wrap;
    gap: $size-16;

    .meta-item {
      display: flex;
      align-items: center;
      gap: $size-6;
      font-size: $size-14;
      opacity: 0.9;

      svg {
        opacity: 0.8;
      }
    }
  }
}

.hero-stats {
  display: flex;
  gap: $size-16;

  .stat-card {
    background: rgba(255, 255, 255, 0.15);
    border-radius: $size-12;
    padding: $size-16 $size-24;
    text-align: center;
    min-width: 100px;

    .stat-value {
      display: block;
      font-size: $size-28;
      font-weight: 700;
      line-height: 1.2;
    }

    .stat-label {
      display: block;
      font-size: $size-12;
      opacity: 0.85;
      margin-top: $size-4;
    }
  }
}

// Mobile adjustments for hero banner
@media (max-width: 600px) {
  .hero-banner {
    margin: $size-12;
    padding: $size-16;
    border-radius: $size-12;
  }

  .hero-top {
    flex-direction: column;
    gap: $size-12;
    align-items: stretch;
  }

  .back-link, .create-note-btn {
    justify-content: center;
  }

  .patient-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .patient-info .patient-meta {
    justify-content: center;
  }

  .hero-stats {
    width: 100%;
    justify-content: center;
  }
}

// Link Selector Modal
.link-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.link-selector-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.link-selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;

  h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;

    svg {
      color: #0EAEC4;
    }
  }

  .close-btn {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;

    &:hover {
      background: #f1f5f9;
      color: #64748b;
    }
  }
}

.link-selector-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  .link-description {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 20px;
  }

  .link-type-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #f1f5f9;
      border: 2px solid transparent;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s ease;

      .count {
        background: #e2e8f0;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 12px;
      }

      &.active {
        background: #e0f7fa;
        border-color: #0EAEC4;
        color: #0EAEC4;

        .count {
          background: #0EAEC4;
          color: white;
        }
      }

      &:hover:not(.active) {
        background: #e2e8f0;
      }
    }
  }

  .link-items-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
  }

  .empty-list {
    text-align: center;
    padding: 40px 20px;
    color: #94a3b8;

    svg {
      margin-bottom: 10px;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  .link-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: #f8fafc;
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    input[type="radio"] {
      display: none;
    }

    &.selected,
    &:has(input:checked) {
      background: #e0f7fa;
      border-color: #0EAEC4;
    }

    &:hover:not(.selected) {
      background: #f1f5f9;
    }

    .link-item-content {
      flex: 1;
    }

    .link-item-main {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;

      .link-item-date {
        font-weight: 600;
        color: #1e293b;
        font-size: 14px;
      }

      .link-item-type {
        font-size: 12px;
        color: #64748b;
        background: #e2e8f0;
        padding: 2px 8px;
        border-radius: 6px;
      }

      .link-item-triage {
        font-size: 11px;
        padding: 3px 10px;
        border-radius: 20px;
        font-weight: 600;

        &.triage-emergency { background: #fee2e2; color: #dc2626; }
        &.triage-urgent { background: #ffedd5; color: #ea580c; }
        &.triage-moderate { background: #fef3c7; color: #d97706; }
        &.triage-low { background: #d1fae5; color: #059669; }
        &.triage-default { background: #e2e8f0; color: #64748b; }
      }
    }

    .link-item-meta {
      display: flex;
      gap: 12px;
      font-size: 13px;
      color: #64748b;
    }

    .check-icon {
      color: #0EAEC4;
    }
  }

  .no-link-section {
    .no-link-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 20px;
      background: #f0f9ff;
      border-radius: 12px;

      svg {
        color: #0ea5e9;
        flex-shrink: 0;
        margin-top: 2px;
      }

      p {
        margin: 0;
        font-size: 14px;
        color: #0369a1;
        line-height: 1.5;
      }
    }
  }
}

.link-selector-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;

  .cancel-btn {
    padding: 10px 20px;
    background: #f1f5f9;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;

    &:hover {
      background: #e2e8f0;
    }
  }

  .confirm-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(14, 174, 196, 0.3);
    }
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

    .hero-title {
      display: flex;
      align-items: center;
      gap: $size-8;
      font-size: $size-20;
      font-weight: $fw-bold;
      margin-bottom: $size-4;
    }

    .hero-subtitle {
      font-size: $size-13;
      opacity: 0.85;
    }
  }

  .hero-stat-pill {
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255, 255, 255, 0.15);
    padding: $size-12 $size-20;
    border-radius: $size-12;

    &__value {
      font-size: $size-24;
      font-weight: $fw-bold;
      line-height: 1.2;
    }

    &__label {
      font-size: $size-11;
      opacity: 0.85;
      font-weight: $fw-medium;
    }
  }
}

// Filters Card
.filters-card {
  background: white;
  border-radius: $size-16;
  padding: $size-20;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-12 $size-16;
  background: $color-g-97;
  border-radius: $size-10;
  margin-bottom: $size-14;
  transition: background 0.2s ease;

  &:focus-within {
    background: rgba(14, 174, 196, 0.04);
  }

  .search-icon {
    color: $color-g-54;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: $size-14;
    color: $color-g-21;
    background: transparent;

    &::placeholder {
      color: $color-g-67;
    }
  }

  .clear-btn {
    background: $color-g-92;
    border: none;
    cursor: pointer;
    padding: $size-4 $size-6;
    color: $color-g-54;
    border-radius: $size-4;

    &:hover {
      background: $color-g-85;
      color: $color-g-36;
    }
  }
}

.filters-row {
  display: flex;
  align-items: flex-end;
  gap: $size-12;
  flex-wrap: wrap;

  @include responsive(phone) {
    flex-direction: column;
    align-items: stretch;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: $size-4;

  label {
    font-size: $size-12;
    font-weight: $fw-medium;
    color: $color-g-54;
  }

  select {
    padding: $size-10 $size-12;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    font-size: $size-13;
    color: $color-g-36;
    background: white;
    cursor: pointer;
    min-width: 160px;

    &:focus {
      outline: none;
      border-color: #0EAEC4;
    }
  }
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  gap: $size-8;
  margin-left: auto;

  @include responsive(phone) {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: $size-6;
  padding: $size-10 $size-14;
  background: rgba(14, 174, 196, 0.1);
  color: #0891b2;
  border: none;
  border-radius: $size-8;
  font-size: $size-12;
  font-weight: $fw-semi-bold;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(14, 174, 196, 0.18);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.templates-link {
  display: inline-flex;
  align-items: center;
  gap: $size-6;
  padding: $size-10 $size-14;
  background: rgba(14, 174, 196, 0.08);
  color: #0891b2;
  border-radius: $size-8;
  font-size: $size-12;
  font-weight: $fw-semi-bold;
  text-decoration: none;
  transition: background 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(14, 174, 196, 0.15);
  }
}

// Notes List
.notes-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.note-card {
  background: white;
  border-radius: $size-16;
  padding: $size-20;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);

    .card-arrow {
      color: #0EAEC4;
      transform: translateX(2px);
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-12;

    @include responsive(phone) {
      flex-direction: column;
      gap: $size-8;
    }
  }

  &__info {
    flex: 1;
  }

  &__patient {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-2;
  }

  &__date {
    font-size: $size-12;
    color: $color-g-54;
  }

  &__badges {
    display: flex;
    gap: $size-6;
    flex-wrap: wrap;
  }

  &__text {
    font-size: $size-14;
    line-height: 1.6;
    color: $color-g-36;
    margin-bottom: $size-14;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $size-16;
    padding-top: $size-16;
    border-top: 1px solid $color-g-92;
  }

  &__footer-left {
    display: flex;
    align-items: center;
    gap: $size-20;
    flex: 1;

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: flex-start;
      gap: $size-12;
    }
  }

  &__footer-right {
    display: flex;
    align-items: center;
    gap: $size-12;
  }

  &__specialist {
    display: flex;
    align-items: center;
    gap: $size-10;

    .specialist-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;
      background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-initials {
        font-size: 12px;
        font-weight: 600;
        color: white;
      }
    }

    .specialist-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .specialist-name {
        font-size: $size-13;
        font-weight: $fw-semi-bold;
        color: $color-g-21;
      }

      .specialist-specialty {
        font-size: $size-11;
        color: $color-g-54;
      }
    }
  }

  &__meta-group {
    display: flex;
    align-items: center;
    gap: $size-12;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $size-4;
    font-size: $size-12;
    color: $color-g-54;
  }

  .card-arrow {
    color: $color-g-67;
    transition: all 0.2s ease;
  }

  &__prescription-btn {
    display: flex;
    align-items: center;
    gap: $size-6;
    border: none;
    background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
    color: white;
    border-radius: $size-8;
    cursor: pointer;
    transition: all 0.2s;
    padding: $size-8 $size-14;
    font-size: $size-12;
    font-weight: $fw-semi-bold;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(79, 195, 247, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(79, 195, 247, 0.4);
    }
  }
}

// Status Badges
.status-badge {
  display: inline-block;
  padding: $size-4 $size-10;
  border-radius: $size-12;
  font-size: $size-11;
  font-weight: $fw-semi-bold;

  &--zoom {
    background: rgba(#3b82f6, 0.1);
    color: #2563eb;
  }

  &--custom {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--completed {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--progress {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--prescription {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: rgba(14, 174, 196, 0.1);
    color: #0891b2;
  }

  &--clickable {
    cursor: pointer;
    border: none;
    transition: all 0.2s;

    &:hover {
      background: rgba(14, 174, 196, 0.2);
      transform: scale(1.05);
    }
  }
}

// Rx Modal
.rx-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $size-16;
}

.rx-modal {
  background: white;
  border-radius: $size-16;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $size-20 $size-24;
    border-bottom: 1px solid $color-g-92;

    h3 {
      display: flex;
      align-items: center;
      gap: $size-8;
      font-size: $size-16;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }

  &__close {
    background: none;
    border: none;
    color: $color-g-54;
    cursor: pointer;
    padding: $size-4;
    border-radius: $size-4;

    &:hover {
      background: $color-g-95;
      color: $color-g-21;
    }
  }

  &__loading {
    padding: $size-24;

    .skeleton-item {
      height: 80px;
      background: $color-g-95;
      border-radius: $size-10;
      margin-bottom: $size-12;
      animation: shimmer 1.5s infinite;
    }
  }

  &__body {
    padding: $size-20 $size-24;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: $size-16;
  }
}

.rx-card {
  border: 1px solid $color-g-90;
  border-radius: $size-12;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $size-12 $size-16;
    background: $color-g-97;
  }

  &__info {
    display: flex;
    align-items: center;
    gap: $size-8;
  }

  &__number {
    font-size: $size-14;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }

  &__status {
    font-size: $size-11;
    padding: 2px $size-8;
    border-radius: $size-4;
    font-weight: $fw-medium;
    text-transform: capitalize;
  }

  &__view {
    display: flex;
    align-items: center;
    gap: $size-4;
    font-size: $size-12;
    color: #0891b2;
    background: none;
    border: none;
    cursor: pointer;
    font-weight: $fw-medium;

    &:hover {
      text-decoration: underline;
    }
  }

  &__items {
    padding: $size-12 $size-16;
    display: flex;
    flex-direction: column;
    gap: $size-10;
  }
}

.rx-item {
  &__name {
    display: flex;
    align-items: center;
    gap: $size-6;
    font-size: $size-13;
    font-weight: $fw-medium;
    color: $color-g-21;
    margin-bottom: $size-4;

    svg { color: #0891b2; }
  }

  &__details {
    display: flex;
    align-items: center;
    gap: $size-6;
    flex-wrap: wrap;
    padding-left: $size-20;
  }

  &__tag {
    font-size: $size-11;
    background: $color-g-95;
    padding: 2px $size-6;
    border-radius: $size-4;
    color: $color-g-54;
  }

  &__qty {
    font-size: $size-11;
    font-weight: $fw-semi-bold;
    color: #0891b2;
  }
}

.rx-status--draft {
  background: $color-g-92;
  color: $color-g-54;
}

.rx-status--pending_payment {
  background: rgba(#f59e0b, 0.1);
  color: #d97706;
}

.rx-status--paid, .rx-status--delivered {
  background: rgba(#10b981, 0.1);
  color: #059669;
}

.rx-status--processing, .rx-status--dispensed, .rx-status--shipped {
  background: rgba(14, 174, 196, 0.1);
  color: #0891b2;
}

.rx-status--cancelled {
  background: rgba(#ef4444, 0.1);
  color: #dc2626;
}

// Empty State
.empty-section {
  text-align: center;
  padding: $size-32 $size-20;
  background: $color-g-97;
  border-radius: $size-12;

  &__icon {
    width: 64px;
    height: 64px;
    margin: 0 auto $size-14;
    border-radius: 50%;
    background: rgba(14, 174, 196, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0EAEC4;
  }

  h3 {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-6;
  }

  p {
    font-size: $size-13;
    color: $color-g-54;
  }
}

// Skeleton
.skeleton-card {
  height: 120px;
  border-radius: $size-16;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
