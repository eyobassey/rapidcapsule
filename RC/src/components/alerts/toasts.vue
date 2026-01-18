<template>
	<div class="toast__container">
		<div class="toast__content">
			<p class="message-text">{{ message }}</p>
			<slot />
		</div>
	</div>
</template>

<script>
export default {
	name: "toast",

	props: {
		message: {
			type: String,
			required: true,
		},
	},
};
</script>

<style lang="scss" scoped>
.toast {
	&__container {
		position: fixed;
		bottom: $size-44;
		right: $size-48;
		padding: $size-12 $size-32;
		background-color: $color-sec-s2;
		border-radius: $size-16;
		z-index: 1000;
		min-width: 12rem;

		@include responsive(tab-portrait) {
			left: 50%;
			transform: translateX(-50%);
			padding: $size-8 $size-18;
			min-width: 65%;
			max-width: 85%;
		}
	}

	&__content {
		@include flexItem(horizontal) {
			align-items: center;
			justify-content: space-between;
			width: 100%;

			.message-text {
				flex-grow: 1;
				font-size: $size-16;
				font-weight: $fw-thin;
				color: $color-g-97;
				text-align: left;

				@include responsive(tab-portrait) {
					text-align: center;
				}
			}
		}
	}
}
</style>
