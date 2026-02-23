import axios from "axios";

export default {
	namespaced: true,

	state() {
		return {
			email_sent: false,
			errormessage: null,
			loading: false,
		};
	},

	getters: {
		email_sent(state) {
			return state.email_sent;
		},

		errormessage(state) {
			return state.errormessage;
		},

		isloading(state) {
			return state.loading;
		},
	},

	mutations: {
		SET_SENT_STATUS(state, value) {
			state.email_sent = value;
		},

		SET_ERRORMESSAGE(state, message) {
			state.errormessage = message;
		},

		SET_LOADINGSTATUS(state, status) {
			state.loading = status;
		},
	},

	actions: {
		async requestresetlink({ commit }, dataInput) {
			commit("SET_ERRORMESSAGE", null);
			commit("SET_SENT_STATUS", false);
			try {
				await axios.post("auth/forgot-password", dataInput);
				commit("SET_SENT_STATUS", true);
			} catch (error) {
				if (error?.response?.status == 404) {
					commit("SET_ERRORMESSAGE",
						"This email is not associated with any account. Please check your email and try again.");
				} else {
					commit("SET_ERRORMESSAGE",
						error?.response?.data?.message || "Something went wrong. Please try again.");
				}
			}
		},

		async updatepassword({ commit }, dataInput) {
			commit("SET_LOADINGSTATUS", true);
			commit("SET_ERRORMESSAGE", null);
			try {
				await axios.post("auth/reset-password", dataInput);
				commit("SET_LOADINGSTATUS", false);
				return true;
			} catch (error) {
				commit("SET_LOADINGSTATUS", false);
				const message = error?.response?.data?.message || "Failed to reset password. The link may have expired. Please request a new one.";
				commit("SET_ERRORMESSAGE", message);
				return false;
			}
		},
	},
};
