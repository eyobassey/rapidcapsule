<template>
  <div class="form">
    <div class="form__header">
      <h3 class="fs-28 fw-semi-bold lh-125 align-center">
        Verify your identity
      </h3>
    </div>
    <div class="form__body">
      <p
        v-if="activeTwoFactorAuth.toLowerCase() === 'email'"
        class="fs-16 lh-150 fw-regular ls-2 align-center"
      >
        Please enter the 6-digit code sent to your email address.
      </p>
      <p
        v-else-if="activeTwoFactorAuth.toLowerCase() === 'sms'"
        class="fs-16 lh-150 fw-regular ls-2 align-center"
      >
        Please enter the 6-digit code sent to your phone number.
      </p>
      <p
        v-if="activeTwoFactorAuth.toLowerCase() === 'auth_apps'"
        class="fs-16 lh-150 fw-regular ls-2 align-center"
      >
        Please enter the 6-digit code from your authentication app.
      </p>
      <DigitArray
        v-model:input1="otp[0]"
        v-model:input2="otp[1]"
        v-model:input3="otp[2]"
        v-model:input4="otp[3]"
        v-model:input5="otp[4]"
        v-model:input6="otp[5]"
        :placeholder="placeHolders"
        @input="autoSubmit"
        :isdisabled="time === 0 || errormessage ? true : false"
      />
      <p v-if="errormessage" class="error-input">{{ errormessage }}</p>
      <div v-else-if="!errormessage" class="counter">
        <p v-if="time > 0" class="fs-16 lh-150 fw-regular ls-2 align-center">
          Code will expire in <span class="timer">{{ time + "s" }}</span>
        </p>
        <p v-else class="error-input fs-16 lh-150 fw-regular ls-2 align-center">
          Your OTP has expired.
        </p>
      </div>
      <Button
        v-show="activeTwoFactorAuth.toLowerCase() !== 'auth_apps'"
        label="Resend OTP"
        type="tertiary"
        size="medium"
        :disabled="time > 0 && !errormessage"
        :loading="passiveLoad"
        loaderColor="primary"
        @click="resendOTP"
      />
    </div>
    <Loader v-if="loading" :useOverlay="true" />
  </div>
</template>

<script>
import { mapActions, mapGetters, mapMutations } from "vuex";
import DigitArray from "../../inputs/digit-array.vue";
import Button from "../../buttons/button-primary.vue";
import Loader from "../../Loader/main-loader.vue";

export default {
  name: "OTP form",

  components: {
    DigitArray,
    Button,
    Loader,
  },

  data() {
    return {
      otp: [],
      placeHolders: ["0", "0", "0", "0", "0", "0"],
      time: 60,
      // loading: false,
      isEnabled: true,
    };
  },

  computed: {
    ...mapGetters({
      errorMessage: "userRegAuth/errorMessage",
      userEmail: "userRegAuth/email",
      activeTwoFactorAuth: "userRegAuth/activeTwoFA",
      status: "userRegAuth/loadingStatus",
      loading: "getLoadingState",
    }),

    passiveLoad() {
      return this.status;
    },

    errormessage() {
      if (!this.errorMessage["otp"]) {
        this.loading = false;
        this.otp = [];
        this.time = 60;
        return "";
      } else {
        this.loading = false;
        this.otp = [];
        return this.errorMessage["otp"];
      }
    },

    OTP() {
      return this.otp.join("");
    },
  },

  methods: {
    ...mapActions({
      loginVerification: "userRegAuth/loginverification",
      resendotp: "userRegAuth/resendotp",
    }),

    ...mapMutations(["SET_LOADING_STATE"]),

    async autoSubmit() {
      if (this.otp.length >= 6) {
        try {
          this.isEnabled = false;
          this.SET_LOADING_STATE(true);
          this.time = 60;
          await this.loginVerification({
            token: this.OTP,
            email: this.userEmail,
            auth_method: this.activeTwoFactorAuth,
          });
        } catch (error) {
          this.SET_LOADING_STATE(false);
        }
      }
    },

    resendOTP() {
      this.resendotp({ email: this.userEmail });
    },
  },

  watch: {
    time: {
      handler(value) {
        if (value > 0 && this.isEnabled == true) {
          setTimeout(() => {
            this.time--;
          }, 1000);
        }
      },
      immediate: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.form {
  position: relative;
  overflow: hidden;
  @include flexItem(vertical) {
    gap: $size-24;
  }
  padding: $size-32;
  min-height: 40rem;
  width: 90%;
  max-width: 37.8rem;
  background-color: $color-white;
  border-radius: $size-16;
  box-shadow: $size-24 $size-24 $size-56 rgba($color-black, 0.15),
    $size-12 $size-32 $size-72 rgba($color-black, 0.1);
  border: 1px solid $color-pri-t4;

  @include responsive(large-screen) {
    height: auto;
  }

  @include responsive(tab-landscape) {
    width: min(750px, 80%);
  }

  @include responsive(tab-portrait) {
    width: 100%;
  }

  @include responsive(phone) {
    width: max(300px, 95%);
    padding: $size-0;
    box-shadow: none;
    border-radius: $size-0;
    border: none;
    background-color: transparent;
    padding: $size-0;
  }

  &__header {
    padding-bottom: $size-16;
    text-align: center;
    border-bottom: $size-1 solid $color-g-90;

    & > p {
      color: $color-g-44;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: scroll;
    gap: $size-32;
    width: 100%;
    padding: 0 $size-8;

    .error-input {
      color: $color-denote-red;
      margin-left: $size-8;
      font-size: $size-16;
      text-align: center;
    }

    & > p {
      color: $color-g-21;
    }

    &::-webkit-scrollbar {
      display: none;
    }

    @include responsive(small-laptop) {
      padding-right: $size-12;

      &::-webkit-scrollbar {
        display: block;
        width: 4px;
        border-radius: 100vw;
      }

      &::-webkit-scrollbar-thumb {
        background-color: $color-g-90;
        border-radius: 100vw;
      }
    }

    @include responsive(tab-landscape) {
      padding-right: $size-8;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    @include responsive(phone) {
      padding: $size-8 0;
    }
  }
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
</style>
