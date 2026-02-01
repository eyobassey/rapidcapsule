<template>
  <div class="page-content">
    <TopBar showButtons type="title-only" title="Create Prescription" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="create-prescription-container">
        <!-- Hero Banner -->
        <div class="hero-banner">
          <div class="hero-top">
            <button @click="goBack" class="back-link">
              <v-icon name="hi-arrow-left" scale="0.9" />
              <span>{{ currentStep > 0 ? steps[currentStep - 1].label : 'Back to Pharmacy' }}</span>
            </button>
            <div class="hero-step-indicator">
              Step {{ currentStep + 1 }} of {{ steps.length }}
            </div>
          </div>
          <div class="hero-main">
            <div class="hero-info">
              <span class="hero-badge">
                <v-icon name="ri-capsule-line" scale="0.7" />
                New Prescription
              </span>
              <h1 class="hero-title">{{ steps[currentStep].label }}</h1>
              <p class="hero-subtitle">
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
            </div>
            <div class="hero-stats">
              <div v-if="selectedPatient" class="patient-card">
                <div class="patient-avatar">
                  <RcAvatar
                    :model-value="selectedPatient.profile_image"
                    :first-name="getFirstName(selectedPatient.full_name)"
                    :last-name="getLastName(selectedPatient.full_name)"
                    size="sm"
                  />
                </div>
                <div class="patient-info">
                  <span class="patient-name">{{ selectedPatient.full_name }}</span>
                  <span class="patient-label">Patient</span>
                </div>
              </div>
              <div v-if="prescriptionItems.length > 0" class="stat-card">
                <span class="stat-value">{{ prescriptionItems.length }}</span>
                <span class="stat-label">Medications</span>
              </div>
              <div v-if="subtotal > 0" class="stat-card">
                <span class="stat-value">{{ formatCurrency(subtotal) }}</span>
                <span class="stat-label">Subtotal</span>
              </div>
            </div>
          </div>
          <!-- Linked Records Indicator -->
          <div v-if="preSelectedAppointments.length > 0 || preSelectedNotes.length > 0" class="linked-records-badge">
            <v-icon name="hi-link" scale="0.7" />
            <span>Linked to {{ preSelectedAppointments.length > 0 ? 'appointment' : '' }}{{ preSelectedAppointments.length > 0 && preSelectedNotes.length > 0 ? ' & ' : '' }}{{ preSelectedNotes.length > 0 ? 'clinical note' : '' }}</span>
          </div>
        </div>

        <!-- Allergy Status Banner -->
        <div v-if="selectedPatient && !allergyWarningDismissed" :class="['allergy-banner', patientAllergies.length > 0 ? 'allergy-banner--warning' : 'allergy-banner--safe']">
          <div class="allergy-icon">
            <v-icon :name="patientAllergies.length > 0 ? 'hi-exclamation-triangle' : 'hi-shield-check'" scale="1.2" />
          </div>
          <div class="allergy-content">
            <h4 class="allergy-title">
              {{ patientAllergies.length > 0 ? 'Allergy Warning' : 'Allergy Status' }}
            </h4>
            <p class="allergy-text">
              <template v-if="patientAllergies.length > 0">
                Patient has documented allergies:
                <strong>{{ formatAllergies(patientAllergies) }}</strong>.
                Review medication selection carefully.
              </template>
              <template v-else>
                No known allergies documented for this patient. Always verify with patient before prescribing.
              </template>
            </p>
          </div>
          <button class="allergy-dismiss" @click="dismissAllergyWarning" title="Dismiss">
            <v-icon name="hi-x" scale="0.9" />
          </button>
        </div>

        <!-- Progress Steps -->
        <div class="progress-container">
          <div class="progress-steps-enhanced">
            <div
              v-for="(step, index) in steps"
              :key="step.id"
              :class="['step', { active: currentStep === index, completed: currentStep > index }]"
              @click="goToStep(index)"
            >
              <div class="step-circle">
                <v-icon v-if="currentStep > index" name="hi-check" scale="0.8" />
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div class="step-info">
                <span class="step-label">{{ step.label }}</span>
                <span class="step-desc">{{ getStepDescription(index) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="main-content">
          <!-- Step Content -->
          <div class="step-content">
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
        </div>

        <!-- Navigation Footer -->
        <div class="navigation-footer">
          <div class="nav-left">
            <button
              v-if="currentStep > 0"
              class="nav-btn nav-btn--secondary"
              @click="prevStep"
            >
              <v-icon name="hi-arrow-left" scale="0.8" />
              Back
            </button>
          </div>
          <div class="nav-right">
            <button
              v-if="currentStep < steps.length - 1"
              class="nav-btn nav-btn--primary"
              :disabled="!canProceed"
              @click="nextStep"
            >
              Continue
              <v-icon name="hi-arrow-right" scale="0.8" />
            </button>
            <button
              v-else
              class="nav-btn nav-btn--success"
              :disabled="!canSubmit || submitting"
              @click="submitPrescription"
            >
              <v-icon v-if="!submitting" name="hi-check" scale="0.9" />
              <span v-if="submitting" class="spinner"></span>
              {{ submitting ? 'Creating...' : 'Create Prescription' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import TopBar from '@/components/Navigation/top-bar';
import RcAvatar from '@/components/RCAvatar';
import apiFactory from '@/services/apiFactory';
import { usePharmacy } from './composables/usePharmacy';
import ProgressSteps from './components/create-prescription/ProgressSteps.vue';
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

// Format allergies for display
function formatAllergies(allergies) {
  if (!allergies || allergies.length === 0) return '';
  return allergies.map(a => {
    if (typeof a === 'string') return a;
    const name = a.name || a.allergen || a;
    const severity = a.severity ? ` (${a.severity})` : '';
    return `${name}${severity}`;
  }).join(', ');
}

// Dismiss allergy warning (temporarily)
function dismissAllergyWarning() {
  allergyWarningDismissed.value = true;
}

// Step descriptions for progress indicator
function getStepDescription(index) {
  const descriptions = [
    'Choose patient',
    'Add drugs & dosage',
    'Payment options',
  ];
  return descriptions[index] || '';
}

// Navigate to a specific step (only if completed or current)
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
const allergyWarningDismissed = ref(false);

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

  // Handle linked appointment/note pre-selection
  const linkAppointment = route.query.linkAppointment;
  if (linkAppointment) {
    preSelectedAppointments.value = [linkAppointment];
    linkedAppointments.value = [linkAppointment];
  }
  const linkNote = route.query.linkNote;
  if (linkNote) {
    // Format: appointmentId:noteId
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
  allergyWarningDismissed.value = false; // Reset warning for new patient
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

    // Save new address if needed
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
.page-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #F8FAFC;

  &__body {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    height: 100%;
    overflow-y: auto;
    padding: 0 $size-24 $size-48;

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

    @include responsive(phone) {
      padding: 0 $size-16 $size-32;
    }
  }
}

.create-prescription-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

// Hero Banner - Sky Blue Theme
.hero-banner {
  background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 50%, #0288D1 100%);
  border-radius: $size-24;
  padding: $size-24 $size-32;
  margin-top: $size-24;
  color: white;
  box-shadow: 0 10px 40px rgba(79, 195, 247, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    pointer-events: none;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -5%;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  @media (max-width: 768px) {
    padding: $size-20;
    border-radius: $size-16;
    margin-top: $size-16;
  }
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $size-20;
  position: relative;
  z-index: 1;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: $size-8;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  padding: $size-10 $size-16;
  border-radius: $size-10;
  color: white;
  font-size: $size-14;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateX(-2px);
  }
}

.hero-step-indicator {
  background: rgba(255, 255, 255, 0.2);
  padding: $size-8 $size-16;
  border-radius: $size-20;
  font-size: $size-13;
  font-weight: 600;
}

.hero-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $size-24;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    flex-direction: column;
  }
}

.hero-info {
  flex: 1;

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: $size-6;
    background: rgba(255, 255, 255, 0.2);
    padding: $size-6 $size-14;
    border-radius: $size-16;
    font-size: $size-12;
    font-weight: 600;
    margin-bottom: $size-12;
  }

  .hero-title {
    font-size: $size-28;
    font-weight: 700;
    margin: 0 0 $size-8;
    line-height: 1.2;

    @media (max-width: 768px) {
      font-size: $size-24;
    }
  }

  .hero-subtitle {
    font-size: $size-15;
    opacity: 0.9;
    margin: 0;
    line-height: 1.5;

    strong {
      font-weight: 600;
    }
  }
}

.hero-stats {
  display: flex;
  gap: $size-12;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
  }
}

