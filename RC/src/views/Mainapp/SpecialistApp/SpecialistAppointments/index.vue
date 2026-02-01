<template>
  <div class="sa-layout" style="position: fixed !important; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100vh; z-index: 9999; background: #F8FAFC;">
    <!-- Desktop Sidebar -->
    <aside class="sa-sidebar desktop-only">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <v-icon name="hi-calendar" scale="1.2" />
          </div>
          <span class="logo-text">Appointments</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActiveRoute(item.name) }"
        >
          <v-icon :name="item.icon" scale="1" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <router-link to="/app/specialist/specialist-dashboard" class="back-link">
          <v-icon name="hi-arrow-left" scale="0.9" />
          <span>Back to Dashboard</span>
        </router-link>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="sa-main">
      <!-- Mobile Header -->
      <header class="mobile-header">
        <button class="menu-btn" @click="showMobileNav = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="mobile-logo-section">
          <div class="logo-img">
            <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
          </div>
          <div class="logo-text">
            <span class="logo-title">Rapid Capsule</span>
            <span class="logo-subtitle">Specialist</span>
          </div>
        </div>
        <div class="mobile-avatar" @click="goToProfile">
          <img
            v-if="profileImage"
            :src="profileImage"
            :alt="userName"
          />
          <div v-else class="avatar-placeholder">
            <v-icon name="hi-user" scale="0.7" />
          </div>
        </div>
      </header>

      <!-- Router View -->
      <div class="sa-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" class="router-component" />
          </transition>
        </router-view>
      </div>
    </main>

    <!-- Mobile Navigation Drawer -->
    <div v-if="showMobileNav" class="mobile-nav-overlay" @click="showMobileNav = false"></div>
    <aside class="mobile-nav" :class="{ open: showMobileNav }">
      <div class="mobile-nav-header">
        <div class="logo">
          <v-icon name="hi-calendar" scale="1" />
          <span>Appointments</span>
        </div>
        <button class="close-btn" @click="showMobileNav = false">
          <v-icon name="hi-x" scale="1.1" />
        </button>
      </div>

      <nav class="mobile-nav-items">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.to"
          class="mobile-nav-item"
          :class="{ active: isActiveRoute(item.name) }"
          @click="showMobileNav = false"
        >
          <v-icon :name="item.icon" scale="1" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="mobile-nav-footer">
        <router-link to="/app/specialist/specialist-dashboard" class="back-link" @click="showMobileNav = false">
          <v-icon name="hi-arrow-left" scale="0.9" />
          <span>Back to Dashboard</span>
        </router-link>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

const route = useRoute();
const router = useRouter();
const store = useStore();

const showMobileNav = ref(false);

// User profile data
const userProfile = computed(() => store.getters['userprofile']);

const profileImage = computed(() => {
  const profile = userProfile.value?.profile;
  return profile?.profile_image || profile?.profile_photo || null;
});

const userName = computed(() => {
  const profile = userProfile.value?.profile;
  if (profile?.first_name) {
    return `${profile.first_name} ${profile.last_name || ''}`.trim();
  }
  return 'Specialist';
});

function goToProfile() {
  router.push('/app/specialist/profile');
}

const navItems = [
  {
    name: 'SpecialistAppointmentsDashboard',
    to: { name: 'SpecialistAppointmentsDashboard' },
    label: 'Dashboard',
    icon: 'hi-home',
  },
  {
    name: 'SpecialistAppointmentsList',
    to: { name: 'SpecialistAppointmentsList' },
    label: 'All Appointments',
    icon: 'hi-clipboard-list',
  },
  {
    name: 'SpecialistAppointmentsCreate',
    to: { name: 'SpecialistAppointmentsCreate' },
    label: 'Book New',
    icon: 'hi-plus-circle',
  },
  {
    name: 'SpecialistAppointmentsAnalytics',
    to: { name: 'SpecialistAppointmentsAnalytics' },
    label: 'Analytics',
    icon: 'hi-chart-bar',
  },
  {
    name: 'SpecialistAppointmentsSettings',
    to: { name: 'SpecialistAppointmentsSettings' },
    label: 'Practice Settings',
    icon: 'hi-cog',
  },
];

