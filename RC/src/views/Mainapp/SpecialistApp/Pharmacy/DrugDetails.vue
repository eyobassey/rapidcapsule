<template>
  <div class="drug-details-page">
    <!-- Ambient Background -->
    <div class="ambient-bg">
      <div class="orb orb--1" />
      <div class="orb orb--2" />
      <div class="orb orb--3" />
    </div>

    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="back-btn" @click="router.push('/app/specialist/pharmacy/drugs')">
        <v-icon name="hi-arrow-left" scale="1.1" />
      </button>
      <h1 class="mobile-title">Drug Details</h1>
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.1" />
      </button>
    </header>

    <!-- Page Container -->
    <div class="page-container">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs">
        <router-link to="/app/specialist" class="breadcrumb-item">
          <v-icon name="hi-home" scale="0.7" />
          Home
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <router-link to="/app/specialist/pharmacy" class="breadcrumb-item">
          Pharmacy
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <router-link to="/app/specialist/pharmacy/drugs" class="breadcrumb-item">
          Drugs
        </router-link>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">{{ drug.name || 'Details' }}</span>
      </nav>

      <div class="drug-details-container">
        <!-- Shimmer Loading -->
        <template v-if="isLoading">
          <div class="skeleton-hero" />
          <div class="skeleton-card" />
          <div class="skeleton-card" />
        </template>

        <template v-else>
          <!-- Hero Section -->
          <section class="hero">
            <div class="hero__content">
              <button class="back-link desktop-only" @click="router.push('/app/specialist/pharmacy/drugs')">
                <v-icon name="hi-arrow-left" scale="0.8" />
                <span>Back to Catalog</span>
              </button>
              <div class="hero__badge">
                <div class="badge-pulse"></div>
                <v-icon name="ri-capsule-line" />
                <span>{{ drug.dosage_form || 'Medication' }}</span>
              </div>
              <h1 class="hero__title">
                {{ drug.name?.split(' ').slice(0, 2).join(' ') }}<br/>
                <span class="hero__title-accent">{{ drug.name?.split(' ').slice(2).join(' ') || drug.strength }}</span>
              </h1>
              <p class="hero__subtitle">{{ drug.generic_name }}</p>
              <div class="hero__stats">
                <div class="hero-stat hero-stat--price">
                  <span class="hero-stat__value">NGN {{ formatCurrency(drug.selling_price) }}</span>
                  <span class="hero-stat__label">Per Unit</span>
                </div>
                <div class="hero-stat">
                  <span class="hero-stat__value">{{ drug.quantity || 0 }}</span>
                  <span class="hero-stat__label">In Stock</span>
                </div>
                <div class="hero-stat">
                  <span class="hero-stat__value">{{ batches.length || 0 }}</span>
                  <span class="hero-stat__label">Batches</span>
                </div>
              </div>
            </div>
            <div class="hero__visual">
              <div class="drug-orb">
                <div class="orb-glow"></div>
                <div class="orb-ring orb-ring--1"></div>
                <div class="orb-ring orb-ring--2"></div>
                <div class="orb-center">
                  <img
                    v-if="drug.primary_image || drug.images?.[0]?.url"
                    :src="drug.primary_image || drug.images?.[0]?.url"
                    :alt="drug.name"
                    class="orb-image"
                  />
                  <v-icon v-else name="ri-capsule-line" scale="2.5" />
                </div>
              </div>
              <button
                class="prescribe-fab"
                :disabled="drug.is_out_of_stock || drug.quantity === 0"
                @click="prescribeDrug"
              >
                <v-icon name="hi-plus-circle" scale="1" />
                <span>Prescribe</span>
              </button>
            </div>
          </section>

          <!-- Drug Image & Info Card -->
          <div class="drug-main-card glass-card">
            <div class="drug-image-section">
              <div class="drug-image">
                <img
                  v-if="drug.primary_image || drug.images?.[0]?.url"
                  :src="drug.primary_image || drug.images?.[0]?.url"
                  :alt="drug.name"
                />
                <div v-else class="drug-placeholder">
                  <v-icon name="ri-capsule-line" scale="3" />
                </div>
                <span v-if="drug.requires_prescription" class="rx-badge">
                  <v-icon name="hi-clipboard-check" scale="0.6" />
                  Rx Required
                </span>
              </div>
            </div>

            <div class="drug-info-section">
              <div class="section-header">
                <v-icon name="hi-information-circle" scale="0.85" />
                <h3>Drug Information</h3>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-icon info-icon--sky">
                    <v-icon name="hi-beaker" scale="0.7" />
                  </div>
                  <div class="info-content">
                    <span class="info-label">Strength</span>
                    <span class="info-value">{{ drug.strength }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-icon info-icon--violet">
                    <v-icon name="ri-capsule-line" scale="0.7" />
                  </div>
                  <div class="info-content">
                    <span class="info-label">Dosage Form</span>
                    <span class="info-value">{{ drug.dosage_form }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-icon info-icon--emerald">
                    <v-icon name="hi-office-building" scale="0.7" />
                  </div>
                  <div class="info-content">
                    <span class="info-label">Manufacturer</span>
                    <span class="info-value">{{ drug.manufacturer }}</span>
                  </div>
                </div>
                <div v-if="drug.brand_name" class="info-item">
                  <div class="info-icon info-icon--amber">
                    <v-icon name="hi-tag" scale="0.7" />
                  </div>
                  <div class="info-content">
                    <span class="info-label">Brand</span>
                    <span class="info-value">{{ drug.brand_name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Categories -->
          <div v-if="drug.categories?.length" class="info-card glass-card">
            <div class="section-header">
              <v-icon name="hi-tag" scale="0.85" />
              <h3>Categories</h3>
            </div>
            <div class="tags-list">
              <span v-for="category in drug.categories" :key="category" class="tag">{{ category }}</span>
            </div>
          </div>

          <!-- Description -->
          <div v-if="drug.description" class="info-card glass-card">
            <div class="section-header">
              <v-icon name="hi-document-text" scale="0.85" />
              <h3>Description</h3>
            </div>
            <p class="description-text">{{ drug.description }}</p>
          </div>

          <!-- Dosage Guidance -->
          <div v-if="drug.dosage_guidance" class="info-card glass-card">
            <div class="section-header">
              <v-icon name="hi-clipboard-list" scale="0.85" />
              <h3>Dosage Guidance</h3>
            </div>
            <div class="dosage-sections">
              <div v-if="drug.dosage_guidance.adult" class="dosage-section dosage-section--adult">
                <h4>
                  <v-icon name="hi-user" scale="0.7" />
                  Adult Dosage
                </h4>
                <div class="dosage-grid">
                  <div v-if="drug.dosage_guidance.adult.dose" class="dosage-item">
                    <span class="dosage-label">Dose</span>
                    <span class="dosage-value">{{ drug.dosage_guidance.adult.dose }}</span>
                  </div>
                  <div v-if="drug.dosage_guidance.adult.frequency" class="dosage-item">
                    <span class="dosage-label">Frequency</span>
                    <span class="dosage-value">{{ drug.dosage_guidance.adult.frequency }}</span>
                  </div>
                  <div v-if="drug.dosage_guidance.adult.max_daily_dose" class="dosage-item">
                    <span class="dosage-label">Max Daily Dose</span>
                    <span class="dosage-value">{{ drug.dosage_guidance.adult.max_daily_dose }}</span>
                  </div>
                </div>
                <p v-if="drug.dosage_guidance.adult.instructions" class="dosage-instructions">
                  <v-icon name="hi-information-circle" scale="0.65" />
                  {{ drug.dosage_guidance.adult.instructions }}
                </p>
              </div>

              <div v-if="drug.dosage_guidance.pediatric" class="dosage-section dosage-section--pediatric">
                <h4>
                  <v-icon name="hi-user" scale="0.6" />
                  Pediatric Dosage
                </h4>
                <div class="dosage-grid">
                  <div v-if="drug.dosage_guidance.pediatric.dose" class="dosage-item">
                    <span class="dosage-label">Dose</span>
                    <span class="dosage-value">{{ drug.dosage_guidance.pediatric.dose }}</span>
                  </div>
                  <div v-if="drug.dosage_guidance.pediatric.frequency" class="dosage-item">
                    <span class="dosage-label">Frequency</span>
                    <span class="dosage-value">{{ drug.dosage_guidance.pediatric.frequency }}</span>
                  </div>
                  <div v-if="drug.dosage_guidance.pediatric.min_age_months" class="dosage-item">
                    <span class="dosage-label">Minimum Age</span>
                    <span class="dosage-value">{{ drug.dosage_guidance.pediatric.min_age_months }} months</span>
                  </div>
                </div>
                <p v-if="drug.dosage_guidance.pediatric.instructions" class="dosage-instructions">
                  <v-icon name="hi-information-circle" scale="0.65" />
                  {{ drug.dosage_guidance.pediatric.instructions }}
                </p>
              </div>
            </div>
          </div>

          <!-- Warnings -->
          <div v-if="drug.warnings?.length" class="info-card glass-card warning-card">
            <div class="section-header section-header--warning">
              <v-icon name="hi-exclamation" scale="0.85" />
              <h3>Warnings</h3>
            </div>
            <ul class="warning-list">
              <li v-for="warning in drug.warnings" :key="warning">{{ warning }}</li>
            </ul>
          </div>

          <!-- Contraindications -->
          <div v-if="drug.contraindications?.length" class="info-card glass-card">
            <div class="section-header section-header--rose">
              <v-icon name="hi-ban" scale="0.85" />
              <h3>Contraindications</h3>
            </div>
            <ul class="info-list info-list--rose">
              <li v-for="item in drug.contraindications" :key="item">{{ item }}</li>
            </ul>
          </div>

          <!-- Side Effects -->
          <div v-if="drug.side_effects?.length" class="info-card glass-card">
            <div class="section-header">
              <v-icon name="hi-exclamation-circle" scale="0.85" />
              <h3>Side Effects</h3>
            </div>
            <ul class="info-list">
              <li v-for="effect in drug.side_effects" :key="effect">{{ effect }}</li>
            </ul>
          </div>

          <!-- Stock Batches -->
          <div v-if="batches.length" class="info-card glass-card">
            <div class="section-header section-header--emerald">
              <v-icon name="hi-cube" scale="0.85" />
              <h3>Available Batches ({{ batches.length }})</h3>
            </div>
            <div class="batches-list">
              <div v-for="batch in batches" :key="batch._id" class="batch-item">
                <div class="batch-info">
                  <span class="batch-number">{{ batch.batch_number }}</span>
                  <span class="batch-qty">{{ batch.quantity_available }} units</span>
                </div>
                <div class="batch-expiry" :class="{ 'batch-expiry--warning': isExpiringSoon(batch.expiry_date) }">
                  <v-icon name="hi-calendar" scale="0.65" />
                  {{ batch.no_expiry ? 'No Expiry' : formatDate(batch.expiry_date) }}
                </div>
                <PharmacyStatusBadge :status="batch.status" size="sm" />
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
// Design System Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$violet: #8B5CF6;
$violet-light: #EDE9FE;
$rose: #F43F5E;
$rose-light: #FFE4E6;

// Base Layout
.drug-details-page {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
  overflow-x: hidden;
}

// Ambient Background
.ambient-bg {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.5;
  animation: float 20s ease-in-out infinite;

  &--1 {
    width: 400px;
    height: 400px;
    background: $sky-light;
    top: -100px;
    right: -100px;
  }

  &--2 {
    width: 300px;
    height: 300px;
    background: rgba($violet, 0.15);
    bottom: 20%;
    left: -80px;
    animation-delay: -7s;
  }

  &--3 {
    width: 250px;
    height: 250px;
    background: rgba($emerald, 0.12);
    top: 50%;
    right: 15%;
    animation-delay: -14s;
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(20px, -20px) scale(1.05); }
  50% { transform: translate(-10px, 15px) scale(0.95); }
  75% { transform: translate(15px, 10px) scale(1.02); }
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: $size-12 $size-16;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  align-items: center;
  justify-content: space-between;

  @include responsive(tab-portrait) {
    display: flex;
  }

  .back-btn, .menu-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    border-radius: $size-10;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-g-36;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba($sky, 0.1);
      color: $sky-dark;
    }
  }

  .mobile-title {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

// Page Container
.page-container {
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 100px;
  }
}

// Breadcrumbs
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: $size-8;
  margin-bottom: $size-20;
  font-size: $size-13;

  @include responsive(tab-portrait) {
    display: none;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    gap: $size-4;
    color: $color-g-54;
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: $sky-dark;
    }
  }

  .breadcrumb-separator {
    color: $color-g-67;
  }

  .breadcrumb-current {
    color: $color-g-21;
    font-weight: $fw-medium;
  }
}

.drug-details-container {
  display: flex;
  flex-direction: column;
  gap: $size-20;
}

// Hero Section
.hero {
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 32px;
  padding: 48px 56px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 48px;
  align-items: center;
  min-height: 320px;
  box-shadow:
    0 25px 80px rgba($sky-dark, 0.35),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  &::before {
    content: '';
    position: absolute;
    top: -60%;
    right: -20%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 36px 32px;
    min-height: auto;
  }

  @media (max-width: 768px) {
    padding: 28px 24px;
    border-radius: 24px;
  }
}

.hero__content {
  position: relative;
  z-index: 2;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateX(-4px);
  }

  &.desktop-only {
    @media (max-width: 768px) {
      display: none;
    }
  }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  margin-bottom: 16px;

  .badge-pulse {
    width: 8px;
    height: 8px;
    background: #4ade80;
    border-radius: 50%;
    animation: pulse-glow 2s ease-in-out infinite;
  }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  50% { opacity: 0.8; box-shadow: 0 0 0 8px rgba(74, 222, 128, 0); }
}

