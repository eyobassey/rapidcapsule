<template>
	<div class="empty-state">
		<div class="empty-icon">
			<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
			</svg>
		</div>
		<h3>No conversation selected</h3>
		<p>Select a conversation from the list or start a new one</p>
		<button class="btn-new" @click="$emit('new-chat')">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			New Conversation
		</button>
	</div>
</template>

<script>
export default {
	emits: ["new-chat"],
};
</script>

<style scoped lang="scss">
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding: 40px;
	text-align: center;
}

.empty-icon {
	margin-bottom: 16px;
}

h3 {
	font-size: 18px;
	font-weight: 600;
	color: #475569;
	margin: 0 0 8px;
}

p {
	font-size: 14px;
	color: #94a3b8;
	margin: 0 0 24px;
}

.btn-new {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 24px;
	border-radius: 10px;
	border: none;
	background: linear-gradient(135deg, #4FC3F7, #29B6F6);
	color: white;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: transform 0.15s, box-shadow 0.15s;
}

.btn-new:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(79, 195, 247, 0.4);
}
</style>
