<template>
	<section id="eka" class="eka">
		<!-- Background blobs -->
		<div class="eka__blobs">
			<div class="eka__blob eka__blob--1"></div>
			<div class="eka__blob eka__blob--2"></div>
		</div>

		<div class="eka__container">
			<div class="eka__grid">
				<!-- Chat mockup (order-2 on desktop, order-1 on mobile) -->
				<div class="eka__visual">
					<div class="eka__card">
						<!-- Chat header -->
						<div class="eka__chat-header">
							<div class="eka__avatar">
								<span class="eka__avatar-dot"></span>
							</div>
							<div class="eka__chat-info">
								<span class="eka__chat-name">Eka Health Assistant</span>
								<span class="eka__chat-status">Online &bull; AI-Powered</span>
							</div>
						</div>

						<!-- Chat messages -->
						<div class="eka__chat-body">
							<div
								v-for="(msg, i) in chatMessages"
								:key="i"
								class="eka__msg"
								:class="`eka__msg--${msg.from}`"
								:style="{ animationDelay: `${0.6 + i * 0.8}s` }"
							>
								<p>{{ msg.text }}</p>
							</div>
						</div>

						<!-- AI Confidence box -->
						<div class="eka__confidence">
							<div class="eka__confidence-header">
								<v-icon name="hi-sparkles" scale="0.85" />
								<span class="eka__confidence-title">AI Confidence</span>
							</div>
							<div class="eka__confidence-bar">
								<div class="eka__confidence-fill"></div>
							</div>
							<p class="eka__confidence-desc">
								94% confidence &mdash; Symptom pattern matches 3 conditions. Recommending specialist consultation.
							</p>
						</div>
					</div>
				</div>

				<!-- Content (order-1 on desktop, order-2 on mobile) -->
				<div class="eka__content">
					<span class="eka__label">AI Health Assistant</span>

					<h2 class="eka__title">
						Meet Eka &mdash; Your 24/7 AI Health Companion
					</h2>

					<p class="eka__description">
						Powered by medical AI, Eka conducts intelligent symptom interviews,
						provides triage assessments, checks drug interactions, analyzes
						prescriptions, and connects you with the right specialist &mdash;
						all through natural conversation.
					</p>

					<!-- Feature pills -->
					<div class="eka__features">
						<div
							v-for="(feature, i) in features"
							:key="feature.label"
							class="eka__feature-pill"
						>
							<v-icon :name="feature.icon" scale="1" />
							<span>{{ feature.label }}</span>
						</div>
					</div>

					<button
						class="eka__cta"
						@click="$emit('openModal', 'eka')"
					>
						Try Eka Free
						<v-icon name="hi-arrow-right" scale="0.9" />
					</button>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
defineEmits(['openModal']);

const features = [
	{ icon: 'gi-stethoscope', label: 'Symptom Assessment' },
	{ icon: 'gi-medicines', label: 'Drug Interaction Checks' },
	{ icon: 'ri-file-text-line', label: 'Prescription Analysis' },
	{ icon: 'hi-user-group', label: 'Smart Specialist Matching' },
	{ icon: 'ri-tools-line', label: '17+ Medical Tools' },
	{ icon: 'ri-global-line', label: 'Multi-Language Support' },
];

const chatMessages = [
	{ from: 'user', text: "I've been having headaches and fatigue for 3 days" },
	{ from: 'eka', text: 'I understand. Let me ask a few questions to help assess your symptoms. Have you experienced any fever or visual changes?' },
	{ from: 'user', text: 'Mild fever, no visual issues' },
];
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

// ── Section ───────────────────────────────────────────────────
.eka {
	position: relative;
	background: $navy;
	color: $navy-fg;
	@include section-padding;
	overflow: hidden;
}

// ── Background blobs ──────────────────────────────────────────
.eka__blobs {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 0;
}

.eka__blob {
	position: absolute;
	border-radius: 50%;
	filter: blur(120px);

	&--1 {
		width: 400px;
		height: 400px;
		top: -100px;
		right: -80px;
		background: rgba($teal, 0.1);
		animation: blob-float 20s ease-in-out infinite;
	}

	&--2 {
		width: 300px;
		height: 300px;
		bottom: -80px;
		left: -60px;
		background: rgba($primary, 0.1);
		animation: blob-float-reverse 25s ease-in-out infinite;
	}
}

// ── Container ─────────────────────────────────────────────────
.eka__container {
	@include container;
	position: relative;
	z-index: 1;
}

// ── Grid ──────────────────────────────────────────────────────
.eka__grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 64px;
	align-items: center;

	@media (max-width: $bp-lg) {
		grid-template-columns: 1fr;
		gap: 48px;
	}
}

