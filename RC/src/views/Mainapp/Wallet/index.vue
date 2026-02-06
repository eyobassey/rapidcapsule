<template>
  <div class="wallet-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="notification-btn" @click="$router.push('/app/patient/notifications')">
        <v-icon name="hi-bell" scale="1.1" />
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link desktop-only" @click="$router.push('/app/patient/dashboard')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Dashboard</span>
          </button>
          <div class="hero__badge">
            <div class="badge-pulse"></div>
            <v-icon name="bi-wallet2" />
            <span>Financial Hub</span>
          </div>
          <h1 class="hero__title">
            My <span class="hero__title-accent">Wallet</span>
          </h1>
          <p class="hero__subtitle">
            Manage your funds, health credits, and payment methods all in one place.
          </p>
          <div class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ formatCurrency(walletBalance) }}</span>
              <span class="hero-stat__label">Balance</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value hero-stat__value--success">{{ totalCredits }}</span>
              <span class="hero-stat__label">AI Credits</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value hero-stat__value--warning">{{ userCards.length }}</span>
              <span class="hero-stat__label">Cards</span>
            </div>
          </div>
        </div>
        <div class="hero__visual">
          <div class="wallet-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="bi-wallet2" />
            </div>
          </div>
          <div class="floating-icons">
            <div class="float-icon float-icon--1"><v-icon name="hi-credit-card" /></div>
            <div class="float-icon float-icon--2"><v-icon name="hi-sparkles" /></div>
            <div class="float-icon float-icon--3"><v-icon name="hi-currency-dollar" /></div>
          </div>
        </div>
      </section>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading your wallet...</p>
      </div>

      <!-- Bento Grid -->
      <div v-else class="bento-grid">
        <!-- Wallet Balance Card -->
        <div class="bento-card bento-card--balance">
          <div class="balance-card">
            <div class="balance-header">
              <div class="balance-label">
                <v-icon name="bi-wallet2" scale="1" />
                <span>Available Balance</span>
              </div>
              <div class="balance-badge" :class="{ active: allowSpecialistCharge }">
                <v-icon name="fa-stethoscope" scale="0.7" />
                <span>{{ allowSpecialistCharge ? 'Auto-pay On' : 'Auto-pay Off' }}</span>
              </div>
            </div>
            <div class="balance-amount">
              <span class="currency">&#8358;</span>
              <span class="amount">{{ formattedBalance }}</span>
            </div>
            <div class="balance-actions">
              <button class="action-btn primary" @click="showTopUpModal = true">
                <v-icon name="hi-plus" scale="0.9" />
                <span>Add Funds</span>
              </button>
              <button class="action-btn secondary" @click="scrollToTransactions">
                <v-icon name="hi-clock" scale="0.9" />
                <span>History</span>
              </button>
            </div>
            <div class="balance-setting">
              <div class="setting-info">
                <span>Allow specialists to charge wallet</span>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="allowSpecialistCharge"
                  @change="toggleWalletSetting($event.target.checked)"
                  :disabled="updatingWalletSetting"
                />
                <span class="slider"></span>
              </label>
            </div>
          </div>
          <!-- Decorative circles -->
          <div class="card-decoration circle-1"></div>
          <div class="card-decoration circle-2"></div>
        </div>

        <!-- AI Credits Card -->
        <div class="bento-card bento-card--credits">
          <div class="card-header">
            <div class="card-icon card-icon--credits">
              <v-icon name="hi-sparkles" scale="1.1" />
            </div>
            <div class="card-title-group">
              <h3>AI Health Summary Credits</h3>
              <p>Generate detailed health reports with AI</p>
            </div>
            <button v-if="canShareCredits" class="share-credits-btn" @click="openShareCreditsModal">
              <v-icon name="hi-share" scale="0.85" />
              Share
            </button>
          </div>
          <div class="credits-display">
            <div class="credits-main">
              <span class="credits-number">{{ totalCredits }}</span>
              <span class="credits-label">credits remaining</span>
            </div>
            <div class="credits-progress">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: creditsProgressWidth + '%' }"></div>
              </div>
            </div>
            <div class="credits-breakdown">
              <div class="breakdown-item">
                <span class="item-value free">{{ healthCredits?.free_remaining || 0 }}/{{ healthCredits?.free_total || 5 }}</span>
                <span class="item-label">Free</span>
              </div>
              <div class="breakdown-divider"></div>
              <div class="breakdown-item">
                <span class="item-value purchased">{{ healthCredits?.purchased || 0 }}</span>
                <span class="item-label">Purchased</span>
              </div>
              <div class="breakdown-divider"></div>
              <div class="breakdown-item">
                <span class="item-value gifted">{{ healthCredits?.gifted || 0 }}</span>
                <span class="item-label">Gifted</span>
              </div>
            </div>
          </div>
          <div v-if="hasUnlimited" class="unlimited-badge">
            <v-icon name="hi-check-circle" scale="0.9" />
            <span>Unlimited Monthly</span>
            <span class="expires">expires {{ formatDate(healthCredits?.unlimited_expires) }}</span>
          </div>
          <button class="buy-credits-btn" @click="scrollToPlans">
            <v-icon name="hi-plus" scale="0.9" />
            Buy More Credits
          </button>
        </div>

        <!-- Quick Actions -->
        <div class="bento-card bento-card--actions">
          <div class="card-header compact">
            <div class="card-icon card-icon--actions">
              <v-icon name="hi-lightning-bolt" scale="1.1" />
            </div>
            <h3>Quick Actions</h3>
          </div>
          <div class="quick-actions-grid">
            <button class="quick-action" @click="$router.push('/app/patient/referals-and-rewards')">
              <div class="action-icon referral"><v-icon name="hi-gift" scale="1" /></div>
              <span>Refer & Earn</span>
            </button>
            <button class="quick-action" @click="$router.push('/app/patient/pharmacy/orders')">
              <div class="action-icon orders"><v-icon name="hi-shopping-bag" scale="1" /></div>
              <span>My Orders</span>
            </button>
            <button class="quick-action" @click="$router.push('/app/patient/prescriptions')">
              <div class="action-icon prescriptions"><v-icon name="hi-document-text" scale="1" /></div>
              <span>Prescriptions</span>
            </button>
            <button class="quick-action" @click="$router.push('/app/patient/appointmentsv2')">
              <div class="action-icon appointments"><v-icon name="hi-calendar" scale="1" /></div>
              <span>Appointments</span>
            </button>
          </div>
        </div>

        <!-- Payment Methods (Moved here) -->
        <div class="bento-card bento-card--cards">
          <div class="card-header">
            <div class="card-icon card-icon--cards">
              <v-icon name="hi-credit-card" scale="1.1" />
            </div>
            <div class="card-title-group">
              <h3>Payment Methods</h3>
              <p>Manage your saved cards</p>
            </div>
            <button class="add-card-btn" @click="addCard">
              <v-icon name="hi-plus" scale="0.9" />
              Add Card
            </button>
          </div>
          <div v-if="userCards.length" class="cards-list">
            <div
              v-for="card in userCards"
              :key="card._id"
              class="saved-card"
              :class="{ default: card.is_default }"
            >
              <div class="card-brand">
                <v-icon :name="getCardIcon(card.card_type)" scale="1.4" />
              </div>
              <div class="card-info">
                <span class="card-number">**** **** **** {{ card.last4 }}</span>
                <span class="card-expiry">Expires {{ card.exp_month }}/{{ card.exp_year }}</span>
              </div>
              <div class="card-actions">
                <button
                  v-if="!card.is_default"
                  class="set-default-btn"
                  @click="setDefaultCard(card)"
                  title="Set as Default"
                >
                  <v-icon name="hi-star" scale="0.85" />
                </button>
                <button class="remove-card-btn" @click="removeCard(card)" title="Remove Card">
                  <v-icon name="hi-trash" scale="0.85" />
                </button>
              </div>
              <div v-if="card.is_default" class="default-badge">Default</div>
            </div>
          </div>
          <div v-else class="cards-empty">
            <v-icon name="hi-credit-card" scale="1.5" />
            <p>No cards saved yet</p>
            <button class="add-first-card-btn" @click="addCard">
              <v-icon name="hi-plus" scale="0.85" />
              Add Your First Card
            </button>
          </div>
        </div>

        <!-- Health Plans -->
        <div ref="plansSection" class="bento-card bento-card--plans">
          <div class="card-header">
            <div class="card-icon card-icon--plans">
              <v-icon name="hi-collection" scale="1.1" />
            </div>
            <div class="card-title-group">
              <h3>Health Credit Plans</h3>
              <p>Choose a plan that suits your needs</p>
            </div>
          </div>
          <div v-if="loadingPlans" class="plans-loading">
            <div class="loading-spinner small"></div>
            <span>Loading plans...</span>
          </div>
          <div v-else-if="healthPlans.length" class="plans-grid">
            <div
              v-for="plan in healthPlans"
              :key="plan._id"
              class="plan-card"
              :class="{ popular: plan.is_popular, unlimited: plan.is_unlimited }"
            >
              <div v-if="plan.is_popular" class="popular-badge">Most Popular</div>
              <div class="plan-icon">
                <v-icon :name="plan.is_unlimited ? 'hi-star' : 'hi-sparkles'" scale="1.2" />
              </div>
              <h4 class="plan-name">{{ plan.name }}</h4>
              <p class="plan-description">{{ plan.description }}</p>
              <div class="plan-credits">
                <span class="credits-value">{{ plan.is_unlimited ? 'Unlimited' : plan.credits }}</span>
                <span class="credits-unit">{{ plan.is_unlimited ? 'for 30 days' : 'credits' }}</span>
              </div>
              <div class="plan-price">
                <span class="price-currency">&#8358;</span>
                <span class="price-value">{{ formatNumber(plan.price) }}</span>
              </div>
              <button
                class="plan-btn"
                @click="openPurchaseModal(plan)"
                :disabled="purchasingPlan"
              >
                {{ purchasingPlan ? 'Processing...' : 'Purchase' }}
              </button>
            </div>
          </div>
          <div v-else class="plans-empty">
            <v-icon name="hi-collection" scale="2" />
            <p>No plans available at the moment</p>
          </div>
        </div>

        <!-- Transaction History -->
        <div ref="transactionsSection" class="bento-card bento-card--transactions">
          <div class="card-header">
            <div class="card-icon card-icon--transactions">
              <v-icon name="hi-switch-vertical" scale="1.1" />
            </div>
            <div class="card-title-group">
              <h3>Transaction History</h3>
              <p>Your wallet activity</p>
            </div>
            <button class="download-btn" @click="downloadWalletStatement" title="Download Statement">
              <v-icon name="hi-download" scale="0.9" />
            </button>
          </div>
          <div class="filter-tabs">
            <button
              v-for="filter in transactionFilters"
              :key="filter.value"
              class="filter-tab"
              :class="{ active: transactionFilter === filter.value }"
              @click="setTransactionFilter(filter.value)"
            >
              {{ filter.label }}
            </button>
          </div>
          <div v-if="loadingTransactions" class="transactions-loading">
            <div class="loading-spinner small"></div>
          </div>
          <div v-else-if="paginatedTransactions.length" class="transactions-list">
            <div
              v-for="txn in paginatedTransactions"
              :key="txn._id"
              class="transaction-item"
            >
              <div class="txn-icon" :class="isWalletTxnPositive(txn) ? 'credit' : 'debit'">
                <v-icon :name="getTransactionIcon(txn.type)" scale="0.9" />
              </div>
              <div class="txn-details">
                <span class="txn-title">{{ txn.narration || txn.description || txn.type }}</span>
                <span class="txn-date">{{ formatDateTime(txn.created_at || txn.createdAt) }}</span>
              </div>
              <div class="txn-amount" :class="{ credit: isWalletTxnPositive(txn), debit: !isWalletTxnPositive(txn) }">
                {{ isWalletTxnPositive(txn) ? '+' : '-' }}&#8358;{{ formatNumber(txn.amount) }}
              </div>
            </div>
          </div>
          <div v-else class="transactions-empty">
            <v-icon name="hi-inbox" scale="1.5" />
            <p>No transactions yet</p>
          </div>
          <!-- Pagination -->
          <div v-if="transactionTotalPages > 1" class="pagination">
            <button
              class="pagination-btn"
              :disabled="transactionPage === 1"
              @click="goToTransactionPage(transactionPage - 1)"
            >
              <v-icon name="hi-chevron-left" scale="0.8" />
              Prev
            </button>
            <div class="pagination-numbers">
              <button
                v-for="page in transactionPageNumbers"
                :key="page"
                class="pagination-number"
                :class="{ active: page === transactionPage, dots: page === '...' }"
                :disabled="page === '...'"
                @click="page !== '...' && goToTransactionPage(page)"
              >
                {{ page }}
              </button>
            </div>
            <button
              class="pagination-btn"
              :disabled="transactionPage === transactionTotalPages"
              @click="goToTransactionPage(transactionPage + 1)"
            >
              Next
              <v-icon name="hi-chevron-right" scale="0.8" />
            </button>
          </div>
        </div>

        <!-- AI Credits History -->
        <div class="bento-card bento-card--credit-history">
          <div class="card-header">
            <div class="card-icon card-icon--credit-history">
              <v-icon name="hi-sparkles" scale="1.1" />
            </div>
            <div class="card-title-group">
              <h3>AI Credits History</h3>
              <p>Credit usage and purchases</p>
            </div>
            <button class="download-btn" @click="downloadCreditsStatement" title="Download Statement">
              <v-icon name="hi-download" scale="0.9" />
            </button>
          </div>
          <div v-if="loadingCreditTransactions" class="transactions-loading">
            <div class="loading-spinner small"></div>
          </div>
          <div v-else-if="paginatedCreditTransactions.length" class="transactions-list">
            <div
              v-for="txn in paginatedCreditTransactions"
              :key="txn._id"
              class="transaction-item"
            >
              <div class="txn-icon" :class="getCreditTxnType(txn)">
                <v-icon :name="getCreditTransactionIcon(getCreditTxnType(txn))" scale="0.9" />
              </div>
              <div class="txn-details">
                <span class="txn-title">{{ getCreditTxnDescription(txn) }}</span>
                <span class="txn-date">{{ formatDateTime(txn.created_at) }}</span>
              </div>
              <div class="txn-credits" :class="{ positive: isCreditPositive(txn), negative: !isCreditPositive(txn) }">
                {{ isCreditPositive(txn) ? '+' : '-' }}{{ getCreditAmount(txn) }} credits
              </div>
            </div>
          </div>
          <div v-else class="transactions-empty">
            <v-icon name="hi-sparkles" scale="1.5" />
            <p>No credit activity yet</p>
          </div>
          <!-- Pagination -->
          <div v-if="creditTotalPages > 1" class="pagination">
            <button
              class="pagination-btn"
              :disabled="creditTransactionPage === 1"
              @click="goToCreditPage(creditTransactionPage - 1)"
            >
              <v-icon name="hi-chevron-left" scale="0.8" />
              Prev
            </button>
            <div class="pagination-numbers">
              <button
                v-for="page in creditPageNumbers"
                :key="page"
                class="pagination-number"
                :class="{ active: page === creditTransactionPage, dots: page === '...' }"
                :disabled="page === '...'"
                @click="page !== '...' && goToCreditPage(page)"
              >
                {{ page }}
              </button>
            </div>
            <button
              class="pagination-btn"
              :disabled="creditTransactionPage === creditTotalPages"
              @click="goToCreditPage(creditTransactionPage + 1)"
            >
              Next
              <v-icon name="hi-chevron-right" scale="0.8" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Top Up Modal -->
    <div v-if="showTopUpModal" class="modal-overlay" @click.self="showTopUpModal = false">
      <div class="modal top-up-modal">
        <div class="modal-header">
          <div class="modal-icon">
            <v-icon name="hi-plus-circle" scale="1.2" />
          </div>
          <div class="modal-title-group">
            <h3>Add Funds to Wallet</h3>
            <p>Enter the amount you want to add</p>
          </div>
          <button class="close-btn" @click="showTopUpModal = false">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>
        <div class="modal-body">
          <div class="amount-input-wrapper">
            <span class="currency-symbol">&#8358;</span>
            <input
              type="number"
              v-model.number="topUpAmount"
              placeholder="0.00"
              min="100"
              step="100"
              class="amount-input"
            />
          </div>
          <div class="quick-amounts">
            <button
              v-for="amount in quickAmounts"
              :key="amount"
              @click="topUpAmount = amount"
              :class="{ active: topUpAmount === amount }"
              class="quick-amount-btn"
            >
              {{ formatCurrency(amount) }}
            </button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="showTopUpModal = false">Cancel</button>
          <button
            class="btn primary"
            @click="initiateTopUp"
            :disabled="!topUpAmount || topUpAmount < 100 || topUpLoading"
          >
            {{ topUpLoading ? 'Processing...' : 'Continue to Payment' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Purchase Plan Modal -->
    <div v-if="showPurchaseModal" class="modal-overlay" @click.self="closePurchaseModal">
      <div class="modal purchase-modal">
        <div class="modal-header">
          <div class="modal-icon premium">
            <v-icon name="hi-sparkles" scale="1.2" />
          </div>
          <div class="modal-title-group">
            <h3>Purchase {{ selectedPlan?.name }}</h3>
            <p>{{ selectedPlan?.description }}</p>
          </div>
          <button class="close-btn" @click="closePurchaseModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>
        <div class="modal-body">
          <div class="purchase-summary">
            <div class="summary-row">
              <span>Plan</span>
              <span>{{ selectedPlan?.name }}</span>
            </div>
            <div class="summary-row">
              <span>Credits</span>
              <span>{{ getPlanCreditsDisplay(selectedPlan) }}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-row total">
              <span>Total</span>
              <span>&#8358;{{ formatNumber(selectedPlan?.price) }}</span>
            </div>
          </div>
          <div class="payment-info">
            <div class="wallet-payment-card">
              <v-icon name="bi-wallet2" scale="1.2" />
              <div class="wallet-payment-text">
                <span class="wallet-payment-title">Pay from Wallet</span>
                <span class="wallet-payment-balance">Current Balance: &#8358;{{ formattedBalance }}</span>
              </div>
            </div>
          </div>
          <p v-if="walletBalance < selectedPlan?.price" class="insufficient-warning">
            <v-icon name="hi-exclamation" scale="0.85" />
            Insufficient wallet balance. Please <a href="#" @click.prevent="showTopUpModal = true; closePurchaseModal()">add funds</a> to continue.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" @click="closePurchaseModal">Cancel</button>
          <button
            class="btn primary"
            @click="purchasePlan"
            :disabled="purchasingPlan || walletBalance < selectedPlan?.price"
          >
            {{ purchasingPlan ? 'Processing...' : 'Pay ₦' + formatNumber(selectedPlan?.price) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Share Credits Modal -->
    <div v-if="showShareModal" class="modal-overlay" @click.self="closeShareModal">
      <div class="modal share-modal">
        <!-- Step 1: Search & Select -->
        <template v-if="shareStep === 1">
          <div class="modal-header">
            <div class="modal-icon share">
              <v-icon name="hi-gift" scale="1.2" />
            </div>
            <div class="modal-title-group">
              <h3>Share AI Credits</h3>
              <p>Send credits to another Rapid Capsule user</p>
            </div>
            <button class="close-btn" @click="closeShareModal">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="modal-body">
            <div class="search-input-wrapper">
              <v-icon name="hi-search" scale="0.9" />
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search by name or email..."
                @input="searchPatients"
                class="search-input"
              />
              <div v-if="searching" class="search-spinner"></div>
            </div>
            <div v-if="searchResults.length" class="search-results">
              <div
                v-for="patient in searchResults"
                :key="patient._id"
                class="patient-result"
                :class="{ selected: selectedPatient?._id === patient._id }"
                @click="selectPatient(patient)"
              >
                <div class="patient-avatar">{{ getInitials(patient) }}</div>
                <div class="patient-info">
                  <span class="patient-name">{{ patient.name }}</span>
                  <span class="patient-email">{{ patient.email }}</span>
                </div>
                <v-icon v-if="selectedPatient?._id === patient._id" name="hi-check-circle" scale="1" class="selected-icon" />
              </div>
            </div>
            <div v-else-if="searchQuery && !searching" class="no-results">
              <v-icon name="hi-user-group" scale="1.2" />
              <p>No users found</p>
            </div>
            <div v-if="selectedPatient" class="credits-amount-section">
              <label>Credits to Send</label>
              <div class="credits-input-wrapper">
                <button class="credits-btn" @click="creditsToSend = Math.max(1, creditsToSend - 1)">
                  <v-icon name="hi-minus" scale="0.8" />
                </button>
                <input type="number" v-model.number="creditsToSend" min="1" :max="healthCredits?.purchased || 0" class="credits-input" />
                <button class="credits-btn" @click="creditsToSend = Math.min(healthCredits?.purchased || 0, creditsToSend + 1)">
                  <v-icon name="hi-plus" scale="0.8" />
                </button>
              </div>
              <span class="credits-available">Available: {{ healthCredits?.purchased || 0 }} purchased credits</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn secondary" @click="closeShareModal">Cancel</button>
            <button class="btn primary" @click="shareStep = 2" :disabled="!canProceedToConfirm">
              Continue
            </button>
          </div>
        </template>

        <!-- Step 2: Confirm -->
        <template v-else-if="shareStep === 2">
          <div class="modal-header">
            <div class="modal-icon share">
              <v-icon name="hi-gift" scale="1.2" />
            </div>
            <div class="modal-title-group">
              <h3>Confirm Transfer</h3>
              <p>Review and confirm your credit transfer</p>
            </div>
            <button class="close-btn" @click="closeShareModal">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>
          <div class="modal-body confirm-body">
            <div class="confirm-header">
              <v-icon name="hi-sparkles" scale="2" />
              <p class="confirm-subtitle">You're about to send</p>
              <p class="confirm-amount">{{ creditsToSend }} AI Credits</p>
              <p class="confirm-recipient">to <strong>{{ selectedPatient?.name }}</strong></p>
            </div>
            <div class="confirm-summary">
              <div class="summary-row">
                <span>Your Current Balance</span>
                <span>{{ healthCredits?.purchased }} credits</span>
              </div>
              <div class="summary-row highlight">
                <span>Credits to Send</span>
                <span>-{{ creditsToSend }} credits</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row total">
                <span>Remaining Balance</span>
                <span>{{ (healthCredits?.purchased || 0) - creditsToSend }} credits</span>
              </div>
            </div>
            <div class="confirm-warning">
              <v-icon name="hi-exclamation" scale="0.9" />
              <span>This action cannot be undone.</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn secondary" @click="shareStep = 1" :disabled="transferring">Back</button>
            <button class="btn primary" @click="executeTransfer" :disabled="transferring">
              {{ transferring ? 'Sending...' : 'Confirm & Send' }}
            </button>
          </div>
        </template>

        <!-- Step 3: Success -->
        <template v-else-if="shareStep === 3">
          <div class="modal-body success-body">
            <div class="success-icon">
              <v-icon name="hi-check" scale="2" />
            </div>
            <h3>Transfer Successful</h3>
            <p class="success-text">{{ creditsToSend }} AI credits have been sent to {{ selectedPatient?.name }}</p>
            <p class="success-note">Both you and the recipient will receive email confirmations.</p>
            <button class="btn primary" @click="closeShareModal">Done</button>
          </div>
        </template>
      </div>
    </div>

    <!-- Toast Notification -->
    <transition name="toast">
      <div v-if="showToast" class="toast" :class="toastType">
        <v-icon :name="toastType === 'success' ? 'hi-check-circle' : 'hi-exclamation-circle'" scale="1" />
        <span>{{ toastMessage }}</span>
      </div>
    </transition>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import http from "@/services/http";

export default {
  name: "WalletPage",
  emits: ["openSideNav"],

  data() {
    return {
      loading: true,

      // Wallet
      walletBalance: 0,
      allowSpecialistCharge: true,
      updatingWalletSetting: false,
      showTopUpModal: false,
      topUpAmount: null,
      topUpLoading: false,
      quickAmounts: [1000, 2000, 5000, 10000, 20000],

      // Health Credits
      healthCredits: null,
      healthPlans: [],
      loadingPlans: false,
      purchasingPlan: false,
      showPurchaseModal: false,
      selectedPlan: null,
      paymentMethod: "card",

      // Credit Sharing
      creditSharingSettings: null,
      showShareModal: false,
      shareStep: 1,
      searchQuery: "",
      searchResults: [],
      selectedPatient: null,
      creditsToSend: 1,
      searching: false,
      transferring: false,
      searchTimeout: null,

      // Transactions
      transactions: [],
      loadingTransactions: false,
      loadingMoreTransactions: false,
      transactionFilter: "all",
      hasMoreTransactions: false,
      transactionPage: 1,
      transactionLimit: 10,
      totalTransactions: 0,
      transactionFilters: [
        { label: "All", value: "all" },
        { label: "Credits", value: "credit" },
        { label: "Debits", value: "debit" },
      ],

      // Credit Transactions
      creditTransactions: [],
      loadingCreditTransactions: false,
      loadingMoreCreditTransactions: false,
      hasMoreCreditTransactions: false,
      creditTransactionPage: 1,
      creditTransactionLimit: 10,

      // Toast
      showToast: false,
      toastMessage: "",
      toastType: "success",
    };
  },

  computed: {
    ...mapGetters({
      userProfile: "userprofile",
      userCards: "cards",
    }),

    formattedBalance() {
      return new Intl.NumberFormat("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(this.walletBalance || 0);
    },

    totalCredits() {
      if (!this.healthCredits) return 0;
      return (
        (this.healthCredits.free_remaining || 0) +
        (this.healthCredits.purchased || 0) +
        (this.healthCredits.gifted || 0)
      );
    },

    hasUnlimited() {
      return this.healthCredits?.unlimited && this.healthCredits?.unlimited_expires;
    },

    creditsProgressWidth() {
      const total =
        (this.healthCredits?.free_total || 5) +
        (this.healthCredits?.purchased || 0) +
        (this.healthCredits?.gifted || 0);
      if (total === 0) return 0;
      return Math.min((this.totalCredits / Math.max(total, 10)) * 100, 100);
    },

    canShareCredits() {
      return this.creditSharingSettings?.enabled && (this.healthCredits?.purchased || 0) > 0;
    },

    canProceedToConfirm() {
      if (!this.selectedPatient) return false;
      if (!this.creditsToSend) return false;
      const min = this.creditSharingSettings?.min_amount || 1;
      const max = Math.min(
        this.creditSharingSettings?.max_amount || 50,
        this.healthCredits?.purchased || 0
      );
      return this.creditsToSend >= min && this.creditsToSend <= max;
    },

    filteredTransactions() {
      if (this.transactionFilter === "all") return this.transactions;
      return this.transactions.filter((t) => t.type?.toLowerCase() === this.transactionFilter);
    },

    // Pagination for transactions
    transactionTotalPages() {
      return Math.ceil(this.totalTransactions / this.transactionLimit) || 1;
    },

    paginatedTransactions() {
      return this.filteredTransactions;
    },

    transactionPageNumbers() {
      const total = this.transactionTotalPages;
      const current = this.transactionPage;
      const pages = [];

      if (total <= 5) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        if (current > 3) pages.push('...');
        for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
          pages.push(i);
        }
        if (current < total - 2) pages.push('...');
        pages.push(total);
      }
      return pages;
    },

    // Pagination for credit transactions
    creditTotalPages() {
      return Math.ceil(this.creditTransactions.length / this.creditTransactionLimit) || 1;
    },

    paginatedCreditTransactions() {
      const start = (this.creditTransactionPage - 1) * this.creditTransactionLimit;
      const end = start + this.creditTransactionLimit;
      return this.creditTransactions.slice(start, end);
    },

    creditPageNumbers() {
      const total = this.creditTotalPages;
      const current = this.creditTransactionPage;
      const pages = [];

      if (total <= 5) {
        for (let i = 1; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        if (current > 3) pages.push('...');
        for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
          pages.push(i);
        }
        if (current < total - 2) pages.push('...');
        pages.push(total);
      }
      return pages;
    },
  },

  async mounted() {
    // Load Paystack script
    const scripts = document.getElementsByTagName("script");
    const hasPaystack = Array.from(scripts).some(
      (s) => s.src === "https://js.paystack.co/v1/inline.js"
    );
    if (!hasPaystack) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      document.head.appendChild(script);
    }

    // Check for payment return
    await this.checkPaymentReturn();

    // Load wallet data
    await this.loadWalletData();
  },

  methods: {
    ...mapMutations({
      saveCards: "SET_CARDS",
    }),

    async loadWalletData() {
      this.loading = true;
      try {
        await Promise.all([
          this.fetchWalletBalance(),
          this.fetchUserSettings(),
          this.fetchHealthCredits(),
          this.fetchHealthPlans(),
          this.fetchTransactions(),
          this.fetchCreditTransactions(),
          this.fetchCreditSharingSettings(),
          this.fetchCards(),
        ]);
      } catch (error) {
        console.error("Error loading wallet data:", error);
        this.showToastMessage("Failed to load wallet data", "error");
      } finally {
        this.loading = false;
      }
    },

    async fetchWalletBalance() {
      try {
        const res = await http.get("wallets/balance");
        if (res.status === 200) {
          const data = res.data?.data || res.data;
          this.walletBalance = data?.currentBalance || data?.balance || 0;
        }
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
      }
    },

    async fetchUserSettings() {
      try {
        const res = await http.get("user-settings");
        if (res.status === 200) {
          const data = res.data?.data || res.data?.result || res.data;
          this.allowSpecialistCharge = data?.defaults?.allow_specialist_wallet_charge !== false;
        }
      } catch (error) {
        console.error("Error fetching user settings:", error);
      }
    },

    async fetchHealthCredits() {
      try {
        const res = await http.get("claude-summary/credits");
        if (res.status === 200) {
          const data = res.data?.data || res.data;
          this.healthCredits = {
            free_remaining: data.free_credits_remaining || 0,
            free_total: 5,
            purchased: data.purchased_credits || 0,
            gifted: data.gifted_credits || 0,
            unlimited: data.has_unlimited_subscription || false,
            unlimited_expires: data.unlimited_expires_at || null,
          };
        }
      } catch (error) {
        console.error("Error fetching health credits:", error);
      }
    },

    async fetchHealthPlans() {
      this.loadingPlans = true;
      try {
        const res = await http.get("claude-summary/plans");
        if (res.status === 200) {
          this.healthPlans = res.data?.data || res.data || [];
        }
      } catch (error) {
        console.error("Error fetching health plans:", error);
      } finally {
        this.loadingPlans = false;
      }
    },

    async fetchTransactions(resetPage = true) {
      this.loadingTransactions = true;
      if (resetPage) {
        this.transactionPage = 1;
      }
      this.transactions = [];

      try {
        const res = await http.get("wallets", {
          params: {
            page: this.transactionPage,
            limit: this.transactionLimit,
          },
        });

        if (res.status === 200) {
          const responseData = res.data?.data || res.data?.result || res.data;
          const newTransactions = Array.isArray(responseData)
            ? responseData
            : (responseData.transactions || responseData.docs || []);

          const total = responseData.total || responseData.totalDocs || newTransactions.length;
          const totalPages = responseData.totalPages || Math.ceil(total / this.transactionLimit);

          this.totalTransactions = total;
          this.hasMoreTransactions = this.transactionPage < totalPages;
          this.transactions = newTransactions;
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        this.transactions = [];
      }

      this.loadingTransactions = false;
    },

    async fetchCreditTransactions() {
      this.loadingCreditTransactions = true;
      this.creditTransactionPage = 1;
      try {
        // Fetch all credit transactions for client-side pagination
        const res = await http.get(`claude-summary/transactions?limit=100`);
        if (res.status === 200) {
          const data = res.data?.data || res.data;
          this.creditTransactions = data.transactions || data || [];
        }
      } catch (error) {
        console.error("Error fetching credit transactions:", error);
        this.creditTransactions = [];
      } finally {
        this.loadingCreditTransactions = false;
      }
    },

    async fetchCreditSharingSettings() {
      try {
        const res = await http.get("claude-summary/sharing/settings");
        if (res.status === 200) {
          this.creditSharingSettings = res.data?.data || res.data;
        }
      } catch (error) {
        console.error("Error fetching sharing settings:", error);
      }
    },

    async fetchCards() {
      try {
        const res = await http.get("cards");
        if (res.status === 200) {
          this.saveCards(res.data?.data || []);
        }
      } catch (error) {
        console.error("Error fetching cards:", error);
      }
    },

    async toggleWalletSetting(value) {
      this.updatingWalletSetting = true;
      try {
        await http.patch("user-settings", {
          defaults: { allow_specialist_wallet_charge: value },
        });
        this.allowSpecialistCharge = value;
        this.showToastMessage(
          value ? "Specialists can now charge your wallet" : "Specialists can no longer charge your wallet",
          "success"
        );
      } catch (error) {
        console.error("Error updating wallet setting:", error);
        this.allowSpecialistCharge = !value;
        this.showToastMessage("Failed to update setting", "error");
      } finally {
        this.updatingWalletSetting = false;
      }
    },

    async checkPaymentReturn() {
      const urlParams = new URLSearchParams(window.location.search);
      const urlReference = urlParams.get('reference') || urlParams.get('trxref');
      const storedReference = localStorage.getItem('wallet_topup_reference');
      const reference = urlReference || storedReference;

      if (reference && (urlReference || storedReference)) {
        try {
          this.showToastMessage('Verifying payment...', 'success');
          const res = await http.post('wallets/fund/verify', { reference });
          if (res.data?.data?.success || res.data?.success) {
            this.showToastMessage('Wallet funded successfully!', 'success');
            localStorage.removeItem('wallet_topup_reference');
          }
        } catch (e) {
          console.error('Payment verification error:', e);
          if (!e.response?.data?.message?.includes('already processed')) {
            this.showToastMessage(e.response?.data?.message || 'Payment verification failed', 'error');
          }
        }
        localStorage.removeItem('wallet_topup_reference');
        this.$router.replace({ path: this.$route.path });
      }
    },

    async initiateTopUp() {
      if (!this.topUpAmount || this.topUpAmount < 100) return;
      this.topUpLoading = true;
      try {
        const callbackUrl = `${window.location.origin}/app/patient/wallet?payment=wallet-topup`;
        const res = await http.post("wallets/fund", {
          amount: this.topUpAmount,
          callback_url: callbackUrl,
        });
        if (res.status === 200 || res.status === 201) {
          const data = res.data?.data || res.data?.result || res.data;
          if (data.authorization_url || data.paymentUrl) {
            localStorage.setItem('wallet_topup_reference', data.reference);
            window.location.href = data.authorization_url || data.paymentUrl;
          } else {
            await this.fetchWalletBalance();
            await this.fetchTransactions();
            this.showTopUpModal = false;
            this.topUpAmount = null;
          }
        }
      } catch (error) {
        console.error("Error initializing top up:", error);
        this.showToastMessage(error.response?.data?.message || "Failed to initialize payment", "error");
      } finally {
        this.topUpLoading = false;
      }
    },

    openPurchaseModal(plan) {
      this.selectedPlan = plan;
      this.paymentMethod = this.walletBalance >= plan.price ? "wallet" : "card";
      this.showPurchaseModal = true;
    },

    closePurchaseModal() {
      this.showPurchaseModal = false;
      this.selectedPlan = null;
    },

    async purchasePlan() {
      if (!this.selectedPlan) return;
      this.purchasingPlan = true;
      try {
        const res = await http.post("claude-summary/purchase", { plan_id: this.selectedPlan._id });
        if (res.status === 200 || res.status === 201) {
          await this.fetchHealthCredits();
          await this.fetchWalletBalance();
          await this.fetchTransactions();
          this.showToastMessage("Plan purchased successfully!", "success");
          this.closePurchaseModal();
        }
      } catch (error) {
        console.error("Error purchasing plan:", error);
        this.showToastMessage(error.response?.data?.message || "Failed to purchase plan", "error");
      } finally {
        this.purchasingPlan = false;
      }
    },

    openShareCreditsModal() {
      this.shareStep = 1;
      this.searchQuery = "";
      this.searchResults = [];
      this.selectedPatient = null;
      this.creditsToSend = this.creditSharingSettings?.min_amount || 1;
      this.showShareModal = true;
    },

    closeShareModal() {
      this.showShareModal = false;
      this.shareStep = 1;
      this.searchQuery = "";
      this.searchResults = [];
      this.selectedPatient = null;
    },

    searchPatients() {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      if (!this.searchQuery || this.searchQuery.length < 2) {
        this.searchResults = [];
        return;
      }
      this.searchTimeout = setTimeout(async () => {
        this.searching = true;
        try {
          const res = await http.get(`claude-summary/sharing/search?query=${encodeURIComponent(this.searchQuery)}`);
          if (res.status === 200) {
            this.searchResults = res.data?.data || res.data || [];
          }
        } catch (error) {
          console.error("Error searching patients:", error);
          this.searchResults = [];
        } finally {
          this.searching = false;
        }
      }, 300);
    },

    selectPatient(patient) {
      if (this.selectedPatient?.id === patient.id) {
        this.selectedPatient = null;
      } else {
        this.selectedPatient = patient;
      }
    },

    async executeTransfer() {
      if (!this.selectedPatient || !this.creditsToSend) return;
      this.transferring = true;
      try {
        const res = await http.post("claude-summary/sharing/transfer", {
          recipient_id: this.selectedPatient.id,
          credits: this.creditsToSend,
        });
        if (res.status === 200 || res.status === 201) {
          this.shareStep = 3;
          await this.fetchHealthCredits();
          await this.fetchCreditTransactions();
        }
      } catch (error) {
        console.error("Error transferring credits:", error);
        this.showToastMessage(error.response?.data?.message || "Transfer failed", "error");
      } finally {
        this.transferring = false;
      }
    },

    async loadMoreTransactions() {
      if (this.loadingMoreTransactions || !this.hasMoreTransactions) return;
      this.transactionPage++;
      await this.fetchTransactions(false);
    },

    async loadMoreCreditTransactions() {
      if (this.loadingMoreCreditTransactions || !this.hasMoreCreditTransactions) return;
      this.creditTransactionPage++;
      await this.fetchCreditTransactions(true);
    },

    setTransactionFilter(filter) {
      this.transactionFilter = filter;
    },

    // Pagination methods
    async goToTransactionPage(page) {
      if (page < 1 || page > this.transactionTotalPages) return;
      this.transactionPage = page;
      await this.fetchTransactions(false);
    },

    goToCreditPage(page) {
      if (page < 1 || page > this.creditTotalPages) return;
      this.creditTransactionPage = page;
    },

    // Credit transaction helpers
    getCreditTxnType(txn) {
      return txn.transaction_type?.toLowerCase() || txn.type?.toLowerCase() || 'usage';
    },

    // Wallet transaction helper
    isWalletTxnPositive(txn) {
      const type = (txn.type || '').toLowerCase();
      // Credit, topup, top-up, refund, bonus are positive transactions
      return ['credit', 'topup', 'top-up', 'top_up', 'refund', 'bonus', 'cashback'].some(t => type.includes(t));
    },

    isCreditPositive(txn) {
      const type = this.getCreditTxnType(txn);
      return ['purchase', 'gift_received', 'bonus', 'gifted', 'free', 'received'].some(t => type.includes(t));
    },

    getCreditAmount(txn) {
      // Check various possible field names for the credit amount
      // credits_delta is the primary field from backend (can be negative)
      if (txn.credits_delta !== undefined && txn.credits_delta !== null) {
        return Math.abs(txn.credits_delta);
      }
      return txn.credits || txn.amount || txn.credit_amount || txn.quantity || txn.count || txn.credits_amount || 1;
    },

    getPlanCreditsDisplay(plan) {
      if (!plan) return '';
      if (plan.is_unlimited) {
        // Check for duration in the plan name or default to appropriate text
        const name = (plan.name || '').toLowerCase();
        if (name.includes('year')) return 'Unlimited for 1 year';
        if (name.includes('month')) return 'Unlimited for 30 days';
        return 'Unlimited access';
      }
      return plan.credits ? `${plan.credits} credits` : 'Credits included';
    },

    scrollToPlans() {
      this.$refs.plansSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    scrollToTransactions() {
      this.$refs.transactionsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    async addCard() {
      try {
        const res = await http.post("cards/add");
        if (res.status === 200 || res.status === 201) {
          const data = res.data?.data || res.data;
          if (data.authorization_url || data.paymentUrl) {
            window.location.href = data.authorization_url || data.paymentUrl;
          }
        }
      } catch (error) {
        console.error("Error adding card:", error);
        this.showToastMessage("Failed to add card", "error");
      }
    },

    async setDefaultCard(card) {
      try {
        await http.patch(`cards/${card._id}/default`);
        await this.fetchCards();
        this.showToastMessage("Default card updated", "success");
      } catch (error) {
        console.error("Error setting default card:", error);
        this.showToastMessage("Failed to update default card", "error");
      }
    },

    async removeCard(card) {
      if (!confirm("Are you sure you want to remove this card?")) return;
      try {
        await http.delete(`cards/${card._id}`);
        await this.fetchCards();
        this.showToastMessage("Card removed successfully", "success");
      } catch (error) {
        console.error("Error removing card:", error);
        this.showToastMessage("Failed to remove card", "error");
      }
    },

    async fetchAllWalletTransactions() {
      try {
        const res = await http.get("wallets?limit=1000");
        if (res.status === 200) {
          const data = res.data?.data || res.data;
          return Array.isArray(data) ? data : (data.transactions || []);
        }
        return [];
      } catch (e) {
        console.error("Error fetching all transactions:", e);
        return [];
      }
    },

    async fetchAllCreditTransactions() {
      try {
        const res = await http.get("claude-summary/transactions?limit=1000");
        if (res.status === 200) {
          const data = res.data?.data || res.data;
          return data.transactions || data || [];
        }
        return [];
      } catch (e) {
        console.error("Error fetching all credit transactions:", e);
        return [];
      }
    },

    formatDateForExport(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    downloadCSV(data, filename) {
      if (data.length === 0) return;
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    async downloadWalletStatement() {
      this.showToastMessage('Preparing download...', 'success');
      const allTransactions = await this.fetchAllWalletTransactions();
      if (allTransactions.length === 0) {
        this.showToastMessage('No transactions to download', 'error');
        return;
      }
      const data = allTransactions.map(txn => ({
        Date: this.formatDateForExport(txn.created_at || txn.createdAt),
        Description: txn.narration || txn.description || 'Transaction',
        Type: txn.type || 'N/A',
        Amount: txn.amount || 0,
      }));
      this.downloadCSV(data, 'wallet-statement');
    },

    getCreditTxnDescription(txn) {
      // Use the description from backend if available (it's already formatted correctly)
      if (txn.description && txn.description.length > 5) {
        return txn.description;
      }

      const type = txn.transaction_type?.toLowerCase() || txn.type?.toLowerCase() || '';

      // Get sender name from metadata (where backend stores it)
      const senderName = txn.metadata?.sender_name || txn.sender_name || txn.senderName || 'a patient';

      // Get recipient name from metadata (where backend stores it)
      const recipientName = txn.metadata?.recipient_name || txn.recipient_name || txn.recipientName || 'a patient';

      if (type.includes('purchase')) return 'Credits purchased';
      if (type.includes('usage') || type.includes('consumed') || type.includes('used')) return 'Credit used for health score';
      if (type.includes('received') || type.includes('transfer_received')) return `Credits received from ${senderName}`;
      if (type.includes('sent') || type.includes('transfer_sent') || type.includes('shared')) {
        return `Credits sent to ${recipientName}`;
      }
      if (type.includes('gifted')) return 'Credits gifted';
      if (type.includes('free') || type.includes('reset')) return 'Free monthly credits';
      return txn.narration || 'Credit transaction';
    },

    async downloadCreditsStatement() {
      this.showToastMessage('Preparing download...', 'success');
      const allCreditTransactions = await this.fetchAllCreditTransactions();
      if (allCreditTransactions.length === 0) {
        this.showToastMessage('No credit transactions to download', 'error');
        return;
      }
      const data = allCreditTransactions.map(txn => ({
        Date: this.formatDateForExport(txn.created_at),
        Description: this.getCreditTxnDescription(txn),
        Type: txn.transaction_type || txn.type || 'N/A',
        Credits: txn.credits || txn.amount || 1,
      }));
      this.downloadCSV(data, 'ai-credits-statement');
    },

    // Utility methods
    formatCurrency(amount) {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 0,
      }).format(amount || 0).replace("NGN", "₦");
    },

    formatNumber(num) {
      return new Intl.NumberFormat("en-NG").format(num || 0);
    },

    formatDate(date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    },

    formatDateTime(date) {
      if (!date) return "";
      const d = new Date(date);
      const now = new Date();
      const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "Today " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    },

    getTransactionIcon(type) {
      const icons = {
        credit: "hi-arrow-down",
        debit: "hi-arrow-up",
        topup: "hi-plus",
        payment: "hi-credit-card",
      };
      return icons[type?.toLowerCase()] || "hi-switch-vertical";
    },

    getCreditTransactionIcon(type) {
      const icons = {
        purchase: "hi-shopping-cart",
        usage: "hi-sparkles",
        gift_sent: "hi-gift",
        gift_received: "hi-gift",
        bonus: "hi-star",
        expired: "hi-clock",
      };
      return icons[type?.toLowerCase()] || "hi-sparkles";
    },

    getCardIcon(type) {
      const icons = {
        visa: "fa-cc-visa",
        mastercard: "fa-cc-mastercard",
        verve: "hi-credit-card",
      };
      return icons[type?.toLowerCase()] || "hi-credit-card";
    },

    getInitials(patient) {
      if (!patient?.name) return "?";
      return patient.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    },

    showToastMessage(message, type = "success") {
      this.toastMessage = message;
      this.toastType = type;
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
      }, 3000);
    },
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
$violet: #8B5CF6;
$violet-light: #EDE9FE;

// Page Layout
.wallet-page {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: $bg;
  min-height: 100vh;
  overflow-x: hidden;
  width: 100%;
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 1rem;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  @media (max-width: 768px) {
    display: flex;
  }

  .menu-btn,
  .notification-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $slate;
    transition: all 0.2s;

    &:hover {
      background: rgba(0, 0, 0, 0.08);
    }
  }

  .header-logo img {
    height: 32px;
    width: auto;
  }
}

.page-content {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2rem 100px;
  box-sizing: border-box;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    padding: 1rem 1rem 100px;
  }
}

// Hero Section
.hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  padding: 40px 40px 56px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%) !important;
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 20px 60px rgba(2, 136, 209, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  z-index: 2;
  min-height: 350px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 28px 20px 36px;
    gap: 0;
    text-align: center;
    border-radius: 20px;
    min-height: auto;
    margin-bottom: 20px;
  }
}

.hero__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 2;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  width: fit-content;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.desktop-only {
  @media (max-width: 768px) {
    display: none !important;
  }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  width: fit-content;
  margin-bottom: 16px;
  position: relative;
  color: white;
  font-size: 13px;
  font-weight: 500;

  @media (max-width: 768px) {
    margin: 0 auto 12px;
  }

  .badge-pulse {
    position: absolute;
    left: 12px;
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  svg {
    margin-left: 12px;
  }
}

.hero__title {
  font-size: 42px;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  margin: 0 0 12px;
  letter-spacing: -1px;

  @media (max-width: 768px) {
    font-size: 32px;
  }

  &-accent {
    background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.hero__subtitle {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 20px;
  max-width: 400px;
  line-height: 1.5;

  @media (max-width: 768px) {
    font-size: 14px;
    margin: 0 auto 16px;
  }
}

.hero__stats {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  width: fit-content;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    gap: 16px;
    padding: 12px 16px;
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;

  &__value {
    font-size: 22px;
    font-weight: 700;
    color: white;

    @media (max-width: 768px) {
      font-size: 18px;
    }

    &--success { color: #86EFAC; }
    &--warning { color: #FDE68A; }
  }

  &__label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
  }
}

.hero__visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 200px;
  min-height: 200px;

  @media (max-width: 768px) {
    display: none;
  }
}

// Orb Animation
.wallet-orb {
  position: relative;
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 {
    width: 100%;
    height: 100%;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    width: 80%;
    height: 80%;
    animation: spin-slow 15s linear infinite reverse;
  }

  &--3 {
    width: 60%;
    height: 60%;
    animation: spin-slow 10s linear infinite;
  }
}

.orb-core {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;

  svg {
    width: 36px;
    height: 36px;
    color: white;
  }
}

.floating-icons {
  position: absolute;
  inset: -20px;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;

  svg {
    width: 18px;
    height: 18px;
    color: white;
  }

  &--1 { top: 0; right: 0; animation-delay: 0s; }
  &--2 { bottom: 10%; right: -10%; animation-delay: 1s; }
  &--3 { bottom: 0; left: 0; animation-delay: 2s; }
}

// Animations
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid $sky-light;
    border-top-color: $sky;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;

    &.small {
      width: 24px;
      height: 24px;
      border-width: 2px;
    }
  }

  p {
    font-size: 14px;
    color: $gray;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Bento Grid
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  position: relative;
  z-index: 1;

  @media (max-width: 1024px) {
    gap: 16px;
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.bento-card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;
  }

  &--balance {
    grid-column: span 5;
    position: relative;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;
    overflow: hidden;

    @media (max-width: 1024px) {
      grid-column: span 12;
    }
  }

  &--credits {
    grid-column: span 7;

    @media (max-width: 1024px) {
      grid-column: span 12;
    }
  }

  &--actions {
    grid-column: span 4;

    @media (max-width: 1024px) {
      grid-column: span 6;
    }

    @media (max-width: 768px) {
      grid-column: span 12;
    }
  }

  &--cards {
    grid-column: span 8;

    @media (max-width: 1024px) {
      grid-column: span 6;
    }

    @media (max-width: 768px) {
      grid-column: span 12;
    }
  }

  &--plans {
    grid-column: span 12;
  }

  &--transactions {
    grid-column: span 6;

    @media (max-width: 1024px) {
      grid-column: span 12;
    }
  }

  &--credit-history {
    grid-column: span 6;

    @media (max-width: 1024px) {
      grid-column: span 12;
    }
  }
}

// Balance Card
.balance-card {
  position: relative;
  z-index: 1;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.balance-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  opacity: 0.9;
}

.balance-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;

  &.active {
    background: rgba(16, 185, 129, 0.3);
  }
}

.balance-amount {
  margin-bottom: 20px;

  .currency {
    font-size: 24px;
    font-weight: 600;
    margin-right: 4px;
  }

  .amount {
    font-size: 36px;
    font-weight: 700;
    letter-spacing: -1px;

    @media (max-width: 480px) {
      font-size: 28px;
    }
  }
}

.balance-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 8px;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  &.primary {
    background: white;
    color: $sky-dark;

    &:hover {
      transform: translateY(-1px);
    }
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.2);
    color: white;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.balance-setting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  gap: 12px;

  .setting-info {
    font-size: 13px;
    opacity: 0.9;
  }
}

.card-decoration {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);

  &.circle-1 {
    width: 200px;
    height: 200px;
    top: -80px;
    right: -60px;
  }

  &.circle-2 {
    width: 150px;
    height: 150px;
    bottom: -60px;
    left: -40px;
  }
}

