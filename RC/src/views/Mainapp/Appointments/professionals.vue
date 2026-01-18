<template>
  <div class="professional-container">
    <div class="left-section-wrapper">
        <div class="section-list-item">
            <div class="list-category">
                <span class="list-category__category">Professional Category</span>
                <span class="list-category__specialist">{{ professionalCategory }}</span>
            </div>
            <rc-button
                class="list-category__action"
                label="Change"
                type="tertiary"
                @click="onClose(), isOpenProfessional = true"
            />
            <div v-if="isOpenProfessional" class="dropdown-professional">
                <template v-for="category in professionalCategoryOptions" :key="JSON.stringify(category)">
                    <div class="dropdown-professional-item" @click="onChangeEvent({ event: 0, payload: category })">
                        <span class="dropdown-professional-item__title">{{ category }}</span>
                        <v-icon name="bi-chevron-down" class="dropdown-professional-icon" />
                    </div>
                </template>
            </div>
        </div>
        <div class="section-list-item">
            <div class="list-category">
                <span class="list-category__category">Specialist Category</span>
                <span class="list-category__specialist">{{ specialistCategory }}</span>
            </div>
            <rc-button
                class="list-category__action"
                label="Change"
                type="tertiary"
                @click="onClose(), isOpenSpecialist= true"
            />
            <div v-if="isOpenSpecialist" class="dropdown-specialist">
                <template v-for="specialist in specialistCategoryOptions" :key="JSON.stringify(specialist)">
                    <div class="dropdown-specialist-item" @click="onChangeEvent({ event: 1, payload: specialist })">
                        <span class="dropdown-specialist-item__title">{{ specialist }}</span>
                    </div>
                </template>
            </div>
        </div>
        <div class="section-list-item">
            <div class="list-category">
                <span class="list-category__category">Time-zone</span>
                <span class="list-category__specialist">{{ timezoneSelector }}</span>
            </div>
            <rc-button
                class="list-category__action"
                label="Change"
                type="tertiary"
                @click="onClose(), isOpenTimezone = true"
            />

            <div v-if="isOpenTimezone" class="select-timezone">
                <rc-select
                    slotted
                    is-open
                    label="name"
                    :has-placeholder="false"
                    :options="timezones"
                    class="v-select-component"
                    @selected="onChangeEvent({ event: 2, payload: $event})"
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
            </div>
        </div>
        <div class="section-list-item">
            <div class="list-category">
                <span class="list-category__category">Meeting Channel</span>
                <span class="list-category__specialist">{{ meetingChannelSelector }}</span>
            </div>
            <rc-button
                class="list-category__action"
                label="Change"
                type="tertiary"
                @click="onClose(), isOpenMeetingChannel = true"
            />
            <div v-if="isOpenMeetingChannel" class="dropdown-meeting-channel">
                <template v-for="channel in meetingChannelOptions" :key="JSON.stringify(channel)">
                    <div class="dropdown-meeting-channel-item" @click="onChangeEvent({ event: 5, payload: channel })">
                        <div class="channel-info">
                            <v-icon :name="channel.icon" class="channel-icon" />
                            <div class="channel-details">
                                <span class="channel-title">{{ channel.label }}</span>
                                <span class="channel-subtitle">{{ channel.description }}</span>
                            </div>
                        </div>
                    </div>
                </template>
            </div>
        </div>
        <div class="section-list-item">
            <div class="list-category">
                <span class="list-category__category">Selected Date</span>
                <span class="list-category__specialist">{{ format(new Date(selectedDate), 'MMMM dd, yyyy') }}</span>
            </div>
            <rc-button 
                class="list-category__action"
                label="Change"
                type="tertiary"
                @click="onClose(), isOpenSelectDate = true"
            />
            <div v-if="isOpenSelectDate" class="calendar-wrapper">
                <div class="calendar-date">
                    <rc-calendar
                        transparent
                        borderless
                        expanded
                        v-model="dateSelector"
                    />
                    <rc-button
                        label="Next"
                        type="secondary"
                        @click="onChangeEvent({ event: 3, payload: dateSelector })"
                    />
                </div>
            </div>
        </div>
        <div class="section-list-item">
            <div class="list-category">
                <span class="list-category__category">Selected Time</span>
                <span class="list-category__specialist">
                        {{ selectedTime }} ({{ format(parse(selectedTime, 'HH:mm', new Date()), 'hh:mm a') }})
                    </span>
            </div>
            <rc-button
                class="list-category__action"
                label="Change"
                type="tertiary"
                 @click="onClose(), isOpenTimeslot = true"
            />

            <div v-if="isOpenTimeslot" class="timeslot-wrapper">
                <div class="timeslots-container">
                    <loader v-if="isFetchingTimeslot" :useOverlay="false" class="timeslot-loader" />
                    <template v-else v-for="(values, key) in availableDatesOptions" :key="JSON.stringify({ values, key })">
                        <template v-if="Object.values(values).length">
                            <span class="timeslots-timepicker__title">{{ format(new Date(key), 'MMM dd, yyyy') }}</span>
                            <div class="timeslots-timepicker__slots">
                                <span v-for="value in values" :key="JSON.stringify({ value, key })"
                                    class="timeslots-timepicker__slot"
                                    :class="{'timeslots-timepicker__active': timeSelector === value && availabilityDates.date === key}"
                                    @click="onChangeEvent({ event: 4, payload: { key, value }})"
                                >
                                    {{ value }}
                                </span>
                            </div>
                        </template>
                    </template>
                </div>
            </div>
        </div>
    </div>
    <div class="right-section-wrapper">
        <div class="section-filter-wrapper">
            <span class="filter-section-title">Filters:</span>
            <div class="filter-selction-actions">
                <rc-select
                    label="label"
                    class="action-rating"
                    :has-placeholder="false"
                    placeholder="Rating"
                    :class="{'selected-active': selectedRating}"
                    v-model="selectedRating"
                    :reduce="item => item.id"
                    :options="[
                        { label: '1 star and above', id: '1 star and above' },
                        { label: '2 stars and above', id: '2 stars and above' },
                        { label: '3 stars and above', id: '3 stars and above' },
                        { label: '4 stars and above', id: '4 stars and above' },
                        { label: '5 stars', id: '5 stars' },
                    ]"
                />
                <rc-select
                    label="label"
                    class="action-rating"
                    :has-placeholder="false"
                    placeholder="Gender"
                    :class="{'selected-active': selectedGender}"
                    v-model="selectedGender"
                    :reduce="item => item.id"
                    :options="[
                        { label: 'All', id: 'all' },
                        { label: 'Male', id: 'male' },
                        { label: 'Female', id: 'female' },
                    ]"
                />
                <rc-select
                    label="label"
                    class="action-rating"
                    :has-placeholder="false"
                    placeholder="Price"
                    :class="{'selected-active': selectedPricing}"
                    v-model="selectedPricing"
                    :reduce="item => item.id"
                    :options="[
                        { label: '150 - 500/hour', id: '150-500' },
                        { label: '501 - 1500/hour', id: '501-1500' },
                        { label: 'Above 1500/hour', id: 'above-1500' },
                    ]"
                />
            </div>
        </div>
        <loader v-if="isFetching" :useOverlay="false" class="loader" />
        <template v-else>
            <div v-if="!specialistOptions.length" class="force-appointment__wrapper">
                <rc-icon icon-name="caution-outline" size="l" class="force-appointment__icon" />
                <p class="force-appointment__desc">No available specialist for the selected filters. Please change your filters.</p>
            </div>
            <rc-accordion v-else :items="specialistOptions" class="accordion-wrapper">
                <template v-slot:header="{ item }">
                    <div class="accordion-header">
                        <rc-avatar
                            size="sm"
                            v-model="item.profile.photo"
                            :first-name="item.profile.first_name"
                            :last-name="item.profile.last_name"
                            class="accordion-header__avatar"
                        />
                        <div class="accordion-header__title">
                            <div class="accordion-header__title--left">
                                <span class="accordion-header__title--name">{{ item.full_name }}</span>
                                <span class="accordion-header__title--experience">
                                    {{ item.professional_practice.years_of_practice }}yrs experience </span>
                            </div>
                            <div class="accordion-header__title--right">
                                <span class="accordion-header__title--ratings">{{ item.average_rating }}</span>
                                <v-icon name="bi-star-fill" class="accordion-rating-icon" fill="#DCB93A" />
                            </div>
                        </div>
                    </div>
                </template>
                <template v-slot:content="{ item }">
                    <div class="accordion-content">
                        <div class="accordion-content__content">
                            <span class="accordion-content__header">Bio:</span>
                            <p class="accordion-content__body">
                                {{ item.bio }}
                                Lorem ipsum dolor sit amet consectetur. Urna nibh risus luctus aenean. Placerat condimentum 
                                cras commodo semper bibendum commodo augue faucibus odio. Justo sed justo pellentesque 
                                et morbi odio urna. Feugiat.
                            </p>
                        </div>
                        <div class="accordion-content__footer">
                            <span class="accordion-content__footer--pricing">
                                ₦200 - ₦500/hour
                            </span>
                            <rc-button
                                type="tertiary"
                                label="Book"
                                size="small"
                                class="accordion-content__footer--action"
                                @click="onSubmit(item)"
                            />
                        </div>
                    </div>
                </template>
            </rc-accordion>
         </template>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, watch, computed, onMounted } from "vue";
