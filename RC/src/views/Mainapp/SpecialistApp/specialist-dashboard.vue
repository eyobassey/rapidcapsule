<template>
  <div class="page-content">
    <TopBar showButtons type="avatar" @open-side-nav="$emit('openSideNav')" />
    <loader v-if="isLoading" :useOverlay="false" style="position: absolute" />
    <div v-else class="page-content__body">
      <div class="container-root">
        <div class="dashboard-container">
          <div class="dashboard-earnings">
            <p class="dashboard-earnings__heading">Total Earnings</p>
            <div class="dashboard-earnings__content">
              <p class="dashboard-earnings__earnings">
                ₦ {{ totalEarnings.totalEarnings }}
              </p>
              <div class="dashboard-earnings__footer">
                <p class="dashboard-earnings__footer--earnings">
                  ₦ {{ totalEarnings.earningsThisWeek }} this week
                </p>
                <div class="dashboard-earnings__analytics">
                  <span
                    v-if="totalEarningsAnalytics.changeType === 'increasing'"
                  >
                    <rc-icon
                      icon-name="icon-arrow-up"
                      size="xs"
                      class="increasing"
                    />
                  </span>
                  <span
                    v-if="totalEarningsAnalytics.changeType === 'decreasing'"
                  >
                    <rc-icon
                      icon-name="icon-arrow-down"
                      size="xs"
                      class="decreasing"
                    />
                  </span>
                  <span
                    v-if="totalEarningsAnalytics.changeType === 'unchanged'"
                  >
                    <rc-icon
                      icon-name="minus-solid"
                      size="xs"
                      class="unchanged"
                    />
                  </span>
                  <p
                    class="dashboard-earnings__analytics--analytics"
                    :class="totalEarningsAnalytics.changeType"
                  >
                    {{ totalEarningsAnalytics.percentage }}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="dashboard-appointments">
            <div class="completed-appointments">
              <div class="completed-appointments__heading">
                <p class="completed-appointments__heading--header">
                  Completed<br />
                  Appointments
                </p>
                <div class="completed-appointments__heading--icon">
                  <v-icon
                    name="hi-trending-up"
                    style="stroke: #ee4511; height: 18px"
                  />
                </div>
              </div>
              <div class="completed-appointments__content">
                <div class="completed-appointments__counter">
                  <p class="completed-appointments__counter--count">
                    {{ appointmentsData.completedAppointments }}
                  </p>
                  <p class="completed-appointments__counter--month">
                    this <br />month
                  </p>
                </div>
                <div class="completed-appointments__footer">
                  <p class="completed-appointments__footer--month">
                    {{ appointmentsData.completedAppointmentsLastMonth }} last
                    month
                  </p>
                  <div class="completed-appointments__analytics">
                    <span
                      v-if="
                        completedAppointmentsAnalytics.changeType ===
                        'increasing'
                      "
                    >
                      <rc-icon
                        icon-name="icon-arrow-up"
                        size="xs"
                        class="increasing"
                      />
                    </span>
                    <span
                      v-if="
                        completedAppointmentsAnalytics.changeType ===
                        'decreasing'
                      "
                    >
                      <rc-icon
                        icon-name="icon-arrow-down"
                        size="xs"
                        class="decreasing"
                      />
                    </span>
                    <span
                      v-if="
                        completedAppointmentsAnalytics.changeType ===
                        'unchanged'
                      "
                    >
                      <rc-icon
                        icon-name="minus-solid"
                        size="xs"
                        class="unchanged"
                      />
                    </span>
                    <p
                      class="completed-appointments__analytics--analytics"
                      :class="completedAppointmentsAnalytics.changeType"
                    >
                      {{ completedAppointmentsAnalytics.percentage }}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="rescheduled-appointments">
              <div class="rescheduled-appointments__heading">
                <p class="rescheduled-appointments__heading--header">
                  Rescheduled<br />
                  Appointments
                </p>
                <div class="rescheduled-appointments__heading--icon">
                  <v-icon
                    name="hi-trending-up"
                    style="stroke: #008c99; height: 18px"
                  />
                </div>
              </div>
              <div class="rescheduled-appointments__content">
                <div class="rescheduled-appointments__counter">
                  <p class="rescheduled-appointments__counter--count">
                    {{ appointmentsData.rescheduledAppointments }}
                  </p>
                  <p class="rescheduled-appointments__counter--month">
                    this <br />month
                  </p>
                </div>
                <div class="rescheduled-appointments__footer">
                  <p class="rescheduled-appointments__footer--month">
                    {{ appointmentsData.rescheduledAppointmentsLastMonth }} last
                    month
                  </p>
                  <div class="rescheduled-appointments__analytics">
                    <span
                      v-if="rescheduledAppointments.changeType === 'increasing'"
                    >
                      <rc-icon
                        icon-name="icon-arrow-up"
                        size="xs"
                        class="increasing"
                      />
                    </span>
                    <span
                      v-if="rescheduledAppointments.changeType === 'decreasing'"
                    >
                      <rc-icon
                        icon-name="icon-arrow-down"
                        size="xs"
                        class="decreasing"
                      />
                    </span>
                    <span
                      v-if="rescheduledAppointments.changeType === 'unchanged'"
                    >
                      <rc-icon
                        icon-name="minus-solid"
                        size="xs"
                        class="unchanged"
                      />
                    </span>
                    <p
                      class="rescheduled-appointments__analytics--analytics"
                      :class="rescheduledAppointments.changeType"
                    >
                      {{ rescheduledAppointments.percentage }}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="next-appointment" v-if="nextAppointment && nextAppointment.patient">
            <p class="next-appointment__heading">Next Appointment</p>
            <div class="next-appointment__content">
              <div>
                <rc-avatar
                  size="md"
                  :firstName="nextAppointment.patient.profile?.first_name"
                  :lastName="nextAppointment.patient.profile?.last_name"
                />
              </div>
              <div class="next-appointment-content">
                <p class="next-appointment-content__name">
                  {{ nextAppointment.patient.full_name }}
                </p>
                <div class="next-appointment-content__schedule-container">
                  <div class="next-appointment-content__shedule">
                    <v-icon
                      name="bi-clock"
                      style="fill: #6f6f6f; height: 15px"
                    />
                    <p class="next-appointment-content__shedule--content">
                      {{
                        format(new Date(nextAppointment.start_time), "hh:mm a")
                      }}
                    </p>
                  </div>
                  <div class="next-appointment-content__shedule">
                    <v-icon
                      name="bi-calendar4-event"
                      style="fill: #6f6f6f; height: 14px"
                    />
                    <p class="next-appointment-content__shedule--content">
                      {{
                        format(
                          new Date(nextAppointment.start_time),
                          "dd/MM/yyyy"
                        )
                      }}
                    </p>
                  </div>
                </div>
                <div class="next-appointment-content__actions desktop">
                  <rc-button
                    label="View Details"
                    icon-right
                    icon-name="arrow-right"
                    type="secondary"
                    size="small"
                    @click="onOpenAppointment(nextAppointment)"
                  />
                  <rc-button
                    label="Reschedule"
                    type="tertiary"
                    size="medium"
                    style="border: 0"
                    @click="onSubmitRescheduleAppointment(nextAppointment)"
                  />
                </div>
              </div>
            </div>
            <div class="next-appointment-content__actions mobile">
              <rc-button
                label="View Details"
                icon-right
                icon-name="arrow-right"
                type="secondary"
                size="small"
                @click="onOpenAppointment(nextAppointment)"
              />
              <rc-button
                label="Reschedule"
                type="tertiary"
                size="medium"
                style="border: 0"
                @click="onSubmitRescheduleAppointment(nextAppointment)"
              />
            </div>
          </div>
          <div class="next-appointment" v-else>
            <p class="next-appointment__heading">Next Appointment</p>
            <div class="next-appointment__content" style="justify-content: center; padding: 2rem; text-align: center;">
              <p style="color: #6f6f6f;">No upcoming appointments scheduled</p>
            </div>
          </div>
        </div>
        <div class="calendar-container">
          <div class="calendar-container-header">
            <div class="calendar-heading">
              <p class="calendar-heading__heading">Calendar</p>
              <div class="calendar-heading__actions">
                <rc-iconbutton
                  icon="icon-plus-solid"
                  size="md"
                  @click="openCreateAppointmentModal"
                  title="Create new appointment"
                />
                <rc-iconbutton icon="icon-menu-solid" size="md" />
              </div>
            </div>
            <div class="calendar-component">
              <rc-calendar
                transparent
                borderless
                expanded
                v-model="dateSelector"
                :appointmentDates="appointmentItems"
              />
            </div>
          </div>
          <div class="calendar-appointments">
            <div class="calender-appointments-items">
              <p class="calendar-appointments-items__heading" v-if="selectedDateFormatted">
                {{ isSelectedDateToday ? "Today," : "" }}
                {{ selectedDateFormatted }}
              </p>
              <div class="calendar-appointments-items__container">
                <template v-if="computedAppointments && computedAppointments.length > 0">
                  <template
                    v-for="appointment in computedAppointments"
                    :key="appointment"
                  >
                    <div class="calendar-appointments-items__content">
                      <p class="calendar-appointments-items__content--time">
                        {{
                          format(new Date(appointment.start_time), "hh:mm a")
                        }}
                      </p>
                      <p class="calendar-appointments-items__content--desc">
                        Meeting with {{ appointment.patient.full_name }}
                      </p>
                      <div class="calendar-action-button">
                        <rc-menu left>
                          <template v-slot:button>
                            <rc-iconbutton
                              icon="3dots-solid"
                              size="sm"
                              :sx="{ width: '100%' }"
                            />
                          </template>
                          <div class="calendar-action_content">
                            <span
                              class="calendar-action_content__item"
                              @click="onOpenAppointment(appointment)"
                            >
                              View Details</span
                            >
                            <span
                              class="calendar-action_content__item"
                              @click="
                                onSubmitRescheduleAppointment(appointment)
                              "
                            >
                              Reschedule
                            </span>
                          </div>
                        </rc-menu>
                      </div>
                    </div>
                  </template>
                </template>
                <div v-else class="no-appointments-container">
                  <p class="no-appointments-message">
                    There are no appointments for this day
                  </p>
                  <rc-button
                    v-if="isFutureDate(dateSelector)"
                    label="Create Appointment"
                    type="primary"
                    size="small"
                    icon-left
                    icon-name="icon-plus-solid"
                    @click="openCreateAppointmentModal"
                    class="create-appointment-btn"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <dialog-modal
    v-if="isOpenAppointment"
    title="Appointment Details"
    @closeModal="isOpenAppointment = false"
    :has-footer="true"
    class="appointment-details-modal"
  >
    <template v-slot:body>
      <div class="loader-container" v-if="isFetchingAppointment">
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
                      :firstName="patientInfo.firstName"
                      :lastName="patientInfo.lastName"
                      v-model="patientInfo.profilePhoto"
                    />
                  </div>
                  <div class="specialist_details-info-container">
                    <div class="specialist-details-heading">
                      <h2 class="specialist_details-name">
                        {{ patientInfo.fullName }}
                      </h2>
                      <div
                        class="specialist_details-rating-container desktop-visible"
                      >
                        <span class="specialist_details-rating">{{
                          patientInfo.rating?.toFixed(1)
                        }}</span>
                        <rc-icon icon-name="icon-star-rating" size="xms" />
                      </div>
                    </div>
                    <div class="specialist-details__patient">
                      <div class="specialist-details__icon mobile-visible">
                        <template v-if="patientInfo.rating">
                          <span v-for="i in patientInfo.rating" :key="i">
                            <rc-icon
                              icon="star"
                              size="xs"
                              viewBox="0 0 12 12"
                            />
                          </span>
                        </template>
                        <div
                          v-else
                          class="specialist-details__no-rating mobile-visible"
                        >
                          <span class="specialist_details-rating">{{
                            patientInfo.rating?.toFixed(1)
                          }}</span>
                          <rc-icon icon="star" size="xs" viewBox="0 0 12 12" />
                        </div>
                      </div>
                      <p class="specialist_details-specialty">
                        {{ patientInfo.category }}
                      </p>
                      <p class="specialist_details-specialty">
                        0yrs experience
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="specialist-appointment-details">
                <div class="specialist-appointment-details__container">
                  <p class="specialist-appointment-details__title">
                    Date & Time
                  </p>
                  <div class="specialist-appointment-details__content">
                    <p class="specialist-appointment-details__item">
                      {{
                        format(new Date(patientInfo.startTime), "MMMM dd, yyyy")
                      }}
                    </p>
                    <p class="specialist-appointment-details__item">
                      {{ format(new Date(patientInfo.startTime), "HH:mm") }}
                      ({{ format(new Date(patientInfo.startTime), "hh:mm a") }})
                      {{ patientInfo.timezone }}
                    </p>
                  </div>
                </div>
                <div class="specialist-appointment-details__container">
                  <p class="specialist-appointment-details__title">
                    Appointment Type
                  </p>
                  <div class="specialist-appointment-details__content">
                    <p class="specialist-appointment-details__item">
                      {{ patientInfo.appointmentType }}
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
      <div class="modal-appointment-actions" v-if="!isFetchingAppointment">
        <rc-button
          type="tertiary"
          style="border: 0"
          label="Cancel Appointment"
          class="reschedule_action"
          :disabled="isFetchingAppointment"
          @click="isOpenCancelAppointment = true"
        />
        <div class="modal-appointment-actions__meeting">
          <rc-button
            type="tertiary"
            label="Reschedule"
            class="reschedule_action"
            @click="isOpenScheduleAppointment = true"
            :disabled="isFetchingAppointment"
          />
          <rc-button
            type="primary"
            label="Start Meeting"
            class="start_meeting_action"
            :disabled="isFetchingAppointment || !appointmentInfo?.start_url"
            @click="onStartMeetings(appointmentInfo)"
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
          @click="onSubmitCancelAppointment(appointmentInfo)"
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
          Rescheduling your appointment less than 12 hours before the scheduled
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
          :disabled="isLoadingScheduleAppointment"
          @click="isOpenScheduleAppointment = false"
        />
        <rc-button
          label="Yes"
          type="primary"
          size="small"
          :loading="isLoadingScheduleAppointment"
          :disabled="isLoadingCancelAppointment"
          @click="onSubmitRescheduleAppointment(appointmentInfo)"
        />
      </div>
    </template>
  </dialog-modal>

  <reschedule-appointment ref="rescheduleAppointmentRef" @rescheduled="onAppointmentRescheduled" />

  <create-appointment-modal
    v-model="isOpenCreateAppointment"
    :pre-selected-date="dateSelector"
    @appointmentCreated="onAppointmentCreated"
  />
