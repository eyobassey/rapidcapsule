<template>
  <div class="sa-dashboard">
    <!-- Scrollable Content -->
    <div class="dashboard-scroll">
      <div class="dashboard-container">
        <!-- Main Column -->
        <div class="main-column">
          <!-- Welcome Section -->
          <div class="welcome-section">
            <div class="welcome-content">
              <h1 class="welcome-title">Welcome back, Dr. {{ userName }}!</h1>
              <p class="welcome-text">
                {{ todayFormatted }} · {{ dashboardStats.today }} appointments today
              </p>
            </div>
            <div class="welcome-badge" v-if="dashboardStats.pendingFollowUps > 0">
              <v-icon name="hi-bell" scale="0.8" />
              <span>{{ dashboardStats.pendingFollowUps }} follow-ups pending</span>
            </div>
          </div>

          <!-- Mobile Quick Actions -->
          <div class="mobile-quick-actions">
            <router-link :to="{ name: 'SpecialistAppointmentsList' }" class="draft-btn">
              View All
            </router-link>
            <button class="resume-btn" @click="goToCreate">
              Book New
              <v-icon name="hi-arrow-right" scale="0.7" />
            </button>
          </div>

          <!-- AI Greeting Banner (Dismissible) -->
          <div v-if="aiGreeting && !dismissedGreeting" class="ai-banner">
            <div class="ai-icon">
              <v-icon name="hi-sparkles" scale="1" />
            </div>
            <div class="ai-content">
              <h4>AI Insight</h4>
              <p>{{ aiGreeting }}</p>
            </div>
            <button class="ai-dismiss" @click="dismissedGreeting = true">
              <v-icon name="hi-x" scale="0.8" />
            </button>
          </div>

          <!-- Quick Stats Grid - Reordered: Balance last -->
          <div class="stats-grid">
            <div class="stat-card" :class="{ 'is-active': dashboardStats.today > 0 }">
              <div class="stat-icon today">
                <v-icon name="hi-calendar" scale="1.1" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboardStats.today }}</span>
                <span class="stat-label">Today</span>
              </div>
              <div class="stat-trend up" v-if="dashboardStats.today > 0">
                <v-icon name="hi-trending-up" scale="0.7" />
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon week">
                <v-icon name="hi-calendar" scale="1.1" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboardStats.thisWeek }}</span>
                <span class="stat-label">This Week</span>
              </div>
            </div>

            <div class="stat-card" :class="{ 'is-warning': dashboardStats.pendingFollowUps > 0 }">
              <div class="stat-icon followups">
                <v-icon name="hi-clock" scale="1.1" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboardStats.pendingFollowUps }}</span>
                <span class="stat-label">Follow-ups</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon completed">
                <v-icon name="hi-check-circle" scale="1.1" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboardStats.completedThisMonth }}</span>
                <span class="stat-label">Completed</span>
              </div>
            </div>

            <div class="stat-card" :class="{ 'is-danger': dashboardStats.missedThisMonth > 0 }">
              <div class="stat-icon missed">
                <v-icon name="hi-x-circle" scale="1.1" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ dashboardStats.missedThisMonth }}</span>
                <span class="stat-label">Missed</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon revenue">
                <v-icon name="hi-currency-dollar" scale="1.1" />
              </div>
              <div class="stat-info">
                <span class="stat-value">₦{{ formatCurrency(dashboardStats.walletBalance) }}</span>
                <span class="stat-label">Wallet Balance</span>
              </div>
            </div>
          </div>

          <!-- Schedule Section FIRST (moved above charts) -->
          <div class="two-column-layout">
            <!-- Today's Schedule Card -->
            <div class="schedule-card">
              <div class="card-header">
                <div class="card-title-group">
                  <div class="card-icon">
                    <v-icon name="hi-calendar" scale="0.9" />
                  </div>
                  <div>
                    <h2>Today's Schedule</h2>
                    <span class="card-subtitle" v-if="dashboardStats.todayAppointments.length > 0">
                      {{ dashboardStats.todayAppointments.length }} appointments
                    </span>
                  </div>
                </div>
                <router-link :to="{ name: 'SpecialistAppointmentsList' }" class="view-all-link">
                  View All
                  <v-icon name="hi-arrow-right" scale="0.7" />
                </router-link>
              </div>

              <!-- Loading State -->
              <div v-if="isLoading" class="loading-state">
                <div class="spinner"></div>
                <span>Loading appointments...</span>
              </div>

              <!-- Empty State -->
              <div v-else-if="dashboardStats.todayAppointments.length === 0" class="empty-state">
                <div class="empty-icon">
                  <v-icon name="hi-calendar" scale="2" />
                </div>
                <h3>No appointments today</h3>
                <p>Enjoy your free day or book new appointments</p>
                <button class="btn-primary" @click="goToCreate">
                  <v-icon name="hi-plus" scale="0.8" />
                  Book Appointment
                </button>
              </div>

              <!-- Schedule Timeline -->
              <div v-else class="schedule-timeline">
                <div
                  v-for="(appointment, index) in dashboardStats.todayAppointments.slice(0, 5)"
                  :key="appointment._id"
                  class="timeline-item"
                  :class="{ 'is-next': index === 0, 'is-last': index === Math.min(dashboardStats.todayAppointments.length, 5) - 1 }"
                  @click="goToDetail(appointment._id)"
                >
                  <!-- Time Connector -->
                  <div class="timeline-connector" v-if="index < Math.min(dashboardStats.todayAppointments.length, 5) - 1"></div>

                  <!-- Time Column -->
                  <div class="timeline-time">
                    <span class="time-value">{{ formatTime(appointment.start_time) }}</span>
                    <span class="time-duration">{{ appointment.duration || 30 }}m</span>
                  </div>

                  <!-- Status Indicator -->
                  <div class="timeline-indicator" :class="getStatusClass(appointment.status)">
                    <span class="indicator-dot"></span>
                  </div>

                  <!-- Patient Avatar - No border -->
                  <div class="timeline-avatar">
                    <img
                      v-if="getPatientPhoto(appointment)"
                      :src="getPatientPhoto(appointment)"
                      :alt="getPatientName(appointment)"
                      class="patient-photo"
                    />
                    <div v-else class="patient-initials">
                      {{ getPatientInitials(appointment) }}
                    </div>
                  </div>

                  <!-- Content -->
                  <div class="timeline-content">
                    <div class="content-header">
                      <span class="patient-name">{{ getPatientName(appointment) }}</span>
                      <span class="channel-badge" :class="getChannelClass(appointment.meeting_channel)">
                        <v-icon :name="getChannelIcon(appointment.meeting_channel)" scale="0.65" />
                        {{ getChannelLabel(appointment.meeting_channel) }}
                      </span>
                    </div>
                    <div class="content-meta">
                      <span class="appointment-type">{{ appointment.appointment_type || 'Consultation' }}</span>
                      <span class="status-badge" :class="getStatusClass(appointment.status)">
                        {{ appointment.status || 'Confirmed' }}
                      </span>
                    </div>
                  </div>

                  <!-- Join Button -->
                  <button
                    v-if="hasMeetingLink(appointment)"
                    class="join-btn"
                    @click.stop="joinMeeting(appointment)"
                  >
                    <v-icon name="hi-video-camera" scale="0.8" />
                    Join
                  </button>
                  <v-icon v-else name="hi-chevron-right" scale="0.9" class="timeline-chevron" />
                </div>
              </div>

              <!-- View More Link -->
              <div v-if="dashboardStats.todayAppointments.length > 5" class="view-more">
                <router-link :to="{ name: 'SpecialistAppointmentsList', query: { view: 'today' } }">
                  +{{ dashboardStats.todayAppointments.length - 5 }} more appointments
                </router-link>
              </div>
            </div>

            <!-- Upcoming Appointments -->
            <div class="upcoming-card">
              <div class="card-header">
                <div class="card-title-group">
                  <div class="card-icon upcoming">
                    <v-icon name="hi-clock" scale="0.9" />
                  </div>
                  <div>
                    <h2>Upcoming</h2>
                    <span class="card-subtitle">Next appointments</span>
                  </div>
                </div>
              </div>

              <div v-if="dashboardStats.upcomingAppointments.length === 0" class="empty-state small">
                <p>No upcoming appointments</p>
              </div>

              <div v-else class="upcoming-list">
                <div
                  v-for="apt in dashboardStats.upcomingAppointments"
                  :key="apt._id"
                  class="upcoming-item"
                  @click="goToDetail(apt._id)"
                >
                  <div class="upcoming-date">
                    <span class="date-day">{{ formatDay(apt.start_time) }}</span>
                    <span class="date-month">{{ formatMonth(apt.start_time) }}</span>
                  </div>
                  <div class="upcoming-info">
                    <span class="upcoming-patient">{{ getPatientName(apt) }}</span>
                    <span class="upcoming-time">{{ formatTime(apt.start_time) }}</span>
                  </div>
                  <v-icon name="hi-chevron-right" scale="0.8" class="upcoming-arrow" />
                </div>
              </div>
            </div>
          </div>

          <!-- Charts Section (moved below schedule) -->
          <div class="charts-section">
            <div class="chart-card">
              <div class="card-header">
                <div class="card-title-group">
                  <div class="card-icon chart">
                    <v-icon name="hi-chart-bar" scale="0.9" />
                  </div>
                  <div>
                    <h2>Weekly Overview</h2>
                    <span class="card-subtitle">{{ weekDateRange }}</span>
                  </div>
                </div>
                <div class="week-nav">
                  <button class="week-nav-btn" @click="previousWeek" title="Previous Week">
                    <v-icon name="hi-chevron-left" scale="0.85" />
                  </button>
                  <button
                    v-if="weekOffset !== 0"
                    class="week-nav-today"
                    @click="goToCurrentWeek"
                    title="Go to Current Week"
                  >
                    Today
                  </button>
                  <button class="week-nav-btn" @click="nextWeek" title="Next Week">
                    <v-icon name="hi-chevron-right" scale="0.85" />
                  </button>
                </div>
              </div>
              <div class="chart-body">
                <div class="bar-chart">
                  <div
                    v-for="(day, index) in currentWeekData"
                    :key="index"
                    class="chart-bar-group"
                    @mouseenter="hoveredBar = index"
                    @mouseleave="hoveredBar = null"
                    :class="{ 'is-hovered': hoveredBar === index }"
                  >
                    <!-- Tooltip -->
                    <div class="bar-tooltip" v-if="hoveredBar === index">
                      <div class="tooltip-content">
                        <span class="tooltip-day">{{ day.fullDate }}</span>
                        <div class="tooltip-row">
                          <span class="tooltip-dot scheduled"></span>
                          <span>{{ day.scheduled }} scheduled</span>
                        </div>
                        <div class="tooltip-row">
                          <span class="tooltip-dot completed"></span>
                          <span>{{ day.completed }} completed</span>
                        </div>
                      </div>
                    </div>
                    <div class="bar-container">
                      <div
                        class="bar scheduled"
                        :style="{ height: getBarHeight(day.scheduled) + '%' }"
                      ></div>
                      <div
                        class="bar completed"
                        :style="{ height: getBarHeight(day.completed) + '%' }"
                      ></div>
                    </div>
                    <span class="bar-label">{{ day.day }}</span>
                  </div>
                </div>
                <div class="chart-legend">
                  <div class="legend-item">
                    <span class="legend-dot scheduled"></span>
                    <span>Scheduled</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-dot completed"></span>
                    <span>Completed</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="chart-card earnings-card">
              <div class="card-header">
                <div class="card-title-group">
                  <div class="card-icon earnings">
                    <v-icon name="hi-currency-dollar" scale="0.9" />
                  </div>
                  <div>
                    <h2>Earnings</h2>
                    <span class="card-subtitle">Total revenue</span>
                  </div>
                </div>
              </div>
              <div class="earnings-body">
                <div class="earnings-amount">
                  <span class="currency">₦</span>
                  <span class="amount">{{ formatCurrency(dashboardStats.totalEarnings) }}</span>
                </div>
                <p class="earnings-label">Total Earnings</p>
                <div class="earnings-wallet">
                  <v-icon name="hi-credit-card" scale="0.8" />
                  <span>Wallet: ₦{{ formatCurrency(dashboardStats.walletBalance) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Side Column (Desktop) -->
        <div class="side-column">
          <!-- Quick Actions Card -->
          <div class="actions-card">
            <h3 class="section-title">Quick Actions</h3>
            <div class="actions-grid">
              <button class="action-btn primary" @click="goToCreate">
                <div class="action-icon">
                  <v-icon name="hi-plus" scale="1" />
                </div>
                <span>Book New</span>
              </button>
              <button class="action-btn" @click="startInstantConsult">
                <div class="action-icon video">
                  <v-icon name="hi-video-camera" scale="1" />
                </div>
                <span>Instant Consult</span>
              </button>
              <router-link :to="{ name: 'SpecialistAppointmentsList' }" class="action-btn">
                <div class="action-icon list">
                  <v-icon name="hi-view-list" scale="1" />
                </div>
                <span>View All</span>
              </router-link>
              <router-link :to="{ name: 'SpecialistAppointmentsSettings' }" class="action-btn">
                <div class="action-icon settings">
                  <v-icon name="hi-cog" scale="1" />
                </div>
                <span>Settings</span>
              </router-link>
            </div>
          </div>

          <!-- Alerts Card -->
          <div class="alerts-card" v-if="computedAlerts.length > 0">
            <div class="card-header">
              <div class="card-title-group">
                <div class="card-icon alert">
                  <v-icon name="hi-bell" scale="0.9" />
                </div>
                <h2>Alerts</h2>
              </div>
              <span class="alert-count">{{ computedAlerts.length }}</span>
            </div>
            <div class="alerts-list">
              <div
                v-for="alert in computedAlerts.slice(0, 3)"
                :key="alert.id"
                class="alert-item"
                :class="alert.type"
              >
                <div class="alert-icon">
                  <v-icon :name="alert.icon" scale="0.8" />
                </div>
                <div class="alert-content">
                  <span class="alert-title">{{ alert.title }}</span>
                  <span class="alert-message">{{ alert.message }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- No Alerts State -->
          <div v-else class="no-alerts-card">
            <div class="no-alerts-icon">
              <v-icon name="hi-check-circle" scale="1.5" />
            </div>
            <div class="no-alerts-content">
              <h4>All caught up!</h4>
              <p>No pending alerts or follow-ups</p>
            </div>
          </div>

          <!-- Recent Activity Card -->
          <div class="activity-card">
            <div class="card-header">
              <div class="card-title-group">
                <div class="card-icon activity">
                  <v-icon name="hi-clock" scale="0.9" />
                </div>
                <h2>Recent Activity</h2>
              </div>
            </div>
            <div v-if="dashboardStats.recentActivity.length > 0" class="activity-list">
              <div
                v-for="activity in dashboardStats.recentActivity.slice(0, 5)"
                :key="activity.referenceId"
                class="activity-item"
              >
                <div class="activity-icon" :class="getActivityType(activity.type)">
                  <v-icon :name="getActivityIcon(activity.type)" scale="0.75" />
                </div>
                <div class="activity-info">
                  <span class="activity-text">{{ activity.title }}</span>
                  <span class="activity-desc" v-if="activity.description">{{ activity.description }}</span>
                  <span class="activity-time">{{ formatRelativeTime(activity.date) }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state small">
              <p>No recent activity</p>
            </div>
          </div>

          <!-- Tip Card -->
          <div class="tip-card">
            <div class="tip-icon">
              <v-icon name="hi-light-bulb" scale="1" />
            </div>
            <div class="tip-content">
              <h4>Pro Tip</h4>
              <p>
                Specialists who confirm appointments within <strong>1 hour</strong>
                see <strong>40% fewer</strong> no-shows.
              </p>
            </div>
          </div>

          <!-- Support Card -->
          <div class="support-card">
            <v-icon name="hi-chat" scale="1" />
            <div class="support-content">
              <span class="support-title">Need help?</span>
              <span class="support-text">We're here 24/7</span>
            </div>
            <button class="support-btn">Chat</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { formatDistanceToNow } from 'date-fns';
import { useAppointments } from './composables/useAppointments';

const router = useRouter();
const store = useStore();
const { dashboardStats, isLoading, fetchDashboard } = useAppointments();

const dismissedGreeting = ref(false);
const hoveredBar = ref(null);
const weekOffset = ref(0); // 0 = current week, -1 = previous week, 1 = next week

// User info
const userProfile = computed(() => store.getters['userprofile']);
const userName = computed(() => {
  const profile = userProfile.value?.profile;
  return profile?.first_name || 'Doctor';
});

// Today's date formatted
const todayFormatted = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
});

// AI Greeting
const aiGreeting = computed(() => {
  const count = dashboardStats.todayAppointments.length;
  if (count === 0) {
    return "Your schedule is clear today. Perfect time to catch up on patient notes or plan ahead!";
  }
  const next = dashboardStats.todayAppointments[0];
  const nextName = getPatientName(next);
  return `You have ${count} appointment${count > 1 ? 's' : ''} today. Next: ${nextName} at ${formatTime(next?.start_time)}.`;
});

// Week navigation helpers
function getWeekDates(offset = 0) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset + (offset * 7));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { start: weekStart, end: weekEnd };
}

