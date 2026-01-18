<template>
    <div class="observations-page">
        <!-- Step Header (Hero Style) -->
        <div class="step-hero">
            <div class="step-hero__content">
                <div class="step-hero__top">
                    <button class="step-hero__back" @click="onSubmit(0)">
                        <v-icon name="hi-arrow-left" />
                    </button>
                    <div class="step-hero__progress">
                        <span class="step-hero__step">Step 5 of 8</span>
                        <div class="step-hero__bar">
                            <div class="step-hero__fill" style="width: 62.5%"></div>
                        </div>
                    </div>
                </div>
                <div class="step-hero__icon">
                    <v-icon name="hi-search" />
                </div>
                <h1 class="step-hero__title">What are your symptoms?</h1>
                <p class="step-hero__subtitle">Search for symptoms or select a body part to add them</p>
            </div>
            <div class="step-hero__decoration">
                <div class="decoration-circle decoration-circle--1"></div>
                <div class="decoration-circle decoration-circle--2"></div>
                <div class="decoration-circle decoration-circle--3"></div>
            </div>
        </div>

        <!-- Symptom Count Notice -->
        <div v-if="selectedSymptoms.length < 2" class="symptom-notice" :class="{ 'symptom-notice--warning': selectedSymptoms.length === 1 }">
            <div class="symptom-notice__icon">
                <v-icon name="hi-information-circle" />
            </div>
            <p class="symptom-notice__text">
                Please add a minimum of <strong>2 symptoms</strong> for a more accurate diagnosis.
                <span v-if="selectedSymptoms.length === 1">(1 more needed)</span>
            </p>
        </div>

        <!-- Mobile Tab View -->
        <div class="mobile-view">
            <div class="symptom-tabs">
                <button
                    class="symptom-tab"
                    :class="{ 'symptom-tab--active': currentTab === 'search' }"
                    @click="currentTab = 'search'"
                >
                    <v-icon name="hi-search" />
                    <span>Search</span>
                </button>
                <button
                    class="symptom-tab"
                    :class="{ 'symptom-tab--active': currentTab === 'body_part' }"
                    @click="currentTab = 'body_part'"
                >
                    <v-icon name="hi-user" />
                    <span>Body Part</span>
                </button>
            </div>

            <!-- Search Tab Content -->
            <div v-if="currentTab === 'search'" class="search-section">
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
                            <v-icon name="hi-plus-circle" />
                            <span>{{ item.label }}</span>
                        </div>
                    </template>
                    <div v-if="symptomOptions.length === 0" class="search-results__empty">
                        <v-icon name="hi-emoji-sad" />
                        <span>No symptoms found</span>
                    </div>
                </div>
            </div>

            <!-- Body Part Tab Content -->
            <div v-if="currentTab === 'body_part'" class="body-section">
                <full-body-avatar-male
                    v-if="patientInfo.gender === 'male'"
                    class="body-avatar"
                    @selected-symptom="onSelectedSymptom($event)"
                />
                <full-body-avatar-female
                    v-if="patientInfo.gender === 'female'"
                    class="body-avatar"
                    @selected-symptom="onSelectedSymptom($event)"
                />
            </div>

            <!-- Selected Symptoms -->
            <div v-if="selectedSymptoms.length" class="selected-symptoms">
                <h4 class="selected-symptoms__title">
                    <v-icon name="hi-clipboard-list" />
                    <span>Selected Symptoms ({{ selectedSymptoms.length }})</span>
                </h4>
                <div class="selected-symptoms__list">
                    <div
                        v-for="(item, index) in selectedSymptoms"
                        :key="JSON.stringify(item)"
                        class="symptom-chip"
                    >
                        <span>{{ item.label }}</span>
                        <button class="symptom-chip__remove" @click="selectedSymptoms.splice(index, 1)">
                            <v-icon name="hi-x" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Desktop View -->
        <div class="desktop-view">
            <div class="desktop-layout">
                <!-- Search Section -->
                <div class="search-column">
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
                    <div v-if="isOpenSearchResult" class="search-results" ref="searchResultsRefDesktop">
                        <template v-for="item in symptomOptions" :key="JSON.stringify(item)">
                            <div class="search-results__item" @click="onSelectedSymptom(item)">
                                <v-icon name="hi-plus-circle" />
                                <span>{{ item.label }}</span>
                            </div>
                        </template>
                        <div v-if="symptomOptions.length === 0" class="search-results__empty">
                            <v-icon name="hi-emoji-sad" />
                            <span>No symptoms found</span>
                        </div>
                    </div>

                    <!-- Selected Symptoms -->
                    <div v-if="selectedSymptoms.length" class="selected-symptoms">
                        <h4 class="selected-symptoms__title">
                            <v-icon name="hi-clipboard-list" />
                            <span>Selected Symptoms ({{ selectedSymptoms.length }})</span>
                        </h4>
                        <div class="selected-symptoms__list">
                            <div
                                v-for="(item, index) in selectedSymptoms"
                                :key="JSON.stringify(item)"
                                class="symptom-chip"
                            >
                                <span>{{ item.label }}</span>
                                <button class="symptom-chip__remove" @click="selectedSymptoms.splice(index, 1)">
                                    <v-icon name="hi-x" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Body Avatar Section -->
                <div class="body-column">
                    <full-body-avatar-male
                        v-if="patientInfo.gender === 'male'"
                        class="body-avatar"
                        @selected-symptom="onSelectedSymptom($event)"
                    />
                    <full-body-avatar-female
                        v-if="patientInfo.gender === 'female'"
                        class="body-avatar"
                        @selected-symptom="onSelectedSymptom($event)"
                    />
                </div>
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
                :class="{ 'step-footer__btn--disabled': !selectedSymptoms.length }"
                :disabled="!selectedSymptoms.length"
                @click="onSubmit(1)"
            >
                <span>Continue</span>
                <v-icon name="hi-arrow-right" />
            </button>
        </div>
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
const searchResultsRefDesktop = ref(null);
const currentTab = ref("search");

