<template>
	<section class="stats-bar">
		<div class="stats-bar__overlay"></div>
		<div class="stats-bar__container">
			<div class="stats-bar__grid">
				<div
					v-for="(stat, i) in stats"
					:key="stat.label"
					class="stats-bar__item"
					:ref="reveal"
					:style="{ transitionDelay: `${i * 100}ms` }"
				>
					<span class="stats-bar__value">{{ stat.value }}</span>
					<span class="stats-bar__label">{{ stat.label }}</span>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();

const stats = [
	{ value: '3,087+', label: 'Medications Available' },
	{ value: '24/7', label: 'AI Health Assistant' },
	{ value: '6', label: 'Clinical Databases Verified' },
	{ value: '98%', label: 'Patient Satisfaction' },
];
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

// ── Section ──────────────────────────────────────────────────
.stats-bar {
	position: relative;
	background: linear-gradient(to right, $primary, $teal);
	padding: 64px 0;
	overflow: hidden;
}

// ── Overlay gradient ─────────────────────────────────────────
.stats-bar__overlay {
	position: absolute;
	inset: 0;
	background: linear-gradient(to right, rgba($primary-dark, 0.2), rgba($teal, 0.2));
	pointer-events: none;
}

// ── Container ────────────────────────────────────────────────
.stats-bar__container {
	@include container;
	position: relative;
	z-index: 1;
}

// ── Grid ─────────────────────────────────────────────────────
.stats-bar__grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 32px;

	@media (max-width: $bp-lg) {
		grid-template-columns: repeat(2, 1fr);
		gap: 40px 24px;
	}
}

// ── Item ─────────────────────────────────────────────────────
.stats-bar__item {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 8px;
	@include reveal-base;
}

// ── Value ────────────────────────────────────────────────────
.stats-bar__value {
	font-size: 30px;
	font-weight: 800;
	color: $white;
	line-height: 1;
	letter-spacing: -1px;

	@media (min-width: $bp-sm) {
		font-size: 36px;
	}

	@media (min-width: $bp-lg) {
		font-size: 48px;
		letter-spacing: -1.5px;
	}
}

// ── Label ────────────────────────────────────────────────────
.stats-bar__label {
	font-size: 14px;
	font-weight: 500;
	color: rgba(255, 255, 255, 0.7);
}
</style>
