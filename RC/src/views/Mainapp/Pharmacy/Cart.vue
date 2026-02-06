<template>
  <div class="cart-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="back-btn" @click="$router.back()">
        <v-icon name="hi-arrow-left" scale="1.1" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="cart-btn" @click="$router.push('/app/patient/pharmacy')">
        <v-icon name="hi-shopping-cart" scale="1.1" />
        <span v-if="cartItemCount > 0" class="cart-count">{{ cartItemCount }}</span>
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="hi-shopping-cart" scale="1.2" class="spinner-icon" />
        </div>
        <p>Loading your cart...</p>
      </div>

      <template v-else>
        <!-- Breadcrumbs -->
        <nav class="breadcrumbs">
          <router-link to="/app/patient/dashboard" class="breadcrumb-item">
            <v-icon name="hi-home" scale="0.8" />
          </router-link>
          <span class="breadcrumb-sep">/</span>
          <router-link to="/app/patient/pharmacy" class="breadcrumb-item">Pharmacy</router-link>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-item current">Shopping Cart</span>
        </nav>

        <!-- Empty Cart State -->
        <div v-if="cart.length === 0" class="empty-state-card">
          <div class="empty-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-core">
              <v-icon name="hi-shopping-cart" scale="2.5" />
            </div>
          </div>
          <h2>Your cart is empty</h2>
          <p>Discover medications, health products, and wellness essentials</p>
          <div class="empty-actions">
            <button class="primary-btn" @click="$router.push('/app/patient/pharmacy')">
              <v-icon name="hi-shopping-cart" scale="1" />
              <span>Browse Pharmacy</span>
            </button>
          </div>
          <div class="trust-row">
            <div class="trust-item">
              <v-icon name="hi-shield-check" scale="0.9" />
              <span>Licensed Pharmacy</span>
            </div>
            <div class="trust-item">
              <v-icon name="hi-truck" scale="0.9" />
              <span>Fast Delivery</span>
            </div>
            <div class="trust-item">
              <v-icon name="hi-lock-closed" scale="0.9" />
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>

        <!-- Cart Content -->
        <template v-else>
          <!-- Bento Grid -->
          <section class="bento-grid">
            <!-- Cart Summary Hero -->
            <div class="bento-card summary-hero-card">
              <div class="summary-hero">
                <div class="hero-content">
                  <div class="hero-badge">
                    <div class="badge-pulse"></div>
                    <v-icon name="hi-shopping-cart" scale="0.9" />
                    <span>Shopping Cart</span>
                  </div>
                  <h1 class="hero-title">{{ cartItemCount }} Item{{ cartItemCount !== 1 ? 's' : '' }}</h1>
                  <p class="hero-subtitle">Review your items and proceed to checkout</p>
                </div>
                <div class="hero-stats">
                  <div class="stat-item">
                    <span class="stat-value">{{ formatPrice(cartTotal) }}</span>
                    <span class="stat-label">Subtotal</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat-item">
                    <span class="stat-value" :class="{ 'free': hasFreeDelivery }">
                      {{ hasFreeDelivery ? 'FREE' : formatPrice(actualDeliveryFee) }}
                    </span>
                    <span class="stat-label">Delivery</span>
                  </div>
                </div>
              </div>
              <!-- Free Delivery Progress -->
              <div v-if="!hasFreeDelivery" class="delivery-progress">
                <div class="progress-text">
                  <v-icon name="hi-truck" scale="0.9" />
                  <span>Add <strong>{{ formatPrice(amountToFreeDelivery) }}</strong> more for FREE delivery</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: freeDeliveryProgress + '%' }"></div>
                </div>
              </div>
              <div v-else class="free-delivery-achieved">
                <v-icon name="hi-gift" scale="1" />
                <span>You've earned FREE delivery!</span>
              </div>
            </div>

            <!-- Drug Interaction Alert -->
            <div v-if="drugInteractions.hasInteractions" class="bento-card alert-card danger">
              <div class="alert-header">
                <div class="alert-icon">
                  <v-icon name="hi-exclamation-circle" scale="1.2" />
                </div>
                <div class="alert-content">
                  <h3>Drug Interaction Warning</h3>
                  <p>{{ drugInteractions.interactions.length }} potential interaction{{ drugInteractions.interactions.length > 1 ? 's' : '' }} detected</p>
                </div>
                <button class="alert-toggle" @click="showInteractionDetails = !showInteractionDetails">
                  <span>{{ showInteractionDetails ? 'Hide' : 'Details' }}</span>
                  <v-icon :name="showInteractionDetails ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.8" />
                </button>
              </div>
              <Transition name="slide">
                <div v-if="showInteractionDetails" class="alert-details">
                  <div v-for="(interaction, idx) in drugInteractions.interactions" :key="idx"
                       :class="['interaction-item', interaction.severity]">
                    <span class="severity-tag">{{ interaction.severity }}</span>
                    <div class="interaction-drugs">
                      <strong>{{ interaction.drug1 }}</strong>
                      <span class="plus">+</span>
                      <strong>{{ interaction.drug2 }}</strong>
                    </div>
                    <p class="interaction-desc">{{ interaction.description }}</p>
                  </div>
                  <div class="interaction-disclaimer">
                    <v-icon name="hi-information-circle" scale="0.9" />
                    <p>{{ drugInteractions.disclaimer }}</p>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Cart Items Card -->
            <div class="bento-card items-card">
              <div class="card-header">
                <div class="header-icon sky">
                  <v-icon name="hi-shopping-cart" scale="1" />
                </div>
                <h3>Cart Items</h3>
                <span class="item-count">{{ cartItemCount }} item{{ cartItemCount !== 1 ? 's' : '' }}</span>
              </div>

              <!-- OTC Items -->
              <div v-if="otcCartItems.length > 0" class="items-section">
                <div class="section-label otc">
                  <v-icon name="ri-capsule-line" scale="0.9" />
                  <span>Over-the-Counter ({{ otcCartItems.length }})</span>
                </div>
                <div class="cart-items-list">
                  <div v-for="item in otcCartItems" :key="item.drugId" class="cart-item">
                    <div class="item-image">
                      <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" referrerpolicy="no-referrer" />
                      <div v-else class="image-placeholder">
                        <v-icon name="ri-capsule-line" scale="1.2" />
                      </div>
                    </div>
                    <div class="item-details">
                      <h4 class="item-name">{{ item.name }}</h4>
                      <p class="item-meta">
                        <span v-if="item.strength">{{ item.strength }}</span>
                        <span v-if="item.dosageForm"> &bull; {{ item.dosageForm }}</span>
                      </p>
                      <p v-if="item.manufacturer" class="item-manufacturer">{{ item.manufacturer }}</p>
                      <div class="item-stock" :class="getStockStatus(item).class">
                        <span class="stock-dot"></span>
                        {{ getStockStatus(item).label }}
                      </div>
                    </div>
                    <div class="item-quantity">
                      <button class="qty-btn" @click="decrementQuantity(item)" :disabled="item.quantity <= 1">
                        <v-icon name="hi-minus" scale="0.8" />
                      </button>
                      <span class="qty-value">{{ item.quantity }}</span>
                      <button class="qty-btn" @click="incrementQuantity(item)" :disabled="!canIncrement(item)">
                        <v-icon name="hi-plus" scale="0.8" />
                      </button>
                    </div>
                    <div class="item-price">
                      <span class="price-total">{{ formatPrice(item.price * item.quantity) }}</span>
                      <span class="price-each">{{ formatPrice(item.price) }} each</span>
                    </div>
                    <div class="item-actions">
                      <button class="action-btn save" @click="saveForLater(item)" title="Save for later">
                        <v-icon name="hi-heart" scale="0.9" />
                      </button>
                      <button class="action-btn remove" @click="removeItem(item)" title="Remove">
                        <v-icon name="hi-trash" scale="0.9" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Prescription Items -->
              <div v-if="rxCartItems.length > 0" class="items-section">
                <div class="section-label rx">
                  <v-icon name="hi-document-text" scale="0.9" />
                  <span>Prescription Required ({{ rxCartItems.length }})</span>
                </div>
                <div class="cart-items-list">
                  <div v-for="item in rxCartItems" :key="item.drugId" class="cart-item">
                    <div class="item-image">
                      <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" referrerpolicy="no-referrer" />
                      <div v-else class="image-placeholder">
                        <v-icon name="ri-capsule-line" scale="1.2" />
                      </div>
                      <span class="rx-badge">Rx</span>
                    </div>
                    <div class="item-details">
                      <h4 class="item-name">{{ item.name }}</h4>
                      <p class="item-meta">
                        <span v-if="item.strength">{{ item.strength }}</span>
                        <span v-if="item.dosageForm"> &bull; {{ item.dosageForm }}</span>
                      </p>
                      <p v-if="item.manufacturer" class="item-manufacturer">{{ item.manufacturer }}</p>
                      <div class="item-stock" :class="getStockStatus(item).class">
                        <span class="stock-dot"></span>
                        {{ getStockStatus(item).label }}
                      </div>
                    </div>
                    <div class="item-quantity">
                      <button class="qty-btn" @click="decrementQuantity(item)" :disabled="item.quantity <= 1">
                        <v-icon name="hi-minus" scale="0.8" />
                      </button>
                      <span class="qty-value">{{ item.quantity }}</span>
                      <button class="qty-btn" @click="incrementQuantity(item)" :disabled="!canIncrement(item)">
                        <v-icon name="hi-plus" scale="0.8" />
                      </button>
                    </div>
                    <div class="item-price">
                      <span class="price-total">{{ formatPrice(item.price * item.quantity) }}</span>
                      <span class="price-each">{{ formatPrice(item.price) }} each</span>
                    </div>
                    <div class="item-actions">
                      <button class="action-btn save" @click="saveForLater(item)" title="Save for later">
                        <v-icon name="hi-heart" scale="0.9" />
                      </button>
                      <button class="action-btn remove" @click="removeItem(item)" title="Remove">
                        <v-icon name="hi-trash" scale="0.9" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Delivery Method Card -->
            <div class="bento-card delivery-card">
              <div class="card-header">
                <div class="header-icon violet">
                  <v-icon name="hi-truck" scale="1" />
                </div>
                <h3>Delivery Method</h3>
              </div>
              <div class="delivery-options">
                <button :class="['delivery-option', { active: deliveryMethod === 'delivery' }]"
                        @click="setDeliveryMethodAction('delivery')">
                  <div class="option-icon">
                    <v-icon name="hi-home" scale="1.2" />
                  </div>
                  <div class="option-info">
                    <strong>Home Delivery</strong>
                    <span>Delivered to your door</span>
                  </div>
                  <div class="option-check" v-if="deliveryMethod === 'delivery'">
                    <v-icon name="hi-check" scale="0.9" />
                  </div>
                </button>
                <button :class="['delivery-option', { active: deliveryMethod === 'pickup' }]"
                        @click="setDeliveryMethodAction('pickup')">
                  <div class="option-icon">
                    <v-icon name="hi-office-building" scale="1.2" />
                  </div>
                  <div class="option-info">
                    <strong>Pickup</strong>
                    <span>Collect from pharmacy</span>
                  </div>
                  <div class="option-check" v-if="deliveryMethod === 'pickup'">
                    <v-icon name="hi-check" scale="0.9" />
                  </div>
                </button>
              </div>

              <!-- Delivery Address -->
              <div v-if="deliveryMethod === 'delivery'" class="address-section">
                <div v-if="addressesLoading" class="loading-inline">
                  <div class="spinner-sm"></div>
                  <span>Loading addresses...</span>
                </div>
                <div v-else-if="selectedDeliveryAddress" class="selected-address">
                  <div class="address-icon">
                    <v-icon name="hi-location-marker" scale="1" />
                  </div>
                  <div class="address-info">
                    <div class="address-label">
                      <strong>{{ selectedDeliveryAddress.label || 'Delivery Address' }}</strong>
                      <span v-if="selectedDeliveryAddress.is_default" class="default-tag">Default</span>
                    </div>
                    <p class="address-recipient">{{ selectedDeliveryAddress.recipient_name }}</p>
                    <p class="address-text">{{ formatAddressDisplay(selectedDeliveryAddress) }}</p>
                  </div>
                  <button class="change-btn" @click="showAddressModal = true">Change</button>
                </div>
                <div v-else class="no-address">
                  <v-icon name="hi-location-marker" scale="1.5" />
                  <p>No delivery address selected</p>
                  <button class="add-btn" @click="showAddAddressModal = true">
                    <v-icon name="hi-plus" scale="0.9" />
                    Add Address
                  </button>
                </div>
                <div v-if="selectedDeliveryAddress" class="delivery-estimate">
                  <v-icon name="hi-clock" scale="0.9" />
                  <span>Estimated delivery: <strong>{{ estimatedDeliveryDate.range }}</strong></span>
                </div>
              </div>

              <!-- Pickup Location -->
              <div v-if="deliveryMethod === 'pickup'" class="pickup-section">
                <div v-if="pickupCentersLoading" class="loading-inline">
                  <div class="spinner-sm"></div>
                  <span>Loading pickup centers...</span>
                </div>
                <div v-else-if="selectedPickupCenter" class="selected-pickup">
                  <div class="pickup-icon">
                    <v-icon name="hi-office-building" scale="1.2" />
                  </div>
                  <div class="pickup-info">
                    <strong>{{ selectedPickupCenter.name }}</strong>
                    <p>{{ formatPickupAddress(selectedPickupCenter) }}</p>
                  </div>
                  <button v-if="pickupCenters.length > 1" class="change-btn" @click="showPickupModal = true">
                    Change
                  </button>
                </div>
              </div>
            </div>

            <!-- Prescription Card (if RX items) -->
            <div v-if="hasRxItems" class="bento-card prescription-card">
              <div class="card-header">
                <div class="header-icon amber">
                  <v-icon name="hi-clipboard-list" scale="1" />
                </div>
                <h3>Prescription</h3>
                <span v-if="!selectedPrescription" class="required-tag">Required</span>
              </div>

              <div v-if="!selectedPrescription" class="prescription-required">
                <div class="rx-alert">
                  <v-icon name="hi-exclamation-circle" scale="1.2" />
                  <div class="alert-text">
                    <strong>Prescription Required</strong>
                    <p>Your cart contains prescription-only items</p>
                  </div>
                </div>
                <div class="prescription-actions">
                  <button class="action-primary" @click="showPrescriptionModal = true">
                    <v-icon name="hi-document" scale="0.9" />
                    Select Prescription
                  </button>
                  <button class="action-secondary" @click="$router.push('/app/patient/pharmacy/upload-prescription?returnTo=/app/patient/pharmacy/cart')">
                    <v-icon name="hi-upload" scale="0.9" />
                    Upload New
                  </button>
                </div>
              </div>

              <div v-else class="prescription-selected">
                <div class="rx-success">
                  <v-icon name="hi-check-circle" scale="1.5" />
                  <div class="success-info">
                    <strong>Prescription Selected</strong>
                    <p v-if="selectedPrescription.ocr_data?.doctor_name">
                      Dr. {{ selectedPrescription.ocr_data.doctor_name }}
                    </p>
                    <span class="rx-date">{{ formatDate(selectedPrescription.created_at) }}</span>
                  </div>
                  <button class="change-btn" @click="showPrescriptionModal = true">Change</button>
                </div>
                <div v-if="prescriptionCoverage.allCovered" class="coverage-status success">
                  <v-icon name="hi-check" scale="0.9" />
                  <span>All {{ prescriptionCoverage.covered.length }} RX items covered</span>
                </div>
                <div v-else-if="prescriptionCoverage.uncovered.length > 0" class="coverage-status warning">
                  <v-icon name="hi-exclamation" scale="0.9" />
                  <span>{{ prescriptionCoverage.uncovered.length }} item(s) not covered</span>
                </div>
              </div>
            </div>

            <!-- Order Summary Card -->
            <div class="bento-card order-card">
              <div class="card-header">
                <div class="header-icon emerald">
                  <v-icon name="hi-receipt-tax" scale="1" />
                </div>
                <h3>Order Summary</h3>
              </div>

              <!-- Promo Code -->
              <div class="promo-section">
                <div v-if="!promoCodeApplied" class="promo-input-row">
                  <input type="text" v-model="promoCode" placeholder="Promo code" :disabled="applyingPromo" />
                  <button class="apply-btn" @click="applyPromoCode" :disabled="!promoCode || applyingPromo">
                    {{ applyingPromo ? '...' : 'Apply' }}
                  </button>
                </div>
                <div v-else class="promo-applied">
                  <div class="promo-info">
                    <v-icon name="hi-tag" scale="0.9" />
                    <span class="promo-code">{{ promoCodeApplied.code }}</span>
                    <span class="promo-discount">-{{ formatPrice(promoDiscount) }}</span>
                  </div>
                  <button class="remove-promo" @click="removePromoCode">
                    <v-icon name="hi-x" scale="0.8" />
                  </button>
                </div>
                <p v-if="promoError" class="promo-error">{{ promoError }}</p>
              </div>

              <!-- Price Breakdown -->
              <div class="price-breakdown">
                <div class="price-row">
                  <span>Subtotal</span>
                  <span>{{ formatPrice(cartTotal) }}</span>
                </div>
                <div v-if="promoDiscount > 0" class="price-row discount">
                  <span>Discount</span>
                  <span>-{{ formatPrice(promoDiscount) }}</span>
                </div>
                <div class="price-row" v-if="deliveryMethod === 'delivery'">
                  <span>Delivery</span>
                  <span :class="{ 'free-text': hasFreeDelivery }">
                    {{ hasFreeDelivery ? 'FREE' : formatPrice(actualDeliveryFee) }}
                  </span>
                </div>
                <div class="price-row total">
                  <span>Total</span>
                  <span>{{ formatPrice(totalAmount) }}</span>
                </div>
              </div>

              <!-- Payment Method -->
              <div class="payment-section">
                <h4>Payment Method</h4>
                <div class="payment-options">
                  <label :class="['payment-option', { selected: paymentMethod === 'card' }]">
                    <input type="radio" v-model="paymentMethod" value="card" />
                    <div class="option-content">
                      <v-icon name="hi-credit-card" scale="1.1" />
                      <div class="option-text">
                        <strong>Card Payment</strong>
                        <span>Pay with card</span>
                      </div>
                    </div>
                  </label>
                  <label :class="['payment-option', { selected: paymentMethod === 'wallet', disabled: walletBalance <= 0 }]">
                    <input type="radio" v-model="paymentMethod" value="wallet" :disabled="walletBalance <= 0" />
                    <div class="option-content">
                      <v-icon name="bi-wallet-2" scale="1.1" />
                      <div class="option-text">
                        <strong>Wallet</strong>
                        <span>{{ formatPrice(walletBalance) }} available</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Checkout Button -->
              <div class="checkout-section">
                <div v-if="checkoutBlockers.length > 0" class="blockers">
                  <div v-for="(blocker, idx) in checkoutBlockers" :key="idx" class="blocker-item">
                    <v-icon name="hi-exclamation-circle" scale="0.85" />
                    <span>{{ blocker }}</span>
                  </div>
                </div>
                <button class="checkout-btn" :disabled="!canProceedToCheckout || placingOrder" @click="placeOrder">
                  <span v-if="placingOrder">Processing...</span>
                  <span v-else>{{ payNowButtonLabel }}</span>
                </button>
              </div>

              <!-- Trust Badges -->
              <div class="trust-badges">
                <div class="badge">
                  <v-icon name="hi-lock-closed" scale="0.9" />
                  <span>Secure</span>
                </div>
                <div class="badge">
                  <v-icon name="hi-shield-check" scale="0.9" />
                  <span>Licensed</span>
                </div>
                <div class="badge">
                  <v-icon name="hi-refresh" scale="0.9" />
                  <span>Returns</span>
                </div>
              </div>
            </div>

            <!-- Saved for Later -->
            <div v-if="savedForLater.length > 0" class="bento-card saved-card">
              <div class="card-header">
                <div class="header-icon rose">
                  <v-icon name="hi-heart" scale="1" />
                </div>
                <h3>Saved for Later</h3>
                <span class="item-count">{{ savedForLater.length }}</span>
              </div>
              <div class="saved-items">
                <div v-for="item in savedForLater" :key="'saved-' + item.drugId" class="saved-item">
                  <div class="saved-image">
                    <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" referrerpolicy="no-referrer" />
                    <div v-else class="image-placeholder">
                      <v-icon name="ri-capsule-line" scale="1" />
                    </div>
                  </div>
                  <div class="saved-info">
                    <h4>{{ item.name }}</h4>
                    <p>{{ item.strength }} {{ item.dosageForm }}</p>
                    <span class="saved-price">{{ formatPrice(item.price) }}</span>
                  </div>
                  <div class="saved-actions">
                    <button class="move-btn" @click="moveToCart(item)">
                      <v-icon name="hi-shopping-cart" scale="0.85" />
                      Add
                    </button>
                    <button class="remove-btn" @click="removeSavedItem(item.drugId)">
                      <v-icon name="hi-x" scale="0.9" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Mobile Checkout Bar -->
          <div class="mobile-checkout-bar">
            <div class="mobile-total">
              <span class="label">Total</span>
              <span class="amount">{{ formatPrice(totalAmount) }}</span>
            </div>
            <button class="mobile-checkout-btn" :disabled="!canProceedToCheckout || placingOrder" @click="placeOrder">
              {{ placingOrder ? 'Processing...' : 'Pay Now' }}
            </button>
          </div>
        </template>
      </template>

      <!-- Processing Overlay -->
      <div v-if="placingOrder" class="processing-overlay">
        <div class="processing-content">
          <div class="spinner-lg"></div>
          <p>Processing your order...</p>
        </div>
      </div>

      <!-- Undo Toast -->
      <Transition name="toast">
        <div v-if="showUndoToast" class="undo-toast">
          <div class="toast-content">
            <v-icon name="hi-trash" scale="1" />
            <span><strong>{{ removedItem?.name }}</strong> removed</span>
          </div>
          <button class="undo-btn" @click="undoRemove">
            <v-icon name="hi-reply" scale="0.85" />
            Undo
          </button>
        </div>
      </Transition>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <!-- Address Selection Modal -->
      <div v-if="showAddressModal" class="modal-overlay" @click="showAddressModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Select Delivery Address</h3>
            <button class="close-btn" @click="showAddressModal = false">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="modal-body">
            <div v-if="savedAddresses.length === 0" class="empty-modal">
              <p>No saved addresses</p>
              <button class="add-btn" @click="showAddressModal = false; showAddAddressModal = true">
                <v-icon name="hi-plus" scale="0.9" />
                Add New Address
              </button>
            </div>
            <div v-else class="address-list">
              <div v-for="address in savedAddresses" :key="address._id"
                   :class="['address-option', { selected: selectedDeliveryAddress?._id === address._id }]"
                   @click="selectAddress(address)">
                <div class="radio-dot" :class="{ checked: selectedDeliveryAddress?._id === address._id }"></div>
                <div class="address-info">
                  <div class="label-row">
                    <strong>{{ address.label || 'Address' }}</strong>
                    <span v-if="address.is_default" class="default-tag">Default</span>
                  </div>
                  <p class="recipient">{{ address.recipient_name }}</p>
                  <p class="address-text">{{ formatAddressDisplay(address) }}</p>
                </div>
              </div>
              <button class="add-new-btn" @click="showAddressModal = false; showAddAddressModal = true">
                <v-icon name="hi-plus" scale="0.85" />
                Add New Address
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Address Modal -->
      <div v-if="showAddAddressModal" class="modal-overlay" @click="showAddAddressModal = false">
        <div class="modal-content modal-form" @click.stop>
          <div class="modal-header">
            <h3>Add Delivery Address</h3>
            <button class="close-btn" @click="showAddAddressModal = false">
              <v-icon name="hi-x" scale="1" />
            </button>
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
              <div class="form-group">
                <label>City *</label>
                <input type="text" v-model="newAddressForm.city" placeholder="City" />
              </div>
              <div class="form-group">
                <label>State *</label>
                <input type="text" v-model="newAddressForm.state" placeholder="State" />
              </div>
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

      <!-- Prescription Modal -->
      <div v-if="showPrescriptionModal" class="modal-overlay" @click="showPrescriptionModal = false">
        <div class="modal-content modal-lg" @click.stop>
          <div class="modal-header">
            <h3>Select Prescription</h3>
            <button class="close-btn" @click="showPrescriptionModal = false">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="prescription-tabs">
            <button :class="['tab', { active: prescriptionTabType === 'uploaded' }]"
                    @click="prescriptionTabType = 'uploaded'">
              <v-icon name="hi-document" scale="0.9" />
              Uploaded
            </button>
            <button :class="['tab', { active: prescriptionTabType === 'specialist' }]"
                    @click="prescriptionTabType = 'specialist'">
              <v-icon name="hi-user-circle" scale="0.9" />
              From Specialist
            </button>
          </div>
          <div class="modal-body">
            <div v-if="prescriptionsLoading" class="loading-inline">
              <div class="spinner-sm"></div>
              <span>Loading prescriptions...</span>
            </div>
            <template v-else-if="prescriptionTabType === 'uploaded'">
              <div v-if="approvedPrescriptions.length === 0" class="empty-modal">
                <p>No approved prescriptions found</p>
                <button class="add-btn" @click="$router.push('/app/patient/pharmacy/upload-prescription?returnTo=/app/patient/pharmacy/cart')">
                  Upload Prescription
                </button>
              </div>
              <div v-else class="prescription-list">
                <div v-for="rx in approvedPrescriptions" :key="rx._id"
                     :class="['prescription-option', { selected: selectedPrescription?._id === rx._id }]"
                     @click="selectPrescriptionOption(rx, 'uploaded')">
                  <div class="radio-dot" :class="{ checked: selectedPrescription?._id === rx._id }"></div>
                  <div class="rx-info">
                    <strong v-if="rx.ocr_data?.doctor_name">Dr. {{ rx.ocr_data.doctor_name }}</strong>
                    <span v-if="rx.ocr_data?.clinic_name">{{ rx.ocr_data.clinic_name }}</span>
                    <span class="rx-date">{{ formatDate(rx.created_at) }}</span>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div v-if="specialistPrescriptions.length === 0" class="empty-modal">
                <p>No specialist prescriptions found</p>
                <p class="hint">Prescriptions from your doctor will appear here</p>
              </div>
              <div v-else class="prescription-list">
                <div v-for="rx in specialistPrescriptions" :key="rx._id"
                     :class="['prescription-option', { selected: isSpecialistPrescriptionSelected(rx) }]"
                     @click="toggleSpecialistPrescription(rx)">
                  <div class="checkbox-square" :class="{ checked: isSpecialistPrescriptionSelected(rx) }">
                    <v-icon v-if="isSpecialistPrescriptionSelected(rx)" name="hi-check" scale="0.75" />
                  </div>
                  <div class="rx-info">
                    <strong v-if="rx.specialist?.full_name">{{ rx.specialist.full_name }}</strong>
                    <span>{{ rx.prescription_number }}</span>
                    <span class="rx-date">{{ formatDate(rx.created_at) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" @click="showPrescriptionModal = false">Cancel</button>
            <button class="save-btn" @click="confirmPrescription" :disabled="confirmingPrescription">
              {{ confirmingPrescription ? 'Verifying...' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Pickup Modal -->
      <div v-if="showPickupModal" class="modal-overlay" @click="showPickupModal = false">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>Select Pickup Location</h3>
            <button class="close-btn" @click="showPickupModal = false">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="modal-body">
            <div v-if="pickupCentersLoading" class="loading-inline">
              <div class="spinner-sm"></div>
              <span>Loading...</span>
            </div>
            <div v-else class="pickup-list">
              <div v-for="center in pickupCenters" :key="center._id"
                   :class="['pickup-option', { selected: selectedPickupCenter?._id === center._id }]"
                   @click="selectPickupCenter(center)">
                <div class="radio-dot" :class="{ checked: selectedPickupCenter?._id === center._id }"></div>
                <div class="pickup-info">
                  <strong>{{ center.name }}</strong>
                  <span>{{ formatPickupAddress(center) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wallet Confirmation Modal -->
      <div v-if="showWalletConfirmModal" class="modal-overlay wallet-confirm-overlay" @click.self="closeWalletConfirmModal">
        <div class="modal-content wallet-confirm-modal" @click.stop>
          <div class="modal-header">
            <div class="modal-title-icon">
              <v-icon name="bi-wallet2" scale="1.1" />
              <h3>Confirm Wallet Payment</h3>
            </div>
            <button class="close-btn" @click="closeWalletConfirmModal">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="modal-body wallet-confirm-body">
            <div class="wallet-summary">
              <div class="summary-icon">
                <v-icon name="bi-wallet2" scale="2.5" />
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
                <span class="detail-value">- {{ formatPrice(totalAmount) }}</span>
              </div>
              <div class="detail-divider"></div>
              <div class="detail-row remaining">
                <span class="detail-label">Remaining Balance</span>
                <span class="detail-value">{{ formatPrice(walletBalance - totalAmount) }}</span>
              </div>
            </div>

            <div class="wallet-notice">
              <v-icon name="hi-information-circle" scale="0.9" />
              <span>This amount will be immediately debited from your wallet.</span>
            </div>
          </div>
          <div class="modal-footer wallet-confirm-footer">
            <button class="cancel-btn" @click="closeWalletConfirmModal" :disabled="placingOrder">Cancel</button>
            <button class="confirm-wallet-btn" @click="confirmWalletPayment" :disabled="placingOrder">
              <v-icon v-if="placingOrder" name="hi-refresh" scale="0.9" class="spin" />
              <v-icon v-else name="hi-check" scale="0.9" />
              {{ placingOrder ? 'Processing...' : 'Confirm Payment' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
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

    // Wallet confirmation modal state
    const showWalletConfirmModal = ref(false);
    const pendingOrderData = ref(null); // Store order data when showing wallet confirm modal

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
      "pharmacy/processCardPayment": processCardPayment,
      "pharmacy/processSplitPayment": processSplitPayment,
      "pharmacy/initializePaystackPayment": initializePaystackPaymentAction,
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

      // If wallet payment selected, show confirmation modal FIRST before creating order
      if (paymentMethod.value === "wallet" && amountToPay.value === 0) {
        showWalletConfirmModal.value = true;
        return;
      }

      // For card/split payments, proceed with order creation
      await createAndProcessOrder();
    };

    // Actual order creation and payment processing
    const createAndProcessOrder = async () => {
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
        // Full wallet payment - process directly (modal was already shown before order creation)
        try {
          await payWithWallet({ orderId, amount: totalAmount.value });
          orderSuccess(orderId);
        } catch (error) {
          console.error("Wallet payment failed:", error);
          const errorMsg = error?.response?.data?.message || "Wallet payment failed. Please try another payment method.";
          alert(errorMsg);
          // Redirect to order page so user can retry payment
          router.push(`/app/patient/pharmacy/orders/${orderId}?status=pending`);
        }
      } else if (paymentMethod.value === "split") {
        // Split payment - card payment first, then wallet is deducted on backend
        initializePaystackPayment(orderId, amountToPay.value, true);
      } else {
        // Full card payment
        initializePaystackPayment(orderId, amountToPay.value, false);
      }
    };

    // Close wallet confirmation modal
    const closeWalletConfirmModal = () => {
      showWalletConfirmModal.value = false;
    };

    // Confirm wallet payment after user consent - creates order then processes payment
    const confirmWalletPayment = async () => {
      if (placingOrder.value) return;

      // Close the modal first
      showWalletConfirmModal.value = false;

      // Now create the order and process wallet payment
      await createAndProcessOrder();
    };

    // Redirect-based Paystack payment (like appointments v2)
    const initializePaystackPayment = async (orderId, amount, isSplitPayment = false) => {
      try {
        // For split payments, we need to store the wallet amount for processing on return
        if (isSplitPayment) {
          localStorage.setItem('pending_pharmacy_split_payment', JSON.stringify({
            orderId,
            walletAmount: walletPaymentAmount.value,
            cardAmount: amount,
          }));
        }

        // Call backend to initialize Paystack payment
        const result = await initializePaystackPaymentAction(orderId);

        if (result?.authorization_url) {
          // Store order data for verification on return
          localStorage.setItem('pending_pharmacy_order_id', orderId);
          localStorage.setItem('pending_pharmacy_payment_reference', result.payment_reference || '');
          localStorage.setItem('pending_pharmacy_is_split', isSplitPayment ? 'true' : 'false');

          // Clear cart before redirecting (order is already created)
          clearCart();
          clearCheckoutState();

          // Redirect to Paystack payment page
          window.location.href = result.authorization_url;
        } else {
          throw new Error('No authorization URL received');
        }
      } catch (error) {
        console.error("Payment initialization failed:", error);
        // Order is created but payment init failed - redirect to order page to retry
        router.push(`/app/patient/pharmacy/orders/${orderId}?status=pending`);
      }
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
      // Wallet confirmation modal
      showWalletConfirmModal,
      closeWalletConfirmModal,
      confirmWalletPayment,
    };
  },
};
</script>

<style scoped lang="scss">
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.cart-page {
  width: 100%;
  min-height: 100vh;
  background: $bg;
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 12px 16px;
  background: white;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) {
    display: flex;
  }

  .back-btn, .cart-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: $bg;
    color: $slate;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;

    &:active {
      background: #E2E8F0;
    }
  }

  .cart-count {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    background: $rose;
    color: white;
    font-size: 10px;
    font-weight: 700;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .header-logo img {
    height: 28px;
    width: auto;
  }
}

// Page Content
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 180px;
  }
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;

  .loading-spinner {
    position: relative;
    width: 64px;
    height: 64px;

    .spinner-ring {
      position: absolute;
      inset: 0;
      border: 3px solid $sky-light;
      border-top-color: $sky;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: $sky;
    }
  }

  p {
    color: $gray;
    font-size: 14px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Breadcrumbs
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    display: none;
  }

  .breadcrumb-item {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: $gray;
    text-decoration: none;
    transition: color 0.2s;

    &:hover:not(.current) {
      color: $sky-dark;
    }

    &.current {
      color: $slate;
      font-weight: 500;
    }
  }

  .breadcrumb-sep {
    color: #CBD5E1;
    font-size: 12px;
  }
}

// Empty State
.empty-state-card {
  @include glass-card;
  border-radius: 24px;
  padding: 64px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;

  .empty-orb {
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: 24px;

    .orb-ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid transparent;

      &--1 {
        inset: -8px;
        border-top-color: rgba($sky, 0.3);
        animation: spin 8s linear infinite;
      }

      &--2 {
        inset: -16px;
        border-right-color: rgba($sky, 0.2);
        animation: spin 12s linear infinite reverse;
      }
    }

    .orb-core {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $sky-dark;
    }
  }

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: $navy;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: $gray;
    margin: 0 0 24px;
    max-width: 320px;
  }

  .empty-actions {
    margin-bottom: 32px;
  }

  .primary-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba($sky-dark, 0.3);
    }
  }

  .trust-row {
    display: flex;
    gap: 24px;
    padding-top: 24px;
    border-top: 1px solid #E2E8F0;

    @media (max-width: 480px) {
      flex-direction: column;
      gap: 12px;
    }

    .trust-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: $gray;

      svg {
        color: $sky-dark;
      }
    }
  }
}

