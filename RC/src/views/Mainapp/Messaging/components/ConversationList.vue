<template>
	<div class="conversation-list">
		<div class="list-header">
			<h2>Messages</h2>
			<button class="btn-new-chat" @click="$emit('new-chat')" title="New conversation">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					<line x1="12" y1="8" x2="12" y2="14" />
					<line x1="9" y1="11" x2="15" y2="11" />
				</svg>
			</button>
		</div>

		<div class="search-bar">
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
				<circle cx="11" cy="11" r="8" />
				<path d="M21 21l-4.35-4.35" />
			</svg>
			<input
				v-model="searchQuery"
				type="text"
				placeholder="Search conversations..."
				@input="debouncedSearch"
			/>
		</div>

		<div class="conversations" v-if="!loading">
			<ConversationItem
				v-for="conv in conversations"
				:key="conv._id"
				:conversation="conv"
				:active="activeId === conv._id"
				:presence="getOtherUserPresence(conv)"
				@click="$emit('select', conv)"
			/>
			<div v-if="conversations.length === 0" class="no-conversations">
				<p>No conversations yet</p>
				<button class="btn-start" @click="$emit('new-chat')">Start a conversation</button>
			</div>
		</div>
		<div v-else class="loading-state">
			<div class="spinner"></div>
		</div>
	</div>
</template>

<script>
import ConversationItem from "./ConversationItem.vue";

let searchTimeout = null;

export default {
	components: { ConversationItem },

	props: {
		conversations: { type: Array, default: () => [] },
		activeId: { type: String, default: null },
		presenceMap: { type: Object, default: () => ({}) },
		loading: { type: Boolean, default: false },
	},

	emits: ["select", "new-chat", "search"],

	data() {
		return { searchQuery: "" };
	},

	methods: {
		debouncedSearch() {
			if (searchTimeout) clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => {
				this.$emit("search", this.searchQuery);
			}, 300);
		},

		getOtherUserPresence(conversation) {
			const myId = this.$store.getters.userprofile?._id;
			const other = conversation.participants?.find(
				(p) => (p.user?._id || p.user) !== myId
			);
			const otherId = other?.user?._id || other?.user;
			return this.presenceMap[otherId] || "offline";
		},
	},
};
</script>

<style scoped lang="scss">
.conversation-list {
	display: flex;
	flex-direction: column;
	height: 100%;
}

.list-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20px 20px 12px;

	h2 {
		font-size: 20px;
		font-weight: 700;
		color: #1e293b;
		margin: 0;
	}
}

.btn-new-chat {
	width: 36px;
	height: 36px;
	border-radius: 10px;
	border: none;
	background: linear-gradient(135deg, #4FC3F7, #29B6F6);
	color: white;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: transform 0.15s, box-shadow 0.15s;

	&:hover {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(79, 195, 247, 0.4);
	}
}

.search-bar {
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0 16px 12px;
	padding: 8px 12px;
	background: #f1f5f9;
	border-radius: 10px;
	border: 1px solid transparent;
	transition: border-color 0.2s;

	&:focus-within {
		border-color: #4FC3F7;
		background: white;
	}

	input {
		flex: 1;
		border: none;
		background: transparent;
		font-size: 14px;
		color: #334155;
		outline: none;

		&::placeholder {
			color: #94a3b8;
		}
	}
}

.conversations {
	flex: 1;
	overflow-y: auto;
	padding: 0 8px 8px;
}

.no-conversations {
	text-align: center;
	padding: 40px 20px;

	p {
		color: #94a3b8;
		margin-bottom: 16px;
	}
}

.btn-start {
	padding: 8px 20px;
	border-radius: 8px;
	border: none;
	background: linear-gradient(135deg, #4FC3F7, #29B6F6);
	color: white;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
}

.loading-state {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
}

.spinner {
	width: 32px;
	height: 32px;
	border: 3px solid #e2e8f0;
	border-top-color: #4FC3F7;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}
</style>
