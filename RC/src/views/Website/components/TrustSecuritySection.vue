<template>
	<section class="trust">
		<div class="trust__container">
			<div class="trust__header" :ref="reveal">
				<div class="trust__shield-box">
					<v-icon name="hi-shield-check" scale="2" />
				</div>
				<h2 class="trust__title">Your Health, Protected</h2>
				<p class="trust__subtitle">
					Enterprise-grade security and privacy standards
				</p>
			</div>

			<div class="trust__cards">
				<div
					v-for="(card, i) in trustCards"
					:key="card.title"
					class="trust__card"
					:ref="reveal"
					:style="{ transitionDelay: `${i * 100}ms` }"
				>
					<div class="trust__card-icon">
						<v-icon :name="card.icon" scale="1.3" />
					</div>
					<h3 class="trust__card-title">{{ card.title }}</h3>
					<p class="trust__card-desc">{{ card.description }}</p>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal';

const { reveal } = useScrollReveal();

const trustCards = [
	{
		icon: 'hi-key',
		title: 'Secure Authentication',
		description: 'JWT & OAuth with Google and Apple sign-in',
	},
	{
		icon: 'hi-lock-closed',
		title: 'End-to-End Encryption',
		description: 'All data encrypted in transit and at rest',
	},
	{
		icon: 'hi-document-text',
		title: 'Data Compliance',
		description: 'HIPAA-aware data handling standards',
	},
	{
		icon: 'hi-server',
		title: 'Protected Infrastructure',
		description: 'SSL/Cloudflare protected with DDoS prevention',
	},
];
</script>

<style scoped lang="scss">
$primary: #4fc3f7;
$primary-dark: #0288d1;
$primary-darker: #01579b;
$primary-light: #e1f5fe;
$secondary: #FF5C00;
$navy: #0f172a;
$slate: #334155;
$gray: #475569;
$emerald: #10b981;
$bg: #f8fafc;

.trust {
	background: #fff;
	padding: 100px 0;

	@media (max-width: 768px) {
		padding: 64px 0;
	}
}

.trust__container {
	max-width: 1600px;
	margin: 0 auto;
	padding: 0 32px;

	@media (max-width: 768px) {
		padding: 0 16px;
	}
}

// Header
.trust__header {
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
		margin-bottom: 40px;
	}
}

.trust__shield-box {
	width: 72px;
	height: 72px;
	background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
	border-radius: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 24px;
	color: #fff;
	box-shadow: 0 8px 32px rgba($primary-dark, 0.25);
}

.trust__title {
	font-size: 52px;
	font-weight: 800;
	color: $navy;
	letter-spacing: -1px;
	margin: 0 0 16px;

	@media (max-width: 768px) {
		font-size: 36px;
	}

	@media (max-width: 480px) {
		font-size: 30px;
	}
}

.trust__subtitle {
	font-size: 20px;
	color: $gray;
	margin: 0;
	line-height: 1.5;

	@media (max-width: 768px) {
		font-size: 16px;
	}
}

// Cards
.trust__cards {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 24px;

	@media (max-width: 900px) {
		grid-template-columns: repeat(2, 1fr);
	}

	@media (max-width: 540px) {
		grid-template-columns: 1fr;
		max-width: 400px;
		margin: 0 auto;
	}
}

.trust__card {
	background: #fff;
	border: 1px solid #e2e8f0;
	border-radius: 20px;
	padding: 32px 24px;
	text-align: center;
	transition: transform 0.3s ease, box-shadow 0.3s ease, opacity 0.6s ease;
	opacity: 0;
	transform: translateY(24px);

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
	}

	&.revealed:hover {
		transform: translateY(-4px);
	}
}

.trust__card-icon {
	width: 56px;
	height: 56px;
	background: $primary-light;
	border-radius: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 18px;
	color: $primary-dark;
}

.trust__card-title {
	font-size: 20px;
	font-weight: 700;
	color: $navy;
	margin: 0 0 10px;
}

.trust__card-desc {
	font-size: 16px;
	color: $gray;
	line-height: 1.6;
	margin: 0;
}
</style>
