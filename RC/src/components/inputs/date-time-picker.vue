<template>
	<div class="container" :class="{ containerActive: isFocused }">
		<!-- Show inline calendar if expanded, otherwise show input with popover -->
		<div v-if="expanded && mode === 'date'" class="inline-calendar">
			<label class="calendar-label">{{ label }}</label>
			<date-picker
				v-model="modelValue"
				:mode="mode"
				:min-date="minDate"
				:max-date="maxDate"
				:is-expanded="true"
				expanded
				borderless
				transparent
			/>
		</div>
		<date-picker
			v-else
			class="datepicker"
			v-model="modelValue"
			:mode="mode"
			:min-date="minDate"
			:max-date="maxDate"
			:popover="{ visibility: 'click' }"
		>
			<template v-slot="{ inputValue, inputEvents }">
				<label>{{ label }}</label>
				<input
					:value="inputValue"
					v-on="inputEvents"
					@focus="onFocus($event)"
					@blur="onBlur($event)"
				/>
			</template>
		</date-picker>
		<Icon icon-name="icon-date-picker" size="xs" v-if="mode === 'date' && !expanded" />
		<Icon icon-name="icon-time-picker" size="xs" v-if="mode === 'time'" />
	</div>
</template>

<script>
import { ref, defineComponent, onMounted, watch } from 'vue';
import { DatePicker } from 'v-calendar';
import Icon from "../Icon";

export default defineComponent({
	components: {
		Icon,
		DatePicker
	},
  	props: {
		modelValue: { required: true, default: '' },
		label: { type: String, default: 'Date' },
		mode: { type: String, default: 'date' },
		minDate: { type: Date, default: null },
		maxDate: { type: Date, default: null },
		expanded: { type: Boolean, default: false }
	},
	emits: ["update:modelValue"],
  	setup(props, { emit }) {
		const modelValue = ref(new Date())
		const isFocused = ref(false)

		const onFocus = () => isFocused.value = true
		const onBlur = () => isFocused.value = false

		onMounted(() => {
			modelValue.value = props.modelValue;
		})
		watch(modelValue, (modelValue) => {
			emit('update:modelValue', modelValue);
		});

    	return {
			modelValue,
			onFocus,
			onBlur,
			isFocused
		}
  	}
});
</script>

<style lang="scss" scoped>
.container {
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-content: center;
	gap: $size-6;
	width: 100%;
	min-height: 3.6rem;
	height: auto;
	padding: $size-8 $size-16;
	background: $color-white;
	border: 1px solid $color-g-67;
	border-radius: $size-8;

	&:has(.inline-calendar) {
		height: auto;
		padding: $size-16;
		flex-direction: column;
		align-items: stretch;
	}
}

.inline-calendar {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: $size-12;

	.calendar-label {
		font-size: $size-14;
		font-weight: 600;
		color: $color-black;
	}
}
.datepicker {
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

// & .populated ~ .input__label {
// 	color: $color-pri;
// 	font-weight: $fw-semi-bold;
// }
</style>