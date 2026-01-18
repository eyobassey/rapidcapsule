<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Checkout"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="checkout-page">
        <!-- Order Summary (Collapsible) -->
        <div class="checkout-section order-summary-section">
          <div class="section-header" @click="showOrderSummary = !showOrderSummary">
            <div class="header-left">
              <span class="section-icon">📦</span>
              <div>
                <h3>Order Summary</h3>
                <span class="item-count">{{ cartItemCount }} item(s) • {{ formatPrice(cartTotal) }}</span>
              </div>
            </div>
            <span class="toggle-icon" :class="{ open: showOrderSummary }">▼</span>
          </div>

          <div v-if="showOrderSummary" class="section-content">
            <div class="order-items">
              <div v-for="item in cart" :key="item.drugId" class="order-item">
                <div class="item-image">
                  <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" crossorigin="anonymous" />
                  <div v-else class="image-placeholder">💊</div>
                </div>
                <div class="item-details">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-qty">Qty: {{ item.quantity }}</span>
                </div>
                <span class="item-price">{{ formatPrice(item.price * item.quantity) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Delivery Information (Read-only) -->
        <div class="checkout-section delivery-info-section">
          <div class="section-header">
            <span class="section-icon">{{ deliveryMethod === 'delivery' ? '🏠' : '🏪' }}</span>
            <h3>{{ deliveryMethod === 'delivery' ? 'Delivery Address' : 'Pickup Location' }}</h3>
          </div>

          <div class="section-content">
            <div v-if="deliveryMethod === 'delivery' && selectedDeliveryAddress" class="delivery-details">
              <div class="detail-row">
                <strong>{{ selectedDeliveryAddress.recipient_name }}</strong>
              </div>
              <div class="detail-row address">{{ formatAddressDisplay(selectedDeliveryAddress) }}</div>
              <div class="detail-row" v-if="selectedDeliveryAddress.phone">{{ selectedDeliveryAddress.phone }}</div>
            </div>
            <div v-else-if="deliveryMethod === 'pickup' && defaultPharmacy" class="pickup-details">
              <div class="detail-row">
                <strong>{{ defaultPharmacy.name }}</strong>
              </div>
              <div class="detail-row address">{{ formatPharmacyAddress(defaultPharmacy) }}</div>
              <div class="pickup-note">A pickup code will be sent after your order is ready</div>
            </div>
            <button class="edit-btn" @click="$router.push('/app/patient/pharmacy/cart')">Edit</button>
          </div>
        </div>

        <!-- Contact Information -->
        <div class="checkout-section contact-section">
          <div class="section-header">
            <span class="section-icon">👤</span>
            <h3>Contact Information</h3>
          </div>

          <div class="section-content">
            <div class="contact-form">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" v-model="contactInfo.name" placeholder="Your name" />
              </div>
              <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" v-model="contactInfo.phone" placeholder="Phone number" />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" v-model="contactInfo.email" placeholder="Email address" />
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Method -->
        <div class="checkout-section payment-section">
          <div class="section-header">
            <span class="section-icon">💳</span>
            <h3>Payment Method</h3>
          </div>

          <div class="section-content">
            <div class="payment-options">
              <!-- Card Payment -->
              <div
                :class="['payment-option', { selected: paymentMethod === 'card' }]"
                @click="paymentMethod = 'card'"
              >
                <div class="radio-circle" :class="{ checked: paymentMethod === 'card' }"></div>
                <div class="option-content">
                  <span class="option-icon">💳</span>
                  <div class="option-info">
                    <strong>Pay with Card</strong>
                    <span>Debit/Credit Card via Paystack</span>
                  </div>
                </div>
              </div>

              <!-- Wallet Payment (if balance sufficient) -->
              <div
                v-if="walletBalance > 0"
                :class="['payment-option', { selected: paymentMethod === 'wallet', disabled: walletBalance < totalAmount }]"
                @click="walletBalance >= totalAmount && (paymentMethod = 'wallet')"
              >
                <div class="radio-circle" :class="{ checked: paymentMethod === 'wallet' }"></div>
                <div class="option-content">
                  <span class="option-icon">👛</span>
                  <div class="option-info">
                    <strong>Pay with Wallet</strong>
                    <span>Balance: {{ formatPrice(walletBalance) }}</span>
                    <span v-if="walletBalance < totalAmount" class="insufficient">Insufficient balance</span>
                  </div>
                </div>
              </div>

              <!-- Split Payment (if wallet has some balance) -->
              <div
                v-if="walletBalance > 0 && walletBalance < totalAmount"
                :class="['payment-option', { selected: paymentMethod === 'split' }]"
                @click="paymentMethod = 'split'"
              >
                <div class="radio-circle" :class="{ checked: paymentMethod === 'split' }"></div>
                <div class="option-content">
                  <span class="option-icon">✂️</span>
                  <div class="option-info">
                    <strong>Split Payment</strong>
                    <span>Wallet ({{ formatPrice(walletBalance) }}) + Card ({{ formatPrice(totalAmount - walletBalance) }})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Promo Code -->
        <div class="checkout-section promo-section">
          <div class="promo-input-wrapper">
            <input
              type="text"
              v-model="promoCode"
              placeholder="Enter promo code"
              :disabled="promoApplied"
            />
            <button
              class="apply-btn"
              @click="applyPromoCode"
              :disabled="!promoCode || promoApplied"
            >
              {{ promoApplied ? 'Applied' : 'Apply' }}
            </button>
          </div>
          <div v-if="promoApplied" class="promo-success">
            Promo applied! You saved {{ formatPrice(promoDiscount) }}
          </div>
        </div>

        <!-- Price Breakdown -->
        <div class="price-breakdown">
          <div class="price-row">
            <span>Subtotal</span>
            <span>{{ formatPrice(cartTotal) }}</span>
          </div>
          <div class="price-row" v-if="deliveryMethod === 'delivery'">
            <span>Delivery Fee</span>
            <span>{{ formatPrice(deliveryFee) }}</span>
          </div>
          <div class="price-row discount" v-if="promoDiscount > 0">
            <span>Promo Discount</span>
            <span>-{{ formatPrice(promoDiscount) }}</span>
          </div>
          <div class="price-row discount" v-if="paymentMethod === 'wallet' || paymentMethod === 'split'">
            <span>Wallet Payment</span>
            <span>-{{ formatPrice(walletPaymentAmount) }}</span>
          </div>
          <div class="price-row total">
            <span>Total to Pay</span>
            <span>{{ formatPrice(amountToPay) }}</span>
          </div>
        </div>

        <!-- Order Error Alert -->
        <div v-if="orderError" class="order-error-alert">
          <div class="error-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="error-content">
            <strong>Order Failed</strong>
            <p>{{ orderError }}</p>
          </div>
          <button class="error-dismiss" @click="orderError = null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Place Order Button -->
        <div class="checkout-actions">
          <rc-button
            type="primary"
            :label="placeOrderButtonLabel"
            @click="placeOrder"
            :disabled="!canPlaceOrder || placingOrder"
          />
          <p class="terms-note">
            By placing this order, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
          </p>
        </div>

        <!-- Loading Overlay -->
        <div v-if="placingOrder" class="loading-overlay">
          <div class="loading-content">
            <div class="spinner"></div>
            <p>Processing your order...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";

export default {
  name: "PharmacyCheckout",
  components: {
    TopBar,
    RcButton,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const route = useRoute();

    // UI State
    const showOrderSummary = ref(false);
    const paymentMethod = ref("card");
    const promoCode = ref("");
    const promoApplied = ref(false);
    const promoDiscount = ref(0);
    const placingOrder = ref(false);
    const orderError = ref(null);
    const deliveryFee = ref(1500);

    // Contact info
    const contactInfo = ref({
      name: "",
      phone: "",
      email: "",
    });

    const {
      "pharmacy/loadCartFromStorage": loadCartFromStorage,
      "pharmacy/loadDeliveryPreferencesFromStorage": loadDeliveryPreferencesFromStorage,
      "pharmacy/refreshCartImages": refreshCartImages,
      "pharmacy/fetchDefaultPharmacy": fetchDefaultPharmacy,
      "pharmacy/createOTCOrder": createOTCOrder,
      "pharmacy/createPrescriptionOrder": createPrescriptionOrder,
      "pharmacy/payWithWallet": payWithWallet,
      "pharmacy/clearCart": clearCart,
      "pharmacy/clearCheckoutState": clearCheckoutState,
    } = useMapActions();

    const {
      "pharmacy/getCart": cart,
      "pharmacy/getCartItemCount": cartItemCount,
      "pharmacy/getCartTotal": cartTotal,
      "pharmacy/getDeliveryMethod": deliveryMethod,
      "pharmacy/getSelectedDeliveryAddress": selectedDeliveryAddress,
      "pharmacy/getDefaultPharmacy": defaultPharmacy,
      "pharmacy/getSelectedPharmacy": selectedPharmacy,
      "pharmacy/getSelectedPrescription": selectedPrescription,
      "pharmacy/getSelectedPrescriptionType": selectedPrescriptionType,
      "pharmacy/getWalletBalance": walletBalance,
      "pharmacy/getCartHasRxItems": hasRxItems,
      "pharmacy/getErrorMessage": storeErrorMessage,
      "userprofile": userProfile,
    } = useMapGetters();

    // Calculate wallet payment amount
    const walletPaymentAmount = computed(() => {
      if (paymentMethod.value === "wallet") {
        return Math.min(walletBalance.value, totalAmount.value);
      }
      if (paymentMethod.value === "split") {
        return walletBalance.value;
      }
      return 0;
    });

    // Calculate total amount before payment adjustments
    const totalAmount = computed(() => {
      let total = cartTotal.value;
      if (deliveryMethod.value === "delivery") {
        total += deliveryFee.value;
      }
      total -= promoDiscount.value;
      return Math.max(0, total);
    });

    // Calculate amount to pay (after wallet deduction)
    const amountToPay = computed(() => {
      return Math.max(0, totalAmount.value - walletPaymentAmount.value);
    });

    // Check if can place order
    const canPlaceOrder = computed(() => {
      if (cart.value.length === 0) return false;
      if (!contactInfo.value.name || !contactInfo.value.phone) return false;
      if (deliveryMethod.value === "delivery" && !selectedDeliveryAddress.value) return false;
      if (hasRxItems.value && !selectedPrescription.value) return false;
      return true;
    });

    // Place order button label
    const placeOrderButtonLabel = computed(() => {
      if (placingOrder.value) return "Processing...";
      if (amountToPay.value === 0) return "Place Order (Free)";
      return `Pay ${formatPrice(amountToPay.value)}`;
    });

    const formatPrice = (price) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(price || 0);
    };

    const formatAddressDisplay = (address) => {
      if (!address) return "";
      const parts = [];
      if (address.street || address.address_line1) parts.push(address.street || address.address_line1);
      if (address.city) parts.push(address.city);
      if (address.state) parts.push(address.state);
      return parts.join(", ");
    };

    const formatPharmacyAddress = (pharmacy) => {
      if (!pharmacy?.address) return "";
      const addr = pharmacy.address;
      return `${addr.street || ""}, ${addr.city || ""}, ${addr.state || ""}`.replace(/^, |, $/g, "");
    };

    const applyPromoCode = async () => {
      // TODO: Implement promo code validation with backend
      // For now, just simulate
      if (promoCode.value.toLowerCase() === "first10") {
        promoDiscount.value = cartTotal.value * 0.1;
        promoApplied.value = true;
      } else {
        alert("Invalid promo code");
      }
    };

    const placeOrder = async () => {
      if (!canPlaceOrder.value || placingOrder.value) return;

      placingOrder.value = true;

      try {
        const pharmacy = selectedPharmacy.value || defaultPharmacy.value;
        if (!pharmacy) {
          throw new Error("No pharmacy selected");
        }

        // Validate cart items have valid drug IDs
        const invalidItems = cart.value.filter(item => !item.drugId);
        if (invalidItems.length > 0) {
          console.error("Invalid cart items without drugId:", invalidItems);
          alert("Your cart contains invalid items. Please clear your cart and add items again.");
          clearCart();
          router.push("/app/patient/pharmacy");
          placingOrder.value = false;
          return;
        }

        // Prepare order items (include batchId if user selected a specific batch)
        const items = cart.value.map(item => ({
          drug: item.drugId,
          quantity: item.quantity,
          dosage_instructions: item.dosageInstructions || "",
          batch_id: item.batchId || null,
        }));

        // Prepare delivery address if delivery method
        let deliveryAddress = null;
        if (deliveryMethod.value === "delivery" && selectedDeliveryAddress.value) {
          const addr = selectedDeliveryAddress.value;
          deliveryAddress = {
            recipient_name: addr.recipient_name || contactInfo.value.name,
            phone: addr.phone || contactInfo.value.phone,
            email: contactInfo.value.email,
            address_line1: addr.street || addr.address_line1 || "",
            city: addr.city || "",
            state: addr.state || "",
            postal_code: addr.postal_code || "",
            landmark: addr.additional_info || addr.landmark || "",
          };
        }

        // Create order based on whether it has prescription items
        let orderData;
        if (hasRxItems.value && selectedPrescription.value) {
          // Determine if it's an uploaded prescription or specialist prescription
          const isSpecialistPrescription = selectedPrescriptionType.value === 'specialist';

          orderData = {
            pharmacy: pharmacy._id,
            // Pass prescription or specialist_prescription based on type
            ...(isSpecialistPrescription
              ? { specialist_prescription: selectedPrescription.value._id }
              : { prescription: selectedPrescription.value._id }
            ),
            items,
            delivery_method: deliveryMethod.value === "delivery" ? "DELIVERY" : "PICKUP",
            delivery_address: deliveryAddress,
            patient_notes: "",
          };
          // Call prescription order endpoint
          const response = await createPrescriptionOrder(orderData);
          if (response && response.data) {
            await handlePayment(response.data);
          }
        } else {
          orderData = {
            pharmacy: pharmacy._id,
            items,
            delivery_method: deliveryMethod.value === "delivery" ? "DELIVERY" : "PICKUP",
            delivery_address: deliveryAddress,
            patient_notes: "",
            discount_code: promoApplied.value ? promoCode.value : "",
          };
          // Call OTC order endpoint
          const response = await createOTCOrder(orderData);
          if (response && response.data) {
            await handlePayment(response.data);
          }
        }
      } catch (error) {
        console.error("Error placing order:", error);
        console.error("extractedMessage:", error.extractedMessage);

        // Use the extracted message attached by the store action
        const errorMessage = error.extractedMessage ||
                            storeErrorMessage.value ||
                            "Failed to place order. Please try again.";

        console.error("Final errorMessage to display:", errorMessage);

        // Set order error state for UI display
        orderError.value = errorMessage;

        // Also show alert as backup
        alert(errorMessage);
      } finally {
        placingOrder.value = false;
      }
    };

    const handlePayment = async (order) => {
      const orderId = order._id || order.id;

      if (paymentMethod.value === "wallet" && amountToPay.value === 0) {
        // Full wallet payment
        try {
          await payWithWallet({ orderId, amount: totalAmount.value });
          orderSuccess(orderId);
        } catch (error) {
          console.error("Wallet payment failed:", error);
          alert("Wallet payment failed. Please try another payment method.");
        }
      } else if (paymentMethod.value === "split") {
        // Split payment - first pay with wallet
        try {
          await payWithWallet({ orderId, amount: walletBalance.value });
          // Then proceed to card payment for remaining amount
          initializePaystackPayment(orderId, amountToPay.value);
        } catch (error) {
          console.error("Wallet portion failed:", error);
          alert("Split payment failed. Please try again.");
        }
      } else {
        // Full card payment
        initializePaystackPayment(orderId, amountToPay.value);
      }
    };

    const initializePaystackPayment = (orderId, amount) => {
      // Use Paystack inline
      const handler = window.PaystackPop.setup({
        key: process.env.VUE_APP_PAYSTACK_PUBLIC_KEY,
        email: contactInfo.value.email,
        amount: amount * 100, // Convert to kobo
        currency: "NGN",
        ref: `RCPH-${orderId}-${Date.now()}`,
        metadata: {
          order_id: orderId,
          custom_fields: [
            {
              display_name: "Order ID",
              variable_name: "order_id",
              value: orderId,
            },
          ],
        },
        callback: async (response) => {
          // Payment successful - verify and update order
          console.log("Payment successful:", response);
          orderSuccess(orderId);
        },
        onClose: () => {
          console.log("Payment window closed");
          // Order is created but unpaid - redirect to orders
          router.push(`/app/patient/pharmacy/orders/${orderId}?status=pending`);
        },
      });

      handler.openIframe();
    };

    const orderSuccess = (orderId) => {
      // Clear cart and checkout state
      clearCart();
      clearCheckoutState();
      // Navigate to order confirmation
      router.push(`/app/patient/pharmacy/orders/${orderId}?success=true`);
    };

    onMounted(async () => {
      // Load cart and delivery preferences from storage
      loadCartFromStorage();
      loadDeliveryPreferencesFromStorage();

      // Refresh cart item images for items missing imageUrl
      await refreshCartImages();

      // Fetch default pharmacy
      await fetchDefaultPharmacy();

      // Pre-fill contact info from user profile
      if (userProfile.value) {
        contactInfo.value.name = `${userProfile.value.profile?.first_name || ""} ${userProfile.value.profile?.last_name || ""}`.trim();
        contactInfo.value.phone = userProfile.value.profile?.phone_number || "";
        contactInfo.value.email = userProfile.value.email || "";
      }

      // Check for useWallet query param from cart
      if (route.query.useWallet === "true" && walletBalance.value >= totalAmount.value) {
        paymentMethod.value = "wallet";
      } else if (route.query.useWallet === "true" && walletBalance.value > 0) {
        paymentMethod.value = "split";
      }

      // Redirect to cart if missing required data
      if (cart.value.length === 0) {
        router.push("/app/patient/pharmacy/cart");
        return;
      }

      if (deliveryMethod.value === "delivery" && !selectedDeliveryAddress.value) {
        router.push("/app/patient/pharmacy/cart");
        return;
      }
    });

    return {
      // State
      showOrderSummary,
      paymentMethod,
      promoCode,
      promoApplied,
      promoDiscount,
      placingOrder,
      orderError,
      contactInfo,
      deliveryFee,
      // Store data
      cart,
      cartItemCount,
      cartTotal,
      deliveryMethod,
      selectedDeliveryAddress,
      defaultPharmacy,
      walletBalance,
      hasRxItems,
      // Computed
      walletPaymentAmount,
      totalAmount,
      amountToPay,
      canPlaceOrder,
      placeOrderButtonLabel,
      // Methods
      formatPrice,
      formatAddressDisplay,
      formatPharmacyAddress,
      applyPromoCode,
      placeOrder,
    };
  },
};
</script>

<style scoped lang="scss">
.checkout-page {
  padding: $size-16;
  padding-bottom: $size-100;
}

.checkout-section {
  background: $color-white;
  border-radius: $size-12;
  margin-bottom: $size-16;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .section-header {
    display: flex;
    align-items: center;
    gap: $size-12;
    padding: $size-16;

    .section-icon {
      font-size: $size-20;
    }

    h3 {
      font-size: $size-15;
      font-weight: 600;
      color: $color-g-21;
      margin: 0;
    }
  }

  .section-content {
    padding: 0 $size-16 $size-16;
  }
}

// Order Summary Section
.order-summary-section {
  .section-header {
    cursor: pointer;
    justify-content: space-between;

    .header-left {
      display: flex;
      align-items: center;
      gap: $size-12;
    }

    .item-count {
      font-size: $size-13;
      color: $color-g-54;
    }

    .toggle-icon {
      font-size: $size-12;
      color: $color-g-67;
      transition: transform 0.2s ease;

      &.open {
        transform: rotate(180deg);
      }
    }
  }

  .order-items {
    border-top: 1px solid $color-g-92;
    padding-top: $size-12;

    .order-item {
      display: flex;
      align-items: center;
      gap: $size-12;
      padding: $size-10 0;

      .item-image {
        width: 48px;
        height: 48px;
        border-radius: $size-8;
        overflow: hidden;
        background: $color-g-97;

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
          font-size: $size-20;
        }
      }

      .item-details {
        flex: 1;

        .item-name {
          display: block;
          font-size: $size-14;
          font-weight: 500;
          color: $color-g-21;
        }

        .item-qty {
          font-size: $size-12;
          color: $color-g-67;
        }
      }

      .item-price {
        font-size: $size-14;
        font-weight: 600;
        color: $color-g-21;
      }
    }
  }
}

