import axios from "axios";
import { useConvertToBase64 } from "@/Utility-functions";

export default {
	namespaced: true,

	state() {
		return {
			addedInfo: {
				profile: {},
				pre_existing_conditions: [],
				emergency_contacts: [],
				dependants: [],
			},
		};
	},

	getters: {
		addedInfo(state) {
			return state.addedInfo;
		},
	},

	mutations: {
		SET_PROFILE_IMAGE(state, data) {
			state.addedInfo.profile.profile_photo = data;
		},

		SET_BASICINFO(state, formdata) {
			Object.assign(state.addedInfo.profile, formdata);
		},

		SET_PHONE(state, data) {
			state.addedInfo.profile.contact.phone = data;
		},

		SET_WEIGHTSTATUS(state, value) {
			state.addedInfo.profile.health_risk_factors.weight_status = value;
		},

		APPEND_PREEXCOND(state, formdata) {
			state.addedInfo.pre_existing_conditions.push(formdata);
		},

		REMOVE_PREEXCOND(state, index) {
			state.addedInfo.pre_existing_conditions.splice(index, 1);
		},

		UPDATE_PREEXCOND(state, object) {
			state.addedInfo.pre_existing_conditions.splice(object.index, 1, object.formdata);
		},

		// COMMITS FOR EMERGENCY CONTACT
		APPEND_EMERGCONTACT(state, formdata) {
			state.addedInfo.emergency_contacts.push(formdata);
		},

		REMOVE_EMERGCONTACT(state, index) {
			state.addedInfo.emergency_contacts.splice(index, 1);
		},

		UPDATE_EMERGCONTACT(state, object) {
			state.addedInfo.emergency_contacts.splice(object.index, 1, object.formdata);
		},

		// COMMITS FOR DEPENDANTS
		APPEND_DEPENDANT(state, formdata) {
			state.addedInfo.dependants.push(formdata);
		},

		REMOVE_DEPENDANT(state, index) {
			state.addedInfo.dependants.splice(index, 1);
		},

		UPDATE_DEPENDANT(state, object) {
			state.addedInfo.dependants.splice(object.index, 1, object.formdata);
		},

		APPEND_SECURITY(state, formdata) {
			state.addedInfo.security = formdata;
		},
	},

	actions: {
		updateprofileimage({ commit }, file) {
			let reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = (event) => {
				let image = event.target.result;
				commit("SET_PROFILE_IMAGE", image);
			};
		},

		updatebasicinfo({ commit, dispatch }, formdata) {
			let formObject = {
				gender: formdata.gender,
				marital_status: formdata.maritalStatus,
				basic_health_info: {
					height: {
						value: formdata.height.value,
						unit: formdata.height.unit,
					},
					weight: {
						value: formdata.weight.value,
						unit: formdata.weight.unit,
					},
				},
				health_risk_factors: {
					is_smoker: formdata.smoker,
				},
				contact: {
					address1: formdata.contact.address.line1,
					address2: formdata.contact.address.line2,
					state: formdata.contact.address.state,
					country: formdata.contact.address.country,
					zip_code: formdata.contact.address.zip,
				},
			};

			commit("SET_BASICINFO", formObject);

			if (formdata.contact.phone.number) {
				let phoneObj = null;
				phoneObj = {
					number: formdata.contact.phone.number,
					country_code: formdata.contact.phone.country_code,
				};

				commit("SET_PHONE", phoneObj);
			}

			if (formdata.weight.value && formdata.height.value) {
				let weight = formdata.weight.value;
				let height = formdata.height.value;
				let fromCmToMeterSquare = (height / 100) ^ 2;
				let fromMeterToMeterSquare = height ^ 2;
				let fromPoundToKg = weight * 0.45359237;

				if (formdata.height.unit === "cm" && formdata.weight.unit === "kg") {
					dispatch("bmiCalculator", { height: fromCmToMeterSquare, weight: weight });
				}

				if (formdata.height.unit === "cm" && formdata.weight.unit === "lb") {
					dispatch("bmiCalculator", {
						height: fromCmToMeterSquare,
						weight: fromPoundToKg,
					});
				}

				if (formdata.height.unit === "m" && formdata.weight.unit === "kg") {
					dispatch("bmiCalculator", { height: fromMeterToMeterSquare, weight: weight });
				}

				if (formdata.height.unit === "m" && formdata.weight.unit === "lb") {
					dispatch("bmiCalculator", {
						height: fromMeterToMeterSquare,
						weight: fromPoundToKg,
					});
				}
			}
		},

		bmiCalculator({ commit }, values) {
			let weightStatus;
			let BMI = values.weight / values.height;

			if (BMI < 18.5) {
				weightStatus = "Underweight";
			} else if (BMI >= 18.5 && BMI <= 24.9) {
				weightStatus = "Healthy weight";
			} else if (BMI >= 25 && BMI <= 29.9) {
				weightStatus = "Overweight";
			} else if (BMI >= 30) {
				weightStatus = "Obese";
			}

			commit("SET_WEIGHTSTATUS", weightStatus);
		},

		async updatepreexcondition({ commit, dispatch, state }, formdata) {
			let itemCount = state.addedInfo.pre_existing_conditions.length;

			let files = await useConvertToBase64(formdata.temp_file);

			let dataObject = {
				name: formdata.temp_name,
				description: formdata.temp_description,
				start_date: formdata.temp_start_date,
				end_date: formdata.temp_end_date,
				is_condition_exists: formdata.temp_is_condition_exists,
				file: files,
			};

			if (formdata.index == null) {
				commit("APPEND_PREEXCOND", dataObject);
			} else {
				commit("UPDATE_PREEXCOND", { index: formdata.index, formdata: dataObject });
			}

			if (state.addedInfo.pre_existing_conditions.length > itemCount) {
				return true;
			}
		},

		removepreexcon({ commit }, index) {
			commit("REMOVE_PREEXCOND", index);
		},

		updateemergencycontact({ commit, state }, formdata) {
			let itemCount = state.addedInfo.emergency_contacts.length;
			let dataObject = {
				first_name: formdata.temp_first_name,
				last_name: formdata.temp_last_name,
				relationship: formdata.temp_relationship,
				phone: {
					number: formdata.temp_number.replace(/[-]/g, ""),
					country_code: formdata.temp_country_code,
				},
				address1: formdata.temp_address1,
				address2: formdata.temp_address2,
				state: formdata.temp_state,
				country: formdata.temp_country,
				zip_code: formdata.temp_zip,
			};

			if (formdata.index == null) {
				commit("APPEND_EMERGCONTACT", dataObject);
			} else {
				commit("UPDATE_EMERGCONTACT", { index: formdata.index, formdata: dataObject });
			}

			if (state.addedInfo.emergency_contacts.length > itemCount) {
				return true;
			}
		},

		removeemergencycontact({ commit }, index) {
			commit("REMOVE_EMERGCONTACT", index);
		},

		updatedependant({ commit, state }, formdata) {
			let itemCount = state.addedInfo.dependants.length;
			let dataObject = {
				first_name: formdata.temp_first_name,
				last_name: formdata.temp_last_name,
				gender: formdata.temp_gender,
				date_of_birth: formdata.temp_date_of_birth,
				relationship: formdata.temp_relationship,
				basic_health_info: {
					height: {
						value: formdata.temp_height_value,
						unit: formdata.temp_height_unit,
					},
					weight: {
						value: formdata.temp_weight_value,
						unit: formdata.temp_weight_unit,
					},
				},
				contact: {
					email: formdata.temp_email,
					phone: {
						number: formdata.temp_number.replace(/[-]/g, ""),
						country_code: formdata.temp_country_code,
					},
					address1: formdata.temp_address1,
					address2: formdata.temp_address2,
					state: formdata.temp_state,
					country: formdata.temp_country,
					zip_code: formdata.temp_zip,
				},
			};

			if (formdata.index == null) {
				commit("APPEND_DEPENDANT", dataObject);
			} else {
				commit("UPDATE_DEPENDANT", { index: formdata.index, formdata: dataObject });
			}

			if (state.addedInfo.dependants.length > itemCount) {
				return true;
			}
		},

		removedependant({ commit }, index) {
			commit("REMOVE_DEPENDANT", index);
		},

		async updatedatabase({ commit, state }, formdata) {
			commit("APPEND_SECURITY", formdata);

			let data = state.addedInfo;

			await axios.patch("users", data);

			return true;
		},
	},
};
