<template>
    <div class="region-page">
        <!-- Step Header (Hero Style) -->
        <div class="step-hero">
            <div class="step-hero__content">
                <div class="step-hero__top">
                    <button class="step-hero__back" @click="onSubmit(0)">
                        <v-icon name="hi-arrow-left" />
                    </button>
                    <div class="step-hero__progress">
                        <span class="step-hero__step">Step 6 of 8</span>
                        <div class="step-hero__bar">
                            <div class="step-hero__fill" style="width: 75%"></div>
                        </div>
                    </div>
                </div>
                <div class="step-hero__icon">
                    <v-icon name="hi-globe" />
                </div>
                <h1 class="step-hero__title">Your Geographic Region</h1>
                <p class="step-hero__subtitle">Select your current region and any regions visited in the last 12 months</p>
            </div>
            <div class="step-hero__decoration">
                <div class="decoration-circle decoration-circle--1"></div>
                <div class="decoration-circle decoration-circle--2"></div>
                <div class="decoration-circle decoration-circle--3"></div>
            </div>
        </div>

        <!-- Region Selector -->
        <div class="region-container">
            <RegionSelector @selection="selectedRegion = $event" />
        </div>

        <!-- Info Notice -->
        <div class="region-notice">
            <div class="region-notice__icon">
                <v-icon name="hi-information-circle" />
            </div>
            <div class="region-notice__content">
                <p class="region-notice__text">
                    Regional health factors help provide more accurate assessments, as certain conditions are more prevalent in specific areas.
                </p>
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
                :class="{ 'step-footer__btn--disabled': !selectedRegion }"
                :disabled="!selectedRegion"
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
.region-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: $size-32;
    padding-bottom: $size-120;
    max-width: 800px;
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

// Region Container
.region-container {
    background: $color-white;
    border: 2px solid $color-g-92;
    border-radius: $size-20;
    padding: $size-24;
    display: flex;
    justify-content: center;

    @include responsive(phone) {
        padding: $size-16;
        border-radius: $size-16;
    }
}

// Info Notice
.region-notice {
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