// Delivery Info Section
.delivery-info-section {
  .section-content {
    position: relative;

    .delivery-details, .pickup-details {
      .detail-row {
        font-size: $size-14;
        color: $color-g-44;
        margin-bottom: $size-4;

        &.address {
          color: $color-g-67;
        }

        strong {
          color: $color-g-21;
        }
      }

      .pickup-note {
        font-size: $size-12;
        color: $color-pri;
        font-style: italic;
        margin-top: $size-8;
      }
    }

    .edit-btn {
      position: absolute;
      top: 0;
      right: 0;
      padding: $size-6 $size-12;
      font-size: $size-12;
      color: $color-pri;
      background: transparent;
      border: 1px solid $color-pri;
      border-radius: $size-6;
      cursor: pointer;
    }
  }
}

// Contact Section
.contact-section {
  .contact-form {
    .form-group {
      margin-bottom: $size-14;

      &:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        font-size: $size-12;
        font-weight: 500;
        color: $color-g-54;
        margin-bottom: $size-6;
      }

      input {
        width: 100%;
        padding: $size-12;
        border: 1px solid $color-g-85;
        border-radius: $size-8;
        font-size: $size-14;
        font-family: inherit;

        &:focus {
          outline: none;
          border-color: $color-pri;
        }
      }
    }
  }
}

