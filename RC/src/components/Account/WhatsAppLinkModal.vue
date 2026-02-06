<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="handleClose">
      <div class="modal-container">
        <!-- Close Button -->
        <button class="close-btn" @click="handleClose">
          <v-icon name="hi-x" scale="1" />
        </button>

        <!-- Step Indicator -->
        <div class="step-indicator">
          <div :class="['step-dot', { active: step >= 1, completed: step > 1 }]">
            <v-icon v-if="step > 1" name="hi-check" scale="0.6" />
            <span v-else>1</span>
          </div>
          <div class="step-line" :class="{ active: step > 1 }"></div>
          <div :class="['step-dot', { active: step >= 2 }]">
            <span>2</span>
          </div>
        </div>

        <!-- Step 1: Enter WhatsApp Number -->
        <div v-if="step === 1" class="modal-step">
          <div class="step-header">
            <div class="whatsapp-icon-large">
              <v-icon name="co-whatsapp" scale="2" />
            </div>
            <h2 class="step-title">Link Your WhatsApp</h2>
            <p class="step-description">
              Connect your WhatsApp to submit prescriptions via photo and chat with pharmacists.
            </p>
          </div>

          <div class="form-section">
            <label class="input-label">WhatsApp Number</label>
            <div class="phone-input-wrapper">
              <div class="country-select">
                <select v-model="linkPayload.country_code" class="country-dropdown">
                  <option value="+234">+234</option>
                  <option value="+1">+1</option>
                  <option value="+44">+44</option>
                  <option value="+91">+91</option>
                  <option value="+27">+27</option>
                  <option value="+233">+233</option>
                  <option value="+254">+254</option>
                </select>
              </div>
              <input
                type="tel"
                v-model="linkPayload.phone"
                class="phone-input"
                placeholder="8012345678"
                maxlength="11"
                @keypress="onlyNumbers"
              />
            </div>
          </div>

          <div class="benefits-card">
            <h4 class="benefits-title">
              <v-icon name="hi-sparkles" scale="0.8" />
              What you'll get
            </h4>
            <div class="benefits-grid">
              <div class="benefit-item">
                <div class="benefit-icon">
                  <v-icon name="hi-photograph" scale="0.9" />
                </div>
                <span>Photo Prescriptions</span>
              </div>
              <div class="benefit-item">
                <div class="benefit-icon">
                  <v-icon name="hi-bell" scale="0.9" />
                </div>
                <span>Order Updates</span>
              </div>
              <div class="benefit-item">
                <div class="benefit-icon">
                  <v-icon name="hi-chat-alt-2" scale="0.9" />
                </div>
                <span>Pharmacist Chat</span>
              </div>
              <div class="benefit-item">
                <div class="benefit-icon">
                  <v-icon name="hi-clock" scale="0.9" />
                </div>
                <span>Med Reminders</span>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="hasError" class="error-banner">
            <v-icon name="hi-exclamation-circle" scale="0.9" />
            <span>{{ errorMessage }}</span>
          </div>

          <button
            class="btn-primary"
            @click="initiateLink"
            :disabled="!isPhoneValid || isLoading"
          >
            <span v-if="isLoading" class="btn-loading">
              <div class="spinner"></div>
              Sending...
            </span>
            <span v-else>
              <v-icon name="hi-paper-airplane" scale="0.9" />
              Send Verification Code
            </span>
          </button>
        </div>

        <!-- Step 2: Verify OTP -->
        <div v-if="step === 2" class="modal-step">
          <div class="step-header">
            <div class="whatsapp-icon-large success">
              <v-icon name="hi-shield-check" scale="2" />
            </div>
            <h2 class="step-title">Verify Your Number</h2>
            <p class="step-description">
              Enter the 6-digit code sent to
              <strong>{{ formattedNumber }}</strong>
            </p>
          </div>

          <div class="otp-section">
            <div class="otp-inputs">
              <input
                v-for="(digit, index) in 6"
                :key="index"
                type="text"
                maxlength="1"
                class="otp-input"
                :ref="el => otpInputs[index] = el"
                v-model="otpDigits[index]"
                @input="handleOtpInput(index, $event)"
                @keydown="handleOtpKeydown(index, $event)"
                @paste="handleOtpPaste($event)"
                inputmode="numeric"
              />
            </div>

            <div class="resend-row">
              <span class="resend-text">Didn't receive code?</span>
              <button
                class="resend-btn"
                @click="resendCode"
                :disabled="resendDisabled || isLoading"
              >
                <span v-if="resendDisabled">Resend in {{ resendTimer }}s</span>
                <span v-else>Resend Code</span>
              </button>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="hasError" class="error-banner">
            <v-icon name="hi-exclamation-circle" scale="0.9" />
            <span>{{ errorMessage }}</span>
          </div>

          <div class="btn-row">
            <button class="btn-secondary" @click="goBack" :disabled="isLoading">
              <v-icon name="hi-arrow-left" scale="0.8" />
              Back
            </button>
            <button
              class="btn-primary"
              @click="verifyOtp"
              :disabled="otpDigits.filter(d => d).length < 6 || isLoading"
            >
              <span v-if="isLoading" class="btn-loading">
                <div class="spinner"></div>
                Verifying...
              </span>
              <span v-else>
                <v-icon name="hi-check" scale="0.9" />
                Verify
              </span>
            </button>
          </div>
        </div>

        <!-- Success Animation (brief) -->
        <div v-if="step === 3" class="modal-step success-step">
          <div class="success-animation">
            <div class="success-circle">
              <v-icon name="hi-check" scale="2.5" />
            </div>
          </div>
          <h2 class="step-title">WhatsApp Linked!</h2>
          <p class="step-description">
            You can now submit prescriptions and chat with pharmacists via WhatsApp.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useStore } from "vuex";
