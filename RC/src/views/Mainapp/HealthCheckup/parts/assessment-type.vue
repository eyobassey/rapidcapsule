<template>
    <div class="assessment-page">
        <!-- Step Header (Hero Style) -->
        <div class="step-hero">
            <div class="step-hero__content">
                <div class="step-hero__top">
                    <button class="step-hero__back" @click="onSubmit(0)">
                        <v-icon name="hi-arrow-left" />
                    </button>
                    <div class="step-hero__progress">
                        <span class="step-hero__step">Step 3 of 8</span>
                        <div class="step-hero__bar">
                            <div class="step-hero__fill" style="width: 37.5%"></div>
                        </div>
                    </div>
                </div>
                <div class="step-hero__icon">
                    <v-icon name="hi-beaker" />
                </div>
                <h1 class="step-hero__title">Choose Assessment Type</h1>
                <p class="step-hero__subtitle">Select the depth of health analysis you'd like to receive</p>
            </div>
            <div class="step-hero__decoration">
                <div class="decoration-circle decoration-circle--1"></div>
                <div class="decoration-circle decoration-circle--2"></div>
                <div class="decoration-circle decoration-circle--3"></div>
            </div>
        </div>

        <!-- Assessment Options -->
        <div class="assessment-cards">
            <!-- Standard Assessment -->
            <div
                class="assessment-card"
                :class="{ 'assessment-card--selected': selectedType === 'standard' }"
                @click="selectAssessmentType('standard')"
            >
                <div class="assessment-card__header">
                    <div class="assessment-card__icon">
                        <v-icon name="hi-shield-check" />
                    </div>
                    <div class="assessment-card__check" v-if="selectedType === 'standard'">
                        <v-icon name="hi-check" />
                    </div>
                </div>
                <h3 class="assessment-card__title">Standard</h3>
                <p class="assessment-card__desc">Quick and comprehensive evaluation</p>
                <ul class="assessment-card__features">
                    <li>
                        <v-icon name="hi-check-circle" />
                        <span>Fast symptom analysis</span>
                    </li>
                    <li>
                        <v-icon name="hi-check-circle" />
                        <span>Evidence-based results</span>
                    </li>
                    <li>
                        <v-icon name="hi-check-circle" />
                        <span>General health concerns</span>
                    </li>
                </ul>
                <div class="assessment-card__time">
                    <v-icon name="hi-clock" />
                    <span>5-10 minutes</span>
                </div>
            </div>

            <!-- Enhanced Assessment -->
            <div
                class="assessment-card assessment-card--enhanced"
                :class="{ 'assessment-card--selected': selectedType === 'enhanced' }"
                @click="selectAssessmentType('enhanced')"
            >
                <div class="assessment-card__badge">Recommended</div>
                <div class="assessment-card__header">
                    <div class="assessment-card__icon">
                        <v-icon name="hi-sparkles" />
                    </div>
                    <div class="assessment-card__check" v-if="selectedType === 'enhanced'">
                        <v-icon name="hi-check" />
                    </div>
                </div>
                <h3 class="assessment-card__title">Enhanced</h3>
                <p class="assessment-card__desc">Advanced AI-powered analysis</p>
                <ul class="assessment-card__features">
                    <li>
                        <v-icon name="hi-check-circle" />
                        <span>Symptom duration tracking</span>
                    </li>
                    <li>
                        <v-icon name="hi-check-circle" />
                        <span>Enhanced NLP processing</span>
                    </li>
                    <li>
                        <v-icon name="hi-check-circle" />
                        <span>Improved accuracy</span>
                    </li>
                    <li>
                        <v-icon name="hi-check-circle" />
                        <span>Timeline-based tracking</span>
                    </li>
                </ul>
                <div class="assessment-card__time">
                    <v-icon name="hi-clock" />
                    <span>10-15 minutes</span>
                </div>
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
                :class="{ 'step-footer__btn--disabled': !selectedType }"
                :disabled="!selectedType"
                @click="onSubmit(1)"
            >
                <span>Continue</span>
                <v-icon name="hi-arrow-right" />
            </button>
        </div>
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
.assessment-page {
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
    padding: 24px 32px 32px;
    
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

// Assessment Cards
.assessment-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $size-20;

    @include responsive(phone) {
        grid-template-columns: 1fr;
        gap: $size-16;
    }
}

.assessment-card {
    background: $color-white;
    border: 2px solid $color-g-92;
    border-radius: $size-20;
    padding: $size-24;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    @include responsive(phone) {
        padding: $size-20;
        border-radius: $size-16;
    }

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    }

    &--selected {
        border-color: #0EAEC4;
        background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);

        .assessment-card__icon {
            background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);

            svg {
                color: white;
            }
        }
    }

    &--enhanced {
        .assessment-card__icon {
            background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%);

            svg {
                color: #7c3aed;
            }
        }

        &.assessment-card--selected {
            border-color: #7c3aed;
            background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);

            .assessment-card__icon {
                background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);

                svg {
                    color: white;
                }
            }
        }
    }

    &__badge {
        position: absolute;
        top: $size-16;
        right: $size-16;
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        color: white;
        font-size: $size-11;
        font-weight: $fw-bold;
        padding: $size-4 $size-10;
        border-radius: $size-8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    &__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: $size-16;
    }

    &__icon {
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;

        @include responsive(phone) {
            width: 48px;
            height: 48px;
            border-radius: 12px;
        }

        svg {
            width: 26px;
            height: 26px;
            color: #0284c7;

            @include responsive(phone) {
                width: 24px;
                height: 24px;
            }
        }
    }

    &__check {
        width: 28px;
        height: 28px;
        background: #10b981;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
            width: 16px;
            height: 16px;
            color: white;
        }
    }

    &__title {
        font-size: $size-20;
        font-weight: $fw-bold;
        color: $color-black;
        margin: 0 0 $size-6 0;

        @include responsive(phone) {
            font-size: $size-18;
        }
    }

    &__desc {
        font-size: $size-14;
        color: $color-g-54;
        margin: 0 0 $size-16 0;
        line-height: 1.4;

        @include responsive(phone) {
            font-size: $size-13;
        }
    }

    &__features {
        list-style: none;
        padding: 0;
        margin: 0 0 $size-20 0;

        li {
            display: flex;
            align-items: center;
            gap: $size-10;
            margin-bottom: $size-10;

            &:last-child {
                margin-bottom: 0;
            }

            svg {
                width: 18px;
                height: 18px;
                color: #10b981;
                flex-shrink: 0;
            }

            span {
                font-size: $size-13;
                color: $color-g-44;

                @include responsive(phone) {
                    font-size: $size-12;
                }
            }
        }
    }

    &__time {
        display: flex;
        align-items: center;
        gap: $size-8;
        padding-top: $size-16;
        border-top: 1px solid $color-g-92;

        svg {
            width: 18px;
            height: 18px;
            color: $color-g-54;
        }

        span {
            font-size: $size-13;
            font-weight: $fw-medium;
            color: $color-g-54;
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
