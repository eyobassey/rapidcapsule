<template>
	<WebNav />
	<div class="wrapper">
		<div class="container">
			<Illustrations name="email-sent" class="illustration" />
			<div class="text-content">
				<h1 class="fs-40 align-center fw-bold lh-125">Verify your email</h1>
				<p class="fs-20 align-center fw-regular lh-150">
					We've sent a verification link to your email address. Please check your inbox and click the link to verify your account and complete your registration with Rapid Capsule.
				</p>
			</div>
			<Button
				label="Go to Home page"
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
import { mapGetters } from "vuex";
import Button from "@/components/buttons/button-primary.vue";
import WebNav from "@/components/Navigation/website-nav.vue";
import Illustrations from "@/components/illustrations.vue";

export default {
	components: {
		Button,
		WebNav,
		Illustrations,
	},

	computed: {
		...mapGetters({
			userEmail: "userRegAuth/email",
		}),
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
		gap: $size-56;
	}
	padding-top: $size-86;

	@include responsive(phone) {
		padding-top: $size-48;
	}
}

.text-content {
	@include flexItem(vertical) {
		gap: $size-16;
		align-items: center;
	}

	& > p {
		color: $color-g-44;
	}
	width: min(582px, 50%);

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
