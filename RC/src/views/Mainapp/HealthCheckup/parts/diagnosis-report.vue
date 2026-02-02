<template>
    <div class="page-content">
        <div class="diagnosis-container">
            <div class="action-buttons">
                <ButtonIcon type="primary" iconName="download" @click="downloadPDF" />
                <ButtonIcon type="primary" iconName="icon-takeout" @click="shareReport" />
            </div>
            <div class="content-section">
                <div class="content-left-section summary-section-desktop">
                    <h2 class="content-left-section__heading">Results</h2>
                    <div class="content-left-section__body">
                        <div v-if="conditions.length" class="left-section__body--top-section">
                            <h3 class="left-section__body--title">Possible Conditions</h3>
                            <p class="left-section__body--description">
                                Please note that the list below is a collection of possible 
                                conditions arranged according to level of severity based on 
                                the answers to your questions. This list is provided solely 
                                for informational purposes and is not a qualified medical opinion.
                            </p>
                        </div>
                        <div v-else class="left-section__body--top-section">
                            <h3 class="left-section__body--title">No Conditions Found</h3>
                            <p class="left-section__body--description">
                                Since you don't have any symptoms at the moment, there is no immediate 
                                need to see a doctor. However, it's always a good idea to schedule regular 
                                check-ups to ensure your overall health and well-being. If you have any 
                                concerns in the future or experience any symptoms, don't hesitate to reach 
                                out to a healthcare professional. 
                            </p>
                        </div>
                        <div v-if="conditions.length" class="left-section-content__results--bottom-section">
                            <div class="left-section-content__results--most-likely">
                                <template v-for="condition in moreLikelyConditions" :key="JSON.stringify(condition)">
                                    <div class="left-section-content__most-likely">
                                        <div class="left-section-content__most-likely--item">
                                            <h4 class="left-section-content__most-likely--title">{{ condition.common_name }}</h4>
                                            <p v-if="condition.category === 0" class="left-section-content__most-likely-desc">Strong evidence</p>
                                            <p v-if="condition.category === 1" class="left-section-content__most-likely-desc">Moderate evidence</p>
                                            <p v-if="condition.category === 2" class="left-section-content__most-likely-desc-2">Weak evidence</p>
                                        </div>
                                        <span v-if="condition.category === 0" class="left-section-content__most-likely--status-1"></span>
                                        <span v-if="condition.category === 1" class="left-section-content__most-likely--status-2"></span>
                                        <span v-if="condition.category === 2" class="left-section-content__most-likely--status-3"></span>
                                    </div>
                                </template>
                            </div>
                            <div v-if="lessLikelyConditions.length" class="left-section-content__results--less-likely">
                                <accordian class="left-section-body__accordian">
                                    <template v-slot:head-content>
                                        <span>Show less likely conditions</span>
                                    </template>
                                    <template v-slot:body-content>
                                        <div class="left-section-content__results--most-likely">
                                            <template v-for="condition in lessLikelyConditions" :key="JSON.stringify(condition)">
                                                <div class="left-section-content__most-likely">
                                                    <div class="left-section-content__most-likely--item">
                                                        <h4 class="left-section-content__most-likely--title">{{ condition.common_name }}</h4>
                                                        <p v-if="condition.category === 0" class="left-section-content__most-likely-desc">Strong evidence</p>
                                                        <p v-if="condition.category === 1" class="left-section-content__most-likely-desc">Moderate evidence</p>
                                                        <p v-if="condition.category === 2" class="left-section-content__most-likely-desc-2">Weak evidence</p>
                                                    </div>
                                                    <span v-if="condition.category === 0" class="left-section-content__most-likely--status-1"></span>
                                                    <span v-if="condition.category === 1" class="left-section-content__most-likely--status-2"></span>
                                                    <span v-if="condition.category === 2" class="left-section-content__most-likely--status-3"></span>
                                                </div>
                                            </template>
                                        </div>
                                    </template>
                                </accordian>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="content-right-section">
                    <div class="right-section-recommendation">
                        <h2 class="section-recommendation__heading">Recommendation</h2>
                        <div class="section-recommendation__body">
                            <!-- Triage Banner -->
                            <div v-if="triageConfig" class="triage-banner" :style="{ backgroundColor: triageConfig.bgColor, borderColor: triageConfig.color }">
                                <div class="triage-banner__icon" :style="{ color: triageConfig.color }">
                                    <v-icon :name="triageConfig.icon" />
                                </div>
                                <div class="triage-banner__content">
                                    <h3 class="triage-banner__title" :style="{ color: triageConfig.color }">{{ triageConfig.title }}</h3>
                                    <p class="triage-banner__description">{{ triageConfig.description }}</p>
                                </div>
                            </div>

                            <div class="recommendation-body-content">
                                <div class="recommendation-localhospital-icon">
                                    <v-icon
                                        name="md-localhospital-round"
                                        width="156"
                                        height="156"
                                        :fill="triageConfig ? triageConfig.color : (conditions.length ? '#D12A05' : '#4FC3F7')"
                                    />
                                </div>
                                <div class="recommendation-body-content__info">
                                    <template v-if="triageConfig">
                                        <h1 class="recommendation-info__header">{{ triageConfig.title }}</h1>
                                        <p class="recommendation-info__description">
                                            {{ triageConfig.description }}
                                        </p>
                                    </template>
                                    <template v-else-if="conditions.length">
                                        <h1 class="recommendation-info__header">You need to see a Doctor</h1>
                                        <p class="recommendation-info__description">
                                            Your symptoms appear serious and you may require urgent care. You need to see a doctor as soon as possible.
                                        </p>
                                    </template>
                                    <template v-else>
                                        <h1 class="recommendation-info__header">You seem to be doing Ok!</h1>
                                        <p class="recommendation-info__description">
                                            No symptoms, no need for a doctor now. Keep up with regular check-ups for your well-being.
                                            If you have any concerns in the future or experience any symptoms, you can still book a consultation.
                                        </p>
                                    </template>
                                </div>
                            </div>
                            <rc-button
                                class="recommendation-body-action"
                                label="Book a consultation now"
                                type="tertiary"
                                size="medium"
                                iconRight
                                iconName="chevron-right"
                                @click="goToBookAppointment"
                            />
                        </div>
                    </div>

                    <!-- Health Summary Premium Section -->
                    <div v-if="claudeSummaryEnabled" class="health-summary-premium-section">
                        <div class="health-summary-header" @click="toggleClaudeSummary">
                            <div class="health-summary-header__left">
                                <v-icon name="fa-stethoscope" class="health-summary-icon" />
                                <span class="health-summary-title">Health Summary</span>
                                <span class="health-summary-badge">PREMIUM</span>
                                <span v-if="creditStatus && !claudeSummaryLoading" class="health-summary-credits">
                                    {{ formatCreditsRemaining() }}
                                </span>
                            </div>
                            <v-icon
                                :name="showClaudeSummary ? 'bi-chevron-down' : 'bi-chevron-down'"
                                class="health-summary-chevron"
                                :class="{ 'chevron-rotated': showClaudeSummary }"
                            />
                        </div>

                        <div v-if="showClaudeSummary" class="health-summary-content">
                            <!-- Loading state -->
                            <div v-if="claudeSummaryLoading" class="health-summary-loading">
                                <div class="loading-spinner"></div>
                                <p>Generating your personalized health summary...</p>
                            </div>

                            <!-- Error state -->
                            <div v-else-if="claudeSummaryError" class="health-summary-error">
                                <p>{{ claudeSummaryError }}</p>
                                <rc-button
                                    label="Try Again"
                                    type="tertiary"
                                    size="small"
                                    @click="loadClaudeSummary"
                                />
                            </div>

                            <!-- Purchase Required state -->
                            <div v-else-if="purchaseRequired" class="health-summary-purchase-prompt">
                                <div class="purchase-prompt-icon">
                                    <v-icon name="fa-coins" />
                                </div>
                                <h4>Credits Needed</h4>
                                <p>Your free monthly Health Summary credits have been used. Purchase more credits to continue accessing AI-powered health insights.</p>
                                <div class="purchase-prompt-info">
                                    <span>Free credits refresh on {{ creditStatus?.free_credits_reset_date ? new Date(creditStatus.free_credits_reset_date).toLocaleDateString() : 'next month' }}</span>
                                </div>
                                <div class="purchase-plans-quick" v-if="availablePlans.length">
                                    <div
                                        v-for="plan in availablePlans.slice(0, 3)"
                                        :key="plan._id"
                                        class="quick-plan-card"
                                        @click="purchasePlan(plan._id)"
                                    >
                                        <span class="plan-name">{{ plan.name }}</span>
                                        <span class="plan-price">₦{{ plan.price.toLocaleString() }}</span>
                                        <span class="plan-desc">{{ plan.credits ? `${plan.credits} credits` : plan.description }}</span>
                                    </div>
                                </div>
                                <rc-button
                                    label="View All Plans"
                                    type="primary"
                                    @click="openPurchaseModal"
                                />
                            </div>

                            <!-- Summary content -->
                            <div v-else-if="claudeSummary?.content" class="health-summary-body">
                                <!-- Overview -->
                                <div class="summary-block overview-block">
                                    <h4>Overview</h4>
                                    <p>{{ claudeSummary.content.overview }}</p>
                                </div>

                                <!-- Key Findings -->
                                <div v-if="claudeSummary.content.key_findings?.length" class="summary-block findings-block">
                                    <h4>Key Findings</h4>
                                    <ul>
                                        <li v-for="(finding, idx) in claudeSummary.content.key_findings" :key="idx">
                                            {{ finding }}
                                        </li>
                                    </ul>
                                </div>

                                <!-- Conditions Explained -->
                                <div v-if="claudeSummary.content.possible_conditions_explained?.length" class="summary-block conditions-block">
                                    <h4>Understanding Your Possible Conditions</h4>
                                    <div
                                        v-for="(condition, idx) in claudeSummary.content.possible_conditions_explained"
                                        :key="idx"
                                        class="condition-detail-card"
                                    >
                                        <div class="condition-detail-header">
                                            <span class="condition-detail-name">{{ condition.condition }}</span>
                                            <span class="condition-urgency-tag" :class="getUrgencyClass(condition.urgency)">
                                                {{ getUrgencyLabel(condition.urgency) }}
                                            </span>
                                        </div>
                                        <p class="condition-detail-explanation">{{ condition.explanation }}</p>
                                    </div>
                                </div>

                                <!-- Recommendations -->
                                <div v-if="claudeSummary.content.recommendations?.length" class="summary-block recommendations-block">
                                    <h4>Recommendations</h4>
                                    <ul>
                                        <li v-for="(rec, idx) in claudeSummary.content.recommendations" :key="idx">
                                            {{ rec }}
                                        </li>
                                    </ul>
                                </div>

                                <!-- When to Seek Care -->
                                <div v-if="claudeSummary.content.when_to_seek_care" class="summary-block seek-care-block">
                                    <h4>When to Seek Medical Care</h4>
                                    <p>{{ claudeSummary.content.when_to_seek_care }}</p>
                                </div>

                                <!-- Lifestyle Tips -->
                                <div v-if="claudeSummary.content.lifestyle_tips?.length" class="summary-block tips-block">
                                    <h4>Wellness Tips</h4>
                                    <ul>
                                        <li v-for="(tip, idx) in claudeSummary.content.lifestyle_tips" :key="idx">
                                            {{ tip }}
                                        </li>
                                    </ul>
                                </div>

                                <!-- Disclaimer -->
                                <div class="health-summary-disclaimer">
                                    <p>This summary is for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="right-section-summary summary-section-desktop">
                        <h2 class="section-summary__heading">Summary</h2>
                        <div class="section-summary__body">
                            <h3 class="section-summary-body__heading">Diagnosis Summary</h3>
                            <div class="section-summary-diagnosis">
                                <div class="section-summary-diagnosis__item">
                                    <span class="section-summary-diagnosis__key">Considered diagnoses</span>
                                    <button 
                                        class="section-summary-diagnosis__value clickable-diagnosis diagnosis-button" 
                                        @click="handleDiagnosisClick"
                                        type="button"
                                    >
                                        {{ consideredDiagnosesCount }}+
                                    </button>
                                </div>
                                <div class="section-summary-diagnosis__item">
                                    <span class="section-summary-diagnosis__key">Interview duration</span>
                                    <span class="section-summary-diagnosis__value">{{ duration }}</span>
                                </div>
                            </div>
                            <div v-if="showDiagnosesList && allConditions.length" class="considered-diagnoses-list">
                                <div class="diagnoses-list-header">
                                    <h4 class="diagnoses-list-title">{{ conditionsDisplayLabel }}</h4>
                                    <div class="header-controls">
                                        <div v-if="showPagination" class="pagination-controls">
                                            <button 
                                                class="pagination-btn" 
                                                @click="goToPrevPage" 
                                                :disabled="currentPage === 1"
                                            >
                                                ←
                                            </button>
                                            <span class="pagination-info">{{ currentPage }} of {{ totalPages }}</span>
                                            <button 
                                                class="pagination-btn" 
                                                @click="goToNextPage" 
                                                :disabled="currentPage === totalPages"
                                            >
                                                →
                                            </button>
                                        </div>
                                        <button class="diagnoses-collapse-btn" @click="handleDiagnosisClick">
                                            Collapse
                                        </button>
                                    </div>
                                </div>
                                <div class="diagnoses-list-content">
                                    <template v-for="(condition, index) in paginatedConditions" :key="index">
                                        <div class="diagnosis-condition-item">
                                            <span class="condition-name">{{ condition.common_name }}</span>
                                            <span class="condition-probability">{{ Math.round(condition.probability * 100) }}%</span>
                                        </div>
                                    </template>
                                </div>
                                <div class="diagnoses-list-actions">
                                    <button 
                                        v-if="!showingExtendedConditions && diagnosis.evidence?.length > allConditions.length"
                                        class="show-more-btn"
                                        @click="loadMoreConditions"
                                        :disabled="loadingMoreConditions"
                                    >
                                        <span v-if="!loadingMoreConditions">Show All Possible Conditions</span>
                                        <span v-else>Loading...</span>
                                    </button>
                                    <div v-else-if="showingExtendedConditions" class="info-message">
                                        These are all the conditions analyzed by the AI diagnostic system.
                                    </div>
                                </div>
                                <div v-if="showPagination && paginatedConditions.length" class="diagnoses-list-footer">
                                    <div class="pagination-summary">
                                        Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }}-{{ Math.min(currentPage * itemsPerPage, allConditions.length) }} of {{ allConditions.length }} conditions
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Q&A Summary Section - Expandable -->
                        <div v-if="answeredQuestions.length" class="qa-summary-section">
                            <accordian class="qa-accordian">
                                <template v-slot:head-content>
                                    <span class="qa-header">
                                        Questions & Answers Review ({{ answeredQuestions.length }} questions)
                                    </span>
                                </template>
                                <template v-slot:body-content>
                                    <div class="qa-content">
                                        <p class="qa-description">Review the questions you answered during your health assessment</p>
                                        <div class="qa-list">
                                            <div
                                                v-for="(qa, index) in answeredQuestions"
                                                :key="index"
                                                class="qa-item"
                                            >
                                                <div class="qa-question">{{ qa.question }}</div>
                                                <div class="qa-answer" :class="qa.answerClass">
                                                    {{ qa.answer }}
                                                    <span v-if="qa.duration" class="qa-duration-tag">{{ qa.duration }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </accordian>
                        </div>

                        <rc-button
                            class="right-section-summary__action"
                            label="Take Diagnosis Again"
                            type="primary"
                            size="medium"
                            @click="onTakeDiosisAgain"
                        />
                    </div>
                    <div class="tab-summary-recommendation">
                        <rc-tab
                            :tabs="tabs"
                            :currentTab="currentTab"
                            :wrapper-class="'default-tabs'"
                            :tab-class="'default-tabs__item'"
                            :tab-active-class="'default-tabs__item_active'"
                            :line-class="'default-tabs__active-line'"
                            @onClick="currentTab = $event"
                        />
                        <div class="tabs-summary-recommendation__content">
                            <template v-if="currentTab === 'results'">
                                <div class="content-left-section">
                                    <div class="content-left-section__body">
                                        <div v-if="conditions.length" class="left-section__body--top-section">
                                            <h3 class="left-section__body--title">Possible Conditions</h3>
                                            <p class="left-section__body--description">
                                                Please note that the list below is a collection of possible 
                                                conditions arranged according to level of severity based on 
                                                the answers to your questions. This list is provided solely 
                                                for informational purposes and is not a qualified medical opinion.
                                            </p>
                                        </div>
                                        <div v-else class="left-section__body--top-section">
                                            <h3 class="left-section__body--title">No Conditions Found</h3>
                                            <p class="left-section__body--description">
                                                Since you don't have any symptoms at the moment, there is no immediate 
                                                need to see a doctor. However, it's always a good idea to schedule regular 
                                                check-ups to ensure your overall health and well-being. If you have any 
                                                concerns in the future or experience any symptoms, don't hesitate to reach 
                                                out to a healthcare professional. 
                                            </p>
                                        </div>
                                        <div v-if="conditions.length" class="left-section-content__results--bottom-section">
                                            <div class="left-section-content__results--most-likely">
                                                <template v-for="condition in moreLikelyConditions" :key="JSON.stringify(condition)">
                                                    <div class="left-section-content__most-likely">
                                                        <div class="left-section-content__most-likely--item">
                                                            <h4 class="left-section-content__most-likely--title">{{ condition.common_name }}</h4>
                                                            <p v-if="condition.category === 0" class="left-section-content__most-likely-desc">Strong evidence</p>
                                                            <p v-if="condition.category === 1" class="left-section-content__most-likely-desc">Moderate evidence</p>
                                                            <p v-if="condition.category === 2" class="left-section-content__most-likely-desc-2">Weak evidence</p>
                                                        </div>
                                                        <span v-if="condition.category === 0" class="left-section-content__most-likely--status-1"></span>
                                                        <span v-if="condition.category === 1" class="left-section-content__most-likely--status-2"></span>
                                                        <span v-if="condition.category === 2" class="left-section-content__most-likely--status-3"></span>
                                                    </div>
                                                </template>
                                            </div>
                                            <div v-if="lessLikelyConditions.length" class="left-section-content__results--less-likely">
                                                <accordian class="left-section-body__accordian">
                                                    <template v-slot:head-content>
                                                        <span>Show less likely conditions</span>
                                                    </template>
                                                    <template v-slot:body-content>
                                                        <div class="left-section-content__results--most-likely">
                                                            <template v-for="condition in lessLikelyConditions" :key="JSON.stringify(condition)">
                                                                <div class="left-section-content__most-likely">
                                                                    <div class="left-section-content__most-likely--item">
                                                                        <h4 class="left-section-content__most-likely--title">{{ condition.common_name }}</h4>
                                                                        <p v-if="condition.category === 0" class="left-section-content__most-likely-desc">Strong evidence</p>
                                                                        <p v-if="condition.category === 1" class="left-section-content__most-likely-desc">Moderate evidence</p>
                                                                        <p v-if="condition.category === 2" class="left-section-content__most-likely-desc-2">Weak evidence</p>
                                                                    </div>
                                                                    <span v-if="condition.category === 0" class="left-section-content__most-likely--status-1"></span>
                                                                    <span v-if="condition.category === 1" class="left-section-content__most-likely--status-2"></span>
                                                                    <span v-if="condition.category === 2" class="left-section-content__most-likely--status-3"></span>
                                                                </div>
                                                            </template>
                                                        </div>
                                                    </template>
                                                </accordian>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <template v-if="currentTab === 'summary'">
                                <div class="right-section-summary">
                                    <div class="section-summary__body">
                                        <h3 class="section-summary-body__heading">Diagnosis Summary</h3>
                                        <div class="section-summary-diagnosis">
                                            <div class="section-summary-diagnosis__item">
                                                <span class="section-summary-diagnosis__key">Considered diagnoses</span>
                                                <button 
                                                    class="section-summary-diagnosis__value clickable-diagnosis diagnosis-button" 
                                                    @click="handleDiagnosisClick"
                                                    type="button"
                                                >
                                                    {{ consideredDiagnosesCount }}+
                                                </button>
                                            </div>
                                            <div class="section-summary-diagnosis__item">
                                                <span class="section-summary-diagnosis__key">Interview duration</span>
                                                <span class="section-summary-diagnosis__value">{{ duration }}</span>
                                            </div>
                                            <div v-if="showDiagnosesList && allConditions.length" class="considered-diagnoses-list">
                                                <div class="diagnoses-list-header">
                                                    <h4 class="diagnoses-list-title">{{ conditionsDisplayLabel }}</h4>
                                                    <div class="header-controls">
                                                        <div v-if="showPagination" class="pagination-controls">
                                                            <button 
                                                                class="pagination-btn" 
                                                                @click="goToPrevPage" 
                                                                :disabled="currentPage === 1"
                                                            >
                                                                ←
                                                            </button>
                                                            <span class="pagination-info">{{ currentPage }} of {{ totalPages }}</span>
                                                            <button 
                                                                class="pagination-btn" 
                                                                @click="goToNextPage" 
                                                                :disabled="currentPage === totalPages"
                                                            >
                                                                →
                                                            </button>
                                                        </div>
                                                        <button class="diagnoses-collapse-btn" @click="handleDiagnosisClick">
                                                            Collapse
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="diagnoses-list-content">
                                                    <template v-for="(condition, index) in paginatedConditions" :key="index">
                                                        <div class="diagnosis-condition-item">
                                                            <span class="condition-name">{{ condition.common_name }}</span>
                                                            <span class="condition-probability">{{ Math.round(condition.probability * 100) }}%</span>
                                                        </div>
                                                    </template>
                                                </div>
                                                <div class="diagnoses-list-actions">
                                                    <button 
                                                        v-if="!showingExtendedConditions && diagnosis.evidence?.length > allConditions.length"
                                                        class="show-more-btn"
                                                        @click="loadMoreConditions"
                                                        :disabled="loadingMoreConditions"
                                                    >
                                                        <span v-if="!loadingMoreConditions">Show All Possible Conditions</span>
                                                        <span v-else>Loading...</span>
                                                    </button>
                                                    <div v-else-if="showingExtendedConditions" class="info-message">
                                                        These are all the conditions analyzed by the AI diagnostic system.
                                                    </div>
                                                </div>
                                                <div v-if="showPagination && paginatedConditions.length" class="diagnoses-list-footer">
                                                    <div class="pagination-summary">
                                                        Showing {{ ((currentPage - 1) * itemsPerPage) + 1 }}-{{ Math.min(currentPage * itemsPerPage, allConditions.length) }} of {{ allConditions.length }} conditions
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Health Summary Premium Section - Mobile Tab View -->
                                    <div v-if="claudeSummaryEnabled" class="health-summary-premium-section">
                                        <div class="health-summary-header" @click="toggleClaudeSummary">
                                            <div class="health-summary-header__left">
                                                <v-icon name="fa-stethoscope" class="health-summary-icon" />
                                                <span class="health-summary-title">Health Summary</span>
                                                <span class="health-summary-badge">PREMIUM</span>
                                            </div>
                                            <v-icon
                                                name="bi-chevron-down"
                                                class="health-summary-chevron"
                                                :class="{ 'chevron-rotated': showClaudeSummary }"
                                            />
                                        </div>

                                        <div v-if="showClaudeSummary" class="health-summary-content">
                                            <div v-if="claudeSummaryLoading" class="health-summary-loading">
                                                <div class="loading-spinner"></div>
                                                <p>Generating your personalized health summary...</p>
                                            </div>

                                            <div v-else-if="claudeSummaryError" class="health-summary-error">
                                                <p>{{ claudeSummaryError }}</p>
                                                <rc-button
                                                    label="Try Again"
                                                    type="tertiary"
                                                    size="small"
                                                    @click="loadClaudeSummary"
                                                />
                                            </div>

                                            <div v-else-if="claudeSummary?.content" class="health-summary-body">
                                                <div class="summary-block overview-block">
                                                    <h4>Overview</h4>
                                                    <p>{{ claudeSummary.content.overview }}</p>
                                                </div>

                                                <div v-if="claudeSummary.content.key_findings?.length" class="summary-block findings-block">
                                                    <h4>Key Findings</h4>
                                                    <ul>
                                                        <li v-for="(finding, idx) in claudeSummary.content.key_findings" :key="idx">
                                                            {{ finding }}
                                                        </li>
                                                    </ul>
                                                </div>

                                                <div v-if="claudeSummary.content.possible_conditions_explained?.length" class="summary-block conditions-block">
                                                    <h4>Understanding Your Possible Conditions</h4>
                                                    <div
                                                        v-for="(condition, idx) in claudeSummary.content.possible_conditions_explained"
                                                        :key="idx"
                                                        class="condition-detail-card"
                                                    >
                                                        <div class="condition-detail-header">
                                                            <span class="condition-detail-name">{{ condition.condition }}</span>
                                                            <span class="condition-urgency-tag" :class="getUrgencyClass(condition.urgency)">
                                                                {{ getUrgencyLabel(condition.urgency) }}
                                                            </span>
                                                        </div>
                                                        <p class="condition-detail-explanation">{{ condition.explanation }}</p>
                                                    </div>
                                                </div>

                                                <div v-if="claudeSummary.content.recommendations?.length" class="summary-block recommendations-block">
                                                    <h4>Recommendations</h4>
                                                    <ul>
                                                        <li v-for="(rec, idx) in claudeSummary.content.recommendations" :key="idx">
                                                            {{ rec }}
                                                        </li>
                                                    </ul>
                                                </div>

                                                <div v-if="claudeSummary.content.when_to_seek_care" class="summary-block seek-care-block">
                                                    <h4>When to Seek Medical Care</h4>
                                                    <p>{{ claudeSummary.content.when_to_seek_care }}</p>
                                                </div>

                                                <div v-if="claudeSummary.content.lifestyle_tips?.length" class="summary-block tips-block">
                                                    <h4>Wellness Tips</h4>
                                                    <ul>
                                                        <li v-for="(tip, idx) in claudeSummary.content.lifestyle_tips" :key="idx">
                                                            {{ tip }}
                                                        </li>
                                                    </ul>
                                                </div>

                                                <div class="health-summary-disclaimer">
                                                    <p>This summary is for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Q&A Summary Section - Mobile Tab View -->
                                    <div v-if="answeredQuestions.length" class="qa-summary-section">
                                        <accordian class="qa-accordian">
                                            <template v-slot:head-content>
                                                <span class="qa-header">
                                                    Questions & Answers Review ({{ answeredQuestions.length }} questions)
                                                </span>
                                            </template>
                                            <template v-slot:body-content>
                                                <div class="qa-content">
                                                    <p class="qa-description">Review the questions you answered during your health assessment</p>
                                                    <div class="qa-list">
                                                        <div
                                                            v-for="(qa, index) in answeredQuestions"
                                                            :key="index"
                                                            class="qa-item"
                                                        >
                                                            <div class="qa-question">{{ qa.question }}</div>
                                                            <div class="qa-answer" :class="qa.answerClass">
                                                                {{ qa.answer }}
                                                                <span v-if="qa.duration" class="qa-duration-tag">{{ qa.duration }}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                        </accordian>
                                    </div>

                                    <rc-button
                                        class="right-section-summary__action"
                                        label="Take Diagnosis Again"
                                        type="primary"
                                        size="medium"
                                        @click="onTakeDiosisAgain"
                                    />
                                </div>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Purchase Plans Modal -->
        <div v-if="showPurchaseModal" class="purchase-modal-overlay" @click.self="closePurchaseModal">
            <div class="purchase-modal">
                <!-- Header -->
                <div class="purchase-modal__header" :class="{ 'confirm-mode': selectedPlanForPurchase }">
                    <div class="header-content">
                        <div class="header-icon">
                            <v-icon :name="selectedPlanForPurchase ? 'hi-shield-check' : 'hi-sparkles'" />
                        </div>
                        <div class="header-text">
                            <h3>{{ selectedPlanForPurchase ? 'Confirm Your Purchase' : 'AI Health Summary Credits' }}</h3>
                            <p>{{ selectedPlanForPurchase ? 'Review your purchase details below' : 'Unlock AI-powered health insights' }}</p>
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
                            Select a plan below to unlock AI-powered analysis of your health checkups. Your credits never expire!
                        </p>

                        <div class="plans-grid">
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

    </div>
</template>

<script setup>
import { formatDuration } from "date-fns";
import { ref, inject, provide, computed, watchEffect } from "vue";
import { useToast } from 'vue-toast-notification';
import { mapGetters } from "@/utilities/utilityStore";
import RcTab from "@/components/RCTab";
import Accordian from "@/components/Lists/accordian";
import ButtonIcon from "@/components/buttons/button-icon";
import RcButton from "@/components/buttons/button-primary";
import DialogModal from "@/components/modals/dialog-modal";
import RcModal from "@/components/RCModal";

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
const currentPage = ref(1);
const itemsPerPage = 10;
const showingExtendedConditions = ref(false);
const loadingMoreConditions = ref(false);
const extendedConditions = ref([]);
const { current, from, to } = navigator.value;

// Claude AI Health Summary state
const claudeSummaryEnabled = ref(true); // Always enabled now - controlled by credits
const claudeSummary = ref(null);
const claudeSummaryLoading = ref(false);
const claudeSummaryError = ref(null);
const showClaudeSummary = ref(false);
// Credits state
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
const questions = ref({...recommendation.value.diagnosis.questions});
const conditions = ref([...recommendation.value.diagnosis.conditions]);
const currentTab = ref("results");
const tabs = [
    { title: 'Results', value: 'results' },
    { title: 'Summary', value: 'summary' },
]

const goToBookAppointment = () => {
    router.push({ name: 'BookAppointment' });
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
    // Get actual conditions count from the API response
    const actualConditionsCount = conditions.value?.length || 0;

    // If we have extended conditions loaded, show the total
    if (showingExtendedConditions.value && extendedConditions.value.length > 0) {
        return actualConditionsCount + extendedConditions.value.length;
    }

    // Otherwise show the actual count of conditions (not evidence)
    // This fixes the misleading "30+" when we only have 8 conditions
    return actualConditionsCount;
});

