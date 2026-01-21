<template>
	<div class="loader-container" v-if="isLoading">
		<loader :useOverlay="false" style="position: relative" />
	</div>
	<div v-else class="upcoming-appointments">
		<div class="appointments-list" v-if="Object.keys(appointmentItems).length">
			<div
				v-for="(appointments, timestamp, index) in appointmentItems"
				:key="timestamp + index"
				class="date-group"
			>
				<div class="date-header">
					<v-icon name="hi-calendar" scale="0.9" class="date-icon" />
					<span class="date-text">{{ timestamp }}</span>
				</div>

				<div class="appointments-cards">
					<div
						v-for="appointment in appointments"
						:key="appointment.id"
						class="appointment-card"
						:class="{
							'status-confirmed': appointment.status === 'OPEN',
							'status-pending': appointment.status === 'PENDING'
						}"
					>
						<div class="card-main">
							<div class="specialist-section">
								<div class="specialist-avatar">
									<rc-avatar
										size="md"
										:firstName="appointment.specialist.profile?.first_name || ''"
										:lastName="appointment.specialist.profile?.last_name || ''"
										:modelValue="appointment.specialist?.profile?.profile_image"
									/>
								</div>
								<div class="specialist-info">
									<h3 class="specialist-name">{{ appointment.specialist.full_name }}</h3>
									<p class="specialist-category">{{ appointment.category }}</p>
									<div class="appointment-meta">
										<span class="meeting-type" :class="getMeetingTypeClass(appointment.appointment_type)">
											<v-icon
												:name="appointment.appointment_type === 'video' ? 'hi-video-camera' : 'hi-phone'"
												scale="0.7"
											/>
											{{ formatMeetingType(appointment.appointment_type) }}
										</span>
										<span class="status-badge" :class="getStatusClass(appointment.status)">
											{{ formatStatus(appointment.status) }}
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

						<div class="card-actions">
							<button
								class="action-btn calendar-btn"
								@click.stop="addToCalendar(appointment)"
								title="Add to Calendar"
							>
								<v-icon name="bi-calendar-4-event" scale="0.85" />
								<span class="btn-text">Add to Calendar</span>
							</button>

							<div class="action-divider"></div>

							<button
								class="action-btn details-btn"
								@click.stop="onShow(appointment)"
							>
								<v-icon name="hi-information-circle" scale="0.9" />
								<span class="btn-text">Details</span>
							</button>

							<button
								class="action-btn reschedule-btn"
								@click.stop="openRescheduleConfirm(appointment)"
							>
								<v-icon name="hi-refresh" scale="0.85" />
								<span class="btn-text">Reschedule</span>
							</button>

							<button
								class="action-btn cancel-btn"
								@click.stop="openCancelConfirm(appointment)"
							>
								<v-icon name="hi-x-circle" scale="0.85" />
								<span class="btn-text">Cancel</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else class="empty-state">
			<div class="empty-illustration">
				<v-icon name="hi-calendar" scale="4" class="empty-icon" />
			</div>
			<h2 class="empty-title">No Upcoming Appointments</h2>
			<p class="empty-description">
				Your upcoming appointments will appear here once booked.
				Schedule a consultation with a specialist today.
			</p>
		</div>

		<!-- Appointment Details Modal -->
		<dialog-modal
			v-if="isOpen"
			title="Appointment Details"
			@closeModal="isOpen = false"
			:has-footer="true"
			class="appointment-details-modal"
		>
			<template v-slot:body>
				<div class="loader-container modal-loader" v-if="isFetching">
					<loader :useOverlay="false" style="position: relative" />
				</div>
				<div v-else class="modal-content">
					<div class="modal-specialist-card">
						<div class="modal-specialist-header">
							<rc-avatar
								size="lg"
								:firstName="specialistInfo.firstName"
								:lastName="specialistInfo.lastName"
								v-model="specialistInfo.photo"
							/>
							<div class="modal-specialist-info">
								<h2 class="modal-specialist-name">{{ specialistInfo.fullName }}</h2>
								<p class="modal-specialist-category">{{ specialistInfo.category }}</p>
								<div class="modal-specialist-rating" v-if="specialistInfo.rating">
									<v-icon name="bi-star-fill" scale="0.75" class="rating-star" />
									<span>{{ specialistInfo.rating?.toFixed(1) }}</span>
								</div>
							</div>
						</div>
					</div>

					<div class="modal-details-grid">
						<div class="detail-item">
							<div class="detail-label">
								<v-icon name="hi-calendar" scale="0.85" />
								<span>Date</span>
							</div>
							<p class="detail-value">
								{{ format(new Date(specialistInfo.startTime), 'EEEE, MMMM dd, yyyy') }}
							</p>
						</div>

						<div class="detail-item">
							<div class="detail-label">
								<v-icon name="hi-clock" scale="0.85" />
								<span>Time</span>
							</div>
							<p class="detail-value">
								{{ format(new Date(specialistInfo.startTime), 'h:mm a') }}
								<span class="timezone-text">{{ specialistInfo.timezone }}</span>
							</p>
						</div>

						<div class="detail-item">
							<div class="detail-label">
								<v-icon name="hi-video-camera" scale="0.85" />
								<span>Type</span>
							</div>
							<p class="detail-value">{{ specialistInfo.appointmentType }}</p>
						</div>
					</div>

					<div class="modal-calendar-action">
						<button class="add-calendar-btn" @click="addToCalendar(appointment)">
							<v-icon name="bi-calendar-4-event" scale="0.9" />
							<span>Add to Calendar</span>
						</button>
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<div class="modal-actions" v-if="!isFetching">
					<rc-button
						type="tertiary"
						style="border:0; color: #ef4444;"
						label="Cancel Appointment"
						class="modal-cancel-btn"
						:disabled="isFetching || !appointment.start_url"
						@click="isOpenCancelAppointment = true"
					/>
					<div class="modal-meeting-actions">
						<rc-button
							type="tertiary"
							label="Reschedule"
							class="modal-reschedule-btn"
							@click="isOpenScheduleAppointment = true"
							:disabled="isFetching || !appointment.start_url"
						/>
						<rc-button
							type="primary"
							label="Start Meeting"
							class="modal-start-btn"
							:disabled="isFetching || !appointment.start_url"
							@click="onStartMeetings(appointment)"
						/>
					</div>
				</div>
			</template>
		</dialog-modal>

		<!-- Cancel Confirmation Modal -->
		<dialog-modal
			v-if="isOpenCancelAppointment"
			@closeModal="isOpenCancelAppointment = false"
			:has-footer="true"
			title="Cancel Appointment"
			class="confirm-modal"
		>
			<template v-slot:body>
				<div class="confirm-content">
					<div class="confirm-icon warning">
						<v-icon name="hi-exclamation-circle" scale="2" />
					</div>
					<p class="confirm-message">
						Canceling your appointment less than 12 hours before the scheduled
						time will result in a surcharge fee. Are you sure you want to proceed?
					</p>
				</div>
			</template>
			<template v-slot:foot>
				<div class="confirm-actions">
					<rc-button
						label="Keep Appointment"
						type="tertiary"
						size="small"
						:disabled="isLoadingCancelAppointment"
						@click="isOpenCancelAppointment = false"
					/>
					<rc-button
						label="Yes, Cancel"
						type="primary"
						size="small"
						style="background: #ef4444; border-color: #ef4444;"
						:loading="isLoadingCancelAppointment"
						:disabled="isLoadingCancelAppointment"
						@click="onSubmitCancelAppointment(appointment)"
					/>
				</div>
			</template>
		</dialog-modal>

		<!-- Reschedule Confirmation Modal -->
		<dialog-modal
			v-if="isOpenScheduleAppointment"
			@closeModal="isOpenScheduleAppointment = false"
			:has-footer="true"
			title="Reschedule Appointment"
			class="confirm-modal"
		>
			<template v-slot:body>
				<div class="confirm-content">
					<div class="confirm-icon info">
						<v-icon name="hi-information-circle" scale="2" />
					</div>
					<p class="confirm-message">
						Rescheduling your appointment less than 12 hours before
						the scheduled time will result in a surcharge fee.
						Are you sure you want to proceed?
					</p>
				</div>
			</template>
			<template v-slot:foot>
				<div class="confirm-actions">
					<rc-button
						label="Keep Current Time"
						type="tertiary"
						size="small"
						:disabled="isLoadingScheduleAppointment"
						@click="isOpenScheduleAppointment = false"
					/>
					<rc-button
						label="Yes, Reschedule"
						type="primary"
						size="small"
						:loading="isLoadingScheduleAppointment"
						:disabled="isLoadingCancelAppointment"
						@click="onSubmitRescheduleAppointment(appointment)"
					/>
				</div>
			</template>
		</dialog-modal>

		<reschedule ref="rescheduleAppointmentRef" />
	</div>
