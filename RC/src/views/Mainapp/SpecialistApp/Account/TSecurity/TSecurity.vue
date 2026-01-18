<template>
  <div class="container">
    <div class="list-container">
      <div class="list-item">
        <div class="text-group-row">
          <h3>********</h3>
          <p class="hint">Password</p>
        </div>
        <rc-button
          type="text-secondary"
          label="Reset Password"
          @click="resetPassword"
        />
      </div>
      <rc-accordian v-show="true">
        <template v-slot:head-content>
          <div class="text-group-row">
            <h3>Two-factor Authentication (2FA)</h3>
            <p v-if="usersettings.defaults.twoFA_auth" class="hint">
              <span>
                Active method: {{ usersettings.defaults.twoFA_medium }}</span
              >
            </p>
            <p v-else>Inactive</p>
          </div>
        </template>
        <template v-slot:body-content>
          <template v-for="(item, index) of _2FA_AuthMethods" :key="item">
            <div class="list-lvl2">
              <div class="left-pane">
                <p>{{ item.title }}</p>
                <span
                  @click="handleChangeAction(item.title)"
                  role="button"
                  class="text-secondary"
                  >{{ item.action ?? "" }}</span
                >
              </div>

              <div class="right-pane" @click="onSelected2FA(item, index)">
                <loader-alone v-if="item.isLoading" color="primary" />
                <rc-switch
                  class="switch"
                  :name="item.name"
                  :label="item.label"
                  v-model="item.isActive"
                />
              </div>
            </div>
          </template>
        </template>
      </rc-accordian>
    </div>
  </div>
  <!-- Modal to setup phone number as authentication method -->
  <dialog-modal
    v-if="isOpenVerifyPhone"
    title="Verify Phone Number"
    @closeModal="onClose"
    :has-footer="true"
  >
    <template v-slot:body>
      <div class="modal__body-content">
        <p class="align-center">
          Enter the 6-digit code sent to your phone number
        </p>
        <digit-array
          v-model:input1="otpPhone[0]"
          v-model:input2="otpPhone[1]"
          v-model:input3="otpPhone[2]"
          v-model:input4="otpPhone[3]"
          v-model:input5="otpPhone[4]"
          v-model:input6="otpPhone[5]"
          :placeholder="['0', '0', '0', '0', '0', '0']"
        />
      </div>
    </template>
    <template v-slot:foot>
      <rc-button
        label="Resend OTP"
        type="tertiary"
        size="medium"
        @click="sendVerificationCode(phoneNumber)"
      />
    </template>
    <template v-slot:loader>
      <Loader v-if="isLoading" :useOverlay="true" :rounded="true" />
    </template>
  </dialog-modal>

  <!-- Modal to setup authentication app as authentication method -->
  <dialog-modal
    v-show="isOpenVerifyApp"
    title="Activate Auth App"
    @closeModal="onClose"
    :has-footer="true"
  >
    <template v-slot:body>
      <div v-if="!activeQR" class="modal__body-content">
        <p class="align-center">
          Scan the QR code with your auth app and click the button below
        </p>
        <img :src="QRCode?.data ?? ''" alt="QR code image" />
      </div>
      <div v-if="activeQR" class="modal__body-content">
        <p class="align-center">
          Enter the active 6-digit code from your auth app
        </p>

        <digit-array
          v-model:input1="otpApp[0]"
          v-model:input2="otpApp[1]"
          v-model:input3="otpApp[2]"
          v-model:input4="otpApp[3]"
          v-model:input5="otpApp[4]"
          v-model:input6="otpApp[5]"
          :placeholder="['0', '0', '0', '0', '0', '0']"
        />
      </div>
    </template>
    <template v-slot:foot>
      <rc-button
        label="Authorize App"
        type="tertiary"
        size="medium"
        @click="activeQR = true"
      />
    </template>
    <template v-slot:loader>
      <Loader v-if="isLoading" :useOverlay="true" :rounded="true" />
    </template>
  </dialog-modal>

  <!-- Dialog for changing Email -->
  <ChangeEmailModal
    v-if="isChangingEmail"
    @closeChangeEmailDialog="isChangingEmail = false"
    @hasSentOtp="handleDisplayOtpDialog"
  />

  <!-- Dialog for changing phone number -->
  <ChangePhoneModal
    v-if="isChangingPhoneNumber"
    @closeChangePhoneDialog="isChangingPhoneNumber = false"
    @hasSentOtp="handleDisplayOtpDialog"
  />

  <!-- Dialog for validating otp -->
  <ValidateOtpModal
    v-if="hasSentOtp"
    :title="otpVerificationModalTitle"
    :description="otpVerificationModalDescription"
    :payloadForOtpVerification="payloadForOtpVerification"
    @handleCloseModal="hasSentOtp = false"
    @handleReload="handleFetchUser"
  />

  <Toast v-if="toastMessage" :message="toastMessage" />