// Toggle Switch
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider {
      background-color: rgba(255, 255, 255, 0.4);
    }

    &:checked + .slider:before {
      transform: translateX(20px);
      background-color: white;
    }

    &:disabled + .slider {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.2);
    transition: 0.3s;
    border-radius: 24px;

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: rgba(255, 255, 255, 0.6);
      transition: 0.3s;
      border-radius: 50%;
    }
  }
}

// Card Header
.card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;

  &.compact {
    align-items: center;
    margin-bottom: 16px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: $navy;
    }
  }
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;

  &--credits { background: linear-gradient(135deg, $amber, darken($amber, 10%)); }
  &--actions { background: linear-gradient(135deg, $violet, darken($violet, 10%)); }
  &--plans { background: linear-gradient(135deg, $emerald, darken($emerald, 10%)); }
  &--transactions { background: linear-gradient(135deg, $sky, $sky-dark); }
  &--credit-history { background: linear-gradient(135deg, #F97316, #EA580C); }
  &--cards { background: linear-gradient(135deg, $rose, darken($rose, 10%)); }
}

.card-title-group {
  flex: 1;
  min-width: 0;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 4px;
  }

  p {
    font-size: 13px;
    color: $gray;
    margin: 0;
  }
}

// Credits Card Specific
.share-credits-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba($sky, 0.1);
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: $sky-dark;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba($sky, 0.2);
  }
}

