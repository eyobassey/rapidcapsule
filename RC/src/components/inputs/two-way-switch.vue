<template>
	<div class="switch__container">
		<div class="option" :class="{ active: selected === option1 }">{{ option1 }}</div>
		<div class="input__switch" :class="[activeItem]" @click="toggle"></div>
		<div class="option" :class="{ active: selected === option2 }">{{ option2 }}</div>
	</div>
</template>

<script>
export default {
	name: "Two-way Switch",

	props: {
		option1: {
			type: String,
			required: true,
		},
		option2: {
			type: String,
			required: true,
		},
		default: {
			type: String,
			required: true,
		},
	},

	data() {
		return {
			activeItem: this.default === this.option1 ? "left" : "right",
			selected: this.default,
		};
	},

	methods: {
		toggle() {
			if (this.activeItem === "left") {
				this.activeItem = "right";
				this.selected = this.option2;
			} else if (this.activeItem === "right") {
				this.activeItem = "left";
				this.selected = this.option1;
			}

			this.$emit("selectedValue", this.selected);
		},
	},

	mounted() {
		this.$emit("selectedValue", this.selected);
	},
};
</script>

<style scoped lang="scss">
.switch__container {
	@include flexItem(horizontal) {
		align-items: center;
		gap: $size-16;

		.option {
			font-size: $size-16;
			font-weight: $fw-regular;
			line-height: 1.5;
			letter-spacing: 0.02em;
			color: $color-g-44;

			&.active {
				color: $color-black;
				font-weight: $fw-medium;
			}
		}
	}
}
.input__switch {
	position: relative;
	padding: $size-2;
	width: $size-40;
	height: $size-20;
	border-radius: 100vw;
	background-color: $color-sec-s2;
	cursor: pointer;

	&::after {
		content: "";
		position: absolute;
		top: 50%;
		left: $size-2;
		transform: translateY(-50%);
		width: calc($size-20 - $size-4);
		height: calc($size-20 - $size-4);
		border-radius: 50%;
		background-color: $color-white;

		transition: all 200ms ease-out;
	}

	&.right::after {
		transform: translate(calc(100% + $size-4), -50%);
	}
}
</style>
