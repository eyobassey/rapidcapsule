<template>
  <div class="page-content">
    <top-bar
      type="title-only"
      title="Pharmacy Portal"
      @open-side-nav="$emit('openSideNav')"
    />

    <div class="page-content__body">
      <div class="pharmacy-portal">
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon pending">
              <RCIcon name="clock" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.pendingOrders }}</span>
              <span class="stat-label">Pending Orders</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon processing">
              <RCIcon name="package" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.processingOrders }}</span>
              <span class="stat-label">Processing</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon ready">
              <RCIcon name="check-circle" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.readyForPickup }}</span>
              <span class="stat-label">Ready for Pickup</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon completed">
              <RCIcon name="truck" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.completedToday }}</span>
              <span class="stat-label">Completed Today</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <rc-button
            type="primary"
            label="New Orders"
            @click="$router.push('/app/specialist/pharmacy-portal/orders?status=PENDING')"
          />
          <rc-button
            type="secondary"
            label="Manage Inventory"
            @click="$router.push('/app/specialist/pharmacy-portal/inventory')"
          />
          <rc-button
            type="secondary"
            label="Prescriptions"
            @click="$router.push('/app/specialist/pharmacy-portal/prescriptions')"
          />
        </div>

        <!-- Recent Orders -->
        <div class="recent-orders">
          <div class="section-header">
            <h3>Recent Orders</h3>
            <rc-button
              type="secondary"
              label="View All"
              @click="$router.push('/app/specialist/pharmacy-portal/orders')"
            />
          </div>
          <div class="orders-list" v-if="!loading && recentOrders.length > 0">
            <PharmacyOrderCard
              v-for="order in recentOrders"
              :key="order._id"
              :order="order"
              @view-details="viewOrderDetails"
              @update-status="handleStatusUpdate"
            />
          </div>
          <div v-if="!loading && recentOrders.length === 0" class="empty-state">
            <RCIcon name="package" />
            <p>No recent orders</p>
          </div>
        </div>

        <!-- Low Stock Alert -->
        <div class="low-stock-alert" v-if="lowStockDrugs.length > 0">
          <div class="section-header">
            <h3>Low Stock Alert</h3>
            <rc-button
              type="secondary"
              label="Manage Inventory"
              @click="$router.push('/app/specialist/pharmacy-portal/inventory')"
            />
          </div>
          <div class="low-stock-list">
            <div
              v-for="drug in lowStockDrugs.slice(0, 5)"
              :key="drug._id"
              class="low-stock-item"
            >
              <div class="drug-info">
                <span class="drug-name">{{ drug.name }}</span>
                <span class="drug-strength">{{ drug.strength }} {{ drug.dosage_form }}</span>
              </div>
              <div class="stock-info">
                <span class="stock-count" :class="{ critical: drug.quantity <= 5 }">
                  {{ drug.quantity }} left
                </span>
              </div>
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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import PharmacyOrderCard from "./components/PharmacyOrderCard.vue";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";

export default {
  name: "PharmacyPortal",
  components: {
    TopBar,
    RcButton,
    Loader,
    RCIcon,
    PharmacyOrderCard,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();

    const {
      "pharmacyPortal/fetchDashboardStats": fetchDashboardStats,
      "pharmacyPortal/fetchPharmacyOrders": fetchPharmacyOrders,
      "pharmacyPortal/fetchLowStockDrugs": fetchLowStockDrugs,
      "pharmacyPortal/updateOrderStatus": updateOrderStatus,
    } = useMapActions();

    const {
      "pharmacyPortal/getDashboardStats": dashboardStats,
      "pharmacyPortal/getPharmacyOrders": pharmacyOrders,
      "pharmacyPortal/getLowStockDrugs": lowStockItems,
      "pharmacyPortal/getLoading": isLoading,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);
    const stats = computed(() => dashboardStats.value || {
      pendingOrders: 0,
      processingOrders: 0,
      readyForPickup: 0,
      completedToday: 0,
    });
    const recentOrders = computed(() => pharmacyOrders.value?.slice(0, 5) || []);
    const lowStockDrugs = computed(() => lowStockItems.value || []);

    const viewOrderDetails = (orderId) => {
      router.push(`/app/specialist/pharmacy-portal/orders/${orderId}`);
    };

    const handleStatusUpdate = async ({ orderId, status }) => {
      try {
        await updateOrderStatus({ orderId, status });
        await fetchPharmacyOrders({ limit: 5 });
        await fetchDashboardStats();
      } catch (error) {
        console.error("Error updating order status:", error);
      }
    };

    onMounted(async () => {
      try {
        await Promise.all([
          fetchDashboardStats(),
          fetchPharmacyOrders({ limit: 5 }),
          fetchLowStockDrugs(),
        ]);
      } catch (error) {
        console.error("Error loading pharmacy portal data:", error);
      }
    });

    return {
      stats,
      recentOrders,
      lowStockDrugs,
      loading,
      viewOrderDetails,
      handleStatusUpdate,
    };
  },
};
</script>

<style scoped lang="scss">
.pharmacy-portal {
  padding: $size-16;

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $size-16;
    margin-bottom: $size-24;

    @include responsive(tablet) {
      grid-template-columns: repeat(4, 1fr);
    }

    .stat-card {
      background: $color-white;
      border-radius: $size-12;
      padding: $size-16;
      display: flex;
      align-items: center;
      gap: $size-12;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .stat-icon {
        width: $size-48;
        height: $size-48;
        border-radius: $size-10;
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
          width: $size-24;
          height: $size-24;
          color: white;
        }

        &.pending {
          background: #ffc107;
        }

        &.processing {
          background: #17a2b8;
        }

        &.ready {
          background: #28a745;
        }

        &.completed {
          background: $color-pri;
        }
      }

      .stat-info {
        display: flex;
        flex-direction: column;

        .stat-value {
          font-size: $size-24;
          font-weight: 700;
          color: $color-g-21;
        }

        .stat-label {
          font-size: $size-12;
          color: $color-g-67;
        }
      }
    }
  }

  .quick-actions {
    display: flex;
    gap: $size-12;
    margin-bottom: $size-24;
    flex-wrap: wrap;

    button {
      flex: 1;
      min-width: 120px;
    }
  }

  .recent-orders,
  .low-stock-alert {
    background: $color-white;
    border-radius: $size-12;
    padding: $size-16;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    margin-bottom: $size-24;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $size-16;

      h3 {
        font-size: $size-18;
        font-weight: 600;
      }
    }

    .orders-list {
      display: flex;
      flex-direction: column;
      gap: $size-12;
    }
  }

  .low-stock-list {
    .low-stock-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $size-12;
      border-bottom: 1px solid $color-g-95;

      &:last-child {
        border-bottom: none;
      }

      .drug-info {
        display: flex;
        flex-direction: column;

        .drug-name {
          font-size: $size-14;
          font-weight: 500;
          color: $color-g-21;
        }

        .drug-strength {
          font-size: $size-12;
          color: $color-g-67;
        }
      }

      .stock-info {
        .stock-count {
          font-size: $size-14;
          font-weight: 600;
          color: #ffc107;
          padding: $size-4 $size-8;
          background: #fff3cd;
          border-radius: $size-4;

          &.critical {
            color: #dc3545;
            background: #f8d7da;
          }
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $size-32;
    text-align: center;

    svg {
      width: $size-48;
      height: $size-48;
      color: $color-g-67;
      margin-bottom: $size-12;
    }

    p {
      color: $color-g-67;
    }
  }
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: $size-48;
}
</style>
