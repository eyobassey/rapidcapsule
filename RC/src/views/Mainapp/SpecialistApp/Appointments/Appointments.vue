<!--
  ============================================================================
  DEPRECATED - Appointments V1
  ============================================================================
  This component and the entire /Appointments folder has been deprecated.

  Please use Appointments V2 located at:
  /views/Mainapp/SpecialistApp/SpecialistAppointments/

  Route: /app/specialist/appointments-v2

  V2 Features:
  - Modern 6-step appointment creation wizard
  - Better mobile responsiveness
  - Improved patient selection (existing, platform search, manual entry)
  - Payment source options (specialist wallet, patient wallet, card)
  - Enhanced scheduling with time slots

  Deprecated: February 2026
  ============================================================================
-->
<template>
	<div class="page-content">
		<top-bar showButtons type="title-only" title="Appointments" @open-side-nav="$emit('openSideNav')" />

		<div class="page-content__body">
			<!-- Hero Banner -->
			<div class="hero-banner">
				<div class="hero-content">
					<div class="hero-text">
						<h1 class="hero-title">Patient Appointments</h1>
						<p class="hero-subtitle">Manage your consultation schedule and patient care</p>
					</div>
				</div>

				<div class="hero-stats">
					<div class="stat-item">
						<span class="stat-value">{{ stats.today }}</span>
						<span class="stat-label">Today</span>
					</div>
					<div class="stat-divider"></div>
					<div class="stat-item">
						<span class="stat-value">{{ stats.thisWeek }}</span>
						<span class="stat-label">This Week</span>
					</div>
					<div class="stat-divider"></div>
					<div class="stat-item">
						<span class="stat-value">{{ stats.pending }}</span>
						<span class="stat-label">Pending</span>
					</div>
					<div class="stat-divider"></div>
					<div class="stat-item rating">
						<span class="stat-value">
							<v-icon name="bi-star-fill" scale="0.7" class="rating-icon" />
							{{ stats.avgRating }}
						</span>
						<span class="stat-label">Avg Rating</span>
					</div>
				</div>
			</div>

			<!-- Tabs Navigation -->
			<div class="tabs-navigation">
				<button
					v-for="tab in tabs"
					:key="tab.value"
					class="tab-btn"
					:class="{ active: currentTab === tab.value }"
					@click="onChooseCurrentTab(tab.value)"
				>
					<v-icon :name="tab.icon" scale="0.9" />
					<span>{{ tab.title }}</span>
					<span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
				</button>
			</div>

			<!-- Content Area -->
			<div class="content-area">
				<loader v-if="isLoading" :useOverlay="false" :style="{ backgroundColor: 'transparent' }" />

				<div v-else class="appointments-list">
					<template v-if="Object.keys(appointmentItems).length">
						<div
							v-for="(appointments, timestamp, index) in appointmentItems"
							:key="timestamp + index"
							class="date-group"
						>
							<div class="date-header">
								<v-icon name="hi-calendar" scale="0.9" class="date-icon" />
								<span class="date-text">{{ format(new Date(timestamp), 'EEEE, MMMM dd, yyyy') }}</span>
								<span class="appointments-count">{{ appointments.length }} appointment{{ appointments.length > 1 ? 's' : '' }}</span>
							</div>

							<div class="appointments-cards">
								<div
									v-for="appointment in appointments"
									:key="appointment._id"
									class="appointment-card"
									@click="goToDetails(appointment)"
								>
									<div class="card-main">
										<div class="patient-section">
											<div class="patient-avatar">
												<rc-avatar
													size="md"
													:firstName="appointment.patient?.profile?.first_name || ''"
													:lastName="appointment.patient?.profile?.last_name || ''"
													:modelValue="appointment.patient?.profile?.profile_photo || appointment.patient?.profile?.profile_image"
												/>
											</div>
											<div class="patient-info">
												<h3 class="patient-name">{{ getPatientName(appointment) }}</h3>
												<p class="appointment-category">{{ appointment.category }}</p>
												<div class="appointment-meta">
													<span class="meeting-type" :class="getMeetingTypeClass(appointment.appointment_type)">
														<v-icon
															:name="appointment.appointment_type === 'video' ? 'hi-video-camera' : 'hi-phone'"
															scale="0.7"
														/>
														{{ formatMeetingType(appointment.appointment_type) }}
													</span>
													<!-- Health Data Badge -->
													<span
														v-if="appointment.patient_has_health_data"
														class="health-badge available"
													>
														<v-icon name="hi-clipboard-check" scale="0.7" />
														Health Data
													</span>
													<span v-else class="health-badge none">
														<v-icon name="hi-clipboard-list" scale="0.7" />
														No Health Data
													</span>
												</div>
											</div>
										</div>

										<div class="time-section">
											<div class="time-display">
												<v-icon name="hi-clock" scale="0.85" class="time-icon" />
												<div class="time-info">
													<span class="time-main">{{ format(new Date(appointment.start_time), 'h:mm a') }}</span>
													<span class="time-duration">{{ appointment.duration || 30 }} min</span>
												</div>
											</div>
										</div>
									</div>

									<div class="card-footer">
										<div class="footer-left">
											<span v-if="isToday(appointment.start_time)" class="today-badge">
												<v-icon name="hi-lightning-bolt" scale="0.7" />
												Today
											</span>
											<span v-if="appointment.rating?.score" class="rating-badge">
												<v-icon name="bi-star-fill" scale="0.65" />
												{{ appointment.rating.score }}/5
											</span>
										</div>
										<div class="footer-right">
											<button class="view-btn">
												<span>View Details</span>
												<v-icon name="hi-chevron-right" scale="0.85" />
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</template>

					<template v-else>
						<div class="empty-state">
							<div class="empty-illustration" :class="{ 'empty-success': currentTab === 'missed' }">
								<v-icon :name="currentTab === 'missed' ? 'hi-check-circle' : 'hi-calendar'" scale="4" class="empty-icon" />
							</div>
							<h2 class="empty-title">
								{{ currentTab === 'upcoming' ? 'No Upcoming Appointments' : currentTab === 'missed' ? 'No Missed Appointments' : 'No Past Appointments' }}
							</h2>
							<p class="empty-description">
								{{ currentTab === 'upcoming'
									? 'Your upcoming patient appointments will appear here once booked.'
									: currentTab === 'missed'
										? 'Great! You have no missed appointments.'
										: 'Your completed appointments will be shown here.'
								}}
							</p>
						</div>
					</template>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { groupBy } from "lodash";
