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
		SET_SENT_STATUS(state) {
			state.email_sent = true;
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
			try {
				let response = await axios.post("auth/forgot-password", dataInput);

				if (response.data.statusCode == 200) {
					commit("SET_SENT_STATUS");
					commit("SET_ERRORMESSAGE", null);
				}
			} catch (error) {
				if (error) {
					if (error.response.data.statusCode == 404) {
						let message =
							"This email is not associated with any account. Please check your email and try again";
						commit("SET_ERRORMESSAGE", message);
					}
				}
			}
		},

		async updatepassword({ commit }, dataInput) {
			commit("SET_LOADINGSTATUS", true);
			try {
				let response = await axios.post("auth/reset-password", dataInput);

				if (response.data.statusCode == 200) {
					commit("SET_LOADINGSTATUS", false);
					return true;
				}
			} catch (error) {
				console.log(error.response.data);
				// alert(error.response.data.message);
				// commit("SET_LOADINGSTATUS", false);
			}
		},
	},
};
