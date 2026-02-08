<template>
  <div class="timeline-tab">
    <div class="section-header-bar">
      <div class="header-title">
        <v-icon name="hi-clock" scale="1.1" />
        <h3>Activity Timeline</h3>
      </div>
      <span class="total-badge">{{ pagination?.total || items.length || 0 }} events</span>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton-timeline" v-for="n in 5" :key="n">
        <div class="skeleton-marker"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>

    <!-- Timeline Content -->
    <div v-else-if="items.length" class="timeline">
      <div
        class="timeline-item"
        v-for="(event, index) in items"
        :key="index"
      >
        <div class="timeline-marker" :class="event.type">
          <v-icon :name="getTimelineIcon(event.type)" scale="0.7" />
        </div>
        <div class="timeline-card">
          <div class="timeline-header">
            <span class="timeline-type" :class="event.type">{{ formatEventType(event.type) }}</span>
            <span class="timeline-date">{{ formatDate(event.date || event.created_at) }}</span>
          </div>
          <p class="timeline-desc">{{ getTimelineDescription(event) }}</p>
          <div class="timeline-meta" v-if="event.data">
            <span v-if="event.data.status" class="meta-tag status" :class="event.data.status?.toLowerCase()">
              {{ event.data.status }}
            </span>
            <span v-if="event.data.appointmentType" class="meta-tag type">
              {{ event.data.appointmentType }}
            </span>
            <span v-if="event.data.medicationCount" class="meta-tag">
              {{ event.data.medicationCount }} medication(s)
            </span>
            <span v-if="event.data.triageLevel" class="meta-tag triage" :class="event.data.triageLevel">
              {{ event.data.triageLevel }}
            </span>
            <span v-if="event.data.totalAmount" class="meta-tag amount">
              {{ formatCurrency(event.data.totalAmount) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="empty-icon-wrapper">
        <v-icon name="hi-clock" scale="2.5" />
      </div>
      <h4>No Activity</h4>
      <p>No timeline events recorded for this patient</p>
    </div>

    <!-- Pagination -->
    <div v-if="pagination?.totalPages > 1" class="pagination">
      <button
        :disabled="pagination.page <= 1"
        @click="changePage(pagination.page - 1)"
        class="page-btn"
      >
        <v-icon name="hi-chevron-left" scale="0.9" />
        <span>Previous</span>
      </button>
      <div class="page-indicator">
        <span class="current">{{ pagination.page }}</span>
        <span class="separator">/</span>
        <span class="total">{{ pagination.totalPages }}</span>
      </div>
      <button
        :disabled="pagination.page >= pagination.totalPages"
        @click="changePage(pagination.page + 1)"
        class="page-btn"
      >
        <span>Next</span>
        <v-icon name="hi-chevron-right" scale="0.9" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import apiFactory from '@/services/apiFactory';
import { format } from 'date-fns';

const props = defineProps({
  patientId: {
    type: String,
    required: true,
  },
});

const loading = ref(true);
const items = ref([]);
const pagination = ref(null);

function formatDate(date) {
  if (!date) return 'N/A';
  try {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  } catch {
    return 'N/A';
  }
}

function formatEventType(type) {
  const types = {
    appointment: 'Appointment',
    prescription: 'Prescription',
    health_checkup: 'Health Checkup',
    pharmacy_order: 'Pharmacy Order',
    purchase: 'Purchase',
    vital: 'Vital Recorded',
  };
  return types[type] || type;
}

function getTimelineIcon(type) {
  const icons = {
    appointment: 'hi-calendar',
    prescription: 'ri-capsule-line',
    health_checkup: 'hi-clipboard-check',
    pharmacy_order: 'hi-shopping-bag',
    purchase: 'hi-shopping-cart',
    vital: 'hi-heart',
  };
  return icons[type] || 'hi-clock';
}

function getTimelineDescription(event) {
  const { type, data } = event;
  switch (type) {
    case 'appointment':
      return `${data?.appointmentType || 'Consultation'} appointment - ${data?.status || 'Scheduled'}${data?.hasNotes ? ' (with clinical notes)' : ''}`;
    case 'prescription':
      return `Prescription with ${data?.medicationCount || 0} medication(s) - ${data?.status || 'Created'}`;
    case 'health_checkup':
      return `AI Health checkup completed${data?.triageLevel ? ` - ${data.triageLevel} triage` : ''}${data?.conditionCount ? ` (${data.conditionCount} conditions identified)` : ''}`;
    case 'pharmacy_order':
      return `Pharmacy order placed - ${data?.itemCount || 0} item(s)${data?.status ? ` - ${data.status}` : ''}`;
    case 'vital':
      return `${data?.vitalType || 'Vital'} recorded${data?.value ? `: ${data.value}` : ''}`;
    default:
      return event.description || 'Activity recorded';
  }
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return '';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

async function fetchTimeline(page = 1) {
  try {
    loading.value = true;
    const response = await apiFactory.$_getSpecialistPatientTimeline(props.patientId, { page, limit: 20 });
    const data = response.data?.data || response.data;
    items.value = data.timeline || data.items || [];
    pagination.value = data.pagination || null;
  } catch (error) {
    console.error('Error fetching timeline:', error);
  } finally {
    loading.value = false;
  }
}

function changePage(page) {
  fetchTimeline(page);
}

onMounted(() => {
  fetchTimeline();
});
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-dark: #0288D1;
$emerald: #10B981;
$amber: #F59E0B;
$violet: #8B5CF6;
$rose: #F43F5E;

.timeline-tab {
  padding: 0;
}

.section-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .header-title {
    display: flex;
    align-items: center;
    gap: 10px;

    svg {
      color: $sky-dark;
    }

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: #21262D;
      margin: 0;
    }
  }

  .total-badge {
    padding: 6px 12px;
    background: rgba($sky, 0.1);
    color: $sky-dark;
    font-size: 12px;
    font-weight: 600;
    border-radius: 20px;
  }
}

.timeline {
  position: relative;
  padding-left: 30px;

  &::before {
    content: '';
    position: absolute;
    left: 11px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, $sky-dark, rgba($sky, 0.2));
    border-radius: 2px;
  }
}

