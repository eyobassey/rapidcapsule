<template>
	<div class="trial-landing">
		<div class="trial-landing__nav">
			<router-link to="/" class="trial-landing__logo">
				<img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
			</router-link>
		</div>

		<div class="trial-landing__container">
			<!-- Loading -->
			<div v-if="state === 'loading'" class="trial-landing__loading">
				<div class="trial-landing__spinner"></div>
				<p>Verifying your trial access...</p>
			</div>

			<!-- Error -->
			<div v-else-if="state === 'error'" class="trial-landing__error">
				<div class="trial-landing__error-icon">
					<v-icon name="hi-exclamation-circle" scale="3" />
				</div>
				<h2>{{ errorTitle }}</h2>
				<p>{{ errorMessage }}</p>
				<router-link to="/" class="trial-landing__btn trial-landing__btn--primary">
					Back to Homepage
				</router-link>
			</div>

			<!-- Verified -->
			<div v-else-if="state === 'verified'" class="trial-landing__verified">
				<div class="trial-landing__welcome">
					<h1>Welcome, {{ sessionData.first_name }}!</h1>
					<p>Choose a feature to try. You get one free use of each.</p>
				</div>

				<div class="trial-landing__cards">
					<!-- Symptom Checker -->
					<div
						class="feature-card"
						:class="{
							'feature-card--symptom': true,
							'feature-card--used': !sessionData.symptom_checker_available
						}"
					>
						<div class="feature-card__icon feature-card__icon--symptom">
							<v-icon name="hi-heart" scale="1.6" />
						</div>
						<h3>AI Symptom Checker</h3>
						<p>Describe your symptoms and get an intelligent health assessment</p>
						<div v-if="!sessionData.symptom_checker_available" class="feature-card__used">
							<v-icon name="hi-check-circle" scale="0.9" />
							<span>Completed</span>
						</div>
						<router-link
							v-else
							to="/trial/symptom-checker"
							class="feature-card__btn feature-card__btn--symptom"
						>
							Start Symptom Check
							<v-icon name="hi-arrow-right" scale="0.85" />
						</router-link>
					</div>

					<!-- RxGPT -->
					<div
						class="feature-card"
						:class="{
							'feature-card--rxgpt': true,
							'feature-card--used': !sessionData.rxgpt_available
						}"
					>
						<div class="feature-card__icon feature-card__icon--rxgpt">
							<v-icon name="ri-capsule-line" scale="1.6" />
						</div>
						<h3>RxGPT Prescription Verifier</h3>
						<p>Verify a prescription against 6 clinical databases</p>
						<div v-if="!sessionData.rxgpt_available" class="feature-card__used">
							<v-icon name="hi-check-circle" scale="0.9" />
							<span>Completed</span>
						</div>
						<router-link
							v-else
							to="/trial/rxgpt"
							class="feature-card__btn feature-card__btn--rxgpt"
						>
							Start RxGPT Analysis
							<v-icon name="hi-arrow-right" scale="0.85" />
						</router-link>
					</div>
					<!-- Prescription Upload -->
					<div
						class="feature-card"
						:class="{
							'feature-card--prescription': true,
							'feature-card--used': !sessionData.prescription_available
						}"
					>
						<div class="feature-card__icon feature-card__icon--prescription">
							<v-icon name="hi-document-search" scale="1.6" />
						</div>
						<h3>Prescription Verifier</h3>
						<p>Upload a prescription and see our AI verify its authenticity</p>
						<div v-if="!sessionData.prescription_available" class="feature-card__used">
							<v-icon name="hi-check-circle" scale="0.9" />
							<span>Completed</span>
						</div>
						<router-link
							v-else
							to="/trial/prescription"
							class="feature-card__btn feature-card__btn--prescription"
						>
							Upload Prescription
							<v-icon name="hi-arrow-right" scale="0.85" />
						</router-link>
					</div>

					<!-- Eka AI Chat -->
					<div
						class="feature-card"
						:class="{
							'feature-card--eka': true,
							'feature-card--used': !sessionData.eka_available
						}"
					>
						<div class="feature-card__icon feature-card__icon--eka">
							<v-icon name="hi-chat-alt-2" scale="1.6" />
						</div>
						<h3>Eka AI Companion</h3>
						<p>Chat with Eka — search meds, check interactions, and run health checkups</p>
						<div v-if="!sessionData.eka_available" class="feature-card__used">
							<v-icon name="hi-check-circle" scale="0.9" />
							<span>{{ sessionData.eka_messages_used || 0 }}/{{ sessionData.eka_message_limit || 15 }} messages used</span>
						</div>
						<router-link
							v-else
							to="/trial/eka"
							class="feature-card__btn feature-card__btn--eka"
						>
							Chat with Eka
							<v-icon name="hi-arrow-right" scale="0.85" />
						</router-link>
					</div>
				</div>

				<!-- All used CTA -->
				<div v-if="!sessionData.symptom_checker_available && !sessionData.rxgpt_available && !sessionData.prescription_available && !sessionData.eka_available" class="trial-landing__complete">
					<v-icon name="hi-sparkles" scale="1.2" />
					<h3>You've tried all features!</h3>
					<p>Sign up to unlock unlimited access to all our AI-powered healthcare tools.</p>
					<div class="trial-landing__complete-btns">
						<router-link to="/signup/patient" class="trial-landing__btn trial-landing__btn--primary">
							Sign Up as Patient
						</router-link>
						<router-link to="/signup/specialist" class="trial-landing__btn trial-landing__btn--secondary">
							Sign Up as Specialist
						</router-link>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import apiFactory from '@/services/apiFactory';

