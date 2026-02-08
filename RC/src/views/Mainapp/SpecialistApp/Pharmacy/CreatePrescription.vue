<template>
  <div class="create-prescription-page">
    <!-- Ambient Background -->
    <div class="ambient-bg">
      <div class="orb orb--1"></div>
      <div class="orb orb--2"></div>
      <div class="orb orb--3"></div>
    </div>

    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="back-btn" @click="goBack">
        <v-icon name="hi-arrow-left" scale="1.1" />
      </button>
      <div class="header-title">
        <v-icon name="ri-capsule-line" scale="0.9" />
        <span>New Prescription</span>
      </div>
      <div class="step-badge">
        {{ currentStep + 1 }}/{{ steps.length }}
      </div>
    </header>

    <!-- Page Container -->
    <div class="page-container">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs">
        <router-link to="/app/specialist/dashboard" class="breadcrumb-item">
          <v-icon name="hi-home" scale="0.75" />
          <span>Dashboard</span>
        </router-link>
        <v-icon name="hi-chevron-right" scale="0.6" class="breadcrumb-sep" />
        <router-link to="/app/specialist/pharmacy" class="breadcrumb-item">
          Pharmacy
        </router-link>
        <v-icon name="hi-chevron-right" scale="0.6" class="breadcrumb-sep" />
        <router-link to="/app/specialist/pharmacy/prescriptions" class="breadcrumb-item">
          Prescriptions
        </router-link>
        <v-icon name="hi-chevron-right" scale="0.6" class="breadcrumb-sep" />
        <span class="breadcrumb-current">Create</span>
      </nav>

      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <div class="hero__badge">
            <div class="badge-pulse"></div>
            <v-icon name="ri-capsule-line" scale="0.85" />
            <span>New Prescription</span>
          </div>
          <h1 class="hero__title">
            {{ steps[currentStep].label }}
            <span class="hero__title-accent">{{ currentStep === 0 ? '' : currentStep === 1 ? '' : '' }}</span>
          </h1>
          <p class="hero__subtitle">
            <template v-if="selectedPatient">
              Prescribing for <strong>{{ selectedPatient.full_name }}</strong>
            </template>
            <template v-else-if="currentStep === 0">
              Select a patient to begin creating their prescription
            </template>
            <template v-else-if="currentStep === 1">
              Add medications and dosage instructions
            </template>
            <template v-else>
              Choose payment method and delivery options
            </template>
          </p>

          <!-- Progress Steps (Inline) -->
          <div class="hero__progress">
            <div
              v-for="(step, index) in steps"
              :key="step.id"
              :class="['progress-step', { active: currentStep === index, completed: currentStep > index }]"
              @click="goToStep(index)"
            >
              <div class="progress-step__circle">
                <v-icon v-if="currentStep > index" name="hi-check" scale="0.7" />
                <span v-else>{{ index + 1 }}</span>
              </div>
              <span class="progress-step__label">{{ step.label }}</span>
            </div>
          </div>
        </div>

        <!-- Hero Visual -->
        <div class="hero__visual">
          <div class="prescription-orb">
            <!-- Glow Effect -->
            <div class="orb-glow"></div>
            <!-- Rotating Rings -->
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <!-- Center -->
            <div class="orb-center">
              <v-icon name="ri-capsule-line" scale="2" />
            </div>
            <!-- Floating Icons -->
            <div class="floating-icons">
              <div class="float-icon float-icon--1">
                <v-icon name="hi-user" scale="1" />
              </div>
              <div class="float-icon float-icon--2">
                <v-icon name="bi-wallet2" scale="0.9" />
              </div>
              <div class="float-icon float-icon--3">
                <v-icon name="hi-truck" scale="0.9" />
              </div>
            </div>
          </div>
          <!-- Floating Stats -->
          <div class="floating-stats">
            <div v-if="selectedPatient" class="float-stat float-stat--patient">
              <RcAvatar
                :model-value="selectedPatient.profile_image"
                :first-name="getFirstName(selectedPatient.full_name)"
                :last-name="getLastName(selectedPatient.full_name)"
                size="xs"
              />
              <span>{{ getFirstName(selectedPatient.full_name) }}</span>
            </div>
            <div v-if="prescriptionItems.length > 0" class="float-stat float-stat--meds">
              <v-icon name="ri-capsule-line" scale="0.7" />
              <span>{{ prescriptionItems.length }}</span>
            </div>
            <div v-if="subtotal > 0" class="float-stat float-stat--price">
              <span>{{ formatCompact(subtotal) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Bento Grid -->
      <div class="bento-grid">
        <!-- Main Content Area (8 cols) -->
        <div class="bento-card bento-card--main">
          <!-- Step Content -->
          <StepPatientSelect
            v-if="currentStep === 0"
            :selectedPatient="selectedPatient"
            :preSelectedDrug="preSelectedDrug"
            :loadingPreSelectedDrug="loadingPreSelectedDrug"
            @select-patient="onPatientSelect"
          />

          <StepMedications
            v-if="currentStep === 1"
            :items="prescriptionItems"
            :subtotal="subtotal"
            @add-drug="addDrug"
            @remove-drug="removeDrug"
            @update-drug="updateDrug"
          />

          <StepLinkRecords
            v-if="currentStep === 1 && selectedPatient"
            :patientId="selectedPatient?._id"
            :preSelectedAppointments="preSelectedAppointments"
            :preSelectedNotes="preSelectedNotes"
            @update:linkedAppointments="linkedAppointments = $event"
            @update:linkedClinicalNotes="linkedClinicalNotes = $event"
          />

          <StepPaymentDelivery
            v-if="currentStep === 2"
            :paymentMethod="paymentMethod"
            :deliveryType="deliveryType"
            :prescriptionNotes="prescriptionNotes"
            :walletBalance="walletBalance"
            :patientWalletBalance="patientWalletBalance"
            :loadingPatientWallet="loadingPatientWallet"
            :allowPatientWalletCharge="allowPatientWalletCharge"
            :remainingPaymentMethod="remainingPaymentMethod"
            :subtotal="subtotal"
            :itemCount="prescriptionItems.length"
            :patientName="selectedPatient?.full_name || ''"
            :savedAddresses="savedAddresses"
            :profileAddress="profileAddress"
            :selectedAddressId="selectedAddressId"
            :selectedAddress="selectedAddress"
            :newAddress="newAddress"
            :saveNewAddress="saveNewAddress"
            :selectedPickupCenter="selectedPickupCenter"
            :selectedPickupCenterId="selectedPickupCenterId"
            @update:paymentMethod="paymentMethod = $event"
            @update:deliveryType="onDeliveryTypeChange($event)"
            @update:prescriptionNotes="prescriptionNotes = $event"
            @update:remainingPaymentMethod="remainingPaymentMethod = $event"
            @update:saveNewAddress="saveNewAddress = $event"
            @select-address="selectAddress"
            @select-new-address="selectNewAddress"
            @update-address-field="updateAddressField"
            @select-pickup-center="selectPickupCenter"
            @clear-pickup-center="clearPickupCenter"
          />
        </div>

        <!-- Sidebar (4 cols) -->
        <div class="bento-sidebar">
          <!-- Summary Card -->
          <div class="bento-card bento-card--summary">
            <div class="card-header">
              <h3>Prescription Summary</h3>
            </div>

            <!-- Patient Info -->
            <div v-if="selectedPatient" class="summary-patient">
              <RcAvatar
                :model-value="selectedPatient.profile_image"
                :first-name="getFirstName(selectedPatient.full_name)"
                :last-name="getLastName(selectedPatient.full_name)"
                size="sm"
              />
              <div class="summary-patient__info">
                <p class="summary-patient__name">{{ selectedPatient.full_name }}</p>
                <p class="summary-patient__email">{{ selectedPatient.email }}</p>
              </div>
            </div>
            <div v-else class="summary-empty">
              <v-icon name="hi-user" scale="1" />
              <span>No patient selected</span>
            </div>

            <!-- Summary Stats -->
            <div class="summary-stats">
              <div class="summary-stat">
                <div class="summary-stat__icon emerald">
                  <v-icon name="ri-capsule-line" scale="0.9" />
                </div>
                <div class="summary-stat__info">
                  <span class="summary-stat__value">{{ prescriptionItems.length }}</span>
                  <span class="summary-stat__label">Medications</span>
                </div>
              </div>
              <div class="summary-stat">
                <div class="summary-stat__icon sky">
                  <v-icon name="bi-wallet2" scale="0.9" />
                </div>
                <div class="summary-stat__info">
                  <span class="summary-stat__value">{{ formatCurrency(subtotal) }}</span>
                  <span class="summary-stat__label">Total Amount</span>
                </div>
              </div>
            </div>

            <!-- Delivery Type -->
            <div v-if="currentStep === 2" class="summary-delivery">
              <v-icon :name="deliveryType === 'DELIVERY' ? 'hi-truck' : 'hi-office-building'" scale="0.85" />
              <span>{{ deliveryType === 'DELIVERY' ? 'Home Delivery' : deliveryType === 'PICKUP_CENTER' ? 'Pickup Center' : 'Self Pickup' }}</span>
            </div>
          </div>

          <!-- Info Cards -->
          <div class="info-cards">
            <!-- Allergy Status -->
            <div
              v-if="selectedPatient"
              :class="['info-card', patientAllergies.length > 0 ? 'info-card--warning' : 'info-card--success']"
            >
              <div class="info-card__icon">
                <v-icon :name="patientAllergies.length > 0 ? 'hi-exclamation-triangle' : 'hi-shield-check'" scale="0.9" />
              </div>
              <div class="info-card__content">
                <span class="info-card__title">
                  {{ patientAllergies.length > 0 ? 'Allergy Alert' : 'No Allergies' }}
                </span>
                <span class="info-card__text">
                  {{ patientAllergies.length > 0 ? formatAllergies(patientAllergies) : 'No known allergies' }}
                </span>
              </div>
            </div>

            <!-- Linked Records -->
            <div
              v-if="preSelectedAppointments.length > 0 || preSelectedNotes.length > 0"
              class="info-card info-card--violet"
            >
              <div class="info-card__icon">
                <v-icon name="hi-link" scale="0.9" />
              </div>
              <div class="info-card__content">
                <span class="info-card__title">Linked Records</span>
                <span class="info-card__text">
                  {{ preSelectedAppointments.length > 0 ? 'Appointment' : '' }}
                  {{ preSelectedAppointments.length > 0 && preSelectedNotes.length > 0 ? ' & ' : '' }}
                  {{ preSelectedNotes.length > 0 ? 'Clinical Note' : '' }}
                </span>
              </div>
            </div>

            <!-- Wallet Balance -->
            <div class="info-card info-card--sky">
              <div class="info-card__icon">
                <v-icon name="bi-wallet2" scale="0.9" />
              </div>
              <div class="info-card__content">
                <span class="info-card__title">Wallet Balance</span>
                <span class="info-card__text">{{ formatCurrency(walletBalance) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Footer -->
      <div class="nav-footer">
        <div class="nav-left">
          <button
            v-if="currentStep > 0"
            class="nav-btn nav-btn--secondary"
            @click="prevStep"
          >
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <button
            v-else
            class="nav-btn nav-btn--ghost"
            @click="$router.back()"
          >
            <v-icon name="hi-x" scale="0.85" />
            <span>Cancel</span>
          </button>
        </div>

        <!-- Progress Dots (Mobile) -->
        <div class="nav-progress">
          <div
            v-for="(step, index) in steps"
            :key="step.id"
            :class="['progress-dot', { active: currentStep === index, completed: currentStep > index }]"
          ></div>
        </div>

        <div class="nav-right">
          <button
            v-if="currentStep < steps.length - 1"
            class="nav-btn nav-btn--primary"
            :disabled="!canProceed"
            @click="nextStep"
          >
            <span>Continue</span>
            <v-icon name="hi-arrow-right" scale="0.85" />
          </button>
          <button
            v-else
            class="nav-btn nav-btn--success"
            :disabled="!canSubmit || submitting"
            @click="submitPrescription"
          >
            <span v-if="submitting" class="btn-spinner"></span>
            <v-icon v-else name="hi-check" scale="0.9" />
            <span>{{ submitting ? 'Creating...' : 'Create Prescription' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import RcAvatar from '@/components/RCAvatar';
import apiFactory from '@/services/apiFactory';
import { usePharmacy } from './composables/usePharmacy';
import StepPatientSelect from './components/create-prescription/StepPatientSelect.vue';
import StepMedications from './components/create-prescription/StepMedications.vue';
import StepPaymentDelivery from './components/create-prescription/StepPaymentDelivery.vue';
import StepLinkRecords from './components/create-prescription/StepLinkRecords.vue';

const router = useRouter();
const route = useRoute();
const $toast = useToast();
const { formatCurrency } = usePharmacy();

function getFirstName(name) {
  if (!name) return '';
  return name.split(' ')[0] || '';
}

function getLastName(name) {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function formatCompact(amount) {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
  if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
  return amount.toLocaleString();
}

function formatAllergies(allergies) {
  if (!allergies || allergies.length === 0) return '';
  const formatted = allergies.slice(0, 2).map(a => {
    if (typeof a === 'string') return a;
    return a.name || a.allergen || a;
  }).join(', ');
  return allergies.length > 2 ? `${formatted} +${allergies.length - 2}` : formatted;
}

function goToStep(index) {
  if (index < currentStep.value) {
    currentStep.value = index;
  }
}

// Steps
const steps = [
  { id: 'patient', label: 'Select Patient' },
  { id: 'medications', label: 'Add Medications' },
  { id: 'payment', label: 'Payment & Delivery' },
];
const currentStep = ref(0);

// Patient
const selectedPatient = ref(null);
const patientAllergies = ref([]);
const loadingAllergies = ref(false);

// Pre-selected Drug
const preSelectedDrug = ref(null);
const loadingPreSelectedDrug = ref(false);

// Prescription Items
const prescriptionItems = ref([]);

// Linked Records
const linkedAppointments = ref([]);
const linkedClinicalNotes = ref([]);
const preSelectedAppointments = ref([]);
const preSelectedNotes = ref([]);

// Payment & Delivery
const paymentMethod = ref('specialist_wallet');
const deliveryType = ref('PICKUP');
const prescriptionNotes = ref('');
const walletBalance = ref(0);
const patientWalletBalance = ref(0);
const loadingPatientWallet = ref(false);
const allowPatientWalletCharge = ref(true);
const remainingPaymentMethod = ref('online');

// Delivery Address
const savedAddresses = ref([]);
const profileAddress = ref(null);
const selectedAddressId = ref(null);
const selectedAddress = ref(null);
const saveNewAddress = ref(true);
const newAddress = ref({
  label: 'Home',
  recipient_name: '',
  phone: '',
  street: '',
  city: '',
  state: '',
  postal_code: '',
  additional_info: '',
});

// Pickup Center
const selectedPickupCenter = ref(null);
const selectedPickupCenterId = ref(null);

// Submission
const submitting = ref(false);

// Computed
const subtotal = computed(() => {
  return prescriptionItems.value.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
});

const canProceed = computed(() => {
  if (currentStep.value === 0) return !!selectedPatient.value;
  if (currentStep.value === 1) {
    return prescriptionItems.value.length > 0 &&
      prescriptionItems.value.every(item => item.quantity > 0 && item.dosage && item.frequency && item.duration);
  }
  return true;
});

const canSubmit = computed(() => {
  if (!canProceed.value || !paymentMethod.value) return false;

  if (deliveryType.value === 'DELIVERY') {
    if (selectedAddressId.value === 'new' || (!savedAddresses.value.length && !profileAddress.value)) {
      const addr = newAddress.value;
      return !!(addr.label && addr.recipient_name && addr.phone && addr.street && addr.city && addr.state);
    }
    return !!selectedAddressId.value;
  }

  if (deliveryType.value === 'PICKUP_CENTER') {
    return !!selectedPickupCenterId.value;
  }

  return true;
});

const deliveryAddressForSubmit = computed(() => {
  if (deliveryType.value !== 'DELIVERY') return null;
  if (selectedAddressId.value && selectedAddressId.value !== 'new') {
    return selectedAddress.value;
  }
  return { ...newAddress.value, country: 'Nigeria' };
});

// Lifecycle
onMounted(async () => {
  const patientId = route.query.patient;
  if (patientId) {
    await loadPatient(patientId);
    await loadPatientAddresses(patientId);
  }

  const drugId = route.query.drug;
  const batchId = route.query.batch;
  if (drugId) {
    await loadPreSelectedDrug(drugId, batchId);
  }

  const linkAppointment = route.query.linkAppointment;
  if (linkAppointment) {
    preSelectedAppointments.value = [linkAppointment];
    linkedAppointments.value = [linkAppointment];
  }
  const linkNote = route.query.linkNote;
  if (linkNote) {
    const [apptId, noteId] = linkNote.split(':');
    if (apptId && noteId) {
      preSelectedNotes.value = [{ appointment_id: apptId, note_id: noteId }];
      linkedClinicalNotes.value = [{ appointment_id: apptId, note_id: noteId }];
      if (!preSelectedAppointments.value.includes(apptId)) {
        preSelectedAppointments.value.push(apptId);
        linkedAppointments.value.push(apptId);
      }
    }
  }

  await fetchWalletBalance();
});

// Methods
async function loadPatient(patientId) {
  try {
    const response = await apiFactory.$_getPharmacyPatientDetails(patientId);
    const result = response.data?.data || response.data?.result;
    if (result) selectedPatient.value = result;
  } catch (error) {
    console.error('Error loading patient:', error);
  }
}

async function loadPreSelectedDrug(drugId, batchId = null) {
  try {
    loadingPreSelectedDrug.value = true;
    const params = batchId ? { batch_id: batchId } : {};
    const response = await apiFactory.$_getPharmacyDrugDetails(drugId, params);
    const result = response.data?.data || response.data?.result;
    if (result) {
      preSelectedDrug.value = { ...result, batch_id: batchId || result.batch_id };
      $toast.info(`${result.name} will be added to your prescription`);
    }
  } catch (error) {
    console.error('Error loading pre-selected drug:', error);
    $toast.error('Failed to load the selected medication');
  } finally {
    loadingPreSelectedDrug.value = false;
  }
}

async function fetchWalletBalance() {
  try {
    const response = await apiFactory.$_getSpecialistWallet();
    const result = response.data?.data || response.data?.result;
    if (result) walletBalance.value = result.available_balance || 0;
  } catch (error) {
    console.error('Error fetching wallet:', error);
  }
}

async function fetchPatientWalletBalance(patientId) {
  if (!patientId) return;
  try {
    loadingPatientWallet.value = true;
    const response = await apiFactory.$_getPatientWalletBalance(patientId);
    const result = response.data?.data || response.data?.result;
    if (result) {
      patientWalletBalance.value = result.available_balance || 0;
      allowPatientWalletCharge.value = result.allow_specialist_charge !== false;
    }
  } catch (error) {
    console.error('Error fetching patient wallet:', error);
    patientWalletBalance.value = 0;
    allowPatientWalletCharge.value = true;
  } finally {
    loadingPatientWallet.value = false;
  }
}

function onPatientSelect(patient) {
  selectedPatient.value = patient;
  resetDeliveryAddresses();
  loadPatientAddresses(patient._id);
  fetchPatientWalletBalance(patient._id);
  fetchPatientAllergies(patient._id);
}

async function fetchPatientAllergies(patientId) {
  try {
    loadingAllergies.value = true;
    const response = await apiFactory.$_getPharmacyPatientMedicalHistory(patientId);
    const data = response.data?.data || response.data?.result || response.data;
    patientAllergies.value = data?.allergies || [];
  } catch (error) {
    console.error('Error fetching patient allergies:', error);
    patientAllergies.value = [];
  } finally {
    loadingAllergies.value = false;
  }
}

async function loadPatientAddresses(patientId) {
  try {
    const response = await apiFactory.$_getPatientDeliveryAddresses(patientId);
    const result = response.data?.data || response.data?.result;
    if (result) {
      savedAddresses.value = result.addresses || [];
      profileAddress.value = result.profile_address;

      const defaultAddr = savedAddresses.value.find(a => a.is_default);
      if (defaultAddr) {
        selectAddress(defaultAddr);
      } else if (profileAddress.value) {
        selectAddress(profileAddress.value);
      }
    }
  } catch (error) {
    console.error('Error loading addresses:', error);
  }
}

function resetDeliveryAddresses() {
  savedAddresses.value = [];
  profileAddress.value = null;
  selectedAddressId.value = null;
  selectedAddress.value = null;
  newAddress.value = {
    label: 'Home', recipient_name: '', phone: '',
    street: '', city: '', state: '', postal_code: '', additional_info: '',
  };
}

function selectAddress(address) {
  selectedAddressId.value = address._id || 'profile_address';
  selectedAddress.value = {
    recipient_name: address.recipient_name,
    phone: address.phone,
    street: address.street,
    city: address.city,
    state: address.state,
    country: address.country || 'Nigeria',
    postal_code: address.postal_code || '',
    additional_info: address.additional_info || '',
  };
}

function selectNewAddress() {
  selectedAddressId.value = 'new';
  selectedAddress.value = null;
  if (selectedPatient.value) {
    newAddress.value.recipient_name = selectedPatient.value.full_name || '';
    newAddress.value.phone = selectedPatient.value.phone || '';
  }
}

function updateAddressField({ field, value }) {
  newAddress.value = { ...newAddress.value, [field]: value };
}

function onDeliveryTypeChange(type) {
  deliveryType.value = type;
  if (type !== 'PICKUP_CENTER') {
    selectedPickupCenter.value = null;
    selectedPickupCenterId.value = null;
  }
}

function selectPickupCenter(center) {
  selectedPickupCenter.value = center;
  selectedPickupCenterId.value = center._id;
}

function clearPickupCenter() {
  selectedPickupCenter.value = null;
  selectedPickupCenterId.value = null;
}

// Drug management
function addDrug(item) {
  prescriptionItems.value.push(item);
}

function removeDrug(index) {
  prescriptionItems.value.splice(index, 1);
}

function updateDrug({ index, item }) {
  prescriptionItems.value[index] = item;
}

function addPreSelectedDrugToList() {
  if (!preSelectedDrug.value) return;
  const drug = preSelectedDrug.value;

  if (drug.is_out_of_stock || drug.quantity === 0) {
    $toast.error('This medication is out of stock');
    preSelectedDrug.value = null;
    return;
  }

  const duplicateKey = drug.batch_id ? `${drug._id}-${drug.batch_id}` : drug._id;
  const exists = prescriptionItems.value.find(item => {
    const itemKey = item.batch_id ? `${item.drug_id}-${item.batch_id}` : item.drug_id;
    return itemKey === duplicateKey;
  });

  if (exists) {
    $toast.warning('This medication is already in the list');
    preSelectedDrug.value = null;
    return;
  }

  prescriptionItems.value.push({
    drug_id: drug._id,
    batch_id: drug.batch_id || null,
    batch_number: drug.batch_number || null,
    drug_name: drug.name,
    generic_name: drug.generic_name,
    strength: drug.strength,
    dosage_form: drug.dosage_form,
    manufacturer: drug.manufacturer || null,
    unit_price: drug.selling_price,
    quantity: 1,
    available_quantity: drug.quantity,
    expiry_date: drug.expiry_date || null,
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
  });

  preSelectedDrug.value = null;
}

// Navigation
function nextStep() {
  if (currentStep.value === 0 && preSelectedDrug.value) {
    addPreSelectedDrugToList();
  }
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function goBack() {
  if (currentStep.value > 0) {
    prevStep();
  } else {
    router.back();
  }
}

// Submission
async function submitPrescription() {
  try {
    submitting.value = true;

    if (deliveryType.value === 'DELIVERY' && selectedAddressId.value === 'new' && saveNewAddress.value) {
      await saveDeliveryAddress();
    }

    const payload = {
      patient_id: selectedPatient.value._id,
      items: prescriptionItems.value.map(item => ({
        drug_id: item.drug_id,
        batch_id: item.batch_id || undefined,
        quantity: item.quantity,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.notes,
      })),
      payment_method: paymentMethod.value,
      delivery_address: deliveryAddressForSubmit.value,
      patient_notes: prescriptionNotes.value,
      is_pickup_order: deliveryType.value === 'PICKUP_CENTER',
      pickup_pharmacy_id: deliveryType.value === 'PICKUP_CENTER' ? selectedPickupCenterId.value : undefined,
      linked_appointments: linkedAppointments.value.length ? linkedAppointments.value : undefined,
      linked_clinical_notes: linkedClinicalNotes.value.length ? linkedClinicalNotes.value : undefined,
    };

    const response = await apiFactory.$_createSpecialistPrescription(payload);
    const createResult = response.data?.data || response.data?.result;

    if (createResult) {
      $toast.success('Prescription created successfully');
      const prescriptionId = createResult.prescription?._id || createResult._id;

      await handlePostCreationPayment(prescriptionId);
      router.push(`/app/specialist/pharmacy/prescriptions/${prescriptionId}`);
    }
  } catch (error) {
    console.error('Error creating prescription:', error);
    $toast.error(error.response?.data?.message || 'Failed to create prescription');
  } finally {
    submitting.value = false;
  }
}

async function handlePostCreationPayment(prescriptionId) {
  try {
    if (paymentMethod.value === 'specialist_wallet') {
      await apiFactory.$_payPrescriptionFromWallet(prescriptionId);
      $toast.success('Payment completed from wallet');
    } else if (paymentMethod.value === 'patient_wallet') {
      const isPartial = patientWalletBalance.value < subtotal.value;
      const walletPayload = {
        allow_partial: isPartial,
        remaining_payment_method: isPartial ? remainingPaymentMethod.value : undefined,
      };
      const payResult = await apiFactory.$_payPrescriptionFromPatientWallet(prescriptionId, walletPayload);
      const payData = payResult.data?.data || payResult.data?.result;

      if (payData?.is_partial_payment) {
        $toast.info(`NGN ${formatCurrency(payData.wallet_amount_paid)} charged from patient wallet. Remaining: NGN ${formatCurrency(payData.remaining_amount)}`);
      } else {
        $toast.success('Payment completed from patient wallet');
      }
    } else if (paymentMethod.value === 'patient_online') {
      await apiFactory.$_sendPrescriptionPaymentLink(prescriptionId, {
        email: selectedPatient.value.email,
      });
      $toast.info('Payment link sent to patient');
    } else if (paymentMethod.value === 'send_to_patient') {
      await apiFactory.$_sendPrescriptionToPatient(prescriptionId);
      $toast.success('Prescription sent to patient');
    }
  } catch (payError) {
    console.error('Post-creation payment error:', payError);
    $toast.warning(payError.response?.data?.message || 'Prescription created but payment action failed');
  }
}

async function saveDeliveryAddress() {
  if (!selectedPatient.value || !saveNewAddress.value) return;
  try {
    await apiFactory.$_addPatientDeliveryAddress(
      selectedPatient.value._id,
      newAddress.value
    );
  } catch (error) {
    console.error('Error saving address:', error);
  }
}
</script>

<style scoped lang="scss">
// ============================================
// DESIGN SYSTEM TOKENS
// ============================================
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

// ============================================
// MIXINS
// ============================================
@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

// ============================================
// BASE LAYOUT
// ============================================
.create-prescription-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
  overflow-x: hidden;
}

// ============================================
// AMBIENT BACKGROUND
// ============================================
.ambient-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float-orb 20s ease-in-out infinite;

  &--1 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, rgba($sky, 0.3), rgba($sky-dark, 0.2));
    top: -100px;
    right: -100px;
  }

  &--2 {
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, rgba($violet, 0.2), rgba($sky, 0.15));
    bottom: 30%;
    left: -80px;
    animation-delay: -7s;
  }

  &--3 {
    width: 250px;
    height: 250px;
    background: linear-gradient(135deg, rgba($emerald, 0.15), rgba($sky, 0.1));
    bottom: -50px;
    right: 20%;
    animation-delay: -14s;
  }
}

@keyframes float-orb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.05); }
  50% { transform: translate(-10px, 10px) scale(0.95); }
  75% { transform: translate(-20px, -10px) scale(1.02); }
}

