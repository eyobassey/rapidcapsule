import { ref, reactive, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

// Singleton state for the onboarding flow
const currentStep = ref(3); // Default to Setup Dashboard
const totalSteps = 9;

// Step completion status
const stepCompletion = reactive({
  accountCreation: false,
  quickBio: false,
  setupDashboard: true, // Hub is always "complete"
  profileConfig: false,
  availability: false,
  rateCards: false,
  verification: false,
  security: false,
  review: false,
});

// Step 1: Account Creation
const account = reactive({
  email: '',
  phone: '',
  phone_country_code: '+234',
  password: '',
  ssoProvider: null,
  consents: {
    terms: false,
    privacy: false,
    marketing: false,
  },
});

// Step 2: Quick Bio
const quickBio = reactive({
  profile_image: null,
  profile_image_preview: '',
  full_name: '',
  professional_type: '',  // 'Medical Doctor' | 'Therapist' | 'Dietitian' | 'Care Giver' | 'Pharmacist' | 'Lab Technician'
  gender: '',             // 'male' | 'female' | 'other'
  bio: '',
});

// Step 4: Profile Configuration
const profileConfig = reactive({
  display_name: '',
  years_experience: null,
  professional_bio: '',
  languages: [],
  primary_specialty: '',
  sub_specialties: [],
  // Practice Location
  phone_country_code: '+234',
  phone_number: '',
  country: 'Nigeria',
  state: '',
  city: '',
  address: '',
  practice_type: 'virtual_only', // 'clinic' | 'home_office' | 'virtual_only'
  is_diaspora: false,
});

// Step 5: Availability
const availability = reactive({
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  slot_duration: 30,
  buffer_time: 5,
  ai_triage_priority: true,
  weekly_schedule: {
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '', end: '' },
    sunday: { enabled: false, start: '', end: '' },
  },
  custom_slots: [],
  vacation_blocks: [],
});

// Step 6: Rate Cards
const rateCards = reactive({
  currency: 'NGN',
  video_consultation: {
    enabled: true,
    routine_rate: null,
    urgent_rate: null,
  },
  chat_consultation: {
    enabled: true,
    flat_rate: null,
  },
  prescription_review: {
    enabled: false,
    review_fee: null,
  },
});

// Step 7: Verification
const verification = reactive({
  government_id: {
    type: '',
    number: '',
    expiry: '',
    document_url: '',
    status: 'pending',
  },
  medical_license: {
    license_number: '',
    issuing_body: '',
    document_url: '',
    status: 'pending',
  },
  registry_check: {
    status: 'pending',
    verified_at: null,
  },
});

// Step 8: Security
const security = reactive({
  two_factor: {
    email: true,
    authenticator_app: false,
    sms: false,
  },
  notifications: {
    new_appointment: { email: true, sms: true, push: true, whatsapp: false },
    urgent_triage: { email: true, sms: true, push: true, whatsapp: true },
    earnings: { email: true, sms: false, push: false, whatsapp: false },
  },
  channels: {
    rapid_video: true,
    zoom: false,
    whatsapp: false,
  },
  communication_languages: [],
  privacy_consents: {
    ndpr: false,
    ai_processing: false,
  },
});

// Step 9: Final Consents
const finalConsents = reactive({
  code_of_conduct: false,
  professional_indemnity: false,
});

// Account Status (from database)
const accountStatus = reactive({
  status: 'Active', // 'Active' | 'Inactive' | 'Suspended' | 'Cancelled'
  verification_status: 'Unverified', // 'Verified' | 'Unverified' | 'Suspended'
  identity_verification_overall: 'pending', // 'pending' | 'verified' | 'rejected'
  is_activated: false, // Has specialist completed activation flow
});

// Step metadata for navigation
const stepMeta = {
  1: { key: 'accountCreation', name: 'Account Creation', route: null },
  2: { key: 'quickBio', name: 'My Practice', route: 'SpecialistQuickBio' },
  3: { key: 'setupDashboard', name: 'Setup Dashboard', route: 'SpecialistSetupDashboard' },
  4: { key: 'profileConfig', name: 'Profile Config', route: 'SpecialistProfileConfig' },
  5: { key: 'availability', name: 'Availability', route: 'SpecialistAvailability' },
  6: { key: 'rateCards', name: 'Rate Cards', route: 'SpecialistRates' },
  7: { key: 'verification', name: 'Identity & Compliance', route: 'SpecialistVerification' },
  8: { key: 'security', name: 'Security & Prefs', route: 'SpecialistSecurity' },
  9: { key: 'review', name: 'Review & Activation', route: 'SpecialistReview' },
};