// Current week date range display
const weekDateRange = computed(() => {
  const { start, end } = getWeekDates(weekOffset.value);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} - ${endStr}`;
});

// Calculate chart data based on week offset
const currentWeekData = computed(() => {
  const { start } = getWeekDates(weekOffset.value);
  const allAppointments = dashboardStats.allAppointmentsData || [];
  const completedData = dashboardStats.completedAppointmentsData || [];

  const weeklyData = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const dayCompleted = completedData.filter((apt) => {
      const aptDate = new Date(apt.start_time);
      return aptDate >= date && aptDate < nextDate;
    }).length;

    const dayScheduled = allAppointments.filter((apt) => {
      const aptDate = new Date(apt.start_time);
      return aptDate >= date && aptDate < nextDate;
    }).length;

    weeklyData.push({
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completed: dayCompleted,
      scheduled: dayScheduled,
    });
  }

  return weeklyData;
});

// Week navigation functions
function previousWeek() {
  weekOffset.value--;
}

function nextWeek() {
  weekOffset.value++;
}

function goToCurrentWeek() {
  weekOffset.value = 0;
}

// Computed Alerts based on real data
const computedAlerts = computed(() => {
  const alerts = [];

  if (dashboardStats.pendingFollowUps > 0) {
    alerts.push({
      id: 1,
      type: 'warning',
      icon: 'hi-clock',
      title: `${dashboardStats.pendingFollowUps} pending follow-ups`,
      message: 'Patients awaiting follow-up appointments',
    });
  }

  if (dashboardStats.missedThisMonth > 0) {
    alerts.push({
      id: 2,
      type: 'critical',
      icon: 'hi-exclamation',
      title: `${dashboardStats.missedThisMonth} missed this month`,
      message: 'Consider following up with these patients',
    });
  }

  if (dashboardStats.today >= 5) {
    alerts.push({
      id: 3,
      type: 'info',
      icon: 'hi-trending-up',
      title: 'Busy day ahead',
      message: `You have ${dashboardStats.today} appointments today`,
    });
  }

  return alerts;
});

// Methods
function goToCreate() {
  router.push({ name: 'SpecialistAppointmentsCreate' });
}

function goToDetail(id) {
  router.push({ name: 'SpecialistAppointmentDetail', params: { id } });
}

function startInstantConsult() {
  alert('Instant consultation feature coming soon!');
}

function hasMeetingLink(appointment) {
  return !!(appointment.meeting_link || appointment.start_url || appointment.join_url);
}

function joinMeeting(appointment) {
  const link = appointment.start_url || appointment.meeting_link || appointment.join_url;
  if (link) {
    window.open(link, '_blank');
  }
}

function getPatientName(appointment) {
  if (!appointment) return 'Patient';
  const patient = appointment.patient;
  if (typeof patient === 'object') {
    return `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient';
  }
  return 'Patient';
}

