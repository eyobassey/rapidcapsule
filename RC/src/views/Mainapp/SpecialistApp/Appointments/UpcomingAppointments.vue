<template>
	<div class="page-content">
		<top-bar type="title-only" title="Appointments / Details" @open-side-nav="$emit('openSideNav')" />

		<loader v-if="isLoading" :useOverlay="false" />
		<div v-else class="page-content__body">
			<div class="appointment-details-container">
				<div class="appointment-details-sectionTop">
					<div class="appointment-details-info">
						<div class="appointment-patient-details">
							<p class="appointment-patient-details__heading">Patient Details</p>
							<div class="appointment-patient-details__body">
								<span><rc-avatar first-name="First" last-name="Last" size="md" /></span>
								<div class="appointment-patient-info">
									<p class="appointment-patient-info__name">{{ patientInfo.fullName }}</p>
									<div class="appointment-patient-info__healthinfo">
										<div class="appointment-patient__healthinfo">
											<p class="appointment-patient__healthinfo--key">Gender:</p>
											<p class="appointment-patient__healthinfo--value">{{ patientInfo.gender }}</p>
										</div>
										<div class="appointment-patient__healthinfo">
											<p class="appointment-patient__healthinfo--key">Age:</p>
											<p class="appointment-patient__healthinfo--value">{{ patientInfo.age }} Yrs</p>
										</div>
										<div class="appointment-patient__healthinfo">
											<p class="appointment-patient__healthinfo--key">Weight:</p>
											<p class="appointment-patient__healthinfo--value">
												{{ patientInfo.weight.value }} {{ patientInfo.weight.unit }}
											</p>
										</div>
										<div class="appointment-patient__healthinfo">
											<p class="appointment-patient__healthinfo--key">Height:</p>
											<p class="appointment-patient__healthinfo--value">
												{{ patientInfo.height.value }} {{ patientInfo.height.unit }}
											</p>
										</div>
									</div>
									<p @click="isOpenMedicalRecords = true" class="appointment-patient__healthinfo--actions">
										See medical record
									</p>
								</div>
							</div>
						</div>
					</div>
					<div class="appointment-details">
						<p class="appointment-details__heading">Appointment Details</p>
						<div class="appointment-details-body">
							<div class="appointment-details__item">
								<p class="appointment-details__item--key">Preferred Language:</p>
								<p class="appointment-details__item--item">{{ preferences.language }}</p>
							</div>
							<div class="appointment-details__item">
								<p class="appointment-details__item--key">Time:</p>
								<p class="appointment-details__item--value">
									{{ format(new Date(appointmentInfo.start_time), 'HH:mm') }}
									({{ format(new Date(appointmentInfo.start_time), 'hh:mm a') }})
									{{ preferences.timezone }}
								</p>
							</div>
							<div class="appointment-details__item">
								<p class="appointment-details__item--key">Date:</p>
								<p class="appointment-details__item--value">
									{{ format(new Date(appointmentInfo.start_time), 'MMMM dd, yyyy') }}
								</p>
							</div>
						</div>
					</div>
				</div>

				<div class="appointment-actions">
					<rc-button
						type="secondary"
						label="Reschedule"
						class="reschedule_action"
						@click="rescheduleAppointmentRef.onOpen(appointmentInfo);"
					/>
					<rc-button
						type="primary"
						label="Start Meeting"
						class="start_meeting_action"
					/>
				</div>
			</div>

			<div v-if="isOpenMedicalRecords" class="medical-records-modal large-screens-only">
				<div class="medical-records-header">
					<p class="medical-records-header__heading">Medical Records</p>
					<icon-button @click="isOpenMedicalRecords = false" icon="icon-close" size="md" :sx="{ stroke: '#DB1818' }" />
				</div>
				<div class="medical-records-body">
					<rc-tab
						wrapper-class="medical-records-tabs-wrapper"
						tab-class="medical-records-tab"
						:currentTab="currentTab"
						@onClick="currentTab = $event"
						:tabs="[
							{ title: 'General', value: 'general' },
							{ title: 'Self Diagnosis Report', value: 'diagnosis' },
							{ title: 'Medical History', value: 'history' },
						]"
					/>

					<template v-if="currentTab === 'general'">
						<div class="medical-records-general">
							<div class="medical-records-general__health-info">
								<div class="medical-records-general__cards">
									<p class="medical-records-general__cards--title">Pulse Rate</p>
									<p v-if="patientVitals.pulse_rate" class="medical-records-general__cards--content">
										{{ patientVitals.pulse_rate[0].value }} {{ patientVitals.pulse_rate[0].unit }}
									</p>
									<p v-else class="medical-records-general__cards--content">-</p>
								</div>
								<div class="medical-records-general__cards">
									<p class="medical-records-general__cards--title">Blood Pressure</p>
									<p v-if="patientVitals.blood_pressure" class="medical-records-general__cards--content">
										{{ patientVitals.blood_pressure[0].value }} {{ patientVitals.blood_pressure[0].unit }}
									</p>
									<p v-else class="medical-records-general__cards--content">-</p>
								</div>
								<div class="medical-records-general__cards">
									<p class="medical-records-general__cards--title">Blood Sugar Level</p>
									<p v-if="patientVitals.blood_sugar_level" class="medical-records-general__cards--content">
										{{ patientVitals.blood_sugar_level[0].value }} {{ patientVitals.blood_sugar_level[0].unit }}
									</p>
									<p v-else class="medical-records-general__cards--content">-</p>
								</div>
								<div class="medical-records-general__cards">
									<p class="medical-records-general__cards--title">Temperature</p>
									<p v-if="patientVitals.body_temp" class="medical-records-general__cards--content">
										{{ patientVitals.body_temp[0].value }} {{ patientVitals.body_temp[0].unit }}
									</p>
									<p v-else class="medical-records-general__cards--content">-</p>
								</div>
							</div>
							<div class="medical-records-general__risk-factors">
								<p class="medical-records-risk-factors__header">Risk Factors</p>
								<div class="medical-records-risk-factors__content">
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">BMI</p>
										<p class="medical-records-general__cards--content">
											- <small>({{ patientInfo.weightStatus }})</small>
										</p>
									</div>
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">High Cholesterol</p>
										<p class="medical-records-general__cards--content">-</p>
									</div>
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">Smokes?</p>
										<p class="medical-records-general__cards--content">{{ patientInfo.isSmoker }}</p>
									</div>
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">Diabetic?</p>
										<p class="medical-records-general__cards--content">-</p>
									</div>
								</div>
							</div>
						</div>
					</template>
					<template v-if="currentTab === 'diagnosis'">
						<div v-if="hasDiagnosis" class="medical-records-diagnosis">
							<rc-tab
								:is-underlined="false"
								wrapper-class="diagnosis-tabs-wrapper"
								tab-class="diagnosis-tab"
								line-class="diagnosis-line-class"
								tab-active-class="diagnosis-tab-active"
								:currentTab="diagnosisTab"
								@onClick="diagnosisTab = $event"
								:tabs="[
									{ title: 'Result', value: 'result' },
									{ title: 'Summary', value: 'summary' },
								]"
							/>
							<template v-if="diagnosisTab === 'result'">
								<div class="diagnosis-result">
									<div class="diagnosis-result__header">
										<h3 class="diagnosis-result__header--heading">Possible Conditions</h3>
										<p class="diagnosis-result__header--description">
											Please not that the list below is a collection of possible 
											conditions arranged according to level of severity based on 
											the answers the patient provided. This list is provided solely 
											for informational purposes and is not a qualified medical opinion.
										</p>
									</div>
									<div class="diagnosis-result__conditions">
										<div class="diagnosis-result__conditions--major">
											<template v-for="condition in moreLikelyConditions" :key="JSON.stringify(condition)">
												<div class="diagnosis-conditions-card">
													<div class="diagnosis-conditions-card__content">
														<p class="diagnosis-conditions-card__title">{{ condition.common_name }}</p>
														<p  v-if="condition.category === 0" class="diagnosis-conditions-card__desc">Strong evidence</p>
														<p  v-if="condition.category === 1" class="diagnosis-conditions-card__desc">Strong evidence</p>
														<p  v-if="condition.category === 2" class="diagnosis-conditions-card__desc">Strong evidence</p>
													</div>
													<div>
														<div  v-if="condition.category === 0" class="dignosis-conditions-card__evidence-strong"></div>
														<div  v-if="condition.category === 1" class="dignosis-conditions-card__evidence-moderate"></div>
														<div  v-if="condition.category === 2" class="dignosis-conditions-card__evidence-weak"></div>
													</div>
												</div>
											</template>
										</div>
										<template v-if="lessLikelyConditions.length">
											<rc-accordion :items="lessLikelyConditions" class="diagnosis-conditions-accordion">
												<template v-slot:header>Show less likely conditions</template>
												<template v-slot:content="{ item }">
													<div class="diagnosis-conditions-card">
														<div class="diagnosis-conditions-card__content">
															<p class="diagnosis-conditions-card__title">{{ item.name }}</p>
															<p v-if="item.category === 0" class="diagnosis-conditions-card__desc">Strong evidence</p>
															<p v-if="item.category === 1" class="diagnosis-conditions-card__desc">Strong evidence</p>
															<p v-if="item.category === 2" class="diagnosis-conditions-card__desc">Strong evidence</p>
														</div>
														<div>
															<div  v-if="item.category === 0" class="dignosis-conditions-card__evidence-strong"></div>
															<div  v-if="item.category === 1" class="dignosis-conditions-card__evidence-moderate"></div>
															<div  v-if="item.category === 2" class="dignosis-conditions-card__evidence-weak"></div>
														</div>
													</div>
												</template>
											</rc-accordion>
										</template>
									</div>
								</div>
							</template>
							<template v-if="diagnosisTab === 'summary'">
								<div class="diagnosis-summary">
									<div class="diagnosis-summary__item">
										<p class="diagnosis-summary__item--key">Considered diagnoses</p>
										<p class="diagnosis-summary__item--value">{{ consideredDiagnosis.length }}+</p>
									</div>
									<div class="diagnosis-summary__item">
										<p class="diagnosis-summary__item--key">Interview duration</p>
										<p class="diagnosis-summary__item--value">0</p>
									</div>
								</div>
							</template>
						</div>
						<div v-else class="medical-records-diagnosis__empty">
							<h3 class="medical-records-diagnosis__empty--title">No report found</h3>
							<p class="medical-records-diagnosis__empty--desc">
								A self diagnosis test wasn’t taken before this appointment was booked.
							</p>
						</div>
					</template>
					<template v-if="currentTab === 'history'">
						<div class="medical-records-history">
							<template v-for="history in patientInfo.medicalHistory" :key="history._id">
								<div class="medical-records-history__item">
									<p class="medical-records-history__item--title">{{ history.name }}</p>
									<p class="medical-records-history__item--content">
										Diagnosed: {{ format(new Date(history.start_date), 'dd/MM/yyyy')  }}
									</p>
									<p class="medical-records-history__item--content">
										Treatment Status: {{ history.is_condition_exists ? 'Active': 'Inactive' }}
									</p>
								</div>
							</template>
						</div>
					</template>
				</div>
			</div>

			<rc-modal
				v-if="isOpenMedicalRecords"
				title="Medical Records"
				@closeModal="isOpenMedicalRecords = false"
				:has-footer="false"
				class="regular-screens-only"
			>
				<template v-slot:body>
					<div class="medical-records-body modal-container">
						<rc-tab
							wrapper-class="medical-records-tabs-wrapper"
							tab-class="medical-records-tab"
							:currentTab="currentTab"
							@onClick="currentTab = $event"
							:tabs="[
								{ title: 'General', value: 'general' },
								{ title: 'Self Diagnosis Report', value: 'diagnosis' },
								{ title: 'Medical History', value: 'history' },
							]"
						/>

						<template v-if="currentTab === 'general'">
							<div class="medical-records-general">
								<div class="medical-records-general__health-info">
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">Pulse Rate</p>
										<p v-if="patientVitals.pulse_rate" class="medical-records-general__cards--content">
											{{ patientVitals.pulse_rate[0].value }} {{  patientVitals.pulse_rate[0].unit }}
										</p>
										<p v-else class="medical-records-general__cards--content">-</p>
									</div>
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">Blood Pressure</p>
										<p v-if="patientVitals.blood_pressure" class="medical-records-general__cards--content">
											{{ patientVitals.blood_pressure[0].value }} {{  patientVitals.blood_pressure[0].unit }}
										</p>
										<p v-else class="medical-records-general__cards--content">-</p>
									</div>
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">Blood Sugar Level</p>
										<p v-if="patientVitals.blood_sugar_level" class="medical-records-general__cards--content">
											{{ patientVitals.blood_sugar_level[0].value }} {{  patientVitals.blood_sugar_level[0].unit }}
										</p>
										<p v-else class="medical-records-general__cards--content">-</p>
									</div>
									<div class="medical-records-general__cards">
										<p class="medical-records-general__cards--title">Temperature</p>
										<p v-if="patientVitals.body_temp" class="medical-records-general__cards--content">
											{{ patientVitals.body_temp[0].value }} {{  patientVitals.body_temp[0].unit }}
										</p>
										<p v-else class="medical-records-general__cards--content">-</p>
									</div>
								</div>
								<div class="medical-records-general__risk-factors">
									<p class="medical-records-risk-factors__header">Risk Factors</p>
									<div class="medical-records-risk-factors__content">
										<div class="medical-records-general__cards">
											<p class="medical-records-general__cards--title">BMI</p>
											<p class="medical-records-general__cards--content">
												- <small>({{ patientInfo.weightStatus }})</small>
											</p>
										</div>
										<div class="medical-records-general__cards">
											<p class="medical-records-general__cards--title">High Cholesterol</p>
											<p class="medical-records-general__cards--content">-</p>
										</div>
										<div class="medical-records-general__cards">
											<p class="medical-records-general__cards--title">Smokes?</p>
											<p class="medical-records-general__cards--content">{{ patientInfo.isSmoker }}</p>
										</div>
										<div class="medical-records-general__cards">
											<p class="medical-records-general__cards--title">Diabetic?</p>
											<p class="medical-records-general__cards--content">-</p>
										</div>
									</div>
								</div>
							</div>
						</template>
						<template v-if="currentTab === 'diagnosis'">
							<div v-if="hasDiagnosis" class="medical-records-diagnosis">
								<rc-tab
									:is-underlined="false"
									wrapper-class="diagnosis-tabs-wrapper"
									tab-class="diagnosis-tab"
									line-class="diagnosis-line-class"
									tab-active-class="diagnosis-tab-active"
									:currentTab="diagnosisTab"
									@onClick="diagnosisTab = $event"
									:tabs="[
										{ title: 'Result', value: 'result' },
										{ title: 'Summary', value: 'summary' },
									]"
								/>
								<template v-if="diagnosisTab === 'result'">
									<div class="diagnosis-result">
										<div class="diagnosis-result__header">
											<h3 class="diagnosis-result__header--heading">Possible Conditions</h3>
											<p class="diagnosis-result__header--description">
												Please not that the list below is a collection of possible 
												conditions arranged according to level of severity based on 
												the answers the patient provided. This list is provided solely 
												for informational purposes and is not a qualified medical opinion.
											</p>
										</div>
										<div class="diagnosis-result__conditions">
											<div class="diagnosis-result__conditions--major">
												<template v-for="condition in moreLikelyConditions" :key="JSON.stringify(condition)">
													<div class="diagnosis-conditions-card">
														<div class="diagnosis-conditions-card__content">
															<p class="diagnosis-conditions-card__title">{{ condition.common_name }}</p>
															<p  v-if="condition.category === 0" class="diagnosis-conditions-card__desc">Strong evidence</p>
															<p  v-if="condition.category === 1" class="diagnosis-conditions-card__desc">Strong evidence</p>
															<p  v-if="condition.category === 2" class="diagnosis-conditions-card__desc">Strong evidence</p>
														</div>
														<div>
															<div  v-if="condition.category === 0" class="dignosis-conditions-card__evidence-strong"></div>
															<div  v-if="condition.category === 1" class="dignosis-conditions-card__evidence-moderate"></div>
															<div  v-if="condition.category === 2" class="dignosis-conditions-card__evidence-weak"></div>
														</div>
													</div>
												</template>
											</div>
											<template v-if="lessLikelyConditions.length">
												<rc-accordion :items="lessLikelyConditions" class="diagnosis-conditions-accordion">
													<template v-slot:header>Show less likely conditions</template>
													<template v-slot:content="{ item }">
														<div class="diagnosis-conditions-card">
															<div class="diagnosis-conditions-card__content">
																<p class="diagnosis-conditions-card__title">{{ item.name }}</p>
																<p v-if="item.category === 0" class="diagnosis-conditions-card__desc">Strong evidence</p>
																<p v-if="item.category === 1" class="diagnosis-conditions-card__desc">Strong evidence</p>
																<p v-if="item.category === 2" class="diagnosis-conditions-card__desc">Strong evidence</p>
															</div>
															<div>
																<div  v-if="item.category === 0" class="dignosis-conditions-card__evidence-strong"></div>
																<div  v-if="item.category === 1" class="dignosis-conditions-card__evidence-moderate"></div>
																<div  v-if="item.category === 2" class="dignosis-conditions-card__evidence-weak"></div>
															</div>
														</div>
													</template>
												</rc-accordion>
											</template>
										</div>
									</div>
								</template>
								<template v-if="diagnosisTab === 'summary'">
									<div class="diagnosis-summary">
										<div class="diagnosis-summary__item">
											<p class="diagnosis-summary__item--key">Considered diagnoses</p>
											<p class="diagnosis-summary__item--value">{{ consideredDiagnosis.length }}+</p>
										</div>
										<div class="diagnosis-summary__item">
											<p class="diagnosis-summary__item--key">Interview duration</p>
											<p class="diagnosis-summary__item--value">0</p>
										</div>
									</div>
								</template>
							</div>
							<div v-else class="medical-records-diagnosis__empty">
								<h3 class="medical-records-diagnosis__empty--title">No report found</h3>
								<p class="medical-records-diagnosis__empty--desc">A self diagnosis test wasn’t taken before this appointment was booked.</p>
							</div>
						</template>
						<template v-if="currentTab === 'history'">
							<div v-if="patientInfo.medicalHistory?.length" class="medical-records-history">
								<template v-for="history in patientInfo.medicalHistory" :key="history._id">
									<div class="medical-records-history__item">
										<p class="medical-records-history__item--title">{{ history.name }}</p>
										<p class="medical-records-history__item--content">Diagnosed: {{ format(new Date(history.start_date), 'dd/MM/yyyy')  }}</p>
										<p class="medical-records-history__item--content">Treatment Status: {{ history.is_condition_exists ? 'Active': 'Inactive' }}</p>
									</div>
								</template>
							</div>
							<div v-else class="medical-records-diagnosis__empty">
								<h3 class="medical-records-diagnosis__empty--title">No record found</h3>
								<p class="medical-records-diagnosis__empty--desc">A medical record wasn’t taken before this appointment was booked.</p>
							</div>
						</template>
					</div>
				</template>
			</rc-modal>

			<reschedule-appointment ref="rescheduleAppointmentRef" />
		</div>
	</div>
