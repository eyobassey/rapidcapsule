<template>
  <div class="health-report">
    <!-- Hero Banner -->
    <div class="hero-banner">
      <div class="hero-background">
        <div class="hero-pattern"></div>
      </div>
      <div class="hero-content">
        <div class="hero-top">
          <button @click="goBack" class="back-link">
            <v-icon name="hi-arrow-left" scale="0.9" />
            Back to History
          </button>
          <div class="header-actions">
            <button @click="shareReport" class="action-btn">
              <v-icon name="hi-share" scale="0.9" />
              Share
            </button>
            <button @click="downloadReport" class="action-btn">
              <v-icon name="hi-download" scale="0.9" />
              Download
            </button>
          </div>
        </div>
        <div class="hero-main">
          <div class="hero-text">
            <div class="hero-badge">
              <v-icon name="hi-document-report" scale="0.9" />
              <span>Health Report</span>
            </div>
            <h1>Your Health Analysis</h1>
            <p class="hero-subtitle">AI-powered comprehensive health assessment with personalized insights and recommendations.</p>
          </div>
          <div class="hero-date" v-if="report">
            <v-icon name="hi-calendar" scale="1" />
            <span>{{ formatDate(report.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading your health report...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <v-icon name="hi-exclamation-circle" scale="2" />
      <p>{{ error }}</p>
      <button @click="fetchReport" class="retry-btn">Try Again</button>
    </div>

    <!-- Report Content -->
    <div v-else-if="report" class="report-content">
      <!-- Overall Score Card -->
      <div class="overall-score-card">
        <div class="score-circle" :class="getStatusClass(report.report.overall_status)">
          <span class="score-value">{{ report.report.overall_score }}</span>
          <span class="score-label">/ 100</span>
        </div>
        <div class="score-info">
          <h1>Your Health Score</h1>
          <span class="status-badge" :class="getStatusClass(report.report.overall_status)">
            {{ report.report.overall_status }}
          </span>
          <p class="summary">{{ report.report.overall_summary }}</p>
        </div>
      </div>

      <!-- Confidence Level -->
      <div class="confidence-banner" :class="report.report.confidence_level">
        <v-icon name="hi-information-circle" scale="1" />
        <span>
          Analysis confidence: <strong>{{ report.report.confidence_level }}</strong>
          <template v-if="report.report.data_sources_used">
            (Based on {{ report.report.data_sources_used.join(', ') }})
          </template>
        </span>
      </div>

      <!-- Domain Scores -->
      <div class="section">
        <h2 class="section-title">
          <v-icon name="hi-chart-pie" scale="1.2" />
          Health Domain Scores
        </h2>
        <div class="domain-scores">
          <div
            v-for="domain in report.report.domain_scores"
            :key="domain.domain"
            class="domain-card"
            :class="getStatusClass(domain.status)"
          >
            <div class="domain-header">
              <span class="domain-icon">{{ getDomainIcon(domain.domain) }}</span>
              <h3>{{ domain.domain_label }}</h3>
            </div>
            <div class="domain-score">
              <div class="score-bar-bg">
                <div
                  class="score-bar-fill"
                  :style="{ width: domain.score + '%' }"
                  :class="getStatusClass(domain.status)"
                ></div>
              </div>
              <span class="score-text">{{ domain.score }}/100</span>
            </div>
            <p class="domain-insights">{{ domain.insights }}</p>
            <div v-if="domain.recommendations && domain.recommendations.length" class="domain-recommendations">
              <strong>Recommendations:</strong>
              <ul>
                <li v-for="(rec, idx) in domain.recommendations" :key="idx">{{ rec }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Priority Actions -->
      <div v-if="report.report.priority_actions && report.report.priority_actions.length" class="section">
        <h2 class="section-title">
          <v-icon name="hi-flag" scale="1.2" />
          Priority Actions
        </h2>
        <div class="priority-actions">
          <div
            v-for="(action, idx) in report.report.priority_actions"
            :key="idx"
            class="action-card"
            :class="action.priority"
          >
            <div class="action-priority">
              <span class="priority-badge" :class="action.priority">{{ action.priority }}</span>
            </div>
            <div class="action-content">
              <h4>{{ action.action }}</h4>
              <p>{{ action.reason }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Analysis -->
      <div v-if="report.report.detailed_analysis" class="section">
        <h2 class="section-title">
          <v-icon name="hi-document-text" scale="1.2" />
          Detailed Analysis
        </h2>
        <div class="analysis-content">
          <p>{{ report.report.detailed_analysis }}</p>
        </div>
      </div>

      <!-- Lifestyle Tips -->
      <div v-if="report.report.lifestyle_tips && report.report.lifestyle_tips.length" class="section">
        <h2 class="section-title">
          <v-icon name="hi-light-bulb" scale="1.2" />
          Lifestyle Tips
        </h2>
        <div class="tips-list">
          <div v-for="(tip, idx) in report.report.lifestyle_tips" :key="idx" class="tip-item">
            <v-icon name="hi-check-circle" scale="1" />
            <span>{{ tip }}</span>
          </div>
        </div>
      </div>

      <!-- When to See a Doctor -->
      <div v-if="report.report.when_to_see_doctor && report.report.when_to_see_doctor.length" class="section warning-section">
        <h2 class="section-title">
          <v-icon name="hi-exclamation" scale="1.2" />
          When to See a Doctor
        </h2>
        <div class="doctor-alerts">
          <div v-for="(alert, idx) in report.report.when_to_see_doctor" :key="idx" class="alert-item">
            <v-icon name="hi-exclamation-circle" scale="1" />
            <span>{{ alert }}</span>
          </div>
        </div>
      </div>

      <!-- Documents Used -->
      <div v-if="report.documents && report.documents.length" class="section">
        <h2 class="section-title">
          <v-icon name="hi-document" scale="1.2" />
          Documents Analyzed
        </h2>
        <div class="documents-list">
          <div v-for="(doc, idx) in report.documents" :key="idx" class="document-item">
            <v-icon :name="getDocIcon(doc.file_type)" scale="1" />
            <span>{{ doc.original_name }}</span>
          </div>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="disclaimer">
        <v-icon name="hi-information-circle" scale="1" />
        <p>{{ report.report.disclaimer || defaultDisclaimer }}</p>
      </div>

      <!-- Report Metadata -->
      <div class="report-meta">
        <p>Report generated on {{ formatDate(report.created_at) }}</p>
        <p>Credits used: {{ report.credits_used }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import apiFactory from "@/services/apiFactory";

export default {
  name: "AdvancedHealthScoreReport",
  data() {
    return {
      loading: true,
      error: null,
      report: null,
      defaultDisclaimer:
        "This health assessment is for informational purposes only and does not constitute medical advice. Always consult with a qualified healthcare provider for medical decisions.",
    };
  },
  computed: {
    assessmentId() {
      return this.$route.params.id;
    },
  },
  async mounted() {
    await this.fetchReport();
  },
  methods: {
    async fetchReport() {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiFactory.$_getAdvancedHealthScoreById(this.assessmentId);
        this.report = response.data?.data || response.data;
      } catch (err) {
        console.error("Error fetching report:", err);
        this.error = "Unable to load your health report. Please try again.";
      } finally {
        this.loading = false;
      }
    },
    goBack() {
      this.$router.push("/app/patient/advanced-health-score/history");
    },
    getStatusClass(status) {
      const statusMap = {
        Excellent: "excellent",
        Good: "good",
        Fair: "fair",
        "Needs Attention": "needs-attention",
        Poor: "poor",
      };
      return statusMap[status] || "fair";
    },
    getDomainIcon(domain) {
      const icons = {
        cardiovascular: "❤️",
        metabolic: "⚡",
        mental_wellbeing: "🧠",
        lifestyle: "🏃",
        physical_symptoms: "🩺",
        preventive_care: "🛡️",
      };
      return icons[domain] || "📊";
    },
    getDocIcon(fileType) {
      if (fileType?.includes("pdf")) return "hi-document-text";
      if (fileType?.includes("image")) return "hi-photograph";
      return "hi-document";
    },
    formatDate(dateStr) {
      if (!dateStr) return "";
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    shareReport() {
      if (navigator.share) {
        navigator.share({
          title: "My Advanced Health Score Report",
          text: `My health score is ${this.report?.report?.overall_score}/100`,
          url: window.location.href,
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        alert("Report link copied to clipboard!");
      }
    },
    async downloadReport() {
      // Create a printable version of the report
      const reportContent = this.$el.querySelector('.report-content');
      if (!reportContent) {
        this.$toast.error('Report content not found');
        return;
      }

      // Create a new window with just the report content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        this.$toast.error('Please allow popups to download the report');
        return;
      }

      const reportDate = this.formatDate(this.report?.created_at);
      const user = this.$store.state.userProfile;
      const profile = user?.profile || {};
      const patientName = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Patient';
      const patientEmail = profile?.contact?.email || user?.email || 'N/A';

      // Format phone number from contact object
      const phoneCountryCode = profile?.contact?.phone?.country_code || '';
      const phoneNumber = profile?.contact?.phone?.number || '';
      const patientPhone = phoneCountryCode && phoneNumber
        ? `${phoneCountryCode}${phoneNumber}`
        : (profile?.phone_number || 'N/A');

      const patientDOB = profile?.date_of_birth
        ? new Date(profile.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'N/A';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Health Report - ${patientName} - Rapid Capsule</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }

            /* Page numbering */
            @page {
              size: A4;
              margin: 15mm 15mm 20mm 15mm;
              @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 10px;
                color: #64748b;
              }
            }

            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', sans-serif;
              padding: 0;
              color: #1f2937;
              line-height: 1.6;
              background: #fff;
              counter-reset: page;
            }

            /* Header with Logo */
            .report-header {
              background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
              padding: 30px 40px;
              color: white;
            }
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 25px;
              padding-bottom: 20px;
              border-bottom: 1px solid rgba(255,255,255,0.2);
            }
            .logo-section {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .logo-img {
              width: 55px;
              height: 55px;
              object-fit: contain;
              background: white;
              border-radius: 10px;
              padding: 6px;
            }
            .logo-text {
              font-size: 26px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .logo-tagline {
              font-size: 12px;
              opacity: 0.9;
              margin-top: 2px;
            }
            .report-meta {
              text-align: right;
              font-size: 13px;
            }
            .report-meta p {
              margin: 3px 0;
              opacity: 0.9;
            }
            .report-id {
              font-family: monospace;
              background: rgba(255,255,255,0.2);
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 11px;
            }
            .header-title {
              text-align: center;
            }
            .header-title h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 5px;
              letter-spacing: -0.5px;
            }
            .header-title p {
              font-size: 14px;
              opacity: 0.9;
            }

            /* Patient Info Section */
            .patient-section {
              background: #f8fafc;
              padding: 25px 40px;
              border-bottom: 1px solid #e2e8f0;
            }
            .patient-title {
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #64748b;
              margin-bottom: 15px;
              font-weight: 600;
            }
            .patient-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
            }
            .patient-item {
              display: flex;
              flex-direction: column;
            }
            .patient-label {
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #94a3b8;
              margin-bottom: 4px;
              font-weight: 500;
            }
            .patient-value {
              font-size: 14px;
              color: #1e293b;
              font-weight: 500;
            }

            /* Main Content */
            .main-content {
              padding: 30px 40px;
            }

            /* Score Section */
            .score-section {
              display: flex;
              align-items: center;
              gap: 30px;
              padding: 30px;
              background: linear-gradient(135deg, #f0fdfa 0%, #e0f7fa 100%);
              border-radius: 16px;
              border: 1px solid #99f6e4;
              margin-bottom: 30px;
            }
            .score-circle {
              width: 140px;
              height: 140px;
              border-radius: 50%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
              box-shadow: 0 10px 40px rgba(14, 174, 196, 0.3);
            }
            .score-circle.excellent { background: linear-gradient(135deg, #10b981, #059669); }
            .score-circle.good { background: linear-gradient(135deg, #3b82f6, #2563eb); }
            .score-circle.fair { background: linear-gradient(135deg, #f59e0b, #d97706); }
            .score-circle.needs-attention { background: linear-gradient(135deg, #f97316, #ea580c); }
            .score-circle.poor { background: linear-gradient(135deg, #ef4444, #dc2626); }
            .score-value { font-size: 52px; font-weight: 800; color: white; line-height: 1; }
            .score-max { font-size: 16px; color: rgba(255,255,255,0.8); margin-top: 4px; }
            .score-details { flex: 1; }
            .score-details h2 { font-size: 22px; color: #0f172a; margin-bottom: 8px; }
            .status-badge {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 13px;
              margin-bottom: 12px;
            }
            .status-excellent { background: #d1fae5; color: #059669; }
            .status-good { background: #dbeafe; color: #2563eb; }
            .status-fair { background: #fef3c7; color: #d97706; }
            .status-needs-attention { background: #ffedd5; color: #ea580c; }
            .status-poor { background: #fee2e2; color: #dc2626; }
            .score-summary { color: #475569; font-size: 14px; line-height: 1.6; }

            /* Sections */
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: #0f172a;
              margin-bottom: 16px;
              padding-bottom: 10px;
              border-bottom: 2px solid #0EAEC4;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .section-icon {
              width: 24px;
              height: 24px;
              background: #0EAEC4;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 12px;
            }

            /* Domain Cards */
            .domain-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
            }
            .domain-card {
              padding: 20px;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              background: #fff;
              page-break-inside: avoid;
            }
            .domain-card.excellent { border-left: 4px solid #10b981; }
            .domain-card.good { border-left: 4px solid #3b82f6; }
            .domain-card.fair { border-left: 4px solid #f59e0b; }
            .domain-card.needs-attention { border-left: 4px solid #f97316; }
            .domain-card.poor { border-left: 4px solid #ef4444; }
            .domain-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
            .domain-name { display: flex; align-items: center; gap: 8px; }
            .domain-name span { font-size: 18px; }
            .domain-name h3 { font-size: 15px; font-weight: 600; color: #1e293b; }
            .domain-score-badge { font-size: 14px; font-weight: 700; color: #0EAEC4; }
            .score-bar { height: 6px; background: #e2e8f0; border-radius: 3px; margin-bottom: 12px; overflow: hidden; }
            .score-bar-fill { height: 100%; border-radius: 3px; background: #0EAEC4; }
            .domain-insights { color: #64748b; font-size: 13px; line-height: 1.5; margin-bottom: 12px; }
            .recommendations { background: #f8fafc; border-radius: 8px; padding: 12px; }
            .recommendations strong { font-size: 12px; color: #475569; display: block; margin-bottom: 8px; }
            .recommendations ul { margin: 0; padding-left: 18px; }
            .recommendations li { font-size: 12px; color: #64748b; margin-bottom: 4px; }

            /* Priority Actions */
            .action-card {
              padding: 16px;
              margin-bottom: 12px;
              border-radius: 10px;
              border-left: 4px solid;
              display: flex;
              gap: 12px;
              align-items: flex-start;
            }
            .action-card.high { border-color: #dc2626; background: #fef2f2; }
            .action-card.medium { border-color: #d97706; background: #fffbeb; }
            .action-card.low { border-color: #059669; background: #f0fdf4; }
            .priority-badge {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              flex-shrink: 0;
            }
            .priority-badge.high { background: #dc2626; color: white; }
            .priority-badge.medium { background: #d97706; color: white; }
            .priority-badge.low { background: #059669; color: white; }
            .action-content h4 { font-size: 14px; color: #1e293b; margin-bottom: 4px; }
            .action-content p { font-size: 13px; color: #64748b; margin: 0; }

            /* Analysis & Tips */
            .analysis-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
            }
            .analysis-box p { color: #475569; font-size: 14px; line-height: 1.7; white-space: pre-line; }
            .tips-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
            }
            .tip-item {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              padding: 12px;
              background: #f0fdf4;
              border-radius: 8px;
              border: 1px solid #bbf7d0;
            }
            .tip-icon { color: #10b981; font-size: 14px; flex-shrink: 0; }
            .tip-item span { font-size: 13px; color: #166534; }
            .alert-item {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              padding: 12px;
              background: #fef2f2;
              border-radius: 8px;
              border: 1px solid #fecaca;
              margin-bottom: 10px;
            }
            .alert-icon { color: #dc2626; font-size: 14px; flex-shrink: 0; }
            .alert-item span { font-size: 13px; color: #991b1b; }

            /* Disclaimer */
            .disclaimer {
              margin-top: 30px;
              padding: 16px 20px;
              background: #f1f5f9;
              border-radius: 10px;
              border-left: 4px solid #94a3b8;
            }
            .disclaimer strong { font-size: 12px; color: #475569; display: block; margin-bottom: 6px; }
            .disclaimer p { font-size: 12px; color: #64748b; margin: 0; line-height: 1.5; }

            /* Footer */
            .report-footer {
              margin-top: 40px;
              padding: 25px 40px;
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
              text-align: center;
            }
            .footer-logo {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              margin-bottom: 10px;
            }
            .footer-logo-img {
              width: 32px;
              height: 32px;
              object-fit: contain;
            }
            .footer-logo span { font-size: 18px; font-weight: 600; color: #0EAEC4; }
            .footer-text { font-size: 12px; color: #94a3b8; margin: 4px 0; }
            .footer-contact { font-size: 11px; color: #cbd5e1; margin-top: 12px; }

            /* Page number footer for print */
            .page-footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              height: 30px;
              text-align: center;
              font-size: 10px;
              color: #64748b;
              background: white;
              padding-top: 10px;
              border-top: 1px solid #e2e8f0;
            }

            @media print {
              body { padding: 0; padding-bottom: 40px; }
              .report-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .score-circle { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .status-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .domain-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .action-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .priority-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .tip-item { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .alert-item { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .section { page-break-inside: avoid; }
              .domain-grid { grid-template-columns: repeat(2, 1fr); }
              .page-footer { display: block; }
            }

            @media screen {
              .page-footer { display: none; }
            }
          </style>
        </head>
        <body>
          <!-- Header with Logo -->
          <div class="report-header">
            <div class="header-top">
              <div class="logo-section">
                <img src="https://rapidcapsule.com/RapidCapsule.png" alt="Rapid Capsule" class="logo-img" />
                <div>
                  <div class="logo-text">Rapid Capsule</div>
                  <div class="logo-tagline">Healthcare Made Simple</div>
                </div>
              </div>
              <div class="report-meta">
                <p><strong>Report Generated:</strong></p>
                <p>${reportDate}</p>
                <p class="report-id">ID: ${this.assessmentId?.slice(-8) || 'N/A'}</p>
              </div>
            </div>
            <div class="header-title">
              <h1>Advanced Health Score Report</h1>
              <p>Comprehensive AI-Powered Health Analysis</p>
            </div>
          </div>

          <!-- Patient Information -->
          <div class="patient-section">
            <div class="patient-title">Patient Information</div>
            <div class="patient-grid">
              <div class="patient-item">
                <span class="patient-label">Full Name</span>
                <span class="patient-value">${patientName}</span>
              </div>
              <div class="patient-item">
                <span class="patient-label">Email Address</span>
                <span class="patient-value">${patientEmail}</span>
              </div>
              <div class="patient-item">
                <span class="patient-label">Date of Birth</span>
                <span class="patient-value">${patientDOB}</span>
              </div>
              <div class="patient-item">
                <span class="patient-label">Phone Number</span>
                <span class="patient-value">${patientPhone}</span>
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div class="main-content">
            <!-- Overall Score -->
            <div class="score-section">
              <div class="score-circle ${this.getStatusClass(this.report.report.overall_status)}">
                <span class="score-value">${this.report.report.overall_score}</span>
                <span class="score-max">/ 100</span>
              </div>
              <div class="score-details">
                <h2>Your Health Score</h2>
                <span class="status-badge status-${this.getStatusClass(this.report.report.overall_status)}">${this.report.report.overall_status}</span>
                <p class="score-summary">${this.report.report.overall_summary}</p>
              </div>
            </div>

            <!-- Domain Scores -->
            <div class="section">
              <h2 class="section-title">
                <span class="section-icon">📊</span>
                Health Domain Scores
              </h2>
              <div class="domain-grid">
                ${this.report.report.domain_scores.map(domain => `
                  <div class="domain-card ${this.getStatusClass(domain.status)}">
                    <div class="domain-header">
                      <div class="domain-name">
                        <span>${this.getDomainIcon(domain.domain)}</span>
                        <h3>${domain.domain_label}</h3>
                      </div>
                      <span class="domain-score-badge">${domain.score}/100</span>
                    </div>
                    <div class="score-bar">
                      <div class="score-bar-fill" style="width: ${domain.score}%"></div>
                    </div>
                    <p class="domain-insights">${domain.insights}</p>
                    ${domain.recommendations?.length ? `
                      <div class="recommendations">
                        <strong>Recommendations:</strong>
                        <ul>
                          ${domain.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Priority Actions -->
            ${this.report.report.priority_actions?.length ? `
              <div class="section">
                <h2 class="section-title">
                  <span class="section-icon">🎯</span>
                  Priority Actions
                </h2>
                ${this.report.report.priority_actions.map(action => `
                  <div class="action-card ${action.priority}">
                    <span class="priority-badge ${action.priority}">${action.priority}</span>
                    <div class="action-content">
                      <h4>${action.action}</h4>
                      <p>${action.reason}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Detailed Analysis -->
            ${this.report.report.detailed_analysis ? `
              <div class="section">
                <h2 class="section-title">
                  <span class="section-icon">📋</span>
                  Detailed Analysis
                </h2>
                <div class="analysis-box">
                  <p>${this.report.report.detailed_analysis}</p>
                </div>
              </div>
            ` : ''}

            <!-- Lifestyle Tips -->
            ${this.report.report.lifestyle_tips?.length ? `
              <div class="section">
                <h2 class="section-title">
                  <span class="section-icon">💡</span>
                  Lifestyle Recommendations
                </h2>
                <div class="tips-grid">
                  ${this.report.report.lifestyle_tips.map(tip => `
                    <div class="tip-item">
                      <span class="tip-icon">✓</span>
                      <span>${tip}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- When to See a Doctor -->
            ${this.report.report.when_to_see_doctor?.length ? `
              <div class="section">
                <h2 class="section-title">
                  <span class="section-icon">⚠️</span>
                  When to See a Doctor
                </h2>
                ${this.report.report.when_to_see_doctor.map(alert => `
                  <div class="alert-item">
                    <span class="alert-icon">!</span>
                    <span>${alert}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Disclaimer -->
            <div class="disclaimer">
              <strong>Medical Disclaimer</strong>
              <p>${this.report.report.disclaimer || this.defaultDisclaimer}</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="report-footer">
            <div class="footer-logo">
              <img src="https://rapidcapsule.com/RapidCapsule.png" alt="Rapid Capsule" class="footer-logo-img" />
              <span>Rapid Capsule</span>
            </div>
            <p class="footer-text">This report was generated by Rapid Capsule's AI Health Analysis System</p>
            <p class="footer-text">For medical concerns, please consult a qualified healthcare professional</p>
            <p class="footer-contact">www.rapidcapsule.com | support@rapidcapsule.com</p>
          </div>

          <!-- Page Footer for Print -->
          <div class="page-footer">
            Rapid Capsule Healthcare | Advanced Health Score Report | Confidential
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
      }, 500);
    },
  },
};
</script>

<style scoped lang="scss">
.health-report {
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

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    margin-bottom: 12px;
  }
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.9);
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: white;
  }

  @media (max-width: 480px) {
    font-size: 13px;
  }
}

.header-actions {
  display: flex;
  gap: 8px;

  @media (max-width: 480px) {
    gap: 4px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    @media (max-width: 480px) {
      padding: 8px 10px;
      font-size: 12px;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.hero-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}

.hero-text {
  flex: 1;

  h1 {
    font-size: 28px;
    font-weight: 700;
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
  max-width: 450px;

  @media (max-width: 480px) {
    font-size: 13px;
  }
}

.hero-date {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 10px 16px;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;

  @media (max-width: 480px) {
    font-size: 13px;
    padding: 8px 12px;
  }
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e5e7eb;
  border-top-color: #0eaec4;
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
    background: #0eaec4;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      background: #0d9eb3;
    }
  }
}

.overall-score-card {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 32px;
  margin-bottom: 16px;

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    padding: 24px 20px;
    gap: 20px;
  }

  .score-circle {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    @media (max-width: 480px) {
      width: 120px;
      height: 120px;
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

    .score-value {
      font-size: 48px;
      font-weight: 700;
      color: white;
      line-height: 1;

      @media (max-width: 480px) {
        font-size: 40px;
      }
    }

    .score-label {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.8);

      @media (max-width: 480px) {
        font-size: 14px;
      }
    }
  }

  .score-info {
    flex: 1;

    h1 {
      font-size: 24px;
      color: #111827;
      margin: 0 0 8px;

      @media (max-width: 480px) {
        font-size: 20px;
      }
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 12px;

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
    }

    .summary {
      color: #6b7280;
      margin: 0;
      line-height: 1.6;
    }
  }
}

.confidence-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 24px;

  @media (max-width: 480px) {
    font-size: 13px;
    padding: 10px 12px;
    flex-wrap: wrap;
  }

  &.high {
    background: #d1fae5;
    color: #059669;
  }
  &.medium {
    background: #fef3c7;
    color: #92400e;
  }
  &.low {
    background: #fee2e2;
    color: #dc2626;
  }
}

.section {
  margin-bottom: 24px;

  &.warning-section {
    .section-title {
      color: #dc2626;
    }
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  color: #111827;
  margin: 0 0 16px;

  @media (max-width: 480px) {
    font-size: 16px;
    margin-bottom: 12px;
  }
}

.domain-scores {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
}

.domain-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 10px;
  }

  &.excellent {
    border-left: 4px solid #10b981;
  }
  &.good {
    border-left: 4px solid #3b82f6;
  }
  &.fair {
    border-left: 4px solid #f59e0b;
  }
  &.needs-attention {
    border-left: 4px solid #f97316;
  }
  &.poor {
    border-left: 4px solid #ef4444;
  }

  .domain-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .domain-icon {
      font-size: 20px;

      @media (max-width: 480px) {
        font-size: 18px;
      }
    }

    h3 {
      font-size: 16px;
      color: #111827;
      margin: 0;

      @media (max-width: 480px) {
        font-size: 15px;
      }
    }
  }

  .domain-score {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    .score-bar-bg {
      flex: 1;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }

    .score-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;

      &.excellent {
        background: #10b981;
      }
      &.good {
        background: #3b82f6;
      }
      &.fair {
        background: #f59e0b;
      }
      &.needs-attention {
        background: #f97316;
      }
      &.poor {
        background: #ef4444;
      }
    }

    .score-text {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      min-width: 60px;
    }
  }

  .domain-insights {
    color: #6b7280;
    font-size: 14px;
    margin: 0 0 12px;
    line-height: 1.5;
  }

  .domain-recommendations {
    font-size: 13px;

    strong {
      color: #374151;
    }

    ul {
      margin: 8px 0 0;
      padding-left: 18px;

      li {
        color: #6b7280;
        margin-bottom: 4px;
      }
    }
  }
}

.priority-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-card {
  display: flex;
  gap: 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 12px;
    padding: 14px;
  }

  &.high {
    border-left: 4px solid #ef4444;
  }
  &.medium {
    border-left: 4px solid #f59e0b;
  }
  &.low {
    border-left: 4px solid #3b82f6;
  }

  .priority-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;

    &.high {
      background: #fee2e2;
      color: #dc2626;
    }
    &.medium {
      background: #fef3c7;
      color: #d97706;
    }
    &.low {
      background: #dbeafe;
      color: #2563eb;
    }
  }

  .action-content {
    flex: 1;

    h4 {
      font-size: 15px;
      color: #111827;
      margin: 0 0 4px;

      @media (max-width: 480px) {
        font-size: 14px;
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
}

.analysis-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 10px;
  }

  p {
    color: #374151;
    line-height: 1.7;
    margin: 0;
    white-space: pre-line;

    @media (max-width: 480px) {
      font-size: 14px;
      line-height: 1.6;
    }
  }
}

.tips-list {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 10px;
  }
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  color: #374151;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
    gap: 10px;
    padding: 10px 0;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f3f4f6;
  }

  svg {
    color: #10b981;
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.doctor-alerts {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 16px;

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 10px;
  }
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  color: #991b1b;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
    gap: 10px;
    padding: 10px 0;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #fecaca;
  }

  svg {
    color: #dc2626;
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.documents-list {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 10px;
  }
}

.document-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  color: #374151;
  font-size: 14px;

  @media (max-width: 480px) {
    font-size: 13px;
    gap: 10px;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f3f4f6;
  }

  svg {
    color: #6b7280;
  }
}

.disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f3f4f6;
  border-radius: 8px;
  margin-bottom: 16px;

  @media (max-width: 480px) {
    padding: 12px;
    gap: 10px;
  }

  svg {
    color: #6b7280;
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    color: #6b7280;
    font-size: 13px;
    margin: 0;
    line-height: 1.5;

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }
}

.report-meta {
  text-align: center;
  color: #9ca3af;
  font-size: 12px;

  p {
    margin: 4px 0;
  }
}

@media print {
  .page-header {
    display: none;
  }

  .health-report {
    padding: 0;
  }
}
</style>