// Payment Section
.payment-section {
  .payment-options {
    display: flex;
    flex-direction: column;
    gap: $size-10;
  }

  .payment-option {
    display: flex;
    align-items: center;
    gap: $size-12;
    padding: $size-14;
    border: 2px solid $color-g-85;
    border-radius: $size-10;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(.disabled) {
      border-color: $color-g-67;
    }

    &.selected {
      border-color: $color-pri;
      background: rgba($color-pri, 0.03);
    }

    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .radio-circle {
      width: $size-20;
      height: $size-20;
      border: 2px solid $color-g-67;
      border-radius: 50%;
      flex-shrink: 0;
      position: relative;

      &.checked {
        border-color: $color-pri;

        &::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: $size-10;
          height: $size-10;
          background: $color-pri;
          border-radius: 50%;
        }
      }
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: $size-12;

      .option-icon {
        font-size: $size-24;
      }

      .option-info {
        strong {
          display: block;
          font-size: $size-14;
          color: $color-g-21;
          margin-bottom: $size-2;
        }

        span {
          display: block;
          font-size: $size-12;
          color: $color-g-67;
        }

        .insufficient {
          color: #ef4444;
        }
      }
    }
  }
}

// Promo Section
.promo-section {
  padding: $size-16;

  .promo-input-wrapper {
    display: flex;
    gap: $size-10;

    input {
      flex: 1;
      padding: $size-12;
      border: 1px solid $color-g-85;
      border-radius: $size-8;
      font-size: $size-14;
      font-family: inherit;

      &:focus {
        outline: none;
        border-color: $color-pri;
      }
    }

    .apply-btn {
      padding: $size-12 $size-20;
      background: $color-g-92;
      border: none;
      border-radius: $size-8;
      font-size: $size-14;
      font-weight: 500;
      color: $color-g-44;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .promo-success {
    margin-top: $size-10;
    padding: $size-10;
    background: #f0fdf4;
    border-radius: $size-6;
    font-size: $size-13;
    color: #16a34a;
  }
}

// Price Breakdown
.price-breakdown {
  background: $color-white;
  border-radius: $size-12;
  padding: $size-16;
  margin-bottom: $size-16;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .price-row {
    display: flex;
    justify-content: space-between;
    padding: $size-10 0;
    font-size: $size-14;
    border-bottom: 1px solid $color-g-95;

    &:last-child {
      border-bottom: none;
    }

    &.discount {
      span:last-child {
        color: #16a34a;
      }
    }

    &.total {
      padding-top: $size-14;
      margin-top: $size-8;
      border-top: 2px solid $color-g-92;
      border-bottom: none;
      font-size: $size-18;
      font-weight: 700;

      span:last-child {
        color: $color-pri;
      }
    }
  }
}

// Checkout Actions
.checkout-actions {
  text-align: center;

  button {
    width: 100%;
  }

  .terms-note {
    margin-top: $size-12;
    font-size: $size-12;
    color: $color-g-67;

    a {
      color: $color-pri;
      text-decoration: none;
    }
  }
}

// Loading Overlay
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .loading-content {
    text-align: center;

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid $color-g-85;
      border-top-color: $color-pri;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto $size-16;
    }

    p {
      font-size: $size-16;
      color: $color-g-44;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Order Error Alert
.order-error-alert {
  display: flex;
  align-items: flex-start;
  gap: $size-12;
  padding: $size-16;
  margin-bottom: $size-16;
  background: rgba($color-denote-red, 0.06);
  border: 1px solid rgba($color-denote-red, 0.2);
  border-radius: $size-12;

  .error-icon {
    flex-shrink: 0;
    width: $size-24;
    height: $size-24;

    svg {
      width: 100%;
      height: 100%;
      color: $color-denote-red;
    }
  }

  .error-content {
    flex: 1;
    min-width: 0;

    strong {
      display: block;
      font-size: $size-14;
      font-weight: 600;
      color: $color-denote-red;
      margin-bottom: $size-4;
    }

    p {
      font-size: $size-13;
      color: $color-g-44;
      margin: 0;
      line-height: 1.5;
      word-break: break-word;
    }
  }

  .error-dismiss {
    flex-shrink: 0;
    width: $size-24;
    height: $size-24;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: $size-16;
      height: $size-16;
      color: $color-g-67;
    }

    &:hover svg {
      color: $color-g-44;
    }
  }
}
</style>