.hero__title {
  font-size: 48px;
  font-weight: 800;
  color: white;
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin-bottom: 12px;

  @media (max-width: 1024px) {
    font-size: 38px;
  }

  @media (max-width: 768px) {
    font-size: 30px;
  }
}

.hero__title-accent {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
  margin-bottom: 24px;
}

.hero__stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 10px;
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  &--price {
    background: rgba(255, 255, 255, 0.25);
  }

  &__value {
    font-size: 20px;
    font-weight: 700;
    color: white;
    line-height: 1.1;

    @media (max-width: 768px) {
      font-size: 16px;
    }
  }

  &__label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
  }
}

.hero__visual {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;

  @media (max-width: 1024px) {
    display: none;
  }
}

.drug-orb {
  position: relative;
  width: 160px;
  height: 160px;
}

.orb-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 0.4; }
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 {
    inset: 0;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    inset: 12px;
    border-style: dashed;
    animation: spin-slow 15s linear infinite reverse;
  }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.orb-center {
  position: absolute;
  inset: 28px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  overflow: hidden;
}

.orb-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.prescribe-fab {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 28px;
  padding: 12px 24px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Glass Card
.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: $size-16;
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
}

// Drug Main Card
.drug-main-card {
  display: flex;
  gap: $size-24;
  padding: $size-24;

  @include responsive(phone) {
    flex-direction: column;
    padding: $size-16;
  }
}

