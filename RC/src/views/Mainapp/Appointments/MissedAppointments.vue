<template>
	<div class="loader-container" v-if="isLoading">
		<loader :useOverlay="false" style="position: relative" />
	</div>
	<div v-else class="missed-appointments">
		<!-- Appointments List -->
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
						class="appointment-card card-missed"
					>
						<div class="card-main">
							<div class="specialist-section">
								<div class="specialist-avatar">
									<rc-avatar
										size="md"
										:firstName="appointment.specialist?.profile?.first_name || ''"
										:lastName="appointment.specialist?.profile?.last_name || ''"
										:modelValue="appointment.specialist?.profile?.profile_image"
									/>
								</div>
								<div class="specialist-info">
									<h3 class="specialist-name">{{ appointment.specialist?.full_name || 'Specialist' }}</h3>
									<p class="specialist-category">{{ appointment.category }}</p>
									<div class="appointment-meta">
										<span class="meeting-type" :class="getMeetingTypeClass(appointment.appointment_type)">
											<v-icon
												:name="appointment.appointment_type === 'video' ? 'hi-video-camera' : 'hi-phone'"
												scale="0.7"
											/>
											{{ formatMeetingType(appointment.appointment_type) }}
										</span>
										<span class="status-badge status-missed">
											<v-icon name="hi-exclamation-circle" scale="0.7" />
											Missed
										</span>
									</div>
								</div>
							</div>

							<div class="time-section">
								<div class="time-display">
									<div class="time-info">
										<span class="time-date">{{ format(new Date(appointment.start_time), 'MMM dd, yyyy') }}</span>
										<span class="time-main">{{ format(new Date(appointment.start_time), 'h:mm a') }}</span>
									</div>
								</div>
							</div>
						</div>

						<div class="card-actions">
							<button
								class="action-btn details-btn"
								@click.stop="onShow(appointment)"
							>
								<v-icon name="hi-information-circle" scale="0.9" />
								<span class="btn-text">View Details</span>
							</button>

							<!-- Reschedule button -->
							<button
								class="action-btn reschedule-btn"
								@click.stop="rescheduleAppointment(appointment)"
							>
								<v-icon name="hi-refresh" scale="0.85" />
								<span class="btn-text">Reschedule</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else class="empty-state">
			<div class="empty-illustration">
				<v-icon name="hi-check-circle" scale="4" class="empty-icon" />
			</div>
			<h2 class="empty-title">No Missed Appointments</h2>
			<p class="empty-description">
				Great job! You don't have any missed appointments.
			</p>
		</div>

		<!-- Details Modal -->
		<dialog-modal
			v-if="isOpen"
			title="Missed Appointment"
			@closeModal="isOpen = false"
			:has-footer="true"
			class="missed-details-modal"
		>
			<template v-slot:body>
				<div class="loader-container modal-loader" v-if="isFetching">
					<loader :useOverlay="false" style="position: relative" />
				</div>
				<div v-else class="modal-content">
					<!-- Status Banner -->
					<div class="status-banner status-missed">
						<v-icon name="hi-exclamation-circle" scale="1" />
						<span>Missed Appointment</span>
					</div>

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
								<span>Meeting Type</span>
							</div>
							<p class="detail-value">{{ formatMeetingType(specialistInfo.appointmentType) }}</p>
						</div>
					</div>

					<div class="missed-info-box">
						<v-icon name="hi-information-circle" scale="1" />
						<p>This appointment was missed. You can reschedule with the same specialist if needed.</p>
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<div class="modal-actions">
					<rc-button
						type="secondary"
						label="Close"
						@click="isOpen = false"
					/>
					<rc-button
						type="primary"
						label="Reschedule"
						@click="rescheduleAppointment(appointment)"
					/>
				</div>
			</template>
		</dialog-modal>
	</div>
</template>

<script setup>
import { groupBy } from "lodash";
import { format } from "date-fns";
import { useRouter } from 'vue-router';
import { ref, inject, onMounted } from 'vue'
import RcAvatar from "@/components/RCAvatar";
import RcButton from "@/components/buttons/button-primary.vue";
import Loader from "@/components/Loader/main-loader.vue";
import DialogModal from "@/components/modals/dialog-modal.vue";

