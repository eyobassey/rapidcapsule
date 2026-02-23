<template>
	<div class="wallet-page">
		<!-- Mobile Header -->
		<header class="mobile-header">
			<button class="menu-btn" @click="$emit('openSideNav')">
				<v-icon name="hi-menu-alt-2" scale="1.2" />
			</button>
			<div class="header-logo">
				<v-icon name="bi-wallet2" scale="1" />
				<span>Wallet</span>
			</div>
			<button class="header-action-btn" @click="showTopUpModal = true">
				<v-icon name="hi-plus" scale="1" />
			</button>
		</header>

		<!-- Page Content -->
		<div class="page-body">
			<!-- Hero Section -->
			<section class="hero">
				<div class="hero__content">
					<div class="hero__badge">
						<div class="badge-pulse"></div>
						<v-icon name="bi-wallet2" />
						<span>Financial Hub</span>
					</div>
					<h1 class="hero__title">
						Specialist<br/>
						<span class="hero__title-accent">Wallet</span>
					</h1>
					<p class="hero__subtitle">
						Manage your funds, earnings, and payouts in one place.
					</p>
					<div class="hero__stats">
						<div class="hero-stat">
							<span class="hero-stat__value">{{ formatConverted(walletData.available_balance || 0) }}</span>
							<span class="hero-stat__label">Available</span>
						</div>
						<div class="hero-stat__divider"></div>
						<div class="hero-stat">
							<span class="hero-stat__value hero-stat__value--warning">{{ formatConverted(walletData.held_balance || 0) }}</span>
							<span class="hero-stat__label">Held</span>
						</div>
						<div class="hero-stat__divider"></div>
						<div class="hero-stat">
							<span class="hero-stat__value hero-stat__value--success">{{ formatConverted(walletStats?.lifetime?.total_credited || 0) }}</span>
							<span class="hero-stat__label">Total Earned</span>
						</div>
						<div class="hero-stat__divider"></div>
						<div class="hero-stat">
							<span class="hero-stat__value hero-stat__value--ai">{{ totalAICredits }}</span>
							<span class="hero-stat__label">AI Credits</span>
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
						<div class="float-icon float-icon--2"><v-icon name="hi-currency-dollar" /></div>
						<div class="float-icon float-icon--3"><v-icon name="hi-trending-up" /></div>
					</div>
				</div>
			</section>

			<!-- Loading State -->
			<div v-if="isLoading" class="loading-state">
				<div class="loading-spinner">
					<div class="spinner-ring"></div>
					<v-icon name="bi-wallet2" scale="1.2" class="spinner-icon" />
				</div>
				<p>Loading wallet...</p>
			</div>

			<!-- Bento Grid -->
			<div v-else class="bento-grid">
				<!-- Balance Card -->
				<div class="bento-card balance-card">
					<div class="balance-header">
						<div class="balance-label">
							<v-icon name="bi-wallet2" scale="1" />
							<span>Available Balance</span>
						</div>
					</div>
					<div class="balance-amount">
						<span class="amount">{{ formatConverted(walletData.available_balance || 0) }}</span>
					</div>
					<div v-if="walletData.held_balance > 0" class="balance-held">
						<v-icon name="hi-lock-closed" scale="0.7" />
						<span>{{ formatConverted(walletData.held_balance) }} held for pending transactions</span>
					</div>
					<div class="balance-actions">
						<button class="balance-btn primary" @click="showTopUpModal = true">
							<v-icon name="hi-plus" scale="0.9" />
							<span>Top Up</span>
						</button>
						<button class="balance-btn secondary" @click="showWithdrawModal = true">
							<v-icon name="hi-arrow-up" scale="0.9" />
							<span>Withdraw</span>
						</button>
						<button class="balance-btn tertiary" @click="scrollToTransactions">
							<v-icon name="hi-clock" scale="0.9" />
							<span>History</span>
						</button>
					</div>
					<div class="card-decoration circle-1"></div>
					<div class="card-decoration circle-2"></div>
				</div>

				<!-- Earnings + Quick Actions Row -->
				<div class="grid-row grid-row--two-col">
					<!-- Earnings Overview -->
					<div class="bento-card earnings-card">
						<div class="card-header">
							<h3>
								<v-icon name="hi-chart-bar" scale="0.9" />
								Earnings Overview
							</h3>
						</div>
						<div class="card-content">
							<div class="earnings-section">
								<h4>This Month</h4>
								<div class="earnings-items">
									<div class="earnings-item">
										<span class="label">Credited</span>
										<span class="value credited">+{{ formatConverted(walletStats?.this_month?.credited || 0) }}</span>
									</div>
									<div class="earnings-item">
										<span class="label">Debited</span>
										<span class="value debited">-{{ formatConverted(walletStats?.this_month?.debited || 0) }}</span>
									</div>
									<div class="earnings-item">
										<span class="label">Transactions</span>
										<span class="value">{{ walletStats?.this_month?.transactions || 0 }}</span>
									</div>
								</div>
							</div>
							<div class="earnings-divider"></div>
							<div class="earnings-section">
								<h4>Lifetime</h4>
								<div class="earnings-items">
									<div class="earnings-item">
										<span class="label">Total Earned</span>
										<span class="value credited">{{ formatConverted(walletStats?.lifetime?.total_credited || 0) }}</span>
									</div>
									<div class="earnings-item">
										<span class="label">Total Withdrawn</span>
										<span class="value debited">{{ formatConverted(walletStats?.lifetime?.total_debited || 0) }}</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Quick Actions -->
					<div class="bento-card actions-card">
						<div class="card-header">
							<h3>
								<v-icon name="hi-lightning-bolt" scale="0.9" />
								Quick Actions
							</h3>
						</div>
						<div class="actions-grid">
							<button class="action-btn" @click="showTopUpModal = true">
								<div class="action-icon sky"><v-icon name="hi-plus-circle" scale="1.1" /></div>
								<span>Top Up</span>
							</button>
							<button class="action-btn" @click="showWithdrawModal = true">
								<div class="action-icon emerald"><v-icon name="hi-arrow-up" scale="1.1" /></div>
								<span>Withdraw</span>
							</button>
							<button class="action-btn" @click="scrollToBanks">
								<div class="action-icon amber"><v-icon name="hi-office-building" scale="1.1" /></div>
								<span>Bank Accounts</span>
							</button>
							<button class="action-btn" @click="scrollToPayouts">
								<div class="action-icon violet"><v-icon name="hi-document-text" scale="1.1" /></div>
								<span>Statements</span>
							</button>
							<button class="action-btn" @click="$router.push('/app/specialist/specialist-dashboard')">
								<div class="action-icon rose"><v-icon name="hi-home" scale="1.1" /></div>
								<span>Dashboard</span>
							</button>
							<button class="action-btn" @click="$router.push('/app/specialist/specialist-account')">
								<div class="action-icon gray"><v-icon name="hi-cog" scale="1.1" /></div>
								<span>Settings</span>
							</button>
						</div>
					</div>
				</div>

				<!-- AI Credits Card -->
				<div class="bento-card credits-card">
					<div class="card-header">
						<h3>
							<v-icon name="hi-sparkles" scale="0.9" />
							RxGPT AI Credits
						</h3>
						<button class="header-btn" @click="scrollToPlans">
							<v-icon name="hi-plus" scale="0.8" />
							<span>Buy Credits</span>
						</button>
					</div>
					<div class="card-content">
						<div class="credits-display">
							<div class="credits-main">
								<span class="credits-number">{{ totalAICredits }}</span>
								<span class="credits-label">credits available</span>
							</div>
							<div class="credits-progress">
								<div class="progress-bar">
									<div class="progress-fill" :style="{ width: creditsProgressWidth + '%' }"></div>
								</div>
							</div>
							<div class="credits-breakdown">
								<div class="breakdown-item">
									<span class="item-value free">{{ aiCredits?.free_credits || 0 }}</span>
									<span class="item-label">Free</span>
								</div>
								<div class="breakdown-divider"></div>
								<div class="breakdown-item">
									<span class="item-value purchased">{{ aiCredits?.purchased_credits || 0 }}</span>
									<span class="item-label">Purchased</span>
								</div>
								<div class="breakdown-divider"></div>
								<div class="breakdown-item">
									<span class="item-value gifted">{{ aiCredits?.gifted_credits || 0 }}</span>
									<span class="item-label">Gifted</span>
								</div>
							</div>
						</div>
						<div v-if="aiCredits?.has_unlimited" class="unlimited-badge">
							<v-icon name="hi-check-circle" scale="0.9" />
							<span>Unlimited Subscription Active</span>
						</div>
					</div>
				</div>

				<!-- AI Credit Plans -->
				<div class="bento-card" ref="plansSection">
					<div class="card-header">
						<h3>
							<v-icon name="hi-collection" scale="0.9" />
							AI Credit Plans
						</h3>
					</div>
					<div class="card-content">
						<div v-if="loadingPlans" class="empty-state">
							<p>Loading plans...</p>
						</div>
						<div v-else-if="creditPlans.length" class="plans-grid">
							<div
								v-for="plan in creditPlans"
								:key="plan._id"
								class="plan-card"
								:class="{ popular: plan.is_popular, unlimited: plan.type !== 'bundle' }"
							>
								<div v-if="plan.is_popular" class="popular-badge">Most Popular</div>
								<div class="plan-icon">
									<v-icon :name="plan.type !== 'bundle' ? 'hi-star' : 'hi-sparkles'" scale="1.2" />
								</div>
								<h4 class="plan-name">{{ plan.name }}</h4>
								<p class="plan-description">{{ plan.description }}</p>
								<div class="plan-credits">
									<span class="credits-value">{{ plan.type !== 'bundle' ? 'Unlimited' : plan.credits }}</span>
									<span class="credits-unit">{{ plan.type !== 'bundle' ? `for ${plan.duration_days} days` : 'credits' }}</span>
								</div>
								<div class="plan-price">
									<span class="price-value">{{ formatPlanPrice(plan) }}</span>
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
						<div v-else class="empty-state">
							<v-icon name="hi-collection" scale="2" />
							<p>No plans available at the moment</p>
						</div>
					</div>
				</div>

				<!-- AI Credit Transactions -->
				<div class="bento-card" ref="creditTxnSection">
					<div class="card-header">
						<h3>
							<v-icon name="hi-sparkles" scale="0.9" />
							AI Credit History
						</h3>
					</div>
					<div class="card-content">
						<!-- Filter Tabs -->
						<div class="filter-tabs">
							<button
								v-for="filter in creditTxnFilters"
								:key="filter.value"
								class="filter-tab"
								:class="{ active: selectedCreditTxnFilter === filter.value }"
								@click="selectCreditTxnFilter(filter.value)"
							>
								{{ filter.label }}
							</button>
						</div>

						<div v-if="creditTransactions.length" class="credit-txn-list">
							<div
								v-for="txn in creditTransactions"
								:key="txn._id"
								class="credit-txn-item"
							>
								<div class="credit-txn-info">
									<div class="credit-txn-icon" :class="getCreditTxnClass(txn.type)">
										<v-icon :name="getCreditTxnIconName(txn.type)" scale="0.9" />
									</div>
									<div class="credit-txn-details">
										<span class="credit-txn-desc">{{ txn.description }}</span>
										<span class="credit-txn-date">{{ formatDate(txn.created_at) }}</span>
									</div>
								</div>
								<div class="credit-txn-right">
									<span class="credit-txn-delta" :class="txn.credits_delta >= 0 ? 'positive' : 'negative'">
										{{ txn.credits_delta >= 0 ? '+' : '' }}{{ txn.credits_delta }} credits
									</span>
									<span v-if="txn.amount" class="credit-txn-amount">
										{{ formatConverted(txn.amount) }}
									</span>
								</div>
							</div>

							<button
								v-if="creditTxnPagination.page < creditTxnPagination.total_pages"
								class="load-more-btn"
								@click="loadCreditTransactions(creditTxnPagination.page + 1)"
								:disabled="isLoadingCreditTxns"
							>
								{{ isLoadingCreditTxns ? 'Loading...' : 'Load More' }}
							</button>
						</div>
						<div v-else class="empty-state">
							<v-icon name="hi-sparkles" scale="2" />
							<p>No AI credit transactions yet</p>
							<span class="empty-sub">Purchase credits or use RxGPT to see your history</span>
						</div>
					</div>
				</div>

				<!-- Bank Accounts -->
				<div class="bento-card" ref="banksSection">
					<div class="card-header">
						<h3>
							<v-icon name="hi-office-building" scale="0.9" />
							Bank Accounts
						</h3>
						<button class="header-btn" @click="showAddBankModal = true">
							<v-icon name="hi-plus" scale="0.8" />
							<span>Add Bank</span>
						</button>
					</div>
					<div class="card-content">
						<div v-if="bankAccounts.length" class="bank-list">
							<div
								v-for="account in bankAccounts"
								:key="account._id"
								class="bank-item"
								:class="{ selected: selectedBank?._id === account._id }"
								@click="selectBank(account)"
							>
								<div class="bank-radio">
									<div class="radio-dot" :class="{ active: selectedBank?._id === account._id }"></div>
								</div>
								<div class="bank-info">
									<span class="bank-name">{{ account.bank_name }}</span>
									<span class="bank-number">{{ account.account_number }}</span>
									<span class="bank-holder">{{ account.account_name }}</span>
								</div>
								<div class="bank-actions">
									<span v-if="account.is_default" class="default-badge">Default</span>
									<button class="delete-btn" @click.stop="confirmDeleteBank(account)">
										<v-icon name="hi-x" scale="0.8" />
									</button>
								</div>
							</div>
						</div>
						<div v-else class="empty-state">
							<v-icon name="hi-office-building" scale="2" />
							<p>No bank accounts added yet</p>
							<button class="empty-cta" @click="showAddBankModal = true">
								<v-icon name="hi-plus" scale="0.8" />
								Add your first bank account
							</button>
						</div>
					</div>
				</div>

				<!-- Payout History -->
				<div class="bento-card" ref="payoutsSection">
					<div class="card-header">
						<h3>
							<v-icon name="hi-cash" scale="0.9" />
							Payout History
						</h3>
					</div>
					<div class="card-content">
						<div v-if="withdrawals.length" class="payout-list">
							<div
								v-for="payout in withdrawals"
								:key="payout._id"
								class="payout-item"
							>
								<div class="payout-info">
									<div class="payout-icon">
										<v-icon name="hi-arrow-up" scale="0.9" />
									</div>
									<div class="payout-details">
										<span class="payout-bank">{{ payout.metadata?.bank_name || 'Bank Transfer' }}</span>
										<span class="payout-date">{{ formatDate(payout.created_at) }}</span>
										<span v-if="payout.metadata?.account_number" class="payout-account">
											****{{ payout.metadata.account_number.slice(-4) }}
										</span>
									</div>
								</div>
								<div class="payout-right">
									<span class="payout-amount">-{{ formatConverted(payout.amount) }}</span>
									<span class="payout-status" :class="getStatusClass(payout.status)">
										{{ payout.status }}
									</span>
								</div>
							</div>
						</div>
						<div v-else class="empty-state">
							<v-icon name="hi-cash" scale="2" />
							<p>No payouts yet</p>
							<span class="empty-sub">Withdraw funds to your bank account to see payout history</span>
						</div>
					</div>
				</div>

				<!-- Transaction History -->
				<div class="bento-card" ref="transactionsSection">
					<div class="card-header">
						<h3>
							<v-icon name="hi-clock" scale="0.9" />
							All Transactions
						</h3>
					</div>
					<div class="card-content">
						<!-- Filter Tabs -->
						<div class="filter-tabs">
							<button
								v-for="filter in transactionFilters"
								:key="filter.value"
								class="filter-tab"
								:class="{ active: selectedFilter === filter.value }"
								@click="selectFilter(filter.value)"
							>
								{{ filter.label }}
							</button>
						</div>

						<div v-if="transactions.length" class="transaction-list">
							<div
								v-for="txn in transactions"
								:key="txn._id"
								class="txn-item"
							>
								<div class="txn-info">
									<div class="txn-icon" :class="getTxnClass(txn.type)">
										{{ getTxnIcon(txn.type) }}
									</div>
									<div class="txn-details">
										<span class="txn-desc">{{ txn.description }}</span>
										<span class="txn-date">{{ formatDate(txn.created_at) }}</span>
									</div>
								</div>
								<span class="txn-amount" :class="getTxnClass(txn.type)">
									{{ getTxnSign(txn.type) }}{{ formatConverted(txn.amount) }}
								</span>
							</div>

							<!-- Load More -->
							<button
								v-if="txnPagination.currentPage < txnPagination.pages"
								class="load-more-btn"
								@click="loadTransactions(txnPagination.currentPage + 1)"
								:disabled="isLoadingMore"
							>
								{{ isLoadingMore ? 'Loading...' : 'Load More' }}
							</button>
						</div>
						<div v-else class="empty-state">
							<v-icon name="hi-clock" scale="2" />
							<p>No transactions yet</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Top Up Modal -->
		<rc-modal
			v-if="showTopUpModal"
			title="Top Up Wallet"
			@closeModal="closeTopUpModal"
			:has-footer="true"
		>
			<template v-slot:body>
				<loader
					v-if="isProcessingTopUp"
					:useOverlay="true"
					style="position: absolute; border-radius: 16px"
				/>
				<div v-if="topUpSuccess" class="modal-success">
					<div class="success-icon">
						<v-icon name="hi-check-circle" scale="3" />
					</div>
					<h2>Top Up Successful!</h2>
					<p>{{ format(topUpAmount) }} has been added to your wallet.</p>
				</div>
				<div v-else class="topup-body">
					<div class="topup-amount-section">
						<p class="topup-label">Enter Amount</p>
						<CurrencyInput
							v-model="topUpAmount"
							class="topup-amount-input"
							:placeholder="symbol + ' 0'"
							:options="{ currency: 'NGN', currencyDisplay: 'narrowSymbol' }"
						/>
						<p class="topup-min">Minimum: {{ format(100) }}</p>
					</div>
					<div class="quick-amounts">
						<button
							v-for="amt in quickAmounts"
							:key="amt"
							class="quick-amount-btn"
							:class="{ active: topUpAmount === amt }"
							@click="topUpAmount = amt"
						>
							{{ format(amt) }}
						</button>
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<rc-button
					v-if="!topUpSuccess"
					type="primary"
					label="Proceed to Payment"
					size="large"
					@click="initiateTopUp"
					:loading="isProcessingTopUp"
					:disabled="!topUpAmount || topUpAmount < 100 || isProcessingTopUp"
				/>
				<rc-button
					v-else
					type="primary"
					label="Done"
					size="large"
					@click="closeTopUpModal"
				/>
			</template>
		</rc-modal>

		<!-- Withdraw Modal -->
		<rc-modal
			v-if="showWithdrawModal"
			title="Withdraw Funds"
			@closeModal="closeWithdrawModal"
			:has-footer="true"
		>
			<template v-slot:body>
				<loader
					v-if="isProcessingWithdraw"
					:useOverlay="true"
					style="position: absolute; border-radius: 16px"
				/>
				<div v-if="withdrawSuccess" class="modal-success">
					<div class="success-icon">
						<v-icon name="hi-check-circle" scale="3" />
					</div>
					<h2>Withdrawal Initiated!</h2>
					<p>{{ format(withdrawAmount) }} is being transferred to your bank account.</p>
				</div>
				<div v-else-if="withdrawStep === 'confirm'" class="withdraw-confirm">
					<div class="confirm-card">
						<p class="confirm-label">Transfer</p>
						<p class="confirm-amount">{{ format(withdrawAmount) }}</p>
						<p class="confirm-to">to {{ withdrawBank?.bank_name }}</p>
						<p class="confirm-account">****{{ withdrawBank?.account_number?.slice(-4) }}</p>
						<p class="confirm-name">{{ withdrawBank?.account_name }}</p>
					</div>
				</div>
				<div v-else class="withdraw-body">
					<div class="withdraw-amount-section">
						<p class="withdraw-label">Enter Amount</p>
						<CurrencyInput
							v-model="withdrawAmount"
							class="withdraw-amount-input"
							:placeholder="symbol + ' 0'"
							:options="{ currency: 'NGN', currencyDisplay: 'narrowSymbol' }"
						/>
						<p class="withdraw-balance">Balance: {{ formatConverted(walletData.available_balance || 0) }}</p>
					</div>
					<div class="withdraw-bank-section">
						<div class="section-header">
							<p>Select Bank Account</p>
							<button class="add-inline-btn" @click="showAddBankModal = true">
								<v-icon name="hi-plus" scale="0.7" />
								Add Bank
							</button>
						</div>
						<div v-if="bankAccounts.length" class="withdraw-bank-list">
							<div
								v-for="account in bankAccounts"
								:key="account._id"
								class="withdraw-bank-item"
								:class="{ selected: withdrawBank?._id === account._id }"
								@click="withdrawBank = account"
							>
								<div class="radio-dot" :class="{ active: withdrawBank?._id === account._id }"></div>
								<div class="bank-info">
									<span class="bank-name">{{ account.bank_name }}</span>
									<span class="bank-number">{{ account.account_number }}</span>
								</div>
								<span v-if="account.is_default" class="default-badge small">Default</span>
							</div>
						</div>
						<p v-else class="no-banks">No bank accounts. Please add one first.</p>
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<template v-if="!withdrawSuccess">
					<rc-button
						v-if="withdrawStep === 'confirm'"
						type="tertiary"
						label="Back"
						size="large"
						@click="withdrawStep = 'entry'"
						:disabled="isProcessingWithdraw"
						style="margin-right: 12px"
					/>
					<rc-button
						v-if="withdrawStep === 'confirm'"
						type="primary"
						label="Confirm Withdrawal"
						size="large"
						@click="submitWithdraw"
						:loading="isProcessingWithdraw"
						:disabled="isProcessingWithdraw"
					/>
					<rc-button
						v-else
						type="primary"
						label="Withdraw Funds"
						size="large"
						@click="proceedToConfirm"
						:disabled="!withdrawAmount || withdrawAmount < 100 || !withdrawBank"
					/>
				</template>
				<rc-button
					v-else
					type="primary"
					label="Done"
					size="large"
					@click="closeWithdrawModal"
				/>
			</template>
		</rc-modal>

		<!-- Add Bank Account Modal -->
		<rc-modal
			v-if="showAddBankModal"
			title="Add Bank Account"
			@closeModal="closeAddBankModal"
			:has-footer="true"
		>
			<template v-slot:body>
				<div class="add-bank-body">
					<rc-select
						label="Select Bank"
						:options="banksListOptions?.map((i) => i.name)"
						v-model="newBankName"
					/>
					<rc-text label="Account Number" v-model="newAccountNumber" />
					<div class="resolve-info">
						<template v-if="resolvedAccount?.account_name">
							<p class="resolve-label">Account Name:</p>
							<p class="resolve-name">{{ resolvedAccount.account_name }}</p>
						</template>
						<p v-else-if="newAccountNumber?.length === 10 && newBankName" class="resolve-loading">
							{{ isResolving ? 'Resolving...' : 'Could not resolve account' }}
						</p>
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<rc-button
					type="primary"
					label="Add Bank Account"
					size="large"
					@click="submitAddBank"
					:loading="isAddingBank"
					:disabled="!resolvedAccount?.account_name || isAddingBank"
				/>
			</template>
		</rc-modal>

		<!-- Delete Bank Confirmation Modal -->
		<modal-caution
			v-show="showDeleteBankModal"
			title="Delete Bank Account?"
			@closeModal="showDeleteBankModal = false"
			:has-footer="true"
		>
			<template v-slot:body>
				<div class="modal__content">
					<div class="caution">
						<p class="text">
							Are you sure you want to remove this bank account?
							This action cannot be undone.
						</p>
					</div>
				</div>
			</template>
			<template v-slot:foot>
				<rc-button
					type="tertiary"
					label="Cancel"
					size="small"
					@click="showDeleteBankModal = false"
					:disabled="isDeletingBank"
				/>
				<rc-button
					type="primary"
					label="Delete"
					size="small"
					:loading="isDeletingBank"
					:disabled="isDeletingBank"
					@click="deleteBank"
				/>
			</template>
		</modal-caution>

		<!-- Purchase Plan Modal -->
		<rc-modal
			v-if="showPurchaseModal"
			title="Purchase AI Credits"
			@closeModal="closePurchaseModal"
			:has-footer="true"
		>
			<template v-slot:body>
				<loader
					v-if="purchasingPlan"
					:useOverlay="true"
					style="position: absolute; border-radius: 16px"
				/>
				<div v-if="purchaseSuccess" class="modal-success">
					<div class="success-icon">
						<v-icon name="hi-check-circle" scale="3" />
					</div>
					<h2>Purchase Successful!</h2>
					<p>{{ selectedPlan?.type !== 'bundle' ? 'Unlimited subscription activated!' : `${selectedPlan?.credits} credits added to your account.` }}</p>
				</div>
				<div v-else class="purchase-body">
					<div class="purchase-summary">
						<div class="summary-row">
							<span>Plan</span>
							<span>{{ selectedPlan?.name }}</span>
						</div>
						<div class="summary-row">
							<span>Credits</span>
							<span>{{ selectedPlan?.type !== 'bundle' ? `Unlimited (${selectedPlan?.duration_days} days)` : `${selectedPlan?.credits} credits` }}</span>
						</div>
						<div class="summary-divider"></div>
						<div class="summary-row total">
							<span>Total</span>
							<span>{{ formatPlanPrice(selectedPlan) }}</span>
						</div>
					</div>
					<div class="payment-source">
						<v-icon name="bi-wallet2" scale="1.1" />
						<div class="payment-info">
							<span class="payment-title">Pay from Specialist Wallet</span>
							<span class="payment-balance">Balance: {{ formatConverted(walletData.available_balance || 0) }}</span>
						</div>
					</div>
					<p v-if="(walletData.available_balance || 0) < (selectedPlan?.price || 0)" class="insufficient-warning">
						<v-icon name="hi-exclamation" scale="0.85" />
						Insufficient wallet balance. Please top up your wallet first.
					</p>
				</div>
			</template>
			<template v-slot:foot>
				<rc-button
					v-if="!purchaseSuccess"
					type="primary"
					:label="'Pay ' + formatPlanPrice(selectedPlan)"
					size="large"
					@click="executePurchase"
					:loading="purchasingPlan"
					:disabled="purchasingPlan || (walletData.available_balance || 0) < (selectedPlan?.price || 0)"
				/>
				<rc-button
					v-else
					type="primary"
					label="Done"
					size="large"
					@click="closePurchaseModal"
				/>
			</template>
		</rc-modal>
	</div>
