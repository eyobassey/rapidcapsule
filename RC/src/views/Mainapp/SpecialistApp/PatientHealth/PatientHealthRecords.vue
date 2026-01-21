<template>
  <div class="health-records">
    <!-- Hero Banner -->
    <div class="hero-wrapper">
      <div class="hero-banner">
        <div class="hero-background">
          <div class="hero-gradient"></div>
          <div class="hero-pattern"></div>
          <div class="hero-glow"></div>
        </div>
        <div class="hero-content">
          <div class="hero-top">
            <button @click="goBack" class="back-link">
              <v-icon name="hi-arrow-left" scale="0.9" />
              <span>Back to Appointment</span>
            </button>
          </div>
          <div class="hero-main">
            <div class="patient-header" v-if="patient">
              <div class="patient-avatar">
                <img v-if="patientProfileImage" :src="patientProfileImage" alt="Patient" @error="handleImageError" />
                <div v-else class="avatar-placeholder">
                  <span>{{ getInitials(patient.name) }}</span>
                </div>
              </div>
              <div class="patient-info">
                <span class="patient-badge">Patient Health Records</span>
                <h1>{{ patient.name }}</h1>
                <div class="patient-meta">
                  <span v-if="patient.gender" class="meta-item">
                    <v-icon name="hi-user" scale="0.7" />
                    {{ patient.gender }}
                  </span>
                  <span v-if="patient.age" class="meta-item">
                    <v-icon name="hi-calendar" scale="0.7" />
                    {{ patient.age }} years old
                  </span>
                  <span v-if="patient.email" class="meta-item">
                    <v-icon name="hi-mail" scale="0.7" />
                    {{ patient.email }}
                  </span>
                </div>
              </div>
            </div>
            <div class="hero-scores" v-if="healthScores">
              <div class="score-pill" :class="getScoreClass(healthScores.basic?.score)">
                <div class="score-pill-inner">
                  <span class="score-label">Basic Score</span>
                  <span class="score-value">{{ healthScores.basic?.score ?? '-' }}</span>
                </div>
                <div class="score-ring" :style="getRingStyle(healthScores.basic?.score)"></div>
              </div>
              <div class="score-pill" :class="getScoreClass(healthScores.advanced?.latest_score)">
                <div class="score-pill-inner">
                  <span class="score-label">Advanced Score</span>
                  <span class="score-value">{{ healthScores.advanced?.latest_score ?? '-' }}</span>
                </div>
                <div class="score-ring" :style="getRingStyle(healthScores.advanced?.latest_score)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="loading-spinner">
        <div class="spinner-ring"></div>
        <v-icon name="hi-heart" scale="1.2" class="spinner-icon" />
      </div>
      <p>Loading patient health records...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">
        <v-icon name="hi-exclamation-circle" scale="2.5" />
      </div>
      <h3>Unable to Load Records</h3>
      <p>{{ error }}</p>
      <button @click="fetchRecords" class="retry-btn">
        <v-icon name="hi-refresh" scale="0.9" />
        Try Again
      </button>
    </div>

    <!-- Main Content -->
    <div v-else class="records-content">
      <!-- Tab Navigation -->
      <div class="tabs-container">
        <div class="tabs-wrapper">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            :class="['tab-btn', { active: activeTab === tab.value }]"
            @click="activeTab = tab.value"
          >
            <v-icon :name="tab.icon" scale="0.9" />
            <span class="tab-label">{{ tab.label }}</span>
            <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
          </button>
        </div>
      </div>

      <!-- Health Scores Tab -->
      <div v-if="activeTab === 'scores'" class="tab-content">
        <div class="scores-grid">
          <!-- Basic Health Score Card -->
          <div class="score-card-large glass-card">
            <div class="card-accent basic"></div>
            <div class="card-header">
              <div class="header-left">
                <div class="header-icon basic">
                  <v-icon name="hi-heart" scale="1.2" />
                </div>
                <div>
                  <h3>Basic Health Score</h3>
                  <span v-if="healthScores.basic?.updated_at" class="card-date">
                    Updated {{ formatDate(healthScores.basic.updated_at) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="card-body" v-if="healthScores.basic?.score !== null">
              <div class="score-visual">
                <svg class="score-ring-svg" viewBox="0 0 120 120">
                  <circle class="ring-bg" cx="60" cy="60" r="52" />
                  <circle
                    class="ring-progress"
                    :class="getScoreClass(healthScores.basic.score)"
                    cx="60" cy="60" r="52"
                    :style="{ strokeDashoffset: getStrokeDashoffset(healthScores.basic.score) }"
                  />
                </svg>
                <div class="score-center">
                  <span class="big-score">{{ healthScores.basic.score }}</span>
                  <span class="score-max">of 100</span>
                </div>
              </div>
              <div class="score-status" :class="getScoreClass(healthScores.basic.score)">
                {{ healthScores.basic.status || getScoreLabel(healthScores.basic.score) }}
              </div>

              <!-- Breakdown -->
              <div class="breakdown" v-if="healthScores.basic?.breakdown">
                <h4>Score Breakdown</h4>
                <div class="breakdown-items">
                  <div class="breakdown-item" v-if="healthScores.basic.breakdown.bmi">
                    <div class="item-left">
                      <span class="item-dot" :class="healthScores.basic.breakdown.bmi.status"></span>
                      <span class="item-label">BMI</span>
                    </div>
                    <span class="item-value" :class="healthScores.basic.breakdown.bmi.status">
                      {{ healthScores.basic.breakdown.bmi.message }}
                    </span>
                  </div>
                  <div class="breakdown-item" v-if="healthScores.basic.breakdown.bloodPressure">
                    <div class="item-left">
                      <span class="item-dot" :class="healthScores.basic.breakdown.bloodPressure.status"></span>
                      <span class="item-label">Blood Pressure</span>
                    </div>
                    <span class="item-value" :class="healthScores.basic.breakdown.bloodPressure.status">
                      {{ healthScores.basic.breakdown.bloodPressure.message }}
                    </span>
                  </div>
                  <div class="breakdown-item" v-if="healthScores.basic.breakdown.pulseRate">
                    <div class="item-left">
                      <span class="item-dot" :class="healthScores.basic.breakdown.pulseRate.status"></span>
                      <span class="item-label">Pulse Rate</span>
                    </div>
                    <span class="item-value" :class="healthScores.basic.breakdown.pulseRate.status">
                      {{ healthScores.basic.breakdown.pulseRate.message }}
                    </span>
                  </div>
                  <div class="breakdown-item" v-if="healthScores.basic.breakdown.temperature">
                    <div class="item-left">
                      <span class="item-dot" :class="healthScores.basic.breakdown.temperature.status"></span>
                      <span class="item-label">Temperature</span>
                    </div>
                    <span class="item-value" :class="healthScores.basic.breakdown.temperature.status">
                      {{ healthScores.basic.breakdown.temperature.message }}
                    </span>
                  </div>
                  <div class="breakdown-item" v-if="healthScores.basic.breakdown.bloodSugar">
                    <div class="item-left">
                      <span class="item-dot" :class="healthScores.basic.breakdown.bloodSugar.status"></span>
                      <span class="item-label">Blood Sugar</span>
                    </div>
                    <span class="item-value" :class="healthScores.basic.breakdown.bloodSugar.status">
                      {{ healthScores.basic.breakdown.bloodSugar.message }}
                    </span>
                  </div>
                  <div class="breakdown-item" v-if="healthScores.basic.breakdown.triage">
                    <div class="item-left">
                      <span class="item-dot" :class="healthScores.basic.breakdown.triage.status"></span>
                      <span class="item-label">Recent Checkup</span>
                    </div>
                    <span class="item-value" :class="healthScores.basic.breakdown.triage.status">
                      {{ healthScores.basic.breakdown.triage.message }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-body empty-state-card" v-else>
              <div class="empty-icon">
                <v-icon name="hi-minus-circle" scale="2.5" />
              </div>
              <p>Basic health score not calculated yet</p>
            </div>
          </div>

          <!-- Advanced Health Score Card -->
          <div class="score-card-large glass-card advanced">
            <div class="card-accent advanced"></div>
            <div class="card-header">
              <div class="header-left">
                <div class="header-icon advanced">
                  <v-icon name="hi-sparkles" scale="1.2" />
                </div>
                <div>
                  <h3>Advanced Health Score</h3>
                  <span class="card-date">{{ healthScores.advanced?.total_assessments || 0 }} assessment(s)</span>
                </div>
              </div>
            </div>
            <div class="card-body" v-if="healthScores.advanced?.latest_score !== null">
              <div class="score-visual">
                <svg class="score-ring-svg" viewBox="0 0 120 120">
                  <circle class="ring-bg" cx="60" cy="60" r="52" />
                  <circle
                    class="ring-progress"
                    :class="getScoreClass(healthScores.advanced.latest_score)"
                    cx="60" cy="60" r="52"
                    :style="{ strokeDashoffset: getStrokeDashoffset(healthScores.advanced.latest_score) }"
                  />
                </svg>
                <div class="score-center">
                  <span class="big-score">{{ healthScores.advanced.latest_score }}</span>
                  <span class="score-max">of 100</span>
                </div>
              </div>
              <div class="score-status" :class="getScoreClass(healthScores.advanced.latest_score)">
                {{ healthScores.advanced.latest_status || getScoreLabel(healthScores.advanced.latest_score) }}
              </div>
              <button @click="activeTab = 'advanced'" class="view-all-btn">
                <span>View All Assessments</span>
                <v-icon name="hi-arrow-right" scale="0.8" />
              </button>
            </div>
            <div class="card-body empty-state-card" v-else>
              <div class="empty-icon">
                <v-icon name="hi-sparkles" scale="2.5" />
              </div>
              <p>No advanced health assessments</p>
            </div>
          </div>
        </div>

        <!-- Vitals Section -->
        <div class="vitals-section glass-card" v-if="vitals && hasVitals">
          <div class="section-header-styled">
            <div class="header-icon vitals">
              <v-icon name="hi-chart-bar" scale="1.2" />
            </div>
            <h3>Current Vitals</h3>
          </div>
          <div class="vitals-grid">
            <div class="vital-card" v-if="vitals.blood_pressure?.length">
              <div class="vital-icon-wrapper bp">
                <v-icon name="hi-heart" scale="1.4" />
              </div>
              <div class="vital-info">
                <span class="vital-label">Blood Pressure</span>
                <span class="vital-value">{{ vitals.blood_pressure[0]?.value }}</span>
                <span class="vital-unit">{{ vitals.blood_pressure[0]?.unit }}</span>
              </div>
            </div>
            <div class="vital-card" v-if="vitals.pulse_rate?.length">
              <div class="vital-icon-wrapper pulse">
                <v-icon name="fa-heartbeat" scale="1.4" />
              </div>
              <div class="vital-info">
                <span class="vital-label">Pulse Rate</span>
                <span class="vital-value">{{ vitals.pulse_rate[0]?.value }}</span>
                <span class="vital-unit">{{ vitals.pulse_rate[0]?.unit }}</span>
              </div>
            </div>
            <div class="vital-card" v-if="vitals.blood_sugar_level?.length">
              <div class="vital-icon-wrapper sugar">
                <v-icon name="gi-drop" scale="1.4" />
              </div>
              <div class="vital-info">
                <span class="vital-label">Blood Sugar</span>
                <span class="vital-value">{{ vitals.blood_sugar_level[0]?.value }}</span>
                <span class="vital-unit">{{ vitals.blood_sugar_level[0]?.unit }}</span>
              </div>
            </div>
            <div class="vital-card" v-if="vitals.body_temp?.length">
              <div class="vital-icon-wrapper temp">
                <v-icon name="fa-thermometer-half" scale="1.4" />
              </div>
              <div class="vital-info">
                <span class="vital-label">Temperature</span>
                <span class="vital-value">{{ vitals.body_temp[0]?.value }}</span>
                <span class="vital-unit">{{ vitals.body_temp[0]?.unit }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Health Checkups Tab -->
      <div v-if="activeTab === 'checkups'" class="tab-content">
        <div class="content-wrapper">
          <div class="section-header-bar">
            <div class="header-title">
              <v-icon name="hi-clipboard-check" scale="1.1" />
              <h3>Health Checkups</h3>
            </div>
            <span class="total-badge">{{ healthCheckups.pagination?.total || 0 }} total</span>
          </div>

          <div v-if="healthCheckups.items?.length" class="checkups-list">
            <div
              v-for="checkup in healthCheckups.items"
              :key="checkup.id"
              class="checkup-card-enhanced glass-card"
            >
              <!-- Card Header with Triage -->
              <div class="checkup-card-header" :class="getTriageClass(checkup.triage_level)">
                <div class="header-left">
                  <div class="triage-indicator" :class="getTriageClass(checkup.triage_level)">
                    <v-icon :name="getTriageIcon(checkup.triage_level)" scale="1.2" />
                  </div>
                  <div class="header-info">
                    <span class="triage-label">{{ formatTriage(checkup.triage_level) }}</span>
                    <span class="checkup-date-text">{{ formatDate(checkup.date) }}</span>
                  </div>
                </div>
                <div class="header-right">
                  <span v-if="checkup.health_check_for && checkup.health_check_for !== 'Self'" class="for-badge">
                    <v-icon name="hi-user" scale="0.7" />
                    {{ checkup.health_check_for }}
                  </span>
                  <span v-if="checkup.ai_summary" class="ai-badge">
                    <v-icon name="fa-robot" scale="0.7" />
                    AI Summary
                  </span>
                </div>
              </div>

              <!-- Emergency Alert -->
              <div v-if="checkup.has_emergency_evidence" class="emergency-banner">
                <v-icon name="hi-exclamation-triangle" scale="1" />
                <span>Emergency evidence detected - Immediate attention may be required</span>
              </div>

              <!-- Card Body -->
              <div class="checkup-card-body">
                <!-- AI Summary Section (if available) -->
                <div v-if="checkup.ai_summary" class="ai-summary-section">
                  <div class="summary-header">
                    <v-icon name="fa-stethoscope" scale="0.9" />
                    <span>AI Health Summary</span>
                  </div>
                  <p class="summary-overview">{{ checkup.ai_summary.overview }}</p>

                  <div v-if="checkup.ai_summary.key_findings?.length" class="key-findings">
                    <span class="findings-label">Key Findings:</span>
                    <ul>
                      <li v-for="(finding, idx) in checkup.ai_summary.key_findings.slice(0, 3)" :key="idx">
                        {{ finding }}
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Conditions Section -->
                <div v-if="checkup.conditions?.length" class="conditions-section">
                  <div class="section-label">
                    <v-icon name="hi-beaker" scale="0.8" />
                    <span>Possible Conditions</span>
                  </div>
                  <div class="conditions-grid">
                    <div
                      v-for="(condition, idx) in checkup.conditions.slice(0, 4)"
                      :key="idx"
                      class="condition-item"
                      :class="getConditionUrgency(condition.probability)"
                    >
                      <div class="condition-info">
                        <span class="condition-name">{{ condition.name }}</span>
                        <span v-if="condition.category" class="condition-category">{{ condition.category }}</span>
                      </div>
                      <div class="condition-probability">
                        <div class="prob-bar">
                          <div class="prob-fill" :style="{ width: (condition.probability * 100) + '%' }"></div>
                        </div>
                        <span class="prob-value">{{ Math.round(condition.probability * 100) }}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Symptoms Section -->
                <div v-if="checkup.symptoms?.length" class="symptoms-section">
                  <div class="section-label">
                    <v-icon name="hi-annotation" scale="0.8" />
                    <span>Reported Symptoms</span>
                  </div>
                  <div class="symptoms-tags">
                    <span
                      v-for="(symptom, idx) in formatSymptoms(checkup.symptoms)"
                      :key="idx"
                      class="symptom-tag"
                      :class="{ 'has-duration': symptom.duration }"
                    >
                      <span class="symptom-name">{{ symptom.name }}</span>
                      <span v-if="symptom.duration" class="symptom-duration">{{ symptom.duration }}</span>
                    </span>
                  </div>
                </div>

                <!-- Specialist Recommendations -->
                <div v-if="checkup.specialist_recommendations?.length" class="recommendations-section">
                  <div class="section-label">
                    <v-icon name="hi-light-bulb" scale="0.8" />
                    <span>Recommended Specialists</span>
                  </div>
                  <div class="specialist-tags">
                    <span v-for="(spec, idx) in checkup.specialist_recommendations.slice(0, 4)" :key="idx" class="specialist-tag">
                      {{ spec.name || spec }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Card Footer -->
              <div class="checkup-card-footer" @click="viewCheckupDetail(checkup)">
                <span class="view-report-link">
                  <v-icon name="hi-document-text" scale="0.9" />
                  View Full Medical Report
                </span>
                <v-icon name="hi-arrow-right" scale="0.9" class="arrow-icon" />
              </div>
            </div>
          </div>
          <div v-else class="empty-state glass-card">
            <div class="empty-icon-wrapper">
              <v-icon name="hi-clipboard" scale="2.5" />
            </div>
            <h4>No Health Checkups</h4>
            <p>Patient hasn't completed any AI health checkups yet</p>
          </div>

          <!-- Pagination -->
          <div v-if="healthCheckups.pagination?.total_pages > 1" class="pagination">
            <button :disabled="healthCheckups.pagination.page <= 1" @click="fetchCheckups(healthCheckups.pagination.page - 1)" class="page-btn">
              <v-icon name="hi-chevron-left" scale="0.9" />
              <span>Previous</span>
            </button>
            <div class="page-indicator">
              <span class="current">{{ healthCheckups.pagination.page }}</span>
              <span class="separator">/</span>
              <span class="total">{{ healthCheckups.pagination.total_pages }}</span>
            </div>
            <button :disabled="healthCheckups.pagination.page >= healthCheckups.pagination.total_pages" @click="fetchCheckups(healthCheckups.pagination.page + 1)" class="page-btn">
              <span>Next</span>
              <v-icon name="hi-chevron-right" scale="0.9" />
            </button>
          </div>
        </div>
      </div>

      <!-- Advanced Scores Tab -->
      <div v-if="activeTab === 'advanced'" class="tab-content">
        <div class="content-wrapper">
          <div class="section-header-bar">
            <div class="header-title">
              <v-icon name="hi-sparkles" scale="1.1" />
              <h3>Advanced Health Assessments</h3>
            </div>
            <span class="total-badge">{{ advancedScores.pagination?.total || 0 }} total</span>
          </div>

          <div v-if="advancedScores.items?.length" class="scores-list">
          <div
            v-for="score in advancedScores.items"
            :key="score.id"
            class="assessment-card glass-card"
            @click="viewScoreDetail(score)"
          >
            <div class="assessment-header">
              <div class="assessment-date">
                <v-icon name="hi-calendar" scale="0.9" />
                <span>{{ formatDate(score.date) }}</span>
              </div>
              <div class="score-badge-large" :class="getScoreClass(score.overall_score)">
                {{ score.overall_score }}
              </div>
            </div>
            <div class="assessment-body">
              <div class="status-row">
                <span class="status-tag" :class="getScoreClass(score.overall_score)">
                  {{ score.overall_status }}
                </span>
              </div>
              <p class="summary" v-if="score.overall_summary">{{ score.overall_summary }}</p>

              <!-- Domain Scores -->
              <div class="domain-scores" v-if="score.domain_scores?.length">
                <div v-for="domain in score.domain_scores.slice(0, 4)" :key="domain.domain" class="domain-row">
                  <span class="domain-name">{{ domain.domain }}</span>
                  <div class="domain-bar-wrapper">
                    <div class="domain-bar">
                      <div class="domain-fill" :style="{ width: domain.score + '%' }" :class="getScoreClass(domain.score)"></div>
                    </div>
                  </div>
                  <span class="domain-score" :class="getScoreClass(domain.score)">{{ domain.score }}</span>
                </div>
              </div>
            </div>
            <div class="assessment-footer">
              <span class="view-link">
                View full report
                <v-icon name="hi-arrow-right" scale="0.7" />
              </span>
            </div>
          </div>
        </div>
          <div v-else class="empty-state glass-card">
            <div class="empty-icon-wrapper">
              <v-icon name="hi-sparkles" scale="2.5" />
            </div>
            <h4>No Advanced Assessments</h4>
            <p>Patient hasn't completed any advanced health assessments</p>
          </div>

          <!-- Pagination -->
          <div v-if="advancedScores.pagination?.total_pages > 1" class="pagination">
            <button :disabled="advancedScores.pagination.page <= 1" @click="fetchAdvancedScores(advancedScores.pagination.page - 1)" class="page-btn">
              <v-icon name="hi-chevron-left" scale="0.9" />
              <span>Previous</span>
            </button>
            <div class="page-indicator">
              <span class="current">{{ advancedScores.pagination.page }}</span>
              <span class="separator">/</span>
              <span class="total">{{ advancedScores.pagination.total_pages }}</span>
            </div>
            <button :disabled="advancedScores.pagination.page >= advancedScores.pagination.total_pages" @click="fetchAdvancedScores(advancedScores.pagination.page + 1)" class="page-btn">
              <span>Next</span>
              <v-icon name="hi-chevron-right" scale="0.9" />
            </button>
          </div>
        </div>
      </div>

      <!-- Prescriptions & Medications Tab -->
      <div v-if="activeTab === 'prescriptions'" class="tab-content">
        <div class="content-wrapper">
          <div class="section-header-bar">
            <div class="header-title">
              <v-icon name="ri-capsule-line" scale="1.1" />
              <h3>Prescriptions & Medications</h3>
            </div>
            <span class="total-badge">{{ (prescriptions.stats?.total || 0) + (uploadedPrescriptions.stats?.total || 0) + (pharmacyOrders.stats?.total || 0) }} total</span>
          </div>

          <!-- Combined Stats -->
          <div class="prescription-stats">
            <div class="stat-card-mini clickable" @click="scrollToSection('specialist')">
              <div class="stat-icon specialist">
                <v-icon name="fa-stethoscope" scale="0.9" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ prescriptions.stats?.total || 0 }}</span>
                <span class="stat-label">Specialist Rx</span>
              </div>
              <v-icon name="hi-arrow-down" scale="0.7" class="scroll-hint" />
            </div>
            <div class="stat-card-mini clickable" @click="scrollToSection('uploaded')">
              <div class="stat-icon uploaded">
                <v-icon name="hi-upload" scale="1" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ uploadedPrescriptions.stats?.total || 0 }}</span>
                <span class="stat-label">Uploaded Rx</span>
              </div>
              <v-icon name="hi-arrow-down" scale="0.7" class="scroll-hint" />
            </div>
            <div class="stat-card-mini clickable" @click="scrollToSection('orders')">
              <div class="stat-icon orders">
                <v-icon name="hi-shopping-cart" scale="1" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ pharmacyOrders.stats?.total || 0 }}</span>
                <span class="stat-label">Orders</span>
              </div>
              <v-icon name="hi-arrow-down" scale="0.7" class="scroll-hint" />
            </div>
            <div class="stat-card-mini">
              <div class="stat-icon total">
                <v-icon name="ri-capsule-line" scale="1" />
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ (prescriptions.stats?.total || 0) + (uploadedPrescriptions.stats?.total || 0) + (pharmacyOrders.stats?.total || 0) }}</span>
                <span class="stat-label">Total</span>
              </div>
            </div>
          </div>

          <!-- ===== SECTION 1: Specialist Prescriptions ===== -->
          <div class="collapsible-section" ref="specialistSection">
            <div class="section-header" @click="toggleSection('specialist')">
              <div class="section-title">
                <v-icon name="fa-stethoscope" scale="0.9" />
                <span>Specialist Prescriptions</span>
                <span class="section-count">{{ prescriptions.stats?.total || 0 }}</span>
              </div>
              <v-icon :name="expandedSections.specialist ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
            </div>
            <div v-show="expandedSections.specialist" class="section-content">
              <div v-if="prescriptions.prescriptions?.length" class="prescriptions-list">
                <div v-for="rx in prescriptions.prescriptions" :key="rx.id" class="prescription-card glass-card">
                  <div class="prescription-header" :class="getPrescriptionStatusClass(rx.status)">
                    <div class="header-left">
                      <div class="rx-icon" :class="getPrescriptionStatusClass(rx.status)">
                        <v-icon name="ri-capsule-line" scale="1.1" />
                      </div>
                      <div class="header-info">
                        <span class="rx-number">{{ rx.prescription_number }}</span>
                        <span class="rx-date">{{ formatDate(rx.date) }}</span>
                      </div>
                    </div>
                    <div class="header-right">
                      <span class="status-badge" :class="getPrescriptionStatusClass(rx.status)">
                        {{ formatPrescriptionStatus(rx.status) }}
                      </span>
                      <span v-if="rx.payment_status === 'paid'" class="payment-badge paid">
                        <v-icon name="hi-check" scale="0.6" /> Paid
                      </span>
                    </div>
                  </div>
                  <div class="prescriber-row">
                    <v-icon name="hi-user" scale="0.8" />
                    <span>Prescribed by: <strong>{{ rx.specialist?.name }}</strong></span>
                    <span class="specialty-badge">{{ rx.specialist?.specialty }}</span>
                  </div>
                  <div class="medications-section">
                    <div class="section-label">
                      <v-icon name="ri-medicine-bottle-line" scale="0.8" />
                      <span>Medications ({{ rx.item_count }})</span>
                    </div>
                    <div class="medications-grid">
                      <div v-for="(item, idx) in rx.items.slice(0, 4)" :key="idx" class="medication-item">
                        <div class="med-main">
                          <span class="med-name">{{ item.drug_name }}</span>
                          <span class="med-strength">{{ item.drug_strength }}</span>
                        </div>
                        <div class="med-details">
                          <span class="med-dosage">{{ item.dosage }} · {{ item.frequency }}</span>
                          <span class="med-duration">{{ item.duration }}</span>
                        </div>
                        <div class="med-qty"><span>Qty: {{ item.quantity }}</span></div>
                      </div>
                      <div v-if="rx.items.length > 4" class="more-items">+{{ rx.items.length - 4 }} more</div>
                    </div>
                  </div>
                  <div class="pricing-row">
                    <div class="price-item"><span class="price-label">Subtotal</span><span class="price-value">{{ rx.currency }} {{ formatCurrency(rx.subtotal) }}</span></div>
                    <div v-if="rx.delivery_fee" class="price-item"><span class="price-label">Delivery</span><span class="price-value">{{ rx.currency }} {{ formatCurrency(rx.delivery_fee) }}</span></div>
                    <div class="price-item total"><span class="price-label">Total</span><span class="price-value">{{ rx.currency }} {{ formatCurrency(rx.total_amount) }}</span></div>
                  </div>
                  <div v-if="rx.is_refillable" class="refill-info">
                    <v-icon name="hi-refresh" scale="0.8" />
                    <span>Refillable: {{ rx.refills_used || 0 }}/{{ rx.refill_count }} refills used</span>
                  </div>
                  <div v-if="rx.clinical_notes" class="clinical-notes">
                    <div class="notes-label"><v-icon name="hi-annotation" scale="0.8" /><span>Clinical Notes</span></div>
                    <p>{{ rx.clinical_notes }}</p>
                  </div>
                </div>
              </div>
              <div v-else class="empty-section">
                <v-icon name="fa-stethoscope" scale="1.5" />
                <span>No specialist prescriptions</span>
              </div>
              <div v-if="prescriptions.pagination?.total_pages > 1" class="pagination-mini">
                <button :disabled="prescriptions.pagination.page <= 1" @click="fetchPrescriptions(prescriptions.pagination.page - 1)">
                  <v-icon name="hi-chevron-left" scale="0.8" />
                </button>
                <span>{{ prescriptions.pagination.page }} / {{ prescriptions.pagination.total_pages }}</span>
                <button :disabled="prescriptions.pagination.page >= prescriptions.pagination.total_pages" @click="fetchPrescriptions(prescriptions.pagination.page + 1)">
                  <v-icon name="hi-chevron-right" scale="0.8" />
                </button>
              </div>
            </div>
          </div>

          <!-- ===== SECTION 2: Uploaded Prescriptions ===== -->
          <div class="collapsible-section" ref="uploadedSection">
            <div class="section-header" @click="toggleSection('uploaded')">
              <div class="section-title">
                <v-icon name="hi-upload" scale="0.9" />
                <span>Uploaded Prescriptions</span>
                <span class="section-count">{{ uploadedPrescriptions.stats?.total || 0 }}</span>
              </div>
              <v-icon :name="expandedSections.uploaded ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
            </div>
            <div v-show="expandedSections.uploaded" class="section-content">
              <div v-if="uploadedPrescriptions.uploads?.length" class="prescriptions-list">
                <div v-for="upload in uploadedPrescriptions.uploads" :key="upload.id" class="prescription-card glass-card uploaded-rx">
                  <div class="prescription-header" :class="getUploadStatusClass(upload.verification_status)">
                    <div class="header-left">
                      <div class="rx-icon" :class="getUploadStatusClass(upload.verification_status)">
                        <v-icon name="hi-document-text" scale="1.1" />
                      </div>
                      <div class="header-info">
                        <span class="rx-number">{{ upload.prescription_number || 'Pending' }}</span>
                        <span class="rx-date">{{ formatDate(upload.date) }}</span>
                      </div>
                    </div>
                    <div class="header-right">
                      <span class="status-badge" :class="getUploadStatusClass(upload.verification_status)">
                        {{ formatUploadStatus(upload.verification_status) }}
                      </span>
                      <span v-if="upload.is_expired" class="expired-badge">Expired</span>
                    </div>
                  </div>
                  <div v-if="upload.doctor_name || upload.clinic_name" class="prescriber-row">
                    <v-icon name="hi-user" scale="0.8" />
                    <span v-if="upload.doctor_name">Dr. {{ upload.doctor_name }}</span>
                    <span v-if="upload.clinic_name" class="clinic-name">{{ upload.clinic_name }}</span>
                  </div>
                  <div v-if="upload.medications?.length" class="medications-section">
                    <div class="section-label">
                      <v-icon name="ri-medicine-bottle-line" scale="0.8" />
                      <span>Medications ({{ upload.medications.length }})</span>
                    </div>
                    <div class="medications-grid">
                      <div v-for="(med, idx) in upload.medications.slice(0, 4)" :key="idx" class="medication-item">
                        <div class="med-main">
                          <span class="med-name">{{ med.name }}</span>
                          <span v-if="med.dosage" class="med-strength">{{ med.dosage }}</span>
                        </div>
                        <div v-if="med.instructions" class="med-details">
                          <span class="med-dosage">{{ med.instructions }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-if="upload.valid_until" class="validity-row">
                    <v-icon name="hi-calendar" scale="0.7" />
                    <span>Valid until: {{ formatDate(upload.valid_until) }}</span>
                    <span class="usage-info">Used {{ upload.usage_count || 0 }}{{ upload.max_usage ? `/${upload.max_usage}` : '' }} times</span>
                  </div>
                  <div v-if="upload.has_fraud_flags" class="fraud-warning">
                    <v-icon name="hi-exclamation-triangle" scale="0.8" />
                    <span>Flagged for review</span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-section">
                <v-icon name="hi-upload" scale="1.5" />
                <span>No uploaded prescriptions</span>
              </div>
              <div v-if="uploadedPrescriptions.pagination?.total_pages > 1" class="pagination-mini">
                <button :disabled="uploadedPrescriptions.pagination.page <= 1" @click="fetchUploadedPrescriptions(uploadedPrescriptions.pagination.page - 1)">
                  <v-icon name="hi-chevron-left" scale="0.8" />
                </button>
                <span>{{ uploadedPrescriptions.pagination.page }} / {{ uploadedPrescriptions.pagination.total_pages }}</span>
                <button :disabled="uploadedPrescriptions.pagination.page >= uploadedPrescriptions.pagination.total_pages" @click="fetchUploadedPrescriptions(uploadedPrescriptions.pagination.page + 1)">
                  <v-icon name="hi-chevron-right" scale="0.8" />
                </button>
              </div>
            </div>
          </div>

          <!-- ===== SECTION 3: Medication Purchases ===== -->
          <div class="collapsible-section" ref="ordersSection">
            <div class="section-header" @click="toggleSection('orders')">
              <div class="section-title">
                <v-icon name="hi-shopping-cart" scale="0.9" />
                <span>Medication Purchases</span>
                <span class="section-count">{{ pharmacyOrders.stats?.total || 0 }}</span>
              </div>
              <v-icon :name="expandedSections.orders ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.9" />
            </div>
            <div v-show="expandedSections.orders" class="section-content">
              <div v-if="pharmacyOrders.orders?.length" class="prescriptions-list">
                <div v-for="order in pharmacyOrders.orders" :key="order.id" class="prescription-card glass-card order-card">
                  <div class="prescription-header" :class="getOrderStatusClass(order.status)">
                    <div class="header-left">
                      <div class="rx-icon" :class="getOrderStatusClass(order.status)">
                        <v-icon name="hi-shopping-cart" scale="1.1" />
                      </div>
                      <div class="header-info">
                        <span class="rx-number">{{ order.order_number }}</span>
                        <span class="rx-date">{{ formatDate(order.date) }}</span>
                      </div>
                    </div>
                    <div class="header-right">
                      <span class="order-type-badge" :class="order.order_type?.toLowerCase()">
                        {{ order.order_type === 'OTC' ? 'OTC' : order.order_type === 'PRESCRIPTION' ? 'Rx' : 'Mixed' }}
                      </span>
                      <span class="status-badge" :class="getOrderStatusClass(order.status)">
                        {{ formatOrderStatus(order.status) }}
                      </span>
                    </div>
                  </div>
                  <div v-if="order.pharmacy" class="prescriber-row">
                    <v-icon name="gi-medicines" scale="0.8" />
                    <span>From: <strong>{{ order.pharmacy.name }}</strong></span>
                  </div>
                  <div class="medications-section">
                    <div class="section-label">
                      <v-icon name="ri-medicine-bottle-line" scale="0.8" />
                      <span>Items ({{ order.item_count }})</span>
                    </div>
                    <div class="medications-grid">
                      <div v-for="(item, idx) in order.items.slice(0, 4)" :key="idx" class="medication-item">
                        <div class="med-main">
                          <span class="med-name">{{ item.drug_name }}</span>
                          <span v-if="item.strength" class="med-strength">{{ item.strength }}</span>
                        </div>
                        <div class="med-details">
                          <span class="med-dosage">{{ item.dosage_form }}</span>
                          <span v-if="item.requires_prescription" class="rx-required">Rx</span>
                        </div>
                        <div class="med-qty"><span>Qty: {{ item.quantity }}</span></div>
                      </div>
                      <div v-if="order.items.length > 4" class="more-items">+{{ order.items.length - 4 }} more</div>
                    </div>
                  </div>
                  <div class="pricing-row">
                    <div class="price-item"><span class="price-label">Subtotal</span><span class="price-value">{{ order.currency }} {{ formatCurrency(order.subtotal) }}</span></div>
                    <div v-if="order.delivery_fee" class="price-item"><span class="price-label">Delivery</span><span class="price-value">{{ order.currency }} {{ formatCurrency(order.delivery_fee) }}</span></div>
                    <div class="price-item total"><span class="price-label">Total</span><span class="price-value">{{ order.currency }} {{ formatCurrency(order.total_amount) }}</span></div>
                  </div>
                  <div v-if="order.delivery_method" class="delivery-info">
                    <v-icon :name="order.is_pickup ? 'hi-location-marker' : 'hi-truck'" scale="0.8" />
                    <span>{{ order.is_pickup ? 'Pickup' : 'Delivery' }}</span>
                    <span v-if="order.tracking_number" class="tracking">Tracking: {{ order.tracking_number }}</span>
                    <span v-if="order.delivered_at" class="delivered-date">Delivered: {{ formatDate(order.delivered_at) }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="empty-section">
                <v-icon name="hi-shopping-cart" scale="1.5" />
                <span>No medication purchases</span>
              </div>
              <div v-if="pharmacyOrders.pagination?.total_pages > 1" class="pagination-mini">
                <button :disabled="pharmacyOrders.pagination.page <= 1" @click="fetchPharmacyOrders(pharmacyOrders.pagination.page - 1)">
                  <v-icon name="hi-chevron-left" scale="0.8" />
                </button>
                <span>{{ pharmacyOrders.pagination.page }} / {{ pharmacyOrders.pagination.total_pages }}</span>
                <button :disabled="pharmacyOrders.pagination.page >= pharmacyOrders.pagination.total_pages" @click="fetchPharmacyOrders(pharmacyOrders.pagination.page + 1)">
                  <v-icon name="hi-chevron-right" scale="0.8" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Appointments Tab -->
      <div v-if="activeTab === 'appointments'" class="tab-content">
        <div class="section-header-bar">
          <div class="header-title">
            <v-icon name="hi-calendar" scale="1.1" />
            <h3>Appointment History</h3>
          </div>
          <span class="total-badge">{{ appointments.pagination?.total || 0 }} total</span>
        </div>

        <div v-if="appointments.items?.length" class="appointments-list">
          <div v-for="apt in appointments.items" :key="apt.id" class="appointment-card glass-card">
            <div class="card-left-accent" :class="getAppointmentStatusClass(apt)"></div>
            <div class="appointment-header">
              <div class="appointment-datetime">
                <v-icon name="hi-calendar" scale="0.9" />
                <span>{{ formatDateTime(apt.date) }}</span>
              </div>
              <div class="status-badge" :class="getAppointmentStatusClass(apt)">
                {{ getAppointmentDisplayStatus(apt) }}
              </div>
            </div>
            <div class="appointment-body">
              <div class="specialist-row">
                <div class="specialist-avatar">
                  <v-icon name="hi-user-circle" scale="1.5" />
                </div>
                <div class="specialist-info">
                  <span class="specialist-name">{{ apt.specialist?.name }}</span>
                  <span class="specialty">{{ apt.specialist?.specialty }}</span>
                </div>
              </div>
              <div class="appointment-details">
                <div class="detail-item" v-if="apt.appointment_type">
                  <v-icon name="hi-video-camera" scale="0.8" />
                  <span>{{ apt.appointment_type }}</span>
                </div>
                <div class="detail-item" v-if="formatDuration(apt.call_duration)">
                  <v-icon name="hi-clock" scale="0.8" />
                  <span>Duration: {{ formatDuration(apt.call_duration) }}</span>
                </div>
              </div>
              <div class="notes-section" v-if="apt.notes">
                <span class="notes-label">Notes:</span>
                <p class="notes-content">{{ apt.notes }}</p>
              </div>
              <div class="cancellation-reason" v-if="apt.cancellation_reason">
                <v-icon name="hi-x-circle" scale="0.8" />
                <span>{{ apt.cancellation_reason }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state glass-card">
          <v-icon name="hi-calendar" scale="3" />
          <h4>No Appointments</h4>
          <p>No appointment history found</p>
        </div>

        <!-- Pagination -->
        <div v-if="appointments.pagination?.total_pages > 1" class="pagination">
          <button :disabled="appointments.pagination.page <= 1" @click="fetchAppointments(appointments.pagination.page - 1)" class="page-btn">
            <v-icon name="hi-chevron-left" scale="0.9" />
            <span>Previous</span>
          </button>
          <div class="page-indicator">
            <span class="current">{{ appointments.pagination.page }}</span>
            <span class="separator">/</span>
            <span class="total">{{ appointments.pagination.total_pages }}</span>
          </div>
          <button :disabled="appointments.pagination.page >= appointments.pagination.total_pages" @click="fetchAppointments(appointments.pagination.page + 1)" class="page-btn">
            <span>Next</span>
            <v-icon name="hi-chevron-right" scale="0.9" />
          </button>
        </div>
      </div>

      <!-- Medical Profile Tab -->
      <div v-if="activeTab === 'profile'" class="tab-content">
        <div class="profile-grid">
          <!-- Physical Info -->
          <div class="profile-card glass-card">
            <div class="card-accent physical"></div>
            <div class="profile-header">
              <div class="header-icon physical">
                <v-icon name="hi-user" scale="1.2" />
              </div>
              <h3>Physical Information</h3>
            </div>
            <div class="profile-body">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Height</span>
                  <span class="info-value">
                    {{ medicalProfile?.height?.value || '-' }} {{ medicalProfile?.height?.unit || '' }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Weight</span>
                  <span class="info-value">
                    {{ medicalProfile?.weight?.value || '-' }} {{ medicalProfile?.weight?.unit || '' }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Blood Type</span>
                  <span class="info-value">{{ medicalProfile?.blood_type || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Smoker</span>
                  <span class="info-value">{{ medicalProfile?.is_smoker || 'Unknown' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pre-existing Conditions -->
          <div class="profile-card glass-card">
            <div class="card-accent conditions"></div>
            <div class="profile-header">
              <div class="header-icon conditions">
                <v-icon name="hi-clipboard-list" scale="1.2" />
              </div>
              <h3>Pre-existing Conditions</h3>
            </div>
            <div class="profile-body">
              <div v-if="formattedConditions?.length" class="tags-list">
                <span v-for="(condition, idx) in formattedConditions" :key="idx" class="tag condition">
                  {{ condition }}
                </span>
              </div>
              <div v-else class="no-data">
                <v-icon name="hi-check-circle" scale="1" />
                <span>No pre-existing conditions recorded</span>
              </div>
            </div>
          </div>

          <!-- Allergies -->
          <div class="profile-card glass-card">
            <div class="card-accent allergies"></div>
            <div class="profile-header">
              <div class="header-icon allergies">
                <v-icon name="hi-exclamation-triangle" scale="1.2" />
              </div>
              <h3>Allergies</h3>
            </div>
            <div class="profile-body">
              <div v-if="medicalProfile?.allergies?.length" class="tags-list">
                <span v-for="(allergy, idx) in medicalProfile.allergies" :key="idx" class="tag allergy">
                  {{ allergy }}
                </span>
              </div>
              <div v-else class="no-data">
                <v-icon name="hi-check-circle" scale="1" />
                <span>No allergies recorded</span>
              </div>
            </div>
          </div>

          <!-- Medications -->
          <div class="profile-card glass-card">
            <div class="card-accent medications"></div>
            <div class="profile-header">
              <div class="header-icon medications">
                <v-icon name="gi-medicines" scale="1.2" />
              </div>
              <h3>Current Medications</h3>
            </div>
            <div class="profile-body">
              <div v-if="medicalProfile?.medications?.length" class="tags-list">
                <span v-for="(med, idx) in medicalProfile.medications" :key="idx" class="tag medication">
                  {{ med }}
                </span>
              </div>
              <div v-else class="no-data">
                <v-icon name="hi-check-circle" scale="1" />
                <span>No medications recorded</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { format } from 'date-fns';
import apiFactory from '@/services/apiFactory';

const route = useRoute();
const router = useRouter();

// State
const loading = ref(true);
const error = ref(null);
const activeTab = ref('scores');

const patient = ref(null);
const healthScores = ref({ basic: null, advanced: null });
const healthCheckups = ref({ items: [], pagination: null });
const advancedScores = ref({ items: [], pagination: null });
const appointments = ref({ items: [], pagination: null });
const prescriptions = ref({ prescriptions: [], stats: null, pagination: null });
const uploadedPrescriptions = ref({ uploads: [], stats: null, pagination: null });
const pharmacyOrders = ref({ orders: [], stats: null, pagination: null });
const vitals = ref(null);
const medicalProfile = ref(null);

// Collapsible section states
const expandedSections = ref({
  specialist: true,
  uploaded: true,
  orders: true,
});

// Template refs for scrolling
const specialistSection = ref(null);
const uploadedSection = ref(null);
const ordersSection = ref(null);

// Computed
const patientId = computed(() => route.params.patientId);
const appointmentId = computed(() => route.query.appointmentId);

const hasVitals = computed(() => {
  return vitals.value && (
    vitals.value.blood_pressure?.length ||
    vitals.value.pulse_rate?.length ||
    vitals.value.blood_sugar_level?.length ||
    vitals.value.body_temp?.length
  );
});

// Handle patient profile image with fallbacks
const imageError = ref(false);
const patientProfileImage = computed(() => {
  if (imageError.value) return null;
  return patient.value?.profile_image || patient.value?.profile_photo || null;
});

const handleImageError = () => {
  imageError.value = true;
};

// Format pre-existing conditions (handle both string and object formats)
const formattedConditions = computed(() => {
  const conditions = medicalProfile.value?.pre_existing_conditions;
  if (!conditions || !conditions.length) return [];

  return conditions.map(condition => {
    if (typeof condition === 'string') return condition;
    if (typeof condition === 'object') {
      return condition.name || condition.description || condition.original_name || JSON.stringify(condition);
    }
    return String(condition);
  });
});

const tabs = computed(() => [
  { value: 'scores', label: 'Health Scores', icon: 'hi-heart', count: null },
  { value: 'checkups', label: 'Health Checkups', icon: 'hi-clipboard-check', count: healthCheckups.value.pagination?.total || 0 },
  { value: 'advanced', label: 'Advanced Scores', icon: 'hi-sparkles', count: advancedScores.value.pagination?.total || 0 },
  { value: 'prescriptions', label: 'Medications', icon: 'ri-capsule-line', count: (prescriptions.value.stats?.total || 0) + (uploadedPrescriptions.value.stats?.total || 0) + (pharmacyOrders.value.stats?.total || 0) },
  { value: 'appointments', label: 'Appointments', icon: 'hi-calendar', count: appointments.value.pagination?.total || 0 },
  { value: 'profile', label: 'Medical Profile', icon: 'hi-user', count: null },
]);

// Methods
const fetchRecords = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await apiFactory.$_getPatientFullHealthRecords(patientId.value);
    const data = response.data?.data || response.data;

    patient.value = data.patient;
    healthScores.value = data.health_scores;
    healthCheckups.value = data.health_checkups;
    advancedScores.value = data.advanced_scores;
    appointments.value = data.appointments;
    vitals.value = data.vitals;
    medicalProfile.value = data.medical_profile;
  } catch (err) {
    console.error('Error fetching health records:', err);
    error.value = 'Failed to load patient health records. Please try again.';
  } finally {
    loading.value = false;
  }
};

const fetchCheckups = async (page) => {
  try {
    const response = await apiFactory.$_getPatientFullHealthRecords(patientId.value, {
      checkupsPage: page,
      checkupsLimit: 10,
    });
    const data = response.data?.data || response.data;
    healthCheckups.value = data.health_checkups;
  } catch (err) {
    console.error('Error fetching checkups:', err);
  }
};

const fetchAdvancedScores = async (page) => {
  try {
    const response = await apiFactory.$_getPatientFullHealthRecords(patientId.value, {
      scoresPage: page,
      scoresLimit: 10,
    });
    const data = response.data?.data || response.data;
    advancedScores.value = data.advanced_scores;
  } catch (err) {
    console.error('Error fetching advanced scores:', err);
  }
};

const fetchAppointments = async (page) => {
  try {
    const response = await apiFactory.$_getPatientFullHealthRecords(patientId.value, {
      appointmentsPage: page,
      appointmentsLimit: 10,
    });
    const data = response.data?.data || response.data;
    appointments.value = data.appointments;
  } catch (err) {
    console.error('Error fetching appointments:', err);
  }
};

const fetchPrescriptions = async (page = 1) => {
  if (!patientId.value) {
    console.warn('fetchPrescriptions: patientId is not available');
    return;
  }
  try {
    const response = await apiFactory.$_getPatientPrescriptionsForSpecialist(patientId.value, {
      page,
      limit: 10,
    });
    const data = response.data?.data || response.data;
    prescriptions.value = data;
  } catch (err) {
    console.error('Error fetching prescriptions:', err);
  }
};

const fetchUploadedPrescriptions = async (page = 1) => {
  if (!patientId.value) return;
  try {
    const response = await apiFactory.$_getPatientUploadedPrescriptions(patientId.value, {
      page,
      limit: 10,
    });
    const data = response.data?.data || response.data;
    uploadedPrescriptions.value = data;
  } catch (err) {
    console.error('Error fetching uploaded prescriptions:', err);
  }
};

const fetchPharmacyOrders = async (page = 1) => {
  if (!patientId.value) return;
  try {
    const response = await apiFactory.$_getPatientPharmacyOrders(patientId.value, {
      page,
      limit: 10,
    });
    const data = response.data?.data || response.data;
    pharmacyOrders.value = data;
  } catch (err) {
    console.error('Error fetching pharmacy orders:', err);
  }
};

const toggleSection = (section) => {
  expandedSections.value[section] = !expandedSections.value[section];
};

const scrollToSection = (section) => {
  // Expand the section if it's collapsed
  if (!expandedSections.value[section]) {
    expandedSections.value[section] = true;
  }

  // Get the corresponding ref
  const sectionRefs = {
    specialist: specialistSection,
    uploaded: uploadedSection,
    orders: ordersSection,
  };

  const sectionRef = sectionRefs[section];

  // Scroll to the section with a small delay to allow expansion animation
  setTimeout(() => {
    if (sectionRef.value) {
      sectionRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

const goBack = () => {
  if (appointmentId.value) {
    router.push({
      name: 'SpecialistAppointmentDetails',
      params: { id: appointmentId.value },
      query: { appointment_status: 'upcoming' }
    });
  } else {
    router.back();
  }
};

const viewCheckupDetail = (checkup) => {
  router.push({
    name: 'SpecialistPatientCheckupDetail',
    params: {
      appointmentId: appointmentId.value || 'view',
      checkupId: checkup.id
    },
    query: {
      patientId: patientId.value,
      patientName: patient.value?.name,
      patientGender: patient.value?.gender,
      patientAge: patient.value?.age
    }
  });
};

const viewScoreDetail = (score) => {
  router.push({
    name: 'SpecialistPatientHealthScoreReport',
    params: {
      appointmentId: appointmentId.value || 'view',
      type: 'advanced',
      scoreId: score.id
    },
    query: {
      patientId: patientId.value,
      patientName: patient.value?.name,
      patientGender: patient.value?.gender,
      patientAge: patient.value?.age
    }
  });
};

// Formatting helpers
const getInitials = (name) => {
  if (!name) return 'P';
  const parts = name.split(' ');
  return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase();
};

const formatDate = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'MMM dd, yyyy');
};

const formatDateTime = (date) => {
  if (!date) return '-';
  return format(new Date(date), 'MMM dd, yyyy h:mm a');
};

const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined || isNaN(seconds)) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
};

const formatTriage = (level) => {
  const labels = {
    'emergency': 'Emergency',
    'emergency_ambulance': 'Emergency',
    'consultation_24': 'See Doctor (24h)',
    'consultation': 'Consultation',
    'self_care': 'Self Care',
  };
  return labels[level] || level || 'Unknown';
};

const getTriageClass = (level) => {
  const classes = {
    'emergency': 'emergency',
    'emergency_ambulance': 'emergency',
    'consultation_24': 'urgent',
    'consultation': 'moderate',
    'self_care': 'normal',
  };
  return classes[level] || 'moderate';
};

const getTriageIcon = (level) => {
  const icons = {
    'emergency': 'hi-exclamation',
    'emergency_ambulance': 'hi-exclamation',
    'consultation_24': 'hi-clock',
    'consultation': 'hi-user',
    'self_care': 'hi-heart',
  };
  return icons[level] || 'hi-clipboard-check';
};

// Check if an appointment with OPEN status is actually a missed appointment
const isAppointmentMissed = (apt) => {
  if (!apt.date) return false;
  const status = apt.status?.toUpperCase();
  if (status !== 'OPEN') return false;
  // If appointment date is in the past and status is still OPEN, it's missed
  const appointmentDate = new Date(apt.date);
  const now = new Date();
  return appointmentDate < now;
};

const getAppointmentDisplayStatus = (apt) => {
  if (isAppointmentMissed(apt)) return 'Missed';
  const status = apt.status?.toUpperCase();
  // Proper case formatting
  const labels = {
    'OPEN': 'Scheduled',
    'ONGOING': 'Ongoing',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
    'RESCHEDULED': 'Rescheduled',
    'NO_SHOW': 'No Show',
    'MISSED': 'Missed',
  };
  return labels[status] || apt.status || 'Unknown';
};

const getAppointmentStatusClass = (apt) => {
  if (isAppointmentMissed(apt)) return 'missed';
  const status = apt.status?.toLowerCase();
  // Map status to CSS class
  const classes = {
    'open': 'scheduled',
    'ongoing': 'ongoing',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'rescheduled': 'rescheduled',
    'no_show': 'missed',
    'missed': 'missed',
  };
  return classes[status] || status || 'unknown';
};

const getConditionUrgency = (probability) => {
  if (probability >= 0.5) return 'high';
  if (probability >= 0.2) return 'medium';
  return 'low';
};

const formatSymptoms = (symptoms) => {
  if (!symptoms || !symptoms.length) return [];
  return symptoms.map(s => {
    // Handle both old string format and new object format
    if (typeof s === 'string') {
      return { name: s, duration: null };
    }
    return {
      name: s.name || 'Unknown symptom',
      duration: s.duration || null,
    };
  }).filter(s => s.name && s.name !== 'Reported symptom');
};

const getScoreClass = (score) => {
  if (score === null || score === undefined) return '';
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
};

const getScoreLabel = (score) => {
  if (score === null || score === undefined) return 'Not Available';
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Attention';
};

const getStrokeDashoffset = (score) => {
  const circumference = 2 * Math.PI * 52; // 326.73
  const progress = (score || 0) / 100;
  return circumference * (1 - progress);
};

const getRingStyle = (score) => {
  const progress = (score || 0) / 100;
  return { '--progress': progress };
};

// Prescription helper methods
const getPrescriptionStatusClass = (status) => {
  const statusMap = {
    'pending': 'pending',
    'paid': 'paid',
    'processing': 'processing',
    'dispensed': 'dispensed',
    'shipped': 'shipped',
    'delivered': 'delivered',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'refunded': 'refunded'
  };
  return statusMap[status?.toLowerCase()] || 'pending';
};

const formatPrescriptionStatus = (status) => {
  const statusMap = {
    'pending': 'Pending',
    'paid': 'Paid',
    'processing': 'Processing',
    'dispensed': 'Dispensed',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'refunded': 'Refunded'
  };
  return statusMap[status?.toLowerCase()] || status || 'Unknown';
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0.00';
  return Number(amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Uploaded prescription status helpers
const getUploadStatusClass = (status) => {
  const statusMap = {
    'PENDING': 'pending',
    'TIER1_PROCESSING': 'processing',
    'TIER2_PROCESSING': 'processing',
    'PHARMACIST_REVIEW': 'review',
    'APPROVED': 'approved',
    'REJECTED': 'rejected',
    'EXPIRED': 'expired',
    'CLARIFICATION_NEEDED': 'clarification',
  };
  return statusMap[status] || 'pending';
};

const formatUploadStatus = (status) => {
  const statusMap = {
    'PENDING': 'Pending',
    'TIER1_PROCESSING': 'Processing',
    'TIER2_PROCESSING': 'Verifying',
    'PHARMACIST_REVIEW': 'Under Review',
    'APPROVED': 'Approved',
    'REJECTED': 'Rejected',
    'EXPIRED': 'Expired',
    'CLARIFICATION_NEEDED': 'Needs Info',
  };
  return statusMap[status] || status || 'Unknown';
};

// Pharmacy order status helpers
const getOrderStatusClass = (status) => {
  const statusMap = {
    'PENDING': 'pending',
    'CONFIRMED': 'confirmed',
    'PROCESSING': 'processing',
    'READY_FOR_PICKUP': 'ready',
    'OUT_FOR_DELIVERY': 'shipping',
    'DELIVERED': 'delivered',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled',
    'REFUNDED': 'refunded',
  };
  return statusMap[status] || 'pending';
};

const formatOrderStatus = (status) => {
  const statusMap = {
    'PENDING': 'Pending',
    'CONFIRMED': 'Confirmed',
    'PROCESSING': 'Processing',
    'READY_FOR_PICKUP': 'Ready',
    'OUT_FOR_DELIVERY': 'In Transit',
    'DELIVERED': 'Delivered',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled',
    'REFUNDED': 'Refunded',
  };
  return statusMap[status] || status || 'Unknown';
};

onMounted(async () => {
  await fetchRecords();
  // Fetch all medication data in parallel
  Promise.all([
    fetchPrescriptions(),
    fetchUploadedPrescriptions(),
    fetchPharmacyOrders(),
  ]);
});
</script>

<style lang="scss" scoped>
$primary: #0EAEC4;
$primary-dark: #0891b2;
$primary-darker: #0e7490;
$excellent: #10b981;
$good: #0EAEC4;
$fair: #f59e0b;
$poor: #ef4444;

.health-records {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0fdfa 0%, #f8fafc 100%);
  overflow-y: auto;
  overflow-x: hidden;
}

// Hero Section
.hero-wrapper {
  padding: 24px 48px 0;
}

.hero-banner {
  position: relative;
  background: linear-gradient(135deg, $primary 0%, $primary-dark 50%, $primary-darker 100%);
  border-radius: 24px;
  padding: 28px 40px 36px;
  color: white;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(14, 174, 196, 0.3),
    0 8px 20px rgba(14, 174, 196, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.hero-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  border-radius: 24px;

  .hero-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.1) 100%);
  }

  .hero-pattern {
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle at 20% 80%, rgba(255,255,255,0.15) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%),
      radial-gradient(circle at 40% 40%, rgba(255,255,255,0.05) 0%, transparent 30%);
  }

  .hero-glow {
    position: absolute;
    top: -50%;
    right: -20%;
    width: 60%;
    height: 200%;
    background: radial-gradient(ellipse, rgba(255,255,255,0.1) 0%, transparent 70%);
  }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-top {
  margin-bottom: 20px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  color: white;
  padding: 10px 18px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255,255,255,0.25);
    transform: translateX(-4px);
  }
}

.hero-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.patient-header {
  display: flex;
  align-items: center;
  gap: 20px;

  .patient-avatar {
    width: 88px;
    height: 88px;
    border-radius: 20px;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255,255,255,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      font-size: 28px;
      font-weight: 700;
      color: rgba(255,255,255,0.9);
    }
  }

  .patient-info {
    .patient-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    h1 {
      font-size: 32px;
      font-weight: 700;
      margin: 0 0 12px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .patient-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        opacity: 0.9;

        svg {
          opacity: 0.7;
        }
      }
    }
  }
}

.hero-scores {
  display: flex;
  gap: 16px;

  .score-pill {
    background: rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
    padding: 16px 24px;
    border-radius: 16px;
    text-align: center;
    min-width: 130px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255,255,255,0.2);
      transform: translateY(-2px);
    }

    .score-pill-inner {
      position: relative;
      z-index: 1;
    }

    .score-label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      opacity: 0.9;
      margin-bottom: 4px;
    }

    .score-value {
      font-size: 36px;
      font-weight: 800;
      line-height: 1;
    }

    &.excellent { border-color: rgba($excellent, 0.5); background: rgba($excellent, 0.15); }
    &.good { border-color: rgba($good, 0.5); background: rgba($good, 0.15); }
    &.fair { border-color: rgba($fair, 0.5); background: rgba($fair, 0.15); }
    &.poor { border-color: rgba($poor, 0.5); background: rgba($poor, 0.15); }
  }
}

