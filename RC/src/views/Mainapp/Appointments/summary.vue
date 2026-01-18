<template>
  <div class="booking_summary-container">
    <div class="booking_details">
      <p class="booking_details-heading">Meeting Details</p>
      <div class="booking_details-container">
        <div>
          <rc-avatar
            size="lg"
            class="booking_details-avatar"
            :firstName="summaryInfo.firstName"
            :lastName="summaryInfo.lastName"
            v-model="summaryInfo.photo"
          />
        </div>
        <div class="booking_details__container-div">
          <div class="booking_details-info-container">
            <div class="booking_details-info">
              <h2 class="booking_details-name">{{ summaryInfo.fullName }}</h2>
              <div class="booking_details-rating-container">
                <p class="booking_details-rating">{{ summaryInfo.rating }}</p>
                <v-icon
                  name="bi-star-fill"
                  class="accordion-rating-icon"
                  fill="#DCB93A"
                />
              </div>
            </div>
            <p class="booking_details-spacialty">Cardiologist</p>
            <p class="booking_details-price">
              {{ summaryInfo.serviceYear }}yrs experience
            </p>
          </div>
          <div class="booking-appointement-bookings">
            <div class="appointment-bookings-datetime">
              <p class="appointment-bookings__title">Date & Time</p>
              <div class="appointment-bookings-datetime__content">
                <p
                  v-if="summaryInfo.selectedDate"
                  class="appointment-bookings-content__item"
                >
                  {{
                    format(new Date(summaryInfo.selectedDate), "MMM dd, yyyy")
                  }}
                </p>
                <p
                  v-if="summaryInfo.selectedTime"
                  class="appointment-bookings-content__item"
                >
                  {{ summaryInfo.selectedTime }} ({{
                    format(
                      parse(summaryInfo.selectedTime, "HH:mm", new Date()),
                      "hh:mm a"
                    )
                  }})
                  {{ summaryInfo.time_zone }}
                </p>
              </div>
            </div>
            <div class="appointment-bookings-datetime">
              <p class="appointment-bookings__title">Appointment Type</p>
              <p class="appointment-bookings-datetime__content">
                Initial appointment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="booking_appointment__more-details">
      <div class="booking-appointment_details__container">
        <div class="booking_appointment_details">
          <p class="booking_appointment_details-heading">Billing Information</p>
          <p class="booking_appointment__details-billing">
            You’ll be charged after the first 5mins of your meeting.
          </p>
        </div>

        <spinner v-if="isFetchingCard" color="primary" />
        <template v-else>
          <rc-radio
            slotted
            :options="userPaymentCards"
            slotted-class="appointment-cards"
            defaultValue="default"
            v-model="defaultPaymentCard"
            v-if="userPaymentCards.length"
          >
            <template v-slot="{ item }">
              <div class="appointment-cards-content">
                <img
                  :src="
                    require(`payment-icons/min/flat/${item.card_type?.trim()}.svg`)
                  "
                  style="width: 40px"
                />
                <span class="appointment-cards-content__digits"
                  >**** **** **** {{ item.last4Digit }}</span
                >
                <span class="container-account-content__expiry"
                  >Expires on {{ format(new Date(item.expiry), "MM/yy") }}</span
                >
              </div>
            </template>
          </rc-radio>
          <template v-else>
            <div class="booking-appointment_payments" @click="handleAddPayment">
              <rc-icon icon-name="icon-add" size="xs" />
              <p class="booking-appointment_payments__text">Add Payment</p>
            </div>
          </template>
        </template>
      </div>
      <paystack
        ref="paystackComponentRef"
        buttonText="Pay Online"
        buttonClass="paystack-component"
        :publicKey="userPaymentInfo.publicKey"
        :email="userPaymentInfo.email"
        :amount="userPaymentInfo.amount"
        :reference="userPaymentInfo.reference"
        :onSuccess="onSuccessPayment"
        :close="onCancelPayment"
        :onCancel="onCancelPayment"
      />
    </div>
  </div>
</template>

