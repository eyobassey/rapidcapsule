<template>
	<div class="loader-container" v-if="isLoading">
		<loader :useOverlay="false" style="position: relative" />
	</div>
	<div v-else class="appointments-container">
		<div class="appointments_root">
			<template v-if="Object.keys(appointmentItems).length">
				<div v-for="(appointments, timestamp, index) in appointmentItems" :key="timestamp + index">
					<div class="appointments_container">
						<p class="appointment_timestamp">{{ timestamp }}</p>
						<template v-for="appointment in appointments" :key="appointment.id">
							<div class="appointments_items">
								<div class="appointments_items-container">
									<p class="appointments_items-title">
										{{ appointment.specialist.full_name }}
									</p>
									<p class="appointments_items-timestamp">
										{{ format(new Date(appointment.start_time), 'HH:mm') }}
										({{ format(new Date(appointment.start_time), 'hh:mm a') }})
									</p>
								</div>
								<div class="appointment_actions" @click="onShow(appointment)">
									<p class="appointment_actions-title desktop-visible">View Details</p>
									<rc-iconbutton icon="icon-carrot-right" size="xs" />
								</div>
							</div>
						</template>
					</div>
				</div>
			</template>
			<template v-else>
				<div class="empty-appointment-container">
					<div class="empty-appointment-content">
						<h1 class="empty-appointment-title">You have no appointments yet</h1>
						<p class="empty-appointment-description">
							Appointment will show up here when they are booked.
						</p>
					</div>
				</div>
			</template>
		</div>
		<dialog-modal
			v-if="isOpen"
			title="Appointment Details"
			@closeModal="isOpen = false"
			:has-footer="true"
			class="appointment-details-modal"
		>
			<template v-slot:body>
				<div class="loader-container" v-if="isFetching">
					<loader :useOverlay="false" style="position: relative" />
				</div>
				<div v-else class="modal-details-container">
					<div class="details-container__body">
						<div class="top_container">
							<div class="spacialist-details__container">
								<div class="spacialist_details">
									<div class="specialist_details-container">
										<div class="specialist_details-avatar">
											<rc-avatar
												size="lg"
												:firstName="specialistInfo.firstName"
												:lastName="specialistInfo.lastName"
												v-model="specialistInfo.photo"
											/>
										</div>
										<div class="specialist_details-info-container">
											<div class="specialist-details-heading">
												<h2 class="specialist_details-name">{{ specialistInfo.fullName }}</h2>
												<div class="specialist_details-rating-container desktop-visible">
													<span class="specialist_details-rating">{{ specialistInfo.rating?.toFixed(1) }}</span>
													<rc-icon icon-name="icon-star-rating" size="xms" />
												</div>
											</div>
											<div class="specialist-details__patient">
												<div class="specialist-details__icon mobile-visible">
													<template v-if="specialistInfo.rating">
														<span v-for="i in specialistInfo.rating" :key="i">
															<rc-icon icon="star" size="xs" viewBox="0 0 12 12"   />
														</span>
													</template>
													<div v-else class="specialist-details__no-rating mobile-visible">
														<span class="specialist_details-rating">{{ specialistInfo.rating?.toFixed(1) }}</span>
														<rc-icon icon="star" size="xs" viewBox="0 0 12 12"   />
													</div>
												</div>
												<p class="specialist_details-specialty">{{ specialistInfo.category }}</p>
												<p class="specialist_details-specialty">0yrs experience</p>
											</div>
										</div>
									</div>
								</div>
								<div class="specialist-appointment-details">
									<div class="specialist-appointment-details__container">
										<p class="specialist-appointment-details__title">Date & Time</p>
										<div class="specialist-appointment-details__content">
											<p class="specialist-appointment-details__item">
												{{ format(new Date(specialistInfo.startTime), 'MMMM dd, yyyy') }}
											</p>
											<p class="specialist-appointment-details__item">
												{{ format(new Date(specialistInfo.startTime), 'HH:mm') }}
												({{ format(new Date(specialistInfo.startTime), 'HH:mm a') }})
												{{ specialistInfo.timezone }}
											</p>
										</div>
									</div>
									<div class="specialist-appointment-details__container">
										<p class="specialist-appointment-details__title">Appointment Type</p>
										<div class="specialist-appointment-details__content">
											<p class="specialist-appointment-details__item">
												{{ specialistInfo.appointmentType }}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<div class="modal-appointment-actions" v-if="!isFetching">
					<rc-button
						type="tertiary"
						style="border:0"
						label="Cancel Appointment"
						class="reschedule_action"
						:disabled="isFetching || !appointment.start_url"
						@click="isOpenCancelAppointment = true"
					/>
					<div class="modal-appointment-actions__meeting">
						<rc-button
							type="tertiary"
							label="Reschedule"
							class="reschedule_action"
							@click="isOpenScheduleAppointment = true"
							:disabled="isFetching || !appointment.start_url"
						/>
						<rc-button
							type="primary"
							label="Start Meeting"
							class="start_meeting_action"
							:disabled="isFetching || !appointment.start_url"
							@click="onStartMeetings(appointment)"
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
			class="caution-message-modal"
		>
			<template v-slot:body>
				<div class="caution-container">
					<p class="caution-content">
						Canceling your appointment less than 12 hours before the scheduled 
						time will result in a surcharge fee. Are you sure you want to proceed?
					</p>
				</div>
			</template>
			<template v-slot:foot>
				<div class="caution-actions">
					<rc-button
						label="No"
						type="tertiary"
						size="small"
						:disabled="isLoadingCancelAppointment"
						@click="isOpenCancelAppointment = false"
					/>
					<rc-button
						label="Yes"
						type="primary"
						size="small"
						:loading="isLoadingCancelAppointment"
						:disabled="isLoadingCancelAppointment"
						@click="onSubmitCancelAppointment(appointment)"
					/>
				</div>
			</template>
		</dialog-modal>
		<dialog-modal
			v-if="isOpenScheduleAppointment"
			@closeModal="isOpenScheduleAppointment = false"
			:has-footer="true"
			title="Reschedule Appointment"
			class="caution-message-modal"
		>
			<template v-slot:body>
				<div class="caution-container">
					<p class="caution-content">
						Rescheduling your appointment less than 12 hours before 
						the scheduled time will result in a surcharge fee. 
						Are you sure you want to proceed?
					</p>
				</div>
				
			</template>
			<template v-slot:foot>
				<div class="caution-actions">
					<rc-button
						label="No"
						type="tertiary"
						size="small"
						:disabled="isLoadingScheduleAppointment"
						@click="isOpenScheduleAppointment = false"
					/>
					<rc-button
						label="Yes"
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
import RcIcon from "@/components/RCIcon";
import RcIconbutton from "@/components/RCIconButton";
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

