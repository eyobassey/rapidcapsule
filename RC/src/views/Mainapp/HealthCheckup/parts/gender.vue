<template>
    <div class="gender-page">
        <!-- Step Header -->
        <StepHero
            :step="1"
            :totalSteps="8"
            icon="hi-users"
            title="Select Gender"
            subtitle="Choose the gender for this health assessment"
            @back="goBack"
        />

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
        <InfoNotice
            type="info"
            text="Gender information helps provide more accurate health assessments based on biological factors."
        />
    </div>
</template>

<script setup>
import { inject } from "vue";
import StepHero from "./components/StepHero.vue";
import InfoNotice from "./components/InfoNotice.vue";

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
// Design System Colors
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;

.gender-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding-bottom: 48px;
    max-width: 600px;
    margin: 0 auto;

    @media (max-width: 640px) {
        gap: 24px;
        padding-bottom: 32px;
    }
}

// Gender Cards
.gender-cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.gender-card {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px;
    background: white;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    @media (max-width: 640px) {
        padding: 20px;
        gap: 16px;
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

        @media (max-width: 640px) {
            width: 56px;
            height: 56px;
            border-radius: 14px;
        }

        svg {
            width: 32px;
            height: 32px;

            @media (max-width: 640px) {
                width: 28px;
                height: 28px;
            }
        }
    }

    &__content {
        flex: 1;
    }

    &__title {
        font-size: 20px;
        font-weight: 600;
        color: $navy;
        margin: 0 0 4px 0;

        @media (max-width: 640px) {
            font-size: 18px;
        }
    }

    &__desc {
        font-size: 14px;
        color: $gray;
        margin: 0;

        @media (max-width: 640px) {
            font-size: 13px;
        }
    }

    &__arrow {
        flex-shrink: 0;
        transition: all 0.3s ease;

        svg {
            width: 20px;
            height: 20px;
            color: $gray;
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
</style>
