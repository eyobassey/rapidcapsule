/**
 * Specialist Appointments - Create Appointment Wizard State
 * Comprehensive 6-step appointment creation flow with:
 * - 3-tab patient selection (existing, platform, manual)
 * - Payment source selection (specialist/patient wallet, card)
 * - Clinical flags and visit reasons
 * - Enhanced scheduling with reminders
 */

import { ref, reactive, computed, inject, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';

export function useCreateAppointment() {
  const $http = inject('$http');
  const router = useRouter();
  const toast = useToast();

  // Wizard State
  const currentStep = ref(1);
  const totalSteps = 6;
  const isSubmitting = ref(false);
  const isDraft = ref(false);
  const isLoadingWallets = ref(false);

  // Step names for display
  const stepNames = [
    'Patient',
    'Type & Details',
    'Schedule',
    'Fee & Payment',
    'Notes',
    'Review',
  ];

  // Step icons
  const stepIcons = [
    'hi-user',
    'hi-clipboard-list',
    'hi-calendar',
    'hi-credit-card',
    'hi-document-text',
    'hi-check-circle',
  ];

  // ============================================
  // Step 1: Patient Selection
  // ============================================
  const patient = reactive({
    selectionType: 'existing', // 'existing' | 'platform' | 'manual'
    id: '',
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    avatar: '',
    isNewPatient: false,
    patientData: null, // Full patient object for display
    // Health context
    healthScore: null,
    lastCheckup: null,
    lastVisit: null,
    activeAlerts: [],
  });

  // ============================================
  // Step 2: Type & Details
  // ============================================
  const details = reactive({
    channel: 'video', // 'video' | 'in_person' | 'phone'
    visitReason: '', // consultation service ID
    visitReasonName: '', // display name
    visitReasonCustom: '', // for "Other" option
    specialty: '',
    specialtyName: '',
    template: '',
    duration: 30, // minutes
    customDuration: '', // for custom duration input
    clinicalFlags: [], // Array of flag IDs
  });

  // Available clinical flags
  const clinicalFlagOptions = [
    { id: 'interpreter', label: 'Interpreter Needed', icon: 'hi-translate' },
    { id: 'mobility', label: 'Mobility Assistance', icon: 'hi-support' },
    { id: 'imaging', label: 'Imaging Required', icon: 'hi-photograph' },
    { id: 'lab_work', label: 'Lab Work Needed', icon: 'hi-beaker' },
    { id: 'fasting', label: 'Patient Should Fast', icon: 'hi-clock' },
    { id: 'bring_medications', label: 'Bring Medications', icon: 'hi-collection' },
    { id: 'follow_up', label: 'Follow-up Required', icon: 'hi-refresh' },
    { id: 'pediatric', label: 'Pediatric Patient', icon: 'hi-user-group' },
  ];

  // Duration options
  const durationOptions = [15, 30, 45, 60];

  // ============================================
  // Step 3: Schedule
  // ============================================
  const schedule = reactive({
    date: '',
    time: '',
    endTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewMode: 'day', // 'day' | 'week'
    selectedWeekDay: null, // For week view selection
    reminders: {
      email: { enabled: true, timing: '24h' },
      sms: { enabled: true, timing: '1h' },
    },
    bufferTime: 5, // minutes before/after
    isRecurring: false,
    recurringPattern: {
      frequency: 'weekly',
      occurrences: 4,
      endDate: '',
    },
    aiSuggestions: [], // AI-recommended time slots
  });

  // Reminder timing options
  const reminderTimingOptions = [
    { value: '15m', label: '15 minutes before' },
    { value: '30m', label: '30 minutes before' },
    { value: '1h', label: '1 hour before' },
    { value: '2h', label: '2 hours before' },
    { value: '24h', label: '24 hours before' },
    { value: '48h', label: '48 hours before' },
  ];

  // ============================================
  // Step 4: Fee & Payment
  // ============================================
  const payment = reactive({
    source: 'patient_wallet', // 'specialist_wallet' | 'patient_wallet' | 'card'
    consultationFee: 0,
    platformFee: 500,
    totalAmount: 0,
    currency: 'NGN',
    timing: 'at_booking', // 'at_booking' | 'before' | 'after'
    // Video platform settings
    videoPlatform: 'zoom', // 'zoom' | 'google_meet' | 'microsoft_teams'
    autoGenerateLink: true,
    enableWaitingRoom: true,
    recordSession: false,
    // Wallet balances (fetched from API)
    specialistWalletBalance: 0,
    patientWalletBalance: 0,
    // Fee breakdown
    feeBreakdown: {
      consultation: 0,
      platform: 500,
      discount: 0,
      total: 0,
    },
    // Promo code
    promoCode: '',
    promoApplied: false,
    promoDiscount: 0,
  });

  // ============================================
  // Step 5: Notes & Attachments
  // ============================================
  const notes = reactive({
    internalNotes: '', // Private to specialist
    patientInstructions: '', // Visible to patient
    attachments: [], // Array of { name, url, type, size }
    templateUsed: '',
    quickTemplates: [], // Loaded from API/local
  });

  // ============================================
  // Step 6: Review
  // ============================================
  const review = reactive({
    consentVerified: false,
    notifyPatient: true,
    sendReminders: true,
  });

  // ============================================
  // Filter Options (from API)
  // ============================================
  const filterOptions = reactive({
    consultationServices: [],
    channels: [],
    specialties: [],
    templates: [],
    isLoading: false,
  });

  // ============================================
  // Computed Properties
  // ============================================

  // Step Validation
  const stepValidation = computed(() => ({
    1: isPatientValid.value,
    2: isDetailsValid.value,
    3: isScheduleValid.value,
    4: isPaymentValid.value,
    5: true, // Notes are optional
    6: review.consentVerified,
  }));

  const isPatientValid = computed(() => {
    if (patient.selectionType === 'existing' || patient.selectionType === 'platform') {
      return !!patient.id;
    }
    // Manual entry validation
    return !!(patient.name && patient.email && patient.phone);
  });

  const isDetailsValid = computed(() => {
    return !!(details.channel && details.visitReason && details.duration > 0);
  });

  const isScheduleValid = computed(() => {
    return !!(schedule.date && schedule.time);
  });

  const isPaymentValid = computed(() => {
    // For specialist wallet - check balance
    if (payment.source === 'specialist_wallet') {
      return payment.specialistWalletBalance >= payment.totalAmount;
    }
    // For patient wallet - check balance
    if (payment.source === 'patient_wallet') {
      return payment.patientWalletBalance >= payment.totalAmount;
    }
    // Card payment is always valid if selected
    return payment.source === 'card';
  });

  const canProceed = computed(() => stepValidation.value[currentStep.value]);

  const isComplete = computed(() => {
    return Object.values(stepValidation.value).slice(0, 5).every(v => v);
  });

  // Progress percentage
  const progressPercent = computed(() => {
    const completedSteps = Object.values(stepValidation.value)
      .slice(0, currentStep.value)
      .filter(v => v).length;
    return Math.round((completedSteps / totalSteps) * 100);
  });

  // Calculate total amount
  const calculateTotalAmount = () => {
    const consultation = payment.consultationFee || 0;
    const platform = payment.platformFee || 500;
    const discount = payment.promoDiscount || 0;
    payment.feeBreakdown = {
      consultation,
      platform,
      discount,
      total: consultation + platform - discount,
    };
    payment.totalAmount = payment.feeBreakdown.total;
  };

  // Watch for fee changes
  watch(() => payment.consultationFee, calculateTotalAmount);
  watch(() => payment.promoDiscount, calculateTotalAmount);

  // Calculate end time based on duration
  const calculateEndTime = () => {
    if (schedule.date && schedule.time && details.duration) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + details.duration;
      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMins = endMinutes % 60;
      schedule.endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
    }
  };

  watch(() => [schedule.date, schedule.time, details.duration], calculateEndTime);

  // ============================================
  // Final Booking Payload
  // ============================================
  const bookingPayload = computed(() => {
    // Build start_time as ISO string
    const startTimeISO = schedule.date && schedule.time
      ? new Date(`${schedule.date}T${schedule.time}:00`).toISOString()
      : null;

    return {
      // Patient
      patient_id: patient.isNewPatient ? null : patient.id,
      is_new_patient: patient.isNewPatient,
      new_patient_data: patient.isNewPatient ? {
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        date_of_birth: patient.dateOfBirth || null,
        gender: patient.gender || null,
      } : null,

      // Type & Details
      category: details.specialty || details.visitReasonName || 'General',
      appointment_type: details.visitReason,
      appointment_type_name: details.visitReasonName || details.visitReasonCustom,
      meeting_channel: details.channel === 'video' ? payment.videoPlatform :
                       details.channel === 'in_person' ? 'in_person' :
                       details.channel === 'phone' ? 'phone' : 'zoom',
      duration_minutes: details.duration,
      clinical_flags: details.clinicalFlags,

      // Schedule
      start_time: startTimeISO,
      appointment_date: schedule.date,
      timezone: schedule.timezone,
      is_recurring: schedule.isRecurring,
      recurring_pattern: schedule.isRecurring ? schedule.recurringPattern : null,
      reminder_settings: {
        email: schedule.reminders.email,
        sms: schedule.reminders.sms,
      },
      buffer_time: schedule.bufferTime,

      // Fee & Payment
      consultation_fee: payment.consultationFee,
      platform_fee: payment.platformFee,
      total_amount: payment.totalAmount,
      payment_source: payment.source,
      payment_timing: payment.timing,
      promo_code: payment.promoApplied ? payment.promoCode : null,
      currency: payment.currency,

      // Video settings (if applicable)
      video_settings: details.channel === 'video' ? {
        platform: payment.videoPlatform,
        auto_generate_link: payment.autoGenerateLink,
        enable_waiting_room: payment.enableWaitingRoom,
        record_session: payment.recordSession,
      } : null,

      // Notes
      patient_notes: notes.patientInstructions,
      private_notes: notes.internalNotes,
      attachments: notes.attachments.map(f => ({
        name: f.name,
        url: f.url,
        type: f.type,
        size: f.size,
      })),

      // Review options
      notify_patient: review.notifyPatient,
      send_reminders: review.sendReminders,
    };
  });

  // ============================================
  // Navigation Methods
  // ============================================
  function nextStep() {
    if (currentStep.value < totalSteps && canProceed.value) {
      currentStep.value++;
      saveToLocalStorage();

      // Fetch wallet balances when entering payment step
      if (currentStep.value === 4) {
        fetchWalletBalances();
      }
    }
  }

  function prevStep() {
    if (currentStep.value > 1) {
      currentStep.value--;
    }
  }

  function goToStep(step) {
    if (step >= 1 && step <= totalSteps) {
      // Allow going back to any completed step, or the next incomplete step
      const canGo = step <= currentStep.value ||
                    (step === currentStep.value + 1 && canProceed.value);
      if (canGo) {
        currentStep.value = step;
      }
    }
  }

  // ============================================
  // Patient Selection Methods
  // ============================================
  function setPatient(patientData) {
    const name = patientData.name ||
      `${patientData.profile?.first_name || ''} ${patientData.profile?.last_name || ''}`.trim();

    Object.assign(patient, {
      selectionType: patientData.isNew ? 'manual' : (patientData.selectionType || 'existing'),
      id: patientData._id || patientData.id || '',
      name: name,
      email: patientData.email || '',
      phone: patientData.profile?.phone_number?.number || patientData.phone || '',
      dateOfBirth: patientData.profile?.date_of_birth || patientData.dateOfBirth || '',
      gender: patientData.profile?.gender || patientData.gender || '',
      avatar: patientData.profile?.profile_image || '',
      isNewPatient: !!patientData.isNew,
      patientData: patientData,
      healthScore: patientData.healthScore || null,
      lastCheckup: patientData.lastCheckup || null,
      lastVisit: patientData.lastVisit || null,
      activeAlerts: patientData.activeAlerts || [],
    });
  }

  function clearPatient() {
    Object.assign(patient, {
      id: '',
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      avatar: '',
      isNewPatient: false,
      patientData: null,
      healthScore: null,
      lastCheckup: null,
      lastVisit: null,
      activeAlerts: [],
    });
  }

  // ============================================
  // Details Methods
  // ============================================
  function setVisitReason(reason) {
    details.visitReason = reason._id || reason.id;
    details.visitReasonName = reason.name;
    // Set default duration from service if available
    if (reason.default_duration) {
      details.duration = reason.default_duration;
    }
  }

  function setSpecialty(specialty) {
    details.specialty = specialty._id || specialty.id;
    details.specialtyName = specialty.name;
  }

  function toggleClinicalFlag(flagId) {
    const index = details.clinicalFlags.indexOf(flagId);
    if (index > -1) {
      details.clinicalFlags.splice(index, 1);
    } else {
      details.clinicalFlags.push(flagId);
    }
  }

  function setDuration(minutes) {
    details.duration = minutes;
    details.customDuration = '';
  }

  function setCustomDuration(minutes) {
    const parsed = parseInt(minutes, 10);
    if (parsed > 0 && parsed <= 180) {
      details.duration = parsed;
      details.customDuration = minutes;
    }
  }

  // ============================================
  // Schedule Methods
  // ============================================
  function setSchedule(date, time) {
    schedule.date = date;
    schedule.time = time;
    calculateEndTime();
  }

  function setReminderTiming(type, timing) {
    if (type === 'email') {
      schedule.reminders.email.timing = timing;
    } else if (type === 'sms') {
      schedule.reminders.sms.timing = timing;
    }
  }

  function toggleReminder(type) {
    if (type === 'email') {
      schedule.reminders.email.enabled = !schedule.reminders.email.enabled;
    } else if (type === 'sms') {
      schedule.reminders.sms.enabled = !schedule.reminders.sms.enabled;
    }
  }

  // ============================================
  // Payment Methods
  // ============================================
  function setPaymentSource(source) {
    payment.source = source;
  }

  function setConsultationFee(amount) {
    payment.consultationFee = amount;
    calculateTotalAmount();
  }

  async function fetchWalletBalances() {
    if (!$http) return;

    isLoadingWallets.value = true;
    try {
      // Fetch specialist wallet balance
      const specialistResponse = await $http.$_getSpecialistWallet();
      if (specialistResponse.data?.success) {
        payment.specialistWalletBalance = specialistResponse.data.data?.available_balance || 0;
      }

      // Fetch patient wallet balance if patient is selected
      if (patient.id && !patient.isNewPatient) {
        try {
          const patientResponse = await $http.$_getPatientWalletBalance?.(patient.id);
          if (patientResponse?.data?.success) {
            payment.patientWalletBalance = patientResponse.data.data?.available_balance || 0;
          }
        } catch (e) {
          // Patient wallet API might not exist, set to 0
          payment.patientWalletBalance = 0;
        }
      }
    } catch (error) {
      console.error('Failed to fetch wallet balances:', error);
    } finally {
      isLoadingWallets.value = false;
    }
  }

  async function applyPromoCode(code) {
    if (!code || !$http) return false;

    try {
      const response = await $http.$_validatePromoCode?.({ code, amount: payment.consultationFee });
      if (response?.data?.success) {
        payment.promoCode = code;
        payment.promoApplied = true;
        payment.promoDiscount = response.data.data?.discount || 0;
        calculateTotalAmount();
        toast.success('Promo code applied!');
        return true;
      }
    } catch (error) {
      toast.error('Invalid promo code');
    }
    return false;
  }

  function removePromoCode() {
    payment.promoCode = '';
    payment.promoApplied = false;
    payment.promoDiscount = 0;
    calculateTotalAmount();
  }

  // ============================================
  // Notes Methods
  // ============================================
  function addAttachment(file) {
    notes.attachments.push(file);
  }

  function removeAttachment(index) {
    notes.attachments.splice(index, 1);
  }

  function applyNoteTemplate(template) {
    if (template.internalNotes) {
      notes.internalNotes = template.internalNotes;
    }
    if (template.patientInstructions) {
      notes.patientInstructions = template.patientInstructions;
    }
    notes.templateUsed = template.id || template.name;
  }

  // ============================================
  // API Methods
  // ============================================
  async function fetchFilterOptions() {
    if (!$http) return;

    filterOptions.isLoading = true;
    try {
      const response = await $http.$_getAppointmentFilterOptions?.();
      if (response?.data?.success) {
        const data = response.data.data || {};
        filterOptions.consultationServices = data.consultationServices || [];
        filterOptions.channels = data.channels || [];
        filterOptions.specialties = data.specialties || [];
        filterOptions.templates = data.templates || [];
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    } finally {
      filterOptions.isLoading = false;
    }
  }

  // ============================================
  // Persistence Methods
  // ============================================
  function saveToLocalStorage() {
    const draft = {
      currentStep: currentStep.value,
      patient: { ...patient },
      details: { ...details },
      schedule: { ...schedule },
      payment: {
        ...payment,
        // Don't save wallet balances
        specialistWalletBalance: 0,
        patientWalletBalance: 0,
      },
      notes: { ...notes },
      review: { ...review },
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem('sa_appointment_draft_v2', JSON.stringify(draft));
    isDraft.value = true;
  }

  function loadFromLocalStorage() {
    const saved = localStorage.getItem('sa_appointment_draft_v2');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        // Check if draft is less than 24 hours old
        const savedAt = new Date(draft.savedAt);
        const now = new Date();
        const hoursDiff = (now - savedAt) / (1000 * 60 * 60);

        if (hoursDiff < 24) {
          currentStep.value = draft.currentStep || 1;
          Object.assign(patient, draft.patient || {});
          Object.assign(details, draft.details || {});
          Object.assign(schedule, draft.schedule || {});
          Object.assign(payment, {
            ...(draft.payment || {}),
            specialistWalletBalance: 0,
            patientWalletBalance: 0,
          });
          Object.assign(notes, draft.notes || {});
          Object.assign(review, draft.review || {});
          isDraft.value = true;
          return true;
        } else {
          // Draft too old, clear it
          clearDraft();
        }
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
    return false;
  }

  function clearDraft() {
    localStorage.removeItem('sa_appointment_draft_v2');
    isDraft.value = false;
  }

  // ============================================
  // Submit Booking
  // ============================================
  async function submitBooking() {
    if (!isComplete.value || !review.consentVerified) {
      toast.warning('Please complete all required steps and verify consent');
      return false;
    }

    if (!$http) {
      toast.error('API not available');
      return false;
    }

    isSubmitting.value = true;

    try {
      const payload = bookingPayload.value;
      const response = await $http.$_createAppointment(payload);

      if (response.data?.success) {
        toast.success('Appointment booked successfully!');
        clearDraft();
        reset();

        // Navigate to appointment detail or list
        const appointmentId = response.data.data?._id;
        if (appointmentId) {
          router.push({
            name: 'SpecialistAppointmentDetail',
            params: { id: appointmentId },
          });
        } else {
          router.push({ name: 'SpecialistAppointmentsList' });
        }
        return true;
      } else {
        toast.error(response.data?.message || 'Failed to book appointment');
        return false;
      }
    } catch (err) {
      console.error('Failed to submit booking:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to book appointment';
      toast.error(errorMessage);
      return false;
    } finally {
      isSubmitting.value = false;
    }
  }

  // ============================================
  // Reset All State
  // ============================================
  function reset() {
    currentStep.value = 1;

    Object.assign(patient, {
      selectionType: 'existing',
      id: '',
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      avatar: '',
      isNewPatient: false,
      patientData: null,
      healthScore: null,
      lastCheckup: null,
      lastVisit: null,
      activeAlerts: [],
    });

    Object.assign(details, {
      channel: 'video',
      visitReason: '',
      visitReasonName: '',
      visitReasonCustom: '',
      specialty: '',
      specialtyName: '',
      template: '',
      duration: 30,
      customDuration: '',
      clinicalFlags: [],
    });

    Object.assign(schedule, {
      date: '',
      time: '',
      endTime: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      viewMode: 'day',
      selectedWeekDay: null,
      reminders: {
        email: { enabled: true, timing: '24h' },
        sms: { enabled: true, timing: '1h' },
      },
      bufferTime: 5,
      isRecurring: false,
      recurringPattern: {
        frequency: 'weekly',
        occurrences: 4,
        endDate: '',
      },
      aiSuggestions: [],
    });

    Object.assign(payment, {
      source: 'patient_wallet',
      consultationFee: 0,
      platformFee: 500,
      totalAmount: 0,
      currency: 'NGN',
      timing: 'at_booking',
      videoPlatform: 'zoom',
      autoGenerateLink: true,
      enableWaitingRoom: true,
      recordSession: false,
      specialistWalletBalance: 0,
      patientWalletBalance: 0,
      feeBreakdown: {
        consultation: 0,
        platform: 500,
        discount: 0,
        total: 0,
      },
      promoCode: '',
      promoApplied: false,
      promoDiscount: 0,
    });

    Object.assign(notes, {
      internalNotes: '',
      patientInstructions: '',
      attachments: [],
      templateUsed: '',
      quickTemplates: [],
    });

    Object.assign(review, {
      consentVerified: false,
      notifyPatient: true,
      sendReminders: true,
    });

    isDraft.value = false;
  }

  // ============================================
  // Return Public API
  // ============================================
  return {
    // State
    currentStep,
    totalSteps,
    stepNames,
    stepIcons,
    isSubmitting,
    isDraft,
    isLoadingWallets,

    // Step data
    patient,
    details,
    schedule,
    payment,
    notes,
    review,

    // Options
    clinicalFlagOptions,
    durationOptions,
    reminderTimingOptions,
    filterOptions,

    // Computed
    stepValidation,
    canProceed,
    isComplete,
    progressPercent,
    bookingPayload,
    isPatientValid,
    isDetailsValid,
    isScheduleValid,
    isPaymentValid,

    // Navigation
    nextStep,
    prevStep,
    goToStep,

    // Patient methods
    setPatient,
    clearPatient,

    // Details methods
    setVisitReason,
    setSpecialty,
    toggleClinicalFlag,
    setDuration,
    setCustomDuration,

    // Schedule methods
    setSchedule,
    setReminderTiming,
    toggleReminder,

    // Payment methods
    setPaymentSource,
    setConsultationFee,
    fetchWalletBalances,
    applyPromoCode,
    removePromoCode,

    // Notes methods
    addAttachment,
    removeAttachment,
    applyNoteTemplate,

    // API methods
    fetchFilterOptions,

    // Persistence
    saveToLocalStorage,
    loadFromLocalStorage,
    clearDraft,

    // Submit
    submitBooking,
    reset,
  };
}
