<script setup>
const emit = defineEmits([
  'searchQuery',
])

const localSearchQuery =  ref('')

const updateSearchQuery = value => {
  localSearchQuery.value = value
  emit('update:searchQuery', value)
}
</script>

<template>
  <div
    class="d-flex table-search--input-cover"
  >
    <input 
      v-debounce:800ms="updateSearchQuery" 
      type="text"
      placeholder="Search"
      class="ml-2 table-search--input"
    >
    <VIcon
      icon="bx:search"
      class="v-icon table-search--v-icon"
    />
  </div>
</template>

<style lang="scss">
.table-search--input-cover {
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid #8A8A8A;

  &:focus-within {
    outline: 0.07rem solid rgb(var(--v-theme-primary));
    border: none;
  }

  .table-search--v-icon {
    width:20px
  }

  .table-search--input {
    width: 100%;

    &:focus-visible {
      outline: none !important;
    }
  }
}
</style>
