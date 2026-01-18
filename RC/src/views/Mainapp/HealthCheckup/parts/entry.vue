<template>
    <Loader v-if="isFetching || isLoading" :useOverlay="false" style="z-index:1" />
    <div v-else class="health-entry">
        <!-- Hero Section -->
        <div class="health-entry__hero">
            <div class="health-entry__hero-content">
                <div class="health-entry__hero-icon">
                    <v-icon name="fa-heartbeat" />
                </div>
                <h1 class="health-entry__hero-title">AI Health Checkup</h1>
                <p class="health-entry__hero-subtitle">
                    Get personalized health insights powered by advanced AI technology
                </p>
            </div>
            <div class="health-entry__hero-decoration">
                <div class="decoration-circle decoration-circle--1"></div>
                <div class="decoration-circle decoration-circle--2"></div>
                <div class="decoration-circle decoration-circle--3"></div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="health-entry__main">
            <div class="health-entry__question">
                <h2 class="health-entry__question-title">Who is this checkup for?</h2>
                <p class="health-entry__question-desc">Select the person you'd like to run the health assessment for</p>
            </div>

            <!-- Patient Selection Cards -->
            <div class="health-entry__cards">
                <!-- Self Card -->
                <div class="patient-card patient-card--self" @click="onSelectedPatient(userprofile, 'Self')">
                    <div class="patient-card__avatar">
                        <avatar-fixed
                            size="small"
                            :firstname="profile.first_name"
                            :lastname="profile.last_name"
                        />
                        <div class="patient-card__badge">
                            <v-icon name="hi-check-circle" />
                        </div>
                    </div>
                    <div class="patient-card__info">
                        <h3 class="patient-card__name">Myself</h3>
                        <p class="patient-card__label">Personal checkup</p>
                    </div>
                    <div class="patient-card__arrow">
                        <v-icon name="hi-arrow-right" />
                    </div>
                </div>

                <!-- Dependants -->
                <template v-for="dependant in dependantsList" :key="dependant._id || dependant.first_name">
                    <div class="patient-card patient-card--dependant" @click="onSelectedPatient(dependant, 'Dependant')">
                        <div class="patient-card__avatar">
                            <avatar-fixed
                                size="small"
                                :firstname="dependant.first_name"
                                :lastname="dependant.last_name"
                            />
                        </div>
                        <div class="patient-card__info">
                            <h3 class="patient-card__name">{{ dependant.first_name }}</h3>
                            <p class="patient-card__label">Dependant</p>
                        </div>
                        <div class="patient-card__arrow">
                            <v-icon name="hi-arrow-right" />
                        </div>
                    </div>
                </template>

                <!-- Someone Else Card -->
                <div class="patient-card patient-card--other" @click="onSelectedPatient('', 'Third Party')">
                    <div class="patient-card__avatar patient-card__avatar--icon">
                        <v-icon name="hi-user-add" />
                    </div>
                    <div class="patient-card__info">
                        <h3 class="patient-card__name">Someone else</h3>
                        <p class="patient-card__label">Check for another person</p>
                    </div>
                    <div class="patient-card__arrow">
                        <v-icon name="hi-arrow-right" />
                    </div>
                </div>
            </div>

            <!-- Features Section -->
            <div class="health-entry__features">
                <div class="feature-item">
                    <div class="feature-item__icon feature-item__icon--blue">
                        <v-icon name="hi-shield-check" />
                    </div>
                    <span class="feature-item__text">Secure & Private</span>
                </div>
                <div class="feature-item">
                    <div class="feature-item__icon feature-item__icon--green">
                        <v-icon name="hi-lightning-bolt" />
                    </div>
                    <span class="feature-item__text">AI-Powered</span>
                </div>
                <div class="feature-item">
                    <div class="feature-item__icon feature-item__icon--purple">
                        <v-icon name="hi-clock" />
                    </div>
                    <span class="feature-item__text">Quick Results</span>
                </div>
            </div>

            <!-- History Button -->
            <div class="health-entry__history">
                <button @click="viewHistory" class="history-btn">
                    <div class="history-btn__icon">
                        <v-icon name="hi-clipboard-list" />
                    </div>
                    <div class="history-btn__content">
                        <span class="history-btn__title">View Checkup History</span>
                        <span class="history-btn__desc">Access your previous health assessments</span>
                    </div>
                    <v-icon name="hi-chevron-right" class="history-btn__arrow" />
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, inject, computed } from "vue";
import { useToast } from 'vue-toast-notification';
import AvatarFixed from "@/components/Avatars/avatar-fixed";
import Loader from "@/components/Loader/main-loader.vue";
import { mapGetters } from "@/utilities/utilityStore";
import { calculateAge } from "@/utilities/utilityFunctions";

