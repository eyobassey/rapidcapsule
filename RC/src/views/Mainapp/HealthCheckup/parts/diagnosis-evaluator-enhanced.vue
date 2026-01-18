<template>
	<Loader v-if="isLoading" :useOverlay="false" style="z-index:1" />
    <div v-else class="diagnosis-container">
        <div class="diagnosis-header">
            <h1 class="diagnosis-header__title">
                {{ assessmentTypeTitle }}
            </h1>
            <p class="diagnosis-header__description">
                {{ assessmentTypeDescription }}
            </p>
            <div class="progress-indicator">
                <div class="progress-bar">
                    <div 
                        class="progress-fill" 
                        :style="{ width: progressPercentage + '%' }"
                    ></div>
                </div>
                <span class="progress-text">{{ progressText }}</span>
            </div>
        </div>
        
        <div class="diagnosis-content">
            <h3 class="diagnosis-content__header--title">{{ questions.text }}</h3>

            <!-- Debug: Show question type and items -->
            <div v-if="false" style="background: #f0f0f0; padding: 10px; margin: 10px 0; font-size: 12px;">
                Type: {{ questions.type }}<br>
                Items: {{ questionOptions.length }}<br>
                Items data: {{ JSON.stringify(questionOptions) }}
            </div>

            <!-- Group Single Questions -->
            <div v-if="questions.type === 'group_single'" class="questionaire-content__body">
                <div class="questionaire-content__item">
                    <rc-radio
                        :radio-name="questions.text"
                        class="questionaire-content__item--options"
                        v-model="groupSingle"
                        :options="questionOptions.map(i => ({...i, value: i}))"
                    />
                </div>
            </div>

            <!-- Single Questions with Enhanced UI (including duration questions) -->
            <div v-if="questions.type === 'single' || questions.type === 'duration' || (questions.type && questionOptions.length === 1)" class="single-question-container">
                <div class="single-question-item">
                    <!-- Show regular Yes/No/Unknown options if we have question items -->
                    <div v-if="questionOptions && questionOptions.length > 0" class="question-options">
                        <div 
                            class="option-button option-yes"
                            :class="{ 'active': questionOptions[0]?.choice_id === 'present' }"
                            @click="setAnswer(0, 'present')"
                        >
                            <div class="option-icon">✓</div>
                            <span class="option-text">Yes</span>
                        </div>
                        
                        <div 
                            class="option-button option-no"
                            :class="{ 'active': questionOptions[0]?.choice_id === 'absent' }"
                            @click="setAnswer(0, 'absent')"
                        >
                            <div class="option-icon">✗</div>
                            <span class="option-text">No</span>
                        </div>
                        
                        <div 
                            class="option-button option-unknown"
                            :class="{ 'active': questionOptions[0]?.choice_id === 'unknown' }"
                            @click="setAnswer(0, 'unknown')"
                        >
                            <div class="option-icon">?</div>
                            <span class="option-text">I don't know</span>
                        </div>
                    </div>
                    
                    <!-- Show duration-specific options if this is a pure duration question -->
                    <div v-else-if="questions.text && questions.text.toLowerCase().includes('how long')" class="duration-options">
                        <div 
                            v-for="option in durationOptions" 
                            :key="option.value"
                            class="duration-option"
                            :class="{ 'active': selectedDuration === option.value }"
                            @click="selectDuration(option.value)"
                        >
                            <span class="duration-text">{{ option.label }}</span>
                        </div>
                    </div>
                    
                    <!-- Duration Question for Present Symptoms -->
                    <div v-if="questionOptions[0]?.choice_id === 'present' && enableDurationQuestions" class="duration-question">
                        <h4 class="duration-question__title">How long have you had this symptom?</h4>
                        <div class="duration-options">
                            <div 
                                v-for="option in durationOptions" 
                                :key="option.value"
                                class="duration-option"
                                :class="{ 'active': selectedDuration === option.value }"
                                @click="selectDuration(option.value)"
                            >
                                <span class="duration-text">{{ option.label }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Group Multiple Questions -->
            <div v-if="questions.type === 'group_multiple'" class="group-multiple-container">
                <div v-for="(question, i) in questionOptions" :key="question.id" class="multiple-question-item">
                    <h4 class="question-title">{{ question.name }}</h4>
                    <div class="question-options">
                        <div 
                            class="option-button option-yes"
                            :class="{ 'active': question.choice_id === 'present' }"
                            @click="setAnswer(i, 'present')"
                        >
                            <div class="option-icon">✓</div>
                            <span class="option-text">Yes</span>
                        </div>
                        
                        <div 
                            class="option-button option-no"
                            :class="{ 'active': question.choice_id === 'absent' }"
                            @click="setAnswer(i, 'absent')"
                        >
                            <div class="option-icon">✗</div>
                            <span class="option-text">No</span>
                        </div>
                        
                        <div 
                            class="option-button option-unknown"
                            :class="{ 'active': question.choice_id === 'unknown' }"
                            @click="setAnswer(i, 'unknown')"
                        >
                            <div class="option-icon">?</div>
                            <span class="option-text">I don't know</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="diagnosis-footer">
            <rc-button
                label="Previous"
                type="tertiary"
                size="small"
                iconLeft
                iconName="arrow-left"
                @click="onSubmit(0)"
            />
            <rc-button
                label="Next"
                type="primary"
                size="small"
                iconRight
                iconName="arrow-right"
                @click="onSubmit(1)"
                :disabled="isDisabled"
            />
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, inject, watchEffect, watch, computed } from "vue";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import RcRadio from "@/components/RCRadio";

