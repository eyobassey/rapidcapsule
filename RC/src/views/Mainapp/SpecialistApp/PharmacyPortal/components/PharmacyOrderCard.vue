<template>
  <div class="pharmacy-order-card" @click="$emit('view-details', order._id)">
    <div class="order-header">
      <div class="order-info">
        <span class="order-number">{{ order.order_number }}</span>
        <span class="order-date">{{ formatDate(order.created_at) }}</span>
      </div>
      <div :class="['order-status', statusClass]">
        {{ formatStatus(order.status) }}
      </div>
    </div>

    <div class="order-body">
      <div class="customer-info">
        <RCIcon name="user" />
        <div class="customer-details">
          <span class="customer-name">{{ order.patient?.profile?.first_name }} {{ order.patient?.profile?.last_name }}</span>
          <span class="customer-phone">{{ order.patient?.profile?.phone_number }}</span>
        </div>
      </div>
      <div class="order-items">
        <span class="items-count">{{ order.items?.length || 0 }} item(s)</span>
        <span class="total-amount">{{ formatPrice(order.total_amount) }}</span>
      </div>
    </div>

    <div class="order-footer">
      <div class="delivery-info">
        <RCIcon :name="order.delivery_type === 'DELIVERY' ? 'truck' : 'package'" />
        <span>{{ order.delivery_type === 'DELIVERY' ? 'Delivery' : 'Pickup' }}</span>
      </div>
      <div class="order-actions" @click.stop>
        <button
          v-if="canConfirm"
          class="action-btn confirm"
          @click="$emit('update-status', { orderId: order._id, status: 'CONFIRMED' })"
        >
          Confirm
        </button>
        <button
          v-if="canProcess"
          class="action-btn process"
          @click="$emit('update-status', { orderId: order._id, status: 'PROCESSING' })"
        >
          Start Processing
        </button>
        <button
          v-if="canMarkReady"
          class="action-btn ready"
          @click="$emit('update-status', { orderId: order._id, status: 'READY_FOR_PICKUP' })"
        >
          Mark Ready
        </button>
        <button
          v-if="canDispatch"
          class="action-btn dispatch"
          @click="$emit('update-status', { orderId: order._id, status: 'OUT_FOR_DELIVERY' })"
        >
          Dispatch
        </button>
        <button
          v-if="canComplete"
          class="action-btn complete"
          @click="$emit('update-status', { orderId: order._id, status: 'COMPLETED' })"
        >
          Complete
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
  name: "PharmacyOrderCard",
  components: { RCIcon },
  props: {
    order: {
      type: Object,
      required: true,
    },
  },
  emits: ["view-details", "update-status"],
  setup(props) {
    const formatPrice = (price) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(price || 0);
    };

    const formatDate = (date) => {
      return moment(date).format("MMM D, YYYY h:mm A");
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

    const canConfirm = computed(() => props.order.status === "PENDING");
    const canProcess = computed(() => props.order.status === "CONFIRMED");
    const canMarkReady = computed(() => props.order.status === "PROCESSING");
    const canDispatch = computed(() =>
      props.order.status === "READY_FOR_PICKUP" && props.order.delivery_type === "DELIVERY"
    );
    const canComplete = computed(() =>
      props.order.status === "READY_FOR_PICKUP" && props.order.delivery_type === "PICKUP" ||
      props.order.status === "OUT_FOR_DELIVERY" || props.order.status === "DELIVERED"
    );

    return {
      formatPrice,
      formatDate,
      formatStatus,
      statusClass,
      canConfirm,
      canProcess,
      canMarkReady,
      canDispatch,
      canComplete,
    };
  },
});
</script>

<style scoped lang="scss">
.pharmacy-order-card {
  background: $color-white;
  border-radius: $size-10;
  padding: $size-16;
  border: 1px solid $color-g-95;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $color-pri;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .order-header {
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
      font-size: $size-11;
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

      &.ready {
        background: #d1ecf1;
        color: #0c5460;
      }

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

  .order-body {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-12 0;
    border-top: 1px solid $color-g-95;
    border-bottom: 1px solid $color-g-95;

    .customer-info {
      display: flex;
      align-items: center;
      gap: $size-8;

      svg {
        width: $size-20;
        height: $size-20;
        color: $color-g-67;
      }

      .customer-details {
        display: flex;
        flex-direction: column;

        .customer-name {
          font-size: $size-14;
          font-weight: 500;
          color: $color-g-21;
        }

        .customer-phone {
          font-size: $size-12;
          color: $color-g-67;
        }
      }
    }

    .order-items {
      text-align: right;

      .items-count {
        display: block;
        font-size: $size-12;
        color: $color-g-67;
      }

      .total-amount {
        display: block;
        font-size: $size-16;
        font-weight: 700;
        color: $color-pri;
      }
    }
  }

  .order-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: $size-12;

    .delivery-info {
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
        border: none;

        &.confirm {
          background: #cce5ff;
          color: #004085;

          &:hover {
            background: #b3d9ff;
          }
        }

        &.process {
          background: #d1ecf1;
          color: #0c5460;

          &:hover {
            background: #bee5eb;
          }
        }

        &.ready {
          background: #d4edda;
          color: #155724;

          &:hover {
            background: #c3e6cb;
          }
        }

        &.dispatch {
          background: $color-pri;
          color: white;

          &:hover {
            background: darken($color-pri, 10%);
          }
        }

        &.complete {
          background: #28a745;
          color: white;

          &:hover {
            background: #218838;
          }
        }
      }
    }
  }
}
</style>