const route = useRoute();
const state = ref('loading');
const sessionData = ref({});
const errorTitle = ref('Invalid Link');
const errorMessage = ref('');

onMounted(async () => {
	const token = route.params.token;

	if (!token) {
		state.value = 'error';
		errorTitle.value = 'Missing Token';
		errorMessage.value = 'No trial token was provided. Please check your email for the correct link.';
		return;
	}

	try {
		const response = await apiFactory.$_trialVerify(token);
		const data = response.data?.data;

		if (data?.valid) {
			// Store the token for subsequent API calls
			sessionStorage.setItem('trial_token', token);
			sessionData.value = data;
			state.value = 'verified';
		} else {
			state.value = 'error';
			errorMessage.value = 'This trial link is no longer valid.';
		}
	} catch (error) {
		state.value = 'error';
		const msg = error?.response?.data?.message;
		if (msg?.includes('expired')) {
			errorTitle.value = 'Link Expired';
			errorMessage.value = 'This trial link has expired. Please request a new one from our homepage.';
		} else if (msg?.includes('attempts')) {
			errorTitle.value = 'Too Many Attempts';
			errorMessage.value = msg;
		} else {
			errorMessage.value = msg || 'Unable to verify your trial access. Please try again.';
		}
	}
});
</script>

<style scoped lang="scss">
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

