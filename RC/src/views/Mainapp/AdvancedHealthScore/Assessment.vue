<template>
  <div class="assessment-page">
    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-background">
        <div class="hero-pattern"></div>
      </div>
      <div class="hero-content">
        <router-link to="/app/patient/advanced-health-score" class="back-link">
          <v-icon name="hi-arrow-left" scale="0.9" />
          Back
        </router-link>
        <div class="hero-main">
          <div class="hero-text">
            <div class="hero-badge">
              <v-icon name="hi-clipboard-list" scale="0.9" />
              <span>Health Assessment</span>
            </div>
            <h1>Answer Health Questions</h1>
            <p class="hero-subtitle">Complete all questions across 6 health domains to receive your personalized AI health report.</p>
          </div>
          <div class="hero-stats">
            <div class="stat">
              <div class="stat-icon">
                <v-icon name="hi-collection" scale="1" />
              </div>
              <div class="stat-info">
                <span class="stat-value">6</span>
                <span class="stat-label">Domains</span>
              </div>
            </div>
            <div class="stat">
              <div class="stat-icon">
                <v-icon name="hi-question-mark-circle" scale="1" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ totalQuestions || 25 }}</span>
                <span class="stat-label">Questions</span>
              </div>
            </div>
            <div class="stat">
              <div class="stat-icon">
                <v-icon name="hi-clock" scale="1" />
              </div>
              <div class="stat-info">
                <span class="stat-value">~5</span>
                <span class="stat-label">Minutes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Previous Answers Banner -->
    <div v-if="previousAnswers && !loadingQuestions && !error" class="previous-answers-banner">
      <div class="banner-icon">
        <v-icon name="hi-clock" scale="1.1" />
      </div>
      <div class="banner-content">
        <h4>Previous answers pre-filled</h4>
        <p>Your responses from {{ formatPreviousDate() }} have been loaded. Review and update any answers that have changed.</p>
      </div>
      <button class="clear-btn" @click="clearPreviousAnswers">
        <v-icon name="hi-refresh" scale="0.9" />
        Start Fresh
      </button>
    </div>

    <!-- Loading Questions -->
    <div v-if="loadingQuestions" class="loading-state">
      <div class="spinner"></div>
      <p>Loading assessment questions...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <v-icon name="hi-exclamation-circle" scale="2" />
      <p>{{ error }}</p>
      <button @click="loadQuestions" class="retry-btn">Try Again</button>
    </div>

    <!-- Assessment Wizard -->
    <div v-else class="assessment-wizard">
      <!-- Progress Bar -->
      <div class="progress-section">
        <div class="progress-info">
          <span class="domain-label">{{ currentDomainLabel }}</span>
          <span class="progress-text">{{ displayedProgress }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="domain-dots">
          <div
            v-for="(domain, idx) in domainKeys"
            :key="domain"
            class="domain-dot"
            :class="{
              active: idx === currentDomainIndex,
              completed: isDomainVisuallyCompleted(domain, idx),
            }"
            @click="goToDomain(idx)"
          >
            <span class="dot-number">{{ idx + 1 }}</span>
          </div>
        </div>
      </div>

      <!-- Current Question -->
      <div class="question-card" v-if="currentQuestion" :class="{ 'has-previous': hasPreviousAnswer(currentQuestion._id), 'answer-changed': wasAnswerChanged(currentQuestion._id) }">
        <div class="question-header">
          <div class="question-number">Question {{ currentQuestionIndex + 1 }}</div>
          <div v-if="hasPreviousAnswer(currentQuestion._id)" class="previous-indicator" :class="{ changed: wasAnswerChanged(currentQuestion._id) }">
            <v-icon :name="wasAnswerChanged(currentQuestion._id) ? 'hi-pencil' : 'hi-check-circle'" scale="0.8" />
            <span v-if="wasAnswerChanged(currentQuestion._id)">Updated</span>
            <span v-else>Previously answered</span>
          </div>
        </div>
        <h2 class="question-text">{{ currentQuestion.question_text }}</h2>
        <p v-if="currentQuestion.help_text" class="help-text">
          <v-icon name="hi-information-circle" scale="0.9" />
          {{ currentQuestion.help_text }}
        </p>

        <!-- Yes/No Question -->
        <div v-if="currentQuestion.question_type === 'yes_no'" class="options-grid yes-no">
          <button
            v-for="option in currentQuestion.options"
            :key="option.value"
            class="option-btn"
            :class="{ selected: answers[currentQuestion._id] === option.value }"
            @click="selectAnswer(currentQuestion._id, option.value, option.label)"
          >
            <v-icon :name="option.value.toLowerCase() === 'yes' ? 'hi-check-circle' : 'hi-x-circle'" scale="1.2" />
            {{ option.label }}
          </button>
        </div>

        <!-- Single Choice -->
        <div v-else-if="currentQuestion.question_type === 'single_choice'" class="options-list">
          <button
            v-for="option in currentQuestion.options"
            :key="option.value"
            class="option-btn"
            :class="{ selected: answers[currentQuestion._id] === option.value }"
            @click="selectAnswer(currentQuestion._id, option.value, option.label)"
          >
            <span class="radio-circle"></span>
            {{ option.label }}
          </button>
        </div>

        <!-- Multiple Choice -->
        <div v-else-if="currentQuestion.question_type === 'multiple_choice'" class="options-list multi">
          <button
            v-for="option in currentQuestion.options"
            :key="option.value"
            class="option-btn"
            :class="{ selected: isMultiSelected(currentQuestion._id, option.value) }"
            @click="toggleMultiAnswer(currentQuestion._id, option.value, option.label)"
          >
            <span class="checkbox-square">
              <v-icon v-if="isMultiSelected(currentQuestion._id, option.value)" name="hi-check" scale="0.8" />
            </span>
            {{ option.label }}
          </button>
        </div>

        <!-- Scale -->
        <div v-else-if="currentQuestion.question_type === 'scale'" class="scale-input">
          <div class="scale-labels">
            <span>{{ currentQuestion.scale_config?.min_label || 'Low' }}</span>
            <span>{{ currentQuestion.scale_config?.max_label || 'High' }}</span>
          </div>
          <div class="scale-buttons">
            <button
              v-for="n in getScaleRange(currentQuestion)"
              :key="n"
              class="scale-btn"
              :class="{ selected: answers[currentQuestion._id] === n }"
              @click="selectAnswer(currentQuestion._id, n, String(n))"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <!-- Text -->
        <div v-else-if="currentQuestion.question_type === 'text'" class="text-input">
          <textarea
            v-model="textAnswers[currentQuestion._id]"
            @blur="selectAnswer(currentQuestion._id, textAnswers[currentQuestion._id], textAnswers[currentQuestion._id])"
            placeholder="Type your answer here..."
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- Navigation -->
      <div class="navigation">
        <button
          class="nav-btn prev"
          :disabled="currentQuestionIndex === 0"
          @click="prevQuestion"
        >
          <v-icon name="hi-chevron-left" scale="1" />
          Previous
        </button>

        <button
          v-if="!isLastQuestion"
          class="nav-btn next"
          :disabled="!isCurrentAnswered"
          @click="nextQuestion"
        >
          Next
          <v-icon name="hi-chevron-right" scale="1" />
        </button>

        <button
          v-else
          class="nav-btn submit"
          :disabled="!allAnswered"
          @click="proceedToCheckupConfirm"
        >
          Continue
          <v-icon name="hi-arrow-right" scale="1" />
        </button>
      </div>
    </div>

    <!-- Health Checkup Confirmation Modal -->
    <div v-if="showCheckupConfirmModal" class="modal-overlay" @click.self="showCheckupConfirmModal = false">
      <div class="checkup-confirm-modal">
        <div class="checkup-modal-header">
          <h3>Review Recent Health Checkups</h3>
          <p>We found recent health checkups that can be included in your assessment for more accurate results.</p>
        </div>

        <div v-if="loadingCheckups" class="checkup-loading">
          <div class="spinner"></div>
          <span>Loading your health checkups...</span>
        </div>

        <div v-else-if="relevantCheckups.length === 0" class="no-checkups">
          <v-icon name="hi-clipboard-check" scale="2" />
          <p>No recent health checkups found</p>
          <span>Your assessment will be based on questionnaire answers and any documents you upload.</span>
        </div>

        <div v-else class="checkups-list">
          <div class="checkup-info-banner">
            <v-icon name="hi-information-circle" scale="1" />
            <span>Checkups from the last {{ checkupSettings?.auto_include_days || 14 }} days are suggested to be included. You can toggle each checkup below.</span>
          </div>

          <div
            v-for="checkup in relevantCheckups"
            :key="checkup.checkup_id"
            class="checkup-item"
            :class="{
              included: checkupSelections[checkup.checkup_id] === 'include',
              excluded: checkupSelections[checkup.checkup_id] === 'exclude',
              'has-emergency': checkup.has_emergency_evidence
            }"
          >
            <div class="checkup-toggle" v-if="checkupSettings?.allow_patient_exclusion">
              <button
                class="toggle-btn"
                :class="{ active: checkupSelections[checkup.checkup_id] === 'include' }"
                @click="toggleCheckupSelection(checkup.checkup_id)"
              >
                <v-icon :name="checkupSelections[checkup.checkup_id] === 'include' ? 'hi-check-circle' : 'hi-x-circle'" scale="1.2" />
              </button>
            </div>

            <div class="checkup-content">
              <div class="checkup-header">
                <span class="checkup-date">{{ formatCheckupDate(checkup.date) }}</span>
                <span class="days-ago">{{ checkup.days_ago }} days ago</span>
                <span v-if="checkup.triage_level" class="triage-badge" :class="checkup.triage_level">
                  {{ formatTriageLevel(checkup.triage_level) }}
                </span>
                <span v-if="checkup.has_emergency_evidence" class="emergency-badge">
                  <v-icon name="hi-exclamation" scale="0.8" />
                  Emergency
                </span>
              </div>

              <div v-if="checkup.symptoms_reported.length > 0" class="checkup-symptoms">
                <strong>Symptoms:</strong> {{ checkup.symptoms_reported.join(', ') }}
              </div>

              <div v-if="checkup.top_conditions.length > 0" class="checkup-conditions">
                <strong>Possible conditions:</strong>
                <span v-for="(condition, idx) in checkup.top_conditions" :key="idx" class="condition-tag">
                  {{ condition.name }} ({{ condition.probability }}%)
                </span>
              </div>

              <div class="checkup-status">
                <span v-if="checkupSelections[checkup.checkup_id] === 'include'" class="status-included">
                  <v-icon name="hi-check" scale="0.8" /> Will be included
                </span>
                <span v-else class="status-excluded">
                  <v-icon name="hi-x" scale="0.8" /> Will be excluded
                </span>
                <span class="suggestion-reason">{{ checkup.suggestion_reason }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showCheckupConfirmModal = false">
            <v-icon name="hi-arrow-left" scale="0.9" />
            Back to Questions
          </button>
          <button class="continue-btn" @click="proceedToDocuments">
            Continue
            <v-icon name="hi-arrow-right" scale="0.9" />
          </button>
        </div>
      </div>
    </div>

    <!-- Document Upload Modal -->
    <div v-if="showDocumentUploadModal" class="modal-overlay" @click.self="showDocumentUploadModal = false">
      <div class="upload-modal">
        <div class="upload-modal-header">
          <h3>Upload Supporting Documents</h3>
          <p>Add lab results, medical reports, or other health documents for a more accurate analysis (optional)</p>
        </div>

        <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
          <input
            type="file"
            ref="fileInput"
            @change="handleFileSelect"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            style="display: none"
          />
          <div class="upload-placeholder" @click="$refs.fileInput.click()">
            <v-icon name="hi-cloud-upload" scale="2.5" />
            <p>Drag & drop files here or <span>browse</span></p>
            <span class="file-types">PDF, JPEG, PNG • Max 10MB per file</span>
          </div>
        </div>

        <div v-if="uploadedDocuments.length > 0" class="uploaded-files">
          <h4>Uploaded Documents ({{ uploadedDocuments.length }})</h4>
          <div v-for="(doc, idx) in uploadedDocuments" :key="idx" class="file-item">
            <v-icon :name="getFileIcon(doc.file_type)" scale="1.2" />
            <span class="file-name">{{ doc.original_name }}</span>
            <button class="remove-btn" @click="removeDocument(idx)">
              <v-icon name="hi-x" scale="0.9" />
            </button>
          </div>
        </div>

        <div v-if="uploadError" class="upload-error">
          <v-icon name="hi-exclamation-circle" scale="1" />
          <span>{{ uploadError }}</span>
        </div>

        <div v-if="uploadingFile" class="uploading-indicator">
          <div class="upload-spinner"></div>
          <span>Uploading document...</span>
        </div>

        <div class="upload-info">
          <v-icon name="hi-information-circle" scale="1" />
          <span>Documents must contain your name for verification. Up to 5 documents allowed.</span>
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showDocumentUploadModal = false">Back to Questions</button>
          <button class="continue-btn" @click="proceedToReview">
            {{ uploadedDocuments.length > 0 ? 'Continue with Documents' : 'Skip & Continue' }}
            <v-icon name="hi-arrow-right" scale="0.9" />
          </button>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    <div v-if="showReviewModal" class="modal-overlay" @click.self="showReviewModal = false">
      <div class="review-modal">
        <h3>Review Your Assessment</h3>
        <p>Please review your answers before generating your health report. This will use <strong>{{ creditsRequired }}</strong> AI credits.</p>

        <div class="answers-summary">
          <div v-for="domain in domainKeys" :key="domain" class="domain-summary">
            <h4>{{ getDomainLabel(domain) }}</h4>
            <div v-for="q in questionsByDomain[domain]" :key="q._id" class="answer-item">
              <span class="q-text">{{ q.question_text }}</span>
              <span class="a-text">{{ getAnswerLabel(q._id) || '(Not answered)' }}</span>
            </div>
          </div>
        </div>

        <div v-if="uploadedDocuments.length > 0" class="documents-summary">
          <h4>Documents Attached ({{ uploadedDocuments.length }})</h4>
          <div v-for="(doc, idx) in uploadedDocuments" :key="idx" class="doc-item">
            <v-icon :name="getFileIcon(doc.file_type)" scale="1" />
            <span>{{ doc.original_name }}</span>
          </div>
        </div>

        <div class="modal-actions">
          <button class="cancel-btn" @click="showReviewModal = false; showDocumentUploadModal = true;">
            <v-icon name="hi-arrow-left" scale="0.9" />
            Back
          </button>
          <button class="confirm-btn" @click="submitAssessment">
            Generate Report
            <v-icon name="hi-sparkles" scale="0.9" />
          </button>
        </div>
      </div>
    </div>

    <!-- Generating Report Overlay -->
    <div v-if="submitting" class="generating-overlay">
      <div class="generating-content">
        <div class="generating-animation">
          <div class="pulse-ring"></div>
          <div class="pulse-ring delay-1"></div>
          <div class="pulse-ring delay-2"></div>
          <div class="ai-icon">
            <v-icon name="hi-sparkles" scale="2" />
          </div>
        </div>
        <h2>Generating Your Health Report</h2>
        <p class="generating-subtitle">Our AI is analyzing your responses{{ uploadedDocuments.length > 0 ? ' and documents' : '' }}</p>
        <div class="generating-steps">
          <div class="step" :class="{ active: generatingStep >= 1 }">
            <v-icon name="hi-check-circle" scale="1" />
            <span>Processing questionnaire</span>
          </div>
          <div class="step" :class="{ active: generatingStep >= 2 }">
            <v-icon name="hi-check-circle" scale="1" />
            <span>Analyzing health data</span>
          </div>
          <div class="step" :class="{ active: generatingStep >= 3 }">
            <v-icon name="hi-check-circle" scale="1" />
            <span>Generating insights</span>
          </div>
          <div class="step" :class="{ active: generatingStep >= 4 }">
            <v-icon name="hi-check-circle" scale="1" />
            <span>Preparing recommendations</span>
          </div>
        </div>
        <p class="wait-message">This may take up to a minute. Please don't close this page.</p>
      </div>
    </div>
  </div>
</template>

<script>
import apiFactory from "@/services/apiFactory";

const DOMAIN_LABELS = {
  cardiovascular: "Cardiovascular Health",
  metabolic: "Metabolic Health",
  mental_wellbeing: "Mental Wellbeing",
  lifestyle: "Lifestyle Factors",
  physical_symptoms: "Physical Symptoms",
  preventive_care: "Preventive Care",
};

export default {
  name: "AdvancedHealthScoreAssessment",
  data() {
    return {
      loadingQuestions: true,
      error: null,
      questionsByDomain: {},
      domainKeys: [],
      currentDomainIndex: 0,
      currentQuestionInDomain: 0,
      answers: {},
      answerLabels: {},
      textAnswers: {},
      multiAnswers: {},
      submitting: false,
      showReviewModal: false,
      showDocumentUploadModal: false,
      creditsRequired: 3,
      // Previous answers from last assessment
      previousAnswers: null,
      previousAssessmentDate: null,
      changedAnswers: {}, // Track which answers were changed from previous
      // Document upload
      uploadedDocuments: [],
      uploadingFile: false,
      uploadError: null,
      maxDocuments: 5,
      // Generating animation
      generatingStep: 0,
      stepInterval: null,
      // Health Checkup Confirmation
      showCheckupConfirmModal: false,
      loadingCheckups: false,
      relevantCheckups: [],
      checkupSelections: {},
      checkupSettings: null, // Loaded from admin settings via API
    };
  },
  computed: {
    allQuestions() {
      const all = [];
      for (const domain of this.domainKeys) {
        const questions = this.questionsByDomain[domain] || [];
        all.push(...questions);
      }
      return all;
    },
    totalQuestions() {
      return this.allQuestions.length;
    },
    currentDomain() {
      return this.domainKeys[this.currentDomainIndex];
    },
    currentDomainLabel() {
      return DOMAIN_LABELS[this.currentDomain] || this.currentDomain;
    },
    currentDomainQuestions() {
      return this.questionsByDomain[this.currentDomain] || [];
    },
    currentQuestion() {
      return this.currentDomainQuestions[this.currentQuestionInDomain];
    },
    currentQuestionIndex() {
      let idx = 0;
      for (let i = 0; i < this.currentDomainIndex; i++) {
        idx += (this.questionsByDomain[this.domainKeys[i]] || []).length;
      }
      return idx + this.currentQuestionInDomain;
    },
    isLastQuestion() {
      return this.currentQuestionIndex === this.totalQuestions - 1;
    },
    isCurrentAnswered() {
      if (!this.currentQuestion) return false;
      const qid = this.currentQuestion._id;

      if (this.currentQuestion.question_type === "multiple_choice") {
        return this.multiAnswers[qid] && this.multiAnswers[qid].length > 0;
      }

      return this.answers[qid] !== undefined && this.answers[qid] !== "";
    },
    answeredCount() {
      let count = 0;
      for (const q of this.allQuestions) {
        if (q.question_type === "multiple_choice") {
          if (this.multiAnswers[q._id]?.length > 0) count++;
        } else {
          if (this.answers[q._id] !== undefined && this.answers[q._id] !== "") count++;
        }
      }
      return count;
    },
    allAnswered() {
      return this.answeredCount === this.totalQuestions;
    },
    progressPercent() {
      if (this.totalQuestions === 0) return 0;
      // When previous answers exist, show progress based on current position
      if (this.previousAnswers) {
        return Math.round(((this.currentQuestionIndex + 1) / this.totalQuestions) * 100);
      }
      return Math.round((this.answeredCount / this.totalQuestions) * 100);
    },
    displayedProgress() {
      // When previous answers exist, show current position instead of answered count
      if (this.previousAnswers) {
        return `${this.currentQuestionIndex + 1} / ${this.totalQuestions} questions`;
      }
      return `${this.answeredCount} / ${this.totalQuestions} questions`;
    },
  },
  async mounted() {
    await this.loadQuestions();
  },
  methods: {
    async loadQuestions() {
      this.loadingQuestions = true;
      this.error = null;
      try {
        // Check can start first
        const canStartRes = await apiFactory.$_canStartAdvancedHealthScore();
        const canStartData = canStartRes.data?.data || canStartRes.data;

        if (!canStartData.can_start) {
          this.$router.push("/app/patient/advanced-health-score");
          return;
        }

        this.creditsRequired = canStartData.credits_required || 3;

        // Store previous answers if available
        if (canStartData.previous_answers) {
          this.previousAnswers = canStartData.previous_answers;
          this.previousAssessmentDate = canStartData.previous_assessment_date;
        }

        // Load questions
        const response = await apiFactory.$_getAdvancedHealthScoreQuestions();
        const data = response.data?.data || response.data;

        this.questionsByDomain = data;
        this.domainKeys = Object.keys(data).filter(
          (k) => data[k] && data[k].length > 0
        );

        if (this.domainKeys.length === 0) {
          this.error = "No questions available for this assessment.";
        }

        // Pre-populate answers from previous assessment
        if (this.previousAnswers) {
          this.prefillPreviousAnswers();
        }
      } catch (err) {
        console.error("Error loading questions:", err);
        this.error = "Failed to load assessment questions.";
      } finally {
        this.loadingQuestions = false;
      }
    },

    prefillPreviousAnswers() {
      if (!this.previousAnswers) return;

      // Iterate through all questions and pre-fill answers
      for (const domain of this.domainKeys) {
        const questions = this.questionsByDomain[domain] || [];
        for (const question of questions) {
          const prevAnswer = this.previousAnswers[question._id];
          if (prevAnswer) {
            // Set the answer value
            this.answers[question._id] = prevAnswer.answer_value;
            this.answerLabels[question._id] = prevAnswer.answer_label;

            // Handle different question types
            if (question.question_type === 'multiple_choice' && Array.isArray(prevAnswer.answer_value)) {
              this.multiAnswers[question._id] = [...prevAnswer.answer_value];
            } else if (question.question_type === 'text') {
              this.textAnswers[question._id] = prevAnswer.answer_value;
            } else if (question.question_type === 'scale') {
              this.answers[question._id] = Number(prevAnswer.answer_value);
            }
          }
        }
      }
    },

    hasPreviousAnswer(qid) {
      return this.previousAnswers && this.previousAnswers[qid];
    },

    wasAnswerChanged(qid) {
      if (!this.previousAnswers || !this.previousAnswers[qid]) return false;
      const prev = this.previousAnswers[qid].answer_value;
      const curr = this.answers[qid];

      // Compare arrays for multiple choice
      if (Array.isArray(prev) && Array.isArray(curr)) {
        return JSON.stringify(prev.sort()) !== JSON.stringify(curr.sort());
      }
      return prev !== curr;
    },

    formatPreviousDate() {
      if (!this.previousAssessmentDate) return '';
      const date = new Date(this.previousAssessmentDate);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    clearPreviousAnswers() {
      // Clear all pre-filled answers and start fresh
      this.answers = {};
      this.answerLabels = {};
      this.textAnswers = {};
      this.multiAnswers = {};
      this.previousAnswers = null;
      this.previousAssessmentDate = null;
      this.changedAnswers = {};
      // Reset to first question
      this.currentDomainIndex = 0;
      this.currentQuestionInDomain = 0;
    },

    getDomainLabel(domain) {
      return DOMAIN_LABELS[domain] || domain;
    },

    getScaleRange(question) {
      const min = question.scale_config?.min || 1;
      const max = question.scale_config?.max || 10;
      return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    },

    selectAnswer(qid, value, label) {
      this.answers[qid] = value;
      this.answerLabels[qid] = label;
    },

    isMultiSelected(qid, value) {
      return this.multiAnswers[qid]?.includes(value);
    },

    toggleMultiAnswer(qid, value, label) {
      if (!this.multiAnswers[qid]) {
        this.multiAnswers[qid] = [];
      }

      const idx = this.multiAnswers[qid].indexOf(value);
      if (idx > -1) {
        this.multiAnswers[qid].splice(idx, 1);
      } else {
        this.multiAnswers[qid].push(value);
      }

      // Update answers for submission
      this.answers[qid] = [...this.multiAnswers[qid]];
      this.answerLabels[qid] = this.multiAnswers[qid]
        .map((v) => {
          const q = this.currentQuestion;
          const opt = q?.options?.find((o) => o.value === v);
          return opt?.label || v;
        })
        .join(", ");
    },

    getAnswerLabel(qid) {
      return this.answerLabels[qid] || "";
    },

    isDomainCompleted(domain) {
      const questions = this.questionsByDomain[domain] || [];
      return questions.every((q) => {
        if (q.question_type === "multiple_choice") {
          return this.multiAnswers[q._id]?.length > 0;
        }
        return this.answers[q._id] !== undefined && this.answers[q._id] !== "";
      });
    },

    isDomainVisuallyCompleted(domain, domainIndex) {
      // When previous answers exist, show completion based on position (reviewed domains)
      if (this.previousAnswers) {
        return domainIndex < this.currentDomainIndex;
      }
      // Otherwise, use actual answer-based completion
      return this.isDomainCompleted(domain);
    },

    goToDomain(idx) {
      this.currentDomainIndex = idx;
      this.currentQuestionInDomain = 0;
    },

    nextQuestion() {
      if (this.currentQuestionInDomain < this.currentDomainQuestions.length - 1) {
        this.currentQuestionInDomain++;
      } else if (this.currentDomainIndex < this.domainKeys.length - 1) {
        this.currentDomainIndex++;
        this.currentQuestionInDomain = 0;
      }
    },

    prevQuestion() {
      if (this.currentQuestionInDomain > 0) {
        this.currentQuestionInDomain--;
      } else if (this.currentDomainIndex > 0) {
        this.currentDomainIndex--;
        const prevDomain = this.domainKeys[this.currentDomainIndex];
        this.currentQuestionInDomain =
          (this.questionsByDomain[prevDomain] || []).length - 1;
      }
    },

    // Document Upload Methods
    async handleFileSelect(event) {
      const files = event.target.files;
      if (files) {
        for (const file of files) {
          await this.uploadFile(file);
        }
      }
      event.target.value = ''; // Reset input
    },

    async handleDrop(event) {
      const files = event.dataTransfer.files;
      if (files) {
        for (const file of files) {
          await this.uploadFile(file);
        }
      }
    },

    async uploadFile(file) {
      if (this.uploadedDocuments.length >= this.maxDocuments) {
        this.uploadError = `Maximum ${this.maxDocuments} documents allowed`;
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        this.uploadError = 'Only PDF, JPEG, and PNG files are allowed';
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.uploadError = 'File size must be less than 10MB';
        return;
      }

      this.uploadError = null;
      this.uploadingFile = true;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiFactory.$_uploadAdvancedHealthScoreDocument(formData);
        const doc = response.data?.data || response.data;
        this.uploadedDocuments.push(doc);
      } catch (err) {
        console.error('Error uploading document:', err);
        this.uploadError = err.response?.data?.message || 'Failed to upload document. Please try again.';
      } finally {
        this.uploadingFile = false;
      }
    },

    removeDocument(index) {
      this.uploadedDocuments.splice(index, 1);
    },

    getFileIcon(mimeType) {
      if (mimeType === 'application/pdf') return 'hi-document-text';
      if (mimeType?.startsWith('image/')) return 'hi-photograph';
      return 'hi-document';
    },

    // Health Checkup Confirmation Methods
    async proceedToCheckupConfirm() {
      this.showCheckupConfirmModal = true;
      this.loadingCheckups = true;

      try {
        const response = await apiFactory.$_getRelevantHealthCheckups();
        const data = response.data?.data || response.data;

        this.relevantCheckups = data.checkups || [];
        this.checkupSettings = data.settings || null;

        // Initialize selections based on suggested status
        this.checkupSelections = {};
        for (const checkup of this.relevantCheckups) {
          this.checkupSelections[checkup.checkup_id] = checkup.suggested_status;
        }
      } catch (err) {
        console.error('Error loading health checkups:', err);
        // On error, proceed without checkups
        this.relevantCheckups = [];
      } finally {
        this.loadingCheckups = false;
      }
    },

    toggleCheckupSelection(checkupId) {
      if (this.checkupSelections[checkupId] === 'include') {
        this.checkupSelections[checkupId] = 'exclude';
      } else {
        this.checkupSelections[checkupId] = 'include';
      }
    },

    formatCheckupDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    formatTriageLevel(level) {
      const labels = {
        emergency: 'Emergency',
        emergency_ambulance: 'Emergency',
        consultation_24: 'Urgent',
        consultation: 'Consultation',
        self_care: 'Self Care',
      };
      return labels[level] || level;
    },

    proceedToDocuments() {
      this.showCheckupConfirmModal = false;
      this.showDocumentUploadModal = true;
    },

    proceedToReview() {
      this.showDocumentUploadModal = false;
      this.showReviewModal = true;
    },

    // Generating Animation
    startGeneratingAnimation() {
      this.generatingStep = 0;
      let step = 1;
      this.stepInterval = setInterval(() => {
        this.generatingStep = step;
        step++;
        if (step > 4) {
          // Keep cycling to show activity
          step = 1;
        }
      }, 2000);
    },

    stopGeneratingAnimation() {
      if (this.stepInterval) {
        clearInterval(this.stepInterval);
        this.stepInterval = null;
      }
    },

    async submitAssessment() {
      this.showReviewModal = false;
      this.submitting = true;
      this.startGeneratingAnimation();

      try {
        // Build answers array
        const answersArray = this.allQuestions.map((q) => ({
          question_id: q._id,
          domain: q.domain,
          question_text: q.question_text,
          answer_value: this.answers[q._id],
          answer_label: this.answerLabels[q._id] || String(this.answers[q._id]),
        }));

        // Build checkup selections array
        const checkupSelectionsArray = Object.entries(this.checkupSelections).map(
          ([checkup_id, status]) => ({ checkup_id, status })
        );

        const response = await apiFactory.$_submitAdvancedHealthScore({
          answers: answersArray,
          documents: this.uploadedDocuments,
          checkup_selections: checkupSelectionsArray,
        });

        const result = response.data?.data || response.data;

        // Navigate to report page
        this.$router.push(`/app/patient/advanced-health-score/report/${result._id}`);
      } catch (err) {
        console.error("Error submitting assessment:", err);
        this.$toast.error(
          err.response?.data?.message || "Failed to generate report. Please try again."
        );
        this.showReviewModal = true;
      } finally {
        this.stopGeneratingAnimation();
        this.submitting = false;
      }
    },
  },
  beforeUnmount() {
    this.stopGeneratingAnimation();
  },
};
</script>

<style scoped lang="scss">
.assessment-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;

  @media (max-width: 480px) {
    padding: 16px;
  }
}

