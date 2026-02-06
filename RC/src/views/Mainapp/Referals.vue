<template>
  <div class="referrals-page">
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
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link desktop-only" @click="$router.push('/app/patient/dashboard')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Dashboard</span>
          </button>
          <div class="hero__badge">
            <div class="badge-pulse"></div>
            <v-icon name="hi-gift" />
            <span>Rewards Program</span>
          </div>
          <h1 class="hero__title">
            Referrals &amp;<br/>
            <span class="hero__title-accent">Rewards</span>
          </h1>
          <p class="hero__subtitle">
            {{ settings?.hero_banner?.subtitle || 'Invite friends to Rapid Capsule and earn credits for every successful referral.' }}
          </p>
          <div class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ stats?.total_signups || 0 }}</span>
              <span class="hero-stat__label">Friends Joined</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value hero-stat__value--success">{{ stats?.total_credits_earned || 0 }}</span>
              <span class="hero-stat__label">Credits Earned</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value hero-stat__value--warning">{{ stats?.conversion_rate || 0 }}%</span>
              <span class="hero-stat__label">Conversion</span>
            </div>
          </div>
        </div>
        <div class="hero__visual">
          <div class="referral-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-gift" />
            </div>
          </div>
          <div class="floating-icons">
            <div class="float-icon float-icon--1"><v-icon name="hi-users" /></div>
            <div class="float-icon float-icon--2"><v-icon name="hi-sparkles" /></div>
            <div class="float-icon float-icon--3"><v-icon name="hi-currency-dollar" /></div>
          </div>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading your referral data...</p>
      </div>

      <!-- Bento Grid -->
      <div v-else class="bento-grid">
        <!-- Referral Link Card (Full Width) -->
        <div class="bento-card bento-card--link">
          <div class="card-header">
            <div class="card-icon card-icon--link">
              <v-icon name="hi-link" scale="1.1" />
            </div>
            <div class="card-title-group">
              <h3>Your Referral Link</h3>
              <p>Share this unique link with friends and family</p>
            </div>
          </div>
          <div class="link-container">
            <div class="link-box">
              <span class="link-text">{{ referralLink }}</span>
              <button class="copy-btn" @click="copyLink" :class="{ copied: linkCopied }">
                <v-icon :name="linkCopied ? 'hi-check' : 'hi-clipboard-copy'" scale="0.9" />
                <span>{{ linkCopied ? 'Copied!' : 'Copy' }}</span>
              </button>
            </div>
            <div class="code-display">
              <span class="code-label">Your Code:</span>
              <span class="code-value">{{ refCode }}</span>
            </div>
          </div>
        </div>

        <!-- Share Options Card -->
        <div class="bento-card bento-card--share">
          <div class="card-header">
            <div class="card-icon card-icon--share">
              <v-icon name="hi-share" scale="1.1" />
            </div>
            <div class="card-title-group">
              <h3>Share With Friends</h3>
              <p>Choose your preferred platform</p>
            </div>
          </div>
          <div class="share-grid">
            <button class="share-btn" @click="share('whatsapp')">
              <div class="share-btn__icon share-btn__icon--whatsapp">
                <img src="@/assets/logos/social/whatsapp.svg" alt="WhatsApp" />
              </div>
              <span class="share-btn__label">WhatsApp</span>
              <span v-if="stats?.shares_by_platform?.whatsapp" class="share-btn__badge">{{ stats.shares_by_platform.whatsapp }}</span>
            </button>
            <button class="share-btn" @click="share('twitter')">
              <div class="share-btn__icon share-btn__icon--twitter">
                <img src="@/assets/logos/social/twitter.svg" alt="Twitter" />
              </div>
              <span class="share-btn__label">Twitter</span>
              <span v-if="stats?.shares_by_platform?.twitter" class="share-btn__badge">{{ stats.shares_by_platform.twitter }}</span>
            </button>
            <button class="share-btn" @click="share('facebook')">
              <div class="share-btn__icon share-btn__icon--facebook">
                <img src="@/assets/logos/social/facebook.svg" alt="Facebook" />
              </div>
              <span class="share-btn__label">Facebook</span>
              <span v-if="stats?.shares_by_platform?.facebook" class="share-btn__badge">{{ stats.shares_by_platform.facebook }}</span>
            </button>
            <button class="share-btn" @click="share('linkedin')">
              <div class="share-btn__icon share-btn__icon--linkedin">
                <img src="@/assets/logos/social/linkedIn.svg" alt="LinkedIn" />
              </div>
              <span class="share-btn__label">LinkedIn</span>
              <span v-if="stats?.shares_by_platform?.linkedin" class="share-btn__badge">{{ stats.shares_by_platform.linkedin }}</span>
            </button>
            <button class="share-btn" @click="share('email')">
              <div class="share-btn__icon share-btn__icon--email">
                <v-icon name="hi-mail" scale="1.2" />
              </div>
              <span class="share-btn__label">Email</span>
              <span v-if="stats?.shares_by_platform?.email" class="share-btn__badge">{{ stats.shares_by_platform.email }}</span>
            </button>
            <button class="share-btn" @click="share('sms')">
              <div class="share-btn__icon share-btn__icon--sms">
                <v-icon name="hi-chat-alt-2" scale="1.2" />
              </div>
              <span class="share-btn__label">SMS</span>
              <span v-if="stats?.shares_by_platform?.sms" class="share-btn__badge">{{ stats.shares_by_platform.sms }}</span>
            </button>
          </div>
        </div>

        <!-- Performance Stats Card -->
        <div class="bento-card bento-card--stats">
          <div class="card-header">
            <div class="card-icon card-icon--stats">
              <v-icon name="hi-chart-bar" scale="1.1" />
            </div>
            <div class="card-title-group">
              <h3>Your Performance</h3>
              <p>Track your referral activity</p>
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-tile">
              <div class="stat-tile__icon stat-tile__icon--clicks">
                <v-icon name="hi-cursor-click" scale="1" />
              </div>
              <div class="stat-tile__content">
                <span class="stat-tile__value">{{ stats?.total_clicks || 0 }}</span>
                <span class="stat-tile__label">Link Clicks</span>
              </div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile__icon stat-tile__icon--shares">
                <v-icon name="hi-share" scale="1" />
              </div>
              <div class="stat-tile__content">
                <span class="stat-tile__value">{{ stats?.total_shares || 0 }}</span>
                <span class="stat-tile__label">Times Shared</span>
              </div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile__icon stat-tile__icon--signups">
                <v-icon name="hi-user-add" scale="1" />
              </div>
              <div class="stat-tile__content">
                <span class="stat-tile__value">{{ stats?.total_signups || 0 }}</span>
                <span class="stat-tile__label">Friends Joined</span>
              </div>
            </div>
            <div class="stat-tile">
              <div class="stat-tile__icon stat-tile__icon--credits">
                <v-icon name="hi-sparkles" scale="1" />
              </div>
              <div class="stat-tile__content">
                <span class="stat-tile__value">{{ stats?.total_credits_earned || 0 }}</span>
                <span class="stat-tile__label">Credits Earned</span>
              </div>
            </div>
          </div>
        </div>

        <!-- How It Works Card -->
        <div class="bento-card bento-card--how">
          <div class="card-header">
            <div class="card-icon card-icon--how">
              <v-icon name="hi-light-bulb" scale="1.1" />
            </div>
            <div class="card-title-group">
              <h3>How It Works</h3>
              <p>Earn rewards in 3 simple steps</p>
            </div>
          </div>
          <div class="steps-container">
            <div class="step">
              <div class="step__number">1</div>
              <div class="step__content">
                <h4>Share Your Link</h4>
                <p>Send your unique referral link to friends</p>
              </div>
            </div>
            <div class="step-connector"></div>
            <div class="step">
              <div class="step__number">2</div>
              <div class="step__content">
                <h4>Friends Sign Up</h4>
                <p>They create an account using your link</p>
              </div>
            </div>
            <div class="step-connector"></div>
            <div class="step">
              <div class="step__number">3</div>
              <div class="step__content">
                <h4>Both Get Rewarded</h4>
                <p>You both receive {{ settings?.referrer_credits || 1 }} free AI credit{{ (settings?.referrer_credits || 1) > 1 ? 's' : '' }}!</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Milestones Card -->
        <div class="bento-card bento-card--milestones" v-if="settings?.milestones?.length">
          <div class="card-header">
            <div class="card-icon card-icon--milestones">
              <v-icon name="gi-trophy" scale="1.1" />
            </div>
            <div class="card-title-group">
              <h3>Milestones</h3>
              <p>Unlock bonus rewards</p>
            </div>
          </div>
          <div class="milestones-list">
            <div
              v-for="milestone in settings.milestones"
              :key="milestone.referrals_required"
              class="milestone"
              :class="{ achieved: isMilestoneAchieved(milestone.referrals_required) }"
            >
              <div class="milestone__badge">
                <v-icon :name="getMilestoneIcon(milestone.badge_icon)" scale="0.9" />
              </div>
              <div class="milestone__info">
                <span class="milestone__name">{{ milestone.badge_name }}</span>
                <span class="milestone__req">{{ milestone.referrals_required }} referrals</span>
              </div>
              <div class="milestone__reward">+{{ milestone.reward_value }}</div>
              <div class="milestone__status">
                <v-icon :name="isMilestoneAchieved(milestone.referrals_required) ? 'hi-check-circle' : 'hi-lock-closed'" scale="0.85" />
              </div>
            </div>
          </div>
          <div v-if="stats?.next_milestone" class="milestone-progress">
            <div class="milestone-progress__text">
              {{ stats.total_signups }} / {{ stats.next_milestone.referrals_required }} to next milestone
            </div>
            <div class="milestone-progress__bar">
              <div
                class="milestone-progress__fill"
                :style="{ width: `${Math.min(100, (stats.total_signups / stats.next_milestone.referrals_required) * 100)}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Recent Referrals Card -->
        <div class="bento-card bento-card--referrals">
          <div class="card-header">
            <div class="card-icon card-icon--referrals">
              <v-icon name="hi-users" scale="1.1" />
            </div>
            <div class="card-title-group">
              <h3>Recent Referrals</h3>
              <p>Friends who joined using your link</p>
            </div>
          </div>
          <div v-if="stats?.referrals?.length" class="referrals-list">
            <div
              v-for="referral in stats.referrals.slice(0, 5)"
              :key="referral.referee?._id"
              class="referral-item"
            >
              <div class="referral-item__avatar">
                <img
                  v-if="referral.referee?.profile?.profile_image"
                  :src="referral.referee.profile.profile_image"
                  :alt="getRefereeName(referral)"
                />
                <div v-else class="avatar-placeholder">{{ getInitials(referral) }}</div>
              </div>
              <div class="referral-item__info">
                <span class="referral-item__name">{{ getRefereeName(referral) }}</span>
                <span class="referral-item__date">{{ formatDate(referral.date_referred) }}</span>
              </div>
              <div class="referral-item__status" :class="referral.status">
                {{ referral.status }}
              </div>
            </div>
          </div>
          <div v-else class="empty-referrals">
            <div class="empty-referrals__icon">
              <v-icon name="hi-user-group" scale="2" />
            </div>
            <h4>No referrals yet</h4>
            <p>Start sharing your link to see your referrals here!</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="showToast" class="toast">
        <v-icon name="hi-check-circle" scale="1" />
        <span>{{ message }}</span>
      </div>
    </Transition>
  </div>
