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
										{{ appointment.patient?.full_name }}
									</p>
									<div class="appointments_items-datetime">
										<p class="appointments_items-timestamp">
											{{ new Date(appointment.start_time).toDateString() }}
										</p>
										<p class="appointments_items-timestamp">
											{{ new Date(appointment.start_time).toLocaleString('en-US', {
												hour: 'numeric', minute: 'numeric', hour12: false }) 
											}}
											({{ new Date(appointment.start_time).toLocaleString('en-US', {
												hour: 'numeric', minute: 'numeric' })
											}})
										</p>
									</div>
								</div>
								<div class="appointment_actions" @click="onShow(appointment)">
									<p class="appointment_actions-title">View Details</p>
									<rc-icon icon-name="icon-carrot-right" size="xs" />
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
						<p class="empty-appointment-description">Appointment will show up here when they are booked.</p>
					</div>
				</div>
			</template>
		</div>
		<template v-if="isOpen">
			<div class="details-container">
				<div class="details-container__body">
					<div class="top_container">
						<div class="header">
							<h1 class="heading">Details</h1>
							<div @click="isOpen = false">
								<div class="close-container">
									<rc-icon icon-name="icon-close" size="xsm" />
								</div>
							</div>
						</div>
						<div class="loader-container" v-if="isFetching">
							<loader :useOverlay="false" style="position: relative" />
						</div>
						<div v-else class="spacialist-details__container">
							<div class="spacialist_details">
								<p class="specialist_details-heading">Patient Information</p>
								<div class="specialist_details-container">
									<div class="specialist_details-avatar">
										<avatar size="small" :firstname="profile.firstName" :lastname="profile.lastName" />
									</div>
									<div class="specialist_details-info-container">
										<h2 class="specialist_details-name">{{ profile.fullName }}</h2>
										<div class="specialist-details__patient">
											<p class="specialist_details-spacialty">{{ profile.gender }}</p>
											<p class="specialist_details-spacialty">{{ calculateAge(profile.dateOfBirth) }} Yrs</p>
										</div>
									</div>
								</div>
							</div>
							<div class="specialist-details__health_info">
								<div class="specialist-details__health_info--items">
									<div class="specialist-details__health_info--item">
										<p class="specialist-details__health_info--item-key">Weight:</p>
										<p class="specialist-details__health_info--item-value">
											{{ profile.weight.value }} {{ profile.weight.unit }}
										</p>
									</div>
									<div class="specialist-details__health_info--item">
										<p class="specialist-details__health_info--item-key">Height:</p>
										<p class="specialist-details__health_info--item-value">
											{{ profile.height.value }} {{ profile.height.unit }}
										</p>
									</div>
									<div class="specialist-details__health_info--item">
										<p class="specialist-details__health_info--item-key">BMI:</p>
										<p class="specialist-details__health_info--item-value">
											- <span class="specialist-details__health_info--item-key">({{ profile.weightStatus }})</span>
										</p>
									</div>
									<div class="specialist-details__health_info--item">
										<p class="specialist-details__health_info--item-key">Smoker:</p>
										<p class="specialist-details__health_info--item-value">{{ profile.is_smoker }}</p>
									</div>
								</div>
								<div class="specialist-details__health_info--items">
									<div class="specialist-details__health_info--item">
										<p class="specialist-details__health_info--item-key">High Cholesterol:</p>
										<p class="specialist-details__health_info--item-value">-</p>
									</div>
									<div class="specialist-details__health_info--item">
										<p class="specialist-details__health_info--item-key">Diabetic:</p>
										<p class="specialist-details__health_info--item-value">-</p>
									</div>
									<div class="specialist-details__health_info--item">
										<p class="specialist-details__health_info--item-key">Hypertensive:</p>
										<p class="specialist-details__health_info--item-value">-</p>
									</div>
									<div class="specialist-details__health_info--item">
										<p class="specialist-details__health_info--item-key">Recent Injury:</p>
										<p class="specialist-details__health_info--item-value">-</p>
									</div>
								</div>
							</div>
							<div class="specialist-details__actions">
								<rc-button
									type="secondary"
									label="View Self Diagnosis Report"
									class="specialist-details__actions--diagnosis"
								/>
								<rc-button
									type="secondary"
									label="View Medical History"
									class="specialist-details__actions--history"
								/>
							</div>
							<div class="specialist_appointment_details">
								<p class="specialist_appointment_details-heading">Appointment Details</p>
								<div class="specialist_appointment_details-body">
									<div class="specialist_appointment_details-container">
										<p class="specialist_appointment_details-title">Meeting type:</p>
										<p class="specialist_appointment_details-value">{{ appointment.meeting_type }}</p>
									</div>
									<div class="specialist_appointment_details-container">
										<p class="specialist_appointment_details-title">Time:</p>
										<p class="specialist_appointment_details-value">
											{{ new Date(appointment.start_time).toLocaleString('en-US', {
												hour: 'numeric', minute: 'numeric', hour12: false
											}) }}
											({{ new Date(appointment.start_time).toLocaleString('en-US', {
												hour: 'numeric', minute: 'numeric'
											}) }})
										</p>
									</div>
									<div class="specialist_appointment_details-container">
										<p class="specialist_appointment_details-title">Date:</p>
										<p class="specialist_appointment_details-value">
											{{ new Date(appointment.start_time).toDateString() }}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div class="appointment-actions" v-if="!isFetching">
						<rc-button
							type="secondary"
							label="Reschedule"
							class="reschedule_action"
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
			</div>
		</template>
		<DialogModal
			v-if="isOpen"
			title="Details"
			@closeModal="isOpen = false"
			:has-footer="true"
		>
			<template v-slot:body>
				<div class="loader-container" v-if="isFetching">
					<loader :useOverlay="false" style="position: relative" />
				</div>
				<div v-else class="mobile-details-container">
					<div class="details-container__body">
						<div class="top_container">
							<div class="spacialist-details__container">
								<div class="spacialist_details">
									<p class="specialist_details-heading">Patient Information</p>
									<div class="specialist_details-container">
										<div class="specialist_details-avatar">
											<avatar size="small" :firstname="profile.firstName" :lastname="profile.lastName" />
										</div>
										<div class="specialist_details-info-container">
											<h2 class="specialist_details-name">{{ profile.fullName }}</h2>
											<div class="specialist-details__patient">
												<p class="specialist_details-spacialty">{{ profile.gender }}</p>
												<p class="specialist_details-spacialty">{{ calculateAge(profile.dateOfBirth) }} Yrs</p>
											</div>
										</div>
									</div>
								</div>
								<div class="specialist-details__health_info">
									<div class="specialist-details__health_info--items">
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">Weight:</p>
											<p class="specialist-details__health_info--item-value">
												{{ profile.weight.value }} {{ profile.weight.unit }}
											</p>
										</div>
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">Height:</p>
											<p class="specialist-details__health_info--item-value">
												{{ profile.height.value }} {{ profile.height.unit }}
											</p>
										</div>
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">BMI:</p>
											<p class="specialist-details__health_info--item-value">
												- <span class="specialist-details__health_info--item-key">({{ profile.weightStatus }})</span>
											</p>
										</div>
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">Smoker:</p>
											<p class="specialist-details__health_info--item-value">{{ profile.is_smoker }}</p>
										</div>
									</div>
									<div class="specialist-details__health_info--items">
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">High Cholesterol:</p>
											<p class="specialist-details__health_info--item-value">-</p>
										</div>
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">Diabetic:</p>
											<p class="specialist-details__health_info--item-value">-</p>
										</div>
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">Hypertensive:</p>
											<p class="specialist-details__health_info--item-value">-</p>
										</div>
										<div class="specialist-details__health_info--item">
											<p class="specialist-details__health_info--item-key">Recent Injury:</p>
											<p class="specialist-details__health_info--item-value">-</p>
										</div>
									</div>
								</div>
								<div class="specialist-details__actions">
									<rc-button
										type="secondary"
										label="View Self Diagnosis Report"
										class="specialist-details__actions--diagnosis"
									/>
									<rc-button
										type="secondary"
										label="View Medical History"
										class="specialist-details__actions--history"
									/>
								</div>
								<div class="specialist_appointment_details">
									<p class="specialist_appointment_details-heading">Appointment Details</p>
									<div class="specialist_appointment_details-body">
										<div class="specialist_appointment_details-container">
											<p class="specialist_appointment_details-title">Meeting type:</p>
											<p class="specialist_appointment_details-value">{{ appointment.meeting_type }}</p>
										</div>
										<div class="specialist_appointment_details-container">
											<p class="specialist_appointment_details-title">Time:</p>
											<p class="specialist_appointment_details-value">
												{{ new Date(appointment.start_time).toLocaleString('en-US', {
													hour: 'numeric', minute: 'numeric', hour12: false
												}) }}
												({{ new Date(appointment.start_time).toLocaleString('en-US', {
													hour: 'numeric', minute: 'numeric'
												}) }})
											</p>
										</div>
										<div class="specialist_appointment_details-container">
											<p class="specialist_appointment_details-title">Date:</p>
											<p class="specialist_appointment_details-value">
												{{ new Date(appointment.start_time).toDateString() }}
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
				<div class="mobile-appointment-actions" v-if="!isFetching">
					<rc-button
						type="secondary"
						label="Reschedule"
						class="reschedule_action"
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
			</template>
		</DialogModal>
	</div>
