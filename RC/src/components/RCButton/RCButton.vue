<template>
  <button
    class="btn"
    :class="[type, size, { iconRight: iconRight, iconLeft: iconLeft }]"
  >
    <Icons v-if="iconLeft" :name="iconName" id="icon-left" />
    {{ label }}
    <Icons v-if="iconRight" :name="iconName" id="icon-right" />
    <Spinner v-if="loading" />
  </button>
</template>

<script>
import Icons from "../icons.vue";
import Spinner from "../Loader/loader-buttons.vue";

export default {
  name: "Button-primary",

  components: {
    Icons,
    Spinner,
  },

  props: {
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    size: {
      type: String,
      required: false,
      default: "medium",
    },
    iconName: {
      type: String,
      required: false,
    },
    iconRight: {
      type: Boolean,
      required: false,
      default: false,
    },
    iconLeft: {
      type: Boolean,
      required: false,
      default: false,
    },

    loading: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped lang="scss">
.btn {
  @include flexItem(horizontal) {
    align-items: center;
    justify-content: center;
    gap: $size-12;
  }
  border: none;
  border-radius: 8px;
  font-weight: $fw-medium;
  cursor: pointer;

  &:disabled {
    color: $color-g-54;
    pointer-events: none;

    & > #icon-left,
    & > #icon-right {
      fill: $color-g-54;
    }
  }
}

.primary {
  background-color: $color-pri;
  color: $color-white;

  #icon-left,
  #icon-right {
    fill: $color-white;
  }

  &:hover {
    background-color: $color-pri-s1;
  }

  &:disabled {
    background-color: $color-g-67;
  }
}

.secondary {
  background-color: $color-pri-t4;
  color: $color-pri;

  #icon-left,
  #icon-right {
    fill: $color-pri;
  }

  &:hover {
    background-color: $color-pri-t3;
  }

  &:disabled {
    background-color: $color-g-67;
  }
}

.tertiary {
  background-color: $color-white;
  border: 1px solid $color-pri;
  color: $color-pri;

  #icon-left,
  #icon-right {
    fill: $color-pri;
  }

  &:hover {
    background-color: $color-pri-t5;
  }

  &:disabled {
    background-color: $color-g-67;
    border-color: $color-g-67;
  }
}

.text {
  background-color: transparent;
  color: $color-pri;

  #icon-left,
  #icon-right {
    fill: $color-pri;
  }

  &:hover {
    background-color: $color-pri-t4-50;
  }
}

.text-secondary {
  background-color: transparent;
  color: $color-sec-s1;

  #icon-left,
  #icon-right {
    fill: $color-sec-s1;
  }

  &:hover {
    background-color: $color-sec-t4;
  }
}

.large {
  font-size: $size-18;
  line-height: 1;
  padding: 0.8em 1.5em;
}

.medium {
  font-size: $size-16;
  line-height: 1;
  padding: 0.67em 1.33em;
}

.small {
  font-size: $size-12;
  line-height: 1;
  padding: 0.67em 1.33em;
}
</style>
