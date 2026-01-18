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
        <div class="order-header">
          <div class="order-number">
            <span class="label">Order Number</span>
            <span class="value">{{ order.order_number }}</span>
          </div>
          <div :class="['order-status', statusClass]">
            {{ formatStatus(order.status) }}
          </div>
        </div>

        <!-- Order Timeline -->
        <div class="section timeline-section">
          <h3 class="section-title">Order Timeline</h3>
          <div class="timeline">
            <div
              v-for="(step, index) in orderTimeline"
              :key="index"
              :class="['timeline-step', { completed: step.completed, current: step.current }]"
            >
              <div class="step-indicator">
                <RCIcon :name="step.completed ? 'check' : step.icon" />
              </div>
              <div class="step-content">
                <span class="step-title">{{ step.title }}</span>
                <span class="step-date" v-if="step.date">{{ formatDateTime(step.date) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Items -->
        <div class="section items-section">
          <h3 class="section-title">Order Items</h3>
          <div class="order-items">
            <div v-for="item in order.items" :key="item._id" class="order-item">
              <div class="item-image">
                <img v-if="item.drug_image" :src="item.drug_image" :alt="item.drug_name" @error="$event.target.style.display='none'" />
                <svg v-if="!item.drug_image" class="pill-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 9.5L14.5 5.5M8.5 11.5L3.79289 16.2071C2.60948 17.3905 2.60948 19.3095 3.79289 20.4929C4.97631 21.6763 6.89526 21.6763 8.07868 20.4929L12.7858 15.7858M11.2142 8.21421L15.2142 4.21421C16.3976 3.0308 18.3166 3.0308 19.5 4.21421C20.6834 5.39763 20.6834 7.31658 19.5 8.5L15.5 12.5M10.5 13.5L13.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="item-details">
                <h4>{{ item.drug_name }}</h4>
                <p>{{ item.strength }} {{ formatDosageForm(item.dosage_form) }}</p>
                <span class="item-manufacturer" v-if="item.manufacturer">{{ item.manufacturer }}</span>
                <span class="item-qty">Qty: {{ item.quantity }}</span>
              </div>
              <div class="item-price">
                {{ formatPrice(item.unit_price * item.quantity) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Verification Notice -->
        <div class="section verification-notice-section" v-if="order.requires_pharmacist_review || (order.verification_score && order.verification_score < 90)">
          <div class="verification-notice">
            <RCIcon name="alert-circle" />
            <div class="notice-content">
              <h4>Prescription Verification Notice</h4>
              <p>Your prescription is subject to secondary verification by our licensed Pharmacist before processing. You or your prescriber may be contacted if any clarification is needed.</p>
              <span class="verification-score" v-if="order.verification_score">
                Verification Score: {{ order.verification_score }}%
              </span>
            </div>
          </div>
        </div>

        <!-- Drug Interaction Warnings -->
        <div class="section interaction-section" v-if="order.has_interaction_warnings && order.drug_interactions && order.drug_interactions.length > 0">
          <h3 class="section-title warning-title">Drug Interaction Warnings</h3>
          <p class="interaction-disclaimer">The following potential drug interactions were detected. Please consult with your pharmacist or healthcare provider.</p>
          <div class="interaction-list">
            <div
              v-for="(interaction, index) in order.drug_interactions"
              :key="index"
              :class="['interaction-card', getSeverityClass(interaction.severity)]"
            >
              <div class="interaction-header">
                <span class="drug-names">{{ interaction.drug1_name }} + {{ interaction.drug2_name }}</span>
                <span :class="['severity-badge', interaction.severity?.toLowerCase()]">{{ interaction.severity }}</span>
              </div>
              <p class="interaction-description">{{ interaction.description }}</p>
              <p class="interaction-recommendation" v-if="interaction.recommendation">
                <strong>Recommendation:</strong> {{ interaction.recommendation }}
              </p>
            </div>
          </div>
        </div>

        <!-- Drug Safety Info -->
        <div class="section safety-section" v-if="order.drug_safety_info && order.drug_safety_info.length > 0">
          <h3 class="section-title">Medication Safety Information</h3>
          <div class="safety-list">
            <div v-for="(drug, index) in order.drug_safety_info" :key="index" class="safety-card">
              <h4 class="drug-name">{{ drug.drug_name }}</h4>

              <!-- Boxed Warning -->
              <div class="boxed-warning" v-if="drug.boxed_warning">
                <RCIcon name="alert-triangle" />
                <div>
                  <strong>BOXED WARNING</strong>
                  <p>{{ drug.boxed_warning }}</p>
                </div>
              </div>

              <!-- AI Summary -->
              <div class="ai-summary" v-if="drug.ai_summary">
                <div class="summary-section" v-if="drug.ai_summary.key_points && drug.ai_summary.key_points.length > 0">
                  <strong>Key Points:</strong>
                  <ul>
                    <li v-for="(point, i) in drug.ai_summary.key_points.slice(0, 3)" :key="i">{{ point }}</li>
                  </ul>
                </div>

                <div class="summary-section side-effects" v-if="drug.ai_summary.common_side_effects && drug.ai_summary.common_side_effects.length > 0">
                  <strong>Common Side Effects:</strong>
                  <span class="effects-list">{{ drug.ai_summary.common_side_effects.slice(0, 5).join(', ') }}</span>
                </div>

                <div class="summary-section warnings" v-if="drug.ai_summary.serious_warnings && drug.ai_summary.serious_warnings.length > 0">
                  <strong>Important Warnings:</strong>
                  <ul>
                    <li v-for="(warning, i) in drug.ai_summary.serious_warnings.slice(0, 2)" :key="i">{{ warning }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Download PDF -->
        <div class="section pdf-section" v-if="order.confirmation_pdf_url">
          <div class="pdf-download">
            <div class="pdf-info">
              <RCIcon name="file-text" />
              <div>
                <h4>Order Confirmation PDF</h4>
                <p>Download your complete order details</p>
              </div>
            </div>
            <button class="download-btn" @click="downloadPdf" :disabled="downloadingPdf">
              <RCIcon :name="downloadingPdf ? 'loader' : 'download'" :class="{ 'spin': downloadingPdf }" />
              {{ downloadingPdf ? 'Downloading...' : 'Download' }}
            </button>
          </div>
        </div>

        <!-- Pharmacy Info -->
        <div class="section pharmacy-section" v-if="order.pharmacy">
          <h3 class="section-title">Pharmacy</h3>
          <div class="pharmacy-info">
            <div class="pharmacy-details">
              <h4>{{ order.pharmacy.name }}</h4>
              <p>{{ formatAddress(order.pharmacy.address) }}</p>
              <p v-if="order.pharmacy.phone">{{ order.pharmacy.phone }}</p>
            </div>
            <button class="contact-btn" @click="contactPharmacy">
              <RCIcon name="phone" />
              Call
            </button>
          </div>
        </div>

        <!-- Delivery Info -->
        <div class="section delivery-section">
          <h3 class="section-title">Delivery Information</h3>
          <div class="delivery-info">
            <div class="info-row">
              <span class="label">Method:</span>
              <span class="value">{{ formatDeliveryMethod(order.delivery_method) }}</span>
            </div>
            <div class="info-row" v-if="order.delivery_method === 'DELIVERY'">
              <span class="label">Address:</span>
              <span class="value">{{ formatAddress(order.delivery_address) }}</span>
            </div>
            <div class="info-row" v-if="order.estimated_delivery_time">
              <span class="label">Estimated Delivery:</span>
              <span class="value">{{ formatDateTime(order.estimated_delivery_time) }}</span>
            </div>
            <div class="info-row" v-if="getContactName(order)">
              <span class="label">Contact Name:</span>
              <span class="value">{{ getContactName(order) }}</span>
            </div>
            <div class="info-row" v-if="getContactPhone(order)">
              <span class="label">Contact Phone:</span>
              <span class="value">{{ getContactPhone(order) }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Summary -->
        <div class="section payment-section">
          <h3 class="section-title">Payment Summary</h3>
          <div class="payment-info">
            <div class="payment-row">
              <span>Subtotal</span>
              <span>{{ formatPrice(order.subtotal) }}</span>
            </div>
            <div class="payment-row" v-if="order.delivery_fee">
              <span>Delivery Fee</span>
              <span>{{ formatPrice(order.delivery_fee) }}</span>
            </div>
            <div class="payment-row" v-if="order.discount_amount">
              <span>Discount</span>
              <span class="discount">-{{ formatPrice(order.discount_amount) }}</span>
            </div>
            <div class="payment-row total">
              <span>Total</span>
              <span>{{ formatPrice(order.total_amount) }}</span>
            </div>
            <div class="payment-status">
              <span class="label">Payment Status:</span>
              <span :class="['status', order.payment_status?.toLowerCase()]">
                {{ formatPaymentStatus(order.payment_status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Special Instructions -->
        <div class="section instructions-section" v-if="order.special_instructions">
          <h3 class="section-title">Special Instructions</h3>
          <p class="instructions-text">{{ order.special_instructions }}</p>
        </div>

        <!-- Rating Section -->
        <div class="section rating-section" v-if="canRate || order.rating">
          <h3 class="section-title">{{ order.rating ? 'Your Rating' : 'Rate Your Experience' }}</h3>

          <!-- Already rated display -->
          <div v-if="order.rating" class="rating-display">
            <div class="stars-display">
              <span v-for="star in 5" :key="star" class="star filled" v-if="star <= order.rating">⭐</span>
              <span v-for="star in 5" :key="'empty-' + star" class="star empty" v-if="star > order.rating">☆</span>
            </div>
            <p class="rating-value">{{ order.rating }}/5</p>
            <p class="review-text" v-if="order.review">{{ order.review }}</p>
            <p class="rated-date" v-if="order.rated_at">Rated on {{ formatDateTime(order.rated_at) }}</p>
          </div>

          <!-- Rating form -->
          <div v-else class="rating-form">
            <p class="rating-prompt">How was your experience with {{ order.pharmacy?.name || 'this pharmacy' }}?</p>

            <div class="star-rating">
              <button
                v-for="star in 5"
                :key="star"
                :class="['star-btn', { active: star <= selectedRating, hover: star <= hoverRating }]"
                @mouseenter="hoverRating = star"
                @mouseleave="hoverRating = 0"
                @click="selectedRating = star"
              >
                {{ star <= (hoverRating || selectedRating) ? '⭐' : '☆' }}
              </button>
            </div>

            <div class="rating-labels">
              <span>Poor</span>
              <span>Excellent</span>
            </div>

            <textarea
              v-model="reviewText"
              class="review-input"
              placeholder="Share your experience (optional)..."
              maxlength="500"
              rows="3"
            ></textarea>

            <rc-button
              type="primary"
              :label="isSubmitting ? 'Submitting...' : 'Submit Rating'"
              :disabled="!selectedRating || isSubmitting"
              @click="submitRating"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="actions-section">
          <rc-button
            v-if="canTrack"
            type="primary"
            label="Track Order"
            @click="trackOrder"
          />
          <rc-button
            v-if="canCancel"
            type="secondary"
            label="Cancel Order"
            @click="cancelOrder"
          />
          <rc-button
            v-if="canReorder"
            type="secondary"
            label="Reorder"
            @click="reorder"
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
        <p>The order you're looking for doesn't exist or has been removed.</p>
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
import { ref, computed, onMounted } from "vue";
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
  name: "PharmacyOrderDetails",
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

    const {
      "pharmacy/fetchOrderDetails": fetchOrderDetails,
      "pharmacy/cancelOrder": cancelOrderAction,
      "pharmacy/addToCart": addToCartAction,
      "pharmacy/rateOrder": rateOrderAction,
      "pharmacy/getOrderPdfUrl": getOrderPdfUrl,
    } = useMapActions();

    const {
      "pharmacy/getCurrentOrder": order,
      "pharmacy/getLoading": isLoading,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);

    // Rating state
    const selectedRating = ref(0);
    const hoverRating = ref(0);
    const reviewText = ref("");
    const isSubmitting = ref(false);

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

    const orderTimeline = computed(() => {
      if (!order.value) return [];

      const status = order.value.status;
      const steps = [
        { title: "Order Placed", icon: "shopping-cart", status: "PENDING" },
        { title: "Order Confirmed", icon: "check-circle", status: "CONFIRMED" },
        { title: "Processing", icon: "settings", status: "PROCESSING" },
        {
          title: order.value.delivery_method === "PICKUP" ? "Ready for Pickup" : "Out for Delivery",
          icon: order.value.delivery_method === "PICKUP" ? "package" : "truck",
          status: order.value.delivery_method === "PICKUP" ? "READY_FOR_PICKUP" : "OUT_FOR_DELIVERY",
        },
        { title: "Completed", icon: "check", status: "COMPLETED" },
      ];

      const statusOrder = ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"];
      const currentStatusIndex = statusOrder.indexOf(status);

      return steps.map((step, index) => {
        const stepStatusIndex = statusOrder.indexOf(step.status);
        return {
          ...step,
          completed: stepStatusIndex <= currentStatusIndex,
          current: step.status === status,
          date: step.status === "PENDING" ? order.value.created_at : null,
        };
      });
    });

    const canTrack = computed(() => {
      return ["OUT_FOR_DELIVERY", "READY_FOR_PICKUP"].includes(order.value?.status);
    });

    const canCancel = computed(() => {
      return ["PENDING", "CONFIRMED"].includes(order.value?.status);
    });

    const canReorder = computed(() => {
      return ["DELIVERED", "COMPLETED", "CANCELLED"].includes(order.value?.status);
    });

    const canRate = computed(() => {
      return ["DELIVERED", "COMPLETED"].includes(order.value?.status) && !order.value?.rating;
    });

    const formatPrice = (price) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(price || 0);
    };

    const formatDateTime = (date) => {
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

    const formatDeliveryMethod = (method) => {
      const methodMap = {
        DELIVERY: "Home Delivery",
        PICKUP: "Store Pickup",
      };
      return methodMap[method] || method;
    };

    const formatPaymentStatus = (status) => {
      const statusMap = {
        PENDING: "Pending",
        PAID: "Paid",
        FAILED: "Failed",
        REFUNDED: "Refunded",
      };
      return statusMap[status] || status;
    };

    const formatDosageForm = (dosageForm) => {
      // If it's an ObjectId, object, or looks like a MongoDB ObjectId string, return empty string
      if (!dosageForm || typeof dosageForm === 'object') {
        return '';
      }
      // Check if it looks like a MongoDB ObjectId (24 hex characters)
      if (typeof dosageForm === 'string' && /^[a-f0-9]{24}$/i.test(dosageForm)) {
        return '';
      }
      return dosageForm;
    };

    const formatAddress = (address) => {
      if (!address) return 'N/A';

      // If it's already a string, return it
      if (typeof address === 'string') return address;

      // If it's an object, format it nicely
      if (typeof address === 'object') {
        const parts = [];

        if (address.address_line1) parts.push(address.address_line1);
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state && address.state !== address.city) parts.push(address.state);
        if (address.postal_code) parts.push(address.postal_code);
        if (address.country) parts.push(address.country);
        if (address.landmark) parts.push(`(Near ${address.landmark})`);

        return parts.length > 0 ? parts.join(', ') : 'N/A';
      }

      return 'N/A';
    };

    const getContactName = (order) => {
      // Try to get from order directly
      if (order.contact_name) return order.contact_name;

      // Try to get from delivery_address object
      if (order.delivery_address && typeof order.delivery_address === 'object') {
        return order.delivery_address.recipient_name || '';
      }

      return '';
    };

    const getContactPhone = (order) => {
      // Try to get from order directly
      if (order.contact_phone) return order.contact_phone;

      // Try to get from delivery_address object
      if (order.delivery_address && typeof order.delivery_address === 'object') {
        return order.delivery_address.phone || '';
      }

      return '';
    };

    const contactPharmacy = () => {
      if (order.value?.pharmacy?.phone) {
        window.location.href = `tel:${order.value.pharmacy.phone}`;
      }
    };

    const trackOrder = () => {
      router.push(`/app/patient/pharmacy/track/${order.value.order_number}`);
    };

    const cancelOrder = async () => {
      const reason = prompt("Please provide a reason for cancellation:");
      if (reason && reason.trim()) {
        await cancelOrderAction({ orderId: order.value._id, reason: reason.trim() });
        await fetchOrderDetails(route.params.id);
      } else if (reason !== null) {
        alert("A cancellation reason is required.");
      }
    };

    const reorder = () => {
      if (order.value?.items) {
        order.value.items.forEach((item) => {
          addToCartAction({
            drugId: item.drug_id,
            name: item.drug_name,
            strength: item.strength,
            dosageForm: item.dosage_form,
            price: item.unit_price,
            quantity: item.quantity,
            imageUrl: item.drug_image,
          });
        });
        router.push("/app/patient/pharmacy/cart");
      }
    };

    const contactSupport = () => {
      // Navigate to support or open chat
      alert("Support feature coming soon!");
    };

    const submitRating = async () => {
      if (!selectedRating.value) return;

      isSubmitting.value = true;
      try {
        await rateOrderAction({
          orderId: order.value._id,
          rating: selectedRating.value,
          review: reviewText.value.trim() || undefined,
        });
        // Show success message
        alert("Thank you for your rating!");
      } catch (error) {
        alert("Failed to submit rating. Please try again.");
        console.error("Rating error:", error);
      } finally {
        isSubmitting.value = false;
      }
    };

    const getSeverityClass = (severity) => {
      const severityMap = {
        'critical': 'severity-critical',
        'severe': 'severity-severe',
        'moderate': 'severity-moderate',
        'mild': 'severity-mild',
      };
      return severityMap[severity?.toLowerCase()] || 'severity-mild';
    };

    const downloadingPdf = ref(false);
    const downloadPdf = async () => {
      if (!order.value?._id) return;

      try {
        downloadingPdf.value = true;
        // Get fresh presigned URL from server
        const presignedUrl = await getOrderPdfUrl(order.value._id);
        if (presignedUrl) {
          window.open(presignedUrl, '_blank');
        }
      } catch (error) {
        console.error('Failed to download PDF:', error);
        alert('Failed to download PDF. Please try again.');
      } finally {
        downloadingPdf.value = false;
      }
    };

    onMounted(async () => {
      const orderId = route.params.id;
      if (orderId) {
        await fetchOrderDetails(orderId);
      }
    });

    return {
      order,
      loading,
      statusClass,
      orderTimeline,
      canTrack,
      canCancel,
      canReorder,
      canRate,
      selectedRating,
      hoverRating,
      reviewText,
      isSubmitting,
      formatPrice,
      formatDateTime,
      formatStatus,
      formatDeliveryMethod,
      formatPaymentStatus,
      formatDosageForm,
      formatAddress,
      getContactName,
      getContactPhone,
      contactPharmacy,
      trackOrder,
      cancelOrder,
      reorder,
      contactSupport,
      submitRating,
      getSeverityClass,
      downloadPdf,
      downloadingPdf,
    };
  },
};
</script>

<style scoped lang="scss">
.order-details-page {
  padding: $size-16;

  .order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-20;
    background: $color-white;
    border-radius: $size-12;
    margin-bottom: $size-16;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .order-number {
      .label {
        display: block;
        font-size: $size-12;
        color: $color-g-67;
        margin-bottom: $size-4;
      }

      .value {
        font-size: $size-18;
        font-weight: 700;
        color: $color-g-21;
      }
    }

    .order-status {
      font-size: $size-14;
      font-weight: 600;
      padding: $size-6 $size-12;
      border-radius: $size-6;

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

  .timeline-section {
    .timeline {
      position: relative;
      padding-left: $size-32;

      &::before {
        content: "";
        position: absolute;
        left: $size-10;
        top: $size-12;
        bottom: $size-12;
        width: 2px;
        background: $color-g-85;
      }

      .timeline-step {
        position: relative;
        padding-bottom: $size-20;

        &:last-child {
          padding-bottom: 0;
        }

        .step-indicator {
          position: absolute;
          left: -$size-32;
          width: $size-22;
          height: $size-22;
          background: $color-g-85;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;

          svg {
            width: $size-12;
            height: $size-12;
            color: white;
          }
        }

        .step-content {
          .step-title {
            display: block;
            font-size: $size-14;
            color: $color-g-67;
          }

          .step-date {
            font-size: $size-12;
            color: $color-g-85;
          }
        }

        &.completed {
          .step-indicator {
            background: $color-denote-green;
          }

          .step-title {
            color: $color-g-21;
            font-weight: 500;
          }
        }

        &.current {
          .step-indicator {
            background: $color-pri;
          }

          .step-title {
            color: $color-pri;
            font-weight: 600;
          }
        }
      }
    }
  }

  .items-section {
    .order-items {
      .order-item {
        display: flex;
        align-items: center;
        gap: $size-12;
        padding: $size-12 0;
        border-bottom: 1px solid $color-g-95;

        &:last-child {
          border-bottom: none;
        }

        .item-image {
          width: $size-56;
          height: $size-56;
          background: $color-g-95;
          border-radius: $size-8;
          display: flex;
          align-items: center;
          justify-content: center;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: $size-8;
          }

          svg {
            width: $size-28;
            height: $size-28;
            color: $color-g-67;
          }
        }

        .item-details {
          flex: 1;

          h4 {
            font-size: $size-14;
            font-weight: 600;
            color: $color-g-21;
            margin-bottom: $size-2;
          }

          p {
            font-size: $size-12;
            color: $color-g-67;
            margin-bottom: $size-4;
          }

          .item-manufacturer {
            display: block;
            font-size: $size-12;
            color: $color-pri;
            font-weight: 500;
            margin-bottom: $size-4;
          }

          .item-qty {
            font-size: $size-14;
            color: $color-g-44;
          }
        }

        .item-price {
          font-size: $size-15;
          font-weight: 600;
          color: $color-g-21;
        }
      }
    }
  }

  .pharmacy-section {
    .pharmacy-info {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .pharmacy-details {
        h4 {
          font-size: $size-15;
          font-weight: 600;
          color: $color-g-21;
          margin-bottom: $size-4;
        }

        p {
          font-size: $size-14;
          color: $color-g-67;
          margin-bottom: $size-2;
        }
      }

      .contact-btn {
        display: flex;
        align-items: center;
        gap: $size-6;
        padding: $size-10 $size-16;
        background: $color-pri;
        border: none;
        border-radius: $size-8;
        color: white;
        font-size: $size-14;
        font-weight: 500;
        cursor: pointer;

        svg {
          width: $size-16;
          height: $size-16;
        }
      }
    }
  }

  .delivery-section {
    .delivery-info {
      .info-row {
        display: flex;
        justify-content: space-between;
        padding: $size-8 0;
        font-size: $size-14;

        .label {
          color: $color-g-67;
        }

        .value {
          color: $color-g-21;
          font-weight: 500;
          text-align: right;
          max-width: 60%;
        }
      }
    }
  }

  .payment-section {
    .payment-info {
      .payment-row {
        display: flex;
        justify-content: space-between;
        padding: $size-8 0;
        font-size: $size-14;
        color: $color-g-44;
        border-bottom: 1px solid $color-g-95;

        &:last-of-type {
          border-bottom: none;
        }

        &.total {
          font-size: $size-18;
          font-weight: 700;
          color: $color-pri;
          padding-top: $size-12;
        }

        .discount {
          color: $color-denote-green;
        }
      }

      .payment-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: $size-12;
        padding-top: $size-12;
        border-top: 1px solid $color-g-95;

        .label {
          font-size: $size-14;
          color: $color-g-67;
        }

        .status {
          font-size: $size-14;
          font-weight: 600;
          padding: $size-4 $size-10;
          border-radius: $size-4;

          &.paid {
            background: #d4edda;
            color: #155724;
          }

          &.pending {
            background: #fff3cd;
            color: #856404;
          }

          &.failed {
            background: #f8d7da;
            color: #721c24;
          }

          &.refunded {
            background: #cce5ff;
            color: #004085;
          }
        }
      }
    }
  }

  .instructions-section {
    .instructions-text {
      font-size: $size-14;
      color: $color-g-44;
      line-height: 1.5;
    }
  }

  .rating-section {
    background: linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%);
    border: 2px solid #ffc107;

    .rating-display {
      text-align: center;

      .stars-display {
        font-size: $size-28;
        letter-spacing: $size-4;
        margin-bottom: $size-8;
      }

      .rating-value {
        font-size: $size-18;
        font-weight: 600;
        color: $color-g-21;
        margin-bottom: $size-8;
      }

      .review-text {
        font-size: $size-14;
        color: $color-g-44;
        font-style: italic;
        line-height: 1.5;
        margin-bottom: $size-8;
        padding: $size-12;
        background: rgba(255, 255, 255, 0.5);
        border-radius: $size-8;
      }

      .rated-date {
        font-size: $size-12;
        color: $color-g-67;
      }
    }

    .rating-form {
      .rating-prompt {
        font-size: $size-15;
        color: $color-g-44;
        text-align: center;
        margin-bottom: $size-16;
      }

      .star-rating {
        display: flex;
        justify-content: center;
        gap: $size-8;
        margin-bottom: $size-8;

        .star-btn {
          font-size: $size-36;
          background: none;
          border: none;
          cursor: pointer;
          padding: $size-4;
          transition: transform 0.2s ease;

          &:hover,
          &.hover,
          &.active {
            transform: scale(1.2);
          }
        }
      }

      .rating-labels {
        display: flex;
        justify-content: space-between;
        padding: 0 $size-8;
        margin-bottom: $size-16;

        span {
          font-size: $size-12;
          color: $color-g-67;
        }
      }

      .review-input {
        width: 100%;
        padding: $size-12;
        border: 1px solid #ddd;
        border-radius: $size-8;
        font-size: $size-14;
        font-family: inherit;
        resize: vertical;
        margin-bottom: $size-16;
        background: white;

        &:focus {
          outline: none;
          border-color: $color-pri;
        }

        &::placeholder {
          color: $color-g-67;
        }
      }

      button {
        width: 100%;
      }
    }
  }

  .actions-section {
    margin-top: $size-24;

    button {
      width: 100%;
      margin-bottom: $size-12;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  // Verification Notice Section
  .verification-notice-section {
    background: linear-gradient(135deg, #fff9e6 0%, #fff3cc 100%);
    border: 2px solid #ffc107;

    .verification-notice {
      display: flex;
      gap: $size-12;
      align-items: flex-start;

      > svg {
        width: $size-24;
        height: $size-24;
        color: #856404;
        flex-shrink: 0;
        margin-top: $size-2;
      }

      .notice-content {
        flex: 1;

        h4 {
          font-size: $size-16;
          font-weight: 600;
          color: #856404;
          margin-bottom: $size-8;
        }

        p {
          font-size: $size-14;
          color: #664d03;
          line-height: 1.5;
          margin-bottom: $size-8;
        }

        .verification-score {
          display: inline-block;
          font-size: $size-12;
          font-weight: 600;
          color: #664d03;
          background: rgba(255, 193, 7, 0.3);
          padding: $size-4 $size-8;
          border-radius: $size-4;
        }
      }
    }
  }

  // Drug Interaction Warnings Section
  .interaction-section {
    border: 2px solid #dc3545;
    background: linear-gradient(135deg, #fff5f5 0%, #ffe0e0 100%);

    .warning-title {
      color: #dc3545;
      display: flex;
      align-items: center;
      gap: $size-8;

      &::before {
        content: "⚠️";
      }
    }

    .interaction-disclaimer {
      font-size: $size-13;
      color: #721c24;
      margin-bottom: $size-16;
      font-style: italic;
    }

    .interaction-list {
      display: flex;
      flex-direction: column;
      gap: $size-12;

      .interaction-card {
        background: white;
        border-radius: $size-8;
        padding: $size-12;
        border-left: 4px solid;

        &.severity-critical {
          border-left-color: #7b0000;
          background: #fff0f0;
        }

        &.severity-severe {
          border-left-color: #dc3545;
          background: #fff5f5;
        }

        &.severity-moderate {
          border-left-color: #fd7e14;
          background: #fff8f0;
        }

        &.severity-mild {
          border-left-color: #ffc107;
          background: #fffef0;
        }

        .interaction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: $size-8;

          .drug-names {
            font-size: $size-14;
            font-weight: 600;
            color: $color-g-21;
          }

          .severity-badge {
            font-size: $size-11;
            font-weight: 600;
            padding: $size-2 $size-8;
            border-radius: $size-12;
            text-transform: uppercase;

            &.critical {
              background: #7b0000;
              color: white;
            }

            &.severe {
              background: #dc3545;
              color: white;
            }

            &.moderate {
              background: #fd7e14;
              color: white;
            }

            &.mild {
              background: #ffc107;
              color: #664d03;
            }
          }
        }

        .interaction-description {
          font-size: $size-13;
          color: $color-g-44;
          line-height: 1.5;
          margin-bottom: $size-8;
        }

        .interaction-recommendation {
          font-size: $size-13;
          color: #155724;
          background: #d4edda;
          padding: $size-8;
          border-radius: $size-4;
          line-height: 1.4;

          strong {
            color: #0d4520;
          }
        }
      }
    }
  }

  // Drug Safety Info Section
  .safety-section {
    .safety-list {
      display: flex;
      flex-direction: column;
      gap: $size-16;

      .safety-card {
        background: $color-g-97;
        border-radius: $size-8;
        padding: $size-16;

        .drug-name {
          font-size: $size-16;
          font-weight: 600;
          color: $color-g-21;
          margin-bottom: $size-12;
          padding-bottom: $size-8;
          border-bottom: 1px solid $color-g-90;
        }

        .boxed-warning {
          display: flex;
          gap: $size-10;
          background: linear-gradient(135deg, #2d0a0a 0%, #4a0e0e 100%);
          color: white;
          padding: $size-12;
          border-radius: $size-8;
          margin-bottom: $size-12;
          border: 2px solid #dc3545;

          svg {
            width: $size-20;
            height: $size-20;
            color: #ff6b6b;
            flex-shrink: 0;
          }

          strong {
            display: block;
            font-size: $size-12;
            color: #ff6b6b;
            margin-bottom: $size-4;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          p {
            font-size: $size-13;
            line-height: 1.5;
            margin: 0;
          }
        }

        .ai-summary {
          .summary-section {
            margin-bottom: $size-12;

            &:last-child {
              margin-bottom: 0;
            }

            strong {
              display: block;
              font-size: $size-13;
              color: $color-g-44;
              margin-bottom: $size-6;
            }

            ul {
              margin: 0;
              padding-left: $size-18;

              li {
                font-size: $size-13;
                color: $color-g-21;
                line-height: 1.5;
                margin-bottom: $size-4;

                &:last-child {
                  margin-bottom: 0;
                }
              }
            }

            .effects-list {
              font-size: $size-13;
              color: $color-g-44;
              line-height: 1.5;
            }

            &.side-effects {
              background: #fff3cd;
              padding: $size-10;
              border-radius: $size-6;
              border-left: 3px solid #ffc107;
            }

            &.warnings {
              background: #f8d7da;
              padding: $size-10;
              border-radius: $size-6;
              border-left: 3px solid #dc3545;

              ul li {
                color: #721c24;
              }
            }
          }
        }
      }
    }
  }

  // PDF Download Section
  .pdf-section {
    .pdf-download {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: $size-16;

      .pdf-info {
        display: flex;
        gap: $size-12;
        align-items: center;

        svg {
          width: $size-40;
          height: $size-40;
          color: $color-pri;
          background: rgba($color-pri, 0.1);
          padding: $size-8;
          border-radius: $size-8;
        }

        h4 {
          font-size: $size-15;
          font-weight: 600;
          color: $color-g-21;
          margin-bottom: $size-2;
        }

        p {
          font-size: $size-13;
          color: $color-g-67;
          margin: 0;
        }
      }

      .download-btn {
        display: flex;
        align-items: center;
        gap: $size-6;
        padding: $size-10 $size-16;
        background: $color-pri;
        border: none;
        border-radius: $size-8;
        color: white;
        font-size: $size-14;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s ease;

        svg {
          width: $size-16;
          height: $size-16;
        }

        &:hover {
          background: darken($color-pri, 10%);
        }

        &:active {
          transform: scale(0.98);
        }
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
</style>
