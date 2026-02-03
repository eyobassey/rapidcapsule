<template>
    <div class="age-page">
        <!-- Hero Section -->
        <section class="hero">
            <div class="hero__content">
                <button class="hero__back" @click="() => onSelectedAge(0)">
                    <v-icon name="hi-arrow-left" scale="1" />
                    <span>Back</span>
                </button>

                <div class="hero__badge">
                    <span class="badge-step">Step 2 of 8</span>
                </div>

                <h1 class="hero__title">
                    {{ titleFirstPart }}<br/>
                    <span class="hero__title-accent">{{ titleAccent }}</span>
                </h1>

                <p class="hero__subtitle">
                    Move the slider or use the buttons to select age between 12-100 years
                </p>
            </div>

            <div class="hero__visual">
                <div class="age-orb">
                    <div class="age-orb__inner">
                        <v-icon name="hi-calendar" scale="3" />
                    </div>
                    <div class="age-orb__ring"></div>
                    <div class="age-orb__ring age-orb__ring--delayed"></div>
                </div>
                <div class="floating-icons">
                    <div class="floating-icon floating-icon--1">
                        <v-icon name="hi-clock" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--2">
                        <v-icon name="hi-cake" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--3">
                        <v-icon name="hi-heart" scale="1.2" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
            <!-- Age Selector Card -->
            <div class="bento-card bento-card--selector">
                <div class="bento-card__header">
                    <v-icon name="hi-adjustments" scale="1.1" />
                    <span>Age Selection</span>
                </div>

                <!-- Large Age Display -->
                <div class="age-display">
                    <button class="age-btn age-btn--minus" @click="decrementAge" :disabled="selectedAge <= 12">
                        <v-icon name="hi-minus" scale="1.2" />
                    </button>
                    <div class="age-display__value">
                        <span class="age-number">{{ selectedAge }}</span>
                        <span class="age-label">years old</span>
                    </div>
                    <button class="age-btn age-btn--plus" @click="incrementAge" :disabled="selectedAge >= 100">
                        <v-icon name="hi-plus" scale="1.2" />
                    </button>
                </div>

                <!-- Slider -->
                <div class="age-slider">
                    <div class="age-slider__labels">
                        <span>12</span>
                        <span>100</span>
                    </div>
                    <input
                        type="range"
                        v-model.number="selectedAge"
                        :min="12"
                        :max="100"
                        class="slider-input"
                    />
                </div>

                <!-- Quick Select -->
                <div class="quick-select">
                    <span class="quick-select__label">Quick select:</span>
                    <div class="quick-select__buttons">
                        <button
                            v-for="age in quickAges"
                            :key="age"
                            class="quick-btn"
                            :class="{ 'quick-btn--active': selectedAge === age }"
                            @click="selectedAge = age"
                        >
                            {{ age }}
                        </button>
                    </div>
                </div>

                <!-- Continue Button -->
                <button class="continue-btn" @click="() => onSelectedAge(1)">
                    <span>Continue</span>
                    <v-icon name="hi-arrow-right" scale="1" />
                </button>
            </div>

            <!-- Info Card -->
            <div class="bento-card bento-card--info">
                <div class="bento-card__header">
                    <v-icon name="hi-information-circle" scale="1.1" />
                    <span>Why Age Matters</span>
                </div>
                <p class="info-text">
                    Age is crucial for accurate health assessments as many conditions have
                    age-specific prevalence rates. Our AI adjusts its analysis based on
                    your age to provide more relevant recommendations.
                </p>
                <div class="info-highlight">
                    <v-icon name="hi-shield-check" scale="1" />
                    <span>Assessments available for ages 12+</span>
                </div>
            </div>

            <!-- Age Group Card -->
            <div class="bento-card bento-card--group">
                <div class="bento-card__header">
                    <v-icon name="hi-user-group" scale="1.1" />
                    <span>Your Age Group</span>
                </div>
                <div class="age-group">
                    <div class="age-group__icon">
                        <v-icon :name="ageGroupIcon" scale="1.5" />
                    </div>
                    <div class="age-group__details">
                        <span class="age-group__name">{{ ageGroupName }}</span>
                        <span class="age-group__range">{{ ageGroupRange }}</span>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, inject, computed } from "vue";

const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');

const selectedAge = ref(25);
const quickAges = [18, 25, 35, 45, 55, 65];

const titleFirstPart = computed(() => {
    const patientType = patientInfo.value?.patientType;
    if (patientType === 'Self') {
        return 'How old';
    }
    return 'Patient\'s';
});

