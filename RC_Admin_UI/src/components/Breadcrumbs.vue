<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// Define readable names for routes
const routeNames = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/patients': 'Patients',
  '/specialists': 'Specialists',
  '/appointments': 'Appointments',
  '/health-checkups': 'Health Checkups',
  '/lifeguard': 'Lifeguard',
  '/second-page': 'Second Page',
  // Pharmacy routes
  '/pharmacy': 'Pharmacy',
  '/pharmacy/pharmacies': 'Pharmacies',
  '/pharmacy/inventory': 'Inventory',
  '/pharmacy/orders': 'Orders',
  '/pharmacy/prescriptions': 'Prescriptions',
  '/pharmacy/suppliers': 'Suppliers',
  '/pharmacy/categories': 'Categories',
  '/pharmacy/reports': 'Reports',
  '/pharmacy/ratings': 'Ratings',
}

const breadcrumbs = computed(() => {
  const pathArray = route.path.split('/').filter(p => p)
  const crumbs = []

  // Always start with Dashboard
  crumbs.push({
    title: 'Dashboard',
    to: '/',
    disabled: false,
  })

  let currentPath = ''
  pathArray.forEach((path, index) => {
    currentPath += `/${path}`

    // Check if this is an ID (for detail pages)
    const isId = /^[a-f\d]{24}$/i.test(path) || path.length > 20

    if (isId) {
      // For ID paths, use the parent path name + "Details"
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'))
      const parentName = routeNames[parentPath]

      // Get a singular form for the detail title
      let detailTitle = 'Details'
      if (parentName) {
        // Convert plural to singular: "Pharmacies" -> "Pharmacy", "Patients" -> "Patient"
        const singular = parentName.endsWith('ies')
          ? parentName.slice(0, -3) + 'y'
          : parentName.endsWith('s')
            ? parentName.slice(0, -1)
            : parentName
        detailTitle = `${singular} Details`
      }

      crumbs.push({
        title: detailTitle,
        to: currentPath,
        disabled: index === pathArray.length - 1, // Disable if it's the current page
      })
    } else {
      // For regular paths
      const name = routeNames[currentPath] || path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ')

      // Don't duplicate if it's the same as dashboard
      if (currentPath !== '/' && currentPath !== '/dashboard') {
        crumbs.push({
          title: name,
          to: currentPath,
          disabled: index === pathArray.length - 1, // Disable if it's the current page
        })
      }
    }
  })

  return crumbs
})

const navigateTo = (path) => {
  if (path) {
    router.push(path)
  }
}
</script>

<template>
  <VBreadcrumbs
    :items="breadcrumbs"
    class="px-0 py-2"
  >
    <template #divider>
      <VIcon icon="bx-chevron-right" />
    </template>
    <template #title="{ item }">
      <span
        :class="item.disabled ? 'text-disabled' : 'breadcrumb-link'"
        @click="!item.disabled && navigateTo(item.to)"
      >
        {{ item.title }}
      </span>
    </template>
  </VBreadcrumbs>
</template>

<style scoped>
.breadcrumb-link {
  cursor: pointer;
  color: rgb(var(--v-theme-primary));
  transition: all 0.2s;
}

.breadcrumb-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.text-disabled {
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
  cursor: default;
}
</style>
