<template>
	<nav class="site-nav" :class="{ scrolled }">
		<div class="nav-inner">
			<router-link to="/" class="nav-logo">
				<img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" class="nav-logo__img" />
			</router-link>

			<div class="nav-links">
				<a
					v-for="link in navLinks"
					:key="link.href"
					:href="link.href"
					class="nav-link"
					@click.prevent="scrollTo(link.href)"
				>{{ link.label }}</a>
			</div>

			<div class="nav-actions">
				<router-link to="/login" class="nav-signin">Sign In</router-link>
				<router-link to="/signup/patient" class="nav-cta">Get Started Free</router-link>
			</div>

			<button class="nav-hamburger" @click="mobileOpen = true" aria-label="Open menu">
				<v-icon name="io-menu" scale="1.4" />
			</button>
		</div>
	</nav>

	<!-- Mobile fullscreen menu -->
	<Teleport to="body">
		<transition name="mobile-menu">
			<div v-if="mobileOpen" class="mobile-overlay" @click.self="mobileOpen = false">
				<div class="mobile-menu">
					<div class="mobile-menu__header">
						<router-link to="/" class="nav-logo" @click="mobileOpen = false">
							<img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" class="nav-logo__img" />
						</router-link>
						<button class="mobile-menu__close" @click="mobileOpen = false" aria-label="Close menu">
							<v-icon name="hi-x" scale="1.3" />
						</button>
					</div>
					<div class="mobile-menu__body">
						<a
							v-for="link in navLinks"
							:key="link.href"
							:href="link.href"
							class="mobile-menu__link"
							@click.prevent="scrollTo(link.href); mobileOpen = false"
						>{{ link.label }}</a>
					</div>
					<div class="mobile-menu__actions">
						<router-link to="/signup/patient" class="mobile-menu__cta" @click="mobileOpen = false">Get Started Free</router-link>
						<router-link to="/login" class="mobile-menu__signin" @click="mobileOpen = false">Sign In</router-link>
					</div>
				</div>
			</div>
		</transition>
	</Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const mobileOpen = ref(false);
const scrolled = ref(false);

const navLinks = [
	{ href: '#features', label: 'Features' },
	{ href: '#how-it-works', label: 'How It Works' },
	{ href: '#specialists', label: 'For Specialists' },
	{ href: '#pricing', label: 'Pricing' },
	{ href: '#trust', label: 'About' },
];

function onScroll() {
	scrolled.value = window.scrollY > 20;
}

function scrollTo(href) {
	const el = document.querySelector(href);
	if (el) el.scrollIntoView({ behavior: 'smooth' });
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

.site-nav {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 50;
	background: transparent;
	transition: all 0.3s ease;

	&.scrolled {
		@include glass;
		box-shadow: 0 10px 15px -3px rgba($foreground, 0.05);
	}
}

.nav-inner {
	max-width: $max-width;
	margin: 0 auto;
	padding: 0 $container-px-xs;
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 64px;

	@media (min-width: $bp-sm) {
		padding: 0 $container-px-sm;
	}

	@media (min-width: $bp-lg) {
		padding: 0 $container-px;
		height: 80px;
	}
}

.nav-logo {
	flex-shrink: 0;
	text-decoration: none;
	display: flex;
	align-items: center;

	&__img {
		height: 34px;
		width: auto;

		@media (max-width: $bp-sm) {
			height: 28px;
		}
	}
}

.nav-links {
	display: none;
	align-items: center;
	gap: 32px;

	@media (min-width: $bp-lg) {
		display: flex;
	}
}

.nav-link {
	font-size: 14px;
	font-weight: 500;
	color: $muted-fg;
	text-decoration: none;
	transition: color 0.2s ease;

	&:hover {
		color: $foreground;
	}
}

.nav-actions {
	display: none;
	align-items: center;
	gap: 12px;

	@media (min-width: $bp-lg) {
		display: flex;
	}
}

.nav-signin {
	font-size: 14px;
	font-weight: 500;
	color: $muted-fg;
	text-decoration: none;
	padding: 8px 16px;
	transition: color 0.2s ease;

	&:hover {
		color: $foreground;
	}
}

.nav-cta {
	display: inline-flex;
	align-items: center;
	font-size: 14px;
	font-weight: 600;
	color: $accent-fg;
	background: linear-gradient(to right, $accent, $accent-dark);
	padding: 10px 24px;
	border-radius: 50px;
	text-decoration: none;
	box-shadow: 0 10px 15px -3px rgba($accent, 0.25);
	transition: all 0.3s ease;

	&:hover {
		box-shadow: 0 20px 25px -5px rgba($accent, 0.35);
		transform: scale(1.05);
	}
}

.nav-hamburger {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	background: none;
	border: none;
	cursor: pointer;
	color: $foreground;

	@media (min-width: $bp-lg) {
		display: none;
	}
}

// ── Mobile Menu ─────────────────────────────────────────
.mobile-overlay {
	position: fixed;
	inset: 0;
	z-index: 60;
	background: rgba($bg, 0.95);
	backdrop-filter: blur(24px);
	-webkit-backdrop-filter: blur(24px);
	display: flex;
	flex-direction: column;
}

.mobile-menu {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.mobile-menu__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 16px;
	height: 64px;
}

.mobile-menu__close {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 8px;
	background: none;
	border: none;
	cursor: pointer;
	color: $foreground;
}

.mobile-menu__body {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 32px;
}

.mobile-menu__link {
	font-size: 24px;
	font-weight: 700;
	color: $foreground;
	text-decoration: none;
}

.mobile-menu__actions {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 24px 16px;
	align-items: center;
}

.mobile-menu__cta {
	display: block;
	text-align: center;
	font-weight: 600;
	color: $accent-fg;
	background: linear-gradient(to right, $accent, $accent-dark);
	padding: 12px 32px;
	border-radius: 50px;
	text-decoration: none;
	box-shadow: 0 10px 15px -3px rgba($accent, 0.25);
	transition: all 0.3s ease;
}

.mobile-menu__signin {
	@include glass;
	display: block;
	text-align: center;
	font-weight: 600;
	padding: 12px 32px;
	border-radius: 50px;
	text-decoration: none;
	color: $foreground;
	transition: all 0.3s ease;
}

// ── Transition ──────────────────────────────────────────
.mobile-menu-enter-active,
.mobile-menu-leave-active {
	transition: opacity 0.3s ease;
}

.mobile-menu-enter-from,
.mobile-menu-leave-to {
	opacity: 0;
}
</style>
