<template>
  <div class="input__container">
    <div class="input">
      <textarea
        :id="identity"
        :name="name"
        :row="row"
        :placeholder="placeholder"
        class="input__field"
        :class="{ populated: modelValue }"
        :value="modelValue"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
      />
      <label :for="name" class="input__label">{{ label }}</label>
    </div>

    <slot />
  </div>
</template>

<script>
export default {
  name: "TextArea",

  data() {
    return {
      identity: this.id ? this.id : this.name,
      status: false,
    };
  },

  props: {
    type: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    id: {
      type: String,
      default: "",
    },
    placeholder: {
      type: String,
      default: "",
    },
    row: {
      type: Number,
      default: 8,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    modelValue: String,
  },
};
</script>

<style scoped lang="scss">
.input__container {
  width: 100%;
}
.input {
  position: relative;
  margin-bottom: $size-4;

  &__field {
    width: 100%;
    height: $size-64 * 2;
    padding: $size-15 $size-16;
    resize: none;

    border-radius: $size-8;
    border: 1px solid $color-g-67;

    font-family: inherit;
    font-size: $size-16;
    font-weight: $fw-regular;
    color: $color-black;
    line-height: 1.5;
    letter-spacing: 0.02em;

    // border: none;
    outline: none;
    box-shadow: none;

    &:focus {
      border-color: $color-pri-t2;
      border-width: 1px;

      & ~ .input__label {
        top: $size-6;
        transform: translateY(0);

        font-family: inherit;
        color: $color-pri;
        font-size: $size-11;
        font-weight: $fw-regular;
        line-height: 1.5;
        letter-spacing: 0.04em;
      }

      & .populated ~ .input__label {
        color: $color-pri;
        font-weight: $fw-semi-bold;
      }
    }
  }

  &__label {
    position: absolute;
    top: 50%;
    left: $size-16;
    transform: translateY(-50%);

    font-family: inherit;
    color: $color-g-54;
    font-size: $size-16;
    font-weight: $fw-regular;
    line-height: 1.5;
    letter-spacing: 0.04em;

    pointer-events: none;

    transition: all 150ms ease-out;
  }
}

.populated {
  & ~ .input__label {
    top: $size-6;
    transform: translateY(0);

    font-family: inherit;
    color: $color-g-54;
    font-size: $size-11;
    font-weight: $fw-regular;
    line-height: 1.5;
    letter-spacing: 0.04em;
  }
}
</style>
