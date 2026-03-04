<template>
  <div class="screening-report">
    <div class="screening-report__inner">
      <!-- Header -->
      <div class="screening-report__header">
        <div class="screening-report__header-top">
          <h2 class="screening-report__title">{{ data.instrument_name || data.instrument }}</h2>
          <span v-if="data.is_baseline" class="screening-report__baseline-badge">Baseline</span>
        </div>
        <span v-if="data.instrument" class="screening-report__instrument-code">{{ data.instrument }}</span>
      </div>

      <!-- Score gauge bar -->
      <div v-if="data.risk_zones && data.risk_zones.length" class="screening-report__gauge">
        <h4 class="screening-report__section-heading">Score</h4>
        <div class="screening-report__gauge-bar">
          <div
            v-for="(zone, idx) in data.risk_zones"
            :key="idx"
            class="screening-report__gauge-zone"
            :style="{
              width: zoneWidth(zone) + '%',
              background: zone.colour || zoneDefaultColor(zone.level),
            }"
            :title="zone.label + ' (' + zone.min_score + '-' + zone.max_score + ')'"
          >
            <span class="screening-report__gauge-zone-label">{{ zone.label }}</span>
          </div>
          <div
            class="screening-report__gauge-marker"
            :style="{ left: markerPosition + '%' }"
          >
            <span class="screening-report__gauge-marker-value">{{ data.total_score }}</span>
          </div>
        </div>
        <div class="screening-report__gauge-range">
          <span>0</span>
          <span>{{ data.max_score }}</span>
        </div>
      </div>

      <!-- Score without gauge (fallback if no risk_zones) -->
      <div v-else class="screening-report__score-simple">
        <span class="screening-report__score-value">{{ data.total_score }}</span>
        <span class="screening-report__score-max"> / {{ data.max_score }}</span>
      </div>

      <!-- Risk level badge -->
      <div class="screening-report__risk-display">
        <span
          class="screening-report__risk-badge"
          :style="{ background: data.colour || riskDefaultColor }"
        >
          {{ data.risk_zone_label || data.risk_level }}
        </span>
        <p v-if="data.recommendation" class="screening-report__recommendation">
          {{ data.recommendation }}
        </p>
      </div>

      <!-- Subscale breakdown -->
      <div v-if="hasSubscales" class="screening-report__subscales">
        <h4 class="screening-report__section-heading">Subscale Scores</h4>
        <div
          v-for="(value, key) in data.subscale_scores"
          :key="key"
          class="screening-report__subscale-item"
        >
          <div class="screening-report__subscale-header">
            <span class="screening-report__subscale-name">{{ formatSubscaleName(key) }}</span>
            <span class="screening-report__subscale-value">{{ value }}</span>
          </div>
          <div class="screening-report__subscale-bar">
            <div
              class="screening-report__subscale-fill"
              :style="{ width: subscalePercent(value) + '%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- AI Interpretation -->
      <div v-if="data.ai_interpretation" class="screening-report__ai">
        <h4 class="screening-report__section-heading">AI Interpretation</h4>

        <div v-if="data.ai_interpretation.summary" class="screening-report__ai-block">
          <h5>Summary</h5>
          <p>{{ data.ai_interpretation.summary }}</p>
        </div>

        <div v-if="data.ai_interpretation.risk_assessment" class="screening-report__ai-block">
          <h5>Risk Assessment</h5>
          <p>{{ data.ai_interpretation.risk_assessment }}</p>
        </div>

        <div v-if="data.ai_interpretation.recommended_interventions && data.ai_interpretation.recommended_interventions.length" class="screening-report__ai-block">
          <h5>Recommended Interventions</h5>
          <ul class="screening-report__ai-list">
            <li v-for="(item, idx) in data.ai_interpretation.recommended_interventions" :key="idx">
              {{ item }}
            </li>
          </ul>
        </div>

        <div v-if="data.ai_interpretation.motivational_message" class="screening-report__ai-callout">
          <svg class="screening-report__ai-callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <p>{{ data.ai_interpretation.motivational_message }}</p>
        </div>

        <div v-if="data.ai_interpretation.comparison_to_previous" class="screening-report__ai-block">
          <h5>Comparison to Previous</h5>
          <p>{{ data.ai_interpretation.comparison_to_previous }}</p>
        </div>
      </div>

      <!-- Previous comparison -->
      <div v-if="data.previous_score != null" class="screening-report__comparison">
        <h4 class="screening-report__section-heading">Score Change</h4>
        <div class="screening-report__comparison-card">
          <span class="screening-report__comparison-prev">Previous: {{ data.previous_score }}</span>
          <span class="screening-report__comparison-arrow" :class="deltaClass">
            <svg v-if="scoreDelta > 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="screening-report__comparison-icon">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            <svg v-else-if="scoreDelta < 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="screening-report__comparison-icon">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
            <span v-else>=</span>
            {{ scoreDelta > 0 ? '+' : '' }}{{ scoreDelta }}
          </span>
          <span class="screening-report__comparison-current">Current: {{ data.total_score }}</span>
        </div>
      </div>

      <!-- Disclaimer -->
      <div class="screening-report__disclaimer">
        <svg class="screening-report__disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <p>This is a screening tool, not a clinical diagnosis. Results should be reviewed by a qualified healthcare professional.</p>
      </div>

      <!-- Download -->
      <div class="screening-report__footer">
        <button class="screening-report__download" @click="downloadPdf">
          <v-icon name="hi-download" scale="0.85" />
          Download PDF Report
        </button>
      </div>
    </div>
  </div>
