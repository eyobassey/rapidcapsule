<template>
    <Loader v-if="isLoading" :useOverlay="false" style="z-index:1" />
    <div v-else class="interview-page">
        <!-- Step Header (Hero Style) -->
        <div class="step-hero">
            <div class="step-hero__content">
                <div class="step-hero__top">
                    <button class="step-hero__back" @click="onSubmit(0)">
                        <v-icon name="hi-arrow-left" />
                    </button>
                    <div class="step-hero__progress">
                        <span class="step-hero__step">Step 8 of 8 - Interview</span>
                        <div class="step-hero__bar">
                            <div class="step-hero__fill" style="width: 100%"></div>
                        </div>
                    </div>
                </div>
                <div class="step-hero__icon">
                    <v-icon name="hi-chat" />
                </div>
                <h1 class="step-hero__title">Health Interview</h1>
                <p class="step-hero__subtitle">Answer the following questions to help us understand your symptoms better</p>
            </div>
            <div class="step-hero__decoration">
                <div class="decoration-circle decoration-circle--1"></div>
                <div class="decoration-circle decoration-circle--2"></div>
                <div class="decoration-circle decoration-circle--3"></div>
            </div>
        </div>

        <!-- Interview Progress Indicator -->
        <div class="interview-progress">
            <div class="interview-progress__icon">
                <div class="interview-progress__spinner"></div>
            </div>
            <div class="interview-progress__content">
                <p class="interview-progress__title">Health Interview in Progress</p>
                <p class="interview-progress__text">Please answer the following questions to help us understand your symptoms better</p>
            </div>
        </div>

        <!-- Question Section -->
        <div class="question-card">
            <h3 class="question-card__title">{{ questions.text }}</h3>

            <!-- Group Single Type -->
            <div v-if="questions.type === 'group_single'" class="answer-options">
                <template v-for="option in questionOptions" :key="JSON.stringify(option)">
                    <div
                        class="answer-option"
                        :class="{ 'answer-option--selected': groupSingle?.id === option.id }"
                        @click="groupSingle = option"
                    >
                        <div class="answer-option__radio">
                            <div class="answer-option__dot" v-if="groupSingle?.id === option.id"></div>
                        </div>
                        <span class="answer-option__text">{{ option.name }}</span>
                    </div>
                </template>
            </div>

            <!-- Single Type -->
            <div v-if="questions.type === 'single'" class="answer-buttons">
                <button
                    class="answer-btn answer-btn--yes"
                    :class="{ 'answer-btn--active': questionOptions[0]?.choice_id === 'present' }"
                    @click="selectSingleAnswer('present')"
                >
                    <v-icon name="hi-check" />
                    <span>Yes</span>
                </button>
                <button
                    class="answer-btn answer-btn--no"
                    :class="{ 'answer-btn--active': questionOptions[0]?.choice_id === 'absent' }"
                    @click="selectSingleAnswer('absent')"
                >
                    <v-icon name="hi-x" />
                    <span>No</span>
                </button>
                <button
                    class="answer-btn answer-btn--unknown"
                    :class="{ 'answer-btn--active': questionOptions[0]?.choice_id === 'unknown' }"
                    @click="selectSingleAnswer('unknown')"
                >
                    <v-icon name="hi-question-mark-circle" />
                    <span>Not sure</span>
                </button>
            </div>

            <!-- Group Multiple Type -->
            <div v-if="questions.type === 'group_multiple'" class="answer-multiple">
                <template v-for="(question, i) in questionOptions" :key="JSON.stringify(question)">
                    <div class="answer-multiple__item">
                        <p class="answer-multiple__question">{{ question.name }}</p>
                        <div class="answer-multiple__options">
                            <button
                                class="answer-btn answer-btn--small answer-btn--yes"
                                :class="{ 'answer-btn--active': questionOptions[i]?.choice_id === 'present' }"
                                @click="selectMultipleAnswer(i, 'present')"
                            >
                                <v-icon name="hi-check" />
                                <span>Yes</span>
                            </button>
                            <button
                                class="answer-btn answer-btn--small answer-btn--no"
                                :class="{ 'answer-btn--active': questionOptions[i]?.choice_id === 'absent' }"
                                @click="selectMultipleAnswer(i, 'absent')"
                            >
                                <v-icon name="hi-x" />
                                <span>No</span>
                            </button>
                            <button
                                class="answer-btn answer-btn--small answer-btn--unknown"
                                :class="{ 'answer-btn--active': questionOptions[i]?.choice_id === 'unknown' }"
                                @click="selectMultipleAnswer(i, 'unknown')"
                            >
                                <v-icon name="hi-question-mark-circle" />
                                <span>Not sure</span>
                            </button>
                        </div>
                    </div>
                </template>
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
                :class="{ 'step-footer__btn--disabled': isDisabled }"
                :disabled="isDisabled"
                @click="onSubmit(1)"
            >
                <span>Next</span>
                <v-icon name="hi-arrow-right" />
            </button>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, inject, watchEffect, watch } from "vue";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import RcRadio from "@/components/RCRadio";

