import axios from '../../services/http';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '../../utilities/currency';

const STORAGE_KEY = 'rc_currency';

export default {
	namespaced: true,

	state: () => ({
		currencyCode: DEFAULT_CURRENCY,
	}),

	getters: {
		currencyCode: (state) => state.currencyCode,
		currencyConfig: (state) => SUPPORTED_CURRENCIES[state.currencyCode] || SUPPORTED_CURRENCIES[DEFAULT_CURRENCY],
	},

	mutations: {
		SET_CURRENCY(state, code) {
			if (SUPPORTED_CURRENCIES[code]) {
				state.currencyCode = code;
			}
		},
	},

	actions: {
		/**
		 * Initialize currency on app boot.
		 * Priority: 1) localStorage  2) user profile  3) IP geolocation  4) USD fallback
		 */
		async initCurrency({ commit, rootState }) {
			// 1. Check localStorage
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored && SUPPORTED_CURRENCIES[stored]) {
				commit('SET_CURRENCY', stored);
				return;
			}

			// 2. Check user profile (if authenticated)
			const user = rootState.userProfile;
			if (user?.preferred_currency && SUPPORTED_CURRENCIES[user.preferred_currency]) {
				commit('SET_CURRENCY', user.preferred_currency);
				localStorage.setItem(STORAGE_KEY, user.preferred_currency);
				return;
			}

			// 3. Detect from IP
			try {
				const { data } = await axios.get('users/detect-currency');
				const detected = data?.data?.currency || data?.currency;
				if (detected && SUPPORTED_CURRENCIES[detected]) {
					commit('SET_CURRENCY', detected);
					localStorage.setItem(STORAGE_KEY, detected);
					return;
				}
			} catch {
				// Silently fall through to default
			}

			// 4. Fallback
			commit('SET_CURRENCY', DEFAULT_CURRENCY);
			localStorage.setItem(STORAGE_KEY, DEFAULT_CURRENCY);
		},

		/**
		 * Set currency manually (from selector).
		 * Persists to localStorage and optionally to user profile.
		 */
		async setCurrency({ commit, rootState }, code) {
			if (!SUPPORTED_CURRENCIES[code]) return;

			commit('SET_CURRENCY', code);
			localStorage.setItem(STORAGE_KEY, code);

			// Save to user profile if authenticated
			const user = rootState.userProfile;
			if (user?._id) {
				try {
					await axios.patch(`users/${user._id}`, { preferred_currency: code });
				} catch {
					// Non-critical — preference is already saved locally
				}
			}
		},
	},
};
