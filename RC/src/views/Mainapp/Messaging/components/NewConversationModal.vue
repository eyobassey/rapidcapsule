<template>
	<div class="modal-overlay" @click.self="$emit('close')">
		<div class="modal-content">
			<div class="modal-header">
				<h3>New Conversation</h3>
				<button class="btn-close" @click="$emit('close')">
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>

			<!-- Tabs -->
			<div class="tabs">
				<button
					class="tab"
					:class="{ active: activeTab === 'contacts' }"
					@click="activeTab = 'contacts'"
				>
					My {{ isSpecialist ? 'Patients' : 'Specialists' }}
				</button>
				<button
					class="tab"
					:class="{ active: activeTab === 'search' }"
					@click="activeTab = 'search'"
				>
					Search
				</button>
			</div>

			<!-- Search input (only on search tab) -->
			<div v-if="activeTab === 'search'" class="search-section">
				<input
					v-model="search"
					type="text"
					placeholder="Search by name or email..."
					@input="debouncedSearch"
					ref="searchInput"
				/>
			</div>

			<!-- Results -->
			<div class="results">
				<!-- Loading -->
				<div v-if="loading" class="loading">
					<div class="spinner"></div>
				</div>

				<!-- Contacts Tab -->
				<template v-else-if="activeTab === 'contacts'">
					<div v-if="contacts.length === 0" class="no-results">
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
							<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
							<circle cx="8.5" cy="7" r="4" />
							<line x1="20" y1="8" x2="20" y2="14" />
							<line x1="23" y1="11" x2="17" y2="11" />
						</svg>
						<p>No {{ isSpecialist ? 'patients' : 'specialists' }} yet</p>
						<span class="hint-text">Your contacts from appointments will appear here</span>
					</div>
					<div
						v-for="user in contacts"
						:key="user._id"
						class="user-item"
						@click="selectUser(user)"
					>
						<div class="user-avatar">
							<img v-if="user.profile?.profile_photo" :src="user.profile.profile_photo" :alt="userName(user)" />
							<span v-else>{{ userInitials(user) }}</span>
						</div>
						<div class="user-info">
							<span class="user-name">{{ userName(user) }}</span>
							<span class="user-meta">
								<span class="user-type">{{ user.user_type }}</span>
								<span v-if="user.specialty" class="user-specialty">&middot; {{ user.specialty }}</span>
							</span>
						</div>
						<svg class="chat-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
							<polyline points="9 18 15 12 9 6" />
						</svg>
					</div>
				</template>

				<!-- Search Tab -->
				<template v-else>
					<div v-if="searchResults.length === 0 && search && !loading" class="no-results">
						<p>No users found for "{{ search }}"</p>
					</div>
					<div v-else-if="!search" class="no-results">
						<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
							<circle cx="11" cy="11" r="8" />
							<line x1="21" y1="21" x2="16.65" y2="16.65" />
						</svg>
						<p>Search for anyone on the platform</p>
						<span class="hint-text">Type a name or email to find users</span>
					</div>
					<div
						v-for="user in searchResults"
						:key="user._id"
						class="user-item"
						@click="selectUser(user)"
					>
						<div class="user-avatar">
							<img v-if="user.profile?.profile_photo" :src="user.profile.profile_photo" :alt="userName(user)" />
							<span v-else>{{ userInitials(user) }}</span>
						</div>
						<div class="user-info">
							<span class="user-name">{{ userName(user) }}</span>
							<span class="user-meta">
								<span class="user-type">{{ user.user_type }}</span>
								<span v-if="user.specialty" class="user-specialty">&middot; {{ user.specialty }}</span>
							</span>
						</div>
						<svg class="chat-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
							<polyline points="9 18 15 12 9 6" />
						</svg>
					</div>
				</template>
			</div>
		</div>
	</div>
</template>

<script>
let searchTimeout = null;

