<template>
  <div
    class="Progress__wrapper"
    v-if="!Object.values(progressPayload).includes(0)"
  >
    <header class="Progress__header">
      <h5 class="Progress__header__hero">Progress Status</h5>
      <p
        class="Progress__header__confirmButton"
        role="button"
        v-if="orderConfirmed"
      >
        Confirm Order
      </p>
    </header>
    <section>
      <ProgressBar :progressPayload="progressPayload" />
      <div class="Progress__footer">
        <p class="Progress__small-text">Status: {{ progressPayload.status }}</p>
        <p class="Progress__small-text">
          Estimated time remaining: {{ progressPayload.timeLeft }} mins
        </p>
      </div>
    </section>
  </div>
</template>

<script>
import { defineComponent, reactive, onMounted, watch, ref } from "vue";
import ProgressBar from "@/components/ProgressBar";
import RcButton from "@/components/buttons/button-primary";
import { statusArray, progressArray, timeLeftArray } from "../../constants";

export default defineComponent({
  name: "Progress",
  components: { ProgressBar, RcButton },

  setup: () => {
    const randomData = ref(null);
    const orderConfirmed = ref(false);
    const progressPayload = reactive({
      progress: 0,
      maxLimit: 15,
      status: "",
      timeLeft: 0,
    });

    const randomStatusGenerator = () =>
      statusArray[Math.floor(Math.random() * statusArray.length)];

    const randomProgressGenerator = () =>
      progressArray[Math.floor(Math.random() * progressArray.length)];

    const randomTimeLeftGenerator = () =>
      timeLeftArray[Math.floor(Math.random() * timeLeftArray.length)];

    const handleRandomGenerator = () => {
      randomData.value = setInterval(() => {
        progressPayload.status = randomStatusGenerator();
        progressPayload.progress = randomProgressGenerator();
        progressPayload.timeLeft = randomTimeLeftGenerator();
      }, 3000);
    };

    onMounted(() => handleRandomGenerator());

    watch(progressPayload, (value) => {
      if (value.progress === progressPayload.maxLimit) {
        clearInterval(randomData.value);
        orderConfirmed.value = true;
      }
    });

    return {
      progressPayload,
      randomData,
      orderConfirmed,

      randomStatusGenerator,
      randomProgressGenerator,
      randomTimeLeftGenerator,
      handleRandomGenerator,
    };
  },
});
</script>

<style scoped lang="scss">
.Progress {
  &__wrapper {
    width: 100%;
    background: $color-white;
    border: 1px solid $color-pri-t5;
    border-radius: $size-16;
    padding: $size-16 $size-24;
  }

  &__header {
    margin-bottom: $size-24;
    @include flexItem(horizontal) {
      justify-content: space-between;
    }

    &__hero {
      font-weight: $fw-medium;
      font-size: $fs-medium;
      letter-spacing: 0.02em;
    }

    &__confirmButton {
      color: $color-sec-s2;
      font-weight: $fw-medium;
      cursor: pointer;
    }
  }

  &__footer {
    margin-top: $size-10;

    @include flexItem(horizontal) {
      justify-content: space-between;
    }
  }

  &__small-text {
    color: $color-g-21;
    font-size: $size-12;
  }
}
</style>