function getPatientPhoto(appointment) {
  if (!appointment?.patient?.profile) return null;
  return appointment.patient.profile.profile_photo || appointment.patient.profile.profile_image;
}

function getPatientInitials(appointment) {
  const name = getPatientName(appointment);
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatTime(timeOrDate) {
  if (!timeOrDate) return '';
  const date = new Date(timeOrDate);
  const h = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

function formatDay(date) {
  return new Date(date).getDate();
}

function formatMonth(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short' });
}

function formatRelativeTime(date) {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '';
  }
}

function formatCurrency(amount) {
  if (!amount) return '0';
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + 'K';
  }
  return amount.toLocaleString();
}

function getBarHeight(value) {
  const max = Math.max(...currentWeekData.value.map(d => Math.max(d.scheduled, d.completed)), 1);
  return (value / max) * 100;
}

function getChannelIcon(channel) {
  const icons = {
    zoom: 'hi-video-camera',
    video: 'hi-video-camera',
    phone: 'hi-phone',
    audio: 'hi-phone',
    chat: 'hi-chat',
  };
  return icons[channel] || 'hi-video-camera';
}

function getChannelLabel(channel) {
  const labels = {
    zoom: 'Video',
    video: 'Video',
    phone: 'Phone',
    audio: 'Audio',
    chat: 'Chat',
  };
  return labels[channel] || 'Video';
}

