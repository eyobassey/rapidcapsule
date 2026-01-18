<template>
  <div
    class="card__wrapper"
    v-for="({ orderNumber, order_status, created_at, _id }, index) in allOrders"
    :key="index"
  >
    <div class="card__wrapper__leftContent">
      <div class="card__wrapper__leftContent__headerWrapper">
        <h4 class="card__wrapper__leftContent__heading">
          Order: {{ orderNumber }}
        </h4>
        <div
          :class="[
            'card__wrapper__leftContent__headerWrapper__pill',
            `card__wrapper__leftContent__headerWrapper__pill__${order_status}`,
          ]"
        >
          <span>{{ order_status }}</span>
        </div>
      </div>
      <p class="card__wrapper__leftContent__subText">
        Date: {{ formatDate(created_at) }}
      </p>
    </div>
    <div class="card__wrapper__rightContent">
      <rc-button
        type="secondary"
        label="View Order Details"
        :iconRight="true"
        iconName="greater-than"
        fillColor="#F16439"
        class="card__wrapper__rightContent__buttonClass"
        @click="viewOrderHandler(_id)"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from "vue";
import { useRouter } from "vue-router";
import RcButton from "@/components/buttons/button-primary";
import moment from "moment";

import { mapGetters as useMapGetters } from "@/utilities/utilityStore";

export default defineComponent({
  name: "Orders List",
  components: { RcButton },
  setup: () => {
    const router = useRouter();
    const { "orders/getOrders": orders } = useMapGetters();

    const allOrders = computed(() => {
      return orders.value;
    });

    const formatDate = (value) => moment(value).format("DD/MM/YYYY");

    const viewOrderHandler = (orderId) =>
      router.push(`/app/patient/orders/details/${orderId}`);

    return { allOrders, formatDate, viewOrderHandler };
  },
});
</script>

<style lang="scss" scoped>
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
