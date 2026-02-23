<template>
	<div class="conversation-item" :class="{ active }" @click="$emit('click')">
		<div class="avatar-container">
			<div class="avatar">
				<img v-if="otherUser?.profile?.profile_photo && !imgError" :src="otherUser.profile.profile_photo" :alt="displayName" @error="imgError = true" />
				<span v-else>{{ initials }}</span>
			</div>
			<PresenceIndicator :status="presence" class="presence-dot" />
		</div>

		<div class="conversation-info">
			<div class="info-top">
				<span class="name">{{ displayName }}</span>
				<span class="time">{{ formatTime(conversation.last_message?.sent_at) }}</span>
			</div>
			<div class="info-bottom">
				<span class="last-message" :class="{ unread: unreadCount > 0 }">
					{{ lastMessagePreview }}
				</span>
				<span v-if="unreadCount > 0" class="unread-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
			</div>
		</div>
	</div>
</template>

<script>
import PresenceIndicator from "./PresenceIndicator.vue";

export default {
	components: { PresenceIndicator },

	props: {
		conversation: { type: Object, required: true },
		active: { type: Boolean, default: false },
		presence: { type: String, default: "offline" },
	},

	emits: ["click"],

	data() {
		return { imgError: false };
	},

	computed: {
		myId() {
			return this.$store.getters.userprofile?._id;
		},
		otherUser() {
			const other = this.conversation.participants?.find(
				(p) => (p.user?._id || p.user) !== this.myId
			);
			return other?.user || {};
		},
		displayName() {
			const u = this.otherUser;
			if (u?.profile?.first_name) {
				return `${u.profile.first_name} ${u.profile.last_name || ""}`.trim();
			}
			return u?.email || "Unknown User";
		},
		initials() {
			const u = this.otherUser;
			const first = u?.profile?.first_name?.[0] || "";
			const last = u?.profile?.last_name?.[0] || "";
			return (first + last).toUpperCase() || "?";
		},
		lastMessagePreview() {
			const msg = this.conversation.last_message;
			if (!msg) return "No messages yet";
			const maxLen = 40;
			const content = msg.content || "";
			return content.length > maxLen ? content.substring(0, maxLen) + "..." : content;
		},
		unreadCount() {
			const counts = this.conversation.unread_counts;
			if (!counts || !this.myId) return 0;
			return counts[this.myId] || 0;
		},
	},

	methods: {
		formatTime(dateStr) {
			if (!dateStr) return "";
			const date = new Date(dateStr);
			const now = new Date();
			const diff = now - date;
			const dayMs = 86400000;

			if (diff < dayMs) {
				return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
			} else if (diff < dayMs * 7) {
				return date.toLocaleDateString([], { weekday: "short" });
			} else {
				return date.toLocaleDateString([], { month: "short", day: "numeric" });
			}
		},
	},
};
</script>

<style scoped lang="scss">
.conversation-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	border-radius: 12px;
	cursor: pointer;
	transition: background 0.15s;

	&:hover {
		background: rgba(79, 195, 247, 0.06);
	}

	&.active {
		background: rgba(79, 195, 247, 0.12);
	}
}

.avatar-container {
	position: relative;
	flex-shrink: 0;
}

.avatar {
	width: 44px;
	height: 44px;
	border-radius: 50%;
	background: linear-gradient(135deg, #4FC3F7, #29B6F6);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-weight: 600;
	font-size: 15px;
	overflow: hidden;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.presence-dot {
	position: absolute;
	bottom: 0;
	right: 0;
}

.conversation-info {
	flex: 1;
	min-width: 0;
}

.info-top {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	margin-bottom: 2px;
}

.name {
	font-size: 14px;
	font-weight: 600;
	color: #1e293b;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.time {
	font-size: 11px;
	color: #94a3b8;
	flex-shrink: 0;
	margin-left: 8px;
}

.info-bottom {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.last-message {
	font-size: 13px;
	color: #94a3b8;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;

	&.unread {
		color: #334155;
		font-weight: 500;
	}
}

.unread-badge {
	flex-shrink: 0;
	min-width: 20px;
	height: 20px;
	padding: 0 6px;
	border-radius: 10px;
	background: linear-gradient(135deg, #4FC3F7, #29B6F6);
	color: white;
	font-size: 11px;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-left: 8px;
}
</style>