</template>

<script setup>
import { groupBy } from "lodash";
import { format, isToday, isFuture, startOfDay } from "date-fns";
import { useToast } from "vue-toast-notification";
import { ref, inject, computed, onMounted } from "vue";
import TopBar from "@/components/Navigation/top-bar";
import RcAvatar from "@/components/RCAvatar";
import RcIcon from "@/components/RCIcon";
import RcIconbutton from "@/components/RCIconButton";
import RcButton from "@/components/buttons/button-primary";
import ButtonIcon from "@/components/buttons/button-icon";
import RcCalendar from "@/components/RCCalendar";
import RcMenu from "@/components/RCMenu";
import Loader from "@/components/Loader/main-loader";
import DialogModal from "@/components/modals/dialog-modal.vue";
import { calculatePercentageChange } from "@/utilities/utilityFunctions";
import RescheduleAppointment from "./Appointments/RescheduleAppointment";
import CreateAppointmentModal from "./Appointments/CreateAppointmentModal.vue";

const $http = inject("$_HTTP");
const $toast = useToast();

const isLoading = ref(true);
const appointmentsData = ref({});
const nextAppointment = ref({});
const totalEarnings = ref({});
const appointmentInfo = ref({});
const appointmentItems = ref([]);
const dateSelector = ref(new Date());
const patientInfo = ref({});
const totalEarningsAnalytics = ref({});
const completedAppointmentsAnalytics = ref({});
const rescheduledAppointments = ref({});
const specialistInfo = ref({});