</template>

<script>
import axios from "axios";
import { mapGetters } from "vuex";

export default {
  name: "ReferralsRewards",

  emits: ["openSideNav"],

  data() {
    return {
      message: "",
      showToast: false,
      linkCopied: false,
      stats: null,
      settings: null,
      shareMessages: null,
      loading: true,
    };
  },

  computed: {
    ...mapGetters({
      referrals: "referral",
      user: "user",
    }),

    refCode() {
      return this.referrals?.referral_code || "";
    },

    referralLink() {
      return `https://rapidcapsule.com/r/${this.refCode}`;
    },
  },

  async mounted() {
    await this.fetchData();
  },

  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const [statsRes, messagesRes, settingsRes] = await Promise.all([
          axios.get("referrals/stats"),
          axios.get("referrals/share-messages"),
          axios.get("referrals/settings"),
        ]);

        this.stats = statsRes.data.data;
        this.shareMessages = messagesRes.data.data;
        this.settings = settingsRes.data.data;
      } catch (error) {
        console.error("Error fetching referral data:", error);
      } finally {
        this.loading = false;
      }
    },

    async share(platform) {
      const link = this.shareMessages?.referral_link || this.referralLink;
      const messages = this.shareMessages?.messages || {};

      try {
        await axios.post("referrals/track-share", { platform });
        if (this.stats?.shares_by_platform) {
          this.stats.shares_by_platform[platform] = (this.stats.shares_by_platform[platform] || 0) + 1;
          this.stats.total_shares = (this.stats.total_shares || 0) + 1;
        }
      } catch (error) {
        console.error("Error tracking share:", error);
      }

      const linkWithSource = `${link}?src=${platform.substring(0, 2)}`;

      switch (platform) {
        case "whatsapp": {
          const waMessage = messages.whatsapp || `Check out Rapid Capsule! ${linkWithSource}`;
          window.open(`https://api.whatsapp.com/send/?text=${encodeURIComponent(waMessage.replace(link, linkWithSource))}`);
          break;
        }
        case "twitter": {
          const twMessage = messages.twitter || `Check out Rapid Capsule! ${linkWithSource}`;
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(twMessage.replace(link, linkWithSource))}`);
          break;
        }
        case "facebook": {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(linkWithSource)}&quote=${encodeURIComponent(messages.facebook || '')}`);
          break;
        }
        case "linkedin": {
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkWithSource)}`);
          break;
        }
        case "email": {
          const subject = encodeURIComponent(messages.email_subject || "Check out Rapid Capsule!");
          const body = encodeURIComponent((messages.email_body || `Check out this amazing health platform: ${link}`).replace(link, linkWithSource));
          window.open(`mailto:?subject=${subject}&body=${body}`);
          break;
        }
        case "sms": {
          const smsMessage = messages.sms || `Check out Rapid Capsule! ${linkWithSource}`;
          window.open(`sms:?body=${encodeURIComponent(smsMessage.replace(link, linkWithSource))}`);
          break;
        }
      }
    },

    async copyLink() {
      const link = `${this.referralLink}?src=copy`;
      try {
        await navigator.clipboard.writeText(link);
        this.linkCopied = true;
        this.message = "Referral link copied to clipboard!";
        this.showToast = true;

        try {
          await axios.post("referrals/track-share", { platform: "copy" });
          if (this.stats?.shares_by_platform) {
            this.stats.shares_by_platform.copy = (this.stats.shares_by_platform.copy || 0) + 1;
            this.stats.total_shares = (this.stats.total_shares || 0) + 1;
          }
        } catch (error) {
          console.error("Error tracking copy:", error);
        }

        setTimeout(() => {
          this.showToast = false;
          this.linkCopied = false;
        }, 3000);
      } catch (error) {
        this.message = "Failed to copy link";
        this.showToast = true;
        setTimeout(() => {
          this.showToast = false;
        }, 3000);
      }
    },

    isMilestoneAchieved(referralsRequired) {
      return this.stats?.milestones_achieved?.includes(referralsRequired) ||
        (this.stats?.total_signups >= referralsRequired);
    },

    getMilestoneIcon(icon) {
      const iconMap = {
        star: "hi-star",
        trophy: "gi-trophy",
        crown: "gi-crown",
        shield: "hi-shield-check",
      };
      return iconMap[icon] || "hi-star";
    },

    getRefereeName(referral) {
      if (!referral.referee?.profile) return "Anonymous";
      const { first_name, last_name } = referral.referee.profile;
      return `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous";
    },

    getInitials(referral) {
      if (!referral.referee?.profile) return "?";
      const { first_name, last_name } = referral.referee.profile;
      return `${(first_name || "")[0] || ""}${(last_name || "")[0] || ""}`.toUpperCase() || "?";
    },

    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;

      return date.toLocaleDateString("en-NG", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
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
$violet: #8B5CF6;
$violet-light: #EDE9FE;

// Page Layout
.referrals-page {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: $bg;
  min-height: 100vh;
  overflow-x: hidden;
  width: 100%;
  position: relative;
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  padding: 1rem;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  @media (max-width: 768px) {
    display: flex;
  }

  .menu-btn,
  .notification-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $slate;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.08);
    }
  }

  .header-logo img {
    height: 32px;
    width: auto;
  }
}

