<template>
	<div class="dashboard-page">
		<!-- Mobile Header -->
		<header class="mobile-header">
			<button class="menu-btn" @click="$emit('openSideNav')">
				<v-icon name="hi-menu-alt-2" scale="1.2" />
			</button>
			<div class="header-logo">
				<v-icon name="hi-view-grid" scale="1" />
				<span>Dashboard</span>
			</div>
			<button class="header-action-btn" @click="openCreateAppointmentModal">
				<v-icon name="hi-plus" scale="1" />
			</button>
		</header>

		<!-- Page Content -->
		<div class="page-body">
			<!-- Loading State -->
			<div v-if="isLoading" class="loading-state">
				<div class="loading-spinner">
					<div class="spinner-ring"></div>
					<v-icon name="hi-view-grid" scale="1.2" class="spinner-icon" />
				</div>
				<p>Loading dashboard...</p>
			</div>

			<template v-else>
				<!-- Hero Section -->
				<section class="hero">
					<div class="hero__content">
						<div class="hero__badge">
							<div class="badge-pulse"></div>
							<v-icon name="hi-sparkles" />
							<span>{{ getTimeGreeting() }}</span>
						</div>
						<h1 class="hero__title">
							Welcome back,<br/>
							<span class="hero__title-accent">Dr. {{ dashboardData?.specialist?.firstName || 'Specialist' }}</span>
						</h1>
						<p class="hero__subtitle">
							Here's your practice overview for today, {{ formatDate(new Date(), 'EEEE, MMMM d, yyyy') }}
						</p>
						<div class="hero__stats">
							<div class="hero-stat">
								<span class="hero-stat__value">{{ dashboardData?.patientStats?.totalPatients || 0 }}</span>
								<span class="hero-stat__label">Patients</span>
							</div>
							<div class="hero-stat__divider"></div>
							<div class="hero-stat">
								<span class="hero-stat__value hero-stat__value--warning">{{ dashboardData?.performanceMetrics?.thisMonth?.completed || 0 }}</span>
								<span class="hero-stat__label">This Month</span>
							</div>
							<div class="hero-stat__divider"></div>
							<div class="hero-stat">
								<span class="hero-stat__value hero-stat__value--success">{{ dashboardData?.performanceMetrics?.thisMonth?.completionRate || 100 }}%</span>
								<span class="hero-stat__label">Completion</span>
							</div>
						</div>
					</div>
					<div class="hero__visual">
						<div class="dashboard-orb">
							<div class="orb-ring orb-ring--1"></div>
							<div class="orb-ring orb-ring--2"></div>
							<div class="orb-ring orb-ring--3"></div>
							<div class="orb-core">
								<v-icon name="hi-clipboard-check" />
							</div>
						</div>
						<div class="floating-icons">
							<div class="float-icon float-icon--1"><v-icon name="hi-calendar" /></div>
							<div class="float-icon float-icon--2"><v-icon name="hi-user-group" /></div>
							<div class="float-icon float-icon--3"><v-icon name="bi-wallet2" /></div>
						</div>
						<!-- Floating Rating Card -->
						<div class="rating-float" v-if="dashboardData?.specialist?.averageRating">
							<div class="rating-stars">
								<v-icon name="bi-star-fill" scale="0.9" class="star-icon" />
								<span class="rating-value">{{ dashboardData?.specialist?.averageRating?.toFixed(1) }}</span>
							</div>
							<span class="rating-label">{{ dashboardData?.specialist?.totalReviews || 0 }} reviews</span>
						</div>
					</div>
				</section>

				<!-- Bento Grid -->
				<section class="bento-grid">
					<!-- Stats Row -->
					<div class="stats-row">
						<div class="stat-card" @click="navigateTo('/app/specialist/patients')">
							<div class="stat-icon sky">
								<v-icon name="hi-user-group" scale="1.3" />
							</div>
							<div class="stat-info">
								<span class="stat-value">{{ dashboardData?.patientStats?.totalPatients || 0 }}</span>
								<span class="stat-label">Total Patients</span>
								<span class="stat-sub">{{ dashboardData?.patientStats?.thisMonthPatients || 0 }} this month</span>
							</div>
						</div>

						<div class="stat-card" @click="navigateTo('/app/specialist/specialist-appointments')">
							<div class="stat-icon amber">
								<v-icon name="hi-check-circle" scale="1.3" />
							</div>
							<div class="stat-info">
								<span class="stat-value">{{ dashboardData?.appointmentsData?.completedAppointments || 0 }}</span>
								<span class="stat-label">Completed</span>
								<span class="stat-sub">
									<span class="trend" :class="getCompletedTrend()">
										<v-icon :name="getCompletedTrend() === 'up' ? 'hi-trending-up' : 'hi-trending-down'" scale="0.7" />
										{{ getCompletedPercentage() }}%
									</span>
									this month
								</span>
							</div>
						</div>

						<div class="stat-card" @click="navigateTo('/app/specialist/wallet')">
							<div class="stat-icon emerald">
								<v-icon name="bi-wallet2" scale="1.3" />
							</div>
							<div class="stat-info">
								<span class="stat-value">&#8358;{{ formatCurrency(dashboardData?.wallet?.balance) }}</span>
								<span class="stat-label">Wallet Balance</span>
								<span class="stat-sub">&#8358;{{ formatCurrency(dashboardData?.totalEarnings?.totalEarnings) }} total</span>
							</div>
						</div>

						<div class="stat-card" @click="navigateTo('/app/specialist/patients/starred')">
							<div class="stat-icon violet">
								<v-icon name="bi-star-fill" scale="1.3" />
							</div>
							<div class="stat-info">
								<span class="stat-value">{{ dashboardData?.patientStats?.starredPatients || 0 }}</span>
								<span class="stat-label">Starred Patients</span>
								<span class="stat-sub">Quick access</span>
							</div>
						</div>
					</div>

					<!-- Quick Actions Card -->
					<div class="bento-card actions-card">
						<div class="card-header">
							<h3>Quick Actions</h3>
						</div>
						<div class="actions-row">
							<button class="action-btn" @click="navigateTo('/app/specialist/patients')">
								<div class="action-icon sky">
									<v-icon name="hi-users" scale="1.1" />
								</div>
								<span>Patients</span>
							</button>
							<button class="action-btn" @click="navigateTo('/app/specialist/specialist-appointments')">
								<div class="action-icon amber">
									<v-icon name="hi-calendar" scale="1.1" />
								</div>
								<span>Appointments</span>
							</button>
							<button class="action-btn" @click="navigateTo('/app/specialist/pharmacy/patients')">
								<div class="action-icon violet">
									<v-icon name="ri-capsule-line" scale="1.1" />
								</div>
								<span>Prescriptions</span>
							</button>
							<button class="action-btn" @click="navigateTo('/app/specialist/clinical-notes')">
								<div class="action-icon rose">
									<v-icon name="hi-document-text" scale="1.1" />
								</div>
								<span>Clinical Notes</span>
							</button>
							<button class="action-btn" @click="openCreateAppointmentModal">
								<div class="action-icon emerald">
									<v-icon name="hi-plus-circle" scale="1.1" />
								</div>
								<span>New Appointment</span>
							</button>
							<button class="action-btn" @click="navigateTo('/app/specialist/onboarding/dashboard')">
								<div class="action-icon gray">
									<v-icon name="hi-cog" scale="1.1" />
								</div>
								<span>Settings</span>
							</button>
						</div>
					</div>

					<!-- Schedule + Calendar Row -->
					<div class="grid-row grid-row--schedule">
						<!-- Today's Schedule -->
						<div class="bento-card schedule-card">
							<div class="card-header">
								<h3>
									<v-icon name="hi-clock" scale="0.9" />
									Today's Schedule
								</h3>
								<button class="view-all" @click="navigateTo('/app/specialist/specialist-appointments')">
									View All
									<v-icon name="hi-arrow-right" scale="0.75" />
								</button>
							</div>
							<div class="card-content">
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
											<span class="timeline-badge" :class="apt.status?.toLowerCase()">
												{{ apt.status }}
											</span>
										</div>
									</div>
								</div>
								<div v-else class="empty-state">
									<div class="empty-icon">
										<v-icon name="hi-calendar" scale="2" />
									</div>
									<h3>No appointments today</h3>
									<p>Your schedule is clear for today</p>
									<button class="empty-action" @click="openCreateAppointmentModal">
										<v-icon name="hi-plus" scale="0.9" />
										Schedule Appointment
									</button>
								</div>
							</div>
						</div>

						<!-- Calendar Widget -->
						<div class="bento-card calendar-card">
							<div class="card-header">
								<h3>
									<v-icon name="hi-calendar" scale="0.9" />
									Calendar
								</h3>
								<rc-iconbutton
									icon="icon-plus-solid"
									size="sm"
									@click="openCreateAppointmentModal"
									title="Create appointment"
								/>
							</div>
							<div class="card-content calendar-content">
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
					</div>

					<!-- Upcoming + Activity/Performance Row -->
					<div class="grid-row grid-row--lower">
						<!-- Upcoming Appointments -->
						<div class="bento-card upcoming-card">
							<div class="card-header">
								<h3>
									<v-icon name="hi-calendar" scale="0.9" />
									Upcoming Appointments
								</h3>
								<button class="view-all" @click="navigateTo('/app/specialist/specialist-appointments')">
									View All
									<v-icon name="hi-arrow-right" scale="0.75" />
								</button>
							</div>
							<div class="card-content">
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
										<v-icon name="hi-chevron-right" scale="0.9" class="item-chevron" />
									</div>
								</div>
								<div v-else class="empty-state small">
									<p>No upcoming appointments</p>
								</div>
							</div>
						</div>

						<!-- Right Stack: Activity + Performance -->
						<div class="right-stack">
							<!-- Recent Activity -->
							<div class="bento-card activity-card">
								<div class="card-header">
									<h3>
										<v-icon name="hi-clock" scale="0.9" />
										Recent Activity
									</h3>
									<button class="view-all" @click="navigateTo('/app/specialist/specialist-appointments')">
										View All
										<v-icon name="hi-arrow-right" scale="0.75" />
									</button>
								</div>
								<div class="card-content">
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
										<p>No recent activity</p>
									</div>
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
											<span class="perf-value">{{ dashboardData?.performanceMetrics?.thisMonth?.completed || 0 }}</span>
											<span class="perf-label">Consultations</span>
										</div>
										<div class="performance-item">
											<span class="perf-value">{{ dashboardData?.performanceMetrics?.thisMonth?.prescriptions || 0 }}</span>
											<span class="perf-label">Prescriptions</span>
										</div>
										<div class="performance-item">
											<span class="perf-value">{{ dashboardData?.performanceMetrics?.thisMonth?.completionRate || 100 }}%</span>
											<span class="perf-label">Completion</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>
			</template>
		</div>

		<!-- Modals (unchanged) -->
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

		&:active {
			background: #E2E8F0;
		}
	}

	.header-logo {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 16px;
		font-weight: 600;
		color: $navy;

		svg {
			color: $sky-dark;
		}
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

	@media (max-width: 480px) {
		padding: 24px 16px 20px;
		border-radius: 16px;
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

	@media (max-width: 480px) {
		padding: 6px 14px;
		margin: 0 auto 12px;
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

		@media (max-width: 768px) {
			left: 10px;
			width: 6px;
			height: 6px;
		}
	}

	svg {
		width: 16px;
		height: 16px;
		color: white;
		margin-left: 12px;

		@media (max-width: 768px) {
			width: 14px;
			height: 14px;
			margin-left: 10px;
		}
	}

	span {
		font-size: 13px;
		font-weight: 600;
		color: white;
		letter-spacing: 0.3px;

		@media (max-width: 768px) {
			font-size: 12px;
		}
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
		letter-spacing: -0.5px;

		br { display: none; }
	}

	@media (max-width: 480px) {
		font-size: 28px;
		margin: 0 0 8px;
	}

	.hero__title-accent {
		background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;

		@media (max-width: 768px) {
			display: inline;
			margin-left: 6px;
		}
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
		opacity: 0.9;
	}

	@media (max-width: 480px) {
		font-size: 14px;
		margin: 0 0 16px;
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
		border-radius: 14px;
	}

	@media (max-width: 480px) {
		padding: 14px 12px;
		gap: 4px;
		border-radius: 12px;
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
		@media (max-width: 480px) { font-size: 20px; }

		&--warning { color: $amber-light; }
		&--success { color: $emerald-light; }
	}

	&__label {
		display: block;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
		margin-top: 4px;
		text-transform: uppercase;
		letter-spacing: 0.5px;

		@media (max-width: 768px) { font-size: 11px; }
		@media (max-width: 480px) { font-size: 10px; }
	}

	&__divider {
		width: 1px;
		height: 32px;
		background: rgba(255, 255, 255, 0.2);
		flex-shrink: 0;

		@media (max-width: 768px) { height: 28px; }
	}
}

// Hero Visual (orb + floating)
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

	&--1 {
		width: 100%;
		height: 100%;
		animation: spin-slow 20s linear infinite;
	}

	&--2 {
		width: 80%;
		height: 80%;
		animation: spin-slow 15s linear infinite reverse;
	}

	&--3 {
		width: 60%;
		height: 60%;
		animation: spin-slow 10s linear infinite;
	}
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

	svg {
		width: 48px;
		height: 48px;
		color: white;
	}
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

	svg {
		width: 20px;
		height: 20px;
		color: white;
	}

	&--1 { top: 10%; right: 10%; animation-delay: 0s; }
	&--2 { bottom: 20%; right: 5%; animation-delay: 1s; }
	&--3 { bottom: 10%; left: 10%; animation-delay: 2s; }
}

