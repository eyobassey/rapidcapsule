<template>
    <div class="report-page">
        <!-- Hero Section -->
        <section class="hero">
            <div class="hero__content">
                <button class="hero__back" @click="onTakeDiosisAgain">
                    <v-icon name="hi-arrow-left" scale="1" />
                    <span>New Assessment</span>
                </button>

                <div class="hero__badge">
                    <span class="badge-ai">
                        <v-icon name="hi-sparkles" scale="0.9" />
                        AI Assessment Complete
                    </span>
                </div>

                <h1 class="hero__title">
                    Your Health<br/>
                    <span class="hero__title-accent">Report</span>
                </h1>

                <p class="hero__subtitle">
                    Based on your symptoms and responses, here are the AI-powered insights and recommendations
                </p>

                <div class="hero__actions">
                    <button class="hero__action-btn" @click="downloadPDF">
                        <v-icon name="hi-download" scale="1" />
                        <span>Download PDF</span>
                    </button>
                    <button class="hero__action-btn" @click="shareReport">
                        <v-icon name="hi-share" scale="1" />
                        <span>Share</span>
                    </button>
                </div>
            </div>

            <div class="hero__visual">
                <div class="report-orb">
                    <div class="report-orb__inner">
                        <v-icon name="hi-document-report" scale="3" />
                    </div>
                    <div class="report-orb__ring"></div>
                    <div class="report-orb__ring report-orb__ring--delayed"></div>
                </div>
                <div class="floating-icons">
                    <div class="floating-icon floating-icon--1">
                        <v-icon name="hi-heart" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--2">
                        <v-icon name="hi-clipboard-check" scale="1.2" />
                    </div>
                    <div class="floating-icon floating-icon--3">
                        <v-icon name="hi-light-bulb" scale="1.2" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
            <!-- Triage Card - Full Width -->
            <div v-if="triageConfig" class="bento-card bento-card--triage" :class="`triage-${triageLevel}`">
                <div class="triage-content">
                    <div class="triage-icon" :style="{ backgroundColor: triageConfig.bgColor }">
                        <v-icon :name="triageConfig.icon" scale="1.5" :style="{ color: triageConfig.color }" />
                    </div>
                    <div class="triage-info">
                        <h3 class="triage-title" :style="{ color: triageConfig.color }">{{ triageConfig.title }}</h3>
                        <p class="triage-desc">{{ triageConfig.description }}</p>
                    </div>
                    <button
                        class="triage-action"
                        :style="{ backgroundColor: triageConfig.color, color: 'white' }"
                        @click="goToBookAppointment"
                    >
                        <span>Book Consultation</span>
                        <v-icon name="hi-arrow-right" scale="1" />
                    </button>
                </div>
            </div>

            <!-- Conditions Card -->
            <div class="bento-card bento-card--conditions">
                <div class="bento-card__header">
                    <v-icon name="hi-clipboard-list" scale="1.1" />
                    <span>Possible Conditions</span>
                    <span class="condition-count">{{ conditions.length }}</span>
                </div>

                <div v-if="conditions.length" class="conditions-list">
                    <div
                        v-for="(condition, index) in moreLikelyConditions"
                        :key="condition.id || index"
                        class="condition-item"
                    >
                        <div class="condition-info">
                            <h4 class="condition-name">{{ condition.common_name }}</h4>
                            <span class="condition-evidence" :class="getEvidenceClass(condition.category)">
                                {{ getEvidenceLabel(condition.category) }}
                            </span>
                        </div>
                        <div class="condition-indicator" :class="getIndicatorClass(condition.category)"></div>
                    </div>

                    <div v-if="lessLikelyConditions.length" class="less-likely-section">
                        <button class="show-less-likely" @click="showLessLikely = !showLessLikely">
                            <span>{{ showLessLikely ? 'Hide' : 'Show' }} less likely conditions</span>
                            <v-icon :name="showLessLikely ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
                        </button>

                        <div v-if="showLessLikely" class="less-likely-list">
                            <div
                                v-for="(condition, index) in lessLikelyConditions"
                                :key="condition.id || index"
                                class="condition-item condition-item--muted"
                            >
                                <div class="condition-info">
                                    <h4 class="condition-name">{{ condition.common_name }}</h4>
                                    <span class="condition-evidence evidence-weak">Weak evidence</span>
                                </div>
                                <div class="condition-indicator indicator-weak"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="no-conditions">
                    <div class="no-conditions-icon">
                        <v-icon name="hi-check-circle" scale="2" />
                    </div>
                    <h4>No Conditions Found</h4>
                    <p>Based on your symptoms, no concerning conditions were identified. Keep monitoring your health and schedule regular check-ups.</p>
                </div>
            </div>

            <!-- Summary Stats Card -->
            <div class="bento-card bento-card--stats">
                <div class="bento-card__header">
                    <v-icon name="hi-chart-pie" scale="1.1" />
                    <span>Assessment Summary</span>
                </div>

                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">{{ consideredDiagnosesCount }}</span>
                        <span class="stat-label">Conditions Analyzed</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{{ duration }}</span>
                        <span class="stat-label">Interview Duration</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{{ answeredQuestions.length }}</span>
                        <span class="stat-label">Questions Answered</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value clickable" @click="handleDiagnosisClick">
                            {{ allConditions.length }}+
                        </span>
                        <span class="stat-label">View All Diagnoses</span>
                    </div>
                </div>

                <!-- Expanded Diagnoses List -->
                <div v-if="showDiagnosesList && allConditions.length" class="diagnoses-expanded">
                    <div class="diagnoses-header">
                        <h4>{{ conditionsDisplayLabel }}</h4>
                        <button class="collapse-btn" @click="handleDiagnosisClick">Collapse</button>
                    </div>
                    <div class="diagnoses-list">
                        <div
                            v-for="(condition, index) in paginatedConditions"
                            :key="index"
                            class="diagnosis-item"
                        >
                            <span class="diagnosis-name">{{ condition.common_name }}</span>
                            <span class="diagnosis-prob">{{ Math.round(condition.probability * 100) }}%</span>
                        </div>
                    </div>
                    <div v-if="showPagination" class="pagination">
                        <button @click="goToPrevPage" :disabled="currentPage === 1">←</button>
                        <span>{{ currentPage }} of {{ totalPages }}</span>
                        <button @click="goToNextPage" :disabled="currentPage === totalPages">→</button>
                    </div>
                </div>
            </div>

            <!-- AI Health Summary Card (Premium) -->
            <div v-if="claudeSummaryEnabled" class="bento-card bento-card--ai-summary">
                <div class="bento-card__header" @click="toggleClaudeSummary">
                    <div class="header-left">
                        <v-icon name="hi-sparkles" scale="1.1" />
                        <span>AI Health Summary</span>
                        <span class="premium-badge">PREMIUM</span>
                        <span v-if="creditStatus && !claudeSummaryLoading" class="credits-badge">
                            {{ formatCreditsRemaining() }}
                        </span>
                    </div>
                    <v-icon
                        name="hi-chevron-down"
                        scale="1"
                        class="expand-icon"
                        :class="{ 'expanded': showClaudeSummary }"
                    />
                </div>

                <div v-if="showClaudeSummary" class="ai-summary-content">
                    <!-- Loading -->
                    <div v-if="claudeSummaryLoading" class="summary-loading">
                        <div class="loading-spinner"></div>
                        <p>Generating your personalized health summary...</p>
                    </div>

                    <!-- Error -->
                    <div v-else-if="claudeSummaryError" class="summary-error">
                        <v-icon name="hi-exclamation-circle" scale="1.5" />
                        <p>{{ claudeSummaryError }}</p>
                        <button class="retry-btn" @click="loadClaudeSummary">Try Again</button>
                    </div>

                    <!-- Purchase Required -->
                    <div v-else-if="purchaseRequired" class="purchase-prompt">
                        <div class="purchase-icon">
                            <v-icon name="hi-sparkles" scale="2" />
                        </div>
                        <h4>Credits Needed</h4>
                        <p>Your free monthly Health Summary credits have been used. Purchase more to continue accessing AI-powered insights.</p>
                        <div class="quick-plans" v-if="availablePlans.length">
                            <div
                                v-for="plan in availablePlans.slice(0, 3)"
                                :key="plan._id"
                                class="quick-plan"
                                @click="purchasePlan(plan._id)"
                            >
                                <span class="plan-name">{{ plan.name }}</span>
                                <span class="plan-price">₦{{ plan.price.toLocaleString() }}</span>
                            </div>
                        </div>
                        <button class="view-plans-btn" @click="openPurchaseModal">View All Plans</button>
                    </div>

                    <!-- Summary Content -->
                    <div v-else-if="claudeSummary?.content" class="summary-body">
                        <div class="summary-block">
                            <h4><v-icon name="hi-eye" scale="0.9" /> Overview</h4>
                            <p>{{ claudeSummary.content.overview }}</p>
                        </div>

                        <div v-if="claudeSummary.content.key_findings?.length" class="summary-block">
                            <h4><v-icon name="hi-light-bulb" scale="0.9" /> Key Findings</h4>
                            <ul>
                                <li v-for="(finding, idx) in claudeSummary.content.key_findings" :key="idx">
                                    {{ finding }}
                                </li>
                            </ul>
                        </div>

                        <div v-if="claudeSummary.content.possible_conditions_explained?.length" class="summary-block">
                            <h4><v-icon name="hi-clipboard-check" scale="0.9" /> Conditions Explained</h4>
                            <div
                                v-for="(condition, idx) in claudeSummary.content.possible_conditions_explained"
                                :key="idx"
                                class="condition-card"
                            >
                                <div class="condition-card-header">
                                    <span class="condition-card-name">{{ condition.condition }}</span>
                                    <span class="urgency-tag" :class="getUrgencyClass(condition.urgency)">
                                        {{ getUrgencyLabel(condition.urgency) }}
                                    </span>
                                </div>
                                <p>{{ condition.explanation }}</p>
                            </div>
                        </div>

                        <div v-if="claudeSummary.content.recommendations?.length" class="summary-block">
                            <h4><v-icon name="hi-check-circle" scale="0.9" /> Recommendations</h4>
                            <ul>
                                <li v-for="(rec, idx) in claudeSummary.content.recommendations" :key="idx">
                                    {{ rec }}
                                </li>
                            </ul>
                        </div>

                        <div v-if="claudeSummary.content.when_to_seek_care" class="summary-block summary-block--alert">
                            <h4><v-icon name="hi-exclamation" scale="0.9" /> When to Seek Care</h4>
                            <p>{{ claudeSummary.content.when_to_seek_care }}</p>
                        </div>

                        <div v-if="claudeSummary.content.lifestyle_tips?.length" class="summary-block">
                            <h4><v-icon name="hi-heart" scale="0.9" /> Wellness Tips</h4>
                            <ul>
                                <li v-for="(tip, idx) in claudeSummary.content.lifestyle_tips" :key="idx">
                                    {{ tip }}
                                </li>
                            </ul>
                        </div>

                        <div class="summary-disclaimer">
                            <v-icon name="hi-information-circle" scale="0.9" />
                            <p>This summary is for informational purposes only and is not a substitute for professional medical advice.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Q&A Review Card -->
            <div v-if="answeredQuestions.length" class="bento-card bento-card--qa">
                <div class="bento-card__header" @click="showQA = !showQA">
                    <div class="header-left">
                        <v-icon name="hi-chat-alt-2" scale="1.1" />
                        <span>Questions & Answers</span>
                        <span class="qa-count">{{ answeredQuestions.length }}</span>
                    </div>
                    <v-icon
                        name="hi-chevron-down"
                        scale="1"
                        class="expand-icon"
                        :class="{ 'expanded': showQA }"
                    />
                </div>

                <div v-if="showQA" class="qa-content">
                    <div
                        v-for="(qa, index) in answeredQuestions"
                        :key="index"
                        class="qa-item"
                    >
                        <div class="qa-question">{{ qa.question }}</div>
                        <div class="qa-answer" :class="qa.answerClass">
                            {{ qa.answer }}
                            <span v-if="qa.duration" class="qa-duration">{{ qa.duration }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Card -->
            <div class="bento-card bento-card--action">
                <div class="action-content">
                    <div class="action-info">
                        <v-icon name="hi-calendar" scale="1.5" />
                        <div class="action-text">
                            <h4>Ready to consult a specialist?</h4>
                            <p>Book an appointment and share your health assessment results with a doctor</p>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <button class="action-btn action-btn--secondary" @click="onTakeDiosisAgain">
                            <v-icon name="hi-refresh" scale="1" />
                            <span>New Assessment</span>
                        </button>
                        <button class="action-btn action-btn--primary" @click="goToBookAppointment">
                            <span>Book Consultation</span>
                            <v-icon name="hi-arrow-right" scale="1" />
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Purchase Modal -->
        <div v-if="showPurchaseModal" class="modal-overlay" @click.self="closePurchaseModal">
            <div class="purchase-modal">
                <div class="modal-header">
                    <div class="modal-title">
                        <v-icon :name="selectedPlanForPurchase ? 'hi-shield-check' : 'hi-sparkles'" scale="1.2" />
                        <div>
                            <h3>{{ selectedPlanForPurchase ? 'Confirm Purchase' : 'AI Health Summary Credits' }}</h3>
                            <p>{{ selectedPlanForPurchase ? 'Review your purchase details' : 'Unlock AI-powered health insights' }}</p>
                        </div>
                    </div>
                    <button class="modal-close" @click="closePurchaseModal">
                        <v-icon name="hi-x" scale="1.2" />
                    </button>
                </div>

                <div class="modal-body">
                    <div class="wallet-card">
                        <v-icon name="bi-wallet2" scale="1.2" />
                        <div class="wallet-info">
                            <span class="wallet-label">Wallet Balance</span>
                            <span class="wallet-amount">₦{{ walletBalance.toLocaleString() }}</span>
                        </div>
                    </div>

                    <!-- Confirmation View -->
                    <div v-if="selectedPlanForPurchase" class="confirmation-view">
                        <div class="selected-plan">
                            <div class="plan-icon">
                                <v-icon :name="selectedPlanForPurchase.credits ? 'hi-sparkles' : 'hi-lightning-bolt'" scale="1.5" />
                            </div>
                            <div class="plan-details">
                                <h4>{{ selectedPlanForPurchase.name }}</h4>
                                <p v-if="selectedPlanForPurchase.credits">{{ selectedPlanForPurchase.credits }} AI Health Summary credits</p>
                                <p v-else>Unlimited access for {{ selectedPlanForPurchase.duration_days }} days</p>
                            </div>
                        </div>

                        <div class="transaction-summary">
                            <div class="summary-row">
                                <span>Plan Price</span>
                                <span>₦{{ selectedPlanForPurchase.price.toLocaleString() }}</span>
                            </div>
                            <div class="summary-row">
                                <span>Current Balance</span>
                                <span>₦{{ walletBalance.toLocaleString() }}</span>
                            </div>
                            <div class="summary-row summary-row--total" :class="{ 'insufficient': walletBalance < selectedPlanForPurchase.price }">
                                <span>Balance After</span>
                                <span>₦{{ Math.max(0, walletBalance - selectedPlanForPurchase.price).toLocaleString() }}</span>
                            </div>
                        </div>

                        <div v-if="walletBalance < selectedPlanForPurchase.price" class="insufficient-alert">
                            <v-icon name="hi-exclamation" scale="1" />
                            <div>
                                <strong>Insufficient Balance</strong>
                                <p>You need ₦{{ (selectedPlanForPurchase.price - walletBalance).toLocaleString() }} more.</p>
                            </div>
                        </div>

                        <div class="confirmation-actions">
                            <button class="back-btn" @click="selectedPlanForPurchase = null">
                                <v-icon name="hi-arrow-left" scale="1" />
                                Back
                            </button>
                            <button
                                class="confirm-btn"
                                :disabled="purchaseLoading || walletBalance < selectedPlanForPurchase.price"
                                @click="confirmPurchase"
                            >
                                <span v-if="!purchaseLoading">Confirm Purchase</span>
                                <span v-else class="loading-text">Processing...</span>
                            </button>
                        </div>
                    </div>

                    <!-- Plan Selection View -->
                    <div v-else class="plans-view">
                        <p class="plans-description">Select a plan to unlock AI-powered analysis of your health checkups.</p>
                        <div class="plans-grid">
                            <div
                                v-for="plan in availablePlans"
                                :key="plan._id"
                                class="plan-card"
                                :class="{ 'popular': plan.credits === 5 }"
                                @click="selectPlanForPurchase(plan)"
                            >
                                <div v-if="plan.credits === 5" class="popular-tag">Popular</div>
                                <div class="plan-card-icon">
                                    <v-icon :name="plan.credits ? 'hi-sparkles' : 'hi-lightning-bolt'" scale="1.3" />
                                </div>
                                <h4>{{ plan.name }}</h4>
                                <div class="plan-price">
                                    <span class="currency">₦</span>
                                    <span class="amount">{{ plan.price.toLocaleString() }}</span>
                                </div>
                                <p>{{ plan.credits ? `${plan.credits} credits` : `${plan.duration_days} days unlimited` }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { formatDuration } from "date-fns";
import { ref, inject, computed, watchEffect, onMounted } from "vue";
import { useToast } from 'vue-toast-notification';
import { mapGetters } from "@/utilities/utilityStore";
import { useRouter } from "vue-router";

const $toast = useToast();
const $http = inject('$_HTTP');
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { diagnosis, useDiagnosis } = inject('$_DIAGNOSIS');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');
const { recommendation, useRecommendation } = inject('$_RECOMMENDATION');
const { userprofile } = mapGetters();

const router = useRouter();
const showDiagnosesList = ref(false);
const showLessLikely = ref(false);
const showQA = ref(false);
const currentPage = ref(1);
const itemsPerPage = 10;
const showingExtendedConditions = ref(false);
const loadingMoreConditions = ref(false);
const extendedConditions = ref([]);
const { current, from, to } = navigator.value;

// Claude AI Health Summary state
const claudeSummaryEnabled = ref(true);
const claudeSummary = ref(null);
const claudeSummaryLoading = ref(false);
const claudeSummaryError = ref(null);
const showClaudeSummary = ref(false);
const creditStatus = ref(null);
const purchaseRequired = ref(false);
const availablePlans = ref([]);
const showPurchaseModal = ref(false);
const purchaseLoading = ref(false);
const walletBalance = ref(0);
const selectedPlanForPurchase = ref(null);
const sortedConditions = ref([]);
const moreLikelyConditions = ref([]);
const lessLikelyConditions = ref([]);
const conditions = ref([...recommendation.value.diagnosis.conditions]);

// Get evidence class for condition category
const getEvidenceClass = (category) => {
    if (category === 0) return 'evidence-strong';
    if (category === 1) return 'evidence-moderate';
    return 'evidence-weak';
};

// Get evidence label for condition category
const getEvidenceLabel = (category) => {
    if (category === 0) return 'Strong evidence';
    if (category === 1) return 'Moderate evidence';
    return 'Weak evidence';
};

// Get indicator class for condition category
const getIndicatorClass = (category) => {
    if (category === 0) return 'indicator-strong';
    if (category === 1) return 'indicator-moderate';
    return 'indicator-weak';
};

// Store health check results for booking
const storeHealthCheckForBooking = () => {
    const healthCheckData = {
        checkup_id: recommendation.value?.checkup_id || recommendation.value?.diagnosis?.checkup_id || diagnosis.value?.checkup_id,
        conditions: conditions.value.map(c => ({
            name: c.common_name,
            probability: c.probability,
            category: c.category
        })),
        triage_level: triageLevel.value,
        symptoms: (recommendation.value?.diagnosis?.evidence || diagnosis.value?.evidence || [])
            .filter(e => e.choice_id === 'present')
            .map(e => e.common_name || e.name || e.label),
        interview_summary: answeredQuestions.value.map(qa => ({
            question: qa.question,
            answer: qa.answer
        })),
        assessment_date: new Date().toISOString(),
        patient_note: generatePatientNote()
    };

    // Store in sessionStorage for the booking flow
    sessionStorage.setItem('healthCheckForBooking', JSON.stringify(healthCheckData));
    return healthCheckData;
};

// Generate patient note from symptoms
const generatePatientNote = () => {
    const symptoms = (recommendation.value?.diagnosis?.evidence || diagnosis.value?.evidence || [])
        .filter(e => e.choice_id === 'present')
        .map(e => e.common_name || e.name || e.label);

    const topConditions = conditions.value.slice(0, 3).map(c => c.common_name);

    let note = 'AI Health Assessment Results:\n\n';

    if (symptoms.length) {
        note += `Reported Symptoms: ${symptoms.join(', ')}\n\n`;
    }

    if (topConditions.length) {
        note += `Possible Conditions: ${topConditions.join(', ')}\n\n`;
    }

    if (triageConfig.value) {
        note += `Urgency Level: ${triageConfig.value.title}\n`;
    }

    return note;
};

const goToBookAppointment = () => {
    // Store health check data for the booking flow
    const healthData = storeHealthCheckForBooking();

    // Navigate to v2 booking wizard with query params
    router.push({
        name: 'Appointmentsv2Book',
        query: {
            from_health_check: 'true',
            checkup_id: healthData.checkup_id
        }
    });
};

const duration = computed(() => {
    const durationMs = recommendation.value.duration || 0;
    return formatDuration({
        minutes: Math.floor(durationMs / (1000 * 60)),
        seconds: Math.floor((durationMs % (1000 * 60)) / 1000),
        format: ['minutes', 'seconds']
    });
});

const consideredDiagnosesCount = computed(() => {
    const actualConditionsCount = conditions.value?.length || 0;
    if (showingExtendedConditions.value && extendedConditions.value.length > 0) {
        return actualConditionsCount + extendedConditions.value.length;
    }
    return actualConditionsCount;
});

const triageLevel = computed(() => {
    return recommendation.value?.diagnosis?.triage_level ||
           diagnosis.value?.triage_level ||
           null;
});

const triageConfig = computed(() => {
    const configs = {
        'emergency': {
            title: 'Seek Emergency Care Immediately',
            description: 'Your symptoms suggest a potentially serious condition that requires immediate medical attention.',
            color: '#dc2626',
            bgColor: '#fef2f2',
            icon: 'hi-exclamation-circle'
        },
        'emergency_ambulance': {
            title: 'Call an Ambulance Now',
            description: 'Your symptoms indicate a medical emergency. Please call emergency services immediately.',
            color: '#dc2626',
            bgColor: '#fef2f2',
            icon: 'hi-exclamation-circle'
        },
        'consultation_24': {
            title: 'See a Doctor Within 24 Hours',
            description: 'Your symptoms require prompt medical attention. Schedule an appointment within 24 hours.',
            color: '#f59e0b',
            bgColor: '#fffbeb',
            icon: 'hi-clock'
        },
        'consultation': {
            title: 'Schedule a Doctor Visit',
            description: 'Your symptoms suggest you should see a doctor within the next few days.',
            color: '#3b82f6',
            bgColor: '#eff6ff',
            icon: 'hi-calendar'
        },
        'self_care': {
            title: 'Self-Care Recommended',
            description: 'Your symptoms appear manageable with self-care. Monitor and consult if symptoms worsen.',
            color: '#10b981',
            bgColor: '#ecfdf5',
            icon: 'hi-check-circle'
        }
    };
    return configs[triageLevel.value] || null;
});

const allConditions = computed(() => {
    if (showingExtendedConditions.value && extendedConditions.value.length > 0) {
        const combined = [...conditions.value];
        const existingIds = new Set(conditions.value.map(c => c.id));
        extendedConditions.value.forEach(condition => {
            if (!existingIds.has(condition.id)) {
                combined.push(condition);
            }
        });
        return combined;
    }
    return conditions.value || [];
});

const conditionsDisplayLabel = computed(() => {
    if (showingExtendedConditions.value) {
        return `All Conditions (${allConditions.value.length})`;
    }
    return `Top Conditions (${allConditions.value.length})`;
});

const paginatedConditions = computed(() => {
    const startIndex = (currentPage.value - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allConditions.value.slice(startIndex, endIndex);
});

const totalPages = computed(() => {
    return Math.ceil(allConditions.value.length / itemsPerPage);
});

const showPagination = computed(() => {
    return totalPages.value > 1;
});

// Q&A Summary
const answeredQuestions = computed(() => {
    const questions = [];
    const trackedQuestions = recommendation.value?.answered_questions || [];

    if (trackedQuestions.length > 0) {
        trackedQuestions.forEach(q => {
            if (q.type === 'group_multiple' || q.type === 'group_single') {
                q.answers.forEach(answer => {
                    const answerName = answer.name || '';
                    const formattedQuestion = answerName
                        ? `Do you experience: ${answerName.toLowerCase()}?`
                        : q.question;
                    questions.push({
                        question: formattedQuestion,
                        answer: answer.choice === 'present' ? 'Yes' : 'No',
                        answerClass: answer.choice === 'present' ? 'answer-yes' : 'answer-no',
                        duration: answer.duration ? formatSymptomDuration(answer.duration) : null,
                        type: 'user-answered'
                    });
                });
            } else if (q.type === 'single') {
                q.answers.forEach(answer => {
                    questions.push({
                        question: q.question,
                        answer: answer.choice === 'present' ? 'Yes' :
                               answer.choice === 'absent' ? 'No' : 'Not sure',
                        answerClass: answer.choice === 'present' ? 'answer-yes' :
                                    answer.choice === 'absent' ? 'answer-no' : 'answer-neutral',
                        duration: answer.duration ? formatSymptomDuration(answer.duration) : null,
                        type: 'user-answered'
                    });
                });
            }
        });
    } else {
        const evidence = recommendation.value?.diagnosis?.evidence || diagnosis.value?.evidence || [];
        const userAnsweredEvidence = evidence.filter(item =>
            item.source === 'initial' || item.source === 'interview'
        );

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
    }

    return questions;
});

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

watchEffect(() => {
    if (Object.keys(recommendation.value).length) {
        const sorted = recommendation.value.diagnosis?.conditions?.sort((a, b) => b.probability - a.probability);
        sortedConditions.value = sorted.map((condition, i) => ({
            ...condition, category: Math.floor(i / (sorted.length / 3))
        })).forEach(condition => {
            if (condition.category <= 1) moreLikelyConditions.value.push(condition)
            else if (condition.category > 1) lessLikelyConditions.value.push(condition)
        })
    }
});

const onTakeDiosisAgain = () => {
    usePatientInfo({});
    useDiagnosis({});
    useRecommendation({});
    useNavigator({ current, from: current, to: 0 });
};

const handleDiagnosisClick = () => {
    showDiagnosesList.value = !showDiagnosesList.value;
    if (showDiagnosesList.value) {
        currentPage.value = 1;
    }
};

const goToNextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
    }
};

const goToPrevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
};