</template>

<script>
import { useToast } from "vue-toast-notification";
import { defineComponent, ref, watchEffect, reactive } from "vue";
import RcAvatar from "@/components/Avatars/avatar-fixed";
import RcButtonIcon from "@/components/buttons/button-icon";
import RcButton from "@/components/buttons/button-primary";
import RcAccordian from "@/components/Lists/accordian";
import LoaderAlone from "@/components/Loader/loader-standalone";
import Loader from "@/components/Loader/main-loader";
import RcSwitch from "@/components/inputs/switch";
import DialogModal from "@/components/modals/dialog-modal";
import ChangeEmailModal from "@/components/Account/ChangeEmailModal.vue";
import ChangePhoneModal from "@/components/Account/ChangePhoneModal.vue";
import DigitArray from "@/components/inputs/digit-array";
import Toast from "@/components/alerts/toasts";
import ValidateOtpModal from "@/components/Account/ValidateOtpModal.vue";
import {
  TWO_FAS,
  SECURITY_UPDATE_OPTIONS,
  OTP_VERIFICATION_CONTENT,
} from "@/utilities/constants";

import { mapGetters, mapActions } from "@/utilities/utilityStore";

export default defineComponent({
  setup() {
    const $toast = useToast();

    const otpPhone = ref([]);
    const otpApp = ref([]);
    const isLoading = ref(false);
    const isFetching = ref(false);
    const isOpenVerifyPhone = ref(false);
    const isOpenVerifyApp = ref(false);
    const activeQR = ref(false);
    const isChangingEmail = ref(false);
    const isChangingPhoneNumber = ref(false);
    const toastMessage = ref();
    const hasSentOtp = ref(false);
    const otpVerificationModalTitle = ref("");
    const otpVerificationModalDescription = ref("");
    const payloadForOtpVerification = ref("");

    const {
      userprofile,
      usersettings,
      "userAccountSettings/qrCode": QRCode,
    } = mapGetters();

    const {
      "userAccountSettings/updatetwofactorauth": updateTwoFAuth,
      "userAccountSettings/getPhoneVerCode": sendVerificationCode,
      "userAccountSettings/verifynumber": verifyPhoneNumber,
      "userAccountSettings/getSecreteCode": sendSecretAppECode,
      "userAccountSettings/activateApp": activateApp,
      authenticate: reloadUserInfo,
    } = mapActions();

    const phoneNumber = ref(
      `0${userprofile.value.profile.contact.phone.number}`
    );
    const _2FA_AuthMethods = ref(TWO_FAS);

    watchEffect(() => {
      if (usersettings.value.defaults?.twoFA_auth) {
        if (usersettings.value.defaults?.twoFA_medium === "EMAIL") {
          _2FA_AuthMethods.value.map((i) => ({ ...i, isActive: false }));
          _2FA_AuthMethods.value[0]["isActive"] = true;
        } else if (usersettings.value.defaults?.twoFA_medium === "SMS") {
          _2FA_AuthMethods.value.map((i) => ({ ...i, isActive: false }));
          _2FA_AuthMethods.value[1]["isActive"] = true;
        } else if (usersettings.value.defaults?.twoFA_medium === "AUTH_APPS") {
          _2FA_AuthMethods.value.map((i) => ({ ...i, isActive: false }));
          _2FA_AuthMethods.value[2]["isActive"] = true;
        }
      }
    });

    watchEffect(async () => {
      if (otpPhone.value.length >= 6) {
        isFetching.value = true;
        await verifyPhoneNumber({
          code: otpPhone.value.join(""),
          phone: phoneNumber.value,
        });
        onClose();
      }
      if (otpApp.value.length >= 6) {
        isFetching.value = true;
        await activateApp({ code: otpApp.value.join("") });
        onClose();
      }
    });

    const onClose = () => {
      isFetching.value = false;
      isLoading.value = false;
      isOpenVerifyPhone.value = false;
      isOpenVerifyApp.value = false;
      otpPhone.value = [];
      otpApp.value = [];
      activeQR.value = false;
    };

    const resetPassword = () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location = "/reset-password/request-link";
    };

    const onSelected2FA = async (item, i) => {
      if (item.name === "email") {
        _2FA_AuthMethods.value[i].isLoading = true;
        await updateTwoFAuth("EMAIL").then(() => {
          _2FA_AuthMethods.value.map((i) => ({ ...i, isActive: false }));
          _2FA_AuthMethods.value[i].isLoading = false;
          _2FA_AuthMethods.value[i].isActive = true;
          $toast.success("Email 2FA has been set successfully!");
        });
      }

      if (item.name === "sms" && !userprofile.is_phone_verified) {
        _2FA_AuthMethods.value[i].isLoading = true;
        isOpenVerifyPhone.value = true;
        await sendVerificationCode(phoneNumber.value);
        _2FA_AuthMethods.value[i].isLoading = false;
      } else if (item.name === "sms" && userprofile.is_phone_verified) {
        _2FA_AuthMethods.value[i].isLoading = true;
        updateTwoFAuth("SMS").then(() => {
          _2FA_AuthMethods.value.map((i) => ({ ...i, isActive: false }));
          _2FA_AuthMethods.value[i].isLoading = false;
          _2FA_AuthMethods.value[i].isActive = true;
          $toast.success("Phone 2FA has been set successfully!");
        });
      }

      if (item.name === "auth_apps" && !userprofile.is_auth_app_enabled) {
        _2FA_AuthMethods.value[i].isLoading = true;
        isOpenVerifyApp.value = true;
        const localToken = localStorage.getItem("token");
        const sessionToken = sessionStorage.getItem("token");
        await sendSecretAppECode(localToken ?? sessionToken);
        _2FA_AuthMethods.value[i].isLoading = false;
      } else if (item.name === "auth_apps" && userprofile.is_auth_app_enabled) {
        _2FA_AuthMethods.value[i].isLoading = true;
        updateTwoFAuth("AUTH_APPS").then(() => {
          _2FA_AuthMethods.value.map((i) => ({ ...i, isActive: false }));
          _2FA_AuthMethods.value[i].isLoading = false;
          _2FA_AuthMethods.value[i].isActive = true;
          $toast.success("App 2FA has been set successfully!");
        });
      }
    };

    const handleChangeAction = (title) => {
      if (title === SECURITY_UPDATE_OPTIONS.EMAIL) {
        isChangingEmail.value = true;
      } else if (title === SECURITY_UPDATE_OPTIONS.SMS) {
        isChangingPhoneNumber.value = true;
      }
    };

    const handleDisplayOtpDialog = ({ type, payload }) => {
      isChangingEmail.value = false;
      isChangingPhoneNumber.value = false;
      hasSentOtp.value = true;
      payloadForOtpVerification.value = payload;
      otpVerificationModalTitle.value = OTP_VERIFICATION_CONTENT[type].title;
      otpVerificationModalDescription.value =
        OTP_VERIFICATION_CONTENT[type].description;
    };

    const handleFetchUser = async () => {
      hasSentOtp.value = false;
      payloadForOtpVerification.value = "";
      otpVerificationModalTitle.value = "";
      otpVerificationModalDescription.value = "";
      await reloadUserInfo();
    };

    return {
      userprofile,
      usersettings,
      _2FA_AuthMethods,
      otpPhone,
      otpApp,
      toastMessage,

      isFetching,
      isLoading,
      isOpenVerifyPhone,
      isOpenVerifyApp,
      activeQR,
      QRCode,
      isChangingEmail,
      isChangingPhoneNumber,
      hasSentOtp,
      otpVerificationModalTitle,
      otpVerificationModalDescription,
      payloadForOtpVerification,
      handleFetchUser,

      resetPassword,
      onSelected2FA,
      sendVerificationCode,
      onClose,
      handleChangeAction,
      handleDisplayOtpDialog,
    };
  },
  components: {
    RcAvatar,
    RcButtonIcon,
    RcButton,
    RcAccordian,
    LoaderAlone,
    RcSwitch,
    Loader,
    DialogModal,
    DigitArray,
    Toast,
    ChangeEmailModal,
    ChangePhoneModal,
    ValidateOtpModal,
  },
});
</script>