// Triage level from Infermedica API
const triageLevel = computed(() => {
    return recommendation.value?.diagnosis?.triage_level ||
           diagnosis.value?.triage_level ||
           null;
});

// Triage display configuration
const triageConfig = computed(() => {
    const configs = {
        'emergency': {
            title: 'Seek Emergency Care Immediately',
            description: 'Your symptoms suggest a potentially serious condition that requires immediate medical attention. Please go to the nearest emergency room or call emergency services.',
            color: '#dc2626',
            bgColor: '#fef2f2',
            icon: 'hi-exclamation-circle'
        },
        'emergency_ambulance': {
            title: 'Call an Ambulance Now',
            description: 'Your symptoms indicate a medical emergency. Please call an ambulance or emergency services immediately.',
            color: '#dc2626',
            bgColor: '#fef2f2',
            icon: 'hi-exclamation-circle'
        },
        'consultation_24': {
            title: 'See a Doctor Within 24 Hours',
            description: 'Your symptoms require prompt medical attention. Please schedule an appointment with a doctor within the next 24 hours.',
            color: '#f59e0b',
            bgColor: '#fffbeb',
            icon: 'hi-clock'
        },
        'consultation': {
            title: 'Schedule a Doctor Visit',
            description: 'Your symptoms suggest you should see a doctor within the next few days. Book a consultation at your earliest convenience.',
            color: '#3b82f6',
            bgColor: '#eff6ff',
            icon: 'hi-calendar'
        },
        'self_care': {
            title: 'Self-Care Recommended',
            description: 'Your symptoms appear manageable with self-care. Monitor your condition and consult a doctor if symptoms worsen or persist.',
            color: '#10b981',
            bgColor: '#ecfdf5',
            icon: 'hi-check-circle'
        }
    };
    return configs[triageLevel.value] || null;
});