// Bento Grid
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(6, 1fr);
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  overflow: hidden;

  @media (max-width: 768px) {
    border-radius: 16px;
  }
}

// Card Header
.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) {
    padding: 16px;
  }

  .header-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.sky {
      background: $sky-light;
      color: $sky-dark;
    }

    &.emerald {
      background: $emerald-light;
      color: $emerald;
    }

    &.violet {
      background: $violet-light;
      color: $violet;
    }

    &.amber {
      background: $amber-light;
      color: $amber;
    }

    &.rose {
      background: $rose-light;
      color: $rose;
    }
  }

  h3 {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: $navy;
    margin: 0;
  }

  .item-count, .required-tag {
    font-size: 12px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 20px;
  }

  .item-count {
    background: $bg;
    color: $gray;
  }

  .required-tag {
    background: $amber-light;
    color: $amber;
  }
}

// Summary Hero Card
.summary-hero-card {
  grid-column: span 12;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }
}

.summary-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  color: white;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
    padding: 24px 20px;
    text-align: center;
  }

  .hero-content {
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      margin-bottom: 12px;
      position: relative;

      .badge-pulse {
        position: absolute;
        left: 10px;
        width: 6px;
        height: 6px;
        background: $emerald;
        border-radius: 50%;
        animation: pulse 2s ease-in-out infinite;
      }

      svg {
        margin-left: 10px;
        width: 14px;
        height: 14px;
      }

      span {
        font-size: 12px;
        font-weight: 600;
      }
    }

    .hero-title {
      font-size: 32px;
      font-weight: 800;
      margin: 0 0 4px;
      letter-spacing: -0.5px;

      @media (max-width: 768px) {
        font-size: 24px;
      }
    }

    .hero-subtitle {
      font-size: 14px;
      opacity: 0.9;
      margin: 0;
    }
  }

  .hero-stats {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 16px 24px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;

    @media (max-width: 768px) {
      width: 100%;
      justify-content: center;
    }

    .stat-item {
      text-align: center;

      .stat-value {
        display: block;
        font-size: 20px;
        font-weight: 700;

        &.free {
          color: $emerald-light;
        }
      }

      .stat-label {
        font-size: 12px;
        opacity: 0.8;
      }
    }

    .stat-divider {
      width: 1px;
      height: 32px;
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.delivery-progress {
  padding: 16px 32px 24px;
  background: rgba($sky-light, 0.5);

  @media (max-width: 768px) {
    padding: 16px 20px 20px;
  }

  .progress-text {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: $slate;
    margin-bottom: 10px;

    svg {
      color: $sky-dark;
    }

    strong {
      color: $sky-dark;
    }
  }

  .progress-bar {
    height: 6px;
    background: rgba($sky-dark, 0.15);
    border-radius: 3px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, $sky 0%, $sky-dark 100%);
      border-radius: 3px;
      transition: width 0.3s ease;
    }
  }
}

