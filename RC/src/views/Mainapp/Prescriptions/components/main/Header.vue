<template>
  <div class="prescription__header top-space">
    <div>
      <Pill
        :prescriptionTabs="prescriptionTabs"
        @onClickTab="(value) => $emit('onClickTab', value)"
        :activeTab="activeTab"
      />
    </div>
    <div>
      <rc-button
        type="secondary"
        label="Add Prescription"
        :icon-left="true"
        class="prescription__rcButton"
        icon-name="plus-rc"
        @click="$emit('uploadPrescription')"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import RcButton from "@/components/buttons/button-primary";
import Pill from "@/components/RCTab/Pill.vue";
import { PRESCRIPTION_TAB_OPTIONS } from "../../constants";

export default defineComponent({
  name: "PrescriptionHeader",
  emits: ["uploadPrescription", "onClickTab"],
  props: {
    activeTab: {
      type: String,
      required: true,
    },
  },
  components: { RcButton, Pill },
  setup: () => {
    const prescriptionTabs = ref(PRESCRIPTION_TAB_OPTIONS);

    return { prescriptionTabs };
  },
});
</script>

<style scoped lang="scss">
.prescription {
  &__header {
    margin-bottom: $size-36;

    @include flexItem(horizontal) {
      justify-content: space-between;

      @include responsive(phone) {
        @include flexItem(vertical) {
          justify-content: flex-start;
          gap: $size-38;
        }
      }
    }
  }

  &__rcButton {
    background: $color-white;
    border: $size-1 solid $color-pri;
  }
}
</style>
