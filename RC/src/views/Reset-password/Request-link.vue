<template>
	<WebNav />
	<div class="wrapper">
		<div class="container">
			<div class="text-content">
				<h1 class="fs-40 lh-125 align-center fw-bold">Forgot password</h1>
				<p class="fs-20 lh-150 align-center fw-regular">Please enter your email address.</p>
			</div>
			<form @submit.prevent="handleSubmit" class="form form__body">
				<MessageAlert v-if="errormessage" :message="errormessage" />
				<div class="input__group--row">
					<Text name="email" type="email" label="Email" v-model="email" />
				</div>

				<Button
					label="Send reset link"
					type="primary"
					size="large"
					iconName="arrow-right"
					:loading="isLoading"
					:iconRight="!isLoading"
					:disabled="this.v$.email.$invalid"
				/>

				<Button
					label="Go to home page"
					type="text"
					size="large"
					iconName="arrow-left"
					:iconLeft="true"
				/>
			</form>
		</div>
	</div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { useVuelidate } from "@vuelidate/core";
import { required, email, helpers } from "@vuelidate/validators";
import Text from "../../components/inputs/text.vue";
import Button from "../../components/buttons/button-primary.vue";
import MessageAlert from "../../components/alerts/message.vue";
import WebNav from "@/components/Navigation/website-nav.vue";

export default {
	name: "Password-reset",

	setup: () => ({ v$: useVuelidate() }),

	components: {
		Text,
		Button,
		MessageAlert,
		WebNav,
	},

	data() {
		return {
			email: "",
			isLoading: false,
		};
	},

	computed: {
		...mapGetters({
			isEmailSent: "passwordReset/email_sent",
			errormessage: "passwordReset/errormessage",
		}),
	},

	validations: {
		email: {
			required: required,
			email: helpers.withMessage("Please enter a valid email address", email),
		},
	},

	methods: {
		...mapActions({
			requestResetLink: "passwordReset/requestresetlink",
			updatePassword: "psswordReset/updatepassword",
		}),

		handleSubmit() {
			this.isLoading = true;
			this.requestResetLink({ email: this.email });
		},
	},

	watch: {
		isEmailSent(value) {
			if (value == true) {
				this.$router.push({ name: "Password link sent" });
			}
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
		gap: $size-26;
	}

	width: min(582px, 95%);
}
</style>
