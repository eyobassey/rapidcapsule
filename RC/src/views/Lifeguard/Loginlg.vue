<template>
	<LifeguardNav />
	<div class="wrapper bgd-image">
		<div class="container">
			<div class="container__left">
				<Illustrations name="support" class="illustration" />
				<div class="text-content">
					<h2 class="heading">Welcome back <span>LifeGuard&#174;</span></h2>
					<p class="copy">
						It is nice to have you back. Thank you for your contributions to a better and more healthy society.
					</p>
				</div>
			</div>
			<div class="container__right">
				<LoginlgForm v-if="!isAuthorized" :prev-page="from" />
				<OTPform v-else-if="isAuthorized" />
			</div>
		</div>
	</div>
</template>

<script>
import { mapGetters } from "vuex";
import LoginlgForm from "@/components/forms/Login/Lg-form.vue";
import OTPform from "@/components/forms/Login/otp-form.vue";
import Illustrations from "@/components/illustrations.vue";
import LifeguardNav from "@/components/Navigation/Lifeguardnav.vue";

export default {
	name: "Loginlg",

	components: {
		LoginlgForm,
		OTPform,
        Illustrations,
		LifeguardNav,
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
					if (!this.userProfile.emergency_contacts.length > 0) {
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
    width: min(30.4rem, 100%);
    height: auto;

    @include responsive(small-laptop) {
        width: 75%;
    }
}
</style>