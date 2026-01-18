<template>
  <div class="tab__wrapper">
    <router-link
      v-for="({ text, value }, index) in prescriptionTabs"
      :to="`?${queryTab}=${value}`"
      @click="$emit('onClickTab', value)"
      :key="index"
      :class="[activeTab === value ? 'tab__active' : 'tab__inactive']"
    >
      <p
        :class="[
          activeTab === value ? 'tab__active__text' : 'tab__inactive__text',
        ]"
      >
        {{ text }}
      </p>
    </router-link>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import { LOCATION_QUERY_KEY } from "@/utilities/constants";
export default defineComponent({
  name: "Pill",
  emits: ["onClickTab"],
  props: {
    prescriptionTabs: {
      type: Array,
      required: true,
    },
    activeTab: {
      type: String,
      required: true,
    },
  },

  setup: () => {
    const queryTab = ref(LOCATION_QUERY_KEY);

    return { queryTab };
  },
});
</script>

<style scoped lang="scss">
.tab {
  &__wrapper {
    @include flexItem(horizontal) {
      gap: $size-12;
      align-items: center;
      justify-content: center;
      height: 100%;

      @include responsive(phone) {
        justify-content: flex-start;
      }
    }
  }

  &__inactive {
    background-color: $color-g-92;
    border-radius: $size-15;
    padding: $size-4 $size-20;
    text-decoration: none;

    &__text {
      color: $color-g-44;
      font-size: $size-16;
    }
  }

  &__active {
    background-color: $color-sec-s2;
    border-radius: $size-15;
    padding: $size-4 $size-20;
    text-decoration: none;

    &__text {
      color: $color-white;
      font-size: $size-16;
    }
  }
}
</style>
