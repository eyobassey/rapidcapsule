<template>
	<div style="width: 100%">
		<upcoming-appointments v-if="$route.query.appointment_status === 'upcoming'" />
		<history-appointments v-if="$route.query.appointment_status === 'history'" />
	</div>
</template>

<script setup>
import UpcomingAppointments from "./UpcomingAppointments";
import HistoryAppointments from "./HistoryAppointments";
</script>

<style scoped lang="scss">
</style>