.free-delivery-achieved {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  background: $emerald-light;
  color: $emerald;
  font-size: 14px;
  font-weight: 600;
}

// Alert Card
.alert-card {
  grid-column: span 12;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }

  &.danger {
    background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
    border-color: #FECACA;
  }

  .alert-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;

    .alert-icon {
      width: 40px;
      height: 40px;
      background: rgba($rose, 0.1);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $rose;
    }

    .alert-content {
      flex: 1;

      h3 {
        font-size: 15px;
        font-weight: 600;
        color: #B91C1C;
        margin: 0 0 2px;
      }

      p {
        font-size: 13px;
        color: #991B1B;
        margin: 0;
      }
    }

    .alert-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: white;
      border: 1px solid #FCA5A5;
      border-radius: 8px;
      font-size: 12px;
      color: #B91C1C;
      cursor: pointer;
    }
  }

  .alert-details {
    padding: 16px 20px;
    border-top: 1px solid #FECACA;

    .interaction-item {
      padding: 12px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 10px;
      margin-bottom: 10px;

      &.high {
        border-left: 4px solid #DC2626;
      }

      &.moderate {
        border-left: 4px solid $amber;
      }

      &.low {
        border-left: 4px solid #3B82F6;
      }

      .severity-tag {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 8px;
        background: #FEF2F2;
        color: #DC2626;
      }

      .interaction-drugs {
        font-size: 14px;
        margin-bottom: 4px;

        .plus {
          color: $gray;
          margin: 0 6px;
        }
      }

      .interaction-desc {
        font-size: 13px;
        color: $gray;
        margin: 0;
        line-height: 1.5;
      }
    }

    .interaction-disclaimer {
      display: flex;
      gap: 8px;
      padding: 12px;
      background: white;
      border-radius: 8px;
      margin-top: 8px;

      svg {
        color: $gray;
        flex-shrink: 0;
      }

      p {
        font-size: 12px;
        color: $gray;
        margin: 0;
        line-height: 1.5;
      }
    }
  }
}

