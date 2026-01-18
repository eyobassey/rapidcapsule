<template>
  <div class="breadCrumb__wrapper">
    <div
      class="config"
      v-for="(
        { text, route, isParentRoute, isLastRoute }, index
      ) in crumbConfig"
      :key="index"
    >
      <router-link
        :to="route"
        v-if="isParentRoute || !isLastRoute"
        class="breadCrumb__link"
      >
        <Icons name="less-than" fillColor="#363636" v-if="isParentRoute" />
        {{ text }} <span>/</span>
      </router-link>
      <p class="breadCrumb__plainText" v-else>{{ text }}</p>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import Icons from "../icons.vue";

export default defineComponent({
  name: "BreadCrumb",
  components: { Icons },
  props: {
    crumbConfig: {
      type: Array,
      required: true,
    },
  },
  setup: () => {
    return {};
  },
});
</script>

<style scoped lang="scss">
.breadCrumb {
  &__wrapper {
    @include flexItem(horizontal) {
      gap: $size-14;
      align-items: center;
    }
  }

  &__link {
    @include flexItem(horizontal) {
      gap: $size-14;
      align-items: center;
      text-decoration: none;
      font-size: $size-18;
      color: $color-g-44;
    }

    span {
      color: $color-g-44;
    }
  }

  &__plainText {
    color: $color-g-21;
    font-size: $size-18;
  }
}
</style>
