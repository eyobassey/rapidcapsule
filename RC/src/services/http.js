import axios from "axios";

// Set base URL on the default axios instance
axios.defaults.baseURL = `${process.env.VUE_APP_API_GATEWAY}/api/`;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

axios.interceptors.request.use(
	(config) => {
		const localToken = localStorage.getItem("token");
		const sessionToken = sessionStorage.getItem("token");
		const $TOKEN = localToken ? localToken : sessionToken;

		if ($TOKEN) {
			config.headers.Authorization = `Bearer ${$TOKEN}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

export default axios;