.rating-float {
	position: absolute;
	bottom: -10px;
	right: 20px;
	background: rgba(255, 255, 255, 0.2);
	backdrop-filter: blur(10px);
	padding: 12px 20px;
	border-radius: 16px;
	border: 1px solid rgba(255, 255, 255, 0.3);
	text-align: center;
	animation: float 4s ease-in-out infinite;
	animation-delay: 0.5s;

	.rating-stars {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;

		.star-icon { color: #fbbf24; }

		.rating-value {
			font-size: 24px;
			font-weight: 700;
			color: white;
		}
	}

	.rating-label {
		font-size: 11px;
		color: rgba(255, 255, 255, 0.8);
	}
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

	@media (max-width: 768px) {
		gap: 16px;
	}
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

		@media (max-width: 768px) {
			margin-bottom: 12px;
		}

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

	.card-content {
		// default content area
	}
}

// ============================================
// STATS ROW
// ============================================
.stats-row {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 16px;

	@media (max-width: 768px) {
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
	}
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

	@media (max-width: 768px) {
		padding: 16px;
		border-radius: 16px;
	}
}

.stat-icon {
	width: 52px;
	height: 52px;
	border-radius: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;

	@media (max-width: 768px) {
		width: 46px;
		height: 46px;
		border-radius: 12px;
	}

	&.sky { background: $sky-light; color: $sky-dark; }
	&.amber { background: $amber-light; color: $amber; }
	&.emerald { background: $emerald-light; color: $emerald; }
	&.violet { background: $violet-light; color: $violet; }
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

		@media (max-width: 768px) {
			font-size: 20px;
		}
	}

	.stat-label {
		display: block;
		font-size: 14px;
		font-weight: 500;
		color: $slate;

		@media (max-width: 768px) {
			font-size: 13px;
		}
	}

	.stat-sub {
		display: block;
		font-size: 12px;
		color: $gray;

		.trend {
			display: inline-flex;
			align-items: center;
			gap: 2px;
			font-weight: 600;

			&.up { color: $emerald; }
			&.down { color: $rose; }
		}
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
			gap: 8px;
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

			@media (max-width: 768px) { font-size: 12px; }
			@media (max-width: 480px) { font-size: 11px; }
		}
	}

	.action-icon {
		width: 48px;
		height: 48px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;

		@media (max-width: 768px) {
			width: 44px;
			height: 44px;
			border-radius: 12px;
		}

		&.sky { background: $sky-light; color: $sky-dark; }
		&.emerald { background: $emerald-light; color: $emerald; }
		&.violet { background: $violet-light; color: $violet; }
		&.amber { background: $amber-light; color: $amber; }
		&.rose { background: $rose-light; color: $rose; }
		&.gray { background: #F1F5F9; color: $gray; }
	}
}

