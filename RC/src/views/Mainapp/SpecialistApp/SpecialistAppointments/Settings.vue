<template>
  <div class="sa-settings">
    <!-- Mobile Page Header -->
    <div class="mobile-page-header">
      <router-link to="/app/specialist/appointments-v2" class="back-btn">
        <v-icon name="hi-arrow-left" scale="1" />
      </router-link>
      <h1>Practice Settings</h1>
      <div class="header-spacer"></div>
    </div>

    <!-- Desktop Header -->
    <div class="settings-header desktop-header">
      <div class="header-left">
        <h1 class="page-title">Practice Settings</h1>
        <p class="page-subtitle">Manage your availability, rates, and preferences</p>
      </div>
    </div>

    <!-- Settings Grid -->
    <div class="settings-grid">
      <!-- Availability Card -->
      <div class="settings-card" @click="openSettings('availability')">
        <div class="card-icon availability">
          <v-icon name="hi-clock" scale="1.5" />
        </div>
        <div class="card-content">
          <h3>Availability</h3>
          <p>Set your working hours and available time slots</p>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1" />
        </div>
      </div>

      <!-- Rate Cards -->
      <div class="settings-card" @click="openSettings('rates')">
        <div class="card-icon rates">
          <v-icon name="hi-currency-dollar" scale="1.5" />
        </div>
        <div class="card-content">
          <h3>Consultation Rates</h3>
          <p>Manage your consultation fees and pricing</p>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1" />
        </div>
      </div>

      <!-- Profile Settings -->
      <div class="settings-card" @click="openSettings('profile')">
        <div class="card-icon profile">
          <v-icon name="hi-user-circle" scale="1.5" />
        </div>
        <div class="card-content">
          <h3>Professional Profile</h3>
          <p>Update your bio, specialties, and qualifications</p>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1" />
        </div>
      </div>

      <!-- Notifications -->
      <div class="settings-card" @click="openSettings('notifications')">
        <div class="card-icon notifications">
          <v-icon name="hi-bell" scale="1.5" />
        </div>
        <div class="card-content">
          <h3>Notifications</h3>
          <p>Configure appointment reminders and alerts</p>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1" />
        </div>
      </div>

      <!-- Video Settings -->
      <div class="settings-card" @click="openSettings('video')">
        <div class="card-icon video">
          <v-icon name="hi-video-camera" scale="1.5" />
        </div>
        <div class="card-content">
          <h3>Video Consultation</h3>
          <p>Zoom integration and meeting preferences</p>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1" />
        </div>
      </div>

      <!-- Calendar Sync -->
      <div class="settings-card" @click="openSettings('calendar')">
        <div class="card-icon calendar">
          <v-icon name="hi-calendar" scale="1.5" />
        </div>
        <div class="card-content">
          <h3>Calendar Sync</h3>
          <p>Sync with Google Calendar or Outlook</p>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1" />
        </div>
      </div>
    </div>

    <!-- Quick Links -->
    <div class="quick-links">
      <h3>Quick Actions</h3>
      <div class="links-row">
        <router-link to="/app/specialist/onboarding/dashboard" class="quick-link">
          <v-icon name="hi-cog" scale="0.9" />
          <span>Full Setup Wizard</span>
        </router-link>
        <router-link to="/app/specialist/profile" class="quick-link">
          <v-icon name="hi-user" scale="0.9" />
          <span>View Profile</span>
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
@import './styles/sa-variables';

.sa-settings {
  max-width: 1000px;
  margin: 0 auto;
}

// Mobile Page Header
.mobile-page-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid #E2E8F0;

  h1 {
    font-size: 1.125rem;
    font-weight: 600;
    color: $sa-navy;
    margin: 0;
  }

  .back-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F1F5F9;
    border-radius: 8px;
    color: $sa-navy;
    text-decoration: none;

    &:active {
      background: #E2E8F0;
    }
  }

  .header-spacer {
    width: 36px;
  }
}

// Desktop Header
.desktop-header {
  display: flex;
}

.settings-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: $sa-navy;
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: $sa-text-secondary;
  margin: 0.25rem 0 0;
}

// Settings Grid
.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.settings-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $sa-sky;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

.card-icon {
  width: 52px;
  height: 52px;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.availability {
    background: #DBEAFE;
    color: #2563EB;
  }

  &.rates {
    background: #D1FAE5;
    color: #059669;
  }

  &.profile {
    background: #FEE2E2;
    color: #DC2626;
  }

  &.notifications {
    background: #FEF3C7;
    color: #D97706;
  }

  &.video {
    background: #E0E7FF;
    color: #4F46E5;
  }

  &.calendar {
    background: #FCE7F3;
    color: #DB2777;
  }
}

.card-content {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: $sa-navy;
    margin: 0 0 0.25rem;
  }

  p {
    font-size: 0.8125rem;
    color: $sa-text-secondary;
    margin: 0;
    line-height: 1.4;
  }
}

.card-arrow {
  color: #CBD5E1;
  flex-shrink: 0;
}

// Quick Links
.quick-links {
  background: #F8FAFC;
  border-radius: 0.75rem;
  padding: 1.25rem;

  h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: $sa-text-secondary;
    margin: 0 0 1rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.links-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.quick-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  color: $sa-navy;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    border-color: $sa-sky;
    color: $sa-sky;
  }

  svg {
    color: $sa-sky;
  }
}

// Modal Styles
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
    color: $sa-navy;
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
    color: $sa-text-secondary;
    cursor: pointer;

    &:hover {
      background: #E2E8F0;
      color: $sa-navy;
    }
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

// Responsive
@media (max-width: 768px) {
  .desktop-header {
    display: none;
  }

  .mobile-page-header {
    display: flex;
  }

  .settings-grid {
    grid-template-columns: 1fr;
  }

  .settings-card {
    padding: 1rem;
  }

  .card-icon {
    width: 44px;
    height: 44px;
  }

  .card-content p {
    display: none;
  }

  .links-row {
    flex-direction: column;
  }

  .quick-link {
    justify-content: center;
  }

  .settings-modal {
    max-height: 100vh;
    height: 100%;
    border-radius: 0;
  }
}
</style>
