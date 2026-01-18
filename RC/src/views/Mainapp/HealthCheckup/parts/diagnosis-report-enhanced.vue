<template>
    <div class="page-content">
        <div class="diagnosis-container">
            <!-- Header with Enhancement Badge -->
            <div class="diagnosis-header">
                <div class="assessment-info">
                    <h1 class="assessment-title">
                        {{ assessmentTypeTitle }} Results
                    </h1>
                    <div class="enhancement-badges">
                        <span class="badge badge-enhanced">Duration Analysis</span>
                        <span v-if="hasDurationData" class="badge badge-premium">Enhanced Accuracy</span>
                        <span class="badge badge-assessment">{{ assessmentType }} Assessment</span>
                    </div>
                </div>
                <div class="action-buttons">
                    <ButtonIcon type="primary" iconName="download" @click="downloadPDF" />
                    <ButtonIcon type="primary" iconName="icon-takeout" @click="shareReport" />
                </div>
            </div>
            
            <!-- Assessment Summary -->
            <div class="assessment-summary">
                <div class="summary-stats">
                    <div class="stat-item">
                        <span class="stat-label">Assessment Duration</span>
                        <span class="stat-value">{{ formatDuration(assessmentDuration) }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Questions Answered</span>
                        <span class="stat-value">{{ consideredDiagnoses }}</span>
                    </div>
                    <div class="stat-item" v-if="hasDurationData">
                        <span class="stat-label">Symptoms with Duration</span>
                        <span class="stat-value">{{ symptomsWithDuration }}</span>
                    </div>
                </div>
            </div>

            <div class="content-section">
                <div class="content-left-section summary-section-desktop">
                    <h2 class="content-left-section__heading">Results</h2>
                    <div class="content-left-section__body">
                        
                        <!-- Triage Level Alert -->
                        <div v-if="triageLevel && triageLevel !== 'non_urgent'" class="triage-alert" :class="triageAlertClass">
                            <div class="alert-icon">{{ triageIcon }}</div>
                            <div class="alert-content">
                                <h3 class="alert-title">{{ triageTitle }}</h3>
                                <p class="alert-description">{{ triageDescription }}</p>
                            </div>
                        </div>

                        <div v-if="conditions.length" class="left-section__body--top-section">
                            <h3 class="left-section__body--title">Possible Conditions</h3>
                            <p class="left-section__body--description">
                                Based on your symptoms and their duration, here are the possible conditions 
                                arranged by likelihood. Duration analysis helps improve diagnostic accuracy.
                            </p>
                        </div>
                        <div v-else class="left-section__body--top-section">
                            <h3 class="left-section__body--title">No Conditions Found</h3>
                            <p class="left-section__body--description">
                                Based on your current symptoms, there are no immediate concerns. Continue monitoring 
                                your health and consult a healthcare professional if symptoms develop or worsen.
                            </p>
                        </div>

                        <!-- Enhanced Conditions Display -->
                        <div v-if="conditions.length" class="left-section-content__results--bottom-section">
                            <!-- Debug info -->
                            <div v-if="false" style="background: #f0f0f0; padding: 10px; margin: 10px 0; font-size: 12px;">
                                More likely conditions length: {{ moreLikelyConditions.length }}<br>
                                First condition: {{ moreLikelyConditions[0]?.common_name }}<br>
                            </div>
                            
                            <div class="left-section-content__results--most-likely">
                                <div v-for="(condition, index) in moreLikelyConditions" :key="condition.id || index" class="enhanced-condition-card">
                                    <div class="condition-header">
                                        <h4 class="condition-name">{{ condition.common_name || condition.name || 'Unknown Condition' }}</h4>
                                        <div class="condition-confidence">
                                            <span class="confidence-label">Confidence:</span>
                                            <span class="confidence-value">{{ Math.round((condition.probability || 0) * 100) }}%</span>
                                        </div>
                                    </div>
                                    
                                    <div class="condition-evidence">
                                        <p class="evidence-label">{{ getEvidenceText(condition.category) }}</p>
                                        <div class="evidence-bar">
                                            <div 
                                                class="evidence-fill" 
                                                :class="getEvidenceClass(condition.category)"
                                                :style="{ width: ((condition.probability || 0) * 100) + '%' }"
                                            ></div>
                                        </div>
                                    </div>

                                    <!-- Duration-related symptoms for this condition -->
                                    <div v-if="getConditionSymptoms(condition).length" class="condition-symptoms">
                                        <h5 class="symptoms-title">Related Symptoms with Duration</h5>
                                        <div class="symptoms-list">
                                            <div 
                                                v-for="(symptom, sIndex) in getConditionSymptoms(condition)" 
                                                :key="symptom.id || sIndex"
                                                class="symptom-item"
                                            >
                                                <span class="symptom-name">{{ symptom.name || symptom.common_name || 'Unknown symptom' }}</span>
                                                <span v-if="symptom.duration" class="symptom-duration" :class="getDurationSeverityClass(symptom.duration)">
                                                    {{ formatSymptomDuration(symptom.duration) }}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Less Likely Conditions -->
                            <div v-if="lessLikelyConditions.length" class="left-section-content__results--less-likely">
                                <accordian class="left-section-body__accordian">
                                    <template v-slot:head-content>
                                        <span>Show {{ lessLikelyConditions.length }} less likely conditions (lower probability)</span>
                                    </template>
                                    <template v-slot:body-content>
                                        <div class="less-likely-conditions">
                                            <div 
                                                v-for="(condition, index) in lessLikelyConditions" 
                                                :key="condition.id || index"
                                                class="less-likely-condition"
                                            >
                                                <div class="condition-info">
                                                    <div class="condition-left">
                                                        <span class="condition-name">{{ condition.common_name || condition.name || 'Unknown Condition' }}</span>
                                                        <span class="condition-description">Probability based on current symptoms</span>
                                                    </div>
                                                    <div class="condition-right">
                                                        <span class="condition-probability">{{ Math.round((condition.probability || 0) * 100) }}%</span>
                                                        <div class="probability-bar">
                                                            <div 
                                                                class="probability-fill" 
                                                                :style="{ width: ((condition.probability || 0) * 100) + '%' }"
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </accordian>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Enhanced Right Section -->
                <div class="content-right-section summary-section-mobile">
                    <h2 class="content-right-section__heading">Summary & Next Steps</h2>
                    <div class="content-right-section__body">
                        
                        <!-- Duration Analysis Summary -->
                        <div v-if="hasDurationData" class="duration-analysis">
                            <h3 class="analysis-title">Duration Analysis</h3>
                            <div class="duration-insights">
                                <div v-for="insight in durationInsights" :key="insight.type" class="insight-item">
                                    <div class="insight-icon" :class="insight.class">{{ insight.icon }}</div>
                                    <div class="insight-content">
                                        <h4 class="insight-title">{{ insight.title }}</h4>
                                        <p class="insight-description">{{ insight.description }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Recommendations -->
                        <div class="recommendations-section">
                            <h3 class="recommendations-title">Recommended Actions</h3>
                            <div class="recommendations-list">
                                <div v-for="recommendation in enhancedRecommendations" :key="recommendation.type" class="recommendation-item">
                                    <div class="recommendation-priority" :class="recommendation.priority">
                                        {{ recommendation.priority }}
                                    </div>
                                    <div class="recommendation-content">
                                        <h4 class="recommendation-title">{{ recommendation.title }}</h4>
                                        <p class="recommendation-description">{{ recommendation.description }}</p>
                                        
                                        <!-- Detailed action items -->
                                        <div v-if="recommendation.details" class="recommendation-details">
                                            <ul class="details-list">
                                                <li v-for="detail in recommendation.details" :key="detail" class="detail-item">
                                                    {{ detail }}
                                                </li>
                                            </ul>
                                        </div>
                                        
                                        <button 
                                            v-if="recommendation.action" 
                                            class="recommendation-button"
                                            @click="handleRecommendationAction(recommendation)"
                                        >
                                            {{ recommendation.actionText }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Questions & Answers Review -->
                        <div v-if="answeredQuestions.length" class="questions-review">
                            <h3 class="questions-title">Questions & Answers Review</h3>
                            <p class="questions-description">Review what you told us during the assessment</p>
                            <div class="questions-list">
                                <div v-for="qa in answeredQuestions" :key="qa.question" class="question-item">
                                    <div class="question-text">{{ qa.question }}</div>
                                    <div class="answer-text" :class="qa.answerClass">
                                        {{ qa.answer }}
                                        <span v-if="qa.duration" class="duration-tag">{{ qa.duration }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Assessment Quality Score -->
                        <div class="quality-score">
                            <h3 class="quality-title">Assessment Quality</h3>
                            <div class="quality-indicator">
                                <div class="quality-circle" :class="qualityScoreClass">
                                    <span class="quality-score-text">{{ qualityScore }}%</span>
                                </div>
                                <div class="quality-description">
                                    <p class="quality-text">{{ qualityDescription }}</p>
                                    <p class="quality-factors">
                                        Based on: symptom duration data, question completeness, and clinical evidence
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, inject, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import ButtonIcon from "@/components/buttons/button-icon";
import Accordian from "@/components/Lists/accordian";

const router = useRouter();
const { recommendation } = inject('$_RECOMMENDATION');

// State
const conditions = ref([]);
const evidence = ref([]);
const assessmentDuration = ref(0);
const consideredDiagnoses = ref(0);
const assessmentType = ref('comprehensive');
const hasDurationData = ref(false);
const triageLevel = ref('');

// Computed properties
const assessmentTypeTitle = computed(() => {
    return assessmentType.value === 'quick' ? 'Quick Assessment' : 'Comprehensive Assessment';
});

const moreLikelyConditions = computed(() => {
    // Show top conditions sorted by probability, regardless of category
    return conditions.value
        .filter(condition => condition.probability >= 0.1) // Show conditions with at least 10% probability
        .sort((a, b) => b.probability - a.probability) // Sort by probability descending
        .slice(0, 5); // Show top 5 most likely
});

const lessLikelyConditions = computed(() => {
    // Show remaining conditions with lower probability
    return conditions.value
        .filter(condition => condition.probability < 0.1 && condition.probability > 0.01)
        .sort((a, b) => b.probability - a.probability);
});

const symptomsWithDuration = computed(() => {
    return evidence.value.filter(item => item.duration).length;
});

const triageAlertClass = computed(() => {
    const classMap = {
        'emergency': 'alert-emergency',
        'urgent': 'alert-urgent',
        'semi_urgent': 'alert-semi-urgent'
    };
    return classMap[triageLevel.value] || '';
});

const triageIcon = computed(() => {
    const iconMap = {
        'emergency': '🚨',
        'urgent': '⚠️',
        'semi_urgent': '⏰'
    };
    return iconMap[triageLevel.value] || '';
});

const triageTitle = computed(() => {
    const titleMap = {
        'emergency': 'Emergency Care Needed',
        'urgent': 'Urgent Medical Attention',
        'semi_urgent': 'Medical Consultation Recommended'
    };
    return titleMap[triageLevel.value] || '';
});

const triageDescription = computed(() => {
    const descMap = {
        'emergency': 'Seek immediate emergency medical care or call emergency services.',
        'urgent': 'Contact a healthcare provider within 24 hours or visit urgent care.',
        'semi_urgent': 'Schedule a medical appointment within the next few days.'
    };
    return descMap[triageLevel.value] || '';
});

const durationInsights = computed(() => {
    const insights = [];
    
    console.log('Duration insights - evidence:', evidence.value);
    console.log('Duration insights - symptomsWithDuration:', symptomsWithDuration.value);
    
    if (symptomsWithDuration.value > 0) {
        // Enhanced duration categorization
        const durationCategories = {
            acute: evidence.value.filter(item => 
                ['hours', 'days_1_3'].includes(item.duration) && item.choice_id === 'present'
            ),
            recent: evidence.value.filter(item => 
                ['days_4_7', 'weeks_1_2'].includes(item.duration) && item.choice_id === 'present'
            ),
            ongoing: evidence.value.filter(item => 
                ['weeks_2_4'].includes(item.duration) && item.choice_id === 'present'
            ),
            chronic: evidence.value.filter(item => 
                ['months'].includes(item.duration) && item.choice_id === 'present'
            )
        };
        
        console.log('Duration categories:', durationCategories);
        
        // Add insights based on duration patterns
        if (durationCategories.chronic.length > 0) {
            insights.push({
                type: 'chronic',
                icon: '📅',
                title: 'Long-term Symptoms',
                description: `${durationCategories.chronic.length} symptom(s) present for over a month. These may indicate a chronic condition requiring medical evaluation.`,
                class: 'insight-chronic',
                symptoms: durationCategories.chronic.map(s => s.name || s.common_name).join(', ')
            });
        }
        
        if (durationCategories.ongoing.length > 0) {
            insights.push({
                type: 'ongoing',
                icon: '⏱️',
                title: 'Persistent Symptoms',
                description: `${durationCategories.ongoing.length} symptom(s) lasting 2-4 weeks. Monitor closely for changes.`,
                class: 'insight-ongoing',
                symptoms: durationCategories.ongoing.map(s => s.name || s.common_name).join(', ')
            });
        }
        
        if (durationCategories.recent.length > 0) {
            insights.push({
                type: 'recent',
                icon: '📈',
                title: 'Recent Symptoms',
                description: `${durationCategories.recent.length} symptom(s) developed in the past 1-2 weeks.`,
                class: 'insight-recent',
                symptoms: durationCategories.recent.map(s => s.name || s.common_name).join(', ')
            });
        }
        
        if (durationCategories.acute.length > 0) {
            insights.push({
                type: 'acute',
                icon: '⚡',
                title: 'New Onset Symptoms',
                description: `${durationCategories.acute.length} symptom(s) with very recent onset (hours to 3 days). Require immediate attention if severe.`,
                class: 'insight-acute',
                symptoms: durationCategories.acute.map(s => s.name || s.common_name).join(', ')
            });
        }
    } else {
        // Show message when no duration data is available
        insights.push({
            type: 'no_duration',
            icon: '📋',
            title: 'No Duration Data',
            description: 'Duration information was not collected for symptoms. Consider providing symptom duration for more accurate analysis.',
            class: 'insight-neutral'
        });
    }
    
    console.log('Generated duration insights:', insights);
    return insights;
});

const enhancedRecommendations = computed(() => {
    const recommendations = [];
    
    // Emergency recommendations
    if (triageLevel.value === 'emergency') {
        recommendations.push({
            type: 'emergency',
            priority: 'urgent',
            title: 'Seek Immediate Emergency Care',
            description: 'Your symptoms suggest a potentially serious condition requiring immediate medical attention. Do not delay - visit the nearest emergency room or call emergency services.',
            details: [
                'Call emergency services (911) if symptoms are severe',
                'Have someone drive you to the emergency room',
                'Bring a list of current medications',
                'Inform medical staff about symptom duration and severity'
            ],
            action: 'emergency',
            actionText: 'Find Emergency Room'
        });
    } else if (triageLevel.value === 'urgent') {
        recommendations.push({
            type: 'urgent_care',
            priority: 'high',
            title: 'Urgent Medical Consultation Required',
            description: 'Your symptoms require prompt medical evaluation within 24 hours. Contact your healthcare provider or visit urgent care.',
            details: [
                'Schedule appointment with your primary care physician today',
                'If unavailable, visit urgent care center',
                'Monitor symptoms for any worsening',
                'Prepare a detailed symptom timeline for your visit'
            ],
            action: 'book_urgent',
            actionText: 'Book Urgent Appointment'
        });
    } 
    
    // Condition-specific recommendations
    if (conditions.value.length > 0) {
        const highProbConditions = conditions.value.filter(c => c.probability > 0.7);
        const topCondition = conditions.value[0];
        
        if (highProbConditions.length > 0) {
            recommendations.push({
                type: 'specialist_consultation',
                priority: 'high',
                title: `Consult Specialist for ${topCondition.common_name}`,
                description: `Based on your symptoms and their duration, ${topCondition.common_name} has a ${Math.round(topCondition.probability * 100)}% probability. Specialist consultation is recommended.`,
                details: [
                    `Discuss the possibility of ${topCondition.common_name} with a specialist`,
                    'Request appropriate diagnostic tests or imaging',
                    'Bring your symptom duration timeline',
                    'Ask about treatment options and prognosis'
                ],
                action: 'book_specialist',
                actionText: 'Find Specialist'
            });
        } else {
            recommendations.push({
                type: 'general_consultation',
                priority: 'medium',
                title: 'Medical Consultation Recommended',
                description: 'Multiple conditions are being considered. A healthcare professional can help determine the most likely diagnosis.',
                details: [
                    'Schedule appointment with your primary care physician',
                    'Discuss all symptoms and their duration patterns',
                    'Request appropriate examinations or tests',
                    'Consider keeping a symptom diary until your visit'
                ],
                action: 'book_appointment',
                actionText: 'Book Appointment'
            });
        }
    }
    
    // Duration-specific recommendations
    const chronicSymptoms = evidence.value.filter(item => 
        item.duration === 'months' && item.choice_id === 'present'
    );
    
    if (chronicSymptoms.length > 0) {
        recommendations.push({
            type: 'chronic_management',
            priority: 'medium',
            title: 'Chronic Symptom Management',
            description: `You have ${chronicSymptoms.length} symptom(s) lasting over a month. Consider comprehensive evaluation for chronic condition management.`,
            details: [
                'Discuss long-term symptom patterns with your doctor',
                'Consider referral to appropriate specialist',
                'Explore lifestyle modifications that may help',
                'Ask about chronic disease management programs'
            ],
            action: null,
            actionText: null
        });
    }
    
    // General monitoring recommendations
    recommendations.push({
        type: 'monitoring',
        priority: 'low',
        title: 'Continue Symptom Monitoring',
        description: 'Keep detailed records of your symptoms, their severity, and any triggers or patterns you notice.',
        details: [
            'Maintain a daily symptom diary with severity ratings (1-10)',
            'Note any triggers, activities, or foods that worsen symptoms',
            'Track sleep patterns, stress levels, and physical activity',
            'Set up follow-up reminders to reassess in 1-2 weeks',
            'Seek immediate care if symptoms suddenly worsen'
        ],
            action: null,
            actionText: null
        });
    
    // Lifestyle recommendations
    if (symptomsWithDuration.value > 0) {
        recommendations.push({
            type: 'lifestyle',
            priority: 'low',
            title: 'Supportive Care & Lifestyle',
            description: 'General wellness measures that may help manage your symptoms while awaiting medical evaluation.',
            details: [
                'Ensure adequate rest and sleep (7-9 hours nightly)',
                'Stay hydrated and maintain balanced nutrition',
                'Avoid alcohol, smoking, and excessive caffeine',
                'Practice stress management techniques',
                'Light exercise if tolerated (consult doctor first)'
            ],
            action: null,
            actionText: null
        });
    }
    
    return recommendations;
});

const qualityScore = computed(() => {
    let score = 60; // Base score
    
    // Add points for duration data
    if (hasDurationData.value) score += 20;
    
    // Add points for number of questions answered
    if (consideredDiagnoses.value > 10) score += 15;
    else if (consideredDiagnoses.value > 5) score += 10;
    
    // Add points for assessment type
    if (assessmentType.value === 'comprehensive') score += 5;
    
    return Math.min(score, 100);
});

const qualityScoreClass = computed(() => {
    if (qualityScore.value >= 90) return 'quality-excellent';
    if (qualityScore.value >= 75) return 'quality-good';
    if (qualityScore.value >= 60) return 'quality-fair';
    return 'quality-poor';
});

const qualityDescription = computed(() => {
    if (qualityScore.value >= 90) return 'Excellent assessment with comprehensive data';
    if (qualityScore.value >= 75) return 'Good assessment with sufficient detail';
    if (qualityScore.value >= 60) return 'Fair assessment with basic information';
    return 'Limited assessment - consider more detailed evaluation';
});

const answeredQuestions = computed(() => {
    const questions = [];
    
    // Use the actual questions tracked during the assessment
    const trackedQuestions = recommendation.value?.answered_questions || [];
    
    console.log('=== Q&A SECTION DEBUG ===');
    console.log('Full recommendation value:', recommendation.value);
    console.log('Tracked questions from recommendation:', trackedQuestions);
    console.log('Number of tracked questions:', trackedQuestions.length);
    
    if (trackedQuestions.length === 0) {
        console.log('No tracked questions found, will use fallback');
        console.log('Evidence array length:', evidence.value.length);
    }
    
    // If we have tracked questions, use them
    if (trackedQuestions.length > 0) {
        trackedQuestions.forEach(q => {
            // Format each question and its answers
            if (q.type === 'group_multiple' || q.type === 'group_single') {
                // For group questions, show the main question and each answer
                q.answers.forEach(answer => {
                    questions.push({
                        question: answer.name || q.question,
                        answer: answer.choice === 'present' ? 'Yes' : 'No',
                        answerClass: answer.choice === 'present' ? 'answer-yes' : 'answer-no',
                        duration: answer.duration ? formatSymptomDuration(answer.duration) : null,
                        type: 'user-answered'
                    });
                });
            } else if (q.type === 'single') {
                // For single questions
                q.answers.forEach(answer => {
                    questions.push({
                        question: q.question,
                        answer: answer.choice === 'present' ? 'Yes' : 
                               answer.choice === 'absent' ? 'No' : 
                               answer.isDuration ? formatSymptomDuration(answer.choice) : 'Not sure',
                        answerClass: answer.choice === 'present' ? 'answer-yes' : 
                                    answer.choice === 'absent' ? 'answer-no' : 
                                    'answer-neutral',
                        duration: answer.duration ? formatSymptomDuration(answer.duration) : null,
                        type: 'user-answered'
                    });
                });
            }
        });
    } else {
        // Fallback: Use evidence with source fields to show only user-answered questions
        console.log('No tracked questions, using evidence with source fields');
        console.log('Total evidence items:', evidence.value.length);
        
        // Filter evidence to only include user responses (initial symptoms + interview answers)
        const userAnsweredEvidence = evidence.value.filter(item => 
            item.source === 'initial' || item.source === 'interview'
        );
        
        console.log('User-answered evidence items:', userAnsweredEvidence.length);
        console.log('User evidence:', userAnsweredEvidence);
        
        userAnsweredEvidence.forEach(item => {
            if (item.common_name || item.label || item.name) {
                const questionText = item.common_name || item.label || item.name;
                
                questions.push({
                    question: `Do you experience ${questionText.toLowerCase()}?`,
                    answer: item.choice_id === 'present' ? 'Yes' : 
                           item.choice_id === 'absent' ? 'No' : 'Not sure',
                    answerClass: item.choice_id === 'present' ? 'answer-yes' : 
                                item.choice_id === 'absent' ? 'answer-no' : 'answer-neutral',
                    duration: item.duration ? formatSymptomDuration(item.duration) : null,
                    type: item.source === 'initial' ? 'initial-symptom' : 'interview-answer'
                });
            }
        });
        
        if (userAnsweredEvidence.length === 0) {
            console.log('No user-answered evidence found, falling back to initial symptoms from patient info');
            // Final fallback: Use initial symptoms from patient info
            const patientInfo = inject('$_PATIENT_INFO')?.patientInfo?.value || {};
            const symptoms = patientInfo.symptoms || [];
            
            symptoms.forEach(symptom => {
                if (symptom.name) {
                    questions.push({
                        question: `Do you have ${symptom.name}?`,
                        answer: 'Yes',
                        answerClass: 'answer-yes',
                        duration: symptom.duration ? formatSymptomDuration(symptom.duration) : null,
                        type: 'initial-symptom'
                    });
                }
            });
        }
    }
    
    console.log('Final questions for display:', questions.length, 'questions');
    return questions;
});

// Methods
const formatDuration = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
};

const formatSymptomDuration = (duration) => {
    const durationMap = {
        'hours': 'Less than 1 day',
        'days_1_3': '1-3 days',
        'days_4_7': '4-7 days',
        'weeks_1_2': '1-2 weeks',
        'weeks_2_4': '2-4 weeks',
        'months': 'More than 1 month'
    };
    return durationMap[duration] || 'Duration not specified';
};

const getDurationSeverityClass = (duration) => {
    const classMap = {
        'hours': 'duration-acute',
        'days_1_3': 'duration-recent',
        'days_4_7': 'duration-recent',
        'weeks_1_2': 'duration-ongoing',
        'weeks_2_4': 'duration-ongoing',
        'months': 'duration-chronic'
    };
    return classMap[duration] || '';
};

const getEvidenceText = (category) => {
    const textMap = {
        0: 'Strong evidence',
        1: 'Moderate evidence',
        2: 'Weak evidence'
    };
    return textMap[category] || 'Limited evidence';
};

const getEvidenceClass = (category) => {
    const classMap = {
        0: 'evidence-strong',
        1: 'evidence-moderate',
        2: 'evidence-weak'
    };
    return classMap[category] || 'evidence-weak';
};

const getConditionSymptoms = (condition) => {
    // Get symptoms related to this condition that have duration data
    return evidence.value.filter(item => 
        item.choice_id === 'present' && item.duration
    ).slice(0, 3); // Show max 3 symptoms per condition
};

const handleRecommendationAction = (recommendation) => {
    switch (recommendation.action) {
        case 'emergency':
            // Navigate to emergency services info
            window.open('tel:911', '_self');
            break;
        case 'book_urgent':
        case 'book_appointment':
            // Navigate to appointment booking
            router.push('/appointments/book');
            break;
    }
};

const downloadPDF = () => {
    try {
        // Generate comprehensive PDF report
        const reportData = generateReportData();
        
        // Create a simplified HTML version for PDF generation
        const htmlContent = generateReportHTML(reportData);
        
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Enhanced Health Assessment Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px; }
                    .section { margin-bottom: 25px; }
                    .section h2 { color: #007bff; border-bottom: 1px solid #e1e5e9; padding-bottom: 10px; }
                    .condition-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007bff; }
                    .probability { font-weight: bold; color: #007bff; }
                    .recommendation { background: #fff3cd; padding: 12px; margin: 8px 0; border-radius: 5px; border-left: 4px solid #ffc107; }
                    .question-item { background: #e9ecef; padding: 10px; margin: 5px 0; border-radius: 3px; }
                    .answer-yes { color: #28a745; font-weight: bold; }
                    .answer-no { color: #dc3545; font-weight: bold; }
                    .duration-tag { background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 10px; font-size: 11px; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>${htmlContent}</body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Wait for content to load, then print
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 500);
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Unable to generate PDF report. Please try again.');
    }
};

const shareReport = () => {
    try {
        const reportData = generateReportData();
        const shareText = generateShareText(reportData);
        
        // Check if Web Share API is available (mobile devices)
        if (navigator.share) {
            navigator.share({
                title: 'Enhanced Health Assessment Report',
                text: shareText,
                url: window.location.href
            }).catch(error => {
                console.log('Error sharing:', error);
                fallbackShare(shareText);
            });
        } else {
            // Fallback for desktop browsers
            fallbackShare(shareText);
        }
    } catch (error) {
        console.error('Error sharing report:', error);
        alert('Unable to share report. Please try again.');
    }
};

const generateReportData = () => {
    const currentDate = new Date().toLocaleDateString();
    const patientInfo = inject('$_PATIENT_INFO')?.patientInfo?.value || {};
    
    return {
        date: currentDate,
        patientInfo,
        conditions: conditions.value,
        moreLikelyConditions: moreLikelyConditions.value,
        lessLikelyConditions: lessLikelyConditions.value,
        evidence: evidence.value,
        triageLevel: triageLevel.value,
        assessmentDuration: assessmentDuration.value,
        consideredDiagnoses: consideredDiagnoses.value,
        assessmentType: assessmentType.value,
        hasDurationData: hasDurationData.value,
        symptomsWithDuration: symptomsWithDuration.value,
        recommendations: enhancedRecommendations.value,
        qualityScore: qualityScore.value,
        answeredQuestions: answeredQuestions.value.slice(0, 10) // Limit for readability
    };
};

const generateReportHTML = (data) => {
    return `
        <div class="header">
            <h1>Enhanced Health Assessment Report</h1>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Assessment Type:</strong> ${data.assessmentType} Assessment</p>
            <p><strong>Duration:</strong> ${formatDuration(data.assessmentDuration)}</p>
            <p><strong>Quality Score:</strong> ${data.qualityScore}%</p>
        </div>
        
        ${data.triageLevel && data.triageLevel !== 'non_urgent' ? `
            <div class="section">
                <h2>⚠️ Urgent Notice</h2>
                <div class="recommendation" style="background: #f8d7da; border-left-color: #dc3545;">
                    <strong>${triageTitle.value}</strong><br>
                    ${triageDescription.value}
                </div>
            </div>
        ` : ''}
        
        <div class="section">
            <h2>Possible Conditions (${data.moreLikelyConditions.length})</h2>
            ${data.moreLikelyConditions.map(condition => `
                <div class="condition-item">
                    <strong>${condition.common_name || condition.name}</strong>
                    <span class="probability">${Math.round(condition.probability * 100)}%</span>
                    <p>Based on your symptoms and their duration patterns.</p>
                </div>
            `).join('')}
            
            ${data.lessLikelyConditions.length > 0 ? `
                <h3>Additional Considerations (${data.lessLikelyConditions.length})</h3>
                ${data.lessLikelyConditions.map(condition => `
                    <div class="condition-item">
                        <strong>${condition.common_name || condition.name}</strong>
                        <span class="probability">${Math.round(condition.probability * 100)}%</span>
                    </div>
                `).join('')}
            ` : ''}
        </div>
        
        <div class="section">
            <h2>Recommended Actions</h2>
            ${data.recommendations.map(rec => `
                <div class="recommendation">
                    <strong>${rec.title}</strong><br>
                    ${rec.description}
                    ${rec.details ? `<ul>${rec.details.map(detail => `<li>${detail}</li>`).join('')}</ul>` : ''}
                </div>
            `).join('')}
        </div>
        
        ${data.answeredQuestions.length > 0 ? `
            <div class="section">
                <h2>Questions & Answers Summary</h2>
                ${data.answeredQuestions.map(qa => `
                    <div class="question-item">
                        <strong>Q:</strong> ${qa.question}<br>
                        <strong>A:</strong> <span class="${qa.answerClass}">${qa.answer}</span>
                        ${qa.duration ? `<span class="duration-tag">${qa.duration}</span>` : ''}
                    </div>
                `).join('')}
            </div>
        ` : ''}
        
        <div class="section">
            <h2>Assessment Statistics</h2>
            <ul>
                <li><strong>Questions Answered:</strong> ${data.consideredDiagnoses}</li>
                <li><strong>Symptoms with Duration:</strong> ${data.symptomsWithDuration}</li>
                <li><strong>Assessment Quality:</strong> ${data.qualityScore}% - ${qualityDescription.value}</li>
                <li><strong>Total Conditions Evaluated:</strong> ${data.conditions.length}</li>
            </ul>
        </div>
        
        <div class="section" style="margin-top: 40px; border-top: 1px solid #e1e5e9; padding-top: 20px; font-size: 12px; color: #666;">
            <p><strong>Disclaimer:</strong> This assessment is for informational purposes only and should not replace professional medical advice. Please consult with a healthcare provider for proper diagnosis and treatment.</p>
            <p><strong>Generated by:</strong> Rapid Capsule Enhanced Health Assessment</p>
        </div>
    `;
};

const generateShareText = (data) => {
    return `📋 Enhanced Health Assessment Report
📅 Date: ${data.date}
⏱️ Duration: ${formatDuration(data.assessmentDuration)}
📊 Quality Score: ${data.qualityScore}%

🔍 Top Conditions Identified:
${data.moreLikelyConditions.slice(0, 3).map(condition => 
    `• ${condition.common_name} (${Math.round(condition.probability * 100)}%)`
).join('\n')}

📝 Key Statistics:
• Questions Answered: ${data.consideredDiagnoses}
• Symptoms with Duration: ${data.symptomsWithDuration}
• Total Conditions Evaluated: ${data.conditions.length}

⚠️ This assessment is for informational purposes only. Please consult with a healthcare provider for proper diagnosis and treatment.

Generated by Rapid Capsule Enhanced Health Assessment`;
};

const fallbackShare = (shareText) => {
    // Try to copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            alert('Report summary copied to clipboard! You can now paste it anywhere to share.');
        }).catch(() => {
            showShareModal(shareText);
        });
    } else {
        showShareModal(shareText);
    }
};

const showShareModal = (shareText) => {
    // Create a simple modal for sharing
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); z-index: 10000; display: flex; 
        align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
            <h3>Share Your Health Report</h3>
            <textarea readonly style="width: 100%; height: 200px; margin: 15px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace; font-size: 12px;">${shareText}</textarea>
            <div style="text-align: right;">
                <button onclick="navigator.clipboard?.writeText('${shareText.replace(/'/g, "\\'")}').then(() => alert('Copied to clipboard!')); this.parentElement.parentElement.parentElement.remove();" 
                        style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-right: 10px; cursor: pointer;">
                    Copy to Clipboard
                </button>
                <button onclick="this.parentElement.parentElement.parentElement.remove();" 
                        style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
};

// Initialize
onMounted(() => {
    console.log('Enhanced report received recommendation data:', recommendation.value);
    
    if (recommendation.value?.diagnosis) {
        conditions.value = recommendation.value.diagnosis.conditions || [];
        evidence.value = recommendation.value.diagnosis.evidence || [];
        triageLevel.value = recommendation.value.diagnosis.triage_level || '';
        assessmentDuration.value = recommendation.value.duration || 0;
        consideredDiagnoses.value = recommendation.value.considered_diagnoses_count || 0;
        assessmentType.value = recommendation.value.assessment_type || 'comprehensive';
        hasDurationData.value = recommendation.value.has_duration_data || false;
        
        // Enhanced debugging to see exact condition structure
        console.log('=== ENHANCED REPORT DEBUG ===');
        console.log('Full recommendation object:', recommendation.value);
        console.log('Diagnosis object:', recommendation.value?.diagnosis);
        console.log('Raw conditions array:', conditions.value);
        console.log('Conditions length:', conditions.value.length);
        console.log('Conditions type:', typeof conditions.value);
        console.log('Is conditions array?', Array.isArray(conditions.value));
        
        // Debug all conditions if more than one
        if (conditions.value.length > 0) {
            console.log(`=== ALL ${conditions.value.length} CONDITIONS ===`);
            conditions.value.forEach((condition, index) => {
                console.log(`Condition ${index}:`, {
                    id: condition.id,
                    common_name: condition.common_name,
                    name: condition.name,
                    probability: condition.probability,
                    category: condition.category,
                    keys: Object.keys(condition),
                    full_object: condition
                });
            });
            console.log('=== END CONDITIONS ===');
        }
        
        console.log('More likely conditions computed:', moreLikelyConditions.value);
        console.log('Less likely conditions computed:', lessLikelyConditions.value);
        
        // Debug evidence for questions/answers
        console.log('Evidence array:', evidence.value);
        console.log('Evidence length:', evidence.value.length);
        
        console.log('=== END DEBUG ===');
        
        console.log('Parsed enhanced report data:', {
            conditions: conditions.value,
            evidence: evidence.value,
            triageLevel: triageLevel.value,
            assessmentDuration: assessmentDuration.value,
            consideredDiagnoses: consideredDiagnoses.value
        });
    } else {
        console.warn('No diagnosis data found in recommendation:', recommendation.value);
    }
});
</script>

<style scoped lang="scss">
.page-content {
    padding: 20px;
    background: #fafafa;
    min-height: 100vh;
}

.diagnosis-container {
    max-width: 1200px;
    margin: 0 auto;
}

.diagnosis-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.assessment-info {
    flex: 1;
}

.assessment-title {
    font-size: 28px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
}

.enhancement-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.badge {
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
    
    &.badge-enhanced {
        background: #e3f2fd;
        color: #1976d2;
    }
    
    &.badge-premium {
        background: #f3e5f5;
        color: #7b1fa2;
    }
    
    &.badge-assessment {
        background: #e8f5e8;
        color: #2e7d32;
    }
}

.assessment-summary {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 24px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.stat-item {
    text-align: center;
    
    .stat-label {
        display: block;
        font-size: 14px;
        color: #666;
        margin-bottom: 4px;
    }
    
    .stat-value {
        display: block;
        font-size: 24px;
        font-weight: 600;
        color: #333;
    }
}

.triage-alert {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    
    &.alert-emergency {
        background: #ffebee;
        border: 1px solid #f44336;
    }
    
    &.alert-urgent {
        background: #fff3e0;
        border: 1px solid #ff9800;
    }
    
    &.alert-semi-urgent {
        background: #e8f5e8;
        border: 1px solid #4caf50;
    }
}

.alert-icon {
    font-size: 24px;
}

.alert-content {
    flex: 1;
    
    .alert-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
    }
    
    .alert-description {
        font-size: 14px;
        line-height: 1.4;
    }
}

.enhanced-condition-card {
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.condition-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.condition-name {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
}

.condition-confidence {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .confidence-label {
        font-size: 14px;
        color: #666;
    }
    
    .confidence-value {
        font-size: 16px;
        font-weight: 600;
        color: #007bff;
    }
}

.condition-evidence {
    margin-bottom: 16px;
    
    .evidence-label {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
    }
}

.evidence-bar {
    width: 100%;
    height: 8px;
    background: #f0f0f0;
    border-radius: 4px;
    overflow: hidden;
}

.evidence-fill {
    height: 100%;
    transition: width 0.3s ease;
    
    &.evidence-strong {
        background: #28a745;
    }
    
    &.evidence-moderate {
        background: #ffc107;
    }
    
    &.evidence-weak {
        background: #dc3545;
    }
}

.condition-symptoms {
    .symptoms-title {
        font-size: 14px;
        font-weight: 600;
        color: #666;
        margin-bottom: 8px;
    }
}

.symptoms-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.symptom-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 12px;
    background: #f8f9fa;
    border-radius: 6px;
    
    .symptom-name {
        font-size: 13px;
        color: #333;
    }
    
    .symptom-duration {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 10px;
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
    }
}

.duration-analysis {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #e1e5e9;
}

.analysis-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
}

.duration-insights {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.insight-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
}

.insight-icon {
    font-size: 20px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    
    &.insight-chronic {
        background: #e8f5e8;
    }
    
    &.insight-acute {
        background: #ffebee;
    }
}

.insight-content {
    flex: 1;
    
    .insight-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
    }
    
    .insight-description {
        font-size: 13px;
        color: #666;
        line-height: 1.3;
    }
}

