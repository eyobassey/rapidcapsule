<template>
	<section class="cta">
		<!-- Background blobs -->
		<div class="cta__blobs">
			<div class="cta__blob cta__blob--1"></div>
			<div class="cta__blob cta__blob--2"></div>
			<div class="cta__blob cta__blob--3"></div>
		</div>

		<div class="cta__container" :ref="reveal">
			<h2 class="cta__title">Your Health, Reimagined</h2>
			<p class="cta__subtitle">
				Join thousands using AI-powered healthcare. Start with a free health checkup today.
			</p>

			<div class="cta__buttons">
				<router-link to="/signup/patient" class="cta__btn-accent">
					Get Started Free
				</router-link>
				<a
					href="#eka"
					class="cta__btn-teal"
					@click.prevent="scrollTo('#eka')"
				>
					Talk to Eka Now
				</a>
			</div>

			<p class="cta__footer">
				No credit card required &middot; Free AI health checkups &middot; Cancel anytime
			</p>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();

function scrollTo(href) {
	const el = document.querySelector(href);
	if (el) el.scrollIntoView({ behavior: 'smooth' });
}
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

// ── Section ──────────────────────────────────────────────────
.cta {
	position: relative;
	background: $navy;
	color: $navy-fg;
	padding: 96px 0;
	overflow: hidden;

	@media (min-width: $bp-lg) {
		padding: 128px 0;
	}
}

// ── Background blobs ─────────────────────────────────────────
.cta__blobs {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 0;
}

.cta__blob {
	position: absolute;
	border-radius: 50%;
	filter: blur(120px);

	&--1 {
		width: 400px;
		height: 400px;
		top: -100px;
		left: -100px;
		background: rgba($primary, 0.15);
		animation: blob-float 20s ease-in-out infinite;
	}

	&--2 {
		width: 350px;
		height: 350px;
		bottom: -80px;
		right: -80px;
		background: rgba($teal, 0.1);
		animation: blob-float-reverse 25s ease-in-out infinite;
	}

	&--3 {
		width: 300px;
		height: 300px;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba($accent, 0.1);
		animation: blob-float 22s ease-in-out infinite;
	}
}

// ── Container ────────────────────────────────────────────────
.cta__container {
	max-width: 896px;
	margin: 0 auto;
	padding: 0 $container-px;
	text-align: center;
	position: relative;
	z-index: 1;
	@include reveal-base;

	@media (max-width: $bp-sm) {
		padding: 0 $container-px-sm;
	}

	@media (max-width: $bp-xs) {
		padding: 0 $container-px-xs;
	}
}

// ── Title ────────────────────────────────────────────────────
.cta__title {
	font-size: 30px;
	font-weight: 800;
	color: $white;
	line-height: 1.1;
	letter-spacing: -1px;
	margin: 0 0 20px;

	@media (min-width: $bp-sm) {
		font-size: 36px;
	}

	@media (min-width: $bp-lg) {
		font-size: 60px;
		letter-spacing: -1.5px;
	}
}

// ── Subtitle ─────────────────────────────────────────────────
.cta__subtitle {
	font-size: 18px;
	color: rgba(255, 255, 255, 0.7);
	line-height: 1.65;
	margin: 0 0 40px;
	max-width: 580px;
	margin-left: auto;
	margin-right: auto;

	@media (max-width: $bp-md) {
		font-size: 16px;
		margin-bottom: 32px;
	}
}

// ── Buttons ──────────────────────────────────────────────────
.cta__buttons {
	display: flex;
	gap: 16px;
	justify-content: center;
	flex-wrap: wrap;
	margin-bottom: 28px;

	@media (max-width: $bp-sm) {
		flex-direction: column;
		align-items: stretch;
	}
}

.cta__btn-accent {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 16px 36px;
	font-size: 17px;
	font-weight: 700;
	color: $white;
	background: linear-gradient(to right, $accent, $accent-dark);
	border-radius: 50px;
	text-decoration: none;
	box-shadow: 0 10px 25px rgba($accent, 0.35);
	transition: all 0.3s ease;

	&:hover {
		box-shadow: 0 16px 36px rgba($accent, 0.45);
		transform: scale(1.05);
	}
}

.cta__btn-teal {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 16px 36px;
	font-size: 17px;
	font-weight: 700;
	color: $white;
	background: transparent;
	border: 1px solid rgba($teal, 0.5);
	border-radius: 50px;
	text-decoration: none;
	transition: all 0.3s ease;

	&:hover {
		background: rgba($teal, 0.1);
		border-color: $teal;
	}
}

// ── Footer text ──────────────────────────────────────────────
.cta__footer {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.4);
	margin: 0;
}
</style>
