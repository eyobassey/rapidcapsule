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
									<!-- Data Badges -->
									<div class="data-badges" v-if="hasClinicalNotes(appointment) || hasPrescriptions(appointment._id)">
										<button
											v-if="hasClinicalNotes(appointment)"
											class="data-badge badge-notes"
											@click.stop="openNotesQuickView(appointment)"
										>
											<v-icon name="hi-document-text" scale="0.65" />
											<span>Notes ({{ appointment.clinical_notes.length }})</span>
										</button>
										<button
											v-if="hasPrescriptions(appointment._id)"
											class="data-badge badge-rx"
											@click.stop="openPrescriptionBadge(appointment)"
										>
											<v-icon name="gi-medicines" scale="0.65" />
											<span>RX ({{ getAppointmentPrescriptions(appointment._id).length }})</span>
										</button>
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
								<div class="rating-display" v-if="appointment.rating && isCompleted(appointment.status)">
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
								v-if="isCompleted(appointment.status) && !appointment.rating"
								class="action-btn rate-btn"
								@click.stop="openRatingModal(appointment)"
							>
								<v-icon name="bi-star-fill" scale="0.85" />
								<span class="btn-text">Rate Appointment</span>
							</button>

							<!-- Book Follow-up for completed appointments -->
							<button
								v-if="isCompleted(appointment.status)"
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
							<p class="detail-value">{{ formatMeetingType(specialistInfo.appointmentType) }}</p>
						</div>

						<div class="detail-item" v-if="specialistInfo.meetingChannel">
							<div class="detail-label">
								<v-icon name="hi-globe-alt" scale="0.85" />
								<span>Channel</span>
							</div>
							<p class="detail-value">{{ formatChannel(specialistInfo.meetingChannel) }}</p>
						</div>

						<div class="detail-item" v-if="specialistInfo.durationMinutes">
							<div class="detail-label">
								<v-icon name="hi-clock" scale="0.85" />
								<span>Duration</span>
							</div>
							<p class="detail-value">{{ specialistInfo.durationMinutes }} min</p>
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
					<div class="rate-prompt" v-else-if="isCompleted(appointment.status)">
						<v-icon name="bi-star-fill" scale="1.2" class="prompt-icon" />
						<div class="prompt-content">
							<h4>How was your experience?</h4>
							<p>Help others by rating this consultation</p>
						</div>
						<button class="rate-now-btn" @click="openRatingModal(appointment)">
							Rate Now
						</button>
					</div>

					<!-- Clinical Notes Section -->
					<div class="linked-data-section" v-if="appointmentNotes.length">
						<h4 class="linked-data-header">
							<v-icon name="hi-document-text" scale="0.9" />
							<span>Clinical Notes</span>
						</h4>
						<div class="notes-list">
							<div class="note-item" v-for="(note, idx) in appointmentNotes" :key="idx">
								<div class="note-content">{{ note.content || note.text }}</div>
								<div class="note-meta">
									<span class="note-date" v-if="note.created_at">
										{{ format(new Date(note.created_at), 'MMM dd, yyyy h:mm a') }}
									</span>
									<span class="note-platform" v-if="note.platform" :class="'platform-' + note.platform">
										{{ note.platform }}
									</span>
								</div>
							</div>
						</div>
					</div>

					<!-- Linked Prescriptions Section -->
					<div class="linked-data-section" v-if="appointmentPrescriptions.length">
						<h4 class="linked-data-header">
							<v-icon name="gi-medicines" scale="0.9" />
							<span>Linked Prescriptions</span>
						</h4>
						<div class="prescriptions-list">
							<div class="prescription-card" v-for="rx in appointmentPrescriptions" :key="rx._id">
								<div class="prescription-header">
									<span class="rx-number">#{{ rx.prescription_number }}</span>
									<span class="rx-status" :class="'rx-status-' + rx.status?.toLowerCase()">
										{{ rx.status }}
									</span>
								</div>
								<div class="rx-date" v-if="rx.created_at">
									{{ format(new Date(rx.created_at), 'MMM dd, yyyy') }}
								</div>
								<div class="medications-list" v-if="rx.medications && rx.medications.length">
									<div class="medication-item" v-for="(med, mIdx) in rx.medications" :key="mIdx">
										<span class="med-name">{{ med.drug_name }}</span>
										<span class="med-details">
											{{ [med.dosage, med.frequency, med.duration].filter(Boolean).join(' · ') }}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Shared Documents Section -->
					<div class="linked-data-section" v-if="appointmentDocuments.length">
						<h4 class="linked-data-header">
							<v-icon name="hi-folder-open" scale="0.9" />
							<span>Shared Documents</span>
						</h4>
						<div class="documents-list">
							<a
								v-for="doc in appointmentDocuments"
								:key="doc._id || doc.key"
								class="document-item"
								:href="doc.url"
								target="_blank"
								rel="noopener noreferrer"
							>
								<v-icon :name="getDocIcon(doc.type || doc.mime_type)" scale="1" class="doc-icon" />
								<div class="doc-info">
									<span class="doc-name">{{ doc.original_name || doc.name || 'Document' }}</span>
									<span class="doc-meta">
										<span v-if="doc.size">{{ formatFileSize(doc.size) }}</span>
										<span v-if="doc.shared_by" class="doc-shared-by">by {{ doc.shared_by }}</span>
									</span>
								</div>
								<v-icon name="hi-external-link" scale="0.8" class="doc-link-icon" />
							</a>
						</div>
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<div class="modal-actions" v-if="!isFetching">
					<button class="modal-close-btn" @click="isOpen = false">
						Close
					</button>
					<button
						v-if="isCompleted(appointment.status)"
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

		<!-- Clinical Notes Quick-View Modal -->
		<dialog-modal
			v-if="isNotesModalOpen"
			:title="notesModalTitle"
			@closeModal="isNotesModalOpen = false"
			:has-footer="true"
			class="notes-quick-modal"
		>
			<template v-slot:body>
				<div class="notes-quick-content">
					<div class="note-quick-item" v-for="(note, idx) in notesModalData" :key="idx">
						<div class="note-quick-text">{{ note.content || note.text }}</div>
						<div class="note-quick-meta">
							<span v-if="note.created_at" class="note-quick-date">
								{{ format(new Date(note.created_at), 'MMM dd, yyyy h:mm a') }}
							</span>
							<span v-if="note.platform" class="note-quick-platform" :class="'platform-' + note.platform">
								{{ note.platform }}
							</span>
						</div>
					</div>
					<div v-if="!notesModalData.length" class="empty-notes">
						No clinical notes available.
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<button class="modal-close-btn" @click="isNotesModalOpen = false">Close</button>
			</template>
		</dialog-modal>

		<!-- Prescription Quick-View Modal -->
		<dialog-modal
			v-if="isPrescriptionModalOpen"
			title="Linked Prescriptions"
			@closeModal="isPrescriptionModalOpen = false"
			:has-footer="true"
			class="rx-quick-modal"
		>
			<template v-slot:body>
				<div class="rx-modal-list" v-if="prescriptionModalData?.length">
					<div
						class="rx-modal-card"
						v-for="rx in prescriptionModalData"
						:key="rx._id"
						:class="{ 'rx-modal-card--unpaid': !isPrescriptionPaid(rx) }"
					>
						<div class="rx-modal-card__top">
							<div class="rx-modal-card__info">
								<span class="rx-modal-card__number">#{{ rx.prescription_number }}</span>
								<span class="rx-modal-card__date" v-if="rx.created_at">
									{{ format(new Date(rx.created_at), 'MMM dd, yyyy') }}
								</span>
							</div>
							<span class="rx-modal-card__status" :class="'rx-status-' + rx.status?.toLowerCase()">
								{{ formatRxStatus(rx.status) }}
							</span>
						</div>

						<div class="rx-modal-card__meds">
							<div
								class="rx-modal-med"
								v-for="(item, idx) in (rx.items || rx.medications || [])"
								:key="idx"
							>
								<div class="rx-modal-med__name">
									<v-icon name="gi-medicines" scale="0.6" />
									{{ item.drug_name }}
									<span v-if="item.drug_strength || item.strength" class="rx-modal-med__strength">
										{{ item.drug_strength || item.strength }}
									</span>
								</div>
								<div class="rx-modal-med__info" v-if="item.dosage || item.frequency || item.duration">
									{{ [item.dosage, item.frequency, item.duration].filter(Boolean).join(' · ') }}
								</div>
							</div>
						</div>

						<button
							v-if="!isPrescriptionPaid(rx)"
							class="rx-modal-pay-btn"
							@click="goToPrescriptionPayment(rx)"
						>
							<v-icon name="hi-credit-card" scale="0.8" />
							Complete Payment
						</button>
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<button class="modal-close-btn" @click="isPrescriptionModalOpen = false">Close</button>
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

