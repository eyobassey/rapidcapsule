<template>
	<div class="eka-onboard">
		<!-- Header -->
		<div class="eka-onboard__header">
			<router-link to="/" class="eka-onboard__logo">
				<img src="/eka-rc-logo-icon.png" alt="Eka" class="eka-onboard__logo-img" />
				<span class="eka-onboard__logo-text">Eka AI</span>
			</router-link>
			<router-link to="/" class="eka-onboard__back">
				<v-icon name="hi-arrow-left" scale="0.8" />
				<span>Back to Home</span>
			</router-link>
		</div>

		<!-- Messages -->
		<div class="eka-onboard__messages" ref="messagesContainer">
			<div class="eka-onboard__chat-col">
				<div
					v-for="(msg, idx) in messages"
					:key="idx"
					class="eka-onboard__msg"
					:class="'eka-onboard__msg--' + msg.role"
				>
					<div v-if="msg.role === 'assistant'" class="eka-onboard__avatar">
						<img src="/eka-rc-logo-icon.png" alt="Eka" />
					</div>
					<div class="eka-onboard__body" :class="'eka-onboard__body--' + msg.role">
						<div class="eka-onboard__bubble" :class="'eka-onboard__bubble--' + msg.role">
							<span v-html="msg.content"></span>
						</div>
					</div>
				</div>

				<!-- T&C consent widget -->
				<div v-if="phase === 'WAITING_CONSENT'" class="eka-onboard__msg eka-onboard__msg--assistant">
					<div class="eka-onboard__avatar">
						<img src="/eka-rc-logo-icon.png" alt="Eka" />
					</div>
					<div class="eka-onboard__body eka-onboard__body--assistant">
						<div class="eka-onboard__consent">
							<p class="eka-onboard__consent-text">
								By continuing, you agree to our
								<a href="/terms-of-service" target="_blank">Terms of Service</a>
								and
								<a href="/privacy-policy" target="_blank">Privacy Policy</a>.
							</p>
							<button class="eka-onboard__consent-btn" @click="acceptConsent">
								<v-icon name="hi-check" scale="0.8" />
								<span>I Agree — Send My Code</span>
							</button>
						</div>
					</div>
				</div>

				<!-- Typing indicator -->
				<div v-if="isTyping" class="eka-onboard__msg eka-onboard__msg--assistant">
					<div class="eka-onboard__avatar">
						<img src="/eka-rc-logo-icon.png" alt="Eka" />
					</div>
					<div class="eka-onboard__body eka-onboard__body--assistant">
						<div class="eka-onboard__bubble eka-onboard__bubble--assistant">
							<div class="eka-onboard__typing">
								<span></span><span></span><span></span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Input -->
		<div class="eka-onboard__input-area">
			<div class="eka-onboard__input-wrap">
				<div class="eka-onboard__input-box">
					<input
						ref="inputRef"
						v-model="inputText"
						type="text"
						:placeholder="inputPlaceholder"
						:disabled="isTyping || phase === 'VERIFIED' || phase === 'WAITING_CONSENT'"
						@keydown.enter="handleSend"
					/>
					<button
						class="eka-onboard__send"
						:disabled="!inputText.trim() || isTyping || phase === 'VERIFIED' || phase === 'WAITING_CONSENT'"
						@click="handleSend"
					>
						<v-icon name="hi-paper-airplane" scale="0.9" />
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import http from '@/services/http';

const router = useRouter();

const messages = ref([]);
const inputText = ref('');
const isTyping = ref(false);
const messagesContainer = ref(null);
const inputRef = ref(null);

// State machine
const phase = ref('GREETING');
// GREETING → WAITING_FIRST_NAME → WAITING_LAST_NAME → WAITING_EMAIL
// → WAITING_CONSENT → REQUESTING_TRIAL → AWAITING_OTP → VERIFYING_OTP → VERIFIED

const userData = ref({
	first_name: '',
	last_name: '',
	email: '',
});

const inputPlaceholder = computed(() => {
	switch (phase.value) {
		case 'WAITING_FIRST_NAME': return 'Enter your first name...';
		case 'WAITING_LAST_NAME': return 'Enter your last name...';
		case 'WAITING_EMAIL': return 'Enter your email address...';
		case 'WAITING_CONSENT': return 'Please accept the terms above...';
		case 'AWAITING_OTP': return 'Enter the 6-digit code...';
		case 'VERIFIED': return 'Redirecting...';
		default: return 'Type here...';
	}
});

