<template>
  <div class="wallet-balance-card">
    <div class="balance-card-inner">
      <div class="card-header">
        <span class="balance-label">Available Balance</span>
        <div class="wallet-icon">
          <v-icon name="bi-wallet2" scale="1.4" />
        </div>
      </div>

      <div class="balance-amount">
        <span class="currency">&#8358;</span>
        <span class="amount">{{ formattedBalance }}</span>
      </div>

      <div class="card-actions">
        <button class="action-btn primary" @click="$emit('topUp')">
          <v-icon name="hi-plus" scale="0.9" />
          Add Funds
        </button>
        <button class="action-btn secondary" @click="$emit('viewHistory')">
          <v-icon name="hi-clock" scale="0.9" />
          History
        </button>
      </div>

      <div class="wallet-setting">
        <div class="setting-info">
          <v-icon name="fa-stethoscope" scale="0.85" />
          <span>Allow specialists to charge wallet</span>
        </div>
        <label class="toggle-switch">
          <input
            type="checkbox"
            :checked="allowSpecialistCharge"
            @change="$emit('toggleSpecialistCharge', $event.target.checked)"
            :disabled="updatingSetting"
          />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- Decorative elements -->
    <div class="card-decoration circle-1"></div>
    <div class="card-decoration circle-2"></div>
  </div>
</template>

<script>
export default {
  name: "WalletBalanceCard",
  props: {
    balance: {
      type: Number,
      default: 0,
    },
    allowSpecialistCharge: {
      type: Boolean,
      default: true,
    },
    updatingSetting: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["topUp", "viewHistory", "toggleSpecialistCharge"],
  computed: {
    formattedBalance() {
      return new Intl.NumberFormat("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(this.balance || 0);
    },
  },
};
</script>

<style scoped lang="scss">
.wallet-balance-card {
  position: relative;
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
  border-radius: 20px;
  padding: 28px;
  color: white;
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 480px) {
    padding: 20px 16px;
    border-radius: 16px;
  }

  .balance-card-inner {
    position: relative;
    z-index: 1;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    .balance-label {
      font-size: 14px;
      opacity: 0.9;
      font-weight: 500;

      @media (max-width: 480px) {
        font-size: 13px;
      }
    }

    .wallet-icon {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      @media (max-width: 480px) {
        width: 36px;
        height: 36px;
      }
    }
  }

  .balance-amount {
    margin-bottom: 24px;

    @media (max-width: 480px) {
      margin-bottom: 16px;
    }

    .currency {
      font-size: 28px;
      font-weight: 600;
      margin-right: 4px;

      @media (max-width: 480px) {
        font-size: 20px;
      }
    }

    .amount {
      font-size: 40px;
      font-weight: 700;
      letter-spacing: -1px;

      @media (max-width: 480px) {
        font-size: 28px;
      }
    }
  }

  .card-actions {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;

    @media (max-width: 480px) {
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;

      @media (max-width: 480px) {
        padding: 12px 16px;
        font-size: 13px;
      }

      &.primary {
        background: white;
        color: #0891b2;

        &:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-1px);
        }
      }

      &.secondary {
        background: rgba(255, 255, 255, 0.2);
        color: white;

        &:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }
  }

  .wallet-setting {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    gap: 12px;

    @media (max-width: 480px) {
      padding-top: 12px;
    }

    .setting-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      opacity: 0.95;
      flex: 1;

      @media (max-width: 480px) {
        font-size: 12px;
        gap: 6px;
      }
    }
  }

  .card-decoration {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);

    &.circle-1 {
      width: 200px;
      height: 200px;
      top: -80px;
      right: -60px;

      @media (max-width: 480px) {
        width: 120px;
        height: 120px;
        top: -40px;
        right: -30px;
      }
    }

    &.circle-2 {
      width: 150px;
      height: 150px;
      bottom: -60px;
      left: -40px;

      @media (max-width: 480px) {
        width: 100px;
        height: 100px;
        bottom: -40px;
        left: -30px;
      }
    }
  }
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider {
      background-color: rgba(255, 255, 255, 0.4);
    }

    &:checked + .slider:before {
      transform: translateX(20px);
      background-color: white;
    }

    &:disabled + .slider {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.2);
    transition: 0.3s;
    border-radius: 24px;

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: rgba(255, 255, 255, 0.6);
      transition: 0.3s;
      border-radius: 50%;
    }
  }
}
</style>