export function useOnboardingState() {
  const router = useRouter();
  const route = useRoute();

  // Computed: Overall progress percentage
  const progressPercent = computed(() => {
    const weights = {
      accountCreation: 10,
      quickBio: 10,
      setupDashboard: 0,
      profileConfig: 15,
      availability: 15,
      rateCards: 10,
      verification: 20,
      security: 10,
      review: 10,
    };

    let completed = 0;
    let total = 0;

    for (const [key, weight] of Object.entries(weights)) {
      total += weight;
      if (stepCompletion[key]) completed += weight;
    }

    return Math.round((completed / total) * 100);
  });

  // Computed: Is verification complete (required for activation)
  const isVerificationComplete = computed(() => {
    return verification.medical_license.status === 'verified' &&
           verification.government_id.status === 'verified';
  });

  // Computed: Can activate practice
  const canActivate = computed(() => {
    return isVerificationComplete.value &&
           finalConsents.code_of_conduct &&
           finalConsents.professional_indemnity;
  });

  // Computed: Practice Status - comprehensive status based on account and onboarding state
  const practiceStatus = computed(() => {
    // Priority 1: Check for suspended status
    if (accountStatus.status === 'Suspended' || accountStatus.verification_status === 'Suspended') {
      return {
        key: 'suspended',
        label: 'Suspended',
        description: 'Your account has been suspended. Please contact support.',
        color: 'red',
        icon: 'hi-ban',
      };
    }

    // Priority 2: Check for cancelled/inactive
    if (accountStatus.status === 'Cancelled') {
      return {
        key: 'cancelled',
        label: 'Cancelled',
        description: 'Your account has been cancelled.',
        color: 'gray',
        icon: 'hi-x-circle',
      };
    }

    if (accountStatus.status === 'Inactive') {
      return {
        key: 'inactive',
        label: 'Inactive',
        description: 'Your account is currently inactive.',
        color: 'gray',
        icon: 'hi-pause',
      };
    }

    // Priority 3: Check identity verification rejection
    if (accountStatus.identity_verification_overall === 'rejected') {
      return {
        key: 'rejected',
        label: 'Verification Rejected',
        description: 'Your verification was rejected. Please resubmit documents.',
        color: 'red',
        icon: 'hi-exclamation-circle',
      };
    }

    // Priority 4: Check if fully activated and verified
    if (accountStatus.is_activated && accountStatus.verification_status === 'Verified') {
      return {
        key: 'active',
        label: 'Active',
        description: 'Your practice is live and accepting patients.',
        color: 'green',
        icon: 'hi-check-circle',
      };
    }

    // Priority 5: Activated but pending verification
    if (accountStatus.is_activated && accountStatus.verification_status === 'Unverified') {
      return {
        key: 'pending_review',
        label: 'Pending Review',
        description: 'Your account is under admin review.',
        color: 'yellow',
        icon: 'hi-clock',
      };
    }

    // Priority 6: All steps complete and consents accepted - ready to activate
    if (progressPercent.value >= 100 && finalConsents.code_of_conduct && finalConsents.professional_indemnity) {
      return {
        key: 'ready',
        label: 'Ready to Activate',
        description: 'Complete activation to go live.',
        color: 'blue',
        icon: 'fa-rocket',
      };
    }

    // Priority 7: Still in setup
    return {
      key: 'setup',
      label: 'Setup In Progress',
      description: `${progressPercent.value}% complete`,
      color: 'orange',
      icon: 'hi-cog',
    };
  });

  // Computed: Current step info
  const currentStepInfo = computed(() => {
    return stepMeta[currentStep.value] || stepMeta[3];
  });

  // Computed: Is step accessible
  const isStepAccessible = (step) => {
    // Steps 2-8 are freely accessible (specialists can revisit any section)
    if (step >= 2 && step <= 8) return true;

    // Step 9 (Review & Activation) requires verification to be completed
    if (step === 9) return isVerificationComplete.value;

    // Step 1 (Account Creation) is signup-only, not revisitable
    return step >= 2;
  };

  // Computed: Get step status
  const getStepStatus = (step) => {
    const meta = stepMeta[step];
    if (!meta) return 'locked';

    if (stepCompletion[meta.key]) return 'completed';
    if (currentStep.value === step) return 'current';
    if (!isStepAccessible(step)) return 'locked';
    return 'pending';
  };

  // Navigate to step
  const goToStep = (step) => {
    if (step >= 1 && step <= totalSteps && isStepAccessible(step)) {
      currentStep.value = step;
      const meta = stepMeta[step];
      if (meta && router) {
        router.push({ name: meta.route });
      }
    }
  };

  // Navigate to next step
  const nextStep = () => {
    if (currentStep.value < totalSteps) {
      goToStep(currentStep.value + 1);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (currentStep.value > 1) {
      goToStep(currentStep.value - 1);
    }
  };

  // Mark step as complete
  const completeStep = (stepKey) => {
    if (stepCompletion.hasOwnProperty(stepKey)) {
      stepCompletion[stepKey] = true;
      saveProgress();
    }
  };

  // Save progress to localStorage
  const saveProgress = () => {
    const state = {
      currentStep: currentStep.value,
      stepCompletion: { ...stepCompletion },
      quickBio: { ...quickBio },
      profileConfig: { ...profileConfig },
      availability: { ...availability },
      rateCards: { ...rateCards },
      verification: { ...verification },
      security: { ...security },
    };
    localStorage.setItem('specialist_onboarding_state', JSON.stringify(state));
  };

  // Load progress from localStorage and user profile
  const loadProgress = (userProfile = null, specialistPrefs = null) => {
    // First, load from localStorage for session state
    const saved = localStorage.getItem('specialist_onboarding_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.currentStep) currentStep.value = state.currentStep;
        if (state.stepCompletion) Object.assign(stepCompletion, state.stepCompletion);
        if (state.quickBio) Object.assign(quickBio, state.quickBio);
        if (state.profileConfig) Object.assign(profileConfig, state.profileConfig);
        if (state.availability) Object.assign(availability, state.availability);
        if (state.rateCards) Object.assign(rateCards, state.rateCards);
        if (state.verification) Object.assign(verification, state.verification);
        if (state.security) Object.assign(security, state.security);
      } catch (e) {
        console.error('Failed to load onboarding state:', e);
      }
    }

    // Then, derive completion status from actual user profile data
    // This ensures cross-device consistency
    if (userProfile) {
      deriveCompletionFromProfile(userProfile, specialistPrefs);
    }
  };

  // Derive step completion from actual user profile data
  // userProfile = data from /users/me
  // specialistPrefs = data from /users/availability (specialist_preferences collection)
  const deriveCompletionFromProfile = (userProfile, specialistPrefs = null) => {
    const profile = userProfile?.profile;
    const practice = userProfile?.professional_practice;
    const identityVerification = userProfile?.identity_verification;
    const categories = userProfile?.specialist_categories;
    const languages = userProfile?.languages;

    // Update account status from user profile
    if (userProfile?.status) {
      accountStatus.status = userProfile.status;
    }
    if (userProfile?.verification_status) {
      accountStatus.verification_status = userProfile.verification_status;
    }
    if (identityVerification?.overall_status) {
      accountStatus.identity_verification_overall = identityVerification.overall_status;
    }
    // Check if specialist has completed activation (has final_consents accepted)
    if (specialistPrefs?.final_consents?.code_of_conduct && specialistPrefs?.final_consents?.professional_indemnity) {
      accountStatus.is_activated = true;
    }

    // Account Creation: If user exists and is logged in, account is created
    if (userProfile?._id || userProfile?.email) {
      stepCompletion.accountCreation = true;
    }

    // Quick Bio: Check if basic profile info exists
    if (profile?.first_name && profile?.last_name && practice?.category) {
      stepCompletion.quickBio = true;
    }

    // Load practice location data from profile.contact
    if (profile?.contact) {
      const contact = profile.contact;
      if (contact.phone?.country_code) profileConfig.phone_country_code = contact.phone.country_code;
      if (contact.phone?.number) profileConfig.phone_number = contact.phone.number;
      if (contact.country) {
        profileConfig.country = contact.country;
        // Auto-determine diaspora status (Nigeria = local, other = diaspora)
        profileConfig.is_diaspora = contact.country.toLowerCase() !== 'nigeria';
      }
      if (contact.state) profileConfig.state = contact.state;
      if (contact.city) profileConfig.city = contact.city;
      if (contact.address1) profileConfig.address = contact.address1;
      if (contact.practice_type) profileConfig.practice_type = contact.practice_type;
      if (contact.is_diaspora !== undefined) profileConfig.is_diaspora = contact.is_diaspora;
    }

    // Profile Config: Check if professional bio and specializations exist
    if (
      (profile?.professional_bio || practice?.area_of_specialty) &&
      (categories?.length > 0 || practice?.area_of_specialty) &&
      (languages?.length > 0 || specialistPrefs?.preferences?.language)
    ) {
      stepCompletion.profileConfig = true;
    }

    // Availability: Check if time_availability array has entries
    if (specialistPrefs?.time_availability?.length > 0) {
      stepCompletion.availability = true;
    }

    // Rate Cards: Check if rate_cards has values set
    const rateCardsData = specialistPrefs?.rate_cards;
    if (rateCardsData) {
      const hasVideoRate = rateCardsData.video_consultation?.routine_rate > 0;
      const hasChatRate = rateCardsData.chat_consultation?.flat_rate > 0;
      if (hasVideoRate || hasChatRate) {
        stepCompletion.rateCards = true;
      }
    }
    // Also check service_rates
    const serviceRates = specialistPrefs?.service_rates;
    if (serviceRates) {
      const hasServiceRate = Object.values(serviceRates).some(
        r => r?.routine_rate > 0 || r?.flat_rate > 0
      );
      if (hasServiceRate) {
        stepCompletion.rateCards = true;
      }
    }

    // Verification: Check identity verification status
    if (identityVerification) {
      const govIdSubmitted = identityVerification.government_id?.type;
      const licenseSubmitted = identityVerification.medical_license?.license_number;

      // Update local verification state
      if (identityVerification.government_id) {
        Object.assign(verification.government_id, identityVerification.government_id);
      }
      if (identityVerification.medical_license) {
        Object.assign(verification.medical_license, identityVerification.medical_license);
      }

      // Mark as complete if documents are submitted (not necessarily verified yet)
      if (govIdSubmitted || licenseSubmitted) {
        stepCompletion.verification = true;
      }
    }

    // Security: Check if 2FA or notification preferences are set
    if (specialistPrefs?.notifications || specialistPrefs?.two_factor || specialistPrefs?.privacy_consents) {
      stepCompletion.security = true;
    }

    // Review & Activation: Check if final consents are accepted
    if (specialistPrefs?.final_consents?.code_of_conduct && specialistPrefs?.final_consents?.professional_indemnity) {
      stepCompletion.review = true;
    }

    // Save derived state to localStorage for this device
    saveProgress();
  };

  // Reset all state
  const reset = () => {
    currentStep.value = 1;
    Object.keys(stepCompletion).forEach(k => {
      stepCompletion[k] = k === 'setupDashboard';
    });

    // Reset all form data
    Object.assign(account, {
      email: '',
      phone: '',
      phone_country_code: '+234',
      password: '',
      ssoProvider: null,
      consents: { terms: false, privacy: false, marketing: false },
    });

    Object.assign(quickBio, {
      profile_image: null,
      profile_image_preview: '',
      full_name: '',
      gender: '',
      bio: '',
    });

    Object.assign(profileConfig, {
      display_name: '',
      years_experience: null,
      professional_bio: '',
      languages: [],
      primary_specialty: '',
      sub_specialties: [],
      phone_country_code: '+234',
      phone_number: '',
      country: 'Nigeria',
      state: '',
      city: '',
      address: '',
      practice_type: 'virtual_only',
      is_diaspora: false,
    });

    Object.assign(finalConsents, {
      code_of_conduct: false,
      professional_indemnity: false,
    });

    localStorage.removeItem('specialist_onboarding_state');
  };

  // Calculate weekly hours from availability
  const weeklyHours = computed(() => {
    let total = 0;
    for (const [day, schedule] of Object.entries(availability.weekly_schedule)) {
      if (schedule.enabled && schedule.start && schedule.end) {
        const start = parseInt(schedule.start.split(':')[0]);
        const end = parseInt(schedule.end.split(':')[0]);
        total += (end - start);
      }
    }
    return total;
  });

  // Calculate potential earnings
  const potentialEarnings = computed(() => {
    if (!rateCards.video_consultation.routine_rate) return 0;

    const slotsPerHour = 60 / availability.slot_duration;
    const weeklySlots = weeklyHours.value * slotsPerHour;
    const utilizationRate = 0.6; // Assume 60% booking rate
    const weeksPerMonth = 4;

    return Math.round(weeklySlots * utilizationRate * rateCards.video_consultation.routine_rate * weeksPerMonth);
  });

  return {
    // State
    currentStep,
    totalSteps,
    stepCompletion,
    stepMeta,
    accountStatus,

    // Form data
    account,
    quickBio,
    profileConfig,
    availability,
    rateCards,
    verification,
    security,
    finalConsents,

    // Computed
    progressPercent,
    isVerificationComplete,
    canActivate,
    currentStepInfo,
    weeklyHours,
    potentialEarnings,
    practiceStatus,

    // Methods
    isStepAccessible,
    getStepStatus,
    goToStep,
    nextStep,
    prevStep,
    completeStep,
    saveProgress,
    loadProgress,
    deriveCompletionFromProfile,
    reset,
  };
}

export default useOnboardingState;
