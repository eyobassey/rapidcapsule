import { ref, computed, reactive } from 'vue';
import { format, parseISO } from 'date-fns';

export function useBookingStateV2(route) {
  // Step tracking
  const currentStep = ref(1);
  const totalSteps = 6;

  // Health Check Data (from AI symptom checker)
  const healthCheckData = reactive({
    checkup_id: '',
    conditions: [],           // Array of { name, probability, triage_level }
    triage_level: '',         // 'emergency', 'consultation', 'self_care', etc.
    symptoms: [],             // Array of symptom names
    interview_summary: [],    // Array of { question, answer }
    assessment_date: '',
    patient_note: '',         // Pre-generated summary for the doctor
    isFromHealthCheck: false, // Flag to indicate booking came from health check
  });

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
    // Link to health checkup if booking was triggered from one
    ...(healthCheckData.isFromHealthCheck && healthCheckData.checkup_id
        ? { health_checkup_id: healthCheckData.checkup_id } : {}),
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

  // ==========================================
  // HEALTH CHECK INTEGRATION
  // ==========================================

  // Check if booking has health check data
  const hasHealthCheckData = computed(() => {
    return healthCheckData.isFromHealthCheck && healthCheckData.symptoms.length > 0;
  });

  // Get primary symptom for display (first/most important)
  const primarySymptom = computed(() => {
    if (healthCheckData.symptoms.length === 0) return null;
    return healthCheckData.symptoms[0];
  });

  // Get top condition from AI diagnosis
  const topCondition = computed(() => {
    if (healthCheckData.conditions.length === 0) return null;
    return healthCheckData.conditions[0];
  });

  // Recommended urgency based on triage level
  const recommendedUrgency = computed(() => {
    const triage = healthCheckData.triage_level?.toLowerCase();
    // Emergency and urgent conditions -> urgent care
    if (['emergency', 'emergency_ambulance', 'consultation_24'].includes(triage)) {
      return 'urgent';
    }
    // Everything else -> routine
    return 'routine';
  });

  // Recommended consultation method based on triage
  const recommendedMethod = computed(() => {
    const triage = healthCheckData.triage_level?.toLowerCase();
    // For emergency/urgent, video is best for visual examination
    if (['emergency', 'emergency_ambulance', 'consultation_24', 'consultation'].includes(triage)) {
      return 'video';
    }
    // Self-care or less urgent can use any method, default to video
    return 'video';
  });

  // Get formatted triage label for display
  const triageLevelLabel = computed(() => {
    const triage = healthCheckData.triage_level?.toLowerCase();
    const labels = {
      'emergency': 'Emergency Care Needed',
      'emergency_ambulance': 'Emergency - Call Ambulance',
      'consultation_24': 'See Doctor Within 24 Hours',
      'consultation': 'Consultation Recommended',
      'self_care': 'Self-Care Advised',
    };
    return labels[triage] || healthCheckData.triage_level || '';
  });

  // Load health check data from session storage
  function loadHealthCheckFromSession() {
    try {
      const stored = sessionStorage.getItem('healthCheckForBooking');
      if (stored) {
        const data = JSON.parse(stored);
        healthCheckData.checkup_id = data.checkup_id || '';
        healthCheckData.conditions = data.conditions || [];
        healthCheckData.triage_level = data.triage_level || '';
        healthCheckData.symptoms = data.symptoms || [];
        healthCheckData.interview_summary = data.interview_summary || [];
        healthCheckData.assessment_date = data.assessment_date || '';
        healthCheckData.patient_note = data.patient_note || '';
        healthCheckData.isFromHealthCheck = true;

        // Auto-populate patient notes with the generated summary
        if (data.patient_note && !patientNotes.value) {
          patientNotes.value = data.patient_note;
        }

        // Auto-apply recommended urgency and method
        if (!serviceType.urgency) {
          serviceType.urgency = recommendedUrgency.value;
        }
        if (!serviceType.method) {
          serviceType.method = recommendedMethod.value;
        }

        console.log('[Booking] Loaded health check data:', {
          symptoms: healthCheckData.symptoms.length,
          conditions: healthCheckData.conditions.length,
          triage: healthCheckData.triage_level,
        });

        return true;
      }
    } catch (error) {
      console.error('[Booking] Error loading health check data:', error);
    }
    return false;
  }

  // Clear health check session data (call after successful booking)
  function clearHealthCheckSession() {
    sessionStorage.removeItem('healthCheckForBooking');
    // Reset health check state
    healthCheckData.checkup_id = '';
    healthCheckData.conditions = [];
    healthCheckData.triage_level = '';
    healthCheckData.symptoms = [];
    healthCheckData.interview_summary = [];
    healthCheckData.assessment_date = '';
    healthCheckData.patient_note = '';
    healthCheckData.isFromHealthCheck = false;
  }

  // Generate patient notes from a health checkup object
  function generatePatientNoteFromCheckup(checkup) {
    if (!checkup) return '';

    const parts = [];
    const response = checkup.response?.data || {};

    // Add assessment date
    if (checkup.created_at) {
      const assessmentDate = format(new Date(checkup.created_at), 'MMMM d, yyyy');
      parts.push(`AI Health Assessment completed on ${assessmentDate}.`);
    }

    // Add symptoms from the checkup (stored in request.evidence with 'label' as the name)
    const evidence = checkup.request?.evidence || [];
    if (evidence.length > 0) {
      const symptomNames = evidence
        .filter(s => s.choice_id === 'present' && s.id?.startsWith('s_'))
        .map(s => s.label || s.common_name || s.name)
        .slice(0, 5);
      if (symptomNames.length > 0) {
        parts.push(`Reported symptoms: ${symptomNames.join(', ')}.`);
      }
    }

    // Add top conditions
    const conditions = response.conditions || [];
    if (conditions.length > 0) {
      const topConditions = conditions.slice(0, 3).map(c => {
        const probability = Math.round((c.probability || 0) * 100);
        return `${c.common_name || c.name} (${probability}%)`;
      });
      parts.push(`Possible conditions: ${topConditions.join(', ')}.`);
    }

    // Add triage level
    const triageLevel = response.triage_level;
    if (triageLevel) {
      const triageLabels = {
        'emergency': 'Emergency care recommended',
        'emergency_ambulance': 'Emergency - Ambulance recommended',
        'consultation_24': 'Doctor visit within 24 hours recommended',
        'consultation': 'Medical consultation recommended',
        'self_care': 'Self-care may be appropriate',
      };
      parts.push(triageLabels[triageLevel.toLowerCase()] || `Triage: ${triageLevel}`);
    }

    return parts.join('\n\n');
  }

  // Set health check data from an existing checkup (from API)
  function setHealthCheckFromExisting(checkup) {
    if (!checkup || !checkup._id) {
      console.error('[Booking] Invalid checkup object provided');
      return false;
    }

    try {
      const response = checkup.response?.data || {};

      // Extract symptoms from request (stored in evidence with 'label' as the name)
      const symptoms = (checkup.request?.evidence || [])
        .filter(s => s.choice_id === 'present' && s.id?.startsWith('s_'))
        .map(s => s.label || s.common_name || s.name);

      // Extract conditions from response
      const conditions = (response.conditions || []).map(c => ({
        name: c.common_name || c.name,
        probability: c.probability || 0,
        triage_level: c.triage_level,
      }));

      // Set health check data
      healthCheckData.checkup_id = checkup._id;
      healthCheckData.conditions = conditions;
      healthCheckData.triage_level = response.triage_level || '';
      healthCheckData.symptoms = symptoms;
      healthCheckData.interview_summary = []; // Not available from API response
      healthCheckData.assessment_date = checkup.created_at || '';
      healthCheckData.patient_note = generatePatientNoteFromCheckup(checkup);
      healthCheckData.isFromHealthCheck = true;

      // Auto-populate patient notes with the generated summary
      if (healthCheckData.patient_note && !patientNotes.value) {
        patientNotes.value = healthCheckData.patient_note;
      }

      console.log('[Booking] Linked existing health checkup:', {
        id: healthCheckData.checkup_id,
        symptoms: healthCheckData.symptoms.length,
        conditions: healthCheckData.conditions.length,
        triage: healthCheckData.triage_level,
      });

      return true;
    } catch (error) {
      console.error('[Booking] Error setting health check from existing:', error);
      return false;
    }
  }

  // Unlink a health checkup (user changed their mind)
  function unlinkHealthCheck() {
    healthCheckData.checkup_id = '';
    healthCheckData.conditions = [];
    healthCheckData.triage_level = '';
    healthCheckData.symptoms = [];
    healthCheckData.interview_summary = [];
    healthCheckData.assessment_date = '';
    healthCheckData.patient_note = '';
    healthCheckData.isFromHealthCheck = false;
    // Don't clear patient notes - user may have edited them
    console.log('[Booking] Health checkup unlinked');
  }

  // Initialize from route query params (for "Book Again" flow or health check)
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

    // Check if coming from health check and load data
    if (routeQuery?.from_health_check === 'true') {
      loadHealthCheckFromSession();
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

    // Reset health check data
    healthCheckData.checkup_id = '';
    healthCheckData.conditions = [];
    healthCheckData.triage_level = '';
    healthCheckData.symptoms = [];
    healthCheckData.interview_summary = [];
    healthCheckData.assessment_date = '';
    healthCheckData.patient_note = '';
    healthCheckData.isFromHealthCheck = false;
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

    // Health Check Integration
    healthCheckData,
    hasHealthCheckData,
    primarySymptom,
    topCondition,
    recommendedUrgency,
    recommendedMethod,
    triageLevelLabel,
    loadHealthCheckFromSession,
    clearHealthCheckSession,
    setHealthCheckFromExisting,
    unlinkHealthCheck,
    generatePatientNoteFromCheckup,
  };
}