</template>

<script setup>
import { ref, inject, onMounted, watchEffect, computed } from "vue";
import { useToast } from 'vue-toast-notification';
import { useCurrency } from '@/composables/useCurrency';
import RcButton from "@/components/buttons/button-primary";
import RcSelect from "@/components/inputs/select-dropdown";
import RcText from "@/components/inputs/text";
import RcModal from "@/components/modals/dialog-modal";
import ModalCaution from "@/components/modals/modal-caution";
import Loader from "@/components/Loader/main-loader";
import CurrencyInput from "@/components/inputs/currency-input";

const $http = inject("$http");
const $toast = useToast();
const { format, formatConverted, symbol, currencyCode } = useCurrency();

const formatPlanPrice = (plan) => {
	const code = currencyCode.value;
	const multiPrice = plan?.prices?.[code]?.price ?? plan?.prices?.[code]?.amount;
	if (multiPrice != null) return format(multiPrice);
	return formatConverted(plan?.price ?? plan?.amount ?? 0);
};

// Refs for scrolling
const transactionsSection = ref(null);
const banksSection = ref(null);
const payoutsSection = ref(null);

// Loading states
const isLoading = ref(true);
const isLoadingMore = ref(false);

// Data
const walletData = ref({});
const walletStats = ref({});
const earnings = ref({});
const transactions = ref([]);
const txnPagination = ref({ currentPage: 1, pages: 1, total: 0 });
const withdrawals = ref([]);
const bankAccounts = ref([]);
const selectedBank = ref(null);
const banksListOptions = ref([]);

