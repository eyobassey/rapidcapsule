<template>
	<div class="container">
		<!-- Balance Card -->
		<div class="container-wallet">
			<div class="container-wallet__balance">
				<div class="wallet-balance__main">
					<div class="wallet-balance__available">
						<p class="wallet-balance__label">Available Balance</p>
						<h1 class="wallet-balance__amount">₦ {{ formatNumber(walletData.available_balance || 0) }}</h1>
					</div>
					<div class="wallet-balance__actions">
						<button class="wallet-action-btn" @click="isOpenTopUp = true">
							<span class="action-icon">+</span>
							Top Up
						</button>
					</div>
				</div>
				<div class="wallet-balance__held" v-if="walletData.held_balance > 0">
					<p class="wallet-balance__held-label">
						<span class="held-icon">🔒</span>
						Held for pending transactions:
					</p>
					<p class="wallet-balance__held-amount">₦ {{ formatNumber(walletData.held_balance) }}</p>
				</div>
			</div>
			<div class="container-wallet__stats">
				<div class="stat-item">
					<p class="stat-label">This Month</p>
					<p class="stat-value credited">+₦ {{ formatNumber(walletStats?.this_month?.credited || 0) }}</p>
				</div>
				<div class="stat-item">
					<p class="stat-label">Spent</p>
					<p class="stat-value debited">-₦ {{ formatNumber(walletStats?.this_month?.debited || 0) }}</p>
				</div>
				<div class="stat-item">
					<p class="stat-label">Transactions</p>
					<p class="stat-value">{{ walletStats?.this_month?.transactions || 0 }}</p>
				</div>
			</div>
		</div>

		<!-- Transaction History -->
		<div class="container-transactions">
			<div class="container-transactions__header">
				<p class="container-transactions__heading">Transaction History</p>
				<div class="container-transactions__filters">
					<rc-select
						label=""
						placeholder="All Types"
						:options="transactionTypes"
						v-model="selectedType"
						class="filter-select"
					/>
				</div>
			</div>

			<loader v-if="isLoading" :useOverlay="false" style="position: relative; min-height: 200px" />

			<div v-else-if="transactions.length === 0" class="empty-state">
				<p>No transactions yet</p>
			</div>

			<div v-else class="transactions-list">
				<div
					v-for="transaction in transactions"
					:key="transaction._id"
					class="transaction-item"
				>
					<div class="transaction-info">
						<div class="transaction-icon" :class="getTransactionClass(transaction.type)">
							{{ getTransactionIcon(transaction.type) }}
						</div>
						<div class="transaction-details">
							<p class="transaction-description">{{ transaction.description }}</p>
							<p class="transaction-date">{{ formatDate(transaction.created_at) }}</p>
						</div>
					</div>
					<div class="transaction-amount" :class="getTransactionClass(transaction.type)">
						{{ getTransactionSign(transaction.type) }}₦ {{ formatNumber(transaction.amount) }}
					</div>
				</div>
			</div>

			<!-- Pagination -->
			<div v-if="pagination.pages > 1" class="pagination">
				<button
					class="pagination-btn"
					:disabled="pagination.currentPage === 1"
					@click="loadTransactions(pagination.currentPage - 1)"
				>
					Previous
				</button>
				<span class="pagination-info">
					Page {{ pagination.currentPage }} of {{ pagination.pages }}
				</span>
				<button
					class="pagination-btn"
					:disabled="pagination.currentPage === pagination.pages"
					@click="loadTransactions(pagination.currentPage + 1)"
				>
					Next
				</button>
			</div>
		</div>

		<!-- Top Up Modal -->
		<rc-modal
			v-if="isOpenTopUp"
			title="Top Up Wallet"
			@closeModal="onCloseTopUp"
			:has-footer="true"
		>
			<template v-slot:body>
				<loader
					v-if="isProcessingTopUp"
					:useOverlay="true"
					style="position: absolute; border-radius: 16px"
				/>
				<div v-if="topUpSuccess" class="success-container">
					<img :src="require('@/assets/icons/check-circle-solid.svg')" alt="Success Icon" />
					<h1 class="success-heading">Top Up Successful!</h1>
					<p class="success-description">
						₦ {{ formatNumber(topUpAmount) }} has been added to your wallet.
					</p>
					<p class="success-balance">
						New Balance: ₦ {{ formatNumber(walletData.available_balance) }}
					</p>
				</div>
				<div v-else class="topup-body">
					<div class="topup-amount-section">
						<p class="topup-label">Enter Amount</p>
						<CurrencyInput
							v-model="topUpAmount"
							class="topup-amount-input"
							placeholder="₦ 0"
							:options="{
								currency: 'NGN',
								currencyDisplay: 'narrowSymbol',
							}"
						/>
						<p class="topup-min">Minimum: ₦ 100</p>
					</div>
					<div class="quick-amounts">
						<button
							v-for="amount in quickAmounts"
							:key="amount"
							class="quick-amount-btn"
							@click="topUpAmount = amount"
							:class="{ active: topUpAmount === amount }"
						>
							₦ {{ formatNumber(amount) }}
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
					@click="onCloseTopUp"
				/>
			</template>
		</rc-modal>
	</div>
