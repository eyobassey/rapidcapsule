<template>
	<teleport to="body">
		<transition name="modal-fade">
			<div v-if="visible" class="trial-modal-overlay" @click.self="$emit('close')">
				<div class="trial-modal">
					<!-- Close button -->
					<button class="trial-modal__close" @click="$emit('close')">
						<v-icon name="hi-x" scale="1.1" />
					</button>

					<!-- Success state -->
					<div v-if="state === 'success'" class="trial-modal__success">
						<div class="trial-modal__success-icon">
							<v-icon name="hi-check-circle" scale="3" />
						</div>
						<h3>Check Your Email!</h3>
						<p>We've sent a magic link to <strong>{{ form.email }}</strong>. Click the link to start your free trial.</p>
						<p class="trial-modal__success-note">The link expires in 48 hours.</p>
						<button class="trial-modal__btn trial-modal__btn--secondary" @click="$emit('close')">
							Got It
						</button>
					</div>

					<!-- Form state -->
					<div v-else>
						<div class="trial-modal__header">
							<div class="trial-modal__icon-box" :class="featureClass">
								<v-icon :name="featureIcon" scale="1.2" />
							</div>
							<h3 class="trial-modal__title">{{ featureTitle }}</h3>
							<p class="trial-modal__subtitle">Enter your details to receive a free trial link</p>
						</div>

						<form class="trial-modal__form" @submit.prevent="handleSubmit">
							<div class="trial-modal__row">
								<div class="trial-modal__field">
									<label>First Name</label>
									<input
										v-model="form.first_name"
										type="text"
										placeholder="John"
										required
										:disabled="state === 'loading'"
									/>
								</div>
								<div class="trial-modal__field">
									<label>Last Name</label>
									<input
										v-model="form.last_name"
										type="text"
										placeholder="Doe"
										required
										:disabled="state === 'loading'"
									/>
								</div>
							</div>

							<div class="trial-modal__field">
								<label>Email Address</label>
								<input
									v-model="form.email"
									type="email"
									placeholder="john@example.com"
									required
									:disabled="state === 'loading'"
								/>
							</div>

							<p v-if="errorMessage" class="trial-modal__error">
								<v-icon name="hi-exclamation-circle" scale="0.85" />
								{{ errorMessage }}
							</p>

							<button
								type="submit"
								class="trial-modal__btn trial-modal__btn--primary"
								:class="featureClass"
								:disabled="state === 'loading'"
							>
								<span v-if="state === 'loading'" class="trial-modal__spinner"></span>
								<span v-else>Send Me the Link</span>
							</button>

							<p class="trial-modal__privacy">
								<v-icon name="hi-lock-closed" scale="0.7" />
								We respect your privacy. No spam, ever.
							</p>
						</form>
					</div>
				</div>
			</div>
		</transition>
	</teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import apiFactory from '@/services/apiFactory';

const props = defineProps({
	visible: { type: Boolean, default: false },
	selectedFeature: { type: String, default: 'symptom-checker' },
});

const emit = defineEmits(['close', 'success']);

const form = ref({ first_name: '', last_name: '', email: '' });
const state = ref('idle'); // idle | loading | success
const errorMessage = ref('');

const featureIcon = computed(() => {
	if (props.selectedFeature === 'symptom-checker') return 'hi-heart';
	if (props.selectedFeature === 'prescription') return 'hi-document-search';
	return 'ri-capsule-line';
});

const featureTitle = computed(() => {
	if (props.selectedFeature === 'symptom-checker') return 'Try AI Symptom Checker';
	if (props.selectedFeature === 'prescription') return 'Try Prescription Verifier';
	return 'Try RxGPT Verifier';
});

const featureClass = computed(() => {
	if (props.selectedFeature === 'symptom-checker') return 'trial-modal--symptom';
	if (props.selectedFeature === 'prescription') return 'trial-modal--prescription';
	return 'trial-modal--rxgpt';
});

// Reset state when modal opens
watch(() => props.visible, (val) => {
	if (val) {
		state.value = 'idle';
		errorMessage.value = '';
	}
});

async function handleSubmit() {
	if (!form.value.first_name.trim() || !form.value.last_name.trim() || !form.value.email.trim()) {
		errorMessage.value = 'Please fill in all fields.';
		return;
	}

	state.value = 'loading';
	errorMessage.value = '';

	try {
		await apiFactory.$_trialRequest({
			first_name: form.value.first_name.trim(),
			last_name: form.value.last_name.trim(),
			email: form.value.email.trim().toLowerCase(),
		});

		state.value = 'success';
		emit('success');
	} catch (error) {
		state.value = 'idle';
		const msg = error?.response?.data?.message;
		if (msg) {
			errorMessage.value = msg;
		} else {
			errorMessage.value = 'Something went wrong. Please try again.';
		}
	}
}
</script>

<style scoped lang="scss">
$primary: #4fc3f7;
$primary-dark: #0288d1;
$primary-light: #e1f5fe;
$secondary: #FF5C00;
$secondary-dark: #E05000;
$navy: #0f172a;
$slate: #334155;
$gray: #475569;
$emerald: #10b981;

// Modal overlay
.trial-modal-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	backdrop-filter: blur(4px);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	padding: 20px;
}

