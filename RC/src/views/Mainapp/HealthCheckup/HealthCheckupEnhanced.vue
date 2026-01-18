<template>
	<div class="page-content">
		<Loader v-if="isFetching || isLoading" :useOverlay="true" style="z-index:1" />
		<TopBar type="title-only" title="Enhanced Health Checkup" @open-side-nav="$emit('openSideNav')" />
		<div class="page-content__body">
			<checkup-entry v-if="navigator.current === 0" />
			<gender-selector v-if="navigator.current === 1" />
			<age-selector v-if="navigator.current === 2" />
			<confirm-info :userInfo="patientInfo" v-if="navigator.current === 3" />
			<risk-factors v-if="navigator.current === 4" />
			<observations v-if="navigator.current === 5" />
			<select-region v-if="navigator.current === 6" />
			<symptoms-enhanced v-if="navigator.current === 7" />
			<diagnosis-evaluator-enhanced v-if="navigator.current === 8" />
			<diagnosis-report-enhanced v-if="navigator.current === 9" />
			<checkup-history v-if="navigator.current === 10" />
		</div>
	</div>
</template>

<script setup>
import { ref, watch, inject, provide } from "vue";
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader.vue";
import { mapGetters } from "@/utilities/utilityStore";

import CheckupEntry from "./parts/entry";
import GenderSelector from "./parts/gender";
import AgeSelector from "./parts/age";
import FreeTextInput from "./parts/free-text";
import RiskFactors from "./parts/risk-factors";
import ConfirmInfo from "./parts/confirm-info";
import Observations from "./parts/observations";
import SelectRegion from "./parts/select-region";
import SymptomsEnhanced from "./parts/symptoms-enhanced";
import DiagnosisEvaluatorEnhanced from "./parts/diagnosis-evaluator-enhanced";
import DiagnosisReportEnhanced from "./parts/diagnosis-report-enhanced";
import CheckupHistory from "./parts/checkup-history";

const $http = inject("$http");
const { userprofile } = mapGetters();
const profile = {...(userprofile.value?.profile || {})};
const dependants = {...(userprofile.value?.dependants || {})};

const isFetching = ref(false);
const patientInfo = ref({});
const diagnosis = ref({});
const recommendation = ref({});
const navigator = ref({ from: null, to: null, current: 0 });

// Enhanced checkup specific data
const assessmentType = ref('comprehensive'); // 'quick' or 'comprehensive'
const symptomDurations = ref({});
const qualityScore = ref(0);

const checkupId = ref("");
const sex = ref(profile?.gender || "");
const age = ref(profile?.date_of_birth ? new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear() : null);
const dependantInfo = ref({});

// Enhanced diagnosis state
const enhancedDiagnosis = ref({});
const durationAnalysis = ref({});

const isLoading = ref(false);

// Utility functions to update state (matching original pattern)
const usePatientInfo = (payload) => (patientInfo.value = {...patientInfo.value, ...payload});
const useDiagnosis = (payload) => (diagnosis.value = {...diagnosis.value, ...payload});
const useRecommendation = (payload) => (recommendation.value = {...recommendation.value, ...payload});
const useNavigator = ({ current, from, to }) => (navigator.value = {current: to, from, to: null});

// Provide injections with the same keys as original
provide('$_PATIENT_INFO', { patientInfo, usePatientInfo });
provide('$_NAVIGATOR', { navigator, useNavigator });
provide('$_DIAGNOSIS', { diagnosis, useDiagnosis });
provide('$_RECOMMENDATION', { recommendation, useRecommendation });

// Legacy provides for backward compatibility
provide("checkupId", checkupId);
provide("sex", sex);
provide("age", age);
provide("diagnosis", diagnosis);
provide("enhancedDiagnosis", enhancedDiagnosis);
provide("durationAnalysis", durationAnalysis);
provide("recommendation", recommendation);
provide("navigator", navigator);
provide("patientInfo", patientInfo);
provide("dependantInfo", dependantInfo);
provide("isFetching", isFetching);
provide("isLoading", isLoading);

// Enhanced features
provide("assessmentType", assessmentType);
provide("symptomDurations", symptomDurations);
provide("qualityScore", qualityScore);


// Enhanced diagnosis functionality
const performEnhancedDiagnosis = async (symptomsWithDuration) => {
	try {
		isLoading.value = true;
		
		const payload = {
			patient_info: patientInfo.value,
			symptoms: symptomsWithDuration,
			extras: {
				enable_symptom_duration: true,
				triage_focused: assessmentType.value === 'quick',
				disable_groups: false
			}
		};
		
		const response = await $http.$_patientDiagnosisEnhanced(payload);
		
		if (response.data) {
			enhancedDiagnosis.value = response.data.diagnosis;
			durationAnalysis.value = response.data.duration_analysis;
			qualityScore.value = response.data.quality_score || 85;
			
			// Navigate to enhanced results
			goTo(9);
		}
	} catch (error) {
		console.error('Enhanced diagnosis error:', error);
		// Fallback to regular diagnosis
		await performRegularDiagnosis(symptomsWithDuration.map(s => ({ id: s.id, present: s.present })));
	} finally {
		isLoading.value = false;
	}
};

const performRegularDiagnosis = async (symptoms) => {
	try {
		isLoading.value = true;
		
		const payload = {
			patient_info: patientInfo.value,
			symptoms: symptoms
		};
		
		const response = await $http.$_patientDiagnosis(payload);
		
		if (response.data) {
			diagnosis.value = response.data.diagnosis;
			recommendation.value = response.data.recommendation;
			goTo(9);
		}
	} catch (error) {
		console.error('Regular diagnosis error:', error);
	} finally {
		isLoading.value = false;
	}
};

provide("performEnhancedDiagnosis", performEnhancedDiagnosis);
provide("performRegularDiagnosis", performRegularDiagnosis);

// Watch for assessment type changes
watch(assessmentType, (newType) => {
	console.log('Assessment type changed to:', newType);
});

// Initialize patient info
if (userprofile.value?.profile) {
	patientInfo.value = {
		age: age.value,
		sex: sex.value,
		profile: profile,
		assessmentType: 'enhanced' // Set assessment type for enhanced flow
	};
}
</script>