</template>

<script setup>
import { ref, inject, onMounted, watch } from "vue";
import { useToast } from 'vue-toast-notification';
import RcButton from "@/components/buttons/button-primary";
import RcSelect from "@/components/inputs/select-dropdown";
import RcModal from "@/components/modals/dialog-modal";
import Loader from "@/components/Loader/main-loader";
import CurrencyInput from "@/components/inputs/currency-input";

const $http = inject("$http");
const $toast = useToast();

// State
const isLoading = ref(true);
const walletData = ref({});
const walletStats = ref({});
const transactions = ref([]);
const pagination = ref({ currentPage: 1, pages: 1, total: 0 });
const selectedType = ref("");
const isOpenTopUp = ref(false);
const isProcessingTopUp = ref(false);
const topUpSuccess = ref(false);
const topUpAmount = ref(null);

// Constants
const transactionTypes = [
	"All Types",
	"CREDIT",
	"DEBIT",
	"HOLD",
	"RELEASE",
	"REFUND",
];

const quickAmounts = [1000, 5000, 10000, 20000, 50000];

// Methods
const formatNumber = (num) => {
	return new Intl.NumberFormat('en-NG').format(num || 0);
};

const formatDate = (dateStr) => {
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-NG', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

const getTransactionIcon = (type) => {
	const icons = {
		CREDIT: '↓',
		DEBIT: '↑',
		HOLD: '🔒',
		RELEASE: '🔓',
		REFUND: '↩',
	};
	return icons[type] || '•';
};

const getTransactionClass = (type) => {
	if (['CREDIT', 'RELEASE', 'REFUND'].includes(type)) return 'credit';
	if (['DEBIT'].includes(type)) return 'debit';
	if (['HOLD'].includes(type)) return 'hold';
	return '';
};

const getTransactionSign = (type) => {
	if (['CREDIT', 'RELEASE', 'REFUND'].includes(type)) return '+';
	if (['DEBIT', 'HOLD'].includes(type)) return '-';
	return '';
};

const loadWallet = async () => {
	try {
		const { data } = await $http.$_getSpecialistWallet();
		walletData.value = data.data;
	} catch (error) {
		console.error('Error loading wallet:', error);
		$toast.error('Failed to load wallet');
	}
};

const loadWalletStats = async () => {
	try {
		const { data } = await $http.$_getSpecialistWalletStats();
		walletStats.value = data.data;
	} catch (error) {
		console.error('Error loading wallet stats:', error);
	}
};

const loadTransactions = async (page = 1) => {
	isLoading.value = true;
	try {
		const params = {
			page,
			limit: 10,
		};
		if (selectedType.value && selectedType.value !== "All Types") {
			params.type = selectedType.value;
		}

		const { data } = await $http.$_getSpecialistWalletTransactions(params);
		transactions.value = data.data.docs || [];
		pagination.value = {
			currentPage: data.data.currentPage,
			pages: data.data.pages,
			total: data.data.total,
		};
	} catch (error) {
		console.error('Error loading transactions:', error);
		$toast.error('Failed to load transactions');
	} finally {
		isLoading.value = false;
	}
};

const initiateTopUp = async () => {
	if (!topUpAmount.value || topUpAmount.value < 100) {
		$toast.error('Minimum top-up amount is ₦100');
		return;
	}

	isProcessingTopUp.value = true;
	try {
		const { data } = await $http.$_initializeWalletTopUp({
			amount: topUpAmount.value,
			callback_url: window.location.href,
		});

		if (data.data.authorization_url) {
			// Store reference for verification after redirect
			localStorage.setItem('wallet_topup_reference', data.data.reference);
			// Redirect to Paystack
			window.location.href = data.data.authorization_url;
		} else {
			$toast.error('Failed to initialize payment');
			isProcessingTopUp.value = false;
		}
	} catch (error) {
		console.error('Error initiating top-up:', error);
		$toast.error(error.response?.data?.message || 'Failed to initiate top-up');
		isProcessingTopUp.value = false;
	}
};

const verifyPayment = async (reference) => {
	try {
		const { data } = await $http.$_verifyWalletTopUp({ reference });
		if (data.data.success) {
			topUpSuccess.value = true;
			await loadWallet();
			await loadWalletStats();
			await loadTransactions(1);
			$toast.success('Wallet topped up successfully!');
		}
	} catch (error) {
		console.error('Error verifying payment:', error);
		$toast.error('Payment verification failed');
	} finally {
		localStorage.removeItem('wallet_topup_reference');
	}
};

const onCloseTopUp = () => {
	isOpenTopUp.value = false;
	isProcessingTopUp.value = false;
	topUpSuccess.value = false;
	topUpAmount.value = null;
};

// Watch for filter changes
watch(selectedType, () => {
	loadTransactions(1);
});

// Check for payment callback on mount
onMounted(async () => {
	// Check URL for Paystack callback
	const urlParams = new URLSearchParams(window.location.search);
	const reference = urlParams.get('reference') || localStorage.getItem('wallet_topup_reference');

	if (reference && urlParams.get('trxref')) {
		isOpenTopUp.value = true;
		isProcessingTopUp.value = true;
		await verifyPayment(reference);
		isProcessingTopUp.value = false;
		// Clean URL
		window.history.replaceState({}, document.title, window.location.pathname);
	}

	await Promise.all([
		loadWallet(),
		loadWalletStats(),
		loadTransactions(1),
	]);
});
</script>

<style scoped lang="scss">
.container {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: $size-32;
}

.container-wallet {
	width: 100%;
	border-radius: $size-16;
	overflow: hidden;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

	.container-wallet__balance {
		padding: $size-24;
		background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
		color: white;

		.wallet-balance__main {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: $size-16;

			@include responsive(phone) {
				flex-direction: column;
				gap: $size-16;
			}

			.wallet-balance__available {
				.wallet-balance__label {
					font-size: $size-14;
					opacity: 0.9;
					margin-bottom: $size-4;
				}

				.wallet-balance__amount {
					font-size: $size-48;
					font-weight: $fw-bold;

					@include responsive(phone) {
						font-size: $size-36;
					}
				}
			}

			.wallet-balance__actions {
				.wallet-action-btn {
					display: flex;
					align-items: center;
					gap: $size-8;
					padding: $size-12 $size-24;
					background: rgba(255, 255, 255, 0.2);
					border: 1px solid rgba(255, 255, 255, 0.3);
					border-radius: $size-8;
					color: white;
					font-size: $size-16;
					font-weight: $fw-medium;
					cursor: pointer;
					transition: all 0.2s;

					&:hover {
						background: rgba(255, 255, 255, 0.3);
					}

					.action-icon {
						font-size: $size-20;
						font-weight: $fw-bold;
					}
				}
			}
		}

		.wallet-balance__held {
			display: flex;
			align-items: center;
			gap: $size-8;
			padding: $size-12;
			background: rgba(255, 255, 255, 0.15);
			border-radius: $size-8;
			font-size: $size-14;

			.held-icon {
				font-size: $size-16;
			}

			.wallet-balance__held-amount {
				font-weight: $fw-semi-bold;
			}
		}
	}

	.container-wallet__stats {
		display: flex;
		background: white;
		padding: $size-16;

		@include responsive(phone) {
			flex-direction: column;
		}

		.stat-item {
			flex: 1;
			text-align: center;
			padding: $size-8;
			border-right: 1px solid $color-g-85;

			&:last-child {
				border-right: none;
			}

			@include responsive(phone) {
				border-right: none;
				border-bottom: 1px solid $color-g-85;
				display: flex;
				justify-content: space-between;

				&:last-child {
					border-bottom: none;
				}
			}

			.stat-label {
				font-size: $size-12;
				color: $color-g-44;
				margin-bottom: $size-4;
			}

			.stat-value {
				font-size: $size-18;
				font-weight: $fw-semi-bold;
				color: $color-black;

				&.credited {
					color: #2e7d32;
				}

				&.debited {
					color: #c62828;
				}
			}
		}
	}
}

.container-transactions {
	background: white;
	border-radius: $size-12;
	padding: $size-24;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

	.container-transactions__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $size-24;
		padding-bottom: $size-16;
		border-bottom: 1px solid $color-g-85;

		@include responsive(phone) {
			flex-direction: column;
			align-items: flex-start;
			gap: $size-12;
		}

		.container-transactions__heading {
			font-size: $size-18;
			font-weight: $fw-semi-bold;
			color: $color-black;
		}

		.filter-select {
			width: 150px;

			@include responsive(phone) {
				width: 100%;
			}
		}
	}

	.empty-state {
		text-align: center;
		padding: $size-48;
		color: $color-g-44;
	}

	.transactions-list {
		display: flex;
		flex-direction: column;
		gap: $size-12;

		.transaction-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: $size-16;
			background: $color-g-95;
			border-radius: $size-8;
			transition: background 0.2s;

			&:hover {
				background: $color-g-90;
			}

			.transaction-info {
				display: flex;
				align-items: center;
				gap: $size-12;

				.transaction-icon {
					width: 40px;
					height: 40px;
					display: flex;
					align-items: center;
					justify-content: center;
					border-radius: 50%;
					font-size: $size-18;
					background: $color-g-85;

					&.credit {
						background: #e8f5e9;
						color: #2e7d32;
					}

					&.debit {
						background: #ffebee;
						color: #c62828;
					}

					&.hold {
						background: #fff3e0;
						color: #ef6c00;
					}
				}

				.transaction-details {
					.transaction-description {
						font-size: $size-14;
						font-weight: $fw-medium;
						color: $color-black;
						margin-bottom: $size-2;
					}

					.transaction-date {
						font-size: $size-12;
						color: $color-g-44;
					}
				}
			}

			.transaction-amount {
				font-size: $size-16;
				font-weight: $fw-semi-bold;

				&.credit {
					color: #2e7d32;
				}

				&.debit {
					color: #c62828;
				}

				&.hold {
					color: #ef6c00;
				}
			}
		}
	}

	.pagination {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: $size-16;
		margin-top: $size-24;
		padding-top: $size-16;
		border-top: 1px solid $color-g-85;

		.pagination-btn {
			padding: $size-8 $size-16;
			border: 1px solid $color-g-85;
			border-radius: $size-6;
			background: white;
			cursor: pointer;
			transition: all 0.2s;

			&:hover:not(:disabled) {
				background: $color-g-95;
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}

		.pagination-info {
			font-size: $size-14;
			color: $color-g-44;
		}
	}
}