// ============================================
// GRID ROWS
// ============================================
.grid-row {
	display: grid;
	gap: 20px;

	@media (max-width: 768px) {
		grid-template-columns: 1fr !important;
		gap: 16px;
	}

	&--schedule {
		grid-template-columns: 1.5fr 1fr;
	}

	&--lower {
		grid-template-columns: 1.2fr 1fr;
	}
}

.right-stack {
	display: flex;
	flex-direction: column;
	gap: 20px;

	@media (max-width: 768px) {
		gap: 16px;
	}
}

// ============================================
// SCHEDULE TIMELINE
// ============================================
.schedule-timeline {
	display: flex;
	flex-direction: column;
}

.timeline-item {
	display: flex;
	gap: 16px;
	padding: 12px;
	cursor: pointer;
	transition: all 0.2s ease;
	border-radius: 14px;

	&:hover {
		background: $bg;
		transform: translateX(4px);
	}

	&.completed .timeline-marker .marker-dot {
		background: $emerald;
	}

	&.ongoing .timeline-marker .marker-dot {
		background: $amber;
		animation: pulse 2s infinite;
	}
}

.timeline-time {
	width: 70px;
	font-size: 14px;
	font-weight: 600;
	color: $sky-dark;
	flex-shrink: 0;
	padding-top: 2px;
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
		background: $light-gray;
		border: 2px solid white;
		box-shadow: 0 0 0 2px #E2E8F0;
	}

	.marker-line {
		width: 2px;
		flex: 1;
		min-height: 30px;
		background: #E2E8F0;
		margin-top: 4px;
	}
}

