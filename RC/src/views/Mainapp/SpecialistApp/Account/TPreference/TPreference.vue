<template>
    <loader v-if="isLoading" :useOverlay="false" style="position: absolute" />
    <div v-else class="container">
        <div class="specialist-info">
            <div class="specialist-availability">
                <div class="specialist-availability__header">
                    <p class="specialist-availability__text">Availability</p>
                    <ButtonIcon
                        type="primary specialist-availability__buttonicon"
                        iconName="edit"
                        color="#F16439"
                        @click="isOpenAvailability = true"
                        v-if="timeAvailable.length"
                    />
                </div>
                <rc-button
                    type="secondary"
                    label="Set Availability"
                    class="specialist-availability__button"
                    @click="isOpenAvailability = true"
                    v-if="!timeAvailable.length"
                />
                <div class="specialist-availability__body">
                    <template v-for="item in timeAvailable" :key="item.day">
                        <div v-if="item.active" class="specialist-availability__items">
                            <p class="specialist-availability__body--days">{{ item.day }}</p>
                            <p class="specialist-availability__body--time">
                                {{ format(parse(item.start_time, 'HH:mm', new Date()), 'hh:mm a') }} - 
                                {{ format(parse(item.end_time, 'HH:mm', new Date()), 'hh:mm a') }}
                            </p>
                        </div>
                    </template>
                </div>
            </div>
            <div class="specialist-preferences">
                <div class="specialist-preferences__header">
                    <p class="specialist-preferences__text">Patient Preferences</p>
                    <ButtonIcon
                        type="primary specialist-preferences__buttonicon"
                        iconName="edit"
                        color="#F16439"
                        @click="isOpenPreference = true"
                        v-if="Object.keys(preferences).length"
                    />
                </div>
                <rc-button
                    type="secondary"
                    label="Set Preferences"
                    class="specialist-preferences__button"
                    @click="isOpenPreference = true"
                    v-if="!Object.keys(preferences).length"
                />
                <template v-if="Object.keys(preferences).length">
                    <div class="specialist-preferences__body">
                        <div class="specialist-preferences__items">
                            <p class="specialist-preferences__body--key">Gender:</p>
                            <p class="specialist-preferences__body--value">
                                {{ preferences.gender }}
                            </p>
                        </div>
                        <div class="specialist-preferences__items">
                            <p class="specialist-preferences__body--key">Language:</p>
                            <p class="specialist-preferences__body--value">
                                {{ preferences.language }}
                            </p>
                        </div>
                        <div class="specialist-preferences__items">
                            <p class="specialist-preferences__body--key">Time zone:</p>
                            <p class="specialist-preferences__body--value">
                                {{ preferences.timezone }}
                            </p>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>

    <DialogModal
        v-if="isOpenAvailability"
        title="Availability"
        @closeModal="onClose"
        :has-footer="true"
    >
        <template v-slot:loader>
            <Loader v-if="false" :useOverlay="true" :rounded="true" />
        </template>
        <template v-slot:body>
            <div class="availability-modal">
                <p class="availability-modal__header">
                    Select the days and times you will be available to attend to patients. Your
                    current time-zone is UTC +1 (West African Time). You can change it
                    <span class="availability-modal__info--span">App Settings</span> incase you
                    change location.
                </p>
                <div class="availability-modal__body">
                    <template v-for="item in tempTimeAvailable" :key="JSON.stringify(item)">
                        <div class="availability-modal__body--items">
                            <CheckBox
                                class="availability-modal__body--checkbox"
                                :class="{ isActiveDays: item.active }"
                                v-model="item.active"
                            >
                                {{ item.day }}
                            </CheckBox>
                            <div class="availability-modal__body--inputs">
                                <TextInput
                                    type="time"
                                    label="Start Time"
                                    class="availability-modal__body--input"
                                    v-model="item.start_time"
                                    :disabled="!item.active"
                                />
                                <span class="availability-modal__body--seperator">-</span>
                                <TextInput
                                    type="time"
                                    label="End Time"
                                    class="availability-modal__body--input"
                                    v-model="item.end_time"
                                    :disabled="!item.active"
                                />
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </template>
        <template v-slot:foot>
            <Button
                type="primary"
                label="Save"
                size="medium"
                class="availability-action-btn"
                :loading="isFetching"
                :disabled="isDisabled || isFetching"
                @click="onSubmitAvailability"
            />
        </template>
    </DialogModal>
    <DialogModal
        v-if="isOpenPreference"
        title="Patient Preference"
        @closeModal="onClose"
        :has-footer="true"
    >
        <template v-slot:loader>
            <Loader v-if="false" :useOverlay="true" :rounded="true" />
        </template>
        <template v-slot:body>
            <div class="preference-modal">
                <p class="preference-modal__header">
                    Set your preferences for the class of patients you would like to attend to.
                </p>
                <div class="preference-modal__body">
                    <div class="preference-modal__body--gender">
                        <div class="preference-modal__body--gender-items">
                            <div class="preference-modal__body--gender-header">
                                <div class="preference-modal__body--gender-header-item">
                                    <p class="preference-modal__body--gender_text">Gender:</p>
                                    <rc-radio
                                        v-model="tempPreferences.gender"
                                        :options="genderOptions"
                                    />
                                </div>
                            </div>
                            <div class="preference-modal__body--select">
                                <select-dropdown
                                    label="Language"
                                    :options="languageOptions"
                                    v-model="tempPreferences.language"
                                />
                                <select-dropdown
                                    label="Timezone"
                                    :options="timezoneOptions"
                                    v-model="tempPreferences.timezone"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
        <template v-slot:foot>
            <Button
                type="primary"
                label="Save"
                class="preference-action-btn"
                size="medium"
                :loading="isFetching"
                :disabled="isDisabled || isFetching"
                @click="onSubmitPreference"
            />
        </template>
    </DialogModal>
