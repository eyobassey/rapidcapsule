<template>
	<section class="cta">
		<div class="cta__bg-decor">
			<div class="cta__circle cta__circle--1"></div>
			<div class="cta__circle cta__circle--2"></div>
		</div>

		<div class="cta__container" :ref="reveal">
			<h2 class="cta__title">Ready to Transform Your Healthcare Experience?</h2>
			<p class="cta__subtitle">
				Join thousands of patients and specialists already using Rapid Capsule
			</p>

			<div class="cta__buttons">
				<router-link to="/signup/patient" class="cta__btn cta__btn--primary">
					Get Started Now
					<v-icon name="hi-arrow-right" scale="0.9" />
				</router-link>
				<a href="#" class="cta__btn cta__btn--ghost">
					Schedule a Demo
				</a>
			</div>
		</div>
	</section>
</template>

<script setup>
import { useScrollReveal } from '@/composables/useScrollReveal.js';

const { reveal } = useScrollReveal();
</script>

<style scoped lang="scss">
// Design tokens
$primary: #4fc3f7;
$primary-dark: #0288d1;
$primary-light: #e1f5fe;
$secondary: #FF5C00;
$secondary-dark: #E05000;
$navy: #0f172a;
$slate: #334155;
$gray: #64748b;
$emerald: #10b981;
$bg: #f8fafc;

.cta {
	position: relative;
	background: linear-gradient(135deg, $navy 0%, #1e3a5f 100%);
	padding: 96px 0;
	overflow: hidden;

	@media (max-width: 768px) {
		padding: 64px 0;
	}
}

.cta__bg-decor {
	position: absolute;
	inset: 0;
	pointer-events: none;
}

.cta__circle {
	position: absolute;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.04);
	filter: blur(60px);

	&--1 {
		width: 400px;
		height: 400px;
		top: -120px;
		right: -80px;
	}

	&--2 {
		width: 300px;
		height: 300px;
		bottom: -100px;
		left: -60px;
	}
}

.cta__container {
	max-width: 960px;
	margin: 0 auto;
	padding: 0 32px;
	text-align: center;
	position: relative;
	z-index: 2;
	opacity: 0;
	transform: translateY(24px);
	transition: opacity 0.6s ease, transform 0.6s ease;

	&.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	@media (max-width: 768px) {
		padding: 0 16px;
	}
}

.cta__title {
	font-size: 48px;
	font-weight: 800;
	color: #fff;
	letter-spacing: -1px;
	line-height: 1.2;
	margin: 0 0 20px;

	@media (max-width: 768px) {
		font-size: 32px;
	}

	@media (max-width: 480px) {
		font-size: 26px;
	}
}

.cta__subtitle {
	font-size: 20px;
	color: rgba(255, 255, 255, 0.75);
	line-height: 1.6;
	margin: 0 0 40px;
	max-width: 560px;
	margin-left: auto;
	margin-right: auto;

	@media (max-width: 768px) {
		font-size: 16px;
		margin-bottom: 32px;
	}
}

.cta__buttons {
	display: flex;
	gap: 16px;
	justify-content: center;
	flex-wrap: wrap;

	@media (max-width: 540px) {
		flex-direction: column;
		align-items: stretch;
	}
}

.cta__btn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	padding: 16px 36px;
	font-size: 16px;
	font-weight: 700;
	border-radius: 50px;
	text-decoration: none;
	transition: all 0.25s ease;

	&--primary {
		background: $secondary;
		color: #fff;
		box-shadow: 0 8px 30px rgba($secondary, 0.35);

		&:hover {
			background: $secondary-dark;
			transform: translateY(-2px);
			box-shadow: 0 12px 36px rgba($secondary, 0.45);
		}
	}

	&--ghost {
		background: transparent;
		color: #fff;
		border: 2px solid rgba(255, 255, 255, 0.5);

		&:hover {
			background: rgba(255, 255, 255, 0.1);
			border-color: #fff;
			transform: translateY(-2px);
		}
	}

	@media (max-width: 540px) {
		padding: 14px 28px;
	}
}
</style>