</template>

<script setup>
import { groupBy } from "lodash";
import { format } from "date-fns";
import { useRouter } from 'vue-router';
import { ref, inject, onMounted } from 'vue'
import { useToast } from "vue-toast-notification";
import RcAvatar from "@/components/RCAvatar";
import RcButton from "@/components/buttons/button-primary.vue";
import Loader from "@/components/Loader/main-loader.vue";
import DialogModal from "@/components/modals/dialog-modal.vue";
import Reschedule from "./reschedule";

const $http = inject('$_HTTP');
const { bookingInfo, useBookingInfo } = inject('$_BOOKING_INFO');
const router = useRouter();
const $toast = useToast();

const isOpenCancelAppointment = ref(false);
const isLoadingCancelAppointment = ref(false);
const isOpenScheduleAppointment = ref(false);
const isLoadingScheduleAppointment = ref(false);

const appointments = ref([]);
const appointment = ref({});
const isLoading = ref(true);
const isFetching = ref(true);
const isOpen = ref(false);
const appointmentItems = ref([]);
const specialistInfo = ref({});
const rescheduleAppointmentRef = ref();

onMounted(() => getUserAppointments());

const formatMeetingType = (type) => {
	if (!type) return 'Video';
	return type.charAt(0).toUpperCase() + type.slice(1);
};

