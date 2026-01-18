<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Drug Details"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <!-- Loading State -->
      <div class="loading-state" v-if="loading">
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-line wide"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="drug-page" v-if="!loading && drug">
        <!-- Breadcrumbs -->
        <nav class="breadcrumbs">
          <router-link to="/app/patient" class="breadcrumb-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/>
            </svg>
          </router-link>
          <span class="breadcrumb-sep">/</span>
          <router-link to="/app/patient/pharmacy" class="breadcrumb-item">Pharmacy</router-link>
          <span class="breadcrumb-sep">/</span>
          <span class="breadcrumb-item current">{{ drug.name }}</span>
        </nav>

        <!-- Product Card -->
        <div class="product-card">
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
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"/>
                  </svg>
                </div>
                <span class="rx-tag" v-if="drug.requires_prescription">Rx</span>
              </div>
            </div>

            <!-- Info Section -->
            <div class="product-info-section">
              <div class="product-header">
                <h1 class="product-name">{{ drug.name }}</h1>
                <p class="generic-name" v-if="drug.generic_name">{{ drug.generic_name }}</p>

                <div class="product-meta">
                  <span v-if="drug.strength" class="meta-item">{{ drug.strength }}</span>
                  <span v-if="drug.dosage_form" class="meta-item">{{ drug.dosage_form }}</span>
                  <span v-if="drug.pack_size" class="meta-item">{{ drug.pack_size }} {{ drug.unit_of_measure || 'units' }}</span>
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
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14"/>
                      </svg>
                    </button>
                    <span class="qty-display">{{ quantity }}</span>
                    <button class="qty-btn" @click="incrementQuantity" :disabled="quantity >= remainingAddable || quantity >= maxQuantity">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </button>
                  </div>
                  <button class="add-cart-btn" @click="addToCart" :disabled="remainingAddable <= 0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
                    </svg>
                    Add to Cart
                  </button>
                </div>
                <!-- Cart limit message -->
                <div class="cart-limit-notice" v-if="cartLimitMessage">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                  </svg>
                  <span>{{ cartLimitMessage }}</span>
                </div>
                <!-- Max reached - show go to cart button -->
                <button class="go-cart-btn" v-if="maxReachedInCart" @click="goToCart">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
                  </svg>
                  View Cart
                </button>
                <p class="max-qty-hint" v-if="maxQuantityText && !cartLimitMessage">{{ maxQuantityText }}</p>
              </div>

              <!-- Out of Stock -->
              <div class="out-of-stock-section" v-else>
                <p class="oos-text">This item is currently out of stock</p>
                <button class="notify-btn" @click="notifyWhenAvailable">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/>
                  </svg>
                  Notify Me When Available
                </button>
              </div>

              <!-- Prescription Notice -->
              <div class="rx-notice" v-if="drug.requires_prescription">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                <span>A valid prescription is required for this medication</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Drug Details Sections -->
        <div class="details-sections">
          <!-- Route & Administration -->
          <div class="detail-card" v-if="drug.route">
            <div class="detail-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
              </svg>
              <h3>Administration</h3>
            </div>
            <div class="detail-content">
              <p><strong>Route:</strong> {{ drug.route }}<span v-if="drug.route_abbreviation"> ({{ drug.route_abbreviation }})</span></p>
            </div>
          </div>

          <!-- Description -->
          <div class="detail-card" v-if="drug.description">
            <div class="detail-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
              </svg>
              <h3>Description</h3>
            </div>
            <div class="detail-content">
              <p>{{ drug.description }}</p>
            </div>
          </div>

          <!-- Dosage Instructions -->
          <div class="detail-card" v-if="drug.dosage_instructions">
            <div class="detail-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h3>Dosage & Usage</h3>
            </div>
            <div class="detail-content">
              <p>{{ drug.dosage_instructions }}</p>
            </div>
          </div>

          <!-- Storage -->
          <div class="detail-card" v-if="drug.storage_instructions">
            <div class="detail-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
              </svg>
              <h3>Storage</h3>
            </div>
            <div class="detail-content">
              <p>{{ drug.storage_instructions }}</p>
            </div>
          </div>

          <!-- Warnings -->
          <div class="detail-card warning" v-if="drug.warnings && drug.warnings.length > 0">
            <div class="detail-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
              </svg>
              <h3>Warnings</h3>
            </div>
            <div class="detail-content">
              <ul>
                <li v-for="(warning, i) in drug.warnings" :key="i">{{ warning }}</li>
              </ul>
            </div>
          </div>

          <!-- Side Effects -->
          <div class="detail-card" v-if="drug.side_effects && drug.side_effects.length > 0">
            <div class="detail-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>
              </svg>
              <h3>Possible Side Effects</h3>
            </div>
            <div class="detail-content">
              <div class="tags-list">
                <span v-for="(effect, i) in drug.side_effects" :key="i" class="tag">{{ effect }}</span>
              </div>
            </div>
          </div>

          <!-- Contraindications -->
          <div class="detail-card" v-if="drug.contraindications && drug.contraindications.length > 0">
            <div class="detail-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
              </svg>
              <h3>Contraindications</h3>
            </div>
            <div class="detail-content">
              <ul>
                <li v-for="(item, i) in drug.contraindications" :key="i">{{ item }}</li>
              </ul>
            </div>
          </div>

          <!-- Categories -->
          <div class="detail-card" v-if="drug.category_names && drug.category_names.length > 0">
            <div class="detail-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/>
                <path d="M6 6h.008v.008H6V6z"/>
              </svg>
              <h3>Categories</h3>
            </div>
            <div class="detail-content">
              <div class="tags-list">
                <span v-for="cat in drug.category_names" :key="cat" class="tag category">{{ cat }}</span>
              </div>
            </div>
          </div>

          <!-- Safety Information Section with AI Summary -->
          <div class="safety-info-section" v-if="safetyInfoFetched || safetyInfoLoading">
            <div class="safety-header" :class="{ clickable: !safetyInfoLoading }" @click="toggleSafetyAccordion">
              <div class="safety-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                </svg>
                <span>Safety Information</span>
                <span class="source-badge" v-if="safetyInfo?.source">{{ safetyInfo.source }}</span>
              </div>
              <svg class="accordion-arrow" :class="{ expanded: safetyAccordionOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" v-if="!safetyInfoLoading">
                <path d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
              </svg>
            </div>

            <!-- Loading State -->
            <div class="safety-loading" v-if="safetyInfoLoading">
              <div class="loading-spinner"></div>
              <span>Loading safety information...</span>
            </div>

            <!-- Accordion Content - Collapsed by default -->
            <div class="safety-accordion-content" :class="{ expanded: safetyAccordionOpen }" v-else>

            <!-- No Safety Data Available -->
            <div class="no-safety-data" v-if="!hasSafetyData">
              <div class="no-data-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
              </div>
              <p class="no-data-title">No Safety Information Available</p>
              <p class="no-data-text">Safety information for this medication is not yet available. Please consult your pharmacist or healthcare provider for guidance.</p>
            </div>

            <!-- AI Summary Section (Default View) - Shown for 'ai_only' or 'both' modes -->
            <div class="ai-summary-section" v-else-if="showAISummary">
              <!-- Overview -->
              <div class="ai-overview" v-if="safetyInfo.ai_summary.overview">
                <p>{{ safetyInfo.ai_summary.overview }}</p>
              </div>

              <!-- Key Warnings -->
              <div class="ai-section ai-warnings" v-if="safetyInfo.ai_summary.key_warnings?.length">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                  </svg>
                  Key Warnings
                </h4>
                <ul>
                  <li v-for="(warning, i) in safetyInfo.ai_summary.key_warnings" :key="i">{{ warning }}</li>
                </ul>
              </div>

              <!-- Common Side Effects -->
              <div class="ai-section ai-side-effects" v-if="safetyInfo.ai_summary.common_side_effects?.length">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877"/>
                  </svg>
                  Common Side Effects
                </h4>
                <div class="side-effects-chips">
                  <span v-for="(effect, i) in safetyInfo.ai_summary.common_side_effects" :key="i" class="effect-chip">{{ effect }}</span>
                </div>
              </div>

              <!-- Serious Side Effects -->
              <div class="ai-section ai-serious" v-if="safetyInfo.ai_summary.serious_side_effects?.length">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
                  </svg>
                  Serious Side Effects
                </h4>
                <p class="serious-notice">Seek medical attention if you experience:</p>
                <ul class="serious-list">
                  <li v-for="(effect, i) in safetyInfo.ai_summary.serious_side_effects" :key="i">{{ effect }}</li>
                </ul>
              </div>

              <!-- Who Should Avoid -->
              <div class="ai-section ai-avoid" v-if="safetyInfo.ai_summary.who_should_avoid?.length">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                  Who Should Avoid
                </h4>
                <ul>
                  <li v-for="(item, i) in safetyInfo.ai_summary.who_should_avoid" :key="i">{{ item }}</li>
                </ul>
              </div>

              <!-- Drug Interactions -->
              <div class="ai-section ai-interactions" v-if="safetyInfo.ai_summary.drug_interactions_summary?.length">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/>
                  </svg>
                  Drug Interactions
                </h4>
                <ul>
                  <li v-for="(interaction, i) in safetyInfo.ai_summary.drug_interactions_summary" :key="i">{{ interaction }}</li>
                </ul>
              </div>

              <!-- Food Interactions -->
              <div class="ai-section ai-food" v-if="safetyInfo.ai_summary.food_interactions_summary?.length">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z"/>
                  </svg>
                  Food & Beverage Interactions
                </h4>
                <ul>
                  <li v-for="(food, i) in safetyInfo.ai_summary.food_interactions_summary" :key="i">{{ food }}</li>
                </ul>
              </div>

              <!-- Pregnancy Summary -->
              <div class="ai-section ai-pregnancy" v-if="safetyInfo.ai_summary.pregnancy_summary">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                  </svg>
                  Pregnancy & Breastfeeding
                </h4>
                <p>{{ safetyInfo.ai_summary.pregnancy_summary }}</p>
              </div>

              <!-- Usage Tips -->
              <div class="ai-section ai-tips" v-if="safetyInfo.ai_summary.usage_tips?.length">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"/>
                  </svg>
                  Usage Tips
                </h4>
                <ul class="tips-list">
                  <li v-for="(tip, i) in safetyInfo.ai_summary.usage_tips" :key="i">{{ tip }}</li>
                </ul>
              </div>

              <!-- Custom Warnings from Admin -->
              <div
                class="ai-section ai-custom"
                :class="'severity-' + warning.severity"
                v-for="(warning, i) in (safetyInfo.custom_warnings || [])"
                :key="'custom-' + i"
              >
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                  </svg>
                  {{ warning.title }}
                </h4>
                <p>{{ warning.content }}</p>
              </div>

              <!-- Show Full FDA Data Toggle - Only for 'both' mode -->
              <div class="full-info-toggle" @click="toggleSafetyInfo" v-if="showFDAToggle">
                <span>{{ safetyInfoExpanded ? 'Hide' : 'View' }} Detailed Safety Information</span>
                <svg :class="{ expanded: safetyInfoExpanded }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                </svg>
              </div>

              <!-- Full FDA Data (Expandable) -->
              <div class="full-fda-content" :class="{ expanded: safetyInfoExpanded }">
                <div class="fda-section-title">Complete Safety Information</div>

                <!-- Boxed Warning (Black Box) -->
                <div class="safety-card danger" v-if="safetyInfo.full_info?.boxed_warning?.length">
                  <div class="safety-card-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                    </svg>
                    <strong>Boxed Warning</strong>
                  </div>
                  <div class="safety-card-content">
                    <p v-for="(warning, i) in safetyInfo.full_info.boxed_warning" :key="i">{{ warning }}</p>
                  </div>
                </div>

                <!-- Adverse Reactions -->
                <div class="safety-card" v-if="safetyInfo.full_info?.adverse_reactions?.length">
                  <div class="safety-card-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877"/>
                    </svg>
                    <strong>Adverse Reactions</strong>
                  </div>
                  <div class="safety-card-content">
                    <p v-for="(reaction, i) in safetyInfo.full_info.adverse_reactions" :key="i">{{ reaction }}</p>
                  </div>
                </div>

                <!-- Warnings -->
                <div class="safety-card warning" v-if="safetyInfo.full_info?.warnings?.length">
                  <div class="safety-card-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
                    </svg>
                    <strong>Warnings</strong>
                  </div>
                  <div class="safety-card-content">
                    <p v-for="(warning, i) in safetyInfo.full_info.warnings" :key="i">{{ warning }}</p>
                  </div>
                </div>

                <!-- Drug Interactions -->
                <div class="safety-card warning" v-if="safetyInfo.full_info?.drug_interactions?.length">
                  <div class="safety-card-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/>
                    </svg>
                    <strong>Drug Interactions</strong>
                  </div>
                  <div class="safety-card-content">
                    <p v-for="(interaction, i) in safetyInfo.full_info.drug_interactions" :key="i">{{ interaction }}</p>
                  </div>
                </div>

                <!-- Contraindications -->
                <div class="safety-card warning" v-if="safetyInfo.full_info?.contraindications?.length">
                  <div class="safety-card-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                    </svg>
                    <strong>Contraindications</strong>
                  </div>
                  <div class="safety-card-content">
                    <p v-for="(item, i) in safetyInfo.full_info.contraindications" :key="i">{{ item }}</p>
                  </div>
                </div>

                <!-- Pregnancy/Breastfeeding -->
                <div class="safety-card" v-if="safetyInfo.full_info?.pregnancy_or_breastfeeding?.length">
                  <div class="safety-card-header">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                    </svg>
                    <strong>Pregnancy & Breastfeeding</strong>
                  </div>
                  <div class="safety-card-content">
                    <p v-for="(info, i) in safetyInfo.full_info.pregnancy_or_breastfeeding" :key="i">{{ info }}</p>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="safety-footer">
                <span class="source-text">
                  Source: U.S. Food and Drug Administration (FDA)
                  <span v-if="safetyInfo.last_updated"> | Last updated: {{ formatSafetyDate(safetyInfo.last_updated) }}</span>
                </span>
                <span class="disclaimer">
                  This information is for reference only. Always consult your healthcare provider.
                </span>
              </div>
            </div>

            <!-- FDA-only mode or fallback when no AI summary available -->
            <div class="safety-content" v-else-if="showFDAOnly && safetyInfo">
              <!-- Boxed Warning (Black Box) -->
              <div class="safety-card danger" v-if="safetyInfo.full_info?.boxed_warning?.length || safetyInfo.boxed_warning?.length">
                <div class="safety-card-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                  </svg>
                  <strong>Boxed Warning</strong>
                </div>
                <div class="safety-card-content">
                  <p v-for="(warning, i) in (safetyInfo.full_info?.boxed_warning || safetyInfo.boxed_warning || []).slice(0, 3)" :key="i">{{ warning }}</p>
                </div>
              </div>

              <!-- Adverse Reactions / Side Effects -->
              <div class="safety-card" v-if="safetyInfo.full_info?.adverse_reactions?.length || safetyInfo.adverse_reactions?.length">
                <div class="safety-card-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877"/>
                  </svg>
                  <strong>Possible Side Effects</strong>
                </div>
                <div class="safety-card-content">
                  <p v-for="(effect, i) in (safetyInfo.full_info?.adverse_reactions || safetyInfo.adverse_reactions || []).slice(0, 5)" :key="i">{{ effect }}</p>
                </div>
              </div>

              <!-- Warnings & Cautions -->
              <div class="safety-card warning" v-if="safetyInfo.full_info?.warnings?.length || safetyInfo.full_info?.warnings_and_cautions?.length || safetyInfo.warnings?.length || safetyInfo.warnings_and_cautions?.length">
                <div class="safety-card-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
                  </svg>
                  <strong>Warnings & Precautions</strong>
                </div>
                <div class="safety-card-content">
                  <p v-for="(warning, i) in (safetyInfo.full_info?.warnings || safetyInfo.full_info?.warnings_and_cautions || safetyInfo.warnings || safetyInfo.warnings_and_cautions || []).slice(0, 4)" :key="i">{{ warning }}</p>
                </div>
              </div>

              <!-- Drug Interactions -->
              <div class="safety-card warning" v-if="safetyInfo.full_info?.drug_interactions?.length || safetyInfo.drug_interactions?.length">
                <div class="safety-card-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/>
                  </svg>
                  <strong>Drug Interactions</strong>
                </div>
                <div class="safety-card-content">
                  <p v-for="(interaction, i) in (safetyInfo.full_info?.drug_interactions || safetyInfo.drug_interactions || []).slice(0, 4)" :key="i">{{ interaction }}</p>
                </div>
              </div>

              <!-- Contraindications -->
              <div class="safety-card warning" v-if="safetyInfo.full_info?.contraindications?.length || safetyInfo.contraindications?.length">
                <div class="safety-card-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                  </svg>
                  <strong>Contraindications</strong>
                </div>
                <div class="safety-card-content">
                  <p v-for="(item, i) in (safetyInfo.full_info?.contraindications || safetyInfo.contraindications || []).slice(0, 4)" :key="i">{{ item }}</p>
                </div>
              </div>

              <!-- Pregnancy/Breastfeeding -->
              <div class="safety-card" v-if="safetyInfo.full_info?.pregnancy_or_breastfeeding?.length || safetyInfo.pregnancy_or_breastfeeding?.length">
                <div class="safety-card-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                  </svg>
                  <strong>Pregnancy & Breastfeeding</strong>
                </div>
                <div class="safety-card-content">
                  <p v-for="(info, i) in (safetyInfo.full_info?.pregnancy_or_breastfeeding || safetyInfo.pregnancy_or_breastfeeding || []).slice(0, 2)" :key="i">{{ info }}</p>
                </div>
              </div>

              <!-- Custom Warnings from Admin -->
              <div
                class="safety-card"
                :class="warning.severity"
                v-for="(warning, i) in (safetyInfo.custom_warnings || safetyInfo.full_info?.custom_warnings || [])"
                :key="'custom-' + i"
              >
                <div class="safety-card-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                  </svg>
                  <strong>{{ warning.title }}</strong>
                </div>
                <div class="safety-card-content">
                  <p>{{ warning.content }}</p>
                </div>
              </div>

              <!-- Source Attribution -->
              <div class="safety-footer">
                <span class="source-text">
                  Source: U.S. Food and Drug Administration (FDA)
                  <span v-if="safetyInfo.last_updated"> | Last updated: {{ formatSafetyDate(safetyInfo.last_updated) }}</span>
                </span>
                <span class="disclaimer">
                  This information is for reference only. Always consult your healthcare provider.
                </span>
              </div>
            </div>

            </div><!-- End of safety-accordion-content -->
          </div>
        </div>

        <!-- Related Products -->
        <div class="similar-section" v-if="similarDrugs && similarDrugs.length > 0">
          <h2 class="section-title">Related Products <span class="disclaimer">(Check with your Doctor)</span></h2>
          <div class="similar-grid">
            <div
              v-for="item in similarDrugs"
              :key="item._id"
              class="similar-card"
            >
              <div class="similar-image" @click="viewDrug(item._id)">
                <img v-if="item.image_url" :src="item.image_url" :alt="item.name" />
                <div v-else class="similar-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"/>
                  </svg>
                </div>
                <!-- Prescription Required Tag -->
                <span class="similar-rx-tag" v-if="item.requires_prescription">Rx</span>
                <!-- Quick View Button -->
                <button class="quick-view-btn" @click.stop="openQuickView(item)" title="Quick View">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>
              </div>
              <div class="similar-info" @click="viewDrug(item._id)">
                <span class="similar-name">{{ item.name }}</span>
                <span class="similar-price">{{ formatPrice(item.selling_price) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick View Modal -->
      <Transition name="modal">
        <div class="quick-view-overlay" v-if="quickViewDrug" @click.self="closeQuickView">
          <div class="quick-view-modal">
            <button class="quick-view-close" @click="closeQuickView">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <div class="quick-view-content">
              <div class="quick-view-image">
                <img v-if="quickViewDrug.image_url" :src="quickViewDrug.image_url" :alt="quickViewDrug.name" />
                <div v-else class="quick-view-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3"/>
                  </svg>
                </div>
              </div>

              <div class="quick-view-details">
                <h3 class="quick-view-name">{{ quickViewDrug.name }}</h3>
                <p class="quick-view-generic">{{ quickViewDrug.generic_name }} {{ quickViewDrug.strength }}</p>

                <div class="quick-view-meta">
                  <span v-if="quickViewDrug.dosage_form" class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5v2.25a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 16.75V14.5"/>
                    </svg>
                    {{ quickViewDrug.dosage_form }}
                  </span>
                  <span v-if="quickViewDrug.manufacturer" class="meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21"/>
                    </svg>
                    {{ quickViewDrug.manufacturer }}
                  </span>
                </div>

                <div class="quick-view-price">
                  {{ formatPrice(quickViewDrug.selling_price) }}
                </div>

                <div class="quick-view-status-row">
                  <div class="quick-view-stock" :class="{ 'in-stock': quickViewDrug.is_available, 'out-of-stock': !quickViewDrug.is_available }">
                    <svg v-if="quickViewDrug.is_available" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ quickViewDrug.is_available ? 'In Stock' : 'Out of Stock' }}
                  </div>
                </div>

                <!-- Prescription Warning Notice -->
                <div class="quick-view-rx-notice" v-if="quickViewDrug.requires_prescription">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                  </svg>
                  <span>This medication requires a valid prescription before checkout</span>
                </div>

                <div class="quick-view-match" v-if="quickViewDrug.match_type">
                  <span class="match-badge" :class="quickViewDrug.match_type">
                    {{ getMatchTypeLabel(quickViewDrug.match_type) }}
                  </span>
                </div>

                <div class="quick-view-actions">
                  <button class="view-details-btn" @click="viewDrug(quickViewDrug._id)">
                    View Full Details
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Error State -->
      <div class="error-state" v-if="!loading && !drug">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
        </svg>
        <h3>Medication Not Found</h3>
        <p>This medication doesn't exist or has been removed.</p>
        <button @click="$router.push('/app/patient/pharmacy')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
          </svg>
          Back to Pharmacy
        </button>
      </div>
    </div>

    <!-- Cart Success Toast -->
    <Transition name="toast">
      <div class="cart-toast" v-if="showCartModal">
        <div class="toast-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div class="toast-text">
            <strong>Added to cart</strong>
            <span>{{ quantity }}x {{ drug?.name }}</span>
          </div>
        </div>
        <button class="toast-action" @click="goToCart">View Cart</button>
      </div>
    </Transition>

    <!-- Floating Cart Button -->
    <div class="floating-cart-btn" v-if="cartItemCount > 0" @click="goToCart">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
      </svg>
      <span class="cart-badge">{{ cartItemCount }}</span>
    </div>

    <!-- Image Zoom Modal -->
    <Transition name="fade">
      <div class="zoom-modal" v-if="isImageZoomed" @click="closeImageZoom">
        <img :src="drug?.image_url || drug?.primary_image" :alt="drug?.name" />
        <button class="zoom-close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";

