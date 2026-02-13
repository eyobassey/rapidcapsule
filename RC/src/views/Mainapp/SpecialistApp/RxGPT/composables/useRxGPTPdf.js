/**
 * RxGPT Clinical Analysis PDF Report Generator
 *
 * Generates a comprehensive, print-optimised clinical report from an
 * RxGPT analysis result object.  Opens a new browser tab with the
 * rendered HTML and triggers the native print dialog so the user can
 * save-as-PDF or send directly to a printer.
 */

import { formatCurrency } from '@/utilities/currency';

// ─── Helpers ────────────────────────────────────────────────────────

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(d) {
  if (!d) return '--';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRiskColor(level) {
  const map = {
    low: '#10B981',
    moderate: '#F59E0B',
    high: '#F43F5E',
    critical: '#DC2626',
  };
  return map[level] || '#64748B';
}

function getConfidenceColor(score) {
  if (score >= 80) return '#10B981';
  if (score >= 50) return '#F59E0B';
  return '#F43F5E';
}

function getSeverityColor(severity) {
  const map = {
    critical: '#DC2626',
    high: '#F43F5E',
    warning: '#F59E0B',
    info: '#3B82F6',
    low: '#64748B',
    medium: '#F59E0B',
  };
  return map[severity] || '#64748B';
}

function getSeverityBg(severity) {
  const map = {
    critical: '#FEE2E2',
    high: '#FFE4E6',
    warning: '#FEF3C7',
    info: '#DBEAFE',
    low: '#F1F5F9',
    medium: '#FEF3C7',
  };
  return map[severity] || '#F1F5F9';
}

function formatPriority(p) {
  const map = { primary: 'Primary', alternative: 'Alternative', supplementary: 'Supplementary' };
  return map[p] || p || '--';
}

function getPriorityColor(p) {
  const map = { primary: '#10B981', alternative: '#3B82F6', supplementary: '#8B5CF6' };
  return map[p] || '#64748B';
}

function formatAlertType(type) {
  const types = {
    allergy: 'Allergy',
    interaction: 'Drug Interaction',
    contraindication: 'Contraindication',
    dosage: 'Dosage Issue',
    age: 'Age Concern',
    pregnancy: 'Pregnancy Risk',
  };
  return types[type] || type || '--';
}

function formatEvidenceLevel(level) {
  const labels = {
    very_high: 'Very High',
    high: 'High',
    moderate: 'Moderate',
    low: 'Low',
    very_low: 'Very Low',
  };
  return labels[level] || level || '--';
}

function formatComplianceLevel(level) {
  const labels = {
    full: 'Fully Compliant',
    partial: 'Partially Compliant',
    none: 'Non-Compliant',
    unknown: 'Unknown',
  };
  return labels[level] || level || '--';
}

function formatLineOfTreatment(line) {
  const labels = {
    first_line: '1st Line',
    second_line: '2nd Line',
    third_line: '3rd Line',
    adjunct: 'Adjunct',
  };
  return labels[line] || line || '';
}

function formatRecommendationType(type) {
  const labels = {
    recommended: 'Recommended',
    consider: 'Consider',
    do_not_offer: 'Do Not Offer',
    caution: 'Use with Caution',
  };
  return labels[type] || type || '';
}

function formatSourceName(source) {
  const names = {
    local_inventory: 'Inventory',
    openfda: 'FDA',
    pubmed: 'PubMed',
    nice: 'NICE',
    bnf: 'BNF',
    fda_approved: 'FDA Approved',
    nice_recommended: 'NICE Recommended',
    pubmed_high_quality: 'PubMed (High Quality)',
  };
  return names[source] || source || '';
}

function formatHallucinationStatus(status) {
  const labels = {
    safe: 'Verified Safe',
    review_required: 'Review Needed',
    reject: 'Flagged',
  };
  return labels[status] || status || '--';
}

function formatPrice(price, currencyCode) {
  if (!price && price !== 0) return '--';
  return formatCurrency(price, currencyCode);
}

// ─── CSS ────────────────────────────────────────────────────────────

function getStyles() {
  return `
    /* ── Reset & Base ─────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      color: #1E293B;
      background: #fff;
      line-height: 1.6;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page wrapper ──────────────────────────────────────────── */
    .report {
      max-width: 800px;
      margin: 0 auto;
      padding: 32px 40px;
    }

    /* ── Header ────────────────────────────────────────────────── */
    .report-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 3px solid #0288D1;
      margin-bottom: 8px;
    }

    .report-header__logo img {
      height: 40px;
      width: auto;
    }

    .report-header__title-block {
      text-align: right;
    }

    .report-header__title {
      font-size: 20px;
      font-weight: 800;
      color: #01579B;
      letter-spacing: -0.3px;
    }

    .report-header__subtitle {
      font-size: 11px;
      color: #64748B;
      margin-top: 2px;
    }

    /* ── Meta row ──────────────────────────────────────────────── */
    .meta-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0 18px;
      border-bottom: 1px solid #E2E8F0;
      margin-bottom: 22px;
      font-size: 11px;
      color: #64748B;
    }

    .meta-row span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .meta-row strong {
      color: #334155;
    }

    /* ── Section ───────────────────────────────────────────────── */
    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #01579B;
      padding-bottom: 6px;
      margin-bottom: 12px;
      border-bottom: 2px solid #E1F5FE;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── Patient Info ──────────────────────────────────────────── */
    .patient-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px 16px;
      margin-bottom: 10px;
    }

    .patient-field {
      padding: 6px 0;
    }

    .patient-field__label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #94A3B8;
      margin-bottom: 2px;
    }

    .patient-field__value {
      font-size: 12px;
      font-weight: 600;
      color: #1E293B;
    }

    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-top: 4px;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
    }

    .badge--danger {
      background: #FEE2E2;
      color: #DC2626;
    }

    .badge--amber {
      background: #FEF3C7;
      color: #92400E;
    }

    .badge--blue {
      background: #DBEAFE;
      color: #1E40AF;
    }

    .badge--green {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge--purple {
      background: #EDE9FE;
      color: #5B21B6;
    }

    .badge--gray {
      background: #F1F5F9;
      color: #475569;
    }

    /* ── Overall Assessment ────────────────────────────────────── */
    .assessment-card {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 18px 24px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      margin-bottom: 8px;
    }

    .score-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 4px solid;
    }

    .score-circle__number {
      font-size: 28px;
      font-weight: 800;
      line-height: 1;
    }

    .score-circle__label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      opacity: 0.7;
    }

    .assessment-details {
      flex: 1;
    }

    .assessment-details__title {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 6px;
    }

    .assessment-meta {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .assessment-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }

    .confidence-bar-container {
      margin-top: 8px;
    }

    .confidence-bar {
      height: 6px;
      background: #E2E8F0;
      border-radius: 3px;
      overflow: hidden;
    }

    .confidence-bar__fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    /* ── Evidence Summary ──────────────────────────────────────── */
    .evidence-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .evidence-item {
      padding: 10px 14px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      border-left: 3px solid;
    }

    .evidence-item__title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #64748B;
      margin-bottom: 4px;
    }

    .evidence-item__value {
      font-size: 16px;
      font-weight: 800;
      color: #0F172A;
    }

    .evidence-item__detail {
      font-size: 10px;
      color: #64748B;
      margin-top: 2px;
    }

    /* ── Medication Cards ──────────────────────────────────────── */
    .med-card {
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      margin-bottom: 14px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .med-card__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #E2E8F0;
      background: #F8FAFC;
    }

    .med-card__name-block {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .med-card__drug-name {
      font-size: 14px;
      font-weight: 700;
      color: #0F172A;
    }

    .med-card__generic {
      font-size: 11px;
      color: #64748B;
    }

    .priority-tag {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #fff;
    }

    .med-card__body {
      padding: 14px 16px;
    }

    .med-detail-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 12px;
    }

    .med-detail-cell {
      padding: 8px 10px;
      background: #F8FAFC;
      border: 1px solid #F1F5F9;
      border-radius: 6px;
    }

    .med-detail-cell__label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94A3B8;
      margin-bottom: 2px;
    }

    .med-detail-cell__value {
      font-size: 11px;
      font-weight: 600;
      color: #1E293B;
    }

    .med-reasoning {
      padding: 10px 14px;
      background: #F5F3FF;
      border-left: 3px solid #8B5CF6;
      border-radius: 0 6px 6px 0;
      font-size: 11px;
      color: #334155;
      line-height: 1.55;
      margin-bottom: 10px;
    }

    .med-instructions {
      padding: 10px 14px;
      background: #EFF6FF;
      border-left: 3px solid #3B82F6;
      border-radius: 0 6px 6px 0;
      font-size: 11px;
      color: #334155;
      line-height: 1.55;
      margin-bottom: 10px;
    }

    .med-confidence-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .med-confidence-row__label {
      font-size: 10px;
      color: #64748B;
      font-weight: 600;
      white-space: nowrap;
    }

    .med-confidence-bar {
      flex: 1;
      height: 6px;
      background: #E2E8F0;
      border-radius: 3px;
      overflow: hidden;
    }

    .med-confidence-bar__fill {
      height: 100%;
      border-radius: 3px;
    }

    .med-confidence-row__pct {
      font-size: 12px;
      font-weight: 700;
      min-width: 36px;
      text-align: right;
    }

    /* ── Med Safety Alerts ─────────────────────────────────────── */
    .med-alert {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 6px;
      font-size: 11px;
      line-height: 1.4;
    }

    .med-alert__indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
    }

    .med-alert__text {
      flex: 1;
    }

    .med-alert__type {
      font-weight: 700;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.3px;
      display: block;
      margin-bottom: 1px;
    }

    .med-alert__msg {
      color: #334155;
    }

    .med-alert__severity {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 1px 6px;
      border-radius: 3px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ── Verification sub-tables ───────────────────────────────── */
    .verification-section {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #E2E8F0;
    }

    .verification-section__title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: #64748B;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .verification-badge {
      display: inline-block;
      padding: 1px 7px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .verification-text {
      font-size: 11px;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 4px;
    }

    .verification-list {
      list-style: none;
      margin: 4px 0;
    }

    .verification-list li {
      font-size: 10px;
      color: #64748B;
      padding: 2px 0;
      padding-left: 12px;
      position: relative;
    }

    .verification-list li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 7px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #CBD5E1;
    }

    .adjustments-table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0;
      font-size: 10px;
    }

    .adjustments-table th {
      background: #F1F5F9;
      padding: 4px 8px;
      text-align: left;
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-size: 9px;
      border-bottom: 1px solid #E2E8F0;
    }

    .adjustments-table td {
      padding: 4px 8px;
      border-bottom: 1px solid #F1F5F9;
      color: #334155;
    }

    .adjustments-table tr:nth-child(even) td {
      background: #FAFBFC;
    }

    .adj-positive { color: #10B981; font-weight: 700; }
    .adj-negative { color: #F43F5E; font-weight: 700; }

    .fda-range-row {
      font-size: 10px;
      color: #475569;
      margin-bottom: 3px;
    }

    .fda-range-row strong {
      color: #1E293B;
    }

    .interaction-row {
      font-size: 10px;
      padding: 3px 8px;
      background: #FFF;
      border: 1px solid #F1F5F9;
      border-radius: 4px;
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .interaction-severity-tag {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 1px 5px;
      border-radius: 3px;
      white-space: nowrap;
    }

    .citation-item {
      padding: 5px 10px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 5px;
      margin-bottom: 4px;
      font-size: 10px;
    }

    .citation-item__title {
      font-weight: 600;
      color: #1E293B;
      margin-bottom: 1px;
    }

    .citation-item__meta {
      color: #64748B;
      font-size: 9px;
    }

    /* ── Safety Alerts Section ──────────────────────────────────── */
    .safety-group {
      margin-bottom: 14px;
    }

    .safety-group__header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .safety-alert-card {
      padding: 10px 14px;
      border-left: 3px solid;
      border-radius: 0 6px 6px 0;
      margin-bottom: 6px;
      background: #FFF;
      border-top: 1px solid #F1F5F9;
      border-right: 1px solid #F1F5F9;
      border-bottom: 1px solid #F1F5F9;
    }

    .safety-alert-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .safety-alert-card__type {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #64748B;
    }

    .safety-alert-card__drug {
      font-size: 11px;
      font-weight: 600;
      color: #0F172A;
      background: #F1F5F9;
      padding: 1px 8px;
      border-radius: 4px;
    }

    .safety-alert-card__message {
      font-size: 12px;
      color: #1E293B;
      line-height: 1.5;
      margin-bottom: 4px;
    }

    .safety-alert-card__action {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 0;
    }

    /* ── Clinical Summary ──────────────────────────────────────── */
    .clinical-text {
      padding: 14px 18px;
      background: #F8FAFC;
      border-left: 4px solid #0288D1;
      border-radius: 0 8px 8px 0;
      font-size: 12px;
      color: #334155;
      line-height: 1.7;
    }

    .considerations-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 10px;
    }

    .consideration-item {
      padding: 8px 12px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
    }

    .consideration-item__label {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94A3B8;
      margin-bottom: 3px;
    }

    /* ── Contraindication warnings ─────────────────────────────── */
    .contra-warning {
      padding: 6px 10px;
      background: #FEF3C7;
      border: 1px solid #FDE68A;
      border-radius: 5px;
      font-size: 10px;
      color: #92400E;
      margin-bottom: 6px;
      line-height: 1.4;
    }

    /* ── Footer ────────────────────────────────────────────────── */
    .report-footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 2px solid #0288D1;
      text-align: center;
    }

    .report-footer__brand {
      font-size: 11px;
      font-weight: 600;
      color: #01579B;
      margin-bottom: 8px;
    }

    .report-footer__disclaimer {
      font-size: 9px;
      color: #94A3B8;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
      padding: 10px 16px;
      background: #F8FAFC;
      border-radius: 6px;
      border: 1px solid #E2E8F0;
    }

    .report-footer__date {
      font-size: 9px;
      color: #CBD5E1;
      margin-top: 8px;
    }

    /* ── Hallucination Alert ────────────────────────────────────── */
    .hallucination-alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 14px;
    }

    .hallucination-alert__title {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .hallucination-alert__text {
      font-size: 11px;
      line-height: 1.5;
      margin-bottom: 6px;
    }

    .flagged-drug-row {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
      margin-bottom: 3px;
    }

    .flagged-drug-row__name {
      font-size: 10px;
      font-weight: 700;
      background: rgba(255,255,255,0.6);
      padding: 1px 8px;
      border-radius: 4px;
    }

    .flagged-drug-row__issue {
      font-size: 9px;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    /* ── No alerts message ─────────────────────────────────────── */
    .no-alerts-box {
      text-align: center;
      padding: 18px;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      border-radius: 8px;
      color: #065F46;
      font-size: 12px;
      font-weight: 600;
    }

    /* ── Print Rules ───────────────────────────────────────────── */
    @media print {
      body { margin: 0; padding: 0; }
      .report { padding: 20px 24px; max-width: none; }
      .section { page-break-inside: avoid; }
      .med-card { page-break-inside: avoid; }
      @page { margin: 12mm 10mm; }
    }
  `;
}

// ─── HTML Builder ───────────────────────────────────────────────────

function buildReportHTML(result) {
  const parts = [];

  // ── Header ──────────────────────────────────────────────────────
  parts.push(`
    <div class="report">
      <div class="report-header">
        <div class="report-header__logo">
          <img src="/RapidCapsule_Logo.png" alt="RapidCapsule" onerror="this.style.display='none'" />
        </div>
        <div class="report-header__title-block">
          <div class="report-header__title">RxGPT Clinical Analysis Report</div>
          <div class="report-header__subtitle">AI-Powered Prescription Decision Support</div>
        </div>
      </div>
  `);

  // ── Meta Row ────────────────────────────────────────────────────
  const analysisId = result._id ? String(result._id).slice(-8).toUpperCase() : '--';
  const generatedDate = formatDate(result.generated_at || result.createdAt || result.created_at);
  const creditsUsed = result.credits_used || '--';

  parts.push(`
    <div class="meta-row">
      <span><strong>Generated:</strong> ${escapeHtml(generatedDate)}</span>
      <span><strong>Analysis ID:</strong> ${escapeHtml(analysisId)}</span>
      <span><strong>Credits Used:</strong> ${escapeHtml(String(creditsUsed))}</span>
    </div>
  `);

  // ── Patient / Subject Info ──────────────────────────────────────
  const ctx = result.clinical_context || result.standalone_context || {};
  const pc = result.patient_considerations || {};
  const hasSubjectInfo = ctx.subject_name || ctx.diagnosis || ctx.treatment_goal ||
    pc.age || pc.gender || pc.weight || pc.allergies?.length || pc.chronic_conditions?.length;

  if (hasSubjectInfo) {
    parts.push(`<div class="section">`);
    parts.push(`<div class="section-title">Patient / Subject Information</div>`);
    parts.push(`<div class="patient-grid">`);

    if (ctx.subject_name) {
      parts.push(`
        <div class="patient-field">
          <div class="patient-field__label">Subject Name</div>
          <div class="patient-field__value">${escapeHtml(ctx.subject_name)}</div>
        </div>
      `);
    }

    if (ctx.diagnosis) {
      parts.push(`
        <div class="patient-field">
          <div class="patient-field__label">Diagnosis</div>
          <div class="patient-field__value">${escapeHtml(ctx.diagnosis)}</div>
        </div>
      `);
    }

    if (ctx.treatment_goal) {
      parts.push(`
        <div class="patient-field">
          <div class="patient-field__label">Treatment Goal</div>
          <div class="patient-field__value">${escapeHtml(ctx.treatment_goal)}</div>
        </div>
      `);
    }

    if (pc.age) {
      parts.push(`
        <div class="patient-field">
          <div class="patient-field__label">Age</div>
          <div class="patient-field__value">${escapeHtml(String(pc.age))} years</div>
        </div>
      `);
    }

    if (pc.gender) {
      parts.push(`
        <div class="patient-field">
          <div class="patient-field__label">Gender</div>
          <div class="patient-field__value">${escapeHtml(pc.gender)}</div>
        </div>
      `);
    }

    if (pc.weight) {
      parts.push(`
        <div class="patient-field">
          <div class="patient-field__label">Weight</div>
          <div class="patient-field__value">${escapeHtml(String(pc.weight))} kg</div>
        </div>
      `);
    }

    parts.push(`</div>`); // close patient-grid

    // Allergies
    if (pc.allergies?.length) {
      parts.push(`
        <div style="margin-top: 6px;">
          <span style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#94A3B8;">Allergies</span>
          <div class="badge-row">
            ${pc.allergies.map(a => `<span class="badge badge--danger">${escapeHtml(a)}</span>`).join('')}
          </div>
        </div>
      `);
    }

    // Current Medications
    if (pc.current_medications?.length) {
      parts.push(`
        <div style="margin-top: 6px;">
          <span style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#94A3B8;">Current Medications</span>
          <div class="badge-row">
            ${pc.current_medications.map(m => `<span class="badge badge--blue">${escapeHtml(m)}</span>`).join('')}
          </div>
        </div>
      `);
    }

    // Chronic Conditions
    if (pc.chronic_conditions?.length) {
      parts.push(`
        <div style="margin-top: 6px;">
          <span style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#94A3B8;">Chronic Conditions</span>
          <div class="badge-row">
            ${pc.chronic_conditions.map(c => `<span class="badge badge--amber">${escapeHtml(c)}</span>`).join('')}
          </div>
        </div>
      `);
    }

    // Standalone context extra fields
    if (ctx.patient_age) {
      parts.push(`
        <div style="margin-top: 4px; font-size: 11px; color: #475569;">
          <strong>Patient Age:</strong> ${escapeHtml(String(ctx.patient_age))}
          ${ctx.patient_gender ? ` &bull; <strong>Gender:</strong> ${escapeHtml(ctx.patient_gender)}` : ''}
          ${ctx.patient_weight ? ` &bull; <strong>Weight:</strong> ${escapeHtml(String(ctx.patient_weight))} kg` : ''}
        </div>
      `);
    }

    if (ctx.symptoms) {
      parts.push(`
        <div style="margin-top: 4px; font-size: 11px; color: #475569;">
          <strong>Symptoms:</strong> ${escapeHtml(ctx.symptoms)}
        </div>
      `);
    }

    if (ctx.additional_notes) {
      parts.push(`
        <div style="margin-top: 4px; font-size: 11px; color: #475569;">
          <strong>Additional Notes:</strong> ${escapeHtml(ctx.additional_notes)}
        </div>
      `);
    }

    parts.push(`</div>`); // close section
  }

  // ── Overall Assessment ──────────────────────────────────────────
  if (result.confidence_score !== undefined && result.confidence_score !== null) {
    const score = Math.round(result.confidence_score);
    const color = getConfidenceColor(score);
    const riskLevel = result.risk_level || result.overall_risk_level || '';
    const riskColor = getRiskColor(riskLevel);
    const safeStatus = score >= 80 ? 'Safe' : score >= 50 ? 'Requires Review' : 'High Risk';
    const safeColor = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#F43F5E';
    const safeBg = score >= 80 ? '#D1FAE5' : score >= 50 ? '#FEF3C7' : '#FFE4E6';

    parts.push(`
      <div class="section">
        <div class="section-title">Overall Assessment</div>
        <div class="assessment-card">
          <div class="score-circle" style="border-color: ${color}; background: ${color}10;">
            <div class="score-circle__number" style="color: ${color};">${score}</div>
            <div class="score-circle__label" style="color: ${color};">SCORE</div>
          </div>
          <div class="assessment-details">
            <div class="assessment-details__title">Confidence Score</div>
            <div class="assessment-meta">
              ${riskLevel ? `<span class="assessment-tag" style="background: ${riskColor}15; color: ${riskColor};">${escapeHtml(riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1))} Risk</span>` : ''}
              <span class="assessment-tag" style="background: ${safeBg}; color: ${safeColor};">${safeStatus}</span>
            </div>
            <div class="confidence-bar-container">
              <div class="confidence-bar">
                <div class="confidence-bar__fill" style="width: ${score}%; background: ${color};"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
  }

  // ── Evidence Summary ────────────────────────────────────────────
  const ev = result.evidence_summary;
  const vs = result.verification_summary;
  const dvs = result.dosage_validation_summary;
  const ncs = result.nice_compliance_summary;
  const bcs = result.bnf_compliance_summary;
  const hc = result.hallucination_check;
  const pes = result.pubmed_evidence_summary;

  const hasEvidence = ev || vs || dvs || ncs || bcs || hc || pes;

  if (hasEvidence) {
    parts.push(`<div class="section">`);
    parts.push(`<div class="section-title">Evidence & Verification Summary</div>`);

    // Evidence sources
    if (ev?.evidence_sources_used?.length) {
      parts.push(`
        <div style="margin-bottom: 10px; font-size: 11px; color: #475569;">
          <strong>Evidence Sources:</strong> ${ev.evidence_sources_used.map(s => escapeHtml(formatSourceName(s))).join(', ')}
        </div>
      `);
    }

    parts.push(`<div class="evidence-grid">`);

    // Overall Evidence Score
    if (ev) {
      parts.push(`
        <div class="evidence-item" style="border-left-color: #0288D1;">
          <div class="evidence-item__title">Evidence Score</div>
          <div class="evidence-item__value">${Math.round(ev.overall_evidence_score || 0)}%</div>
          <div class="evidence-item__detail">
            Level: ${escapeHtml(formatEvidenceLevel(ev.overall_evidence_level))}
            ${ev.drugs_with_strong_evidence !== undefined ? ` | ${ev.drugs_with_strong_evidence} strong, ${ev.drugs_with_weak_evidence || 0} weak` : ''}
            ${ev.off_label_count ? ` | ${ev.off_label_count} off-label` : ''}
          </div>
        </div>
      `);
    }

    // FDA Verification
    if (vs) {
      const fdaColor = vs.has_unverified_drugs ? '#F59E0B' : '#10B981';
      parts.push(`
        <div class="evidence-item" style="border-left-color: ${fdaColor};">
          <div class="evidence-item__title">FDA Verification</div>
          <div class="evidence-item__value">${vs.verified_count || 0} / ${vs.total_suggestions || 0}</div>
          <div class="evidence-item__detail">
            verified in trusted databases
            ${vs.fda_approved_count ? ` | ${vs.fda_approved_count} FDA approved` : ''}
            ${vs.has_unverified_drugs ? ` | ${vs.unverified_count || 0} unverified` : ''}
          </div>
        </div>
      `);
    }

    // Dosage Check
    if (dvs) {
      const dosageColor = dvs.danger_count > 0 ? '#F43F5E' : dvs.warning_count > 0 ? '#F59E0B' : '#10B981';
      const dosageLabel = dvs.danger_count > 0 ? 'Danger' : dvs.warning_count > 0 ? 'Warning' : 'Safe';
      parts.push(`
        <div class="evidence-item" style="border-left-color: ${dosageColor};">
          <div class="evidence-item__title">Dosage Validation</div>
          <div class="evidence-item__value" style="color: ${dosageColor};">${dosageLabel}</div>
          <div class="evidence-item__detail">
            ${dvs.safe_count || 0} safe${dvs.warning_count ? `, ${dvs.warning_count} warning(s)` : ''}${dvs.danger_count ? `, ${dvs.danger_count} danger` : ''}
          </div>
        </div>
      `);
    }

    // NICE Compliance
    if (ncs) {
      const niceColor = ncs.has_compliance_issues ? '#F59E0B' : '#10B981';
      parts.push(`
        <div class="evidence-item" style="border-left-color: ${niceColor};">
          <div class="evidence-item__title">NICE UK Guidelines</div>
          <div class="evidence-item__value">${ncs.fully_compliant || 0} / ${ncs.total_drugs_checked || 0}</div>
          <div class="evidence-item__detail">
            fully compliant
            ${ncs.partially_compliant ? ` | ${ncs.partially_compliant} partial` : ''}
            ${ncs.non_compliant ? ` | ${ncs.non_compliant} non-compliant` : ''}
            ${ncs.no_guidance_available ? ` | ${ncs.no_guidance_available} no guidance` : ''}
          </div>
        </div>
      `);
    }

    // BNF Compliance
    if (bcs) {
      const bnfColor = bcs.has_uk_compliance_issues ? '#F59E0B' : '#10B981';
      parts.push(`
        <div class="evidence-item" style="border-left-color: ${bnfColor};">
          <div class="evidence-item__title">BNF UK Prescribing</div>
          <div class="evidence-item__value">${bcs.uk_approved_count || 0} / ${bcs.total_drugs_checked || 0}</div>
          <div class="evidence-item__detail">
            UK approved
            ${bcs.dosage_warnings_count ? ` | ${bcs.dosage_warnings_count} dosage warning(s)` : ''}
            ${bcs.interaction_alerts_count ? ` | ${bcs.interaction_alerts_count} interaction(s)` : ''}
          </div>
        </div>
      `);
    }

    // AI Verification / Hallucination Check
    if (hc) {
      const hcColor = hc.recommendation === 'safe' ? '#10B981' : hc.recommendation === 'review_required' ? '#F59E0B' : '#F43F5E';
      parts.push(`
        <div class="evidence-item" style="border-left-color: ${hcColor};">
          <div class="evidence-item__title">AI Verification</div>
          <div class="evidence-item__value" style="font-size:13px;">
            <span style="display:inline-block;padding:2px 10px;border-radius:10px;background:${hcColor}15;color:${hcColor};font-weight:700;">
              ${escapeHtml(formatHallucinationStatus(hc.recommendation))}
            </span>
          </div>
          <div class="evidence-item__detail">
            ${hc.total_flags || 0} flag(s) detected
            ${hc.suspicion_score ? ` | Suspicion: ${hc.suspicion_score}%` : ''}
            ${hc.critical_count ? ` | ${hc.critical_count} critical` : ''}
            ${hc.high_count ? ` | ${hc.high_count} high` : ''}
          </div>
        </div>
      `);
    }

    // PubMed Evidence
    if (pes) {
      parts.push(`
        <div class="evidence-item" style="border-left-color: #326599;">
          <div class="evidence-item__title">PubMed Evidence</div>
          <div class="evidence-item__value">${pes.total_citations || 0} <span style="font-size:12px;color:#64748B;">citations</span></div>
          <div class="evidence-item__detail">
            ${pes.total_drugs_with_evidence || 0} drug(s) with evidence
            ${pes.high_quality_evidence_count ? ` | ${pes.high_quality_evidence_count} high quality` : ''}
            ${pes.drugs_without_evidence?.length ? ` | No evidence: ${pes.drugs_without_evidence.join(', ')}` : ''}
          </div>
        </div>
      `);
    }

    parts.push(`</div>`); // close evidence-grid

    // Hallucination warning detail
    if (hc && (hc.recommendation === 'reject' || hc.recommendation === 'review_required')) {
      const hcBg = hc.recommendation === 'reject' ? '#FEE2E2' : '#FEF3C7';
      const hcBorder = hc.recommendation === 'reject' ? '#FECACA' : '#FDE68A';
      const hcTextColor = hc.recommendation === 'reject' ? '#991B1B' : '#92400E';

      parts.push(`
        <div class="hallucination-alert" style="background:${hcBg};border:1px solid ${hcBorder};margin-top:10px;">
          <div class="hallucination-alert__title" style="color:${hcTextColor};">
            ${hc.recommendation === 'reject' ? 'AI Output Flagged -- Manual Review Required' : 'AI Output Requires Review'}
          </div>
          ${hc.summary ? `<div class="hallucination-alert__text" style="color:${hcTextColor};">${escapeHtml(hc.summary)}</div>` : ''}
      `);

      if (hc.flagged_drugs?.length) {
        hc.flagged_drugs.forEach(drug => {
          parts.push(`<div class="flagged-drug-row">`);
          parts.push(`<span class="flagged-drug-row__name">${escapeHtml(drug.drug_name)}</span>`);
          if (drug.issues?.length) {
            drug.issues.forEach(issue => {
              const issueColor = getSeverityColor(issue.severity);
              const issueBg = getSeverityBg(issue.severity);
              parts.push(`<span class="flagged-drug-row__issue" style="background:${issueBg};color:${issueColor};">${escapeHtml(issue.reason)}</span>`);
            });
          }
          parts.push(`</div>`);
        });
      }

      parts.push(`</div>`);
    }

    parts.push(`</div>`); // close section
  }

  // ── Medication Recommendations ──────────────────────────────────
  if (result.suggestions?.length) {
    parts.push(`<div class="section">`);
    parts.push(`<div class="section-title">Medication Recommendations (${result.suggestions.length})</div>`);

    result.suggestions.forEach((med, idx) => {
      const priorityColor = getPriorityColor(med.priority);

      parts.push(`<div class="med-card">`);

      // Card Header
      parts.push(`
        <div class="med-card__header">
          <div class="med-card__name-block">
            <span class="med-card__drug-name">${escapeHtml(med.drug_name || '--')}</span>
            ${med.generic_name ? `<span class="med-card__generic">(${escapeHtml(med.generic_name)})</span>` : ''}
          </div>
          <span class="priority-tag" style="background: ${priorityColor};">${formatPriority(med.priority)}</span>
        </div>
      `);

      // Card Body
      parts.push(`<div class="med-card__body">`);

      // Detail grid
      parts.push(`<div class="med-detail-grid">`);

      const details = [
        { label: 'Strength', value: med.strength },
        { label: 'Form', value: med.dosage_form },
        { label: 'Dosage', value: med.suggested_dosage },
        { label: 'Frequency', value: med.suggested_frequency },
        { label: 'Duration', value: med.suggested_duration },
        { label: 'Quantity', value: med.suggested_quantity },
        { label: 'Route', value: med.route },
        { label: 'Price', value: med.unit_price ? `${formatPrice(med.unit_price, med.currency)}/unit` : null },
      ];

      details.forEach(d => {
        if (d.value) {
          parts.push(`
            <div class="med-detail-cell">
              <div class="med-detail-cell__label">${escapeHtml(d.label)}</div>
              <div class="med-detail-cell__value">${escapeHtml(String(d.value))}</div>
            </div>
          `);
        }
      });
      parts.push(`</div>`); // close med-detail-grid

      // Reasoning
      if (med.reasoning) {
        parts.push(`<div class="med-reasoning"><strong>Reasoning:</strong> ${escapeHtml(med.reasoning)}</div>`);
      }

      // Instructions
      if (med.instructions) {
        parts.push(`<div class="med-instructions"><strong>Instructions:</strong> ${escapeHtml(med.instructions)}</div>`);
      }

      // Confidence bar
      if (med.confidence !== undefined && med.confidence !== null) {
        const confColor = getConfidenceColor(med.confidence);
        parts.push(`
          <div class="med-confidence-row">
            <span class="med-confidence-row__label">Confidence</span>
            <div class="med-confidence-bar">
              <div class="med-confidence-bar__fill" style="width: ${med.confidence}%; background: ${confColor};"></div>
            </div>
            <span class="med-confidence-row__pct" style="color: ${confColor};">${med.confidence}%</span>
          </div>
        `);
      }

      // Safety alerts for this medication
      if (med.safety_alerts?.length) {
        med.safety_alerts.forEach(alert => {
          const sevColor = getSeverityColor(alert.severity);
          const sevBg = getSeverityBg(alert.severity);
          parts.push(`
            <div class="med-alert" style="background: ${sevBg};">
              <div class="med-alert__indicator" style="background: ${sevColor};"></div>
              <div class="med-alert__text">
                <span class="med-alert__type" style="color: ${sevColor};">${escapeHtml(formatAlertType(alert.type))}</span>
                <span class="med-alert__msg">${escapeHtml(alert.message)}</span>
              </div>
              <span class="med-alert__severity" style="background: ${sevColor}20; color: ${sevColor};">${escapeHtml(alert.severity || '')}</span>
            </div>
          `);
        });
      }

      // Contraindication warnings
      if (med.contraindication_check?.warnings?.length) {
        med.contraindication_check.warnings.forEach(warn => {
          parts.push(`<div class="contra-warning">${escapeHtml(warn)}</div>`);
        });
      }

      // ── Verification & Evidence Details ─────────────────────────
      const hasVerification = med.verification || med.evidence_confidence ||
        med.dosage_validation || med.nice_compliance || med.bnf_info ||
        med.pubmed_citations?.citations?.length;

      if (hasVerification) {
        parts.push(`<div class="verification-section">`);

        // Evidence Confidence
        if (med.evidence_confidence) {
          const ec = med.evidence_confidence;
          parts.push(`
            <div style="margin-bottom: 10px;">
              <div class="verification-section__title">
                Evidence-Based Confidence
                <span class="verification-badge" style="background: ${getConfidenceColor(ec.final_score || 0)}20; color: ${getConfidenceColor(ec.final_score || 0)};">
                  ${escapeHtml(formatEvidenceLevel(ec.evidence_level))}
                </span>
              </div>
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;">
                <div style="flex:1;height:6px;background:#E2E8F0;border-radius:3px;overflow:hidden;">
                  <div style="height:100%;width:${ec.final_score || 0}%;background:linear-gradient(90deg,#0288D1,#8B5CF6);border-radius:3px;"></div>
                </div>
                <span style="font-size:11px;font-weight:700;color:#0F172A;">${ec.final_score || 0}%</span>
              </div>
              <div style="font-size:10px;color:#64748B;">
                Base Score: ${ec.base_score || 0}%
                ${ec.is_off_label ? ' | <span style="color:#F59E0B;font-weight:600;">Off-label use</span>' : ''}
              </div>
              ${ec.evidence_summary ? `<div class="verification-text">${escapeHtml(ec.evidence_summary)}</div>` : ''}
          `);

          // Adjustments table
          if (ec.adjustments?.length) {
            parts.push(`
              <table class="adjustments-table">
                <thead><tr><th>Source</th><th>Adjustment</th><th>Reason</th></tr></thead>
                <tbody>
            `);
            ec.adjustments.forEach(adj => {
              const adjClass = adj.adjustment >= 0 ? 'adj-positive' : 'adj-negative';
              parts.push(`
                <tr>
                  <td>${escapeHtml(formatSourceName(adj.source))}</td>
                  <td class="${adjClass}">${adj.adjustment >= 0 ? '+' : ''}${adj.adjustment}</td>
                  <td>${escapeHtml(adj.reason || '')}</td>
                </tr>
              `);
            });
            parts.push(`</tbody></table>`);
          }
          parts.push(`</div>`);
        }

        // FDA Verification
        if (med.verification) {
          const v = med.verification;
          const vColor = v.is_verified ? '#10B981' : '#F59E0B';
          const vLabel = v.is_verified ? 'Verified' : 'Unverified';
          parts.push(`
            <div style="margin-bottom: 10px;">
              <div class="verification-section__title">
                FDA Verification
                <span class="verification-badge" style="background: ${vColor}20; color: ${vColor};">${vLabel}</span>
                ${v.fda_approved ? '<span class="verification-badge" style="background:#D1FAE5;color:#065F46;">FDA Approved</span>' : ''}
              </div>
          `);
          if (v.verified_sources?.length) {
            parts.push(`<div style="font-size:10px;color:#64748B;">Sources: ${v.verified_sources.map(s => escapeHtml(formatSourceName(s))).join(', ')}</div>`);
          }
          if (v.verification_warnings?.length) {
            parts.push(`<ul class="verification-list">${v.verification_warnings.map(w => `<li style="color:#D97706;">${escapeHtml(w)}</li>`).join('')}</ul>`);
          }
          parts.push(`</div>`);
        }

        // Dosage Validation
        if (med.dosage_validation) {
          const dv = med.dosage_validation;
          const dvColor = dv.status === 'safe' ? '#10B981' : dv.status === 'danger' ? '#F43F5E' : '#F59E0B';
          const dvLabel = dv.status === 'safe' ? 'Safe' : dv.status === 'danger' ? 'Unsafe' : 'Caution';
          parts.push(`
            <div style="margin-bottom: 10px;">
              <div class="verification-section__title">
                Dosage Validation
                <span class="verification-badge" style="background: ${dvColor}20; color: ${dvColor};">${dvLabel}</span>
              </div>
          `);

          // FDA dosage ranges
          if (dv.fda_dosage_info) {
            const ranges = ['adult', 'pediatric', 'geriatric'];
            ranges.forEach(pop => {
              const info = dv.fda_dosage_info[pop];
              if (info) {
                parts.push(`
                  <div class="fda-range-row">
                    <strong>${pop.charAt(0).toUpperCase() + pop.slice(1)} Range:</strong>
                    ${info.min_dose || '?'} - ${info.max_dose || '?'}
                    ${info.max_daily_dose ? ` (max ${info.max_daily_dose}/day)` : ''}
                    ${info.dose_per_kg ? ` (${info.dose_per_kg}/kg)` : ''}
                  </div>
                `);
              }
            });
          }

          if (dv.validated_for_patient) {
            parts.push(`
              <div style="font-size:10px;color:#64748B;margin-top:3px;">
                Validated for: ${escapeHtml(dv.validated_for_patient.population || '')}
                (age ${dv.validated_for_patient.age || '?'}${dv.validated_for_patient.weight ? `, ${dv.validated_for_patient.weight}kg` : ''})
              </div>
            `);
          }

          if (dv.warnings?.length) {
            parts.push(`<ul class="verification-list">${dv.warnings.map(w => `<li style="color:#D97706;">${escapeHtml(w)}</li>`).join('')}</ul>`);
          }

          parts.push(`</div>`);
        }

        // NICE Compliance
        if (med.nice_compliance) {
          const nc = med.nice_compliance;
          const ncColor = nc.compliance_level === 'full' ? '#10B981' : nc.compliance_level === 'partial' ? '#F59E0B' : nc.compliance_level === 'none' ? '#F43F5E' : '#64748B';
          parts.push(`
            <div style="margin-bottom: 10px;">
              <div class="verification-section__title">
                NICE UK Guidelines
                <span class="verification-badge" style="background: ${ncColor}20; color: ${ncColor};">${escapeHtml(formatComplianceLevel(nc.compliance_level))}</span>
              </div>
          `);

          if (nc.recommendation_type || nc.line_of_treatment) {
            parts.push(`<div style="font-size:10px;color:#475569;margin-bottom:3px;">`);
            if (nc.recommendation_type) {
              parts.push(`Recommendation: <strong>${escapeHtml(formatRecommendationType(nc.recommendation_type))}</strong>`);
            }
            if (nc.line_of_treatment) {
              parts.push(` | ${escapeHtml(formatLineOfTreatment(nc.line_of_treatment))}`);
            }
            parts.push(`</div>`);
          }

          if (nc.recommendation_text) {
            parts.push(`<div class="verification-text">${escapeHtml(nc.recommendation_text)}</div>`);
          }

          if (nc.guideline_references?.length) {
            parts.push(`<ul class="verification-list">`);
            nc.guideline_references.forEach(ref => {
              parts.push(`<li>${escapeHtml(ref.title || '')}${ref.url ? ` (${escapeHtml(ref.url)})` : ''}</li>`);
            });
            parts.push(`</ul>`);
          }

          if (nc.warnings?.length) {
            parts.push(`<ul class="verification-list">${nc.warnings.map(w => `<li style="color:#D97706;">${escapeHtml(w)}</li>`).join('')}</ul>`);
          }

          parts.push(`</div>`);
        }

        // BNF Information
        if (med.bnf_info) {
          const bi = med.bnf_info;
          const biColor = bi.uk_approved ? '#10B981' : '#F59E0B';
          parts.push(`
            <div style="margin-bottom: 10px;">
              <div class="verification-section__title">
                BNF UK Prescribing
                <span class="verification-badge" style="background: ${biColor}20; color: ${biColor};">
                  ${bi.uk_approved ? 'UK Approved' : 'Not UK Approved'}
                </span>
              </div>
          `);

          if (bi.drug_class) {
            parts.push(`<div style="font-size:10px;color:#475569;">Class: <strong>${escapeHtml(bi.drug_class)}</strong></div>`);
          }

          if (bi.indications?.length) {
            parts.push(`<div style="font-size:10px;color:#475569;">Indications: ${bi.indications.map(i => escapeHtml(i)).join(', ')}${bi.indication_match ? ' <span style="color:#10B981;font-weight:600;">(Match)</span>' : ''}</div>`);
          }

          if (bi.cautions?.length) {
            parts.push(`
              <div style="margin-top:3px;">
                <span style="font-size:9px;color:#94A3B8;font-weight:600;">Cautions:</span>
                <div class="badge-row">${bi.cautions.slice(0, 6).map(c => `<span class="badge badge--amber">${escapeHtml(c)}</span>`).join('')}</div>
              </div>
            `);
          }

          if (bi.interactions?.length) {
            parts.push(`<div style="margin-top:4px;"><span style="font-size:9px;color:#94A3B8;font-weight:600;">Interactions:</span></div>`);
            bi.interactions.slice(0, 4).forEach(inter => {
              const interColor = inter.severity === 'severe' ? '#DC2626' : inter.severity === 'moderate' ? '#D97706' : '#64748B';
              const interBg = inter.severity === 'severe' ? '#FEE2E2' : inter.severity === 'moderate' ? '#FEF3C7' : '#F1F5F9';
              parts.push(`
                <div class="interaction-row">
                  <span class="interaction-severity-tag" style="background:${interBg};color:${interColor};">${escapeHtml(inter.severity || '')}</span>
                  <span>${escapeHtml(inter.drug || '')}: ${escapeHtml(inter.effect || '')}</span>
                </div>
              `);
            });
          }

          if (bi.bnf_url) {
            parts.push(`<div style="font-size:10px;margin-top:3px;color:#0288D1;">BNF Reference: ${escapeHtml(bi.bnf_url)}</div>`);
          }

          parts.push(`</div>`);
        }

        // PubMed Citations
        if (med.pubmed_citations?.citations?.length) {
          const pc = med.pubmed_citations;
          parts.push(`
            <div style="margin-bottom: 10px;">
              <div class="verification-section__title">
                Clinical Evidence (${pc.total_found || pc.citations.length} articles)
              </div>
          `);

          if (pc.evidence_summary) {
            parts.push(`
              <div style="display:flex;gap:6px;margin-bottom:6px;">
                <span class="badge badge--green">${pc.evidence_summary.high_quality_count || 0} high</span>
                <span class="badge badge--amber">${pc.evidence_summary.moderate_quality_count || 0} moderate</span>
                <span class="badge badge--gray">${pc.evidence_summary.low_quality_count || 0} low</span>
              </div>
            `);
          }

          pc.citations.slice(0, 5).forEach(cit => {
            parts.push(`
              <div class="citation-item">
                <div class="citation-item__title">
                  <span class="badge badge--${cit.evidence_level === 'high' ? 'green' : cit.evidence_level === 'moderate' ? 'amber' : 'gray'}" style="font-size:8px;margin-right:4px;">
                    ${escapeHtml(cit.evidence_level || '')}
                  </span>
                  ${escapeHtml(cit.title || '')}
                </div>
                <div class="citation-item__meta">${escapeHtml(cit.authors_short || '')} - ${escapeHtml(cit.journal || '')} (${cit.year || ''})</div>
              </div>
            `);
          });

          parts.push(`</div>`);
        }

        parts.push(`</div>`); // close verification-section
      }

      parts.push(`</div>`); // close med-card__body
      parts.push(`</div>`); // close med-card
    });

    parts.push(`</div>`); // close section
  }

  // ── Safety Alerts (Aggregated) ──────────────────────────────────
  const allAlerts = result.alerts || [];
  if (allAlerts.length) {
    parts.push(`<div class="section">`);
    parts.push(`<div class="section-title">Safety Alerts (${allAlerts.length})</div>`);

    const severityOrder = ['critical', 'warning', 'info'];
    const severityLabels = { critical: 'Critical Alerts', warning: 'Warnings', info: 'Information' };

    severityOrder.forEach(sev => {
      const filtered = allAlerts.filter(a => a.severity === sev);
      if (!filtered.length) return;

      const sevColor = getSeverityColor(sev);
      const sevBg = getSeverityBg(sev);

      parts.push(`
        <div class="safety-group">
          <div class="safety-group__header" style="background: ${sevBg}; color: ${sevColor};">
            ${severityLabels[sev]} (${filtered.length})
          </div>
      `);

      filtered.forEach(alert => {
        parts.push(`
          <div class="safety-alert-card" style="border-left-color: ${sevColor};">
            <div class="safety-alert-card__header">
              <div class="safety-alert-card__type">${escapeHtml(formatAlertType(alert.type))}</div>
              <span class="safety-alert-card__drug">${escapeHtml(alert.drug_name || '')}</span>
            </div>
            <div class="safety-alert-card__message">${escapeHtml(alert.message || '')}</div>
            ${alert.reasoning ? `<div style="font-size:11px;color:#64748B;padding:4px 0;line-height:1.5;">${escapeHtml(alert.reasoning)}</div>` : ''}
            ${alert.action_required ? `<div class="safety-alert-card__action" style="color: ${sevColor};">${escapeHtml(alert.action_required)}</div>` : ''}
          </div>
        `);
      });

      parts.push(`</div>`); // close safety-group
    });

    parts.push(`</div>`); // close section
  } else {
    // No alerts
    parts.push(`
      <div class="section">
        <div class="section-title">Safety Alerts</div>
        <div class="no-alerts-box">No safety alerts detected. The analysis did not identify any drug interactions, allergies, or contraindications.</div>
      </div>
    `);
  }

  // ── Clinical Summary ────────────────────────────────────────────
  if (result.clinical_summary || result.patient_considerations) {
    parts.push(`<div class="section">`);
    parts.push(`<div class="section-title">Clinical Summary</div>`);

    if (result.clinical_summary) {
      parts.push(`<div class="clinical-text">${escapeHtml(result.clinical_summary)}</div>`);
    }

    // Patient considerations
    if (result.patient_considerations) {
      const pc = result.patient_considerations;
      const hasConsiderations = pc.age || pc.gender || pc.allergies?.length || pc.current_medications?.length || pc.chronic_conditions?.length;

      if (hasConsiderations) {
        parts.push(`<div style="margin-top:12px;"><div style="font-size:12px;font-weight:700;color:#01579B;margin-bottom:8px;">Patient Considerations</div>`);
        parts.push(`<div class="considerations-grid">`);

        if (pc.age) {
          parts.push(`
            <div class="consideration-item">
              <div class="consideration-item__label">Age</div>
              <div>${escapeHtml(String(pc.age))} years</div>
            </div>
          `);
        }
        if (pc.gender) {
          parts.push(`
            <div class="consideration-item">
              <div class="consideration-item__label">Gender</div>
              <div>${escapeHtml(pc.gender)}</div>
            </div>
          `);
        }
        if (pc.allergies?.length) {
          parts.push(`
            <div class="consideration-item">
              <div class="consideration-item__label">Allergies</div>
              <div class="badge-row">${pc.allergies.map(a => `<span class="badge badge--danger">${escapeHtml(a)}</span>`).join('')}</div>
            </div>
          `);
        }
        if (pc.current_medications?.length) {
          parts.push(`
            <div class="consideration-item">
              <div class="consideration-item__label">Current Medications</div>
              <div class="badge-row">${pc.current_medications.map(m => `<span class="badge badge--blue">${escapeHtml(m)}</span>`).join('')}</div>
            </div>
          `);
        }
        if (pc.chronic_conditions?.length) {
          parts.push(`
            <div class="consideration-item">
              <div class="consideration-item__label">Chronic Conditions</div>
              <div class="badge-row">${pc.chronic_conditions.map(c => `<span class="badge badge--amber">${escapeHtml(c)}</span>`).join('')}</div>
            </div>
          `);
        }

        parts.push(`</div></div>`); // close grid and wrapper
      }
    }

    parts.push(`</div>`); // close section
  }

  // ── Disclaimer ──────────────────────────────────────────────────
  if (result.disclaimer) {
    parts.push(`
      <div class="section" style="margin-bottom: 16px;">
        <div style="padding:10px 14px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:6px;font-size:11px;color:#64748B;line-height:1.5;">
          ${escapeHtml(result.disclaimer)}
        </div>
      </div>
    `);
  }

  // ── Footer ──────────────────────────────────────────────────────
  parts.push(`
    <div class="report-footer">
      <div class="report-footer__brand">Generated by RxGPT AI &mdash; RapidCapsule Healthcare Platform</div>
      <div class="report-footer__disclaimer">
        This report is generated by AI and should be used as a clinical decision support tool only.
        Always exercise independent clinical judgment. Do not rely solely on this report for prescribing
        decisions. All medication recommendations must be reviewed and approved by a qualified healthcare
        professional before administration to patients.
      </div>
      <div class="report-footer__date">Report generated on ${escapeHtml(new Date().toLocaleString('en-GB'))}</div>
    </div>
  `);

  parts.push(`</div>`); // close .report

  return parts.join('');
}

// ─── Public API ─────────────────────────────────────────────────────

export function generateAnalysisPDF(result) {
  if (!result) {
    console.error('[useRxGPTPdf] No result object provided');
    return;
  }

  try {
    const html = buildReportHTML(result);
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Unable to open print window. Please allow pop-ups for this site.');
      return;
    }

    printWindow.document.write(
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>RxGPT Clinical Analysis Report</title><style>${getStyles()}</style></head><body>${html}</body></html>`
    );
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  } catch (error) {
    console.error('[useRxGPTPdf] Error generating PDF:', error);
    alert('Unable to generate PDF report. Please try again.');
  }
}
