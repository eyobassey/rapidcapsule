<template>
	<WebNav />
	<div class="wrapper">
		<div class="container">
			<img
				src="../../assets/illustrations/check-circle-solid.svg"
				alt="Illustration of mail envelope on the move"
				class="illustration"
			/>
			<div class="text-content">
				<h1 class="fs-40 lh-125 align-center fw-bold">Password saved</h1>
				<p class="fs-20 lh-150 align-center fw-regular">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin aliquet bibendum
					elit suspendisse at luctus. Volutpat elit lacinia morbi arcu morbi.
				</p>
			</div>
			<Button label="Log in to app" type="tertiary" size="large" @click="handleClick" />
		</div>
	</div>
</template>

<script>
import Button from "../../components/buttons/button-primary.vue";
import WebNav from "@/components/Navigation/website-nav.vue";

export default {
	components: {
		Button,
		WebNav,
	},

	methods: {
		handleClick() {
			this.$router.push({ name: "Login" });
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

.illustration {
	width: max(6.428rem, 6vw);
	height: auto;
}
</style>
