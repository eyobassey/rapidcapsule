<template>
    <div class="confirm-page">
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
                    Confirm Your<br/>
                    <span class="hero__title-accent">Information</span>
                </h1>

                <p class="hero__subtitle">
                    Please verify that the following health information is correct before proceeding
                </p>
            </div>

            <div class="hero__visual">
                <div class="confirm-orb">
                    <div class="confirm-orb__inner">
                        <v-icon name="hi-clipboard-check" scale="3" />
                    </div>
                    <div class="confirm-orb__ring"></div>
                    <div class="confirm-orb__ring confirm-orb__ring--delayed"></div>
                </div>
                <div class="floating-icons">
                    <div class="floating-icon floating-icon--1">
                        <v-icon name="hi-check-circle" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--2">
                        <v-icon name="hi-document-text" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--3">
                        <v-icon name="hi-shield-check" scale="1.2" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
            <!-- Health Info Card -->
            <div class="bento-card bento-card--info">
                <div class="bento-card__header">
                    <v-icon name="hi-heart" scale="1.1" />
                    <span>Health Information</span>
                </div>

                <div class="info-list">
                    <!-- Height Card -->
                    <div
                        class="info-item"
                        :class="{ 'info-item--confirmed': healthCheckInfo.basic_health_info?.height?.status }"
                    >
                        <div class="info-item__icon">
                            <v-icon name="hi-arrow-up" scale="1" />
                        </div>
                        <div class="info-item__content">
                            <span class="info-item__label">Height</span>
                            <span class="info-item__value">{{ healthCheckInfo.basic_health_info?.height?.value }}{{ healthCheckInfo.basic_health_info?.height?.unit }}</span>
                        </div>
                        <div v-if="healthCheckInfo.basic_health_info?.height?.status" class="info-item__status">
                            <v-icon name="hi-check" scale="0.9" />
                        </div>
                        <div v-else class="info-item__actions">
                            <button class="action-btn action-btn--edit" @click="onOpenBasicHealthInfo('height', {...healthCheckInfo.basic_health_info.height})">
                                <v-icon name="hi-pencil" scale="0.9" />
                            </button>
                            <button class="action-btn action-btn--confirm" @click="healthCheckInfo.basic_health_info.height.status = 'correct'">
                                <v-icon name="hi-check" scale="0.9" />
                            </button>
                        </div>
                    </div>

                    <!-- Weight Card -->
                    <div
                        class="info-item"
                        :class="{ 'info-item--confirmed': healthCheckInfo.basic_health_info?.weight?.status }"
                    >
                        <div class="info-item__icon info-item__icon--weight">
                            <v-icon name="hi-scale" scale="1" />
                        </div>
                        <div class="info-item__content">
                            <span class="info-item__label">Weight</span>
                            <span class="info-item__value">{{ healthCheckInfo.basic_health_info?.weight?.value }}{{ healthCheckInfo.basic_health_info?.weight?.unit }}</span>
                        </div>
                        <div v-if="healthCheckInfo.basic_health_info?.weight?.status" class="info-item__status">
                            <v-icon name="hi-check" scale="0.9" />
                        </div>
                        <div v-else class="info-item__actions">
                            <button class="action-btn action-btn--edit" @click="onOpenBasicHealthInfo('weight', {...healthCheckInfo.basic_health_info.weight})">
                                <v-icon name="hi-pencil" scale="0.9" />
                            </button>
                            <button class="action-btn action-btn--confirm" @click="healthCheckInfo.basic_health_info.weight.status = 'correct'">
                                <v-icon name="hi-check" scale="0.9" />
                            </button>
                        </div>
                    </div>

                    <!-- Smoking Status Card -->
                    <div
                        v-if="healthCheckInfo.health_risk_factors?.is_smoker"
                        class="info-item"
                        :class="{ 'info-item--confirmed': isSmokerStatus }"
                    >
                        <div class="info-item__icon info-item__icon--smoke">
                            <v-icon name="hi-fire" scale="1" />
                        </div>
                        <div class="info-item__content">
                            <span class="info-item__label">Smoking Status</span>
                            <span class="info-item__value">{{ healthCheckInfo.health_risk_factors.is_smoker === 'No' ? 'Non-smoker' : 'Smoker' }}</span>
                        </div>
                        <div v-if="isSmokerStatus" class="info-item__status">
                            <v-icon name="hi-check" scale="0.9" />
                        </div>
                        <div v-else class="info-item__actions">
                            <button
                                class="action-btn action-btn--edit"
                                @click="onSubmitHealthRiskFactors({ key: 'is_smoker', value: healthCheckInfo.health_risk_factors.is_smoker })"
                                :disabled="isFetching"
                            >
                                <v-icon name="hi-switch-horizontal" scale="0.9" />
                            </button>
                            <button class="action-btn action-btn--confirm" @click="isSmokerStatus = 'correct'" :disabled="isFetching">
                                <v-icon name="hi-check" scale="0.9" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pre-existing Conditions Card -->
            <div class="bento-card bento-card--conditions" v-if="healthCheckInfo.pre_existing_conditions?.length > 0">
                <div class="bento-card__header">
                    <v-icon name="hi-document-report" scale="1.1" />
                    <span>Pre-existing Conditions</span>
                </div>

                <div class="conditions-list">
                    <template v-for="(item, index) in healthCheckInfo.pre_existing_conditions" :key="index">
                        <div
                            class="condition-item"
                            :class="{ 'condition-item--confirmed': item.status }"
                        >
                            <div class="condition-item__icon">
                                <v-icon name="hi-heart" scale="0.9" />
                            </div>
                            <span class="condition-item__name">{{ item.name }}</span>
                            <div v-if="item.status" class="condition-item__status">
                                <v-icon name="hi-check" scale="0.8" />
                            </div>
                            <div v-else class="condition-item__actions">
                                <button class="action-btn action-btn--small" @click="onSubmitPreExistingConditions(index, {...item})">
                                    <v-icon name="hi-x" scale="0.8" />
                                </button>
                                <button class="action-btn action-btn--small action-btn--confirm" @click="item.status = 'correct'">
                                    <v-icon name="hi-check" scale="0.8" />
                                </button>
                            </div>
                        </div>
                    </template>
                </div>
            </div>

            <!-- Notice Card -->
            <div class="bento-card bento-card--notice">
                <div class="notice-icon">
                    <v-icon name="hi-information-circle" scale="1.3" />
                </div>
                <p class="notice-text">
                    Changes made here will be saved to your profile for future health assessments.
                </p>
            </div>

            <!-- Continue Card -->
            <div class="bento-card bento-card--action">
                <div class="action-content">
                    <div class="action-info">
                        <v-icon name="hi-arrow-right" scale="1.2" />
                        <span>Ready to continue?</span>
                    </div>
                    <button
                        class="continue-btn"
                        :class="{ 'continue-btn--disabled': !canProceed }"
                        :disabled="!canProceed"
                        @click="() => onSubmit(1)"
                    >
                        <span>Continue</span>
                        <v-icon name="hi-arrow-right" scale="1" />
                    </button>
                </div>
            </div>
        </section>
    </div>

    <!-- Edit Modal -->
    <rc-modal
        v-if="isOpenBasicHealthInfo"
        :title="`Update ${basic_health_info.type?.toLowerCase()?.replace(/\b\w/g, l => l.toUpperCase())}`"
        @closeModal="isOpenBasicHealthInfo = false"
        :has-footer="true"
    >
        <template v-slot:body>
            <DigitsSuffix
                :label="basic_health_info.type"
                :name="basic_health_info.type"
                :options="basic_health_info.type === 'height' ? ['cm', 'm'] : ['kg', 'g']"
                v-model="basic_health_info.value.unit"
                v-model:number-input="basic_health_info.value.value"
            />
        </template>
        <template v-slot:foot>
            <rc-button
                type="primary"
                size="medium"
                label="Save Changes"
                :loading="isFetching"
                :disabled="isFetching"
                @click="onSubmitBasicHealthInfo({[basic_health_info.type]: basic_health_info.value})"
            />
        </template>
    </rc-modal>
