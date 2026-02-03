import { ref, reactive, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';

// Singleton state for the patient onboarding flow
const currentStep = ref(1); // Default to Setup Dashboard
const totalSteps = 9;

// Step completion status
const stepCompletion = reactive({
  setupDashboard: true, // Hub is always "complete"
  personalDetails: false,
  addressEmergency: false,
  dependants: false,
  vitalsMetrics: false,
  allergies: false,
  medicalHistory: false,
  deviceIntegration: false,
  walletCredits: false,
});

// Step requirements (which are skippable)
const stepRequirements = {
  setupDashboard: { required: true, skippable: false },
  personalDetails: { required: true, skippable: false },
  addressEmergency: { required: true, skippable: false },
  dependants: { required: false, skippable: true },
  vitalsMetrics: { required: false, skippable: true },
  allergies: { required: false, skippable: true },
  medicalHistory: { required: false, skippable: true },
  deviceIntegration: { required: false, skippable: true },
  walletCredits: { required: false, skippable: true },
};

// Step 1: Setup Dashboard (hub page - no form data)

// Step 2: Personal Details
const personalDetails = reactive({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '', // 'male' | 'female' | 'other'
  phone_country_code: '+234',
  phone_number: '',
  profile_image: null,
  profile_image_preview: '',
  blood_type: '',
  genotype: '',
  marital_status: '', // 'single' | 'married' | 'divorced' | 'widowed'
  occupation: '',
});

// Step 3: Address & Emergency Contact
const addressEmergency = reactive({
  // Address
  country: 'Nigeria',
  state: '',
  city: '',
  address: '',
  postal_code: '',
  // Emergency Contact
  emergency_contact: {
    name: '',
    relationship: '', // 'spouse' | 'parent' | 'sibling' | 'child' | 'friend' | 'other'
    phone_country_code: '+234',
    phone_number: '',
    email: '',
    // Address fields for emergency contact
    address: '',
    country: '',
    state: '',
    city: '',
    postal_code: '',
  },
  // Additional emergency contacts (optional)
  additional_contacts: [],
});

// Step 4: Dependants / Family Members
const dependants = reactive({
  has_dependants: false,
  dependants: [], // Array of { name, relationship, date_of_birth, gender, blood_type }
});

// Step 5: Vitals & Basic Health Metrics
const vitalsMetrics = reactive({
  height: null, // in cm
  height_unit: 'cm',
  weight: null, // in kg
  weight_unit: 'kg',
  blood_pressure: {
    systolic: null,
    diastolic: null,
  },
  heart_rate: null,
  temperature: null,
  last_checkup_date: '',
  primary_physician: '',
});

// Step 6: Allergies & Drug Reactions
const allergies = reactive({
  has_allergies: null, // null = not answered, true = yes, false = no
  drug_allergies: [], // Array of { drug_name, reaction, severity }
  food_allergies: [], // Array of { food_name, reaction, severity }
  environmental_allergies: [], // Array of { allergen, reaction, severity }
  other_allergies: [], // Array of { allergen, reaction, severity }
});

// Step 7: Medical History
const medicalHistory = reactive({
  chronic_conditions: [], // Array of condition strings
  past_surgeries: [], // Array of { procedure, year, notes }
  current_medications: [], // Array of { name, strength, form, dosage, frequency, route, reason, start_date }
  family_history: [], // Array of { condition, relation }
  lifestyle: {
    smoking: '', // 'never' | 'former' | 'current' | 'occasional'
    alcohol: '', // 'never' | 'occasional' | 'moderate' | 'heavy'
    exercise: '', // 'sedentary' | 'light' | 'moderate' | 'active'
    diet: '', // 'regular' | 'vegetarian' | 'vegan' | 'keto' | 'other'
  },
  immunizations: [], // Array of { vaccine, date }
});

// Step 8: Device & Health Data Integration
const deviceIntegration = reactive({
  devices_connected: [],
  health_apps_connected: [], // 'apple_health' | 'google_fit' | 'fitbit' | 'samsung_health'
  data_sharing_consents: {
    vitals_auto_sync: false,
    activity_tracking: false,
    sleep_tracking: false,
    nutrition_tracking: false,
  },
  notification_preferences: {
    health_reminders: true,
    medication_reminders: true,
    appointment_reminders: true,
    wellness_tips: false,
  },
});

// Step 9: Wallet & Credits (stored for display purposes)
const walletCredits = reactive({
  walletBalance: 0,
  credits: {
    free_remaining: 0,
    free_total: 5,
    purchased: 0,
    gifted: 0,
  },
});

// Profile completion tracking
const profileStatus = reactive({
  is_profile_complete: false,
  completion_percentage: 0,
  last_updated: null,
});

// Step metadata for navigation
const stepMeta = {
  1: { key: 'setupDashboard', name: 'Setup Dashboard', route: 'PatientSetupDashboard' },
  2: { key: 'personalDetails', name: 'Personal Details', route: 'PatientPersonalDetails' },
  3: { key: 'addressEmergency', name: 'Address & Emergency', route: 'PatientAddressEmergency' },
  4: { key: 'dependants', name: 'Dependants', route: 'PatientDependants' },
  5: { key: 'vitalsMetrics', name: 'Vitals & Metrics', route: 'PatientVitalsMetrics' },
  6: { key: 'allergies', name: 'Allergies', route: 'PatientAllergies' },
  7: { key: 'medicalHistory', name: 'Medical History', route: 'PatientMedicalHistory' },
  8: { key: 'deviceIntegration', name: 'Devices & Apps', route: 'PatientDeviceIntegration' },
  9: { key: 'walletCredits', name: 'Wallet & Credits', route: 'PatientWalletCredits' },
};

export function usePatientOnboardingState() {
  const router = useRouter();
  const route = useRoute();

  // Computed: Overall progress percentage
  const progressPercent = computed(() => {
    const weights = {
      setupDashboard: 0,
      personalDetails: 18,
      addressEmergency: 18,
      dependants: 10,
      vitalsMetrics: 14,
      allergies: 10,
      medicalHistory: 14,
      deviceIntegration: 8,
      walletCredits: 8,
    };

    let completed = 0;
    let total = 0;

    for (const [key, weight] of Object.entries(weights)) {
      total += weight;
      if (stepCompletion[key]) completed += weight;
    }

    return Math.round((completed / total) * 100);
  });

  // Computed: Required steps completed
  const requiredStepsCompleted = computed(() => {
    return stepCompletion.personalDetails && stepCompletion.addressEmergency;
  });

  // Computed: Can complete profile
  const canCompleteProfile = computed(() => {
    return requiredStepsCompleted.value;
  });

  // Computed: Current step info
  const currentStepInfo = computed(() => {
    return stepMeta[currentStep.value] || stepMeta[1];
  });

  // Computed: Profile Status - comprehensive status based on completion
  const onboardingStatus = computed(() => {
    // Check if all required steps are complete
    if (requiredStepsCompleted.value) {
      if (progressPercent.value >= 100) {
        return {
          key: 'complete',
          label: 'Profile Complete',
          description: 'Your health profile is fully set up.',
          color: 'green',
          icon: 'hi-check-circle',
        };
      }
      return {
        key: 'ready',
        label: 'Basic Setup Complete',
        description: 'You can now use all features. Complete optional steps for a better experience.',
        color: 'blue',
        icon: 'hi-badge-check',
      };
    }

    // Still in setup
    return {
      key: 'setup',
      label: 'Setup In Progress',
      description: `${progressPercent.value}% complete`,
      color: 'orange',
      icon: 'hi-cog',
    };
  });

  // Check if step is required
  const isStepRequired = (stepKey) => {
    return stepRequirements[stepKey]?.required ?? false;
  };

  // Check if step is skippable
  const isStepSkippable = (stepKey) => {
    return stepRequirements[stepKey]?.skippable ?? true;
  };

  // Computed: Is step accessible
  const isStepAccessible = (step) => {
    // Setup Dashboard is always accessible
    if (step === 1) return true;

    // All other steps are freely accessible
    return step >= 1 && step <= totalSteps;
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

  // Skip current step (if skippable)
  const skipStep = () => {
    const currentKey = stepMeta[currentStep.value]?.key;
    if (currentKey && isStepSkippable(currentKey)) {
      nextStep();
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
      personalDetails: { ...personalDetails },
      addressEmergency: { ...addressEmergency },
      dependants: { ...dependants },
      vitalsMetrics: { ...vitalsMetrics },
      allergies: { ...allergies },
      medicalHistory: { ...medicalHistory },
      deviceIntegration: { ...deviceIntegration },
    };
    localStorage.setItem('patient_onboarding_state', JSON.stringify(state));
  };

  // Load progress from localStorage and user profile
  const loadProgress = (userProfile = null, recentVitals = null, walletCreditsData = null) => {
    // First, load from localStorage for session state
    const saved = localStorage.getItem('patient_onboarding_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.currentStep) currentStep.value = state.currentStep;
        if (state.stepCompletion) Object.assign(stepCompletion, state.stepCompletion);
        if (state.personalDetails) Object.assign(personalDetails, state.personalDetails);
        if (state.addressEmergency) Object.assign(addressEmergency, state.addressEmergency);
        if (state.dependants) Object.assign(dependants, state.dependants);
        if (state.vitalsMetrics) Object.assign(vitalsMetrics, state.vitalsMetrics);
        if (state.allergies) Object.assign(allergies, state.allergies);
        if (state.medicalHistory) Object.assign(medicalHistory, state.medicalHistory);
        if (state.deviceIntegration) Object.assign(deviceIntegration, state.deviceIntegration);
      } catch (e) {
        console.error('Failed to load patient onboarding state:', e);
      }
    }

    // Then, derive completion status from actual user profile data
    if (userProfile) {
      deriveCompletionFromProfile(userProfile, recentVitals, walletCreditsData);
    }
  };

  // Derive step completion from actual user profile data
  const deriveCompletionFromProfile = (userProfile, recentVitals = null, walletCreditsData = null) => {
    const profile = userProfile?.profile;
    const medicalInfo = userProfile?.medical_history;

    // Personal Details: Check if basic profile info exists
    if (profile?.first_name && profile?.last_name && profile?.date_of_birth) {
      stepCompletion.personalDetails = true;
      // Populate form data
      personalDetails.first_name = profile.first_name || '';
      personalDetails.last_name = profile.last_name || '';
      personalDetails.date_of_birth = profile.date_of_birth || '';
      personalDetails.gender = profile.gender || '';
      // Phone number is stored in profile.contact.phone
      personalDetails.phone_country_code = profile.contact?.phone?.country_code || '+234';
      personalDetails.phone_number = profile.contact?.phone?.number || '';
      personalDetails.blood_type = profile.blood_type || '';
      personalDetails.genotype = profile.genotype || '';
      personalDetails.marital_status = profile.marital_status || '';
      personalDetails.occupation = profile.occupation || '';
      personalDetails.profile_image_preview = profile.profile_image || profile.profile_photo || '';
    }

    // Address & Emergency Contact: Check if emergency contacts exist
    // Note: emergency_contacts is at top level of user, not inside profile
    const userEmergencyContacts = userProfile?.emergency_contacts;
    if (userEmergencyContacts && userEmergencyContacts.length > 0) {
      stepCompletion.addressEmergency = true;
      // Populate emergency contact - mapping from entity structure to form structure
      const primaryContact = userEmergencyContacts[0];
      // Entity has first_name/last_name, compose into name for display
      const contactName = primaryContact.name ||
        [primaryContact.first_name, primaryContact.last_name].filter(Boolean).join(' ') || '';
      addressEmergency.emergency_contact = {
        name: contactName,
        relationship: primaryContact.relationship || '',
        // Entity has phone.country_code and phone.number
        phone_country_code: primaryContact.phone_country_code || primaryContact.phone?.country_code || '+234',
        phone_number: primaryContact.phone_number || primaryContact.phone?.number || '',
        email: primaryContact.email || '',
        // Address fields for emergency contact (backend uses address1 and zip_code)
        address: primaryContact.address1 || primaryContact.address || '',
        country: primaryContact.country || '',
        state: primaryContact.state || '',
        city: primaryContact.city || '',
        postal_code: primaryContact.zip_code || primaryContact.postal_code || '',
        same_as_patient: primaryContact.same_as_patient || false,
      };
      // Map additional contacts with same structure handling
      addressEmergency.additional_contacts = userEmergencyContacts.slice(1).map(contact => ({
        name: contact.name || [contact.first_name, contact.last_name].filter(Boolean).join(' ') || '',
        relationship: contact.relationship || '',
        phone_country_code: contact.phone_country_code || contact.phone?.country_code || '+234',
        phone_number: contact.phone_number || contact.phone?.number || '',
        email: contact.email || '',
        // Address fields (backend uses address1 and zip_code)
        address: contact.address1 || contact.address || '',
        country: contact.country || '',
        state: contact.state || '',
        city: contact.city || '',
        postal_code: contact.zip_code || contact.postal_code || '',
        same_address: contact.same_as_patient || false,
      }));
    }

    // Address info from profile
    if (profile?.contact) {
      addressEmergency.country = profile.contact.country || 'Nigeria';
      addressEmergency.state = profile.contact.state || '';
      addressEmergency.city = profile.contact.city || '';
      addressEmergency.address = profile.contact.address1 || '';
      addressEmergency.postal_code = profile.contact.zip_code || '';
    }

    // Dependants: Check if dependants exist
    if (userProfile?.dependants && userProfile.dependants.length > 0) {
      stepCompletion.dependants = true;
      dependants.has_dependants = true;
      dependants.dependants = userProfile.dependants;
    }

    // Vitals: Check if recent vitals exist (from recentVitals store or profile.basic_health_info)
    // Profile structure: profile.basic_health_info.height.value, profile.basic_health_info.weight.value
    // recentVitals structure: { body_weight: { value, unit }, body_temp: { value, unit }, blood_pressure: { value, unit }, pulse_rate: { value, unit } }
    const basicHealthInfo = profile?.basic_health_info;
    const hasProfileVitals = basicHealthInfo?.height?.value || basicHealthInfo?.weight?.value;
    const hasRecentVitals = recentVitals && (recentVitals.body_weight || recentVitals.body_temp || recentVitals.blood_pressure || recentVitals.pulse_rate);

    if (hasProfileVitals || hasRecentVitals) {
      stepCompletion.vitalsMetrics = true;

      // Height from profile.basic_health_info
      if (basicHealthInfo?.height?.value) {
        vitalsMetrics.height = parseFloat(basicHealthInfo.height.value) || null;
        vitalsMetrics.height_unit = basicHealthInfo.height.unit || 'cm';
      }

      // Weight from profile.basic_health_info or recentVitals
      if (basicHealthInfo?.weight?.value) {
        vitalsMetrics.weight = parseFloat(basicHealthInfo.weight.value) || null;
        vitalsMetrics.weight_unit = basicHealthInfo.weight.unit || 'kg';
      } else if (recentVitals?.body_weight?.value) {
        vitalsMetrics.weight = parseFloat(recentVitals.body_weight.value) || null;
        vitalsMetrics.weight_unit = recentVitals.body_weight.unit || 'kg';
      }

      // Blood pressure from recentVitals (format: "120/80")
      if (recentVitals?.blood_pressure?.value) {
        const bpValue = recentVitals.blood_pressure.value;
        if (typeof bpValue === 'string' && bpValue.includes('/')) {
          const [systolic, diastolic] = bpValue.split('/').map(v => parseInt(v.trim(), 10));
          vitalsMetrics.blood_pressure.systolic = systolic || null;
          vitalsMetrics.blood_pressure.diastolic = diastolic || null;
        }
      }

      // Heart rate / pulse rate from recentVitals
      if (recentVitals?.pulse_rate?.value) {
        vitalsMetrics.heart_rate = parseFloat(recentVitals.pulse_rate.value) || null;
      }

      // Temperature from recentVitals
      if (recentVitals?.body_temp?.value) {
        vitalsMetrics.temperature = parseFloat(recentVitals.body_temp.value) || null;
      }
    }

    // Allergies: Check if allergies info exists (stored at top level as userProfile.allergies)
    const userAllergies = userProfile?.allergies;
    if (userAllergies && (userAllergies.has_allergies !== undefined || userAllergies.drug_allergies?.length || userAllergies.food_allergies?.length)) {
      stepCompletion.allergies = true;
      allergies.has_allergies = userAllergies.has_allergies;
      allergies.drug_allergies = userAllergies.drug_allergies || [];
      allergies.food_allergies = userAllergies.food_allergies || [];
      allergies.environmental_allergies = userAllergies.environmental_allergies || [];
      allergies.other_allergies = userAllergies.other_allergies || [];
    }

    // Medical History: Check if medical history exists
    if (medicalInfo || profile?.medical_history) {
      const history = medicalInfo || profile.medical_history;
      if (history.chronic_conditions?.length || history.past_surgeries?.length || history.current_medications?.length || history.family_history?.length || history.immunizations?.length) {
        stepCompletion.medicalHistory = true;
        medicalHistory.chronic_conditions = history.chronic_conditions || [];
        medicalHistory.past_surgeries = history.past_surgeries || [];
        medicalHistory.current_medications = history.current_medications || [];
        medicalHistory.family_history = history.family_history || [];
        medicalHistory.immunizations = history.immunizations || [];
        if (history.lifestyle) {
          Object.assign(medicalHistory.lifestyle, history.lifestyle);
        }
      }
    }

    // Device Integration: Check if any devices or health apps are connected
    const userDeviceIntegration = userProfile?.device_integration;
    if (userDeviceIntegration?.health_apps_connected?.length > 0 || userDeviceIntegration?.devices_connected?.length > 0) {
      stepCompletion.deviceIntegration = true;
      deviceIntegration.devices_connected = userDeviceIntegration.devices_connected || [];
      deviceIntegration.health_apps_connected = userDeviceIntegration.health_apps_connected || [];
      if (userDeviceIntegration.data_sharing_consents) {
        Object.assign(deviceIntegration.data_sharing_consents, userDeviceIntegration.data_sharing_consents);
      }
      if (userDeviceIntegration.notification_preferences) {
        Object.assign(deviceIntegration.notification_preferences, userDeviceIntegration.notification_preferences);
      }
    }

    // Wallet & Credits: Check if user has wallet balance or credits
    if (walletCreditsData) {
      // Store the data for display
      walletCredits.walletBalance = walletCreditsData.walletBalance || 0;
      if (walletCreditsData.credits) {
        Object.assign(walletCredits.credits, walletCreditsData.credits);
      }

      const hasWalletBalance = walletCredits.walletBalance > 0;
      const hasCredits =
        (walletCredits.credits.free_remaining || 0) +
        (walletCredits.credits.purchased || 0) +
        (walletCredits.credits.gifted || 0) > 0;

      if (hasWalletBalance || hasCredits) {
        stepCompletion.walletCredits = true;
      }
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
    Object.assign(personalDetails, {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      phone_country_code: '+234',
      phone_number: '',
      profile_image: null,
      profile_image_preview: '',
      blood_type: '',
      genotype: '',
      marital_status: '',
      occupation: '',
    });

    Object.assign(addressEmergency, {
      country: 'Nigeria',
      state: '',
      city: '',
      address: '',
      postal_code: '',
      emergency_contact: {
        name: '',
        relationship: '',
        phone_country_code: '+234',
        phone_number: '',
        email: '',
        // Address fields
        address: '',
        country: '',
        state: '',
        city: '',
        postal_code: '',
      },
      additional_contacts: [],
    });

    Object.assign(dependants, {
      has_dependants: false,
      dependants: [],
    });

    Object.assign(vitalsMetrics, {
      height: null,
      height_unit: 'cm',
      weight: null,
      weight_unit: 'kg',
      blood_pressure: { systolic: null, diastolic: null },
      heart_rate: null,
      temperature: null,
      last_checkup_date: '',
      primary_physician: '',
    });

    Object.assign(allergies, {
      has_allergies: null,
      drug_allergies: [],
      food_allergies: [],
      environmental_allergies: [],
      other_allergies: [],
    });

    Object.assign(medicalHistory, {
      chronic_conditions: [],
      past_surgeries: [],
      current_medications: [],
      family_history: [],
      lifestyle: {
        smoking: '',
        alcohol: '',
        exercise: '',
        diet: '',
      },
      immunizations: [],
    });

    Object.assign(deviceIntegration, {
      devices_connected: [],
      health_apps_connected: [],
      data_sharing_consents: {
        vitals_auto_sync: false,
        activity_tracking: false,
        sleep_tracking: false,
        nutrition_tracking: false,
      },
      notification_preferences: {
        health_reminders: true,
        medication_reminders: true,
        appointment_reminders: true,
        wellness_tips: false,
      },
    });

    localStorage.removeItem('patient_onboarding_state');
  };

  // Calculate BMI from vitals
  const bmi = computed(() => {
    if (vitalsMetrics.height && vitalsMetrics.weight) {
      const heightInMeters = vitalsMetrics.height / 100;
      return (vitalsMetrics.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  });

  // Get BMI category
  const bmiCategory = computed(() => {
    if (!bmi.value) return null;
    const value = parseFloat(bmi.value);
    if (value < 18.5) return { label: 'Underweight', color: '#F59E0B' };
    if (value < 25) return { label: 'Normal', color: '#10B981' };
    if (value < 30) return { label: 'Overweight', color: '#F59E0B' };
    return { label: 'Obese', color: '#EF4444' };
  });

  return {
    // State
    currentStep,
    totalSteps,
    stepCompletion,
    stepMeta,
    stepRequirements,
    profileStatus,

    // Form data
    personalDetails,
    addressEmergency,
    dependants,
    vitalsMetrics,
    allergies,
    medicalHistory,
    deviceIntegration,
    walletCredits,

    // Computed
    progressPercent,
    requiredStepsCompleted,
    canCompleteProfile,
    currentStepInfo,
    onboardingStatus,
    bmi,
    bmiCategory,

    // Methods
    isStepRequired,
    isStepSkippable,
    isStepAccessible,
    getStepStatus,
    goToStep,
    nextStep,
    prevStep,
    skipStep,
    completeStep,
    saveProgress,
    loadProgress,
    deriveCompletionFromProfile,
    reset,
  };
}

export default usePatientOnboardingState;