// Top Up
const showTopUpModal = ref(false);
const isProcessingTopUp = ref(false);
const topUpSuccess = ref(false);
const topUpAmount = ref(null);
const quickAmounts = [1000, 5000, 10000, 20000, 50000];

// Withdraw
const showWithdrawModal = ref(false);
const isProcessingWithdraw = ref(false);
const withdrawSuccess = ref(false);
const withdrawAmount = ref(null);
const withdrawBank = ref(null);
const withdrawStep = ref('entry');

// Add Bank
const showAddBankModal = ref(false);
const isAddingBank = ref(false);
const isResolving = ref(false);
const newBankName = ref("");
const newAccountNumber = ref("");
const resolvedAccount = ref({});

// Delete Bank
const showDeleteBankModal = ref(false);
const isDeletingBank = ref(false);
const bankToDelete = ref(null);

// AI Credits
const plansSection = ref(null);
const aiCredits = ref(null);
const creditPlans = ref([]);
const loadingPlans = ref(false);
const showPurchaseModal = ref(false);
const selectedPlan = ref(null);
const purchasingPlan = ref(false);
const purchaseSuccess = ref(false);
const creditTransactions = ref([]);
const creditTxnPagination = ref({ page: 1, total_pages: 1, total: 0 });
const isLoadingCreditTxns = ref(false);
const creditTxnSection = ref(null);
const selectedCreditTxnFilter = ref("");
const creditTxnFilters = [
	{ label: "All", value: "" },
	{ label: "Credits Added", value: "credits" },
	{ label: "Credits Used", value: "usage" },
];

