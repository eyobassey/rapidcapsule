<template>
    <div class="checkup-history">
        <!-- Hero Section - Split Layout -->
        <section class="hero">
            <div class="hero__content">
                <button class="hero__back" @click="goBack">
                    <v-icon name="hi-arrow-left" />
                    <span>Back</span>
                </button>
                <div class="hero__badge">
                    <div class="badge-pulse"></div>
                    <v-icon name="hi-shield-check" />
                    <span>Health Records</span>
                </div>
                <h1 class="hero__title">Checkup<br/><span class="hero__title-accent">History</span></h1>
                <p class="hero__subtitle">View, manage and track all your AI health assessments in one place.</p>
            </div>
            <div class="hero__visual">
                <div class="history-orb">
                    <div class="orb-ring orb-ring--1"></div>
                    <div class="orb-ring orb-ring--2"></div>
                    <div class="orb-core">
                        <v-icon name="hi-clipboard-list" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
            <!-- Stats Row -->
            <div v-if="!isLoading && historyData.checkups && historyData.checkups.length > 0" class="bento-card bento-card--stats">
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-item__icon stat-item__icon--primary">
                            <v-icon name="hi-clipboard-list" />
                        </div>
                        <div class="stat-item__content">
                            <span class="stat-item__value">{{ totalCheckups() }}</span>
                            <span class="stat-item__label">Total Checkups</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-item__icon stat-item__icon--info">
                            <v-icon name="hi-clock" />
                        </div>
                        <div class="stat-item__content">
                            <span class="stat-item__value">{{ getTimeAgo(lastCheckupDate()) }}</span>
                            <span class="stat-item__label">Last Checkup</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-item__icon stat-item__icon--warning">
                            <v-icon name="hi-exclamation-circle" />
                        </div>
                        <div class="stat-item__content">
                            <span class="stat-item__value">{{ urgentCheckupsCount() }}</span>
                            <span class="stat-item__label">Urgent Findings</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-item__icon stat-item__icon--success">
                            <v-icon name="hi-sparkles" />
                        </div>
                        <div class="stat-item__content">
                            <span class="stat-item__value">{{ aiSummariesCount() }}</span>
                            <span class="stat-item__label">AI Summaries</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Controls Card -->
            <div class="bento-card bento-card--controls">
                <div class="controls-header">
                    <h3 class="controls-title">
                        <v-icon name="hi-collection" />
                        Your Checkups
                    </h3>
                    <div class="sort-control">
                        <v-icon name="hi-sort-descending" />
                        <select v-model="sortOrder" @change="fetchHistory">
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Loading State -->
            <div v-if="isLoading" class="bento-card bento-card--loading">
                <div class="loading-spinner"></div>
                <p>Loading your checkups...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="historyData.checkups && historyData.checkups.length === 0" class="bento-card bento-card--empty">
                <div class="empty-illustration">
                    <div class="empty-illustration__circle">
                        <v-icon name="hi-clipboard-list" />
                    </div>
                </div>
                <h3 class="empty-title">No Checkups Yet</h3>
                <p class="empty-description">Start your first AI health checkup to see your results here</p>
                <button @click="goBack" class="empty-action">
                    <v-icon name="hi-plus" />
                    Start New Checkup
                </button>
            </div>

            <!-- Checkup List -->
            <div v-else-if="historyData.checkups && historyData.checkups.length > 0" class="bento-card bento-card--list">
            <div
                v-for="checkup in historyData.checkups"
                :key="checkup._id"
                class="checkup-card"
                :class="{ 'checkup-card--has-summary': checkup.claude_summary }"
            >
                <!-- Card Header -->
                <div class="checkup-card__header">
                    <div class="checkup-card__date">
                        <div class="date-icon">
                            <v-icon name="hi-calendar" />
                        </div>
                        <span class="date-text">{{ formatDate(checkup.created_at) }}</span>
                    </div>
                    <div class="checkup-card__actions">
                        <div class="checkup-card__badges">
                            <span class="status-badge" :class="getStatusClass(checkup)">
                                <v-icon :name="getStatusClass(checkup) === 'status-completed' ? 'hi-check-circle' : 'hi-clock'" />
                                {{ getStatusText(checkup) }}
                            </span>
                            <span v-if="checkup.claude_summary" class="ai-badge">
                                <v-icon name="fa-robot" />
                                AI Summary
                            </span>
                        </div>
                        <button
                            class="delete-btn"
                            @click.stop="confirmDelete(checkup)"
                            title="Delete checkup"
                        >
                            <v-icon name="hi-x" />
                        </button>
                    </div>
                </div>

                <!-- Card Body -->
                <div class="checkup-card__body" @click="viewCheckupDetails(checkup)">
                    <div class="checkup-card__info">
                        <div class="info-row">
                            <span class="info-label">Patient</span>
                            <span class="info-value">{{ getPatientName(checkup) }}</span>
                        </div>
                        <div v-if="checkup.response?.data?.conditions?.length" class="info-row">
                            <span class="info-label">Conditions Found</span>
                            <span class="info-value info-value--conditions">{{ getTopConditions(checkup) }}</span>
                        </div>
                        <div v-if="checkup.response?.data?.triage_level" class="info-row">
                            <span class="info-label">Triage Level</span>
                            <span class="triage-badge" :class="'triage-' + checkup.response.data.triage_level">
                                {{ formatTriageLevel(checkup.response.data.triage_level) }}
                            </span>
                        </div>
                    </div>
                    <div class="checkup-card__actions-row">
                        <div class="checkup-card__action" @click.stop="viewCheckupDetails(checkup)">
                            <span class="action-text">View Details</span>
                            <v-icon name="hi-arrow-right" class="action-arrow" />
                        </div>
                        <button
                            v-if="hasCompletedDiagnosis(checkup) && hasActiveAppointment(checkup)"
                            class="book-appointment-btn view-consultation-btn"
                            @click.stop="viewAppointment(checkup)"
                        >
                            <v-icon name="hi-video-camera" scale="0.85" />
                            <span>View Consultation</span>
                        </button>
                        <button
                            v-else-if="hasCompletedDiagnosis(checkup)"
                            class="book-appointment-btn"
                            @click.stop="bookAppointmentFromCheckup(checkup)"
                        >
                            <v-icon name="hi-calendar" scale="0.85" />
                            <span>Book Appointment</span>
                        </button>
                    </div>
                </div>

                <!-- AI Summary Action -->
                <div v-if="hasCompletedDiagnosis(checkup) && !checkup.claude_summary" class="checkup-card__footer">
                    <div class="ai-prompt">
                        <div class="ai-prompt__icon">
                            <v-icon name="fa-stethoscope" />
                        </div>
                        <div class="ai-prompt__content">
                            <span class="ai-prompt__title">Get AI Health Summary</span>
                            <span class="ai-prompt__credits">
                                {{ getTotalCredits() > 0 ? `${getTotalCredits()} credits available` : 'Credits needed' }}
                            </span>
                        </div>
                        <button
                            class="ai-prompt__btn"
                            @click.stop="handleGenerateSummary(checkup)"
                            :disabled="generatingForCheckup === checkup._id"
                        >
                            <span v-if="generatingForCheckup !== checkup._id">Generate</span>
                            <span v-else class="btn-loading">
                                <span class="spinner-small"></span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            </div>

            <!-- Pagination -->
            <div v-if="historyData.pagination && historyData.pagination.total_pages > 1" class="bento-card bento-card--pagination">
            <button
                @click="changePage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="pagination-btn pagination-btn--prev"
            >
                <v-icon name="hi-chevron-left" />
                <span>Previous</span>
            </button>

            <div class="pagination-info">
                <span class="pagination-current">{{ currentPage }}</span>
                <span class="pagination-separator">/</span>
                <span class="pagination-total">{{ historyData.pagination?.total_pages || 1 }}</span>
            </div>

            <button
                @click="changePage(currentPage + 1)"
                :disabled="currentPage === (historyData.pagination?.total_pages || 1)"
                class="pagination-btn pagination-btn--next"
            >
                <span>Next</span>
                <v-icon name="hi-chevron-right" />
            </button>
            </div>
        </section>

        <!-- Purchase Modal -->
        <div v-if="showPurchaseModal" class="purchase-modal-overlay" @click.self="closePurchaseModal">
            <div class="purchase-modal">
                <!-- Header -->
                <div class="purchase-modal__header" :class="{ 'confirm-mode': selectedPlanForPurchase }">
                    <div class="header-content">
                        <div class="header-icon">
                            <v-icon :name="selectedPlanForPurchase ? 'hi-shield-check' : 'fa-stethoscope'" />
                        </div>
                        <div class="header-text">
                            <h3>{{ selectedPlanForPurchase ? 'Confirm Your Purchase' : 'AI Health Summary Credits' }}</h3>
                            <p>{{ selectedPlanForPurchase ? 'Review your purchase details below' : 'Get personalized AI-powered health insights' }}</p>
                        </div>
                    </div>
                    <button @click="closePurchaseModal" class="purchase-modal__close">
                        <v-icon name="hi-x" />
                    </button>
                </div>

                <div class="purchase-modal__body">
                    <!-- Wallet Balance Card -->
                    <div class="wallet-card">
                        <div class="wallet-card__icon">
                            <v-icon name="bi-wallet2" />
                        </div>
                        <div class="wallet-card__info">
                            <span class="wallet-label">Your Wallet Balance</span>
                            <span class="wallet-amount">₦{{ walletBalance.toLocaleString() }}</span>
                        </div>
                    </div>

                    <!-- Confirmation View -->
                    <div v-if="selectedPlanForPurchase" class="confirmation-section">
                        <!-- Selected Plan Card -->
                        <div class="selected-plan-card">
                            <div class="plan-icon" :class="{ 'unlimited': !selectedPlanForPurchase.credits }">
                                <v-icon :name="selectedPlanForPurchase.credits ? 'hi-sparkles' : 'hi-lightning-bolt'" />
                            </div>
                            <div class="plan-info">
                                <h4>{{ selectedPlanForPurchase.name }}</h4>
                                <p v-if="selectedPlanForPurchase.credits">
                                    <strong>{{ selectedPlanForPurchase.credits }}</strong> AI Health Summary credits
                                </p>
                                <p v-else>
                                    <strong>Unlimited</strong> access for {{ selectedPlanForPurchase.duration_days }} days
                                </p>
                            </div>
                        </div>

                        <!-- Transaction Summary -->
                        <div class="transaction-summary">
                            <div class="summary-row">
                                <span class="label">Plan Price</span>
                                <span class="value">₦{{ selectedPlanForPurchase.price.toLocaleString() }}</span>
                            </div>
                            <div class="summary-row">
                                <span class="label">Current Balance</span>
                                <span class="value">₦{{ walletBalance.toLocaleString() }}</span>
                            </div>
                            <div class="summary-row total" :class="{ 'insufficient': walletBalance < selectedPlanForPurchase.price }">
                                <span class="label">Balance After Purchase</span>
                                <span class="value">₦{{ Math.max(0, walletBalance - selectedPlanForPurchase.price).toLocaleString() }}</span>
                            </div>
                        </div>

                        <!-- Insufficient Balance Warning -->
                        <div v-if="walletBalance < selectedPlanForPurchase.price" class="insufficient-alert">
                            <v-icon name="hi-exclamation" />
                            <div class="alert-content">
                                <strong>Insufficient Balance</strong>
                                <p>You need ₦{{ (selectedPlanForPurchase.price - walletBalance).toLocaleString() }} more. Please top up your wallet to continue.</p>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="confirmation-actions">
                            <button class="action-btn secondary" @click="selectedPlanForPurchase = null">
                                <v-icon name="hi-arrow-left" />
                                Back to Plans
                            </button>
                            <button
                                class="action-btn primary"
                                :class="{ 'loading': purchaseLoading }"
                                :disabled="purchaseLoading || walletBalance < selectedPlanForPurchase.price"
                                @click="confirmPurchase"
                            >
                                <span v-if="!purchaseLoading">
                                    <v-icon name="hi-check-circle" />
                                    Confirm Purchase
                                </span>
                                <span v-else class="loading-state">
                                    <span class="spinner"></span>
                                    Processing...
                                </span>
                            </button>
                        </div>
                    </div>

                    <!-- Plan Selection View -->
                    <div v-else class="plans-section">
                        <p class="section-description">
                            Select a plan below to unlock AI-powered analysis of your health checkups
                        </p>

                        <div v-if="loadingPlans" class="loading-container">
                            <div class="loading-spinner"></div>
                            <p>Loading available plans...</p>
                        </div>

                        <div v-else class="plans-grid">
                            <div
                                v-for="plan in availablePlans"
                                :key="plan._id"
                                class="plan-card"
                                :class="{ 'unlimited': !plan.credits, 'popular': plan.credits === 5 }"
                                @click="selectPlanForPurchase(plan)"
                            >
                                <div v-if="plan.credits === 5" class="popular-tag">Popular</div>
                                <div class="plan-card__header">
                                    <div class="plan-card__icon" :class="{ 'unlimited': !plan.credits }">
                                        <v-icon :name="plan.credits ? 'hi-sparkles' : 'hi-lightning-bolt'" />
                                    </div>
                                    <span v-if="!plan.credits" class="unlimited-badge">UNLIMITED</span>
                                </div>
                                <h4 class="plan-card__name">{{ plan.name }}</h4>
                                <div class="plan-card__price">
                                    <span class="currency">₦</span>
                                    <span class="amount">{{ plan.price.toLocaleString() }}</span>
                                </div>
                                <p class="plan-card__details">
                                    <span v-if="plan.credits">{{ plan.credits }} health summary credits</span>
                                    <span v-else>{{ plan.duration_days }} days unlimited access</span>
                                </p>
                                <button class="plan-card__btn">
                                    Select Plan
                                    <v-icon name="hi-arrow-right" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="delete-modal-overlay" @click.self="closeDeleteModal">
            <div class="delete-modal">
                <div class="delete-modal__icon">
                    <v-icon name="hi-exclamation-circle" />
                </div>
                <h3 class="delete-modal__title">Delete Health Checkup?</h3>
                <p class="delete-modal__message">
                    This will permanently delete this health checkup and its results. This action cannot be undone.
                </p>
                <div v-if="checkupToDelete" class="delete-modal__info">
                    <span class="info-date">{{ formatDate(checkupToDelete.created_at) }}</span>
                    <span v-if="checkupToDelete.response?.data?.conditions?.length" class="info-conditions">
                        {{ getTopConditions(checkupToDelete) }}
                    </span>
                </div>
                <div class="delete-modal__actions">
                    <button class="cancel-btn" @click="closeDeleteModal" :disabled="deleteLoading">
                        Cancel
                    </button>
                    <button class="confirm-delete-btn" @click="deleteCheckup" :disabled="deleteLoading">
                        <span v-if="!deleteLoading">Delete</span>
                        <span v-else class="btn-loading">
                            <span class="spinner-small"></span>
                        </span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, inject, onMounted, computed } from "vue";
