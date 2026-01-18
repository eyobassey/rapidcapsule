<template>
	<div class="form">
		<div class="form__header">
			<h3 class="fs-28 fw-semi-bold lh-125">Log in</h3>
		</div>
		<SegmentNav :tabItems="segmentArray" :selected="selected" @selected="setSelected">
			<div v-scrollViz class="segment-content-group">
				<transition name="slide" mode="in-out">
					<SegmentContent :isSelected="selected == segmentArray[1]">
						<form @submit.prevent="logIn" class="content">
							<MessageAlert
								v-if="errorMessagePatient"
								:message="errorMessagePatient"
							/>
							<div class="input__group--row">
								<Text
									type="email"
									label="Email"
									name="email-patient"
									v-model="logInCredentials.patient.email"
								>
									<slot v-if="v$.logInCredentials.patient.email.$error">
										<p class="error-input">
											{{
												v$.logInCredentials.patient.email.$errors[0]
													.$message
											}}
										</p>
									</slot>
								</Text>

								<Password
									label="Password"
									name="pass-patient"
									v-model="logInCredentials.patient.password"
								/>
							</div>

							<div class="input__group--row">
								<CheckBox
									Name="remember-me-patient"
									v-model="logInCredentials.patient.rememberMe"
									label=""
								>
									<p>
										Remember me on this device (use this only on a personal
										device)
									</p>
								</CheckBox>
							</div>

							<Button
								label="Log in"
								type="primary"
								size="large"
								width="100%"
								:disabled="this.v$.logInCredentials.patient.$invalid"
							/>

							<div class="link-group">
								<p class="caption">
									Can't remember your password?
									<router-link :to="{ name: 'Request Link' }" class="text-link">
										Reset your password
									</router-link>
								</p>
							</div>

							<div class="divider">
								<div class="line"></div>
								<p class="caption">or</p>
								<div class="line"></div>
							</div>

							<div class="input__group">
								<ButtonSocial
									provider="apple"
									@click="appleSignIn(logInCredentials.patient.user_type)"
								/>
								<ButtonSocial
									@click="googleLogin(logInCredentials.patient.user_type)"
								/>
							</div>

							<div class="link-group">
								<p class="caption">
									Don't have an account?
									<router-link :to="{ name: 'Signup-patient' }" class="text-link">
										Sign up
									</router-link>
								</p>
							</div>
						</form>
					</SegmentContent>
				</transition>
				<transition name="slide" mode="in-out">
					<SegmentContent :isSelected="selected == segmentArray[0]">
						<form @submit.prevent="logIn" class="content">
							<MessageAlert
								v-if="errorMessageSpecialist"
								:message="errorMessageSpecialist"
							/>
							<div class="input__group--row">
								<Text
									type="email"
									label="Email"
									name="email-specialist"
									v-model="logInCredentials.specialist.email"
								>
									<slot v-if="v$.logInCredentials.specialist.email.$error">
										<p class="error-input">
											{{
												v$.logInCredentials.specialist.email.$errors[0]
													.$message
											}}
										</p>
									</slot>
								</Text>

								<Password
									label="Password"
									name="pass-specialist"
									v-model="logInCredentials.specialist.password"
								/>
							</div>

							<div class="input__group--row">
								<CheckBox
									Name="remember-me-specialist"
									v-model="logInCredentials.specialist.rememberMe"
									label=""
								>
									<p>
										Remember me on this device (use this only on a personal
										device)
									</p>
								</CheckBox>
							</div>

							<Button
								label="Log in"
								type="primary"
								size="large"
								width="100%"
								:disabled="this.v$.logInCredentials.specialist.$invalid"
							/>

							<div class="link-group">
								<p class="caption">
									Can't remember your password?
									<router-link :to="{ name: 'Request Link' }" class="text-link">
										Reset your password
									</router-link>
								</p>
							</div>

							<div class="divider">
								<div class="line"></div>
								<p class="caption">or</p>
								<div class="line"></div>
							</div>

							<div class="input__group">
								<ButtonSocial
									provider="apple"
									@click="appleSignIn(logInCredentials.specialist.user_type)"
								/>
								<ButtonSocial
									@click="googleLogin(logInCredentials.specialist.user_type)"
								/>
							</div>

							<div class="link-group">
								<p class="caption">
									Don't have an account?
									<router-link
										:to="{ name: 'Signup-specialist' }"
										class="text-link"
									>
										Sign up
									</router-link>
								</p>
							</div>
						</form>
					</SegmentContent>
				</transition>
			</div>
		</SegmentNav>

		<Loader v-if="loadingStatus" :useOverlay="true" :rounded="true" />
	</div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { useVuelidate } from "@vuelidate/core";