// Hero Banner Styles
.hero-banner {
  position: relative;
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  overflow: hidden;

  @media (max-width: 480px) {
    padding: 20px 16px;
    border-radius: 16px;
    margin-bottom: 20px;
  }
}

.hero-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  .hero-pattern {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 1px, transparent 1px),
                      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 1px, transparent 1px);
    background-size: 50px 50px, 70px 70px;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;
  transition: all 0.2s;

  &:hover {
    color: white;
  }

  @media (max-width: 480px) {
    font-size: 13px;
    margin-bottom: 12px;
  }
}

.hero-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 20px;
  }
}

.hero-text {
  flex: 1;

  h1 {
    font-size: 26px;
    font-weight: 700;
    color: white;
    margin: 0 0 8px;
    line-height: 1.2;

    @media (max-width: 480px) {
      font-size: 22px;
    }
  }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  margin-bottom: 12px;

  @media (max-width: 480px) {
    font-size: 11px;
    padding: 4px 10px;
  }
}

.hero-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  margin: 0;
  max-width: 400px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
}

.hero-stats {
  display: flex;
  gap: 12px;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
    justify-content: space-between;
  }

  @media (max-width: 480px) {
    gap: 8px;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    padding: 12px 16px;
    border-radius: 12px;

    @media (max-width: 480px) {
      flex-direction: column;
      gap: 6px;
      padding: 10px 12px;
      flex: 1;
      text-align: center;
    }
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    @media (max-width: 480px) {
      width: 32px;
      height: 32px;
    }
  }

  .stat-info {
    display: flex;
    flex-direction: column;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: white;
    line-height: 1;

    @media (max-width: 480px) {
      font-size: 18px;
    }
  }

  .stat-label {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.8);
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (max-width: 480px) {
      font-size: 10px;
    }
  }
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #0EAEC4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.retry-btn {
  padding: 10px 20px;
  background: #0EAEC4;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

