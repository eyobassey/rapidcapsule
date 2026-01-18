<template>
    <div class="age-page">
        <!-- Step Header (Hero Style) -->
        <div class="step-hero">
            <div class="step-hero__content">
                <div class="step-hero__top">
                    <button class="step-hero__back" @click="onSelectedAge(0)">
                        <v-icon name="hi-arrow-left" />
                    </button>
                    <div class="step-hero__progress">
                        <span class="step-hero__step">Step 2 of 8</span>
                        <div class="step-hero__bar">
                            <div class="step-hero__fill" style="width: 25%"></div>
                        </div>
                    </div>
                </div>
                <div class="step-hero__icon">
                    <v-icon name="hi-calendar" />
                </div>
                <h1 class="step-hero__title">{{ ageQuestion }}</h1>
                <p class="step-hero__subtitle">Move the slider to select age (12-100 years)</p>
            </div>
            <div class="step-hero__decoration">
                <div class="decoration-circle decoration-circle--1"></div>
                <div class="decoration-circle decoration-circle--2"></div>
                <div class="decoration-circle decoration-circle--3"></div>
            </div>
        </div>

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
        <div class="age-notice">
            <div class="age-notice__icon">
                <v-icon name="hi-information-circle" />
            </div>
            <div class="age-notice__content">
                <p class="age-notice__title">Age Requirement</p>
                <p class="age-notice__text">
                    Health assessments are available for ages 12 and above. For children under 12, please consult with a pediatrician directly.
                </p>
            </div>
        </div>

        <!-- Navigation Footer -->
        <div class="step-footer">
            <button class="step-footer__btn step-footer__btn--back" @click="onSelectedAge(0)">
                <v-icon name="hi-arrow-left" />
                <span>Back</span>
            </button>
            <button class="step-footer__btn step-footer__btn--next" @click="onSelectedAge(1)">
                <span>Continue</span>
                <v-icon name="hi-arrow-right" />
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, inject, computed } from "vue";
import Slider from "@/components/inputs/slider";

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
.age-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: $size-32;
    padding-bottom: $size-120;
    max-width: 600px;
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

// Age Display
.age-display {
    background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
    border: 2px solid #99f6e4;
    border-radius: $size-20;
    padding: $size-32;
    text-align: center;

    @include responsive(phone) {
        padding: $size-24;
        border-radius: $size-16;
    }

    &__value {
        font-size: 72px;
        font-weight: $fw-bold;
        color: #0d9488;
        line-height: 1;
        margin-bottom: $size-8;

        @include responsive(phone) {
            font-size: 56px;
        }
    }

    &__label {
        font-size: $size-16;
        font-weight: $fw-medium;
        color: #14b8a6;
        text-transform: uppercase;
        letter-spacing: 1px;

        @include responsive(phone) {
            font-size: $size-14;
        }
    }
}

// Slider Section
.age-slider {
    padding: 0 $size-8;

    &__labels {
        display: flex;
        justify-content: space-between;
        margin-bottom: $size-8;

        span {
            font-size: $size-12;
            font-weight: $fw-medium;
            color: $color-g-54;
        }
    }

    :deep(.slider) {
        width: 100%;
    }
}

// Info Notice
.age-notice {
    display: flex;
    align-items: flex-start;
    gap: $size-14;
    padding: $size-18;
    background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
    border: 1px solid #fde047;
    border-radius: $size-14;

    @include responsive(phone) {
        padding: $size-16;
        gap: $size-12;
    }

    &__icon {
        flex-shrink: 0;
        width: 36px;
        height: 36px;
        background: #fef08a;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;

        @include responsive(phone) {
            width: 32px;
            height: 32px;
        }

        svg {
            width: 20px;
            height: 20px;
            color: #ca8a04;

            @include responsive(phone) {
                width: 18px;
                height: 18px;
            }
        }
    }

    &__content {
        flex: 1;
    }

    &__title {
        font-size: $size-14;
        font-weight: $fw-semi-bold;
        color: #a16207;
        margin: 0 0 $size-4 0;
    }

    &__text {
        font-size: $size-13;
        color: #a16207;
        margin: 0;
        line-height: 1.5;

        @include responsive(phone) {
            font-size: $size-12;
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

            &:hover {
                box-shadow: 0 6px 20px rgba(14, 174, 196, 0.5);
                transform: translateY(-1px);
            }
        }
    }
}
</style>
