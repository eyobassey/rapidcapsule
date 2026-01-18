<template>
  <div class="tab__container">
    <ul class="tab__nav-group">
      <li
        v-for="tab in tabItems"
        :key="tab"
        class="tab__nav-item"
        :class="{ active: tab == selected }"
        @click="setTab(tab)"
      >
        {{ tab }}
      </li>
    </ul>
    <slot />
  </div>
</template>

<script>
export default {
  name: "Tab Navigation",

  props: {
    tabItems: {
      type: Array,
      required: true,
    },
    selected: {
      type: String,
      required: true,
    },
  },

  methods: {
    setTab(tab) {
      this.$emit("selected", tab);
    },
  },
};
</script>

<style scoped lang="scss">
.tab {
  &__container {
    @include flexItem(vertical) {
      gap: $size-10;
      // flex-grow: 1;
      width: 100%;
      //   height: 100%;

      @include responsive(tab-portrait) {
        width: 100%;
      }
    }
  }

  &__nav-group {
    @include flexItem(horizontal) {
      flex-shrink: 0;
      min-width: 100%;
      list-style: none;
      border-bottom: $size-1 solid $color-g-90;
      overflow-x: auto;

      &::-webkit-scrollbar {
        display: none;
      }
    }
  }

  &__nav-item {
    position: relative;
    font-size: $size-18;
    font-weight: $fw-regular;
    color: $color-g-44;
    padding: $size-16 $size-24;
    cursor: pointer;

    @include responsive(phone) {
      flex-shrink: 0;
      font-size: $size-16;
      padding: $size-12 $size-18;
    }

    &:hover {
      background-color: $color-g-90;

      @include responsive(tab-landscape) {
        background-color: transparent;
      }
    }

    &.active {
      color: $color-black;

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: $size-4;
        background-color: $color-pri;
      }
    }
  }
}
</style>
