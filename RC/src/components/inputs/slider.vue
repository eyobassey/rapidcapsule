<template>
  <div class="slider-component">
    <div class="slidecontainer">
    <input
        ref="input"
        v-model="currentValue"
        type="range"
        :min="min"
        :max="max"
        class="slider"
        @input="onSlide($event)"
    >
    </div>
  </div>
</template>

<script>
import { ref, defineComponent } from 'vue';

export default defineComponent({
  setup(props, ctx) {
    const currentValue = ref(props.modelValue);

    const onSlide = ($event) => {
        ctx.emit('update:modelValue', parseInt(
            currentValue.value
        ));
    }

    return { currentValue, onSlide }
  },
  name: "RCSlider",
  props: {
    modelValue: { type: Number, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
});
</script>

<style scoped lang="scss">
.slider-component {
	width: 100%;
}
.slider-component .slidecontainer {
	width: 100%;
}

.slider-component .slidecontainer .slider {
	-webkit-appearance: none;
	appearance: none;
	width: 100%;
	height: 12px;
	border-radius: 6px;
	background: hsla(185, 100%, 37%, 1);
	outline: none;
	-webkit-transition: .2s;
	transition: opacity .2s;
}

.slider-component .slidecontainer .slider:hover {
	opacity: 1;
}

.slider-component .slidecontainer .slider::-webkit-slider-thumb {
	-webkit-appearance: none;
	appearance: none;
	width: 34px;
	height: 34px;
	background: #FFFFFF;
    border: 4px solid hsla(185, 100%, 37%, 1);
	cursor: pointer;
	border-radius: 100%;
    filter: drop-shadow(0 20px 13px rgb(0 0 0 / 0.03)) drop-shadow(0 8px 5px rgb(0 0 0 / 0.08));
}

.slider-component .slidecontainer .slider::-moz-range-thumb {
	width: 34px;
	height: 34px;
	background: #FFFFFF;
    border: 4px solid hsla(185, 100%, 37%, 1);
	cursor: pointer;
	border-radius: 100%;
}
</style>