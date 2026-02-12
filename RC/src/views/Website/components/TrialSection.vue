<template>
	<section class="trial" id="try-it">
		<div class="trial__container">
			<div class="trial__header" :ref="reveal">
				<span class="trial__label">Free Trial</span>
				<h2 class="trial__title">Try Before You Sign Up</h2>
				<p class="trial__subtitle">
					Experience our AI-powered tools firsthand — no account required
				</p>
			</div>

			<div class="trial__grid">
				<!-- Symptom Checker Card -->
				<div class="trial-card trial-card--symptom" :ref="reveal">
					<div class="trial-card__icon-box trial-card__icon-box--symptom">
						<v-icon name="hi-heart" scale="1.4" />
					</div>
					<h3 class="trial-card__title">AI Symptom Checker</h3>
					<p class="trial-card__desc">
						Describe how you're feeling and get an intelligent health assessment powered by advanced AI.
					</p>
					<ul class="trial-card__features">
						<li>
							<v-icon name="hi-check" scale="0.7" />
							<span>Natural language symptom input</span>
						</li>
						<li>
							<v-icon name="hi-check" scale="0.7" />
							<span>AI-guided follow-up questions</span>
						</li>
						<li>
							<v-icon name="hi-check" scale="0.7" />
							<span>Triage level assessment</span>
						</li>
						<li>
							<v-icon name="hi-check" scale="0.7" />
							<span>Specialist recommendations</span>
						</li>
					</ul>
					<button class="trial-card__cta trial-card__cta--symptom" @click="$emit('openModal', 'symptom-checker')">
						Try Symptom Checker
						<v-icon name="hi-arrow-right" scale="0.85" />
					</button>
				</div>

				<!-- RxGPT Card -->
				<div class="trial-card trial-card--rxgpt" :ref="reveal" style="transition-delay: 100ms">
					<div class="trial-card__icon-box trial-card__icon-box--rxgpt">
						<v-icon name="ri-capsule-line" scale="1.4" />
					</div>
					<h3 class="trial-card__title">RxGPT Prescription Verifier</h3>
					<p class="trial-card__desc">
						Verify any prescription against 6 clinical databases for safety, interactions, and dosing accuracy.
					</p>
					<ul class="trial-card__features">
						<li>
							<v-icon name="hi-check" scale="0.7" />
							<span>6-source clinical verification</span>
						</li>
						<li>
							<v-icon name="hi-check" scale="0.7" />
							<span>Drug interaction alerts</span>
						</li>
						<li>
							<v-icon name="hi-check" scale="0.7" />
							<span>Evidence-based dosing check</span>
						</li>
						<li>
							<v-icon name="hi-check" scale="0.7" />
							<span>Safety risk assessment</span>
						</li>
					</ul>
					<button class="trial-card__cta trial-card__cta--rxgpt" @click="$emit('openModal', 'rxgpt')">
						Try RxGPT
						<v-icon name="hi-arrow-right" scale="0.85" />
					</button>
				</div>

				<!-- Prescription Upload Card -->
				<div class="trial-card trial-card--prescription" :ref="reveal" style="transition-delay: 200ms">
					<div class="trial-card__icon-box trial-card__icon-box--prescription">
						<v-icon name="hi-document-search" scale="1.4" />
					</div>
					<h3 class="trial-card__title">Prescription Verifier</h3>
					<p class="trial-card__desc">
						Upload a prescription image and watch our AI verify its authenticity with transparent scoring.
					</p>
					<ul class="trial-card__features">
						<li>
							<v-icon name="hi-check" scale="0.7" />
							<span>AI-powered document analysis</span>
						</li>
						<li>
							<v-icon name="hi-check" scale="0.7" />
							<span>Fraud & tampering detection</span>
						</li>
						<li>
							<v-icon name="hi-check" scale="0.7" />
							<span>Doctor & medication validation</span>
						</li>
						<li>
							<v-icon name="hi-check" scale="0.7" />
							<span>Transparent authenticity score</span>
						</li>
					</ul>
					<button class="trial-card__cta trial-card__cta--prescription" @click="$emit('openModal', 'prescription')">
						Try Prescription Verifier
						<v-icon name="hi-arrow-right" scale="0.85" />
					</button>
				</div>
			</div>

			<p class="trial__note" :ref="reveal">
				<v-icon name="hi-shield-check" scale="0.85" />
				One free use per feature. No credit card required.
			</p>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();

defineEmits(['openModal']);
</script>

<style scoped lang="scss">
$primary: #4fc3f7;
$primary-dark: #0288d1;
$primary-light: #e1f5fe;
$secondary: #FF5C00;
$secondary-dark: #E05000;
$navy: #0f172a;
$slate: #334155;
$gray: #64748b;
$emerald: #10b981;
$bg: #f8fafc;

