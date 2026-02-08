<template>
  <div class="checkups-tab">
    <!-- Header with pagination info -->
    <div class="checkups-header">
      <div class="checkups-count">
        <span class="count-number">{{ pagination.total || 0 }}</span>
        <span class="count-label">Health Checkups</span>
      </div>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="loading" class="checkups-skeleton">
      <div v-for="i in 3" :key="i" class="skeleton-checkup">
        <div class="skeleton-shimmer" />
      </div>
    </div>

    <!-- Checkups Content -->
    <div v-else-if="checkups.length" class="checkups-content">
      <!-- Stats Overview -->
      <div class="checkups-overview">
        <div class="overview-stat">
          <div class="overview-stat__icon overview-stat__icon--sky">
            <v-icon name="hi-shield-check" scale="1" />
          </div>
          <div class="overview-stat__info">
            <span class="overview-stat__value">{{ pagination.total }}</span>
            <span class="overview-stat__label">Total Checkups</span>
          </div>
        </div>
        <div class="overview-stat">
          <div class="overview-stat__icon overview-stat__icon--emerald">
            <v-icon name="hi-calendar" scale="1" />
          </div>
          <div class="overview-stat__info">
            <span class="overview-stat__value">{{ getLastCheckupDate }}</span>
            <span class="overview-stat__label">Last Checkup</span>
          </div>
        </div>
        <div class="overview-stat">
          <div :class="['overview-stat__icon', `overview-stat__icon--${getLatestTriageColor}`]">
            <v-icon name="hi-flag" scale="1" />
          </div>
          <div class="overview-stat__info">
            <span class="overview-stat__value">{{ getLatestTriageLabel }}</span>
            <span class="overview-stat__label">Latest Triage</span>
          </div>
        </div>
      </div>

      <!-- Checkups Timeline -->
      <div class="checkups-timeline">
        <div
          v-for="(checkup, index) in checkups"
          :key="checkup._id"
          class="checkup-card"
          :style="{ animationDelay: `${index * 0.08}s` }"
          @click="viewCheckupDetails(checkup._id)"
        >
          <!-- Timeline Indicator -->
          <div class="checkup-card__timeline">
            <div :class="['timeline-dot', `timeline-dot--${getTriageClass(checkup.triage_level)}`]" />
            <div v-if="index < checkups.length - 1" class="timeline-line" />
          </div>

          <!-- Card Content -->
          <div class="checkup-card__content">
            <!-- Header -->
            <div class="checkup-card__header">
              <div class="checkup-card__date-badge">
                <v-icon name="hi-calendar" scale="0.65" />
                <span>{{ formatDate(checkup.created_at) }}</span>
              </div>
              <span :class="['triage-badge', `triage-badge--${getTriageClass(checkup.triage_level)}`]">
                <span class="triage-badge__icon">
                  <v-icon :name="getTriageIcon(checkup.triage_level)" scale="0.55" />
                </span>
                {{ formatTriageLevel(checkup.triage_level) }}
              </span>
            </div>

            <!-- Condition -->
            <div class="checkup-card__condition">
              <div class="condition-icon">
                <v-icon name="hi-clipboard-list" scale="1.1" />
              </div>
              <div class="condition-info">
                <span class="condition-label">Primary Condition</span>
                <span class="condition-name">{{ checkup.primary_condition || 'No diagnosis' }}</span>
                <span v-if="checkup.probability" class="condition-probability">
                  {{ Math.round(checkup.probability * 100) }}% probability
                </span>
              </div>
            </div>

            <!-- Symptoms Preview -->
            <div v-if="checkup.symptoms?.length" class="checkup-card__symptoms">
              <div class="symptoms-header">
                <v-icon name="hi-annotation" scale="0.65" />
                <span>{{ checkup.symptoms.length }} Symptoms Reported</span>
              </div>
              <div class="symptoms-grid">
                <span
                  v-for="symptom in checkup.symptoms.slice(0, 3)"
                  :key="symptom.id || symptom.name"
                  class="symptom-chip"
                >
                  {{ symptom.name }}
                </span>
                <span v-if="checkup.symptoms.length > 3" class="symptoms-more">
                  +{{ checkup.symptoms.length - 3 }} more
                </span>
              </div>
            </div>

            <!-- View Details CTA -->
            <div class="checkup-card__cta">
              <v-icon name="hi-eye" scale="0.7" />
              <span>View Full Assessment</span>
              <v-icon name="hi-chevron-right" scale="0.7" />
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          class="pagination-btn"
          :disabled="!pagination.hasPrevPage"
          @click="fetchCheckups(pagination.page - 1)"
        >
          <v-icon name="hi-chevron-left" scale="0.8" />
          Previous
        </button>
        <span class="pagination-info">
          Page {{ pagination.page }} of {{ pagination.totalPages }}
        </span>
        <button
          class="pagination-btn"
          :disabled="!pagination.hasNextPage"
          @click="fetchCheckups(pagination.page + 1)"
        >
          Next
          <v-icon name="hi-chevron-right" scale="0.8" />
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-state__visual">
        <div class="shield-orb">
          <div class="shield-ring shield-ring--1" />
          <div class="shield-ring shield-ring--2" />
          <div class="shield-center">
            <v-icon name="hi-shield-check" scale="2" />
          </div>
        </div>
      </div>
      <div class="empty-state__content">
        <h3>No Health Checkups</h3>
        <p>AI health checkups will appear here when performed</p>
      </div>
    </div>

    <!-- Health Checkup Details Modal -->
    <HealthCheckupModal
      :is-open="isModalOpen"
      :checkup-id="selectedCheckupId"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import apiFactory from '@/services/apiFactory';