</template>

<script setup>
import { format } from "date-fns";
import { useRoute } from 'vue-router';
import { ref, inject, onMounted } from 'vue';
import TopBar from "@/components/Navigation/top-bar";
import RcAvatar from "@/components/RCAvatar";
import IconButton from "@/components/RCIconButton";
import RcTab from "@/components/RCTab";
import RcAccordion from "@/components/RCAccordion";
import RcButton from "@/components/buttons/button-primary";
import RcModal from "@/components/modals/dialog-modal";
import Loader from "@/components/Loader/main-loader";
import RescheduleAppointment from "./RescheduleAppointment";
import { calculateAge } from "@/utilities/utilityFunctions";

const route = useRoute();
const $http = inject('$_HTTP');
defineEmits(["openSideNav"]);

const currentTab = ref("general");
const diagnosisTab = ref("result");
const appointmentInfo = ref({});
const patientInfo = ref({});
const patientVitals = ref({});
const preferences = ref({});
const isLoading = ref(true);
const isOpenMedicalRecords = ref(false);
const rescheduleAppointmentRef = ref();

const sortedConditions = ref([]);
const moreLikelyConditions = ref([]);
const lessLikelyConditions = ref([]);
const conditions = ref([]);
const consideredDiagnosis = ref([]);
const hasDiagnosis = ref(false);