import { format, isToday as dateFnsIsToday, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ref, inject, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader";
import RcAvatar from "@/components/RCAvatar";

const $http = inject('$_HTTP');
const router = useRouter();
defineEmits(["openSideNav"]);

const appointmentItems = ref({});
const allAppointments = ref([]);
const isLoading = ref(false);
const currentTab = ref("upcoming");

const tabs = computed(() => [
	{
		title: "Upcoming",
		value: "upcoming",
		icon: "hi-calendar",
		count: stats.value.upcoming
	},
	{
		title: "History",
		value: "history",
		icon: "hi-clock",
		count: stats.value.completed
	},
	{
		title: "Missed",
		value: "missed",
		icon: "hi-exclamation-circle",
		count: stats.value.missed
	},
]);

const stats = ref({
	today: 0,
	thisWeek: 0,
	pending: 0,
	upcoming: 0,
	completed: 0,
	missed: 0,
	avgRating: '0.0'
});

onMounted(() => {
	getUserAppointments({ status: 'OPEN' });
	fetchStats();
});

const getPatientName = (appointment) => {
	const patient = appointment.patient;
	if (patient?.profile?.first_name || patient?.profile?.last_name) {
		return `${patient.profile.first_name || ''} ${patient.profile.last_name || ''}`.trim();
	}
	return patient?.full_name || 'Patient';
};

const formatMeetingType = (type) => {
	if (!type) return 'Video';
	return type.charAt(0).toUpperCase() + type.slice(1);
};

const getMeetingTypeClass = (type) => {
	return type === 'video' ? 'type-video' : 'type-audio';
};

const isToday = (dateString) => {
	return dateFnsIsToday(new Date(dateString));
};

const goToDetails = (appointment) => {
	router.push({
		name: 'SpecialistAppointmentDetails',
		params: { id: appointment._id },
		query: { appointment_status: currentTab.value }
	});
};

const onChooseCurrentTab = (current) => {
	currentTab.value = current;
	if (current === 'upcoming') {
		getUserAppointments({ status: 'OPEN' });
	} else if (current === 'missed') {
		getUserAppointments({ status: 'MISSED' });
	} else {
		getUserAppointments({ status: 'COMPLETED' });
	}
};

async function getUserAppointments(payload) {
	isLoading.value = true;
	try {
		const { data } = await $http.$_getSpecialistAppointments(payload);
		allAppointments.value = data.data || [];

		// Group by date
		appointmentItems.value = groupBy(
			allAppointments.value.map(item => ({
				...item,
				groupDate: format(new Date(item.start_time), 'yyyy-MM-dd')
			})),
			'groupDate'
		);
	} catch (error) {
		console.error('Error fetching appointments:', error);
		appointmentItems.value = {};
	} finally {
		isLoading.value = false;
	}
}

async function fetchStats() {
	try {
		// Fetch upcoming appointments for stats
		const upcomingResponse = await $http.$_getSpecialistAppointments({ status: 'OPEN' });
		const upcoming = upcomingResponse?.data?.data || [];

		// Fetch completed appointments for stats
		const completedResponse = await $http.$_getSpecialistAppointments({ status: 'COMPLETED' });
		const completed = completedResponse?.data?.data || [];

		// Fetch missed appointments for stats
		const missedResponse = await $http.$_getSpecialistAppointments({ status: 'MISSED' });
		const missed = missedResponse?.data?.data || [];

		const today = new Date();
		const weekStart = startOfWeek(today);
		const weekEnd = endOfWeek(today);

		// Calculate stats
		const todayCount = upcoming.filter(a => dateFnsIsToday(new Date(a.start_time))).length;
		const thisWeekCount = upcoming.filter(a =>
			isWithinInterval(new Date(a.start_time), { start: weekStart, end: weekEnd })
		).length;

		// Calculate average rating from completed appointments
		const ratingsSum = completed.reduce((sum, a) => sum + (a.rating?.score || 0), 0);
		const ratingsCount = completed.filter(a => a.rating?.score).length;
		const avgRating = ratingsCount > 0 ? (ratingsSum / ratingsCount).toFixed(1) : '0.0';

		stats.value = {
			today: todayCount,
			thisWeek: thisWeekCount,
			pending: upcoming.filter(a => a.status === 'PENDING').length,
			upcoming: upcoming.length,
			completed: completed.length,
			missed: missed.length,
			avgRating
		};
	} catch (error) {
		console.error('Error fetching stats:', error);
	}
}
</script>

<style scoped lang="scss">
.page-content {
	display: flex;
	flex-direction: column;
	gap: 0;
	width: 100%;
	height: 100%;
	padding: 0 256px;

	@include responsive(tab-portrait) {
		padding: 0;
	}

	@include responsive(phone) {
		padding: 0;
	}

	&__body {
		display: flex;
		flex-direction: column;
		gap: 0;
		width: 100%;
		height: 100%;
		overflow-y: auto;
		padding-bottom: 100px;

		&::-webkit-scrollbar {
			display: none;
		}
	}
}

// Hero Banner
.hero-banner {
	background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
	border-radius: $size-24;
	padding: $size-32 $size-48;
	margin: $size-24 $size-48 $size-24;
	color: white;
	box-shadow: 0 10px 40px rgba(14, 174, 196, 0.3);

	@media (max-width: 768px) {
		margin: $size-16;
		padding: $size-24;
		border-radius: $size-16;
	}
}

.hero-content {
	margin-bottom: $size-24;
}

.hero-text {
	display: flex;
	flex-direction: column;
	gap: $size-8;
}

.hero-title {
	font-size: $size-28;
	font-weight: $fw-bold;
	margin: 0;

	@media (max-width: 768px) {
		font-size: $size-22;
	}
}

.hero-subtitle {
	font-size: $size-16;
	opacity: 0.9;
	margin: 0;

	@media (max-width: 768px) {
		font-size: $size-14;
	}
}

.hero-stats {
	display: flex;
	align-items: center;
	gap: $size-24;
	padding-top: $size-20;
	border-top: 1px solid rgba(255, 255, 255, 0.2);

	@media (max-width: 768px) {
		gap: $size-12;
		flex-wrap: wrap;
		justify-content: center;
	}
}

.stat-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-4;

	&.rating .stat-value {
		display: flex;
		align-items: center;
		gap: $size-4;

		.rating-icon {
			color: #fbbf24;
		}
	}
}

