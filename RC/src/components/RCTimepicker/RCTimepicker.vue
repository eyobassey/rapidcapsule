<template>
	<div class="container-timepicker" :class="{ containerActive: isFocused }">
		<date-picker v-model="modelValue" mode="time" hide-time-header>
			<template v-slot="{ inputValue, togglePopover }">
				<div class="rc-timepicker">
					<label>{{ label }}</label>
					<input
						:value="inputValue"
						@focus="isFocused = true"
						@blur="isFocused = false"
						@click="togglePopover()"
					/>
				</div>
			</template>
		</date-picker>
		<icon icon-name="icon-time-picker" size="xs" />
	</div>
</template>

<script>
import { ref, defineComponent, onMounted, watch } from 'vue';
import { DatePicker } from 'v-calendar';
import Icon from "@/components/RCIcon";

export default defineComponent({
  	setup(props, ctx) {
		const modelValue = ref(new Date())
		const isFocused = ref(false)

		onMounted(() => {
			if (props.modelValue instanceof Date) {
				modelValue.value = props.modelValue;
				ctx.emit('update:modelValue', modelValue?.toISOString());
			} else ctx.emit('update:modelValue', new Date()?.toISOString());
		});

		watch(modelValue, (modelValue) => {
			ctx.emit('update:modelValue', modelValue?.toISOString());
		});

    	return {
			modelValue,
			isFocused
		}
  	},
	components: {
		Icon,
		DatePicker
	},
  	props: {
		modelValue: { type: Date, required: true, default: new Date() },
		label: { type: String, default: 'Date' },
		mode: { type: String, default: 'date' }
	},
	emits: ["update:modelValue"],
});
</script>

<style lang="scss" scoped>
.container-timepicker {
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-content: center;
	gap: $size-6;
	width: 100%;
	height: 3.6rem;
	padding: $size-8 $size-16;
	background: $color-white;
	border: 1px solid $color-g-67;
	border-radius: $size-8;
}
.rc-timepicker {
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-self: start;
	align-items: start;
	gap: $size-2;

	& input {
		width: 100%;
		border: 0;
		outline: 0;
		font-size: $fs-medium;
		font-weight: $fw-regular;
	}
	& label {
		font-size: 11px;
		font-weight: $fw-regular;
		color: $color-g-67;
	}
}
.containerActive {
	border-color: $color-pri-t2;
	border-width: 1px;
	border-style: solid;
}
.label-active {
	top: $size-6;
	transform: translateY(0);

	font-family: inherit;
	color: $color-pri;
	font-size: $size-11;
	font-weight: $fw-regular;
	line-height: 1.5;
	letter-spacing: 0.04em;
}
:deep(.vc-time-date) {
	display: none;
}
</style>