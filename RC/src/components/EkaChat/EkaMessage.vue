<template>
  <div class="eka-msg" :class="[msg.role]">
    <div v-if="msg.role === 'assistant'" class="eka-avatar">
      <img src="/RapidCapsule_Logo.png" alt="EkaGPT" />
    </div>
    <div class="eka-msg__body" :class="[msg.role]">
      <div class="eka-bubble" :class="[msg.role]">
        <div class="eka-bubble__text" v-html="formattedContent" @click="handleLinkClick"></div>
        <span v-if="isStreaming && msg.role === 'assistant' && isLast" class="eka-cursor">|</span>
      </div>
      <!-- Actions bar -->
      <div v-if="msg.content" class="eka-actions" :class="[msg.role]">
        <span class="eka-actions__time">{{ formattedTime }}</span>
        <!-- Assistant: copy + download -->
        <template v-if="msg.role === 'assistant'">
          <button
            class="eka-actions__btn"
            :title="copied ? 'Copied!' : 'Copy'"
            @click="copyText"
          >
            <v-icon :name="copied ? 'hi-check' : 'hi-clipboard-copy'" scale="0.75" />
          </button>
          <button
            class="eka-actions__btn"
            title="Download PDF"
            @click="downloadPdf"
          >
            <v-icon name="hi-download" scale="0.75" />
          </button>
        </template>
        <!-- User: edit + retry -->
        <template v-if="msg.role === 'user'">
          <button
            class="eka-actions__btn"
            title="Edit"
            @click="$emit('edit', msg.content)"
          >
            <v-icon name="hi-pencil" scale="0.75" />
          </button>
          <button
            class="eka-actions__btn"
            title="Retry"
            @click="$emit('retry', msg.content)"
          >
            <v-icon name="hi-refresh" scale="0.75" />
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { jsPDF } from 'jspdf'

const ROUTE_MAP = {
  book_appointment: '/app/patient/appointmentsv2/book',
  appointments: '/app/patient/appointmentsv2',
  vitals: '/app/patient/health-monitor/vitals',
  health_checkup: '/app/patient/health-checkup',
  prescriptions: '/app/patient/prescriptions',
  pharmacy: '/app/patient/pharmacy',
  orders: '/app/patient/pharmacy/orders',
  wallet: '/app/patient/wallet',
  profile: '/app/patient/onboarding',
  health_tips: '/app/patient/health-tips',
}

// Cache logo as base64 so we only fetch once
let logoBase64 = null

