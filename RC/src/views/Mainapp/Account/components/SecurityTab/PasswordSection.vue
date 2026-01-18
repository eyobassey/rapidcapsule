<template>
  <div class="password-section">
    <div class="section-header">
      <div class="header-left">
        <div class="section-icon">
          <v-icon name="hi-lock-closed" scale="1" />
        </div>
        <div class="header-text">
          <h3 class="section-title">Password</h3>
          <p class="section-subtitle">Manage your account password</p>
        </div>
      </div>
    </div>

    <div class="password-display">
      <div class="password-dots">
        <span v-for="i in 10" :key="i" class="dot"></span>
      </div>
      <span class="password-hint">Last changed {{ lastChanged }}</span>
    </div>

    <button class="reset-btn" @click="$emit('resetPassword')">
      <v-icon name="hi-pencil" scale="0.85" />
      Change Password
    </button>
  </div>
</template>

<script>
export default {
  name: "PasswordSection",
  props: {
    lastPasswordChange: {
      type: String,
      default: null,
    },
  },
  emits: ["resetPassword"],
  computed: {
    lastChanged() {
      if (!this.lastPasswordChange) return "Unknown";
      const date = new Date(this.lastPasswordChange);
      const now = new Date();
      const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diff === 0) return "Today";
      if (diff === 1) return "Yesterday";
      if (diff < 7) return `${diff} days ago`;
      if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
      if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
      return `${Math.floor(diff / 365)} years ago`;
    },
  },
};
</script>

<style scoped lang="scss">
.password-section {
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
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      gap: 14px;
      align-items: flex-start;

      .section-icon {
        width: 44px;
        height: 44px;
        background: rgba(107, 114, 128, 0.1);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        flex-shrink: 0;
      }

      .header-text {
        .section-title {
          font-size: 17px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;
        }

        .section-subtitle {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }
      }
    }
  }

  .password-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #f9fafb;
    border-radius: 10px;
    margin-bottom: 16px;

    .password-dots {
      display: flex;
      gap: 6px;

      .dot {
        width: 10px;
        height: 10px;
        background: #374151;
        border-radius: 50%;
      }
    }

    .password-hint {
      font-size: 12px;
      color: #9ca3af;
    }
  }

  .reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: transparent;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #0EAEC4;
      color: #0EAEC4;
      background: rgba(14, 174, 196, 0.05);
    }
  }
}
</style>