</template>

<script setup>
import { ref, watchEffect, inject, onUnmounted, computed } from "vue";
import { useToast } from 'vue-toast-notification';
import { useRoute } from 'vue-router';
import { isBoolean } from "lodash";
import RcButton from "@/components/buttons/button-primary";
import RcModal from "@/components/modals/dialog-modal";
import DigitsSuffix from "@/components/inputs/digits-suffix";
import { mapGetters } from "@/utilities/utilityStore";

const $toast = useToast();
const route = useRoute();
const $http = inject("$_HTTP");
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');

const { userprofile } = mapGetters();
const userInfo = {...userprofile.value};
const props = defineProps(['userInfo']);

const isOpenBasicHealthInfo = ref(false);
const isFetching = ref(false);
const isOpenHeight = ref(false);
const isOpenWeight = ref(false);
const isSmokerStatus = ref(null);
const basic_health_info = ref({});
const healthCheckInfo = ref({});

const canProceed = computed(() => {
    return isSmokerStatus.value ||
           healthCheckInfo.value.basic_health_info?.height?.status ||
           healthCheckInfo.value.basic_health_info?.weight?.status;
});

watchEffect(() => {
    if (userInfo) {
        healthCheckInfo.value = {
            ...healthCheckInfo.value,
            basic_health_info: userInfo?.profile?.basic_health_info,
            health_risk_factors: userInfo?.profile?.health_risk_factors,
            pre_existing_conditions: userInfo?.pre_existing_conditions
        }
    }
});

