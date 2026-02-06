<template>
  <div class="drug-details-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="back-btn" @click="$router.back()">
        <v-icon name="hi-arrow-left" scale="1.1" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="cart-btn" @click="goToCart">
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
          <v-icon name="ri-capsule-line" scale="1.2" class="spinner-icon" />
        </div>
        <p>Loading medication details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="!drug" class="error-state">
        <div class="error-icon">
          <v-icon name="hi-exclamation-circle" scale="2.5" />
        </div>
        <h3>Medication Not Found</h3>
        <p>This medication doesn't exist or has been removed.</p>
        <button class="back-pharmacy-btn" @click="$router.push('/app/patient/pharmacy')">
          <v-icon name="hi-arrow-left" scale="0.9" />
          Back to Pharmacy
        </button>
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
          <span class="breadcrumb-item current">{{ drug.name }}</span>
        </nav>

        <!-- Bento Grid -->
        <section class="bento-grid">
          <!-- Product Hero Card -->
          <div class="bento-card product-hero-card">
            <div class="product-layout">
              <!-- Image Section -->
              <div class="product-image-section">
                <div class="image-container" @click="openImageZoom">
                  <img
                    v-if="drug.image_url || drug.primary_image"
                    :src="drug.image_url || drug.primary_image"
                    :alt="drug.name"
                  />
                  <div v-else class="image-placeholder">
                    <v-icon name="ri-capsule-line" scale="3" />
                  </div>
                  <span class="rx-badge" v-if="drug.requires_prescription">Rx</span>
                  <button class="zoom-hint" v-if="drug.image_url || drug.primary_image">
                    <v-icon name="hi-zoom-in" scale="0.9" />
                  </button>
                </div>
              </div>

              <!-- Info Section -->
              <div class="product-info-section">
                <div class="product-header">
                  <h1 class="product-name">{{ drug.name }}</h1>
                  <p class="generic-name" v-if="drug.generic_name">{{ drug.generic_name }}</p>

                  <div class="product-meta">
                    <span v-if="drug.strength" class="meta-pill">{{ drug.strength }}</span>
                    <span v-if="drug.dosage_form" class="meta-pill">{{ drug.dosage_form }}</span>
                    <span v-if="drug.pack_size" class="meta-pill">{{ drug.pack_size }} {{ drug.unit_of_measure || 'units' }}</span>
                  </div>

                  <p class="manufacturer" v-if="currentManufacturer">
                    by <strong>{{ currentManufacturer }}</strong>
                  </p>
                </div>

                <!-- Price Block -->
                <div class="price-block">
                  <div class="price-row">
                    <span class="current-price">{{ formatPrice(currentPrice) }}</span>
                    <span class="original-price" v-if="showOriginalPrice">{{ formatPrice(drug.original_price) }}</span>
                  </div>
                  <div class="stock-badge" :class="getStockClass">
                    <span class="dot"></span>
                    {{ stockText }}
                  </div>
                </div>

                <!-- Batch Selection -->
                <div class="batch-selector" v-if="drug.batches && drug.batches.length > 1">
                  <label>Select Option</label>
                  <div class="batch-list">
                    <button
                      v-for="batch in drug.batches"
                      :key="batch.batch_id"
                      :class="['batch-item', { selected: selectedBatch?.batch_id === batch.batch_id }]"
                      @click="selectBatch(batch)"
                    >
                      <span class="batch-name">{{ batch.manufacturer || 'Generic' }}</span>
                      <span class="batch-price">{{ formatPrice(batch.price) }}</span>
                    </button>
                  </div>
                </div>

                <!-- Add to Cart Section -->
                <div class="cart-section" v-if="drug.is_available">
                  <div class="quantity-row" v-if="!maxReachedInCart">
                    <div class="quantity-selector">
                      <button class="qty-btn" @click="decrementQuantity" :disabled="quantity <= 1">
                        <v-icon name="hi-minus" scale="0.9" />
                      </button>
                      <span class="qty-display">{{ quantity }}</span>
                      <button class="qty-btn" @click="incrementQuantity" :disabled="quantity >= remainingAddable || quantity >= maxQuantity">
                        <v-icon name="hi-plus" scale="0.9" />
                      </button>
                    </div>
                    <button class="add-cart-btn" @click="addToCart" :disabled="remainingAddable <= 0">
                      <v-icon name="hi-shopping-cart" scale="1" />
                      Add to Cart
                    </button>
                  </div>
                  <div class="cart-limit-notice" v-if="cartLimitMessage">
                    <v-icon name="hi-information-circle" scale="0.9" />
                    <span>{{ cartLimitMessage }}</span>
                  </div>
                  <button class="go-cart-btn" v-if="maxReachedInCart" @click="goToCart">
                    <v-icon name="hi-shopping-cart" scale="1" />
                    View Cart
                  </button>
                  <p class="max-qty-hint" v-if="maxQuantityText && !cartLimitMessage">{{ maxQuantityText }}</p>
                </div>

                <!-- Out of Stock -->
                <div class="out-of-stock-section" v-else>
                  <p class="oos-text">This item is currently out of stock</p>
                  <button class="notify-btn" @click="notifyWhenAvailable">
                    <v-icon name="hi-bell" scale="0.9" />
                    Notify Me When Available
                  </button>
                </div>

                <!-- Prescription Notice -->
                <div class="rx-notice" v-if="drug.requires_prescription">
                  <v-icon name="hi-exclamation" scale="0.9" />
                  <span>A valid prescription is required for this medication</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Info Cards -->
          <div class="bento-card info-card" v-if="drug.route">
            <div class="info-icon sky">
              <v-icon name="hi-cursor-click" scale="1.1" />
            </div>
            <div class="info-content">
              <span class="info-label">Administration</span>
              <span class="info-value">{{ drug.route }}<span v-if="drug.route_abbreviation"> ({{ drug.route_abbreviation }})</span></span>
            </div>
          </div>

          <div class="bento-card info-card" v-if="drug.dosage_form">
            <div class="info-icon violet">
              <v-icon name="ri-capsule-line" scale="1.1" />
            </div>
            <div class="info-content">
              <span class="info-label">Form</span>
              <span class="info-value">{{ drug.dosage_form }}</span>
            </div>
          </div>

          <div class="bento-card info-card" v-if="drug.pack_size">
            <div class="info-icon emerald">
              <v-icon name="hi-cube" scale="1.1" />
            </div>
            <div class="info-content">
              <span class="info-label">Pack Size</span>
              <span class="info-value">{{ drug.pack_size }} {{ drug.unit_of_measure || 'units' }}</span>
            </div>
          </div>

          <div class="bento-card info-card" v-if="currentManufacturer">
            <div class="info-icon amber">
              <v-icon name="hi-office-building" scale="1.1" />
            </div>
            <div class="info-content">
              <span class="info-label">Manufacturer</span>
              <span class="info-value">{{ currentManufacturer }}</span>
            </div>
          </div>

          <!-- Description Card -->
          <div class="bento-card detail-card" v-if="drug.description">
            <div class="card-header">
              <div class="header-icon">
                <v-icon name="hi-document-text" scale="1" />
              </div>
              <h3>Description</h3>
            </div>
            <div class="card-body">
              <p>{{ drug.description }}</p>
            </div>
          </div>

          <!-- Dosage Instructions Card -->
          <div class="bento-card detail-card" v-if="drug.dosage_instructions">
            <div class="card-header">
              <div class="header-icon">
                <v-icon name="hi-clock" scale="1" />
              </div>
              <h3>Dosage & Usage</h3>
            </div>
            <div class="card-body">
              <p>{{ drug.dosage_instructions }}</p>
            </div>
          </div>

          <!-- Storage Card -->
          <div class="bento-card detail-card" v-if="drug.storage_instructions">
            <div class="card-header">
              <div class="header-icon">
                <v-icon name="hi-archive" scale="1" />
              </div>
              <h3>Storage</h3>
            </div>
            <div class="card-body">
              <p>{{ drug.storage_instructions }}</p>
            </div>
          </div>

          <!-- Warnings Card -->
          <div class="bento-card detail-card warning-card" v-if="drug.warnings && drug.warnings.length > 0">
            <div class="card-header">
              <div class="header-icon warning">
                <v-icon name="hi-exclamation-circle" scale="1" />
              </div>
              <h3>Warnings</h3>
            </div>
            <div class="card-body">
              <ul>
                <li v-for="(warning, i) in drug.warnings" :key="i">{{ warning }}</li>
              </ul>
            </div>
          </div>

          <!-- Side Effects Card -->
          <div class="bento-card detail-card" v-if="drug.side_effects && drug.side_effects.length > 0">
            <div class="card-header">
              <div class="header-icon">
                <v-icon name="hi-beaker" scale="1" />
              </div>
              <h3>Possible Side Effects</h3>
            </div>
            <div class="card-body">
              <div class="tags-list">
                <span v-for="(effect, i) in drug.side_effects" :key="i" class="tag">{{ effect }}</span>
              </div>
            </div>
          </div>

          <!-- Contraindications Card -->
          <div class="bento-card detail-card" v-if="drug.contraindications && drug.contraindications.length > 0">
            <div class="card-header">
              <div class="header-icon warning">
                <v-icon name="hi-ban" scale="1" />
              </div>
              <h3>Contraindications</h3>
            </div>
            <div class="card-body">
              <ul>
                <li v-for="(item, i) in drug.contraindications" :key="i">{{ item }}</li>
              </ul>
            </div>
          </div>

          <!-- Categories Card -->
          <div class="bento-card detail-card" v-if="drug.category_names && drug.category_names.length > 0">
            <div class="card-header">
              <div class="header-icon">
                <v-icon name="hi-tag" scale="1" />
              </div>
              <h3>Categories</h3>
            </div>
            <div class="card-body">
              <div class="tags-list">
                <span v-for="cat in drug.category_names" :key="cat" class="tag category">{{ cat }}</span>
              </div>
            </div>
          </div>

          <!-- Safety Information Card -->
          <div class="bento-card safety-card" v-if="safetyInfoFetched || safetyInfoLoading">
            <div class="card-header clickable" @click="toggleSafetyAccordion">
              <div class="header-icon safety">
                <v-icon name="hi-shield-check" scale="1" />
              </div>
              <h3>Safety Information</h3>
              <span class="source-badge" v-if="safetyInfo?.source">{{ safetyInfo.source }}</span>
              <v-icon
                :name="safetyAccordionOpen ? 'hi-chevron-up' : 'hi-chevron-down'"
                scale="0.9"
                class="accordion-icon"
                v-if="!safetyInfoLoading"
              />
            </div>

            <!-- Loading State -->
            <div class="safety-loading" v-if="safetyInfoLoading">
              <div class="mini-spinner"></div>
              <span>Loading safety information...</span>
            </div>

            <!-- Accordion Content -->
            <transition name="accordion">
              <div class="safety-content" v-if="safetyAccordionOpen && !safetyInfoLoading">
                <!-- No Safety Data -->
                <div class="no-safety-data" v-if="!hasSafetyData">
                  <v-icon name="hi-information-circle" scale="1.5" />
                  <p>Safety information for this medication is not yet available. Please consult your pharmacist or healthcare provider.</p>
                </div>

                <!-- AI Summary -->
                <template v-else-if="showAISummary">
                  <div class="ai-overview" v-if="safetyInfo.ai_summary.overview">
                    <p>{{ safetyInfo.ai_summary.overview }}</p>
                  </div>

                  <div class="ai-section" v-if="safetyInfo.ai_summary.key_warnings?.length">
                    <h4><v-icon name="hi-exclamation-circle" scale="0.85" /> Key Warnings</h4>
                    <ul>
                      <li v-for="(warning, i) in safetyInfo.ai_summary.key_warnings" :key="i">{{ warning }}</li>
                    </ul>
                  </div>

                  <div class="ai-section" v-if="safetyInfo.ai_summary.common_side_effects?.length">
                    <h4><v-icon name="hi-beaker" scale="0.85" /> Common Side Effects</h4>
                    <div class="effect-chips">
                      <span v-for="(effect, i) in safetyInfo.ai_summary.common_side_effects" :key="i" class="effect-chip">{{ effect }}</span>
                    </div>
                  </div>

                  <div class="ai-section serious" v-if="safetyInfo.ai_summary.serious_side_effects?.length">
                    <h4><v-icon name="hi-exclamation" scale="0.85" /> Serious Side Effects</h4>
                    <p class="serious-note">Seek medical attention if you experience:</p>
                    <ul>
                      <li v-for="(effect, i) in safetyInfo.ai_summary.serious_side_effects" :key="i">{{ effect }}</li>
                    </ul>
                  </div>

                  <div class="ai-section" v-if="safetyInfo.ai_summary.who_should_avoid?.length">
                    <h4><v-icon name="hi-ban" scale="0.85" /> Who Should Avoid</h4>
                    <ul>
                      <li v-for="(item, i) in safetyInfo.ai_summary.who_should_avoid" :key="i">{{ item }}</li>
                    </ul>
                  </div>

                  <div class="ai-section" v-if="safetyInfo.ai_summary.drug_interactions_summary?.length">
                    <h4><v-icon name="hi-switch-horizontal" scale="0.85" /> Drug Interactions</h4>
                    <ul>
                      <li v-for="(interaction, i) in safetyInfo.ai_summary.drug_interactions_summary" :key="i">{{ interaction }}</li>
                    </ul>
                  </div>

                  <div class="ai-section" v-if="safetyInfo.ai_summary.pregnancy_summary">
                    <h4><v-icon name="hi-heart" scale="0.85" /> Pregnancy & Breastfeeding</h4>
                    <p>{{ safetyInfo.ai_summary.pregnancy_summary }}</p>
                  </div>

                  <div class="ai-section tips" v-if="safetyInfo.ai_summary.usage_tips?.length">
                    <h4><v-icon name="hi-light-bulb" scale="0.85" /> Usage Tips</h4>
                    <ul>
                      <li v-for="(tip, i) in safetyInfo.ai_summary.usage_tips" :key="i">{{ tip }}</li>
                    </ul>
                  </div>
                </template>

                <!-- FDA Data Only -->
                <template v-else-if="showFDAOnly && safetyInfo">
                  <div class="fda-section danger" v-if="safetyInfo.full_info?.boxed_warning?.length">
                    <h4>Boxed Warning</h4>
                    <p v-for="(warning, i) in safetyInfo.full_info.boxed_warning.slice(0, 3)" :key="i">{{ warning }}</p>
                  </div>

                  <div class="fda-section" v-if="safetyInfo.full_info?.adverse_reactions?.length">
                    <h4>Adverse Reactions</h4>
                    <p v-for="(reaction, i) in safetyInfo.full_info.adverse_reactions.slice(0, 5)" :key="i">{{ reaction }}</p>
                  </div>

                  <div class="fda-section warning" v-if="safetyInfo.full_info?.warnings?.length">
                    <h4>Warnings</h4>
                    <p v-for="(warning, i) in safetyInfo.full_info.warnings.slice(0, 4)" :key="i">{{ warning }}</p>
                  </div>
                </template>

                <div class="safety-footer">
                  <span class="source-text">Source: U.S. Food and Drug Administration (FDA)</span>
                  <span class="disclaimer">This information is for reference only. Always consult your healthcare provider.</span>
                </div>
              </div>
            </transition>
          </div>

          <!-- Related Products Card -->
          <div class="bento-card related-card" v-if="similarDrugs && similarDrugs.length > 0">
            <div class="card-header">
              <div class="header-icon">
                <v-icon name="hi-collection" scale="1" />
              </div>
              <h3>Related Products</h3>
              <span class="disclaimer-badge">Check with your Doctor</span>
            </div>
            <div class="related-grid">
              <div
                v-for="item in similarDrugs.slice(0, 6)"
                :key="item._id"
                class="related-item"
                @click="viewDrug(item._id)"
              >
                <div class="related-image">
                  <img v-if="item.image_url" :src="item.image_url" :alt="item.name" />
                  <div v-else class="related-placeholder">
                    <v-icon name="ri-capsule-line" scale="1.2" />
                  </div>
                  <span class="related-rx" v-if="item.requires_prescription">Rx</span>
                </div>
                <div class="related-info">
                  <span class="related-name">{{ item.name }}</span>
                  <span class="related-price">{{ formatPrice(item.selling_price) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>

    <!-- Floating Cart Button -->
    <button class="fab" @click="goToCart" v-if="cartItemCount > 0 && !loading && drug">
      <v-icon name="hi-shopping-cart" scale="1.2" />
      <span class="fab-badge">{{ cartItemCount }}</span>
    </button>

    <!-- Cart Success Toast -->
    <Teleport to="body">
      <transition name="toast">
        <div class="cart-toast" v-if="showCartModal">
          <div class="toast-content">
            <v-icon name="hi-check-circle" scale="1.2" />
            <div class="toast-text">
              <strong>Added to cart</strong>
              <span>{{ quantity }}x {{ drug?.name }}</span>
            </div>
          </div>
          <button class="toast-action" @click="goToCart">View Cart</button>
        </div>
      </transition>
    </Teleport>

    <!-- Image Zoom Modal -->
    <Teleport to="body">
      <transition name="fade">
        <div class="zoom-modal" v-if="isImageZoomed" @click="closeImageZoom">
          <img :src="drug?.image_url || drug?.primary_image" :alt="drug?.name" />
          <button class="zoom-close">
            <v-icon name="hi-x" scale="1.2" />
          </button>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";

export default {
  name: "DrugDetails",
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const route = useRoute();
    const quantity = ref(1);
    const selectedBatch = ref(null);
    const showCartModal = ref(false);
    const isImageZoomed = ref(false);
    const similarDrugs = ref([]);

    const {
      "pharmacy/fetchDrugDetails": fetchDrugDetails,
      "pharmacy/fetchDrugSafetyInfo": fetchDrugSafetyInfo,
      "pharmacy/fetchSimilarDrugs": fetchSimilarDrugs,
      "pharmacy/addToCart": addToCartAction,
    } = useMapActions();

    // Safety Information
    const safetyInfo = ref(null);
    const safetyInfoLoading = ref(false);
    const safetyInfoFetched = ref(false);
    const safetyAccordionOpen = ref(false);

    const hasSafetyData = computed(() => {
      if (!safetyInfo.value) return false;
      if (safetyInfo.value.has_ai_summary && safetyInfo.value.ai_summary) return true;
      const info = safetyInfo.value.full_info || safetyInfo.value;
      return (
        info.boxed_warning?.length > 0 ||
        info.adverse_reactions?.length > 0 ||
        info.warnings?.length > 0 ||
        info.contraindications?.length > 0
      );
    });

    const displayMode = computed(() => safetyInfo.value?.patient_display_mode || 'both');

    const showAISummary = computed(() => {
      if (!safetyInfo.value?.has_ai_summary || !safetyInfo.value?.ai_summary) return false;
      return displayMode.value === 'ai_only' || displayMode.value === 'both';
    });

    const showFDAOnly = computed(() => {
      if (displayMode.value === 'fda_only') return true;
      if (displayMode.value === 'both' && !showAISummary.value) return true;
      return false;
    });

    const {
      "pharmacy/getCurrentDrug": drug,
      "pharmacy/getLoading": isLoading,
      "pharmacy/getCartItemCount": cartItemCount,
      "pharmacy/getCart": cart,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);

    const stockQuantity = computed(() => {
      if (selectedBatch.value) return selectedBatch.value.quantity;
      return drug.value?.quantity_in_stock || drug.value?.quantity || 0;
    });

    const maxQuantity = computed(() => {
      const stock = stockQuantity.value;
      const maxPerOrder = drug.value?.max_quantity_per_order;
      let max = stock > 0 ? stock : 99;
      if (maxPerOrder && maxPerOrder > 0 && maxPerOrder < max) {
        max = maxPerOrder;
      }
      if (max === 0 && drug.value?.is_available) {
        max = 10;
      }
      return max;
    });

    const maxQuantityText = computed(() => {
      const maxPerOrder = drug.value?.max_quantity_per_order;
      if (maxPerOrder && maxPerOrder > 0) {
        return `Max ${maxPerOrder} per order`;
      }
      return null;
    });

    const quantityInCart = computed(() => {
      if (!drug.value?._id || !cart.value) return 0;
      const cartItem = cart.value.find(item => item.drugId === drug.value._id);
      return cartItem ? cartItem.quantity : 0;
    });

    const remainingAddable = computed(() => {
      const maxPerOrder = drug.value?.max_quantity_per_order;
      if (!maxPerOrder || maxPerOrder <= 0) return 99;
      return Math.max(0, maxPerOrder - quantityInCart.value);
    });

    const maxReachedInCart = computed(() => {
      const maxPerOrder = drug.value?.max_quantity_per_order;
      if (!maxPerOrder || maxPerOrder <= 0) return false;
      return quantityInCart.value >= maxPerOrder;
    });

    const cartLimitMessage = computed(() => {
      if (maxReachedInCart.value) {
        return `You already have ${quantityInCart.value} in your cart (max ${drug.value?.max_quantity_per_order})`;
      }
      if (quantityInCart.value > 0 && remainingAddable.value < quantity.value) {
        return `You can only add ${remainingAddable.value} more (${quantityInCart.value} already in cart)`;
      }
      return null;
    });

    const stockText = computed(() => {
      const qty = stockQuantity.value;
      if (!drug.value?.is_available || qty === 0) return 'Out of Stock';
      if (qty <= 10) return `Only ${qty} left`;
      return 'In Stock';
    });

    const getStockClass = computed(() => {
      const qty = stockQuantity.value;
      if (!drug.value?.is_available || qty === 0) return 'out-of-stock';
      if (qty <= 10) return 'low-stock';
      return 'in-stock';
    });

    const currentPrice = computed(() => {
      if (selectedBatch.value) return selectedBatch.value.price;
      return drug.value?.selling_price || 0;
    });

    const currentManufacturer = computed(() => {
      if (selectedBatch.value) return selectedBatch.value.manufacturer;
      return drug.value?.manufacturer || null;
    });

    const showOriginalPrice = computed(() => {
      if (!drug.value?.original_price) return false;
      return drug.value.original_price > currentPrice.value;
    });

    const openImageZoom = () => {
      if (drug.value?.image_url || drug.value?.primary_image) {
        isImageZoomed.value = true;
      }
    };

    const closeImageZoom = () => {
      isImageZoomed.value = false;
    };

    const selectBatch = (batch) => {
      selectedBatch.value = batch;
    };

    const formatPrice = (price) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price || 0);
    };

    const incrementQuantity = () => {
      if (quantity.value < maxQuantity.value) {
        quantity.value += 1;
      }
    };

    const decrementQuantity = () => {
      if (quantity.value > 1) {
        quantity.value -= 1;
      }
    };

    const addToCart = () => {
      if (drug.value && drug.value.is_available) {
        if (maxReachedInCart.value) return;

        const requestedQty = quantity.value;
        const availableQty = stockQuantity.value;

        if (requestedQty > availableQty) {
          quantity.value = availableQty;
          return;
        }

        const actualQtyToAdd = Math.min(requestedQty, remainingAddable.value);
        if (actualQtyToAdd <= 0) return;

        addToCartAction({
          drugId: drug.value._id,
          name: drug.value.name,
          strength: drug.value.strength,
          dosageForm: drug.value.dosage_form,
          route: drug.value.route,
          routeAbbreviation: drug.value.route_abbreviation,
          price: currentPrice.value,
          quantity: actualQtyToAdd,
          imageUrl: drug.value.image_url,
          purchaseType: drug.value.purchase_type,
          requiresPrescription: drug.value.requires_prescription,
          scheduleClass: drug.value.schedule_class,
          maxQuantityPerOrder: drug.value.max_quantity_per_order,
          batchId: selectedBatch.value?.batch_id || null,
          manufacturer: currentManufacturer.value,
        });
        showCartModal.value = true;
        setTimeout(() => {
          showCartModal.value = false;
        }, 3000);
      }
    };

    const goToCart = () => {
      showCartModal.value = false;
      router.push("/app/patient/pharmacy/cart");
    };

    const viewDrug = (drugId) => {
      const targetPath = `/app/patient/pharmacy/drug/${drugId}`;
      if (route.path === targetPath) return;
      router.push(targetPath).then(() => {
        window.scrollTo(0, 0);
      });
    };

    const notifyWhenAvailable = () => {
      alert('You will be notified when this medication is back in stock.');
    };

    const toggleSafetyAccordion = () => {
      if (!safetyInfoLoading.value) {
        safetyAccordionOpen.value = !safetyAccordionOpen.value;
      }
    };

    watch(selectedBatch, (newBatch) => {
      if (newBatch && quantity.value > newBatch.quantity) {
        quantity.value = newBatch.quantity > 0 ? newBatch.quantity : 1;
      }
    });

    watch(maxQuantity, (newMax) => {
      if (quantity.value > newMax && newMax > 0) {
        quantity.value = newMax;
      }
    });

    watch(
      () => route.params.id,
      async (newId, oldId) => {
        if (newId && newId !== oldId) {
          quantity.value = 1;
          selectedBatch.value = null;
          safetyAccordionOpen.value = false;
          safetyInfo.value = null;
          similarDrugs.value = [];

          await fetchDrugDetails(newId);

          safetyInfoLoading.value = true;
          const [safetyResult, similarResult] = await Promise.allSettled([
            fetchDrugSafetyInfo(newId),
            fetchSimilarDrugs({ drugId: newId, limit: 8 }),
          ]);

          if (safetyResult.status === 'fulfilled') {
            safetyInfo.value = safetyResult.value;
          }
          if (similarResult.status === 'fulfilled') {
            similarDrugs.value = similarResult.value || [];
          }

          safetyInfoLoading.value = false;
          safetyInfoFetched.value = true;
        }
      }
    );

    onMounted(async () => {
      const drugId = route.params.id;
      if (drugId) {
        await fetchDrugDetails(drugId);

        safetyInfoLoading.value = true;
        const [safetyResult, similarResult] = await Promise.allSettled([
          fetchDrugSafetyInfo(drugId),
          fetchSimilarDrugs({ drugId, limit: 8 }),
        ]);

        if (safetyResult.status === 'fulfilled') {
          safetyInfo.value = safetyResult.value;
        }
        if (similarResult.status === 'fulfilled') {
          similarDrugs.value = similarResult.value || [];
        }

        safetyInfoLoading.value = false;
        safetyInfoFetched.value = true;
      }
    });

    return {
      drug,
      loading,
      quantity,
      maxQuantity,
      maxQuantityText,
      quantityInCart,
      remainingAddable,
      maxReachedInCart,
      cartLimitMessage,
      selectedBatch,
      stockQuantity,
      stockText,
      getStockClass,
      currentPrice,
      currentManufacturer,
      showOriginalPrice,
      showCartModal,
      cartItemCount,
      isImageZoomed,
      similarDrugs,
      safetyInfo,
      safetyInfoLoading,
      safetyInfoFetched,
      safetyAccordionOpen,
      hasSafetyData,
      showAISummary,
      showFDAOnly,
      openImageZoom,
      closeImageZoom,
      selectBatch,
      formatPrice,
      incrementQuantity,
      decrementQuantity,
      addToCart,
      goToCart,
      viewDrug,
      notifyWhenAvailable,
      toggleSafetyAccordion,
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

.drug-details-page {
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

  .cart-btn .cart-count {
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
    padding: 16px 16px 120px;
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

// Error State
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 16px;
  text-align: center;

  .error-icon {
    color: $rose;
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: $navy;
    margin: 0;
  }

  p {
    font-size: 14px;
    color: $gray;
    margin: 0;
  }

  .back-pharmacy-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 8px;
  }
}

// Breadcrumbs
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;

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
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .breadcrumb-sep {
    color: #CBD5E1;
    font-size: 12px;
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

// Product Hero Card
.product-hero-card {
  grid-column: span 12;
}

.product-layout {
  display: grid;
  grid-template-columns: 380px 1fr;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.product-image-section {
  background: linear-gradient(135deg, $sky-light 0%, white 100%);
  padding: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;

  @media (max-width: 900px) {
    min-height: 240px;
    padding: 24px;
  }
}

.image-container {
  position: relative;
  width: 100%;
  max-width: 280px;
  cursor: pointer;

  img {
    width: 100%;
    height: auto;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .image-placeholder {
    width: 100%;
    aspect-ratio: 1;
    background: white;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $light-gray;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  }

  .rx-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    background: $rose;
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
  }

  .zoom-hint {
    position: absolute;
    bottom: 12px;
    right: 12px;
    width: 36px;
    height: 36px;
    background: white;
    border: none;
    border-radius: 10px;
    color: $slate;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    opacity: 0.9;

    &:hover {
      opacity: 1;
    }
  }
}

.product-info-section {
  padding: 32px;

  @media (max-width: 768px) {
    padding: 20px;
  }
}

.product-header {
  margin-bottom: 24px;

  .product-name {
    font-size: 26px;
    font-weight: 700;
    color: $navy;
    margin: 0 0 6px;
    line-height: 1.2;

    @media (max-width: 768px) {
      font-size: 22px;
    }
  }

  .generic-name {
    font-size: 15px;
    color: $gray;
    margin: 0 0 12px;
  }

  .product-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }

  .meta-pill {
    display: inline-flex;
    padding: 6px 12px;
    background: $sky-light;
    color: $sky-dark;
    font-size: 12px;
    font-weight: 500;
    border-radius: 20px;
  }

  .manufacturer {
    font-size: 14px;
    color: $gray;
    margin: 0;

    strong {
      color: $slate;
    }
  }
}

.price-block {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;

  .price-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .current-price {
    font-size: 28px;
    font-weight: 700;
    color: $navy;

    @media (max-width: 768px) {
      font-size: 24px;
    }
  }

  .original-price {
    font-size: 16px;
    color: $light-gray;
    text-decoration: line-through;
  }

  .stock-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    &.in-stock {
      background: $emerald-light;
      color: $emerald;
      .dot { background: $emerald; }
    }

    &.low-stock {
      background: $amber-light;
      color: $amber;
      .dot { background: $amber; }
    }

    &.out-of-stock {
      background: $rose-light;
      color: $rose;
      .dot { background: $rose; }
    }
  }
}

.batch-selector {
  margin-bottom: 24px;

  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: $slate;
    margin-bottom: 10px;
  }

  .batch-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .batch-item {
    display: flex;
    flex-direction: column;
    padding: 12px 16px;
    background: $bg;
    border: 2px solid #E2E8F0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 120px;

    &:hover {
      border-color: $sky;
    }

    &.selected {
      background: $sky-light;
      border-color: $sky;
    }

    .batch-name {
      font-size: 13px;
      font-weight: 500;
      color: $slate;
    }

    .batch-price {
      font-size: 15px;
      font-weight: 700;
      color: $navy;
      margin-top: 4px;
    }
  }
}

.cart-section {
  .quantity-row {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;

    @media (max-width: 480px) {
      flex-direction: column;
    }
  }

  .quantity-selector {
    display: flex;
    align-items: center;
    background: $bg;
    border-radius: 12px;
    overflow: hidden;

    .qty-btn {
      width: 44px;
      height: 44px;
      border: none;
      background: transparent;
      color: $slate;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover:not(:disabled) {
        background: #E2E8F0;
      }

      &:disabled {
        color: $light-gray;
        cursor: not-allowed;
      }
    }

    .qty-display {
      min-width: 48px;
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      color: $navy;
    }
  }

  .add-cart-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      box-shadow: 0 6px 20px rgba($sky, 0.3);
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .cart-limit-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: $amber-light;
    border-radius: 10px;
    font-size: 13px;
    color: darken($amber, 10%);
  }

  .go-cart-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 24px;
    background: $emerald;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
  }

  .max-qty-hint {
    font-size: 12px;
    color: $gray;
    margin: 8px 0 0;
  }
}

