<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Track Order"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="track-order-page" v-if="!loading && order">
        <!-- Order Info Header -->
        <div class="order-header">
          <div class="order-info">
            <span class="order-number">{{ order.order_number }}</span>
            <span :class="['order-status', statusClass]">
              {{ formatStatus(order.status) }}
            </span>
          </div>
          <div class="estimated-time" v-if="estimatedTime">
            <RCIcon name="clock" />
            <span>{{ estimatedTime }}</span>
          </div>
        </div>

        <!-- Map View (Placeholder) -->
        <div class="map-section">
          <div class="map-placeholder">
            <RCIcon name="map" />
            <p>Live tracking map coming soon</p>
          </div>
          <div class="location-info">
            <div class="location-point from">
              <div class="point-indicator"></div>
              <div class="point-details">
                <span class="point-label">From</span>
                <span class="point-address">{{ order.pharmacy?.name }}</span>
              </div>
            </div>
            <div class="location-line"></div>
            <div class="location-point to">
              <div class="point-indicator"></div>
              <div class="point-details">
                <span class="point-label">To</span>
                <span class="point-address">{{ formattedDeliveryAddress }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Delivery Status -->
        <div class="section status-section">
          <h3 class="section-title">Delivery Status</h3>
          <div class="status-timeline">
            <div
              v-for="(step, index) in deliverySteps"
              :key="index"
              :class="['status-step', { completed: step.completed, current: step.current }]"
            >
              <div class="step-icon">
                <RCIcon :name="step.icon" />
              </div>
              <div class="step-content">
                <span class="step-title">{{ step.title }}</span>
                <span class="step-description">{{ step.description }}</span>
                <span class="step-time" v-if="step.time">{{ step.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Delivery Person (if out for delivery) -->
        <div class="section driver-section" v-if="order.status === 'OUT_FOR_DELIVERY' && order.delivery_person">
          <h3 class="section-title">Delivery Person</h3>
          <div class="driver-info">
            <div class="driver-avatar">
              <img v-if="order.delivery_person.photo" :src="order.delivery_person.photo" alt="Driver" />
              <RCIcon v-else name="user" />
            </div>
            <div class="driver-details">
              <span class="driver-name">{{ order.delivery_person.name }}</span>
              <span class="driver-vehicle" v-if="order.delivery_person.vehicle">
                {{ order.delivery_person.vehicle }}
              </span>
            </div>
            <button class="call-btn" @click="callDriver">
              <RCIcon name="phone" />
            </button>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="section summary-section">
          <h3 class="section-title">Order Summary</h3>
          <div class="summary-items">
            <div class="summary-item">
              <span class="label">Items</span>
              <span class="value">{{ order.items?.length || 0 }} item(s)</span>
            </div>
            <div class="summary-item">
              <span class="label">Total Amount</span>
              <span class="value">{{ formatPrice(order.total_amount) }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Payment</span>
              <span class="value">{{ formatPaymentStatus(order.payment_status) }}</span>
            </div>
          </div>
          <button class="view-details-btn" @click="viewOrderDetails">
            View Full Order Details
          </button>
        </div>

        <!-- Actions -->
        <div class="actions-section">
          <rc-button
            type="secondary"
            label="Contact Pharmacy"
            @click="contactPharmacy"
          />
          <rc-button
            type="outline"
            label="Need Help?"
            @click="contactSupport"
          />
        </div>
      </div>

      <!-- Loader -->
      <div class="loader-container" v-if="loading">
        <Loader :useOverlay="false" :rounded="true" />
      </div>

      <!-- Error State -->
      <div v-if="!loading && !order" class="error-state">
        <RCIcon name="alert-circle" />
        <h3>Order not found</h3>
        <p>We couldn't find the order you're looking for.</p>
        <rc-button
          type="primary"
          label="View My Orders"
          @click="$router.push('/app/patient/pharmacy/orders')"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";
import moment from "moment";

export default {
  name: "TrackOrder",
  components: {
    TopBar,
    RcButton,
    Loader,
    RCIcon,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const route = useRoute();
    let refreshInterval = null;

    const {
      "pharmacy/fetchOrderByNumber": fetchOrderByNumber,
    } = useMapActions();

    const {
      "pharmacy/getCurrentOrder": order,
      "pharmacy/getLoading": isLoading,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);

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
      };
      return statusClasses[order.value?.status] || "pending";
    });

    const estimatedTime = computed(() => {
      if (order.value?.estimated_delivery_time) {
        const est = moment(order.value.estimated_delivery_time);
        const now = moment();
        const diff = est.diff(now, 'minutes');

        if (diff > 0) {
          if (diff < 60) {
            return `Arriving in ~${diff} mins`;
          } else {
            return `Arriving by ${est.format('h:mm A')}`;
          }
        }
      }
      return null;
    });

    const formattedDeliveryAddress = computed(() => {
      const addr = order.value?.delivery_address;
      if (!addr) {
        return order.value?.delivery_method === 'PICKUP' ? 'Pickup Location' : 'No address provided';
      }

      // If it's a string, return as is
      if (typeof addr === 'string') {
        return addr;
      }

      // If it's an object, format it nicely
      if (typeof addr === 'object') {
        const parts = [];
        if (addr.recipient_name) parts.push(addr.recipient_name);
        if (addr.street) parts.push(addr.street);
        if (addr.city) parts.push(addr.city);
        if (addr.state && addr.state !== addr.city) parts.push(addr.state);
        if (addr.postal_code) parts.push(addr.postal_code);
        if (addr.country) parts.push(addr.country);

        return parts.join(', ') || 'No address provided';
      }

      return 'No address provided';
    });

    const deliverySteps = computed(() => {
      if (!order.value) return [];

      const status = order.value.status;
      const isPickup = order.value.delivery_method === 'PICKUP';

      const steps = [
        {
          icon: "check-circle",
          title: "Order Confirmed",
          description: "Your order has been confirmed by the pharmacy",
          completed: ["CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"].includes(status),
          current: status === "CONFIRMED",
        },
        {
          icon: "settings",
          title: "Preparing Order",
          description: "The pharmacy is preparing your medications",
          completed: ["PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"].includes(status),
          current: status === "PROCESSING",
        },
        {
          icon: isPickup ? "package" : "truck",
          title: isPickup ? "Ready for Pickup" : "Out for Delivery",
          description: isPickup ? "Your order is ready for pickup" : "Your order is on its way",
          completed: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"].includes(status),
          current: status === "READY_FOR_PICKUP" || status === "OUT_FOR_DELIVERY",
        },
        {
          icon: "check",
          title: isPickup ? "Picked Up" : "Delivered",
          description: isPickup ? "Order collected from pharmacy" : "Order delivered to your address",
          completed: ["DELIVERED", "COMPLETED"].includes(status),
          current: status === "DELIVERED" || status === "COMPLETED",
        },
      ];

      return steps;
    });

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
      };
      return statusMap[status] || status;
    };

    const formatPrice = (price) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(price || 0);
    };

    const formatPaymentStatus = (status) => {
      const statusMap = {
        PENDING: "Payment Pending",
        PAID: "Paid",
        FAILED: "Payment Failed",
        REFUNDED: "Refunded",
      };
      return statusMap[status] || status;
    };

    const viewOrderDetails = () => {
      if (order.value?._id) {
        // Route based on order type
        if (order.value.order_type === 'specialist_prescription') {
          router.push(`/app/patient/prescriptions/details/${order.value._id}`);
        } else {
          router.push(`/app/patient/pharmacy/orders/${order.value._id}`);
        }
      }
    };

    const callDriver = () => {
      if (order.value?.delivery_person?.phone) {
        window.location.href = `tel:${order.value.delivery_person.phone}`;
      }
    };

    const contactPharmacy = () => {
      if (order.value?.pharmacy?.phone) {
        window.location.href = `tel:${order.value.pharmacy.phone}`;
      }
    };

    const contactSupport = () => {
      alert("Support feature coming soon!");
    };

    const fetchOrder = async () => {
      const orderNumber = route.params.orderNumber;
      if (orderNumber) {
        await fetchOrderByNumber(orderNumber);
      }
    };

    onMounted(() => {
      fetchOrder();
      // Auto-refresh every 30 seconds for real-time tracking
      refreshInterval = setInterval(fetchOrder, 30000);
    });

    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    });

    return {
      order,
      loading,
      statusClass,
      estimatedTime,
      formattedDeliveryAddress,
      deliverySteps,
      formatStatus,
      formatPrice,
      formatPaymentStatus,
      viewOrderDetails,
      callDriver,
      contactPharmacy,
      contactSupport,
    };
  },
};
</script>