.credits-display {
  margin-bottom: 20px;
}

.credits-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;

  .credits-number {
    font-size: 36px;
    font-weight: 700;
    color: $navy;

    @media (max-width: 480px) {
      font-size: 28px;
    }
  }

  .credits-label {
    font-size: 14px;
    color: $gray;
  }
}

.credits-progress {
  margin-bottom: 16px;

  .progress-bar {
    height: 8px;
    background: #f3f4f6;
    border-radius: 4px;
    overflow: hidden;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, $sky 0%, $sky-dark 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }
}

.credits-breakdown {
  display: flex;
  align-items: center;
  gap: 16px;

  .breakdown-item {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .item-value {
      font-size: 16px;
      font-weight: 700;

      &.free { color: $emerald; }
      &.purchased { color: $sky-dark; }
      &.gifted { color: $violet; }
    }

    .item-label {
      font-size: 11px;
      color: $light-gray;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  }

  .breakdown-divider {
    width: 1px;
    height: 32px;
    background: #e5e7eb;
  }
}

.unlimited-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba($emerald, 0.1) 0%, rgba(darken($emerald, 10%), 0.1) 100%);
  border-radius: 10px;
  margin-bottom: 16px;
  color: $emerald;
  font-size: 14px;
  font-weight: 600;

  .expires {
    margin-left: auto;
    font-size: 12px;
    font-weight: 500;
    opacity: 0.8;
  }
}

