<template>
  <div class="dashboard-v2">
    <!-- Ambient Background -->
    <div class="ambient-bg">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="notification-btn" @click="goToNotifications">
        <v-icon name="hi-bell" scale="1.1" />
        <span v-if="unreadNotifications > 0" class="notification-badge">{{ unreadNotifications }}</span>
      </button>
    </header>

    <!-- Main Content -->
    <main class="dashboard-content">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-greeting">
          <div class="greeting-content">
            <span class="greeting-time">{{ timeGreeting }}</span>
            <h1 class="greeting-name">{{ userName }}</h1>
            <p class="greeting-subtitle">{{ healthStatusMessage }}</p>
          </div>
          <div class="hero-avatar" @click="goToProfile">
            <img v-if="userAvatar" :src="userAvatar" :alt="userName" />
            <div v-else class="avatar-placeholder">
              <v-icon name="hi-user" scale="1.5" />
            </div>
            <div class="avatar-status" :class="healthStatusClass"></div>
          </div>
        </div>

        <!-- Health Score Orb -->
        <div class="health-orb-container" @click="goToHealthScore">
          <div class="health-orb" :class="[healthOrbClass, { premium: isPremiumScore }]">
            <div class="orb-ring"></div>
            <div class="orb-ring ring-2"></div>
            <div class="orb-ring ring-3"></div>
            <div class="orb-inner">
              <span class="orb-score">{{ healthScore || '--' }}</span>
              <span class="orb-label">{{ isPremiumScore ? 'Premium Score' : 'Health Score' }}</span>
            </div>
          </div>
          <div class="orb-glow"></div>
        </div>
      </section>

      <!-- Quick Stats Bar -->
      <section class="stats-bar">
        <div class="stat-item" @click="goToAppointments">
          <div class="stat-icon appointments">
            <v-icon name="hi-calendar" scale="0.9" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ upcomingCount }}</span>
            <span class="stat-label">Upcoming</span>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" @click="goToPrescriptions">
          <div class="stat-icon prescriptions">
            <v-icon name="hi-document-text" scale="0.9" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ activePrescriptions }}</span>
            <span class="stat-label">Active Rx</span>
          </div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item" @click="goToCredits">
          <div class="stat-icon" :class="hasAICredits ? 'credits' : 'wallet'">
            <v-icon :name="hasAICredits ? 'hi-sparkles' : 'bi-wallet2'" scale="0.9" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ hasAICredits ? aiCredits : formatWallet(walletBalance) }}</span>
            <span class="stat-label">{{ hasAICredits ? 'AI Credits' : 'Wallet' }}</span>
          </div>
        </div>
      </section>

      <!-- Profile Completion Banner -->
      <section v-if="showProfileBanner" class="profile-banner" :class="{ 'profile-banner--complete': profileProgress >= 100 }">
        <div class="profile-banner__header">
          <div class="profile-banner__info">
            <div class="profile-banner__icon" :class="{ complete: profileProgress >= 100 }">
              <v-icon :name="profileProgress >= 100 ? 'hi-check-circle' : 'hi-user-circle'" scale="1.2" />
            </div>
            <div class="profile-banner__text">
              <h3>{{ profileProgress >= 100 ? 'Profile Complete!' : 'Complete Your Profile' }}</h3>
              <p>{{ profileProgress >= 100 ? 'Your health profile is up to date' : 'Add details for better care recommendations' }}</p>
            </div>
          </div>
          <div class="profile-banner__progress">
            <svg class="progress-ring" viewBox="0 0 48 48">
              <circle class="progress-ring__bg" cx="24" cy="24" r="20" />
              <circle
                class="progress-ring__fill"
                :class="{ complete: profileProgress >= 100 }"
                cx="24" cy="24" r="20"
                :style="{ strokeDashoffset: profileProgressOffset }"
              />
            </svg>
            <span class="progress-value" :class="{ complete: profileProgress >= 100 }">
              <v-icon v-if="profileProgress >= 100" name="hi-check" scale="0.8" />
              <template v-else>{{ profileProgress }}%</template>
            </span>
          </div>
          <button class="profile-banner__dismiss" @click="dismissProfileBanner">
            <v-icon name="hi-x" scale="0.8" />
          </button>
        </div>
        <div v-if="profileProgress < 100" class="profile-banner__steps">
          <router-link
            v-for="step in incompleteProfileSteps"
            :key="step.key"
            :to="step.route"
            class="profile-step"
          >
            <div class="profile-step__icon" :style="{ background: step.color }">
              <v-icon :name="step.icon" scale="0.75" />
            </div>
            <div class="profile-step__info">
              <span class="profile-step__title">{{ step.title }}</span>
              <span class="profile-step__desc">{{ step.description }}</span>
            </div>
            <v-icon name="hi-chevron-right" scale="0.7" class="profile-step__arrow" />
          </router-link>
        </div>
      </section>

      <!-- Bento Grid -->
      <section class="bento-grid">
        <!-- Quick Actions Card -->
        <div class="bento-card actions-card">
          <div class="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div class="actions-grid">
            <button class="action-btn" @click="goToHealthCheckup">
              <div class="action-icon checkup">
                <v-icon name="hi-clipboard-check" scale="1.1" />
              </div>
              <span>Health Checkup</span>
            </button>
            <button class="action-btn" @click="goToBookAppointment">
              <div class="action-icon book">
                <v-icon name="hi-plus-circle" scale="1.1" />
              </div>
              <span>Book Doctor</span>
            </button>
            <button class="action-btn" @click="goToVitals">
              <div class="action-icon vitals">
                <v-icon name="hi-chart-bar" scale="1.1" />
              </div>
              <span>Log Vitals</span>
            </button>
            <button class="action-btn" @click="goToPharmacy">
              <div class="action-icon pharmacy">
                <v-icon name="ri-capsule-line" scale="1.1" />
              </div>
              <span>Pharmacy</span>
            </button>
          </div>
        </div>

        <!-- Upcoming Appointment Card -->
        <div class="bento-card appointment-card" :class="{ 'has-appointment': nextAppointment }">
          <div class="card-header">
            <h3>Next Appointment</h3>
            <router-link to="/app/patient/appointmentsv2" class="see-all">
              See all
              <v-icon name="hi-arrow-right" scale="0.7" />
            </router-link>
          </div>

          <div v-if="nextAppointment" class="appointment-preview">
            <div class="appointment-header">
              <div class="appointment-date-badge" :class="{ 'is-text-date': isTextDate(nextAppointment.start_time) }">
                <span class="date-day">{{ formatAppointmentDay(nextAppointment.start_time) }}</span>
                <span v-if="formatAppointmentMonth(nextAppointment.start_time)" class="date-month">{{ formatAppointmentMonth(nextAppointment.start_time) }}</span>
              </div>
              <div class="appointment-time-pill">
                <v-icon name="hi-clock" scale="0.7" />
                <span>{{ formatAppointmentTime(nextAppointment.start_time) }}</span>
              </div>
            </div>
            <div class="appointment-doctor">
              <img
                v-if="nextAppointment.specialist?.profile?.profile_photo"
                :src="nextAppointment.specialist.profile.profile_photo"
                :alt="nextAppointment.specialist.full_name"
                class="doctor-avatar"
              />
              <div v-else class="doctor-avatar placeholder">
                <v-icon name="hi-user" scale="1" />
              </div>
              <div class="doctor-info">
                <h4>{{ nextAppointment.specialist?.full_name || 'Doctor' }}</h4>
                <p>{{ nextAppointment.specialist?.profile?.professional_practice?.area_of_specialty || 'Specialist' }}</p>
              </div>
            </div>
            <div class="appointment-actions">
              <button v-if="canJoinMeeting(nextAppointment)" class="join-btn" @click="joinMeeting(nextAppointment)">
                <v-icon name="hi-video-camera" scale="0.9" />
                Join Meeting
              </button>
              <button v-else class="details-btn" @click="viewAppointment(nextAppointment)">
                View All Appointments
              </button>
            </div>
          </div>

          <div v-else class="no-appointment">
            <div class="empty-illustration">
              <v-icon name="hi-calendar" scale="2.5" />
            </div>
            <p>No upcoming appointments</p>
            <button class="book-btn" @click="goToBookAppointment">
              <v-icon name="hi-plus" scale="0.8" />
              Book Now
            </button>
          </div>
        </div>

        <!-- Recent Activity Card -->
        <div class="bento-card activity-card">
          <div class="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div class="activity-timeline">
            <div
              v-for="(activity, index) in recentActivities"
              :key="index"
              class="timeline-item"
              :class="activity.type"
            >
              <div class="timeline-icon">
                <v-icon :name="activity.icon" scale="0.8" />
              </div>
              <div class="timeline-content">
                <span class="activity-title">{{ activity.title }}</span>
                <span class="activity-time">{{ activity.timeAgo }}</span>
              </div>
            </div>
            <div v-if="recentActivities.length === 0" class="no-activity">
              <p>No recent activity</p>
            </div>
          </div>
        </div>

        <!-- Health Domains Card -->
        <div class="bento-card domains-card">
          <div class="card-header">
            <h3>Health Overview</h3>
            <router-link
              :to="premiumScore ? `/app/patient/advanced-health-score/report/${premiumScore._id}` : '/app/patient/advanced-health-score'"
              class="see-all"
            >
              {{ premiumScore ? 'View Report' : 'Get Analysis' }}
              <v-icon name="hi-arrow-right" scale="0.7" />
            </router-link>
          </div>
          <div class="domains-grid">
            <div
              v-for="domain in healthDomains"
              :key="domain.name"
              class="domain-item"
              :class="domain.status"
            >
              <div class="domain-icon">
                <v-icon :name="domain.icon" scale="0.9" />
              </div>
              <div class="domain-info">
                <span class="domain-name">{{ domain.name }}</span>
                <span v-if="domain.score" class="domain-score">{{ domain.score }}</span>
              </div>
              <div class="domain-indicator"></div>
            </div>
          </div>
        </div>

        <!-- Vitals Summary Card -->
        <div class="bento-card vitals-card">
          <div class="card-header">
            <h3>Latest Vitals</h3>
            <router-link to="/app/patient/health-monitor/vitals" class="see-all">
              Log
              <v-icon name="hi-plus" scale="0.7" />
            </router-link>
          </div>
          <div v-if="hasAnyVitals" class="vitals-preview">
            <div class="vital-item" v-if="parsedVitals.bloodPressure">
              <span class="vital-label">BP</span>
              <span class="vital-value">{{ parsedVitals.bloodPressure }}</span>
            </div>
            <div class="vital-item" v-if="parsedVitals.pulseRate">
              <span class="vital-label">Pulse</span>
              <span class="vital-value">{{ parsedVitals.pulseRate }} bpm</span>
            </div>
            <div class="vital-item" v-if="parsedVitals.weight">
              <span class="vital-label">Weight</span>
              <span class="vital-value">{{ parsedVitals.weight }} kg</span>
            </div>
            <div class="vital-item" v-if="parsedVitals.temperature">
              <span class="vital-label">Temp</span>
              <span class="vital-value">{{ parsedVitals.temperature }}°C</span>
            </div>
          </div>
          <div v-else class="no-vitals">
            <v-icon name="hi-heart" scale="1.5" />
            <p>Log your first vitals</p>
          </div>
        </div>
      </section>

      <!-- AI Health Insights Section -->
      <section class="insights-section">
        <div class="insights-header">
          <div class="insights-title">
            <div class="ai-badge-large">
              <v-icon name="hi-sparkles" scale="0.9" />
              <span>AI</span>
            </div>
            <h2>Health Insights</h2>
            <span v-if="urgentTipCount > 0" class="urgent-count">
              {{ urgentTipCount }} urgent
            </span>
          </div>
          <div class="insights-actions">
            <button class="refresh-btn" @click="loadHealthTips" :disabled="loadingTips">
              <v-icon name="hi-refresh" scale="0.85" :class="{ spin: loadingTips }" />
            </button>
            <router-link to="/app/patient/health-tips" class="view-all-link">
              View All
              <v-icon name="hi-arrow-right" scale="0.75" />
            </router-link>
          </div>
        </div>

        <div v-if="loadingTips" class="insights-loading">
          <div class="loading-card" v-for="i in 3" :key="i">
            <div class="shimmer"></div>
          </div>
        </div>

        <div v-else-if="healthTips.length > 0" class="insights-grid">
          <div
            v-for="tip in healthTips"
            :key="tip._id"
            class="insight-card"
            :class="tip.priority"
          >
            <div class="insight-header">
              <div class="insight-icon" :class="tip.priority">
                <v-icon :name="tip.icon || getCategoryIcon(tip.category)" scale="1.1" />
              </div>
              <span class="insight-category">{{ formatCategory(tip.category) }}</span>
              <span v-if="tip.priority === 'urgent'" class="priority-badge urgent">Urgent</span>
              <span v-else-if="tip.priority === 'high'" class="priority-badge high">Important</span>
            </div>
            <h3 class="insight-title">{{ tip.title }}</h3>
            <p class="insight-content">{{ tip.content }}</p>
            <div class="insight-footer">
              <button
                v-if="tip.action_text && tip.action_route"
                class="insight-action-btn"
                @click="performTipAction(tip)"
              >
                {{ tip.action_text }}
                <v-icon name="hi-arrow-right" scale="0.7" />
              </button>
              <button
                class="insight-dismiss-btn"
                @click="dismissTip(tip._id)"
                title="Dismiss tip"
              >
                <v-icon name="hi-x" scale="0.8" />
              </button>
            </div>
          </div>
        </div>

        <div v-else class="insights-empty">
          <div class="empty-visual">
            <v-icon name="hi-light-bulb" scale="2.5" />
          </div>
          <h3>No personalized insights yet</h3>
          <p>Generate AI-powered health tips based on your profile</p>
          <button class="generate-insights-btn" @click="generateTips" :disabled="loadingTips">
            <v-icon name="hi-sparkles" scale="0.9" />
            Generate Insights
          </button>
        </div>

        <div class="insights-disclaimer">
          <v-icon name="hi-shield-check" scale="0.75" />
          <span>These insights are for informational purposes only and do not constitute medical advice. Always consult your healthcare provider.</span>
        </div>
      </section>

      <!-- Help Section -->
      <section class="help-section">
        <div class="help-card">
          <div class="help-icon">
            <v-icon name="hi-chat-alt-2" scale="1.3" />
          </div>
          <div class="help-content">
            <h4>Need Help?</h4>
            <p>Our care team is available 24/7</p>
          </div>
          <button class="help-btn" @click="openSupport">
            Chat Now
          </button>
        </div>
      </section>
    </main>

    <!-- Floating Action Button -->
    <button class="fab" @click="goToBookAppointment">
      <v-icon name="hi-plus" scale="1.3" />
    </button>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { format, formatDistanceToNow, parseISO, isToday, isTomorrow, differenceInMinutes } from 'date-fns';