<script setup>
import paystack from "vue3-paystack";
import { format, parse } from "date-fns";
import { useToast } from "vue-toast-notification";
import { ref, inject, onMounted, watchEffect, watch } from "vue";
import DialogModal from "@/components/modals/dialog-modal";
import RcButton from "@/components/buttons/button-primary";
import RcIcon from "@/components/RCIcon";
import RcAvatar from "@/components/RCAvatar";
import RcRadio from "@/components/RCRadio";
import RcSelect from "@/components/inputs/select-dropdown";
import Avatar from "@/components/Avatars/avatar-fixed";
import Spinner from "@/components/Loader/loader-standalone";
import { mapGetters } from "@/utilities/utilityStore";

const $toast = useToast();
const $http = inject("$_HTTP");
const { bookingInfo, useBookingInfo } = inject("$_BOOKING_INFO");
useBookingInfo({ heading: "Booking Summary", hasFooter: true });
const { userprofile } = mapGetters();

const emit = defineEmits(["submitting", "proceed", "success"]);
const props = defineProps({
  isOpen: { type: Boolean, default: false, required: true },
  bookingInfo: { required: true, default: () => {} },
});

onMounted(() => getPaymentCards());

const summaryInfo = ref({
  ...bookingInfo.value.payload,
  fullName: bookingInfo.value.payload?.full_name,
  firstName: bookingInfo.value.payload?.profile.first_name,
  lastName: bookingInfo.value.payload?.profile.last_name,
  rating: bookingInfo.value.payload?.average_rating,
  selectedDate: bookingInfo.value.payload?.selectedDate,
  selectedTime: bookingInfo.value.payload?.selectedTime,
  serviceYear:
    bookingInfo.value.payload?.professional_practice.years_of_practice,
});

const appointmentType = ref("");
const meetingType = ref("");
const isSubmitting = ref(false);
const isOpenPayments = ref(false);
const hasPaymentCard = ref(false);
const isFetchingCard = ref(true);
const userPaymentCards = ref([]);
const userPaymentInfo = ref({});
const paystackComponentRef = ref();
const defaultPaymentCard = ref({});

watch(userPaymentCards, (value) => {
  useBookingInfo({
    payload: {
      ...bookingInfo.value.payload,
      paymentCards: userPaymentCards.value,
      defaultPaymentCard: defaultPaymentCard.value,
    },
    proceed: Boolean(value.length),
  });
});

const getPaymentCards = async () => {
  isFetchingCard.value = true;
  await $http.$_getPaymentCards().then(({ data }) => {
    userPaymentCards.value = data.data.map((i) => ({ ...i, value: i }));
    defaultPaymentCard.value = data.data.find((i) => i.default);
    isFetchingCard.value = false;
  });
};

const handleAddPayment = async () => {
  isFetchingCard.value = true;

  try {
    await $http.$_addPaymentCard().then(async (response) => {
      userPaymentInfo.value = {
        ...userPaymentInfo.value,
        amount: response.data.data.amount,
        reference: response.data.data.reference,
        email: userprofile.value?.profile?.contact?.email,
        publicKey: response.headers["x-paystack-key"],
      };
    });
    paystackComponentRef.value.$el.click();
  } catch (error) {
    $toast.error(error.message);
    isFetchingCard.value = false;
  }
};

const onSuccessPayment = async (response) => {
  const reference = response.reference;
  await $http.$_verifyPaymentCard({ reference }).then(() => {
    $toast.success(response.message);
    getPaymentCards();
  });
};

const onCancelPayment = () => {
  $toast.error("Sorry, payment has been cancelled");
  getPaymentCards();
};
</script>

