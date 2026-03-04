<template>
  <div class="eka-report">
    <!-- Triage banner -->
    <div class="eka-report__triage" :class="triageClass">
      <v-icon :name="triageIcon" scale="1.1" />
      <div class="eka-report__triage-text">
        <span class="eka-report__triage-level">{{ triageLabel }}</span>
        <span class="eka-report__triage-desc">{{ triageDescription }}</span>
      </div>
    </div>

    <!-- Overview -->
    <div v-if="report.overview" class="eka-report__section">
      <p class="eka-report__overview">{{ report.overview }}</p>
    </div>

    <!-- Conditions -->
    <div v-if="data.conditions && data.conditions.length" class="eka-report__section">
      <h3 class="eka-report__heading">Possible Conditions</h3>
      <div
        v-for="(cond, idx) in data.conditions"
        :key="idx"
        class="eka-report__condition"
      >
        <div class="eka-report__condition-header">
          <span class="eka-report__condition-name">{{ cond.name }}</span>
          <span class="eka-report__condition-pct">{{ cond.probability }}%</span>
        </div>
        <div class="eka-report__condition-bar">
          <div
            class="eka-report__condition-fill"
            :style="{ width: cond.probability + '%' }"
            :class="conditionBarClass(cond.probability)"
          ></div>
        </div>
        <p
          v-if="conditionExplanation(cond.name)"
          class="eka-report__condition-explain"
        >
          {{ conditionExplanation(cond.name) }}
        </p>
      </div>
    </div>

    <!-- Key Findings -->
    <div v-if="report.key_findings && report.key_findings.length" class="eka-report__section">
      <h3 class="eka-report__heading">Key Findings</h3>
      <ul class="eka-report__list">
        <li v-for="(finding, idx) in report.key_findings" :key="idx">{{ finding }}</li>
      </ul>
    </div>

    <!-- Recommendations -->
    <div v-if="report.recommendations && report.recommendations.length" class="eka-report__section">
      <h3 class="eka-report__heading">Recommendations</h3>
      <ul class="eka-report__list eka-report__list--recs">
        <li v-for="(rec, idx) in report.recommendations" :key="idx">{{ rec }}</li>
      </ul>
    </div>

    <!-- When to Seek Care -->
    <div v-if="report.when_to_seek_care" class="eka-report__section eka-report__section--alert">
      <h3 class="eka-report__heading">When to Seek Care</h3>
      <p>{{ report.when_to_seek_care }}</p>
    </div>

    <!-- Lifestyle Tips -->
    <div v-if="report.lifestyle_tips && report.lifestyle_tips.length" class="eka-report__section">
      <h3 class="eka-report__heading">Lifestyle Tips</h3>
      <ul class="eka-report__list eka-report__list--tips">
        <li v-for="(tip, idx) in report.lifestyle_tips" :key="idx">{{ tip }}</li>
      </ul>
    </div>

    <!-- Download PDF -->
    <div class="eka-report__footer">
      <button class="eka-report__download" @click="downloadPdf">
        <v-icon name="hi-download" scale="0.85" />
        Download PDF Report
      </button>
      <p class="eka-report__disclaimer">
        This is an AI-generated health assessment, not a medical diagnosis.
      </p>
    </div>
  </div>
</template>

<script>
import { jsPDF } from 'jspdf'

const TRIAGE_CONFIG = {
  emergency: { label: 'Emergency', desc: 'Seek immediate medical attention', icon: 'bi-exclamation-triangle-fill', class: 'emergency' },
  emergency_ambulance: { label: 'Emergency', desc: 'Call an ambulance immediately', icon: 'bi-exclamation-triangle-fill', class: 'emergency' },
  consultation: { label: 'Consultation Recommended', desc: 'Schedule a visit with a specialist', icon: 'hi-exclamation', class: 'consultation' },
  consultation_24: { label: 'See a Doctor Within 24h', desc: 'Medical attention recommended soon', icon: 'hi-exclamation', class: 'consultation' },
  self_care: { label: 'Self Care', desc: 'Monitor symptoms at home', icon: 'hi-check-circle', class: 'self-care' },
}

let logoBase64 = null

