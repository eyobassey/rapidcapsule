<template>
	<div>
		<dialog-modal
			v-if="isOpen"
			title="Add Reminder"
			@closeModal="onClose"
		>
			<template v-slot:body>
				<div class="reminder_container">
					<text-input
						label="Reminder Title"
						class="reminder_title"
						placeholder="Reminder Title"
						v-model="reminder.title"
					/>
					<textarea-input
						placeholder="Reminder Description"
						v-model="reminder.data"
					/>
					<div class="date-time-picker">
						<rc-datepicker :min-date="new Date()" label="Date" v-model="reminder.start_date" />
						<rc-timepicker label="Time" v-model="reminder.start_time" />
					</div>
					<div class="select-combo-container">
						<select-dropdown
							label="Frequency"
							:options="['Once', 'Daily', 'Weekly', 'Monthly']"
							class="select_dropdown"
							v-model="reminder.frequency"
						/>
						<text-input class="interval-container" label="Period" v-model="reminder.period" :disabled="!reminder.interval">
							<div class="frequency-container" v-if="reminder.interval">
								<p class="frequency-text">{{ reminder.interval }}</p>
							</div>
                        </text-input>
						<check-box class-name="checkbox-input" v-model="reminder.is_all_day" >
							<p class="checkbox-text">All day</p>
						</check-box>
					</div>
					<div class="reminder_action__button">
						<rc-button
							label="Save"
							type="primary"
							size="large"
							@click="onSubmit"
							:loading="isLoading"
							:disabled="isLoading"
						/>
					</div>
				</div>
			</template>
		</dialog-modal>
	</div>
</template>

<script>
import { defineComponent, inject, ref, watchEffect } from 'vue';
import TextInput from "@/components/inputs/text";
import TextareaInput from "@/components/inputs/textarea";
import CheckBox from "@/components/inputs/check-box";
import DialogModal from "@/components/modals/dialog-modal";
import RcButton from "@/components/buttons/button-primary";
import RcSelect from "@/components/RCSelect";
import SelectDropdown from "@/components/inputs/select-dropdown";
import SelectCombobox from "@/components/inputs/select-combobox";
import RcTimepicker from "@/components/RCTimepicker";
import RcDatepicker from "@/components/RCDatepicker";
import RcComboBox from "@/components/RCComboBox";
import Loader from "@/components/Loader/main-loader.vue";

export default defineComponent({
	setup(props, ctx){
		const $http = inject('$http');

		const isLoading = ref(false);
		const isOpen = ref(false);
		const reminder = ref({
			title: null,
			data: null,
			start_date: null,
			start_time: null,
			frequency: null,
			period: null,
			interval: null,
			is_all_day: false,
		});
		
		const onOpen = (payload) => {
			reminder.value = {
				...reminder.value,
				...payload,
				data: payload?.data?.join('\n'),
			}
			isOpen.value = true;
			ctx.emit('open', payload);
		}

		const onClose = () => {
			reminder.value = {
				title: null,
				data: null,
				start_date: null,
				start_time: null,
				frequency: null,
				period: null,
				interval: null,
				is_all_day: false,
			}
			isOpen.value = false;
			ctx.emit('close', {});
		}

		watchEffect(() => {
			const FREQ = reminder.value.frequency;
			if (FREQ === 'Once') reminder.value.interval = null;
			else if (FREQ === 'Daily') reminder.value.interval = 'Days';
			else if (FREQ === 'Weekly') reminder.value.interval = 'Weeks';
			else if (FREQ === 'Monthly') reminder.value.interval = 'Months';
		});

		const onSubmit = async () => {
			isLoading.value = true;

			const payload = {
				...reminder.value,
				data: reminder.value?.data?.split('\n'),
			}

			if(reminder.value.id) {
				const reminderId = reminder.value.id;
				return await $http.$_updateReminder({ payload, reminderId }).then(({ data }) => {
					ctx.emit('update', { payload: data?.data });
					isLoading.value = false;
					onClose();
				}).catch((error) => {
					ctx.emit('error', error.message);
					isLoading.value = false;
				});
			}

			return await $http.$_createReminder(payload).then(({ data }) => {
				ctx.emit('submit', { payload: data?.data });
				isLoading.value = false;
				onClose();
			}).catch((error) => {
				ctx.emit('error', error.message);
				isLoading.value = false;
			});
		}

		return {
			reminder,
			isLoading,
			onSubmit,
			onClose,
			onOpen,
			isOpen,

		}
	},
	name: "CreateReminder",
    emits: ['close', 'submit', 'collapse', 'open'],
	components: {
		RcTimepicker,
		RcDatepicker,
		RcComboBox,
		TextInput,
		RcButton,
		RcSelect,
		TextareaInput,
		CheckBox,
		DialogModal,
		Loader,
		SelectDropdown,
		SelectCombobox,
	},
});
</script>

<style scoped lang="scss">
.reminder_container {
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-content: center;
	gap: $size-24;
	// padding: $size-32;

	.reminder_title {
		width: 100% !important;
	}
}
.date-time-picker {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: $size-20;
}
.select-combo-container {
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-content: center;
	gap: $size-20;
	position: relative;

	.select_dropdown {
		width: 100%;
	}

	.frequency-container {
		position: relative;
		width: 40%;
		height: 85%;
		margin: $size-4;
		border-radius: $size-4;
		// border: 1px solid $color-g-67;
		background-color: $color-g-90;
		color: $color-black;

	}
}
:deep(.interval-container) {
	width: 100%;
	position: relative;
	display: flex;

	& .frequency-container {
		position: absolute;
		right: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: $size-8;

		& .frequency-text {
			font-size: $size-16;
			font-weight: $fw-medium;
			color: $color-black;
		}
	}

}
.checkbox-input {
	width: 80%;
	display: flex;
	justify-content: start;
	align-items: center;

	&.input__check-box {
		width: 40px;
	}

}
.checkbox-text {
	font-size: $size-16;
	color: $color-g-54;
}
.calendar-picker {
	width: 100%;
}
.vc-container {
	width: 100%;
	border: 0;
	background: transparent;
}
.vc-container :deep(.vc-title) {
	color: #151515;
	font-weight: 600;
	font-size: 36px;
}
.vc-container :deep(.vc-pane) {
    display: flex;
    flex-direction: column;
	justify-content: center;
    gap: $size-28;
}
.vc-container :deep(.vc-arrow svg path) {
	color: #F16439;
}
.vc-container :deep(.vc-highlights .vc-highlight) {
	background: #FDE4DD !important;
}
.vc-container :deep(.vc-weeks) {
	>:nth-child(1), >:nth-child(7),  >.weekday-1 span, >.weekday-2 span {
		color: #F16439;
	}
}
.reminder_action__button {
	width: 100%;
	display: flex;
	justify-content: end;
}
</style>