function getChannelClass(channel) {
  const classes = {
    zoom: 'video',
    video: 'video',
    phone: 'audio',
    audio: 'audio',
    chat: 'chat',
  };
  return classes[channel] || 'video';
}

function getStatusClass(status) {
  const s = (status || 'confirmed').toLowerCase();
  return s.replace(/_/g, '-');
}

function getActivityIcon(type) {
  const icons = {
    'appointment_completed': 'hi-check-circle',
    'appointment_booked': 'hi-plus-circle',
    'appointment_cancelled': 'hi-x-circle',
    'prescription_written': 'ri-capsule-line',
    'note_added': 'hi-document-text',
  };
  return icons[type] || 'hi-clock';
}

function getActivityType(type) {
  const types = {
    'appointment_completed': 'completed',
    'appointment_booked': 'booked',
    'appointment_cancelled': 'cancelled',
    'prescription_written': 'prescription',
    'note_added': 'note',
  };
  return types[type] || 'default';
}

onMounted(() => {
  fetchDashboard();
});
</script>

<style scoped lang="scss">
@import './styles/sa-variables';

.sa-dashboard {
  width: 100%;
  min-height: 100%;
  font-family: $sa-font-body;
}

.dashboard-scroll {
  width: 100%;
  min-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  @include sa-scrollbar;
}