// Get all conditions (recommended + extended if loaded)
const allConditions = computed(() => {
    // If we have extended conditions, combine them with recommended
    if (showingExtendedConditions.value && extendedConditions.value.length > 0) {
        // Combine recommended (top 8) with extended conditions, avoiding duplicates
        const combined = [...conditions.value];
        const existingIds = new Set(conditions.value.map(c => c.id));
        
        extendedConditions.value.forEach(condition => {
            if (!existingIds.has(condition.id)) {
                combined.push(condition);
            }
        });
        
        return combined;
    }
    
    // Otherwise just return the recommended conditions
    return conditions.value || [];
});

// Get display label for conditions
const conditionsDisplayLabel = computed(() => {
    if (showingExtendedConditions.value) {
        return `All Considered Conditions (${allConditions.value.length})`;
    }
    return `Top Recommended Conditions (${allConditions.value.length})`;
});

// Paginated conditions for display
const paginatedConditions = computed(() => {
    const startIndex = (currentPage.value - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return allConditions.value.slice(startIndex, endIndex);
});

// Total pages needed
const totalPages = computed(() => {
    return Math.ceil(allConditions.value.length / itemsPerPage);
});

// Show pagination controls
const showPagination = computed(() => {
    return totalPages.value > 1;
});

// Q&A Summary - Computed property for answered questions
const answeredQuestions = computed(() => {
    const questions = [];

    // First try to get tracked questions from recommendation
    const trackedQuestions = recommendation.value?.answered_questions || [];

    if (trackedQuestions.length > 0) {
        // Use the tracked questions if available
        trackedQuestions.forEach(q => {
            if (q.type === 'group_multiple' || q.type === 'group_single') {
                q.answers.forEach(answer => {
                    // Format as "Do you experience X?" for consistency
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
        // Fallback: Use evidence with source fields
        const evidence = recommendation.value?.diagnosis?.evidence || diagnosis.value?.evidence || [];

        // Filter evidence to only include user responses (initial symptoms + interview answers)
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

// Helper method to format symptom duration
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
}


const handleDiagnosisClick = () => {
    showDiagnosesList.value = !showDiagnosesList.value;
    // Reset to first page when opening
    if (showDiagnosesList.value) {
        currentPage.value = 1;
    }
};

const loadMoreConditions = async () => {
    loadingMoreConditions.value = true;
    
    try {
        // Get the interview token from available sources
        const interviewToken = diagnosis.value.interview_token || 
                              recommendation.value.diagnosis?.interview_token ||
                              recommendation.value.interview_token;
                              
        if (!interviewToken) {
            $toast.error('Unable to load more conditions: missing interview token');
            return;
        }
        
        // Call the new extended diagnosis endpoint
        const response = await $http.$_getExtendedDiagnosis({
            interview_token: interviewToken,
            min_probability: 0.01,  // Get conditions with at least 1% probability
            limit: 30  // Get up to 30 conditions
        });
        
        if (response?.data?.conditions?.length > 0) {
            // Store the extended conditions
            extendedConditions.value = response.data.conditions.filter(c => {
                // Filter out any conditions we already have
                return !conditions.value.some(existing => existing.id === c.id);
            });
            
            if (extendedConditions.value.length > 0) {
                showingExtendedConditions.value = true;
                $toast.success(`Loaded ${extendedConditions.value.length} additional conditions`);
            } else {
                // All extended conditions were duplicates
                showingExtendedConditions.value = true;
                $toast.info('These are all the conditions analyzed by the AI diagnostic system');
            }
        } else {
            // No additional conditions available
            showingExtendedConditions.value = true;
            $toast.info('No additional conditions found beyond the top recommendations');
        }
        
    } catch (error) {
        console.error('Error loading more conditions:', error);
        
        // Handle specific error messages
        if (error.response?.data?.message) {
            $toast.error(error.response.data.message);
        } else if (error.message) {
            $toast.error(error.message);
        } else {
            $toast.error('Failed to load additional conditions. Please try again.');
        }
    } finally {
        loadingMoreConditions.value = false;
    }
};

const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
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
            claudeSummaryEnabled.value = true; // Always enabled - controlled by credits
            creditStatus.value = response.data.data.credits;
        }
    } catch (error) {
        console.log('Claude summary status check failed:', error);
        claudeSummaryEnabled.value = true; // Still enabled, will show purchase prompt if no credits
    }
};

const loadClaudeSummary = async () => {
    if (!claudeSummaryEnabled.value) return;

    // Get checkup ID from recommendation or diagnosis
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
        // First try to get existing summary from DB
        const getResponse = await $http.$_getClaudeSummary(checkupId);

        // Update credit status from response
        if (getResponse?.data?.data?.credits) {
            creditStatus.value = getResponse.data.data.credits;
        }

        if (getResponse?.data?.data?.has_summary && getResponse.data.data.claude_summary?.content) {
            // Summary exists in DB
            claudeSummary.value = getResponse.data.data.claude_summary;
            console.log('Loaded existing Claude summary from DB');
        } else {
            // No summary exists, try to generate one
            const generateResponse = await $http.$_generateClaudeSummary(
                checkupId,
                recommendation.value?.answered_questions || null
            );

            const responseData = generateResponse?.data?.data;

            // Check if purchase is required (no credits)
            if (responseData?.purchase_required) {
                purchaseRequired.value = true;
                availablePlans.value = responseData.available_plans || [];
                creditStatus.value = responseData.credits;
                console.log('Purchase required - no credits available');
            } else if (responseData?.claude_summary?.content) {
                claudeSummary.value = responseData.claude_summary;
                creditStatus.value = responseData.credits;
                console.log('Generated and stored new Claude summary');
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
            // Purchase successful, reload summary
            $toast.success('Purchase successful! Check your email for confirmation.', { duration: 4000 });
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
    return `${total} credit${total !== 1 ? 's' : ''} remaining`;
};

const toggleClaudeSummary = () => {
    showClaudeSummary.value = !showClaudeSummary.value;

    // Load summary on first expand if enabled and not loaded yet
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

// Check Claude summary status on mount
checkClaudeSummaryStatus();


// PDF Download functionality
const downloadPDF = async () => {
	try {
		// Import html2pdf dynamically
		const html2pdf = (await import('html2pdf.js')).default;

		// Ensure AI summary is loaded if available
		// First check local sources
		if (!claudeSummary.value) {
			const existingSummary = recommendation.value?.claude_summary ||
									recommendation.value?.diagnosis?.claude_summary ||
									diagnosis.value?.claude_summary;
			if (existingSummary?.content) {
				claudeSummary.value = existingSummary;
				console.log('Loaded Claude summary from recommendation for PDF');
			}
		}

		// If still no summary, try fetching from API
		if (!claudeSummary.value) {
			const checkupId = recommendation.value?.checkup_id ||
							  diagnosis.value?.checkup_id ||
							  recommendation.value?.diagnosis?.checkup_id ||
							  recommendation.value?._id;
			if (checkupId) {
				try {
					console.log('Fetching Claude summary from API for PDF...');
					const getResponse = await $http.$_getClaudeSummary(checkupId);
					if (getResponse?.data?.data?.has_summary && getResponse.data.data.claude_summary?.content) {
						claudeSummary.value = getResponse.data.data.claude_summary;
						console.log('Fetched Claude summary from API for PDF');
					}
				} catch (err) {
					console.log('Could not fetch Claude summary for PDF:', err.message);
				}
			}
		}

		// Debug: Log available data
		console.log('=== PDF GENERATION DEBUG ===');
		console.log('claudeSummary.value:', claudeSummary.value);
		
		// Get patient information based on who the checkup is for
		let patientProfile = {};
		
		// Enhanced debugging for all available data sources
		console.log('=== ENHANCED PATIENT DATA EXTRACTION ===');
		console.log('Available data sources:');
		console.log('- recommendation.value:', recommendation.value);
		console.log('- diagnosis.value:', diagnosis.value);  
		console.log('- patientInfo.value:', patientInfo.value);
		console.log('- userprofile.value:', userprofile.value);
		
		// Check if checkup is for self or someone else from multiple sources
		const healthCheckFor = recommendation.value?.health_check_for || 
							   diagnosis.value?.health_check_for || 
							   patientInfo.value?.health_check_for ||
							   'Self';
		
		console.log('- Determined health_check_for:', healthCheckFor);
		
		if (healthCheckFor === 'Self' || healthCheckFor === 'self') {
			// Use logged-in user's profile
			patientProfile = userprofile.value?.profile || {};
			console.log('Using logged-in user profile for Self checkup');
		} else {
			// Use specific patient info from checkup - try multiple sources
			patientProfile = patientInfo.value || 
							recommendation.value?.patient_info || 
							recommendation.value?.diagnosis?.patient_info ||
							diagnosis.value?.patient_info ||
							recommendation.value?.patient || 
							diagnosis.value?.patient ||
							{};
			console.log('Using specific patient info for Someone else checkup');
		}
		
		// Additional fallback - if still empty, try to extract from evidence or other fields
		if (!patientProfile.first_name && !patientProfile.last_name) {
			console.log('Primary extraction failed, trying fallbacks...');
			
			// Try to get patient data from any nested structures
			const fallbackSources = [
				recommendation.value?.evidence?.patient_info,
				recommendation.value?.request?.patient_info,
				diagnosis.value?.evidence?.patient_info,
				diagnosis.value?.request?.patient_info,
				recommendation.value?.data?.patient_info,
				diagnosis.value?.data?.patient_info
			];
			
			for (const source of fallbackSources) {
				if (source && (source.first_name || source.last_name)) {
					patientProfile = source;
					console.log('Found patient data in fallback source:', source);
					break;
				}
			}
			
			// If still no luck and it's for Self, use userprofile as ultimate fallback
			if (!patientProfile.first_name && !patientProfile.last_name) {
				console.log('All patient-specific sources failed, using userprofile as fallback');
				patientProfile = userprofile.value?.profile || {};
			}
		}
		
		const checkupData = recommendation.value || diagnosis.value || {};
		// Get the checkup date - prioritize created_at as it's the actual checkup timestamp
		const checkupDate = checkupData.created_at ||
							checkupData.createdAt ||
							checkupData.checkup_date ||
							recommendation.value?.diagnosis?.created_at ||
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

		console.log('=== FINAL EXTRACTION RESULTS ===');
		console.log('- health_check_for:', healthCheckFor);
		console.log('- Final patient profile extracted:', patientProfile);
		console.log('- Patient name will be:', `${patientProfile.first_name || 'N/A'} ${patientProfile.last_name || 'N/A'}`);
		console.log('- Patient gender:', patientProfile.gender || 'N/A');
		console.log('- Patient address:', patientProfile.address || 'N/A');
		console.log('- Checkup date (raw):', checkupDate);
		console.log('- Formatted date:', formattedDateOnly);
		console.log('- Formatted time:', formattedTimeOnly);
		
		// Format address from contact fields
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
		
		// Format phone number
		const formatPhoneNumber = (profile) => {
			const countryCode = profile.contact?.phone?.country_code;
			const number = profile.contact?.phone?.number;
			
			if (countryCode && number) {
				return `${countryCode}${number}`;
			} else if (number) {
				return number;
			}
			return 'N/A';
		};
		
		// Generate unique report ID
		const reportId = `RC-${Date.now().toString(36).toUpperCase()}`;

		// Create professional PDF document with elegant design
		const pdfDocumentHTML = `
			<div class="pdf-document">
				<style>
					@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

					* {
						box-sizing: border-box;
						margin: 0;
						padding: 0;
					}

					body, html {
						font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
						line-height: 1.5;
						color: #1a1a2e;
						font-size: 9pt;
						background: white;
						-webkit-print-color-adjust: exact;
						print-color-adjust: exact;
					}

					.pdf-document {
						width: 190mm;
						max-width: 190mm;
						min-height: 297mm;
						margin: 0 auto;
						padding: 10mm 12mm;
						background: white;
						overflow: hidden;
					}

					/* ========== HEADER ========== */
					.pdf-header {
						display: flex;
						justify-content: space-between;
						align-items: flex-start;
						margin-bottom: 15pt;
						padding-bottom: 12pt;
						border-bottom: 2pt solid #C41E3A;
						gap: 10pt;
					}

					.pdf-brand {
						display: flex;
						align-items: center;
						gap: 10pt;
						flex: 1;
						min-width: 0;
					}

					.pdf-logo {
						width: 40pt;
						height: 40pt;
						object-fit: contain;
						flex-shrink: 0;
					}

					.pdf-brand-text h1 {
						font-size: 18pt;
						font-weight: 700;
						color: #C41E3A;
						letter-spacing: -0.5pt;
						margin: 0;
					}

					.pdf-brand-text p {
						font-size: 7pt;
						color: #666;
						margin: 2pt 0 0 0;
						text-transform: uppercase;
						letter-spacing: 0.5pt;
					}

					.pdf-report-meta {
						text-align: right;
						flex-shrink: 0;
						min-width: 100pt;
					}

					.pdf-report-id {
						font-size: 7pt;
						color: #999;
						margin-bottom: 3pt;
						white-space: nowrap;
					}

					.pdf-report-date {
						font-size: 9pt;
						color: #333;
						font-weight: 500;
						white-space: nowrap;
					}

					.pdf-report-time {
						font-size: 8pt;
						color: #666;
						white-space: nowrap;
					}

					/* ========== DOCUMENT TITLE ========== */
					.pdf-doc-title {
						text-align: center;
						margin-bottom: 12pt;
						padding: 10pt 0;
						background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%);
						border-radius: 5pt;
					}

					.pdf-doc-title h2 {
						font-size: 13pt;
						font-weight: 600;
						color: white;
						text-transform: uppercase;
						letter-spacing: 2pt;
						margin: 0;
					}

					/* ========== PATIENT CARD ========== */
					.pdf-patient-card {
						background: #fafbfc;
						border: 1pt solid #e1e5eb;
						border-radius: 5pt;
						padding: 12pt;
						margin-bottom: 12pt;
					}

					.pdf-patient-card-header {
						display: flex;
						align-items: center;
						gap: 8pt;
						margin-bottom: 12pt;
						padding-bottom: 8pt;
						border-bottom: 1pt solid #e1e5eb;
					}

					.pdf-patient-card-header h3 {
						font-size: 11pt;
						font-weight: 600;
						color: #1a1a2e;
						margin: 0;
					}

					.pdf-patient-icon {
						width: 16pt;
						height: 16pt;
						background: #C41E3A;
						border-radius: 50%;
						display: flex;
						align-items: center;
						justify-content: center;
						color: white;
						font-size: 9pt;
					}

					.pdf-patient-grid {
						display: grid;
						grid-template-columns: repeat(2, 1fr);
						gap: 10pt 20pt;
					}

					.pdf-patient-field {
						display: flex;
						flex-direction: column;
						gap: 2pt;
					}

					.pdf-patient-field.full-width {
						grid-column: 1 / -1;
					}

					.pdf-field-label {
						font-size: 7pt;
						font-weight: 600;
						color: #888;
						text-transform: uppercase;
						letter-spacing: 0.5pt;
					}

					.pdf-field-value {
						font-size: 10pt;
						color: #1a1a2e;
						font-weight: 500;
					}

					/* ========== SECTION HEADERS ========== */
					.pdf-section {
						margin-bottom: 14pt;
						page-break-inside: avoid;
					}

					.pdf-section-header {
						display: flex;
						align-items: center;
						gap: 6pt;
						margin-bottom: 10pt;
					}

					.pdf-section-icon {
						width: 24pt;
						height: 24pt;
						border-radius: 4pt;
						display: flex;
						align-items: center;
						justify-content: center;
						font-size: 12pt;
						font-weight: bold;
						color: white;
					}

					.pdf-section-icon.results { background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%); }
					.pdf-section-icon.ai { background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%); }
					.pdf-section-icon.qa { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); }

					.pdf-section-title {
						font-size: 12pt;
						font-weight: 600;
						color: #1a1a2e;
						margin: 0;
					}

					.pdf-section-badge {
						font-size: 6pt;
						font-weight: 700;
						padding: 2pt 6pt;
						border-radius: 3pt;
						text-transform: uppercase;
						letter-spacing: 0.5pt;
						margin-left: 8pt;
					}

					.pdf-section-badge.premium {
						background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
						color: #78350f;
					}

					/* ========== CONDITIONS TABLE ========== */
					.pdf-summary-stat {
						text-align: center;
						padding: 10pt;
						background: #fff8f8;
						border: 1pt solid #fecaca;
						border-radius: 4pt;
						margin-bottom: 12pt;
					}

					.pdf-summary-stat p {
						font-size: 9pt;
						color: #991b1b;
						font-weight: 500;
						margin: 0;
					}

					.pdf-conditions-table {
						width: 100%;
						border-collapse: separate;
						border-spacing: 0;
						font-size: 8pt;
						border: 1pt solid #e1e5eb;
						border-radius: 6pt;
						overflow: hidden;
					}

					.pdf-conditions-table thead th {
						background: #C41E3A;
						color: white;
						font-weight: 600;
						padding: 10pt 8pt;
						text-align: left;
						font-size: 8pt;
						text-transform: uppercase;
						letter-spacing: 0.5pt;
					}

					.pdf-conditions-table thead th:first-child { border-radius: 5pt 0 0 0; }
					.pdf-conditions-table thead th:last-child { border-radius: 0 5pt 0 0; }

					.pdf-conditions-table tbody td {
						padding: 8pt;
						border-bottom: 1pt solid #f1f5f9;
						vertical-align: middle;
					}

					.pdf-conditions-table tbody tr:last-child td { border-bottom: none; }
					.pdf-conditions-table tbody tr:nth-child(even) { background: #fafbfc; }
					.pdf-conditions-table tbody tr:hover { background: #f1f5f9; }

					.pdf-rank {
						font-weight: 700;
						color: #C41E3A;
						text-align: center;
						width: 8%;
					}

					.pdf-condition-name {
						font-weight: 500;
						color: #1a1a2e;
						width: 52%;
					}

					.pdf-probability {
						text-align: center;
						width: 18%;
					}

					.pdf-prob-bar {
						height: 6pt;
						background: #e5e7eb;
						border-radius: 3pt;
						overflow: hidden;
						margin-bottom: 3pt;
					}

					.pdf-prob-fill {
						height: 100%;
						background: linear-gradient(90deg, #C41E3A 0%, #ef4444 100%);
						border-radius: 3pt;
					}

					.pdf-prob-text {
						font-size: 8pt;
						font-weight: 600;
						color: #666;
					}

					.pdf-priority {
						text-align: center;
						width: 22%;
					}

					.pdf-priority-badge {
						display: inline-block;
						padding: 3pt 8pt;
						border-radius: 3pt;
						font-size: 7pt;
						font-weight: 700;
						text-transform: uppercase;
						letter-spacing: 0.5pt;
					}

					.pdf-priority-high { background: #fef2f2; color: #dc2626; border: 1pt solid #fecaca; }
					.pdf-priority-medium { background: #fffbeb; color: #d97706; border: 1pt solid #fde68a; }
					.pdf-priority-low { background: #f0fdf4; color: #16a34a; border: 1pt solid #bbf7d0; }

					/* ========== AI SUMMARY ========== */
					.pdf-ai-summary {
						background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
						border: 1pt solid #a5f3fc;
						border-radius: 6pt;
						padding: 15pt;
						margin-bottom: 12pt;
					}

					.pdf-ai-block {
						margin-bottom: 12pt;
						padding-bottom: 10pt;
						border-bottom: 1pt dashed #cbd5e1;
					}

					.pdf-ai-block:last-child {
						margin-bottom: 0;
						padding-bottom: 0;
						border-bottom: none;
					}

					.pdf-ai-block h4 {
						font-size: 9pt;
						font-weight: 600;
						color: #0288D1;
						margin: 0 0 6pt 0;
						display: flex;
						align-items: center;
						gap: 6pt;
					}

					.pdf-ai-block h4::before {
						content: '';
						width: 3pt;
						height: 12pt;
						background: #4FC3F7;
						border-radius: 2pt;
					}

					.pdf-ai-block p {
						font-size: 8pt;
						color: #334155;
						line-height: 1.6;
						margin: 0;
					}

					.pdf-ai-block ul {
						margin: 0;
						padding-left: 14pt;
						list-style-type: none;
					}

					.pdf-ai-block li {
						font-size: 8pt;
						color: #334155;
						line-height: 1.6;
						margin-bottom: 3pt;
						position: relative;
					}

					.pdf-ai-block li::before {
						content: '•';
						color: #4FC3F7;
						font-weight: bold;
						position: absolute;
						left: -10pt;
					}

					.pdf-condition-detail {
						background: white;
						border: 1pt solid #e0f2fe;
						border-radius: 4pt;
						padding: 8pt 10pt;
						margin-bottom: 6pt;
					}

					.pdf-condition-detail-header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-bottom: 4pt;
					}

					.pdf-condition-detail-name {
						font-size: 9pt;
						font-weight: 600;
						color: #1a1a2e;
					}

					.pdf-urgency-badge {
						font-size: 6pt;
						font-weight: 700;
						padding: 2pt 5pt;
						border-radius: 2pt;
						text-transform: uppercase;
					}

					.pdf-urgency-high { background: #fef2f2; color: #dc2626; }
					.pdf-urgency-medium { background: #fffbeb; color: #d97706; }
					.pdf-urgency-low { background: #f0fdf4; color: #16a34a; }

					.pdf-condition-detail-text {
						font-size: 7pt;
						color: #64748b;
						line-height: 1.5;
						margin: 0;
					}

					/* ========== Q&A TABLE ========== */
					.pdf-qa-container {
						background: #faf5ff;
						border: 1pt solid #e9d5ff;
						border-radius: 6pt;
						padding: 12pt;
					}

					.pdf-qa-table {
						width: 100%;
						border-collapse: separate;
						border-spacing: 0;
						font-size: 8pt;
						background: white;
						border-radius: 4pt;
						overflow: hidden;
						border: 1pt solid #e9d5ff;
					}

					.pdf-qa-table thead th {
						background: #6366f1;
						color: white;
						font-weight: 600;
						padding: 8pt;
						text-align: left;
						font-size: 7pt;
						text-transform: uppercase;
						letter-spacing: 0.5pt;
					}

					.pdf-qa-table tbody td {
						padding: 6pt 8pt;
						border-bottom: 1pt solid #f3e8ff;
						vertical-align: middle;
					}

					.pdf-qa-table tbody tr:last-child td { border-bottom: none; }
					.pdf-qa-table tbody tr:nth-child(even) { background: #faf5ff; }

					.pdf-qa-question { width: 55%; color: #1a1a2e; }
					.pdf-qa-answer { width: 25%; text-align: center; font-weight: 600; }
					.pdf-qa-duration { width: 20%; text-align: center; font-size: 7pt; color: #888; }

					.pdf-answer-yes { color: #16a34a; }
					.pdf-answer-no { color: #dc2626; }
					.pdf-answer-neutral { color: #6b7280; font-style: italic; font-weight: normal; }

					/* ========== NO RESULTS ========== */
					.pdf-no-results {
						text-align: center;
						padding: 25pt;
						background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
						border: 1pt solid #bbf7d0;
						border-radius: 6pt;
					}

					.pdf-no-results h3 {
						font-size: 12pt;
						font-weight: 600;
						color: #16a34a;
						margin: 0 0 6pt 0;
					}

					.pdf-no-results p {
						font-size: 9pt;
						color: #166534;
						line-height: 1.5;
						margin: 0;
					}

					/* ========== FOOTER ========== */
					.pdf-footer {
						margin-top: 20pt;
						padding-top: 12pt;
						border-top: 1pt solid #e1e5eb;
					}

					.pdf-disclaimer {
						background: #f8fafc;
						border-left: 3pt solid #94a3b8;
						padding: 10pt 12pt;
						margin-bottom: 12pt;
						border-radius: 0 4pt 4pt 0;
					}

					.pdf-disclaimer-title {
						font-size: 8pt;
						font-weight: 600;
						color: #64748b;
						margin: 0 0 4pt 0;
						text-transform: uppercase;
						letter-spacing: 0.5pt;
					}

					.pdf-disclaimer p {
						font-size: 7pt;
						color: #64748b;
						line-height: 1.5;
						margin: 0;
					}

					.pdf-footer-bottom {
						display: flex;
						justify-content: space-between;
						align-items: center;
						font-size: 7pt;
						color: #94a3b8;
					}

					.pdf-footer-contact {
						display: flex;
						gap: 15pt;
					}

					.pdf-footer-contact span {
						display: flex;
						align-items: center;
						gap: 4pt;
					}

					/* Page break control */
					.pdf-patient-card,
					.pdf-ai-block,
					.pdf-condition-detail,
					.pdf-disclaimer {
						page-break-inside: avoid;
						break-inside: avoid;
					}

					.pdf-conditions-table tr,
					.pdf-qa-table tr {
						page-break-inside: avoid;
						break-inside: avoid;
					}

					.pdf-section-header {
						page-break-after: avoid;
						break-after: avoid;
					}

					/* Print optimizations */
					@media print {
						.pdf-document {
							width: 100%;
							margin: 0;
							padding: 10mm;
						}

						.pdf-patient-card,
						.pdf-ai-block,
						.pdf-condition-detail {
							page-break-inside: avoid;
						}
					}
				</style>

				<!-- Header -->
				<div class="pdf-header">
					<div class="pdf-brand">
						<img src="/RapidCapsule.png" alt="RapidCapsule" class="pdf-logo" />
						<div class="pdf-brand-text">
							<h1>RapidCapsule</h1>
							<p>Digital Healthcare Solutions</p>
						</div>
					</div>
					<div class="pdf-report-meta">
						<div class="pdf-report-id">Report ID: ${reportId}</div>
						<div class="pdf-report-date">${formattedDateOnly}</div>
						<div class="pdf-report-time">${formattedTimeOnly}</div>
					</div>
				</div>

				<!-- Document Title -->
				<div class="pdf-doc-title">
					<h2>Health Assessment Report</h2>
				</div>

				<!-- Patient Information Card -->
				<div class="pdf-patient-card">
					<div class="pdf-patient-card-header">
						<div class="pdf-patient-icon">P</div>
						<h3>Patient Information</h3>
					</div>
					<div class="pdf-patient-grid">
						<div class="pdf-patient-field">
							<span class="pdf-field-label">Full Name</span>
							<span class="pdf-field-value">${patientProfile.first_name || 'N/A'} ${patientProfile.last_name || ''}</span>
						</div>
						<div class="pdf-patient-field">
							<span class="pdf-field-label">Gender</span>
							<span class="pdf-field-value">${patientProfile.gender || 'N/A'}</span>
						</div>
						<div class="pdf-patient-field">
							<span class="pdf-field-label">Email Address</span>
							<span class="pdf-field-value">${patientProfile.contact?.email || 'N/A'}</span>
						</div>
						<div class="pdf-patient-field">
							<span class="pdf-field-label">Phone Number</span>
							<span class="pdf-field-value">${formatPhoneNumber(patientProfile)}</span>
						</div>
						<div class="pdf-patient-field full-width">
							<span class="pdf-field-label">Address</span>
							<span class="pdf-field-value">${formatAddress(patientProfile)}</span>
						</div>
					</div>
				</div>

				<!-- Assessment Results Section -->
				<div class="pdf-section">
					<div class="pdf-section-header">
						<div class="pdf-section-icon results">R</div>
						<h3 class="pdf-section-title">Assessment Results</h3>
					</div>

					${allConditions.value.length > 0 ? `
						<div class="pdf-summary-stat">
							<p>${allConditions.value.length} possible condition${allConditions.value.length !== 1 ? 's' : ''} identified based on your reported symptoms</p>
						</div>

						<table class="pdf-conditions-table">
							<thead>
								<tr>
									<th style="text-align: center;">#</th>
									<th>Possible Condition</th>
									<th style="text-align: center;">Likelihood</th>
									<th style="text-align: center;">Priority</th>
								</tr>
							</thead>
							<tbody>
								${allConditions.value.map((condition, index) => {
									const prob = Math.round((condition.probability || 0) * 100);
									const priorityClass = index < 3 ? 'high' : index < 6 ? 'medium' : 'low';
									const priorityLabel = index < 3 ? 'High' : index < 6 ? 'Medium' : 'Low';
									return `
										<tr>
											<td class="pdf-rank">${index + 1}</td>
											<td class="pdf-condition-name">${condition.common_name || 'Unknown Condition'}</td>
											<td class="pdf-probability">
												<div class="pdf-prob-bar">
													<div class="pdf-prob-fill" style="width: ${prob}%"></div>
												</div>
												<span class="pdf-prob-text">${prob}%</span>
											</td>
											<td class="pdf-priority">
												<span class="pdf-priority-badge pdf-priority-${priorityClass}">${priorityLabel}</span>
											</td>
										</tr>
									`;
								}).join('')}
							</tbody>
						</table>
					` : `
						<div class="pdf-no-results">
							<h3>No Conditions Identified</h3>
							<p>Based on the information provided, no specific medical conditions were identified.<br/>This is generally a positive result indicating good health status.</p>
						</div>
					`}
				</div>

				<!-- AI Health Summary Section (if available) -->
				${claudeSummary.value?.content ? `
				<div class="pdf-section">
					<div class="pdf-section-header">
						<div class="pdf-section-icon ai">AI</div>
						<h3 class="pdf-section-title">AI Health Summary</h3>
						<span class="pdf-section-badge premium">Premium</span>
					</div>

					<div class="pdf-ai-summary">
						${claudeSummary.value.content.overview ? `
						<div class="pdf-ai-block">
							<h4>Overview</h4>
							<p>${claudeSummary.value.content.overview}</p>
						</div>
						` : ''}

						${claudeSummary.value.content.key_findings?.length ? `
						<div class="pdf-ai-block">
							<h4>Key Findings</h4>
							<ul>
								${claudeSummary.value.content.key_findings.map(finding => `<li>${finding}</li>`).join('')}
							</ul>
						</div>
						` : ''}

						${claudeSummary.value.content.possible_conditions_explained?.length ? `
						<div class="pdf-ai-block">
							<h4>Understanding Your Conditions</h4>
							${claudeSummary.value.content.possible_conditions_explained.map(cond => `
								<div class="pdf-condition-detail">
									<div class="pdf-condition-detail-header">
										<span class="pdf-condition-detail-name">${cond.condition}</span>
										<span class="pdf-urgency-badge pdf-urgency-${(cond.urgency || 'low').toLowerCase()}">${cond.urgency || 'Low'}</span>
									</div>
									<p class="pdf-condition-detail-text">${cond.explanation}</p>
								</div>
							`).join('')}
						</div>
						` : ''}

						${claudeSummary.value.content.recommendations?.length ? `
						<div class="pdf-ai-block">
							<h4>Recommendations</h4>
							<ul>
								${claudeSummary.value.content.recommendations.map(rec => `<li>${rec}</li>`).join('')}
							</ul>
						</div>
						` : ''}

						${claudeSummary.value.content.when_to_seek_care ? `
						<div class="pdf-ai-block">
							<h4>When to Seek Medical Care</h4>
							<p>${claudeSummary.value.content.when_to_seek_care}</p>
						</div>
						` : ''}

						${claudeSummary.value.content.lifestyle_tips?.length ? `
						<div class="pdf-ai-block">
							<h4>Wellness Tips</h4>
							<ul>
								${claudeSummary.value.content.lifestyle_tips.map(tip => `<li>${tip}</li>`).join('')}
							</ul>
						</div>
						` : ''}
					</div>
				</div>
				` : ''}

				<!-- Questions & Answers Section -->
				${answeredQuestions.value.length ? `
				<div class="pdf-section">
					<div class="pdf-section-header">
						<div class="pdf-section-icon qa">Q</div>
						<h3 class="pdf-section-title">Health Assessment Q&A</h3>
					</div>

					<div class="pdf-qa-container">
						<table class="pdf-qa-table">
							<thead>
								<tr>
									<th>Question</th>
									<th style="text-align: center;">Response</th>
									<th style="text-align: center;">Duration</th>
								</tr>
							</thead>
							<tbody>
								${answeredQuestions.value.map(qa => `
									<tr>
										<td class="pdf-qa-question">${qa.question}</td>
										<td class="pdf-qa-answer ${qa.answer === 'Yes' ? 'pdf-answer-yes' : qa.answer === 'No' ? 'pdf-answer-no' : 'pdf-answer-neutral'}">${qa.answer}</td>
										<td class="pdf-qa-duration">${qa.duration || '—'}</td>
									</tr>
								`).join('')}
							</tbody>
						</table>
					</div>
				</div>
				` : ''}

				<!-- Footer -->
				<div class="pdf-footer">
					<div class="pdf-disclaimer">
						<p class="pdf-disclaimer-title">Important Disclaimer</p>
						<p>This health assessment report is generated using AI-powered analysis and is intended for informational purposes only. It does not constitute medical advice, diagnosis, or treatment. The conditions listed are possibilities based on reported symptoms and should be verified by a qualified healthcare professional. Always consult with a doctor or medical specialist for proper diagnosis and treatment of any health concerns.</p>
					</div>
					<div class="pdf-footer-bottom">
						<span>© ${new Date().getFullYear()} RapidCapsule Healthcare. All rights reserved.</span>
						<div class="pdf-footer-contact">
							<span>rapidcapsule.com</span>
							<span>support@rapidcapsule.com</span>
						</div>
					</div>
				</div>
			</div>
		`;

		// Create a clean PDF document container
		const pdfContainer = document.createElement('div');
		pdfContainer.innerHTML = pdfDocumentHTML;

		// Configure PDF options with proper page break handling
		const options = {
			margin: [15, 10, 15, 10], // top, left, bottom, right in mm
			filename: `rapid-capsule-health-report-${new Date().toISOString().split('T')[0]}.pdf`,
			image: { type: 'jpeg', quality: 0.98 },
			html2canvas: {
				scale: 2,
				useCORS: true,
				letterRendering: true,
				allowTaint: false,
				logging: false,
				width: 190 * 3.78, // 190mm in pixels at 96dpi
				windowWidth: 190 * 3.78
			},
			jsPDF: {
				unit: 'mm',
				format: 'a4',
				orientation: 'portrait'
			},
			pagebreak: {
				mode: ['avoid-all', 'css', 'legacy'],
				before: '.page-break-before',
				after: '.page-break-after',
				avoid: ['.pdf-section', '.pdf-patient-card', '.pdf-ai-block', '.pdf-condition-detail', '.pdf-qa-table tr', '.pdf-conditions-table tr']
			}
		};

		// Store date for use in PDF generation callback
		const pdfDateString = formattedDateOnly;

		// Generate PDF with page numbers
		await html2pdf()
			.set(options)
			.from(pdfContainer)
			.toPdf()
			.get('pdf')
			.then((pdf) => {
				const totalPages = pdf.internal.getNumberOfPages();
				const pageWidth = pdf.internal.pageSize.getWidth();
				const pageHeight = pdf.internal.pageSize.getHeight();

				for (let i = 1; i <= totalPages; i++) {
					pdf.setPage(i);
					pdf.setFontSize(9);
					pdf.setTextColor(150);

					// Add page number at bottom center
					const pageText = 'Page ' + i + ' of ' + totalPages;
					const textWidth = pdf.getStringUnitWidth(pageText) * 9 / pdf.internal.scaleFactor;
					const xPos = (pageWidth - textWidth) / 2;

					pdf.text(pageText, xPos, pageHeight - 8);

					// Add header line on pages after first
					if (i > 1) {
						pdf.setDrawColor(196, 30, 58); // Brand color
						pdf.setLineWidth(0.5);
						pdf.line(10, 10, pageWidth - 10, 10);
						pdf.setFontSize(8);
						pdf.setTextColor(100);
						pdf.text('RapidCapsule Health Assessment Report', 10, 8);
						// Use the stored date variable
						const dateTextWidth = pdf.getStringUnitWidth(pdfDateString) * 8 / pdf.internal.scaleFactor;
						pdf.text(pdfDateString, pageWidth - 10 - dateTextWidth, 8);
					}
				}
			})
			.save();

		$toast.success('PDF downloaded successfully!');
	} catch (error) {
		console.error('PDF generation error:', error);
		$toast.error('Failed to generate PDF. Please try again.');
	}
};

// Share/Forward functionality
const shareReport = async () => {
	try {
		// Ensure AI summary is loaded if available
		if (!claudeSummary.value) {
			const existingSummary = recommendation.value?.claude_summary ||
									recommendation.value?.diagnosis?.claude_summary ||
									diagnosis.value?.claude_summary;
			if (existingSummary?.content) {
				claudeSummary.value = existingSummary;
			}
		}

		// If still no summary, try fetching from API
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
					console.log('Could not fetch Claude summary for share:', err.message);
				}
			}
		}

		const patientProfile = patientInfo.value;
		const checkupDate = recommendation.value.created_at || new Date().toISOString();
		const formattedDate = new Date(checkupDate).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});

		const patientName = `${patientProfile.first_name || ''} ${patientProfile.last_name || ''}`.trim() || 'Patient';
		const conditionsCount = allConditions.value.length;

		// Build comprehensive email body
		let emailBody = `HEALTH ASSESSMENT REPORT\n`;
		emailBody += `========================\n\n`;
		emailBody += `Patient: ${patientName}\n`;
		emailBody += `Date: ${formattedDate}\n\n`;

		// Add conditions summary
		if (allConditions.value.length > 0) {
			emailBody += `ASSESSMENT RESULTS\n`;
			emailBody += `------------------\n`;
			emailBody += `${conditionsCount} possible condition${conditionsCount !== 1 ? 's' : ''} identified:\n\n`;
			allConditions.value.slice(0, 5).forEach((condition, index) => {
				const prob = Math.round((condition.probability || 0) * 100);
				emailBody += `${index + 1}. ${condition.common_name} (${prob}% likelihood)\n`;
			});
			if (allConditions.value.length > 5) {
				emailBody += `   ...and ${allConditions.value.length - 5} more conditions\n`;
			}
			emailBody += `\n`;
		} else {
			emailBody += `ASSESSMENT RESULTS\n`;
			emailBody += `------------------\n`;
			emailBody += `No specific conditions identified - This is generally a positive result.\n\n`;
		}

		// Add AI Health Summary if available
		if (claudeSummary.value?.content) {
			emailBody += `AI HEALTH SUMMARY\n`;
			emailBody += `-----------------\n`;

			if (claudeSummary.value.content.overview) {
				emailBody += `Overview:\n${claudeSummary.value.content.overview}\n\n`;
			}

			if (claudeSummary.value.content.key_findings?.length) {
				emailBody += `Key Findings:\n`;
				claudeSummary.value.content.key_findings.forEach(finding => {
					emailBody += `• ${finding}\n`;
				});
				emailBody += `\n`;
			}

			if (claudeSummary.value.content.recommendations?.length) {
				emailBody += `Recommendations:\n`;
				claudeSummary.value.content.recommendations.forEach(rec => {
					emailBody += `• ${rec}\n`;
				});
				emailBody += `\n`;
			}

			if (claudeSummary.value.content.when_to_seek_care) {
				emailBody += `When to Seek Care:\n${claudeSummary.value.content.when_to_seek_care}\n\n`;
			}
		}

		// Add Q&A Summary if available
		if (answeredQuestions.value.length > 0) {
			emailBody += `HEALTH ASSESSMENT Q&A\n`;
			emailBody += `---------------------\n`;
			answeredQuestions.value.slice(0, 10).forEach(qa => {
				emailBody += `Q: ${qa.question}\n`;
				emailBody += `A: ${qa.answer}${qa.duration ? ` (${qa.duration})` : ''}\n\n`;
			});
			if (answeredQuestions.value.length > 10) {
				emailBody += `...and ${answeredQuestions.value.length - 10} more questions\n\n`;
			}
		}

		// Add footer
		emailBody += `------------------------\n`;
		emailBody += `View full report: ${window.location.href}\n\n`;
		emailBody += `DISCLAIMER: This report is for informational purposes only and does not constitute medical advice. Please consult a healthcare professional for proper diagnosis and treatment.\n\n`;
		emailBody += `Generated by RapidCapsule Healthcare\n`;
		emailBody += `https://rapidcapsule.com`;

		const shareData = {
			title: 'Health Assessment Report - RapidCapsule',
			text: emailBody,
			url: window.location.href
		};

		// Check if Web Share API is available (mobile)
		if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
			await navigator.share(shareData);
			$toast.success('Report shared successfully!');
		} else {
			// Desktop: Create email link
			const subject = encodeURIComponent(`Health Assessment Report - ${patientName} - ${formattedDate}`);
			const body = encodeURIComponent(emailBody);
			const mailtoLink = `mailto:?subject=${subject}&body=${body}`;

			// Open email client
			window.open(mailtoLink, '_blank');
			$toast.success('Email client opened. Please complete sending.');
		}
	} catch (error) {
		if (error.name !== 'AbortError') {
			console.error('Share error:', error);
			$toast.error('Failed to share report. Please try again.');
		}
	}
};

</script>

<style lang="scss" scoped>
.considered-diagnoses-list {
    margin-top: $size-16;
    width: 100%;
    
    .diagnoses-list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $size-12 0 $size-8 0;
        border-bottom: 1px solid $color-g-90;
        margin-bottom: $size-12;
        
        .diagnoses-list-title {
            font-size: $size-14;
            font-weight: $fw-medium;
            color: $color-g-44;
        }
        
        .header-controls {
            display: flex;
            align-items: center;
            gap: $size-16;
        }
        
        .pagination-controls {
            display: flex;
            align-items: center;
            gap: $size-8;
            
            .pagination-btn {
                background: none;
                border: 1px solid $color-g-90;
                border-radius: $size-4;
                padding: $size-4 $size-8;
                font-size: $size-12;
                color: $color-g-44;
                cursor: pointer;
                transition: all 0.2s ease;
                
                &:hover:not(:disabled) {
                    background-color: $color-g-95;
                    border-color: $color-g-85;
                }
                
                &:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            }
            
            .pagination-info {
                font-size: $size-12;
                color: $color-g-54;
                white-space: nowrap;
            }
        }
        
        .diagnoses-collapse-btn {
            background: none;
            border: none;
            color: #4FC3F7;
            font-size: $size-12;
            cursor: pointer;
            padding: $size-4 $size-8;
            border-radius: $size-4;

            &:hover {
                background-color: rgba(79, 195, 247, 0.1);
            }
        }
    }
    
    .diagnoses-list-content {
        display: flex;
        flex-direction: column;
        gap: $size-12;
        
        .diagnosis-condition-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: $size-8 0;
            border-bottom: 1px solid $color-g-95;
            
            &:last-child {
                border-bottom: none;
            }
            
            .condition-name {
                font-weight: $fw-regular;
                font-size: $size-14;
                color: $color-black;
                flex: 1;
            }
            
            .condition-probability {
                font-weight: $fw-medium;
                color: #4FC3F7;
                font-size: $size-12;
            }
        }
    }
    
    .diagnoses-list-actions {
        padding: $size-16 0 $size-8 0;
        display: flex;
        justify-content: center;
        align-items: center;
        
        .show-more-btn {
            background: none;
            border: 1px solid #4FC3F7;
            color: #4FC3F7;
            padding: $size-8 $size-16;
            border-radius: $size-4;
            font-size: $size-14;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: $fw-medium;

            &:hover:not(:disabled) {
                background-color: #4FC3F7;
                color: white;
            }
            
            &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        }
        
        .info-message {
            font-size: $size-12;
            color: $color-g-54;
            font-style: italic;
            text-align: center;
        }
    }
    
    .diagnoses-list-footer {
        padding: $size-12 0 $size-4 0;
        border-top: 1px solid $color-g-95;
        margin-top: $size-12;
        
        .pagination-summary {
            font-size: $size-12;
            color: $color-g-54;
            text-align: center;
        }
    }
    
    // Responsive design for mobile
    @include responsive(phone) {
        .diagnoses-list-header {
            .header-controls {
                gap: $size-8;
                
                .pagination-controls {
                    .pagination-info {
                        font-size: $size-12;
                    }
                    
                    .pagination-btn {
                        padding: $size-3 $size-6;
                        font-size: $size-12;
                    }
                }
                
                .diagnoses-collapse-btn {
                    font-size: $size-12;
                    padding: $size-3 $size-6;
                }
            }
        }
        
        .diagnoses-list-footer .pagination-summary {
            font-size: $size-12;
        }
    }
}

