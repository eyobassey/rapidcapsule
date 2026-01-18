import store from "@/store/data-store";
import axios from "axios";

let saved_token = localStorage.getItem("token")
	? localStorage.getItem("token")
	: sessionStorage.getItem("token");

store.subscribe((mutation) => {
	switch (mutation.type) {
		case "SET_TOKEN":
			if (mutation.payload.token) {
				axios.defaults.headers.common["Authorization"] = `Bearer ${mutation.payload.token}`;

				// Always update the token in storage
				if (!mutation.payload.remember_login) {
					// Clear localStorage to remove old tokens, only use sessionStorage
					localStorage.removeItem("token");
					sessionStorage.setItem("token", mutation.payload.token);
				} else {
					localStorage.setItem("token", mutation.payload.token);
					sessionStorage.setItem("token", mutation.payload.token);
				}
			} else {
				axios.defaults.headers.common["Authorization"] = null;

				localStorage.clear();
				sessionStorage.clear();
			}

			break;
	}
});