.buy-credits-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
  }
}

// Quick Actions
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
  background: $bg;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $sky-light;
    background: white;
  }

  .action-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    &.referral { background: linear-gradient(135deg, $violet, darken($violet, 10%)); }
    &.orders { background: linear-gradient(135deg, $sky, $sky-dark); }
    &.prescriptions { background: linear-gradient(135deg, $emerald, darken($emerald, 10%)); }
    &.appointments { background: linear-gradient(135deg, $amber, darken($amber, 10%)); }
  }

  span {
    font-size: 12px;
    font-weight: 500;
    color: $slate;
  }
}

// Plans Grid
.plans-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  color: $gray;
  font-size: 14px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.plan-card {
  position: relative;
  padding: 20px;
  background: $bg;
  border: 2px solid transparent;
  border-radius: 16px;
  text-align: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: $sky-light;
    transform: translateY(-2px);
  }

  &.popular {
    border-color: $sky;
    background: $sky-light;
  }

  &.unlimited {
    background: linear-gradient(135deg, rgba($violet, 0.1) 0%, rgba($violet, 0.05) 100%);
    border-color: rgba($violet, 0.3);
  }

  .popular-badge {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 12px;
    background: $sky;
    color: white;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-radius: 20px;
  }

  .plan-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 12px;
    background: rgba($sky, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;
  }

  .plan-name {
    font-size: 16px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 4px;
  }

  .plan-description {
    font-size: 12px;
    color: $gray;
    margin: 0 0 12px;
  }

  .plan-credits {
    margin-bottom: 8px;

    .credits-value {
      font-size: 24px;
      font-weight: 700;
      color: $navy;
    }

    .credits-unit {
      font-size: 12px;
      color: $gray;
      margin-left: 4px;
    }
  }

  .plan-price {
    margin-bottom: 16px;

    .price-currency {
      font-size: 14px;
      color: $slate;
    }

    .price-value {
      font-size: 20px;
      font-weight: 700;
      color: $slate;
    }
  }

  .plan-btn {
    width: 100%;
    padding: 10px 16px;
    background: $sky;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: $sky-dark;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.plans-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: $gray;

  p {
    font-size: 14px;
    margin: 0;
  }
}

