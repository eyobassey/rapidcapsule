<template>
    <div class="gender-page">
        <!-- Step Header (Hero Style) -->
        <div class="step-hero">
            <div class="step-hero__content">
                <div class="step-hero__top">
                    <button class="step-hero__back" @click="goBack">
                        <v-icon name="hi-arrow-left" />
                    </button>
                    <div class="step-hero__progress">
                        <span class="step-hero__step">Step 1 of 8</span>
                        <div class="step-hero__bar">
                            <div class="step-hero__fill" style="width: 12.5%"></div>
                        </div>
                    </div>
                </div>
                <div class="step-hero__icon">
                    <v-icon name="hi-users" />
                </div>
                <h1 class="step-hero__title">Select Gender</h1>
                <p class="step-hero__subtitle">Choose the gender for this health assessment</p>
            </div>
            <div class="step-hero__decoration">
                <div class="decoration-circle decoration-circle--1"></div>
                <div class="decoration-circle decoration-circle--2"></div>
                <div class="decoration-circle decoration-circle--3"></div>
            </div>
        </div>

        <!-- Gender Cards -->
        <div class="gender-cards">
            <div class="gender-card gender-card--male" @click="onSelectedGender('male')">
                <div class="gender-card__icon">
                    <v-icon name="io-male-sharp" />
                </div>
                <div class="gender-card__content">
                    <h3 class="gender-card__title">Male</h3>
                    <p class="gender-card__desc">Select for male patient</p>
                </div>
                <div class="gender-card__arrow">
                    <v-icon name="hi-arrow-right" />
                </div>
            </div>

            <div class="gender-card gender-card--female" @click="onSelectedGender('female')">
                <div class="gender-card__icon">
                    <v-icon name="io-female-sharp" />
                </div>
                <div class="gender-card__content">
                    <h3 class="gender-card__title">Female</h3>
                    <p class="gender-card__desc">Select for female patient</p>
                </div>
                <div class="gender-card__arrow">
                    <v-icon name="hi-arrow-right" />
                </div>
            </div>
        </div>

        <!-- Info Notice -->
        <div class="gender-notice">
            <div class="gender-notice__icon">
                <v-icon name="hi-information-circle" />
            </div>
            <p class="gender-notice__text">
                Gender information helps provide more accurate health assessments based on biological factors.
            </p>
        </div>
    </div>
</template>

<script setup>
import { inject } from "vue";

const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');

const goBack = () => {
    const { current } = navigator.value;
    useNavigator({ current, from: current, to: 0 });
};

const onSelectedGender = (gender) => {
    const { current } = navigator.value;
    usePatientInfo({ gender });
    useNavigator({ current, from: current, to: 2 });
};
</script>

<style scoped lang="scss">
.gender-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: $size-32;
    padding-bottom: $size-48;
    max-width: 600px;
    margin: 0 auto;

    @include responsive(phone) {
        gap: $size-24;
        padding-bottom: $size-32;
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

// Gender Cards
.gender-cards {
    display: flex;
    flex-direction: column;
    gap: $size-16;
}

.gender-card {
    display: flex;
    align-items: center;
    gap: $size-20;
    padding: $size-24;
    background: $color-white;
    border: 2px solid $color-g-92;
    border-radius: $size-16;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    @include responsive(phone) {
        padding: $size-20;
        gap: $size-16;
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);

        .gender-card__arrow {
            transform: translateX(4px);
        }
    }

    &:active {
        transform: translateY(0);
    }

    &__icon {
        width: 64px;
        height: 64px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.3s ease;

        @include responsive(phone) {
            width: 56px;
            height: 56px;
            border-radius: 14px;
        }

        svg {
            width: 32px;
            height: 32px;

            @include responsive(phone) {
                width: 28px;
                height: 28px;
            }
        }
    }

    &__content {
        flex: 1;
    }

    &__title {
        font-size: $size-20;
        font-weight: $fw-semi-bold;
        color: $color-black;
        margin: 0 0 $size-4 0;

        @include responsive(phone) {
            font-size: $size-18;
        }
    }

    &__desc {
        font-size: $size-14;
        color: $color-g-54;
        margin: 0;

        @include responsive(phone) {
            font-size: $size-13;
        }
    }

    &__arrow {
        flex-shrink: 0;
        transition: all 0.3s ease;

        svg {
            width: 20px;
            height: 20px;
            color: $color-g-77;
        }
    }

    // Male variant
    &--male {
        &:hover {
            border-color: #3b82f6;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);

            .gender-card__icon {
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);

                svg {
                    color: white;
                }
            }

            .gender-card__arrow svg {
                color: #3b82f6;
            }
        }

        .gender-card__icon {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);

            svg {
                color: #3b82f6;
            }
        }
    }

    // Female variant
    &--female {
        &:hover {
            border-color: #ec4899;
            background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);

            .gender-card__icon {
                background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);

                svg {
                    color: white;
                }
            }

            .gender-card__arrow svg {
                color: #ec4899;
            }
        }

        .gender-card__icon {
            background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);

            svg {
                color: #ec4899;
            }
        }
    }
}

// Info Notice
.gender-notice {
    display: flex;
    align-items: flex-start;
    gap: $size-12;
    padding: $size-16;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: $size-12;

    @include responsive(phone) {
        padding: $size-14;
    }

    &__icon {
        flex-shrink: 0;

        svg {
            width: 20px;
            height: 20px;
            color: #0284c7;
        }
    }

    &__text {
        font-size: $size-13;
        color: #0369a1;
        margin: 0;
        line-height: 1.5;

        @include responsive(phone) {
            font-size: $size-12;
        }
    }
}
</style>
