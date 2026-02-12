<template>
	<section class="how-it-works">
		<div class="how-it-works__container">
			<div class="how-it-works__header" :ref="reveal">
				<h2 class="how-it-works__title">How It Works</h2>
				<p class="how-it-works__subtitle">
					Simple, seamless healthcare for everyone
				</p>
			</div>

			<div class="how-it-works__grid">
				<!-- Patient Column -->
				<div class="how-it-works__column" :ref="reveal">
					<h3 class="column-title column-title--patient">
						<v-icon name="hi-user" scale="1.3" />
						For Patients
					</h3>

					<div class="steps">
						<div
							v-for="(step, i) in patientSteps"
							:key="step.title"
							class="step"
							:ref="reveal"
							:style="{ transitionDelay: `${i * 120}ms` }"
						>
							<div class="step__indicator">
								<div class="step__number step__number--patient">{{ i + 1 }}</div>
								<div v-if="i < patientSteps.length - 1" class="step__line step__line--patient"></div>
							</div>
							<div class="step__text">
								<h4 class="step__title">{{ step.title }}</h4>
								<p class="step__desc">{{ step.desc }}</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Specialist Column -->
				<div class="how-it-works__column" :ref="reveal">
					<h3 class="column-title column-title--specialist">
						<v-icon name="fa-stethoscope" scale="1.3" />
						For Specialists
					</h3>

					<div class="steps">
						<div
							v-for="(step, i) in specialistSteps"
							:key="step.title"
							class="step"
							:ref="reveal"
							:style="{ transitionDelay: `${i * 120 + 60}ms` }"
						>
							<div class="step__indicator">
								<div class="step__number step__number--specialist">{{ i + 1 }}</div>
								<div v-if="i < specialistSteps.length - 1" class="step__line step__line--specialist"></div>
							</div>
							<div class="step__text">
								<h4 class="step__title">{{ step.title }}</h4>
								<p class="step__desc">{{ step.desc }}</p>
							</div>
						</div>
					</div>
				</div>

				<!-- RxGPT Column -->
				<div class="how-it-works__column" :ref="reveal">
					<h3 class="column-title column-title--rxgpt">
						<v-icon name="hi-lightning-bolt" scale="1.3" />
						RxGPT Assistant
					</h3>

					<div class="steps">
						<div
							v-for="(step, i) in rxgptSteps"
							:key="step.title"
							class="step"
							:ref="reveal"
							:style="{ transitionDelay: `${i * 120 + 120}ms` }"
						>
							<div class="step__indicator">
								<div class="step__number step__number--rxgpt">{{ i + 1 }}</div>
								<div v-if="i < rxgptSteps.length - 1" class="step__line step__line--rxgpt"></div>
							</div>
							<div class="step__text">
								<h4 class="step__title">{{ step.title }}</h4>
								<p class="step__desc">{{ step.desc }}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();

const patientSteps = [
	{ title: 'Sign Up & Create Profile', desc: 'Quick registration with secure authentication' },
	{ title: 'AI Health Checkup', desc: 'Answer questions for intelligent symptom assessment' },
	{ title: 'Book Matched Specialist', desc: 'Choose from verified healthcare providers' },
	{ title: 'Video Consultation', desc: 'Connect face-to-face with your doctor' },
	{ title: 'Order Medications', desc: 'Receive e-prescriptions and order from digital pharmacy' },
];

const specialistSteps = [
	{ title: 'Register & Verify Credentials', desc: 'Quick onboarding with professional verification' },
	{ title: 'Set Availability & Rates', desc: 'Manage your schedule and consultation fees' },
	{ title: 'Receive Patient Bookings', desc: 'Get matched with patients needing your expertise' },
	{ title: 'Consult & Prescribe', desc: 'Conduct video consultations with AI assistance' },
	{ title: 'Track Analytics & Earnings', desc: 'Monitor your practice performance and revenue' },
];