import { DatePicker } from "v-calendar";
import { parse, format } from 'date-fns';
import RcIcon from "@/components/RCIcon";
import RcSelect from "@/components/RCSelect";
import RcCalendar from "@/components/RCCalendar";
import RcAccordion from "@/components/RCAccordion";
import RcAvatar from "@/components/RCAvatar";
import RcTimeslotPicker from "@/components/RCTimeSlotPicker";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader";
import timezones from "./helpers/timezones";

const $http= inject('$_HTTP');
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { bookingInfo, useBookingInfo } = inject('$_BOOKING_INFO');
useBookingInfo({ heading: 'Select Medical Professional', hasFooter: false, proceed: false });
const state = {...bookingInfo.value.payload};

const isFetching = ref(true);
const isOpenProfessional = ref(false);
const isOpenSpecialist = ref(false);
const isOpenTimezone = ref(false);
const isOpenMeetingChannel = ref(false);
const isOpenSelectDate = ref(false);
const isOpenTimeslot = ref(false);
const isFetchingTimeslot = ref(false);

const selectedRating = ref(null);
const selectedGender = ref(null);
const selectedPricing = ref(null);
const specialistOptions = ref([]);
const availableTimeSlots = ref();
const preferredDates = ref([]);
const schedule = ref({});
const selectedSpecialist = ref({});
const selectedDate = ref(state.schedule.date);
const selectedTime = ref(state.schedule.time);
const availabilityDates = ref([state.availabilityDates]);
const professionalCategory = ref(state.professional_category);
const specialistCategory = ref(state.specialist_category);
const timezoneSelector = ref(state.time_zone);
const meetingChannelSelector = ref(state.meeting_channel || 'Zoom Video Call');
const meetingChannelValue = ref(state.meeting_channel_value || 'zoom');
const dateSelector = ref(state.preffered_dates);
const timeSelector = ref(state.selected_time);
const availableDatesOptions = ref(state.timeslots);