onMounted(async () => {
	isLoading.value = true;
	await getOneAppointment(route.params.id);
	isLoading.value = false;
});

async function getOneAppointment (appointmentId) {
	await $http.$_getOnetAppointments(appointmentId).then(async ({ data }) => {
		appointmentInfo.value = data.data;
		await getOneUserInfo(data.data.patient);
		await getTimeAvailability(data.data.patient);
		getUserVitals(data.data.patient);
		getHealthCheckupResult(data.data.patient);
	})
}

async function getOneUserInfo (userId) {
	await $http.$_getOneUser(userId).then(({ data }) => {
		patientInfo.value = {
			...data.data,
			fullName: data.data.full_name,
			gender: data.data.profile.gender,
			weight: data.data.profile.basic_health_info.weight,
			height: data.data.profile.basic_health_info.height,
			age: calculateAge(data.data.profile.date_of_birth),
			isSmoker: data.data.profile.health_risk_factors.is_smoker,
			weightStatus: data.data.profile.health_risk_factors.weight_status,
			medicalHistory: data.data.pre_existing_conditions
		};
	})
}

async function getTimeAvailability() {
	await $http.$_getSpecialistAvailability().then(({ data }) => {
		preferences.value = data.data.preferences;
	});
}

const getUserVitals = async (patientId) => {
	await $http.$_getOneUserVitals(patientId).then(({ data }) => {
		patientVitals.value = data.data;
	});
}