const router = useRouter();
const store = useStore();
const $http = inject('$_HTTP');

// State
const loading = ref(true);
const appointments = ref([]);
const prescriptions = ref([]);
const walletBalance = ref(0);
const aiCredits = ref(0);
const healthScore = ref(null);
const latestVitals = ref(null);
const unreadNotifications = ref(0);
const healthCheckups = ref([]);
const profileBannerDismissed = ref(false);
const healthTips = ref([]);
const loadingTips = ref(false);
const premiumScore = ref(null);

// Computed for AI credits display
const hasAICredits = computed(() => aiCredits.value > 0);

// User Profile and Vitals from store
const userProfile = computed(() => store.getters['userprofile']);
const storeVitals = computed(() => store.getters['recentVitals']);

const userName = computed(() => {
  const profile = userProfile.value?.profile;
  if (profile?.first_name) {
    return profile.first_name;
  }
  return 'there';
});

const userAvatar = computed(() => {
  return userProfile.value?.profile?.profile_photo;
});

// Time-based greeting
const timeGreeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
});

// Health Status
const healthStatusMessage = computed(() => {
  if (!healthScore.value) return "Let's check on your health today";
  if (healthScore.value >= 80) return "You're doing great! Keep it up.";
  if (healthScore.value >= 60) return "Your health is on track.";
  return "Let's work on improving your health.";
});

