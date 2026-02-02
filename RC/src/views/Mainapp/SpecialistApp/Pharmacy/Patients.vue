<template>
  <div class="page-content">
    <TopBar showButtons type="title-only" title="Pharmacy / Patients" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="patients-container">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <button class="hero-back" @click="router.push('/app/specialist/pharmacy')">
              <v-icon name="hi-arrow-left" scale="0.75" />
              Pharmacy
            </button>
            <h1 class="hero-title">
              <v-icon name="hi-user-group" scale="1" />
              My Patients
            </h1>
            <p class="hero-subtitle">Search and manage patient prescriptions</p>
          </div>
          <div class="hero-actions">
            <button class="hero-action-btn" @click="router.push('/app/specialist/pharmacy/prescriptions/create')">
              <v-icon name="hi-plus" scale="0.85" />
              New Prescription
            </button>
          </div>
        </div>

        <!-- Search & Filters -->
        <div class="search-card">
          <div class="search-input-wrapper">
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
          <div class="filter-tabs">
            <button
              :class="['filter-tab', { active: searchType === 'my_patients' }]"
              @click="setSearchType('my_patients')"
            >
              My Patients
            </button>
            <button
              :class="['filter-tab', { active: searchType === 'all' }]"
              @click="setSearchType('all')"
            >
              All Patients
            </button>
          </div>
        </div>

        <!-- Shimmer Loading -->
        <template v-if="isLoading">
          <div class="skeleton-card" v-for="i in 4" :key="i" />
        </template>

        <!-- Results -->
        <template v-else>
          <p v-if="patients.length" class="results-count">
            Showing {{ patients.length }} of {{ pagination.total }} patients
          </p>

          <div v-if="patients.length" class="patients-list">
            <div
              v-for="patient in patients"
              :key="patient._id"
              class="patient-card"
              @click="viewPatient(patient._id)"
            >
              <div class="patient-card__left">
                <RcAvatar
                  :model-value="patient.profile_image"
                  :first-name="patient.first_name || getFirstName(patient.full_name)"
                  :last-name="patient.last_name || getLastName(patient.full_name)"
                  size="sm"
                />
                <div class="patient-card__info">
                  <h3>{{ patient.full_name }}</h3>
                  <p class="email">{{ patient.email }}</p>
                  <p class="phone">{{ patient.phone || 'No phone' }}</p>
                </div>
              </div>
              <div class="patient-card__right">
                <div class="patient-card__meta">
                  <span v-if="patient.gender" class="meta-tag">{{ patient.gender }}</span>
                  <span v-if="patient.date_of_birth" class="meta-tag">{{ calculateAge(patient.date_of_birth) }}</span>
                </div>
                <v-icon name="hi-chevron-right" scale="0.85" class="patient-card__arrow" />
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-section">
            <div class="empty-section__icon">
              <v-icon name="hi-user-group" scale="1.8" />
            </div>
            <h3>{{ searchQuery ? 'No patients found' : 'No patients yet' }}</h3>
            <p>{{ searchQuery ? 'Try adjusting your search criteria' : 'Start by searching for a patient' }}</p>
          </div>
        </template>

        <PharmacyPagination
          :current-page="pagination.page"
          :total-pages="pagination.totalPages"
          @page-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import TopBar from '@/components/Navigation/top-bar';
import RcAvatar from '@/components/RCAvatar';
import apiFactory from '@/services/apiFactory';
import PharmacyPagination from './components/PharmacyPagination.vue';
import { usePharmacy } from './composables/usePharmacy';

const router = useRouter();
const $toast = useToast();
const { calculateAge } = usePharmacy();

const isLoading = ref(false);
const searchQuery = ref('');
const searchType = ref('my_patients');
const patients = ref([]);
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

onMounted(() => {
  searchPatients();
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

.patients-container {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: $size-24;
  padding-bottom: $size-32;
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
    }

    .hero-subtitle {
      font-size: $size-13;
      opacity: 0.85;
    }
  }

  .hero-actions {
    z-index: 1;

    .hero-action-btn {
      display: flex;
      align-items: center;
      gap: $size-8;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: $size-10;
      padding: $size-10 $size-20;
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
}

// Search Card
.search-card {
  background: white;
  border-radius: $size-16;
  padding: $size-20;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-12 $size-16;
  background: $color-g-97;
  border-radius: $size-10;
  margin-bottom: $size-14;
  transition: background 0.2s ease;

  &:focus-within {
    background: rgba(14, 174, 196, 0.04);
  }

  .search-icon {
    color: $color-g-54;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: $size-14;
    color: $color-g-21;
    background: transparent;

    &::placeholder {
      color: $color-g-67;
    }
  }

  .clear-btn {
    background: $color-g-92;
    border: none;
    cursor: pointer;
    padding: $size-4 $size-6;
    color: $color-g-54;
    border-radius: $size-4;

    &:hover {
      background: $color-g-85;
      color: $color-g-36;
    }
  }
}

.filter-tabs {
  display: flex;
  gap: $size-8;
}

.filter-tab {
  padding: $size-8 $size-16;
  border-radius: $size-8;
  border: none;
  background: $color-g-97;
  font-size: $size-13;
  font-weight: $fw-medium;
  color: $color-g-44;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #0EAEC4;
  }

  &.active {
    background: rgba(14, 174, 196, 0.1);
    color: #0EAEC4;
  }
}

// Results Count
.results-count {
  font-size: $size-13;
  color: $color-g-54;
  font-weight: $fw-medium;
}

// Patients List
.patients-list {
  display: flex;
  flex-direction: column;
  gap: $size-10;
}

.patient-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: $size-16;
  padding: $size-20;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid #0EAEC4;

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);

    .patient-card__arrow {
      color: #0EAEC4;
      transform: translateX(2px);
    }
  }

  &__left {
    display: flex;
    align-items: center;
    gap: $size-14;
    flex: 1;
    min-width: 0;
  }

  &__info {
    min-width: 0;

    h3 {
      font-size: $size-15;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .email {
      font-size: $size-12;
      color: $color-g-54;
      margin-top: $size-2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .phone {
      font-size: $size-12;
      color: $color-g-67;
      margin-top: $size-2;
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: $size-12;
    flex-shrink: 0;
  }

  &__meta {
    display: flex;
    gap: $size-6;

    .meta-tag {
      font-size: $size-11;
      padding: $size-4 $size-10;
      background: $color-g-97;
      border-radius: $size-6;
      color: $color-g-44;
      font-weight: $fw-medium;
    }
  }

  &__arrow {
    color: $color-g-67;
    transition: all 0.2s ease;
  }
}

// Empty State
.empty-section {
  text-align: center;
  padding: $size-32 $size-20;
  background: $color-g-97;
  border-radius: $size-12;

  &__icon {
    width: 64px;
    height: 64px;
    margin: 0 auto $size-14;
    border-radius: 50%;
    background: rgba(14, 174, 196, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0EAEC4;
  }

  h3 {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-6;
  }

  p {
    font-size: $size-13;
    color: $color-g-54;
  }
}

// Skeleton
.skeleton-card {
  height: 90px;
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
