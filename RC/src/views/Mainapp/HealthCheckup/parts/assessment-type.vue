<template>
    <div class="assessment-page">
        <!-- Step Header -->
        <StepHero
            :step="3"
            :totalSteps="8"
            icon="hi-beaker"
            title="Choose Assessment Type"
            subtitle="Select the depth of health analysis you'd like to receive"
            @back="() => onSubmit(0)"
        />

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
        <StepFooter
            :disabled="!selectedType"
            @back="() => onSubmit(0)"
            @next="() => onSubmit(1)"
        />
    </div>
</template>

<script setup>
import { ref, inject } from "vue";
import StepHero from "./components/StepHero.vue";
import StepFooter from "./components/StepFooter.vue";

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
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;

.assessment-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding-bottom: 120px;
    max-width: 700px;
    margin: 0 auto;

    @media (max-width: 640px) {
        gap: 24px;
        padding-bottom: 100px;
    }
}

// Assessment Cards
.assessment-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
        gap: 16px;
    }
}

.assessment-card {
    background: white;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 20px;
    padding: 24px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    @media (max-width: 640px) {
        padding: 20px;
        border-radius: 16px;
    }

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
    }

    &--selected {
        border-color: $sky;
        background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);

        .assessment-card__icon {
            background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);

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
        top: 16px;
        right: 16px;
        background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
        color: white;
        font-size: 11px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    &__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 16px;
    }

    &__icon {
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;

        @media (max-width: 640px) {
            width: 48px;
            height: 48px;
            border-radius: 12px;
        }

        svg {
            width: 26px;
            height: 26px;
            color: $sky-dark;

            @media (max-width: 640px) {
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
        font-size: 20px;
        font-weight: 700;
        color: $navy;
        margin: 0 0 6px 0;

        @media (max-width: 640px) {
            font-size: 18px;
        }
    }

    &__desc {
        font-size: 14px;
        color: $gray;
        margin: 0 0 16px 0;
        line-height: 1.4;

        @media (max-width: 640px) {
            font-size: 13px;
        }
    }

    &__features {
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
                width: 18px;
                height: 18px;
                color: #10b981;
                flex-shrink: 0;
            }

            span {
                font-size: 13px;
                color: $slate;

                @media (max-width: 640px) {
                    font-size: 12px;
                }
            }
        }
    }

    &__time {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-top: 16px;
        border-top: 1px solid rgba(0, 0, 0, 0.08);

        svg {
            width: 18px;
            height: 18px;
            color: $gray;
        }

        span {
            font-size: 13px;
            font-weight: 500;
            color: $gray;
        }
    }
}
</style>