const $toast = useToast();
const $http = inject("$http");
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');
const { userprofile } = mapGetters();

const profile = {...userprofile.value.profile};
const dependants = {...userprofile.value.dependants};
const isFetching = ref(false);

// Convert dependants object to array for proper iteration
const dependantsList = computed(() => {
    if (!dependants || typeof dependants !== 'object') return [];
    return Object.values(dependants).filter(d => d && d.first_name);
});

const onSelectedPatient = async (patient, patientType) => {
	isFetching.value = true;
	const payload = {
		checkup_owner_id: patient._id,
		health_check_for: patientType
	};

	await $http.$_beginHealthCheckup(payload).then(({ data }) => {
		const { current, from, to } = navigator.value;

		if (patientType === 'Self') {
			const age = calculateAge(patient?.profile?.date_of_birth);
			const gender = patient.profile.gender?.toLowerCase();
			usePatientInfo({ ...patient.profile, age, gender, patientType });
			useNavigator({ current, from: current, to: 3 });
		} else if (patientType === 'Dependant') {
			const age = calculateAge(patient?.date_of_birth);
			usePatientInfo({ ...patient, age, patientType });
			useNavigator({ current, from: current, to: 1 });
		} else if (patientType === 'Third Party') {
			usePatientInfo({ patientType });
			useNavigator({ current, from: current, to: 1 });
		}

		isFetching.value = false;
	}).catch((error) => {
		isFetching.value = false;
		$toast.error(error.message, { duration: 3000 });
	});
}

const viewHistory = () => {
	const { current } = navigator.value;
	useNavigator({ current, from: current, to: 10 });
}

</script>

