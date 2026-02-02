<template>
    <div class="age-page">
        <!-- Step Header -->
        <StepHero
            :step="2"
            :totalSteps="8"
            icon="hi-calendar"
            :title="ageQuestion"
            subtitle="Move the slider to select age (12-100 years)"
            @back="() => onSelectedAge(0)"
        />

        <!-- Age Display Card -->
        <div class="age-display">
            <div class="age-display__value">{{ selectedAge }}</div>
            <div class="age-display__label">years old</div>
        </div>

        <!-- Slider Section -->
        <div class="age-slider">
            <div class="age-slider__labels">
                <span>12</span>
                <span>100</span>
            </div>
            <slider v-model="selectedAge" :min="12" :max="100" />
        </div>

        <!-- Info Notice -->
        <InfoNotice
            type="warning"
            title="Age Requirement"
            text="Health assessments are available for ages 12 and above. For children under 12, please consult with a pediatrician directly."
        />

        <!-- Navigation Footer -->
        <StepFooter
            @back="() => onSelectedAge(0)"
            @next="() => onSelectedAge(1)"
        />
    </div>
</template>

<script setup>
import { ref, inject, computed } from "vue";
import Slider from "@/components/inputs/slider";
import StepHero from "./components/StepHero.vue";
import StepFooter from "./components/StepFooter.vue";
import InfoNotice from "./components/InfoNotice.vue";

const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');

const selectedAge = ref(12);

const ageQuestion = computed(() => {
    const gender = patientInfo.value?.gender;
    const patientType = patientInfo.value?.patientType;

    if (patientType === 'Self') {
        return 'How old are you?';
    }

    if (gender === 'male') {
        return 'How old is he?';
    } else if (gender === 'female') {
        return 'How old is she?';
    }
    return 'What is the patient\'s age?';
});

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
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;

.age-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding-bottom: 120px;
    max-width: 600px;
    margin: 0 auto;

    @media (max-width: 640px) {
        gap: 24px;
        padding-bottom: 100px;
    }
}

// Age Display
.age-display {
    background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
    border: 2px solid #81D4FA;
    border-radius: 20px;
    padding: 32px;
    text-align: center;

    @media (max-width: 640px) {
        padding: 24px;
        border-radius: 16px;
    }

    &__value {
        font-size: 72px;
        font-weight: 700;
        color: $sky-dark;
        line-height: 1;
        margin-bottom: 8px;

        @media (max-width: 640px) {
            font-size: 56px;
        }
    }

    &__label {
        font-size: 16px;
        font-weight: 500;
        color: $sky;
        text-transform: uppercase;
        letter-spacing: 1px;

        @media (max-width: 640px) {
            font-size: 14px;
        }
    }
}

// Slider Section
.age-slider {
    padding: 0 8px;

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

    :deep(.slider) {
        width: 100%;
    }

    // Style the slider track with sky blue
    :deep(input[type="range"]) {
        &::-webkit-slider-runnable-track {
            background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
        }
        &::-webkit-slider-thumb {
            background: $sky-dark;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(79, 195, 247, 0.4);
        }
    }
}
</style>
