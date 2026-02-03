<template>
    <Loader v-if="isLoading" :useOverlay="false" style="z-index:1" />
    <div v-else class="risk-page">
        <!-- Hero Section -->
        <section class="hero">
            <div class="hero__content">
                <button class="hero__back" @click="() => onSubmit(0)">
                    <v-icon name="hi-arrow-left" scale="1" />
                    <span>Back</span>
                </button>

                <div class="hero__badge">
                    <span class="badge-step">Step 4 of 8</span>
                </div>

                <h1 class="hero__title">
                    Health Risk<br/>
                    <span class="hero__title-accent">Factors</span>
                </h1>

                <p class="hero__subtitle">
                    {{ patientInfo.patientType === 'Self'
                        ? 'Select any statements that apply to you'
                        : `Select any statements that apply to ${patientInfo.gender === 'male' ? 'him' : 'her'}` }}
                </p>
            </div>

            <div class="hero__visual">
                <div class="risk-orb">
                    <div class="risk-orb__inner">
                        <v-icon name="hi-shield-check" scale="3" />
                    </div>
                    <div class="risk-orb__ring"></div>
                    <div class="risk-orb__ring risk-orb__ring--delayed"></div>
                </div>
                <div class="floating-icons">
                    <div class="floating-icon floating-icon--1">
                        <v-icon name="hi-heart" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--2">
                        <v-icon name="hi-exclamation" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--3">
                        <v-icon name="hi-clipboard-check" scale="1.2" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
            <!-- Main Risk Factors Card -->
            <div class="bento-card bento-card--factors">
                <div class="bento-card__header">
                    <v-icon name="hi-clipboard-list" scale="1.1" />
                    <span>Risk Assessment</span>
                    <span class="factor-count">{{ riskFactors.filter(r => r?.choice_id).length }}/{{ riskFactorOptions.length }}</span>
                </div>

                <div class="risk-list">
                    <template v-for="(factor, i) in riskFactorOptions" :key="JSON.stringify(factor)">
                        <div class="risk-item">
                            <div class="risk-item__question">
                                <div class="risk-item__icon">
                                    <v-icon name="hi-exclamation-circle" scale="0.9" />
                                </div>
                                <span class="risk-item__text">{{ factor.common_name }}</span>
                            </div>
                            <div class="risk-item__options">
                                <button
                                    class="risk-btn risk-btn--yes"
                                    :class="{ 'risk-btn--selected': riskFactors[i]?.choice_id === 'present' }"
                                    @click="riskFactors[i] = {...factor, choice_id: 'present'}"
                                >
                                    <v-icon name="hi-check" scale="0.8" />
                                    <span>Yes</span>
                                </button>
                                <button
                                    class="risk-btn risk-btn--no"
                                    :class="{ 'risk-btn--selected': riskFactors[i]?.choice_id === 'absent' }"
                                    @click="riskFactors[i] = {...factor, choice_id: 'absent'}"
                                >
                                    <v-icon name="hi-x" scale="0.8" />
                                    <span>No</span>
                                </button>
                                <button
                                    class="risk-btn risk-btn--unsure"
                                    :class="{ 'risk-btn--selected': riskFactors[i]?.choice_id === 'unknown' }"
                                    @click="riskFactors[i] = {...factor, choice_id: 'unknown'}"
                                >
                                    <v-icon name="hi-question-mark-circle" scale="0.8" />
                                    <span>Not sure</span>
                                </button>
                            </div>
                        </div>
                    </template>
                </div>

                <!-- Show more/less toggle -->
                <div v-if="allRiskFactors.length > 8" class="risk-toggle">
                    <button @click="toggleRiskFactors" class="toggle-btn">
                        <span v-if="!showAllRiskFactors">
                            Show {{ allRiskFactors.length - riskFactorOptions.length }} more risk factors
                        </span>
                        <span v-else>Show fewer risk factors</span>
                        <v-icon :name="showAllRiskFactors ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
                    </button>
                </div>
            </div>

            <!-- Info Card -->
            <div class="bento-card bento-card--info">
                <div class="bento-card__header">
                    <v-icon name="hi-information-circle" scale="1.1" />
                    <span>Why This Matters</span>
                </div>
                <p class="info-text">
                    Risk factors help our AI provide more accurate health assessments
                    by understanding your medical background and lifestyle.
                </p>
                <div class="info-highlight">
                    <v-icon name="hi-lock-closed" scale="1" />
                    <span>Your data is encrypted and secure</span>
                </div>
            </div>

            <!-- Continue Card -->
            <div class="bento-card bento-card--action">
                <div class="action-content">
                    <div class="action-info">
                        <v-icon name="hi-arrow-right" scale="1.2" />
                        <span>{{ riskFactors.filter(r => r?.choice_id).length === riskFactorOptions.length ? 'All factors answered' : 'Answer all factors to continue' }}</span>
                    </div>
                    <button
                        class="continue-btn"
                        :class="{ 'continue-btn--disabled': riskFactors.length < riskFactorOptions.length }"
                        :disabled="riskFactors.length < riskFactorOptions.length"
                        @click="() => onSubmit(1)"
                    >
                        <span>Continue</span>
                        <v-icon name="hi-arrow-right" scale="1" />
                    </button>
                </div>
            </div>
        </section>
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
// Design System Colors
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;

.risk-page {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding-bottom: 120px;

    @media (max-width: 768px) {
        gap: 16px;
        padding-bottom: 100px;
    }
}

