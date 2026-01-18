<template>
	<div class="input__container">
		<div class="input">
			<input
				required
				type="password"
				:id="identity"
				:name="name"
				:class="{ populated: modelValue }"
				class="input__field"
				:value="modelValue"
				@input="$emit('update:modelValue', $event.target.value)"
			/>
			<div class="input__icon" @click="passReveal">
				<Icons v-if="!show" name="eye-open" id="show" />
				<Icons v-if="show" name="eye-closed" id="hide" />
			</div>
			<label :for="name" class="input__label">{{ label }}</label>
		</div>

		<slot />
	</div>
</template>

<script>
import Icons from "../icons.vue";
export default {
	name: "Text",
	data() {
		return {
			identity: this.id ? this.id : this.name,
			show: false,
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
		modelValue: String,
		status: {
			type: Boolean,
			default: false,
		},
	},
	components: {
		Icons,
	},

	methods: {
		passReveal() {
			let element = document.getElementById(this.identity);

			if (element.type === "password") {
				element.type = "text";
				this.show = true;
			} else {
				element.type = "password";
				this.show = false;
			}
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

	&__field {
		width: 100%;
		height: 3.6rem;
		padding: $size-20 $size-16 $size-8 $size-16;

		border-radius: 0.571rem;
		border: 1px solid $color-g-67;

		font-family: inherit;
		font-size: $size-16;
		font-weight: $fw-regular;
		color: inherit;
		line-height: 1.25;
		letter-spacing: 0.02em;

		// border: none;
		outline: none;
		box-shadow: none;

		&::-ms-reveal {
			display: none;
		}

		&:focus {
			// height: 60%;
			border-color: $color-pri-t2;
			border-width: 1px;

			& ~ .input__label {
				top: $size-12;

				font-family: inherit;
				color: $color-pri;
				font-size: $size-11;
				font-weight: $fw-regular;
				line-height: 1.5;
				letter-spacing: 0.04em;
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
	}

	&__icon {
		@include absolutePosition(v-center) {
			right: $size-16;
			cursor: pointer;
			@include flexItem(horizontal) {
				align-items: center;
				justify-content: center;
			}
		}

		#show,
		#hide {
			fill: $color-g-21;
		}
	}
}

.icon {
	display: none;
	position: absolute;
	top: 50%;
	right: $size-16;
	transform: translateY(-50%);
}

.populated {
	& ~ .input__label {
		top: $size-12;

		font-family: inherit;
		color: $color-g-67;
		font-size: $size-11;
		font-weight: $fw-regular;
		line-height: 1.5;
		letter-spacing: 0.04em;
	}
}
</style>
