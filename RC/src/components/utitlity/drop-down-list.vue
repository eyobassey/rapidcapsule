<template>
	<div
		class="drop-down__container"
		:class="{
			open: isDropOpen,
			right: dropAlignment === 'right',
			left: dropAlignment === 'left',
		}"
		:style="{
			width: size,
		}"
	>
		<div class="drop-down__list">
			<div class="drop-down__list-item" v-for="(item, index) of list">
				<p class="item" :style="{ 'text-align': textAlign }" @click="handleAction(index)">
					{{ item }}
				</p>
			</div>
		</div>
	</div>
</template>

<script>
export default {
	name: "Drop-down List",

	emits: ["selected-value"],

	props: {
		list: {
			type: Array,
			required: true,
		},
		isDropOpen: {
			type: Boolean,
			default: false,
		},
		size: {
			type: String,
			default: "150%",
		},
		textAlign: {
			type: String,
			default: "left",
		},
		dropAlignment: {
			type: String,
			default: "right",
		},
	},

	methods: {
		handleAction(selectionIndex) {
			this.$emit("selected-value", selectionIndex);
		},
	},
};
</script>

<style lang="scss" scoped>
.drop-down {
	&__container {
		display: none;
		position: absolute;
		max-height: 16.67rem;
		padding: $size-4 $size-4;
		margin-top: $size-4;
		border-radius: $size-8;
		background-color: $color-white;
		box-shadow: $size-0 $size-8 $size-24 rgba($color-black, 0.25);

		&.right {
			right: 0;
		}

		&.left {
			left: 0;
		}
	}

	&__list {
		max-height: 16rem;
		overflow-y: auto;

		@include scrollBar(normal);
	}

	&__list-item {
		width: 98%;
		padding: $size-8 $size-12;
		cursor: pointer;
		user-select: none;
		border-radius: $size-4;

		@include responsive(small-laptop) {
			padding: $size-4 $size-8;
		}

		.item {
			font-size: $size-16;
			font-weight: $fw-regular;
			line-height: 1.5;
			letter-spacing: 0.02em;
			color: $color-g-21;

			@include responsive(small-laptop) {
				font-size: $size-14;
			}
		}

		&:hover {
			background-color: $color-g-90;
		}
	}
}
.open {
	display: block;
	z-index: 10;
	top: 100%;

	animation: toggleDropList 0.4s cubic-bezier(0.13, 0.97, 0.45, 0.97);
}

@keyframes toggleDropList {
	0% {
		opacity: 0;
		top: 10%;
	}
	100% {
		opacity: 1;
		top: 100%;
	}
}
</style>