</template>


<script setup>
import { useToast } from "vue-toast-notification";
import { ref, onMounted, watchEffect, inject } from "vue";
import { format, parse } from "date-fns";

import RcButton from "@/components/buttons/button-primary.vue";
import ButtonIcon from "@/components/buttons/button-icon.vue";
import DialogModal from "@/components/modals/dialog-modal.vue";
import Loader from "@/components/Loader/main-loader.vue";
import Button from "@/components/buttons/button-primary.vue";
import CheckBox from "@/components/inputs/check-box.vue";
import SelectDropdown from "@/components/inputs/select-dropdown";
import TextInput from "@/components/inputs/text";
import RcRadio from "@/components/RCRadio";

import timezoneOptions from "../helpers/timezones";
import languageOptions from "../helpers/languages";

const $http = inject("$http");
const $toast = useToast();
defineEmits(["openSideNav"]);

const isOpenAvailability = ref(false);
const isOpenPreference = ref(false);
const isLoading = ref(true);
const isFetching = ref(false);
const isDisabled = ref(true);

onMounted (() => getTimeAvailability())

const genderOptions = ref([
	{ name: "All", value: "all" },
	{ name: "Male", value: "male" },
	{ name: "Female", value: "female" },
]);

const timeAvailable = ref([]);
const tempTimeAvailable = ref([
	{ active: false, day: "Monday", start_time: null, end_time: null },
	{ active: false, day: "Tuesday", start_time: null, end_time: null },
	{ active: false, day: "Wednessday", start_time: null, end_time: null },
	{ active: false, day: "Thursday", start_time: null, end_time: null },
	{ active: false, day: "Friday", start_time: null, end_time: null },
	{ active: false, day: "Saturday", start_time: null, end_time: null },
	{ active: false, day: "Sunday", start_time: null, end_time: null },
]);

const preferences = ref({});
const tempPreferences = ref({
	gender: null,
	language: null,
	timezone: null,
});

watchEffect(() => {
	const activeItems = tempTimeAvailable.value?.filter((item) => item.active);
	if (activeItems.length) {
		const isSelectedActive = activeItems.every((v) => v.start_time && v.end_time);
		if (isSelectedActive) isDisabled.value = false;
		else isDisabled.value = true;
	}
});
watchEffect(() => {
	if (Object.values(tempPreferences.value).every((i) => i)) {
		isDisabled.value = false;
	} else isDisabled.value = true;
});

const onClose = () => {
	isFetching.value = false;
	isDisabled.value = true;
	isOpenAvailability.value = false;
	isOpenPreference.value = false;
};

const mergeHandler = (arr1, arr2) => (
	arr1.map((item1) => item1 ? {
        ...item1, ...arr2.find((item2) => item2.day === item1.day),
    } : item1)
);

