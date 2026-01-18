<template>
  <DialogModal :title="title" @closeModal="handleClose" :hasFooter="true">
    <template v-slot:body>
      <!-- Step 1: Enter WhatsApp Number -->
      <div v-if="step === 1" class="modal-content">
        <div class="whatsapp-info">
          <div class="whatsapp-icon">
            <img src="@/assets/icons/whatsapp.svg" alt="WhatsApp" class="icon" />
          </div>
          <p class="description">
            Link your WhatsApp number to receive prescription notifications,
            order updates, and chat with our pharmacists directly.
          </p>
        </div>

        <div class="input__group">
          <PhoneInput
            v-model:phone-number="linkPayload.phone"
            v-model="linkPayload.country_code"
            top-label="WhatsApp Number"
          />
        </div>

        <div class="benefits">
          <h4 class="benefits-title">Benefits of linking WhatsApp:</h4>
          <ul class="benefits-list">
            <li>Submit prescriptions via photo</li>
            <li>Get real-time order updates</li>
            <li>Chat with pharmacists for advice</li>
            <li>Receive medication reminders</li>
          </ul>
        </div>
      </div>

      <!-- Step 2: Verify OTP -->
      <div v-if="step === 2" class="modal-content">
        <div class="otp-info">
          <p class="description">
            We've sent a 6-digit verification code to your WhatsApp number
            <strong>{{ formattedNumber }}</strong>
          </p>
        </div>

        <div class="otp-input-container">
          <DigitArray
            v-model:input1="otpDigits[0]"
            v-model:input2="otpDigits[1]"
            v-model:input3="otpDigits[2]"
            v-model:input4="otpDigits[3]"
            v-model:input5="otpDigits[4]"
            v-model:input6="otpDigits[5]"
            :placeholder="['0', '0', '0', '0', '0', '0']"
            @input="checkOtpComplete"
          />
        </div>

        <div class="resend-section">
          <Button
            type="tertiary"
            label="Resend Code"
            size="small"
            :disabled="resendDisabled"
            @click="resendCode"
          />
          <span v-if="resendDisabled" class="resend-timer">
            {{ resendTimer }}s
          </span>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="hasError" class="errorWrapper">
        <p class="errorText">{{ errorMessage }}</p>
      </div>
    </template>

    <template v-slot:foot>
      <Button
        v-if="step === 1"
        type="primary"
        label="Send Verification Code"
        size="medium"
        class="button"
        @click="initiateLink"
        :disabled="!isPhoneValid"
      />
      <Button
        v-if="step === 2"
        type="tertiary"
        label="Back"
        size="medium"
        class="button"
        @click="goBack"
      />
      <Button
        v-if="step === 2"
        type="primary"
        label="Verify"
        size="medium"
        class="button"
        @click="verifyOtp"
        :disabled="otpDigits.join('').length < 6"
      />
    </template>

    <template v-slot:loader>
      <Loader v-if="isLoading" :useOverlay="true" :rounded="true" />
    </template>
  </DialogModal>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useStore } from "vuex";
import { useToast } from "vue-toast-notification";
import DialogModal from "@/components/modals/dialog-modal.vue";
import Button from "@/components/buttons/button-primary.vue";
import PhoneInput from "@/components/inputs/phone-number.vue";
import DigitArray from "@/components/inputs/digit-array.vue";
import Loader from "@/components/Loader/main-loader.vue";

