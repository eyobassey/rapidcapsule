<template>
  <div
    class="specialist-card"
    :class="{ selected: isSelected }"
    @click="$emit('select', specialist)"
  >
    <div class="card-header">
      <rc-avatar
        size="lg"
        :firstName="specialist.profile?.first_name || ''"
        :lastName="specialist.profile?.last_name || ''"
        :modelValue="specialist.profile?.profile_image"
      />
      <div v-if="isSelected" class="selected-badge">
        <v-icon name="hi-check-circle" scale="0.9" />
        <span>Selected</span>
      </div>
    </div>

    <div class="card-body">
      <h3 class="specialist-name">{{ specialist.full_name }}</h3>
      <p class="specialist-specialty">{{ specialist.professional_practice?.area_of_specialty || specialist.category || '' }}</p>

      <div class="specialist-meta">
        <div class="meta-item" v-if="specialist.average_rating">
          <v-icon name="bi-star-fill" scale="0.7" class="star-icon" />
          <span>{{ Number(specialist.average_rating).toFixed(1) }}</span>
        </div>
        <div class="meta-item" v-if="specialist.professional_practice?.years_of_practice">
          <v-icon name="hi-briefcase" scale="0.7" />
          <span>{{ specialist.professional_practice.years_of_practice }} yrs</span>
        </div>
      </div>

      <div class="specialist-channels" v-if="specialist.meeting_channels?.length">
        <span
          v-for="channel in specialist.meeting_channels"
          :key="channel"
          class="channel-tag"
        >
          {{ formatChannel(channel) }}
        </span>
      </div>

      <p class="specialist-bio" v-if="specialist.bio">{{ truncateBio(specialist.bio) }}</p>
    </div>

    <div class="card-footer">
      <button class="select-btn" :class="{ 'btn-selected': isSelected }">
        {{ isSelected ? 'Selected' : 'Select' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import RcAvatar from '@/components/RCAvatar';

const props = defineProps({
  specialist: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
});

defineEmits(['select']);

const formatChannel = (channel) => {
  const map = { zoom: 'Zoom', google_meet: 'Google Meet', phone: 'Phone' };
  return map[channel] || channel;
};

const truncateBio = (bio) => {
  if (!bio) return '';
  return bio.length > 80 ? bio.substring(0, 80) + '...' : bio;
};
</script>

<style scoped lang="scss">
.specialist-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    border-color: #0EAEC4;
    box-shadow: 0 4px 20px rgba(14, 174, 196, 0.1);
    transform: translateY(-2px);
  }

  &.selected {
    border-color: #0EAEC4;
    background: rgba(14, 174, 196, 0.03);
    box-shadow: 0 4px 20px rgba(14, 174, 196, 0.15);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.selected-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #0EAEC4;
  font-size: 12px;
  font-weight: 600;
}

.card-body {
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
  margin: 0 0 12px;
}

.specialist-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6b7280;

  .star-icon {
    color: #fbbf24;
  }
}

.specialist-channels {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.channel-tag {
  padding: 3px 10px;
  background: rgba(14, 174, 196, 0.08);
  color: #0EAEC4;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.specialist-bio {
  font-size: 13px;
  color: #9ca3af;
  line-height: 1.5;
  margin: 0;
}

.card-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.select-btn {
  width: 100%;
  padding: 10px;
  border: 2px solid #0EAEC4;
  border-radius: 10px;
  background: white;
  color: #0EAEC4;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #0EAEC4;
    color: white;
  }

  &.btn-selected {
    background: #0EAEC4;
    color: white;
  }
}
</style>