import { required } from "@vuelidate/validators";
import { googleTokenLogin } from "vue3-google-login";
import SegmentNav from "@/components/tab-components/segmented-control.vue";
import SegmentContent from "@/components/tab-components/segment.vue";
import Text from "../../inputs/text.vue";
import Password from "../../inputs/password.vue";
import CheckBox from "../../inputs/check-box.vue";
import Button from "../../buttons/button-primary.vue";
import MessageAlert from "../../alerts/message.vue";
import Icons from "../../icons.vue";
import Loader from "../../Loader/main-loader.vue";
import ButtonSocial from "@/components/buttons/button-social.vue";

export default {
	name: "Login form",

	setup: () => ({ v$: useVuelidate() }),

	components: {
		SegmentNav,
		SegmentContent,
		Text,
		Password,
		CheckBox,
		Button,
		MessageAlert,
		Icons,
		Loader,
		ButtonSocial,
	},

	props: {
		prevPage: {
			type: String,
			required: true,
		},
	},

	data() {
		return {
			segmentArray: ["As a Specialist", "As a Patient"],
			selected: "As a Patient",
			logInCredentials: {
				patient: {
					user_type: "Patient",
					email: "",
					password: "",
					rememberMe: false,
				},
				specialist: {
					user_type: "Specialist",
					email: "",
					password: "",
					rememberMe: false,
				},
			},
			loading: false,
		};
	},

	computed: {
		...mapGetters({
			errorMessage: "userRegAuth/errorMessage",
			userType: "userRegAuth/userType",
		}),

		errorMessagePatient() {
			if (this.errorMessage) {
				if (this.selected === this.segmentArray[1] && this.userType === "Patient") {
					return this.errorMessage["Login"];
				}
			}
		},

		errorMessageSpecialist() {
			if (this.errorMessage) {
				if (this.selected === this.segmentArray[0] && this.userType === "Specialist") {
					return this.errorMessage["Login"];
				}
			}
		},

		loadingStatus() {
			if (this.loading && !this.errorMessage["Login"]) {
				return true;
			} else {
				return false;
			}
		},
	},

	validations() {
		return {
			logInCredentials: {
				patient: {
					email: { required },
					password: { required },
				},
				specialist: {
					email: { required },
					password: { required },
				},
			},
		};
	},

	methods: {
		...mapActions({
			login: "userRegAuth/login",
			googleAuth: "userRegAuth/googleauth",
			appleAuth: "userRegAuth/appleauth",
		}),

		setActiveTab() {
			let tabTitle = this.segmentArray;
			if (this.prevPage === "/signup/patient") {
				this.selected = tabTitle[1];
			} else if (this.prevPage === "/signup/specialist") {
				this.selected = tabTitle[0];
			}
		},

		setSelected(tab) {
			this.selected = tab;
		},

		logIn() {
			let selectedTab = this.selected;
			let tabTitle = this.segmentArray;

			this.loading = true;

			if (selectedTab === tabTitle[0]) {
				this.login(this.logInCredentials.specialist);
			} else if (selectedTab === tabTitle[1]) {
				this.login(this.logInCredentials.patient);
			}
		},

		googleLogin(userType) {
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

		async appleSignIn(userType) {
			AppleID.auth.init({
				clientId: "com.rapidcapsules.login",
				scope: "name email",
				redirectURI: window.location.origin + "/login",
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

	mounted() {
		this.setActiveTab();

		this.setupAppleLogin();
	},
};
</script>

<style lang="scss" scoped>
.form {
	@include flexItem(vertical) {
		position: relative;
		overflow: hidden;
		gap: $size-24;
		padding: $size-32;
		min-height: 80%;
		width: 75%;
		max-width: 37.8rem;
		background-color: $color-white;
		border-radius: $size-16;
		box-shadow: $size-24 $size-24 $size-56 rgba($color-black, 0.15),
			$size-12 $size-32 $size-72 rgba($color-black, 0.1);
		border: 1px solid $color-pri-t4;

		@include responsive(large-screen) {
			height: auto;
		}

		@include responsive(small-laptop) {
			width: 85%;
			max-height: 100%;
			padding-left: $size-24;
			padding-right: $size-24;
		}

		@include responsive(phone) {
			position: unset;
			width: 90%;
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
		.segment-content-group {
			@include flexItem(horizontal) {
				align-items: flex-start;
				justify-content: flex-start;
				overflow-y: auto;
				width: 100%;
				padding: $size-8 $size-0;

				@include scrollBar(normal);

				&.scroll-visible {
					padding-right: $size-8;
				}

				& > * {
					flex-shrink: 0;
					width: 100%;
				}
			}

			.content {
				@include flexItem(vertical) {
					align-items: center;
					gap: $size-32;
				}

				.divider {
					display: flex;
					align-items: center;
					gap: $size-12;
					width: 100%;
				}

				.line {
					height: 1px;
					width: 100%;
					background-color: $color-g-90;
				}

				.link-group {
					display: flex;
					flex-direction: column;
					text-align: center;
					gap: $size-12;
				}

				.error-input {
					color: $color-denote-red;
					margin-left: 8px;
					font-size: $size-11;
				}
			}
		}
	}
}

@include animation(tab-transition);
</style>
