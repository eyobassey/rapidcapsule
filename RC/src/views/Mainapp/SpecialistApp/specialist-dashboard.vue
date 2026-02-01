<template>
	<div class="page-content">
		<TopBar showButtons type="title-only" title="Dashboard" @open-side-nav="$emit('openSideNav')" />

		<!-- Skeleton Loading -->
		<div v-if="isLoading" class="page-content__body">
			<div class="dashboard-skeleton">
				<div class="skeleton-hero">
					<div class="skeleton-line greeting"></div>
					<div class="skeleton-line subtitle"></div>
					<div class="skeleton-stats">
						<div class="skeleton-stat" v-for="n in 3" :key="n"></div>
					</div>
				</div>
				<div class="skeleton-cards">
					<div class="skeleton-card" v-for="n in 4" :key="n"></div>
				</div>
				<div class="skeleton-sections">
					<div class="skeleton-section"></div>
					<div class="skeleton-section"></div>
				</div>
			</div>
		</div>

		<!-- Main Dashboard Content -->
		<div v-else class="page-content__body">
			<!-- Hero Section -->
			<div class="hero-section">
				<div class="hero-content">
					<div class="hero-greeting">
						<span class="greeting-badge">
							<v-icon name="hi-sparkles" scale="0.8" />
							{{ getTimeGreeting() }}
						</span>
						<h1 class="greeting-text">
							Welcome back, <span class="name-highlight">Dr. {{ dashboardData?.specialist?.firstName || 'Specialist' }}</span>
						</h1>
						<p class="greeting-subtitle">
							Here's your practice overview for today, {{ formatDate(new Date(), 'EEEE, MMMM d, yyyy') }}
						</p>
					</div>
					<div class="hero-today-stats">
						<div class="today-stat">
							<div class="stat-icon appointments">
								<v-icon name="hi-calendar" scale="1.2" />
							</div>
							<div class="stat-content">
								<span class="stat-value">{{ dashboardData?.today?.appointmentCount || 0 }}</span>
								<span class="stat-label">Today's Appointments</span>
							</div>
						</div>
						<div class="today-stat">
							<div class="stat-icon completed">
								<v-icon name="hi-check-circle" scale="1.2" />
							</div>
							<div class="stat-content">
								<span class="stat-value">{{ dashboardData?.today?.completedToday || 0 }}</span>
								<span class="stat-label">Completed</span>
							</div>
						</div>
						<div class="today-stat">
							<div class="stat-icon pending">
								<v-icon name="hi-clock" scale="1.2" />
							</div>
							<div class="stat-content">
								<span class="stat-value">{{ dashboardData?.today?.pendingToday || 0 }}</span>
								<span class="stat-label">Pending</span>
							</div>
						</div>
					</div>
				</div>
				<div class="hero-visual">
					<div class="rating-card" v-if="dashboardData?.specialist?.averageRating">
						<div class="rating-stars">
							<v-icon name="bi-star-fill" scale="1" class="star-icon" />
							<span class="rating-value">{{ dashboardData?.specialist?.averageRating?.toFixed(1) }}</span>
						</div>
						<span class="rating-label">{{ dashboardData?.specialist?.totalReviews || 0 }} reviews</span>
					</div>
				</div>
			</div>

			<!-- Stats Cards Row -->
			<div class="stats-row">
				<div class="stat-card patients" @click="navigateTo('/app/specialist/patients')">
					<div class="card-icon">
						<v-icon name="hi-user-group" scale="1.3" />
					</div>
					<div class="card-content">
						<span class="card-value">{{ dashboardData?.patientStats?.totalPatients || 0 }}</span>
						<span class="card-label">Total Patients</span>
						<span class="card-sublabel">{{ dashboardData?.patientStats?.thisMonthPatients || 0 }} this month</span>
					</div>
					<div class="card-arrow">
						<v-icon name="hi-arrow-right" scale="0.9" />
					</div>
				</div>

				<div class="stat-card appointments" @click="navigateTo('/app/specialist/specialist-appointments')">
					<div class="card-icon">
						<v-icon name="hi-calendar" scale="1.3" />
					</div>
					<div class="card-content">
						<span class="card-value">{{ dashboardData?.appointmentsData?.completedAppointments || 0 }}</span>
						<span class="card-label">Completed</span>
						<span class="card-sublabel">This month</span>
					</div>
					<div class="card-trend" :class="getCompletedTrend()">
						<v-icon :name="getCompletedTrend() === 'up' ? 'hi-trending-up' : 'hi-trending-down'" scale="0.8" />
						<span>{{ getCompletedPercentage() }}%</span>
					</div>
				</div>

				<div class="stat-card wallet" @click="navigateTo('/app/specialist/specialist-account')">
					<div class="card-icon">
						<v-icon name="bi-wallet2" scale="1.3" />
					</div>
					<div class="card-content">
						<span class="card-value">₦{{ formatCurrency(dashboardData?.wallet?.balance) }}</span>
						<span class="card-label">Wallet Balance</span>
						<span class="card-sublabel">₦{{ formatCurrency(dashboardData?.totalEarnings?.totalEarnings) }} total earned</span>
					</div>
					<div class="card-arrow">
						<v-icon name="hi-arrow-right" scale="0.9" />
					</div>
				</div>

				<div class="stat-card starred" @click="navigateTo('/app/specialist/patients/starred')">
					<div class="card-icon">
						<v-icon name="bi-star-fill" scale="1.3" />
					</div>
					<div class="card-content">
						<span class="card-value">{{ dashboardData?.patientStats?.starredPatients || 0 }}</span>
						<span class="card-label">Starred Patients</span>
						<span class="card-sublabel">Quick access</span>
					</div>
					<div class="card-arrow">
						<v-icon name="hi-arrow-right" scale="0.9" />
					</div>
				</div>
			</div>

			<!-- Quick Actions -->
			<div class="quick-actions-section">
				<h2 class="section-title">Quick Actions</h2>
				<div class="quick-actions-grid">
					<button class="quick-action" @click="navigateTo('/app/specialist/patients')">
						<div class="action-icon patients">
							<v-icon name="hi-users" scale="1.2" />
						</div>
						<span class="action-label">View Patients</span>
					</button>
					<button class="quick-action" @click="navigateTo('/app/specialist/specialist-appointments')">
						<div class="action-icon appointments">
							<v-icon name="hi-calendar" scale="1.2" />
						</div>
						<span class="action-label">Appointments</span>
					</button>
					<button class="quick-action" @click="navigateTo('/app/specialist/pharmacy/patients')">
						<div class="action-icon prescriptions">
							<v-icon name="ri-capsule-line" scale="1.2" />
						</div>
						<span class="action-label">Prescriptions</span>
					</button>
					<button class="quick-action" @click="navigateTo('/app/specialist/clinical-notes')">
						<div class="action-icon notes">
							<v-icon name="hi-document-text" scale="1.2" />
						</div>
						<span class="action-label">Clinical Notes</span>
					</button>
					<button class="quick-action" @click="openCreateAppointmentModal">
						<div class="action-icon create">
							<v-icon name="hi-plus" scale="1.2" />
						</div>
						<span class="action-label">New Appointment</span>
					</button>
					<button class="quick-action" @click="navigateTo('/app/specialist/specialist-account')">
						<div class="action-icon settings">
							<v-icon name="hi-cog" scale="1.2" />
						</div>
						<span class="action-label">Settings</span>
					</button>
				</div>
			</div>

			<!-- Main Content Grid -->
			<div class="main-content-grid">
				<!-- Left Column -->
				<div class="left-column">
					<!-- Today's Schedule -->
					<div class="content-card schedule-card">
						<div class="card-header">
							<h3 class="card-title">
								<v-icon name="hi-clock" scale="1" />
								Today's Schedule
							</h3>
							<button class="view-all-btn" @click="navigateTo('/app/specialist/specialist-appointments')">
								View All
								<v-icon name="hi-arrow-right" scale="0.8" />
							</button>
						</div>
						<div class="card-body">
							<div v-if="dashboardData?.today?.appointments?.length" class="schedule-timeline">
								<div
									v-for="apt in dashboardData.today.appointments"
									:key="apt._id"
									class="timeline-item"
									:class="{ completed: apt.status === 'COMPLETED', ongoing: apt.status === 'ONGOING' }"
									@click="onOpenAppointment(apt)"
								>
									<div class="timeline-time">
										{{ formatTime(apt.startTime) }}
									</div>
									<div class="timeline-marker">
										<div class="marker-dot"></div>
										<div class="marker-line"></div>
									</div>
									<div class="timeline-content">
										<div class="patient-info">
											<rc-avatar
												size="sm"
												:firstName="apt.patient?.firstName"
												:lastName="apt.patient?.lastName"
												:modelValue="apt.patient?.profileImage"
												borderless
											/>
											<div class="patient-details">
												<span class="patient-name">{{ apt.patient?.fullName || 'Patient' }}</span>
												<span class="appointment-type">{{ apt.appointmentType || 'Consultation' }}</span>
											</div>
										</div>
										<div class="timeline-status" :class="apt.status?.toLowerCase()">
											{{ apt.status }}
										</div>
									</div>
								</div>
							</div>
							<div v-else class="empty-state">
								<div class="empty-icon">
									<v-icon name="hi-calendar" scale="2" />
								</div>
								<p class="empty-text">No appointments scheduled for today</p>
								<button class="empty-action" @click="openCreateAppointmentModal">
									<v-icon name="hi-plus" scale="0.9" />
									Schedule Appointment
								</button>
							</div>
						</div>
					</div>

					<!-- Upcoming Appointments -->
					<div class="content-card upcoming-card">
						<div class="card-header">
							<h3 class="card-title">
								<v-icon name="hi-calendar" scale="1" />
								Upcoming Appointments
							</h3>
							<button class="view-all-btn" @click="navigateTo('/app/specialist/specialist-appointments')">
								View All
								<v-icon name="hi-arrow-right" scale="0.8" />
							</button>
						</div>
						<div class="card-body">
							<div v-if="dashboardData?.upcomingAppointments?.length" class="appointments-list">
								<div
									v-for="apt in dashboardData.upcomingAppointments"
									:key="apt._id"
									class="appointment-item"
									@click="onOpenAppointment(apt)"
								>
									<div class="appointment-date-block">
										<span class="date-day">{{ formatDate(apt.startTime, 'dd') }}</span>
										<span class="date-month">{{ formatDate(apt.startTime, 'MMM') }}</span>
									</div>
									<div class="appointment-details">
										<div class="appointment-patient">
											<rc-avatar
												size="xs"
												:firstName="apt.patient?.firstName"
												:lastName="apt.patient?.lastName"
												:modelValue="apt.patient?.profileImage"
												borderless
											/>
											<span class="patient-name">{{ apt.patient?.fullName || 'Patient' }}</span>
										</div>
										<div class="appointment-meta">
											<span class="meta-time">
												<v-icon name="hi-clock" scale="0.7" />
												{{ formatTime(apt.startTime) }}
											</span>
											<span class="meta-type">{{ apt.appointmentType || 'Consultation' }}</span>
										</div>
									</div>
									<div class="appointment-arrow">
										<v-icon name="hi-chevron-right" scale="0.9" />
									</div>
								</div>
							</div>
							<div v-else class="empty-state small">
								<p class="empty-text">No upcoming appointments</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Right Column -->
				<div class="right-column">
					<!-- Calendar Widget -->
					<div class="content-card calendar-card">
						<div class="card-header">
							<h3 class="card-title">
								<v-icon name="hi-calendar" scale="1" />
								Calendar
							</h3>
							<rc-iconbutton
								icon="icon-plus-solid"
								size="sm"
								@click="openCreateAppointmentModal"
								title="Create appointment"
							/>
						</div>
						<div class="card-body calendar-body">
							<rc-calendar
								transparent
								borderless
								expanded
								v-model="dateSelector"
								:appointmentDates="appointmentItems"
							/>
							<div class="selected-date-appointments" v-if="selectedDateAppointments.length">
								<p class="selected-date-label">
									{{ isSelectedDateToday ? 'Today' : formatDate(dateSelector, 'MMM d') }}
									- {{ selectedDateAppointments.length }} appointment{{ selectedDateAppointments.length > 1 ? 's' : '' }}
								</p>
								<div class="mini-appointment-list">
									<div
										v-for="apt in selectedDateAppointments.slice(0, 3)"
										:key="apt._id"
										class="mini-appointment"
										@click="onOpenAppointment(apt)"
									>
										<span class="mini-time">{{ formatTime(apt.start_time) }}</span>
										<span class="mini-patient">{{ apt.patient?.full_name || apt.patient?.profile?.first_name || 'Patient' }}</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Recent Activity -->
					<div class="content-card activity-card">
						<div class="card-header">
							<h3 class="card-title">
								<v-icon name="hi-clock" scale="1" />
								Recent Activity
							</h3>
							<button class="view-all-btn" @click="navigateTo('/app/specialist/specialist-appointments')">
								View All
								<v-icon name="hi-arrow-right" scale="0.8" />
							</button>
						</div>
						<div class="card-body">
							<div v-if="dashboardData?.recentActivity?.length" class="activity-feed">
								<div
									v-for="activity in dashboardData.recentActivity.slice(0, 5)"
									:key="activity.referenceId"
									class="activity-item"
								>
									<div class="activity-icon" :class="activity.type">
										<v-icon :name="getActivityIcon(activity.type)" scale="0.9" />
									</div>
									<div class="activity-content">
										<p class="activity-title">{{ activity.title }}</p>
										<p class="activity-desc">{{ activity.description }}</p>
										<span class="activity-time">{{ formatRelativeTime(activity.date) }}</span>
									</div>
								</div>
							</div>
							<div v-else class="empty-state small">
								<p class="empty-text">No recent activity</p>
							</div>
						</div>
					</div>

					<!-- Performance Summary -->
					<div class="content-card performance-card">
						<div class="card-header">
							<h3 class="card-title">
								<v-icon name="hi-chart-bar" scale="1" />
								This Month
							</h3>
						</div>
						<div class="card-body">
							<div class="performance-grid">
								<div class="performance-item">
									<span class="perf-value">{{ dashboardData?.performanceMetrics?.thisMonth?.completed || 0 }}</span>
									<span class="perf-label">Consultations</span>
								</div>
								<div class="performance-item">
									<span class="perf-value">{{ dashboardData?.performanceMetrics?.thisMonth?.prescriptions || 0 }}</span>
									<span class="perf-label">Prescriptions</span>
								</div>
								<div class="performance-item">
									<span class="perf-value">{{ dashboardData?.performanceMetrics?.thisMonth?.completionRate || 100 }}%</span>
									<span class="perf-label">Completion Rate</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Modals -->
		<dialog-modal
			v-if="isOpenAppointment"
			title="Appointment Details"
			@closeModal="isOpenAppointment = false"
			:has-footer="true"
			class="appointment-details-modal"
		>
			<template v-slot:body>
				<div class="loader-container" v-if="isFetchingAppointment">
					<loader :useOverlay="false" style="position: relative" />
				</div>
				<div v-else class="appointment-modal-content">
					<div class="modal-patient-info">
						<rc-avatar
							size="lg"
							:firstName="patientInfo.firstName"
							:lastName="patientInfo.lastName"
							v-model="patientInfo.profilePhoto"
						/>
						<div class="modal-patient-details">
							<h2 class="modal-patient-name">{{ patientInfo.fullName }}</h2>
							<p class="modal-patient-category">{{ patientInfo.category }}</p>
						</div>
					</div>
					<div class="modal-appointment-details">
						<div class="detail-row">
							<span class="detail-label">Date & Time</span>
							<span class="detail-value">
								{{ formatDate(patientInfo.startTime, 'MMMM dd, yyyy') }} at {{ formatTime(patientInfo.startTime) }}
							</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">Appointment Type</span>
							<span class="detail-value">{{ patientInfo.appointmentType }}</span>
						</div>
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<div class="modal-actions" v-if="!isFetchingAppointment">
					<rc-button
						type="tertiary"
						label="Cancel Appointment"
						@click="isOpenCancelAppointment = true"
					/>
					<div class="modal-actions-right">
						<rc-button
							type="tertiary"
							label="Reschedule"
							@click="onSubmitRescheduleAppointment(appointmentInfo)"
						/>
						<rc-button
							type="primary"
							label="Start Meeting"
							:disabled="!appointmentInfo?.start_url"
							@click="onStartMeetings(appointmentInfo)"
						/>
					</div>
				</div>
			</template>
		</dialog-modal>

		<dialog-modal
			v-if="isOpenCancelAppointment"
			@closeModal="isOpenCancelAppointment = false"
			:has-footer="true"
			title="Cancel Appointment"
		>
			<template v-slot:body>
				<p class="modal-message">
					Canceling your appointment less than 12 hours before the scheduled time will result in a surcharge fee. Are you sure you want to proceed?
				</p>
			</template>
			<template v-slot:foot>
				<div class="modal-confirm-actions">
					<rc-button
						label="No"
						type="tertiary"
						@click="isOpenCancelAppointment = false"
					/>
					<rc-button
						label="Yes, Cancel"
						type="primary"
						:loading="isLoadingCancelAppointment"
						@click="onSubmitCancelAppointment(appointmentInfo)"
					/>
				</div>
			</template>
		</dialog-modal>

		<reschedule-appointment ref="rescheduleAppointmentRef" @rescheduled="onAppointmentRescheduled" />
		<create-appointment-modal
			v-model="isOpenCreateAppointment"
			:pre-selected-date="dateSelector"
			@appointmentCreated="onAppointmentCreated"
		/>
	</div>