export default {
	emits: ["close", "start-conversation"],

	data() {
		return {
			activeTab: "contacts",
			search: "",
			searchResults: [],
			contacts: [],
			loading: false,
		};
	},

	computed: {
		isSpecialist() {
			return this.$store.getters.userprofile?.user_type === "Specialist";
		},
	},

	mounted() {
		this.loadContacts();
	},

	watch: {
		activeTab(tab) {
			if (tab === "search") {
				this.$nextTick(() => this.$refs.searchInput?.focus());
			}
		},
	},

	methods: {
		async loadContacts() {
			this.loading = true;
			try {
				this.contacts = await this.$store.dispatch("messaging/getMyContacts");
			} finally {
				this.loading = false;
			}
		},

		debouncedSearch() {
			if (searchTimeout) clearTimeout(searchTimeout);
			searchTimeout = setTimeout(() => this.searchUsers(), 300);
		},

		async searchUsers() {
			if (!this.search.trim()) {
				this.searchResults = [];
				return;
			}
			this.loading = true;
			try {
				this.searchResults = await this.$store.dispatch("messaging/searchUsers", this.search.trim());
			} finally {
				this.loading = false;
			}
		},

		userName(user) {
			if (user.profile?.first_name) {
				return `${user.profile.first_name} ${user.profile.last_name || ""}`.trim();
			}
			return user.email || "Unknown";
		},

		userInitials(user) {
			const f = user.profile?.first_name?.[0] || "";
			const l = user.profile?.last_name?.[0] || "";
			return (f + l).toUpperCase() || "?";
		},

		selectUser(user) {
			this.$emit("start-conversation", user._id);
		},
	},
};
</script>

<style scoped lang="scss">
.modal-overlay {
	position: fixed;
	inset: 0;
	background: rgba(0, 0, 0, 0.4);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	backdrop-filter: blur(4px);
}

.modal-content {
	background: white;
	border-radius: 16px;
	width: 440px;
	max-width: 90vw;
	max-height: 75vh;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20px 24px 16px;

	h3 {
		font-size: 18px;
		font-weight: 600;
		color: #1e293b;
		margin: 0;
	}
}

.btn-close {
	background: none;
	border: none;
	cursor: pointer;
	color: #94a3b8;
	padding: 4px;
	border-radius: 6px;
	transition: background 0.15s;

	&:hover {
		background: #f1f5f9;
	}
}

.tabs {
	display: flex;
	padding: 0 24px;
	gap: 4px;
	border-bottom: 1px solid #e2e8f0;
}

.tab {
	flex: 1;
	padding: 10px 16px;
	background: none;
	border: none;
	border-bottom: 2px solid transparent;
	font-size: 14px;
	font-weight: 500;
	color: #94a3b8;
	cursor: pointer;
	transition: color 0.2s, border-color 0.2s;

	&.active {
		color: #4FC3F7;
		border-bottom-color: #4FC3F7;
	}

	&:hover:not(.active) {
		color: #64748b;
	}
}

.search-section {
	padding: 16px 24px 8px;

	input {
		width: 100%;
		padding: 10px 16px;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		font-size: 14px;
		outline: none;
		transition: border-color 0.2s;

		&:focus {
			border-color: #4FC3F7;
		}
	}
}

.results {
	flex: 1;
	overflow-y: auto;
	padding: 8px 12px 12px;
	min-height: 200px;
}

.loading {
	text-align: center;
	padding: 40px;
}

.no-results {
	text-align: center;
	padding: 32px 16px;
	color: #94a3b8;

	svg {
		margin-bottom: 12px;
	}

	p {
		font-size: 14px;
		margin: 0 0 4px;
		color: #64748b;
	}
}

.hint-text {
	font-size: 12px;
	color: #94a3b8;
}

.spinner {
	width: 28px;
	height: 28px;
	border: 3px solid #e2e8f0;
	border-top-color: #4FC3F7;
	border-radius: 50%;
	animation: spin 0.8s linear infinite;
	margin: 0 auto;
}

@keyframes spin {
	to { transform: rotate(360deg); }
}

.user-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 12px;
	border-radius: 10px;
	cursor: pointer;
	transition: background 0.15s;

	&:hover {
		background: rgba(79, 195, 247, 0.06);

		.chat-arrow {
			stroke: #4FC3F7;
		}
	}
}

.user-avatar {
	width: 42px;
	height: 42px;
	border-radius: 50%;
	background: linear-gradient(135deg, #4FC3F7, #29B6F6);
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	font-weight: 600;
	font-size: 14px;
	overflow: hidden;
	flex-shrink: 0;

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
}

.user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.user-name {
	font-size: 14px;
	font-weight: 500;
	color: #1e293b;
}

.user-meta {
	display: flex;
	align-items: center;
	gap: 4px;
	font-size: 12px;
}

.user-type {
	color: #4FC3F7;
	font-weight: 500;
}

.user-specialty {
	color: #94a3b8;
}

.chat-arrow {
	flex-shrink: 0;
	transition: stroke 0.15s;
}
</style>
