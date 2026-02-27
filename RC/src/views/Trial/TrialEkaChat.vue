<template>
  <div class="trial-eka">
    <!-- Nav -->
    <div class="trial-eka__nav">
      <router-link to="/" class="trial-eka__logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </router-link>
      <div class="trial-eka__nav-right">
        <router-link :to="backRoute" class="trial-eka__back">
          <v-icon name="hi-arrow-left" scale="0.8" />
          Back to Trial
        </router-link>
      </div>
    </div>

    <!-- Message counter banner -->
    <div
      class="trial-eka__counter"
      :class="{
        'trial-eka__counter--warning': messagesRemaining <= 3 && messagesRemaining > 0,
        'trial-eka__counter--exhausted': messagesRemaining <= 0
      }"
    >
      <v-icon name="hi-chat-alt-2" scale="0.75" />
      <span v-if="messagesRemaining > 0">
        {{ messagesUsed }} of {{ messageLimit }} messages used &middot; {{ messagesRemaining }} remaining
      </span>
      <span v-else>All trial messages used</span>
    </div>

    <!-- Chat area -->
    <div class="trial-eka__body" :class="{ 'trial-eka__body--with-artifact': artifactOpen }">
      <div class="trial-eka__main">
        <!-- Welcome screen -->
        <div v-if="messages.length === 0 && !isExhausted" class="trial-eka__welcome">
          <div class="trial-eka__welcome-avatar">
            <img src="/RapidCapsule_Logo.png" alt="Eka" />
          </div>
          <h2>Hi {{ firstName }}! I'm Eka</h2>
          <p>Your AI health companion. I can search medications, check drug interactions, and run health checkups — all free during your trial.</p>
          <div class="trial-eka__suggestions">
            <button
              v-for="(s, idx) in defaultSuggestions"
              :key="idx"
              class="trial-eka__suggestion"
              @click="sendMessage(s.message)"
            >
              <v-icon :name="s.icon" scale="0.85" />
              <span>{{ s.label }}</span>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div v-else class="trial-eka__messages" ref="messagesContainer">
          <EkaMessage
            v-for="(msg, idx) in messages"
            :key="idx"
            :msg="msg"
            :isLast="idx === messages.length - 1"
            :isStreaming="isStreaming && idx === messages.length - 1"
          />
        </div>

        <!-- Exhausted CTA -->
        <div v-if="isExhausted && messages.length > 0" class="trial-eka__exhausted">
          <v-icon name="hi-sparkles" scale="1.1" />
          <h3>You've used all your trial messages!</h3>
          <p>Sign up for unlimited Eka conversations plus vitals tracking, prescription management, appointments, and more.</p>
          <div class="trial-eka__exhausted-btns">
            <router-link to="/signup/patient" class="trial-eka__btn trial-eka__btn--primary">
              Sign Up Now
            </router-link>
            <router-link :to="backRoute" class="trial-eka__btn trial-eka__btn--secondary">
              Back to Trial
            </router-link>
          </div>
        </div>

        <!-- Checkup answer buttons -->
        <div v-if="checkupQuestion && !isStreaming" class="trial-eka__answer-buttons">
          <template v-if="checkupQuestion.type === 'single'">
            <button class="trial-eka__answer-btn trial-eka__answer-btn--yes" @click="sendCheckupAnswer('Yes')">
              <v-icon name="hi-check" scale="0.75" /> Yes
            </button>
            <button class="trial-eka__answer-btn trial-eka__answer-btn--no" @click="sendCheckupAnswer('No')">
              <v-icon name="hi-x" scale="0.75" /> No
            </button>
            <button class="trial-eka__answer-btn trial-eka__answer-btn--unsure" @click="sendCheckupAnswer('Not sure')">
              Not sure
            </button>
          </template>

          <template v-else-if="checkupQuestion.type === 'group_single'">
            <button
              v-for="(item, idx) in checkupQuestion.items"
              :key="idx"
              class="trial-eka__answer-btn trial-eka__answer-btn--option"
              @click="sendCheckupAnswer(item.common_name || item.name)"
            >
              {{ item.common_name || item.name }}
            </button>
          </template>

          <template v-else-if="checkupQuestion.type === 'group_multiple'">
            <button
              v-for="(item, idx) in checkupQuestion.items"
              :key="idx"
              class="trial-eka__answer-btn trial-eka__answer-btn--toggle"
              :class="{ selected: multiSelectChoices.includes(item.common_name || item.name) }"
              @click="toggleMultiSelect(item.common_name || item.name)"
            >
              <v-icon :name="multiSelectChoices.includes(item.common_name || item.name) ? 'hi-check' : 'hi-plus'" scale="0.7" />
              {{ item.common_name || item.name }}
            </button>
            <button
              v-if="multiSelectChoices.length > 0"
              class="trial-eka__answer-btn trial-eka__answer-btn--submit"
              @click="submitMultiSelect"
            >
              Continue with {{ multiSelectChoices.length }} selected
            </button>
            <button
              class="trial-eka__answer-btn trial-eka__answer-btn--none"
              @click="sendCheckupAnswer('None')"
            >
              None of these
            </button>
          </template>
        </div>

        <!-- Quick suggestion chips -->
        <div v-if="messages.length > 0 && !isStreaming && !checkupQuestion && !isExhausted && contextSuggestions.length > 0" class="trial-eka__chips">
          <button
            v-for="(s, idx) in contextSuggestions"
            :key="idx"
            class="trial-eka__chip"
            @click="sendMessage(s.message)"
          >
            {{ s.label }}
          </button>
        </div>

        <!-- Input area -->
        <div v-if="!isExhausted" class="trial-eka__input-wrapper">
          <div class="trial-eka__input-box">
            <input
              ref="inputRef"
              v-model="inputText"
              type="text"
              placeholder="Ask Eka anything about health..."
              :disabled="isStreaming"
              @keydown.enter="handleSend"
            />
            <button
              class="trial-eka__send"
              :disabled="!inputText.trim() || isStreaming"
              @click="handleSend"
            >
              <v-icon name="hi-paper-airplane" scale="0.9" />
            </button>
          </div>
          <p class="trial-eka__disclaimer">
            Eka is not a doctor. Always consult a healthcare professional for medical advice.
          </p>
        </div>
      </div>

      <!-- Artifact panel -->
      <transition name="trial-artifact-slide">
        <div v-if="artifactOpen && artifact" class="trial-eka__artifact">
          <div class="trial-eka__artifact-header">
            <div class="trial-eka__artifact-title">
              <v-icon :name="artifactIcon" scale="0.85" />
              <span>{{ artifactTitle }}</span>
            </div>
            <button class="trial-eka__artifact-close" @click="artifactOpen = false">
              <v-icon name="hi-x" scale="0.85" />
            </button>
          </div>
          <div class="trial-eka__artifact-content">
            <EkaBodyAvatar
              v-if="artifactMode === 'avatar' && checkupSession"
              :session="checkupSession"
              @continue="onAvatarContinue"
            />
            <EkaCheckupReport
              v-else-if="artifactMode === 'report' && artifact.data"
              :data="artifact.data"
            />
            <EkaInteractionReport
              v-else-if="artifactMode === 'interactions' && artifact.data"
              :report="artifact.data"
            />
            <EkaScreeningReport
              v-else-if="artifactMode === 'screening_report' && artifact.data"
              :data="artifact.data"
            />
            <EkaCopingExercise
              v-else-if="artifactMode === 'coping_exercise' && artifact.data"
              :data="artifact.data"
            />
            <EkaSafetyPlan
              v-else-if="artifactMode === 'safety_plan' && artifact.data"
              :data="artifact.data"
            />
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import EkaMessage from '@/components/EkaChat/EkaMessage.vue'
import EkaCheckupReport from '@/components/EkaChat/EkaCheckupReport.vue'
import EkaBodyAvatar from '@/components/EkaChat/EkaBodyAvatar.vue'
import EkaInteractionReport from '@/components/EkaChat/EkaInteractionReport.vue'
import EkaScreeningReport from '@/components/EkaChat/EkaScreeningReport.vue'
import EkaCopingExercise from '@/components/EkaChat/EkaCopingExercise.vue'
import EkaSafetyPlan from '@/components/EkaChat/EkaSafetyPlan.vue'

