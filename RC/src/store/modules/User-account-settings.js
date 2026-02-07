import {
  useConvertToBase64,
  useImageToBase64,
  formatNumber,
} from "@/Utility-functions";
import axios from "axios";

let saved_token = localStorage.getItem("token")
  ? localStorage.getItem("token")
  : sessionStorage.getItem("token");

export default {
  namespaced: true,

  state() {
    return {
      requestStatus: [],
      appSecrete: null,
    };
  },

  getters: {
    requestStatus(state) {
      return state.requestStatus;
    },

    qrCode(state) {
      return state.appSecrete;
    },
  },

  mutations: {
    SET_PHONE_VER_STATUS(state, value) {
      state.requestStatus["phone-ver"] = value;
    },

    SET_ACTIVATION_STATUS(state, value) {
      state.requestStatus["app_activation"] = value;
    },

    SET_SECRETE(state, value) {
      state.appSecrete = value;
    },
  },

  actions: {
    async updatetwofactorauth({ dispatch }, payload) {
      try {
        // payload can be a string (method) for backwards compatibility
        // or an object { method, enabled } for explicit control
        let updateData = {};

        if (typeof payload === 'string') {
          // Legacy: just setting the method, enable 2FA
          updateData = {
            twoFA_medium: payload,
            twoFA_auth: true,
          };
        } else if (payload && typeof payload === 'object') {
          // New: explicit control over enabled state
          if (payload.method) {
            updateData.twoFA_medium = payload.method;
          }
          if (typeof payload.enabled === 'boolean') {
            updateData.twoFA_auth = payload.enabled;
          }
        }

        await axios.patch("user-settings", {
          defaults: updateData,
        });

        await dispatch("authenticate", saved_token, { root: true });
        return { success: true };
      } catch (err) {
        console.error("Error updating 2FA settings:", err);
        return { success: false, error: err };
      }
    },

    async getPhoneVerCode({ commit }, credentials) {
      try {
        await axios.post("auth/resend-phone-token", { phone: credentials });
      } catch (err) {}
    },

    async verifynumber({ commit, dispatch }, credentials) {
      commit("SET_PHONE_VER_STATUS", true);
      try {
        await axios.post("auth/phone/verify", credentials);

        dispatch("updatetwofactorauth", "SMS");
        commit("SET_PHONE_VER_STATUS", false);
      } catch (err) {
        commit("SET_PHONE_VER_STATUS", true);
      }
    },

    async getSecreteCode({ commit }, token) {
      let res = await axios.post("auth/2fa/generate", token);
      commit("SET_SECRETE", res.data);
    },

    async activateApp({ dispatch, commit }, obj) {
      commit("SET_ACTIVATION_STATUS", true);
      try {
        let res = await axios.post("auth/2fa/turn-on", obj);

        if (res.data.statusCode == 200) {
          dispatch("updatetwofactorauth", "AUTH_APPS");
          commit("SET_ACTIVATION_STATUS", false);
        }
      } catch (err) {
        commit("SET_ACTIVATION_STATUS", true);
      }
    },

    async updateUserProfile({ dispatch, rootState }, data) {
      if (data.pre_existing_conditions) {
        let files = await useConvertToBase64(data.pre_existing_conditions.file);

        data = {
          pre_existing_conditions: [
            {
              _id: data.pre_existing_conditions._id,
              name: data.pre_existing_conditions.name,
              description: data.pre_existing_conditions.description,
              start_date: data.pre_existing_conditions.start_date,
              end_date: data.pre_existing_conditions.end_date,
              is_condition_exists:
                data.pre_existing_conditions.is_condition_exists,
              file: files,
            },
          ],
        };
      }

      if (data.profile) {
        let image = await useImageToBase64(data.profile.profile_photo);

        // Build profile object, only include profile_photo if it's provided
        // Note: Phone is excluded as changing phone requires verification flow
        const profileData = {
          gender: data.profile.gender,
          marital_status: data.profile.marital_status,
          basic_health_info: {
            height: {
              value: data.profile.basic_health_info?.height?.value,
              unit: data.profile.basic_health_info?.height?.unit,
            },
            weight: {
              value: data.profile.basic_health_info?.weight?.value,
              unit: data.profile.basic_health_info?.weight?.unit,
            },
          },
          health_risk_factors: {
            is_smoker: data.profile.health_risk_factors?.is_smoker,
          },
          contact: {
            address1: data.profile.contact?.address1,
            address2: data.profile.contact?.address2,
            state: data.profile.contact?.state,
            country: data.profile.contact?.country,
            zip_code: data.profile.contact?.zip_code,
            email: data.profile.contact?.email,
          },
        };

        // Only include profile_photo if a new image was selected
        if (image) {
          profileData.profile_photo = image;
        }

        data = { profile: profileData };
      }

      try {
        let userId = rootState.userProfile.id;
        await axios.patch(`users/${userId}`, data);

        await dispatch("authenticate", saved_token, { root: true });

        return true;
      } catch (err) {
        console.log(err);
      }
    },

    async remove({ dispatch }, data) {
      switch (data.type) {
        case "pre-existing-condition":
          try {
            await axios.delete(`users/pre-existing-conditions/${data.id}`);

            await dispatch("authenticate", saved_token, { root: true });

            return true;
          } catch (err) {}

          break;

        case "emergency-contact":
          try {
            await axios.delete(`users/emergency-contacts/${data.id}`);

            await dispatch("authenticate", saved_token, { root: true });

            return true;
          } catch (err) {}

          break;

        case "dependent":
          try {
            await axios.delete(`users/dependants/${data.id}`);

            await dispatch("authenticate", saved_token, { root: true });

            return true;
          } catch (err) {}

          break;
      }
    },

    async getSavedCards({ commit }) {
      try {
        let res = await axios.get("cards");

        commit("SET_CARDS", res.data.data, { root: true });
      } catch (err) {
        console.log(err);
      }
    },
  },
};
