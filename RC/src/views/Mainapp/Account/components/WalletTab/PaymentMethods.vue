<template>
  <div class="payment-methods-section">
    <div class="section-header">
      <h3 class="section-title">Payment Methods</h3>
      <button class="add-btn" @click="$emit('addCard')">
        <v-icon name="hi-plus" scale="0.9" />
        Add Card
      </button>
    </div>

    <div v-if="cards.length === 0" class="empty-state">
      <div class="empty-icon">
        <v-icon name="bi-credit-card-2-back" scale="2" />
      </div>
      <p class="empty-text">No payment methods added</p>
      <p class="empty-hint">Add a card for quick payments</p>
    </div>

    <div v-else class="cards-list">
      <div
        v-for="(card, index) in cards"
        :key="card._id || index"
        class="card-item"
        :class="{ default: card.is_default }"
      >
        <div class="card-brand">
          <div class="brand-icon" :class="getBrandClass(card.card_type || card.brand)">
            {{ getBrandIcon(card.card_type || card.brand) }}
          </div>
        </div>
        <div class="card-info">
          <span class="card-number">•••• {{ card.last4 || card.last_four }}</span>
          <span class="card-expiry">Exp {{ card.exp_month }}/{{ card.exp_year }}</span>
        </div>
        <div class="card-actions">
          <span v-if="card.is_default" class="default-badge">Default</span>
          <button
            v-if="!card.is_default"
            class="action-btn set-default"
            @click="$emit('setDefault', card)"
            title="Set as default"
          >
            <v-icon name="hi-check" scale="0.9" />
          </button>
          <button
            class="action-btn remove"
            @click="$emit('removeCard', card)"
            title="Remove card"
          >
            <v-icon name="hi-x" scale="0.9" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "PaymentMethods",
  props: {
    cards: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["addCard", "setDefault", "removeCard"],
  methods: {
    getBrandClass(brand) {
      if (!brand) return "generic";
      const b = brand.toLowerCase();
      if (b.includes("visa")) return "visa";
      if (b.includes("master")) return "mastercard";
      if (b.includes("verve")) return "verve";
      return "generic";
    },
    getBrandIcon(brand) {
      if (!brand) return "Card";
      const b = brand.toLowerCase();
      if (b.includes("visa")) return "VISA";
      if (b.includes("master")) return "MC";
      if (b.includes("verve")) return "VV";
      return "Card";
    },
  },
};
</script>

<style scoped lang="scss">
.payment-methods-section {
  background: white;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  padding: 24px;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 12px;
  }

  &:hover {
    border-color: transparent;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    gap: 12px;
    width: 100%;

    @media (max-width: 480px) {
      margin-bottom: 12px;
      gap: 8px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 0;

      @media (max-width: 480px) {
        font-size: 15px;
      }
    }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: transparent;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;

      @media (max-width: 480px) {
        padding: 5px 8px;
        font-size: 11px;
        gap: 4px;
      }

      &:hover {
        border-color: #0EAEC4;
        color: #0EAEC4;
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 32px 16px;

    .empty-icon {
      color: #d1d5db;
      margin-bottom: 12px;
    }

    .empty-text {
      font-size: 15px;
      font-weight: 600;
      color: #6b7280;
      margin: 0 0 4px 0;
    }

    .empty-hint {
      font-size: 13px;
      color: #9ca3af;
      margin: 0;
    }
  }

  .cards-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 100%;
    overflow: hidden;

    @media (max-width: 480px) {
      gap: 8px;
    }

    .card-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      border: 2px solid transparent;
      transition: all 0.2s ease;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      overflow: hidden;

      @media (max-width: 480px) {
        gap: 8px;
        padding: 10px;
      }

      &:hover {
        background: #f3f4f6;
      }

      &.default {
        background: rgba(14, 174, 196, 0.05);
        border-color: rgba(14, 174, 196, 0.2);
      }

      .card-brand {
        flex-shrink: 0;

        .brand-icon {
          width: 48px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.5px;

          @media (max-width: 480px) {
            width: 36px;
            height: 24px;
            font-size: 8px;
            letter-spacing: 0;
            border-radius: 4px;
          }

          &.visa {
            background: linear-gradient(135deg, #1a1f71 0%, #2d3b8e 100%);
            color: white;
          }

          &.mastercard {
            background: linear-gradient(135deg, #eb001b 0%, #f79e1b 100%);
            color: white;
          }

          &.verve {
            background: linear-gradient(135deg, #00425f 0%, #006400 100%);
            color: white;
          }

          &.generic {
            background: #6b7280;
            color: white;
          }
        }
      }

      .card-info {
        flex: 1;
        min-width: 0;
        max-width: 100%;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow: hidden;

        .card-number {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          font-family: monospace;
          letter-spacing: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;

          @media (max-width: 480px) {
            font-size: 13px;
            letter-spacing: 0;
            font-family: inherit;
          }
        }

        .card-expiry {
          font-size: 12px;
          color: #6b7280;

          @media (max-width: 480px) {
            font-size: 11px;
          }
        }
      }

      .card-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        margin-left: auto;

        @media (max-width: 480px) {
          gap: 2px;
        }

        .default-badge {
          padding: 4px 10px;
          background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;

          @media (max-width: 480px) {
            padding: 2px 6px;
            font-size: 9px;
            border-radius: 8px;
          }
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;

          @media (max-width: 480px) {
            width: 26px;
            height: 26px;
            border-radius: 6px;
          }

          &.set-default {
            background: rgba(16, 185, 129, 0.1);
            color: #10b981;

            &:hover {
              background: rgba(16, 185, 129, 0.2);
            }
          }

          &.remove {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;

            &:hover {
              background: rgba(239, 68, 68, 0.2);
            }
          }
        }
      }
    }
  }
}
</style>
