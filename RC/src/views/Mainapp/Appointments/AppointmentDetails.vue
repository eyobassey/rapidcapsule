<template>
	<div class="container">
		<div class="top_container">
			<div class="header">
				<h1 class="heading">Details</h1>
				<div @click="$emit('close')" class="close-container">
					<rc-icon icon-name="icon-close" size="xsm" />
				</div>
			</div>
			<div class="loader-container" v-if="isLoading">
				<loader :useOverlay="false" style="position: relative" />
			</div>
			<template v-else>
				<div class="spacialist_details">
					<p class="specialist_details-heading">Specialist Details</p>
					<div class="specialist_details-container">
						<div class="specialist_details-avatar">
							<!-- <img :src="require('@/assets/images/default-avatar.png')" alt="Avatar" /> -->
							<avatar size="small" :firstname="profile.profile.first_name" :lastname="profile.profile.last_name" />
						</div>
						<div class="specialist_details-info-container">
							<div class="specialist_details-info">
								<h2 class="specialist_details-name">{{ profile.full_name }}</h2>
								<div class="specialist_details-rating-container">
									<span class="specialist_details-rating">4.5</span>
									<rc-icon icon-name="icon-star-rating" size="xms" />
								</div>
							</div>
							<p class="specialist_details-spacialty">{{ appointment.category }}</p>
							<p class="specialist_details-price">₦200 - ₦500/hour</p>
						</div>
					</div>
				</div>
				<div class="specialist_appointment_details">
					<p class="specialist_appointment_details-heading">Appointment Details</p>
					<div class="specialist_appointment_details-body">
						<div class="specialist_appointment_details-container">
							<p class="specialist_appointment_details-title">Meeting type:</p>
							<p class="specialist_appointment_details-value">Audio only</p>
						</div>
						<div class="specialist_appointment_details-container">
							<p class="specialist_appointment_details-title">Time:</p>
							<p class="specialist_appointment_details-value">
								{{ new Date(appointment.start_time).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false }) }}
								({{ new Date(appointment.start_time).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric' }) }})
							</p>
						</div>
						<div class="specialist_appointment_details-container">
							<p class="specialist_appointment_details-title">Date:</p>
							<p class="specialist_appointment_details-value">{{ new Date(appointment.start_time).toDateString() }}</p>
						</div>
					</div>
				</div>
			</template>
		</div>
		<div class="appointment_actions" v-if="!isLoading">
			<p class="reschedule_action">Reschedule</p>
			<rc-button
				type="primary"
				label="Start Meeting"
				class="start_meeting_action"
				:disabled="isLoading || !appointment.start_url"
				@click="handleStartMeetings(appointment.start_url)"
			/>
		</div>
	</div>
</template>

<script>
import { defineComponent, watchEffect, ref, inject } from 'vue'
import RcIcon from "@/components/RCIcon";
import RcButton from "@/components/buttons/button-primary.vue";
import Loader from "@/components/Loader/main-loader.vue";
import Avatar from "@/components/Avatars/avatar-fixed.vue";

export default defineComponent({
	setup(props) {
		const $http = inject('$http');

		const isLoading = ref(false);
		const profile = ref({});

		watchEffect(() => {
			isLoading.value = true;
			const userId = props.appointment.specialist;
			$http.$_getOneUser(userId).then(({ data }) => {
				profile.value = data.data;
				isLoading.value = false;
			});
		});

		const handleStartMeetings = (start_url) => window.open(start_url, '_blank')

		return {
			isLoading,
			profile,
			handleStartMeetings
		}
	},
	name: "AppointmentDetails",
	props: {
		appointment: { required: true, default: () => {} },
	},
	components: {
		RcIcon,
		Loader,
		RcButton,
		Avatar
	},
});
</script>

<style scoped lang="scss">
.loader-container {
	width: 100%;
	height: 100%;
}
.container {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	height: 100%;
	width: 100%;
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
.spacialist_details {
	display: flex;
	flex-direction: column;
	gap: $size-20;

	.specialist_details-heading {
		font-weight: $fw-regular;
		font-size: $size-12;
		color: $color-g-44;
		border-bottom: $size-1 solid $color-g-90;
		padding-bottom: $size-5;
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
			font-size: $size-16;
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
	.specialist_details-spacialty {
		font-size: $size-12;
		font-weight: $fw-regular;
		color: $color-g-21;
	}
	.specialist_details-price {
		font-size: $size-12;
		font-weight: $fw-regular;
		color: $color-g-21;
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
		gap: $size-5;
	}
	.specialist_appointment_details-heading {
		font-weight: $fw-regular;
		font-size: $size-12;
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
			font-size: $size-12;
			font-weight: $fw-regular;
			color: $color-g-44;
		}
		.specialist_appointment_details-value {
			font-size: $size-12;
			font-weight: $fw-regular;
			color: $color-g-21;
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



