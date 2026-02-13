/**
 * Centralized currency configuration and formatting utilities.
 * Replaces all scattered currency formatters across the codebase.
 */

export const SUPPORTED_CURRENCIES = {
	USD: { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar', flag: '\u{1F1FA}\u{1F1F8}' },
	GBP: { code: 'GBP', symbol: '\u00A3', locale: 'en-GB', name: 'British Pound', flag: '\u{1F1EC}\u{1F1E7}' },
	EUR: { code: 'EUR', symbol: '\u20AC', locale: 'de-DE', name: 'Euro', flag: '\u{1F1EA}\u{1F1FA}' },
	NGN: { code: 'NGN', symbol: '\u20A6', locale: 'en-NG', name: 'Nigerian Naira', flag: '\u{1F1F3}\u{1F1EC}' },
};

export const DEFAULT_CURRENCY = 'USD';

export const CURRENCY_CODES = Object.keys(SUPPORTED_CURRENCIES);

/**
 * Format an amount in the given currency using Intl.NumberFormat.
 * @param {number} amount
 * @param {string} currencyCode - One of USD, GBP, EUR, NGN
 * @returns {string} e.g. "$1,234.56", "£50.00", "€100.00", "₦5,000.00"
 */
export function formatCurrency(amount, currencyCode = DEFAULT_CURRENCY) {
	const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
	return new Intl.NumberFormat(config.locale, {
		style: 'currency',
		currency: config.code,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(amount || 0);
}

/**
 * Compact format for dashboards (e.g. "$1.5M", "£12K", "€500").
 * @param {number} amount
 * @param {string} currencyCode
 * @returns {string}
 */
export function formatCurrencyCompact(amount, currencyCode = DEFAULT_CURRENCY) {
	const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
	const num = Number(amount) || 0;
	if (num >= 1_000_000) return `${config.symbol}${(num / 1_000_000).toFixed(1)}M`;
	if (num >= 1_000) return `${config.symbol}${(num / 1_000).toFixed(1)}K`;
	return formatCurrency(num, currencyCode);
}

/**
 * Get just the symbol for a currency code.
 * @param {string} currencyCode
 * @returns {string}
 */
export function getCurrencySymbol(currencyCode = DEFAULT_CURRENCY) {
	const config = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY];
	return config.symbol;
}

/**
 * Exchange rates: 1 NGN → target currency.
 * Used for display-only conversion of NGN amounts (wallets, earnings, etc.).
 */
export const NGN_EXCHANGE_RATES = {
	USD: 1 / 1550,
	GBP: 1 / 1950,
	EUR: 1 / 1700,
	NGN: 1,
};

/**
 * Convert an NGN amount to the target currency.
 * @param {number} ngnAmount
 * @param {string} targetCurrency
 * @returns {number}
 */
export function convertFromNGN(ngnAmount, targetCurrency = DEFAULT_CURRENCY) {
	const rate = NGN_EXCHANGE_RATES[targetCurrency] ?? NGN_EXCHANGE_RATES.USD;
	return Math.round((ngnAmount || 0) * rate * 100) / 100;
}
