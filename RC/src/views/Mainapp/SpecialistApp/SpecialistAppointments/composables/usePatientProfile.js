/**
 * Specialist Appointments - Patient Profile & Health Data
 * Aggregates patient health information from multiple sources
 */

import { ref, reactive, computed, inject } from 'vue';
import { useToast } from 'vue-toast-notification';

export function usePatientProfile() {
  const $http = inject('$_HTTP');
  const toast = useToast();

  // State
  const isLoading = ref(false);
  const currentPatientId = ref(null);

  // Patient Basic Info
  const patient = reactive({
    id: '',
    name: '',
    email: '',
    phone: '',
    avatar: '',
    dateOfBirth: '',
    age: 0,
    gender: '',
    bloodType: '',
    emergencyContact: null,
  });

  // Health Scores
  const healthScores = reactive({
    basic: {
      score: 0,
      label: 'Unknown',
      trend: 0, // positive = improving, negative = declining
      lastUpdated: null,
    },
    advanced: {
      overall: 0,
      categories: {
        cardiovascular: { score: 0, label: '', status: '' },
        metabolic: { score: 0, label: '', status: '' },
        mentalHealth: { score: 0, label: '', status: '' },
        lifestyle: { score: 0, label: '', status: '' },
        preventiveCare: { score: 0, label: '', status: '' },
      },
      lastUpdated: null,
    },
    history: [], // Array of { date, score } for trend chart
  });

  // Health Checkups (Infermedica)
  const healthCheckups = reactive({
    list: [],
    total: 0,
    isLoading: false,
  });

  // Prescriptions
  const prescriptions = reactive({
    active: [],
    history: [],
    total: 0,
    isLoading: false,
  });

  // Vitals
  const vitals = reactive({
    recent: [],
    trends: {},
    connectedDevices: [],
    isLoading: false,
  });

  // Clinical Notes
  const clinicalNotes = reactive({
    list: [],
    total: 0,
    isLoading: false,
  });

  // Documents
  const documents = reactive({
    list: [],
    total: 0,
    isLoading: false,
  });

  // Alerts
  const alerts = reactive({
    list: [],
    critical: [],
    warnings: [],
    info: [],
  });

  // Appointments History
  const appointmentHistory = reactive({
    list: [],
    total: 0,
    isLoading: false,
  });

  // Computed
  const hasData = computed(() => !!patient.id);

  const healthScoreColor = computed(() => {
    const score = healthScores.basic.score;
    if (score >= 80) return '#22C55E'; // Excellent
    if (score >= 60) return '#4CAF50'; // Good
    if (score >= 40) return '#FFB800'; // Fair
    if (score >= 20) return '#F97316'; // Poor
    return '#EF4444'; // Critical
  });

  const healthScoreLabel = computed(() => {
    const score = healthScores.basic.score;
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Critical';
  });

  const activeAlertsCount = computed(() => alerts.list.length);

  const criticalAlertsCount = computed(() => alerts.critical.length);

  // Load complete patient profile
  async function loadPatientProfile(patientId) {
    if (!patientId) return;

    isLoading.value = true;
    currentPatientId.value = patientId;

    try {
      // Fetch basic patient info
      const userResponse = await $http.$_getUserById(patientId);
      if (userResponse.data?.data) {
        const userData = userResponse.data.data;
        Object.assign(patient, {
          id: userData._id,
          name: `${userData.profile?.first_name || ''} ${userData.profile?.last_name || ''}`.trim(),
          email: userData.email,
          phone: userData.profile?.phone_number?.number || '',
          avatar: userData.profile?.profile_image || '',
          dateOfBirth: userData.profile?.date_of_birth || '',
          age: calculateAge(userData.profile?.date_of_birth),
          gender: userData.profile?.gender || '',
          bloodType: userData.profile?.blood_type || '',
          emergencyContact: userData.profile?.emergency_contacts?.[0] || null,
        });
      }

      // Load all health data in parallel
      await Promise.all([
        loadHealthScores(patientId),
        loadHealthCheckups(patientId),
        loadPrescriptions(patientId),
        loadVitals(patientId),
        loadAppointmentHistory(patientId),
      ]);

      // Generate alerts based on loaded data
      generateAlerts();

    } catch (error) {
      console.error('Failed to load patient profile:', error);
      toast.error('Failed to load patient profile');
    } finally {
      isLoading.value = false;
    }
  }

  // Load health scores
  async function loadHealthScores(patientId) {
    try {
      // TODO: Call actual health score endpoint when available
      // For now, calculate from vitals and checkups

      // Mock calculation based on available data
      const vitalScore = calculateVitalScore();
      const checkupScore = calculateCheckupScore();

      healthScores.basic.score = Math.round((vitalScore + checkupScore) / 2) || 75;
      healthScores.basic.label = healthScoreLabel.value;
      healthScores.basic.lastUpdated = new Date().toISOString();

      // Advanced breakdown (mock for now)
      healthScores.advanced.overall = healthScores.basic.score;
      healthScores.advanced.categories = {
        cardiovascular: { score: 65, label: 'Fair', status: 'warning' },
        metabolic: { score: 78, label: 'Good', status: 'normal' },
        mentalHealth: { score: 85, label: 'Excellent', status: 'normal' },
        lifestyle: { score: 72, label: 'Good', status: 'normal' },
        preventiveCare: { score: 68, label: 'Fair', status: 'warning' },
      };
    } catch (error) {
      console.error('Failed to load health scores:', error);
    }
  }

  // Load health checkups (Infermedica)
  async function loadHealthCheckups(patientId) {
    healthCheckups.isLoading = true;
    try {
      const response = await $http.$_getHealthCheckupResults(patientId);
      if (response.data?.data) {
        healthCheckups.list = (response.data.data || []).map(checkup => ({
          id: checkup._id,
          date: checkup.created_at,
          triageLevel: checkup.response?.data?.triage_level || 'unknown',
          hasEmergency: checkup.response?.data?.has_emergency_evidence || false,
          symptoms: checkup.request?.symptoms || [],
          conditions: checkup.response?.data?.conditions || [],
          specialistRecommendations: checkup.response?.data?.specialist_recommendations || [],
          patientInfo: checkup.patient_info,
        }));
        healthCheckups.total = healthCheckups.list.length;
      }
    } catch (error) {
      console.error('Failed to load health checkups:', error);
    } finally {
      healthCheckups.isLoading = false;
    }
  }

  // Load prescriptions
  async function loadPrescriptions(patientId) {
    prescriptions.isLoading = true;
    try {
      const response = await $http.$_getPrescriptions({ patient_id: patientId });
      if (response.data?.data) {
        const allPrescriptions = response.data.data || [];

        prescriptions.active = allPrescriptions.filter(rx =>
          rx.status === 'active' && new Date(rx.expiry_date) > new Date()
        );
        prescriptions.history = allPrescriptions;
        prescriptions.total = allPrescriptions.length;
      }
    } catch (error) {
      console.error('Failed to load prescriptions:', error);
    } finally {
      prescriptions.isLoading = false;
    }
  }

  // Load vitals
  async function loadVitals(patientId) {
    vitals.isLoading = true;
    try {
      const response = await $http.$_getVitals({ user_id: patientId, limit: 20 });
      if (response.data?.data) {
        vitals.recent = response.data.data || [];

        // Group by type for trends
        vitals.trends = groupVitalsByType(vitals.recent);
      }
    } catch (error) {
      console.error('Failed to load vitals:', error);
    } finally {
      vitals.isLoading = false;
    }
  }

  // Load appointment history
  async function loadAppointmentHistory(patientId) {
    appointmentHistory.isLoading = true;
    try {
      const response = await $http.$_getAppointments({
        patient_id: patientId,
        limit: 10,
        sort: '-date',
      });
      if (response.data?.data) {
        appointmentHistory.list = response.data.data || [];
        appointmentHistory.total = response.data.total || appointmentHistory.list.length;
      }
    } catch (error) {
      console.error('Failed to load appointment history:', error);
    } finally {
      appointmentHistory.isLoading = false;
    }
  }

  // Generate alerts based on health data
  function generateAlerts() {
    alerts.list = [];
    alerts.critical = [];
    alerts.warnings = [];
    alerts.info = [];

    // Check vitals for abnormalities
    const latestBP = vitals.recent.find(v => v.type === 'blood_pressure');
    if (latestBP) {
      const systolic = latestBP.value?.systolic || latestBP.systolic;
      if (systolic > 140) {
        const alert = {
          id: 'bp_high',
          type: 'critical',
          icon: 'hi-heart',
          title: 'Elevated Blood Pressure',
          message: `BP reading ${systolic}/${latestBP.value?.diastolic || latestBP.diastolic} mmHg - Above normal range`,
          date: latestBP.created_at,
        };
        alerts.critical.push(alert);
        alerts.list.push(alert);
      }
    }

    // Check for overdue follow-ups
    const lastCheckup = healthCheckups.list[0];
    if (lastCheckup) {
      const daysSinceCheckup = Math.floor(
        (new Date() - new Date(lastCheckup.date)) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceCheckup > 90) {
        const alert = {
          id: 'checkup_overdue',
          type: 'warning',
          icon: 'hi-clock',
          title: 'Follow-up Overdue',
          message: `Last health checkup was ${daysSinceCheckup} days ago`,
          date: lastCheckup.date,
        };
        alerts.warnings.push(alert);
        alerts.list.push(alert);
      }
    }

    // Check for expiring prescriptions
    prescriptions.active.forEach(rx => {
      const daysUntilExpiry = Math.floor(
        (new Date(rx.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        const alert = {
          id: `rx_expiring_${rx._id}`,
          type: 'info',
          icon: 'hi-document-text',
          title: 'Prescription Expiring',
          message: `${rx.medication_name} expires in ${daysUntilExpiry} days`,
          date: rx.expiry_date,
        };
        alerts.info.push(alert);
        alerts.list.push(alert);
      }
    });

    // Check for emergency triage in recent checkups
    const emergencyCheckup = healthCheckups.list.find(c => c.hasEmergency);
    if (emergencyCheckup) {
      const daysSince = Math.floor(
        (new Date() - new Date(emergencyCheckup.date)) / (1000 * 60 * 60 * 24)
      );
      if (daysSince <= 7) {
        const alert = {
          id: 'emergency_checkup',
          type: 'critical',
          icon: 'hi-exclamation-triangle',
          title: 'Recent Emergency Symptoms',
          message: `Patient reported emergency symptoms ${daysSince} days ago`,
          date: emergencyCheckup.date,
        };
        alerts.critical.push(alert);
        alerts.list.push(alert);
      }
    }
  }

  // Helper functions
  function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  function calculateVitalScore() {
    if (vitals.recent.length === 0) return 75; // Default

    let score = 100;
    const bp = vitals.recent.find(v => v.type === 'blood_pressure');
    if (bp) {
      const systolic = bp.value?.systolic || bp.systolic;
      if (systolic > 140) score -= 20;
      else if (systolic > 130) score -= 10;
    }
    return Math.max(0, score);
  }

  function calculateCheckupScore() {
    if (healthCheckups.list.length === 0) return 75;

    const recent = healthCheckups.list[0];
    if (recent.triageLevel === 'emergency') return 30;
    if (recent.triageLevel === 'consultation') return 60;
    return 85;
  }

  function groupVitalsByType(vitalsList) {
    return vitalsList.reduce((acc, vital) => {
      const type = vital.type || 'other';
      if (!acc[type]) acc[type] = [];
      acc[type].push(vital);
      return acc;
    }, {});
  }

  // Get triage badge info
  function getTriageInfo(level) {
    const info = {
      emergency: { color: '#DC2626', bg: '#FEE2E2', label: 'Emergency', icon: 'hi-exclamation-triangle' },
      consultation: { color: '#F59E0B', bg: '#FEF3C7', label: 'Consultation', icon: 'hi-user' },
      self_care: { color: '#22C55E', bg: '#DCFCE7', label: 'Self-Care', icon: 'hi-check-circle' },
    };
    return info[level] || info.consultation;
  }

  // Clear patient data
  function clearPatient() {
    currentPatientId.value = null;
    Object.assign(patient, {
      id: '', name: '', email: '', phone: '', avatar: '',
      dateOfBirth: '', age: 0, gender: '', bloodType: '', emergencyContact: null,
    });
    healthScores.basic = { score: 0, label: 'Unknown', trend: 0, lastUpdated: null };
    healthCheckups.list = [];
    prescriptions.active = [];
    prescriptions.history = [];
    vitals.recent = [];
    clinicalNotes.list = [];
    documents.list = [];
    alerts.list = [];
    alerts.critical = [];
    alerts.warnings = [];
    alerts.info = [];
    appointmentHistory.list = [];
  }

  return {
    // State
    isLoading,
    currentPatientId,
    patient,
    healthScores,
    healthCheckups,
    prescriptions,
    vitals,
    clinicalNotes,
    documents,
    alerts,
    appointmentHistory,

    // Computed
    hasData,
    healthScoreColor,
    healthScoreLabel,
    activeAlertsCount,
    criticalAlertsCount,

    // Methods
    loadPatientProfile,
    loadHealthScores,
    loadHealthCheckups,
    loadPrescriptions,
    loadVitals,
    loadAppointmentHistory,
    generateAlerts,
    getTriageInfo,
    clearPatient,
  };
}
