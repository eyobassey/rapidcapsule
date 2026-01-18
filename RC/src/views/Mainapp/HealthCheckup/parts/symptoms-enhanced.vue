<template>
	<Loader v-if="isFetching || isLoading" :useOverlay="false" style="z-index:1" />
    <div v-else class="symptoms-container">
        <div class="symptoms-header">
            <h1 class="symptoms-header__title">Enhanced Health Assessment</h1>
            <p class="symptoms-header__description">
                Please select your symptoms and tell us how long you've experienced them for better diagnosis.
            </p>
        </div>
        
        <!-- Assessment Type Selection -->
        <div class="assessment-type-selection" v-if="!assessmentTypeSelected">
            <h3 class="assessment-type__title">Choose Your Assessment Type</h3>
            <div class="assessment-options">
                <div 
                    class="assessment-option" 
                    :class="{ active: selectedAssessmentType === 'quick' }"
                    @click="selectAssessmentType('quick')"
                >
                    <div class="assessment-option__icon">⚡</div>
                    <h4>Quick Assessment</h4>
                    <p>5-7 focused questions for immediate concerns</p>
                    <span class="duration-badge">~3 minutes</span>
                </div>
                <div 
                    class="assessment-option" 
                    :class="{ active: selectedAssessmentType === 'comprehensive' }"
                    @click="selectAssessmentType('comprehensive')"
                >
                    <div class="assessment-option__icon">🔍</div>
                    <h4>Comprehensive Assessment</h4>
                    <p>Detailed evaluation with 10-15 questions</p>
                    <span class="duration-badge">~5 minutes</span>
                </div>
            </div>
            <rc-button
                label="Continue"
                type="primary"
                size="medium"
                :disabled="!selectedAssessmentType"
                @click="confirmAssessmentType"
            />
        </div>

        <!-- Symptoms Selection with Duration -->
        <div v-else class="symptoms-content">
            <h3 class="symptoms-content__header--title">
                Do you have any of the following symptoms?
            </h3>
            <div class="symptoms-content__body">
                <template v-for="(symptom, index) in symptomsOptions" :key="JSON.stringify(symptom)">
                    <div class="symptom-item">
                        <rc-checkbox 
                            v-model="symptom.status" 
                            class="symptom-checkbox"
                            @update:modelValue="onSymptomToggle(symptom, index)"
                        >
                            <span class="symptom-name">{{ symptom.common_name }}</span>
                        </rc-checkbox>
                        
                        <!-- Duration Selection for Selected Symptoms -->
                        <div v-if="symptom.status" class="duration-selection">
                            <label class="duration-label">How long have you had this symptom?</label>
                            <select 
                                v-model="symptom.duration" 
                                class="duration-select"
                                @change="onDurationChange(symptom, index)"
                            >
                                <option value="">Select duration...</option>
                                <option value="hours">Less than 1 day</option>
                                <option value="days_1_3">1-3 days</option>
                                <option value="days_4_7">4-7 days</option>
                                <option value="weeks_1_2">1-2 weeks</option>
                                <option value="weeks_2_4">2-4 weeks</option>
                                <option value="months">More than 1 month</option>
                                <option value="unknown">I'm not sure</option>
                            </select>
                        </div>
                    </div>
                </template>
            </div>
            
            <!-- Selected Symptoms Summary -->
            <div v-if="selectedSymptomsCount > 0" class="selected-symptoms-summary">
                <h4>Selected Symptoms Summary</h4>
                <div class="summary-list">
                    <div 
                        v-for="symptom in selectedSymptoms" 
                        :key="symptom.id"
                        class="summary-item"
                    >
                        <span class="summary-symptom">{{ symptom.common_name }}</span>
                        <span class="summary-duration" :class="getDurationClass(symptom.duration)">
                            {{ getDurationText(symptom.duration) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div class="symptoms-footer" v-if="assessmentTypeSelected">
            <rc-button
                label="Back"
                type="tertiary"
                size="small"
                iconLeft
                iconName="arrow-left"
                @click="goBack"
            />
            <rc-button
                label="Continue"
                type="primary"
                size="small"
                iconRight
                iconName="arrow-right"
                :disabled="!canContinue"
                @click="onSubmit"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, inject, computed, onMounted } from "vue";
import RcCheckbox from "@/components/inputs/check-box";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";

const $http = inject('$http');
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');
const { diagnosis, useDiagnosis } = inject('$_DIAGNOSIS');

// State management
const isLoading = ref(true);
const assessmentTypeSelected = ref(false);
const selectedAssessmentType = ref('');
const symptomsOptions = ref([]);
const symptoms = ref([]);

// Computed properties
const selectedSymptoms = computed(() => 
    symptomsOptions.value.filter(symptom => symptom.status)
);

const selectedSymptomsCount = computed(() => selectedSymptoms.value.length);

const canContinue = computed(() => {
    if (selectedSymptomsCount.value === 0) return true; // Can continue with no symptoms
    
    // If symptoms are selected, at least one should have duration
    return selectedSymptoms.value.some(symptom => symptom.duration);
});

// Methods
const selectAssessmentType = (type) => {
    selectedAssessmentType.value = type;
};

const confirmAssessmentType = () => {
    assessmentTypeSelected.value = true;
    loadSymptoms();
};

const loadSymptoms = async () => {
    isLoading.value = true;
    
    symptoms.value = {
        sex: patientInfo.value.gender,
        age: { value: patientInfo.value.age },
        evidence: [
            ...patientInfo.value.observations,
            ...patientInfo.value.region,
            ...patientInfo.value.factors,
        ],
        extras: {
            triage_focused: selectedAssessmentType.value === 'quick',
            enable_symptom_duration: true
        }
    };

    try {
        const { data } = await $http.$_getSuggestedSymptoms(symptoms.value);
        symptomsOptions.value = data.data.map(symptom => ({
            ...symptom,
            status: false,
            duration: ''
        }));
        isLoading.value = false;
    } catch (error) {
        console.error('Error loading symptoms:', error);
        isLoading.value = false;
    }
};

const onSymptomToggle = (symptom, index) => {
    if (!symptom.status) {
        // If unchecking, clear duration
        symptom.duration = '';
    }
};

const onDurationChange = (symptom, index) => {
    // Auto-save or validation can be added here
    console.log(`Duration changed for ${symptom.common_name}: ${symptom.duration}`);
};

const getDurationText = (duration) => {
    const durationMap = {
        'hours': 'Less than 1 day',
        'days_1_3': '1-3 days',
        'days_4_7': '4-7 days',
        'weeks_1_2': '1-2 weeks',
        'weeks_2_4': '2-4 weeks',
        'months': 'More than 1 month',
        'unknown': 'Duration unknown'
    };
    return durationMap[duration] || 'Not specified';
};

const getDurationClass = (duration) => {
    const classMap = {
        'hours': 'duration-acute',
        'days_1_3': 'duration-recent',
        'days_4_7': 'duration-recent',
        'weeks_1_2': 'duration-ongoing',
        'weeks_2_4': 'duration-ongoing',
        'months': 'duration-chronic',
        'unknown': 'duration-unknown'
    };
    return classMap[duration] || '';
};

const goBack = () => {
    if (assessmentTypeSelected.value) {
        assessmentTypeSelected.value = false;
        selectedAssessmentType.value = '';
    } else {
        const { current, from } = navigator.value;
        usePatientInfo(patientInfo.value);
        useNavigator({ current, from: current, to: from });
    }
};

const onSubmit = () => {
    const { current } = navigator.value;

    // CRITICAL: Mark selected symptoms with 'source: initial' for Infermedica's should_stop algorithm
    // Without this marker, the interview will never know when to stop
    const selectedSymptomsWithDuration = symptomsOptions.value.map((item) => ({
        ...item,
        choice_id: item.status ? 'present' : 'absent',
        duration: item.duration || undefined, // Only include duration if specified
        source: 'initial' // Required for Infermedica to calculate should_stop
    }));

    // Enhanced symptoms data with duration support
    const enhancedSymptoms = {
        ...symptoms.value,
        should_stop: false,
        evidence: [...symptoms.value.evidence, ...selectedSymptomsWithDuration],
        extras: {
            enable_symptom_duration: true,
            triage_focused: selectedAssessmentType.value === 'quick',
            assessment_type: selectedAssessmentType.value
        }
    };

    // Store enhanced diagnosis data
    useDiagnosis(enhancedSymptoms);
    
    // Navigate to next step (diagnosis evaluator)
    useNavigator({ current, from: current, to: 8 });
};

// Initialize component
onMounted(() => {
    // Component starts with assessment type selection
    isLoading.value = false;
});
</script>

<style scoped lang="scss">
.symptoms-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
    background: #fafafa;
    padding: 20px;
    overflow-y: auto;
}

