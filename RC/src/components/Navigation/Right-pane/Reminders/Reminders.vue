<template>
	<div class="flyout__content">
		<div class="flyout__content--header">
			<div class="title-group">
				<div class="collapse-icon" @click="$emit('collapse')">
					<icons name="chevron-right" id="collapse" />
					<icons name="times" id="close" />
				</div>
				<h3 class="sub-heading">Reminders</h3>
			</div>
			<div v-if="userReminders.length" class="btn-group">
				<buttonIcon type="primary" iconName="plus" @click="createReminderRef.onOpen({})" />
				<buttonIcon type="primary" iconName="cog-wheel" />
				<buttonIcon
					type="primary"
					iconName="list"
					@click="showAllReminders = !showAllReminders"
				/>
			</div>
		</div>
		<loader :useOverlay="true" v-if="isLoading" />
		<div v-else class="flyout__content--body">
			<div v-if="userReminders.length">
				<div class="calendar-picker" v-if="!showAllReminders">
					<date-picker mode="date" v-model="dateSelector" :masks="{ weekdays: 'WWW' }" />
				</div>
				<div>
					<template v-if="dateSelector || showAllReminders">
						<div class="reminder-container">
							<template v-if="!showAllReminders">
								<template v-if="remindersToday?.data?.length > 0">
									<p class="reminder-todays-date">
										{{ dateSelector.toDateString() }}
									</p>
									<div class="reminders-main-box">
										<div
											class="reminder-item-container"
											v-for="reminder in remindersToday?.data"
											:key="reminder.id"
										>
											<p class="reminder-item-time">
												{{ reminder.start_time }}
											</p>
											<div class="reminder-details-container">
												<p class="reminder-details-title">
													{{ reminder.title }}
												</p>
												<div class="reminder-details-description_container">
													<div
														v-for="description in reminder?.data"
														:key="description"
													>
														<span
															class="reminder-details-description"
															>{{ description }}</span
														><br />
													</div>
												</div>
											</div>
											<div class="reminder-action-button">
												<rc-menu left>
													<template v-slot:button>
														<icon
															icon-name="icons-hamburger"
															size="sm"
														/>
													</template>
													<div class="reminder-action_content">
														<p
															class="reminder-action_content__item"
															@click="onEditReminder(reminder)"
														>
															Edit
														</p>
														<p
															class="reminder-action_content__item"
															@click="onDeleteReminder(reminder)"
														>
															Delete
														</p>
													</div>
												</rc-menu>
											</div>
										</div>
									</div>
								</template>
								<div v-else class="empty-state-reminders">
									<p>There are no reminders selected for this day</p>
								</div>
							</template>
							<template v-else>
								<div
									class="reminder-item_container-all"
									v-for="reminder in userReminders"
									:key="reminder.id"
								>
									<p class="reminder-todays-date">
										{{ new Date(reminder?.date)?.toDateString() }}
									</p>
									<div
										class="reminder-item-container"
										v-for="item in reminder?.data"
										:key="item.id"
									>
										<p class="reminder-item-time">{{ item.start_time }}</p>
										<div class="reminder-details-container">
											<p class="reminder-details-title">{{ item.title }}</p>
											<div class="reminder-details-description_container">
												<div
													v-for="description in item?.data"
													:key="description"
												>
													<span class="reminder-details-description">{{
														description
													}}</span
													><br />
												</div>
											</div>
										</div>
										<div class="reminder-action-button">
											<rc-menu left>
												<template v-slot:button>
													<icon icon-name="icons-hamburger" size="sm" />
												</template>
												<div class="reminder-action_content">
													<p
														class="reminder-action_content__item"
														@click="onEditReminder(item)"
													>
														Edit
													</p>
													<p
														class="reminder-action_content__item"
														@click="onDeleteReminder(item)"
													>
														Delete
													</p>
												</div>
											</rc-menu>
										</div>
									</div>
								</div>
							</template>
						</div>
					</template>
					<template v-else>
						<div class="empty-state-reminders">
							<p>Please select a calendar date to continue</p>
						</div>
					</template>
				</div>
			</div>
			<div v-else class="empty">
				<buttonIcon
					type="primary"
					size="large"
					iconName="plus"
					@click="createReminderRef.onOpen({})"
				/>
				<p class="copy">Click to add a reminder</p>
			</div>
		</div>
	</div>
	<create-reminder
		ref="createReminderRef"
		@close="getUserReminders"
		@submit="onSubmitReminders('submit')"
		@update="onSubmitReminders('update')"
		@error="onSubmitReminders('error')"
	/>
	<dialog-modal
        v-if="isOpenDelete"
        title="Delete Certification?"
        @closeModal="onClose"
        :has-footer="false"
    >
		<template v-slot:body>
            <div class="delete-container">
                <div class="delete-container__actions">
                    <rc-button
                        label="Delete"
                        type="primary"
                        size="large"
                        @click="onDeleteReminder"
                        :loading="isLoadingDelete"
                        :disabled="isLoadingDelete"
                    />
                    <rc-button
                        label="Cancel"
                        type="secondary"
                        size="large"
                        :disabled="isLoadingDelete"
                        @click="isOpenDelete = false"
                    />
                </div>
            </div>
        </template>
	</dialog-modal>
	<Toast v-if="toastMessage" :message="toastMessage" />
