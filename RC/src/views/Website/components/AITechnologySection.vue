<template>
	<section class="ai-tech">
		<div class="ai-tech__bg-decor">
			<div class="ai-tech__glow ai-tech__glow--1"></div>
			<div class="ai-tech__glow ai-tech__glow--2"></div>
		</div>

		<div class="ai-tech__container">
			<div class="ai-tech__header" :ref="reveal">
				<h2 class="ai-tech__title">Powered by Cutting-Edge AI</h2>
				<p class="ai-tech__subtitle">
					Evidence-based medicine meets artificial intelligence
				</p>
			</div>

			<div class="ai-tech__cards">
				<div
					v-for="(card, i) in featureCards"
					:key="card.title"
					class="ai-tech__card"
					:ref="reveal"
					:style="{ transitionDelay: `${i * 120}ms` }"
				>
					<div class="ai-tech__card-icon">
						<v-icon :name="card.icon" scale="1.4" />
					</div>
					<h3 class="ai-tech__card-title">{{ card.title }}</h3>
					<p class="ai-tech__card-desc">{{ card.description }}</p>
				</div>
			</div>

			<div class="ai-tech__evidence" :ref="reveal">
				<div class="ai-tech__sources">
					<span class="ai-tech__sources-label">Verified Sources</span>
					<div class="ai-tech__source-badges">
						<div class="ai-tech__source-badge">
							<v-icon name="hi-academic-cap" scale="1" />
							<span>PubMed</span>
						</div>
						<div class="ai-tech__source-badge">
							<v-icon name="hi-globe-alt" scale="1" />
							<span>WHO EML</span>
						</div>
						<div class="ai-tech__source-badge">
							<v-icon name="hi-shield-check" scale="1" />
							<span>OpenFDA</span>
						</div>
						<div class="ai-tech__source-badge">
							<v-icon name="hi-document-text" scale="1" />
							<span>NICE</span>
						</div>
						<div class="ai-tech__source-badge">
							<v-icon name="hi-beaker" scale="1" />
							<span>BNF</span>
						</div>
						<div class="ai-tech__source-badge">
							<v-icon name="hi-database" scale="1" />
							<span>RxNav</span>
						</div>
					</div>
				</div>
				<div class="ai-tech__accuracy">
					<span class="ai-tech__accuracy-value">6</span>
					<span class="ai-tech__accuracy-label">Clinical Sources Verified</span>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal';

const { reveal } = useScrollReveal();

const featureCards = [
	{
		icon: 'fa-microscope',
		title: 'Intelligent Symptom Analysis',
		description:
			'Advanced AI-powered natural language processing for symptom assessment and intelligent triage',
	},
	{
		icon: 'hi-database',
		title: 'Multi-Source Verification',
		description:
			'Cross-referenced with PubMed, WHO EML, OpenFDA, NICE guidelines, BNF, and RxNav',
	},
	{
		icon: 'hi-shield-check',
		title: 'Drug Interaction Checker',
		description:
			'Real-time safety alerts and contraindication detection across multiple clinical databases',
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

.ai-tech {
	position: relative;
	background: $navy;
	padding: 100px 0;
	overflow: hidden;

	@media (max-width: 768px) {
		padding: 64px 0;
	}
}

.ai-tech__bg-decor {
	position: absolute;
	inset: 0;
	pointer-events: none;
}

.ai-tech__glow {
	position: absolute;
	border-radius: 50%;
	filter: blur(100px);

	&--1 {
		width: 500px;
		height: 500px;
		top: -150px;
		right: -100px;
		background: rgba($primary-dark, 0.15);
	}

	&--2 {
		width: 400px;
		height: 400px;
		bottom: -100px;
		left: -80px;
		background: rgba($primary, 0.1);
	}
}

.ai-tech__container {
	max-width: 1600px;
	margin: 0 auto;
	padding: 0 40px;
	position: relative;
	z-index: 2;

	@media (max-width: 768px) {
		padding: 0 20px;
	}
}

// Header
.ai-tech__header {
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

.ai-tech__title {
	font-size: 52px;
	font-weight: 800;
	color: #fff;
	letter-spacing: -1px;
	margin: 0 0 16px;

	@media (max-width: 768px) {
		font-size: 36px;
	}

	@media (max-width: 480px) {
		font-size: 30px;
	}
}

.ai-tech__subtitle {
	font-size: 20px;
	color: rgba(255, 255, 255, 0.6);
	margin: 0;
	line-height: 1.5;

	@media (max-width: 768px) {
		font-size: 16px;
	}
}

// Cards grid
.ai-tech__cards {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 24px;
	margin-bottom: 48px;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
		max-width: 480px;
		margin-left: auto;
		margin-right: auto;
	}
}

.ai-tech__card {
	background: rgba(255, 255, 255, 0.08);
	backdrop-filter: blur(12px);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 20px;
	padding: 32px;
	text-align: center;
	transition: background 0.3s ease, transform 0.3s ease, opacity 0.6s ease;
	opacity: 0;
	transform: translateY(24px);

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	&:hover {
		background: rgba(255, 255, 255, 0.12);
		transform: translateY(-4px);
	}

	&.revealed:hover {
		transform: translateY(-4px);
	}
}

.ai-tech__card-icon {
	width: 64px;
	height: 64px;
	background: rgba($primary, 0.15);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 20px;
	color: $primary;
}

.ai-tech__card-title {
	font-size: 22px;
	font-weight: 700;
	color: #fff;
	margin: 0 0 12px;
}

.ai-tech__card-desc {
	font-size: 16px;
	color: rgba(255, 255, 255, 0.6);
	line-height: 1.6;
	margin: 0;
}

// Evidence panel
.ai-tech__evidence {
	background: rgba(255, 255, 255, 0.08);
	backdrop-filter: blur(12px);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 20px;
	padding: 32px 40px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 32px;
	opacity: 0;
	transform: translateY(24px);
	transition: opacity 0.6s ease 0.4s, transform 0.6s ease 0.4s;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	@media (max-width: 768px) {
		flex-direction: column;
		text-align: center;
		padding: 28px 24px;
	}
}

.ai-tech__sources {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.ai-tech__sources-label {
	font-size: 13px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.65);
	text-transform: uppercase;
	letter-spacing: 1px;
}

.ai-tech__source-badges {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;

	@media (max-width: 480px) {
		justify-content: center;
	}
}

.ai-tech__source-badge {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	background: rgba(255, 255, 255, 0.08);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 50px;
	color: $primary;
	font-size: 14px;
	font-weight: 600;

	span {
		color: rgba(255, 255, 255, 0.85);
	}
}

.ai-tech__accuracy {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	flex-shrink: 0;

	@media (max-width: 768px) {
		align-items: center;
	}
}

.ai-tech__accuracy-value {
	font-size: 48px;
	font-weight: 800;
	color: $primary;
	line-height: 1;
	letter-spacing: -1px;

	@media (max-width: 768px) {
		font-size: 40px;
	}
}

.ai-tech__accuracy-label {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.65);
	font-weight: 500;
	margin-top: 4px;
}
</style>
