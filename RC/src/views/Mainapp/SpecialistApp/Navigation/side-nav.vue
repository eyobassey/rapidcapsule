<template>
	<div class="nav-container" :class="{ 'onboarding-mode': !isOnboardingComplete }">
		<div class="nav-logo">
			<div class="logo"><Logos name="logo-full-color" /></div>
			<Icons name="chevron-left" id="close" @click="$emit('closeSideNav')" />
		</div>

		<!-- Onboarding Mode: Show setup steps -->
		<div v-if="!isOnboardingComplete" class="nav onboarding-nav">
			<!-- Main Menu (Disabled during onboarding) -->
			<div class="nav__section">
				<h3 class="nav__section-title">MAIN MENU</h3>
				<div class="nav__primary">
					<router-link
						class="nav__item nav__item--parent"
						:class="{ 'active__parent': isOnboardingRoute }"
						to="/app/specialist/onboarding/dashboard"
						@click="$emit('closeSideNav')"
					>
						<div class="nav__item--icon-main icon-vue">
							<v-icon name="fa-rocket" scale="1.1" />
						</div>
						<p>Setup Dashboard</p>
					</router-link>

					<div
						class="nav__item nav__item--parent disabled"
						v-for="item in disabledNavItems"
						:key="item.label"
					>
						<div class="nav__item--icon-main icon-vue">
							<v-icon :name="item.vicon" scale="1.1" />
						</div>
						<p>{{ item.label }}</p>
						<span class="locked-badge">
							<v-icon name="hi-lock-closed" scale="0.6" />
						</span>
					</div>
				</div>
			</div>

			<!-- Setup Steps -->
			<div class="nav__section setup-steps">
				<h3 class="nav__section-title">SETUP STEPS</h3>
				<div class="steps-list">
					<div
						v-for="step in visibleSteps"
						:key="step.number"
						class="step-row"
						:class="getStepRowClass(step.number)"
						@click="handleStepClick(step)"
					>
						<div class="step-indicator" :class="getIndicatorClass(step.number)">
							<v-icon
								v-if="getStepStatus(step.number) === 'completed'"
								name="hi-check"
								scale="0.5"
							/>
							<span v-else>{{ step.number }}</span>
						</div>
						<span class="step-name">{{ step.name }}</span>
					</div>
				</div>
			</div>

			<!-- Settings at bottom -->
			<div class="nav__secondary">
				<div class="nav__item nav__item--parent disabled">
					<div class="nav__item--icon-main icon-vue">
						<v-icon name="hi-cog" scale="1.1" />
					</div>
					<p>Settings</p>
				</div>
			</div>
		</div>

		<!-- Normal Mode: Full navigation -->
		<div v-else class="nav">
			<div class="nav__primary">
				<div
					class="nav__item nav__item--container"
					v-for="item of primaryNav"
					:key="item.label"
				>
					<div
						class="nav__item nav__item--parent"
						v-if="item.link == ''"
						@click="expandLink(item)"
						:class="{ active__parent: item.children.some((el) => el.link == getRoute) }"
					>
						<div class="nav__item--icon-main"><Icons :name="item.icon" /></div>
						<p>{{ item.label }}</p>

						<div class="nav__item--icon-expand" v-if="item.children.length">
							<Icons name="arrow-up" v-if="item.isExpanded" />
							<Icons name="arrow-down" v-if="!item.isExpanded" />
						</div>
					</div>
					<router-link
						v-else
						class="nav__item nav__item--parent"
						:class="{ active__parent: getRoute == item.link || (item.matchRoutes && item.matchRoutes.some(r => getRoute.startsWith(r))) }"
						:to="item.children.length ? isSelected : item.link"
						@click="$emit('closeSideNav')"
					>
						<div class="nav__item--icon-main"><Icons :name="item.icon" /></div>
						<p>{{ item.label }}</p>
					</router-link>

					<div
						class="nav__item nav__item--child-container"
						v-if="item.children.length"
						:class="{ open: item.isExpanded }"
					>
						<div v-for="child of item.children" :key="child.label">
							<router-link
								:class="{ active__child: getRoute == child.link }"
								:to="child.link"
								class="nav__item nav__item--child"
								@click="$emit('closeSideNav')"
							>
								{{ child.label }}
							</router-link>
						</div>
					</div>
				</div>
			</div>
			<div class="nav__secondary">
				<router-link
					class="nav__item nav__item--parent"
					:class="{ active__parent: getRoute == item.link || (item.matchRoutes && item.matchRoutes.some(r => getRoute.startsWith(r))) }"
					v-for="item of secondaryNav"
					:key="item.label"
					:to="item.link"
					@click="$emit('closeSideNav')"
				>
					<div class="nav__item--icon-main">
						<Icons :name="item.icon" />
					</div>
					<p>{{ item.label }}</p>
				</router-link>
			</div>
		</div>
	</div>
