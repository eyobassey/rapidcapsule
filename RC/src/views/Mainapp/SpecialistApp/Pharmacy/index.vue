<template>
  <div class="page-content">
    <TopBar showButtons type="avatar" @open-side-nav="$emit('openSideNav')" />
    <loader v-if="isLoading" :useOverlay="false" style="position: absolute" />
    <div v-else class="page-content__body">
      <div class="pharmacy-container">
        <!-- Header -->
        <div class="pharmacy-header">
          <div class="pharmacy-header__title">
            <h1>Pharmacy Dashboard</h1>
            <p>Manage prescriptions, patients, and drug inventory</p>
          </div>
          <div class="pharmacy-header__actions">
            <button class="btn btn-primary" @click="createPrescription">
              <rc-icon icon-name="plus" size="sm" />
              New Prescription
            </button>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card stat-card--primary">
            <div class="stat-card__icon">
              <rc-icon icon-name="prescription" size="md" />
            </div>
            <div class="stat-card__content">
              <p class="stat-card__value">{{ stats.prescriptions_today || 0 }}</p>
              <p class="stat-card__label">Prescriptions Today</p>
            </div>
          </div>
          <div class="stat-card stat-card--info">
            <div class="stat-card__icon">
              <rc-icon icon-name="calendar" size="md" />
            </div>
            <div class="stat-card__content">
              <p class="stat-card__value">{{ stats.prescriptions_this_week || 0 }}</p>
              <p class="stat-card__label">This Week</p>
            </div>
          </div>
          <div class="stat-card stat-card--warning">
            <div class="stat-card__icon">
              <rc-icon icon-name="clock" size="md" />
            </div>
            <div class="stat-card__content">
              <p class="stat-card__value">{{ stats.pending_payment || 0 }}</p>
              <p class="stat-card__label">Pending Payment</p>
            </div>
          </div>
          <div class="stat-card stat-card--success">
            <div class="stat-card__icon">
              <rc-icon icon-name="users" size="md" />
            </div>
            <div class="stat-card__content">
              <p class="stat-card__value">{{ stats.total_patients || 0 }}</p>
              <p class="stat-card__label">Total Patients</p>
            </div>
          </div>
        </div>

        <!-- Wallet Balance -->
        <div class="wallet-section">
          <div class="wallet-card">
            <div class="wallet-card__header">
              <h3>Pharmacy Wallet</h3>
              <router-link to="/app/specialist/specialist-account" class="wallet-link">
                View Details
              </router-link>
            </div>
            <div class="wallet-card__balance">
              <span class="currency">NGN</span>
              <span class="amount">{{ formatCurrency(stats.wallet_balance || 0) }}</span>
            </div>
            <p class="wallet-card__note">Available for prescription payments</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <h2>Quick Actions</h2>
          <div class="actions-grid">
            <router-link to="/app/specialist/pharmacy/patients" class="action-card">
              <div class="action-card__icon">
                <rc-icon icon-name="users" size="lg" />
              </div>
              <h3>Search Patients</h3>
              <p>Find and manage patient prescriptions</p>
            </router-link>
            <router-link to="/app/specialist/pharmacy/drugs" class="action-card">
              <div class="action-card__icon">
                <rc-icon icon-name="pill" size="lg" />
              </div>
              <h3>Drug Catalog</h3>
              <p>Browse available medications</p>
            </router-link>
            <router-link to="/app/specialist/pharmacy/prescriptions" class="action-card">
              <div class="action-card__icon">
                <rc-icon icon-name="list" size="lg" />
              </div>
              <h3>Prescriptions</h3>
              <p>View all prescription history</p>
            </router-link>
            <router-link to="/app/specialist/pharmacy/prescriptions/create" class="action-card">
              <div class="action-card__icon">
                <rc-icon icon-name="plus" size="lg" />
              </div>
              <h3>New Prescription</h3>
              <p>Create a new prescription</p>
            </router-link>
          </div>
        </div>

        <!-- Recent Prescriptions -->
        <div class="recent-prescriptions">
          <div class="section-header">
            <h2>Recent Prescriptions</h2>
            <router-link to="/app/specialist/pharmacy/prescriptions" class="view-all">
              View All
            </router-link>
          </div>
          <div class="prescriptions-list" v-if="stats.recent_prescriptions?.length">
            <div
              v-for="prescription in stats.recent_prescriptions"
              :key="prescription._id"
              class="prescription-item"
              @click="viewPrescription(prescription._id)"
            >
              <div class="prescription-item__patient">
                <div class="avatar">
                  <img
                    v-if="prescription.patient_avatar"
                    :src="prescription.patient_avatar"
                    :alt="prescription.patient_name"
                  />
                  <span v-else>{{ getInitials(prescription.patient_name) }}</span>
                </div>
                <div class="patient-info">
                  <p class="patient-name">{{ prescription.patient_name || 'Unknown Patient' }}</p>
                  <p class="prescription-number" v-if="prescription.prescription_number">{{ prescription.prescription_number }}</p>
                  <p class="prescription-date">{{ formatDate(prescription.created_at) }}</p>
                </div>
              </div>
              <div class="prescription-item__details">
                <span class="items-count">{{ prescription.items_count || 0 }} items</span>
                <span :class="['status', `status--${prescription.status?.toLowerCase()}`]">
                  {{ formatStatus(prescription.status) }}
                </span>
              </div>
              <div class="prescription-item__amount">
                <p class="amount">NGN {{ formatCurrency(prescription.total_amount) }}</p>
              </div>
              <div class="prescription-item__arrow">
                <rc-icon icon-name="chevron-right" size="sm" />
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <rc-icon icon-name="prescription" size="xl" />
            <p>No recent prescriptions</p>
            <button class="btn btn-secondary" @click="createPrescription">
              Create First Prescription
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