export default {
  name: 'EkaMessage',
  props: {
    msg: { type: Object, required: true },
    isLast: { type: Boolean, default: false },
    isStreaming: { type: Boolean, default: false },
  },
  emits: ['edit', 'retry'],
  data() {
    return { copied: false }
  },
  computed: {
    formattedTime() {
      if (!this.msg.created_at) return ''
      const d = new Date(this.msg.created_at)
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    },
    plainText() {
      if (!this.msg.content) return ''
      return this.msg.content
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$1')
        .replace(/\*\*(.*?)\*\*/g, '$1')
    },
    pdfText() {
      if (!this.msg.content) return ''
      // Replace action links with "Link Text (full URL)"
      let text = this.msg.content
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (match, linkText, routeKey) => {
          const route = ROUTE_MAP[routeKey.trim()]
          if (route) return `${linkText.trim()} (https://rapidcapsule.com${route})`
          return linkText.trim()
        })
        .replace(/\*\*(.*?)\*\*/g, '$1')
      // Strip emoji and non-latin extended chars that jsPDF can't render
      text = text.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{200D}\u{20E3}\u{FE0F}]|[^\x00-\x7F\xA0-\xFF\u0100-\u024F]/gu, '')
      return text.trim()
    },
    formattedContent() {
      if (!this.msg.content) return ''
      let text = this.msg.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

      // Platform action links: [[Link Text|route_key]]
      text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (match, linkText, routeKey) => {
        const route = ROUTE_MAP[routeKey.trim()]
        if (route) {
          return `<span class="eka-action-link" data-route="${route}">${linkText.trim()}</span>`
        }
        return linkText.trim()
      })

      // Bold
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Bullet points
      text = text.replace(/^[-•]\s+(.+)$/gm, '<li>$1</li>')
      text = text.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      // Clean up nested ul
      text = text.replace(/<\/ul>\s*<ul>/g, '')
      // Line breaks
      text = text.replace(/\n/g, '<br>')
      return text
    },
  },
  methods: {
    handleLinkClick(e) {
      const link = e.target.closest('.eka-action-link')
      if (!link) return
      e.preventDefault()
      e.stopPropagation()
      const route = link.getAttribute('data-route')
      if (route) this.$router.push(route)
    },

    copyText() {
      navigator.clipboard.writeText(this.plainText).then(() => {
        this.copied = true
        setTimeout(() => { this.copied = false }, 2000)
      })
    },

    async loadLogo() {
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
    },

    async downloadPdf() {
      const doc = new jsPDF({ unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 20
      const contentW = pageW - margin * 2
      const centerX = pageW / 2

      // --- Header band ---
      doc.setFillColor(1, 87, 155) // #01579B
      doc.rect(0, 0, pageW, 42, 'F')

      // --- Logo (400x331 = ~1.21:1 ratio) centered in header ---
      const logo = await this.loadLogo()
      if (logo) {
        const logoH = 16
        const logoW = logoH * (400 / 331) // maintain aspect ratio
        doc.addImage(logo, 'PNG', centerX - logoW / 2, 4, logoW, logoH)
      }

      // --- "EkaGPT Health Response" centered in header ---
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(255, 255, 255)
      doc.text('EkaGPT Health Response', centerX, 30, { align: 'center' })

      // --- Date below header ---
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(255, 255, 255, 180)
      doc.text(new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
      }), centerX, 37, { align: 'center' })

      // --- Orange accent line below header ---
      doc.setDrawColor(255, 92, 0) // #FF5C00
      doc.setLineWidth(1)
      doc.line(0, 42, pageW, 42)

      let y = 52

      // --- Body text ---
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(40, 40, 40)

      const rawLines = this.pdfText.split('\n')
      for (const rawLine of rawLines) {
        if (!rawLine.trim()) { y += 3; continue }

        const isBullet = /^[-\u2022]\s+/.test(rawLine)
        const cleanLine = rawLine.replace(/^[-\u2022]\s+/, '')
        const xOffset = isBullet ? margin + 6 : margin
        const wrapW = isBullet ? contentW - 6 : contentW

        const wrapped = doc.splitTextToSize(cleanLine, wrapW)
        for (let i = 0; i < wrapped.length; i++) {
          if (y > pageH - 28) {
            doc.addPage()
            y = 20
          }
          if (isBullet && i === 0) {
            doc.setTextColor(255, 92, 0) // orange bullet
            doc.text('\u2022', margin + 1, y)
            doc.setTextColor(40, 40, 40)
          }
          doc.text(wrapped[i], xOffset, y)
          y += 5.5
        }
        y += 2
      }

      // --- Footer on every page ---
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

      doc.save('EkaGPT-Response.pdf')
    },
  },
}
</script>

<style scoped lang="scss">
.eka-msg {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;

  &.user {
    justify-content: flex-end;
  }

  &.assistant {
    justify-content: flex-start;
  }
}

.eka-msg__body {
  max-width: 85%;

  &.user {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
}

.eka-avatar {
  width: 28px;
  height: 28px;
  min-width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.eka-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;

  &.user {
    background: #0288D1;
    color: #ffffff;
    border-bottom-right-radius: 4px;

    .eka-bubble__text,
    :deep(*) {
      color: #ffffff;
    }
  }

  &.assistant {
    background: #f3f4f6;
    color: #1f2937;
    border-bottom-left-radius: 4px;
  }

  &__text {
    :deep(ul) {
      margin: 4px 0;
      padding-left: 16px;
    }
    :deep(li) {
      margin: 2px 0;
    }
    :deep(strong) {
      font-weight: 600;
    }
    :deep(.eka-action-link) {
      color: #0288D1;
      text-decoration: none;
      font-weight: 600;
      border-bottom: 1px dashed #0288D1;
      cursor: pointer;
      transition: all 0.15s;
      padding-bottom: 1px;

      &:hover {
        color: #FF5C00;
        border-bottom-color: #FF5C00;
      }

      &::before {
        content: '→ ';
        font-size: 12px;
      }
    }
  }
}

// ===== Actions (timestamp + buttons) =====
.eka-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
  padding-left: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  &.user {
    justify-content: flex-end;
    padding-left: 0;
    padding-right: 4px;
  }

  .eka-msg:hover & {
    opacity: 1;
  }

  // Always visible on mobile (no hover)
  @media (max-width: 768px) {
    opacity: 1;
  }

  &__time {
    font-size: 11px;
    color: #9ca3af;
    margin-right: 4px;
    white-space: nowrap;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      background: #f3f4f6;
      color: #374151;
    }
  }
}

.eka-cursor {
  animation: blink 0.8s infinite;
  font-weight: 300;
  color: #0288D1;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