</template>

<script>
let logoBase64 = null
</script>

<script setup>
import { computed } from 'vue'
import { jsPDF } from 'jspdf'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  patient: {
    type: Object,
    default: null,
  },
})

const hasSubscales = computed(() => {
  return props.data.subscale_scores && Object.keys(props.data.subscale_scores).length > 0
})

const scoreDelta = computed(() => {
  if (props.data.previous_score == null) return 0
  return props.data.total_score - props.data.previous_score
})

const deltaClass = computed(() => {
  if (scoreDelta.value > 0) return 'screening-report__comparison-arrow--up'
  if (scoreDelta.value < 0) return 'screening-report__comparison-arrow--down'
  return 'screening-report__comparison-arrow--same'
})

const markerPosition = computed(() => {
  if (!props.data.max_score) return 0
  return Math.min(100, Math.max(0, (props.data.total_score / props.data.max_score) * 100))
})

const riskDefaultColor = computed(() => {
  const colors = {
    low: '#10B981',
    moderate: '#F59E0B',
    high: '#EF4444',
    critical: '#991B1B',
  }
  return colors[props.data.risk_level] || '#64748B'
})

function zoneWidth(zone) {
  if (!props.data.max_score) return 0
  const span = zone.max_score - zone.min_score
  return (span / props.data.max_score) * 100
}

function zoneDefaultColor(level) {
  const colors = {
    low: '#10B981',
    moderate: '#F59E0B',
    high: '#EF4444',
    critical: '#991B1B',
    minimal: '#10B981',
    mild: '#84CC16',
    severe: '#DC2626',
  }
  return colors[level] || '#94A3B8'
}

