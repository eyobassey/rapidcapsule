<template>
	<section class="benefits">
		<div class="benefits__container">
			<div class="benefits__header" :ref="reveal">
				<span class="benefits__label">Why Choose Us</span>
				<h2 class="benefits__title">Built for Better Healthcare</h2>
				<p class="benefits__subtitle">
					Powerful tools designed for patients seeking care and specialists delivering it.
				</p>
			</div>

			<div class="benefits__grid">
				<!-- Patient Card -->
				<div class="benefit-card benefit-card--patient" :ref="reveal">
					<div class="benefit-card__header">
						<div class="benefit-card__icon-wrap benefit-card__icon-wrap--patient">
							<v-icon name="hi-heart" scale="1.4" />
						</div>
						<h3 class="benefit-card__title">For Patients</h3>
					</div>

					<ul class="benefit-list">
						<li
							v-for="(item, i) in patientBenefits"
							:key="item.title"
							class="benefit-item"
							:ref="reveal"
							:style="{ transitionDelay: `${i * 100}ms` }"
						>
							<div class="benefit-item__check benefit-item__check--patient">
								<v-icon name="hi-check-circle" scale="1" />
							</div>
							<div class="benefit-item__text">
								<span class="benefit-item__title">{{ item.title }}</span>
								<span class="benefit-item__desc">{{ item.desc }}</span>
							</div>
						</li>
					</ul>

					<div class="benefit-stat benefit-stat--patient">
						<span class="benefit-stat__value">80% Faster</span>
						<span class="benefit-stat__label">Average wait time reduction</span>
					</div>
				</div>

				<!-- Specialist Card -->
				<div class="benefit-card benefit-card--specialist" :ref="reveal">
					<div class="benefit-card__header">
						<div class="benefit-card__icon-wrap benefit-card__icon-wrap--specialist">
							<v-icon name="fa-user-md" scale="1.4" />
						</div>
						<h3 class="benefit-card__title">For Specialists</h3>
					</div>

					<ul class="benefit-list">
						<li
							v-for="(item, i) in specialistBenefits"
							:key="item.title"
							class="benefit-item"
							:ref="reveal"
							:style="{ transitionDelay: `${i * 100 + 50}ms` }"
						>
							<div class="benefit-item__check benefit-item__check--specialist">
								<v-icon name="hi-check-circle" scale="1" />
							</div>
							<div class="benefit-item__text">
								<span class="benefit-item__title">{{ item.title }}</span>
								<span class="benefit-item__desc">{{ item.desc }}</span>
							</div>
						</li>
					</ul>

					<div class="benefit-stat benefit-stat--specialist">
						<span class="benefit-stat__value">3x More Efficient</span>
						<span class="benefit-stat__label">Streamlined clinical workflows</span>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();

const patientBenefits = [
	{
		title: 'AI Symptom Checker',
		desc: 'Get instant health assessments before booking',
	},
	{
		title: 'Smart Specialist Matching',
		desc: 'AI-powered recommendations based on your needs',
	},
	{
		title: 'Vitals Tracking',
		desc: 'Monitor blood pressure, glucose, and more over time',
	},
	{
		title: 'Prescription History',
		desc: 'Access all your medications in one secure place',
	},
	{
		title: 'Referral Rewards',
		desc: 'Earn credits by referring friends and family',
	},
];

const specialistBenefits = [
	{
		title: 'Patient Dashboard',
		desc: 'Manage all consultations in one intuitive interface',
	},
	{
		title: 'RxGPT Assistant',
		desc: 'AI-verified prescriptions with drug interaction alerts',
	},
	{
		title: 'Practice Analytics',
		desc: 'Track consultations, revenue, and patient outcomes',
	},
	{
		title: 'Flexible Scheduling',
		desc: 'Set your own availability and consultation rates',
	},
	{
		title: 'Prescription Tools',
		desc: 'Digital prescribing with auto-pharmacy integration',
	},
];
</script>

<style scoped lang="scss">
// Design tokens
$primary: #4FC3F7;
$primary-dark: #0288D1;
$primary-light: #E1F5FE;
$secondary: #FF5C00;
$secondary-dark: #E05000;
$secondary-light: #FFF3E0;
$navy: #0F172A;
$slate: #334155;
$gray: #475569;
$emerald: #10B981;
$bg: #F8FAFC;

.benefits {
	background: linear-gradient(180deg, $bg 0%, #fff 100%);
	padding: 96px 0;
	scroll-margin-top: 80px;

	@media (max-width: 768px) {
		padding: 64px 0;
	}
}

.benefits__container {
	max-width: 1600px;
	margin: 0 auto;
	padding: 0 32px;

	@media (max-width: 768px) {
		padding: 0 16px;
	}
}

// Header
.benefits__header {
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

.benefits__label {
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

.benefits__title {
	font-size: 52px;
	font-weight: 800;
	color: $navy;
	letter-spacing: -1px;
	margin: 0 0 16px;

	@media (max-width: 768px) {
		font-size: 36px;
	}
}

.benefits__subtitle {
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
.benefits__grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 32px;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
		gap: 24px;
	}
}

// Card
.benefit-card {
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.6);
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
	border-radius: 20px;
	padding: 36px;
	transition: transform 0.35s ease, box-shadow 0.35s ease;
	opacity: 0;
	transform: translateY(24px);

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	&:hover {
		transform: translateY(-6px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
	}

	// Keep hover lift after reveal
	&.revealed:hover {
		transform: translateY(-6px);
	}

	@media (max-width: 768px) {
		padding: 24px;
	}
}

// Card header
.benefit-card__header {
	display: flex;
	align-items: center;
	gap: 16px;
	margin-bottom: 28px;
}

.benefit-card__icon-wrap {
	width: 56px;
	height: 56px;
	border-radius: 16px;
	display: flex;
	align-items: center;
	justify-content: center;

	&--patient {
		background: $primary-light;
		color: $primary-dark;
	}

	&--specialist {
		background: $secondary-light;
		color: $secondary-dark;
	}
}

.benefit-card__title {
	font-size: 28px;
	font-weight: 800;
	color: $navy;
	margin: 0;
}

// Benefit list
.benefit-list {
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 16px;
	margin-bottom: 28px;
}

.benefit-item {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	opacity: 0;
	transform: translateX(-12px);
	transition: opacity 0.4s ease, transform 0.4s ease;

	&.revealed {
		opacity: 1;
		transform: translateX(0);
	}
}

.benefit-item__check {
	flex-shrink: 0;
	margin-top: 1px;

	&--patient {
		color: $primary;
	}

	&--specialist {
		color: $secondary;
	}
}

.benefit-item__text {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.benefit-item__title {
	font-size: 18px;
	font-weight: 700;
	color: $slate;
}

.benefit-item__desc {
	font-size: 16px;
	color: $gray;
	line-height: 1.5;
}

// Stat card
.benefit-stat {
	border-radius: 14px;
	padding: 20px 24px;
	display: flex;
	flex-direction: column;
	gap: 4px;

	&--patient {
		background: $primary-light;
	}

	&--specialist {
		background: $secondary-light;
	}
}

.benefit-stat__value {
	font-size: 26px;
	font-weight: 800;
	letter-spacing: -0.3px;

	.benefit-stat--patient & {
		color: $primary-dark;
	}

	.benefit-stat--specialist & {
		color: $secondary-dark;
	}
}

.benefit-stat__label {
	font-size: 14px;

	.benefit-stat--patient & {
		color: rgba($primary-dark, 0.7);
	}

	.benefit-stat--specialist & {
		color: rgba($secondary-dark, 0.7);
	}
}
</style>
