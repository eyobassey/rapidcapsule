<template>
    <div class="confirm-page">
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
                    <v-icon name="hi-clipboard-list" />
                </div>
                <h1 class="step-hero__title">Confirm Your Information</h1>
                <p class="step-hero__subtitle">Please verify that the following health information is correct</p>
            </div>
            <div class="step-hero__decoration">
                <div class="decoration-circle decoration-circle--1"></div>
                <div class="decoration-circle decoration-circle--2"></div>
                <div class="decoration-circle decoration-circle--3"></div>
            </div>
        </div>

        <!-- Info Cards -->
        <div class="info-cards">
            <!-- Height Card -->
            <div
                class="info-card"
                :class="{ 'info-card--confirmed': healthCheckInfo.basic_health_info?.height?.status }"
            >
                <div class="info-card__icon">
                    <v-icon name="hi-arrow-up" />
                </div>
                <div class="info-card__content">
                    <span class="info-card__label">Height</span>
                    <span class="info-card__value">{{ healthCheckInfo.basic_health_info?.height?.value }}{{ healthCheckInfo.basic_health_info?.height?.unit }}</span>
                </div>
                <div v-if="healthCheckInfo.basic_health_info?.height?.status" class="info-card__status">
                    <v-icon name="hi-check-circle" />
                    <span>{{ healthCheckInfo.basic_health_info.height.status === 'correct' ? 'Confirmed' : 'Updated' }}</span>
                </div>
                <div v-else class="info-card__actions">
                    <button class="info-card__btn info-card__btn--edit" @click="onOpenBasicHealthInfo('height', {...healthCheckInfo.basic_health_info.height})">
                        <v-icon name="hi-pencil" />
                        <span>Edit</span>
                    </button>
                    <button class="info-card__btn info-card__btn--confirm" @click="healthCheckInfo.basic_health_info.height.status = 'correct'">
                        <v-icon name="hi-check" />
                        <span>Correct</span>
                    </button>
                </div>
            </div>

            <!-- Weight Card -->
            <div
                class="info-card"
                :class="{ 'info-card--confirmed': healthCheckInfo.basic_health_info?.weight?.status }"
            >
                <div class="info-card__icon">
                    <v-icon name="hi-scale" />
                </div>
                <div class="info-card__content">
                    <span class="info-card__label">Weight</span>
                    <span class="info-card__value">{{ healthCheckInfo.basic_health_info?.weight?.value }}{{ healthCheckInfo.basic_health_info?.weight?.unit }}</span>
                </div>
                <div v-if="healthCheckInfo.basic_health_info?.weight?.status" class="info-card__status">
                    <v-icon name="hi-check-circle" />
                    <span>{{ healthCheckInfo.basic_health_info.weight.status === 'correct' ? 'Confirmed' : 'Updated' }}</span>
                </div>
                <div v-else class="info-card__actions">
                    <button class="info-card__btn info-card__btn--edit" @click="onOpenBasicHealthInfo('weight', {...healthCheckInfo.basic_health_info.weight})">
                        <v-icon name="hi-pencil" />
                        <span>Edit</span>
                    </button>
                    <button class="info-card__btn info-card__btn--confirm" @click="healthCheckInfo.basic_health_info.weight.status = 'correct'">
                        <v-icon name="hi-check" />
                        <span>Correct</span>
                    </button>
                </div>
            </div>

            <!-- Smoking Status Card -->
            <div
                v-if="healthCheckInfo.health_risk_factors?.is_smoker"
                class="info-card"
                :class="{ 'info-card--confirmed': isSmokerStatus }"
            >
                <div class="info-card__icon info-card__icon--smoke">
                    <v-icon name="hi-fire" />
                </div>
                <div class="info-card__content">
                    <span class="info-card__label">Smoking Status</span>
                    <span class="info-card__value">{{ healthCheckInfo.health_risk_factors.is_smoker === 'No' ? 'Non-smoker' : 'Smoker' }}</span>
                </div>
                <div v-if="isSmokerStatus" class="info-card__status">
                    <v-icon name="hi-check-circle" />
                    <span>{{ isSmokerStatus === 'correct' ? 'Confirmed' : 'Updated' }}</span>
                </div>
                <div v-else class="info-card__actions">
                    <button
                        class="info-card__btn info-card__btn--edit"
                        @click="onSubmitHealthRiskFactors({ key: 'is_smoker', value: healthCheckInfo.health_risk_factors.is_smoker })"
                        :disabled="isFetching"
                    >
                        <v-icon name="hi-switch-horizontal" />
                        <span>{{ isFetching ? 'Updating...' : 'Change' }}</span>
                    </button>
                    <button class="info-card__btn info-card__btn--confirm" @click="isSmokerStatus = 'correct'" :disabled="isFetching">
                        <v-icon name="hi-check" />
                        <span>Correct</span>
                    </button>
                </div>
            </div>

            <!-- Pre-existing Conditions -->
            <template v-for="(item, index) in healthCheckInfo.pre_existing_conditions" :key="index">
                <div
                    class="info-card"
                    :class="{ 'info-card--confirmed': item.status }"
                >
                    <div class="info-card__icon info-card__icon--condition">
                        <v-icon name="hi-heart" />
                    </div>
                    <div class="info-card__content">
                        <span class="info-card__label">Pre-existing Condition</span>
                        <span class="info-card__value">{{ item.name }}</span>
                    </div>
                    <div v-if="item.status" class="info-card__status">
                        <v-icon name="hi-check-circle" />
                        <span>{{ item.status === 'correct' ? 'Confirmed' : 'Updated' }}</span>
                    </div>
                    <div v-else class="info-card__actions">
                        <button class="info-card__btn info-card__btn--edit" @click="onSubmitPreExistingConditions(index, {...item})">
                            <v-icon name="hi-x" />
                            <span>Remove</span>
                        </button>
                        <button class="info-card__btn info-card__btn--confirm" @click="item.status = 'correct'">
                            <v-icon name="hi-check" />
                            <span>Correct</span>
                        </button>
                    </div>
                </div>
            </template>
        </div>

        <!-- Info Notice -->
        <div class="confirm-notice">
            <div class="confirm-notice__icon">
                <v-icon name="hi-information-circle" />
            </div>
            <div class="confirm-notice__content">
                <p class="confirm-notice__text">
                    Changes made here will be saved to your profile for future health assessments.
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
                :class="{ 'step-footer__btn--disabled': !canProceed }"
                :disabled="!canProceed"
                @click="onSubmit(1)"
            >
                <span>Continue</span>
                <v-icon name="hi-arrow-right" />
            </button>
        </div>
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
.confirm-page {
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

// Info Cards
.info-cards {
    display: flex;
    flex-direction: column;
    gap: $size-16;
}

.info-card {
    background: $color-white;
    border: 2px solid $color-g-92;
    border-radius: $size-16;
    padding: $size-20;
    display: flex;
    align-items: center;
    gap: $size-16;
    transition: all 0.3s ease;

    @include responsive(phone) {
        padding: $size-16;
        flex-wrap: wrap;
    }

    &:hover {
        border-color: $color-g-85;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    &--confirmed {
        border-color: #10b981;
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);

        .info-card__icon {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);

            svg {
                color: white;
            }
        }
    }

    &__icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        @include responsive(phone) {
            width: 44px;
            height: 44px;
        }

        svg {
            width: 24px;
            height: 24px;
            color: #0284c7;

            @include responsive(phone) {
                width: 22px;
                height: 22px;
            }
        }

        &--smoke {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);

            svg {
                color: #d97706;
            }
        }

        &--condition {
            background: linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%);

            svg {
                color: #db2777;
            }
        }
    }

    &__content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: $size-4;
    }

    &__label {
        font-size: $size-13;
        color: $color-g-54;
        font-weight: $fw-medium;
    }

    &__value {
        font-size: $size-18;
        font-weight: $fw-semi-bold;
        color: $color-black;

        @include responsive(phone) {
            font-size: $size-16;
        }
    }

    &__status {
        display: flex;
        align-items: center;
        gap: $size-6;
        padding: $size-8 $size-14;
        background: #10b981;
        border-radius: $size-8;

        svg {
            width: 16px;
            height: 16px;
            color: white;
        }

        span {
            font-size: $size-13;
            font-weight: $fw-medium;
            color: white;
        }
    }

    &__actions {
        display: flex;
        gap: $size-8;

        @include responsive(phone) {
            width: 100%;
            margin-top: $size-8;
        }
    }

    &__btn {
        display: flex;
        align-items: center;
        gap: $size-6;
        padding: $size-10 $size-16;
        border-radius: $size-10;
        font-size: $size-13;
        font-weight: $fw-medium;
        cursor: pointer;
        transition: all 0.3s ease;

        @include responsive(phone) {
            flex: 1;
            justify-content: center;
        }

        svg {
            width: 16px;
            height: 16px;
        }

        &--edit {
            background: transparent;
            border: 1px solid $color-g-85;
            color: $color-g-44;

            &:hover:not(:disabled) {
                background: $color-g-97;
                border-color: $color-g-77;
            }

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        }

        &--confirm {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border: none;
            color: white;

            &:hover:not(:disabled) {
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
            }

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        }
    }
}

// Notice
.confirm-notice {
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

:deep(.modal__footer) button {
    @include responsive(phone) {
        width: 100%;
    }
}
</style>