.recommendations-section {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #e1e5e9;
}

.recommendations-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
}

.recommendations-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.recommendation-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
}

.recommendation-priority {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    align-self: flex-start;
    
    &.urgent {
        background: #ffebee;
        color: #c62828;
    }
    
    &.high {
        background: #fff3e0;
        color: #ef6c00;
    }
    
    &.medium {
        background: #e3f2fd;
        color: #1976d2;
    }
    
    &.low {
        background: #f5f5f5;
        color: #616161;
    }
}

.recommendation-content {
    flex: 1;
    
    .recommendation-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        margin-bottom: 4px;
    }
    
    .recommendation-description {
        font-size: 13px;
        color: #666;
        margin-bottom: 8px;
        line-height: 1.3;
    }
}

.recommendation-button {
    padding: 6px 12px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.3s ease;
    
    &:hover {
        background: #0056b3;
    }
}

.quality-score {
    background: white;
    border-radius: 12px;
    padding: 20px;
    border: 1px solid #e1e5e9;
}

.quality-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
}

.quality-indicator {
    display: flex;
    align-items: center;
    gap: 16px;
}

.quality-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.quality-excellent {
        background: #e8f5e8;
        border: 3px solid #28a745;
    }
    
    &.quality-good {
        background: #e3f2fd;
        border: 3px solid #007bff;
    }
    
    &.quality-fair {
        background: #fff3e0;
        border: 3px solid #ff9800;
    }
    
    &.quality-poor {
        background: #ffebee;
        border: 3px solid #f44336;
    }
}

