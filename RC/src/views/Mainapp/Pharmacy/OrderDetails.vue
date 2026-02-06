<template>
  <div class="order-details-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="back-btn" @click="$router.back()">
        <v-icon name="hi-arrow-left" scale="1.1" />
      </button>
      <div class="header-title">
        <span>Order Details</span>
      </div>
      <button class="help-btn" @click="contactSupport">
        <v-icon name="hi-question-mark-circle" scale="1.1" />
      </button>
    </header>

    <!-- Breadcrumbs -->
    <nav class="breadcrumbs" v-if="!loading && order">
      <router-link to="/app/patient/pharmacy" class="crumb">
        <v-icon name="hi-home" scale="0.8" />
        <span>Pharmacy</span>
      </router-link>
      <v-icon name="hi-chevron-right" scale="0.7" class="separator" />
      <router-link to="/app/patient/pharmacy/orders" class="crumb">Orders</router-link>
      <v-icon name="hi-chevron-right" scale="0.7" class="separator" />
      <span class="crumb current">{{ order?.order_number || 'Details' }}</span>
    </nav>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton-grid">
        <div class="skeleton-card header-skeleton">
          <div class="skeleton-line w-40"></div>
          <div class="skeleton-line w-60"></div>
        </div>
        <div class="skeleton-card timeline-skeleton">
          <div class="skeleton-line w-30"></div>
          <div class="skeleton-steps">
            <div class="skeleton-step" v-for="i in 5" :key="i"></div>
          </div>
        </div>
        <div class="skeleton-card items-skeleton">
          <div class="skeleton-line w-25"></div>
          <div class="skeleton-item" v-for="i in 2" :key="i">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
              <div class="skeleton-line w-70"></div>
              <div class="skeleton-line w-40"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="!order" class="error-state">
      <div class="error-card glass-card">
        <div class="error-icon">
          <v-icon name="hi-exclamation-circle" scale="3" />
        </div>
        <h2>Order Not Found</h2>
        <p>The order you're looking for doesn't exist or has been removed.</p>
        <button class="primary-btn" @click="$router.push('/app/patient/pharmacy/orders')">
          <v-icon name="hi-clipboard-list" scale="0.9" />
          View My Orders
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="bento-grid">
      <!-- Order Header Card -->
      <div class="bento-card order-header-card span-full">
        <div class="order-badge">
          <v-icon name="hi-shopping-cart" scale="1.2" />
        </div>
        <div class="order-info">
          <span class="order-label">Order Number</span>
          <h1 class="order-number">{{ order.order_number }}</h1>
          <span class="order-date">
            <v-icon name="hi-calendar" scale="0.8" />
            {{ formatDateTime(order.created_at) }}
          </span>
        </div>
        <div class="status-wrapper">
          <span :class="['status-badge', statusClass]">
            <span class="status-dot"></span>
            {{ formatStatus(order.status) }}
          </span>
          <span :class="['payment-badge', paymentStatusClass]">
            <v-icon :name="paymentIcon" scale="0.8" />
            {{ formatPaymentStatus(order.payment_status) }}
          </span>
        </div>
      </div>

      <!-- Payment Required Alert -->
      <div v-if="needsPayment" class="bento-card payment-alert-card span-full">
        <div class="alert-content">
          <div class="alert-icon warning">
            <v-icon name="hi-exclamation-circle" scale="1.5" />
          </div>
          <div class="alert-text">
            <h3>Payment Required</h3>
            <p>Complete your payment to process this order. Your items are reserved for the next 24 hours.</p>
          </div>
        </div>
        <div class="alert-actions">
          <div class="payment-amount">
            <span class="amount-label">Amount Due</span>
            <span class="amount-value">{{ formatPrice(order.total_amount) }}</span>
          </div>
          <button class="pay-now-btn" @click="initiatePayment" :disabled="processingPayment">
            <v-icon v-if="processingPayment" name="hi-refresh" scale="1" class="spin" />
            <v-icon v-else name="hi-credit-card" scale="1" />
            {{ processingPayment ? 'Processing...' : 'Pay Now' }}
          </button>
        </div>
      </div>

      <!-- Order Timeline Card -->
      <div class="bento-card timeline-card span-8">
        <div class="card-header">
          <div class="header-icon sky">
            <v-icon name="hi-clock" scale="1" />
          </div>
          <h2>Order Timeline</h2>
        </div>
        <div class="timeline">
          <div
            v-for="(step, index) in orderTimeline"
            :key="index"
            :class="['timeline-step', { completed: step.completed, current: step.current }]"
          >
            <div class="step-line" v-if="index < orderTimeline.length - 1"></div>
            <div class="step-indicator">
              <v-icon v-if="step.completed" name="hi-check" scale="0.8" />
              <v-icon v-else :name="step.icon" scale="0.8" />
            </div>
            <div class="step-content">
              <span class="step-title">{{ step.title }}</span>
              <span class="step-date" v-if="step.date">{{ formatDateTime(step.date) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Card -->
      <div class="bento-card actions-card span-4">
        <div class="card-header">
          <div class="header-icon violet">
            <v-icon name="hi-lightning-bolt" scale="1" />
          </div>
          <h2>Quick Actions</h2>
        </div>
        <div class="quick-actions">
          <button v-if="needsPayment" class="action-btn primary" @click="initiatePayment" :disabled="processingPayment">
            <v-icon name="hi-credit-card" scale="1" />
            <span>Pay Now</span>
          </button>
          <button v-if="canTrack" class="action-btn" @click="trackOrder">
            <v-icon name="hi-location-marker" scale="1" />
            <span>Track Order</span>
          </button>
          <button v-if="canCancel" class="action-btn danger" @click="cancelOrder">
            <v-icon name="hi-x-circle" scale="1" />
            <span>Cancel Order</span>
          </button>
          <button v-if="canReorder" class="action-btn" @click="reorder">
            <v-icon name="hi-refresh" scale="1" />
            <span>Reorder</span>
          </button>
          <button class="action-btn" @click="contactSupport">
            <v-icon name="hi-chat-alt-2" scale="1" />
            <span>Get Help</span>
          </button>
          <button v-if="order.confirmation_pdf_url" class="action-btn" @click="downloadPdf" :disabled="downloadingPdf">
            <v-icon :name="downloadingPdf ? 'hi-refresh' : 'hi-download'" scale="1" :class="{ spin: downloadingPdf }" />
            <span>{{ downloadingPdf ? 'Loading...' : 'Download PDF' }}</span>
          </button>
        </div>
      </div>

      <!-- Order Items Card -->
      <div class="bento-card items-card span-full">
        <div class="card-header">
          <div class="header-icon emerald">
            <v-icon name="ri-capsule-line" scale="1" />
          </div>
          <h2>Order Items</h2>
          <span class="item-count">{{ order.items?.length || 0 }} items</span>
        </div>
        <div class="items-list">
          <div v-for="item in order.items" :key="item._id" class="item-row">
            <div class="item-image">
              <img v-if="item.drug_image" :src="item.drug_image" :alt="item.drug_name" referrerpolicy="no-referrer" @error="$event.target.style.display='none'" />
              <div v-else class="image-placeholder">
                <v-icon name="ri-capsule-line" scale="1.2" />
              </div>
            </div>
            <div class="item-details">
              <h4>{{ item.drug_name }}</h4>
              <p class="item-meta">
                <span v-if="item.strength">{{ item.strength }}</span>
                <span v-if="formatDosageForm(item.dosage_form)">{{ formatDosageForm(item.dosage_form) }}</span>
              </p>
              <span v-if="item.manufacturer" class="manufacturer">{{ item.manufacturer }}</span>
            </div>
            <div class="item-qty">
              <span class="qty-label">Qty</span>
              <span class="qty-value">{{ item.quantity }}</span>
            </div>
            <div class="item-price">
              {{ formatPrice(item.unit_price * item.quantity) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Verification Notice -->
      <div v-if="showVerificationNotice" class="bento-card notice-card warning span-full">
        <div class="notice-icon">
          <v-icon name="hi-shield-check" scale="1.5" />
        </div>
        <div class="notice-content">
          <h3>Prescription Verification Notice</h3>
          <p>Your prescription is subject to secondary verification by our licensed Pharmacist before processing. You or your prescriber may be contacted if any clarification is needed.</p>
          <span v-if="order.verification_score" class="verification-badge">
            <v-icon name="hi-badge-check" scale="0.8" />
            Verification Score: {{ order.verification_score }}%
          </span>
        </div>
      </div>

      <!-- Drug Interaction Warnings -->
      <div v-if="hasInteractionWarnings" class="bento-card interactions-card danger span-full">
        <div class="card-header">
          <div class="header-icon rose">
            <v-icon name="hi-exclamation" scale="1" />
          </div>
          <h2>Drug Interaction Warnings</h2>
        </div>
        <p class="warning-disclaimer">The following potential drug interactions were detected. Please consult with your pharmacist or healthcare provider.</p>
        <div class="interactions-list">
          <div
            v-for="(interaction, index) in order.drug_interactions"
            :key="index"
            :class="['interaction-item', getSeverityClass(interaction.severity)]"
          >
            <div class="interaction-header">
              <span class="drug-pair">{{ interaction.drug1_name }} + {{ interaction.drug2_name }}</span>
              <span :class="['severity-tag', interaction.severity?.toLowerCase()]">{{ interaction.severity }}</span>
            </div>
            <p class="interaction-desc">{{ interaction.description }}</p>
            <div v-if="interaction.recommendation" class="recommendation">
              <v-icon name="hi-light-bulb" scale="0.8" />
              <span>{{ interaction.recommendation }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pharmacy Info Card -->
      <div class="bento-card pharmacy-card span-6">
        <div class="card-header">
          <div class="header-icon sky">
            <v-icon name="hi-office-building" scale="1" />
          </div>
          <h2>Pharmacy</h2>
        </div>
        <div class="pharmacy-info" v-if="order.pharmacy">
          <h3>{{ order.pharmacy.name }}</h3>
          <p class="pharmacy-address">
            <v-icon name="hi-location-marker" scale="0.85" />
            {{ formatAddress(order.pharmacy.address) }}
          </p>
          <p v-if="order.pharmacy.phone" class="pharmacy-phone">
            <v-icon name="hi-phone" scale="0.85" />
            {{ order.pharmacy.phone }}
          </p>
          <button v-if="order.pharmacy.phone" class="call-btn" @click="contactPharmacy">
            <v-icon name="hi-phone" scale="0.9" />
            Call Pharmacy
          </button>
        </div>
      </div>

      <!-- Delivery Info Card -->
      <div class="bento-card delivery-card span-6">
        <div class="card-header">
          <div class="header-icon amber">
            <v-icon :name="order.delivery_method === 'PICKUP' ? 'hi-office-building' : 'hi-truck'" scale="1" />
          </div>
          <h2>{{ order.delivery_method === 'PICKUP' ? 'Pickup' : 'Delivery' }} Info</h2>
        </div>
        <div class="delivery-info">
          <div class="info-item">
            <span class="info-label">Method</span>
            <span class="info-value highlight">{{ formatDeliveryMethod(order.delivery_method) }}</span>
          </div>
          <div v-if="order.delivery_method === 'DELIVERY' && order.delivery_address" class="info-item">
            <span class="info-label">Address</span>
            <span class="info-value">{{ formatAddress(order.delivery_address) }}</span>
          </div>
          <div v-if="order.estimated_delivery_time" class="info-item">
            <span class="info-label">Estimated</span>
            <span class="info-value">{{ formatDateTime(order.estimated_delivery_time) }}</span>
          </div>
          <div v-if="getContactName(order)" class="info-item">
            <span class="info-label">Contact</span>
            <span class="info-value">{{ getContactName(order) }}</span>
          </div>
          <div v-if="getContactPhone(order)" class="info-item">
            <span class="info-label">Phone</span>
            <span class="info-value">{{ getContactPhone(order) }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Summary Card -->
      <div class="bento-card payment-card span-full">
        <div class="card-header">
          <div class="header-icon emerald">
            <v-icon name="hi-currency-dollar" scale="1" />
          </div>
          <h2>Payment Summary</h2>
        </div>
        <div class="payment-summary">
          <div class="summary-rows">
            <div class="summary-row">
              <span>Subtotal</span>
              <span>{{ formatPrice(order.subtotal) }}</span>
            </div>
            <div v-if="order.delivery_fee" class="summary-row">
              <span>Delivery Fee</span>
              <span>{{ formatPrice(order.delivery_fee) }}</span>
            </div>
            <div v-if="order.discount_amount" class="summary-row discount">
              <span>
                <v-icon name="hi-tag" scale="0.8" />
                Discount
              </span>
              <span>-{{ formatPrice(order.discount_amount) }}</span>
            </div>
            <div class="summary-row total">
              <span>Total</span>
              <span>{{ formatPrice(order.total_amount) }}</span>
            </div>
          </div>
          <div class="payment-meta">
            <div class="meta-item">
              <span class="meta-label">Payment Status</span>
              <span :class="['meta-badge', paymentStatusClass]">
                <v-icon :name="paymentIcon" scale="0.7" />
                {{ formatPaymentStatus(order.payment_status) }}
              </span>
            </div>
            <div v-if="order.payment_method" class="meta-item">
              <span class="meta-label">Payment Method</span>
              <span class="meta-value">{{ formatPaymentMethod(order.payment_method) }}</span>
            </div>
            <div v-if="order.paid_at" class="meta-item">
              <span class="meta-label">Paid On</span>
              <span class="meta-value">{{ formatDateTime(order.paid_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Rating Section -->
      <div v-if="canRate || order.rating" class="bento-card rating-card span-full">
        <div class="card-header">
          <div class="header-icon amber">
            <v-icon name="hi-star" scale="1" />
          </div>
          <h2>{{ order.rating ? 'Your Rating' : 'Rate Your Experience' }}</h2>
        </div>

        <!-- Already rated -->
        <div v-if="order.rating" class="rating-display">
          <div class="stars-display">
            <span v-for="star in 5" :key="star" :class="['star', { filled: star <= order.rating }]">
              <v-icon :name="star <= order.rating ? 'bi-star-fill' : 'hi-star'" scale="1.5" />
            </span>
          </div>
          <p class="rating-value">{{ order.rating }}/5</p>
          <p v-if="order.review" class="review-text">"{{ order.review }}"</p>
          <p v-if="order.rated_at" class="rated-date">Rated on {{ formatDateTime(order.rated_at) }}</p>
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
              <v-icon :name="star <= (hoverRating || selectedRating) ? 'bi-star-fill' : 'hi-star'" scale="1.8" />
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
          <button
            class="submit-rating-btn"
            :disabled="!selectedRating || isSubmitting"
            @click="submitRating"
          >
            <v-icon v-if="isSubmitting" name="hi-refresh" scale="0.9" class="spin" />
            {{ isSubmitting ? 'Submitting...' : 'Submit Rating' }}
          </button>
        </div>
      </div>

      <!-- Special Instructions -->
      <div v-if="order.special_instructions" class="bento-card instructions-card span-full">
        <div class="card-header">
          <div class="header-icon sky">
            <v-icon name="hi-annotation" scale="1" />
          </div>
          <h2>Special Instructions</h2>
        </div>
        <p class="instructions-text">{{ order.special_instructions }}</p>
      </div>
    </div>

    <!-- Bottom Spacer for Mobile -->
    <div class="bottom-spacer"></div>

    <!-- Payment Method Modal -->
    <Teleport to="body">
      <div v-if="showPaymentModal" class="modal-overlay" @click.self="closePaymentModal">
        <div class="modal-container payment-modal">
          <div class="modal-header">
            <div class="modal-title">
              <v-icon name="hi-credit-card" scale="1.1" />
              <h2>Select Payment Method</h2>
            </div>
            <button class="close-btn" @click="closePaymentModal">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="modal-body">
            <p class="payment-info">Choose how you would like to pay for your order</p>

            <div class="amount-display">
              <span class="amount-label">Amount Due</span>
              <span class="amount-value">{{ formatPrice(order?.total_amount) }}</span>
            </div>

            <div class="payment-options">
              <!-- Card Payment Option -->
              <div
                class="payment-option"
                :class="{ selected: selectedPaymentMethod === 'card' }"
                @click="selectedPaymentMethod = 'card'"
              >
                <div class="option-radio">
                  <div class="radio-inner" v-if="selectedPaymentMethod === 'card'"></div>
                </div>
                <div class="option-icon card-icon">
                  <v-icon name="bi-credit-card-2-back" scale="1.2" />
                </div>
                <div class="option-content">
                  <span class="option-title">Pay with Card</span>
                  <span class="option-desc">Secure checkout via Paystack (Card, Bank Transfer, USSD)</span>
                </div>
              </div>

              <!-- Wallet Payment Option -->
              <div
                class="payment-option"
                :class="{
                  selected: selectedPaymentMethod === 'wallet',
                  insufficient: walletBalance < order?.total_amount
                }"
                @click="selectedPaymentMethod = 'wallet'"
              >
                <div class="option-radio">
                  <div class="radio-inner" v-if="selectedPaymentMethod === 'wallet'"></div>
                </div>
                <div class="option-icon wallet-icon">
                  <v-icon name="bi-wallet2" scale="1.2" />
                </div>
                <div class="option-content">
                  <span class="option-title">Pay with Wallet</span>
                  <span class="option-desc">
                    Balance: {{ formatPrice(walletBalance) }}
                    <span v-if="walletBalance < order?.total_amount" class="insufficient-badge">Insufficient</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closePaymentModal">Cancel</button>
            <button
              class="btn-primary"
              @click="proceedWithPayment"
              :disabled="processingPayment || (selectedPaymentMethod === 'wallet' && walletBalance < order?.total_amount)"
            >
              <v-icon v-if="processingPayment" name="hi-refresh" scale="0.9" class="spin" />
              {{ processingPayment ? 'Processing...' : 'Continue' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Wallet Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showWalletConfirmModal" class="modal-overlay" @click.self="closeWalletConfirmModal">
        <div class="modal-container wallet-confirm-modal">
          <div class="modal-header">
            <div class="modal-title">
              <v-icon name="bi-wallet2" scale="1.1" />
              <h2>Confirm Wallet Payment</h2>
            </div>
            <button class="close-btn" @click="closeWalletConfirmModal">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="modal-body">
            <div class="wallet-summary">
              <div class="summary-icon">
                <v-icon name="bi-wallet2" scale="2" />
              </div>
              <p class="summary-text">You are about to pay using your Rapid Wallet</p>
            </div>

            <div class="wallet-details">
              <div class="detail-row">
                <span class="detail-label">Current Balance</span>
                <span class="detail-value balance">{{ formatPrice(walletBalance) }}</span>
              </div>
              <div class="detail-row debit">
                <span class="detail-label">Amount to Debit</span>
                <span class="detail-value">- {{ formatPrice(order?.total_amount) }}</span>
              </div>
              <div class="detail-divider"></div>
              <div class="detail-row remaining">
                <span class="detail-label">Remaining Balance</span>
                <span class="detail-value">{{ formatPrice(walletBalance - (order?.total_amount || 0)) }}</span>
              </div>
            </div>

            <div class="wallet-notice">
              <v-icon name="hi-information-circle" scale="0.9" />
              <span>This amount will be immediately debited from your wallet.</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeWalletConfirmModal">Cancel</button>
            <button
              class="btn-primary wallet-btn"
              @click="confirmWalletPayment"
              :disabled="processingPayment"
            >
              <v-icon v-if="processingPayment" name="hi-refresh" scale="0.9" class="spin" />
              <v-icon v-else name="hi-check" scale="0.9" />
              {{ processingPayment ? 'Processing...' : 'Confirm Payment' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";
import moment from "moment";

export default {
  name: "PharmacyOrderDetails",
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
      "pharmacy/processCardPayment": processCardPayment,
      "pharmacy/initializePaystackPayment": initializePaystackPayment,
      "pharmacy/payWithWallet": payWithWalletAction,
      "pharmacy/fetchWalletBalance": fetchWalletBalanceAction,
    } = useMapActions();

    const {
      "pharmacy/getCurrentOrder": order,
      "pharmacy/getLoading": isLoading,
      "auth/getUserProfile": userProfile,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);

    // Payment state
    const processingPayment = ref(false);
    const showPaymentModal = ref(false);
    const showWalletConfirmModal = ref(false);
    const selectedPaymentMethod = ref('card');
    const walletBalance = ref(0);

    // Rating state
    const selectedRating = ref(0);
    const hoverRating = ref(0);
    const reviewText = ref("");
    const isSubmitting = ref(false);
    const downloadingPdf = ref(false);

    // Computed
    const needsPayment = computed(() => {
      return order.value?.payment_status === 'PENDING' &&
             !['CANCELLED', 'REFUNDED'].includes(order.value?.status);
    });

    const statusClass = computed(() => {
      const classes = {
        PENDING: "pending",
        CONFIRMED: "confirmed",
        PROCESSING: "processing",
        READY_FOR_PICKUP: "ready",
        OUT_FOR_DELIVERY: "delivery",
        DELIVERED: "completed",
        COMPLETED: "completed",
        CANCELLED: "cancelled",
        REFUNDED: "refunded",
      };
      return classes[order.value?.status] || "pending";
    });

    const paymentStatusClass = computed(() => {
      const classes = {
        PENDING: "pending",
        PAID: "paid",
        FAILED: "failed",
        REFUNDED: "refunded",
      };
      return classes[order.value?.payment_status] || "pending";
    });

    const paymentIcon = computed(() => {
      const icons = {
        PENDING: "hi-clock",
        PAID: "hi-check-circle",
        FAILED: "hi-x-circle",
        REFUNDED: "hi-reply",
      };
      return icons[order.value?.payment_status] || "hi-clock";
    });

    const orderTimeline = computed(() => {
      if (!order.value) return [];

      const status = order.value.status;
      const steps = [
        { title: "Order Placed", icon: "hi-shopping-cart", status: "PENDING", date: order.value.created_at },
        { title: "Confirmed", icon: "hi-check-circle", status: "CONFIRMED", date: order.value.confirmed_at },
        { title: "Processing", icon: "hi-cog", status: "PROCESSING", date: order.value.processing_at },
        {
          title: order.value.delivery_method === "PICKUP" ? "Ready for Pickup" : "Out for Delivery",
          icon: order.value.delivery_method === "PICKUP" ? "hi-office-building" : "hi-truck",
          status: order.value.delivery_method === "PICKUP" ? "READY_FOR_PICKUP" : "OUT_FOR_DELIVERY",
          date: order.value.ready_at || order.value.shipped_at,
        },
        { title: "Completed", icon: "hi-badge-check", status: "COMPLETED", date: order.value.completed_at },
      ];

      const statusOrder = ["PENDING", "CONFIRMED", "PROCESSING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED", "COMPLETED"];
      const currentStatusIndex = statusOrder.indexOf(status);

      return steps.map((step) => {
        const stepStatusIndex = statusOrder.indexOf(step.status);
        return {
          ...step,
          completed: stepStatusIndex <= currentStatusIndex && stepStatusIndex >= 0,
          current: step.status === status,
        };
      });
    });

    const canTrack = computed(() => ["OUT_FOR_DELIVERY", "READY_FOR_PICKUP"].includes(order.value?.status));
    const canCancel = computed(() => ["PENDING", "CONFIRMED"].includes(order.value?.status) && order.value?.payment_status !== 'PAID');
    const canReorder = computed(() => ["DELIVERED", "COMPLETED", "CANCELLED"].includes(order.value?.status));
    const canRate = computed(() => ["DELIVERED", "COMPLETED"].includes(order.value?.status) && !order.value?.rating);

    const showVerificationNotice = computed(() => {
      return order.value?.requires_pharmacist_review || (order.value?.verification_score && order.value.verification_score < 90);
    });

    const hasInteractionWarnings = computed(() => {
      return order.value?.has_interaction_warnings && order.value?.drug_interactions?.length > 0;
    });

    // Methods
    const formatPrice = (price) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(price || 0);
    };

    const formatDateTime = (date) => {
      if (!date) return "";
      return moment(date).format("MMM D, YYYY h:mm A");
    };

    const formatStatus = (status) => {
      const map = {
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
      return map[status] || status;
    };

    const formatPaymentStatus = (status) => {
      const map = {
        PENDING: "Unpaid",
        PAID: "Paid",
        FAILED: "Failed",
        REFUNDED: "Refunded",
      };
      return map[status] || status;
    };

    const formatPaymentMethod = (method) => {
      const map = {
        CARD: "Card Payment",
        WALLET: "Wallet",
        SPLIT: "Split Payment",
        CASH: "Cash on Delivery",
      };
      return map[method] || method;
    };

    const formatDeliveryMethod = (method) => {
      return method === "PICKUP" ? "Store Pickup" : "Home Delivery";
    };

    const formatDosageForm = (dosageForm) => {
      if (!dosageForm || typeof dosageForm === 'object') return '';
      if (typeof dosageForm === 'string' && /^[a-f0-9]{24}$/i.test(dosageForm)) return '';
      return dosageForm;
    };

    const formatAddress = (address) => {
      if (!address) return 'N/A';
      if (typeof address === 'string') return address;
      if (typeof address === 'object') {
        const parts = [];
        if (address.address_line1) parts.push(address.address_line1);
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state && address.state !== address.city) parts.push(address.state);
        if (address.postal_code) parts.push(address.postal_code);
        if (address.landmark) parts.push(`(Near ${address.landmark})`);
        return parts.length > 0 ? parts.join(', ') : 'N/A';
      }
      return 'N/A';
    };

    const getContactName = (order) => {
      if (order.contact_name) return order.contact_name;
      if (order.delivery_address?.recipient_name) return order.delivery_address.recipient_name;
      return '';
    };

    const getContactPhone = (order) => {
      if (order.contact_phone) return order.contact_phone;
      if (order.delivery_address?.phone) return order.delivery_address.phone;
      return '';
    };

    const getSeverityClass = (severity) => {
      const map = {
        critical: 'critical',
        severe: 'severe',
        moderate: 'moderate',
        mild: 'mild',
      };
      return map[severity?.toLowerCase()] || 'mild';
    };

    // Fetch wallet balance
    const loadWalletBalance = async () => {
      try {
        const result = await fetchWalletBalanceAction();
        // Result could be a number directly or an object with currentBalance/balance
        if (typeof result === 'number') {
          walletBalance.value = result;
        } else {
          walletBalance.value = result?.currentBalance || result?.balance || 0;
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        walletBalance.value = 0;
      }
    };

    // Open payment method selection modal
    const initiatePayment = async () => {
      if (!order.value || processingPayment.value) return;

      // Fetch wallet balance before showing modal
      await loadWalletBalance();

      // Reset selection and show modal
      selectedPaymentMethod.value = 'card';
      showPaymentModal.value = true;
    };

    // Close payment modal
    const closePaymentModal = () => {
      if (!processingPayment.value) {
        showPaymentModal.value = false;
      }
    };

    // Close wallet confirmation modal
    const closeWalletConfirmModal = () => {
      if (!processingPayment.value) {
        showWalletConfirmModal.value = false;
      }
    };

    // Proceed with selected payment method
    const proceedWithPayment = async () => {
      if (selectedPaymentMethod.value === 'wallet') {
        // Show wallet confirmation modal
        showPaymentModal.value = false;
        showWalletConfirmModal.value = true;
      } else {
        // Proceed with card payment via Paystack redirect
        await processPaystackPayment();
      }
    };

    // Card payment - Redirect-based flow (like appointments v2)
    const processPaystackPayment = async () => {
      if (!order.value || processingPayment.value) return;

      processingPayment.value = true;
      showPaymentModal.value = false;

      try {
        const orderId = order.value._id;

        // Call backend to initialize Paystack payment
        const result = await initializePaystackPayment(orderId);

        if (result?.authorization_url) {
          // Store order ID for verification on return
          localStorage.setItem('pending_pharmacy_order_id', orderId);
          localStorage.setItem('pending_pharmacy_payment_reference', result.payment_reference || '');

          // Redirect to Paystack payment page
          window.location.href = result.authorization_url;
        } else {
          throw new Error('No authorization URL received');
        }
      } catch (error) {
        console.error('Payment initialization error:', error);
        alert('Unable to initialize payment. Please try again.');
        processingPayment.value = false;
      }
    };

    // Wallet payment confirmation
    const confirmWalletPayment = async () => {
      if (!order.value || processingPayment.value) return;

      processingPayment.value = true;

      try {
        const orderId = order.value._id;
        const amount = order.value.total_amount;

        // Process wallet payment
        await payWithWalletAction({ orderId, amount });

        // Close modal
        showWalletConfirmModal.value = false;

        // Refresh order to show updated status
        await fetchOrderDetails(orderId);

        alert('Payment successful! Your order is being processed.');
      } catch (error) {
        console.error('Wallet payment error:', error);
        const msg = error?.response?.data?.message || 'Payment failed. Please try again.';
        alert(msg);
      } finally {
        processingPayment.value = false;
      }
    };

    // Actions
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
            drugId: item.drug_id || item.drug,
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
      // Could open a chat or redirect to support
      window.open('https://wa.me/2348000000000?text=Hi, I need help with order ' + (order.value?.order_number || ''), '_blank');
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
        alert("Thank you for your rating!");
        await fetchOrderDetails(route.params.id);
      } catch (error) {
        alert("Failed to submit rating. Please try again.");
      } finally {
        isSubmitting.value = false;
      }
    };

    const downloadPdf = async () => {
      if (!order.value?._id) return;
      try {
        downloadingPdf.value = true;
        const presignedUrl = await getOrderPdfUrl(order.value._id);
        if (presignedUrl) {
          window.open(presignedUrl, '_blank');
        }
      } catch (error) {
        alert('Failed to download PDF. Please try again.');
      } finally {
        downloadingPdf.value = false;
      }
    };

    // Check for payment verification on return from Paystack
    const verifyPaymentReturn = async () => {
      const paymentQuery = route.query.payment;
      // Vue Router can return arrays for query params - ensure we get a string
      const rawReference = route.query.reference || route.query.trxref;
      const reference = Array.isArray(rawReference) ? rawReference[0] : rawReference;
      const orderId = route.params.id;

      if (paymentQuery === 'verify' && reference && orderId) {
        processingPayment.value = true;

        try {
          // Verify and process the payment
          await processCardPayment({
            orderId,
            paymentReference: String(reference), // Ensure it's a string
            amount: 0, // Backend will use actual amount from order
          });

          // Clear stored data
          localStorage.removeItem('pending_pharmacy_order_id');
          localStorage.removeItem('pending_pharmacy_payment_reference');

          // Refresh order to show updated status
          await fetchOrderDetails(orderId);

          alert('Payment successful! Your order is being processed.');

          // Clean up URL query params
          router.replace({ path: route.path });
        } catch (error) {
          console.error('Payment verification failed:', error);
          alert('Payment verification pending. Please refresh the page to check status.');
          await fetchOrderDetails(orderId);
        } finally {
          processingPayment.value = false;
        }

        return true;
      }

      return false;
    };

    onMounted(async () => {
      const orderId = route.params.id;
      if (orderId) {
        // Check if returning from Paystack payment
        const isVerifying = await verifyPaymentReturn();

        // Only fetch if not already fetched during verification
        if (!isVerifying) {
          await fetchOrderDetails(orderId);
        }
      }
    });

    return {
      order,
      loading,
      needsPayment,
      statusClass,
      paymentStatusClass,
      paymentIcon,
      orderTimeline,
      canTrack,
      canCancel,
      canReorder,
      canRate,
      showVerificationNotice,
      hasInteractionWarnings,
      processingPayment,
      showPaymentModal,
      showWalletConfirmModal,
      selectedPaymentMethod,
      walletBalance,
      selectedRating,
      hoverRating,
      reviewText,
      isSubmitting,
      downloadingPdf,
      formatPrice,
      formatDateTime,
      formatStatus,
      formatPaymentStatus,
      formatPaymentMethod,
      formatDeliveryMethod,
      formatDosageForm,
      formatAddress,
      getContactName,
      getContactPhone,
      getSeverityClass,
      initiatePayment,
      closePaymentModal,
      closeWalletConfirmModal,
      proceedWithPayment,
      confirmWalletPayment,
      contactPharmacy,
      trackOrder,
      cancelOrder,
      reorder,
      contactSupport,
      submitRating,
      downloadPdf,
    };
  },
};
</script>

<style scoped lang="scss">
// Design tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

.order-details-page {
  min-height: 100vh;
  background: linear-gradient(180deg, $sky-light 0%, #F8FAFC 30%);
  padding-bottom: 100px;
}

// Mobile Header
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(79, 195, 247, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;

  .back-btn, .help-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: $sky-light;
    color: $sky-dark;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: $sky;
      color: white;
    }
  }

  .header-title {
    font-size: 17px;
    font-weight: 600;
    color: #1E293B;
  }
}

// Breadcrumbs
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  font-size: 13px;
  flex-wrap: wrap;

  .crumb {
    color: #64748B;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s ease;

    &:hover:not(.current) {
      color: $sky-dark;
    }

    &.current {
      color: $sky-dark;
      font-weight: 600;
    }
  }

  .separator {
    color: #CBD5E1;
  }
}

// Loading State
.loading-state {
  padding: 20px;

  .skeleton-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .skeleton-card {
    background: white;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  }

  .skeleton-line {
    height: 16px;
    background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
    margin-bottom: 12px;

    &.w-25 { width: 25%; }
    &.w-30 { width: 30%; }
    &.w-40 { width: 40%; }
    &.w-60 { width: 60%; }
    &.w-70 { width: 70%; }
  }

  .skeleton-steps {
    display: flex;
    gap: 16px;
    margin-top: 20px;

    .skeleton-step {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
  }

  .skeleton-item {
    display: flex;
    gap: 16px;
    margin-top: 16px;

    .skeleton-image {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-content {
      flex: 1;
    }
  }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// Error State
.error-state {
  padding: 40px 20px;
  display: flex;
  justify-content: center;

  .error-card {
    text-align: center;
    max-width: 400px;
    padding: 48px 32px;

    .error-icon {
      width: 80px;
      height: 80px;
      background: $rose-light;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: $rose;
    }

    h2 {
      font-size: 22px;
      font-weight: 700;
      color: #1E293B;
      margin-bottom: 8px;
    }

    p {
      color: #64748B;
      margin-bottom: 24px;
      line-height: 1.5;
    }
  }
}

// Bento Grid
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
  padding: 0 16px;
  max-width: 1200px;
  margin: 0 auto;

  .span-full { grid-column: span 12; }
  .span-8 { grid-column: span 12; }
  .span-6 { grid-column: span 12; }
  .span-4 { grid-column: span 12; }

  @media (min-width: 768px) {
    gap: 20px;
    padding: 0 24px;

    .span-8 { grid-column: span 8; }
    .span-6 { grid-column: span 6; }
    .span-4 { grid-column: span 4; }
  }
}

// Glass Card Base
.bento-card, .glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

// Card Headers
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  .header-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.sky { background: $sky-light; color: $sky-dark; }
    &.emerald { background: $emerald-light; color: $emerald; }
    &.amber { background: $amber-light; color: $amber; }
    &.rose { background: $rose-light; color: $rose; }
    &.violet { background: $violet-light; color: $violet; }
  }

  h2 {
    font-size: 16px;
    font-weight: 600;
    color: #1E293B;
    flex: 1;
  }

  .item-count {
    font-size: 13px;
    color: #64748B;
    background: #F1F5F9;
    padding: 4px 10px;
    border-radius: 20px;
  }
}

// Order Header Card
.order-header-card {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  background: linear-gradient(135deg, white 0%, $sky-light 100%);

  .order-badge {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 8px 24px rgba(79, 195, 247, 0.3);
  }

  .order-info {
    flex: 1;
    min-width: 180px;

    .order-label {
      font-size: 12px;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .order-number {
      font-size: 22px;
      font-weight: 700;
      color: #1E293B;
      margin: 4px 0;
    }

    .order-date {
      font-size: 13px;
      color: #64748B;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .status-wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }

  .status-badge, .payment-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .status-badge {
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    &.pending { background: $amber-light; color: #92400E; .status-dot { background: $amber; } }
    &.confirmed, &.processing { background: $sky-light; color: $sky-dark; .status-dot { background: $sky; } }
    &.ready, &.delivery { background: $emerald-light; color: #065F46; .status-dot { background: $emerald; } }
    &.completed { background: $emerald-light; color: #065F46; .status-dot { background: $emerald; animation: none; } }
    &.cancelled, &.refunded { background: $rose-light; color: #9F1239; .status-dot { background: $rose; animation: none; } }
  }

  .payment-badge {
    &.pending { background: $amber-light; color: #92400E; }
    &.paid { background: $emerald-light; color: #065F46; }
    &.failed { background: $rose-light; color: #9F1239; }
    &.refunded { background: $violet-light; color: #5B21B6; }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// Payment Alert Card
.payment-alert-card {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border: 2px solid $amber;

  .alert-content {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;

    .alert-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.warning {
        background: rgba(245, 158, 11, 0.2);
        color: #92400E;
      }
    }

    .alert-text {
      h3 {
        font-size: 16px;
        font-weight: 700;
        color: #92400E;
        margin-bottom: 4px;
      }

      p {
        font-size: 14px;
        color: #78350F;
        line-height: 1.5;
      }
    }
  }

  .alert-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;

    .payment-amount {
      .amount-label {
        display: block;
        font-size: 12px;
        color: #92400E;
        margin-bottom: 2px;
      }

      .amount-value {
        font-size: 24px;
        font-weight: 700;
        color: #78350F;
      }
    }

    .pay-now-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      background: linear-gradient(135deg, $emerald 0%, #059669 100%);
      border: none;
      border-radius: 14px;
      color: white;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }
    }
  }
}

// Timeline Card
.timeline-card {
  .timeline {
    position: relative;
    padding-left: 8px;

    .timeline-step {
      position: relative;
      padding-left: 48px;
      padding-bottom: 24px;

      &:last-child {
        padding-bottom: 0;

        .step-line {
          display: none;
        }
      }

      .step-line {
        position: absolute;
        left: 15px;
        top: 36px;
        width: 2px;
        height: calc(100% - 12px);
        background: #E2E8F0;
      }

      .step-indicator {
        position: absolute;
        left: 0;
        top: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #F1F5F9;
        border: 2px solid #E2E8F0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #94A3B8;
        z-index: 1;
      }

      .step-content {
        .step-title {
          display: block;
          font-size: 14px;
          color: #64748B;
          font-weight: 500;
        }

        .step-date {
          font-size: 12px;
          color: #94A3B8;
        }
      }

      &.completed {
        .step-line {
          background: $emerald;
        }

        .step-indicator {
          background: $emerald;
          border-color: $emerald;
          color: white;
        }

        .step-title {
          color: #1E293B;
          font-weight: 600;
        }
      }

      &.current {
        .step-indicator {
          background: $sky;
          border-color: $sky;
          color: white;
          box-shadow: 0 0 0 4px rgba(79, 195, 247, 0.2);
        }

        .step-title {
          color: $sky-dark;
          font-weight: 700;
        }
      }
    }
  }
}

// Quick Actions Card
.actions-card {
  .quick-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .action-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: $sky-light;
        border-color: $sky;
        color: $sky-dark;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.primary {
        background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
        border-color: transparent;
        color: white;

        &:hover:not(:disabled) {
          box-shadow: 0 4px 16px rgba(79, 195, 247, 0.3);
        }
      }

      &.danger {
        &:hover:not(:disabled) {
          background: $rose-light;
          border-color: $rose;
          color: $rose;
        }
      }
    }
  }
}

// Items Card
.items-card {
  .items-list {
    .item-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 0;
      border-bottom: 1px solid #F1F5F9;

      &:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .item-image {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        overflow: hidden;
        background: #F8FAFC;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94A3B8;
        }
      }

      .item-details {
        flex: 1;
        min-width: 0;

        h4 {
          font-size: 14px;
          font-weight: 600;
          color: #1E293B;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .item-meta {
          font-size: 12px;
          color: #64748B;

          span + span::before {
            content: " • ";
          }
        }

        .manufacturer {
          display: block;
          font-size: 11px;
          color: $sky-dark;
          font-weight: 500;
          margin-top: 2px;
        }
      }

      .item-qty {
        text-align: center;
        padding: 0 12px;

        .qty-label {
          display: block;
          font-size: 10px;
          color: #94A3B8;
          text-transform: uppercase;
        }

        .qty-value {
          font-size: 16px;
          font-weight: 700;
          color: #1E293B;
        }
      }

      .item-price {
        font-size: 15px;
        font-weight: 700;
        color: #1E293B;
        white-space: nowrap;
      }
    }
  }
}

// Notice Card
.notice-card {
  display: flex;
  gap: 16px;

  &.warning {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
    border: 2px solid $amber;
  }

  .notice-icon {
    width: 48px;
    height: 48px;
    background: rgba(245, 158, 11, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #92400E;
    flex-shrink: 0;
  }

  .notice-content {
    flex: 1;

    h3 {
      font-size: 15px;
      font-weight: 700;
      color: #92400E;
      margin-bottom: 4px;
    }

    p {
      font-size: 13px;
      color: #78350F;
      line-height: 1.5;
      margin-bottom: 8px;
    }

    .verification-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      color: #78350F;
      background: rgba(255, 255, 255, 0.5);
      padding: 4px 10px;
      border-radius: 20px;
    }
  }
}

// Interactions Card
.interactions-card {
  &.danger {
    border: 2px solid $rose;
    background: linear-gradient(135deg, white 0%, $rose-light 100%);
  }

  .warning-disclaimer {
    font-size: 13px;
    color: #9F1239;
    margin-bottom: 16px;
    font-style: italic;
  }

  .interactions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .interaction-item {
      background: white;
      border-radius: 12px;
      padding: 16px;
      border-left: 4px solid;

      &.critical { border-left-color: #7F1D1D; background: #FEF2F2; }
      &.severe { border-left-color: $rose; background: #FFF1F2; }
      &.moderate { border-left-color: $amber; background: #FFFBEB; }
      &.mild { border-left-color: #FBBF24; background: #FEFCE8; }

      .interaction-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        flex-wrap: wrap;
        gap: 8px;

        .drug-pair {
          font-size: 14px;
          font-weight: 600;
          color: #1E293B;
        }

        .severity-tag {
          font-size: 10px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 20px;
          text-transform: uppercase;

          &.critical { background: #7F1D1D; color: white; }
          &.severe { background: $rose; color: white; }
          &.moderate { background: $amber; color: white; }
          &.mild { background: #FBBF24; color: #78350F; }
        }
      }

      .interaction-desc {
        font-size: 13px;
        color: #475569;
        line-height: 1.5;
        margin-bottom: 8px;
      }

      .recommendation {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 12px;
        color: #065F46;
        background: $emerald-light;
        padding: 10px 12px;
        border-radius: 8px;
      }
    }
  }
}

// Pharmacy Card
.pharmacy-card {
  .pharmacy-info {
    h3 {
      font-size: 16px;
      font-weight: 700;
      color: #1E293B;
      margin-bottom: 8px;
    }

    .pharmacy-address, .pharmacy-phone {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 13px;
      color: #64748B;
      margin-bottom: 6px;

      svg {
        flex-shrink: 0;
        margin-top: 2px;
      }
    }

    .call-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 16px;
      padding: 10px 20px;
      background: $sky;
      border: none;
      border-radius: 10px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: $sky-dark;
      }
    }
  }
}

// Delivery Card
.delivery-card {
  .delivery-info {
    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 10px 0;
      border-bottom: 1px solid #F1F5F9;

      &:last-child {
        border-bottom: none;
      }

      .info-label {
        font-size: 13px;
        color: #64748B;
      }

      .info-value {
        font-size: 13px;
        color: #1E293B;
        font-weight: 500;
        text-align: right;
        max-width: 60%;

        &.highlight {
          color: $sky-dark;
          font-weight: 600;
        }
      }
    }
  }
}

// Payment Card
.payment-card {
  .payment-summary {
    .summary-rows {
      margin-bottom: 20px;

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        font-size: 14px;
        color: #64748B;
        border-bottom: 1px solid #F1F5F9;

        &:last-child {
          border-bottom: none;
        }

        &.discount {
          color: $emerald;

          span:first-child {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }

        &.total {
          font-size: 18px;
          font-weight: 700;
          color: #1E293B;
          padding-top: 16px;
          margin-top: 8px;
          border-top: 2px solid #E2E8F0;
          border-bottom: none;
        }
      }
    }

    .payment-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding-top: 16px;
      border-top: 1px solid #F1F5F9;

      .meta-item {
        flex: 1;
        min-width: 150px;

        .meta-label {
          display: block;
          font-size: 11px;
          color: #94A3B8;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .meta-value {
          font-size: 14px;
          color: #1E293B;
          font-weight: 500;
        }

        .meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;

          &.pending { background: $amber-light; color: #92400E; }
          &.paid { background: $emerald-light; color: #065F46; }
          &.failed { background: $rose-light; color: #9F1239; }
          &.refunded { background: $violet-light; color: #5B21B6; }
        }
      }
    }
  }
}

// Rating Card
.rating-card {
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
  border: 2px solid $amber;

  .rating-display {
    text-align: center;

    .stars-display {
      display: flex;
      justify-content: center;
      gap: 4px;
      margin-bottom: 8px;

      .star {
        color: #E2E8F0;

        &.filled {
          color: $amber;
        }
      }
    }

    .rating-value {
      font-size: 20px;
      font-weight: 700;
      color: #1E293B;
      margin-bottom: 8px;
    }

    .review-text {
      font-size: 14px;
      color: #64748B;
      font-style: italic;
      background: rgba(255, 255, 255, 0.6);
      padding: 12px 16px;
      border-radius: 12px;
      margin-bottom: 8px;
    }

    .rated-date {
      font-size: 12px;
      color: #94A3B8;
    }
  }

  .rating-form {
    .rating-prompt {
      text-align: center;
      font-size: 15px;
      color: #64748B;
      margin-bottom: 16px;
    }

    .star-rating {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 8px;

      .star-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #E2E8F0;
        padding: 4px;
        transition: all 0.2s ease;

        &:hover, &.hover, &.active {
          color: $amber;
          transform: scale(1.15);
        }
      }
    }

    .rating-labels {
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
      margin-bottom: 20px;

      span {
        font-size: 12px;
        color: #94A3B8;
      }
    }

    .review-input {
      width: 100%;
      padding: 14px;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      margin-bottom: 16px;
      background: white;

      &:focus {
        outline: none;
        border-color: $sky;
        box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.1);
      }
    }

    .submit-rating-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px;
      background: linear-gradient(135deg, $amber 0%, #D97706 100%);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}

// Instructions Card
.instructions-card {
  .instructions-text {
    font-size: 14px;
    color: #475569;
    line-height: 1.6;
    background: #F8FAFC;
    padding: 16px;
    border-radius: 12px;
  }
}

// Primary Button
.primary-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(79, 195, 247, 0.3);
  }
}

// Bottom Spacer
.bottom-spacer {
  height: 100px;
}

// Spin animation
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Media queries for larger screens
@media (min-width: 768px) {
  .mobile-header {
    display: none;
  }

  .breadcrumbs {
    padding: 20px 24px;
  }

  .order-header-card {
    .order-info {
      .order-number {
        font-size: 28px;
      }
    }
  }
}

// Modal Styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease;

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #F1F5F9;

    .modal-title {
      display: flex;
      align-items: center;
      gap: 10px;
      color: $sky-dark;

      h2 {
        font-size: 18px;
        font-weight: 700;
        color: #1E293B;
        margin: 0;
      }
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: none;
      background: #F1F5F9;
      color: #64748B;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #E2E8F0;
        color: #1E293B;
      }
    }
  }

  .modal-body {
    padding: 24px;
    overflow-y: auto;
    max-height: calc(90vh - 160px);
  }

  .modal-footer {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #F1F5F9;

    .btn-secondary {
      flex: 1;
      padding: 14px 20px;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      background: white;
      color: #64748B;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #F8FAFC;
        border-color: #CBD5E1;
      }
    }

    .btn-primary {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        box-shadow: 0 8px 24px rgba(79, 195, 247, 0.3);
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      &.wallet-btn {
        background: linear-gradient(135deg, $emerald 0%, #059669 100%);

        &:hover:not(:disabled) {
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        }
      }
    }
  }
}

// Payment Modal Specific Styles
.payment-modal {
  .payment-info {
    text-align: center;
    color: #64748B;
    font-size: 14px;
    margin-bottom: 20px;
  }

  .amount-display {
    text-align: center;
    background: linear-gradient(135deg, $sky-light 0%, #E0F7FA 100%);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;

    .amount-label {
      display: block;
      font-size: 12px;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .amount-value {
      font-size: 28px;
      font-weight: 700;
      color: $sky-dark;
    }
  }

  .payment-options {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .payment-option {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      border: 2px solid #E2E8F0;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: $sky;
        background: rgba(79, 195, 247, 0.05);
      }

      &.selected {
        border-color: $sky;
        background: $sky-light;

        .option-radio {
          border-color: $sky;
          background: $sky;
        }
      }

      &.insufficient {
        opacity: 0.7;

        .option-desc {
          color: $rose;
        }
      }

      .option-radio {
        width: 22px;
        height: 22px;
        border: 2px solid #CBD5E1;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s ease;

        .radio-inner {
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
        }
      }

      .option-icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.card-icon {
          background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
          color: white;
        }

        &.wallet-icon {
          background: linear-gradient(135deg, $emerald 0%, #059669 100%);
          color: white;
        }
      }

      .option-content {
        flex: 1;

        .option-title {
          display: block;
          font-size: 15px;
          font-weight: 600;
          color: #1E293B;
          margin-bottom: 2px;
        }

        .option-desc {
          font-size: 13px;
          color: #64748B;

          .insufficient-badge {
            display: inline-block;
            background: $rose-light;
            color: $rose;
            font-size: 11px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 10px;
            margin-left: 6px;
          }
        }
      }
    }
  }
}

// Wallet Confirmation Modal Specific Styles
.wallet-confirm-modal {
  .wallet-summary {
    text-align: center;
    margin-bottom: 24px;

    .summary-icon {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, $emerald-light 0%, #A7F3D0 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      color: $emerald;
    }

    .summary-text {
      color: #64748B;
      font-size: 15px;
    }
  }

  .wallet-details {
    background: #F8FAFC;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;

      .detail-label {
        font-size: 14px;
        color: #64748B;
      }

      .detail-value {
        font-size: 16px;
        font-weight: 600;
        color: #1E293B;

        &.balance {
          color: $emerald;
        }
      }

      &.debit {
        .detail-value {
          color: $rose;
        }
      }

      &.remaining {
        .detail-label {
          font-weight: 600;
          color: #1E293B;
        }

        .detail-value {
          font-size: 18px;
          color: $sky-dark;
        }
      }
    }

    .detail-divider {
      height: 1px;
      background: #E2E8F0;
      margin: 4px 0;
    }
  }

  .wallet-notice {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: $amber-light;
    border-radius: 12px;
    padding: 14px 16px;
    font-size: 13px;
    color: #92400E;

    svg {
      flex-shrink: 0;
      margin-top: 1px;
    }
  }
}
</style>
