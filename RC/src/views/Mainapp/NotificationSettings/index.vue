<template>
  <div class="notification-settings-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="notification-btn" @click="$router.push('/app/patient/notifications')">
        <v-icon name="hi-bell" scale="1.1" />
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="hi-bell" scale="1.2" class="spinner-icon" />
        </div>
        <p>Loading preferences...</p>
      </div>

      <template v-else>
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero__content">
            <button class="back-link desktop-only" @click="$router.push('/app/patient/dashboard')">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Dashboard</span>
            </button>
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="hi-bell" />
              <span>Stay Informed</span>
            </div>
            <h1 class="hero__title">
              Notification<br/>
              <span class="hero__title-accent">Settings</span>
            </h1>
            <p class="hero__subtitle">
              Customize how and when you receive notifications for appointments, prescriptions, and health updates.
            </p>
            <div class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ enabledChannels }}</span>
                <span class="hero-stat__label">Channels</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--info">{{ categories.length }}</span>
                <span class="hero-stat__label">Categories</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--success">{{ enabledCount }}</span>
                <span class="hero-stat__label">Active</span>
              </div>
            </div>
          </div>
          <div class="hero__visual">
            <div class="notification-orb">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="hi-bell" />
              </div>
            </div>
            <div class="floating-icons">
              <div class="float-icon float-icon--1"><v-icon name="hi-mail" /></div>
              <div class="float-icon float-icon--2"><v-icon name="hi-device-mobile" /></div>
              <div class="float-icon float-icon--3"><v-icon name="hi-chat" /></div>
            </div>
          </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
          <!-- Quick Actions Card -->
          <div class="bento-card actions-card">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="actions-row">
              <button class="action-btn" @click="$router.push('/app/patient/notifications')">
                <div class="action-icon violet">
                  <v-icon name="hi-bell" scale="1.1" />
                </div>
                <span>View Notifications</span>
              </button>
              <button class="action-btn" @click="setAllPreferences(true)">
                <div class="action-icon emerald">
                  <v-icon name="hi-check-circle" scale="1.1" />
                </div>
                <span>Enable All</span>
              </button>
              <button class="action-btn" @click="setAllPreferences(false)">
                <div class="action-icon rose">
                  <v-icon name="hi-x-circle" scale="1.1" />
                </div>
                <span>Disable All</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/patient/onboarding')">
                <div class="action-icon sky">
                  <v-icon name="hi-user" scale="1.1" />
                </div>
                <span>Account Settings</span>
              </button>
            </div>
          </div>

          <!-- Channel Legend Card -->
          <div class="bento-card legend-card">
            <div class="card-header">
              <h3>Notification Channels</h3>
              <span class="channel-count">{{ channels.length }} available</span>
            </div>
            <div class="channels-grid">
              <div
                v-for="channel in channels"
                :key="channel.id"
                class="channel-item"
              >
                <div class="channel-icon" :class="channel.colorClass">
                  <v-icon :name="channel.icon" scale="1" />
                </div>
                <div class="channel-info">
                  <span class="channel-name">{{ channel.label }}</span>
                  <span class="channel-desc">{{ channel.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Preferences Card -->
          <div class="bento-card preferences-card">
            <div class="card-header">
              <h3>Notification Preferences</h3>
              <span v-if="saving" class="saving-indicator">
                <div class="mini-spinner"></div>
                Saving...
              </span>
            </div>

            <!-- Error State -->
            <div v-if="error" class="error-state">
              <v-icon name="hi-exclamation-circle" scale="1.2" />
              <span>{{ error }}</span>
              <button class="retry-btn" @click="fetchPreferences">Retry</button>
            </div>

            <!-- Preference Categories -->
            <div v-else class="preferences-list">
              <div
                v-for="category in categories"
                :key="category.id"
                class="preference-item"
              >
                <div class="preference-item__left">
                  <div class="preference-icon" :style="{ background: category.bgColor }">
                    <v-icon :name="category.icon" scale="1" :style="{ color: category.color }" />
                  </div>
                  <div class="preference-info">
                    <div class="preference-header">
                      <span class="preference-title">{{ category.title }}</span>
                    </div>
                    <p class="preference-description">{{ category.description }}</p>
                  </div>
                </div>
                <div class="preference-item__right">
                  <div class="channel-toggles">
                    <div
                      v-for="channel in channels"
                      :key="channel.id"
                      class="toggle-wrapper"
                      :title="channel.label"
                    >
                      <label class="toggle-switch" :class="{ active: getPreference(category.id, channel.id) }">
                        <input
                          type="checkbox"
                          :checked="getPreference(category.id, channel.id)"
                          @change="updatePreference(category.id, channel.id, $event.target.checked)"
                          :disabled="saving"
                        />
                        <span class="slider" :class="{ loading: savingKey === `${category.id}.${channel.id}` }">
                          <v-icon :name="channel.icon" scale="0.6" />
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Info Note -->
            <div class="info-note">
              <v-icon name="hi-information-circle" scale="0.9" />
              <span>Critical notifications (security alerts, payment confirmations) will always be sent regardless of preferences.</span>
            </div>
          </div>

          <!-- Coming Soon Cards -->
          <div class="bento-card coming-soon-card">
            <div class="coming-soon-icon quiet">
              <v-icon name="hi-moon" scale="1.2" />
            </div>
            <div class="coming-soon-content">
              <h4>Quiet Hours</h4>
              <p>Pause non-urgent notifications during specific times</p>
            </div>
            <div class="coming-soon-badge">
              <v-icon name="hi-clock" scale="0.7" />
              <span>Coming Soon</span>
            </div>
          </div>

          <div class="bento-card coming-soon-card">
            <div class="coming-soon-icon sound">
              <v-icon name="hi-volume-up" scale="1.2" />
            </div>
            <div class="coming-soon-content">
              <h4>Notification Sound</h4>
              <p>Customize your notification alert sound</p>
            </div>
            <div class="coming-soon-badge">
              <v-icon name="hi-clock" scale="0.7" />
              <span>Coming Soon</span>
            </div>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "NotificationSettingsPage",
  emits: ["openSideNav"],
  data() {
    return {
      loading: true,
      saving: false,
      savingKey: null,
      error: null,
      preferences: null,

      channels: [
        { id: "in_app", label: "In-App", description: "Notifications in the app", icon: "hi-device-mobile", colorClass: "violet" },
        { id: "email", label: "Email", description: "Email notifications", icon: "hi-mail", colorClass: "sky" },
        { id: "sms", label: "SMS", description: "Text messages", icon: "hi-chat", colorClass: "emerald" },
        { id: "whatsapp", label: "WhatsApp", description: "WhatsApp messages", icon: "co-whatsapp", colorClass: "whatsapp" },
        { id: "push", label: "Push", description: "Mobile push notifications", icon: "hi-bell", colorClass: "amber" },
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
          icon: "ri-capsule-line",
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
          icon: "hi-gift",
          color: "#ec4899",
          bgColor: "rgba(236, 72, 153, 0.1)",
        },
      ],
    };
  },

  computed: {
    enabledChannels() {
      return this.channels.length;
    },
    enabledCount() {
      if (!this.preferences) return 0;
      let count = 0;
      this.categories.forEach((cat) => {
        this.channels.forEach((ch) => {
          if (this.preferences[cat.id]?.[ch.id]) count++;
        });
      });
      return count;
    },
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

    async updatePreference(categoryId, channelId, value) {
      const key = `${categoryId}.${channelId}`;
      this.savingKey = key;
      this.saving = true;

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
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.notification-settings-page {
  width: 100%;
  min-height: 100vh;
  background: $bg;
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 16px;
  background: white;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) {
    display: flex;
  }

  .menu-btn, .notification-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: $bg;
    color: $slate;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:active {
      background: #E2E8F0;
    }
  }

  .header-logo {
    img {
      height: 28px;
      width: auto;
    }
  }
}

// Page Content
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 160px;

  @media (max-width: 768px) {
    padding: 16px 16px 120px;
  }
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;

  .loading-spinner {
    position: relative;
    width: 64px;
    height: 64px;

    .spinner-ring {
      position: absolute;
      inset: 0;
      border: 3px solid $sky-light;
      border-top-color: $sky;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: $sky;
    }
  }

  p {
    color: $gray;
    font-size: 14px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ============================================
// HERO SECTION
// ============================================
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 48px 40px 72px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  position: relative;
  overflow: hidden;
  min-height: 460px;
  margin-bottom: 24px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    padding: 24px 20px 32px;
    gap: 16px;
    text-align: center;
    min-height: auto;
    border-radius: 20px;
    margin-bottom: 16px;
    overflow: visible;
  }

  .hero__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2;

    @media (max-width: 768px) {
      align-items: center;
    }
  }

  .hero__badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 24px;
    width: fit-content;
    margin-bottom: 20px;
    position: relative;

    @media (max-width: 768px) {
      margin: 0 auto 12px;
      padding: 6px 14px;
    }

    .badge-pulse {
      position: absolute;
      left: 12px;
      width: 8px;
      height: 8px;
      background: $emerald;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;

      &::after {
        content: '';
        position: absolute;
        inset: -4px;
        background: rgba($emerald, 0.4);
        border-radius: 50%;
        animation: pulse-ring 2s ease-out infinite;
      }
    }

    svg {
      width: 16px;
      height: 16px;
      color: white;
      margin-left: 12px;
    }

    span {
      font-size: 13px;
      font-weight: 600;
      color: white;
      letter-spacing: 0.3px;
    }
  }

  .hero__title {
    font-size: 48px;
    font-weight: 800;
    color: white;
    line-height: 1.1;
    margin: 0 0 16px;
    letter-spacing: -1px;

    @media (max-width: 768px) {
      font-size: 28px;
      margin: 0 0 8px;
      letter-spacing: -0.5px;

      br {
        display: none;
      }
    }

    .hero__title-accent {
      background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;

      @media (max-width: 768px) {
        display: inline;
        margin-left: 6px;
      }
    }
  }

  .hero__subtitle {
    font-size: 18px;
    color: white;
    line-height: 1.6;
    margin: 0 0 24px;
    max-width: 400px;
    opacity: 0.95;

    @media (max-width: 768px) {
      font-size: 14px;
      max-width: 100%;
      margin: 0 0 16px;
      opacity: 0.9;
    }
  }

  .hero__stats {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    width: fit-content;

    @media (max-width: 768px) {
      width: 100%;
      justify-content: space-around;
      padding: 14px 16px;
      gap: 0;
      border-radius: 12px;
    }
  }

  .hero__visual {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    @media (max-width: 768px) {
      margin-top: 8px;
      transform: scale(0.6);
      height: 140px;
    }
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  width: fit-content;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.desktop-only {
  @media (max-width: 768px) {
    display: none !important;
  }
}

.hero-stat {
  text-align: center;

  &__value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: white;
    line-height: 1;

    @media (max-width: 768px) {
      font-size: 20px;
    }

    &--warning { color: $amber-light; }
    &--info { color: $sky-light; }
    &--success { color: $emerald-light; }
  }

  &__label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
  }
}

