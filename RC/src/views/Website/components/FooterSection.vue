<template>
	<footer class="footer">
		<div class="footer__container">
			<div class="footer__grid">
				<!-- Brand column -->
				<div class="footer__brand">
					<router-link to="/" class="footer__logo-link">
						<img
							src="/RapidCapsule_Logo.png"
							alt="Rapid Capsule"
							class="footer__logo"
						/>
					</router-link>
					<p class="footer__desc">
						AI-powered telemedicine platform connecting patients with verified specialists.
						Anytime, anywhere.
					</p>
				</div>

				<!-- Platform -->
				<div class="footer__col">
					<h4 class="footer__col-title">Platform</h4>
					<ul class="footer__links">
						<li><router-link to="/signup/patient">For Patients</router-link></li>
						<li><router-link to="/signup/specialist">For Specialists</router-link></li>
						<li><a href="#pricing" @click.prevent="scrollTo('#pricing')">Pricing</a></li>
						<li><a href="#how-it-works" @click.prevent="scrollTo('#how-it-works')">How It Works</a></li>
						<li><a href="#">Download App</a></li>
					</ul>
				</div>

				<!-- AI Features -->
				<div class="footer__col">
					<h4 class="footer__col-title">AI Features</h4>
					<ul class="footer__links">
						<li><a href="#eka" @click.prevent="scrollTo('#eka')">Eka Health Assistant</a></li>
						<li><a href="#rxgpt" @click.prevent="scrollTo('#rxgpt')">RxGPT Verification</a></li>
						<li><a href="#features" @click.prevent="scrollTo('#features')">Symptom Checker</a></li>
						<li><a href="#features" @click.prevent="scrollTo('#features')">Drug Interactions</a></li>
						<li><a href="#prescription" @click.prevent="scrollTo('#prescription')">Prescription Upload</a></li>
					</ul>
				</div>

				<!-- Company -->
				<div class="footer__col">
					<h4 class="footer__col-title">Company</h4>
					<ul class="footer__links">
						<li><a href="#">About Us</a></li>
						<li><a href="#">Careers</a></li>
						<li><router-link to="/privacy-policy">Privacy Policy</router-link></li>
						<li><router-link to="/terms-of-service">Terms of Service</router-link></li>
						<li><a href="mailto:support@rapidcapsule.com">Contact</a></li>
					</ul>
				</div>
			</div>

			<!-- Bottom bar -->
			<div class="footer__bottom">
				<p class="footer__copyright">&copy; 2026 Rapid Capsule. All rights reserved.</p>
				<p class="footer__badges">HIPAA-Aware &middot; Encrypted &middot; Verified Specialists</p>
			</div>
		</div>
	</footer>
</template>

<script setup>
function scrollTo(href) {
	const el = document.querySelector(href);
	if (el) el.scrollIntoView({ behavior: 'smooth' });
}
</script>

<style scoped lang="scss">
@import '../_homepage-tokens';

// ── Footer ───────────────────────────────────────────────────
.footer {
	background: $navy;
	color: $navy-fg;
	padding-top: 64px;
	padding-bottom: 32px;
}

// ── Container ────────────────────────────────────────────────
.footer__container {
	max-width: $max-width;
	margin: 0 auto;
	padding: 0 $container-px;

	@media (max-width: $bp-sm) {
		padding: 0 $container-px-sm;
	}

	@media (max-width: $bp-xs) {
		padding: 0 $container-px-xs;
	}
}

// ── Grid ─────────────────────────────────────────────────────
.footer__grid {
	display: grid;
	grid-template-columns: 1.6fr 1fr 1fr 1fr;
	gap: 40px;
	margin-bottom: 48px;

	@media (max-width: $bp-lg) {
		grid-template-columns: 1fr 1fr;
	}

	@media (max-width: $bp-sm) {
		grid-template-columns: 1fr;
		gap: 32px;
	}
}

// ── Brand column ─────────────────────────────────────────────
.footer__brand {
	max-width: 340px;

	@media (max-width: $bp-lg) {
		max-width: 100%;
		grid-column: 1 / -1;
	}
}

.footer__logo-link {
	display: inline-block;
	margin-bottom: 16px;
}

.footer__logo {
	height: 34px;
	width: auto;
	filter: brightness(0) invert(1);
}

.footer__desc {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.5);
	line-height: 1.75;
	margin: 0;
}

// ── Link columns ─────────────────────────────────────────────
.footer__col-title {
	font-size: 14px;
	font-weight: 700;
	color: rgba(255, 255, 255, 0.9);
	margin: 0 0 16px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.footer__links {
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 12px;

	a {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.5);
		text-decoration: none;
		transition: color 0.2s ease;

		&:hover {
			color: rgba(255, 255, 255, 0.8);
		}
	}
}

// ── Bottom bar ───────────────────────────────────────────────
.footer__bottom {
	border-top: 1px solid rgba(255, 255, 255, 0.1);
	padding-top: 32px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: 12px;

	@media (max-width: $bp-sm) {
		flex-direction: column;
		text-align: center;
	}
}

.footer__copyright {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.4);
	margin: 0;
}

.footer__badges {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.4);
	margin: 0;
}
</style>
