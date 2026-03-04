<template>
  <div class="risk-assess">
    <div class="risk-assess__inner">
    <!-- Risk Gauge -->
    <div class="risk-assess__gauge-section">
      <div class="risk-assess__gauge">
        <svg viewBox="0 0 120 70" class="risk-assess__gauge-svg">
          <!-- Background arc -->
          <path
            d="M 10 65 A 50 50 0 0 1 110 65"
            fill="none"
            stroke="#E2E8F0"
            stroke-width="10"
            stroke-linecap="round"
          />
          <!-- Coloured arc -->
          <path
            d="M 10 65 A 50 50 0 0 1 110 65"
            fill="none"
            :stroke="levelColor"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="arcLength"
            :stroke-dashoffset="arcOffset"
            class="risk-assess__gauge-fill"
          />
          <!-- Score text -->
          <text x="60" y="52" text-anchor="middle" class="risk-assess__gauge-score" :fill="levelColor">
            {{ data.score ?? 0 }}
          </text>
          <text x="60" y="64" text-anchor="middle" class="risk-assess__gauge-max" fill="#64748B">
            / 100
          </text>
        </svg>
      </div>
      <span
        class="risk-assess__level-badge"
        :class="'risk-assess__level-badge--' + (data.level || 'low')"
      >
        {{ levelLabel }}
      </span>
      <span v-if="data.updated_at" class="risk-assess__updated">
        Updated {{ timeAgo(data.updated_at) }}
      </span>
    </div>

    <!-- Signal Category Bars -->
    <div v-if="hasCategories" class="risk-assess__categories">
      <h4 class="risk-assess__section-heading">Signal Breakdown</h4>
      <div
        v-for="cat in categoryList"
        :key="cat.key"
        class="risk-assess__category"
      >
        <div class="risk-assess__category-header">
          <span class="risk-assess__category-name">{{ cat.label }}</span>
          <span class="risk-assess__category-score">{{ cat.score }}/100</span>
        </div>
        <div class="risk-assess__category-bar">
          <div
            class="risk-assess__category-fill"
            :style="{ width: cat.score + '%', background: barColor(cat.score) }"
          ></div>
        </div>
        <span class="risk-assess__category-weight">Weight: {{ cat.weight }}</span>
      </div>
    </div>

    <!-- Top Contributing Factors -->
    <div v-if="data.top_factors && data.top_factors.length" class="risk-assess__factors">
      <h4 class="risk-assess__section-heading">Top Contributing Factors</h4>
      <div
        v-for="(factor, idx) in data.top_factors.slice(0, 5)"
        :key="idx"
        class="risk-assess__factor"
      >
        <div class="risk-assess__factor-bar">
          <div
            class="risk-assess__factor-fill"
            :style="{ width: Math.min(100, factor.contribution || factor.value || 0) + '%', background: barColor(factor.contribution || factor.value || 0) }"
          ></div>
        </div>
        <span class="risk-assess__factor-name">{{ factor.name || factor.signal }}</span>
        <span class="risk-assess__factor-value">{{ factor.contribution || factor.value || 0 }}</span>
      </div>
    </div>

    <!-- Trend Sparkline -->
    <div v-if="hasHistory" class="risk-assess__trend">
      <h4 class="risk-assess__section-heading">
        7-Day Trend
        <span v-if="data.trend" class="risk-assess__trend-direction" :class="'risk-assess__trend-direction--' + (data.trend.direction || 'stable')">
          {{ trendArrow }} {{ data.trend.direction }}
        </span>
      </h4>
      <svg class="risk-assess__sparkline" :viewBox="'0 0 ' + sparkW + ' ' + sparkH">
        <!-- Threshold zones -->
        <rect x="0" :y="0" :width="sparkW" :height="sparkH * 0.25" fill="#991B1B" opacity="0.06" />
        <rect x="0" :y="sparkH * 0.25" :width="sparkW" :height="sparkH * 0.25" fill="#F59E0B" opacity="0.06" />
        <rect x="0" :y="sparkH * 0.5" :width="sparkW" :height="sparkH * 0.25" fill="#F59E0B" opacity="0.04" />
        <rect x="0" :y="sparkH * 0.75" :width="sparkW" :height="sparkH * 0.25" fill="#10B981" opacity="0.06" />
        <!-- Line -->
        <polyline
          :points="historyPoints"
          fill="none"
          :stroke="levelColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- Dots -->
        <circle
          v-for="(pt, i) in historyDots"
          :key="i"
          :cx="pt.x"
          :cy="pt.y"
          r="3"
          :fill="dotColor(pt.score)"
        />
      </svg>
      <div class="risk-assess__sparkline-labels">
        <span>{{ historyStartLabel }}</span>
        <span>Today</span>
      </div>
    </div>

    <!-- Suggested Actions -->
    <div v-if="data.suggestions && data.suggestions.length" class="risk-assess__suggestions">
      <h4 class="risk-assess__section-heading">Suggested Actions</h4>
      <div
        v-for="(sug, idx) in data.suggestions"
        :key="idx"
        class="risk-assess__suggestion"
      >
        <svg class="risk-assess__suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span>{{ sug.text }}</span>
      </div>
    </div>

    <!-- Patient Responses -->
    <div v-if="data.responses && data.responses.length" class="risk-assess__responses">
      <h4 class="risk-assess__section-heading">Follow-up Conversation</h4>
      <div
        v-for="(msg, idx) in data.responses"
        :key="idx"
        class="risk-assess__response-item"
        :class="{
          'risk-assess__response-item--eka': msg.role === 'assistant',
          'risk-assess__response-item--patient': msg.role === 'user',
        }"
      >
        <span class="risk-assess__response-role">{{ msg.role === 'assistant' ? 'Eka' : (patient?.name?.split(' ')[0] || 'Patient') }}</span>
        <p class="risk-assess__response-text">{{ msg.content }}</p>
      </div>
    </div>

    <!-- Disclaimer -->
    <div class="risk-assess__disclaimer">
      <svg class="risk-assess__disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <p>This risk assessment is an AI-generated estimate, not a clinical diagnosis. Always consult your care team for professional guidance.</p>
    </div>

    <!-- Download -->
    <div class="risk-assess__footer">
      <button class="risk-assess__download" @click="downloadPdf">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download PDF Report
      </button>
    </div>
    </div><!-- /.risk-assess__inner -->
  </div>