const getHealthCheckupResult = async (patientId) => {
	await $http.$_getHealthCheckupResult(patientId).then(({ data }) => {
        if (Array.isArray(data.data) && data.data.length) {
			hasDiagnosis.value = !!(data.data.length);
            consideredDiagnosis.value = data.data[data.data.length - 1]['request']['evidence'];
            conditions.value  = data.data[data.data.length - 1]['response']['data']['conditions'];
            const sorted = conditions.value?.sort((a, b) => b.probability - a.probability);
            sortedConditions.value = sorted.map((condition, i) => ({
            ...condition, category: Math.floor(i / (sorted.length / 3))
            })).forEach((condition) => {
                if (condition.category <= 1) moreLikelyConditions.value.push(condition)
                else if (condition.category > 1) lessLikelyConditions.value.push(condition)
            });
        }
    });
}

</script>

<style scoped lang="scss">
.page-content {
	display: flex;
	flex-direction: column;
	gap: $size-12;
	width: 100%;
	height: 100vh;
	padding: 0 256px;

	@include responsive(tab-portrait) {
		padding: $size-0;
	}

	@include responsive(phone) {
		padding: $size-0;
	}

	&__body {
		display: flex;
		justify-content: space-between;
		gap: $size-48;
		width: 100%;
		padding: $size-32 $size-48;

		@include responsive(phone) {
			padding: $size-0 $size-24;
			height: 100%;
		}

		&::-webkit-scrollbar {
			display: none;
			width: 12px;
			background-color: $color-g-97;
		}
	}
}

