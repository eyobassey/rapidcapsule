import { createStore } from "vuex";
import userRegAuth from "./modules/User-reg-auth";
import passwordReset from "./modules/password-reset";
import profileSetup from "./modules/Profile-setup";
import userAccountSettings from "./modules/User-account-settings";
import prescriptions from "./modules/prescriptions";
import orders from "./modules/orders";
import vitalsManagement from "./modules/vitals";
import userModule from "./modules/userModule";
import pharmacy from "./modules/pharmacy";
import pharmacyPortal from "./modules/pharmacyPortal";
import whatsapp from "./modules/whatsapp";
import notifications from "./modules/notifications";
import axios from "../services/http";

export default createStore({
  state() {
    return {
      token: null,
      userProfile: null,
      userSettings: null,
      recentVitals: null,
      activeSub: null,
      cards: null,
      referral: null,
      userSecurityQuestion: "",
      loading: false,
    };
  },

  getters: {
    userprofile(state) {
      return state.userProfile;
    },
    userSecurityQuestion(state) {
      return state.userSecurityQuestion;
    },

    getLoadingState(state) {
      return state.loading;
    },

    recentVitals(state) {
      return state.recentVitals;
    },
    usersettings(state) {
      return state.userSettings;
    },

    activeSub(state) {
      return state.activeSub;
    },

    cards(state) {
      return state.cards;
    },

    authenticated(state) {
      return !!(state.userProfile && state.token);
    },

    // COMMENTED OUT - CONFLICTED SECTION FROM STASH
    /*
	mutations: {
		SET_TOKEN(state, data) {
			console.log("SET_TOKEN called with data:", data);
			state.token = data.token;
			// Store token in localStorage for HTTP interceptor
			if (data && data.token) {
				console.log("Storing token in storage, remember_login:", data.remember_login);
				// Always store in sessionStorage for now to debug
				sessionStorage.setItem("token", data.token);
				console.log("Token stored in sessionStorage:", sessionStorage.getItem("token"));
				if (data.remember_login) {
					localStorage.setItem("token", data.token);
					console.log("Token also stored in localStorage");
				}
			} else {
				console.log("Removing tokens from storage");
				localStorage.removeItem("token");
				sessionStorage.removeItem("token");
			}
		},
		SET_USER(state, user) {
			state.userProfile = user;
		},
		SET_USER_SETTINGS(state, settings) {
			state.userSettings = settings;
		},
		SET_VITALS_RECENT(state, recentVitals) {
			state.recentVitals = recentVitals;
		},
		SET_ACTIVE_SUB(state, sub) {
			state.activeSub = sub;
		},
		SET_CARDS(state, cards) {
			state.cards = cards;
		},
	},

	actions: {
		//Authentication attempt
		async authenticate({ commit, state, rootGetters }, token) {
			console.log("Authenticate called with token:", token);
			console.log("Remember login:", rootGetters["userRegAuth/rememberLogin"]);
			if (token) {
				commit("SET_TOKEN", {
					token: token,
					remember_login: rootGetters["userRegAuth/rememberLogin"],
				});
			}
    */

    referral(state) {
      return state.referral;
    },
  },

// <<<<<<< Updated upstream
  mutations: {
    SET_TOKEN(state, data) {
      state.token = data.token;
      // Store token in localStorage for HTTP interceptor
      if (data && data.token) {
        // Always store in sessionStorage for now to debug
        sessionStorage.setItem("token", data.token);
        if (data.remember_login) {
          localStorage.setItem("token", data.token);
        }
      } else {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
      }
    },
    SET_USER(state, user) {
      state.userProfile = user;
    },
    SET_USER_SETTINGS(state, settings) {
      state.userSettings = settings;
    },
    SET_VITALS_RECENT(state, recentVitals) {
      state.recentVitals = recentVitals;
    },
    SET_ACTIVE_SUB(state, sub) {
      state.activeSub = sub;
    },
    SET_CARDS(state, cards) {
      state.cards = cards;
    },
    SET_REFERRAL(state, referral) {
      state.referral = referral;
    },
    SET_USER_SECURITY_QUESTION(state, question) {
      state.userSecurityQuestion = question;
    },
    SET_LOADING_STATE(state, loadingState) {
      state.loading = loadingState;
    },
  },
// =======
			// // Small delay to ensure token is stored in storage
			// await new Promise(resolve => setTimeout(resolve, 100));

			// try {
			// 	await axios
			// 		.all([
			// 			axios.get("users/me"),
			// 			axios.get("user-settings"),
			// 			axios.get("vitals/recent"),
			// 			axios.get("subscriptions/active"),
			// 			axios.get("cards"),
			// 		])
			// 		.then(
			// 			axios.spread((user, settings, recentVitals, sub, cards) => {
			// 				commit("SET_USER", user.data.data);
			// 				commit("SET_USER_SETTINGS", settings.data.data);
			// 				commit("SET_VITALS_RECENT", recentVitals.data.data);
			// 				commit("SET_ACTIVE_SUB", sub.data.data);
			// 				commit("SET_CARDS", cards.data.data);
			// 			})
			// 		);
			// } catch (error) {
			// 	if (error) {
			// 		commit("SET_TOKEN", { token: null });
			// 		commit("SET_USER", null);
			// 		commit("SET_USER_SETTINGS", null);
			// 		commit("SET_ACTIVE_SUB", null);
			// 		commit("SET_CARDS", null);
			// 	}
			// }
		// },
	// },
// >>>>>>> Stashed changes

  actions: {
    //Authentication attempt
    async authenticate({ commit, state, rootGetters }, token) {
      if (token) {
        commit("SET_TOKEN", {
          token: token,
          remember_login: rootGetters["userRegAuth/rememberLogin"],
        });
      }

      if (!state.token) {
        return;
      }

      try {
        await axios
          .all([
            axios.get("users/me"),
            axios.get("user-settings"),
            axios.get("vitals/recent"),
            axios.get("subscriptions/active"),
            axios.get("cards"),
            axios.get("referrals/me"),
            axios.get("users/security-question"),
          ])
          .then(
            axios.spread(
              (
                user,
                settings,
                recentVitals,
                sub,
                cards,
                referrals,
                securitQuestion
              ) => {
                console.log("Authentication API calls successful, setting user data...");
                commit("SET_USER", user.data.data);
                commit("SET_USER_SETTINGS", settings.data.data);
                commit("SET_VITALS_RECENT", recentVitals.data.data);
                commit("SET_ACTIVE_SUB", sub.data.data);
                commit("SET_CARDS", cards.data.data);
                commit("SET_REFERRAL", referrals.data.data);
                commit("SET_USER_SECURITY_QUESTION", securitQuestion.data.data);
                commit("SET_LOADING_STATE", false);
              }
            )
          )
          .catch(
            ({
              response: {
                data: { errorMessage },
              },
            }) => {
              commit("SET_LOADING_STATE", false);
            }
          );
      } catch (error) {
        if (error) {
          commit("SET_TOKEN", { token: null });
          commit("SET_USER", null);
          commit("SET_USER_SETTINGS", null);
          commit("SET_ACTIVE_SUB", null);
          commit("SET_CARDS", null);
          commit("SET_REFERRAL", null);
          commit("SET_USER_SECURITY_QUESTION", null);
          commit("SET_LOADING_STATE", false);
        }
      }
    },
  },

  modules: {
    userRegAuth,
    passwordReset,
    profileSetup,
    userAccountSettings,
    vitalsManagement,
    userModule,
    prescriptions,
    orders,
    pharmacy,
    pharmacyPortal,
    whatsapp,
    notifications,
  },
});
