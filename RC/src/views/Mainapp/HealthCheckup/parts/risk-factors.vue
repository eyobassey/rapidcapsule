<template>
    <Loader v-if="isLoading" :useOverlay="false" style="z-index:1" />
    <div v-else class="risk-page">
        <!-- Step Header -->
        <StepHero
            :step="4"
            :totalSteps="8"
            icon="hi-shield-check"
            title="Risk Factors"
            :subtitle="patientInfo.patientType === 'Self'
                ? 'Select any statements that apply to you'
                : `Select any statements that apply to ${patientInfo.gender === 'male' ? 'him' : 'her'}`"
            @back="() => onSubmit(0)"
        />

        <!-- Risk Factors List -->
        <div class="risk-cards">
            <template v-for="(factor, i) in riskFactorOptions" :key="JSON.stringify(factor)">
                <div class="risk-card">
                    <div class="risk-card__question">
                        <div class="risk-card__icon">
                            <v-icon name="hi-exclamation-circle" />
                        </div>
                        <span class="risk-card__text">{{ factor.common_name }}</span>
                    </div>
                    <div class="risk-card__options">
                        <button
                            class="risk-option"
                            :class="{ 'risk-option--selected risk-option--yes': riskFactors[i]?.choice_id === 'present' }"
                            @click="riskFactors[i] = {...factor, choice_id: 'present'}"
                        >
                            <v-icon name="hi-check" />
                            <span>Yes</span>
                        </button>
                        <button
                            class="risk-option"
                            :class="{ 'risk-option--selected risk-option--no': riskFactors[i]?.choice_id === 'absent' }"
                            @click="riskFactors[i] = {...factor, choice_id: 'absent'}"
                        >
                            <v-icon name="hi-x" />
                            <span>No</span>
                        </button>
                        <button
                            class="risk-option"
                            :class="{ 'risk-option--selected risk-option--unknown': riskFactors[i]?.choice_id === 'unknown' }"
                            @click="riskFactors[i] = {...factor, choice_id: 'unknown'}"
                        >
                            <v-icon name="hi-question-mark-circle" />
                            <span>Not sure</span>
                        </button>
                    </div>
                </div>
            </template>

            <!-- Show more/less toggle -->
            <div v-if="allRiskFactors.length > 8" class="risk-toggle">
                <button @click="toggleRiskFactors" class="risk-toggle__btn">
                    <span v-if="!showAllRiskFactors">
                        Show {{ allRiskFactors.length - riskFactorOptions.length }} more risk factors
                    </span>
                    <span v-else>Show fewer risk factors</span>
                    <v-icon :name="showAllRiskFactors ? 'hi-chevron-up' : 'hi-chevron-down'" />
                </button>
            </div>
        </div>

        <!-- Navigation Footer -->
        <StepFooter
            :disabled="riskFactors.length < riskFactorOptions.length"
            @back="() => onSubmit(0)"
            @next="() => onSubmit(1)"
        />
    </div>
</template>

<script setup>
import { ref, inject, watchEffect } from "vue";
import RcRadio from "@/components/RCRadio";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import StepHero from "./components/StepHero.vue";
import StepFooter from "./components/StepFooter.vue";

const $http = inject('$http');
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');

const isLoading = ref(true);
const riskFactorOptions = ref([]);
const riskFactors = ref([]);
const showAllRiskFactors = ref(false);
const allRiskFactors = ref([]);

// Priority risk factors that should always be shown
const priorityRiskFactors = [
    'p_7',   // Diagnosed hypertension
    'p_28',  // Smoking cigarettes
    'p_10',  // Recent physical injury
    'p_9',   // Obesity/BMI
    'p_8',   // Diabetes
    'p_147', // Pregnancy (will be filtered by gender/age)
    'p_21',  // High cholesterol
    'p_80'   // Immunodeficiency
];