onUnmounted(() => {
    isSmokerStatus.value = null;
    healthCheckInfo.value.basic_health_info.height.status = null;
    healthCheckInfo.value.basic_health_info.weight.status = null;
})

const onOpenBasicHealthInfo = (type, value) => {
    basic_health_info.value = { type, value };
    isOpenBasicHealthInfo.value = true;
}

const onSubmitBasicHealthInfo = async (basicInfo) => {
    isFetching.value = true;

    const payload = {
        userId: userInfo.id,
        payload: {...userInfo, profile: {...userInfo.profile, basic_health_info: basicInfo}}
    }

    await $http.$_updateCurrentUser(payload).then(({ data }) => {
        $toast.success(data.message, { duration: 3000 });
        healthCheckInfo.value.basic_health_info[basic_health_info.value.type] = {
            ...basicInfo, status: 'updated'
        }
        isFetching.value = false;
        isOpenBasicHealthInfo.value = false;
    }).catch((error) => {
        $toast.error(error.message, { duration: 3000 });
    })
}

const onSubmitHealthRiskFactors = async ({ key, value }) => {
    isFetching.value = true;
    if (key === 'is_smoker') value = value === 'No' ? 'Yes' : 'No';
    const health_risk_factors = {...healthCheckInfo.value.health_risk_factors, [key]: value};

    const payload = {
        userId: userInfo.id,
        payload: {...userInfo, profile: {...userInfo.profile, health_risk_factors}}
    }

    await $http.$_updateCurrentUser(payload).then(({ data }) => {
        healthCheckInfo.value.health_risk_factors = health_risk_factors;
        $toast.success(data.message, { duration: 3000 });
        isSmokerStatus.value = 'updated';
        isFetching.value = false;
    }).catch((error) => {
        $toast.error(error.message, { duration: 3000 });
        isFetching.value = false;
    });
}

const onSubmitPreExistingConditions = () => {}