// Transactions
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.filter-tab {
  padding: 8px 16px;
  background: $bg;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: $gray;
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    background: $sky;
    color: white;
  }

  &:hover:not(.active) {
    background: darken($bg, 3%);
  }
}

.transactions-loading {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: $bg;
  border-radius: 12px;
}

.txn-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.credit {
    background: rgba($emerald, 0.1);
    color: $emerald;
  }

  &.debit {
    background: rgba($rose, 0.1);
    color: $rose;
  }

  &.purchase {
    background: rgba($sky, 0.1);
    color: $sky-dark;
  }

  &.usage {
    background: rgba($amber, 0.1);
    color: $amber;
  }

  &.gift_sent, &.gift_received {
    background: rgba($violet, 0.1);
    color: $violet;
  }
}

.txn-details {
  flex: 1;
  min-width: 0;

  .txn-title {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: $navy;
    margin-bottom: 2px;
  }

  .txn-date {
    font-size: 12px;
    color: $gray;
  }
}

.txn-amount {
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;

  &.credit { color: $emerald; }
  &.debit { color: $rose; }
}

.txn-credits {
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;

  &.positive { color: $emerald; }
  &.negative { color: $rose; }
}

.load-more-btn {
  margin-top: 12px;
  padding: 10px 20px;
  background: $bg;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: darken($bg, 3%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.transactions-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: $gray;

  p {
    font-size: 14px;
    margin: 0;
  }
}

.download-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: $gray;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: $bg;
    color: $slate;
  }
}

