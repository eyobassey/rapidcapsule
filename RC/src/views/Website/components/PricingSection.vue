<template>
	<section id="pricing" class="pricing">
		<div class="pricing__container">
			<div class="pricing__header" :ref="reveal">
				<h2 class="pricing__title">Simple, Transparent Pricing</h2>
			</div>

			<div class="pricing__grid">
				<!-- Patient Card -->
				<div class="pricing-card" :ref="reveal">
					<h3 class="pricing-card__name">For Patients</h3>
					<p class="pricing-card__tagline">Pay Per Consultation</p>

					<div class="pricing-card__price">
						<span class="pricing-card__amount">$15</span>
						<span class="pricing-card__period">/consultation</span>
					</div>

					<ul class="pricing-card__features">
						<li v-for="f in patientFeatures" :key="f">
							<v-icon name="hi-check-circle" scale="0.9" class="pricing-card__check pricing-card__check--emerald" />
							<span>{{ f }}</span>
						</li>
					</ul>

					<router-link to="/signup/patient" class="pricing-card__cta pricing-card__cta--accent">
						Get Started Free
					</router-link>
				</div>

				<!-- Specialist Card -->
				<div
					class="pricing-card pricing-card--featured"
					:ref="reveal"
					:style="{ transitionDelay: '120ms' }"
				>
					<span class="pricing-card__badge">Featured</span>

					<h3 class="pricing-card__name">For Specialists</h3>
					<p class="pricing-card__tagline">Earn Per Consultation</p>

					<div class="pricing-card__price">
						<span class="pricing-card__amount">15%</span>
						<span class="pricing-card__period">per session</span>
					</div>

					<ul class="pricing-card__features">
						<li v-for="f in specialistFeatures" :key="f">
							<v-icon name="hi-check-circle" scale="0.9" class="pricing-card__check pricing-card__check--primary" />
							<span>{{ f }}</span>
						</li>
					</ul>

					<router-link to="/signup/specialist" class="pricing-card__cta pricing-card__cta--teal">
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
	'Free Eka access',
	'Pay only when you consult',
	'Digital pharmacy access',
	'Prescription verification',
	'Health monitoring',
	'Wallet credits',
];

const specialistFeatures = [
	'Set your own rates',
	'RxGPT AI assistant',
	'Patient management tools',
	'Clinical notes system',
	'Earnings dashboard',
	'Bank payouts',
	'No upfront fees',
];
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

// ── Section ──────────────────────────────────────────────────
.pricing {
	@include section-padding;
}

// ── Container ────────────────────────────────────────────────
.pricing__container {
	max-width: 960px;
	margin: 0 auto;
	padding: 0 $container-px;

	@media (max-width: $bp-sm) {
		padding: 0 $container-px-sm;
	}

	@media (max-width: $bp-xs) {
		padding: 0 $container-px-xs;
	}
}

// ── Header ───────────────────────────────────────────────────
.pricing__header {
	text-align: center;
	margin-bottom: 56px;
	@include reveal-base;

	@media (max-width: $bp-md) {
		margin-bottom: 40px;
	}
}

.pricing__title {
	@include section-title;
}

// ── Grid ─────────────────────────────────────────────────────
.pricing__grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 32px;

	@media (max-width: $bp-md) {
		grid-template-columns: 1fr;
		max-width: 460px;
		margin: 0 auto;
	}
}

// ── Card ─────────────────────────────────────────────────────
.pricing-card {
	position: relative;
	@include card-glass;
	padding: 32px;
	@include reveal-base;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	&--featured {
		box-shadow: 0 0 0 2px rgba($primary, 0.3);
	}
}

// ── Featured badge ───────────────────────────────────────────
.pricing-card__badge {
	position: absolute;
	top: -12px;
	left: 50%;
	transform: translateX(-50%);
	padding: 6px 20px;
	background: linear-gradient(to right, $primary, $primary-dark);
	color: $white;
	font-size: 13px;
	font-weight: 700;
	border-radius: 50px;
	white-space: nowrap;
}

// ── Card content ─────────────────────────────────────────────
.pricing-card__name {
	font-size: 24px;
	font-weight: 800;
	color: $foreground;
	margin: 0 0 4px;
}

.pricing-card__tagline {
	font-size: 15px;
	color: $muted-fg;
	margin: 0 0 24px;
}

.pricing-card__price {
	display: flex;
	align-items: baseline;
	gap: 4px;
	margin-bottom: 28px;
	padding-bottom: 24px;
	border-bottom: 1px solid $border;
}

.pricing-card__amount {
	font-size: 36px;
	font-weight: 800;
	color: $foreground;
	letter-spacing: -0.5px;
}

.pricing-card__period {
	font-size: 15px;
	color: $muted-fg;
}

// ── Feature list ─────────────────────────────────────────────
.pricing-card__features {
	list-style: none;
	padding: 0;
	margin: 0 0 32px;
	display: flex;
	flex-direction: column;
	gap: 14px;

	li {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 15px;
		color: $foreground;
		line-height: 1.4;
	}
}

.pricing-card__check {
	flex-shrink: 0;

	&--emerald {
		color: $emerald;
	}

	&--primary {
		color: $primary;
	}
}

// ── CTA buttons ──────────────────────────────────────────────
.pricing-card__cta {
	display: block;
	text-align: center;
	padding: 14px 32px;
	border-radius: 50px;
	font-size: 16px;
	font-weight: 700;
	text-decoration: none;
	color: $white;
	transition: all 0.3s ease;

	&--accent {
		background: linear-gradient(to right, $accent, $accent-dark);
		box-shadow: 0 8px 20px rgba($accent, 0.25);

		&:hover {
			box-shadow: 0 12px 28px rgba($accent, 0.35);
			transform: translateY(-2px);
		}
	}

	&--teal {
		background: linear-gradient(to right, $teal, $primary-dark);
		box-shadow: 0 8px 20px rgba($teal, 0.25);

		&:hover {
			box-shadow: 0 12px 28px rgba($teal, 0.35);
			transform: translateY(-2px);
		}
	}
}
</style>
