<template>
	<div class="loader" :class="{ overlay: useOverlay, 'rounded-edges': rounded }">
		<div class="loader__spinner"></div>
	</div>
</template>

<script>
export default {
	name: "loader",

	props: {
		useOverlay: {
			type: Boolean,
			default: false,
		},
		rounded: {
			type: Boolean,
			default: false,
		},
	},
};
</script>

<style lang="scss" scoped>
.loader {
	@include absolutePosition(abs-center);

	@include flexItem(horizontal) {
		align-items: center;
		justify-content: center;
	}

	&.overlay {
		width: 100%;
		height: 100%;
		background-color: $color-white-90;
	}

	&.rounded-edges {
		border-radius: $size-24;

		@include responsive(tab-landscape) {
			border-radius: $size-15;
		}

		@include responsive(tab-portrait) {
			border-radius: $size-15;
		}

		@include responsive(phone) {
			border-radius: $size-16 $size-16 $size-0 $size-0;
		}
	}

	&__spinner {
		width: $size-48;
		height: $size-48;
		border-radius: 50%;
		border-top: $size-4 solid $color-pri;
		border-right: $size-4 solid transparent;
		animation: spinner 800ms linear infinite;
	}
}

@keyframes spinner {
	to {
		transform: rotate(360deg);
	}
}
</style>
