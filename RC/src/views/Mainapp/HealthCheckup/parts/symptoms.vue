<template>
    <Loader v-if="isFetching || isLoading" :useOverlay="false" style="z-index:1" />
    <div v-else class="symptoms-page">
        <!-- Step Header -->
        <StepHero
            :step="7"
            :totalSteps="8"
            icon="hi-sparkles"
            title="AI-Suggested Symptoms"
            subtitle="Based on your input, do you have any of the following symptoms?"
            @back="() => onSubmit(0)"
        />

        <!-- AI Notice -->
        <InfoNotice
            type="ai"
            title="Smart Suggestions"
            text="Our AI has identified these related symptoms based on your initial input. Selecting relevant symptoms helps improve diagnosis accuracy."
        />

        <!-- Symptoms List -->
        <div class="symptoms-cards">
            <template v-for="symptom in symptomsOptions" :key="JSON.stringify(symptom)">
                <div
                    class="symptom-card"
                    :class="{ 'symptom-card--selected': symptom.status }"
                    @click="symptom.status = !symptom.status"
                >
                    <div class="symptom-card__checkbox">
                        <div class="symptom-card__check" v-if="symptom.status">
                            <v-icon name="hi-check" />
                        </div>
                    </div>
                    <div class="symptom-card__content">
                        <span class="symptom-card__name">{{ symptom.common_name }}</span>
                    </div>
                </div>
            </template>
        </div>

        <!-- Navigation Footer -->
        <StepFooter
            nextLabel="Start Interview"
            @back="() => onSubmit(0)"
            @next="() => onSubmit(1)"
        />
    </div>
</template>

<script setup>
import { ref, inject, watchEffect, onMounted } from "vue";
import RcCheckbox from "@/components/inputs/check-box";
import ButtonIcon from "@/components/buttons/button-icon";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import StepHero from "./components/StepHero.vue";
import StepFooter from "./components/StepFooter.vue";
import InfoNotice from "./components/InfoNotice.vue";

const $http = inject('$http');
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');
const { diagnosis, useDiagnosis } = inject('$_DIAGNOSIS');

const isLoading = ref(true);
const symptomsOptions = ref([]);
const symptoms = ref([]);

onMounted(async () => {
    isLoading.value = true;
    symptoms.value = {
        sex: patientInfo.value.gender,
        age: { value: patientInfo.value.age },
        evidence: [
            ...patientInfo.value.observations,
            ...patientInfo.value.region,
            ...patientInfo.value.factors,
        ]
    }
    await $http.$_getSuggestedSymptoms(symptoms.value).then(({ data }) => {
        symptomsOptions.value = data.data;
        isLoading.value = false;
    });
});

const onSubmit = (activeScreen) => {
    const { current, from, to } = navigator.value;
    // CRITICAL: Mark selected symptoms with 'source: initial' for Infermedica's should_stop algorithm
    // Without this marker, the interview will never know when to stop
    const selectedSymptoms = symptomsOptions.value.map((item) => ({
        ...item,
        choice_id: item.status ? 'present' : 'absent',
        source: 'initial' // Required for Infermedica to calculate should_stop
    }));
    symptoms.value = {
        ...symptoms.value,
        should_stop: false,
        evidence: [...symptoms.value.evidence,...selectedSymptoms]
    }

    if (activeScreen === 0) {
        usePatientInfo(patientInfo.value);
        useNavigator({ current, from: current, to: from });
    } else if (activeScreen === 1) {
        useDiagnosis(symptoms.value);
        useNavigator({ current, from: current, to: 8 });
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

.symptoms-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding-bottom: 120px;
    max-width: 700px;
    margin: 0 auto;

    @media (max-width: 640px) {
        gap: 20px;
        padding-bottom: 100px;
    }
}

// Symptoms Cards
.symptoms-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.symptom-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    background: white;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.3s ease;

    @media (max-width: 640px) {
        padding: 14px 16px;
    }

    &:hover {
        border-color: rgba(0, 0, 0, 0.12);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    &--selected {
        border-color: #10b981;
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);

        .symptom-card__checkbox {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-color: transparent;
        }
    }

    &__checkbox {
        width: 24px;
        height: 24px;
        background: white;
        border: 2px solid rgba(0, 0, 0, 0.15);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.3s ease;
    }

    &__check {
        svg {
            width: 16px;
            height: 16px;
            color: white;
        }
    }

    &__content {
        flex: 1;
    }

    &__name {
        font-size: 15px;
        font-weight: 500;
        color: $navy;
        text-transform: capitalize;

        @media (max-width: 640px) {
            font-size: 14px;
        }
    }
}
</style>
