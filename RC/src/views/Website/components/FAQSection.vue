<template>
	<section class="faq">
		<div class="faq__container">
			<div class="faq__header" :ref="reveal">
				<h2 class="faq__title">Frequently Asked Questions</h2>
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
					<button
						class="faq-item__trigger"
						@click="toggle(index)"
						:aria-expanded="openIndex === index"
					>
						<span class="faq-item__question">{{ item.q }}</span>
						<span class="faq-item__chevron">
							<v-icon name="hi-chevron-down" scale="1" />
						</span>
					</button>

					<div
						class="faq-item__body"
						:class="{ 'faq-item__body--open': openIndex === index }"
					>
						<p class="faq-item__answer">{{ item.a }}</p>
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
		q: 'What is Eka and how does it work?',
		a: 'Eka is our AI health assistant that conducts intelligent symptom interviews, provides triage assessments, checks drug interactions, and connects you with the right specialist — all through natural conversation available 24/7.',
	},
	{
		q: "How accurate is RxGPT's prescription verification?",
		a: 'RxGPT verifies prescriptions against 6 clinical databases including PubMed, WHO Essential Medicines, and OpenFDA. Our 7-layer hallucination detection pipeline ensures clinical accuracy with full traceability.',
	},
	{
		q: 'How do video consultations work?',
		a: 'Book a consultation with a verified specialist, connect via HD video in-app, and receive prescriptions, clinical notes, and follow-up plans — all in one seamless experience.',
	},
	{
		q: 'Is my health data secure?',
		a: 'Absolutely. We use end-to-end encryption, HIPAA-aware infrastructure, and verify every specialist\'s license before activation. Your data is encrypted in transit and at rest.',
	},
	{
		q: 'What payment methods are accepted?',
		a: 'We support credit/debit cards, mobile wallets, and in-app wallet credits with multi-currency support for a seamless payment experience worldwide.',
	},
	{
		q: 'Can I connect my wearable devices?',
		a: 'Yes! Connect Apple Watch, Fitbit, Garmin, and other popular wearables to automatically track vitals with charts, trends, and health alerts built in.',
	},
	{
		q: 'How do I verify my prescription?',
		a: 'Simply upload a photo or PDF of your prescription. Our 3-tier AI system verifies document quality, performs clinical validation, and checks for fraud — all in seconds.',
	},
];
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

// ── Section ──────────────────────────────────────────────────
.faq {
	background: rgba($secondary-bg, 0.5);
	@include section-padding;
}

// ── Container ────────────────────────────────────────────────
.faq__container {
	max-width: 768px;
	margin: 0 auto;
	padding: 0 $container-px;

	@media (max-width: $bp-sm) {
		padding: 0 $container-px-sm;
	}

	@media (max-width: $bp-xs) {
		padding: 0 $container-px-xs;
	}
}

// ── Header ───────────────────────────────────────────────────
.faq__header {
	text-align: center;
	margin-bottom: 48px;
	@include reveal-base;

	@media (max-width: $bp-md) {
		margin-bottom: 36px;
	}
}

.faq__title {
	@include section-title;
}

// ── List ─────────────────────────────────────────────────────
.faq__list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

// ── Item ─────────────────────────────────────────────────────
.faq-item {
	@include card-glass;
	padding: 0;
	overflow: hidden;
	@include reveal-base;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	&:hover {
		transform: none;
	}

	&--open {
		box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
	}
}

// ── Question trigger ─────────────────────────────────────────
.faq-item__trigger {
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 16px 24px;
	border: none;
	background: none;
	cursor: pointer;
	text-align: left;
	transition: background 0.2s ease;

	&:hover {
		background: rgba($primary, 0.03);
	}
}

.faq-item__question {
	font-size: 14px;
	font-weight: 600;
	color: $foreground;
	line-height: 1.4;

	@media (min-width: $bp-sm) {
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
	background: rgba($primary, 0.08);
	color: $primary-dark;
	flex-shrink: 0;
	transition: transform 0.35s ease, background 0.25s ease, color 0.25s ease;

	.faq-item--open & {
		transform: rotate(180deg);
		background: $primary;
		color: $white;
	}
}

// ── Answer body ──────────────────────────────────────────────
.faq-item__body {
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
	padding: 0 24px 16px;
	font-size: 14px;
	color: $muted-fg;
	line-height: 1.75;
	margin: 0;
}
</style>
