<template>
  <div class="order-card" @click="$emit('view-details', order._id)">
    <div class="order-card__header">
      <div class="order-info">
        <span class="order-number">{{ order.order_number }}</span>
        <span class="order-date">{{ formatDate(order.created_at) }}</span>
      </div>
      <div :class="['order-status', statusClass]">
        {{ formatStatus(order.status) }}
      </div>
    </div>

    <div class="order-card__body">
      <div class="order-items">
        <span class="items-count">{{ order.items?.length || 0 }} item(s)</span>
        <span class="items-preview">
          {{ itemsPreview }}
        </span>
      </div>
      <div class="order-total">
        <span class="label">Total</span>
        <span class="amount">{{ formatPrice(order.total_amount) }}</span>
      </div>
    </div>

    <div class="order-card__footer">
      <div class="pharmacy-info" v-if="order.pharmacy">
        <RCIcon name="pharmacy" />
        <span>{{ order.pharmacy.name }}</span>
      </div>
      <div class="order-actions">
        <button
          v-if="canTrack"
          class="action-btn track-btn"
          @click.stop="$emit('track', order.order_number)"
        >
          <RCIcon name="location" />
          Track
        </button>
        <button class="action-btn view-btn" @click.stop="$emit('view-details', order._id)">
          View Details
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, computed } from "vue";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import moment from "moment";

export default defineComponent({
  name: "OrderCard",
  components: { RCIcon },
  props: {
    order: {
      type: Object,
      required: true,
    },
  },
  emits: ["view-details", "track"],
  setup(props) {
    const formatPrice = (price) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(price || 0);
    };

    const formatDate = (date) => {
      return moment(date).format("MMM D, YYYY");
    };

    const formatStatus = (status) => {
      const statusMap = {
        PENDING: "Pending",
        CONFIRMED: "Confirmed",
        PROCESSING: "Processing",
        READY_FOR_PICKUP: "Ready for Pickup",
        OUT_FOR_DELIVERY: "Out for Delivery",
        DELIVERED: "Delivered",
        COMPLETED: "Completed",
        CANCELLED: "Cancelled",
        REFUNDED: "Refunded",
      };
      return statusMap[status] || status;
    };

    const statusClass = computed(() => {
      const statusClasses = {
        PENDING: "pending",
        CONFIRMED: "confirmed",
        PROCESSING: "processing",
        READY_FOR_PICKUP: "ready",
        OUT_FOR_DELIVERY: "delivery",
        DELIVERED: "delivered",
        COMPLETED: "completed",
        CANCELLED: "cancelled",
        REFUNDED: "refunded",
      };
      return statusClasses[props.order.status] || "pending";
    });

    const canTrack = computed(() => {
      // Show track button for orders that are being processed/delivered
      return ["CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"].includes(props.order.status);
    });

    const itemsPreview = computed(() => {
      if (!props.order.items || props.order.items.length === 0) return "";
      const names = props.order.items.slice(0, 2).map((item) => item.drug_name);
      if (props.order.items.length > 2) {
        names.push(`+${props.order.items.length - 2} more`);
      }
      return names.join(", ");
    });

    return {
      formatPrice,
      formatDate,
      formatStatus,
      statusClass,
      canTrack,
      itemsPreview,
    };
  },
});
</script>

<style scoped lang="scss">
.order-card {
  background: $color-white;
  border-radius: $size-12;
  padding: $size-16;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-12;

    .order-info {
      display: flex;
      flex-direction: column;
      gap: $size-4;

      .order-number {
        font-size: $size-14;
        font-weight: 600;
        color: $color-g-21;
      }

      .order-date {
        font-size: $size-12;
        color: $color-g-67;
      }
    }

    .order-status {
      font-size: $size-12;
      font-weight: 500;
      padding: $size-4 $size-8;
      border-radius: $size-4;

      &.pending {
        background: #fff3cd;
        color: #856404;
      }

      &.confirmed,
      &.processing {
        background: #cce5ff;
        color: #004085;
      }

      &.ready,
      &.delivery {
        background: #d4edda;
        color: #155724;
      }

      &.delivered,
      &.completed {
        background: #d4edda;
        color: #155724;
      }

      &.cancelled,
      &.refunded {
        background: #f8d7da;
        color: #721c24;
      }
    }
  }

  &__body {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-12 0;
    border-top: 1px solid $color-g-95;
    border-bottom: 1px solid $color-g-95;

    .order-items {
      display: flex;
      flex-direction: column;
      gap: $size-4;

      .items-count {
        font-size: $size-14;
        font-weight: 500;
        color: $color-g-44;
      }

      .items-preview {
        font-size: $size-12;
        color: $color-g-67;
        max-width: 180px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .order-total {
      text-align: right;

      .label {
        display: block;
        font-size: $size-12;
        color: $color-g-67;
        margin-bottom: $size-2;
      }

      .amount {
        font-size: $size-16;
        font-weight: 700;
        color: $color-pri;
      }
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $size-12;

    .pharmacy-info {
      display: flex;
      align-items: center;
      gap: $size-6;
      font-size: $size-12;
      color: $color-g-44;

      svg {
        width: $size-14;
        height: $size-14;
      }
    }

    .order-actions {
      display: flex;
      gap: $size-8;

      .action-btn {
        padding: $size-6 $size-12;
        font-size: $size-12;
        font-weight: 500;
        border-radius: $size-6;
        cursor: pointer;
        transition: all 0.2s ease;

        &.track-btn {
          display: flex;
          align-items: center;
          gap: $size-4;
          background: transparent;
          border: 1px solid $color-pri;
          color: $color-pri;

          svg {
            width: $size-12;
            height: $size-12;
          }

          &:hover {
            background: $color-pri-t4;
          }
        }

        &.view-btn {
          background: $color-pri;
          border: none;
          color: white;

          &:hover {
            background: darken($color-pri, 10%);
          }
        }
      }
    }
  }
}
</style>
