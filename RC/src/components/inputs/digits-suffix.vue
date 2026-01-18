<template>
  <div class="input__container">
    <div class="input" :class="{ focused: inputState }">
      <input
        :type="textType ? 'text' : 'number'"
        :name="name"
        :id="identity"
        class="input__field"
        step=".01"
        :class="{ populated: numberInput }"
        :value="numberInput"
        :maxlength="maxDigits"
        :minlength="minDigits"
        :disabled="disabled"
        @input="$emit('update:numberInput', $event.target.value)"
        @focus="onfocus"
        @blur="onfocusOut"
      />
      <div class="input__select" tabindex="1" @blur="open = false">
        <div
          class="input__select--field"
          @click="
            disabled ? null : (open = !open);
            inputState = true;
          "
        >
          {{ selected }}
        </div>
        <div
          class="input__select--icon"
          @click="disabled ? null : (open = !open)"
        >
          <Icons name="arrow-up" v-if="open" />
          <Icons name="arrow-down" v-if="!open" />
        </div>
        <div
          class="input__select--items drop-shadow"
          :class="{ selectHide: !open }"
        >
          <div
            class="input__select--items--item copy"
            v-for="(option, i) of options"
            :key="i"
            @click="
              selected = option;
              open = false;
              $emit('update:modelValue', option);
            "
          >
            {{ option }}
          </div>
        </div>
      </div>
      <label for="digit" class="input__label">
        {{ label }}
        <span v-show="required">*</span>
      </label>
    </div>
    <slot />
  </div>
</template>

<script>
import Icons from "../icons.vue";

export default {
  name: "Digit with Suffix",

  emits: ["update:numberInput", "update:modelValue"],

  components: {
    Icons,
  },

  props: {
    label: {
      type: String,
      required: true,
    },
    textType: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      required: false,
    },
    tabindex: {
      type: Number,
      required: false,
      default: 0,
    },
    options: {
      type: Array,
      required: true,
    },
    default: {
      type: String,
      default: null,
    },
    required: {
      type: Boolean,
      default: false,
    },
    maxDigits: String,
    minDigits: String,
    numberInput: {
      type: [String, Number],
    },
    modelValue: String,
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      identity: this.id ? this.id : this.name,
      inputState: false,
      selected: this.default
        ? this.default
        : this.options.length > 0
        ? this.options[0]
        : this.modelValue
        ? this.modelValue
        : null,
      open: false,
    };
  },

  methods: {
    updateInput() {
      this.$emit("update:numberInput", $event.target.value);
    },
    onfocus() {
      this.inputState = true;
    },
    onfocusOut() {
      this.inputState = false;
    },
  },

  mounted() {
    this.$emit("update:modelValue", this.selected);
  },
};
</script>

<style scoped lang="scss">
.input__container {
  @include flexItem(vertical) {
    gap: $size-4;
    min-width: 200px;
  }

  & > p {
    color: $color-denote-red;
  }
}
.input {
  @include flexItem(horizontal) {
    gap: $size-8;
  }
  position: relative;
  width: 100%;
  height: 3.6rem;
  padding: $size-4;
  background-color: $color-white;

  border-radius: $size-8;
  border: $size-1 solid $color-g-67;

  &__field {
    width: 100%;
    height: 100%;
    padding: $size-20 $size-16 $size-4 $size-8;

    font-family: inherit;
    font-size: $size-16;
    font-weight: $fw-regular;
    color: $color-black;
    line-height: 1.5;
    letter-spacing: 0.02em;

    outline: none;
    border: none;
    box-shadow: none;

    &::-webkit-inner-spin-button {
      appearance: none;
    }

    &:focus ~ .input__label {
      top: $size-12;

      font-family: inherit;
      color: $color-pri;
      font-size: $size-11;
      font-weight: $fw-regular;
      line-height: 1.5;
      letter-spacing: 0.04em;

      span {
        display: none;
      }
    }

    &:focus.populated ~ .input__label {
      color: $color-pri;
    }
  }

  &__label {
    @include absolutePosition(v-center) {
      left: $size-12;
    }

    font-family: inherit;
    color: $color-g-54;
    font-size: $size-16;
    font-weight: $fw-regular;
    line-height: 1.5;
    letter-spacing: 0.04em;

    pointer-events: none;

    span {
      color: $color-denote-red;
      font-family: inherit;
      vertical-align: top;
      font-size: $size-14;
    }
  }

  &__select {
    position: relative;
    @include flexItem(horizontal) {
      align-items: center;
      flex-shrink: 0;
      gap: $size-8;
    }

    height: 100%;
    padding: $size-11 $size-10 $size-11 $size-16;
    border-radius: $size-4;
    background-color: $color-g-90;

    font-family: inherit;
    font-size: $size-16;
    font-weight: $fw-regular;
    color: $color-black;
    line-height: 1.5;
    letter-spacing: 0.02em;
    text-align: center;

    cursor: pointer;

    &:focus {
      outline: none;
    }

    &--field {
      flex-grow: 1;
      padding-right: $size-4;
    }

    &--icon {
      @include flexItem(horizontal) {
        align-items: center;
      }
    }

    &--items {
      position: absolute;
      top: 100%;
      right: 0;
      width: 150%;
      z-index: 10;

      padding: $size-4;
      margin-top: $size-4;
      border-radius: $size-8;
      background-color: $color-white;

      transition: all 150ms ease-out;

      &--item {
        text-align: left;
        padding: $size-8 $size-12;
        cursor: pointer;
        user-select: none;
        border-radius: $size-8;

        &:hover {
          background-color: $color-g-90;
        }
      }
    }
  }
}

.focused {
  border: $size-1 solid $color-pri-t2;

  & .input__label {
    color: $color-pri;
  }
}
.selectHide {
  display: none;
  height: 0px;
  opacity: 0;
}

.populated ~ .input__label {
  top: $size-12;

  font-family: inherit;
  color: $color-g-54;
  font-size: $size-11;
  font-weight: $fw-regular;
  line-height: 1.5;
  letter-spacing: 0.04em;

  span {
    display: none;
  }
}
</style>