const $http = inject('$_HTTP');
const router = useRouter();
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { diagnosis, useDiagnosis } = inject('$_DIAGNOSIS');
const { recommendation, useRecommendation } = inject('$_RECOMMENDATION');

// State
const interviewStart = new Date().getTime();
const isLoading = ref(true);
const isDisabled = ref(true);
const questions = ref({});
const questionOptions = ref([]);
const groupSingle = ref([]);
const interviewResult = ref({});
const shouldStop = ref(false);
const selectedDuration = ref('');
const questionCount = ref(0);
const currentQuestionIndex = ref(0);
const shouldMakeApiCall = ref(true); // Control flag for API calls
const isInitialLoad = ref(true);

// Enhanced features
const enableDurationQuestions = ref(true);
const assessmentType = computed(() => diagnosis.value?.extras?.assessment_type || 'comprehensive');
const answeredQuestionsList = ref([]); // Track all questions actually asked and answered

const durationOptions = [
    { value: 'hours', label: 'Less than 1 day' },
    { value: 'days_1_3', label: '1-3 days' },
    { value: 'days_4_7', label: '4-7 days' },
    { value: 'weeks_1_2', label: '1-2 weeks' },
    { value: 'weeks_2_4', label: '2-4 weeks' },
    { value: 'months', label: 'More than 1 month' }
];

// Computed properties
const assessmentTypeTitle = computed(() => {
    return assessmentType.value === 'quick' 
        ? 'Quick Health Assessment' 
        : 'Comprehensive Health Assessment';
});

const assessmentTypeDescription = computed(() => {
    return assessmentType.value === 'quick'
        ? 'We\'ll ask you a few focused questions to understand your immediate health concerns.'
        : 'Please answer the following questions to help us fully understand how you feel.';
});

const progressPercentage = computed(() => {
    if (questionCount.value === 0) return 0;
    return Math.min(((currentQuestionIndex.value + 1) / Math.max(questionCount.value, 5)) * 100, 100);
});

const progressText = computed(() => {
    return `Question ${currentQuestionIndex.value + 1} of ${Math.max(questionCount.value, 5)}`;
});

