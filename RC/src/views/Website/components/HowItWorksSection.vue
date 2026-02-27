<template>
	<section class="how">
		<div class="how__container">
			<div class="how__header" :ref="reveal">
				<h2 class="how__title">Your Health Journey in 4 Steps</h2>
			</div>

			<div class="how__grid">
				<div
					v-for="(step, i) in steps"
					:key="step.title"
					class="how__step"
					:ref="reveal"
					:style="{ transitionDelay: `${i * 100}ms` }"
				>
					<!-- Connecting dashed line (desktop only, not on last item) -->
					<div v-if="i < steps.length - 1" class="how__connector" aria-hidden="true"></div>

					<div class="how__number">
						<span>{{ i + 1 }}</span>
					</div>
					<h3 class="how__step-title">{{ step.title }}</h3>
					<p class="how__step-desc">{{ step.desc }}</p>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();

const steps = [
	{
		icon: 'ri-user-add-line',
		title: 'Sign Up Free',
		desc: 'Create your account in under 2 minutes. No credit card required.',
	},
	{
		icon: 'gi-stethoscope',
		title: 'Check Your Health',
		desc: 'Chat with Eka for an AI health assessment or book a specialist directly.',
	},
	{
		icon: 'hi-video-camera',
		title: 'Consult a Specialist',
		desc: 'Video call with a verified doctor. Get prescriptions, notes, and follow-ups.',
	},
	{
		icon: 'hi-cube',
		title: 'Get Your Medications',
		desc: 'Order verified medications from our digital pharmacy. Delivered to your door.',
	},
];
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

.how {
	background: $card-bg;
	@include section-padding;
	scroll-margin-top: 80px;
}

.how__container {
	@include container;
}

// ── Header ──────────────────────────────────────────────────────
.how__header {
	text-align: center;
	margin-bottom: 72px;
	@include reveal-base;

	@media (max-width: $bp-md) {
		margin-bottom: 48px;
	}
}

.how__title {
	@include section-title;
}

// ── Steps Grid ──────────────────────────────────────────────────
.how__grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 32px;
	max-width: 1100px;
	margin: 0 auto;

	@media (max-width: $bp-lg) and (min-width: $bp-sm + 1) {
		grid-template-columns: repeat(2, 1fr);
		max-width: 680px;
	}

	@media (max-width: $bp-sm) {
		grid-template-columns: 1fr;
		max-width: 400px;
	}
}

// ── Step ────────────────────────────────────────────────────────
.how__step {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	position: relative;
	@include reveal-base;
}

// ── Connecting Dashed Line (desktop) ────────────────────────────
.how__connector {
	display: none;

	@media (min-width: $bp-lg + 1) {
		display: block;
		position: absolute;
		top: 32px;
		left: 60%;
		width: 80%;
		height: 0;
		border-top: 2px dashed rgba($primary, 0.15);
		pointer-events: none;
	}
}

// ── Numbered Circle ─────────────────────────────────────────────
.how__number {
	width: 64px;
	height: 64px;
	border-radius: 50%;
	background: linear-gradient(135deg, $primary, $primary-dark);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 20px;
	box-shadow: 0 8px 24px rgba($primary-dark, 0.25);
	position: relative;
	z-index: 2;

	span {
		font-size: 22px;
		font-weight: 800;
		color: $white;
		line-height: 1;
	}
}

.how__step-title {
	font-size: 18px;
	font-weight: 700;
	color: $foreground;
	margin: 0 0 10px;
}

.how__step-desc {
	font-size: 15px;
	color: $muted-fg;
	line-height: 1.65;
	margin: 0;
}
</style>
