<template>
  <div class="booking-container">
    <div class="section-wrapper">
        <div class="left-section">
            <rc-calendar transparent borderless expanded v-model="dateSelector" />
            <div v-if="dateSelector" class="left-section-tip">
                <p class="left-section-tip__title">Quick Tip:</p>
                <p class="left-section-tip__description">
                    To select multiple dates hold ‘Shift’ on your keyboard and click another date on the calendar.
                </p>
            </div>
        </div>
        <div class="right-section">
            <rc-select
                slotted
                label="name"
                placeholder="Time-zone"
                :options="timezones"
                class="select-timezone"
                v-model="currentTimezone"
                :reduce="item => item.name"
                @selected="timezoneSelector = $event"
            >
                <template v-slot:options="{ option }">
                    <div class="selection-dropdown">
                        <span class="selection-dropdown__timezone">{{ option.name }}</span>
                        <div class="selection-dropdown__locations">
                            <span v-for="(item, i) in option.locations" :key="item">
                                {{ (option.locations.length -1) === i ? item : `${item}, ` }}
                            </span>
                        </div>
                    </div>
                </template>
            </rc-select>
            <div class="timeslots-wrapper">
                <p class="timeslots-heading">Available time slots</p>
                <div class="timeslots-content">
                    <div v-if="!dateSelector" class="empty-slots-wrapper">
                        <p class="empty-slots-description">Select a date or date range to see available time slots</p>
                    </div>
                    <template v-else>
                        <loader v-if="isFetching" :useOverlay="false" class="timeslots-loader" />
                        <template v-else>
                            <div
                                v-if="!Object.values(availableTimeSlots).some(i => i.length)"
                                class="force-appointment__wrapper"
                            >
                                <rc-icon
                                    icon-name="caution-outline"
                                    size="lg"
                                    class="force-appointment__icon"
                                />
                                <p class="force-appointment__desc">
                                    No available time slots for the selected date. 
                                    Please pick another date or date range.
                                </p>
                                <rc-button
                                    label="Force appointment"
                                    type="tertiary"
                                    class="force-appointment__btn"
                                    @click="isOpenForceAppointment = true"
                                />
                            </div>
                            <div v-else class="timeslots-timepicker">
                                <template v-for="(values, key) in availableTimeSlots" :key="JSON.stringify({ values, key })">
                                    <template v-if="Object.values(values).length">
                                        <span class="timeslots-timepicker__title">{{ format(new Date(key), 'MMM dd, yyyy') }}</span>
                                        <div class="timeslots-timepicker__slots">
                                            <span v-for="value in values" :key="JSON.stringify({ value, key })"
                                                class="timeslots-timepicker__slot"
                                                :class="{'timeslots-timepicker__active': timeSelector === value && availabilityDates.date === key}"
                                                @click="onSelectTimeSlots({ key, value })"
                                            >
                                                {{ value }}
                                            </span>
                                        </div>
                                    </template>
                                </template>
                            </div>
                        </template>
                    </template>
                </div>
            </div>
        </div>
    </div>
  </div>
  <dialog-modal
        v-if="isOpenForceAppointment"
        @closeModal="isOpenForceAppointment = false"
        :has-footer="true"
        title="Force Appointment"
    >
        <template v-slot:body>
            <div class="force-appointment-container">
               <p class="force-appointment-content">
                   We will notify you, within the next 3 hours, if we are able to 
                   get you an appointment with a suitable medical professional.
                </p>
                <p class="force-appointment-content">
                    Please note that this action attracts an additional fee.
                </p>
            </div>
        </template>
        <template v-slot:foot>
            <div class="force-appointment-actions">
                <rc-button
                    label="Cancel"
                    type="tertiary"
                    size="small"
                    @click="isOpenForceAppointment = false"
                />
                <rc-button
                    label="Proceed"
                    type="primary"
                    size="small"
                    @click="onSubmitForceAppointment"
                />
            </div>
        </template>
    </dialog-modal>
</template>

<script setup>
import { ref, inject, watchEffect } from "vue";
import { format } from "date-fns";
import { DatePicker } from "v-calendar";
import RcIcon from "@/components/RCIcon";
import RcSelect from "@/components/RCSelect";
import RcCalendar from "@/components/RCCalendar";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader";
import DialogModal from "@/components/modals/dialog-modal";

import timezones from "./helpers/timezones";

const emit = defineEmits(['selected','next']);

const $http = inject('$_HTTP');
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { bookingInfo, useBookingInfo } = inject('$_BOOKING_INFO');

useBookingInfo({ heading: 'Select Date and Time', hasFooter: true, proceed: false });
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const currentTimezone = ref(timezones.find(item => item.timezone === timeZone));

const isFetching = ref(true);
const isOpenForceAppointment = ref(false);

const timeSelector = ref('');
const dateSelector = ref();
const timezoneSelector = ref();
const availableTimeSlots = ref([]);
const preferredDates = ref([]);
const availabilityDates = ref([]);

watchEffect(() => {
    useBookingInfo({ payload: {
        ...bookingInfo.value.payload,
        availabilityDates: availabilityDates.value,
        time_zone: currentTimezone.value.name,
        preffered_dates: preferredDates.value.map(i => i.date),
        timeslots: availableTimeSlots.value,
        schedule: availabilityDates.value,
    }});

    useBookingInfo({ proceed: !!timeSelector.value });
});