</template>

<script>
import Icons from "@/components/icons.vue";
import Logos from "@/components/logos.vue";
import { mapGetters } from "vuex";

export default {
	data() {
		return {
			primaryNav: [
				{ link: "/app/specialist/specialist-dashboard", label: "Dashboard", children: [], icon: "home" },
				// NOTE: Old Appointments v1 ("/app/specialist/specialist-appointments") has been deprecated.
				// We now use Appointments v2 below. See /views/Mainapp/SpecialistApp/Appointments/ for legacy code.
				{
					link: "/app/specialist/appointments-v2",
					label: "Appointments",
					children: [],
					icon: "calendar",
					matchRoutes: ["/app/specialist/appointments-v2"]
				},
				{
					link: "",
					label: "Patients",
					children: [
						{ link: "/app/specialist/patients", label: "My Patients" },
						{ link: "/app/specialist/patients/all", label: "All Patients" },
						{ link: "/app/specialist/patients/starred", label: "Starred" }
					],
					icon: "users",
					isExpanded: false
				},
				{
					link: "",
					label: "Clinical Notes",
					children: [
						{ link: "/app/specialist/clinical-notes", label: "All Notes" },
						{ link: "/app/specialist/clinical-notes/templates", label: "Templates" }
					],
					icon: "list",
					isExpanded: false
				},
				{
					link: "",
					label: "Pharmacy",
					children: [
						{ link: "/app/specialist/pharmacy", label: "Dashboard" },
						{ link: "/app/specialist/pharmacy/patients", label: "Patients" },
						{ link: "/app/specialist/pharmacy/drugs", label: "Drug Catalog" },
						{ link: "/app/specialist/pharmacy/prescriptions", label: "Prescriptions" }
					],
					icon: "pill",
					isExpanded: false
				},
			],
			secondaryNav: [
				{
					link: "/app/specialist/onboarding/dashboard",
					label: "Practice Settings",
					icon: "cog-wheel",
					matchRoutes: ["/app/specialist/onboarding"]
				},
				{ link: "/app/specialist/specialist-account", label: "Account", icon: "user" },
			],
			disabledNavItems: [
				{ label: "Appointments", vicon: "ri-calendar-check-line" },
				{ label: "Patient Queue", vicon: "hi-user-group" },
				{ label: "Earnings", vicon: "bi-wallet2" },
			],
			setupSteps: [
				{ number: 1, name: "Account Creation", key: "accountCreation", route: null },
				{ number: 2, name: "My Practice", key: "quickBio", route: "SpecialistQuickBio" },
				{ number: 3, name: "Setup Dashboard", key: "setupDashboard", route: "SpecialistSetupDashboard" },
				{ number: 4, name: "Profile Config", key: "profileConfig", route: "SpecialistProfileConfig" },
				{ number: 5, name: "Availability", key: "availability", route: "SpecialistAvailability" },
				{ number: 6, name: "Rate Cards", key: "rateCards", route: "SpecialistRates" },
				{ number: 7, name: "Identity & Compliance", key: "verification", route: "SpecialistVerification" },
				{ number: 8, name: "Security & Prefs", key: "security", route: "SpecialistSecurity" },
				{ number: 9, name: "Review & Activation", key: "review", route: "SpecialistReview" },
			],
			stepCompletion: {},
			currentStep: 3,
		};
	},

	computed: {
		...mapGetters(["userprofile"]),

		getRoute() {
			return this.$route.path;
		},

		isOnboardingRoute() {
			return this.getRoute.includes('/onboarding');
		},

		isOnboardingComplete() {
			if (this.userprofile?.onboarding_completed) {
				return true;
			}
			const saved = localStorage.getItem('specialist_onboarding_state');
			if (saved) {
				try {
					const state = JSON.parse(saved);
					return state.stepCompletion?.review === true;
				} catch (e) {
					return false;
				}
			}
			return false;
		},

		// Show steps 2-9 (skip account creation which is signup-only)
		visibleSteps() {
			return this.setupSteps.filter(s => s.number >= 2);
		},
	},

	mounted() {
		this.loadOnboardingProgress();
	},

	emits: ["closeSideNav"],

	methods: {
		expandLink(item) {
			if (item.children.length) {
				item.isExpanded = !item.isExpanded;
			}
		},

		loadOnboardingProgress() {
			const saved = localStorage.getItem('specialist_onboarding_state');
			if (saved) {
				try {
					const state = JSON.parse(saved);
					this.stepCompletion = state.stepCompletion || {};
					this.currentStep = state.currentStep || 3;
				} catch (e) {
					console.error('Failed to load onboarding state:', e);
				}
			}
		},

		getStepStatus(stepNum) {
			const step = this.setupSteps.find(s => s.number === stepNum);
			if (!step) return 'locked';

			if (this.stepCompletion[step.key]) return 'completed';
			if (this.currentStep === stepNum) return 'current';
			if (!this.isStepAccessible(stepNum)) return 'locked';
			return 'pending';
		},

		isStepAccessible(stepNum) {
			// Steps 2-8 are freely accessible (specialists can revisit any section)
			if (stepNum >= 2 && stepNum <= 8) return true;
			// Step 9 (Review & Activation) requires verification to be completed
			if (stepNum === 9) {
				return this.stepCompletion.verification === true;
			}
			// Step 1 (Account Creation) is signup-only, not revisitable
			return stepNum >= 2;
		},

		getIndicatorClass(stepNum) {
			const status = this.getStepStatus(stepNum);
			return {
				completed: status === 'completed',
				current: status === 'current',
				pending: status === 'pending',
				locked: status === 'locked',
			};
		},

		getStepRowClass(stepNum) {
			const status = this.getStepStatus(stepNum);
			return {
				'is-completed': status === 'completed',
				'is-current': status === 'current',
				'is-locked': status === 'locked',
				'is-clickable': this.isStepAccessible(stepNum) && stepNum >= 3,
			};
		},

		getLabelClass(stepNum) {
			const status = this.getStepStatus(stepNum);
			return {
				'is-completed': status === 'completed',
				'is-current': status === 'current',
				'is-locked': status === 'locked',
			};
		},

		handleStepClick(step) {
			if (step.route && this.isStepAccessible(step.number)) {
				this.$router.push({ name: step.route });
				this.$emit('closeSideNav');
			}
		},
	},

	components: {
		Icons,
		Logos,
	},
};
</script>