const $http = inject('$_HTTP');
const router = useRouter();
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { diagnosis, useDiagnosis } = inject('$_DIAGNOSIS');
const { recommendation, useRecommendation } = inject('$_RECOMMENDATION');
const { patientInfo } = inject('$_PATIENT_INFO');


const { current, from, to } = navigator.value;
const interviewStart = new Date().getTime();

const isLoading = ref(true);
const isDisabled = ref(true);
const questions = ref({});
const questionOptions = ref([]);
const groupSingle = ref([]);
const interviewResult = ref({});
const shouldStop = ref(false);
const isInitialLoad = ref(true);
const answeredQuestionsList = ref([]); // Track all questions and answers for Q&A Summary

watch(groupSingle, (value) => {
    questionOptions.value.forEach(item => {
        if (item.id === value.id) item.choice_id = 'present';
        else item.choice_id = 'absent'
    });
});

// Watch for changes to questionOptions directly (for single questions)
watch(() => questionOptions.value, (newValue, oldValue) => {
    // Validation logic only - debug logs removed
}, { deep: true });

watchEffect(() => {
    if (questionOptions.value?.length) {
        const hasAnyChoice = questionOptions.value.some(i => i.choice_id);

        if (hasAnyChoice) {
            isDisabled.value = false;
        } else isDisabled.value = true;
    }
})

// Method to select answer for single-type questions
const selectSingleAnswer = (choice_id) => {
    console.log('selectSingleAnswer called with:', choice_id);
    console.log('questionOptions before:', JSON.stringify(questionOptions.value));
    if (questionOptions.value?.length > 0) {
        const updated = [...questionOptions.value];
        updated[0] = { ...updated[0], choice_id };
        questionOptions.value = updated;
        console.log('questionOptions after:', JSON.stringify(questionOptions.value));
    } else {
        console.log('questionOptions is empty or undefined');
    }
};

// Method to select answer for multiple-type questions
const selectMultipleAnswer = (index, choice_id) => {
    console.log('selectMultipleAnswer called with index:', index, 'choice_id:', choice_id);
    console.log('questionOptions before:', JSON.stringify(questionOptions.value));
    if (questionOptions.value?.length > index) {
        const updated = [...questionOptions.value];
        updated[index] = { ...updated[index], choice_id };
        questionOptions.value = updated;
        console.log('questionOptions after:', JSON.stringify(questionOptions.value));
    } else {
        console.log('questionOptions length:', questionOptions.value?.length, 'index:', index);
    }
};

// Prevent automatic API calls - only call API when explicitly triggered
const shouldMakeApiCall = ref(false);

