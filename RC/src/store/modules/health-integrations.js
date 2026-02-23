import axios from "axios";

export default {
	namespaced: true,

	state() {
		return {
			integrations: [],
			availableProviders: [],
			syncLogs: [],
			healthData: [],
			loading: false,
			syncing: {},
			error: null,
		};
	},

	getters: {
		integrations(state) {
			return state.integrations;
		},
		connectedDevices(state) {
			return state.integrations.filter((i) => i.status === "connected");
		},
		availableProviders(state) {
			return state.availableProviders;
		},
		syncLogs(state) {
			return state.syncLogs;
		},
		healthData(state) {
			return state.healthData;
		},
		isLoading(state) {
			return state.loading;
		},
		isSyncing: (state) => (provider) => {
			return state.syncing[provider] || false;
		},
		error(state) {
			return state.error;
		},
	},

	mutations: {
		SET_INTEGRATIONS(state, integrations) {
			state.integrations = integrations;
		},
		SET_AVAILABLE_PROVIDERS(state, providers) {
			state.availableProviders = providers;
		},
		SET_SYNC_LOGS(state, logs) {
			state.syncLogs = logs;
		},
		SET_HEALTH_DATA(state, data) {
			state.healthData = data;
		},
		SET_LOADING(state, loading) {
			state.loading = loading;
		},
		SET_SYNCING(state, { provider, syncing }) {
			state.syncing = { ...state.syncing, [provider]: syncing };
		},
		SET_ERROR(state, error) {
			state.error = error;
		},
		UPDATE_INTEGRATION(state, updated) {
			const idx = state.integrations.findIndex(
				(i) => i.provider === updated.provider
			);
			if (idx !== -1) {
				state.integrations.splice(idx, 1, updated);
			} else {
				state.integrations.push(updated);
			}
		},
		REMOVE_INTEGRATION(state, provider) {
			state.integrations = state.integrations.filter(
				(i) => i.provider !== provider
			);
		},
	},

	actions: {
		async fetchIntegrations({ commit }) {
			commit("SET_LOADING", true);
			commit("SET_ERROR", null);
			try {
				const response = await axios.get("health-integrations");
				const data = response.data?.data || response.data;
				commit("SET_INTEGRATIONS", Array.isArray(data) ? data : []);
			} catch (error) {
				commit(
					"SET_ERROR",
					error?.response?.data?.message || "Failed to load integrations"
				);
			} finally {
				commit("SET_LOADING", false);
			}
		},

		async fetchAvailableProviders({ commit }) {
			try {
				const response = await axios.get("health-integrations/providers");
				const data = response.data?.data || response.data;
				commit("SET_AVAILABLE_PROVIDERS", Array.isArray(data) ? data : []);
			} catch (error) {
				console.error("Failed to fetch providers:", error);
			}
		},

		async fetchSyncLogs({ commit }, limit = 20) {
			try {
				const response = await axios.get("health-integrations/sync-logs", {
					params: { limit },
				});
				const data = response.data?.data || response.data;
				commit("SET_SYNC_LOGS", Array.isArray(data) ? data : []);
			} catch (error) {
				console.error("Failed to fetch sync logs:", error);
			}
		},

		async fetchHealthData({ commit }) {
			try {
				const response = await axios.get("health-integrations/data");
				const data = response.data?.data || response.data;
				commit("SET_HEALTH_DATA", Array.isArray(data) ? data : []);
			} catch (error) {
				console.error("Failed to fetch health data:", error);
			}
		},

		async connectProvider({ commit }, { provider, dataTypes, autoSync }) {
			commit("SET_ERROR", null);
			try {
				const response = await axios.post("health-integrations/connect", {
					provider,
					dataTypes: dataTypes || [],
					autoSync: autoSync !== false,
				});

				const data = response.data?.data || response.data;

				if (data.authUrl) {
					// Redirect to OAuth provider
					window.location.href = data.authUrl;
					return { redirected: true };
				}

				if (data.requiresNativeApp) {
					return { requiresNativeApp: true, instructions: data.instructions };
				}

				return data;
			} catch (error) {
				const message =
					error?.response?.data?.message || "Failed to connect provider";
				commit("SET_ERROR", message);
				return { error: message };
			}
		},

		async handleOAuthCallback({ commit, dispatch }, { provider, code }) {
			try {
				const response = await axios.post(
					`health-integrations/callback/${provider}`,
					{ code }
				);
				const data = response.data?.data || response.data;
				if (data.success) {
					await dispatch("fetchIntegrations");
				}
				return data;
			} catch (error) {
				commit(
					"SET_ERROR",
					error?.response?.data?.message || "OAuth callback failed"
				);
				return { error: true };
			}
		},

		async syncNow({ commit }, provider) {
			commit("SET_SYNCING", { provider, syncing: true });
			commit("SET_ERROR", null);
			try {
				const response = await axios.post(
					`health-integrations/sync/${provider}`,
					{}
				);
				return response.data?.data || response.data;
			} catch (error) {
				commit(
					"SET_ERROR",
					error?.response?.data?.message || "Sync failed"
				);
				return { error: true };
			} finally {
				commit("SET_SYNCING", { provider, syncing: false });
			}
		},

		async disconnectProvider({ commit, dispatch }, provider) {
			commit("SET_ERROR", null);
			try {
				await axios.delete(`health-integrations/${provider}`);
				commit("REMOVE_INTEGRATION", provider);
				return { success: true };
			} catch (error) {
				commit(
					"SET_ERROR",
					error?.response?.data?.message || "Failed to disconnect"
				);
				return { error: true };
			}
		},

		async updateSyncSettings({ commit, dispatch }, { provider, settings }) {
			try {
				const response = await axios.patch(
					`health-integrations/${provider}/settings`,
					settings
				);
				const data = response.data?.data || response.data;
				commit("UPDATE_INTEGRATION", data);
				return data;
			} catch (error) {
				commit(
					"SET_ERROR",
					error?.response?.data?.message || "Failed to update settings"
				);
				return { error: true };
			}
		},
	},
};