// Loading & Error States
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  color: #64748b;

  .loading-spinner {
    position: relative;
    width: 60px;
    height: 60px;
    margin-bottom: 20px;

    .spinner-ring {
      position: absolute;
      inset: 0;
      border: 3px solid #e2e8f0;
      border-top-color: $primary;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-icon {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $primary;
      animation: pulse 1s ease-in-out infinite;
    }
  }

  p {
    font-size: 16px;
    color: #475569;
  }

  .error-icon {
    width: 80px;
    height: 80px;
    background: #fee2e2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    color: #dc2626;
  }

  h3 {
    font-size: 20px;
    color: #1e293b;
    margin: 0 0 8px;
  }

  .retry-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 20px;
    padding: 12px 24px;
    background: linear-gradient(135deg, $primary, $primary-dark);
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba($primary, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($primary, 0.4);
    }
  }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

// Main Content
.records-content {
  padding: 24px 48px 48px;
}

// Glass Card Base
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;

  &:hover {
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.08),
      0 2px 4px rgba(0, 0, 0, 0.04);
  }
}

// Tabs
.tabs-container {
  margin-bottom: 28px;
}

.tabs-wrapper {
  display: inline-flex;
  gap: 6px;
  background: white;
  padding: 8px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border: none;
    background: transparent;
    color: #64748b;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    white-space: nowrap;
    transition: all 0.3s ease;

    &:hover {
      background: #f1f5f9;
      color: #475569;
    }

    &.active {
      background: linear-gradient(135deg, $primary, $primary-dark);
      color: white;
      box-shadow: 0 4px 12px rgba($primary, 0.3);
    }

    .tab-count {
      background: rgba(0, 0, 0, 0.08);
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 600;
    }

    &.active .tab-count {
      background: rgba(255, 255, 255, 0.25);
    }
  }
}

