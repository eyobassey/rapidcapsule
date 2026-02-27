<template>
	<section id="rxgpt" class="rxgpt">
		<!-- Background blob -->
		<div class="rxgpt__blobs">
			<div class="rxgpt__blob rxgpt__blob--1"></div>
		</div>

		<div class="rxgpt__container">
			<div class="rxgpt__grid">
				<!-- Left: Content -->
				<div class="rxgpt__content">
					<span class="rxgpt__label" :ref="reveal">
						RxGPT &mdash; Clinical Decision Support
					</span>

					<h2
						class="rxgpt__title"
						:ref="reveal"
						:style="{ transitionDelay: '80ms' }"
					>
						AI Prescription Verification Against 6 Clinical Databases
					</h2>

					<p
						class="rxgpt__description"
						:ref="reveal"
						:style="{ transitionDelay: '160ms' }"
					>
						RxGPT is a glass-box AI system that verifies every prescription
						against authoritative medical sources. Every recommendation is
						traceable, every interaction is checked, and a 7-layer
						hallucination detection pipeline ensures clinical accuracy.
					</p>

					<!-- Source badges -->
					<div
						class="rxgpt__sources"
						:ref="reveal"
						:style="{ transitionDelay: '240ms' }"
					>
						<div
							v-for="source in sources"
							:key="source.label"
							class="rxgpt__source-badge"
						>
							<v-icon :name="source.icon" scale="0.9" />
							<span>{{ source.label }}</span>
						</div>
					</div>

					<!-- Safety tiers -->
					<div
						class="rxgpt__tiers"
						:ref="reveal"
						:style="{ transitionDelay: '320ms' }"
					>
						<div
							v-for="tier in safetyTiers"
							:key="tier.label"
							class="rxgpt__tier"
							:class="`rxgpt__tier--${tier.color}`"
						>
							<div class="rxgpt__tier-icon">
								<v-icon :name="tier.icon" scale="1.1" />
							</div>
							<span class="rxgpt__tier-label">{{ tier.label }}</span>
							<span class="rxgpt__tier-desc">{{ tier.desc }}</span>
						</div>
					</div>

					<button
						class="rxgpt__cta"
						:ref="reveal"
						:style="{ transitionDelay: '400ms' }"
						@click="$emit('openModal', 'rxgpt')"
					>
						Explore RxGPT
						<v-icon name="hi-arrow-right" scale="0.9" />
					</button>
				</div>

				<!-- Right: Visual card -->
				<div
					class="rxgpt__visual"
					:ref="reveal"
					:style="{ transitionDelay: '120ms' }"
				>
					<div class="rxgpt__card">
						<!-- Header -->
						<div class="rxgpt__card-header">
							<div class="rxgpt__card-icon">
								<v-icon name="ri-file-shield-line" scale="1.2" />
							</div>
							<div class="rxgpt__card-info">
								<span class="rxgpt__card-title">RxGPT Analysis</span>
								<span class="rxgpt__card-sub">Amoxicillin 500mg &bull; 3x daily</span>
							</div>
						</div>

						<!-- Check items -->
						<div class="rxgpt__checks">
							<div
								v-for="(check, i) in checks"
								:key="check"
								class="rxgpt__check-item"
								:ref="reveal"
								:style="{ transitionDelay: `${300 + i * 100}ms` }"
							>
								<span class="rxgpt__check-icon">
									<v-icon name="hi-check-circle" scale="0.85" />
								</span>
								<span class="rxgpt__check-text">{{ check }}</span>
							</div>
						</div>

						<!-- Result -->
						<div class="rxgpt__result">
							<v-icon name="hi-check-circle" scale="1" />
							<span>All 7 Checks Passed</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal';

defineEmits(['openModal']);

const { reveal } = useScrollReveal();

const sources = [
	{ icon: 'ri-search-line', label: 'PubMed' },
	{ icon: 'ri-global-line', label: 'WHO Essential' },
	{ icon: 'hi-shield-check', label: 'OpenFDA' },
	{ icon: 'hi-check-circle', label: 'NICE Guidelines' },
	{ icon: 'ri-book-open-line', label: 'BNF' },
	{ icon: 'ri-database-2-line', label: 'RxNav' },
];

const safetyTiers = [
	{ label: 'SAFE', desc: 'All checks pass', color: 'emerald', icon: 'hi-shield-check' },
	{ label: 'REVIEW', desc: 'Needs attention', color: 'amber', icon: 'hi-exclamation' },
	{ label: 'FLAGGED', desc: 'Safety concern', color: 'destructive', icon: 'hi-x-circle' },
];

const checks = [
	'Dosage Range',
	'Drug Interactions',
	'Allergies',
	'Contraindications',
	'Pregnancy Safety',
	'Renal Adjustment',
	'Evidence Quality',
];
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

// ── Section ───────────────────────────────────────────────────
.rxgpt {
	position: relative;
	@include section-padding;
	overflow: hidden;
}

// ── Background blob ───────────────────────────────────────────
.rxgpt__blobs {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 0;
}

.rxgpt__blob {
	position: absolute;
	border-radius: 50%;
	filter: blur(120px);

	&--1 {
		width: 300px;
		height: 300px;
		top: -80px;
		left: -60px;
		background: rgba($accent, 0.05);
		animation: blob-float 20s ease-in-out infinite;
	}
}

// ── Container ─────────────────────────────────────────────────
.rxgpt__container {
	@include container;
	position: relative;
	z-index: 1;
}

