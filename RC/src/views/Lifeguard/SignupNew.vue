<template>
    <LifeguardNav/>
  <div class="wrapper bgd-image">
    <div class="container">
      <div class="container__left">
        <Illustrations name="support" class="illustration" />
        <div class="text-content">
          <h2 class="heading">
            Thank you for choosing to become a <span>LifeGuard&#174;</span>
          </h2>
          <p class="copy">
            Make a donation to provide medical care for those who cannot afford
            it
          </p>
        </div>
      </div>
      <section
        class="container__right"
        v-if="!hasSeenCongrats"
        v-show="step === 1"
      >
        <div>
          <form
            @click.prevent="next"
            class="form form__container card-shadow card-outline"
          >
            <div class="form__header">
              <h3 class="fs-28 fw-semi-bold lh-125">Create Account</h3>
              <p class="fs-14 fw-regular lh-125">
                Create an account to keep record of all your donations
              </p>
            </div>
            <div class="stepper">
              <div
                class="step"
                :class="{ 'step-active': step === 1, 'step-done': step > 1 }"
              >
                <span class="step-number">1</span>
              </div>
              <div
                class="step"
                :class="{ 'step-active': step === 2, 'step-done': step > 2 }"
              >
                <span class="step-number">2</span>
              </div>
              <div
                class="step"
                :class="{ 'step-active': step === 3, 'step-done': step > 3 }"
              >
                <span class="step-number">3</span>
              </div>
             
            </div>
            <div v-scrollViz class="form__body">
              <MessageAlert v-if="errorMessage" :message="errorMessage" />
              <div class="form__inputs">
                <div class="input__group">
                  <Text
                    type="text"
                    label="First name"
                    name="fname"
                    v-model="userDetails.first_name"
                  >
                    <slot v-if="v$.userDetails.first_name.$error">
                      <p class="error-input">
                        {{ v$.userDetails.first_name.$errors[0].$message }}
                      </p>
                    </slot>
                  </Text>

                  <Text
                    type="text"
                    label="Last name"
                    name="lname"
                    v-model="userDetails.last_name"
                  >
                    <slot v-if="v$.userDetails.last_name.$error">
                      <p class="error-input">
                        {{ v$.userDetails.last_name.$errors[0].$message }}
                      </p>
                    </slot>
                  </Text>
                </div>
                <div class="input__group">
                  <Text
                    type="email"
                    label="Email"
                    name="email"
                    v-model="userDetails.email"
                  >
                    <slot v-if="v$.userDetails.email.$error">
                      <p class="error-input">
                        {{ v$.userDetails.email.$errors[0].$message }}
                      </p>
                    </slot>
                  </Text>
                  <PhoneInput
                    v-model:phone-number="phone"
                    v-model="userDetails.country_code"
                    @input="phoneComputed"
                  >
                    <slot v-if="v$.phone.$error">
                      <p class="error-input">
                        {{ v$.phone.$errors[0].$message }}
                      </p>
                    </slot>
                  </PhoneInput>
                </div>

                <div class="input__group">
                  <Password
                    label="Password"
                    name="pass"
                    v-model="userDetails.password"
                  />
                  <Password
                    label="Confirm Password"
                    name="pass-confirm"
                    v-model="userDetails.confirm_password"
                    @input="passwordMatch"
                  />
                </div>
                <MessageAlert
                  v-if="v$.userDetails.password.$error"
                  :message="v$.userDetails.password.$errors[0].$message"
                />
                <MessageAlert v-else-if="message" :message="message" />
              </div>

              <div class="input__group--row">
                <CheckBox Name="terms" v-model="userDetails.terms" label="">
                  <p>
                    I agree to the
                    <span class="text-link" @click="revealTerms"
                      >Terms of Use</span
                    >
                    and
                    <span class="text-link" @click="revealPrivacy"
                      >Privacy Policy</span
                    >
                    of LifeGuard
                  </p>
                </CheckBox>
              </div>

              <div class="input__group--row">
                <Button
                  label="Sign Up"
                  type="primary"
                  size="large"
                  :disabled="disableButton"
                />
              </div>

              <div class="divider">
                <div class="line"></div>
                <p class="caption">or</p>
                <div class="line"></div>
              </div>

              <div class="input__group">
                <ButtonSocial
                  provider="apple"
                  @click="appleSignIn(userDetails.user_type)"
                />
              </div>
              <div class="input__group">
                <ButtonSocial @click="googleSignup(userDetails.user_type)" />
              </div>

              <div class="button">Next</div>
            </div>
            <Loader v-if="loadingStatus" :useOverlay="true" :rounded="true" />
          </form>
        </div>
      </section>

      <!-- <section  v-if="!hasSeenCongrats" v-show="step === 2">
        <div class="container-right">
          <OTPform />
        </div>
      </section> -->
  
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { useVuelidate } from "@vuelidate/core";
import {
  required,
  email,
  alpha,
  minLength,
  helpers,
} from "@vuelidate/validators";
import { googleTokenLogin } from "vue3-google-login";
import Text from "@/components/inputs/text.vue";
import Password from "@/components/inputs/password.vue";
import PhoneInput from "@/components/inputs/phone-number.vue";
import CheckBox from "@/components/inputs/check-box.vue";
import Button from "@/components/buttons/button-primary.vue";
import MessageAlert from "@/components/alerts/message.vue";
import Dropdown from "@/components/inputs/select-dropdown.vue";
import Icons from "@/components/icons.vue";
import Loader from "@/components/Loader/main-loader.vue";
import Illustrations from "@/components/illustrations.vue";
import ButtonSocial from "@/components/buttons/button-social.vue";
import LifeguardNav from "@/components/Navigation/Lifeguardnav.vue";
// import LoginForm from "@/components/forms/Login/Login-form.vue";
import OTPform from "@/components/forms/Login/otp-form.vue";

