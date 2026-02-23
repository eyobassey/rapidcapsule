<template>
	<div v-if="names.length > 0" class="typing-indicator">
		<span class="typing-text">{{ typingText }}</span>
		<span class="typing-dots">
			<span class="dot"></span>
			<span class="dot"></span>
			<span class="dot"></span>
		</span>
	</div>
</template>

<script>
export default {
	props: {
		names: { type: Array, default: () => [] },
	},
	computed: {
		typingText() {
			if (this.names.length === 1) return `${this.names[0]} is typing`;
			if (this.names.length === 2) return `${this.names[0]} and ${this.names[1]} are typing`;
			return "Several people are typing";
		},
	},
};
</script>

<style scoped lang="scss">
.typing-indicator {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 4px 16px;
	font-size: 12px;
	color: #94a3b8;
}

.typing-dots {
	display: flex;
	gap: 3px;
}

.dot {
	width: 4px;
	height: 4px;
	border-radius: 50%;
	background: #94a3b8;
	animation: typingBounce 1.4s infinite ease-in-out;
}

.dot:nth-child(2) {
	animation-delay: 0.2s;
}

.dot:nth-child(3) {
	animation-delay: 0.4s;
}

@keyframes typingBounce {
	0%, 80%, 100% {
		transform: scale(0);
		opacity: 0.5;
	}
	40% {
		transform: scale(1);
		opacity: 1;
	}
}
</style>
