import axios from "axios";

let saved_token = localStorage.getItem("token")
	? localStorage.getItem("token")
	: sessionStorage.getItem("token");

const VITAL_FIELD_MAP = {
	"Body Temperature": "body_temp",
	"Body Weight": "body_weight",
	"Pulse Rate": "pulse_rate",
	"Blood Sugar Level": "blood_sugar_level",
	"Blood Pressure": "blood_pressure",
	"Blood Oxygen (SpO2)": "spo2",
	"Steps": "steps",
	"Sleep": "sleep",
	"Calories Burned": "calories_burned",
	"Distance": "distance",
	"Respiratory Rate": "respiratory_rate",
	"Stress Level": "stress_level",
	"Body Fat": "body_fat",
	"Active Minutes": "active_minutes",
	"Hydration": "hydration",
	"Muscle Mass": "muscle_mass",
	"Bone Mass": "bone_mass",
	"Body Water": "body_water",
	"Visceral Fat": "visceral_fat",
	"BMR": "bmr",
};

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
			const field = VITAL_FIELD_MAP[data.name];
			if (!field) return false;

			await axios.post("vitals", {
				[field]: {
					value: data.value,
					unit: data.unit,
				},
			});

			await dispatch("authenticate", saved_token, { root: true });

			return true;
		},

		async updateVitals({ commit }, data) {
			const field = VITAL_FIELD_MAP[data.name];
			if (!field) return false;

			let idRes = await axios.get("vitals");
			let id = idRes.data.data._id;

			let res = await axios.patch(`vitals/${id}`, {
				[field]: {
					value: data.value,
					unit: data.unit,
				},
			});

			commit("SET_VITALS_RECENT", res.data.data, { root: true });

			return true;
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