const validPassword = (value) =>
  value.match(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/) &&
  value.match(/\d/) &&
  value.match(/[A-Z]/) &&
  value.length >= 8;

const checked = (value) => value == true;

export default {
  name: "SignupNew",

  setup: () => ({ v$: useVuelidate() }),

  components: {
    Text,
    Password,
    PhoneInput,
    CheckBox,
    Button,
    MessageAlert,
    Dropdown,
    Icons,
    Loader,
    Illustrations,
    ButtonSocial,
    OTPform,
    LifeguardNav,
  },

  data() {
    return {
      steps: {},
      step: 1,
      userDetails: {
        user_type: "Lifeguard",
        first_name: "",
        last_name: "",
        email: "",
        country_code: "+234",
        phone: "",
        password: "",
        confirm_password: "",
        terms: false,
        marketing: false,
      },
      hasSeenCongrats: false,
      phone: "",
      cCodes: ["+234", "+1"],
      missMatch: true,
      message: "",
      loading: false,
    };
  },

  validations() {
    return {
      userDetails: {
        first_name: {
          required: helpers.withMessage("This field is required", required),
          alpha: helpers.withMessage("Name must be letters only", alpha),
          minlength: helpers.withMessage(
            "Name must be at least 2 letters",
            minLength(2)
          ),
          $autoDirty: true,
        },
        last_name: {
          required: helpers.withMessage("This field is required", required),
          alpha: helpers.withMessage("Name must be letters only", alpha),
          minlength: helpers.withMessage(
            "Name must be at least 2 letters",
            minLength(2)
          ),
          $autoDirty: true,
        },
        email: {
          required: helpers.withMessage("This field is required", required),
          email: helpers.withMessage("The email address is invalid", email),
          $autoDirty: true,
        },

        password: {
          required: helpers.withMessage(
            "The password field is required",
            required
          ),
          validPassword: helpers.withMessage(
            "Password must be at least 8 characters long and contain at least one special character, capital letter and number",
            validPassword
          ),
          $autoDirty: true,
        },
        terms: { checked, $autoDirty: true },
      },
      phone: {
        required: helpers.withMessage("This field is required", required),
        minLength: helpers.withMessage("Must be 10 digits long", minLength(10)),
        $autoDirty: true,
      },
    };
  },

  computed: {
    ...mapGetters({
      errorMessages: "userRegAuth/errorMessage",
      isRegistered: "userRegAuth/isRegistered",
      userProfile: "userprofile",
    }),

    phoneComputed() {
      this.userDetails.phone = this.phone.replace(/[-]/g, "");
    },

    disableButton() {
      return this.v$.$invalid || this.missMatch;
    },

    errorMessage() {
      return this.errorMessages["signup"];
    },

    loadingStatus() {
      if (this.loading && !this.errorMessages["signup"]) {
        return true;
      } else {
        return false;
      }
    },
  },

  methods: {
    ...mapActions({
      signUp: "userRegAuth/signup",
      googleAuth: "userRegAuth/googleauth",
    }),
    prev() {
      this.step--;
    },

    next() {
      this.step++;
    },

    customerRegister: function () {
      this.hasSeenCongrats = true;
    },

    passwordMatch() {
      let comparator = this.userDetails.password;
      let inputed = this.userDetails.confirm_password;
      if (inputed) {
        if (inputed !== comparator) {
          this.message = "Passwords do not match";
          this.missMatch = true;
        } else {
          this.message = "";
          this.missMatch = false;
        }
      } else if (!inputed || blur) {
        this.message = "The confirm password field is required";
        this.missMatch = true;
      }
    },

    googleSignup(userType) {
      googleTokenLogin()
        .then((res) => {
          this.loading = true;
          this.googleAuth({ token: res.access_token, user_type: userType });
        })
        .catch((err) => {
          console.log(err);
        });
    },

    handleSubmit() {
      this.loading = true;
      this.signUp(this.userDetails);
    },

    async appleSignIn(userType) {
      AppleID.auth.init({
        clientId: "com.rapidcapsules.login",
        scope: "name email",
        redirectURI: window.location.origin + "/lifeguard/signup",
        state: `${userType}`,
        usePopup: true,
      });

      const res = await AppleID.auth.signIn();

      console.log(res);
    },

    setupAppleLogin() {
      let script = document.getElementsByTagName("script");
      let status = Object.keys(script).every(
        (key) =>
          script[key].src !==
          "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
      );

      if (status) {
        let appleSignIn = document.createElement("script");
        appleSignIn.setAttribute(
          "src",
          "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        );
        document.head.appendChild(appleSignIn);
      }
    },
  },

  watch: {
    isRegistered: {
      handler(value) {
        if (value) {
          this.$router.push({ name: "Verify-email" });
        }
      },
      immediate: true,
    },

    userProfile(value) {
      if (value) {
        if (!this.userProfile.emergency_contacts.length > 0) {
          this.$router.push({ name: "Patient Profile Setup" });
        } else {
          this.$router.push({ name: "Patient Dashboard" });
        }
      }
    },
  },

  mounted() {
    this.setupAppleLogin();
  },
};
</script>

<style scoped lang="scss">
$brand-primary: #00c4b5;
$brand-secondary: #dedc00;
$brand-lemon: #fff219;
$brand-quaternary: #f282a5;
$brand-menthol: #14877d;
$brand-coral: rgb(250, 90, 85);
$brand-paprika: rgb(205, 0, 125);
$color-white: #fff;
$color-dark: #676767;
$color-gray: #cecece;
$color-lightgray: #ededed;
$color-jungle: #193805;

/* FONT */
$font-montserrat: "Montserrat", sans-serif;
$font-weight-bold: 700;
.container {
  align-items: center;
  justify-content: center;
  gap: $size-64;
  margin-top: 100px;

  @include responsive(small-laptop) {
    gap: $size-48;
    width: 85%;
    margin: 20px;
  }

  @include responsive(phone) {
    width: 100%;
    margin: 20px;
  }

  &__left,
  &__right {
    @include flexItem(horizontal) {
      justify-content: center;
      height: 100%;
    }
  }

  &__left {
    @include flexItem(vertical) {
      padding: $size-0 3%;
      width: min(650px, 50%);
      gap: $size-32;

      @include responsive(large-screen) {
        width: min(650px, 50%);
      }

      @include responsive(small-laptop) {
        width: 40%;
        padding: $size-0 $size-0;
      }

      @include responsive(tab-landscape) {
        display: none;
      }

      @include responsive(tab-portrait) {
        display: none;
      }

      @include responsive(phone) {
        display: none;
      }

      .text-content {
        @include flexItem(vertical) {
          gap: $size-16;

          .heading {
            font-size: $size-40;
            font-weight: $fw-bold;
            line-height: 1.25;
            color: $color-g-21;

            span {
              color: orangered;
            }

            @include responsive(small-laptop) {
              font-size: $size-32;
            }
          }

          .copy {
            font-size: $size-22;
            font-weight: $fw-regular;
            line-height: 1.5;
            letter-spacing: 0.02;
            color: $color-g-44;

            @include responsive(small-laptop) {
              font-size: $size-18;
            }
          }
        }
      }
    }
  }

  &__right {
    align-items: center;
    justify-content: flex-end;
    width: 60%;
    margin-top: 80px;

    @include responsive(tab-landscape) {
      width: 100%;
      justify-content: center;
    }

    @include responsive(tab-portrait) {
      width: 100%;
      justify-content: center;
      padding: 0;
    }

    @include responsive(phone) {
      width: 100%;
      padding: 0;
    }
    .stepper {
      display: flex;
      justify-content: space-between;
      width: 80%;
      position: relative;
      margin: 0 auto 1.5em;

      &::before {
        z-index: 0;
        content: "";
        display: block;
        position: absolute;
        height: 2px;
        top: calc(50% - 1px);
        background: $color-gray;
        width: calc(100% - 20px);
      }

      .step {
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1;
        border: 2px solid $color-gray;
        color: $color-gray;
        background-color: $color-gray;
        border-radius: 50%;
        min-width: 25px;
        min-height: 25px;
        line-height: 20px;
        font-size: 14px;

        &-active {
          color: #ffffff;
          border-radius: 13px;
          background: #008c99;
        }

        &-done {
          color: #ffffff;
          border-radius: 13px;
          background: #008c99;
        }

        &-number {
          font-family: "inter";
          color: #ffffff;
          font-weight: 300;
          line-height: 1;
          vertical-align: middle;
        }
      }
    }
  }

  // display: block;
  // color: $color-white;
  // max-width: 100%;
  // margin: 2rem auto;
  // padding: 2rem;
  // border-radius: 4rem;
  // background: $color-jungle;
  // background: linear-gradient(145deg, #173205, #1b3c05);
  // box-shadow:  38px 38px 77px #132a04,
  //          -38px -38px 77px #1f4606;

  // &-icon {
  // 	display: flex;
  // 	background: $color-white;
  // 	border-radius: 2rem;
  // 	width: 50px;
  // 	height: 50px;
  // 	padding: 1rem;
  // 	margin: -50px auto 20px;

  // 	&-item {
  // 		width: 100%;
  // 	}
  // }

  // &-title {
  // 	font-weight: 300;
  // 	font-size: 1.5rem;
  // 	text-transform: uppercase;
  // 	letter-spacing: 0.2rem;
  // 	text-align: center;
  // 	color: $color-white;
  // 	padding: 0 2rem;
  // 	margin-top: 2rem;
  // }

  // 	.form {
  // 		&-group {
  // 			display: flex;
  // 			flex-flow: row;
  // 			justify-content: flex-start;
  // 			align-items: baseline;

  // 			label {
  // 				text-align: left;
  // 				font-size: 1.1rem;
  // 				line-height: 1.1;
  // 				padding-bottom: 0.5rem;
  // 			}

  // 			&.cta-step {
  // 				color: $color-white;
  // 				justify-content: space-between;

  // 				.cta.prev {
  // 					padding: 10px 30px;
  // 				}
  // 			}

  // 			&.new-password {
  // 				margin-top: 2rem;
  // 			}
  // 		}

  // 	}
  // 	// Override styles for input
  // 	input[type="submit"],
  // 	input[type="text"],
  // 	input[type="tel"],
  // 	input[type="email"],
  // 	input[type="date"] {
  // 		// -webkit-appearance: none;
  // 		border: 0;
  // 		border-radius: 5px;
  // 		padding: 1.3rem 1rem;
  // 		width: 100%;
  // 		margin: 0.5rem;
  // 	}

  // 	input[type="submit"] {
  // 		cursor: pointer;
  // 		position: relative;
  // 		padding-right: 36px;
  // 		background: none;
  // 		width: fit-content;

  // 		&:hover,
  // 		&:focus {
  // 			box-shadow: unset;
  // 			transform: none;
  // 		}

  // 		&::after {
  // 			content: "";
  // 			display: block;
  // 			position: absolute;
  // 			right: 0;
  // 			top: 50%;
  // 			border-radius: 50px;
  // 			border: 1px solid $brand-primary;
  // 			height: 25px;
  // 			width: 25px;
  // 			margin-top: -14px;
  // 			pointer-events: none;
  // 			transition: all 0.33s cubic-bezier(0.12, 0.75, 0.4, 1);
  // 		}
  // 	}

  // 	&-btn input {
  // 		color: $color-white;
  // 		font-size: 1.2rem;
  // 		font-family: $font-montserrat;
  // 		font-weight: 800;
  // 		line-height: 1;
  // 		width: fit-content;
  // 		background: linear-gradient(145deg, #1b3c05, #173205);
  // box-shadow:  20px 20px 60px #142c04,
  //              -20px -20px 60px #1f4406;

  // 		&:hover {
  // background: linear-gradient(145deg, #173205, #1b3c05);
  // box-shadow:  20px 20px 60px #142c04,
  //              -20px -20px 60px #1f4406;
  // 		}
  // 	}

  // 	        // Transition SLIDE FADE
  //         .slide-fade-enter-active {
  //             transition: all .3s ease;
  //         }
  //         .slide-fade-leave-active {
  //             display: none;
  //             transition: all .4s cubic-bezier(1.0, 0.5, 0.8, 1.0);
  //         }
  //         .slide-fade-enter, .slide-fade-leave-to {
  //             transform: translateX(10px);
  //             opacity: 0;
  //         }

  // .congrats {
  // 	background: $color-white;
  // 	color: $brand-primary;
  // 	padding: 4rem;
  // 	text-align: center;

  // 	&-subtitle {
  // 		line-height: 1.3;

  // 		strong {
  // 			font-size: 2rem;
  // 		}
  // 	}
  // }
  .form {
    @include flexItem(vertical) {
      position: relative;
      justify-content: center;
      gap: $size-20;
      padding: $size-32;
      max-height: 93%;
      width: max(80%);
      background-color: $color-white;
      border-radius: $size-16;

      @include responsive(small-laptop) {
        width: 90%;
        max-height: 100%;
        padding-left: $size-24;
        padding-right: $size-24;
      }

      @include responsive(tab-landscape) {
        width: min(750px, 80%);
      }

      @include responsive(tab-portrait) {
        width: 85%;
      }

      @include responsive(phone) {
        width: max(300px, 90%);
        padding: 0;
        box-shadow: none;
        border-radius: 0;
        border: none;
        background-color: transparent;
        padding: 0;
      }

      &__header {
        @include flexItem(vertical) {
          align-items: center;
          justify-content: center;
          gap: $size-8;
        }

        padding-bottom: $size-16;
        text-align: center;

        & > p {
          color: $color-g-44;
        }
      }

      &__body {
        @include flexItem(vertical) {
          align-items: center;
          overflow-y: auto;
          gap: $size-32;
          width: 100%;
          padding: $size-8 $size-0;

          @include scrollBar(normal);

          &.scroll-visible {
            padding-right: $size-12;
          }

          @include responsive(phone) {
            padding: $size-12 $size-0;
          }
        }
      }

      &__inputs {
        @include flexItem(vertical) {
          gap: $size-16;
        }

        width: 100%;
      }

      .button {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 10px 16px;
        gap: 12px;
        width: 69px;
        height: 44px;
        color: #8a8a8a;
        font-family: "Inter";
        font-weight: 400;
        font-size: 16px;
        background: #c6c6c6;
        border-radius: 8px;
        margin-left: 390px;
      }

      //   .cta-color,
      //   .cta-color input,
      //   .cta-color .link_text {
      //     color: black;
      //     font-family: $font-montserrat;
      //     font-size: 1.1rem;
      //     text-decoration: none;
      //     margin-left: 200px;
      //     padding: 10px;
      //     width: 50%;

      //   }

      //   .cta-color .link_wrap {
      //     position: relative;
      //     display: flex;
      //     align-items: center;
      //     justify-content: center;
      //     width: 100%;
      //     background: orangered;

      //     .arrow-prev {
      //       position: relative;
      //       display: inline-block;
      //       transform: translate(0);
      //       transition: transform 0.3s ease-in-out;

      //       &::before {
      //         content: "<";
      //         position: absolute;
      //         top: -17px;
      //         left: -25px;
      //       }
      //     }

      //     .arrow-next {
      //       position: relative;
      //       display: inline-block;
      //       transform: translate(0);
      //       transition: transform 0.3s ease-in-out;

      //       &::before {
      //         content: ">";
      //         position: absolute;
      //         top: -10px;
      //         left: -25px;
      //       }
      //     }

      //     &:hover .arrow-prev {
      //       transform: translate(-5px);
      //     }

      //     &:hover .arrow-next {
      //       transform: translate(5px);
      //     }
      //   }
    }
  }

  .divider {
    @include flexItem(horizontal) {
      align-items: center;
      gap: $size-12;
    }

    width: 100%;
  }

  .line {
    height: $size-1;
    width: 100%;
    background-color: $color-g-90;
  }

  .link-group {
    @include flexItem(vertical) {
      text-align: center;
      gap: $size-12;
    }
  }

  .illustration {
    width: min(30.4rem, 100%);
    height: auto;

    @include responsive(small-laptop) {
      width: 75%;
    }
  }

  .captcha {
    position: absolute;
    top: $size-0;
  }
}
</style>