const emit = defineEmits(['create', 'stats-updated']);

const $http = inject('$http');
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

// Linked data state
const appointmentNotes = ref([]);
const appointmentPrescriptions = ref([]);
const appointmentDocuments = ref([]);

// Badge data - maps appointmentId to prescriptions
const appointmentPrescriptionMap = ref({});

// Notes quick-view modal
const isNotesModalOpen = ref(false);
const notesModalData = ref([]);
const notesModalTitle = ref('');

// Prescription quick-view modal
const isPrescriptionModalOpen = ref(false);
const prescriptionModalData = ref(null);

const filters = computed(() => [
	{ label: 'All', value: 'all', count: getTotalCount() },
	{ label: 'Completed', value: 'COMPLETED', count: getStatusCount('COMPLETED') },
	{ label: 'Cancelled', value: 'CANCELLED', count: getStatusCount('CANCELLED') },
	{ label: 'Missed', value: 'MISSED', count: getStatusCount('MISSED') },
]);

const filteredAppointments = computed(() => {
	if (activeFilter.value === 'all') return appointmentItems.value;

	const filtered = {};
	Object.entries(appointmentItems.value).forEach(([date, appts]) => {
		const filteredAppts = appts.filter(a => {
			if (activeFilter.value === 'COMPLETED') return isCompleted(a.status);
			if (activeFilter.value === 'MISSED') return a.status === 'MISSED' || a.status === 'NO_SHOW';
			return a.status === activeFilter.value;
		});
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
		count += appts.filter(a => {
			if (status === 'COMPLETED') return isCompleted(a.status);
			if (status === 'MISSED') return a.status === 'MISSED' || a.status === 'NO_SHOW';
			return a.status === status;
		}).length;
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

const isCompleted = (status) => status === 'COMPLETED' || status === 'CLOSED';

const formatChannel = (channel) => {
	const channelMap = {
		'zoom': 'Zoom',
		'google_meet': 'Google Meet',
		'phone': 'Phone Call',
	};
	return channelMap[channel] || channel;
};

const getMeetingTypeClass = (type) => {
	return type === 'video' ? 'type-video' : 'type-audio';
};

const formatStatus = (status) => {
	const statusMap = {
		'COMPLETED': 'Completed',
		'CLOSED': 'Completed',
		'CANCELLED': 'Cancelled',
		'MISSED': 'Missed',
		'NO_SHOW': 'No Show'
	};
	return statusMap[status] || status;
};

const getStatusClass = (status) => {
	const classMap = {
		'COMPLETED': 'status-completed',
		'CLOSED': 'status-completed',
		'CANCELLED': 'status-cancelled',
		'MISSED': 'status-missed',
		'NO_SHOW': 'status-missed'
	};
	return classMap[status] || '';
};

const getCardClass = (status) => {
	const classMap = {
		'COMPLETED': 'card-completed',
		'CLOSED': 'card-completed',
		'CANCELLED': 'card-cancelled',
		'MISSED': 'card-missed',
		'NO_SHOW': 'card-missed'
	};
	return classMap[status] || '';
};

const getStatusIcon = (status) => {
	const iconMap = {
		'COMPLETED': 'hi-check-circle',
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

const getDocIcon = (type) => {
	if (!type) return 'hi-document';
	if (type.includes('pdf')) return 'hi-document-text';
	if (type.includes('image')) return 'hi-photograph';
	return 'hi-document';
};

const formatFileSize = (bytes) => {
	if (!bytes) return '';
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
	return (bytes / 1048576).toFixed(1) + ' MB';
};

async function getUserAppointments() {
	isLoading.value = true;
	const historyStatuses = ['COMPLETED', 'CLOSED', 'CANCELLED', 'MISSED', 'NO_SHOW'];

	try {
		const { data } = await $http.$_getPatientAppointments({
			currentPage: 1,
			pageLimit: 100,
		});

		// Filter to history-relevant statuses and sort by most recent first
		const historyItems = (data.data || [])
			.filter(item => historyStatuses.includes(item.status))
			.sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
			.map(item => ({
				...item,
				startTime: format(new Date(item.start_time), 'EEEE, MMMM dd, yyyy')
			}));

		// Group by date - order is preserved from the sorted array
		const grouped = {};
		historyItems.forEach(item => {
			if (!grouped[item.startTime]) {
				grouped[item.startTime] = [];
			}
			grouped[item.startTime].push(item);
		});
		appointmentItems.value = grouped;

		// Fetch patient prescriptions to build appointment-prescription map
		buildPrescriptionMap();
	} catch (error) {
		console.error('Error fetching appointments:', error);
	} finally {
		isLoading.value = false;
	}
}

async function buildPrescriptionMap() {
	try {
		const { data } = await $http.$_getPatientPrescriptions({ page: 1, limit: 200 });
		const prescriptions = data?.data?.docs || [];
		const map = {};
		prescriptions.forEach(rx => {
			// Map via linked_appointments
			if (rx.linked_appointments?.length) {
				rx.linked_appointments.forEach(apptId => {
					const id = apptId?._id || apptId;
					if (!map[id]) map[id] = [];
					map[id].push(rx);
				});
			}
			// Map via linked_clinical_notes
			if (rx.linked_clinical_notes?.length) {
				rx.linked_clinical_notes.forEach(note => {
					const id = note.appointment_id?._id || note.appointment_id;
					if (id) {
						if (!map[id]) map[id] = [];
						// Avoid duplicates
						if (!map[id].find(existing => existing._id === rx._id)) {
							map[id].push(rx);
						}
					}
				});
			}
		});
		appointmentPrescriptionMap.value = map;
	} catch (error) {
		console.error('Error fetching prescriptions for map:', error);
	}
}

const onShow = async (activeItem) => {
	isFetching.value = true;
	isOpen.value = true;
	appointment.value = activeItem;
	appointmentNotes.value = [];
	appointmentPrescriptions.value = [];
	appointmentDocuments.value = [];
	const userId = activeItem.specialist.id;
	const appointmentId = activeItem._id;

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
			meetingChannel: activeItem.meeting_channel,
			durationMinutes: activeItem.duration_minutes,
			timezone: activeItem.timezone
		};

		// Extract clinical notes from appointment data
		if (activeItem.clinical_notes && activeItem.clinical_notes.length) {
			appointmentNotes.value = activeItem.clinical_notes;
		}

		// Fetch linked prescriptions and documents in parallel
		const [prescriptionsRes, documentsRes] = await Promise.allSettled([
			$http.$_getPatientPrescriptionsForAppointment(appointmentId),
			$http.$_getAppointmentDocuments(appointmentId),
		]);

		if (prescriptionsRes.status === 'fulfilled') {
			appointmentPrescriptions.value = prescriptionsRes.value?.data?.data || [];
		}
		if (documentsRes.status === 'fulfilled') {
			appointmentDocuments.value = documentsRes.value?.data?.data || [];
		}
	} catch (error) {
		console.error('Error fetching appointment details:', error);
	} finally {
		isFetching.value = false;
	}
};

const bookFollowUp = (appt) => {
	isOpen.value = false;
	router.push({
		name: 'BookAppointment',
		query: {
			mode: 'followup',
			specialistId: appt.specialist?.id || appt.specialist?._id,
			category: appt.category,
			step: '3',
		}
	});
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
		await $http.$_rateAppointment(ratingAppointment.value._id, {
			score: ratingScore.value,
			review: ratingReview.value || undefined,
		});
		$toast.success('Rating submitted successfully!');
		isRatingModalOpen.value = false;

		// Update local data
		const appt = ratingAppointment.value;
		appt.rating = { score: ratingScore.value, review: ratingReview.value };

		// Refresh list
		getUserAppointments();
	} catch (error) {
		$toast.error(error.message || 'Failed to submit rating');
	} finally {
		isSubmittingRating.value = false;
	}
};

// Badge helpers
const getAppointmentPrescriptions = (appointmentId) => {
	return appointmentPrescriptionMap.value[appointmentId] || [];
};

const hasClinicalNotes = (appointment) => {
	return appointment.clinical_notes && appointment.clinical_notes.length > 0;
};

const hasPrescriptions = (appointmentId) => {
	return getAppointmentPrescriptions(appointmentId).length > 0;
};

// Notes badge click - open modal showing notes
const openNotesQuickView = (appointment) => {
	notesModalData.value = appointment.clinical_notes || [];
	notesModalTitle.value = `Clinical Notes - ${appointment.specialist?.full_name || 'Specialist'}`;
	isNotesModalOpen.value = true;
};

// Prescription badge click - show all linked prescriptions
const openPrescriptionBadge = (appointment) => {
	const prescriptions = getAppointmentPrescriptions(appointment._id);
	if (!prescriptions.length) return;
	prescriptionModalData.value = prescriptions;
	isPrescriptionModalOpen.value = true;
};

const isPrescriptionPaid = (rx) => {
	const paidStatuses = ['paid', 'completed', 'dispensed', 'delivered'];
	return paidStatuses.includes(rx.status?.toLowerCase());
};

const formatRxStatus = (status) => {
	if (!status) return '';
	return status.replace(/_/g, ' ');
};

const goToPrescriptionPayment = (rx) => {
	isPrescriptionModalOpen.value = false;
	router.push({ name: 'Patient Prescription Details', params: { id: rx._id } });
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

// Linked Data Sections
.linked-data-section {
	margin-top: $size-24;
	padding-top: $size-20;
	border-top: 1px solid $color-g-90;
}

.linked-data-header {
	display: flex;
	align-items: center;
	gap: $size-8;
	font-size: $size-15;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
	margin: 0 0 $size-16;
}

.notes-list {
	display: flex;
	flex-direction: column;
	gap: $size-12;
}

.note-item {
	background: #f8fafc;
	border-radius: $size-10;
	padding: $size-14;
	border-left: 3px solid #0EAEC4;
}

.note-content {
	font-size: $size-14;
	color: $color-g-21;
	line-height: 1.6;
	white-space: pre-wrap;
}

.note-meta {
	display: flex;
	align-items: center;
	gap: $size-10;
	margin-top: $size-8;
}

.note-date {
	font-size: $size-12;
	color: $color-g-44;
}

.note-platform {
	font-size: $size-11;
	padding: 2px 8px;
	border-radius: $size-4;
	font-weight: $fw-medium;

	&.platform-zoom {
		background: rgba(45, 140, 255, 0.1);
		color: #2d8cff;
	}

	&.platform-custom {
		background: rgba(14, 174, 196, 0.1);
		color: #0EAEC4;
	}
}

.prescriptions-list {
	display: flex;
	flex-direction: column;
	gap: $size-12;
}

.prescription-card {
	background: #f8fafc;
	border-radius: $size-10;
	padding: $size-14;
}

.prescription-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: $size-6;
}

.rx-number {
	font-size: $size-14;
	font-weight: $fw-semi-bold;
	color: $color-g-21;
}

.rx-status {
	font-size: $size-11;
	padding: 2px 8px;
	border-radius: $size-4;
	font-weight: $fw-medium;

	&.rx-status-paid,
	&.rx-status-delivered {
		background: #dcfce7;
		color: #16a34a;
	}

	&.rx-status-pending,
	&.rx-status-pending_payment,
	&.rx-status-pending_acceptance {
		background: #fef3c7;
		color: #d97706;
	}

	&.rx-status-dispensed,
	&.rx-status-shipped {
		background: rgba(14, 174, 196, 0.1);
		color: #0EAEC4;
	}

	&.rx-status-cancelled {
		background: #fef2f2;
		color: #ef4444;
	}
}

.rx-date {
	font-size: $size-12;
	color: $color-g-44;
	margin-bottom: $size-10;
}

.medications-list {
	display: flex;
	flex-direction: column;
	gap: $size-6;
	padding-top: $size-10;
	border-top: 1px solid $color-g-90;
}

.medication-item {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.med-name {
	font-size: $size-13;
	font-weight: $fw-medium;
	color: $color-g-21;
}

.med-details {
	font-size: $size-12;
	color: $color-g-44;
}

.documents-list {
	display: flex;
	flex-direction: column;
	gap: $size-8;
}

.document-item {
	display: flex;
	align-items: center;
	gap: $size-12;
	padding: $size-12;
	background: #f8fafc;
	border-radius: $size-10;
	text-decoration: none;
	transition: all 0.2s ease;
	cursor: pointer;

	&:hover {
		background: #f1f5f9;
		transform: translateX(2px);
	}
}

.doc-icon {
	color: #0EAEC4;
	flex-shrink: 0;
}

.doc-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
}

.doc-name {
	font-size: $size-14;
	font-weight: $fw-medium;
	color: $color-g-21;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.doc-meta {
	display: flex;
	align-items: center;
	gap: $size-8;
	font-size: $size-12;
	color: $color-g-44;
}

.doc-shared-by {
	font-style: italic;
}

.doc-link-icon {
	color: $color-g-44;
	flex-shrink: 0;
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

// Data badges on cards
.data-badges {
	display: flex;
	align-items: center;
	gap: $size-8;
	margin-top: $size-6;
}

.data-badge {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 10px;
	border-radius: 12px;
	font-size: 11px;
	font-weight: $fw-semi-bold;
	cursor: pointer;
	border: none;
	transition: all 0.2s ease;

	span {
		white-space: nowrap;
	}

	&.badge-notes {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;

		&:hover {
			background: rgba(59, 130, 246, 0.2);
		}
	}

	&.badge-rx {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;

		&:hover {
			background: rgba(16, 185, 129, 0.2);
		}
	}
}

// Notes Quick-View Modal
.notes-quick-content {
	display: flex;
	flex-direction: column;
	gap: $size-12;
	padding: $size-8 0;
}

.note-quick-item {
	padding: $size-14;
	background: #f8fafc;
	border-radius: $size-10;
	border-left: 3px solid #3b82f6;
}

.note-quick-text {
	font-size: $size-14;
	color: $color-g-21;
	line-height: 1.5;
	white-space: pre-wrap;
}

.note-quick-meta {
	display: flex;
	align-items: center;
	gap: $size-10;
	margin-top: $size-8;
}

.note-quick-date {
	font-size: $size-12;
	color: $color-g-44;
}

.note-quick-platform {
	font-size: 10px;
	padding: 2px 8px;
	border-radius: 8px;
	font-weight: $fw-semi-bold;
	text-transform: capitalize;

	&.platform-zoom {
		background: rgba(45, 140, 255, 0.1);
		color: #2d8cff;
	}

	&.platform-custom {
		background: rgba(14, 174, 196, 0.1);
		color: #0EAEC4;
	}
}

.empty-notes {
	text-align: center;
	color: $color-g-44;
	padding: $size-24;
	font-size: $size-14;
}

// Prescription Modal
.rx-modal-list {
	display: flex;
	flex-direction: column;
	gap: $size-16;
	padding: $size-4 0;
}

.rx-modal-card {
	border: 1px solid #e2e8f0;
	border-radius: $size-12;
	padding: $size-16;
	transition: all 0.2s ease;

	&--unpaid {
		border-color: #fbbf24;
		background: rgba(251, 191, 36, 0.03);
	}

	&__top {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: $size-12;
	}

	&__info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	&__number {
		font-size: $size-15;
		font-weight: $fw-bold;
		color: $color-g-21;
	}

	&__date {
		font-size: $size-12;
		color: $color-g-54;
	}

	&__status {
		padding: 4px 10px;
		border-radius: 10px;
		font-size: 11px;
		font-weight: $fw-semi-bold;
		text-transform: capitalize;

		&.rx-status-paid, &.rx-status-completed, &.rx-status-dispensed, &.rx-status-delivered {
			background: rgba(16, 185, 129, 0.1);
			color: #10b981;
		}

		&.rx-status-pending_acceptance, &.rx-status-accepted, &.rx-status-pending_payment {
			background: rgba(245, 158, 11, 0.1);
			color: #f59e0b;
		}

		&.rx-status-declined, &.rx-status-cancelled {
			background: rgba(239, 68, 68, 0.1);
			color: #ef4444;
		}
	}

	&__meds {
		display: flex;
		flex-direction: column;
		gap: $size-8;
	}
}

.rx-modal-med {
	padding: $size-10 $size-12;
	background: #f8fafc;
	border-radius: $size-8;

	&__name {
		display: flex;
		align-items: center;
		gap: $size-6;
		font-size: $size-14;
		font-weight: $fw-semi-bold;
		color: $color-g-21;

		svg {
			color: #10b981;
			flex-shrink: 0;
		}
	}

	&__strength {
		font-weight: $fw-regular;
		color: $color-g-44;
		font-size: $size-12;
	}

	&__info {
		margin-top: 4px;
		margin-left: 22px;
		font-size: $size-12;
		color: $color-g-54;
	}
}

.rx-modal-pay-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $size-8;
	width: 100%;
	margin-top: $size-14;
	padding: $size-10 $size-16;
	background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
	color: white;
	border: none;
	border-radius: $size-8;
	font-size: $size-14;
	font-weight: $fw-semi-bold;
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(14, 174, 196, 0.3);
	}

	svg {
		color: white;
	}
}

:deep(.notes-quick-modal .modal__body),
:deep(.rx-quick-modal .modal__body) {
	width: 500px !important;

	@media (max-width: 768px) {
		width: 100% !important;
	}
}
</style>