<style scoped lang="scss">
.paystack-component {
  display: none !important;
}
.booking_summary-container {
  display: flex;
  flex-direction: column;
  gap: $size-80;
  padding: $size-32;
  min-height: 480px;
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
}
.booking_details {
  display: flex;
  flex-direction: column;
  gap: $size-20;

  .booking_details-heading {
    font-weight: $fw-regular;
    font-size: $size-14;
    color: $color-g-44;
    padding-bottom: $size-5;
  }
}
.booking_details__container-div {
  display: flex;
  flex-direction: column;
  gap: $size-20;
}
.booking_details-container {
  display: flex;
  justify-content: start;
  align-items: flex-start;
  gap: $size-20;

  .booking_details-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;

    img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
    }
  }
}
.booking_details-info-container {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: flex-start;
  gap: $size-5;

  .booking_details-info {
    display: flex;
    justify-content: start;
    align-items: center;
    gap: $size-10;

    .booking_details-name {
      font-weight: $fw-semi-bold;
      font-size: $size-20;
      color: $color-black;
    }
    .booking_details-rating-container {
      display: flex;
      justify-content: start;
      align-items: center;
      gap: $size-5;

      .booking_details-rating {
        font-size: $size-16;
        font-weight: $fw-bold;
        color: $color-g-44;
      }
    }
  }
  .booking_details-spacialty {
    font-size: $size-12;
    font-weight: $fw-regular;
    color: $color-g-44;
  }
  .booking_details-price {
    font-size: $size-12;
    font-weight: $fw-regular;
    color: $color-g-44;
  }
}
.booking-appointment_details__container {
  display: flex;
  flex-direction: column;
  gap: $size-20;

  .booking-appointment_payments {
    display: flex;
    justify-content: center;
    align-self: center;
    gap: $size-10;
    padding: $size-8 $size-12;
    cursor: pointer;
    border-radius: $size-4;
    width: fit-content;

    &:hover {
      background: $color-pri-t4;
    }

    .booking-appointment_payments__text {
      color: $color-sec-s2;
      font-size: $size-16;
    }
  }

  :deep(.appointment-cards) {
    @include flexItem(vertical) {
      gap: $size-8;
      align-items: center;
      width: 100%;

      label {
        background: $color-pri-t6;
        padding: $size-16;
        border-radius: $size-10;
        outline: $size-1 solid $color-pri-t3;
        outline-offset: -$size-1;

        &:hover {
          outline: $size-1 solid $color-pri-t3;
          outline-offset: -$size-1;
        }
        @include responsive(phone) {
          padding: $size-12 $size-8 $size-12 $size-12;
          align-items: center;
        }
      }
    }

    & .appointment-cards-content {
      flex-grow: 1;
      @include flexItem(horizontal) {
        gap: $size-32;
      }

      & .appointment-cards-content__digits {
        font-family: inherit;
        font-size: $size-16;
        font-weight: $fw-regular;
        color: $color-black;
        overflow: hidden;
        display: flex;
        align-items: center;
      }
      & .container-account-content__expiry {
        font-family: inherit;
        font-weight: $fw-regular;
        font-size: $size-16;
        color: $color-g-44;
        display: flex;
        align-items: center;
      }
    }
  }
}
.booking_appointment_details {
  display: flex;
  flex-direction: column;
  gap: $size-24;

  .booking_appointment_details-heading {
    font-weight: $fw-regular;
    font-size: $size-14;
    color: $color-g-44;
    line-height: 18px;
  }
  .booking_appointment_details-container {
    display: flex;
    justify-content: start;
    align-content: center;
    gap: $size-10;

    .booking_appointment_details-title {
      font-size: $size-12;
      font-weight: $fw-regular;
      color: $color-g-44;
    }
    .booking_appointment_details-value {
      font-size: $size-12;
      font-weight: $fw-regular;
      color: $color-g-21;
    }
  }
}
.booking_appointment__details-billing {
  color: $color-g-21;
  font-weight: $fw-regular;
  font-size: $size-16;
}
.booking_appointment__more-details {
  display: flex;
  flex-direction: column;
  justify-content: start;
  gap: $size-28;
}

.booking-appointement-bookings {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: $size-24;

  .appointment-bookings-datetime {
    display: flex;
    flex-direction: column;
    justify-content: start;
    gap: $size-4;

    .appointment-bookings__title {
      font-weight: $fw-regular;
      font-size: $size-14;
      line-height: 18px;
      color: $color-g-44;
    }
    .appointment-bookings-datetime__content {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: flex-start;
      gap: $size-4;

      .appointment-bookings-content__item {
        color: $color-black;
        font-weight: $fw-regular;
      }
    }
  }
}
</style>
