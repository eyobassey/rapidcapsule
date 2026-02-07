import axios from "../../services/http";

export default {
  namespaced: true,

  state() {
    return {
      signup_status: false,
      remember_login: false,
      verified: null,
      authorized: false,
      errorMessage: [],
      userType: null,
      email: null,
      activeTwoFA: null,
      loadingStatus: false,
    };
  },

  getters: {
    rememberLogin(state) {
      return state.remember_login;
    },

    isRegistered(state) {
      return state.signupStatus;
    },

    verified(state) {
      if (state.verified == true && !state.errorMessage["email_ver_status"]) {
        return "verified";
      } else if (
        state.verified == true &&
        state.errorMessage["email_ver_status"]
      ) {
        return "already verified";
      } else if (state.verified == false) {
        return "unverified";
      }
    },

    authorization(state) {
      return state.authorized;
    },

    errorMessage(state) {
      return state.errorMessage;
    },

    userType(state) {
      return state.userType;
    },

    email(state) {
      return state.email;
    },

    token(state) {
      return state.token;
    },

    activeTwoFA(state) {
      return state.activeTwoFA;
    },

    loadingStatus(state) {
      return state.loadingStatus;
    },
  },

  mutations: {
    LOAD_STATUS(state, value) {
      state.loadingStatus = value;
    },

    SET_EMAIL(state, email) {
      state.email = email;
    },

    SET_STATUS_VERIFICATION(state, status) {
      state.verified = status;
    },

    SET_AUTH_DATA(state, data) {
      state.authorized = data.status;
      state.email = data.email;
      state.activeTwoFA = data.activeTwoFA;
      state.remember_login = data.rememberLogin;
    },

    SET_USER_TYPE(state, usertype) {
      state.userType = usertype;
    },

    SET_LOGIN_ERROR(state, message) {
      state.errorMessage["Login"] = message;
    },

    SET_OTP_ERROR(state, message) {
      state.errorMessage["otp"] = message;
    },

    SET_SIGNUP_STATUS(state) {
      state.signupStatus = true;
    },

    SET_SIGNUP_ERROR(state, message) {
      state.errorMessage["signup"] = message;
    },

    SET_VERIFICATION_ERROR(state, message) {
      state.errorMessage["email_ver_status"] = message;
    },
  },

  actions: {
    /* Sign up sequence */
    async signup({ commit, state }, userdetails) {
      if (state.errorMessage["signup"]) {
        commit("SET_SIGNUP_ERROR", null);
      }
      try {
        await axios.post("/users", userdetails);

        commit("SET_EMAIL", userdetails.email);
        commit("SET_SIGNUP_STATUS");
      } catch (error) {
        if (error) {
          if (error.response.data.statusCode == 403) {
            let message =
              "This account already exists. If you are the owner of this account please try logging in.";
            commit("SET_SIGNUP_ERROR", message);
          } else {
            alert(error.response.data.errorMessage);
          }
        }
      }
    },

    async verifyemail({ commit }, params) {
      try {
        let id = params.userId;
        let token = params.token;
        await axios.get(`auth/email/${id}/verify/${token}`);

        commit("SET_STATUS_VERIFICATION", true);
      } catch (error) {
        if (error.response.data.errorMessage == "Invalid token") {
          let message = "Your verification token has expired";
          commit("SET_VERIFICATION_ERROR", message);
          commit("SET_STATUS_VERIFICATION", false);
        } else {
          let message = "Your account has already been verified";
          commit("SET_VERIFICATION_ERROR", message);
          commit("SET_STATUS_VERIFICATION", true);
        }
      }
    },

    async resendverlink({ commit }, credentials) {
      let res = await axios.post("auth/resend-email-token", credentials);

      return res;
    },

    /* Login sequence */
    //Login
    async login({ commit, state, dispatch }, credentials) {
      let usertype = credentials.user_type;
      if (state.errorMessage["Login"]) {
        commit("SET_LOGIN_ERROR", null);
      }
      try {
        let res = await axios.post("/auth/login", credentials);
        const responseData = res.data.data;

        // Check if 2FA is disabled - response contains token string directly
        // When 2FA is enabled, response contains settings object with defaults.twoFA_medium
        if (typeof responseData === 'string') {
          // 2FA is disabled, responseData is the JWT token string
          const storage = credentials.rememberMe ? localStorage : sessionStorage;
          storage.setItem("token", responseData);
          await dispatch("authenticate", responseData, { root: true });
          return;
        }

        // 2FA is enabled - response contains user settings object
        let activeTwoFA = responseData?.defaults?.twoFA_medium;
        let authorizationStatus = true;
        commit("SET_AUTH_DATA", {
          status: authorizationStatus,
          activeTwoFA: activeTwoFA,
          email: credentials.email,
          rememberLogin: credentials.rememberMe,
        });
      } catch (error) {
        if (error.response?.data?.statusCode == 401) {
          let message =
            "The email and password pair you entered is invalid. Please try again";
          commit("SET_LOGIN_ERROR", message);
          commit("SET_USER_TYPE", usertype);
        } else if (error.response?.data?.statusCode == 400) {
          commit("SET_LOGIN_ERROR", error.response.data.errorMessage);
          commit("SET_USER_TYPE", usertype);
        } else {
          console.error("Login error:", error);
          commit("SET_LOGIN_ERROR", "An unexpected error occurred. Please try again.");
        }
      }
    },

    //Login verification
    async loginverification({ dispatch, commit, state }, credentials) {
      if (state.errorMessage["otp"]) {
        commit("SET_OTP_ERROR", null);
      }
      try {
        let response = null;

        if (credentials.auth_method.toLowerCase() === "email") {
          response = await axios.post("auth/otp/verify", {
            email: credentials.email,
            token: credentials.token,
          });
        } else if (credentials.auth_method.toLowerCase() === "sms") {
          response = await axios.post("auth/otp/phone/verify", {
            email: credentials.email,
            code: credentials.token,
          });
        } else if (credentials.auth_method.toLowerCase() === "auth_apps") {
          response = await axios.post("auth/2fa/verify", {
            email: credentials.email,
            code: credentials.token,
          });
        }

        await dispatch("authenticate", response.data.data.token, { root: true });
      } catch (error) {
        if (error) {
          let message =
            "The entered OTP is invalid or expired. Please try again or click the button below to get a new one";
          commit("SET_OTP_ERROR", message);
        }
      }
    },

    //Resend OTP for authentication
    async resendotpToUser({ commit }, { payload, apiEndpoint }) {
      const apiResponse = { response: null, error: null };

      try {
        apiResponse.response = await axios.post(`${apiEndpoint}`, payload);
        return apiResponse;
      } catch (error) {
        const {
          response: {
            data: { errorMessage: serverError },
          },
        } = error;

        apiResponse.error = serverError;

        return apiResponse;
      }
    },

    //Resend OTP for authentication
    async resendotp({ commit, state }, dataInput, type) {
      console.log(dataInput, "here", state);
      commit("LOAD_STATUS", true);
      commit("SET_OTP_ERROR", null);
      let response;
      try {
        if (state.activeTwoFA === "EMAIL") {
          response = await axios.post("auth/resend-email-otp", dataInput);
        } else if (state.activeTwoFA === "SMS") {
          response = await axios.post("auth/resend-phone-otp", dataInput);
        }
        commit("LOAD_STATUS", false);
        return response;
      } catch (error) {
        console.log(error);
      }
    },

    // Google authentication
    async googleauth({ commit, dispatch, state }, data) {
      let usertype = data.user_type;
      if (state.errorMessage["Login"]) {
        commit("SET_LOGIN_ERROR", null);
      }
      try {
        let res = await axios.post("auth/google/alt-login", data);

        dispatch("authenticate", res.data.data, { root: true });
      } catch (err) {
        commit("SET_LOGIN_ERROR", err.response.data.errorMessage);
        commit("SET_USER_TYPE", usertype);
      }
    },

    // Apple authentication
    async appleauth({ commit, dispatch }, data) {
      try {
        const res = await axios.post("auth/apple", data);

        dispatch("authenticate", res.data.data, { root: true });
      } catch (err) {
        commit("SET_LOGIN_ERROR", err.response.data.errorMessage);
        commit("SET_USER_TYPE", data.authorization.state);
      }
    },

    // ==================== BIOMETRIC AUTHENTICATION ====================

    async checkBiometricEnabled(_, email) {
      try {
        const res = await axios.post("auth/biometric/check", { email });
        return { enabled: res.data.data?.enabled || false };
      } catch (err) {
        console.error("Error checking biometric status:", err);
        return { enabled: false };
      }
    },

    async getBiometricLoginOptions(_, email) {
      try {
        const res = await axios.post("auth/biometric/login/options", { email });
        return { success: true, options: res.data.data };
      } catch (err) {
        console.error("Error getting biometric login options:", err);
        return { success: false, error: err.response?.data?.message || err.message };
      }
    },

    async verifyBiometricLogin({ dispatch, commit }, { email, credential, usertype }) {
      try {
        const res = await axios.post("auth/biometric/login/verify", {
          email,
          credential,
        });

        // The response includes the JWT token
        const token = res.data.data;
        if (token) {
          // Store token and authenticate
          const storage = localStorage; // Or determine based on remember me preference
          storage.setItem("token", token);
          await dispatch("authenticate", token, { root: true });
          return { success: true };
        }
        return { success: false, error: "No token received" };
      } catch (err) {
        console.error("Biometric login error:", err);
        const message = err.response?.data?.message || "Biometric authentication failed";
        commit("SET_LOGIN_ERROR", message);
        commit("SET_USER_TYPE", usertype);
        return { success: false, error: message };
      }
    },

    // ==================== PASSKEY (DISCOVERABLE CREDENTIALS) ====================

    async getPasskeyLoginOptions() {
      try {
        const res = await axios.post("auth/biometric/passkey/options");
        return { success: true, options: res.data.data };
      } catch (err) {
        console.error("Error getting passkey options:", err);
        return { success: false, error: err.response?.data?.message || err.message };
      }
    },

    async verifyPasskeyLogin({ dispatch, commit }, { credential }) {
      try {
        const res = await axios.post("auth/biometric/passkey/verify", { credential });

        // The response includes the JWT token
        const token = res.data.data;
        if (token) {
          // Store token and authenticate
          const storage = localStorage;
          storage.setItem("token", token);
          await dispatch("authenticate", token, { root: true });
          return { success: true };
        }
        return { success: false, error: "No token received" };
      } catch (err) {
        console.error("Passkey login error:", err);
        const message = err.response?.data?.errorMessage || err.response?.data?.message || "Passkey authentication failed";
        return { success: false, error: message };
      }
    },
  },
};
