<template>
  <div class="recovery-dash">
    <!-- Hero: Sobriety counter + risk badge -->
    <div class="recovery-dash__hero">
      <div class="recovery-dash__hero-counter">
        <span class="recovery-dash__hero-day-label">Day</span>
        <span class="recovery-dash__hero-day-count">{{ data.sobriety_days ?? 0 }}</span>
        <span v-if="data.sobriety_start_date" class="recovery-dash__hero-since">
          Since {{ formatDate(data.sobriety_start_date) }}
        </span>
      </div>
      <div class="recovery-dash__hero-meta">
        <span
          class="recovery-dash__risk-badge"
          :class="'recovery-dash__risk-badge--' + (data.risk_level || 'low')"
        >
          {{ riskLabel }}
        </span>
        <span v-if="data.primary_substance" class="recovery-dash__substance-tag">
          {{ data.primary_substance }}
        </span>
        <span v-if="data.care_level" class="recovery-dash__care-tag">
          {{ data.care_level }}
        </span>
      </div>
    </div>

    <!-- Check-in status -->
    <div
      class="recovery-dash__checkin"
      :class="data.today_checked_in ? 'recovery-dash__checkin--done' : 'recovery-dash__checkin--pending'"
    >
      <svg v-if="data.today_checked_in" class="recovery-dash__checkin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
      <svg v-else class="recovery-dash__checkin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span class="recovery-dash__checkin-text">
        {{ data.today_checked_in ? 'Daily check-in complete' : 'You haven\'t checked in today' }}
      </span>
    </div>

    <!-- Mood & Craving sparklines -->
    <div v-if="hasMoodData || hasCravingData" class="recovery-dash__trends">
      <div v-if="hasMoodData" class="recovery-dash__trend-card">
        <h4 class="recovery-dash__trend-title">Mood Trend</h4>
        <svg class="recovery-dash__sparkline" :viewBox="'0 0 ' + sparklineWidth + ' ' + sparklineHeight">
          <polyline
            :points="moodPoints"
            fill="none"
            stroke="#4FC3F7"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle
            v-if="data.mood_trend.length"
            :cx="lastMoodPoint.x"
            :cy="lastMoodPoint.y"
            r="3"
            fill="#4FC3F7"
          />
        </svg>
        <span class="recovery-dash__trend-latest">
          Latest: {{ data.mood_trend[data.mood_trend.length - 1]?.value ?? '--' }}/10
        </span>
      </div>
      <div v-if="hasCravingData" class="recovery-dash__trend-card">
        <h4 class="recovery-dash__trend-title">Craving Trend</h4>
        <svg class="recovery-dash__sparkline" :viewBox="'0 0 ' + sparklineWidth + ' ' + sparklineHeight">
          <polyline
            :points="cravingPoints"
            fill="none"
            stroke="#F59E0B"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <circle
            v-if="data.craving_trend.length"
            :cx="lastCravingPoint.x"
            :cy="lastCravingPoint.y"
            r="3"
            fill="#F59E0B"
          />
        </svg>
        <span class="recovery-dash__trend-latest">
          Latest: {{ data.craving_trend[data.craving_trend.length - 1]?.value ?? '--' }}/10
        </span>
      </div>
    </div>

    <!-- Next milestone progress -->
    <div v-if="data.next_milestone" class="recovery-dash__next-milestone">
      <h4 class="recovery-dash__section-heading">Next Milestone</h4>
      <div class="recovery-dash__milestone-card">
        <div class="recovery-dash__milestone-info">
          <span class="recovery-dash__milestone-name">{{ data.next_milestone.name }}</span>
          <span class="recovery-dash__milestone-remaining">
            {{ data.next_milestone.days_remaining }} day{{ data.next_milestone.days_remaining === 1 ? '' : 's' }} to go
          </span>
        </div>
        <div class="recovery-dash__milestone-bar">
          <div
            class="recovery-dash__milestone-fill"
            :style="{ width: milestoneProgress + '%' }"
          ></div>
        </div>
        <span class="recovery-dash__milestone-pct">{{ milestoneProgress }}%</span>
      </div>
    </div>

    <!-- Recent milestones -->
    <div v-if="data.recent_milestones && data.recent_milestones.length" class="recovery-dash__milestones">
      <h4 class="recovery-dash__section-heading">Recent Milestones</h4>
      <div
        v-for="(ms, idx) in data.recent_milestones"
        :key="idx"
        class="recovery-dash__milestone-item"
      >
        <span class="recovery-dash__milestone-icon">{{ ms.icon || '🏆' }}</span>
        <div class="recovery-dash__milestone-detail">
          <span class="recovery-dash__milestone-item-name">{{ ms.name }}</span>
          <span class="recovery-dash__milestone-item-date">{{ formatDate(ms.achieved_at) }}</span>
        </div>
        <span class="recovery-dash__milestone-points">+{{ ms.points }} pts</span>
      </div>
    </div>

    <!-- Latest screening -->
    <div v-if="data.latest_screening" class="recovery-dash__screening">
      <h4 class="recovery-dash__section-heading">Latest Screening</h4>
      <div class="recovery-dash__screening-card">
        <div class="recovery-dash__screening-header">
          <span class="recovery-dash__screening-instrument">{{ data.latest_screening.instrument }}</span>
          <span
            class="recovery-dash__screening-risk"
            :class="'recovery-dash__screening-risk--' + (data.latest_screening.risk_level || 'low')"
          >
            {{ data.latest_screening.risk_level }}
          </span>
        </div>
        <div class="recovery-dash__screening-score">
          <span class="recovery-dash__screening-value">{{ data.latest_screening.score }}</span>
          <span class="recovery-dash__screening-max"> / {{ data.latest_screening.max_score }}</span>
        </div>
        <span v-if="data.latest_screening.date" class="recovery-dash__screening-date">
          {{ formatDate(data.latest_screening.date) }}
        </span>
      </div>
    </div>

    <!-- Disclaimer -->
    <div class="recovery-dash__disclaimer">
      <svg class="recovery-dash__disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <p>This is a recovery tracking summary, not a clinical report. Share with your care team for professional guidance.</p>
    </div>

    <!-- Download -->
    <div class="recovery-dash__footer">
      <button class="recovery-dash__download" @click="downloadPdf">
        <v-icon name="hi-download" scale="0.85" />
        Download PDF Summary
      </button>
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

