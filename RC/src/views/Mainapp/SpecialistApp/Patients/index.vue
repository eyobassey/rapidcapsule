<template>
  <div class="patients-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">Patient Directory</h1>
        <p class="page-subtitle">Manage and track all your patients</p>
      </div>
      <button class="add-patient-btn" @click="addNewPatient">
        <v-icon name="hi-plus" scale="0.9" />
        <span>Add Patient</span>
      </button>
    </div>

    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-content">
        <div class="hero-text">
          <h2 class="hero-title">Your Patients</h2>
          <p class="hero-subtitle">Manage and review patient records in one place</p>
        </div>
      </div>
      <div class="hero-stats" v-if="stats">
        <div class="stat-item">
          <span class="stat-value">{{ stats.totalPatients || 0 }}</span>
          <span class="stat-label">Total Patients</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.thisMonthPatients || 0 }}</span>
          <span class="stat-label">This Month</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ stats.thisWeekPatients || 0 }}</span>
          <span class="stat-label">This Week</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item starred">
          <span class="stat-value">
            <v-icon name="hi-solid-star" scale="0.7" class="star-icon" />
            {{ stats.starredPatients || 0 }}
          </span>
          <span class="stat-label">Starred</span>
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="filter-section">
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

    <!-- Stat Cards -->
    <div class="stat-cards">
      <div class="stat-card blue">
        <div class="stat-card-header">
          <div class="stat-card-icon">
            <v-icon name="hi-user-group" scale="1.1" />
          </div>
          <span class="stat-card-trend positive">+12% this month</span>
        </div>
        <h3 class="stat-card-value">{{ stats?.totalPatients || 0 }}</h3>
        <p class="stat-card-label">Total Patients</p>
      </div>

      <div class="stat-card orange">
        <div class="stat-card-header">
          <div class="stat-card-icon">
            <v-icon name="hi-calendar" scale="1.1" />
          </div>
          <span class="stat-card-trend warning">Needs attention</span>
        </div>
        <h3 class="stat-card-value">{{ quickStats.followUpDue || 0 }}</h3>
        <p class="stat-card-label">Follow-up Due</p>
      </div>

      <div class="stat-card green">
        <div class="stat-card-header">
          <div class="stat-card-icon">
            <v-icon name="hi-user-add" scale="1.1" />
          </div>
          <span class="stat-card-trend positive">+{{ stats?.thisWeekPatients || 0 }} this week</span>
        </div>
        <h3 class="stat-card-value">{{ stats?.thisMonthPatients || 0 }}</h3>
        <p class="stat-card-label">New This Month</p>
      </div>

      <div class="stat-card red">
        <div class="stat-card-header">
          <div class="stat-card-icon">
            <v-icon name="hi-flag" scale="1.1" />
          </div>
          <span class="stat-card-trend urgent">Urgent</span>
        </div>
        <h3 class="stat-card-value">{{ quickStats.highPriority || 0 }}</h3>
        <p class="stat-card-label">High Priority</p>
      </div>
    </div>

    <!-- Patient List Table -->
    <div class="patient-list-container">
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
.patients-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  padding-bottom: 100px;
  background: #F8FAFC;
  min-height: min-content;

  @media (max-width: 768px) {
    padding: 1rem;
    padding-bottom: 120px;
  }
}

// Page Header
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
}

.page-subtitle {
  font-size: 0.9375rem;
  color: #64748B;
  margin: 0;
}

.add-patient-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 50%, #0288D1 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(79, 195, 247, 0.4);
  }

  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
  }
}

// Hero Banner
.hero-banner {
  background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 50%, #0288D1 100%);
  border-radius: 1rem;
  padding: 1.75rem 2rem;
  margin-bottom: 1.5rem;
  color: white;
  box-shadow: 0 10px 40px rgba(79, 195, 247, 0.3);

  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 0.75rem;
  }
}

.hero-content {
  margin-bottom: 1.25rem;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.hero-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
}

.hero-subtitle {
  font-size: 0.9375rem;
  opacity: 0.9;
  margin: 0;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);

  @media (max-width: 768px) {
    gap: 0.75rem;
    flex-wrap: wrap;
    justify-content: center;
  }
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;

  &.starred .stat-value {
    display: flex;
    align-items: center;
    gap: 0.25rem;

    .star-icon {
      color: #fbbf24;
    }
  }
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-divider {
  width: 1px;
  height: 2rem;
  background: rgba(255, 255, 255, 0.2);

  @media (max-width: 768px) {
    display: none;
  }
}

// Filter Section
.filter-section {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #E2E8F0;
}

.filter-grid {
  display: grid;
  grid-template-columns: 1fr 180px 150px 140px;
  gap: 1rem;
  margin-bottom: 1rem;

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
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border: 1px solid #E2E8F0;
    border-radius: 0.5rem;
    background: white;
    transition: all 0.2s ease;

    &:focus-within {
      border-color: #4FC3F7;
      box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.1);
    }

    .search-icon {
      color: #94A3B8;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 0.875rem;
      color: #334155;

      &::placeholder {
        color: #94A3B8;
      }
    }

    .clear-btn {
      background: #F1F5F9;
      border: none;
      border-radius: 50%;
      width: 1.5rem;
      height: 1.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748B;
      transition: all 0.2s ease;

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
    padding: 0.75rem 1rem;
    border: 1px solid #E2E8F0;
    border-radius: 0.5rem;
    background: white;
    font-size: 0.875rem;
    color: #334155;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: #4FC3F7;
      box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.1);
    }
  }
}

