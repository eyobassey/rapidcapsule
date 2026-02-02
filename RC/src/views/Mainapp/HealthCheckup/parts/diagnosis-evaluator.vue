<template>
    <Loader v-if="isLoading" :useOverlay="false" style="z-index:1" />
    <div v-else class="interview-page">
        <!-- Step Header -->
        <StepHero
            :step="8"
            :totalSteps="8"
            icon="hi-chat"
            title="Health Interview"
            subtitle="Answer the following questions to help us understand your symptoms better"
            @back="() => onSubmit(0)"
        />

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
        <StepFooter
            nextLabel="Next"
            :disabled="isDisabled"
            @back="() => onSubmit(0)"
            @next="() => onSubmit(1)"
        />
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, inject, watchEffect, watch } from "vue";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import RcRadio from "@/components/RCRadio";
import StepHero from "./components/StepHero.vue";
import StepFooter from "./components/StepFooter.vue";

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
// Design System Colors
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;

.interview-page {
    width: 100%;
    min-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding-bottom: 120px;
    max-width: 700px;
    margin: 0 auto;

    @media (max-width: 640px) {
        gap: 20px;
        padding-bottom: 100px;
    }
}

// Interview Progress
.interview-progress {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
    border: 1px solid #d8b4fe;
    border-radius: 14px;

    @media (max-width: 640px) {
        padding: 14px 16px;
    }

    &__icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;

        @media (max-width: 640px) {
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

        @media (max-width: 640px) {
            width: 28px;
            height: 28px;
        }
    }

    &__content {
        flex: 1;
    }

    &__title {
        font-size: 15px;
        font-weight: 600;
        color: #7c3aed;
        margin: 0 0 4px 0;

        @media (max-width: 640px) {
            font-size: 14px;
        }
    }

    &__text {
        font-size: 13px;
        color: #6b21a8;
        margin: 0;
        line-height: 1.4;

        @media (max-width: 640px) {
            font-size: 12px;
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
    background: white;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 20px;
    padding: 24px;

    @media (max-width: 640px) {
        padding: 20px;
        border-radius: 16px;
    }

    &__title {
        font-size: 20px;
        font-weight: 600;
        color: $navy;
        margin: 0 0 24px 0;
        line-height: 1.4;

        @media (max-width: 640px) {
            font-size: 18px;
            margin-bottom: 20px;
        }
    }
}

// Answer Options (Radio-style for group_single)
.answer-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.answer-option {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    background: $bg;
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;

    @media (max-width: 640px) {
        padding: 14px 16px;
    }

    &:hover {
        background: rgba(0, 0, 0, 0.04);
    }

    &--selected {
        background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
        border-color: $sky;

        .answer-option__radio {
            border-color: $sky;
        }

        .answer-option__dot {
            background: $sky;
        }
    }

    &__radio {
        width: 22px;
        height: 22px;
        border: 2px solid $gray;
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
        font-size: 15px;
        font-weight: 500;
        color: $navy;

        @media (max-width: 640px) {
            font-size: 14px;
        }
    }
}

// Answer Buttons (Yes/No/Not sure)
.answer-buttons {
    display: flex;
    gap: 12px;

    @media (max-width: 640px) {
        gap: 8px;
    }
}

.answer-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 20px;
    background: $bg;
    border: 2px solid transparent;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    color: $gray;
    cursor: pointer;
    transition: all 0.3s ease;

    @media (max-width: 640px) {
        padding: 14px 12px;
        font-size: 13px;
        gap: 6px;
    }

    svg {
        width: 20px;
        height: 20px;

        @media (max-width: 640px) {
            width: 18px;
            height: 18px;
        }
    }

    &:hover {
        background: rgba(0, 0, 0, 0.06);
    }

    &--small {
        padding: 12px 16px;
        font-size: 14px;

        @media (max-width: 640px) {
            padding: 10px 12px;
            font-size: 12px;
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
        background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
        border-color: $sky;
        color: $sky-dark;
    }
}

// Multiple Answers
.answer-multiple {
    display: flex;
    flex-direction: column;
    gap: 20px;

    &__item {
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);

        &:last-child {
            padding-bottom: 0;
            border-bottom: none;
        }
    }

    &__question {
        font-size: 16px;
        font-weight: 500;
        color: $navy;
        margin: 0 0 12px 0;

        @media (max-width: 640px) {
            font-size: 15px;
        }
    }

    &__options {
        display: flex;
        gap: 10px;

        @media (max-width: 640px) {
            gap: 8px;
        }
    }
}
</style>