const currentPageTitle = computed(() => {
  const item = navItems.find(i => i.name === route.name);
  return item?.label || 'Appointments';
});

function isActiveRoute(routeName) {
  return route.name === routeName;
}

function goToCreate() {
  router.push({ name: 'SpecialistAppointmentsCreate' });
}
</script>

<style scoped lang="scss">
.sa-layout {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  display: flex;
  width: 100vw !important;
  height: 100vh !important;
  background: #F8FAFC;
  z-index: 9999 !important;
}

// Sidebar
.sa-sidebar {
  width: 260px;
  background: #FFFFFF;
  border-right: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 50;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid #E2E8F0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1A365D;
  font-family: 'Poppins', sans-serif;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  color: #64748B;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #F1F5F9;
    color: #334155;
  }

  &.active {
    background: #E1F5FE;
    color: #0288D1;

    svg {
      color: #4FC3F7;
    }
  }
}

.nav-badge {
  margin-left: auto;
  padding: 0.125rem 0.5rem;
  background: #FF9800;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 1rem;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #E2E8F0;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  color: #64748B;
  text-decoration: none;
  font-size: 0.8125rem;
  transition: color 0.2s;

  &:hover {
    color: #334155;
  }
}

// Main Content
.sa-main {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  align-items: center;
}

.sa-content {
  flex: 1;
  padding: 1.25rem 2rem;
  overflow-y: auto;
  overflow-x: hidden;
  width: 100%;
  max-width: 1400px;
  box-sizing: border-box;

  :deep(.router-component),
  :deep(> *) {
    width: 100%;
    min-height: 100%;
  }
}

// Mobile Header - Hidden on desktop by default
.mobile-header {
  display: none !important;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #E2E8F0;
  position: sticky;
  top: 0;
  z-index: 40;
  width: 100%;
  box-sizing: border-box;
}

.mobile-avatar {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: #E2E8F0;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94A3B8;
  }
}

.mobile-logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex: 1;

  .logo-img {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  .logo-text {
    display: flex;
    flex-direction: column;
  }

  .logo-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1A365D;
    font-family: 'Poppins', system-ui, sans-serif;
    letter-spacing: -0.025em;
    line-height: 1;
  }

  .logo-subtitle {
    font-size: 0.5rem;
    font-weight: 500;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
}

.menu-btn {
  width: 40px;
  height: 40px;
  min-width: 40px;
  flex-shrink: 0;
  border: none;
  background: none;
  color: #1A365D;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    background: #F1F5F9;
  }
}

// Mobile Navigation
.mobile-nav-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.mobile-nav {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: white;
  z-index: 101;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  flex-direction: column;

  &.open {
    transform: translateX(0);
  }
}

.mobile-nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #E2E8F0;

  .logo {
    gap: 0.5rem;

    svg {
      color: #4FC3F7;
    }

    span {
      font-weight: 600;
      color: #1A365D;
    }
  }
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: none;
  color: #64748B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;

  &:hover {
    background: #F1F5F9;
  }
}

.mobile-nav-items {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  color: #64748B;
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 500;

  &.active {
    background: #E1F5FE;
    color: #0288D1;
  }
}

.mobile-nav-footer {
  padding: 1rem;
  border-top: 1px solid #E2E8F0;
}

// Desktop only
.desktop-only {
  @media (max-width: 1023px) {
    display: none !important;
  }
}

// Responsive
@media (max-width: 1023px) {
  .sa-main {
    margin-left: 0;
  }

  .mobile-header {
    display: flex !important;
    justify-content: space-between !important;
    align-items: center !important;
    width: 100% !important;
  }

  .mobile-nav-overlay {
    display: block;
  }

  .mobile-nav {
    display: flex;
  }

  .sa-content {
    padding: 1rem;
  }
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
