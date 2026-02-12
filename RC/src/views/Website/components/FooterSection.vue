<template>
	<footer class="footer">
		<div class="footer__container">
			<div class="footer__top">
				<!-- Brand Column -->
				<div class="footer__brand">
					<router-link to="/" class="footer__logo-link">
						<img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" class="footer__logo-img" />
					</router-link>
					<p class="footer__tagline">
						AI-powered telemedicine platform connecting patients to quality healthcare. Anytime, anywhere.
					</p>
					<div class="footer__socials">
						<a href="#" class="social-icon" aria-label="Facebook"><span>F</span></a>
						<a href="#" class="social-icon" aria-label="X (Twitter)"><span>X</span></a>
						<a href="#" class="social-icon" aria-label="Instagram"><span>I</span></a>
						<a href="#" class="social-icon" aria-label="LinkedIn"><span>L</span></a>
					</div>
				</div>

				<!-- Quick Links -->
				<div class="footer__col">
					<h3 class="footer__col-title">Quick Links</h3>
					<ul class="footer__links">
						<li><a href="#">About Us</a></li>
						<li><a href="#features">Features</a></li>
						<li><a href="#pricing">Pricing</a></li>
						<li><a href="#contact">Contact</a></li>
						<li><a href="#faq">FAQ</a></li>
					</ul>
				</div>

				<!-- Legal -->
				<div class="footer__col">
					<h3 class="footer__col-title">Legal</h3>
					<ul class="footer__links">
						<li><router-link to="/privacy-policy">Privacy Policy</router-link></li>
						<li><router-link to="/terms-of-service">Terms of Service</router-link></li>
						<li><a href="#">Cookie Policy</a></li>
						<li><a href="#">Disclaimer</a></li>
					</ul>
				</div>

				<!-- Contact -->
				<div class="footer__col">
					<h3 class="footer__col-title">Contact</h3>
					<ul class="footer__contact">
						<li>
							<v-icon name="hi-mail" scale="0.9" />
							<a href="mailto:support@rapidcapsule.com">support@rapidcapsule.com</a>
						</li>
					</ul>
				</div>
			</div>

			<!-- Bottom Bar -->
			<div class="footer__bottom">
				<p class="footer__copyright">&copy; 2026 Rapid Capsule. All rights reserved.</p>
				<div class="footer__accent-line"></div>
			</div>
		</div>
	</footer>
</template>

<script setup>
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
$gray: #475569;
$emerald: #10b981;
$bg: #f8fafc;

.footer {
	background: $navy;
	padding: 64px 0 0;
}

.footer__container {
	max-width: 1600px;
	margin: 0 auto;
	padding: 0 40px;

	@media (max-width: 768px) {
		padding: 0 20px;
	}
}

// Top grid
.footer__top {
	display: grid;
	grid-template-columns: 2fr 1fr 1fr 1fr;
	gap: 48px;
	padding-bottom: 48px;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
		gap: 36px;
	}

	@media (min-width: 540px) and (max-width: 900px) {
		grid-template-columns: 1fr 1fr;

		.footer__brand {
			grid-column: 1 / -1;
		}
	}
}

// Brand column
.footer__brand {
	max-width: 360px;

	@media (max-width: 900px) {
		max-width: 100%;
	}
}

.footer__logo-link {
	display: inline-block;
	margin-bottom: 16px;
}

.footer__logo-img {
	height: 36px;
	width: auto;
	filter: brightness(0) invert(1);

	@media (max-width: 768px) {
		height: 30px;
	}
}

.footer__tagline {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.6);
	line-height: 1.7;
	margin: 0 0 20px;
}

// Social icons
.footer__socials {
	display: flex;
	gap: 10px;
}

.social-icon {
	width: 36px;
	height: 36px;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.08);
	border: 1px solid rgba(255, 255, 255, 0.12);
	display: flex;
	align-items: center;
	justify-content: center;
	text-decoration: none;
	transition: all 0.25s ease;

	span {
		font-size: 13px;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.7);
		line-height: 1;
	}

	&:hover {
		background: $primary;
		border-color: $primary;

		span {
			color: #fff;
		}
	}
}

// Link columns
.footer__col-title {
	font-size: 15px;
	font-weight: 700;
	color: #fff;
	margin: 0 0 20px;
	letter-spacing: 0.3px;
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
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		transition: color 0.2s ease;

		&:hover {
			color: $primary;
		}
	}
}

// Contact list
.footer__contact {
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: 14px;

	li {
		display: flex;
		align-items: center;
		gap: 10px;
		color: rgba(255, 255, 255, 0.65);
	}

	a,
	span {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.7);
		text-decoration: none;
		transition: color 0.2s ease;
	}

	a:hover {
		color: $primary;
	}
}

// Bottom bar
.footer__bottom {
	border-top: 1px solid rgba(255, 255, 255, 0.08);
	padding: 24px 0;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
}

.footer__copyright {
	font-size: 13px;
	color: rgba(255, 255, 255, 0.65);
	margin: 0;
}

.footer__accent-line {
	width: 120px;
	height: 3px;
	border-radius: 3px;
	background: linear-gradient(90deg, $primary, $secondary);
}
</style>