// Orb Animation
.notification-orb {
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 {
    width: 100%;
    height: 100%;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    width: 80%;
    height: 80%;
    animation: spin-slow 15s linear infinite reverse;
  }

  &--3 {
    width: 60%;
    height: 60%;
    animation: spin-slow 10s linear infinite;
  }
}

.orb-core {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 40px rgba(255, 255, 255, 0.3),
    0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;

  svg {
    width: 48px;
    height: 48px;
    color: white;
  }
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;

  svg {
    width: 20px;
    height: 20px;
    color: white;
  }

  &--1 { top: 10%; right: 10%; animation-delay: 0s; }
  &--2 { bottom: 20%; right: 5%; animation-delay: 1s; }
  &--3 { bottom: 10%; left: 10%; animation-delay: 2s; }
}

@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
@keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
@keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); } 50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

// ============================================
// BENTO GRID
// ============================================
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(6, 1fr);
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }

    .channel-count, .saving-indicator {
      font-size: 13px;
      color: $gray;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .mini-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid $sky-light;
      border-top-color: $sky;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }
}

// Actions Card
.actions-card {
  grid-column: span 12;

  @media (max-width: 768px) {
    display: none;
  }

  .actions-row {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px 16px;
    background: $bg;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: white;
      border-color: $sky;
      box-shadow: 0 4px 12px rgba($sky, 0.15);
      transform: translateY(-2px);
    }

    span {
      font-size: 13px;
      font-weight: 500;
      color: $slate;
    }
  }

  .action-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.sky { background: $sky-light; color: $sky-dark; }
    &.emerald { background: $emerald-light; color: $emerald; }
    &.violet { background: $violet-light; color: $violet; }
    &.amber { background: $amber-light; color: $amber; }
    &.rose { background: $rose-light; color: $rose; }
  }
}

