<template>
  <div class="history-page">
    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-background">
        <div class="hero-pattern"></div>
      </div>
      <div class="hero-content">
        <button @click="goBack" class="back-btn">
          <v-icon name="hi-arrow-left" scale="1" />
        </button>
        <div class="hero-text">
          <div class="hero-badge">
            <v-icon name="hi-collection" scale="0.9" />
            <span>Your Health Journey</span>
          </div>
          <h1>Assessment History</h1>
          <p class="hero-subtitle">Track your health progress over time. View detailed reports from your past assessments and see how your health score has evolved.</p>
        </div>
      </div>
      <div class="hero-actions">
        <router-link to="/app/patient/advanced-health-score" class="new-assessment-btn">
          <v-icon name="hi-plus" scale="1" />
          New Assessment
        </router-link>
      </div>
      <div class="hero-decoration">
        <div class="timeline-dots">
          <div class="dot dot-1"></div>
          <div class="dot dot-2"></div>
          <div class="dot dot-3"></div>
          <div class="line"></div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading history...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <v-icon name="hi-exclamation-circle" scale="2" />
      <p>{{ error }}</p>
      <button @click="fetchHistory" class="retry-btn">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="!assessments.length" class="empty-state">
      <div class="empty-illustration">
        <div class="illustration-bg">
          <div class="pulse-ring"></div>
          <div class="pulse-ring delay-1"></div>
          <div class="pulse-ring delay-2"></div>
        </div>
        <div class="illustration-icon">
          <v-icon name="hi-heart" scale="2.5" />
        </div>
      </div>
      <h3>Your Health Journey Starts Here</h3>
      <p>Get a comprehensive AI-powered health analysis. Answer questions about your lifestyle, upload any medical documents, and receive personalized insights and recommendations.</p>
      <div class="empty-features">
        <div class="feature">
          <v-icon name="hi-sparkles" scale="0.9" />
          <span>AI-Powered Analysis</span>
        </div>
        <div class="feature">
          <v-icon name="hi-document-text" scale="0.9" />
          <span>Detailed Report</span>
        </div>
        <div class="feature">
          <v-icon name="hi-light-bulb" scale="0.9" />
          <span>Personalized Tips</span>
        </div>
      </div>
      <router-link to="/app/patient/advanced-health-score" class="start-btn">
        <v-icon name="hi-plus" scale="1" />
        Start Your First Assessment
      </router-link>
      <p class="credit-note">
        <v-icon name="hi-information-circle" scale="0.9" />
        Uses 3 AI credits per assessment
      </p>
    </div>

    <!-- Assessments List -->
    <div v-else class="assessments-list">
      <div
        v-for="assessment in assessments"
        :key="assessment._id"
        class="assessment-card"
        @click="viewReport(assessment._id)"
      >
        <div class="card-main">
          <div class="score-circle" :class="getStatusClass(assessment.report?.overall_status)">
            <span class="score-value">{{ assessment.report?.overall_score || '--' }}</span>
          </div>
          <div class="card-info">
            <div class="card-header">
              <span class="status-badge" :class="getStatusClass(assessment.report?.overall_status)">
                {{ assessment.report?.overall_status || 'Processing' }}
              </span>
              <span class="date">{{ formatDate(assessment.created_at) }}</span>
            </div>
            <p class="summary">{{ assessment.report?.overall_summary || 'Assessment report' }}</p>
            <div class="card-meta">
              <span v-if="assessment.documents?.length">
                <v-icon name="hi-document" scale="0.9" />
                {{ assessment.documents.length }} document(s)
              </span>
              <span>
                <v-icon name="hi-currency-dollar" scale="0.9" />
                {{ assessment.credits_used }} credit(s)
              </span>
            </div>
          </div>
        </div>
        <div class="card-arrow">
          <v-icon name="hi-chevron-right" scale="1.2" />
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
          class="page-btn"
        >
          <v-icon name="hi-chevron-left" scale="1" />
        </button>
        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
        <button
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
          class="page-btn"
        >
          <v-icon name="hi-chevron-right" scale="1" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import apiFactory from "@/services/apiFactory";