<style scoped lang="scss">
.container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: $size-32;
}
.list-container {
  @include flexItem(vertical);
  width: 100%;
}

.list-item {
  @include flexItem(horizontal) {
    align-items: center;
    gap: $size-32;
    padding: $size-24;
    border-bottom: $size-1 solid $color-g-90;
  }

  @include responsive(phone) {
    padding-inline: $size-10;
  }
}
.text-group-row {
  @include flexItem(vertical) {
    gap: $size-8;
    flex-grow: 1;
  }
}
.hint {
  font-size: $size-16;
  font-weight: $fw-regular;
  color: $color-g-44;
}
.list-lvl2 {
  @include flexItem(horizontal) {
    justify-content: space-between;
    align-items: center;
    gap: $size-16;
    padding: $size-16 $size-16;
    border-bottom: $size-1 solid $color-g-85;
    p {
      font-size: $size-16;
      color: $color-g-44;
      font-weight: $fw-regular;
    }
    .right-pane {
      @include flexItem(horizontal) {
        justify-content: flex-end;
        align-items: center;
      }
    }
    .left-pane {
      @include flexItem(horizontal) {
        gap: $size-10;
        align-items: center;

        span {
          font-size: 12px;
          color: $color-sec-s1;
          cursor: pointer;
        }
      }
    }
  }
}
</style>
<style scoped lang="scss">
.modal {
  &__body-content {
    @include flexItem(vertical) {
      align-items: center;
      gap: $size-24;
      padding: $size-24 $size-8 $size-32 $size-8;
      width: 600px;

      @include responsive(phone) {
        width: 100% !important;
      }

      p {
        font-size: $size-16;
        font-weight: $fw-regular;
        color: $color-g-44;
      }
    }
  }

  &__content {
    @include flexItem(vertical) {
      gap: $size-32;
      align-items: center;
      width: 100%;
    }

    .caution {
      @include flexItem(horizontal) {
        gap: $size-32;
        width: 95%;
      }

      .text {
        text-align: left;
        font-size: $size-18;
        font-weight: $fw-regular;
        color: $color-g-21;
        line-height: 1.5;
        letter-spacing: 0.02em;
        padding-top: $size-8;
      }
    }

    &.special {
      gap: $size-48;
    }
    .body__inputs {
      @include flexItem(vertical) {
        gap: $size-16;
        width: 100%;
      }
    }

    .section__top {
      @include flexItem(vertical) {
        align-items: center;
        gap: $size-14;

        .message-box {
          @include flexItem(horizontal) {
            align-items: center;
            justify-content: center;
            background-color: $color-pri-t5;
            padding: $size-10 $size-16;
            border-radius: $size-18;

            .message {
              font-size: $size-14;
              font-weight: $fw-regular;
              text-align: center;
              color: $color-pri-s1;
              line-height: 1.25;
            }
          }
        }
      }
    }

    .section__plans {
      @include flexItem(horizontal) {
        justify-content: center;
        gap: $size-24;

        @include responsive(tab-portrait) {
          width: 100%;
          overflow-x: auto;
          justify-content: flex-start;

          @include scrollBar(none);
        }
      }
    }
  }
  .button {
    @include responsive(phone) {
      width: 100%;
    }
  }
}
:deep(.modal__footer) {
  display: flex;
  justify-content: center;
}
</style>
