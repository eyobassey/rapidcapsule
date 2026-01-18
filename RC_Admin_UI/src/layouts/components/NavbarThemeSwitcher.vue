<script setup>
const themes = [
  {
    name: 'system',
    icon: 'mdi-laptop',
  },
  {
    name: 'light',
    icon: 'bx-sun',
  },
  {
    name: 'dark',
    icon: 'bx-moon',
  },
]
</script>

<template>
  <ThemeSwitcher :themes="themes" />
</template>
