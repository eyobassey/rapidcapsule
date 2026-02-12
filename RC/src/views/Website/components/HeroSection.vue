<template>
	<section class="hero">
		<div class="hero__bg-decor">
			<div class="hero__circle hero__circle--1"></div>
			<div class="hero__circle hero__circle--2"></div>
			<div class="hero__circle hero__circle--3"></div>
			<div class="hero__grid-pattern"></div>
		</div>

		<div class="hero__container">
			<div class="hero__content">
				<div class="hero__badge">
					<div class="badge-pulse"></div>
					<v-icon name="hi-lightning-bolt" scale="0.9" />
					<span>AI-Powered Healthcare Platform</span>
				</div>

				<h1 class="hero__title">
					Connected Care,<br />
					<span class="hero__title-accent">Anytime, Anywhere</span>
				</h1>

				<p class="hero__subtitle">
					Consult verified specialists via video, get AI-powered symptom assessments, and manage prescriptions — all from one secure platform.
				</p>

				<div class="hero__ctas">
					<router-link to="/signup/patient" class="btn-primary">
						Get Started Free
						<v-icon name="hi-arrow-right" scale="1" />
					</router-link>
					<router-link to="/signup/specialist" class="btn-ghost">
						<v-icon name="fa-stethoscope" scale="0.9" />
						For Healthcare Providers
					</router-link>
				</div>

				<div class="hero__badges">
					<div class="trust-badge">
						<v-icon name="gi-medicines" scale="1" />
						<span>3,087+ Medications</span>
					</div>
					<div class="trust-badge">
						<v-icon name="hi-user-group" scale="1" />
						<span>Verified Specialists</span>
					</div>
					<div class="trust-badge">
						<v-icon name="hi-shield-check" scale="1" />
						<span>Secure &amp; Private</span>
					</div>
				</div>
			</div>

			<div class="hero__visual">
				<!-- Main feature card -->
				<div class="preview-card preview-card--main">
					<div class="preview-card__header">
						<div class="preview-card__dot preview-card__dot--green"></div>
						<span class="preview-card__label">Live Consultation</span>
					</div>
					<div class="preview-card__body">
						<div class="preview-card__avatar">
							<v-icon name="fa-user-md" scale="1.6" />
						</div>
						<div class="preview-card__info">
							<span class="preview-card__name">Dr. Sarah Adeyemi</span>
							<span class="preview-card__role">Cardiologist</span>
						</div>
					</div>
					<div class="preview-card__status">
						<v-icon name="hi-video-camera" scale="0.8" />
						<span>Video consultation in progress</span>
					</div>
				</div>

				<!-- AI card -->
				<div class="preview-card preview-card--ai">
					<div class="preview-card__header">
						<v-icon name="hi-lightning-bolt" scale="0.8" />
						<span class="preview-card__label">RxGPT Verified</span>
					</div>
					<div class="preview-card__rx-body">
						<div class="rx-check">
							<v-icon name="hi-check-circle" scale="0.9" />
							<span>No drug interactions</span>
						</div>
						<div class="rx-check">
							<v-icon name="hi-check-circle" scale="0.9" />
							<span>Dosage confirmed</span>
						</div>
					</div>
				</div>

				<!-- Stats mini card -->
				<div class="preview-card preview-card--stats">
					<div class="stats-mini">
						<v-icon name="hi-heart" scale="1.2" />
						<span class="stats-mini__value">98%</span>
						<span class="stats-mini__label">Satisfaction</span>
					</div>
				</div>

				<!-- Floating accent elements -->
				<div class="float-dot float-dot--1"></div>
				<div class="float-dot float-dot--2"></div>
				<div class="float-dot float-dot--3"></div>
			</div>
		</div>

		<div class="hero__fade"></div>
	</section>
</template>

<script setup>
</script>

<style scoped lang="scss">
$primary: #4FC3F7;
$primary-dark: #0288D1;
$primary-darker: #01579B;
$secondary: #FF5C00;
$secondary-dark: #E05000;
$navy: #0F172A;
$emerald: #10B981;