const titleAccent = computed(() => {
    const gender = patientInfo.value?.gender;
    const patientType = patientInfo.value?.patientType;

    if (patientType === 'Self') {
        return 'are you?';
    }
    if (gender === 'male') {
        return 'Age (He)';
    } else if (gender === 'female') {
        return 'Age (She)';
    }
    return 'Age';
});

const ageGroupName = computed(() => {
    const age = selectedAge.value;
    if (age < 18) return 'Adolescent';
    if (age < 30) return 'Young Adult';
    if (age < 45) return 'Adult';
    if (age < 60) return 'Middle-aged';
    if (age < 75) return 'Senior';
    return 'Elderly';
});

const ageGroupRange = computed(() => {
    const age = selectedAge.value;
    if (age < 18) return '12-17 years';
    if (age < 30) return '18-29 years';
    if (age < 45) return '30-44 years';
    if (age < 60) return '45-59 years';
    if (age < 75) return '60-74 years';
    return '75+ years';
});

const ageGroupIcon = computed(() => {
    const age = selectedAge.value;
    if (age < 18) return 'hi-academic-cap';
    if (age < 45) return 'hi-user';
    if (age < 60) return 'hi-briefcase';
    return 'hi-heart';
});

const incrementAge = () => {
    if (selectedAge.value < 100) {
        selectedAge.value++;
    }
};

const decrementAge = () => {
    if (selectedAge.value > 12) {
        selectedAge.value--;
    }
};

const onSelectedAge = (activeScreen) => {
    const { current } = navigator.value;

    if (activeScreen === 0) {
        useNavigator({ current, from: current, to: 1 });
    } else if (activeScreen === 1) {
        usePatientInfo({ age: selectedAge.value });

        if (patientInfo.value.patientType === 'Self') {
            useNavigator({ current, from: current, to: 3 });
        } else {
            useNavigator({ current, from: current, to: 4 });
        }
    }
};
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

.age-page {
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

// Age Orb Animation
.age-orb {
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
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
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

    &--selector {
        grid-column: 1 / 2;
        grid-row: 1 / 3;

        @media (max-width: 900px) {
            grid-column: 1;
            grid-row: auto;
        }
    }

    &--info {
        grid-column: 2 / 3;
        grid-row: 1 / 2;

        @media (max-width: 900px) {
            grid-column: 1;
            grid-row: auto;
        }
    }

    &--group {
        grid-column: 2 / 3;
        grid-row: 2 / 3;

        @media (max-width: 900px) {
            grid-column: 1;
            grid-row: auto;
        }
    }
}

// Age Display
.age-display {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 24px;
    background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
    border-radius: 16px;
    margin-bottom: 24px;

    &__value {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 120px;
    }

    .age-number {
        font-size: 64px;
        font-weight: 700;
        color: $sky-dark;
        line-height: 1;

        @media (max-width: 480px) {
            font-size: 48px;
        }
    }

    .age-label {
        font-size: 14px;
        font-weight: 500;
        color: $sky;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
}

.age-btn {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    border: 2px solid $sky;
    background: white;
    color: $sky-dark;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        background: $sky;
        color: white;
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }
}

// Slider
.age-slider {
    margin-bottom: 20px;

    &__labels {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;

        span {
            font-size: 12px;
            font-weight: 500;
            color: $gray;
        }
    }
}

.slider-input {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: #E2E8F0;
    outline: none;
    -webkit-appearance: none;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
        cursor: pointer;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(79, 195, 247, 0.4);
        transition: transform 0.2s ease;

        &:hover {
            transform: scale(1.1);
        }
    }

    &::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
        cursor: pointer;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(79, 195, 247, 0.4);
    }
}

// Quick Select
.quick-select {
    margin-bottom: 24px;

    &__label {
        display: block;
        font-size: 13px;
        color: $gray;
        margin-bottom: 10px;
    }

    &__buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
}

.quick-btn {
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid #E2E8F0;
    background: white;
    color: $slate;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        border-color: $sky;
        color: $sky-dark;
    }

    &--active {
        background: $sky-light;
        border-color: $sky;
        color: $sky-dark;
    }
}

// Continue Button
.continue-btn {
    width: 100%;
    padding: 16px 24px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border: none;
    border-radius: 14px;
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 16px rgba(79, 195, 247, 0.3);

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(79, 195, 247, 0.4);
    }

    &:active {
        transform: translateY(0);
    }
}

// Info Card Content
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

// Age Group Card
.age-group {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
    border-radius: 16px;

    &__icon {
        width: 56px;
        height: 56px;
        background: white;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $sky-dark;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    &__details {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    &__name {
        font-size: 18px;
        font-weight: 600;
        color: $sky-darker;
    }

    &__range {
        font-size: 13px;
        color: $sky-dark;
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
