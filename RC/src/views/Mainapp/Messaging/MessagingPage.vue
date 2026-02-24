<template>
	<div class="messaging-page">
		<!-- Consent Banner -->
		<ConsentBanner v-if="showConsentBanner" @consent-given="onConsentGiven" />

		<div v-else class="messaging-layout">
			<!-- Conversation List (left panel) -->
			<div class="conversations-panel" :class="{ 'hidden-mobile': activeConversation }">
				<ConversationList
					:conversations="sortedConversations"
					:active-id="activeConversation?._id"
					:presence-map="$store.state.messaging.presenceMap"
					:loading="isLoading"
					@select="selectConversation"
					@new-chat="showNewChat = true"
					@search="onSearch"
				/>
			</div>

			<!-- Chat Panel (right panel) -->
			<div class="chat-panel" :class="{ 'hidden-mobile': !activeConversation }">
				<ChatPanel
					v-if="activeConversation"
					:conversation="activeConversation"
					:messages="messages"
					:current-user-id="currentUserId"
					:has-more="hasMoreMessages"
					:typing-users="typingUsers"
					:presence-map="$store.state.messaging.presenceMap"
					:restriction="$store.getters['messaging/messagingRestriction']"
					@send-message="handleSendMessage"
					@send-attachment="handleSendAttachment"
					@load-more="loadMoreMessages"
					@typing="handleTyping"
					@mark-read="handleMarkRead"
					@delete-message="handleDeleteMessage"
					@download="handleDownload"
					@view-media="viewingMedia = $event"
					@back="activeConversation = null"
				/>
				<EmptyState v-else @new-chat="showNewChat = true" />
			</div>
		</div>

		<!-- New Conversation Modal -->
		<NewConversationModal
			v-if="showNewChat"
			@close="showNewChat = false"
			@start-conversation="startConversation"
		/>

		<!-- Media Viewer -->
		<MediaViewer
			v-if="viewingMedia"
			:attachment="viewingMedia"
			@close="viewingMedia = null"
			@download="handleDownloadFromViewer"
		/>
	</div>
</template>

<script>
import { mapGetters, mapActions, mapState } from "vuex";
import ConversationList from "./components/ConversationList.vue";
import ChatPanel from "./components/ChatPanel.vue";
import EmptyState from "./components/EmptyState.vue";
import NewConversationModal from "./components/NewConversationModal.vue";
import MediaViewer from "./components/MediaViewer.vue";
import ConsentBanner from "./components/ConsentBanner.vue";

