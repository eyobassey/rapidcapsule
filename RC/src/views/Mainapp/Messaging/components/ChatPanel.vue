<template>
	<div class="chat-panel-inner">
		<!-- Header -->
		<div class="chat-header">
			<button class="btn-back" @click="$emit('back')">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 12H5M12 19l-7-7 7-7" />
				</svg>
			</button>
			<div class="header-user">
				<div class="header-avatar">
					<img v-if="otherUser?.profile?.profile_photo && !headerImgError" :src="otherUser.profile.profile_photo" :alt="displayName" @error="headerImgError = true" />
					<span v-else>{{ initials }}</span>
				</div>
				<div class="header-info">
					<span class="header-name">{{ displayName }}</span>
					<span class="header-status" :class="otherPresence">
						{{ otherPresence === 'online' ? 'Online' : otherPresence === 'away' ? 'Away' : 'Offline' }}
					</span>
				</div>
			</div>
		</div>

		<!-- Messages Area -->
		<div class="messages-area" ref="messagesArea" @scroll="onScroll">
			<div v-if="hasMore" class="load-more" @click="$emit('load-more')">
				<span>Load earlier messages</span>
			</div>

			<div v-for="(group, idx) in groupedMessages" :key="idx" class="date-group">
				<div class="date-separator">
					<span>{{ group.label }}</span>
				</div>
				<MessageBubble
					v-for="msg in group.messages"
					:key="msg._id"
					:message="msg"
					:is-mine="msg.sender?._id === currentUserId || msg.sender === currentUserId"
					@delete="$emit('delete-message', msg._id)"
					@download="(attachment) => $emit('download', { conversationId: conversation._id, messageId: msg._id, attachment })"
					@view-media="$emit('view-media', $event)"
				/>
			</div>

			<TypingIndicator :names="typingNames" />
		</div>

		<!-- Input Area -->
		<ChatInput
			:restriction="restriction"
			@send="$emit('send-message', $event)"
			@send-attachment="$emit('send-attachment', $event)"
			@typing="$emit('typing')"
		/>
	</div>
</template>

<script>
import MessageBubble from "./MessageBubble.vue";
import ChatInput from "./ChatInput.vue";
import TypingIndicator from "./TypingIndicator.vue";

export default {
	components: { MessageBubble, ChatInput, TypingIndicator },

	props: {
		conversation: { type: Object, required: true },
		messages: { type: Array, default: () => [] },
		currentUserId: { type: String, required: true },
		hasMore: { type: Boolean, default: false },
		typingUsers: { type: Array, default: () => [] },
		presenceMap: { type: Object, default: () => ({}) },
		restriction: { type: Object, default: () => ({ status: "none" }) },
	},

	emits: ["send-message", "send-attachment", "load-more", "typing", "mark-read", "delete-message", "download", "back", "view-media"],

	data() {
		return { headerImgError: false };
	},

	computed: {
		otherUser() {
			const other = this.conversation.participants?.find(
				(p) => (p.user?._id || p.user) !== this.currentUserId
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
		otherPresence() {
			const otherId = this.otherUser?._id;
			return otherId ? (this.presenceMap[otherId] || "offline") : "offline";
		},
		typingNames() {
			return this.typingUsers.map((userId) => {
				const p = this.conversation.participants?.find(
					(p) => (p.user?._id || p.user) === userId
				);
				const u = p?.user;
				return u?.profile?.first_name || "Someone";
			});
		},
		groupedMessages() {
			const groups = [];
			let currentDate = null;

			for (const msg of this.messages) {
				const date = new Date(msg.created_at || msg.status?.sent_at);
				const dateKey = date.toDateString();

				if (dateKey !== currentDate) {
					currentDate = dateKey;
					groups.push({
						label: this.formatDateLabel(date),
						messages: [],
					});
				}
				groups[groups.length - 1].messages.push(msg);
			}
			return groups;
		},
	},

	watch: {
		messages: {
			handler() {
				this.$nextTick(() => this.scrollToBottom());
				this.$emit("mark-read");
			},
			deep: true,
		},
		conversation() {
			this.$nextTick(() => this.scrollToBottom());
		},
	},

	mounted() {
		this.$nextTick(() => this.scrollToBottom());
	},

	methods: {
		scrollToBottom() {
			const el = this.$refs.messagesArea;
			if (el) {
				el.scrollTop = el.scrollHeight;
			}
		},
		onScroll() {
			const el = this.$refs.messagesArea;
			if (el && el.scrollTop < 50 && this.hasMore) {
				this.$emit("load-more");
			}
		},
		formatDateLabel(date) {
			const now = new Date();
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
			const diff = today - msgDate;

			if (diff === 0) return "Today";
			if (diff === 86400000) return "Yesterday";
			if (diff < 604800000) {
				return date.toLocaleDateString([], { weekday: "long" });
			}
			return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
		},
	},
};
</script>

<style scoped lang="scss">
.chat-panel-inner {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.chat-header {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 16px 20px;
	border-bottom: 1px solid #e2e8f0;
	background: rgba(255, 255, 255, 0.9);
}

.btn-back {
	display: none;
	background: none;
	border: none;
	cursor: pointer;
	padding: 4px;
	color: #64748b;

	@media (max-width: 768px) {
		display: flex;
	}
}

.header-user {
	display: flex;
	align-items: center;
	gap: 12px;
}

.header-avatar {
	width: 40px;
	height: 40px;
	border-radius: 50%;
	background: linear-gradient(135deg, #4FC3F7, #29B6F6);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-weight: 600;
	font-size: 14px;
	overflow: hidden;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.header-info {
	display: flex;
	flex-direction: column;
}

.header-name {
	font-size: 15px;
	font-weight: 600;
	color: #1e293b;
}

.header-status {
	font-size: 12px;
	color: #94a3b8;

	&.online { color: #10b981; }
	&.away { color: #f59e0b; }
}

.messages-area {
	flex: 1;
	overflow-y: auto;
	padding: 16px 20px;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.load-more {
	text-align: center;
	padding: 8px;
	cursor: pointer;

	span {
		font-size: 12px;
		color: #4FC3F7;
		font-weight: 500;
	}
}

.date-separator {
	text-align: center;
	margin: 16px 0 8px;

	span {
		font-size: 11px;
		color: #94a3b8;
		background: #f1f5f9;
		padding: 4px 12px;
		border-radius: 12px;
	}
}
</style>