// Claude AI Health Summary methods
const checkClaudeSummaryStatus = async () => {
    try {
        const response = await $http.$_getClaudeSummaryStatus();
        if (response?.data?.data) {
            claudeSummaryEnabled.value = true;
            creditStatus.value = response.data.data.credits;
        }
    } catch (error) {
        console.log('Claude summary status check failed:', error);
        claudeSummaryEnabled.value = true;
    }
};

const loadClaudeSummary = async () => {
    if (!claudeSummaryEnabled.value) return;

    const checkupId = recommendation.value?.checkup_id ||
                      diagnosis.value?.checkup_id ||
                      recommendation.value?.diagnosis?.checkup_id;

    if (!checkupId) {
        console.log('No checkup ID available for Claude summary');
        return;
    }

    claudeSummaryLoading.value = true;
    claudeSummaryError.value = null;
    purchaseRequired.value = false;

    try {
        const getResponse = await $http.$_getClaudeSummary(checkupId);

        if (getResponse?.data?.data?.credits) {
            creditStatus.value = getResponse.data.data.credits;
        }

        if (getResponse?.data?.data?.has_summary && getResponse.data.data.claude_summary?.content) {
            claudeSummary.value = getResponse.data.data.claude_summary;
        } else {
            const generateResponse = await $http.$_generateClaudeSummary(
                checkupId,
                recommendation.value?.answered_questions || null
            );

            const responseData = generateResponse?.data?.data;

            if (responseData?.purchase_required) {
                purchaseRequired.value = true;
                availablePlans.value = responseData.available_plans || [];
                creditStatus.value = responseData.credits;
            } else if (responseData?.claude_summary?.content) {
                claudeSummary.value = responseData.claude_summary;
                creditStatus.value = responseData.credits;
            } else if (responseData?.error) {
                claudeSummaryError.value = responseData.error;
            }
        }
    } catch (error) {
        console.error('Error loading Claude summary:', error);
        claudeSummaryError.value = 'Failed to load AI health summary. Please try again later.';
    } finally {
        claudeSummaryLoading.value = false;
    }
};

