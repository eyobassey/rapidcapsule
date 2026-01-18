<template>
  <div class="container__wrapper">
    <header class="container__header">
      <h5>Delivery Details</h5>
    </header>
    <section class="container__content">
      <p class="container__content__para">{{ deliveryDetails.address }}</p>
      <p class="container__content__para">{{ deliveryDetails.phone }}</p>
      <p class="container__content__para">{{ deliveryDetails.email }}</p>
    </section>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "Order delivery details",
  components: {},
  props: {
    deliveryDetails: {
      type: Object,
      required: true,
    },
  },
  setup: () => {
    return {};
  },
});
</script>

<style lang="scss" scoped>
.container {
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
</style>
