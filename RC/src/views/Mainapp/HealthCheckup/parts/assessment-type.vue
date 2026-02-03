<template>
    <div class="assessment-page">
        <!-- Hero Section -->
        <section class="hero">
            <div class="hero__content">
                <button class="hero__back" @click="() => onSubmit(0)">
                    <v-icon name="hi-arrow-left" scale="1" />
                    <span>Back</span>
                </button>

                <div class="hero__badge">
                    <span class="badge-step">Step 3 of 8</span>
                </div>

                <h1 class="hero__title">
                    Choose Your<br/>
                    <span class="hero__title-accent">Assessment Type</span>
                </h1>

                <p class="hero__subtitle">
                    Select the depth of health analysis you'd like to receive
                </p>
            </div>

            <div class="hero__visual">
                <div class="assessment-orb">
                    <div class="assessment-orb__inner">
                        <v-icon name="hi-beaker" scale="3" />
                    </div>
                    <div class="assessment-orb__ring"></div>
                    <div class="assessment-orb__ring assessment-orb__ring--delayed"></div>
                </div>
                <div class="floating-icons">
                    <div class="floating-icon floating-icon--1">
                        <v-icon name="hi-shield-check" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--2">
                        <v-icon name="hi-sparkles" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--3">
                        <v-icon name="hi-chart-bar" scale="1.2" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
            <!-- Standard Assessment Card -->
            <div
                class="bento-card bento-card--option bento-card--standard"
                :class="{ 'bento-card--selected': selectedType === 'standard' }"
                @click="selectAssessmentType('standard')"
            >
                <div class="recommended-badge">Recommended</div>
                <div class="option-header">
                    <div class="option-icon">
                        <v-icon name="hi-shield-check" scale="1.5" />
                    </div>
                    <div class="option-check" v-if="selectedType === 'standard'">
                        <v-icon name="hi-check" scale="1" />
                    </div>
                </div>
                <h3 class="option-title">Standard</h3>
                <p class="option-desc">Quick and comprehensive evaluation</p>
                <ul class="option-features">
                    <li>
                        <v-icon name="hi-check-circle" scale="0.9" />
                        <span>Fast symptom analysis</span>
                    </li>
                    <li>
                        <v-icon name="hi-check-circle" scale="0.9" />
                        <span>Evidence-based results</span>
                    </li>
                    <li>
                        <v-icon name="hi-check-circle" scale="0.9" />
                        <span>General health concerns</span>
                    </li>
                </ul>
                <div class="option-time">
                    <v-icon name="hi-clock" scale="0.9" />
                    <span>5-10 minutes</span>
                </div>
            </div>

            <!-- Enhanced Assessment Card -->
            <div
                class="bento-card bento-card--option bento-card--enhanced"
                :class="{ 'bento-card--selected': selectedType === 'enhanced' }"
                @click="selectAssessmentType('enhanced')"
            >
                <div class="option-header">
                    <div class="option-icon option-icon--enhanced">
                        <v-icon name="hi-sparkles" scale="1.5" />
                    </div>
                    <div class="option-check" v-if="selectedType === 'enhanced'">
                        <v-icon name="hi-check" scale="1" />
                    </div>
                </div>
                <h3 class="option-title">Enhanced</h3>
                <p class="option-desc">Advanced AI-powered analysis</p>
                <ul class="option-features">
                    <li>
                        <v-icon name="hi-check-circle" scale="0.9" />
                        <span>Symptom duration tracking</span>
                    </li>
                    <li>
                        <v-icon name="hi-check-circle" scale="0.9" />
                        <span>Enhanced NLP processing</span>
                    </li>
                    <li>
                        <v-icon name="hi-check-circle" scale="0.9" />
                        <span>Improved accuracy</span>
                    </li>
                    <li>
                        <v-icon name="hi-check-circle" scale="0.9" />
                        <span>Timeline-based tracking</span>
                    </li>
                </ul>
                <div class="option-time">
                    <v-icon name="hi-clock" scale="0.9" />
                    <span>10-15 minutes</span>
                </div>
            </div>

            <!-- Info Card -->
            <div class="bento-card bento-card--info">
                <div class="bento-card__header">
                    <v-icon name="hi-information-circle" scale="1.1" />
                    <span>Which should I choose?</span>
                </div>
                <p class="info-text">
                    <strong>Standard</strong> is ideal for quick health checks when you have common symptoms
                    and want rapid results.
                </p>
                <p class="info-text">
                    <strong>Enhanced</strong> provides more detailed analysis by tracking how long you've
                    experienced each symptom, resulting in more precise recommendations.
                </p>
            </div>

            <!-- Continue Card -->
            <div class="bento-card bento-card--action">
                <div class="action-content">
                    <div class="action-info">
                        <v-icon name="hi-lightning-bolt" scale="1.2" />
                        <span>{{ selectedType ? `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} selected` : 'Select an option to continue' }}</span>
                    </div>
                    <button
                        class="continue-btn"
                        :class="{ 'continue-btn--disabled': !selectedType }"
                        :disabled="!selectedType"
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
import { ref, inject } from "vue";

