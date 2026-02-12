<template>
	<section class="stats-bar" ref="sectionRef">
		<div class="stats-bar__container">
			<div class="stats-bar__grid">
				<div
					v-for="stat in stats"
					:key="stat.label"
					class="stats-bar__item"
				>
					<span class="stats-bar__value">
						{{ stat.current }}{{ stat.suffix }}
					</span>
					<span class="stats-bar__label">{{ stat.label }}</span>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';

const sectionRef = ref(null);
let observer = null;
let animationId = null;

const stats = reactive([
	{ target: 500, current: 0, suffix: '+', label: 'Verified Specialists' },
	{ target: 15000, current: 0, suffix: '+', label: 'Consultations Completed' },
	{ target: 3087, current: 0, suffix: '', label: 'Medications Available' },
	{ target: 98, current: 0, suffix: '%', label: 'Patient Satisfaction' },
]);

function easeOutQuart(t) {
	return 1 - Math.pow(1 - t, 4);
}

function animateCountUp() {
	const duration = 2000;
	const startTime = performance.now();

	function step(currentTime) {
		const elapsed = currentTime - startTime;
		const progress = Math.min(elapsed / duration, 1);
		const easedProgress = easeOutQuart(progress);

		for (const stat of stats) {
			stat.current = Math.round(easedProgress * stat.target);
		}

		if (progress < 1) {
			animationId = requestAnimationFrame(step);
		}
	}

	animationId = requestAnimationFrame(step);
}

onMounted(() => {
	observer = new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting) {
				animateCountUp();
				observer.unobserve(entry.target);
			}
		},
		{ threshold: 0.3 }
	);

	if (sectionRef.value) {
		observer.observe(sectionRef.value);
	}
});

onUnmounted(() => {
	if (observer) observer.disconnect();
	if (animationId) cancelAnimationFrame(animationId);
});
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

.stats-bar {
	background: linear-gradient(135deg, $primary 0%, $primary-dark 100%);
	padding: 56px 0;

	@media (max-width: 768px) {
		padding: 40px 0;
	}
}

.stats-bar__container {
	max-width: 1600px;
	margin: 0 auto;
	padding: 0 32px;

	@media (max-width: 768px) {
		padding: 0 16px;
	}
}

.stats-bar__grid {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 32px;

	@media (max-width: 768px) {
		grid-template-columns: repeat(2, 1fr);
		gap: 28px 16px;
	}
}

.stats-bar__item {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 6px;
}

.stats-bar__value {
	font-size: 44px;
	font-weight: 800;
	color: #fff;
	line-height: 1;
	letter-spacing: -1px;
	font-variant-numeric: tabular-nums;

	@media (max-width: 768px) {
		font-size: 34px;
	}

	@media (max-width: 480px) {
		font-size: 28px;
	}
}

.stats-bar__label {
	font-size: 16px;
	font-weight: 500;
	color: rgba(255, 255, 255, 0.85);
	line-height: 1.3;

	@media (max-width: 768px) {
		font-size: 14px;
	}
}
</style>