const getMeetingTypeClass = (type) => {
	return type === 'video' ? 'type-video' : 'type-audio';
};

const formatStatus = (status) => {
	const statusMap = {
		'OPEN': 'Confirmed',
		'PENDING': 'Pending',
		'CONFIRMED': 'Confirmed'
	};
	return statusMap[status] || status;
};

const getStatusClass = (status) => {
	const classMap = {
		'OPEN': 'status-confirmed',
		'PENDING': 'status-pending',
		'CONFIRMED': 'status-confirmed'
	};
	return classMap[status] || '';
};

const addToCalendar = (appt) => {
	const startDate = new Date(appt.start_time);
	const endDate = new Date(startDate.getTime() + (appt.duration || 30) * 60000);

	const formatDate = (date) => {
		return date.toISOString().replace(/-|:|\.\d\d\d/g, '');
	};

	const title = encodeURIComponent(`Appointment with ${appt.specialist.full_name}`);
	const details = encodeURIComponent(`Medical consultation - ${appt.category}\n\nMeeting type: ${formatMeetingType(appt.appointment_type)}`);
	const dates = `${formatDate(startDate)}/${formatDate(endDate)}`;

	// Google Calendar URL
	const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;

	window.open(googleUrl, '_blank');
};

const onStartMeetings = (appointment) => {
	router.push({
		name: 'SpecialistMeetings',
		params: {
			patientId: appointment.patient.id,
			meetingId: appointment.meeting_id
		}
	});
};

async function getUserAppointments() {
	isLoading.value = true;
	const queryParams = {
		currentPage: 1,
		pageLimit: 20,
		status: 'OPEN'
	};

	await $http.$_getPatientAppointments(queryParams).then(({ data }) => {
		appointmentItems.value = groupBy(data.data?.map((item) => ({
			...item, startTime: format(new Date(item.start_time), 'EEEE, MMMM dd, yyyy')
		})), 'startTime');
		isLoading.value = false;
	}).catch(() => {
		isLoading.value = false;
	});
}

