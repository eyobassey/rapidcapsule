import { computed } from 'vue';
import { useStore } from 'vuex';
import {
	formatCurrency,
	formatCurrencyCompact,
	getCurrencySymbol,
	convertFromNGN,
	SUPPORTED_CURRENCIES,
} from '@/utilities/currency';

/**
 * Composable for currency-aware formatting in Vue components.
 * Uses the global Vuex currency state.
 */
export function useCurrency() {
	const store = useStore();

	const currencyCode = computed(() => store.getters['currency/currencyCode']);
	const currencyConfig = computed(() => SUPPORTED_CURRENCIES[currencyCode.value] || SUPPORTED_CURRENCIES.USD);
	const symbol = computed(() => getCurrencySymbol(currencyCode.value));

	/** Format amount in the user's selected currency. e.g. "$1,234.56" */
	const format = (amount) => formatCurrency(amount, currencyCode.value);

	/** Compact format for dashboards. e.g. "$1.5M", "£12K" */
	const formatCompact = (amount) => formatCurrencyCompact(amount, currencyCode.value);

	/**
	 * Resolve the correct price from an item's multi-currency prices map.
	 * Checks item.prices[currencyCode][field], falls back to item[field] or item.price.
	 * @param {Object} item - Drug, cart item, or any object with a prices map
	 * @param {string} field - Price field name (default: 'selling_price')
	 * @returns {number} The resolved price amount
	 */
	const getPrice = (item, field = 'selling_price') => {
		const code = currencyCode.value;
		return item?.prices?.[code]?.[field] ?? item?.[field] ?? item?.price ?? 0;
	};

	/** Convert an NGN amount to selected currency, then format. For wallets, earnings, etc. */
	const formatConverted = (ngnAmount) => formatCurrency(convertFromNGN(ngnAmount, currencyCode.value), currencyCode.value);

	/** Convert an NGN amount to selected currency, then compact-format. For dashboard widgets. */
	const formatConvertedCompact = (ngnAmount) => formatCurrencyCompact(convertFromNGN(ngnAmount, currencyCode.value), currencyCode.value);

	return {
		currencyCode,
		currencyConfig,
		symbol,
		format,
		formatCompact,
		getPrice,
		formatConverted,
		formatConvertedCompact,
	};
}