const fetchWalletBalance = async () => {
    try {
        const response = await $http.$_getWalletBalance();
        if (response?.data?.data) {
            walletBalance.value = response.data.data.currentBalance || response.data.data.balance || 0;
        }
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        walletBalance.value = 0;
    }
};

const selectPlanForPurchase = (plan) => {
    selectedPlanForPurchase.value = plan;
};

const purchasePlan = async (planId) => {
    await fetchWalletBalance();
    const plan = availablePlans.value.find(p => p._id === planId);
    if (plan) {
        selectedPlanForPurchase.value = plan;
        showPurchaseModal.value = true;
    }
};

const confirmPurchase = async () => {
    if (!selectedPlanForPurchase.value) return;

    purchaseLoading.value = true;
    try {
        const response = await $http.$_purchaseClaudeSummaryPlan(selectedPlanForPurchase.value._id);
        if (response?.data?.data?.success) {
            $toast.success('Purchase successful!', { duration: 4000 });
            showPurchaseModal.value = false;
            selectedPlanForPurchase.value = null;
            purchaseRequired.value = false;
            await loadClaudeSummary();
        }
    } catch (error) {
        console.error('Purchase failed:', error);
        claudeSummaryError.value = error.response?.data?.message || 'Purchase failed. Please try again.';
    } finally {
        purchaseLoading.value = false;
    }
};

