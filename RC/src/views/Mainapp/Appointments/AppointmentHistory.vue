<template>
	<div class="loader-container" v-if="isLoading">
		<loader :useOverlay="false" style="position: relative" />
	</div>
	<div v-else class="history-appointments">
		<!-- Filter Pills -->
		<div class="filter-section" v-if="Object.keys(appointmentItems).length || activeFilter !== 'all'">
			<button
				v-for="filter in filters"
				:key="filter.value"
				class="filter-pill"
				:class="{ active: activeFilter === filter.value }"
				@click="setFilter(filter.value)"
			>
				<span class="filter-count" v-if="filter.count > 0">{{ filter.count }}</span>
				{{ filter.label }}
			</button>
		</div>

		<!-- Appointments List -->
		<div class="appointments-list" v-if="Object.keys(filteredAppointments).length">
			<div
				v-for="(appointments, timestamp, index) in filteredAppointments"
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
						:class="getCardClass(appointment.status)"
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
											<v-icon :name="getStatusIcon(appointment.status)" scale="0.7" />
											{{ formatStatus(appointment.status) }}
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

								<!-- Rating Display -->
								<div class="rating-display" v-if="appointment.rating && appointment.status === 'CLOSED'">
									<div class="rating-stars">
										<v-icon
											v-for="star in 5"
											:key="star"
											:name="star <= appointment.rating.score ? 'bi-star-fill' : 'hi-star'"
											scale="0.7"
											:class="star <= appointment.rating.score ? 'star-filled' : 'star-empty'"
										/>
									</div>
									<span class="rating-text">Your rating</span>
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

							<!-- Rate button for completed appointments without rating -->
							<button
								v-if="appointment.status === 'CLOSED' && !appointment.rating"
								class="action-btn rate-btn"
								@click.stop="openRatingModal(appointment)"
							>
								<v-icon name="bi-star-fill" scale="0.85" />
								<span class="btn-text">Rate Appointment</span>
							</button>

							<!-- Book Follow-up for completed appointments -->
							<button
								v-if="appointment.status === 'CLOSED'"
								class="action-btn followup-btn"
								@click.stop="bookFollowUp(appointment)"
							>
								<v-icon name="hi-refresh" scale="0.85" />
								<span class="btn-text">Book Follow-up</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Empty State -->
		<div v-else class="empty-state">
			<div class="empty-illustration">
				<v-icon name="hi-clipboard-check" scale="4" class="empty-icon" />
			</div>
			<h2 class="empty-title">No Appointment History</h2>
			<p class="empty-description">
				{{ activeFilter !== 'all'
					? `You have no ${activeFilter.toLowerCase()} appointments.`
					: 'Your completed, cancelled, and missed appointments will appear here.'
				}}
			</p>
			<button v-if="activeFilter !== 'all'" class="clear-filter-btn" @click="setFilter('all')">
				<v-icon name="hi-x" scale="0.85" />
				Clear Filter
			</button>
		</div>

		<!-- Details Modal -->
		<dialog-modal
			v-if="isOpen"
			title="Appointment Details"
			@closeModal="isOpen = false"
			:has-footer="true"
			class="history-details-modal"
		>
			<template v-slot:body>
				<div class="loader-container modal-loader" v-if="isFetching">
					<loader :useOverlay="false" style="position: relative" />
				</div>
				<div v-else class="modal-content">
					<!-- Status Banner -->
					<div class="status-banner" :class="getStatusClass(appointment.status)">
						<v-icon :name="getStatusIcon(appointment.status)" scale="1" />
						<span>{{ formatStatus(appointment.status) }}</span>
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
								<span>Type</span>
							</div>
							<p class="detail-value">{{ specialistInfo.appointmentType }}</p>
						</div>
					</div>

					<!-- Your Rating Section -->
					<div class="rating-section" v-if="appointment.rating">
						<h4 class="section-title">Your Rating</h4>
						<div class="rating-content">
							<div class="rating-stars-large">
								<v-icon
									v-for="star in 5"
									:key="star"
									:name="star <= appointment.rating.score ? 'bi-star-fill' : 'hi-star'"
									scale="1.2"
									:class="star <= appointment.rating.score ? 'star-filled' : 'star-empty'"
								/>
							</div>
							<p class="rating-review" v-if="appointment.rating.review">
								"{{ appointment.rating.review }}"
							</p>
						</div>
					</div>

					<!-- Rate Prompt -->
					<div class="rate-prompt" v-else-if="appointment.status === 'CLOSED'">
						<v-icon name="bi-star-fill" scale="1.2" class="prompt-icon" />
						<div class="prompt-content">
							<h4>How was your experience?</h4>
							<p>Help others by rating this consultation</p>
						</div>
						<button class="rate-now-btn" @click="openRatingModal(appointment)">
							Rate Now
						</button>
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<div class="modal-actions" v-if="!isFetching">
					<button class="modal-close-btn" @click="isOpen = false">
						Close
					</button>
					<button
						v-if="appointment.status === 'CLOSED'"
						class="modal-followup-btn"
						@click="bookFollowUp(appointment)"
					>
						<v-icon name="hi-refresh" scale="0.9" />
						Book Follow-up
					</button>
				</div>
			</template>
		</dialog-modal>

		<!-- Rating Modal -->
		<dialog-modal
			v-if="isRatingModalOpen"
			title="Rate Your Appointment"
			@closeModal="isRatingModalOpen = false"
			:has-footer="true"
			class="rating-modal"
		>
			<template v-slot:body>
				<div class="rating-modal-content">
					<div class="rating-specialist">
						<rc-avatar
							size="md"
							:firstName="ratingAppointment?.specialist?.profile?.first_name || ''"
							:lastName="ratingAppointment?.specialist?.profile?.last_name || ''"
						/>
						<div class="rating-specialist-info">
							<h3>{{ ratingAppointment?.specialist?.full_name }}</h3>
							<p>{{ ratingAppointment?.category }}</p>
						</div>
					</div>

					<div class="rating-input">
						<p class="rating-question">How would you rate this consultation?</p>
						<div class="rating-stars-input">
							<button
								v-for="star in 5"
								:key="star"
								class="star-btn"
								:class="{ active: star <= ratingScore }"
								@click="ratingScore = star"
							>
								<v-icon
									:name="star <= ratingScore ? 'bi-star-fill' : 'hi-star'"
									scale="1.5"
								/>
							</button>
						</div>
						<p class="rating-label">{{ getRatingLabel(ratingScore) }}</p>
					</div>

					<div class="review-input">
						<label for="review">Add a review (optional)</label>
						<textarea
							id="review"
							v-model="ratingReview"
							placeholder="Share your experience with this specialist..."
							rows="4"
						></textarea>
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<div class="rating-modal-actions">
					<rc-button
						type="tertiary"
						label="Cancel"
						@click="isRatingModalOpen = false"
					/>
					<rc-button
						type="primary"
						label="Submit Rating"
						:loading="isSubmittingRating"
						:disabled="ratingScore === 0 || isSubmittingRating"
						@click="submitRating"
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
import { ref, inject, onMounted, computed } from 'vue'
import { useToast } from "vue-toast-notification";
import RcAvatar from "@/components/RCAvatar";
import RcButton from "@/components/buttons/button-primary.vue";
import Loader from "@/components/Loader/main-loader.vue";
import DialogModal from "@/components/modals/dialog-modal.vue";

