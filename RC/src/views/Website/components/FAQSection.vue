<template>
	<section class="faq" id="faq">
		<div class="faq__container">
			<div class="faq__header" :ref="reveal">
				<span class="faq__label">Support</span>
				<h2 class="faq__title">Frequently Asked Questions</h2>
				<p class="faq__subtitle">Everything you need to know</p>
			</div>

			<div class="faq__list">
				<div
					v-for="(item, index) in faqs"
					:key="index"
					class="faq-item"
					:class="{ 'faq-item--open': openIndex === index }"
					:ref="reveal"
					:style="{ transitionDelay: `${index * 60}ms` }"
				>
					<button class="faq-item__question" @click="toggle(index)">
						<span class="faq-item__question-text">{{ item.question }}</span>
						<span class="faq-item__chevron">
							<v-icon name="hi-chevron-down" scale="1" />
						</span>
					</button>
					<div class="faq-item__answer-wrap" :class="{ 'faq-item__answer-wrap--open': openIndex === index }">
						<div class="faq-item__answer">
							<p>{{ item.answer }}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { ref } from 'vue';
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();

const openIndex = ref(null);

function toggle(index) {
	openIndex.value = openIndex.value === index ? null : index;
}

const faqs = [
	{
		question: 'How does the AI health checkup work?',
		answer:
			"Our AI health checkup uses advanced natural language processing to analyze your symptoms. You'll answer a series of questions about how you're feeling, and our system provides an intelligent triage assessment, potential conditions, and specialist recommendations \u2014 all in under 5 minutes.",
	},
	{
		question: 'What happens during a video consultation?',
		answer:
			'Video consultations are conducted through secure, HD Zoom integration. Your specialist will review your health profile, discuss your concerns, provide a diagnosis, and can issue digital prescriptions \u2014 all from the comfort of your home.',
	},
	{
		question: 'Is my health data secure and private?',
		answer:
			'Absolutely. We use JWT/OAuth authentication, end-to-end encryption for all data in transit and at rest, and follow HIPAA-aware data handling standards. Your health information is never shared without your explicit consent.',
	},
	{
		question: 'How does RxGPT prescription verification work?',
		answer:
			'RxGPT cross-references prescriptions against six authoritative clinical sources: PubMed research databases, WHO Essential Medicines List, OpenFDA drug labels, NICE clinical guidelines, the British National Formulary (BNF), and RxNav. It checks for drug interactions, contraindications, and dosage accuracy to ensure prescription safety.',
	},
	{
		question: 'What payment methods do you accept?',
		answer:
			'We accept payments through Paystack, supporting credit/debit cards and bank transfers. You can also use our digital wallet system for quick payments, and earn credits through our referral rewards program.',
	},
	{
		question: 'How do I become a verified specialist?',
		answer:
			"Specialists can register through our onboarding process which includes credential verification, profile setup, availability configuration, and rate card creation. Once verified, you'll be matched with patients seeking your expertise.",
	},
	{
		question: 'Can I get medications delivered to my location?',
		answer:
			'Yes! Our integrated pharmacy ecosystem connects you with licensed pharmacies. After receiving a digital prescription from your specialist, you can browse our catalog of 3,087+ medications and arrange delivery to your location.',
	},
	{
		question: 'What are the referral rewards?',
		answer:
			'When you refer friends or family to Rapid Capsule, both you and the referred person receive wallet credits. These credits can be applied toward consultations, making healthcare more affordable for everyone.',
	},
];
</script>

<style scoped lang="scss">
// Design tokens
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

.faq {
	background: #fff;
	padding: 96px 0;
	scroll-margin-top: 80px;

	@media (max-width: 768px) {
		padding: 64px 0;
	}
}

.faq__container {
	max-width: 960px;
	margin: 0 auto;
	padding: 0 32px;

	@media (max-width: 768px) {
		padding: 0 16px;
	}
}

// Header
.faq__header {
	text-align: center;
	margin-bottom: 56px;
	opacity: 0;
	transform: translateY(24px);
	transition: opacity 0.6s ease, transform 0.6s ease;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	@media (max-width: 768px) {
		margin-bottom: 36px;
	}
}

.faq__label {
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

.faq__title {
	font-size: 52px;
	font-weight: 800;
	color: $navy;
	letter-spacing: -1px;
	margin: 0 0 16px;

	@media (max-width: 768px) {
		font-size: 36px;
	}
}

.faq__subtitle {
	font-size: 20px;
	color: $gray;
	line-height: 1.6;
	margin: 0;

	@media (max-width: 768px) {
		font-size: 16px;
	}
}

// FAQ List
.faq__list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

// FAQ Item
.faq-item {
	background: $bg;
	border-radius: 16px;
	overflow: hidden;
	transition: opacity 0.5s ease, transform 0.5s ease, box-shadow 0.25s ease;
	opacity: 0;
	transform: translateY(20px);

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	&:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
	}

	&--open {
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}
}

.faq-item__question {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 20px 24px;
	border: none;
	background: none;
	cursor: pointer;
	text-align: left;
	transition: background 0.2s ease;

	&:hover {
		background: rgba($primary, 0.04);
	}

	@media (max-width: 768px) {
		padding: 16px 18px;
	}
}

.faq-item__question-text {
	font-size: 18px;
	font-weight: 600;
	color: $navy;
	line-height: 1.4;

	@media (max-width: 768px) {
		font-size: 16px;
	}
}

.faq-item__chevron {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	background: rgba($primary, 0.1);
	color: $primary-dark;
	flex-shrink: 0;
	transition: transform 0.35s ease, background 0.25s ease;

	.faq-item--open & {
		transform: rotate(180deg);
		background: $primary;
		color: #fff;
	}
}

// Answer panel
.faq-item__answer-wrap {
	max-height: 0;
	opacity: 0;
	overflow: hidden;
	transition: max-height 0.35s ease, opacity 0.25s ease;

	&--open {
		max-height: 300px;
		opacity: 1;
	}
}

.faq-item__answer {
	padding: 0 24px 20px;

	p {
		font-size: 15px;
		color: $gray;
		line-height: 1.7;
		margin: 0;
	}

	@media (max-width: 768px) {
		padding: 0 18px 16px;

		p {
			font-size: 14px;
		}
	}
}
</style>