// Previous Answers Banner
.previous-answers-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfdf5 100%);
  border: 1px solid #99f6e4;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
  }

  .banner-icon {
    width: 44px;
    height: 44px;
    background: #14b8a6;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;

    @media (max-width: 480px) {
      width: 40px;
      height: 40px;
    }
  }

  .banner-content {
    flex: 1;

    h4 {
      font-size: 15px;
      font-weight: 600;
      color: #0f766e;
      margin: 0 0 4px;

      @media (max-width: 480px) {
        font-size: 14px;
      }
    }

    p {
      font-size: 13px;
      color: #115e59;
      margin: 0;
      line-height: 1.4;

      @media (max-width: 480px) {
        font-size: 12px;
      }
    }
  }

  .clear-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: white;
    border: 1px solid #99f6e4;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #0f766e;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    @media (max-width: 640px) {
      width: 100%;
      justify-content: center;
    }

    &:hover {
      background: #f0fdfa;
      border-color: #14b8a6;
    }
  }
}

.assessment-wizard {
  .progress-section {
    background: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
    border: 1px solid #e5e7eb;

    @media (max-width: 480px) {
      padding: 12px;
      margin-bottom: 16px;
    }
  }

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;

    @media (max-width: 480px) {
      flex-direction: column;
      gap: 4px;
    }

    .domain-label {
      font-weight: 600;
      color: #111827;

      @media (max-width: 480px) {
        font-size: 14px;
      }
    }

    .progress-text {
      color: #6b7280;
      font-size: 14px;

      @media (max-width: 480px) {
        font-size: 13px;
      }
    }
  }

  .progress-bar {
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 16px;

    @media (max-width: 480px) {
      margin-bottom: 12px;
    }

    .progress-fill {
      height: 100%;
      background: #0EAEC4;
      transition: width 0.3s ease;
    }
  }

  .domain-dots {
    display: flex;
    justify-content: center;
    gap: 8px;

    @media (max-width: 480px) {
      gap: 6px;
    }

    .domain-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;

      @media (max-width: 480px) {
        width: 28px;
        height: 28px;
      }

      .dot-number {
        font-size: 12px;
        font-weight: 600;
        color: #9ca3af;

        @media (max-width: 480px) {
          font-size: 11px;
        }
      }

      &.active {
        border-color: #0EAEC4;
        background: #0EAEC4;

        .dot-number {
          color: white;
        }
      }

      &.completed {
        border-color: #10b981;
        background: #10b981;

        .dot-number {
          color: white;
        }
      }
    }
  }
}