const onSubmitAvailability = async () => {
	isFetching.value = true;
	const payload = {
		time_availability: tempTimeAvailable.value.filter((i) => i.active),
	};

	await $http.$_specialistAvailability(payload).then(({ data }) => {
		const result = data.data?.time_availability;
		const availability = result.map((v) => ({ ...v, active: true }));
		timeAvailable.value = mergeHandler(tempTimeAvailable.value, availability);
		$toast.success("Time availability successfully updated!");
		onClose();
	});
};
const onSubmitPreference = async () => {
	isFetching.value = true;

	const payload = { preferences: tempPreferences.value };
	await $http.$_specialistPreference(payload).then(({ data }) => {
		preferences.value = data.data?.preferences;
		$toast.success("Preferences successfully updated!");
		onClose();
	});
};

async function getTimeAvailability() {
    isLoading.value = true;
	await $http.$_getSpecialistAvailability().then(({ data }) => {
		if (data.data) {
			preferences.value = data.data.preferences || { gender: 'All', language: 'English (African)', timezone: 'UTC + 1 (West African Time)' };
			const time_availability = data.data?.time_availability || [];
			const availability = time_availability.map((v) => ({ ...v, active: true }));
			timeAvailable.value = mergeHandler(tempTimeAvailable.value, availability);
		}
        isLoading.value = false;
	});
}
</script>

