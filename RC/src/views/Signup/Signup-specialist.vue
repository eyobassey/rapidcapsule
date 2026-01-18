<template>
	<div class="wrapper bgd-image">
		<div class="container">
			<div class="container__left">
				<Illustrations name="doctors-1" class="illustration" />
				<div class="text-content">
					<h2 class="heading">Join our community of medical professionals</h2>
					<p class="copy">
						Expand your practice with our advanced telemedicine platform. Connect with patients remotely, streamline consultations, and grow your medical practice through innovative healthcare technology.
					</p>
				</div>
			</div>
			<div class="container__right">
				<form
					@submit.prevent="handleSubmit"
					class="form form__container card-shadow card-outline"
				>
					<div class="form__header">
						<h3 class="fs-28 fw-semi-bold lh-125">Create Account</h3>
						<p class="fs-14 fw-regular lh-125">as a medical professional</p>
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

							<div class="input__group--row">
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
									:countryCodes="cCodes"
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
									<span class="text-link" @click="revealTerms">Terms of Use</span>
									and
									<span class="text-link" @click="revealPrivacy"
										>Privac Policy</span
									>
									of Rapid Capsule
								</p>
							</CheckBox>
							<CheckBox Name="marketing" v-model="userDetails.marketing" label="">
								<p>
									I would like to recieve marketing content from Rapic Capsule
									ocassionally
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
							<ButtonSocial @click="googleSignup(userDetails.user_type)" />
						</div>

						<div class="link-group">
							<p class="caption">
								Already have an account?
								<router-link :to="{ name: 'Login' }" class="text-link">
									Log in
								</router-link>
							</p>
							<p class="caption">
								Not a medical professional?
								<router-link :to="{ name: 'Signup-patient' }" class="text-link">
									Sign up as a patient
								</router-link>
							</p>
						</div>
					</div>
					<Loader v-if="loadingStatus" :useOverlay="true" />
				</form>
			</div>
		</div>
	</div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { useVuelidate } from "@vuelidate/core";
import { required, email, alpha, minLength, helpers } from "@vuelidate/validators";
import { googleTokenLogin } from "vue3-google-login";
import Text from "../../components/inputs/text.vue";
import Password from "../../components/inputs/password.vue";
import PhoneInput from "../../components/inputs/phone-number.vue";
import CheckBox from "../../components/inputs/check-box.vue";
import Button from "../../components/buttons/button-primary.vue";
import MessageAlert from "../../components/alerts/message.vue";
import Dropdown from "../../components/inputs/select-dropdown.vue";
import Icons from "../../components/icons.vue";
import Loader from "@/components/Loader/main-loader.vue";
import Illustrations from "@/components/illustrations.vue";
import ButtonSocial from "@/components/buttons/button-social.vue";

const validPassword = (value) =>
	value.match(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/) &&
	value.match(/\d/) &&
	value.match(/[A-Z]/) &&
	value.length >= 8;

const checked = (value) => value == true;

export default {
	name: "Signup-specialist",

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
	},

	data() {
		return {
			userDetails: {
				user_type: "Specialist",
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
					minlength: helpers.withMessage("Name must be at least 2 letters", minLength(2)),
					$autoDirty: true,
				},
				last_name: {
					required: helpers.withMessage("This field is required", required),
					alpha: helpers.withMessage("Name must be letters only", alpha),
					minlength: helpers.withMessage("Name must be at least 2 letters", minLength(2)),
					$autoDirty: true,
				},
				email: {
					required: helpers.withMessage("This field is required", required),
					email: helpers.withMessage("The email address is invalid", email),
					$autoDirty: true,
				},
				password: {
					required: helpers.withMessage("The password field is required", required),
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
			appleAuth: "userRegAuth/appleauth",
		}),

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
					// Use credential (id_token) if available, otherwise fall back to access_token
					const token = res.credential || res.id_token || res.access_token;
					this.googleAuth({ token: token, user_type: userType });
				})
				.catch((err) => {
					console.log(err);
					this.loading = false;
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
				redirectURI: window.location.origin + "/signup/specialist",
				state: `${userType}`,
				usePopup: true,
			});

			try {
				const res = await AppleID.auth.signIn();
				this.loading = true;
				this.appleAuth(res);
			} catch (err) {
				console.error("Apple Sign-In Error:", err);
				this.loading = false;
			}
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
					this.$router.push({ name: "Specialist Profile Setup" });
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
.container {
	align-items: center;
	justify-content: center;
	gap: $size-64;

	@include responsive(small-laptop) {
		gap: $size-48;
		width: 85%;
	}

	@include responsive(phone) {
		width: 95%;
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
		width: 50%;

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
	}
}

.form {
	@include flexItem(vertical) {
		position: relative;
		justify-content: center;
		gap: $size-20;
		padding: $size-32;
		max-height: 93%;
		width: max(600px, 75%);
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
			border-bottom: $size-1 solid $color-g-90;

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

.btn {
	@include flexItem(horizontal) {
		align-items: center;
		justify-content: center;
		gap: $size-16;
	}
	cursor: pointer;

	&__extra {
		border-radius: 100vw;
		width: min(200px, 100%);
		height: 3.571rem;
		font-size: $size-16;

		&--apple {
			background-color: black;
			color: white;
		}

		&--google {
			background-color: $color-white;
			border: 1px solid $color-g-77;
		}
	}
}

.captcha {
	position: absolute;
	top: $size-0;
}
</style>