const computedPayload = computed(() => ({
    ...bookingInfo.value.payload,
    professional_category: professionalCategory.value,
    specialist_category: specialistCategory.value,
    gender: selectedGender.value,
    rating: selectedRating.value,
    pricing: selectedPricing.value,
    time_zone: timezoneSelector.value,
    meeting_channel: meetingChannelSelector.value,
    meeting_channel_value: meetingChannelValue.value,
    availabilityDates: availabilityDates.value,
    schedule: schedule.value,
    selectedTime: selectedTime.value,
    selectedDate: selectedDate.value
}));

watch(computedPayload, (newValue) => {
    if (!computedPayload.specialist) {
        getAvailableSpecialists(newValue);
    }
});

onMounted(async () => {
    const payload = {
        professional_category: "Medical Doctor",
        specialist_category: "General Practitioner",
        time_zone: "Acre Time (UTC -5)",
        availabilityDates: [{
            date: "2023-05-29",
            time: "11:00"
        }]
    }

    await getAvailableSpecialists(payload);
});

const professionalCategoryOptions = ref([
    'Medical Doctor (M.D.)',
    'Clinical P & Therapist',
    'Dietitian/Nutritionist',
    'Care Giver',
    'Lab Technician',
    'Pharmacist'
]);
const specialistCategoryOptions = ref([
    'Medical Doctor (General Practitioner)',
    'Cardiologist',
    'Pediatrician',
    'Neurologist',
    'Dermatologist',
    'Oncologist'
]);
const meetingChannelOptions = ref([
    { label: 'Zoom Video Call', value: 'zoom', icon: 'bi-camera-video', description: 'Professional video consultation with clinical notes' },
    { label: 'WhatsApp Call', value: 'whatsapp', icon: 'co-whatsapp', description: 'Familiar and accessible for most patients' },
    { label: 'Google Meet', value: 'google_meet', icon: 'co-google', description: 'Simple video call via Google' },
    { label: 'Microsoft Teams', value: 'microsoft_teams', icon: 'co-microsoft', description: 'Enterprise video conferencing' },
    { label: 'Phone Call', value: 'phone', icon: 'bi-telephone', description: 'Traditional phone consultation' },
]);