.page-content {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2rem 100px;
  box-sizing: border-box;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1rem 1rem 100px;
  }
}

// ============================================
// HERO SECTION
// ============================================
.hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  padding: 32px 40px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 24px;
  position: relative;
  overflow: visible;
  margin-bottom: 24px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  z-index: 10;
  isolation: isolate;
  transform: translateZ(0);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px;
    gap: 0;
    text-align: center;
    border-radius: 20px;
    margin-bottom: 20px;
  }
}

.hero__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 2;
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
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
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
    br { display: none; }
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
  }
}

.hero__stats {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  width: fit-content;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-around;
    gap: 0;
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

    &--success { color: $emerald-light; }
    &--warning { color: $amber-light; }
  }

  &__label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }

  &__divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);

    @media (max-width: 768px) {
      height: 28px;
    }
  }
}

.hero__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  @media (max-width: 768px) {
    display: none;
  }
}

// Orb Animation
.referral-orb {
  position: relative;
  width: 180px;
  height: 180px;
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
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;

  svg {
    width: 36px;
    height: 36px;
    color: white;
  }
}

.floating-icons {
  position: absolute;
  inset: -20px;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;

  svg {
    width: 18px;
    height: 18px;
    color: white;
  }

  &--1 { top: 0; right: 0; animation-delay: 0s; }
  &--2 { bottom: 10%; right: -10%; animation-delay: 1s; }
  &--3 { bottom: 0; left: 0; animation-delay: 2s; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid $sky-light;
    border-top-color: $sky;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  p {
    font-size: 14px;
    color: $gray;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ============================================
// BENTO GRID
// ============================================
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  position: relative;
  z-index: 1;

  @media (max-width: 1024px) {
    gap: 16px;
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.bento-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;
  }

  // Link Card - Full Width
  &--link {
    grid-column: span 12;
  }

  // Share Card
  &--share {
    grid-column: span 7;

    @media (max-width: 1024px) {
      grid-column: span 12;
    }
  }

  // Stats Card
  &--stats {
    grid-column: span 5;

    @media (max-width: 1024px) {
      grid-column: span 12;
    }
  }

  // How It Works Card
  &--how {
    grid-column: span 6;

    @media (max-width: 1024px) {
      grid-column: span 12;
    }
  }

  // Milestones Card
  &--milestones {
    grid-column: span 6;

    @media (max-width: 1024px) {
      grid-column: span 12;
    }
  }

  // Referrals Card
  &--referrals {
    grid-column: span 12;
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    gap: 12px;
    margin-bottom: 16px;
  }
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }

  &--link { background: linear-gradient(135deg, $sky, $sky-dark); }
  &--share { background: linear-gradient(135deg, $emerald, darken($emerald, 10%)); }
  &--stats { background: linear-gradient(135deg, $violet, darken($violet, 10%)); }
  &--how { background: linear-gradient(135deg, $amber, darken($amber, 10%)); }
  &--milestones { background: linear-gradient(135deg, #F97316, #EA580C); }
  &--referrals { background: linear-gradient(135deg, $rose, darken($rose, 10%)); }
}

.card-title-group {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 16px;
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

// Link Card Styles
.link-container {
  background: $bg;
  border-radius: 14px;
  padding: 16px;
}

.link-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 2px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 12px;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 10px;
  }

  .link-text {
    flex: 1;
    font-size: 14px;
    color: $slate;
    font-family: monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (max-width: 640px) {
      width: 100%;
      text-align: center;
      font-size: 12px;
    }
  }

  .copy-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    @media (max-width: 640px) {
      width: 100%;
      justify-content: center;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($sky, 0.35);
    }

    &.copied {
      background: linear-gradient(135deg, $emerald, darken($emerald, 10%));
    }
  }
}

.code-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  .code-label {
    font-size: 13px;
    color: $gray;
  }

  .code-value {
    font-size: 18px;
    font-weight: 700;
    color: $sky-dark;
    font-family: monospace;
    letter-spacing: 2px;
  }
}