// Transaction Filters
const selectedFilter = ref("");
const transactionFilters = [
	{ label: "All", value: "" },
	{ label: "Credits", value: "CREDIT" },
	{ label: "Debits", value: "DEBIT" },
	{ label: "Holds", value: "HOLD" },
	{ label: "Refunds", value: "REFUND" },
];

// Computed
const activeBankItem = computed(() =>
	banksListOptions.value.find((item) => item.name === newBankName.value)
);

const totalAICredits = computed(() => {
	if (!aiCredits.value) return 0;
	if (aiCredits.value.has_unlimited) return '∞';
	return (aiCredits.value.free_credits || 0) + (aiCredits.value.purchased_credits || 0) + (aiCredits.value.gifted_credits || 0);
});

const creditsProgressWidth = computed(() => {
	if (!aiCredits.value || aiCredits.value.has_unlimited) return 100;
	const total = (aiCredits.value.free_credits || 0) + (aiCredits.value.purchased_credits || 0) + (aiCredits.value.gifted_credits || 0);
	const max = Math.max(total, 50);
	return Math.min((total / max) * 100, 100);
});

// Formatters

const formatDate = (dateStr) => {
	if (!dateStr) return '';
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-NG', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const getTxnIcon = (type) => {
	const icons = { CREDIT: '↓', DEBIT: '↑', HOLD: '🔒', RELEASE: '🔓', REFUND: '↩' };
	return icons[type] || '•';
};

const getTxnClass = (type) => {
	if (['CREDIT', 'RELEASE', 'REFUND'].includes(type)) return 'credit';
	if (['DEBIT'].includes(type)) return 'debit';
	if (['HOLD'].includes(type)) return 'hold';
	return '';
};

const getTxnSign = (type) => {
	if (['CREDIT', 'RELEASE', 'REFUND'].includes(type)) return '+';
	if (['DEBIT', 'HOLD'].includes(type)) return '-';
	return '';
};

const getStatusClass = (status) => {
	if (status === 'COMPLETED') return 'completed';
	if (status === 'PENDING') return 'pending';
	if (status === 'FAILED') return 'failed';
	return '';
};

// Scroll helpers
const scrollToTransactions = () => transactionsSection.value?.scrollIntoView({ behavior: 'smooth' });
const scrollToBanks = () => banksSection.value?.scrollIntoView({ behavior: 'smooth' });
const scrollToPayouts = () => payoutsSection.value?.scrollIntoView({ behavior: 'smooth' });
const scrollToPlans = () => plansSection.value?.scrollIntoView({ behavior: 'smooth' });

// Data loading
const loadWallet = async () => {
	try {
		const { data } = await $http.$_getSpecialistWallet();
		walletData.value = data.data;
	} catch (error) {
		console.error('Error loading wallet:', error);
	}
};

const loadWalletStats = async () => {
	try {
		const { data } = await $http.$_getSpecialistWalletStats();
		walletStats.value = data.data;
	} catch (error) {
		console.error('Error loading stats:', error);
	}
};

const loadEarnings = async () => {
	try {
		const { data } = await $http.$_getSpecialistEarnings();
		earnings.value = data.data;
	} catch (error) {
		console.error('Error loading earnings:', error);
	}
};

const loadTransactions = async (page = 1) => {
	if (page > 1) isLoadingMore.value = true;
	try {
		const params = { page, limit: 10 };
		if (selectedFilter.value) params.type = selectedFilter.value;

		const { data } = await $http.$_getSpecialistWalletTransactions(params);
		const docs = data.data.docs || [];

		if (page === 1) {
			transactions.value = docs;
		} else {
			transactions.value = [...transactions.value, ...docs];
		}
		txnPagination.value = {
			currentPage: data.data.currentPage,
			pages: data.data.pages,
			total: data.data.total,
		};
	} catch (error) {
		console.error('Error loading transactions:', error);
	} finally {
		isLoadingMore.value = false;
	}
};

const loadWithdrawals = async () => {
	try {
		const { data } = await $http.$_getSpecialistWithdrawals({ page: 1, limit: 20 });
		withdrawals.value = data.data.docs || [];
	} catch (error) {
		console.error('Error loading withdrawals:', error);
	}
};

const loadBankAccounts = async () => {
	try {
		const { data } = await $http.$_userBankAccounts();
		bankAccounts.value = data.data || [];
		const defaultBank = bankAccounts.value.find(b => b.is_default);
		if (defaultBank) {
			selectedBank.value = defaultBank;
			withdrawBank.value = defaultBank;
		}
	} catch (error) {
		console.error('Error loading bank accounts:', error);
	}
};