watchEffect(async () => {
    // Allow initial API call to load first question
    if (!shouldMakeApiCall.value && !isInitialLoad.value) {
        return;
    }

    if (isInitialLoad.value) {
        isInitialLoad.value = false;
    }

    isLoading.value = true;
    if (Boolean(shouldStop.value)) {
        const duration = (new Date().getTime() - interviewStart);
        const consideredDiagnoses = diagnosis.value.evidence?.length || 0;
        const payload = {
            ...diagnosis.value,
            ...interviewResult.value,
            interview_duration: duration,
            considered_diagnoses: consideredDiagnoses
        };
        await $http.$_patientDiagnosis(payload).then(({ data }) => {
            // Set all the diagnosis data for immediate display
            useRecommendation({
                diagnosis: {
                    conditions: data.data.conditions || [],
                    evidence: diagnosis.value.evidence || [],
                    interview_token: data.data.interview_token,
                    triage_level: data.data.triage_level || null,
                    triage: data.data.triage || null,
                    has_emergency_evidence: data.data.has_emergency_evidence || false
                },
                checkup_id: data.data.checkup_id, // Include for Claude summary feature
                duration: duration,
                considered_diagnoses_count: consideredDiagnoses,
                is_immediate_result: true,
                answered_questions: answeredQuestionsList.value // Include Q&A for summary
            });

            // Navigate to diagnosis report within the health checkup flow
            const { current } = navigator.value;
            useNavigator({ current, from: current, to: 9 });
        });
    } else {
        // Use appropriate diagnosis endpoint based on assessment type
        const isEnhanced = patientInfo?.value?.assessmentType === 'enhanced';
        const diagnosisEndpoint = isEnhanced ? '$_patientDiagnosisEnhanced' : '$_patientDiagnosis';

        await $http[diagnosisEndpoint](diagnosis.value).then(({ data }) => {
            interviewResult.value = data.data;
            questionOptions.value = data.data.question?.items;
            questions.value = data.data.question;
            shouldStop.value = data.data.should_stop;
            isLoading.value = false;
        });
    }
});

const onSubmit = (activeScreen) => {
    if (activeScreen === 0) {
        // Go back
        useNavigator({ current, from: current, to: 7 });
    } else if(activeScreen === 1) {
        // User clicked Next - now we can make API call

        // Track the current question and answers for Q&A Summary
        if (questions.value && questionOptions.value.length > 0) {
            const questionData = {
                question: questions.value.text,
                type: questions.value.type,
                answers: questionOptions.value.map(item => ({
                    id: item.id,
                    name: item.name || item.common_name,
                    choice: item.choice_id,
                    duration: item.duration || null
                }))
            };
            answeredQuestionsList.value.push(questionData);
        }

        // Create a copy of existing evidence
        const existingEvidence = [...diagnosis.value.evidence];

        // For each answer in questionOptions, either update existing evidence or add new
        questionOptions.value.forEach(newAnswer => {
            const existingIndex = existingEvidence.findIndex(item => item.id === newAnswer.id);
            if (existingIndex !== -1) {
                // Update existing evidence with new choice_id and mark as interview answer
                existingEvidence[existingIndex] = {
                    ...existingEvidence[existingIndex],
                    choice_id: newAnswer.choice_id,
                    source: existingEvidence[existingIndex].source || 'interview'
                };
            } else {
                // Add new evidence and mark as interview answer
                existingEvidence.push({
                    ...newAnswer,
                    source: 'interview'
                });
            }
        });

        const payload = {
            ...diagnosis.value,
            evidence: existingEvidence
        }

        // Allow API call and update diagnosis
        shouldMakeApiCall.value = true;
        useDiagnosis(payload);
        useNavigator({ current, from: current, to: current });

        // Reset flag after triggering API call
        setTimeout(() => {
            shouldMakeApiCall.value = false;
        }, 100);
    }
}

</script>