const healthStatusClass = computed(() => {
  if (!healthScore.value) return 'neutral';
  if (healthScore.value >= 80) return 'excellent';
  if (healthScore.value >= 60) return 'good';
  return 'needs-attention';
});

const healthOrbClass = computed(() => {
  if (!healthScore.value) return 'neutral';
  if (healthScore.value >= 80) return 'excellent';
  if (healthScore.value >= 60) return 'good';
  if (healthScore.value >= 40) return 'fair';
  return 'low';
});

// Check if showing premium score
const isPremiumScore = computed(() => {
  return !!(premiumScore.value?.report?.overall_score);
});

// Profile Completion
const hasVitals = computed(() => {
  if (!latestVitals.value) return false;
  const v = latestVitals.value;
  return !!(
    (v.blood_pressure?.length > 0) ||
    (v.body_temp?.length > 0) ||
    (v.pulse_rate?.length > 0) ||
    (v.blood_sugar_level?.length > 0) ||
    (v.body_weight?.length > 0)
  );
});

const profileSteps = computed(() => {
  const profile = userProfile.value?.profile || {};
  const hasHeight = profile?.basic_health_info?.height?.value > 0;
  const hasWeight = profile?.basic_health_info?.weight?.value > 0;
  const hasEmergencyContact = userProfile.value?.emergency_contacts?.length > 0;
  const hasAddress = !!(profile?.contact?.state || profile?.contact?.country || profile?.contact?.address1);
  const userAllergies = userProfile.value?.allergies;
  const hasAllergies = userAllergies?.has_allergies !== undefined && userAllergies?.has_allergies !== null;
  const medicalHistory = userProfile.value?.medical_history;
  const hasMedicalHistory = !!(
    medicalHistory?.chronic_conditions?.length > 0 ||
    medicalHistory?.current_medications?.length > 0 ||
    medicalHistory?.past_surgeries?.length > 0 ||
    medicalHistory?.lifestyle?.smoking ||
    medicalHistory?.lifestyle?.alcohol
  );

  return [
    {
      key: 'personalDetails',
      title: 'Personal Details',
      description: 'Basic info and health data',
      icon: 'hi-user',
      color: '#4FC3F7',
      route: '/app/patient/onboarding/personal-details',
      completed: hasHeight && hasWeight,
    },
    {
      key: 'addressEmergency',
      title: 'Address & Emergency',
      description: 'Contact information',
      icon: 'hi-location-marker',
      color: '#81C784',
      route: '/app/patient/onboarding/address-emergency',
      completed: hasAddress && hasEmergencyContact,
    },
    {
      key: 'vitalsMetrics',
      title: 'Vitals & Metrics',
      description: 'Health measurements',
      icon: 'hi-heart',
      color: '#FF8A65',
      route: '/app/patient/onboarding/vitals-metrics',
      completed: hasVitals.value,
    },
    {
      key: 'allergies',
      title: 'Allergies',
      description: 'Drug & food allergies',
      icon: 'hi-exclamation-triangle',
      color: '#FFD54F',
      route: '/app/patient/onboarding/allergies',
      completed: hasAllergies,
    },
    {
      key: 'medicalHistory',
      title: 'Medical History',
      description: 'Conditions & medications',
      icon: 'hi-clipboard-list',
      color: '#BA68C8',
      route: '/app/patient/onboarding/medical-history',
      completed: hasMedicalHistory,
    },
  ];
});

const profileProgress = computed(() => {
  const completed = profileSteps.value.filter(s => s.completed).length;
  return Math.round((completed / profileSteps.value.length) * 100);
});

const profileProgressOffset = computed(() => {
  // SVG circle circumference = 2 * PI * r = 2 * 3.14159 * 20 ≈ 125.66
  const circumference = 125.66;
  const progress = profileProgress.value / 100;
  return circumference * (1 - progress);
});

const incompleteProfileSteps = computed(() => {
  return profileSteps.value.filter(s => !s.completed).slice(0, 3);
});

const showProfileBanner = computed(() => {
  if (profileBannerDismissed.value) return false;
  const dismissed = localStorage.getItem('profileBannerDismissedV2');
  if (dismissed === 'true') return false;
  return true;
});

const dismissProfileBanner = () => {
  profileBannerDismissed.value = true;
  localStorage.setItem('profileBannerDismissedV2', 'true');
};