</template>

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

const sparkW = 240
const sparkH = 60
const sparkPad = 4

const levelLabels = {
  low: 'Low Risk',
  moderate: 'Moderate Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
}

const levelColors = {
  low: '#10B981',
  moderate: '#F59E0B',
  high: '#F97316',
  critical: '#EF4444',
}

const levelLabel = computed(() => levelLabels[props.data.level] || 'Unknown')
const levelColor = computed(() => levelColors[props.data.level] || '#94A3B8')

// Gauge arc calculation
const totalArc = Math.PI // 180 degrees semicircle, ~157 units for r=50
const arcLen = 157
const arcLength = computed(() => `${arcLen} ${arcLen}`)
const arcOffset = computed(() => {
  const pct = Math.min(100, Math.max(0, props.data.score || 0)) / 100
  return arcLen - pct * arcLen
})

// Category list
const categoryLabels = {
  self_reported: 'Self-Reported',
  behavioral: 'Behavioral',
  physiological: 'Physiological',
  clinical: 'Clinical',
  contextual: 'Contextual',
}

const hasCategories = computed(() => {
  return props.data.categories && Object.keys(props.data.categories).length > 0
})

const categoryList = computed(() => {
  if (!props.data.categories) return []
  const cats = props.data.categories
  return Object.keys(categoryLabels).map((key) => {
    const cat = cats[key] || {}
    return {
      key,
      label: categoryLabels[key],
      score: Math.round(cat.score ?? cat.raw_score ?? 0),
      weight: cat.weight ? (cat.weight * 100).toFixed(0) + '%' : '--',
    }
  }).filter(c => c.score > 0 || c.weight !== '--')
})

function barColor(score) {
  if (score >= 75) return '#EF4444'
  if (score >= 50) return '#F97316'
  if (score >= 25) return '#F59E0B'
  return '#10B981'
}