import { useToast } from 'vue-toast-notification';
import { useRouter } from 'vue-router';

const $toast = useToast();
const router = useRouter();
const $http = inject("$http");
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const diagnosisInject = inject('$_DIAGNOSIS', null);
const recommendationInject = inject('$_RECOMMENDATION', null);
const linkedCheckupInject = inject('$_LINKED_CHECKUP', null);

// Local refs for linked checkup/appointment (for reactivity in template)
const linkedCheckupId = computed(() => linkedCheckupInject?.linkedCheckupId?.value || null);
const linkedAppointmentId = computed(() => linkedCheckupInject?.linkedAppointmentId?.value || null);

const isLoading = ref(false);
const currentPage = ref(1);
const sortOrder = ref('desc');
const showDeleteModal = ref(false);
const checkupToDelete = ref(null);
const deleteLoading = ref(false);
const historyData = ref({
    checkups: [],
    pagination: {
        current_page: 1,
        total_pages: 1,
        total_count: 0,
        per_page: 10
    }
});

const fetchHistory = async () => {
    isLoading.value = true;
    try {
        const params = {
            page: currentPage.value,
            limit: 10,
            sortBy: 'created_at',
            sortOrder: sortOrder.value
        };

        const response = await $http.$_getHealthCheckupHistory(params);

        if (response && response.data && response.data.data) {
            historyData.value = response.data.data;
        } else {
            console.error('Invalid response structure:', response);
            historyData.value = {
                checkups: [],
                pagination: {
                    current_page: 1,
                    total_pages: 1,
                    total_count: 0,
                    per_page: 10
                }
            };
        }
    } catch (error) {
        $toast.error('Failed to load checkup history', { duration: 3000 });
        console.error('Error fetching history:', error);
        historyData.value = {
            checkups: [],
            pagination: {
                current_page: 1,
                total_pages: 1,
                total_count: 0,
                per_page: 10
            }
        };
    } finally {
        isLoading.value = false;

        // Auto-view linked checkup if provided (e.g., from appointment detail page)
        if (linkedCheckupId.value) {
            const linkedCheckup = historyData.value.checkups?.find(c => c._id === linkedCheckupId.value);
            if (linkedCheckup) {
                // Small delay to ensure UI is rendered
                setTimeout(() => {
                    viewCheckupDetails(linkedCheckup);
                }, 300);
            }
        }
    }
};