</template>

<script setup>
import { groupBy } from "lodash";
import { useRouter } from 'vue-router';
import { ref, inject, onMounted } from 'vue'
import RcIcon from "@/components/RCIcon";
import RcButton from "@/components/buttons/button-primary.vue";
import Loader from "@/components/Loader/main-loader.vue";
import Avatar from "@/components/Avatars/avatar-fixed.vue";
import DialogModal from "@/components/modals/dialog-modal.vue";

const $http = inject('$http');
const router = useRouter();

const profile = ref({});
const appointments = ref([]);
const appointment = ref({});
const isLoading = ref(false);
const isFetching = ref(true);
const isOpen = ref(false);
const appointmentItems = ref([]);

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

	await $http.$_getSpecialistAppointments(queryParams).then(({ data }) => {
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

	await $http.$_getOneUser(activeItem.patient.id).then(({ data }) => {
		profile.value = {
			fullName: data.data?.full_name,
			firstName: data.data?.profile?.first_name,
			lastName: data.data?.profile?.last_name,
			gender: data.data?.profile?.gender,
			dateOfBirth: data.data?.profile?.date_of_birth,
			weight: data.data?.profile?.basic_health_info?.weight,
			height: data.data?.profile?.basic_health_info?.height,
			weightStatus: data.data?.profile?.health_risk_factors?.weight_status,
			isSmoker: data.data?.profile?.health_risk_factors?.is_smoker,
		};
		isFetching.value = false;
	});
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
			@include flexItem(vertical) {
				gap: $size-16;
			}
		}
	}
}
.appointments_items-container {
	display: flex;
	flex-direction: column;
	justify-content: start;
	gap: $size-10;

	&::-webkit-scrollbar {
		display: none;
		width: 12px;
		background-color: $color-g-97;
	}

	@include responsive(phone) {
		@include flexItem(vertical) {
			align-items: center;
		}
	}

	.appointments_items-title {
		font-weight: $fw-semi-bold;
		font-size: $size-20;
		line-height: $size-22;
		color: $color-black;
	}
	.appointments_items-datetime {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: $size-24;

		.appointments_items-timestamp {
			font-weight: $fw-regular;
			font-size: $size-16;
			color: $color-g-44;
		}
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
		position: absolute;
		background: $color-g-97;
		width: 100% !important;
	}
}
.mobile-details-container {
	display: none !important;
	flex-direction: column;
	justify-content: space-between;
	height: 100%;
	width: 100%;

	@include responsive(phone) {
		display: flex !important;
	}
}
.mobile-appointment-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
}
:deep(.overlay) {
	display: none !important;

	@include responsive(phone) {
		display: flex !important;
	}
}
.details-container__body {
	width: 100%;
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
	justify-content: flex-start;
	gap: $size-32;

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
		.specialist-details__actions--history {}
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

		.specialist_details-avatar {
			width: 60px;
			height: 60px;
			border-radius: 50%;

			img {
				width: 60px;
				height: 60px;
				border-radius: 50%;
			}
		}
	}
	.specialist_details-info-container {
		display: flex;
		flex-direction: column;
		justify-content: start;
		align-items: flex-start;
		gap: $size-5;

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
			justify-content: flex-start;
			align-items: center;
			gap: $size-32;

			.specialist_details-spacialty {
				font-size: $size-16;
				font-weight: $fw-regular;
				color: $color-g-21;
			}
		}
	}
	.specialist_appointment_details {
		display: flex;
		flex-direction: column;
		gap: $size-10;

		.specialist_appointment_details-body{
			display: flex;
			flex-direction: column;
			justify-content: start;
			align-items: start;
			gap: $size-8;
		}
		.specialist_appointment_details-heading {
			font-weight: $fw-regular;
			font-size: $size-14;
			color: $color-g-44;
			border-bottom: $size-1 solid $color-g-90;
			padding-bottom: $size-5;
		}
		.specialist_appointment_details-container {
			display: flex;
			justify-content: start;
			align-content: center;
			gap: $size-10;

			.specialist_appointment_details-title {
				font-size: $size-16;
				font-weight: $fw-regular;
				color: $color-g-44;
			}
			.specialist_appointment_details-value {
				font-size: $size-16;
				font-weight: $fw-regular;
				color: $color-g-21;
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
</style>