import { useToast } from 'vue-toast-notification';
import { usePharmacy } from '../composables/usePharmacy';
import HealthCheckupModal from './HealthCheckupModal.vue';

const { formatDate } = usePharmacy();

const props = defineProps({
  patientId: { type: String, required: true },
});

const $toast = useToast();
const loading = ref(false);
const checkups = ref([]);
const isModalOpen = ref(false);
const selectedCheckupId = ref(null);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
});

onMounted(() => {
  fetchCheckups(1);
});

watch(() => props.patientId, () => {
  fetchCheckups(1);
});

async function fetchCheckups(page = 1) {
  loading.value = true;
  try {
    const response = await apiFactory.$_getPharmacyPatientHealthCheckups(props.patientId, {
      page,
      limit: 10,
    });
    const result = response.data?.data || response.data?.result || response.data;
    if (result) {
      checkups.value = result.docs || [];
      pagination.value = {
        page: result.page || 1,
        limit: result.limit || 10,
        total: result.total || 0,
        totalPages: result.totalPages || 1,
        hasNextPage: result.hasNextPage || false,
        hasPrevPage: result.hasPrevPage || false,
      };
    }
  } catch (error) {
    console.error('Error fetching health checkups:', error);
    $toast.error('Failed to load health checkups');
  } finally {
    loading.value = false;
  }
}

function viewCheckupDetails(checkupId) {
  selectedCheckupId.value = checkupId;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  selectedCheckupId.value = null;
}

const getLastCheckupDate = computed(() => {
  if (!checkups.value.length) return 'N/A';
  const sorted = [...checkups.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const date = new Date(sorted[0].created_at);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(sorted[0].created_at);
});

const getLatestTriageLabel = computed(() => {
  if (!checkups.value.length) return 'N/A';
  const sorted = [...checkups.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return formatTriageLevel(sorted[0].triage_level);
});

const getLatestTriageColor = computed(() => {
  if (!checkups.value.length) return 'gray';
  const sorted = [...checkups.value].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return getTriageClass(sorted[0].triage_level);
});

function getTriageClass(level) {
  if (!level) return 'unknown';
  const l = level.toLowerCase();
  if (l.includes('emergency')) return 'emergency';
  if (l.includes('24')) return 'urgent';
  if (l.includes('consultation')) return 'consultation';
  if (l.includes('self')) return 'self-care';
  return 'unknown';
}

function getTriageIcon(level) {
  const triageClass = getTriageClass(level);
  const icons = {
    emergency: 'hi-exclamation',
    urgent: 'hi-clock',
    consultation: 'hi-user',
    'self-care': 'hi-home',
    unknown: 'hi-question-mark-circle',
  };
  return icons[triageClass] || 'hi-question-mark-circle';
}

function formatTriageLevel(level) {
  if (!level) return 'N/A';
  const l = level.toLowerCase();
  if (l.includes('emergency')) return 'Emergency';
  if (l.includes('24')) return 'See Doctor (24h)';
  if (l.includes('consultation')) return 'Consultation';
  if (l.includes('self')) return 'Self Care';
  return level.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$blue: #3B82F6;

.checkups-tab {
  min-height: 200px;
}

.checkups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.checkups-count {
  display: flex;
  align-items: baseline;
  gap: 8px;

  .count-number {
    font-size: 28px;
    font-weight: 700;
    color: $emerald;
  }

  .count-label {
    font-size: 14px;
    color: $color-g-54;
    font-weight: 500;
  }
}

.checkups-skeleton {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-checkup {
  height: 200px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba($color-g-92, 0.5);
  overflow: hidden;
  position: relative;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba($sky, 0.08) 50%, transparent 100%);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.checkups-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// Overview Stats
.checkups-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.overview-stat {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba($color-g-92, 0.5);
  border-radius: 16px;

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--sky {
      background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
      color: $sky-dark;
    }

    &--emerald {
      background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.2) 100%);
      color: $emerald;
    }

    &--emergency {
      background: linear-gradient(135deg, $rose-light 0%, rgba($rose, 0.2) 100%);
      color: $rose;
    }

    &--urgent {
      background: linear-gradient(135deg, $amber-light 0%, rgba($amber, 0.2) 100%);
      color: $amber;
    }

    &--consultation {
      background: linear-gradient(135deg, rgba($blue, 0.1) 0%, rgba($blue, 0.2) 100%);
      color: $blue;
    }

    &--self-care {
      background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.2) 100%);
      color: $emerald;
    }

    &--unknown, &--gray {
      background: rgba($color-g-67, 0.1);
      color: $color-g-54;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__value {
    font-size: 18px;
    font-weight: 700;
    color: $color-g-21;
  }

  &__label {
    font-size: 12px;
    color: $color-g-54;
    font-weight: 500;
  }
}

// Timeline
.checkups-timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.checkup-card {
  display: flex;
  gap: 20px;
  animation: fadeSlideUp 0.4s ease forwards;
  opacity: 0;
  cursor: pointer;

  @media (max-width: 600px) {
    gap: 14px;
  }

  &__timeline {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 24px;

    @media (max-width: 600px) {
      display: none;
    }
  }

  &__content {
    flex: 1;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba($color-g-92, 0.5);
    border-radius: 18px;
    padding: 22px;
    margin-bottom: 16px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
      border-color: rgba($emerald, 0.3);
      transform: translateY(-2px);
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__date-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: $color-g-54;

    svg {
      color: $color-g-67;
    }
  }

  &__condition {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 18px;
    background: rgba($sky-light, 0.4);
    border-radius: 14px;
    margin-bottom: 16px;
  }

  &__symptoms {
    padding-top: 16px;
    border-top: 1px solid rgba($color-g-92, 0.5);
    margin-bottom: 14px;
  }

  &__cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: rgba($emerald, 0.08);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: $emerald;
    transition: all 0.2s;

    &:hover {
      background: rgba($emerald, 0.15);
    }
  }
}

