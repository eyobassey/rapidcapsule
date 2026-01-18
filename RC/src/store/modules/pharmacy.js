import axios from "axios";

export default {
  namespaced: true,

  state() {
    return {
      loading: false,
      drugs: [],
      otcDrugs: [],
      categoryDrugs: [],
      currentDrug: null,
      pharmacies: [],
      nearbyPharmacies: [],
      selectedPharmacy: null,
      defaultPharmacy: null, // Platform default pharmacy
      cart: [],
      cartValidation: null,
      cartValidating: false,
      currentOrder: null,
      myOrders: [],
      orderDetails: null,
      drugCategories: [],
      searchResults: [],
      totalDrugs: 0,
      currentCategoryName: "",
      errorMessage: "",
      // Wallet state
      walletBalance: 0,
      walletLoading: false,
      walletError: null,
      selectedPaymentMethod: "card", // "card", "wallet", "split"
      splitPaymentAmount: 0, // Amount to pay from wallet in split payment
      // Delivery preferences (for streamlined checkout)
      deliveryMethod: "delivery", // "delivery" or "pickup"
      selectedDeliveryAddress: null,
      savedAddresses: [],
      addressesLoading: false,
      // Prescription state
      selectedPrescription: null,
      selectedPrescriptionType: null, // 'uploaded' or 'specialist'
      approvedPrescriptions: [],
      specialistPrescriptions: [], // Prescriptions created by specialists
      prescriptionsLoading: false,
    };
  },

  getters: {
    getDrugs: (state) => state.drugs,
    getOTCDrugs: (state) => state.otcDrugs,
    getCategoryDrugs: (state) => state.categoryDrugs,
    getCurrentDrug: (state) => state.currentDrug,
    getPharmacies: (state) => state.pharmacies,
    getNearbyPharmacies: (state) => state.nearbyPharmacies,
    getSelectedPharmacy: (state) => state.selectedPharmacy,
    getCart: (state) => state.cart,
    getCartItemCount: (state) => state.cart.reduce((sum, item) => sum + item.quantity, 0),
    getCartTotal: (state) => state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    getCartValidation: (state) => state.cartValidation,
    getCartValidating: (state) => state.cartValidating,
    getCartHasIssues: (state) => state.cartValidation && state.cartValidation.issues?.length > 0,
    getCartHasWarnings: (state) => state.cartValidation && state.cartValidation.warnings?.length > 0,
    getCartRequiresPrescription: (state) => state.cartValidation?.summary?.requiresPrescription || false,
    getCartHasControlledSubstances: (state) => state.cartValidation?.summary?.hasControlledSubstances || false,
    getCurrentOrder: (state) => state.currentOrder,
    getMyOrders: (state) => state.myOrders,
    getOrderDetails: (state) => state.orderDetails,
    getDrugCategories: (state) => state.drugCategories,
    getSearchResults: (state) => state.searchResults,
    getTotalDrugs: (state) => state.totalDrugs,
    getCurrentCategoryName: (state) => state.currentCategoryName,
    getLoading: (state) => state.loading,
    getErrorMessage: (state) => state.errorMessage,
    // Wallet getters
    getWalletBalance: (state) => state.walletBalance,
    getWalletLoading: (state) => state.walletLoading,
    getWalletError: (state) => state.walletError,
    getSelectedPaymentMethod: (state) => state.selectedPaymentMethod,
    getSplitPaymentAmount: (state) => state.splitPaymentAmount,
    canPayWithWallet: (state) => (amount) => state.walletBalance >= amount,
    getCardPaymentAmount: (state, getters) => {
      const cartTotal = getters.getCartTotal;
      if (state.selectedPaymentMethod === "wallet") return 0;
      if (state.selectedPaymentMethod === "split") {
        return Math.max(0, cartTotal - state.splitPaymentAmount);
      }
      return cartTotal;
    },
    // Delivery preferences getters
    getDeliveryMethod: (state) => state.deliveryMethod,
    getSelectedDeliveryAddress: (state) => state.selectedDeliveryAddress,
    getSavedAddresses: (state) => state.savedAddresses,
    getAddressesLoading: (state) => state.addressesLoading,
    getDefaultPharmacy: (state) => state.defaultPharmacy,
    // Prescription getters
    getSelectedPrescription: (state) => state.selectedPrescription,
    getSelectedPrescriptionType: (state) => state.selectedPrescriptionType,
    getApprovedPrescriptions: (state) => state.approvedPrescriptions,
    getSpecialistPrescriptions: (state) => state.specialistPrescriptions,
    getPrescriptionsLoading: (state) => state.prescriptionsLoading,
    // Cart has RX items
    getCartHasRxItems: (state) => state.cart.some(item =>
      item.requiresPrescription ||
      item.purchaseType === "PRESCRIPTION_ONLY" ||
      item.purchaseType === "CONTROLLED"
    ),
    // Check if ready for checkout
    getCanProceedToCheckout: (state, getters) => {
      // Must have items in cart
      if (state.cart.length === 0) return false;
      // If delivery, must have address selected
      if (state.deliveryMethod === "delivery" && !state.selectedDeliveryAddress) return false;
      // If cart has RX items, must have prescription selected
      if (getters.getCartHasRxItems && !state.selectedPrescription) return false;
      return true;
    },
  },

  mutations: {
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    SET_DRUGS(state, drugs) {
      state.drugs = drugs;
    },
    SET_OTC_DRUGS(state, drugs) {
      state.otcDrugs = drugs;
    },
    SET_CATEGORY_DRUGS(state, drugs) {
      state.categoryDrugs = drugs;
    },
    SET_CURRENT_DRUG(state, drug) {
      state.currentDrug = drug;
    },
    SET_TOTAL_DRUGS(state, total) {
      state.totalDrugs = total;
    },
    SET_CURRENT_CATEGORY_NAME(state, name) {
      state.currentCategoryName = name;
    },
    SET_PHARMACIES(state, pharmacies) {
      state.pharmacies = pharmacies;
    },
    SET_NEARBY_PHARMACIES(state, pharmacies) {
      state.nearbyPharmacies = pharmacies;
    },
    SET_SELECTED_PHARMACY(state, pharmacy) {
      state.selectedPharmacy = pharmacy;
    },
    SET_CART(state, cart) {
      state.cart = cart;
    },
    SET_CART_VALIDATION(state, validation) {
      state.cartValidation = validation;
    },
    SET_CART_VALIDATING(state, validating) {
      state.cartValidating = validating;
    },
    CLEAR_CART_VALIDATION(state) {
      state.cartValidation = null;
    },
    ADD_TO_CART(state, item) {
      const existingItem = state.cart.find(
        (cartItem) => cartItem.drugId === item.drugId && cartItem.pharmacyId === item.pharmacyId
      );
      if (existingItem) {
        // Calculate new total and enforce max limit
        let newQuantity = existingItem.quantity + item.quantity;
        const maxPerOrder = item.maxQuantityPerOrder || existingItem.maxQuantityPerOrder;
        if (maxPerOrder && maxPerOrder > 0 && newQuantity > maxPerOrder) {
          newQuantity = maxPerOrder;
        }
        existingItem.quantity = newQuantity;
      } else {
        // Enforce max on new items too
        const maxPerOrder = item.maxQuantityPerOrder;
        if (maxPerOrder && maxPerOrder > 0 && item.quantity > maxPerOrder) {
          item.quantity = maxPerOrder;
        }
        state.cart.push(item);
      }
    },
    UPDATE_CART_ITEM(state, { drugId, quantity }) {
      const item = state.cart.find((cartItem) => cartItem.drugId === drugId);
      if (item) {
        // Enforce max limit on updates
        const maxPerOrder = item.maxQuantityPerOrder;
        if (maxPerOrder && maxPerOrder > 0 && quantity > maxPerOrder) {
          item.quantity = maxPerOrder;
        } else {
          item.quantity = quantity;
        }
      }
    },
    REMOVE_FROM_CART(state, drugId) {
      state.cart = state.cart.filter((item) => item.drugId !== drugId);
    },
    CLEAR_CART(state) {
      state.cart = [];
    },
    SET_CURRENT_ORDER(state, order) {
      state.currentOrder = order;
    },
    SET_MY_ORDERS(state, orders) {
      state.myOrders = orders;
    },
    SET_ORDER_DETAILS(state, order) {
      state.orderDetails = order;
    },
    SET_DRUG_CATEGORIES(state, categories) {
      state.drugCategories = categories;
    },
    SET_SEARCH_RESULTS(state, results) {
      state.searchResults = results;
    },
    SET_ERROR_MESSAGE(state, message) {
      state.errorMessage = message;
    },
    // Wallet mutations
    SET_WALLET_BALANCE(state, balance) {
      state.walletBalance = balance;
    },
    SET_WALLET_LOADING(state, loading) {
      state.walletLoading = loading;
    },
    SET_WALLET_ERROR(state, error) {
      state.walletError = error;
    },
    SET_SELECTED_PAYMENT_METHOD(state, method) {
      state.selectedPaymentMethod = method;
    },
    SET_SPLIT_PAYMENT_AMOUNT(state, amount) {
      state.splitPaymentAmount = amount;
    },
    // Delivery preferences mutations
    SET_DELIVERY_METHOD(state, method) {
      state.deliveryMethod = method;
    },
    SET_SELECTED_DELIVERY_ADDRESS(state, address) {
      state.selectedDeliveryAddress = address;
    },
    SET_SAVED_ADDRESSES(state, addresses) {
      state.savedAddresses = addresses;
    },
    SET_ADDRESSES_LOADING(state, loading) {
      state.addressesLoading = loading;
    },
    SET_DEFAULT_PHARMACY(state, pharmacy) {
      state.defaultPharmacy = pharmacy;
    },
    // Prescription mutations
    SET_SELECTED_PRESCRIPTION(state, prescription) {
      state.selectedPrescription = prescription;
    },
    SET_SELECTED_PRESCRIPTION_TYPE(state, type) {
      state.selectedPrescriptionType = type;
    },
    SET_APPROVED_PRESCRIPTIONS(state, prescriptions) {
      state.approvedPrescriptions = prescriptions;
    },
    SET_SPECIALIST_PRESCRIPTIONS(state, prescriptions) {
      state.specialistPrescriptions = prescriptions;
    },
    SET_PRESCRIPTIONS_LOADING(state, loading) {
      state.prescriptionsLoading = loading;
    },
    // Clear checkout state
    CLEAR_CHECKOUT_STATE(state) {
      state.deliveryMethod = "delivery";
      state.selectedDeliveryAddress = null;
      state.selectedPrescription = null;
      state.selectedPrescriptionType = null;
      state.selectedPaymentMethod = "card";
      state.splitPaymentAmount = 0;
    },
  },

  actions: {
    // ============ DRUGS ============

    async fetchOTCDrugs({ commit }, { page = 1, limit = 20, sort, order, category } = {}) {
      try {
        commit("SET_LOADING", true);
        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", limit);
        if (sort) params.append("sort", sort);
        if (order) params.append("order", order);
        if (category) params.append("category", category);

        const response = await axios.get(`pharmacy/drugs/otc?${params.toString()}`);
        if (response.status === 200) {
          const data = response.data.data || response.data.result || response.data;
          commit("SET_OTC_DRUGS", data.drugs || data || []);
          commit("SET_TOTAL_DRUGS", data.total || (data.drugs ? data.drugs.length : 0) || 0);
        }
        return response.data;
      } catch (error) {
        console.error("Error fetching OTC drugs:", error);
        commit("SET_ERROR_MESSAGE", error.response?.data?.message || "Failed to fetch OTC drugs");
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchDrugCategories({ commit }) {
      try {
        const response = await axios.get("pharmacy/drugs/categories");
        if (response.status === 200) {
          const data = response.data.data || response.data.result || response.data;
          commit("SET_DRUG_CATEGORIES", data || []);
        }
        return response.data;
      } catch (error) {
        console.error("Error fetching drug categories:", error);
        throw error;
      }
    },

    async searchDrugs({ commit }, searchParams) {
      try {
        commit("SET_LOADING", true);
        const params = new URLSearchParams();
        if (searchParams.query) params.append("query", searchParams.query);
        if (searchParams.category) params.append("category", searchParams.category);
        if (searchParams.is_otc !== undefined) params.append("is_otc", searchParams.is_otc);
        if (searchParams.page) params.append("page", searchParams.page);
        if (searchParams.limit) params.append("limit", searchParams.limit);

        const response = await axios.get(`pharmacy/drugs/search?${params.toString()}`);
        if (response.status === 200) {
          const data = response.data.data || response.data.result || response.data;
          commit("SET_SEARCH_RESULTS", data.drugs || data || []);
        }
        return response.data;
      } catch (error) {
        console.error("Error searching drugs:", error);
        commit("SET_ERROR_MESSAGE", error.response?.data?.message || "Search failed");
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchDrugById({ commit }, drugId) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.get(`pharmacy/drugs/${drugId}`);
        const data = response.data.data || response.data.result || response.data;
        commit("SET_CURRENT_DRUG", data);
        return data;
      } catch (error) {
        console.error("Error fetching drug:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchDrugDetails({ commit }, drugId) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.get(`pharmacy/drugs/${drugId}`);
        const data = response.data.data || response.data.result || response.data;
        commit("SET_CURRENT_DRUG", data);
        return data;
      } catch (error) {
        console.error("Error fetching drug details:", error);
        commit("SET_CURRENT_DRUG", null);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    /**
     * Fetch drug safety information from FDA
     * Returns side effects, warnings, contraindications, drug interactions
     */
    async fetchDrugSafetyInfo(_, drugId) {
      try {
        const response = await axios.get(`pharmacy/drugs/${drugId}/safety`);
        const data = response.data.data || response.data.result || response.data;
        return data;
      } catch (error) {
        console.error("Error fetching drug safety info:", error);
        // Return null instead of throwing - safety info is optional
        return null;
      }
    },

    /**
     * Fetch similar drugs for a drug
     * Returns drugs with same generic name, category, or manually linked
     */
    async fetchSimilarDrugs(_, { drugId, limit = 8 }) {
      try {
        const response = await axios.get(`pharmacy/drugs/${drugId}/similar?limit=${limit}`);
        const data = response.data.data || response.data.result || response.data;
        return data || [];
      } catch (error) {
        console.error("Error fetching similar drugs:", error);
        // Return empty array instead of throwing - similar drugs is optional
        return [];
      }
    },

    async fetchDrugsByCategory({ commit }, {
      category,
      page = 1,
      limit = 20,
      sort,
      available_only,
      search,
      otc_only,
      prescription_only,
      min_price,
      max_price
    }) {
      try {
        commit("SET_LOADING", true);
        // Reset drugs when fetching page 1
        if (page === 1) {
          commit("SET_CATEGORY_DRUGS", []);
        }

        const params = new URLSearchParams();
        params.append("page", page);
        params.append("limit", limit);
        if (sort) params.append("sort", sort);
        if (available_only) params.append("available_only", "true");
        if (search) params.append("search", search);
        if (otc_only) params.append("otc_only", "true");
        if (prescription_only) params.append("prescription_only", "true");
        if (min_price) params.append("min_price", min_price);
        if (max_price) params.append("max_price", max_price);

        const response = await axios.get(`pharmacy/drugs/category/${category}?${params.toString()}`);
        if (response.status === 200) {
          const data = response.data.data || response.data.result || response.data;
          const drugs = data.drugs || data || [];

          // For page 1, replace drugs. For subsequent pages, append.
          if (page === 1) {
            commit("SET_CATEGORY_DRUGS", drugs);
          } else {
            // Append to existing drugs for load more
            const existingDrugs = this.state.pharmacy.categoryDrugs || [];
            commit("SET_CATEGORY_DRUGS", [...existingDrugs, ...drugs]);
          }

          commit("SET_TOTAL_DRUGS", data.total || (data.drugs ? data.drugs.length : 0) || 0);
          commit("SET_CURRENT_CATEGORY_NAME", data.categoryName || "");
        }
        return response.data;
      } catch (error) {
        console.error("Error fetching drugs by category:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchFeaturedDrugs({ commit }) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.get("pharmacy/drugs/featured");
        if (response.status === 200) {
          const data = response.data.data || response.data.result || response.data;
          return data;
        }
      } catch (error) {
        console.error("Error fetching featured drugs:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    // ============ PHARMACIES ============

    async fetchNearbyPharmacies({ commit }, { latitude, longitude, radius = 10 }) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.get(
          `pharmacy/pharmacies/nearby?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
        );
        if (response.status === 200) {
          const data = response.data.data || response.data.result || response.data;
          commit("SET_NEARBY_PHARMACIES", data);
        }
        return response.data;
      } catch (error) {
        console.error("Error fetching nearby pharmacies:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchAcceptingPharmacies({ commit }, { page = 1, limit = 20 } = {}) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.get(
          `pharmacy/pharmacies/accepting-orders?page=${page}&limit=${limit}`
        );
        if (response.status === 200) {
          const data = response.data.data || response.data.result || response.data;
          // Transform pharmacy data to include needed display fields
          const pharmacies = (data.pharmacies || data || []).map((pharmacy) => ({
            ...pharmacy,
            address: pharmacy.address
              ? `${pharmacy.address.street}, ${pharmacy.address.city}, ${pharmacy.address.state}`
              : "",
            is_open: pharmacy.is_online && pharmacy.is_active && !pharmacy.is_suspended,
            rating: pharmacy.average_rating || 0,
            review_count: pharmacy.total_ratings || 0,
          }));
          commit("SET_NEARBY_PHARMACIES", pharmacies);
        }
        return response.data;
      } catch (error) {
        console.error("Error fetching accepting pharmacies:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async searchPharmacies({ commit }, searchParams) {
      try {
        commit("SET_LOADING", true);
        const params = new URLSearchParams();
        if (searchParams.query) params.append("query", searchParams.query);
        if (searchParams.city) params.append("city", searchParams.city);
        if (searchParams.state) params.append("state", searchParams.state);
        if (searchParams.offers_delivery) params.append("offers_delivery", searchParams.offers_delivery);
        if (searchParams.page) params.append("page", searchParams.page);
        if (searchParams.limit) params.append("limit", searchParams.limit);

        const response = await axios.get(`pharmacy/pharmacies/search?${params.toString()}`);
        if (response.status === 200) {
          const data = response.data.data || response.data.result || response.data;
          commit("SET_PHARMACIES", data.pharmacies || data || []);
        }
        return response.data;
      } catch (error) {
        console.error("Error searching pharmacies:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchPharmacyById({ commit }, pharmacyId) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.get(`pharmacy/pharmacies/${pharmacyId}`);
        if (response.status === 200) {
          const data = response.data.data || response.data.result || response.data;
          commit("SET_SELECTED_PHARMACY", data);
        }
        return response.data.data || response.data.result;
      } catch (error) {
        console.error("Error fetching pharmacy:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    setSelectedPharmacy({ commit }, pharmacy) {
      commit("SET_SELECTED_PHARMACY", pharmacy);
      // Persist to localStorage
      if (pharmacy) {
        localStorage.setItem("selectedPharmacy", JSON.stringify(pharmacy));
      } else {
        localStorage.removeItem("selectedPharmacy");
      }
    },

    loadSelectedPharmacyFromStorage({ commit }) {
      const pharmacy = JSON.parse(localStorage.getItem("selectedPharmacy") || "null");
      if (pharmacy) {
        commit("SET_SELECTED_PHARMACY", pharmacy);
      }
    },

    async fetchPharmacyInventory({ commit }, { pharmacyId, drugId }) {
      try {
        const response = await axios.get(`pharmacy/inventory/available/${pharmacyId}/${drugId}`);
        return response.data.data || response.data.result;
      } catch (error) {
        console.error("Error fetching inventory:", error);
        throw error;
      }
    },

    // ============ CART ============

    addToCart({ commit }, item) {
      // Validate item has required drugId
      if (!item.drugId) {
        console.error("Cannot add item to cart without drugId:", item);
        return;
      }
      commit("ADD_TO_CART", item);
      // Persist to localStorage with max limit enforcement
      const cart = JSON.parse(localStorage.getItem("pharmacyCart") || "[]");
      const existingIndex = cart.findIndex(
        (cartItem) => cartItem.drugId === item.drugId && cartItem.pharmacyId === item.pharmacyId
      );
      if (existingIndex > -1) {
        let newQuantity = cart[existingIndex].quantity + item.quantity;
        const maxPerOrder = item.maxQuantityPerOrder || cart[existingIndex].maxQuantityPerOrder;
        if (maxPerOrder && maxPerOrder > 0 && newQuantity > maxPerOrder) {
          newQuantity = maxPerOrder;
        }
        cart[existingIndex].quantity = newQuantity;
      } else {
        // Enforce max on new items
        const maxPerOrder = item.maxQuantityPerOrder;
        if (maxPerOrder && maxPerOrder > 0 && item.quantity > maxPerOrder) {
          item.quantity = maxPerOrder;
        }
        cart.push(item);
      }
      localStorage.setItem("pharmacyCart", JSON.stringify(cart));
    },

    updateCartItem({ commit }, { drugId, quantity }) {
      commit("UPDATE_CART_ITEM", { drugId, quantity });
      const cart = JSON.parse(localStorage.getItem("pharmacyCart") || "[]");
      const item = cart.find((cartItem) => cartItem.drugId === drugId);
      if (item) {
        // Enforce max limit
        const maxPerOrder = item.maxQuantityPerOrder;
        if (maxPerOrder && maxPerOrder > 0 && quantity > maxPerOrder) {
          item.quantity = maxPerOrder;
        } else {
          item.quantity = quantity;
        }
        localStorage.setItem("pharmacyCart", JSON.stringify(cart));
      }
    },

    removeFromCart({ commit }, drugId) {
      commit("REMOVE_FROM_CART", drugId);
      const cart = JSON.parse(localStorage.getItem("pharmacyCart") || "[]");
      const filtered = cart.filter((item) => item.drugId !== drugId);
      localStorage.setItem("pharmacyCart", JSON.stringify(filtered));
    },

    clearCart({ commit }) {
      commit("CLEAR_CART");
      commit("SET_SELECTED_PHARMACY", null);
      localStorage.removeItem("pharmacyCart");
      localStorage.removeItem("selectedPharmacy");
    },

    loadCartFromStorage({ commit }) {
      const cart = JSON.parse(localStorage.getItem("pharmacyCart") || "[]");
      // Filter out any invalid items that don't have drugId
      const validCart = cart.filter(item => {
        if (!item.drugId) {
          console.warn("Removing invalid cart item without drugId:", item);
          return false;
        }
        return true;
      });
      // Update localStorage if we removed invalid items
      if (validCart.length !== cart.length) {
        localStorage.setItem("pharmacyCart", JSON.stringify(validCart));
      }
      commit("SET_CART", validCart);
    },

    async validateCart({ commit, state }, patientAge = null) {
      try {
        // Don't validate empty cart
        if (!state.cart || state.cart.length === 0) {
          commit("CLEAR_CART_VALIDATION");
          return { valid: true, issues: [], warnings: [], summary: { totalItems: 0 } };
        }

        commit("SET_CART_VALIDATING", true);

        const items = state.cart.map((item) => ({
          drugId: item.drugId,
          quantity: item.quantity,
        }));

        const payload = { items };
        if (patientAge !== null && patientAge !== undefined) {
          payload.patientAge = patientAge;
        }

        const response = await axios.post("pharmacy-orders/validate-cart", payload);

        if (response.status === 200 || response.status === 201) {
          const validation = response.data.data || response.data.result;
          commit("SET_CART_VALIDATION", validation);
          return validation;
        }
      } catch (error) {
        console.error("Error validating cart:", error);
        // Don't block checkout on validation error, just log it
        commit("SET_ERROR_MESSAGE", error.response?.data?.message || "Cart validation failed");
        throw error;
      } finally {
        commit("SET_CART_VALIDATING", false);
      }
    },

    async getRemainingAllowance({ commit }, drugId) {
      try {
        const response = await axios.get(`pharmacy-orders/allowance/${drugId}`);
        return response.data.data || response.data.result;
      } catch (error) {
        console.error("Error fetching remaining allowance:", error);
        throw error;
      }
    },

    async getPurchaseHistory({ commit }, days = 30) {
      try {
        const response = await axios.get(`pharmacy-orders/purchase-history?days=${days}`);
        return response.data.data || response.data.result;
      } catch (error) {
        console.error("Error fetching purchase history:", error);
        throw error;
      }
    },

    clearCartValidation({ commit }) {
      commit("CLEAR_CART_VALIDATION");
    },

    // ============ ORDERS ============

    async createOTCOrder({ commit, state }, orderData) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.post("pharmacy-orders/otc", {
          pharmacy: orderData.pharmacy || orderData.pharmacyId,
          items: orderData.items.map((item) => ({
            drug: item.drug || item.drugId,
            quantity: item.quantity,
          })),
          delivery_method: orderData.delivery_method || orderData.deliveryMethod,
          delivery_address: orderData.delivery_address || orderData.deliveryAddress,
          patient_notes: orderData.patient_notes || orderData.notes || "",
          discount_code: orderData.discount_code || orderData.discountCode || "",
        });
        if (response.status === 200 || response.status === 201) {
          const data = response.data.data || response.data.result;
          commit("SET_CURRENT_ORDER", data);
          commit("CLEAR_CART");
          localStorage.removeItem("pharmacyCart");
        }
        return response.data;
      } catch (error) {
        console.error("Error creating order:", error);
        const data = error.response?.data;
        let errorMessage = "Failed to create order";
        if (data) {
          if (typeof data.errorMessage === 'string') {
            errorMessage = data.errorMessage;
          } else if (typeof data.message === 'string') {
            errorMessage = data.message;
          }
        }
        commit("SET_ERROR_MESSAGE", errorMessage);
        error.extractedMessage = errorMessage;
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async createPrescriptionOrder({ commit }, orderData) {
      try {
        commit("SET_LOADING", true);
        const payload = {
          pharmacy: orderData.pharmacy || orderData.pharmacyId,
          items: orderData.items.map((item) => ({
            drug: item.drug || item.drugId,
            quantity: item.quantity,
            dosage_instructions: item.dosage_instructions || item.dosageInstructions || "",
            duration_days: item.duration_days || item.durationDays,
          })),
          delivery_method: orderData.delivery_method || orderData.deliveryMethod,
          delivery_address: orderData.delivery_address || orderData.deliveryAddress,
          patient_notes: orderData.patient_notes || orderData.notes || "",
          special_instructions: orderData.special_instructions || orderData.specialInstructions || "",
        };

        // Add either prescription (uploaded) or specialist_prescription based on what's provided
        if (orderData.specialist_prescription) {
          payload.specialist_prescription = orderData.specialist_prescription;
        } else if (orderData.prescription || orderData.prescriptionId) {
          payload.prescription = orderData.prescription || orderData.prescriptionId;
        }

        const response = await axios.post("pharmacy-orders/prescription", payload);
        if (response.status === 200 || response.status === 201) {
          const data = response.data.data || response.data.result;
          commit("SET_CURRENT_ORDER", data);
        }
        return response.data;
      } catch (error) {
        console.error("Error creating prescription order:", error);
        console.error("Error response data:", error.response?.data);

        // Backend can return error message in different formats
        const data = error.response?.data;
        let errorMessage = "Failed to create order";
        if (data) {
          // Check errorMessage first (our custom format), then message (NestJS default)
          if (typeof data.errorMessage === 'string') {
            errorMessage = data.errorMessage;
          } else if (typeof data.message === 'string') {
            errorMessage = data.message;
          } else if (Array.isArray(data.message)) {
            errorMessage = data.message.join(', ');
          } else if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.error) {
            errorMessage = data.error;
          }
        }

        commit("SET_ERROR_MESSAGE", errorMessage);
        error.extractedMessage = errorMessage;
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchMyOrders({ commit }, { status, page = 1, limit = 20 } = {}) {
      try {
        commit("SET_LOADING", true);
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        // Ensure page is at least 1 to avoid 422 error
        params.append("page", Math.max(1, parseInt(page) || 1).toString());
        params.append("limit", limit.toString());

        // Fetch both pharmacy orders and specialist prescriptions in parallel
        const results = await Promise.allSettled([
          axios.get(`pharmacy-orders/my-orders?${params.toString()}`),
          axios.get("patient/prescriptions?limit=50"), // Specialist prescriptions for patient
        ]);

        // Process pharmacy orders
        const ordersResult = results[0];
        let pharmacyOrders = [];
        if (ordersResult.status === 'fulfilled' && ordersResult.value.status === 200) {
          const data = ordersResult.value.data.data || ordersResult.value.data.result || ordersResult.value.data;
          pharmacyOrders = (data.orders || data || []).map(order => ({
            ...order,
            order_type: 'pharmacy_order',
          }));
        }

        // Process specialist prescriptions - transform to order-like format
        const prescriptionsResult = results[1];
        let specialistPrescriptions = [];
        if (prescriptionsResult.status === 'fulfilled') {
          const data = prescriptionsResult.value.data.data || prescriptionsResult.value.data;
          const prescriptionsArray = data?.docs || data || [];

          // Map prescription statuses to order statuses
          const statusMap = {
            draft: 'PENDING',
            pending_acceptance: 'PENDING',
            accepted: 'CONFIRMED',
            pending_payment: 'PENDING',
            paid: 'PROCESSING',
            processing: 'PROCESSING',
            dispensed: 'READY_FOR_PICKUP',
            shipped: 'OUT_FOR_DELIVERY',
            delivered: 'DELIVERED',
            completed: 'COMPLETED',
            cancelled: 'CANCELLED',
            expired: 'CANCELLED',
          };

          specialistPrescriptions = prescriptionsArray
            .filter(p => p.status !== 'draft') // Don't show draft prescriptions
            .map(prescription => ({
              _id: prescription._id,
              order_number: prescription.prescription_number,
              created_at: prescription.created_at || prescription.createdAt,
              status: statusMap[prescription.status?.toLowerCase()] || 'PENDING',
              original_status: prescription.status, // Keep original for reference
              items: (prescription.items || []).map(item => ({
                drug_name: item.drug_name,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: item.total_price,
              })),
              total_amount: prescription.total_amount || prescription.subtotal,
              pharmacy: { name: 'Rapid Capsules Pharmacy' }, // Specialist prescriptions use platform pharmacy
              order_type: 'specialist_prescription',
              specialist: prescription.specialist,
              prescribed_by: prescription.prescribed_by,
              payment_status: prescription.payment_status,
            }));
        }

        // Combine and sort by date (newest first)
        const allOrders = [...pharmacyOrders, ...specialistPrescriptions];
        allOrders.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0);
          const dateB = new Date(b.created_at || b.createdAt || 0);
          return dateB - dateA;
        });

        commit("SET_MY_ORDERS", allOrders);
        return { data: allOrders };
      } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchOrderById({ commit }, orderId) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.get(`pharmacy-orders/${orderId}`);
        if (response.status === 200) {
          const data = response.data.data || response.data.result;
          commit("SET_CURRENT_ORDER", data);
          commit("SET_ORDER_DETAILS", data);
        }
        return response.data.data || response.data.result;
      } catch (error) {
        console.error("Error fetching order:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async fetchOrderDetails({ commit }, orderId) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.get(`pharmacy-orders/${orderId}`);
        if (response.status === 200) {
          const data = response.data.data || response.data.result;
          commit("SET_CURRENT_ORDER", data);
        }
        return response.data.data || response.data.result;
      } catch (error) {
        console.error("Error fetching order details:", error);
        commit("SET_CURRENT_ORDER", null);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    // Get presigned URL for PDF download
    async getOrderPdfUrl(_, orderId) {
      try {
        const response = await axios.get(`pharmacy-orders/${orderId}/pdf`);
        if (response.status === 200) {
          const data = response.data.data || response.data.result;
          return data.presigned_url;
        }
        return null;
      } catch (error) {
        console.error("Error fetching PDF URL:", error);
        throw error;
      }
    },

    async fetchOrderByNumber({ commit }, orderNumber) {
      try {
        commit("SET_LOADING", true);

        // First try pharmacy orders
        try {
          const response = await axios.get(`pharmacy-orders/by-number/${orderNumber}`);
          if (response.status === 200) {
            const data = response.data.data || response.data.result;
            if (data) {
              data.order_type = 'pharmacy_order';
              commit("SET_CURRENT_ORDER", data);
              return data;
            }
          }
        } catch (pharmacyError) {
          // If pharmacy order not found, try specialist prescriptions
          console.log("Pharmacy order not found, trying specialist prescriptions...");
        }

        // Try specialist prescriptions by prescription number
        try {
          const response = await axios.get(`patient/prescriptions/by-number/${orderNumber}`);
          if (response.status === 200) {
            const prescription = response.data.data || response.data.result;
            if (prescription) {
              // Transform to order-like format for display
              const statusMap = {
                draft: 'PENDING',
                pending_acceptance: 'PENDING',
                accepted: 'CONFIRMED',
                pending_payment: 'PENDING',
                paid: 'PROCESSING',
                processing: 'PROCESSING',
                dispensed: 'READY_FOR_PICKUP',
                shipped: 'OUT_FOR_DELIVERY',
                delivered: 'DELIVERED',
                completed: 'COMPLETED',
                cancelled: 'CANCELLED',
                expired: 'CANCELLED',
              };

              const orderData = {
                _id: prescription._id,
                order_number: prescription.prescription_number,
                created_at: prescription.created_at || prescription.createdAt,
                status: statusMap[prescription.status?.toLowerCase()] || 'PENDING',
                original_status: prescription.status,
                items: (prescription.items || []).map(item => ({
                  drug_name: item.drug_name,
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  total_price: item.total_price,
                })),
                total_amount: prescription.total_amount || prescription.subtotal,
                pharmacy: { name: 'Rapid Capsules Pharmacy' },
                order_type: 'specialist_prescription',
                specialist: prescription.specialist,
                prescribed_by: prescription.prescribed_by,
                payment_status: prescription.payment_status,
                delivery_address: prescription.delivery_address,
                delivery_method: prescription.delivery_method || 'DELIVERY',
                status_history: prescription.status_history || [],
              };

              commit("SET_CURRENT_ORDER", orderData);
              return orderData;
            }
          }
        } catch (prescriptionError) {
          console.error("Specialist prescription not found either:", prescriptionError);
        }

        // Neither found
        commit("SET_CURRENT_ORDER", null);
        return null;
      } catch (error) {
        console.error("Error fetching order by number:", error);
        commit("SET_CURRENT_ORDER", null);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async trackOrder({ commit }, orderNumber) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.get(`pharmacy-orders/track/${orderNumber}`);
        if (response.status === 200) {
          const data = response.data.data || response.data.result;
          commit("SET_CURRENT_ORDER", data);
          commit("SET_ORDER_DETAILS", data);
        }
        return response.data.data || response.data.result;
      } catch (error) {
        console.error("Error tracking order:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async cancelOrder({ commit }, { orderId, reason }) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.patch(`pharmacy-orders/${orderId}/cancel`, {
          cancellation_reason: reason,
        });
        if (response.status === 200) {
          const data = response.data.data || response.data.result;
          commit("SET_ORDER_DETAILS", data);
        }
        return response.data;
      } catch (error) {
        console.error("Error cancelling order:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    async rateOrder({ commit }, { orderId, rating, review }) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.patch(`pharmacy-orders/${orderId}/rate`, {
          rating,
          review,
        });
        if (response.status === 200) {
          const data = response.data.data || response.data.result;
          commit("SET_ORDER_DETAILS", data);
        }
        return response.data;
      } catch (error) {
        console.error("Error rating order:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    // ============ PAYMENT ============

    async processOrderPayment({ commit }, { orderId, paymentReference, paymentMethod, amount }) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.patch(`pharmacy-orders/${orderId}/payment`, {
          payment_reference: paymentReference,
          payment_method: paymentMethod,
          amount,
        });
        if (response.status === 200) {
          const data = response.data.data || response.data.result;
          commit("SET_CURRENT_ORDER", data);
        }
        return response.data;
      } catch (error) {
        console.error("Error processing payment:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    // ============ DRUG INTERACTIONS ============

    async checkDrugInteractions({ commit }, drugIds) {
      try {
        const response = await axios.post("pharmacy/drugs/check-interactions", { drugIds });
        return response.data.data || response.data.result;
      } catch (error) {
        console.error("Error checking drug interactions:", error);
        throw error;
      }
    },

    // ============ WALLET ============

    async fetchWalletBalance({ commit }) {
      try {
        commit("SET_WALLET_LOADING", true);
        commit("SET_WALLET_ERROR", null);
        const response = await axios.get("wallets/balance");
        if (response.status === 200) {
          const data = response.data.data || response.data.result || response.data;
          const balance = data?.currentBalance || data?.balance || 0;
          commit("SET_WALLET_BALANCE", balance);
          return balance;
        }
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
        // Don't block checkout on wallet error - user can still pay with card
        commit("SET_WALLET_ERROR", error.response?.data?.message || "Failed to fetch wallet balance");
        commit("SET_WALLET_BALANCE", 0);
        return 0;
      } finally {
        commit("SET_WALLET_LOADING", false);
      }
    },

    setPaymentMethod({ commit }, method) {
      commit("SET_SELECTED_PAYMENT_METHOD", method);
    },

    setSplitPaymentAmount({ commit, state }, amount) {
      // Ensure amount doesn't exceed wallet balance
      const maxAmount = Math.min(amount, state.walletBalance);
      commit("SET_SPLIT_PAYMENT_AMOUNT", maxAmount);
    },

    async payWithWallet({ commit }, { orderId, amount }) {
      try {
        commit("SET_LOADING", true);
        const response = await axios.post(`pharmacy-orders/${orderId}/pay-with-wallet`, {
          amount,
        });
        if (response.status === 200 || response.status === 201) {
          // Update wallet balance after payment
          const data = response.data.data || response.data.result;
          commit("SET_WALLET_BALANCE", data?.newBalance || 0);
          return response.data;
        }
      } catch (error) {
        console.error("Error paying with wallet:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    resetPaymentMethod({ commit }) {
      commit("SET_SELECTED_PAYMENT_METHOD", "card");
      commit("SET_SPLIT_PAYMENT_AMOUNT", 0);
    },

    // ============ DELIVERY PREFERENCES ============

    setDeliveryMethod({ commit }, method) {
      commit("SET_DELIVERY_METHOD", method);
      // Persist to localStorage
      localStorage.setItem("pharmacyDeliveryMethod", method);
    },

    setSelectedDeliveryAddress({ commit }, address) {
      commit("SET_SELECTED_DELIVERY_ADDRESS", address);
      // Persist to localStorage
      if (address) {
        localStorage.setItem("pharmacyDeliveryAddress", JSON.stringify(address));
      } else {
        localStorage.removeItem("pharmacyDeliveryAddress");
      }
    },

    loadDeliveryPreferencesFromStorage({ commit }) {
      const method = localStorage.getItem("pharmacyDeliveryMethod") || "delivery";
      const address = JSON.parse(localStorage.getItem("pharmacyDeliveryAddress") || "null");
      commit("SET_DELIVERY_METHOD", method);
      if (address) {
        commit("SET_SELECTED_DELIVERY_ADDRESS", address);
      }
    },

    async fetchSavedAddresses({ commit, rootGetters }) {
      try {
        commit("SET_ADDRESSES_LOADING", true);
        const response = await axios.get("pharmacy-orders/addresses/my");
        // Backend returns { statusCode: 200, message: '...', data: { addresses: [...] } }
        if (response.status === 200 || response.data.statusCode === 200) {
          const data = response.data.data || {};
          // Backend returns: { addresses: [...], profile_address: {...} }
          // The 'addresses' array already includes the profile address as first item
          const addresses = data.addresses || [];

          commit("SET_SAVED_ADDRESSES", addresses);

          // Auto-select default address if no address is selected
          const currentSelected = JSON.parse(localStorage.getItem("pharmacyDeliveryAddress") || "null");
          if (!currentSelected && addresses.length > 0) {
            const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
            commit("SET_SELECTED_DELIVERY_ADDRESS", defaultAddr);
            localStorage.setItem("pharmacyDeliveryAddress", JSON.stringify(defaultAddr));
          }

          return addresses;
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        commit("SET_SAVED_ADDRESSES", []);
        return [];
      } finally {
        commit("SET_ADDRESSES_LOADING", false);
      }
    },

    async addDeliveryAddress({ commit, dispatch }, addressData) {
      try {
        const response = await axios.post("pharmacy-orders/addresses/my", addressData);
        if (response.status === 200 || response.status === 201 || response.data.statusCode === 200) {
          // Refresh addresses
          await dispatch("fetchSavedAddresses");
          return response.data.data;
        }
      } catch (error) {
        console.error("Error adding address:", error);
        throw error;
      }
    },

    // ============ DEFAULT PHARMACY ============

    async fetchDefaultPharmacy({ commit }) {
      try {
        // Fetch the platform default pharmacy (first verified, featured pharmacy)
        const response = await axios.get("pharmacy/pharmacies/accepting-orders?page=1&limit=1");
        if (response.status === 200) {
          const data = response.data.data || response.data.result || response.data;
          const pharmacies = data.pharmacies || data || [];
          if (pharmacies.length > 0) {
            // Find featured pharmacy or use first one
            const defaultPharmacy = pharmacies.find(p => p.is_featured) || pharmacies[0];
            commit("SET_DEFAULT_PHARMACY", defaultPharmacy);
            // Also set as selected pharmacy
            commit("SET_SELECTED_PHARMACY", defaultPharmacy);
            return defaultPharmacy;
          }
        }
        return null;
      } catch (error) {
        console.error("Error fetching default pharmacy:", error);
        return null;
      }
    },

    // ============ PRESCRIPTIONS ============

    setSelectedPrescription({ commit }, { prescription, type = 'uploaded' } = {}) {
      commit("SET_SELECTED_PRESCRIPTION", prescription);
      commit("SET_SELECTED_PRESCRIPTION_TYPE", prescription ? type : null);
      // Persist to localStorage
      if (prescription) {
        localStorage.setItem("pharmacySelectedPrescription", JSON.stringify(prescription));
        localStorage.setItem("pharmacySelectedPrescriptionType", type);
      } else {
        localStorage.removeItem("pharmacySelectedPrescription");
        localStorage.removeItem("pharmacySelectedPrescriptionType");
      }
    },

    loadSelectedPrescriptionFromStorage({ commit }) {
      const prescription = JSON.parse(localStorage.getItem("pharmacySelectedPrescription") || "null");
      const type = localStorage.getItem("pharmacySelectedPrescriptionType") || 'uploaded';
      if (prescription) {
        commit("SET_SELECTED_PRESCRIPTION", prescription);
        commit("SET_SELECTED_PRESCRIPTION_TYPE", type);
      }
    },

    async fetchApprovedPrescriptions({ commit }) {
      try {
        commit("SET_PRESCRIPTIONS_LOADING", true);
        const response = await axios.get("pharmacy/prescriptions/approved");
        // Backend returns { message: 'Success', result: [...] }
        const prescriptions = response.data.result || response.data.data || [];
        commit("SET_APPROVED_PRESCRIPTIONS", prescriptions);
        return prescriptions;
      } catch (error) {
        console.error("Error fetching approved prescriptions:", error);
        commit("SET_APPROVED_PRESCRIPTIONS", []);
        return [];
      } finally {
        commit("SET_PRESCRIPTIONS_LOADING", false);
      }
    },

    // Add approved prescription medications to cart
    async addPrescriptionMedicationsToCart({ commit, dispatch }, { prescriptionId, medications }) {
      try {
        commit("SET_LOADING", true);

        // For each medication with a matched drug, add to cart
        const addedItems = [];
        for (const med of medications) {
          if (med.matched_drug_id) {
            // Fetch drug details to get price and other info
            try {
              const response = await axios.get(`pharmacy/drugs/${med.matched_drug_id}`);
              const drug = response.data.data || response.data.result || response.data;

              if (drug) {
                // Parse quantity from string or number
                let quantity = 1;
                const quantityStr = String(med.quantity || '1');
                const quantityMatch = quantityStr.match(/\d+/);
                if (quantityMatch) {
                  quantity = parseInt(quantityMatch[0], 10);
                }

                const cartItem = {
                  drugId: drug._id,
                  pharmacyId: null, // Will use default pharmacy
                  name: drug.name,
                  genericName: drug.generic_name,
                  strength: drug.strength,
                  dosageForm: drug.dosage_form,
                  manufacturer: drug.manufacturer,
                  price: drug.selling_price || drug.price || 0,
                  quantity: quantity,
                  imageUrl: drug.image_url || drug.primary_image || null,
                  requiresPrescription: true,
                  purchaseType: drug.purchase_type || 'PRESCRIPTION_ONLY',
                  maxQuantityPerOrder: drug.max_quantity_per_order || 100,
                  prescriptionId: prescriptionId,
                  prescriptionMedicationName: med.prescription_medication_name,
                };

                commit("ADD_TO_CART", cartItem);
                addedItems.push(cartItem);

                // Update localStorage
                const cart = JSON.parse(localStorage.getItem("pharmacyCart") || "[]");
                const existingIndex = cart.findIndex(
                  (item) => item.drugId === cartItem.drugId
                );
                if (existingIndex > -1) {
                  cart[existingIndex].quantity = Math.min(
                    cart[existingIndex].quantity + quantity,
                    cartItem.maxQuantityPerOrder
                  );
                } else {
                  cart.push(cartItem);
                }
                localStorage.setItem("pharmacyCart", JSON.stringify(cart));
              }
            } catch (drugError) {
              console.error(`Error fetching drug ${med.matched_drug_id}:`, drugError);
            }
          }
        }

        // Set the prescription as selected for checkout
        // Include verified_medications so the cart coverage check works
        dispatch("setSelectedPrescription", {
          prescription: {
            _id: prescriptionId,
            verified_medications: medications.map(med => ({
              ...med,
              is_valid: true, // Already validated if we're adding to cart
            })),
          },
          type: 'uploaded',
        });

        return { success: true, addedItems };
      } catch (error) {
        console.error("Error adding prescription medications to cart:", error);
        throw error;
      } finally {
        commit("SET_LOADING", false);
      }
    },

    // Fetch specialist prescriptions that can be used for pharmacy orders
    async fetchSpecialistPrescriptionsForPharmacy({ commit, state }) {
      try {
        commit("SET_PRESCRIPTIONS_LOADING", true);
        // Get drug IDs from cart RX items to filter prescriptions
        const rxItems = state.cart.filter(item =>
          item.requiresPrescription ||
          item.purchaseType === "PRESCRIPTION_ONLY" ||
          item.purchaseType === "CONTROLLED"
        );
        const drugIds = rxItems.map(item => item.drugId).filter(Boolean);

        const params = drugIds.length > 0 ? { drug_ids: drugIds.join(",") } : {};
        const response = await axios.get("patient/prescriptions/for-pharmacy", { params });

        // Backend returns { data: { prescriptions: [...], total: N } }
        const data = response.data.data || response.data.result || response.data || {};
        const prescriptions = data.prescriptions || [];
        commit("SET_SPECIALIST_PRESCRIPTIONS", prescriptions);
        return prescriptions;
      } catch (error) {
        console.error("Error fetching specialist prescriptions for pharmacy:", error);
        commit("SET_SPECIALIST_PRESCRIPTIONS", []);
        return [];
      } finally {
        commit("SET_PRESCRIPTIONS_LOADING", false);
      }
    },

    // ============ CHECKOUT STATE ============

    clearCheckoutState({ commit }) {
      commit("CLEAR_CHECKOUT_STATE");
      localStorage.removeItem("pharmacyDeliveryMethod");
      localStorage.removeItem("pharmacyDeliveryAddress");
      localStorage.removeItem("pharmacySelectedPrescription");
      localStorage.removeItem("pharmacySelectedPrescriptionType");
    },

    // Refresh cart item images - always fetch fresh presigned URLs
    async refreshCartImages({ commit, state }) {
      const cart = state.cart;

      if (cart.length === 0) return;

      // Fetch fresh image URLs for all cart items (presigned URLs expire)
      const updatedItems = await Promise.all(
        cart.map(async (item) => {
          try {
            const response = await axios.get(`pharmacy/drugs/${item.drugId}`);
            const drug = response.data.data || response.data.result || response.data;
            return {
              ...item,
              imageUrl: drug.image_url || drug.primary_image || null,
            };
          } catch (error) {
            console.warn(`Failed to fetch image for drug ${item.drugId}:`, error.message);
            return item;
          }
        })
      );

      // Update cart with fresh images
      commit("SET_CART", updatedItems);
      localStorage.setItem("pharmacyCart", JSON.stringify(updatedItems));
    },

    // Initialize checkout - call this when cart page loads
    async initializeCheckout({ dispatch, commit }) {
      // Load persisted preferences
      dispatch("loadCartFromStorage");
      dispatch("loadDeliveryPreferencesFromStorage");
      dispatch("loadSelectedPrescriptionFromStorage");

      // Refresh cart item images for items missing imageUrl
      await dispatch("refreshCartImages");

      // Fetch default pharmacy if not already set
      await dispatch("fetchDefaultPharmacy");

      // Fetch saved addresses
      await dispatch("fetchSavedAddresses");

      // Fetch wallet balance
      try {
        await dispatch("fetchWalletBalance");
      } catch (e) {
        console.log("Could not fetch wallet balance");
      }
    },
  },
};
