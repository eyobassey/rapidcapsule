<template>
	<div class="loader">
		<div class="loader__spinner" :class="[color]"></div>
	</div>
</template>

<script>
export default {
	name: "loader for buttons",

	props: {
		color: {
			type: String,
			default: "inverted",
		},
	},
};
</script>

<style lang="scss" scoped>
.loader {
	@include flexItem(horizontal) {
		align-items: center;
		justify-content: center;
	}

	&__spinner {
		width: $size-16;
		height: $size-16;
		border-radius: 50%;
		border-right: $size-2 solid transparent;
		animation: spinner 800ms linear infinite;

		&.inverted {
			border-top: $size-2 solid $color-white;
		}
		&.primary {
			border-top: $size-2 solid $color-pri;
		}
	}
}

@keyframes spinner {
	to {
		transform: rotate(360deg);
	}
}
</style>
