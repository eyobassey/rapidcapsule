<template>
  <div class="summary-card">
    <h3 class="card-title">Appointment Summary</h3>

    <!-- Specialist Info -->
    <div class="specialist-row">
      <rc-avatar
        size="lg"
        :firstName="specialist.profile?.first_name || ''"
        :lastName="specialist.profile?.last_name || ''"
        :modelValue="specialist.profile?.profile_photo || specialist.profile?.profile_image"
      />
      <div class="specialist-details">
        <h4 class="specialist-name">{{ specialist.full_name }}</h4>
        <p class="specialist-specialty">{{ specialist.professional_practice?.area_of_specialty || specialist.specialty || category }}</p>
        <div class="specialist-rating" v-if="specialist.average_rating">
          <v-icon name="bi-star-fill" scale="0.65" class="star" />
          <span>{{ specialist.average_rating?.toFixed(1) }}</span>
        </div>
      </div>
    </div>

    <!-- Details List -->
    <div class="details-list">
      <div class="detail-item">
        <div class="detail-icon">
          <v-icon name="hi-clipboard-list" scale="0.85" />
        </div>
        <div class="detail-content">
          <span class="detail-label">Service Type</span>
          <span class="detail-value">{{ urgencyLabel }} - {{ methodLabel }}</span>
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-icon">
          <v-icon name="hi-calendar" scale="0.85" />
        </div>
        <div class="detail-content">
          <span class="detail-label">Date</span>
          <span class="detail-value">{{ formattedDate }}</span>
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-icon">
          <v-icon name="hi-clock" scale="0.85" />
        </div>
        <div class="detail-content">
          <span class="detail-label">Time</span>
          <span class="detail-value">{{ formattedTime }}</span>
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-icon">
          <v-icon name="hi-globe-alt" scale="0.85" />
        </div>
        <div class="detail-content">
          <span class="detail-label">Timezone</span>
          <span class="detail-value">{{ timezone }}</span>
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-icon">
          <v-icon name="hi-tag" scale="0.85" />
        </div>
        <div class="detail-content">
          <span class="detail-label">Appointment Type</span>
          <span class="detail-value">Initial Consultation</span>
        </div>
      </div>
    </div>

    <!-- Price -->
    <div class="price-row">
      <span class="price-label">Consultation Fee</span>
      <span class="price-value">{{ formatCurrency(price) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { format, parseISO } from 'date-fns';
import RcAvatar from '@/components/RCAvatar';

const props = defineProps({
  specialist: { type: Object, default: () => ({}) },
  category: { type: String, default: '' },
  urgency: { type: String, default: '' },
  method: { type: String, default: '' },
  date: { type: String, default: '' },
  time: { type: String, default: '' },
  timezone: { type: String, default: '' },
  price: { type: Number, default: 0 },
});

const urgencyLabel = computed(() => {
  return props.urgency === 'urgent' ? 'Urgent Care' : 'Routine Checkup';
});

const methodLabel = computed(() => {
  const methods = {
    video: 'Video Call',
    audio: 'Audio Call',
    chat: 'Chat',
  };
  return methods[props.method] || props.method;
});

const formattedDate = computed(() => {
  if (!props.date) return '-';
  try {
    const date = typeof props.date === 'string' ? parseISO(props.date) : props.date;
    return format(date, 'EEEE, MMMM d, yyyy');
  } catch {
    return props.date;
  }
});

const formattedTime = computed(() => {
  const time = props.time;
  if (!time) return '-';
  if (time.includes('AM') || time.includes('PM')) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
});

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-success: #4CAF50;

.summary-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 20px;
}

.specialist-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f3f4f6;
  margin-bottom: 20px;

  // Remove orange border from avatar
  :deep(.avatar) {
    border: 2px solid #e5e7eb;
    padding: 2px;
  }
}

.specialist-details {
  flex: 1;
}

.specialist-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px;
}

.specialist-specialty {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 6px;
}

.specialist-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;

  .star {
    color: #fbbf24;
  }
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 14px;
}

.detail-icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $v2-sky-light;
  border-radius: 10px;
  color: $v2-sky-dark;
  flex-shrink: 0;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
  margin-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.price-label {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
}

.price-value {
  font-size: 22px;
  font-weight: 700;
  color: $v2-success;
}
</style>
