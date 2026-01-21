<template>
	<div style="width: 100%">
		<upcoming-appointments v-if="isActiveAppointment" />
		<history-appointments v-else />
	</div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import UpcomingAppointments from "./UpcomingAppointments";
import HistoryAppointments from "./HistoryAppointments";

const route = useRoute();

// Active appointment statuses - show UpcomingAppointments component
const activeStatuses = ['upcoming', 'missed', 'open', 'scheduled', 'ongoing'];

const isActiveAppointment = computed(() => {
	const status = route.query.appointment_status?.toLowerCase();
	return activeStatuses.includes(status);
});
</script>

<style scoped lang="scss">
</style>