const loadBanksList = async () => {
	try {
		const { data } = await $http.$_getBankLists();
		banksListOptions.value = data.data || [];
	} catch (error) {
		console.error('Error loading banks list:', error);
	}
};

// AI Credits
const loadAICredits = async () => {
	try {
		const { data } = await $http.$_getRxGPTCredits();
		aiCredits.value = data.data;
	} catch (error) {
		console.error('Error loading AI credits:', error);
	}
};

const loadCreditPlans = async () => {
	loadingPlans.value = true;
	try {
		const { data } = await $http.$_getClaudeSummaryPlans();
		creditPlans.value = data.data || [];
	} catch (error) {
		console.error('Error loading credit plans:', error);
	} finally {
		loadingPlans.value = false;
	}
};

const openPurchaseModal = (plan) => {
	selectedPlan.value = plan;
	purchaseSuccess.value = false;
	purchasingPlan.value = false;
	showPurchaseModal.value = true;
};

const executePurchase = async () => {
	if (!selectedPlan.value) return;
	purchasingPlan.value = true;
	try {
		await $http.$_purchaseSpecialistCreditPlan(selectedPlan.value._id);
		purchaseSuccess.value = true;
		$toast.success('AI credits purchased successfully!');
		await Promise.all([loadAICredits(), loadWallet()]);
	} catch (error) {
		$toast.error(error.response?.data?.message || 'Failed to purchase plan');
	} finally {
		purchasingPlan.value = false;
	}
};

const closePurchaseModal = () => {
	showPurchaseModal.value = false;
	selectedPlan.value = null;
	purchaseSuccess.value = false;
	purchasingPlan.value = false;
};

// AI Credit Transactions
const creditUsageTypes = ['free_usage', 'purchased_usage', 'gifted_usage', 'unlimited_usage'];
const creditAddTypes = ['bundle_purchase', 'unlimited_purchase', 'admin_gift', 'admin_gift_unlimited', 'monthly_reset', 'credit_transfer_received'];

const loadCreditTransactions = async (page = 1) => {
	if (page > 1) isLoadingCreditTxns.value = true;
	try {
		const { data } = await $http.$_getSpecialistCreditTransactions({ page, limit: 20 });
		let txns = data.data?.transactions || [];

		// Client-side filter
		if (selectedCreditTxnFilter.value === 'usage') {
			txns = txns.filter(t => creditUsageTypes.includes(t.type));
		} else if (selectedCreditTxnFilter.value === 'credits') {
			txns = txns.filter(t => creditAddTypes.includes(t.type));
		}

		if (page === 1) {
			creditTransactions.value = txns;
		} else {
			creditTransactions.value = [...creditTransactions.value, ...txns];
		}
		creditTxnPagination.value = {
			page: data.data?.page || page,
			total_pages: data.data?.total_pages || 1,
			total: data.data?.total || 0,
		};
	} catch (error) {
		console.error('Error loading credit transactions:', error);
	} finally {
		isLoadingCreditTxns.value = false;
	}
};

const selectCreditTxnFilter = (value) => {
	selectedCreditTxnFilter.value = value;
	loadCreditTransactions(1);
};

const getCreditTxnClass = (type) => {
	if (type?.includes('purchase') || type?.includes('gift') || type?.includes('reset') || type?.includes('received')) return 'credit-add';
	if (type?.includes('usage') || type?.includes('revoke') || type?.includes('expired') || type?.includes('sent')) return 'credit-use';
	return '';
};

const getCreditTxnIconName = (type) => {
	if (type?.includes('purchase')) return 'hi-shopping-cart';
	if (type?.includes('usage')) return 'hi-sparkles';
	if (type?.includes('gift') || type?.includes('received')) return 'hi-gift';
	if (type?.includes('reset')) return 'hi-refresh';
	if (type?.includes('expired') || type?.includes('revoke')) return 'hi-x-circle';
	if (type?.includes('sent')) return 'hi-arrow-up';
	return 'hi-sparkles';
};

const selectFilter = (value) => {
	selectedFilter.value = value;
	loadTransactions(1);
};

const selectBank = (account) => {
	selectedBank.value = account;
	if (!account.is_default) {
		$http.$_makeBankAccountDefault({ bankId: account._id }).then(() => {
			$toast.success('Default bank updated');
			loadBankAccounts();
		}).catch(() => {});
	}
};

// Top Up
const initiateTopUp = async () => {
	if (!topUpAmount.value || topUpAmount.value < 100) {
		$toast.error(`Minimum top-up amount is ${format(100)}`);
		return;
	}
	isProcessingTopUp.value = true;
	try {
		const { data } = await $http.$_initializeWalletTopUp({
			amount: topUpAmount.value,
			callback_url: window.location.href,
		});
		if (data.data.authorization_url) {
			localStorage.setItem('wallet_topup_reference', data.data.reference);
			window.location.href = data.data.authorization_url;
		} else {
			$toast.error('Failed to initialize payment');
			isProcessingTopUp.value = false;
		}
	} catch (error) {
		$toast.error(error.response?.data?.message || 'Failed to initiate top-up');
		isProcessingTopUp.value = false;
	}
};

const verifyPayment = async (reference) => {
	try {
		const { data } = await $http.$_verifyWalletTopUp({ reference });
		if (data.data.success) {
			topUpSuccess.value = true;
			showTopUpModal.value = true;
			await refreshData();
			$toast.success('Wallet topped up successfully!');
		}
	} catch (error) {
		$toast.error('Payment verification failed');
	} finally {
		localStorage.removeItem('wallet_topup_reference');
	}
};

const closeTopUpModal = () => {
	showTopUpModal.value = false;
	isProcessingTopUp.value = false;
	topUpSuccess.value = false;
	topUpAmount.value = null;
};

// Withdraw
const proceedToConfirm = () => {
	if (!withdrawAmount.value || withdrawAmount.value < 100) {
		$toast.error(`Minimum withdrawal is ${format(100)}`);
		return;
	}
	if (withdrawAmount.value > (walletData.value.available_balance || 0)) {
		$toast.error('Insufficient balance');
		return;
	}
	if (!withdrawBank.value) {
		$toast.error('Please select a bank account');
		return;
	}
	withdrawStep.value = 'confirm';
};

const submitWithdraw = async () => {
	isProcessingWithdraw.value = true;
	try {
		await $http.$_specialistWalletWithdraw({
			bankId: withdrawBank.value._id,
			amount: withdrawAmount.value,
		});
		withdrawSuccess.value = true;
		$toast.success('Withdrawal initiated successfully!');
		await refreshData();
	} catch (error) {
		$toast.error(error.response?.data?.message || 'Withdrawal failed');
	} finally {
		isProcessingWithdraw.value = false;
	}
};

const closeWithdrawModal = () => {
	showWithdrawModal.value = false;
	isProcessingWithdraw.value = false;
	withdrawSuccess.value = false;
	withdrawAmount.value = null;
	withdrawBank.value = selectedBank.value;
	withdrawStep.value = 'entry';
};

// Bank Account CRUD
const closeAddBankModal = () => {
	showAddBankModal.value = false;
	newBankName.value = "";
	newAccountNumber.value = "";
	resolvedAccount.value = {};
	isAddingBank.value = false;
	isResolving.value = false;
};

const submitAddBank = async () => {
	isAddingBank.value = true;
	try {
		await $http.$_addBankAccount({
			account_number: resolvedAccount.value.account_number,
			account_name: resolvedAccount.value.account_name,
			bank_name: activeBankItem.value.name,
			bank_code: activeBankItem.value.code,
			recipient_type: activeBankItem.value.type,
		});
		$toast.success('Bank account added successfully!');
		await loadBankAccounts();
		closeAddBankModal();
	} catch (error) {
		$toast.error(error.response?.data?.message || 'Failed to add bank');
		isAddingBank.value = false;
	}
};

const confirmDeleteBank = (account) => {
	bankToDelete.value = account;
	showDeleteBankModal.value = true;
};

const deleteBank = async () => {
	isDeletingBank.value = true;
	try {
		await $http.$_deleteBankAccount({ bankId: bankToDelete.value._id });
		$toast.success('Bank account removed');
		await loadBankAccounts();
		showDeleteBankModal.value = false;
		bankToDelete.value = null;
	} catch (error) {
		$toast.error('Failed to delete bank account');
	} finally {
		isDeletingBank.value = false;
	}
};