.hero {
	position: relative;
	background: linear-gradient(135deg, #0288D1 0%, #01579B 40%, #0D47A1 100%);
	overflow: hidden;
	padding: 160px 0 100px;
	min-height: 720px;

	@media (max-width: 768px) {
		padding: 120px 0 64px;
		min-height: unset;
	}
}

.hero__bg-decor {
	position: absolute;
	inset: 0;
	pointer-events: none;
}

.hero__circle {
	position: absolute;
	border-radius: 50%;
	filter: blur(80px);

	&--1 {
		width: 600px;
		height: 600px;
		top: -200px;
		left: -150px;
		background: rgba($primary, 0.2);
	}

	&--2 {
		width: 500px;
		height: 500px;
		bottom: -200px;
		right: -100px;
		background: rgba(#1565C0, 0.25);
	}

	&--3 {
		width: 300px;
		height: 300px;
		top: 20%;
		right: 30%;
		background: rgba($primary, 0.08);
	}
}

.hero__grid-pattern {
	position: absolute;
	inset: 0;
	background-image:
		linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
		linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
	background-size: 60px 60px;
}

.hero__container {
	max-width: 1600px;
	margin: 0 auto;
	padding: 0 40px;
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 64px;
	align-items: center;
	position: relative;
	z-index: 2;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
		gap: 48px;
		text-align: center;
	}

	@media (max-width: 768px) {
		padding: 0 20px;
	}
}

.hero__content {
	animation: hero-enter 0.8s ease-out both;
}

@keyframes hero-enter {
	from { opacity: 0; transform: translateY(30px); }
	to { opacity: 1; transform: translateY(0); }
}

.hero__badge {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 10px 24px 10px 32px;
	background: rgba(255, 255, 255, 0.12);
	backdrop-filter: blur(12px);
	border: 1px solid rgba(255, 255, 255, 0.18);
	border-radius: 50px;
	font-size: 14px;
	font-weight: 600;
	color: #fff;
	margin-bottom: 28px;
	position: relative;
}

.badge-pulse {
	position: absolute;
	left: 14px;
	width: 10px;
	height: 10px;
	background: #4ade80;
	border-radius: 50%;
	animation: pulse 2s ease-in-out infinite;

	&::after {
		content: '';
		position: absolute;
		inset: -4px;
		background: rgba(74, 222, 128, 0.4);
		border-radius: 50%;
		animation: pulse-ring 2s ease-out infinite;
	}
}

.hero__title {
	font-size: 64px;
	font-weight: 800;
	color: #fff;
	line-height: 1.08;
	letter-spacing: -2px;
	margin: 0 0 24px;

	@media (max-width: 768px) {
		font-size: 42px;
		letter-spacing: -1px;
		br { display: none; }
	}

	@media (max-width: 480px) {
		font-size: 34px;
	}
}

.hero__title-accent {
	background: linear-gradient(90deg, #fff 0%, rgba(255, 255, 255, 0.6) 100%);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.hero__subtitle {
	font-size: 20px;
	color: rgba(255, 255, 255, 0.8);
	line-height: 1.7;
	margin: 0 0 36px;
	max-width: 520px;

	@media (max-width: 900px) {
		margin-left: auto;
		margin-right: auto;
	}

	@media (max-width: 768px) {
		font-size: 17px;
	}
}

.hero__ctas {
	display: flex;
	gap: 16px;
	margin-bottom: 44px;

	@media (max-width: 900px) {
		justify-content: center;
	}

	@media (max-width: 540px) {
		flex-direction: column;
	}
}

.btn-primary {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 18px 36px;
	background: $secondary;
	color: #fff;
	font-size: 17px;
	font-weight: 700;
	border-radius: 50px;
	text-decoration: none;
	transition: all 0.25s ease;
	box-shadow: 0 8px 32px rgba($secondary, 0.4);

	&:hover {
		background: $secondary-dark;
		transform: translateY(-3px);
		box-shadow: 0 14px 40px rgba($secondary, 0.5);
	}

	@media (max-width: 540px) {
		justify-content: center;
		padding: 16px 32px;
	}
}

.btn-ghost {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 18px 36px;
	background: rgba(255, 255, 255, 0.08);
	color: #fff;
	font-size: 17px;
	font-weight: 700;
	border-radius: 50px;
	border: 2px solid rgba(255, 255, 255, 0.35);
	text-decoration: none;
	transition: all 0.25s ease;

	&:hover {
		background: rgba(255, 255, 255, 0.18);
		border-color: rgba(255, 255, 255, 0.7);
		transform: translateY(-2px);
	}

	@media (max-width: 540px) {
		justify-content: center;
		padding: 16px 32px;
	}
}

.hero__badges {
	display: flex;
	gap: 14px;
	flex-wrap: wrap;

	@media (max-width: 900px) {
		justify-content: center;
	}

	@media (max-width: 540px) {
		flex-direction: column;
		align-items: stretch;
	}
}

.trust-badge {
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 12px 20px;
	background: rgba(255, 255, 255, 0.1);
	backdrop-filter: blur(8px);
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 50px;
	color: #fff;
	font-size: 14px;
	font-weight: 600;
	animation: badge-enter 0.6s ease-out both;

	&:nth-child(1) { animation-delay: 0.5s; }
	&:nth-child(2) { animation-delay: 0.65s; }
	&:nth-child(3) { animation-delay: 0.8s; }
}

@keyframes badge-enter {
	from { opacity: 0; transform: translateY(14px); }
	to { opacity: 1; transform: translateY(0); }
}

// Visual - Feature Preview Cards
.hero__visual {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 460px;
	animation: hero-enter 0.9s ease-out 0.25s both;

	@media (max-width: 900px) {
		display: none;
	}
}

.preview-card {
	position: absolute;
	background: rgba(255, 255, 255, 0.12);
	backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.18);
	border-radius: 20px;
	padding: 20px;
	color: #fff;

	&--main {
		top: 20px;
		left: 0;
		right: 20px;
		animation: card-float 4s ease-in-out infinite;
	}

	&--ai {
		bottom: 80px;
		right: 0;
		width: 260px;
		animation: card-float 4s ease-in-out 1s infinite;
	}

	&--stats {
		bottom: 20px;
		left: 20px;
		width: 160px;
		animation: card-float 4s ease-in-out 2s infinite;
	}
}

.preview-card__header {
	display: flex;
	align-items: center;
	gap: 8px;
	margin-bottom: 16px;
	color: rgba(255, 255, 255, 0.7);
}

.preview-card__dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;

	&--green {
		background: $emerald;
		box-shadow: 0 0 8px rgba($emerald, 0.5);
	}
}