.trial {
	background: #fff;
	padding: 96px 0;
	scroll-margin-top: 80px;

	@media (max-width: 768px) {
		padding: 64px 0;
	}
}

.trial__container {
	max-width: 1600px;
	margin: 0 auto;
	padding: 0 32px;

	@media (max-width: 768px) {
		padding: 0 16px;
	}
}

// Header
.trial__header {
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

.trial__label {
	display: inline-block;
	padding: 6px 18px;
	background: linear-gradient(135deg, rgba($secondary, 0.1), rgba($secondary, 0.05));
	color: $secondary;
	font-size: 14px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	border-radius: 50px;
	margin-bottom: 16px;
}

.trial__title {
	font-size: 52px;
	font-weight: 800;
	color: $navy;
	letter-spacing: -1px;
	margin: 0 0 16px;

	@media (max-width: 768px) {
		font-size: 36px;
	}
}

.trial__subtitle {
	font-size: 20px;
	color: $gray;
	line-height: 1.6;
	margin: 0;
	max-width: 560px;
	margin-left: auto;
	margin-right: auto;

	@media (max-width: 768px) {
		font-size: 16px;
	}
}

// Grid
.trial__grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 32px;
	max-width: 1200px;
	margin: 0 auto;

	@media (max-width: 1024px) {
		grid-template-columns: 1fr 1fr;
		max-width: 800px;
	}

	@media (max-width: 768px) {
		grid-template-columns: 1fr;
		max-width: 520px;
	}
}

// Card
.trial-card {
	position: relative;
	background: #fff;
	border-radius: 24px;
	border: 2px solid transparent;
	padding: 40px 32px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
	opacity: 0;
	transform: translateY(24px);
	transition: opacity 0.6s ease, transform 0.6s ease, box-shadow 0.3s ease;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	&:hover {
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
	}

	&.revealed:hover {
		transform: translateY(-4px);
	}

	&--symptom {
		border-color: $primary;
	}

	&--rxgpt {
		border-color: $secondary;
	}

	&--prescription {
		border-color: #7c3aed;
	}

	@media (max-width: 768px) {
		padding: 32px 24px;
	}
}

// Icon box
.trial-card__icon-box {
	width: 56px;
	height: 56px;
	border-radius: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 20px;

	&--symptom {
		background: linear-gradient(135deg, $primary-light, lighten($primary, 18%));
		color: $primary-dark;
	}

	&--rxgpt {
		background: linear-gradient(135deg, #fff3e0, lighten($secondary, 28%));
		color: $secondary-dark;
	}

	&--prescription {
		background: linear-gradient(135deg, #ede9fe, #ddd6fe);
		color: #7c3aed;
	}
}

.trial-card__title {
	font-size: 26px;
	font-weight: 800;
	color: $navy;
	margin: 0 0 10px;
}

.trial-card__desc {
	font-size: 16px;
	color: $gray;
	line-height: 1.6;
	margin: 0 0 24px;
}

// Features
.trial-card__features {
	list-style: none;
	padding: 0;
	margin: 0 0 32px;
	display: flex;
	flex-direction: column;
	gap: 12px;

	li {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 15px;
		color: $slate;
		line-height: 1.4;

		.ov-icon {
			color: $emerald;
			flex-shrink: 0;
		}
	}
}

// CTA
.trial-card__cta {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	width: 100%;
	padding: 16px 32px;
	border-radius: 50px;
	font-size: 16px;
	font-weight: 700;
	border: none;
	cursor: pointer;
	text-decoration: none;
	transition: all 0.25s ease;

	&--symptom {
		background: $primary-dark;
		color: #fff;
		box-shadow: 0 6px 20px rgba($primary-dark, 0.3);

		&:hover {
			background: darken($primary-dark, 5%);
			transform: translateY(-2px);
			box-shadow: 0 8px 28px rgba($primary-dark, 0.4);
		}
	}

	&--rxgpt {
		background: $secondary;
		color: #fff;
		box-shadow: 0 6px 20px rgba($secondary, 0.3);

		&:hover {
			background: $secondary-dark;
			transform: translateY(-2px);
			box-shadow: 0 8px 28px rgba($secondary, 0.4);
		}
	}

	&--prescription {
		background: #7c3aed;
		color: #fff;
		box-shadow: 0 6px 20px rgba(#7c3aed, 0.3);

		&:hover {
			background: #6d28d9;
			transform: translateY(-2px);
			box-shadow: 0 8px 28px rgba(#7c3aed, 0.4);
		}
	}
}

// Note
.trial__note {
	text-align: center;
	margin-top: 32px;
	font-size: 14px;
	color: $gray;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	opacity: 0;
	transform: translateY(16px);
	transition: opacity 0.6s ease, transform 0.6s ease;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	.ov-icon {
		color: $emerald;
	}
}
</style>