const isOpenAppointment = ref(false);
const isFetchingAppointment = ref(true);
const isOpenCancelAppointment = ref(false);
const isLoadingCancelAppointment = ref(false);
const isOpenScheduleAppointment = ref(false);
const isLoadingScheduleAppointment = ref(false);
const isOpenCreateAppointment = ref(false);
const rescheduleAppointmentRef = ref();

onMounted(() => getSpecialistDashboard());

const computedAppointments = computed(() => {
  if (Object.keys(appointmentItems.value).length && dateSelector.value) {
    return appointmentItems.value[new Date(dateSelector.value).toDateString()];
  } else return [];
});

const selectedDateFormatted = computed(() => {
  if (!dateSelector.value) return '';
  try {
    const date = new Date(dateSelector.value);
    if (isNaN(date.getTime())) return '';
    return format(date, "MMMM dd, yyyy");
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
});

const isSelectedDateToday = computed(() => {
  if (!dateSelector.value) return false;
  try {
    return isToday(new Date(dateSelector.value));
  } catch (error) {
    return false;
  }
});

async function getSpecialistDashboard() {
  isLoading.value = true;
  await $http.$_getSpecialistDashboard().then(async ({ data }) => {
    appointmentsData.value = data.data.appointmentsData;
    nextAppointment.value = data.data.nextAppointment;
    totalEarnings.value = data.data.totalEarnings;

    totalEarningsAnalytics.value = calculatePercentageChange(
      totalEarnings.value.totalEarnings,
      totalEarnings.value.earningsThisWeek + totalEarnings.value.totalEarnings
    );
    completedAppointmentsAnalytics.value = calculatePercentageChange(
      appointmentsData.value.completedAppointmentsLastMonth,
      appointmentsData.value.completedAppointments
    );
    rescheduledAppointments.value = calculatePercentageChange(
      appointmentsData.value.rescheduledAppointmentsLastMonth,
      appointmentsData.value.rescheduledAppointments
    );

    // Always load appointments to populate calendar
    await getSpecialistAppointments(nextAppointment.value?.patient?.id);
    isLoading.value = false;
  });
}

async function getSpecialistAppointments(patientId = null) {
  isLoading.value = true;
  const params = { currentPage: 1, pageLimit: 100, status: "OPEN" };
  await $http.$_getSpecialistAppointments(params).then(({ data }) => {
    // Group all appointments by date for calendar
    appointmentItems.value = groupBy(
      data.data?.map((item) => ({
        ...item,
        startTime: new Date(item.start_time).toDateString(),
      })),
      "startTime"
    );
    // If patientId provided, find that specific appointment for nextAppointment
    if (patientId) {
      const foundAppointment = data.data.find((i) => i?.patient?.id === patientId);
      if (foundAppointment) {
        nextAppointment.value = foundAppointment;
      }
    }
    isLoading.value = false;
  });
}

const onOpenAppointment = async (appointment) => {
  appointmentInfo.value = appointment;

  // Handle patient as either string ID or populated object
  let userId;
  if (typeof appointment.patient === 'string') {
    // Patient is just an ID string
    userId = appointment.patient;
  } else if (appointment.patient && typeof appointment.patient === 'object') {
    // Patient is populated object
    userId = appointment.patient.id || appointment.patient._id;
  }

  if (!userId) {
    console.error('Patient information not found in appointment:', appointment);
    $toast.error('Patient information not found');
    return;
  }

  isFetchingAppointment.value = true;
  isOpenAppointment.value = true;

  await $http.$_getOneUser(userId).then(({ data }) => {
    patientInfo.value = {
      fullName: data.data?.full_name,
      firstName: data.data?.profile?.first_name,
      lastName: data.data?.profile?.last_name,
      rating: data.data.average_rating,
      category: appointment.category,
      startTime: appointment.start_time,
      appointmentType: appointment.appointment_type,
      timezone: appointment.timezone,
    };
    isFetchingAppointment.value = false;
  }).catch(error => {
    console.error('Error fetching patient details:', error);
    $toast.error('Failed to load patient details');
    isFetchingAppointment.value = false;
  });
};

const onSubmitCancelAppointment = async (appointment) => {
  isLoadingCancelAppointment.value = true;
  const payload = { appointmentId: appointment._id, status: "CANCELLED" };

  await $http
    .$_cancelAppointments(payload)
    .then(({ data }) => {
      $toast.success("Appointment cancelled successfully!");
      isLoadingCancelAppointment.value = false;
      getUserAppointments();
    })
    .catch((error) => {
      $toast.error(error.message);
      isLoadingCancelAppointment.value = false;
    });
};

const onSubmitRescheduleAppointment = (appointment) => {
  rescheduleAppointmentRef.value.onOpen(appointment);
  isOpenScheduleAppointment.value = false;
  isOpenAppointment.value = false;
};

const openCreateAppointmentModal = () => {
  isOpenCreateAppointment.value = true;
};

const onAppointmentCreated = async (newAppointment) => {
  $toast.success('Appointment created successfully!');
  // Refresh appointments to show new appointment on calendar
  await getSpecialistDashboard();
};

const onAppointmentRescheduled = async () => {
  // Refresh dashboard to update calendar with new appointment date
  await getSpecialistDashboard();
};

const isFutureDate = (date) => {
  if (!date) return false;
  const today = startOfDay(new Date());
  const selectedDate = startOfDay(new Date(date));
  return selectedDate >= today;
};
</script>

<style lang="scss" scoped>
.page-content {
  @include flexItem(vertical) {
    gap: $size-12;
    width: 75vw;
    height: 100vh;
    position: relative;
    margin-bottom: 50px;
  }
  @include responsive(tab-portrait) {
    width: 100vw !important;
  }

  &__body {
    @include flexItem(vertical) {
      width: 100%;
      height: 100%;
      overflow-y: scroll;
      padding: $size-16 $size-48;
      background: $color-g-97;
      position: relative;
    }

    @include responsive(phone) {
      padding: $size-16 $size-24;
    }

    &::-webkit-scrollbar {
      display: none;
      width: $size-12;
      background-color: $color-g-92;
    }
  }
}

.container-root {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $size-64;

  @include responsive(tab-portrait) {
    flex-direction: column;
  }
}

.dashboard-container {
  width: 60%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: $size-32;

  @include responsive(tab-portrait) {
    width: 100%;
  }

  .dashboard-earnings {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    gap: $size-24;
    background: $color-pri-t5;
    border: 1px solid $color-pri-t3;
    border-radius: $size-12;
    padding: $size-24;
    box-shadow: 8px 24px 56px rgba(0, 0, 0, 0.1),
      16px 16px 32px rgba(0, 0, 0, 0.15);

    .dashboard-earnings__heading {
      font-weight: 500;
      font-size: $size-18;
      color: $color-g-21;
    }
    .dashboard-earnings__content {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-start;
      gap: $size-16;

      .dashboard-earnings__earnings {
        font-weight: $fw-semi-bold;
        font-size: $size-64;
        line-height: $size-64;
        color: $color-pri-s1;

        @include responsive(phone) {
          font-size: $size-48;
        }
      }
      .dashboard-earnings__footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: $size-24;
        padding: $size-8 $size-12;
        background: $color-pri-t4;
        border-radius: $size-12;

        .dashboard-earnings__footer--earning {
          font-weight: $fw-regular;
          font-size: $size-10;
          color: $color-g-21;
        }
        .dashboard-earnings__analytics {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: $size-4;
          background: $color-white;
          border-radius: $size-12;
          padding: $size-2 $size-8;

          .dashboard-earnings__analytics--analytics {
            font-weight: $fw-regular;
            font-size: $size-10;
            color: #40af3e;
          }
        }
      }
    }
  }

  .dashboard-appointments {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: $size-32;

    @include responsive(phone) {
      flex-direction: column;
    }

    .completed-appointments {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-start;
      gap: $size-48;
      background: $color-pri-main;
      border: 1px solid $color-pri-s1;
      border-radius: $size-16;
      padding: $size-24;
      box-shadow: 8px 24px 56px rgba(0, 0, 0, 0.1),
        16px 16px 32px rgba(0, 0, 0, 0.15);

      .completed-appointments__heading {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .completed-appointments__heading--header {
          font-weight: 500;
          font-size: $size-18;
          color: $color-pri-t4;
        }
        .completed-appointments__heading--icon {
          background: $color-pri-t4;
          border-radius: 100%;
          padding: $size-12;
          border: 4px solid $color-pri-t3;
        }
      }
      .completed-appointments__content {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        gap: $size-8;

        .completed-appointments__counter {
          display: flex;
          justify-content: flex-start;
          align-items: flex-end;
          gap: $size-8;

          .completed-appointments__counter--count {
            font-weight: $fw-semi-bold;
            font-size: $size-64;
            color: $color-white;
          }
          .completed-appointments__counter--month {
            font-weight: $fw-regular;
            font-size: $size-12;
            color: $color-pri-t3;
            margin-bottom: $size-12;
          }
        }
        .completed-appointments__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: $size-24;
          padding: $size-8 $size-12;
          background: $color-pri-s1;
          border-radius: $size-12;

          .completed-appointments__footer--month {
            font-weight: $fw-regular;
            font-size: $size-12;
            color: $color-white;
          }
          .completed-appointments__analytics {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: $size-4;
            background: $color-white;
            border-radius: $size-12;
            padding: $size-2 $size-8;

            .completed-appointments__analytics--analytics {
              font-weight: $fw-regular;
              font-size: $size-10;
              color: $color-ter-error;
            }
          }
        }
      }
    }
    .rescheduled-appointments {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-start;
      gap: $size-48;
      background: $color-white;
      border: 1px solid $color-pri-t5;
      border-radius: $size-16;
      padding: $size-24;
      box-shadow: 8px 24px 56px rgba(0, 0, 0, 0.1),
        16px 16px 32px rgba(0, 0, 0, 0.15);

      .rescheduled-appointments__heading {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .rescheduled-appointments__heading--header {
          font-weight: 500;
          font-size: $size-18;
          color: $color-g-21;
        }
        .rescheduled-appointments__heading--icon {
          background: $color-sec-t3;
          border-radius: 100%;
          padding: $size-12;
          border: 4px solid $color-sec-t4;
        }
      }
      .rescheduled-appointments__content {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-start;
        gap: $size-8;

        .rescheduled-appointments__counter {
          display: flex;
          justify-content: flex-start;
          align-items: flex-end;
          gap: $size-8;

          .rescheduled-appointments__counter--count {
            font-weight: $fw-semi-bold;
            font-size: $size-64;
            color: $color-g-21;
          }
          .rescheduled-appointments__counter--month {
            font-weight: $fw-regular;
            font-size: $size-12;
            color: $color-g-54;
            margin-bottom: $size-12;
          }
        }
        .rescheduled-appointments__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: $size-24;
          padding: $size-8 $size-12;
          background: $color-g-90;
          border-radius: $size-12;

          .rescheduled-appointments__footer--month {
            font-weight: $fw-regular;
            font-size: $size-12;
            color: $color-g-21;
          }
          .rescheduled-appointments__analytics {
            display: flex;
            justify-content: flex-start;
            align-items: center;
            gap: $size-4;
            background: $color-white;
            border-radius: $size-12;
            padding: $size-2 $size-8;

            .rescheduled-appointments__analytics--analytics {
              font-weight: $fw-regular;
              font-size: $size-10;
              color: $color-ter-error;
            }
          }
        }
      }
    }
  }
  .next-appointment {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    gap: $size-24;
    background: $color-white;
    border: 1px solid $color-pri-t5;
    border-radius: $size-16;
    padding: $size-24 $size-32;
    box-shadow: 8px 24px 56px rgba(0, 0, 0, 0.1),
      16px 16px 32px rgba(0, 0, 0, 0.15);

    .next-appointment__heading {
      font-weight: $fw-medium;
      font-size: $size-18;
      color: $color-g-44;
    }
    .next-appointment__content {
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
      gap: $size-24;

      .next-appointment-content {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: $size-8;

        .next-appointment-content__name {
          font-weight: $fw-semi-bold;
          font-size: $size-20;
          line-height: 26px;
          color: $color-g-21;
          text-transform: capitalize;
        }
        .next-appointment-content__schedule-container {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: $size-16;

          .next-appointment-content__shedule {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: $size-8;

            @include responsive(phone) {
              gap: $size-0;
            }

            .next-appointment-content__shedule--content {
              font-weight: $fw-regular;
              font-size: $size-16;
              color: $color-g-44;
              white-space: nowrap;
            }
          }
        }
      }
      .next-appointment-content__actions {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        gap: $size-16;
        margin-top: $size-16;
      }
    }
  }
}