// Stats
const upcomingCount = computed(() => {
  if (!Array.isArray(appointments.value)) return 0;
  const now = new Date();
  return appointments.value.filter(a => {
    const aptDate = new Date(a.start_time || a.appointment_date);
    return aptDate >= now && !['CANCELLED', 'COMPLETED', 'MISSED'].includes(a.status);
  }).length;
});

const activePrescriptions = computed(() => {
  if (!Array.isArray(prescriptions.value)) return 0;
  // Active statuses: pending_acceptance, paid, dispensed (not cancelled, delivered, or expired)
  const activeStatuses = ['pending_acceptance', 'paid', 'dispensed', 'accepted', 'processing'];
  return prescriptions.value.filter(p => activeStatuses.includes(p.status?.toLowerCase())).length;
});

// Next Appointment
const nextAppointment = computed(() => {
  if (!Array.isArray(appointments.value)) return null;
  const now = new Date();
  const upcoming = appointments.value
    .filter(a => {
      const aptDate = new Date(a.start_time || a.appointment_date);
      return aptDate >= now && !['CANCELLED', 'COMPLETED', 'MISSED'].includes(a.status);
    })
    .sort((a, b) => new Date(a.start_time || a.appointment_date) - new Date(b.start_time || b.appointment_date));
  return upcoming[0] || null;
});

// Health Tips
const urgentTipCount = computed(() => {
  if (!Array.isArray(healthTips.value)) return 0;
  return healthTips.value.filter(t => t.priority === 'urgent').length;
});

const truncateTip = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

const formatCategory = (category) => {
  if (!category) return 'Health';
  const categoryMap = {
    vitals: 'Vitals',
    lifestyle: 'Lifestyle',
    nutrition: 'Nutrition',
    fitness: 'Fitness',
    mental_health: 'Mental Health',
    preventive_care: 'Preventive Care',
    chronic_condition: 'Chronic Care',
    medication: 'Medication',
    sleep: 'Sleep',
    hydration: 'Hydration',
  };
  return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');
};

const getCategoryIcon = (category) => {
  const iconMap = {
    vitals: 'hi-heart',
    lifestyle: 'fa-sun',
    nutrition: 'fa-apple-alt',
    fitness: 'hi-lightning-bolt',
    mental_health: 'hi-emoji-happy',
    preventive_care: 'hi-shield-check',
    chronic_condition: 'hi-clipboard-list',
    medication: 'ri-capsule-line',
    sleep: 'hi-moon',
    hydration: 'hi-beaker',
  };
  return iconMap[category] || 'hi-light-bulb';
};

const loadHealthTips = async () => {
  loadingTips.value = true;
  try {
    const response = await $http.$_getFeaturedHealthTips?.({ limit: 3 });
    if (response?.data?.data?.tips) {
      healthTips.value = response.data.data.tips;
    } else if (response?.data?.tips) {
      healthTips.value = response.data.tips;
    } else {
      healthTips.value = [];
    }
  } catch (error) {
    console.error('Error fetching health tips:', error);
    healthTips.value = [];
  } finally {
    loadingTips.value = false;
  }
};

const dismissTip = async (tipId) => {
  try {
    await $http.$_dismissHealthTip?.(tipId);
    healthTips.value = healthTips.value.filter(t => t._id !== tipId);
  } catch (error) {
    console.error('Error dismissing tip:', error);
  }
};

const performTipAction = (tip) => {
  if (tip.action_route) {
    router.push(tip.action_route);
  }
};

const generateTips = async () => {
  loadingTips.value = true;
  try {
    await $http.$_generateHealthTips?.();
    await loadHealthTips();
  } catch (error) {
    console.error('Error generating tips:', error);
  } finally {
    loadingTips.value = false;
  }
};

// Recent Activities
const recentActivities = computed(() => {
  const activities = [];

  // Add recent appointments (use start_time as the appointment date)
  const appts = Array.isArray(appointments.value) ? appointments.value : [];
  // Sort by start_time descending to get most recent first
  const sortedAppts = [...appts].sort((a, b) =>
    new Date(b.start_time || b.created_at) - new Date(a.start_time || a.created_at)
  );
  sortedAppts.slice(0, 2).forEach(apt => {
    const aptDate = apt.start_time || apt.created_at;
    if (aptDate) {
      activities.push({
        type: 'appointment',
        icon: 'hi-calendar',
        title: `Appointment with ${apt.specialist?.full_name || 'Doctor'}`,
        timeAgo: formatDistanceToNow(new Date(aptDate), { addSuffix: true }),
        date: new Date(aptDate)
      });
    }
  });

  // Add recent prescriptions
  const rxs = Array.isArray(prescriptions.value) ? prescriptions.value : [];
  rxs.slice(0, 1).forEach(rx => {
    if (rx.created_at) {
      activities.push({
        type: 'prescription',
        icon: 'hi-document-text',
        title: 'New prescription received',
        timeAgo: formatDistanceToNow(new Date(rx.created_at), { addSuffix: true }),
        date: new Date(rx.created_at)
      });
    }
  });

  // Add recent health checkups
  const checkups = Array.isArray(healthCheckups.value) ? healthCheckups.value : [];
  checkups.slice(0, 2).forEach(checkup => {
    if (checkup.created_at) {
      activities.push({
        type: 'checkup',
        icon: 'hi-clipboard-check',
        title: 'Health checkup completed',
        timeAgo: formatDistanceToNow(new Date(checkup.created_at), { addSuffix: true }),
        date: new Date(checkup.created_at)
      });
    }
  });

  // Sort by date (most recent first) and limit to 4
  return activities
    .sort((a, b) => b.date - a.date)
    .slice(0, 4);
});

// Vitals helpers
const getLatestVital = (vitalArray) => {
  if (!vitalArray || !Array.isArray(vitalArray) || vitalArray.length === 0) return null;
  return vitalArray[0]; // Most recent is first in array
};

const hasAnyVitals = computed(() => {
  if (!latestVitals.value) return false;
  const v = latestVitals.value;
  return !!(
    (v.blood_pressure && v.blood_pressure.length > 0) ||
    (v.pulse_rate && v.pulse_rate.length > 0) ||
    (v.body_weight && v.body_weight.length > 0) ||
    (v.body_temp && v.body_temp.length > 0)
  );
});

const parsedVitals = computed(() => {
  if (!latestVitals.value) return {};
  const v = latestVitals.value;

  // Parse blood pressure (format: "120/80")
  const bp = getLatestVital(v.blood_pressure);
  let bloodPressure = null;
  if (bp?.value) {
    bloodPressure = bp.value;
  }

  // Parse pulse rate
  const pr = getLatestVital(v.pulse_rate);
  const pulseRate = pr?.value ? parseInt(pr.value, 10) : null;

  // Parse weight
  const wt = getLatestVital(v.body_weight);
  const weight = wt?.value ? parseFloat(wt.value) : null;

  // Parse temperature
  const temp = getLatestVital(v.body_temp);
  const temperature = temp?.value ? parseFloat(temp.value) : null;

  return {
    bloodPressure,
    pulseRate,
    weight,
    temperature,
  };
});