.stat-value {
	font-size: $size-24;
	font-weight: $fw-bold;

	@media (max-width: 768px) {
		font-size: $size-20;
	}
}

.stat-label {
	font-size: $size-12;
	opacity: 0.8;
	text-transform: uppercase;
	letter-spacing: 0.5px;

	@media (max-width: 480px) {
		font-size: $size-10;
	}
}

.stat-divider {
	width: 1px;
	height: $size-32;
	background: rgba(255, 255, 255, 0.2);

	@media (max-width: 768px) {
		display: none;
	}
}

// Very small screens
@media (max-width: 480px) {
	.hero-banner {
		margin: $size-12;
		padding: $size-20 $size-16;
		border-radius: $size-12;
	}

	.hero-title {
		font-size: $size-18;
	}

	.hero-subtitle {
		font-size: $size-13;
	}

	.hero-stats {
		gap: $size-8;
		padding-top: $size-16;
	}

	.stat-item {
		min-width: calc(50% - $size-8);
		padding: $size-8;
		background: rgba(255, 255, 255, 0.1);
		border-radius: $size-8;
	}

	.stat-value {
		font-size: $size-16;
	}
}

// Tabs Navigation
.tabs-navigation {
	display: flex;
	gap: $size-12;
	padding: 0 $size-48;
	margin-bottom: $size-24;

	@media (max-width: 768px) {
		padding: 0 $size-16;
		gap: $size-8;
	}

	@media (max-width: 480px) {
		padding: 0 $size-12;
		gap: $size-6;
		margin-bottom: $size-16;
	}
}

