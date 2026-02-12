<template>
	<section class="pricing" id="pricing">
		<div class="pricing__container">
			<div class="pricing__header" :ref="reveal">
				<span class="pricing__label">Plans</span>
				<h2 class="pricing__title">Transparent Pricing</h2>
				<p class="pricing__subtitle">Choose the plan that works for you</p>
			</div>

			<div class="pricing__grid">
				<!-- Patient Card -->
				<div class="pricing-card pricing-card--patient" :ref="reveal">
					<div class="pricing-card__icon-box pricing-card__icon-box--patient">
						<v-icon name="hi-user" scale="1.4" />
					</div>
					<h3 class="pricing-card__title">For Patients</h3>
					<p class="pricing-card__subtitle">Pay only when you need care</p>

					<ul class="pricing-card__features">
						<li v-for="feature in patientFeatures" :key="feature" class="pricing-card__feature">
							<span class="pricing-card__check">
								<v-icon name="hi-check" scale="0.8" />
							</span>
							<span>{{ feature }}</span>
						</li>
					</ul>

					<div class="pricing-card__price">
						<span class="pricing-card__amount">From $15</span>
						<span class="pricing-card__period">per consultation</span>
					</div>

					<router-link to="/signup/patient" class="pricing-card__cta pricing-card__cta--primary">
						Get Started Free
					</router-link>
				</div>

				<!-- Specialist Card -->
				<div class="pricing-card pricing-card--specialist" :ref="reveal">
					<div class="pricing-card__badge">Popular</div>
					<div class="pricing-card__icon-box pricing-card__icon-box--specialist">
						<v-icon name="fa-stethoscope" scale="1.4" />
					</div>
					<h3 class="pricing-card__title">For Specialists</h3>
					<p class="pricing-card__subtitle">Grow your practice with us</p>

					<ul class="pricing-card__features">
						<li v-for="feature in specialistFeatures" :key="feature" class="pricing-card__feature">
							<span class="pricing-card__check">
								<v-icon name="hi-check" scale="0.8" />
							</span>
							<span>{{ feature }}</span>
						</li>
					</ul>

					<div class="pricing-card__price">
						<span class="pricing-card__amount">15% Fee</span>
						<span class="pricing-card__period">per completed consultation</span>
					</div>

					<router-link to="/signup/specialist" class="pricing-card__cta pricing-card__cta--primary">
						Join as Specialist
					</router-link>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();

const patientFeatures = [
	'Free AI health checkups',
	'Pay-per-consultation pricing',
	'Digital wallet top-up',
	'Referral reward credits',
	'RxGPT prescription verification',
];

const specialistFeatures = [
	'Set your own consultation rates',
	'Patient management dashboard',
	'RxGPT AI prescription assistant',
	'Revenue analytics & reporting',
	'Marketing & patient matching',
];
</script>

<style scoped lang="scss">
// Design tokens
$primary: #4fc3f7;
$primary-dark: #0288d1;
$primary-light: #e1f5fe;
$secondary: #FF5C00;
$secondary-dark: #E05000;
$navy: #0f172a;
$slate: #334155;
$gray: #475569;
$emerald: #10b981;
$bg: #f8fafc;

.pricing {
	background: $bg;
	padding: 96px 0;
	scroll-margin-top: 80px;

	@media (max-width: 768px) {
		padding: 64px 0;
	}
}

.pricing__container {
	max-width: 1600px;
	margin: 0 auto;
	padding: 0 32px;

	@media (max-width: 768px) {
		padding: 0 16px;
	}
}

// Header
.pricing__header {
	text-align: center;
	margin-bottom: 64px;
	opacity: 0;
	transform: translateY(24px);
	transition: opacity 0.6s ease, transform 0.6s ease;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	@media (max-width: 768px) {
		margin-bottom: 40px;
	}
}