const openPurchaseModal = async () => {
    await fetchWalletBalance();
    showPurchaseModal.value = true;
};

const closePurchaseModal = () => {
    showPurchaseModal.value = false;
    selectedPlanForPurchase.value = null;
};

const formatCreditsRemaining = () => {
    if (!creditStatus.value) return '';
    if (creditStatus.value.has_unlimited_subscription) return 'Unlimited';
    const total = creditStatus.value.free_credits_remaining +
                  creditStatus.value.purchased_credits +
                  creditStatus.value.gifted_credits;
    return `${total} credit${total !== 1 ? 's' : ''}`;
};

const toggleClaudeSummary = () => {
    showClaudeSummary.value = !showClaudeSummary.value;
    if (showClaudeSummary.value && claudeSummaryEnabled.value && !claudeSummary.value && !claudeSummaryLoading.value) {
        loadClaudeSummary();
    }
};

const getUrgencyClass = (urgency) => {
    const classMap = {
        'emergency': 'urgency-emergency',
        'urgent': 'urgency-urgent',
        'soon': 'urgency-soon',
        'routine': 'urgency-routine'
    };
    return classMap[urgency] || 'urgency-routine';
};

const getUrgencyLabel = (urgency) => {
    const labelMap = {
        'emergency': 'Seek immediate care',
        'urgent': 'See a doctor soon',
        'soon': 'Schedule an appointment',
        'routine': 'Routine follow-up'
    };
    return labelMap[urgency] || 'Consult a healthcare provider';
};