// Watchers
watch(groupSingle, (value) => {
    questionOptions.value.forEach(item => {
        if (item.id === value.id) item.choice_id = 'present';
        else item.choice_id = 'absent'
    });
});

watchEffect(() => {
    if (questions.value.type === 'group_multiple') {
        questionOptions.value.forEach(item => {
            if (item.status) item.choice_id = 'present';
            else item.choice_id = 'absent'
        });
    }
});

watchEffect(() => {
    // Check if this is a pure duration question
    if (questions.value?.text && questions.value.text.toLowerCase().includes('how long') && !questionOptions.value?.length) {
        // For standalone duration questions, check if duration is selected
        isDisabled.value = !selectedDuration.value;
    } else if (questionOptions.value?.length) {
        if (questionOptions.value.some(i => i.choice_id)) {
            // For duration-enabled questions, check if duration is required
            if (enableDurationQuestions.value && questions.value.type === 'single') {
                const selectedOption = questionOptions.value[0];
                if (selectedOption?.choice_id === 'present') {
                    isDisabled.value = !selectedDuration.value;
                } else {
                    isDisabled.value = false;
                }
            } else {
                isDisabled.value = false;
            }
        } else {
            isDisabled.value = true;
        }
    } else {
        // No options and not a duration question - check if we should stop
        if (shouldStop.value || currentQuestionIndex.value > 25) {
            // If we should stop or have asked too many questions, enable the button to proceed to diagnosis
            isDisabled.value = false;
        } else {
            // Otherwise, something's wrong with the question data
            isDisabled.value = true;
        }
    }
});

// Main diagnosis logic
watchEffect(async () => {
    // Only make API call when flag is set or on initial load
    if (!shouldMakeApiCall.value && !isInitialLoad.value) {
        return;
    }
    
    // Reset the flag immediately to prevent multiple calls
    if (shouldMakeApiCall.value) {
        shouldMakeApiCall.value = false;
    }
    
    if (isInitialLoad.value) {
        isInitialLoad.value = false;
    }
    
    isLoading.value = true;
    
    // Add debug logging to understand question structure
    if (questions.value && questions.value.text) {
        console.log('Question received:', {
            text: questions.value.text,
            type: questions.value.type,
            evidence_id: questions.value.evidence_id,
            items: questionOptions.value
        });
    }
    
    if (Boolean(shouldStop.value)) {
        // Final diagnosis with duration data
        const duration = (new Date().getTime() - interviewStart);
        const consideredDiagnoses = diagnosis.value.evidence?.length || 0;
        
        const payload = { 
            ...diagnosis.value, 
            ...interviewResult.value,
            interview_duration: duration,
            considered_diagnoses: consideredDiagnoses,
            extras: {
                ...diagnosis.value.extras,
                enable_symptom_duration: true,
                triage_focused: assessmentType.value === 'quick'
            }
        };
        
        try {
            // Use enhanced diagnosis endpoint
            const { data } = await $http.$_patientDiagnosisEnhanced(payload);
            
            console.log('Enhanced diagnosis API response:', data);
            console.log('Conditions found:', data.data?.conditions);
            console.log('Evidence used:', diagnosis.value.evidence);
            
            useRecommendation({
                diagnosis: {
                    conditions: data.data.conditions || [],
                    evidence: diagnosis.value.evidence || [],
                    interview_token: data.data.interview_token,
                    triage_level: data.data.triage?.level,
                    has_emergency_evidence: data.data.has_emergency_evidence
                },
                duration: duration,
                considered_diagnoses_count: consideredDiagnoses,
                is_immediate_result: true,
                assessment_type: assessmentType.value,
                has_duration_data: true,
                answered_questions: answeredQuestionsList.value // Pass the tracked questions
            });
            
            // Navigate to enhanced diagnosis report
            const { current } = navigator.value;
            useNavigator({ current, from: current, to: 9 });
            
        } catch (error) {
            console.error('Enhanced diagnosis error:', error);
            // Fallback to regular diagnosis
            const { data } = await $http.$_patientDiagnosis(payload);
            useRecommendation({
                diagnosis: {
                    conditions: data.data.conditions || [],
                    evidence: diagnosis.value.evidence || [],
                    interview_token: data.data.interview_token
                },
                duration: duration,
                considered_diagnoses_count: consideredDiagnoses,
                is_immediate_result: true,
                answered_questions: answeredQuestionsList.value // Pass the tracked questions
            });
            
            const { current } = navigator.value;
            useNavigator({ current, from: current, to: 9 });
        }
    } else {
        // Continue interview with enhanced diagnosis
        try {
            const { data } = await $http.$_patientDiagnosisEnhanced(diagnosis.value);
            
            interviewResult.value = data.data; 
            questionOptions.value = data.data.question?.items || [];
            questions.value = data.data.question || {};
            shouldStop.value = data.data.should_stop;
            
            // Safety check: if we've asked many questions but still no stop signal and no question data
            if (currentQuestionIndex.value > 25 && (!questions.value.text || !questionOptions.value.length)) {
                console.log('Safety stop: Reached 25+ questions with no clear continuation. Forcing stop.');
                shouldStop.value = true;
                // Re-trigger the watchEffect to proceed to final diagnosis
                shouldMakeApiCall.value = true;
                return;
            }
            
            // Update progress tracking
            currentQuestionIndex.value++;
            if (assessmentType.value === 'quick') {
                questionCount.value = Math.min(currentQuestionIndex.value + 3, 10); // Allow more questions for quick
            } else {
                // For comprehensive assessments, don't artificially limit question count
                // Let Infermedica determine when to stop naturally based on confidence
                questionCount.value = currentQuestionIndex.value + 2; // Show estimated remaining
            }
            
            isLoading.value = false;
            
        } catch (error) {
            console.error('Enhanced diagnosis error, falling back:', error);
            // Fallback to regular diagnosis
            const { data } = await $http.$_patientDiagnosis(diagnosis.value);
            interviewResult.value = data.data; 
            questionOptions.value = data.data.question?.items || [];
            questions.value = data.data.question || {};
            shouldStop.value = data.data.should_stop;
            isLoading.value = false;
        }
    }
});