// Slide transition
.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from, .slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-enter-to, .slide-leave-from {
  opacity: 1;
  max-height: 1000px;
}

// Items Card
.items-card {
  grid-column: span 8;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }
}

.items-section {
  padding: 20px 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #F1F5F9;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 16px;

    &.otc {
      background: $emerald-light;
      color: $emerald;
    }

    &.rx {
      background: $rose-light;
      color: $rose;
    }
  }
}

.cart-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  display: grid;
  grid-template-columns: 72px 1fr auto auto auto;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: $bg;
  border-radius: 14px;
  transition: background 0.2s;

  &:hover {
    background: #F1F5F9;
  }

  @media (max-width: 768px) {
    grid-template-columns: 56px 1fr;
    gap: 12px;
    padding: 12px;
  }

  .item-image {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 12px;
    overflow: hidden;
    background: white;

    @media (max-width: 768px) {
      width: 56px;
      height: 56px;
    }

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
      color: $light-gray;
    }

    .rx-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: $sky-dark;
      color: white;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 5px;
      border-radius: 4px;
    }
  }

  .item-details {
    min-width: 0;

    @media (max-width: 768px) {
      grid-column: span 1;
    }

    .item-name {
      font-size: 14px;
      font-weight: 600;
      color: $navy;
      margin: 0 0 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-meta {
      font-size: 12px;
      color: $gray;
      margin: 0 0 2px;
    }

    .item-manufacturer {
      font-size: 11px;
      color: $light-gray;
      margin: 0 0 6px;
    }

    .item-stock {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 500;

      .stock-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      &.in-stock {
        color: $emerald;
        .stock-dot { background: $emerald; }
      }

      &.low-stock {
        color: $amber;
        .stock-dot { background: $amber; }
      }

      &.out-of-stock {
        color: $rose;
        .stock-dot { background: $rose; }
      }
    }
  }

  .item-quantity {
    display: flex;
    align-items: center;
    gap: 4px;
    background: white;
    border-radius: 10px;
    padding: 4px;

    @media (max-width: 768px) {
      grid-column: 1;
      grid-row: 2;
      justify-self: start;
    }

    .qty-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #E2E8F0;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $slate;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: $sky-dark;
        border-color: $sky-dark;
        color: white;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .qty-value {
      min-width: 32px;
      text-align: center;
      font-size: 14px;
      font-weight: 600;
      color: $navy;
    }
  }

  .item-price {
    text-align: right;
    min-width: 100px;

    @media (max-width: 768px) {
      grid-column: 2;
      grid-row: 2;
      justify-self: end;
    }

    .price-total {
      display: block;
      font-size: 15px;
      font-weight: 700;
      color: $navy;
    }

    .price-each {
      font-size: 11px;
      color: $light-gray;
    }
  }

  .item-actions {
    display: flex;
    gap: 6px;

    @media (max-width: 768px) {
      position: absolute;
      right: 12px;
      top: 12px;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;

      &.save {
        background: #FDF2F8;
        color: #EC4899;

        &:hover {
          background: #FCE7F3;
        }
      }

      &.remove {
        background: #FEF2F2;
        color: $rose;

        &:hover {
          background: #FEE2E2;
        }
      }
    }
  }
}

