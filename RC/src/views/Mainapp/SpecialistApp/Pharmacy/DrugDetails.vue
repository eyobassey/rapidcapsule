<template>
  <div class="page-content">
    <TopBar showButtons type="avatar" @open-side-nav="$emit('openSideNav')" />
    <loader v-if="isLoading" :useOverlay="false" style="position: absolute" />
    <div v-else class="page-content__body">
      <div class="drug-details-container">
        <!-- Header -->
        <div class="page-header">
          <button class="back-btn" @click="$router.back()">
            <rc-icon icon-name="arrow-left" size="sm" />
          </button>
          <div class="header-content">
            <h1>Drug Details</h1>
          </div>
        </div>

        <!-- Main Content -->
        <div class="drug-content">
          <!-- Drug Info Section -->
          <div class="drug-info-section">
            <div class="drug-image">
              <img
                v-if="drug.primary_image || drug.images?.[0]?.url"
                :src="drug.primary_image || drug.images?.[0]?.url"
                :alt="drug.name"
              />
              <div v-else class="drug-placeholder">
                <rc-icon icon-name="pill" size="xl" />
              </div>
              <span
                v-if="drug.requires_prescription"
                class="rx-badge"
              >
                Requires Prescription
              </span>
            </div>

            <div class="drug-details">
              <h2>{{ drug.name }}</h2>
              <p class="generic-name">{{ drug.generic_name }}</p>

              <div class="details-grid">
                <div class="detail-item">
                  <span class="label">Strength</span>
                  <span class="value">{{ drug.strength }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Dosage Form</span>
                  <span class="value">{{ drug.dosage_form }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">Manufacturer</span>
                  <span class="value">{{ drug.manufacturer }}</span>
                </div>
                <div class="detail-item" v-if="drug.brand_name">
                  <span class="label">Brand</span>
                  <span class="value">{{ drug.brand_name }}</span>
                </div>
              </div>

              <div class="price-stock">
                <div class="price">
                  <span class="currency">NGN</span>
                  <span class="amount">{{ formatCurrency(drug.selling_price) }}</span>
                  <span class="unit">/ unit</span>
                </div>
                <div :class="['stock-badge', getStockClass(drug)]">
                  {{ getStockText(drug) }}
                </div>
              </div>

              <div class="action-buttons">
                <button
                  class="prescribe-btn"
                  @click="prescribeDrug"
                  :disabled="drug.is_out_of_stock || drug.quantity === 0"
                >
                  <rc-icon icon-name="prescription" size="sm" />
                  Prescribe This Medication
                </button>
              </div>
            </div>
          </div>

          <!-- Categories -->
          <div class="info-card" v-if="drug.categories?.length">
            <h3>Categories</h3>
            <div class="tags-list">
              <span v-for="category in drug.categories" :key="category" class="tag">
                {{ category }}
              </span>
            </div>
          </div>

          <!-- Description -->
          <div class="info-card" v-if="drug.description">
            <h3>Description</h3>
            <p>{{ drug.description }}</p>
          </div>

          <!-- Dosage Guidance -->
          <div class="info-card" v-if="drug.dosage_guidance">
            <h3>Dosage Guidance</h3>
            <div class="dosage-sections">
              <div class="dosage-section" v-if="drug.dosage_guidance.adult">
                <h4>Adult Dosage</h4>
                <div class="dosage-grid">
                  <div class="dosage-item" v-if="drug.dosage_guidance.adult.dose">
                    <span class="label">Dose</span>
                    <span class="value">{{ drug.dosage_guidance.adult.dose }}</span>
                  </div>
                  <div class="dosage-item" v-if="drug.dosage_guidance.adult.frequency">
                    <span class="label">Frequency</span>
                    <span class="value">{{ drug.dosage_guidance.adult.frequency }}</span>
                  </div>
                  <div class="dosage-item" v-if="drug.dosage_guidance.adult.max_daily_dose">
                    <span class="label">Max Daily Dose</span>
                    <span class="value">{{ drug.dosage_guidance.adult.max_daily_dose }}</span>
                  </div>
                </div>
                <p v-if="drug.dosage_guidance.adult.instructions" class="instructions">
                  {{ drug.dosage_guidance.adult.instructions }}
                </p>
              </div>

              <div class="dosage-section" v-if="drug.dosage_guidance.pediatric">
                <h4>Pediatric Dosage</h4>
                <div class="dosage-grid">
                  <div class="dosage-item" v-if="drug.dosage_guidance.pediatric.dose">
                    <span class="label">Dose</span>
                    <span class="value">{{ drug.dosage_guidance.pediatric.dose }}</span>
                  </div>
                  <div class="dosage-item" v-if="drug.dosage_guidance.pediatric.frequency">
                    <span class="label">Frequency</span>
                    <span class="value">{{ drug.dosage_guidance.pediatric.frequency }}</span>
                  </div>
                  <div class="dosage-item" v-if="drug.dosage_guidance.pediatric.min_age_months">
                    <span class="label">Minimum Age</span>
                    <span class="value">{{ drug.dosage_guidance.pediatric.min_age_months }} months</span>
                  </div>
                </div>
                <p v-if="drug.dosage_guidance.pediatric.instructions" class="instructions">
                  {{ drug.dosage_guidance.pediatric.instructions }}
                </p>
              </div>
            </div>
          </div>

          <!-- Warnings -->
          <div class="info-card warning-card" v-if="drug.warnings?.length">
            <h3>
              <rc-icon icon-name="warning" size="sm" />
              Warnings
            </h3>
            <ul class="warning-list">
              <li v-for="warning in drug.warnings" :key="warning">{{ warning }}</li>
            </ul>
          </div>

          <!-- Contraindications -->
          <div class="info-card" v-if="drug.contraindications?.length">
            <h3>Contraindications</h3>
            <ul class="info-list">
              <li v-for="item in drug.contraindications" :key="item">{{ item }}</li>
            </ul>
          </div>

          <!-- Side Effects -->
          <div class="info-card" v-if="drug.side_effects?.length">
            <h3>Side Effects</h3>
            <ul class="info-list">
              <li v-for="effect in drug.side_effects" :key="effect">{{ effect }}</li>
            </ul>
          </div>

          <!-- Stock Batches -->
          <div class="info-card" v-if="batches.length">
            <h3>Available Batches</h3>
            <div class="batches-table">
              <table>
                <thead>
                  <tr>
                    <th>Batch #</th>
                    <th>Quantity</th>
                    <th>Expiry Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="batch in batches" :key="batch._id">
                    <td>{{ batch.batch_number }}</td>
                    <td>{{ batch.quantity_available }}</td>
                    <td :class="{ 'expiring-soon': isExpiringSoon(batch.expiry_date) }">
                      {{ batch.no_expiry ? 'No Expiry' : formatDate(batch.expiry_date) }}
                    </td>
                    <td>
                      <span :class="['batch-status', `batch-status--${batch.status}`]">
                        {{ batch.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
  name: "DrugDetails",
  components: {
    TopBar,
    Loader,
    RcIcon,
  },
  data() {
    return {
      isLoading: true,
      drug: {},
      batches: [],
    };
  },
  computed: {
    drugId() {
      return this.$route.params.id;
    },
    batchId() {
      return this.$route.query.batch || null;
    },
  },
  async mounted() {
    await Promise.all([
      this.fetchDrugDetails(),
      this.fetchBatches(),
    ]);
  },
  methods: {
    async fetchDrugDetails() {
      try {
        this.isLoading = true;
        const params = {};
        if (this.batchId) {
          params.batch_id = this.batchId;
        }
        const response = await apiFactory.$_getPharmacyDrugDetails(this.drugId, params);
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.drug = result;
        }
      } catch (error) {
        console.error("Error fetching drug details:", error);
        this.$toast.error("Failed to load drug details");
      } finally {
        this.isLoading = false;
      }
    },
    async fetchBatches() {
      try {
        const response = await apiFactory.$_getPharmacyDrugBatches(this.drugId, {
          status: "active",
          page: 1,
          limit: 10,
        });
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.batches = result.batches || [];
        }
      } catch (error) {
        console.error("Error fetching batches:", error);
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
      if (!date) return "N/A";
      return moment(date).format("MMM D, YYYY");
    },
    getStockClass(drug) {
      if (drug.is_out_of_stock || drug.quantity === 0) return "out-of-stock";
      if (drug.is_low_stock || drug.quantity <= drug.reorder_level) return "low-stock";
      return "in-stock";
    },
    getStockText(drug) {
      if (drug.is_out_of_stock || drug.quantity === 0) return "Out of Stock";
      if (drug.is_low_stock || drug.quantity <= drug.reorder_level) {
        return `Low Stock: ${drug.quantity} units`;
      }
      return `In Stock: ${drug.quantity} units`;
    },
    isExpiringSoon(date) {
      if (!date) return false;
      const daysUntilExpiry = moment(date).diff(moment(), "days");
      return daysUntilExpiry <= 90;
    },
    prescribeDrug() {
      // Navigate to create prescription page with this drug pre-selected
      const query = { drug: this.drugId };
      if (this.batchId) {
        query.batch = this.batchId;
      }
      this.$router.push({
        path: '/app/specialist/pharmacy/prescriptions/create',
        query,
      });
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

.drug-details-container {
  max-width: 900px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: $size-16;
  margin-bottom: $size-24;

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

  .header-content {
    flex: 1;

    h1 {
      font-size: $size-24;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }
}

.drug-info-section {
  display: flex;
  gap: $size-24;
  background: $color-white;
  padding: $size-24;
  border-radius: $size-16;
  margin-bottom: $size-20;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  @include responsive(tab-portrait) {
    flex-direction: column;
  }
}

.drug-image {
  position: relative;
  width: 240px;
  height: 240px;
  flex-shrink: 0;
  border-radius: $size-12;
  overflow: hidden;
  background: $color-g-97;
  display: flex;
  align-items: center;
  justify-content: center;

  @include responsive(tab-portrait) {
    width: 100%;
    height: 200px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .drug-placeholder {
    color: $color-g-77;
  }

  .rx-badge {
    position: absolute;
    bottom: $size-12;
    left: $size-12;
    background: $color-pri;
    color: $color-white;
    font-size: $size-11;
    font-weight: $fw-medium;
    padding: $size-6 $size-12;
    border-radius: $size-16;
  }
}

.drug-details {
  flex: 1;

  h2 {
    font-size: $size-24;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-4;
  }

  .generic-name {
    font-size: $size-16;
    color: $color-pri;
    font-style: italic;
    margin-bottom: $size-20;
  }
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-12;
  margin-bottom: $size-20;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: $size-2;

  .label {
    font-size: $size-12;
    color: $color-g-54;
    text-transform: uppercase;
  }

  .value {
    font-size: $size-15;
    font-weight: $fw-medium;
    color: $color-g-36;
  }
}

.price-stock {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: $size-16;
  border-top: 1px solid $color-g-92;
}

.action-buttons {
  margin-top: $size-20;
  padding-top: $size-16;
  border-top: 1px solid $color-g-92;

  .prescribe-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-10;
    padding: $size-14 $size-20;
    background: $color-pri;
    color: $color-white;
    border: none;
    border-radius: $size-10;
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: darken($color-pri, 8%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba($color-pri, 0.3);
    }

    &:disabled {
      background: $color-g-85;
      color: $color-g-54;
      cursor: not-allowed;
    }
  }
}

.price {
  display: flex;
  align-items: baseline;
  gap: $size-4;

  .currency {
    font-size: $size-15;
    color: $color-g-54;
  }

  .amount {
    font-size: $size-28;
    font-weight: $fw-bold;
    color: $color-g-21;
  }

  .unit {
    font-size: $size-12;
    color: $color-g-54;
  }
}

.stock-badge {
  font-size: $size-12;
  padding: $size-8 $size-16;
  border-radius: $size-20;
  font-weight: $fw-medium;

  &.in-stock {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &.low-stock {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &.out-of-stock {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }
}

.info-card {
  background: $color-white;
  padding: $size-20;
  border-radius: $size-12;
  margin-bottom: $size-16;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-12;
    display: flex;
    align-items: center;
    gap: $size-8;
  }

  p {
    font-size: $size-15;
    color: $color-g-44;
    line-height: 1.6;
  }
}

.warning-card {
  background: rgba(#f59e0b, 0.05);
  border: 1px solid rgba(#f59e0b, 0.2);

  h3 {
    color: #d97706;
  }
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: $size-8;
}

.tag {
  padding: $size-6 $size-12;
  border-radius: $size-16;
  font-size: $size-12;
  background: rgba($color-pri, 0.1);
  color: $color-pri;
}

.dosage-sections {
  display: flex;
  flex-direction: column;
  gap: $size-20;
}

.dosage-section {
  h4 {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-36;
    margin-bottom: $size-12;
  }

  .instructions {
    margin-top: $size-12;
    font-style: italic;
    color: $color-g-54;
  }
}

.dosage-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $size-12;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.dosage-item {
  padding: $size-10;
  background: $color-g-97;
  border-radius: $size-8;

  .label {
    display: block;
    font-size: $size-11;
    color: $color-g-54;
    margin-bottom: $size-4;
  }

  .value {
    font-size: $size-15;
    font-weight: $fw-medium;
    color: $color-g-36;
  }
}

.warning-list,
.info-list {
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    position: relative;
    padding-left: $size-20;
    margin-bottom: $size-8;
    font-size: $size-15;
    color: $color-g-44;
    line-height: 1.5;

    &::before {
      content: "•";
      position: absolute;
      left: 0;
      color: $color-pri;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.warning-list li::before {
  color: #d97706;
}

.batches-table {
  overflow-x: auto;

  table {
    width: 100%;
    border-collapse: collapse;

    th,
    td {
      padding: $size-12;
      text-align: left;
      border-bottom: 1px solid $color-g-92;
    }

    th {
      font-size: $size-12;
      font-weight: $fw-semi-bold;
      color: $color-g-54;
      text-transform: uppercase;
    }

    td {
      font-size: $size-15;
      color: $color-g-36;
    }

    .expiring-soon {
      color: #d97706;
    }
  }
}

.batch-status {
  font-size: $size-11;
  padding: $size-4 $size-8;
  border-radius: $size-12;
  font-weight: $fw-medium;
  text-transform: capitalize;

  &--active {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--quarantine {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--expired,
  &--recalled {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }
}
</style>