.dashboard-container {
  display: flex;
  gap: 1.5rem;
  width: 100%;
}

.main-column {
  flex: 1;
  min-width: 0;
}

.side-column {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @include sa-hide-mobile;
}


// ===================
// WELCOME SECTION
// ===================

.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: $sa-navy;
  font-family: $sa-font-heading;
  margin: 0 0 0.25rem 0;
}

.welcome-text {
  font-size: 0.875rem;
  color: $sa-text-secondary;
  margin: 0;
}

.welcome-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: $sa-orange-light;
  color: $sa-orange-dark;
  border-radius: $sa-radius-full;
  font-size: 0.8125rem;
  font-weight: 600;
}


// ===================
// MOBILE QUICK ACTIONS
// ===================

.mobile-quick-actions {
  display: none;
  gap: 0.75rem;
  margin-bottom: 1.25rem;

  @media (max-width: $sa-breakpoint-lg) {
    display: flex;
  }
}

.draft-btn {
  flex: 1;
  @include sa-button-secondary;
  text-align: center;
}

.resume-btn {
  flex: 1;
  @include sa-button-cta;
}


// ===================
// AI BANNER
// ===================

.ai-banner {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, $sa-sky-light 0%, rgba($sa-sky, 0.1) 100%);
  border: 1px solid rgba($sa-sky, 0.2);
  border-radius: $sa-radius-lg;
  margin-bottom: 1.25rem;
  position: relative;
}

.ai-icon {
  @include sa-icon-wrapper(40px);
  @include sa-icon-sky;
}

.ai-content {
  flex: 1;

  h4 {
    font-size: 0.6875rem;
    font-weight: 700;
    color: $sa-sky-dark;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0 0 0.25rem 0;
  }

  p {
    margin: 0;
    font-size: 0.875rem;
    color: $sa-navy;
    line-height: 1.5;
  }
}

.ai-dismiss {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba($sa-white, 0.7);
  border-radius: 50%;
  color: $sa-text-secondary;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $sa-transition;

  &:hover {
    background: $sa-white;
    color: $sa-navy;
  }
}


// ===================
// STATS GRID
// ===================

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.875rem;
  margin-bottom: 1.25rem;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: $sa-breakpoint-lg) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: $sa-breakpoint-sm) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  @include sa-card;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
  padding: 0.875rem 1rem;

  &.is-active {
    @include sa-card-active;

    .stat-icon.today {
      @include sa-icon-sky;
    }
  }

  &.is-warning {
    border-color: rgba($sa-orange, 0.3);

    .stat-icon.followups {
      background: $sa-orange-gradient;
      color: $sa-white;
      box-shadow: $sa-shadow-orange;
    }
  }

  &.is-danger {
    border-color: rgba($sa-error, 0.3);

    .stat-icon.missed {
      background: linear-gradient(135deg, $sa-error 0%, darken($sa-error, 10%) 100%);
      color: $sa-white;
    }
  }
}

.stat-icon {
  @include sa-icon-wrapper(40px);

  &.today {
    background: $sa-sky-light;
    color: $sa-sky-dark;
  }

  &.week {
    background: $sa-success-light;
    color: $sa-success-dark;
  }

  &.followups {
    background: $sa-orange-light;
    color: $sa-orange-dark;
  }

  &.revenue {
    background: #E8F5E9;
    color: #2E7D32;
  }

  &.completed {
    background: #E3F2FD;
    color: #1976D2;
  }

  &.missed {
    background: $sa-error-light;
    color: $sa-error;
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: $sa-navy;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.6875rem;
  color: $sa-text-secondary;
}

.stat-trend {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;

  &.up {
    color: $sa-success;
  }

  &.down {
    color: $sa-error;
  }
}


// ===================
// TWO COLUMN LAYOUT
// ===================

.two-column-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;

  @media (max-width: $sa-breakpoint-lg) {
    grid-template-columns: 1fr;
  }
}


// ===================
// SCHEDULE CARD
// ===================

.schedule-card,
.upcoming-card {
  @include sa-card;
  padding: 0;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid $sa-gray-100;
}

.card-title-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  h2 {
    font-size: 0.9375rem;
    font-weight: 700;
    color: $sa-navy;
    margin: 0;
  }
}