.trial-landing {
	min-height: 100vh;
	background: $bg;
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

// Nav
.trial-landing__nav {
	background: #fff;
	padding: 16px 32px;
	box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
}

.trial-landing__logo img {
	height: 32px;
	width: auto;
}

// Container
.trial-landing__container {
	max-width: 1100px;
	margin: 0 auto;
	padding: 60px 24px;

	@media (max-width: 768px) {
		padding: 40px 16px;
	}
}

// Loading
.trial-landing__loading {
	text-align: center;
	padding: 80px 0;

	p {
		font-size: 16px;
		color: $gray;
		margin-top: 20px;
	}
}

.trial-landing__spinner {
	width: 40px;
	height: 40px;
	border: 4px solid #e2e8f0;
	border-top-color: $primary-dark;
	border-radius: 50%;
	margin: 0 auto;
	animation: spin 0.8s linear infinite;
}

// Error
.trial-landing__error {
	text-align: center;
	padding: 60px 0;

	h2 {
		font-size: 28px;
		font-weight: 800;
		color: $navy;
		margin: 0 0 12px;
	}

	p {
		font-size: 16px;
		color: $gray;
		line-height: 1.6;
		margin: 0 0 32px;
		max-width: 400px;
		margin-left: auto;
		margin-right: auto;
	}
}

.trial-landing__error-icon {
	color: #ef4444;
	margin-bottom: 20px;
}

// Verified
.trial-landing__welcome {
	text-align: center;
	margin-bottom: 48px;

	h1 {
		font-size: 36px;
		font-weight: 800;
		color: $navy;
		margin: 0 0 12px;

		@media (max-width: 768px) {
			font-size: 28px;
		}
	}

	p {
		font-size: 18px;
		color: $gray;
		margin: 0;

		@media (max-width: 768px) {
			font-size: 16px;
		}
	}
}

// Feature cards
.trial-landing__cards {
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 24px;
	margin-bottom: 40px;

	@media (max-width: 1100px) {
		grid-template-columns: 1fr 1fr;
	}

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
}

.feature-card {
	background: #fff;
	border-radius: 20px;
	padding: 32px 28px;
	text-align: center;
	border: 2px solid transparent;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
	transition: all 0.25s ease;

	&--symptom { border-color: $primary; }
	&--rxgpt { border-color: $secondary; }
	&--prescription { border-color: #7c3aed; }
	&--eka { border-color: $emerald; }

	&--used {
		opacity: 0.65;
		border-color: #e2e8f0;
	}

	&:not(.feature-card--used):hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 36px rgba(0, 0, 0, 0.1);
	}

	h3 {
		font-size: 22px;
		font-weight: 700;
		color: $navy;
		margin: 0 0 8px;
	}

	p {
		font-size: 15px;
		color: $gray;
		line-height: 1.5;
		margin: 0 0 24px;
	}
}

.feature-card__icon {
	width: 64px;
	height: 64px;
	border-radius: 18px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 18px;

	&--symptom {
		background: $primary-light;
		color: $primary-dark;
	}

	&--rxgpt {
		background: #fff3e0;
		color: $secondary-dark;
	}

	&--prescription {
		background: #ede9fe;
		color: #7c3aed;
	}

	&--eka {
		background: #d1fae5;
		color: #047857;
	}
}

.feature-card__btn {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 12px 28px;
	border-radius: 50px;
	font-size: 15px;
	font-weight: 700;
	text-decoration: none;
	color: #fff;
	transition: all 0.25s ease;

	&--symptom {
		background: $primary-dark;
		box-shadow: 0 4px 12px rgba($primary-dark, 0.3);

		&:hover {
			background: darken($primary-dark, 5%);
			transform: translateY(-2px);
		}
	}

	&--rxgpt {
		background: $secondary;
		box-shadow: 0 4px 12px rgba($secondary, 0.3);

		&:hover {
			background: $secondary-dark;
			transform: translateY(-2px);
		}
	}

	&--prescription {
		background: #7c3aed;
		box-shadow: 0 4px 12px rgba(#7c3aed, 0.3);

		&:hover {
			background: #6d28d9;
			transform: translateY(-2px);
		}
	}

	&--eka {
		background: $emerald;
		box-shadow: 0 4px 12px rgba($emerald, 0.3);

		&:hover {
			background: darken($emerald, 5%);
			transform: translateY(-2px);
		}
	}
}

.feature-card__used {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	color: $emerald;
	font-size: 15px;
	font-weight: 600;
}

// Complete state
.trial-landing__complete {
	text-align: center;
	background: #fff;
	border-radius: 20px;
	padding: 40px 32px;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

	.ov-icon {
		color: $secondary;
	}

	h3 {
		font-size: 24px;
		font-weight: 800;
		color: $navy;
		margin: 12px 0 8px;
	}

	p {
		font-size: 16px;
		color: $gray;
		margin: 0 0 28px;
	}
}

.trial-landing__complete-btns {
	display: flex;
	gap: 12px;
	justify-content: center;
	flex-wrap: wrap;
}

// Buttons
.trial-landing__btn {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 14px 32px;
	border-radius: 50px;
	font-size: 16px;
	font-weight: 700;
	text-decoration: none;
	transition: all 0.25s ease;

	&--primary {
		background: $secondary;
		color: #fff;
		box-shadow: 0 4px 16px rgba($secondary, 0.3);

		&:hover {
			background: $secondary-dark;
			transform: translateY(-2px);
		}
	}

	&--secondary {
		background: $navy;
		color: #fff;
		box-shadow: 0 4px 12px rgba($navy, 0.2);

		&:hover {
			background: lighten($navy, 5%);
			transform: translateY(-2px);
		}
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}
</style>