<style scoped lang="scss">
.track-order-page {
  padding: $size-16;

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-16;
    background: $color-white;
    border-radius: $size-12;
    margin-bottom: $size-16;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .order-info {
      display: flex;
      flex-direction: column;
      gap: $size-6;

      .order-number {
        font-size: $size-16;
        font-weight: 700;
        color: $color-g-21;
      }

      .order-status {
        font-size: $size-12;
        font-weight: 600;
        padding: $size-4 $size-10;
        border-radius: $size-4;
        width: fit-content;

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

        &.cancelled {
          background: #f8d7da;
          color: #721c24;
        }
      }
    }

    .estimated-time {
      display: flex;
      align-items: center;
      gap: $size-6;
      padding: $size-8 $size-12;
      background: $color-pri-t4;
      border-radius: $size-8;

      svg {
        width: $size-16;
        height: $size-16;
        color: $color-pri;
      }

      span {
        font-size: $size-14;
        font-weight: 600;
        color: $color-pri;
      }
    }
  }

  .map-section {
    background: $color-white;
    border-radius: $size-12;
    margin-bottom: $size-16;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .map-placeholder {
      height: 200px;
      background: $color-g-95;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: $size-8;

      svg {
        width: $size-48;
        height: $size-48;
        color: $color-g-67;
      }

      p {
        font-size: $size-14;
        color: $color-g-67;
      }
    }

    .location-info {
      padding: $size-16;

      .location-point {
        display: flex;
        align-items: center;
        gap: $size-12;

        .point-indicator {
          width: $size-12;
          height: $size-12;
          border-radius: 50%;
          flex-shrink: 0;
        }

        &.from .point-indicator {
          background: $color-pri;
        }

        &.to .point-indicator {
          background: $color-denote-green;
        }

        .point-details {
          .point-label {
            display: block;
            font-size: $size-11;
            color: $color-g-67;
            text-transform: uppercase;
          }

          .point-address {
            font-size: $size-14;
            color: $color-g-21;
            font-weight: 500;
          }
        }
      }

      .location-line {
        width: 2px;
        height: $size-24;
        background: $color-g-85;
        margin-left: $size-5;
      }
    }
  }

  .section {
    background: $color-white;
    border-radius: $size-12;
    padding: $size-16;
    margin-bottom: $size-16;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .section-title {
      font-size: $size-16;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: $size-16;
    }
  }

  .status-section {
    .status-timeline {
      .status-step {
        display: flex;
        gap: $size-16;
        padding-bottom: $size-20;
        position: relative;

        &:not(:last-child)::after {
          content: "";
          position: absolute;
          left: $size-18;
          top: $size-40;
          width: 2px;
          height: calc(100% - $size-40);
          background: $color-g-85;
        }

        &.completed::after {
          background: $color-denote-green;
        }

        &:last-child {
          padding-bottom: 0;
        }

        .step-icon {
          width: $size-36;
          height: $size-36;
          background: $color-g-85;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          svg {
            width: $size-18;
            height: $size-18;
            color: white;
          }
        }

        .step-content {
          .step-title {
            display: block;
            font-size: $size-14;
            color: $color-g-67;
            margin-bottom: $size-2;
          }

          .step-description {
            display: block;
            font-size: $size-12;
            color: $color-g-85;
          }

          .step-time {
            display: block;
            font-size: $size-11;
            color: $color-g-67;
            margin-top: $size-4;
          }
        }

        &.completed {
          .step-icon {
            background: $color-denote-green;
          }

          .step-title {
            color: $color-g-21;
            font-weight: 500;
          }

          .step-description {
            color: $color-g-67;
          }
        }

        &.current {
          .step-icon {
            background: $color-pri;
            animation: pulse 2s infinite;
          }

          .step-title {
            color: $color-pri;
            font-weight: 600;
          }
        }
      }
    }
  }

  .driver-section {
    .driver-info {
      display: flex;
      align-items: center;
      gap: $size-12;

      .driver-avatar {
        width: $size-48;
        height: $size-48;
        border-radius: 50%;
        background: $color-g-95;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        svg {
          width: $size-24;
          height: $size-24;
          color: $color-g-67;
        }
      }

      .driver-details {
        flex: 1;

        .driver-name {
          display: block;
          font-size: $size-15;
          font-weight: 600;
          color: $color-g-21;
        }

        .driver-vehicle {
          font-size: $size-14;
          color: $color-g-67;
        }
      }

      .call-btn {
        width: $size-44;
        height: $size-44;
        background: $color-denote-green;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        svg {
          width: $size-20;
          height: $size-20;
          color: white;
        }
      }
    }
  }

  .summary-section {
    .summary-items {
      margin-bottom: $size-16;

      .summary-item {
        display: flex;
        justify-content: space-between;
        padding: $size-10 0;
        border-bottom: 1px solid $color-g-95;

        &:last-child {
          border-bottom: none;
        }

        .label {
          font-size: $size-14;
          color: $color-g-67;
        }

        .value {
          font-size: $size-14;
          font-weight: 500;
          color: $color-g-21;
        }
      }
    }

    .view-details-btn {
      width: 100%;
      padding: $size-12;
      background: transparent;
      border: 1px solid $color-pri;
      border-radius: $size-8;
      color: $color-pri;
      font-size: $size-14;
      font-weight: 500;
      cursor: pointer;

      &:hover {
        background: $color-pri-t4;
      }
    }
  }

  .actions-section {
    margin-top: $size-8;

    button {
      width: 100%;
      margin-bottom: $size-12;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: $size-48;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $size-48;
  text-align: center;

  svg {
    width: $size-64;
    height: $size-64;
    color: $color-g-67;
    margin-bottom: $size-16;
  }

  h3 {
    font-size: $size-20;
    font-weight: 600;
    margin-bottom: $size-8;
  }

  p {
    color: $color-g-67;
    margin-bottom: $size-24;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba($color-pri, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba($color-pri, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba($color-pri, 0);
  }
}
</style>