// PDF Download functionality
const downloadPDF = async () => {
    try {
        const html2pdf = (await import('html2pdf.js')).default;

        if (!claudeSummary.value) {
            const existingSummary = recommendation.value?.claude_summary ||
                                    recommendation.value?.diagnosis?.claude_summary ||
                                    diagnosis.value?.claude_summary;
            if (existingSummary?.content) {
                claudeSummary.value = existingSummary;
            }
        }

        if (!claudeSummary.value) {
            const checkupId = recommendation.value?.checkup_id ||
                              diagnosis.value?.checkup_id ||
                              recommendation.value?.diagnosis?.checkup_id ||
                              recommendation.value?._id;
            if (checkupId) {
                try {
                    const getResponse = await $http.$_getClaudeSummary(checkupId);
                    if (getResponse?.data?.data?.has_summary && getResponse.data.data.claude_summary?.content) {
                        claudeSummary.value = getResponse.data.data.claude_summary;
                    }
                } catch (err) {
                    console.log('Could not fetch Claude summary for PDF:', err.message);
                }
            }
        }

        let patientProfile = {};
        const healthCheckFor = recommendation.value?.health_check_for ||
                               diagnosis.value?.health_check_for ||
                               patientInfo.value?.health_check_for ||
                               'Self';

        if (healthCheckFor === 'Self' || healthCheckFor === 'self') {
            patientProfile = userprofile.value?.profile || {};
        } else {
            patientProfile = patientInfo.value ||
                            recommendation.value?.patient_info ||
                            recommendation.value?.diagnosis?.patient_info ||
                            diagnosis.value?.patient_info ||
                            {};
        }

        if (!patientProfile.first_name && !patientProfile.last_name) {
            patientProfile = userprofile.value?.profile || {};
        }

        const checkupData = recommendation.value || diagnosis.value || {};
        const checkupDate = checkupData.created_at ||
                            checkupData.createdAt ||
                            checkupData.checkup_date ||
                            new Date().toISOString();

        const checkupDateObj = new Date(checkupDate);
        const formattedDateOnly = checkupDateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTimeOnly = checkupDateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const formatAddress = (profile) => {
            const addressParts = [
                profile.contact?.address1,
                profile.contact?.address2,
                profile.contact?.state,
                profile.contact?.country,
                profile.contact?.zip_code
            ].filter(part => part && part.trim().length > 0);
            return addressParts.length > 0 ? addressParts.join(', ') : 'N/A';
        };

        const formatPhoneNumber = (profile) => {
            const countryCode = profile.contact?.phone?.country_code;
            const number = profile.contact?.phone?.number;
            if (countryCode && number) return `${countryCode}${number}`;
            else if (number) return number;
            return 'N/A';
        };

        const reportId = `RC-${Date.now().toString(36).toUpperCase()}`;

        const pdfContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
                <div style="text-align: center; border-bottom: 2px solid #4FC3F7; padding-bottom: 20px; margin-bottom: 20px;">
                    <h1 style="color: #4FC3F7; margin: 0;">RapidCapsule</h1>
                    <p style="color: #666; margin: 5px 0;">Health Assessment Report</p>
                    <p style="color: #999; font-size: 12px;">Report ID: ${reportId} | ${formattedDateOnly} at ${formattedTimeOnly}</p>
                </div>

                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #334155;">Patient Information</h3>
                    <p style="margin: 5px 0;"><strong>Name:</strong> ${patientProfile.first_name || 'N/A'} ${patientProfile.last_name || ''}</p>
                    <p style="margin: 5px 0;"><strong>Gender:</strong> ${patientProfile.gender || 'N/A'}</p>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${patientProfile.contact?.email || 'N/A'}</p>
                    <p style="margin: 5px 0;"><strong>Phone:</strong> ${formatPhoneNumber(patientProfile)}</p>
                </div>

                ${triageConfig.value ? `
                <div style="background: ${triageConfig.value.bgColor}; border-left: 4px solid ${triageConfig.value.color}; padding: 15px; margin-bottom: 20px;">
                    <h3 style="color: ${triageConfig.value.color}; margin: 0 0 5px 0;">${triageConfig.value.title}</h3>
                    <p style="margin: 0; color: #666;">${triageConfig.value.description}</p>
                </div>
                ` : ''}

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Possible Conditions</h3>
                    ${allConditions.value.length > 0 ? allConditions.value.map((c, i) => `
                        <div style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                            <strong>${i + 1}. ${c.common_name}</strong>
                            <span style="float: right; color: #666;">${Math.round((c.probability || 0) * 100)}%</span>
                        </div>
                    `).join('') : '<p style="color: #666;">No concerning conditions identified.</p>'}
                </div>

                ${claudeSummary.value?.content ? `
                <div style="background: #e0f2fe; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #0288D1; margin: 0 0 15px 0;">AI Health Summary</h3>
                    <p style="margin-bottom: 15px;">${claudeSummary.value.content.overview || ''}</p>
                    ${claudeSummary.value.content.recommendations?.length ? `
                        <h4 style="color: #0288D1; margin: 15px 0 10px 0;">Recommendations</h4>
                        <ul style="margin: 0; padding-left: 20px;">
                            ${claudeSummary.value.content.recommendations.map(r => `<li style="margin-bottom: 5px;">${r}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
                ` : ''}

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px;">
                    <p><strong>Disclaimer:</strong> This report is for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider.</p>
                    <p style="text-align: center; margin-top: 15px;">Generated by RapidCapsule | www.rapidcapsule.com</p>
                </div>
            </div>
        `;

        const element = document.createElement('div');
        element.innerHTML = pdfContent;
        document.body.appendChild(element);

        const options = {
            margin: 10,
            filename: `health-report-${reportId}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().from(element).set(options).save();
        document.body.removeChild(element);
        $toast.success('PDF downloaded successfully!');
    } catch (error) {
        console.error('Error downloading PDF:', error);
        $toast.error('Failed to download PDF. Please try again.');
    }
};

const shareReport = async () => {
    const checkupId = recommendation.value?.checkup_id || diagnosis.value?.checkup_id;
    const shareUrl = `${window.location.origin}/app/patient/health-checkup/report/${checkupId}`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'My Health Assessment Report',
                text: 'Check out my health assessment results from RapidCapsule',
                url: shareUrl
            });
        } catch (err) {
            console.log('Share cancelled');
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareUrl);
            $toast.success('Report link copied to clipboard!');
        } catch (err) {
            $toast.error('Failed to copy link');
        }
    }
};