function scrollToBottom() {
	nextTick(() => {
		if (messagesContainer.value) {
			messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
		}
	});
}

function focusInput() {
	nextTick(() => { if (inputRef.value) inputRef.value.focus(); });
}

function addAssistant(text) {
	messages.value.push({ role: 'assistant', content: text });
	scrollToBottom();
	focusInput();
}

function addUser(text) {
	messages.value.push({ role: 'user', content: text });
	scrollToBottom();
}

async function typeAssistant(text, delay = 600) {
	isTyping.value = true;
	scrollToBottom();
	await new Promise((r) => setTimeout(r, delay));
	isTyping.value = false;
	addAssistant(text);
}

onMounted(async () => {
	// Check for existing trial token
	const existingToken = sessionStorage.getItem('trial_token');
	if (existingToken) {
		router.push('/trial/eka');
		return;
	}

	// Start the conversation
	await typeAssistant(
		"Hi there! I'm <strong>Eka</strong>, your AI health companion at Rapid Capsule. I can search medications, check drug interactions, run health checkups, and much more.",
		800,
	);
	await typeAssistant(
		"To get you started with a free trial, I just need a few details. What's your <strong>first name</strong>?",
		1000,
	);
	phase.value = 'WAITING_FIRST_NAME';
	nextTick(() => { if (inputRef.value) inputRef.value.focus(); });
});

function handleSend() {
	const text = inputText.value.trim();
	if (!text || isTyping.value || phase.value === 'VERIFIED' || phase.value === 'WAITING_CONSENT') return;
	inputText.value = '';
	processInput(text);
}

async function processInput(text) {
	addUser(text);

	switch (phase.value) {
		case 'WAITING_FIRST_NAME':
			await handleFirstName(text);
			break;
		case 'WAITING_LAST_NAME':
			await handleLastName(text);
			break;
		case 'WAITING_EMAIL':
			await handleEmail(text);
			break;
		case 'AWAITING_OTP':
			await handleOtp(text);
			break;
		default:
			break;
	}
}