// Legend Card
.legend-card {
  grid-column: span 12;

  .channels-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }

  .channel-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px;
    background: $bg;
    border-radius: 12px;
    border: 1px solid #E2E8F0;
    min-width: 0;

    @media (max-width: 768px) {
      padding: 12px;
    }
  }

  .channel-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.violet { background: $violet-light; color: $violet; }
    &.sky { background: $sky-light; color: $sky-dark; }
    &.emerald { background: $emerald-light; color: $emerald; }
    &.whatsapp { background: #DCF8C6; color: #25D366; }
    &.amber { background: $amber-light; color: $amber; }
  }

  .channel-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;

    .channel-name {
      font-size: 14px;
      font-weight: 600;
      color: $navy;
    }

    .channel-desc {
      font-size: 12px;
      color: $gray;

      @media (max-width: 768px) {
        white-space: normal;
      }
    }
  }
}

// Preferences Card
.preferences-card {
  grid-column: span 12;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  gap: 12px;
  color: $rose;

  .retry-btn {
    margin-top: 8px;
    padding: 10px 20px;
    background: $sky-dark;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;

    &:hover {
      background: $sky-darker;
    }
  }
}

.preferences-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preference-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: $bg;
  border-radius: 14px;
  border: 1px solid #E2E8F0;
  transition: all 0.2s;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 14px;
  }

  &:hover {
    background: white;
    border-color: $sky-light;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;
  }

  &__right {
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 100%;
      padding-top: 12px;
      border-top: 1px solid #E2E8F0;
    }
  }
}