const $http = inject('$http');
const { bookingInfo, useBookingInfo } = inject('$_BOOKING_INFO');
const router = useRouter();
const $toast = useToast();

const appointments = ref([]);
const appointment = ref({});
const isLoading = ref(true);
const isFetching = ref(true);
const isOpen = ref(false);
const appointmentItems = ref([]);
const specialistInfo = ref({});
const activeFilter = ref('all');

// Rating modal state
const isRatingModalOpen = ref(false);
const ratingAppointment = ref(null);
const ratingScore = ref(0);
const ratingReview = ref('');
const isSubmittingRating = ref(false);

const filters = computed(() => [
	{ label: 'All', value: 'all', count: getTotalCount() },
	{ label: 'Completed', value: 'CLOSED', count: getStatusCount('CLOSED') },
	{ label: 'Cancelled', value: 'CANCELLED', count: getStatusCount('CANCELLED') },
	{ label: 'Missed', value: 'MISSED', count: getStatusCount('MISSED') },
]);

const filteredAppointments = computed(() => {
	if (activeFilter.value === 'all') return appointmentItems.value;

	const filtered = {};
	Object.entries(appointmentItems.value).forEach(([date, appts]) => {
		const filteredAppts = appts.filter(a => a.status === activeFilter.value);
		if (filteredAppts.length > 0) {
			filtered[date] = filteredAppts;
		}
	});
	return filtered;
});

