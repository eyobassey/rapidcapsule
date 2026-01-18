<template>
  <div class="ratings-root">
    <div class="ratings-container">
        <div
            v-for="(color, i) in colorOptions"
            :key="JSON.stringify(color)"
            class="rect"
            @click="setRating(i + 1)"
        >
        <span
            class="rect-inner"
            :class="{ filled: rating >= i + 1, first: i === 0, last: i === maxRects - 1 }"
            :style="{ background: rating >= i + 1 ? color : '#E5E5E5' }"
        ></span>
        <span class="rect-inner__text">{{ i + 1 }}</span>
        </div>
    </div>
    <div class="ratings-footer">
        <span class="ratings-footer-label">Mild</span>
        <span class="ratings-footer-label">Unbearable</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import Gradient from "javascript-color-gradient";

const emit = defineEmits(['update']);
const props = defineProps({
    modelValue: { type: Number, default: 0 },
    maxRects: { type: Number, default: 5 },
    colors: { type: Array, default: () => ['#FBE200', '#FB5A00'] },
});

const rating = ref(props.modelValue);
const colorOptions = new Gradient()
  .setColorGradient(...props.colors)
  .setMidpoint(props.maxRects)
  .getColors();

const setRating = (value) => {
    rating.value = value;
    emit('update:modelValue', value);
};

watch(() => props.value, (newValue) => {
    rating.value = newValue;
});
</script>

<style lang="scss" scoped>
.ratings-root {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ratings-container {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 4px;
}

.ratings-footer {
    width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .ratings-footer-label {
    color: #363636;
    font-size: 24px;
    font-weight: normal;
    line-height: 36px;
  }
}

.rect {
  width: 100%;
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;

  .rect-inner {
    width: 100% !important;
    height: 71px !important;
    transition: all 0.3s ease;
  }

  .rect-inner__text {
    color: #363636;
    font-size: 24px;
    font-weight: normal;
    line-height: 36px;
  }
}

.first {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.last {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

</style>
