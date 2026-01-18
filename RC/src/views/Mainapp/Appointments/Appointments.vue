<template>
  <div class="page-content">
    <top-bar
      type="title-only"
      title="Appointments"
      @open-side-nav="$emit('openSideNav')"
    />
    <div class="page-content__body">
      <div class="rc-button-container">
        <rc-button
          type="tertiary"
          label="Book Appointment"
          :icon-left="true"
          class="rc-button"
          icon-name="plus-rc"
          @click="isOpen = true"
        />
      </div>
      <div class="button-floating mobile-visible">
        <rc-iconbutton
          @click="isOpen = true"
          icon="icon-plus-solid"
          size="lg"
          :sx="{
            background: '#008C99',
            stroke: '#FFFFFF',
            fill: '#FFFFFF',
            borderRadius: '50%',
          }"
        />
      </div>
      <div class="content-container">
        <div class="tabs-container">
          <rc-tab
            :currentTab="currentTab"
            :wrapper-class="'default-tabs'"
            :tab-class="'default-tabs__item'"
            :tab-active-class="'default-tabs__item_active'"
            :line-class="'default-tabs__active-line'"
            @onClick="($tab) => (currentTab = $tab)"
            :tabs="[
              { title: 'Upcoming Appointments', value: 'upcoming' },
              { title: 'History', value: 'history' },
            ]"
          />
          <div class="tabs_content">
            <template v-if="currentTab === 'upcoming'">
              <upcoming-appointments
                @create="isOpen = true"
                :key="upcomingAppointmentsKey"
              />
            </template>
            <template v-if="currentTab === 'history'">
              <appointment-history
                @create="isOpen = true"
                :key="upcomingAppointmentsKey"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
    <dialog-modal
      v-if="isOpen"
      @closeModal="onClose"
      :has-footer="bookingInfo.hasFooter"
      :title="bookingInfo.heading"
    >
      <template v-slot:body>
        <entry v-if="bookingInfo.current === 0" />
        <agreement v-if="bookingInfo.current === 1" />
        <category v-if="bookingInfo.current === 2" />
        <booking v-if="bookingInfo.current === 3" />
        <professionals v-if="bookingInfo.current === 4" />
        <bookingsummary v-if="bookingInfo.current === 5" />
      </template>
      <template v-slot:foot>
        <div
          v-if="bookingInfo.current === 0"
          class="action-button multiple-btn"
        >
          <rc-button
            label="Continue with Booking"
            type="tertiary"
            size="medium"
            @click="useBookingInfo({ current: 1 })"
          />
          <rc-button
            label="Take Diagnosis"
            type="primary"
            size="medium"
            @click="$router.push({ name: 'HealthCheckup' })"
          />
        </div>
        <div v-if="bookingInfo.current === 1" class="action-button">
          <rc-button
            label="Accept & Proceed"
            type="primary"
            size="medium"
            @click="useBookingInfo({ current: 2 })"
          />
        </div>
        <div
          v-if="bookingInfo.current === 3"
          class="action-button btn-float-right"
        >
          <rc-button
            label="Next"
            type="primary"
            size="medium"
            :disabled="!bookingInfo.proceed"
            @click="useBookingInfo({ current: 4 })"
          />
        </div>
        <div v-if="bookingInfo.current === 5" class="action-button">
          <rc-button
            label="Book Appointment"
            type="primary"
            size="medium"
            :disabled="!bookingInfo.proceed || isSubmitting"
            :loading="isSubmitting"
            @click="onSubmitBooking"
          />
        </div>
      </template>
    </dialog-modal>
  </div>
</template>

<script setup>
import { uniqueId } from "lodash";
import { useToast } from "vue-toast-notification";
import { ref, inject, provide, watch } from "vue";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import RcTab from "@/components/RCTab";
import RcModal from "@/components/RCModal";
import RcIconbutton from "@/components/RCIconButton";
import DialogModal from "@/components/modals/dialog-modal";

