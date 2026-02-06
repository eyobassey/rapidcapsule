<template>
  <div class="orders-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="notification-btn" @click="goToNotifications">
        <v-icon name="hi-bell" scale="1.1" />
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="hi-shopping-bag" scale="1.2" class="spinner-icon" />
        </div>
        <p>Loading your orders...</p>
      </div>

      <template v-else>
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero__content">
            <button class="back-link desktop-only" @click="$router.push('/app/patient/pharmacy')">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Pharmacy</span>
            </button>
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="hi-shopping-bag" />
              <span>Order History</span>
            </div>
            <h1 class="hero__title">
              My<br/>
              <span class="hero__title-accent">Orders</span>
            </h1>
            <p class="hero__subtitle">
              Track and manage all your pharmacy orders in one place.
            </p>
            <div class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ stats.total }}</span>
                <span class="hero-stat__label">Total</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--warning">{{ stats.active }}</span>
                <span class="hero-stat__label">Active</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--success">{{ stats.completed }}</span>
                <span class="hero-stat__label">Completed</span>
              </div>
            </div>
          </div>
          <div class="hero__visual">
            <div class="order-orb">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="hi-shopping-bag" />
              </div>
            </div>
            <div class="floating-icons">
              <div class="float-icon float-icon--1"><v-icon name="hi-truck" /></div>
              <div class="float-icon float-icon--2"><v-icon name="hi-check-circle" /></div>
              <div class="float-icon float-icon--3"><v-icon name="hi-clock" /></div>
            </div>
          </div>
        </section>

        <!-- Bento Grid - All cards full width, stacked vertically -->
        <section class="bento-grid">
          <!-- Quick Actions Card - Horizontal row -->
          <div class="bento-card actions-card">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="actions-row">
              <button class="action-btn" @click="$router.push('/app/patient/pharmacy')">
                <div class="action-icon sky">
                  <v-icon name="hi-shopping-cart" scale="1.1" />
                </div>
                <span>Browse Pharmacy</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/patient/prescriptions')">
                <div class="action-icon violet">
                  <v-icon name="ri-capsule-line" scale="1.1" />
                </div>
                <span>My Prescriptions</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/patient/pharmacy/cart')">
                <div class="action-icon emerald">
                  <v-icon name="bi-cart-fill" scale="1.1" />
                </div>
                <span>View Cart</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/patient/appointmentsv2/book')">
                <div class="action-icon amber">
                  <v-icon name="hi-video-camera" scale="1.1" />
                </div>
                <span>Consult Doctor</span>
              </button>
            </div>
          </div>

          <!-- Filters Card - Full width -->
          <div class="bento-card filters-card">
            <div class="card-header">
              <h3>Filter Orders</h3>
              <span class="results-count">{{ filteredOrders.length }} results</span>
            </div>
            <div class="search-bar">
              <v-icon name="hi-search" scale="0.9" class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by order number or item..."
                @input="handleSearch"
              />
              <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
                <v-icon name="hi-x" scale="0.8" />
              </button>
            </div>
            <div class="filter-pills">
              <button
                v-for="tab in tabs"
                :key="tab.value"
                :class="['filter-pill', { active: activeTab === tab.value }]"
                @click="setActiveTab(tab.value)"
              >
                <span class="pill-label">{{ tab.label }}</span>
                <span v-if="getTabCount(tab.value) > 0" class="pill-count">{{ getTabCount(tab.value) }}</span>
              </button>
            </div>
          </div>

          <!-- Orders List Card - Full width -->
          <div class="bento-card orders-card">
            <div class="card-header">
              <h3>{{ activeTabLabel }}</h3>
              <router-link v-if="activeTab !== 'all'" to="#" class="clear-filter" @click.prevent="setActiveTab('all')">
                Clear filter
                <v-icon name="hi-x" scale="0.7" />
              </router-link>
            </div>

            <!-- Order Items -->
            <div v-if="paginatedOrders.length" class="orders-list">
              <div
                v-for="order in paginatedOrders"
                :key="order._id"
                class="order-item"
                @click="viewOrderDetails(order._id)"
              >
                <div class="order-item__left">
                  <div class="order-avatar" :class="getStatusClass(order.status)">
                    <v-icon :name="getStatusIcon(order.status)" scale="1" />
                  </div>

                  <div class="order-info">
                    <div class="order-header">
                      <span class="order-number">{{ order.order_number }}</span>
                      <span :class="['status-badge', getStatusBadgeClass(order.status)]">
                        {{ formatStatus(order.status) }}
                      </span>
                    </div>
                    <p class="order-source">
                      {{ order.pharmacy?.name || 'Rapid Capsule Pharmacy' }}
                    </p>
                    <div class="medication-tags" v-if="order.items?.length">
                      <span
                        v-for="(item, index) in order.items?.slice(0, 2)"
                        :key="index"
                        class="med-tag"
                      >
                        {{ item.drug_name }}
                      </span>
                      <span v-if="order.items?.length > 2" class="med-tag med-tag--more">
                        +{{ order.items.length - 2 }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="order-item__right">
                  <span class="order-date">{{ formatDate(order.created_at) }}</span>
                  <div class="order-amount" v-if="order.total_amount">
                    <span class="currency">NGN</span>
                    <span class="amount">{{ formatCurrency(order.total_amount) }}</span>
                  </div>
                  <v-icon name="hi-chevron-right" scale="0.9" class="chevron" />
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state">
              <div class="empty-icon">
                <v-icon name="hi-shopping-bag" scale="2" />
              </div>
              <h3>No orders found</h3>
              <p v-if="searchQuery || activeTab !== 'all'">Try adjusting your search or filters</p>
              <p v-else>You haven't placed any orders yet</p>
              <button class="empty-action" @click="$router.push('/app/patient/pharmacy')">
                <v-icon name="hi-shopping-cart" scale="0.9" />
                Browse Pharmacy
              </button>
            </div>

            <!-- Pagination -->
            <div v-if="filteredOrders.length > itemsPerPage" class="pagination">
              <div class="pagination-info">
                Showing {{ showingFrom }}-{{ showingTo }} of {{ filteredOrders.length }}
              </div>
              <div class="pagination-controls">
                <button
                  class="page-btn"
                  :disabled="currentPage === 1"
                  @click="previousPage"
                >
                  <v-icon name="hi-chevron-left" scale="0.8" />
                </button>
                <div class="page-numbers">
                  <button
                    v-for="page in visiblePages"
                    :key="page"
                    :class="['page-num', { active: page === currentPage }]"
                    @click="goToPage(page)"
                  >
                    {{ page }}
                  </button>
                </div>
                <button
                  class="page-btn"
                  :disabled="currentPage === totalPages"
                  @click="nextPage"
                >
                  <v-icon name="hi-chevron-right" scale="0.8" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>

    <!-- Mobile FAB -->
    <button class="fab" @click="$router.push('/app/patient/pharmacy')">
      <v-icon name="hi-plus" scale="1.2" />
    </button>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";
import moment from "moment";

export default {
  name: "MyOrders",
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const activeTab = ref("all");
    const currentPage = ref(1);
    const itemsPerPage = 10;
    const searchQuery = ref("");

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

    const activeTabLabel = computed(() => {
      const tab = tabs.find(t => t.value === activeTab.value);
      return tab ? `${tab.label} Orders` : 'All Orders';
    });

    const stats = computed(() => {
      const orders = myOrders.value || [];
      const activeStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];
      const completedStatuses = ["DELIVERED", "COMPLETED"];

      return {
        total: orders.length,
        active: orders.filter(o => activeStatuses.includes(o.status)).length,
        completed: orders.filter(o => completedStatuses.includes(o.status)).length,
      };
    });

    const filteredOrders = computed(() => {
      let orders = myOrders.value || [];

      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        orders = orders.filter(order => {
          const matchesNumber = order.order_number?.toLowerCase().includes(query);
          const matchesItem = order.items?.some(item =>
            item.drug_name?.toLowerCase().includes(query)
          );
          const matchesPharmacy = order.pharmacy?.name?.toLowerCase().includes(query);
          return matchesNumber || matchesItem || matchesPharmacy;
        });
      }

      if (activeTab.value !== "all") {
        const statusMap = {
          active: ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"],
          completed: ["DELIVERED", "COMPLETED"],
          cancelled: ["CANCELLED", "REFUNDED"],
        };
        orders = orders.filter(order =>
          statusMap[activeTab.value]?.includes(order.status)
        );
      }

      orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return orders;
    });

    const getTabCount = (tabValue) => {
      const orders = myOrders.value || [];
      if (tabValue === "all") return orders.length;

      const statusMap = {
        active: ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"],
        completed: ["DELIVERED", "COMPLETED"],
        cancelled: ["CANCELLED", "REFUNDED"],
      };

      return orders.filter(order =>
        statusMap[tabValue]?.includes(order.status)
      ).length;
    };

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

      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    });

    const formatCurrency = (amount) => {
      if (!amount) return "0.00";
      return Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const formatDate = (date) => {
      if (!date) return "";
      return moment(date).format("MMM D, YYYY");
    };

    const formatStatus = (status) => {
      const statusMap = {
        PENDING: "Pending",
        CONFIRMED: "Confirmed",
        PROCESSING: "Processing",
        READY_FOR_PICKUP: "Ready",
        OUT_FOR_DELIVERY: "Delivering",
        DELIVERED: "Delivered",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled",
        REFUNDED: "Refunded",
      };
      return statusMap[status] || status;
    };

    const getStatusClass = (status) => {
      const classMap = {
        PENDING: "status--warning",
        CONFIRMED: "status--info",
        PROCESSING: "status--info",
        READY_FOR_PICKUP: "status--info",
        OUT_FOR_DELIVERY: "status--info",
        DELIVERED: "status--success",
        COMPLETED: "status--success",
        CANCELLED: "status--error",
        REFUNDED: "status--error",
      };
      return classMap[status] || "status--default";
    };

    const getStatusBadgeClass = (status) => {
      return getStatusClass(status);
    };

    const getStatusIcon = (status) => {
      const iconMap = {
        PENDING: "hi-clock",
        CONFIRMED: "hi-check",
        PROCESSING: "hi-cog",
        READY_FOR_PICKUP: "hi-cube",
        OUT_FOR_DELIVERY: "hi-truck",
        DELIVERED: "hi-check-circle",
        COMPLETED: "hi-check-circle",
        CANCELLED: "hi-x-circle",
        REFUNDED: "hi-receipt-refund",
      };
      return iconMap[status] || "hi-shopping-bag";
    };

    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        nextTick(() => {
          const card = document.querySelector('.orders-card');
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
    };

    const nextPage = () => goToPage(currentPage.value + 1);
    const previousPage = () => goToPage(currentPage.value - 1);

    const setActiveTab = (tab) => {
      activeTab.value = tab;
      currentPage.value = 1;
    };

    const handleSearch = () => {
      currentPage.value = 1;
    };

    const clearSearch = () => {
      searchQuery.value = "";
      currentPage.value = 1;
    };

    const viewOrderDetails = (orderId) => {
      const order = myOrders.value?.find(o => o._id === orderId);
      if (order?.order_type === 'specialist_prescription') {
        router.push(`/app/patient/prescriptions/details/${orderId}`);
      } else {
        router.push(`/app/patient/pharmacy/orders/${orderId}`);
      }
    };

    const goToNotifications = () => {
      router.push('/app/patient/notifications');
    };

    onMounted(async () => {
      await fetchMyOrders({ page: 1, limit: 100 });
    });

    watch([searchQuery, activeTab], () => {
      currentPage.value = 1;
    });

    return {
      activeTab,
      activeTabLabel,
      tabs,
      filteredOrders,
      paginatedOrders,
      loading,
      searchQuery,
      stats,
      itemsPerPage,
      viewOrderDetails,
      setActiveTab,
      handleSearch,
      clearSearch,
      getTabCount,
      formatCurrency,
      formatDate,
      formatStatus,
      getStatusClass,
      getStatusBadgeClass,
      getStatusIcon,
      goToNotifications,
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
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

// Page Container
.orders-page {
  width: 100%;
  min-height: 100vh;
  background: $bg;
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 16px;
  background: white;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) {
    display: flex;
  }

  .menu-btn, .notification-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: $bg;
    color: $slate;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:active {
      background: #E2E8F0;
    }
  }

  .header-logo img {
    height: 28px;
    width: auto;
  }
}

// Page Content - matches prescriptions page exactly
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 120px;
  }
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;

  .loading-spinner {
    position: relative;
    width: 64px;
    height: 64px;

    .spinner-ring {
      position: absolute;
      inset: 0;
      border: 3px solid $sky-light;
      border-top-color: $sky;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: $sky;
    }
  }

  p {
    color: $gray;
    font-size: 14px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ============================================
// HERO SECTION
// ============================================
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  position: relative;
  overflow: hidden;
  min-height: 460px;
  margin-bottom: 24px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px;
    gap: 0;
    text-align: center;
    min-height: auto;
    border-radius: 20px;
    margin-bottom: 16px;
  }
}

