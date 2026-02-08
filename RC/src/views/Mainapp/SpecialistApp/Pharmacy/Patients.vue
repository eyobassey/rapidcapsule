<template>
  <div class="patients-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <v-icon name="hi-user-group" scale="1" />
        <span>Patients</span>
      </div>
      <button class="action-btn" @click="router.push('/app/specialist/pharmacy/prescriptions/create')">
        <v-icon name="hi-plus" scale="1" />
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="hi-user-group" scale="1.2" class="spinner-icon" />
        </div>
        <p>Loading patients...</p>
      </div>

      <template v-else>
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero__content">
            <button class="back-link desktop-only" @click="$router.push('/app/specialist/pharmacy')">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Pharmacy</span>
            </button>
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="hi-user-group" />
              <span>Patient Directory</span>
            </div>
            <h1 class="hero__title">
              My<br/>
              <span class="hero__title-accent">Patients</span>
            </h1>
            <p class="hero__subtitle">
              Search and manage patient prescriptions all in one place.
            </p>
            <div class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ pagination.total || 0 }}</span>
                <span class="hero-stat__label">Total</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--info">{{ myPatientsCount }}</span>
                <span class="hero-stat__label">My Patients</span>
              </div>
            </div>
          </div>
          <div class="hero__visual">
            <div class="patients-orb">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="hi-user-group" />
              </div>
            </div>
            <div class="floating-icons">
              <div class="float-icon float-icon--1"><v-icon name="ri-capsule-line" /></div>
              <div class="float-icon float-icon--2"><v-icon name="hi-clipboard-list" /></div>
              <div class="float-icon float-icon--3"><v-icon name="hi-heart" /></div>
            </div>
          </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
          <!-- Quick Actions Card -->
          <div class="bento-card actions-card">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="actions-row">
              <button class="action-btn" @click="router.push('/app/specialist/pharmacy/prescriptions/create')">
                <div class="action-icon sky">
                  <v-icon name="hi-plus-circle" scale="1.1" />
                </div>
                <span>New Prescription</span>
              </button>
              <button class="action-btn" @click="router.push('/app/specialist/pharmacy/drugs')">
                <div class="action-icon emerald">
                  <v-icon name="ri-capsule-line" scale="1.1" />
                </div>
                <span>Drug Catalog</span>
              </button>
              <button class="action-btn" @click="router.push('/app/specialist/pharmacy/prescriptions')">
                <div class="action-icon violet">
                  <v-icon name="hi-clipboard-list" scale="1.1" />
                </div>
                <span>All Prescriptions</span>
              </button>
            </div>
          </div>

          <!-- Filters Card -->
          <div class="bento-card filters-card">
            <div class="card-header">
              <h3>Search Patients</h3>
              <span class="results-count">{{ patients.length }} results</span>
            </div>
            <div class="search-bar">
              <v-icon name="hi-search" scale="0.9" class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by name, email, or phone..."
                @input="handleSearch"
              />
              <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
                <v-icon name="hi-x" scale="0.8" />
              </button>
            </div>
            <div class="filter-pills">
              <button
                :class="['filter-pill', { active: searchType === 'my_patients' }]"
                @click="setSearchType('my_patients')"
              >
                <span class="pill-label">My Patients</span>
              </button>
              <button
                :class="['filter-pill', { active: searchType === 'all' }]"
                @click="setSearchType('all')"
              >
                <span class="pill-label">All Patients</span>
              </button>
            </div>
          </div>

          <!-- Patients List Card -->
          <div class="bento-card patients-card">
            <div class="card-header">
              <h3>{{ searchType === 'my_patients' ? 'My Patients' : 'All Patients' }}</h3>
            </div>

            <!-- Patient Items -->
            <div v-if="patients.length" class="patients-list">
              <div
                v-for="patient in patients"
                :key="patient._id"
                class="patient-item"
                @click="viewPatient(patient._id)"
              >
                <div class="patient-item__left">
                  <div class="patient-avatar">
                    <RcAvatar
                      :model-value="patient.profile_image"
                      :first-name="patient.first_name || getFirstName(patient.full_name)"
                      :last-name="patient.last_name || getLastName(patient.full_name)"
                      size="sm"
                    />
                  </div>

                  <div class="patient-info">
                    <div class="patient-header">
                      <span class="patient-name">{{ patient.full_name }}</span>
                      <span v-if="patient.prescription_count" class="rx-badge">
                        {{ patient.prescription_count }} Rx
                      </span>
                    </div>
                    <p class="patient-email">{{ patient.email }}</p>
                    <div class="patient-meta">
                      <span v-if="patient.gender" class="meta-tag">
                        <v-icon :name="patient.gender === 'Male' ? 'io-male' : 'io-female'" scale="0.6" />
                        {{ patient.gender }}
                      </span>
                      <span v-if="patient.date_of_birth" class="meta-tag">
                        {{ calculateAge(patient.date_of_birth) }} yrs
                      </span>
                    </div>
                  </div>
                </div>

                <div class="patient-item__right">
                  <span v-if="patient.phone" class="patient-phone">{{ patient.phone }}</span>
                  <v-icon name="hi-chevron-right" scale="0.9" class="chevron" />
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state">
              <div class="empty-icon">
                <v-icon name="hi-user-group" scale="2" />
              </div>
              <h3>{{ searchQuery ? 'No patients found' : 'No patients yet' }}</h3>
              <p>{{ searchQuery ? 'Try adjusting your search criteria' : 'Patients will appear here after you create prescriptions for them' }}</p>
              <button v-if="!searchQuery" class="empty-action" @click="router.push('/app/specialist/pharmacy/prescriptions/create')">
                <v-icon name="hi-plus" scale="0.9" />
                Create Prescription
              </button>
            </div>

            <!-- Pagination -->
            <PharmacyPagination
              v-if="pagination.totalPages > 1"
              :current-page="pagination.page"
              :total-pages="pagination.totalPages"
              @page-change="handlePageChange"
            />
          </div>
        </section>
      </template>
    </div>

    <!-- Mobile FAB -->
    <button class="fab" @click="router.push('/app/specialist/pharmacy/prescriptions/create')">
      <v-icon name="hi-plus" scale="1.2" />
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import RcAvatar from '@/components/RCAvatar';
import apiFactory from '@/services/apiFactory';
import PharmacyPagination from './components/PharmacyPagination.vue';
import { usePharmacy } from './composables/usePharmacy';

