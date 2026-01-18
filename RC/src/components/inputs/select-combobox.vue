<template>
	<div class="combo-container" :class="{ containerActive: isFocused }">
		<div class="text-container">
			<input type="text" class="text-input" @focus="onFocus($event)" @blur="onBlur($event)" />
		</div>
		<div class="select-container" :tabindex="tabindex" @focus="onFocus($event)" @blur="onBlur($event), open = false">
			<div class="select__field">
				<div class="" :class="{ populated: selected }" @click="open = !open">
					{{ selected }}
				</div>
				<div class="select_icon" @click="open = !open">
					<Icons name="arrow-up" v-if="open" />
					<Icons name="arrow-down" v-if="!open" />
				</div>
			</div>
			<p class="input__label">{{ label }}</p>
			<div class="input__items drop-shadow" :class="{ selectHide: !open }">
				<div
					class="input__items--item copy"
					v-for="(option, i) of options"
					:key="i"
					@click="
						selected = option;
						open = false;
						$emit('update:modelValue', option);
					"
				>
					{{ option }}
				</div>
			</div>
		</div>
		<span class="error" v-if="errorMessage"> {{ errorMessage }}</span>
	</div>
</template>

<script>
import { ref, defineComponent, onMounted } from 'vue'
import Icon from "../Icon"
import Icons from "../icons.vue";

export default defineComponent({
	components: { Icon, Icons },
	emits: ["update:modelValue"],
	props: {
		label: { type: String, required: true },
		errorMessage: { type: String, default: '' },
		options: { type: Array, required: true },
		default: { type: String, required: false, default: null },
		tabindex: { type: Number, required: false, default: 0 },
	},
  	setup(props, context) {
		const isFocused = ref(false)
		const selected = ref(props.default ? props.default : null)
		const open = ref(false)
		const selectedState = ref(false)

		const onFocus = () => isFocused.value = true
		const onBlur = () => isFocused.value = false

		onMounted(() => {
			context.emit("update:modelValue", selected.value);
		})

    	return {
			onFocus,
			onBlur,
			isFocused,
			selected,
			open,
			selectedState
		}
  	}
});
</script>

<style scoped lang="scss">
.combo-container {
	width: 100%;
	height: 3.6rem;
	border: 1px solid $color-g-67;
	border-radius: $size-8;
	position: relative;
	padding: $size-3;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: $size-10;
}
.containerActive {
	border: 1px solid $color-pri-t2;
}
.select-container {
	width: 40%;
	height: 100%;
	background: #E5E5E5;
	border-radius: $size-6;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: $size-10;
	cursor: pointer;
}
.text-container{
	width: 60%;
	height: 100%;
}
.text-input {
	width: 100%;
	height: 100%;
	border: none;
	outline: 0;
	font-size: $size-16;
	padding: $size-8;
}
.select__field {
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $size-8;
}
.select_icon {
	display: flex;
	align-items: center;
	justify-content: space-between;
}
.input {
	position: relative;
	margin-bottom: $size-4;

	&:focus {
		outline: none;
		border: none;

		& .populated ~ .input__label {
			color: $color-pri;
		}
		& > .input__field {
			border-color: $color-pri-t2;
		}
	}

	&__field {
		display: flex;
		align-items: center;
		width: 100%;
		height: 3.6rem;
		// padding: $size-22 $size-16 $size-8 $size-16;

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
		font-size: $size-11;
		font-weight: $fw-regular;
		line-height: 1.5;
		letter-spacing: 0.04em;

		pointer-events: none;

		transition: all 400ms ease-in-out;
	}

	&__icon {
		position: absolute;
		right: $size-12;
		top: 50%;
		transform: translateY(-50%);
		cursor: pointer;
		user-select: none;
	}

	&__items {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		z-index: 10;

		padding: $size-4;
		margin-top: $size-4;
		border-radius: $size-8;
		background-color: $color-white;

		transition: all 400ms ease-in-out;

		&--item {
			width: 100%;
			padding: $size-8 $size-12;
			cursor: pointer;
			user-select: none;
			border-radius: $size-4;

			&:hover {
				background-color: $color-g-90;
			}
		}
	}
}
.error {
	color: $color-denote-red;
	margin-left: 8px;
}
.placeholder {
	color: $color-g-67;
}
.open {
	border: 1px solid $color-pri;
}
.selectHide {
	display: none;
	height: 0px;
	opacity: 0;
}

.populated {
	& ~ .input__label {
		top: $size-12;
		// transform: translateY(0);

		font-family: inherit;
		color: $color-g-54;
		font-size: $size-11;
		font-weight: $fw-regular;
		line-height: 1.5;
		letter-spacing: 0.04em;
	}
}
</style>