.symptoms-header {
    text-align: center;
    margin-bottom: 20px;
    
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
    }
}

// Assessment Type Selection
.assessment-type-selection {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
}

.assessment-type__title {
    font-size: 20px;
    font-weight: 500;
    color: #333;
    margin-bottom: 16px;
}

.assessment-options {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    width: 100%;
    max-width: 600px;
    
    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
}

.assessment-option {
    border: 2px solid #e1e5e9;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
    
    &:hover {
        border-color: #007bff;
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.1);
    }
    
    &.active {
        border-color: #007bff;
        background: #f8f9ff;
        box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
    }
    
    &__icon {
        font-size: 32px;
        margin-bottom: 12px;
    }
    
    h4 {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
    }
    
    p {
        font-size: 14px;
        color: #666;
        margin-bottom: 12px;
        line-height: 1.4;
    }
}

.duration-badge {
    display: inline-block;
    background: #e3f2fd;
    color: #1976d2;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
}

// Symptoms Content
.symptoms-content {
    flex: 1;
    
    &__header--title {
        font-size: 20px;
        font-weight: 500;
        color: #333;
        margin-bottom: 20px;
        text-align: center;
    }
    
    &__body {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }
}

.symptom-item {
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.2s ease;
    
    &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
}

.symptom-checkbox {
    margin-bottom: 12px;
}