.question-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  border: 2px solid #e5e7eb;
  margin-bottom: 20px;
  transition: border-color 0.2s;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 16px;
  }

  &.has-previous {
    border-color: #99f6e4;
    background: linear-gradient(180deg, #f0fdfa 0%, white 20%);
  }

  &.answer-changed {
    border-color: #fcd34d;
    background: linear-gradient(180deg, #fffbeb 0%, white 20%);
  }

  .question-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    gap: 12px;

    @media (max-width: 480px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }
  }

  .question-number {
    font-size: 12px;
    color: #0EAEC4;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (max-width: 480px) {
      font-size: 11px;
    }
  }

  .previous-indicator {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    background: #ccfbf1;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    color: #0f766e;

    @media (max-width: 480px) {
      font-size: 10px;
      padding: 3px 8px;
    }

    &.changed {
      background: #fef3c7;
      color: #92400e;
    }
  }

  .question-text {
    font-size: 18px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 8px;
    line-height: 1.4;

    @media (max-width: 480px) {
      font-size: 16px;
    }
  }

  .help-text {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #6b7280;
    margin: 0 0 20px;

    @media (max-width: 480px) {
      font-size: 12px;
      margin-bottom: 16px;
    }
  }
}

.options-grid.yes-no {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 480px) {
    gap: 10px;
  }

  .option-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 20px;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 16px;
    font-weight: 500;
    color: #374151;

    @media (max-width: 480px) {
      padding: 16px;
      font-size: 14px;
      gap: 6px;
    }

    &:hover {
      border-color: #0EAEC4;
    }

    &.selected {
      border-color: #0EAEC4;
      background: rgba(14, 174, 196, 0.1);
      color: #0EAEC4;
    }
  }
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 10px;

  @media (max-width: 480px) {
    gap: 8px;
  }

  .option-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: #f9fafb;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    font-size: 15px;
    color: #374151;

    @media (max-width: 480px) {
      padding: 12px 14px;
      font-size: 14px;
      gap: 10px;
    }

    .radio-circle {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid #d1d5db;
      flex-shrink: 0;

      @media (max-width: 480px) {
        width: 18px;
        height: 18px;
      }
    }

    .checkbox-square {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      border: 2px solid #d1d5db;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      @media (max-width: 480px) {
        width: 18px;
        height: 18px;
      }
    }

    &:hover {
      border-color: #0EAEC4;
    }

    &.selected {
      border-color: #0EAEC4;
      background: rgba(14, 174, 196, 0.1);

      .radio-circle {
        border-color: #0EAEC4;
        background: #0EAEC4;
        box-shadow: inset 0 0 0 4px white;
      }

      .checkbox-square {
        border-color: #0EAEC4;
        background: #0EAEC4;
        color: white;
      }
    }
  }
}