onMounted(() => getUserAppointments());

function getTotalCount() {
	let count = 0;
	Object.values(appointmentItems.value).forEach(appts => {
		count += appts.length;
	});
	return count;
}

function getStatusCount(status) {
	let count = 0;
	Object.values(appointmentItems.value).forEach(appts => {
		count += appts.filter(a => a.status === status).length;
	});
	return count;
}

function setFilter(filter) {
	activeFilter.value = filter;
}

const formatMeetingType = (type) => {
	if (!type) return 'Video';
	return type.charAt(0).toUpperCase() + type.slice(1);
};

const getMeetingTypeClass = (type) => {
	return type === 'video' ? 'type-video' : 'type-audio';
};

const formatStatus = (status) => {
	const statusMap = {
		'CLOSED': 'Completed',
		'CANCELLED': 'Cancelled',
		'MISSED': 'Missed',
		'NO_SHOW': 'No Show'
	};
	return statusMap[status] || status;
};

const getStatusClass = (status) => {
	const classMap = {
		'CLOSED': 'status-completed',
		'CANCELLED': 'status-cancelled',
		'MISSED': 'status-missed',
		'NO_SHOW': 'status-missed'
	};
	return classMap[status] || '';
};

const getCardClass = (status) => {
	const classMap = {
		'CLOSED': 'card-completed',
		'CANCELLED': 'card-cancelled',
		'MISSED': 'card-missed',
		'NO_SHOW': 'card-missed'
	};
	return classMap[status] || '';
};

const getStatusIcon = (status) => {
	const iconMap = {
		'CLOSED': 'hi-check-circle',
		'CANCELLED': 'hi-x-circle',
		'MISSED': 'hi-exclamation-circle',
		'NO_SHOW': 'hi-exclamation-circle'
	};
	return iconMap[status] || 'hi-information-circle';
};

const getRatingLabel = (score) => {
	const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
	return labels[score] || '';
};