// Delivery Card
.delivery-card {
  grid-column: span 4;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }
}

.delivery-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.delivery-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: $bg;
  border: 2px solid transparent;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F1F5F9;
  }

  &.active {
    background: rgba($sky-dark, 0.05);
    border-color: $sky-dark;

    .option-icon {
      background: $sky-dark;
      color: white;
    }
  }

  .option-icon {
    width: 44px;
    height: 44px;
    background: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $gray;
    transition: all 0.2s;
  }

  .option-info {
    flex: 1;

    strong {
      display: block;
      font-size: 14px;
      color: $navy;
    }

    span {
      font-size: 12px;
      color: $gray;
    }
  }

  .option-check {
    width: 24px;
    height: 24px;
    background: $sky-dark;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
}

.address-section, .pickup-section {
  padding: 0 24px 20px;

  @media (max-width: 768px) {
    padding: 0 16px 16px;
  }
}

.selected-address, .selected-pickup {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba($sky-dark, 0.05);
  border: 2px solid $sky-dark;
  border-radius: 14px;

  .address-icon, .pickup-icon {
    width: 40px;
    height: 40px;
    background: $sky-dark;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .address-info, .pickup-info {
    flex: 1;
    min-width: 0;

    .address-label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      strong {
        font-size: 14px;
        color: $sky-dark;
      }

      .default-tag {
        font-size: 10px;
        font-weight: 600;
        padding: 2px 6px;
        background: $sky-dark;
        color: white;
        border-radius: 4px;
      }
    }

    .address-recipient, .address-text, p {
      font-size: 13px;
      color: $slate;
      margin: 0 0 2px;
    }
  }

  .change-btn {
    padding: 8px 14px;
    background: white;
    border: 1px solid $sky-dark;
    border-radius: 8px;
    color: $sky-dark;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
  }
}