// Bank resolution watchEffect
watchEffect(async () => {
	if (newBankName.value && newAccountNumber.value?.length === 10 && activeBankItem.value) {
		isResolving.value = true;
		resolvedAccount.value = {};
		try {
			const { data } = await $http.$_resolveBankAccount({
				account_number: newAccountNumber.value,
				bank_code: activeBankItem.value.code,
			});
			resolvedAccount.value = data.data;
		} catch {
			$toast.error('Could not resolve account number');
		} finally {
			isResolving.value = false;
		}
	} else {
		resolvedAccount.value = {};
	}
});

// Refresh all data
const refreshData = async () => {
	await Promise.all([
		loadWallet(),
		loadWalletStats(),
		loadEarnings(),
		loadTransactions(1),
		loadWithdrawals(),
		loadBankAccounts(),
		loadAICredits(),
		loadCreditTransactions(1),
	]);
};

// Mount
onMounted(async () => {
	// Check for Paystack callback
	const urlParams = new URLSearchParams(window.location.search);
	const urlReference = urlParams.get('reference') || urlParams.get('trxref');
	const storedReference = localStorage.getItem('wallet_topup_reference');
	const reference = urlReference || storedReference;

	if (reference) {
		isProcessingTopUp.value = true;
		showTopUpModal.value = true;
		await verifyPayment(reference);
		isProcessingTopUp.value = false;
		window.history.replaceState({}, document.title, window.location.pathname);
	}

	await Promise.all([
		loadWallet(),
		loadWalletStats(),
		loadEarnings(),
		loadTransactions(1),
		loadWithdrawals(),
		loadBankAccounts(),
		loadBanksList(),
		loadAICredits(),
		loadCreditPlans(),
		loadCreditTransactions(1),
	]);

	isLoading.value = false;
});
</script>

<style lang="scss" scoped>
// Design Tokens (pharmacy design system)
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
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(20px);
	border: 1px solid rgba(255, 255, 255, 0.6);
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

// Page Container
.wallet-page {
	width: 100%;
	min-height: 100vh;
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

	.menu-btn, .header-action-btn {
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

		&:active { background: #E2E8F0; }
	}

	.header-logo {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 16px;
		font-weight: 600;
		color: $navy;
		svg { color: $sky-dark; }
	}
}

// Page Body
.page-body {
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
	padding: 80px 20px;
	gap: 16px;
	color: $gray;

	.loading-spinner {
		position: relative;
		width: 64px;
		height: 64px;

		.spinner-ring {
			width: 100%;
			height: 100%;
			border-radius: 50%;
			border: 3px solid $sky-light;
			border-top-color: $sky;
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
}

@keyframes spin { to { transform: rotate(360deg); } }

// Hero Section
.hero {
	background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
	border-radius: 28px;
	padding: 48px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 32px;
	overflow: hidden;
	position: relative;

	@media (max-width: 768px) {
		flex-direction: column;
		padding: 32px 24px;
		text-align: center;
		border-radius: 20px;
	}
}

.hero__content {
	flex: 1;
	max-width: 600px;
	z-index: 2;

	@media (max-width: 768px) {
		max-width: 100%;
	}
}

.hero__badge {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 6px 16px;
	background: rgba(255, 255, 255, 0.15);
	backdrop-filter: blur(10px);
	border-radius: 100px;
	color: white;
	font-size: 13px;
	font-weight: 500;
	margin-bottom: 20px;

	svg { width: 16px; height: 16px; }
}

.badge-pulse {
	width: 8px;
	height: 8px;
	background: $emerald;
	border-radius: 50%;
	animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% { opacity: 1; transform: scale(1); }
	50% { opacity: 0.5; transform: scale(1.5); }
}

.hero__title {
	font-size: 40px;
	font-weight: 800;
	color: white;
	line-height: 1.1;
	margin-bottom: 12px;
	font-family: 'Poppins', system-ui, sans-serif;

	@media (max-width: 768px) {
		font-size: 28px;
	}
}

.hero__title-accent {
	background: linear-gradient(135deg, #E1F5FE, #FFFFFF);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.hero__subtitle {
	font-size: 15px;
	color: rgba(255, 255, 255, 0.8);
	line-height: 1.5;
	margin-bottom: 28px;
}

.hero__stats {
	display: inline-flex;
	align-items: center;
	gap: 20px;
	padding: 16px 28px;
	background: rgba(255, 255, 255, 0.12);
	backdrop-filter: blur(10px);
	border-radius: 16px;
	border: 1px solid rgba(255, 255, 255, 0.15);

	@media (max-width: 768px) {
		width: 100%;
		justify-content: center;
		gap: 12px;
		padding: 14px 16px;
	}
}

.hero-stat {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 4px;

	&__value {
		font-size: 18px;
		font-weight: 700;
		color: white;

		@media (max-width: 768px) { font-size: 14px; }

		&--success { color: #A5F3FC; }
		&--warning { color: #FDE68A; }
		&--ai { color: #E9D5FF; }
	}

	&__label {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}

	&__divider {
		width: 1px;
		height: 32px;
		background: rgba(255, 255, 255, 0.2);
	}
}

// Hero Visual
.hero__visual {
	position: relative;
	width: 220px;
	height: 220px;
	flex-shrink: 0;

	@media (max-width: 768px) { display: none; }
}

.wallet-orb {
	position: relative;
	width: 100%;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: center;

	.orb-ring {
		position: absolute;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.1);

		&--1 { width: 100%; height: 100%; animation: orbit 20s linear infinite; }
		&--2 { width: 75%; height: 75%; animation: orbit 15s linear infinite reverse; }
		&--3 { width: 50%; height: 50%; animation: orbit 10s linear infinite; }
	}

	.orb-core {
		width: 80px;
		height: 80px;
		background: rgba(255, 255, 255, 0.2);
		backdrop-filter: blur(10px);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		z-index: 2;
		svg { width: 36px; height: 36px; }
	}
}

@keyframes orbit { to { transform: rotate(360deg); } }

.floating-icons {
	position: absolute;
	inset: 0;

	.float-icon {
		position: absolute;
		width: 36px;
		height: 36px;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		animation: float 6s ease-in-out infinite;

		&--1 { top: 10px; right: 20px; animation-delay: 0s; }
		&--2 { bottom: 30px; left: 10px; animation-delay: 2s; }
		&--3 { top: 50%; right: -5px; animation-delay: 4s; }
	}
}

@keyframes float {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-10px); }
}

// Bento Grid
.bento-grid {
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.bento-card {
	@include glass-card;
	border-radius: 20px;
	padding: 28px;
	position: relative;
	overflow: hidden;

	@media (max-width: 768px) {
		padding: 20px;
		border-radius: 16px;
	}
}

.card-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-bottom: 20px;

	h3 {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 16px;
		font-weight: 600;
		color: $navy;

		svg { color: $sky; }
	}

	.header-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		background: $sky-light;
		color: $sky-dark;
		border: none;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			background: $sky;
			color: white;
		}
	}
}

.card-content {
	position: relative;
}

// Balance Card
.balance-card {
	background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
	border: none;
	color: white;

	.balance-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 8px;

		.balance-label {
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 14px;
			opacity: 0.9;
			svg { color: white; }
		}
	}

	.balance-amount {
		display: flex;
		align-items: baseline;
		gap: 4px;
		margin-bottom: 16px;

		.currency { font-size: 28px; font-weight: 600; }
		.amount { font-size: 48px; font-weight: 800; font-family: 'Poppins', system-ui, sans-serif; }

		@media (max-width: 768px) {
			.currency { font-size: 20px; }
			.amount { font-size: 36px; }
		}
	}

	.balance-held {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: rgba(255, 255, 255, 0.15);
		border-radius: 10px;
		font-size: 13px;
		margin-bottom: 20px;
		svg { color: white; }
	}

	.balance-actions {
		display: flex;
		gap: 12px;

		@media (max-width: 768px) {
			flex-direction: column;
		}
	}

	.balance-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 24px;
		border-radius: 12px;
		border: none;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		flex: 1;

		svg { color: inherit; }

		&.primary {
			background: white;
			color: $sky-dark;
			&:hover { background: #F0F9FF; }
		}

		&.secondary {
			background: rgba(255, 255, 255, 0.2);
			color: white;
			border: 1px solid rgba(255, 255, 255, 0.3);
			&:hover { background: rgba(255, 255, 255, 0.3); }
		}

		&.tertiary {
			background: rgba(255, 255, 255, 0.1);
			color: rgba(255, 255, 255, 0.9);
			&:hover { background: rgba(255, 255, 255, 0.2); }
		}
	}

	.card-decoration {
		position: absolute;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.08);

		&.circle-1 {
			width: 200px;
			height: 200px;
			top: -60px;
			right: -40px;
		}

		&.circle-2 {
			width: 150px;
			height: 150px;
			bottom: -40px;
			left: -30px;
		}
	}
}

