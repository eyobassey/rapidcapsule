<template>
  <div class="whatsapp-section">
    <div class="section-header">
      <div class="header-left">
        <div class="section-icon">
          <v-icon name="hi-chat" scale="1" />
        </div>
        <div class="header-text">
          <h3 class="section-title">WhatsApp Notifications</h3>
          <p class="section-subtitle">Receive updates and reminders via WhatsApp</p>
        </div>
      </div>
    </div>

    <div class="settings-content">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">Enable WhatsApp Notifications</span>
          <span class="setting-description">Get appointment reminders and health tips</span>
        </div>
        <label class="toggle-switch">
          <input
            type="checkbox"
            :checked="enabled"
            @change="$emit('toggle', $event.target.checked)"
            :disabled="updating"
          />
          <span class="slider" :class="{ loading: updating }"></span>
        </label>
      </div>

      <div v-if="enabled && phoneNumber" class="phone-display">
        <span class="phone-label">Connected to:</span>
        <span class="phone-number">{{ phoneNumber }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "WhatsAppSettingsSection",
  props: {
    enabled: {
      type: Boolean,
      default: false,
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    updating: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["toggle"],
};
</script>

<style scoped lang="scss">
.whatsapp-section {
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
        background: rgba(37, 211, 102, 0.1);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #25d366;
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

  .settings-content {
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;

      .setting-info {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .setting-label {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .setting-description {
          font-size: 12px;
          color: #6b7280;
        }
      }
    }

    .phone-display {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 12px 16px;
      background: rgba(37, 211, 102, 0.1);
      border-radius: 10px;

      .phone-label {
        font-size: 12px;
        color: #6b7280;
      }

      .phone-number {
        font-size: 14px;
        font-weight: 600;
        color: #25d366;
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
      background-color: #25d366;
    }

    &:checked + .slider:before {
      transform: translateX(20px);
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
    background-color: #d1d5db;
    transition: 0.3s;
    border-radius: 24px;

    &.loading {
      animation: pulse 1s infinite;
    }

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
