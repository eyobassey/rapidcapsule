<template>
  <div class="card__wrapper">
    <div class="card__wrapper__leftContent">
      <h4
        v-if="data.type === source.INTERNAL"
        class="card__wrapper__leftContent__heading"
      >
        {{ data.prescribed_by.profile.first_name }}
        {{ data.prescribed_by.profile.last_name }}
      </h4>
      <h4 v-else class="card__wrapper__leftContent__heading">
        {{ data.specialist }}
      </h4>
      <p
        class="card__wrapper__leftContent__subText"
        v-if="data.type === source.INTERNAL"
      >
        Date Prescribed: {{ formatDate(data.created_at) }}
      </p>
      <p class="card__wrapper__leftContent__subText">
        Source:
        {{
          data.type === source.INTERNAL
            ? prescriptionSource.RAPIDCAPSULE
            : prescriptionSource.UPLOADEDFILE
        }}
      </p>
      <p
        class="card__wrapper__leftContent__subText"
        v-if="data.type === source.INTERNAL"
      >
        Medications: {{ data.items.length }}
      </p>
    </div>
    <div class="card__wrapper__rightContent">
      <rc-button
        type="secondary"
        label="View Details"
        :iconRight="true"
        iconName="greater-than"
        fillColor="#F16439"
        class="card__wrapper__rightContent__buttonClass"
        @click="handleViewDetails(data._id)"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { SOURCES, PRESCRIPTION_SOURCE } from "../../constants";
import moment from "moment";
import RcButton from "@/components/buttons/button-primary";

export default defineComponent({
  name: "PrescriptionList",
  components: { RcButton },
  props: {
    data: {
      type: Object,
      required: true,
    },
  },
  setup: () => {
    const router = useRouter();

    const source = ref(SOURCES);
    const prescriptionSource = ref(PRESCRIPTION_SOURCE);

    const formatDate = (value) => moment(value).format("DD/MM/YYYY");

    const handleViewDetails = (dataId) => {
      router.push(`/app/patient/prescriptions/details/${dataId}`);
    };

    return { source, formatDate, handleViewDetails, prescriptionSource };
  },
});
</script>

<style scoped lang="scss">
.card {
  &__wrapper {
    background-color: $color-white;
    border-radius: $size-16;
    width: 100%;
    padding: $size-28;
    margin-bottom: $size-16;

    @include flexItem(horizontal) {
      justify-content: space-between;

      @include responsive(phone) {
        @include flexItem(vertical) {
          gap: $size-28;
        }
      }
    }

    &__leftContent {
      @include flexItem(vertical) {
        gap: $size-14;
      }

      &__heading {
        font-weight: 600;
        font-size: $size-20;
        line-height: $size-22;
      }

      &__subText {
        font-size: $size-16;
        color: $color-g-44;
      }
    }

    &__rightContent {
      &__buttonClass {
        background: transparent;

        @include responsive(phone) {
          background: $color-white;
          border: $size-1 solid $color-pri;
        }
      }
    }
  }
}
</style>