// ============================================
// MOBILE HEADER
// ============================================
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    display: flex;
  }

  .back-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: $bg;
    color: $slate;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;

    &:active {
      background: #E2E8F0;
    }
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: $navy;

    svg { color: $sky-dark; }
  }

  .step-badge {
    padding: 6px 12px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    font-size: 12px;
    font-weight: 600;
    border-radius: 16px;
  }
}

// ============================================
// PAGE CONTAINER
// ============================================
.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 120px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 16px 16px 140px;
  }
}

// ============================================
// BREADCRUMBS
// ============================================
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 13px;

  @media (max-width: 768px) {
    display: none;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: $gray;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: $sky-dark;
    }
  }

  .breadcrumb-sep {
    color: $light-gray;
  }

  .breadcrumb-current {
    color: $navy;
    font-weight: 500;
  }
}

// ============================================
// HERO SECTION
// ============================================
.hero {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 48px;
  padding: 48px 56px;
  min-height: 320px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 32px;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
  align-items: center;
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
    padding: 36px 32px;
    gap: 32px;
    min-height: auto;
  }

  @media (max-width: 768px) {
    padding: 28px 24px;
    border-radius: 24px;
    margin-bottom: 20px;
  }
}

.hero__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 2;
  position: relative;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  margin-bottom: 16px;
  width: fit-content;

  .badge-pulse {
    width: 8px;
    height: 8px;
    background: #4ade80;
    border-radius: 50%;
    animation: pulse-glow 2s ease-in-out infinite;
  }

  svg { color: white; }

  span {
    font-size: 13px;
    font-weight: 600;
    color: white;
    letter-spacing: 0.3px;
  }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
}

