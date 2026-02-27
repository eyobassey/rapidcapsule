<template>
	<div class="homepage">
		<HomepageNav />
		<main>
			<HeroSection />
			<EkaAISection id="eka-ai" @openModal="openTrialModal" />
			<RxGPTSection id="rxgpt" @openModal="openTrialModal" />
			<PrescriptionVerificationSection @openModal="openTrialModal" />
			<FeaturesBentoGrid id="features" />
			<HowItWorksSection id="how-it-works" />
			<SpecialistCTASection id="specialists" />
			<TrustSecuritySection id="trust" />
			<StatsBarSection />
			<PricingSection id="pricing" />
			<FAQSection />
			<CTASection />
		</main>
		<FooterSection />
		<TrialRequestModal
			:visible="trialModalVisible"
			:selectedFeature="trialSelectedFeature"
			@close="trialModalVisible = false"
		/>
	</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import HomepageNav from './components/HomepageNav.vue';
import HeroSection from './components/HeroSection.vue';
import EkaAISection from './components/EkaAISection.vue';
import RxGPTSection from './components/RxGPTSection.vue';
import PrescriptionVerificationSection from './components/PrescriptionVerificationSection.vue';
import FeaturesBentoGrid from './components/FeaturesBentoGrid.vue';
import HowItWorksSection from './components/HowItWorksSection.vue';
import SpecialistCTASection from './components/SpecialistCTASection.vue';
import TrustSecuritySection from './components/TrustSecuritySection.vue';
import StatsBarSection from './components/StatsBarSection.vue';
import PricingSection from './components/PricingSection.vue';
import FAQSection from './components/FAQSection.vue';
import CTASection from './components/CTASection.vue';
import FooterSection from './components/FooterSection.vue';
import TrialRequestModal from './components/TrialRequestModal.vue';

const trialModalVisible = ref(false);
const trialSelectedFeature = ref('symptom-checker');

function openTrialModal(feature) {
	trialSelectedFeature.value = feature;
	trialModalVisible.value = true;
}

// ── JSON-LD Structured Data ─────────────────────────────────
const jsonLdScripts = [];

const schemas = [
	{
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'Rapid Capsule',
		url: 'https://rapidcapsule.com',
		logo: 'https://rapidcapsule.com/RapidCapsule.png',
		description: 'AI-powered telemedicine platform connecting patients with medical specialists.',
	},
	{
		'@context': 'https://schema.org',
		'@type': 'MedicalBusiness',
		name: 'Rapid Capsule',
		url: 'https://rapidcapsule.com',
		description:
			'Online telemedicine platform offering AI symptom checking with Eka, specialist video consultations, RxGPT prescription verification, and pharmacy delivery.',
		medicalSpecialty: [
			'General Practice',
			'Cardiology',
			'Dermatology',
			'Neurology',
			'Pediatrics',
			'Gynecology',
			'Orthopedics',
		],
		availableService: [
			{
				'@type': 'MedicalProcedure',
				name: 'Eka AI Health Companion',
				description: 'AI-powered conversational health assistant with symptom analysis and triage assessment',
			},
			{
				'@type': 'MedicalProcedure',
				name: 'Video Consultation',
				description: 'HD video consultations with verified medical specialists',
			},
			{
				'@type': 'MedicalProcedure',
				name: 'RxGPT Prescription Verification',
				description: 'AI prescription verification against 6 clinical databases',
			},
			{
				'@type': 'MedicalProcedure',
				name: 'Digital Prescriptions',
				description: 'Electronic prescriptions with pharmacy delivery',
			},
		],
	},
	{
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Rapid Capsule',
		url: 'https://rapidcapsule.com',
	},
	{
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: [
			{
				'@type': 'Question',
				name: 'What is Eka and how does it work?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: "Eka is your 24/7 AI health companion. It uses advanced medical AI to conduct intelligent symptom interviews, check drug interactions, analyze prescriptions, and connect you with the right specialist — all through natural conversation.",
				},
			},
			{
				'@type': 'Question',
				name: 'How accurate is RxGPT prescription verification?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'RxGPT cross-references prescriptions against six authoritative clinical sources: PubMed, WHO Essential Medicines List, OpenFDA, NICE guidelines, the British National Formulary, and RxNav. A 7-layer hallucination detection pipeline ensures clinical accuracy.',
				},
			},
			{
				'@type': 'Question',
				name: 'How do video consultations work?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Video consultations are conducted through secure, HD Zoom integration. Your specialist will review your health profile, discuss your concerns, provide a diagnosis, and can issue digital prescriptions — all from the comfort of your home.',
				},
			},
			{
				'@type': 'Question',
				name: 'Is my health data secure?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'We use JWT/OAuth authentication, end-to-end encryption for all data in transit and at rest, and follow HIPAA-aware data handling standards. Your health information is never shared without your explicit consent.',
				},
			},
			{
				'@type': 'Question',
				name: 'What payment methods do you accept?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'We accept payments through Paystack, supporting credit/debit cards and bank transfers. You can also use our digital wallet system for quick payments, and earn credits through our referral rewards program.',
				},
			},
			{
				'@type': 'Question',
				name: 'Can I connect my wearable devices?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Yes. Rapid Capsule integrates with Apple Health, Google Fit, Samsung Health, Fitbit, Garmin, and more. Your vitals sync automatically and are available to your care team during consultations.',
				},
			},
			{
				'@type': 'Question',
				name: 'How do I verify my prescription?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Upload a photo or PDF of your prescription and our 3-tier AI verification system checks document quality, validates medications against clinical databases, and detects potential issues — all in seconds.',
				},
			},
		],
	},
];

onMounted(() => {
	schemas.forEach((schema) => {
		const script = document.createElement('script');
		script.type = 'application/ld+json';
		script.textContent = JSON.stringify(schema);
		document.head.appendChild(script);
		jsonLdScripts.push(script);
	});
});

onUnmounted(() => {
	jsonLdScripts.forEach((s) => s.remove());
	jsonLdScripts.length = 0;
});
</script>

<style scoped lang="scss">
.homepage {
	width: 100%;
	min-height: 100vh;
	overflow-x: hidden;
	background: #F7F8FA;
	font-family: 'Inter', system-ui, -apple-system, sans-serif;
	color: #172340;
}

:deep([id]) {
	scroll-margin-top: 80px;
}
</style>