// Payment Methods
.add-card-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: $sky;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: $sky-dark;
  }
}

.cards-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.saved-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: $bg;
  border: 2px solid transparent;
  border-radius: 12px;
  transition: all 0.2s ease;

  &.default {
    border-color: $sky;
    background: $sky-light;
  }

  .card-brand {
    width: 48px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $navy;
  }

  .card-info {
    flex: 1;

    .card-number {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: $navy;
      margin-bottom: 2px;
    }

    .card-expiry {
      font-size: 12px;
      color: $gray;
    }
  }

  .card-actions {
    display: flex;
    gap: 8px;
  }

  .set-default-btn,
  .remove-card-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .set-default-btn {
    background: rgba($amber, 0.1);
    color: $amber;

    &:hover {
      background: rgba($amber, 0.2);
    }
  }

  .remove-card-btn {
    background: rgba($rose, 0.1);
    color: $rose;

    &:hover {
      background: rgba($rose, 0.2);
    }
  }

  .default-badge {
    position: absolute;
    top: -8px;
    right: 12px;
    padding: 2px 8px;
    background: $sky;
    color: white;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-radius: 4px;
  }
}

.cards-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: $gray;

  p {
    font-size: 14px;
    margin: 0;
  }

  .add-first-card-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: $sky;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: $sky-dark;
    }
  }
}