.preference-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preference-info {
  flex: 1;
  min-width: 0;

  .preference-title {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
    display: block;
    margin-bottom: 2px;
  }

  .preference-description {
    font-size: 13px;
    color: $gray;
    margin: 0;
    line-height: 1.4;
  }
}

.channel-toggles {
  display: flex;
  gap: 8px;

  @media (max-width: 768px) {
    justify-content: space-between;
    width: 100%;
  }
}

.toggle-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.toggle-switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #E2E8F0;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: linear-gradient(135deg, $sky, $sky-dark);

    .slider svg {
      color: white;
    }
  }

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;

    &:disabled + .slider {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .slider {
    display: flex;
    align-items: center;
    justify-content: center;

    &.loading {
      animation: pulse 1s infinite;
    }

    svg {
      color: $gray;
      transition: color 0.2s;
    }
  }

  &:hover:not(.active) {
    background: #CBD5E1;
  }
}

.info-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 20px;
  padding: 14px 16px;
  background: rgba($sky, 0.05);
  border-radius: 12px;
  border: 1px solid rgba($sky, 0.1);

  svg {
    color: $sky-dark;
    flex-shrink: 0;
    margin-top: 1px;
  }

  span {
    font-size: 13px;
    color: $gray;
    line-height: 1.5;
  }
}

// Coming Soon Cards
.coming-soon-card {
  grid-column: span 6;
  display: flex;
  align-items: center;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }

  .coming-soon-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.quiet {
      background: $violet-light;
      color: $violet;
    }

    &.sound {
      background: $amber-light;
      color: $amber;
    }
  }

  .coming-soon-content {
    flex: 1;
    min-width: 0;

    h4 {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0 0 4px;
    }

    p {
      font-size: 13px;
      color: $gray;
      margin: 0;
    }
  }

  .coming-soon-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: $bg;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    color: $gray;
    flex-shrink: 0;
    border: 1px solid #E2E8F0;
  }
}
</style>
