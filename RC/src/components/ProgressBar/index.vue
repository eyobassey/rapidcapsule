<template>
  <div
    class="ProgressBar__container"
    v-if="!Object.values(progressPayload).includes(0)"
  >
    <div class="ProgressBar__fillerStyles" role="progressbar"></div>
  </div>
</template>

<script>
import { defineComponent, computed } from "vue";
import { getProgressInPercentage } from "@/utilities/utilityFunctions";

export default defineComponent({
  name: "Progress Bar",
  props: {
    progressPayload: { type: Object, required: true },
  },

  setup: ({ progressPayload }) => {
    const percentage = computed(() =>
      getProgressInPercentage(
        progressPayload.progress,
        progressPayload.maxLimit
      )
    );

    return { percentage };
  },
});
</script>

<style scoped lang="scss">
.ProgressBar {
  &__container {
    height: $size-8;
    width: 100%;
    background-color: $color-g-77;
    border-radius: $size-4;
  }

  &__fillerStyles {
    height: 100%;
    width: v-bind(percentage);
    border-radius: $size-4;
    background-color: $color-sec-s2;
    text-align: right;
    transition: width 1s ease-in-out;
  }
}
</style>
