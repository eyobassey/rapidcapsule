<template>
  <DialogModal :title="title" @closeModal="handleCloseModal">
    <template v-slot:body>
      <div class="modal__body-content">
        <p class="description">
          {{ description }}
        </p>

        <DigitArray
          v-model:input1="otpArray[0]"
          v-model:input2="otpArray[1]"
          v-model:input3="otpArray[2]"
          v-model:input4="otpArray[3]"
          v-model:input5="otpArray[4]"
          v-model:input6="otpArray[5]"
          :placeholder="placeHolders"
          :isdisabled="!countingDown || errorMessage ? true : false"
          @input="autoSubmitApp()"
        />

        <div class="footer-wrapper">
          <p v-if="errorMessage" class="error-input">{{ errorMessage }}</p>
          <div v-else-if="!errorMessage" class="counter">
            <p
              v-if="countingDown"
              class="fs-16 lh-150 fw-regular ls-2 align-center"
            >
              Code will expire in
              <vue-countdown
                class="timer"
                :time="time"
                v-slot="{ totalSeconds }"
                @end="onCountdownEnd"
                >{{ totalSeconds + "s" }}</vue-countdown
              >
            </p>
            <p
              v-else
              class="error-input fs-16 lh-150 fw-regular ls-2 align-center"
            >
              Your OTP has expired.
            </p>
          </div>
          <div>
            <Button
              label="Resend OTP"
              type="tertiary"
              size="medium"
              :disabled="countingDown && !errorMessage"
              :loading="isLoading"
              loaderColor="primary"
              @click="resendOTP"
            />
          </div>
        </div>
      </div>
    </template>
    <template v-slot:loader>
      <Loader v-if="isLoading" :useOverlay="true" :rounded="true" />
    </template>
  </DialogModal>
</template>

<script>
import { ref, inject } from "vue";
import DigitArray from "@/components/inputs/digit-array.vue";
import DialogModal from "@/components/modals/dialog-modal.vue";
import Button from "@/components/buttons/button-primary.vue";
import Loader from "@/components/Loader/main-loader.vue";
import { useToast } from "vue-toast-notification";
import { mapActions } from "@/utilities/utilityStore";
import { STATUS_CODES } from "@/utilities/constants";
import { VERIFY_OTP_ENDPOINTS, DATA_TYPES, OTP_RESPONSES } from "./constants";

export default {
  name: "ValidateOtpModal",
  components: { DigitArray, DialogModal, Loader, Button },
  props: {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    payloadForOtpVerification: {
      type: [String, Object],
      required: true,
    },
  },
  setup({ payloadForOtpVerification }, { emit }) {
    const $http = inject("$http");
    const $toast = useToast();
    const otpArray = ref([]);
    const isLoading = ref(false);
    const countingDown = ref(true);
    const time = ref(60000);
    const isEnabled = ref(true);
    const placeHolders = ref(["0", "0", "0", "0", "0", "0"]);
    const errorMessage = ref("");

    const { "userRegAuth/resendotpToUser": resendVerificationCode } =
      mapActions();

    const resendOTP = async () => {
      errorMessage.value = "";
      otpArray.value = [];
      isLoading.value = true;

      let apiResponse;

      if (typeof payloadForOtpVerification === DATA_TYPES.STRING) {
        apiResponse = await resendVerificationCode({
          payload: { email: payloadForOtpVerification },
          apiEndpoint: VERIFY_OTP_ENDPOINTS.EMAIL,
        });
      } else {
        apiResponse = await resendVerificationCode({
          payload: { phone: `0${payloadForOtpVerification.phone}` },
          apiEndpoint: VERIFY_OTP_ENDPOINTS.SMS,
        });
      }

      const { response, error } = apiResponse;

      if (response) {
        $toast.success(OTP_RESPONSES.RESENT_OTP_SUCESS_MESSAGE);
        countingDown.value = true;
        time.value = 60000;
      }

      if (error) {
        errorMessage.value = error;
      }

      isLoading.value = false;
    };

    const onCountdownEnd = () => {
      countingDown.value = false;
    };

    const autoSubmitApp = async () => {
      let response;
      let payload;
      if (otpArray.value.length >= 6) {
        const code = otpArray.value.join("");
        try {
          isLoading.value = true;
          if (typeof payloadForOtpVerification === DATA_TYPES.STRING) {
            payload = {
              code,
              email: payloadForOtpVerification,
            };
            response = await $http.$_verifyEmailOtp(payload);
          } else {
            payload = {
              ...payloadForOtpVerification,
              code,
            };
            response = await $http.$_verifyPhoneNumberOtp(payload);
          }
          isLoading.value = false;
          const { statusCode } = response.data;
          if (statusCode === STATUS_CODES.SUCCESS) {
            if (typeof payloadForOtpVerification === DATA_TYPES.STRING) {
              $toast.success(OTP_RESPONSES.EMAIL_CHANGED_SUCCESS_MESSAGE);
            } else {
              $toast.success(OTP_RESPONSES.PHONE_CHANGED_SUCCESS_MESSAGE);
            }

            errorMessage.value = "";
            otpArray.value = [];
            countingDown.value = false;
            emit("handleReload");
          }
        } catch (error) {
          const {
            response: {
              data: { errorMessage: serverError },
            },
          } = error;
          errorMessage.value = serverError;
          isLoading.value = false;
        }
      }
    };

    const handleCloseModal = () => emit("handleCloseModal");

    return {
      otpArray,
      autoSubmitApp,
      isLoading,
      placeHolders,
      errorMessage,
      resendOTP,
      handleCloseModal,
      isEnabled,
      countingDown,
      onCountdownEnd,
      time,
    };
  },
};
</script>

<style scoped lang="scss">
.modal {
  &__body-content {
    @include flexItem(vertical) {
      align-items: center;
      gap: $size-24;
      padding: $size-24 $size-8 $size-32 $size-8;
      width: 500px;

      @include responsive(phone) {
        width: 100% !important;
      }
    }
  }
}
.footer-wrapper {
  margin-top: $size-26;
  width: 100%;
  @include flexItem(vertical) {
    justify-content: center;
    align-items: center;
    gap: $size-26;
  }
}

.description {
  margin: 20px 0;
  text-align: center;
}
.error-input {
  color: $color-denote-red;
  margin-left: $size-8;
  font-size: $size-16;
  text-align: center;
}

.counter {
  @include flexItem(vertical) {
    align-items: center;
    gap: $size-4;
  }

  width: 65%;
}

.timer {
  color: $color-pri;
  font-weight: $fw-semi-bold;
}

.bottom-space {
  height: 110px;
}
</style>