export default {
  name: "DrugDetails",
  components: {
    TopBar,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const route = useRoute();
    const quantity = ref(1);
    const selectedBatch = ref(null);
    const showCartModal = ref(false);
    const isImageZoomed = ref(false);
    const similarDrugs = ref([]);
    const quickViewDrug = ref(null);

    const {
      "pharmacy/fetchDrugDetails": fetchDrugDetails,
      "pharmacy/fetchDrugSafetyInfo": fetchDrugSafetyInfo,
      "pharmacy/fetchSimilarDrugs": fetchSimilarDrugs,
      "pharmacy/addToCart": addToCartAction,
    } = useMapActions();

    // FDA Safety Information
    const safetyInfo = ref(null);
    const safetyInfoLoading = ref(false);
    const safetyInfoFetched = ref(false); // Track if fetch was attempted
    const safetyInfoExpanded = ref(false);
    const safetyAccordionOpen = ref(false);

    // Check if there's actual safety data (AI summary or FDA data)
    const hasSafetyData = computed(() => {
      if (!safetyInfo.value) return false;
      // Check for AI summary
      if (safetyInfo.value.has_ai_summary && safetyInfo.value.ai_summary) return true;
      // Check for FDA data
      const info = safetyInfo.value.full_info || safetyInfo.value;
      return (
        info.boxed_warning?.length > 0 ||
        info.adverse_reactions?.length > 0 ||
        info.warnings?.length > 0 ||
        info.warnings_and_cautions?.length > 0 ||
        info.contraindications?.length > 0 ||
        info.drug_interactions?.length > 0 ||
        info.pregnancy_or_breastfeeding?.length > 0 ||
        info.overdosage?.length > 0
      );
    });

    // Display mode logic (admin-controlled)
    const displayMode = computed(() => {
      return safetyInfo.value?.patient_display_mode || 'both';
    });

    // Show AI summary when: mode is 'ai_only' or 'both', and AI summary exists
    const showAISummary = computed(() => {
      if (!safetyInfo.value?.has_ai_summary || !safetyInfo.value?.ai_summary) return false;
      return displayMode.value === 'ai_only' || displayMode.value === 'both';
    });

    // Show the "View Full FDA Data" toggle only when mode is 'both' and AI summary is showing
    const showFDAToggle = computed(() => {
      return displayMode.value === 'both' && showAISummary.value;
    });

    // Show FDA data directly (for fda_only mode or when no AI summary in both mode)
    const showFDAOnly = computed(() => {
      if (displayMode.value === 'fda_only') return true;
      // Also show FDA directly if mode is 'both' but no AI summary
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

      // Default to 99 if no stock info, or use stock quantity
      let max = stock > 0 ? stock : 99;

      // If max_quantity_per_order is set and is less than stock, use it
      if (maxPerOrder && maxPerOrder > 0 && maxPerOrder < max) {
        max = maxPerOrder;
      }

      // Ensure minimum of 1 if drug is available
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

    // Get quantity of this drug already in cart
    const quantityInCart = computed(() => {
      if (!drug.value?._id || !cart.value) return 0;
      const cartItem = cart.value.find(item => item.drugId === drug.value._id);
      return cartItem ? cartItem.quantity : 0;
    });

    // Calculate remaining quantity that can be added
    const remainingAddable = computed(() => {
      const maxPerOrder = drug.value?.max_quantity_per_order;
      if (!maxPerOrder || maxPerOrder <= 0) return 99; // No limit
      return Math.max(0, maxPerOrder - quantityInCart.value);
    });

    // Check if max quantity has been reached in cart
    const maxReachedInCart = computed(() => {
      const maxPerOrder = drug.value?.max_quantity_per_order;
      if (!maxPerOrder || maxPerOrder <= 0) return false;
      return quantityInCart.value >= maxPerOrder;
    });

    // Message to show when max reached
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
        // Check if max already reached in cart
        if (maxReachedInCart.value) {
          return;
        }

        const requestedQty = quantity.value;
        const availableQty = stockQuantity.value;

        // Check stock availability
        if (requestedQty > availableQty) {
          quantity.value = availableQty;
          return;
        }

        // Check if adding would exceed max per order
        const actualQtyToAdd = Math.min(requestedQty, remainingAddable.value);
        if (actualQtyToAdd <= 0) {
          return;
        }

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
      // Close the quick-view modal if open
      quickViewDrug.value = null;

      // Navigate to the new drug page
      // Use replace + push pattern to force component reload when navigating to same route type
      const targetPath = `/app/patient/pharmacy/drug/${drugId}`;

      if (route.path === targetPath) {
        // Same drug, just close the modal
        return;
      }

      // Force navigation with page reload for proper data refresh
      router.push(targetPath).then(() => {
        // Scroll to top after navigation
        window.scrollTo(0, 0);
      });
    };

    const notifyWhenAvailable = () => {
      alert('You will be notified when this medication is back in stock.');
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

    // Watch for route changes to reload drug data when navigating between drugs
    watch(
      () => route.params.id,
      async (newId, oldId) => {
        if (newId && newId !== oldId) {
          // Reset state for new drug
          loading.value = true;
          drug.value = null;
          safetyInfo.value = null;
          similarDrugs.value = [];
          quantity.value = 1;
          selectedBatch.value = null;
          safetyAccordionOpen.value = false;

          await fetchDrugDetails(newId);

          // Fetch safety info and similar drugs
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

        // Fetch FDA safety info and similar drugs in background (parallel)
        safetyInfoLoading.value = true;

        const [safetyResult, similarResult] = await Promise.allSettled([
          fetchDrugSafetyInfo(drugId),
          fetchSimilarDrugs({ drugId, limit: 8 }),
        ]);

        // Process safety info result
        if (safetyResult.status === 'fulfilled') {
          safetyInfo.value = safetyResult.value;
        } else {
          console.error('Error fetching safety info:', safetyResult.reason);
        }

        // Process similar drugs result
        if (similarResult.status === 'fulfilled') {
          similarDrugs.value = similarResult.value || [];
        } else {
          console.error('Error fetching similar drugs:', similarResult.reason);
        }

        safetyInfoLoading.value = false;
        safetyInfoFetched.value = true;
      }
    });

    const toggleSafetyInfo = () => {
      safetyInfoExpanded.value = !safetyInfoExpanded.value;
    };

    const toggleSafetyAccordion = () => {
      if (!safetyInfoLoading.value) {
        safetyAccordionOpen.value = !safetyAccordionOpen.value;
      }
    };

    const formatSafetyDate = (date) => {
      if (!date) return '';
      return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    // Quick View Modal for Similar Drugs
    const openQuickView = (drug) => {
      quickViewDrug.value = drug;
    };

    const closeQuickView = () => {
      quickViewDrug.value = null;
    };

    const getMatchTypeLabel = (type) => {
      const labels = {
        'generic': 'Same Generic',
        'category': 'Similar Category',
        'manual': 'Recommended',
      };
      return labels[type] || type;
    };

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
      safetyInfoExpanded,
      safetyAccordionOpen,
      hasSafetyData,
      displayMode,
      showAISummary,
      showFDAToggle,
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
      toggleSafetyInfo,
      toggleSafetyAccordion,
      formatSafetyDate,
      quickViewDrug,
      openQuickView,
      closeQuickView,
      getMatchTypeLabel,
    };
  },
};
</script>

<style scoped lang="scss">
// Breadcrumbs
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: $size-8;
  margin-bottom: $size-8;
  padding: 0 $size-16;

  .breadcrumb-item {
    display: flex;
    align-items: center;
    font-size: $size-12;
    color: #888;
    text-decoration: none;
    transition: color 0.2s ease;

    svg {
      width: 14px;
      height: 14px;
    }

    &:hover:not(.current) {
      color: $color-pri;
    }

    &.current {
      color: #555;
      font-weight: 500;
      max-width: 180px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .breadcrumb-sep {
    color: #d0d0d0;
    font-size: $size-11;
  }
}

.drug-page {
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: $size-32;
}

// Loading State
.loading-state {
  padding: $size-20;

  .skeleton-image {
    width: 100%;
    height: 200px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: $size-16;
    margin-bottom: $size-20;
  }

  .skeleton-content {
    .skeleton-line {
      height: 20px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: $size-4;
      margin-bottom: $size-12;

      &.wide { width: 80%; }
      &.medium { width: 60%; }
      &.short { width: 40%; }
    }
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
}

// Product Card
.product-card {
  background: white;
  border-radius: $size-20;
  margin: $size-16;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
}

.product-layout {
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 320px 1fr;
  }
}

// Image Section
.product-image-section {
  background: #fafafa;
  padding: $size-24;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (min-width: 768px) {
    min-height: 360px;
  }

  .image-container {
    position: relative;
    width: 100%;
    max-width: 280px;
    aspect-ratio: 1;
    background: white;
    border-radius: $size-16;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
      transform: scale(1.02);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: $size-16;
    }

    .image-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 64px;
        height: 64px;
        color: #ddd;
      }
    }

    .rx-tag {
      position: absolute;
      top: $size-12;
      right: $size-12;
      background: $color-pri;
      color: white;
      font-size: $size-11;
      font-weight: 700;
      padding: $size-4 $size-10;
      border-radius: $size-4;
    }
  }
}