// Hero Section
.hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    padding: 40px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
    border-radius: 28px;
    position: relative;
    overflow: hidden;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
        padding: 32px 24px;
        text-align: center;
    }

    &::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -20%;
        width: 60%;
        height: 200%;
        background: radial-gradient(ellipse, rgba(255,255,255,0.1) 0%, transparent 70%);
        pointer-events: none;
    }

    &__content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 16px;
        z-index: 1;

        @media (max-width: 900px) {
            align-items: center;
        }
    }

    &__back {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        width: fit-content;

        &:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateX(-4px);
        }
    }

    &__badge {
        display: flex;
        gap: 8px;

        @media (max-width: 900px) {
            justify-content: center;
        }

        .badge-step {
            padding: 6px 14px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            color: white;
            font-size: 13px;
            font-weight: 600;
        }
    }

    &__title {
        font-size: 48px;
        font-weight: 700;
        color: white;
        line-height: 1.1;
        margin: 0;

        @media (max-width: 900px) {
            font-size: 36px;
        }

        @media (max-width: 480px) {
            font-size: 28px;
        }
    }

    &__title-accent {
        background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    &__subtitle {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.9);
        line-height: 1.6;
        margin: 0;
        max-width: 400px;

        @media (max-width: 900px) {
            font-size: 14px;
        }
    }

    &__visual {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        min-height: 200px;

        @media (max-width: 900px) {
            min-height: 160px;
        }
    }
}

// Risk Orb Animation
.risk-orb {
    position: relative;
    width: 140px;
    height: 140px;

    @media (max-width: 900px) {
        width: 120px;
        height: 120px;
    }

    &__inner {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(20px);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.3);
        animation: float 3s ease-in-out infinite;
    }

    &__ring {
        position: absolute;
        inset: -15px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        animation: pulse-ring 2s ease-out infinite;

        &--delayed {
            animation-delay: 1s;
        }
    }
}

// Floating Icons
.floating-icons {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.floating-icon {
    position: absolute;
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &--1 {
        top: 10%;
        right: 15%;
        animation: float 4s ease-in-out infinite;
    }

    &--2 {
        bottom: 20%;
        right: 10%;
        animation: float 3.5s ease-in-out infinite 0.5s;
    }

    &--3 {
        bottom: 10%;
        left: 15%;
        animation: float 4.5s ease-in-out infinite 1s;
    }
}

// Bento Grid
.bento-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 16px;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
    }
}

.bento-card {
    background: white;
    border-radius: 20px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    border: 1px solid #E2E8F0;

    @media (max-width: 640px) {
        padding: 20px;
    }

    &__header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
        color: $slate;
        font-weight: 600;
        font-size: 15px;

        svg {
            color: $sky;
        }

        .factor-count {
            margin-left: auto;
            padding: 4px 10px;
            background: $sky-light;
            border-radius: 12px;
            font-size: 13px;
            color: $sky-dark;
        }
    }

    &--factors {
        grid-row: 1 / 3;

        @media (max-width: 900px) {
            grid-row: auto;
        }
    }

    &--action {
        grid-column: 1 / -1;
        padding: 20px 24px;

        @media (max-width: 900px) {
            grid-column: 1;
        }
    }
}

// Risk List
.risk-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 500px;
    overflow-y: auto;
    padding-right: 8px;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: #F1F5F9;
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: #CBD5E1;
        border-radius: 3px;

        &:hover {
            background: #94A3B8;
        }
    }
}

.risk-item {
    padding: 16px;
    background: $bg;
    border-radius: 14px;
    border: 1px solid #E2E8F0;

    &__question {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 12px;
    }

    &__icon {
        width: 28px;
        height: 28px;
        background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        svg {
            color: #D97706;
        }
    }

    &__text {
        font-size: 14px;
        font-weight: 500;
        color: $navy;
        line-height: 1.4;
        padding-top: 2px;
    }

    &__options {
        display: flex;
        gap: 8px;
    }
}

.risk-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px 12px;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    color: $gray;
    cursor: pointer;
    transition: all 0.2s ease;

    @media (max-width: 480px) {
        padding: 8px 6px;
        font-size: 12px;
    }

    &:hover:not(.risk-btn--selected) {
        border-color: #CBD5E1;
        background: #F8FAFC;
    }

    &--selected {
        &.risk-btn--yes {
            background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%);
            border-color: #22C55E;
            color: #15803D;
        }

        &.risk-btn--no {
            background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
            border-color: #EF4444;
            color: #B91C1C;
        }

        &.risk-btn--unsure {
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
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #E2E8F0;
}

.toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: transparent;
    border: 1px solid $sky;
    border-radius: 20px;
    color: $sky-dark;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: $sky;
        color: white;
    }
}

// Info Card
.info-text {
    font-size: 14px;
    color: $gray;
    line-height: 1.6;
    margin-bottom: 16px;
}

.info-highlight {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: $sky-light;
    border-radius: 12px;
    color: $sky-dark;
    font-size: 13px;
    font-weight: 500;

    svg {
        flex-shrink: 0;
    }
}

// Action Card
.action-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    @media (max-width: 640px) {
        flex-direction: column;
    }
}

.action-info {
    display: flex;
    align-items: center;
    gap: 12px;
    color: $slate;
    font-weight: 500;

    svg {
        color: $sky;
    }
}

.continue-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border: none;
    border-radius: 14px;
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 16px rgba(79, 195, 247, 0.3);

    @media (max-width: 640px) {
        width: 100%;
        justify-content: center;
    }

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(79, 195, 247, 0.4);
    }

    &:disabled, &--disabled {
        opacity: 0.5;
        cursor: not-allowed;

        &:hover {
            transform: none;
            box-shadow: 0 4px 16px rgba(79, 195, 247, 0.3);
        }
    }
}

// Animations
@keyframes float {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-10px);
    }
}

@keyframes pulse-ring {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    100% {
        transform: scale(1.3);
        opacity: 0;
    }
}
</style>