</template>

<script setup>
import { groupBy } from "lodash";
import { format, formatDistanceToNow, isToday } from "date-fns";
import { useToast } from "vue-toast-notification";
import { ref, inject, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import RcAvatar from "@/components/RCAvatar";
import RcIconbutton from "@/components/RCIconButton";
import RcButton from "@/components/buttons/button-primary";
import RcCalendar from "@/components/RCCalendar";
import Loader from "@/components/Loader/main-loader";
import DialogModal from "@/components/modals/dialog-modal.vue";
import { calculatePercentageChange } from "@/utilities/utilityFunctions";
import RescheduleAppointment from "./Appointments/RescheduleAppointment";
import CreateAppointmentModal from "./Appointments/CreateAppointmentModal.vue";

const $http = inject("$_HTTP");
const $toast = useToast();
const router = useRouter();

// State
const isLoading = ref(true);
const dashboardData = ref(null);
const appointmentItems = ref({});
const dateSelector = ref(new Date());
const appointmentInfo = ref({});
const patientInfo = ref({});

// Modal states
const isOpenAppointment = ref(false);
const isFetchingAppointment = ref(false);
const isOpenCancelAppointment = ref(false);
const isLoadingCancelAppointment = ref(false);
const isOpenCreateAppointment = ref(false);
const rescheduleAppointmentRef = ref();

// Computed
const selectedDateAppointments = computed(() => {
	if (Object.keys(appointmentItems.value).length && dateSelector.value) {
		return appointmentItems.value[new Date(dateSelector.value).toDateString()] || [];
	}
	return [];
});

const isSelectedDateToday = computed(() => {
	if (!dateSelector.value) return false;
	return isToday(new Date(dateSelector.value));
});

// Methods
const getTimeGreeting = () => {
	const hour = new Date().getHours();
	if (hour < 12) return 'Good Morning';
	if (hour < 17) return 'Good Afternoon';
	return 'Good Evening';
};

const formatDate = (date, formatStr) => {
	if (!date) return '';
	try {
		return format(new Date(date), formatStr);
	} catch {
		return '';
	}
};

const formatTime = (date) => {
	if (!date) return '';
	try {
		return format(new Date(date), 'h:mm a');
	} catch {
		return '';
	}
};

const formatRelativeTime = (date) => {
	if (!date) return '';
	try {
		return formatDistanceToNow(new Date(date), { addSuffix: true });
	} catch {
		return '';
	}
};

const formatCurrency = (amount) => {
	if (!amount) return '0';
	return new Intl.NumberFormat('en-NG').format(amount);
};

const getCompletedTrend = () => {
	const current = dashboardData.value?.appointmentsData?.completedAppointments || 0;
	const previous = dashboardData.value?.appointmentsData?.completedAppointmentsLastMonth || 0;
	return current >= previous ? 'up' : 'down';
};

const getCompletedPercentage = () => {
	const analytics = calculatePercentageChange(
		dashboardData.value?.appointmentsData?.completedAppointmentsLastMonth || 0,
		dashboardData.value?.appointmentsData?.completedAppointments || 0
	);
	return analytics.percentage || 0;
};

const getActivityIcon = (type) => {
	const icons = {
		'appointment_completed': 'hi-check-circle',
		'prescription_written': 'ri-capsule-line',
		'note_added': 'hi-document-text',
	};
	return icons[type] || 'hi-clock';
};

const navigateTo = (path) => {
	router.push(path);
};

// Data fetching
const fetchDashboardData = async () => {
	isLoading.value = true;
	try {
		// Fetch all appointment statuses for the calendar to show color-coded dots
		const [enhancedRes, openRes, ongoingRes, completedRes, missedRes, cancelledRes] = await Promise.all([
			$http.$_getSpecialistDashboardEnhanced(),
			$http.$_getSpecialistAppointments({ currentPage: 1, pageLimit: 100, status: "OPEN" }),
			$http.$_getSpecialistAppointments({ currentPage: 1, pageLimit: 100, status: "ONGOING" }),
			$http.$_getSpecialistAppointments({ currentPage: 1, pageLimit: 50, status: "COMPLETED" }),
			$http.$_getSpecialistAppointments({ currentPage: 1, pageLimit: 50, status: "MISSED" }),
			$http.$_getSpecialistAppointments({ currentPage: 1, pageLimit: 50, status: "CANCELLED" }),
		]);

		dashboardData.value = enhancedRes.data?.data || enhancedRes.data;

		// Combine all appointments for calendar with status information
		const allAppointments = [
			...(openRes.data?.data || []),
			...(ongoingRes.data?.data || []),
			...(completedRes.data?.data || []),
			...(missedRes.data?.data || []),
			...(cancelledRes.data?.data || []),
		];

		// Group appointments by date for calendar (preserving status for color-coded dots)
		appointmentItems.value = groupBy(
			allAppointments.map((item) => ({
				...item,
				startTime: new Date(item.start_time).toDateString(),
			})),
			"startTime"
		);
	} catch (error) {
		console.error('Error fetching dashboard:', error);
		$toast.error('Failed to load dashboard data');
	} finally {
		isLoading.value = false;
	}
};

// Appointment handlers
const onOpenAppointment = async (appointment) => {
	appointmentInfo.value = appointment;

	let userId;
	if (typeof appointment.patient === 'string') {
		userId = appointment.patient;
	} else if (appointment.patient && typeof appointment.patient === 'object') {
		userId = appointment.patient.id || appointment.patient._id;
	}

	if (!userId) {
		$toast.error('Patient information not found');
		return;
	}

	isFetchingAppointment.value = true;
	isOpenAppointment.value = true;

	try {
		const { data } = await $http.$_getOneUser(userId);
		patientInfo.value = {
			fullName: data.data?.full_name,
			firstName: data.data?.profile?.first_name,
			lastName: data.data?.profile?.last_name,
			category: appointment.category,
			startTime: appointment.start_time || appointment.startTime,
			appointmentType: appointment.appointment_type || appointment.appointmentType,
		};
	} catch (error) {
		$toast.error('Failed to load patient details');
	} finally {
		isFetchingAppointment.value = false;
	}
};

const onSubmitCancelAppointment = async (appointment) => {
	isLoadingCancelAppointment.value = true;
	try {
		await $http.$_cancelAppointments({ appointmentId: appointment._id, status: "CANCELLED" });
		$toast.success("Appointment cancelled successfully!");
		isOpenCancelAppointment.value = false;
		isOpenAppointment.value = false;
		fetchDashboardData();
	} catch (error) {
		$toast.error(error.message || 'Failed to cancel appointment');
	} finally {
		isLoadingCancelAppointment.value = false;
	}
};

const onSubmitRescheduleAppointment = (appointment) => {
	rescheduleAppointmentRef.value.onOpen(appointment);
	isOpenAppointment.value = false;
};

const onStartMeetings = (appointment) => {
	if (appointment.start_url) {
		window.open(appointment.start_url, '_blank');
	}
};

const openCreateAppointmentModal = () => {
	isOpenCreateAppointment.value = true;
};

const onAppointmentCreated = async () => {
	$toast.success('Appointment created successfully!');
	await fetchDashboardData();
};

const onAppointmentRescheduled = async () => {
	await fetchDashboardData();
};

// Initialize
onMounted(() => {
	fetchDashboardData();
});
</script>

<style lang="scss" scoped>
.page-content {
	display: flex;
	flex-direction: column;
	width: 100%;
	max-width: 1400px;
	margin: 0 auto;
	height: 100vh;
	position: relative;

	@include responsive(tab-portrait) {
		width: 100vw;
		max-width: none;
	}

	&__body {
		flex: 1;
		overflow-y: auto;
		padding: 0;
		padding-bottom: 100px;
		background: #F8FAFC;

		&::-webkit-scrollbar {
			display: none;
		}
	}
}

// Skeleton Loading
.dashboard-skeleton {
	.skeleton-hero {
		background: linear-gradient(135deg, rgba(14, 174, 196, 0.1) 0%, rgba(14, 174, 196, 0.05) 100%);
		border-radius: $size-24;
		padding: $size-32;
		margin-bottom: $size-24;

		.skeleton-line {
			background: linear-gradient(90deg, rgba(14, 174, 196, 0.1) 25%, rgba(14, 174, 196, 0.2) 50%, rgba(14, 174, 196, 0.1) 75%);
			background-size: 200% 100%;
			animation: shimmer 1.5s infinite;
			border-radius: $size-8;

			&.greeting {
				width: 150px;
				height: $size-24;
				margin-bottom: $size-12;
			}

			&.subtitle {
				width: 300px;
				height: $size-20;
			}
		}

		.skeleton-stats {
			display: flex;
			gap: $size-24;
			margin-top: $size-24;

			.skeleton-stat {
				width: 120px;
				height: 60px;
				background: linear-gradient(90deg, rgba(14, 174, 196, 0.1) 25%, rgba(14, 174, 196, 0.2) 50%, rgba(14, 174, 196, 0.1) 75%);
				background-size: 200% 100%;
				animation: shimmer 1.5s infinite;
				border-radius: $size-12;
			}
		}
	}

	.skeleton-cards {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: $size-20;
		margin-bottom: $size-24;

		@include responsive(tab-portrait) {
			grid-template-columns: repeat(2, 1fr);
		}

		@include responsive(phone) {
			grid-template-columns: 1fr;
		}

		.skeleton-card {
			height: 120px;
			background: linear-gradient(90deg, $color-g-95 25%, $color-g-90 50%, $color-g-95 75%);
			background-size: 200% 100%;
			animation: shimmer 1.5s infinite;
			border-radius: $size-16;
		}
	}

	.skeleton-sections {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: $size-24;

		@include responsive(tab-portrait) {
			grid-template-columns: 1fr;
		}

		.skeleton-section {
			height: 300px;
			background: linear-gradient(90deg, $color-g-95 25%, $color-g-90 50%, $color-g-95 75%);
			background-size: 200% 100%;
			animation: shimmer 1.5s infinite;
			border-radius: $size-16;
		}
	}
}

@keyframes shimmer {
	0% { background-position: 200% 0; }
	100% { background-position: -200% 0; }
}

// Hero Section
.hero-section {
	background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 50%, #0288D1 100%);
	border-radius: $size-24;
	padding: $size-32 $size-48;
	margin: $size-24 $size-48;
	display: flex;
	justify-content: space-between;
	align-items: center;
	position: relative;
	overflow: visible;
	box-shadow: 0 10px 40px rgba(79, 195, 247, 0.3);
	color: white;

	&::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -10%;
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
		pointer-events: none;
	}

	@include responsive(tab-portrait) {
		flex-direction: column;
		align-items: flex-start;
		padding: $size-24;
		gap: $size-24;
		margin: $size-16 $size-24;
		border-radius: $size-16;
	}

	@include responsive(phone) {
		padding: $size-20 $size-16;
		margin: $size-12 $size-16;
		border-radius: $size-12;
	}

	.hero-content {
		z-index: 1;
		width: 100%;
	}

	.hero-greeting {
		.greeting-badge {
			display: inline-flex;
			align-items: center;
			gap: $size-6;
			background: rgba(255, 255, 255, 0.2);
			padding: $size-6 $size-12;
			border-radius: $size-20;
			font-size: $size-12;
			font-weight: $fw-medium;
			color: white;
			margin-bottom: $size-12;
		}

		.greeting-text {
			font-size: $size-32;
			font-weight: $fw-bold;
			color: white;
			margin: 0 0 $size-8 0;
			line-height: 1.2;

			.name-highlight {
				color: #fef3c7;
			}

			@include responsive(phone) {
				font-size: $size-24;
			}
		}

		.greeting-subtitle {
			font-size: $size-16;
			color: rgba(255, 255, 255, 0.85);
			margin: 0;

			@include responsive(phone) {
				font-size: $size-14;
			}
		}
	}

	.hero-today-stats {
		display: flex;
		gap: $size-20;
		margin-top: $size-24;

		@include responsive(phone) {
			flex-wrap: wrap;
			gap: $size-12;
		}

		.today-stat {
			display: flex;
			align-items: center;
			gap: $size-12;
			background: rgba(255, 255, 255, 0.15);
			backdrop-filter: blur(10px);
			padding: $size-12 $size-16;
			border-radius: $size-12;
			border: 1px solid rgba(255, 255, 255, 0.2);

			.stat-icon {
				width: 40px;
				height: 40px;
				border-radius: $size-10;
				display: flex;
				align-items: center;
				justify-content: center;
				color: white;

				&.appointments { background: rgba(251, 191, 36, 0.3); }
				&.completed { background: rgba(34, 197, 94, 0.3); }
				&.pending { background: rgba(239, 68, 68, 0.3); }
			}

			.stat-content {
				display: flex;
				flex-direction: column;

				.stat-value {
					font-size: $size-24;
					font-weight: $fw-bold;
					color: white;
					line-height: 1;
				}

				.stat-label {
					font-size: $size-12;
					color: rgba(255, 255, 255, 0.8);
				}
			}
		}
	}

	.hero-visual {
		z-index: 1;

		.rating-card {
			background: rgba(255, 255, 255, 0.2);
			backdrop-filter: blur(10px);
			padding: $size-16 $size-24;
			border-radius: $size-16;
			border: 1px solid rgba(255, 255, 255, 0.3);
			text-align: center;

			.rating-stars {
				display: flex;
				align-items: center;
				justify-content: center;
				gap: $size-6;

				.star-icon {
					color: #fbbf24;
				}

				.rating-value {
					font-size: $size-28;
					font-weight: $fw-bold;
					color: white;
				}
			}

			.rating-label {
				font-size: $size-12;
				color: rgba(255, 255, 255, 0.8);
			}
		}
	}
}

