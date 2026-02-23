<template>
  <div class="container__wrapper">
    <header class="container__header">
      <h5>Order Summary</h5>
    </header>
    <section class="container__content">
      <div
        class="container__content__prescriptions"
        v-for="{ drug_name, total, quantity, _id } in prescriptions"
        :key="_id"
      >
        <div>
          <p class="container__darkText">{{ drug_name }}</p>
        </div>
        <div>
          <p class="container__darkText">{{ format(total) }}</p>
          <p class="container__subGreyText">Qty: {{ quantity }} card</p>
        </div>
      </div>
      <div class="container__content__deliveryFee">
        <div>
          <p class="container__darkText">Delivery fee</p>
        </div>
        <div>
          <p class="container__darkText">
            {{ format(deliveryFee) }}
          </p>
          <p class="container__subGreyText">to {{ deliveryAddress }} card</p>
        </div>
      </div>
      <div class="container__content__total">
        <div>
          <p class="container__darkText">Total</p>
        </div>
        <div>
          <p class="container__boldDarkText">
            {{ format(total) }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { formatCurrency, convertFromNGN } from "@/utilities/currency";

export default defineComponent({
  name: "Order summary",
  components: {},
  props: {
    prescriptions: {
      type: Array,
      required: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
    },
    deliveryFee: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
  },
  computed: {
    currencyCode() {
      return this.$store.getters['currency/currencyCode'];
    },
  },
  methods: {
    format(amount) {
      return formatCurrency(convertFromNGN(amount, this.currencyCode), this.currencyCode);
    },
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

    &__prescriptions {
      @include flexItem(horizontal) {
        justify-content: space-between;
      }
    }

    &__deliveryFee {
      margin-top: $size-20;
      padding-bottom: $size-20;
      border-bottom: 1px solid #d9d9d9;

      @include flexItem(horizontal) {
        justify-content: space-between;
      }
    }

    &__total {
      margin-top: $size-20;
      @include flexItem(horizontal) {
        justify-content: space-between;
      }
    }
  }

  &__darkText {
    color: $color-g-21;
    font-size: $size-16;
    text-align: right;
  }

  &__boldDarkText {
    color: $color-g-21;
    font-size: $size-16;
    font-weight: $fw-bold;
    text-align: right;
  }

  &__subGreyText {
    color: $color-g-54;
    font-size: $size-14;
    text-align: right;
    margin-top: $size-3;
  }
}
</style>
