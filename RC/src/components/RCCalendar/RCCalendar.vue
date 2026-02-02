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

// Status color mapping for appointments
const statusColors = {
	OPEN: '#0066FF',        // Blue - Upcoming
	ONGOING: '#FF9800',     // Orange - In progress
	COMPLETED: '#4CAF50',   // Green - Completed
	MISSED: '#F44336',      // Red - Missed
	NO_SHOW: '#F44336',     // Red - No show
	CANCELLED: '#9E9E9E',   // Grey - Cancelled
};

const getStatusLabel = (status) => {
	const labels = {
		OPEN: 'Upcoming',
		ONGOING: 'In Progress',
		COMPLETED: 'Completed',
		MISSED: 'Missed',
		NO_SHOW: 'No Show',
		CANCELLED: 'Cancelled',
	};
	return labels[status] || status;
};

const attributes = computed(() => {
	const attrs = [{ highlight: true, dates: selectedDates.value }];

	// Add dots for dates with appointments - color coded by status
	const appointmentAttrs = [];

	Object.entries(props.appointmentDates).forEach(([dateStr, appointments]) => {
		if (!Array.isArray(appointments) || appointments.length === 0) return;

		// Group appointments by status for this date
		const statusGroups = {};
		appointments.forEach(apt => {
			const status = apt.status || 'OPEN';
			if (!statusGroups[status]) {
				statusGroups[status] = [];
			}
			statusGroups[status].push(apt);
		});

		// Create a dot for each status present on this date
		const dots = Object.keys(statusGroups).map(status => ({
			color: statusColors[status] || '#0066FF',
			class: `appointment-dot status-${status.toLowerCase()}`
		}));

		// Build popover label with status breakdown
		const statusSummary = Object.entries(statusGroups)
			.map(([status, apts]) => `${apts.length} ${getStatusLabel(status)}`)
			.join(', ');

		appointmentAttrs.push({
			key: dateStr,
			dot: dots.length === 1 ? dots[0] : dots,
			popover: {
				label: statusSummary,
			},
			dates: new Date(dateStr),
			customData: {
				appointments: appointments,
				statusGroups: statusGroups
			}
		});
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
		gap: 2px !important;
	}

	.vc-dot {
		width: 5px !important;
		height: 5px !important;
		border-radius: 50% !important;
		// Allow v-calendar to set the background color dynamically
	}

	// Status-specific dot colors (fallback)
	.appointment-dot.status-open {
		background-color: #0066FF !important;
	}
	.appointment-dot.status-ongoing {
		background-color: #FF9800 !important;
	}
	.appointment-dot.status-completed {
		background-color: #4CAF50 !important;
	}
	.appointment-dot.status-missed,
	.appointment-dot.status-no_show {
		background-color: #F44336 !important;
	}
	.appointment-dot.status-cancelled {
		background-color: #9E9E9E !important;
	}
}
</style>