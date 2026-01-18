<template>
	<div class="btn-icon" :class="[type, size, { active: state }]">
		<Icons :name="iconName" :iconId="iconName" :style="{ fill: color }" />
		<div v-if="badge" class="badge"></div>
	</div>
</template>

<script>
import Icons from "../icons.vue";

export default {
	name: "Button-icon",

	props: {
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
			required: true,
		},
		badge: {
			type: Boolean,
			default: false,
		},
		state: {
			type: Boolean,
			default: false,
		},
		color: {
			type: String,
			default: "#363636",
		},
	},

	components: {
		Icons,
	},
};
</script>

<style scoped lang="scss">
.btn-icon {
	position: relative;
	@include flexItem(horizontal) {
		align-items: center;
		justify-content: center;
		height: fit-content;
		border: none;
		border-radius: $size-8;
		cursor: pointer;
	}

	.badge {
		position: absolute;
		top: $size-8;
		right: $size-8;
		width: $size-12;
		height: $size-12;
		border-radius: 50%;
		background-color: $color-pri;
	}

	&:disabled {
		background-color: $color-g-77;
		color: $color-g-54;
		pointer-events: none;

		& > .icons {
			fill: $color-g-54;
		}
	}
}

.primary {
	background-color: $color-g-92;

	&:hover {
		background-color: $color-g-90;
	}
}

.secondary {
	background-color: transparent;

	.badge {
		display: none;
	}

	&:hover {
		background-color: $color-white;
	}
}

.tertiary {
	background-color: transparent;

	.badge {
		display: none;
	}
}

.large {
	padding: $size-16;

	.icons {
		width: $size-32;
		height: $size-32;
	}
}

.medium {
	padding: $size-10;

	@include responsive(small-laptop) {
		padding: $size-8;

		.icons {
			width: $size-20;
			height: $size-20;
		}
	}
}

.small {
	padding: $size-1;

	.icons {
		width: $size-18;
		height: $size-18;
	}
}

.active {
	background-color: $color-g-90;
}
</style>
