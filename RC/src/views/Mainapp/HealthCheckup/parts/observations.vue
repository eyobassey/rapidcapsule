<template>
    <div class="observations-page">
        <!-- Hero Section -->
        <section class="hero">
            <div class="hero__content">
                <button class="hero__back" @click="() => onSubmit(0)">
                    <v-icon name="hi-arrow-left" scale="1" />
                    <span>Back</span>
                </button>

                <div class="hero__badge">
                    <span class="badge-step">Step 5 of 8</span>
                    <span v-if="selectedSymptoms.length >= 2" class="badge-success">
                        <v-icon name="hi-check-circle" scale="0.8" />
                        {{ selectedSymptoms.length }} symptoms
                    </span>
                </div>

                <h1 class="hero__title">
                    What are your<br/>
                    <span class="hero__title-accent">Symptoms?</span>
                </h1>

                <p class="hero__subtitle">
                    Search for symptoms or tap body parts to add them
                </p>
            </div>

            <div class="hero__visual">
                <div class="symptom-orb">
                    <div class="symptom-orb__inner">
                        <v-icon name="hi-search" scale="3" />
                    </div>
                    <div class="symptom-orb__ring"></div>
                    <div class="symptom-orb__ring symptom-orb__ring--delayed"></div>
                </div>
                <div class="floating-icons">
                    <div class="floating-icon floating-icon--1">
                        <v-icon name="hi-heart" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--2">
                        <v-icon name="hi-user" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--3">
                        <v-icon name="hi-clipboard-list" scale="1.2" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Symptom Count Notice -->
        <div v-if="selectedSymptoms.length < 2" class="notice-banner" :class="{ 'notice-banner--warning': selectedSymptoms.length === 1 }">
            <v-icon :name="selectedSymptoms.length === 1 ? 'hi-exclamation-circle' : 'hi-information-circle'" scale="1.1" />
            <span>
                Please add a minimum of <strong>2 symptoms</strong> for a more accurate diagnosis.
                <span v-if="selectedSymptoms.length === 1">(1 more needed)</span>
            </span>
        </div>

        <!-- Bento Grid -->
        <section class="bento-grid">
            <!-- Search Card -->
            <div class="bento-card bento-card--search">
                <div class="bento-card__header">
                    <v-icon name="hi-search" scale="1.1" />
                    <span>Search Symptoms</span>
                </div>

                <div class="search-box">
                    <v-icon name="hi-search" class="search-box__icon" />
                    <input
                        type="text"
                        class="search-box__input"
                        placeholder="Type to search symptoms..."
                        @input="onSearch($event.target.value)"
                    />
                </div>

                <!-- Search Results Dropdown -->
                <div v-if="isOpenSearchResult" class="search-results" ref="searchResultsRef">
                    <template v-for="item in symptomOptions" :key="JSON.stringify(item)">
                        <div class="search-results__item" @click="onSelectedSymptom(item)">
                            <v-icon name="hi-plus-circle" scale="0.9" />
                            <span>{{ item.label }}</span>
                        </div>
                    </template>
                    <div v-if="symptomOptions.length === 0" class="search-results__empty">
                        <v-icon name="hi-emoji-sad" scale="1.5" />
                        <span>No symptoms found</span>
                    </div>
                </div>

                <!-- Selected Symptoms in Search Card -->
                <div v-if="selectedSymptoms.length" class="selected-symptoms">
                    <h4 class="selected-symptoms__title">
                        <v-icon name="hi-clipboard-list" scale="0.9" />
                        <span>Selected ({{ selectedSymptoms.length }})</span>
                    </h4>
                    <div class="selected-symptoms__list">
                        <div
                            v-for="(item, index) in selectedSymptoms"
                            :key="JSON.stringify(item)"
                            class="symptom-chip"
                        >
                            <span>{{ item.label }}</span>
                            <button class="symptom-chip__remove" @click="selectedSymptoms.splice(index, 1)">
                                <v-icon name="hi-x" scale="0.7" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Body Avatar Card -->
            <div class="bento-card bento-card--body">
                <div class="bento-card__header">
                    <v-icon name="hi-user" scale="1.1" />
                    <span>Select Body Part</span>
                </div>

                <div class="body-container">
                    <div class="body-scale-wrapper">
                        <full-body-avatar-male
                            v-if="patientInfo.gender === 'male'"
                            :age="String(patientInfo.age || 25)"
                            @selected-symptom="onSelectedSymptom($event)"
                        />
                        <full-body-avatar-female
                            v-if="patientInfo.gender === 'female'"
                            :age="String(patientInfo.age || 25)"
                            @selected-symptom="onSelectedSymptom($event)"
                        />
                    </div>
                </div>
            </div>

            <!-- Continue Card -->
            <div class="bento-card bento-card--action">
                <div class="action-content">
                    <div class="action-info">
                        <v-icon name="hi-arrow-right" scale="1.2" />
                        <span>{{ selectedSymptoms.length >= 2 ? `${selectedSymptoms.length} symptoms selected` : 'Add at least 2 symptoms' }}</span>
                    </div>
                    <button
                        class="continue-btn"
                        :class="{ 'continue-btn--disabled': !selectedSymptoms.length }"
                        :disabled="!selectedSymptoms.length"
                        @click="() => onSubmit(1)"
                    >
                        <span>Continue</span>
                        <v-icon name="hi-arrow-right" scale="1" />
                    </button>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, inject, watch } from "vue";
import { onClickOutside } from '@vueuse/core';
import InputSearch from "@/components/inputs/search.vue";
import FullBodyAvatarMale from "@/components/Health-checkup/full-body-avatar-male";
import FullBodyAvatarFemale from "@/components/Health-checkup/full-body-avatar-female";
import SearchDropdown from "@/components/Health-checkup/drop-down-list-search.vue";
import Icons from "@/components/icons.vue";
import Loader from "@/components/Loader/main-loader.vue";
import RcButton from "@/components/buttons/button-primary";
import RcTab from "@/components/RCTab";

