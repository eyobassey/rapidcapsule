<template>
  <div class="clinical-notes-page">
    <!-- Hero Section: Patient Mode -->
    <section v-if="isPatientMode && patient" class="hero">
      <div class="hero__content">
        <div class="hero__top-actions">
          <button @click="goBack" class="hero__back-btn">
            <v-icon name="hi-arrow-left" scale="0.9" />
            <span>Back to Patient</span>
          </button>
          <button class="hero__create-btn" @click="openCreateNoteModal">
            <v-icon name="hi-plus" scale="0.9" />
            Create Clinical Note
          </button>
        </div>
        <div class="hero__patient-row">
          <div class="hero__avatar">
            <img v-if="getPatientImage()" :src="getPatientImage()" :alt="getPatientName()" @error="$event.target.style.display='none'" />
            <span v-else class="avatar-initials">{{ getPatientInitials() }}</span>
          </div>
          <div class="hero__patient-info">
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="hi-document-text" />
              <span>Patient Clinical Notes</span>
            </div>
            <h1 class="hero__title">{{ getPatientName() }}</h1>
            <div class="hero__patient-meta">
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
        <div class="hero__stats" v-if="notes.length">
          <div class="hero-stat">
            <span class="hero-stat__value">{{ notes.length }}</span>
            <span class="hero-stat__label">Total Notes</span>
          </div>
        </div>
      </div>
      <div class="hero__visual">
        <div class="dashboard-orb">
          <div class="orb-ring orb-ring--1"></div>
          <div class="orb-ring orb-ring--2"></div>
          <div class="orb-ring orb-ring--3"></div>
          <div class="orb-core">
            <v-icon name="hi-document-text" />
          </div>
        </div>
        <div class="floating-icons">
          <div class="float-icon float-icon--1"><v-icon name="hi-pencil-alt" /></div>
          <div class="float-icon float-icon--2"><v-icon name="hi-clipboard-list" /></div>
          <div class="float-icon float-icon--3"><v-icon name="hi-shield-check" /></div>
        </div>
      </div>
    </section>

    <!-- Hero Section: General Mode -->
    <section v-else class="hero">
      <div class="hero__content">
        <div class="hero__badge">
          <div class="badge-pulse"></div>
          <v-icon name="hi-document-text" />
          <span>Clinical Notes</span>
        </div>
        <h1 class="hero__title">
          Clinical<br/>
          <span class="hero__title-accent">Notes</span>
        </h1>
        <p class="hero__subtitle">View and manage your clinical notes from appointments</p>
        <div class="hero__stats" v-if="notes.length">
          <div class="hero-stat">
            <span class="hero-stat__value">{{ notes.length }}</span>
            <span class="hero-stat__label">Total Notes</span>
          </div>
        </div>
      </div>
      <div class="hero__visual">
        <div class="dashboard-orb">
          <div class="orb-ring orb-ring--1"></div>
          <div class="orb-ring orb-ring--2"></div>
          <div class="orb-ring orb-ring--3"></div>
          <div class="orb-core">
            <v-icon name="hi-document-text" />
          </div>
        </div>
        <div class="floating-icons">
          <div class="float-icon float-icon--1"><v-icon name="hi-pencil-alt" /></div>
          <div class="float-icon float-icon--2"><v-icon name="hi-clipboard-list" /></div>
          <div class="float-icon float-icon--3"><v-icon name="hi-shield-check" /></div>
        </div>
      </div>
    </section>

    <!-- Search & Filters -->
    <div class="bento-card filter-card">
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
          class="bento-card note-card"
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
      <div v-else class="bento-card empty-section">
        <div class="empty-section__icon">
          <v-icon name="hi-document-text" scale="1.8" />
        </div>
        <h3>No clinical notes found</h3>
        <p>Clinical notes from your appointments will appear here</p>
      </div>
    </template>

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
              :class="['link-tab-btn', { active: selectedLinkType === 'appointment' }]"
              @click="selectedLinkType = 'appointment'"
            >
              <v-icon name="hi-calendar" scale="0.8" />
              Appointments
              <span class="count">{{ patientAppointments.length }}</span>
            </button>
            <button
              :class="['link-tab-btn', { active: selectedLinkType === 'checkup' }]"
              @click="selectedLinkType = 'checkup'"
            >
              <v-icon name="fa-robot" scale="0.8" />
              Health Checkups
              <span class="count">{{ patientHealthCheckups.length }}</span>
            </button>
            <button
              :class="['link-tab-btn', { active: selectedLinkType === 'none' }]"
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
// ─── Design Tokens ───
$sky: #4FC3F7;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$emerald: #10B981;
$amber: #F59E0B;
$rose: #F43F5E;
$violet: #8B5CF6;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
}

