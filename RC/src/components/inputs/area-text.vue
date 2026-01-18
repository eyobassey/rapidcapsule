<template>
	<div class="input__container">
		<div class="input" :class="{ disabled: disabled }">
			<textarea
				:id="identity"
				:name="name"
				:readonly="disabled"
				:placeholder="placeholder"
				:rows="rows"
				class="input__field"
				:value="modelValue"
				@input="$emit('update:modelValue', $event.target.value)"
			/>
			<label :for="name" class="input__label"></label>
		</div>
		<p v-show="counter" class="fs-14 fw-regular lh-100 ls-20 align-right counter">
			{{ charCount }}/{{ limit }}
		</p>
	</div>
</template>

<script>
export default {
	name: "Area Text",

	data() {
		return {
			identity: this.id ? this.id : this.name,
			status: false,
		};
	},

	props: {
		label: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			required: true,
		},
		id: {
			type: String,
			default: "",
		},
		placeholder: {
			type: String,
			required: true,
		},
		rows: {
			type: String,
			required: true,
			default: '5'
		},
		limit: {
			type: String,
			default: "150",
		},
		charCount: {
			type: String,
			default: "0",
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		required: {
			type: Boolean,
			default: false,
		},
		counter: {
			type: Boolean,
			default: false,
		},
		modelValue: String,
	},
};
</script>

<style scoped lang="scss">
.input__container {
	@include flexItem(vertical) {
		gap: $size-4;
	}
	width: 100%;

	.counter {
		color: $color-g-44;
	}
}
.input {
	&.disabled {
		& > .input__field {
			pointer-events: none;
			background-color: $color-g-90;
			color: $color-g-67;
		}

		& > .input__label {
			color: $color-g-67;
		}
	}

	&__field {
		width: 100%;
		padding: $size-8 $size-16 $size-8 $size-16;

		border-radius: $size-8;
		border: $size-1 solid $color-g-67;

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
			border-width: $size-1;
		}

		&::placeholder {
			color: $color-g-67;
		}
	}

	&__label {
		display: none;
	}
}
</style>
