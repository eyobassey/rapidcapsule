<template>
  <div class="eka-fullscreen">
    <!-- Left Sidebar -->
    <div class="eka-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="eka-sidebar__top">
        <router-link to="/app/patient/dashboard" class="eka-sidebar__back">
          <v-icon name="hi-arrow-left" scale="0.9" />
          <span>Dashboard</span>
        </router-link>
        <button class="eka-sidebar__new" @click="startNewChat">
          <v-icon name="hi-plus" scale="0.85" />
          <span>New Chat</span>
        </button>
      </div>

      <div class="eka-sidebar__conversations">
        <div v-if="conversations.length === 0" class="eka-sidebar__empty">
          No conversations yet
        </div>
        <template v-for="group in groupedConversations" :key="group.label">
          <button class="eka-sidebar__group-toggle" @click="toggleGroup(group.label)">
            <v-icon name="hi-chevron-right" scale="0.6" class="eka-sidebar__group-chevron" :class="{ rotated: expandedGroups[group.label] }" />
            <span>{{ group.label }}</span>
            <span class="eka-sidebar__group-count">{{ group.items.length }}</span>
          </button>
          <template v-if="expandedGroups[group.label]">
            <div
              v-for="conv in visibleItems(group)"
              :key="conv._id"
              class="eka-sidebar__conv"
              :class="{ active: conv._id === conversationId }"
              @click="loadConversation(conv._id)"
            >
              <v-icon name="hi-chat" scale="0.75" />
              <!-- Inline edit mode -->
              <input
                v-if="editingConvId === conv._id"
                ref="editInput"
                v-model="editingTitle"
                class="eka-sidebar__conv-edit-input"
                @click.stop
                @keydown.enter="saveConvTitle(conv._id)"
                @keydown.esc="cancelEditConv"
                @blur="saveConvTitle(conv._id)"
              />
              <span v-else class="eka-sidebar__conv-title">{{ conv.title || 'Untitled' }}</span>
              <button
                v-if="editingConvId !== conv._id"
                class="eka-sidebar__conv-action"
                @click.stop="startEditConv(conv)"
                title="Rename"
              >
                <v-icon name="hi-pencil" scale="0.7" />
              </button>
              <button
                v-if="editingConvId !== conv._id"
                class="eka-sidebar__conv-action eka-sidebar__conv-action--delete"
                @click.stop="deleteConversation(conv._id)"
                title="Delete"
              >
                <v-icon name="hi-trash" scale="0.7" />
              </button>
            </div>
            <button
              v-if="group.items.length > 5"
              class="eka-sidebar__show-more"
              @click.stop="showAllGroups[group.label] = !showAllGroups[group.label]"
            >
              {{ showAllGroups[group.label] ? 'Show less' : `Show ${group.items.length - 5} more` }}
            </button>
          </template>
        </template>
      </div>

      <!-- Quick Actions -->
      <div class="eka-sidebar__actions">
        <button class="eka-sidebar__actions-toggle" @click="toggleQuickActions">
          <v-icon name="hi-lightning-bolt" scale="0.75" />
          <span>Quick Actions</span>
          <v-icon name="hi-chevron-down" scale="0.7" class="eka-sidebar__actions-chevron" :class="{ rotated: quickActionsOpen }" />
        </button>
        <div v-if="quickActionsOpen" class="eka-sidebar__actions-list">
          <button
            v-for="(action, idx) in quickActions"
            :key="idx"
            class="eka-sidebar__actions-item"
            @click="triggerQuickAction(action)"
          >
            <v-icon :name="action.icon" scale="0.75" />
            <span>{{ action.label }}</span>
          </button>
        </div>
      </div>

      <!-- Language selector -->
      <div class="eka-sidebar__lang">
        <v-icon name="hi-globe" scale="0.8" />
        <select
          :value="language"
          @change="setLanguage($event.target.value)"
        >
          <option v-for="lang in languages" :key="lang.code" :value="lang.label">
            {{ lang.flag }} {{ lang.label }}
          </option>
        </select>
      </div>

      <!-- Mobile toggle -->
      <button class="eka-sidebar__toggle" @click="sidebarCollapsed = !sidebarCollapsed">
        <v-icon :name="sidebarCollapsed ? 'io-menu' : 'hi-x'" scale="0.9" />
      </button>
    </div>

    <!-- Main Content Area (chat + artifact) -->
    <div class="eka-main">
      <!-- Mobile header -->
      <div class="eka-main__header-mobile">
        <button @click="sidebarCollapsed = !sidebarCollapsed">
          <v-icon name="io-menu" scale="0.9" />
        </button>
        <span>EkaGPT</span>
        <button v-if="artifactOpen" @click="toggleArtifact" class="eka-main__artifact-toggle-mobile">
          <v-icon name="hi-document-text" scale="0.9" />
        </button>
        <div v-else></div>
      </div>

      <div class="eka-main__row">
        <!-- Chat column -->
        <div class="eka-chat-area">
          <!-- Messages area -->
          <div class="eka-main__messages" ref="messagesContainer">
            <!-- Welcome screen -->
            <div v-if="messages.length === 0" class="eka-welcome">
              <div class="eka-welcome__avatar">
                <img src="/RapidCapsule_Logo.png" alt="EkaGPT" />
              </div>
              <h2 class="eka-welcome__title">Hi, I'm Eka!</h2>
              <p class="eka-welcome__subtitle">
                Your AI health companion. I can run health checkups, check drug interactions,
                review your vitals and prescriptions, search the pharmacy, and much more.
              </p>
              <div class="eka-welcome__suggestions">
                <button
                  v-for="(s, idx) in suggestions"
                  :key="idx"
                  class="eka-welcome__suggestion"
                  @click="sendSuggestion(s)"
                >
                  <v-icon :name="s.icon" scale="0.9" />
                  <span>{{ s.label }}</span>
                </button>
              </div>
            </div>

            <!-- Chat messages -->
            <div v-else class="eka-main__chat">
              <EkaMessage
                v-for="(msg, idx) in messages"
                :key="idx"
                :msg="msg"
                :is-last="idx === messages.length - 1"
                :is-streaming="isStreaming"
                @edit="editMessage"
                @retry="retryMessage"
              />
            </div>
          </div>

          <!-- Checkup answer buttons (shown during interview questions) -->
          <div v-if="checkupQuestion && !isStreaming" class="eka-main__answer-buttons">
            <!-- Single: Yes / No / Not sure -->
            <template v-if="checkupQuestion.type === 'single'">
              <button class="eka-main__answer-btn eka-main__answer-btn--yes" @click="sendCheckupAnswer('Yes')">
                <v-icon name="hi-check" scale="0.75" /> Yes
              </button>
              <button class="eka-main__answer-btn eka-main__answer-btn--no" @click="sendCheckupAnswer('No')">
                <v-icon name="hi-x" scale="0.75" /> No
              </button>
              <button class="eka-main__answer-btn eka-main__answer-btn--unsure" @click="sendCheckupAnswer('Not sure')">
                Not sure
              </button>
            </template>

            <!-- Group single: pick one option -->
            <template v-else-if="checkupQuestion.type === 'group_single'">
              <button
                v-for="(item, idx) in checkupQuestion.items"
                :key="idx"
                class="eka-main__answer-btn eka-main__answer-btn--option"
                @click="sendCheckupAnswer(item.common_name || item.name)"
              >
                {{ item.common_name || item.name }}
              </button>
            </template>

            <!-- Group multiple: toggle options + submit -->
            <template v-else-if="checkupQuestion.type === 'group_multiple'">
              <button
                v-for="(item, idx) in checkupQuestion.items"
                :key="idx"
                class="eka-main__answer-btn eka-main__answer-btn--toggle"
                :class="{ selected: multiSelectChoices.includes(item.common_name || item.name) }"
                @click="toggleMultiSelect(item.common_name || item.name)"
              >
                <v-icon :name="multiSelectChoices.includes(item.common_name || item.name) ? 'hi-check' : 'hi-plus'" scale="0.7" />
                {{ item.common_name || item.name }}
              </button>
              <button
                v-if="multiSelectChoices.length > 0"
                class="eka-main__answer-btn eka-main__answer-btn--submit"
                @click="submitMultiSelect"
              >
                Continue with {{ multiSelectChoices.length }} selected
              </button>
              <button
                class="eka-main__answer-btn eka-main__answer-btn--none"
                @click="sendCheckupAnswer('None')"
              >
                None of these
              </button>
            </template>
          </div>

          <!-- Quick suggestions (shown after messages exist but not streaming, and no checkup question) -->
          <div v-if="messages.length > 0 && !isStreaming && !checkupQuestion" class="eka-main__quick-chips">
            <button
              v-for="(s, idx) in quickChips"
              :key="idx"
              class="eka-main__chip"
              @click="sendSuggestion(s)"
            >
              {{ s.label }}
            </button>
          </div>

          <!-- Input area -->
          <div class="eka-main__input-wrapper">
            <div class="eka-main__input">
              <input
                ref="inputField"
                v-model="inputText"
                type="text"
                placeholder="Ask Eka anything..."
                :disabled="isStreaming"
                @keydown.enter="sendMessage"
              />
              <button
                class="eka-main__send"
                :disabled="!inputText.trim() || isStreaming"
                @click="sendMessage"
              >
                <v-icon name="hi-paper-airplane" scale="0.85" />
              </button>
            </div>
            <p class="eka-main__disclaimer">
              Eka is not a doctor. Always consult a healthcare professional for medical advice.
            </p>
          </div>
        </div>

        <!-- Artifact Panel -->
        <transition name="eka-artifact-slide">
          <div v-if="artifactOpen && artifact" class="eka-artifact" :class="{ 'mobile-overlay': isMobile }">
            <div class="eka-artifact__header">
              <div class="eka-artifact__header-title">
                <v-icon :name="artifactMode === 'report' ? 'hi-document-text' : artifactMode === 'interactions' ? 'ri-capsule-line' : 'hi-user'" scale="0.85" />
                <span>{{ artifactMode === 'report' ? 'Health Report' : artifactMode === 'interactions' ? 'Interaction Report' : 'Body Diagram' }}</span>
              </div>
              <button class="eka-artifact__close" @click="toggleArtifact">
                <v-icon name="hi-x" scale="0.85" />
              </button>
            </div>
            <div class="eka-artifact__content">
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
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import EkaMessage from './EkaMessage.vue'
import EkaCheckupReport from './EkaCheckupReport.vue'
import EkaBodyAvatar from './EkaBodyAvatar.vue'
import EkaInteractionReport from './EkaInteractionReport.vue'