.patient-card {
  display: flex;
  align-items: center;
  gap: $size-12;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: $size-12 $size-16;
  border-radius: $size-12;

  .patient-avatar {
    flex-shrink: 0;

    :deep(.rc-avatar) {
      border: 2px solid rgba(255, 255, 255, 0.4);
    }
  }

  .patient-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .patient-name {
      font-weight: 600;
      font-size: $size-14;
    }

    .patient-label {
      font-size: $size-11;
      opacity: 0.8;
    }
  }
}

.stat-card {
  background: rgba(255, 255, 255, 0.15);
  padding: $size-12 $size-20;
  border-radius: $size-12;
  text-align: center;
  min-width: 90px;

  .stat-value {
    display: block;
    font-size: $size-22;
    font-weight: 700;
    line-height: 1.2;
  }

  .stat-label {
    display: block;
    font-size: $size-11;
    opacity: 0.85;
    margin-top: 2px;
  }
}

.linked-records-badge {
  display: inline-flex;
  align-items: center;
  gap: $size-8;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: $size-8 $size-16;
  border-radius: $size-20;
  font-size: $size-12;
  font-weight: 500;
  margin-top: $size-16;
  position: relative;
  z-index: 1;
}

// Allergy Status Banner
.allergy-banner {
  display: flex;
  align-items: flex-start;
  gap: $size-16;
  border-radius: $size-12;
  padding: $size-16 $size-20;
  margin-top: $size-20;
  position: relative;
  animation: slideIn 0.3s ease;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .allergy-icon {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .allergy-content {
    flex: 1;

    .allergy-title {
      font-size: $size-16;
      font-weight: 700;
      margin: 0 0 $size-6;
      display: flex;
      align-items: center;
      gap: $size-8;
    }

    .allergy-text {
      font-size: $size-14;
      margin: 0;
      line-height: 1.5;

      strong {
        font-weight: 600;
      }
    }
  }

  .allergy-dismiss {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  // Warning state (has allergies)
  &--warning {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    border: 1px solid #F59E0B;
    border-left: 4px solid #D97706;
    box-shadow: 0 4px 15px rgba(245, 158, 11, 0.15);

    .allergy-icon {
      background: #F59E0B;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .allergy-title {
      color: #92400E;
    }

    .allergy-text {
      color: #78350F;

      strong {
        color: #92400E;
      }
    }

    .allergy-dismiss {
      background: rgba(146, 64, 14, 0.1);
      color: #92400E;

      &:hover {
        background: rgba(146, 64, 14, 0.2);
      }
    }
  }

  // Safe state (no allergies)
  &--safe {
    background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
    border: 1px solid #10B981;
    border-left: 4px solid #059669;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);

    .allergy-icon {
      background: #10B981;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .allergy-title {
      color: #065F46;
    }

    .allergy-text {
      color: #047857;

      strong {
        color: #065F46;
      }
    }

    .allergy-dismiss {
      background: rgba(6, 95, 70, 0.1);
      color: #065F46;

      &:hover {
        background: rgba(6, 95, 70, 0.2);
      }
    }
  }

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;

    .allergy-icon {
      margin: 0 auto;
    }

    .allergy-dismiss {
      position: absolute;
      top: $size-12;
      right: $size-12;
    }
  }
}

// Progress Steps - Enhanced
.progress-container {
  margin: $size-24 0;
}

.progress-steps-enhanced {
  display: flex;
  justify-content: space-between;
  background: white;
  border-radius: $size-16;
  padding: $size-20 $size-24;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: $size-16;
  }
}

