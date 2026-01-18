<template>
  <div class="orders__wrapper">
    <div class="orders__body">
      <h4 class="orders__heading">No orders have been placed</h4>
      <p class="orders__text">
        Your orders will show here when you make a purchase.
      </p>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "NoOrders",
});
</script>

<style scoped lang="scss">
.orders {
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