.hero__title {
  font-size: 56px;
  font-weight: 800;
  color: white;
  margin: 0 0 16px;
  line-height: 1.05;
  letter-spacing: -0.03em;

  @media (max-width: 1024px) {
    font-size: 44px;
  }

  @media (max-width: 768px) {
    font-size: 36px;
  }
}

.hero__title-accent {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin: 0 0 24px;
  line-height: 1.5;
  max-width: 320px;

  strong {
    color: white;
    font-weight: 600;
  }

  @media (max-width: 1024px) {
    max-width: 100%;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 20px;
  }
}

// Progress Steps (Inline in Hero)
.hero__progress {
  display: flex;
  gap: 8px;

  @media (max-width: 768px) {
    display: none;
  }
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover:not(.active) {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.2);
  }

  &__circle {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    color: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    transition: all 0.2s;
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
    transition: color 0.2s;

    @media (max-width: 1100px) {
      display: none;
    }
  }

  &.active {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.3);

    .progress-step__circle {
      background: white;
      color: $sky-dark;
    }

    .progress-step__label {
      color: white;
      font-weight: 600;
    }
  }

  &.completed {
    .progress-step__circle {
      background: $emerald;
      color: white;
    }
  }
}

// Hero Visual
.hero__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 240px;

  @media (max-width: 1024px) {
    display: none;
  }
}

