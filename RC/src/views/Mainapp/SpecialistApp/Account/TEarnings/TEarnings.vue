<template>
	<div class="container">
		<div class="container-earnings">
			<div class="container-earnings__balance">
				<div class="earnings-balance__balance--earnings">
					<h1 class="earnings-balance__earnings">₦ {{ specialistEarnings.currentBalance }}</h1>
					<p class="earnings-balance__footer" @click="isOpenWithdrawFunds = true">
						Withdraw Funds
					</p>
				</div>
				<p class="earnings-balance__balance--current">Current Balance</p>
			</div>
			<div class="container-earnings__earnings">
				<p class="container-earnings__earnings--text">Total Earnings:</p>
				<p class="container-earnings__earnings--text">₦ {{ specialistEarnings.totalEarnings }}</p>
			</div>
		</div>
		<loader v-if="isLoading" :useOverlay="false" style="position: absolute" />
		<template v-else>
			<div class="container-account">
				<div class="container-account__header">
					<p class="container-account__header--heading">Bank Account Details</p>
					<rc-button
						type="text-secondary"
						class="add-action-btn-desktop"
						label="Add Bank Account"
						size="medium"
						:iconLeft="true"
						iconName="plus"
						@click="isOpenBankAccount = true"
						v-if="bankAccounts.length"
					/>
					<rc-button-icon
						type="secondary"
						class="add-action-btn-mobile"
						label="Add Bank Account"
						size="medium"
						:iconLeft="true"
						iconName="plus"
						@click="isOpenBankAccount = true"
						v-if="bankAccounts.length"
					/>
				</div>
				<div class="container-account__body">
					<rc-radio
						slotted
						:options="bankAccounts"
						slotted-class="container-account__account"
						v-model="defaultBankAccount"
						v-if="bankAccounts.length"
					>
						<template v-slot="{ item }">
							<div style="width:100%" @click="onChangeDefaultAccount(defaultBankAccount)">
								<div class="container-account__content">
									<p class="container-account__content--name">
										{{ item.bank_name }}
									</p>
									<p class="container-account__content--account">
										{{ item.account_number }}
									</p>
									<p v-if="item.is_default" class="container-account__action--detault is-mobile">
										Default Bank Account
									</p>
								</div>
							</div>
							<div class="container-account__action">
								<p  v-if="item.is_default"
									class="container-account__action--detault is-desktop"
								>
									Default Bank Account
								</p>
								<rc-button-icon
									class="container-account__action--btn"
									type="secondary"
									iconName="times"
									color="#C11818"
									@click="onDeleteAccount(item)"
								/>
							</div>
						</template>
					</rc-radio>
					<rc-button
						v-else
						type="text-secondary"
						label="Add Bank Account"
						size="large"
						:iconLeft="true"
						iconName="plus"
						@click="isOpenBankAccount = true"
					/>
				</div>
			</div>
			<div class="container-account">
				<div class="container-account__header">
					<p class="container-account__header--heading">Withdrawal History</p>
					<rc-button
						type="text-secondary"
						class="add-action-btn-desktop"
						label="Download History"
						size="medium"
						:iconLeft="true"
						iconName="download"
					/>
					<rc-button-icon
						type="text-secondary"
						class="add-action-btn-mobile"
						label="Download History"
						size="medium"
						:iconLeft="true"
						iconName="download"
					/>
				</div>
				<div class="container-account__body"></div>
			</div>
		</template>
	</div>
	<rc-modal
		v-if="isOpenBankAccount"
		title="Add Bank Account"
		@closeModal="onClose"
		:has-footer="true"
	>
		<template v-slot:body>
			<div class="bank-account__body withdraw-modal">
				<rc-select
					label="Select Bank"
					:options="banksListOptions?.map((i) => i.name)"
					v-model="bank"
				/>
				<rc-text label="Account Number" v-model="accountNumber" />
				<div class="bank-account__info">
					<template v-if="Object.keys(resolvedAccount).length">
						<p class="bank-account__info--default">Account Name:</p>
						<p class="bank-account__info--success">
							{{ resolvedAccount.account_name }}
						</p>
					</template>
					<p v-else class="bank-account__info--error">Please enter a valid account</p>
				</div>
			</div>
		</template>
		<template v-slot:foot>
			<rc-button
				type="primary"
				label="Add Bank Account"
				size="large"
				@click="onSubmitBank()"
				:loading="isFetching"
				:disabled="isDisabled || isFetching"
			/>
		</template>
	</rc-modal>
	<rc-modal
		v-if="isOpenWithdrawFunds"
		title="Withdraw Funds"
		@closeModal="onClose"
		:has-footer="true"
	>
		<template v-slot:body>
			<loader
				v-if="isFetchingWithdraw"
				:useOverlay="true"
				style="position: absolute; border-radius: 16px"
			/>
			<div v-if="isSuccessWithdrawFunds" class="success-container">
				<img :src="require('@/assets/icons/check-circle-solid.svg')" alt="Success Icon" />
				<h1 class="success-heading">Transaction Successful</h1>
				<p class="success-description">
					Funds have been sent to your selected bank account. You will receive it shortly.
				</p>
			</div>
			<div v-else class="bank-account__body">
				<div class="bank-account__headings">
					<p class="bank-account__headings--text">Enter Amount</p>
					<CurrencyInput
						v-model="withdrawalAmount"
						class="bank-account__headings--amount"
						placeholder="₦ 0"
						:options="{
							currency: 'NGN',
							currencyDisplay: 'narrowSymbol',
						}"
					/>
					<p class="bank-account__headings--text">
						₦ {{ specialistEarnings.currentBalance }}
					</p>
				</div>
				<div class="container-account">
					<div class="container-account__header">
						<p class="container-account__header--heading">Bank Account</p>
						<rc-button
							type="text-secondary"
							label="Add Bank Account"
							size="medium"
							:iconLeft="true"
							iconName="plus"
							@click="isOpenAddBankAccount = true"
							v-if="bankAccounts.length"
						/>
					</div>
					<div class="container-account__body">
						<rc-radio
							slotted
							:options="bankAccounts"
							slotted-class="container-account__account"
							v-model="defaultBankAccount"
							v-if="bankAccounts.length && !isOpenAddBankAccount"
						>
							<template v-slot="{ item }">
								<div style="width:100%" @click="onChangeDefaultAccount(defaultBankAccount)">
									<div class="container-account__content">
										<p class="container-account__content--name">
											{{ item.bank_name }}
										</p>
										<p class="container-account__content--account">
											{{ item.account_number }}
										</p>
									</div>
								</div>
								<div class="container-account__action">
									<template v-if="item.is_default">
										<p class="container-account__action--detault">Default</p>
									</template>
									<rc-button-icon
										class="container-account__action--btn"
										type="secondary"
										iconName="times"
										color="#C11818"
										@click="onDeleteAccount(item)"
									/>
								</div>
							</template>
						</rc-radio>
						<div v-else class="bank-account__body withdraw-modal">
							<rc-button
								type="text-secondary"
								label="Add Bank Account"
								size="medium"
								:iconLeft="true"
								iconName="plus"
								v-if="!isOpenAddBankAccount"
								@click="isOpenAddBankAccount = true"
							/>
							<template v-if="isOpenAddBankAccount">
								<rc-select
									label="Select Bank"
									:options="banksListOptions?.map((i) => i.name)"
									v-model="bank"
								/>
								<rc-text label="Account Number" v-model="accountNumber" />
								<div class="bank-account__info">
									<template v-if="Object.keys(resolvedAccount).length">
										<p class="bank-account__info--default">Account Name:</p>
										<p class="bank-account__info--success">
											{{ resolvedAccount.account_name }}
										</p>
									</template>
									<p v-else class="bank-account__info--error">
										Please enter a valid account
									</p>
								</div>
								<rc-button
									type="text-secondary"
									label="Save"
									size="large"
									:iconLeft="true"
									@click="onSubmitBank()"
									:loading="isFetching"
									:disabled="isDisabled || isFetching"
								/>
							</template>
						</div>
					</div>
				</div>
			</div>
		</template>
		<template v-slot:foot>
			<rc-button
				type="primary"
				label="Withdraw Funds"
				size="large"
				@click="onSubmitWithdrawFunds"
				v-if="!isSuccessWithdrawFunds"
				:disabled="(
					!bankAccounts.length ||
					specialistEarnings.currentBalance ||
					!withdrawalAmount
				)"
			/>
		</template>
	</rc-modal>
	<modal-caution
		v-show="isOpenDelete"
		title="Delete Account?"
		@closeModal="onClose"
		:has-footer="true"
	>
		<template v-slot:body>
			<div class="modal__content">
				<div class="caution">
					<p class="text">
						This action is irreversible. 
						Are you sure you want to remove this Account?
					</p>
				</div>
			</div>
		</template>
		<template v-slot:foot>
			<rc-button
				type="tertiary"
				label="Cancel"
				size="small"
				class="delete-button"
				:disabled="isFetching"
				@click="onClose"
			/>
			<rc-button
				type="primary"
				label="Delete"
				size="small"
				class="delete-button"
				:loading="isFetching"
				:disabled="isFetching"
				@click="onDeleteAccount"
			/>
		</template>
	</modal-caution>