function dotColor(score) {
  if (score >= 75) return '#EF4444'
  if (score >= 50) return '#F97316'
  if (score >= 25) return '#F59E0B'
  return '#10B981'
}

// History sparkline
const hasHistory = computed(() => {
  return props.data.history && props.data.history.length > 1
})

const historyPoints = computed(() => {
  const h = props.data.history || []
  if (h.length === 0) return ''
  const usableW = sparkW - sparkPad * 2
  const usableH = sparkH - sparkPad * 2
  const step = h.length > 1 ? usableW / (h.length - 1) : 0
  return h
    .map((pt, i) => {
      const x = sparkPad + i * step
      const y = sparkPad + usableH - (Math.min(100, pt.score || 0) / 100) * usableH
      return `${x},${y}`
    })
    .join(' ')
})

const historyDots = computed(() => {
  const h = props.data.history || []
  if (h.length === 0) return []
  const usableW = sparkW - sparkPad * 2
  const usableH = sparkH - sparkPad * 2
  const step = h.length > 1 ? usableW / (h.length - 1) : 0
  return h.map((pt, i) => ({
    x: sparkPad + i * step,
    y: sparkPad + usableH - (Math.min(100, pt.score || 0) / 100) * usableH,
    score: pt.score || 0,
  }))
})