<style scoped lang="scss">
.nav-container {
	@include flexItem(vertical) {
		flex-shrink: 0;
		padding: $size-32 $size-0;
		border-right: $size-1 solid $color-g-85;
		background-color: $color-white;
		height: 100%;
		width: 260px;

		@include responsive(tab-landscape) {
			position: absolute;
			top: $size-0;
			left: -100%;
			transition: all 400ms ease-out;
			z-index: 100;
			padding-top: $size-18;

			&.open {
				left: 0;
				box-shadow: $size-4 $size-0 $size-44 rgba($color-black, 0.25);
			}
		}
	}
}

#close {
	display: none;
	fill: $color-g-77;

	@include responsive(tab-landscape) {
		display: block;
	}
}

.nav-logo {
	@include flexItem(horizontal) {
		align-items: center;
		gap: $size-16;
		height: 5rem;
		padding-left: 1.5rem;
		padding-right: $size-24;
		margin-bottom: $size-16;
	}

	.logo {
		flex-grow: 1;
	}
}

.nav {
	@include flexItem(vertical) {
		height: 100%;
		gap: $size-32;
	}

	&__primary {
		height: 100%;
	}

	&__secondary {
		padding-top: $size-16;
		border-top: 1px solid $color-g-90;
	}

	&__section {
		margin-bottom: $size-16;
	}

	&__section-title {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #94A3B8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: $size-8;
		padding: 0 1.5rem;
	}
}

