<template>
  <div class="Header__wrapper">
    <div class="Header__wrapper__leftContent">
      <div class="Header__wrapper__leftContent__headerWrapper">
        <h4 class="Header__wrapper__leftContent__heading">
          Order: {{ orderNumber }}
        </h4>
        <div
          :class="[
            'Header__wrapper__leftContent__headerWrapper__pill',
            `Header__wrapper__leftContent__headerWrapper__pill__${orderStatus}`,
          ]"
        >
          <span>{{ orderStatus }}</span>
        </div>
      </div>
      <p class="Header__wrapper__leftContent__subText">
        Date: {{ formatDate(dateOrdered) }}
      </p>
    </div>
    <div class="Header__wrapper__rightContent">
      <rc-button
        class="Header__wrapper__rightContent__buttonClass"
        type="secondary"
        label="View Prescription"
        size="small"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import moment from "moment";
import RcButton from "@/components/buttons/button-primary";

export default defineComponent({
  name: "Order details header",
  components: { RcButton },
  props: {
    orderNumber: {
      type: String,
      required: true,
    },
    dateOrdered: {
      type: String,
      required: true,
    },
    orderStatus: {
      type: String,
      required: true,
    },
  },

  setup: () => {
    const formatDate = (value) => moment(value).format("DD/MM/YYYY");

    return { formatDate };
  },
});
</script>

<style lang="scss" scoped>
.Header {
  &__wrapper {
    @include flexItem(horizontal) {
      justify-content: space-between;
    }

    @include responsive(phone) {
      @include flexItem(vertical) {
        gap: $size-28;
      }
    }

    &__leftContent {
      @include flexItem(vertical) {
        gap: $size-14;
      }

      &__headerWrapper {
        @include flexItem(horizontal) {
          gap: $size-16;
        }

        &__pill {
          border-radius: 8px;
          padding: 2px 8px;
          width: fit-content;
          display: flex;
          justify-content: center;
          align-items: center;

          span {
            font-size: $size-12;
            display: flex;
          }

          &__Pending {
            background-color: $color-g-90;
          }

          &__Delivered {
            background-color: #c6fed3;
          }

          &__In-Transit {
            background-color: #fef2c6;
          }

          &__Cancelled {
            background-color: #fed4c6;
          }
        }
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
        background-color: transparent;
        border: 1px solid $color-pri;

        @include responsive(phone) {
          background: $color-white;
          border: $size-1 solid $color-pri;
        }
      }
    }
  }
}
</style>