// ─── Page Layout ───
.clinical-notes-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  padding-bottom: 100px;
  background: #F8FAFC;
  min-height: min-content;

  @media (max-width: 768px) {
    padding: 16px;
    padding-bottom: 120px;
    gap: 16px;
  }
}

// ─── Hero Section ───
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 55%, $sky-darker 100%);
  border-radius: 28px;
  padding: 40px 48px;
  min-height: 300px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(2, 136, 209, 0.3);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%);
    pointer-events: none;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 28px 24px;
    min-height: auto;
    border-radius: 20px;
    text-align: center;
  }
}

.hero__content {
  position: relative;
  z-index: 2;
  flex: 1;
  max-width: 600px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 100px;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 16px;

  .ov-icon {
    width: 16px;
    height: 16px;
  }
}

.badge-pulse {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  animation: pulse-glow 2s ease-in-out infinite;
}

.hero__title {
  font-size: 2.75rem;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  margin: 0 0 12px;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
}

.hero__title-accent {
  background: linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 50%, #80DEEA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin: 0 0 24px;
}

// ─── Hero Top Actions (Patient Mode) ───
.hero__top-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}

.hero__back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 16px;
  border-radius: 12px;
  color: white;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.hero__create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 12px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
}

// ─── Hero Patient Row (Patient Mode) ───
.hero__patient-row {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 20px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

.hero__avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;

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

  @media (max-width: 768px) {
    width: 64px;
    height: 64px;

    .avatar-initials {
      font-size: 22px;
    }
  }
}

.hero__patient-info {
  flex: 1;

  .hero__title {
    font-size: 2rem;
    margin-bottom: 8px;

    @media (max-width: 768px) {
      font-size: 1.5rem;
    }
  }
}

.hero__patient-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;

  @media (max-width: 640px) {
    justify-content: center;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.85);
  }
}

// ─── Hero Stats Bar ───
.hero__stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;

  @media (max-width: 768px) {
    gap: 12px;
    padding: 12px 16px;
    justify-content: center;
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.hero-stat__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
}

.hero-stat__label {
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

// ─── Hero Visual / Orb ───
.hero__visual {
  position: relative;
  width: 220px;
  height: 220px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 160px;
    height: 160px;
    margin-top: 20px;
  }
}

.dashboard-orb {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.12);

  &--1 {
    width: 100%;
    height: 100%;
    animation: spin-slow 20s linear infinite;
  }
  &--2 {
    width: 75%;
    height: 75%;
    animation: spin-slow 15s linear infinite reverse;
    border-style: dashed;
  }
  &--3 {
    width: 50%;
    height: 50%;
    animation: spin-slow 10s linear infinite;
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.orb-core {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: pulse-glow 3s ease-in-out infinite;
  z-index: 1;

  .ov-icon {
    width: 28px;
    height: 28px;
  }

  @media (max-width: 768px) {
    width: 48px;
    height: 48px;

    .ov-icon {
      width: 22px;
      height: 22px;
    }
  }
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  .ov-icon {
    width: 16px;
    height: 16px;
  }

  &--1 {
    top: 10%;
    right: 5%;
    animation: float-1 6s ease-in-out infinite;
  }
  &--2 {
    bottom: 15%;
    left: 0;
    animation: float-2 7s ease-in-out infinite;
  }
  &--3 {
    top: 50%;
    right: -5%;
    animation: float-3 8s ease-in-out infinite;
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    border-radius: 8px;

    .ov-icon {
      width: 13px;
      height: 13px;
    }
  }
}

// ─── Bento Cards ───
.bento-card {
  @include glass-card;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 16px;
  }
}

// ─── Filter Card ───
.filter-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  transition: all 0.3s ease;

  &:focus-within {
    border-color: $sky;
    box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.12);
    background: white;
  }

  .search-icon {
    color: #94A3B8;
    flex-shrink: 0;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 0.875rem;
    color: #334155;
    background: transparent;

    &::placeholder {
      color: #94A3B8;
    }
  }

  .clear-btn {
    background: rgba(241, 245, 249, 0.8);
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748B;
    transition: all 0.2s ease;
    flex-shrink: 0;

    &:hover {
      background: #E2E8F0;
      color: #334155;
    }
  }
}

