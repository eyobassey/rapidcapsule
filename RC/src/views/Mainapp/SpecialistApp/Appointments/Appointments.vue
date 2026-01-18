<template>
	<div class="page-content">
		<top-bar showButtons type="title-only" title="Appointments" @open-side-nav="$emit('openSideNav')" />

		<div class="page-content__body">
			<div class="content-container">
				<div class="tabs-container">
					<rc-tab
						:tabs="tabs"
						:currentTab="currentTab"
						@onClick="onChooseCurrentTab($event)"
					/>

					<loader v-if="isLoading" :useOverlay="false" :style="{ backgroundColor: 'transparent' }" />

					<div v-else class="appointments_root">
						<template v-if="Object.keys(appointmentItems).length">
							<div v-for="(appointments, timestamp, index) in appointmentItems" :key="timestamp + index">
								<div class="appointments_container">
									<p class="appointment_timestamp">{{ format(new Date(timestamp), 'MMMM dd, yyyy') }}</p>
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
											<div class="appointment_actions" @click="$router.push({
												name: 'SpecialistAppointmentDetails',
												params: { id: appointment._id },
												query: { appointment_status: currentTab }
											})">
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
									<h1 class="empty-appointment-title">
										You have no appointments yet
									</h1>
									<p class="empty-appointment-description">
										Appointment will show up here when they are booked.
									</p>
								</div>
							</div>
						</template>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { groupBy } from "lodash";
import { format } from "date-fns";
import { ref, inject, onMounted } from 'vue';
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader";
import RcTab from "@/components/RCTab";

const $http = inject('$_HTTP');
defineEmits(["openSideNav"]);

onMounted(() => getUserAppointments({ status: 'OPEN' }));

const appointmentItems = ref([]);
const isLoading = ref(false);

const currentTab = ref("upcoming");
const tabs = ref([
	{ title: "Upcoming", value: "upcoming" },
	{ title: "History", value: "history" },
]);

const onChooseCurrentTab = (current) => {
	currentTab.value = current;

	if (current === 'upcoming') {
		getUserAppointments({ status: 'OPEN' });
	} else getUserAppointments({ status: 'CLOSED' });
}

async function getUserAppointments(payload) {
	isLoading.value = true;
	await $http.$_getSpecialistAppointments(payload).then(({ data }) => {
		appointmentItems.value = groupBy(data.data, 'start_time');
		isLoading.value = false;
	});
}
</script>

<style scoped lang="scss">
.page-content {
	display: flex;
	flex-direction: column;
	gap: $size-12;
	width: 100%;
	height: 100%;
	padding: 0 256px;

	@include responsive(tab-portrait) {
		padding: $size-0;
	}

	@include responsive(phone) {
		padding: $size-0;
	}

	&__body {
		display: flex;
		flex-direction: column;
		gap: $size-26;
		width: 100%;
		height: 100%;
		// overflow-y: scroll;
		padding: $size-32 $size-48;

		@include responsive(phone) {
			padding: $size-0 $size-24;
		}

		&::-webkit-scrollbar {
			display: none;
			width: 12px;
			background-color: $color-g-97;
		}
	}
}
.tabs-container {
	width: 100%;
	height: 100%;

	@include responsive(phone) {
		width: 100%;
	}
	& .default-tabs {
		display: flex;
		overflow-x: scroll;
		white-space: nowrap;

		&::-webkit-scrollbar {
			display: none;
			width: 12px;
		}
	}
	& .tabs-container__content {
		height: 100%;
		width: 100%;
		padding: $size-32 $size-0;
	}
}
.rc-button-container {
	display: flex;
	justify-content: flex-end;
	height: $size-44;
}
.rc-button {
	background: $color-white;
	border: $size-1 solid $color-pri;
}
.appointments-container {
	width: 100%;
	height: 100%;
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
	padding-top: $size-32;
	padding-bottom: $size-32;

	&::-webkit-scrollbar {
		display: none;
		width: 12px;
		background-color: $color-g-97;
	}
}
.appointments_container {
	width: 100%;
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