const toggleRiskFactors = () => {
    showAllRiskFactors.value = !showAllRiskFactors.value;

    if (showAllRiskFactors.value) {
        // Show all risk factors
        riskFactorOptions.value = allRiskFactors.value;
    } else {
        // Show only priority and some additional ones
        const priority = [];
        const additional = [];

        allRiskFactors.value.forEach(risk => {
            if (priorityRiskFactors.includes(risk.id)) {
                priority.push(risk);
            } else {
                additional.push(risk);
            }
        });

        const initialDisplay = [
            ...priority,
            ...additional.slice(0, Math.max(0, 8 - priority.length))
        ];

        riskFactorOptions.value = initialDisplay;
    }
};

watchEffect(async () => {
    isLoading.value = true;
    if (Object.keys(patientInfo.value)) {
        await $http.$_riskFactors({ age: patientInfo.value.age }).then(({ data }) => {
            if (data.data && Array.isArray(data.data)) {
                // Store all risk factors
                allRiskFactors.value = data.data;

                // Separate priority and additional risk factors
                const priority = [];
                const additional = [];

                data.data.forEach(risk => {
                    if (priorityRiskFactors.includes(risk.id)) {
                        priority.push(risk);
                    } else {
                        additional.push(risk);
                    }
                });

                // Show priority factors first, then up to 2 more relevant ones
                // Total initial display: 6-8 risk factors
                const initialDisplay = [
                    ...priority,
                    ...additional.slice(0, Math.max(0, 8 - priority.length))
                ];

                riskFactorOptions.value = showAllRiskFactors.value
                    ? data.data
                    : initialDisplay;
            }
            isLoading.value = false;
        });
    }
});

const onSubmit = (activeScreen) => {
    const { current, from, to } = navigator.value;
    const factors = riskFactors.value.filter(i => i.choice_id);

    if (activeScreen === 0) {
        usePatientInfo(patientInfo.value);

        if (patientInfo.value.patientType === 'Self') {
            useNavigator({ current, from: current, to: 3 });
        } else useNavigator({ current, from: current, to: 2 });

    } else if (activeScreen === 1) {
        usePatientInfo({ ...patientInfo.value, factors });
        useNavigator({ current, from: current, to: 5 });
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

.risk-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding-bottom: 120px;
    max-width: 700px;
    margin: 0 auto;

    @media (max-width: 640px) {
        gap: 24px;
        padding-bottom: 100px;
    }
}

// Risk Cards
.risk-cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.risk-card {
    background: white;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    padding: 20px;
    transition: all 0.3s ease;

    @media (max-width: 640px) {
        padding: 16px;
    }

    &:hover {
        border-color: rgba(0, 0, 0, 0.12);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    &__question {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 16px;
    }

    &__icon {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        svg {
            width: 18px;
            height: 18px;
            color: #d97706;
        }
    }

    &__text {
        font-size: 16px;
        font-weight: 500;
        color: $navy;
        line-height: 1.4;
        padding-top: 4px;

        @media (max-width: 640px) {
            font-size: 15px;
        }
    }

    &__options {
        display: flex;
        gap: 10px;

        @media (max-width: 640px) {
            gap: 8px;
        }
    }
}

.risk-option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 16px;
    background: $bg;
    border: 2px solid transparent;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    color: $gray;
    cursor: pointer;
    transition: all 0.3s ease;

    @media (max-width: 640px) {
        padding: 10px 12px;
        font-size: 13px;
    }

    svg {
        width: 16px;
        height: 16px;

        @media (max-width: 640px) {
            width: 14px;
            height: 14px;
        }
    }

    &:hover {
        background: rgba(0, 0, 0, 0.06);
    }

    &--selected {
        &.risk-option--yes {
            background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
            border-color: #22c55e;
            color: #15803d;
        }

        &.risk-option--no {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            border-color: #ef4444;
            color: #b91c1c;
        }

        &.risk-option--unknown {
            background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
            border-color: $sky;
            color: $sky-dark;
        }
    }
}

// Toggle Button
.risk-toggle {
    display: flex;
    justify-content: center;
    margin-top: 8px;

    &__btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        background: transparent;
        border: 2px solid $sky;
        border-radius: 24px;
        color: $sky-dark;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        svg {
            width: 16px;
            height: 16px;
        }

        &:hover {
            background: $sky;
            color: white;
        }
    }
}
</style>