export default {
  name: "PharmacyDashboard",
  components: {
    TopBar,
    Loader,
    RcIcon,
  },
  data() {
    return {
      isLoading: true,
      stats: {
        prescriptions_today: 0,
        prescriptions_this_week: 0,
        prescriptions_this_month: 0,
        pending_payment: 0,
        pending_dispensing: 0,
        total_prescriptions: 0,
        total_patients: 0,
        wallet_balance: 0,
        recent_prescriptions: [],
      },
    };
  },
  async mounted() {
    await this.fetchDashboardStats();
  },
  methods: {
    async fetchDashboardStats() {
      try {
        this.isLoading = true;
        const response = await apiFactory.$_getSpecialistPharmacyDashboard();
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.stats = result;
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        this.$toast.error("Failed to load dashboard data");
      } finally {
        this.isLoading = false;
      }
    },
    formatCurrency(amount) {
      if (!amount) return "0.00";
      return Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    formatDate(date) {
      if (!date) return "";
      return moment(date).format("MMM D, YYYY h:mm A");
    },
    formatStatus(status) {
      if (!status) return "";
      return status.replace(/_/g, " ").toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
    },
    getInitials(name) {
      if (!name) return "?";
      return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    },
    createPrescription() {
      this.$router.push("/app/specialist/pharmacy/prescriptions/create");
    },
    viewPrescription(id) {
      this.$router.push(`/app/specialist/pharmacy/prescriptions/${id}`);
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

.pharmacy-container {
  max-width: 1200px;
  margin: 0 auto;
}

.pharmacy-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $size-24;
  gap: $size-16;

  @include responsive(tab-portrait) {
    flex-direction: column;
  }

  &__title {
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

  &__actions {
    .btn {
      display: flex;
      align-items: center;
      gap: $size-8;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $size-16;
  margin-bottom: $size-24;

  @include responsive(tab-landscape) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: $color-white;
  border-radius: $size-12;
  padding: $size-20;
  display: flex;
  align-items: center;
  gap: $size-16;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &__icon {
    width: $size-48;
    height: $size-48;
    border-radius: $size-12;
    display: flex;
    align-items: center;
    justify-content: center;

    .stat-card--primary & {
      background: rgba($color-pri, 0.1);
      color: $color-pri;
    }

    .stat-card--info & {
      background: rgba(#3b82f6, 0.1);
      color: #3b82f6;
    }

    .stat-card--warning & {
      background: rgba(#f59e0b, 0.1);
      color: #f59e0b;
    }

    .stat-card--success & {
      background: rgba(#10b981, 0.1);
      color: #10b981;
    }
  }

  &__content {
    flex: 1;
  }

  &__value {
    font-size: $size-28;
    font-weight: $fw-bold;
    color: $color-g-21;
    line-height: 1.2;
  }

  &__label {
    font-size: $size-12;
    color: $color-g-54;
    margin-top: $size-4;
  }
}

.wallet-section {
  margin-bottom: $size-24;
}

.wallet-card {
  background: linear-gradient(135deg, $color-pri 0%, darken($color-pri, 15%) 100%);
  border-radius: $size-16;
  padding: $size-24;
  color: $color-white;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $size-16;

    h3 {
      font-size: $size-16;
      font-weight: $fw-medium;
      opacity: 0.9;
    }

    .wallet-link {
      font-size: $size-12;
      color: $color-white;
      text-decoration: underline;
      opacity: 0.8;

      &:hover {
        opacity: 1;
      }
    }
  }

  &__balance {
    display: flex;
    align-items: baseline;
    gap: $size-8;
    margin-bottom: $size-8;

    .currency {
      font-size: $size-18;
      font-weight: $fw-medium;
      opacity: 0.8;
    }

    .amount {
      font-size: $size-36;
      font-weight: $fw-bold;
    }
  }

  &__note {
    font-size: $size-12;
    opacity: 0.7;
  }
}

.quick-actions {
  margin-bottom: $size-32;

  h2 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-16;
  }
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $size-16;

  @include responsive(tab-landscape) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.action-card {
  background: $color-white;
  border-radius: $size-12;
  padding: $size-24;
  text-align: center;
  text-decoration: none;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  &__icon {
    width: $size-56;
    height: $size-56;
    margin: 0 auto $size-16;
    border-radius: 50%;
    background: rgba($color-pri, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-pri;
  }

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-8;
  }

  p {
    font-size: $size-12;
    color: $color-g-54;
    line-height: 1.4;
  }
}

.recent-prescriptions {
  background: $color-white;
  border-radius: $size-16;
  padding: $size-24;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $size-20;

  h2 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }

  .view-all {
    font-size: $size-15;
    color: $color-pri;
    text-decoration: none;
    font-weight: $fw-medium;

    &:hover {
      text-decoration: underline;
    }
  }
}

.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.prescription-item {
  display: flex;
  align-items: center;
  padding: $size-16;
  border-radius: $size-10;
  background: $color-g-97;
  cursor: pointer;
  transition: background 0.2s ease;
  gap: $size-16;

  &:hover {
    background: $color-g-92;
  }

  &__patient {
    display: flex;
    align-items: center;
    gap: $size-12;
    flex: 2;
    min-width: 0;

    .avatar {
      width: $size-40;
      height: $size-40;
      border-radius: 50%;
      background: $color-pri;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
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

    .patient-info {
      min-width: 0;
    }

    .patient-name {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-21;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .prescription-number {
      font-size: $size-11;
      color: $color-pri;
      font-weight: $fw-medium;
      margin-top: $size-2;
    }

    .prescription-date {
      font-size: $size-12;
      color: $color-g-54;
      margin-top: $size-2;
    }
  }

  &__details {
    display: flex;
    align-items: center;
    gap: $size-12;
    flex: 1;

    .items-count {
      font-size: $size-12;
      color: $color-g-54;
    }

    .status {
      font-size: $size-12;
      padding: $size-4 $size-10;
      border-radius: $size-16;
      font-weight: $fw-medium;

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
  }

  &__amount {
    flex: 1;
    text-align: right;

    .amount {
      font-size: $size-15;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }

  &__arrow {
    color: $color-g-54;
  }

  @include responsive(tab-portrait) {
    flex-wrap: wrap;

    &__patient {
      flex: 1 1 100%;
    }

    &__details,
    &__amount {
      flex: 1;
    }

    &__arrow {
      display: none;
    }
  }
}

.empty-state {
  text-align: center;
  padding: $size-48 $size-24;
  color: $color-g-54;

  .icons {
    margin-bottom: $size-16;
    opacity: 0.5;
  }

  p {
    font-size: $size-15;
    margin-bottom: $size-16;
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

  &-primary {
    background: $color-pri;
    color: $color-white;

    &:hover {
      background: darken($color-pri, 10%);
    }
  }

  &-secondary {
    background: $color-g-90;
    color: $color-g-36;

    &:hover {
      background: $color-g-85;
    }
  }
}
</style>
