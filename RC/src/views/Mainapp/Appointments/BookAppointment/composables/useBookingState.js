import { ref, computed, reactive } from 'vue';

export function useBookingState(route) {
  const mode = ref(route?.query?.mode || 'new');
  const currentStep = ref(parseInt(route?.query?.step) || 1);
  const fromHealthCheck = ref(route?.query?.from_health_check === 'true');

  const specialty = reactive({
    professional_category: route?.query?.category || '',
    specialist_category: '',
  });

  const specialist = reactive({
    id: route?.query?.specialistId || '',
    full_name: '',
    profile: null,
    average_rating: null,
    professional_practice: '',
  });

  const schedule = reactive({
    date: '',
    time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    meeting_channel: '',
    meeting_channel_label: '',
  });

  const payment = reactive({
    cards: [],
    selectedCard: null,
    paymentMethod: 'wallet',
    termsAccepted: false,
  });

  const rescheduleData = reactive({
    appointmentId: route?.query?.appointmentId || '',
  });

  // Health check data for prefilling patient notes
  const healthCheckData = reactive({
    checkup_id: route?.query?.checkup_id || '',
    conditions: [],
    symptoms: [],
    triage_level: '',
    patient_note: '',
    assessment_date: '',
  });

  // Patient notes for the appointment
  const patientNotes = ref('');

  // Minimum step based on mode
  const minStep = computed(() => {
    if (mode.value === 'reschedule' || mode.value === 'followup') return 3;
    return 1;
  });

  // Total steps
  const totalSteps = 4;

  // Per-step validation
  const canProceed = computed(() => {
    switch (currentStep.value) {
      case 1:
        return !!specialty.professional_category && !!specialty.specialist_category;
      case 2:
        return !!specialist.id;
      case 3:
        return !!schedule.date && !!schedule.time && !!schedule.timezone && !!schedule.meeting_channel;
      case 4:
        if (mode.value === 'reschedule') {
          return true;
        }
        return payment.termsAccepted;
      default:
        return false;
    }
  });

  // Final payload for creating appointments
  const bookingPayload = computed(() => ({
    category: specialty.professional_category,
    date: schedule.date,
    time: schedule.time,
    timezone: schedule.timezone,
    appointment_type: mode.value === 'followup' ? 'Follow-up' : 'Initial Appointment',
    specialist: specialist.id,
    meeting_channel: schedule.meeting_channel,
    paymentMethod: payment.paymentMethod,
    ...(payment.paymentMethod === 'card' && payment.selectedCard ? { cardId: payment.selectedCard } : {}),
    ...(patientNotes.value ? { patient_notes: patientNotes.value } : {}),
    ...(healthCheckData.checkup_id ? { health_checkup_id: healthCheckData.checkup_id } : {}),
  }));

  // Payload for rescheduling
  const reschedulePayload = computed(() => ({
    appointmentId: rescheduleData.appointmentId,
    date: schedule.date,
    time: schedule.time,
    timezone: schedule.timezone,
    meeting_channel: schedule.meeting_channel,
  }));

  // Page title
  const pageTitle = computed(() => {
    switch (mode.value) {
      case 'reschedule': return 'Reschedule Appointment';
      case 'followup': return 'Book Follow-up';
      default: return 'Book Appointment';
    }
  });

  // Step navigation
  function nextStep() {
    if (currentStep.value < totalSteps && canProceed.value) {
      currentStep.value++;
    }
  }

  function prevStep() {
    if (currentStep.value > minStep.value) {
      currentStep.value--;
    }
  }

  function goToStep(step) {
    if (step >= minStep.value && step <= totalSteps) {
      currentStep.value = step;
    }
  }

  // Set specialist data (used in followup/reschedule modes)
  function setSpecialist(data) {
    specialist.id = data.id || data._id || '';
    specialist.full_name = data.full_name || '';
    specialist.profile = data.profile || null;
    specialist.average_rating = data.average_rating || null;
    specialist.professional_practice = data.professional_practice || '';
  }

  // Set specialty data
  function setSpecialty(data) {
    specialty.professional_category = data.professional_category || '';
    specialty.specialist_category = data.specialist_category || '';
  }

  // Set health check data from session storage
  function setHealthCheckData(data) {
    healthCheckData.checkup_id = data.checkup_id || '';
    healthCheckData.conditions = data.conditions || [];
    healthCheckData.symptoms = data.symptoms || [];
    healthCheckData.triage_level = data.triage_level || '';
    healthCheckData.patient_note = data.patient_note || '';
    healthCheckData.assessment_date = data.assessment_date || '';

    // Pre-fill patient notes if available
    if (data.patient_note) {
      patientNotes.value = data.patient_note;
    }
  }

  // Load health check data from session storage
  function loadHealthCheckFromSession() {
    try {
      const stored = sessionStorage.getItem('healthCheckForBooking');
      if (stored) {
        const data = JSON.parse(stored);
        setHealthCheckData(data);
        return true;
      }
    } catch (e) {
      console.error('Error loading health check data:', e);
    }
    return false;
  }

  // Clear health check session data
  function clearHealthCheckSession() {
    sessionStorage.removeItem('healthCheckForBooking');
  }

  // Reset state
  function reset() {
    mode.value = 'new';
    currentStep.value = 1;
    fromHealthCheck.value = false;
    specialty.professional_category = '';
    specialty.specialist_category = '';
    specialist.id = '';
    specialist.full_name = '';
    specialist.profile = null;
    specialist.average_rating = null;
    specialist.professional_practice = '';
    schedule.date = '';
    schedule.time = '';
    schedule.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    schedule.meeting_channel = '';
    schedule.meeting_channel_label = '';
    payment.cards = [];
    payment.selectedCard = null;
    payment.termsAccepted = false;
    rescheduleData.appointmentId = '';
    healthCheckData.checkup_id = '';
    healthCheckData.conditions = [];
    healthCheckData.symptoms = [];
    healthCheckData.triage_level = '';
    healthCheckData.patient_note = '';
    healthCheckData.assessment_date = '';
    patientNotes.value = '';
  }

  return {
    mode,
    currentStep,
    fromHealthCheck,
    specialty,
    specialist,
    schedule,
    payment,
    rescheduleData,
    healthCheckData,
    patientNotes,
    minStep,
    totalSteps,
    canProceed,
    bookingPayload,
    reschedulePayload,
    pageTitle,
    nextStep,
    prevStep,
    goToStep,
    setSpecialist,
    setSpecialty,
    setHealthCheckData,
    loadHealthCheckFromSession,
    clearHealthCheckSession,
    reset,
  };
}