onClickOutside(searchResultsRef, () => {
    isOpenSearchResult.value = false;
});

onClickOutside(searchResultsRefDesktop, () => {
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
.observations-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: $size-24;
    padding-bottom: $size-120;
    max-width: 900px;
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

// Symptom Notice
.symptom-notice {
    display: flex;
    align-items: center;
    gap: $size-12;
    padding: $size-14 $size-18;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #bae6fd;
    border-radius: $size-12;

    &--warning {
        background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%);
        border-color: #fde047;

        .symptom-notice__icon svg {
            color: #ca8a04;
        }

        .symptom-notice__text {
            color: #a16207;
        }
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
        font-size: $size-14;
        color: #0369a1;
        margin: 0;

        @include responsive(phone) {
            font-size: $size-13;
        }

        strong {
            font-weight: $fw-semi-bold;
        }
    }
}

// Mobile View
.mobile-view {
    display: none;
    flex-direction: column;
    gap: $size-20;

    @include responsive(phone) {
        display: flex;
    }
}

// Desktop View
.desktop-view {
    display: block;

    @include responsive(phone) {
        display: none;
    }
}

.desktop-layout {
    display: flex;
    gap: $size-24;
    align-items: flex-start;
    overflow: visible;
}

.search-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $size-20;
    position: relative;
}

.body-column {
    flex: 1;
    max-width: 400px;
    position: relative;
    overflow: visible;

    .body-avatar {
        width: 100%;
    }

    // Ensure body part dropdown can overflow
    :deep(.body-avatar) {
        overflow: visible;
    }
}

// Symptom Tabs
.symptom-tabs {
    display: flex;
    gap: $size-8;
    background: $color-g-97;
    padding: $size-6;
    border-radius: $size-12;
}

.symptom-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-8;
    padding: $size-12 $size-16;
    background: transparent;
    border: none;
    border-radius: $size-10;
    font-size: $size-14;
    font-weight: $fw-medium;
    color: $color-g-54;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
        width: 18px;
        height: 18px;
    }

    &--active {
        background: white;
        color: #0EAEC4;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
}

// Search Box
.search-box {
    position: relative;
    display: flex;
    align-items: center;

    &__icon {
        position: absolute;
        left: $size-16;
        width: 20px;
        height: 20px;
        color: $color-g-54;
    }

    &__input {
        width: 100%;
        padding: $size-14 $size-16 $size-14 $size-48;
        background: $color-white;
        border: 2px solid $color-g-92;
        border-radius: $size-12;
        font-size: $size-15;
        color: $color-black;
        transition: all 0.3s ease;

        @include responsive(phone) {
            font-size: $size-14;
            padding: $size-12 $size-14 $size-12 $size-44;
        }

        &::placeholder {
            color: $color-g-67;
        }

        &:focus {
            outline: none;
            border-color: #0EAEC4;
            box-shadow: 0 0 0 3px rgba(14, 174, 196, 0.1);
        }
    }
}

// Search Results
.search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid $color-g-92;
    border-radius: $size-12;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    max-height: 280px;
    overflow-y: auto;
    z-index: 50;
    margin-top: $size-8;

    &__item {
        display: flex;
        align-items: center;
        gap: $size-12;
        padding: $size-12 $size-16;
        cursor: pointer;
        transition: all 0.2s ease;

        svg {
            width: 18px;
            height: 18px;
            color: #0EAEC4;
        }

        span {
            font-size: $size-14;
            color: $color-black;
        }

        &:hover {
            background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
        }
    }

    &__empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: $size-8;
        padding: $size-32;
        color: $color-g-54;

        svg {
            width: 32px;
            height: 32px;
        }

        span {
            font-size: $size-14;
        }
    }
}

// Search Section (Mobile)
.search-section {
    position: relative;
}

// Body Section
.body-section {
    display: flex;
    justify-content: center;
    padding: $size-16 0;

    .body-avatar {
        max-width: 300px;
        width: 100%;
    }
}

// Selected Symptoms
.selected-symptoms {
    &__title {
        display: flex;
        align-items: center;
        gap: $size-8;
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        color: $color-black;
        margin: 0 0 $size-12 0;

        svg {
            width: 20px;
            height: 20px;
            color: #0EAEC4;
        }
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
        gap: $size-10;
    }
}

.symptom-chip {
    display: flex;
    align-items: center;
    gap: $size-8;
    padding: $size-10 $size-14;
    background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
    border: 1px solid #99f6e4;
    border-radius: $size-24;

    span {
        font-size: $size-14;
        color: #0d9488;
        font-weight: $fw-medium;

        @include responsive(phone) {
            font-size: $size-13;
        }
    }

    &__remove {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        background: #14b8a6;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;

        svg {
            width: 12px;
            height: 12px;
            color: white;
        }

        &:hover {
            background: #0d9488;
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
