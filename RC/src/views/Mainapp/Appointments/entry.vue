<template>
	<div class="entry-container">
		<div class="loader-wrapper" v-if="isLoading">
			<loader :useOverlay="false" style="position: relative" />
		</div>

		<template v-else>
			<!-- User has health data - show quick summary -->
			<div v-if="hasHealthData" class="health-ready-banner">
				<div class="ready-icon">
					<v-icon name="hi-check-circle" scale="2" />
				</div>
				<div class="ready-content">
					<h2 class="ready-title">Your Health Profile is Ready</h2>
					<p class="ready-description">
						Your specialist will have access to your health information to provide better care.
					</p>
					<div class="health-badges">
						<span v-if="healthData.hasCheckups" class="health-badge checkup">
							<v-icon name="hi-clipboard-check" scale="0.7" />
							{{ healthData.checkupCount }} Health Checkup{{ healthData.checkupCount > 1 ? 's' : '' }}
						</span>
						<span v-if="healthData.hasBasicScore" class="health-badge score">
							<v-icon name="hi-heart" scale="0.7" />
							Basic Score: {{ healthData.basicScore }}
						</span>
						<span v-if="healthData.hasAdvancedScore" class="health-badge score advanced">
							<v-icon name="hi-sparkles" scale="0.7" />
							Advanced Score: {{ healthData.advancedScore }}
						</span>
					</div>
				</div>
			</div>

			<!-- User has NO health data - show recommendation -->
			<div v-else class="recommendation-banner">
				<div class="recommendation-visual">
					<div class="visual-circle">
						<div class="visual-icon-wrapper">
							<v-icon name="hi-light-bulb" scale="2.2" />
						</div>
					</div>
					<div class="visual-decoration">
						<span class="decoration-dot"></span>
						<span class="decoration-dot"></span>
						<span class="decoration-dot"></span>
					</div>
				</div>

				<div class="recommendation-header">
					<span class="recommendation-badge">
						<v-icon name="hi-sparkles" scale="0.7" />
						Recommended
					</span>
					<h2 class="recommendation-title">Complete a Health Checkup First</h2>
					<p class="recommendation-subtitle">
						Help your specialist understand your condition better
					</p>
				</div>

				<div class="benefits-grid">
					<div class="benefit-card">
						<div class="benefit-icon">
							<v-icon name="hi-clock" scale="1.2" />
						</div>
						<div class="benefit-text">
							<strong>Save Time</strong>
							<span>Shorter consultations</span>
						</div>
					</div>
					<div class="benefit-card">
						<div class="benefit-icon">
							<v-icon name="hi-user" scale="1.2" />
						</div>
						<div class="benefit-text">
							<strong>Better Prepared</strong>
							<span>Informed specialist</span>
						</div>
					</div>
					<div class="benefit-card">
						<div class="benefit-icon">
							<v-icon name="hi-shield-check" scale="1.2" />
						</div>
						<div class="benefit-text">
							<strong>Better Care</strong>
							<span>Accurate diagnosis</span>
						</div>
					</div>
				</div>

				<p class="skip-note">
					<v-icon name="hi-information-circle" scale="0.8" />
					You can skip this step and book directly if you prefer
				</p>
			</div>
		</template>
	</div>
</template>

<script setup>
import { ref, inject, onMounted } from "vue";
import { useRouter } from "vue-router";
import Loader from "@/components/Loader/main-loader.vue";

const router = useRouter();
const $http = inject('$_HTTP');
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { bookingInfo, useBookingInfo } = inject('$_BOOKING_INFO');

const isLoading = ref(true);
const hasHealthData = ref(false);
const healthData = ref({
	hasCheckups: false,
	checkupCount: 0,
	hasBasicScore: false,
	basicScore: null,
	hasAdvancedScore: false,
	advancedScore: null,
});

onMounted(async () => {
	await checkHealthData();

	// Configure footer buttons based on health data status
	if (hasHealthData.value) {
		useBookingInfo({
			heading: 'Health Profile',
			hasFooter: true,
			proceed: true,
			customActions: null
		});
	} else {
		useBookingInfo({
			heading: 'Health Recommendation',
			hasFooter: true,
			proceed: true,
			customActions: [
				{
					label: 'Take Health Checkup',
					type: 'secondary',
					action: 'healthCheckup'
				},
				{
					label: 'Continue to Booking',
					type: 'primary',
					action: 'continue'
				}
			]
		});
	}
});

async function checkHealthData() {
	isLoading.value = true;
	try {
		// Fetch health checkups
		const checkupsResponse = await $http.$_getHealthCheckups?.({ limit: 10 }).catch(() => ({ data: { data: [] } }));
		const checkups = checkupsResponse?.data?.data || [];

		// Fetch health scores
		const scoresResponse = await $http.$_getHealthScores?.().catch(() => ({ data: { data: {} } }));
		const scores = scoresResponse?.data?.data || {};

		healthData.value = {
			hasCheckups: checkups.length > 0,
			checkupCount: checkups.length,
			hasBasicScore: !!scores.basic_score,
			basicScore: scores.basic_score,
			hasAdvancedScore: !!scores.advanced_score,
			advancedScore: scores.advanced_score,
		};

		hasHealthData.value = healthData.value.hasCheckups || healthData.value.hasBasicScore || healthData.value.hasAdvancedScore;
	} catch (error) {
		console.error('Error checking health data:', error);
		hasHealthData.value = false;
	} finally {
		isLoading.value = false;
	}
}

