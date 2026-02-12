<template>
  <div class="patients-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero__content">
        <div class="hero__badge">
          <div class="badge-pulse"></div>
          <v-icon name="hi-user-group" />
          <span>Patient Directory</span>
        </div>
        <h1 class="hero__title">
          Patient<br/>
          <span class="hero__title-accent">Directory</span>
        </h1>
        <p class="hero__subtitle">
          Manage and review patient records in one place
        </p>
        <div class="hero__stats" v-if="stats">
          <div class="hero-stat">
            <span class="hero-stat__value">{{ stats.totalPatients || 0 }}</span>
            <span class="hero-stat__label">Total Patients</span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value hero-stat__value--success">{{ stats.thisMonthPatients || 0 }}</span>
            <span class="hero-stat__label">This Month</span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value hero-stat__value--warning">{{ stats.thisWeekPatients || 0 }}</span>
            <span class="hero-stat__label">This Week</span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value hero-stat__value--starred">
              <v-icon name="hi-solid-star" scale="0.7" class="star-icon" />
              {{ stats.starredPatients || 0 }}
            </span>
            <span class="hero-stat__label">Starred</span>
          </div>
        </div>
        <div class="hero__actions">
          <button class="add-patient-btn" @click="addNewPatient">
            <v-icon name="hi-plus" scale="0.9" />
            <span>Add Patient</span>
          </button>
        </div>
      </div>
      <div class="hero__visual">
        <div class="dashboard-orb">
          <div class="orb-ring orb-ring--1"></div>
          <div class="orb-ring orb-ring--2"></div>
          <div class="orb-ring orb-ring--3"></div>
          <div class="orb-core">
            <v-icon name="hi-user-group" />
          </div>
        </div>
        <div class="floating-icons">
          <div class="float-icon float-icon--1"><v-icon name="hi-heart" /></div>
          <div class="float-icon float-icon--2"><v-icon name="hi-clipboard-list" /></div>
          <div class="float-icon float-icon--3"><v-icon name="hi-shield-check" /></div>
        </div>
      </div>
    </section>

    <!-- Filter Section -->
    <div class="bento-card filter-card">
      <div class="filter-grid">
        <div class="search-field">
          <div class="search-input-wrapper">
            <v-icon name="hi-search" scale="0.9" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, email, phone, or patient ID..."
              @input="debouncedSearch"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <v-icon name="hi-x" scale="0.7" />
            </button>
          </div>
        </div>
        <div class="filter-dropdown">
          <select v-model="statusFilter" @change="fetchPatients">
            <option value="">All Status</option>
            <option value="follow_up_due">Follow-up Due</option>
            <option value="high_priority">High Priority</option>
            <option value="new">New Patients</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div class="sort-dropdown">
          <select v-model="sortBy" @change="fetchPatients">
            <option value="last_visit">Last Seen</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
        <button class="more-filters-btn" @click="showMoreFilters = !showMoreFilters">
          <v-icon name="hi-adjustments" scale="0.9" />
          <span>More Filters</span>
        </button>
      </div>

      <!-- Filter Tabs -->
      <div class="filter-tabs">
        <span class="tabs-label">View:</span>
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          class="tab-btn"
          :class="{ active: activeFilter === tab.value }"
          @click="setFilter(tab.value)"
        >
          <v-icon :name="tab.icon" scale="0.85" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Quick Filters -->
      <div class="quick-filters">
        <span class="quick-label">Quick Filters:</span>
        <button
          class="quick-filter-btn follow-up"
          :class="{ active: quickFilter === 'follow_up' }"
          @click="toggleQuickFilter('follow_up')"
        >
          <v-icon name="hi-exclamation-circle" scale="0.75" />
          Follow-up Due ({{ quickStats.followUpDue || 0 }})
        </button>
        <button
          class="quick-filter-btn high-priority"
          :class="{ active: quickFilter === 'high_priority' }"
          @click="toggleQuickFilter('high_priority')"
        >
          <v-icon name="hi-flag" scale="0.75" />
          High Priority ({{ quickStats.highPriority || 0 }})
        </button>
        <button
          class="quick-filter-btn seen-today"
          :class="{ active: quickFilter === 'seen_today' }"
          @click="toggleQuickFilter('seen_today')"
        >
          <v-icon name="hi-clock" scale="0.75" />
          Seen Today ({{ quickStats.seenToday || 0 }})
        </button>
      </div>
    </div>

    <!-- Access Notice for All Patients -->
    <div v-if="activeFilter === 'all' && !accessAcknowledged" class="access-notice">
      <div class="notice-icon">
        <v-icon name="hi-information-circle" scale="1.2" />
      </div>
      <div class="notice-content">
        <h4>System-Wide Patient Search</h4>
        <p>You are viewing patients outside your appointment history. Access is logged for compliance purposes.</p>
      </div>
      <button class="acknowledge-btn" @click="acknowledgeAccess">
        I Understand
      </button>
    </div>

    <!-- Patient List Table -->
    <div class="bento-card table-card">
      <div class="list-header">
        <h2 class="list-title">All Patients ({{ pagination.total }})</h2>
        <div class="list-actions">
          <button class="action-btn" title="Export to CSV" @click="exportPatients">
            <v-icon name="hi-download" scale="0.9" />
          </button>
          <button class="action-btn" title="Print" @click="printPatients">
            <v-icon name="bi-printer" scale="0.9" />
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading-state">
        <loader :useOverlay="false" :style="{ backgroundColor: 'transparent' }" />
      </div>

      <!-- Table -->
      <div v-else-if="patients.length" class="table-wrapper">
        <table class="patients-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Contact</th>
              <th>Tags</th>
              <th>Last Seen</th>
              <th>Outstanding Tasks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="patient in patients"
              :key="patient._id"
              class="patient-row"
              @click="viewPatient(patient._id)"
            >
              <td class="patient-cell">
                <div class="patient-info">
                  <rc-avatar
                    size="sm"
                    borderless
                    :firstName="patient.profile?.first_name || ''"
                    :lastName="patient.profile?.last_name || ''"
                    :modelValue="getProfileImage(patient)"
                  />
                  <div class="patient-details">
                    <p class="patient-name">{{ getFullName(patient) }}</p>
                    <p class="patient-id">ID: {{ patient.patientId || patient._id?.slice(-6).toUpperCase() }}</p>
                  </div>
                </div>
              </td>
              <td class="contact-cell">
                <p class="contact-phone">{{ getPhone(patient) || 'N/A' }}</p>
                <p class="contact-email">{{ getEmail(patient) || 'N/A' }}</p>
              </td>
              <td class="tags-cell">
                <div class="tags-wrapper">
                  <span v-if="patient.isFollowUpDue" class="tag follow-up">Follow-up Due</span>
                  <span v-if="patient.isHighPriority" class="tag high-priority">High Priority</span>
                  <span v-if="patient.isNewPatient" class="tag new-patient">New Patient</span>
                  <span v-if="patient.hasChronic" class="tag chronic">Chronic</span>
                  <span v-if="!patient.isFollowUpDue && !patient.isHighPriority && !patient.isNewPatient && !patient.hasChronic" class="tag active">Active</span>
                </div>
              </td>
              <td class="last-seen-cell">
                <p class="seen-date">{{ formatLastSeenDate(patient.stats?.lastVisit) }}</p>
                <p class="seen-ago">{{ formatLastVisit(patient.stats?.lastVisit) }}</p>
              </td>
              <td class="tasks-cell">
                <span v-if="patient.pendingTasks > 0" class="pending-badge">
                  {{ patient.pendingTasks }} pending
                </span>
                <span v-else class="no-tasks">None</span>
              </td>
              <td class="actions-cell">
                <div class="action-buttons">
                  <button class="row-action-btn" @click.stop="viewPatient(patient._id)" title="View">
                    <v-icon name="hi-eye" scale="0.85" />
                  </button>
                  <button class="row-action-btn" @click.stop="scheduleAppointment(patient)" title="Schedule">
                    <v-icon name="hi-calendar" scale="0.85" />
                  </button>
                  <button class="row-action-btn" @click.stop="toggleStar(patient)" :title="patient.isStarred ? 'Unstar' : 'Star'">
                    <v-icon :name="patient.isStarred ? 'hi-solid-star' : 'hi-star'" scale="0.85" :class="{ starred: patient.isStarred }" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <div class="empty-illustration">
          <v-icon name="hi-user-group" scale="3.5" class="empty-icon" />
        </div>
        <h2 class="empty-title">{{ getEmptyTitle }}</h2>
        <p class="empty-description">{{ getEmptyDescription }}</p>
      </div>

      <!-- Pagination -->
      <div v-if="patients.length && pagination.totalPages > 1" class="pagination">
        <p class="pagination-info">
          Showing {{ paginationStart }}-{{ paginationEnd }} of {{ pagination.total }} patients
        </p>
        <div class="pagination-controls">
          <button
            class="pagination-btn"
            :disabled="pagination.page <= 1"
            @click="goToPage(pagination.page - 1)"
          >
            <v-icon name="hi-chevron-left" scale="0.8" />
          </button>
          <button
            v-for="pageNum in visiblePages"
            :key="pageNum"
            class="pagination-btn page-num"
            :class="{ active: pageNum === pagination.page }"
            @click="goToPage(pageNum)"
          >
            {{ pageNum }}
          </button>
          <span v-if="pagination.totalPages > 5" class="pagination-ellipsis">...</span>
          <button
            v-if="pagination.totalPages > 5"
            class="pagination-btn page-num"
            :class="{ active: pagination.page === pagination.totalPages }"
            @click="goToPage(pagination.totalPages)"
          >
            {{ pagination.totalPages }}
          </button>
          <button
            class="pagination-btn"
            :disabled="pagination.page >= pagination.totalPages"
            @click="goToPage(pagination.page + 1)"
          >
            <v-icon name="hi-chevron-right" scale="0.8" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { debounce } from 'lodash';
