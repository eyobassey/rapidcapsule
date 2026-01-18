<template>
  <div
    :class="['drug-card', { 'drug-card--list': viewMode === 'list' }]"
    @click="$emit('view-details', drug._id, drug.batch_id)"
  >
    <div class="drug-card__image">
      <img
        v-if="(drug.image_url || drug.primary_image) && !imageError"
        :src="drug.image_url || drug.primary_image"
        :alt="drug.name"
        @error="handleImageError"
        loading="lazy"
        referrerpolicy="no-referrer"
      />
      <div v-else class="drug-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"/>
        </svg>
      </div>
      <!-- Rx Badge -->
      <span
        v-if="drug.requires_prescription"
        class="rx-badge"
        title="Requires Prescription"
      >
        Rx
      </span>
    </div>
    <div class="drug-card__content">
      <h3>{{ drug.name }}</h3>
      <p class="generic-name" v-if="drug.generic_name">{{ drug.generic_name }}</p>
      <p class="drug-details">{{ drug.strength }}{{ formatDosageForm(drug.dosage_form) ? ' | ' + formatDosageForm(drug.dosage_form) : '' }}</p>
      <p class="manufacturer" v-if="drug.manufacturer">{{ drug.manufacturer }}</p>
    </div>
    <div class="drug-card__footer">
      <div class="price">
        <span class="currency">NGN</span>
        <span class="amount">{{ formatCurrency(drug.selling_price) }}</span>
      </div>
      <div :class="['stock-status', getStockClass(drug)]">
        {{ getStockText(drug) }}
      </div>
    </div>
    <div class="drug-card__actions">
      <button
        v-if="!drug.requires_prescription"
        class="add-btn"
        @click.stop="$emit('add-to-cart', drug)"
        :disabled="!isInStock"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        <span>Add to Cart</span>
      </button>
      <span v-else class="prescription-required">Prescription Required</span>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed, ref } from "vue";