.timeline-item {
  position: relative;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.timeline-marker {
  position: absolute;
  left: -30px;
  top: 4px;
  width: 24px;
  height: 24px;
  background: white;
  border: 2px solid $sky;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

  svg {
    color: $sky-dark;
  }

  &.appointment {
    border-color: $sky;
    svg { color: $sky-dark; }
  }

  &.prescription {
    border-color: $violet;
    svg { color: $violet; }
  }

  &.health_checkup {
    border-color: $emerald;
    svg { color: $emerald; }
  }

  &.pharmacy_order, &.purchase {
    border-color: $amber;
    svg { color: $amber; }
  }

  &.vital {
    border-color: $rose;
    svg { color: $rose; }
  }
}

.timeline-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.timeline-type {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &.appointment {
    background: rgba($sky, 0.1);
    color: $sky-dark;
  }

  &.prescription {
    background: rgba($violet, 0.1);
    color: $violet;
  }

  &.health_checkup {
    background: rgba($emerald, 0.1);
    color: $emerald;
  }

  &.pharmacy_order, &.purchase {
    background: rgba($amber, 0.1);
    color: darken($amber, 10%);
  }

  &.vital {
    background: rgba($rose, 0.1);
    color: $rose;
  }
}

.timeline-date {
  font-size: 12px;
  color: #6B7280;
}

.timeline-desc {
  font-size: 14px;
  color: #374151;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.timeline-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  background: #F3F4F6;
  color: #6B7280;
  font-weight: 500;

  &.status {
    &.completed { background: rgba($emerald, 0.1); color: $emerald; }
    &.cancelled { background: rgba($rose, 0.1); color: $rose; }
    &.open, &.pending { background: rgba($amber, 0.1); color: darken($amber, 10%); }
  }

  &.triage {
    &.emergency, &.emergency_ambulance { background: rgba($rose, 0.1); color: $rose; }
    &.consultation_24 { background: rgba($amber, 0.1); color: darken($amber, 10%); }
    &.consultation { background: rgba($sky, 0.1); color: $sky-dark; }
    &.self_care { background: rgba($emerald, 0.1); color: $emerald; }
  }

  &.amount {
    font-weight: 600;
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;

  .empty-icon-wrapper {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    background: rgba($sky, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      color: $sky-dark;
    }
  }

  h4 {
    font-size: 18px;
    font-weight: 600;
    color: #21262D;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: #6B7280;
    margin: 0;
  }
}

.loading-state {
  .skeleton-timeline {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;

    .skeleton-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-card {
      flex: 1;
      height: 80px;
      border-radius: 12px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #F9FAFB;
    border-color: $sky;
    color: $sky-dark;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-indicator {
  font-size: 14px;
  color: #6B7280;

  .current {
    font-weight: 600;
    color: $sky-dark;
  }

  .separator {
    margin: 0 4px;
  }
}
</style>