.filters-row {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #64748B;
  }

  select {
    padding: 10px 14px;
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 12px;
    font-size: 0.8125rem;
    color: #334155;
    background: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    min-width: 160px;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: $sky;
      box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.12);
    }
  }
}

.filter-actions {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-left: auto;

  @media (max-width: 640px) {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }
}

.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(79, 195, 247, 0.1);
  color: $sky-dark;
  border: none;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(79, 195, 247, 0.18);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.templates-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(79, 195, 247, 0.08);
  color: $sky-dark;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(79, 195, 247, 0.15);
    transform: translateY(-1px);
  }
}

// ─── Notes List ───
.notes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.note-card {
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 24px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.04);

    .card-arrow {
      color: $sky-dark;
      transform: translateX(2px);
    }
  }

  @media (max-width: 768px) {
    padding: 16px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    @media (max-width: 640px) {
      flex-direction: column;
      gap: 8px;
    }
  }

  &__info {
    flex: 1;
  }

  &__patient {
    font-size: 0.9375rem;
    font-weight: 600;
    color: $navy;
    margin: 0 0 2px;
  }

  &__date {
    font-size: 0.75rem;
    color: #64748B;
  }

  &__badges {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__text {
    font-size: 0.875rem;
    line-height: 1.6;
    color: #475569;
    margin: 0 0 16px;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-top: 16px;
    border-top: 1px solid rgba(226, 232, 240, 0.6);
  }

  &__footer-left {
    display: flex;
    align-items: center;
    gap: 20px;
    flex: 1;

    @media (max-width: 640px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }

  &__footer-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__specialist {
    display: flex;
    align-items: center;
    gap: 10px;

    .specialist-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      overflow: hidden;
      background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
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
        font-size: 0.8125rem;
        font-weight: 600;
        color: #1E293B;
      }

      .specialist-specialty {
        font-size: 0.6875rem;
        color: #64748B;
      }
    }
  }

  &__meta-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: #64748B;
  }

  .card-arrow {
    color: #94A3B8;
    transition: all 0.3s ease;
  }

  &__prescription-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    border: none;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 8px 14px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 195, 247, 0.4);
    }
  }
}

// ─── Status Badges ───
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 0.6875rem;
  font-weight: 600;

  &--zoom {
    background: rgba(59, 130, 246, 0.1);
    color: #2563EB;
  }

  &--custom {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }

  &--completed {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }

  &--progress {
    background: rgba(245, 158, 11, 0.1);
    color: #D97706;
  }

  &--prescription {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    background: rgba(79, 195, 247, 0.1);
    color: $sky-dark;
  }

  &--clickable {
    cursor: pointer;
    border: none;
    transition: all 0.25s ease;

    &:hover {
      background: rgba(79, 195, 247, 0.2);
      transform: scale(1.05);
    }
  }
}

// ─── Empty State ───
.empty-section {
  text-align: center;
  padding: 48px 24px;

  &__icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(79, 195, 247, 0.12) 0%, rgba(79, 195, 247, 0.04) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1E293B;
    margin: 0 0 8px;
  }

  p {
    font-size: 0.875rem;
    color: #64748B;
    margin: 0;
  }
}