const profile = ref({});
const appointments = ref([]);
const appointment = ref({});
const isLoading = ref(true);
const isFetching = ref(true);
const isOpen = ref(false);
const appointmentItems = ref([]);
const specialistInfo = ref({});
const rescheduleAppointmentRef = ref();

onMounted(() => getUserAppointments());

const calculateAge = (birthday) => {
	var ageDifMs = Date.now() - new Date(birthday).getTime();
	var ageDate = new Date(ageDifMs);
	return Math.abs(ageDate.getUTCFullYear() - 1970);
}

const onStartMeetings = (appointment) => {
	router.push({
		name: 'SpecialistMeetings',
		params: {
			patientId: appointment.patient.id,
			meetingId: appointment.meeting_id
		}
	});
}

async function getUserAppointments() {
	isLoading.value = true;
	const queryParams = {
		currentPage: 1,
		pageLimit: 10,
		status: 'OPEN'
	}

	await $http.$_getPatientAppointments(queryParams).then(({ data }) => {
		console.log('toDateString', data)
		appointmentItems.value = groupBy(data.data?.map((item) => ({
			...item, startTime: new Date(item.start_time).toDateString()
		})), 'startTime');
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
			rating: data.data.average_rating,
			category: activeItem.category,
			startTime: activeItem.start_time,
			appointmentType: activeItem.appointment_type,
			timezone: activeItem.timezone
		};
		isFetching.value = false;
	});
}

