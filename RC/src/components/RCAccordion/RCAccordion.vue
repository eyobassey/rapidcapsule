<template>
  <div class="accordion" :class="containerClass">
    <template v-for="item in items" :key="JSON.stringify(item)">
      <div class="accordion-item" :class="itemsClass">
        <div class="accordion-header" @click="!item.active ? item['active'] = true : delete item.active">
          <slot name="header" :item="item" :header="item.header" :content="item.content" />
          <v-icon name="bi-chevron-down" class="accordion-icon" :class="{'icon-active': item.active }" />
        </div>
        <div v-if="item.active" class="accordion-content">
          <slot name="content" :item="item" :header="item.header" :content="item.content" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  items: { type: Array, required: true, default: () => [] },
  containerClass: { type: String, required: false, default: '' },
  itemsClass: { type: String, required: false, default: '' },
});

</script>

<style scoped lang="scss">
.accordion {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: $size-8;
}

.accordion-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: $size-16;
  background-color: $color-white;
  border: 1px solid $color-g-95;
  padding: $size-12;
  border-radius: $size-12;
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $size-8;
  cursor: pointer;
}

.accordion-icon {
  width: 24px;
  height: 24px;
  color: $color-black;
}
.icon-active {
  transform: rotate(180deg);
}

.accordion-content {
  width: 100%;
}
</style>
