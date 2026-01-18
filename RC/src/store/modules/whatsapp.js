import apiFactory from "@/services/apiFactory";

export default {
  namespaced: true,

  state() {
    return {
      identity: null,
      prescriptions: [],
      totalPrescriptions: 0,
      loading: false,
      error: null,
      linkingInProgress: false,
      pendingNumber: null,
    };
  },

  getters: {
    isLinked(state) {
      return state.identity?.is_verified === true;
    },

    linkedNumber(state) {
      return state.identity?.whatsapp_number || null;
    },

    linkStatus(state) {
      if (!state.identity) return 'not_linked';
      if (state.identity.is_verified) return 'verified';
      return 'pending_verification';
    },

    prescriptionList(state) {
      return state.prescriptions;
    },

    isLoading(state) {
      return state.loading;
    },

    getError(state) {
      return state.error;
    },
  },

  mutations: {
    SET_IDENTITY(state, identity) {
      state.identity = identity;
    },

    SET_PRESCRIPTIONS(state, { items, total }) {
      state.prescriptions = items;
      state.totalPrescriptions = total;
    },

    SET_LOADING(state, loading) {
      state.loading = loading;
    },

    SET_ERROR(state, error) {
      state.error = error;
    },

    SET_LINKING_IN_PROGRESS(state, inProgress) {
      state.linkingInProgress = inProgress;
    },

    SET_PENDING_NUMBER(state, number) {
      state.pendingNumber = number;
    },

    CLEAR_IDENTITY(state) {
      state.identity = null;
      state.pendingNumber = null;
      state.linkingInProgress = false;
    },
  },

  actions: {
    /**
     * Fetch WhatsApp identity status
     */
    async fetchStatus({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);

      try {
        const response = await apiFactory.$_getWhatsAppStatus();
        if (response.status === 200) {
          commit('SET_IDENTITY', response.data.data);
        }
        return response.data;
      } catch (error) {
        // 404 means not linked, which is valid state
        if (error.response?.status === 404) {
          commit('SET_IDENTITY', null);
          return { data: null };
        }
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch status');
        throw error;
      } finally {
        commit('SET_LOADING', false);
      }
    },

    /**
     * Initiate WhatsApp number linking
     */
    async linkNumber({ commit }, whatsappNumber) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);

      try {
        const response = await apiFactory.$_linkWhatsAppNumber({
          whatsapp_number: whatsappNumber,
        });

        if (response.status === 200 || response.status === 201) {
          commit('SET_LINKING_IN_PROGRESS', true);
          commit('SET_PENDING_NUMBER', whatsappNumber);
          return { success: true, message: response.data.message };
        }
        return { success: false, message: 'Failed to initiate linking' };
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to link number';
        commit('SET_ERROR', message);
        return { success: false, message };
      } finally {
        commit('SET_LOADING', false);
      }
    },

    /**
     * Verify OTP to complete linking
     */
    async verifyOtp({ commit, state }, otp) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);

      try {
        const response = await apiFactory.$_verifyWhatsAppOtp({
          whatsapp_number: state.pendingNumber,
          otp: otp,
        });

        if (response.status === 200) {
          commit('SET_IDENTITY', response.data.data);
          commit('SET_LINKING_IN_PROGRESS', false);
          commit('SET_PENDING_NUMBER', null);
          return { success: true, message: 'WhatsApp linked successfully' };
        }
        return { success: false, message: 'Verification failed' };
      } catch (error) {
        const message = error.response?.data?.message || 'Invalid OTP';
        commit('SET_ERROR', message);
        return { success: false, message };
      } finally {
        commit('SET_LOADING', false);
      }
    },

    /**
     * Unlink WhatsApp number
     */
    async unlinkNumber({ commit }) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);

      try {
        const response = await apiFactory.$_unlinkWhatsApp();

        if (response.status === 200) {
          commit('CLEAR_IDENTITY');
          return { success: true, message: 'WhatsApp unlinked successfully' };
        }
        return { success: false, message: 'Failed to unlink' };
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to unlink';
        commit('SET_ERROR', message);
        return { success: false, message };
      } finally {
        commit('SET_LOADING', false);
      }
    },

    /**
     * Fetch WhatsApp prescriptions
     */
    async fetchPrescriptions({ commit }, params = {}) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);

      try {
        const response = await apiFactory.$_getWhatsAppPrescriptions(params);

        if (response.status === 200) {
          commit('SET_PRESCRIPTIONS', {
            items: response.data.data.items || [],
            total: response.data.data.total || 0,
          });
          return response.data.data;
        }
        return { items: [], total: 0 };
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch prescriptions');
        return { items: [], total: 0 };
      } finally {
        commit('SET_LOADING', false);
      }
    },

    /**
     * Clear error state
     */
    clearError({ commit }) {
      commit('SET_ERROR', null);
    },

    /**
     * Cancel linking process
     */
    cancelLinking({ commit }) {
      commit('SET_LINKING_IN_PROGRESS', false);
      commit('SET_PENDING_NUMBER', null);
    },
  },
};
