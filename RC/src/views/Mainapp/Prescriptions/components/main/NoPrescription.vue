<template>
  <div class="prescription__wrapper">
    <ButtonIcon
      type="primary"
      :badge="false"
      iconName="plus"
      size="large"
      @click="$emit('uploadPrescription')"
    />
    <div class="prescription__body">
      <h4 class="prescription__heading">No prescription records found</h4>
      <p class="prescription__text">
        You haven’t been sent any prescriptions yet. Click the button above to
        upload a prescription given by a doctor.
      </p>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import ButtonIcon from "@/components/buttons/button-icon.vue";

export default defineComponent({
  name: "NoPrescription",
  components: { ButtonIcon },
  emits: ["uploadPrescription"],
  setup: () => {
    return {};
  },
});
</script>

<style scoped lang="scss">
.prescription {
  &__wrapper {
    margin-top: 100px;
    width: 100%;

    @include flexItem(vertical) {
      justify-content: center;
      align-items: center;
      gap: $size-36;
    }
  }

  &__body {
    @include flexItem(vertical) {
      width: 80%;
      margin: 0 auto;
      justify-content: center;
      align-items: center;
      text-align: center;
      gap: $size-14;
    }
  }

  &__heading {
    font-style: normal;
    font-weight: 600;
    font-size: 17px;
    line-height: 22px;
    color: $color-g-21;
  }

  &__text {
    font-weight: 400;
    font-size: 16px;
    line-height: 150%;
    color: $color-g-44;
  }
}
</style>