.delivery-estimate {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: $sky-light;
  border-radius: 10px;
  font-size: 13px;
  color: $sky-darker;

  strong {
    color: $sky-dark;
  }
}

.no-address {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: $bg;
  border: 2px dashed #CBD5E1;
  border-radius: 14px;
  text-align: center;

  svg {
    color: $light-gray;
    margin-bottom: 8px;
  }

  p {
    font-size: 13px;
    color: $gray;
    margin: 0 0 12px;
  }

  .add-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    background: $sky-dark;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }
}

.loading-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: $gray;
  font-size: 13px;

  .spinner-sm {
    width: 18px;
    height: 18px;
    border: 2px solid #E2E8F0;
    border-top-color: $sky-dark;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

// Prescription Card
.prescription-card {
  grid-column: span 4;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }
}

.prescription-required {
  padding: 20px 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }

  .rx-alert {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: $amber-light;
    border-radius: 12px;
    margin-bottom: 16px;

    svg {
      color: $amber;
      flex-shrink: 0;
    }

    .alert-text {
      strong {
        display: block;
        font-size: 14px;
        color: #92400E;
        margin-bottom: 2px;
      }

      p {
        font-size: 13px;
        color: #B45309;
        margin: 0;
      }
    }
  }

  .prescription-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .action-primary, .action-secondary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .action-primary {
      background: $sky-dark;
      color: white;
      border: none;
    }

    .action-secondary {
      background: white;
      color: $sky-dark;
      border: 1px solid $sky-dark;
    }
  }
}