// Share Grid
.share-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

.share-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: $bg;
  border: 2px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  @media (max-width: 768px) {
    padding: 14px 10px;
  }

  &:hover {
    background: white;
    border-color: $sky;
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba($sky, 0.15);
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 768px) {
      width: 40px;
      height: 40px;
    }

    img {
      width: 28px;
      height: 28px;
      object-fit: contain;

      @media (max-width: 768px) {
        width: 24px;
        height: 24px;
      }
    }

    &--whatsapp { background: rgba(37, 211, 102, 0.1); }
    &--twitter { background: rgba(29, 161, 242, 0.1); }
    &--facebook { background: rgba(24, 119, 242, 0.1); }
    &--linkedin { background: rgba(0, 119, 181, 0.1); }
    &--email { background: rgba(100, 116, 139, 0.1); color: $gray; }
    &--sms { background: rgba($sky, 0.1); color: $sky-dark; }
  }

  &__label {
    font-size: 13px;
    font-weight: 500;
    color: $slate;

    @media (max-width: 768px) {
      font-size: 12px;
    }
  }

  &__badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: $sky;
    color: white;
    font-size: 10px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 10px;
  }
}

// Stats Grid
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: $bg;
  border-radius: 12px;

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--clicks { background: rgba($violet, 0.1); color: $violet; }
    &--shares { background: rgba($emerald, 0.1); color: $emerald; }
    &--signups { background: rgba($amber, 0.1); color: $amber; }
    &--credits { background: rgba($sky, 0.1); color: $sky-dark; }
  }

  &__content {
    display: flex;
    flex-direction: column;
  }

  &__value {
    font-size: 20px;
    font-weight: 700;
    color: $navy;
    line-height: 1;
  }

  &__label {
    font-size: 11px;
    color: $gray;
    margin-top: 4px;
  }
}