export default defineComponent({
  name: "DrugCard",
  props: {
    drug: {
      type: Object,
      required: true,
    },
    viewMode: {
      type: String,
      default: "grid",
    },
  },
  emits: ["add-to-cart", "view-details"],
  setup(props) {
    const imageError = ref(false);

    const formatCurrency = (amount) => {
      if (!amount) return "0.00";
      return Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    // Handle dosage_form that might be an ObjectId or object
    const formatDosageForm = (dosageForm) => {
      if (!dosageForm) return "";
      // If it's an object with a name property
      if (typeof dosageForm === "object" && dosageForm.name) {
        return dosageForm.name;
      }
      // If it looks like a MongoDB ObjectId (24 hex characters), hide it
      if (typeof dosageForm === "string" && /^[a-f0-9]{24}$/i.test(dosageForm)) {
        return ""; // Don't show ObjectIds
      }
      return dosageForm;
    };

    // Get quantity - prefer quantity_in_stock from batch calculation, fallback to legacy quantity
    const getQuantity = (drug) => drug.quantity_in_stock ?? drug.quantity ?? 0;

    const isInStock = computed(() => {
      return props.drug.is_available !== false && getQuantity(props.drug) > 0;
    });

    const getStockClass = (drug) => {
      const qty = getQuantity(drug);
      if (!drug.is_available || qty === 0) return "out-of-stock";
      if (qty <= 10) return "low-stock";
      return "in-stock";
    };

    const getStockText = (drug) => {
      const qty = getQuantity(drug);
      if (!drug.is_available || qty === 0) return "Out of Stock";
      if (qty <= 10) return `Low Stock (${qty})`;
      return `In Stock (${qty})`;
    };

    const handleImageError = () => {
      imageError.value = true;
    };

    return {
      imageError,
      formatCurrency,
      formatDosageForm,
      isInStock,
      getStockClass,
      getStockText,
      handleImageError,
    };
  },
});
</script>

<style scoped lang="scss">
.drug-card {
  background: $color-white;
  border-radius: $size-12;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }

  &__image {
    position: relative;
    height: 180px;
    background: $color-g-97;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .drug-placeholder {
      color: $color-g-77;

      svg {
        width: $size-48;
        height: $size-48;
      }
    }

    .rx-badge {
      position: absolute;
      top: $size-8;
      right: $size-8;
      background: $color-pri;
      color: $color-white;
      font-size: $size-10;
      font-weight: 700;
      padding: $size-4 $size-8;
      border-radius: $size-4;
    }
  }

  &__content {
    padding: $size-12;
    flex-grow: 1;

    h3 {
      font-size: $size-14;
      font-weight: 600;
      color: $color-g-21;
      margin: 0 0 $size-4 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .generic-name {
      font-size: $size-11;
      color: $color-pri;
      margin: 0 0 $size-4 0;
      font-style: italic;
    }

    .drug-details {
      font-size: $size-12;
      color: $color-g-54;
      margin: 0 0 $size-4 0;
    }

    .manufacturer {
      font-size: $size-11;
      color: $color-g-67;
      margin: 0;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-8 $size-12;

    .price {
      .currency {
        font-size: $size-11;
        color: $color-g-54;
      }

      .amount {
        font-size: $size-16;
        font-weight: 700;
        color: $color-g-21;
        margin-left: $size-2;
      }
    }

    .stock-status {
      font-size: $size-10;
      padding: $size-4 $size-8;
      border-radius: $size-12;
      font-weight: 500;

      &.in-stock {
        background: rgba(#10b981, 0.1);
        color: #059669;
      }

      &.low-stock {
        background: rgba(#f59e0b, 0.1);
        color: #d97706;
      }

      &.out-of-stock {
        background: rgba(#ef4444, 0.1);
        color: #dc2626;
      }
    }
  }

  &__actions {
    padding: $size-8 $size-12 $size-12;
    border-top: 1px solid $color-g-92;

    .add-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $size-6;
      padding: $size-10;
      background: $color-pri;
      color: white;
      border: none;
      border-radius: $size-8;
      font-size: $size-13;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover:not(:disabled) {
        background: darken($color-pri, 10%);
      }

      &:disabled {
        background: $color-g-85;
        color: $color-g-54;
        cursor: not-allowed;
      }

      svg {
        width: $size-16;
        height: $size-16;
      }
    }

    .prescription-required {
      display: block;
      text-align: center;
      font-size: $size-12;
      color: $color-g-67;
      padding: $size-10;
      background: $color-g-95;
      border-radius: $size-8;
    }
  }

  // List View Styles
  &--list {
    flex-direction: row;
    align-items: stretch;

    .drug-card__image {
      width: 140px;
      min-width: 140px;
      height: auto;
      min-height: 140px;
    }

    .drug-card__content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: $size-16;
      flex: 1;

      h3 {
        font-size: $size-16;
        -webkit-line-clamp: 1;
        margin-bottom: $size-6;
      }

      .generic-name {
        margin-bottom: $size-6;
      }
    }

    .drug-card__footer {
      flex-direction: column;
      justify-content: center;
      align-items: flex-end;
      gap: $size-8;
      padding: $size-16;
      border-left: 1px solid $color-g-92;
      border-top: none;
      min-width: 120px;

      .price {
        text-align: right;

        .amount {
          font-size: $size-18;
        }
      }
    }

    .drug-card__actions {
      display: flex;
      align-items: center;
      padding: $size-16;
      border-left: 1px solid $color-g-92;
      border-top: none;
      min-width: 140px;

      .add-btn {
        white-space: nowrap;
        padding: $size-10 $size-16;
      }

      .prescription-required {
        white-space: nowrap;
        padding: $size-10 $size-12;
        font-size: $size-11;
      }
    }

    &:hover {
      transform: none;
    }

    @include responsive(tab-portrait) {
      flex-direction: column;

      .drug-card__image {
        width: 100%;
        height: 160px;
        min-height: 160px;
      }

      .drug-card__footer {
        flex-direction: row;
        align-items: center;
        border-left: none;
        border-top: 1px solid $color-g-92;
        min-width: auto;
      }

      .drug-card__actions {
        border-left: none;
        border-top: 1px solid $color-g-92;
        min-width: auto;
      }
    }
  }
}
</style>