// Info Section
.product-info-section {
  padding: $size-24;

  .product-header {
    margin-bottom: $size-20;

    .product-name {
      font-size: $size-22;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.3;
      margin: 0 0 $size-6 0;
    }

    .generic-name {
      font-size: $size-14;
      color: $color-pri;
      font-style: italic;
      margin: 0 0 $size-12 0;
    }

    .product-meta {
      display: flex;
      flex-wrap: wrap;
      gap: $size-8;
      margin-bottom: $size-10;

      .meta-item {
        background: #f5f5f5;
        color: #666;
        font-size: $size-12;
        padding: $size-4 $size-10;
        border-radius: $size-4;
      }
    }

    .manufacturer {
      font-size: $size-13;
      color: #888;
      margin: 0;

      strong {
        color: #555;
      }
    }
  }
}

// Price Block
.price-block {
  padding: $size-16 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
  margin-bottom: $size-20;

  .price-row {
    display: flex;
    align-items: baseline;
    gap: $size-12;
    margin-bottom: $size-8;

    .current-price {
      font-size: $size-28;
      font-weight: 800;
      color: #1a1a2e;
    }

    .original-price {
      font-size: $size-16;
      color: #aaa;
      text-decoration: line-through;
    }
  }

  .stock-badge {
    display: inline-flex;
    align-items: center;
    gap: $size-6;
    font-size: $size-12;
    font-weight: 600;
    padding: $size-6 $size-12;
    border-radius: $size-16;

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    &.in-stock {
      background: rgba(#22c55e, 0.1);
      color: #16a34a;
      .dot { background: #22c55e; }
    }

    &.low-stock {
      background: rgba(#f59e0b, 0.1);
      color: #d97706;
      .dot { background: #f59e0b; }
    }

    &.out-of-stock {
      background: rgba(#ef4444, 0.1);
      color: #dc2626;
      .dot { background: #ef4444; }
    }
  }
}

// Batch Selector
.batch-selector {
  margin-bottom: $size-20;

  label {
    display: block;
    font-size: $size-13;
    font-weight: 600;
    color: #555;
    margin-bottom: $size-10;
  }

  .batch-list {
    display: flex;
    flex-direction: column;
    gap: $size-8;

    .batch-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $size-12 $size-16;
      background: #f9f9f9;
      border: 2px solid transparent;
      border-radius: $size-10;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #f0f0f0;
      }

      &.selected {
        background: rgba($color-pri, 0.05);
        border-color: $color-pri;
      }

      .batch-name {
        font-size: $size-14;
        font-weight: 500;
        color: #333;
      }

      .batch-price {
        font-size: $size-14;
        font-weight: 700;
        color: $color-pri;
      }
    }
  }
}

// Cart Section
.cart-section {
  margin-bottom: $size-16;

  .quantity-row {
    display: flex;
    gap: $size-12;
  }

  .quantity-selector {
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: $size-10;

    .qty-btn {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;

      svg {
        width: 18px;
        height: 18px;
        color: #555;
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      &:not(:disabled):hover {
        background: #eee;
        svg { color: $color-pri; }
      }

      &:not(:disabled):active {
        background: #e0e0e0;
      }
    }

    .qty-display {
      min-width: 36px;
      text-align: center;
      font-size: $size-18;
      font-weight: 700;
      color: #1a1a2e;
    }
  }

  .add-cart-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-10;
    background: $color-pri;
    color: white;
    border: none;
    border-radius: $size-10;
    padding: $size-14 $size-20;
    font-size: $size-15;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
    -webkit-tap-highlight-color: transparent;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover:not(:disabled) {
      background: darken($color-pri, 8%);
    }

    &:active:not(:disabled) {
      transform: scale(0.98);
    }

    &:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
  }

  .cart-limit-notice {
    display: flex;
    align-items: flex-start;
    gap: $size-8;
    padding: $size-12;
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: $size-8;
    margin-top: $size-12;

    svg {
      width: 18px;
      height: 18px;
      color: #856404;
      flex-shrink: 0;
      margin-top: 1px;
    }

    span {
      font-size: $size-13;
      color: #856404;
      line-height: 1.4;
    }
  }

  .go-cart-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-10;
    background: #1a1a2e;
    color: white;
    border: none;
    border-radius: $size-10;
    padding: $size-14 $size-20;
    font-size: $size-15;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;
    -webkit-tap-highlight-color: transparent;
    margin-top: $size-12;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      background: #2d2d44;
    }
  }

  .max-qty-hint {
    font-size: $size-12;
    color: #888;
    margin: $size-8 0 0 0;
    text-align: right;
  }
}

// Out of Stock Section
.out-of-stock-section {
  .oos-text {
    font-size: $size-14;
    color: #888;
    margin: 0 0 $size-12 0;
  }

  .notify-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-8;
    width: 100%;
    padding: $size-14;
    background: white;
    border: 2px solid #ddd;
    border-radius: $size-10;
    font-size: $size-14;
    font-weight: 500;
    color: #555;
    cursor: pointer;
    transition: all 0.2s ease;

    svg {
      width: 18px;
      height: 18px;
    }

    &:hover {
      border-color: $color-pri;
      color: $color-pri;
    }
  }
}

// Rx Notice
.rx-notice {
  display: flex;
  align-items: flex-start;
  gap: $size-10;
  padding: $size-12 $size-14;
  background: #fff8e6;
  border-radius: $size-8;
  margin-top: $size-16;

  svg {
    width: 18px;
    height: 18px;
    color: #b8860b;
    flex-shrink: 0;
    margin-top: 1px;
  }

  span {
    font-size: $size-13;
    color: #8b6914;
    line-height: 1.4;
  }
}

// Details Sections
.details-sections {
  padding: 0 $size-16;
  margin-top: $size-24;
}

.detail-card {
  background: white;
  border-radius: $size-14;
  margin-bottom: $size-12;
  overflow: hidden;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);

  .detail-header {
    display: flex;
    align-items: center;
    gap: $size-10;
    padding: $size-16;
    background: #fafafa;
    border-bottom: 1px solid #eee;

    svg {
      width: 20px;
      height: 20px;
      color: $color-pri;
    }

    h3 {
      font-size: $size-14;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0;
    }
  }

  .detail-content {
    padding: $size-16;

    p {
      font-size: $size-14;
      color: #555;
      line-height: 1.6;
      margin: 0;
    }

    ul {
      margin: 0;
      padding-left: $size-20;

      li {
        font-size: $size-14;
        color: #555;
        line-height: 1.6;
        margin-bottom: $size-6;

        &:last-child { margin-bottom: 0; }
      }
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: $size-8;

      .tag {
        font-size: $size-12;
        padding: $size-6 $size-12;
        background: #f5f5f5;
        color: #666;
        border-radius: $size-6;

        &.category {
          background: rgba($color-pri, 0.08);
          color: $color-pri;
        }
      }
    }
  }

  &.warning {
    .detail-header {
      background: #fff8e6;
      border-color: #ffe4a0;

      svg { color: #b8860b; }
      h3 { color: #8b6914; }
    }

    .detail-content {
      background: #fffdf5;

      li { color: #8b6914; }
    }
  }
}

// Similar Section
.similar-section {
  padding: 0 $size-16;
  margin-top: $size-32;

  .section-title {
    font-size: $size-18;
    font-weight: 700;
    color: #1a1a2e;
    margin: 0 0 $size-16 0;

    .disclaimer {
      font-size: $size-11;
      font-weight: 400;
      font-style: italic;
      color: #6b7280;
      margin-left: $size-4;
    }
  }

  .similar-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: $size-12;
  }

  .similar-card {
    background: white;
    border-radius: $size-12;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .similar-image {
      height: 100px;
      background: #fafafa;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: $size-8;
      }

      .similar-placeholder {
        svg {
          width: 32px;
          height: 32px;
          color: #ddd;
        }
      }
    }

    .similar-info {
      padding: $size-12;

      .similar-name {
        display: block;
        font-size: $size-12;
        font-weight: 500;
        color: #333;
        margin-bottom: $size-4;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .similar-price {
        font-size: $size-14;
        font-weight: 700;
        color: $color-pri;
      }
    }
  }
}

// Quick View Button and Rx Tag on Similar Cards
.similar-image {
  position: relative;

  .similar-rx-tag {
    position: absolute;
    top: $size-6;
    left: $size-6;
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    color: white;
    font-size: 9px;
    font-weight: 700;
    padding: 3px 6px;
    border-radius: 4px;
    letter-spacing: 0.5px;
    z-index: 1;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .quick-view-btn {
    position: absolute;
    top: $size-8;
    right: $size-8;
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.95);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transform: scale(0.8);
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    z-index: 2;

    svg {
      width: 16px;
      height: 16px;
      color: $color-pri;
    }

    &:hover {
      background: $color-pri;

      svg {
        color: white;
      }
    }
  }

  &:hover .quick-view-btn {
    opacity: 1;
    transform: scale(1);
  }
}

// Quick View Modal
.quick-view-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $size-16;
  backdrop-filter: blur(4px);
}

.quick-view-modal {
  background: white;
  border-radius: $size-20;
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.quick-view-close {
  position: absolute;
  top: $size-12;
  right: $size-12;
  width: 36px;
  height: 36px;
  background: #f3f4f6;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;

  svg {
    width: 20px;
    height: 20px;
    color: #6b7280;
  }

  &:hover {
    background: #e5e7eb;

    svg {
      color: #374151;
    }
  }
}

.quick-view-content {
  padding: $size-24;
}

.quick-view-image {
  width: 100%;
  height: 200px;
  background: #f9fafb;
  border-radius: $size-16;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: $size-20;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: $size-16;
  }
}

.quick-view-placeholder {
  svg {
    width: 64px;
    height: 64px;
    color: #d1d5db;
  }
}

.quick-view-details {
  text-align: center;
}

.quick-view-name {
  font-size: $size-20;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 $size-4 0;
}

.quick-view-generic {
  font-size: $size-14;
  color: #6b7280;
  margin: 0 0 $size-12 0;
}

.quick-view-meta {
  display: flex;
  flex-wrap: wrap;
  gap: $size-12;
  justify-content: center;
  margin-bottom: $size-16;

  .meta-item {
    display: flex;
    align-items: center;
    gap: $size-4;
    font-size: $size-12;
    color: #6b7280;
    background: #f3f4f6;
    padding: $size-6 $size-10;
    border-radius: $size-6;

    svg {
      width: 14px;
      height: 14px;
    }
  }
}

.quick-view-price {
  font-size: $size-28;
  font-weight: 800;
  color: $color-pri;
  margin-bottom: $size-12;
}

.quick-view-status-row {
  display: flex;
  flex-wrap: wrap;
  gap: $size-8;
  justify-content: center;
  margin-bottom: $size-16;
}

.quick-view-stock {
  display: inline-flex;
  align-items: center;
  gap: $size-6;
  font-size: $size-13;
  font-weight: 500;
  padding: $size-8 $size-14;
  border-radius: $size-8;

  svg {
    width: 16px;
    height: 16px;
  }

  &.in-stock {
    background: #dcfce7;
    color: #166534;
  }

  &.out-of-stock {
    background: #fee2e2;
    color: #991b1b;
  }
}

.quick-view-rx-notice {
  display: flex;
  align-items: center;
  gap: $size-10;
  padding: $size-12 $size-16;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
  border-radius: $size-10;
  margin-bottom: $size-16;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: #d97706;
  }

  span {
    font-size: $size-12;
    font-weight: 500;
    color: #92400e;
    line-height: 1.4;
    text-align: left;
  }
}