// Top Up Modal Styles
.topup-body {
	width: 100%;
	max-width: 400px;
	display: flex;
	flex-direction: column;
	gap: $size-24;

	.topup-amount-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $size-8;

		.topup-label {
			font-size: $size-14;
			color: $color-g-44;
		}

		.topup-amount-input {
			:deep(input) {
				font-size: $size-48;
				text-align: center;
				border: none;
				outline: none;
				width: 100%;
			}
		}

		.topup-min {
			font-size: $size-12;
			color: $color-g-67;
		}
	}

	.quick-amounts {
		display: flex;
		flex-wrap: wrap;
		gap: $size-8;
		justify-content: center;

		.quick-amount-btn {
			padding: $size-10 $size-16;
			border: 1px solid $color-g-85;
			border-radius: $size-8;
			background: white;
			cursor: pointer;
			transition: all 0.2s;
			font-size: $size-14;

			&:hover {
				border-color: $color-pri-main;
				color: $color-pri-main;
			}

			&.active {
				background: $color-pri-main;
				border-color: $color-pri-main;
				color: white;
			}
		}
	}
}

.success-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $size-16;
	padding: $size-24;
	text-align: center;

	img {
		width: 80px;
		height: 80px;
	}

	.success-heading {
		font-size: $size-24;
		font-weight: $fw-bold;
		color: #2e7d32;
	}

	.success-description {
		font-size: $size-16;
		color: $color-g-44;
	}

	.success-balance {
		font-size: $size-18;
		font-weight: $fw-semi-bold;
		color: $color-black;
		margin-top: $size-8;
	}
}

:deep(.modal__footer) {
	display: flex;
	justify-content: center;
}
</style>
