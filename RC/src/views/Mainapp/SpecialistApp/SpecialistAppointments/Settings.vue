<template>
  <div class="sa-settings">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero__content">
        <div class="hero__badge">
          <span class="hero__badge-dot"></span>
          <v-icon name="hi-cog" scale="0.7" />
          <span>Practice Settings</span>
        </div>
        <h1 class="hero__title">
          Practice
          <span class="hero__title-accent">Settings</span>
        </h1>
        <p class="hero__subtitle">Manage your availability, rates, and preferences.</p>
      </div>

      <div class="hero__visual">
        <div class="dashboard-orb">
          <div class="orb-ring orb-ring--1"></div>
          <div class="orb-ring orb-ring--2"></div>
          <div class="orb-ring orb-ring--3"></div>
          <div class="orb-core">
            <v-icon name="hi-cog" scale="2" />
          </div>
        </div>
        <div class="floating-icon floating-icon--1">
          <v-icon name="hi-clock" scale="0.9" />
        </div>
        <div class="floating-icon floating-icon--2">
          <v-icon name="hi-currency-dollar" scale="0.9" />
        </div>
        <div class="floating-icon floating-icon--3">
          <v-icon name="hi-bell" scale="0.9" />
        </div>
      </div>
    </section>

    <!-- Settings Grid -->
    <div class="settings-grid">
      <div class="bento-card settings-card" @click="openSettings('availability')">
        <div class="card-icon card-icon--sky">
          <v-icon name="hi-clock" scale="1.3" />
        </div>
        <div class="card-body">
          <h3>Availability</h3>
          <p>Set your working hours and available time slots</p>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1" />
        </div>
      </div>

      <div class="bento-card settings-card" @click="openSettings('rates')">
        <div class="card-icon card-icon--emerald">
          <v-icon name="hi-currency-dollar" scale="1.3" />
        </div>
        <div class="card-body">
          <h3>Consultation Rates</h3>
          <p>Manage your consultation fees and pricing</p>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1" />
        </div>
      </div>

      <div class="bento-card settings-card" @click="openSettings('profile')">
        <div class="card-icon card-icon--rose">
          <v-icon name="hi-user-circle" scale="1.3" />
        </div>
        <div class="card-body">
          <h3>Professional Profile</h3>
          <p>Update your bio, specialties, and qualifications</p>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1" />
        </div>
      </div>

      <div class="bento-card settings-card" @click="openSettings('notifications')">
        <div class="card-icon card-icon--amber">
          <v-icon name="hi-bell" scale="1.3" />
        </div>
        <div class="card-body">
          <h3>Notifications</h3>
          <p>Configure appointment reminders and alerts</p>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1" />
        </div>
      </div>

      <div class="bento-card settings-card" @click="openSettings('video')">
        <div class="card-icon card-icon--violet">
          <v-icon name="hi-video-camera" scale="1.3" />
        </div>
        <div class="card-body">
          <h3>Video Consultation</h3>
          <p>Zoom integration and meeting preferences</p>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1" />
        </div>
      </div>

      <div class="bento-card settings-card" @click="openSettings('calendar')">
        <div class="card-icon card-icon--pink">
          <v-icon name="hi-calendar" scale="1.3" />
        </div>
        <div class="card-body">
          <h3>Calendar Sync</h3>
          <p>Sync with Google Calendar or Outlook</p>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1" />
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bento-card quick-actions">
      <div class="quick-actions__header">
        <div class="card-icon card-icon--gray">
          <v-icon name="hi-lightning-bolt" scale="0.9" />
        </div>
        <h3>Quick Actions</h3>
      </div>
      <div class="quick-actions__row">
        <router-link to="/app/specialist/onboarding/dashboard" class="action-link">
          <v-icon name="hi-cog" scale="0.85" />
          <span>Full Setup Wizard</span>
          <v-icon name="hi-external-link" scale="0.7" class="action-link__arrow" />
        </router-link>
        <router-link to="/app/specialist/profile" class="action-link">
          <v-icon name="hi-user" scale="0.85" />
          <span>View Profile</span>
          <v-icon name="hi-external-link" scale="0.7" class="action-link__arrow" />
        </router-link>
      </div>
    </div>

    <!-- Settings Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="settings-modal-overlay" @click.self="closeModal">
        <div class="settings-modal">
          <div class="modal-header">
            <h2>{{ modalTitle }}</h2>
            <button class="close-btn" @click="closeModal">
              <v-icon name="hi-x" scale="1.2" />
            </button>
          </div>
          <div class="modal-body">
            <component :is="currentSettingsComponent" @close="closeModal" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, shallowRef, defineAsyncComponent } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const showModal = ref(false);
const modalTitle = ref('');
const currentSettingsComponent = shallowRef(null);

// Settings components - lazy loaded
const AvailabilitySettings = defineAsyncComponent(() =>
  import('@/views/Mainapp/SpecialistApp/Onboarding/AvailabilitySetup.vue')
);
const RateSettings = defineAsyncComponent(() =>
  import('@/views/Mainapp/SpecialistApp/Onboarding/RateCards.vue')
);

function openSettings(type) {
  switch (type) {
    case 'availability':
      // Navigate to onboarding availability page
      router.push({ name: 'SpecialistAvailability' });
      break;
    case 'rates':
      // Navigate to onboarding rates page
      router.push({ name: 'SpecialistRates' });
      break;
    case 'profile':
      router.push({ name: 'SpecialistProfileConfig' });
      break;
    case 'notifications':
      router.push({ name: 'SpecialistSecurity' });
      break;
    case 'video':
      router.push({ name: 'SpecialistSecurity' });
      break;
    case 'calendar':
      router.push({ name: 'SpecialistAvailability' });
      break;
    default:
      router.push({ name: 'SpecialistSetupDashboard' });
  }
}

