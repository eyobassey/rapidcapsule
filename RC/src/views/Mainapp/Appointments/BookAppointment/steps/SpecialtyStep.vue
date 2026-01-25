<template>
  <div class="specialty-step">
    <!-- Hero Banner -->
    <div class="booking-hero">
      <div class="hero-icon-wrapper">
        <v-icon name="fa-stethoscope" scale="1.8" class="hero-icon" />
      </div>
      <div class="hero-text">
        <h2 class="hero-title">Find the Right Specialist</h2>
        <p class="hero-desc">Choose your preferred medical professional and specialty to get matched with the best healthcare provider for your needs.</p>
      </div>
    </div>

    <!-- Professional Category -->
    <div class="step-section">
      <h3 class="section-title">What type of professional do you need?</h3>
      <div class="category-grid">
        <div
          v-for="cat in professionalCategories"
          :key="cat.value"
          class="category-card"
          :class="{ selected: booking.specialty.professional_category === cat.value }"
          @click="selectProfessionalCategory(cat.value)"
        >
          <v-icon :name="cat.icon" scale="1.4" class="card-icon" />
          <span class="card-label">{{ cat.label }}</span>
          <v-icon
            v-if="booking.specialty.professional_category === cat.value"
            name="hi-check-circle"
            scale="0.8"
            class="check-icon"
          />
        </div>
      </div>
    </div>

    <!-- Specialist Subcategory -->
    <div class="step-section" v-if="booking.specialty.professional_category">
      <h3 class="section-title">Select a specialist category</h3>
      <div class="category-grid subcategory-grid">
        <div
          v-for="sub in specialistCategories"
          :key="sub.value"
          class="category-card subcategory-card"
          :class="{ selected: booking.specialty.specialist_category === sub.value }"
          @click="booking.specialty.specialist_category = sub.value"
        >
          <v-icon :name="sub.icon" scale="1.2" class="card-icon" />
          <span class="card-label">{{ sub.label }}</span>
          <v-icon
            v-if="booking.specialty.specialist_category === sub.value"
            name="hi-check-circle"
            scale="0.8"
            class="check-icon"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue';

const booking = inject('bookingState');

const professionalCategories = [
  { value: 'Medical Doctor', label: 'Medical Doctor', icon: 'gi-health-normal' },
  { value: 'Therapist', label: 'Therapist', icon: 'hi-heart' },
  { value: 'Dietitian', label: 'Dietitian', icon: 'gi-meal' },
  { value: 'Care Giver', label: 'Care Giver', icon: 'hi-hand' },
  { value: 'Lab Technician', label: 'Lab Technician', icon: 'gi-microscope' },
  { value: 'Pharmacist', label: 'Pharmacist', icon: 'gi-medicines' },
];

const specialistCategories = [
  { value: 'General Practitioner', label: 'General Practitioner', icon: 'hi-user' },
  { value: 'Cardiologist', label: 'Cardiologist', icon: 'hi-heart' },
  { value: 'Pediatrician', label: 'Pediatrician', icon: 'hi-users' },
  { value: 'Neurologist', label: 'Neurologist', icon: 'gi-brain' },
  { value: 'Dermatologist', label: 'Dermatologist', icon: 'hi-sun' },
  { value: 'Oncologist', label: 'Oncologist', icon: 'gi-dna2' },
];

const selectProfessionalCategory = (value) => {
  booking.specialty.professional_category = value;
  booking.specialty.specialist_category = '';
};
</script>

<style scoped lang="scss">
.specialty-step {
  padding: 16px 24px 32px;

  @media (max-width: 600px) {
    padding: 16px;
  }
}

.booking-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 32px;
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 60%, #0e7490 100%);
  border-radius: 18px;
  margin-bottom: 28px;
  box-shadow: 0 8px 32px rgba(14, 174, 196, 0.2);

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    padding: 24px 20px;
    gap: 14px;
  }
}

.hero-icon-wrapper {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  flex-shrink: 0;
  backdrop-filter: blur(8px);

  @media (max-width: 600px) {
    width: 56px;
    height: 56px;
  }
}

.hero-icon {
  color: white;
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin: 0 0 6px;
  line-height: 1.3;

  @media (max-width: 600px) {
    font-size: 18px;
  }
}

.hero-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.85);
  margin: 0;
  line-height: 1.5;

  @media (max-width: 600px) {
    font-size: 13px;
  }
}

.step-section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px;

  @media (max-width: 600px) {
    font-size: 16px;
  }
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.subcategory-grid {
  grid-template-columns: repeat(3, 1fr);

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  text-align: center;

  &:hover {
    border-color: #0EAEC4;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(14, 174, 196, 0.1);
  }

  &.selected {
    border-color: #0EAEC4;
    background: rgba(14, 174, 196, 0.05);

    .card-icon {
      color: #0EAEC4;
    }

    .card-label {
      color: #0EAEC4;
      font-weight: 600;
    }
  }
}

.subcategory-card {
  padding: 20px 14px;
}

.card-icon {
  color: #6b7280;
  transition: color 0.2s ease;
}

.card-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: color 0.2s ease;
}

.check-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #0EAEC4;
}
</style>
