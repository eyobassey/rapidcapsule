<template>
  <div class="radio-container" :class="slottedClass">
    <template v-for="(option, i) in options" :key="option.name">
      <label class="radio-container__label">
        <span>
          <input
            type="radio"
            :id="radioName || option.name"
            :value="option.value"
            :disabled="disabled"
            :name="radioName || option.name"
            :checked="modelValue === option.value || option[defaultValue]"
            @change="$emit('update:modelValue', option.value)"
            @input="$emit('input', {value: option.value, index: i})"
          />
        </span>
        <slot v-if="slotted" :item="option.value" />
        <span class="radio-name" v-else>{{ option.name }}</span>
      </label>
    </template>
  </div>
</template>

<script>
import { defineComponent } from 'vue';

export default defineComponent({
  setup(props, ctx) {},
  name: "RCRadio",
  props: {
    modelValue: { type: String },
    radioName: { type: String },
    defaultValue: { type: String, required: false },
    slottedClass: { type: String },
    disabled: { type: Boolean, default: false },
    slotted: { type: Boolean, default: false },
    options: { type: Array, default: () => [] },
  },
});
</script>

<style scoped lang="scss">
.radio-container {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;

  & .radio-container__label {
    width: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: $size-16;

    & .radio-name {
      padding-bottom: 2px;
    }
    @include responsive(phone) {
      justify-content: center !important;
      align-items: center !important;
    }
  }
}

input[type="radio"] {
  /* Add if not using autoprefixer */
  -webkit-appearance: none;
  /* Remove most all native input styles */
  appearance: none;
  /* For iOS < 15 */
  background-color: $color-pri-main;
  /* Not removed via appearance */
  margin: 0;

  font: inherit;
  width: 18px;
  height: 18px;
  border: 1px solid $color-pri-main;
  border-radius: 100%;
  background: $color-white;
  transform: translateY(-0.075rem);

  display: grid;
  place-content: center;
}

input[type="radio"]::before {
  content: "";
  width: 12px;
  height: 12px;
  background: $color-pri-main;
  border-radius: 100%;
  transform: scale(0);
  transition: 120ms transform ease-in-out;
  box-shadow: inset 1em 1em $color-pri-main;
  /* Windows High Contrast Mode */
  background-color: $color-pri-main;
}

input[type="radio"]:checked::before {
  transform: scale(1);
}

// input[type="radio"]:focus {
//   outline: max(2px, 0.15em) solid currentColor;
//   outline-offset: max(2px, 0.15em);
// }
</style>