export default {
  name: 'EkaChatPanel',
  components: { EkaMessage, EkaCheckupReport, EkaBodyAvatar, EkaInteractionReport },

  data() {
    return {
      inputText: '',
      sidebarCollapsed: false,
      isMobile: false,
      multiSelectChoices: [],
      editingConvId: null,
      editingTitle: '',
      expandedGroups: { Today: true },
      showAllGroups: {},
      quickActionsOpen: localStorage.getItem('eka_quick_actions_open') === 'true',
      quickActions: [
        { label: 'Health Checkup', message: 'Start a health checkup', icon: 'fa-stethoscope' },
        { label: 'Drug Interactions', message: 'Check my drug interactions', icon: 'ri-capsule-line' },
        { label: 'My Vitals', message: 'Show my recent vitals', icon: 'fa-heartbeat' },
        { label: 'Health Score', message: 'Show my health score', icon: 'hi-chart-bar' },
        { label: 'Prescriptions', message: 'Show my prescriptions', icon: 'hi-clipboard-list' },
        { label: 'Pharmacy', message: 'Search the pharmacy', icon: 'hi-shopping-bag' },
        { label: 'Appointments', message: 'Show my appointments', icon: 'ri-calendar-check-line' },
        { label: 'Wallet & Credits', message: 'Show my wallet and credits', icon: 'bi-wallet2' },
      ],
      suggestions: [
        { label: 'How are my vitals?', icon: 'hi-heart' },
        { label: "What's my health score?", icon: 'hi-chart-bar' },
        { label: 'Check my prescriptions', icon: 'ri-capsule-line' },
        { label: 'Track my orders', icon: 'hi-shopping-bag' },
        { label: 'Start a health checkup', icon: 'fa-stethoscope' },
        { label: 'Check drug interactions', icon: 'hi-beaker' },
        { label: 'Summarize my last appointment', icon: 'ri-calendar-check-line' },
      ],
      quickChips: [
        { label: 'My vitals' },
        { label: 'Health score' },
        { label: 'Health checkup' },
        { label: 'My prescriptions' },
        { label: 'Drug interactions' },
        { label: 'Wallet balance' },
      ],
      languages: [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'pcm', label: 'Pidgin', flag: '🇳🇬' },
        { code: 'yo', label: 'Yoruba', flag: '🇳🇬' },
        { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
        { code: 'ig', label: 'Igbo', flag: '🇳🇬' },
        { code: 'sw', label: 'Swahili', flag: '🇰🇪' },
        { code: 'ln', label: 'Lingala', flag: '🇨🇩' },
        { code: 'fr', label: 'French', flag: '🇫🇷' },
        { code: 'es', label: 'Spanish', flag: '🇪🇸' },
      ],
    }
  },

  computed: {
    ...mapGetters('eka', {
      messages: 'getMessages',
      conversationId: 'getConversationId',
      conversations: 'getConversations',
      isStreaming: 'isStreaming',
      language: 'getLanguage',
      artifact: 'getArtifact',
      artifactOpen: 'isArtifactOpen',
      checkupSession: 'getCheckupSession',
      checkupQuestion: 'getCheckupQuestion',
    }),
    artifactMode() {
      if (!this.artifact) return null
      if (this.artifact.type === 'health_checkup_report') return 'report'
      if (this.artifact.type === 'drug_interaction_report') return 'interactions'
      return 'avatar'
    },

    groupedConversations() {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)

      const groups = { Today: [], Yesterday: [], 'This Week': [], Older: [] }

      for (const conv of this.conversations) {
        const d = new Date(conv.updated_at || conv.created_at)
        if (d >= today) groups['Today'].push(conv)
        else if (d >= yesterday) groups['Yesterday'].push(conv)
        else if (d >= weekAgo) groups['This Week'].push(conv)
        else groups['Older'].push(conv)
      }

      return Object.entries(groups)
        .filter(([, items]) => items.length > 0)
        .map(([label, items]) => ({ label, items }))
    },
  },

  watch: {
    messages: {
      handler() {
        this.$nextTick(() => this.scrollToBottom())
      },
      deep: true,
    },
    isStreaming(val) {
      if (!val) {
        this.$nextTick(() => this.$refs.inputField?.focus())
      }
    },
  },

  mounted() {
    this.$store.dispatch('eka/fetchConversations')
    this.$nextTick(() => this.$refs.inputField?.focus())
    this.checkMobile()
    window.addEventListener('resize', this.checkMobile)
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.checkMobile)
  },

  methods: {
    async sendMessage() {
      const text = this.inputText.trim()
      if (!text || this.isStreaming) return
      this.inputText = ''
      await this.$store.dispatch('eka/sendMessage', text)
    },

    sendSuggestion(s) {
      this.inputText = s.label
      this.sendMessage()
    },

    toggleQuickActions() {
      this.quickActionsOpen = !this.quickActionsOpen
      localStorage.setItem('eka_quick_actions_open', String(this.quickActionsOpen))
    },

    triggerQuickAction(action) {
      this.inputText = action.message
      this.sendMessage()
      if (window.innerWidth <= 768) {
        this.sidebarCollapsed = true
      }
    },

    toggleGroup(label) {
      this.expandedGroups[label] = !this.expandedGroups[label]
    },

    visibleItems(group) {
      if (this.showAllGroups[group.label]) return group.items
      return group.items.slice(0, 5)
    },

    startNewChat() {
      this.$store.dispatch('eka/startNewChat')
      this.$nextTick(() => this.$refs.inputField?.focus())
    },

    loadConversation(id) {
      this.$store.dispatch('eka/loadConversation', id)
    },

    startEditConv(conv) {
      this.editingConvId = conv._id
      this.editingTitle = conv.title || ''
      this.$nextTick(() => {
        const input = this.$refs.editInput
        if (input) (Array.isArray(input) ? input[0] : input).focus()
      })
    },

    saveConvTitle(id) {
      const title = this.editingTitle.trim()
      if (title && this.editingConvId === id) {
        this.$store.dispatch('eka/renameConversation', { conversationId: id, title })
      }
      this.editingConvId = null
      this.editingTitle = ''
    },

    cancelEditConv() {
      this.editingConvId = null
      this.editingTitle = ''
    },

    deleteConversation(id) {
      this.$store.dispatch('eka/deleteConversation', id)
    },

    setLanguage(lang) {
      this.$store.dispatch('eka/setLanguage', lang)
    },

    editMessage(content) {
      this.inputText = content
      this.$nextTick(() => this.$refs.inputField?.focus())
    },

    retryMessage(content) {
      this.inputText = content
      this.sendMessage()
    },

    toggleArtifact() {
      this.$store.commit('eka/TOGGLE_ARTIFACT')
    },

    sendCheckupAnswer(answer) {
      this.inputText = answer
      this.multiSelectChoices = []
      this.sendMessage()
    },

    toggleMultiSelect(name) {
      const idx = this.multiSelectChoices.indexOf(name)
      if (idx === -1) {
        this.multiSelectChoices.push(name)
      } else {
        this.multiSelectChoices.splice(idx, 1)
      }
    },

    submitMultiSelect() {
      const answer = this.multiSelectChoices.join(', ')
      this.sendCheckupAnswer(answer)
    },

    onAvatarContinue(symptomNames) {
      const symptomList = symptomNames.join(', ')
      const message = `I've selected these symptoms from the body diagram: ${symptomList}. Please proceed with my health checkup.`
      this.$store.commit('eka/TOGGLE_ARTIFACT')
      this.inputText = message
      this.sendMessage()
    },

    checkMobile() {
      this.isMobile = window.innerWidth <= 768
    },

    scrollToBottom() {
      const el = this.$refs.messagesContainer
      if (el) el.scrollTop = el.scrollHeight
    },
  },
}
</script>