// Initialize
checkClaudeSummaryStatus();
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
$rose: #F43F5E;
$green: #10B981;
$amber: #F59E0B;

.report-page {
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
        .badge-ai {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
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

    &__actions {
        display: flex;
        gap: 12px;
        margin-top: 8px;

        @media (max-width: 900px) {
            justify-content: center;
        }
    }

    &__action-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background: rgba(255, 255, 255, 0.25);
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

// Report Orb Animation
.report-orb {
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
        cursor: pointer;

        svg {
            color: $sky;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }

        .expand-icon {
            transition: transform 0.3s;

            &.expanded {
                transform: rotate(180deg);
            }
        }
    }

    &--triage {
        grid-column: 1 / -1;
        padding: 0;
        overflow: hidden;
        border: none;

        &.triage-emergency, &.triage-emergency_ambulance {
            background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
            border: 1px solid #fecaca;
        }

        &.triage-consultation_24 {
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
            border: 1px solid #fde68a;
        }

        &.triage-consultation {
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border: 1px solid #bfdbfe;
        }

        &.triage-self_care {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border: 1px solid #a7f3d0;
        }
    }

    &--conditions {
        @media (max-width: 900px) {
            order: 2;
        }
    }

    &--stats {
        @media (max-width: 900px) {
            order: 1;
        }
    }

    &--ai-summary {
        grid-column: 1 / -1;
        background: linear-gradient(135deg, #f0fdfa 0%, $sky-light 100%);
        border: 1px solid #a5f3fc;
    }

    &--qa {
        grid-column: 1 / -1;
    }

    &--action {
        grid-column: 1 / -1;
        background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
        border: none;
    }
}

// Triage Content
.triage-content {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px;

    @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
    }
}

.triage-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.triage-info {
    flex: 1;
}

.triage-title {
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 8px 0;
}

.triage-desc {
    font-size: 14px;
    color: $gray;
    margin: 0;
    line-height: 1.5;
}

.triage-action {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        filter: brightness(1.1);
    }

    @media (max-width: 768px) {
        width: 100%;
        justify-content: center;
    }
}