export default {
  name: "AdvancedHealthScoreHistory",
  data() {
    return {
      loading: true,
      error: null,
      assessments: [],
      currentPage: 1,
      totalPages: 1,
      limit: 10,
    };
  },
  async mounted() {
    await this.fetchHistory();
  },
  methods: {
    async fetchHistory() {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiFactory.$_getAdvancedHealthScoreHistory({
          page: this.currentPage,
          limit: this.limit,
        });
        const data = response.data?.data || response.data;
        this.assessments = data.assessments || data.items || data || [];
        this.totalPages = data.totalPages || data.total_pages || Math.ceil((data.total || this.assessments.length) / this.limit);
      } catch (err) {
        console.error("Error fetching history:", err);
        this.error = "Unable to load your assessment history. Please try again.";
      } finally {
        this.loading = false;
      }
    },
    goBack() {
      this.$router.push("/app/patient/advanced-health-score");
    },
    viewReport(id) {
      this.$router.push(`/app/patient/advanced-health-score/report/${id}`);
    },
    getStatusClass(status) {
      const statusMap = {
        Excellent: "excellent",
        Good: "good",
        Fair: "fair",
        "Needs Attention": "needs-attention",
        Poor: "poor",
      };
      return statusMap[status] || "default";
    },
    formatDate(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
    async changePage(page) {
      this.currentPage = page;
      await this.fetchHistory();
    },
  },
};
</script>

<style scoped lang="scss">
.history-page {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;

  @media (max-width: 480px) {
    padding: 16px;
  }
}

