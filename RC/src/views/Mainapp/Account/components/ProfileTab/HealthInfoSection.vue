<template>
  <div class="health-section">
    <div class="section-header">
      <h3 class="section-title">Health Information</h3>
    </div>

    <div class="health-metrics">
      <div class="metric-card">
        <div class="metric-icon height-icon">
          <v-icon name="hi-arrow-up" scale="1.2" />
        </div>
        <div class="metric-info">
          <span class="metric-value">{{ formattedHeight }}</span>
          <span class="metric-label">Height</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon weight-icon">
          <v-icon name="fa-weight" scale="1" />
        </div>
        <div class="metric-info">
          <span class="metric-value">{{ formattedWeight }}</span>
          <span class="metric-label">Weight</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon bmi-icon">
          <v-icon name="hi-chart-bar" scale="1" />
        </div>
        <div class="metric-info">
          <span class="metric-value" :class="bmiClass">{{ bmiValue }}</span>
          <span class="metric-label">BMI {{ bmiStatus }}</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon smoker-icon" :class="{ active: isSmoker }">
          <v-icon name="hi-exclamation-circle" scale="1" v-if="isSmoker" />
          <v-icon name="hi-check-circle" scale="1" v-else />
        </div>
        <div class="metric-info">
          <span class="metric-value">{{ smokerStatus }}</span>
          <span class="metric-label">Smoking Status</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "HealthInfoSection",
  props: {
    profile: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    healthInfo() {
      return this.profile?.basic_health_info || {};
    },
    formattedHeight() {
      const height = this.healthInfo?.height;
      if (!height?.value) return "--";
      return `${height.value} ${height.unit || "cm"}`;
    },
    formattedWeight() {
      const weight = this.healthInfo?.weight;
      if (!weight?.value) return "--";
      return `${weight.value} ${weight.unit || "kg"}`;
    },
    bmiValue() {
      const height = this.healthInfo?.height;
      const weight = this.healthInfo?.weight;

      if (!height?.value || !weight?.value) return "--";

      let heightInM = parseFloat(height.value);
      let weightInKg = parseFloat(weight.value);

      // Convert height to meters
      if (height.unit === "cm") {
        heightInM = heightInM / 100;
      }

      // Convert weight to kg if needed
      if (weight.unit === "lb") {
        weightInKg = weightInKg * 0.453592;
      }

      if (heightInM <= 0) return "--";

      const bmi = weightInKg / (heightInM * heightInM);
      return bmi.toFixed(1);
    },
    bmiStatus() {
      const bmi = parseFloat(this.bmiValue);
      if (isNaN(bmi)) return "";
      if (bmi < 18.5) return "(Underweight)";
      if (bmi < 25) return "(Normal)";
      if (bmi < 30) return "(Overweight)";
      return "(Obese)";
    },
    bmiClass() {
      const bmi = parseFloat(this.bmiValue);
      if (isNaN(bmi)) return "";
      if (bmi < 18.5) return "underweight";
      if (bmi < 25) return "normal";
      if (bmi < 30) return "overweight";
      return "obese";
    },
    isSmoker() {
      const smoker = this.profile?.health_risk_factors?.is_smoker;
      return smoker === "Yes" || smoker === true;
    },
    smokerStatus() {
      const smoker = this.profile?.health_risk_factors?.is_smoker;
      if (smoker === "Yes" || smoker === true) return "Smoker";
      if (smoker === "No" || smoker === false) return "Non-smoker";
      return "Not specified";
    },
  },
};
</script>

<style scoped lang="scss">
.health-section {
  background: white;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  padding: 24px;
  transition: all 0.3s ease;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 12px;
  }

  &:hover {
    border-color: transparent;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .section-header {
    margin-bottom: 20px;

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
  }

  .health-metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    overflow: hidden;

    @media (max-width: 480px) {
      gap: 10px;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      transition: all 0.2s ease;
      min-width: 0;
      overflow: hidden;

      @media (max-width: 480px) {
        padding: 12px;
        gap: 10px;
        flex-direction: column;
        text-align: center;
      }

      &:hover {
        background: #f3f4f6;
      }

      .metric-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        @media (max-width: 480px) {
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }

        &.height-icon {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }

        &.weight-icon {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        &.bmi-icon {
          background: rgba(14, 174, 196, 0.1);
          color: #0EAEC4;
        }

        &.smoker-icon {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;

          &.active {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
          }
        }
      }

      .metric-info {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .metric-value {
          font-size: 18px;
          font-weight: 700;
          color: #111827;

          &.normal { color: #10b981; }
          &.underweight { color: #f59e0b; }
          &.overweight { color: #f97316; }
          &.obese { color: #ef4444; }
        }

        .metric-label {
          font-size: 12px;
          color: #6b7280;
        }
      }
    }
  }
}
</style>