.out-of-stock-section {
  .oos-text {
    font-size: 14px;
    color: $rose;
    margin: 0 0 12px;
  }

  .notify-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: $bg;
    border: 2px solid #E2E8F0;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
    color: $slate;
    cursor: pointer;

    &:hover {
      border-color: $sky;
      color: $sky-dark;
    }
  }
}

.rx-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: $amber-light;
  border-radius: 12px;
  margin-top: 20px;
  color: darken($amber, 10%);
  font-size: 13px;
  line-height: 1.4;
}

// Info Cards
.info-card {
  grid-column: span 3;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;

  @media (max-width: 1024px) {
    grid-column: span 3;
  }

  @media (max-width: 768px) {
    padding: 16px;
  }

  .info-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.sky { background: $sky-light; color: $sky-dark; }
    &.violet { background: $violet-light; color: $violet; }
    &.emerald { background: $emerald-light; color: $emerald; }
    &.amber { background: $amber-light; color: $amber; }
  }

  .info-content {
    flex: 1;
    min-width: 0;

    .info-label {
      display: block;
      font-size: 12px;
      color: $gray;
      margin-bottom: 2px;
    }

    .info-value {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: $navy;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

// Detail Cards
.detail-card {
  grid-column: span 6;
  padding: 20px;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }

  &.warning-card {
    border-left: 4px solid $amber;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;

    .header-icon {
      width: 36px;
      height: 36px;
      background: $sky-light;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $sky-dark;

      &.warning {
        background: $amber-light;
        color: $amber;
      }
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }
  }

  .card-body {
    p {
      font-size: 14px;
      color: $slate;
      line-height: 1.6;
      margin: 0;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        font-size: 14px;
        color: $slate;
        line-height: 1.6;
        margin-bottom: 6px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  .tag {
    display: inline-flex;
    padding: 6px 12px;
    background: $bg;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    font-size: 12px;
    color: $slate;

    &.category {
      background: $violet-light;
      border-color: transparent;
      color: $violet;
    }
  }
}

// Safety Card
.safety-card {
  grid-column: span 12;
  padding: 0;

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: $bg;
    }

    &.clickable {
      cursor: pointer;
    }

    .header-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.safety {
        background: $emerald-light;
        color: $emerald;
      }
    }

    h3 {
      flex: 1;
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }

    .source-badge {
      padding: 4px 10px;
      background: $sky-light;
      color: $sky-dark;
      font-size: 11px;
      font-weight: 600;
      border-radius: 12px;
    }

    .accordion-icon {
      color: $gray;
    }
  }

  .safety-loading {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    color: $gray;
    font-size: 13px;

    .mini-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid $sky-light;
      border-top-color: $sky;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }

  .safety-content {
    padding: 0 20px 20px;
    border-top: 1px solid #F1F5F9;
  }

  .no-safety-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px;
    color: $gray;

    p {
      font-size: 14px;
      margin: 12px 0 0;
      max-width: 400px;
    }
  }

  .ai-overview {
    padding: 16px;
    background: $sky-light;
    border-radius: 12px;
    margin-top: 16px;

    p {
      font-size: 14px;
      color: $slate;
      line-height: 1.6;
      margin: 0;
    }
  }

  .ai-section {
    margin-top: 20px;

    h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: $navy;
      margin: 0 0 10px;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        font-size: 13px;
        color: $slate;
        line-height: 1.5;
        margin-bottom: 6px;
      }
    }

    p {
      font-size: 13px;
      color: $slate;
      line-height: 1.5;
      margin: 0;
    }

    &.serious {
      padding: 14px;
      background: $rose-light;
      border-radius: 12px;

      h4 { color: $rose; }
      .serious-note {
        font-weight: 500;
        color: darken($rose, 10%);
        margin-bottom: 8px;
      }
    }

    &.tips {
      padding: 14px;
      background: $emerald-light;
      border-radius: 12px;

      h4 { color: $emerald; }
    }

    .effect-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .effect-chip {
        padding: 5px 12px;
        background: white;
        border: 1px solid #E2E8F0;
        border-radius: 16px;
        font-size: 12px;
        color: $slate;
      }
    }
  }

  .fda-section {
    margin-top: 16px;
    padding: 14px;
    background: $bg;
    border-radius: 12px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: $navy;
      margin: 0 0 10px;
    }

    p {
      font-size: 13px;
      color: $slate;
      line-height: 1.5;
      margin: 0 0 8px;

      &:last-child { margin-bottom: 0; }
    }

    &.danger {
      background: $rose-light;
      h4 { color: $rose; }
    }

    &.warning {
      background: $amber-light;
      h4 { color: darken($amber, 10%); }
    }
  }

  .safety-footer {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #F1F5F9;

    .source-text {
      display: block;
      font-size: 11px;
      color: $gray;
      margin-bottom: 4px;
    }

    .disclaimer {
      display: block;
      font-size: 11px;
      color: $light-gray;
      font-style: italic;
    }
  }
}