.diagnosis-button {
    background: none !important;
    border: none !important;
    padding: 0 !important;
    margin: 0 !important;
    font-family: inherit !important;
    font-size: inherit !important;
    font-weight: inherit !important;
    line-height: inherit !important;
    color: inherit !important;
    text-decoration: none !important;
    cursor: pointer !important;
    outline: none !important;
    
    &:hover {
        color: #4FC3F7 !important;
        text-decoration: underline !important;
    }
    
    &:focus {
        outline: 1px dotted #666;
        outline-offset: 2px;
    }
}

.page-content {
	display: flex;
	flex-direction: column;
	gap: $size-12;
	width: 100%;
	height: 100vh;

	&__body {
		display: flex;
		flex-direction: column;
		gap: $size-26;
		width: 100%;
		height: 100%;
		overflow-y: scroll;
		padding: $size-0 $size-48;

		&::-webkit-scrollbar {
			display: none;
			width: 12px;
			background-color: $color-g-97;
		}
	}
}

.diagnosis-container {
    width: 100%;
    position: relative;
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-end;
    flex: 1;
    gap: 36px;
    margin-bottom: 50px;
    margin-top: 20px;

    @include responsive(tab-portrait) {
        margin-bottom: 0;
        margin-top: 0;
    }
    @include responsive(phone) {
        margin-bottom: 100px;
        margin-top: 0;
    }

	.action-buttons {
		position: absolute;
		top: $size-16;
		right: $size-16;
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: $size-12;
		z-index: 10;

		@include responsive(phone) {
			position: relative;
			top: auto;
			right: auto;
			justify-content: center;
			margin-bottom: $size-16;
		}
	}

	.content-section {
        width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
        flex: 1;
		gap: $size-24;

        @include responsive(tab-portrait) {
            flex-direction: column;
        }
        @include responsive(phone) {
            padding-bottom: 50px;
        }

		.content-left-section {
			display: flex;
			flex-direction: column;
			align-items: flex-start;
            flex: 0.4;
			gap: $size-32;
			background: $color-white;
			padding: $size-32 $size-40;
			border-radius: $size-24;

            @include responsive(tab-portrait) {
                padding: 0;
            }
            @include responsive(phone) {
                display: flex !important;
                padding: $size-32 $size-32;
                flex: 1;
                order: 2;
            }

			.content-left-section__heading {
				font-weight: $fw-semi-bold;
				font-size: $size-20;
				line-height: 22px;
				color: $color-g-54;
				border-bottom: 1px solid $color-g-85;
				padding-bottom: $size-8;
				width: 100%;
			}
			.content-left-section__body {
				display: flex;
				flex-direction: column;
				align-items: flex-start;
				gap: $size-32;

				.left-section__body--top-section {
					display: flex;
					flex-direction: column;
					align-items: flex-start;
					gap: $size-16;

					.left-section__body--title {
						font-weight: $fw-semi-bold;
						font-size: $size-20;
						line-height: 22px;
						color: $color-g-21;
					}
					.left-section__body--description {
						font-weight: $fw-regular;
						font-size: $size-16;
						color: $color-g-54;
						line-height: 24px;
						text-align: left;
					}
				}
				.left-section-content__results--bottom-section {
					width: 100%;
					display: flex;
					flex-direction: column;
					gap: $size-16;

					.left-section-content__results--most-likely {
						width: 100%;
						display: flex;
						flex-direction: column;
						justify-content: space-between;
						align-items: center;
						gap: $size-8;
						background: $color-white;

						.left-section-content__most-likely {
							width: 100%;
							display: flex;
							justify-content: space-between;
							align-items: center;
							border: 1px solid $color-pri-t4;
							border-radius: $size-12;
							padding: $size-8 $size-16;

							.left-section-content__most-likely--item {
								display: flex;
								flex-direction: column;
								justify-content: flex-start;
								align-items: flex-start;
								gap: $size-2;
								
								.left-section-content__most-likely--title {
									font-weight: $fw-semi-bold;
									font-size: $size-16;
									line-height: 22px;
									color: $color-black;
								}
								.left-section-content__most-likely--title-2 {
									font-weight: $fw-semi-bold;
									font-size: $size-16;
									line-height: 22px;
									color: $color-g-44;
								}
								.left-section-content__most-likely-desc {
									font-weight: $fw-regular;
									font-size: $size-16;
									line-height: 22px;
									color: $color-g-44;
								}
								.left-section-content__most-likely-desc-2 {
									font-weight: $fw-regular;
									font-size: $size-16;
									line-height: 22px;
									color: $color-g-54;
								}
							}
							.left-section-content__most-likely--status-1 {
								width: 12px;
								height: 12px;
								border-radius: 100%;
								background: $color-denote-red;
							}
							.left-section-content__most-likely--status-2 {
								width: 12px;
								height: 12px;
								border-radius: 100%;
								background: #FBB500;
							}
							.left-section-content__most-likely--status-3 {
								width: 12px;
								height: 12px;
								border-radius: 100%;
								background: $color-g-77;
							}
						}
					}
                    .left-section-content__results--less-likely {
                        .left-section-body__accordian {
                            & :deep(.accordian__head) {
                                padding: $size-16 $size-0 !important;
                
                                span, svg {
                                    color: $color-sec-s1 !important;
                                    fill: $color-sec-s1 !important;
                                    font-weight: $fw-regular;
                                    font-size: $size-16;
                                    line-height: 24px;
                                }
                            }
                        }
                        .left-section-body__accordian {
                            & :deep(.accordian__body) {
                                margin: 0 !important;
                                margin-top: 24px !important;
                            }
                        }
                    }
				}
			}
		}
        .content-right-section {
            display: flex;
            flex-direction: column;
            flex: 0.6;
            gap: $size-24;

            @include responsive(tab-portrait) {
                width: 100% !important;
                flex: 1;
                order: 1;
            }
            @include responsive(phone) {
                display: flex !important;
                flex: 1;
                order: 1;
            }
        
            .right-section-recommendation {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                // gap: $size-32;
                background: $color-white;
                padding: $size-32;
                border-radius: $size-24;

                .section-recommendation__heading {
                    font-weight: $fw-semi-bold;
                    font-size: $size-20;
                    line-height: 22px;
                    color: $color-g-54;
                    border-bottom: 1px solid $color-g-85;
                    padding-bottom: $size-8;
                    width: 100%;
                }
                .section-recommendation__body {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: flex-end;

                    @include responsive(phone) {
                        gap: $size-32;
                        align-items: center;
                    }

                    .triage-banner {
                        display: flex;
                        align-items: flex-start;
                        gap: $size-16;
                        padding: $size-20;
                        border-radius: $size-16;
                        border-left: 4px solid;
                        margin-bottom: $size-24;
                        width: 100%;

                        @include responsive(phone) {
                            padding: $size-16;
                            gap: $size-12;
                        }

                        &__icon {
                            flex-shrink: 0;

                            svg {
                                width: 28px;
                                height: 28px;

                                @include responsive(phone) {
                                    width: 24px;
                                    height: 24px;
                                }
                            }
                        }

                        &__content {
                            flex: 1;
                        }

                        &__title {
                            font-weight: $fw-bold;
                            font-size: $size-18;
                            line-height: 1.3;
                            margin: 0 0 $size-8 0;

                            @include responsive(phone) {
                                font-size: $size-16;
                            }
                        }

                        &__description {
                            font-size: $size-14;
                            line-height: 1.5;
                            color: $color-g-44;
                            margin: 0;

                            @include responsive(phone) {
                                font-size: $size-13;
                            }
                        }
                    }

                    .recommendation-body-content {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        gap: $size-16;

                        @include responsive(phone) {
                            flex-direction: column;
                        }

                        .recommendation-body-content__info {
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: flex-start;
                            gap: $size-16;

                            .recommendation-info__header {
                                font-weight: $fw-semi-bold;
                                font-size: $size-28;
                                line-height: 32px;
                                color: $color-g-21;

                                @include responsive(phone) {
                                    text-align: center;
                                }
                            }
                            .recommendation-info__description {
                                font-weight: $fw-regular;
                                font-size: $size-16;
                                line-height: 24px;
                                color: $color-g-21;

                                @include responsive(phone) {
                                    text-align: center;
                                }
                            }
                        }
                    }
                    .recommendation-body-action {
                        border: 1px solid $color-black;
                        :deep(p) {
                            color: $color-black !important;
                            font-size: $size-16;
                            font-weight: $fw-regular;
                            line-height: 24px;
                        }
                        @include responsive(phone) {
                            width: 100%;
                        }
                    }
                }
            }
            .right-section-summary {
                width: 100%;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: $size-32;
                background: $color-white;
                padding: $size-32;
                border-radius: $size-24;

                @include responsive(tab-portrait) {
                    padding: 0;
                }
                 @include responsive(phone) {
                   padding: $size-32;
                }

                .section-summary__heading {
                    font-weight: $fw-semi-bold;
                    font-size: $size-20;
                    line-height: 22px;
                    color: $color-g-54;
                    border-bottom: 1px solid $color-g-85;
                    padding-bottom: $size-8;
                    width: 100%;
                }
                .section-summary__body {
                    width: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: $size-32;

                    .section-summary-body__heading {
                        font-weight: $fw-semi-bold;
                        font-size: $size-20;
                        line-height: 22px;
                        color: $color-g-21;
                    }
                    .right-section-body__accordian {
                        width: 100%;

                        & :deep(.accordian__head) {
                            padding: $size-16 $size-0 !important;

                            span, svg {
                                color: $color-black !important;
                                fill: $color-black !important;
                                font-weight: $fw-semi-bold !important;
                                font-size: $size-16;
                                line-height: 24px;

                            }
                        }
                        & .accordian__body {
                            margin-top: 24px !important;
                        }
                    }
                    .section-summary-diagnosis {
                        width: 100%;
                        display: flex;
                        flex-direction: column;
                        gap: $size-32;

                        .section-summary-diagnosis__item {
                            width: 100%;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;

                            .section-summary-diagnosis__key {
                                font-weight: $fw-regular;
                                font-size: $size-16;
                                line-height: 24px;
                                color: $color-black;
                            }
                            .section-summary-diagnosis__value {
                                font-weight: $fw-semi-bold;
                                font-size: $size-18;
                                line-height: 22px;
                                color: $color-black;
                            }
                        }
                    }
                }
                .right-section-summary__action {
                    width: 100%;
                    margin-top: 16px;
                }
            }
            .tab-summary-recommendation {
                width: 100%;
                display: none;
                flex-direction: column;
                align-items: flex-start;
                gap: $size-32;
                background: $color-white;
                padding: $size-32;
                border-radius: $size-24;

                @include responsive(tab-portrait) {
                    display: flex !important;
                }
                @include responsive(phone) {
                    display: none !important;
                }

                .default-tabs {
                    width: 100%;
                }
                .tabs-summary-recommendation__content {
                    width: 100%;
                }
            }
        }
	}
}
:deep(.summary-section-desktop) {
    margin-bottom: 50px;

    @include responsive(tab-portrait) {
        display: none !important;
    }
    @include responsive(phone) {
        display: flex !important;
        margin-bottom: 0;
    }
}
:deep(.recommendation-localhospital-icon) {
    // background: #D12A05;
    @include responsive(phone) {
        // width: 100% !important;
    }
}