.step {
  display: flex;
  align-items: center;
  gap: $size-14;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  position: relative;

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 2px;
    background: #E2E8F0;

    @media (max-width: 768px) {
      display: none;
    }
  }

  &.completed:not(:last-child)::after {
    background: #10B981;
  }

  .step-circle {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #F1F5F9;
    color: #64748B;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $size-16;
    font-weight: 600;
    transition: all 0.3s ease;
    flex-shrink: 0;
  }

  .step-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .step-label {
      font-size: $size-14;
      font-weight: 600;
      color: #64748B;
      transition: color 0.2s;
    }

    .step-desc {
      font-size: $size-12;
      color: #94A3B8;
    }
  }

  &.active {
    .step-circle {
      background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(79, 195, 247, 0.4);
    }

    .step-label {
      color: #1E293B;
    }
  }

  &.completed {
    .step-circle {
      background: #10B981;
      color: white;
    }

    .step-label {
      color: #1E293B;
    }
  }

  &:hover:not(.active) .step-circle {
    transform: scale(1.05);
  }
}

// Main Content
.main-content {
  margin-bottom: $size-24;
}

.step-content {
  display: flex;
  flex-direction: column;
  gap: $size-20;

  :deep(.step-medications),
  :deep(.step-patient-select),
  :deep(.step-payment-delivery),
  :deep(.step-link-records) {
    background: white;
    border-radius: $size-16;
    padding: $size-24;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  }
}

// Navigation Footer
.navigation-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: $size-16;
  padding: $size-20 $size-24;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.04);
  position: sticky;
  bottom: 0;
  margin-top: auto;

  .nav-left, .nav-right {
    display: flex;
    gap: $size-12;
  }
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: $size-8;
  padding: $size-14 $size-28;
  border-radius: $size-12;
  font-size: $size-15;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--primary {
    background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(79, 195, 247, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79, 195, 247, 0.4);
    }
  }

  &--secondary {
    background: #F1F5F9;
    color: #64748B;

    &:hover:not(:disabled) {
      background: #E2E8F0;
    }
  }

  &--success {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Mobile adjustments
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

  .back-link {
    justify-content: center;
  }

  .hero-step-indicator {
    text-align: center;
  }

  .navigation-footer {
    flex-direction: column;
    gap: $size-12;
    padding: $size-16;

    .nav-left, .nav-right {
      width: 100%;
    }

    .nav-btn {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