// Prescription Orb (Enhanced)
.prescription-orb {
  position: relative;
  width: 180px;
  height: 180px;
}

.orb-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: orb-pulse 3s ease-in-out infinite;
}

@keyframes orb-pulse {
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
    inset: 15px;
    border-style: dashed;
    animation: spin-slow 15s linear infinite reverse;
  }

  &--3 {
    inset: 30px;
    animation: spin-slow 25s linear infinite;
  }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.orb-center {
  position: absolute;
  inset: 45px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 50px rgba(255, 255, 255, 0.25);
}

// Floating Icons
.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: float 6s ease-in-out infinite;

  &--1 {
    width: 52px;
    height: 52px;
    top: 0;
    left: 0;
    animation-delay: 0s;
  }

  &--2 {
    width: 46px;
    height: 46px;
    top: 20px;
    right: -10px;
    animation-delay: -2s;
  }

  &--3 {
    width: 44px;
    height: 44px;
    bottom: 10px;
    left: 10px;
    animation-delay: -4s;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(3deg); }
  75% { transform: translateY(6px) rotate(-2deg); }
}

// Floating Stats
.floating-stats {
  position: absolute;
  inset: -30px;
  z-index: 5;
}

.float-stat {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: float-subtle 3s ease-in-out infinite;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

  &--patient {
    top: -15px;
    left: 50%;
    transform: translateX(-50%);
  }

  &--meds {
    bottom: 25px;
    right: -20px;
    animation-delay: 1s;
  }

  &--price {
    bottom: 25px;
    left: -20px;
    animation-delay: 2s;
  }
}