.hero__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 2;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  width: fit-content;
  margin-bottom: 20px;
  position: relative;

  @media (max-width: 768px) {
    margin: 0 auto 12px;
    padding: 6px 14px;
  }

  .badge-pulse {
    position: absolute;
    left: 12px;
    width: 8px;
    height: 8px;
    background: $emerald;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;

    &::after {
      content: '';
      position: absolute;
      inset: -4px;
      background: rgba($emerald, 0.4);
      border-radius: 50%;
      animation: pulse-ring 2s ease-out infinite;
    }

    @media (max-width: 768px) {
      left: 10px;
      width: 6px;
      height: 6px;
    }
  }

  svg {
    width: 16px;
    height: 16px;
    color: white;
    margin-left: 12px;

    @media (max-width: 768px) {
      width: 14px;
      height: 14px;
      margin-left: 10px;
    }
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: white;
    letter-spacing: 0.3px;

    @media (max-width: 768px) {
      font-size: 12px;
    }
  }
}

.hero__title {
  font-size: 48px;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  margin: 0 0 16px;
  letter-spacing: -1px;

  @media (max-width: 768px) {
    font-size: 28px;
    margin: 0 0 8px;
    letter-spacing: -0.5px;

    br { display: none; }
  }

  .hero__title-accent {
    background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @media (max-width: 768px) {
      display: inline;
      margin-left: 6px;
    }
  }
}