.onboarding-nav {
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow-y: auto;

	.nav__secondary {
		margin-top: auto;
		padding: $size-16 0;
	}
}

.nav__item {
	display: flex;

	&--container {
		flex-direction: column;
	}

	&--parent {
		position: relative;
		align-items: center;
		gap: $size-8;
		padding: 0.5rem 1rem 0.5rem 1.5rem;
		cursor: pointer;
		text-decoration: none;

		& p {
			font-size: 0.875rem;
			font-weight: 500;
			line-height: 1.4;
			color: #334155;
		}

		&:hover:not(.disabled) {
			background-color: #F1F5F9;
		}

		&.disabled {
			cursor: not-allowed;

			p {
				color: #94A3B8;
			}
		}
	}

	&--child-container {
		display: none;
	}

	&--child {
		gap: $size-8;
		padding: $size-18 $size-16 $size-18 $size-72;
		cursor: pointer;
		background-color: $color-g-97;
		text-decoration: none;

		&:hover {
			background-color: $color-g-90;
		}
	}

	&--icon-main,
	&--icon-expand {
		@include flexItem(horizontal) {
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
		}
	}

	&--icon-main > .icons {
		width: 24px;
		height: 24px;
		fill: #64748B;
	}

	&--icon-main.icon-vue {
		color: #64748B;
	}

	&.disabled &--icon-main.icon-vue {
		color: #94A3B8;
	}
}

.locked-badge {
	margin-left: auto;
	color: #CBD5E1;
}

.open {
	@include flexItem(vertical);
}

.active__parent {
	background-color: rgba(79, 195, 247, 0.08);

	&:before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		width: 3px;
		height: 100%;
		background-color: #4FC3F7;
	}

	p {
		color: #0288D1 !important;
		font-weight: 600 !important;
	}

	.icon-vue {
		color: #0288D1 !important;
	}
}

.active__child {
	background-color: $color-g-90;
}

/* Setup Steps - Clean List Style */
.setup-steps {
	flex: 1;
	overflow-y: auto;
}

.steps-list {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.step-row {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	padding: 0.5rem 1.5rem;
	transition: all 0.15s ease;

	&.is-clickable {
		cursor: pointer;

		&:hover {
			background-color: #F1F5F9;
		}
	}

	&.is-current {
		background-color: rgba(79, 195, 247, 0.08);

		.step-indicator {
			background: #4FC3F7;
			color: white;
			box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.2);
		}

		.step-name {
			color: #0288D1;
			font-weight: 600;
		}
	}

	&.is-completed {
		.step-name {
			color: #64748B;
		}
	}

	&.is-locked {
		opacity: 0.5;
		cursor: not-allowed;
	}
}

.step-indicator {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.6875rem;
	font-weight: 600;
	flex-shrink: 0;
	background: #E2E8F0;
	color: #64748B;
	transition: all 0.15s ease;

	&.completed {
		background: #10B981;
		color: white;
	}

	&.current {
		background: #4FC3F7;
		color: white;
	}

	&.locked {
		background: #F1F5F9;
		color: #CBD5E1;
	}
}

.step-name {
	font-size: 0.8125rem;
	font-weight: 500;
	color: #64748B;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
</style>