</template>

<script setup>
import { ref, inject, onMounted, watchEffect } from "vue";
import { useToast } from 'vue-toast-notification';
import RcButton from "@/components/buttons/button-primary";
import RcButtonIcon from "@/components/buttons/button-icon";
import RcRadio from "@/components/RCRadio";
import RcModal from "@/components/modals/dialog-modal";
import RcSelect from "@/components/inputs/select-dropdown";
import RcText from "@/components/inputs/text";
import RcIcon from "@/components/RCIcon";
import ModalCaution from "@/components/modals/modal-caution";
import Loader from "@/components/Loader/main-loader";
import CurrencyInput from "@/components/inputs/currency-input";

const $http = inject("$http");
const $toast = useToast();
const emit = defineEmits(['success']);

const isOpenBankAccount = ref(false);
const isOpenAddBankAccount = ref(false);
const isOpenWithdrawFunds = ref(false);
const isSuccessWithdrawFunds = ref(false);
const isFetchingWithdraw = ref(false);
const isDisabled = ref(true);
const isFetching = ref(false);
const isLoading = ref(true);
const isOpenDelete = ref(false);
const banksListOptions = ref([]);
const bankAccounts = ref([]);
const activeBankItem = ref({});
const resolvedAccount = ref({});
const accountNumber = ref();
const bank = ref("");
const defaultBankAccount = ref({});
const selectedAccount = ref({});
const withdrawalAmount = ref();
const specialistEarnings = ref({});

