<template>
    <div class="region-page">
        <!-- Hero Section -->
        <section class="hero">
            <div class="hero__content">
                <button class="hero__back" @click="() => onSubmit(0)">
                    <v-icon name="hi-arrow-left" scale="1" />
                    <span>Back</span>
                </button>

                <div class="hero__badge">
                    <span class="badge-step">Step 6 of 8</span>
                </div>

                <h1 class="hero__title">
                    Geographic<br/>
                    <span class="hero__title-accent">Region</span>
                </h1>

                <p class="hero__subtitle">
                    Select your current region and any regions visited in the last 12 months
                </p>
            </div>

            <div class="hero__visual">
                <div class="region-orb">
                    <div class="region-orb__inner">
                        <v-icon name="hi-globe" scale="3" />
                    </div>
                    <div class="region-orb__ring"></div>
                    <div class="region-orb__ring region-orb__ring--delayed"></div>
                </div>
                <div class="floating-icons">
                    <div class="floating-icon floating-icon--1">
                        <v-icon name="hi-location-marker" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--2">
                        <v-icon name="hi-map" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--3">
                        <v-icon name="hi-flag" scale="1.2" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
            <!-- Map Selection Card -->
            <div class="bento-card bento-card--map">
                <div class="bento-card__header">
                    <v-icon name="hi-globe" scale="1.1" />
                    <span>Select Your Region</span>
                </div>
                <div class="region-container">
                    <RegionSelector @selection="selectedRegion = $event" />
                </div>
            </div>

            <!-- Info Card -->
            <div class="bento-card bento-card--info">
                <div class="bento-card__header">
                    <v-icon name="hi-information-circle" scale="1.1" />
                    <span>Why This Matters</span>
                </div>
                <p class="info-text">
                    Regional health factors help provide more accurate assessments, as certain
                    conditions are more prevalent in specific geographic areas.
                </p>
                <div class="info-highlight">
                    <v-icon name="hi-shield-check" scale="1" />
                    <span>Improves diagnosis accuracy</span>
                </div>
            </div>

            <!-- Selected Region Card -->
            <div class="bento-card bento-card--selected" v-if="selectedRegion">
                <div class="selected-region">
                    <div class="selected-region__icon">
                        <v-icon name="hi-check-circle" scale="1.3" />
                    </div>
                    <div class="selected-region__details">
                        <span class="selected-region__label">Selected Region</span>
                        <span class="selected-region__name">{{ formatRegionName(selectedRegion) }}</span>
                    </div>
                </div>
            </div>

            <!-- Continue Card -->
            <div class="bento-card bento-card--action">
                <div class="action-content">
                    <div class="action-info">
                        <v-icon name="hi-arrow-right" scale="1.2" />
                        <span>{{ selectedRegion ? 'Region selected' : 'Select a region to continue' }}</span>
                    </div>
                    <button
                        class="continue-btn"
                        :class="{ 'continue-btn--disabled': !selectedRegion }"
                        :disabled="!selectedRegion"
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
import RegionSelector from "@/components/Health-checkup/region-map.vue";
import RcButton from "@/components/buttons/button-primary";

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

const formatRegionName = (region) => {
    return region.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

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
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;

.region-page {
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

// Region Orb Animation
.region-orb {
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
    }

    &--map {
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

// Region Container
.region-container {
    display: flex;
    justify-content: center;
    padding: 16px;
    background: $bg;
    border-radius: 16px;
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

// Selected Region Card
.selected-region {
    display: flex;
    align-items: center;
    gap: 14px;

    &__icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #10B981 0%, #059669 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
            color: white;
        }
    }

    &__details {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    &__label {
        font-size: 12px;
        color: $gray;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    &__name {
        font-size: 18px;
        font-weight: 600;
        color: $navy;
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