.timeline-item:last-child .timeline-marker .marker-line {
	display: none;
}

.timeline-content {
	flex: 1;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 12px;

	.patient-info {
		display: flex;
		align-items: center;
		gap: 10px;

		.patient-details {
			display: flex;
			flex-direction: column;

			.patient-name {
				font-size: 14px;
				font-weight: 500;
				color: $navy;
			}

			.appointment-type {
				font-size: 12px;
				color: $gray;
			}
		}
	}
}

.timeline-badge {
	font-size: 11px;
	font-weight: 600;
	padding: 4px 10px;
	border-radius: 12px;
	text-transform: uppercase;
	flex-shrink: 0;

	&.open { background: $sky-light; color: $sky-dark; }
	&.ongoing { background: $amber-light; color: $amber; }
	&.completed { background: $emerald-light; color: $emerald; }
	&.missed { background: $rose-light; color: $rose; }
	&.cancelled { background: #F1F5F9; color: $gray; }
}

// ============================================
// APPOINTMENTS LIST
// ============================================
.appointments-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.appointment-item {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 14px;
	background: $bg;
	border-radius: 14px;
	border: 1px solid #E2E8F0;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background: white;
		border-color: $sky-light;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
		transform: translateX(4px);
	}

	.appointment-date-block {
		width: 48px;
		height: 48px;
		background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		.date-day {
			font-size: 18px;
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

		.appointment-patient {
			display: flex;
			align-items: center;
			gap: 8px;
			margin-bottom: 4px;

			.patient-name {
				font-size: 14px;
				font-weight: 500;
				color: $navy;
			}
		}

		.appointment-meta {
			display: flex;
			align-items: center;
			gap: 12px;

			.meta-time {
				display: flex;
				align-items: center;
				gap: 4px;
				font-size: 12px;
				color: $gray;
			}

			.meta-type {
				font-size: 12px;
				color: $gray;
			}
		}
	}

	.item-chevron {
		color: $light-gray;
		flex-shrink: 0;
	}
}

// ============================================
// CALENDAR CARD
// ============================================
.calendar-card {
	.calendar-content {
		padding: 0;
	}
}

.selected-date-appointments {
	margin-top: 16px;
	padding-top: 16px;
	border-top: 1px solid #E2E8F0;

	.selected-date-label {
		font-size: 13px;
		font-weight: 500;
		color: $slate;
		margin: 0 0 12px 0;
	}

	.mini-appointment-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.mini-appointment {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 12px;
		background: $bg;
		border-radius: 10px;
		cursor: pointer;
		font-size: 13px;
		transition: all 0.2s;

		&:hover {
			background: #E2E8F0;
		}

		.mini-time {
			color: $sky-dark;
			font-weight: 600;
		}

		.mini-patient {
			color: $slate;
		}
	}
}

// ============================================
// ACTIVITY FEED
// ============================================
.activity-feed {
	display: flex;
	flex-direction: column;
}

.activity-item {
	display: flex;
	gap: 12px;
	padding: 12px 0;
	border-bottom: 1px solid #F1F5F9;

	&:last-child {
		border-bottom: none;
	}

	.activity-icon {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;

		&.appointment_completed {
			background: $emerald-light;
			color: $emerald;
		}

		&.prescription_written {
			background: $violet-light;
			color: $violet;
		}

		&.note_added {
			background: $sky-light;
			color: $sky-dark;
		}
	}

	.activity-content {
		flex: 1;
		min-width: 0;

		.activity-title {
			font-size: 13px;
			font-weight: 500;
			color: $navy;
			margin: 0 0 2px 0;
		}

		.activity-desc {
			font-size: 12px;
			color: $gray;
			margin: 0 0 4px 0;
		}

		.activity-time {
			font-size: 11px;
			color: $light-gray;
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
	}

	.performance-item {
		text-align: center;
		padding: 16px 8px;
		background: $bg;
		border-radius: 14px;

		.perf-value {
			display: block;
			font-size: 24px;
			font-weight: 700;
			color: $sky-dark;
			line-height: 1.2;

			@media (max-width: 768px) {
				font-size: 20px;
			}
		}

		.perf-label {
			display: block;
			font-size: 12px;
			color: $gray;
			margin-top: 4px;
		}
	}
}

// ============================================
// EMPTY STATES
// ============================================
.empty-state {
	text-align: center;
	padding: 48px 24px;

	&.small {
		padding: 24px;

		p {
			margin: 0;
		}
	}

	.empty-icon {
		width: 80px;
		height: 80px;
		background: $sky-light;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 20px;
		color: $sky;
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

	.empty-action {
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

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 6px 20px rgba($sky, 0.3);
		}
	}
}

// ============================================
// MODAL STYLES (unchanged)
// ============================================
.loader-container {
	min-height: 200px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.appointment-modal-content {
	padding: 24px;
	min-width: 400px;

	@media (max-width: 768px) {
		min-width: auto;
		padding: 16px;
	}

	.modal-patient-info {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 24px;

		.modal-patient-details {
			.modal-patient-name {
				font-size: 20px;
				font-weight: 600;
				color: $navy;
				margin: 0 0 4px 0;
			}

			.modal-patient-category {
				font-size: 14px;
				color: $gray;
				margin: 0;
			}
		}
	}

	.modal-appointment-details {
		.detail-row {
			display: flex;
			flex-direction: column;
			gap: 4px;
			padding: 12px 0;
			border-bottom: 1px solid #F1F5F9;

			&:last-child {
				border-bottom: none;
			}

			.detail-label {
				font-size: 12px;
				color: $gray;
			}

			.detail-value {
				font-size: 14px;
				color: $navy;
				font-weight: 500;
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
		gap: 12px;
	}

	@media (max-width: 768px) {
		flex-direction: column;
		gap: 12px;

		.modal-actions-right {
			width: 100%;
			flex-direction: column;
		}
	}
}

.modal-message {
	font-size: 14px;
	color: $slate;
	line-height: 1.6;
	max-width: 400px;
}

.modal-confirm-actions {
	display: flex;
	justify-content: space-between;
	width: 100%;
}
</style>
