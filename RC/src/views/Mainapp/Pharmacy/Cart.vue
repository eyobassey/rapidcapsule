<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Shopping Cart"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="cart-page">
        <!-- Empty Cart State -->
        <div v-if="!loading && cart.length === 0" class="empty-cart">
          <div class="empty-cart-illustration">
            <div class="cart-icon-wrapper">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <div class="empty-badge">0</div>
            </div>
          </div>
          <h3>Your cart is empty</h3>
          <p>Discover medications, health products, and wellness essentials in our pharmacy</p>
          <div class="empty-cart-actions">
            <button class="browse-btn primary" @click="$router.push('/app/patient/pharmacy/otc')">
              <span class="btn-icon">💊</span>
              Shop OTC Products
            </button>
            <button class="browse-btn secondary" @click="$router.push('/app/patient/pharmacy')">
              Browse All Categories
            </button>
          </div>
          <div class="empty-cart-features">
            <div class="feature-item">
              <span class="feature-icon">🚚</span>
              <span>Fast Delivery</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <span>Licensed Pharmacy</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔒</span>
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>

        <!-- Cart Content -->
        <div v-else-if="!loading" class="cart-content">
          <!-- Free Delivery Progress Bar -->
          <div class="free-delivery-banner" :class="{ 'achieved': hasFreeDelivery }">
            <div class="delivery-banner-content">
              <div class="delivery-icon">
                <span v-if="hasFreeDelivery">🎉</span>
                <span v-else>🚚</span>
              </div>
              <div class="delivery-message">
                <span v-if="hasFreeDelivery" class="success-text">
                  You've earned FREE delivery!
                </span>
                <span v-else>
                  Add <strong>{{ formatPrice(amountToFreeDelivery) }}</strong> more for FREE delivery
                </span>
              </div>
            </div>
            <div class="delivery-progress-bar">
              <div class="progress-track">
                <div
                  class="progress-fill"
                  :style="{ width: freeDeliveryProgress + '%' }"
                ></div>
              </div>
              <div class="progress-labels">
                <span>₦0</span>
                <span>{{ formatPrice(freeDeliveryThreshold) }}</span>
              </div>
            </div>
          </div>

          <!-- Drug Interaction Alert -->
          <div v-if="drugInteractions.hasInteractions" class="drug-interaction-alert">
            <div class="interaction-header">
              <div class="header-icon">
                <span>⚠️</span>
              </div>
              <div class="header-content">
                <h4>Drug Interaction Warning</h4>
                <p>{{ drugInteractions.interactions.length }} potential interaction{{ drugInteractions.interactions.length > 1 ? 's' : '' }} detected in your cart</p>
              </div>
              <button class="expand-btn" @click="showInteractionDetails = !showInteractionDetails">
                {{ showInteractionDetails ? 'Hide' : 'Show' }} Details
                <span class="arrow" :class="{ 'rotated': showInteractionDetails }">▼</span>
              </button>
            </div>

            <Transition name="slide">
              <div v-if="showInteractionDetails" class="interaction-details">
                <div
                  v-for="(interaction, index) in drugInteractions.interactions"
                  :key="index"
                  :class="['interaction-item', `severity-${interaction.severity}`]"
                >
                  <div class="severity-badge" :class="interaction.severity">
                    <span v-if="interaction.severity === 'high'">⛔</span>
                    <span v-else-if="interaction.severity === 'moderate'">⚠️</span>
                    <span v-else>ℹ️</span>
                    {{ interaction.severity }}
                  </div>
                  <div class="interaction-info">
                    <div class="drug-pair">
                      <strong>{{ interaction.drug1 }}</strong>
                      <span class="separator">+</span>
                      <strong>{{ interaction.drug2 }}</strong>
                    </div>
                    <p class="description">{{ interaction.description }}</p>
                    <span class="source">Source: {{ interaction.source }}</span>
                  </div>
                </div>

                <div class="interaction-disclaimer">
                  <span class="disclaimer-icon">ℹ️</span>
                  <p>{{ drugInteractions.disclaimer }}</p>
                </div>
              </div>
            </Transition>
          </div>

          <!-- Checking Interactions Loading State -->
          <div v-if="checkingInteractions" class="interaction-loading">
            <div class="loading-spinner"></div>
            <span>Checking for drug interactions...</span>
          </div>

          <!-- Cart Items Section -->
          <div class="cart-section">
            <div class="section-header">
              <h3>Cart Items ({{ cartItemCount }})</h3>
            </div>

            <!-- Max Quantity Warning -->
            <div v-if="maxQtyMessage" class="max-qty-warning">
              ⚠️ {{ maxQtyMessage }}
            </div>

            <!-- OTC Items Section -->
            <div v-if="otcCartItems.length > 0" class="items-group otc-group">
              <div class="group-header">
                <span class="group-icon">💊</span>
                <span class="group-title">Over-the-Counter ({{ otcCartItems.length }})</span>
              </div>
              <div class="cart-items">
                <div
                  v-for="item in otcCartItems"
                  :key="item.drugId"
                  class="cart-item"
                >
                <!-- Product Image -->
                <div class="item-image">
                  <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" crossorigin="anonymous" />
                  <div v-else class="image-placeholder">💊</div>
                </div>

                <!-- Product Details -->
                <div class="item-info">
                  <h4 class="item-name">{{ item.name }}</h4>
                  <p class="item-meta">
                    <span v-if="item.strength">{{ item.strength }}</span>
                    <span v-if="item.dosageForm"> • {{ item.dosageForm }}</span>
                    <span v-if="item.route"> • {{ item.route }}</span>
                  </p>
                  <p v-if="item.manufacturer" class="item-manufacturer">{{ item.manufacturer }}</p>
                  <div class="stock-status-row">
                    <span :class="['stock-badge', getStockStatus(item).class]">
                      {{ getStockStatus(item).label }}
                    </span>
                    <span class="item-price-mobile">{{ formatPrice(item.price) }} each</span>
                  </div>
                </div>

                <!-- Quantity Controls -->
                <div class="item-quantity-wrapper">
                  <div class="item-quantity">
                    <button class="qty-btn" @click="decrementQuantity(item)" :disabled="item.quantity <= 1">−</button>
                    <span class="qty-value">{{ item.quantity }}</span>
                    <button class="qty-btn" @click="incrementQuantity(item)" :disabled="!canIncrement(item)">+</button>
                  </div>
                </div>

                <!-- Price -->
                <div class="item-price">
                  <span class="total-amount">{{ formatPrice(item.price * item.quantity) }}</span>
                  <span class="unit-price">{{ formatPrice(item.price) }} each</span>
                </div>

                <!-- Item Actions -->
                <div class="item-actions">
                  <button class="save-later-btn" @click="saveForLater(item)" title="Save for later">♡</button>
                  <button class="remove-btn" @click="removeItem(item)" title="Remove item">✕</button>
                </div>
                </div>
              </div>
            </div>

            <!-- Prescription Items Section -->
            <div v-if="rxCartItems.length > 0" class="items-group rx-group">
              <div class="group-header">
                <span class="group-icon rx-icon">Rx</span>
                <span class="group-title">Prescription Required ({{ rxCartItems.length }})</span>
                <span class="rx-notice">Valid prescription needed</span>
              </div>
              <div class="cart-items">
                <div
                  v-for="item in rxCartItems"
                  :key="item.drugId"
                  class="cart-item"
                >
                <!-- Product Image -->
                <div class="item-image">
                  <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" crossorigin="anonymous" />
                  <div v-else class="image-placeholder">💊</div>
                  <span v-if="item.requiresPrescription" class="rx-tag">Rx</span>
                  <!-- Coverage indicator for RX items -->
                  <span
                    v-if="item.requiresPrescription && selectedPrescription"
                    :class="['coverage-badge', isItemCovered(item) ? 'covered' : 'not-covered']"
                    :title="isItemCovered(item) ? 'Covered by prescription' : 'Not covered - needs prescription'"
                  >
                    {{ isItemCovered(item) ? '✓' : '!' }}
                  </span>
                </div>

                <!-- Product Details -->
                <div class="item-info">
                  <h4 class="item-name">{{ item.name }}</h4>
                  <p class="item-meta">
                    <span v-if="item.strength">{{ item.strength }}</span>
                    <span v-if="item.dosageForm"> • {{ item.dosageForm }}</span>
                    <span v-if="item.route"> • {{ item.route }}</span>
                  </p>
                  <p v-if="item.manufacturer" class="item-manufacturer">{{ item.manufacturer }}</p>
                  <!-- Stock Status Badge -->
                  <div class="stock-status-row">
                    <span
                      :class="['stock-badge', getStockStatus(item).class]"
                    >
                      {{ getStockStatus(item).label }}
                    </span>
                    <span class="item-price-mobile">{{ formatPrice(item.price) }} each</span>
                  </div>
                </div>

                <!-- Quantity Controls -->
                <div class="item-quantity-wrapper">
                  <div class="item-quantity">
                    <button
                      class="qty-btn"
                      @click="decrementQuantity(item)"
                      :disabled="item.quantity <= 1"
                    >-</button>
                    <span class="qty-value">{{ item.quantity }}</span>
                    <button
                      class="qty-btn"
                      @click="incrementQuantity(item)"
                      :disabled="!canIncrement(item)"
                    >+</button>
                  </div>
                  <span v-if="item.maxQuantityPerOrder" class="max-qty-hint">
                    Max: {{ item.maxQuantityPerOrder }}
                  </span>
                </div>

                <!-- Item Total -->
                <div class="item-total">
                  <span class="total-amount">{{ formatPrice(item.price * item.quantity) }}</span>
                  <span class="unit-price">{{ formatPrice(item.price) }} each</span>
                </div>

                <!-- Item Actions -->
                <div class="item-actions">
                  <button class="save-later-btn" @click="saveForLater(item)" title="Save for later">
                    ♡
                  </button>
                  <button class="remove-btn" @click="removeItem(item)" title="Remove item">
                    ✕
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>

          <!-- Saved for Later Section -->
          <div v-if="savedForLater.length > 0" class="cart-section saved-section">
            <div class="section-header">
              <h3>💝 Saved for Later ({{ savedForLater.length }})</h3>
            </div>
            <div class="saved-items">
              <div
                v-for="item in savedForLater"
                :key="'saved-' + item.drugId"
                class="saved-item"
              >
                <div class="saved-item-image">
                  <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" crossorigin="anonymous" />
                  <div v-else class="image-placeholder">💊</div>
                </div>
                <div class="saved-item-info">
                  <h4>{{ item.name }}</h4>
                  <p class="saved-meta">{{ item.strength }} {{ item.dosageForm }}</p>
                  <p class="saved-price">{{ formatPrice(item.price) }}</p>
                </div>
                <div class="saved-item-actions">
                  <button class="move-to-cart-btn" @click="moveToCart(item)">
                    Add to Cart
                  </button>
                  <button class="remove-saved-btn" @click="removeSavedItem(item.drugId)">
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Delivery Method Section -->
          <div class="cart-section delivery-section">
            <div class="section-header">
              <h3>📍 How would you like to receive your order?</h3>
            </div>

            <div class="delivery-toggle">
              <button
                :class="['toggle-btn', { active: deliveryMethod === 'delivery' }]"
                @click="setDeliveryMethodAction('delivery')"
              >
                <span class="toggle-icon">🏠</span>
                <span class="toggle-label">Home Delivery</span>
                <span class="toggle-desc">Delivered to your door</span>
              </button>
              <button
                :class="['toggle-btn', { active: deliveryMethod === 'pickup' }]"
                @click="setDeliveryMethodAction('pickup')"
              >
                <span class="toggle-icon">🏪</span>
                <span class="toggle-label">Pickup</span>
                <span class="toggle-desc">Collect from pharmacy</span>
              </button>
            </div>

            <!-- Home Delivery Address Selection -->
            <div v-if="deliveryMethod === 'delivery'" class="address-section">
              <div v-if="addressesLoading" class="loading-state">
                <div class="spinner"></div>
                <span>Loading addresses...</span>
              </div>

              <div v-else-if="selectedDeliveryAddress" class="selected-address">
                <div class="address-header">
                  <div class="address-label">
                    <span class="label-icon">📍</span>
                    <span>{{ selectedDeliveryAddress.label || 'Delivery Address' }}</span>
                    <span v-if="selectedDeliveryAddress.is_default" class="default-badge">Default</span>
                  </div>
                  <button class="change-btn" @click="showAddressModal = true">Change</button>
                </div>
                <div class="address-details">
                  <div class="recipient">{{ selectedDeliveryAddress.recipient_name }}</div>
                  <div class="address-text">{{ formatAddressDisplay(selectedDeliveryAddress) }}</div>
                  <div class="phone" v-if="selectedDeliveryAddress.phone">{{ selectedDeliveryAddress.phone }}</div>
                </div>
                <!-- Estimated Delivery -->
                <div class="estimated-delivery">
                  <span class="delivery-icon">📦</span>
                  <span class="delivery-text">
                    Estimated delivery: <strong>{{ estimatedDeliveryDate.range }}</strong>
                  </span>
                </div>
              </div>

              <div v-else class="no-address">
                <div class="no-address-icon">📍</div>
                <p>No delivery address selected</p>
                <button class="add-address-btn" @click="showAddAddressModal = true">
                  + Add Delivery Address
                </button>
              </div>
            </div>

            <!-- Pickup Location -->
            <div v-if="deliveryMethod === 'pickup'" class="pickup-section">
              <div v-if="pickupCentersLoading" class="loading-state">
                <div class="spinner"></div>
                <span>Loading pickup centers...</span>
              </div>

              <div v-else-if="selectedPickupCenter" class="selected-pickup">
                <div class="pharmacy-icon">🏪</div>
                <div class="pharmacy-details">
                  <strong>{{ selectedPickupCenter.name }}</strong>
                  <p>{{ formatPickupAddress(selectedPickupCenter) }}</p>
                  <p class="pickup-note">Present your pickup code at the counter</p>
                </div>
                <button v-if="pickupCenters.length > 1" class="change-btn" @click="showPickupModal = true">
                  Change
                </button>
              </div>

              <div v-else-if="pickupCenters.length === 0" class="no-pickup-centers">
                <div class="no-pickup-icon">🏪</div>
                <p>No pickup centers available at this time</p>
              </div>
            </div>
          </div>

          <!-- Prescription Section (only if cart has RX items) -->
          <div v-if="hasRxItems" class="cart-section prescription-section">
            <div class="section-header">
              <h3>📋 Prescription Required</h3>
            </div>

            <div v-if="!selectedPrescription" class="prescription-required">
              <div class="rx-warning">
                <span class="warning-icon">⚠️</span>
                <div class="warning-text">
                  <strong>Your cart contains prescription-only items</strong>
                  <p>Please upload or select a valid prescription to continue with checkout.</p>
                </div>
              </div>
              <div class="prescription-actions">
                <button class="select-rx-btn" @click="showPrescriptionModal = true">
                  Select Existing Prescription
                </button>
                <button class="upload-rx-btn" @click="$router.push('/app/patient/pharmacy/upload-prescription?returnTo=/app/patient/pharmacy/cart')">
                  Upload New Prescription
                </button>
              </div>
            </div>

            <div v-else class="prescription-selected">
              <div class="rx-success">
                <span class="success-icon">✅</span>
                <div class="rx-info">
                  <strong>Prescription Selected</strong>
                  <p v-if="selectedPrescription.ocr_data?.doctor_name">
                    Dr. {{ selectedPrescription.ocr_data.doctor_name }}
                  </p>
                  <p class="rx-date">{{ formatDate(selectedPrescription.created_at) }}</p>
                </div>
                <button class="change-rx-btn" @click="showPrescriptionModal = true">Change</button>
              </div>

              <!-- Coverage Status -->
              <div class="coverage-status" v-if="rxCartItems.length > 0">
                <!-- All Covered -->
                <div v-if="prescriptionCoverage.allCovered" class="coverage-good">
                  <span class="status-icon">✓</span>
                  <span>All {{ prescriptionCoverage.covered.length }} RX item(s) covered</span>
                </div>

                <!-- Partial Coverage -->
                <div v-else-if="prescriptionCoverage.uncovered.length > 0" class="coverage-warning">
                  <div class="coverage-header">
                    <span class="status-icon">⚠️</span>
                    <span>{{ prescriptionCoverage.uncovered.length }} item(s) not covered</span>
                  </div>
                  <div class="uncovered-list">
                    <span v-for="item in prescriptionCoverage.uncovered" :key="item.drugId" class="uncovered-item">
                      {{ item.name }}
                    </span>
                  </div>
                  <div class="coverage-actions">
                    <button class="upload-more-btn" @click="$router.push('/app/patient/pharmacy/upload-prescription?returnTo=/app/patient/pharmacy/cart')">
                      Upload Another Prescription
                    </button>
                  </div>
                </div>
              </div>

              <!-- Pharmacist Verification Notice -->
              <div class="pharmacist-verification-notice">
                <span class="notice-icon">👨‍⚕️</span>
                <div class="notice-content">
                  <strong>Pharmacist Verification</strong>
                  <p>Your prescription may be subject to verification by our licensed pharmacist before processing. You or your prescriber may be contacted if clarification is needed.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Summary Section -->
          <div class="summary-section">
            <!-- Promo Code Section -->
            <div class="promo-code-card">
              <div class="promo-header">
                <span class="promo-icon">🏷️</span>
                <span>Have a promo code?</span>
              </div>

              <!-- Applied Promo -->
              <div v-if="promoCodeApplied" class="promo-applied">
                <div class="applied-info">
                  <span class="applied-code">{{ promoCodeApplied.code }}</span>
                  <span class="applied-desc">{{ promoCodeApplied.description }}</span>
                </div>
                <button class="remove-promo-btn" @click="removePromoCode">✕</button>
              </div>

              <!-- Promo Input -->
              <div v-else class="promo-input-wrapper">
                <input
                  type="text"
                  v-model="promoCode"
                  placeholder="Enter promo code"
                  class="promo-input"
                  @keyup.enter="applyPromoCode"
                  :disabled="applyingPromo"
                />
                <button
                  class="apply-promo-btn"
                  @click="applyPromoCode"
                  :disabled="applyingPromo || !promoCode.trim()"
                >
                  {{ applyingPromo ? '...' : 'Apply' }}
                </button>
              </div>

              <!-- Error Message -->
              <div v-if="promoError" class="promo-error">
                {{ promoError }}
              </div>
            </div>

            <!-- Price Summary -->
            <div class="price-summary">
              <div class="summary-row">
                <span>Subtotal ({{ cartItemCount }} items)</span>
                <span>{{ formatPrice(cartTotal) }}</span>
              </div>
              <div class="summary-row" v-if="promoCodeApplied && promoDiscount > 0">
                <span class="promo-label">
                  Promo ({{ promoCodeApplied.code }})
                </span>
                <span class="discount">-{{ formatPrice(promoDiscount) }}</span>
              </div>
              <div class="summary-row" v-if="deliveryMethod === 'delivery'">
                <span>Delivery Fee</span>
                <span v-if="hasFreeDelivery" class="free-delivery-text">
                  <span class="original-fee">{{ formatPrice(deliveryFee) }}</span>
                  FREE
                </span>
                <span v-else>{{ formatPrice(deliveryFee) }}</span>
              </div>
              <!-- Show wallet deduction if wallet or split payment -->
              <div class="summary-row" v-if="(paymentMethod === 'wallet' || paymentMethod === 'split') && walletPaymentAmount > 0">
                <span>Wallet Payment</span>
                <span class="discount">-{{ formatPrice(walletPaymentAmount) }}</span>
              </div>
              <!-- Show final amount to pay -->
              <div class="summary-row total">
                <span>{{ (paymentMethod === 'wallet' || paymentMethod === 'split') ? 'To Pay' : 'Total' }}</span>
                <span>{{ formatPrice((paymentMethod === 'wallet' || paymentMethod === 'split') ? amountToPay : totalAmount) }}</span>
              </div>
            </div>

            <!-- Payment Method Selection -->
            <div class="payment-method-section" v-if="cart.length > 0">
              <h4 class="section-title">Payment Method</h4>
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
                      <span v-if="walletBalance < totalAmount" class="insufficient">Insufficient for full payment</span>
                    </div>
                  </div>
                </div>

                <!-- Split Payment (if wallet has some balance but not enough) -->
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

            <!-- Checkout Blockers -->
            <div v-if="checkoutBlockers.length > 0" class="checkout-blockers">
              <div v-for="(blocker, idx) in checkoutBlockers" :key="idx" class="blocker-item">
                <span class="blocker-icon">⚠️</span>
                <span>{{ blocker }}</span>
              </div>
            </div>

            <!-- Order Error Alert -->
            <div v-if="orderError" ref="orderErrorRef" class="order-error-alert">
              <div class="error-header">
                <div class="error-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div class="error-title">{{ orderError.title }}</div>
                <button class="error-dismiss" @click="orderError = null">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div class="error-body">
                <p class="error-message">{{ orderError.message }}</p>
                <div v-if="orderError.affectedItems && orderError.affectedItems.length > 0" class="affected-items">
                  <span class="affected-label">Affected medications:</span>
                  <div class="affected-chips">
                    <span v-for="item in orderError.affectedItems" :key="item" class="affected-chip">{{ item }}</span>
                  </div>
                </div>
                <p class="error-suggestion">{{ orderError.suggestion }}</p>
              </div>
              <div class="error-actions">
                <button class="error-action-btn secondary" @click="orderError = null">
                  Dismiss
                </button>
                <button v-if="orderError.type === 'purchase_limit'" class="error-action-btn primary" @click="$router.push('/app/patient/support')">
                  Contact Support
                </button>
              </div>
            </div>

            <!-- Pay Now Button -->
            <div class="checkout-actions">
              <rc-button
                type="primary"
                :label="payNowButtonLabel"
                @click="placeOrder"
                :disabled="!canProceedToCheckout || placingOrder"
              />
              <rc-button
                type="secondary"
                label="Continue Shopping"
                @click="$router.push('/app/patient/pharmacy/otc')"
              />
            </div>

            <!-- Processing Overlay -->
            <div v-if="placingOrder" class="processing-overlay">
              <div class="processing-content">
                <div class="spinner"></div>
                <p>Processing your order...</p>
              </div>
            </div>

            <!-- Trust Badges -->
            <div class="trust-badges">
              <div class="trust-badge">
                <div class="badge-icon">🔒</div>
                <div class="badge-text">
                  <strong>Secure Checkout</strong>
                  <span>256-bit SSL encryption</span>
                </div>
              </div>
              <div class="trust-badge">
                <div class="badge-icon">✓</div>
                <div class="badge-text">
                  <strong>Licensed Pharmacy</strong>
                  <span>PCN Certified</span>
                </div>
              </div>
              <div class="trust-badge">
                <div class="badge-icon">↩️</div>
                <div class="badge-text">
                  <strong>Easy Returns</strong>
                  <span>7-day return policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loader -->
        <div class="loader-container" v-if="loading">
          <Loader :useOverlay="false" :rounded="true" />
        </div>

        <!-- Sticky Mobile Checkout Bar -->
        <div v-if="!loading && cart.length > 0" class="mobile-checkout-bar">
          <div class="mobile-checkout-content">
            <div class="mobile-total">
              <span class="mobile-total-label">Total</span>
              <span class="mobile-total-amount">{{ formatPrice(totalAmount) }}</span>
            </div>
            <button
              class="mobile-checkout-btn"
              :disabled="!canProceedToCheckout || placingOrder"
              @click="placeOrder"
            >
              {{ placingOrder ? 'Processing...' : 'Pay Now' }}
            </button>
          </div>
        </div>

        <!-- Undo Remove Toast -->
        <Transition name="toast">
          <div v-if="showUndoToast" class="undo-toast">
            <div class="toast-content">
              <span class="toast-icon">🗑️</span>
              <span class="toast-message">
                <strong>{{ removedItem?.name }}</strong> removed
              </span>
            </div>
            <div class="toast-actions">
              <button class="undo-btn" @click="undoRemove">Undo</button>
              <button class="dismiss-btn" @click="dismissUndoToast">✕</button>
            </div>
          </div>
        </Transition>

        <!-- Address Selection Modal -->
        <div v-if="showAddressModal" class="modal-overlay" @click="showAddressModal = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>Select Delivery Address</h3>
              <button class="close-btn" @click="showAddressModal = false">✕</button>
            </div>
            <div class="modal-body">
              <div v-if="savedAddresses.length === 0" class="no-addresses-modal">
                <p>No saved addresses</p>
                <button class="add-new-btn" @click="showAddressModal = false; showAddAddressModal = true">
                  + Add New Address
                </button>
              </div>
              <div v-else class="addresses-list">
                <div
                  v-for="address in savedAddresses"
                  :key="address._id"
                  :class="['address-option', { selected: selectedDeliveryAddress?._id === address._id }]"
                  @click="selectAddress(address)"
                >
                  <div class="radio-circle" :class="{ checked: selectedDeliveryAddress?._id === address._id }"></div>
                  <div class="address-info">
                    <div class="label-row">
                      <strong>{{ address.label || 'Address' }}</strong>
                      <span v-if="address.is_default" class="default-tag">Default</span>
                      <span v-if="address.is_profile_address" class="profile-tag">Profile</span>
                    </div>
                    <div class="recipient">{{ address.recipient_name }}</div>
                    <div class="address-text">{{ formatAddressDisplay(address) }}</div>
                  </div>
                </div>
                <button class="add-new-btn" @click="showAddressModal = false; showAddAddressModal = true">
                  + Add New Address
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Add New Address Modal -->
        <div v-if="showAddAddressModal" class="modal-overlay" @click="showAddAddressModal = false">
          <div class="modal-content add-address-modal" @click.stop>
            <div class="modal-header">
              <h3>Add Delivery Address</h3>
              <button class="close-btn" @click="showAddAddressModal = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Address Label *</label>
                <input type="text" v-model="newAddressForm.label" placeholder="e.g., Home, Office" />
              </div>
              <div class="form-group">
                <label>Recipient Name *</label>
                <input type="text" v-model="newAddressForm.recipient_name" placeholder="Full name" />
              </div>
              <div class="form-group">
                <label>Phone Number *</label>
                <input type="tel" v-model="newAddressForm.phone" placeholder="Phone number" />
              </div>
              <div class="form-group">
                <label>Street Address *</label>
                <textarea v-model="newAddressForm.street" placeholder="House number, Street name" rows="2"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group half">
                  <label>City *</label>
                  <input type="text" v-model="newAddressForm.city" placeholder="City" />
                </div>
                <div class="form-group half">
                  <label>State *</label>
                  <input type="text" v-model="newAddressForm.state" placeholder="State" />
                </div>
              </div>
              <div class="form-group">
                <label>Additional Info</label>
                <textarea v-model="newAddressForm.additional_info" placeholder="Landmarks, directions, etc." rows="2"></textarea>
              </div>
              <label class="checkbox-label">
                <input type="checkbox" v-model="newAddressForm.is_default" />
                <span>Set as default address</span>
              </label>
            </div>
            <div class="modal-footer">
              <button class="cancel-btn" @click="showAddAddressModal = false">Cancel</button>
              <button class="save-btn" @click="saveNewAddress" :disabled="savingAddress">
                {{ savingAddress ? 'Saving...' : 'Save Address' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Prescription Selection Modal -->
        <div v-if="showPrescriptionModal" class="modal-overlay" @click="showPrescriptionModal = false">
          <div class="modal-content prescription-modal" @click.stop>
            <div class="modal-header">
              <h3>Select Prescription</h3>
              <button class="close-btn" @click="showPrescriptionModal = false">✕</button>
            </div>

            <!-- Prescription Type Tabs -->
            <div class="prescription-tabs">
              <button
                :class="['tab-btn', { active: prescriptionTabType === 'uploaded' }]"
                @click="prescriptionTabType = 'uploaded'"
              >
                📄 Uploaded
              </button>
              <button
                :class="['tab-btn', { active: prescriptionTabType === 'specialist' }]"
                @click="prescriptionTabType = 'specialist'"
              >
                👨‍⚕️ From Specialist
              </button>
            </div>

            <div class="modal-body">
              <div v-if="prescriptionsLoading" class="loading-state">
                <div class="spinner"></div>
                <span>Loading prescriptions...</span>
              </div>

              <!-- Uploaded Prescriptions Tab -->
              <template v-else-if="prescriptionTabType === 'uploaded'">
                <div v-if="approvedPrescriptions.length === 0" class="no-prescriptions">
                  <p>No approved prescriptions found</p>
                  <button class="upload-btn" @click="$router.push('/app/patient/pharmacy/upload-prescription?returnTo=/app/patient/pharmacy/cart')">
                    Upload Prescription
                  </button>
                </div>
                <div v-else class="prescriptions-list">
                  <!-- Upload new prescription button at top of list -->
                  <div class="upload-new-section">
                    <button class="upload-new-btn" @click="$router.push('/app/patient/pharmacy/upload-prescription?returnTo=/app/patient/pharmacy/cart')">
                      + Upload New Prescription
                    </button>
                  </div>
                  <div
                    v-for="prescription in approvedPrescriptions"
                    :key="prescription._id"
                    :class="['prescription-option', { selected: selectedPrescription?._id === prescription._id }]"
                    @click="selectPrescriptionOption(prescription, 'uploaded')"
                  >
                    <div class="radio-circle" :class="{ checked: selectedPrescription?._id === prescription._id }"></div>
                    <div class="prescription-info">
                      <strong v-if="prescription.ocr_data?.doctor_name">Dr. {{ prescription.ocr_data.doctor_name }}</strong>
                      <span v-if="prescription.ocr_data?.clinic_name">{{ prescription.ocr_data.clinic_name }}</span>
                      <span class="date">{{ formatDate(prescription.created_at) }}</span>
                      <span class="meds-count" v-if="prescription.ocr_data?.medications?.length">
                        {{ prescription.ocr_data.medications.length }} medication(s)
                      </span>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Specialist Prescriptions Tab -->
              <template v-else-if="prescriptionTabType === 'specialist'">
                <div v-if="specialistPrescriptions.length === 0" class="no-prescriptions">
                  <p>No specialist prescriptions found</p>
                  <p class="hint-text">Prescriptions created by your doctor will appear here</p>
                </div>
                <div v-else class="prescriptions-list">
                  <p class="multi-select-hint">Select one or more prescriptions to cover your RX items</p>
                  <div
                    v-for="prescription in specialistPrescriptions"
                    :key="prescription._id"
                    :class="[
                      'prescription-option',
                      { selected: isSpecialistPrescriptionSelected(prescription) },
                      { 'has-coverage': getSpecialistPrescriptionCoverage(prescription).allCovered },
                      { 'partial-coverage': getSpecialistPrescriptionCoverage(prescription).covered.length > 0 && !getSpecialistPrescriptionCoverage(prescription).allCovered }
                    ]"
                    @click="toggleSpecialistPrescription(prescription)"
                  >
                    <div class="checkbox-square" :class="{ checked: isSpecialistPrescriptionSelected(prescription) }">
                      <span v-if="isSpecialistPrescriptionSelected(prescription)">✓</span>
                    </div>
                    <div class="prescription-info">
                      <strong v-if="prescription.specialist?.full_name">{{ prescription.specialist.full_name }}</strong>
                      <span class="prescription-number">{{ prescription.prescription_number }}</span>
                      <span class="date">{{ formatDate(prescription.created_at) }}</span>
                      <span class="meds-count" v-if="prescription.items?.length">
                        {{ prescription.items.length }} medication(s)
                      </span>
                      <!-- Coverage indicator -->
                      <div class="coverage-indicator">
                        <span v-if="getSpecialistPrescriptionCoverage(prescription).allCovered" class="coverage-badge full">
                          ✓ Covers all RX items
                        </span>
                        <span v-else-if="getSpecialistPrescriptionCoverage(prescription).covered.length > 0" class="coverage-badge partial">
                          Covers {{ getSpecialistPrescriptionCoverage(prescription).covered.length }} of {{ rxCartItems.length }} RX items
                        </span>
                        <span v-else class="coverage-badge none">
                          Does not cover cart items
                        </span>
                      </div>
                      <!-- Show prescribed drugs -->
                      <div class="prescribed-drugs" v-if="prescription.items?.length">
                        <span v-for="item in prescription.items.slice(0, 3)" :key="item.drug_id" class="drug-chip">
                          {{ item.drug_name }}
                        </span>
                        <span v-if="prescription.items.length > 3" class="more-drugs">
                          +{{ prescription.items.length - 3 }} more
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>

            <div class="modal-footer" v-if="(prescriptionTabType === 'uploaded' && approvedPrescriptions.length > 0) || (prescriptionTabType === 'specialist' && specialistPrescriptions.length > 0)">
              <button class="cancel-btn" @click="showPrescriptionModal = false" :disabled="confirmingPrescription">Cancel</button>
              <button
                class="confirm-btn"
                @click="confirmPrescription"
                :disabled="(prescriptionTabType === 'uploaded' && !selectedPrescription) || (prescriptionTabType === 'specialist' && selectedSpecialistPrescriptions.length === 0) || confirmingPrescription"
              >
                <template v-if="confirmingPrescription">
                  Verifying...
                </template>
                <template v-else-if="prescriptionTabType === 'specialist' && selectedSpecialistPrescriptions.length > 0">
                  Verify {{ selectedSpecialistPrescriptions.length }} Prescription{{ selectedSpecialistPrescriptions.length > 1 ? 's' : '' }}
                </template>
                <template v-else>
                  Confirm Selection
                </template>
              </button>
            </div>
          </div>
        </div>

        <!-- Pickup Center Selection Modal -->
        <div v-if="showPickupModal" class="modal-overlay" @click="showPickupModal = false">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>Select Pickup Location</h3>
              <button class="close-btn" @click="showPickupModal = false">✕</button>
            </div>
            <div class="modal-body">
              <div v-if="pickupCentersLoading" class="loading-state">
                <div class="spinner"></div>
                <span>Loading pickup centers...</span>
              </div>
              <div v-else-if="pickupCenters.length === 0" class="no-pickup-centers-modal">
                <p>No pickup centers available at this time</p>
              </div>
              <div v-else class="pickup-centers-list">
                <div
                  v-for="center in pickupCenters"
                  :key="center._id"
                  :class="['pickup-option', { selected: selectedPickupCenter?._id === center._id }]"
                  @click="selectPickupCenter(center)"
                >
                  <div class="radio-circle" :class="{ checked: selectedPickupCenter?._id === center._id }"></div>
                  <div class="pickup-info">
                    <strong>{{ center.name }}</strong>
                    <span class="pickup-address">{{ formatPickupAddress(center) }}</span>
                    <span v-if="center.pickup_center_details?.operating_hours" class="pickup-hours">
                      {{ center.pickup_center_details.operating_hours }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";
import $api from "@/services/apiFactory";

export default {
  name: "PharmacyCart",
  components: {
    TopBar,
    RcButton,
    Loader,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const route = useRoute();
    const useWalletBalance = ref(false);
    const maxQtyMessage = ref("");
    const deliveryFee = ref(1500);

    // Modal states
    const showAddressModal = ref(false);
    const showAddAddressModal = ref(false);
    const showPrescriptionModal = ref(false);
    const savingAddress = ref(false);
    const prescriptionTabType = ref('uploaded'); // 'uploaded' or 'specialist'
    const selectedPrescriptionType = ref(null); // Track if selected prescription is 'uploaded' or 'specialist'
    const selectedSpecialistPrescriptions = ref([]); // Array of selected specialist prescriptions for multi-select

    // Promo code state
    const promoCode = ref('');
    const promoCodeApplied = ref(null); // null = not applied, object = applied promo
    const applyingPromo = ref(false);
    const promoError = ref('');

    // Save for later state
    const savedForLater = ref([]);

    // Undo remove state
    const removedItem = ref(null);
    const showUndoToast = ref(false);
    let undoTimeout = null;

    // Pickup center state
    const pickupCenters = ref([]);
    const pickupCentersLoading = ref(false);
    const selectedPickupCenter = ref(null);
    const showPickupModal = ref(false);

    // Drug interaction state
    const drugInteractions = ref({
      hasInteractions: false,
      interactions: [],
      disclaimer: '',
      checkedAt: null,
      sourcesUsed: [],
    });
    const checkingInteractions = ref(false);
    const showInteractionDetails = ref(false);
    const interactionSettings = ref({
      enabled_for_patients: true,
      data_sources: ['claude_ai', 'openfda'],
    });

    // Payment state
    const paymentMethod = ref('card'); // 'card', 'wallet', 'split'
    const placingOrder = ref(false);
    const orderError = ref(null);
    const orderErrorRef = ref(null);

    // Contact info for order (pre-filled from user profile)
    const contactInfo = ref({
      name: "",
      phone: "",
      email: "",
    });

    // New address form
    const newAddressForm = ref({
      label: "",
      recipient_name: "",
      phone: "",
      street: "",
      city: "",
      state: "",
      additional_info: "",
      is_default: false,
    });

    const {
      "pharmacy/updateCartItem": updateCartItem,
      "pharmacy/removeFromCart": removeFromCart,
      "pharmacy/initializeCheckout": initializeCheckout,
      "pharmacy/setDeliveryMethod": setDeliveryMethodAction,
      "pharmacy/setSelectedDeliveryAddress": setSelectedDeliveryAddressAction,
      "pharmacy/addDeliveryAddress": addDeliveryAddressAction,
      "pharmacy/setSelectedPrescription": setSelectedPrescriptionAction,
      "pharmacy/fetchApprovedPrescriptions": fetchApprovedPrescriptionsAction,
      "pharmacy/fetchSpecialistPrescriptionsForPharmacy": fetchSpecialistPrescriptionsAction,
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
      "pharmacy/getLoading": isLoading,
      "pharmacy/getWalletBalance": walletBalance,
      "pharmacy/getDeliveryMethod": deliveryMethod,
      "pharmacy/getSelectedDeliveryAddress": selectedDeliveryAddress,
      "pharmacy/getSavedAddresses": savedAddresses,
      "pharmacy/getAddressesLoading": addressesLoading,
      "pharmacy/getDefaultPharmacy": defaultPharmacy,
      "pharmacy/getSelectedPrescription": selectedPrescription,
      "pharmacy/getApprovedPrescriptions": approvedPrescriptions,
      "pharmacy/getSpecialistPrescriptions": specialistPrescriptions,
      "pharmacy/getPrescriptionsLoading": prescriptionsLoading,
      "pharmacy/getCartHasRxItems": hasRxItems,
      "pharmacy/getSelectedPharmacy": selectedPharmacy,
      "userprofile": userProfile,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);

    // Estimated delivery date (2-4 business days from now)
    const estimatedDeliveryDate = computed(() => {
      const today = new Date();
      const minDays = 2;
      const maxDays = 4;

      // Add business days (skip weekends)
      const addBusinessDays = (date, days) => {
        const result = new Date(date);
        let added = 0;
        while (added < days) {
          result.setDate(result.getDate() + 1);
          const dayOfWeek = result.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            added++;
          }
        }
        return result;
      };

      const minDate = addBusinessDays(today, minDays);
      const maxDate = addBusinessDays(today, maxDays);

      const formatDeliveryDate = (date) => {
        return date.toLocaleDateString('en-NG', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        });
      };

      return {
        min: formatDeliveryDate(minDate),
        max: formatDeliveryDate(maxDate),
        range: `${formatDeliveryDate(minDate)} - ${formatDeliveryDate(maxDate)}`
      };
    });

    // Free delivery threshold
    const freeDeliveryThreshold = 10000; // ₦10,000 for free delivery
    const amountToFreeDelivery = computed(() => {
      const remaining = freeDeliveryThreshold - cartTotal.value;
      return remaining > 0 ? remaining : 0;
    });
    const freeDeliveryProgress = computed(() => {
      const progress = (cartTotal.value / freeDeliveryThreshold) * 100;
      return Math.min(progress, 100);
    });
    const hasFreeDelivery = computed(() => cartTotal.value >= freeDeliveryThreshold);

    // Actual delivery fee (0 if free delivery earned)
    const actualDeliveryFee = computed(() => {
      if (hasFreeDelivery.value) return 0;
      return deliveryFee.value;
    });

    // Calculate promo discount amount
    const promoDiscount = computed(() => {
      if (!promoCodeApplied.value) return 0;

      const promo = promoCodeApplied.value;
      if (promo.discount_type === 'percentage') {
        return Math.round(cartTotal.value * (promo.discount_value / 100));
      } else if (promo.discount_type === 'fixed') {
        return Math.min(promo.discount_value, cartTotal.value); // Can't discount more than cart total
      }
      return 0;
    });

    // Calculate total before wallet deduction (for wallet deduction cap)
    const totalBeforeWallet = computed(() => {
      let total = cartTotal.value;
      // Subtract promo discount
      total -= promoDiscount.value;
      // Add delivery fee
      if (deliveryMethod.value === "delivery") {
        total += actualDeliveryFee.value;
      }
      return Math.max(0, total);
    });

    // Total amount (before wallet deduction)
    const totalAmount = computed(() => {
      return totalBeforeWallet.value;
    });

    // Calculate wallet payment amount based on payment method
    const walletPaymentAmount = computed(() => {
      if (paymentMethod.value === "wallet") {
        return Math.min(walletBalance.value, totalAmount.value);
      }
      if (paymentMethod.value === "split") {
        return Math.min(walletBalance.value, totalAmount.value);
      }
      return 0;
    });

    // Calculate amount to pay via card (after wallet deduction)
    const amountToPay = computed(() => {
      return Math.max(0, totalAmount.value - walletPaymentAmount.value);
    });

    // Keep walletDeduction for backwards compatibility (used in return)
    const walletDeduction = computed(() => walletPaymentAmount.value);

    // Get RX items from cart
    const rxCartItems = computed(() => cart.value.filter(item => item.requiresPrescription));

    // Get OTC (non-prescription) items from cart
    const otcCartItems = computed(() => cart.value.filter(item => !item.requiresPrescription));

    // Calculate prescription coverage for RX cart items
    // Supports both single uploaded prescription and multiple specialist prescriptions
    const prescriptionCoverage = computed(() => {
      if (!rxCartItems.value.length) {
        return { covered: [], uncovered: [], allCovered: true };
      }

      let validDrugIds = [];

      // Check for multiple specialist prescriptions first
      if (selectedSpecialistPrescriptions.value.length > 0) {
        // Combine drug IDs from all selected specialist prescriptions
        for (const prescription of selectedSpecialistPrescriptions.value) {
          const prescribedDrugIds = (prescription.items || [])
            .filter(item => item.drug_id)
            .map(item => item.drug_id?.toString() || item.drug_id);
          validDrugIds.push(...prescribedDrugIds);
        }
      } else if (selectedPrescription.value) {
        // Fall back to single prescription selection (uploaded or single specialist)
        const isSpecialistPrescription = selectedPrescription.value.items?.length > 0 &&
          selectedPrescription.value.items[0]?.drug_id;

        if (isSpecialistPrescription) {
          // For specialist prescriptions, use items[].drug_id
          validDrugIds = (selectedPrescription.value.items || [])
            .filter(item => item.drug_id)
            .map(item => item.drug_id?.toString() || item.drug_id);
        } else {
          // For uploaded prescriptions, use verified_medications[].matched_drug_id
          const verifiedMeds = selectedPrescription.value.verified_medications || [];
          validDrugIds = verifiedMeds
            .filter(m => m.is_valid && m.matched_drug_id)
            .map(m => m.matched_drug_id?.toString() || m.matched_drug_id);
        }
      } else {
        // No prescription selected
        return { covered: [], uncovered: rxCartItems.value, allCovered: false };
      }

      // Remove duplicates
      validDrugIds = [...new Set(validDrugIds)];

      const covered = [];
      const uncovered = [];

      for (const item of rxCartItems.value) {
        const drugId = item.drugId?.toString() || item.drugId;
        if (validDrugIds.includes(drugId)) {
          covered.push(item);
        } else {
          uncovered.push(item);
        }
      }

      return {
        covered,
        uncovered,
        allCovered: uncovered.length === 0 && covered.length > 0,
      };
    });

    // Get coverage status for a specialist prescription
    const getSpecialistPrescriptionCoverage = (prescription) => {
      if (!prescription?.items?.length || !rxCartItems.value.length) {
        return { covered: [], uncovered: rxCartItems.value, allCovered: false };
      }

      const prescribedDrugIds = (prescription.items || [])
        .filter(item => item.drug_id)
        .map(item => item.drug_id?.toString() || item.drug_id);

      const covered = [];
      const uncovered = [];

      for (const item of rxCartItems.value) {
        const drugId = item.drugId?.toString() || item.drugId;
        if (prescribedDrugIds.includes(drugId)) {
          covered.push(item);
        } else {
          uncovered.push(item);
        }
      }

      return {
        covered,
        uncovered,
        allCovered: uncovered.length === 0 && covered.length > 0,
      };
    };

    // Check if a specific item is covered by the prescription
    const isItemCovered = (item) => {
      if (!item.requiresPrescription) return null; // OTC items don't need coverage
      if (!selectedPrescription.value) return false;

      const drugId = item.drugId?.toString() || item.drugId;
      return prescriptionCoverage.value.covered.some(
        c => (c.drugId?.toString() || c.drugId) === drugId
      );
    };

    // Check if can proceed to checkout
    const canProceedToCheckout = computed(() => {
      if (cart.value.length === 0) return false;
      if (deliveryMethod.value === "delivery" && !selectedDeliveryAddress.value) return false;
      // If cart has RX items, ALL RX items must be covered by prescription(s)
      if (hasRxItems.value) {
        // Must have a prescription selected AND all RX items must be covered
        if (!selectedPrescription.value) return false;
        if (!prescriptionCoverage.value.allCovered) return false;
      }
      return true;
    });

    // Checkout blockers messages
    const checkoutBlockers = computed(() => {
      const blockers = [];
      if (cart.value.length === 0) {
        blockers.push("Your cart is empty");
      }
      if (deliveryMethod.value === "delivery" && !selectedDeliveryAddress.value) {
        blockers.push("Please select a delivery address");
      }
      if (hasRxItems.value) {
        if (!selectedPrescription.value) {
          blockers.push("Please upload or select a prescription for Rx items");
        } else if (!prescriptionCoverage.value.allCovered) {
          const uncoveredCount = prescriptionCoverage.value.uncovered.length;
          const uncoveredNames = prescriptionCoverage.value.uncovered.map(i => i.name).join(', ');
          blockers.push(`${uncoveredCount} Rx item(s) not covered by prescription: ${uncoveredNames}`);
        }
      }
      return blockers;
    });

    // Checkout button label
    const checkoutButtonLabel = computed(() => {
      if (!canProceedToCheckout.value) {
        if (hasRxItems.value && !selectedPrescription.value) {
          return "Prescription Required";
        }
        if (hasRxItems.value && !prescriptionCoverage.value.allCovered) {
          return "Items Not Covered";
        }
        if (deliveryMethod.value === "delivery" && !selectedDeliveryAddress.value) {
          return "Select Address to Continue";
        }
      }
      return "Proceed to Checkout";
    });

    const formatPrice = (price) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(price || 0);
    };

    // Pay Now button label (must be after formatPrice definition)
    const payNowButtonLabel = computed(() => {
      if (placingOrder.value) return "Processing...";
      if (!canProceedToCheckout.value) {
        if (hasRxItems.value && !selectedPrescription.value) {
          return "Prescription Required";
        }
        if (hasRxItems.value && !prescriptionCoverage.value.allCovered) {
          return "Items Not Covered";
        }
        if (deliveryMethod.value === "delivery" && !selectedDeliveryAddress.value) {
          return "Select Address";
        }
        return "Complete Required Fields";
      }
      if (paymentMethod.value === "wallet" && amountToPay.value === 0) {
        return "Pay Now (Wallet)";
      }
      return `Pay ${formatPrice(amountToPay.value)}`;
    });

    const formatDate = (dateString) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
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

    // Get stock status for an item
    const getStockStatus = (item) => {
      const stockQty = item.stockQuantity || item.stock_quantity || item.availableQuantity || 100;

      if (stockQty <= 0) {
        return { label: 'Out of Stock', class: 'out-of-stock' };
      } else if (stockQty < 10) {
        return { label: 'Low Stock', class: 'low-stock' };
      } else {
        return { label: 'In Stock', class: 'in-stock' };
      }
    };

    const incrementQuantity = (item) => {
      const maxQty = item.maxQuantityPerOrder || 99;
      if (item.quantity < maxQty) {
        updateCartItem({ drugId: item.drugId, quantity: item.quantity + 1 });
        maxQtyMessage.value = "";
      } else {
        maxQtyMessage.value = `Maximum quantity of ${maxQty} reached for ${item.name}`;
        setTimeout(() => { maxQtyMessage.value = ""; }, 3000);
      }
    };

    const canIncrement = (item) => {
      const maxQty = item.maxQuantityPerOrder || 99;
      return item.quantity < maxQty;
    };

    const decrementQuantity = (item) => {
      if (item.quantity > 1) {
        updateCartItem({ drugId: item.drugId, quantity: item.quantity - 1 });
      }
    };

    const removeItem = (item) => {
      // Store the removed item for undo
      removedItem.value = { ...item };
      showUndoToast.value = true;

      // Remove from cart
      removeFromCart(item.drugId);

      // Clear any existing timeout
      if (undoTimeout) clearTimeout(undoTimeout);

      // Auto-hide toast after 5 seconds
      undoTimeout = setTimeout(() => {
        showUndoToast.value = false;
        removedItem.value = null;
      }, 5000);
    };

    const undoRemove = () => {
      if (removedItem.value) {
        // Add item back to cart
        updateCartItem({
          drugId: removedItem.value.drugId,
          quantity: removedItem.value.quantity,
          ...removedItem.value
        });
        // Clear undo state
        removedItem.value = null;
        showUndoToast.value = false;
        if (undoTimeout) clearTimeout(undoTimeout);
      }
    };

    const dismissUndoToast = () => {
      showUndoToast.value = false;
      removedItem.value = null;
      if (undoTimeout) clearTimeout(undoTimeout);
    };

    // Save for later functions
    const saveForLater = (item) => {
      // Add to saved items
      savedForLater.value.push({ ...item });
      // Remove from cart
      removeFromCart(item.drugId);
    };

    const moveToCart = (item) => {
      // Add back to cart
      updateCartItem({ drugId: item.drugId, quantity: item.quantity, ...item });
      // Remove from saved items
      savedForLater.value = savedForLater.value.filter(i => i.drugId !== item.drugId);
    };

    const removeSavedItem = (drugId) => {
      savedForLater.value = savedForLater.value.filter(i => i.drugId !== drugId);
    };

    const selectAddress = (address) => {
      setSelectedDeliveryAddressAction(address);
      showAddressModal.value = false;
    };

    const saveNewAddress = async () => {
      if (!newAddressForm.value.label || !newAddressForm.value.street ||
          !newAddressForm.value.city || !newAddressForm.value.state ||
          !newAddressForm.value.recipient_name || !newAddressForm.value.phone) {
        alert("Please fill in all required fields");
        return;
      }

      savingAddress.value = true;
      try {
        await addDeliveryAddressAction(newAddressForm.value);
        // Select the newly added address
        const newAddr = savedAddresses.value.find(a => a.label === newAddressForm.value.label);
        if (newAddr) {
          setSelectedDeliveryAddressAction(newAddr);
        }
        showAddAddressModal.value = false;
        resetAddressForm();
      } catch (error) {
        alert(error.response?.data?.message || "Failed to save address");
      } finally {
        savingAddress.value = false;
      }
    };

    const resetAddressForm = () => {
      newAddressForm.value = {
        label: "",
        recipient_name: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        additional_info: "",
        is_default: false,
      };
    };

    const selectPrescriptionOption = (prescription, type = 'uploaded') => {
      selectedPrescriptionType.value = type;
      setSelectedPrescriptionAction({ prescription, type });
    };

    // Toggle specialist prescription selection (multi-select)
    const toggleSpecialistPrescription = (prescription) => {
      const index = selectedSpecialistPrescriptions.value.findIndex(
        p => p._id === prescription._id
      );
      if (index > -1) {
        // Remove if already selected
        selectedSpecialistPrescriptions.value.splice(index, 1);
      } else {
        // Add to selection
        selectedSpecialistPrescriptions.value.push(prescription);
      }
      // Clear single selection when using multi-select
      if (selectedSpecialistPrescriptions.value.length > 0) {
        selectedPrescriptionType.value = 'specialist';
      }
    };

    // Check if a specialist prescription is selected
    const isSpecialistPrescriptionSelected = (prescription) => {
      return selectedSpecialistPrescriptions.value.some(p => p._id === prescription._id);
    };

    const confirmingPrescription = ref(false);

    const confirmPrescription = async () => {
      confirmingPrescription.value = true;

      try {
        // If multiple specialist prescriptions are selected, verify all of them
        if (selectedSpecialistPrescriptions.value.length > 0) {
          const acceptPromises = selectedSpecialistPrescriptions.value.map(prescription =>
            $api.$_acceptPrescriptionForPharmacy(prescription._id).catch(error => {
              console.error(`Error accepting prescription ${prescription._id}:`, error);
              return null; // Continue with other prescriptions even if one fails
            })
          );
          await Promise.all(acceptPromises);

          // Set the first selected prescription as the main selected one for coverage display
          if (selectedSpecialistPrescriptions.value.length > 0) {
            setSelectedPrescriptionAction({
              prescription: selectedSpecialistPrescriptions.value[0],
              type: 'specialist'
            });
          }
        } else if (selectedPrescriptionType.value === 'specialist' && selectedPrescription.value?._id) {
          // Single specialist prescription selection (fallback)
          await $api.$_acceptPrescriptionForPharmacy(selectedPrescription.value._id);
        }
      } catch (error) {
        console.error("Error accepting prescription(s):", error);
        // Continue anyway - the prescriptions are still selected
      } finally {
        confirmingPrescription.value = false;
      }

      showPrescriptionModal.value = false;
    };

    const proceedToCheckout = () => {
      if (!canProceedToCheckout.value) return;

      router.push({
        path: "/app/patient/pharmacy/checkout",
        query: {
          useWallet: useWalletBalance.value ? "true" : "false",
        },
      });
    };

    const goToWallet = () => {
      router.push("/app/patient/wallet");
    };

    // Promo code functions
    const applyPromoCode = async () => {
      if (!promoCode.value.trim()) {
        promoError.value = 'Please enter a promo code';
        return;
      }

      applyingPromo.value = true;
      promoError.value = '';

      try {
        // TODO: Call API to validate promo code
        // For now, simulate a simple promo validation
        const code = promoCode.value.trim().toUpperCase();

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Demo codes for testing (replace with actual API call)
        if (code === 'SAVE10') {
          promoCodeApplied.value = {
            code: code,
            discount_type: 'percentage',
            discount_value: 10,
            description: '10% off your order'
          };
        } else if (code === 'FIRST500') {
          promoCodeApplied.value = {
            code: code,
            discount_type: 'fixed',
            discount_value: 500,
            description: '₦500 off your order'
          };
        } else {
          promoError.value = 'Invalid promo code';
        }
      } catch (error) {
        promoError.value = error.response?.data?.message || 'Failed to apply promo code';
      } finally {
        applyingPromo.value = false;
      }
    };

    const removePromoCode = () => {
      promoCodeApplied.value = null;
      promoCode.value = '';
      promoError.value = '';
    };

    // Pickup center methods
    const fetchPickupCenters = async () => {
      pickupCentersLoading.value = true;
      try {
        const response = await $api.$_getPickupCenters({ limit: 20 });
        const data = response.data?.data || response.data?.result || response.data || {};
        // API returns pickup_centers (snake_case)
        pickupCenters.value = data.pickup_centers || data.pickupCenters || [];

        // Auto-select first pickup center if none selected
        if (pickupCenters.value.length > 0 && !selectedPickupCenter.value) {
          selectedPickupCenter.value = pickupCenters.value[0];
        }
      } catch (error) {
        console.error("Error fetching pickup centers:", error);
        pickupCenters.value = [];
      } finally {
        pickupCentersLoading.value = false;
      }
    };

    const selectPickupCenter = (center) => {
      selectedPickupCenter.value = center;
      showPickupModal.value = false;
    };

    const formatPickupAddress = (center) => {
      if (!center) return "";
      const addr = center.pickup_center_details?.address || center.address || {};
      const parts = [];
      if (addr.street) parts.push(addr.street);
      if (addr.city) parts.push(addr.city);
      if (addr.state) parts.push(addr.state);
      return parts.join(", ");
    };

    // Fetch drug interaction settings
    const fetchInteractionSettings = async () => {
      try {
        const response = await $api.getDrugInteractionSettings();
        const settings = response.data?.data || response.data || {};
        interactionSettings.value = {
          enabled_for_patients: settings.enabled_for_patients ?? true,
          data_sources: settings.data_sources || ['claude_ai', 'openfda'],
        };
      } catch (error) {
        console.error("Error fetching interaction settings:", error);
        // Use defaults if fetch fails
        interactionSettings.value = {
          enabled_for_patients: true,
          data_sources: ['claude_ai', 'openfda'],
        };
      }
    };

    // Check for drug interactions in cart
    const checkDrugInteractions = async () => {
      // Check if interactions are enabled for patients
      if (!interactionSettings.value.enabled_for_patients) {
        drugInteractions.value = {
          hasInteractions: false,
          interactions: [],
          disclaimer: '',
          checkedAt: null,
          sourcesUsed: [],
        };
        return;
      }

      // Need at least 2 items to check for interactions
      if (cart.value.length < 2) {
        drugInteractions.value = {
          hasInteractions: false,
          interactions: [],
          disclaimer: '',
          checkedAt: null,
          sourcesUsed: [],
        };
        return;
      }

      checkingInteractions.value = true;
      try {
        const drugIds = cart.value.map(item => item.drugId).filter(Boolean);
        if (drugIds.length < 2) {
          drugInteractions.value = {
            hasInteractions: false,
            interactions: [],
            disclaimer: '',
            checkedAt: null,
            sourcesUsed: [],
          };
          return;
        }

        // Use configured data sources
        const dataSources = interactionSettings.value.data_sources;
        const response = await $api.checkDrugInteractions(drugIds, dataSources);
        const data = response.data?.data || response.data || {};

        drugInteractions.value = {
          hasInteractions: data.hasInteractions || false,
          interactions: data.interactions || [],
          disclaimer: data.disclaimer || 'This information is for reference only. Always consult your pharmacist or doctor.',
          checkedAt: data.checkedAt || new Date(),
          sourcesUsed: data.sourcesUsed || [],
        };

        // Auto-expand if there are high severity interactions
        if (data.interactions?.some(i => i.severity === 'high')) {
          showInteractionDetails.value = true;
        }
      } catch (error) {
        console.error("Error checking drug interactions:", error);
        drugInteractions.value = {
          hasInteractions: false,
          interactions: [],
          disclaimer: '',
          checkedAt: null,
          sourcesUsed: [],
        };
      } finally {
        checkingInteractions.value = false;
      }
    };

    // Debounce interaction check to avoid excessive API calls
    let interactionCheckTimeout = null;
    const debouncedCheckInteractions = () => {
      if (interactionCheckTimeout) {
        clearTimeout(interactionCheckTimeout);
      }
      interactionCheckTimeout = setTimeout(() => {
        checkDrugInteractions();
      }, 500); // Wait 500ms after cart changes before checking
    };

    // Order placement functions
    const placeOrder = async () => {
      if (!canProceedToCheckout.value || placingOrder.value) return;

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

        // Prepare order items
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
            discount_code: promoCodeApplied.value ? promoCode.value : "",
          };
          // Call OTC order endpoint
          const response = await createOTCOrder(orderData);
          if (response && response.data) {
            await handlePayment(response.data);
          }
        }
      } catch (error) {
        console.error("Error placing order:", error);

        // Use the extracted message attached by the store action
        const errorMessage = error.extractedMessage ||
                            error.response?.data?.errorMessage ||
                            error.response?.data?.message ||
                            "Failed to place order. Please try again.";

        // Parse and format the error for better UX
        orderError.value = formatOrderError(errorMessage);

        // Scroll to error alert so user can see it
        nextTick(() => {
          if (orderErrorRef.value) {
            orderErrorRef.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      } finally {
        placingOrder.value = false;
      }
    };

    // Format order error messages for better user experience
    const formatOrderError = (message) => {
      // Check if it's a purchase limit error
      if (message.includes('purchased') && message.includes('Maximum allowed')) {
        // Parse the drug names from the error
        const drugMatches = message.match(/(\d+) units of ([A-Za-z]+)/g);
        const affectedDrugs = drugMatches ? drugMatches.map(m => {
          const match = m.match(/(\d+) units of ([A-Za-z]+)/);
          return match ? match[2] : null;
        }).filter(Boolean) : [];

        return {
          type: 'purchase_limit',
          title: 'Purchase Limit Reached',
          message: 'You have reached the monthly purchase limit for some medications in your cart.',
          affectedItems: affectedDrugs,
          suggestion: 'Please remove the affected items to continue with your order, or wait until your monthly limit resets.',
          rawMessage: message
        };
      }

      // Default error format
      return {
        type: 'general',
        title: 'Order Failed',
        message: message,
        affectedItems: [],
        suggestion: 'Please try again or contact support if the problem persists.'
      };
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
        email: contactInfo.value.email || userProfile.value?.email || "",
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

    // Pre-fill new address form with user profile
    watch(showAddAddressModal, (newVal) => {
      if (newVal && userProfile.value) {
        newAddressForm.value.recipient_name = `${userProfile.value.profile?.first_name || ""} ${userProfile.value.profile?.last_name || ""}`.trim();
        newAddressForm.value.phone = userProfile.value.profile?.phone_number || "";
      }
    });

    // Fetch prescriptions when modal opens
    watch(showPrescriptionModal, async (newVal) => {
      if (newVal) {
        // Fetch both types of prescriptions in parallel
        const promises = [];
        if (approvedPrescriptions.value.length === 0) {
          promises.push(fetchApprovedPrescriptionsAction());
        }
        if (specialistPrescriptions.value.length === 0) {
          promises.push(fetchSpecialistPrescriptionsAction());
        }
        if (promises.length > 0) {
          await Promise.all(promises);
        }
      }
    });

    // Fetch pickup centers when delivery method changes to pickup
    watch(deliveryMethod, async (newVal) => {
      if (newVal === "pickup" && pickupCenters.value.length === 0) {
        await fetchPickupCenters();
      }
    }, { immediate: true });

    // Check for drug interactions when cart changes
    watch(cart, () => {
      debouncedCheckInteractions();
    }, { deep: true });

    onMounted(async () => {
      await initializeCheckout();

      // Fetch default pharmacy for order placement
      await fetchDefaultPharmacy();

      // Pre-fill contact info from user profile
      if (userProfile.value) {
        contactInfo.value.name = `${userProfile.value.profile?.first_name || ""} ${userProfile.value.profile?.last_name || ""}`.trim();
        contactInfo.value.phone = userProfile.value.profile?.phone_number || "";
        contactInfo.value.email = userProfile.value.email || "";
      }

      // Validate cart items and remove any with invalid drugId
      const invalidItems = cart.value.filter(item => !item.drugId);
      if (invalidItems.length > 0) {
        console.warn("Found invalid cart items without drugId:", invalidItems);
        invalidItems.forEach(item => {
          removeFromCart(item.drugId || item._id || item.name);
        });
        if (cart.value.length === 0 || cart.value.length === invalidItems.length) {
          alert("Your cart contained invalid items that have been removed. Please add items again.");
        }
      }

      // If cart has RX items, pre-fetch prescriptions
      if (hasRxItems.value) {
        await fetchApprovedPrescriptionsAction();

        // Check if returning from prescription upload with a prescriptionId
        const prescriptionId = route.query.prescriptionId;
        if (prescriptionId && approvedPrescriptions.value.length > 0) {
          const matchingPrescription = approvedPrescriptions.value.find(
            (p) => p._id === prescriptionId
          );
          if (matchingPrescription) {
            setSelectedPrescriptionAction({ prescription: matchingPrescription, type: 'uploaded' });
          }
        }

        // Auto-select the first approved prescription if none selected and prescriptions exist
        if (!selectedPrescription.value && approvedPrescriptions.value.length > 0) {
          setSelectedPrescriptionAction({ prescription: approvedPrescriptions.value[0], type: 'uploaded' });
        }
      }

      // Fetch interaction settings and check for drug interactions on initial load
      await fetchInteractionSettings();
      if (cart.value.length >= 2) {
        await checkDrugInteractions();
      }
    });

    return {
      cart,
      cartItemCount,
      cartTotal,
      loading,
      walletBalance,
      useWalletBalance,
      walletDeduction,
      totalAmount,
      deliveryFee,
      actualDeliveryFee,
      hasRxItems,
      rxCartItems,
      otcCartItems,
      maxQtyMessage,
      // Free delivery
      freeDeliveryThreshold,
      amountToFreeDelivery,
      freeDeliveryProgress,
      hasFreeDelivery,
      // Estimated delivery
      estimatedDeliveryDate,
      // Delivery
      deliveryMethod,
      selectedDeliveryAddress,
      savedAddresses,
      addressesLoading,
      defaultPharmacy,
      // Prescriptions
      selectedPrescription,
      approvedPrescriptions,
      specialistPrescriptions,
      prescriptionsLoading,
      prescriptionTabType,
      selectedPrescriptionType,
      // Coverage
      rxCartItems,
      prescriptionCoverage,
      isItemCovered,
      getSpecialistPrescriptionCoverage,
      // Checkout state
      canProceedToCheckout,
      checkoutBlockers,
      checkoutButtonLabel,
      // Payment state
      paymentMethod,
      placingOrder,
      orderError,
      orderErrorRef,
      contactInfo,
      walletPaymentAmount,
      amountToPay,
      payNowButtonLabel,
      placeOrder,
      // Modals
      showAddressModal,
      showAddAddressModal,
      showPrescriptionModal,
      showPickupModal,
      newAddressForm,
      savingAddress,
      // Promo code
      promoCode,
      promoCodeApplied,
      promoDiscount,
      applyingPromo,
      promoError,
      applyPromoCode,
      removePromoCode,
      // Pickup centers
      pickupCenters,
      pickupCentersLoading,
      selectedPickupCenter,
      // Drug interactions
      drugInteractions,
      checkingInteractions,
      showInteractionDetails,
      checkDrugInteractions,
      // Functions
      formatPrice,
      formatDate,
      formatAddressDisplay,
      formatPharmacyAddress,
      getStockStatus,
      incrementQuantity,
      decrementQuantity,
      canIncrement,
      removeItem,
      // Save for later
      savedForLater,
      saveForLater,
      moveToCart,
      removeSavedItem,
      // Undo remove
      removedItem,
      showUndoToast,
      undoRemove,
      dismissUndoToast,
      setDeliveryMethodAction,
      selectAddress,
      saveNewAddress,
      selectPrescriptionOption,
      confirmPrescription,
      confirmingPrescription,
      selectedSpecialistPrescriptions,
      toggleSpecialistPrescription,
      isSpecialistPrescriptionSelected,
      proceedToCheckout,
      goToWallet,
      fetchPickupCenters,
      selectPickupCenter,
      formatPickupAddress,
    };
  },
};
</script>

<style scoped lang="scss">
.cart-page {
  padding: $size-16;
  padding-bottom: $size-100;

  // Extra padding on mobile for sticky checkout bar
  @media (max-width: 768px) {
    padding-bottom: 120px;
  }

  .empty-cart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $size-48 $size-24;
    text-align: center;
    background: $color-white;
    border-radius: $size-16;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    .empty-cart-illustration {
      margin-bottom: $size-24;

      .cart-icon-wrapper {
        position: relative;
        width: 120px;
        height: 120px;
        background: linear-gradient(135deg, rgba($color-pri, 0.1) 0%, rgba($color-pri, 0.05) 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $color-pri;

        svg {
          opacity: 0.8;
        }

        .empty-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          background: $color-g-85;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: $size-12;
          font-weight: 700;
          color: $color-g-54;
          border: 3px solid $color-white;
        }
      }
    }

    h3 {
      font-size: $size-22;
      font-weight: 700;
      color: $color-g-21;
      margin-bottom: $size-8;
    }

    p {
      font-size: $size-14;
      color: $color-g-54;
      margin-bottom: $size-24;
      max-width: 300px;
      line-height: 1.5;
    }

    .empty-cart-actions {
      display: flex;
      flex-direction: column;
      gap: $size-12;
      width: 100%;
      max-width: 280px;
      margin-bottom: $size-32;
    }

    .browse-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $size-8;
      border: none;
      padding: $size-14 $size-24;
      border-radius: $size-10;
      font-size: $size-14;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      .btn-icon {
        font-size: $size-16;
      }

      &.primary {
        background: $color-pri;
        color: white;

        &:hover {
          background: darken($color-pri, 8%);
          transform: translateY(-1px);
        }
      }

      &.secondary {
        background: transparent;
        color: $color-pri;
        border: 1px solid $color-pri;

        &:hover {
          background: rgba($color-pri, 0.05);
        }
      }
    }

    .empty-cart-features {
      display: flex;
      gap: $size-20;
      padding-top: $size-24;
      border-top: 1px solid $color-g-92;

      @media (max-width: 480px) {
        flex-direction: column;
        gap: $size-12;
      }

      .feature-item {
        display: flex;
        align-items: center;
        gap: $size-6;
        font-size: $size-12;
        color: $color-g-54;

        .feature-icon {
          font-size: $size-14;
        }
      }
    }
  }

  // Free Delivery Banner
  .free-delivery-banner {
    background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
    border: 1px solid #fed7aa;
    border-radius: $size-12;
    padding: $size-16;
    margin-bottom: $size-16;

    &.achieved {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-color: #86efac;

      .progress-fill {
        background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
      }

      .success-text {
        color: #16a34a;
        font-weight: 600;
      }
    }

    .delivery-banner-content {
      display: flex;
      align-items: center;
      gap: $size-10;
      margin-bottom: $size-12;

      .delivery-icon {
        font-size: $size-24;
      }

      .delivery-message {
        font-size: $size-14;
        color: $color-g-21;

        strong {
          color: $color-pri;
        }
      }
    }

    .delivery-progress-bar {
      .progress-track {
        height: 8px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 4px;
        overflow: hidden;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #f97316 0%, #ea580c 100%);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-labels {
        display: flex;
        justify-content: space-between;
        margin-top: $size-6;
        font-size: $size-11;
        color: $color-g-54;
      }
    }
  }

  // Drug Interaction Alert Styles
  .drug-interaction-alert {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border: 1px solid #fecaca;
    border-radius: $size-12;
    padding: $size-16;
    margin-bottom: $size-16;

    .interaction-header {
      display: flex;
      align-items: flex-start;
      gap: $size-12;

      .header-icon {
        font-size: $size-24;
        flex-shrink: 0;
      }

      .header-content {
        flex: 1;

        h4 {
          font-size: $size-16;
          font-weight: 600;
          color: #b91c1c;
          margin: 0 0 $size-4 0;
        }

        p {
          font-size: $size-13;
          color: #991b1b;
          margin: 0;
        }
      }

      .expand-btn {
        display: flex;
        align-items: center;
        gap: $size-4;
        padding: $size-8 $size-12;
        background: rgba(255, 255, 255, 0.8);
        border: 1px solid #fca5a5;
        border-radius: $size-8;
        font-size: $size-12;
        color: #b91c1c;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: white;
        }

        .arrow {
          transition: transform 0.2s ease;
          font-size: $size-10;

          &.rotated {
            transform: rotate(180deg);
          }
        }
      }
    }

    .interaction-details {
      margin-top: $size-16;
      padding-top: $size-16;
      border-top: 1px solid #fecaca;

      .interaction-item {
        display: flex;
        gap: $size-12;
        padding: $size-12;
        background: rgba(255, 255, 255, 0.6);
        border-radius: $size-8;
        margin-bottom: $size-10;

        &.severity-high {
          border-left: 4px solid #dc2626;
        }

        &.severity-moderate {
          border-left: 4px solid #f59e0b;
        }

        &.severity-low {
          border-left: 4px solid #3b82f6;
        }

        .severity-badge {
          display: flex;
          align-items: center;
          gap: $size-4;
          padding: $size-4 $size-8;
          border-radius: $size-6;
          font-size: $size-11;
          font-weight: 600;
          text-transform: uppercase;
          flex-shrink: 0;
          height: fit-content;

          &.high {
            background: #fef2f2;
            color: #dc2626;
          }

          &.moderate {
            background: #fffbeb;
            color: #d97706;
          }

          &.low {
            background: #eff6ff;
            color: #2563eb;
          }
        }

        .interaction-info {
          flex: 1;

          .drug-pair {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: $size-6;
            margin-bottom: $size-6;

            strong {
              font-size: $size-13;
              color: $color-g-21;
            }

            .separator {
              color: $color-g-54;
              font-size: $size-12;
            }
          }

          .description {
            font-size: $size-12;
            color: $color-g-44;
            line-height: 1.5;
            margin: 0 0 $size-6 0;
          }

          .source {
            font-size: $size-11;
            color: $color-g-67;
          }
        }
      }

      .interaction-disclaimer {
        display: flex;
        align-items: flex-start;
        gap: $size-8;
        padding: $size-12;
        background: rgba(255, 255, 255, 0.8);
        border-radius: $size-8;
        margin-top: $size-8;

        .disclaimer-icon {
          font-size: $size-16;
          flex-shrink: 0;
        }

        p {
          font-size: $size-12;
          color: $color-g-44;
          line-height: 1.5;
          margin: 0;
        }
      }
    }
  }

  // Slide transition for interaction details
  .slide-enter-active,
  .slide-leave-active {
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .slide-enter-from,
  .slide-leave-to {
    opacity: 0;
    max-height: 0;
    margin-top: 0;
    padding-top: 0;
  }

  .slide-enter-to,
  .slide-leave-from {
    opacity: 1;
    max-height: 1000px;
  }

  // Loading state for interaction check
  .interaction-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-10;
    padding: $size-12 $size-16;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: $size-8;
    margin-bottom: $size-16;

    .loading-spinner {
      width: 18px;
      height: 18px;
      border: 2px solid #e2e8f0;
      border-top-color: $color-pri;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    span {
      font-size: $size-13;
      color: $color-g-44;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .cart-section {
    background: $color-white;
    border-radius: $size-16;
    padding: $size-20;
    margin-bottom: $size-16;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    .section-header {
      margin-bottom: $size-16;
      padding-bottom: $size-12;
      border-bottom: 1px solid $color-g-92;

      h3 {
        font-size: $size-16;
        font-weight: 600;
        color: $color-g-21;
      }
    }

    .max-qty-warning {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: $size-8;
      padding: $size-10 $size-14;
      margin-bottom: $size-16;
      font-size: $size-13;
      color: #856404;
    }

    // Item groups (OTC & Rx separation)
    .items-group {
      margin-bottom: $size-16;

      &:last-child {
        margin-bottom: 0;
      }

      .group-header {
        display: flex;
        align-items: center;
        gap: $size-8;
        padding: $size-10 $size-12;
        border-radius: $size-8;
        margin-bottom: $size-12;

        .group-icon {
          font-size: $size-16;

          &.rx-icon {
            background: #dc2626;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: $size-11;
            font-weight: 700;
          }
        }

        .group-title {
          font-size: $size-14;
          font-weight: 600;
          color: $color-g-21;
        }

        .rx-notice {
          margin-left: auto;
          font-size: $size-11;
          color: #dc2626;
          font-weight: 500;
        }
      }

      &.otc-group .group-header {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;

        .group-title {
          color: #166534;
        }
      }

      &.rx-group .group-header {
        background: #fef2f2;
        border: 1px solid #fecaca;

        .group-title {
          color: #991b1b;
        }
      }
    }
  }

  .cart-items {
    .cart-item {
      display: flex;
      align-items: center;
      gap: $size-12;
      padding: $size-14 0;
      border-bottom: 1px solid $color-g-95;

      &:last-child {
        border-bottom: none;
      }

      .item-image {
        position: relative;
        width: 64px;
        height: 64px;
        border-radius: $size-10;
        overflow: hidden;
        flex-shrink: 0;
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
          font-size: $size-28;
        }

        .rx-tag {
          position: absolute;
          top: 4px;
          right: 4px;
          background: $color-pri;
          color: white;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 5px;
          border-radius: 4px;
        }
      }

      .item-info {
        flex: 1;
        min-width: 0;

        .item-name {
          font-size: $size-14;
          font-weight: 600;
          color: $color-g-21;
          margin-bottom: $size-2;
        }

        .item-meta {
          font-size: $size-12;
          color: $color-g-54;
        }

        .item-manufacturer {
          font-size: $size-11;
          color: $color-g-67;
          margin: 0;
        }

        .stock-status-row {
          display: flex;
          align-items: center;
          gap: $size-8;
          margin-top: $size-6;

          .stock-badge {
            display: inline-flex;
            align-items: center;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: $size-10;
            font-weight: 600;

            &.in-stock {
              background: #dcfce7;
              color: #16a34a;
            }

            &.low-stock {
              background: #fef3c7;
              color: #d97706;
            }

            &.out-of-stock {
              background: #fee2e2;
              color: #dc2626;
            }
          }

          .item-price-mobile {
            display: none;
            font-size: $size-13;
            color: $color-pri;
            font-weight: 600;

            @media (max-width: 600px) {
              display: block;
            }
          }
        }
      }

      .item-quantity-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: $size-4;

        .max-qty-hint {
          font-size: $size-10;
          color: $color-g-67;
        }
      }

      .item-quantity {
        display: flex;
        align-items: center;
        gap: $size-6;
        background: $color-g-95;
        border-radius: $size-8;
        padding: $size-4;

        .qty-btn {
          width: $size-28;
          height: $size-28;
          border: 1px solid $color-g-85;
          background: $color-white;
          border-radius: $size-6;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: $size-16;
          font-weight: 600;
          color: $color-g-44;

          &:hover:not(:disabled) {
            background: $color-pri;
            border-color: $color-pri;
            color: white;
          }

          &:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }
        }

        .qty-value {
          font-size: $size-14;
          font-weight: 600;
          min-width: $size-24;
          text-align: center;
        }
      }

      .item-total {
        text-align: right;
        min-width: 90px;

        .total-amount {
          display: block;
          font-size: $size-15;
          font-weight: 700;
          color: $color-g-21;
        }

        .unit-price {
          font-size: $size-11;
          color: $color-g-67;
        }

        @media (max-width: 600px) {
          display: none;
        }
      }

      .item-actions {
        display: flex;
        flex-direction: column;
        gap: $size-6;

        .save-later-btn {
          width: $size-32;
          height: $size-32;
          border: 1px solid $color-g-85;
          background: white;
          border-radius: $size-8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: $size-16;
          color: $color-g-54;
          transition: all 0.2s ease;

          &:hover {
            border-color: #ec4899;
            color: #ec4899;
            background: #fdf2f8;
          }
        }

        .remove-btn {
          width: $size-32;
          height: $size-32;
          border: none;
          background: #fef2f2;
          border-radius: $size-8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: $size-14;
          color: #ef4444;
          font-weight: 600;

          &:hover {
            background: #fee2e2;
          }
        }
      }
    }
  }

  // Saved for Later Section
  .saved-section {
    background: #fdf2f8 !important;
    border: 1px solid #fbcfe8;

    .section-header h3 {
      color: #be185d;
    }

    .saved-items {
      display: flex;
      flex-direction: column;
      gap: $size-12;
    }

    .saved-item {
      display: flex;
      align-items: center;
      gap: $size-12;
      padding: $size-12;
      background: white;
      border-radius: $size-10;

      .saved-item-image {
        width: 56px;
        height: 56px;
        border-radius: $size-8;
        overflow: hidden;
        flex-shrink: 0;
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
          font-size: $size-24;
        }
      }

      .saved-item-info {
        flex: 1;
        min-width: 0;

        h4 {
          font-size: $size-14;
          font-weight: 600;
          color: $color-g-21;
          margin-bottom: $size-2;
        }

        .saved-meta {
          font-size: $size-12;
          color: $color-g-54;
          margin: 0;
        }

        .saved-price {
          font-size: $size-14;
          font-weight: 600;
          color: $color-pri;
          margin: $size-4 0 0;
        }
      }

      .saved-item-actions {
        display: flex;
        flex-direction: column;
        gap: $size-6;
        align-items: flex-end;

        .move-to-cart-btn {
          padding: $size-8 $size-14;
          background: $color-pri;
          color: white;
          border: none;
          border-radius: $size-6;
          font-size: $size-12;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;

          &:hover {
            background: darken($color-pri, 8%);
          }
        }

        .remove-saved-btn {
          padding: $size-4 $size-8;
          background: transparent;
          border: none;
          color: $color-g-54;
          font-size: $size-12;
          cursor: pointer;

          &:hover {
            color: #ef4444;
          }
        }
      }
    }
  }

  // Delivery Section
  .delivery-section {
    .delivery-toggle {
      display: flex;
      gap: $size-12;
      margin-bottom: $size-16;

      .toggle-btn {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: $size-16;
        border: 2px solid $color-g-85;
        border-radius: $size-12;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;

        .toggle-icon {
          font-size: $size-24;
          margin-bottom: $size-8;
        }

        .toggle-label {
          font-size: $size-14;
          font-weight: 600;
          color: $color-g-44;
        }

        .toggle-desc {
          font-size: $size-11;
          color: $color-g-67;
          margin-top: $size-4;
        }

        &.active {
          border-color: $color-pri;
          background: rgba($color-pri, 0.05);

          .toggle-label {
            color: $color-pri;
          }
        }

        &:hover:not(.active) {
          border-color: $color-g-67;
        }
      }
    }

    .address-section {
      .loading-state {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: $size-10;
        padding: $size-20;
        color: $color-g-67;

        .spinner {
          width: $size-20;
          height: $size-20;
          border: 2px solid $color-g-85;
          border-top-color: $color-pri;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      }

      .selected-address {
        border: 2px solid $color-pri;
        border-radius: $size-12;
        padding: $size-16;
        background: rgba($color-pri, 0.03);

        .address-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: $size-10;

          .address-label {
            display: flex;
            align-items: center;
            gap: $size-6;
            font-weight: 600;
            color: $color-pri;

            .label-icon {
              font-size: $size-16;
            }

            .default-badge {
              background: $color-pri;
              color: white;
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 4px;
              font-weight: 600;
            }
          }

          .change-btn {
            padding: $size-6 $size-12;
            border: 1px solid $color-pri;
            background: white;
            border-radius: $size-6;
            color: $color-pri;
            font-size: $size-12;
            font-weight: 500;
            cursor: pointer;
          }
        }

        .address-details {
          .recipient {
            font-weight: 600;
            color: $color-g-21;
            margin-bottom: $size-4;
          }

          .address-text {
            font-size: $size-13;
            color: $color-g-44;
            margin-bottom: $size-4;
          }

          .phone {
            font-size: $size-12;
            color: $color-g-67;
          }
        }

        .estimated-delivery {
          display: flex;
          align-items: center;
          gap: $size-8;
          margin-top: $size-12;
          padding: $size-10 $size-12;
          background: #f0f9ff;
          border-radius: $size-8;
          border: 1px solid #bae6fd;

          .delivery-icon {
            font-size: $size-16;
          }

          .delivery-text {
            font-size: $size-13;
            color: #0369a1;

            strong {
              font-weight: 600;
              color: #0c4a6e;
            }
          }
        }
      }

      .no-address {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: $size-24;
        border: 2px dashed $color-g-85;
        border-radius: $size-12;

        .no-address-icon {
          font-size: $size-32;
          margin-bottom: $size-8;
        }

        p {
          color: $color-g-67;
          margin-bottom: $size-12;
        }

        .add-address-btn {
          padding: $size-10 $size-20;
          background: $color-pri;
          color: white;
          border: none;
          border-radius: $size-8;
          font-size: $size-14;
          font-weight: 500;
          cursor: pointer;
        }
      }
    }

    .pickup-section {
      .loading-state {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: $size-10;
        padding: $size-20;
        color: $color-g-67;

        .spinner {
          width: $size-20;
          height: $size-20;
          border: 2px solid $color-g-85;
          border-top-color: $color-pri;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      }

      .selected-pickup {
        display: flex;
        gap: $size-12;
        padding: $size-16;
        background: #f0fdf4;
        border-radius: $size-12;
        border: 1px solid #86efac;
        align-items: flex-start;

        .pharmacy-icon {
          font-size: $size-28;
        }

        .pharmacy-details {
          flex: 1;

          strong {
            display: block;
            color: #166534;
            margin-bottom: $size-4;
          }

          p {
            font-size: $size-13;
            color: #15803d;
            margin: 0 0 $size-4;
          }

          .pickup-note {
            font-size: $size-12;
            font-style: italic;
          }
        }

        .change-btn {
          padding: $size-6 $size-12;
          border: 1px solid #16a34a;
          background: white;
          border-radius: $size-6;
          color: #16a34a;
          font-size: $size-12;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;

          &:hover {
            background: rgba(#16a34a, 0.05);
          }
        }
      }

      .no-pickup-centers {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: $size-24;
        border: 2px dashed $color-g-85;
        border-radius: $size-12;

        .no-pickup-icon {
          font-size: $size-32;
          margin-bottom: $size-8;
        }

        p {
          color: $color-g-67;
          margin: 0;
        }
      }
    }
  }

  // Prescription Section
  .prescription-section {
    .prescription-required {
      .rx-warning {
        display: flex;
        gap: $size-12;
        padding: $size-16;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: $size-12;
        margin-bottom: $size-16;

        .warning-icon {
          font-size: $size-24;
        }

        .warning-text {
          strong {
            display: block;
            color: #991b1b;
            margin-bottom: $size-4;
          }

          p {
            font-size: $size-13;
            color: #b91c1c;
            margin: 0;
          }
        }
      }

      .prescription-actions {
        display: flex;
        gap: $size-10;

        button {
          flex: 1;
          padding: $size-12;
          border-radius: $size-8;
          font-size: $size-13;
          font-weight: 500;
          cursor: pointer;
        }

        .select-rx-btn {
          background: white;
          border: 1px solid $color-pri;
          color: $color-pri;
        }

        .upload-rx-btn {
          background: $color-pri;
          border: none;
          color: white;
        }
      }
    }

    .prescription-selected {
      .rx-success {
        display: flex;
        align-items: center;
        gap: $size-12;
        padding: $size-16;
        background: #f0fdf4;
        border: 1px solid #86efac;
        border-radius: $size-12;

        .success-icon {
          font-size: $size-24;
        }

        .rx-info {
          flex: 1;

          strong {
            display: block;
            color: #166534;
            margin-bottom: $size-4;
          }

          p {
            font-size: $size-13;
            color: #15803d;
            margin: 0;
          }

          .rx-date {
            font-size: $size-12;
          }
        }

        .change-rx-btn {
          padding: $size-6 $size-12;
          border: 1px solid #16a34a;
          background: white;
          border-radius: $size-6;
          color: #16a34a;
          font-size: $size-12;
          font-weight: 500;
          cursor: pointer;
        }
      }

      // Pharmacist Verification Notice
      .pharmacist-verification-notice {
        display: flex;
        gap: $size-12;
        margin-top: $size-16;
        padding: $size-12 $size-16;
        background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
        border: 1px solid #7dd3fc;
        border-radius: $size-10;

        .notice-icon {
          font-size: $size-24;
          flex-shrink: 0;
        }

        .notice-content {
          flex: 1;

          strong {
            display: block;
            font-size: $size-14;
            color: #0369a1;
            margin-bottom: $size-4;
          }

          p {
            font-size: $size-12;
            color: #0284c7;
            line-height: 1.5;
            margin: 0;
          }
        }
      }
    }
  }

  // Summary Section
  .summary-section {
    // Promo Code Card
    .promo-code-card {
      background: $color-white;
      border-radius: $size-12;
      padding: $size-16;
      margin-bottom: $size-16;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      border: 1px solid $color-g-92;

      .promo-header {
        display: flex;
        align-items: center;
        gap: $size-8;
        margin-bottom: $size-12;
        font-size: $size-14;
        font-weight: 500;
        color: $color-g-21;

        .promo-icon {
          font-size: $size-16;
        }
      }

      .promo-input-wrapper {
        display: flex;
        gap: $size-8;

        .promo-input {
          flex: 1;
          padding: $size-12;
          border: 1px solid $color-g-85;
          border-radius: $size-8;
          font-size: $size-14;
          text-transform: uppercase;
          font-family: inherit;

          &:focus {
            outline: none;
            border-color: $color-pri;
          }

          &::placeholder {
            text-transform: none;
          }

          &:disabled {
            background: $color-g-97;
          }
        }

        .apply-promo-btn {
          padding: $size-12 $size-20;
          background: $color-pri;
          color: white;
          border: none;
          border-radius: $size-8;
          font-size: $size-14;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;

          &:hover:not(:disabled) {
            background: darken($color-pri, 8%);
          }

          &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        }
      }

      .promo-applied {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: $size-12;
        background: #f0fdf4;
        border: 1px solid #86efac;
        border-radius: $size-8;

        .applied-info {
          display: flex;
          flex-direction: column;
          gap: $size-2;

          .applied-code {
            font-weight: 700;
            color: #16a34a;
            font-size: $size-14;
          }

          .applied-desc {
            font-size: $size-12;
            color: #15803d;
          }
        }

        .remove-promo-btn {
          width: $size-28;
          height: $size-28;
          border: none;
          background: #dcfce7;
          border-radius: $size-6;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: $size-12;
          color: #16a34a;
          font-weight: 600;

          &:hover {
            background: #bbf7d0;
          }
        }
      }

      .promo-error {
        margin-top: $size-8;
        font-size: $size-12;
        color: #dc2626;
      }
    }

    .wallet-card {
      background: linear-gradient(135deg, $color-pri 0%, darken($color-pri, 15%) 100%);
      border-radius: $size-16;
      padding: $size-20;
      margin-bottom: $size-16;
      color: white;

      .wallet-header {
        display: flex;
        align-items: center;
        gap: $size-12;
        margin-bottom: $size-12;

        .wallet-icon {
          font-size: $size-28;
        }

        .wallet-info {
          .wallet-label {
            display: block;
            font-size: $size-12;
            opacity: 0.9;
          }

          .wallet-balance {
            font-size: $size-22;
            font-weight: 700;
          }
        }
      }

      .wallet-actions {
        .use-wallet-toggle {
          display: flex;
          align-items: center;
          gap: $size-10;
          cursor: pointer;
          padding: $size-10;
          background: rgba(255, 255, 255, 0.15);
          border-radius: $size-8;

          input {
            width: $size-18;
            height: $size-18;
          }

          span {
            font-size: $size-14;
          }
        }
      }

      .wallet-empty {
        padding: $size-10;
        background: rgba(255, 255, 255, 0.15);
        border-radius: $size-8;
        text-align: center;

        p {
          font-size: $size-13;
          margin: 0 0 $size-8;
          opacity: 0.9;
        }

        .top-up-link {
          background: white;
          color: $color-pri;
          border: none;
          padding: $size-8 $size-16;
          border-radius: $size-6;
          font-size: $size-13;
          font-weight: 600;
          cursor: pointer;
        }
      }
    }

    .price-summary {
      background: $color-white;
      border-radius: $size-16;
      padding: $size-20;
      margin-bottom: $size-16;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: $size-10 0;
        border-bottom: 1px solid $color-g-95;
        font-size: $size-14;

        &:last-child {
          border-bottom: none;
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

        .discount {
          color: #10b981;
          font-weight: 600;
        }

        .free-delivery-text {
          display: flex;
          align-items: center;
          gap: $size-6;
          color: #16a34a;
          font-weight: 600;

          .original-fee {
            text-decoration: line-through;
            color: $color-g-67;
            font-weight: 400;
            font-size: $size-12;
          }
        }
      }
    }

    // Payment Method Section
    .payment-method-section {
      margin-bottom: $size-16;

      .section-title {
        font-size: $size-14;
        font-weight: 600;
        color: $color-g-21;
        margin-bottom: $size-12;
      }

      .payment-options {
        display: flex;
        flex-direction: column;
        gap: $size-10;
      }

      .payment-option {
        display: flex;
        align-items: flex-start;
        gap: $size-12;
        padding: $size-14;
        background: $color-g-97;
        border: 2px solid transparent;
        border-radius: $size-10;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: $color-g-92;
        }

        &.selected {
          background: rgba($color-pri, 0.05);
          border-color: $color-pri;
        }

        &.disabled {
          opacity: 0.6;
          cursor: not-allowed;

          &:hover {
            background: $color-g-97;
          }
        }

        .radio-circle {
          width: 20px;
          height: 20px;
          border: 2px solid $color-g-67;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 2px;
          position: relative;
          transition: all 0.2s ease;

          &.checked {
            border-color: $color-pri;

            &::after {
              content: '';
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 10px;
              height: 10px;
              background: $color-pri;
              border-radius: 50%;
            }
          }
        }

        .option-content {
          display: flex;
          align-items: flex-start;
          gap: $size-10;
          flex: 1;

          .option-icon {
            font-size: $size-22;
          }

          .option-info {
            display: flex;
            flex-direction: column;
            gap: 2px;

            strong {
              font-size: $size-14;
              color: $color-g-21;
            }

            span {
              font-size: $size-12;
              color: $color-g-54;
            }

            .insufficient {
              color: #dc2626;
              font-size: $size-11;
            }
          }
        }
      }
    }

    // Processing Overlay
    .processing-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;

      .processing-content {
        background: white;
        padding: $size-32;
        border-radius: $size-16;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid $color-g-85;
          border-top-color: $color-pri;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto $size-16;
        }

        p {
          font-size: $size-14;
          color: $color-g-21;
          margin: 0;
        }
      }
    }

    .checkout-blockers {
      margin-bottom: $size-16;

      .blocker-item {
        display: flex;
        align-items: center;
        gap: $size-8;
        padding: $size-10 $size-12;
        background: #fef3c7;
        border-radius: $size-8;
        margin-bottom: $size-8;
        font-size: $size-13;
        color: #92400e;

        .blocker-icon {
          font-size: $size-14;
        }
      }
    }

    .checkout-actions {
      display: flex;
      flex-direction: column;
      gap: $size-12;

      button {
        width: 100%;
      }
    }

    // Trust Badges
    .trust-badges {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: $size-10;
      margin-top: $size-20;
      padding-top: $size-20;
      border-top: 1px solid $color-g-92;

      .trust-badge {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: $size-10 $size-6;
        background: $color-g-97;
        border-radius: $size-8;

        .badge-icon {
          width: 32px;
          height: 32px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: $size-14;
          margin-bottom: $size-6;
        }

        .badge-text {
          display: flex;
          flex-direction: column;

          strong {
            font-size: $size-11;
            font-weight: 600;
            color: $color-g-21;
            line-height: 1.2;
          }

          span {
            font-size: $size-9;
            color: $color-g-54;
            line-height: 1.3;
          }
        }
      }
    }
  }
}

