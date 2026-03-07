<template>
  <div class="eka-msg" :class="[msg.role]">
    <div v-if="msg.role === 'assistant'" class="eka-avatar">
      <img src="/eka-rc-logo-icon.png" alt="EkaGPT" />
    </div>
    <div class="eka-msg__body" :class="[msg.role]">
      <div class="eka-bubble" :class="[msg.role]">
        <!-- Attached file preview (user messages with prescription uploads) -->
        <div v-if="msg.attachment" class="eka-bubble__attachment">
          <img v-if="msg.attachment.type === 'image' && msg.attachment.url" :src="msg.attachment.url" class="eka-bubble__attach-img" alt="Prescription" @click="openAttachment" />
          <div v-else class="eka-bubble__attach-file">
            <v-icon name="hi-document" scale="1.2" />
            <span>{{ msg.attachment.filename || 'Prescription' }}</span>
          </div>
        </div>
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
  upload_prescription: '/app/patient/pharmacy/upload-prescription',
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
          const key = routeKey.trim()
          if (key.startsWith('drug:')) {
            const drugId = key.slice(5)
            return `${linkText.trim()} (https://rapidcapsule.com/app/patient/pharmacy/drug/${drugId})`
          }
          const [baseKey] = key.split(':')
          const route = ROUTE_MAP[baseKey] || ROUTE_MAP[key]
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

      // Platform action links: [[Link Text|route_key]] or [[Link Text|drug:ID]]
      text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, (match, linkText, routeKey) => {
        const key = routeKey.trim()
        // Drug product deep link: drug:MONGO_ID
        if (key.startsWith('drug:')) {
          const drugId = key.slice(5)
          const route = `/app/patient/pharmacy/drug/${drugId}`
          return `<span class="eka-action-link eka-drug-link" data-route="${route}" data-new-tab="true">${linkText.trim()}</span>`
        }
        // Handle parameterized route keys like book_appointment:CHECKUP_ID
        const [baseKey, param] = key.split(':')
        const route = ROUTE_MAP[baseKey] || ROUTE_MAP[key]
        if (route) {
          let fullRoute = route
          if (baseKey === 'book_appointment' && param) {
            fullRoute = `${route}?checkup_id=${param}&from_health_check=true`
          }
          return `<span class="eka-action-link" data-route="${fullRoute}">${linkText.trim()}</span>`
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
      if (!route) return
      if (link.getAttribute('data-new-tab') === 'true') {
        window.open(route, '_blank')
      } else {
        this.$router.push(route)
      }
    },

    openAttachment() {
      if (this.msg.attachment?.url) {
        window.open(this.msg.attachment.url, '_blank')
      }
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
  max-width: 80%;

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
  padding: 0.875rem 1.25rem;
  border-radius: 1rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  word-wrap: break-word;

  &.user {
    background: #f8fafc;
    color: #0f172a;
    border-top-right-radius: 0.25rem;

    .eka-bubble__text,
    :deep(*) {
      color: #0f172a;
    }
  }

  &.assistant {
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    border-top-left-radius: 0.25rem;

    .eka-bubble__text,
    :deep(*) {
      color: #f8fafc;
    }

    :deep(strong) {
      color: #ffffff;
    }

    :deep(li) {
      color: #f8fafc;
    }
  }

  &__attachment {
    margin-bottom: 8px;
  }

  &__attach-img {
    max-width: 200px;
    max-height: 160px;
    border-radius: 8px;
    cursor: pointer;
    object-fit: cover;
    display: block;

    &:hover {
      opacity: 0.85;
    }
  }

  &__attach-file {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    opacity: 0.8;
    margin-bottom: 4px;
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
      color: #0ea5e9;
      text-decoration: none;
      font-weight: 600;
      border-bottom: 1px dashed #0ea5e9;
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
    color: #64748b;
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
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s;

    .ov-icon {
      color: #64748b;
      fill: #64748b;
      stroke: #64748b;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #f8fafc;

      .ov-icon {
        color: #f8fafc;
        fill: #f8fafc;
        stroke: #f8fafc;
      }
    }
  }
}

.eka-cursor {
  animation: blink 0.8s infinite;
  font-weight: 300;
  color: #0ea5e9;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}
</style>
