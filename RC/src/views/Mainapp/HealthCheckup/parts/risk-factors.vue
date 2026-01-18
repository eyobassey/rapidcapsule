<template>
    <Loader v-if="isLoading" :useOverlay="false" style="z-index:1" />
    <div v-else class="risk-page">
        <!-- Step Header (Hero Style) -->
        <div class="step-hero">
            <div class="step-hero__content">
                <div class="step-hero__top">
                    <button class="step-hero__back" @click="onSubmit(0)">
                        <v-icon name="hi-arrow-left" />
                    </button>
                    <div class="step-hero__progress">
                        <span class="step-hero__step">Step 4 of 8</span>
                        <div class="step-hero__bar">
                            <div class="step-hero__fill" style="width: 50%"></div>
                        </div>
                    </div>
                </div>
                <div class="step-hero__icon">
                    <v-icon name="hi-shield-check" />
                </div>
                <h1 class="step-hero__title">Risk Factors</h1>
                <p class="step-hero__subtitle">
                    <span v-if="patientInfo.patientType === 'Self'">Select any statements that apply to you</span>
                    <span v-else>Select any statements that apply to {{ patientInfo.gender === 'male' ? 'him' : 'her' }}</span>
                </p>
            </div>
            <div class="step-hero__decoration">
                <div class="decoration-circle decoration-circle--1"></div>
                <div class="decoration-circle decoration-circle--2"></div>
                <div class="decoration-circle decoration-circle--3"></div>
            </div>
        </div>

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
        <div class="step-footer">
            <button class="step-footer__btn step-footer__btn--back" @click="onSubmit(0)">
                <v-icon name="hi-arrow-left" />
                <span>Back</span>
            </button>
            <button
                class="step-footer__btn step-footer__btn--next"
                :class="{ 'step-footer__btn--disabled': riskFactors.length < riskFactorOptions.length }"
                :disabled="riskFactors.length < riskFactorOptions.length"
                @click="onSubmit(1)"
            >
                <span>Continue</span>
                <v-icon name="hi-arrow-right" />
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, inject, watchEffect } from "vue";
import RcRadio from "@/components/RCRadio";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";

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
.risk-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: $size-32;
    padding-bottom: $size-120;
    max-width: 700px;
    margin: 0 auto;

    @include responsive(phone) {
        gap: $size-24;
        padding-bottom: $size-100;
    }
}

// Step Hero (matching entry.vue)
.step-hero {
    position: relative;
    background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
    border-radius: $size-24;
    padding: 32px 32px 40px;
    box-shadow: 0 10px 40px rgba(14, 174, 196, 0.3);

    @include responsive(phone) {
        padding: 20px 24px 28px;
        border-radius: $size-16;
    }

    &__content {
        position: relative;
        z-index: 2;
    }

    &__top {
        display: flex;
        align-items: center;
        gap: $size-16;
        margin-bottom: $size-20;
    }

    &__back {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        border: none;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;

        @include responsive(phone) {
            width: 36px;
            height: 36px;
            border-radius: 10px;
        }

        &:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        svg {
            width: 20px;
            height: 20px;
            color: white;

            @include responsive(phone) {
                width: 18px;
                height: 18px;
            }
        }
    }

    &__progress {
        flex: 1;
    }

    &__step {
        font-size: $size-13;
        font-weight: $fw-medium;
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: $size-8;
        display: block;
    }

    &__bar {
        height: 6px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        
    }

    &__fill {
        height: 100%;
        background: white;
        border-radius: 3px;
        transition: width 0.5s ease;
    }

    &__icon {
        width: 72px;
        height: 72px;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto $size-20;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);

        @include responsive(phone) {
            width: 60px;
            height: 60px;
            border-radius: 16px;
        }

        svg {
            width: 36px;
            height: 36px;
            color: white;

            @include responsive(phone) {
                width: 28px;
                height: 28px;
            }
        }
    }

    &__title {
        font-size: $size-28;
        font-weight: $fw-bold;
        color: white;
        margin: 0 0 $size-8 0;
        text-align: center;
        letter-spacing: -0.5px;

        @include responsive(phone) {
            font-size: $size-22;
        }
    }

    &__subtitle {
        font-size: $size-15;
        color: rgba(255, 255, 255, 0.9);
        margin: 0;
        text-align: center;
        max-width: 400px;
        margin: 0 auto;
        line-height: 1.5;

        @include responsive(phone) {
            font-size: $size-14;
        }
    }

    &__decoration {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        
    }
}

.decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);

    &--1 {
        width: 200px;
        height: 200px;
        top: -60px;
        right: -40px;
    }

    &--2 {
        width: 150px;
        height: 150px;
        bottom: -40px;
        left: -30px;
    }

    &--3 {
        width: 80px;
        height: 80px;
        top: 40%;
        right: 15%;
    }
}

// Risk Cards
.risk-cards {
    display: flex;
    flex-direction: column;
    gap: $size-16;
}

.risk-card {
    background: $color-white;
    border: 2px solid $color-g-92;
    border-radius: $size-16;
    padding: $size-20;
    transition: all 0.3s ease;

    @include responsive(phone) {
        padding: $size-16;
    }

    &:hover {
        border-color: $color-g-85;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    &__question {
        display: flex;
        align-items: flex-start;
        gap: $size-12;
        margin-bottom: $size-16;
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
        font-size: $size-16;
        font-weight: $fw-medium;
        color: $color-black;
        line-height: 1.4;
        padding-top: $size-4;

        @include responsive(phone) {
            font-size: $size-15;
        }
    }

    &__options {
        display: flex;
        gap: $size-10;

        @include responsive(phone) {
            gap: $size-8;
        }
    }
}

.risk-option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-6;
    padding: $size-12 $size-16;
    background: $color-g-97;
    border: 2px solid transparent;
    border-radius: $size-10;
    font-size: $size-14;
    font-weight: $fw-medium;
    color: $color-g-54;
    cursor: pointer;
    transition: all 0.3s ease;

    @include responsive(phone) {
        padding: $size-10 $size-12;
        font-size: $size-13;
    }

    svg {
        width: 16px;
        height: 16px;

        @include responsive(phone) {
            width: 14px;
            height: 14px;
        }
    }

    &:hover {
        background: $color-g-92;
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
            background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
            border-color: #0ea5e9;
            color: #0369a1;
        }
    }
}

// Toggle Button
.risk-toggle {
    display: flex;
    justify-content: center;
    margin-top: $size-8;

    &__btn {
        display: flex;
        align-items: center;
        gap: $size-8;
        padding: $size-12 $size-24;
        background: transparent;
        border: 2px solid #0EAEC4;
        border-radius: $size-24;
        color: #0EAEC4;
        font-size: $size-14;
        font-weight: $fw-medium;
        cursor: pointer;
        transition: all 0.3s ease;

        svg {
            width: 16px;
            height: 16px;
        }

        &:hover {
            background: #0EAEC4;
            color: white;
        }
    }
}

// Navigation Footer
.step-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-16 $size-48;
    background: white;
    border-top: 1px solid $color-g-92;
    z-index: 100;

    @include responsive(phone) {
        padding: $size-16 $size-24;
    }

    &__btn {
        display: flex;
        align-items: center;
        gap: $size-8;
        padding: $size-12 $size-24;
        border-radius: $size-12;
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        cursor: pointer;
        transition: all 0.3s ease;

        @include responsive(phone) {
            padding: $size-12 $size-20;
            font-size: $size-14;
        }

        svg {
            width: 18px;
            height: 18px;
        }

        &--back {
            background: transparent;
            border: 2px solid $color-g-85;
            color: $color-g-44;

            &:hover {
                border-color: $color-g-77;
                background: $color-g-97;
            }
        }

        &--next {
            background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
            border: none;
            color: white;
            box-shadow: 0 4px 14px rgba(14, 174, 196, 0.4);

            &:hover:not(:disabled) {
                box-shadow: 0 6px 20px rgba(14, 174, 196, 0.5);
                transform: translateY(-1px);
            }
        }

        &--disabled {
            opacity: 0.5;
            cursor: not-allowed;
            box-shadow: none;
        }
    }
}
</style>