const onSubmitCancelAppointment = async (appointment) => {
	isLoadingCancelAppointment.value = true;
	const payload = { appointmentId: appointment._id, status: 'CANCELLED' };

	await $http.$_cancelAppointments(payload).then(({ data }) => {
		$toast.success('Appointment cancelled successfully!');
		isLoadingCancelAppointment.value = false;
		isOpen.value = false;
		getUserAppointments();
	}).catch((error) => {
		$toast.error(error.message);
		isLoadingCancelAppointment.value = false;
	});
}

const onSubmitRescheduleAppointment = (appointment) => {
	useBookingInfo({ payload: { ...bookingInfo.value.payload, appointment } });
	rescheduleAppointmentRef.value.onOpen(appointment || {});
	isOpenScheduleAppointment.value = false;
	isOpen.value = false;
}
</script>

<style scoped lang="scss">
.appointments-container {
	height: 100%;
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: $size-32;
	position: relative;

	&::-webkit-scrollbar {
		display: none;
		width: 12px;
		background-color: $color-g-97;
	}
}
.appointments_root {
	display: flex;
	flex-direction: column;
	gap: $size-24;
	height: 100vh;
	width: 100%;
	overflow-y: scroll;
	padding-bottom: 200px;

	&::-webkit-scrollbar {
		display: none;
		width: 12px;
		background-color: $color-g-97;
	}
}
.appointments_container {
	display: flex;
	flex-direction: column;
	justify-content: start;
	gap: $size-10;

	&::-webkit-scrollbar {
		display: none;
		width: 12px;
		background-color: $color-g-97;
	}

	.appointment_timestamp {
		font-size: $size-14;
		line-height: $size-18;
		color: $color-g-44;
	}
	.appointments_items {
		background: $color-white;
		border-radius: $size-8;
		padding: $size-16 $size-24;
		display: flex;
		justify-content: space-between;
		align-items: center;

		@include responsive(phone) {
			gap: $size-16;
		}
	}
}
.appointments_items-container {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
	gap: $size-10;

	&::-webkit-scrollbar {
		display: none;
		width: 12px;
		background-color: $color-g-97;
	}

	.appointments_items-title {
		font-weight: $fw-semi-bold;
		font-size: $size-20;
		line-height: $size-22;
		color: $color-black;
	}
	.appointments_items-timestamp {
		font-weight: $fw-regular;
		font-size: $size-16;
		color: $color-g-44;
	}
}
.appointment-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;

	.reschedule_action {
		background: transparent;
		cursor: pointer;
		padding: $size-10 $size-16;
		border-radius: $size-8;
		&:hover {
			background: $color-pri-t4;
		}
	}
	.appointment-actions__right {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: $size-16;
	}
}
.appointment_actions {
	display: flex;
	justify-content: start;
	align-items: center;
	gap: $size-10;
	cursor: pointer;
	padding: $size-6 $size-10;
	border-radius: $size-8;
	&:hover {
		background: $color-pri-t4;
	}

	.appointment_actions-title {
		font-weight: $fw-regular;
		font-size: $size-16;
		color: $color-pri-main;
	}
}
.empty-appointment-container {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: $size-36;
	padding: $size-32;

	.empty-appointment-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: $size-10;

		.empty-appointment-title {
			font-weight: $fw-semi-bold;
			font-size: $size-20;
			color: $color-g-21;
			text-align: center;
		}
		.empty-appointment-description {
			font-weight: $fw-regular;
			font-size: $size-16;
			color: $color-g-44;
			text-align: center;
		}
	}
	.empty-appointment-button {
		background: $color-white;
		border: $size-1 solid $color-pri;
	}
	
}
</style>

