import { ref, computed, reactive } from 'vue';
import { format, parseISO } from 'date-fns';

export function useBookingStateV2(route) {
  // Step tracking
  const currentStep = ref(1);
  const totalSteps = 6;

  // Step 1: Service Type
  const serviceType = reactive({
    urgency: '',           // 'routine' | 'urgent'
    method: '',            // 'video' | 'audio' | 'chat'
  });

  // Step 2: Consents
  const consents = reactive({
    telemedicine: false,
    privacy: false,
    doctorMatching: false,
    prescription: false,
  });

  // Step 3: Category
  const category = reactive({
    professional_category: '',
    specialist_category: '',
    aiSuggested: false,
  });

  // Step 4: Schedule
  const schedule = reactive({
    date: '',
    time: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  // Step 5: Specialist
  const specialist = reactive({
    id: '',
    full_name: '',
    profile: null,
    average_rating: null,
    review_count: 0,
    professional_practice: '',
    price: null,
    isDiaspora: false,
  });

  // Step 6: Payment
  const payment = reactive({
    method: 'wallet',      // 'wallet' | 'card'
    selectedCard: null,
    walletBalance: 0,
    cards: [],
    termsAccepted: false,
  });

  // Patient notes and attachments (Step 6)
  const patientNotes = ref('');
  const attachments = ref([]);

  // Step labels for stepper
  const stepLabels = [
    { number: 1, label: 'Service', icon: 'hi-clipboard-list' },
    { number: 2, label: 'Consent', icon: 'hi-badge-check' },
    { number: 3, label: 'Category', icon: 'hi-view-grid' },
    { number: 4, label: 'Time', icon: 'hi-calendar' },
    { number: 5, label: 'Doctor', icon: 'hi-user' },
    { number: 6, label: 'Confirm', icon: 'hi-check-circle' },
  ];

  // Validation per step
  const canProceed = computed(() => {
    switch (currentStep.value) {
      case 1:
        return !!serviceType.urgency && !!serviceType.method && !!appointmentType.value;
      case 2:
        return consents.telemedicine && consents.privacy &&
               consents.doctorMatching && consents.prescription;
      case 3:
        return !!category.specialist_category;
      case 4:
        return !!schedule.date && !!schedule.time;
      case 5:
        return !!specialist.id;
      case 6:
        return payment.termsAccepted;
      default:
        return false;
    }
  });

  // Current step active label
  const currentStepLabel = computed(() => {
    const step = stepLabels.find(s => s.number === currentStep.value);
    return step ? step.label : '';
  });

  // Map method to meeting channel
  const getMeetingChannel = () => {
    switch (serviceType.method) {
      case 'video': return 'zoom';
      case 'audio': return 'phone';
      case 'chat': return 'chat';
      default: return 'zoom';
    }
  };

  // Helper to format date for API
  const formatDateForApi = (dateValue) => {
    if (!dateValue) return '';
    try {
      // If it's already in YYYY-MM-DD format, return as is
      if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue;
      }
      // Parse and format - new Date() handles toDateString() format like "Tue Jan 27 2026"
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      return format(date, 'yyyy-MM-dd');
    } catch {
      return dateValue;
    }
  };

  // Final booking payload
  const bookingPayload = computed(() => ({
    urgency: serviceType.urgency,
    meeting_channel: getMeetingChannel(),
    category: category.professional_category,
    specialist_category: category.specialist_category,
    date: formatDateForApi(schedule.date),
    time: schedule.time,
    timezone: schedule.timezone,
    specialist: specialist.id,
    paymentMethod: payment.method,
    ...(payment.method === 'card' && payment.selectedCard
        ? { cardId: payment.selectedCard } : {}),
    appointment_type: appointmentType.value,
    consents: { ...consents },
    patient_notes: patientNotes.value || '',
  }));

  // Estimated cost display - prioritizes: specialist price > service type price > default
  const estimatedCost = computed(() => {
    // If a specialist is selected, use their price
    if (specialist.price) {
      return specialist.price;
    }

    // If a consultation service is selected, use its pricing
    if (selectedService.value) {
      const service = selectedService.value;
      // Return the min_rate (we'll show range in the display)
      return service.min_rate || 5000;
    }

    // Default price based on urgency
    return serviceType.urgency === 'urgent' ? 15000 : 10000;
  });

  // Estimated cost range for display (when no specialist selected)
  const estimatedCostRange = computed(() => {
    // If a specialist is selected, no range needed - show exact price
    if (specialist.price) {
      return null;
    }

    // If a consultation service is selected with both min and max, return range
    if (selectedService.value) {
      const service = selectedService.value;
      if (service.min_rate && service.max_rate && service.min_rate !== service.max_rate) {
        return {
          min: service.min_rate,
          max: service.max_rate,
        };
      }
    }

    return null;
  });

  // Navigation
  function nextStep() {
    if (currentStep.value < totalSteps && canProceed.value) {
      currentStep.value++;
    }
  }

  function prevStep() {
    if (currentStep.value > 1) {
      currentStep.value--;
    }
  }

  function goToStep(step) {
    if (step >= 1 && step <= totalSteps) {
      currentStep.value = step;
    }
  }

  // Set specialist data
  function setSpecialist(data) {
    specialist.id = data.id || data._id || '';
    specialist.full_name = data.full_name || '';
    specialist.profile = data.profile || null;
    specialist.average_rating = data.average_rating || null;
    specialist.review_count = data.review_count || 0;
    specialist.professional_practice = data.professional_practice || '';
    specialist.price = data.price || data.consultation_fee || null;
    specialist.isDiaspora = data.isDiaspora || data.is_diaspora || false;
  }

  // Set category data
  function setCategory(data) {
    category.professional_category = data.professional_category || '';
    category.specialist_category = data.specialist_category || '';
    category.aiSuggested = data.aiSuggested || false;
  }

  // Set all consents at once
  function setAllConsents(value) {
    consents.telemedicine = value;
    consents.privacy = value;
    consents.doctorMatching = value;
    consents.prescription = value;
  }

  // Check if all consents are given
  const allConsentsGiven = computed(() => {
    return consents.telemedicine && consents.privacy &&
           consents.doctorMatching && consents.prescription;
  });

  // Pre-selected values for "Book Again" flow
  const preSelectedSpecialistId = ref('');
  const preSelectedCategory = ref('');
  const appointmentType = ref('Initial Appointment');

  // Selected consultation service (from Step 1)
  const selectedService = ref(null);

  // Initialize from route query params (for "Book Again" flow)
  function initFromRoute(routeQuery) {
    if (routeQuery?.specialistId) {
      preSelectedSpecialistId.value = routeQuery.specialistId;
    }
    if (routeQuery?.category) {
      preSelectedCategory.value = routeQuery.category;
    }
    if (routeQuery?.appointmentType) {
      appointmentType.value = routeQuery.appointmentType;
    }
  }

  // Reset state
  function reset() {
    currentStep.value = 1;

    // Reset service type
    serviceType.urgency = '';
    serviceType.method = '';

    // Reset consents
    consents.telemedicine = false;
    consents.privacy = false;
    consents.doctorMatching = false;
    consents.prescription = false;

    // Reset category
    category.professional_category = '';
    category.specialist_category = '';
    category.aiSuggested = false;

    // Reset schedule
    schedule.date = '';
    schedule.time = '';
    schedule.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Reset specialist
    specialist.id = '';
    specialist.full_name = '';
    specialist.profile = null;
    specialist.average_rating = null;
    specialist.review_count = 0;
    specialist.professional_practice = '';
    specialist.price = null;
    specialist.isDiaspora = false;

    // Reset payment
    payment.method = 'wallet';
    payment.selectedCard = null;
    payment.walletBalance = 0;
    payment.cards = [];
    payment.termsAccepted = false;

    // Reset notes and attachments
    patientNotes.value = '';
    attachments.value = [];

    // Reset appointment type
    appointmentType.value = 'Initial Appointment';

    // Reset selected service
    selectedService.value = null;

    // Reset pre-selected values
    preSelectedSpecialistId.value = '';
    preSelectedCategory.value = '';
  }

  return {
    // Step tracking
    currentStep,
    totalSteps,
    stepLabels,
    currentStepLabel,

    // State objects
    serviceType,
    consents,
    category,
    schedule,
    specialist,
    payment,
    patientNotes,
    attachments,

    // Computed
    canProceed,
    bookingPayload,
    estimatedCost,
    estimatedCostRange,
    allConsentsGiven,

    // Methods
    nextStep,
    prevStep,
    goToStep,
    setSpecialist,
    setCategory,
    setAllConsents,
    reset,
    initFromRoute,

    // Pre-selected values (for "Book Again" flow)
    preSelectedSpecialistId,
    preSelectedCategory,
    appointmentType,
    selectedService,
  };
}