<style scoped lang="scss">
.eka-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  background: #ffffff;
}

// ===== SIDEBAR =====
.eka-sidebar {
  width: 260px;
  min-width: 260px;
  background: #01579B;
  color: #ffffff;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  position: relative;

  @media (max-width: 768px) {
    position: fixed;
    inset: 0;
    width: 280px;
    z-index: 1200;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);

    &.collapsed {
      transform: translateX(-100%);
    }
  }

  &__top {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }

  &__back {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    color: #ffffff !important;
    text-decoration: none;
    font-size: 14px;
    transition: background 0.15s;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff !important;
    }

    &:visited {
      color: #ffffff !important;
    }

    .ov-icon {
      color: #ffffff;
      fill: #ffffff;
      stroke: #ffffff;
    }

    span {
      font-size: 14px;
      color: #ffffff;
    }
  }

  &__new {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: transparent;
    color: #ffffff;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    .ov-icon {
      color: #ffffff;
      fill: #ffffff;
      stroke: #ffffff;
    }

    span {
      color: #ffffff;
    }
  }

  &__conversations {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
    }
  }

  &__empty {
    padding: 24px 12px;
    text-align: center;
    color: rgba(255, 255, 255, 0.55);
    font-size: 13px;
  }

  &__group-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 12px 4px;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: background 0.15s;
    border-radius: 6px;

    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }

    span {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.55);
      letter-spacing: 0.5px;
    }

    .ov-icon {
      color: rgba(255, 255, 255, 0.4);
      fill: rgba(255, 255, 255, 0.4);
      stroke: rgba(255, 255, 255, 0.4);
      flex-shrink: 0;
    }
  }

  &__group-chevron {
    transition: transform 0.2s ease;

    &.rotated {
      transform: rotate(90deg);
    }
  }

  &__group-count {
    margin-left: auto;
    background: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.6) !important;
    font-size: 10px !important;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
    text-transform: none !important;
    letter-spacing: 0 !important;
  }

  &__show-more {
    display: block;
    width: 100%;
    padding: 6px 12px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    cursor: pointer;
    text-align: left;
    padding-left: 30px;
    transition: color 0.15s;

    &:hover {
      color: rgba(255, 255, 255, 0.8);
    }
  }

  &__conv {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.9);
    transition: background 0.15s;

    &:hover {
      background: rgba(255, 255, 255, 0.12);

      .eka-sidebar__conv-action {
        opacity: 1;
      }
    }

    &.active {
      background: rgba(255, 255, 255, 0.12);
    }

    > .ov-icon {
      color: rgba(255, 255, 255, 0.55);
      fill: rgba(255, 255, 255, 0.55);
      stroke: rgba(255, 255, 255, 0.55);
      flex-shrink: 0;
    }
  }

  &__conv-title {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: rgba(255, 255, 255, 0.9);
  }

  &__conv-action {
    opacity: 0;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.55);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    font-size: 14px;
    transition: all 0.15s;
    flex-shrink: 0;

    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.15);
    }

    &--delete:hover {
      color: #f38ba8;
      background: rgba(243, 139, 168, 0.1);
    }
  }

  &__conv-edit-input {
    flex: 1;
    min-width: 0;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    color: #fff;
    font-size: 13px;
    padding: 2px 6px;
    outline: none;

    &:focus {
      border-color: rgba(255, 255, 255, 0.5);
    }
  }

  &__actions {
    border-top: 1px solid rgba(255, 255, 255, 0.15);
  }

  &__actions-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 16px;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.9);
    }

    .ov-icon {
      color: rgba(255, 255, 255, 0.55);
      fill: rgba(255, 255, 255, 0.55);
      stroke: rgba(255, 255, 255, 0.55);
      flex-shrink: 0;
    }

    span {
      flex: 1;
      text-align: left;
      color: rgba(255, 255, 255, 0.7);
    }
  }

  &__actions-chevron {
    transition: transform 0.2s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }

  &__actions-list {
    padding: 0 8px 8px;
  }

  &__actions-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 12px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;
    text-align: left;

    &:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    .ov-icon {
      color: rgba(255, 255, 255, 0.55);
      fill: rgba(255, 255, 255, 0.55);
      stroke: rgba(255, 255, 255, 0.55);
      flex-shrink: 0;
    }

    span {
      color: rgba(255, 255, 255, 0.85);
    }
  }

  &__lang {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);

    .ov-icon {
      color: rgba(255, 255, 255, 0.6);
      fill: rgba(255, 255, 255, 0.6);
      stroke: rgba(255, 255, 255, 0.6);
      flex-shrink: 0;
    }

    select {
      flex: 1;
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 13px;
      cursor: pointer;
      outline: none;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
      padding-right: 28px;

      &:hover {
        border-color: rgba(255, 255, 255, 0.4);
        background-color: rgba(255, 255, 255, 0.15);
      }

      &:focus {
        border-color: #FF5C00;
      }

      option {
        background: #01579B;
        color: #ffffff;
      }
    }
  }

  &__toggle {
    display: none;

    @media (max-width: 768px) {
      display: flex;
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 1201;
      width: 36px;
      height: 36px;
      align-items: center;
      justify-content: center;
      background: #01579B;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 18px;
    }
  }
}