const changePage = (page) => {
    if (page >= 1 && page <= historyData.value.pagination.total_pages) {
        currentPage.value = page;
        fetchHistory();
    }
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatTriageLevel = (level) => {
    const levels = {
        'emergency': 'Emergency',
        'emergency_ambulance': 'Emergency',
        'consultation_24': 'Urgent (24h)',
        'consultation': 'Consultation',
        'self_care': 'Self Care'
    };
    return levels[level] || level;
};

const getStatusClass = (checkup) => {
    if (checkup.response && checkup.response.data && checkup.response.data.conditions) {
        return 'status-completed';
    }
    return 'status-incomplete';
};

const getStatusText = (checkup) => {
    if (checkup.response && checkup.response.data && checkup.response.data.conditions) {
        return 'Completed';
    }
    return 'Incomplete';
};

const getPatientName = (checkup) => {
    switch (checkup.health_check_for) {
        case 'Self':
            return 'Myself';
        case 'Dependant':
            return checkup.checkup_owner_id?.first_name || 'Dependant';
        case 'Third Party':
            return 'Someone else';
        default:
            return 'Unknown';
    }
};

const getTopConditions = (checkup) => {
    if (!checkup.response?.data?.conditions?.length) return 'No conditions';

    const topConditions = checkup.response.data.conditions
        .slice(0, 2)
        .map(condition => condition.common_name || condition.name);

    if (checkup.response.data.conditions.length > 2) {
        return `${topConditions.join(', ')} +${checkup.response.data.conditions.length - 2} more`;
    }

    return topConditions.join(', ');
};

const hasCompletedDiagnosis = (checkup) => {
    return checkup.response &&
           checkup.response.data &&
           checkup.response.data.conditions &&
           checkup.response.data.conditions.length > 0;
};

const goBack = () => {
    const { current } = navigator.value;
    useNavigator({ current, from: current, to: 0 });
};

// Delete Functions
const confirmDelete = (checkup) => {
    checkupToDelete.value = checkup;
    showDeleteModal.value = true;
};

const closeDeleteModal = () => {
    showDeleteModal.value = false;
    checkupToDelete.value = null;
    deleteLoading.value = false;
};

const deleteCheckup = async () => {
    if (!checkupToDelete.value) return;

    deleteLoading.value = true;
    try {
        const response = await $http.$_deleteHealthCheckup(checkupToDelete.value._id);
        if (response?.data) {
            $toast.success('Health checkup deleted successfully', { duration: 3000 });
            // Remove from local list
            historyData.value.checkups = historyData.value.checkups.filter(
                c => c._id !== checkupToDelete.value._id
            );
            // Update pagination count
            if (historyData.value.pagination) {
                historyData.value.pagination.total_count--;
            }
            closeDeleteModal();
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to delete checkup';
        $toast.error(errorMessage, { duration: 3000 });
    } finally {
        deleteLoading.value = false;
    }
};

// Credit and Purchase States
const creditStatus = ref(null);
const availablePlans = ref([]);
const showPurchaseModal = ref(false);
const loadingPlans = ref(false);
const purchaseLoading = ref(false);
const generatingForCheckup = ref(null);
const pendingCheckupForSummary = ref(null);
const walletBalance = ref(0);
const selectedPlanForPurchase = ref(null);

// Credit Functions
const fetchCreditStatus = async () => {
    try {
        const response = await $http.$_getClaudeSummaryCredits();
        if (response?.data?.data) {
            creditStatus.value = response.data.data;
        }
    } catch (error) {
        console.error('Error fetching credit status:', error);
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

const fetchPlans = async () => {
    loadingPlans.value = true;
    try {
        const response = await $http.$_getClaudeSummaryPlans();
        if (response?.data?.data) {
            availablePlans.value = response.data.data;
        }
    } catch (error) {
        console.error('Error fetching plans:', error);
    } finally {
        loadingPlans.value = false;
    }
};

const getTotalCredits = () => {
    if (!creditStatus.value) return 0;
    if (creditStatus.value.has_unlimited_subscription) return 999;
    return (creditStatus.value.free_credits_remaining || 0) +
           (creditStatus.value.purchased_credits || 0) +
           (creditStatus.value.gifted_credits || 0);
};

// Stats computed properties
const totalCheckups = () => {
    return historyData.value.pagination?.total_count || 0;
};

const lastCheckupDate = () => {
    if (!historyData.value.checkups || historyData.value.checkups.length === 0) return null;
    // If sorted by newest first, the first item is the most recent
    const checkups = [...historyData.value.checkups];
    checkups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return checkups[0]?.created_at;
};

const getTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
};

const urgentCheckupsCount = () => {
    if (!historyData.value.checkups) return 0;
    return historyData.value.checkups.filter(c => {
        const triage = c.response?.data?.triage_level;
        return triage === 'emergency' ||
               triage === 'emergency_ambulance' ||
               triage === 'consultation_24' ||
               triage === 'consultation';
    }).length;
};

const aiSummariesCount = () => {
    if (!historyData.value.checkups) return 0;
    return historyData.value.checkups.filter(c => c.claude_summary).length;
};

const handleGenerateSummary = async (checkup) => {
    await fetchCreditStatus();

    if (getTotalCredits() <= 0) {
        pendingCheckupForSummary.value = checkup;
        await Promise.all([fetchPlans(), fetchWalletBalance()]);
        showPurchaseModal.value = true;
        return;
    }

    await generateSummaryForCheckup(checkup);
};

const generateSummaryForCheckup = async (checkup) => {
    generatingForCheckup.value = checkup._id;
    try {
        const response = await $http.$_generateClaudeSummary(checkup._id);
        if (response?.data?.data) {
            $toast.success('AI Health Summary generated successfully!', { duration: 3000 });
            const index = historyData.value.checkups.findIndex(c => c._id === checkup._id);
            if (index !== -1) {
                historyData.value.checkups[index].claude_summary = response.data.data;
            }
            await fetchCreditStatus();
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Failed to generate summary';
        $toast.error(errorMessage, { duration: 3000 });

        if (error.response?.data?.purchase_required) {
            pendingCheckupForSummary.value = checkup;
            await Promise.all([fetchPlans(), fetchWalletBalance()]);
            showPurchaseModal.value = true;
        }
    } finally {
        generatingForCheckup.value = null;
    }
};

const closePurchaseModal = () => {
    showPurchaseModal.value = false;
    pendingCheckupForSummary.value = null;
    selectedPlanForPurchase.value = null;
};

const selectPlanForPurchase = (plan) => {
    selectedPlanForPurchase.value = plan;
};

const confirmPurchase = async () => {
    if (!selectedPlanForPurchase.value) return;

    purchaseLoading.value = true;
    try {
        const response = await $http.$_purchaseClaudeSummaryPlan(selectedPlanForPurchase.value._id);
        if (response?.data?.data?.success) {
            $toast.success('Purchase successful! Check your email for confirmation.', { duration: 4000 });
            closePurchaseModal();
            await fetchCreditStatus();

            if (pendingCheckupForSummary.value) {
                await generateSummaryForCheckup(pendingCheckupForSummary.value);
            }
        }
    } catch (error) {
        const errorMessage = error.response?.data?.message || 'Purchase failed. Please try again.';
        $toast.error(errorMessage, { duration: 3000 });
    } finally {
        purchaseLoading.value = false;
    }
};

const viewCheckupDetails = (checkup) => {
    if (checkup.response && checkup.response.data) {
        if (diagnosisInject && diagnosisInject.useDiagnosis) {
            const savedDuration = checkup.interview_duration;
            const fallbackDuration = savedDuration || (new Date(checkup.updated_at) - new Date(checkup.created_at));
            const consideredDiagnosesCount = checkup.considered_diagnoses || checkup.request?.evidence?.length || 0;

            diagnosisInject.useDiagnosis({
                conditions: checkup.response.data.conditions || [],
                interview_token: checkup.response.data.interview_token || checkup.request?.interview_token || '',
                evidence: checkup.request?.evidence || [],
                questions: checkup.response.data.question ? [checkup.response.data.question] : []
            });

            if (recommendationInject && recommendationInject.useRecommendation) {
                recommendationInject.useRecommendation({
                    diagnosis: {
                        conditions: checkup.response.data.conditions || [],
                        interview_token: checkup.response.data.interview_token || checkup.request?.interview_token || '',
                        evidence: checkup.request?.evidence || [],
                        questions: checkup.response.data.question ? [checkup.response.data.question] : [],
                        triage_level: checkup.response.data.triage_level || null,
                        triage: checkup.response.data.triage || null,
                        has_emergency_evidence: checkup.response.data.has_emergency_evidence || false
                    },
                    checkup_id: checkup._id,
                    duration: fallbackDuration,
                    considered_diagnoses_count: consideredDiagnosesCount,
                    checkup_date: checkup.created_at,
                    patient_info: {
                        age: checkup.request?.age?.value || 'Unknown',
                        sex: checkup.request?.sex || 'Unknown',
                        health_check_for: checkup.health_check_for
                    },
                    is_from_history: true,
                    linked_appointment: checkup.linked_appointment || null
                });
            }

            const { current } = navigator.value;
            useNavigator({ current, from: current, to: 9 });
        } else {
            $toast.error('Unable to view checkup details. Please refresh the page.', { duration: 3000 });
        }
    } else {
        $toast.warning('This checkup has no diagnosis data', { duration: 3000 });
    }
};

// Check if checkup has an active (upcoming or ongoing) linked appointment
const hasActiveAppointment = (checkup) => {
    if (!checkup.linked_appointment) return false;

    const appointment = checkup.linked_appointment;
    const status = appointment.status?.toUpperCase();

    // Show "View Consultation" for OPEN appointments or appointments with future start_time
    if (status === 'OPEN' || status === 'ONGOING') {
        return true;
    }

    // Also check if appointment date is in the future
    if (appointment.start_time) {
        const appointmentDate = new Date(appointment.start_time);
        return appointmentDate > new Date();
    }

    return false;
};

// Navigate to the appointment linked to this checkup
const viewAppointment = (checkup) => {
    if (checkup.linked_appointment?._id) {
        router.push({
            name: 'Appointmentsv2Detail',
            params: { id: checkup.linked_appointment._id }
        });
    }
};

// Book appointment from a specific health checkup
const bookAppointmentFromCheckup = (checkup) => {
    if (!checkup || !checkup.response?.data) {
        $toast.error('Unable to link checkup data', { duration: 3000 });
        return;
    }

    // Prepare health checkup data for booking
    // Symptoms are stored in request.evidence with 'label' as the name field
    const symptoms = (checkup.request?.evidence || [])
        .filter(s => s.choice_id === 'present' && s.id?.startsWith('s_'))
        .map(s => s.label || s.common_name || s.name);

    const conditions = (checkup.response.data.conditions || []).map(c => ({
        name: c.common_name || c.name,
        probability: c.probability || 0,
        triage_level: c.triage_level,
    }));

    // Generate patient note
    const patientNote = generatePatientNoteForBooking(checkup);

    // Store in sessionStorage for booking wizard
    const bookingData = {
        checkup_id: checkup._id,
        conditions: conditions,
        triage_level: checkup.response.data.triage_level || '',
        symptoms: symptoms,
        interview_summary: [],
        assessment_date: checkup.created_at,
        patient_note: patientNote,
    };

    sessionStorage.setItem('healthCheckForBooking', JSON.stringify(bookingData));

    // Navigate to booking wizard with flag
    router.push({
        path: '/app/book-appointment-v2',
        query: { from_health_check: 'true' }
    });

    $toast.success('Health checkup linked! Complete your booking.', { duration: 3000 });
};

// Generate patient note from checkup for booking
const generatePatientNoteForBooking = (checkup) => {
    const parts = [];
    const response = checkup.response?.data || {};

    // Add assessment date
    if (checkup.created_at) {
        const date = new Date(checkup.created_at);
        const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        parts.push(`AI Health Assessment completed on ${dateStr}.`);
    }

    // Add symptoms (stored in request.evidence with 'label' as the name field)
    const symptoms = (checkup.request?.evidence || [])
        .filter(s => s.choice_id === 'present' && s.id?.startsWith('s_'))
        .map(s => s.label || s.common_name || s.name)
        .slice(0, 5);
    if (symptoms.length > 0) {
        parts.push(`Reported symptoms: ${symptoms.join(', ')}.`);
    }

    // Add top conditions
    const conditions = response.conditions || [];
    if (conditions.length > 0) {
        const topConditions = conditions.slice(0, 3).map(c => {
            const probability = Math.round((c.probability || 0) * 100);
            return `${c.common_name || c.name} (${probability}%)`;
        });
        parts.push(`Possible conditions: ${topConditions.join(', ')}.`);
    }

    // Add triage level
    if (response.triage_level) {
        const triageLabels = {
            'emergency': 'Emergency care recommended',
            'emergency_ambulance': 'Emergency - Ambulance recommended',
            'consultation_24': 'Doctor visit within 24 hours recommended',
            'consultation': 'Medical consultation recommended',
            'self_care': 'Self-care may be appropriate',
        };
        parts.push(triageLabels[response.triage_level.toLowerCase()] || `Triage: ${response.triage_level}`);
    }

    return parts.join('\n\n');
};

onMounted(() => {
    console.log('checkup-history mounted, linked values:', {
        linkedCheckupId: linkedCheckupId.value,
        linkedAppointmentId: linkedAppointmentId.value
    });
    fetchHistory();
    fetchCreditStatus();
});
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
$light-gray: #94A3B8;
$bg: #F8FAFC;
$white: #FFFFFF;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$violet: #8B5CF6;
$violet-light: #EDE9FE;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;

.checkup-history {
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 0 48px;
    display: flex;
    flex-direction: column;
    gap: 24px;

    @media (max-width: 768px) {
        padding: 0 16px 32px;
        gap: 20px;
    }
}

// ============================================
// HERO SECTION - Split Layout
// ============================================
.hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    padding: 40px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
    border-radius: 28px;
    position: relative;
    overflow: hidden;
    box-shadow:
        0 20px 60px rgba(2, 136, 209, 0.3),
        0 0 0 1px rgba(255, 255, 255, 0.1) inset;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        padding: 32px 24px;
        gap: 24px;
        text-align: center;
    }

    &__content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        z-index: 2;
    }

    &__back {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border: none;
        border-radius: 12px;
        color: white;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.25s ease;
        width: fit-content;
        margin-bottom: 20px;

        @media (max-width: 768px) {
            margin: 0 auto 16px;
        }

        svg {
            width: 18px;
            height: 18px;
        }

        &:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: translateX(-4px);
        }
    }

    &__badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        width: fit-content;
        margin-bottom: 20px;
        position: relative;

        @media (max-width: 768px) {
            margin: 0 auto 16px;
        }

        .badge-pulse {
            position: absolute;
            left: 12px;
            width: 8px;
            height: 8px;
            background: $emerald;
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
        }

        svg {
            width: 16px;
            height: 16px;
            color: white;
            margin-left: 12px;
        }

        span {
            font-size: 13px;
            font-weight: 600;
            color: white;
            letter-spacing: 0.3px;
        }
    }

    &__title {
        font-size: 48px;
        font-weight: 800;
        color: white;
        line-height: 1.1;
        margin: 0 0 16px;
        letter-spacing: -1px;

        @media (max-width: 768px) {
            font-size: 36px;
        }

        &-accent {
            background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
    }

    &__subtitle {
        font-size: 16px;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.6;
        margin: 0;
        max-width: 380px;

        @media (max-width: 768px) {
            font-size: 15px;
            max-width: 100%;
        }
    }

    &__visual {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;

        @media (max-width: 768px) {
            display: none;
        }
    }
}