.calendar-container {
  width: 40%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: $size-32;

  @include responsive(tab-portrait) {
    width: 100%;
    flex-direction: row;
  }
  @include responsive(phone) {
    width: 100%;
    flex-direction: column;
  }

  .calendar-container-header {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: $size-32;

    .calendar-heading {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .calendar-heading__heading {
        font-weight: $fw-medium;
        font-size: $size-20;
        line-height: 22px;
        color: $color-g-21;
      }
      .calendar-heading__actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: $size-32;
      }
    }
    .calendar-component {
      width: 100%;
    }
  }
  .calendar-appointments {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: $size-44;

    .calender-appointments-items {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-start;
      gap: $size-32;

      .calendar-appointments-items__heading {
        font-weight: $fw-regular;
        font-size: $size-18;
        line-height: 22px;
        color: $color-g-44;
      }
      .calendar-appointments-items__container {
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: $size-16;

        .calendar-appointments-items__content {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid $color-g-90;
          padding: $size-24 $size-0;
          padding-top: $size-8;

          .calendar-appointments-items__content--time {
            font-weight: $fw-regular;
            font-size: $size-16;
            color: $color-pri-main;

            @include responsive(phone) {
              font-size: $size-14;
            }
          }
          .calendar-appointments-items__content--desc {
            font-weight: $fw-regular;
            font-size: $size-18;
            line-height: 26px;
            color: $color-black;
            text-transform: capitalize;

            @include responsive(phone) {
              font-size: $size-16;
            }
          }

          .no-appointments-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            padding: 2rem 1rem;

            .no-appointments-message {
              font-weight: $fw-regular;
              font-size: $size-16;
              color: #6f6f6f;
              text-align: center;
            }

            .create-appointment-btn {
              margin-top: 0.5rem;
            }
          }

          .calendar-action-button {
            width: 5%;
            cursor: pointer;
            &:hover {
              background: #eaeaea;
              border-radius: $size-4;
            }

            .calendar-action_content {
              width: 120px;
              padding: $size-10;
              display: flex;
              flex-direction: column;
              justify-content: start;
              gap: $size-5;

              .calendar-action_content__item {
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
          }
        }
      }
    }
  }
}

.mobile {
  display: none !important;
  @include responsive(phone) {
    display: flex !important;
  }
}
.desktop {
  display: flex !important;
  @include responsive(phone) {
    display: none !important;
  }
}
.increasing {
  color: #40af3e !important;
  fill: #40af3e !important;
  stroke: #40af3e !important;
}
.decreasing {
  color: #ee4511 !important;
  fill: #ee4511 !important;
  stroke: #ee4511 !important;
}
.unchanged {
  color: #363636 !important;
  fill: #363636 !important;
  stroke: #363636 !important;
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
  width: 636px !important;
  padding: $size-44 $size-32;

  @include responsive(tab-landscape) {
    width: 100% !important;
    display: flex !important;
    padding: $size-32;
  }
  @include responsive(phone) {
    width: 100% !important;
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
  // padding: $size-24;
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
