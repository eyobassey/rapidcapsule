<template>
	<div class="wrapper bgd-image">
		<div class="container">
			<div class="container__left">
				<Logos name="icon-full-color" class="illustration" />
				<div class="text-content">
					<h2 class="heading">Welcome</h2>
					<p class="copy">
						Access your comprehensive AI-powered telemedicine platform. Connect with medical specialists, conduct health checkups, and manage your healthcare journey through advanced technology integration.
					</p>
					<div class="legal-links">
						<a href="https://rapidcapsule.com/privacy-policy" target="_blank" rel="noopener noreferrer" class="legal-link">
							Privacy Policy
						</a>
						<span class="separator">•</span>
						<a href="https://rapidcapsule.com/terms-of-service" target="_blank" rel="noopener noreferrer" class="legal-link">
							Terms of Service
						</a>
					</div>
				</div>
			</div>
			<div class="container__right">
				<LoginForm v-if="!isAuthorized" :prev-page="from" />
				<OTPform v-else-if="isAuthorized" />
			</div>
		</div>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import LoginForm from "@/components/forms/Login/Login-form.vue";
import OTPform from "@/components/forms/Login/otp-form.vue";
import Logos from "@/components/logos.vue";

export default {
	name: "Login",

	components: {
		LoginForm,
		OTPform,
		Logos,
	},

	data() {
		return {
			prevPage: this.$router.options.history.state.back,
		};
	},

	computed: {
		...mapGetters({
			isAuthorized: "userRegAuth/authorization",
			userProfile: "userprofile",
		}),

		from() {
			if (!this.prevPage) {
				return "null";
			} else {
				return this.prevPage;
			}
		},
	},

	watch: {
		userProfile(value) {
			if (value) {
				if (this.userProfile.user_type === "Patient") {
					const emergencyContacts = this.userProfile.emergency_contacts;
					if (!emergencyContacts || emergencyContacts.length === 0) {
						this.$router.push({ name: "Patient Profile Setup" });
					} else {
						this.$router.push({ name: "Patient Dashboard" });
					}
				} else {
					if (!this.userProfile.professional_practice) {
						this.$router.push({ name: "Specialist Profile Setup" });
					} else {
						this.$router.push({ name: "SpecialistDashboard" });
					}
				}
			}
		},
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
				width: min(800px, 50%);
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

					.legal-links {
						@include flexItem(horizontal) {
							justify-content: flex-start;
							align-items: center;
							gap: $size-12;
							margin-top: $size-24;
							font-size: $size-14;

							@include responsive(small-laptop) {
								font-size: $size-12;
							}

							.legal-link {
								color: $color-g-54;
								text-decoration: none;
								transition: color 0.2s ease;
								font-weight: $fw-regular;

								&:hover {
									color: $color-pri;
									text-decoration: underline;
								}

								&:focus {
									outline: 2px solid $color-pri-t2;
									outline-offset: 2px;
									border-radius: $size-4;
								}
							}

							.separator {
								color: $color-g-77;
								font-size: $size-12;
								user-select: none;
							}
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

		@include responsive(small-laptop) {
			width: 55%;
		}
		@include responsive(tab-landscape) {
			width: 100%;
			justify-content: center;
			align-items: center;
		}
		@include responsive(tab-portrait) {
			width: 100%;
			justify-content: center;
			align-items: center;
			padding: 0;
		}
		@include responsive(phone) {
			width: 100%;
			padding: 0;
		}
	}
}
.illustration {
	width: min(13.56rem, 100%);
	height: auto;

	@include responsive(small-laptop) {
		width: 35%;
	}
}
</style>