// Modals
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 20px;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 24px 24px 0;

  .modal-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    flex-shrink: 0;

    &.premium {
      background: linear-gradient(135deg, $amber, darken($amber, 10%));
    }

    &.share {
      background: linear-gradient(135deg, $violet, darken($violet, 10%));
    }
  }

  .modal-title-group {
    flex: 1;

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: $navy;
      margin: 0 0 4px;
    }

    p {
      font-size: 13px;
      color: $gray;
      margin: 0;
    }
  }

  .close-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    background: $bg;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $gray;
    transition: all 0.2s ease;

    &:hover {
      background: darken($bg, 5%);
      color: $slate;
    }
  }
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 0 24px 24px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;

  &.primary {
    background: $sky;
    color: white;

    &:hover:not(:disabled) {
      background: $sky-dark;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: $bg;
    color: $slate;

    &:hover:not(:disabled) {
      background: darken($bg, 5%);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

// Top Up Modal
.amount-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: $bg;
  border-radius: 12px;
  margin-bottom: 20px;

  .currency-symbol {
    font-size: 24px;
    font-weight: 600;
    color: $slate;
  }

  .amount-input {
    flex: 1;
    font-size: 32px;
    font-weight: 700;
    color: $navy;
    background: none;
    border: none;
    outline: none;

    &::placeholder {
      color: $light-gray;
    }
  }
}

.quick-amounts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-amount-btn {
  padding: 10px 16px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $sky-light;
  }

  &.active {
    border-color: $sky;
    background: $sky-light;
    color: $sky-dark;
  }
}

// Purchase Modal
.purchase-summary {
  background: $bg;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;

  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 14px;
    color: $slate;

    &.total {
      font-weight: 600;
      color: $navy;
      font-size: 16px;
    }
  }

  .summary-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 8px 0;
  }
}