// History Orb Animation
.history-orb {
    position: relative;
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.orb-ring {
    position: absolute;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.2);

    &--1 {
        width: 100%;
        height: 100%;
        animation: spin-slow 20s linear infinite;
    }

    &--2 {
        width: 75%;
        height: 75%;
        animation: spin-slow 15s linear infinite reverse;
        border-style: dashed;
    }
}

.orb-core {
    width: 100px;
    height: 100px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
        0 0 40px rgba(255, 255, 255, 0.3),
        0 0 80px rgba(79, 195, 247, 0.3);
    animation: pulse-glow 3s ease-in-out infinite;

    svg {
        width: 48px;
        height: 48px;
        color: white;
    }
}

// ============================================
// BENTO GRID
// ============================================
.bento-grid {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.bento-card {
    background: $white;
    border-radius: 20px;
    border: 1px solid rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;

    &:hover {
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    }

    // Stats Card
    &--stats {
        padding: 24px;
        background: linear-gradient(135deg, $white 0%, $sky-light 100%);
    }

    // Controls Card
    &--controls {
        padding: 20px 24px;
    }

    // List Card
    &--list {
        padding: 0;
        overflow: hidden;
    }

    // Loading Card
    &--loading {
        padding: 60px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;

        p {
            color: $gray;
            font-size: 15px;
            margin: 0;
        }
    }

    // Empty Card
    &--empty {
        padding: 60px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

    // Pagination Card
    &--pagination {
        padding: 16px 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
    }
}

// Stats Grid
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;

    @media (max-width: 900px) {
        grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 480px) {
        grid-template-columns: 1fr;
    }
}

.stat-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: $white;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

    &__icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        svg {
            width: 24px;
            height: 24px;
        }

        &--primary {
            background: linear-gradient(135deg, $sky-light 0%, lighten($sky-light, 3%) 100%);
            svg { color: $sky-dark; }
        }

        &--info {
            background: linear-gradient(135deg, $violet-light 0%, lighten($violet-light, 3%) 100%);
            svg { color: $violet; }
        }

        &--warning {
            background: linear-gradient(135deg, $amber-light 0%, lighten($amber-light, 3%) 100%);
            svg { color: $amber; }
        }

        &--success {
            background: linear-gradient(135deg, $emerald-light 0%, lighten($emerald-light, 3%) 100%);
            svg { color: $emerald; }
        }
    }

    &__content {
        display: flex;
        flex-direction: column;
    }

    &__value {
        font-size: 22px;
        font-weight: 700;
        color: $navy;
        line-height: 1.2;
    }

    &__label {
        font-size: 13px;
        color: $gray;
        margin-top: 2px;
    }
}

