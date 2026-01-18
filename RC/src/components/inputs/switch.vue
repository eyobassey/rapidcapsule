<template>
  <div class="method__wrapper">
    <label :for="identity" class="input clickable">
      <input
        type="checkbox"
        :id="identity"
        :name="name"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <div class="input__switch"></div>
    </label>
  </div>
</template>

<script>
export default {
  name: "Switch",

  data() {
    return {
      identity: this.id ? this.Id : this.Name,
    };
  },

  props: {
    name: {
      type: String,
      required: true,
    },
    Id: {
      type: String,
      required: false,
    },
    label: {
      type: String,
      required: true,
    },
    modelValue: Boolean,
  },
};
</script>

<style scoped lang="scss">
label {
  padding: $size-16;
}
input {
  display: none;

  &:checked {
    & + .input__switch {
      background-color: $color-sec-s3;
      &::after {
        top: 50%;
        transform: translate(calc(100% + $size-4), -50%);
      }
    }
  }
}
.input__switch {
  position: relative;
  padding: $size-2;
  width: $size-40;
  height: $size-20;
  border-radius: 100vw;
  background-color: $color-g-67;

  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: $size-2;
    transform: translateY(-50%);
    width: calc($size-20 - $size-4);
    height: calc($size-20 - $size-4);
    border-radius: 50%;
    background-color: $color-white;

    transition: all 200ms ease-out;
  }
}
</style>
