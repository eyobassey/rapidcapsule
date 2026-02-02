<template>
  <div class="page-content">
    <TopBar showButtons type="title-only" title="Pharmacy / Drug Details" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="drug-details-container">
        <!-- Shimmer Loading -->
        <template v-if="isLoading">
          <div class="skeleton-hero" />
          <div class="skeleton-card" />
          <div class="skeleton-card" />
        </template>

        <template v-else>
          <!-- Hero Section -->
          <div class="hero-section">
            <div class="hero-content">
              <button class="hero-back" @click="router.push('/app/specialist/pharmacy/drugs')">
                <v-icon name="hi-arrow-left" scale="0.75" />
                Catalog
              </button>
              <h1 class="hero-title">
                <v-icon name="ri-capsule-line" scale="1" />
                {{ drug.name }}
              </h1>
              <p class="hero-subtitle">{{ drug.generic_name }} | {{ drug.strength }} | {{ drug.dosage_form }}</p>
              <div class="hero-meta">
                <span class="hero-price">
                  NGN {{ formatCurrency(drug.selling_price) }}
                  <small>/ unit</small>
                </span>
                <span class="hero-stock-badge" :class="getStockClass(drug)">
                  {{ getStockLabel(drug) }}
                </span>
              </div>
            </div>
            <div class="hero-actions">
              <button
                class="hero-action-btn"
                :disabled="drug.is_out_of_stock || drug.quantity === 0"
                @click="prescribeDrug"
              >
                <v-icon name="ri-capsule-line" scale="0.85" />
                Prescribe
              </button>
            </div>
          </div>

          <!-- Drug Info Section -->
          <div class="drug-info-card">
            <div class="drug-image">
              <img
                v-if="drug.primary_image || drug.images?.[0]?.url"
                :src="drug.primary_image || drug.images?.[0]?.url"
                :alt="drug.name"
              />
              <div v-else class="drug-placeholder">
                <v-icon name="ri-capsule-line" scale="2.5" />
              </div>
              <span v-if="drug.requires_prescription" class="rx-badge">
                <v-icon name="ri-capsule-line" scale="0.7" />
                Rx Required
              </span>
            </div>

            <div class="drug-details">
              <div class="section-title">
                <v-icon name="hi-information-circle" scale="0.85" />
                <h3>Drug Information</h3>
              </div>
              <div class="details-grid">
                <div class="detail-item">
                  <div class="detail-icon">
                    <v-icon name="hi-beaker" scale="0.7" />
                  </div>
                  <div class="detail-text">
                    <span class="label">Strength</span>
                    <span class="value">{{ drug.strength }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-icon">
                    <v-icon name="ri-capsule-line" scale="0.7" />
                  </div>
                  <div class="detail-text">
                    <span class="label">Dosage Form</span>
                    <span class="value">{{ drug.dosage_form }}</span>
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-icon">
                    <v-icon name="hi-office-building" scale="0.7" />
                  </div>
                  <div class="detail-text">
                    <span class="label">Manufacturer</span>
                    <span class="value">{{ drug.manufacturer }}</span>
                  </div>
                </div>
                <div v-if="drug.brand_name" class="detail-item">
                  <div class="detail-icon">
                    <v-icon name="hi-tag" scale="0.7" />
                  </div>
                  <div class="detail-text">
                    <span class="label">Brand</span>
                    <span class="value">{{ drug.brand_name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Categories -->
          <div v-if="drug.categories?.length" class="info-card">
            <div class="section-title">
              <v-icon name="hi-tag" scale="0.85" />
              <h3>Categories</h3>
            </div>
            <div class="tags-list">
              <span v-for="category in drug.categories" :key="category" class="tag">{{ category }}</span>
            </div>
          </div>

          <!-- Description -->
          <div v-if="drug.description" class="info-card">
            <div class="section-title">
              <v-icon name="hi-document-text" scale="0.85" />
              <h3>Description</h3>
            </div>
            <p class="info-text">{{ drug.description }}</p>
          </div>

          <!-- Dosage Guidance -->
          <div v-if="drug.dosage_guidance" class="info-card">
            <div class="section-title">
              <v-icon name="hi-clipboard-list" scale="0.85" />
              <h3>Dosage Guidance</h3>
            </div>
            <div class="dosage-sections">
              <div v-if="drug.dosage_guidance.adult" class="dosage-section">
                <h4>
                  <v-icon name="hi-user" scale="0.7" />
                  Adult Dosage
                </h4>
                <div class="dosage-grid">
                  <div v-if="drug.dosage_guidance.adult.dose" class="dosage-item">
                    <span class="label">Dose</span>
                    <span class="value">{{ drug.dosage_guidance.adult.dose }}</span>
                  </div>
                  <div v-if="drug.dosage_guidance.adult.frequency" class="dosage-item">
                    <span class="label">Frequency</span>
                    <span class="value">{{ drug.dosage_guidance.adult.frequency }}</span>
                  </div>
                  <div v-if="drug.dosage_guidance.adult.max_daily_dose" class="dosage-item">
                    <span class="label">Max Daily Dose</span>
                    <span class="value">{{ drug.dosage_guidance.adult.max_daily_dose }}</span>
                  </div>
                </div>
                <p v-if="drug.dosage_guidance.adult.instructions" class="instructions">
                  {{ drug.dosage_guidance.adult.instructions }}
                </p>
              </div>

              <div v-if="drug.dosage_guidance.pediatric" class="dosage-section">
                <h4>
                  <v-icon name="hi-user" scale="0.6" />
                  Pediatric Dosage
                </h4>
                <div class="dosage-grid">
                  <div v-if="drug.dosage_guidance.pediatric.dose" class="dosage-item">
                    <span class="label">Dose</span>
                    <span class="value">{{ drug.dosage_guidance.pediatric.dose }}</span>
                  </div>
                  <div v-if="drug.dosage_guidance.pediatric.frequency" class="dosage-item">
                    <span class="label">Frequency</span>
                    <span class="value">{{ drug.dosage_guidance.pediatric.frequency }}</span>
                  </div>
                  <div v-if="drug.dosage_guidance.pediatric.min_age_months" class="dosage-item">
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
          <div v-if="drug.warnings?.length" class="info-card warning-card">
            <div class="section-title">
              <v-icon name="hi-exclamation" scale="0.85" />
              <h3>Warnings</h3>
            </div>
            <ul class="warning-list">
              <li v-for="warning in drug.warnings" :key="warning">{{ warning }}</li>
            </ul>
          </div>

          <!-- Contraindications -->
          <div v-if="drug.contraindications?.length" class="info-card">
            <div class="section-title">
              <v-icon name="hi-ban" scale="0.85" />
              <h3>Contraindications</h3>
            </div>
            <ul class="info-list">
              <li v-for="item in drug.contraindications" :key="item">{{ item }}</li>
            </ul>
          </div>

          <!-- Side Effects -->
          <div v-if="drug.side_effects?.length" class="info-card">
            <div class="section-title">
              <v-icon name="hi-exclamation-circle" scale="0.85" />
              <h3>Side Effects</h3>
            </div>
            <ul class="info-list">
              <li v-for="effect in drug.side_effects" :key="effect">{{ effect }}</li>
            </ul>
          </div>

          <!-- Stock Batches -->
          <div v-if="batches.length" class="info-card">
            <div class="section-title">
              <v-icon name="hi-cube" scale="0.85" />
              <h3>Available Batches</h3>
            </div>
            <div class="batches-list">
              <div v-for="batch in batches" :key="batch._id" class="batch-item">
                <div class="batch-item__info">
                  <span class="batch-number">{{ batch.batch_number }}</span>
                  <span class="batch-qty">{{ batch.quantity_available }} units</span>
                </div>
                <div class="batch-item__expiry" :class="{ 'expiring-soon': isExpiringSoon(batch.expiry_date) }">
                  <v-icon name="hi-calendar" scale="0.7" />
                  {{ batch.no_expiry ? 'No Expiry' : formatDate(batch.expiry_date) }}
                </div>
                <PharmacyStatusBadge :status="batch.status" />
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import { differenceInDays, parseISO } from 'date-fns';
import TopBar from '@/components/Navigation/top-bar';
import apiFactory from '@/services/apiFactory';
import PharmacyStatusBadge from './components/PharmacyStatusBadge.vue';
import { usePharmacy } from './composables/usePharmacy';

const router = useRouter();
const route = useRoute();
const $toast = useToast();
const { formatCurrency, formatDate, getStockClass, getStockLabel } = usePharmacy();

const isLoading = ref(true);
const drug = ref({});
const batches = ref([]);

const drugId = computed(() => route.params.id);
const batchId = computed(() => route.query.batch || null);

function isExpiringSoon(date) {
  if (!date) return false;
  const parsed = typeof date === 'string' ? parseISO(date) : new Date(date);
  return differenceInDays(parsed, new Date()) <= 90;
}

function prescribeDrug() {
  const query = { drug: drugId.value };
  if (batchId.value) {
    query.batch = batchId.value;
  }
  router.push({ path: '/app/specialist/pharmacy/prescriptions/create', query });
}

async function fetchDrugDetails() {
  try {
    isLoading.value = true;
    const params = {};
    if (batchId.value) {
      params.batch_id = batchId.value;
    }
    const response = await apiFactory.$_getPharmacyDrugDetails(drugId.value, params);
    const result = response.data?.data || response.data?.result;
    if (result) {
      drug.value = result;
    }
  } catch (error) {
    console.error('Error fetching drug details:', error);
    $toast.error('Failed to load drug details');
  } finally {
    isLoading.value = false;
  }
}

async function fetchBatches() {
  try {
    const response = await apiFactory.$_getPharmacyDrugBatches(drugId.value);
    const result = response.data?.data || response.data?.result;
    if (result) {
      batches.value = result || [];
    }
  } catch (error) {
    console.error('Error fetching batches:', error);
  }
}

onMounted(() => {
  Promise.all([fetchDrugDetails(), fetchBatches()]);
});
</script>

<style scoped lang="scss">
.page-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  padding: 0 128px;

  @include responsive(tab-portrait) {
    padding: 0;
  }

  @include responsive(phone) {
    padding: 0;
  }

  &__body {
    width: 100%;
    padding: $size-24 $size-32;
    overflow-y: auto;

    @include responsive(phone) {
      padding: $size-16;
    }

    &::-webkit-scrollbar {
      display: none;
    }
  }
}

.drug-details-container {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: $size-24;
  padding-bottom: $size-32;
}

// Skeleton Hero
.skeleton-hero {
  border-radius: $size-20;
  height: 160px;
  background: linear-gradient(135deg, rgba(14, 174, 196, 0.15) 0%, rgba(14, 174, 196, 0.08) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;

  @include responsive(phone) {
    height: 200px;
    border-radius: $size-12;
  }
}

// Hero Section
.hero-section {
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: $size-20;
  padding: $size-24 $size-28;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(14, 174, 196, 0.25);
  color: white;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  @include responsive(tab-portrait) {
    flex-direction: column;
    align-items: flex-start;
    gap: $size-16;
    padding: $size-20;
    border-radius: $size-16;
  }

  @include responsive(phone) {
    padding: $size-16;
    border-radius: $size-12;
  }

  .hero-content {
    z-index: 1;
    flex: 1;
    min-width: 0;

    .hero-back {
      display: inline-flex;
      align-items: center;
      gap: $size-4;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      font-size: $size-12;
      font-weight: $fw-medium;
      padding: $size-4 $size-10;
      border-radius: $size-8;
      cursor: pointer;
      margin-bottom: $size-12;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }

    .hero-title {
      display: flex;
      align-items: center;
      gap: $size-8;
      font-size: $size-20;
      font-weight: $fw-bold;
      margin-bottom: $size-4;

      @include responsive(phone) {
        font-size: $size-18;
      }
    }

    .hero-subtitle {
      font-size: $size-13;
      opacity: 0.85;
      margin-bottom: $size-10;
    }

    .hero-meta {
      display: flex;
      align-items: center;
      gap: $size-12;
      flex-wrap: wrap;

      .hero-price {
        font-size: $size-16;
        font-weight: $fw-bold;

        small {
          font-size: $size-12;
          font-weight: $fw-medium;
          opacity: 0.75;
        }
      }

      .hero-stock-badge {
        font-size: $size-11;
        font-weight: $fw-semi-bold;
        padding: $size-4 $size-10;
        border-radius: $size-6;
        background: rgba(255, 255, 255, 0.2);

        &.delivered, &.in_stock { background: rgba(16, 185, 129, 0.3); }
        &.cancelled, &.out_of_stock { background: rgba(239, 68, 68, 0.3); }
        &.pending_payment, &.low_stock { background: rgba(245, 158, 11, 0.3); }
      }
    }
  }

  .hero-actions {
    z-index: 1;

    .hero-action-btn {
      display: flex;
      align-items: center;
      gap: $size-8;
      padding: $size-12 $size-20;
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      border-radius: $size-10;
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.3);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

// Drug Info Card
.drug-info-card {
  display: flex;
  gap: $size-24;
  background: white;
  border-radius: $size-16;
  padding: $size-24;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  @include responsive(phone) {
    flex-direction: column;
    padding: $size-16;
  }
}

.drug-image {
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: $size-12;
  overflow: hidden;
  background: $color-g-97;
  flex-shrink: 0;

  @include responsive(phone) {
    width: 100%;
    height: 200px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .drug-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-g-77;
  }

  .rx-badge {
    position: absolute;
    bottom: $size-8;
    left: $size-8;
    display: flex;
    align-items: center;
    gap: $size-4;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    font-size: $size-11;
    font-weight: $fw-medium;
    padding: $size-4 $size-10;
    border-radius: $size-6;
  }
}

.drug-details {
  flex: 1;
  min-width: 0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-12;
  margin-bottom: $size-16;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.detail-item {
  display: flex;
  align-items: center;
  gap: $size-10;
  padding: $size-10;
  background: $color-g-97;
  border-radius: $size-8;

  .detail-icon {
    width: 28px;
    height: 28px;
    border-radius: $size-6;
    background: rgba(14, 174, 196, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0EAEC4;
    flex-shrink: 0;
  }

  .detail-text {
    display: flex;
    flex-direction: column;

    .label {
      font-size: $size-11;
      color: $color-g-54;
    }

    .value {
      font-size: $size-13;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }
}


// Info Cards
.info-card {
  background: white;
  border-radius: $size-16;
  padding: $size-24;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  @include responsive(phone) {
    padding: $size-16;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: $size-8;
  margin-bottom: $size-16;

  svg {
    color: #0EAEC4;
  }

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin: 0;
  }
}

.warning-card {
  border-left: 4px solid #f59e0b;

  .section-title svg {
    color: #f59e0b;
  }
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: $size-8;
}

.tag {
  font-size: $size-12;
  padding: $size-6 $size-12;
  background: rgba(14, 174, 196, 0.08);
  border-radius: $size-6;
  color: #0891b2;
  font-weight: $fw-medium;
}

.info-text {
  font-size: $size-14;
  color: $color-g-44;
  line-height: 1.6;
}

.info-list, .warning-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $size-8;

  li {
    font-size: $size-13;
    color: $color-g-44;
    padding-left: $size-16;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #0EAEC4;
    }
  }
}

.warning-list li::before {
  background: #f59e0b;
}

// Dosage Sections
.dosage-sections {
  display: flex;
  flex-direction: column;
  gap: $size-16;
}

.dosage-section {
  padding: $size-16;
  background: $color-g-97;
  border-radius: $size-12;
  border-left: 3px solid #0EAEC4;

  h4 {
    display: flex;
    align-items: center;
    gap: $size-6;
    font-size: $size-14;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-12;

    svg {
      color: #0EAEC4;
    }
  }
}

.dosage-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $size-10;
  margin-bottom: $size-10;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.dosage-item {
  display: flex;
  flex-direction: column;
  gap: $size-2;

  .label {
    font-size: $size-11;
    color: $color-g-54;
    font-weight: $fw-medium;
  }

  .value {
    font-size: $size-13;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

.instructions {
  font-size: $size-13;
  color: $color-g-44;
  font-style: italic;
  line-height: 1.5;
}

// Batches
.batches-list {
  display: flex;
  flex-direction: column;
  gap: $size-10;
}

.batch-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $size-12 $size-14;
  background: $color-g-97;
  border-radius: $size-10;

  @include responsive(phone) {
    flex-wrap: wrap;
    gap: $size-8;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: $size-2;

    .batch-number {
      font-size: $size-13;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }

    .batch-qty {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  &__expiry {
    display: flex;
    align-items: center;
    gap: $size-4;
    font-size: $size-12;
    color: $color-g-44;

    svg {
      color: $color-g-54;
    }

    &.expiring-soon {
      color: #d97706;
      svg { color: #d97706; }
    }
  }
}

// Skeleton
.skeleton-card {
  height: 160px;
  border-radius: $size-16;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;

  &--lg { height: 260px; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
