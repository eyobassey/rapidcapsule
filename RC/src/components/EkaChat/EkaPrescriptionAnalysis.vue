<template>
  <div class="rx-analysis">
    <!-- Header -->
    <div class="rx-analysis__header">
      <v-icon name="hi-clipboard-list" scale="1.1" />
      <h2>Prescription Analysis</h2>
      <span v-if="data.prescription_number" class="rx-analysis__badge">{{ data.prescription_number }}</span>
    </div>

    <!-- Prescription Info -->
    <div class="rx-analysis__info">
      <div v-if="data.doctor_name" class="rx-analysis__info-row">
        <v-icon name="hi-user" scale="0.75" />
        <span>{{ data.doctor_name }}</span>
      </div>
      <div v-if="data.prescription_date" class="rx-analysis__info-row">
        <v-icon name="hi-calendar" scale="0.75" />
        <span>{{ formatDate(data.prescription_date) }}</span>
      </div>
      <div v-if="data.confidence" class="rx-analysis__info-row">
        <v-icon name="hi-eye" scale="0.75" />
        <span>{{ Math.round(data.confidence) }}% readable</span>
      </div>
      <div v-if="data.source" class="rx-analysis__info-row">
        <v-icon name="hi-document" scale="0.75" />
        <span>{{ data.source === 'specialist' ? 'Specialist Prescription' : 'Uploaded Prescription' }}</span>
      </div>
    </div>

    <!-- No Medications -->
    <div v-if="!data.medications || data.medications.length === 0" class="rx-analysis__empty">
      <v-icon name="hi-exclamation" scale="1.5" />
      <h3>No Medications Found</h3>
      <p>Could not extract medications from this prescription. Please ensure the image is clear and try again.</p>
    </div>

    <!-- Medications Table -->
    <div v-if="data.medications && data.medications.length > 0" class="rx-analysis__meds">
      <h3 class="rx-analysis__section-title">Medications ({{ data.medications.length }})</h3>
      <div
        v-for="(med, idx) in data.medications"
        :key="idx"
        class="rx-analysis__med-card"
      >
        <div class="rx-analysis__med-header">
          <div class="rx-analysis__med-name">
            <span class="rx-analysis__med-label">{{ med.name }}</span>
            <span v-if="med.prescribed_dosage" class="rx-analysis__med-dosage">{{ med.prescribed_dosage }}</span>
          </div>
          <span
            class="rx-analysis__med-status"
            :class="statusClass(med)"
          >{{ statusText(med) }}</span>
        </div>
        <div v-if="med.in_inventory" class="rx-analysis__med-details">
          <div class="rx-analysis__med-match">
            <v-icon name="hi-check-circle" scale="0.7" class="text-green" />
            <span>{{ med.matched_drug_name || med.name }}</span>
            <span v-if="med.dosage_form" class="rx-analysis__med-form">{{ med.dosage_form }}</span>
          </div>
          <div v-if="med.prices" class="rx-analysis__med-prices">
            <span v-if="med.prices.NGN" class="rx-analysis__price">NGN {{ formatPrice(med.prices.NGN) }}</span>
            <span v-if="med.prices.USD" class="rx-analysis__price">USD {{ formatPrice(med.prices.USD) }}</span>
            <span v-if="med.prices.GBP" class="rx-analysis__price">GBP {{ formatPrice(med.prices.GBP) }}</span>
            <span v-if="med.prices.EUR" class="rx-analysis__price">EUR {{ formatPrice(med.prices.EUR) }}</span>
          </div>
          <div v-if="med.instructions" class="rx-analysis__med-instructions">
            <v-icon name="hi-information-circle" scale="0.65" />
            {{ med.instructions }}
          </div>
        </div>
        <div v-else class="rx-analysis__med-notfound">
          <v-icon name="hi-x-circle" scale="0.7" />
          <span>Not available in our pharmacy</span>
        </div>
      </div>
    </div>

    <!-- Cost Summary -->
    <div v-if="data.total_estimated_cost && hasAnyCost" class="rx-analysis__cost">
      <h3 class="rx-analysis__section-title">Estimated Total Cost</h3>
      <div class="rx-analysis__cost-grid">
        <div v-if="data.total_estimated_cost.NGN" class="rx-analysis__cost-row rx-analysis__cost-row--primary">
          <span class="rx-analysis__cost-currency">NGN</span>
          <span class="rx-analysis__cost-amount">{{ formatPrice(data.total_estimated_cost.NGN) }}</span>
        </div>
        <div v-if="data.total_estimated_cost.USD" class="rx-analysis__cost-row">
          <span class="rx-analysis__cost-currency">USD</span>
          <span class="rx-analysis__cost-amount">{{ formatPrice(data.total_estimated_cost.USD) }}</span>
        </div>
        <div v-if="data.total_estimated_cost.GBP" class="rx-analysis__cost-row">
          <span class="rx-analysis__cost-currency">GBP</span>
          <span class="rx-analysis__cost-amount">{{ formatPrice(data.total_estimated_cost.GBP) }}</span>
        </div>
        <div v-if="data.total_estimated_cost.EUR" class="rx-analysis__cost-row">
          <span class="rx-analysis__cost-currency">EUR</span>
          <span class="rx-analysis__cost-amount">{{ formatPrice(data.total_estimated_cost.EUR) }}</span>
        </div>
      </div>
      <p v-if="unavailableCount > 0" class="rx-analysis__cost-note">
        * {{ unavailableCount }} medication(s) not available — excluded from total
      </p>
    </div>

    <!-- Prescription Readiness -->
    <div v-if="data.prescription_readiness" class="rx-analysis__readiness">
      <div class="rx-analysis__readiness-header">
        <h3 class="rx-analysis__section-title">Order Readiness</h3>
        <span
          class="rx-analysis__readiness-score"
          :class="readinessScoreClass"
        >{{ data.prescription_readiness.score }}%</span>
      </div>
      <div v-if="data.prescription_readiness.ready_for_order" class="rx-analysis__readiness-banner rx-analysis__readiness-banner--ready">
        <v-icon name="hi-check-circle" scale="0.85" />
        <span>Ready to order!</span>
      </div>
      <div class="rx-analysis__readiness-checks">
        <div
          v-for="(issue, idx) in data.prescription_readiness.issues"
          :key="idx"
          class="rx-analysis__check"
        >
          <v-icon
            :name="checkIcon(issue.status)"
            scale="0.75"
            :class="'rx-check--' + issue.status"
          />
          <div class="rx-analysis__check-text">
            <span class="rx-analysis__check-name">{{ issue.check }}</span>
            <span class="rx-analysis__check-msg">{{ issue.message }}</span>
          </div>
        </div>
      </div>
      <p v-if="data.prescription_readiness.summary" class="rx-analysis__readiness-summary">
        {{ data.prescription_readiness.summary }}
      </p>
    </div>

    <!-- Actions -->
    <div class="rx-analysis__actions">
      <button class="rx-analysis__action-btn rx-analysis__action-btn--primary" @click="uploadForOrder">
        <v-icon name="hi-upload" scale="0.8" />
        Upload for Order
      </button>
    </div>

    <!-- Disclaimer -->
    <div class="rx-analysis__disclaimer">
      <v-icon name="hi-information-circle" scale="0.7" />
      <span>Prices are estimates and may vary. Final cost is calculated at checkout. This analysis does not constitute a medical recommendation.</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EkaPrescriptionAnalysis',
  props: {
    data: { type: Object, required: true },
  },
  computed: {
    hasAnyCost() {
      const c = this.data.total_estimated_cost
      return c && (c.NGN || c.USD || c.GBP || c.EUR)
    },
    unavailableCount() {
      return (this.data.medications || []).filter((m) => !m.in_inventory).length
    },
    readinessScoreClass() {
      const s = this.data.prescription_readiness?.score || 0
      if (s >= 90) return 'rx-score--green'
      if (s >= 60) return 'rx-score--yellow'
      return 'rx-score--red'
    },
  },
  methods: {
    formatDate(d) {
      if (!d) return ''
      return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    },
    formatPrice(v) {
      if (!v && v !== 0) return ''
      return Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },
    statusClass(med) {
      if (!med.in_inventory) return 'rx-status--unavailable'
      if (med.schedule_class && !['OTC', 'OTC_GENERAL'].includes(med.schedule_class)) return 'rx-status--controlled'
      if (med.requires_prescription) return 'rx-status--rx'
      if (med.in_stock) return 'rx-status--instock'
      return 'rx-status--outofstock'
    },
    statusText(med) {
      if (!med.in_inventory) return 'Not Available'
      if (med.schedule_class && !['OTC', 'OTC_GENERAL'].includes(med.schedule_class)) return 'Controlled'
      if (!med.in_stock) return 'Out of Stock'
      if (med.requires_prescription) return 'Rx Required'
      return 'In Stock'
    },
    checkIcon(status) {
      if (status === 'passed') return 'hi-check-circle'
      if (status === 'warning') return 'hi-exclamation'
      return 'hi-x-circle'
    },
    uploadForOrder() {
      this.$router.push('/app/patient/pharmacy/upload-prescription')
    },
  },
}
</script>

