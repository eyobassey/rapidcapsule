<template>
  <div class="coping-exercise">
    <div class="coping-exercise__inner">
    <!-- Header -->
    <div class="coping-exercise__header">
      <h2 class="coping-exercise__name">{{ data.name }}</h2>
      <div class="coping-exercise__meta">
        <span class="coping-exercise__category-badge">{{ data.category }}</span>
        <span v-if="data.estimated_minutes" class="coping-exercise__time">
          <svg class="coping-exercise__time-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {{ data.estimated_minutes }} min
        </span>
      </div>
      <p v-if="data.description" class="coping-exercise__description">{{ data.description }}</p>
    </div>

    <!-- Completion Report Banner -->
    <div v-if="data.completed" class="coping-exercise__completed">
      <div class="coping-exercise__completed-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="coping-exercise__completed-icon">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>Exercise Completed</span>
      </div>
      <p v-if="data.outcome" class="coping-exercise__outcome">{{ data.outcome }}</p>
      <span v-if="data.completed_at" class="coping-exercise__completed-time">{{ formatCompletedAt(data.completed_at) }}</span>
    </div>

    <!-- Box breathing visual (special mode) -->
    <div v-if="isBoxBreathing" class="coping-exercise__breathing">
      <div
        class="coping-exercise__breathing-circle"
        :class="{ 'coping-exercise__breathing-circle--active': breathingActive }"
      >
        <span class="coping-exercise__breathing-label">{{ breathingPhaseLabel }}</span>
      </div>
      <div v-if="breathingCycles > 0" class="coping-exercise__breathing-count">
        {{ breathingCycles }} / 4 cycles
      </div>
      <button
        v-if="!breathingDone"
        class="coping-exercise__btn coping-exercise__btn--primary"
        @click="toggleBreathing"
      >
        {{ breathingActive ? 'Pause' : 'Start Breathing' }}
      </button>
      <div v-else class="coping-exercise__breathing-done">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px;">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span>Breathing complete!</span>
      </div>
    </div>

    <!-- All steps as a scrollable reference list -->
    <div v-if="hasSteps" class="coping-exercise__steps">
      <h4 class="coping-exercise__section-heading">Steps</h4>
      <div class="coping-exercise__hint">Follow along as Eka guides you through each step</div>
      <div
        v-for="(step, idx) in data.steps"
        :key="idx"
        class="coping-exercise__step-item"
        :class="{ 'coping-exercise__step-item--done': completedSteps[idx] }"
        @click="toggleStepDone(idx)"
      >
        <span class="coping-exercise__step-number" :class="{ 'coping-exercise__step-number--done': completedSteps[idx] }">
          <svg v-if="completedSteps[idx]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="coping-exercise__check-icon">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <template v-else>{{ idx + 1 }}</template>
        </span>
        <p class="coping-exercise__step-text">{{ step }}</p>
      </div>
    </div>

    <!-- Progress bar -->
    <div v-if="hasSteps" class="coping-exercise__progress">
      <div class="coping-exercise__progress-bar">
        <div
          class="coping-exercise__progress-fill"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
      <span class="coping-exercise__progress-label">{{ doneCount }} of {{ totalSteps }} steps</span>
    </div>

    <!-- Evidence base -->
    <div v-if="data.evidence_base" class="coping-exercise__evidence">
      <h4 class="coping-exercise__section-heading">Evidence Base</h4>
      <p>{{ data.evidence_base }}</p>
    </div>

    <!-- Patient Responses -->
    <div v-if="data.responses && data.responses.length" class="coping-exercise__responses">
      <h4 class="coping-exercise__section-heading">Patient Responses</h4>
      <div
        v-for="(msg, idx) in data.responses"
        :key="idx"
        class="coping-exercise__response-item"
        :class="{
          'coping-exercise__response-item--eka': msg.role === 'assistant',
          'coping-exercise__response-item--patient': msg.role === 'user',
        }"
      >
        <span class="coping-exercise__response-role">{{ msg.role === 'assistant' ? 'Eka' : (patient?.name?.split(' ')[0] || 'Patient') }}</span>
        <p class="coping-exercise__response-text">{{ msg.content }}</p>
      </div>
    </div>

    <!-- Disclaimer -->
    <div class="coping-exercise__disclaimer">
      <svg class="coping-exercise__disclaimer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      <p>This exercise is for informational purposes. It is not a substitute for professional treatment or crisis intervention.</p>
    </div>

    <!-- Download -->
    <div class="coping-exercise__footer">
      <button class="coping-exercise__download" @click="downloadPdf">
        <v-icon name="hi-download" scale="0.85" />
        Download PDF
      </button>
    </div>
    </div><!-- /.coping-exercise__inner -->
  </div>