// Controls Header
.controls-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;

    @media (max-width: 480px) {
        flex-direction: column;
        align-items: stretch;
    }
}

.controls-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    margin: 0;

    svg {
        width: 22px;
        height: 22px;
        color: $sky;
    }
}

.sort-control {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: $bg;
    border-radius: 10px;

    svg {
        width: 18px;
        height: 18px;
        color: $gray;
    }

    select {
        background: transparent;
        border: none;
        font-size: 14px;
        font-weight: 500;
        color: $slate;
        cursor: pointer;
        outline: none;

        &:focus {
            outline: none;
        }
    }
}

// Empty State
.empty-illustration {
    margin-bottom: 20px;

    &__circle {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, $sky-light 0%, #B3E5FC 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        svg {
            width: 40px;
            height: 40px;
            color: $sky-dark;
        }
    }
}

.empty-title {
    font-size: 20px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 8px;
}

.empty-description {
    font-size: 15px;
    color: $gray;
    margin: 0 0 24px;
    max-width: 300px;
}

.empty-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border: none;
    border-radius: 12px;
    color: white;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 4px 16px rgba(79, 195, 247, 0.3);

    svg {
        width: 18px;
        height: 18px;
    }

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(79, 195, 247, 0.4);
    }
}

// Loading Spinner
.loading-spinner {
    width: 48px;
    height: 48px;
    border: 3px solid $sky-light;
    border-top-color: $sky;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

// Pagination
.pagination-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: $bg;
    border: 1px solid rgba(0, 0, 0, 0.06);
    border-radius: 10px;
    color: $slate;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;

    svg {
        width: 16px;
        height: 16px;
    }

    &:hover:not(:disabled) {
        background: $sky-light;
        border-color: $sky;
        color: $sky-dark;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
}

.pagination-info {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: $gray;
}

.pagination-current {
    font-weight: 600;
    color: $sky-dark;
}

// ============================================
// ANIMATIONS
// ============================================
@keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
    50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}

