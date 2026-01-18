<template>
	<div class="calendar">
		<date-picker
			:transparent="transparent"
			:borderless="borderless"
			:multiple="multiple"
			:expanded="expanded"
			v-model.sync="modelValue"
			:masks="{ weekdays: 'WWW' }"
			:min-date="minDate"
			:attributes="attributes"
			@click="onSelected"
		/>
	</div>
</template>

<script setup>
import { isArray, isString, isDate } from 'lodash';
import { ref, onMounted, computed } from 'vue';
import { DatePicker } from 'v-calendar';
import { RiNumbersFill } from 'oh-vue-icons/icons';
import { useEventListener } from '@vueuse/core';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
	modelValue: { type: Date, required: true, default: () => [] },
	label: { type: String, default: 'Date' },
	mode: { type: String, default: 'date' },
	transparent: { type: Boolean, default: false },
	borderless: { type: Boolean, default: false },
	multiple: { type: Boolean, default: true },
	expanded: { type: Boolean, default: false },
	minDate: { type: Date, default: null },
	maxDate: { type: Date, default: null },
	appointmentDates: { type: Object, default: () => ({}) }, // { 'dateString': count }
});

const modelValue = ref();
const selectedDates = ref([]);

const attributes = computed(() => {
	const attrs = [{ highlight: true, dates: selectedDates.value }];

	// Add dots for dates with appointments
	const appointmentAttrs = Object.entries(props.appointmentDates).map(([dateStr, appointments]) => {
		const count = Array.isArray(appointments) ? appointments.length : 0;

		return {
			key: dateStr,
			dot: {
				color: '#0066FF',
				class: 'appointment-dot'
			},
			popover: {
				label: `${count} appointment${count !== 1 ? 's' : ''}`,
			},
			dates: new Date(dateStr),
			customData: {
				count: count
			}
		};
	});

	return [...attrs, ...appointmentAttrs];
});

onMounted(() => {
	if (isDate(props.modelValue) || isString(props.modelValue)) {
		modelValue.value = new Date(props.modelValue);
	} else if (isArray(props.modelValue)) {
		selectedDates.value = props.modelValue.map(item => new Date(item))
	}
});

const onSelected = (event) => {
	if (event.shiftKey) {
		const dateToISO = modelValue.value?.toDateString();
		if (!selectedDates.value.includes(dateToISO)) {
			selectedDates.value.push(dateToISO);
			const filtered = selectedDates.value.filter(i => i);
			emit('update:modelValue', filtered);
		} else {
			const filtered = selectedDates.value.filter(i => i);
			emit('update:modelValue', filtered);
		}
	} else {
		selectedDates.value = [];
		emit('update:modelValue', modelValue.value?.toDateString());
	}
}

</script>

<style lang="scss" scoped>
.calendar {
	width: 100%;
}
.calendar :deep(.vc-container) {
	width: 100%;

	.vc-title {
		color: $color-black;
		font-weight: $fw-semi-bold;
		font-size: $size-24;
		background: transparent;
	}
	.vc-pane {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: $size-28;
	}
	.vc-arrow {
		background: transparent;
	}
    .vc-day-content {
        width: 40px !important;
        height: 40px !important;
        font-size: $size-12 !important;
    }
    .vc-weekday {
        font-size: $size-12 !important;
    }
    .vc-weekday-1, .vc-weekday-2 {
        color: $color-pri-main !important;
    }
    .weekday-1 .vc-day-content,
    .weekday-2 .vc-day-content {
        color: $color-pri-main;
    }

	.vc-highlights .vc-highlight {
		background: $color-sec-s2 !important;
        width: 40px !important;
        height: 40px !important;
        font-size: $size-12 !important;
	}
    .weekday-1 .vc-highlight-content-solid,
    .weekday-2 .vc-highlight-content-solid {
        color: $color-white;
        background: $color-pri-main;
    }

	// Appointment dots
	.vc-day {
		position: relative;
	}

	.vc-dots {
		display: flex !important;
		justify-content: center !important;
		align-items: center !important;
		margin-top: 2px !important;
	}

	.vc-dot {
		width: 5px !important;
		height: 5px !important;
		background-color: #0066FF !important;
		border-radius: 50% !important;
	}
}
</style>