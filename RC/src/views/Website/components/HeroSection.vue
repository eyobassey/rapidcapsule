<template>
	<section class="hero">
		<!-- Background blobs -->
		<div class="hero__blobs">
			<div class="hero__blob hero__blob--1"></div>
			<div class="hero__blob hero__blob--2"></div>
			<div class="hero__blob hero__blob--3"></div>
		</div>

		<div class="hero__container">
			<div class="hero__grid">
				<!-- Left column -->
				<div class="hero__content" :ref="reveal">
					<div class="hero__badge">
						<v-icon name="hi-sparkles" scale="0.9" />
						<span>AI-Powered Healthcare Platform</span>
					</div>

					<h1 class="hero__title">
						<span class="hero__title-gradient">Connected Care,</span>
						<br />
						<span>Anytime, Anywhere</span>
					</h1>

					<p class="hero__subtitle">
						Consult verified specialists via video, get AI-powered health assessments with Eka,
						verify prescriptions with RxGPT, and manage your health — all from one secure platform.
					</p>

					<div class="hero__ctas">
						<router-link to="/signup/patient" class="hero__btn-accent">Get Started Free</router-link>
						<button class="hero__btn-glass" @click="scrollTo('#features')">
							<v-icon name="ri-play-circle-fill" scale="1.1" />
							Watch Demo
						</button>
					</div>

					<div class="hero__trust">
						<div v-for="item in trustItems" :key="item.label" class="hero__trust-item">
							<v-icon :name="item.icon" scale="0.9" />
							<span>{{ item.label }}</span>
						</div>
					</div>
				</div>

				<!-- Right column — floating elements -->
				<div class="hero__visual">
					<div class="hero__orb"></div>

					<!-- Eka card -->
					<div class="hero__float-card hero__float-card--eka">
						<div class="hero__float-card-icon hero__float-card-icon--teal">
							<v-icon name="hi-sparkles" scale="0.85" />
						</div>
						<div>
							<p class="hero__float-card-title">Eka AI</p>
							<p class="hero__float-card-desc">How can I help you today?</p>
						</div>
					</div>

					<!-- Verified card -->
					<div class="hero__float-card hero__float-card--verified">
						<div class="hero__float-card-icon hero__float-card-icon--emerald">
							<v-icon name="hi-shield-check" scale="0.7" />
						</div>
						<span class="hero__float-card-verified-text">Verified &#10003;</span>
					</div>

					<!-- Satisfaction card -->
					<div class="hero__float-card hero__float-card--stat">
						<v-icon name="hi-heart" scale="0.9" />
						<span class="hero__float-card-stat-text">98% Satisfaction</span>
					</div>

					<!-- Floating icons -->
					<div class="hero__float-icon hero__float-icon--pill">
						<v-icon name="gi-medicines" scale="1.6" />
					</div>
					<div class="hero__float-icon hero__float-icon--stethoscope">
						<v-icon name="gi-stethoscope" scale="2" />
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();

const trustItems = [
	{ icon: 'gi-medicines', label: '3,087+ Medications' },
	{ icon: 'hi-user-group', label: 'Verified Specialists' },
	{ icon: 'hi-shield-check', label: 'HIPAA-Aware Security' },
	{ icon: 'hi-sparkles', label: 'AI-Powered Diagnosis' },
];

function scrollTo(href) {
	const el = document.querySelector(href);
	if (el) el.scrollIntoView({ behavior: 'smooth' });
}
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

.hero {
	position: relative;
	overflow: hidden;
	padding: 120px 0 80px;

	@media (min-width: $bp-lg) {
		padding: 140px 0 100px;
	}
}

// ── Blobs ───────────────────────────────────────────
.hero__blobs {
	position: absolute;
	inset: 0;
	z-index: 0;
	overflow: hidden;
	pointer-events: none;
}

.hero__blob {
	position: absolute;
	border-radius: 50%;
	filter: blur(64px);
	will-change: transform;

	&--1 {
		width: 600px;
		height: 600px;
		top: -160px;
		right: -160px;
		background: rgba($primary, 0.1);
		animation: blob-float 20s ease-in-out infinite;
	}

	&--2 {
		width: 500px;
		height: 500px;
		bottom: -160px;
		left: -160px;
		background: rgba($teal, 0.08);
		animation: blob-float-reverse 25s ease-in-out infinite;
	}

	&--3 {
		width: 400px;
		height: 400px;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba($accent, 0.05);
		animation: blob-float 20s ease-in-out infinite;
	}
}

// ── Container ───────────────────────────────────────
.hero__container {
	@include container;
	width: 100%;
	position: relative;
	z-index: 1;
}

.hero__grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: 48px;
	align-items: center;

	@media (min-width: $bp-lg) {
		grid-template-columns: 3fr 2fr;
		gap: 64px;
	}
}

// ── Content ─────────────────────────────────────────
.hero__content {
	@include reveal-base;
}

.hero__badge {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 16px;
	border-radius: 50px;
	@include glass;
	font-size: 14px;
	font-weight: 500;
	color: $primary-dark;
	margin-bottom: 24px;
	animation: pulse-glow 3s ease-in-out infinite;
}