const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');
const { diagnosis, useDiagnosis } = inject('$_DIAGNOSIS');

const selectedType = ref('');

const selectAssessmentType = (type) => {
    selectedType.value = type;
};

const onSubmit = (activeScreen) => {
    const { current } = navigator.value;

    if (activeScreen === 0) {
        useNavigator({ current, from: current, to: 3 });
    } else if (activeScreen === 1) {
        usePatientInfo({
            ...patientInfo.value,
            assessmentType: selectedType.value
        });

        useDiagnosis({
            ...diagnosis.value,
            extras: {
                ...(diagnosis.value.extras || {}),
                enable_symptom_duration: selectedType.value === 'enhanced',
                enable_enhanced_nlp: selectedType.value === 'enhanced',
                assessment_type: selectedType.value
            }
        });

        useNavigator({ current, from: current, to: 4 });
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

.assessment-page {
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

// Assessment Orb Animation
.assessment-orb {
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
        margin-bottom: 16px;
        color: $slate;
        font-weight: 600;
        font-size: 15px;

        svg {
            color: $sky;
        }
    }

    &--option {
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;

        &:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
        }
    }

    &--selected {
        border-color: $sky;
        background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);

        .option-icon {
            background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);

            svg {
                color: white;
            }
        }
    }

    &--enhanced {
        &.bento-card--selected {
            border-color: #7c3aed;
            background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);

            .option-icon--enhanced {
                background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);

                svg {
                    color: white;
                }
            }
        }
    }

    &--info {
        grid-column: 1 / -1;

        @media (max-width: 900px) {
            grid-column: 1;
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

// Option Card Styles
.recommended-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.option-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
}

.option-icon {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    svg {
        color: $sky-dark;
    }

    &--enhanced {
        background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%);

        svg {
            color: #7c3aed;
        }
    }
}

.option-check {
    width: 32px;
    height: 32px;
    background: #10b981;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        color: white;
    }
}

.option-title {
    font-size: 22px;
    font-weight: 700;
    color: $navy;
    margin: 0 0 6px 0;
}

.option-desc {
    font-size: 14px;
    color: $gray;
    margin: 0 0 16px 0;
    line-height: 1.4;
}

.option-features {
    list-style: none;
    padding: 0;
    margin: 0 0 20px 0;

    li {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;

        &:last-child {
            margin-bottom: 0;
        }

        svg {
            color: #10b981;
            flex-shrink: 0;
        }

        span {
            font-size: 13px;
            color: $slate;
        }
    }
}

.option-time {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);

    svg {
        color: $gray;
    }

    span {
        font-size: 13px;
        font-weight: 500;
        color: $gray;
    }
}

// Info Card
.info-text {
    font-size: 14px;
    color: $gray;
    line-height: 1.6;
    margin: 0 0 12px 0;

    &:last-child {
        margin-bottom: 0;
    }

    strong {
        color: $slate;
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