const $http = inject('$http');
const router = useRouter();

const emit = defineEmits(['create', 'stats-updated']);

const appointment = ref({});
const isLoading = ref(true);
const isFetching = ref(true);
const isOpen = ref(false);
const appointmentItems = ref([]);
const specialistInfo = ref({});

onMounted(() => getUserAppointments());

const formatMeetingType = (type) => {
	if (!type) return 'Video';
	return type.charAt(0).toUpperCase() + type.slice(1);
};

const getMeetingTypeClass = (type) => {
	return type === 'video' ? 'type-video' : 'type-audio';
};

async function getUserAppointments() {
	isLoading.value = true;
	const queryParams = {
		currentPage: 1,
		pageLimit: 50,
		status: 'MISSED'
	};

	try {
		const { data } = await $http.$_getPatientAppointments(queryParams);
		appointmentItems.value = groupBy(data.data?.map((item) => ({
			...item, startTime: format(new Date(item.start_time), 'EEEE, MMMM dd, yyyy')
		})), 'startTime');

		// Emit stats update
		emit('stats-updated', { missed: data.data?.length || 0 });
	} catch (error) {
		console.error('Error fetching appointments:', error);
	} finally {
		isLoading.value = false;
	}
}

const onShow = async (activeItem) => {
	isFetching.value = true;
	isOpen.value = true;
	appointment.value = activeItem;
	const userId = activeItem.specialist?.id || activeItem.specialist?._id;

	if (!userId) {
		specialistInfo.value = {
			fullName: 'Unknown Specialist',
			firstName: 'Unknown',
			lastName: '',
			photo: null,
			rating: null,
			category: activeItem.category,
			startTime: activeItem.start_time,
			appointmentType: activeItem.appointment_type,
			timezone: activeItem.timezone
		};
		isFetching.value = false;
		return;
	}

	try {
		const { data } = await $http.$_getOneUser(userId);
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
	} catch (error) {
		console.error('Error fetching specialist:', error);
	} finally {
		isFetching.value = false;
	}
};

const rescheduleAppointment = (appt) => {
	isOpen.value = false;
	router.push({
		name: 'BookAppointment',
		query: {
			mode: 'reschedule',
			appointmentId: appt._id,
			specialistId: appt.specialist?.id || appt.specialist?._id,
			category: appt.category,
			step: '3',
		}
	});
};
</script>

<style scoped lang="scss">
.missed-appointments {
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
	gap: $size-24;
}

.date-group {
	display: flex;
	flex-direction: column;
	gap: $size-12;
}

.date-header {
	display: flex;
	align-items: center;
	gap: $size-10;
	padding: $size-10 $size-16;
	background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%);
	border-radius: $size-12;
	border-left: 3px solid #f97316;

	.date-icon {
		color: #f97316;
	}

	.date-text {
		font-size: $size-15;
		font-weight: $fw-semi-bold;
		color: $color-g-21;
	}
}

.appointments-cards {
	display: flex;
	flex-direction: column;
	gap: $size-12;
}