import UpcomingAppointments from "./UpcomingAppointments";
import AppointmentHistory from "./AppointmentHistory";

import Entry from "./entry";
import Agreement from "./agreement";
import Category from "./category";
import Booking from "./booking";
import Professionals from "./professionals";
import Bookingsummary from "./summary";

const $toast = useToast();
const $http = inject("$_HTTP");
const bookingInfo = ref({ current: 0 });
const navigator = ref({ from: null, to: null, current: 3 });
const useBookingInfo = (payload) =>
  (bookingInfo.value = { ...bookingInfo.value, ...payload });
const useNavigator = ({ current, from, to }) =>
  (navigator.value = { current: to, from, to: null });
provide("$_BOOKING_INFO", { bookingInfo, useBookingInfo });
provide("$_NAVIGATOR", { navigator, useNavigator });

watch(bookingInfo, (value) => {
  console.log("bookingInfo", bookingInfo.value);
});

const currentTab = ref("upcoming");
const upcomingAppointmentsKey = ref(uniqueId(Math.random()));
const isOpen = ref(false);
const isSubmitting = ref(false);

const onClose = () => {
  isOpen.value = false;
  bookingInfo.value.current = 0;
};

const onSubmitBooking = async () => {
  isSubmitting.value = true;

  const payload = {
    category: bookingInfo.value.payload.professional_category,
    date: bookingInfo.value.payload.selectedDate,
    time: bookingInfo.value.payload.selectedTime,
    timezone: bookingInfo.value.payload.time_zone,
    appointment_type: "Initial Appointment",
    specialist: bookingInfo.value.payload.id,
    meeting_channel: bookingInfo.value.payload.meeting_channel_value || 'zoom',
  };

  await $http
    .$_createAppointments(payload)
    .then(({ data }) => {
      $toast.success("Appointments created successfully!");
      isSubmitting.value = false;
      onClose();
    })
    .catch((error) => {
      $toast.error(error.message);
      isSubmitting.value = false;
    });
};
</script>

<style scoped lang="scss">
.page-content {
  display: flex;
  flex-direction: column;
  gap: $size-12;
  width: 100%;
  height: 100vh;

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

  @include responsive(phone) {
    display: none !important;
    justify-content: center;
    width: 100%;
  }
}
.rc-button {
  background: transparent;
  // border: $size-1 solid $color-pri;
}
.default-tabs {
  margin-bottom: $size-20;

  @include responsive(phone) {
    display: flex;
  }
}
.content-container {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: $size-60;
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

  .tabs_content {
    height: 100%;
  }
}
.appointment_details {
  width: 55%;
  height: 100%;
  padding-bottom: $size-24;
}

:deep(.modal) {
  max-width: 100% !important;
  max-height: 100% !important;

  @include responsive(tab-portrait) {
    min-width: 90% !important;
    max-width: 90% !important;
  }
  @include responsive(tab-landscape) {
    min-width: 90% !important;
    max-width: 90% !important;
  }
  @include responsive(phone) {
    min-width: 100% !important;
    max-width: 100% !important;
  }
}
:deep(.modal__body) {
  padding: 0 !important;
  // overflow: hidden !important;
}

:deep(.modal__footer) {
  position: relative !important;
  display: flex;
  justify-content: center !important;
  align-items: center;
}
</style>

<style scoped lang="scss">
.action-button {
  display: flex;
  justify-content: space-between;
  position: relative;

  @include responsive(phone) {
    flex-direction: column;
    margin: 0;
    gap: $size-16;
    width: 100%;
  }
}
.button-floating {
  position: absolute !important;
  bottom: 24px;
  right: 24px;
  z-index: 2;
}

.multiple-btn {
  width: 100%;
}

.btn-float-right {
  justify-content: flex-end;
  width: 100%;
}

.desktop-visible {
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
