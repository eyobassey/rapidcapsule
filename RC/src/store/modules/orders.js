import axios from "axios";

export default {
  namespaced: true,

  state() {
    return {
      loading: false,
      orders: [],
    };
  },

  getters: {
    getOrders: (state) => state.orders,
    getLoading: (state) => state.loading,
  },

  mutations: {
    SET_ORDERS(state, orders) {
      state.orders = orders;
    },
    SET_LOADING(state, loadingState) {
      state.loading = loadingState;
    },
  },

  actions: {
    async fetchOrders({ commit }) {
      try {
        commit("SET_LOADING", true);
        commit("SET_ORDERS", []);
        const response = await axios.get("prescriptions/orders");

        if (response.status === 200) {
          commit("SET_ORDERS", [...response.data.data]);
          commit("SET_LOADING", false);
        }

        return response.data.data;
      } catch (error) {
        const {
          response: {
            data: { errorMessage },
          },
        } = error;
        console.error(errorMessage, "error");
        commit("SET_LOADING", false);
        commit("SET_ORDERS", []);
      }
    },
  },
};