function closeModal() {
  showModal.value = false;
  currentSettingsComponent.value = null;
}
</script>

<style scoped lang="scss">
// ─── Design Tokens ─────────────────────────────────────
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

// ─── Page Container ────────────────────────────────────
.sa-settings {
  max-width: 1000px;
  margin: 0 auto;
}

// ─── Hero Section ──────────────────────────────────────
.hero {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 300px;
  align-items: center;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  padding: 44px 48px;
  margin-bottom: 24px;
  overflow: hidden;
  min-height: 280px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 4px 20px rgba(0, 0, 0, 0.1);
}

.hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  padding: 6px 16px;
  width: fit-content;
  color: white;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.hero__badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: $emerald;
  animation: pulse 2s ease-in-out infinite;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1.5px solid rgba($emerald, 0.5);
    animation: pulse-ring 2s ease-in-out infinite;
  }
}

.hero__title {
  font-family: 'Poppins', system-ui, sans-serif;
  font-size: 2.75rem;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin: 0;
}

.hero__title-accent {
  display: block;
  background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-size: 1.0625rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  max-width: 400px;
  margin: 0;
}

// ─── Hero Visual (Orb) ────────────────────────────────
.hero__visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 220px;
}

.dashboard-orb {
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
  border: 1.5px solid rgba(255, 255, 255, 0.15);

  &--1 {
    width: 180px;
    height: 180px;
    animation: spin-slow 20s linear infinite;
    border-style: dashed;
  }

  &--2 {
    width: 140px;
    height: 140px;
    animation: spin-slow 15s linear infinite reverse;
    border-color: rgba(255, 255, 255, 0.1);
  }

  &--3 {
    width: 100px;
    height: 100px;
    animation: spin-slow 10s linear infinite;
    border-color: rgba(255, 255, 255, 0.2);
    border-style: dotted;
  }
}

.orb-core {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 2;
  animation: pulse-glow 3s ease-in-out infinite;
}

.floating-icon {
  position: absolute;
  width: 38px;
  height: 38px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: float 6s ease-in-out infinite;

  &--1 {
    top: 8px;
    right: 30px;
    animation-delay: 0s;
  }

  &--2 {
    bottom: 15px;
    left: 15px;
    animation-delay: -2s;
  }

  &--3 {
    top: 45%;
    right: 5px;
    animation-delay: -4s;
  }
}

// ─── Animations ────────────────────────────────────────
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.2); }
  50% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// ─── Bento Card Base ───────────────────────────────────
.bento-card {
  @include glass-card;
  border-radius: 20px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

// ─── Settings Grid ─────────────────────────────────────
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.settings-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 22px 24px;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  &:active {
    transform: translateY(-1px);
  }
}

.card-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--sky {
    background: $sky-light;
    color: $sky-dark;
  }

  &--emerald {
    background: $emerald-light;
    color: $emerald;
  }

  &--rose {
    background: $rose-light;
    color: $rose;
  }

  &--amber {
    background: $amber-light;
    color: $amber;
  }

  &--violet {
    background: $violet-light;
    color: $violet;
  }

  &--pink {
    background: #FCE7F3;
    color: #DB2777;
  }

  &--gray {
    background: #F1F5F9;
    color: $gray;
  }
}

.card-body {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: $navy;
    margin: 0 0 4px;
    font-family: 'Poppins', system-ui, sans-serif;
  }

  p {
    font-size: 0.8125rem;
    color: $gray;
    margin: 0;
    line-height: 1.4;
  }
}

.card-arrow {
  color: $light-gray;
  flex-shrink: 0;
  transition: transform 0.2s, color 0.2s;

  .settings-card:hover & {
    color: $sky;
    transform: translateX(3px);
  }
}

// ─── Quick Actions ─────────────────────────────────────
.quick-actions {
  padding: 24px;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    h3 {
      font-size: 0.9375rem;
      font-weight: 700;
      color: $navy;
      margin: 0;
      font-family: 'Poppins', system-ui, sans-serif;
    }

    .card-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
    }
  }

  &__row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}

.action-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  color: $slate;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;

  svg {
    color: $sky;
  }

  &__arrow {
    color: $light-gray !important;
    margin-left: 4px;
  }

  &:hover {
    border-color: $sky;
    color: $sky-dark;
    background: rgba(255, 255, 255, 0.95);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
}

// ─── Modal (unchanged) ─────────────────────────────────
.settings-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.settings-modal {
  background: #FFFFFF;
  border-radius: 1rem;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #E2E8F0;

  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: $navy;
    margin: 0;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F5F9;
    border: none;
    border-radius: 8px;
    color: $gray;
    cursor: pointer;

    &:hover {
      background: #E2E8F0;
      color: $navy;
    }
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

// ─── Responsive ────────────────────────────────────────
@media (max-width: 1023px) {
  .hero {
    grid-template-columns: 1fr;
    padding: 32px 24px;
    min-height: auto;
    border-radius: 20px;
  }

  .hero__visual {
    display: none;
  }

  .hero__title {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .settings-card {
    padding: 16px 18px;
  }

  .card-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
  }

  .card-body p {
    display: none;
  }

  .quick-actions {
    padding: 18px;

    &__row {
      flex-direction: column;
    }
  }

  .action-link {
    justify-content: center;
  }

  .settings-modal {
    max-height: 100vh;
    height: 100%;
    border-radius: 0;
  }
}

@media (max-width: 480px) {
  .hero {
    padding: 24px 20px;
    border-radius: 16px;
    margin-bottom: 16px;
  }

  .hero__title {
    font-size: 1.625rem;
  }

  .hero__subtitle {
    font-size: 0.9375rem;
  }

  .bento-card {
    border-radius: 16px;
  }
}
</style>