// Steps Container
.steps-container {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 14px;

  &__number {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
  }

  &__content {
    padding-top: 4px;

    h4 {
      font-size: 14px;
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
}

.step-connector {
  width: 2px;
  height: 20px;
  background: linear-gradient(to bottom, $sky-light, $sky);
  margin-left: 17px;
}

// Milestones
.milestones-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.milestone {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: $bg;
  border-radius: 12px;
  transition: all 0.2s;

  &.achieved {
    background: rgba($emerald, 0.08);

    .milestone__badge {
      background: $emerald;
    }

    .milestone__status {
      color: $emerald;
    }
  }

  &__badge {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: $light-gray;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;

    .milestone__name {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: $navy;
    }

    .milestone__req {
      font-size: 12px;
      color: $gray;
    }
  }

  &__reward {
    font-size: 13px;
    font-weight: 600;
    color: $sky-dark;
    white-space: nowrap;
  }

  &__status {
    color: $light-gray;
    flex-shrink: 0;
  }
}

.milestone-progress {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  &__text {
    font-size: 13px;
    color: $gray;
    margin-bottom: 8px;
  }

  &__bar {
    height: 8px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 4px;
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    background: linear-gradient(90deg, $sky, $sky-dark);
    border-radius: 4px;
    transition: width 0.3s ease;
  }
}

// Referrals List
.referrals-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.referral-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: $bg;
  border-radius: 12px;

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, $sky, $sky-dark);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;

    .referral-item__name {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: $navy;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .referral-item__date {
      font-size: 12px;
      color: $gray;
    }
  }

  &__status {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    text-transform: capitalize;

    &.pending {
      background: $amber-light;
      color: darken($amber, 10%);
    }

    &.completed, &.rewarded {
      background: $emerald-light;
      color: darken($emerald, 10%);
    }
  }
}

.empty-referrals {
  text-align: center;
  padding: 40px 20px;

  &__icon {
    color: $light-gray;
    margin-bottom: 16px;
  }

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: $slate;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: $gray;
    margin: 0;
  }
}

// Toast
.toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: $navy;
  color: white;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1000;

  svg {
    color: $emerald;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>