<style scoped lang="scss">
.specialist-info {
    width: 100%;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: $size-60;

	.specialist-info__header {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $size-16;

		.specialist-info__header--earnings {
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.specialist-info__header--earnings-text {
			font-size: $size-12;
			color: $color-g-44;
		}
		.specialist-info__header--details-text {
			font-size: $size-12;
			color: $color-sec-s2;
		}
		.specialist-info__header--amount {
			width: 100%;
			font-weight: $fw-bold;
			font-size: $size-36;
			color: $color-black;

			@include responsive(phone) {
				display: flex;
				justify-content: center;
			}
		}
	}
	.specialist-status {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;

		.specialist-status__text {
			color: $color-black;
			font-size: $size-16;
		}
	}
	.specialist-availability {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $size-32;
        padding-right: $size-12;

		.specialist-availability__header {
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;

			.specialist-availability__text {
				width: 100%;
				font-size: $size-14;
				color: $color-g-67;
			}
			.specialist-availability__buttonicon {
				background: transparent;
				color: red;
			}
		}
        .specialist-availability__button {
            background: transparent !important;
            color: $color-pri-main;
            &:hover { text-decoration: underline; }
        }
		.specialist-availability__body {
            width: 100%;
			display: flex;
            justify-content: flex-start;
			align-items: flex-start;
			gap: $size-8;

            @include responsive(phone) {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
				gap: $size-8;
            }

			.specialist-availability__items {
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				gap: $size-4;
                border-radius: $size-8;
                padding: $size-16;
                border: 1px solid $color-pri-t5;
                background: $color-white;
                box-shadow: 4px 4px 24px 0px rgba(0, 0, 0, 0.15), 8px 16px 16px 0px rgba(0, 0, 0, 0.10);

				.specialist-availability__body--days {
					font-size: $size-16;
					color: $color-sec-s2;
                    font-weight: $fw-semi-bold;

                    @include responsive(phone) {
                        font-size: $size-12;
                    }
				}
				.specialist-availability__body--time {
					font-size: $size-16;
					color: $color-g-21;

                    @include responsive(phone) {
                        font-size: $size-12;
                    }
				}
			}
		}
	}
	.specialist-preferences {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: $size-32;
        padding-right: $size-12;

		.specialist-preferences__header {
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;

			.specialist-preferences__text {
				width: 100%;
				font-size: $size-14;
				color: $color-g-67;
			}
			.specialist-preferences__buttonicon {
				background: transparent;
				color: red;
			}
		}
        .specialist-preferences__button {
            background: transparent !important;
            color: $color-pri-main;
            &:hover { text-decoration: underline; }
        }
		.specialist-preferences__body {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: $size-16;
            border-radius: $size-8;
            padding: $size-16;
            border: 1px solid $color-pri-t5;
            background: $color-white;
            box-shadow: 4px 4px 24px 0px rgba(0, 0, 0, 0.15), 8px 16px 16px 0px rgba(0, 0, 0, 0.10);

            @include responsive(phone) {
                width: 100%;
            }

			.specialist-preferences__items {
				display: flex;
				justify-content: flex-start;
				align-items: flex-start;
				gap: $size-8;

                @include responsive(phone) {
                    width: 100%;
                }

				.specialist-preferences__body--key {
					font-size: $size-16;
					color: $color-g-44;
					white-space: nowrap;

                    @include responsive(phone) {
                        font-size: $size-12;
                    }
				}
				.specialist-preferences__body--value {
					font-size: $size-16;
					color: $color-black;
					text-transform: capitalize;

                    @include responsive(phone) {
                        font-size: $size-12;
                    }
				}
			}
		}
		.specialist-preferences__button {
			width: 100%;
		}
	}
}

.isActiveDays {
	color: $color-black !important;
}
.availability-modal {
	display: flex;
	flex-direction: column;
	gap: $size-32;

	& .availability-modal__header {
		font-size: $size-16;
		color: $color-g-21;
		line-height: $size-24;
		letter-spacing: 2%;

		& .availability-modal__info--span {
			color: $color-sec-s2;
		}
	}
	& .availability-modal__body {
		display: flex;
		flex-direction: column;
		gap: $size-32;

		@include responsive(phone) {
			gap: $size-8;
		}

		& .availability-modal__body--items {
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;

			@include responsive(phone) {
				flex-direction: column;
				align-items: flex-start;
				justify-content: center;
				gap: $size-8;
				border-bottom: $size-1 solid $color-g-90;
				padding-bottom: $size-24;
			}

			& .availability-modal__body--checkbox {
				width: 30%;
				font-size: $size-24;
				line-height: 36px;
				color: $color-g-54;
				display: flex;
				align-items: center;
				gap: $size-16;
			}
			& .availability-modal__body--inputs {
				width: 70%;
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: $size-16;

				@include responsive(phone) {
					width: 100%;
					flex-direction: column;
				}

				& .availability-modal__body--input {
					width: 100%;
				}
			}
			& .availability-modal__body--seperator {
				@include responsive(phone) {
					display: none !important;
				}
			}
		}
	}
}
:deep(.availability-action-btn) {
	@include responsive(phone) {
		width: 100% !important;
	}
}

.preference-modal {
	display: flex;
	flex-direction: column;
	gap: $size-32;

	.preference-modal__header {
		font-size: $size-16;
		color: $color-g-21;
		line-height: $size-24;
		letter-spacing: 2%;

		.preference-modal__info--span {
			color: $color-sec-s2;
		}
	}
	.preference-modal__body {
		display: flex;
		flex-direction: column;
		gap: $size-32;

		.preference-modal__body--gender-header {
			width: 100%;
			display: flex;
			justify-content: flex-start;

			.preference-modal__body--gender-header-item {
				width: 100%;
				display: flex;
				justify-content: flex-start;
				align-items: center;
				gap: $size-32;
			}
		}

		.preference-modal__body--items {
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;

			.preference-modal__body--checkbox {
				width: 30%;
				font-size: $size-24;
				line-height: 36px;
				color: $color-g-54;
				display: flex;
				align-items: center;
				gap: $size-16;
			}
			.preference-modal__body--inputs {
				width: 70%;
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: $size-16;

				.preference-modal__body--input {
					width: 100%;
					display: flex;
					justify-content: space-between;
					align-items: center;
					gap: $size-16;

					.preference-modal__body--text {
						width: 60%;
					}
					.preference-modal__body--select {
						width: 40%;
					}
				}
			}
		}
		.preference-modal__body--gender {
			width: 100%;
			display: flex;
			flex-direction: column;
			align-items: flex-start;
			gap: $size-24;

			.preference-modal__body--gender-items {
				width: 100%;
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				gap: $size-32;
				border-top: 1px solid $color-g-67;
				padding-top: $size-32;

				&:first-child {
					border-top: 0 !important;
					padding-top: $size-0;
				}

				.preference-modal__body--gender_text {
					font-size: $size-16;
					color: $color-g-44;
					line-height: $size-24;
				}
			}
			.preference-modal__body--select {
				width: 100%;
				display: flex;
				flex-direction: column;
				gap: $size-24;
			}
		}
	}
}
:deep(.preference-action-btn) {
	@include responsive(phone) {
		width: 100% !important;
	}
}

.page-content {
	display: flex;
	flex-direction: column;
	gap: $size-12;
	width: 100%;
	height: 100%;

	&__body {
		display: flex;
		flex-direction: column;
		gap: $size-26;
		width: 100%;
		height: 100%;
		overflow-y: scroll;
		padding: $size-0 $size-48;

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
.rc-button-container {
	display: flex;
	justify-content: flex-end;
	height: $size-44;
}
.rc-button {
	background: $color-white;
	border: $size-1 solid $color-pri;
}
.default-tabs {
	margin-bottom: $size-20;
}
.content-container {
	display: flex;
	justify-content: space-between;
	align-items: start;
	gap: $size-44;
	height: 100%;
	overflow: hidden;

	@include responsive(phone) {
		@include flexItem(vertical) {
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
</style>
