<template>
  <div class="container__wrapper">
    <header class="container__header">
      <h5>Prescription Details</h5>
    </header>
    <section
      v-if="source === sources.INTERNAL"
      class="container__content"
      v-for="(item, index) in prescription.items"
      :key="index"
    >
      <div class="container__content__flexHeader">
        <div class="container__content__flexHeader__heading">
          <h3>{{ item.drug }}</h3>
        </div>
        <div>
          <rc-button
            @click="showReminderModalHandler(item)"
            type="text-secondary"
            label="Add to Reminder"
            size="large"
            :iconLeft="true"
            iconName="plus-colored"
          />
        </div>
      </div>
      <div class="container__content__instructions">
        <div>
          <h5 class="container__content__instructions__subHeroText">
            Dosage Instructions
          </h5>

          <section class="container__content__instructions__wrapper">
            <div class="container__content__instructions__innerContent">
              <p class="container__content__grey-text">Quantity:</p>
              <p class="container__content__dark-text">
                {{ item.dose.quantity }} {{ item.dose.dosage_form }}
              </p>
            </div>
            <div class="container__content__instructions__innerContent">
              <p class="container__content__grey-text">Interval:</p>
              <p class="container__content__dark-text">
                {{ item.interval.time }} {{ item.interval.unit }}
              </p>
            </div>
            <div class="container__content__instructions__innerContent">
              <p class="container__content__grey-text">Period:</p>
              <p class="container__content__dark-text">
                {{ item.period.number || "--" }} {{ item.period.unit || "--" }}
              </p>
            </div>
            <div class="container__content__instructions__innerContent">
              <p class="container__content__grey-text">Note:</p>
              <p class="container__content__dark-text">
                {{ item.notes || "--" }}
              </p>
            </div>
          </section>
        </div>
        <div v-if="item.require_refill">
          <h5 class="container__content__instructions__subHeroText">
            Refill Instructions
          </h5>
          <section class="container__content__instructions__wrapper">
            <div class="container__content__instructions__innerContent">
              <p class="container__content__grey-text">Quantity:</p>
              <p class="container__content__dark-text">
                {{ item.refill_info.dose.quantity || "--" }}
                {{ item.refill_info.dose.dosage_form }}
              </p>
            </div>
            <div class="container__content__instructions__innerContent">
              <p class="container__content__grey-text">Interval:</p>
              <p class="container__content__dark-text">
                {{ item.refill_info.interval.time || "" }}
                {{ item.refill_info.interval.unit || "" }}
              </p>
            </div>
          </section>
        </div>
      </div>
    </section>
    <section
      v-else
      class="container__content"
      v-for="item in prescription.documents"
      :key="`${item}-${index}`"
    >
      <div class="container__content__flexHeader">
        <div>
          <h3 class="container__content__flexHeader__semiBoldHeading">
            {{ item.original_name }}
          </h3>
          <p class="container__content__grey-text">
            Uploaded: {{ formatDate(prescription.created_at) }}
          </p>
        </div>
        <div class="container__content__flexHeader__rightSection">
          <div>
            <rc-button
              @click="showReminderModalHandler"
              type="text-secondary"
              label="Add to Reminder"
              size="large"
              :iconLeft="true"
              iconName="plus-colored"
            />
          </div>
          <div
            class="container__content__flexHeader__rightSection__clearButton"
            role="button"
          >
            <Icons class="btn__close--icon" name="times-colored" />
          </div>
        </div>
      </div>
    </section>

    <ReminderModal
      v-if="shouldShowReminderModal"
      @handleCloseModal="handleClose"
      :selectedPrescription="selectedPrescription"
    />
  </div>
</template>

<script>
import { defineComponent, ref, reactive } from "vue";
import RcButton from "@/components/buttons/button-primary";
import ReminderModal from "../modals/ReminderModal.vue";
import Icons from "@/components/icons.vue";
import moment from "moment";
import { SOURCES } from "../../constants";

export default defineComponent({
  name: "PrescriptionDetails",
  components: { RcButton, Icons, ReminderModal },
  props: {
    prescription: {
      type: Object,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
  },
  setup: () => {
    const sources = ref(SOURCES);
    const shouldShowReminderModal = ref(false);
    const selectedPrescription = reactive({ data: {} });

    const formatDate = (value) => moment(value).format("DD/MM/YYYY");

    const showReminderModalHandler = (item) => {
      console.log(item, "item selected");
      selectedPrescription.data = item;
      shouldShowReminderModal.value = true;
    };

    const handleClose = () => {
      selectedPrescription.data = {};
      shouldShowReminderModal.value = false;
    };

    return {
      sources,
      formatDate,
      shouldShowReminderModal,
      showReminderModalHandler,
      selectedPrescription,
      handleClose,
    };
  },
});
</script>

<style scoped lang="scss">
.container {
  &__wrapper {
    margin: $size-60 0;
  }

  &__header {
    border-bottom: 1px solid #d9d9d9;

    h5 {
      color: $color-g-44;
      font-weight: $fw-regular;
      font-size: $size-16;
    }
  }

  &__content {
    margin-top: $size-40;
    background-color: $color-g-95;
    border-radius: $size-16;
    border: 1px solid $color-pri-t5;
    padding: $size-24;

    &__flexHeader {
      @include flexItem(horizontal) {
        justify-content: space-between;
        align-items: center;
      }

      @include responsive(phone) {
        @include flexItem(vertical) {
          justify-content: flex-start;
          align-items: flex-start;
          gap: $size-24;
        }
      }

      &__heading {
        font-weight: $fw-semi-bold;
        font-size: $size-22;
      }

      &__semiBoldHeading {
        font-weight: $fw-regular;
        font-size: $size-24;
        margin-bottom: $size-12;
      }

      &__rightSection {
        @include flexItem(horizontal) {
          gap: $size-28;
          align-items: center;
        }

        @include responsive(phone) {
          flex-direction: row-reverse;
        }

        &__clearButton {
          height: fit-content;
          background-color: $color-white;
          padding: $size-12;
          border-radius: $size-10;
          cursor: pointer;
        }
      }
    }

    &__instructions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-gap: $size-28;
      margin-top: $size-28;

      @include responsive(tab-landscape) {
        grid-template-columns: 1fr;
      }

      @include responsive(tab-portrait) {
        grid-template-columns: 1fr;
      }

      &__subHeroText {
        font-size: $size-16;
        font-weight: $fw-medium;
      }

      &__wrapper {
        margin-top: $size-28;
      }

      &__innerContent {
        margin-bottom: $size-6;

        @include flexItem(horizontal) {
          align-items: center;
          gap: $size-12;
        }
      }
    }

    &__grey-text {
      color: $color-g-44;
      font-size: $size-16;
      letter-spacing: 0.02em;
      margin-bottom: $size-4;
    }

    &__dark-text {
      color: $color-black;
      font-size: $size-16;
      letter-spacing: 0.02em;
      margin-bottom: $size-4;
    }
  }
}
</style>