const onSubmit = (activeScreen) => {
    const { current, from, to } = navigator.value;
    isSmokerStatus.value = null;
    healthCheckInfo.value.basic_health_info.height.status = null;
    healthCheckInfo.value.basic_health_info.weight.status = null;

    if (activeScreen === 0) {
        usePatientInfo(patientInfo.value);
        useNavigator({ current, from: current, to: 0 });
    } else if(activeScreen === 1) {
        usePatientInfo(patientInfo.value);
        // Check if we're in the enhanced flow
        const isEnhancedFlow = route.path.includes('health-checkup-enhanced');
        if (isEnhancedFlow) {
            // In enhanced flow, skip assessment type selection and go to risk factors
            useNavigator({ current, from: current, to: 4 });
        } else {
            // In standard flow, go to assessment type selection
            useNavigator({ current, from: current, to: 3.5 });
        }
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

.confirm-page {
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

// Confirm Orb Animation
.confirm-orb {
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
        margin-bottom: 20px;
        color: $slate;
        font-weight: 600;
        font-size: 15px;

        svg {
            color: $sky;
        }
    }

    &--info {
        grid-column: 1 / 2;
        grid-row: 1 / 3;

        @media (max-width: 900px) {
            grid-column: 1;
            grid-row: auto;
        }
    }

    &--conditions {
        grid-column: 2 / 3;
        grid-row: 1 / 2;

        @media (max-width: 900px) {
            grid-column: 1;
            grid-row: auto;
        }
    }

    &--notice {
        grid-column: 2 / 3;
        display: flex;
        align-items: center;
        gap: 16px;
        background: $sky-light;
        border-color: #B3E5FC;

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

// Info List
.info-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: $bg;
    border-radius: 14px;
    border: 1px solid #E2E8F0;
    transition: all 0.3s ease;

    &--confirmed {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border-color: #86efac;

        .info-item__icon {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);

            svg {
                color: white;
            }
        }
    }

    &__icon {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        svg {
            color: $sky-dark;
        }

        &--weight {
            background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);

            svg {
                color: #388E3C;
            }
        }

        &--smoke {
            background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);

            svg {
                color: #F57C00;
            }
        }
    }

    &__content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    &__label {
        font-size: 12px;
        color: $gray;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    &__value {
        font-size: 18px;
        font-weight: 600;
        color: $navy;
    }

    &__status {
        width: 32px;
        height: 32px;
        background: #10b981;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
            color: white;
        }
    }

    &__actions {
        display: flex;
        gap: 8px;
    }
}

// Action Buttons
.action-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid #E2E8F0;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    svg {
        color: $gray;
    }

    &:hover:not(:disabled) {
        border-color: $sky;

        svg {
            color: $sky-dark;
        }
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &--confirm {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;

        svg {
            color: white;
        }

        &:hover:not(:disabled) {
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }
    }

    &--small {
        width: 28px;
        height: 28px;
        border-radius: 8px;
    }
}

// Conditions List
.conditions-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.condition-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: $bg;
    border-radius: 12px;
    border: 1px solid #E2E8F0;

    &--confirmed {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border-color: #86efac;

        .condition-item__icon {
            background: #10b981;

            svg {
                color: white;
            }
        }
    }

    &__icon {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        svg {
            color: #DB2777;
        }
    }

    &__name {
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        color: $slate;
    }

    &__status {
        width: 24px;
        height: 24px;
        background: #10b981;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
            color: white;
        }
    }

    &__actions {
        display: flex;
        gap: 6px;
    }
}

// Notice Card
.notice-icon {
    width: 48px;
    height: 48px;
    background: white;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
        color: $sky-dark;
    }
}

.notice-text {
    font-size: 14px;
    color: $sky-darker;
    line-height: 1.5;
    margin: 0;
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

// Modal styles
:deep(.modal__footer) button {
    @media (max-width: 640px) {
        width: 100%;
    }
}
</style>