<style scoped lang="scss">
.health-entry {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: $size-32;
    padding-bottom: $size-48;

    @include responsive(phone) {
        gap: $size-24;
        padding-bottom: $size-32;
    }

    // Hero Section
    &__hero {
        position: relative;
        background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
        border-radius: $size-24;
        padding: $size-40 $size-32;
        overflow: hidden;
        box-shadow: 0 10px 40px rgba(14, 174, 196, 0.3);

        @include responsive(phone) {
            padding: $size-32 $size-24;
            border-radius: $size-16;
        }

        &-content {
            position: relative;
            z-index: 2;
            text-align: center;
        }

        &-icon {
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

        &-title {
            font-size: $size-32;
            font-weight: $fw-bold;
            color: white;
            margin: 0 0 $size-12 0;
            letter-spacing: -0.5px;

            @include responsive(phone) {
                font-size: $size-24;
            }
        }

        &-subtitle {
            font-size: $size-16;
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
            max-width: 400px;
            margin: 0 auto;
            line-height: 1.5;

            @include responsive(phone) {
                font-size: $size-14;
            }
        }

        &-decoration {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            overflow: hidden;
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

    // Main Content
    &__main {
        display: flex;
        flex-direction: column;
        gap: $size-32;

        @include responsive(phone) {
            gap: $size-24;
        }
    }

    &__question {
        text-align: center;

        &-title {
            font-size: $size-24;
            font-weight: $fw-bold;
            color: $color-black;
            margin: 0 0 $size-8 0;

            @include responsive(phone) {
                font-size: $size-20;
            }
        }

        &-desc {
            font-size: $size-15;
            color: $color-g-54;
            margin: 0;

            @include responsive(phone) {
                font-size: $size-14;
            }
        }
    }

    // Patient Cards
    &__cards {
        display: flex;
        flex-direction: column;
        gap: $size-12;
        max-width: 500px;
        margin: 0 auto;
        width: 100%;
    }
}

.patient-card {
    display: flex;
    align-items: center;
    gap: $size-16;
    padding: $size-20 $size-24;
    background: $color-white;
    border: 2px solid $color-g-92;
    border-radius: $size-16;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    @include responsive(phone) {
        padding: $size-16 $size-20;
        gap: $size-14;
    }

    &:hover {
        border-color: #0EAEC4;
        background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(14, 174, 196, 0.15);

        .patient-card__arrow {
            transform: translateX(4px);
            color: #0EAEC4;
        }
    }

    &:active {
        transform: translateY(0);
    }

    &__avatar {
        position: relative;
        flex-shrink: 0;

        :deep(.avatar) {
            width: 52px !important;
            height: 52px !important;
            font-size: $size-18 !important;

            @include responsive(phone) {
                width: 46px !important;
                height: 46px !important;
                font-size: $size-16 !important;
            }
        }

        &--icon {
            width: 52px;
            height: 52px;
            background: linear-gradient(135deg, $color-g-92 0%, $color-g-85 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;

            @include responsive(phone) {
                width: 46px;
                height: 46px;
            }

            svg {
                width: 24px;
                height: 24px;
                color: $color-g-54;

                @include responsive(phone) {
                    width: 22px;
                    height: 22px;
                }
            }
        }
    }

    &__badge {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 20px;
        height: 20px;
        background: #10b981;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;

        svg {
            width: 12px;
            height: 12px;
            color: white;
        }
    }

    &__info {
        flex: 1;
        min-width: 0;
    }

    &__name {
        font-size: $size-18;
        font-weight: $fw-semi-bold;
        color: $color-black;
        margin: 0 0 $size-4 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        @include responsive(phone) {
            font-size: $size-16;
        }
    }

    &__label {
        font-size: $size-13;
        color: $color-g-54;
        margin: 0;

        @include responsive(phone) {
            font-size: $size-12;
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

    // Card variants
    &--self {
        border-color: rgba(14, 174, 196, 0.3);
        background: linear-gradient(135deg, #fafffe 0%, #f0fdfa 100%);

        &:hover {
            border-color: #0EAEC4;
        }
    }

    &--other {
        border-style: dashed;

        &:hover {
            border-style: solid;

            .patient-card__avatar--icon {
                background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);

                svg {
                    color: white;
                }
            }
        }
    }
}

// Features Section
.health-entry__features {
    display: flex;
    justify-content: center;
    gap: $size-24;
    flex-wrap: wrap;

    @include responsive(phone) {
        gap: $size-16;
    }
}

.feature-item {
    display: flex;
    align-items: center;
    gap: $size-10;

    &__icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;

        @include responsive(phone) {
            width: 32px;
            height: 32px;
            border-radius: 8px;
        }

        svg {
            width: 18px;
            height: 18px;

            @include responsive(phone) {
                width: 16px;
                height: 16px;
            }
        }

        &--blue {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);

            svg {
                color: #2563eb;
            }
        }

        &--green {
            background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);

            svg {
                color: #059669;
            }
        }

        &--purple {
            background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%);

            svg {
                color: #7c3aed;
            }
        }
    }

    &__text {
        font-size: $size-14;
        font-weight: $fw-medium;
        color: $color-g-44;

        @include responsive(phone) {
            font-size: $size-13;
        }
    }
}

// History Button
.health-entry__history {
    max-width: 500px;
    margin: 0 auto;
    width: 100%;
}

.history-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: $size-16;
    padding: $size-20 $size-24;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 2px solid $color-g-90;
    border-radius: $size-16;
    cursor: pointer;
    transition: all 0.3s ease;

    @include responsive(phone) {
        padding: $size-16 $size-20;
        gap: $size-14;
    }

    &:hover {
        border-color: #0EAEC4;
        background: white;
        box-shadow: 0 4px 16px rgba(14, 174, 196, 0.12);

        .history-btn__icon {
            background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);

            svg {
                color: white;
            }
        }

        .history-btn__arrow {
            transform: translateX(4px);
            color: #0EAEC4;
        }
    }

    &__icon {
        width: 48px;
        height: 48px;
        background: $color-g-92;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        flex-shrink: 0;

        @include responsive(phone) {
            width: 44px;
            height: 44px;
            border-radius: 10px;
        }

        svg {
            width: 24px;
            height: 24px;
            color: $color-g-54;
            transition: color 0.3s ease;

            @include responsive(phone) {
                width: 22px;
                height: 22px;
            }
        }
    }

    &__content {
        flex: 1;
        text-align: left;
    }

    &__title {
        display: block;
        font-size: $size-16;
        font-weight: $fw-semi-bold;
        color: $color-black;
        margin-bottom: $size-4;

        @include responsive(phone) {
            font-size: $size-15;
        }
    }

    &__desc {
        display: block;
        font-size: $size-13;
        color: $color-g-54;

        @include responsive(phone) {
            font-size: $size-12;
        }
    }

    &__arrow {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        color: $color-g-77;
        transition: all 0.3s ease;
    }
}
</style>