.tab-btn {
	display: inline-flex;
	align-items: center;
	gap: $size-8;
	padding: $size-12 $size-20;
	border: none;
	border-radius: $size-24;
	background: white;
	color: $color-g-44;
	font-size: $size-14;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

	&:hover {
		color: #0EAEC4;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	&.active {
		background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
		color: white;
		box-shadow: 0 4px 16px rgba(14, 174, 196, 0.3);
	}

	.tab-count {
		background: rgba(0, 0, 0, 0.1);
		padding: 2px 8px;
		border-radius: 12px;
		font-size: $size-12;
	}

	&.active .tab-count {
		background: rgba(255, 255, 255, 0.2);
	}

	@media (max-width: 480px) {
		padding: $size-10 $size-14;
		font-size: $size-13;
		gap: $size-6;

		.tab-count {
			padding: 1px 6px;
			font-size: $size-10;
		}
	}
}

// Content Area
.content-area {
	padding: 0 $size-48;

	@media (max-width: 768px) {
		padding: 0 $size-16;
	}
}

.appointments-list {
	display: flex;
	flex-direction: column;
	gap: $size-32;
}

.date-group {
	display: flex;
	flex-direction: column;
	gap: $size-16;
}

.date-header {
	display: flex;
	align-items: center;
	gap: $size-10;
	padding: $size-10 $size-16;
	background: linear-gradient(135deg, rgba(14, 174, 196, 0.1) 0%, rgba(14, 174, 196, 0.05) 100%);
	border-radius: $size-12;
	border-left: 3px solid #0EAEC4;

	.date-icon {
		color: #0EAEC4;
	}

	.date-text {
		font-size: $size-16;
		font-weight: $fw-semi-bold;
		color: $color-g-21;
		flex: 1;
	}

	.appointments-count {
		font-size: $size-13;
		color: $color-g-44;
		background: white;
		padding: $size-4 $size-12;
		border-radius: $size-16;
	}
}

.appointments-cards {
	display: flex;
	flex-direction: column;
	gap: $size-16;
}