.hero__subtitle {
  font-size: 18px;
  color: white;
  line-height: 1.6;
  margin: 0 0 24px;
  max-width: 400px;
  opacity: 0.95;

  @media (max-width: 768px) {
    font-size: 14px;
    max-width: 100%;
    margin: 0 0 16px;
    opacity: 0.9;
  }
}

.hero__stats {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  width: fit-content;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-around;
    padding: 14px 16px;
    gap: 0;
    border-radius: 12px;
  }
}

.hero__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  @media (max-width: 768px) {
    display: none;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  width: fit-content;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.desktop-only {
  @media (max-width: 768px) {
    display: none !important;
  }
}

.hero-stat {
  text-align: center;

  &__value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: white;
    line-height: 1;

    @media (max-width: 768px) {
      font-size: 20px;
    }

    &--warning { color: $amber-light; }
    &--success { color: $emerald-light; }
  }

  &__label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }

  &__divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);

    @media (max-width: 768px) {
      height: 28px;
    }
  }
}

// Orb Animation
.order-orb {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 {
    width: 100%;
    height: 100%;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    width: 80%;
    height: 80%;
    animation: spin-slow 15s linear infinite reverse;
  }

  &--3 {
    width: 60%;
    height: 60%;
    animation: spin-slow 10s linear infinite;
  }
}