// ── Visual (chat mockup) ─────────────────────────────────────
.eka__visual {
	order: 2;
	display: flex;
	justify-content: center;

	@media (max-width: $bp-lg) {
		order: 1;
	}
}

.eka__card {
	@include card-glass-dark;
	padding: 24px;
	max-width: 420px;
	width: 100%;

	&:hover {
		transform: none;
	}
}

// ── Chat header ───────────────────────────────────────────────
.eka__chat-header {
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.eka__avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: linear-gradient(135deg, $teal, $primary);
	position: relative;
	flex-shrink: 0;
}

.eka__avatar-dot {
	width: 12px;
	height: 12px;
	background: $emerald;
	border-radius: 50%;
	border: 2px solid $navy;
	position: absolute;
	bottom: -2px;
	right: -2px;
}

.eka__chat-info {
	display: flex;
	flex-direction: column;
}

.eka__chat-name {
	font-size: 15px;
	font-weight: 700;
	color: $white;
}

.eka__chat-status {
	font-size: 12px;
	color: $emerald;
	font-weight: 500;
}

// ── Chat messages ─────────────────────────────────────────────
.eka__chat-body {
	display: flex;
	flex-direction: column;
	gap: 12px;
	margin-bottom: 20px;
}

.eka__msg {
	max-width: 88%;
	padding: 12px 16px;
	border-radius: 16px;
	font-size: 13px;
	line-height: 1.55;
	opacity: 0;
	transform: translateY(12px) scale(0.95);
	animation: chat-appear 0.5s ease forwards;

	p {
		margin: 0;
	}

	&--user {
		align-self: flex-end;
		background: rgba($primary, 0.2);
		color: $white;
		border-bottom-right-radius: 4px;
	}

	&--eka {
		align-self: flex-start;
		background: rgba(255, 255, 255, 0.1);
		color: $white;
		border-bottom-left-radius: 4px;
	}
}

// ── AI Confidence box ─────────────────────────────────────────
.eka__confidence {
	background: linear-gradient(135deg, rgba($teal, 0.2), rgba($primary, 0.2));
	border: 1px solid rgba($teal, 0.2);
	border-radius: 12px;
	padding: 16px;
}

.eka__confidence-header {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 12px;
	color: $teal;

	:deep(svg) {
		color: $teal;
	}
}

.eka__confidence-title {
	font-size: 14px;
	font-weight: 700;
	color: $white;
}

.eka__confidence-bar {
	height: 8px;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 10px;
	overflow: hidden;
	margin-bottom: 10px;
}

.eka__confidence-fill {
	height: 100%;
	width: 94%;
	background: linear-gradient(90deg, $teal, $primary);
	border-radius: 10px;
	animation: confidence-grow 1.5s ease 0.8s both;
}

@keyframes confidence-grow {
	from {
		width: 0;
	}
	to {
		width: 94%;
	}
}

.eka__confidence-desc {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.6);
	line-height: 1.5;
	margin: 0;
}

// ── Content (text side) ──────────────────────────────────────
.eka__content {
	order: 1;
	display: flex;
	flex-direction: column;
	align-items: flex-start;

	@media (max-width: $bp-lg) {
		order: 2;
	}
}

.eka__label {
	@include section-label($teal);
}

.eka__title {
	@include section-title($white);
	max-width: 560px;
}

.eka__description {
	@include section-subtitle(rgba(255, 255, 255, 0.7));
	margin: 0 0 32px;
	max-width: 540px;
}

// ── Feature pills ─────────────────────────────────────────────
.eka__features {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-bottom: 36px;
}

.eka__feature-pill {
	@include card-glass-dark;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 12px 18px;
	border-radius: 12px;
	font-size: 14px;
	font-weight: 600;
	color: $white;
	transition: background 0.3s ease, transform 0.25s ease;

	&:hover {
		background: rgba($teal, 0.15);
		transform: translateY(-2px);
	}

	:deep(svg) {
		color: $white;
		flex-shrink: 0;
	}
}

// ── CTA button ────────────────────────────────────────────────
.eka__cta {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 12px 32px;
	font-size: 16px;
	font-weight: 600;
	color: $white;
	background: linear-gradient(to right, $teal, $primary-dark);
	border: none;
	border-radius: 50px;
	cursor: pointer;
	box-shadow: 0 10px 15px -3px rgba($teal, 0.25);
	transition: all 0.3s ease;

	&:hover {
		box-shadow: 0 20px 25px -5px rgba($teal, 0.35);
		transform: scale(1.05);
	}

	&:active {
		transform: scale(1);
	}
}
</style>
