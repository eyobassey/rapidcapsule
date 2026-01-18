<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="My Orders"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="orders-page">
        <!-- Tabs -->
        <div class="orders-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="['tab', { active: activeTab === tab.value }]"
            @click="setActiveTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && filteredOrders.length === 0" class="empty-state">
          <RCIcon name="package" />
          <h3>No orders found</h3>
          <p>{{ emptyMessage }}</p>
          <rc-button
            type="primary"
            label="Browse Pharmacy"
            @click="$router.push('/app/patient/pharmacy')"
          />
        </div>

        <!-- Orders List -->
        <div v-else-if="!loading" class="orders-list">
          <OrderCard
            v-for="order in paginatedOrders"
            :key="order._id"
            :order="order"
            @view-details="viewOrderDetails"
            @track="trackOrder"
          />

          <!-- Pagination -->
          <div v-if="filteredOrders.length > 0" class="pagination-section">
            <div class="pagination-info">
              Showing {{ showingFrom }} - {{ showingTo }} of {{ filteredOrders.length }} orders
            </div>
            <div class="pagination-controls" v-if="totalPages > 1">
              <button
                class="pagination-btn"
                :disabled="currentPage === 1"
                @click="goToPage(1)"
              >
                First
              </button>
              <button
                class="pagination-btn"
                :disabled="currentPage === 1"
                @click="previousPage"
              >
                ← Previous
              </button>
              <div class="page-numbers">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  :class="['page-btn', { active: page === currentPage }]"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>
              </div>
              <button
                class="pagination-btn"
                :disabled="currentPage === totalPages"
                @click="nextPage"
              >
                Next →
              </button>
              <button
                class="pagination-btn"
                :disabled="currentPage === totalPages"
                @click="goToPage(totalPages)"
              >
                Last
              </button>
            </div>
          </div>
        </div>

        <!-- Loader -->
        <div class="loader-container" v-if="loading">
          <Loader :useOverlay="false" :rounded="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import OrderCard from "./components/OrderCard.vue";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";

export default {
  name: "MyOrders",
  components: {
    TopBar,
    RcButton,
    Loader,
    RCIcon,
    OrderCard,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const activeTab = ref("all");
    const currentPage = ref(1);
    const itemsPerPage = 10;

    const tabs = [
      { label: "All", value: "all" },
      { label: "Active", value: "active" },
      { label: "Completed", value: "completed" },
      { label: "Cancelled", value: "cancelled" },
    ];

    const {
      "pharmacy/fetchMyOrders": fetchMyOrders,
    } = useMapActions();

    const {
      "pharmacy/getMyOrders": myOrders,
      "pharmacy/getLoading": isLoading,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);

    const filteredOrders = computed(() => {
      const orders = myOrders.value || [];
      if (activeTab.value === "all") return orders;

      const statusMap = {
        active: ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"],
        completed: ["DELIVERED", "COMPLETED"],
        cancelled: ["CANCELLED", "REFUNDED"],
      };

      return orders.filter((order) =>
        statusMap[activeTab.value]?.includes(order.status)
      );
    });

    // Pagination computed properties
    const totalPages = computed(() => {
      return Math.ceil(filteredOrders.value.length / itemsPerPage);
    });

    const paginatedOrders = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredOrders.value.slice(start, end);
    });

    const showingFrom = computed(() => {
      if (filteredOrders.value.length === 0) return 0;
      return (currentPage.value - 1) * itemsPerPage + 1;
    });

    const showingTo = computed(() => {
      const end = currentPage.value * itemsPerPage;
      return Math.min(end, filteredOrders.value.length);
    });

    const visiblePages = computed(() => {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages.value, start + maxVisible - 1);

      // Adjust start if we're near the end
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    });

    const emptyMessage = computed(() => {
      const messages = {
        all: "You haven't placed any orders yet",
        active: "You don't have any active orders",
        completed: "You don't have any completed orders",
        cancelled: "You don't have any cancelled orders",
      };
      return messages[activeTab.value];
    });

    // Pagination methods
    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        // Scroll to top of results
        nextTick(() => {
          const ordersPage = document.querySelector('.orders-page');
          if (ordersPage) {
            ordersPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
    };

    const nextPage = () => {
      goToPage(currentPage.value + 1);
    };

    const previousPage = () => {
      goToPage(currentPage.value - 1);
    };

    const setActiveTab = (tab) => {
      activeTab.value = tab;
      currentPage.value = 1; // Reset to first page when changing tabs
    };

    const viewOrderDetails = (orderId) => {
      // Find the order to check its type
      const order = myOrders.value?.find(o => o._id === orderId);
      if (order?.order_type === 'specialist_prescription') {
        // Navigate to prescription details page
        router.push(`/app/patient/prescriptions/details/${orderId}`);
      } else {
        // Navigate to pharmacy order details page
        router.push(`/app/patient/pharmacy/orders/${orderId}`);
      }
    };

    const trackOrder = (orderNumber) => {
      router.push(`/app/patient/pharmacy/track/${orderNumber}`);
    };

    onMounted(async () => {
      await fetchMyOrders({ page: 1, limit: 100 });
    });

    return {
      activeTab,
      tabs,
      filteredOrders,
      paginatedOrders,
      loading,
      emptyMessage,
      viewOrderDetails,
      trackOrder,
      setActiveTab,
      // Pagination
      currentPage,
      totalPages,
      showingFrom,
      showingTo,
      visiblePages,
      goToPage,
      nextPage,
      previousPage,
    };
  },
};
</script>