.scale-input {
  .scale-labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;
    color: #6b7280;

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }

  .scale-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;

    @media (max-width: 480px) {
      gap: 6px;
    }

    .scale-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: 2px solid #e5e7eb;
      background: #f9fafb;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      transition: all 0.2s;

      @media (max-width: 480px) {
        width: 38px;
        height: 38px;
        font-size: 13px;
      }

      &:hover {
        border-color: #0EAEC4;
      }

      &.selected {
        border-color: #0EAEC4;
        background: #0EAEC4;
        color: white;
      }
    }
  }
}

.text-input {
  textarea {
    width: 100%;
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 15px;
    resize: vertical;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: #0EAEC4;
    }
  }
}

.navigation {
  display: flex;
  justify-content: space-between;
  gap: 12px;

  @media (max-width: 480px) {
    gap: 10px;
  }

  .nav-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    @media (max-width: 480px) {
      padding: 10px 16px;
      font-size: 14px;
      flex: 1;
      justify-content: center;
    }

    &.prev {
      background: white;
      border: 2px solid #e5e7eb;
      color: #374151;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    &.next,
    &.submit {
      background: #0EAEC4;
      border: none;
      color: white;

      &:hover:not(:disabled) {
        background: #0d9eb3;
      }

      &:disabled {
        background: #9ca3af;
        cursor: not-allowed;
      }
    }
  }
}