.appointment-card {
	background: white;
	border-radius: $size-16;
	padding: $size-20;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
	border-left: 4px solid #f97316;
	transition: all 0.2s ease;

	&:hover {
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
	}

	&.card-missed {
		background: linear-gradient(135deg, #fff7ed 0%, #ffffff 50%);
	}
}

.card-main {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: $size-16;
	margin-bottom: $size-16;

	@include responsive(phone) {
		flex-direction: column;
	}
}

.specialist-section {
	display: flex;
	align-items: flex-start;
	gap: $size-14;
	flex: 1;
}

.specialist-info {
	display: flex;
	flex-direction: column;
	gap: $size-4;
}

.specialist-name {
	font-size: $size-16;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0;
}

.specialist-category {
	font-size: $size-13;
	color: $color-g-44;
	margin: 0;
}

.appointment-meta {
	display: flex;
	align-items: center;
	gap: $size-8;
	margin-top: $size-6;
	flex-wrap: wrap;
}

.meeting-type {
	display: inline-flex;
	align-items: center;
	gap: $size-4;
	padding: $size-4 $size-8;
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
	gap: $size-4;
	padding: $size-4 $size-8;
	border-radius: $size-6;
	font-size: $size-12;
	font-weight: $fw-medium;

	&.status-missed {
		background: rgba(249, 115, 22, 0.1);
		color: #ea580c;
	}
}

.time-section {
	flex-shrink: 0;
}

.time-display {
	display: flex;
	align-items: center;
	gap: $size-8;
	padding: $size-10 $size-14;
	background: linear-gradient(135deg, #fff7ed 0%, #fef2f2 100%);
	border-radius: $size-8;
}

.time-info {
	display: flex;
	flex-direction: column;
	gap: $size-2;
	text-align: right;
}

.time-date {
	font-size: $size-12;
	color: $color-g-44;
}

.time-main {
	font-size: $size-15;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
}

.card-actions {
	display: flex;
	gap: $size-10;
	padding-top: $size-14;
	border-top: 1px solid $color-g-92;

	@include responsive(phone) {
		flex-direction: column;
	}
}

.action-btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: $size-6;
	padding: $size-10 $size-16;
	border-radius: $size-10;
	font-size: $size-13;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;
	border: none;

	.btn-text {
		@include responsive(phone) {
			display: inline;
		}
	}

	&.details-btn {
		background: $color-g-97;
		color: $color-g-44;

		&:hover {
			background: $color-g-92;
			color: $color-g-21;
		}
	}

	&.reschedule-btn {
		background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
		color: white;

		&:hover {
			transform: translateY(-1px);
			box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
		}
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
	width: 100px;
	height: 100px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
	border-radius: 50%;
	margin-bottom: $size-20;

	.empty-icon {
		color: #10b981;
	}
}

.empty-title {
	font-size: $size-22;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0 0 $size-10;
}

.empty-description {
	font-size: $size-15;
	color: $color-g-44;
	max-width: 350px;
	line-height: 1.5;
	margin: 0;
}

// Modal Styles
.modal-content {
	display: flex;
	flex-direction: column;
	gap: $size-20;
}

.status-banner {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $size-10;
	padding: $size-14;
	border-radius: $size-12;
	font-weight: $fw-semi-bold;

	&.status-missed {
		background: linear-gradient(135deg, #fff7ed 0%, #fef2f2 100%);
		color: #ea580c;
	}
}

.modal-specialist-card {
	background: $color-g-97;
	border-radius: $size-12;
	padding: $size-16;
}

.modal-specialist-header {
	display: flex;
	align-items: center;
	gap: $size-14;
}

.modal-specialist-info {
	flex: 1;
}

.modal-specialist-name {
	font-size: $size-18;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0 0 $size-4;
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
	margin-top: $size-6;
	color: $color-g-21;
	font-weight: $fw-medium;

	.rating-star {
		color: #fbbf24;
	}
}

.modal-details-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $size-16;

	@include responsive(phone) {
		grid-template-columns: 1fr;
	}
}

.detail-item {
	.detail-label {
		display: flex;
		align-items: center;
		gap: $size-6;
		font-size: $size-12;
		color: $color-g-44;
		margin-bottom: $size-4;

		svg {
			color: #f97316;
		}
	}

	.detail-value {
		font-size: $size-14;
		font-weight: $fw-medium;
		color: $color-g-21;
		margin: 0;
	}

	.timezone-text {
		font-size: $size-12;
		color: $color-g-54;
		font-weight: $fw-regular;
	}
}

.missed-info-box {
	display: flex;
	align-items: flex-start;
	gap: $size-12;
	padding: $size-14;
	background: linear-gradient(135deg, #fff7ed 0%, #fef2f2 100%);
	border-radius: $size-12;
	border: 1px solid rgba(249, 115, 22, 0.2);

	svg {
		color: #f97316;
		flex-shrink: 0;
		margin-top: 2px;
	}

	p {
		font-size: $size-13;
		color: $color-g-44;
		margin: 0;
		line-height: 1.5;
	}
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: $size-12;
	width: 100%;
}

.loader-container {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 200px;

	&.modal-loader {
		min-height: 150px;
	}
}
</style>