const onShow = async (activeItem) => {
	isFetching.value = true;
	isOpen.value = true;
	appointment.value = activeItem;
	const userId = activeItem.specialist.id;

	await $http.$_getOneUser(userId).then(({ data }) => {
		specialistInfo.value = {
			fullName: data.data?.full_name,
			firstName: data.data?.profile?.first_name,
			lastName: data.data?.profile?.last_name,
			photo: data.data?.profile?.profile_image,
			rating: data.data.average_rating,
			category: activeItem.category,
			startTime: activeItem.start_time,
			appointmentType: activeItem.appointment_type,
			timezone: activeItem.timezone
		};
		isFetching.value = false;
	}).catch(() => {
		isFetching.value = false;
	});
};

const openCancelConfirm = (appt) => {
	appointment.value = appt;
	isOpenCancelAppointment.value = true;
};

const openRescheduleConfirm = (appt) => {
	appointment.value = appt;
	isOpenScheduleAppointment.value = true;
};

const onSubmitCancelAppointment = async (appt) => {
	isLoadingCancelAppointment.value = true;
	const payload = { appointmentId: appt._id, status: 'CANCELLED' };

	await $http.$_cancelAppointments(payload).then(() => {
		$toast.success('Appointment cancelled successfully!');
		isLoadingCancelAppointment.value = false;
		isOpenCancelAppointment.value = false;
		isOpen.value = false;
		getUserAppointments();
	}).catch((error) => {
		$toast.error(error.message);
		isLoadingCancelAppointment.value = false;
	});
};

const onSubmitRescheduleAppointment = (appt) => {
	useBookingInfo({ payload: { ...bookingInfo.value.payload, appointment: appt } });
	rescheduleAppointmentRef.value.onOpen(appt || {});
	isOpenScheduleAppointment.value = false;
	isOpen.value = false;
};
</script>