.timeline-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;

  &--emergency { background: $rose; }
  &--urgent { background: $amber; }
  &--consultation { background: $blue; }
  &--self-care { background: $emerald; }
  &--unknown { background: $color-g-67; }
}

.timeline-line {
  width: 2px;
  flex: 1;
  min-height: 40px;
  background: linear-gradient(180deg, rgba($color-g-92, 0.8) 0%, rgba($color-g-92, 0.3) 100%);
}

.condition-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: $sky-dark;
  flex-shrink: 0;
}

.condition-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.condition-label {
  font-size: 11px;
  color: $color-g-54;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.condition-name {
  font-size: 17px;
  font-weight: 700;
  color: $color-g-21;
}

.condition-probability {
  font-size: 12px;
  color: $emerald;
  font-weight: 600;
}

.symptoms-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: $color-g-54;
  font-weight: 500;
  margin-bottom: 10px;

  svg {
    color: $color-g-67;
  }
}

.symptoms-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.symptom-chip {
  padding: 6px 14px;
  background: rgba($sky, 0.08);
  border: 1px solid rgba($sky, 0.12);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: $sky-dark;
}

.symptoms-more {
  padding: 6px 14px;
  background: rgba($color-g-67, 0.08);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: $color-g-54;
}

// Triage Badge
.triage-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;

  &__icon {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &--emergency {
    background: rgba($rose, 0.1);
    color: $rose;
    .triage-badge__icon { background: rgba($rose, 0.15); }
  }

  &--urgent {
    background: rgba($amber, 0.1);
    color: darken($amber, 10%);
    .triage-badge__icon { background: rgba($amber, 0.15); }
  }

  &--consultation {
    background: rgba($blue, 0.1);
    color: $blue;
    .triage-badge__icon { background: rgba($blue, 0.15); }
  }

  &--self-care {
    background: rgba($emerald, 0.1);
    color: darken($emerald, 10%);
    .triage-badge__icon { background: rgba($emerald, 0.15); }
  }

  &--unknown {
    background: rgba($color-g-67, 0.1);
    color: $color-g-54;
    .triage-badge__icon { background: rgba($color-g-67, 0.15); }
  }
}

// Pagination
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding-top: 20px;
  border-top: 1px solid rgba($color-g-92, 0.5);
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba($color-g-92, 0.6);
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: $color-g-36;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: $emerald;
    color: $emerald;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.pagination-info {
  font-size: 13px;
  color: $color-g-54;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Empty State
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;

  &__visual {
    margin-bottom: 24px;
  }

  &__content {
    h3 {
      font-size: 18px;
      font-weight: 700;
      color: $color-g-21;
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
      color: $color-g-54;
    }
  }
}

.shield-orb {
  position: relative;
  width: 100px;
  height: 100px;
}

.shield-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba($emerald, 0.25);

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

.shield-center {
  position: absolute;
  inset: 24px;
  background: linear-gradient(135deg, $emerald-light 0%, rgba($emerald, 0.2) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $emerald;
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