.appointment-card {
	background: white;
	border-radius: $size-16;
	padding: $size-24;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	transition: all 0.3s ease;
	border-left: 4px solid #0EAEC4;
	cursor: pointer;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
	}

	@media (max-width: 768px) {
		padding: $size-16;
		border-radius: $size-12;
	}
}

.card-main {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: $size-20;
	margin-bottom: $size-16;

	@media (max-width: 768px) {
		flex-direction: column;
		gap: $size-16;
	}
}

.patient-section {
	display: flex;
	align-items: flex-start;
	gap: $size-16;
	flex: 1;
}

.patient-avatar {
	flex-shrink: 0;
}

.patient-info {
	display: flex;
	flex-direction: column;
	gap: $size-6;
}

.patient-name {
	font-size: $size-18;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0;

	@media (max-width: 768px) {
		font-size: $size-16;
	}
}

.appointment-category {
	font-size: $size-14;
	color: $color-g-44;
	margin: 0;
}

.appointment-meta {
	display: flex;
	align-items: center;
	gap: $size-10;
	margin-top: $size-4;
	flex-wrap: wrap;
}

.meeting-type {
	display: inline-flex;
	align-items: center;
	gap: $size-4;
	padding: $size-4 $size-10;
	border-radius: $size-6;
	font-size: $size-12;
	font-weight: $fw-medium;

	&.type-video {
		background: rgba(14, 174, 196, 0.1);
		color: #0EAEC4;
	}

	&.type-audio {
		background: rgba(139, 92, 246, 0.1);
		color: #8b5cf6;
	}
}

.health-badge {
	display: inline-flex;
	align-items: center;
	gap: $size-4;
	padding: $size-4 $size-10;
	border-radius: $size-6;
	font-size: $size-12;
	font-weight: $fw-medium;

	&.available {
		background: #dcfce7;
		color: #16a34a;
	}

	&.none {
		background: #fef2f2;
		color: #ef4444;
	}
}

.time-section {
	flex-shrink: 0;

	@media (max-width: 768px) {
		width: 100%;
	}
}

.time-display {
	display: flex;
	align-items: center;
	gap: $size-10;
	padding: $size-12 $size-16;
	background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	border-radius: $size-10;

	.time-icon {
		color: #0EAEC4;
	}

	@media (max-width: 768px) {
		justify-content: center;
	}
}

.time-info {
	display: flex;
	flex-direction: column;
	gap: $size-2;
}

.time-main {
	font-size: $size-16;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
}

.time-duration {
	font-size: $size-12;
	color: $color-g-44;
}

.card-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-top: $size-16;
	border-top: 1px solid $color-g-90;
}

.today-badge {
	display: inline-flex;
	align-items: center;
	gap: $size-4;
	padding: $size-6 $size-12;
	background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
	color: white;
	font-size: $size-12;
	font-weight: $fw-semi-bold;
	border-radius: $size-6;
}

.rating-badge {
	display: inline-flex;
	align-items: center;
	gap: $size-4;
	padding: $size-4 $size-10;
	background: rgba(245, 158, 11, 0.1);
	color: #f59e0b;
	font-size: $size-12;
	font-weight: $fw-semi-bold;
	border-radius: $size-6;

	svg {
		color: #f59e0b;
	}
}

.view-btn {
	display: inline-flex;
	align-items: center;
	gap: $size-6;
	padding: $size-8 $size-16;
	background: transparent;
	border: none;
	color: #0EAEC4;
	font-size: $size-14;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;
	border-radius: $size-8;

	&:hover {
		background: rgba(14, 174, 196, 0.1);
	}
}

// Empty State
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $size-64 $size-32;
	text-align: center;
}

.empty-illustration {
	width: 120px;
	height: 120px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, rgba(14, 174, 196, 0.1) 0%, rgba(14, 174, 196, 0.05) 100%);
	border-radius: 50%;
	margin-bottom: $size-24;

	.empty-icon {
		color: #0EAEC4;
		opacity: 0.6;
	}

	&.empty-success {
		background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);

		.empty-icon {
			color: #10b981;
		}
	}
}

.empty-title {
	font-size: $size-24;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0 0 $size-12;
}

.empty-description {
	font-size: $size-16;
	color: $color-g-44;
	max-width: 400px;
	line-height: 1.6;
	margin: 0;
}
</style>