// Undo Toast
.undo-toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $size-16;
  background: #1f2937;
  color: white;
  padding: $size-12 $size-16;
  border-radius: $size-10;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
  z-index: 1000;
  min-width: 300px;
  max-width: calc(100vw - 32px);

  @media (max-width: 768px) {
    bottom: 140px;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: $size-10;

    .toast-icon {
      font-size: $size-18;
    }

    .toast-message {
      font-size: $size-14;

      strong {
        font-weight: 600;
      }
    }
  }

  .toast-actions {
    display: flex;
    align-items: center;
    gap: $size-8;

    .undo-btn {
      padding: $size-6 $size-12;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: $size-6;
      font-size: $size-13;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;

      &:hover {
        background: #2563eb;
      }
    }

    .dismiss-btn {
      padding: $size-6;
      background: transparent;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      font-size: $size-14;

      &:hover {
        color: white;
      }
    }
  }
}

// Toast animation
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

// Modals
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
  padding: $size-16;
}

.modal-content {
  background: white;
  border-radius: $size-16;
  width: 100%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-16;
    border-bottom: 1px solid $color-g-95;

    h3 {
      font-size: $size-18;
      font-weight: 600;
    }

    .close-btn {
      width: $size-32;
      height: $size-32;
      border-radius: 50%;
      border: none;
      background: $color-g-95;
      cursor: pointer;
      font-size: $size-16;
    }
  }

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: $size-16;

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: $size-24;
      gap: $size-12;

      .spinner {
        width: $size-32;
        height: $size-32;
        border: 3px solid $color-g-85;
        border-top-color: $color-pri;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }

    .no-addresses-modal, .no-prescriptions {
      text-align: center;
      padding: $size-24;

      p {
        color: $color-g-67;
        margin-bottom: $size-16;
      }
    }

    .addresses-list, .prescriptions-list {
      display: flex;
      flex-direction: column;
      gap: $size-12;

      .multi-select-hint {
        font-size: $size-13;
        color: $color-g-54;
        margin: 0 0 $size-4;
        padding: $size-8 $size-12;
        background: #f0f9ff;
        border-radius: $size-6;
        border-left: 3px solid $color-pri;
      }
    }

    .address-option, .prescription-option {
      display: flex;
      gap: $size-12;
      padding: $size-14;
      border: 2px solid $color-g-85;
      border-radius: $size-12;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: $color-g-67;
      }

      &.selected {
        border-color: $color-pri;
        background: rgba($color-pri, 0.03);
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

      .checkbox-square {
        width: $size-20;
        height: $size-20;
        border: 2px solid $color-g-67;
        border-radius: 4px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        transition: all 0.2s ease;

        &.checked {
          border-color: $color-pri;
          background: $color-pri;
        }
      }

      .address-info, .prescription-info {
        flex: 1;

        .label-row {
          display: flex;
          align-items: center;
          gap: $size-8;
          margin-bottom: $size-4;

          .default-tag, .profile-tag {
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 600;
            border-radius: 4px;
          }

          .default-tag {
            background: $color-pri;
            color: white;
          }

          .profile-tag {
            background: #e0f2fe;
            color: #0369a1;
          }
        }

        .recipient, strong {
          font-weight: 600;
          color: $color-g-21;
        }

        .address-text, span {
          font-size: $size-13;
          color: $color-g-67;
        }

        .date {
          display: block;
          font-size: $size-12;
          color: $color-g-54;
        }

        .meds-count {
          display: block;
          font-size: $size-12;
          color: $color-pri;
          font-weight: 500;
        }

        .prescription-number {
          display: block;
          font-size: $size-12;
          color: $color-g-54;
          font-family: monospace;
        }

        .coverage-indicator {
          margin-top: $size-8;

          .coverage-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;

            &.full {
              background: #dcfce7;
              color: #16a34a;
            }

            &.partial {
              background: #fef3c7;
              color: #d97706;
            }

            &.none {
              background: #fee2e2;
              color: #dc2626;
            }
          }
        }

        .prescribed-drugs {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: $size-8;

          .drug-chip {
            background: $color-g-95;
            color: $color-g-54;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
          }

          .more-drugs {
            color: $color-g-54;
            font-size: 11px;
            font-style: italic;
          }
        }
      }

      &.has-coverage {
        border-color: #16a34a;
        background: rgba(#16a34a, 0.03);
      }

      &.partial-coverage {
        border-color: #d97706;
        background: rgba(#d97706, 0.03);
      }
    }

    .hint-text {
      font-size: $size-12;
      color: $color-g-54;
      margin-top: $size-8;
    }

    .add-new-btn, .upload-btn {
      width: 100%;
      padding: $size-12;
      border: 2px dashed $color-g-85;
      background: transparent;
      border-radius: $size-10;
      color: $color-pri;
      font-size: $size-14;
      font-weight: 500;
      cursor: pointer;
      margin-top: $size-8;

      &:hover {
        border-color: $color-pri;
        background: rgba($color-pri, 0.03);
      }
    }

    .upload-new-section {
      margin-bottom: $size-12;
      padding-bottom: $size-12;
      border-bottom: 1px solid $color-g-90;

      .upload-new-btn {
        width: 100%;
        padding: $size-10 $size-14;
        border: 1px dashed $color-pri;
        background: rgba($color-pri, 0.03);
        border-radius: $size-8;
        color: $color-pri;
        font-size: $size-13;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: rgba($color-pri, 0.08);
          border-style: solid;
        }
      }
    }

    .no-pickup-centers-modal {
      text-align: center;
      padding: $size-24;

      p {
        color: $color-g-67;
        margin: 0;
      }
    }

    .pickup-centers-list {
      display: flex;
      flex-direction: column;
      gap: $size-12;
    }

    .pickup-option {
      display: flex;
      gap: $size-12;
      padding: $size-14;
      border: 2px solid $color-g-85;
      border-radius: $size-12;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: $color-g-67;
      }

      &.selected {
        border-color: #16a34a;
        background: rgba(#16a34a, 0.03);
      }

      .radio-circle {
        width: $size-20;
        height: $size-20;
        border: 2px solid $color-g-67;
        border-radius: 50%;
        flex-shrink: 0;
        position: relative;

        &.checked {
          border-color: #16a34a;

          &::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: $size-10;
            height: $size-10;
            background: #16a34a;
            border-radius: 50%;
          }
        }
      }

      .pickup-info {
        flex: 1;

        strong {
          display: block;
          font-weight: 600;
          color: $color-g-21;
          margin-bottom: $size-4;
        }

        .pickup-address {
          display: block;
          font-size: $size-13;
          color: $color-g-54;
          margin-bottom: $size-4;
        }

        .pickup-hours {
          display: block;
          font-size: $size-12;
          color: $color-g-67;
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    gap: $size-12;
    padding: $size-16;
    border-top: 1px solid $color-g-95;

    button {
      flex: 1;
      padding: $size-12;
      border-radius: $size-8;
      font-size: $size-14;
      font-weight: 500;
      cursor: pointer;
    }

    .cancel-btn {
      background: white;
      border: 1px solid $color-g-85;
      color: $color-g-44;
    }

    .save-btn, .confirm-btn {
      background: $color-pri;
      border: none;
      color: white;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  // Prescription tabs
  .prescription-tabs {
    display: flex;
    border-bottom: 1px solid $color-g-85;
    padding: 0 $size-16;

    .tab-btn {
      flex: 1;
      padding: $size-12;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      font-size: $size-14;
      font-weight: 500;
      color: $color-g-54;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        color: $color-g-21;
      }

      &.active {
        color: $color-pri;
        border-bottom-color: $color-pri;
      }
    }
  }

  &.prescription-modal {
    max-width: 550px;
  }
}

// Add Address Modal specific styles
.add-address-modal {
  .modal-body {
    .form-group {
      margin-bottom: $size-16;

      label {
        display: block;
        font-size: $size-14;
        font-weight: 500;
        color: $color-g-44;
        margin-bottom: $size-6;
      }

      input, textarea {
        width: 100%;
        padding: $size-12;
        border: 1px solid $color-g-85;
        border-radius: $size-8;
        font-size: $size-14;
        font-family: inherit;
        resize: none;

        &:focus {
          outline: none;
          border-color: $color-pri;
        }
      }

      &.half {
        flex: 1;
      }
    }

    .form-row {
      display: flex;
      gap: $size-12;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: $size-10;
      cursor: pointer;

      input {
        width: $size-18;
        height: $size-18;
        accent-color: $color-pri;
      }

      span {
        font-size: $size-14;
        color: $color-g-44;
      }
    }
  }
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: $size-48;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Coverage badge on cart items
.coverage-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: $size-18;
  height: $size-18;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $size-10;
  font-weight: 700;

  &.covered {
    background: $color-denote-green;
    color: white;
  }

  &.not-covered {
    background: $color-denote-yellow;
    color: white;
  }
}

// Coverage status in prescription section
.coverage-status {
  margin-top: $size-12;
  padding-top: $size-12;
  border-top: 1px dashed $color-g-85;

  .coverage-good {
    display: flex;
    align-items: center;
    gap: $size-8;
    padding: $size-10;
    background: rgba($color-denote-green, 0.08);
    border-radius: $size-8;
    color: $color-denote-green;
    font-size: $size-13;
    font-weight: 500;

    .status-icon {
      font-size: $size-16;
    }
  }

  .coverage-warning {
    padding: $size-12;
    background: rgba($color-denote-yellow, 0.08);
    border-radius: $size-8;

    .coverage-header {
      display: flex;
      align-items: center;
      gap: $size-8;
      color: $color-denote-yellow;
      font-size: $size-13;
      font-weight: 500;
      margin-bottom: $size-8;

      .status-icon {
        font-size: $size-16;
      }
    }

    .uncovered-list {
      display: flex;
      flex-wrap: wrap;
      gap: $size-6;
      margin-bottom: $size-10;

      .uncovered-item {
        padding: $size-4 $size-10;
        background: rgba($color-denote-yellow, 0.15);
        border-radius: $size-12;
        font-size: $size-11;
        color: darken($color-denote-yellow, 15%);
      }
    }

    .coverage-actions {
      .upload-more-btn {
        width: 100%;
        padding: $size-10;
        background: white;
        border: 1px solid $color-denote-yellow;
        border-radius: $size-8;
        color: $color-denote-yellow;
        font-size: $size-13;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: rgba($color-denote-yellow, 0.05);
        }
      }
    }
  }
}

