<template>
  <div class="notification-preferences">
    <div class="section-header">
      <div class="header-left">
        <div class="section-icon">
          <v-icon name="hi-bell" scale="1" />
        </div>
        <div class="header-text">
          <h3 class="section-title">Notification Preferences</h3>
          <p class="section-subtitle">Choose how you want to receive notifications</p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <span>Loading preferences...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <v-icon name="hi-exclamation-circle" scale="1.2" />
      <span>{{ error }}</span>
      <button class="retry-btn" @click="fetchPreferences">Retry</button>
    </div>

    <!-- Preferences Content -->
    <div v-else class="preferences-content">
      <!-- Channel Legend -->
      <div class="channel-legend">
        <div class="legend-item" v-for="channel in channels" :key="channel.id">
          <v-icon :name="channel.icon" scale="0.8" />
          <span>{{ channel.label }}</span>
        </div>
      </div>

      <!-- Preference Categories -->
      <div class="preference-categories">
        <div
          v-for="category in categories"
          :key="category.id"
          class="preference-card"
        >
          <div class="card-header">
            <div class="category-info">
              <div class="category-icon" :style="{ background: category.bgColor }">
                <v-icon :name="category.icon" scale="0.9" :style="{ color: category.color }" />
              </div>
              <div class="category-text">
                <h4 class="category-title">{{ category.title }}</h4>
                <p class="category-description">{{ category.description }}</p>
              </div>
            </div>
          </div>

          <div class="channel-toggles">
            <div
              v-for="channel in channels"
              :key="channel.id"
              class="channel-toggle"
              :class="{ disabled: !isChannelAvailable(channel.id) }"
            >
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="getPreference(category.id, channel.id)"
                  @change="updatePreference(category.id, channel.id, $event.target.checked)"
                  :disabled="saving || !isChannelAvailable(channel.id)"
                />
                <span class="slider" :class="{ loading: savingKey === `${category.id}.${channel.id}` }"></span>
              </label>
              <span class="channel-label">{{ channel.shortLabel }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button
          class="action-btn enable-all"
          @click="setAllPreferences(true)"
          :disabled="saving"
        >
          <v-icon name="hi-check-circle" scale="0.9" />
          Enable All
        </button>
        <button
          class="action-btn disable-all"
          @click="setAllPreferences(false)"
          :disabled="saving"
        >
          <v-icon name="hi-x-circle" scale="0.9" />
          Disable All
        </button>
      </div>

      <!-- Info Note -->
      <div class="info-note">
        <v-icon name="hi-information-circle" scale="0.9" />
        <span>Critical notifications (security alerts, payment confirmations) will always be sent regardless of preferences.</span>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "NotificationPreferences",
  data() {
    return {
      loading: true,
      saving: false,
      savingKey: null,
      error: null,
      preferences: null,

      channels: [
        { id: "in_app", label: "In-App", shortLabel: "App", icon: "hi-device-mobile" },
        { id: "email", label: "Email", shortLabel: "Email", icon: "hi-mail" },
        { id: "sms", label: "SMS", shortLabel: "SMS", icon: "hi-chat-alt" },
        { id: "whatsapp", label: "WhatsApp", shortLabel: "WhatsApp", icon: "hi-chat" },
        { id: "push", label: "Push", shortLabel: "Push", icon: "hi-bell" },
      ],

      categories: [
        {
          id: "appointment_reminders",
          title: "Appointment Reminders",
          description: "Reminders before your scheduled appointments",
          icon: "hi-clock",
          color: "#6366f1",
          bgColor: "rgba(99, 102, 241, 0.1)",
        },
        {
          id: "appointment_updates",
          title: "Appointment Updates",
          description: "Updates when appointments are booked, confirmed, or cancelled",
          icon: "hi-calendar",
          color: "#8b5cf6",
          bgColor: "rgba(139, 92, 246, 0.1)",
        },
        {
          id: "prescription_updates",
          title: "Prescription Updates",
          description: "New prescriptions and pharmacy order updates",
          icon: "hi-document-text",
          color: "#10b981",
          bgColor: "rgba(16, 185, 129, 0.1)",
        },
        {
          id: "payment_updates",
          title: "Payment Updates",
          description: "Payment confirmations and transaction receipts",
          icon: "hi-credit-card",
          color: "#f59e0b",
          bgColor: "rgba(245, 158, 11, 0.1)",
        },
        {
          id: "health_reminders",
          title: "Health Reminders",
          description: "Medication and health checkup reminders",
          icon: "hi-heart",
          color: "#ef4444",
          bgColor: "rgba(239, 68, 68, 0.1)",
        },
        {
          id: "vitals_alerts",
          title: "Vitals Alerts",
          description: "Alerts when your vitals need attention",
          icon: "hi-chart-bar",
          color: "#0ea5e9",
          bgColor: "rgba(14, 165, 233, 0.1)",
        },
        {
          id: "promotional",
          title: "Promotional",
          description: "Special offers, tips, and health insights",
          icon: "hi-speakerphone",
          color: "#ec4899",
          bgColor: "rgba(236, 72, 153, 0.1)",
        },
      ],
    };
  },

  mounted() {
    this.fetchPreferences();
  },

  methods: {
    async fetchPreferences() {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.get("/notifications/preferences");
        this.preferences = response.data.data || this.getDefaultPreferences();
      } catch (err) {
        console.error("Failed to fetch notification preferences:", err);
        this.error = "Failed to load preferences. Please try again.";
      } finally {
        this.loading = false;
      }
    },

    getDefaultPreferences() {
      const defaults = {};
      this.categories.forEach((cat) => {
        defaults[cat.id] = {
          in_app: true,
          email: true,
          sms: false,
          whatsapp: false,
          push: true,
        };
      });
      return defaults;
    },

    getPreference(categoryId, channelId) {
      if (!this.preferences || !this.preferences[categoryId]) {
        return false;
      }
      return this.preferences[categoryId][channelId] ?? false;
    },

    isChannelAvailable(channelId) {
      // In-app and email are always available
      // SMS, WhatsApp, and Push depend on user setup
      // For now, we'll enable all - the backend will handle availability
      return true;
    },

    async updatePreference(categoryId, channelId, value) {
      const key = `${categoryId}.${channelId}`;
      this.savingKey = key;
      this.saving = true;

      // Optimistic update
      const previousValue = this.preferences[categoryId]?.[channelId];
      if (!this.preferences[categoryId]) {
        this.preferences[categoryId] = {};
      }
      this.preferences[categoryId][channelId] = value;

      try {
        await axios.patch("/notifications/preferences", {
          [categoryId]: {
            [channelId]: value,
          },
        });
      } catch (err) {
        console.error("Failed to update preference:", err);
        // Revert on error
        this.preferences[categoryId][channelId] = previousValue;
        this.$toast?.error?.("Failed to update preference") ||
          alert("Failed to update preference");
      } finally {
        this.saving = false;
        this.savingKey = null;
      }
    },

    async setAllPreferences(value) {
      this.saving = true;

      const updates = {};
      this.categories.forEach((cat) => {
        updates[cat.id] = {};
        this.channels.forEach((ch) => {
          updates[cat.id][ch.id] = value;
        });
      });

      try {
        await axios.patch("/notifications/preferences", updates);
        this.preferences = updates;
      } catch (err) {
        console.error("Failed to update all preferences:", err);
        this.$toast?.error?.("Failed to update preferences") ||
          alert("Failed to update preferences");
      } finally {
        this.saving = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.notification-preferences {
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
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  .header-left {
    display: flex;
    gap: 14px;
    align-items: flex-start;

    .section-icon {
      width: 44px;
      height: 44px;
      background: rgba(99, 102, 241, 0.1);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6366f1;
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

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
  color: #6b7280;

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #e5e7eb;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .retry-btn {
    margin-top: 8px;
    padding: 8px 16px;
    background: #6366f1;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;

    &:hover {
      background: #4f46e5;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.channel-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 10px;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    gap: 10px;
    padding: 10px 12px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #6b7280;

    svg {
      color: #9ca3af;
    }
  }
}

.preference-categories {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preference-card {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;

  @media (max-width: 480px) {
    padding: 12px;
  }

  &:hover {
    background: #f3f4f6;
  }

  .card-header {
    margin-bottom: 14px;

    .category-info {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      .category-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .category-text {
        .category-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 2px 0;
        }

        .category-description {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }
      }
    }
  }

  .channel-toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding-left: 48px;

    @media (max-width: 480px) {
      padding-left: 0;
      gap: 8px;
    }

    .channel-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 90px;

      @media (max-width: 480px) {
        min-width: 75px;
        gap: 6px;
      }

      &.disabled {
        opacity: 0.5;
      }

      .channel-label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }
    }
  }
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider {
      background-color: #6366f1;
    }

    &:checked + .slider:before {
      transform: translateX(16px);
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
    border-radius: 20px;

    &.loading {
      animation: pulse 1s infinite;
    }

    &:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.quick-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;

    @media (max-width: 480px) {
      padding: 12px 16px;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &.enable-all {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;

      &:hover:not(:disabled) {
        background: rgba(16, 185, 129, 0.2);
      }
    }

    &.disable-all {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;

      &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.2);
      }
    }
  }
}

.info-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 14px;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 10px;
  border: 1px solid rgba(99, 102, 241, 0.1);

  svg {
    color: #6366f1;
    flex-shrink: 0;
    margin-top: 1px;
  }

  span {
    font-size: 12px;
    color: #6b7280;
    line-height: 1.5;
  }
}
</style>
