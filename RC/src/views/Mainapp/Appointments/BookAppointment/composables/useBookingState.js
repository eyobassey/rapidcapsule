import { ref, computed, reactive } from 'vue';

export function useBookingState(route) {
  const mode = ref(route?.query?.mode || 'new');
  const currentStep = ref(parseInt(route?.query?.step) || 1);

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

  // Reset state
  function reset() {
    mode.value = 'new';
    currentStep.value = 1;
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
  }

  return {
    mode,
    currentStep,
    specialty,
    specialist,
    schedule,
    payment,
    rescheduleData,
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
    reset,
  };
}