.drug-image-section {
  flex-shrink: 0;
}

.drug-image {
  position: relative;
  width: 200px;
  height: 200px;
  border-radius: $size-16;
  overflow: hidden;
  background: linear-gradient(135deg, $color-g-97 0%, $color-g-92 100%);

  @include responsive(phone) {
    width: 100%;
    height: 220px;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.drug-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $color-g-67;
}

.rx-badge {
  position: absolute;
  bottom: $size-12;
  left: $size-12;
  display: flex;
  align-items: center;
  gap: $size-4;
  background: rgba($sky-darker, 0.9);
  backdrop-filter: blur(8px);
  color: white;
  font-size: $size-11;
  font-weight: $fw-medium;
  padding: $size-6 $size-10;
  border-radius: $size-8;
}

.drug-info-section {
  flex: 1;
  min-width: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: $size-8;
  margin-bottom: $size-16;

  svg {
    color: $sky-dark;
  }

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin: 0;
  }

  &--warning svg { color: $amber; }
  &--rose svg { color: $rose; }
  &--emerald svg { color: $emerald; }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-12;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.info-item {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-12;
  background: rgba($color-g-97, 0.7);
  border-radius: $size-10;
}

.info-icon {
  width: 36px;
  height: 36px;
  border-radius: $size-8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--sky {
    background: $sky-light;
    color: $sky-dark;
  }

  &--violet {
    background: $violet-light;
    color: $violet;
  }

  &--emerald {
    background: $emerald-light;
    color: $emerald;
  }

  &--amber {
    background: $amber-light;
    color: $amber;
  }
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: $size-11;
  color: $color-g-54;
}

.info-value {
  font-size: $size-13;
  font-weight: $fw-semi-bold;
  color: $color-g-21;
}

// Info Card
.info-card {
  padding: $size-24;

  @include responsive(phone) {
    padding: $size-16;
  }
}

.warning-card {
  border-left: 4px solid $amber;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: $size-8;
}

.tag {
  font-size: $size-12;
  padding: $size-6 $size-14;
  background: rgba($sky, 0.1);
  border-radius: $size-8;
  color: $sky-dark;
  font-weight: $fw-medium;
}

.description-text {
  font-size: $size-14;
  color: $color-g-44;
  line-height: 1.7;
}

// Dosage Sections
.dosage-sections {
  display: flex;
  flex-direction: column;
  gap: $size-16;
}

.dosage-section {
  padding: $size-16;
  background: rgba($color-g-97, 0.7);
  border-radius: $size-12;
  border-left: 3px solid $sky-dark;

  &--pediatric {
    border-left-color: $violet;
  }

  h4 {
    display: flex;
    align-items: center;
    gap: $size-8;
    font-size: $size-14;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-12;

    svg { color: $sky-dark; }
  }

  &--pediatric h4 svg { color: $violet; }
}

.dosage-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $size-12;
  margin-bottom: $size-12;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.dosage-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dosage-label {
  font-size: $size-11;
  color: $color-g-54;
  font-weight: $fw-medium;
}

.dosage-value {
  font-size: $size-13;
  font-weight: $fw-semi-bold;
  color: $color-g-21;
}

.dosage-instructions {
  display: flex;
  align-items: flex-start;
  gap: $size-8;
  font-size: $size-13;
  color: $color-g-54;
  font-style: italic;
  line-height: 1.5;
  padding: $size-10 $size-12;
  background: rgba(255, 255, 255, 0.6);
  border-radius: $size-8;

  svg {
    color: $sky-dark;
    flex-shrink: 0;
    margin-top: 2px;
  }
}

// Lists
.info-list, .warning-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: $size-10;

  li {
    font-size: $size-13;
    color: $color-g-44;
    padding-left: $size-18;
    position: relative;
    line-height: 1.5;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 7px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: $sky-dark;
    }
  }

  &--rose li::before { background: $rose; }
}

.warning-list li::before {
  background: $amber;
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
  gap: $size-16;
  padding: $size-14 $size-16;
  background: rgba($color-g-97, 0.7);
  border-radius: $size-12;

  @include responsive(phone) {
    flex-wrap: wrap;
  }
}

.batch-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.batch-number {
  font-size: $size-14;
  font-weight: $fw-semi-bold;
  color: $color-g-21;
}

.batch-qty {
  font-size: $size-12;
  color: $color-g-54;
}

.batch-expiry {
  display: flex;
  align-items: center;
  gap: $size-6;
  font-size: $size-12;
  color: $color-g-44;

  svg { color: $color-g-54; }

  &--warning {
    color: $amber;
    svg { color: $amber; }
  }
}

// Skeleton
.skeleton-hero {
  height: 180px;
  border-radius: $size-20;
  background: linear-gradient(90deg, rgba($sky, 0.1) 25%, rgba($sky, 0.2) 50%, rgba($sky, 0.1) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-card {
  height: 180px;
  border-radius: $size-16;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