// ===== MAIN CHAT AREA =====
.eka-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #ffffff;

  &__header-mobile {
    display: none;

    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;

      button {
        background: none;
        border: none;
        font-size: 20px;
        color: #374151;
        cursor: pointer;
      }

      span {
        font-weight: 600;
        font-size: 16px;
        color: #1f2937;
      }
    }
  }

  &__artifact-toggle-mobile {
    color: #01579B !important;
  }

  &__row {
    flex: 1;
    display: flex;
    min-height: 0;
  }

  &__messages {
    flex: 1;
    overflow-y: auto;
    padding: 0;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }
  }

  &__chat {
    max-width: 900px;
    margin: 0 auto;
    padding: 24px 16px;
  }

  // ===== CHECKUP ANSWER BUTTONS =====
  &__answer-buttons {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 8px 16px 4px;
    flex-wrap: wrap;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }

  &__answer-btn {
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
      border-color: #01579B;
      background: #f0f9ff;
      color: #01579B;
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
        border-color: #01579B;
        background: #e0f2fe;
        color: #01579B;
        font-weight: 600;
        .ov-icon { color: #01579B; fill: #01579B; }
      }
    }

    &--submit {
      border-color: #01579B;
      background: #01579B;
      color: white;
      font-weight: 600;
      &:hover { background: #014377; }
    }

    &--none {
      border-color: #e5e7eb;
      background: #f9fafb;
      color: #6b7280;
      font-size: 12px;
      &:hover { border-color: #9ca3af; }
    }
  }

  &__quick-chips {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding: 8px 16px;
    flex-wrap: wrap;
  }

  &__chip {
    padding: 6px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    background: white;
    color: #6b7280;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      border-color: #FF5C00;
      color: #FF5C00;
      background: #FFF3ED;
    }
  }

  &__input-wrapper {
    padding: 12px 16px 16px;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }

  &__input {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #d1d5db;
    border-radius: 24px;
    padding: 4px 4px 4px 20px;
    background: white;
    transition: border-color 0.2s, box-shadow 0.2s;

    &:focus-within {
      border-color: #FF5C00;
      box-shadow: 0 0 0 3px rgba(255, 92, 0, 0.1);
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 15px;
      padding: 10px 0;
      background: transparent;

      &::placeholder {
        color: #9ca3af;
      }

      &:disabled {
        color: #9ca3af;
      }
    }
  }

  &__send {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: #FF5C00;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background: #E04F00;
    }

    &:disabled {
      background: #e5e7eb;
      color: #9ca3af;
      cursor: not-allowed;
    }
  }

  &__disclaimer {
    text-align: center;
    font-size: 11px;
    color: #9ca3af;
    margin: 8px 0 0;
  }
}

