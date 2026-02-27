<template>
	<section class="bento">
		<div class="bento__container">
			<div class="bento__header" :ref="reveal">
				<span class="bento__label">PLATFORM FEATURES</span>
				<h2 class="bento__title">Everything You Need in One Platform</h2>
				<p class="bento__subtitle">
					A complete healthcare ecosystem powered by AI, designed for patients and providers.
				</p>
			</div>

			<div class="bento__grid">
				<div
					v-for="(feature, i) in features"
					:key="feature.title"
					class="bento__card"
					:class="{ 'bento__card--span': feature.span }"
					:ref="reveal"
					:style="{ transitionDelay: `${i * 100}ms` }"
				>
					<div
						class="bento__icon"
						:class="`bento__icon--${feature.accent}`"
					>
						<v-icon :name="feature.icon" scale="1.2" />
					</div>
					<h3 class="bento__card-title">{{ feature.title }}</h3>
					<p class="bento__card-desc">{{ feature.desc }}</p>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();

const features = [
	{
		icon: 'hi-video-camera',
		title: 'Video Consultations',
		desc: 'Connect face-to-face with verified specialists via HD video. Book, consult, and follow up \u2014 all in-app.',
		accent: 'primary',
		span: true,
	},
	{
		icon: 'gi-medicines',
		title: 'Digital Pharmacy',
		desc: 'Browse 3,087+ WHO-listed medications. Order with prescriptions or OTC. Track delivery in real-time.',
		accent: 'emerald',
	},
	{
		icon: 'ri-heart-pulse-line',
		title: 'Health Monitoring',
		desc: 'Track vitals automatically from Apple Watch, Fitbit, Garmin, and more. Charts, trends, and alerts.',
		accent: 'accent',
	},
	{
		icon: 'ri-calendar-check-line',
		title: 'Smart Appointments',
		desc: 'AI matches you with the right specialist. Filter by specialty, language, gender, and availability.',
		accent: 'primary-dark',
	},
	{
		icon: 'ri-message-3-line',
		title: 'Secure Messaging',
		desc: 'Real-time messaging with your care team. Share files, get link previews, and stay connected.',
		accent: 'teal',
	},
	{
		icon: 'ri-wallet-3-line',
		title: 'Wallet & Payments',
		desc: 'One wallet for everything \u2014 consultations, pharmacy, and AI credits. Multi-currency support.',
		accent: 'accent',
		span: true,
	},
];
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

.bento {
	background: $white;
	@include section-padding;
	scroll-margin-top: 80px;
}

.bento__container {
	@include container;
}

// ── Header ──────────────────────────────────────────────────────
.bento__header {
	text-align: center;
	margin-bottom: 64px;
	@include reveal-base;

	@media (max-width: $bp-md) {
		margin-bottom: 40px;
	}
}

.bento__label {
	@include section-label($primary);
}

.bento__title {
	@include section-title;
}

.bento__subtitle {
	@include section-subtitle;
	margin-left: auto;
	margin-right: auto;
}

// ── Bento Grid ──────────────────────────────────────────────────
.bento__grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 24px;
	max-width: 1200px;
	margin: 0 auto;

	@media (max-width: $bp-lg) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: $bp-sm) {
		grid-template-columns: 1fr;
		max-width: 480px;
	}
}

// ── Card ────────────────────────────────────────────────────────
.bento__card {
	@include card-glass;
	@include reveal-base;

	@media (min-width: $bp-lg + 1) {
		&--span {
			grid-column: span 2;
		}
	}

	@media (max-width: $bp-lg) and (min-width: $bp-sm + 1) {
		&--span {
			grid-column: span 2;
		}
	}
}

// ── Icon Container ──────────────────────────────────────────────
.bento__icon {
	width: 48px;
	height: 48px;
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 16px;

	&--primary {
		background: rgba($primary, 0.1);
		color: $primary;
	}

	&--primary-dark {
		background: rgba($primary, 0.1);
		color: $primary-dark;
	}

	&--emerald {
		background: rgba($emerald, 0.1);
		color: $emerald;
	}

	&--accent {
		background: rgba($accent, 0.1);
		color: $accent;
	}

	&--teal {
		background: rgba($teal, 0.1);
		color: $teal;
	}
}

.bento__card-title {
	font-size: 18px;
	font-weight: 700;
	color: $foreground;
	margin: 0 0 10px;
}

.bento__card-desc {
	font-size: 15px;
	color: $muted-fg;
	line-height: 1.65;
	margin: 0;
}
</style>