</template>

<script>
import { isSameDay } from "date-fns";
import { ref, defineComponent, inject, onMounted, watchEffect } from "vue";
import { DatePicker } from "v-calendar";
import buttonIcon from "@/components/buttons/button-icon";
import TextInput from "@/components/inputs/text";
import TextareaInput from "@/components/inputs/textarea";
import DateTimePicker from "@/components/inputs/date-time-picker";
import SelectDropdown from "@/components/inputs/select-dropdown";
import SelectCombobox from "@/components/inputs/select-combobox";
import CheckBox from "@/components/inputs/check-box";
import icons from "@/components/icons";
import Icon from "@/components/Icon";
import RcMenu from "@/components/RCMenu";
import RcModal from "@/components/RCModal";
import DialogModal from "@/components/modals/dialog-modal";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import Toast from "@/components/alerts/toasts.vue";
import CreateReminder from "./CreateReminder";

export default defineComponent({
	setup(props, ctx) {
		const $http = inject("$http");

		const dateSelector = ref(new Date());
		const openModal = ref(false);
		const remindersToday = ref([]);
		const userReminders = ref([]);
		const activeReminder = ref({});
		const createReminderRef = ref();
		const isOpenDelete = ref(false);
		const isLoading = ref(false);
		const isLoadingDelete = ref(false);
		const showAllReminders = ref(false);
		const toastMessage = ref('');

		const filterReminders = (reminders, date) =>
			reminders?.find((reminder) => isSameDay(new Date(reminder.date), new Date(date)));

		const getUserReminders = async () => {
			isLoading.value = true;
			await $http.$_getUserReminders().then(({ data }) => {
				userReminders.value = data.data?.sort(
					(a, b) => Date.parse(b.date) - Date.parse(a.date)
				);
				remindersToday.value = filterReminders(data.data, new Date());
				isLoading.value = false;
			});
		};

		const onEditReminder = (reminder) => {
			createReminderRef.value.onOpen(reminder);
		};

		const onDeleteReminder = async (selectedItem) => {
			if (!isOpenDelete.value) {
                activeReminder.value = selectedItem;
                isOpenDelete.value = true;
                return;
            }

			isLoadingDelete.value = true;
			await $http.$_deleteReminder(activeReminder.value.id).then(({ data }) => {
				toastMessage.value = 'Reminder has been removed successfully!';
				isOpenDelete.value = false;
				isLoadingDelete.value = false;
				getUserReminders();
				setTimeout(() => toastMessage.value = '', 3000)
			});
		};

		const onSubmitReminders = (actionType) => {
			if (actionType === 'submit') {
				toastMessage.value = 'Reminder has been created successfully!';
			} else if (actionType === 'update') {
				toastMessage.value = 'Reminder has been updated successfully!';
			} else if (actionType === 'error') {
				toastMessage.value = 'Something went wrong! Please try again.';
			}
			getUserReminders();
			setTimeout(() => toastMessage.value = '', 3000)
		}

		onMounted(async () => await getUserReminders());

		watchEffect(() => {
			remindersToday.value = filterReminders(userReminders.value, dateSelector.value);
		});

		return {
			dateSelector,
			openModal,
			remindersToday,
			userReminders,
			activeReminder,
			createReminderRef,
			isOpenDelete,
			isLoadingDelete,
			isLoading,
			showAllReminders,
			toastMessage,

			onEditReminder,
			onDeleteReminder,
			getUserReminders,
			onSubmitReminders
		};
	},
	name: "Reminders",
	emits: ["collapse"],
	components: {
		DatePicker,
		buttonIcon,
		TextInput,
		TextareaInput,
		DateTimePicker,
		SelectDropdown,
		SelectCombobox,
		CheckBox,
		icons,
		Icon,
		DialogModal,
		RcMenu,
		RcModal,
		RcButton,
		Loader,
		Toast,
		CreateReminder,
	},
});
</script>