// Grid Row
.grid-row {
	display: grid;
	gap: 24px;

	&--two-col {
		grid-template-columns: 1fr 1fr;

		@media (max-width: 768px) {
			grid-template-columns: 1fr;
		}
	}
}

// Earnings Card
.earnings-card {
	.earnings-section {
		h4 {
			font-size: 13px;
			font-weight: 600;
			color: $gray;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			margin-bottom: 12px;
		}
	}

	.earnings-items {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.earnings-item {
		display: flex;
		justify-content: space-between;
		align-items: center;

		.label {
			font-size: 14px;
			color: $gray;
		}

		.value {
			font-size: 15px;
			font-weight: 600;
			color: $navy;

			&.credited { color: $emerald; }
			&.debited { color: $rose; }
		}
	}

	.earnings-divider {
		height: 1px;
		background: #F1F5F9;
		margin: 16px 0;
	}
}

// Actions Card
.actions-card {
	.actions-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;

		@media (max-width: 480px) {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.action-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 16px 8px;
		border: none;
		background: $bg;
		border-radius: 14px;
		cursor: pointer;
		transition: all 0.2s;

		&:hover {
			transform: translateY(-2px);
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
		}

		span {
			font-size: 12px;
			font-weight: 500;
			color: $slate;
		}
	}

	.action-icon {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;

		&.sky { background: $sky-light; color: $sky-dark; }
		&.emerald { background: $emerald-light; color: $emerald; }
		&.amber { background: $amber-light; color: $amber; }
		&.violet { background: $violet-light; color: $violet; }
		&.rose { background: $rose-light; color: $rose; }
		&.gray { background: #F1F5F9; color: $gray; }
	}
}

// Bank Accounts
.bank-list {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.bank-item {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px;
	background: $bg;
	border-radius: 14px;
	cursor: pointer;
	transition: all 0.2s;
	border: 2px solid transparent;

	&:hover { background: #F1F5F9; }

	&.selected {
		border-color: $sky;
		background: $sky-light;
	}
}

.bank-radio {
	flex-shrink: 0;
}

.radio-dot {
	width: 20px;
	height: 20px;
	border-radius: 50%;
	border: 2px solid #CBD5E1;
	transition: all 0.2s;
	position: relative;

	&.active {
		border-color: $sky-dark;

		&::after {
			content: '';
			position: absolute;
			top: 3px;
			left: 3px;
			width: 10px;
			height: 10px;
			border-radius: 50%;
			background: $sky-dark;
		}
	}
}

.bank-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 2px;

	.bank-name {
		font-size: 14px;
		font-weight: 600;
		color: $navy;
	}

	.bank-number {
		font-size: 13px;
		color: $gray;
		font-family: monospace;
	}

	.bank-holder {
		font-size: 12px;
		color: $light-gray;
	}
}

.bank-actions {
	display: flex;
	align-items: center;
	gap: 8px;
}

.default-badge {
	padding: 4px 10px;
	background: $emerald-light;
	color: $emerald;
	font-size: 11px;
	font-weight: 600;
	border-radius: 8px;

	&.small {
		padding: 2px 8px;
		font-size: 10px;
	}
}

.delete-btn {
	width: 28px;
	height: 28px;
	border-radius: 8px;
	border: none;
	background: $rose-light;
	color: $rose;
	cursor: pointer;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s;

	&:hover { background: $rose; color: white; }
}

// Payout List
.payout-list {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.payout-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px;
	background: $bg;
	border-radius: 14px;

	@media (max-width: 480px) {
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
	}
}

.payout-info {
	display: flex;
	align-items: center;
	gap: 12px;
}

.payout-icon {
	width: 40px;
	height: 40px;
	border-radius: 12px;
	background: $rose-light;
	color: $rose;
	display: flex;
	align-items: center;
	justify-content: center;
}

.payout-details {
	display: flex;
	flex-direction: column;
	gap: 2px;

	.payout-bank {
		font-size: 14px;
		font-weight: 600;
		color: $navy;
	}

	.payout-date {
		font-size: 12px;
		color: $gray;
	}

	.payout-account {
		font-size: 12px;
		color: $light-gray;
		font-family: monospace;
	}
}

.payout-right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4px;

	@media (max-width: 480px) {
		flex-direction: row;
		align-items: center;
		gap: 12px;
	}
}

.payout-amount {
	font-size: 16px;
	font-weight: 700;
	color: $rose;
}

.payout-status {
	padding: 3px 10px;
	border-radius: 8px;
	font-size: 11px;
	font-weight: 600;
	text-transform: uppercase;

	&.completed { background: $emerald-light; color: $emerald; }
	&.pending { background: $amber-light; color: $amber; }
	&.failed { background: $rose-light; color: $rose; }
}

// Transaction List
.filter-tabs {
	display: flex;
	gap: 8px;
	margin-bottom: 20px;
	overflow-x: auto;
	padding-bottom: 4px;
}

.filter-tab {
	padding: 8px 18px;
	border-radius: 10px;
	border: 1px solid #E2E8F0;
	background: white;
	color: $gray;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	white-space: nowrap;
	transition: all 0.2s;

	&:hover { border-color: $sky; color: $sky-dark; }

	&.active {
		background: $sky-light;
		border-color: $sky;
		color: $sky-dark;
		font-weight: 600;
	}
}

.transaction-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.txn-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 14px 16px;
	background: $bg;
	border-radius: 12px;
	transition: background 0.2s;

	&:hover { background: #F1F5F9; }
}

.txn-info {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
	flex: 1;
}

.txn-icon {
	width: 38px;
	height: 38px;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	flex-shrink: 0;
	background: #F1F5F9;

	&.credit { background: $emerald-light; color: $emerald; }
	&.debit { background: $rose-light; color: $rose; }
	&.hold { background: $amber-light; color: $amber; }
}

.txn-details {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;

	.txn-desc {
		font-size: 13px;
		font-weight: 500;
		color: $navy;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.txn-date {
		font-size: 12px;
		color: $light-gray;
	}
}

.txn-amount {
	font-size: 15px;
	font-weight: 600;
	flex-shrink: 0;
	margin-left: 12px;

	&.credit { color: $emerald; }
	&.debit { color: $rose; }
	&.hold { color: $amber; }
}

.load-more-btn {
	width: 100%;
	padding: 14px;
	margin-top: 12px;
	border: 1px dashed #E2E8F0;
	background: white;
	color: $sky-dark;
	font-size: 14px;
	font-weight: 600;
	border-radius: 12px;
	cursor: pointer;
	transition: all 0.2s;

	&:hover { background: $sky-light; border-color: $sky; }
	&:disabled { opacity: 0.6; cursor: not-allowed; }
}

// AI Credits Card
.credits-card {
	.credits-display {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.credits-main {
		display: flex;
		align-items: baseline;
		gap: 10px;

		.credits-number {
			font-size: 48px;
			font-weight: 800;
			color: $navy;
			font-family: 'Poppins', system-ui, sans-serif;
			line-height: 1;
		}

		.credits-label {
			font-size: 15px;
			color: $gray;
			font-weight: 500;
		}

		@media (max-width: 480px) {
			.credits-number { font-size: 36px; }
		}
	}

	.credits-progress {
		.progress-bar {
			width: 100%;
			height: 8px;
			background: #F1F5F9;
			border-radius: 100px;
			overflow: hidden;
		}

		.progress-fill {
			height: 100%;
			background: linear-gradient(90deg, $sky, $violet);
			border-radius: 100px;
			transition: width 0.6s ease;
		}
	}

	.credits-breakdown {
		display: flex;
		align-items: center;
		gap: 16px;

		@media (max-width: 480px) {
			gap: 10px;
		}

		.breakdown-item {
			display: flex;
			align-items: center;
			gap: 6px;

			.item-value {
				font-size: 18px;
				font-weight: 700;

				&.free { color: $emerald; }
				&.purchased { color: $sky-dark; }
				&.gifted { color: $violet; }
			}

			.item-label {
				font-size: 13px;
				color: $gray;
			}
		}

		.breakdown-divider {
			width: 1px;
			height: 20px;
			background: #E2E8F0;
		}
	}
}

.unlimited-badge {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 18px;
	background: linear-gradient(135deg, $violet-light, $sky-light);
	border-radius: 12px;
	font-size: 14px;
	font-weight: 600;
	color: $violet;
	margin-top: 4px;

	svg { color: $violet; }
}

// AI Credit Transactions
.credit-txn-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.credit-txn-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 14px 16px;
	background: $bg;
	border-radius: 12px;
	transition: background 0.2s;

	&:hover { background: #F1F5F9; }

	@media (max-width: 480px) {
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}
}

.credit-txn-info {
	display: flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
	flex: 1;
}

.credit-txn-icon {
	width: 38px;
	height: 38px;
	border-radius: 10px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	background: #F1F5F9;
	color: $gray;

	&.credit-add { background: $violet-light; color: $violet; }
	&.credit-use { background: $amber-light; color: $amber; }
}

.credit-txn-details {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;

	.credit-txn-desc {
		font-size: 13px;
		font-weight: 500;
		color: $navy;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.credit-txn-date {
		font-size: 12px;
		color: $light-gray;
	}
}

.credit-txn-right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 2px;
	flex-shrink: 0;
	margin-left: 12px;

	@media (max-width: 480px) {
		flex-direction: row;
		align-items: center;
		gap: 10px;
		margin-left: 0;
	}
}

.credit-txn-delta {
	font-size: 14px;
	font-weight: 600;

	&.positive { color: $violet; }
	&.negative { color: $amber; }
}

.credit-txn-amount {
	font-size: 12px;
	color: $gray;
}

// AI Credit Plans
.plans-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
	gap: 16px;

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
	}
}

.plan-card {
	position: relative;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	padding: 24px 20px;
	background: $bg;
	border-radius: 16px;
	border: 2px solid transparent;
	text-align: center;
	transition: all 0.2s;

	&:hover {
		border-color: $sky;
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(79, 195, 247, 0.12);
	}

	&.popular {
		border-color: $sky;
		background: $sky-light;
	}

	&.unlimited {
		background: linear-gradient(135deg, $violet-light 0%, $sky-light 100%);
	}

	.popular-badge {
		position: absolute;
		top: -1px;
		right: 16px;
		padding: 4px 12px;
		background: $sky;
		color: white;
		font-size: 10px;
		font-weight: 700;
		border-radius: 0 0 8px 8px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.plan-icon {
		width: 48px;
		height: 48px;
		border-radius: 14px;
		background: white;
		display: flex;
		align-items: center;
		justify-content: center;
		color: $sky-dark;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.plan-name {
		font-size: 16px;
		font-weight: 700;
		color: $navy;
	}

	.plan-description {
		font-size: 12px;
		color: $gray;
		line-height: 1.4;
	}

	.plan-credits {
		display: flex;
		align-items: baseline;
		gap: 4px;

		.credits-value {
			font-size: 28px;
			font-weight: 800;
			color: $navy;
			font-family: 'Poppins', system-ui, sans-serif;
		}

		.credits-unit {
			font-size: 13px;
			color: $gray;
		}
	}

	.plan-price {
		display: flex;
		align-items: baseline;
		gap: 2px;

		.price-currency {
			font-size: 14px;
			font-weight: 600;
			color: $slate;
		}

		.price-value {
			font-size: 22px;
			font-weight: 800;
			color: $slate;
		}
	}

	.plan-btn {
		width: 100%;
		padding: 10px 20px;
		border: none;
		border-radius: 10px;
		background: $sky;
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		margin-top: 4px;

		&:hover { background: $sky-dark; }
		&:disabled { opacity: 0.6; cursor: not-allowed; }
	}
}

// Purchase Modal
.purchase-body {
	display: flex;
	flex-direction: column;
	gap: 20px;
	width: 100%;
}

.purchase-summary {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 20px;
	background: $bg;
	border-radius: 14px;

	.summary-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 14px;
		color: $gray;

		span:last-child {
			font-weight: 600;
			color: $navy;
		}

		&.total {
			font-size: 18px;

			span:last-child {
				font-weight: 800;
				color: $sky-dark;
			}
		}
	}

	.summary-divider {
		height: 1px;
		background: #E2E8F0;
	}
}

.payment-source {
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px 20px;
	background: $sky-light;
	border-radius: 14px;
	border: 1px solid rgba($sky, 0.3);

	svg { color: $sky-dark; }

	.payment-info {
		display: flex;
		flex-direction: column;
		gap: 2px;

		.payment-title {
			font-size: 14px;
			font-weight: 600;
			color: $navy;
		}

		.payment-balance {
			font-size: 13px;
			color: $gray;
		}
	}
}

.insufficient-warning {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
	background: $rose-light;
	border-radius: 10px;
	font-size: 13px;
	font-weight: 500;
	color: $rose;

	svg { flex-shrink: 0; }
}

// Empty States
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	padding: 40px 20px;
	color: $light-gray;

	svg { opacity: 0.4; }

	p {
		font-size: 14px;
		font-weight: 500;
		color: $gray;
	}

	.empty-sub {
		font-size: 13px;
		color: $light-gray;
		text-align: center;
	}
}

.empty-cta {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 10px 20px;
	margin-top: 8px;
	background: $sky-light;
	color: $sky-dark;
	border: none;
	border-radius: 10px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.2s;

	&:hover { background: $sky; color: white; }
}

// Modal Styles
.modal-success {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16px;
	padding: 24px;
	text-align: center;

	.success-icon {
		color: $emerald;
	}

	h2 {
		font-size: 22px;
		font-weight: 700;
		color: $navy;
	}

	p {
		font-size: 15px;
		color: $gray;
	}
}

.topup-body, .withdraw-body {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 24px;
}

.topup-amount-section, .withdraw-amount-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;

	.topup-label, .withdraw-label {
		font-size: 14px;
		color: $gray;
	}

	.topup-amount-input, .withdraw-amount-input {
		:deep(div) {
			display: flex;
			justify-content: center;
			align-items: center;

			input {
				width: 70%;
				max-width: 100%;
				font-size: 48px;
				color: $navy;
				outline: 0;
				border: none;
				text-align: center;
			}
		}
	}

	.topup-min {
		font-size: 12px;
		color: $light-gray;
	}

	.withdraw-balance {
		font-size: 13px;
		color: $gray;
	}
}

.quick-amounts {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	justify-content: center;

	.quick-amount-btn {
		padding: 10px 16px;
		border: 1px solid #E2E8F0;
		border-radius: 10px;
		background: white;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 14px;
		color: $slate;

		&:hover { border-color: $sky; color: $sky-dark; }
		&.active { background: $sky; border-color: $sky; color: white; }
	}
}

// Withdraw Modal
.withdraw-bank-section {
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;

		p {
			font-size: 14px;
			font-weight: 600;
			color: $navy;
		}
	}

	.add-inline-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 12px;
		border: none;
		background: $sky-light;
		color: $sky-dark;
		border-radius: 8px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;

		&:hover { background: $sky; color: white; }
	}
}