// ===== CHAT AREA (inside row) =====
.eka-chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

// ===== ARTIFACT PANEL =====
.eka-artifact {
  width: 420px;
  min-width: 420px;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  background: #ffffff;

  @media (max-width: 1024px) {
    width: 360px;
    min-width: 360px;
  }

  &.mobile-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    min-width: unset;
    z-index: 1300;
    border-left: none;
    box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  &__header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;

    .ov-icon {
      color: #01579B;
      fill: #01579B;
    }
  }

  &__close {
    background: none;
    border: none;
    color: #6b7280;
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;

    &:hover {
      background: #f3f4f6;
      color: #374151;
    }
  }

  &__content {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }
}

// ===== ARTIFACT SLIDE TRANSITION =====
.eka-artifact-slide-enter-active,
.eka-artifact-slide-leave-active {
  transition: all 0.3s ease;
}
.eka-artifact-slide-enter-from,
.eka-artifact-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

// ===== WELCOME SCREEN =====
.eka-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  min-height: 100%;

  &__avatar {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

  &__title {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 8px;
  }

  &__subtitle {
    font-size: 15px;
    color: #6b7280;
    line-height: 1.6;
    margin: 0 0 32px;
    max-width: 480px;
  }

  &__suggestions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    max-width: 520px;
    width: 100%;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  &__suggestion {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    color: #374151;
    font-size: 14px;
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;

    .ov-icon {
      color: #FF5C00;
      flex-shrink: 0;
    }

    &:hover {
      border-color: #FF5C00;
      background: #FFF3ED;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(255, 92, 0, 0.1);
    }
  }
}
</style>