// Conditions List
.conditions-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.condition-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: $bg;
    border-radius: 12px;
    border: 1px solid #E2E8F0;

    &--muted {
        opacity: 0.7;
    }
}

.condition-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.condition-name {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
    margin: 0;
}

.condition-evidence {
    font-size: 13px;
    font-weight: 500;

    &.evidence-strong {
        color: #dc2626;
    }
    &.evidence-moderate {
        color: $amber;
    }
    &.evidence-weak {
        color: $gray;
    }
}

.condition-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;

    &.indicator-strong {
        background: #dc2626;
    }
    &.indicator-moderate {
        background: $amber;
    }
    &.indicator-weak {
        background: #CBD5E1;
    }
}

.condition-count {
    background: $sky-light;
    color: $sky-dark;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    margin-left: auto;
}

.less-likely-section {
    margin-top: 8px;
}

.show-less-likely {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 0;
    background: none;
    border: none;
    color: $sky-dark;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    width: 100%;
    justify-content: center;

    &:hover {
        text-decoration: underline;
    }
}

.less-likely-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
}

.no-conditions {
    text-align: center;
    padding: 32px 16px;

    &-icon {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        color: $green;
    }

    h4 {
        font-size: 18px;
        font-weight: 600;
        color: $navy;
        margin: 0 0 8px 0;
    }

    p {
        font-size: 14px;
        color: $gray;
        line-height: 1.6;
        margin: 0;
    }
}

// Stats Grid
.stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 16px;
    background: $bg;
    border-radius: 12px;
}

.stat-value {
    font-size: 28px;
    font-weight: 700;
    color: $sky-dark;

    &.clickable {
        cursor: pointer;
        text-decoration: underline;

        &:hover {
            color: $sky-darker;
        }
    }
}

.stat-label {
    font-size: 13px;
    color: $gray;
    margin-top: 4px;
}

// Diagnoses Expanded
.diagnoses-expanded {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #E2E8F0;
}

.diagnoses-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h4 {
        font-size: 14px;
        font-weight: 600;
        color: $slate;
        margin: 0;
    }
}

.collapse-btn {
    padding: 6px 12px;
    background: $sky-light;
    border: none;
    border-radius: 8px;
    color: $sky-dark;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
        background: darken($sky-light, 5%);
    }
}

.diagnoses-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.diagnosis-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: $bg;
    border-radius: 8px;
}

.diagnosis-name {
    font-size: 14px;
    color: $slate;
}

.diagnosis-prob {
    font-size: 14px;
    font-weight: 600;
    color: $sky-dark;
}

.pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;

    button {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: 1px solid #E2E8F0;
        background: white;
        cursor: pointer;

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        &:hover:not(:disabled) {
            background: $sky-light;
        }
    }

    span {
        font-size: 14px;
        color: $gray;
    }
}

// AI Summary Content
.ai-summary-content {
    margin-top: 16px;
}

.summary-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid $sky-light;
        border-top-color: $sky;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    p {
        margin-top: 16px;
        color: $gray;
    }
}

.summary-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 20px;
    text-align: center;

    svg {
        color: $rose;
        margin-bottom: 12px;
    }

    p {
        color: $slate;
        margin-bottom: 16px;
    }
}

.retry-btn {
    padding: 10px 20px;
    background: $sky;
    border: none;
    border-radius: 10px;
    color: white;
    font-weight: 500;
    cursor: pointer;

    &:hover {
        background: $sky-dark;
    }
}

.purchase-prompt {
    text-align: center;
    padding: 32px 20px;

    .purchase-icon {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        color: white;
    }

    h4 {
        font-size: 18px;
        font-weight: 600;
        color: $navy;
        margin: 0 0 8px 0;
    }

    p {
        color: $gray;
        margin: 0 0 20px 0;
        line-height: 1.6;
    }
}

.quick-plans {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.quick-plan {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 20px;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: $sky;
        transform: translateY(-2px);
    }

    .plan-name {
        font-size: 13px;
        color: $gray;
    }

    .plan-price {
        font-size: 16px;
        font-weight: 700;
        color: $navy;
    }
}

.view-plans-btn {
    padding: 12px 24px;
    background: $sky;
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;

    &:hover {
        background: $sky-dark;
    }
}

.premium-badge {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    color: #78350f;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
}

.credits-badge {
    font-size: 12px;
    color: $gray;
    font-weight: 400;
}