import moment from 'moment';
import Loader from "@/components/Loader/main-loader";
import RcAvatar from "@/components/RCAvatar";

const props = defineProps({
  defaultFilter: {
    type: String,
    default: null,
  },
});

const $http = inject('$_HTTP');
const $toast = inject('$_TOAST');
const router = useRouter();
const route = useRoute();

// State
const isLoading = ref(false);
const searchQuery = ref('');
const activeFilter = ref('my_patients');
const statusFilter = ref('');
const sortBy = ref('last_visit');
const quickFilter = ref('');
const showMoreFilters = ref(false);
const patients = ref([]);
const stats = ref(null);
const quickStats = ref({
  followUpDue: 0,
  highPriority: 0,
  seenToday: 0,
});
const accessAcknowledged = ref(false);
const pagination = ref({
  page: 1,
  limit: 8,
  total: 0,
  totalPages: 0,
});

// Filter tabs configuration
const filterTabs = [
  { value: 'my_patients', label: 'My Patients', icon: 'hi-user-group' },
  { value: 'starred', label: 'Starred', icon: 'hi-solid-star' },
  { value: 'recent', label: 'Recent', icon: 'hi-clock' },
  { value: 'all', label: 'All Patients', icon: 'hi-globe-alt' },
];

// Computed
const getEmptyTitle = computed(() => {
  if (searchQuery.value) return 'No patients found';
  switch (activeFilter.value) {
    case 'starred': return 'No Starred Patients';
    case 'recent': return 'No Recent Patients';
    case 'all': return 'No Patients Found';
    default: return 'No Patients Yet';
  }
});