.quick-view-match {
  margin-bottom: $size-20;

  .match-badge {
    display: inline-block;
    font-size: $size-11;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: $size-6 $size-12;
    border-radius: $size-20;

    &.generic {
      background: #dbeafe;
      color: #1e40af;
    }

    &.category {
      background: #fef3c7;
      color: #92400e;
    }

    &.manual {
      background: #ede9fe;
      color: #5b21b6;
    }
  }
}

.quick-view-actions {
  .view-details-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-8;
    padding: $size-14 $size-24;
    background: $color-pri;
    color: white;
    border: none;
    border-radius: $size-12;
    font-size: $size-15;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    svg {
      width: 18px;
      height: 18px;
    }

    &:hover {
      background: darken($color-pri, 8%);
      transform: translateY(-1px);
    }
  }
}

// Modal Transition Animations
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;

  .quick-view-modal {
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .quick-view-modal {
    transform: scale(0.95) translateY(20px);
    opacity: 0;
  }
}

// Error State
.error-state {
  text-align: center;
  padding: $size-48 $size-24;

  svg {
    width: 64px;
    height: 64px;
    color: #ddd;
    margin-bottom: $size-16;
  }

  h3 {
    font-size: $size-18;
    font-weight: 600;
    color: #333;
    margin: 0 0 $size-8 0;
  }

  p {
    font-size: $size-14;
    color: #888;
    margin: 0 0 $size-24 0;
  }

  button {
    display: inline-flex;
    align-items: center;
    gap: $size-8;
    padding: $size-12 $size-20;
    background: $color-pri;
    color: white;
    border: none;
    border-radius: $size-8;
    font-size: $size-14;
    font-weight: 500;
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
      color: white;
      margin: 0;
    }
  }
}

