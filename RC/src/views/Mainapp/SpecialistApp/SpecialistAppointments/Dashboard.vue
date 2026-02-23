<template>
	<div class="dashboard-page">
		<!-- Mobile Header -->
		<header class="mobile-header">
			<button class="menu-btn" @click="$emit('openSideNav')">
				<v-icon name="hi-menu-alt-2" scale="1.2" />
			</button>
			<div class="header-logo">
				<v-icon name="hi-calendar" scale="1" />
				<span>Appointments</span>
			</div>
			<button class="header-action-btn" @click="goToCreate">
				<v-icon name="hi-plus" scale="1" />
			</button>
		</header>

		<!-- Page Content -->
		<div class="page-body">
			<!-- Loading State -->
			<div v-if="isLoading" class="loading-state">
				<div class="loading-spinner">
					<div class="spinner-ring"></div>
					<v-icon name="hi-calendar" scale="1.2" class="spinner-icon" />
				</div>
				<p>Loading appointments...</p>
			</div>

			<template v-else>
				<!-- Hero Section -->
				<section class="hero">
					<div class="hero__content">
						<div class="hero__badge">
							<div class="badge-pulse"></div>
							<v-icon name="hi-calendar" />
							<span>{{ getTimeGreeting() }}</span>
						</div>
						<h1 class="hero__title">
							Appointments<br/>
							<span class="hero__title-accent">Hub</span>
						</h1>
						<p class="hero__subtitle">
							Manage your schedule, track patients, and stay organized. {{ todayFormatted }}
						</p>
						<div class="hero__stats">
							<div class="hero-stat">
								<span class="hero-stat__value">{{ dashboardStats.today }}</span>
								<span class="hero-stat__label">Today</span>
							</div>
							<div class="hero-stat__divider"></div>
							<div class="hero-stat">
								<span class="hero-stat__value hero-stat__value--warning">{{ dashboardStats.thisWeek }}</span>
								<span class="hero-stat__label">This Week</span>
							</div>
							<div class="hero-stat__divider"></div>
							<div class="hero-stat">
								<span class="hero-stat__value hero-stat__value--success">{{ dashboardStats.completedThisMonth }}</span>
								<span class="hero-stat__label">Completed</span>
							</div>
							<div class="hero-stat__divider"></div>
							<div class="hero-stat">
								<span class="hero-stat__value hero-stat__value--danger">{{ dashboardStats.missedThisMonth }}</span>
								<span class="hero-stat__label">Missed</span>
							</div>
						</div>
					</div>
					<div class="hero__visual">
						<div class="dashboard-orb">
							<div class="orb-ring orb-ring--1"></div>
							<div class="orb-ring orb-ring--2"></div>
							<div class="orb-ring orb-ring--3"></div>
							<div class="orb-core">
								<v-icon name="hi-calendar" />
							</div>
						</div>
						<div class="floating-icons">
							<div class="float-icon float-icon--1"><v-icon name="hi-clock" /></div>
							<div class="float-icon float-icon--2"><v-icon name="hi-user-group" /></div>
							<div class="float-icon float-icon--3"><v-icon name="hi-check-circle" /></div>
						</div>
					</div>
				</section>

				<!-- Bento Grid -->
				<section class="bento-grid">
					<!-- Stats Row -->
					<div class="stats-row">
						<div class="stat-card">
							<div class="stat-icon sky">
								<v-icon name="hi-calendar" scale="1.3" />
							</div>
							<div class="stat-info">
								<span class="stat-value">{{ dashboardStats.today }}</span>
								<span class="stat-label">Today</span>
								<span class="stat-sub">{{ dashboardStats.todayAppointments.length }} scheduled</span>
							</div>
						</div>

						<div class="stat-card">
							<div class="stat-icon amber">
								<v-icon name="hi-calendar" scale="1.3" />
							</div>
							<div class="stat-info">
								<span class="stat-value">{{ dashboardStats.thisWeek }}</span>
								<span class="stat-label">This Week</span>
								<span class="stat-sub">{{ dashboardStats.pendingFollowUps }} follow-ups</span>
							</div>
						</div>

						<div class="stat-card">
							<div class="stat-icon emerald">
								<v-icon name="hi-check-circle" scale="1.3" />
							</div>
							<div class="stat-info">
								<span class="stat-value">{{ dashboardStats.completedThisMonth }}</span>
								<span class="stat-label">Completed</span>
								<span class="stat-sub">this month</span>
							</div>
						</div>

						<div class="stat-card">
							<div class="stat-icon violet">
								<v-icon name="bi-wallet2" scale="1.3" />
							</div>
							<div class="stat-info">
								<span class="stat-value">{{ formatConvertedCompact(dashboardStats.walletBalance) }}</span>
								<span class="stat-label">Wallet</span>
								<span class="stat-sub">{{ formatConvertedCompact(dashboardStats.totalEarnings) }} total</span>
							</div>
						</div>
					</div>

					<!-- Quick Actions Card -->
					<div class="bento-card actions-card">
						<div class="card-header">
							<h3>Quick Actions</h3>
						</div>
						<div class="actions-row">
							<router-link :to="{ name: 'SpecialistAppointmentsList' }" class="action-btn">
								<div class="action-icon sky">
									<v-icon name="hi-clipboard-list" scale="1.1" />
								</div>
								<span>View All</span>
							</router-link>
							<button class="action-btn" @click="goToCreate">
								<div class="action-icon emerald">
									<v-icon name="hi-plus-circle" scale="1.1" />
								</div>
								<span>Book New</span>
							</button>
							<router-link :to="{ name: 'SpecialistAppointmentsAnalytics' }" class="action-btn">
								<div class="action-icon amber">
									<v-icon name="hi-chart-bar" scale="1.1" />
								</div>
								<span>Analytics</span>
							</router-link>
							<button class="action-btn" @click="startInstantConsult">
								<div class="action-icon violet">
									<v-icon name="hi-video-camera" scale="1.1" />
								</div>
								<span>Instant Consult</span>
							</button>
							<router-link :to="{ name: 'SpecialistAppointmentsSettings' }" class="action-btn">
								<div class="action-icon rose">
									<v-icon name="hi-cog" scale="1.1" />
								</div>
								<span>Settings</span>
							</router-link>
							<router-link to="/app/specialist/specialist-dashboard" class="action-btn">
								<div class="action-icon gray">
									<v-icon name="hi-home" scale="1.1" />
								</div>
								<span>Dashboard</span>
							</router-link>
						</div>
					</div>

					<!-- AI Insight Banner -->
					<div v-if="aiGreeting && !dismissedGreeting" class="bento-card ai-banner">
						<div class="ai-icon">
							<v-icon name="hi-sparkles" scale="1.1" />
						</div>
						<div class="ai-content">
							<h4>AI Insight</h4>
							<p>{{ aiGreeting }}</p>
						</div>
						<button class="ai-dismiss" @click="dismissedGreeting = true">
							<v-icon name="hi-x" scale="0.8" />
						</button>
					</div>

					<!-- Schedule + Upcoming Row -->
					<div class="grid-row grid-row--schedule">
						<!-- Today's Schedule -->
						<div class="bento-card schedule-card">
							<div class="card-header">
								<h3>
									<v-icon name="hi-clock" scale="0.9" />
									Today's Schedule
								</h3>
								<router-link :to="{ name: 'SpecialistAppointmentsList' }" class="view-all">
									View All
									<v-icon name="hi-arrow-right" scale="0.75" />
								</router-link>
							</div>
							<div class="card-content">
								<div v-if="dashboardStats.todayAppointments.length > 0" class="schedule-timeline">
									<div
										v-for="(appointment, index) in dashboardStats.todayAppointments.slice(0, 5)"
										:key="appointment._id"
										class="timeline-item"
										:class="{ completed: appointment.status === 'COMPLETED', ongoing: appointment.status === 'ONGOING' }"
										@click="goToDetail(appointment._id)"
									>
										<div class="timeline-time">
											{{ formatTime(appointment.start_time) }}
										</div>
										<div class="timeline-marker">
											<div class="marker-dot" :class="getStatusClass(appointment.status)"></div>
											<div class="marker-line" v-if="index < Math.min(dashboardStats.todayAppointments.length, 5) - 1"></div>
										</div>
										<div class="timeline-content">
											<div class="patient-info">
												<div class="patient-avatar-sm">
													<img
														v-if="getPatientPhoto(appointment)"
														:src="getPatientPhoto(appointment)"
														:alt="getPatientName(appointment)"
													/>
													<span v-else class="avatar-initials">{{ getPatientInitials(appointment) }}</span>
												</div>
												<div class="patient-details">
													<span class="patient-name">{{ getPatientName(appointment) }}</span>
													<span class="appointment-type">{{ appointment.appointment_type || 'Consultation' }}</span>
												</div>
											</div>
											<div class="timeline-actions">
												<span class="timeline-badge" :class="getStatusClass(appointment.status)">
													{{ appointment.status || 'OPEN' }}
												</span>
												<button
													v-if="hasMeetingLink(appointment)"
													class="join-btn"
													@click.stop="joinMeeting(appointment)"
												>
													<v-icon name="hi-video-camera" scale="0.7" />
													Join
												</button>
											</div>
										</div>
									</div>
								</div>
								<div v-else class="empty-state">
									<div class="empty-icon">
										<v-icon name="hi-calendar" scale="2" />
									</div>
									<h3>No appointments today</h3>
									<p>Your schedule is clear for today</p>
									<button class="empty-action" @click="goToCreate">
										<v-icon name="hi-plus" scale="0.9" />
										Schedule Appointment
									</button>
								</div>
							</div>
						</div>

						<!-- Upcoming Appointments -->
						<div class="bento-card upcoming-card">
							<div class="card-header">
								<h3>
									<v-icon name="hi-calendar" scale="0.9" />
									Upcoming
								</h3>
							</div>
							<div class="card-content">
								<div v-if="dashboardStats.upcomingAppointments.length > 0" class="appointments-list">
									<div
										v-for="apt in dashboardStats.upcomingAppointments"
										:key="apt._id"
										class="appointment-item"
										@click="goToDetail(apt._id)"
									>
										<div class="appointment-date-block">
											<span class="date-day">{{ formatDay(apt.start_time) }}</span>
											<span class="date-month">{{ formatMonth(apt.start_time) }}</span>
										</div>
										<div class="appointment-details">
											<span class="patient-name">{{ getPatientName(apt) }}</span>
											<div class="appointment-meta">
												<span class="meta-time">
													<v-icon name="hi-clock" scale="0.7" />
													{{ formatTime(apt.start_time) }}
												</span>
												<span class="meta-type">{{ apt.appointment_type || 'Consultation' }}</span>
											</div>
										</div>
										<v-icon name="hi-chevron-right" scale="0.9" class="item-chevron" />
									</div>
								</div>
								<div v-else class="empty-state small">
									<p>No upcoming appointments</p>
								</div>
							</div>
						</div>
					</div>

					<!-- Chart + Earnings Row -->
					<div class="grid-row grid-row--charts">
						<!-- Weekly Chart -->
						<div class="bento-card chart-card">
							<div class="card-header">
								<h3>
									<v-icon name="hi-chart-bar" scale="0.9" />
									Weekly Overview
								</h3>
								<div class="week-nav">
									<button class="week-nav-btn" @click="previousWeek">
										<v-icon name="hi-chevron-left" scale="0.85" />
									</button>
									<span class="week-range">{{ weekDateRange }}</span>
									<button
										v-if="weekOffset !== 0"
										class="week-today-btn"
										@click="goToCurrentWeek"
									>
										Today
									</button>
									<button class="week-nav-btn" @click="nextWeek">
										<v-icon name="hi-chevron-right" scale="0.85" />
									</button>
								</div>
							</div>
							<div class="card-content">
								<div class="bar-chart">
									<div
										v-for="(day, index) in currentWeekData"
										:key="index"
										class="chart-bar-group"
										@mouseenter="hoveredBar = index"
										@mouseleave="hoveredBar = null"
										:class="{ 'is-hovered': hoveredBar === index }"
									>
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
											<div class="bar scheduled" :style="{ height: getBarHeight(day.scheduled) + '%' }"></div>
											<div class="bar completed" :style="{ height: getBarHeight(day.completed) + '%' }"></div>
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

						<!-- Earnings Card -->
						<div class="bento-card earnings-card">
							<div class="card-header">
								<h3>
									<v-icon name="bi-wallet2" scale="0.9" />
									Earnings
								</h3>
							</div>
							<div class="card-content earnings-content">
								<div class="earnings-amount">
									<span class="amount">{{ formatConvertedCompact(dashboardStats.totalEarnings) }}</span>
								</div>
								<p class="earnings-label">Total Earnings</p>
								<div class="earnings-wallet-pill">
									<v-icon name="hi-credit-card" scale="0.8" />
									<span>Wallet: {{ formatConvertedCompact(dashboardStats.walletBalance) }}</span>
								</div>
								<div class="earnings-stats">
									<div class="earnings-stat">
										<span class="earnings-stat-value">{{ dashboardStats.completedThisMonth }}</span>
										<span class="earnings-stat-label">Consultations</span>
									</div>
									<div class="earnings-stat">
										<span class="earnings-stat-value">{{ dashboardStats.pendingFollowUps }}</span>
										<span class="earnings-stat-label">Follow-ups</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Activity + Alerts Row -->
					<div class="grid-row grid-row--lower">
						<!-- Recent Activity -->
						<div class="bento-card activity-card">
							<div class="card-header">
								<h3>
									<v-icon name="hi-clock" scale="0.9" />
									Recent Activity
								</h3>
							</div>
							<div class="card-content">
								<div v-if="dashboardStats.recentActivity.length > 0" class="activity-feed">
									<div
										v-for="activity in dashboardStats.recentActivity.slice(0, 5)"
										:key="activity.referenceId"
										class="activity-item"
									>
										<div class="activity-icon" :class="getActivityType(activity.type)">
											<v-icon :name="getActivityIcon(activity.type)" scale="0.9" />
										</div>
										<div class="activity-content">
											<p class="activity-title">{{ activity.title }}</p>
											<p class="activity-desc" v-if="activity.description">{{ activity.description }}</p>
											<span class="activity-time">{{ formatRelativeTime(activity.date) }}</span>
										</div>
									</div>
								</div>
								<div v-else class="empty-state small">
									<p>No recent activity</p>
								</div>
							</div>
						</div>

						<!-- Right Stack -->
						<div class="right-stack">
							<!-- Alerts -->
							<div class="bento-card alerts-card" v-if="computedAlerts.length > 0">
								<div class="card-header">
									<h3>
										<v-icon name="hi-bell" scale="0.9" />
										Alerts
									</h3>
									<span class="alert-badge">{{ computedAlerts.length }}</span>
								</div>
								<div class="card-content">
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
											<div class="alert-info">
												<span class="alert-title">{{ alert.title }}</span>
												<span class="alert-message">{{ alert.message }}</span>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- No Alerts / Tip -->
							<div v-else class="bento-card tip-card">
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

							<!-- Performance Summary -->
							<div class="bento-card performance-card">
								<div class="card-header">
									<h3>
										<v-icon name="hi-chart-bar" scale="0.9" />
										This Month
									</h3>
								</div>
								<div class="card-content">
									<div class="performance-grid">
										<div class="performance-item">
											<span class="perf-value">{{ dashboardStats.completedThisMonth }}</span>
											<span class="perf-label">Completed</span>
										</div>
										<div class="performance-item">
											<span class="perf-value">{{ dashboardStats.missedThisMonth }}</span>
											<span class="perf-label">Missed</span>
										</div>
										<div class="performance-item">
											<span class="perf-value">{{ dashboardStats.pendingFollowUps }}</span>
											<span class="perf-label">Follow-ups</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</template>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { formatDistanceToNow } from 'date-fns';