const router = useRouter();
const $toast = useToast();
const { calculateAge } = usePharmacy();

const isLoading = ref(true);
const searchQuery = ref('');
const searchType = ref('my_patients');
const patients = ref([]);
const myPatientsCount = ref(0);
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });
let debounceTimer = null;

function getFirstName(name) {
  if (!name) return '';
  return name.split(' ')[0] || '';
}

function getLastName(name) {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function handleSearch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    pagination.value.page = 1;
    searchPatients();
  }, 300);
}

function clearSearch() {
  searchQuery.value = '';
  pagination.value.page = 1;
  searchPatients();
}

function setSearchType(type) {
  searchType.value = type;
  pagination.value.page = 1;
  searchPatients();
}

function handlePageChange(page) {
  pagination.value.page = page;
  searchPatients();
}

function viewPatient(patientId) {
  router.push(`/app/specialist/pharmacy/patients/${patientId}`);
}

async function searchPatients() {
  try {
    isLoading.value = true;
    const params = {
      search: searchQuery.value || undefined,
      type: searchType.value,
      page: pagination.value.page,
      limit: pagination.value.limit,
    };
    const response = await apiFactory.$_searchPharmacyPatients(params);
    const result = response.data?.data || response.data?.result;
    if (result) {
      patients.value = result.docs || [];
      pagination.value.total = result.total || 0;
      pagination.value.totalPages = result.pages || 0;
    }
  } catch (error) {
    console.error('Error searching patients:', error);
    $toast.error('Failed to search patients');
  } finally {
    isLoading.value = false;
  }
}

async function fetchMyPatientsCount() {
  try {
    const response = await apiFactory.$_searchPharmacyPatients({ type: 'my_patients', limit: 1 });
    const result = response.data?.data || response.data?.result;
    if (result) {
      myPatientsCount.value = result.total || 0;
    }
  } catch (error) {
    console.error('Error fetching patients count:', error);
  }
}

onMounted(() => {
  Promise.all([searchPatients(), fetchMyPatientsCount()]);
});
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
.patients-page {
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

  .menu-btn, .action-btn {
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

  .header-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: $navy;

    svg {
      color: $sky-dark;
    }
  }
}

// Page Content
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
    justify-content: center;
    padding: 14px 16px;
    gap: 20px;
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
    &--info { color: $sky-light; }
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
.patients-orb {
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
// BENTO GRID
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
  }
}

// Actions Card
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

    .search-icon {
      color: $gray;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      color: $navy;
      background: transparent;

      &::placeholder {
        color: $light-gray;
      }
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
  }

  .filter-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border-radius: 20px;
    border: 1px solid #E2E8F0;
    background: white;
    font-size: 13px;
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
}

// Patients List
.patients-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.patient-item {
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

    @media (max-width: 768px) {
      width: 100%;
    }
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

      @media (max-width: 768px) {
        display: none;
      }
    }
  }
}

.patient-avatar {
  flex-shrink: 0;
}

.patient-info {
  flex: 1;
  min-width: 0;

  .patient-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }

  .patient-name {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
  }

  .patient-email {
    font-size: 13px;
    color: $gray;
    margin: 0 0 8px;
  }
}

.rx-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  background: $sky-light;
  color: $sky-dark;
}

.patient-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 4px 10px;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  color: $slate;
}

.patient-phone {
  font-size: 13px;
  color: $gray;
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