.prescription-selected {
  padding: 20px 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }

  .rx-success {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: $emerald-light;
    border-radius: 12px;
    margin-bottom: 12px;

    svg {
      color: $emerald;
      flex-shrink: 0;
    }

    .success-info {
      flex: 1;

      strong {
        display: block;
        font-size: 14px;
        color: #065F46;
        margin-bottom: 2px;
      }

      p {
        font-size: 13px;
        color: #047857;
        margin: 0;
      }

      .rx-date {
        font-size: 12px;
        color: #059669;
      }
    }

    .change-btn {
      padding: 6px 12px;
      background: white;
      border: 1px solid $emerald;
      border-radius: 6px;
      color: $emerald;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }
  }

  .coverage-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;

    &.success {
      background: $emerald-light;
      color: $emerald;
    }

    &.warning {
      background: $amber-light;
      color: $amber;
    }
  }
}

// Order Summary Card
.order-card {
  grid-column: span 4;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }
}

.promo-section {
  padding: 16px 24px;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) {
    padding: 12px 16px;
  }

  .promo-input-row {
    display: flex;
    gap: 8px;

    input {
      flex: 1;
      padding: 12px 14px;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      font-size: 14px;
      text-transform: uppercase;

      &:focus {
        outline: none;
        border-color: $sky-dark;
      }
    }

    .apply-btn {
      padding: 12px 18px;
      background: $sky-dark;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
      }
    }
  }

  .promo-applied {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: $emerald-light;
    border-radius: 10px;

    .promo-info {
      display: flex;
      align-items: center;
      gap: 8px;

      svg {
        color: $emerald;
      }

      .promo-code {
        font-weight: 700;
        color: $emerald;
      }

      .promo-discount {
        color: #059669;
      }
    }

    .remove-promo {
      width: 28px;
      height: 28px;
      background: rgba($emerald, 0.2);
      border: none;
      border-radius: 6px;
      color: $emerald;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .promo-error {
    margin-top: 8px;
    font-size: 12px;
    color: $rose;
  }
}

.price-breakdown {
  padding: 20px 24px;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) {
    padding: 16px;
  }

  .price-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;
    color: $slate;

    &.discount span:last-child {
      color: $emerald;
      font-weight: 600;
    }

    .free-text {
      color: $emerald;
      font-weight: 600;
    }

    &.total {
      padding-top: 16px;
      margin-top: 8px;
      border-top: 2px solid #E2E8F0;
      font-size: 18px;
      font-weight: 700;
      color: $navy;

      span:last-child {
        color: $sky-dark;
      }
    }
  }
}

.payment-section {
  padding: 20px 24px;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) {
    padding: 16px;
  }

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 12px;
  }

  .payment-options {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .payment-option {
    display: flex;
    align-items: center;
    padding: 14px;
    background: $bg;
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;

    input {
      display: none;
    }

    &.selected {
      background: rgba($sky-dark, 0.05);
      border-color: $sky-dark;
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 12px;

      svg {
        color: $sky-dark;
      }

      .option-text {
        strong {
          display: block;
          font-size: 14px;
          color: $navy;
        }

        span {
          font-size: 12px;
          color: $gray;
        }
      }
    }
  }
}