onMounted(async () => {
	$http.$_getSpecialistEarnings().then(({ data }) => {
		specialistEarnings.value = data.data
	});

	await $http.$_getBankLists().then(({ data }) => {
		banksListOptions.value = data.data;
	});
	await getUserBankAccounts();
});

watchEffect(() => {
	activeBankItem.value = banksListOptions.value.find((item) => (
		item.name === bank.value
	));
});
watchEffect(() => {
	const isResolved =
		accountNumber.value && bank.value && Object.keys(resolvedAccount.value).length;

	if (isResolved) isDisabled.value = false;
	else isDisabled.value = true;
});

watchEffect(async () => {
	if (bank.value && accountNumber.value?.length === 10) {
		isFetching.value = true;
		const payload = {
			account_number: accountNumber.value,
			bank_code: activeBankItem.value.code,
		};

		await $http.$_resolveBankAccount(payload).then(({ data }) => {
			resolvedAccount.value = data.data;
			isFetching.value = false;
		}).catch(() => {
			$toast.error('Account number is not valid!');
			isFetching.value = false;
			isDisabled.value = true;
		});
	}
});

const getUserBankAccounts = async () => {
	isLoading.value = true;
	await $http.$_userBankAccounts().then(({ data }) => {
		defaultBankAccount.value = data.data?.find((v) => v.is_default);
		bankAccounts.value = data.data.map((item) => ({
			name: item.account_number,
			value: item,
		}));
		isLoading.value = false;
	});
};

