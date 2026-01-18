<template>
	<div class="item-container">
		<div class="content">
			<p class="line-1">{{ lineOneContent }}</p>
			<p v-show="lineTwoContent" class="line-2">{{ lineTwoContent }}</p>
			<p v-show="lineThreeContent" class="line-3">{{ lineThreeContent }}</p>
		</div>
		<slot />
	</div>
</template>

<script>
import Icons from "@/components/icons.vue";

export default {
	name: "Single Line List Item",

	components: {
		Icons,
	},

	props: {
		lineOneContent: {
			type: String,
			required: true,
		},
		lineTwoContent: {
			type: String,
		},
		lineThreeContent: {
			type: String,
		},
		lineCount: {
			type: Number,
			default: 1,
		},
	},

	emits: ["handleAction"],
};
</script>

<style lang="scss" scoped>
.item-container {
	@include flexItem(horizontal) {
		gap: $size-32;
		align-items: center;

		width: 100%;
		padding: $size-16 $size-24;
		border-radius: $size-10;
		background-color: $color-pri-t6;

		&:hover {
			outline: $size-1 solid $color-pri-t3;
			outline-offset: -$size-1;
		}

		@include responsive(phone) {
			padding: $size-12 $size-8 $size-12 $size-12;
			align-items: flex-start;
		}
	}

	.content {
		@include flexItem(vertical) {
			gap: $size-8;
		}
		flex-grow: 1;

		.line-1 {
			font-family: inherit;
			font-size: $size-18;
			font-weight: $fw-medium;
			letter-spacing: 0.02;
			line-height: 1.25;
			color: $color-black;

			// Add elipsis to oveflowing text
			overflow: hidden;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 1;
		}

		.line-2 {
			overflow: hidden;
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 1;
		}

		.line-2,
		.line-3 {
			font-family: inherit;
			font-size: $size-16;
			font-weight: $fw-regular;
			letter-spacing: 0.02;
			line-height: 1.5;
			color: $color-g-44;
		}
	}
}
</style>