export default {
  name: "WhatsAppLinkModal",
  components: { DialogModal, Button, PhoneInput, DigitArray, Loader },

  emits: ["close", "linked"],

  setup(_, { emit }) {
    const store = useStore();
    const $toast = useToast();

    const step = ref(1);
    const linkPayload = reactive({
      phone: "",
      country_code: "+234",
    });
    const otpDigits = ref([]);
    const isLoading = ref(false);
    const errorMessage = ref("");
    const hasError = ref(false);
    const resendDisabled = ref(false);
    const resendTimer = ref(60);
    let timerInterval = null;

    const title = computed(() => {
      return step.value === 1 ? "Link WhatsApp" : "Verify WhatsApp";
    });

    const formattedNumber = computed(() => {
      return `${linkPayload.country_code} ${linkPayload.phone}`;
    });

    const isPhoneValid = computed(() => {
      return linkPayload.phone && linkPayload.phone.length >= 10;
    });

    const handleClose = () => {
      store.dispatch("whatsapp/cancelLinking");
      emit("close");
    };

    const goBack = () => {
      step.value = 1;
      otpDigits.value = [];
      hasError.value = false;
      errorMessage.value = "";
    };

    const formatPhoneNumber = () => {
      let phone = linkPayload.phone.replace(/[-\s]/g, "");
      if (phone.startsWith("0")) {
        phone = phone.substring(1);
      }
      return `${linkPayload.country_code}${phone}`;
    };

    const startResendTimer = () => {
      resendDisabled.value = true;
      resendTimer.value = 60;
      timerInterval = setInterval(() => {
        resendTimer.value--;
        if (resendTimer.value <= 0) {
          clearInterval(timerInterval);
          resendDisabled.value = false;
        }
      }, 1000);
    };

    const initiateLink = async () => {
      isLoading.value = true;
      hasError.value = false;

      const whatsappNumber = formatPhoneNumber();
      const result = await store.dispatch("whatsapp/linkNumber", whatsappNumber);

      isLoading.value = false;

      if (result.success) {
        step.value = 2;
        startResendTimer();
        $toast.success(result.message || "Verification code sent to WhatsApp");
      } else {
        hasError.value = true;
        errorMessage.value = result.message;
      }
    };

    const checkOtpComplete = () => {
      if (otpDigits.value.join("").length === 6) {
        verifyOtp();
      }
    };

    const verifyOtp = async () => {
      const otp = otpDigits.value.join("");
      if (otp.length < 6) return;

      isLoading.value = true;
      hasError.value = false;

      const result = await store.dispatch("whatsapp/verifyOtp", otp);

      isLoading.value = false;

      if (result.success) {
        $toast.success("WhatsApp linked successfully!");
        emit("linked");
        emit("close");
      } else {
        hasError.value = true;
        errorMessage.value = result.message;
        otpDigits.value = [];
      }
    };

    const resendCode = async () => {
      isLoading.value = true;
      hasError.value = false;

      const whatsappNumber = formatPhoneNumber();
      const result = await store.dispatch("whatsapp/linkNumber", whatsappNumber);

      isLoading.value = false;

      if (result.success) {
        startResendTimer();
        $toast.success("Verification code resent");
      } else {
        hasError.value = true;
        errorMessage.value = result.message;
      }
    };

    onUnmounted(() => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    });

    return {
      step,
      linkPayload,
      otpDigits,
      isLoading,
      errorMessage,
      hasError,
      resendDisabled,
      resendTimer,
      title,
      formattedNumber,
      isPhoneValid,
      handleClose,
      goBack,
      initiateLink,
      checkOtpComplete,
      verifyOtp,
      resendCode,
    };
  },
};
</script>

<style scoped lang="scss">
.modal-content {
  display: flex;
  flex-direction: column;
  gap: $size-24;
  min-width: 400px;

  @include responsive(phone) {
    min-width: auto;
  }
}

.whatsapp-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: $size-16;

  .whatsapp-icon {
    width: 64px;
    height: 64px;
    background-color: #25D366;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    .icon {
      width: 36px;
      height: 36px;
      filter: brightness(0) invert(1);
    }
  }

  .description {
    font-size: $size-16;
    color: $color-g-44;
    line-height: 1.5;
  }
}

.benefits {
  background-color: $color-pri-t5;
  padding: $size-16;
  border-radius: $size-8;

  .benefits-title {
    font-size: $size-14;
    font-weight: $fw-semi-bold;
    color: $color-pri-s1;
    margin-bottom: $size-12;
  }

  .benefits-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      font-size: $size-14;
      color: $color-g-44;
      padding: $size-4 0;
      padding-left: $size-20;
      position: relative;

      &::before {
        content: "\2713";
        position: absolute;
        left: 0;
        color: $color-pri-s1;
        font-weight: bold;
      }
    }
  }
}

.otp-info {
  text-align: center;

  .description {
    font-size: $size-16;
    color: $color-g-44;
    line-height: 1.5;

    strong {
      color: $color-g-21;
    }
  }
}

.otp-input-container {
  display: flex;
  justify-content: center;
  padding: $size-16 0;
}

.resend-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $size-8;

  .resend-timer {
    font-size: $size-14;
    color: $color-g-67;
  }
}

.errorWrapper {
  margin-top: $size-16;
  padding: $size-12;
  background-color: rgba($color-ter-error, 0.1);
  border-radius: $size-8;

  .errorText {
    color: $color-ter-error;
    font-size: $size-14;
    text-align: center;
  }
}

.button {
  @include responsive(phone) {
    width: 100%;
  }
}
</style>
