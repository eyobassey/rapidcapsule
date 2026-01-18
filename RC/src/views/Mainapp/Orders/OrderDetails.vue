<template>
  <div class="page-content">
    <top-bar
      type="breadCrumb"
      :crumbConfig="_breadCrumbConfig"
      @open-side-nav="$emit('openSideNav')"
    />

    <div class="page-content__body">
      <div class="top-space"></div>

      <div class="loader-container" v-if="loading">
        <Loader :useOverlay="false" :rounded="true" />
      </div>

      <div v-if="Object.values(orderDetails.data).length && !loading">
        <OrdersHeader
          :orderNumber="orderDetails.data.orderNumber"
          :dateOrdered="orderDetails.data.created_at"
          :orderStatus="orderDetails.data.order_status"
        />
        <div v-if="orderDetails.data.order_status !== orderTypes.CANCELLED">
          <OrderSummary
            :prescriptions="orderDetails.data.items"
            :deliveryAddress="orderDetails.data.shipping_details.address"
            :deliveryFee="orderDetails.data.delivery_fee"
            :total="orderDetails.data.total_price"
          />
          <OrderDelivery
            :deliveryDetails="orderDetails.data.shipping_details"
          />
        </div>
        <div v-else class="cancel__wrapper">
          <header class="cancel__header">
            <h5>Reason for Cancelling</h5>
          </header>
          <section class="cancel__content">
            <p>{{ orderDetails.data.reasonForCancelling }}</p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, inject, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader.vue";
import OrdersHeader from "./components/Header.vue";
import OrderSummary from "./components/OrderSummary.vue";
import OrderDelivery from "./components/OrderDeliveryDetails.vue";

import { breadCrumbConfig } from "./config";
import { ORDER_TYPES } from "./constants";
import { ordersMock } from "./mock-data";

export default defineComponent({
  name: "Order details",
  components: { TopBar, Loader, OrdersHeader, OrderSummary, OrderDelivery },
  setup: () => {
    const route = useRoute();
    const router = useRouter();
    const $http = inject("$http");
    const $toast = useToast();

    const _breadCrumbConfig = ref(breadCrumbConfig);
    const orderTypes = ref(ORDER_TYPES);
    const loading = ref(false);
    const orderDetails = reactive({
      data: {},
    });

    const getOrder = async (orderId) => {
      if (!orderId) return;
      try {
        loading.value = true;
        const response = await $http.$_getOrder(orderId);

        if (response) {
          if (response.data.data !== null) {
            orderDetails.data = { ...response.data.data };
          } else {
            const foundOrder = ordersMock.find(({ _id }) => _id === orderId);

            if (foundOrder) {
              orderDetails.data = { ...foundOrder };
            } else {
              router.push("/app/patient/orders/");
            }
          }
        }
      } catch (error) {
        const {
          response: {
            data: { errorMessage: serverError },
          },
        } = error;

        $toast.error(serverError || "An error has occured, please try again");
      }
      loading.value = false;
    };

    onMounted(() => {
      const { id } = route.params;
      getOrder(id);
    });

    return { _breadCrumbConfig, loading, getOrder, orderDetails, orderTypes };
  },
});
</script>

<style scoped lang="scss">
.cancel {
  &__wrapper {
    margin-top: $size-48;
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
    margin-top: $size-28;

    &__para {
      color: $color-g-21;
      font-size: $size-16;
      margin-bottom: $size-10;
    }
  }
}
.loader-container {
  width: 100%;
  height: 100%;

  @include responsive(phone) {
    width: 100%;
  }
}
</style>