// Cart Toast
.cart-toast {
  position: fixed;
  bottom: $size-24;
  left: $size-16;
  right: $size-16;
  max-width: 400px;
  margin: 0 auto;
  background: #1a1a2e;
  border-radius: $size-12;
  padding: $size-14 $size-16;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $size-12;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

  .toast-content {
    display: flex;
    align-items: center;
    gap: $size-12;

    svg {
      width: 24px;
      height: 24px;
      color: #22c55e;
      flex-shrink: 0;
    }

    .toast-text {
      strong {
        display: block;
        font-size: $size-14;
        color: white;
        margin-bottom: 2px;
      }

      span {
        font-size: $size-12;
        color: #aaa;
      }
    }
  }

  .toast-action {
    background: white;
    color: #1a1a2e;
    border: none;
    border-radius: $size-6;
    padding: $size-8 $size-14;
    font-size: $size-13;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;

    &:hover {
      background: #f5f5f5;
    }
  }
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// Floating Cart Button
.floating-cart-btn {
  position: fixed;
  bottom: $size-24;
  right: $size-24;
  width: 56px;
  height: 56px;
  background: $color-pri;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba($color-pri, 0.35);
  z-index: 100;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 24px rgba($color-pri, 0.45);
  }

  svg {
    width: 24px;
    height: 24px;
    color: white;
  }

  .cart-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 22px;
    height: 22px;
    background: #dc2626;
    color: white;
    font-size: $size-11;
    font-weight: 700;
    border-radius: 11px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 $size-6;
  }
}