// Q&A Summary Section Styles
.qa-summary-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid $color-g-85;
}

.qa-accordian {
    width: 100%;

    & :deep(.accordian__head) {
        padding: $size-12 $size-0 !important;
        background: transparent;

        span, svg {
            color: $color-black !important;
            fill: $color-black !important;
            font-weight: $fw-semi-bold !important;
            font-size: $size-16;
            line-height: 24px;
        }
    }

    & :deep(.accordian__body) {
        margin-top: 16px !important;
    }
}

.qa-header {
    font-weight: 600;
    font-size: 16px;
    color: #333;
}

.qa-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.qa-description {
    font-size: 14px;
    color: #666;
    line-height: 1.5;
}

.qa-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 8px;

    &::-webkit-scrollbar {
        width: 4px;
    }

    &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
    }
}

.qa-item {
    padding: 12px;
    background: #f8f9fa;
    border-radius: 8px;
    border-left: 4px solid #e1e5e9;
    transition: all 0.2s ease;

    &:hover {
        background: #f0f2f5;
    }
}

.qa-question {
    font-size: 14px;
    color: #333;
    margin-bottom: 6px;
    font-weight: 500;
    line-height: 1.4;
}

.qa-answer {
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;

    &.answer-yes {
        color: #28a745;
    }

    &.answer-no {
        color: #dc3545;
    }

    &.answer-neutral {
        color: #6c757d;
    }
}