import { useToast } from "vue-toast-notification";

export default {
  name: "WhatsAppLinkModal",
  emits: ["close", "linked"],

  setup(_, { emit }) {
    const store = useStore();
    const $toast = useToast();

    const step = ref(1);
    const linkPayload = reactive({
      phone: "",
      country_code: "+234",
    });
    const otpDigits = ref(['', '', '', '', '', '']);
    const otpInputs = ref([]);
    const isLoading = ref(false);
    const errorMessage = ref("");
    const hasError = ref(false);
    const resendDisabled = ref(false);
    const resendTimer = ref(60);
    let timerInterval = null;

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
      otpDigits.value = ['', '', '', '', '', ''];
      hasError.value = false;
      errorMessage.value = "";
    };

    const onlyNumbers = (event) => {
      const charCode = event.which ? event.which : event.keyCode;
      if (charCode < 48 || charCode > 57) {
        event.preventDefault();
      }
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
        nextTick(() => {
          if (otpInputs.value[0]) {
            otpInputs.value[0].focus();
          }
        });
        $toast.success(result.message || "Verification code sent to WhatsApp");
      } else {
        hasError.value = true;
        errorMessage.value = result.message;
      }
    };

    const handleOtpInput = (index, event) => {
      const value = event.target.value;

      // Only allow numbers
      if (!/^\d*$/.test(value)) {
        otpDigits.value[index] = '';
        return;
      }

      // Move to next input
      if (value && index < 5) {
        nextTick(() => {
          otpInputs.value[index + 1]?.focus();
        });
      }

      // Auto-verify when all digits entered
      if (index === 5 && value) {
        nextTick(() => {
          if (otpDigits.value.filter(d => d).length === 6) {
            verifyOtp();
          }
        });
      }
    };

    const handleOtpKeydown = (index, event) => {
      // Handle backspace
      if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
        nextTick(() => {
          otpInputs.value[index - 1]?.focus();
        });
      }
    };

    const handleOtpPaste = (event) => {
      event.preventDefault();
      const pastedData = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

      for (let i = 0; i < pastedData.length; i++) {
        otpDigits.value[i] = pastedData[i];
      }

      // Focus last filled input or next empty
      const lastIndex = Math.min(pastedData.length, 5);
      nextTick(() => {
        otpInputs.value[lastIndex]?.focus();
        if (pastedData.length === 6) {
          verifyOtp();
        }
      });
    };

    const verifyOtp = async () => {
      const otp = otpDigits.value.join("");
      if (otp.length < 6) return;

      isLoading.value = true;
      hasError.value = false;

      const result = await store.dispatch("whatsapp/verifyOtp", otp);

      isLoading.value = false;

      if (result.success) {
        step.value = 3;
        setTimeout(() => {
          $toast.success("WhatsApp linked successfully!");
          emit("linked");
          emit("close");
        }, 1500);
      } else {
        hasError.value = true;
        errorMessage.value = result.message;
        otpDigits.value = ['', '', '', '', '', ''];
        nextTick(() => {
          otpInputs.value[0]?.focus();
        });
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
      otpInputs,
      isLoading,
      errorMessage,
      hasError,
      resendDisabled,
      resendTimer,
      formattedNumber,
      isPhoneValid,
      handleClose,
      goBack,
      onlyNumbers,
      initiateLink,
      handleOtpInput,
      handleOtpKeydown,
      handleOtpPaste,
      verifyOtp,
      resendCode,
    };
  },
};
</script>