.payment-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: $bg;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  input {
    display: none;
  }

  &.selected {
    border-color: $sky;
    background: $sky-light;

    .option-check {
      background: $sky;
      color: white;
    }
  }

  .option-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    color: $slate;
  }

  .option-text {
    display: flex;
    flex-direction: column;

    .option-title {
      font-size: 14px;
      font-weight: 600;
      color: $navy;
    }

    .option-balance {
      font-size: 12px;
      color: $gray;
    }
  }

  .option-check {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: center;
    color: transparent;
    transition: all 0.2s ease;
  }
}

.payment-info {
  margin-bottom: 16px;
}

.wallet-payment-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.1) 100%);
  border: 1px solid rgba($sky, 0.2);
  border-radius: 12px;
  color: $sky-dark;
}

.wallet-payment-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wallet-payment-title {
  font-size: 14px;
  font-weight: 600;
  color: $navy;
}

.wallet-payment-balance {
  font-size: 13px;
  color: $gray;
}

.insufficient-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba($rose, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: $rose;
  margin-top: 16px;

  a {
    color: $sky-dark;
    font-weight: 600;
    text-decoration: underline;
  }
}

// Share Modal
.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: $bg;
  border-radius: 12px;
  margin-bottom: 16px;

  .search-input {
    flex: 1;
    font-size: 14px;
    background: none;
    border: none;
    outline: none;
    color: $navy;

    &::placeholder {
      color: $light-gray;
    }
  }

  .search-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid $sky-light;
    border-top-color: $sky;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
}

.search-results {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.patient-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: $bg;
  }

  &.selected {
    background: $sky-light;
  }

  .patient-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    font-weight: 600;
  }

  .patient-info {
    flex: 1;

    .patient-name {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: $navy;
    }

    .patient-email {
      font-size: 12px;
      color: $gray;
    }
  }

  .selected-icon {
    color: $sky-dark;
  }
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 30px;
  color: $gray;

  p {
    font-size: 14px;
    margin: 0;
  }
}

.credits-amount-section {
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;

  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: $slate;
    margin-bottom: 12px;
  }

  .credits-input-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 8px;
  }

  .credits-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid #e5e7eb;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $slate;
    transition: all 0.2s ease;

    &:hover {
      background: $bg;
    }
  }

  .credits-input {
    width: 80px;
    font-size: 32px;
    font-weight: 700;
    color: $navy;
    text-align: center;
    background: none;
    border: none;
    outline: none;
  }

  .credits-available {
    display: block;
    text-align: center;
    font-size: 12px;
    color: $gray;
  }
}

.confirm-body {
  text-align: center;

  .confirm-header {
    margin-bottom: 24px;

    svg {
      color: $amber;
      margin-bottom: 16px;
    }

    .confirm-subtitle {
      font-size: 14px;
      color: $gray;
      margin: 0 0 4px;
    }

    .confirm-amount {
      font-size: 32px;
      font-weight: 700;
      color: $navy;
      margin: 0 0 4px;
    }

    .confirm-recipient {
      font-size: 14px;
      color: $slate;
      margin: 0;
    }
  }

  .confirm-summary {
    background: $bg;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
    text-align: left;

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
      color: $slate;

      &.highlight {
        color: $rose;
      }

      &.total {
        font-weight: 600;
        color: $navy;
      }
    }

    .summary-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 8px 0;
    }
  }

  .confirm-warning {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: rgba($amber, 0.1);
    border-radius: 8px;
    font-size: 13px;
    color: darken($amber, 10%);
  }
}

.success-body {
  text-align: center;
  padding: 40px 24px;

  .success-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 20px;
    background: rgba($emerald, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $emerald;
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 8px;
  }

  .success-text {
    font-size: 14px;
    color: $slate;
    margin: 0 0 8px;
  }

  .success-note {
    font-size: 12px;
    color: $gray;
    margin: 0 0 24px;
  }
}

// Toast
.toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  z-index: 1001;
  font-size: 14px;
  font-weight: 500;

  &.success {
    color: $emerald;
  }

  &.error {
    color: $rose;
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
}

// Pagination
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: $bg;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: white;
    border-color: $sky;
    color: $sky-dark;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.pagination-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-number {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: $gray;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(.active):not(.ellipsis) {
    background: $bg;
    color: $slate;
  }

  &.active {
    background: $sky;
    color: white;
    border-color: $sky;
  }

  &.ellipsis {
    cursor: default;
    color: $light-gray;
  }
}
</style>