.qa-duration-tag {
    background: #e3f2fd;
    color: #1976d2;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
}

@include responsive(phone) {
    .qa-list {
        max-height: 300px;
    }

    .qa-item {
        padding: 10px;
    }

    .qa-question {
        font-size: 13px;
    }

    .qa-answer {
        font-size: 12px;
    }
}

// Health Summary Premium Styles
.health-summary-premium-section {
    margin-top: 20px;
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    overflow: hidden;
}

.health-summary-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
        background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%);
    }
}

.health-summary-header__left {
    display: flex;
    align-items: center;
    gap: 12px;
}

.health-summary-icon {
    width: 24px;
    height: 24px;
    color: #059669;
}

.health-summary-title {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

.health-summary-badge {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    color: white;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

.health-summary-chevron {
    width: 20px;
    height: 20px;
    color: #6b7280;
    transition: transform 0.3s ease;
}

.chevron-rotated {
    transform: rotate(180deg);
}

.health-summary-content {
    padding: 20px;
    border-top: 1px solid #e5e7eb;
    background: #fff;
}

.health-summary-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
    gap: 16px;

    p {
        color: #6b7280;
        font-size: 14px;
    }
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #059669;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.health-summary-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 20px;
    gap: 12px;
    text-align: center;

    p {
        color: #dc2626;
        font-size: 14px;
    }
}

.health-summary-body {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.summary-block {
    h4 {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 2px solid #059669;
        display: inline-block;
    }

    p {
        font-size: 14px;
        line-height: 1.6;
        color: #4b5563;
        margin: 0;
    }

    ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
            position: relative;
            padding-left: 18px;
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.5;
            color: #4b5563;

            &:before {
                content: "";
                position: absolute;
                left: 0;
                top: 8px;
                width: 6px;
                height: 6px;
                background: #059669;
                border-radius: 50%;
            }
        }
    }
}

