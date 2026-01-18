<script setup>
import { useTheme } from 'vuetify'
import navItems from '@/navigation/vertical'
import { useThemeConfig } from '@core/composable/useThemeConfig'

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import NavBarNotifications from '@/layouts/components/NavBarNotifications.vue'
import NavBarGlobalSearch from '@/layouts/components/NavBarGlobalSearch.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import Breadcrumbs from '@/components/Breadcrumbs.vue'

// @layouts plugin
import { VerticalNavLayout } from '@layouts'

const { appRouteTransition, isLessThanOverlayNavBreakpoint, isVerticalNavCollapsed } = useThemeConfig()
const { width: windowWidth } = useWindowSize()

// ℹ️ Provide animation name for vertical nav collapse icon.
const verticalNavHeaderActionAnimationName = ref(null)

watch(isVerticalNavCollapsed, val => {
  verticalNavHeaderActionAnimationName.value = val ? 'rotate-180' : 'rotate-back-180'
})

const actionArrowInitialRotation = isVerticalNavCollapsed.value ? '180deg' : '0deg'
const { global } = useTheme()
const globalThemeBackground = computed(() => global.current.value.colors.background)
</script>

<template>
  <VerticalNavLayout
    :nav-items="navItems"
  >
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <IconBtn
          v-if="isLessThanOverlayNavBreakpoint(windowWidth)"
          class="ms-n3"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon icon="bx-menu" />
        </IconBtn>

        <NavbarThemeSwitcher />

        <NavBarGlobalSearch class="nav-global-search" />

        <VSpacer />

        <NavBarNotifications class="nav-notif" />

        <UserProfile />
      </div>
    </template>

    <!-- 👉 Breadcrumbs -->
    <div class="breadcrumbs-wrapper">
      <Breadcrumbs />
    </div>

    <!-- 👉 Pages -->
    <RouterView v-slot="{ Component }">
      <Transition
        :name="appRouteTransition"
        mode="out-in"
      >
        <Component :is="Component" />
      </Transition>
    </RouterView>

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <!-- <TheCustomizer /> -->
  </VerticalNavLayout>
</template>

<style lang="scss">
@use "@layouts/styles/mixins" as layoutsMixins;

.breadcrumbs-wrapper {
  padding: 16px 24px 0;
  background-color: rgb(var(--v-theme-surface));
}

.nav-global-search {
  margin-left: 35px;

  @media  screen and (max-width: 1000px) {
    margin-left: 0;
  }
}

.nav-notif {
  margin-right: 35px;

  @media  screen and (max-width: 1000px) {
    margin-right: 0;
  }
}

.layout-vertical-nav {
  // ℹ️ Nav header circle on the right edge
  .nav-header {
    position: relative;
    overflow: visible !important;

    &::after {
      --diameter: 36px;

      position: absolute;
      z-index: -1;
      border-radius: 100%;
      aspect-ratio: 1;
      /* stylelint-disable-next-line value-keyword-case */
      background: var(--app-header-container-bg, v-bind(globalThemeBackground));
      content: "";
      inline-size: var(--diameter);
      inset-block-start: calc(50% - var(--diameter) / 2);
      inset-inline-end: -18px;

      @at-root {
        // Change background color of nav header circle when vertical nav is in overlay mode
        .layout-overlay-nav {
          --app-header-container-bg: rgb(var(--v-theme-surface));

          // ℹ️ Only transition in overlay mode
          .nav-header::after {
            transition: opacity 0.2s ease-in-out;
          }
        }

        .layout-vertical-nav-collapsed .layout-vertical-nav:not(.hovered) .nav-header::after {
          opacity: 0;
        }
      }
    }
  }

  // Don't show nav header circle when vertical nav is in overlay mode and not visible
  &.overlay-nav:not(.visible) .nav-header::after {
    opacity: 0;
  }
}

// ℹ️ Nav header action buttons styles
@keyframes rotate-180 {
  from {
    transform: rotate(0deg) scaleX(var(--app-header-actions-scale-x));
  }

  to {
    transform: rotate(180deg) scaleX(var(--app-header-actions-scale-x));
  }
}

@keyframes rotate-back-180 {
  from {
    transform: rotate(180deg) scaleX(var(--app-header-actions-scale-x));
  }

  to {
    transform: rotate(0deg) scaleX(var(--app-header-actions-scale-x));
  }
}

.layout-vertical-nav {
  .nav-header {
    .header-action {
      // ℹ️ We need to create this CSS variable for reusing value in animation
      --app-header-actions-scale-x: 1;

      position: absolute;
      border-radius: 100%;
      animation-duration: 0s;
      animation-duration: 0.35s;
      animation-fill-mode: forwards;
      animation-name: v-bind(verticalNavHeaderActionAnimationName);
      background: rgb(var(--v-global-theme-primary));
      color: white;
      inset-inline-end: 0;
      inset-inline-end: -11px;
      /* stylelint-disable-next-line value-keyword-case */
      transform: rotate(v-bind(actionArrowInitialRotation)) scaleX(var(--app-header-actions-scale-x));
      transition: opacity 0.2s ease-in-out;

      @include layoutsMixins.rtl {
        --app-header-actions-scale-x: -1;
      }

      @at-root {
        .layout-nav-type-vertical.layout-overlay-nav .layout-vertical-nav:not(.visible) .nav-header .header-action {
          opacity: 0;
        }
      }
    }
  }
}
</style>
