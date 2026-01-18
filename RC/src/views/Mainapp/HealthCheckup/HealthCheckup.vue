<template>
	<div class="page-content">
		<Loader v-if="isFetching || isLoading" :useOverlay="true" style="z-index:1" />
		<TopBar type="title-only" title="Health Checkup" @open-side-nav="$emit('openSideNav')" />
		<div class="page-content__body">
			<checkup-entry v-if="navigator.current === 0" />
			<gender-selector v-if="navigator.current === 1" />
			<age-selector v-if="navigator.current === 2" />
			<confirm-info :userInfo="patientInfo" v-if="navigator.current === 3" />
			<assessment-type v-if="navigator.current === 3.5" />
			<risk-factors v-if="navigator.current === 4" />
			<observations v-if="navigator.current === 5" />
			<select-region v-if="navigator.current === 6" />
			<symptoms v-if="navigator.current === 7" />
			<diagnosis-evaluator v-if="navigator.current === 8" />
			<diagnosis-report v-if="navigator.current === 9" />
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
import AssessmentType from "./parts/assessment-type";
import Observations from "./parts/observations";
import SelectRegion from "./parts/select-region";
import Symptoms from "./parts/symptoms";
import DiagnosisEvaluator from "./parts/diagnosis-evaluator";
import DiagnosisReport from "./parts/diagnosis-report";
import CheckupHistory from "./parts/checkup-history";

const $http = inject("$http");
const { userprofile } = mapGetters();
const profile = {...userprofile.value.profile};
const dependants = {...userprofile.value.dependants};

const isFetching = ref(false);
const patientInfo = ref({});
const diagnosis = ref({});
const recommendation = ref({});
const navigator = ref({ from: null, to: null, current: 0 });

const usePatientInfo = (payload) => (patientInfo.value = {...patientInfo.value, ...payload});
const useDiagnosis = (payload) => (diagnosis.value = {...diagnosis.value, ...payload});
const useRecommendation = (payload) => (recommendation.value = {...recommendation.value, ...payload});
const useNavigator = ({ current, from, to }) => (navigator.value = {current: to, from, to: null});

provide('$_PATIENT_INFO', { patientInfo, usePatientInfo });
provide('$_NAVIGATOR', { navigator, useNavigator });
provide('$_DIAGNOSIS', { diagnosis, useDiagnosis });
provide('$_RECOMMENDATION', { recommendation, useRecommendation });

</script>

<style scoped lang="scss">
.page-content {
	@include flexItem(vertical) {
		gap: $size-12;
		width: 100%;
		height: 100vh;
		position: relative;
	}

	&__body {
		@include flexItem(vertical) {
			width: 100%;
			height: 100%;
			overflow-y: scroll;
			padding: $size-0 $size-48;
			background: $color-g-97;
			position: relative;

			@include responsive(phone) {
				padding: $size-0 $size-24;
			}
		}

		&::-webkit-scrollbar {
			display: none;
			width: $size-12;
			background-color: $color-g-92;
		}
	}
}

</style>