async function getAvailableSpecialists(payload) {
    isFetching.value = true;
    await $http.$_getAvailableSpecialists(payload).then(({ data }) => {
        specialistOptions.value = Object.values(data.data)?.flat();
        isFetching.value = false;
    });
}

const onClose = () => {
    isOpenProfessional.value = false;
    isOpenSpecialist.value = false;
    isOpenTimezone.value = false;
    isOpenMeetingChannel.value = false;
    isOpenSelectDate.value = false;
    isOpenTimeslot.value = false;
}

const onChangeEvent = async ({ event, payload }) => {
    if (event === 0) {
        professionalCategory.value = payload;
        onClose();
        isOpenSpecialist.value = true;
    } else if (event === 1) {
        specialistCategory.value = payload;
        onClose();
    } else if (event === 2) {
        timezoneSelector.value = payload.name;
        onClose();
    } else if (event === 5) {
        meetingChannelSelector.value = payload.label;
        meetingChannelValue.value = payload.value;
        onClose();
    } else if (event === 3) {
        onClose();
        isOpenTimeslot.value = true;
        isFetchingTimeslot.value = true;

        if (Array.isArray(dateSelector.value)) {
            preferredDates.value = dateSelector.value.map((date) => ({ date: format(new Date(date), 'yyyy-MM-dd') }));
        } else preferredDates.value = [{ date: format(new Date(dateSelector.value), 'yyyy-MM-dd') }];

        const payload = {preferredDates: preferredDates.value};
        await $http.$_getAvailableTimes(payload).then((response) => {
            availableDatesOptions.value = response.data.data;
            isFetchingTimeslot.value = false;
        });
    } else if (event === 4) {
        schedule.value = { date: payload.key, time: payload.value };
        timeSelector.value = payload.value;
        selectedDate.value = payload.key;
        selectedTime.value = payload.value;
        onClose();
    }
}

const onSubmit = (specialist) => {
    useBookingInfo({
        payload: { ...computedPayload.value, ...specialist },
        current: 5
    });
}

const navigate = () => {
    const { current, from, to } = navigator.value;
    useNavigator({ current, from, to: 1 });
}

</script>

<style scoped lang="scss">
.professional-container {
    width: 63rem;
    min-height: 39.2rem;
    display: flex;
    justify-content: space-between;
    gap: $size-44;
    padding: $size-24;
    position: relative;

    @include responsive(tab-portrait) {
        width: 100%;
    }

    @include responsive(phone) {
        width: 100%;
        min-height: 100%;
        padding: $size-24;
        justify-content: center;
        flex-direction: column;
    }
}