async function getUserAppointments() {
	isLoading.value = true;
	const queryParams = {
		currentPage: 1,
		pageLimit: 50,
		status: 'COMPLETED'
	};

	try {
		const { data } = await $http.$_getPatientAppointments(queryParams);
		appointmentItems.value = groupBy(data.data?.map((item) => ({
			...item, startTime: format(new Date(item.start_time), 'EEEE, MMMM dd, yyyy')
		})), 'startTime');
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
	const userId = activeItem.specialist.id;

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

const bookFollowUp = (appt) => {
	// Pre-fill booking info with the same specialist
	useBookingInfo({
		payload: {
			...bookingInfo.value?.payload,
			specialist: appt.specialist,
			category: appt.category,
			isFollowUp: true,
			previousAppointmentId: appt._id
		}
	});

	router.push({ name: 'PatientBookAppointment' });
};

const openRatingModal = (appt) => {
	ratingAppointment.value = appt;
	ratingScore.value = 0;
	ratingReview.value = '';
	isRatingModalOpen.value = true;
};

const submitRating = async () => {
	if (ratingScore.value === 0) return;

	isSubmittingRating.value = true;
	try {
		const payload = {
			appointmentId: ratingAppointment.value._id,
			rating: {
				score: ratingScore.value,
				review: ratingReview.value
			}
		};

		await $http.$_rateAppointment(payload);
		$toast.success('Rating submitted successfully!');
		isRatingModalOpen.value = false;

		// Update local data
		const appt = ratingAppointment.value;
		appt.rating = payload.rating;

		// Refresh list
		getUserAppointments();
	} catch (error) {
		$toast.error(error.message || 'Failed to submit rating');
	} finally {
		isSubmittingRating.value = false;
	}
};
</script>

<style scoped lang="scss">
.history-appointments {
	height: 100%;
	overflow-y: auto;
	padding-bottom: 100px;

	&::-webkit-scrollbar {
		display: none;
	}
}

.filter-section {
	display: flex;
	align-items: center;
	gap: $size-10;
	margin-bottom: $size-24;
	flex-wrap: wrap;
}

.filter-pill {
	display: inline-flex;
	align-items: center;
	gap: $size-6;
	padding: $size-8 $size-16;
	border: 1px solid $color-g-90;
	border-radius: $size-24;
	background: white;
	font-size: $size-14;
	font-weight: $fw-medium;
	color: $color-g-44;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: #0EAEC4;
		color: #0EAEC4;
	}

	&.active {
		background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
		border-color: transparent;
		color: white;

		.filter-count {
			background: rgba(255, 255, 255, 0.2);
			color: white;
		}
	}

	.filter-count {
		background: $color-g-90;
		color: $color-g-44;
		padding: 2px 8px;
		border-radius: 12px;
		font-size: $size-12;
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
	border-left: 4px solid #10b981;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
	}

	&.card-completed {
		border-left-color: #10b981;
	}

	&.card-cancelled {
		border-left-color: #ef4444;
	}

	&.card-missed {
		border-left-color: #f97316;
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
	gap: $size-4;
	padding: $size-4 $size-10;
	border-radius: $size-6;
	font-size: $size-12;
	font-weight: $fw-medium;

	&.status-completed {
		background: #dcfce7;
		color: #16a34a;
	}

	&.status-cancelled {
		background: #fef2f2;
		color: #ef4444;
	}

	&.status-missed {
		background: #fff7ed;
		color: #f97316;
	}
}

.time-section {
	flex-shrink: 0;
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: $size-12;

	@media (max-width: 768px) {
		width: 100%;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
}

.time-display {
	text-align: right;

	@media (max-width: 768px) {
		text-align: left;
	}
}

.time-info {
	display: flex;
	flex-direction: column;
	gap: $size-2;
}

.time-date {
	font-size: $size-12;
	color: $color-g-44;
}

.time-main {
	font-size: $size-16;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
}

.rating-display {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: $size-4;

	@media (max-width: 768px) {
		align-items: flex-start;
	}
}

.rating-stars {
	display: flex;
	gap: 2px;

	.star-filled {
		color: #fbbf24;
	}

	.star-empty {
		color: $color-g-90;
	}
}

.rating-text {
	font-size: $size-11;
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

.details-btn {
	color: $color-g-44;

	&:hover {
		background: $color-g-90;
		color: $color-g-21;
	}
}

.rate-btn {
	color: #fbbf24;
	background: rgba(251, 191, 36, 0.1);

	&:hover {
		background: rgba(251, 191, 36, 0.2);
	}
}

.followup-btn {
	color: #0EAEC4;
	background: rgba(14, 174, 196, 0.1);

	&:hover {
		background: rgba(14, 174, 196, 0.2);
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
	margin: 0 0 $size-20;
}

.clear-filter-btn {
	display: inline-flex;
	align-items: center;
	gap: $size-6;
	padding: $size-10 $size-20;
	border: 1px solid $color-g-90;
	border-radius: $size-8;
	background: white;
	color: $color-g-44;
	font-size: $size-14;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: #0EAEC4;
		color: #0EAEC4;
	}
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

.status-banner {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $size-8;
	padding: $size-12;
	border-radius: $size-10;
	margin-bottom: $size-24;
	font-weight: $fw-medium;

	&.status-completed {
		background: #dcfce7;
		color: #16a34a;
	}

	&.status-cancelled {
		background: #fef2f2;
		color: #ef4444;
	}

	&.status-missed {
		background: #fff7ed;
		color: #f97316;
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

.rating-section {
	background: #fefce8;
	border-radius: $size-12;
	padding: $size-20;
	margin-bottom: $size-20;
}

.section-title {
	font-size: $size-14;
	font-weight: $fw-medium;
	color: $color-g-44;
	margin: 0 0 $size-12;
}

.rating-content {
	display: flex;
	flex-direction: column;
	gap: $size-12;
}

.rating-stars-large {
	display: flex;
	gap: $size-4;

	.star-filled {
		color: #fbbf24;
	}

	.star-empty {
		color: $color-g-90;
	}
}

.rating-review {
	font-size: $size-14;
	color: $color-g-21;
	font-style: italic;
	margin: 0;
}

.rate-prompt {
	display: flex;
	align-items: center;
	gap: $size-16;
	background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(251, 191, 36, 0.05) 100%);
	border: 1px solid #fbbf24;
	border-radius: $size-12;
	padding: $size-16;

	.prompt-icon {
		color: #fbbf24;
	}

	.prompt-content {
		flex: 1;

		h4 {
			font-size: $size-15;
			font-weight: $fw-semi-bold;
			color: $color-g-21;
			margin: 0 0 $size-4;
		}

		p {
			font-size: $size-13;
			color: $color-g-44;
			margin: 0;
		}
	}

	.rate-now-btn {
		padding: $size-10 $size-20;
		background: #fbbf24;
		color: white;
		border: none;
		border-radius: $size-8;
		font-size: $size-14;
		font-weight: $fw-medium;
		cursor: pointer;
		transition: all 0.2s ease;

		&:hover {
			background: #f59e0b;
		}
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

.modal-close-btn {
	padding: $size-12 $size-24;
	border: 1px solid $color-g-90;
	border-radius: $size-10;
	background: white;
	color: $color-g-44;
	font-size: $size-14;
	font-weight: $fw-medium;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		border-color: $color-g-44;
		color: $color-g-21;
	}

	@media (max-width: 768px) {
		width: 100%;
	}
}

.modal-followup-btn {
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

	@media (max-width: 768px) {
		width: 100%;
		justify-content: center;
	}
}

// Rating Modal Styles
.rating-modal-content {
	padding: $size-24;
	display: flex;
	flex-direction: column;
	gap: $size-24;

	@media (max-width: 768px) {
		padding: $size-16;
	}
}

.rating-specialist {
	display: flex;
	align-items: center;
	gap: $size-16;
	padding-bottom: $size-20;
	border-bottom: 1px solid $color-g-90;
}

.rating-specialist-info {
	h3 {
		font-size: $size-18;
		font-weight: $fw-semi-bold;
		color: $color-g-21;
		margin: 0 0 $size-4;
	}

	p {
		font-size: $size-14;
		color: $color-g-44;
		margin: 0;
	}
}

.rating-input {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-16;
}

.rating-question {
	font-size: $size-16;
	font-weight: $fw-medium;
	color: $color-g-21;
	margin: 0;
}

.rating-stars-input {
	display: flex;
	gap: $size-8;
}

.star-btn {
	background: none;
	border: none;
	cursor: pointer;
	color: $color-g-90;
	transition: all 0.2s ease;
	padding: $size-4;

	&:hover,
	&.active {
		color: #fbbf24;
		transform: scale(1.1);
	}
}

.rating-label {
	font-size: $size-14;
	font-weight: $fw-medium;
	color: #fbbf24;
	min-height: 20px;
	margin: 0;
}

.review-input {
	display: flex;
	flex-direction: column;
	gap: $size-8;

	label {
		font-size: $size-14;
		font-weight: $fw-medium;
		color: $color-g-44;
	}

	textarea {
		width: 100%;
		padding: $size-14;
		border: 1px solid $color-g-90;
		border-radius: $size-10;
		font-size: $size-14;
		font-family: inherit;
		resize: none;
		transition: border-color 0.2s ease;

		&:focus {
			outline: none;
			border-color: #0EAEC4;
		}

		&::placeholder {
			color: $color-g-44;
		}
	}
}

.rating-modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: $size-12;
	width: 100%;

	@media (max-width: 768px) {
		flex-direction: column-reverse;

		button {
			width: 100% !important;
		}
	}
}

// Modal deep styles
:deep(.history-details-modal .modal__body) {
	width: 580px !important;

	@media (max-width: 768px) {
		width: 100% !important;
	}
}

:deep(.history-details-modal .modal__footer) {
	padding: $size-20 $size-24;
}

:deep(.rating-modal .modal__body) {
	width: 480px !important;

	@media (max-width: 768px) {
		width: 100% !important;
	}
}
</style>