.card-icon {
  @include sa-icon-wrapper(32px);
  @include sa-icon-sky;

  &.activity {
    background: #F3E5F5;
    color: #7B1FA2;
    box-shadow: none;
  }

  &.alert {
    background: $sa-orange-light;
    color: $sa-orange-dark;
    box-shadow: none;
  }

  &.chart {
    background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
    color: $sa-white;
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  }

  &.upcoming {
    background: #FFF3E0;
    color: #E65100;
    box-shadow: none;
  }
}

// Week Navigation
.week-nav {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.week-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid $sa-gray-200;
  border-radius: $sa-radius-sm;
  background: $sa-white;
  color: $sa-text-secondary;
  cursor: pointer;
  transition: all $sa-transition;

  &:hover {
    border-color: $sa-sky;
    color: $sa-sky;
    background: $sa-sky-light;
  }
}

.week-nav-today {
  padding: 0.25rem 0.625rem;
  font-size: 0.6875rem;
  font-weight: 600;
  border: 1px solid $sa-sky;
  border-radius: $sa-radius-sm;
  background: $sa-sky-light;
  color: $sa-sky-dark;
  cursor: pointer;
  transition: all $sa-transition;

  &:hover {
    background: $sa-sky;
    color: $sa-white;
  }
}

.card-subtitle {
  font-size: 0.75rem;
  color: $sa-text-secondary;
}

.view-all-link {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: $sa-sky;
  text-decoration: none;
  transition: all $sa-transition;

  &:hover {
    color: $sa-sky-dark;
    gap: 0.5rem;
  }
}


// Loading & Empty States
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 2rem;
  text-align: center;

  &.small {
    padding: 1.5rem 1rem;

    p {
      margin: 0;
      font-size: 0.8125rem;
      color: $sa-text-muted;
    }
  }
}

.spinner {
  width: 36px;
  height: 36px;
  border: 3px solid $sa-gray-200;
  border-top-color: $sa-sky;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-icon {
  width: 64px;
  height: 64px;
  background: $sa-sky-light;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sa-sky;
  margin-bottom: 1rem;
}

.empty-state {
  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: $sa-navy;
    margin: 0 0 0.375rem;
  }

  p {
    color: $sa-text-secondary;
    margin: 0 0 1.25rem;
    font-size: 0.875rem;
  }
}

.btn-primary {
  @include sa-button-primary;
}


// Schedule Timeline
.schedule-timeline {
  padding: 0.75rem 0;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  position: relative;
  cursor: pointer;
  transition: all $sa-transition;

  &:hover {
    background: $sa-gray-100;
  }

  &.is-next {
    background: rgba($sa-sky, 0.04);

    &:hover {
      background: rgba($sa-sky, 0.08);
    }
  }
}

.timeline-connector {
  position: absolute;
  left: calc(1.25rem + 52px + 0.375rem + 6px);
  top: calc(50% + 10px);
  bottom: -0.75rem;
  width: 2px;
  background: $sa-gray-200;
}

.timeline-time {
  width: 52px;
  flex-shrink: 0;
  text-align: right;

  .time-value {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: $sa-navy;
  }

  .time-duration {
    font-size: 0.625rem;
    color: $sa-text-muted;
  }
}

.timeline-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: $sa-gray-100;
  border: 2px solid $sa-gray-300;

  .indicator-dot {
    width: 4px;
    height: 4px;
    background: $sa-gray-400;
    border-radius: 50%;
  }

  &.open,
  &.confirmed {
    background: $sa-success-light;
    border-color: $sa-success;

    .indicator-dot {
      background: $sa-success;
    }
  }

  &.pending {
    background: $sa-warning-light;
    border-color: $sa-warning;

    .indicator-dot {
      background: $sa-warning;
    }
  }
}

// Patient avatar - no border
.timeline-avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;

  .patient-photo {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
  }

  .patient-initials {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, $sa-sky-light 0%, darken($sa-sky-light, 5%) 100%);
    color: $sa-sky-dark;
    font-size: 0.75rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.timeline-content {
  flex: 1;
  min-width: 0;
}

.content-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.125rem;
}

.patient-name {
  font-weight: 600;
  font-size: 0.875rem;
  color: $sa-navy;
  @include sa-truncate;
}

.channel-badge {
  @include sa-badge;
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;

  &.video {
    background: $sa-sky-light;
    color: $sa-sky-dark;
  }

  &.audio {
    background: $sa-orange-light;
    color: $sa-orange-dark;
  }

  &.chat {
    background: #F3E5F5;
    color: #7B1FA2;
  }
}

.content-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.appointment-type {
  font-size: 0.75rem;
  color: $sa-text-secondary;
}

.status-badge {
  @include sa-badge;
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  text-transform: capitalize;

  &.open,
  &.confirmed {
    background: $sa-success-light;
    color: $sa-success-dark;
  }

  &.pending {
    background: $sa-warning-light;
    color: darken($sa-warning, 15%);
  }
}

// Join button
.join-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
  color: $sa-white;
  border: none;
  border-radius: $sa-radius;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all $sa-transition;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
  }
}

.timeline-chevron {
  color: $sa-gray-400;
  flex-shrink: 0;
}

.view-more {
  padding: 0.875rem 1.25rem;
  border-top: 1px solid $sa-gray-100;
  text-align: center;

  a {
    font-size: 0.75rem;
    font-weight: 600;
    color: $sa-sky;
    text-decoration: none;

    &:hover {
      color: $sa-sky-dark;
    }
  }
}


// ===================
// UPCOMING CARD
// ===================

.upcoming-list {
  padding: 0.5rem 0;
}

.upcoming-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  transition: background $sa-transition;

  &:hover {
    background: $sa-gray-100;
  }
}