const onClose = () => {
	isOpenBankAccount.value = false;
	isOpenWithdrawFunds.value = false;
	isDisabled.value = true;
	isFetching.value = false;
	isOpenDelete.value = false;
	resolvedAccount.value = {};
	accountNumber.value = null;
	activeBankItem.value = {};
	bank.value = null;
	isFetchingWithdraw.value = false;
	isSuccessWithdrawFunds.value = false;
};

const onSubmitBank = async () => {
	isFetching.value = true;

	const payload = {
		account_number: resolvedAccount.value.account_number,
		account_name: resolvedAccount.value.account_name,
		bank_name: activeBankItem.value.name,
		bank_code: activeBankItem.value.code,
		recipient_type: activeBankItem.value.type,
	};

	await $http.$_addBankAccount(payload).then(({ data }) => {
		$toast.success('Bank account added successfully!');
		emit("success", data);
		getUserBankAccounts();
		onClose();
	});
};

const onDeleteAccount = async (selectedItem) => {
	if (!isOpenDelete.value) {
		selectedAccount.value = selectedItem;
		isOpenDelete.value = true;
		return;
	}

	isFetching.value = true;
	const payload = { bankId: selectedAccount.value?._id };

	await $http.$_deleteBankAccount(payload).then(({ data }) => {
		$toast.success('Bank account deleted successfully!');
		getUserBankAccounts();
		onClose();
	}).catch((error) => {
		$toast.error(error.message);
		isFetching.value = false;
	})
};

const onChangeDefaultAccount = async () => {
	isFetching.value = true;
	const payload = { bankId: defaultBankAccount.value?._id };

	await $http.$_makeBankAccountDefault(payload).then(({ data }) => {
		getUserBankAccounts();
		defaultBankAccount.value = data.data;
		$toast.success('Default bank account set successfully!');
		onClose();
	}).catch((error) => {
		$toast.error(error.message);
		isFetching.value = false;
	})
};

const onSubmitWithdrawFunds = async () => {
	isFetchingWithdraw.value = true;
	const payload = {
		bankId: defaultBankAccount.value._id,
		amount: withdrawalAmount.value
	};

	await $http.$_walletsWithdrawal(payload).then(({ data }) => {
		$toast.success('Withdrawal has been initiated successfully!');
		isFetchingWithdraw.value = false;
		isSuccessWithdrawFunds.value = true;
	}).catch((error) => {
		$toast.error(error.message);
		isFetchingWithdraw.value = false;
	});
};
</script>

<style scoped lang="scss">
.container {
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	gap: $size-64;
}

.container-earnings {
	width: 100%;
	height: 174px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	border-radius: $size-12;
	padding: $size-24;
	background: rgb(241, 100, 57);
	background: linear-gradient(
		20deg,
		rgba(241, 100, 57, 1) 0%,
		rgba(241, 100, 57, 1) 50%,
		rgba(251, 60, 0, 1) 50%,
		rgba(251, 60, 0, 1) 100%
	);

	& .container-earnings__balance {
		display: flex;
		flex-direction: column;
		gap: $size-4;

		& .earnings-balance__balance--earnings {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;

			@include responsive(phone) {
				flex-direction: column-reverse;
			}

			& .earnings-balance__earnings {
				color: $color-white;
				font-weight: $fw-semi-bold;
				font-size: $size-64;
			}

			& .earnings-balance__footer {
				border-radius: $size-8;
				padding: $size-6 $size-16;
				background: $color-pri-t4;
				color: $color-pri-main;
				cursor: pointer;

				@include responsive(phone) {
					display: flex;
					align-self: flex-end;
				}
			}
		}
		& .earnings-balance__balance--current {
			font-size: $size-14;
			font-weight: $fw-regular;
			line-height: $size-18;
			color: $color-pri-s4;
		}
	}
	& .container-earnings__earnings {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: $size-4;

		& .container-earnings__earnings--text {
			color: $color-pri-t3;
			font-weight: $fw-regular;
			line-height: $size-24;
			font-size: $size-16;
		}
	}
}

