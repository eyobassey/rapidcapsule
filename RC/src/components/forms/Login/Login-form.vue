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

							<!-- Biometric Login Button - Always visible when device supports biometrics -->
							<button
								v-if="biometricSupported"
								type="button"
								class="biometric-login-btn"
								:class="{ 'biometric-available': biometricAvailable.patient }"
								@click="biometricLogin('Patient')"
								:disabled="biometricLoading || checkingBiometric"
							>
								<svg class="biometric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
								</svg>
								<span v-if="biometricLoading">Authenticating...</span>
								<span v-else-if="checkingBiometric">Checking...</span>
								<span v-else>Sign in with Biometrics</span>
							</button>

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

							<!-- Biometric Login Button - Always visible when device supports biometrics -->
							<button
								v-if="biometricSupported"
								type="button"
								class="biometric-login-btn"
								:class="{ 'biometric-available': biometricAvailable.specialist }"
								@click="biometricLogin('Specialist')"
								:disabled="biometricLoading || checkingBiometric"
							>
								<svg class="biometric-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
								</svg>
								<span v-if="biometricLoading">Authenticating...</span>
								<span v-else-if="checkingBiometric">Checking...</span>
								<span v-else>Sign in with Biometrics</span>
							</button>

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
import { startAuthentication } from "@simplewebauthn/browser";
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
			// Biometric
			biometricSupported: false,
			biometricAvailable: {
				patient: false,
				specialist: false,
			},
			checkingBiometric: false,
			biometricLoading: false,
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
			checkBiometricEnabled: "userRegAuth/checkBiometricEnabled",
			getBiometricLoginOptions: "userRegAuth/getBiometricLoginOptions",
			verifyBiometricLogin: "userRegAuth/verifyBiometricLogin",
			getPasskeyLoginOptions: "userRegAuth/getPasskeyLoginOptions",
			verifyPasskeyLogin: "userRegAuth/verifyPasskeyLogin",
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

		async checkBiometricSupport() {
			// Check if WebAuthn is supported and platform authenticator is available
			console.log("Checking biometric support...");
			console.log("PublicKeyCredential available:", !!window.PublicKeyCredential);

			if (
				window.PublicKeyCredential &&
				typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function"
			) {
				try {
					this.biometricSupported =
						await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
					console.log("Biometric supported:", this.biometricSupported);
				} catch (err) {
					console.error("Error checking biometric support:", err);
					this.biometricSupported = false;
				}
			} else {
				console.log("PublicKeyCredential or isUserVerifyingPlatformAuthenticatorAvailable not available");
				this.biometricSupported = false;
			}
		},

		async checkBiometricForEmail(email, userType) {
			console.log("checkBiometricForEmail called:", { email, userType, biometricSupported: this.biometricSupported });
			if (!email || !this.biometricSupported) {
				console.log("Skipping check - email or biometric not supported");
				return;
			}

			this.checkingBiometric = true;
			try {
				const result = await this.checkBiometricEnabled(email);
				console.log("Biometric enabled check result:", result);
				if (userType === "Patient") {
					this.biometricAvailable.patient = result.enabled;
				} else if (userType === "Specialist") {
					this.biometricAvailable.specialist = result.enabled;
				}
			} catch (err) {
				console.error("Error checking biometric availability:", err);
			} finally {
				this.checkingBiometric = false;
			}
		},

		async biometricLogin(userType) {
			const email =
				userType === "Patient"
					? this.logInCredentials.patient.email
					: this.logInCredentials.specialist.email;

			this.biometricLoading = true;
			this.loading = true;

			try {
				// Try passkey (discoverable credentials) flow first - no email required
				console.log("Trying passkey flow...");
				const passkeySuccess = await this.tryPasskeyLogin();

				if (passkeySuccess) {
					// Passkey login succeeded
					return;
				}
				console.log("Passkey flow failed, falling back to email-based flow...");

				// Passkey failed - use email-based flow

				if (!email) {
					alert("Please enter your email address to use biometric login.");
					this.loading = false;
					this.biometricLoading = false;
					return;
				}

				await this.emailBasedBiometricLogin(email, userType);
			} catch (err) {
				console.error("Biometric login error:", err);
				// Don't show error for user cancellation
				if (err.name !== "NotAllowedError") {
					alert(err.message || "Biometric authentication failed. Please try again or use password.");
				}
				this.loading = false;
			} finally {
				this.biometricLoading = false;
			}
		},

		async tryPasskeyLogin() {
			try {
				// Get passkey options (no email required)
				const optionsResult = await this.getPasskeyLoginOptions();
				console.log("Passkey options result:", optionsResult);

				if (!optionsResult.success) {
					console.log("Failed to get passkey options:", optionsResult.error);
					return false;
				}

				// Start the WebAuthn authentication - browser shows available passkeys
				console.log("Starting passkey authentication...");
				const authResult = await startAuthentication(optionsResult.options);
				console.log("Passkey auth result:", authResult);

				// Verify with the server
				console.log("Verifying passkey with server...");
				const verifyResult = await this.verifyPasskeyLogin({
					credential: authResult,
				});
				console.log("Passkey verify result:", verifyResult);

				if (!verifyResult.success) {
					console.log("Passkey verification failed:", verifyResult.error);
					return false;
				}

				// Success!
				return true;
			} catch (err) {
				// NotAllowedError means user cancelled or no passkeys available
				if (err.name === "NotAllowedError") {
					console.log("User cancelled passkey or no passkeys available");
				} else {
					console.error("Passkey error:", err);
				}
				return false;
			}
		},

		async emailBasedBiometricLogin(email, userType) {
			// Check if biometrics are enabled for this email
			console.log("Checking biometric for email:", email);
			const checkResult = await this.checkBiometricEnabled(email);
			console.log("Biometric check result:", checkResult);

			if (!checkResult.enabled) {
				throw new Error("Biometric login is not set up for this account. Please set it up in Security Settings first.");
			}

			// Get authentication options from the server
			console.log("Getting biometric login options...");
			const optionsResult = await this.getBiometricLoginOptions(email);
			console.log("Login options result:", optionsResult);

			if (!optionsResult.success) {
				throw new Error(optionsResult.error || "Failed to get authentication options");
			}

			// Start the WebAuthn authentication
			console.log("Starting WebAuthn authentication...");
			const authResult = await startAuthentication(optionsResult.options);
			console.log("WebAuthn auth result:", authResult);

			// Verify with the server
			console.log("Verifying with server...");
			const verifyResult = await this.verifyBiometricLogin({
				email,
				credential: authResult,
				usertype: userType,
			});
			console.log("Verify result:", verifyResult);

			if (!verifyResult.success) {
				throw new Error(verifyResult.error || "Biometric authentication failed");
			}
			// Success - authentication is handled by the verifyBiometricLogin action
		},
	},

	watch: {
		"logInCredentials.patient.email"(newEmail) {
			if (newEmail && this.biometricSupported) {
				// Debounce the check
				clearTimeout(this._patientEmailTimeout);
				this._patientEmailTimeout = setTimeout(() => {
					this.checkBiometricForEmail(newEmail, "Patient");
				}, 500);
			} else {
				this.biometricAvailable.patient = false;
			}
		},
		"logInCredentials.specialist.email"(newEmail) {
			if (newEmail && this.biometricSupported) {
				// Debounce the check
				clearTimeout(this._specialistEmailTimeout);
				this._specialistEmailTimeout = setTimeout(() => {
					this.checkBiometricForEmail(newEmail, "Specialist");
				}, 500);
			} else {
				this.biometricAvailable.specialist = false;
			}
		},
	},

	mounted() {
		this.setActiveTab();

		this.setupAppleLogin();

		// Check if biometric authentication is supported
		this.checkBiometricSupport();
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

				.biometric-login-btn {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: $size-8;
					width: 100%;
					padding: $size-14 $size-16;
					background-color: $color-white;
					border: 2px solid $color-g-77;
					border-radius: $size-8;
					color: $color-g-44;
					font-size: $size-14;
					font-weight: 500;
					cursor: pointer;
					transition: all 0.2s ease;

					&:hover:not(:disabled) {
						background-color: hsla(121, 48%, 46%, 0.1);
						border-color: $color-denote-green;
						color: $color-denote-green;
					}

					&:disabled {
						opacity: 0.6;
						cursor: not-allowed;
					}

					// Highlight green when biometrics are confirmed available for this email
					&.biometric-available {
						border-color: $color-denote-green;
						background-color: hsla(121, 48%, 46%, 0.1);
						color: $color-denote-green;

						&:hover:not(:disabled) {
							background-color: hsla(121, 48%, 46%, 0.15);
						}
					}

					.biometric-icon {
						width: $size-20;
						height: $size-20;
					}
				}
			}
		}
	}
}

@include animation(tab-transition);
</style>