// Accordion transition
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  max-height: 0;
}

// Related Products Card
.related-card {
  grid-column: span 12;
  padding: 20px;

  .card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .header-icon {
      width: 36px;
      height: 36px;
      background: $violet-light;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $violet;
    }

    h3 {
      flex: 1;
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }

    .disclaimer-badge {
      padding: 4px 10px;
      background: $amber-light;
      color: darken($amber, 10%);
      font-size: 10px;
      font-weight: 500;
      border-radius: 12px;
    }
  }

  .related-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;

    @media (max-width: 1024px) {
      grid-template-columns: repeat(4, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 480px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .related-item {
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-4px);

      .related-image img {
        transform: scale(1.05);
      }
    }
  }

  .related-image {
    position: relative;
    aspect-ratio: 1;
    background: $bg;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 10px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }

    .related-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $light-gray;
    }

    .related-rx {
      position: absolute;
      top: 6px;
      left: 6px;
      background: $rose;
      color: white;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }
  }

  .related-info {
    .related-name {
      display: block;
      font-size: 12px;
      font-weight: 500;
      color: $slate;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .related-price {
      font-size: 13px;
      font-weight: 700;
      color: $navy;
    }
  }
}

// Floating Cart Button
.fab {
  display: none;
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, $emerald, darken($emerald, 10%));
  color: white;
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba($emerald, 0.4);
  cursor: pointer;
  z-index: 50;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    display: flex;
  }

  .fab-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 22px;
    height: 22px;
    background: $rose;
    color: white;
    font-size: 11px;
    font-weight: 700;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
  }
}

// Toast
.cart-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  background: $navy;
  color: white;
  border-radius: 14px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;

  @media (max-width: 480px) {
    left: 16px;
    right: 16px;
    transform: none;
    bottom: 100px;
  }

  .toast-content {
    display: flex;
    align-items: center;
    gap: 12px;

    svg {
      color: $emerald;
    }
  }

  .toast-text {
    strong {
      display: block;
      font-size: 14px;
    }

    span {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  .toast-action {
    padding: 8px 16px;
    background: $sky;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);

  @media (max-width: 480px) {
    transform: translateY(20px);
  }
}

// Image Zoom Modal
.zoom-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  cursor: zoom-out;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 8px;
  }

  .zoom-close {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 12px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
