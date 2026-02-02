<template>
    <div class="region-page">
        <!-- Step Header -->
        <StepHero
            :step="6"
            :totalSteps="8"
            icon="hi-globe"
            title="Your Geographic Region"
            subtitle="Select your current region and any regions visited in the last 12 months"
            @back="() => onSubmit(0)"
        />

        <!-- Region Selector -->
        <div class="region-container">
            <RegionSelector @selection="selectedRegion = $event" />
        </div>

        <!-- Info Notice -->
        <InfoNotice
            type="info"
            text="Regional health factors help provide more accurate assessments, as certain conditions are more prevalent in specific areas."
        />

        <!-- Navigation Footer -->
        <StepFooter
            :disabled="!selectedRegion"
            @back="() => onSubmit(0)"
            @next="() => onSubmit(1)"
        />
    </div>
</template>

<script setup>
import { ref, inject, watchEffect } from "vue";
import RegionSelector from "@/components/Health-checkup/region-map.vue";
import RcButton from "@/components/buttons/button-primary";
import StepHero from "./components/StepHero.vue";
import StepFooter from "./components/StepFooter.vue";
import InfoNotice from "./components/InfoNotice.vue";

const $http = inject('$http');
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');

const selectedRegion = ref('');
const riskFactorOptions = ref([]);
const regions = {
    'australia': 'p_19',
    'europe': 'p_15',
    'north-america': 'p_13',
    'south-america': 'p_14',
    'north-asia': 'p_20',
    'south-asia': 'p_22',
    'middle-east': 'p_21',
    'north-africa': 'p_16',
    'south-africa': 'p_18',
    'west-central-east-africa': 'p_17'
}

watchEffect(async () => {
    if (Object.keys(patientInfo.value)) {
        const locationRiskFactors = ['p_15', 'p_20', 'p_21', 'p_16', 'p_17', 'p_18', 'p_14', 'p_19', 'p_22', 'p_13'];;
        await $http.$_riskFactors({ age: patientInfo.value.age }).then(({ data }) => {
            riskFactorOptions.value = data.data?.filter((risk) => (locationRiskFactors.includes(risk.id)));
        });
    }
});

const onSubmit = (activeScreen) => {
    const { current, from, to } = navigator.value;

    riskFactorOptions.value.forEach(item => {
        if (regions[selectedRegion.value] === item.id) item.choice_id = 'present';
        else item.choice_id = 'absent';
    });

    if (activeScreen === 0) {
        usePatientInfo(patientInfo.value);
        useNavigator({ current, from: current, to: 5 });
    } else if (activeScreen === 1) {
        usePatientInfo({...patientInfo.value, region: riskFactorOptions.value});
        useNavigator({ current, from: current, to: 7 });
    }
}

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

.region-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding-bottom: 120px;
    max-width: 800px;
    margin: 0 auto;

    @media (max-width: 640px) {
        gap: 24px;
        padding-bottom: 100px;
    }
}

// Region Container
.region-container {
    background: white;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 20px;
    padding: 24px;
    display: flex;
    justify-content: center;

    @media (max-width: 640px) {
        padding: 16px;
        border-radius: 16px;
    }
}
</style>