<style scoped lang="scss">
.loader-container {
	width: 100%;
	height: 50vh;
}
.details-container {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	height: 100%;
	width: 70%;
	padding-bottom: 70px;

	@include responsive(phone) {
		display: none !important;
	}
	@include responsive(tab-landscape) {
		display: none !important;
		position: absolute;
		background: $color-g-97;
		width: 100% !important;
	}
}
.modal-details-container {
	display: flex !important;
	flex-direction: column;
	justify-content: space-between;
	height: 100%;
	width: 100%;
	padding: $size-44 $size-32;

	@include responsive(tab-landscape) {
		display: flex !important;
		padding: $size-32;
	}
	@include responsive(phone) {
		display: flex !important;
		padding: $size-24;
	}
}
.modal-appointment-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
	gap: $size-16;

	.modal-appointment-actions__meeting {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: $size-16;

		@include responsive(phone) {
			width: 100%;
			flex-direction: column-reverse;

			button {
				width: 100% !important;
			}
		}
	}

	@include responsive(phone) {
		flex-direction: column-reverse;

		button {
			width: 100% !important;
		}
	}
}
:deep(.appointment-details-modal .modal__footer) {
	padding-top: $size-24;
	padding-bottom: $size-24;
}
:deep(.appointment-details-modal .modal__body) {
	width: 636px !important;

	@include responsive(tab-landscape) {
	}
	@include responsive(phone) {
		width: 100% !important;
	}
}