export default {
	name: "MessagingPage",

	components: {
		ConversationList,
		ChatPanel,
		EmptyState,
		NewConversationModal,
		MediaViewer,
		ConsentBanner,
	},

	data() {
		return {
			showNewChat: false,
			viewingMedia: null,
			showConsentBanner: false,
		};
	},

	computed: {
		...mapGetters("messaging", [
			"sortedConversations",
			"activeMessages",
			"activeConversation",
			"totalUnread",
			"isConnected",
			"isLoading",
			"hasMoreMessages",
			"hasConsent",
		]),
		messages() {
			return this.activeMessages;
		},
		currentUserId() {
			return this.$store.getters.userprofile?._id;
		},
		typingUsers() {
			if (!this.activeConversation) return [];
			return this.$store.getters["messaging/typingUsersInConversation"](
				this.activeConversation._id
			);
		},
	},

	watch: {
		"$route.params.conversationId": {
			immediate: true,
			handler(id) {
				if (id) {
					this.openConversationById(id);
				}
			},
		},
	},

	async mounted() {
		// Check consent first
		const hasConsent = await this.$store.dispatch("messaging/checkConsent");
		if (!hasConsent) {
			this.showConsentBanner = true;
			return;
		}

		await this.init();
	},

	beforeUnmount() {
		this.$store.dispatch("messaging/stopTyping", this.activeConversation?._id);
		this.$store.dispatch("messaging/disconnectSocket");
	},

	methods: {
		...mapActions("messaging", [
			"fetchConversations",
			"fetchMessages",
			"sendMessage",
			"sendAttachment",
			"markAsRead",
			"createConversation",
			"deleteMessage",
			"getDownloadUrl",
			"connectSocket",
			"startTyping",
			"stopTyping",
			"setActiveConversation",
		]),

		async init() {
			await this.fetchConversations();
			this.$store.dispatch("messaging/fetchMyRestrictions");
			this.connectSocket();
		},

		async onConsentGiven() {
			await this.$store.dispatch("messaging/recordConsent");
			this.showConsentBanner = false;
			await this.init();
		},

		async selectConversation(conversation) {
			this.setActiveConversation(conversation);
			await this.fetchMessages({ conversationId: conversation._id });
			await this.markAsRead(conversation._id);

			// Update URL
			const basePath = this.$route.path.includes("/specialist/")
				? "/app/specialist/messages"
				: "/app/patient/messages";
			if (this.$route.params.conversationId !== conversation._id) {
				this.$router.replace(`${basePath}/${conversation._id}`);
			}
		},

		async openConversationById(id) {
			// If conversations not loaded yet, wait
			if (this.sortedConversations.length === 0) {
				await this.fetchConversations();
			}
			const conv = this.sortedConversations.find((c) => c._id === id);
			if (conv) {
				await this.selectConversation(conv);
			}
		},

		async handleSendMessage({ content, replyTo }) {
			if (!this.activeConversation) return;
			await this.sendMessage({
				conversationId: this.activeConversation._id,
				type: "text",
				content,
				replyTo,
			});
			this.stopTyping(this.activeConversation._id);
		},

		async handleSendAttachment({ file, type, content, durationSeconds, replyTo, thumbnail }) {
			if (!this.activeConversation) return;
			await this.$store.dispatch("messaging/sendAttachment", {
				conversationId: this.activeConversation._id,
				file,
				type,
				content,
				durationSeconds,
				replyTo,
				thumbnail,
			});
		},

		async loadMoreMessages() {
			if (!this.activeConversation || !this.hasMoreMessages) return;
			const cursor = this.$store.state.messaging.messageCursor;
			await this.fetchMessages({
				conversationId: this.activeConversation._id,
				before: cursor,
			});
		},

		handleTyping() {
			if (this.activeConversation) {
				this.startTyping(this.activeConversation._id);
			}
		},

		handleMarkRead() {
			if (this.activeConversation) {
				this.markAsRead(this.activeConversation._id);
			}
		},

		async handleDeleteMessage(messageId) {
			await this.deleteMessage(messageId);
		},

		async handleDownload({ conversationId, messageId, attachment }) {
			try {
				const result = await this.getDownloadUrl({ conversationId, messageId });
				window.open(result.url, "_blank");
			} catch (error) {
				console.error("Download failed:", error);
			}
		},

		async handleDownloadFromViewer(attachment) {
			if (this.activeConversation && attachment._messageId) {
				await this.handleDownload({
					conversationId: this.activeConversation._id,
					messageId: attachment._messageId,
					attachment,
				});
			}
		},

		async startConversation(userId) {
			try {
				const conversation = await this.createConversation(userId);
				this.showNewChat = false;
				await this.selectConversation(conversation);
			} catch (error) {
				console.error("Failed to start conversation:", error);
			}
		},

		onSearch(query) {
			this.fetchConversations({ search: query });
		},
	},
};
</script>

<style scoped lang="scss">
.messaging-page {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	max-width: 1200px;
	margin: 0 auto;
	padding: 24px;

	@media (max-width: 768px) {
		padding: 0;
		max-width: 100%;
	}
}

.messaging-layout {
	display: flex;
	flex: 1;
	gap: 16px;
	height: calc(100vh - 96px);
	min-height: 0;

	@media (max-width: 768px) {
		gap: 0;
		height: 100vh;
	}
}

.conversations-panel {
	width: 340px;
	flex-shrink: 0;
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 16px;
	overflow: hidden;
	display: flex;
	flex-direction: column;

	@media (max-width: 768px) {
		width: 100%;
		border-radius: 0;
		border: none;
	}
}

.chat-panel {
	flex: 1;
	min-width: 0;
	background: rgba(255, 255, 255, 0.85);
	backdrop-filter: blur(20px);
	-webkit-backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.3);
	border-radius: 16px;
	overflow: hidden;
	display: flex;
	flex-direction: column;

	@media (max-width: 768px) {
		border-radius: 0;
		border: none;
	}
}

@media (max-width: 768px) {
	.hidden-mobile {
		display: none !important;
	}
}
</style>