.checkout-section {
  padding: 20px 24px;

  @media (max-width: 768px) {
    padding: 16px;
  }

  .blockers {
    margin-bottom: 12px;

    .blocker-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: $amber-light;
      border-radius: 8px;
      margin-bottom: 8px;
      font-size: 12px;
      color: #92400E;
    }
  }

  .checkout-btn {
    width: 100%;
    padding: 16px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;
    border: none;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba($sky-dark, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
  }
}

.trust-badges {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 16px 24px;
  border-top: 1px solid #F1F5F9;

  .badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: $gray;

    svg {
      color: $sky-dark;
    }
  }
}

// Saved Card
.saved-card {
  grid-column: span 12;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }
}

.saved-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  padding: 20px 24px;

  @media (max-width: 768px) {
    padding: 16px;
    grid-template-columns: 1fr;
  }
}

.saved-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: $bg;
  border-radius: 12px;

  .saved-image {
    width: 56px;
    height: 56px;
    border-radius: 10px;
    overflow: hidden;
    background: white;

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
      color: $light-gray;
    }
  }

  .saved-info {
    flex: 1;
    min-width: 0;

    h4 {
      font-size: 13px;
      font-weight: 600;
      color: $navy;
      margin: 0 0 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    p {
      font-size: 11px;
      color: $gray;
      margin: 0;
    }

    .saved-price {
      font-size: 14px;
      font-weight: 700;
      color: $sky-dark;
    }
  }

  .saved-actions {
    display: flex;
    gap: 6px;

    .move-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: $sky-dark;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }

    .remove-btn {
      width: 32px;
      height: 32px;
      background: #FEF2F2;
      border: none;
      border-radius: 8px;
      color: $rose;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}

// Mobile Checkout Bar
.mobile-checkout-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #E2E8F0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  z-index: 90;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .mobile-total {
    .label {
      display: block;
      font-size: 12px;
      color: $gray;
    }

    .amount {
      font-size: 20px;
      font-weight: 700;
      color: $navy;
    }
  }

  .mobile-checkout-btn {
    flex: 1;
    max-width: 200px;
    padding: 14px 20px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
    }
  }
}

// Processing Overlay
.processing-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;

  .processing-content {
    background: white;
    padding: 40px;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

    .spinner-lg {
      width: 48px;
      height: 48px;
      border: 3px solid $sky-light;
      border-top-color: $sky-dark;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    p {
      font-size: 15px;
      color: $slate;
      margin: 0;
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
  gap: 16px;
  padding: 14px 20px;
  background: $navy;
  color: white;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  z-index: 1000;

  @media (max-width: 768px) {
    bottom: 140px;
    left: 16px;
    right: 16px;
    transform: none;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
  }

  .undo-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: $sky-dark;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);

  @media (max-width: 768px) {
    transform: translateY(20px);
  }
}

// Modals
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.modal-form {
    max-width: 520px;
  }

  &.modal-lg {
    max-width: 600px;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #F1F5F9;

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    margin: 0;
  }

  .close-btn {
    width: 36px;
    height: 36px;
    background: $bg;
    border: none;
    border-radius: 10px;
    color: $gray;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #F1F5F9;

  .cancel-btn {
    flex: 1;
    padding: 12px 20px;
    background: $bg;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    color: $slate;
    cursor: pointer;
  }

  .save-btn {
    flex: 1;
    padding: 12px 20px;
    background: $sky-dark;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    cursor: pointer;

    &:disabled {
      opacity: 0.5;
    }
  }
}

// Modal Form
.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: $slate;
    margin-bottom: 6px;
  }

  input, textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    font-size: 14px;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: $sky-dark;
    }
  }

  textarea {
    resize: vertical;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: $slate;
  cursor: pointer;

  input {
    width: 18px;
    height: 18px;
  }
}

// Address List
.address-list, .prescription-list, .pickup-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.address-option, .prescription-option, .pickup-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: $bg;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F1F5F9;
  }

  &.selected {
    background: rgba($sky-dark, 0.05);
    border-color: $sky-dark;
  }
}

.radio-dot {
  width: 20px;
  height: 20px;
  border: 2px solid #CBD5E1;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 2px;
  position: relative;
  transition: all 0.2s;

  &.checked {
    border-color: $sky-dark;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      background: $sky-dark;
      border-radius: 50%;
    }
  }
}

.checkbox-square {
  width: 20px;
  height: 20px;
  border: 2px solid #CBD5E1;
  border-radius: 6px;
  flex-shrink: 0;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &.checked {
    background: $sky-dark;
    border-color: $sky-dark;
    color: white;
  }
}

.address-info, .rx-info, .pickup-info {
  flex: 1;
  min-width: 0;

  .label-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    .default-tag {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      background: $sky-dark;
      color: white;
      border-radius: 4px;
    }
  }

  strong {
    font-size: 14px;
    color: $navy;
  }

  .recipient, .address-text, span {
    display: block;
    font-size: 13px;
    color: $gray;
    margin-top: 2px;
  }

  .rx-date {
    color: $light-gray;
    font-size: 12px;
  }
}

.add-new-btn, .add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: transparent;
  border: 2px dashed #CBD5E1;
  border-radius: 12px;
  color: $sky-dark;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;

  &:hover {
    border-color: $sky-dark;
    background: rgba($sky-dark, 0.05);
  }
}

.empty-modal {
  text-align: center;
  padding: 32px 16px;

  p {
    font-size: 14px;
    color: $gray;
    margin: 0 0 16px;

    &.hint {
      font-size: 12px;
      color: $light-gray;
    }
  }
}

.prescription-tabs {
  display: flex;
  border-bottom: 1px solid #F1F5F9;

  .tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 14px;
    font-weight: 500;
    color: $gray;
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      color: $sky-dark;
      border-bottom-color: $sky-dark;
    }
  }
}

// Pulse animation
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

// Wallet Confirmation Modal Styles
.wallet-confirm-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.wallet-confirm-modal {
  max-width: 420px;
  border-radius: 24px;
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
    .modal-title-icon {
      display: flex;
      align-items: center;
      gap: 10px;
      color: $sky-dark;

      h3 {
        font-size: 18px;
        font-weight: 700;
        color: $navy;
        margin: 0;
      }
    }
  }

  .wallet-confirm-body {
    padding: 24px;
  }

  .wallet-summary {
    text-align: center;
    margin-bottom: 24px;

    .summary-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, $emerald-light 0%, #A7F3D0 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      color: $emerald;
    }

    .summary-text {
      color: $gray;
      font-size: 15px;
      margin: 0;
    }
  }

  .wallet-details {
    background: $bg;
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
        color: $gray;
      }

      .detail-value {
        font-size: 16px;
        font-weight: 600;
        color: $navy;

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
          color: $navy;
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

  .wallet-confirm-footer {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #F1F5F9;

    .cancel-btn {
      flex: 1;
      padding: 14px 20px;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      background: white;
      color: $gray;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: $bg;
        border-color: #CBD5E1;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .confirm-wallet-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, $emerald 0%, #059669 100%);
      color: white;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .spin {
        animation: spin 1s linear infinite;
      }
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
