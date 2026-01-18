<template>
  <div class="page-content">
    <top-bar
      type="title-only"
      title="Orders"
      @open-side-nav="$emit('openSideNav')"
    />

    <main class="page-content__body">
      <div class="loader-container" v-if="loading">
        <Loader :useOverlay="false" :rounded="true" />
      </div>
      <NoOrders v-if="!loading && allOrders.length <= 0" />
      <OrdersList v-else />
    </main>
  </div>
</template>

<script>
import { defineComponent, onMounted, computed } from "vue";
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader.vue";
import NoOrders from "./components/NoOrders.vue";
import OrdersList from "./components/OrdersList.vue";

import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";

export default defineComponent({
  name: "Orders",
  components: { TopBar, NoOrders, Loader, OrdersList },
  emits: ["openSideNav"],
  setup: () => {
    const { "orders/getLoading": isLoading, "orders/getOrders": orders } =
      useMapGetters();
    const { "orders/fetchOrders": fetchOrders } = useMapActions();

    const loading = computed(() => {
      return isLoading.value;
    });

    const allOrders = computed(() => orders.value);

    onMounted(() => {
      fetchOrders();
    });

    return { loading, allOrders };
  },
});
</script>

<style scoped lang="scss">
.loader-container {
  width: 100%;
  height: 100%;

  @include responsive(phone) {
    width: 100%;
  }
}
</style>