.more-filters-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  background: white;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #F8FAFC;
    border-color: #CBD5E1;
  }
}

// Filter Tabs
.filter-tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #E2E8F0;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.tabs-label {
  font-size: 0.875rem;
  color: #64748B;
  font-weight: 500;
  margin-right: 0.5rem;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border: 1px solid #E2E8F0;
  border-radius: 2rem;
  background: white;
  color: #64748B;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #4FC3F7;
    color: #4FC3F7;
  }

  &.active {
    background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
    border-color: transparent;
    color: white;
  }
}

// Quick Filters
.quick-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.quick-label {
  font-size: 0.875rem;
  color: #64748B;
}

.quick-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 2rem;
  border: none;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &.follow-up {
    background: #FEF3C7;
    color: #B45309;

    &:hover, &.active {
      background: #FDE68A;
    }
  }

  &.high-priority {
    background: #FEE2E2;
    color: #DC2626;

    &:hover, &.active {
      background: #FECACA;
    }
  }

  &.seen-today {
    background: #F1F5F9;
    color: #475569;

    &:hover, &.active {
      background: #E2E8F0;
    }
  }
}

// Access Notice
.access-notice {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border: 1px solid #F59E0B;
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15);

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }

  .notice-icon {
    color: #F59E0B;
    flex-shrink: 0;
  }

  .notice-content {
    flex: 1;

    h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #92400E;
      margin: 0 0 0.25rem;
    }

    p {
      font-size: 0.875rem;
      color: #A16207;
      margin: 0;
    }
  }

  .acknowledge-btn {
    padding: 0.625rem 1.25rem;
    background: #F59E0B;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      background: #D97706;
    }
  }
}

// Stat Cards
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #E2E8F0;

  .stat-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 0.75rem;
  }

  .stat-card-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stat-card-trend {
    font-size: 0.6875rem;
    font-weight: 600;

    &.positive {
      color: #059669;
    }

    &.warning {
      color: #D97706;
    }

    &.urgent {
      color: #DC2626;
    }
  }

  .stat-card-value {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1E293B;
    margin: 0 0 0.25rem;
  }

  .stat-card-label {
    font-size: 0.875rem;
    color: #64748B;
    margin: 0;
  }

  &.blue .stat-card-icon {
    background: #DBEAFE;
    color: #2563EB;
  }

  &.orange .stat-card-icon {
    background: #FFEDD5;
    color: #EA580C;
  }

  &.green .stat-card-icon {
    background: #D1FAE5;
    color: #059669;
  }

  &.red .stat-card-icon {
    background: #FEE2E2;
    color: #DC2626;
  }
}

// Patient List Container
.patient-list-container {
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid #E2E8F0;
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #E2E8F0;
}

.list-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-btn {
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #F1F5F9;
    color: #334155;
  }
}

// Loading State
.loading-state {
  padding: 4rem 2rem;
  display: flex;
  justify-content: center;
}

// Table
.table-wrapper {
  overflow-x: auto;
}

.patients-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: #F8FAFC;
    border-bottom: 1px solid #E2E8F0;

    th {
      padding: 1rem 1.5rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid #E2E8F0;
      cursor: pointer;
      transition: background 0.15s ease;

      &:hover {
        background: #F8FAFC;
      }

      &:last-child {
        border-bottom: none;
      }
    }

    td {
      padding: 1rem 1.5rem;
      vertical-align: middle;
    }
  }
}

.patient-cell {
  .patient-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .patient-details {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
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
    margin: 0 0 0.125rem;
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
    gap: 0.375rem;
  }

  .tag {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 2rem;
    font-size: 0.6875rem;
    font-weight: 500;

    &.follow-up {
      background: #FEF3C7;
      color: #B45309;
    }

    &.high-priority {
      background: #FEE2E2;
      color: #DC2626;
    }

    &.new-patient {
      background: #DBEAFE;
      color: #2563EB;
    }

    &.chronic {
      background: #F3E8FF;
      color: #7C3AED;
    }

    &.active {
      background: #D1FAE5;
      color: #059669;
    }
  }
}

.last-seen-cell {
  .seen-date {
    font-size: 0.875rem;
    color: #1E293B;
    margin: 0 0 0.125rem;
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
    padding: 0.25rem 0.5rem;
    background: #DBEAFE;
    color: #2563EB;
    border-radius: 0.25rem;
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
    gap: 0.25rem;
  }

  .row-action-btn {
    width: 2rem;
    height: 2rem;
    border: none;
    background: transparent;
    border-radius: 0.5rem;
    color: #64748B;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: #F1F5F9;
      color: #334155;
    }

    .starred {
      color: #F59E0B;
    }
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-illustration {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, rgba(79, 195, 247, 0.1) 0%, rgba(79, 195, 247, 0.05) 100%);
  border-radius: 50%;
  margin-bottom: 1.5rem;

  .empty-icon {
    color: #4FC3F7;
  }
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1E293B;
  margin: 0 0 0.5rem;
}

.empty-description {
  font-size: 0.9375rem;
  color: #64748B;
  margin: 0;
  max-width: 320px;
  margin: 0 auto;
}

// Pagination
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #E2E8F0;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 1rem;
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
  gap: 0.375rem;
}

.pagination-btn {
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  border: 1px solid #E2E8F0;
  background: white;
  border-radius: 0.5rem;
  color: #64748B;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #F8FAFC;
    border-color: #CBD5E1;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.page-num.active {
    background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
    border-color: transparent;
    color: white;
  }
}

.pagination-ellipsis {
  padding: 0 0.25rem;
  color: #94A3B8;
}
</style>
