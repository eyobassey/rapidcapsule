<template>
    <Loader v-if="isFetching || isLoading" :useOverlay="false" style="z-index:1" />
    <div v-else class="symptoms-page">
        <!-- Step Header (Hero Style) -->
        <div class="step-hero">
            <div class="step-hero__content">
                <div class="step-hero__top">
                    <button class="step-hero__back" @click="onSubmit(0)">
                        <v-icon name="hi-arrow-left" />
                    </button>
                    <div class="step-hero__progress">
                        <span class="step-hero__step">Step 7 of 8</span>
                        <div class="step-hero__bar">
                            <div class="step-hero__fill" style="width: 87.5%"></div>
                        </div>
                    </div>
                </div>
                <div class="step-hero__icon">
                    <v-icon name="hi-sparkles" />
                </div>
                <h1 class="step-hero__title">AI-Suggested Symptoms</h1>
                <p class="step-hero__subtitle">Based on your input, do you have any of the following symptoms?</p>
            </div>
            <div class="step-hero__decoration">
                <div class="decoration-circle decoration-circle--1"></div>
                <div class="decoration-circle decoration-circle--2"></div>
                <div class="decoration-circle decoration-circle--3"></div>
            </div>
        </div>

        <!-- AI Notice -->
        <div class="ai-notice">
            <div class="ai-notice__icon">
                <v-icon name="hi-light-bulb" />
            </div>
            <div class="ai-notice__content">
                <p class="ai-notice__title">Smart Suggestions</p>
                <p class="ai-notice__text">
                    Our AI has identified these related symptoms based on your initial input. Selecting relevant symptoms helps improve diagnosis accuracy.
                </p>
            </div>
        </div>

        <!-- Symptoms List -->
        <div class="symptoms-cards">
            <template v-for="symptom in symptomsOptions" :key="JSON.stringify(symptom)">
                <div
                    class="symptom-card"
                    :class="{ 'symptom-card--selected': symptom.status }"
                    @click="symptom.status = !symptom.status"
                >
                    <div class="symptom-card__checkbox">
                        <div class="symptom-card__check" v-if="symptom.status">
                            <v-icon name="hi-check" />
                        </div>
                    </div>
                    <div class="symptom-card__content">
                        <span class="symptom-card__name">{{ symptom.common_name }}</span>
                    </div>
                </div>
            </template>
        </div>

        <!-- Navigation Footer -->
        <div class="step-footer">
            <button class="step-footer__btn step-footer__btn--back" @click="onSubmit(0)">
                <v-icon name="hi-arrow-left" />
                <span>Back</span>
            </button>
            <button
                class="step-footer__btn step-footer__btn--next"
                @click="onSubmit(1)"
            >
                <span>Start Interview</span>
                <v-icon name="hi-arrow-right" />
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, inject, watchEffect, onMounted } from "vue";
import RcCheckbox from "@/components/inputs/check-box";
import ButtonIcon from "@/components/buttons/button-icon";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";

const $http = inject('$http');
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');
const { diagnosis, useDiagnosis } = inject('$_DIAGNOSIS');

const isLoading = ref(true);
const symptomsOptions = ref([]);
const symptoms = ref([]);

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
.symptoms-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: $size-24;
    padding-bottom: $size-120;
    max-width: 700px;
    margin: 0 auto;

    @include responsive(phone) {
        gap: $size-20;
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

// AI Notice
.ai-notice {
    display: flex;
    align-items: flex-start;
    gap: $size-14;
    padding: $size-18;
    background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
    border: 1px solid #d8b4fe;
    border-radius: $size-14;

    @include responsive(phone) {
        padding: $size-16;
        gap: $size-12;
    }

    &__icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;

        @include responsive(phone) {
            width: 36px;
            height: 36px;
        }

        svg {
            width: 22px;
            height: 22px;
            color: white;

            @include responsive(phone) {
                width: 20px;
                height: 20px;
            }
        }
    }

    &__content {
        flex: 1;
    }

    &__title {
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        color: #7c3aed;
        margin: 0 0 $size-4 0;
    }

    &__text {
        font-size: $size-13;
        color: #6b21a8;
        margin: 0;
        line-height: 1.5;

        @include responsive(phone) {
            font-size: $size-12;
        }
    }
}

// Symptoms Cards
.symptoms-cards {
    display: flex;
    flex-direction: column;
    gap: $size-12;
}

.symptom-card {
    display: flex;
    align-items: center;
    gap: $size-14;
    padding: $size-16 $size-20;
    background: $color-white;
    border: 2px solid $color-g-92;
    border-radius: $size-14;
    cursor: pointer;
    transition: all 0.3s ease;

    @include responsive(phone) {
        padding: $size-14 $size-16;
    }

    &:hover {
        border-color: $color-g-85;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    &--selected {
        border-color: #10b981;
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);

        .symptom-card__checkbox {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-color: transparent;
        }
    }

    &__checkbox {
        width: 24px;
        height: 24px;
        background: $color-white;
        border: 2px solid $color-g-85;
        border-radius: $size-6;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.3s ease;
    }

    &__check {
        svg {
            width: 16px;
            height: 16px;
            color: white;
        }
    }

    &__content {
        flex: 1;
    }

    &__name {
        font-size: $size-15;
        font-weight: $fw-medium;
        color: $color-black;
        text-transform: capitalize;

        @include responsive(phone) {
            font-size: $size-14;
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
