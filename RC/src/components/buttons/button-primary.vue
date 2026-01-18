<template>
  <button
    class="btn"
    :class="[type, size, { iconRight: iconRight, iconLeft: iconLeft }]"
    :style="{ width: width }"
  >
    <Icons
      v-if="iconLeft"
      :name="iconName"
      id="icon-left"
      :fillColor="fillColor"
    />
    <p>{{ label }}</p>
    <Icons
      v-if="iconRight"
      :name="iconName"
      id="icon-right"
      :fillColor="fillColor"
    />
    <Spinner v-if="loading" :color="loaderColor" />
  </button>
</template>

<script>
import Icons from "../icons.vue";
import Spinner from "../Loader/loader-standalone.vue";

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
    fillColor: {
      type: String,
      required: false,
    },

    loading: {
      type: Boolean,
      default: false,
    },
    loaderColor: String,
    width: String,
  },
};
</script>

<style scoped lang="scss">
.btn {
  @include flexItem(horizontal) {
    align-items: center;
    justify-content: center;
    gap: $size-12;
    border: none;
    border-radius: 8px;
    font-weight: $fw-medium;
    cursor: pointer;
  }

  &:disabled {
    pointer-events: none;

    p {
      color: $color-g-54;
    }

    #icon-left,
    #icon-right {
      fill: $color-g-54;
    }
  }
}

.primary {
  background-color: $color-pri;
  p {
    color: $color-white;
  }

  #icon-left,
  #icon-right {
    fill: $color-white;
  }

  &:hover {
    background-color: $color-pri-s1;
  }

  &:disabled {
    background-color: $color-g-77;
  }
}

.secondary {
  background-color: $color-pri-t4;

  p {
    color: $color-pri;
  }

  #icon-left,
  #icon-right {
    fill: $color-pri;
  }

  &:hover {
    background-color: $color-pri-t3;
  }

  &:disabled {
    background-color: $color-g-77;
  }
}

.tertiary {
  background-color: $color-white;
  border: 1px solid $color-pri;

  p {
    color: $color-pri;
  }

  #icon-left,
  #icon-right {
    fill: $color-pri;
  }

  &:hover {
    background-color: $color-pri-t5;
  }

  &:disabled {
    background-color: $color-g-77;
    border-color: $color-g-77;
  }
}

.text {
  background-color: transparent;

  p {
    color: $color-pri;
  }

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

  p {
    color: $color-sec-s1;
  }

  #icon-left,
  #icon-right {
    fill: $color-sec-s1;
  }

  &:hover {
    p {
      color: $color-sec-s2;
    }

    #icon-left,
    #icon-right {
      fill: $color-sec-s2;
    }
  }
}

.large {
  p {
    text-align: center;
    font-size: $size-20;
    line-height: 1.5;
  }
  padding: 0.8em 1.5em;
}

.medium {
  p {
    text-align: center;
    font-size: $size-18;
    line-height: 1.5;
  }
  padding: 0.67em 1.33em;
}

.small {
  p {
    text-align: center;
    font-size: $size-14;
    line-height: 1.5;
  }
  padding: 0.67em 1.33em;
}
</style>