// Methods
const setAnswer = (index, choiceId) => {
    if (questions.value.type === 'single') {
        questionOptions.value[index] = {
            ...questionOptions.value[index],
            choice_id: choiceId
        };
        
        // Reset duration if not present
        if (choiceId !== 'present') {
            selectedDuration.value = '';
        }
    } else {
        questionOptions.value[index].choice_id = choiceId;
    }
};

const selectDuration = (duration) => {
    selectedDuration.value = duration;
};

const onSubmit = (activeScreen) => {
    if (activeScreen === 0) {
        // Go back
        useNavigator({ current: navigator.value.current, from: navigator.value.current, to: 7 });
    } else if (activeScreen === 1) {
        // Special case: if we've exceeded question limit or should stop, proceed to diagnosis
        if (shouldStop.value || currentQuestionIndex.value > 25 || 
            (!questions.value?.text && !questionOptions.value?.length)) {
            console.log('Proceeding to final diagnosis - shouldStop:', shouldStop.value, 
                       'questionIndex:', currentQuestionIndex.value);
            
            // Force shouldStop to true to trigger final diagnosis
            shouldStop.value = true;
            shouldMakeApiCall.value = true;
            return;
        }
        
        // Track the question and answer before submitting
        if (questions.value?.text) {
            const questionData = {
                question: questions.value.text,
                type: questions.value.type,
                answers: []
            };
            
            console.log('Tracking question - Type:', questions.value.type, 'Text:', questions.value.text);
            console.log('Question options:', questionOptions.value);
            console.log('Group single:', groupSingle.value);
            
            // Collect answers based on question type
            if (questions.value.type === 'single' && questionOptions.value.length > 0) {
                const option = questionOptions.value[0];
                if (option?.choice_id) {
                    questionData.answers.push({
                        name: option.common_name || option.name || questions.value.text,
                        choice: option.choice_id,
                        duration: selectedDuration.value || null
                    });
                    console.log('Tracked single answer:', option.choice_id);
                }
            } else if (questions.value.type === 'group_single') {
                // Fix: group_single stores the selected value directly
                if (groupSingle.value && Object.keys(groupSingle.value).length > 0) {
                    questionData.answers.push({
                        name: groupSingle.value.common_name || groupSingle.value.name || 'Selected option',
                        choice: 'present'
                    });
                    console.log('Tracked group_single answer');
                }
            } else if (questions.value.type === 'group_multiple') {
                questionOptions.value.forEach(option => {
                    if (option.choice_id) {
                        questionData.answers.push({
                            name: option.common_name || option.name,
                            choice: option.choice_id
                        });
                    }
                });
                console.log('Tracked group_multiple answers:', questionData.answers.length);
            } else if (questions.value.text.toLowerCase().includes('how long') && selectedDuration.value) {
                // Duration-only question
                questionData.answers.push({
                    name: 'Duration',
                    choice: selectedDuration.value,
                    isDuration: true
                });
                console.log('Tracked duration answer:', selectedDuration.value);
            }
            
            // Always add the question even if no answers (to track what was asked)
            answeredQuestionsList.value.push(questionData);
            console.log('Total tracked questions so far:', answeredQuestionsList.value.length);
            console.log('Added question to tracking:', questionData);
        } else {
            console.log('No question text to track');
        }
        
        let payload;
        
        // Check if this is a standalone duration question
        if (questions.value?.text && questions.value.text.toLowerCase().includes('how long') && !questionOptions.value?.length) {
            // Handle standalone duration question - Infermedica expects a specific format
            const evidenceId = questions.value.evidence_id || questions.value.id;
            
            // Convert our duration selection to Infermedica format
            const durationMapping = {
                'hours': { value: 12, unit: 'hour' },
                'days_1_3': { value: 2, unit: 'day' },
                'days_4_7': { value: 5, unit: 'day' },
                'weeks_1_2': { value: 10, unit: 'day' },
                'weeks_2_4': { value: 3, unit: 'week' },
                'months': { value: 5, unit: 'week' }
            };
            
            const durationData = durationMapping[selectedDuration.value];
            
            if (evidenceId && durationData) {
                // Add the duration answer as new evidence
                const durationEvidence = {
                    id: evidenceId,
                    choice_id: 'present',
                    duration: durationData,
                    source: 'interview'
                };
                
                // Check if this evidence already exists and update it, or add it
                const existingEvidence = [...(diagnosis.value.evidence || [])];
                const existingIndex = existingEvidence.findIndex(e => e.id === evidenceId);
                
                if (existingIndex >= 0) {
                    // Update existing evidence with duration
                    existingEvidence[existingIndex] = {
                        ...existingEvidence[existingIndex],
                        duration: durationData,
                        source: existingEvidence[existingIndex].source || 'interview'
                    };
                } else {
                    // Add new evidence with duration
                    existingEvidence.push(durationEvidence);
                }
                
                payload = {
                    ...diagnosis.value,
                    evidence: existingEvidence,
                    extras: {
                        ...diagnosis.value.extras,
                        enable_symptom_duration: true,
                        triage_focused: assessmentType.value === 'quick'
                    }
                };
            } else {
                // Fallback if we don't have proper evidence ID
                console.warn('No evidence_id found for duration question');
                payload = diagnosis.value;
            }
        } else {
            // Process regular answers with duration data
            const processedOptions = questionOptions.value.map(option => {
                const processed = { ...option };
                
                // Add duration data for present symptoms
                if (option.choice_id === 'present' && selectedDuration.value && enableDurationQuestions.value) {
                    processed.duration = selectedDuration.value;
                }
                
                // Mark interview answers with source to distinguish from auto-generated evidence
                if (option.choice_id && option.choice_id !== 'unknown') {
                    processed.source = 'interview';
                }
                
                return processed;
            });
            
            payload = {
                ...diagnosis.value,
                evidence: [
                    ...diagnosis.value.evidence,
                    ...processedOptions
                ],
                extras: {
                    ...diagnosis.value.extras,
                    enable_symptom_duration: true,
                    triage_focused: assessmentType.value === 'quick'
                }
            };
        }

        // Reset for next question
        selectedDuration.value = '';
        
        // Update diagnosis state and trigger API call
        useDiagnosis(payload);
        shouldMakeApiCall.value = true; // Set flag to trigger API call
    }
};
</script>