@keyframes spin-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

// Checkup Card
.checkup-card {
    background: white;
    border: 2px solid $color-g-92;
    border-radius: $size-20;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
        border-color: rgba(79, 195, 247, 0.4);
        box-shadow: 0 8px 32px rgba(79, 195, 247, 0.1);

        .checkup-card__body {
            .action-arrow {
                transform: translateX(4px);
                color: #4FC3F7;
            }
        }
    }

    &--has-summary {
        border-color: rgba(16, 185, 129, 0.3);
        background: linear-gradient(135deg, #fafffd 0%, white 100%);
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $size-18 $size-24;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        border-bottom: 1px solid $color-g-92;

        @include responsive(phone) {
            flex-direction: column;
            align-items: flex-start;
            gap: $size-12;
            padding: $size-16 $size-20;
        }
    }

    &__date {
        display: flex;
        align-items: center;
        gap: $size-10;

        .date-icon {
            width: 36px;
            height: 36px;
            background: white;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

            svg {
                width: 18px;
                height: 18px;
                color: #4FC3F7;
            }
        }

        .date-text {
            font-size: $size-14;
            font-weight: $fw-medium;
            color: $color-g-44;
        }
    }

    &__badges {
        display: flex;
        align-items: center;
        gap: $size-10;
        flex-wrap: wrap;
    }

    &__actions {
        display: flex;
        align-items: center;
        gap: $size-12;

        @include responsive(phone) {
            width: 100%;
            justify-content: space-between;
        }
    }

    &__body {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $size-24;
        cursor: pointer;
        transition: background 0.2s ease;

        @include responsive(phone) {
            padding: $size-20;
            flex-direction: column;
            align-items: flex-start;
            gap: $size-16;
        }

        &:hover {
            background: linear-gradient(135deg, #E1F5FE 0%, #B3E5FC 100%);
        }
    }

    &__info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: $size-12;

        @include responsive(phone) {
            width: 100%;
        }

        .info-row {
            display: flex;
            align-items: flex-start;
            gap: $size-12;

            @include responsive(phone) {
                flex-direction: column;
                gap: $size-4;
            }
        }

        .info-label {
            font-size: $size-13;
            font-weight: $fw-medium;
            color: $color-g-54;
            min-width: 120px;

            @include responsive(phone) {
                min-width: auto;
            }
        }

        .info-value {
            font-size: $size-14;
            font-weight: $fw-semi-bold;
            color: $color-black;

            &--conditions {
                font-weight: $fw-medium;
                color: $color-g-44;
            }
        }
    }

    &__actions-row {
        display: flex;
        align-items: center;
        gap: $size-16;
        flex-shrink: 0;

        @include responsive(phone) {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            padding-top: $size-12;
            border-top: 1px dashed $color-g-90;
            gap: $size-12;
        }
    }

    &__action {
        display: flex;
        align-items: center;
        gap: $size-10;
        flex-shrink: 0;
        cursor: pointer;
        padding: $size-8 $size-12;
        border-radius: 8px;
        transition: background 0.2s ease;

        &:hover {
            background: rgba(79, 195, 247, 0.1);
        }

        @include responsive(phone) {
            justify-content: center;
        }

        .action-text {
            font-size: $size-14;
            font-weight: $fw-semi-bold;
            color: #4FC3F7;
        }

        .action-arrow {
            width: 20px;
            height: 20px;
            color: $gray;
            transition: all 0.3s ease;
        }
    }

    .book-appointment-btn {
        display: flex;
        align-items: center;
        gap: $size-8;
        padding: $size-10 $size-18;
        background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: $size-13;
        font-weight: $fw-semi-bold;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);

        svg {
            width: 18px;
            height: 18px;
        }

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(79, 195, 247, 0.4);
        }

        &:active {
            transform: translateY(0);
        }

        @include responsive(phone) {
            width: 100%;
            justify-content: center;
            padding: $size-12 $size-20;
        }

        &.view-consultation-btn {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

            &:hover {
                box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
            }
        }
    }

    &__footer {
        padding: $size-18 $size-24;
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        border-top: 2px dashed #a7f3d0;

        @include responsive(phone) {
            padding: $size-16 $size-20;
        }
    }
}