</template>

<script>
let logoBase64 = null
</script>

<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount, nextTick } from 'vue'
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

const emit = defineEmits(['breathing-complete'])

const completedSteps = reactive({})
const breathingActive = ref(false)
const breathingPhase = ref(0)
const breathingCycles = ref(0)
const breathingDone = ref(false)
let phaseCount = 0

// Watch for step updates from backend (via Vuex store → artifact data)
watch(
  () => props.data.completed_steps,
  (newSteps) => {
    if (newSteps && Array.isArray(newSteps)) {
      for (const stepNum of newSteps) {
        completedSteps[stepNum - 1] = true
      }
    }
  },
  { immediate: true, deep: true },
)

function formatCompletedAt(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

let breathingInterval = null

const hasSteps = computed(() => {
  return props.data.steps && props.data.steps.length > 0
})

const totalSteps = computed(() => {
  return props.data.steps ? props.data.steps.length : 0
})

const doneCount = computed(() => {
  return Object.values(completedSteps).filter(Boolean).length
})

const progressPercent = computed(() => {
  if (!totalSteps.value) return 0
  return Math.round((doneCount.value / totalSteps.value) * 100)
})

const isBoxBreathing = computed(() => {
  return props.data.exercise_id === 'box_breathing'
})

const breathingPhases = ['Breathe In', 'Hold', 'Breathe Out', 'Hold']

const breathingPhaseLabel = computed(() => {
  if (!breathingActive.value) return 'Ready'
  return breathingPhases[breathingPhase.value % 4]
})

function toggleStepDone(idx) {
  completedSteps[idx] = !completedSteps[idx]
}

function toggleBreathing() {
  if (breathingActive.value) {
    stopBreathing()
  } else {
    startBreathing()
  }
}

function startBreathing() {
  breathingActive.value = true
  breathingPhase.value = 0
  phaseCount = 0
  breathingInterval = setInterval(() => {
    breathingPhase.value = (breathingPhase.value + 1) % 4
    phaseCount++
    // A full cycle = 4 phases
    if (phaseCount % 4 === 0) {
      breathingCycles.value = Math.floor(phaseCount / 4)
      if (breathingCycles.value >= 4 && !breathingDone.value) {
        breathingDone.value = true
        stopBreathing()
        emit('breathing-complete')
      }
    }
  }, 4000)
}

function stopBreathing() {
  breathingActive.value = false
  if (breathingInterval) {
    clearInterval(breathingInterval)
    breathingInterval = null
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
  doc.text('EkaGPT Coping Exercise', centerX, 30, { align: 'center' })

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

  // Exercise name + category + duration
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(40, 40, 40)
  doc.text(stripEmoji(d.name) || 'Coping Exercise', margin, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  const metaParts = []
  if (d.category) metaParts.push(d.category.toUpperCase())
  if (d.estimated_minutes) metaParts.push(`${d.estimated_minutes} minutes`)
  if (metaParts.length) {
    doc.text(metaParts.join('  |  '), margin, y)
    y += 5
  }
  y += 4

  // Completion Report (if completed)
  if (d.completed) {
    checkPage()
    // Calculate dynamic height for the green banner
    let bannerH = 16 // base height for header row + padding
    let outcomeWrapped = []
    if (d.outcome) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      outcomeWrapped = doc.splitTextToSize(stripEmoji(d.outcome), contentW - 16)
      bannerH = 14 + (outcomeWrapped.length * 5) + 4
    }

    // Green completion banner
    doc.setFillColor(236, 253, 245) // #ECFDF5
    doc.setDrawColor(167, 243, 208) // #A7F3D0
    doc.setLineWidth(0.5)
    doc.roundedRect(margin, y - 4, contentW, bannerH, 3, 3, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(5, 150, 105) // #059669
    doc.text('Exercise Completed', margin + 8, y + 4)

    if (d.completed_at) {
      const completedDate = new Date(d.completed_at).toLocaleString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139) // #64748B
      doc.text(completedDate, pageW - margin - 8, y + 4, { align: 'right' })
    }

    if (outcomeWrapped.length) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(51, 65, 85) // #334155
      let oY = y + 12
      for (const line of outcomeWrapped) {
        doc.text(line, margin + 8, oY)
        oY += 5
      }
    }
    y += bannerH + 6
  }

  // Description
  addSection('Description', d.description)

  // Steps
  if (d.steps && d.steps.length) {
    checkPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(1, 87, 155)
    doc.text('Steps', margin, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(40, 40, 40)

    d.steps.forEach((step, idx) => {
      const label = `${idx + 1}. `
      const wrapped = doc.splitTextToSize(stripEmoji(step), contentW - 10)
      for (let i = 0; i < wrapped.length; i++) {
        if (y > pageH - 28) { doc.addPage(); y = 20 }
        if (i === 0) {
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(255, 92, 0)
          doc.text(label, margin, y)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(40, 40, 40)
        }
        doc.text(wrapped[i], margin + 10, y)
        y += 5
      }
      y += 2
    })
    y += 2
  }

  // Patient Responses (conversation Q&A during the exercise)
  if (d.responses && d.responses.length) {
    checkPage()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(1, 87, 155)
    doc.text('Patient Responses', margin, y)
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

      // Message content (truncate long assistant messages)
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

  // Evidence base
  addSection('Evidence Base', d.evidence_base)

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
      'Generated by EkaGPT  |  Rapid Capsule Health Platform  |  For informational purposes only.',
      centerX, footerY, { align: 'center' },
    )
    doc.setTextColor(1, 87, 155)
    doc.text('rapidcapsule.com', centerX, footerY + 4, { align: 'center' })
  }

  const exerciseId = (d.exercise_id || 'exercise').replace(/\s+/g, '_')
  const fileDate = new Date().toISOString().slice(0, 10)
  doc.save(`Exercise-${exerciseId}-${fileDate}.pdf`)
}

onBeforeUnmount(() => {
  stopBreathing()
})
</script>

<style scoped lang="scss">
@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.coping-exercise {
  padding: 0;
  overflow-y: auto;
  max-height: 100%;

  &__inner {
    width: 100%;
    padding: 24px;
  }

  /* Header */
  &__header {
    margin-bottom: 20px;
  }

  &__name {
    font-size: 17px;
    font-weight: 700;
    color: #0F172A;
    margin: 0 0 8px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  &__category-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 12px;
    background: #E0F7FA;
    color: #0288D1;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  &__time {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #64748B;
    font-weight: 500;
  }

  &__time-icon {
    width: 14px;
    height: 14px;
  }

  &__description {
    font-size: 13px;
    color: #334155;
    line-height: 1.6;
    margin: 0;
  }

  /* Section headings */
  &__section-heading {
    font-size: 13px;
    font-weight: 700;
    color: #01579B;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin: 0 0 8px;
  }

  &__hint {
    font-size: 12px;
    color: #94A3B8;
    margin-bottom: 12px;
    font-style: italic;
  }

  /* Steps list */
  &__steps {
    @include glass-card;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 16px;
  }

  &__step-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 12px;
    border-radius: 10px;
    margin-bottom: 6px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid #F1F5F9;
    background: #FAFBFC;

    &:hover {
      background: #F1F5F9;
    }

    &--done {
      background: #ECFDF5;
      border-color: #A7F3D0;

      .coping-exercise__step-text {
        color: #6B7280;
        text-decoration: line-through;
        text-decoration-color: #A7F3D0;
      }
    }
  }

  &__step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    min-width: 28px;
    border-radius: 50%;
    background: #E2E8F0;
    color: #475569;
    font-size: 13px;
    font-weight: 700;
    transition: all 0.2s;

    &--done {
      background: #10B981;
      color: #FFFFFF;
    }
  }

  &__check-icon {
    width: 14px;
    height: 14px;
  }

  &__step-text {
    font-size: 13px;
    color: #0F172A;
    line-height: 1.5;
    margin: 0;
    padding-top: 3px;
    transition: all 0.2s;
  }

  /* Progress bar */
  &__progress {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  &__progress-bar {
    flex: 1;
    height: 6px;
    background: #E2E8F0;
    border-radius: 3px;
    overflow: hidden;
  }

  &__progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4FC3F7, #10B981);
    border-radius: 3px;
    transition: width 0.4s ease;
  }

  &__progress-label {
    font-size: 12px;
    font-weight: 600;
    color: #64748B;
    white-space: nowrap;
  }

  /* Completion report */
  &__completed {
    @include glass-card;
    background: linear-gradient(135deg, rgba(236, 253, 245, 0.9), rgba(209, 250, 229, 0.85));
    border: 1px solid #A7F3D0;
    border-radius: 20px;
    padding: 16px;
    margin-bottom: 16px;
    text-align: center;
  }

  &__completed-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 700;
    color: #059669;
    margin-bottom: 8px;
  }

  &__completed-icon {
    width: 22px;
    height: 22px;
    color: #10B981;
  }

  &__outcome {
    font-size: 13px;
    color: #334155;
    line-height: 1.6;
    margin: 0 0 6px;
  }

  &__completed-time {
    font-size: 11px;
    color: #64748B;
  }

  /* Box breathing visual */
  &__breathing {
    @include glass-card;
    border-radius: 20px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
  }

  &__breathing-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, #E0F7FA, #B3E5FC);
    border: 3px solid #4FC3F7;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    transition: transform 4s ease-in-out;

    &--active {
      animation: breathe 16s ease-in-out infinite;
    }
  }

  &__breathing-label {
    font-size: 14px;
    font-weight: 700;
    color: #0288D1;
    text-align: center;
  }

  &__breathing-count {
    font-size: 13px;
    font-weight: 600;
    color: #0288D1;
    margin-bottom: 12px;
  }

  &__breathing-done {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: #ECFDF5;
    border: 1px solid #A7F3D0;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #059669;
  }

  &__btn {
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;

    &--primary {
      background: #0288D1;
      color: #FFFFFF;

      &:hover {
        background: #01579B;
      }
    }
  }

  /* Patient Responses */
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
      background: #F0F7FF;
      border-left: 3px solid #0288D1;
    }

    &--patient {
      background: #F8FAFC;
      border-left: 3px solid #64748B;
    }
  }

  &__response-role {
    display: block;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-bottom: 4px;

    .coping-exercise__response-item--eka & {
      color: #0288D1;
    }

    .coping-exercise__response-item--patient & {
      color: #64748B;
    }
  }

  &__response-text {
    font-size: 13px;
    color: #334155;
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
  }

  /* Evidence base */
  &__evidence {
    @include glass-card;
    border-radius: 20px;
    padding: 20px;
    margin-bottom: 12px;

    p {
      font-size: 12px;
      color: #475569;
      line-height: 1.5;
      margin: 0;
    }
  }

  /* Disclaimer */
  &__disclaimer {
    @include glass-card;
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    background: rgba(255, 251, 235, 0.85);
    border: 1px solid #FDE68A;
    border-radius: 20px;

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

@keyframes breathe {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.35);
  }
  50% {
    transform: scale(1.35);
  }
  75% {
    transform: scale(1);
  }
  100% {
    transform: scale(1);
  }
}
</style>
