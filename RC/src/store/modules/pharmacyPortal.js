import apiServices from "@/services/apiFactory";

const state = {
  dashboardStats: {
    pendingOrders: 0,
    processingOrders: 0,
    readyForPickup: 0,
    completedToday: 0,
  },
  pharmacyOrders: [],
  currentOrder: null,
  totalOrders: 0,
  prescriptions: [],
  currentPrescription: null,
  totalPrescriptions: 0,
  inventory: [],
  totalInventory: 0,
  inventoryStats: {
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
  },
  categories: [],
  lowStockDrugs: [],
  loading: false,
  error: null,
};

const getters = {
  getDashboardStats: (state) => state.dashboardStats,
  getPharmacyOrders: (state) => state.pharmacyOrders,
  getCurrentOrder: (state) => state.currentOrder,
  getTotalOrders: (state) => state.totalOrders,
  getPrescriptions: (state) => state.prescriptions,
  getCurrentPrescription: (state) => state.currentPrescription,
  getTotalPrescriptions: (state) => state.totalPrescriptions,
  getInventory: (state) => state.inventory,
  getTotalInventory: (state) => state.totalInventory,
  getInventoryStats: (state) => state.inventoryStats,
  getCategories: (state) => state.categories,
  getLowStockDrugs: (state) => state.lowStockDrugs,
  getLoading: (state) => state.loading,
  getError: (state) => state.error,
};

const mutations = {
  SET_DASHBOARD_STATS(state, stats) {
    state.dashboardStats = stats;
  },
  SET_PHARMACY_ORDERS(state, orders) {
    state.pharmacyOrders = orders;
  },
  SET_CURRENT_ORDER(state, order) {
    state.currentOrder = order;
  },
  SET_TOTAL_ORDERS(state, total) {
    state.totalOrders = total;
  },
  SET_PRESCRIPTIONS(state, prescriptions) {
    state.prescriptions = prescriptions;
  },
  SET_CURRENT_PRESCRIPTION(state, prescription) {
    state.currentPrescription = prescription;
  },
  SET_TOTAL_PRESCRIPTIONS(state, total) {
    state.totalPrescriptions = total;
  },
  SET_INVENTORY(state, inventory) {
    state.inventory = inventory;
  },
  SET_TOTAL_INVENTORY(state, total) {
    state.totalInventory = total;
  },
  SET_INVENTORY_STATS(state, stats) {
    state.inventoryStats = stats;
  },
  SET_CATEGORIES(state, categories) {
    state.categories = categories;
  },
  SET_LOW_STOCK_DRUGS(state, drugs) {
    state.lowStockDrugs = drugs;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
};

const actions = {
  // Dashboard Stats
  async fetchDashboardStats({ commit }) {
    try {
      commit("SET_LOADING", true);
      const response = await apiServices.getPharmacyDashboardStats();
      commit("SET_DASHBOARD_STATS", response.data?.data || response.data);
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error fetching dashboard stats:", error);
    } finally {
      commit("SET_LOADING", false);
    }
  },

  // Orders
  async fetchPharmacyOrders({ commit }, params = {}) {
    try {
      commit("SET_LOADING", true);
      const response = await apiServices.getPharmacyOrders(params);
      const data = response.data?.data || response.data;
      commit("SET_PHARMACY_ORDERS", data.orders || data);
      commit("SET_TOTAL_ORDERS", data.total || data.length);
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error fetching pharmacy orders:", error);
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async fetchOrderDetails({ commit }, orderId) {
    try {
      commit("SET_LOADING", true);
      const response = await apiServices.getPharmacyOrderDetails(orderId);
      commit("SET_CURRENT_ORDER", response.data?.data || response.data);
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error fetching order details:", error);
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async updateOrderStatus({ commit }, { orderId, status, notes }) {
    try {
      commit("SET_LOADING", true);
      await apiServices.updatePharmacyOrderStatus(orderId, { status, notes });
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error updating order status:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async cancelOrder({ commit }, { orderId, reason }) {
    try {
      commit("SET_LOADING", true);
      await apiServices.cancelPharmacyOrder(orderId, { reason });
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error cancelling order:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  // Prescriptions
  async fetchPrescriptions({ commit }, params = {}) {
    try {
      commit("SET_LOADING", true);
      const response = await apiServices.getPharmacyPrescriptions(params);
      const data = response.data?.data || response.data;
      commit("SET_PRESCRIPTIONS", data.prescriptions || data);
      commit("SET_TOTAL_PRESCRIPTIONS", data.total || data.length);
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error fetching prescriptions:", error);
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async fetchPrescriptionDetails({ commit }, prescriptionId) {
    try {
      commit("SET_LOADING", true);
      const response = await apiServices.getPharmacyPrescriptionDetails(prescriptionId);
      commit("SET_CURRENT_PRESCRIPTION", response.data?.data || response.data);
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error fetching prescription details:", error);
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async fillMedication({ commit }, { prescriptionId, medicationIndex }) {
    try {
      commit("SET_LOADING", true);
      await apiServices.fillPrescriptionMedication(prescriptionId, medicationIndex);
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error filling medication:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async fillAllMedications({ commit }, prescriptionId) {
    try {
      commit("SET_LOADING", true);
      await apiServices.fillAllPrescriptionMedications(prescriptionId);
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error filling all medications:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async processRefill({ commit }, prescriptionId) {
    try {
      commit("SET_LOADING", true);
      await apiServices.processPrescriptionRefill(prescriptionId);
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error processing refill:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  // Inventory
  async fetchInventory({ commit }, params = {}) {
    try {
      commit("SET_LOADING", true);
      const response = await apiServices.getPharmacyInventory(params);
      const data = response.data?.data || response.data;
      commit("SET_INVENTORY", data.drugs || data);
      commit("SET_TOTAL_INVENTORY", data.total || data.length);
      if (data.stats) {
        commit("SET_INVENTORY_STATS", data.stats);
      }
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error fetching inventory:", error);
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async fetchLowStockDrugs({ commit }) {
    try {
      const response = await apiServices.getLowStockDrugs();
      commit("SET_LOW_STOCK_DRUGS", response.data?.data || response.data);
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error fetching low stock drugs:", error);
    }
  },

  async fetchCategories({ commit }) {
    try {
      const response = await apiServices.getDrugCategories();
      commit("SET_CATEGORIES", response.data?.data || response.data);
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error fetching categories:", error);
    }
  },

  async addDrug({ commit }, drugData) {
    try {
      commit("SET_LOADING", true);
      await apiServices.addPharmacyDrug(drugData);
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error adding drug:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async updateDrug({ commit }, drugData) {
    try {
      commit("SET_LOADING", true);
      await apiServices.updatePharmacyDrug(drugData._id, drugData);
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error updating drug:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },

  async updateStock({ commit }, { drugId, quantity }) {
    try {
      commit("SET_LOADING", true);
      await apiServices.updateDrugStock(drugId, { quantity });
    } catch (error) {
      commit("SET_ERROR", error.message);
      console.error("Error updating stock:", error);
      throw error;
    } finally {
      commit("SET_LOADING", false);
    }
  },
};

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};