// Status & Triage Badges
.status-badge {
    display: inline-flex;
    align-items: center;
    gap: $size-6;
    padding: $size-6 $size-14;
    border-radius: $size-20;
    font-size: $size-12;
    font-weight: $fw-semi-bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    svg {
        width: 14px;
        height: 14px;
    }

    &.status-completed {
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        color: #047857;
    }

    &.status-incomplete {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        color: #92400e;
    }
}

.ai-badge {
    display: inline-flex;
    align-items: center;
    gap: $size-6;
    padding: $size-6 $size-14;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    border-radius: $size-20;
    font-size: $size-11;
    font-weight: $fw-bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);

    svg {
        width: 12px;
        height: 12px;
    }
}

.triage-badge {
    display: inline-flex;
    padding: $size-4 $size-12;
    border-radius: $size-6;
    font-size: $size-12;
    font-weight: $fw-semi-bold;

    &.triage-emergency,
    &.triage-emergency_ambulance {
        background: #fee2e2;
        color: #991b1b;
    }

    &.triage-consultation_24 {
        background: #fef3c7;
        color: #92400e;
    }

    &.triage-consultation {
        background: #dbeafe;
        color: #1e40af;
    }

    &.triage-self_care {
        background: #d1fae5;
        color: #047857;
    }
}

// AI Prompt
.ai-prompt {
    display: flex;
    align-items: center;
    gap: $size-16;

    @include responsive(phone) {
        flex-wrap: wrap;
    }

    &__icon {
        width: 44px;
        height: 44px;
        background: white;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        flex-shrink: 0;

        svg {
            width: 22px;
            height: 22px;
            color: #059669;
        }
    }

    &__content {
        flex: 1;
        min-width: 0;
    }

    &__title {
        display: block;
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        color: #047857;
        margin-bottom: $size-2;
    }

    &__credits {
        display: block;
        font-size: $size-13;
        color: #059669;
    }

    &__btn {
        padding: $size-12 $size-24;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        border: none;
        border-radius: $size-10;
        font-size: $size-14;
        font-weight: $fw-semi-bold;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 110px;
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);

        @include responsive(phone) {
            width: 100%;
            margin-top: $size-12;
        }

        &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
        }

        &:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }

        .btn-loading {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .spinner-small {
            width: 18px;
            height: 18px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
    }
}

// Animations
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

// Purchase Modal - Keep existing styles
.purchase-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: $size-16;
    animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.purchase-modal {
    background: white;
    border-radius: 20px;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    animation: slideUp 0.3s ease;

    &__header {
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        padding: $size-24;
        border-radius: 20px 20px 0 0;
        position: relative;

        &.confirm-mode {
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        }

        .header-content {
            display: flex;
            align-items: center;
            gap: $size-16;
        }

        .header-icon {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;

            svg {
                width: 24px;
                height: 24px;
                color: white;
            }
        }

        .header-text {
            flex: 1;

            h3 {
                margin: 0;
                font-size: $size-18;
                font-weight: $fw-bold;
                color: white;
            }

            p {
                margin: 4px 0 0;
                font-size: $size-13;
                color: rgba(255, 255, 255, 0.85);
            }
        }
    }

    &__close {
        position: absolute;
        top: $size-16;
        right: $size-16;
        background: rgba(255, 255, 255, 0.15);
        border: none;
        padding: $size-8;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            background: rgba(255, 255, 255, 0.25);
        }

        svg {
            width: 20px;
            height: 20px;
            color: white;
        }
    }

    &__body {
        padding: $size-24;
    }
}

.wallet-card {
    display: flex;
    align-items: center;
    gap: $size-16;
    padding: $size-16 $size-20;
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 2px solid #7dd3fc;
    border-radius: 14px;
    margin-bottom: $size-24;

    &__icon {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);

        svg {
            width: 22px;
            height: 22px;
            color: white;
        }
    }

    &__info {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .wallet-label {
            font-size: $size-12;
            color: #64748b;
            font-weight: $fw-medium;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .wallet-amount {
            font-size: $size-22;
            font-weight: $fw-bold;
            color: #0369a1;
        }
    }
}

.plans-section {
    .section-description {
        text-align: center;
        color: $color-g-54;
        font-size: $size-14;
        line-height: 1.5;
        margin-bottom: $size-24;
    }

    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: $size-40;

        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid $color-g-90;
            border-top-color: $color-pri-main;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: $size-16;
        }

        p {
            color: $color-g-54;
            font-size: $size-14;
        }
    }
}

.plans-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $size-16;

    @include responsive(phone) {
        grid-template-columns: 1fr;
    }
}

