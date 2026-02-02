<template>
  <div
    class="doctor-card"
    :class="{ selected: isSelected, 'ai-match': isAiMatch }"
    @click="$emit('select')"
  >
    <!-- AI Match Badge -->
    <div class="ai-badge" v-if="isAiMatch">
      <v-icon name="hi-sparkles" scale="0.65" />
      AI Best Match
    </div>

    <!-- Diaspora Badge -->
    <div class="diaspora-badge" v-if="isDiaspora">
      <v-icon name="hi-globe" scale="0.6" />
      Diaspora
    </div>

    <div class="card-header">
      <div class="avatar-wrapper">
        <rc-avatar
          size="lg"
          :firstName="firstName"
          :lastName="lastName"
          :modelValue="profileImage"
        />
        <img
          v-if="countryFlag"
          :src="countryFlag"
          :alt="country"
          class="country-flag"
        />
      </div>
      <div class="doctor-info">
        <h4 class="doctor-name">{{ fullName }}</h4>
        <p class="doctor-specialty">{{ specialty }}</p>
        <div class="doctor-meta">
          <span class="experience" v-if="yearsExperience">
            <v-icon name="hi-briefcase" scale="0.7" />
            {{ yearsExperience }} years
          </span>
          <span class="rating" v-if="rating">
            <v-icon name="bi-star-fill" scale="0.65" class="star" />
            {{ rating.toFixed(1) }}
            <span class="review-count">({{ reviewCount }})</span>
          </span>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <div class="price-info">
        <span class="price">{{ formatPrice(price) }}</span>
        <span class="duration">/ {{ duration }} min</span>
      </div>
      <button class="select-btn" :class="{ selected: isSelected }">
        <v-icon v-if="isSelected" name="hi-check" scale="0.85" />
        {{ isSelected ? 'Selected' : 'Select' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import RcAvatar from '@/components/RCAvatar';

const props = defineProps({
  fullName: { type: String, required: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  specialty: { type: String, default: '' },
  yearsExperience: { type: Number, default: null },
  rating: { type: Number, default: null },
  reviewCount: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  duration: { type: Number, default: 30 },
  country: { type: String, default: '' },
  countryFlag: { type: String, default: '' },
  isDiaspora: { type: Boolean, default: false },
  isAiMatch: { type: Boolean, default: false },
  isSelected: { type: Boolean, default: false },
});

defineEmits(['select']);

const formatPrice = (amount) => {
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
$v2-orange: #FF9800;
$v2-orange-light: #FFF3E0;
$v2-success: #4CAF50;

.doctor-card {
  position: relative;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $v2-sky;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(79, 195, 247, 0.12);
  }

  &.selected {
    border-color: $v2-sky;
    background: $v2-sky-light;
  }

  &.ai-match {
    border-color: rgba($v2-orange, 0.4);

    &:hover {
      border-color: $v2-orange;
    }

    &.selected {
      border-color: $v2-orange;
      background: $v2-orange-light;
    }
  }
}

.ai-badge {
  position: absolute;
  top: -10px;
  left: 16px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: $v2-orange;
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.diaspora-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: #8B5CF6;
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;

  // Remove orange border from avatar
  :deep(.avatar) {
    border: 2px solid #e5e7eb;
    padding: 2px;
  }
}

.country-flag {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid white;
  object-fit: cover;
}

.doctor-info {
  flex: 1;
  min-width: 0;
}

.doctor-name {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doctor-specialty {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 8px;
}

.doctor-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.experience,
.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;

  svg {
    color: #9ca3af;
  }
}

.rating {
  .star {
    color: #fbbf24;
  }
}

.review-count {
  color: #9ca3af;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
}

.price-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.price {
  font-size: 18px;
  font-weight: 700;
  color: $v2-success;
}

.duration {
  font-size: 12px;
  color: #9ca3af;
}

.select-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border: 2px solid $v2-sky;
  border-radius: 10px;
  background: white;
  font-size: 13px;
  font-weight: 600;
  color: $v2-sky-dark;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: $v2-sky-light;
  }

  &.selected {
    background: $v2-sky;
    color: white;
    border-color: $v2-sky;
  }

  .ai-match & {
    border-color: $v2-orange;
    color: $v2-orange;

    &:hover {
      background: $v2-orange-light;
    }

    &.selected {
      background: $v2-orange;
      color: white;
      border-color: $v2-orange;
    }
  }
}
</style>