// Handle custom action events from parent
const handleAction = (action) => {
	if (action === 'healthCheckup') {
		router.push({ name: 'HealthCheckup' });
	} else if (action === 'continue') {
		const { current, from, to } = navigator.value;
		useNavigator({ current, from, to: 1 });
	}
};

// Expose for parent component if needed
defineExpose({ handleAction });
</script>

<style scoped lang="scss">
.entry-container {
	width: 100%;
	max-width: 560px;
	min-height: 320px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	padding: $size-24 $size-32;

	@include responsive(phone) {
		padding: $size-16;
		min-height: auto;
	}
}

.loader-wrapper {
	width: 100%;
	height: 200px;
	display: flex;
	align-items: center;
	justify-content: center;
}

// Health Ready Banner (user has health data)
.health-ready-banner {
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: $size-20;
	padding: $size-32;
	background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
	border: 1px solid rgba(16, 185, 129, 0.3);
	border-radius: $size-16;

	@include responsive(phone) {
		padding: $size-20;
	}
}

.ready-icon {
	width: 64px;
	height: 64px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #dcfce7;
	border-radius: 50%;
	color: #16a34a;
}

.ready-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-12;
}

.ready-title {
	font-size: $size-22;
	font-weight: $fw-semi-bold;
	color: #16a34a;
	margin: 0;

	@include responsive(phone) {
		font-size: $size-20;
	}
}

.ready-description {
	font-size: $size-15;
	color: $color-g-44;
	margin: 0;
	max-width: 400px;
	line-height: 1.5;
}

.health-badges {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: $size-10;
	margin-top: $size-8;
}

.health-badge {
	display: inline-flex;
	align-items: center;
	gap: $size-6;
	padding: $size-8 $size-14;
	border-radius: $size-8;
	font-size: $size-13;
	font-weight: $fw-medium;

	&.checkup {
		background: rgba(14, 174, 196, 0.1);
		color: #0EAEC4;
	}

	&.score {
		background: rgba(16, 185, 129, 0.1);
		color: #16a34a;

		&.advanced {
			background: rgba(139, 92, 246, 0.1);
			color: #8b5cf6;
		}
	}
}

// Recommendation Banner (user has NO health data)
.recommendation-banner {
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-24;
	padding: $size-32 $size-24;
	background: linear-gradient(180deg, #f0fdfa 0%, #ffffff 100%);
	border-radius: $size-20;

	@include responsive(phone) {
		padding: $size-20 $size-16;
		gap: $size-20;
	}
}

.recommendation-visual {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: $size-8;
}

.visual-circle {
	width: 80px;
	height: 80px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
	border-radius: 50%;
	box-shadow: 0 12px 32px rgba(14, 174, 196, 0.25);
}

.visual-icon-wrapper {
	color: white;
}

.visual-decoration {
	position: absolute;
	display: flex;
	gap: $size-4;
	top: -8px;
	right: -16px;
}

.decoration-dot {
	width: 8px;
	height: 8px;
	background: #fbbf24;
	border-radius: 50%;
	animation: pulse 2s ease-in-out infinite;

	&:nth-child(2) {
		animation-delay: 0.3s;
		width: 6px;
		height: 6px;
	}

	&:nth-child(3) {
		animation-delay: 0.6s;
		width: 4px;
		height: 4px;
	}
}

@keyframes pulse {
	0%, 100% { opacity: 1; transform: scale(1); }
	50% { opacity: 0.6; transform: scale(0.9); }
}

.recommendation-header {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-10;
	text-align: center;
}

.recommendation-badge {
	display: inline-flex;
	align-items: center;
	gap: $size-4;
	padding: $size-6 $size-14;
	background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
	color: white;
	font-size: $size-11;
	font-weight: $fw-semi-bold;
	border-radius: $size-16;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.recommendation-title {
	font-size: $size-22;
	font-weight: $fw-bold;
	color: $color-g-21;
	margin: 0;
	line-height: 1.3;

	@include responsive(phone) {
		font-size: $size-20;
	}
}

.recommendation-subtitle {
	font-size: $size-15;
	color: $color-g-44;
	margin: 0;
	line-height: 1.5;
}

.benefits-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: $size-12;
	width: 100%;

	@include responsive(phone) {
		grid-template-columns: 1fr;
		gap: $size-10;
	}
}

.benefit-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-10;
	padding: $size-16 $size-12;
	background: white;
	border-radius: $size-12;
	border: 1px solid $color-g-92;
	transition: all 0.2s ease;

	&:hover {
		border-color: #0EAEC4;
		box-shadow: 0 4px 16px rgba(14, 174, 196, 0.1);
	}

	@include responsive(phone) {
		flex-direction: row;
		padding: $size-14 $size-16;
		gap: $size-14;
	}
}

.benefit-icon {
	width: 44px;
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, rgba(14, 174, 196, 0.1) 0%, rgba(14, 174, 196, 0.05) 100%);
	border-radius: $size-10;
	color: #0EAEC4;

	@include responsive(phone) {
		width: 40px;
		height: 40px;
		flex-shrink: 0;
	}
}

.benefit-text {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-2;

	strong {
		font-size: $size-14;
		font-weight: $fw-semi-bold;
		color: $color-g-21;
	}

	span {
		font-size: $size-12;
		color: $color-g-54;
	}

	@include responsive(phone) {
		align-items: flex-start;
	}
}

.skip-note {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $size-6;
	font-size: $size-13;
	color: $color-g-54;
	margin: 0;
	padding-top: $size-8;

	svg {
		color: $color-g-54;
	}
}
</style>
