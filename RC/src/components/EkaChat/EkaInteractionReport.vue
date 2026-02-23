<template>
  <div class="interaction-report">
    <!-- Header -->
    <div class="interaction-report__header">
      <v-icon name="ri-capsule-line" scale="1.1" />
      <h2>Drug Interaction Report</h2>
      <span class="interaction-report__badge">{{ report.drugs_checked?.length || 0 }} drugs</span>
    </div>

    <!-- Drugs Checked -->
    <div class="interaction-report__drugs">
      <span
        v-for="(drug, idx) in report.drugs_checked"
        :key="idx"
        class="interaction-report__drug-tag"
      >{{ drug }}</span>
    </div>

    <!-- No Interactions -->
    <div v-if="!report.hasInteractions" class="interaction-report__safe">
      <v-icon name="hi-shield-check" scale="1.5" />
      <h3>No Significant Interactions Found</h3>
      <p>Based on current clinical evidence, no major drug-drug interactions were identified between these medications.</p>
    </div>

    <!-- Interaction Cards -->
    <template v-if="report.hasInteractions">
      <div
        v-for="(interaction, idx) in report.interactions"
        :key="idx"
        class="interaction-report__interaction"
      >
        <!-- Severity Banner -->
        <div class="interaction-report__severity" :class="'interaction-report__severity--' + interaction.severity">
          <v-icon :name="severityIcon(interaction.severity)" scale="0.9" />
          <div class="interaction-report__severity-text">
            <span class="interaction-report__severity-level">{{ interaction.severity }} interaction</span>
            <span class="interaction-report__severity-drugs">{{ interaction.drug1 }} + {{ interaction.drug2 }}</span>
          </div>
        </div>

        <!-- Description -->
        <p class="interaction-report__description">{{ interaction.description }}</p>

        <!-- Enzyme Badge -->
        <div v-if="interaction.enzyme_involved" class="interaction-report__enzyme">
          <v-icon name="fa-flask" scale="0.65" />
          {{ interaction.enzyme_involved }}
        </div>

        <!-- Management -->
        <div v-if="interaction.management?.length" class="interaction-report__section">
          <h4><v-icon name="hi-clipboard-list" scale="0.75" /> Management</h4>
          <div
            v-for="(m, mIdx) in interaction.management"
            :key="mIdx"
            class="interaction-report__mgmt-item"
          >
            <v-icon :name="managementIcon(m.type)" scale="0.7" />
            <div>
              <strong>{{ m.title }}</strong>
              <p>{{ m.detail }}</p>
            </div>
          </div>
        </div>

        <!-- Detail Grid -->
        <div class="interaction-report__grid">
          <!-- Mechanism -->
          <div v-if="interaction.mechanism" class="interaction-report__card">
            <h5><v-icon name="fa-cogs" scale="0.65" /> Mechanism</h5>
            <p>{{ interaction.mechanism }}</p>
          </div>

          <!-- Clinical Significance -->
          <div v-if="interaction.clinical_significance" class="interaction-report__card">
            <h5><v-icon name="hi-exclamation" scale="0.65" /> Clinical Significance</h5>
            <div class="interaction-report__sig-row">
              <span class="label">Risk:</span>
              <span class="value" :class="'risk-' + interaction.clinical_significance.risk_level">
                {{ interaction.clinical_significance.risk_level }}
              </span>
            </div>
            <div class="interaction-report__sig-row">
              <span class="label">Onset:</span>
              <span class="value">{{ interaction.clinical_significance.onset }}</span>
            </div>
            <div class="interaction-report__sig-row">
              <span class="label">Evidence:</span>
              <span class="value">{{ interaction.clinical_significance.documentation }}</span>
            </div>
            <div v-if="interaction.clinical_significance.primary_risk" class="interaction-report__sig-row">
              <span class="label">Primary Risk:</span>
              <span class="value">{{ interaction.clinical_significance.primary_risk }}</span>
            </div>
          </div>

          <!-- Monitoring -->
          <div v-if="interaction.monitoring?.length" class="interaction-report__card">
            <h5><v-icon name="hi-eye" scale="0.65" /> Monitoring</h5>
            <div
              v-for="(mon, monIdx) in interaction.monitoring"
              :key="monIdx"
              class="interaction-report__monitor-item"
            >
              <strong>{{ mon.test }}</strong>
              <p>{{ mon.detail }}</p>
            </div>
          </div>

          <!-- Alternatives -->
          <div v-if="interaction.alternatives?.length" class="interaction-report__card">
            <h5><v-icon name="hi-switch-horizontal" scale="0.65" /> Alternatives</h5>
            <div
              v-for="(alt, altIdx) in interaction.alternatives"
              :key="altIdx"
              class="interaction-report__alt-item"
            >
              <strong>{{ alt.suggestion }}</strong>
              <p>{{ alt.detail }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Clinical Summary -->
    <div v-if="report.summary" class="interaction-report__summary">
      <h4><v-icon name="hi-document-text" scale="0.75" /> Clinical Summary</h4>
      <p>{{ report.summary }}</p>
    </div>

    <!-- Disclaimer -->
    <div class="interaction-report__disclaimer">
      <v-icon name="hi-information-circle" scale="0.7" />
      <p>This report is AI-generated and for informational purposes only. Always consult a healthcare professional before making changes to your medications.</p>
    </div>

    <!-- Download PDF -->
    <button class="interaction-report__download" @click="downloadPDF">
      <v-icon name="hi-download" scale="0.8" />
      Download PDF
    </button>
  </div>
</template>

<script>
import jsPDF from 'jspdf'

export default {
  name: 'EkaInteractionReport',
  props: {
    report: {
      type: Object,
      required: true,
    },
  },
  methods: {
    severityIcon(severity) {
      if (severity === 'major') return 'hi-exclamation-circle'
      if (severity === 'moderate') return 'hi-exclamation'
      return 'hi-information-circle'
    },

    managementIcon(type) {
      const icons = {
        dose_adjustment: 'ri-scales-line',
        monitoring: 'hi-eye',
        patient_education: 'hi-academic-cap',
        alternative: 'hi-switch-horizontal',
        general: 'hi-light-bulb',
      }
      return icons[type] || 'hi-light-bulb'
    },

    downloadPDF() {
      const doc = new jsPDF()
      const r = this.report
      let y = 20

      // Header
      doc.setFillColor(1, 87, 155)
      doc.rect(0, 0, 210, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.text('EkaGPT Drug Interaction Report', 15, y)
      y = 35
      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 15, y + 5)
      y += 15

      // Drugs checked
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.text('Drugs Checked:', 15, y)
      y += 7
      doc.setFontSize(10)
      for (const drug of r.drugs_checked || []) {
        doc.text(`  • ${drug}`, 15, y)
        y += 6
      }
      y += 5

      if (!r.hasInteractions) {
        doc.setFontSize(12)
        doc.setTextColor(16, 185, 129)
        doc.text('No significant interactions found.', 15, y)
        y += 10
      } else {
        for (const interaction of r.interactions || []) {
          if (y > 260) { doc.addPage(); y = 20 }

          // Severity
          const color = interaction.severity === 'major' ? [239, 68, 68]
            : interaction.severity === 'moderate' ? [245, 158, 11] : [59, 130, 246]
          doc.setFillColor(...color)
          doc.rect(15, y - 4, 180, 8, 'F')
          doc.setTextColor(255, 255, 255)
          doc.setFontSize(10)
          doc.text(`${interaction.severity.toUpperCase()}: ${interaction.drug1} + ${interaction.drug2}`, 18, y + 1)
          y += 12

          // Description
          doc.setTextColor(0, 0, 0)
          doc.setFontSize(9)
          const descLines = doc.splitTextToSize(interaction.description || '', 175)
          doc.text(descLines, 15, y)
          y += descLines.length * 5 + 3

          // Mechanism
          if (interaction.mechanism) {
            doc.setFontSize(10)
            doc.setTextColor(100, 100, 100)
            doc.text('Mechanism:', 15, y)
            y += 5
            doc.setFontSize(9)
            doc.setTextColor(0, 0, 0)
            const mechLines = doc.splitTextToSize(interaction.mechanism, 175)
            doc.text(mechLines, 15, y)
            y += mechLines.length * 5 + 3
          }

          // Management
          if (interaction.management?.length) {
            doc.setFontSize(10)
            doc.setTextColor(100, 100, 100)
            doc.text('Management:', 15, y)
            y += 5
            doc.setFontSize(9)
            doc.setTextColor(0, 0, 0)
            for (const m of interaction.management) {
              if (y > 270) { doc.addPage(); y = 20 }
              doc.text(`  • ${m.title}: ${m.detail}`, 15, y)
              y += 5
            }
            y += 3
          }

          // Monitoring
          if (interaction.monitoring?.length) {
            doc.setFontSize(10)
            doc.setTextColor(100, 100, 100)
            doc.text('Monitoring:', 15, y)
            y += 5
            doc.setFontSize(9)
            doc.setTextColor(0, 0, 0)
            for (const m of interaction.monitoring) {
              if (y > 270) { doc.addPage(); y = 20 }
              doc.text(`  • ${m.test}: ${m.detail}`, 15, y)
              y += 5
            }
            y += 3
          }

          y += 5
        }
      }

      // Summary
      if (r.summary) {
        if (y > 250) { doc.addPage(); y = 20 }
        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        doc.text('Clinical Summary:', 15, y)
        y += 6
        doc.setFontSize(9)
        const sumLines = doc.splitTextToSize(r.summary, 175)
        doc.text(sumLines, 15, y)
        y += sumLines.length * 5 + 5
      }

      // Disclaimer
      if (y > 260) { doc.addPage(); y = 20 }
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      const disclaimer = 'This report is AI-generated and for informational purposes only. Always consult a healthcare professional before making changes to your medications.'
      const discLines = doc.splitTextToSize(disclaimer, 175)
      doc.text(discLines, 15, y)

      doc.save('EkaGPT-Drug-Interaction-Report.pdf')
    },
  },
}
</script>

<style lang="scss" scoped>
.interaction-report {
  padding: 20px;
  overflow-y: auto;
  max-height: 100%;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;

    .ov-icon {
      color: #01579B;
      fill: #01579B;
    }

    h2 {
      font-size: 17px;
      font-weight: 700;
      color: #0F172A;
      flex: 1;
    }
  }

  &__badge {
    background: #E0F2FE;
    color: #0284C7;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 12px;
  }

  &__drugs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 16px;
  }

  &__drug-tag {
    background: #F1F5F9;
    color: #334155;
    font-size: 12px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid #E2E8F0;
  }

  &__safe {
    background: linear-gradient(135deg, #D1FAE5, #ECFDF5);
    border: 1px solid #A7F3D0;
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    margin-bottom: 16px;

    .ov-icon {
      color: #10B981;
      fill: #10B981;
      margin-bottom: 8px;
    }

    h3 {
      font-size: 15px;
      font-weight: 700;
      color: #065F46;
      margin-bottom: 6px;
    }

    p {
      font-size: 13px;
      color: #047857;
      line-height: 1.5;
    }
  }

  &__interaction {
    margin-bottom: 20px;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    overflow: hidden;
  }

  &__severity {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    color: #fff;

    &--major {
      background: linear-gradient(135deg, #EF4444, #DC2626);
    }

    &--moderate {
      background: linear-gradient(135deg, #F59E0B, #D97706);
    }

    &--minor {
      background: linear-gradient(135deg, #3B82F6, #2563EB);
    }

    .ov-icon {
      fill: #fff;
      color: #fff;
      flex-shrink: 0;
    }
  }

  &__severity-text {
    display: flex;
    flex-direction: column;
  }

  &__severity-level {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__severity-drugs {
    font-size: 13px;
    font-weight: 500;
    opacity: 0.95;
  }

  &__description {
    padding: 12px 16px;
    font-size: 13px;
    color: #334155;
    line-height: 1.6;
    border-bottom: 1px solid #F1F5F9;
  }

  &__enzyme {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin: 8px 16px;
    background: #EDE9FE;
    color: #7C3AED;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 6px;

    .ov-icon {
      color: #7C3AED;
      fill: #7C3AED;
    }
  }

  &__section {
    padding: 12px 16px;
    border-top: 1px solid #F1F5F9;

    h4 {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 10px;

      .ov-icon {
        color: #0284C7;
        fill: #0284C7;
      }
    }
  }

  &__mgmt-item {
    display: flex;
    gap: 8px;
    padding: 8px 0;
    border-bottom: 1px solid #F8FAFC;

    &:last-child { border-bottom: none; }

    .ov-icon {
      color: #64748B;
      fill: #64748B;
      flex-shrink: 0;
      margin-top: 2px;
    }

    strong {
      font-size: 12px;
      color: #0F172A;
      display: block;
      margin-bottom: 2px;
    }

    p {
      font-size: 12px;
      color: #64748B;
      line-height: 1.4;
      margin: 0;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 12px 16px;

    @media (max-width: 500px) {
      grid-template-columns: 1fr;
    }
  }

  &__card {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    padding: 10px 12px;

    h5 {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 6px;

      .ov-icon {
        color: #94A3B8;
        fill: #94A3B8;
      }
    }

    p {
      font-size: 12px;
      color: #334155;
      line-height: 1.5;
      margin: 0;
    }
  }

  &__sig-row {
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 11px;

    .label {
      color: #94A3B8;
      font-weight: 500;
    }

    .value {
      color: #334155;
      font-weight: 600;

      &.risk-major { color: #EF4444; }
      &.risk-moderate { color: #F59E0B; }
      &.risk-minor { color: #3B82F6; }
    }
  }

  &__monitor-item,
  &__alt-item {
    margin-bottom: 6px;

    &:last-child { margin-bottom: 0; }

    strong {
      font-size: 11px;
      color: #0F172A;
      display: block;
    }

    p {
      font-size: 11px;
      color: #64748B;
      line-height: 1.4;
      margin: 0;
    }
  }

  &__summary {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 12px;

    h4 {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
      margin-bottom: 8px;

      .ov-icon {
        color: #0284C7;
        fill: #0284C7;
      }
    }

    p {
      font-size: 13px;
      color: #334155;
      line-height: 1.6;
      margin: 0;
    }
  }

  &__disclaimer {
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    background: #FFFBEB;
    border: 1px solid #FDE68A;
    border-radius: 8px;
    margin-bottom: 12px;

    .ov-icon {
      color: #D97706;
      fill: #D97706;
      flex-shrink: 0;
      margin-top: 1px;
    }

    p {
      font-size: 11px;
      color: #92400E;
      line-height: 1.5;
      margin: 0;
    }
  }

  &__download {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 10px;
    background: #01579B;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;

    .ov-icon {
      fill: #fff;
      color: #fff;
    }

    &:hover {
      background: #014882;
    }
  }
}
</style>