export default {
  name: 'EkaCheckupReport',
  props: {
    data: { type: Object, required: true },
  },
  computed: {
    report() {
      return this.data?.report || {}
    },
    triageLevel() {
      return this.data?.triage_level || 'consultation'
    },
    triageConfig() {
      return TRIAGE_CONFIG[this.triageLevel] || TRIAGE_CONFIG.consultation
    },
    triageClass() {
      return this.triageConfig.class
    },
    triageLabel() {
      return this.triageConfig.label
    },
    triageDescription() {
      return this.triageConfig.desc
    },
    triageIcon() {
      return this.triageConfig.icon
    },
  },
  methods: {
    conditionBarClass(probability) {
      if (probability >= 60) return 'high'
      if (probability >= 30) return 'medium'
      return 'low'
    },
    conditionExplanation(name) {
      const explained = this.report?.possible_conditions_explained
      if (!explained) return null
      const match = explained.find(
        (c) => c.condition?.toLowerCase() === name?.toLowerCase(),
      )
      return match?.explanation || null
    },
    async loadLogo() {
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
    },
    async downloadPdf() {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 20
      const contentW = pageW - margin * 2
      const centerX = pageW / 2

      // Header band
      doc.setFillColor(1, 87, 155)
      doc.rect(0, 0, pageW, 42, 'F')

      const logo = await this.loadLogo()
      if (logo) {
        const logoH = 16
        const logoW = logoH * (400 / 331)
        doc.addImage(logo, 'PNG', centerX - logoW / 2, 4, logoW, logoH)
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(255, 255, 255)
      doc.text('EkaGPT Health Checkup Report', centerX, 30, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255, 180)
      doc.text(new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      }), centerX, 37, { align: 'center' })

      // Orange accent
      doc.setDrawColor(255, 92, 0)
      doc.setLineWidth(1)
      doc.line(0, 42, pageW, 42)

      let y = 52

      // Triage level
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(40, 40, 40)
      doc.text(`Triage: ${this.triageLabel}`, margin, y)
      y += 8

      // Helper to add wrapped text
      const addSection = (title, text) => {
        if (!text) return
        if (y > pageH - 30) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(1, 87, 155)
        doc.text(title, margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(40, 40, 40)
        const lines = doc.splitTextToSize(text, contentW)
        for (const line of lines) {
          if (y > pageH - 28) { doc.addPage(); y = 20 }
          doc.text(line, margin, y)
          y += 5
        }
        y += 4
      }

      const addBulletList = (title, items) => {
        if (!items || !items.length) return
        if (y > pageH - 30) { doc.addPage(); y = 20 }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(1, 87, 155)
        doc.text(title, margin, y)
        y += 6
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(40, 40, 40)
        for (const item of items) {
          const wrapped = doc.splitTextToSize(item, contentW - 8)
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

      addSection('Overview', this.report.overview)

      // Conditions
      if (this.data.conditions?.length) {
        const condLines = this.data.conditions.map((c) => `${c.name} (${c.probability}%)`)
        addBulletList('Possible Conditions', condLines)
      }

      addBulletList('Key Findings', this.report.key_findings)
      addBulletList('Recommendations', this.report.recommendations)
      addSection('When to Seek Care', this.report.when_to_seek_care)
      addBulletList('Lifestyle Tips', this.report.lifestyle_tips)

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
          'Generated by EkaGPT  |  Rapid Capsule Health Platform  |  This is not medical advice.',
          centerX, footerY, { align: 'center' },
        )
        doc.setTextColor(1, 87, 155)
        doc.text('rapidcapsule.com', centerX, footerY + 4, { align: 'center' })
      }

      doc.save('EkaGPT-Health-Report.pdf')
    },
  },
}
</script>

<style scoped lang="scss">
.eka-report {
  padding: 16px;
  overflow-y: auto;
  height: 100%;

  &__triage {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    margin-bottom: 20px;

    &.self-care {
      background: rgba(16, 185, 129, 0.1);
      color: #6ee7b7;
      .ov-icon { color: #10b981; fill: #10b981; }
    }
    &.consultation {
      background: rgba(245, 158, 11, 0.1);
      color: #fbbf24;
      .ov-icon { color: #f59e0b; fill: #f59e0b; }
    }
    &.emergency {
      background: rgba(239, 68, 68, 0.1);
      color: #fca5a5;
      .ov-icon { color: #ef4444; fill: #ef4444; }
    }
  }

  &__triage-text {
    display: flex;
    flex-direction: column;
  }

  &__triage-level {
    font-weight: 700;
    font-size: 15px;
  }

  &__triage-desc {
    font-size: 13px;
    opacity: 0.8;
  }

  &__section {
    margin-bottom: 20px;

    &--alert {
      background: rgba(251, 146, 60, 0.1);
      border: 1px solid rgba(251, 146, 60, 0.3);
      border-radius: 10px;
      padding: 14px;

      .eka-report__heading { color: #fb923c; }
      p { color: #fdba74; font-size: 13px; line-height: 1.6; margin: 0; }
    }
  }

  &__heading {
    font-size: 14px;
    font-weight: 700;
    color: #0ea5e9;
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  &__overview {
    font-size: 14px;
    line-height: 1.6;
    color: #f8fafc;
    margin: 0;
  }

  &__condition {
    margin-bottom: 12px;
  }

  &__condition-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  &__condition-name {
    font-size: 13px;
    font-weight: 600;
    color: #f8fafc;
  }

  &__condition-pct {
    font-size: 13px;
    font-weight: 700;
    color: #94a3b8;
  }

  &__condition-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    overflow: hidden;
  }

  &__condition-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease;

    &.high { background: #ef4444; }
    &.medium { background: #f59e0b; }
    &.low { background: #10b981; }
  }

  &__condition-explain {
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.5;
    margin: 4px 0 0;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 6px;
      font-size: 13px;
      line-height: 1.5;
      color: #f8fafc;

      &::before {
        content: '\2022';
        position: absolute;
        left: 0;
        color: #FF5C00;
        font-weight: bold;
      }
    }

    &--recs li::before { content: '\2713'; color: #10b981; }
    &--tips li::before { content: '\2728'; }
  }

  &__footer {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
  }

  &__download {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 24px;
    border: none;
    border-radius: 10px;
    background: #0ea5e9;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    .ov-icon { color: white; fill: white; }

    &:hover {
      background: #0284c7;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
    }
  }

  &__disclaimer {
    font-size: 11px;
    color: #64748b;
    margin: 10px 0 0;
  }
}
</style>
