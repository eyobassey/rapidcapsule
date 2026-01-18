<template>
  <div class="page-content">
    <TopBar showButtons type="avatar" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="prescriptions-container">
        <!-- Header -->
        <div class="page-header">
          <div class="page-header__back">
            <button class="back-btn" @click="$router.push('/app/specialist/pharmacy')">
              <rc-icon icon-name="arrow-left" size="sm" />
            </button>
            <div>
              <h1>Prescriptions</h1>
              <p>Manage all your prescriptions</p>
            </div>
          </div>
          <button class="btn btn-primary" @click="createPrescription">
            <rc-icon icon-name="plus" size="sm" />
            New Prescription
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-value">{{ stats.total || 0 }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-card">
            <span class="stat-value stat-value--warning">{{ stats.pending_payment || 0 }}</span>
            <span class="stat-label">Pending Payment</span>
          </div>
          <div class="stat-card">
            <span class="stat-value stat-value--info">{{ stats.processing || 0 }}</span>
            <span class="stat-label">Processing</span>
          </div>
          <div class="stat-card">
            <span class="stat-value stat-value--success">{{ stats.delivered || 0 }}</span>
            <span class="stat-label">Delivered</span>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="search-bar">
            <rc-icon icon-name="search" size="sm" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by prescription number or patient..."
              @input="debouncedSearch"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <rc-icon icon-name="close" size="xs" />
            </button>
          </div>
          <div class="filter-tabs">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              :class="['filter-tab', { active: statusFilter === tab.value }]"
              @click="setStatusFilter(tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <loader v-if="isLoading" :useOverlay="false" />

        <!-- Results -->
        <div v-else class="results-section">
          <div v-if="prescriptions.length" class="prescriptions-list">
            <div
              v-for="prescription in prescriptions"
              :key="prescription._id"
              class="prescription-card"
              @click="viewPrescription(prescription._id)"
            >
              <div class="prescription-card__header">
                <div class="prescription-info">
                  <span class="prescription-number">{{ prescription.prescription_number }}</span>
                  <span :class="['status', `status--${prescription.status?.toLowerCase()}`]">
                    {{ formatStatus(prescription.status) }}
                  </span>
                </div>
                <span class="prescription-date">{{ formatDate(prescription.created_at) }}</span>
              </div>

              <div class="prescription-card__patient">
                <div class="patient-avatar">
                  <img
                    v-if="prescription.patient?.profile_image"
                    :src="prescription.patient.profile_image"
                    :alt="prescription.patient?.full_name"
                  />
                  <span v-else>{{ getInitials(prescription.patient?.full_name) }}</span>
                </div>
                <div class="patient-info">
                  <p class="patient-name">{{ prescription.patient?.full_name || 'Unknown' }}</p>
                  <p class="patient-email">{{ prescription.patient?.email }}</p>
                </div>
              </div>

              <div class="prescription-card__items">
                <div class="items-preview">
                  <span
                    v-for="(item, index) in prescription.items?.slice(0, 3)"
                    :key="index"
                    class="item-tag"
                  >
                    {{ item.drug_name }}
                  </span>
                  <span v-if="prescription.items?.length > 3" class="more-items">
                    +{{ prescription.items.length - 3 }} more
                  </span>
                </div>
              </div>

              <div class="prescription-card__footer">
                <div class="payment-info">
                  <span class="payment-method">{{ formatPaymentMethod(prescription.payment_method) }}</span>
                  <span :class="['payment-status', `payment-status--${prescription.payment_status?.toLowerCase()}`]">
                    {{ formatPaymentStatus(prescription.payment_status) }}
                  </span>
                </div>
                <div class="amount">
                  NGN {{ formatCurrency(prescription.total_amount) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <rc-icon icon-name="prescription" size="xl" />
            <h3>No prescriptions found</h3>
            <p v-if="searchQuery || statusFilter !== 'all'">Try adjusting your filters</p>
            <p v-else>Create your first prescription to get started</p>
            <button class="btn btn-primary" @click="createPrescription">
              Create Prescription
            </button>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="pagination">
            <button
              class="pagination-btn"
              :disabled="pagination.page === 1"
              @click="goToPage(pagination.page - 1)"
            >
              <rc-icon icon-name="chevron-left" size="sm" />
            </button>
            <span class="pagination-info">
              Page {{ pagination.page }} of {{ pagination.totalPages }}
            </span>
            <button
              class="pagination-btn"
              :disabled="pagination.page === pagination.totalPages"
              @click="goToPage(pagination.page + 1)"
            >
              <rc-icon icon-name="chevron-right" size="sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader";
import RcIcon from "@/components/RCIcon";
import apiFactory from "@/services/apiFactory";
import moment from "moment";
import { debounce } from "lodash";

export default {
  name: "PharmacyPrescriptions",
  components: {
    TopBar,
    Loader,
    RcIcon,
  },
  data() {
    return {
      isLoading: false,
      searchQuery: "",
      statusFilter: "all",
      prescriptions: [],
      stats: {},
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      statusTabs: [
        { label: "All", value: "all" },
        { label: "Draft", value: "draft" },
        { label: "Pending Payment", value: "pending_payment" },
        { label: "Paid", value: "paid" },
        { label: "Processing", value: "processing" },
        { label: "Dispensed", value: "dispensed" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
      ],
    };
  },
  created() {
    this.debouncedSearch = debounce(this.fetchPrescriptions, 300);
  },
  async mounted() {
    await Promise.all([
      this.fetchPrescriptions(),
      this.fetchStats(),
    ]);
  },
  methods: {
    async fetchPrescriptions() {
      try {
        this.isLoading = true;
        const params = {
          search: this.searchQuery || undefined,
          status: this.statusFilter !== "all" ? this.statusFilter : undefined,
          page: this.pagination.page,
          limit: this.pagination.limit,
        };
        const response = await apiFactory.$_getSpecialistPrescriptions(params);
        // Backend returns: { statusCode, message, data: { total, docs, pages, perPage, currentPage } }
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.prescriptions = result.docs || [];
          this.pagination = {
            ...this.pagination,
            total: result.total || 0,
            totalPages: result.pages || 0,
          };
        }
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
        this.$toast.error("Failed to load prescriptions");
      } finally {
        this.isLoading = false;
      }
    },
    async fetchStats() {
      try {
        const response = await apiFactory.$_getSpecialistPrescriptionStats();
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.stats = result;
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    },
    setStatusFilter(status) {
      this.statusFilter = status;
      this.pagination.page = 1;
      this.fetchPrescriptions();
    },
    clearSearch() {
      this.searchQuery = "";
      this.pagination.page = 1;
      this.fetchPrescriptions();
    },
    goToPage(page) {
      this.pagination.page = page;
      this.fetchPrescriptions();
    },
    createPrescription() {
      this.$router.push("/app/specialist/pharmacy/prescriptions/create");
    },
    viewPrescription(id) {
      this.$router.push(`/app/specialist/pharmacy/prescriptions/${id}`);
    },
    getInitials(name) {
      if (!name) return "?";
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    },
    formatDate(date) {
      if (!date) return "";
      return moment(date).format("MMM D, YYYY h:mm A");
    },
    formatCurrency(amount) {
      if (!amount) return "0.00";
      return Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    formatStatus(status) {
      if (!status) return "";
      return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    },
    formatPaymentMethod(method) {
      if (!method) return "Not set";
      const normalizedMethod = method.toUpperCase();
      const methods = {
        SPECIALIST_WALLET: "Wallet",
        PATIENT_ONLINE: "Online",
        PATIENT_CASH: "Cash",
      };
      return methods[normalizedMethod] || method;
    },
    formatPaymentStatus(status) {
      if (!status) return "N/A";
      const normalizedStatus = status.toUpperCase();
      const statuses = {
        PENDING: "Pending",
        PROCESSING: "Processing",
        COMPLETED: "Paid",
        PAID: "Paid",
        FAILED: "Failed",
        REFUNDED: "Refunded",
      };
      return statuses[normalizedStatus] || status;
    },
  },
};
</script>

<style scoped lang="scss">
.page-content {
  @include flexItem(vertical) {
    width: 100%;
    height: 100%;
    background-color: $color-g-97;
  }

  &__body {
    flex-grow: 1;
    overflow-y: auto;
    padding: $size-24;

    @include responsive(tab-portrait) {
      padding: $size-16;
    }
  }
}

.prescriptions-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $size-24;
  gap: $size-16;

  @include responsive(tab-portrait) {
    flex-direction: column;
  }

  &__back {
    display: flex;
    align-items: center;
    gap: $size-16;

    .back-btn {
      width: $size-40;
      height: $size-40;
      border-radius: 50%;
      border: none;
      background: $color-white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      &:hover {
        background: $color-g-95;
      }
    }

    h1 {
      font-size: $size-24;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    p {
      font-size: $size-15;
      color: $color-g-54;
    }
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $size-12;
  margin-bottom: $size-24;

  @include responsive(tab-portrait) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  background: $color-white;
  padding: $size-16;
  border-radius: $size-12;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  .stat-value {
    display: block;
    font-size: $size-28;
    font-weight: $fw-bold;
    color: $color-g-21;

    &--warning {
      color: #d97706;
    }

    &--info {
      color: #2563eb;
    }

    &--success {
      color: #059669;
    }
  }

  .stat-label {
    font-size: $size-12;
    color: $color-g-54;
  }
}

.filters-section {
  margin-bottom: $size-24;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: $size-12;
  background: $color-white;
  padding: $size-12 $size-16;
  border-radius: $size-12;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: $size-16;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: $size-15;
    color: $color-g-21;

    &::placeholder {
      color: $color-g-67;
    }
  }

  .clear-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: $size-4;
    color: $color-g-54;

    &:hover {
      color: $color-g-36;
    }
  }
}

.filter-tabs {
  display: flex;
  gap: $size-8;
  overflow-x: auto;
  padding-bottom: $size-4;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-g-85;
    border-radius: 2px;
  }
}

.filter-tab {
  padding: $size-8 $size-16;
  border-radius: $size-20;
  border: 1px solid $color-g-85;
  background: $color-white;
  font-size: $size-12;
  font-weight: $fw-medium;
  color: $color-g-44;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

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

.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.prescription-card {
  background: $color-white;
  padding: $size-20;
  border-radius: $size-12;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-16;

    .prescription-info {
      display: flex;
      align-items: center;
      gap: $size-12;

      .prescription-number {
        font-size: $size-16;
        font-weight: $fw-semi-bold;
        color: $color-g-21;
      }
    }

    .prescription-date {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  &__patient {
    display: flex;
    align-items: center;
    gap: $size-12;
    margin-bottom: $size-16;

    .patient-avatar {
      width: $size-44;
      height: $size-44;
      border-radius: 50%;
      background: $color-pri;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      span {
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        color: $color-white;
      }
    }

    .patient-name {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-21;
    }

    .patient-email {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  &__items {
    margin-bottom: $size-16;

    .items-preview {
      display: flex;
      flex-wrap: wrap;
      gap: $size-6;
    }

    .item-tag {
      font-size: $size-12;
      padding: $size-4 $size-10;
      background: $color-g-95;
      border-radius: $size-12;
      color: $color-g-44;
    }

    .more-items {
      font-size: $size-12;
      padding: $size-4 $size-10;
      background: $color-g-90;
      border-radius: $size-12;
      color: $color-g-54;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $size-12;
    border-top: 1px solid $color-g-92;

    .payment-info {
      display: flex;
      align-items: center;
      gap: $size-8;

      .payment-method {
        font-size: $size-12;
        color: $color-g-54;
      }
    }

    .amount {
      font-size: $size-18;
      font-weight: $fw-bold;
      color: $color-g-21;
    }
  }
}

.status {
  font-size: $size-11;
  padding: $size-4 $size-10;
  border-radius: $size-12;
  font-weight: $fw-medium;
  text-transform: uppercase;

  &--draft {
    background: $color-g-90;
    color: $color-g-44;
  }

  &--pending_payment {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--paid,
  &--processing {
    background: rgba(#3b82f6, 0.1);
    color: #2563eb;
  }

  &--dispensed,
  &--shipped {
    background: rgba(#8b5cf6, 0.1);
    color: #7c3aed;
  }

  &--delivered {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--cancelled {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }
}

.payment-status {
  font-size: $size-11;
  padding: $size-3 $size-8;
  border-radius: $size-8;

  &--pending {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--completed {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--failed {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }
}

.empty-state {
  text-align: center;
  padding: $size-64 $size-24;
  color: $color-g-54;

  h3 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-44;
    margin: $size-16 0 $size-8;
  }

  p {
    font-size: $size-15;
    margin-bottom: $size-20;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $size-16;
  margin-top: $size-24;

  &-btn {
    width: $size-40;
    height: $size-40;
    border-radius: $size-8;
    border: 1px solid $color-g-85;
    background: $color-white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      border-color: $color-pri;
      color: $color-pri;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &-info {
    font-size: $size-15;
    color: $color-g-54;
  }
}

.btn {
  padding: $size-12 $size-20;
  border-radius: $size-8;
  font-size: $size-15;
  font-weight: $fw-medium;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: $size-8;

  &-primary {
    background: $color-pri;
    color: $color-white;

    &:hover {
      background: darken($color-pri, 10%);
    }
  }
}
</style>