<style scoped lang="scss">
// Design Tokens
$whatsapp: #25D366;
$whatsapp-dark: #128C7E;
$whatsapp-light: #DCF8C6;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$rose: #F43F5E;
$rose-light: #FFE4E6;

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
  animation: fadeIn 0.2s ease;

  @media (max-width: 480px) {
    padding: 0;
    align-items: flex-end;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 440px;
  padding: 32px 32px 36px;
  position: relative;
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(0, 0, 0, 0.05);
  animation: slideUp 0.3s ease;
  max-height: 90vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  @media (max-width: 480px) {
    padding: 24px 20px 28px;
    border-radius: 24px 24px 0 0;
    margin: 0;
    max-height: 92vh;
    animation: slideUpMobile 0.3s ease;
  }
}

@keyframes slideUpMobile {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: $bg;
  color: $gray;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #E2E8F0;
    color: $slate;
  }
}

// Step Indicator
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  margin-bottom: 24px;
}

.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #E2E8F0;
  color: $gray;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s;

  &.active {
    background: $whatsapp;
    color: white;
  }

  &.completed {
    background: $whatsapp;
    color: white;
  }
}

.step-line {
  width: 60px;
  height: 3px;
  background: #E2E8F0;
  transition: all 0.3s;

  &.active {
    background: $whatsapp;
  }
}

// Modal Step Content
.modal-step {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step-header {
  text-align: center;
}

.whatsapp-icon-large {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, $whatsapp 0%, $whatsapp-dark 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto 16px;
  box-shadow: 0 8px 24px rgba($whatsapp, 0.3);

  &.success {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  }
}

.step-title {
  font-size: 22px;
  font-weight: 700;
  color: $navy;
  margin: 0 0 8px;
}

.step-description {
  font-size: 14px;
  color: $gray;
  line-height: 1.5;
  margin: 0;

  strong {
    color: $navy;
    font-weight: 600;
  }
}

// Form Section
.form-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 13px;
  font-weight: 600;
  color: $slate;
}

.phone-input-wrapper {
  display: flex;
  gap: 8px;
}

.country-select {
  position: relative;
}

.country-dropdown {
  height: 48px;
  padding: 0 12px;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  font-weight: 500;
  color: $navy;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  padding-right: 28px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;

  &:focus {
    outline: none;
    border-color: $whatsapp;
    box-shadow: 0 0 0 3px rgba($whatsapp, 0.1);
  }
}

.phone-input {
  flex: 1;
  height: 48px;
  padding: 0 16px;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  font-size: 16px;
  color: $navy;
  transition: all 0.2s;

  &::placeholder {
    color: $light-gray;
  }

  &:focus {
    outline: none;
    border-color: $whatsapp;
    box-shadow: 0 0 0 3px rgba($whatsapp, 0.1);
  }
}

// Benefits Card
.benefits-card {
  background: $whatsapp-light;
  border-radius: 16px;
  padding: 16px;
}

.benefits-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: $whatsapp-dark;
  margin: 0 0 12px;
}

.benefits-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: $slate;
  font-weight: 500;
}

.benefit-icon {
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $whatsapp-dark;
  flex-shrink: 0;
}

// OTP Section
.otp-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.otp-inputs {
  display: flex;
  gap: 8px;

  @media (max-width: 400px) {
    gap: 6px;
  }
}

.otp-input {
  width: 48px;
  height: 56px;
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  color: $navy;
  transition: all 0.2s;

  @media (max-width: 400px) {
    width: 42px;
    height: 50px;
    font-size: 20px;
  }

  &:focus {
    outline: none;
    border-color: $whatsapp;
    box-shadow: 0 0 0 3px rgba($whatsapp, 0.1);
  }

  &:not(:placeholder-shown) {
    border-color: $whatsapp;
    background: $whatsapp-light;
  }
}

.resend-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resend-text {
  font-size: 13px;
  color: $gray;
}

.resend-btn {
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 600;
  color: $whatsapp-dark;
  cursor: pointer;
  padding: 0;

  &:hover:not(:disabled) {
    color: $whatsapp;
    text-decoration: underline;
  }

  &:disabled {
    color: $light-gray;
    cursor: not-allowed;
  }
}

// Error Banner
.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: $rose-light;
  border-radius: 12px;
  color: $rose;
  font-size: 13px;
  font-weight: 500;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}

// Buttons
.btn-row {
  display: flex;
  gap: 12px;
}

.btn-primary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  padding: 0 24px;
  background: linear-gradient(135deg, $whatsapp 0%, $whatsapp-dark 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba($whatsapp, 0.35);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

.btn-secondary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px;
  padding: 0 20px;
  background: $bg;
  color: $slate;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #E2E8F0;
    border-color: #CBD5E1;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-loading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Success Step
.success-step {
  text-align: center;
  padding: 20px 0;
}

.success-animation {
  margin-bottom: 20px;
}

.success-circle {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto;
  animation: successPop 0.5s ease;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

@keyframes successPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