const $http = inject('$http');
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');

const selectedSymptoms = ref([]);
const symptomOptions = ref([]);
const isOpenSearchResult = ref(false);
const searchResultsRef = ref(null);
const currentTab = ref("search");

onClickOutside(searchResultsRef, () => {
    isOpenSearchResult.value = false;
});

const onSelectedSymptom = (symptom) => {
    // Check if symptom is already selected
    const exists = selectedSymptoms.value.find(s => s.id === symptom.id);
    if (!exists) {
        selectedSymptoms.value.push(symptom);
    }
    isOpenSearchResult.value = false;
}

const onSearch = async (searchPhrase) => {
    if (searchPhrase) {
        isOpenSearchResult.value = true;
        const searchQuery = {
            phrase: searchPhrase,
            age: patientInfo.value.age,
            sex: patientInfo.value.gender,
        }

        try {
            // Try enhanced search first (with improved NLP and typo tolerance)
            await $http.$_searchObservationsEnhanced(searchQuery).then(({ data }) => {
                symptomOptions.value = data.data;
            });
        } catch (error) {
            console.log('Enhanced search failed, falling back to standard search');
            // Fallback to standard search if enhanced fails
            await $http.$_searchObservations(searchQuery).then(({ data }) => {
                symptomOptions.value = data.data;
            });
        }
    } else {
        isOpenSearchResult.value = false;
    }
}

const onSubmit = (activeScreen) => {
    const { current, from, to } = navigator.value;

    const observations = selectedSymptoms.value.map(item => ({
        ...item, choice_id: 'present', source: 'initial'
    }));

    if (activeScreen === 0) {
        usePatientInfo(patientInfo.value);
        useNavigator({ current, from: current, to: 4 });
    } else if (activeScreen === 1) {
        usePatientInfo({...patientInfo.value, observations });
        useNavigator({ current, from: current, to: 6 });
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

.observations-page {
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
    min-height: 320px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
    border-radius: 28px;
    position: relative;
    overflow: hidden;

    @media (max-width: 900px) {
        grid-template-columns: 1fr;
        padding: 32px 24px;
        text-align: center;
        min-height: auto;
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
        flex-wrap: wrap;

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

        .badge-success {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background: rgba(16, 185, 129, 0.9);
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

// Symptom Orb Animation
.symptom-orb {
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

// Notice Banner
.notice-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    background: $sky-light;
    border: 1px solid #B3E5FC;
    border-radius: 14px;
    color: $sky-dark;
    font-size: 14px;

    @media (max-width: 640px) {
        padding: 12px 16px;
        font-size: 13px;
    }

    svg {
        flex-shrink: 0;
    }

    strong {
        font-weight: 600;
    }

    &--warning {
        background: #FEF3C7;
        border-color: #FDE68A;
        color: #92400E;
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

    &--search {
        position: relative;
    }

    &--body {
        display: flex;
        flex-direction: column;
        overflow: visible;
    }

    &--action {
        grid-column: 1 / -1;
        padding: 20px 24px;

        @media (max-width: 900px) {
            grid-column: 1;
        }
    }
}

// Search Box
.search-box {
    position: relative;
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    &__icon {
        position: absolute;
        left: 16px;
        color: $gray;
    }

    &__input {
        width: 100%;
        padding: 14px 16px 14px 48px;
        background: $bg;
        border: 2px solid transparent;
        border-radius: 12px;
        font-size: 15px;
        color: $navy;
        transition: all 0.3s ease;

        &::placeholder {
            color: $gray;
        }

        &:focus {
            outline: none;
            border-color: $sky;
            background: white;
            box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.1);
        }
    }
}

// Search Results
.search-results {
    position: absolute;
    top: calc(100% - 20px);
    left: 24px;
    right: 24px;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    max-height: 280px;
    overflow-y: auto;
    z-index: 50;

    &__item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        cursor: pointer;
        transition: all 0.2s ease;

        svg {
            color: $sky;
            flex-shrink: 0;
        }

        span {
            font-size: 14px;
            color: $navy;
        }

        &:hover {
            background: $sky-light;
        }

        &:first-child {
            border-radius: 12px 12px 0 0;
        }

        &:last-child {
            border-radius: 0 0 12px 12px;
        }
    }

    &__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 32px;
        color: $gray;

        span {
            font-size: 14px;
        }
    }
}

// Selected Symptoms
.selected-symptoms {
    &__title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: $slate;
        margin: 0 0 12px 0;

        svg {
            color: $sky;
        }
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
}

.symptom-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
    border: 1px solid #81D4FA;
    border-radius: 20px;

    span {
        font-size: 13px;
        color: $sky-dark;
        font-weight: 500;
    }

    &__remove {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        background: $sky;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;

        svg {
            color: white;
        }

        &:hover {
            background: $sky-dark;
        }
    }
}

// Body Container - holds the scaled body
.body-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 520px;
    padding: 12px;
    background: $bg;
    border-radius: 16px;
    overflow: hidden;
    position: relative;

    @media (max-width: 900px) {
        height: 480px;
    }

    @media (max-width: 640px) {
        height: 420px;
    }
}

// Scale wrapper - applies transform without affecting component internals
.body-scale-wrapper {
    transform: scale(0.72);
    transform-origin: center center;
    display: flex;
    justify-content: center;

    @media (max-width: 900px) {
        transform: scale(0.67);
    }

    @media (max-width: 640px) {
        transform: scale(0.57);
    }
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
</style>