const sparklineWidth = 160
const sparklineHeight = 40
const sparklinePadding = 4

const riskLabel = computed(() => {
  const labels = {
    low: 'Low Risk',
    moderate: 'Moderate Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  }
  return labels[props.data.risk_level] || 'Unknown'
})

const hasMoodData = computed(() => {
  return props.data.mood_trend && props.data.mood_trend.length > 0
})

const hasCravingData = computed(() => {
  return props.data.craving_trend && props.data.craving_trend.length > 0
})

function buildSparklinePoints(trend) {
  if (!trend || trend.length === 0) return ''
  const maxVal = 10
  const usableW = sparklineWidth - sparklinePadding * 2
  const usableH = sparklineHeight - sparklinePadding * 2
  const step = trend.length > 1 ? usableW / (trend.length - 1) : 0
  return trend
    .map((pt, i) => {
      const x = sparklinePadding + i * step
      const y = sparklinePadding + usableH - (pt.value / maxVal) * usableH
      return `${x},${y}`
    })
    .join(' ')
}

function getLastPoint(trend) {
  if (!trend || trend.length === 0) return { x: 0, y: 0 }
  const maxVal = 10
  const usableW = sparklineWidth - sparklinePadding * 2
  const usableH = sparklineHeight - sparklinePadding * 2
  const step = trend.length > 1 ? usableW / (trend.length - 1) : 0
  const i = trend.length - 1
  return {
    x: sparklinePadding + i * step,
    y: sparklinePadding + usableH - (trend[i].value / maxVal) * usableH,
  }
}

const moodPoints = computed(() => buildSparklinePoints(props.data.mood_trend))
const cravingPoints = computed(() => buildSparklinePoints(props.data.craving_trend))
const lastMoodPoint = computed(() => getLastPoint(props.data.mood_trend))
const lastCravingPoint = computed(() => getLastPoint(props.data.craving_trend))

const milestoneProgress = computed(() => {
  const ms = props.data.next_milestone
  if (!ms || !ms.days_required) return 0
  const elapsed = ms.days_required - ms.days_remaining
  return Math.min(100, Math.max(0, Math.round((elapsed / ms.days_required) * 100)))
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

async function loadLogo() {
  if (logoBase64) return logoBase64
  try {
    const res = await fetch('/RapidCapsule_Logo.png')
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
  doc.text('Recovery Summary', centerX, 30, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(200, 220, 255)
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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

  // Sobriety
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text(`Day ${d.sobriety_days ?? 0}`, margin, y)
  y += 6

  const meta = []
  if (d.risk_level) meta.push(`Risk: ${riskLabel.value}`)
  if (d.primary_substance) meta.push(`Substance: ${d.primary_substance}`)
  if (d.care_level) meta.push(`Care: ${d.care_level}`)
  if (meta.length) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(meta.join('  |  '), margin, y)
    y += 5
  }
  if (d.sobriety_start_date) {
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(`Since ${formatDate(d.sobriety_start_date)}`, margin, y)
    y += 5
  }
  y += 4

  // Check-in status
  addSection('Daily Check-in', d.today_checked_in ? 'Complete for today' : 'Not yet completed today')

  // Mood & Craving trends
  if (d.mood_trend?.length) {
    const vals = d.mood_trend.map(p => `${p.value}/10`).join(', ')
    addSection('Mood Trend (Recent)', vals)
  }
  if (d.craving_trend?.length) {
    const vals = d.craving_trend.map(p => `${p.value}/10`).join(', ')
    addSection('Craving Trend (Recent)', vals)
  }

  // Next milestone
  if (d.next_milestone) {
    addSection('Next Milestone', `${d.next_milestone.name} — ${d.next_milestone.days_remaining} day(s) to go (${milestoneProgress.value}% complete)`)
  }

  // Recent milestones
  if (d.recent_milestones?.length) {
    checkPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(1, 87, 155)
    doc.text('Recent Milestones', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)
    for (const ms of d.recent_milestones) {
      if (y > pageH - 28) { doc.addPage(); y = 20 }
      doc.setTextColor(255, 92, 0)
      doc.text('\u2022', margin + 1, y)
      doc.setTextColor(40, 40, 40)
      doc.text(`${stripEmoji(ms.name)} — ${formatDate(ms.achieved_at)} (+${ms.points} pts)`, margin + 8, y)
      y += 5
    }
    y += 4
  }

  // Latest screening
  if (d.latest_screening) {
    addSection('Latest Screening', `${d.latest_screening.instrument?.toUpperCase()}: ${d.latest_screening.score}/${d.latest_screening.max_score} (${d.latest_screening.risk_level}) — ${formatDate(d.latest_screening.date)}`)
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
      'Generated by EkaGPT  |  Rapid Capsule Health Platform  |  Recovery tracking summary, not a clinical report.',
      centerX, footerY, { align: 'center' },
    )
    doc.setTextColor(1, 87, 155)
    doc.text('rapidcapsule.com', centerX, footerY + 4, { align: 'center' })
  }

  const fileDate = new Date().toISOString().slice(0, 10)
  doc.save(`Recovery-Summary-${fileDate}.pdf`)
}
</script>

<style scoped lang="scss">
.recovery-dash {
  padding: 16px;
  overflow-y: auto;
  max-height: 100%;

  &__hero {
    text-align: center;
    padding: 24px 16px;
    background: linear-gradient(135deg, #E0F7FA, #B3E5FC);
    border-radius: 12px;
    margin-bottom: 16px;
  }

  &__hero-counter {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 12px;
  }

  &__hero-day-label {
    font-size: 13px;
    font-weight: 600;
    color: #0288D1;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  &__hero-day-count {
    font-size: 56px;
    font-weight: 800;
    color: #01579B;
    line-height: 1.1;
  }

  &__hero-since {
    font-size: 12px;
    color: #0277BD;
    margin-top: 4px;
  }

  &__hero-meta {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__risk-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 12px;
    text-transform: uppercase;
    letter-spacing: 0.3px;

    &--low {
      background: #D1FAE5;
      color: #065F46;
    }

    &--moderate {
      background: #FEF3C7;
      color: #92400E;
    }

    &--high {
      background: #FEE2E2;
      color: #991B1B;
    }

    &--critical {
      background: #991B1B;
      color: #FFFFFF;
    }
  }

  &__substance-tag,
  &__care-tag {
    font-size: 11px;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 12px;
    background: #F1F5F9;
    color: #334155;
    border: 1px solid #E2E8F0;
  }

  /* Check-in status */
  &__checkin {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 12px;
    margin-bottom: 16px;

    &--done {
      background: #ECFDF5;
      color: #065F46;
    }

    &--pending {
      background: #FFFBEB;
      color: #92400E;
    }
  }

  &__checkin-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }

  &__checkin-text {
    font-size: 13px;
    font-weight: 600;
  }

  /* Trend sparklines */
  &__trends {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 16px;

    @media (max-width: 400px) {
      grid-template-columns: 1fr;
    }
  }

  &__trend-card {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__trend-title {
    font-size: 11px;
    font-weight: 700;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin: 0 0 8px;
  }

  &__sparkline {
    width: 100%;
    height: 40px;
  }

  &__trend-latest {
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    margin-top: 6px;
  }

  /* Section headings */
  &__section-heading {
    font-size: 13px;
    font-weight: 700;
    color: #01579B;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin: 0 0 10px;
  }

  /* Next milestone */
  &__next-milestone {
    margin-bottom: 16px;
  }

  &__milestone-card {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 14px;
  }

  &__milestone-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__milestone-name {
    font-size: 13px;
    font-weight: 600;
    color: #0F172A;
  }

  &__milestone-remaining {
    font-size: 12px;
    color: #64748B;
  }

  &__milestone-bar {
    height: 8px;
    background: #E2E8F0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 4px;
  }

  &__milestone-fill {
    height: 100%;
    background: linear-gradient(90deg, #4FC3F7, #0288D1);
    border-radius: 4px;
    transition: width 0.6s ease;
  }

  &__milestone-pct {
    font-size: 11px;
    font-weight: 600;
    color: #0288D1;
  }

  /* Recent milestones */
  &__milestones {
    margin-bottom: 16px;
  }

  &__milestone-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    border-bottom: 1px solid #F1F5F9;

    &:last-child {
      border-bottom: none;
    }
  }

  &__milestone-icon {
    font-size: 18px;
    flex-shrink: 0;
    width: 28px;
    text-align: center;
  }

  &__milestone-detail {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  &__milestone-item-name {
    font-size: 13px;
    font-weight: 600;
    color: #0F172A;
  }

  &__milestone-item-date {
    font-size: 11px;
    color: #94A3B8;
  }

  &__milestone-points {
    font-size: 12px;
    font-weight: 700;
    color: #0288D1;
    background: #E0F7FA;
    padding: 2px 8px;
    border-radius: 8px;
  }

  /* Latest screening */
  &__screening {
    margin-bottom: 16px;
  }

  &__screening-card {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 14px;
  }

  &__screening-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__screening-instrument {
    font-size: 14px;
    font-weight: 700;
    color: #0F172A;
  }

  &__screening-risk {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 12px;
    text-transform: uppercase;

    &--low {
      background: #D1FAE5;
      color: #065F46;
    }

    &--moderate {
      background: #FEF3C7;
      color: #92400E;
    }

    &--high {
      background: #FEE2E2;
      color: #991B1B;
    }

    &--critical {
      background: #991B1B;
      color: #FFFFFF;
    }
  }

  &__screening-score {
    margin-bottom: 4px;
  }

  &__screening-value {
    font-size: 28px;
    font-weight: 800;
    color: #01579B;
  }

  &__screening-max {
    font-size: 16px;
    font-weight: 500;
    color: #94A3B8;
  }

  &__screening-date {
    font-size: 11px;
    color: #94A3B8;
  }

  /* Disclaimer */
  &__disclaimer {
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    background: #FFFBEB;
    border: 1px solid #FDE68A;
    border-radius: 8px;
    margin-top: 16px;

    p {
      font-size: 11px;
      color: #92400E;
      line-height: 1.5;
      margin: 0;
    }
  }

  &__disclaimer-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    color: #D97706;
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
    background: linear-gradient(135deg, #01579B, #0288D1);
    color: #FFFFFF;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      box-shadow: 0 4px 16px rgba(1, 87, 155, 0.3);
      transform: translateY(-1px);
    }
  }
}
</style>