// Modal
.trial-modal {
	position: relative;
	background: #fff;
	border-radius: 24px;
	padding: 40px;
	width: 100%;
	max-width: 480px;
	box-shadow: 0 24px 64px rgba(0, 0, 0, 0.15);
	animation: modalSlideUp 0.35s ease-out;

	@media (max-width: 540px) {
		padding: 32px 24px;
		border-radius: 20px;
	}
}

.trial-modal__close {
	position: absolute;
	top: 16px;
	right: 16px;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	border: none;
	background: rgba(0, 0, 0, 0.05);
	color: $gray;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;

	&:hover {
		background: rgba(0, 0, 0, 0.1);
		color: $navy;
	}
}

// Header
.trial-modal__header {
	text-align: center;
	margin-bottom: 28px;
}

.trial-modal__icon-box {
	width: 56px;
	height: 56px;
	border-radius: 16px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 16px;

	&.trial-modal--symptom {
		background: $primary-light;
		color: $primary-dark;
	}

	&.trial-modal--rxgpt {
		background: #fff3e0;
		color: $secondary-dark;
	}

	&.trial-modal--prescription {
		background: #ede9fe;
		color: #7c3aed;
	}
}

.trial-modal__title {
	font-size: 24px;
	font-weight: 800;
	color: $navy;
	margin: 0 0 8px;
}

.trial-modal__subtitle {
	font-size: 15px;
	color: $gray;
	margin: 0;
}

// Form
.trial-modal__form {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.trial-modal__row {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;

	@media (max-width: 400px) {
		grid-template-columns: 1fr;
	}
}

.trial-modal__field {
	display: flex;
	flex-direction: column;
	gap: 6px;

	label {
		font-size: 14px;
		font-weight: 600;
		color: $slate;
	}

	input {
		width: 100%;
		padding: 12px 16px;
		border: 2px solid #e2e8f0;
		border-radius: 12px;
		font-size: 15px;
		color: $navy;
		outline: none;
		transition: border-color 0.2s ease;
		background: #f8fafc;
		box-sizing: border-box;

		&::placeholder {
			color: #94a3b8;
		}

		&:focus {
			border-color: $primary;
			background: #fff;
		}

		&:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}
	}
}

// Error
.trial-modal__error {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 14px;
	color: #ef4444;
	margin: 0;
	padding: 10px 14px;
	background: #fef2f2;
	border-radius: 10px;

	.ov-icon {
		flex-shrink: 0;
	}
}

// Button
.trial-modal__btn {
	width: 100%;
	padding: 14px 24px;
	border: none;
	border-radius: 12px;
	font-size: 16px;
	font-weight: 700;
	cursor: pointer;
	transition: all 0.25s ease;
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 50px;

	&--primary {
		color: #fff;

		&.trial-modal--symptom {
			background: $primary-dark;
			box-shadow: 0 4px 16px rgba($primary-dark, 0.3);

			&:hover:not(:disabled) {
				background: darken($primary-dark, 5%);
				transform: translateY(-1px);
			}
		}

		&.trial-modal--rxgpt {
			background: $secondary;
			box-shadow: 0 4px 16px rgba($secondary, 0.3);

			&:hover:not(:disabled) {
				background: $secondary-dark;
				transform: translateY(-1px);
			}
		}

		&.trial-modal--prescription {
			background: #7c3aed;
			box-shadow: 0 4px 16px rgba(#7c3aed, 0.3);

			&:hover:not(:disabled) {
				background: #6d28d9;
				transform: translateY(-1px);
			}
		}

		&:disabled {
			opacity: 0.7;
			cursor: not-allowed;
		}
	}

	&--secondary {
		background: $navy;
		color: #fff;
		box-shadow: 0 4px 12px rgba($navy, 0.2);

		&:hover {
			background: lighten($navy, 5%);
		}
	}
}

// Spinner
.trial-modal__spinner {
	width: 20px;
	height: 20px;
	border: 3px solid rgba(255, 255, 255, 0.3);
	border-top-color: #fff;
	border-radius: 50%;
	animation: spin 0.7s linear infinite;
}

// Privacy note
.trial-modal__privacy {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 5px;
	font-size: 13px;
	color: #94a3b8;
	margin: 4px 0 0;

	.ov-icon {
		color: $emerald;
	}
}

// Success state
.trial-modal__success {
	text-align: center;
	padding: 16px 0;

	h3 {
		font-size: 24px;
		font-weight: 800;
		color: $navy;
		margin: 0 0 12px;
	}

	p {
		font-size: 15px;
		color: $gray;
		line-height: 1.6;
		margin: 0 0 8px;

		strong {
			color: $navy;
		}
	}
}

.trial-modal__success-icon {
	color: $emerald;
	margin-bottom: 16px;
}

.trial-modal__success-note {
	font-size: 13px !important;
	color: #94a3b8 !important;
	margin-bottom: 24px !important;
}

// Transitions
.modal-fade-enter-active,
.modal-fade-leave-active {
	transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
	opacity: 0;
}

@keyframes modalSlideUp {
	from {
		transform: translateY(20px);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

@keyframes spin {
	to { transform: rotate(360deg); }
}
</style>