async function handleFirstName(text) {
	const name = text.replace(/[^a-zA-Z\s'-]/g, '').trim();
	if (!name || name.length < 1) {
		await typeAssistant("Hmm, I didn't catch that. Could you type your first name?");
		return;
	}
	userData.value.first_name = name;
	await typeAssistant(`Nice to meet you, <strong>${name}</strong>! And what's your <strong>last name</strong>?`);
	phase.value = 'WAITING_LAST_NAME';
}

async function handleLastName(text) {
	const name = text.replace(/[^a-zA-Z\s'-]/g, '').trim();
	if (!name || name.length < 1) {
		await typeAssistant("I didn't catch that. Could you type your last name?");
		return;
	}
	userData.value.last_name = name;
	await typeAssistant(
		`Great, <strong>${userData.value.first_name} ${name}</strong>! Now I need your <strong>email address</strong> so I can send you a quick verification code.`,
	);
	phase.value = 'WAITING_EMAIL';
}

async function handleEmail(text) {
	const email = text.trim().toLowerCase();
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	if (!emailRegex.test(email)) {
		await typeAssistant("That doesn't look like a valid email. Could you try again? For example: <strong>john@example.com</strong>");
		return;
	}

	userData.value.email = email;

	// Show T&C consent before proceeding
	await typeAssistant(
		`Thanks! Before I send you the verification code, please review and accept our terms below.`,
		600,
	);
	phase.value = 'WAITING_CONSENT';
	scrollToBottom();
}

async function acceptConsent() {
	// User accepted T&C — proceed with OTP request
	addUser('I agree to the Terms of Service and Privacy Policy.');
	phase.value = 'REQUESTING_TRIAL';

	isTyping.value = true;
	scrollToBottom();

	try {
		await http.post('/trial/request-with-otp', {
			first_name: userData.value.first_name,
			last_name: userData.value.last_name,
			email: userData.value.email,
		});

		isTyping.value = false;
		addAssistant(
			`I've sent a <strong>6-digit code</strong> to <strong>${userData.value.email}</strong>. Enter it here to verify your email and start your trial!<br><br>Didn't get it? Type <strong>"resend"</strong> and I'll send a new one.`,
		);
		phase.value = 'AWAITING_OTP';
	} catch (error) {
		isTyping.value = false;
		const status = error?.response?.status;
		const msg = error?.response?.data?.message || '';

		if (status === 400 && msg.toLowerCase().includes('disposable')) {
			addAssistant(
				"That email provider isn't supported — it looks like a temporary or disposable address. Could you use a <strong>personal or work email</strong> instead?",
			);
			phase.value = 'WAITING_EMAIL';
		} else if (status === 409 && msg.includes('already been used')) {
			addAssistant(
				`It looks like <strong>${userData.value.email}</strong> has already enjoyed a free trial. The great news? Signing up for Rapid Capsule is <strong>completely free</strong> — you'll get unlimited access to me, plus vitals tracking, prescriptions, appointments, and so much more!<br><br>Head over to <a href="https://rapidcapsule.com/onboarding" style="color: #0ea5e9; text-decoration: underline;">rapidcapsule.com/onboarding</a> to create your account.`,
			);
		} else if (status === 409) {
			addAssistant(
				`It looks like you already have an active trial! Check your inbox for a verification code. If you have the code, enter it here. Or type <strong>"resend"</strong> for a new one.`,
			);
			phase.value = 'AWAITING_OTP';
		} else if (status === 403) {
			addAssistant(
				"It looks like several trial requests have come from your network today. For security, please try again tomorrow. We appreciate your patience!",
			);
		} else {
			addAssistant(
				"Something went wrong on my end. Could you try entering your email again?",
			);
			phase.value = 'WAITING_EMAIL';
		}
	}
}

async function handleOtp(text) {
	const lower = text.trim().toLowerCase();

	// Handle "resend" keyword
	if (lower === 'resend' || lower.includes('resend')) {
		await resendOtp();
		return;
	}

	// Extract digits
	const digits = text.replace(/\D/g, '');

	if (digits.length !== 6) {
		await typeAssistant("Please enter the <strong>6-digit code</strong> from your email. It should look something like <strong>482901</strong>.");
		return;
	}

	phase.value = 'VERIFYING_OTP';
	isTyping.value = true;
	scrollToBottom();

	try {
		const res = await http.post('/trial/verify-otp', {
			email: userData.value.email,
			otp_code: digits,
		});

		isTyping.value = false;
		const data = res.data?.data || res.data;

		// Store the trial token
		sessionStorage.setItem('trial_token', data.trial_token);

		phase.value = 'VERIFIED';
		addAssistant(
			`You're verified, <strong>${data.first_name || userData.value.first_name}</strong>! Welcome to Rapid Capsule. Let me take you to your trial — you have <strong>${data.eka_message_limit || 15} free messages</strong> with me, plus access to our Symptom Checker, RxGPT, and Prescription Verifier. Let's go!`,
		);

		// Redirect after a brief moment
		setTimeout(() => {
			router.push('/trial/eka');
		}, 2500);
	} catch (error) {
		isTyping.value = false;
		const status = error?.response?.status;
		const msg = error?.response?.data?.message || '';

		if (status === 400 && msg.includes("doesn't match")) {
			addAssistant(msg + ' Try again, or type <strong>"resend"</strong> for a new code.');
			phase.value = 'AWAITING_OTP';
		} else if (status === 400 && msg.toLowerCase().includes('expired')) {
			addAssistant('Your code has expired. Type <strong>"resend"</strong> and I\'ll send you a fresh one.');
			phase.value = 'AWAITING_OTP';
		} else if (status === 403) {
			addAssistant('Too many incorrect attempts. Type <strong>"resend"</strong> to get a fresh code.');
			phase.value = 'AWAITING_OTP';
		} else if (status === 400 && msg.toLowerCase().includes('start over')) {
			addAssistant("It seems your trial session has expired. Let's start fresh — what's your <strong>email address</strong>?");
			phase.value = 'WAITING_EMAIL';
		} else {
			addAssistant('Something went wrong verifying that code. Please try again.');
			phase.value = 'AWAITING_OTP';
		}
	}
}

async function resendOtp() {
	isTyping.value = true;
	scrollToBottom();

	try {
		await http.post('/trial/resend-otp', {
			email: userData.value.email,
		});

		isTyping.value = false;
		addAssistant(
			`Done! I've sent a <strong>new code</strong> to <strong>${userData.value.email}</strong>. Enter it here when you're ready.`,
		);
	} catch (error) {
		isTyping.value = false;
		const msg = error?.response?.data?.message || '';
		if (msg.toLowerCase().includes('start over')) {
			addAssistant("Your trial session has expired. Let's start fresh — what's your <strong>email address</strong>?");
			phase.value = 'WAITING_EMAIL';
		} else {
			addAssistant("I couldn't resend the code right now. Please try again in a moment.");
		}
	}
}
</script>

<style scoped lang="scss">
$navy: #0f172a;
$dark-bg: #0f172a;
$surface: rgba(15, 23, 42, 0.6);
$border: rgba(255, 255, 255, 0.1);
$text-primary: #f8fafc;
$text-secondary: #94a3b8;
$orange: #FF5C00;
$cyan: #0ea5e9;

// ── Root container ──────────────────────────────────────────
.eka-onboard {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: $dark-bg;
	font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
	color: $text-primary;

	// Override App.vue's * { color: $color-black } globally within this page
	* {
		color: $text-primary;
	}
}

// ── Header ──────────────────────────────────────────────────
.eka-onboard__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 24px;
	background: rgba(15, 23, 42, 0.8);
	backdrop-filter: blur(16px);
	border-bottom: 1px solid $border;
	flex-shrink: 0;
	z-index: 10;
}

.eka-onboard__logo {
	display: flex;
	align-items: center;
	gap: 10px;
	text-decoration: none;
}

.eka-onboard__logo-text {
	font-size: 16px;
	font-weight: 700;
	color: $text-primary;
}

.eka-onboard__logo-img {
	width: 32px;
	height: 32px;
	border-radius: 8px;
	object-fit: contain;
}

.eka-onboard__back {
	display: flex;
	align-items: center;
	gap: 6px;
	color: $text-secondary;
	font-size: 14px;
	font-weight: 500;
	text-decoration: none;
	padding: 6px 14px;
	border-radius: 8px;
	border: 1px solid rgba(255, 255, 255, 0.1);
	background: rgba(255, 255, 255, 0.05);
	transition: all 0.2s;

	span {
		color: $text-secondary;
	}

	.ov-icon {
		color: $text-secondary;
		fill: $text-secondary;
	}

	&:hover {
		color: $text-primary;
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);

		span { color: $text-primary; }

		.ov-icon {
			color: $text-primary;
			fill: $text-primary;
		}
	}
}

// ── Messages area ───────────────────────────────────────────
.eka-onboard__messages {
	flex: 1;
	overflow-y: auto;
	padding: 0;
	scroll-behavior: smooth;
}

// Centered column — matches main Eka chat (768px)
.eka-onboard__chat-col {
	max-width: 768px;
	margin: 0 auto;
	padding: 24px 16px;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

// ── Message row ─────────────────────────────────────────────
.eka-onboard__msg {
	display: flex;
	gap: 8px;

	&--assistant {
		justify-content: flex-start;
	}

	&--user {
		justify-content: flex-end;
	}
}

// ── Message body (wraps bubble, constrains width) ───────────
.eka-onboard__body {
	max-width: 80%;

	&--user {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
}

// ── Avatar ──────────────────────────────────────────────────
.eka-onboard__avatar {
	width: 28px;
	height: 28px;
	border-radius: 8px;
	overflow: hidden;
	flex-shrink: 0;
	background: rgba(14, 165, 233, 0.15);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: 2px;

	img {
		width: 20px;
		height: 20px;
		object-fit: contain;
	}
}

// ── Bubble ──────────────────────────────────────────────────
.eka-onboard__bubble {
	padding: 0.875rem 1.25rem;
	border-radius: 1rem;
	font-size: 0.9375rem;
	line-height: 1.6;
	word-wrap: break-word;

	&--assistant {
		background: $surface;
		backdrop-filter: blur(16px);
		border: 1px solid $border;
		color: $text-primary;
		border-top-left-radius: 0.25rem;

		span {
			color: $text-primary;
		}

		:deep(strong) {
			color: $cyan;
			font-weight: 600;
		}

		:deep(br) {
			display: block;
			content: '';
		}
	}

	&--user {
		background: $text-primary;
		color: $navy;
		border-top-right-radius: 0.25rem;

		span {
			color: $navy;
		}
	}
}

// ── T&C Consent widget ──────────────────────────────────────
.eka-onboard__consent {
	background: $surface;
	backdrop-filter: blur(16px);
	border: 1px solid $border;
	border-radius: 1rem;
	border-top-left-radius: 0.25rem;
	padding: 1rem 1.25rem;
}

.eka-onboard__consent-text {
	font-size: 0.875rem;
	line-height: 1.6;
	color: $text-secondary;
	margin: 0 0 12px;

	a {
		color: $cyan;
		text-decoration: underline;
		text-underline-offset: 2px;
		font-weight: 500;

		&:hover {
			color: lighten($cyan, 10%);
		}
	}
}

.eka-onboard__consent-btn {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 20px;
	border: none;
	border-radius: 10px;
	background: $orange;
	color: #fff;
	font-size: 14px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	span {
		color: #fff;
	}

	.ov-icon {
		color: #fff;
		fill: #fff;
	}

	&:hover {
		background: darken($orange, 5%);
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba($orange, 0.3);
	}
}

// ── Typing indicator ────────────────────────────────────────
.eka-onboard__typing {
	display: flex;
	gap: 4px;
	padding: 4px 0;

	span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: $text-secondary;
		animation: typingDot 1.4s infinite;

		&:nth-child(2) { animation-delay: 0.2s; }
		&:nth-child(3) { animation-delay: 0.4s; }
	}
}

// ── Input area ──────────────────────────────────────────────
.eka-onboard__input-area {
	padding: 12px 16px 16px;
	border-top: 1px solid $border;
	flex-shrink: 0;
}

.eka-onboard__input-wrap {
	max-width: 768px;
	margin: 0 auto;
	width: 100%;
}

.eka-onboard__input-box {
	display: flex;
	align-items: center;
	gap: 8px;
	background: rgba(15, 23, 42, 0.8);
	border: 1px solid rgba(255, 255, 255, 0.1);
	border-radius: 24px;
	padding: 4px 4px 4px 20px;
	transition: border-color 0.2s, box-shadow 0.2s;
	box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);

	&:focus-within {
		border-color: $orange;
		box-shadow: 0 0 0 3px rgba($orange, 0.1);
	}

	input {
		flex: 1;
		border: none;
		outline: none;
		font-size: 15px;
		padding: 10px 0;
		color: $text-primary;
		background: transparent;

		&::placeholder {
			color: rgba(148, 163, 184, 0.5);
		}

		&:disabled {
			opacity: 0.5;
		}
	}
}

.eka-onboard__send {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 50%;
	border: none;
	background: $orange;
	color: #fff;
	cursor: pointer;
	transition: all 0.15s;
	flex-shrink: 0;

	.ov-icon {
		color: #fff;
		fill: #fff;
	}

	&:hover:not(:disabled) {
		background: darken($orange, 5%);
		transform: scale(1.05);
	}

	&:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
}

// ── Animations ──────────────────────────────────────────────
@keyframes fadeUp {
	from {
		transform: translateY(8px);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

@keyframes typingDot {
	0%, 60%, 100% {
		opacity: 0.3;
		transform: scale(0.8);
	}
	30% {
		opacity: 1;
		transform: scale(1);
	}
}

// ── Message entrance animation ──────────────────────────────
.eka-onboard__msg {
	animation: fadeUp 0.3s ease-out;
}

.eka-onboard__consent {
	animation: fadeUp 0.3s ease-out;
}

// ── Mobile ──────────────────────────────────────────────────
@media (max-width: 640px) {
	.eka-onboard__header {
		padding: 12px 16px;
	}

	.eka-onboard__chat-col {
		padding: 16px 12px;
	}

	.eka-onboard__body {
		max-width: 90%;
	}

	.eka-onboard__bubble {
		font-size: 14px;
	}

	.eka-onboard__back span {
		display: none;
	}
}
</style>
