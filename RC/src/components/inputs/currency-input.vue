<template>
	<div class="input__container">
		<div class="input" :class="{ disabled: disabled }">
			<input
				ref="inputRef"
				type="text"
				:id="identity"
				:name="name"
				:placeholder="placeholder"
				:maxlength="maxChars"
				:minlength="minChars"
				:readonly="disabled"
				class="input__field"
				:class="{ populated: modelValue }"
				:value="modelValue"
				@input="$emit('update:modelValue', $event.target.value)"
			/>
			<label v-if="label" :for="name" class="input__label">
				{{ label }}
				<span v-show="required">*</span>
			</label>
		</div>

		<slot />
	</div>
</template>

<script>
import { useCurrencyInput } from 'vue-currency-input'

export default {
	name: "CurrencyInput",

	data() {
		return {
			identity: this.id ? this.id : this.name,
			status: false,
		};
	},
	setup(props) {
		const { inputRef } = useCurrencyInput(props.options)

		return { inputRef }
	},

	props: {
		label: {
			type: String,
			required: false,
		},
		placeholder: {
			type: String,
			required: false,
		},
		name: {
			type: String,
			required: true,
		},
		id: {
			type: String,
			default: "",
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		required: {
			type: Boolean,
			default: false,
		},
		maxChars: String,
		minChars: String,
		modelValue: Number,
		options: Object,
	},
};
</script>

<style scoped lang="scss">
.input__container {
	@include flexItem(vertical) {
		gap: $size-4;
		min-width: 200px;

		& > p {
			color: $color-denote-red;
		}
	}
}
.input {
	position: relative;

	&.disabled {
		& > .input__field {
			pointer-events: none;
			background-color: $color-g-90;
			color: $color-g-67;
			outline: 0;
			border: none;
		}

		& > .input__label {
			color: $color-g-67;
		}
	}

	&__field {
		width: 100%;
		height: 3.6rem;
		padding: $size-8 $size-16;

		border-radius: $size-8;
		border: 1px solid $color-g-67;

		font-family: inherit;
		font-size: $size-16;
		font-weight: $fw-regular;
		color: $color-black;
		line-height: 1.5;
		letter-spacing: 0.02em;

		// border: none;
		outline: none;
		box-shadow: none;

		&:focus {
			border-color: $color-pri-t2;
			border-width: 1px;

			& ~ .input__label {
				top: $size-14;

				font-family: inherit;
				color: $color-pri;
				font-size: $size-11;
				font-weight: $fw-regular;
				line-height: 1.5;
				letter-spacing: 0.04em;

				span {
					display: none;
				}
			}

			& .populated ~ .input__label {
				color: $color-pri;
				font-weight: $fw-semi-bold;
			}
		}
	}

	&__label {
		position: absolute;
		top: 50%;
		left: $size-16;
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