// ─── Skeleton Loading ───
.skeleton-card {
  @include glass-card;
  height: 140px;
  background: linear-gradient(90deg,
    rgba(255,255,255,0.92) 25%,
    rgba(248,250,252,0.95) 50%,
    rgba(255,255,255,0.92) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

// ─── Rx Modal ───
.rx-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.rx-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(226, 232, 240, 0.6);

    h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      font-weight: 600;
      color: #1E293B;
      margin: 0;
    }
  }

  &__close {
    background: rgba(241, 245, 249, 0.8);
    border: none;
    color: #64748B;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      background: #E2E8F0;
      color: #1E293B;
    }
  }

  &__loading {
    padding: 24px;

    .skeleton-item {
      height: 80px;
      background: linear-gradient(90deg, #F1F5F9 25%, #F8FAFC 50%, #F1F5F9 75%);
      background-size: 200% 100%;
      border-radius: 12px;
      margin-bottom: 12px;
      animation: shimmer 1.5s infinite;
    }
  }

  &__body {
    padding: 20px 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.rx-card {
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: rgba(248, 250, 252, 0.8);
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__number {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1E293B;
  }

  &__status {
    font-size: 0.6875rem;
    padding: 2px 8px;
    border-radius: 6px;
    font-weight: 500;
    text-transform: capitalize;
  }

  &__view {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: $sky-dark;
    background: none;
    border: none;
    cursor: pointer;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }

  &__items {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.rx-item {
  &__name {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #1E293B;
    margin-bottom: 4px;

    svg { color: $sky-dark; }
  }

  &__details {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    padding-left: 20px;
  }

  &__tag {
    font-size: 0.6875rem;
    background: #F1F5F9;
    padding: 2px 6px;
    border-radius: 4px;
    color: #64748B;
  }

  &__qty {
    font-size: 0.6875rem;
    font-weight: 600;
    color: $sky-dark;
  }
}

.rx-status--draft {
  background: #F1F5F9;
  color: #64748B;
}

.rx-status--pending_payment {
  background: rgba(245, 158, 11, 0.1);
  color: #D97706;
}

.rx-status--paid, .rx-status--delivered {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.rx-status--processing, .rx-status--dispensed, .rx-status--shipped {
  background: rgba(79, 195, 247, 0.1);
  color: $sky-dark;
}

.rx-status--cancelled {
  background: rgba(239, 68, 68, 0.1);
  color: #DC2626;
}

// ─── Link Selector Modal ───
.link-selector-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
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
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);

  h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1E293B;
    margin: 0;

    svg {
      color: $sky-dark;
    }
  }

  .close-btn {
    background: none;
    border: none;
    color: #94A3B8;
    cursor: pointer;
    padding: 8px;
    border-radius: 8px;

    &:hover {
      background: #F1F5F9;
      color: #64748B;
    }
  }
}

.link-selector-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;

  .link-description {
    font-size: 0.875rem;
    color: #64748B;
    margin: 0 0 20px;
  }

  .link-type-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
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
    color: #94A3B8;

    svg {
      margin-bottom: 10px;
    }

    p {
      margin: 0;
      font-size: 0.875rem;
    }
  }

  .link-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: #F8FAFC;
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    input[type="radio"] {
      display: none;
    }

    &.selected,
    &:has(input:checked) {
      background: rgba(79, 195, 247, 0.08);
      border-color: $sky;
    }

    &:hover:not(.selected) {
      background: #F1F5F9;
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
        color: #1E293B;
        font-size: 0.875rem;
      }

      .link-item-type {
        font-size: 0.75rem;
        color: #64748B;
        background: #E2E8F0;
        padding: 2px 8px;
        border-radius: 6px;
      }

      .link-item-triage {
        font-size: 0.6875rem;
        padding: 3px 10px;
        border-radius: 20px;
        font-weight: 600;

        &.triage-emergency { background: #FEE2E2; color: #DC2626; }
        &.triage-urgent { background: #FFEDD5; color: #EA580C; }
        &.triage-moderate { background: #FEF3C7; color: #D97706; }
        &.triage-low { background: #D1FAE5; color: #059669; }
        &.triage-default { background: #E2E8F0; color: #64748B; }
      }
    }

    .link-item-meta {
      display: flex;
      gap: 12px;
      font-size: 0.8125rem;
      color: #64748B;
    }

    .check-icon {
      color: $sky;
    }
  }

  .no-link-section {
    .no-link-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 20px;
      background: rgba(79, 195, 247, 0.06);
      border-radius: 12px;

      svg {
        color: $sky;
        flex-shrink: 0;
        margin-top: 2px;
      }

      p {
        margin: 0;
        font-size: 0.875rem;
        color: $sky-dark;
        line-height: 1.5;
      }
    }
  }
}

.link-tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #F1F5F9;
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  transition: all 0.25s ease;

  .count {
    background: #E2E8F0;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 0.75rem;
  }

  &.active {
    background: rgba(79, 195, 247, 0.08);
    border-color: $sky;
    color: $sky-dark;

    .count {
      background: $sky;
      color: white;
    }
  }

  &:hover:not(.active) {
    background: #E2E8F0;
  }
}

.link-selector-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);

  .cancel-btn {
    padding: 10px 20px;
    background: #F1F5F9;
    border: none;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748B;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #E2E8F0;
    }
  }

  .confirm-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border: none;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 195, 247, 0.4);
    }
  }
}

// ─── Animations ───
@keyframes pulse-glow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float-1 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(5deg); }
}

@keyframes float-2 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(-5deg); }
}

@keyframes float-3 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(3deg); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
