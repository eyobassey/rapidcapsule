<template>
	<div class="homepage">
		<HomepageNav />
		<main>
			<HeroSection />
			<HowItWorksSection id="how-it-works" />
			<BenefitsSection id="benefits" />
			<AITechnologySection id="technology" />
			<StatsBarSection />
			<TrustSecuritySection />
			<TrialSection id="try-it" @openModal="openTrialModal" />
			<PricingSection id="pricing" />
			<FAQSection id="faq" />
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
import HowItWorksSection from './components/HowItWorksSection.vue';
import BenefitsSection from './components/BenefitsSection.vue';
import AITechnologySection from './components/AITechnologySection.vue';
import StatsBarSection from './components/StatsBarSection.vue';
import TrustSecuritySection from './components/TrustSecuritySection.vue';
import TrialSection from './components/TrialSection.vue';
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
			'Online telemedicine platform offering AI symptom checking, specialist video consultations, RxGPT prescription verification, and pharmacy delivery.',
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
				name: 'AI Symptom Checker',
				description: 'AI-powered symptom analysis and triage assessment',
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
				name: 'How does the AI health checkup work?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: "Our AI health checkup uses advanced natural language processing to analyze your symptoms. You'll answer a series of questions about how you're feeling, and our system provides an intelligent triage assessment, potential conditions, and specialist recommendations — all in under 5 minutes.",
				},
			},
			{
				'@type': 'Question',
				name: 'What happens during a video consultation?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Video consultations are conducted through secure, HD Zoom integration. Your specialist will review your health profile, discuss your concerns, provide a diagnosis, and can issue digital prescriptions — all from the comfort of your home.',
				},
			},
			{
				'@type': 'Question',
				name: 'Is my health data secure and private?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'We use JWT/OAuth authentication, end-to-end encryption for all data in transit and at rest, and follow HIPAA-aware data handling standards. Your health information is never shared without your explicit consent.',
				},
			},
			{
				'@type': 'Question',
				name: 'How does RxGPT prescription verification work?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'RxGPT cross-references prescriptions against six authoritative clinical sources: PubMed research databases, WHO Essential Medicines List, OpenFDA drug labels, NICE clinical guidelines, the British National Formulary (BNF), and RxNav. It checks for drug interactions, contraindications, and dosage accuracy.',
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
				name: 'How do I become a verified specialist?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Specialists can register through our onboarding process which includes credential verification, profile setup, availability configuration, and rate card creation.',
				},
			},
			{
				'@type': 'Question',
				name: 'Can I get medications delivered to my location?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'Our integrated pharmacy ecosystem connects you with licensed pharmacies. After receiving a digital prescription, you can browse our catalog of 3,087+ medications and arrange delivery.',
				},
			},
			{
				'@type': 'Question',
				name: 'What are the referral rewards?',
				acceptedAnswer: {
					'@type': 'Answer',
					text: 'When you refer friends or family to Rapid Capsule, both you and the referred person receive wallet credits applied toward consultations.',
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
	background: #ffffff;
	// Reset any inherited specialist-app styles
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	color: #0F172A;
}

// Smooth scroll offset for anchor links
:deep([id]) {
	scroll-margin-top: 80px;
}
</style>
