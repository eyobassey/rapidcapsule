import axios from "axios";

let saved_token = localStorage.getItem("token")
	? localStorage.getItem("token")
	: sessionStorage.getItem("token");

export default {
	namespaced: true,

	state() {
		return {
			selectedRecords: {},
		};
	},

	getters: {
		selectedVitalRecords(state) {
			return state.selectedRecords;
		},
	},

	mutations: {
		SET_SELECTED_RECORDS(state, obj) {
			state.selectedRecords = obj;
		},
	},

	actions: {
		async addVitals({ dispatch }, data) {
			switch (data.name) {
				case "Body Temperature":
					await axios.post("vitals", {
						body_temp: {
							value: data.value,
							unit: data.unit,
						},
					});

					await dispatch("authenticate", saved_token, { root: true });

					return true;

				case "Body Weight":
					await axios.post("vitals", {
						body_weight: {
							value: data.value,
							unit: data.unit,
						},
					});

					await dispatch("authenticate", saved_token, { root: true });

					return true;

				case "Pulse Rate":
					await axios.post("vitals", {
						pulse_rate: {
							value: data.value,
							unit: data.unit,
						},
					});

					await dispatch("authenticate", saved_token, { root: true });

					return true;

				case "Blood Sugar Level":
					await axios.post("vitals", {
						blood_sugar_level: {
							value: data.value,
							unit: data.unit,
						},
					});

					await dispatch("authenticate", saved_token, { root: true });

					return true;

				case "Blood Pressure":
					await axios.post("vitals", {
						blood_pressure: {
							value: data.value,
							unit: data.unit,
						},
					});

					dispatch("authenticate", saved_token, { root: true });

					return true;
			}
		},

		async updateVitals({ commit, rootGetters }, data) {
			let idRes = await axios.get("vitals");
			let id = idRes.data.data._id;
			let res = null;

			switch (data.name) {
				case "Body Temperature":
					res = await axios.patch(`vitals/${id}`, {
						body_temp: {
							value: data.value,
							unit: data.unit,
						},
					});

					commit("SET_VITALS_RECENT", res.data.data, { root: true });

					return true;

				case "Body Weight":
					res = await axios.patch(`vitals/${id}`, {
						body_weight: {
							value: data.value,
							unit: data.unit,
						},
					});

					commit("SET_VITALS_RECENT", res.data.data, { root: true });

					return true;

				case "Pulse Rate":
					res = await axios.patch(`vitals/${id}`, {
						pulse_rate: {
							value: data.value,
							unit: data.unit,
						},
					});

					commit("SET_VITALS_RECENT", res.data.data, { root: true });

					return true;

				case "Blood Sugar Level":
					res = await axios.patch(`vitals/${id}`, {
						blood_sugar_level: {
							value: data.value,
							unit: data.unit,
						},
					});

					commit("SET_VITALS_RECENT", res.data.data, { root: true });

					return true;

				case "Blood Pressure":
					res = await axios.patch(`vitals/${id}`, {
						blood_pressure: {
							value: data.value,
							unit: data.unit,
						},
					});

					commit("SET_VITALS_RECENT", res.data.data, { root: true });

					return true;
			}
		},

		async getSelectedVitalRecords({ commit }, param) {
			let res = await axios.get("vitals/chart", {
				params: {
					vitalToSelect: param,
				},
			});

			commit("SET_SELECTED_RECORDS", res.data.data);
		},
	},
};