@include responsive(large-screen) {
	.large-screens-only {
		display: flex !important;
	}
	.regular-screens-only {
		display: none !important;
	}
}
@include responsive(small-laptop) {
	.large-screens-only {
		display: none !important;
	}
	.regular-screens-only {
		display: flex !important;
	}
}

.appointment-details-container {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
	gap: $size-40;

	@include responsive(phone) {
		margin-bottom: $size-24;
	}
	
	.appointment-details-sectionTop {
		width: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		gap: $size-40;

		@include responsive(phone) {
			height: 100%;
		}
	}
}

.appointment-details-info {
	width: 100%;

	.appointment-patient-details {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		gap: $size-32;

		.appointment-patient-details__heading {
			font-size: $size-12;
			color: $color-g-21;
			border-bottom: 1px solid $color-g-90;
			padding-bottom: $size-8;
			width: 100%;
		}
		.appointment-patient-details__body {
			width: 100%;
			display: flex;
			justify-content: flex-start;
			align-items: center;
			gap: $size-24;

			.appointment-patient-info {
				width: 100%;
				display: flex;
				flex-direction: column;
				justify-content: flex-start;
				align-items: flex-start;
				gap: $size-8;
				position: relative;

				.appointment-patient-info__name {
					font-size: $size-20;
					font-weight: $fw-semi-bold;
					color: $color-black;
					text-transform: capitalize;
				}
				.appointment-patient-info__healthinfo {
					width: 100%;
					display: grid;
					grid-template-columns: repeat(2, 1fr);
					gap: $size-4;

					.appointment-patient__healthinfo {
						display: flex;
						justify-content: flex-start;
						align-items: center;
						gap: $size-8;

						.appointment-patient__healthinfo--key {
							font-size: $size-14;
							font-weight: $fw-regular;
							color: $color-g-44;
						}
						.appointment-patient__healthinfo--value {
							font-size: $size-14;
							font-weight: 500;
							color: $color-g-21;
						}
					}
				}
				.appointment-patient__healthinfo--actions {
					font-size: $size-14;
					color: $color-pri-main;
					font-weight: $fw-regular;
					position: absolute;
					top: 80px;

					&:hover {
						text-decoration: underline;
						cursor: pointer;
					}
				}
			}
		}
	}
}

