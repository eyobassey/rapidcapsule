<template>
    <div class="observations-page">
        <!-- Step Header -->
        <StepHero
            :step="5"
            :totalSteps="8"
            icon="hi-search"
            title="What are your symptoms?"
            subtitle="Search for symptoms or select a body part to add them"
            @back="() => onSubmit(0)"
        />

        <!-- Symptom Count Notice -->
        <InfoNotice
            v-if="selectedSymptoms.length < 2"
            :type="selectedSymptoms.length === 1 ? 'warning' : 'info'"
        >
            Please add a minimum of <strong>2 symptoms</strong> for a more accurate diagnosis.
            <span v-if="selectedSymptoms.length === 1">(1 more needed)</span>
        </InfoNotice>

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
        <StepFooter
            :disabled="!selectedSymptoms.length"
            @back="() => onSubmit(0)"
            @next="() => onSubmit(1)"
        />
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
import StepHero from "./components/StepHero.vue";
import StepFooter from "./components/StepFooter.vue";
import InfoNotice from "./components/InfoNotice.vue";

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
// Design System Colors
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;

.observations-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding-bottom: 120px;
    max-width: 900px;
    margin: 0 auto;

    @media (max-width: 640px) {
        gap: 20px;
        padding-bottom: 100px;
    }
}

// Mobile View
.mobile-view {
    display: none;
    flex-direction: column;
    gap: 20px;

    @media (max-width: 640px) {
        display: flex;
    }
}

// Desktop View
.desktop-view {
    display: block;

    @media (max-width: 640px) {
        display: none;
    }
}

.desktop-layout {
    display: flex;
    gap: 24px;
    align-items: flex-start;
    overflow: visible;
}

.search-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
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
    gap: 8px;
    background: $bg;
    padding: 6px;
    border-radius: 12px;
}

.symptom-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    background: transparent;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    color: $gray;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
        width: 18px;
        height: 18px;
    }

    &--active {
        background: white;
        color: $sky-dark;
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
        left: 16px;
        width: 20px;
        height: 20px;
        color: $gray;
    }

    &__input {
        width: 100%;
        padding: 14px 16px 14px 48px;
        background: white;
        border: 2px solid rgba(0, 0, 0, 0.08);
        border-radius: 12px;
        font-size: 15px;
        color: $navy;
        transition: all 0.3s ease;

        @media (max-width: 640px) {
            font-size: 14px;
            padding: 12px 14px 12px 44px;
        }

        &::placeholder {
            color: $gray;
        }

        &:focus {
            outline: none;
            border-color: $sky;
            box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.1);
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
    border: 1px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    max-height: 280px;
    overflow-y: auto;
    z-index: 50;
    margin-top: 8px;

    &__item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        cursor: pointer;
        transition: all 0.2s ease;

        svg {
            width: 18px;
            height: 18px;
            color: $sky;
        }

        span {
            font-size: 14px;
            color: $navy;
        }

        &:hover {
            background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
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

        svg {
            width: 32px;
            height: 32px;
        }

        span {
            font-size: 14px;
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
    padding: 16px 0;

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
        gap: 8px;
        font-size: 15px;
        font-weight: 600;
        color: $navy;
        margin: 0 0 12px 0;

        svg {
            width: 20px;
            height: 20px;
            color: $sky;
        }
    }

    &__list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
    }
}

.symptom-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
    border: 1px solid #81D4FA;
    border-radius: 24px;

    span {
        font-size: 14px;
        color: $sky-dark;
        font-weight: 500;

        @media (max-width: 640px) {
            font-size: 13px;
        }
    }

    &__remove {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        background: $sky;
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
            background: $sky-dark;
        }
    }
}
</style>