.quality-score-text {
    font-size: 16px;
    font-weight: 600;
    color: #333;
}

.quality-description {
    flex: 1;
    
    .quality-text {
        font-size: 14px;
        font-weight: 500;
        color: #333;
        margin-bottom: 4px;
    }
    
    .quality-factors {
        font-size: 12px;
        color: #666;
        line-height: 1.3;
    }
}

.questions-review {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid #e1e5e9;
}

.questions-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
}

.questions-description {
    font-size: 14px;
    color: #666;
    margin-bottom: 16px;
}

.questions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.question-item {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #e1e5e9;
}

.question-text {
    font-size: 14px;
    color: #333;
    margin-bottom: 6px;
    font-weight: 500;
}

.answer-text {
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &.answer-yes {
        color: #28a745;
    }
    
    &.answer-no {
        color: #dc3545;
    }
}

.duration-tag {
    background: #e3f2fd;
    color: #1976d2;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
}

.recommendation-details {
    margin: 12px 0;
}

.details-list {
    margin: 0;
    padding-left: 16px;
    
    .detail-item {
        font-size: 13px;
        color: #666;
        line-height: 1.4;
        margin-bottom: 4px;
        
        &:last-child {
            margin-bottom: 0;
        }
    }
}

.insight-ongoing {
    background: #f3e5f5;
}

.insight-recent {
    background: #fff3e0;
}

.insight-neutral {
    background: #f5f5f5;
}

.less-likely-conditions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 8px;
}

.less-likely-condition {
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s ease;
    
    &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-color: #007bff;
    }
}

.condition-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

.condition-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.condition-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    min-width: 80px;
}

.condition-name {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    line-height: 1.3;
}

.condition-description {
    font-size: 13px;
    color: #666;
    line-height: 1.2;
}

.condition-probability {
    font-size: 18px;
    font-weight: 600;
    color: #007bff;
}

.probability-bar {
    width: 60px;
    height: 4px;
    background: #e1e5e9;
    border-radius: 2px;
    overflow: hidden;
}

.probability-fill {
    height: 100%;
    background: #007bff;
    transition: width 0.3s ease;
}

// Responsive Design
@media (max-width: 768px) {
    .diagnosis-header {
        flex-direction: column;
        gap: 16px;
    }
    
    .summary-stats {
        grid-template-columns: 1fr;
    }
    
    .condition-header {
        flex-direction: column;
        gap: 8px;
    }
    
    .quality-indicator {
        flex-direction: column;
        text-align: center;
    }
}
</style>