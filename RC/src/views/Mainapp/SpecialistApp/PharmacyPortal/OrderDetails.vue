<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Order Details"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="order-details-page" v-if="!loading && order">
        <!-- Order Header -->
        <div class="order-header-card">
          <div class="order-main-info">
            <h2>{{ order.order_number }}</h2>
            <div :class="['order-status', statusClass]">
              {{ formatStatus(order.status) }}
            </div>
          </div>
          <div class="order-meta">
            <span><RCIcon name="calendar" /> {{ formatDate(order.created_at) }}</span>
            <span><RCIcon name="clock" /> {{ formatTime(order.created_at) }}</span>
          </div>
        </div>

        <!-- Customer Information -->
        <div class="section-card">
          <h3>Customer Information</h3>
          <div class="customer-details">
            <div class="detail-row">
              <span class="label">Name</span>
              <span class="value">
                {{ order.patient?.profile?.first_name }} {{ order.patient?.profile?.last_name }}
              </span>
            </div>
            <div class="detail-row">
              <span class="label">Phone</span>
              <span class="value">{{ order.patient?.profile?.phone_number || 'N/A' }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Email</span>
              <span class="value">{{ order.patient?.email || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Delivery Information -->
        <div class="section-card">
          <h3>Delivery Information</h3>
          <div class="delivery-details">
            <div class="delivery-type">
              <RCIcon :name="order.delivery_type === 'DELIVERY' ? 'truck' : 'package'" />
              <span>{{ order.delivery_type === 'DELIVERY' ? 'Home Delivery' : 'In-Store Pickup' }}</span>
            </div>
            <div class="detail-row" v-if="order.delivery_type === 'DELIVERY'">
              <span class="label">Address</span>
              <span class="value">{{ formatAddress(order.delivery_address) }}</span>
            </div>
            <div class="detail-row" v-if="order.delivery_notes">
              <span class="label">Notes</span>
              <span class="value">{{ order.delivery_notes }}</span>
            </div>
          </div>
        </div>

        <!-- Order Items -->
        <div class="section-card">
          <h3>Order Items</h3>
          <div class="items-list">
            <div
              v-for="(item, index) in order.items"
              :key="index"
              class="order-item"
            >
              <div class="item-info">
                <span class="item-name">{{ item.drug_name }}</span>
                <span class="item-details">
                  {{ item.strength }} {{ item.dosage_form }} x {{ item.quantity }}
                </span>
              </div>
              <div class="item-price">{{ formatPrice(item.unit_price * item.quantity) }}</div>
            </div>
          </div>
          <div class="order-totals">
            <div class="total-row">
              <span>Subtotal</span>
              <span>{{ formatPrice(order.subtotal) }}</span>
            </div>
            <div class="total-row" v-if="order.delivery_fee > 0">
              <span>Delivery Fee</span>
              <span>{{ formatPrice(order.delivery_fee) }}</span>
            </div>
            <div class="total-row" v-if="order.discount > 0">
              <span>Discount</span>
              <span>-{{ formatPrice(order.discount) }}</span>
            </div>
            <div class="total-row grand-total">
              <span>Total</span>
              <span>{{ formatPrice(order.total_amount) }}</span>
            </div>
          </div>
        </div>

        <!-- Prescription Information -->
        <div class="section-card" v-if="order.prescription">
          <h3>Prescription</h3>
          <div class="prescription-info">
            <div class="detail-row">
              <span class="label">Prescription ID</span>
              <span class="value">{{ order.prescription.prescription_number }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Prescribing Doctor</span>
              <span class="value">Dr. {{ order.prescription.specialist?.profile?.first_name }} {{ order.prescription.specialist?.profile?.last_name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date</span>
              <span class="value">{{ formatDate(order.prescription.created_at) }}</span>
            </div>
            <button class="view-prescription-btn" @click="viewPrescription">
              <RCIcon name="document" />
              View Full Prescription
            </button>
          </div>
        </div>

        <!-- Order Timeline -->
        <div class="section-card">
          <h3>Order Timeline</h3>
          <div class="timeline">
            <div
              v-for="(event, index) in orderTimeline"
              :key="index"
              :class="['timeline-item', { completed: event.completed, current: event.current }]"
            >
              <div class="timeline-marker">
                <RCIcon :name="event.completed || event.current ? 'check-circle' : 'circle'" />
              </div>
              <div class="timeline-content">
                <span class="event-title">{{ event.title }}</span>
                <span class="event-time" v-if="event.time">{{ formatDateTime(event.time) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <rc-button
            v-if="order.status === 'PENDING'"
            type="primary"
            label="Confirm Order"
            @click="updateStatus('CONFIRMED')"
          />
          <rc-button
            v-if="order.status === 'CONFIRMED'"
            type="primary"
            label="Start Processing"
            @click="updateStatus('PROCESSING')"
          />
          <rc-button
            v-if="order.status === 'PROCESSING'"
            type="primary"
            label="Mark as Ready"
            @click="updateStatus('READY_FOR_PICKUP')"
          />
          <rc-button
            v-if="order.status === 'READY_FOR_PICKUP' && order.delivery_type === 'DELIVERY'"
            type="primary"
            label="Dispatch for Delivery"
            @click="updateStatus('OUT_FOR_DELIVERY')"
          />
          <rc-button
            v-if="order.status === 'READY_FOR_PICKUP' && order.delivery_type === 'PICKUP'"
            type="primary"
            label="Mark as Completed"
            @click="updateStatus('COMPLETED')"
          />
          <rc-button
            v-if="order.status === 'OUT_FOR_DELIVERY'"
            type="primary"
            label="Mark as Delivered"
            @click="updateStatus('DELIVERED')"
          />
          <rc-button
            v-if="order.status === 'DELIVERED'"
            type="primary"
            label="Complete Order"
            @click="updateStatus('COMPLETED')"
          />
          <rc-button
            v-if="canCancel"
            type="secondary"
            label="Cancel Order"
            @click="showCancelModal = true"
          />
          <rc-button
            type="secondary"
            label="Print Order"
            @click="printOrder"
          />
        </div>
      </div>

      <!-- Loader -->
      <div class="loader-container" v-if="loading">
        <Loader :useOverlay="false" :rounded="true" />
      </div>
    </div>

    <!-- Cancel Modal -->
    <div class="modal-overlay" v-if="showCancelModal" @click="showCancelModal = false">
      <div class="modal-content" @click.stop>
        <h3>Cancel Order</h3>
        <p>Are you sure you want to cancel this order?</p>
        <textarea
          v-model="cancelReason"
          placeholder="Enter reason for cancellation..."
          rows="3"
        ></textarea>
        <div class="modal-actions">
          <rc-button type="secondary" label="Back" @click="showCancelModal = false" />
          <rc-button type="primary" label="Cancel Order" @click="cancelOrder" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
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
  name: "PharmacyOrderDetails",
  components: {
    TopBar,
    RcButton,
    Loader,
    RCIcon,
  },
  emits: ["openSideNav"],
  setup() {
    const route = useRoute();
    const router = useRouter();
    const showCancelModal = ref(false);
    const cancelReason = ref("");

    const {
      "pharmacyPortal/fetchOrderDetails": fetchOrderDetails,
      "pharmacyPortal/updateOrderStatus": updateOrderStatusAction,
      "pharmacyPortal/cancelOrder": cancelOrderAction,
    } = useMapActions();

    const {
      "pharmacyPortal/getCurrentOrder": currentOrder,
      "pharmacyPortal/getLoading": isLoading,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);
    const order = computed(() => currentOrder.value);

    const formatPrice = (price) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(price || 0);
    };

    const formatDate = (date) => moment(date).format("MMM D, YYYY");
    const formatTime = (date) => moment(date).format("h:mm A");
    const formatDateTime = (date) => moment(date).format("MMM D, YYYY h:mm A");

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
      return statusClasses[order.value?.status] || "pending";
    });

    const formatAddress = (address) => {
      if (!address) return "N/A";
      return `${address.street}, ${address.city}, ${address.state}`;
    };

    const canCancel = computed(() =>
      ["PENDING", "CONFIRMED"].includes(order.value?.status)
    );

    const orderTimeline = computed(() => {
      if (!order.value) return [];

      const statusOrder = ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"];
      const statusTitles = {
        PENDING: "Order Placed",
        CONFIRMED: "Order Confirmed",
        PROCESSING: "Processing",
        READY_FOR_PICKUP: "Ready for Pickup/Delivery",
        OUT_FOR_DELIVERY: "Out for Delivery",
        DELIVERED: "Delivered",
        COMPLETED: "Completed",
      };

      const currentIndex = statusOrder.indexOf(order.value.status);
      const history = order.value.status_history || [];

      return statusOrder.slice(0, 7).map((status, index) => {
        const historyEntry = history.find((h) => h.status === status);
        return {
          title: statusTitles[status],
          completed: index < currentIndex,
          current: index === currentIndex,
          time: historyEntry?.timestamp,
        };
      });
    });

    const updateStatus = async (newStatus) => {
      try {
        await updateOrderStatusAction({
          orderId: route.params.id,
          status: newStatus,
        });
        await fetchOrderDetails(route.params.id);
      } catch (error) {
        console.error("Error updating status:", error);
      }
    };

    const cancelOrder = async () => {
      try {
        await cancelOrderAction({
          orderId: route.params.id,
          reason: cancelReason.value,
        });
        showCancelModal.value = false;
        await fetchOrderDetails(route.params.id);
      } catch (error) {
        console.error("Error cancelling order:", error);
      }
    };

    const viewPrescription = () => {
      if (order.value?.prescription?._id) {
        router.push(`/app/specialist/pharmacy-portal/prescriptions/${order.value.prescription._id}`);
      }
    };

    const printOrder = () => {
      window.print();
    };

    onMounted(() => {
      fetchOrderDetails(route.params.id);
    });

    return {
      order,
      loading,
      showCancelModal,
      cancelReason,
      statusClass,
      orderTimeline,
      canCancel,
      formatPrice,
      formatDate,
      formatTime,
      formatDateTime,
      formatStatus,
      formatAddress,
      updateStatus,
      cancelOrder,
      viewPrescription,
      printOrder,
    };
  },
};
</script>

<style scoped lang="scss">
.order-details-page {
  padding: $size-16;

  .order-header-card {
    background: $color-white;
    border-radius: $size-12;
    padding: $size-20;
    margin-bottom: $size-16;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .order-main-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $size-12;

      h2 {
        font-size: $size-20;
        font-weight: 700;
        color: $color-g-21;
      }

      .order-status {
        font-size: $size-12;
        font-weight: 600;
        padding: $size-6 $size-12;
        border-radius: $size-6;

        &.pending { background: #fff3cd; color: #856404; }
        &.confirmed, &.processing { background: #cce5ff; color: #004085; }
        &.ready { background: #d1ecf1; color: #0c5460; }
        &.delivery { background: #d4edda; color: #155724; }
        &.delivered, &.completed { background: #d4edda; color: #155724; }
        &.cancelled, &.refunded { background: #f8d7da; color: #721c24; }
      }
    }

    .order-meta {
      display: flex;
      gap: $size-16;

      span {
        display: flex;
        align-items: center;
        gap: $size-6;
        font-size: $size-14;
        color: $color-g-67;

        svg {
          width: $size-14;
          height: $size-14;
        }
      }
    }
  }

  .section-card {
    background: $color-white;
    border-radius: $size-12;
    padding: $size-20;
    margin-bottom: $size-16;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    h3 {
      font-size: $size-16;
      font-weight: 600;
      margin-bottom: $size-16;
      padding-bottom: $size-12;
      border-bottom: 1px solid $color-g-95;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: $size-8 0;

      .label {
        color: $color-g-67;
        font-size: $size-14;
      }

      .value {
        color: $color-g-21;
        font-size: $size-14;
        font-weight: 500;
        text-align: right;
        max-width: 60%;
      }
    }

    .delivery-type {
      display: flex;
      align-items: center;
      gap: $size-8;
      padding: $size-12;
      background: $color-g-95;
      border-radius: $size-8;
      margin-bottom: $size-12;

      svg {
        width: $size-20;
        height: $size-20;
        color: $color-pri;
      }

      span {
        font-size: $size-14;
        font-weight: 500;
      }
    }
  }

  .items-list {
    margin-bottom: $size-16;

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $size-12 0;
      border-bottom: 1px solid $color-g-95;

      &:last-child {
        border-bottom: none;
      }

      .item-info {
        .item-name {
          display: block;
          font-size: $size-14;
          font-weight: 500;
          color: $color-g-21;
        }

        .item-details {
          display: block;
          font-size: $size-12;
          color: $color-g-67;
          margin-top: $size-2;
        }
      }

      .item-price {
        font-size: $size-14;
        font-weight: 600;
        color: $color-g-21;
      }
    }
  }

  .order-totals {
    padding-top: $size-12;
    border-top: 1px solid $color-g-85;

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: $size-6 0;
      font-size: $size-14;

      &.grand-total {
        font-size: $size-16;
        font-weight: 700;
        color: $color-pri;
        padding-top: $size-12;
        margin-top: $size-8;
        border-top: 1px solid $color-g-95;
      }
    }
  }

  .view-prescription-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-8;
    width: 100%;
    padding: $size-12;
    margin-top: $size-12;
    border: 1px solid $color-pri;
    border-radius: $size-8;
    background: transparent;
    color: $color-pri;
    font-size: $size-14;
    font-weight: 500;
    cursor: pointer;

    svg {
      width: $size-16;
      height: $size-16;
    }

    &:hover {
      background: $color-pri-t4;
    }
  }

  .timeline {
    .timeline-item {
      display: flex;
      gap: $size-12;
      padding: $size-12 0;
      position: relative;

      &:not(:last-child)::before {
        content: "";
        position: absolute;
        left: $size-12;
        top: $size-32;
        bottom: 0;
        width: 2px;
        background: $color-g-85;
      }

      &.completed::before,
      &.current::before {
        background: $color-pri;
      }

      .timeline-marker {
        svg {
          width: $size-24;
          height: $size-24;
          color: $color-g-85;
        }
      }

      &.completed .timeline-marker svg,
      &.current .timeline-marker svg {
        color: $color-pri;
      }

      .timeline-content {
        flex: 1;

        .event-title {
          display: block;
          font-size: $size-14;
          font-weight: 500;
          color: $color-g-44;
        }

        .event-time {
          display: block;
          font-size: $size-12;
          color: $color-g-67;
          margin-top: $size-2;
        }
      }

      &.completed .timeline-content .event-title,
      &.current .timeline-content .event-title {
        color: $color-g-21;
      }
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: $size-12;
    padding-top: $size-16;

    button {
      width: 100%;
    }
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .modal-content {
    background: $color-white;
    border-radius: $size-16;
    padding: $size-24;
    width: 90%;
    max-width: 400px;

    h3 {
      font-size: $size-18;
      font-weight: 600;
      margin-bottom: $size-12;
    }

    p {
      color: $color-g-67;
      margin-bottom: $size-16;
    }

    textarea {
      width: 100%;
      padding: $size-12;
      border: 1px solid $color-g-85;
      border-radius: $size-8;
      font-size: $size-14;
      resize: none;
      margin-bottom: $size-16;

      &:focus {
        outline: none;
        border-color: $color-pri;
      }
    }

    .modal-actions {
      display: flex;
      gap: $size-12;

      button {
        flex: 1;
      }
    }
  }
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: $size-48;
}

@media print {
  .action-buttons,
  .modal-overlay {
    display: none;
  }
}
</style>