.orb-core {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 40px rgba(255, 255, 255, 0.3),
    0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;

  svg {
    width: 48px;
    height: 48px;
    color: white;
  }
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;

  svg {
    width: 20px;
    height: 20px;
    color: white;
  }

  &--1 { top: 10%; right: 10%; animation-delay: 0s; }
  &--2 { bottom: 20%; right: 5%; animation-delay: 1s; }
  &--3 { bottom: 10%; left: 10%; animation-delay: 2s; }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// ============================================
// BENTO GRID - All cards full width, stacked vertically
// ============================================
.bento-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 16px;
  }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    @media (max-width: 768px) {
      margin-bottom: 12px;
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }

    .results-count {
      font-size: 13px;
      color: $gray;
    }

    .clear-filter {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: $sky-dark;
      text-decoration: none;
      font-weight: 500;

      &:hover { color: $sky-darker; }
    }
  }
}

// Actions Card - Horizontal row
.actions-card {
  @media (max-width: 768px) {
    display: none;
  }

  .actions-row {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px 16px;
    background: $bg;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: white;
      border-color: $sky;
      box-shadow: 0 4px 12px rgba($sky, 0.15);
      transform: translateY(-2px);
    }

    span {
      font-size: 13px;
      font-weight: 500;
      color: $slate;
    }
  }

  .action-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.sky { background: $sky-light; color: $sky-dark; }
    &.emerald { background: $emerald-light; color: $emerald; }
    &.violet { background: $violet-light; color: $violet; }
    &.amber { background: $amber-light; color: $amber; }
  }
}

