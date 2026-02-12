<template>
	<header class="site-header" :class="{ scrolled }">
		<div class="nav-container">
			<router-link to="/" class="nav-logo">
				<img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" class="nav-logo__img" />
			</router-link>

			<nav class="nav-links">
				<a v-for="link in navLinks" :key="link.href" :href="link.href" class="nav-link" @click.prevent="scrollTo(link.href)">{{ link.label }}</a>
			</nav>

			<div class="nav-actions">
				<router-link to="/login" class="btn-signin">Sign In</router-link>
				<router-link to="/signup/patient" class="btn-getstarted">Get Started</router-link>
			</div>

			<button class="hamburger" @click="drawerOpen = true" aria-label="Open menu">
				<v-icon name="io-menu" scale="1.4" />
			</button>
		</div>
	</header>

	<Teleport to="body">
		<transition name="overlay">
			<div v-if="drawerOpen" class="drawer-overlay" @click="drawerOpen = false"></div>
		</transition>
		<aside class="drawer" :class="{ open: drawerOpen }">
			<div class="drawer-header">
				<router-link to="/" class="drawer-brand" @click="drawerOpen = false">
					<img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" class="drawer-brand__img" />
				</router-link>
				<button class="drawer-close" @click="drawerOpen = false" aria-label="Close menu">
					<v-icon name="hi-x" scale="1.2" />
				</button>
			</div>
			<nav class="drawer-nav">
				<a v-for="link in navLinks" :key="link.href" :href="link.href" class="drawer-link" @click.prevent="scrollTo(link.href); drawerOpen = false">{{ link.label }}</a>
			</nav>
			<div class="drawer-actions">
				<router-link to="/login" class="btn-signin drawer-btn" @click="drawerOpen = false">Sign In</router-link>
				<router-link to="/signup/patient" class="btn-getstarted drawer-btn" @click="drawerOpen = false">Get Started</router-link>
			</div>
		</aside>
	</Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const drawerOpen = ref(false);
const scrolled = ref(false);

const navLinks = [
	{ href: '#how-it-works', label: 'How It Works' },
	{ href: '#benefits', label: 'Benefits' },
	{ href: '#technology', label: 'Technology' },
	{ href: '#try-it', label: 'Try It' },
	{ href: '#pricing', label: 'Pricing' },
	{ href: '#faq', label: 'FAQ' },
];

function onScroll() {
	scrolled.value = window.scrollY > 50;
}

function scrollTo(href) {
	const el = document.querySelector(href);
	if (el) el.scrollIntoView({ behavior: 'smooth' });
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }));
onUnmounted(() => window.removeEventListener('scroll', onScroll));
</script>

<style scoped lang="scss">
$primary: #4FC3F7;
$primary-dark: #0288D1;
$secondary: #FF5C00;
$secondary-dark: #E05000;
$navy: #0F172A;

.site-header {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 1000;
	background: #fff;
	transition: box-shadow 0.35s ease;

	&.scrolled {
		box-shadow: 0 2px 24px rgba(0, 0, 0, 0.08);
	}
}

.nav-container {
	max-width: 1600px;
	margin: 0 auto;
	padding: 14px 40px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 32px;

	@media (max-width: 768px) {
		padding: 10px 16px;
	}
}

.nav-logo {
	flex-shrink: 0;
	text-decoration: none;
	display: flex;
	align-items: center;

	&__img {
		height: 38px;
		width: auto;

		@media (max-width: 768px) {
			height: 32px;
		}
	}
}

.nav-links {
	display: flex;
	align-items: center;
	gap: 36px;

	@media (max-width: 900px) {
		display: none;
	}
}

.nav-link {
	text-decoration: none;
	font-size: 15px;
	font-weight: 600;
	color: $navy;
	transition: color 0.2s ease;
	white-space: nowrap;

	&:hover {
		color: $primary-dark;
	}
}

.nav-actions {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-shrink: 0;

	@media (max-width: 900px) {
		display: none;
	}
}

.btn-signin {
	text-decoration: none;
	font-size: 15px;
	font-weight: 600;
	padding: 10px 22px;
	border-radius: 50px;
	color: $navy;
	transition: all 0.2s ease;

	&:hover {
		background: rgba($primary, 0.08);
		color: $primary-dark;
	}
}

.btn-getstarted {
	text-decoration: none;
	font-size: 15px;
	font-weight: 600;
	padding: 10px 24px;
	border-radius: 50px;
	background: $secondary;
	color: #fff;
	transition: all 0.2s ease;
	box-shadow: 0 4px 16px rgba($secondary, 0.3);

	&:hover {
		background: $secondary-dark;
		transform: translateY(-1px);
		box-shadow: 0 6px 20px rgba($secondary, 0.4);
	}
}

.hamburger {
	display: none;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	border: none;
	background: none;
	cursor: pointer;
	border-radius: 12px;
	color: $navy;
	transition: background 0.2s ease;

	&:hover { background: rgba(0, 0, 0, 0.05); }

	@media (max-width: 900px) {
		display: flex;
	}
}

// Drawer
.drawer-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.4);
	z-index: 1001;
	backdrop-filter: blur(2px);
}

.overlay-enter-active,
.overlay-leave-active {
	transition: opacity 0.3s ease;
}
.overlay-enter-from,
.overlay-leave-to {
	opacity: 0;
}

.drawer {
	position: fixed;
	top: 0;
	right: 0;
	width: 320px;
	max-width: 85vw;
	height: 100vh;
	background: #fff;
	z-index: 1002;
	transform: translateX(100%);
	transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
	display: flex;
	flex-direction: column;
	box-shadow: -8px 0 40px rgba(0, 0, 0, 0.1);

	&.open {
		transform: translateX(0);
	}
}

.drawer-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	border-bottom: 1px solid #f1f5f9;
}

.drawer-brand {
	display: flex;
	align-items: center;
	text-decoration: none;

	&__img {
		height: 30px;
		width: auto;
	}
}

.drawer-close {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	background: none;
	cursor: pointer;
	border-radius: 10px;
	color: $navy;
	transition: background 0.2s ease;

	&:hover { background: #f1f5f9; }
}

.drawer-nav {
	display: flex;
	flex-direction: column;
	padding: 16px 0;
	flex: 1;
}

.drawer-link {
	text-decoration: none;
	font-size: 16px;
	font-weight: 500;
	color: $navy;
	padding: 14px 24px;
	transition: all 0.2s ease;

	&:hover {
		background: #f8fafc;
		color: $primary-dark;
	}
}

.drawer-actions {
	padding: 16px 20px;
	border-top: 1px solid #f1f5f9;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.drawer-btn {
	display: block;
	text-align: center;
	width: 100%;
	padding: 14px 20px;
	border-radius: 50px;
	font-size: 15px;
	font-weight: 600;
	text-decoration: none;
	transition: all 0.2s ease;

	&.btn-signin {
		color: $primary-dark;
		background: rgba($primary, 0.08);

		&:hover { background: rgba($primary, 0.15); }
	}

	&.btn-getstarted {
		background: $secondary;
		color: #fff;
		box-shadow: 0 4px 16px rgba($secondary, 0.3);

		&:hover { background: $secondary-dark; }
	}
}
</style>