const historyStartLabel = computed(() => {
  const h = props.data.history || []
  if (h.length === 0) return ''
  try {
    return new Date(h[0].calculated_at || h[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
})

const trendArrow = computed(() => {
  const dir = props.data.trend?.direction
  if (dir === 'increasing') return '\u2191'
  if (dir === 'decreasing') return '\u2193'
  return '\u2192'
})

function timeAgo(dateStr) {
  if (!dateStr) return ''
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  } catch {
    return ''
  }
}

function stripEmoji(text) {
  if (!text) return ''
  return text.replace(/[^\x00-\x7F\u00A0-\u024F]/g, '').trim()
}

async function loadLogo() {
  try {
    const res = await fetch('/eka-rc-logo-icon.png')
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

const levelColorsPdf = { low: [16, 185, 129], moderate: [245, 158, 11], high: [249, 115, 22], critical: [239, 68, 68] }

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
    const logoH = 16; const logoW = logoH * (400 / 331)
    doc.addImage(logo, 'PNG', centerX - logoW / 2, 4, logoW, logoH)
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('EkaGPT Risk Assessment Report', centerX, 30, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 220, 255)
  const dateStr = d.updated_at
    ? new Date(d.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(dateStr, centerX, 37, { align: 'center' })
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

  const checkPage = (needed = 30) => { if (y > pageH - needed) { doc.addPage(); y = 20 } }

  // Risk Score
  const [cr, cg, cb] = levelColorsPdf[d.level] || [148, 163, 184]
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(36)
  doc.setTextColor(cr, cg, cb)
  doc.text(`${d.score ?? 0}`, centerX, y, { align: 'center' })
  y += 6
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text('/ 100', centerX, y, { align: 'center' })
  y += 8
  doc.setFontSize(14)
  doc.setTextColor(cr, cg, cb)
  doc.text((levelLabels[d.level] || 'Unknown').toUpperCase(), centerX, y, { align: 'center' })
  y += 14

  // Signal Breakdown
  if (d.categories && Object.keys(d.categories).length) {
    checkPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(1, 87, 155)
    doc.text('Signal Breakdown', margin, y)
    y += 7
    const catLabels = { self_reported: 'Self-Reported', behavioral: 'Behavioral', physiological: 'Physiological', clinical: 'Clinical', contextual: 'Contextual' }
    for (const [key, label] of Object.entries(catLabels)) {
      const cat = d.categories[key]
      if (!cat) continue
      const score = Math.round(cat.score ?? cat.raw_score ?? 0)
      const weight = cat.weight ? `${(cat.weight * 100).toFixed(0)}%` : '--'
      checkPage(12)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      doc.text(`${label} (${weight})`, margin, y)
      doc.text(`${score}/100`, margin + contentW - 5, y, { align: 'right' })
      y += 3
      // Bar background
      doc.setFillColor(230, 230, 230)
      doc.roundedRect(margin, y, contentW, 3, 1.5, 1.5, 'F')
      // Bar fill
      const barW = Math.max(1, (score / 100) * contentW)
      const bc = score >= 75 ? [239, 68, 68] : score >= 50 ? [249, 115, 22] : score >= 25 ? [245, 158, 11] : [16, 185, 129]
      doc.setFillColor(bc[0], bc[1], bc[2])
      doc.roundedRect(margin, y, barW, 3, 1.5, 1.5, 'F')
      y += 7
    }
    y += 4
  }

  // Top Contributing Factors
  if (d.top_factors?.length) {
    checkPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(1, 87, 155)
    doc.text('Top Contributing Factors', margin, y)
    y += 7
    for (const f of d.top_factors.slice(0, 5)) {
      checkPage(8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      const name = f.name || f.signal || f.label || 'Unknown'
      const val = f.contribution || f.value || 0
      doc.text(`\u2022 ${name}`, margin + 2, y)
      doc.text(`${val}`, margin + contentW - 5, y, { align: 'right' })
      y += 5
    }
    y += 4
  }

  // Trend
  if (d.trend) {
    checkPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(1, 87, 155)
    doc.text('Trend', margin, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    const arrow = d.trend.direction === 'increasing' ? '\u2191' : d.trend.direction === 'decreasing' ? '\u2193' : '\u2192'
    doc.text(`Direction: ${arrow} ${d.trend.direction || 'stable'}`, margin, y)
    y += 5
    if (d.trend.change_7d != null) { doc.text(`7-day change: ${d.trend.change_7d > 0 ? '+' : ''}${d.trend.change_7d}`, margin, y); y += 5 }
    if (d.trend.change_30d != null) { doc.text(`30-day change: ${d.trend.change_30d > 0 ? '+' : ''}${d.trend.change_30d}`, margin, y); y += 5 }
    y += 4
  }

  // Suggestions
  if (d.suggestions?.length) {
    checkPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(1, 87, 155)
    doc.text('Suggested Actions', margin, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    for (const s of d.suggestions) {
      checkPage(8)
      doc.text(`\u2022 ${s.text}`, margin + 2, y)
      y += 5
    }
    y += 4
  }

  // Patient Responses (follow-up conversation Q&A)
  if (d.responses && d.responses.length) {
    checkPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(1, 87, 155)
    doc.text('Follow-up Conversation', margin, y)
    y += 6

    for (const msg of d.responses) {
      checkPage(20)
      const isEka = msg.role === 'assistant'

      // Role label
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      if (isEka) {
        doc.setTextColor(1, 87, 155)
      } else {
        doc.setTextColor(100, 100, 100)
      }
      const patientLabel = props.patient?.name?.split(' ')[0] || 'Patient'
      doc.text(isEka ? 'Eka:' : `${patientLabel}:`, margin, y)
      y += 4

      // Message content
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(40, 40, 40)
      let content = stripEmoji(msg.content)
      if (isEka && content.length > 500) {
        content = content.slice(0, 497) + '...'
      }
      const lines = doc.splitTextToSize(content, contentW - 6)
      for (const line of lines) {
        if (y > pageH - 28) { doc.addPage(); y = 20 }
        doc.text(line, margin + 6, y)
        y += 5
      }
      y += 3
    }
    y += 2
  }

  // Disclaimer
  checkPage(20)
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, margin + contentW, y)
  y += 6
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(140, 140, 140)
  const disclaimer = 'This risk assessment is an AI-generated estimate, not a clinical diagnosis. Always consult your care team for professional guidance.'
  const dLines = doc.splitTextToSize(disclaimer, contentW)
  for (const line of dLines) { doc.text(line, margin, y); y += 4 }

  // Footer
  const footerY = pageH - 10
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(160, 160, 160)
  doc.text('Generated by EkaGPT \u2014 Rapid Capsule', centerX, footerY, { align: 'center' })

  const fileDate = new Date().toISOString().split('T')[0]
  doc.save(`Risk-Assessment-${fileDate}.pdf`)
}
</script>

<style lang="scss" scoped>
@mixin glass-card {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1);
}

.risk-assess {
  padding: 0;
  overflow-y: auto;
  max-height: 100%;

  &__inner {
    width: 100%;
    padding: 24px;
  }

  &__gauge-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
  }

  &__gauge {
    width: 160px;
    margin-bottom: 8px;
  }

  &__gauge-svg {
    width: 100%;
    height: auto;
  }

  &__gauge-fill {
    transition: stroke-dashoffset 0.8s ease;
  }

  &__gauge-score {
    font-size: 28px;
    font-weight: 800;
    font-family: 'Inter', monospace;
  }

  &__gauge-max {
    font-size: 11px;
    font-weight: 500;
  }

  &__level-badge {
    font-size: 12px;
    font-weight: 700;
    padding: 4px 14px;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;

    &--low {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
    }
    &--moderate {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
    }
    &--high {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
    }
    &--critical {
      background: #991B1B;
      color: #FFFFFF;
    }
  }

  &__updated {
    font-size: 11px;
    color: #94a3b8;
    margin-top: 4px;
  }

  &__section-heading {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    color: #0ea5e9;
    margin: 0 0 10px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  // Categories
  &__categories {
    @include glass-card;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
  }

  &__category {
    margin-bottom: 10px;
  }

  &__category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  &__category-name {
    font-size: 12px;
    font-weight: 600;
    color: #f8fafc;
  }

  &__category-score {
    font-size: 11px;
    font-weight: 700;
    color: #f8fafc;
    font-family: 'Inter', monospace;
  }

  &__category-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  &__category-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease;
  }

  &__category-weight {
    font-size: 10px;
    color: #94a3b8;
    margin-top: 2px;
    display: block;
  }

  // Top factors
  &__factors {
    @include glass-card;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
  }

  &__factor {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__factor-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    min-width: 60px;
  }

  &__factor-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.6s ease;
  }

  &__factor-name {
    font-size: 11px;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__factor-value {
    font-size: 11px;
    font-weight: 700;
    color: #f8fafc;
    font-family: 'Inter', monospace;
    min-width: 20px;
    text-align: right;
  }

  // Trend
  &__trend {
    @include glass-card;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
  }

  &__trend-direction {
    font-size: 11px;
    font-weight: 600;
    text-transform: capitalize;

    &--increasing { color: #EF4444; }
    &--decreasing { color: #10B981; }
    &--stable { color: #64748b; }
  }

  &__sparkline {
    width: 100%;
    height: 60px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  &__sparkline-labels {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: #94a3b8;
    margin-top: 4px;
  }

  // Suggestions
  &__suggestions {
    @include glass-card;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
  }

  &__suggestion {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    margin-bottom: 6px;
    font-size: 12px;
    color: #f8fafc;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: rgba(14, 165, 233, 0.1);
    }
  }

  &__suggestion-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: #94a3b8;
  }

  // Patient Responses
  &__responses {
    @include glass-card;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
  }

  &__response-item {
    padding: 10px 12px;
    border-radius: 10px;
    margin-bottom: 6px;

    &--eka {
      background: rgba(14, 165, 233, 0.08);
      border-left: 3px solid #0ea5e9;
    }

    &--patient {
      background: rgba(255, 255, 255, 0.05);
      border-left: 3px solid #64748b;
    }
  }

  &__response-role {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 4px;

    .risk-assess__response-item--eka & {
      color: #0ea5e9;
    }

    .risk-assess__response-item--patient & {
      color: #94a3b8;
    }
  }

  &__response-text {
    font-size: 13px;
    color: #f8fafc;
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
  }

  // Disclaimer
  &__disclaimer {
    @include glass-card;
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;

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

  &__footer {
    margin-top: 16px;
    text-align: center;
  }

  &__download {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    color: #FFFFFF;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 4px 16px rgba(14, 165, 233, 0.3);
      transform: translateY(-1px);
    }

    svg {
      flex-shrink: 0;
    }
  }
}
</style>
