<template>
	<WebNav />
	<div class="wrapper">
		<div class="container">
			<img
				src="../../assets/illustrations/illustration-emailSent.svg"
				alt="Illustration of mail envelope on the move"
				class="illustration"
			/>
			<div class="text-content">
				<h1 class="fs-40 lh-125 align-center fw-bold">Reset link sent</h1>
				<p class="fs-20 lh-150 align-center fw-regular">
					We've sent a password reset link to your email address. Please check your inbox and click the link to create a new password for your Rapid Capsule account.
				</p>
			</div>

			<Button
				label="Go to home page"
				type="text"
				size="large"
				iconName="arrow-left"
				:iconLeft="true"
				@click="$router.push({ name: 'Home' })"
			/>
		</div>
	</div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import Button from "../../components/buttons/button-primary.vue";
import WebNav from "@/components/Navigation/website-nav.vue";

export default {
	components: {
		Button,
		WebNav,
	},

	computed: {
		...mapGetters({
			errormessage: "passwordReset/errormessage",
		}),

		token() {
			return this.$route.query.token;
		},

		id() {
			return this.$route.query.userId;
		},
	},

	methods: {},
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

.illustration {
	width: max(7.428rem, 6vw);
	height: auto;
}
</style>
