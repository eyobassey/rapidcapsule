<template>
  <div class="medical-history">
    <!-- Allergies Warning (Prominent) -->
    <div v-if="medicalHistory.allergies?.length" class="allergy-warning">
      <div class="allergy-warning__header">
        <div class="allergy-warning__icon">
          <v-icon name="hi-exclamation" scale="1" />
        </div>
        <h3>Known Allergies</h3>
      </div>
      <div class="allergy-warning__tags">
        <span
          v-for="allergy in medicalHistory.allergies"
          :key="allergy"
          class="allergy-tag"
        >
          <v-icon name="hi-x-circle" scale="0.6" />
          {{ allergy }}
        </span>
      </div>
    </div>

    <!-- Pre-existing Conditions -->
    <div class="content-card">
      <div class="section-title">
        <v-icon name="hi-clipboard-list" scale="0.85" />
        <h3>Pre-existing Conditions</h3>
      </div>
      <div v-if="medicalHistory.conditions?.length" class="tags-list">
        <span
          v-for="condition in medicalHistory.conditions"
          :key="condition"
          class="tag"
        >
          {{ condition }}
        </span>
      </div>
      <div v-else class="empty-state-inline">
        <v-icon name="hi-check-circle" scale="0.8" />
        <p>No pre-existing conditions recorded</p>
      </div>
    </div>

    <!-- Allergies (if none, show reassuring message) -->
    <div v-if="!medicalHistory.allergies?.length" class="content-card">
      <div class="section-title">
        <v-icon name="hi-shield-check" scale="0.85" />
        <h3>Allergies</h3>
      </div>
      <div class="empty-state-inline empty-state-inline--safe">
        <v-icon name="hi-check-circle" scale="0.8" />
        <p>No known allergies</p>
      </div>
    </div>

    <!-- Health Risk Factors -->
    <div class="content-card">
      <div class="section-title">
        <v-icon name="hi-exclamation-circle" scale="0.85" />
        <h3>Health Risk Factors</h3>
      </div>
      <div v-if="hasRiskFactors" class="risk-factors">
        <div
          v-for="(value, key) in medicalHistory.risk_factors"
          :key="key"
          class="risk-item"
        >
          <span class="risk-label">{{ formatRiskLabel(key) }}</span>
          <span class="risk-value">{{ value || 'Not specified' }}</span>
        </div>
      </div>
      <div v-else class="empty-state-inline">
        <v-icon name="hi-check-circle" scale="0.8" />
        <p>No risk factors recorded</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  medicalHistory: { type: Object, default: () => ({}) },
});

const hasRiskFactors = computed(() => {
  return Object.keys(props.medicalHistory.risk_factors || {}).length > 0;
});

function formatRiskLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
</script>

<style scoped lang="scss">
.section-title {
  display: flex;
  align-items: center;
  gap: $size-8;
  margin-bottom: $size-14;

  svg {
    color: #0EAEC4;
  }

  h3 {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

.allergy-warning {
  background: rgba(#ef4444, 0.04);
  border-left: 4px solid #ef4444;
  border-radius: $size-16;
  padding: $size-20;
  margin-bottom: $size-16;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  &__header {
    display: flex;
    align-items: center;
    gap: $size-10;
    margin-bottom: $size-14;
  }

  &__icon {
    width: 36px;
    height: 36px;
    border-radius: $size-10;
    background: rgba(#ef4444, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #dc2626;
  }

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: #dc2626;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: $size-8;
  }
}

.allergy-tag {
  display: flex;
  align-items: center;
  gap: $size-4;
  padding: $size-6 $size-14;
  border-radius: $size-20;
  font-size: $size-13;
  font-weight: $fw-medium;
  background: rgba(#ef4444, 0.08);
  color: #dc2626;
}

.content-card {
  background: $color-white;
  padding: $size-20;
  border-radius: $size-16;
  margin-bottom: $size-16;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: $size-8;
}

.tag {
  padding: $size-6 $size-14;
  border-radius: $size-20;
  font-size: $size-13;
  font-weight: $fw-medium;
  background: rgba(#0EAEC4, 0.06);
  color: #0891b2;
}

.risk-factors {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-12;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.risk-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $size-12 $size-14;
  background: $color-g-97;
  border-radius: $size-10;
  border-left: 3px solid rgba(#0EAEC4, 0.4);

  .risk-label {
    font-size: $size-13;
    color: $color-g-54;
  }

  .risk-value {
    font-size: $size-13;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

.empty-state-inline {
  display: flex;
  align-items: center;
  gap: $size-8;
  padding: $size-12 $size-14;
  background: $color-g-97;
  border-radius: $size-10;

  svg {
    color: $color-g-67;
  }

  p {
    font-size: $size-14;
    color: $color-g-54;
  }

  &--safe {
    background: rgba(#10b981, 0.04);

    svg {
      color: #10b981;
    }

    p {
      color: #059669;
    }
  }
}
</style>