.left-section-wrapper {
    width: 40%;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: $size-24;
    position: relative;
    overflow: scroll;

    @include scrollBar(none);
    @include responsive(phone) {
        width: 100%;
        height: 100%;
    }

    .section-list-item {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;

        .list-category {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            gap: $size-8;

            .list-category__category {
                font-size: $size-11;
                color: $color-g-67;
                font-weight: $fw-regular;
            }
            .list-category__specialist {
                font-size: $size-16;
                color: $color-black;
                line-height: 24px;
                font-weight: $fw-regular;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                gap: $size-0;
            }
        }
        .list-category__action {
            background: transparent;
            font-size: $size-16;
            color: $color-pri-main;
            font-weight: $fw-regular;
            border: 0;
            padding: 0;

            &:hover {
                text-decoration: underline;
            }
        }

        .dropdown-professional {
            position: absolute;
            top: 50px;
            width: 100%;
            background: $color-white;
            padding: $size-8;
            border: 1px solid $color-pri-t4;
            border-radius: $size-8;

            .dropdown-professional-item {
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: $size-8;
                border-radius: $size-8;

                &:hover {
                    background: $color-g-95;
                    cursor: pointer;
                }

                .dropdown-professional-item__title {
                    font-weight: $fw-regular;
                    font-size: $size-14;
                    line-height: 18px;
                    color: $color-black;
                }
                .dropdown-professional-icon {
                    transform: rotate(-90deg);
                }
            }
        }
        .dropdown-specialist {
            position: absolute;
            top: 110px;
            width: 100%;
            background: $color-white;
            padding: $size-8;
            border: 1px solid $color-pri-t4;
            border-radius: $size-8;

            .dropdown-specialist-item {
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: $size-8;
                border-radius: $size-8;

                &:hover {
                    background: $color-g-95;
                    cursor: pointer;
                }

                .dropdown-specialist-item__title {
                    font-weight: $fw-regular;
                    font-size: $size-14;
                    line-height: 18px;
                    color: $color-black;
                }
            }
        }
        .select-timezone {
            position: absolute;
            top: 180px;
            width: 100%;
            height: 100%;
            background: $color-white;
            padding: $size-16;
            border: 1px solid $color-pri-t4;
            border-radius: $size-8;
            // box-shadow: 4px 4px 36px rgba(0, 0, 0, 0.25);

            & :deep(.selection-dropdown) {
                width: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-start;
                gap: $size-0;
                padding: $size-0 $size-8;

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
        .dropdown-meeting-channel {
            position: absolute;
            top: 230px;
            width: 100%;
            background: $color-white;
            padding: $size-8;
            border: 1px solid $color-pri-t4;
            border-radius: $size-8;
            box-shadow: 2px 6px 16px rgba(0, 0, 0, 0.15);
            z-index: 10;

            .dropdown-meeting-channel-item {
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: $size-12;
                border-radius: $size-8;
                cursor: pointer;

                &:hover {
                    background: $color-g-95;
                }

                .channel-info {
                    display: flex;
                    align-items: center;
                    gap: $size-12;
                    width: 100%;

                    .channel-icon {
                        font-size: $size-24;
                        color: $color-pri-main;
                    }

                    .channel-details {
                        display: flex;
                        flex-direction: column;
                        gap: $size-4;

                        .channel-title {
                            font-weight: $fw-medium;
                            font-size: $size-14;
                            line-height: 18px;
                            color: $color-black;
                        }

                        .channel-subtitle {
                            font-weight: $fw-regular;
                            font-size: $size-12;
                            line-height: 16px;
                            color: $color-g-44;
                        }
                    }
                }
            }
        }
        .calendar-wrapper {
            position: absolute;
            top: 310px;
            width: 100%;
            background: $color-white;
            display: flex;
            justify-content: center;

            .calendar-date {
                margin: 10px;
                padding: $size-16;
                border-radius: $size-8;
                box-shadow: 2px 6px 16px rgba(0, 0, 0, 0.25);
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                gap: $size-0;
            }
        }
        .timeslot-wrapper {
            position: absolute;
            top: 380px;
            width: 100%;
            background: $color-white;
            display: flex;
            justify-content: center;

            .timeslots-container {
                margin: $size-8;
                padding: $size-16;
                border-radius: $size-8;
                box-shadow: 2px 6px 16px rgba(0, 0, 0, 0.25);
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: center;
                gap: $size-8;
                position: relative;
                width: 100%;
                min-height: 150px;

                .timeslot-loader {
                    position: relative;
                    width: 100%;
                }

                .timeslots-timepicker__title {
                    font-weight: $fw-regular;
                    font-size: $size-12;
                    line-height: 18px;
                    color: $color-g-44;
                    width: 100%;
                }
                .timeslots-timepicker__slots {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
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

.right-section-wrapper {
    position: relative;
    width: 60%;
    background: $color-whiteAlpha;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: $size-32;
    margin: -$size-24;
    border-radius: $size-24;
    padding: $size-24;
    overflow: hidden;

    @include scrollBar(none);
    @include responsive(phone) {
        width: 100%;
        height: 100%;
        margin: -$size-0;
        padding: $size-0;
        border-radius: $size-0;
    }

    .section-filter-wrapper {
        width: 100%;
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: $size-16;

        .filter-section-title {
            font-weight: $fw-regular;
            font-size: $size-16;
            color: $color-black;
            line-height: 24px;
        }
        .filter-selction-actions {
            width: 100% !important;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            align-items: center;
            gap: $size-16;

            .action-rating {
                width: 100%;
            }

            :deep(.select-container) {
                height: 30px;
                width: 100%;
                border: 1px solid $color-sec-s2;
                color: $color-sec-s2;
                padding: 0;

                .vs__selected {
                    color: $color-sec-s2 !important;
                    margin-top: 4px !important;
                }
                .vs__search::placeholder {
                    color: $color-sec-s2 !important;
                }
                .vs__actions svg path {
                    fill: $color-sec-s2 !important;
                }
            }
            :deep(.selected-active) {
                background: $color-sec-s2 !important;
                border-radius: $size-8;
                
                .vs__selected {
                    color: $color-white !important;
                    margin-top: 4px !important;
                }
                .vs__actions svg path {
                    fill: $color-white !important;
                }
            }
        }
    }
    .accordion-wrapper {
        width: 100%;
        height: 32rem;
        overflow: scroll;

        @include scrollBar(normal);

        .accordion-header {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: $size-8;

            .accordion-header__title {
                display: flex;
                justify-content: flex-start;
                align-items: flex-start;
                gap: $size-16;

                .accordion-header__title--left {
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-start;
                    align-items: flex-start;
                    gap: $size-0;

                    .accordion-header__title--name {
                        font-weight: $fw-semi-bold;
                        font-size: $size-16;
                        line-height: 22px;
                        color: $color-black;
                    }
                    .accordion-header__title--experience {
                        font-weight: $fw-regular;
                        font-size: $size-12;
                        line-height: 18px;
                        color: $color-g-44;
                    }
                }
                .accordion-header__title--right {
                    display: flex;
                    justify-content: flex-start;
                    align-items: flex-start;
                    gap: $size-3;

                    .accordion-header__title--ratings {
                        font-size: $size-16;
                        font-weight: $fw-regular;
                        line-height: 24px;
                        color: $color-g-44;
                    }
                }
            }
        }
        .accordion-content {
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            gap: $size-32;

            .accordion-content__content {
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                align-items: flex-start;
                gap: $size-6;

                .accordion-content__header {
                    font-weight: $fw-medium;
                    font-size: $size-14;
                    line-height: 21px;
                    color: $color-g-44;
                }
                .accordion-content__body {
                    font-weight: $fw-regular;
                    font-size: $size-12;
                    line-height: 18px;
                    color: $color-g-21;
                }
            }
            .accordion-content__footer {
                width: 100%;
                display: flex;
                justify-content: space-between;
                align-items: center;

                .accordion-content__footer--pricing {
                    font-weight: $fw-regular;
                    font-size: $size-16;
                    line-height: 24px;
                    color: $color-g-44;
                }
            }
        }
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
}
</style>