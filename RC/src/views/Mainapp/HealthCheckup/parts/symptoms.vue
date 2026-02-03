<template>
    <Loader v-if="isFetching || isLoading" :useOverlay="false" style="z-index:1" />
    <div v-else class="symptoms-page">
        <!-- Hero Section -->
        <section class="hero">
            <div class="hero__content">
                <button class="hero__back" @click="() => onSubmit(0)">
                    <v-icon name="hi-arrow-left" scale="1" />
                    <span>Back</span>
                </button>

                <div class="hero__badge">
                    <span class="badge-step">Step 7 of 8</span>
                    <span class="badge-ai">
                        <v-icon name="hi-sparkles" scale="0.8" />
                        AI Powered
                    </span>
                </div>

                <h1 class="hero__title">
                    AI-Suggested<br/>
                    <span class="hero__title-accent">Symptoms</span>
                </h1>

                <p class="hero__subtitle">
                    Based on your input, do you have any of these related symptoms?
                </p>
            </div>

            <div class="hero__visual">
                <div class="ai-orb">
                    <div class="ai-orb__inner">
                        <v-icon name="hi-sparkles" scale="3" />
                    </div>
                    <div class="ai-orb__ring"></div>
                    <div class="ai-orb__ring ai-orb__ring--delayed"></div>
                </div>
                <div class="floating-icons">
                    <div class="floating-icon floating-icon--1">
                        <v-icon name="hi-light-bulb" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--2">
                        <v-icon name="hi-chip" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--3">
                        <v-icon name="hi-check-circle" scale="1.2" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
            <!-- Symptoms Selection Card -->
            <div class="bento-card bento-card--symptoms">
                <div class="bento-card__header">
                    <v-icon name="hi-clipboard-list" scale="1.1" />
                    <span>Related Symptoms</span>
                    <span class="symptom-count">{{ selectedCount }}/{{ symptomsOptions.length }}</span>
                </div>

                <div class="symptoms-list">
                    <template v-for="symptom in symptomsOptions" :key="JSON.stringify(symptom)">
                        <div
                            class="symptom-item"
                            :class="{ 'symptom-item--selected': symptom.status }"
                            @click="symptom.status = !symptom.status"
                        >
                            <div class="symptom-item__checkbox">
                                <div class="symptom-item__check" v-if="symptom.status">
                                    <v-icon name="hi-check" scale="0.8" />
                                </div>
                            </div>
                            <span class="symptom-item__name">{{ symptom.common_name }}</span>
                        </div>
                    </template>
                </div>
            </div>

            <!-- AI Info Card -->
            <div class="bento-card bento-card--ai">
                <div class="ai-badge">
                    <v-icon name="hi-sparkles" scale="1.2" />
                </div>
                <h4 class="ai-title">Smart Suggestions</h4>
                <p class="ai-text">
                    Our AI has identified these related symptoms based on your initial input.
                    Selecting relevant symptoms helps improve diagnosis accuracy.
                </p>
                <div class="ai-tip">
                    <v-icon name="hi-information-circle" scale="0.9" />
                    <span>Tip: Select symptoms you're currently experiencing</span>
                </div>
            </div>

            <!-- Continue Card -->
            <div class="bento-card bento-card--action">
                <div class="action-content">
                    <div class="action-info">
                        <v-icon name="hi-chat-alt-2" scale="1.2" />
                        <span>Ready to start the AI interview</span>
                    </div>
                    <button
                        class="continue-btn"
                        @click="() => onSubmit(1)"
                    >
                        <span>Start Interview</span>
                        <v-icon name="hi-arrow-right" scale="1" />
                    </button>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, inject, watchEffect, onMounted, computed } from "vue";
import RcCheckbox from "@/components/inputs/check-box";
import ButtonIcon from "@/components/buttons/button-icon";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";

const $http = inject('$http');
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');
const { diagnosis, useDiagnosis } = inject('$_DIAGNOSIS');

const isLoading = ref(true);
const isFetching = ref(false);
const symptomsOptions = ref([]);
const symptoms = ref([]);

const selectedCount = computed(() => {
    return symptomsOptions.value.filter(s => s.status).length;
});

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
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;

.symptoms-page {
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
        flex-wrap: wrap;

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

        .badge-ai {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
            border-radius: 20px;
            color: white;
            font-size: 13px;
            font-weight: 600;
            animation: pulse-glow 2s ease-in-out infinite;
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

// AI Orb Animation
.ai-orb {
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

        .symptom-count {
            margin-left: auto;
            padding: 4px 10px;
            background: $sky-light;
            border-radius: 12px;
            font-size: 13px;
            color: $sky-dark;
        }
    }

    &--symptoms {
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

// Symptoms List
.symptoms-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 400px;
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

.symptom-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: $bg;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(.symptom-item--selected) {
        border-color: #CBD5E1;
        background: white;
    }

    &--selected {
        background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
        border-color: #86EFAC;

        .symptom-item__checkbox {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            border-color: transparent;
        }
    }

    &__checkbox {
        width: 22px;
        height: 22px;
        background: white;
        border: 2px solid #CBD5E1;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.2s ease;
    }

    &__check {
        svg {
            color: white;
        }
    }

    &__name {
        font-size: 14px;
        font-weight: 500;
        color: $navy;
        text-transform: capitalize;
    }
}

// AI Info Card
.bento-card--ai {
    background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%);
    border-color: #DDD6FE;
    text-align: center;
}

.ai-badge {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;

    svg {
        color: white;
    }
}

.ai-title {
    font-size: 18px;
    font-weight: 600;
    color: #5B21B6;
    margin: 0 0 8px 0;
}

.ai-text {
    font-size: 14px;
    color: #7C3AED;
    line-height: 1.6;
    margin: 0 0 16px 0;
}

.ai-tip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 14px;
    background: white;
    border-radius: 10px;
    font-size: 12px;
    color: $gray;

    svg {
        color: $sky;
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

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(79, 195, 247, 0.4);
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

@keyframes pulse-glow {
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4);
    }
    50% {
        box-shadow: 0 0 20px 4px rgba(124, 58, 237, 0.2);
    }
}
</style>