watchEffect(async () => {
    isFetching.value = true;
    
    if (dateSelector.value && currentTimezone.value) {
        if (Array.isArray(dateSelector.value)) {
            preferredDates.value = dateSelector.value.map((date) => ({ date: format(new Date(date), 'yyyy-MM-dd') }));
        } else preferredDates.value = [{ date: format(new Date(dateSelector.value), 'yyyy-MM-dd') }];

        const payload = { preferredDates: preferredDates.value };
        await $http.$_getAvailableTimes(payload).then((response) => {
            availableTimeSlots.value = response.data.data
            isFetching.value = false;
        });
    }
});

const onSelectTimeSlots = ({ key, value }) => {
    availabilityDates.value = { date: key, time: value };
    timeSelector.value = value;
}

const onSubmitForceAppointment = () => {

}

const navigate = () => {
    const { current, from, to } = navigator.value;
    useNavigator({ current, from, to: 1 });
}

</script>

<style scoped lang="scss">
.booking-container {
    width: 63rem;
    min-height: 34rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: $size-44;
    padding: $size-16;
    position: relative;

    @include responsive(tab-portrait) {
        width: 100%;
    }

    @include responsive(phone) {
        width: 100%;
        height: 100%;
        padding: $size-24;
        justify-content: center;
    }
}
.section-wrapper {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: $size-32;

    @include responsive(phone) {
        width: 100%;
        height: 100%;
        padding: $size-0;
        justify-content: center;
        flex-direction: column;
    }

    .left-section {
        width: 50%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        gap: $size-0;

        @include responsive(phone) {
            width: 100%;
            height: 100%;
        }

        .left-section-tip {
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            gap: $size-0;
            background: $color-g-95;
            padding: $size-12 $size-16;
            border-radius: $size-12;

            .left-section-tip__title {
                font-size: $size-12;
                font-weight: $fw-medium;
                color: $color-g-21;
                line-height: 18px;
            }
            .left-section-tip__description {
                font-size: $size-12;
                font-weight: $fw-regular;
                line-height: 18px;
                color: $color-g-44;
            }
        }
    }
    .right-section {
        width: 50%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
        gap: $size-32;

        @include responsive(phone) {
            width: 100%;
            height: 100%;
        }

        .select-timezone {
            width: 100%;
            position: relative;
        }
        .timeslots-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            gap: $size-32;

            .timeslots-heading {
                font-weight: $fw-regular;
                font-size: $size-14;
                line-height: 21px;
                color: $color-g-21;
            }
            .timeslots-content {
                width: 100%;
                height: 320px;
                position: relative;
                display: flex;
                overflow: scroll;

                @include scrollBar(normal);

                .empty-slots-wrapper {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    position: relative;

                    .empty-slots-description {
                        width: 50%;
                        text-align: center;
                        font-weight: $fw-regular;
                        font-size: $size-14;
                        color: $color-g-44;
                        line-height: 21px;
                    }
                }
                .timeslots-loader {
                    position: relative;
                    top: 200px;
                }
                .force-appointment__wrapper {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    position: relative;
                    gap: $size-16;

                    .force-appointment__desc {
                        width: 50%;
                        text-align: center;
                        font-weight: $fw-regular;
                        font-size: $size-14;
                        color: $color-g-44;
                        line-height: 21px;
                    }
                    .force-appointment__btn {
                        margin-top: 20px;
                    }
                }
                .timeslots-timepicker {
                    overflow-x: scroll;
                    padding-bottom: $size-16;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    gap: $size-16;

                    @include scrollBar(normal);

                    .timeslots-timepicker__title{
                        font-weight: $fw-regular;
                        font-size: $size-12;
                        line-height: 18px;
                        color: $color-g-44;
                    }
                    .timeslots-timepicker__slots {
                        display: grid;
                        grid-template-columns: repeat(6, 1fr);
                        gap: $size-10;
                        width: 100%;

                        @include responsive(tab-portrait) {
                            grid-template-columns: repeat(4, 1fr);
                        }

                        .timeslots-timepicker__slot {
                            border: $size-1 solid $color-sec-s2;
                            color: $color-sec-s2;
                            border-radius: $size-8;
                            padding: $size-7 $size-14;
                            font-weight: $fw-semi-bold;
                            font-size: $size-14;
                            cursor: pointer;

                            &:hover {
                                color: $color-white !important;
                                background: $color-sec-s2 !important;
                                opacity: 0.7
                            }
                            &:focus {
                                color: $color-white !important;
                                background: $color-sec-s2 !important;
                            }
                        }
                        .timeslots-timepicker__active {
                            color: $color-white !important;
                            background: $color-sec-s2;
                        }
                    }
                }
            }
        }
    }
    & :deep(.selection-dropdown) {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: $size-0;
        padding: $size-0 $size-8;
        overflow: hidden;

        .selection-dropdown__timezone {
            font-weight: $fw-regular;
            font-size: $size-16;
            line-height: 24px;
            color: $color-black;
        }
        .selection-dropdown__locations {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: $size-2;
            
            & span {
                font-weight: $fw-regular;
                font-size: $size-14;
                line-height: 21px;
                color: $color-g-44;
            }
        }
    }
}

.force-appointment-container {
    width: 542px;
    padding: $size-24;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    gap: $size-24;

    @include responsive(phone) {
        width: 100% !important;
    }

    .force-appointment-content {
        font-weight: $fw-regular;
        font-size: $size-16;
        color: $color-g-21;
    }
}
.force-appointment-actions {
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
</style>