// Zoom Modal
.zoom-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: $size-20;

  img {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
  }

  .zoom-close {
    position: absolute;
    top: $size-20;
    right: $size-20;
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    svg {
      width: 24px;
      height: 24px;
      color: white;
    }

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

// FDA Safety Information Section
.safety-info-section {
  background: white;
  border-radius: $size-16;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-top: $size-16;

  .safety-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-16 $size-20;
    cursor: pointer;
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border-bottom: 1px solid #bbf7d0;
    transition: background 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    }
  }

  .safety-title {
    display: flex;
    align-items: center;
    gap: $size-10;
    font-size: $size-14;
    font-weight: 600;
    color: #166534;

    svg {
      width: 20px;
      height: 20px;
      color: #16a34a;
    }
  }

  .source-badge {
    font-size: $size-10;
    font-weight: 500;
    background: #16a34a;
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .accordion-arrow {
    width: 20px;
    height: 20px;
    color: #166534;
    transition: transform 0.3s ease;
    flex-shrink: 0;

    &.expanded {
      transform: rotate(180deg);
    }
  }

  .safety-accordion-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease;

    &.expanded {
      max-height: 10000px; // Large enough to fit all content
    }
  }

  .safety-toggle {
    svg {
      width: 18px;
      height: 18px;
      color: #166534;
      transition: transform 0.3s ease;

      &.expanded {
        transform: rotate(180deg);
      }
    }
  }

  .safety-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-12;
    padding: $size-24;
    color: #6b7280;
    font-size: $size-13;

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #e5e7eb;
      border-top-color: #16a34a;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }

  .no-safety-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $size-32 $size-24;
    text-align: center;

    .no-data-icon {
      width: 48px;
      height: 48px;
      margin-bottom: $size-16;

      svg {
        width: 100%;
        height: 100%;
        color: #9ca3af;
      }
    }

    .no-data-title {
      font-size: $size-16;
      font-weight: 600;
      color: #374151;
      margin: 0 0 $size-8 0;
    }

    .no-data-text {
      font-size: $size-14;
      color: #6b7280;
      margin: 0;
      max-width: 300px;
      line-height: 1.5;
    }
  }

  .safety-content {
    // FDA fallback content - no max-height needed, parent accordion handles expand/collapse
    padding: 0;
  }

  .safety-card {
    padding: $size-16 $size-20;
    border-bottom: 1px solid #f3f4f6;

    &:last-of-type {
      border-bottom: none;
    }

    &.danger {
      background: #fef2f2;
      border-left: 4px solid #dc2626;

      .safety-card-header {
        color: #991b1b;

        svg {
          color: #dc2626;
        }
      }
    }

    &.warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;

      .safety-card-header {
        color: #92400e;

        svg {
          color: #f59e0b;
        }
      }
    }

    &.info {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;

      .safety-card-header {
        color: #1e40af;

        svg {
          color: #3b82f6;
        }
      }
    }
  }

  .safety-card-header {
    display: flex;
    align-items: center;
    gap: $size-8;
    margin-bottom: $size-10;
    color: #374151;

    svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    strong {
      font-size: $size-13;
      font-weight: 600;
    }
  }

  .safety-card-content {
    p {
      font-size: $size-12;
      line-height: 1.6;
      color: #4b5563;
      margin-bottom: $size-8;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .safety-footer {
    padding: $size-12 $size-20;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;

    .source-text {
      display: block;
      font-size: $size-10;
      color: #6b7280;
      margin-bottom: $size-4;
    }

    .disclaimer {
      display: block;
      font-size: $size-10;
      color: #9ca3af;
      font-style: italic;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// AI Summary Section Styles
.ai-summary-section {
  padding: $size-20;

  .ai-overview {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border-radius: $size-12;
    padding: $size-16 $size-20;
    margin-bottom: $size-20;
    border-left: 4px solid #0ea5e9;

    p {
      font-size: $size-14;
      line-height: 1.7;
      color: #0c4a6e;
      margin: 0;
    }
  }

  .ai-section {
    margin-bottom: $size-16;
    padding: $size-16;
    border-radius: $size-12;
    background: #fafafa;
    border: 1px solid #f0f0f0;

    h4 {
      display: flex;
      align-items: center;
      gap: $size-8;
      font-size: $size-13;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 $size-12 0;

      svg {
        width: 18px;
        height: 18px;
        color: #6b7280;
      }
    }

    ul {
      margin: 0;
      padding-left: $size-20;

      li {
        font-size: $size-13;
        line-height: 1.6;
        color: #4b5563;
        margin-bottom: $size-6;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    p {
      font-size: $size-13;
      line-height: 1.6;
      color: #4b5563;
      margin: 0;
    }

    // Specific section styles
    &.ai-warnings {
      background: #fffbeb;
      border-color: #fcd34d;

      h4 {
        color: #92400e;

        svg {
          color: #f59e0b;
        }
      }

      li {
        color: #78350f;
      }
    }

    &.ai-side-effects {
      background: #f0fdf4;
      border-color: #86efac;

      h4 {
        color: #166534;

        svg {
          color: #22c55e;
        }
      }
    }

    &.ai-serious {
      background: #fef2f2;
      border-color: #fca5a5;

      h4 {
        color: #991b1b;

        svg {
          color: #ef4444;
        }
      }

      li {
        color: #7f1d1d;
      }
    }

    &.ai-avoid {
      background: #fdf4ff;
      border-color: #e879f9;

      h4 {
        color: #86198f;

        svg {
          color: #d946ef;
        }
      }

      li {
        color: #701a75;
      }
    }

    &.ai-interactions {
      background: #fff7ed;
      border-color: #fdba74;

      h4 {
        color: #9a3412;

        svg {
          color: #f97316;
        }
      }

      li {
        color: #7c2d12;
      }
    }

    &.ai-food {
      background: #fefce8;
      border-color: #fde047;

      h4 {
        color: #854d0e;

        svg {
          color: #eab308;
        }
      }

      li {
        color: #713f12;
      }
    }

    &.ai-pregnancy {
      background: #fdf2f8;
      border-color: #f9a8d4;

      h4 {
        color: #9d174d;

        svg {
          color: #ec4899;
        }
      }

      p {
        color: #831843;
      }
    }

    &.ai-tips {
      background: #ecfdf5;
      border-color: #6ee7b7;

      h4 {
        color: #065f46;

        svg {
          color: #10b981;
        }
      }

      li {
        color: #064e3b;
      }
    }

    &.ai-custom {
      background: #f9fafb;
      border-color: #e5e7eb;

      &.severity-info {
        background: #eff6ff;
        border-color: #93c5fd;

        h4 {
          color: #1e40af;
          svg { color: #3b82f6; }
        }

        p { color: #1e3a8a; }
      }

      &.severity-warning {
        background: #fffbeb;
        border-color: #fcd34d;

        h4 {
          color: #92400e;
          svg { color: #f59e0b; }
        }

        p { color: #78350f; }
      }

      &.severity-danger {
        background: #fef2f2;
        border-color: #fca5a5;

        h4 {
          color: #991b1b;
          svg { color: #ef4444; }
        }

        p { color: #7f1d1d; }
      }
    }
  }

  // Side Effects Chips
  .side-effects-chips {
    display: flex;
    flex-wrap: wrap;
    gap: $size-8;

    .effect-chip {
      background: #dcfce7;
      color: #166534;
      font-size: $size-12;
      font-weight: 500;
      padding: $size-6 $size-12;
      border-radius: $size-16;
      border: 1px solid #86efac;
    }
  }

  // Serious Side Effects Notice
  .serious-notice {
    font-size: $size-12;
    font-weight: 500;
    color: #dc2626;
    margin: 0 0 $size-8 0;
    font-style: italic;
  }

  .serious-list {
    margin: 0;
    padding-left: $size-18;

    li {
      font-size: $size-13;
      line-height: 1.5;
      color: #7f1d1d;
      margin-bottom: $size-6;
      position: relative;

      &::marker {
        color: #ef4444;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .tips-list {
    margin: 0;
    padding-left: 0;
    list-style: none;

    li {
      font-size: $size-13;
      line-height: 1.5;
      color: #064e3b;
      margin-bottom: $size-8;
      padding-left: $size-20;
      position: relative;

      &::before {
        content: "✓";
        position: absolute;
        left: 0;
        color: #10b981;
        font-weight: bold;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  // Full Info Toggle
  .full-info-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-8;
    padding: $size-12 $size-16;
    margin-top: $size-16;
    background: #f3f4f6;
    border-radius: $size-8;
    cursor: pointer;
    transition: all 0.2s ease;

    span {
      font-size: $size-13;
      font-weight: 500;
      color: #4b5563;
    }

    svg {
      width: 16px;
      height: 16px;
      color: #6b7280;
      transition: transform 0.3s ease;

      &.expanded {
        transform: rotate(180deg);
      }
    }

    &:hover {
      background: #e5e7eb;

      span {
        color: #1f2937;
      }
    }
  }

  // Full FDA Content (Expandable)
  .full-fda-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease;
    margin-top: $size-16;

    &.expanded {
      max-height: 3000px;
    }

    .fda-section-title {
      font-size: $size-12;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: $size-12;
      padding-bottom: $size-8;
      border-bottom: 1px solid #e5e7eb;
    }

    .safety-card {
      margin-bottom: $size-12;
      border-radius: $size-10;
      overflow: hidden;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