<style scoped lang="scss">
.upcoming-appointments {
	height: 100%;
	overflow-y: auto;
	padding-bottom: 100px;

	&::-webkit-scrollbar {
		display: none;
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
	padding: $size-8 $size-16;
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

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
	}

	&.status-pending {
		border-left-color: #f59e0b;
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
	margin-bottom: $size-20;

	@media (max-width: 768px) {
		flex-direction: column;
		gap: $size-16;
	}
}

.specialist-section {
	display: flex;
	align-items: flex-start;
	gap: $size-16;
	flex: 1;
}

.specialist-avatar {
	flex-shrink: 0;
}

.specialist-info {
	display: flex;
	flex-direction: column;
	gap: $size-6;
}

.specialist-name {
	font-size: $size-18;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0;

	@media (max-width: 768px) {
		font-size: $size-16;
	}
}

.specialist-category {
	font-size: $size-14;
	color: $color-g-44;
	margin: 0;
}

.appointment-meta {
	display: flex;
	align-items: center;
	gap: $size-12;
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

.status-badge {
	display: inline-flex;
	align-items: center;
	padding: $size-4 $size-10;
	border-radius: $size-6;
	font-size: $size-12;
	font-weight: $fw-medium;

	&.status-confirmed {
		background: #dcfce7;
		color: #16a34a;
	}

	&.status-pending {
		background: #fef3c7;
		color: #d97706;
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

.card-actions {
	display: flex;
	align-items: center;
	gap: $size-8;
	padding-top: $size-16;
	border-top: 1px solid $color-g-90;

	@media (max-width: 768px) {
		flex-wrap: wrap;
		justify-content: center;
	}
}

.action-btn {
	display: inline-flex;
	align-items: center;
	gap: $size-6;
	padding: $size-8 $size-14;
	border: none;
	border-radius: $size-8;
	font-size: $size-13;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;
	background: transparent;

	&:hover {
		transform: translateY(-1px);
	}

	.btn-text {
		@media (max-width: 480px) {
			display: none;
		}
	}

	@media (max-width: 480px) {
		padding: $size-10;
	}
}

.calendar-btn {
	color: #0EAEC4;
	background: rgba(14, 174, 196, 0.1);

	&:hover {
		background: rgba(14, 174, 196, 0.2);
	}
}

.details-btn {
	color: $color-g-44;

	&:hover {
		background: $color-g-90;
		color: $color-g-21;
	}
}

.reschedule-btn {
	color: #f59e0b;

	&:hover {
		background: rgba(245, 158, 11, 0.1);
	}
}

.cancel-btn {
	color: #ef4444;

	&:hover {
		background: rgba(239, 68, 68, 0.1);
	}
}

.action-divider {
	width: 1px;
	height: $size-20;
	background: $color-g-90;

	@media (max-width: 768px) {
		display: none;
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

// Modal Styles
.loader-container {
	width: 100%;
	height: 50vh;
	display: flex;
	align-items: center;
	justify-content: center;

	&.modal-loader {
		height: 200px;
	}
}

.modal-content {
	padding: $size-24;

	@media (max-width: 768px) {
		padding: $size-16;
	}
}

.modal-specialist-card {
	margin-bottom: $size-24;
}

.modal-specialist-header {
	display: flex;
	align-items: center;
	gap: $size-20;

	@media (max-width: 768px) {
		flex-direction: column;
		text-align: center;
	}
}

.modal-specialist-info {
	display: flex;
	flex-direction: column;
	gap: $size-4;
}

.modal-specialist-name {
	font-size: $size-22;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0;
}

.modal-specialist-category {
	font-size: $size-14;
	color: $color-g-44;
	margin: 0;
}

.modal-specialist-rating {
	display: flex;
	align-items: center;
	gap: $size-4;
	margin-top: $size-4;

	.rating-star {
		color: #fbbf24;
	}

	span {
		font-size: $size-14;
		font-weight: $fw-medium;
		color: $color-g-44;
	}
}

.modal-details-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: $size-20;
	margin-bottom: $size-24;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
	}
}

.detail-item {
	display: flex;
	flex-direction: column;
	gap: $size-8;
}

.detail-label {
	display: flex;
	align-items: center;
	gap: $size-6;
	font-size: $size-12;
	color: $color-g-44;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.detail-value {
	font-size: $size-15;
	font-weight: $fw-medium;
	color: $color-g-21;
	margin: 0;

	.timezone-text {
		font-size: $size-12;
		color: $color-g-44;
		margin-left: $size-4;
	}
}

.modal-calendar-action {
	display: flex;
	justify-content: center;
}

.add-calendar-btn {
	display: inline-flex;
	align-items: center;
	gap: $size-8;
	padding: $size-12 $size-24;
	background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
	color: white;
	border: none;
	border-radius: $size-10;
	font-size: $size-14;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(14, 174, 196, 0.3);
	}
}

.modal-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	gap: $size-16;

	@media (max-width: 768px) {
		flex-direction: column-reverse;
	}
}

.modal-meeting-actions {
	display: flex;
	align-items: center;
	gap: $size-12;

	@media (max-width: 768px) {
		width: 100%;
		flex-direction: column-reverse;

		button {
			width: 100% !important;
		}
	}
}

// Confirmation Modal
.confirm-content {
	padding: $size-24;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: $size-20;
	max-width: 400px;

	@media (max-width: 768px) {
		padding: $size-16;
	}
}

.confirm-icon {
	width: 64px;
	height: 64px;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;

	&.warning {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	&.info {
		background: rgba(14, 174, 196, 0.1);
		color: #0EAEC4;
	}
}

.confirm-message {
	font-size: $size-15;
	color: $color-g-21;
	line-height: 1.6;
	margin: 0;
}

.confirm-actions {
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: $size-12;

	@media (max-width: 768px) {
		flex-direction: column;

		button {
			width: 100% !important;
		}
	}
}

// Modal deep styles
:deep(.appointment-details-modal .modal__body) {
	width: 580px !important;

	@media (max-width: 768px) {
		width: 100% !important;
	}
}

:deep(.appointment-details-modal .modal__footer) {
	padding: $size-20 $size-24;
}

:deep(.confirm-modal .modal__body) {
	width: auto !important;

	@media (max-width: 768px) {
		width: 100% !important;
	}
}
</style>