// Domain icon and label mappings
const domainConfig = {
  cardiovascular: { icon: 'hi-heart', label: 'Cardio' },
  metabolic: { icon: 'hi-lightning-bolt', label: 'Metabolic' },
  mental_wellness: { icon: 'hi-light-bulb', label: 'Mind' },
  lifestyle: { icon: 'fa-sun', label: 'Lifestyle' },
  physical_symptoms: { icon: 'hi-clipboard-list', label: 'Physical' },
  preventive_care: { icon: 'hi-shield-check', label: 'Preventive' },
};

// Convert premium status to our status classes
const statusToClass = (status) => {
  const map = {
    'Excellent': 'excellent',
    'Good': 'good',
    'Fair': 'fair',
    'Needs Attention': 'poor',
    'Poor': 'poor',
  };
  return map[status] || 'neutral';
};

// Health Domains - Use premium score data if available, fallback to vitals-based calculation
const healthDomains = computed(() => {
  // If we have premium score with domain data, use that
  if (premiumScore.value?.report?.domain_scores?.length > 0) {
    return premiumScore.value.report.domain_scores.slice(0, 4).map(domain => ({
      name: domainConfig[domain.domain]?.label || domain.domain,
      icon: domainConfig[domain.domain]?.icon || 'hi-chart-bar',
      status: statusToClass(domain.status),
      score: domain.score,
    }));
  }

  // Fallback: Calculate from vitals data
  const domains = [];

  // Heart - based on blood pressure and pulse rate
  const bp = parsedVitals.value.bloodPressure;
  const pr = parsedVitals.value.pulseRate;
  let heartStatus = 'neutral';
  if (bp) {
    const [systolic] = bp.split('/').map(Number);
    if (systolic < 120) heartStatus = 'good';
    else if (systolic < 140) heartStatus = 'fair';
    else heartStatus = 'poor';
  } else if (pr) {
    if (pr >= 60 && pr <= 100) heartStatus = 'good';
    else heartStatus = 'fair';
  }
  domains.push({ name: 'Heart', icon: 'hi-heart', status: heartStatus });

  // Mind - based on recent activity (checkups, appointments)
  const hasRecentCheckup = healthCheckups.value?.length > 0;
  const mindStatus = hasRecentCheckup ? 'good' : 'neutral';
  domains.push({ name: 'Mind', icon: 'hi-light-bulb', status: mindStatus });

  // Body - based on BMI/weight
  const userBmi = userProfile.value?.profile?.bmi || userProfile.value?.bmi;
  let bodyStatus = 'neutral';
  if (userBmi) {
    if (userBmi >= 18.5 && userBmi < 25) bodyStatus = 'good';
    else if (userBmi >= 25 && userBmi < 30) bodyStatus = 'fair';
    else bodyStatus = 'poor';
  } else if (parsedVitals.value.weight) {
    bodyStatus = 'good';
  }
  domains.push({ name: 'Body', icon: 'hi-user', status: bodyStatus });

  // Sleep - placeholder (would need sleep data)
  const sleepStatus = 'neutral';
  domains.push({ name: 'Sleep', icon: 'hi-moon', status: sleepStatus });

  return domains;
});

