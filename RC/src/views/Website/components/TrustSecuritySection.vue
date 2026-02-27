<template>
	<section class="trust">
		<div class="trust__container">
			<div class="trust__header" :ref="reveal">
				<h2 class="trust__title">Your Health Data, Secured</h2>
			</div>

			<div class="trust__grid">
				<div
					v-for="(pillar, i) in pillars"
					:key="pillar.title"
					class="trust__card"
					:ref="reveal"
					:style="{ transitionDelay: `${i * 100}ms` }"
				>
					<div class="trust__icon-box">
						<v-icon :name="pillar.icon" scale="1.3" />
					</div>
					<h3 class="trust__card-title">{{ pillar.title }}</h3>
					<p class="trust__card-desc">{{ pillar.desc }}</p>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();

const pillars = [
	{
		icon: 'hi-lock-closed',
		title: 'End-to-End Encryption',
		desc: 'All data encrypted in transit and at rest',
	},
	{
		icon: 'hi-shield-check',
		title: 'HIPAA-Aware Infrastructure',
		desc: 'Built with healthcare compliance in mind',
	},
	{
		icon: 'ri-user-follow-line',
		title: 'Verified Specialists',
		desc: 'Every provider is license-verified before activation',
	},
	{
		icon: 'fa-brain',
		title: 'AI Safety Pipeline',
		desc: '7-layer hallucination detection in all AI features',
	},
];
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

// ── Section ──────────────────────────────────────────────────
.trust {
	background: rgba($secondary-bg, 0.5);
	@include section-padding;
}

// ── Container ────────────────────────────────────────────────
.trust__container {
	@include container;
}

// ── Header ───────────────────────────────────────────────────
.trust__header {
	text-align: center;
	margin-bottom: 48px;
	@include reveal-base;
}

.trust__title {
	@include section-title;
}

// ── Grid ─────────────────────────────────────────────────────
.trust__grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 24px;

	@media (max-width: $bp-lg) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: $bp-sm) {
		grid-template-columns: 1fr;
		max-width: 400px;
		margin: 0 auto;
	}
}

// ── Card ─────────────────────────────────────────────────────
.trust__card {
	@include card-glass;
	padding: 32px;
	text-align: center;
	@include reveal-base;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}
}

// ── Icon box ─────────────────────────────────────────────────
.trust__icon-box {
	width: 56px;
	height: 56px;
	border-radius: 16px;
	background: rgba($primary, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 18px;

	.ov-icon {
		color: $primary-dark;
	}
}

// ── Card content ─────────────────────────────────────────────
.trust__card-title {
	font-size: 18px;
	font-weight: 700;
	color: $foreground;
	margin: 0 0 8px;
}

.trust__card-desc {
	font-size: 14px;
	color: $muted-fg;
	line-height: 1.6;
	margin: 0;
}
</style>