<style scoped lang="scss">
.rx-analysis {
  padding: 20px;
  font-size: 14px;
  color: #f8fafc;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;

    .ov-icon { color: #0ea5e9; fill: #0ea5e9; }

    h2 {
      font-size: 18px;
      font-weight: 700;
      margin: 0;
      flex: 1;
    }
  }

  &__badge {
    background: rgba(255, 255, 255, 0.05);
    color: #94a3b8;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 10px;
  }

  &__info {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__info-row {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #f8fafc;

    .ov-icon { color: #94a3b8; fill: #94a3b8; }
  }

  &__empty {
    text-align: center;
    padding: 24px 16px;
    color: #64748b;

    .ov-icon { color: #64748b; fill: #64748b; }
    h3 { font-size: 15px; margin: 8px 0 4px; color: #94a3b8; }
    p { font-size: 13px; }
  }

  &__section-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 10px;
    color: #f8fafc;
  }

  &__meds {
    margin-bottom: 16px;
  }

  &__med-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 8px;
  }

  &__med-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
  }

  &__med-name {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__med-label {
    font-weight: 600;
    font-size: 14px;
  }

  &__med-dosage {
    font-size: 12px;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.05);
    padding: 1px 6px;
    border-radius: 4px;
  }

  &__med-status {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 8px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__med-details {
    margin-top: 4px;
  }

  &__med-match {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #f8fafc;
    margin-bottom: 4px;

    .ov-icon { color: #16a34a; fill: #16a34a; }
  }

  &__med-form {
    font-size: 11px;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.05);
    padding: 1px 5px;
    border-radius: 3px;
  }

  &__med-prices {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 6px 0;
  }

  &__price {
    font-size: 12px;
    color: #6ee7b7;
    font-weight: 500;
    background: rgba(16, 185, 129, 0.1);
    padding: 2px 6px;
    border-radius: 4px;
  }

  &__med-instructions {
    font-size: 12px;
    color: #94a3b8;
    display: flex;
    align-items: flex-start;
    gap: 4px;
    margin-top: 4px;

    .ov-icon { color: #94a3b8; fill: #94a3b8; }
  }

  &__med-notfound {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #64748b;
    margin-top: 4px;

    .ov-icon { color: #64748b; fill: #64748b; }
  }

  &__cost {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(187, 247, 208, 0.3);
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 16px;
  }

  &__cost-grid {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__cost-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
    font-size: 13px;

    &--primary {
      font-weight: 700;
      font-size: 15px;
      border-bottom: 1px solid rgba(187, 247, 208, 0.3);
      padding-bottom: 8px;
      margin-bottom: 2px;
    }
  }

  &__cost-currency {
    color: #94a3b8;
    font-weight: 500;
  }

  &__cost-amount {
    color: #6ee7b7;
  }

  &__cost-note {
    font-size: 11px;
    color: #64748b;
    margin: 8px 0 0;
  }

  &__readiness {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 16px;
  }

  &__readiness-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  &__readiness-score {
    font-size: 13px;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 10px;
  }

  &__readiness-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 10px;

    &--ready {
      background: rgba(16, 185, 129, 0.1);
      color: #6ee7b7;

      .ov-icon { color: #6ee7b7; fill: #6ee7b7; }
    }
  }

  &__readiness-checks {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__check {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  &__check-text {
    display: flex;
    flex-direction: column;
  }

  &__check-name {
    font-size: 13px;
    font-weight: 600;
    color: #f8fafc;
  }

  &__check-msg {
    font-size: 12px;
    color: #94a3b8;
  }

  &__readiness-summary {
    font-size: 12px;
    color: #94a3b8;
    margin: 10px 0 0;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__actions {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  &__action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;

    &--primary {
      background: #FF5C00;
      color: white;

      .ov-icon { color: white; fill: white; }

      &:hover { background: #E04F00; }
    }
  }

  &__disclaimer {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 11px;
    color: #64748b;
    line-height: 1.4;

    .ov-icon { color: #64748b; fill: #64748b; flex-shrink: 0; }
  }
}

// Status badge colors
.rx-status {
  &--instock { background: rgba(16, 185, 129, 0.1); color: #6ee7b7; }
  &--rx { background: rgba(245, 158, 11, 0.1); color: #fbbf24; }
  &--controlled { background: rgba(251, 146, 60, 0.15); color: #fb923c; }
  &--unavailable { background: rgba(239, 68, 68, 0.1); color: #fca5a5; }
  &--outofstock { background: rgba(255, 255, 255, 0.05); color: #94a3b8; }
}

// Readiness score colors
.rx-score {
  &--green { background: rgba(16, 185, 129, 0.1); color: #6ee7b7; }
  &--yellow { background: rgba(245, 158, 11, 0.1); color: #fbbf24; }
  &--red { background: rgba(239, 68, 68, 0.1); color: #fca5a5; }
}

// Check icons
.rx-check {
  &--passed { color: #16a34a; &.ov-icon { color: #16a34a; fill: #16a34a; } }
  &--warning { color: #d97706; &.ov-icon { color: #d97706; fill: #d97706; } }
  &--failed { color: #dc2626; &.ov-icon { color: #dc2626; fill: #dc2626; } }
}

.text-green { color: #16a34a; &.ov-icon { color: #16a34a; fill: #16a34a; } }
</style>