.modal-overlay {
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
  padding: 20px;

  @media (max-width: 480px) {
    padding: 12px;
    align-items: flex-end;
  }
}

.review-modal {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;

  @media (max-width: 480px) {
    padding: 20px;
    border-radius: 16px 16px 0 0;
    max-height: 85vh;
  }

  h3 {
    font-size: 20px;
    margin: 0 0 8px;
    color: #111827;

    @media (max-width: 480px) {
      font-size: 18px;
    }
  }

  > p {
    color: #6b7280;
    margin: 0 0 16px;

    @media (max-width: 480px) {
      font-size: 14px;
    }
  }

  .answers-summary {
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 20px;

    @media (max-width: 480px) {
      max-height: 250px;
    }

    .domain-summary {
      margin-bottom: 16px;

      h4 {
        font-size: 14px;
        color: #0EAEC4;
        margin: 0 0 8px;

        @media (max-width: 480px) {
          font-size: 13px;
        }
      }

      .answer-item {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        border-bottom: 1px solid #f3f4f6;
        font-size: 13px;

        @media (max-width: 480px) {
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }

        .q-text {
          color: #374151;
          flex: 1;
          margin-right: 12px;

          @media (max-width: 480px) {
            margin-right: 0;
          }
        }

        .a-text {
          color: #6b7280;
          font-weight: 500;
        }
      }
    }
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;

    @media (max-width: 480px) {
      flex-direction: column-reverse;
      gap: 10px;
    }

    .cancel-btn,
    .confirm-btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;

      @media (max-width: 480px) {
        width: 100%;
        padding: 12px 20px;
      }
    }

    .cancel-btn {
      background: white;
      border: 1px solid #e5e7eb;
      color: #374151;
    }

    .confirm-btn {
      background: #0EAEC4;
      border: none;
      color: white;
      display: inline-flex;
      align-items: center;
      gap: 6px;

      &:disabled {
        background: #9ca3af;
      }
    }

    .continue-btn {
      background: #0EAEC4;
      border: none;
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;

      @media (max-width: 480px) {
        width: 100%;
        justify-content: center;
        padding: 12px 20px;
      }

      &:hover {
        background: #0d9eb3;
      }
    }
  }
}

