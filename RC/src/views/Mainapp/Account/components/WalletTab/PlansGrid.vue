<template>
  <div class="plans-section">
    <div class="section-header">
      <h3 class="section-title">Health Summary Plans</h3>
      <p class="section-subtitle">Choose a plan to get AI-powered health summaries</p>
    </div>

    <div v-if="loading" class="loading-state">
      <Loader :useOverlay="false" />
    </div>

    <div v-else-if="plans.length === 0" class="empty-state">
      <p>No plans available at the moment</p>
    </div>

    <div v-else class="plans-grid">
      <div
        v-for="plan in sortedPlans"
        :key="plan._id"
        class="plan-card"
        :class="{
          featured: plan.is_popular || plan.featured,
          subscription: plan.type === 'subscription'
        }"
      >
        <div v-if="plan.is_popular || plan.featured" class="popular-badge">
          <v-icon name="bi-star-fill" scale="0.7" />
          Popular
        </div>

        <div class="plan-header">
          <h4 class="plan-name">{{ plan.name }}</h4>
          <p class="plan-credits">
            <template v-if="plan.type === 'subscription'">
              Unlimited
            </template>
            <template v-else>
              {{ plan.credits }} Credits
            </template>
          </p>
        </div>

        <div class="plan-price">
          <span class="currency">&#8358;</span>
          <span class="amount">{{ formatPrice(plan.price) }}</span>
          <span v-if="plan.type === 'subscription'" class="period">/month</span>
        </div>

        <div v-if="plan.discount" class="discount-badge">
          Save {{ plan.discount }}%
        </div>

        <ul class="plan-features">
          <li v-for="(feature, idx) in getFeatures(plan)" :key="idx">
            <v-icon name="hi-check" scale="0.8" />
            {{ feature }}
          </li>
        </ul>

        <button
          class="plan-btn"
          :class="{ 'subscription-btn': plan.type === 'subscription' }"
          @click="$emit('selectPlan', plan)"
          :disabled="purchasing"
        >
          {{ plan.type === 'subscription' ? 'Subscribe' : 'Purchase' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import Loader from "@/components/Loader/main-loader.vue";

export default {
  name: "PlansGrid",
  components: {
    Loader,
  },
  props: {
    plans: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    purchasing: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["selectPlan"],
  computed: {
    sortedPlans() {
      return [...this.plans].sort((a, b) => {
        // Sort by type first (bundle before subscription)
        if (a.type !== b.type) {
          return a.type === "bundle" ? -1 : 1;
        }
        // Then by price
        return (a.price || 0) - (b.price || 0);
      });
    },
  },
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat("en-NG").format(price || 0);
    },
    getFeatures(plan) {
      if (plan.features && plan.features.length) {
        return plan.features;
      }
      // Default features based on plan type
      if (plan.type === "subscription") {
        return [
          "Unlimited AI summaries",
          "Priority processing",
          "Cancel anytime",
        ];
      }
      return [
        `${plan.credits} AI health summaries`,
        "Never expires",
        "Use anytime",
      ];
    },
  },
};
</script>

<style scoped lang="scss">
.plans-section {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

  .section-header {
    margin-bottom: 24px;

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .section-subtitle {
      font-size: 14px;
      color: #6b7280;
      margin: 0;
    }
  }

  .loading-state {
    display: flex;
    justify-content: center;
    padding: 40px;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: #6b7280;
  }

  .plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
    gap: 20px;
    width: 100%;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .plan-card {
      position: relative;
      background: white;
      border-radius: 16px;
      border: 2px solid #e5e7eb;
      padding: 24px;
      transition: all 0.3s ease;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;

      @media (max-width: 480px) {
        padding: 20px 16px;
        border-radius: 12px;
      }

      &:hover {
        border-color: transparent;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      &.featured {
        border-color: #0EAEC4;
        box-shadow: 0 4px 16px rgba(14, 174, 196, 0.15);

        &:hover {
          border-color: #0EAEC4;
          box-shadow: 0 8px 24px rgba(14, 174, 196, 0.25);
        }
      }

      &.subscription {
        background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
        border-color: #fbbf24;

        &:hover {
          border-color: #f59e0b;
        }
      }

      .popular-badge {
        position: absolute;
        top: -10px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 12px;
        background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
        color: white;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 700;
      }

      .plan-header {
        margin-bottom: 16px;

        .plan-name {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .plan-credits {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }
      }

      .plan-price {
        margin-bottom: 12px;

        .currency {
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }

        .amount {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
        }

        .period {
          font-size: 14px;
          color: #6b7280;
        }
      }

      .discount-badge {
        display: inline-block;
        padding: 4px 10px;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 16px;
      }

      .plan-features {
        list-style: none;
        padding: 0;
        margin: 0 0 20px 0;

        li {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0;
          font-size: 13px;
          color: #4b5563;
          border-bottom: 1px solid #f3f4f6;

          &:last-child {
            border-bottom: none;
          }

          svg {
            color: #10b981;
            flex-shrink: 0;
          }
        }
      }

      .plan-btn {
        width: 100%;
        padding: 14px 20px;
        background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
        border: none;
        border-radius: 10px;
        font-size: 15px;
        font-weight: 600;
        color: white;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(14, 174, 196, 0.3);
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        &.subscription-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);

          &:hover:not(:disabled) {
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
          }
        }
      }
    }
  }
}
</style>
