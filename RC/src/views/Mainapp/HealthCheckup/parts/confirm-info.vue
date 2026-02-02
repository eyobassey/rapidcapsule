<template>
    <div class="confirm-page">
        <!-- Step Header -->
        <StepHero
            :step="3"
            :totalSteps="8"
            icon="hi-clipboard-list"
            title="Confirm Your Information"
            subtitle="Please verify that the following health information is correct"
            @back="() => onSubmit(0)"
        />

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
        <InfoNotice
            type="info"
            text="Changes made here will be saved to your profile for future health assessments."
        />

        <!-- Navigation Footer -->
        <StepFooter
            :disabled="!canProceed"
            @back="() => onSubmit(0)"
            @next="() => onSubmit(1)"
        />
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
import StepHero from "./components/StepHero.vue";
import StepFooter from "./components/StepFooter.vue";
import InfoNotice from "./components/InfoNotice.vue";

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
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;

.confirm-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding-bottom: 120px;
    max-width: 600px;
    margin: 0 auto;

    @media (max-width: 640px) {
        gap: 24px;
        padding-bottom: 100px;
    }
}

// Info Cards
.info-cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.info-card {
    background: white;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s ease;

    @media (max-width: 640px) {
        padding: 16px;
        flex-wrap: wrap;
    }

    &:hover {
        border-color: rgba(0, 0, 0, 0.12);
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
        background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        @media (max-width: 640px) {
            width: 44px;
            height: 44px;
        }

        svg {
            width: 24px;
            height: 24px;
            color: $sky-dark;

            @media (max-width: 640px) {
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
        gap: 4px;
    }

    &__label {
        font-size: 13px;
        color: $gray;
        font-weight: 500;
    }

    &__value {
        font-size: 18px;
        font-weight: 600;
        color: $navy;

        @media (max-width: 640px) {
            font-size: 16px;
        }
    }

    &__status {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: #10b981;
        border-radius: 8px;

        svg {
            width: 16px;
            height: 16px;
            color: white;
        }

        span {
            font-size: 13px;
            font-weight: 500;
            color: white;
        }
    }

    &__actions {
        display: flex;
        gap: 8px;

        @media (max-width: 640px) {
            width: 100%;
            margin-top: 8px;
        }
    }

    &__btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;

        @media (max-width: 640px) {
            flex: 1;
            justify-content: center;
        }

        svg {
            width: 16px;
            height: 16px;
        }

        &--edit {
            background: transparent;
            border: 1px solid rgba(0, 0, 0, 0.15);
            color: $slate;

            &:hover:not(:disabled) {
                background: $bg;
                border-color: rgba(0, 0, 0, 0.2);
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

:deep(.modal__footer) button {
    @media (max-width: 640px) {
        width: 100%;
    }
}
</style>