.preview-card__label {
	font-size: 13px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.preview-card__body {
	display: flex;
	align-items: center;
	gap: 16px;
	margin-bottom: 16px;
}

.preview-card__avatar {
	width: 56px;
	height: 56px;
	background: rgba(255, 255, 255, 0.15);
	border-radius: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.preview-card__info {
	display: flex;
	flex-direction: column;
	gap: 3px;
}

.preview-card__name {
	font-size: 17px;
	font-weight: 700;
}

.preview-card__role {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.6);
}

.preview-card__status {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 14px;
	background: rgba($emerald, 0.2);
	border-radius: 10px;
	font-size: 13px;
	font-weight: 600;
	color: #a7f3d0;
}

// AI card
.preview-card__rx-body {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.rx-check {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	font-weight: 500;
	color: #a7f3d0;
}

// Stats mini card
.stats-mini {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;
	text-align: center;
	color: $primary;

	&__value {
		font-size: 32px;
		font-weight: 800;
		color: #fff;
		line-height: 1;
	}

	&__label {
		font-size: 12px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.6);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
}

// Floating accent dots
.float-dot {
	position: absolute;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.15);
	animation: float 4s ease-in-out infinite;

	&--1 {
		width: 12px;
		height: 12px;
		top: 10%;
		right: 5%;
		animation-delay: 0s;
	}

	&--2 {
		width: 8px;
		height: 8px;
		bottom: 25%;
		left: 5%;
		animation-delay: 1.5s;
	}

	&--3 {
		width: 16px;
		height: 16px;
		top: 50%;
		right: 85%;
		animation-delay: 3s;
	}
}

.hero__fade {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	height: 100px;
	background: linear-gradient(to top, #F8FAFC 0%, transparent 100%);
	z-index: 1;
}

// Keyframes
@keyframes pulse {
	0%, 100% { transform: scale(1); opacity: 1; }
	50% { transform: scale(1.2); opacity: 0.7; }
}

@keyframes pulse-ring {
	0% { transform: scale(1); opacity: 0.8; }
	100% { transform: scale(2.5); opacity: 0; }
}

@keyframes card-float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-10px); }
}

@keyframes float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-14px); }
}
</style>