.summary-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.summary-block {
    h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 600;
        color: $sky-dark;
        margin: 0 0 12px 0;

        svg {
            flex-shrink: 0;
        }
    }

    p {
        font-size: 14px;
        color: $slate;
        line-height: 1.7;
        margin: 0;
    }

    ul {
        margin: 0;
        padding-left: 20px;

        li {
            font-size: 14px;
            color: $slate;
            line-height: 1.7;
            margin-bottom: 8px;
        }
    }

    &--alert {
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 12px;
        padding: 16px;

        h4 {
            color: #c2410c;
        }

        p {
            color: #9a3412;
        }
    }
}

.condition-card {
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;

    &:last-child {
        margin-bottom: 0;
    }
}

.condition-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.condition-card-name {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
}

.urgency-tag {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;

    &.urgency-emergency {
        background: #fef2f2;
        color: #dc2626;
    }
    &.urgency-urgent {
        background: #fffbeb;
        color: #d97706;
    }
    &.urgency-soon {
        background: #eff6ff;
        color: #2563eb;
    }
    &.urgency-routine {
        background: #ecfdf5;
        color: #059669;
    }
}

.summary-disclaimer {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 10px;

    svg {
        color: $gray;
        flex-shrink: 0;
        margin-top: 2px;
    }

    p {
        font-size: 12px;
        color: $gray;
        margin: 0;
        line-height: 1.5;
    }
}

// Q&A Content
.qa-count {
    background: $sky-light;
    color: $sky-dark;
    padding: 2px 10px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
}

.qa-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
}

.qa-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: $bg;
    border-radius: 10px;
    gap: 16px;

    @media (max-width: 640px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
}

.qa-question {
    font-size: 14px;
    color: $slate;
    flex: 1;
}

.qa-answer {
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;

    &.answer-yes {
        color: $green;
    }
    &.answer-no {
        color: $rose;
    }
    &.answer-neutral {
        color: $gray;
    }
}

.qa-duration {
    font-size: 12px;
    color: $gray;
    font-weight: 400;
    padding: 2px 8px;
    background: white;
    border-radius: 6px;
}

// Action Card Content
.action-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;

    @media (max-width: 768px) {
        flex-direction: column;
        text-align: center;
    }
}

.action-info {
    display: flex;
    align-items: center;
    gap: 16px;
    color: white;

    @media (max-width: 768px) {
        flex-direction: column;
    }

    svg {
        flex-shrink: 0;
    }
}

.action-text {
    h4 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 4px 0;
    }

    p {
        font-size: 14px;
        opacity: 0.9;
        margin: 0;
    }
}

.action-buttons {
    display: flex;
    gap: 12px;

    @media (max-width: 768px) {
        width: 100%;
        flex-direction: column;
    }
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 24px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &--primary {
        background: white;
        border: none;
        color: $sky-dark;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
    }

    &--secondary {
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;

        &:hover {
            background: rgba(255, 255, 255, 0.3);
        }
    }
}

// Modal Styles
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.purchase-modal {
    background: white;
    border-radius: 24px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalIn 0.3s ease;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 24px 24px 20px;
    border-bottom: 1px solid #E2E8F0;
}

.modal-title {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    svg {
        color: $sky;
        flex-shrink: 0;
        margin-top: 2px;
    }

    h3 {
        font-size: 18px;
        font-weight: 600;
        color: $navy;
        margin: 0 0 4px 0;
    }

    p {
        font-size: 14px;
        color: $gray;
        margin: 0;
    }
}

.modal-close {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: $bg;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $gray;

    &:hover {
        background: darken($bg, 5%);
    }
}

.modal-body {
    padding: 24px;
}

.wallet-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: linear-gradient(135deg, $sky-light 0%, #e0f2fe 100%);
    border-radius: 14px;
    margin-bottom: 24px;

    svg {
        color: $sky-dark;
    }
}

.wallet-info {
    display: flex;
    flex-direction: column;
}

.wallet-label {
    font-size: 13px;
    color: $gray;
}

.wallet-amount {
    font-size: 20px;
    font-weight: 700;
    color: $navy;
}

// Confirmation View
.confirmation-view {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.selected-plan {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: $bg;
    border-radius: 16px;

    .plan-icon {
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
    }

    .plan-details {
        h4 {
            font-size: 16px;
            font-weight: 600;
            color: $navy;
            margin: 0 0 4px 0;
        }

        p {
            font-size: 14px;
            color: $gray;
            margin: 0;
        }
    }
}

.transaction-summary {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: $slate;

    &--total {
        padding-top: 12px;
        border-top: 1px solid #E2E8F0;
        font-weight: 600;

        &.insufficient span:last-child {
            color: $rose;
        }
    }
}

.insufficient-alert {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;

    svg {
        color: $rose;
        flex-shrink: 0;
    }

    strong {
        font-size: 14px;
        color: #991b1b;
        display: block;
        margin-bottom: 4px;
    }

    p {
        font-size: 13px;
        color: #b91c1c;
        margin: 0;
    }
}

.confirmation-actions {
    display: flex;
    gap: 12px;
}

.back-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 20px;
    background: $bg;
    border: none;
    border-radius: 12px;
    color: $slate;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;

    &:hover {
        background: darken($bg, 5%);
    }
}

.confirm-btn {
    flex: 1;
    padding: 14px 24px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &:hover:not(:disabled) {
        box-shadow: 0 4px 12px rgba(79, 195, 247, 0.4);
    }

    .loading-text {
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
}

// Plans View
.plans-view {
    .plans-description {
        text-align: center;
        color: $gray;
        margin-bottom: 20px;
    }
}

.plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
}

.plan-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 16px;
    background: $bg;
    border: 2px solid transparent;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: $sky;
        transform: translateY(-2px);
    }

    &.popular {
        border-color: $sky;
        background: $sky-light;
    }

    .popular-tag {
        position: absolute;
        top: -10px;
        background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
        color: white;
        font-size: 10px;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
    }

    &-icon {
        width: 48px;
        height: 48px;
        background: white;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;

        svg {
            color: $sky;
        }
    }

    h4 {
        font-size: 14px;
        font-weight: 600;
        color: $navy;
        margin: 0 0 8px 0;
        text-align: center;
    }

    .plan-price {
        display: flex;
        align-items: baseline;
        margin-bottom: 4px;

        .currency {
            font-size: 14px;
            color: $gray;
        }

        .amount {
            font-size: 24px;
            font-weight: 700;
            color: $navy;
        }
    }

    p {
        font-size: 12px;
        color: $gray;
        margin: 0;
        text-align: center;
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

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes modalIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}
</style>
