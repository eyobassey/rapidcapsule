<template>
  <div class="health-credits-card">
    <div class="card-header">
      <div class="header-left">
        <div class="credits-icon">
          <v-icon name="hi-sparkles" scale="1.1" />
        </div>
        <div class="header-text">
          <h3 class="card-title">AI Health Summary Credits</h3>
          <p class="card-subtitle">Generate detailed health reports with AI</p>
        </div>
      </div>
      <button
        v-if="canShare"
        class="share-btn"
        @click="$emit('shareCredits')"
      >
        <v-icon name="hi-share" scale="0.85" />
        Share
      </button>
    </div>

    <div class="credits-display">
      <div class="credits-main">
        <span class="credits-number">{{ totalCredits }}</span>
        <span class="credits-label">credits remaining</span>
      </div>

      <div class="credits-progress">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progressWidth + '%' }"
          ></div>
        </div>
      </div>

      <div class="credits-breakdown">
        <div class="breakdown-item">
          <span class="item-value free">{{ credits?.free_remaining || 0 }}/{{ credits?.free_total || 5 }}</span>
          <span class="item-label">Free</span>
        </div>
        <div class="breakdown-divider"></div>
        <div class="breakdown-item">
          <span class="item-value purchased">{{ credits?.purchased || 0 }}</span>
          <span class="item-label">Purchased</span>
        </div>
        <div class="breakdown-divider"></div>
        <div class="breakdown-item">
          <span class="item-value gifted">{{ credits?.gifted || 0 }}</span>
          <span class="item-label">Gifted</span>
        </div>
      </div>
    </div>

    <div v-if="hasUnlimited" class="unlimited-badge">
      <v-icon name="hi-check-circle" scale="0.9" />
      <span>Unlimited Monthly</span>
      <span class="expires">expires {{ formatDate(credits?.unlimited_expires) }}</span>
    </div>

    <button class="buy-btn" @click="$emit('buyCredits')">
      <v-icon name="hi-plus" scale="0.9" />
      Buy More Credits
    </button>
  </div>
</template>

<script>
export default {
  name: "HealthCreditsCard",
  props: {
    credits: {
      type: Object,
      default: () => ({
        free_remaining: 0,
        free_total: 5,
        purchased: 0,
        gifted: 0,
        unlimited: false,
        unlimited_expires: null,
      }),
    },
    canShare: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["buyCredits", "shareCredits"],
  computed: {
    totalCredits() {
      if (!this.credits) return 0;
      return (this.credits.free_remaining || 0) +
             (this.credits.purchased || 0) +
             (this.credits.gifted || 0);
    },
    hasUnlimited() {
      return this.credits?.unlimited && this.credits?.unlimited_expires;
    },
    progressWidth() {
      const total = (this.credits?.free_total || 5) +
                   (this.credits?.purchased || 0) +
                   (this.credits?.gifted || 0);
      if (total === 0) return 0;
      return Math.min((this.totalCredits / Math.max(total, 10)) * 100, 100);
    },
  },
  methods: {
    formatDate(date) {
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    },
  },
};
</script>

<style scoped lang="scss">
.health-credits-card {
  background: white;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  padding: 24px;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 12px;
  }

  &:hover {
    border-color: transparent;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
    gap: 12px;

    @media (max-width: 480px) {
      margin-bottom: 16px;
    }

    .header-left {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      flex: 1;

      @media (max-width: 480px) {
        gap: 10px;
      }

      .credits-icon {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 179, 8, 0.1) 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #f59e0b;
        flex-shrink: 0;

        @media (max-width: 480px) {
          width: 36px;
          height: 36px;
          border-radius: 10px;
        }
      }

      .header-text {
        .card-title {
          font-size: 17px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;

          @media (max-width: 480px) {
            font-size: 15px;
          }
        }

        .card-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;

          @media (max-width: 480px) {
            font-size: 12px;
          }
        }
      }
    }

    .share-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: rgba(14, 174, 196, 0.1);
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #0891b2;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;

      @media (max-width: 480px) {
        padding: 6px 10px;
        font-size: 12px;
      }

      &:hover {
        background: rgba(14, 174, 196, 0.2);
      }
    }
  }

  .credits-display {
    margin-bottom: 20px;

    @media (max-width: 480px) {
      margin-bottom: 16px;
    }

    .credits-main {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 12px;

      .credits-number {
        font-size: 36px;
        font-weight: 700;
        color: #111827;

        @media (max-width: 480px) {
          font-size: 28px;
        }
      }

      .credits-label {
        font-size: 14px;
        color: #6b7280;

        @media (max-width: 480px) {
          font-size: 13px;
        }
      }
    }

    .credits-progress {
      margin-bottom: 16px;

      @media (max-width: 480px) {
        margin-bottom: 12px;
      }

      .progress-bar {
        height: 8px;
        background: #f3f4f6;
        border-radius: 4px;
        overflow: hidden;

        @media (max-width: 480px) {
          height: 6px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #0EAEC4 0%, #0891b2 100%);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
      }
    }

    .credits-breakdown {
      display: flex;
      align-items: center;
      gap: 16px;

      @media (max-width: 480px) {
        gap: 12px;
        flex-wrap: wrap;
      }

      .breakdown-item {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .item-value {
          font-size: 16px;
          font-weight: 700;

          @media (max-width: 480px) {
            font-size: 14px;
          }

          &.free { color: #10b981; }
          &.purchased { color: #0EAEC4; }
          &.gifted { color: #8b5cf6; }
        }

        .item-label {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;

          @media (max-width: 480px) {
            font-size: 10px;
          }
        }
      }

      .breakdown-divider {
        width: 1px;
        height: 32px;
        background: #e5e7eb;

        @media (max-width: 480px) {
          height: 24px;
        }
      }
    }
  }

  .unlimited-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
    border-radius: 10px;
    margin-bottom: 16px;
    color: #10b981;
    font-size: 14px;
    font-weight: 600;

    .expires {
      margin-left: auto;
      font-size: 12px;
      font-weight: 500;
      opacity: 0.8;
    }
  }

  .buy-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 20px;
    background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
    }
  }
}
</style>