import { useCurrency } from '@/composables/useCurrency';
import { useAppointments } from './composables/useAppointments';

const router = useRouter();
const store = useStore();
const { format: formatCurrency, formatCompact, formatConvertedCompact, symbol } = useCurrency();
const { dashboardStats, isLoading, fetchDashboard } = useAppointments();

const dismissedGreeting = ref(false);
const hoveredBar = ref(null);
const weekOffset = ref(0);

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

// Time greeting
function getTimeGreeting() {
	const hour = new Date().getHours();
	if (hour < 12) return 'Good Morning';
	if (hour < 17) return 'Good Afternoon';
	return 'Good Evening';
}

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

const weekDateRange = computed(() => {
	const { start, end } = getWeekDates(weekOffset.value);
	const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	return `${startStr} - ${endStr}`;
});

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

function previousWeek() {
	weekOffset.value--;
}

function nextWeek() {
	weekOffset.value++;
}

function goToCurrentWeek() {
	weekOffset.value = 0;
}

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

// formatCurrency and formatCompact are provided by useCurrency composable

function getBarHeight(value) {
	const max = Math.max(...currentWeekData.value.map(d => Math.max(d.scheduled, d.completed)), 1);
	return (value / max) * 100;
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

<style lang="scss" scoped>
// Design Tokens (pharmacy design system)
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.6);
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