<style scoped lang="scss">
.diagnosis-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
    background: #fafafa;
    padding: 20px;
    overflow-y: auto;
}

.diagnosis-header {
    text-align: center;
    
    &__title {
        font-size: 28px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
    }
    
    &__description {
        font-size: 16px;
        color: #666;
        line-height: 1.5;
        margin-bottom: 20px;
    }
}

.progress-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

.progress-bar {
    width: 100%;
    max-width: 300px;
    height: 8px;
    background: #e1e5e9;
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #007bff, #0056b3);
    transition: width 0.3s ease;
}

.progress-text {
    font-size: 14px;
    color: #666;
    font-weight: 500;
}

.diagnosis-content {
    flex: 1;
    
    &__header--title {
        font-size: 20px;
        font-weight: 500;
        color: #333;
        margin-bottom: 30px;
        text-align: center;
        line-height: 1.4;
    }
}

// Single Question Styles
.single-question-container {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.single-question-item {
    width: 100%;
    max-width: 500px;
}

.question-options {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
}

.option-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 16px;
    border: 2px solid #e1e5e9;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
        border-color: #007bff;
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.1);
    }
    
    &.active {
        border-color: #007bff;
        background: #f8f9ff;
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
    }
    
    &.option-yes.active {
        border-color: #28a745;
        background: #f8fff9;
        
        .option-icon {
            background: #28a745;
            color: white;
        }
    }
    
    &.option-no.active {
        border-color: #dc3545;
        background: #fff8f8;
        
        .option-icon {
            background: #dc3545;
            color: white;
        }
    }
    
    &.option-unknown.active {
        border-color: #ffc107;
        background: #fffdf8;
        
        .option-icon {
            background: #ffc107;
            color: white;
        }
    }
}