function formatSubscaleName(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function subscalePercent(value) {
  if (!props.data.max_score) return 0
  return Math.min(100, Math.max(0, (value / props.data.max_score) * 100))
}

async function loadLogo() {
  if (logoBase64) return logoBase64
  try {
    const res = await fetch('/eka-rc-logo-icon.png')
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => { logoBase64 = reader.result; resolve(logoBase64) }
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function stripEmoji(text) {
  if (!text) return ''
  return text.replace(/[^\x00-\x7F\u00A0-\u024F]/g, '').trim()
}

async function downloadPdf() {
  const d = props.data
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentW = pageW - margin * 2
  const centerX = pageW / 2

  // Header band
  doc.setFillColor(1, 87, 155)
  doc.rect(0, 0, pageW, 42, 'F')

  const logo = await loadLogo()
  if (logo) {
    const logoH = 16
    const logoW = logoH * (400 / 331)
    doc.addImage(logo, 'PNG', centerX - logoW / 2, 4, logoW, logoH)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('EkaGPT Screening Report', centerX, 30, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 220, 255)
  const dateStr = d.date
    ? new Date(d.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(dateStr, centerX, 37, { align: 'center' })

  // Orange accent
  doc.setDrawColor(255, 92, 0)
  doc.setLineWidth(1)
  doc.line(0, 42, pageW, 42)

  let y = 52

  // Patient info
  if (props.patient) {
    if (props.patient.name) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      doc.text('Patient:', margin, y)
      doc.setFont('helvetica', 'normal')
      doc.text(props.patient.name, margin + 22, y)
      y += 6
    }
    if (props.patient.dob) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      doc.text('DOB:', margin, y)
      doc.setFont('helvetica', 'normal')
      doc.text(props.patient.dob, margin + 16, y)
      y += 6
    }
    y += 2
  }

  // Helpers
  const checkPage = (needed = 30) => {
    if (y > pageH - needed) { doc.addPage(); y = 20 }
  }

  const addSection = (title, text) => {
    if (!text) return
    checkPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(1, 87, 155)
    doc.text(title, margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    const lines = doc.splitTextToSize(stripEmoji(text), contentW)
    for (const line of lines) {
      if (y > pageH - 28) { doc.addPage(); y = 20 }
      doc.text(line, margin, y)
      y += 5
    }
    y += 4
  }

  const addBulletList = (title, items) => {
    if (!items || !items.length) return
    checkPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(1, 87, 155)
    doc.text(title, margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    for (const item of items) {
      const wrapped = doc.splitTextToSize(stripEmoji(item), contentW - 8)
      for (let i = 0; i < wrapped.length; i++) {
        if (y > pageH - 28) { doc.addPage(); y = 20 }
        if (i === 0) {
          doc.setTextColor(255, 92, 0)
          doc.text('\u2022', margin + 1, y)
          doc.setTextColor(40, 40, 40)
        }
        doc.text(wrapped[i], margin + 8, y)
        y += 5
      }
      y += 1
    }
    y += 3
  }

  // Instrument
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text(d.instrument_name || d.instrument || 'Screening', margin, y)
  y += 5
  if (d.instrument && d.instrument_name) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(d.instrument.toUpperCase(), margin, y)
    y += 4
  }
  if (d.is_baseline) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(2, 136, 209)
    doc.text('Baseline Assessment', margin, y)
    y += 4
  }
  y += 4

  // Score
  checkPage()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(1, 87, 155)
  doc.text('Score', margin, y)
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(15, 23, 42)
  doc.text(`${d.total_score}`, margin, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(14)
  doc.setTextColor(148, 163, 184)
  doc.text(` / ${d.max_score}`, margin + doc.getTextWidth(`${d.total_score}`) + 2, y)
  y += 10

  // Risk level
  addSection('Risk Level', `${d.risk_zone_label || d.risk_level || 'Unknown'}`)
  if (d.recommendation) {
    addSection('Recommendation', d.recommendation)
  }

  // Risk zones legend
  if (d.risk_zones && d.risk_zones.length) {
    checkPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(1, 87, 155)
    doc.text('Risk Zones', margin, y)
    y += 6
    doc.setFontSize(9)
    for (const zone of d.risk_zones) {
      if (y > pageH - 28) { doc.addPage(); y = 20 }
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 40)
      doc.text(`${zone.label} (${zone.min_score}-${zone.max_score})`, margin + 6, y)
      y += 4.5
    }
    y += 4
  }

  // Subscales
  if (d.subscale_scores && Object.keys(d.subscale_scores).length) {
    const items = Object.entries(d.subscale_scores).map(
      ([key, val]) => `${formatSubscaleName(key)}: ${val}`
    )
    addBulletList('Subscale Scores', items)
  }

  // AI Interpretation
  const ai = d.ai_interpretation
  if (ai) {
    addSection('Summary', ai.summary)
    addSection('Risk Assessment', ai.risk_assessment)
    if (ai.recommended_interventions?.length) {
      addBulletList('Recommended Interventions', ai.recommended_interventions)
    }
    if (ai.motivational_message) {
      addSection('Motivational Message', ai.motivational_message)
    }
    if (ai.comparison_to_previous) {
      addSection('Comparison to Previous', ai.comparison_to_previous)
    }
  }

  // Previous score comparison
  if (d.previous_score != null) {
    const delta = d.total_score - d.previous_score
    const sign = delta > 0 ? '+' : ''
    addSection('Score Change', `Previous: ${d.previous_score}  |  Current: ${d.total_score}  |  Change: ${sign}${delta}`)
  }

  // Footer on every page
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    const footerY = pageH - 12
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.3)
    doc.line(margin, footerY - 5, pageW - margin, footerY - 5)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(7.5)
    doc.setTextColor(160, 160, 160)
    doc.text(
      'Generated by EkaGPT  |  Rapid Capsule Health Platform  |  This is a screening tool, not a clinical diagnosis.',
      centerX, footerY, { align: 'center' },
    )
    doc.setTextColor(1, 87, 155)
    doc.text('rapidcapsule.com', centerX, footerY + 4, { align: 'center' })
  }

  const instrument = (d.instrument || 'report').toUpperCase()
  const fileDate = new Date().toISOString().slice(0, 10)
  doc.save(`Screening-${instrument}-${fileDate}.pdf`)
}
</script>

<style scoped lang="scss">
$sky: #4FC3F7;
$sky-dark: #0ea5e9;
$sky-darker: #0ea5e9;
$navy: #f8fafc;
$slate: #f8fafc;
$gray: #94a3b8;
$light-gray: #64748b;
$bg: rgba(15, 23, 42, 0.4);

@mixin glass-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.screening-report {
  padding: 0;
  overflow-y: auto;
  max-height: 100%;

  &__inner {
    width: 100%;
  }

  &__header {
    margin-bottom: 16px;
  }

  &__header-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  &__title {
    font-size: 17px;
    font-weight: 700;
    color: $navy;
    flex: 1;
  }

  &__baseline-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 8px;
    background: rgba(14, 165, 233, 0.1);
    color: $sky-dark;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__instrument-code {
    font-size: 12px;
    color: $light-gray;
    font-weight: 500;
  }

  /* Section headings */
  &__section-heading {
    font-size: 13px;
    font-weight: 700;
    color: $sky-darker;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin: 0 0 10px;
  }

  /* Score gauge */
  &__gauge {
    @include glass-card;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
  }

  &__gauge-bar {
    position: relative;
    display: flex;
    height: 28px;
    border-radius: 6px;
    overflow: visible;
  }

  &__gauge-zone {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    position: relative;

    &:first-child {
      border-radius: 6px 0 0 6px;
    }

    &:last-child {
      border-radius: 0 6px 6px 0;
    }
  }

  &__gauge-zone-label {
    font-size: 9px;
    font-weight: 600;
    color: #FFFFFF;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 4px;
  }

  &__gauge-marker {
    position: absolute;
    top: -8px;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 2;
  }

  &__gauge-marker-value {
    font-size: 12px;
    font-weight: 800;
    color: $navy;
    background: rgba(15, 23, 42, 0.6);
    border: 2px solid $sky-darker;
    border-radius: 8px;
    padding: 1px 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    line-height: 1.5;
  }

  &__gauge-range {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: $light-gray;
    margin-top: 4px;
  }

  /* Simple score (fallback) */
  &__score-simple {
    text-align: center;
    margin-bottom: 16px;
  }

  &__score-value {
    font-size: 40px;
    font-weight: 800;
    color: $sky-darker;
  }

  &__score-max {
    font-size: 20px;
    font-weight: 500;
    color: $light-gray;
  }

  /* Risk display */
  &__risk-display {
    @include glass-card;
    border-radius: 20px;
    padding: 20px;
    text-align: center;
    margin-bottom: 16px;
  }

  &__risk-badge {
    display: inline-block;
    font-size: 14px;
    font-weight: 700;
    color: #FFFFFF;
    padding: 6px 20px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__recommendation {
    font-size: 13px;
    color: $slate;
    line-height: 1.5;
    margin: 10px 0 0;
  }

  /* Subscales */
  &__subscales {
    @include glass-card;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
  }

  &__subscale-item {
    margin-bottom: 10px;
  }

  &__subscale-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  &__subscale-name {
    font-size: 12px;
    font-weight: 600;
    color: $slate;
  }

  &__subscale-value {
    font-size: 12px;
    font-weight: 700;
    color: $gray;
  }

  &__subscale-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  &__subscale-fill {
    height: 100%;
    background: linear-gradient(90deg, $sky, $sky-dark);
    border-radius: 3px;
    transition: width 0.6s ease;
  }

  /* AI interpretation */
  &__ai {
    @include glass-card;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
  }

  &__ai-block {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 14px;
    margin-bottom: 10px;

    h5 {
      font-size: 12px;
      font-weight: 700;
      color: $navy;
      margin: 0 0 6px;
    }

    p {
      font-size: 13px;
      color: $slate;
      line-height: 1.6;
      margin: 0;
    }
  }

  &__ai-list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 6px;
      font-size: 13px;
      line-height: 1.5;
      color: $slate;

      &::before {
        content: '\2022';
        position: absolute;
        left: 0;
        color: $sky;
        font-weight: bold;
      }
    }
  }

  &__ai-callout {
    display: flex;
    gap: 10px;
    padding: 14px;
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(14, 165, 233, 0.15));
    border-radius: 16px;
    margin-bottom: 10px;

    p {
      font-size: 13px;
      font-weight: 500;
      color: $sky-darker;
      line-height: 1.5;
      margin: 0;
      font-style: italic;
    }
  }

  &__ai-callout-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: $sky-dark;
    margin-top: 1px;
  }

  /* Previous comparison */
  &__comparison {
    @include glass-card;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
  }

  &__comparison-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 14px;
  }

  &__comparison-prev,
  &__comparison-current {
    font-size: 13px;
    color: $gray;
    font-weight: 500;
  }

  &__comparison-arrow {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 18px;
    font-weight: 800;

    &--up {
      color: #EF4444;
    }

    &--down {
      color: #10B981;
    }

    &--same {
      color: $light-gray;
    }
  }

  &__comparison-icon {
    width: 18px;
    height: 18px;
  }

  /* Disclaimer */
  &__disclaimer {
    @include glass-card;
    display: flex;
    gap: 8px;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);

    p {
      font-size: 11px;
      color: #64748b;
      line-height: 1.5;
      margin: 0;
    }
  }

  &__disclaimer-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: #64748b;
    margin-top: 1px;
  }

  /* Footer / download */
  &__footer {
    margin-top: 16px;
    text-align: center;
  }

  &__download {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, $sky-darker, $sky-dark);
    color: #FFFFFF;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    .ov-icon { color: #FFFFFF; fill: #FFFFFF; }

    &:hover {
      box-shadow: 0 4px 16px rgba(14, 165, 233, 0.3);
      transform: translateY(-1px);
    }
  }
}
</style>
