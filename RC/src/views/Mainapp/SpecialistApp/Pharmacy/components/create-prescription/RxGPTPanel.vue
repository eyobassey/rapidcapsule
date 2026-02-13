<template>
  <div class="rxgpt-panel" :class="{ 'has-alerts': hasAlerts, 'is-loading': isLoading }">
    <!-- Header with Mode Toggle -->
    <div class="panel-header">
      <div class="panel-header__left">
        <div class="panel-header__icon" :class="statusClass">
          <v-icon :name="statusIcon" scale="1" />
        </div>
        <div class="panel-header__content">
          <h3>RxGPT AI Assistant</h3>
          <p v-if="!isLoading && !analysisResult && !suggestionResult">
            {{ currentMode === 'suggest' ? 'AI-powered medication suggestions' : 'AI-powered prescription safety check' }}
          </p>
          <p v-else-if="isLoading">{{ loadingMessage }}</p>
          <p v-else-if="analysisResult">
            <span :class="['status-badge', analysisResult.overall_risk_level]">
              {{ riskLevelLabel }}
            </span>
            <span class="confidence">{{ analysisResult.confidence_score }}% confidence</span>
          </p>
          <p v-else-if="suggestionResult">
            <span class="status-badge suggestion">
              {{ suggestionResult.suggestions?.length }} medications suggested
            </span>
          </p>
        </div>
      </div>
      <div class="panel-header__actions">
        <div v-if="creditBalance !== null" class="credits-badge">
          <v-icon name="bi-lightning-charge-fill" scale="0.7" />
          <span>{{ creditBalance === Infinity ? 'Unlimited' : creditBalance }}</span>
        </div>
      </div>
    </div>

    <!-- Mode Toggle -->
    <div v-if="isActive" class="mode-toggle">
      <button
        :class="{ active: currentMode === 'suggest' }"
        @click="currentMode = 'suggest'"
      >
        <v-icon name="bi-lightbulb" scale="0.8" />
        <span>Suggest Medications</span>
      </button>
      <button
        :class="{ active: currentMode === 'analyze' }"
        @click="currentMode = 'analyze'"
        :disabled="proposedDrugs?.length === 0"
      >
        <v-icon name="bi-shield-check" scale="0.8" />
        <span>Safety Analysis</span>
      </button>
    </div>

    <!-- Not Active State -->
    <div v-if="!isActive" class="inactive-state">
      <div class="inactive-icon">
        <v-icon name="hi-link" scale="1.2" />
      </div>
      <p class="inactive-title">Link clinical context to activate</p>
      <p class="inactive-text">RxGPT activates when you link a completed appointment with clinical notes or a health checkup.</p>
    </div>

    <!-- Suggestion Mode -->
    <div v-else-if="currentMode === 'suggest'" class="suggestion-mode">
      <!-- Suggestion Form -->
      <div v-if="!suggestionResult && !isLoading" class="suggestion-form">
        <div class="form-group">
          <label>Diagnosis / Condition</label>
          <input
            v-model="suggestionForm.diagnosis"
            type="text"
            placeholder="e.g., Upper respiratory infection, Hypertension"
            class="form-input"
          />
        </div>
        <div class="form-group">
          <label>Treatment Goal (optional)</label>
          <input
            v-model="suggestionForm.treatment_goal"
            type="text"
            placeholder="e.g., Pain relief, Blood pressure control"
            class="form-input"
          />
        </div>
        <div class="form-row">
          <div class="form-group half">
            <label>Max Suggestions</label>
            <select v-model="suggestionForm.max_suggestions" class="form-select">
              <option :value="3">3 medications</option>
              <option :value="5">5 medications</option>
              <option :value="7">7 medications</option>
            </select>
          </div>
          <div class="form-group half">
            <label>Preference</label>
            <select v-model="suggestionForm.prefer_inventory" class="form-select">
              <option :value="true">Prefer inventory</option>
              <option :value="false">All medications</option>
            </select>
          </div>
        </div>
        <button class="action-btn primary" @click="getSuggestions" :disabled="!canGetSuggestions">
          <v-icon name="bi-robot" scale="0.9" />
          <span>Get AI Suggestions</span>
        </button>
      </div>

      <!-- Suggestion Results -->
      <div v-else-if="suggestionResult" class="suggestion-results">
        <!-- Patient Context Summary -->
        <div class="context-summary">
          <div class="context-item">
            <v-icon name="hi-user" scale="0.8" />
            <span>{{ suggestionResult.patient_considerations?.age }}y {{ suggestionResult.patient_considerations?.gender }}</span>
          </div>
          <div v-if="suggestionResult.patient_considerations?.allergies?.length" class="context-item warning">
            <v-icon name="hi-exclamation-circle" scale="0.8" />
            <span>{{ suggestionResult.patient_considerations.allergies.length }} allergies</span>
          </div>
          <div v-if="suggestionResult.clinical_context?.diagnosis" class="context-item">
            <v-icon name="hi-document-text" scale="0.8" />
            <span>{{ suggestionResult.clinical_context.diagnosis }}</span>
          </div>
        </div>

        <!-- Clinical Summary -->
        <div class="clinical-summary-box">
          <p>{{ suggestionResult.clinical_summary }}</p>
        </div>

        <!-- Verification & Evidence Summaries -->
        <div class="verification-summaries" v-if="hasVerificationData">
          <!-- Overall Evidence Score -->
          <div v-if="suggestionResult.evidence_summary" class="summary-card evidence">
            <div class="summary-icon">
              <v-icon name="hi-beaker" scale="0.9" />
            </div>
            <div class="summary-content">
              <div class="summary-title">Evidence Confidence</div>
              <div class="summary-value">
                <span class="score">{{ suggestionResult.evidence_summary.overall_evidence_score }}%</span>
                <span :class="['level-badge', suggestionResult.evidence_summary.overall_evidence_level]">
                  {{ formatEvidenceLevel(suggestionResult.evidence_summary.overall_evidence_level) }}
                </span>
              </div>
              <div class="summary-detail">
                {{ suggestionResult.evidence_summary.drugs_with_strong_evidence }} strong,
                {{ suggestionResult.evidence_summary.drugs_with_weak_evidence }} weak evidence
              </div>
            </div>
          </div>

          <!-- Verification Summary -->
          <div v-if="suggestionResult.verification_summary" class="summary-card"
               :class="{ warning: suggestionResult.verification_summary.has_unverified_drugs }">
            <div class="summary-icon">
              <v-icon :name="suggestionResult.verification_summary.has_unverified_drugs ? 'hi-exclamation-triangle' : 'hi-shield-check'" scale="0.9" />
            </div>
            <div class="summary-content">
              <div class="summary-title">FDA Verification</div>
              <div class="summary-value">
                {{ suggestionResult.verification_summary.verified_count }}/{{ suggestionResult.verification_summary.total_suggestions }} verified
              </div>
              <div v-if="suggestionResult.verification_summary.warning" class="summary-warning">
                {{ suggestionResult.verification_summary.warning }}
              </div>
            </div>
          </div>

          <!-- Dosage Validation Summary -->
          <div v-if="suggestionResult.dosage_validation_summary" class="summary-card"
               :class="{ warning: suggestionResult.dosage_validation_summary.has_dosage_concerns, danger: suggestionResult.dosage_validation_summary.danger_count > 0 }">
            <div class="summary-icon">
              <v-icon :name="suggestionResult.dosage_validation_summary.danger_count > 0 ? 'hi-exclamation' : 'bi-capsule'" scale="0.9" />
            </div>
            <div class="summary-content">
              <div class="summary-title">Dosage Check</div>
              <div class="summary-value">
                <span v-if="suggestionResult.dosage_validation_summary.danger_count > 0" class="danger-count">
                  {{ suggestionResult.dosage_validation_summary.danger_count }} critical
                </span>
                <span v-else-if="suggestionResult.dosage_validation_summary.warning_count > 0" class="warning-count">
                  {{ suggestionResult.dosage_validation_summary.warning_count }} warnings
                </span>
                <span v-else class="safe-count">All safe</span>
              </div>
            </div>
          </div>

          <!-- NICE Compliance Summary -->
          <div v-if="suggestionResult.nice_compliance_summary" class="summary-card"
               :class="{ warning: suggestionResult.nice_compliance_summary.has_compliance_issues }">
            <div class="summary-icon nice">
              <span>NICE</span>
            </div>
            <div class="summary-content">
              <div class="summary-title">UK Guidelines</div>
              <div class="summary-value">
                {{ suggestionResult.nice_compliance_summary.fully_compliant }}/{{ suggestionResult.nice_compliance_summary.total_drugs_checked }} compliant
              </div>
            </div>
          </div>

          <!-- BNF Compliance Summary -->
          <div v-if="suggestionResult.bnf_compliance_summary" class="summary-card"
               :class="{ warning: suggestionResult.bnf_compliance_summary.has_uk_compliance_issues }">
            <div class="summary-icon bnf">
              <span>BNF</span>
            </div>
            <div class="summary-content">
              <div class="summary-title">UK Prescribing</div>
              <div class="summary-value">
                {{ suggestionResult.bnf_compliance_summary.uk_approved_count }}/{{ suggestionResult.bnf_compliance_summary.total_drugs_checked }} approved
              </div>
            </div>
          </div>

          <!-- WHO EML Compliance Summary -->
          <div v-if="suggestionResult.who_eml_compliance_summary" class="summary-card"
               :class="{ warning: suggestionResult.who_eml_compliance_summary.has_eml_issues }">
            <div class="summary-icon who-eml">
              <span>WHO</span>
            </div>
            <div class="summary-content">
              <div class="summary-title">Essential Medicines</div>
              <div class="summary-value">
                {{ suggestionResult.who_eml_compliance_summary.eml_listed_count }}/{{ suggestionResult.who_eml_compliance_summary.total_drugs_checked }} listed
              </div>
            </div>
          </div>

          <!-- Hallucination Check -->
          <div v-if="suggestionResult.hallucination_check" class="summary-card"
               :class="{
                 danger: suggestionResult.hallucination_check.recommendation === 'reject',
                 warning: suggestionResult.hallucination_check.recommendation === 'review_required'
               }">
            <div class="summary-icon">
              <v-icon :name="getHallucinationIcon(suggestionResult.hallucination_check.recommendation)" scale="0.9" />
            </div>
            <div class="summary-content">
              <div class="summary-title">AI Verification</div>
              <div class="summary-value">
                <span :class="['hallucination-badge', suggestionResult.hallucination_check.recommendation]">
                  {{ formatHallucinationStatus(suggestionResult.hallucination_check.recommendation) }}
                </span>
              </div>
              <div v-if="suggestionResult.hallucination_check.total_flags > 0" class="summary-detail">
                {{ suggestionResult.hallucination_check.total_flags }} potential issues
              </div>
            </div>
          </div>

          <!-- PubMed Evidence Summary -->
          <div v-if="suggestionResult.pubmed_evidence_summary" class="summary-card">
            <div class="summary-icon pubmed">
              <v-icon name="bi-journal-medical" scale="0.9" />
            </div>
            <div class="summary-content">
              <div class="summary-title">PubMed Evidence</div>
              <div class="summary-value">
                {{ suggestionResult.pubmed_evidence_summary.total_citations }} citations
              </div>
              <div class="summary-detail">
                {{ suggestionResult.pubmed_evidence_summary.high_quality_evidence_count }} high quality
              </div>
            </div>
          </div>
        </div>

        <!-- Hallucination Warning Alert -->
        <div v-if="suggestionResult.hallucination_check?.recommendation === 'reject'" class="hallucination-alert critical">
          <v-icon name="hi-exclamation" scale="1" />
          <div class="alert-content">
            <strong>AI Output Flagged for Review</strong>
            <p>{{ suggestionResult.hallucination_check.summary }}</p>
            <div v-if="suggestionResult.hallucination_check.flagged_drugs?.length" class="flagged-drugs">
              <span v-for="(drug, idx) in suggestionResult.hallucination_check.flagged_drugs" :key="idx" class="flagged-drug">
                {{ drug.drug_name }}
              </span>
            </div>
          </div>
        </div>

        <div v-else-if="suggestionResult.hallucination_check?.recommendation === 'review_required'" class="hallucination-alert warning">
          <v-icon name="hi-exclamation-circle" scale="1" />
          <div class="alert-content">
            <strong>Review Recommended</strong>
            <p>{{ suggestionResult.hallucination_check.summary }}</p>
          </div>
        </div>

        <!-- Medication Suggestions -->
        <div class="suggestions-list">
          <div class="section-title">
            <v-icon name="ri-capsule-line" scale="0.9" />
            <span>Suggested Medications</span>
          </div>

          <div
            v-for="(med, index) in suggestionResult.suggestions"
            :key="index"
            class="suggestion-card"
            :class="{
              'in-inventory': med.is_in_inventory,
              'out-of-stock': med.inventory_status === 'out_of_stock',
              selected: isSelected(med)
            }"
          >
            <div class="suggestion-header">
              <div class="suggestion-info">
                <span class="priority-badge" :class="med.priority">{{ med.priority }}</span>
                <h4>{{ med.drug_name }}</h4>
                <span v-if="med.generic_name" class="generic-name">({{ med.generic_name }})</span>
              </div>
              <div class="suggestion-meta">
                <span v-if="med.is_in_inventory" class="inventory-badge available">
                  <v-icon name="hi-check-circle" scale="0.7" />
                  {{ med.inventory_status === 'low_stock' ? 'Low Stock' : 'In Stock' }}
                </span>
                <span v-else class="inventory-badge external">
                  <v-icon name="hi-external-link" scale="0.7" />
                  External
                </span>
              </div>
            </div>

            <div class="suggestion-details">
              <div class="detail-row">
                <span class="label">Strength:</span>
                <span class="value">{{ med.strength }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Form:</span>
                <span class="value">{{ med.dosage_form }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Dosage:</span>
                <span class="value">{{ med.suggested_dosage }} {{ med.suggested_frequency }}</span>
              </div>
              <div v-if="med.suggested_duration" class="detail-row">
                <span class="label">Duration:</span>
                <span class="value">{{ med.suggested_duration }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Quantity:</span>
                <span class="value">{{ med.suggested_quantity }}</span>
              </div>
              <div v-if="med.unit_price" class="detail-row">
                <span class="label">Price:</span>
                <span class="value price">{{ formatPrice(med.unit_price) }}/unit</span>
              </div>
            </div>

            <div v-if="med.reasoning" class="suggestion-reasoning">
              <v-icon name="hi-light-bulb" scale="0.7" />
              {{ med.reasoning }}
            </div>

            <div v-if="med.instructions" class="suggestion-instructions">
              <v-icon name="hi-information-circle" scale="0.7" />
              {{ med.instructions }}
            </div>

            <!-- Confidence Bar -->
            <div class="confidence-row">
              <div class="confidence-bar">
                <div class="confidence-fill" :style="{ width: `${med.confidence}%` }"></div>
              </div>
              <span class="confidence-value">{{ med.confidence }}%</span>
            </div>

            <!-- Safety Warnings -->
            <div v-if="med.contraindication_check?.warnings?.length" class="safety-warnings">
              <v-icon name="hi-exclamation-circle" scale="0.7" />
              <span>{{ med.contraindication_check.warnings.join(', ') }}</span>
            </div>

            <!-- Verification & Evidence Section (Collapsible) -->
            <div v-if="hasVerificationInfo(med)" class="verification-section">
              <button class="verification-toggle" @click="toggleVerification(index)">
                <v-icon :name="expandedVerifications.includes(index) ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.7" />
                <span>Verification & Evidence</span>
                <div class="verification-badges">
                  <!-- FDA Verified Badge -->
                  <span v-if="med.verification?.fda_approved" class="mini-badge fda-verified">
                    <v-icon name="hi-shield-check" scale="0.6" /> FDA
                  </span>
                  <span v-else-if="med.verification && !med.verification.is_verified" class="mini-badge unverified">
                    <v-icon name="hi-exclamation-triangle" scale="0.6" /> Unverified
                  </span>
                  <!-- NICE Badge -->
                  <span v-if="med.nice_compliance?.is_compliant" class="mini-badge nice-compliant">
                    NICE
                  </span>
                  <!-- BNF Badge -->
                  <span v-if="med.bnf_info?.uk_approved" class="mini-badge bnf-approved">
                    BNF
                  </span>
                  <!-- WHO EML Badge -->
                  <span v-if="med.who_info?.found_in_eml" class="mini-badge who-eml-listed">
                    WHO{{ med.who_info.list_type === 'core' ? ' Core' : '' }}
                  </span>
                  <!-- PubMed Badge -->
                  <span v-if="med.pubmed_citations?.total_found > 0" class="mini-badge pubmed">
                    {{ med.pubmed_citations.total_found }} refs
                  </span>
                </div>
              </button>

              <div v-if="expandedVerifications.includes(index)" class="verification-details">
                <!-- Evidence Confidence Breakdown -->
                <div v-if="med.evidence_confidence" class="evidence-breakdown">
                  <div class="detail-header">
                    <v-icon name="hi-beaker" scale="0.7" />
                    <span>Evidence-Based Confidence</span>
                    <span :class="['level-tag', med.evidence_confidence.evidence_level]">
                      {{ formatEvidenceLevel(med.evidence_confidence.evidence_level) }}
                    </span>
                  </div>
                  <div class="evidence-bar">
                    <div class="evidence-fill" :style="{ width: `${med.evidence_confidence.final_score}%` }"></div>
                    <span class="evidence-score">{{ med.evidence_confidence.final_score }}%</span>
                  </div>
                  <p class="evidence-summary-text">{{ med.evidence_confidence.evidence_summary }}</p>
                  <div v-if="med.evidence_confidence.is_off_label" class="off-label-warning">
                    <v-icon name="hi-information-circle" scale="0.6" />
                    <span>Off-label use</span>
                  </div>
                  <div v-if="med.evidence_confidence.adjustments?.length" class="adjustments-list">
                    <div v-for="(adj, adjIdx) in med.evidence_confidence.adjustments" :key="adjIdx" class="adjustment-item">
                      <span class="adj-source">{{ adj.source }}</span>
                      <span :class="['adj-value', adj.adjustment >= 0 ? 'positive' : 'negative']">
                        {{ adj.adjustment >= 0 ? '+' : '' }}{{ adj.adjustment }}
                      </span>
                      <span class="adj-reason">{{ adj.reason }}</span>
                    </div>
                  </div>
                </div>

                <!-- FDA Verification -->
                <div v-if="med.verification" class="verification-block">
                  <div class="detail-header">
                    <v-icon name="hi-shield-check" scale="0.7" />
                    <span>FDA Verification</span>
                    <span :class="['status-tag', med.verification.is_verified ? 'verified' : 'unverified']">
                      {{ med.verification.is_verified ? 'Verified' : 'Unverified' }}
                    </span>
                  </div>
                  <div v-if="med.verification.verified_sources?.length" class="verified-sources">
                    <span>Sources:</span>
                    <span v-for="(src, srcIdx) in med.verification.verified_sources" :key="srcIdx" class="source-tag">
                      {{ formatSourceName(src) }}
                    </span>
                  </div>
                  <div v-if="med.verification.verification_warnings?.length" class="verification-warnings">
                    <div v-for="(warn, wIdx) in med.verification.verification_warnings" :key="wIdx" class="warn-item">
                      <v-icon name="hi-exclamation-triangle" scale="0.6" />
                      {{ warn }}
                    </div>
                  </div>
                </div>

                <!-- Dosage Validation -->
                <div v-if="med.dosage_validation" class="dosage-validation-block">
                  <div class="detail-header">
                    <v-icon name="bi-capsule" scale="0.7" />
                    <span>Dosage Validation</span>
                    <span :class="['status-tag', med.dosage_validation.status]">
                      {{ med.dosage_validation.status === 'safe' ? 'Safe' : med.dosage_validation.status === 'warning' ? 'Caution' : 'Unsafe' }}
                    </span>
                  </div>
                  <div v-if="med.dosage_validation.fda_dosage_info?.adult" class="fda-dosage-info">
                    <span class="dosage-label">FDA Adult Range:</span>
                    <span class="dosage-value">
                      {{ med.dosage_validation.fda_dosage_info.adult.min_dose || '?' }} - {{ med.dosage_validation.fda_dosage_info.adult.max_dose || '?' }}
                      <template v-if="med.dosage_validation.fda_dosage_info.adult.max_daily_dose">
                        (max {{ med.dosage_validation.fda_dosage_info.adult.max_daily_dose }}/day)
                      </template>
                    </span>
                  </div>
                  <div v-if="med.dosage_validation.warnings?.length" class="dosage-warnings">
                    <div v-for="(warn, wIdx) in med.dosage_validation.warnings" :key="wIdx" class="warn-item">
                      <v-icon name="hi-exclamation-circle" scale="0.6" />
                      {{ warn }}
                    </div>
                  </div>
                </div>

                <!-- NICE Compliance -->
                <div v-if="med.nice_compliance" class="nice-block">
                  <div class="detail-header">
                    <span class="nice-logo">NICE</span>
                    <span>UK Guidelines Compliance</span>
                    <span :class="['status-tag', med.nice_compliance.compliance_level]">
                      {{ formatComplianceLevel(med.nice_compliance.compliance_level) }}
                    </span>
                  </div>
                  <div v-if="med.nice_compliance.recommendation_type" class="nice-recommendation">
                    <span class="rec-label">Recommendation:</span>
                    <span :class="['rec-type', med.nice_compliance.recommendation_type]">
                      {{ formatRecommendationType(med.nice_compliance.recommendation_type) }}
                    </span>
                    <span v-if="med.nice_compliance.line_of_treatment" class="line-treatment">
                      ({{ formatLineOfTreatment(med.nice_compliance.line_of_treatment) }})
                    </span>
                  </div>
                  <p v-if="med.nice_compliance.recommendation_text" class="rec-text">
                    {{ med.nice_compliance.recommendation_text }}
                  </p>
                  <div v-if="med.nice_compliance.guideline_references?.length" class="guideline-refs">
                    <a v-for="(ref, refIdx) in med.nice_compliance.guideline_references" :key="refIdx"
                       :href="ref.url" target="_blank" class="guideline-link">
                      <v-icon name="hi-external-link" scale="0.6" />
                      {{ ref.title }}
                    </a>
                  </div>
                  <div v-if="med.nice_compliance.warnings?.length" class="nice-warnings">
                    <div v-for="(warn, wIdx) in med.nice_compliance.warnings" :key="wIdx" class="warn-item">
                      {{ warn }}
                    </div>
                  </div>
                </div>

                <!-- BNF Information -->
                <div v-if="med.bnf_info" class="bnf-block">
                  <div class="detail-header">
                    <span class="bnf-logo">BNF</span>
                    <span>UK Prescribing</span>
                    <span :class="['status-tag', med.bnf_info.uk_approved ? 'verified' : 'unverified']">
                      {{ med.bnf_info.uk_approved ? 'UK Approved' : 'Not UK Approved' }}
                    </span>
                  </div>
                  <div v-if="med.bnf_info.drug_class" class="bnf-class">
                    <span class="label">Class:</span> {{ med.bnf_info.drug_class }}
                  </div>
                  <div v-if="med.bnf_info.indications?.length" class="bnf-indications">
                    <span class="label">Indications:</span>
                    <span class="indication-list">{{ med.bnf_info.indications.join(', ') }}</span>
                    <span v-if="med.bnf_info.indication_match" class="match-badge">
                      <v-icon name="hi-check" scale="0.5" /> Match
                    </span>
                  </div>
                  <div v-if="med.bnf_info.cautions?.length" class="bnf-cautions">
                    <span class="label">Cautions:</span>
                    <span v-for="(caution, cIdx) in med.bnf_info.cautions.slice(0, 3)" :key="cIdx" class="caution-item">
                      {{ caution }}
                    </span>
                  </div>
                  <div v-if="med.bnf_info.interactions?.length" class="bnf-interactions">
                    <span class="label">Interactions:</span>
                    <div v-for="(int, intIdx) in med.bnf_info.interactions.slice(0, 3)" :key="intIdx" class="interaction-item">
                      <span :class="['severity', int.severity]">{{ int.severity }}</span>
                      <span>{{ int.drug }}: {{ int.effect }}</span>
                    </div>
                  </div>
                  <a v-if="med.bnf_info.bnf_url" :href="med.bnf_info.bnf_url" target="_blank" class="bnf-link">
                    <v-icon name="hi-external-link" scale="0.6" />
                    View in BNF
                  </a>
                </div>

                <!-- WHO Essential Medicines -->
                <div v-if="med.who_info" class="who-eml-block">
                  <div class="detail-header">
                    <span class="who-logo">WHO</span>
                    <span>Essential Medicines</span>
                    <span :class="['status-tag', med.who_info.found_in_eml ? 'verified' : 'unverified']">
                      {{ med.who_info.found_in_eml ? (med.who_info.list_type === 'core' ? 'Core' : 'Complementary') : 'Not in EML' }}
                    </span>
                  </div>
                  <div v-if="med.who_info.atc_code" class="who-meta-row">
                    <span class="label">ATC Code:</span> {{ med.who_info.atc_code }}
                  </div>
                  <div v-if="med.who_info.category" class="who-meta-row">
                    <span class="label">Category:</span> {{ med.who_info.category }}
                  </div>
                  <div v-if="med.who_info.matching_indications?.length" class="who-meta-row">
                    <span class="label">Indications:</span>
                    <span class="indication-list">{{ med.who_info.matching_indications.join(', ') }}</span>
                  </div>
                </div>

                <!-- PubMed Citations -->
                <div v-if="med.pubmed_citations?.citations?.length" class="pubmed-block">
                  <div class="detail-header">
                    <v-icon name="bi-journal-medical" scale="0.7" />
                    <span>Clinical Evidence ({{ med.pubmed_citations.total_found }} articles)</span>
                  </div>
                  <div v-if="med.pubmed_citations.evidence_summary" class="evidence-counts">
                    <span class="evidence-tag high">{{ med.pubmed_citations.evidence_summary.high_quality_count }} high</span>
                    <span class="evidence-tag moderate">{{ med.pubmed_citations.evidence_summary.moderate_quality_count }} moderate</span>
                    <span class="evidence-tag low">{{ med.pubmed_citations.evidence_summary.low_quality_count }} low</span>
                  </div>
                  <div class="citations-list">
                    <a v-for="(citation, citIdx) in med.pubmed_citations.citations.slice(0, 5)" :key="citIdx"
                       :href="citation.url" target="_blank" class="citation-item">
                      <div class="citation-header">
                        <span :class="['evidence-level', citation.evidence_level]">{{ citation.evidence_level }}</span>
                        <span class="citation-year">{{ citation.year }}</span>
                      </div>
                      <div class="citation-title">{{ citation.title }}</div>
                      <div class="citation-meta">
                        {{ citation.authors_short }} - {{ citation.journal }}
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Button -->
            <div class="suggestion-actions">
              <button
                v-if="!isSelected(med)"
                class="add-btn"
                @click="addMedication(med)"
              >
                <v-icon name="hi-plus" scale="0.8" />
                Add to Prescription
              </button>
              <button
                v-else
                class="remove-btn"
                @click="removeMedication(med)"
              >
                <v-icon name="hi-check" scale="0.8" />
                Added
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="results-actions">
          <button class="action-btn secondary" @click="clearSuggestions">
            <v-icon name="hi-arrow-left" scale="0.8" />
            New Suggestions
          </button>
          <button
            v-if="selectedMedications.length > 0"
            class="action-btn primary"
            @click="addAllSelected"
          >
            <v-icon name="hi-plus-circle" scale="0.8" />
            Add {{ selectedMedications.length }} Selected
          </button>
        </div>

        <!-- Disclaimer -->
        <div class="disclaimer">
          <v-icon name="hi-information-circle" scale="0.8" />
          <p>{{ suggestionResult.disclaimer || defaultDisclaimer }}</p>
        </div>
      </div>
    </div>

    <!-- Analysis Mode (existing functionality) -->
    <div v-else-if="currentMode === 'analyze'" class="analysis-mode">
      <!-- Ready State -->
      <div v-if="!analysisResult && !isLoading" class="ready-state">
        <div class="ready-icon">
          <v-icon name="bi-shield-check" scale="1.5" />
        </div>
        <p class="ready-title">Ready to analyze</p>
        <p class="ready-text">
          {{ proposedDrugs?.length || 0 }} medication(s) to check for drug interactions, allergies, and contraindications.
        </p>
        <button class="action-btn primary" @click="runAnalysis" :disabled="!canAnalyze">
          <v-icon name="bi-robot" scale="0.9" />
          <span>Run Safety Analysis</span>
        </button>
      </div>

      <!-- Analysis Results -->
      <div v-else-if="analysisResult" class="analysis-results">
        <!-- Critical Alerts Section -->
        <div v-if="criticalAlerts.length" class="alerts-section critical">
          <div class="section-title">
            <v-icon name="hi-exclamation" scale="0.9" />
            <span>Critical Alerts ({{ criticalAlerts.length }})</span>
          </div>
          <div class="alerts-list">
            <div
              v-for="(alert, index) in criticalAlerts"
              :key="`critical-${index}`"
              class="alert-card critical"
            >
              <div class="alert-header">
                <span class="alert-type">{{ formatAlertType(alert.type) }}</span>
                <span class="alert-drug">{{ alert.drug_name }}</span>
              </div>
              <p class="alert-message">{{ alert.message }}</p>
              <div v-if="showReasoning && alert.reasoning" class="alert-reasoning">
                <strong>Reasoning:</strong> {{ alert.reasoning }}
              </div>
              <p class="alert-action">
                <v-icon name="hi-arrow-right" scale="0.7" />
                {{ alert.action_required }}
              </p>
            </div>
          </div>
        </div>

        <!-- Warning Alerts Section -->
        <div v-if="warningAlerts.length" class="alerts-section warning">
          <div class="section-title">
            <v-icon name="hi-exclamation-circle" scale="0.9" />
            <span>Warnings ({{ warningAlerts.length }})</span>
          </div>
          <div class="alerts-list">
            <div
              v-for="(alert, index) in warningAlerts"
              :key="`warning-${index}`"
              class="alert-card warning"
            >
              <div class="alert-header">
                <span class="alert-type">{{ formatAlertType(alert.type) }}</span>
                <span class="alert-drug">{{ alert.drug_name }}</span>
              </div>
              <p class="alert-message">{{ alert.message }}</p>
              <p v-if="alert.action_required" class="alert-action">
                <v-icon name="hi-arrow-right" scale="0.7" />
                {{ alert.action_required }}
              </p>
            </div>
          </div>
        </div>

        <!-- Drug Analysis Section -->
        <div v-if="analysisResult.drug_analyses?.length" class="drug-analysis-section">
          <div class="section-title">
            <v-icon name="ri-capsule-line" scale="0.9" />
            <span>Drug Analysis</span>
          </div>
          <div class="drug-cards">
            <div
              v-for="(drug, index) in analysisResult.drug_analyses"
              :key="`drug-${index}`"
              class="drug-card"
              :class="{ appropriate: drug.is_appropriate, 'not-appropriate': !drug.is_appropriate }"
            >
              <div class="drug-header">
                <span class="drug-name">{{ drug.drug_name }}</span>
                <span class="drug-status">
                  <v-icon :name="drug.is_appropriate ? 'hi-check-circle' : 'hi-x-circle'" scale="0.8" />
                  {{ drug.is_appropriate ? 'Appropriate' : 'Review Required' }}
                </span>
              </div>
              <p v-if="showReasoning && drug.reasoning" class="drug-reasoning">{{ drug.reasoning }}</p>
            </div>
          </div>
        </div>

        <!-- Clinical Summary -->
        <div v-if="analysisResult.clinical_summary" class="clinical-summary">
          <div class="section-title">
            <v-icon name="hi-document-text" scale="0.9" />
            <span>Clinical Summary</span>
          </div>
          <p>{{ analysisResult.clinical_summary }}</p>
        </div>

        <!-- Re-analyze Button -->
        <div class="results-actions">
          <button class="action-btn secondary" @click="analysisResult = null">
            <v-icon name="hi-refresh" scale="0.8" />
            Re-analyze
          </button>
        </div>

        <!-- Disclaimer -->
        <div class="disclaimer">
          <v-icon name="hi-information-circle" scale="0.8" />
          <p>{{ analysisResult.disclaimer || defaultDisclaimer }}</p>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="bi-robot" scale="1.2" />
        </div>
        <p class="loading-text">{{ loadingMessage }}</p>
        <p class="loading-subtext">{{ loadingSubtext }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, reactive } from 'vue';
import { useToast } from 'vue-toast-notification';
import apiFactory from '@/services/apiFactory';
import { useCurrency } from '@/composables/useCurrency';

const { format: formatPrice } = useCurrency();

const $toast = useToast();

const props = defineProps({
  patientId: { type: String, default: '' },
  proposedDrugs: { type: Array, default: () => [] },
  linkedAppointments: { type: Array, default: () => [] },
  linkedClinicalNotes: { type: Array, default: () => [] },
  linkedHealthCheckups: { type: Array, default: () => [] },
});

const emit = defineEmits(['alert', 'analysis-complete', 'add-medication', 'add-medications']);

// State
const currentMode = ref('suggest'); // 'suggest' or 'analyze'
const isLoading = ref(false);
const loadingMessage = ref('');
const loadingSubtext = ref('');
const analysisResult = ref(null);
const suggestionResult = ref(null);
const creditBalance = ref(null);
const settings = ref(null);
const selectedMedications = ref([]);
const expandedVerifications = ref([]); // Track which verification sections are expanded

// Suggestion Form
const suggestionForm = reactive({
  diagnosis: '',
  treatment_goal: '',
  max_suggestions: 5,
  prefer_inventory: true,
});

// Default disclaimer
const defaultDisclaimer = 'RxGPT is an AI-powered assistant. All recommendations should be reviewed and verified by a licensed healthcare professional.';

// Computed
const isActive = computed(() => {
  const hasLinkedAppointmentWithNotes = props.linkedAppointments?.length > 0 || props.linkedClinicalNotes?.length > 0;
  const hasLinkedCheckup = props.linkedHealthCheckups?.length > 0;
  return hasLinkedAppointmentWithNotes || hasLinkedCheckup;
});

const canAnalyze = computed(() => {
  return isActive.value && props.proposedDrugs?.length > 0 && props.patientId;
});

const canGetSuggestions = computed(() => {
  return isActive.value && props.patientId;
});

const hasAlerts = computed(() => {
  return analysisResult.value?.alerts?.length > 0;
});

const criticalAlerts = computed(() => {
  return analysisResult.value?.alerts?.filter(a => a.severity === 'critical') || [];
});

const warningAlerts = computed(() => {
  return analysisResult.value?.alerts?.filter(a => a.severity === 'warning') || [];
});

const showReasoning = computed(() => settings.value?.display?.show_reasoning !== false);

const hasVerificationData = computed(() => {
  if (!suggestionResult.value) return false;
  return !!(
    suggestionResult.value.evidence_summary ||
    suggestionResult.value.verification_summary ||
    suggestionResult.value.dosage_validation_summary ||
    suggestionResult.value.nice_compliance_summary ||
    suggestionResult.value.bnf_compliance_summary ||
    suggestionResult.value.who_eml_compliance_summary ||
    suggestionResult.value.hallucination_check ||
    suggestionResult.value.pubmed_evidence_summary
  );
});

const statusClass = computed(() => {
  if (isLoading.value) return 'analyzing';
  if (suggestionResult.value) return 'suggestion';
  if (!analysisResult.value) return 'idle';
  if (criticalAlerts.value.length > 0) return 'critical';
  if (warningAlerts.value.length > 0) return 'warning';
  return 'safe';
});

const statusIcon = computed(() => {
  if (isLoading.value) return 'ri-loader-4-line';
  if (suggestionResult.value) return 'bi-lightbulb';
  if (!analysisResult.value) return 'bi-robot';
  if (criticalAlerts.value.length > 0) return 'hi-exclamation';
  if (warningAlerts.value.length > 0) return 'hi-exclamation-circle';
  return 'hi-shield-check';
});

const riskLevelLabel = computed(() => {
  const level = analysisResult.value?.overall_risk_level;
  const labels = {
    low: 'Low Risk',
    moderate: 'Moderate Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  };
  return labels[level] || 'Unknown';
});

// Methods
function formatAlertType(type) {
  const types = {
    allergy: 'Allergy',
    interaction: 'Drug Interaction',
    contraindication: 'Contraindication',
    dosage: 'Dosage Issue',
    age: 'Age Concern',
    pregnancy: 'Pregnancy Risk',
  };
  return types[type] || type;
}


// Verification & Evidence helpers
function hasVerificationInfo(med) {
  return !!(
    med.verification ||
    med.evidence_confidence ||
    med.dosage_validation ||
    med.nice_compliance ||
    med.bnf_info ||
    med.who_info ||
    med.pubmed_citations?.citations?.length
  );
}

function toggleVerification(index) {
  const idx = expandedVerifications.value.indexOf(index);
  if (idx > -1) {
    expandedVerifications.value.splice(idx, 1);
  } else {
    expandedVerifications.value.push(index);
  }
}

function formatEvidenceLevel(level) {
  const labels = {
    very_high: 'Very High',
    high: 'High',
    moderate: 'Moderate',
    low: 'Low',
    very_low: 'Very Low',
  };
  return labels[level] || level;
}

function formatSourceName(source) {
  const names = {
    local_inventory: 'Inventory',
    openfda: 'FDA',
    pubmed: 'PubMed',
    nice: 'NICE',
    bnf: 'BNF',
    'who_eml': 'WHO EML',
    'WHO EML': 'WHO EML',
  };
  return names[source] || source;
}

function formatComplianceLevel(level) {
  const labels = {
    full: 'Fully Compliant',
    partial: 'Partially Compliant',
    none: 'Non-Compliant',
    unknown: 'Unknown',
  };
  return labels[level] || level;
}

function formatRecommendationType(type) {
  const labels = {
    recommended: 'Recommended',
    consider: 'Consider',
    do_not_offer: 'Do Not Offer',
    caution: 'Use with Caution',
  };
  return labels[type] || type;
}

function formatLineOfTreatment(line) {
  const labels = {
    first_line: '1st Line',
    second_line: '2nd Line',
    third_line: '3rd Line',
    adjunct: 'Adjunct',
  };
  return labels[line] || line;
}

function formatHallucinationStatus(status) {
  const labels = {
    safe: 'Verified Safe',
    review_required: 'Review Needed',
    reject: 'Flagged',
  };
  return labels[status] || status;
}

function getHallucinationIcon(status) {
  const icons = {
    safe: 'hi-shield-check',
    review_required: 'hi-exclamation-circle',
    reject: 'hi-exclamation',
  };
  return icons[status] || 'hi-question-mark-circle';
}

function isSelected(med) {
  return selectedMedications.value.some(
    m => m.drug_name === med.drug_name && m.strength === med.strength
  );
}

function addMedication(med) {
  if (!isSelected(med)) {
    selectedMedications.value.push(med);

    // Emit to parent to add to prescription items
    emit('add-medication', {
      drug_id: med.drug_id || null,
      drug_name: med.drug_name,
      generic_name: med.generic_name,
      strength: med.strength,
      dosage_form: med.dosage_form,
      dosage: med.suggested_dosage,
      frequency: med.suggested_frequency,
      duration: med.suggested_duration,
      instructions: med.instructions,
      quantity: med.suggested_quantity,
      unit_price: med.unit_price || 0,
      is_in_inventory: med.is_in_inventory,
      source: med.is_in_inventory ? 'inventory' : 'external',
      rxgpt_suggested: true,
      rxgpt_reasoning: med.reasoning,
    });

    $toast.success(`${med.drug_name} added to prescription`);
  }
}

function removeMedication(med) {
  const index = selectedMedications.value.findIndex(
    m => m.drug_name === med.drug_name && m.strength === med.strength
  );
  if (index > -1) {
    selectedMedications.value.splice(index, 1);
  }
}

function addAllSelected() {
  emit('add-medications', selectedMedications.value.map(med => ({
    drug_id: med.drug_id || null,
    drug_name: med.drug_name,
    generic_name: med.generic_name,
    strength: med.strength,
    dosage_form: med.dosage_form,
    dosage: med.suggested_dosage,
    frequency: med.suggested_frequency,
    duration: med.suggested_duration,
    instructions: med.instructions,
    quantity: med.suggested_quantity,
    unit_price: med.unit_price || 0,
    is_in_inventory: med.is_in_inventory,
    source: med.is_in_inventory ? 'inventory' : 'external',
    rxgpt_suggested: true,
    rxgpt_reasoning: med.reasoning,
  })));

  $toast.success(`${selectedMedications.value.length} medications added to prescription`);
  selectedMedications.value = [];
}

function clearSuggestions() {
  suggestionResult.value = null;
  selectedMedications.value = [];
  expandedVerifications.value = [];
}

async function fetchCreditsAndSettings() {
  try {
    const statusRes = await apiFactory.$_getRxGPTStatus();
    if (statusRes.data?.data) {
      const data = statusRes.data.data;
      creditBalance.value = data.credits?.available ?? 0;
      if (data.credits?.has_unlimited) {
        creditBalance.value = Infinity;
      }
      settings.value = data;
    }
  } catch (err) {
    console.error('Failed to fetch RxGPT status:', err);
  }
}

async function getSuggestions() {
  if (!canGetSuggestions.value || isLoading.value) return;

  isLoading.value = true;
  loadingMessage.value = 'Generating medication suggestions...';
  loadingSubtext.value = 'Analyzing patient context and clinical guidelines';

  try {
    const payload = {
      patient_id: props.patientId,
      linked_appointments: props.linkedAppointments,
      linked_clinical_notes: props.linkedClinicalNotes,
      linked_health_checkups: props.linkedHealthCheckups,
      diagnosis: suggestionForm.diagnosis || undefined,
      treatment_goal: suggestionForm.treatment_goal || undefined,
      max_suggestions: suggestionForm.max_suggestions,
      prefer_inventory: suggestionForm.prefer_inventory,
    };

    const response = await apiFactory.$_rxgptSuggestMedications(payload);

    if (response.data?.data) {
      suggestionResult.value = response.data.data;
      creditBalance.value = response.data.data.credits_remaining;

      $toast.success(`${suggestionResult.value.suggestions?.length || 0} medication suggestions generated`);
    }
  } catch (err) {
    console.error('RxGPT suggestion failed:', err);
    const errorMsg = err.response?.data?.message || 'Failed to generate suggestions. Please try again.';
    $toast.error(errorMsg);
  } finally {
    isLoading.value = false;
  }
}

async function runAnalysis() {
  if (!canAnalyze.value || isLoading.value) return;

  isLoading.value = true;
  loadingMessage.value = 'Analyzing prescription safety...';
  loadingSubtext.value = 'Checking allergies, interactions, and contraindications';

  try {
    const payload = {
      patient_id: props.patientId,
      proposed_drugs: props.proposedDrugs.map(drug => ({
        drug_id: drug.drug_id,
        name: drug.drug_name,
        generic_name: drug.generic_name,
        strength: drug.strength,
        dosage: drug.dosage,
        frequency: drug.frequency,
        duration_days: drug.duration_days,
        instructions: drug.instructions,
        quantity: drug.quantity,
      })),
      linked_appointments: props.linkedAppointments,
      linked_clinical_notes: props.linkedClinicalNotes,
      linked_health_checkups: props.linkedHealthCheckups,
    };

    const response = await apiFactory.$_rxgptAnalyze(payload);

    if (response.data?.data) {
      analysisResult.value = response.data.data;
      creditBalance.value = response.data.data.credits_remaining;

      // Emit alerts for parent handling
      if (analysisResult.value.alerts?.length > 0) {
        emit('alert', analysisResult.value.alerts);
      }

      emit('analysis-complete', analysisResult.value);

      // Show toast for critical alerts
      if (criticalAlerts.value.length > 0) {
        $toast.error(`${criticalAlerts.value.length} critical safety alert(s) detected!`);
      } else if (warningAlerts.value.length > 0) {
        $toast.warning(`${warningAlerts.value.length} warning(s) detected.`);
      } else {
        $toast.success('Prescription analysis complete. No critical issues found.');
      }
    }
  } catch (err) {
    console.error('RxGPT analysis failed:', err);
    const errorMsg = err.response?.data?.message || 'Analysis failed. Please try again.';
    $toast.error(errorMsg);
  } finally {
    isLoading.value = false;
  }
}

// Watch for mode changes to reset state
watch(currentMode, () => {
  analysisResult.value = null;
  suggestionResult.value = null;
  selectedMedications.value = [];
  expandedVerifications.value = [];
});

// Watch for drug changes to clear old analysis
watch(() => props.proposedDrugs, () => {
  if (analysisResult.value) {
    analysisResult.value = null;
  }
}, { deep: true });

// Lifecycle
onMounted(() => {
  fetchCreditsAndSettings();
});
</script>

<style scoped lang="scss">
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$red: #EF4444;
$red-light: #FEE2E2;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

.rxgpt-panel {
  margin-top: 24px;
  padding: 20px;
  background: linear-gradient(135deg, $sky-light, lighten($sky-light, 3%));
  border-radius: 16px;
  border: 2px solid rgba($sky, 0.3);
  position: relative;
  overflow: hidden;

  &.has-alerts {
    border-color: rgba($amber, 0.4);
  }

  &.is-loading {
    pointer-events: none;
  }
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;

  &__left {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  &__icon {
    width: 40px;
    height: 40px;
    background: $sky-dark;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;

    &.idle { background: $sky-dark; }
    &.analyzing { background: $violet; }
    &.suggestion { background: $violet; }
    &.safe { background: $emerald; }
    &.warning { background: $amber; }
    &.critical { background: $red; }
  }

  &__content {
    h3 {
      font-size: 16px;
      font-weight: 700;
      color: $navy;
      margin: 0 0 4px 0;
    }

    p {
      font-size: 13px;
      color: $gray;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.credits-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba($sky-dark, 0.1);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: $sky-dark;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;

  &.low { background: $emerald-light; color: darken($emerald, 10%); }
  &.moderate { background: $amber-light; color: darken($amber, 10%); }
  &.high { background: lighten($red-light, 2%); color: $red; }
  &.critical { background: $red; color: white; }
  &.suggestion { background: $violet-light; color: $violet; }
}

// Mode Toggle
.mode-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  background: rgba(white, 0.6);
  padding: 4px;
  border-radius: 12px;

  button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    background: transparent;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    color: $gray;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      background: rgba($sky-dark, 0.1);
      color: $sky-dark;
    }

    &.active {
      background: $sky-dark;
      color: white;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

// Inactive State
.inactive-state, .ready-state {
  padding: 32px 20px;
  text-align: center;

  .inactive-icon, .ready-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: rgba($sky-dark, 0.1);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;
  }

  .inactive-title, .ready-title {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 8px 0;
  }

  .inactive-text, .ready-text {
    font-size: 13px;
    color: $gray;
    margin: 0 0 16px 0;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.5;
  }
}

// Suggestion Form
.suggestion-form {
  padding: 16px;
  background: white;
  border-radius: 12px;
}

.form-group {
  margin-bottom: 16px;

  &.half {
    flex: 1;
  }

  label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: $slate;
    margin-bottom: 6px;
  }
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-input, .form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  color: $navy;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: $sky-dark;
  }

  &::placeholder {
    color: $gray;
  }
}

.form-select {
  cursor: pointer;
}

// Action Buttons
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 20px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &.primary {
    background: $sky-dark;
    color: white;

    &:hover:not(:disabled) {
      background: $sky-darker;
    }
  }

  &.secondary {
    background: white;
    color: $sky-dark;
    border: 1px solid $sky-dark;

    &:hover:not(:disabled) {
      background: $sky-light;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Suggestion Results
.suggestion-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.context-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.context-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: white;
  border-radius: 20px;
  font-size: 12px;
  color: $slate;

  &.warning {
    background: $amber-light;
    color: darken($amber, 10%);
  }
}

.clinical-summary-box {
  padding: 12px;
  background: rgba($sky-dark, 0.05);
  border-radius: 10px;
  border-left: 4px solid $sky-dark;

  p {
    font-size: 13px;
    color: $slate;
    margin: 0;
    line-height: 1.5;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: $navy;
  margin-bottom: 12px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-card {
  padding: 16px;
  background: white;
  border-radius: 12px;
  border: 2px solid #E2E8F0;
  transition: all 0.2s ease;

  &.in-inventory {
    border-color: rgba($emerald, 0.3);
  }

  &.out-of-stock {
    border-color: rgba($amber, 0.3);
    background: rgba($amber, 0.02);
  }

  &.selected {
    border-color: $sky-dark;
    background: rgba($sky, 0.05);
  }
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.suggestion-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;

  h4 {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
    margin: 0;
  }

  .generic-name {
    font-size: 13px;
    color: $gray;
  }
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;

  &.primary {
    background: $emerald-light;
    color: darken($emerald, 10%);
  }

  &.alternative {
    background: $amber-light;
    color: darken($amber, 10%);
  }

  &.supplementary {
    background: #E2E8F0;
    color: $gray;
  }
}

.inventory-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;

  &.available {
    background: $emerald-light;
    color: darken($emerald, 10%);
  }

  &.external {
    background: $violet-light;
    color: $violet;
  }
}

.suggestion-details {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  gap: 6px;
  font-size: 13px;

  .label {
    color: $gray;
  }

  .value {
    color: $navy;
    font-weight: 500;

    &.price {
      color: $emerald;
    }
  }
}

.suggestion-reasoning, .suggestion-instructions {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px;
  background: $bg;
  border-radius: 8px;
  font-size: 13px;
  color: $slate;
  line-height: 1.5;
  margin-bottom: 12px;
}

.confidence-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.confidence-bar {
  flex: 1;
  height: 6px;
  background: #E2E8F0;
  border-radius: 3px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: $sky-dark;
  border-radius: 3px;
}

.confidence-value {
  font-size: 12px;
  font-weight: 600;
  color: $slate;
  min-width: 36px;
}

.safety-warnings {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 10px;
  background: rgba($amber, 0.1);
  border-radius: 8px;
  font-size: 12px;
  color: darken($amber, 10%);
  margin-bottom: 12px;
}

.suggestion-actions {
  display: flex;
  gap: 8px;
}

.add-btn, .remove-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn {
  background: $sky-dark;
  color: white;

  &:hover {
    background: $sky-darker;
  }
}

.remove-btn {
  background: $emerald;
  color: white;

  &:hover {
    background: darken($emerald, 5%);
  }
}

.results-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

// Analysis Results
.analysis-results {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.alerts-section {
  padding: 16px;
  border-radius: 12px;

  &.critical {
    background: rgba($red, 0.08);
    border: 1px solid rgba($red, 0.2);

    .section-title { color: $red; }
  }

  &.warning {
    background: rgba($amber, 0.08);
    border: 1px solid rgba($amber, 0.2);

    .section-title { color: darken($amber, 10%); }
  }
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-card {
  padding: 14px;
  background: white;
  border-radius: 10px;
  border-left: 4px solid;

  &.critical { border-color: $red; }
  &.warning { border-color: $amber; }

  .alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .alert-type {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: $gray;
  }

  .alert-drug {
    font-size: 12px;
    font-weight: 600;
    color: $navy;
    background: $bg;
    padding: 2px 8px;
    border-radius: 6px;
  }

  .alert-message {
    font-size: 14px;
    font-weight: 500;
    color: $navy;
    margin: 0 0 8px 0;
    line-height: 1.4;
  }

  .alert-reasoning {
    font-size: 13px;
    color: $slate;
    margin: 0 0 8px 0;
    padding: 8px;
    background: $bg;
    border-radius: 6px;
    line-height: 1.5;
  }

  .alert-action {
    font-size: 13px;
    color: $sky-dark;
    font-weight: 500;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.drug-analysis-section {
  .section-title { color: $sky-dark; }
}

.drug-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.drug-card {
  padding: 14px;
  background: white;
  border-radius: 10px;
  border: 1px solid #E2E8F0;

  &.appropriate {
    border-left: 4px solid $emerald;
  }

  &.not-appropriate {
    border-left: 4px solid $amber;
  }

  .drug-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .drug-name {
    font-size: 14px;
    font-weight: 600;
    color: $navy;
  }

  .drug-status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;

    .appropriate & { color: $emerald; }
    .not-appropriate & { color: $amber; }
  }

  .drug-reasoning {
    font-size: 13px;
    color: $slate;
    margin: 0;
    line-height: 1.5;
  }
}

.clinical-summary {
  padding: 16px;
  background: rgba($sky-dark, 0.05);
  border-radius: 12px;
  border: 1px solid rgba($sky, 0.2);

  .section-title { color: $sky-dark; }

  p {
    font-size: 14px;
    color: $slate;
    margin: 0;
    line-height: 1.6;
  }
}

.disclaimer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: rgba($gray, 0.08);
  border-radius: 8px;
  color: $gray;

  p {
    font-size: 12px;
    margin: 0;
    line-height: 1.5;
  }
}

// Loading Overlay
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 72px;
  height: 72px;
  margin: 0 auto 16px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $violet;

  .spinner-ring {
    position: absolute;
    inset: 0;
    border: 3px solid rgba($violet, 0.2);
    border-top-color: $violet;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 15px;
  font-weight: 600;
  color: $navy;
  margin: 0 0 4px 0;
}

.loading-subtext {
  font-size: 13px;
  color: $gray;
  margin: 0;
}

// ========== Verification & Evidence Styles ==========

.verification-summaries {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.summary-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: white;
  border-radius: 10px;
  border: 1px solid #E2E8F0;

  &.warning {
    background: rgba($amber, 0.05);
    border-color: rgba($amber, 0.3);
  }

  &.danger {
    background: rgba($red, 0.05);
    border-color: rgba($red, 0.3);
  }

  &.evidence {
    border-color: rgba($violet, 0.3);
    background: rgba($violet, 0.03);
  }
}

.summary-icon {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $sky-light;
  color: $sky-dark;

  &.nice, &.bnf, &.who-eml {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  &.nice {
    background: #1e3a5f;
    color: white;
  }

  &.bnf {
    background: #004080;
    color: white;
  }

  &.who-eml {
    background: #009EDB;
    color: white;
  }

  &.pubmed {
    background: #326599;
    color: white;
  }
}

.summary-content {
  flex: 1;
  min-width: 0;
}

.summary-title {
  font-size: 11px;
  color: $gray;
  margin-bottom: 2px;
}

.summary-value {
  font-size: 14px;
  font-weight: 600;
  color: $navy;
  display: flex;
  align-items: center;
  gap: 6px;

  .score {
    font-size: 18px;
  }

  .danger-count { color: $red; }
  .warning-count { color: $amber; }
  .safe-count { color: $emerald; }
}

.summary-detail {
  font-size: 11px;
  color: $gray;
  margin-top: 2px;
}

.summary-warning {
  font-size: 11px;
  color: darken($amber, 10%);
  margin-top: 4px;
}

.level-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;

  &.very_high { background: $emerald-light; color: darken($emerald, 10%); }
  &.high { background: lighten($emerald-light, 3%); color: $emerald; }
  &.moderate { background: $amber-light; color: darken($amber, 10%); }
  &.low { background: $red-light; color: $red; }
  &.very_low { background: $red; color: white; }
}

.hallucination-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;

  &.safe { background: $emerald-light; color: darken($emerald, 10%); }
  &.review_required { background: $amber-light; color: darken($amber, 10%); }
  &.reject { background: $red-light; color: $red; }
}

.hallucination-alert {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 10px;
  margin-bottom: 16px;

  &.critical {
    background: rgba($red, 0.08);
    border: 1px solid rgba($red, 0.3);
    color: $red;
  }

  &.warning {
    background: rgba($amber, 0.08);
    border: 1px solid rgba($amber, 0.3);
    color: darken($amber, 10%);
  }

  .alert-content {
    flex: 1;

    strong { display: block; margin-bottom: 4px; }
    p { font-size: 13px; margin: 0 0 8px 0; color: $slate; }
  }

  .flagged-drugs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .flagged-drug {
    padding: 2px 8px;
    background: rgba($red, 0.15);
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }
}

// Verification Section in Cards
.verification-section {
  margin-top: 12px;
  border-top: 1px solid #E2E8F0;
  padding-top: 12px;
}

.verification-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: $bg;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: darken($bg, 2%);
  }

  span { flex: 1; text-align: left; }
}

.verification-badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.mini-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;

  &.fda-verified { background: $emerald-light; color: darken($emerald, 10%); }
  &.unverified { background: $amber-light; color: darken($amber, 10%); }
  &.nice-compliant { background: #1e3a5f; color: white; }
  &.bnf-approved { background: #004080; color: white; }
  &.who-eml-listed { background: #009EDB; color: white; }
  &.pubmed { background: #326599; color: white; }
}

.verification-details {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: $slate;
  margin-bottom: 8px;
}

.status-tag, .level-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  margin-left: auto;

  &.verified, &.safe { background: $emerald-light; color: darken($emerald, 10%); }
  &.unverified { background: $amber-light; color: darken($amber, 10%); }
  &.warning { background: $amber-light; color: darken($amber, 10%); }
  &.danger { background: $red-light; color: $red; }
  &.full { background: $emerald-light; color: darken($emerald, 10%); }
  &.partial { background: $amber-light; color: darken($amber, 10%); }
  &.none { background: $red-light; color: $red; }
  &.unknown { background: #E2E8F0; color: $gray; }
  &.very_high, &.high { background: $emerald-light; color: darken($emerald, 10%); }
  &.moderate { background: $amber-light; color: darken($amber, 10%); }
  &.low, &.very_low { background: $red-light; color: $red; }
}

.evidence-breakdown, .verification-block, .dosage-validation-block,
.nice-block, .bnf-block, .who-eml-block, .pubmed-block {
  padding: 12px;
  background: $bg;
  border-radius: 8px;
}

.evidence-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  height: 8px;
  background: #E2E8F0;
  border-radius: 4px;
  overflow: visible;
  position: relative;
}

.evidence-fill {
  height: 100%;
  background: linear-gradient(90deg, $sky-dark, $violet);
  border-radius: 4px;
}

.evidence-score {
  position: absolute;
  right: -32px;
  font-size: 11px;
  font-weight: 600;
  color: $slate;
}

.evidence-summary-text {
  font-size: 12px;
  color: $gray;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.off-label-warning {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: $amber-light;
  border-radius: 4px;
  font-size: 11px;
  color: darken($amber, 10%);
}

.adjustments-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.adjustment-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  padding: 4px 8px;
  background: white;
  border-radius: 4px;

  .adj-source {
    font-weight: 600;
    color: $slate;
    text-transform: capitalize;
  }

  .adj-value {
    font-weight: 700;
    min-width: 28px;

    &.positive { color: $emerald; }
    &.negative { color: $red; }
  }

  .adj-reason {
    color: $gray;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.verified-sources {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
  margin-bottom: 8px;

  span:first-child { color: $gray; }
}

.source-tag {
  padding: 2px 6px;
  background: $sky-light;
  color: $sky-dark;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

.verification-warnings, .dosage-warnings, .nice-warnings {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.warn-item {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  font-size: 11px;
  color: darken($amber, 10%);
  padding: 4px 6px;
  background: rgba($amber, 0.1);
  border-radius: 4px;
}

.fda-dosage-info {
  font-size: 12px;
  color: $slate;
  margin-bottom: 8px;

  .dosage-label {
    color: $gray;
  }

  .dosage-value {
    font-weight: 500;
  }
}

.nice-logo, .bnf-logo, .who-logo {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.nice-logo { background: #1e3a5f; color: white; }
.bnf-logo { background: #004080; color: white; }
.who-logo { background: #009EDB; color: white; }

.who-meta-row {
  font-size: 12px;
  color: $slate;
  margin-bottom: 4px;
  .label { font-weight: 600; margin-right: 4px; }
}

.nice-recommendation {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  margin-bottom: 8px;

  .rec-label { color: $gray; }

  .rec-type {
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 11px;

    &.recommended { background: $emerald-light; color: darken($emerald, 10%); }
    &.consider { background: $amber-light; color: darken($amber, 10%); }
    &.do_not_offer { background: $red-light; color: $red; }
    &.caution { background: $amber-light; color: darken($amber, 10%); }
  }

  .line-treatment {
    color: $gray;
    font-size: 11px;
  }
}

.rec-text {
  font-size: 12px;
  color: $slate;
  line-height: 1.4;
  margin: 0 0 8px 0;
}

.guideline-refs {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.guideline-link, .bnf-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: $sky-dark;
  text-decoration: none;
  padding: 4px 8px;
  background: rgba($sky, 0.1);
  border-radius: 4px;
  transition: background 0.2s ease;

  &:hover {
    background: rgba($sky, 0.2);
  }
}

.bnf-class {
  font-size: 12px;
  margin-bottom: 6px;

  .label { color: $gray; }
}

.bnf-indications {
  font-size: 12px;
  margin-bottom: 6px;
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;

  .label { color: $gray; }
  .indication-list { color: $slate; }

  .match-badge {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 1px 4px;
    background: $emerald-light;
    color: darken($emerald, 10%);
    border-radius: 3px;
    font-size: 10px;
    font-weight: 600;
  }
}

.bnf-cautions {
  font-size: 12px;
  margin-bottom: 6px;

  .label { color: $gray; }

  .caution-item {
    display: inline-block;
    margin-left: 4px;
    padding: 2px 6px;
    background: $amber-light;
    color: darken($amber, 10%);
    border-radius: 4px;
    font-size: 10px;
    margin-bottom: 2px;
  }
}

.bnf-interactions {
  font-size: 12px;
  margin-bottom: 8px;

  .label { color: $gray; display: block; margin-bottom: 4px; }

  .interaction-item {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    padding: 4px 6px;
    background: white;
    border-radius: 4px;
    margin-bottom: 4px;
    font-size: 11px;

    .severity {
      padding: 1px 4px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;

      &.severe { background: $red-light; color: $red; }
      &.moderate { background: $amber-light; color: darken($amber, 10%); }
      &.mild { background: #E2E8F0; color: $gray; }
      &.unknown { background: #E2E8F0; color: $gray; }
    }
  }
}

.evidence-counts {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.evidence-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;

  &.high { background: $emerald-light; color: darken($emerald, 10%); }
  &.moderate { background: $amber-light; color: darken($amber, 10%); }
  &.low { background: #E2E8F0; color: $gray; }
}

.citations-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.citation-item {
  display: block;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: $sky;
    transform: translateY(-1px);
  }

  .citation-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .evidence-level {
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;

    &.high { background: $emerald-light; color: darken($emerald, 10%); }
    &.moderate { background: $amber-light; color: darken($amber, 10%); }
    &.low { background: #E2E8F0; color: $gray; }
    &.unknown { background: #E2E8F0; color: $gray; }
  }

  .citation-year {
    font-size: 11px;
    color: $gray;
  }

  .citation-title {
    font-size: 12px;
    font-weight: 500;
    color: $navy;
    line-height: 1.3;
    margin-bottom: 4px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .citation-meta {
    font-size: 11px;
    color: $gray;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