.hero__title {
	font-size: 36px;
	font-weight: 800;
	line-height: 1.08;
	letter-spacing: -1px;
	margin: 0 0 24px;
	color: $foreground;
	text-wrap: balance;

	@media (min-width: $bp-sm) {
		font-size: 48px;
	}

	@media (min-width: $bp-lg) {
		font-size: 60px;
	}

	@media (min-width: $bp-xl) {
		font-size: 72px;
	}
}

.hero__title-gradient {
	background: linear-gradient(to right, $primary-dark, $navy);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.hero__subtitle {
	font-size: 18px;
	color: $muted-fg;
	max-width: 560px;
	margin: 0 0 32px;
	line-height: 1.65;

	@media (min-width: $bp-sm) {
		font-size: 20px;
	}

	@media (max-width: $bp-lg) {
		margin-left: auto;
		margin-right: auto;
	}
}

// ── CTAs ────────────────────────────────────────────
.hero__ctas {
	display: flex;
	flex-direction: column;
	gap: 16px;
	margin-bottom: 40px;

	@media (min-width: $bp-sm) {
		flex-direction: row;
	}
}

.hero__btn-accent {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 12px 32px;
	background: linear-gradient(to right, $accent, $accent-dark);
	color: $accent-fg;
	font-size: 16px;
	font-weight: 600;
	border-radius: 50px;
	text-decoration: none;
	box-shadow: 0 10px 15px -3px rgba($accent, 0.25);
	transition: all 0.3s ease;

	&:hover {
		box-shadow: 0 20px 25px -5px rgba($accent, 0.35);
		transform: scale(1.05);
	}
}

.hero__btn-glass {
	@include glass;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 12px 32px;
	font-size: 16px;
	font-weight: 600;
	border-radius: 50px;
	border: 1px solid rgba(255, 255, 255, 0.3);
	cursor: pointer;
	color: $foreground;
	transition: all 0.3s ease;

	.ov-icon {
		color: $primary-dark;
	}

	&:hover {
		background: rgba(255, 255, 255, 0.9);
	}
}

// ── Trust Items ─────────────────────────────────────
.hero__trust {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;

	@media (min-width: $bp-sm) {
		grid-template-columns: repeat(4, 1fr);
	}

	@media (max-width: $bp-lg) {
		max-width: 480px;
		margin: 0 auto;
	}
}

.hero__trust-item {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	color: $muted-fg;

	.ov-icon {
		color: $primary;
		flex-shrink: 0;
	}

	@media (min-width: $bp-sm) {
		font-size: 14px;
	}
}

// ── Visual (right column) ───────────────────────────
.hero__visual {
	position: relative;
	min-height: 400px;
	display: none;
	align-items: center;
	justify-content: center;

	@media (min-width: $bp-lg) {
		display: flex;
	}
}

.hero__orb {
	position: absolute;
	width: 288px;
	height: 288px;
	border-radius: 50%;
	background: linear-gradient(to bottom right, rgba($primary, 0.3), rgba($teal, 0.2));
	filter: blur(40px);
	animation: blob-float 20s ease-in-out infinite;
}

// ── Floating Glass Cards ────────────────────────────
.hero__float-card {
	position: absolute;
	@include card-glass;
	box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
	will-change: transform;

	&--eka {
		top: 32px;
		right: 16px;
		max-width: 200px;
		padding: 16px;
		display: flex;
		align-items: flex-start;
		gap: 8px;
		animation: float-card 6s ease-in-out infinite;
	}

	&--verified {
		bottom: 64px;
		left: 0;
		padding: 12px;
		display: flex;
		align-items: center;
		gap: 8px;
		animation: float-card 7s ease-in-out 0.5s infinite;
	}

	&--stat {
		top: 50%;
		left: 32px;
		padding: 12px;
		display: flex;
		align-items: center;
		gap: 8px;
		animation: float-card 5s ease-in-out 1s infinite;

		.ov-icon {
			color: $accent;
		}
	}
}

.hero__float-card-icon {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;

	&--teal {
		background: rgba($teal, 0.1);
		color: $teal;
	}

	&--emerald {
		width: 24px;
		height: 24px;
		background: rgba($emerald, 0.1);
		color: $emerald;
	}
}

.hero__float-card-title {
	font-size: 14px;
	font-weight: 600;
	margin: 0;
	color: $foreground;
}

.hero__float-card-desc {
	font-size: 12px;
	color: $muted-fg;
	margin: 2px 0 0;
}

.hero__float-card-verified-text {
	font-size: 12px;
	font-weight: 600;
	color: $emerald;
}

.hero__float-card-stat-text {
	font-size: 12px;
	font-weight: 500;
	color: $foreground;
}

// ── Floating icons ──────────────────────────────────
.hero__float-icon {
	position: absolute;

	&--pill {
		top: 80px;
		left: 80px;
		color: rgba($primary, 0.3);
		animation: float-slow 8s ease-in-out infinite;
	}

	&--stethoscope {
		bottom: 128px;
		right: 64px;
		color: rgba($teal, 0.25);
		animation: float-slow 9s ease-in-out 1s infinite;
	}
}

// ── Center text on mobile ───────────────────────────
@media (max-width: $bp-lg) {
	.hero__content {
		text-align: center;
	}
}
</style>