.overview-block {
    background: #f0fdf4;
    padding: 16px;
    border-radius: 8px;
    border-left: 4px solid #059669;
}

.seek-care-block {
    background: #fef2f2;
    padding: 16px;
    border-radius: 8px;
    border-left: 4px solid #dc2626;

    h4 {
        border-bottom-color: #dc2626;
    }
}

.condition-detail-card {
    background: #f9fafb;
    padding: 14px 16px;
    border-radius: 8px;
    margin-bottom: 10px;
    border: 1px solid #e5e7eb;

    &:last-child {
        margin-bottom: 0;
    }
}

.condition-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    flex-wrap: wrap;
    gap: 8px;
}

.condition-detail-name {
    font-weight: 600;
    font-size: 14px;
    color: #1f2937;
}

.condition-urgency-tag {
    font-size: 10px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 12px;
    text-transform: uppercase;
}

.urgency-emergency {
    background: #fef2f2;
    color: #b91c1c;
}

.urgency-urgent {
    background: #fff7ed;
    color: #c2410c;
}

.urgency-soon {
    background: #eff6ff;
    color: #1d4ed8;
}

.urgency-routine {
    background: #f0fdf4;
    color: #15803d;
}

.condition-detail-explanation {
    font-size: 13px;
    line-height: 1.5;
    color: #6b7280;
    margin: 0;
}