// Stats Row
.stats-row {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: $size-20;
	margin: 0 $size-48 $size-24;

	@include responsive(tab-portrait) {
		grid-template-columns: repeat(2, 1fr);
		margin: 0 $size-24 $size-24;
	}

	@include responsive(phone) {
		grid-template-columns: 1fr;
		margin: 0 $size-16 $size-24;
	}

	.stat-card {
		background: white;
		border-radius: $size-16;
		padding: $size-20;
		display: flex;
		align-items: center;
		gap: $size-16;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid $color-g-92;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
		}

		.card-icon {
			width: 52px;
			height: 52px;
			border-radius: $size-14;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		&.patients .card-icon {
			background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
			color: white;
		}

		&.appointments .card-icon {
			background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
			color: white;
		}

		&.wallet .card-icon {
			background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
			color: white;
		}

		&.starred .card-icon {
			background: linear-gradient(135deg, #eab308 0%, #ca8a04 100%);
			color: white;
		}

		.card-content {
			flex: 1;
			display: flex;
			flex-direction: column;

			.card-value {
				font-size: $size-24;
				font-weight: $fw-bold;
				color: $color-g-21;
				line-height: 1.2;
			}

			.card-label {
				font-size: $size-14;
				font-weight: $fw-medium;
				color: $color-g-44;
			}

			.card-sublabel {
				font-size: $size-12;
				color: $color-g-67;
			}
		}

		.card-arrow {
			color: $color-g-67;
		}

		.card-trend {
			display: flex;
			align-items: center;
			gap: $size-4;
			font-size: $size-12;
			font-weight: $fw-medium;
			padding: $size-4 $size-8;
			border-radius: $size-8;

			&.up {
				background: rgba(34, 197, 94, 0.1);
				color: #16a34a;
			}

			&.down {
				background: rgba(239, 68, 68, 0.1);
				color: #dc2626;
			}
		}
	}
}

// Quick Actions
.quick-actions-section {
	margin: 0 $size-48 $size-24;

	@include responsive(tab-portrait) {
		margin: 0 $size-24 $size-24;
	}

	@include responsive(phone) {
		margin: 0 $size-16 $size-24;
	}

	.section-title {
		font-size: $size-18;
		font-weight: $fw-semi-bold;
		color: $color-g-21;
		margin: 0 0 $size-16 0;
	}

	.quick-actions-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: $size-12;

		@include responsive(tab-portrait) {
			grid-template-columns: repeat(3, 1fr);
		}

		@include responsive(phone) {
			grid-template-columns: repeat(2, 1fr);
		}

		.quick-action {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: $size-10;
			padding: $size-20 $size-12;
			background: white;
			border: 1px solid $color-g-92;
			border-radius: $size-14;
			cursor: pointer;
			transition: all 0.2s ease;

			&:hover {
				border-color: #4FC3F7;
				background: rgba(14, 174, 196, 0.02);

				.action-icon {
					transform: scale(1.05);
				}
			}

			.action-icon {
				width: 48px;
				height: 48px;
				border-radius: $size-12;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: transform 0.2s ease;

				&.patients { background: rgba(14, 174, 196, 0.1); color: #4FC3F7; }
				&.appointments { background: rgba(249, 115, 22, 0.1); color: #f97316; }
				&.prescriptions { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
				&.notes { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
				&.create { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
				&.settings { background: rgba(107, 114, 128, 0.1); color: #6b7280; }
			}

			.action-label {
				font-size: $size-13;
				font-weight: $fw-medium;
				color: $color-g-44;
				text-align: center;
			}
		}
	}
}

// Main Content Grid
.main-content-grid {
	display: grid;
	grid-template-columns: 1.5fr 1fr;
	gap: $size-24;
	margin: 0 $size-48;

	@include responsive(tab-portrait) {
		grid-template-columns: 1fr;
		margin: 0 $size-24;
	}

	@include responsive(phone) {
		margin: 0 $size-16;
	}

	.left-column, .right-column {
		display: flex;
		flex-direction: column;
		gap: $size-24;
	}
}

// Content Cards
.content-card {
	background: white;
	border-radius: $size-16;
	border: 1px solid $color-g-92;
	overflow: hidden;

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: $size-16 $size-20;
		border-bottom: 1px solid $color-g-95;

		.card-title {
			display: flex;
			align-items: center;
			gap: $size-8;
			font-size: $size-16;
			font-weight: $fw-semi-bold;
			color: $color-g-21;
			margin: 0;

			svg {
				color: #4FC3F7;
			}
		}

		.view-all-btn {
			display: flex;
			align-items: center;
			gap: $size-4;
			background: none;
			border: none;
			font-size: $size-13;
			font-weight: $fw-medium;
			color: #4FC3F7;
			cursor: pointer;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	.card-body {
		padding: $size-20;
	}
}

// Schedule Timeline
.schedule-timeline {
	.timeline-item {
		display: flex;
		gap: $size-16;
		padding: $size-12 0;
		cursor: pointer;
		transition: background 0.2s ease;
		border-radius: $size-8;
		padding-left: $size-8;
		margin-left: -$size-8;

		&:hover {
			background: $color-g-97;
		}

		&.completed .timeline-marker .marker-dot {
			background: #22c55e;
		}

		&.ongoing .timeline-marker .marker-dot {
			background: #f97316;
			animation: pulse 2s infinite;
		}

		.timeline-time {
			width: 70px;
			font-size: $size-14;
			font-weight: $fw-medium;
			color: #4FC3F7;
			flex-shrink: 0;
		}

		.timeline-marker {
			display: flex;
			flex-direction: column;
			align-items: center;
			flex-shrink: 0;

			.marker-dot {
				width: 12px;
				height: 12px;
				border-radius: 50%;
				background: $color-g-67;
				border: 2px solid white;
				box-shadow: 0 0 0 2px $color-g-90;
			}

			.marker-line {
				width: 2px;
				flex: 1;
				min-height: 30px;
				background: $color-g-90;
				margin-top: $size-4;
			}
		}

		&:last-child .timeline-marker .marker-line {
			display: none;
		}

		.timeline-content {
			flex: 1;
			display: flex;
			justify-content: space-between;
			align-items: flex-start;

			.patient-info {
				display: flex;
				align-items: center;
				gap: $size-10;

				.patient-details {
					display: flex;
					flex-direction: column;

					.patient-name {
						font-size: $size-14;
						font-weight: $fw-medium;
						color: $color-g-21;
					}

					.appointment-type {
						font-size: $size-12;
						color: $color-g-67;
					}
				}
			}

			.timeline-status {
				font-size: $size-11;
				font-weight: $fw-medium;
				padding: $size-4 $size-8;
				border-radius: $size-6;
				text-transform: uppercase;

				&.open { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
				&.ongoing { background: rgba(249, 115, 22, 0.1); color: #f97316; }
				&.completed { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
			}
		}
	}
}

@keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.5; }
}

// Appointments List
.appointments-list {
	.appointment-item {
		display: flex;
		align-items: center;
		gap: $size-16;
		padding: $size-14;
		border-radius: $size-12;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid transparent;

		&:hover {
			background: $color-g-97;
			border-color: $color-g-90;
		}

		.appointment-date-block {
			width: 48px;
			height: 48px;
			background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
			border-radius: $size-10;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;

			.date-day {
				font-size: $size-18;
				font-weight: $fw-bold;
				color: white;
				line-height: 1;
			}

			.date-month {
				font-size: $size-10;
				color: rgba(255, 255, 255, 0.85);
				text-transform: uppercase;
			}
		}

		.appointment-details {
			flex: 1;

			.appointment-patient {
				display: flex;
				align-items: center;
				gap: $size-8;
				margin-bottom: $size-4;

				.patient-name {
					font-size: $size-14;
					font-weight: $fw-medium;
					color: $color-g-21;
				}
			}

			.appointment-meta {
				display: flex;
				align-items: center;
				gap: $size-12;

				.meta-time {
					display: flex;
					align-items: center;
					gap: $size-4;
					font-size: $size-12;
					color: $color-g-67;
				}

				.meta-type {
					font-size: $size-12;
					color: $color-g-67;
				}
			}
		}

		.appointment-arrow {
			color: $color-g-67;
		}
	}
}

// Calendar Card
.calendar-card {
	.calendar-body {
		padding: $size-12;
	}

	.selected-date-appointments {
		margin-top: $size-16;
		padding-top: $size-16;
		border-top: 1px solid $color-g-92;

		.selected-date-label {
			font-size: $size-13;
			font-weight: $fw-medium;
			color: $color-g-44;
			margin: 0 0 $size-12 0;
		}

		.mini-appointment-list {
			display: flex;
			flex-direction: column;
			gap: $size-8;

			.mini-appointment {
				display: flex;
				align-items: center;
				gap: $size-12;
				padding: $size-8 $size-12;
				background: $color-g-97;
				border-radius: $size-8;
				cursor: pointer;
				font-size: $size-13;

				&:hover {
					background: $color-g-92;
				}

				.mini-time {
					color: #4FC3F7;
					font-weight: $fw-medium;
				}

				.mini-patient {
					color: $color-g-44;
				}
			}
		}
	}
}

// Activity Feed
.activity-feed {
	.activity-item {
		display: flex;
		gap: $size-12;
		padding: $size-12 0;
		border-bottom: 1px solid $color-g-95;

		&:last-child {
			border-bottom: none;
		}

		.activity-icon {
			width: 36px;
			height: 36px;
			border-radius: $size-10;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;

			&.appointment_completed {
				background: rgba(34, 197, 94, 0.1);
				color: #22c55e;
			}

			&.prescription_written {
				background: rgba(168, 85, 247, 0.1);
				color: #a855f7;
			}
		}

		.activity-content {
			flex: 1;

			.activity-title {
				font-size: $size-13;
				font-weight: $fw-medium;
				color: $color-g-21;
				margin: 0 0 $size-2 0;
			}

			.activity-desc {
				font-size: $size-12;
				color: $color-g-67;
				margin: 0 0 $size-4 0;
			}

			.activity-time {
				font-size: $size-11;
				color: $color-g-77;
			}
		}
	}
}

// Performance Card
.performance-card {
	.performance-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: $size-12;

		.performance-item {
			text-align: center;
			padding: $size-16;
			background: $color-g-97;
			border-radius: $size-12;

			.perf-value {
				display: block;
				font-size: $size-24;
				font-weight: $fw-bold;
				color: #4FC3F7;
				line-height: 1.2;
			}

			.perf-label {
				font-size: $size-12;
				color: $color-g-67;
			}
		}
	}
}

// Empty States
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: $size-32;
	text-align: center;

	&.small {
		padding: $size-20;
	}

	.empty-icon {
		width: 64px;
		height: 64px;
		background: $color-g-95;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $size-16;
		color: $color-g-67;
	}

	.empty-text {
		font-size: $size-14;
		color: $color-g-67;
		margin: 0 0 $size-16 0;
	}

	.empty-action {
		display: flex;
		align-items: center;
		gap: $size-6;
		padding: $size-10 $size-16;
		background: #4FC3F7;
		color: white;
		border: none;
		border-radius: $size-8;
		font-size: $size-13;
		font-weight: $fw-medium;
		cursor: pointer;

		&:hover {
			background: #0288D1;
		}
	}
}

// Modal Styles
.loader-container {
	min-height: 200px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.appointment-modal-content {
	padding: $size-24;
	min-width: 400px;

	@include responsive(phone) {
		min-width: auto;
		padding: $size-16;
	}

	.modal-patient-info {
		display: flex;
		align-items: center;
		gap: $size-16;
		margin-bottom: $size-24;

		.modal-patient-details {
			.modal-patient-name {
				font-size: $size-20;
				font-weight: $fw-semi-bold;
				color: $color-g-21;
				margin: 0 0 $size-4 0;
			}

			.modal-patient-category {
				font-size: $size-14;
				color: $color-g-67;
				margin: 0;
			}
		}
	}

	.modal-appointment-details {
		.detail-row {
			display: flex;
			flex-direction: column;
			gap: $size-4;
			padding: $size-12 0;
			border-bottom: 1px solid $color-g-95;

			&:last-child {
				border-bottom: none;
			}

			.detail-label {
				font-size: $size-12;
				color: $color-g-67;
			}

			.detail-value {
				font-size: $size-14;
				color: $color-g-21;
				font-weight: $fw-medium;
			}
		}
	}
}

.modal-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;

	.modal-actions-right {
		display: flex;
		gap: $size-12;
	}

	@include responsive(phone) {
		flex-direction: column;
		gap: $size-12;

		.modal-actions-right {
			width: 100%;
			flex-direction: column;
		}
	}
}

.modal-message {
	font-size: $size-14;
	color: $color-g-44;
	line-height: 1.6;
	max-width: 400px;
}

.modal-confirm-actions {
	display: flex;
	justify-content: space-between;
	width: 100%;
}
</style>
