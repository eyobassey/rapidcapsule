<template>
	<div class="select-container" :style="{ width: width }">
		<div class="input" :tabindex="tabindex" @blur="open = false">
			<div
				class="input__field"
				:class="{ open: open, populated: selection }"
				@click="open = !open"
			>
				{{ selection }}
			</div>

			<div class="input__icon" @click="open = !open">
				<Icons name="arrow-up" v-if="open" />
				<Icons name="arrow-down" v-if="!open" />
			</div>
			<label class="input__label">
				{{ label }}
				<span v-show="required">*</span>
			</label>

			<DropDownList
				:list="options"
				:is-drop-open="open"
				text-align="left"
				@selected-value="handleSelection"
				size="100%"
			/>
		</div>
		<slot />
	</div>
</template>

<script>
import Icons from "../icons.vue";
import DropDownList from "../utitlity/drop-down-list.vue";

export default {
	name: "Drop Down Input",

	emits: ["update:modelValue", "selectedVal"],

	components: {
		Icons,
		DropDownList,
	},

	props: {
		label: {
			type: String,
			required: true,
		},
		options: {
			type: Array,
			required: true,
		},
		default: {
			type: String,
			required: false,
			default: null,
		},
		tabindex: {
			type: Number,
			required: false,
			default: 0,
		},
		required: {
			type: Boolean,
			default: false,
		},
		width: {
			type: String,
		},
		modelValue: String,
	},

	data() {
		return {
			isSelected: null,
			open: false,
		};
	},

	computed: {
		selection() {
			return this.modelValue
				? this.modelValue
				: this.isSelected
				? this.isSelected
				: this.default
				? this.default
				: null;
		},
	},

	methods: {
		handleSelection(i) {
			const value = this.options[i];

			this.isSelected = value;
			this.$emit("update:modelValue", value);
			this.$emit("selectedVal", value);
			this.open = false;
		},
	},

	watch: {
		selection: {
			handler(val) {
				if (val) {
					this.$emit("update:modelValue", val);
					this.$emit("selectedVal", val);
				}
			},
			immediate: true,
		},
	},
};
</script>

<style scoped lang="scss">
.select-container {
	@include flexItem(vertical) {
		position: relative;
		gap: $size-4;
		height: auto;

		& > p {
			color: $color-denote-red;
		}
	}
}
.input {
	position: relative;
	background-color: $color-white;

	&:focus {
		outline: none;
		border: none;

		& .populated ~ .input__label {
			color: $color-pri;
		}
		& > .input__field {
			border-color: $color-pri-t2;

			span {
				display: none;
			}
		}
	}

	&__field {
		display: flex;
		align-items: center;
		width: 100%;
		height: 3.6rem;
		padding: $size-20 $size-16 $size-8 $size-12;

		border-radius: $size-8;
		border: 1px solid $color-g-67;

		font-family: inherit;
		font-size: $size-16;
		font-weight: $fw-regular;
		color: $color-black;
		line-height: 1.5;
		letter-spacing: 0.02em;

		outline: none;
		box-shadow: none;

		cursor: pointer;
		user-select: none;
	}

	&__label {
		position: absolute;
		top: 50%;
		left: $size-12;
		transform: translateY(-50%);

		font-family: inherit;
		color: $color-g-54;
		font-size: $size-16;
		font-weight: $fw-regular;
		line-height: 1.5;
		letter-spacing: 0.04em;

		pointer-events: none;

		transition: all 150ms ease-out;

		span {
			color: $color-denote-red;
			font-family: inherit;
			vertical-align: top;
			font-size: $size-14;
		}
	}

	&__icon {
		position: absolute;
		right: $size-12;
		top: 50%;
		transform: translateY(-50%);
		cursor: pointer;
		user-select: none;
	}
}
.placeholder {
	color: $color-g-67;
}

.populated {
	& ~ .input__label {
		top: $size-14;

		font-family: inherit;
		color: $color-g-54;
		font-size: $size-11;
		font-weight: $fw-regular;
		line-height: 1.5;
		letter-spacing: 0.04em;

		span {
			display: none;
		}
	}
}
</style>