.container-account {
	display: flex;
	flex-direction: column;
	gap: $size-16;

	& .container-account__header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: $size-1 solid $color-g-85;

		& .add-action-btn-mobile {
			display: none !important;
		}

		@include responsive(phone) {
			& .add-action-btn-desktop {
				display: none !important;
			}
			& .add-action-btn-mobile {
				display: block !important;

				:deep(svg) {
					fill: $color-sec-s1 !important;
				}
			}
		}

		& .container-account__header--heading {
			color: $color-g-67;
			font-size: $size-16;
			font-weight: $fw-regular;
			line-height: $size-24;
		}
	}
}
.container-account__body {
	display: flex;
	justify-content: center;

	&:deep(.container-account__account) {
		@include flexItem(vertical) {
			gap: $size-8;
			align-items: center;
			width: 100%;

			label {
				background: $color-pri-t6;
				padding: $size-12 $size-8 $size-12 $size-12;
				border-radius: $size-10;

				&:hover {
					outline: $size-1 solid $color-pri-t3;
					outline-offset: -$size-1;
				}
				@include responsive(phone) {
					padding: $size-12 $size-8 $size-12 $size-12;
					align-items: flex-start;
				}
			}
		}

		& .container-account__content {
			flex-grow: 1;
			cursor: pointer;

			@include flexItem(horizontal) {
				gap: $size-32;
			}
			@include responsive(phone) {
				@include flexItem(vertical) {
					gap: $size-8;
				}
			}

			& .container-account__content--radio {
				margin-top: -$size-15;
			}

			& .container-account__content--name {
				font-family: inherit;
				font-size: $size-16;
				color: $color-black;
				overflow: hidden;
				display: -webkit-box;
				-webkit-box-orient: vertical;
				-webkit-line-clamp: 1;

				&:hover {
					text-decoration: underline;
				}
			}
			& .container-account__content--account {
				font-family: inherit;
				font-size: $size-16;
				color: $color-g-44;
				
				&:hover {
					text-decoration: underline;
				}
			}
		}
		& .container-account__action {
			display: flex;
			justify-content: flex-start;
			align-items: center;
			gap: $size-32;

			& .container-account__action--detault {
				font-family: inherit;
				font-size: $size-16;
				color: $color-g-44;
				white-space: nowrap;
			}
		}
	}
}
.bank-account__body {
	display: flex;
	flex-direction: column;
	gap: $size-16;
	width: 37rem;

	@include responsive(phone){
		width: 100% !important;
	}

	& .bank-account__info {
		display: flex;
		justify-content: flex-end;
		gap: $size-8;

		& .bank-account__info--error {
			color: $color-pri-main;
		}
		& .bank-account__info--success {
			color: $color-black;
			text-transform: capitalize;
		}
		& .bank-account__info--default {
			color: $color-g-44;
		}
	}
	& .bank-account__headings {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: $size-16;

		& .bank-account__headings--text {
			color: $color-g-44;
			font-size: $size-16;
		}
		& .bank-account__headings--amount {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100%;

			& :deep(div) {
				display: flex;
				justify-content: center;
				align-items: center;

				& input {
					width: 70%;
					max-width: 100%;
					font-size: $size-64;
					color: $color-black;
					outline: 0;
					border: none;
				}
			}
		}
	}
}

.withdraw-modal {
	width: 100%;
}

:deep(.modal__footer) {
	display: flex;
	justify-content: center;
}
</style>

<style scoped lang="scss">
.success-container {
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: $size-32;
	width: 37rem;
	height: 100%;

	& .success-icon {
		width: 138px;
		height: 138px;
	}
	& .success-heading {
		font-weight: $fw-bold;
		font-size: $size-40;
		line-height: $size-48;
		color: $color-black;
	}
	& .success-description {
		font-size: $size-20;
		color: $color-g-44;
		width: 80%;
		text-align: center;
		line-height: 30px;
	}
}
.delete-button {
	@include responsive(phone) {
		width: 100% !important;
	}
}

.is-mobile {
	display: none !important;
	
	@include responsive(phone) {
		display: flex !important;
	}
}
.is-desktop {
	display: flex !important;
	
	@include responsive(phone) {
		display: none !important;
	}
}
</style>