.option-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 12px;
    transition: all 0.3s ease;
}

.option-text {
    font-size: 16px;
    font-weight: 500;
    color: #333;
}

// Duration Question Styles
.duration-question {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 12px;
    padding: 20px;
    
    &__title {
        font-size: 18px;
        font-weight: 500;
        color: #333;
        margin-bottom: 16px;
        text-align: center;
    }
}

.duration-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
}

.duration-option {
    padding: 12px 16px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    background: white;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
    
    &:hover {
        border-color: #007bff;
    }
    
    &.active {
        border-color: #007bff;
        background: #f8f9ff;
    }
}

.duration-text {
    font-size: 14px;
    font-weight: 500;
    color: #333;
}

// Group Multiple Questions
.group-multiple-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 600px;
    margin: 0 auto;
}

.multiple-question-item {
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 12px;
    padding: 20px;
}

.question-title {
    font-size: 16px;
    font-weight: 500;
    color: #333;
    margin-bottom: 16px;
    text-align: center;
}

// Footer
.diagnosis-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 20px;
    border-top: 1px solid #e1e5e9;
    margin-top: auto;
}

// Responsive Design
@media (max-width: 768px) {
    .diagnosis-container {
        padding: 16px;
    }
    
    .diagnosis-header__title {
        font-size: 24px;
    }
    
    .question-options {
        gap: 12px;
    }
    
    .option-button {
        padding: 16px 12px;
    }
}
</style>