// Format helpers
const formatWallet = (amount) => {
  if (amount >= 1000000) {
    return `₦${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `₦${(amount / 1000).toFixed(0)}K`;
  }
  return `₦${amount.toLocaleString()}`;
};

const formatAppointmentDay = (date) => {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'd');
};

const formatAppointmentMonth = (date) => {
  const d = new Date(date);
  if (isToday(d) || isTomorrow(d)) return '';
  return format(d, 'MMM');
};

const isTextDate = (date) => {
  const d = new Date(date);
  return isToday(d) || isTomorrow(d);
};

const formatAppointmentTime = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  } catch {
    return '';
  }
};

const canJoinMeeting = (appointment) => {
  if (!appointment?.start_time) return false;
  try {
    const aptDateTime = new Date(appointment.start_time);
    const diff = differenceInMinutes(aptDateTime, new Date());
    // Can join 15 min before and up to 60 min after start time
    return diff <= 15 && diff >= -60;
  } catch {
    return false;
  }
};

// Navigation
const goToNotifications = () => router.push('/app/patient/notifications');
const goToProfile = () => router.push('/app/patient/profile');
const goToHealthScore = () => {
  // If user has premium score, go to report page; otherwise go to assessment page
  if (premiumScore.value?._id) {
    router.push(`/app/patient/advanced-health-score/report/${premiumScore.value._id}`);
  } else {
    router.push('/app/patient/advanced-health-score');
  }
};
const goToAppointments = () => router.push('/app/patient/appointmentsv2');
const goToPrescriptions = () => router.push('/app/patient/prescriptions');
const goToWallet = () => router.push('/app/patient/account');
const goToCredits = () => router.push('/app/patient/account?tab=wallet');
const goToHealthCheckup = () => router.push('/app/patient/health-checkup');
const goToBookAppointment = () => {
  console.log('goToBookAppointment clicked');
  router.push('/app/patient/appointmentsv2/book');
};
const goToVitals = () => router.push('/app/patient/health-monitor/vitals');
const goToPharmacy = () => {
  console.log('goToPharmacy clicked');
  router.push('/app/patient/pharmacy');
};
const openSupport = () => window.open('https://wa.me/2348000000000', '_blank');

const joinMeeting = (appointment) => {
  if (appointment.zoom_meeting?.join_url) {
    window.open(appointment.zoom_meeting.join_url, '_blank');
  }
};

const viewAppointment = (appointment) => {
  // Go to appointments page - no detail page exists for patients
  router.push('/app/patient/appointmentsv2');
};

// Data Fetching
const fetchDashboardData = async () => {
  loading.value = true;

  try {
    const [appointmentsRes, prescriptionsRes, walletRes, vitalsRes, healthScoreRes, checkupsRes, premiumScoreRes, creditsRes] = await Promise.allSettled([
      $http.$_getPatientAppointments({ currentPage: 1, pageLimit: 20 }),
      $http.$_getPatientPrescriptions?.({ page: 1, limit: 10 }) || Promise.resolve({ data: [] }),
      $http.$_getWalletBalance(),
      $http.$_getOneUserVitals?.(userProfile.value?._id) || Promise.resolve({ data: null }),
      $http.$_getBasicHealthScore?.() || Promise.resolve({ data: null }),
      $http.$_getHealthCheckupHistory?.({ limit: 5 }) || Promise.resolve({ data: [] }),
      $http.$_getAdvancedHealthScoreHistory?.({ limit: 1 }) || Promise.resolve({ data: null }),
      $http.$_getClaudeSummaryCredits?.() || Promise.resolve({ data: null }),
    ]);

    if (appointmentsRes.status === 'fulfilled') {
      const result = appointmentsRes.value?.data?.data || appointmentsRes.value?.data;
      appointments.value = Array.isArray(result) ? result : [];
      console.log('Appointments loaded:', appointments.value.length);
    }

    if (prescriptionsRes.status === 'fulfilled') {
      const result = prescriptionsRes.value?.data?.data || prescriptionsRes.value?.data;
      // Handle various response structures: array, {docs: []}, {prescriptions: []}
      if (Array.isArray(result)) {
        prescriptions.value = result;
      } else if (result?.docs && Array.isArray(result.docs)) {
        prescriptions.value = result.docs;
      } else if (result?.prescriptions && Array.isArray(result.prescriptions)) {
        prescriptions.value = result.prescriptions;
      } else {
        prescriptions.value = [];
      }
      console.log('Prescriptions loaded:', prescriptions.value.length);
    }

    if (walletRes.status === 'fulfilled') {
      const walletData = walletRes.value?.data?.data || walletRes.value?.data;
      walletBalance.value = walletData?.currentBalance || walletData?.balance || 0;
    }

    if (vitalsRes.status === 'fulfilled') {
      const vitalsData = vitalsRes.value?.data?.data || vitalsRes.value?.data;
      // Vitals come as an object with arrays: { blood_pressure: [...], pulse_rate: [...], etc }
      // Use API data if available, otherwise keep store vitals
      latestVitals.value = vitalsData || storeVitals.value || null;
    } else if (!latestVitals.value && storeVitals.value) {
      // If API failed but we have store vitals, use those
      latestVitals.value = storeVitals.value;
    }

    if (healthScoreRes.status === 'fulfilled') {
      const scoreData = healthScoreRes.value?.data?.data || healthScoreRes.value?.data;
      healthScore.value = scoreData?.overall_score || scoreData?.score || null;
    }

    if (checkupsRes.status === 'fulfilled') {
      const checkupsData = checkupsRes.value?.data?.data?.checkups || checkupsRes.value?.data?.data || checkupsRes.value?.data;
      healthCheckups.value = Array.isArray(checkupsData) ? checkupsData : [];
    }

    // Premium/Advanced Health Score - prioritize over basic score
    if (premiumScoreRes.status === 'fulfilled') {
      const premiumData = premiumScoreRes.value?.data?.data || premiumScoreRes.value?.data;
      const assessments = premiumData?.assessments || premiumData?.items || premiumData || [];
      if (Array.isArray(assessments) && assessments.length > 0 && assessments[0].status === 'completed') {
        premiumScore.value = assessments[0];
        // Premium score takes priority over basic score
        if (assessments[0].report?.overall_score) {
          healthScore.value = assessments[0].report.overall_score;
        }
      }
    }

    // AI Credits
    if (creditsRes.status === 'fulfilled') {
      const creditsData = creditsRes.value?.data?.data || creditsRes.value?.data;
      aiCredits.value = creditsData?.total_available || 0;
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // Use store vitals immediately if available (faster initial render)
  if (storeVitals.value) {
    latestVitals.value = storeVitals.value;
  }
  fetchDashboardData();
  loadHealthTips();
});
</script>

<style scoped lang="scss">
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$card-bg: #FFFFFF;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

// Mixins
@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(0, 0, 0, 0.02);
}

@mixin card-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.08),
      0 4px 12px rgba(0, 0, 0, 0.04);
  }
}

.dashboard-v2 {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  position: relative;
  overflow-x: hidden;
  width: 100%;
}

// Ambient Background - Hidden for cleaner look
.ambient-bg {
  display: none;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;

  &.orb-1 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, rgba($sky, 0.3), rgba($sky-light, 0.2));
    top: -100px;
    right: -100px;
  }

  &.orb-2 {
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, rgba($emerald, 0.15), rgba($sky-light, 0.1));
    bottom: 20%;
    left: -80px;
    animation-delay: -5s;
  }

  &.orb-3 {
    width: 250px;
    height: 250px;
    background: linear-gradient(135deg, rgba($violet, 0.1), rgba($sky, 0.1));
    top: 40%;
    right: -50px;
    animation-delay: -10s;
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.05); }
  50% { transform: translate(-10px, 10px) scale(0.95); }
  75% { transform: translate(-20px, -10px) scale(1.02); }
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}

.menu-btn, .notification-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    background: rgba($sky, 0.1);
    transform: scale(0.95);
  }
}

.notification-btn {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  min-width: 16px;
  height: 16px;
  background: $rose;
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.header-logo {
  img {
    height: 28px;
    object-fit: contain;
  }
}

// Main Content
.dashboard-content {
  flex: 1;
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2rem 100px;

  @media (max-width: 768px) {
    padding: 20px 16px 100px;
  }
}

// Hero Section
.hero-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 24px;
  margin-bottom: 24px;
  box-shadow:
    0 20px 60px rgba($sky, 0.3),
    0 8px 20px rgba($sky-dark, 0.2);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 60%;
    height: 200%;
    background: radial-gradient(ellipse, rgba(255,255,255,0.1) 0%, transparent 70%);
    pointer-events: none;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 24px 20px;
    text-align: center;
    gap: 24px;
  }
}

.hero-greeting {
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    gap: 16px;
  }
}

.greeting-content {
  color: white;
}

.greeting-time {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 500;
}

.greeting-name {
  font-size: 28px;
  font-weight: 700;
  margin: 4px 0 8px;
  letter-spacing: -0.5px;

  @media (max-width: 768px) {
    font-size: 24px;
  }
}

.greeting-subtitle {
  font-size: 14px;
  opacity: 0.85;
  max-width: 280px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
}

.hero-avatar {
  position: relative;
  width: 64px;
  height: 64px;
  cursor: pointer;

  img, .avatar-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid rgba(255, 255, 255, 0.3);
  }

  .avatar-placeholder {
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .avatar-status {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid white;

    &.excellent { background: $emerald; }
    &.good { background: $sky; }
    &.needs-attention { background: $amber; }
    &.neutral { background: $light-gray; }
  }
}

// Health Score Orb
.health-orb-container {
  position: relative;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
}

.health-orb {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  @media (max-width: 768px) {
    width: 100px;
    height: 100px;
  }

  // Premium score indicator
  &.premium {
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);

    &::after {
      content: '★';
      position: absolute;
      top: -4px;
      right: -4px;
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
    }
  }
}

.orb-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  animation: pulse-ring 3s ease-out infinite;

  &.ring-2 {
    inset: -8px;
    border-color: rgba(255, 255, 255, 0.2);
    animation-delay: 0.5s;
  }

  &.ring-3 {
    inset: -16px;
    border-color: rgba(255, 255, 255, 0.1);
    animation-delay: 1s;
  }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.1); opacity: 0; }
}

.orb-inner {
  text-align: center;
  color: white;
  z-index: 1;
}

.orb-score {
  display: block;
  font-size: 32px;
  font-weight: 800;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 28px;
  }
}

.orb-label {
  display: block;
  font-size: 11px;
  opacity: 0.9;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.orb-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  0% { opacity: 0.5; transform: scale(1); }
  100% { opacity: 0.8; transform: scale(1.1); }
}

// Stats Bar
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 20px 24px;
  background: white;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  @media (max-width: 768px) {
    padding: 16px 12px;
  }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 12px;
  transition: all 0.2s;

  &:active {
    background: rgba($sky, 0.05);
  }

  @media (max-width: 480px) {
    gap: 8px;
    padding: 6px 8px;
  }
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.appointments {
    background: $sky-light;
    color: $sky-dark;
  }

  &.prescriptions {
    background: $emerald-light;
    color: $emerald;
  }

  &.wallet {
    background: $amber-light;
    color: $amber;
  }

  &.credits {
    background: $violet-light;
    color: $violet;
  }

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: $navy;
  line-height: 1.2;

  @media (max-width: 480px) {
    font-size: 16px;
  }
}

.stat-label {
  font-size: 12px;
  color: $gray;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #E2E8F0;
}

// Profile Completion Banner
.profile-banner {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
  margin-bottom: 24px;
  border-left: 4px solid $sky;
  animation: slideIn 0.4s ease-out;

  @media (max-width: 640px) {
    padding: 16px;
    border-radius: 16px;
  }

  &--complete {
    border-left-color: $emerald;
    background: linear-gradient(135deg, rgba($emerald-light, 0.5), rgba(255, 255, 255, 0.9));
  }
}

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

.profile-banner__header {
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 480px) {
    flex-wrap: wrap;
    gap: 12px;
  }
}

.profile-banner__info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.profile-banner__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $sky-light;
  color: $sky-dark;
  flex-shrink: 0;

  &.complete {
    background: $emerald-light;
    color: $emerald;
  }
}

.profile-banner__text {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 2px 0;
  }

  p {
    font-size: 13px;
    color: $gray;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.profile-banner__progress {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}

.progress-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.progress-ring__bg {
  fill: none;
  stroke: #E2E8F0;
  stroke-width: 4;
}

.progress-ring__fill {
  fill: none;
  stroke: $sky;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 125.66;
  transition: stroke-dashoffset 0.6s ease;

  &.complete {
    stroke: $emerald;
  }
}

.progress-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 700;
  color: $sky-dark;

  &.complete {
    color: $emerald;
  }
}

.profile-banner__dismiss {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: $light-gray;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover {
    background: rgba($slate, 0.05);
    color: $slate;
  }
}

.profile-banner__steps {
  display: flex;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E2E8F0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }

  @media (max-width: 640px) {
    gap: 10px;
  }
}

.profile-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba($sky, 0.04);
  border-radius: 12px;
  text-decoration: none;
  flex-shrink: 0;
  min-width: 180px;
  transition: all 0.2s;

  &:hover {
    background: rgba($sky, 0.1);
    transform: translateX(2px);
  }

  @media (max-width: 640px) {
    padding: 8px 12px;
    min-width: 160px;
  }
}

.profile-step__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.profile-step__info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.profile-step__title {
  font-size: 13px;
  font-weight: 600;
  color: $navy;
  line-height: 1.3;
}

.profile-step__desc {
  font-size: 11px;
  color: $gray;
  line-height: 1.3;
}

.profile-step__arrow {
  color: $light-gray;
  flex-shrink: 0;
}

// Bento Grid
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(6, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
  @include card-hover;

  @media (max-width: 640px) {
    padding: 16px;
    border-radius: 16px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
    margin: 0;
  }

  .see-all {
    font-size: 13px;
    color: $sky-dark;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 500;

    &:hover {
      color: $sky-darker;
    }
  }
}

.header-with-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  background: linear-gradient(135deg, $violet, $sky-dark);
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// Actions Card
.actions-card {
  grid-column: span 4;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }

  @media (max-width: 640px) {
    grid-column: span 1;
  }
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 12px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: white;
    border-color: $sky;
    box-shadow: 0 4px 12px rgba($sky, 0.15);
  }

  &:active {
    transform: scale(0.98);
  }

  span {
    font-size: 12px;
    font-weight: 500;
    color: $slate;
  }
}

.action-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.checkup {
    background: linear-gradient(135deg, $sky-light, lighten($sky-light, 5%));
    color: $sky-dark;
  }

  &.book {
    background: linear-gradient(135deg, $emerald-light, lighten($emerald-light, 5%));
    color: $emerald;
  }

  &.vitals {
    background: linear-gradient(135deg, $rose-light, lighten($rose-light, 5%));
    color: $rose;
  }

  &.pharmacy {
    background: linear-gradient(135deg, $violet-light, lighten($violet-light, 5%));
    color: $violet;
  }
}

// Appointment Card
.appointment-card {
  grid-column: span 4;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }

  @media (max-width: 640px) {
    grid-column: span 1;
  }
}

.appointment-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.appointment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.appointment-date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 56px;
  height: 56px;
  background: linear-gradient(135deg, $sky, $sky-dark);
  border-radius: 14px;
  color: white;
  flex-shrink: 0;
  padding: 0 8px;

  .date-day {
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
  }

  .date-month {
    font-size: 11px;
    text-transform: uppercase;
    opacity: 0.9;
    letter-spacing: 0.5px;
  }

  // When displaying "Today" or "Tomorrow"
  &.is-text-date {
    width: auto;
    padding: 0 16px;
    border-radius: 28px;

    .date-day {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
  }
}

.appointment-time-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #F0FDF4, #DCFCE7);
  border: 1px solid #86EFAC;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #16A34A;

  svg {
    width: 14px;
    height: 14px;
  }
}

.appointment-doctor {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: #F8FAFC;
  border-radius: 14px;
  border: 1px solid #E2E8F0;
}

.doctor-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
  flex-shrink: 0;

  &.placeholder {
    background: $sky-light;
    color: $sky-dark;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.doctor-info {
  flex: 1;
  min-width: 0;

  h4 {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  p {
    font-size: 13px;
    color: $gray;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.appointment-actions {
  margin-top: 4px;
}

.join-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, $emerald, darken($emerald, 10%));
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba($emerald, 0.3);
  }
}

.details-btn {
  width: 100%;
  padding: 12px;
  background: $sky-light;
  color: $sky-dark;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: lighten($sky-light, 3%);
  }
}

.no-appointment {
  text-align: center;
  padding: 20px 0;

  .empty-illustration {
    width: 72px;
    height: 72px;
    background: $sky-light;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    color: $sky;
  }

  p {
    color: $gray;
    font-size: 14px;
    margin: 0 0 16px;
  }

  .book-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: $sky;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
      background: $sky-dark;
    }
  }
}

// AI Health Insights Section
.insights-section {
  margin-top: 24px;
  padding: 24px;
  background: linear-gradient(135deg, rgba($sky-light, 0.5) 0%, rgba(255, 255, 255, 0.9) 50%, rgba($violet-light, 0.3) 100%);
  border-radius: 24px;
  border: 1px solid rgba($sky, 0.15);

  @media (max-width: 640px) {
    padding: 20px 16px;
    margin-top: 20px;
    border-radius: 20px;
  }
}

.insights-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.insights-title {
  display: flex;
  align-items: center;
  gap: 12px;

  h2 {
    font-size: 20px;
    font-weight: 700;
    color: $navy;
    margin: 0;

    @media (max-width: 640px) {
      font-size: 18px;
    }
  }
}

.ai-badge-large {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: linear-gradient(135deg, $violet, $sky-dark);
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.urgent-count {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: $rose;
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.insights-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
  background: white;
  color: $gray;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: $sky;
    color: $sky-dark;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: white;
  color: $sky-dark;
  text-decoration: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #E2E8F0;
  transition: all 0.2s;

  &:hover {
    border-color: $sky;
    background: $sky-light;
  }
}

.insights-loading {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.loading-card {
  height: 220px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  position: relative;

  .shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.insight-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  border: 1px solid #E2E8F0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: $sky;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    border-color: transparent;

    &::before {
      opacity: 1;
    }
  }

  &.urgent {
    border-color: rgba($rose, 0.3);
    background: linear-gradient(135deg, white 0%, rgba($rose-light, 0.3) 100%);

    &::before {
      background: $rose;
      opacity: 1;
    }
  }

  &.high {
    border-color: rgba($amber, 0.3);
    background: linear-gradient(135deg, white 0%, rgba($amber-light, 0.3) 100%);

    &::before {
      background: $amber;
      opacity: 1;
    }
  }

  &.medium {
    &::before {
      background: $sky;
    }
  }

  &.low {
    &::before {
      background: $emerald;
    }
  }
}

.insight-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.insight-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.urgent {
    background: $rose-light;
    color: $rose;
  }

  &.high {
    background: $amber-light;
    color: $amber;
  }

  &.medium {
    background: $sky-light;
    color: $sky-dark;
  }

  &.low {
    background: $emerald-light;
    color: $emerald;
  }
}

.insight-category {
  font-size: 11px;
  font-weight: 600;
  color: $gray;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex: 1;
}

.priority-badge {
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 600;
  border-radius: 4px;

  &.urgent {
    background: $rose;
    color: white;
  }

  &.high {
    background: $amber;
    color: white;
  }
}

.insight-title {
  font-size: 16px;
  font-weight: 600;
  color: $navy;
  margin: 0 0 10px;
  line-height: 1.3;
}

.insight-content {
  font-size: 14px;
  color: $slate;
  line-height: 1.6;
  margin: 0;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.insight-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E2E8F0;
}

.insight-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: $sky;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $sky-dark;
    transform: translateX(2px);
  }
}

.insight-dismiss-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #E2E8F0;
  background: white;
  color: $light-gray;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    border-color: $rose;
    background: $rose-light;
    color: $rose;
  }
}

.insights-empty {
  text-align: center;
  padding: 48px 24px;
  background: white;
  border-radius: 16px;
  border: 2px dashed #E2E8F0;

  .empty-visual {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, $sky-light, $violet-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: $sky-dark;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: $gray;
    margin: 0 0 20px;
  }
}

.generate-insights-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, $sky, $sky-dark);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba($sky, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.insights-disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 16px;
  margin-top: 16px;
  background: rgba($slate, 0.03);
  border-radius: 10px;
  font-size: 11px;
  color: $gray;
  line-height: 1.5;

  svg {
    flex-shrink: 0;
    color: $emerald;
    margin-top: 1px;
  }
}

// Activity Card
.activity-card {
  grid-column: span 4;

  @media (max-width: 1024px) {
    grid-column: span 3;
  }

  @media (max-width: 640px) {
    grid-column: span 1;
  }
}

.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: #F8FAFC;
  border-radius: 10px;
}

.timeline-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  .appointment & {
    background: $sky-light;
    color: $sky-dark;
  }

  .prescription & {
    background: $emerald-light;
    color: $emerald;
  }

  .checkup & {
    background: $violet-light;
    color: $violet;
  }
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.activity-title {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: $slate;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-time {
  display: block;
  font-size: 11px;
  color: $light-gray;
  margin-top: 2px;
}

.no-activity {
  text-align: center;
  padding: 20px 0;

  p {
    font-size: 13px;
    color: $light-gray;
    margin: 0;
  }
}

// Domains Card
.domains-card {
  grid-column: span 6;

  @media (max-width: 1024px) {
    grid-column: span 3;
  }

  @media (max-width: 640px) {
    grid-column: span 1;
  }
}

.domains-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.domain-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #F8FAFC;
  border-radius: 10px;
  position: relative;

  &.excellent {
    .domain-indicator { background: $emerald; }
    .domain-score { color: $emerald; }
  }
  &.good {
    .domain-indicator { background: $sky; }
    .domain-score { color: $sky-dark; }
  }
  &.fair {
    .domain-indicator { background: $amber; }
    .domain-score { color: $amber; }
  }
  &.poor {
    .domain-indicator { background: $rose; }
    .domain-score { color: $rose; }
  }
}

.domain-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $slate;
}

.domain-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.domain-name {
  font-size: 13px;
  font-weight: 500;
  color: $slate;
}

.domain-score {
  font-size: 11px;
  font-weight: 600;
  color: $gray;
}

.domain-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

// Vitals Card
.vitals-card {
  grid-column: span 6;

  @media (max-width: 1024px) {
    grid-column: span 3;
  }

  @media (max-width: 640px) {
    grid-column: span 1;
  }
}

.vitals-preview {
  display: flex;
  gap: 16px;
}

.vital-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: #F8FAFC;
  border-radius: 10px;
}

.vital-label {
  display: block;
  font-size: 11px;
  color: $gray;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.vital-value {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: $navy;
}

.no-vitals {
  text-align: center;
  padding: 24px 0;
  color: $light-gray;

  p {
    font-size: 13px;
    margin: 10px 0 0;
  }
}

// Help Section
.help-section {
  margin-top: 24px;
}

.help-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #F0F9FF, #E0F2FE);
  border-radius: 16px;
  border: 1px solid rgba($sky, 0.2);

  @media (max-width: 640px) {
    flex-wrap: wrap;
  }
}

.help-icon {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sky-dark;
  box-shadow: 0 4px 12px rgba($sky, 0.15);
}

.help-content {
  flex: 1;

  h4 {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 2px;
  }

  p {
    font-size: 13px;
    color: $gray;
    margin: 0;
  }
}

.help-btn {
  padding: 10px 20px;
  background: $sky-dark;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $sky-darker;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
}

// Floating Action Button
.fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, $sky, $sky-dark);
  color: white;
  border: none;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 8px 24px rgba($sky, 0.4),
    0 4px 8px rgba($sky-dark, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;

  &:hover {
    transform: scale(1.1);
    box-shadow:
      0 12px 32px rgba($sky, 0.5),
      0 6px 12px rgba($sky-dark, 0.25);
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    bottom: 20px;
    right: 20px;
    width: 52px;
    height: 52px;
    border-radius: 14px;
  }
}
</style>