export default {
  name: 'TrialEkaChat',
  components: { EkaMessage, EkaCheckupReport, EkaBodyAvatar, EkaInteractionReport, EkaScreeningReport, EkaCopingExercise, EkaSafetyPlan },
  data() {
    return {
      firstName: '',
      messages: [],
      inputText: '',
      isStreaming: false,
      isExhausted: false,
      messagesUsed: 0,
      messageLimit: 15,
      // Checkup
      checkupQuestion: null,
      checkupSession: null,
      multiSelectChoices: [],
      // Artifact
      artifact: null,
      artifactOpen: false,
      // Suggestions
      contextSuggestions: [],
      // Default welcome suggestions
      defaultSuggestions: [
        { label: 'Search for Paracetamol', message: 'Search for Paracetamol', icon: 'ri-search-line' },
        { label: 'Check drug interactions', message: 'Check interactions between Ibuprofen and Aspirin', icon: 'ri-capsule-line' },
        { label: 'Start a health checkup', message: 'I want to start a health checkup', icon: 'hi-heart' },
        { label: 'I need help with addiction', message: 'I am struggling with addiction and need support', icon: 'ri-heart-pulse-line' },
      ],
    }
  },

  computed: {
    messagesRemaining() {
      return Math.max(0, this.messageLimit - this.messagesUsed)
    },
    backRoute() {
      const token = sessionStorage.getItem('trial_token')
      return token ? `/trial/verify/${token}` : '/'
    },
    artifactMode() {
      if (!this.artifact) return null
      if (this.artifact.type === 'health_checkup_start') return 'avatar'
      if (this.artifact.type === 'health_checkup_report') return 'report'
      if (this.artifact.type === 'drug_interaction_report') return 'interactions'
      if (this.artifact.type === 'screening_report') return 'screening_report'
      if (this.artifact.type === 'coping_exercise') return 'coping_exercise'
      if (this.artifact.type === 'safety_plan') return 'safety_plan'
      return null
    },
    artifactIcon() {
      const map = {
        avatar: 'hi-user',
        report: 'hi-document-report',
        interactions: 'ri-capsule-line',
        screening_report: 'hi-clipboard-check',
        coping_exercise: 'ri-heart-pulse-line',
        safety_plan: 'hi-shield-check',
      }
      return map[this.artifactMode] || 'hi-document'
    },
    artifactTitle() {
      const map = {
        avatar: 'Body Diagram',
        report: 'Health Report',
        interactions: 'Interaction Report',
        screening_report: 'Screening Report',
        coping_exercise: 'Coping Exercise',
        safety_plan: 'Safety Plan',
      }
      return map[this.artifactMode] || 'Details'
    },
  },

  async mounted() {
    await this.loadEkaStatus()
    this.$nextTick(() => {
      if (this.$refs.inputRef) this.$refs.inputRef.focus()
    })
  },

  methods: {
    async loadEkaStatus() {
      try {
        const token = sessionStorage.getItem('trial_token')
        if (!token) return

        const baseURL = process.env.VUE_APP_API_GATEWAY || ''
        const res = await fetch(`${baseURL}/api/trial/eka/status`, {
          headers: { 'x-trial-token': token },
        })
        const json = await res.json()
        const data = json.data

        this.firstName = data.first_name || 'there'
        this.messagesUsed = data.messages_used || 0
        this.messageLimit = data.message_limit || 15
        this.isExhausted = data.eka_exhausted || false

        // Restore messages from history
        if (data.messages && data.messages.length > 0) {
          this.messages = data.messages.map((m) => ({
            role: m.role,
            content: m.content,
            tools_used: m.tools_used || [],
            created_at: m.created_at,
          }))
          this.$nextTick(() => this.scrollToBottom())
        }
      } catch (e) {
        console.error('Failed to load Eka status:', e)
      }
    },

    handleSend() {
      const text = this.inputText.trim()
      if (!text || this.isStreaming) return
      this.inputText = ''
      this.sendMessage(text)
    },

    sendCheckupAnswer(answer) {
      this.checkupQuestion = null
      this.multiSelectChoices = []
      this.sendMessage(answer)
    },

    toggleMultiSelect(name) {
      const idx = this.multiSelectChoices.indexOf(name)
      if (idx >= 0) {
        this.multiSelectChoices.splice(idx, 1)
      } else {
        this.multiSelectChoices.push(name)
      }
    },

    submitMultiSelect() {
      const answer = this.multiSelectChoices.join(', ')
      this.checkupQuestion = null
      this.multiSelectChoices = []
      this.sendMessage(answer)
    },

    onAvatarContinue() {
      // User clicked continue on body diagram — focus input
      if (this.$refs.inputRef) this.$refs.inputRef.focus()
    },

    async sendMessage(text) {
      // Clear UI state
      this.checkupQuestion = null
      this.contextSuggestions = []
      this.multiSelectChoices = []

      // Add user message
      this.messages.push({
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      })

      // Add assistant stub
      this.messages.push({
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
      })

      this.isStreaming = true
      this.$nextTick(() => this.scrollToBottom())

      let gotContent = false

      try {
        const token = sessionStorage.getItem('trial_token')
        const baseURL = process.env.VUE_APP_API_GATEWAY || ''

        const response = await fetch(`${baseURL}/api/trial/eka/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-trial-token': token,
          },
          body: JSON.stringify({ message: text }),
        })

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let sseBuffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          sseBuffer += decoder.decode(value, { stream: true })
          const lines = sseBuffer.split('\n')
          sseBuffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') continue

            try {
              const chunk = JSON.parse(payload)

              if (chunk.type === 'text') {
                gotContent = true
                this.appendToLast(chunk.content)
                this.scrollToBottom()
              } else if (chunk.type === 'message_count') {
                this.messagesUsed = chunk.messages_used
                this.messageLimit = chunk.message_limit
              } else if (chunk.type === 'exhausted') {
                this.isExhausted = true
                if (chunk.content) {
                  this.appendToLast('\n\n' + chunk.content)
                }
              } else if (chunk.type === 'error') {
                gotContent = true
                this.appendToLast(chunk.content || 'Something went wrong. Please try again.')
              } else if (chunk.type === 'artifact') {
                if (chunk.artifact_type === 'health_checkup_start') {
                  this.checkupSession = chunk.data
                  this.artifact = { type: 'health_checkup_start', data: chunk.data }
                  this.artifactOpen = true
                } else if (chunk.artifact_type === 'health_checkup_report') {
                  this.artifact = { type: 'health_checkup_report', data: chunk.data }
                  this.artifactOpen = true
                } else if (chunk.artifact_type === 'drug_interaction_report') {
                  this.artifact = { type: 'drug_interaction_report', data: chunk.data }
                  this.artifactOpen = true
                } else if (chunk.artifact_type === 'screening_report') {
                  this.artifact = { type: 'screening_report', data: chunk.data }
                  this.artifactOpen = true
                } else if (chunk.artifact_type === 'coping_exercise') {
                  this.artifact = { type: 'coping_exercise', data: chunk.data }
                  this.artifactOpen = true
                } else if (chunk.artifact_type === 'safety_plan') {
                  this.artifact = { type: 'safety_plan', data: chunk.data }
                  this.artifactOpen = true
                }
              } else if (chunk.type === 'clear_loading') {
                this.clearLastMessage()
              } else if (chunk.type === 'clear_artifact') {
                this.artifact = null
                this.artifactOpen = false
              } else if (chunk.type === 'checkup_question' && chunk.question) {
                this.checkupQuestion = chunk.question
              } else if (chunk.type === 'suggestions' && chunk.suggestions) {
                this.contextSuggestions = chunk.suggestions
              } else if (chunk.type === 'done') {
                // Stream complete
              }
            } catch {}
          }
        }

        if (!gotContent) {
          this.appendToLast("I wasn't able to respond just now. Please try again in a moment.")
        }
      } catch (error) {
        console.error('Trial Eka chat error:', error)
        if (!gotContent) {
          this.appendToLast("I'm having trouble connecting. Please try again shortly.")
        }
      } finally {
        this.isStreaming = false
        this.scrollToBottom()
      }
    },

    appendToLast(text) {
      if (this.messages.length > 0) {
        const last = this.messages[this.messages.length - 1]
        last.content += text
      }
    },

    clearLastMessage() {
      if (this.messages.length > 0) {
        this.messages[this.messages.length - 1].content = ''
      }
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    },
  },
}
</script>

<style scoped lang="scss">
$primary: #01579B;
$primary-light: #e0f2fe;
$emerald: #10b981;
$orange: #FF5C00;
$navy: #0f172a;
$gray: #64748b;
$bg: #f8fafc;

.trial-eka {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: $bg;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

// Nav
.trial-eka__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 12px 24px;
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  z-index: 10;
}

.trial-eka__logo img {
  height: 28px;
  width: auto;
}

.trial-eka__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: $primary;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  &:hover { text-decoration: underline; }
}

// Counter banner
.trial-eka__counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: $primary-light;
  color: $primary;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;

  &--warning {
    background: #fef3c7;
    color: #92400e;
  }

  &--exhausted {
    background: #fecaca;
    color: #991b1b;
  }
}

// Body
.trial-eka__body {
  display: flex;
  flex: 1;
  overflow: hidden;

  &--with-artifact {
    .trial-eka__main {
      flex: 1;
    }
  }
}

.trial-eka__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// Welcome
.trial-eka__welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  text-align: center;

  h2 {
    font-size: 28px;
    font-weight: 800;
    color: $navy;
    margin: 16px 0 8px;
  }

  p {
    font-size: 16px;
    color: $gray;
    max-width: 480px;
    line-height: 1.6;
    margin: 0 0 32px;
  }
}

.trial-eka__welcome-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);

  img {
    width: 48px;
    height: 48px;
    object-fit: contain;
  }
}

.trial-eka__suggestions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  max-width: 480px;
  width: 100%;

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.trial-eka__suggestion {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  font-size: 14px;
  color: $navy;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  .ov-icon { color: $primary; flex-shrink: 0; }

  &:hover {
    border-color: $primary;
    background: $primary-light;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($primary, 0.12);
  }
}

// Messages
.trial-eka__messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px 8px;
  scroll-behavior: smooth;
}

// Exhausted
.trial-eka__exhausted {
  text-align: center;
  padding: 32px 24px;
  margin: 12px 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);

  .ov-icon { color: $orange; }

  h3 {
    font-size: 20px;
    font-weight: 800;
    color: $navy;
    margin: 12px 0 8px;
  }

  p {
    font-size: 15px;
    color: $gray;
    line-height: 1.5;
    margin: 0 0 24px;
    max-width: 420px;
    margin-left: auto;
    margin-right: auto;
  }
}

.trial-eka__exhausted-btns {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.trial-eka__btn {
  display: inline-flex;
  align-items: center;
  padding: 12px 28px;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;

  &--primary {
    background: $orange;
    color: #fff;
    box-shadow: 0 4px 12px rgba($orange, 0.3);
    &:hover { background: darken($orange, 5%); transform: translateY(-2px); }
  }

  &--secondary {
    background: $navy;
    color: #fff;
    &:hover { background: lighten($navy, 5%); transform: translateY(-2px); }
  }
}

// Answer buttons
.trial-eka__answer-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px 4px;
  flex-wrap: wrap;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.trial-eka__answer-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: white;
  color: #374151;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;

  .ov-icon { flex-shrink: 0; }

  &:hover {
    border-color: $primary;
    background: #f0f9ff;
    color: $primary;
  }

  &--yes {
    border-color: #d1fae5;
    background: #ecfdf5;
    color: #065f46;
    .ov-icon { color: #10b981; fill: #10b981; }
    &:hover { border-color: #10b981; background: #d1fae5; }
  }

  &--no {
    border-color: #fecaca;
    background: #fef2f2;
    color: #991b1b;
    .ov-icon { color: #ef4444; fill: #ef4444; }
    &:hover { border-color: #ef4444; background: #fecaca; }
  }

  &--unsure {
    border-color: #e5e7eb;
    background: #f9fafb;
    color: #6b7280;
    &:hover { border-color: #9ca3af; background: #f3f4f6; }
  }

  &--option {
    border-color: #dbeafe;
    background: #eff6ff;
    color: #1e40af;
    &:hover { border-color: #3b82f6; background: #dbeafe; }
  }

  &--toggle {
    border-color: #e5e7eb;
    background: white;
    color: #374151;
    .ov-icon { color: #9ca3af; fill: #9ca3af; }

    &.selected {
      border-color: $primary;
      background: #e0f2fe;
      color: $primary;
      font-weight: 600;
      .ov-icon { color: $primary; fill: $primary; }
    }
  }

  &--submit {
    border-color: $primary;
    background: $primary;
    color: white;
    font-weight: 600;
    &:hover { background: darken($primary, 5%); }
  }

  &--none {
    border-color: #e5e7eb;
    background: #f9fafb;
    color: #6b7280;
    font-size: 12px;
    &:hover { border-color: #9ca3af; }
  }
}

// Chips
.trial-eka__chips {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  flex-wrap: wrap;
}

.trial-eka__chip {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  font-size: 13px;
  color: $navy;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: $primary;
    background: $primary-light;
    color: $primary;
  }
}

// Input
.trial-eka__input-wrapper {
  padding: 12px 16px 16px;
  flex-shrink: 0;
}

.trial-eka__input-box {
  display: flex;
  align-items: center;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 4px 8px 4px 16px;
  max-width: 900px;
  margin: 0 auto;
  transition: border-color 0.2s;

  &:focus-within {
    border-color: $primary;
  }

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 15px;
    padding: 12px 0;
    color: $navy;
    background: transparent;

    &::placeholder {
      color: #94a3b8;
    }
  }
}

.trial-eka__send {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: none;
  background: $primary;
  color: #fff;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: darken($primary, 5%);
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.trial-eka__disclaimer {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  margin: 8px 0 0;
}

// Artifact panel
.trial-eka__artifact {
  width: 420px;
  background: #fff;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  @media (max-width: 900px) {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    max-width: 420px;
    z-index: 50;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.15);
  }
}

.trial-eka__artifact-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.trial-eka__artifact-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: $navy;
  .ov-icon { color: $primary; }
}

.trial-eka__artifact-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: $gray;
  cursor: pointer;
  &:hover { background: #f1f5f9; color: $navy; }
}

.trial-eka__artifact-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

// Transitions
.trial-artifact-slide-enter-active,
.trial-artifact-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.trial-artifact-slide-enter-from,
.trial-artifact-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