<style scoped lang="scss">
.orders-page {
  padding: $size-16;
  width: 100%;

  .orders-tabs {
    display: flex;
    gap: $size-8;
    margin-bottom: $size-24;
    overflow-x: auto;
    padding-bottom: $size-8;

    .tab {
      padding: $size-10 $size-20;
      border: none;
      background: $color-white;
      border-radius: $size-8;
      font-size: $size-14;
      font-weight: 500;
      color: $color-g-44;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;

      &:hover {
        background: $color-g-95;
      }

      &.active {
        background: $color-pri;
        color: white;
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $size-48;
    text-align: center;

    svg {
      width: $size-64;
      height: $size-64;
      color: $color-g-67;
      margin-bottom: $size-16;
    }

    h3 {
      font-size: $size-20;
      font-weight: 600;
      margin-bottom: $size-8;
    }

    p {
      color: $color-g-67;
      margin-bottom: $size-24;
    }
  }

  .orders-list {
    display: flex;
    flex-direction: column;
    gap: $size-16;
  }
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: $size-48;
}

.pagination-section {
  margin-top: $size-24;
  padding: $size-16 0;
  border-top: 1px solid $color-g-92;
  display: flex;
  flex-direction: column;
  gap: $size-16;
  align-items: center;
}

.pagination-info {
  font-size: $size-14;
  color: $color-g-54;
  text-align: center;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: $size-8;
  flex-wrap: wrap;
  justify-content: center;

  @include responsive(phone) {
    gap: $size-6;
  }
}

.pagination-btn {
  padding: $size-8 $size-16;
  border: 1px solid $color-g-85;
  background: $color-white;
  border-radius: $size-8;
  font-size: $size-13;
  font-weight: 500;
  color: $color-g-44;
  cursor: pointer;
  transition: all 0.2s ease;

  @include responsive(phone) {
    padding: $size-6 $size-12;
    font-size: $size-12;
  }

  &:hover:not(:disabled) {
    border-color: $color-pri;
    color: $color-pri;
    background: rgba($color-pri, 0.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-numbers {
  display: flex;
  gap: $size-4;
}

.page-btn {
  width: $size-36;
  height: $size-36;
  border: 1px solid $color-g-85;
  background: $color-white;
  border-radius: $size-8;
  font-size: $size-14;
  font-weight: 500;
  color: $color-g-44;
  cursor: pointer;
  transition: all 0.2s ease;

  @include responsive(phone) {
    width: $size-32;
    height: $size-32;
    font-size: $size-13;
  }

  &:hover {
    border-color: $color-pri;
    color: $color-pri;
  }

  &.active {
    background: $color-pri;
    border-color: $color-pri;
    color: $color-white;
  }
}
</style>