const getEmptyDescription = computed(() => {
  if (searchQuery.value) return 'Try adjusting your search criteria';
  switch (activeFilter.value) {
    case 'starred': return "You haven't starred any patients yet. Star patients for quick access.";
    case 'recent': return 'Your recent patient visits will appear here.';
    case 'all': return 'Search for any patient in the system.';
    default: return 'Patients you see in appointments will appear here.';
  }
});

const paginationStart = computed(() => {
  return (pagination.value.page - 1) * pagination.value.limit + 1;
});

const paginationEnd = computed(() => {
  const end = pagination.value.page * pagination.value.limit;
  return Math.min(end, pagination.value.total);
});

const visiblePages = computed(() => {
  const total = pagination.value.totalPages;
  const current = pagination.value.page;

  // No pages or only 1 page
  if (total <= 1) {
    return total === 1 ? [1] : [];
  }

  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  const start = Math.max(1, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Methods
async function fetchPatients() {
  try {
    isLoading.value = true;
    const params = {
      filter: activeFilter.value,
      search: searchQuery.value || undefined,
      status: statusFilter.value || undefined,
      quickFilter: quickFilter.value || undefined,
      sort: sortBy.value,
      page: pagination.value.page,
      limit: pagination.value.limit,
    };
    const response = await $http.$_getSpecialistPatients(params);
    const result = response.data?.data || response.data;
    if (result) {
      patients.value = result.patients || [];
      // Pagination data comes from result.pagination object
      const paginationData = result.pagination || {};
      pagination.value = {
        ...pagination.value,
        total: paginationData.total || result.total || 0,
        totalPages: paginationData.totalPages || result.totalPages || 0,
        page: paginationData.page || result.page || 1,
      };
    }
  } catch (error) {
    console.error('Error fetching patients:', error);
    $toast?.error('Failed to load patients');
  } finally {
    isLoading.value = false;
  }
}

async function fetchStats() {
  try {
    const response = await $http.$_getSpecialistPatientStats();
    const data = response.data?.data || response.data;
    stats.value = data;
    // Update quick stats
    quickStats.value = {
      followUpDue: data?.followUpDue || 0,
      highPriority: data?.highPriority || 0,
      seenToday: data?.seenToday || 0,
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
  }
}

async function toggleStar(patient) {
  try {
    const newStarred = !patient.isStarred;
    await $http.$_togglePatientStar(patient._id, { starred: newStarred });
    patient.isStarred = newStarred;
    if (stats.value) {
      stats.value.starredPatients = newStarred
        ? (stats.value.starredPatients || 0) + 1
        : Math.max(0, (stats.value.starredPatients || 0) - 1);
    }
    $toast.success(newStarred ? 'Patient starred' : 'Patient unstarred');
  } catch (error) {
    console.error('Error toggling star:', error);
    $toast.error('Failed to update star status');
  }
}

function setFilter(filter) {
  activeFilter.value = filter;
  pagination.value.page = 1;
  quickFilter.value = '';
  fetchPatients();
}

function toggleQuickFilter(filter) {
  if (quickFilter.value === filter) {
    quickFilter.value = '';
  } else {
    quickFilter.value = filter;
  }
  pagination.value.page = 1;
  fetchPatients();
}

function clearSearch() {
  searchQuery.value = '';
  pagination.value.page = 1;
  fetchPatients();
}

function goToPage(page) {
  // Safety checks to prevent invalid page navigation
  if (page < 1 || page > pagination.value.totalPages || page === pagination.value.page) {
    return;
  }
  pagination.value.page = page;
  fetchPatients();
}

function acknowledgeAccess() {
  accessAcknowledged.value = true;
}

function viewPatient(patientId) {
  router.push(`/app/specialist/patients/${patientId}`);
}

function scheduleAppointment(patient) {
  router.push({
    name: 'SpecialistAppointmentsCreate',
    query: { patientId: patient._id }
  });
}

function addNewPatient() {
  router.push('/app/specialist/patients/new');
}

function exportPatients() {
  if (!patients.value.length) {
    $toast?.warning('No patients to export');
    return;
  }

  // Create CSV content
  const headers = ['Name', 'Email', 'Phone', 'Gender', 'Date of Birth', 'Last Visit', 'Total Appointments'];
  const rows = patients.value.map(patient => [
    getFullName(patient),
    getEmail(patient) || 'N/A',
    getPhone(patient) || 'N/A',
    patient.profile?.gender || 'N/A',
    patient.profile?.date_of_birth ? moment(patient.profile.date_of_birth).format('YYYY-MM-DD') : 'N/A',
    patient.stats?.lastVisit ? moment(patient.stats.lastVisit).format('YYYY-MM-DD') : 'Never',
    patient.stats?.totalAppointments || 0,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `patients_${moment().format('YYYY-MM-DD')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  $toast?.success('Patients exported successfully');
}

function printPatients() {
  window.print();
}

function getFullName(patient) {
  if (patient.profile?.first_name && patient.profile?.last_name) {
    return `${patient.profile.first_name} ${patient.profile.last_name}`;
  }
  return getEmail(patient) || 'Unknown Patient';
}

function getEmail(patient) {
  return patient.profile?.contact?.email || patient.email || '';
}

function getPhone(patient) {
  const phone = patient.profile?.contact?.phone;
  if (phone?.number) {
    let countryCode = phone.country_code || '';
    if (countryCode && !countryCode.startsWith('+')) {
      countryCode = '+' + countryCode;
    }
    return countryCode ? `${countryCode} ${phone.number}` : phone.number;
  }
  return patient.profile?.phone_number || '';
}

function getProfileImage(patient) {
  return patient.profile?.profile_image || patient.profile?.profile_photo || null;
}

function formatLastVisit(date) {
  if (!date) return 'Never';
  return moment(date).fromNow();
}

function formatLastSeenDate(date) {
  if (!date) return 'N/A';
  return moment(date).format('MMM D, YYYY');
}

// Debounced search
const debouncedSearch = debounce(() => {
  pagination.value.page = 1;
  fetchPatients();
}, 300);

// Initialize
onMounted(() => {
  if (props.defaultFilter) {
    activeFilter.value = props.defaultFilter;
  }
  fetchPatients();
  fetchStats();
});

// Watch for prop changes
watch(() => props.defaultFilter, (newVal) => {
  if (newVal && newVal !== activeFilter.value) {
    activeFilter.value = newVal;
    pagination.value.page = 1;
    fetchPatients();
  }
});
</script>

<style scoped lang="scss">
// ─── Design Tokens ───
$sky: #4FC3F7;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$emerald: #10B981;
$amber: #F59E0B;
$rose: #F43F5E;
$violet: #8B5CF6;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
}

// ─── Page Layout ───
.patients-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  padding-bottom: 100px;
  background: #F8FAFC;
  min-height: min-content;

  @media (max-width: 768px) {
    padding: 16px;
    padding-bottom: 120px;
    gap: 16px;
  }
}

// ─── Hero Section ───
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 55%, $sky-darker 100%);
  border-radius: 28px;
  padding: 40px 48px;
  min-height: 320px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(2, 136, 209, 0.3);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%);
    pointer-events: none;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 28px 24px;
    min-height: auto;
    border-radius: 20px;
    text-align: center;
  }
}

.hero__content {
  position: relative;
  z-index: 2;
  flex: 1;
  max-width: 600px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 100px;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 16px;

  .ov-icon {
    width: 16px;
    height: 16px;
  }
}

.badge-pulse {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  animation: pulse-glow 2s ease-in-out infinite;
}

.hero__title {
  font-size: 2.75rem;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  margin: 0 0 12px;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
}

.hero__title-accent {
  background: linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 50%, #80DEEA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin: 0 0 24px;
}

// ─── Hero Stats Bar ───
.hero__stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    gap: 12px;
    padding: 12px 16px;
    flex-wrap: wrap;
    justify-content: center;
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.hero-stat__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;

  &--success { color: #4ade80; }
  &--warning { color: #fbbf24; }

  &--starred {
    display: flex;
    align-items: center;
    gap: 4px;

    .star-icon { color: #fbbf24; }
  }

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
}

.hero-stat__label {
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.hero-stat__divider {
  width: 1px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);

  @media (max-width: 768px) {
    display: none;
  }
}

// ─── Hero Actions ───
.hero__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.add-patient-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
}

// ─── Hero Visual / Orb ───
.hero__visual {
  position: relative;
  width: 220px;
  height: 220px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 160px;
    height: 160px;
    margin-top: 20px;
  }
}

.dashboard-orb {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.12);

  &--1 {
    width: 100%;
    height: 100%;
    animation: spin-slow 20s linear infinite;
  }
  &--2 {
    width: 75%;
    height: 75%;
    animation: spin-slow 15s linear infinite reverse;
    border-style: dashed;
  }
  &--3 {
    width: 50%;
    height: 50%;
    animation: spin-slow 10s linear infinite;
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.orb-core {
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: pulse-glow 3s ease-in-out infinite;
  z-index: 1;

  .ov-icon {
    width: 28px;
    height: 28px;
  }

  @media (max-width: 768px) {
    width: 48px;
    height: 48px;

    .ov-icon {
      width: 22px;
      height: 22px;
    }
  }
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  .ov-icon {
    width: 16px;
    height: 16px;
  }

  &--1 {
    top: 10%;
    right: 5%;
    animation: float-1 6s ease-in-out infinite;
  }
  &--2 {
    bottom: 15%;
    left: 0;
    animation: float-2 7s ease-in-out infinite;
  }
  &--3 {
    top: 50%;
    right: -5%;
    animation: float-3 8s ease-in-out infinite;
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    border-radius: 8px;

    .ov-icon {
      width: 13px;
      height: 13px;
    }
  }
}

// ─── Bento Cards ───
.bento-card {
  @include glass-card;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 16px;
  }
}

// ─── Filter Section ───
.filter-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 180px 150px 140px;
  gap: 12px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.search-field {
  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.7);
    transition: all 0.3s ease;

    &:focus-within {
      border-color: $sky;
      box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.12);
      background: white;
    }

    .search-icon {
      color: #94A3B8;
      flex-shrink: 0;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 0.875rem;
      color: #334155;
      background: transparent;

      &::placeholder {
        color: #94A3B8;
      }
    }

    .clear-btn {
      background: rgba(241, 245, 249, 0.8);
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748B;
      transition: all 0.2s ease;
      flex-shrink: 0;

      &:hover {
        background: #E2E8F0;
        color: #334155;
      }
    }
  }
}

.filter-dropdown,
.sort-dropdown {
  select {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.7);
    font-size: 0.875rem;
    color: #334155;
    cursor: pointer;
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: $sky;
      box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.12);
      background: white;
    }
  }
}

.more-filters-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.95);
    border-color: #CBD5E1;
    transform: translateY(-1px);
  }
}

// ─── Filter Tabs ───
.filter-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
  flex-wrap: wrap;
}

.tabs-label {
  font-size: 0.875rem;
  color: #64748B;
  font-weight: 500;
  margin-right: 4px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.7);
  color: #64748B;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: $sky;
    color: $sky;
    background: rgba(79, 195, 247, 0.05);
  }

  &.active {
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);
  }
}

// ─── Quick Filters ───
.quick-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 0.875rem;
  color: #64748B;
}

.quick-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 100px;
  border: none;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s ease;

  &.follow-up {
    background: rgba(254, 243, 199, 0.8);
    color: #B45309;

    &:hover, &.active {
      background: #FDE68A;
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.2);
    }
  }

  &.high-priority {
    background: rgba(254, 226, 226, 0.8);
    color: #DC2626;

    &:hover, &.active {
      background: #FECACA;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
    }
  }

  &.seen-today {
    background: rgba(241, 245, 249, 0.8);
    color: #475569;

    &:hover, &.active {
      background: #E2E8F0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }
  }
}

// ─── Access Notice ───
.access-notice {
  @include glass-card;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-left: 4px solid $amber;
  background: rgba(255, 251, 235, 0.9);
  backdrop-filter: blur(20px);

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }

  .notice-icon {
    color: $amber;
    flex-shrink: 0;
  }

  .notice-content {
    flex: 1;

    h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #92400E;
      margin: 0 0 4px;
    }

    p {
      font-size: 0.875rem;
      color: #A16207;
      margin: 0;
    }
  }

  .acknowledge-btn {
    padding: 8px 20px;
    background: linear-gradient(135deg, $amber 0%, #D97706 100%);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(245, 158, 11, 0.35);
    }
  }
}

// ─── Table Card ───
.table-card {
  padding: 0;
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.list-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: $navy;
  margin: 0;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(241, 245, 249, 0.6);
  border-radius: 10px;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(79, 195, 247, 0.1);
    color: $sky-dark;
    transform: translateY(-1px);
  }
}

// ─── Loading State ───
.loading-state {
  padding: 64px 32px;
  display: flex;
  justify-content: center;
}

// ─── Table ───
.table-wrapper {
  overflow-x: auto;
}

.patients-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: rgba(79, 195, 247, 0.04);
    border-bottom: 1px solid rgba(226, 232, 240, 0.6);

    th {
      padding: 14px 24px;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.05em;

      @media (max-width: 768px) {
        padding: 12px 16px;
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid rgba(226, 232, 240, 0.5);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(79, 195, 247, 0.03);
      }

      &:last-child {
        border-bottom: none;
      }
    }

    td {
      padding: 14px 24px;
      vertical-align: middle;

      @media (max-width: 768px) {
        padding: 12px 16px;
      }
    }
  }
}

.patient-cell {
  .patient-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .patient-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .patient-name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1E293B;
    margin: 0;
  }

  .patient-id {
    font-size: 0.75rem;
    color: #94A3B8;
    margin: 0;
  }
}

.contact-cell {
  .contact-phone {
    font-size: 0.875rem;
    color: #1E293B;
    margin: 0 0 2px;
  }

  .contact-email {
    font-size: 0.75rem;
    color: #94A3B8;
    margin: 0;
  }
}

.tags-cell {
  .tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 0.6875rem;
    font-weight: 500;

    &.follow-up {
      background: rgba(254, 243, 199, 0.8);
      color: #B45309;
    }

    &.high-priority {
      background: rgba(254, 226, 226, 0.8);
      color: #DC2626;
    }

    &.new-patient {
      background: rgba(219, 234, 254, 0.8);
      color: #2563EB;
    }

    &.chronic {
      background: rgba(243, 232, 255, 0.8);
      color: #7C3AED;
    }

    &.active {
      background: rgba(209, 250, 229, 0.8);
      color: #059669;
    }
  }
}

.last-seen-cell {
  .seen-date {
    font-size: 0.875rem;
    color: #1E293B;
    margin: 0 0 2px;
  }

  .seen-ago {
    font-size: 0.75rem;
    color: #94A3B8;
    margin: 0;
  }
}

.tasks-cell {
  .pending-badge {
    display: inline-block;
    padding: 4px 10px;
    background: rgba(219, 234, 254, 0.8);
    color: #2563EB;
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .no-tasks {
    font-size: 0.75rem;
    color: #94A3B8;
  }
}

.actions-cell {
  .action-buttons {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .row-action-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 8px;
    color: #64748B;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;

    &:hover {
      background: rgba(79, 195, 247, 0.08);
      color: $sky-dark;
    }

    .starred {
      color: $amber;
    }
  }
}

// ─── Empty State ───
.empty-state {
  text-align: center;
  padding: 64px 32px;
}

.empty-illustration {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, rgba(79, 195, 247, 0.12) 0%, rgba(79, 195, 247, 0.04) 100%);
  border-radius: 50%;
  margin-bottom: 24px;

  .empty-icon {
    color: $sky;
  }
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1E293B;
  margin: 0 0 8px;
}

.empty-description {
  font-size: 0.9375rem;
  color: #64748B;
  margin: 0 auto;
  max-width: 320px;
}

// ─── Pagination ───
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.5);

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }
}

.pagination-info {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  color: #64748B;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;

  &:hover:not(:disabled) {
    background: rgba(79, 195, 247, 0.08);
    border-color: rgba(79, 195, 247, 0.3);
    color: $sky-dark;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.page-num.active {
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border-color: transparent;
    color: white;
    box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);
  }
}

.pagination-ellipsis {
  padding: 0 4px;
  color: #94A3B8;
}

// ─── Animations ───
@keyframes pulse-glow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float-1 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(5deg); }
}

@keyframes float-2 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(-5deg); }
}

@keyframes float-3 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(3deg); }
}
</style>