<style scoped lang="scss">
.interview-page {
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

// Interview Progress
.interview-progress {
    display: flex;
    align-items: center;
    gap: $size-14;
    padding: $size-16 $size-20;
    background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
    border: 1px solid #d8b4fe;
    border-radius: $size-14;

    @include responsive(phone) {
        padding: $size-14 $size-16;
    }

    &__icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;

        @include responsive(phone) {
            width: 36px;
            height: 36px;
        }
    }

    &__spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e9d5ff;
        border-top-color: #9333ea;
        border-radius: 50%;
        animation: spin 1s linear infinite;

        @include responsive(phone) {
            width: 28px;
            height: 28px;
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

        @include responsive(phone) {
            font-size: $size-14;
        }
    }

    &__text {
        font-size: $size-13;
        color: #6b21a8;
        margin: 0;
        line-height: 1.4;

        @include responsive(phone) {
            font-size: $size-12;
        }
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

// Question Card
.question-card {
    background: $color-white;
    border: 2px solid $color-g-92;
    border-radius: $size-20;
    padding: $size-24;

    @include responsive(phone) {
        padding: $size-20;
        border-radius: $size-16;
    }

    &__title {
        font-size: $size-20;
        font-weight: $fw-semi-bold;
        color: $color-black;
        margin: 0 0 $size-24 0;
        line-height: 1.4;

        @include responsive(phone) {
            font-size: $size-18;
            margin-bottom: $size-20;
        }
    }
}

// Answer Options (Radio-style for group_single)
.answer-options {
    display: flex;
    flex-direction: column;
    gap: $size-12;
}

.answer-option {
    display: flex;
    align-items: center;
    gap: $size-14;
    padding: $size-16 $size-20;
    background: $color-g-97;
    border: 2px solid transparent;
    border-radius: $size-12;
    cursor: pointer;
    transition: all 0.3s ease;

    @include responsive(phone) {
        padding: $size-14 $size-16;
    }

    &:hover {
        background: $color-g-92;
    }

    &--selected {
        background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%);
        border-color: #14b8a6;

        .answer-option__radio {
            border-color: #14b8a6;
        }

        .answer-option__dot {
            background: #14b8a6;
        }
    }

    &__radio {
        width: 22px;
        height: 22px;
        border: 2px solid $color-g-77;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.3s ease;
    }

    &__dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    &__text {
        font-size: $size-15;
        font-weight: $fw-medium;
        color: $color-black;

        @include responsive(phone) {
            font-size: $size-14;
        }
    }
}

// Answer Buttons (Yes/No/Not sure)
.answer-buttons {
    display: flex;
    gap: $size-12;

    @include responsive(phone) {
        gap: $size-8;
    }
}

.answer-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-8;
    padding: $size-16 $size-20;
    background: $color-g-97;
    border: 2px solid transparent;
    border-radius: $size-12;
    font-size: $size-15;
    font-weight: $fw-medium;
    color: $color-g-54;
    cursor: pointer;
    transition: all 0.3s ease;

    @include responsive(phone) {
        padding: $size-14 $size-12;
        font-size: $size-13;
        gap: $size-6;
    }

    svg {
        width: 20px;
        height: 20px;

        @include responsive(phone) {
            width: 18px;
            height: 18px;
        }
    }

    &:hover {
        background: $color-g-92;
    }

    &--small {
        padding: $size-12 $size-16;
        font-size: $size-14;

        @include responsive(phone) {
            padding: $size-10 $size-12;
            font-size: $size-12;
        }

        svg {
            width: 16px;
            height: 16px;
        }
    }

    &--yes.answer-btn--active {
        background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
        border-color: #22c55e;
        color: #15803d;
    }

    &--no.answer-btn--active {
        background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
        border-color: #ef4444;
        color: #b91c1c;
    }

    &--unknown.answer-btn--active {
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        border-color: #0ea5e9;
        color: #0369a1;
    }
}

// Multiple Answers
.answer-multiple {
    display: flex;
    flex-direction: column;
    gap: $size-20;

    &__item {
        padding-bottom: $size-20;
        border-bottom: 1px solid $color-g-92;

        &:last-child {
            padding-bottom: 0;
            border-bottom: none;
        }
    }

    &__question {
        font-size: $size-16;
        font-weight: $fw-medium;
        color: $color-black;
        margin: 0 0 $size-12 0;

        @include responsive(phone) {
            font-size: $size-15;
        }
    }

    &__options {
        display: flex;
        gap: $size-10;

        @include responsive(phone) {
            gap: $size-8;
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
