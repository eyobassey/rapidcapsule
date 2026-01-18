<template>
	<div class="input__container">
		<div class="input" :class="{ disabled: disabled }">
			<input
				type="date"
				name="date"
				id="date"
				class="input__field"
				:value="modelValue"
				:max="calcMaxDate(minAge)"
				@change="$emit('update:modelValue', $event.target.value)"
			/>
			<label for="date" class="input__label">{{ Label }}</label>
		</div>
		<slot />
	</div>
</template>

<script>
export default {
	name: "DatePicker",

	props: {
		Label: {
			type: String,
			required: true,
		},

		disabled: {
			type: Boolean,
			default: false,
		},

		minAge: {
			type: String,
			default: null,
		},

		modelValue: {
			type: String,
			default: "",
		},
	},

	methods: {
		calcMaxDate(value) {
			let val = Number(value);
			let year = new Date().getFullYear().toString();
			let month = new Date().getMonth() + 1;
			let day = new Date().getDate().toString().padStart(2, 0);

			let maxDate = year - val + "-" + month.toString().padStart(2, 0) + "-" + day;

			return maxDate;
		},
	},
};
</script>

<style scoped lang="scss">
.input__container {
	@include flexItem(vertical) {
		gap: $size-4;
		min-width: 200px;
	}
}
.input {
	position: relative;

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
		position: relative;
		width: 100%;
		height: 3.6rem;
		padding: $size-22 $size-16 $size-8 $size-16;

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
		background-color: $color-white;

		&:focus {
			// height: 60%;
			border: 1px solid $color-pri-t2;

			& ~ .input__label {
				color: $color-pri;
				font-weight: $fw-semi-bold;
			}
		}
	}

	&__label {
		position: absolute;
		top: 0.428rem;
		left: $size-16;

		font-family: inherit;
		color: $color-g-54;
		font-size: $size-11;
		font-weight: $fw-regular;
		line-height: 1.5;
		letter-spacing: 0.04em;

		pointer-events: none;
	}
}
</style>
