<template>
	<span class="presence-indicator" :class="status" :title="statusLabel"></span>
</template>

<script>
export default {
	props: {
		status: { type: String, default: "offline" },
	},
	computed: {
		statusLabel() {
			switch (this.status) {
				case "online": return "Online";
				case "away": return "Away";
				default: return "Offline";
			}
		},
	},
};
</script>

<style scoped lang="scss">
.presence-indicator {
	display: inline-block;
	width: 12px;
	height: 12px;
	border-radius: 50%;
	border: 2px solid white;
	background: #94a3b8;
}

.presence-indicator.online {
	background: #10b981;
}

.presence-indicator.away {
	background: #f59e0b;
}

.presence-indicator.offline {
	background: #94a3b8;
}
</style>
