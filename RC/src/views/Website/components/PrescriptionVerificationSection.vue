<template>
	<section class="rx-verify">
		<div class="rx-verify__container">
			<div class="rx-verify__header" :ref="reveal">
				<span class="rx-verify__label">PRESCRIPTION VERIFICATION</span>
				<h2 class="rx-verify__title">Upload, Verify, Trust</h2>
				<p class="rx-verify__subtitle">
					Upload any prescription image and our 3-tier AI verification system checks
					authenticity, validates medications, and detects potential issues in seconds.
				</p>
			</div>

			<div class="rx-verify__steps">
				<template v-for="(step, i) in steps" :key="step.title">
					<div
						class="rx-verify__card"
						:ref="reveal"
						:style="{ transitionDelay: `${i * 100 + 100}ms` }"
					>
						<div class="rx-verify__icon-wrap">
							<v-icon :name="step.icon" scale="1.5" />
						</div>
						<span class="rx-verify__step-label">Step {{ i + 1 }}</span>
						<h3 class="rx-verify__step-title">{{ step.title }}</h3>
						<p class="rx-verify__step-desc">{{ step.desc }}</p>
					</div>

					<!-- Connecting dashed line between cards (desktop only) -->
					<div v-if="i < steps.length - 1" class="rx-verify__connector" aria-hidden="true"></div>
				</template>
			</div>

			<p
				class="rx-verify__footer"
				:ref="reveal"
				:style="{ transitionDelay: '500ms' }"
			>
				<v-icon name="hi-shield-check" scale="0.9" />
				Powered by AWS Textract OCR + Claude AI + Multi-Database Cross-Reference
			</p>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();

const steps = [
	{
		icon: 'ri-camera-line',
		title: 'Upload',
		desc: 'Snap a photo or upload your prescription PDF',
	},
	{
		icon: 'ri-qr-scan-2-line',
		title: 'AI Verification',
		desc: '3-tier verification: Document quality \u2192 Clinical validation \u2192 Fraud detection',
	},
	{
		icon: 'hi-shield-check',
		title: 'Results',
		desc: 'Get verified medications with dosage, interactions, and pharmacy pricing',
	},
];
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

.rx-verify {
	background: rgba($secondary-bg, 0.5);
	@include section-padding;
	scroll-margin-top: 80px;
}

.rx-verify__container {
	@include container;
}

// ── Header ──────────────────────────────────────────────────────
.rx-verify__header {
	text-align: center;
	margin-bottom: 72px;
	@include reveal-base;

	@media (max-width: $bp-md) {
		margin-bottom: 48px;
	}
}

.rx-verify__label {
	@include section-label($primary);
}

.rx-verify__title {
	@include section-title;
}

.rx-verify__subtitle {
	@include section-subtitle;
	margin-left: auto;
	margin-right: auto;
}

// ── Steps Grid ─────────────────────────────────────────────────
.rx-verify__steps {
	display: flex;
	align-items: flex-start;
	justify-content: center;
	gap: 0;
	max-width: 1100px;
	margin: 0 auto 64px;

	@media (max-width: $bp-md) {
		flex-direction: column;
		align-items: center;
		max-width: 420px;
	}
}

// ── Card ────────────────────────────────────────────────────────
.rx-verify__card {
	flex: 1;
	@include card-glass;
	text-align: center;
	position: relative;
	@include reveal-base;

	@media (max-width: $bp-md) {
		width: 100%;
	}
}

// ── Icon Container ──────────────────────────────────────────────
.rx-verify__icon-wrap {
	width: 64px;
	height: 64px;
	border-radius: 16px;
	background: linear-gradient(135deg, rgba($primary, 0.1), rgba($teal, 0.1));
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 16px;
	color: $primary-dark;
}

// ── Step Label ──────────────────────────────────────────────────
.rx-verify__step-label {
	display: block;
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 1.5px;
	color: $primary;
	margin-bottom: 8px;
}

.rx-verify__step-title {
	font-size: 20px;
	font-weight: 700;
	color: $foreground;
	margin: 0 0 10px;
}

.rx-verify__step-desc {
	font-size: 15px;
	color: $muted-fg;
	line-height: 1.65;
	margin: 0;
}

// ── Connecting Dashed Lines ─────────────────────────────────────
.rx-verify__connector {
	width: 48px;
	flex-shrink: 0;
	position: relative;
	align-self: center;

	&::after {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 0;
		border-top: 2px dashed rgba($primary, 0.2);
		transform: translateY(-50%);
	}

	@media (max-width: $bp-md) {
		width: 0;
		height: 32px;

		&::after {
			top: 0;
			bottom: 0;
			left: 50%;
			right: auto;
			width: 0;
			height: 100%;
			border-top: none;
			border-left: 2px dashed rgba($primary, 0.2);
			transform: translateX(-50%);
		}
	}
}

// ── Footer ──────────────────────────────────────────────────────
.rx-verify__footer {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	font-size: 14px;
	font-weight: 500;
	color: $muted-fg;
	margin: 0;
	text-align: center;
	@include reveal-base;

	.ov-icon {
		color: $primary;
		flex-shrink: 0;
	}

	@media (max-width: $bp-sm) {
		font-size: 13px;
		flex-wrap: wrap;
	}
}
</style>