.symptom-name {
    font-size: 16px;
    font-weight: 500;
    color: #333;
}

.duration-selection {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
}

.duration-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #555;
    margin-bottom: 8px;
}

.duration-select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    
    &:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.2);
    }
}

// Selected Symptoms Summary
.selected-symptoms-summary {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 16px;
    margin-top: 20px;
    
    h4 {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin-bottom: 12px;
    }
}

.summary-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: white;
    border-radius: 6px;
    border-left: 4px solid #007bff;
}

.summary-symptom {
    font-weight: 500;
    color: #333;
}

.summary-duration {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 500;
    
    &.duration-acute {
        background: #ffebee;
        color: #c62828;
    }
    
    &.duration-recent {
        background: #fff3e0;
        color: #ef6c00;
    }
    
    &.duration-ongoing {
        background: #f3e5f5;
        color: #7b1fa2;
    }
    
    &.duration-chronic {
        background: #e8f5e8;
        color: #2e7d32;
    }
    
    &.duration-unknown {
        background: #f5f5f5;
        color: #616161;
    }
}

// Footer
.symptoms-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 20px;
    border-top: 1px solid #e1e5e9;
    margin-top: auto;
}

// Responsive Design
@media (max-width: 768px) {
    .symptoms-container {
        padding: 16px;
    }
    
    .symptoms-header__title {
        font-size: 24px;
    }
    
    .assessment-option {
        padding: 20px;
    }
}
</style>