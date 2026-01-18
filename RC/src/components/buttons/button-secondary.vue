<template>
	<button class="btn" :class="[type, size, { iconRight: iconRight, iconLeft: iconLeft }]">
		<Icons v-if="iconLeft" :name="iconName" id="icon-left" />
		{{ label }}
		<Icons v-if="iconRight" :name="iconName" id="icon-right" />
	</button>
</template>

<script>
import Icons from "../icons.vue";

export default {
	name: "Button-secondary",

	props: {
		label: {
			type: String,
			required: true,
		},
		type: {
			type: String,
			required: true,
		},
		size: {
			type: String,
			required: false,
			default: "medium",
		},
		iconName: {
			type: String,
			required: false,
		},
		iconRight: {
			type: Boolean,
			required: false,
			default: false,
		},
		iconLeft: {
			type: Boolean,
			required: false,
			default: false,
		},
	},

	components: {
		Icons,
	},
};
</script>

<style scoped lang="scss">
.btn {
	@include flexItem(horizontal) {
		align-items: center;
		justify-content: center;
		gap: $size-12;
		border: none;
		border-radius: $size-8;
		font-weight: $fw-medium;
		cursor: pointer;
		height: max-content;
	}

	&:disabled {
		background-color: $color-g-77;
		color: $color-g-54;
		pointer-events: none;

		& > #icon-left,
		& > #icon-right {
			fill: $color-g-54;
		}
	}
}

.main {
	background-color: $color-white;
	color: $color-sec-s3;

	#icon-left,
	#icon-right {
		fill: $color-sec-s3;
	}

	&:hover {
		background-color: $color-sec-t4;
	}
}

.secondary {
	background-color: transparent;
	color: $color-white;

	#icon-left,
	#icon-right {
		fill: $color-white;
	}

	&:hover {
		background-color: $color-sec-s2;
	}
}

.tertiary {
	background-color: transparent;
	border: 1px solid $color-black;
	color: $color-black;

	#icon-left,
	#icon-right {
		fill: $color-black;
	}

	&:hover {
		background-color: $color-white;
	}
}

.text {
	background-color: transparent;
	color: $color-black;

	#icon-left,
	#icon-right {
		fill: $color-black;
	}

	&:hover {
		background-color: $color-white;
	}
}

.large {
	font-size: $size-24;
	line-height: 1;
	padding: 0.8em 1.5em;
}

.medium {
	font-size: $size-16;
	line-height: 1;
	padding: 0.67em 1.33em;
}

.small {
	font-size: $size-12;
	line-height: 1;
	padding: 0.67em 1.33em;
}
</style>
