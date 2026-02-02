<template>
  <div class="health-checkup-page">
    <Loader v-if="isFetching || isLoading" :useOverlay="true" style="z-index: 1" />

    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="notification-btn" @click="goToNotifications">
        <v-icon name="hi-bell" scale="1.1" />
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
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
import { ref, provide } from "vue";
import { useRouter } from "vue-router";
import Loader from "@/components/Loader/main-loader.vue";
import { mapGetters } from "@/utilities/utilityStore";

import CheckupEntry from "./parts/entry";
import GenderSelector from "./parts/gender";
import AgeSelector from "./parts/age";
import RiskFactors from "./parts/risk-factors";
import ConfirmInfo from "./parts/confirm-info";
import AssessmentType from "./parts/assessment-type";
import Observations from "./parts/observations";
import SelectRegion from "./parts/select-region";
import Symptoms from "./parts/symptoms";
import DiagnosisEvaluator from "./parts/diagnosis-evaluator";
import DiagnosisReport from "./parts/diagnosis-report";
import CheckupHistory from "./parts/checkup-history";

const router = useRouter();
const { userprofile } = mapGetters();
const profile = { ...userprofile.value.profile };
const dependants = { ...userprofile.value.dependants };

const isFetching = ref(false);
const patientInfo = ref({});
const diagnosis = ref({});
const recommendation = ref({});
const navigator = ref({ from: null, to: null, current: 0 });

const usePatientInfo = (payload) => (patientInfo.value = { ...patientInfo.value, ...payload });
const useDiagnosis = (payload) => (diagnosis.value = { ...diagnosis.value, ...payload });
const useRecommendation = (payload) => (recommendation.value = { ...recommendation.value, ...payload });
const useNavigator = ({ current, from, to }) => (navigator.value = { current: to, from, to: null });

const goToNotifications = () => {
  router.push('/app/patient/notifications');
};

provide('$_PATIENT_INFO', { patientInfo, usePatientInfo });
provide('$_NAVIGATOR', { navigator, useNavigator });
provide('$_DIAGNOSIS', { diagnosis, useDiagnosis });
provide('$_RECOMMENDATION', { recommendation, useRecommendation });
</script>

<style scoped lang="scss">
// Design System Colors
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;
$rose: #F43F5E;

.health-checkup-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: $bg;
  overflow-x: hidden;
  width: 100%;
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 14px 16px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  @media (max-width: 768px) {
    display: flex;
  }

  .menu-btn,
  .notification-btn {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    border: none;
    background: rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $slate;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
      background: rgba(0, 0, 0, 0.08);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .notification-btn {
    position: relative;

    .notification-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 8px;
      height: 8px;
      background: $rose;
      border-radius: 50%;
    }
  }

  .header-logo {
    img {
      height: 32px;
      width: auto;
    }
  }
}

// Page Content
.page-content {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 48px 120px;
  overflow-x: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 24px 24px 120px;
  }

  @media (max-width: 640px) {
    padding: 20px 16px 120px;
  }
}
</style>