.plan-card {
    position: relative;
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 16px;
    padding: $size-20;
    text-align: center;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover {
        border-color: $color-pri-main;
        transform: translateY(-4px);
        box-shadow: 0 12px 28px rgba(5, 150, 105, 0.15);
    }

    &.unlimited {
        background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
        border-color: #10b981;

        &:hover {
            box-shadow: 0 12px 28px rgba(16, 185, 129, 0.2);
        }
    }

    &.popular {
        border-color: $color-pri-main;
    }

    .popular-tag {
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        font-size: 10px;
        font-weight: $fw-bold;
        padding: 4px 12px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    &__header {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: $size-8;
        margin-bottom: $size-12;
    }

    &__icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.unlimited {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);

            svg {
                color: white;
            }
        }

        svg {
            width: 20px;
            height: 20px;
            color: #059669;
        }
    }

    .unlimited-badge {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        font-size: 9px;
        font-weight: $fw-bold;
        padding: 3px 8px;
        border-radius: 4px;
        letter-spacing: 0.5px;
    }

    &__name {
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        color: $color-black;
        margin: 0 0 $size-8 0;
    }

    &__price {
        margin-bottom: $size-8;

        .currency {
            font-size: $size-14;
            font-weight: $fw-semi-bold;
            color: $color-pri-main;
            vertical-align: top;
        }

        .amount {
            font-size: $size-28;
            font-weight: $fw-bold;
            color: $color-pri-main;
        }
    }

    &__details {
        font-size: $size-13;
        color: $color-g-54;
        margin: 0 0 $size-16 0;
    }

    &__btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: $size-8;
        padding: $size-12 $size-16;
        background: linear-gradient(135deg, #059669 0%, #047857 100%);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: $size-13;
        font-weight: $fw-semi-bold;
        cursor: pointer;
        transition: all 0.2s ease;

        svg {
            width: 16px;
            height: 16px;
            transition: transform 0.2s ease;
        }

        &:hover {
            box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);

            svg {
                transform: translateX(3px);
            }
        }
    }
}

.confirmation-section {
    .selected-plan-card {
        display: flex;
        align-items: center;
        gap: $size-16;
        padding: $size-20;
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 2px solid #22c55e;
        border-radius: 14px;
        margin-bottom: $size-20;

        .plan-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);

            &.unlimited {
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            }

            svg {
                width: 24px;
                height: 24px;
                color: white;
            }
        }

        .plan-info {
            h4 {
                margin: 0 0 4px 0;
                font-size: $size-16;
                font-weight: $fw-bold;
                color: #166534;
            }

            p {
                margin: 0;
                font-size: $size-14;
                color: #15803d;

                strong {
                    font-weight: $fw-bold;
                }
            }
        }
    }

    .transaction-summary {
        background: #f9fafb;
        border-radius: 12px;
        padding: $size-4;
        margin-bottom: $size-20;

        .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: $size-14 $size-16;
            border-bottom: 1px solid #e5e7eb;

            &:last-child {
                border-bottom: none;
            }

            .label {
                font-size: $size-14;
                color: #6b7280;
            }

            .value {
                font-size: $size-14;
                font-weight: $fw-semi-bold;
                color: #374151;
            }

            &.total {
                background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                border-radius: 0 0 10px 10px;
                margin: 0 -$size-4 -$size-4;
                padding: $size-16 $size-20;

                .label {
                    font-weight: $fw-semi-bold;
                    color: #047857;
                }

                .value {
                    font-size: $size-18;
                    font-weight: $fw-bold;
                    color: #059669;
                }

                &.insufficient {
                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);

                    .label {
                        color: #991b1b;
                    }

                    .value {
                        color: #dc2626;
                    }
                }
            }
        }
    }

    .insufficient-alert {
        display: flex;
        align-items: flex-start;
        gap: $size-14;
        padding: $size-16 $size-20;
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border: 2px solid #fca5a5;
        border-radius: 12px;
        margin-bottom: $size-20;

        svg {
            width: 24px;
            height: 24px;
            color: #dc2626;
            flex-shrink: 0;
            margin-top: 2px;
        }

        .alert-content {
            strong {
                display: block;
                font-size: $size-14;
                font-weight: $fw-bold;
                color: #991b1b;
                margin-bottom: 4px;
            }

            p {
                margin: 0;
                font-size: $size-13;
                color: #b91c1c;
                line-height: 1.4;
            }
        }
    }

    .confirmation-actions {
        display: flex;
        gap: $size-12;

        .action-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: $size-8;
            padding: $size-14 $size-20;
            border-radius: 12px;
            font-size: $size-14;
            font-weight: $fw-semi-bold;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;

            svg {
                width: 18px;
                height: 18px;
            }

            &.secondary {
                background: #f3f4f6;
                color: #4b5563;

                &:hover {
                    background: #e5e7eb;
                    color: #1f2937;
                }
            }

            &.primary {
                background: linear-gradient(135deg, #059669 0%, #047857 100%);
                color: white;
                box-shadow: 0 4px 14px rgba(5, 150, 105, 0.3);

                &:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
                }

                &:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                &.loading {
                    pointer-events: none;
                }

                .loading-state {
                    display: flex;
                    align-items: center;
                    gap: $size-8;

                    .spinner {
                        width: 18px;
                        height: 18px;
                        border: 2px solid rgba(255, 255, 255, 0.3);
                        border-top-color: white;
                        border-radius: 50%;
                        animation: spin 0.8s linear infinite;
                    }
                }
            }
        }

        @include responsive(phone) {
            flex-direction: column;
        }
    }
}

// Delete Button
.delete-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid $color-g-90;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;

    svg {
        width: 16px;
        height: 16px;
        color: $color-g-54;
        transition: color 0.2s ease;
    }

    &:hover {
        background: #fef2f2;
        border-color: #fecaca;

        svg {
            color: #dc2626;
        }
    }
}

// Delete Confirmation Modal
.delete-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: $size-20;
}

.delete-modal {
    background: white;
    border-radius: 20px;
    padding: $size-32;
    max-width: 420px;
    width: 100%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

    @include responsive(phone) {
        padding: $size-24;
    }

    &__icon {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto $size-20;

        svg {
            width: 32px;
            height: 32px;
            color: #dc2626;
        }
    }

    &__title {
        margin: 0 0 $size-12 0;
        font-size: $size-20;
        font-weight: $fw-bold;
        color: $color-g-44;
    }

    &__message {
        margin: 0 0 $size-20 0;
        font-size: $size-14;
        color: $color-g-54;
        line-height: 1.6;
    }

    &__info {
        background: #f8fafc;
        border-radius: 10px;
        padding: $size-14;
        margin-bottom: $size-24;

        .info-date {
            display: block;
            font-size: $size-13;
            color: $color-g-44;
            font-weight: $fw-medium;
            margin-bottom: 4px;
        }

        .info-conditions {
            display: block;
            font-size: $size-12;
            color: $color-g-54;
        }
    }

    &__actions {
        display: flex;
        gap: $size-12;

        button {
            flex: 1;
            padding: $size-14 $size-20;
            border-radius: 12px;
            font-size: $size-14;
            font-weight: $fw-semi-bold;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;

            &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        }

        .cancel-btn {
            background: #f3f4f6;
            color: #4b5563;

            &:hover:not(:disabled) {
                background: #e5e7eb;
                color: #1f2937;
            }
        }

        .confirm-delete-btn {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);

            &:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
            }

            .btn-loading {
                display: flex;
                align-items: center;
                justify-content: center;

                .spinner-small {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
            }
        }

        @include responsive(phone) {
            flex-direction: column;
        }
    }
}
</style>
