<template>
  <div class="specialist-step">
    <!-- Hero Banner -->
    <div class="booking-hero">
      <div class="hero-icon-wrapper">
        <v-icon name="hi-users" scale="1.8" class="hero-icon" />
      </div>
      <div class="hero-text">
        <h2 class="hero-title">Choose Your Specialist</h2>
        <p class="hero-desc">Browse available specialists, review their profiles and ratings, then select the one that best fits your needs.</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <div class="filter-group">
        <label class="filter-label">Rating</label>
        <select v-model="filters.rating" class="filter-select" @change="fetchSpecialists">
          <option value="">Any</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Gender</label>
        <select v-model="filters.gender" class="filter-select" @change="fetchSpecialists">
          <option value="">Any</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Channel</label>
        <select v-model="filters.meeting_channel" class="filter-select" @change="fetchSpecialists">
          <option value="">Any</option>
          <option value="zoom">Zoom</option>
          <option value="google_meet">Google Meet</option>
          <option value="phone">Phone</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-state">
      <loader :useOverlay="false" style="position: relative" />
    </div>

    <!-- Specialist Grid -->
    <div v-else-if="specialists.length" class="specialist-grid">
      <specialist-card
        v-for="spec in specialists"
        :key="spec._id || spec.id"
        :specialist="spec"
        :isSelected="booking.specialist.id === (spec._id || spec.id)"
        @select="selectSpecialist"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <v-icon name="hi-users" scale="2.5" class="empty-icon" />
      <h3>No specialists available</h3>
      <p>Try adjusting your filters or selecting a different category.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue';
import Loader from '@/components/Loader/main-loader.vue';
import SpecialistCard from '../components/SpecialistCard.vue';

const $http = inject('$_HTTP');
const booking = inject('bookingState');

const specialists = ref([]);
const isLoading = ref(false);
const filters = ref({
  rating: '',
  gender: '',
  meeting_channel: '',
});

onMounted(() => {
  fetchSpecialists();
});

const fetchSpecialists = async () => {
  isLoading.value = true;
  try {
    const payload = {
      professional_category: booking.specialty.professional_category,
      specialist_category: booking.specialty.specialist_category,
    };
    if (filters.value.rating) payload.min_rating = Number(filters.value.rating);
    if (filters.value.gender) payload.gender = filters.value.gender;
    if (filters.value.meeting_channel) payload.meeting_channel = filters.value.meeting_channel;

    const { data } = await $http.$_getAvailableSpecialists(payload);
    specialists.value = data.data || data || [];
  } catch (error) {
    console.error('Error fetching specialists:', error);
    specialists.value = [];
  } finally {
    isLoading.value = false;
  }
};

const selectSpecialist = (spec) => {
  booking.setSpecialist({
    id: spec._id || spec.id,
    full_name: spec.full_name,
    profile: spec.profile,
    average_rating: spec.average_rating,
    professional_practice: spec.professional_practice?.area_of_specialty || spec.category || '',
  });
};
</script>

<style scoped lang="scss">
.specialist-step {
  padding: 16px 24px 32px;

  @media (max-width: 600px) {
    padding: 16px;
  }
}

.booking-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 60%, #0e7490 100%);
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 6px 24px rgba(14, 174, 196, 0.18);

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    padding: 20px 18px;
    gap: 12px;
  }
}

.hero-icon-wrapper {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  flex-shrink: 0;
}

.hero-icon {
  color: white;
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px;
}

.hero-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  line-height: 1.5;
}

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: 10px;
  }
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  background: white;
  cursor: pointer;
  min-width: 120px;

  &:focus {
    outline: none;
    border-color: #0EAEC4;
  }

  @media (max-width: 480px) {
    min-width: 100px;
    font-size: 13px;
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

.specialist-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;

  .empty-icon {
    color: #d1d5db;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
  }
}
</style>