// Upload Modal Styles
.upload-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 480px) {
    max-height: 85vh;
    border-radius: 16px 16px 0 0;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 16px 24px 24px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;

    @media (max-width: 480px) {
      flex-direction: column-reverse;
      gap: 10px;
      padding: 16px;
    }

    .cancel-btn {
      padding: 12px 20px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;

      @media (max-width: 480px) {
        width: 100%;
      }

      &:hover {
        background: #f3f4f6;
        border-color: #d1d5db;
      }
    }

    .continue-btn {
      padding: 12px 24px;
      background: #0EAEC4;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;

      @media (max-width: 480px) {
        width: 100%;
      }

      &:hover {
        background: #0d9eb3;
      }
    }
  }
}

.upload-modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 480px) {
    padding: 20px 16px 12px;
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 6px;

    @media (max-width: 480px) {
      font-size: 18px;
    }
  }

  p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;

    @media (max-width: 480px) {
      font-size: 13px;
    }
  }
}

.upload-area {
  padding: 20px 24px;

  @media (max-width: 480px) {
    padding: 16px;
  }
}

.upload-placeholder {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;

  @media (max-width: 480px) {
    padding: 30px 16px;
  }

  &:hover {
    border-color: #0EAEC4;
    background: #f0fdfa;
  }

  p {
    margin: 12px 0 6px;
    color: #374151;
    font-size: 15px;

    span {
      color: #0EAEC4;
      font-weight: 500;
    }
  }

  .file-types {
    font-size: 12px;
    color: #9ca3af;
  }
}

.uploaded-files {
  padding: 0 24px 16px;

  @media (max-width: 480px) {
    padding: 0 16px 12px;
  }

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 12px;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: 8px;

    .file-name {
      flex: 1;
      font-size: 13px;
      color: #374151;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .remove-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: #fee2e2;
      border-radius: 6px;
      color: #dc2626;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: #fecaca;
      }
    }
  }
}