// Hero Banner Styles
.hero-banner {
  position: relative;
  background: linear-gradient(135deg, $color-sec 0%, $color-sec-s1 100%);
  border-radius: 24px;
  padding: 32px 40px;
  margin-bottom: 24px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 24px;
    gap: 20px;
  }

  @media (max-width: 480px) {
    padding: 20px;
    border-radius: 16px;
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
    background-image: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 1px, transparent 1px),
                      radial-gradient(circle at 70% 30%, rgba(255,255,255,0.08) 1px, transparent 1px);
    background-size: 50px 50px, 70px 70px;
  }
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.hero-text {
  flex: 1;

  h1 {
    font-size: 28px;
    font-weight: 800;
    color: white;
    margin: 0 0 8px;
    line-height: 1.2;

    @media (max-width: 480px) {
      font-size: 24px;
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

.hero-actions {
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    width: 100%;
  }
}

.new-assessment-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: white;
  color: $color-sec;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
}

.hero-decoration {
  position: absolute;
  right: 40px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;

  @media (max-width: 768px) {
    display: none;
  }
}

.timeline-dots {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 0 20px;

  .line {
    position: absolute;
    top: 12px;
    bottom: 12px;
    left: 50%;
    width: 2px;
    background: rgba(255, 255, 255, 0.3);
    transform: translateX(-50%);
  }

  .dot {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    position: relative;
    z-index: 1;
    animation: pulse 2s ease-in-out infinite;

    &.dot-1 {
      background: rgba(255, 255, 255, 0.9);
      animation-delay: 0s;
    }

    &.dot-2 {
      background: rgba(255, 255, 255, 0.6);
      animation-delay: 0.3s;
    }

    &.dot-3 {
      background: rgba(255, 255, 255, 0.3);
      animation-delay: 0.6s;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.loading-state,
.error-state,
.empty-state {
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
  border-top-color: $color-sec;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-state {
  color: #ef4444;

  p {
    margin: 16px 0;
    color: #6b7280;
  }

  .retry-btn {
    padding: 10px 20px;
    background: $color-sec;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: $color-sec-s1;
    }
  }
}

.empty-state {
  @media (max-width: 480px) {
    padding: 40px 20px;
  }

  .empty-illustration {
    position: relative;
    width: 120px;
    height: 120px;
    margin-bottom: 24px;

    @media (max-width: 480px) {
      width: 100px;
      height: 100px;
      margin-bottom: 20px;
    }
  }

  .illustration-bg {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pulse-ring {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid rgba($color-sec, 0.2);
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
      transform: scale(0.5);
      opacity: 1;
    }
    100% {
      transform: scale(1.3);
      opacity: 0;
    }
  }

  .illustration-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba($color-sec, 0.1);
    border-radius: 50%;
    color: $color-sec;
  }

  h3 {
    font-size: 20px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 12px;

    @media (max-width: 480px) {
      font-size: 18px;
    }
  }

  p {
    color: #6b7280;
    margin: 0 0 24px;
    max-width: 420px;
    line-height: 1.6;
    font-size: 15px;

    @media (max-width: 480px) {
      font-size: 14px;
      margin-bottom: 20px;
    }
  }

  .empty-features {
    display: flex;
    gap: 24px;
    margin-bottom: 28px;

    @media (max-width: 480px) {
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #374151;
    font-weight: 500;

    svg {
      color: $color-sec;
    }

    @media (max-width: 480px) {
      font-size: 13px;
    }
  }

  .start-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    background: $color-sec;
    color: white;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 15px;
    transition: all 0.2s;
    box-shadow: 0 4px 12px rgba($color-sec, 0.25);

    @media (max-width: 480px) {
      width: 100%;
      justify-content: center;
      padding: 12px 24px;
    }

    &:hover {
      background: $color-sec-s1;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba($color-sec, 0.3);
    }
  }

  .credit-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 16px;
    font-size: 13px;
    color: #9ca3af;

    svg {
      color: #9ca3af;
    }
  }
}

.assessments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;

  @media (max-width: 480px) {
    gap: 10px;
  }
}

.assessment-card {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;

  @media (max-width: 480px) {
    padding: 14px;
    border-radius: 10px;
  }

  &:hover {
    border-color: $color-sec;
    box-shadow: 0 2px 8px rgba($color-sec, 0.15);
  }

  .card-main {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 0;
    overflow: hidden;

    @media (max-width: 480px) {
      gap: 12px;
    }
  }

  .score-circle {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    @media (max-width: 480px) {
      width: 48px;
      height: 48px;
    }

    &.excellent {
      background: linear-gradient(135deg, #10b981, #059669);
    }
    &.good {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
    }
    &.fair {
      background: linear-gradient(135deg, #f59e0b, #d97706);
    }
    &.needs-attention {
      background: linear-gradient(135deg, #f97316, #ea580c);
    }
    &.poor {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }
    &.default {
      background: #e5e7eb;
    }

    .score-value {
      font-size: 18px;
      font-weight: 700;
      color: white;

      @media (max-width: 480px) {
        font-size: 16px;
      }
    }
  }

  .card-info {
    flex: 1;
    min-width: 0;
    overflow: hidden;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;

      @media (max-width: 480px) {
        flex-wrap: wrap;
        gap: 6px;
      }
    }

    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;

      @media (max-width: 480px) {
        font-size: 11px;
        padding: 2px 6px;
      }

      &.excellent {
        background: #d1fae5;
        color: #059669;
      }
      &.good {
        background: #dbeafe;
        color: #2563eb;
      }
      &.fair {
        background: #fef3c7;
        color: #d97706;
      }
      &.needs-attention {
        background: #ffedd5;
        color: #ea580c;
      }
      &.poor {
        background: #fee2e2;
        color: #dc2626;
      }
      &.default {
        background: #f3f4f6;
        color: #6b7280;
      }
    }

    .date {
      font-size: 12px;
      color: #9ca3af;

      @media (max-width: 480px) {
        font-size: 11px;
      }
    }

    .summary {
      color: #374151;
      font-size: 14px;
      margin: 0 0 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;

      @media (max-width: 768px) {
        white-space: normal;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      @media (max-width: 480px) {
        font-size: 13px;
      }
    }

    .card-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #6b7280;

      @media (max-width: 480px) {
        gap: 12px;
        font-size: 11px;
      }

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }

  .card-arrow {
    color: #9ca3af;
    margin-left: 8px;

    @media (max-width: 480px) {
      display: none;
    }
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;

  @media (max-width: 480px) {
    gap: 12px;
    margin-top: 20px;
  }

  .page-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    color: #374151;
    cursor: pointer;

    @media (max-width: 480px) {
      width: 32px;
      height: 32px;
    }

    &:hover:not(:disabled) {
      background: #f9fafb;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .page-info {
    font-size: 14px;
    color: #6b7280;

    @media (max-width: 480px) {
      font-size: 13px;
    }
  }
}
</style>