.details-container__body {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	overflow: scroll;
	gap: $size-64;
}
.top_container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	gap: $size-20;
}
.header {
	display: flex;
	justify-content: space-between;
	align-items: center;

	.heading {
		font-weight: $fw-semi-bold;
		font-size: $size-28;
		color: $color-black;
	}
	.close-container {
		cursor: pointer;
	}
}
.spacialist-details__container {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: $size-32;

	@include responsive(phone) {
		justify-content: flex-start;
	}

	.spacialist_details {
		display: flex;
		flex-direction: column;
		gap: $size-20;

		.specialist_details-heading {
			font-weight: $fw-regular;
			font-size: $size-14;
			color: $color-g-44;
			border-bottom: $size-1 solid $color-g-90;
			padding-bottom: $size-5;
		}
	}
	.specialist-details__actions {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: $size-8;

		.specialist-details__actions--diagnosis {
			background: $color-white;
			border: $size-1 solid $color-pri;
		}
	}
	.specialist-details__health_info {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;

		.specialist-details__health_info--items {
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			gap: $size-8;

			.specialist-details__health_info--item {
				display: flex;
				justify-content: flex-start;
				align-items: center;
				gap: $size-8;

				.specialist-details__health_info--item-key {
					font-size: $size-16;
					font-weight: $fw-regular;
					color: $color-g-44;
				}
				.specialist-details__health_info--item-value {
					font-size: $size-16;
					font-weight: $fw-regular;
					color: $color-g-21;
				}
			}

			
		}
	}
	.specialist_details-container {
		display: flex;
		justify-content: start;
		align-items: flex-start;
		gap: $size-20;

		@include responsive(phone) {
			flex-direction: column;
			justify-content: flex-start;
			align-items: center;
		}
	}
	.specialist_details-info-container {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: start;
		align-items: flex-start;
		gap: $size-5;

		.specialist-details-heading {
			display: flex;
			justify-content: flex-start;
			align-items: center;
			gap: $size-16;

			.specialist_details-rating-container {
				display: flex;
				justify-content: flex-start;
				align-items: center;
				gap: 0;

				.specialist_details-rating {
					font-weight: $fw-bold;
					font-size: $size-16;
					line-height: 24px;
					color: $color-g-44;
				}
			}
		}

		.specialist_details-info {
			display: flex;
			justify-content: start;
			align-items: flex-start;
			gap: $size-10;

			.specialist_details-name {
				font-weight: $fw-semi-bold;
				font-size: $size-26;
				color: $color-black;
			}
			.specialist_details-rating-container {
				display: flex;
				justify-content: start;
				align-items: center;
				gap: $size-5;

				.specialist_details-rating {
					font-size: $size-12;
					font-weight: $fw-regular;
					color: $color-g-44;
				}
			}
		}
		.specialist-details__patient {
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
			gap: $size-4;

			.specialist-details__icon {

				.specialist-details__no-rating span {
					font-weight: $fw-bold;
					font-size: $size-16;
					line-height: 24px;
					color: $color-g-44;
				}
			}

			@include responsive(phone) {
				flex-direction: column;
				justify-content: flex-start;
				align-items: flex-start;
				gap: $size-4;
			}

			.specialist_details-specialty {
				font-size: $size-14;
				font-weight: $fw-regular;
				color: $color-g-44;
			}
		}
	}
	.specialist-appointment-details {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		gap: $size-24;
		padding-left: 100px !important;

		@include responsive(tab-landscape) {
			padding-left: 100px !important;
		}
		@include responsive(phone) {
			padding-left: 0 !important;
		}

		.specialist_details-heading {
			width: 100%;
			font-weight: $fw-regular;
			font-size: $size-14;
			color: $color-g-44;
			border-bottom: $size-1 solid $color-g-90;
			padding-bottom: $size-5;
		}

		.specialist-appointment-details__container {
			display: flex;
			flex-direction: column;
			justify-content: start;
			align-content: center;
			gap: $size-10;

			@include responsive(phone) {
				flex-direction: column;
			}

			.specialist-appointment-details__title {
				font-size: $size-16;
				font-weight: $fw-regular;
				color: $color-g-44;

				@include responsive(phone) {
					font-size: $size-14;
					font-weight: $fw-regular;
					color: $color-g-44;
				}
			}
			.specialist-appointment-details__item {
				font-size: $size-16;
				font-weight: $fw-regular;
				color: $color-black;
				padding-bottom: $size-4;

				@include responsive(phone) {
					font-size: $size-14;
					font-weight: $fw-regular;
					color: $color-black;
					padding-bottom: $size-4;
				}
			}
		}
	}
}
.appointment_actions {
	display: flex;
	justify-content: space-between;
	align-items: center;

	.reschedule_action {
		font-weight: $fw-regular;
		font-size: $size-16;
		color: $color-pri-main;
		padding: $size-6 $size-10;
		border-radius: $size-8;
		cursor: pointer;
		&:hover {
			background: $color-pri-t4;
		}
	}
}

.caution-container {
    width: 468px;
    padding: $size-24;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    gap: $size-24;

    @include responsive(phone) {
        width: 100% !important;
    }

    .caution-content {
        font-weight: $fw-regular;
        font-size: $size-16;
        color: $color-g-21;
    }
}
.caution-actions {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;

    @include responsive(phone) {
        flex-direction: column;
        gap: $size-16;
        width: 100%;
        padding-top: 0;
        padding-bottom: 0;

        button {
            width: 100% !important;
        }
    }
}

:deep(.caution-message-modal .modal) {
	// width: 100% !important;

	@include responsive(tab-landscape) {
		width: 90% !important;
	}
	@include responsive(phone) {
		width: 100% !important;
		height: 100% !important;
	}
}
:deep(.caution-message-modal .modal__body) {
	width: 400px !important;
	height: 100% !important;

	@include responsive(tab-landscape) {
		height: 100% !important;
		width: 90% !important;
	}
	@include responsive(phone) {
		width: 100% !important;
		height: 100% !important;
	}
}

.desktop-visible {
	display: flex !important;

	@include responsive(phone) {
		display: none !important;
	}
}
.mobile-visible {
	display: none !important;

	@include responsive(phone) {
		display: flex !important;
	}
}
</style>