.upload-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  color: #dc2626;
  font-size: 13px;

  @media (max-width: 480px) {
    padding: 10px 16px;
  }
}

.uploading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 24px;
  color: #6b7280;
  font-size: 13px;

  .upload-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid #e5e7eb;
    border-top-color: #0EAEC4;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

.upload-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #f0fdfa;
  margin: 0 24px 16px;
  border-radius: 8px;
  font-size: 12px;
  color: #0d9488;

  @media (max-width: 480px) {
    margin: 0 16px 12px;
    padding: 10px 12px;
    font-size: 11px;
  }
}

.documents-summary {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;

  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 10px;
  }

  .doc-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    font-size: 13px;
    color: #6b7280;
  }
}

// Generating Overlay Styles
.generating-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.generating-content {
  text-align: center;
  padding: 40px;
  max-width: 400px;

  @media (max-width: 480px) {
    padding: 24px;
  }

  h2 {
    font-size: 24px;
    font-weight: 700;
    color: white;
    margin: 0 0 8px;

    @media (max-width: 480px) {
      font-size: 20px;
    }
  }

  .generating-subtitle {
    color: rgba(255, 255, 255, 0.9);
    font-size: 15px;
    margin: 0 0 32px;

    @media (max-width: 480px) {
      font-size: 14px;
      margin-bottom: 24px;
    }
  }

  .wait-message {
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
    margin-top: 24px;
  }
}

.generating-animation {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 32px;

  @media (max-width: 480px) {
    width: 100px;
    height: 100px;
    margin-bottom: 24px;
  }
}

.pulse-ring {
  position: absolute;
  inset: 0;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  animation: pulse-ring 2s ease-out infinite;

  &.delay-1 {
    animation-delay: 0.5s;
  }

  &.delay-2 {
    animation-delay: 1s;
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.ai-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: pulse-glow 2s ease-in-out infinite;

  @media (max-width: 480px) {
    width: 54px;
    height: 54px;
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(255, 255, 255, 0.6);
  }
}

.generating-steps {
  text-align: left;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px 20px;

  @media (max-width: 480px) {
    padding: 12px 16px;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 14px;
    transition: all 0.3s;

    @media (max-width: 480px) {
      font-size: 13px;
      padding: 6px 0;
    }

    &.active {
      color: white;
    }
  }
}

// Health Checkup Confirmation Modal Styles
.checkup-confirm-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 480px) {
    max-height: 90vh;
    border-radius: 16px 16px 0 0;
  }
}

.checkup-modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 480px) {
    padding: 20px 16px 12px;
  }

  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 6px;

    @media (max-width: 480px) {
      font-size: 18px;
    }
  }

  p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;

    @media (max-width: 480px) {
      font-size: 13px;
    }
  }
}

.checkup-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  gap: 16px;
  color: #6b7280;
  font-size: 14px;
}

.no-checkups {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: #9ca3af;

  p {
    font-size: 16px;
    font-weight: 500;
    color: #374151;
    margin: 16px 0 8px;
  }

  span {
    font-size: 14px;
    max-width: 300px;
  }
}

.checkups-list {
  padding: 16px 24px;
  overflow-y: auto;
  flex: 1;

  @media (max-width: 480px) {
    padding: 12px 16px;
  }
}

.checkup-info-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: #f0fdfa;
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #0d9488;

  @media (max-width: 480px) {
    font-size: 12px;
    padding: 10px 12px;
  }
}

.checkup-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.2s;

  @media (max-width: 480px) {
    padding: 12px;
    gap: 10px;
  }

  &.included {
    border-color: #10b981;
    background: #ecfdf5;
  }

  &.excluded {
    border-color: #e5e7eb;
    background: #f9fafb;
    opacity: 0.7;
  }

  &.has-emergency {
    border-color: #ef4444;
    background: #fef2f2;
  }
}

.checkup-toggle {
  flex-shrink: 0;

  .toggle-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid #d1d5db;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    transition: all 0.2s;

    @media (max-width: 480px) {
      width: 36px;
      height: 36px;
    }

    &.active {
      border-color: #10b981;
      background: #10b981;
      color: white;
    }

    &:hover:not(.active) {
      border-color: #0EAEC4;
      color: #0EAEC4;
    }
  }
}

.checkup-content {
  flex: 1;
  min-width: 0;
}

.checkup-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;

  .checkup-date {
    font-weight: 600;
    color: #111827;
    font-size: 14px;
  }

  .days-ago {
    font-size: 12px;
    color: #6b7280;
    background: #e5e7eb;
    padding: 2px 8px;
    border-radius: 10px;
  }

  .triage-badge {
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 10px;
    text-transform: uppercase;

    &.self_care {
      background: #d1fae5;
      color: #065f46;
    }

    &.consultation {
      background: #fef3c7;
      color: #92400e;
    }

    &.consultation_24 {
      background: #fed7aa;
      color: #c2410c;
    }

    &.emergency,
    &.emergency_ambulance {
      background: #fecaca;
      color: #b91c1c;
    }
  }

  .emergency-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    background: #ef4444;
    color: white;
  }
}

.checkup-symptoms,
.checkup-conditions {
  font-size: 13px;
  color: #374151;
  margin-bottom: 6px;
  line-height: 1.4;

  @media (max-width: 480px) {
    font-size: 12px;
  }

  strong {
    color: #6b7280;
    font-weight: 500;
  }
}

.condition-tag {
  display: inline-block;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  margin: 2px 4px 2px 0;
}

.checkup-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .status-included {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #10b981;
    font-weight: 500;
  }

  .status-excluded {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #9ca3af;
    font-weight: 500;
  }

  .suggestion-reason {
    color: #9ca3af;
    font-style: italic;
  }
}

.checkup-confirm-modal .modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;

  @media (max-width: 480px) {
    flex-direction: column-reverse;
    gap: 10px;
    padding: 16px;
  }

  .cancel-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 20px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;

    @media (max-width: 480px) {
      width: 100%;
      justify-content: center;
    }

    &:hover {
      background: #f3f4f6;
      border-color: #d1d5db;
    }
  }

  .continue-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 24px;
    background: #0EAEC4;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.2s;

    @media (max-width: 480px) {
      width: 100%;
      justify-content: center;
    }

    &:hover {
      background: #0d9eb3;
    }
  }
}
</style>