// ── Grid ──────────────────────────────────────────────────────
.rxgpt__grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 64px;
	align-items: center;

	@media (max-width: $bp-lg) {
		grid-template-columns: 1fr;
		gap: 48px;
	}
}

// ── Content (left) ────────────────────────────────────────────
.rxgpt__content {
	display: flex;
	flex-direction: column;
	align-items: flex-start;

	@media (max-width: $bp-lg) {
		order: 1;
	}
}

.rxgpt__label {
	@include section-label($accent);
	@include reveal-base;
}

.rxgpt__title {
	@include section-title($foreground);
	@include reveal-base;
	max-width: 560px;
}

.rxgpt__description {
	@include section-subtitle($muted-fg);
	@include reveal-base;
	margin: 0 0 32px;
	max-width: 540px;
}

// ── Source badges ─────────────────────────────────────────────
.rxgpt__sources {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	margin-bottom: 28px;
	@include reveal-base;
}

.rxgpt__source-badge {
	@include card-glass;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 16px;
	border-radius: 12px;
	font-size: 13px;
	font-weight: 600;
	color: $foreground;
	transition: transform 0.25s ease, box-shadow 0.25s ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
	}

	:deep(svg) {
		color: $accent;
		flex-shrink: 0;
	}
}

// ── Safety tiers ──────────────────────────────────────────────
.rxgpt__tiers {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 12px;
	margin-bottom: 36px;
	width: 100%;
	max-width: 480px;
	@include reveal-base;

	@media (max-width: $bp-sm) {
		grid-template-columns: 1fr;
	}
}

.rxgpt__tier {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	padding: 18px 16px;
	border-radius: 14px;
	gap: 6px;
	transition: transform 0.25s ease;

	&:hover {
		transform: translateY(-3px);
	}

	// SAFE
	&--emerald {
		background: rgba($emerald, 0.1);
		border: 1px solid rgba($emerald, 0.3);

		.rxgpt__tier-icon {
			background: rgba($emerald, 0.15);
			color: $emerald;
		}

		.rxgpt__tier-label {
			color: $emerald;
		}
	}

	// REVIEW
	&--amber {
		background: rgba($amber-500, 0.1);
		border: 1px solid rgba($amber-500, 0.3);

		.rxgpt__tier-icon {
			background: rgba($amber-500, 0.15);
			color: $amber-500;
		}

		.rxgpt__tier-label {
			color: $amber-500;
		}
	}

	// FLAGGED
	&--destructive {
		background: rgba($destructive, 0.1);
		border: 1px solid rgba($destructive, 0.3);

		.rxgpt__tier-icon {
			background: rgba($destructive, 0.15);
			color: $destructive;
		}

		.rxgpt__tier-label {
			color: $destructive;
		}
	}
}

.rxgpt__tier-icon {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.rxgpt__tier-label {
	font-size: 14px;
	font-weight: 800;
	letter-spacing: 0.5px;
}

.rxgpt__tier-desc {
	font-size: 12px;
	color: $muted-fg;
	font-weight: 500;
}

// ── CTA button ────────────────────────────────────────────────
.rxgpt__cta {
	@include reveal-base;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 12px 32px;
	font-size: 16px;
	font-weight: 600;
	color: $white;
	background: linear-gradient(to right, $accent, $accent-dark);
	border: none;
	border-radius: 50px;
	cursor: pointer;
	box-shadow: 0 10px 15px -3px rgba($accent, 0.25);
	transition: all 0.3s ease;

	&:hover {
		box-shadow: 0 20px 25px -5px rgba($accent, 0.35);
		transform: scale(1.05);
	}

	&:active {
		transform: scale(1);
	}
}

// ── Visual (right) ────────────────────────────────────────────
.rxgpt__visual {
	display: flex;
	justify-content: center;
	@include reveal-base;

	@media (max-width: $bp-lg) {
		order: 2;
	}
}

.rxgpt__card {
	@include card-glass;
	padding: 24px;
	max-width: 420px;
	width: 100%;
}

// ── Card header ───────────────────────────────────────────────
.rxgpt__card-header {
	display: flex;
	align-items: center;
	gap: 14px;
	margin-bottom: 20px;
	padding-bottom: 16px;
	border-bottom: 1px solid $border;
}

.rxgpt__card-icon {
	width: 44px;
	height: 44px;
	border-radius: 12px;
	background: rgba($accent, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;

	:deep(svg) {
		color: $accent;
	}
}

.rxgpt__card-info {
	display: flex;
	flex-direction: column;
}

.rxgpt__card-title {
	font-size: 17px;
	font-weight: 700;
	color: $foreground;
}

.rxgpt__card-sub {
	font-size: 13px;
	color: $muted-fg;
	font-weight: 500;
}

// ── Check items ───────────────────────────────────────────────
.rxgpt__checks {
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-bottom: 20px;
}

.rxgpt__check-item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 14px;
	background: rgba($emerald, 0.05);
	border-radius: 10px;
	@include reveal-base;
}

.rxgpt__check-icon {
	width: 22px;
	height: 22px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;

	:deep(svg) {
		color: $emerald;
	}
}

.rxgpt__check-text {
	font-size: 14px;
	font-weight: 500;
	color: $foreground;
}

// ── Result row ────────────────────────────────────────────────
.rxgpt__result {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 14px 18px;
	background: rgba($emerald, 0.1);
	border: 1px solid rgba($emerald, 0.25);
	border-radius: 12px;
	font-size: 15px;
	font-weight: 700;
	color: $emerald;

	:deep(svg) {
		color: $emerald;
	}
}
</style>