.withdraw-bank-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.withdraw-bank-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 14px 16px;
	background: $bg;
	border-radius: 12px;
	cursor: pointer;
	transition: all 0.2s;
	border: 2px solid transparent;

	&:hover { background: #F1F5F9; }
	&.selected { border-color: $sky; background: $sky-light; }

	.bank-info {
		flex: 1;
		.bank-name { font-size: 14px; font-weight: 600; color: $navy; }
		.bank-number { font-size: 12px; color: $gray; font-family: monospace; }
	}
}

.no-banks {
	text-align: center;
	padding: 20px;
	color: $gray;
	font-size: 14px;
}

.withdraw-confirm {
	display: flex;
	justify-content: center;
	padding: 16px;

	.confirm-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 32px 48px;
		background: $bg;
		border-radius: 20px;
		text-align: center;

		.confirm-label {
			font-size: 14px;
			color: $gray;
		}

		.confirm-amount {
			font-size: 36px;
			font-weight: 800;
			color: $navy;
			font-family: 'Poppins', system-ui, sans-serif;
		}

		.confirm-to {
			font-size: 15px;
			font-weight: 600;
			color: $slate;
			margin-top: 8px;
		}

		.confirm-account {
			font-size: 14px;
			color: $gray;
			font-family: monospace;
		}

		.confirm-name {
			font-size: 13px;
			color: $light-gray;
		}
	}
}

// Add Bank Modal
.add-bank-body {
	display: flex;
	flex-direction: column;
	gap: 16px;
	width: 100%;

	.resolve-info {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		min-height: 20px;

		.resolve-label { color: $gray; font-size: 13px; }
		.resolve-name { color: $navy; font-weight: 600; font-size: 13px; text-transform: capitalize; }
		.resolve-loading { color: $light-gray; font-size: 13px; }
	}
}

// Caution modal content
.modal__content {
	.caution {
		.text {
			font-size: 14px;
			color: $gray;
			line-height: 1.6;
		}
	}
}

:deep(.modal__footer) {
	display: flex;
	justify-content: center;
	gap: 12px;
}
</style>