// Sticky Mobile Checkout Bar
.mobile-checkout-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: $color-white;
  border-top: 1px solid $color-g-85;
  padding: $size-12 $size-16;
  z-index: 100;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);

  @media (max-width: 768px) {
    display: block;
  }

  .mobile-checkout-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $size-16;
    max-width: 600px;
    margin: 0 auto;
  }

  .mobile-total {
    display: flex;
    flex-direction: column;

    .mobile-total-label {
      font-size: $size-12;
      color: $color-g-54;
    }

    .mobile-total-amount {
      font-size: $size-18;
      font-weight: 700;
      color: $color-g-21;
    }
  }

  .mobile-checkout-btn {
    flex: 1;
    max-width: 200px;
    padding: $size-14 $size-24;
    background: $color-pri;
    color: white;
    border: none;
    border-radius: $size-10;
    font-size: $size-15;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: darken($color-pri, 8%);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// Order Error Alert
.order-error-alert {
  background: rgba($color-denote-red, 0.04);
  border: 1px solid rgba($color-denote-red, 0.2);
  border-radius: $size-12;
  margin-bottom: $size-16;
  overflow: hidden;

  .error-header {
    display: flex;
    align-items: center;
    gap: $size-10;
    padding: $size-14 $size-16;
    background: rgba($color-denote-red, 0.08);
    border-bottom: 1px solid rgba($color-denote-red, 0.1);

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

    .error-title {
      flex: 1;
      font-size: $size-15;
      font-weight: 600;
      color: $color-denote-red;
    }

    .error-dismiss {
      flex-shrink: 0;
      width: $size-28;
      height: $size-28;
      padding: 0;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s ease;

      svg {
        width: $size-16;
        height: $size-16;
        color: $color-g-54;
      }

      &:hover {
        background: rgba($color-denote-red, 0.1);
        svg { color: $color-denote-red; }
      }
    }
  }

  .error-body {
    padding: $size-16;

    .error-message {
      font-size: $size-14;
      color: $color-g-21;
      margin: 0 0 $size-12;
      line-height: 1.5;
    }

    .affected-items {
      margin-bottom: $size-12;

      .affected-label {
        display: block;
        font-size: $size-12;
        color: $color-g-54;
        margin-bottom: $size-8;
      }

      .affected-chips {
        display: flex;
        flex-wrap: wrap;
        gap: $size-8;

        .affected-chip {
          padding: $size-6 $size-12;
          background: rgba($color-denote-red, 0.1);
          color: $color-denote-red;
          border-radius: $size-16;
          font-size: $size-12;
          font-weight: 500;
        }
      }
    }

    .error-suggestion {
      font-size: $size-13;
      color: $color-g-54;
      margin: 0;
      padding: $size-12;
      background: $color-white;
      border-radius: $size-8;
      border-left: 3px solid $color-pri;
    }
  }

  .error-actions {
    display: flex;
    gap: $size-10;
    padding: $size-12 $size-16 $size-16;

    .error-action-btn {
      flex: 1;
      padding: $size-10 $size-16;
      border-radius: $size-8;
      font-size: $size-13;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;

      &.primary {
        background: $color-pri;
        color: white;

        &:hover {
          background: darken($color-pri, 8%);
        }
      }

      &.secondary {
        background: $color-g-95;
        color: $color-g-44;

        &:hover {
          background: $color-g-90;
        }
      }
    }
  }
}
</style>
