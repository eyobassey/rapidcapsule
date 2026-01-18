<template>
	<WebNav />
	<div class="wrapper">
		<div class="container">
			<div class="text-content">
				<h1 class="fs-40 lh-125 align-center fw-bold">Create new password</h1>
				<p class="fs-20 lh-150 align-center fw-regular">
					Please enter a password you can remember.
				</p>
			</div>
			<form @submit.prevent="handleSubmit" class="form">
				<div class="input__group">
					<Password label="Password" name="pass" v-model="password" />
					<Password
						label="Confirm Password"
						name="pass-confirm"
						v-model="confirm_password"
						@input="passwordMatch"
					/>
					<MessageAlert
						v-if="v$.password.$error"
						:message="v$.password.$errors[0].$message"
					/>
					<MessageAlert v-else-if="message" :message="message" />
				</div>
				<Button
					label="Save Password"
					type="primary"
					size="large"
					:loading="isLoading"
					:disabled="disableButton"
				/>
			</form>
		</div>
	</div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { useVuelidate } from "@vuelidate/core";
import { required, helpers } from "@vuelidate/validators";
import Button from "../../components/buttons/button-primary.vue";
import Password from "../../components/inputs/password.vue";
import MessageAlert from "../../components/alerts/message.vue";
import WebNav from "@/components/Navigation/website-nav.vue";

const validPassword = (value) =>
	value.match(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/) &&
	value.match(/\d/) &&
	value.match(/[A-Z]/) &&
	value.length >= 8;

export default {
	name: "New Password",

	setup: () => ({ v$: useVuelidate() }),

	components: {
		Button,
		Password,
		MessageAlert,
		WebNav,
	},

	data() {
		return {
			password: "",
			confirm_password: "",
			message: "",
			missMatch: "",
		};
	},

	computed: {
		...mapGetters({
			isLoading: "passwordReset/isloading",
		}),

		token() {
			return this.$route.query.token;
		},

		id() {
			return this.$route.query.userId;
		},

		disableButton() {
			return this.v$.$invalid || this.missMatch;
		},
	},

	validations() {
		return {
			password: {
				required: helpers.withMessage("The password field is required", required),
				validPassword: helpers.withMessage(
					"Password must be at least 8 characters long and contain at least one special character, capital letter and number",
					validPassword
				),
				$autoDirty: true,
			},
		};
	},

	methods: {
		...mapActions({
			updatePassword: "passwordReset/updatepassword",
		}),

		passwordMatch() {
			let comparator = this.password;
			let inputed = this.confirm_password;
			if (inputed) {
				if (inputed !== comparator) {
					this.message = "Passwords do not match";
					this.missMatch = true;
				} else {
					this.message = "";
					this.missMatch = false;
				}
			} else if (!inputed || blur) {
				this.message = "The confirm password field is required";
				this.missMatch = true;
			}
		},

		handleSubmit() {
			this.updatePassword({
				password: this.password,
				confirm_password: this.confirm_password,
				token: this.token,
				userId: this.id,
			}).then(() => {
				this.$router.push({ name: "Reset success" });
			});
		},
	},
};
</script>

<style scoped lang="scss">
.wrapper {
	padding-top: 6.571rem;
}
.container {
	@include flexItem(vertical) {
		justify-content: flex-start;
		align-items: center;
		gap: $size-44;
	}
	padding-top: $size-86;

	@include responsive(phone) {
		padding-top: $size-48;
	}
}

.text-content {
	@include flexItem(vertical) {
		justify-content: center;
		gap: $size-16;
	}
	text-align: center;
	width: min(528px, 50%);
	color: $color-g-44;

	@include responsive(tab-portrait) {
		width: min(582px, 80%);
	}

	@include responsive(phone) {
		width: min(312px, 90%);
	}
}

.form {
	@include flexItem(vertical) {
		align-items: center;
		gap: $size-48;
	}

	width: min(376px, 95%);

	@include responsive(phone) {
		padding: $size-0 $size-8;
	}
}
</style>