.health-summary-disclaimer {
    background: #f9fafb;
    padding: 14px 16px;
    border-radius: 8px;
    border: 1px dashed #d1d5db;
    margin-top: 8px;

    p {
        font-size: 12px;
        color: #6b7280;
        line-height: 1.5;
        margin: 0;
        font-style: italic;
    }
}

.health-summary-credits {
    font-size: 12px;
    color: #059669;
    background: #ecfdf5;
    padding: 3px 8px;
    border-radius: 12px;
    margin-left: 8px;
}

.health-summary-purchase-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px;
    background: linear-gradient(135deg, #fef3c7 0%, #fff7ed 100%);
    border-radius: 12px;
    border: 1px solid #fcd34d;

    .purchase-prompt-icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;

        svg {
            width: 24px;
            height: 24px;
            color: white;
        }
    }

    h4 {
        font-size: 18px;
        font-weight: 600;
        color: #92400e;
        margin: 0 0 8px 0;
    }

    p {
        font-size: 14px;
        color: #78350f;
        line-height: 1.5;
        margin: 0 0 12px 0;
        max-width: 400px;
    }

    .purchase-prompt-info {
        font-size: 12px;
        color: #a16207;
        margin-bottom: 16px;
    }
}

.purchase-plans-quick {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
    justify-content: center;
}

.quick-plan-card {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 100px;

    &:hover {
        border-color: #059669;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15);
    }

    .plan-name {
        font-size: 12px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 4px;
    }

    .plan-price {
        font-size: 16px;
        font-weight: 700;
        color: #059669;
        margin-bottom: 2px;
    }

    .plan-desc {
        font-size: 10px;
        color: #6b7280;
    }
}

// Purchase Modal Styles
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
    animation: modalFadeIn 0.2s ease;
}

@keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes modalSlideUp {
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
    animation: modalSlideUp 0.3s ease;

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
                margin: 0 (-$size-4) (-$size-4);
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
    }
}

@include responsive(phone) {
    .health-summary-header {
        padding: 14px 16px;
    }

    .health-summary-credits {
        font-size: 10px;
        padding: 2px 6px;
    }

    .health-summary-purchase-prompt {
        padding: 16px;

        h4 {
            font-size: 16px;
        }

        p {
            font-size: 13px;
        }
    }

    .purchase-plans-quick {
        flex-direction: column;
        width: 100%;
    }

    .quick-plan-card {
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
    }

    .health-summary-title {
        font-size: 14px;
    }

    .health-summary-badge {
        font-size: 9px;
        padding: 2px 8px;
    }

    .health-summary-content {
        padding: 16px;
    }

    .condition-detail-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .summary-block {
        h4 {
            font-size: 13px;
        }

        p, ul li {
            font-size: 13px;
        }
    }
}

// Wallet Balance Display
.wallet-balance-display {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 1px solid #7dd3fc;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .wallet-info {
        display: flex;
        align-items: center;
        gap: 12px;

        .wallet-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
        }

        .wallet-details {
            .wallet-label {
                font-size: 12px;
                color: #64748b;
                font-weight: 500;
            }

            .wallet-amount {
                font-size: 20px;
                font-weight: 700;
                color: #0369a1;
            }
        }
    }
}

// Confirmation View Styles
.confirmation-view {
    padding: 8px;

    .confirmation-header {
        text-align: center;
        margin-bottom: 24px;

        .confirmation-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
            font-size: 28px;
        }

        h3 {
            font-size: 20px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
        }

        p {
            font-size: 14px;
            color: #6b7280;
        }
    }

    .confirmation-details {
        background: #f9fafb;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;

        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;

            &:last-child {
                border-bottom: none;
                padding-bottom: 0;
            }

            &:first-child {
                padding-top: 0;
            }

            .detail-label {
                font-size: 14px;
                color: #6b7280;
            }

            .detail-value {
                font-size: 14px;
                font-weight: 600;
                color: #1f2937;

                &.plan-name {
                    color: #059669;
                }

                &.amount {
                    font-size: 18px;
                    color: #dc2626;
                }

                &.wallet-balance {
                    color: #0369a1;
                }

                &.balance-after {
                    color: #059669;
                }

                &.insufficient {
                    color: #dc2626;
                }
            }
        }
    }

    .insufficient-warning {
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 12px;

        .warning-icon {
            font-size: 20px;
        }

        p {
            font-size: 13px;
            color: #991b1b;
            margin: 0;
        }
    }

    .confirmation-actions {
        display: flex;
        gap: 12px;

        .back-button, .confirm-button {
            flex: 1;
            padding: 14px 20px;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
        }

        .back-button {
            background: #f3f4f6;
            color: #4b5563;

            &:hover {
                background: #e5e7eb;
            }
        }

        .confirm-button {
            background: linear-gradient(135deg, #059669 0%, #047857 100%);
            color: white;

            &:hover:not(:disabled) {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
            }

            &:disabled {
                background: #d1d5db;
                cursor: not-allowed;
            }
        }
    }
}

@include responsive(phone) {
    .wallet-balance-display {
        padding: 12px;

        .wallet-info {
            .wallet-icon {
                width: 36px;
                height: 36px;
                font-size: 18px;
            }

            .wallet-details {
                .wallet-amount {
                    font-size: 18px;
                }
            }
        }
    }

    .confirmation-view {
        .confirmation-header {
            .confirmation-icon {
                width: 50px;
                height: 50px;
                font-size: 24px;
            }

            h3 {
                font-size: 18px;
            }
        }

        .confirmation-actions {
            flex-direction: column;
        }
    }
}
</style>

<style scoped lang="scss">
:deep(.modal) {
	max-width: 100% !important;
	max-height: 100% !important;

	@include responsive(tab-portrait) {
		min-width: 90% !important;
		max-width: 90% !important;
	}
	@include responsive(tab-landscape) {
		min-width: 90% !important;
		max-width: 90% !important;
	}
	@include responsive(phone) {
		min-width: 100% !important;
		max-width: 100% !important;
	}
}
:deep(.modal__body) {
	padding: 0 !important;
	// overflow: hidden !important;
}

:deep(.modal__footer) {
	position: relative !important;
	display: flex;
	justify-content: center !important;
	align-items: center;
}

.action-button {
	display: flex;
	justify-content: space-between;
	position: relative;

	@include responsive(phone) {
		flex-direction: column;
		margin: 0;
		gap: $size-16;
		width: 100%;
	}
}
.multiple-btn {
	width: 100%;
}
.btn-float-right {
	justify-content: flex-end;
	width: 100%;
}
</style>