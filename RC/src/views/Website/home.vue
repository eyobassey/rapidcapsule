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
import { ref } from 'vue';
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
