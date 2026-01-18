<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Orders"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="orders-page">
        <!-- Filters -->
        <div class="filters-section">
          <div class="search-box">
            <RCIcon name="search" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search by order number or customer..."
              @input="debouncedSearch"
            />
          </div>
          <div class="filter-chips">
            <button
              :class="['filter-chip', { active: statusFilter === 'all' }]"
              @click="setStatusFilter('all')"
            >
              All
            </button>
            <button
              :class="['filter-chip', { active: statusFilter === 'PENDING' }]"
              @click="setStatusFilter('PENDING')"
            >
              Pending
            </button>
            <button
              :class="['filter-chip', { active: statusFilter === 'CONFIRMED' }]"
              @click="setStatusFilter('CONFIRMED')"
            >
              Confirmed
            </button>
            <button
              :class="['filter-chip', { active: statusFilter === 'PROCESSING' }]"
              @click="setStatusFilter('PROCESSING')"
            >
              Processing
            </button>
            <button
              :class="['filter-chip', { active: statusFilter === 'READY_FOR_PICKUP' }]"
              @click="setStatusFilter('READY_FOR_PICKUP')"
            >
              Ready
            </button>
            <button
              :class="['filter-chip', { active: statusFilter === 'OUT_FOR_DELIVERY' }]"
              @click="setStatusFilter('OUT_FOR_DELIVERY')"
            >
              Out for Delivery
            </button>
            <button
              :class="['filter-chip', { active: statusFilter === 'COMPLETED' }]"
              @click="setStatusFilter('COMPLETED')"
            >
              Completed
            </button>
          </div>
        </div>

        <!-- Orders List -->
        <div class="orders-list" v-if="!loading && filteredOrders.length > 0">
          <PharmacyOrderCard
            v-for="order in filteredOrders"
            :key="order._id"
            :order="order"
            @view-details="viewOrderDetails"
            @update-status="handleStatusUpdate"
          />
        </div>

        <!-- Empty State -->
        <div v-if="!loading && filteredOrders.length === 0" class="empty-state">
          <RCIcon name="package" />
          <h3>No orders found</h3>
          <p>{{ searchQuery ? 'Try a different search term' : 'No orders match the selected filter' }}</p>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            Previous
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            Next
          </button>
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
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader.vue";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import PharmacyOrderCard from "./components/PharmacyOrderCard.vue";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";
import { debounce } from "lodash";

export default {
  name: "PharmacyOrders",
  components: {
    TopBar,
    Loader,
    RCIcon,
    PharmacyOrderCard,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const route = useRoute();
    const searchQuery = ref("");
    const statusFilter = ref("all");
    const currentPage = ref(1);
    const itemsPerPage = 10;

    const {
      "pharmacyPortal/fetchPharmacyOrders": fetchPharmacyOrders,
      "pharmacyPortal/updateOrderStatus": updateOrderStatus,
    } = useMapActions();

    const {
      "pharmacyPortal/getPharmacyOrders": pharmacyOrders,
      "pharmacyPortal/getTotalOrders": totalOrders,
      "pharmacyPortal/getLoading": isLoading,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);
    const filteredOrders = computed(() => pharmacyOrders.value || []);
    const totalPages = computed(() => Math.ceil((totalOrders.value || 0) / itemsPerPage));

    const loadOrders = async () => {
      const params = {
        page: currentPage.value,
        limit: itemsPerPage,
      };

      if (statusFilter.value !== "all") {
        params.status = statusFilter.value;
      }

      if (searchQuery.value) {
        params.search = searchQuery.value;
      }

      await fetchPharmacyOrders(params);
    };

    const setStatusFilter = (status) => {
      statusFilter.value = status;
      currentPage.value = 1;
      loadOrders();
    };

    const debouncedSearch = debounce(() => {
      currentPage.value = 1;
      loadOrders();
    }, 500);

    const changePage = (page) => {
      currentPage.value = page;
      loadOrders();
    };

    const viewOrderDetails = (orderId) => {
      router.push(`/app/specialist/pharmacy-portal/orders/${orderId}`);
    };

    const handleStatusUpdate = async ({ orderId, status }) => {
      try {
        await updateOrderStatus({ orderId, status });
        await loadOrders();
      } catch (error) {
        console.error("Error updating order status:", error);
      }
    };

    onMounted(() => {
      // Check for status query param
      if (route.query.status) {
        statusFilter.value = route.query.status;
      }
      loadOrders();
    });

    watch(() => route.query.status, (newStatus) => {
      if (newStatus) {
        statusFilter.value = newStatus;
        loadOrders();
      }
    });

    return {
      searchQuery,
      statusFilter,
      currentPage,
      totalPages,
      filteredOrders,
      loading,
      setStatusFilter,
      debouncedSearch,
      changePage,
      viewOrderDetails,
      handleStatusUpdate,
    };
  },
};
</script>

<style scoped lang="scss">
.orders-page {
  padding: $size-16;

  .filters-section {
    margin-bottom: $size-20;

    .search-box {
      display: flex;
      align-items: center;
      background: $color-white;
      border-radius: $size-10;
      padding: $size-12 $size-16;
      margin-bottom: $size-12;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      svg {
        width: $size-20;
        height: $size-20;
        color: $color-g-67;
        margin-right: $size-12;
      }

      input {
        flex: 1;
        border: none;
        outline: none;
        font-size: $size-16;
        background: transparent;

        &::placeholder {
          color: $color-g-67;
        }
      }
    }

    .filter-chips {
      display: flex;
      gap: $size-8;
      overflow-x: auto;
      padding-bottom: $size-4;

      &::-webkit-scrollbar {
        display: none;
      }

      .filter-chip {
        padding: $size-8 $size-16;
        border: 1px solid $color-g-85;
        border-radius: $size-20;
        background: $color-white;
        font-size: $size-14;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: $color-pri;
        }

        &.active {
          background: $color-pri;
          border-color: $color-pri;
          color: white;
        }
      }
    }
  }

  .orders-list {
    display: flex;
    flex-direction: column;
    gap: $size-12;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $size-48;
    text-align: center;
    background: $color-white;
    border-radius: $size-12;

    svg {
      width: $size-64;
      height: $size-64;
      color: $color-g-67;
      margin-bottom: $size-16;
    }

    h3 {
      font-size: $size-18;
      font-weight: 600;
      margin-bottom: $size-8;
    }

    p {
      color: $color-g-67;
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: $size-16;
    margin-top: $size-24;

    .page-btn {
      padding: $size-10 $size-20;
      border: 1px solid $color-g-85;
      border-radius: $size-8;
      background: $color-white;
      font-size: $size-14;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        border-color: $color-pri;
        color: $color-pri;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .page-info {
      font-size: $size-14;
      color: $color-g-44;
    }
  }
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: $size-48;
}
</style>