// Page Container
.dashboard-page {
	width: 100%;
	min-height: 100vh;
}

// Mobile Header
.mobile-header {
	display: none;
	position: sticky;
	top: 0;
	z-index: 100;
	padding: 12px 16px;
	background: white;
	align-items: center;
	justify-content: space-between;
	border-bottom: 1px solid #F1F5F9;

	@media (max-width: 768px) {
		display: flex;
	}

	.menu-btn, .header-action-btn {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		border: none;
		background: $bg;
		color: $slate;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;

		&:active { background: #E2E8F0; }
	}

	.header-logo {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 16px;
		font-weight: 600;
		color: $navy;

		svg { color: $sky-dark; }
	}
}

// Page Body
.page-body {
	max-width: 1400px;
	margin: 0 auto;
	padding: 24px 32px 100px;

	@media (max-width: 768px) {
		padding: 16px 16px 120px;
	}
}

// Loading State
.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 60vh;
	gap: 16px;

	.loading-spinner {
		position: relative;
		width: 64px;
		height: 64px;

		.spinner-ring {
			position: absolute;
			inset: 0;
			border: 3px solid $sky-light;
			border-top-color: $sky;
			border-radius: 50%;
			animation: spin 1s linear infinite;
		}

		.spinner-icon {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			color: $sky;
		}
	}

	p {
		color: $gray;
		font-size: 14px;
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

// ============================================
// HERO SECTION
// ============================================
.hero {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 32px;
	padding: 48px 40px 56px;
	background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
	border-radius: 28px;
	position: relative;
	overflow: visible;
	min-height: 420px;
	margin-bottom: 24px;
	box-shadow:
		0 20px 60px rgba(2, 136, 209, 0.3),
		0 0 0 1px rgba(255, 255, 255, 0.1) inset;

	@media (max-width: 768px) {
		display: flex;
		flex-direction: column;
		padding: 28px 20px 24px;
		gap: 0;
		text-align: center;
		min-height: unset;
		border-radius: 20px;
		margin-bottom: 16px;
	}
}

.hero__content {
	display: flex;
	flex-direction: column;
	justify-content: center;
	z-index: 2;

	@media (max-width: 768px) {
		width: 100%;
		align-items: center;
	}
}

.hero__badge {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	background: rgba(255, 255, 255, 0.15);
	backdrop-filter: blur(10px);
	border-radius: 24px;
	width: fit-content;
	margin-bottom: 20px;
	position: relative;

	@media (max-width: 768px) {
		margin: 0 auto 16px;
	}

	.badge-pulse {
		position: absolute;
		left: 12px;
		width: 8px;
		height: 8px;
		background: $emerald;
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;

		&::after {
			content: '';
			position: absolute;
			inset: -4px;
			background: rgba($emerald, 0.4);
			border-radius: 50%;
			animation: pulse-ring 2s ease-out infinite;
		}
	}

	svg {
		width: 16px;
		height: 16px;
		color: white;
		margin-left: 12px;
	}

	span {
		font-size: 13px;
		font-weight: 600;
		color: white;
		letter-spacing: 0.3px;
	}
}

.hero__title {
	font-size: 48px;
	font-weight: 800;
	color: white;
	line-height: 1.1;
	margin: 0 0 16px;
	letter-spacing: -1px;

	@media (max-width: 768px) {
		font-size: 32px;
		margin: 0 0 12px;
		br { display: none; }
	}

	.hero__title-accent {
		background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
}

.hero__subtitle {
	font-size: 18px;
	color: white;
	line-height: 1.6;
	margin: 0 0 24px;
	max-width: 400px;
	opacity: 0.95;

	@media (max-width: 768px) {
		font-size: 15px;
		max-width: 100%;
		margin: 0 0 20px;
	}
}

.hero__stats {
	display: flex;
	align-items: center;
	gap: 20px;
	padding: 16px 20px;
	background: rgba(255, 255, 255, 0.1);
	backdrop-filter: blur(10px);
	border-radius: 16px;
	width: fit-content;

	@media (max-width: 768px) {
		width: 100%;
		justify-content: space-around;
		padding: 16px;
		gap: 8px;
	}
}

.hero-stat {
	text-align: center;
	flex: 1;

	&__value {
		display: block;
		font-size: 24px;
		font-weight: 700;
		color: white;
		line-height: 1;

		@media (max-width: 768px) { font-size: 22px; }

		&--warning { color: $amber-light; }
		&--success { color: $emerald-light; }
		&--danger { color: $rose-light; }
	}

	&__label {
		display: block;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	&__divider {
		width: 1px;
		height: 32px;
		background: rgba(255, 255, 255, 0.2);
		flex-shrink: 0;
	}
}

// Hero Visual
.hero__visual {
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;

	@media (max-width: 768px) {
		display: none;
	}
}

.dashboard-orb {
	position: relative;
	width: 200px;
	height: 200px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.orb-ring {
	position: absolute;
	border-radius: 50%;
	border: 2px solid rgba(255, 255, 255, 0.2);

	&--1 { width: 100%; height: 100%; animation: spin-slow 20s linear infinite; }
	&--2 { width: 80%; height: 80%; animation: spin-slow 15s linear infinite reverse; }
	&--3 { width: 60%; height: 60%; animation: spin-slow 10s linear infinite; }
}

.orb-core {
	width: 100px;
	height: 100px;
	background: rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(20px);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow:
		0 0 40px rgba(255, 255, 255, 0.3),
		0 0 80px rgba(79, 195, 247, 0.3);
	animation: pulse-glow 3s ease-in-out infinite;

	svg { width: 48px; height: 48px; color: white; }
}

.floating-icons {
	position: absolute;
	inset: 0;
	pointer-events: none;
}

.float-icon {
	position: absolute;
	width: 44px;
	height: 44px;
	background: rgba(255, 255, 255, 0.15);
	backdrop-filter: blur(10px);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	animation: float 3s ease-in-out infinite;

	svg { width: 20px; height: 20px; color: white; }

	&--1 { top: 10%; right: 10%; animation-delay: 0s; }
	&--2 { bottom: 20%; right: 5%; animation-delay: 1s; }
	&--3 { bottom: 10%; left: 10%; animation-delay: 2s; }
}

// Animations
@keyframes pulse {
	0%, 100% { transform: scale(1); opacity: 1; }
	50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes pulse-ring {
	0% { transform: scale(1); opacity: 0.8; }
	100% { transform: scale(2.5); opacity: 0; }
}

@keyframes pulse-glow {
	0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
	50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}

@keyframes spin-slow {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

@keyframes float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-10px); }
}

// ============================================
// BENTO GRID
// ============================================
.bento-grid {
	display: flex;
	flex-direction: column;
	gap: 20px;

	@media (max-width: 768px) { gap: 16px; }
}

.bento-card {
	@include glass-card;
	border-radius: 20px;
	padding: 20px;

	@media (max-width: 768px) {
		padding: 16px;
		border-radius: 16px;
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
			display: flex;
			align-items: center;
			gap: 8px;

			svg { color: $sky; }
		}

		.view-all {
			display: flex;
			align-items: center;
			gap: 4px;
			font-size: 13px;
			color: $sky-dark;
			text-decoration: none;
			font-weight: 500;
			background: none;
			border: none;
			cursor: pointer;

			&:hover { color: $sky-darker; }
		}
	}
}

// ============================================
// STATS ROW
// ============================================
.stats-row {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16px;

	@media (max-width: 768px) { grid-template-columns: repeat(2, 1fr); gap: 12px; }
	@media (max-width: 480px) { grid-template-columns: 1fr; }
}

.stat-card {
	@include glass-card;
	border-radius: 20px;
	padding: 20px;
	display: flex;
	align-items: center;
	gap: 16px;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
	}

	@media (max-width: 768px) { padding: 16px; border-radius: 16px; }
}

.stat-icon {
	width: 52px;
	height: 52px;
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;

	@media (max-width: 768px) { width: 46px; height: 46px; border-radius: 12px; }

	&.sky { background: $sky-light; color: $sky-dark; }
	&.amber { background: $amber-light; color: $amber; }
	&.emerald { background: $emerald-light; color: $emerald; }
	&.violet { background: $violet-light; color: $violet; }
	&.rose { background: $rose-light; color: $rose; }
	&.gray { background: #F1F5F9; color: $gray; }
}

.stat-info {
	flex: 1;
	min-width: 0;

	.stat-value {
		display: block;
		font-size: 24px;
		font-weight: 700;
		color: $navy;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;

		@media (max-width: 768px) { font-size: 20px; }
	}

	.stat-label {
		display: block;
		font-size: 14px;
		font-weight: 500;
		color: $slate;
	}

	.stat-sub {
		display: block;
		font-size: 12px;
		color: $gray;
	}
}

// ============================================
// QUICK ACTIONS CARD
// ============================================
.actions-card {
	.actions-row {
		display: flex;
		gap: 12px;

		@media (max-width: 768px) {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 10px;
		}

		@media (max-width: 480px) {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.action-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 20px 16px;
		background: $bg;
		border: 1px solid #E2E8F0;
		border-radius: 14px;
		cursor: pointer;
		transition: all 0.2s;
		text-decoration: none;

		@media (max-width: 768px) {
			padding: 16px 12px;
			gap: 8px;
			border-radius: 12px;
		}

		&:hover {
			background: white;
			border-color: $sky;
			box-shadow: 0 4px 12px rgba($sky, 0.15);
			transform: translateY(-2px);
		}

		span {
			font-size: 13px;
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

		&.sky { background: $sky-light; color: $sky-dark; }
		&.emerald { background: $emerald-light; color: $emerald; }
		&.amber { background: $amber-light; color: $amber; }
		&.violet { background: $violet-light; color: $violet; }
		&.rose { background: $rose-light; color: $rose; }
		&.gray { background: #F1F5F9; color: $gray; }
	}
}

// ============================================
// AI BANNER
// ============================================
.ai-banner {
	display: flex;
	align-items: flex-start;
	gap: 16px;
	background: rgba(79, 195, 247, 0.08) !important;
	border-color: rgba(79, 195, 247, 0.2) !important;

	.ai-icon {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: white;
	}

	.ai-content {
		flex: 1;

		h4 {
			font-size: 11px;
			font-weight: 700;
			color: $sky-dark;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin: 0 0 4px;
		}

		p {
			margin: 0;
			font-size: 14px;
			color: $navy;
			line-height: 1.5;
		}
	}

	.ai-dismiss {
		width: 28px;
		height: 28px;
		border: none;
		background: rgba(255, 255, 255, 0.7);
		border-radius: 50%;
		color: $gray;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;

		&:hover { background: white; color: $navy; }
	}
}

// ============================================
// GRID ROWS
// ============================================
.grid-row {
	display: grid;
	gap: 20px;

	&--schedule {
		grid-template-columns: 1.5fr 1fr;

		@media (max-width: 768px) { grid-template-columns: 1fr; }
	}

	&--charts {
		grid-template-columns: 2fr 1fr;

		@media (max-width: 768px) { grid-template-columns: 1fr; }
	}

	&--lower {
		grid-template-columns: 1.5fr 1fr;

		@media (max-width: 768px) { grid-template-columns: 1fr; }
	}
}

.right-stack {
	display: flex;
	flex-direction: column;
	gap: 20px;
}

// ============================================
// SCHEDULE CARD
// ============================================
.schedule-card {
	.schedule-timeline {
		display: flex;
		flex-direction: column;
	}

	.timeline-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 12px 0;
		cursor: pointer;
		border-radius: 12px;
		transition: background 0.2s;

		&:hover { background: rgba($sky, 0.04); }
	}

	.timeline-time {
		width: 60px;
		flex-shrink: 0;
		font-size: 13px;
		font-weight: 600;
		color: $navy;
		text-align: right;
		padding-top: 4px;
	}

	.timeline-marker {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding-top: 6px;

		.marker-dot {
			width: 10px;
			height: 10px;
			border-radius: 50%;
			background: $sky;
			flex-shrink: 0;

			&.open, &.confirmed { background: $emerald; }
			&.completed { background: $sky; }
			&.missed, &.no-show { background: $rose; }
			&.ongoing { background: $amber; }
		}

		.marker-line {
			width: 2px;
			height: 32px;
			background: #E2E8F0;
		}
	}

	.timeline-content {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.patient-info {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.patient-avatar-sm {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		flex-shrink: 0;
		overflow: hidden;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}

		.avatar-initials {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			background: $sky-light;
			color: $sky-dark;
			font-size: 12px;
			font-weight: 600;
		}
	}

	.patient-details {
		display: flex;
		flex-direction: column;
		min-width: 0;

		.patient-name {
			font-size: 14px;
			font-weight: 600;
			color: $navy;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.appointment-type {
			font-size: 12px;
			color: $gray;
		}
	}

	.timeline-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.timeline-badge {
		display: inline-flex;
		padding: 3px 8px;
		border-radius: 20px;
		font-size: 11px;
		font-weight: 600;
		text-transform: capitalize;
		background: #F1F5F9;
		color: $gray;

		&.open, &.confirmed { background: $emerald-light; color: $emerald; }
		&.completed { background: $sky-light; color: $sky-dark; }
		&.missed, &.no-show { background: $rose-light; color: $rose; }
		&.ongoing { background: $amber-light; color: $amber; }
	}

	.join-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 12px;
		background: linear-gradient(135deg, $emerald 0%, darken($emerald, 10%) 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba($emerald, 0.3);
		}
	}
}

// ============================================
// UPCOMING CARD
// ============================================
.upcoming-card {
	.appointments-list {
		display: flex;
		flex-direction: column;
	}

	.appointment-item {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 10px 0;
		cursor: pointer;
		border-radius: 12px;
		transition: background 0.2s;

		&:hover { background: rgba($sky, 0.04); }
	}

	.appointment-date-block {
		width: 44px;
		height: 44px;
		background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		.date-day {
			font-size: 16px;
			font-weight: 700;
			color: white;
			line-height: 1;
		}

		.date-month {
			font-size: 10px;
			color: rgba(255, 255, 255, 0.85);
			text-transform: uppercase;
		}
	}

	.appointment-details {
		flex: 1;
		min-width: 0;

		.patient-name {
			display: block;
			font-size: 14px;
			font-weight: 600;
			color: $navy;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.appointment-meta {
			display: flex;
			align-items: center;
			gap: 12px;
			margin-top: 2px;

			.meta-time {
				display: flex;
				align-items: center;
				gap: 4px;
				font-size: 12px;
				color: $gray;
			}

			.meta-type {
				font-size: 12px;
				color: $light-gray;
			}
		}
	}

	.item-chevron {
		color: $light-gray;
		flex-shrink: 0;
	}
}

// ============================================
// CHART CARD
// ============================================
.chart-card {
	.week-nav {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.week-nav-btn {
		width: 28px;
		height: 28px;
		border: 1px solid #E2E8F0;
		border-radius: 6px;
		background: white;
		color: $gray;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			border-color: $sky;
			color: $sky;
			background: $sky-light;
		}
	}

	.week-range {
		font-size: 12px;
		color: $gray;
		font-weight: 500;
	}

	.week-today-btn {
		padding: 4px 10px;
		font-size: 11px;
		font-weight: 600;
		border: 1px solid $sky;
		border-radius: 6px;
		background: $sky-light;
		color: $sky-dark;
		cursor: pointer;

		&:hover { background: $sky; color: white; }
	}

	.bar-chart {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		height: 140px;
		gap: 8px;
		padding-bottom: 24px;
	}

	.chart-bar-group {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
		position: relative;
		cursor: pointer;
		transition: transform 0.2s;

		&.is-hovered {
			transform: scale(1.05);
		}
	}

	.bar-tooltip {
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 8px;
		z-index: 10;

		.tooltip-content {
			background: $navy;
			color: white;
			padding: 10px 14px;
			border-radius: 8px;
			font-size: 11px;
			white-space: nowrap;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

			&::after {
				content: '';
				position: absolute;
				top: 100%;
				left: 50%;
				transform: translateX(-50%);
				border: 5px solid transparent;
				border-top-color: $navy;
			}
		}

		.tooltip-day {
			display: block;
			font-weight: 600;
			margin-bottom: 6px;
			text-align: center;
		}

		.tooltip-row {
			display: flex;
			align-items: center;
			gap: 6px;
			margin-top: 4px;
		}

		.tooltip-dot {
			width: 6px;
			height: 6px;
			border-radius: 50%;

			&.scheduled { background: $sky-light; }
			&.completed { background: $sky; }
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
		background: #F1F5F9;
		border-radius: 6px;
		overflow: hidden;
	}

	.bar {
		width: 100%;
		border-radius: 6px;
		transition: height 0.3s ease;
		min-height: 4px;

		&.scheduled { background: $sky-light; }
		&.completed { background: linear-gradient(135deg, $sky 0%, $sky-dark 100%); }
	}

	.bar-label {
		font-size: 10px;
		color: $light-gray;
		margin-top: 6px;
		font-weight: 500;
	}

	.chart-legend {
		display: flex;
		justify-content: center;
		gap: 20px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid #F1F5F9;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: $gray;
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;

		&.scheduled { background: $sky-light; }
		&.completed { background: $sky; }
	}
}

// ============================================
// EARNINGS CARD
// ============================================
.earnings-card {
	.earnings-content {
		text-align: center;
		padding-top: 8px;
	}

	.earnings-amount {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		margin-bottom: 4px;

		.currency {
			font-size: 16px;
			font-weight: 600;
			color: $gray;
			margin-right: 2px;
		}

		.amount {
			font-size: 32px;
			font-weight: 800;
			color: $navy;
			line-height: 1;
		}
	}

	.earnings-label {
		font-size: 13px;
		color: $gray;
		margin: 0 0 12px;
	}

	.earnings-wallet-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: #F1F5F9;
		border-radius: 20px;
		font-size: 12px;
		color: $slate;
		font-weight: 500;
		margin-bottom: 16px;
	}

	.earnings-stats {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		padding-top: 16px;
		border-top: 1px solid #F1F5F9;
	}

	.earnings-stat {
		text-align: center;

		&-value {
			display: block;
			font-size: 20px;
			font-weight: 700;
			color: $navy;
		}

		&-label {
			font-size: 11px;
			color: $gray;
		}
	}
}

// ============================================
// ACTIVITY CARD
// ============================================
.activity-card {
	.activity-feed {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.activity-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}

	.activity-icon {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		&.booked { background: $emerald-light; color: $emerald; }
		&.completed { background: $sky-light; color: $sky-dark; }
		&.cancelled { background: $rose-light; color: $rose; }
		&.prescription { background: $violet-light; color: $violet; }
		&.note { background: $amber-light; color: $amber; }
		&.default { background: #F1F5F9; color: $gray; }
	}

	.activity-content {
		flex: 1;

		.activity-title {
			font-size: 13px;
			font-weight: 500;
			color: $navy;
			margin: 0;
			line-height: 1.4;
		}

		.activity-desc {
			font-size: 12px;
			color: $gray;
			margin: 2px 0 0;
		}

		.activity-time {
			font-size: 11px;
			color: $light-gray;
		}
	}
}

// ============================================
// ALERTS CARD
// ============================================
.alerts-card {
	.alert-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		background: $amber;
		color: white;
		font-size: 11px;
		font-weight: 700;
		border-radius: 20px;
	}

	.alerts-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.alert-item {
		display: flex;
		gap: 10px;
		padding: 12px;
		border-radius: 12px;

		&.warning { background: $amber-light; }
		&.critical { background: $rose-light; }
		&.info { background: $sky-light; }

		.alert-icon {
			flex-shrink: 0;
			margin-top: 2px;
		}

		.alert-info {
			display: flex;
			flex-direction: column;
			gap: 2px;
		}

		.alert-title {
			font-size: 12px;
			font-weight: 600;
			color: $navy;
		}

		.alert-message {
			font-size: 11px;
			color: $gray;
		}
	}
}

// ============================================
// TIP CARD
// ============================================
.tip-card {
	display: flex;
	gap: 14px;
	background: rgba(255, 249, 235, 0.9) !important;
	border-color: rgba($amber, 0.3) !important;

	.tip-icon {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		background: $amber-light;
		color: $amber;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.tip-content {
		h4 {
			font-size: 12px;
			font-weight: 700;
			color: darken($amber, 20%);
			margin: 0 0 4px;
		}

		p {
			font-size: 13px;
			color: $slate;
			margin: 0;
			line-height: 1.5;
		}
	}
}

// ============================================
// PERFORMANCE CARD
// ============================================
.performance-card {
	.performance-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		text-align: center;
	}

	.performance-item {
		padding: 12px 8px;
		background: $bg;
		border-radius: 12px;

		.perf-value {
			display: block;
			font-size: 20px;
			font-weight: 700;
			color: $navy;
		}

		.perf-label {
			font-size: 11px;
			color: $gray;
		}
	}
}

// ============================================
// EMPTY STATE
// ============================================
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 40px 20px;
	text-align: center;

	&.small {
		padding: 24px 16px;

		p {
			margin: 0;
			font-size: 13px;
			color: $light-gray;
		}
	}

	.empty-icon {
		width: 64px;
		height: 64px;
		background: $sky-light;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: $sky;
		margin-bottom: 16px;
	}

	h3 {
		font-size: 16px;
		font-weight: 600;
		color: $navy;
		margin: 0 0 6px;
	}

	p {
		color: $gray;
		margin: 0 0 20px;
		font-size: 14px;
	}

	.empty-action {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 20px;
		background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
		color: white;
		border: none;
		border-radius: 10px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 14px rgba($sky, 0.3);
		}
	}
}
</style>
