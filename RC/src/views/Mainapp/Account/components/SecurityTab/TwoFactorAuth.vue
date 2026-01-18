<template>
  <div class="twofa-section">
    <div class="section-header">
      <div class="header-left">
        <div class="section-icon" :class="{ active: hasActiveMethod }">
          <v-icon name="hi-shield-check" scale="1" />
        </div>
        <div class="header-text">
          <h3 class="section-title">Two-Factor Authentication</h3>
          <p class="section-subtitle">
            <template v-if="hasActiveMethod">
              Active: {{ activeMethodLabel }}
            </template>
            <template v-else>
              Add an extra layer of security
            </template>
          </p>
        </div>
      </div>
      <div v-if="hasActiveMethod" class="status-badge enabled">
        <v-icon name="hi-check" scale="0.7" />
        Enabled
      </div>
    </div>

    <div class="methods-list">
      <div
        v-for="method in methods"
        :key="method.name"
        class="method-item"
        :class="{ active: method.isActive, loading: method.isLoading }"
      >
        <div class="method-info">
          <div class="method-icon">
            <v-icon :name="getIcon(method.name)" scale="1" />
          </div>
          <div class="method-text">
            <span class="method-title">{{ method.title }}</span>
            <span class="method-description">{{ getDescription(method.name) }}</span>
          </div>
        </div>

        <div class="method-actions">
          <button
            v-if="method.action && !method.isActive"
            class="change-btn"
            @click="$emit('changeMethod', method)"
          >
            {{ method.action }}
          </button>
          <label class="toggle-switch">
            <input
              type="checkbox"
              :checked="method.isActive"
              @change="handleToggle(method)"
              :disabled="method.isLoading"
            />
            <span class="slider" :class="{ loading: method.isLoading }"></span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TwoFactorAuth",
  props: {
    methods: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["toggleMethod", "changeMethod"],
  computed: {
    hasActiveMethod() {
      return this.methods.some((m) => m.isActive);
    },
    activeMethodLabel() {
      const active = this.methods.find((m) => m.isActive);
      return active?.title || "";
    },
  },
  methods: {
    getIcon(name) {
      switch (name) {
        case "email":
          return "hi-mail";
        case "sms":
          return "hi-phone";
        case "auth_apps":
          return "hi-key";
        default:
          return "hi-shield-check";
      }
    },
    getDescription(name) {
      switch (name) {
        case "email":
          return "Receive verification codes via email";
        case "sms":
          return "Receive verification codes via SMS";
        case "auth_apps":
          return "Use an authenticator app like Google Authenticator";
        default:
          return "";
      }
    },
    handleToggle(method) {
      this.$emit("toggleMethod", method);
    },
  },
};
</script>

<style scoped lang="scss">
.twofa-section {
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

        &.active {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
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

    .status-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;

      &.enabled {
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
      }
    }
  }

  .methods-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .method-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      border: 2px solid transparent;
      transition: all 0.2s ease;
      gap: 12px;

      @media (max-width: 480px) {
        padding: 12px;
        flex-wrap: wrap;
      }

      &:hover {
        background: #f3f4f6;
      }

      &.active {
        background: rgba(14, 174, 196, 0.05);
        border-color: rgba(14, 174, 196, 0.2);
      }

      &.loading {
        opacity: 0.7;
      }

      .method-info {
        display: flex;
        align-items: center;
        gap: 14px;
        flex: 1;
        min-width: 0;

        @media (max-width: 480px) {
          gap: 10px;
        }

        .method-icon {
          width: 40px;
          height: 40px;
          background: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .method-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;

          .method-title {
            font-size: 14px;
            font-weight: 600;
            color: #111827;

            @media (max-width: 480px) {
              font-size: 13px;
            }
          }

          .method-description {
            font-size: 12px;
            color: #6b7280;

            @media (max-width: 480px) {
              font-size: 11px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
        }
      }

      .method-actions {
        display: flex;
        align-items: center;
        gap: 12px;

        .change-btn {
          padding: 6px 12px;
          background: transparent;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: #0EAEC4;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            border-color: #0EAEC4;
            background: rgba(14, 174, 196, 0.05);
          }
        }
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
      background-color: #0EAEC4;
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