<style scoped lang="scss">
.flyout__content {
	display: flex;
	flex-direction: column;
	gap: $size-32;
	padding: $size-32;
	width: 32rem;

	transition: all 400ms ease-out;

	@include responsive(small-laptop) {
		position: absolute;
		top: 0;
		// left: -32rem;
		height: 100vh;
		background-color: $color-g-95;
		border-left: 1px solid $color-g-77;
		box-shadow: -$size-8 $size-0 $size-16 rgba($color-black, 0.15);
		z-index: 100;
	}

	@include responsive(tab-landscape) {
		// top: calc(100% + $size-12);
		// left: -27rem;
		// height: calc(100vh - $size-120);
		padding: $size-16;
		// border-radius: $size-8;
		// border: $size-1 solid $color-g-90;
		// box-shadow: -$size-4 $size-12 $size-44 rgba($color-black, 0.25);
	}

	@include responsive(phone) {
		top: -$size-24;
		// left: calc(-100vw + 67px);
		height: 100vh;
		width: 100vw;
		border-radius: none;
		box-shadow: none;
	}

	&--header {
		display: flex;
		gap: $size-24;

		.title-group {
			display: flex;
			align-items: center;
			gap: $size-4;
			flex-grow: 1;

			.collapse-icon {
				padding: $size-10;
				cursor: pointer;

				#collapse {
					@include responsive(tab-landscape) {
						display: none;
					}
				}

				#close {
					display: none;

					@include responsive(tab-landscape) {
						display: block;
					}
				}
			}

			.sub-heading {
				color: $color-black;
			}
		}

		.btn-group {
			display: flex;
			gap: $size-16;
		}
	}

	&--body {
		overflow-y: scroll;

		@include flexItem(vertical) {
			flex-grow: 1;
		}

		.empty {
			@include flexItem(vertical) {
				flex-grow: 1;
				align-items: center;
				justify-content: center;
				gap: $size-24;
			}
		}
	}
}
.reminder_container {
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-content: center;
	gap: $size-24;
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
}
.checkbox-input {
	width: 100%;
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
	width: 100% !important;
}
.calendar-picker :deep(.vc-container) {
	width: 100% !important;
	border: 0 !important;
	background: transparent;

	.vc-title {
		color: #151515;
		font-weight: 600;
		font-size: 36px;
	}
	.vc-pane {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: $size-28;
	}
	.vc-arrow svg path {
		color: #f16439;
	}
	.vc-highlights .vc-highlight {
		background: #fde4dd !important;
	}
	.vc-weeks {
		> :nth-child(1),
		> :nth-child(7),
		> .weekday-1 span,
		> .weekday-2 span {
			color: #f16439;
		}
	}
}

:deep(.modal-footer) {
	position: relative !important;
	justify-content: end !important;
}
.reminder-container {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: start;
	gap: $size-20;
	padding: $size-4 $size-10;
}
.reminder-todays-date {
	font-size: $size-18;
	line-height: $size-22;
	color: #6f6f6f;
}
.reminders-main-box {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: $size-10;
}
.reminder-item-container {
	width: 100%;
	display: flex;
	justify-content: start;
	align-items: start;
	gap: $size-20;
	padding-bottom: $size-20;
	border-bottom: $size-1 solid #8a8a8a;
}
.reminder-item-time {
	font-size: $size-16;
	color: $color-pri-main;
	white-space: nowrap;
	width: 25%;
}
.reminder-details-container {
	display: flex;
	flex-direction: column;
	align-items: start;
	gap: $size-6;
	width: 75%;
}
.reminder-details-title {
	color: $color-black;
	font-size: $size-20;
	font-weight: normal;
}
.reminder-details-description_container {
	display: flex;
	flex-direction: column;
	justify-content: start;
	gap: $size-2;
}
.reminder-details-description {
	color: $color-g-44;
	font-size: $size-14;
}
.reminder-action-button {
	width: 5%;
	cursor: pointer;
	&:hover {
		background: #eaeaea;
		border-radius: $size-4;
	}
}
.empty-state-reminders {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;

	& p {
		font-size: $size-16;
		color: #f16439;
		white-space: nowrap;
	}
}
.reminder-action_content {
	width: 100px;
	padding: $size-10;
	display: flex;
	flex-direction: column;
	justify-content: start;
	gap: $size-5;

	.reminder-action_content__item {
		color: $color-black;
		padding: $size-5;

		&:hover {
			color: $color-black;
			background: $color-g-92;
			border-radius: $size-4;
			padding: $size-5;
		}
	}
}
.reminder-delete_container {
	display: flex;
	flex-direction: column;
	justify-content: start;
	gap: $size-20;

	.reminder-delete_title {
		font-size: $size-20;
		font-weight: $fw-bold;
	}
	.reminder-delete_actions {
		display: flex;
		justify-content: start;
		gap: $size-10;
	}
}
.reminder-item_container-all {
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: start;
	gap: $size-20;
}
.empty-reminders-container {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
}
.delete-container {
	display: flex;
	flex-direction: column;
	justify-content: start;
	gap: $size-20;

	.delete-container__actions {
		display: flex;
		justify-content: start;
		gap: $size-10;

        & button {
            width: 100%
        }
	}
}
</style>