// Filters Card
.filters-card {
  .search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    background: $bg;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid #E2E8F0;
    margin-bottom: 16px;
    transition: all 0.2s;

    &:focus-within {
      border-color: $sky;
      box-shadow: 0 0 0 3px rgba($sky, 0.1);
    }

    .search-icon { color: $gray; }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      color: $navy;
      background: transparent;

      &::placeholder { color: $light-gray; }
    }

    .clear-btn {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      border: none;
      background: #E2E8F0;
      color: $gray;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: $rose-light;
        color: $rose;
      }
    }
  }

  .filter-pills {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;

    &::-webkit-scrollbar { height: 4px; }
    &::-webkit-scrollbar-thumb {
      background: #E2E8F0;
      border-radius: 2px;
    }
  }

  .filter-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid #E2E8F0;
    background: white;
    font-size: 13px;
    font-weight: 500;
    color: $slate;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;

    &:hover {
      border-color: $sky;
      color: $sky-dark;
    }

    &.active {
      background: linear-gradient(135deg, $sky, $sky-dark);
      border-color: transparent;
      color: white;

      .pill-count {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }
    }

    .pill-count {
      background: $bg;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      color: $gray;
    }
  }
}

// Orders Card
.orders-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: $bg;
  border-radius: 14px;
  border: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.2s;

  @media (max-width: 768px) {
    padding: 14px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  &:hover {
    background: white;
    border-color: $sky-light;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    transform: translateX(4px);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;

    @media (max-width: 768px) { width: 100%; }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 100%;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid #E2E8F0;
    }

    .chevron {
      color: $light-gray;
      @media (max-width: 768px) { display: none; }
    }
  }
}

.order-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.status--warning { background: $amber-light; color: $amber; }
  &.status--info { background: $sky-light; color: $sky-dark; }
  &.status--success { background: $emerald-light; color: $emerald; }
  &.status--error { background: $rose-light; color: $rose; }
  &.status--default { background: #F1F5F9; color: $slate; }
}

.order-info {
  flex: 1;
  min-width: 0;

  .order-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }

  .order-number {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
  }

  .order-source {
    font-size: 13px;
    color: $gray;
    margin: 0 0 8px;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;

  &.status--success { background: $emerald-light; color: $emerald; }
  &.status--warning { background: $amber-light; color: $amber; }
  &.status--info { background: $sky-light; color: $sky-dark; }
  &.status--error { background: $rose-light; color: $rose; }
  &.status--default { background: #F1F5F9; color: $slate; }
}

.medication-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .med-tag {
    font-size: 11px;
    padding: 4px 10px;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    color: $slate;

    &--more {
      background: $sky-light;
      border-color: $sky-light;
      color: $sky-dark;
      font-weight: 500;
    }
  }
}

.order-date {
  font-size: 13px;
  color: $gray;
}

.order-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;

  .currency {
    font-size: 12px;
    color: $gray;
  }

  .amount {
    font-size: 16px;
    font-weight: 700;
    color: $navy;
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 48px 24px;

  .empty-icon {
    width: 80px;
    height: 80px;
    background: $sky-light;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: $sky;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: $gray;
    margin: 0 0 20px;
  }

  .empty-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($sky, 0.3);
    }
  }
}

// Pagination
.pagination {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.pagination-info {
  font-size: 13px;
  color: $gray;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #E2E8F0;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $slate;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: $sky;
    color: $sky-dark;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-num {
  width: 36px;
  height: 36px;
  border: 1px solid #E2E8F0;
  background: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $sky;
    color: $sky-dark;
  }

  &.active {
    background: linear-gradient(135deg, $sky, $sky-dark);
    border-color: transparent;
    color: white;
  }
}

// Mobile FAB
.fab {
  display: none;
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, $sky, $sky-dark);
  color: white;
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba($sky, 0.4);
  cursor: pointer;
  z-index: 50;
  transition: all 0.2s;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