.pricing__label {
	display: inline-block;
	padding: 6px 18px;
	background: $primary-light;
	color: $primary-dark;
	font-size: 14px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	border-radius: 50px;
	margin-bottom: 16px;
}

.pricing__title {
	font-size: 52px;
	font-weight: 800;
	color: $navy;
	letter-spacing: -1px;
	margin: 0 0 16px;

	@media (max-width: 768px) {
		font-size: 36px;
	}
}

.pricing__subtitle {
	font-size: 20px;
	color: $gray;
	line-height: 1.6;
	margin: 0;
	max-width: 520px;
	margin-left: auto;
	margin-right: auto;

	@media (max-width: 768px) {
		font-size: 16px;
	}
}

// Grid
.pricing__grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 32px;
	max-width: 1100px;
	margin: 0 auto;

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		max-width: 480px;
	}
}

// Card
.pricing-card {
	position: relative;
	background: #fff;
	border-radius: 24px;
	border: 2px solid transparent;
	padding: 40px 32px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
	transition: transform 0.3s ease, box-shadow 0.3s ease;
	opacity: 0;
	transform: translateY(24px);
	transition: opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	&:hover {
		transform: translateY(-6px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
	}

	&.revealed:hover {
		transform: translateY(-6px);
	}

	&--patient {
		border-color: $primary;
	}

	&--specialist {
		border-color: $secondary;
	}

	@media (max-width: 768px) {
		padding: 32px 24px;
	}
}

// Popular badge
.pricing-card__badge {
	position: absolute;
	top: -14px;
	right: 24px;
	padding: 6px 20px;
	background: $secondary;
	color: #fff;
	font-size: 13px;
	font-weight: 700;
	border-radius: 50px;
	letter-spacing: 0.3px;
	box-shadow: 0 4px 12px rgba($secondary, 0.35);
}

// Icon box
.pricing-card__icon-box {
	width: 56px;
	height: 56px;
	border-radius: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 20px;

	&--patient {
		background: linear-gradient(135deg, $primary-light, lighten($primary, 18%));
		color: $primary-dark;
	}

	&--specialist {
		background: linear-gradient(135deg, #fff3e0, lighten($secondary, 28%));
		color: $secondary-dark;
	}
}

// Title and subtitle
.pricing-card__title {
	font-size: 26px;
	font-weight: 800;
	color: $navy;
	margin: 0 0 8px;
}

.pricing-card__subtitle {
	font-size: 15px;
	color: $gray;
	margin: 0 0 28px;
	line-height: 1.5;
}

// Feature list
.pricing-card__features {
	list-style: none;
	padding: 0;
	margin: 0 0 32px;
	display: flex;
	flex-direction: column;
	gap: 14px;
}

.pricing-card__feature {
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 16px;
	color: $slate;
	line-height: 1.4;
}

.pricing-card__check {
	width: 24px;
	height: 24px;
	border-radius: 50%;
	background: rgba($emerald, 0.12);
	color: $emerald;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

// Price
.pricing-card__price {
	display: flex;
	align-items: baseline;
	gap: 8px;
	margin-bottom: 28px;
	padding-top: 24px;
	border-top: 1px solid #f1f5f9;
}

.pricing-card__amount {
	font-size: 36px;
	font-weight: 800;
	color: $navy;
	letter-spacing: -0.5px;
}

.pricing-card__period {
	font-size: 15px;
	color: $gray;
}

// CTA button
.pricing-card__cta {
	display: block;
	text-align: center;
	padding: 16px 32px;
	border-radius: 50px;
	font-size: 16px;
	font-weight: 700;
	text-decoration: none;
	transition: all 0.25s ease;

	&--primary {
		background: $secondary;
		color: #fff;
		box-shadow: 0 6px 20px rgba($secondary, 0.3);

		&:hover {
			background: $secondary-dark;
			transform: translateY(-2px);
			box-shadow: 0 8px 28px rgba($secondary, 0.4);
		}
	}
}
</style>
