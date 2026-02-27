<template>
	<section class="spec-cta">
		<!-- Background blob -->
		<div class="spec-cta__blobs">
			<div class="spec-cta__blob"></div>
		</div>

		<div class="spec-cta__container">
			<div class="spec-cta__grid">
				<!-- Left: Content -->
				<div class="spec-cta__content">
					<h2 class="spec-cta__title">Built for Healthcare Providers Too</h2>
					<p class="spec-cta__desc">
						Manage your practice, see patients via video, write prescriptions with AI-powered
						safety checks, and grow your patient base — all with a simple per-consultation model.
					</p>

					<ul class="spec-cta__features">
						<li
							v-for="(feature, i) in features"
							:key="feature"
						>
							<v-icon name="hi-check-circle" scale="0.95" />
							<span>{{ feature }}</span>
						</li>
					</ul>

					<router-link
						to="/signup/specialist"
						class="spec-cta__btn"
					>
						Join as a Specialist &rarr;
					</router-link>
				</div>

				<!-- Right: Dashboard mockup -->
				<div class="spec-cta__visual">
					<div class="spec-cta__card">
						<div class="spec-cta__card-header">
							<span class="spec-cta__card-title">Specialist Dashboard</span>
							<span class="spec-cta__live-badge">Live</span>
						</div>

						<div class="spec-cta__card-rows">
							<div class="spec-cta__row">
								<span class="spec-cta__row-label">Today's Consultations</span>
								<span class="spec-cta__row-value">12</span>
							</div>
							<div class="spec-cta__row">
								<span class="spec-cta__row-label">Pending Reviews</span>
								<span class="spec-cta__row-value">3</span>
							</div>
							<div class="spec-cta__row">
								<span class="spec-cta__row-label">This Month Earnings</span>
								<span class="spec-cta__row-value spec-cta__row-value--emerald">$4,280</span>
							</div>
							<div class="spec-cta__row spec-cta__row--last">
								<span class="spec-cta__row-label">Patient Rating</span>
								<span class="spec-cta__row-value">4.9 &#11088;</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
const features = [
	'RxGPT AI prescription assistant',
	'Clinical notes with SOAP templates',
	'Patient management dashboard',
	'Earnings analytics and bank payouts',
	'9-step onboarding with license verification',
];
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

// ── Section ──────────────────────────────────────────────────
.spec-cta {
	position: relative;
	background: $navy;
	color: $navy-fg;
	@include section-padding;
	overflow: hidden;
}

// ── Background blob ──────────────────────────────────────────
.spec-cta__blobs {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 0;
}

.spec-cta__blob {
	position: absolute;
	width: 400px;
	height: 400px;
	top: -100px;
	right: -80px;
	border-radius: 50%;
	background: rgba($primary, 0.1);
	filter: blur(120px);
	animation: blob-float 20s ease-in-out infinite;
}

// ── Container ────────────────────────────────────────────────
.spec-cta__container {
	@include container;
	position: relative;
	z-index: 1;
}

// ── Grid ─────────────────────────────────────────────────────
.spec-cta__grid {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 64px;
	align-items: center;

	@media (max-width: $bp-lg) {
		grid-template-columns: 1fr;
		gap: 48px;
	}
}

// ── Content (left) ───────────────────────────────────────────
.spec-cta__content {
}

.spec-cta__title {
	@include section-title($white);
	max-width: 520px;
}

.spec-cta__desc {
	font-size: 18px;
	color: rgba(255, 255, 255, 0.7);
	line-height: 1.75;
	margin: 0 0 32px;
	max-width: 480px;

	@media (max-width: $bp-md) {
		font-size: 16px;
	}
}

// ── Feature list ─────────────────────────────────────────────
.spec-cta__features {
	list-style: none;
	padding: 0;
	margin: 0 0 40px;
	display: flex;
	flex-direction: column;
	gap: 14px;

	li {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 16px;
		font-weight: 500;
		color: $white;

		.ov-icon {
			color: $white;
			flex-shrink: 0;
		}
	}
}

// ── CTA button (bordered) ───────────────────────────────────
.spec-cta__btn {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 14px 32px;
	font-size: 16px;
	font-weight: 600;
	color: $white;
	border: 1.5px solid rgba(255, 255, 255, 0.3);
	border-radius: 50px;
	text-decoration: none;
	background: transparent;
	transition: all 0.3s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.5);
		transform: translateY(-2px);
	}
}

// ── Visual (right) ──────────────────────────────────────────
.spec-cta__visual {
	display: flex;
	justify-content: center;
}

.spec-cta__card {
	@include card-glass-dark;
	padding: 28px;
	width: 100%;
	max-width: 420px;

	&:hover {
		transform: none;
	}
}

// ── Card header ──────────────────────────────────────────────
.spec-cta__card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 24px;
	padding-bottom: 16px;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.spec-cta__card-title {
	font-size: 16px;
	font-weight: 700;
	color: $white;
}

.spec-cta__live-badge {
	display: inline-flex;
	align-items: center;
	padding: 4px 12px;
	font-size: 12px;
	font-weight: 600;
	color: $emerald;
	background: rgba($emerald, 0.2);
	border-radius: 50px;
}

// ── Data rows ────────────────────────────────────────────────
.spec-cta__card-rows {
	display: flex;
	flex-direction: column;
}

.spec-cta__row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 0;
	border-bottom: 1px solid rgba(255, 255, 255, 0.1);

	&--last {
		border-bottom: none;
	}
}

.spec-cta__row-label {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.6);
	font-weight: 500;
}

.spec-cta__row-value {
	font-size: 18px;
	font-weight: 700;
	color: $white;

	&--emerald {
		color: $emerald;
	}
}
</style>