// Tab Content
.tab-content {
  animation: fadeIn 0.4s ease;
}

// Content wrapper for consistent width
.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

// Section Header Bar
.section-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;

    svg {
      color: $primary;
    }

    h3 {
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
  }

  .total-badge {
    background: linear-gradient(135deg, #f0fdfa, #e0f7fa);
    color: $primary-dark;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }
}

// Score Cards Grid
.scores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.score-card-large {
  border-radius: 20px;
  overflow: hidden;
  position: relative;

  .card-accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;

    &.basic { background: linear-gradient(90deg, #ef4444, #f59e0b, $primary, $excellent); }
    &.advanced { background: linear-gradient(90deg, #8b5cf6, #6366f1, $primary); }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px 28px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;

      &.basic { background: linear-gradient(135deg, #ef4444, #f97316); }
      &.advanced { background: linear-gradient(135deg, #8b5cf6, #6366f1); }
      &.vitals { background: linear-gradient(135deg, $primary, $primary-dark); }
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px;
    }

    .card-date {
      font-size: 13px;
      color: #64748b;
    }
  }

  .card-body {
    padding: 32px 28px;

    .score-visual {
      position: relative;
      width: 140px;
      height: 140px;
      margin: 0 auto 20px;

      .score-ring-svg {
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);

        .ring-bg {
          fill: none;
          stroke: #f1f5f9;
          stroke-width: 10;
        }

        .ring-progress {
          fill: none;
          stroke-width: 10;
          stroke-linecap: round;
          stroke-dasharray: 326.73;
          transition: stroke-dashoffset 0.8s ease;

          &.excellent { stroke: $excellent; }
          &.good { stroke: $good; }
          &.fair { stroke: $fair; }
          &.poor { stroke: $poor; }
        }
      }

      .score-center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .big-score {
          font-size: 42px;
          font-weight: 800;
          color: #1e293b;
          line-height: 1;
        }

        .score-max {
          font-size: 13px;
          color: #94a3b8;
          margin-top: 4px;
        }
      }
    }

    .score-status {
      text-align: center;
      display: inline-block;
      width: 100%;
      padding: 8px 20px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 24px;

      &.excellent { background: rgba($excellent, 0.1); color: darken($excellent, 10%); }
      &.good { background: rgba($good, 0.1); color: darken($good, 10%); }
      &.fair { background: rgba($fair, 0.1); color: darken($fair, 15%); }
      &.poor { background: rgba($poor, 0.1); color: darken($poor, 10%); }
    }

    .view-all-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 14px 24px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      color: #475569;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        background: $primary;
        border-color: $primary;
        color: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba($primary, 0.3);
      }
    }

    &.empty-state-card {
      text-align: center;
      padding: 48px 28px;

      .empty-icon {
        width: 80px;
        height: 80px;
        background: #f1f5f9;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        color: #94a3b8;
      }

      p {
        color: #64748b;
        font-size: 15px;
      }
    }
  }

  // Breakdown
  .breakdown {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid #f1f5f9;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      margin: 0 0 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .breakdown-items {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8fafc;
      border-radius: 12px;

      .item-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .item-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;

        &.normal { background: $excellent; }
        &.mild, &.elevated { background: $fair; }
        &.moderate { background: #f97316; }
        &.high, &.severe, &.critical { background: $poor; }
        &.unknown { background: #94a3b8; }
      }

      .item-label {
        font-size: 14px;
        color: #475569;
        font-weight: 500;
      }

      .item-value {
        font-size: 12px;
        padding: 4px 12px;
        border-radius: 20px;
        font-weight: 500;

        &.normal { background: rgba($excellent, 0.1); color: darken($excellent, 10%); }
        &.mild, &.elevated { background: rgba($fair, 0.1); color: darken($fair, 15%); }
        &.moderate { background: rgba(#f97316, 0.1); color: darken(#f97316, 10%); }
        &.high, &.severe, &.critical { background: rgba($poor, 0.1); color: darken($poor, 10%); }
        &.unknown { background: #f1f5f9; color: #64748b; }
      }
    }
  }
}

// Vitals Section
.vitals-section {
  border-radius: 20px;
  padding: 28px;

  .section-header-styled {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;

      &.vitals { background: linear-gradient(135deg, $primary, $primary-dark); }
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
  }
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.vital-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f8fafc;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .vital-icon-wrapper {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    &.bp { background: linear-gradient(135deg, #ef4444, #f87171); }
    &.pulse { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
    &.sugar { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
    &.temp { background: linear-gradient(135deg, $primary, #22d3ee); }
  }

  .vital-info {
    .vital-label {
      display: block;
      font-size: 12px;
      color: #64748b;
      margin-bottom: 4px;
      font-weight: 500;
    }

    .vital-value {
      font-size: 22px;
      font-weight: 700;
      color: #1e293b;
    }

    .vital-unit {
      font-size: 13px;
      color: #94a3b8;
      margin-left: 4px;
    }
  }
}

// Checkups List
.checkups-list, .scores-list, .appointments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.checkup-card, .assessment-card, .appointment-card {
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  position: relative;

  .card-left-accent {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;

    &.emergency { background: $poor; }
    &.urgent { background: #f97316; }
    &.moderate { background: $fair; }
    &.normal { background: $excellent; }
    &.completed { background: $excellent; }
    &.cancelled { background: $poor; }
    &.open { background: $primary; }
    &.scheduled { background: $primary; }
    &.ongoing { background: #8b5cf6; }
    &.missed { background: #f97316; }
    &.rescheduled { background: $fair; }
  }
}

.checkup-header, .assessment-header, .appointment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #f1f5f9;
}

.checkup-date, .assessment-date, .appointment-datetime {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #475569;

  svg {
    color: $primary;
  }
}

.triage-badge, .status-badge, .score-badge-large {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;

  &.emergency { background: rgba($poor, 0.1); color: $poor; }
  &.urgent { background: rgba(#f97316, 0.1); color: #f97316; }
  &.moderate { background: rgba($fair, 0.1); color: darken($fair, 15%); }
  &.normal { background: rgba($excellent, 0.1); color: darken($excellent, 10%); }
  &.excellent { background: rgba($excellent, 0.1); color: darken($excellent, 10%); }
  &.good { background: rgba($good, 0.1); color: darken($good, 10%); }
  &.fair { background: rgba($fair, 0.1); color: darken($fair, 15%); }
  &.poor { background: rgba($poor, 0.1); color: $poor; }
  &.completed { background: rgba($excellent, 0.1); color: darken($excellent, 10%); }
  &.cancelled { background: rgba($poor, 0.1); color: $poor; }
  &.open { background: rgba($primary, 0.1); color: $primary-dark; }
  &.scheduled { background: rgba($primary, 0.1); color: $primary-dark; }
  &.ongoing { background: rgba(#8b5cf6, 0.1); color: #7c3aed; }
  &.missed { background: rgba(#f97316, 0.1); color: #ea580c; }
  &.rescheduled { background: rgba($fair, 0.1); color: darken($fair, 15%); }
}

.score-badge-large {
  min-width: 44px;
  height: 44px;
  border-radius: 12px;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}

.checkup-body, .assessment-body, .appointment-body {
  padding: 20px 24px;

  .checkup-for, .specialist-row {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #64748b;
    margin-bottom: 12px;
  }

  .symptoms-row {
    font-size: 14px;
    margin-bottom: 12px;

    .label {
      font-weight: 600;
      color: #475569;
      margin-right: 8px;
    }

    .value {
      color: #64748b;
    }
  }

  .conditions-list {
    margin-bottom: 12px;

    .label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 8px;
    }

    .condition-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .condition-tag {
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      color: #475569;

      .probability {
        color: #94a3b8;
        font-size: 11px;
        margin-left: 4px;
      }
    }
  }

  .emergency-alert {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: rgba($poor, 0.08);
    border: 1px solid rgba($poor, 0.2);
    color: $poor;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
  }

  .summary {
    font-size: 14px;
    color: #475569;
    line-height: 1.6;
    margin: 12px 0;
  }

  .status-tag {
    display: inline-block;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;

    &.excellent { background: rgba($excellent, 0.1); color: darken($excellent, 10%); }
    &.good { background: rgba($good, 0.1); color: darken($good, 10%); }
    &.fair { background: rgba($fair, 0.1); color: darken($fair, 15%); }
    &.poor { background: rgba($poor, 0.1); color: $poor; }
  }
}

// Domain Scores
.domain-scores {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;

  .domain-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;

    .domain-name {
      width: 110px;
      font-size: 13px;
      color: #64748b;
      font-weight: 500;
      text-transform: capitalize;
    }

    .domain-bar-wrapper {
      flex: 1;
    }

    .domain-bar {
      height: 8px;
      background: #f1f5f9;
      border-radius: 4px;
      overflow: hidden;

      .domain-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;

        &.excellent { background: linear-gradient(90deg, lighten($excellent, 10%), $excellent); }
        &.good { background: linear-gradient(90deg, lighten($good, 10%), $good); }
        &.fair { background: linear-gradient(90deg, lighten($fair, 10%), $fair); }
        &.poor { background: linear-gradient(90deg, lighten($poor, 10%), $poor); }
      }
    }

    .domain-score {
      width: 36px;
      font-size: 14px;
      font-weight: 700;
      text-align: right;

      &.excellent { color: $excellent; }
      &.good { color: $good; }
      &.fair { color: darken($fair, 10%); }
      &.poor { color: $poor; }
    }
  }
}

.checkup-footer, .assessment-footer {
  padding: 14px 24px;
  border-top: 1px solid #f1f5f9;
  background: #fafafa;

  .view-link {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: $primary;
    font-weight: 500;
    justify-content: flex-end;
  }
}

// Appointment specific
.specialist-row {
  .specialist-avatar {
    color: $primary;
  }

  .specialist-info {
    .specialist-name {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
      display: block;
    }

    .specialty {
      font-size: 13px;
      color: #64748b;
    }
  }
}

.appointment-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 12px 0;

  .detail-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #64748b;

    svg {
      color: #94a3b8;
    }
  }
}

.notes-section {
  background: #f8fafc;
  padding: 14px 16px;
  border-radius: 12px;
  margin-top: 12px;

  .notes-label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .notes-content {
    font-size: 14px;
    color: #475569;
    margin: 8px 0 0;
    line-height: 1.5;
  }
}

.cancellation-reason {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba($poor, 0.05);
  border-radius: 10px;
  margin-top: 12px;
  font-size: 13px;
  color: $poor;

  svg {
    flex-shrink: 0;
  }
}

// Medical Profile
.profile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.profile-card {
  border-radius: 20px;
  overflow: hidden;
  position: relative;

  .card-accent {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;

    &.physical { background: linear-gradient(90deg, $primary, $primary-dark); }
    &.conditions { background: linear-gradient(90deg, #6366f1, #8b5cf6); }
    &.allergies { background: linear-gradient(90deg, #f59e0b, #f97316); }
    &.medications { background: linear-gradient(90deg, $excellent, #34d399); }
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px 28px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;

      &.physical { background: linear-gradient(135deg, $primary, $primary-dark); }
      &.conditions { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
      &.allergies { background: linear-gradient(135deg, #f59e0b, #f97316); }
      &.medications { background: linear-gradient(135deg, $excellent, #34d399); }
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }
  }

  .profile-body {
    padding: 24px 28px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    .info-item {
      .info-label {
        display: block;
        font-size: 12px;
        color: #64748b;
        margin-bottom: 6px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .info-value {
        font-size: 17px;
        font-weight: 600;
        color: #1e293b;
      }
    }
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;

    .tag {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;

      &.condition { background: rgba(#6366f1, 0.1); color: #4f46e5; }
      &.allergy { background: rgba($poor, 0.1); color: $poor; }
      &.medication { background: rgba($excellent, 0.1); color: darken($excellent, 10%); }
    }
  }

  .no-data {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #94a3b8;
    font-size: 14px;

    svg {
      color: $excellent;
    }
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 60px 24px;
  border-radius: 20px;

  .empty-icon-wrapper {
    width: 80px;
    height: 80px;
    background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: #94a3b8;
  }

  svg {
    color: #cbd5e1;
    margin-bottom: 16px;
  }

  h4 {
    font-size: 18px;
    color: #475569;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: #94a3b8;
    margin: 0;
  }
}

// Enhanced Health Checkup Cards
.checkup-card-enhanced {
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 0, 0, 0.05);

  .checkup-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    &.emergency {
      background: linear-gradient(135deg, rgba($poor, 0.08), rgba($poor, 0.04));
    }
    &.urgent {
      background: linear-gradient(135deg, rgba(#f97316, 0.08), rgba(#f97316, 0.04));
    }
    &.moderate {
      background: linear-gradient(135deg, rgba($fair, 0.08), rgba($fair, 0.04));
    }
    &.normal {
      background: linear-gradient(135deg, rgba($excellent, 0.08), rgba($excellent, 0.04));
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .triage-indicator {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;

      &.emergency { background: linear-gradient(135deg, $poor, #dc2626); }
      &.urgent { background: linear-gradient(135deg, #f97316, #ea580c); }
      &.moderate { background: linear-gradient(135deg, $fair, #d97706); }
      &.normal { background: linear-gradient(135deg, $excellent, #059669); }
    }

    .header-info {
      .triage-label {
        display: block;
        font-size: 15px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 2px;
      }
      .checkup-date-text {
        font-size: 13px;
        color: #64748b;
      }
    }

    .header-right {
      display: flex;
      gap: 10px;
    }

    .for-badge, .ai-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }

    .for-badge {
      background: rgba($primary, 0.1);
      color: $primary-dark;
    }

    .ai-badge {
      background: linear-gradient(135deg, rgba(#8b5cf6, 0.1), rgba(#6366f1, 0.1));
      color: #6366f1;
    }
  }

  .emergency-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 24px;
    background: linear-gradient(135deg, rgba($poor, 0.1), rgba($poor, 0.05));
    border-bottom: 1px solid rgba($poor, 0.1);
    color: $poor;
    font-size: 14px;
    font-weight: 500;

    svg {
      flex-shrink: 0;
    }
  }

  .checkup-card-body {
    padding: 24px;
  }

  .ai-summary-section {
    background: linear-gradient(135deg, rgba(#8b5cf6, 0.06), rgba(#6366f1, 0.03));
    border: 1px solid rgba(#6366f1, 0.12);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;

    .summary-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      color: #6366f1;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .summary-overview {
      font-size: 14px;
      color: #475569;
      line-height: 1.7;
      margin: 0 0 16px;
    }

    .key-findings {
      .findings-label {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      ul {
        margin: 10px 0 0;
        padding-left: 20px;

        li {
          font-size: 13px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 6px;

          &::marker {
            color: #6366f1;
          }
        }
      }
    }
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 14px;

    svg {
      color: $primary;
    }
  }

  .conditions-section {
    margin-bottom: 20px;
  }

  .conditions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 12px;
  }

  .condition-item {
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 14px 16px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    &.high .prob-fill { background: linear-gradient(90deg, lighten($poor, 10%), $poor); }
    &.medium .prob-fill { background: linear-gradient(90deg, lighten($fair, 10%), $fair); }
    &.low .prob-fill { background: linear-gradient(90deg, lighten($excellent, 10%), $excellent); }

    .condition-info {
      margin-bottom: 10px;
    }

    .condition-name {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 2px;
    }

    .condition-category {
      font-size: 11px;
      color: #94a3b8;
      text-transform: capitalize;
    }

    .condition-probability {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .prob-bar {
      flex: 1;
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }

    .prob-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }

    .prob-value {
      font-size: 13px;
      font-weight: 700;
      color: #475569;
      min-width: 36px;
      text-align: right;
    }
  }

  .symptoms-section {
    margin-bottom: 20px;
  }

  .symptoms-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .symptom-tag {
    display: flex;
    flex-direction: column;
    background: white;
    border: 1px solid #e2e8f0;
    padding: 10px 16px;
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      border-color: $primary;
      box-shadow: 0 2px 8px rgba($primary, 0.15);
    }

    &.has-duration {
      background: linear-gradient(135deg, rgba($primary, 0.04), rgba($primary, 0.02));
      border-color: rgba($primary, 0.2);
    }

    .symptom-name {
      font-size: 14px;
      font-weight: 500;
      color: #1e293b;
    }

    .symptom-duration {
      font-size: 11px;
      color: $primary-dark;
      margin-top: 4px;
    }
  }

  .recommendations-section {
    margin-bottom: 10px;
  }

  .specialist-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .specialist-tag {
    background: linear-gradient(135deg, rgba($primary, 0.1), rgba($primary, 0.05));
    color: $primary-dark;
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid rgba($primary, 0.15);
  }

  .checkup-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: #fafafa;
    border-top: 1px solid #f1f5f9;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: linear-gradient(135deg, rgba($primary, 0.05), rgba($primary, 0.02));

      .view-report-link {
        color: $primary-dark;
      }

      .arrow-icon {
        transform: translateX(4px);
        color: $primary;
      }
    }

    .view-report-link {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 500;
      color: #475569;
      transition: color 0.3s ease;
    }

    .arrow-icon {
      color: #94a3b8;
      transition: all 0.3s ease;
    }
  }
}

// Pagination
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f1f5f9;

  .page-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    color: #475569;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      background: $primary;
      border-color: $primary;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba($primary, 0.3);
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .page-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #f8fafc;
    padding: 8px 16px;
    border-radius: 10px;

    .current {
      font-size: 16px;
      font-weight: 700;
      color: $primary;
    }

    .separator {
      color: #cbd5e1;
    }

    .total {
      font-size: 14px;
      color: #64748b;
    }
  }
}

// Prescriptions Tab
.prescription-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card-mini {
  background: white;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    &.active { background: linear-gradient(135deg, $primary, $primary-dark); }
    &.specialist { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    &.uploaded { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    &.orders { background: linear-gradient(135deg, #f59e0b, #d97706); }
    &.completed { background: linear-gradient(135deg, $excellent, #059669); }
    &.total { background: linear-gradient(135deg, #6366f1, #4f46e5); }
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-label {
      font-size: 13px;
      color: #64748b;
    }
  }

  .scroll-hint {
    color: #cbd5e1;
    transition: all 0.3s ease;
    opacity: 0;
  }

  &.clickable {
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      border-color: rgba($primary, 0.2);

      .scroll-hint {
        opacity: 1;
        color: $primary;
        animation: bounce 1s infinite;
      }
    }

    &:active {
      transform: translateY(-2px);
    }
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-4px); }
  60% { transform: translateY(-2px); }
}

// Collapsible Sections
.collapsible-section {
  background: white;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: hidden;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    cursor: pointer;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    transition: background 0.2s ease;

    &:hover {
      background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;

      svg { color: $primary; }

      .section-count {
        background: rgba($primary, 0.1);
        color: $primary-dark;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
    }

    > svg { color: #64748b; }
  }

  .section-content {
    padding: 16px 20px;
    border-top: 1px solid #f1f5f9;
  }
}

.empty-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
  color: #94a3b8;
  font-size: 14px;

  svg { color: #cbd5e1; }
}

.pagination-mini {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 0 4px;
  margin-top: 12px;
  border-top: 1px solid #f1f5f9;

  button {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: $primary;
      border-color: $primary;
      color: white;
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  span {
    font-size: 13px;
    color: #64748b;
  }
}

.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.prescription-card {
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);

  .prescription-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    &.pending { background: linear-gradient(135deg, rgba($fair, 0.08), rgba($fair, 0.04)); }
    &.paid, &.processing { background: linear-gradient(135deg, rgba($primary, 0.08), rgba($primary, 0.04)); }
    &.dispensed, &.shipped { background: linear-gradient(135deg, rgba(#6366f1, 0.08), rgba(#6366f1, 0.04)); }
    &.delivered, &.completed { background: linear-gradient(135deg, rgba($excellent, 0.08), rgba($excellent, 0.04)); }
    &.cancelled, &.refunded { background: linear-gradient(135deg, rgba($poor, 0.08), rgba($poor, 0.04)); }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .rx-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;

      &.pending { background: linear-gradient(135deg, $fair, #d97706); }
      &.paid, &.processing { background: linear-gradient(135deg, $primary, $primary-dark); }
      &.dispensed, &.shipped { background: linear-gradient(135deg, #6366f1, #4f46e5); }
      &.delivered, &.completed { background: linear-gradient(135deg, $excellent, #059669); }
      &.cancelled, &.refunded { background: linear-gradient(135deg, $poor, #dc2626); }
    }

    .header-info {
      .rx-number {
        display: block;
        font-size: 15px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 2px;
      }
      .rx-date {
        font-size: 13px;
        color: #64748b;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;

      &.pending { background: rgba($fair, 0.15); color: darken($fair, 15%); }
      &.paid, &.processing { background: rgba($primary, 0.15); color: $primary-dark; }
      &.dispensed, &.shipped, &.shipping { background: rgba(#6366f1, 0.15); color: #4f46e5; }
      &.delivered, &.completed { background: rgba($excellent, 0.15); color: darken($excellent, 10%); }
      &.cancelled, &.refunded { background: rgba($poor, 0.15); color: $poor; }
      // Upload verification statuses
      &.approved { background: rgba($excellent, 0.15); color: darken($excellent, 10%); }
      &.rejected, &.expired { background: rgba($poor, 0.15); color: $poor; }
      &.review, &.clarification { background: rgba(#8b5cf6, 0.15); color: #6d28d9; }
      // Order statuses
      &.confirmed { background: rgba($primary, 0.15); color: $primary-dark; }
      &.ready { background: rgba(#8b5cf6, 0.15); color: #6d28d9; }
    }

    .order-type-badge {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;

      &.otc { background: rgba($excellent, 0.15); color: darken($excellent, 10%); }
      &.prescription { background: rgba(#6366f1, 0.15); color: #4f46e5; }
      &.mixed { background: rgba($fair, 0.15); color: darken($fair, 15%); }
    }

    .expired-badge {
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
      background: rgba($poor, 0.15);
      color: $poor;
    }

    .payment-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;

      &.paid { background: rgba($excellent, 0.1); color: darken($excellent, 10%); }
      &.pending { background: rgba($fair, 0.1); color: darken($fair, 15%); }
    }
  }

  .prescriber-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 24px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 14px;
    color: #64748b;

    svg { color: $primary; }
    strong { color: #1e293b; }

    .specialty-badge {
      padding: 4px 10px;
      background: rgba(#6366f1, 0.1);
      color: #4f46e5;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
    }
  }

  .medications-section {
    padding: 20px 24px;

    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 16px;

      svg { color: $primary; }
    }

    .medications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
    }

    .medication-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;

      .med-main {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 8px;

        .med-name {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }

        .med-strength {
          font-size: 13px;
          color: #64748b;
          background: white;
          padding: 2px 8px;
          border-radius: 6px;
        }
      }

      .med-details {
        display: flex;
        gap: 12px;
        margin-bottom: 8px;

        .med-dosage, .med-duration {
          font-size: 13px;
          color: #64748b;
        }

        .med-duration {
          color: $primary;
          font-weight: 500;
        }
      }

      .med-qty {
        font-size: 12px;
        color: #94a3b8;
        font-weight: 500;
      }
    }

    .more-items {
      grid-column: 1 / -1;
      text-align: center;
      padding: 12px;
      color: $primary;
      font-size: 14px;
      font-weight: 500;
    }
  }

  .pricing-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 24px;
    padding: 16px 24px;
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;

    .price-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .price-label {
        font-size: 13px;
        color: #64748b;
      }

      .price-value {
        font-size: 14px;
        font-weight: 600;
        color: #475569;
      }

      &.total {
        .price-label { font-weight: 600; color: #475569; }
        .price-value { font-size: 16px; color: #1e293b; }
      }
    }
  }

  .refill-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 24px;
    background: rgba($primary, 0.05);
    border-top: 1px solid rgba($primary, 0.1);
    font-size: 13px;
    color: #475569;

    svg { color: $primary; }

    .next-refill {
      margin-left: auto;
      color: $primary;
      font-weight: 500;
    }
  }

  .clinical-notes {
    padding: 16px 24px;
    border-top: 1px solid #f1f5f9;

    .notes-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 8px;

      svg { color: #94a3b8; }
    }

    p {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      margin: 0;
    }
  }

  .fulfillment-dates {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    padding: 14px 24px;
    background: #fafbfc;
    border-top: 1px solid #f1f5f9;

    .date-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #64748b;

      svg { color: #94a3b8; }
    }
  }

  // Uploaded prescription specific styles
  &.uploaded-rx {
    .rx-icon {
      &.approved { background: linear-gradient(135deg, $excellent, #059669); }
      &.pending, &.processing { background: linear-gradient(135deg, $fair, #d97706); }
      &.review, &.clarification { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
      &.rejected, &.expired { background: linear-gradient(135deg, $poor, #dc2626); }
    }
  }

  .clinic-name {
    padding: 4px 10px;
    background: rgba(#64748b, 0.1);
    border-radius: 8px;
    font-size: 12px;
    color: #64748b;
  }

  .validity-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 24px;
    font-size: 13px;
    color: #64748b;
    border-top: 1px solid #f1f5f9;

    svg { color: $primary; }

    .usage-info {
      margin-left: auto;
      color: #94a3b8;
      font-size: 12px;
    }
  }

  .fraud-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    background: rgba($poor, 0.05);
    border-top: 1px solid rgba($poor, 0.1);
    font-size: 13px;
    color: $poor;
    font-weight: 500;
  }

  // Order card specific styles
  &.order-card {
    .rx-icon {
      &.pending { background: linear-gradient(135deg, $fair, #d97706); }
      &.confirmed, &.processing { background: linear-gradient(135deg, $primary, $primary-dark); }
      &.ready, &.shipping { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
      &.delivered, &.completed { background: linear-gradient(135deg, $excellent, #059669); }
      &.cancelled, &.refunded { background: linear-gradient(135deg, $poor, #dc2626); }
    }
  }

  .rx-required {
    display: inline-block;
    padding: 2px 6px;
    background: rgba(#6366f1, 0.1);
    color: #4f46e5;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
  }

  .delivery-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 24px;
    font-size: 13px;
    color: #64748b;
    border-top: 1px solid #f1f5f9;
    background: #fafbfc;

    svg { color: $primary; }

    .tracking {
      padding: 4px 10px;
      background: rgba($primary, 0.1);
      border-radius: 8px;
      font-size: 12px;
      color: $primary-dark;
    }

    .delivered-date {
      margin-left: auto;
      color: $excellent;
      font-weight: 500;
    }
  }
}

// Responsive
@media (max-width: 1024px) {
  .hero-wrapper {
    padding: 16px 24px 0;
  }

  .hero-banner {
    padding: 24px 28px 32px;
    border-radius: 20px;
  }

  .records-content {
    padding: 20px 24px 32px;
  }

  .scores-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .hero-wrapper {
    padding: 12px 16px 0;
  }

  .hero-banner {
    padding: 20px 20px 28px;
    border-radius: 16px;
  }

  .hero-main {
    flex-direction: column;
    align-items: flex-start;
  }

  .patient-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .patient-avatar {
      width: 72px;
      height: 72px;
    }

    .patient-info h1 {
      font-size: 24px;
    }

    .patient-meta {
      flex-direction: column;
      gap: 8px;
    }
  }

  .hero-scores {
    width: 100%;

    .score-pill {
      flex: 1;
      min-width: auto;
    }
  }

  .records-content {
    padding: 16px;
  }

  .tabs-wrapper {
    width: 100%;
    overflow-x: auto;

    .tab-btn {
      padding: 10px 16px;
      font-size: 13px;

      .tab-label {
        display: none;
      }
    }
  }

  .profile-grid {
    grid-template-columns: 1fr;
  }

  .vitals-grid {
    grid-template-columns: 1fr 1fr;
  }

  .prescription-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card-mini {
    padding: 14px;
    flex-direction: column;
    text-align: center;
    gap: 10px;

    .stat-icon {
      width: 40px;
      height: 40px;
    }

    .stat-info {
      align-items: center;

      .stat-value {
        font-size: 18px;
      }

      .stat-label {
        font-size: 11px;
      }
    }
  }

  .collapsible-section {
    .section-header {
      padding: 14px 16px;

      .section-title {
        font-size: 14px;
        gap: 8px;

        .section-count {
          padding: 3px 8px;
          font-size: 11px;
        }
      }
    }

    .section-content {
      padding: 12px 16px;
    }
  }

  .prescription-card {
    .prescription-header {
      flex-direction: column;
      gap: 14px;
      align-items: flex-start;
      padding: 14px 16px;

      .header-right {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
        gap: 8px;
      }
    }

    .prescriber-row {
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 16px;
    }

    .medications-section {
      padding: 16px;

      .medications-grid {
        grid-template-columns: 1fr;
      }
    }

    .pricing-row {
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      padding: 12px 16px;
    }

    .refill-info {
      flex-wrap: wrap;
      padding: 12px 16px;

      .next-refill {
        margin-left: 0;
        width: 100%;
        margin-top: 4px;
      }
    }

    .clinical-notes {
      padding: 12px 16px;
    }

    .fulfillment-dates {
      flex-direction: column;
      gap: 8px;
      padding: 12px 16px;
    }

    .validity-row {
      flex-wrap: wrap;
      padding: 10px 16px;

      .usage-info {
        margin-left: 0;
        width: 100%;
        margin-top: 4px;
      }
    }

    .delivery-info {
      flex-wrap: wrap;
      padding: 10px 16px;

      .tracking {
        margin-top: 4px;
      }

      .delivered-date {
        margin-left: 0;
        width: 100%;
        margin-top: 4px;
      }
    }
  }
}
</style>