.upcoming-date {
  width: 40px;
  height: 40px;
  background: $sa-sky-gradient;
  border-radius: $sa-radius;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .date-day {
    font-size: 1rem;
    font-weight: 700;
    color: $sa-white;
    line-height: 1;
  }

  .date-month {
    font-size: 0.5rem;
    color: rgba($sa-white, 0.85);
    text-transform: uppercase;
  }
}

.upcoming-info {
  flex: 1;
  min-width: 0;

  .upcoming-patient {
    display: block;
    font-weight: 600;
    font-size: 0.875rem;
    color: $sa-navy;
    @include sa-truncate;
  }

  .upcoming-time {
    font-size: 0.75rem;
    color: $sa-text-secondary;
  }
}

.upcoming-arrow {
  color: $sa-gray-400;
}


// ===================
// CHARTS SECTION
// ===================

.charts-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;

  @media (max-width: $sa-breakpoint-lg) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  @include sa-card;
  padding: 0;
  overflow: hidden;
}

.chart-body {
  padding: 1.25rem;
}

.bar-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 140px;
  gap: 0.5rem;
  padding-bottom: 1.5rem;
}

.chart-bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  position: relative;
  cursor: pointer;
  transition: transform $sa-transition;

  &.is-hovered {
    transform: scale(1.05);

    .bar-container {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}

.bar-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  z-index: 10;

  .tooltip-content {
    background: $sa-navy;
    color: $sa-white;
    padding: 0.625rem 0.875rem;
    border-radius: $sa-radius;
    font-size: 0.6875rem;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: $sa-navy;
    }
  }

  .tooltip-day {
    display: block;
    font-weight: 600;
    margin-bottom: 0.375rem;
    text-align: center;
    color: #FFFFFF;
  }

  .tooltip-row {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-top: 0.25rem;
    color: #FFFFFF;

    span {
      color: #FFFFFF;
    }
  }

  .tooltip-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;

    &.scheduled {
      background: $sa-sky-light;
    }

    &.completed {
      background: $sa-sky;
    }
  }
}

.bar-container {
  flex: 1;
  width: 100%;
  max-width: 32px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
  background: $sa-gray-100;
  border-radius: $sa-radius-sm;
  overflow: hidden;
  transition: box-shadow $sa-transition;
}

.bar {
  width: 100%;
  border-radius: $sa-radius-sm;
  transition: height 0.3s ease;
  min-height: 4px;

  &.scheduled {
    background: $sa-sky-light;
  }

  &.completed {
    background: $sa-sky-gradient;
  }
}

.bar-label {
  font-size: 0.625rem;
  color: $sa-text-muted;
  margin-top: 0.375rem;
  font-weight: 500;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  margin-top: 0.875rem;
  padding-top: 0.875rem;
  border-top: 1px solid $sa-gray-100;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  color: $sa-text-secondary;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;

  &.scheduled {
    background: $sa-sky-light;
  }

  &.completed {
    background: $sa-sky;
  }
}