@keyframes float-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

// ============================================
// BENTO GRID
// ============================================
.bento-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  margin-bottom: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr 320px;
    gap: 20px;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;
  }
}

.bento-card--main {
  display: flex;
  flex-direction: column;
  gap: 20px;

  :deep(.step-patient-select),
  :deep(.step-medications),
  :deep(.step-payment-delivery),
  :deep(.step-link-records) {
    background: transparent;
    padding: 0;
    border-radius: 0;
  }
}

// ============================================
// SIDEBAR
// ============================================
.bento-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 1024px) {
    order: -1;
  }
}

.bento-card--summary {
  .card-header {
    margin-bottom: 20px;

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }
  }
}

// Summary Patient
.summary-patient {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: $bg;
  border-radius: 14px;
  margin-bottom: 20px;

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__email {
    font-size: 12px;
    color: $gray;
    margin: 4px 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.summary-empty {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: $bg;
  border-radius: 14px;
  margin-bottom: 20px;
  color: $gray;

  span {
    font-size: 14px;
  }
}

// Summary Stats
.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-stat {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: $bg;
  border-radius: 12px;

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.emerald { background: $emerald-light; color: $emerald; }
    &.sky { background: $sky-light; color: $sky-dark; }
    &.amber { background: $amber-light; color: $amber; }
    &.violet { background: $violet-light; color: $violet; }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__value {
    font-size: 16px;
    font-weight: 700;
    color: $navy;
  }

  &__label {
    font-size: 12px;
    color: $gray;
  }
}

// Summary Delivery
.summary-delivery {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: $sky-light;
  border-radius: 10px;
  margin-top: 16px;
  color: $sky-dark;
  font-size: 13px;
  font-weight: 500;
}

// ============================================
// INFO CARDS
// ============================================
.info-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-card {
  @include glass-card;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__title {
    display: block;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 2px;
  }

  &__text {
    display: block;
    font-size: 12px;
    opacity: 0.8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  // Color variants
  &--success {
    background: linear-gradient(135deg, $emerald-light, lighten($emerald-light, 3%));
    border-color: rgba($emerald, 0.2);

    .info-card__icon { background: $emerald; color: white; }
    .info-card__title { color: darken($emerald, 15%); }
    .info-card__text { color: darken($emerald, 10%); }
  }

  &--warning {
    background: linear-gradient(135deg, $amber-light, lighten($amber-light, 3%));
    border-color: rgba($amber, 0.2);

    .info-card__icon { background: $amber; color: white; }
    .info-card__title { color: darken($amber, 20%); }
    .info-card__text { color: darken($amber, 15%); }
  }

  &--violet {
    background: linear-gradient(135deg, $violet-light, lighten($violet-light, 3%));
    border-color: rgba($violet, 0.2);

    .info-card__icon { background: $violet; color: white; }
    .info-card__title { color: darken($violet, 15%); }
    .info-card__text { color: darken($violet, 10%); }
  }

  &--sky {
    background: linear-gradient(135deg, $sky-light, lighten($sky-light, 3%));
    border-color: rgba($sky, 0.2);

    .info-card__icon { background: $sky-dark; color: white; }
    .info-card__title { color: $sky-darker; }
    .info-card__text { color: $sky-dark; }
  }
}

// ============================================
// NAVIGATION FOOTER
// ============================================
.nav-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 50;

  @media (min-width: 769px) {
    position: sticky;
    bottom: 0;
    max-width: 1400px;
    margin: 0 auto;
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  }

  @media (max-width: 768px) {
    padding: 12px 16px;
  }

  .nav-left, .nav-right {
    display: flex;
    gap: 12px;
  }

  .nav-progress {
    display: none;

    @media (max-width: 768px) {
      display: flex;
      gap: 6px;
    }

    .progress-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #E2E8F0;
      transition: all 0.2s;

      &.active {
        background: $sky;
        width: 24px;
        border-radius: 4px;
      }

      &.completed {
        background: $emerald;
      }
    }
  }
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 12px 16px;
    font-size: 13px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    box-shadow: 0 4px 15px rgba($sky, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($sky, 0.4);
    }
  }

  &--secondary {
    background: #F1F5F9;
    color: $slate;

    &:hover:not(:disabled) {
      background: #E2E8F0;
    }
  }

  &--ghost {
    background: transparent;
    color: $gray;

    &:hover:not(:disabled) {
      background: #F1F5F9;
      color: $slate;
    }
  }

  &--success {
    background: linear-gradient(135deg, $emerald, darken($emerald, 10%));
    color: white;
    box-shadow: 0 4px 15px rgba($emerald, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($emerald, 0.4);
    }
  }
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
