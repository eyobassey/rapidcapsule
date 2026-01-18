<template>
  <div class="details__wrapper">
    <div class="details__innerWrapper">
      <rc-button
        v-if="!hasBoughtMedications"
        type="primary"
        label="Buy Medication"
        :iconLeft="true"
        iconName="cart-icon"
        @click="$emit('buyMedicationHandler')"
      />
      <ButtonIcon type="primary" :badge="false" iconName="download" />
      <ButtonIcon type="primary" :badge="false" iconName="share" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import RcButton from "@/components/buttons/button-primary";
import ButtonIcon from "@/components/buttons/button-icon.vue";

export default defineComponent({
  name: "Prescription Details Header",
  components: { RcButton, ButtonIcon },
  emits: ["buyMedicationHandler"],
  props: {
    hasBoughtMedications: {
      type: Boolean,
      default: false,
    },
  },
  setup: () => {},
});
</script>

<style scoped lang="scss">
.details {
  &__wrapper {
    @include flexItem(horizontal) {
      justify-content: flex-end;
    }
  }

  &__innerWrapper {
    @include flexItem(horizontal) {
      gap: $size-16;
    }
  }
}
</style>