.earnings-card {
  .card-icon.earnings {
    background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
    color: $sa-white;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
}

.earnings-body {
  padding: 1.25rem;
  text-align: center;
}

.earnings-amount {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  margin-bottom: 0.375rem;

  .currency {
    font-size: 1rem;
    font-weight: 600;
    color: $sa-text-secondary;
    margin-right: 0.125rem;
  }

  .amount {
    font-size: 2rem;
    font-weight: 800;
    color: $sa-navy;
    line-height: 1;
  }
}

.earnings-label {
  font-size: 0.8125rem;
  color: $sa-text-secondary;
  margin: 0 0 0.875rem;
}

.earnings-wallet {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  background: $sa-gray-100;
  border-radius: $sa-radius-full;
  font-size: 0.75rem;
  color: $sa-text-secondary;
  font-weight: 500;
}


// ===================
// QUICK ACTIONS CARD
// ===================

.actions-card {
  @include sa-card;
}

.section-title {
  @include sa-section-title;
  padding: 0 0.25rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.625rem;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem;
  background: $sa-gray-100;
  border: 1px solid transparent;
  border-radius: $sa-radius-md;
  cursor: pointer;
  text-decoration: none;
  transition: all $sa-transition;

  span {
    font-size: 0.75rem;
    font-weight: 600;
    color: $sa-text-secondary;
  }

  &:hover {
    background: $sa-white;
    border-color: $sa-sky;
    transform: translateY(-2px);
    box-shadow: $sa-shadow-md;

    span {
      color: $sa-navy;
    }

    .action-icon {
      @include sa-icon-sky;
    }
  }

  &.primary {
    background: rgba($sa-sky, 0.08);
    border-color: rgba($sa-sky, 0.2);

    .action-icon {
      @include sa-icon-sky;
    }

    span {
      color: $sa-sky-dark;
    }

    &:hover {
      background: $sa-sky-light;
    }
  }
}

.action-icon {
  @include sa-icon-wrapper(36px);
  @include sa-icon-default;

  &.video {
    background: $sa-success-light;
    color: $sa-success-dark;
  }

  &.list {
    background: #FFF3E0;
    color: $sa-orange-dark;
  }

  &.settings {
    background: #F3E5F5;
    color: #7B1FA2;
  }
}


// ===================
// ALERTS CARD
// ===================

.alerts-card {
  @include sa-card;
  padding: 0;
  overflow: hidden;

  .card-header {
    padding: 0.875rem 1rem;
  }
}

.alert-count {
  @include sa-badge;
  background: $sa-orange;
  color: $sa-white;
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
}

.alerts-list {
  padding: 0 0.875rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-item {
  display: flex;
  gap: 0.625rem;
  padding: 0.75rem;
  border-radius: $sa-radius-md;

  &.warning {
    background: $sa-warning-light;

    .alert-icon {
      color: $sa-orange-dark;
    }

    .alert-title {
      color: darken($sa-orange, 10%);
    }

    .alert-message {
      color: darken($sa-orange, 5%);
    }
  }

  &.info {
    background: $sa-sky-light;

    .alert-icon {
      color: $sa-sky-dark;
    }

    .alert-title {
      color: $sa-sky-dark;
    }

    .alert-message {
      color: darken($sa-sky, 10%);
    }
  }

  &.critical {
    background: $sa-error-light;

    .alert-icon {
      color: $sa-error;
    }

    .alert-title {
      color: $sa-error;
    }
  }
}

.alert-icon {
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.alert-title {
  font-size: 0.75rem;
  font-weight: 600;
}

.alert-message {
  font-size: 0.6875rem;
  opacity: 0.85;
}

.no-alerts-card {
  @include sa-card;
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.no-alerts-icon {
  @include sa-icon-wrapper(40px);
  background: $sa-success-light;
  color: $sa-success;
}

.no-alerts-content {
  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: $sa-navy;
    margin: 0 0 0.125rem;
  }

  p {
    font-size: 0.75rem;
    color: $sa-text-secondary;
    margin: 0;
  }
}


// ===================
// ACTIVITY CARD
// ===================

.activity-card {
  @include sa-card;
  padding: 0;
  overflow: hidden;

  .card-header {
    padding: 0.875rem 1rem;
    border-bottom: none;
  }
}

.activity-list {
  padding: 0 0.875rem 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
}

.activity-icon {
  @include sa-icon-wrapper(28px);
  border-radius: 50%;

  &.booked {
    background: $sa-success-light;
    color: $sa-success;
  }

  &.completed {
    background: $sa-sky-light;
    color: $sa-sky-dark;
  }

  &.cancelled {
    background: $sa-error-light;
    color: $sa-error;
  }

  &.prescription {
    background: #F3E5F5;
    color: #7B1FA2;
  }

  &.note {
    background: #E3F2FD;
    color: #1976D2;
  }

  &.default {
    background: $sa-gray-100;
    color: $sa-text-secondary;
  }
}

.activity-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.activity-text {
  font-size: 0.75rem;
  color: $sa-navy;
  line-height: 1.4;
}

.activity-desc {
  font-size: 0.6875rem;
  color: $sa-text-secondary;
  margin-top: 0.125rem;
}

.activity-time {
  font-size: 0.625rem;
  color: $sa-text-muted;
  margin-top: 0.125rem;
}


// ===================
// TIP CARD
// ===================

.tip-card {
  background: #FFF7ED;
  border: 1px solid #FDBA74;
  border-radius: $sa-radius-lg;
  padding: 1rem;
  display: flex;
  gap: 0.875rem;
}

.tip-icon {
  @include sa-icon-wrapper(36px);
  background: #FFEDD5;
  color: #EA580C;
  flex-shrink: 0;
}

.tip-content {
  h4 {
    font-size: 0.75rem;
    font-weight: 700;
    color: #9A3412;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.75rem;
    color: #78350F;
    margin: 0;
    line-height: 1.5;
  }
}


// ===================
// SUPPORT CARD
// ===================

.support-card {
  @include sa-card;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  > svg {
    color: $sa-sky;
  }
}

.support-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.support-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: $sa-navy;
}

.support-text {
  font-size: 0.6875rem;
  color: $sa-text-secondary;
}

.support-btn {
  padding: 0.375rem 0.875rem;
  background: $sa-sky;
  color: $sa-white;
  border: none;
  border-radius: $sa-radius;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all $sa-transition;

  &:hover {
    background: $sa-sky-dark;
  }
}


// ===================
// RESPONSIVE
// ===================

@media (max-width: $sa-breakpoint-lg) {
  .dashboard-container {
    flex-direction: column;
    gap: 1.25rem;
  }

  .main-column {
    width: 100%;
  }

  .welcome-title {
    font-size: 1.25rem;
  }

  .welcome-text {
    font-size: 0.8125rem;
  }

  .welcome-badge {
    font-size: 0.6875rem;
    padding: 0.375rem 0.75rem;
  }

  .stat-card {
    padding: 0.75rem;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
  }

  .stat-value {
    font-size: 1.125rem;
  }

  .schedule-card {
    margin-bottom: 0;
  }

  .timeline-item {
    padding: 0.625rem 1rem;
    gap: 0.625rem;
  }

  .timeline-time {
    width: 48px;

    .time-value {
      font-size: 0.75rem;
    }
  }

  .timeline-connector {
    left: calc(1rem + 48px + 0.3125rem + 5px);
  }

  .content-header {
    flex-wrap: wrap;
  }

  .join-btn {
    padding: 0.375rem 0.625rem;
    font-size: 0.6875rem;
  }
}

@media (max-width: $sa-breakpoint-sm) {
  .timeline-item {
    flex-wrap: wrap;
  }

  .timeline-content {
    order: 3;
    width: 100%;
    padding-left: calc(48px + 12px + 36px + 1.5rem);
    margin-top: 0.375rem;
  }

  .join-btn,
  .timeline-chevron {
    order: 2;
    margin-left: auto;
  }
}
</style>