const rxgptSteps = [
	{ title: 'Enter Prescription Details', desc: 'Specialist inputs medication, dosage, and patient info' },
	{ title: 'AI Multi-Source Verification', desc: 'Cross-referenced against PubMed, WHO EML, OpenFDA, NICE, BNF, and RxNav' },
	{ title: 'Drug Interaction Check', desc: 'Automatic detection of contraindications and conflicts' },
	{ title: 'Evidence-Based Dosing', desc: 'AI-recommended dosage validated by clinical research' },
	{ title: 'Verified & Ready to Send', desc: 'Prescription confirmed safe and sent to pharmacy' },
];
</script>

<style scoped lang="scss">
$primary: #4FC3F7;
$primary-dark: #0288D1;
$primary-light: #E1F5FE;
$secondary: #FF5C00;
$secondary-dark: #E05000;
$secondary-light: #FFF3E0;
$emerald: #10B981;
$emerald-dark: #059669;
$emerald-light: #D1FAE5;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;

.how-it-works {
	background: $bg;
	padding: 100px 0;
	scroll-margin-top: 80px;

	@media (max-width: 768px) {
		padding: 64px 0;
	}
}

.how-it-works__container {
	max-width: 1600px;
	margin: 0 auto;
	padding: 0 40px;

	@media (max-width: 768px) {
		padding: 0 20px;
	}
}

.how-it-works__header {
	text-align: center;
	margin-bottom: 72px;
	opacity: 0;
	transform: translateY(24px);
	transition: opacity 0.6s ease, transform 0.6s ease;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	@media (max-width: 768px) {
		margin-bottom: 48px;
	}
}

.how-it-works__title {
	font-size: 52px;
	font-weight: 800;
	color: $navy;
	letter-spacing: -1px;
	margin: 0 0 16px;

	@media (max-width: 768px) {
		font-size: 36px;
	}
}

.how-it-works__subtitle {
	font-size: 20px;
	color: $gray;
	line-height: 1.6;
	margin: 0;

	@media (max-width: 768px) {
		font-size: 16px;
	}
}

.how-it-works__grid {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	gap: 48px;

	@media (max-width: 1100px) {
		grid-template-columns: 1fr;
		gap: 56px;
	}
}

.how-it-works__column {
	opacity: 0;
	transform: translateY(24px);
	transition: opacity 0.6s ease, transform 0.6s ease;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}
}

.column-title {
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 26px;
	font-weight: 800;
	margin: 0 0 36px;

	&--patient {
		color: $primary-dark;
	}

	&--specialist {
		color: $secondary;
	}

	&--rxgpt {
		color: $emerald-dark;
	}

	@media (max-width: 768px) {
		font-size: 24px;
		margin-bottom: 32px;
	}
}

.steps {
	display: flex;
	flex-direction: column;
}

.step {
	display: flex;
	gap: 18px;
	opacity: 0;
	transform: translateY(20px);
	transition: opacity 0.5s ease, transform 0.5s ease;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}
}

.step__indicator {
	display: flex;
	flex-direction: column;
	align-items: center;
	flex-shrink: 0;
	width: 44px;
}

.step__number {
	width: 44px;
	height: 44px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
	font-weight: 800;
	color: #fff;
	flex-shrink: 0;
	position: relative;
	z-index: 1;

	&--patient {
		background: $primary;
	}

	&--specialist {
		background: $secondary;
	}

	&--rxgpt {
		background: $emerald;
	}
}

.step__line {
	width: 2px;
	flex: 1;
	min-height: 36px;
	border-left: 2px solid;

	&--patient {
		border-color: rgba($primary, 0.25);
	}

	&--specialist {
		border-color: rgba($secondary, 0.25);
	}

	&--rxgpt {
		border-color: rgba($emerald, 0.25);
	}
}

.step__text {
	flex: 1;
	padding: 6px 0 40px;
}

.step__title {
	font-size: 18px;
	font-weight: 700;
	color: $navy;
	margin: 0 0 5px;

	@media (max-width: 768px) {
		font-size: 17px;
	}
}

.step__desc {
	font-size: 15px;
	color: $gray;
	line-height: 1.5;
	margin: 0;

	@media (max-width: 768px) {
		font-size: 14px;
	}
}
</style>