.appointment-details {
	width: 100%;
	margin-top: 32px;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
	gap: $size-16;

	.appointment-details__heading {
		font-size: $size-12;
		color: $color-g-21;
		border-bottom: 1px solid $color-g-90;
		padding-bottom: $size-8;
		width: 100%;
	}
	.appointment-details-body {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		gap: $size-8;

		.appointment-details__item {
			display: flex;
			justify-content: flex-start;
			align-items: center;
			gap: $size-8;

			.appointment-details__item--key {
				font-size: $size-14;
				font-weight: $fw-regular;
				color: $color-g-44;
			}
			.appointment-details__item--value {
				font-size: $size-14;
				font-weight: 500;
				color: $color-g-21;
			}
		}
	}
}
.appointment-actions {
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;

	@include responsive(phone) {
		flex-direction: column-reverse;
		gap: $size-16;
		& button { width: 100%; }
	}
}

.medical-records-modal {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: $size-32;
	background: $color-white;
	padding: $size-24;
	border-radius: $size-16;
	border: 1px solid #FEF0EC;
	box-shadow: 4px 4px 24px 0px rgba(0, 0, 0, 0.15), 8px 16px 16px 0px rgba(0, 0, 0, 0.10);
	width: 100%;
}
.medical-records-header {
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;

	.medical-records-header__heading {
		color: $color-black;
		font-size: $size-18;
		font-weight: $fw-medium;
	}
}
.modal-container {
	max-width: 500px !important;
	min-height: 430px !important;
	max-height: 430px !important;

	@include responsive(phone) {
		width: 100% !important;
		// min-height: 410px !important;
	}
}
.medical-records-body {

	.medical-records-tabs-wrapper {
		white-space: nowrap !important;

		@include responsive(phone) {
			overflow-x: scroll;
			@include scrollBar(normal);
		}
	}
	.medical-records-tab {
		font-size: $size-14;
		color: $color-black;
	}
	.medical-records-general {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-start;
		padding: $size-32 $size-0;
		gap: $size-16;

		.medical-records-general__cards {
			display: flex;
			flex-direction: column;
			justify-content: space-between;
			align-items: flex-start;
			gap: $size-16;
			background: $color-g-97;
			padding: $size-16;
			border-radius: $size-8;

			.medical-records-general__cards--title {
				font-size: $size-12;
				color: $color-g-44;
				font-weight: $fw-regular;
			}
			.medical-records-general__cards--content {
				font-size: $size-18;
				color: $color-g-21;
				font-weight: $fw-medium;
			}
		}
		.medical-records-general__health-info {
			width: 100%;
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			gap: $size-12;
		}
		.medical-records-general__risk-factors {
			width: 100%;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
			gap: $size-16;

			.medical-records-risk-factors__header {
				width: 100%;
				font-size: $size-12;
				font-weight: $fw-regular;
				color: $color-g-21;
				border-bottom: 1px solid $color-g-90;
				padding-bottom: $size-8;
			}
			.medical-records-risk-factors__content {
				width: 100%;
				display: grid;
				grid-template-columns: repeat(2, 1fr);
				gap: $size-12;
			}
		}
	}
	.medical-records-diagnosis {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		padding: $size-32 $size-0;
		gap: $size-32;

		.diagnosis-tabs-wrapper {
			border-bottom: 0;
			width: 100%;

			&:hover, &:active, &:focus {
				border-bottom: 0 !important;
			}
		}
		:deep(.diagnosis-line-class) {
			display: none !important;

			&:hover, &:active, &:focus {
				display: none !important;
			}
		}
		:deep(.diagnosis-tab) {
			padding: $size-8 $size-20;
			border-radius: $size-10;
			color: $color-g-44;
			font-size: $size-16;
			font-weight: $fw-semi-bold;
			background: $color-g-92;
		}
		:deep(.diagnosis-tab-active) {
			border-bottom: 0 !important;
			&:hover { border-bottom: 0 !important; }
			&:focus { border-bottom: 0 !important; }
			&:active { border-bottom: 0 !important; }

			background: $color-sec-s2;
			padding: $size-8 $size-20;
			border-radius: $size-10;
			color: $color-white;
			font-size: $size-16;
			font-weight: $fw-semi-bold;
		}
		:deep(.default-tabs__item) {
			border-bottom: 0 !important;
			&:hover { border-bottom: 0 !important; }
			&:focus { border-bottom: 0 !important; }
			&:active { border-bottom: 0 !important; }
		}
		.diagnosis-result {
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
			gap: $size-32;

			.diagnosis-result__header {
				display: flex;
				flex-direction: column;
				justify-content: flex-start;
				align-items: flex-start;
				gap: $size-8;

				.diagnosis-result__header--heading {
					font-size: $size-16;
					color: $color-g-21;
					font-weight: $fw-semi-bold;
				}
				.diagnosis-result__header--description {
					font-size: $size-14;
					color: $color-g-54;
					font-weight: $fw-regular;
				}
			}
			.diagnosis-result__conditions {
				width: 100%;
				display: flex;
				flex-direction: column;
				justify-content: flex-start;
				align-items: flex-start;
				gap: $size-32;

				.diagnosis-result__conditions--major {
					width: 100%;
					display: flex;
					flex-direction: column;
					justify-content: flex-start;
					align-items: flex-start;
					gap: $size-16;
				}
				.diagnosis-conditions-card {
					width: 100%;
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: $size-16;
					border: 1px solid $color-pri-t5;
					border-radius: $size-12;

					.diagnosis-conditions-card__content {
						display: flex;
						flex-direction: column;
						justify-content: space-between;
						align-items: flex-start;
						gap: $size-4;

						.diagnosis-conditions-card__title {
							font-size: $size-14;
							font-weight: $fw-semi-bold;
							color: $color-black;
						}
						.diagnosis-conditions-card__desc {
							font-size: $size-12;
							font-weight: $fw-regular;
							color: $color-g-44;
						}
					}
					.dignosis-conditions-card__evidence-strong {
						width: 12px;
						height: 12px;
						border-radius: $size-12;
						background: #FB5A00;
					}
					.dignosis-conditions-card__evidence-moderate {
						width: 12px;
						height: 12px;
						border-radius: $size-12;
						background: #FBB500;
					}
					.dignosis-conditions-card__evidence-weak {
						width: 12px;
						height: 12px;
						border-radius: $size-12;
						background: #8A8A8A;
					}
				}
				.diagnosis-conditions-accordion {
					:deep(.accordion-item) {
						border: 0;
						.accordion-header {
							color: $color-sec-s2;
							fill: $color-sec-s2;
							stroke: $color-sec-s2;
						}
					}
					
				}
			}
		}
		.diagnosis-summary {
			width: 100%;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
			gap: $size-16;

			.diagnosis-summary__item {
				width: 100%;
				display: flex;
				justify-content: space-between;
				align-items: center;

				.diagnosis-summary__item--key {
					color: $color-g-21;
					font-size: $size-14;
					font-weight: $fw-regular;
				}
				.diagnosis-summary__item--value {
					color: $color-g-21;
					font-size: $size-14;
					font-weight: $fw-medium;
				}
			}
		}
	}
	.medical-records-diagnosis__empty {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: $size-16;
		padding: $size-60;

		.medical-records-diagnosis__empty--title {
			font-size: $size-16;
			font-weight: $fw-medium;
			color: $color-black;
			text-align: center;
		}
		.medical-records-diagnosis__empty--desc {
			font-size: $size-14;
			font-weight: $fw-regular;
			color: $color-g-44;
			text-align: center;
		}

	}
	.medical-records-history {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-start;
		padding: $size-32 $size-0;
		gap: $size-16;

		.medical-records-history__item {
			width: 100%;
			display: flex;
			flex-direction: column;
			justify-content: flex-start;
			align-items: flex-start;
			gap: $size-8;
			border: 1px solid $color-pri-t5;
			border-radius: $size-8;
			padding: $size-10 $size-16;

			.medical-records-history__item--title {
				font-size: $size-14;
				color: $color-black;
				font-weight: $fw-semi-bold;
			}
			.medical-records-history__item--content {
				font-size: $size-12;
				font-weight: $fw-regular;
				color: $color-g-44;
			}
		}
	}
}
</style>
