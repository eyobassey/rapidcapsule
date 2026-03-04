<template>
  <div class="trial-eka">
    <!-- Sidebar -->
    <div class="trial-eka__sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="trial-eka__sidebar-top">
        <router-link to="/" class="trial-eka__sidebar-back">
          <v-icon name="hi-arrow-left" scale="0.9" />
          <span>Back to Home</span>
        </router-link>
        <button class="trial-eka__sidebar-new" @click="startNewChat">
          <v-icon name="hi-plus" scale="0.85" />
          <span>New Chat</span>
        </button>
      </div>

      <div class="trial-eka__sidebar-convos">
        <div v-if="conversations.length === 0" class="trial-eka__sidebar-empty">
          No conversations yet
        </div>
        <template v-for="group in groupedConversations" :key="group.label">
          <button class="trial-eka__sidebar-group" @click="toggleGroup(group.label)">
            <v-icon name="hi-chevron-right" scale="0.6" class="trial-eka__sidebar-chevron" :class="{ rotated: expandedGroups[group.label] }" />
            <span>{{ group.label }}</span>
            <span class="trial-eka__sidebar-count">{{ group.items.length }}</span>
          </button>
          <template v-if="expandedGroups[group.label]">
            <div
              v-for="conv in group.items"
              :key="conv._id"
              class="trial-eka__sidebar-conv"
              :class="{ active: conv._id === conversationId }"
              @click="loadConversation(conv._id)"
            >
              <v-icon name="hi-chat" scale="0.75" />
              <input
                v-if="editingConvId === conv._id"
                v-model="editingTitle"
                class="trial-eka__sidebar-edit"
                @click.stop
                @keydown.enter="saveConvTitle(conv._id)"
                @keydown.esc="cancelEditConv"
                @blur="saveConvTitle(conv._id)"
              />
              <span v-else class="trial-eka__sidebar-title">{{ conv.title || 'Untitled' }}</span>
              <button v-if="editingConvId !== conv._id" class="trial-eka__sidebar-action" @click.stop="startEditConv(conv)" title="Rename">
                <v-icon name="hi-pencil" scale="0.7" />
              </button>
              <button v-if="editingConvId !== conv._id" class="trial-eka__sidebar-action trial-eka__sidebar-action--delete" @click.stop="deleteConversation(conv._id)" title="Delete">
                <v-icon name="hi-trash" scale="0.7" />
              </button>
            </div>
          </template>
        </template>
      </div>

      <!-- Quick Actions -->
      <div class="trial-eka__sidebar-actions">
        <button class="trial-eka__sidebar-actions-toggle" @click="quickActionsOpen = !quickActionsOpen">
          <v-icon name="hi-lightning-bolt" scale="0.75" />
          <span>Quick Actions</span>
          <v-icon name="hi-chevron-down" scale="0.7" class="trial-eka__sidebar-chevron" :class="{ rotated: quickActionsOpen }" />
        </button>
        <div v-if="quickActionsOpen" class="trial-eka__sidebar-actions-list">
          <button
            v-for="(action, idx) in quickActions"
            :key="idx"
            class="trial-eka__sidebar-actions-item"
            @click="triggerQuickAction(action)"
          >
            <v-icon :name="action.icon" scale="0.75" />
            <span>{{ action.label }}</span>
          </button>
        </div>
      </div>

      <!-- Language selector -->
      <div class="trial-eka__sidebar-lang">
        <v-icon name="hi-globe" scale="0.8" />
        <select v-model="language" @change="onLanguageChange">
          <option v-for="lang in languages" :key="lang.code" :value="lang.label">
            {{ lang.flag }} {{ lang.label }}
          </option>
        </select>
      </div>

      <!-- Mobile toggle -->
      <button class="trial-eka__sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed">
        <v-icon :name="sidebarCollapsed ? 'io-menu' : 'hi-x'" scale="0.9" />
      </button>
    </div>

    <!-- Main Content -->
    <div class="trial-eka__content">
      <!-- Mobile header -->
      <div class="trial-eka__mobile-header">
        <button @click="sidebarCollapsed = !sidebarCollapsed">
          <v-icon name="io-menu" scale="0.9" />
        </button>
        <span>Eka AI</span>
        <button v-if="artifactOpen" @click="artifactOpen = false" class="trial-eka__mobile-artifact-btn">
          <v-icon name="hi-document-text" scale="0.9" />
        </button>
        <div v-else></div>
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
              <img src="/eka-rc-logo-icon.png" alt="Eka" />
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
              <router-link to="/" class="trial-eka__btn trial-eka__btn--secondary">
                Back to Home
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
            <!-- File preview -->
            <div v-if="attachedFile" class="trial-eka__file-preview">
              <div class="trial-eka__file-info">
                <img v-if="attachedPreview" :src="attachedPreview" class="trial-eka__file-thumb" />
                <v-icon v-else name="hi-document" scale="1.2" class="trial-eka__file-icon" />
                <div class="trial-eka__file-meta">
                  <span class="trial-eka__file-name">{{ attachedFile.name }}</span>
                  <span class="trial-eka__file-size">{{ formatFileSize(attachedFile.size) }}</span>
                </div>
              </div>
              <button class="trial-eka__file-remove" @click="removeAttachment">
                <v-icon name="hi-x" scale="0.8" />
              </button>
            </div>
            <div class="trial-eka__input-box">
              <button class="trial-eka__attach" :disabled="isStreaming || isUploading" @click="triggerFileInput">
                <v-icon name="hi-paper-clip" scale="0.95" />
              </button>
              <input type="file" ref="fileInput" class="trial-eka__file-hidden" accept="image/jpeg,image/png,image/webp,application/pdf" @change="handleFileSelect" />
              <input
                ref="inputRef"
                v-model="inputText"
                type="text"
                placeholder="Ask Eka anything about health..."
                :disabled="isStreaming || isUploading"
                @keydown.enter="handleSend"
              />
              <button
                class="trial-eka__send"
                :disabled="(!inputText.trim() && !attachedFile) || isStreaming || isUploading"
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
                :trial-token="trialToken"
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
      // Conversations
      conversationId: null,
      conversations: [],
      // Sidebar
      sidebarCollapsed: window.innerWidth < 768,
      expandedGroups: { Today: true, 'Previous 7 Days': true },
      editingConvId: null,
      editingTitle: '',
      quickActionsOpen: true,
      // Language
      language: localStorage.getItem('eka_trial_language') || 'English',
      languages: [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'pcm', label: 'Pidgin', flag: '🇳🇬' },
        { code: 'yo', label: 'Yoruba', flag: '🇳🇬' },
        { code: 'ha', label: 'Hausa', flag: '🇳🇬' },
        { code: 'ig', label: 'Igbo', flag: '🇳🇬' },
        { code: 'fr', label: 'French', flag: '🇫🇷' },
      ],
      // Quick actions
      quickActions: [
        { label: 'Health Checkup', message: 'Start a health checkup', icon: 'fa-stethoscope' },
        { label: 'Drug Interactions', message: 'Check my drug interactions', icon: 'ri-capsule-line' },
        { label: 'Search Pharmacy', message: 'Search the pharmacy', icon: 'hi-shopping-bag' },
        { label: 'Upload Prescription', message: null, icon: 'hi-upload', action: 'upload_prescription' },
        { label: 'Addiction Support', message: 'I need help with addiction recovery', icon: 'hi-heart' },
      ],
      // Checkup
      checkupQuestion: null,
      checkupSession: null,
      multiSelectChoices: [],
      // Artifact
      artifact: null,
      artifactOpen: false,
      // Suggestions
      contextSuggestions: [],
      // File upload
      attachedFile: null,
      attachedPreview: null,
      isUploading: false,
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
      const map = { avatar: 'hi-user', report: 'hi-document-report', interactions: 'ri-capsule-line', screening_report: 'hi-clipboard-check', coping_exercise: 'ri-heart-pulse-line', safety_plan: 'hi-shield-check' }
      return map[this.artifactMode] || 'hi-document'
    },
    artifactTitle() {
      const map = { avatar: 'Body Diagram', report: 'Health Report', interactions: 'Interaction Report', screening_report: 'Screening Report', coping_exercise: 'Coping Exercise', safety_plan: 'Safety Plan' }
      return map[this.artifactMode] || 'Details'
    },
    trialToken() {
      return sessionStorage.getItem('trial_token') || ''
    },
    groupedConversations() {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const groups = { Today: [], 'Previous 7 Days': [], Older: [] }
      for (const c of this.conversations) {
        const d = new Date(c.updated_at)
        if (d >= today) groups.Today.push(c)
        else if (d >= weekAgo) groups['Previous 7 Days'].push(c)
        else groups.Older.push(c)
      }
      return Object.entries(groups).filter(([, items]) => items.length > 0).map(([label, items]) => ({ label, items }))
    },
  },

  async mounted() {
    await this.loadEkaStatus()
    this.$nextTick(() => {
      if (this.$refs.inputRef) this.$refs.inputRef.focus()
    })
  },

  methods: {
    getTrialHeaders() {
      return { 'x-trial-token': sessionStorage.getItem('trial_token') || '' }
    },

    async loadEkaStatus() {
      try {
        const token = sessionStorage.getItem('trial_token')
        if (!token) return

        const baseURL = process.env.VUE_APP_API_GATEWAY || ''
        // Load status (with conversations list)
        const url = this.conversationId
          ? `${baseURL}/api/trial/eka/status?conversation_id=${this.conversationId}`
          : `${baseURL}/api/trial/eka/status`
        const res = await fetch(url, { headers: this.getTrialHeaders() })
        const json = await res.json()
        const data = json.data

        this.firstName = data.first_name || 'there'
        this.messagesUsed = data.messages_used || 0
        this.messageLimit = data.message_limit || 15
        this.isExhausted = data.eka_exhausted || false
        this.conversations = data.conversations || []

        // If no conversation selected but conversations exist, load most recent
        if (!this.conversationId && this.conversations.length > 0) {
          await this.loadConversation(this.conversations[0]._id)
          return
        }

        // Restore messages if loading a specific conversation
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

    async loadConversations() {
      try {
        const baseURL = process.env.VUE_APP_API_GATEWAY || ''
        const res = await fetch(`${baseURL}/api/trial/eka/conversations`, { headers: this.getTrialHeaders() })
        const json = await res.json()
        this.conversations = json.data || []
      } catch (e) {
        console.error('Failed to load conversations:', e)
      }
    },

    async loadConversation(id) {
      this.conversationId = id
      this.messages = []
      this.checkupQuestion = null
      this.contextSuggestions = []
      this.artifact = null
      this.artifactOpen = false

      try {
        const baseURL = process.env.VUE_APP_API_GATEWAY || ''
        const res = await fetch(`${baseURL}/api/trial/eka/status?conversation_id=${id}`, { headers: this.getTrialHeaders() })
        const json = await res.json()
        const data = json.data

        this.messagesUsed = data.messages_used || 0
        this.messageLimit = data.message_limit || 15
        this.isExhausted = data.eka_exhausted || false

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
        console.error('Failed to load conversation:', e)
      }

      // Close sidebar on mobile after selecting
      if (window.innerWidth < 768) this.sidebarCollapsed = true
    },

    async startNewChat() {
      this.conversationId = null
      this.messages = []
      this.checkupQuestion = null
      this.contextSuggestions = []
      this.artifact = null
      this.artifactOpen = false
      if (window.innerWidth < 768) this.sidebarCollapsed = true
      this.$nextTick(() => { if (this.$refs.inputRef) this.$refs.inputRef.focus() })
    },

    startEditConv(conv) {
      this.editingConvId = conv._id
      this.editingTitle = conv.title || ''
      this.$nextTick(() => {
        const input = this.$el.querySelector('.trial-eka__sidebar-edit')
        if (input) input.focus()
      })
    },

    cancelEditConv() {
      this.editingConvId = null
      this.editingTitle = ''
    },

    async saveConvTitle(id) {
      if (!this.editingTitle.trim()) {
        this.cancelEditConv()
        return
      }
      try {
        const baseURL = process.env.VUE_APP_API_GATEWAY || ''
        await fetch(`${baseURL}/api/trial/eka/conversations/${id}`, {
          method: 'PATCH',
          headers: { ...this.getTrialHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: this.editingTitle.trim() }),
        })
        const conv = this.conversations.find((c) => c._id === id)
        if (conv) conv.title = this.editingTitle.trim()
      } catch (e) {
        console.error('Failed to rename:', e)
      }
      this.cancelEditConv()
    },

    async deleteConversation(id) {
      try {
        const baseURL = process.env.VUE_APP_API_GATEWAY || ''
        await fetch(`${baseURL}/api/trial/eka/conversations/${id}`, {
          method: 'DELETE',
          headers: this.getTrialHeaders(),
        })
        this.conversations = this.conversations.filter((c) => c._id !== id)
        if (this.conversationId === id) {
          if (this.conversations.length > 0) {
            await this.loadConversation(this.conversations[0]._id)
          } else {
            this.startNewChat()
          }
        }
      } catch (e) {
        console.error('Failed to delete:', e)
      }
    },

    toggleGroup(label) {
      this.expandedGroups[label] = !this.expandedGroups[label]
    },

    onLanguageChange() {
      localStorage.setItem('eka_trial_language', this.language)
    },

    triggerQuickAction(action) {
      if (action.action === 'upload_prescription') {
        if (this.messages.length === 0) {
          this.messages.push({
            role: 'assistant',
            content: "I can analyze your prescription and check medication availability and pricing across our pharmacy. Just attach a prescription image or PDF using the button below — I'll extract the medications, match them to our inventory, and show you estimated costs.\n\nSupported formats: **JPEG, PNG, WebP, or PDF** (up to 10MB).",
            created_at: new Date().toISOString(),
          })
        }
        this.triggerFileInput()
        if (window.innerWidth < 768) this.sidebarCollapsed = true
        return
      }
      if (action.message) {
        if (window.innerWidth < 768) this.sidebarCollapsed = true
        this.sendMessage(action.message)
      }
    },

    // File upload
    triggerFileInput() {
      this.$refs.fileInput?.click()
    },

    handleFileSelect(event) {
      const file = event.target.files?.[0]
      if (!file) return
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowed.includes(file.type)) {
        alert('Please select a JPEG, PNG, WebP, or PDF file.')
        event.target.value = ''
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File is too large. Maximum size is 10MB.')
        event.target.value = ''
        return
      }
      this.attachedFile = file
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => { this.attachedPreview = e.target.result }
        reader.readAsDataURL(file)
      } else {
        this.attachedPreview = null
      }
      event.target.value = ''
    },

    removeAttachment() {
      this.attachedFile = null
      this.attachedPreview = null
    },

    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B'
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    },

    handleSend() {
      const text = this.inputText.trim()
      const hasFile = !!this.attachedFile
      if ((!text && !hasFile) || this.isStreaming || this.isUploading) return
      this.inputText = ''
      if (hasFile) {
        this.uploadAndSend(text)
      } else {
        this.sendMessage(text)
      }
    },

    async uploadAndSend(text) {
      this.isUploading = true
      try {
        const token = sessionStorage.getItem('trial_token')
        const baseURL = process.env.VUE_APP_API_GATEWAY || ''
        const formData = new FormData()
        formData.append('prescription', this.attachedFile)

        const res = await fetch(`${baseURL}/api/trial/prescription/upload`, {
          method: 'POST',
          headers: { 'x-trial-token': token },
          body: formData,
        })
        const json = await res.json()
        const upload = json.data || json.result || json
        const uploadId = upload.uploadId || upload._id
        const filename = this.attachedFile.name

        this.removeAttachment()
        this.isUploading = false

        const message = text
          ? `${text}\n\n[Prescription uploaded: ${filename}, Upload ID: ${uploadId}]`
          : `I've uploaded a prescription image. Please analyze it.\n\n[Prescription uploaded: ${filename}, Upload ID: ${uploadId}]`
        this.sendMessage(message)
      } catch (e) {
        console.error('Upload failed:', e)
        this.isUploading = false
        alert('Failed to upload prescription. Please try again.')
      }
    },

    sendCheckupAnswer(answer) {
      this.checkupQuestion = null
      this.multiSelectChoices = []
      this.sendMessage(answer)
    },

    toggleMultiSelect(name) {
      const idx = this.multiSelectChoices.indexOf(name)
      if (idx >= 0) this.multiSelectChoices.splice(idx, 1)
      else this.multiSelectChoices.push(name)
    },

    submitMultiSelect() {
      const answer = this.multiSelectChoices.join(', ')
      this.checkupQuestion = null
      this.multiSelectChoices = []
      this.sendMessage(answer)
    },

    onAvatarContinue(symptomNames) {
      if (!symptomNames || !symptomNames.length) {
        if (this.$refs.inputRef) this.$refs.inputRef.focus()
        return
      }
      const symptomList = symptomNames.join(', ')
      const message = `I've selected these symptoms from the body diagram: ${symptomList}. Please proceed with my health checkup.`
      this.artifact = null
      this.sendMessage(message)
    },

    async sendMessage(text) {
      this.checkupQuestion = null
      this.contextSuggestions = []
      this.multiSelectChoices = []

      this.messages.push({ role: 'user', content: text, created_at: new Date().toISOString() })
      this.messages.push({ role: 'assistant', content: '', created_at: new Date().toISOString() })

      this.isStreaming = true
      this.$nextTick(() => this.scrollToBottom())

      let gotContent = false

      try {
        const token = sessionStorage.getItem('trial_token')
        const baseURL = process.env.VUE_APP_API_GATEWAY || ''

        const response = await fetch(`${baseURL}/api/trial/eka/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-trial-token': token },
          body: JSON.stringify({
            message: text,
            language: this.language,
            conversation_id: this.conversationId || undefined,
          }),
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
                if (chunk.content) this.appendToLast('\n\n' + chunk.content)
              } else if (chunk.type === 'error') {
                gotContent = true
                this.appendToLast(chunk.content || 'Something went wrong. Please try again.')
              } else if (chunk.type === 'artifact') {
                this.artifact = { type: chunk.artifact_type, data: chunk.data }
                this.artifactOpen = true
                if (chunk.artifact_type === 'health_checkup_start') this.checkupSession = chunk.data
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
                // Capture conversation_id from response
                if (chunk.conversation_id && !this.conversationId) {
                  this.conversationId = chunk.conversation_id
                }
                // Refresh conversation list
                this.loadConversations()
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
      if (this.messages.length > 0) this.messages[this.messages.length - 1].content += text
    },

    clearLastMessage() {
      if (this.messages.length > 0) this.messages[this.messages.length - 1].content = ''
    },

    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer
        if (container) container.scrollTop = container.scrollHeight
      })
    },
  },
}
</script>

<style scoped lang="scss">
$orange: #FF5C00;
$navy: #0f172a;
$text-primary: #f8fafc;
$text-secondary: #94a3b8;
$text-muted: #64748b;
$cyan: #0ea5e9;
$surface: rgba(15, 23, 42, 0.6);
$border: rgba(255, 255, 255, 0.1);

.trial-eka {
  display: flex;
  height: 100vh;
  background: $navy;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

  * { color: $text-primary; }
}

// ===== SIDEBAR =====
.trial-eka__sidebar {
  width: 280px;
  min-width: 280px;
  background: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-right: 1px solid $border;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;

  @media (max-width: 768px) {
    position: fixed;
    inset: 0;
    width: 280px;
    z-index: 1200;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);

    &.collapsed {
      transform: translateX(-100%);
    }
  }
}

.trial-eka__sidebar-top {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-bottom: 1px solid $border;
}

.trial-eka__sidebar-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  color: #ffffff !important;
  text-decoration: none;
  font-size: 14px;
  transition: background 0.15s;

  &:hover { background: rgba(255, 255, 255, 0.12); }

  .ov-icon { color: #fff; fill: #fff; stroke: #fff; }
  span { color: #fff; }
}

.trial-eka__sidebar-new {
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

  &:hover { background: rgba(255, 255, 255, 0.12); }

  .ov-icon { color: #fff; fill: #fff; stroke: #fff; }
  span { color: #fff; }
}

.trial-eka__sidebar-convos {
  flex: 1;
  overflow-y: auto;
  padding: 8px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.3); border-radius: 2px; }
}

.trial-eka__sidebar-empty {
  padding: 24px 12px;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
  font-size: 13px;
}

.trial-eka__sidebar-group {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 6px;

  &:hover { background: rgba(255, 255, 255, 0.06); }

  span {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
    letter-spacing: 0.5px;
  }

  .ov-icon { color: rgba(255, 255, 255, 0.4); fill: rgba(255, 255, 255, 0.4); stroke: rgba(255, 255, 255, 0.4); flex-shrink: 0; }
}

.trial-eka__sidebar-chevron {
  transition: transform 0.2s ease;
  &.rotated { transform: rotate(90deg); }
}

.trial-eka__sidebar-count {
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

.trial-eka__sidebar-conv {
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
    .trial-eka__sidebar-action { opacity: 1; }
  }

  &.active { background: rgba(255, 255, 255, 0.12); }

  > .ov-icon { color: rgba(255, 255, 255, 0.55); fill: rgba(255, 255, 255, 0.55); stroke: rgba(255, 255, 255, 0.55); flex-shrink: 0; }
}

.trial-eka__sidebar-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.9);
}

.trial-eka__sidebar-edit {
  flex: 1;
  min-width: 0;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  padding: 2px 6px;
  outline: none;

  &:focus { border-color: rgba(255, 255, 255, 0.5); }
}

.trial-eka__sidebar-action {
  opacity: 0;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover { color: #fff; background: rgba(255, 255, 255, 0.15); }
  &--delete:hover { color: #f38ba8; background: rgba(243, 139, 168, 0.1); }
}

// Quick Actions
.trial-eka__sidebar-actions {
  border-top: 1px solid $border;
}

.trial-eka__sidebar-actions-toggle {
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
  transition: background 0.15s;

  &:hover { background: rgba(255, 255, 255, 0.08); color: rgba(255, 255, 255, 0.9); }

  .ov-icon { color: rgba(255, 255, 255, 0.55); fill: rgba(255, 255, 255, 0.55); stroke: rgba(255, 255, 255, 0.55); flex-shrink: 0; }
  span { flex: 1; text-align: left; color: rgba(255, 255, 255, 0.7); }

  .trial-eka__sidebar-chevron { &.rotated { transform: rotate(180deg); } }
}

.trial-eka__sidebar-actions-list {
  padding: 0 8px 8px;
}

.trial-eka__sidebar-actions-item {
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

  &:hover { background: rgba(255, 255, 255, 0.12); }

  .ov-icon { color: rgba(255, 255, 255, 0.55); fill: rgba(255, 255, 255, 0.55); stroke: rgba(255, 255, 255, 0.55); flex-shrink: 0; }
  span { color: rgba(255, 255, 255, 0.85); }
}

// Language
.trial-eka__sidebar-lang {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid $border;

  .ov-icon { color: rgba(255, 255, 255, 0.6); fill: rgba(255, 255, 255, 0.6); stroke: rgba(255, 255, 255, 0.6); flex-shrink: 0; }

  select {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    padding: 6px 28px 6px 10px;
    font-size: 13px;
    cursor: pointer;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 8px center;

    &:hover { border-color: rgba(255, 255, 255, 0.4); background-color: rgba(255, 255, 255, 0.15); }
    &:focus { border-color: $orange; }

    option { background: $navy; color: #fff; }
  }
}

// Mobile toggle
.trial-eka__sidebar-toggle {
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
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: white;
    border: 1px solid $border;
    border-radius: 8px;
    cursor: pointer;
  }
}

// ===== MAIN CONTENT =====
.trial-eka__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

// Mobile header
.trial-eka__mobile-header {
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid $border;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);

    button {
      background: none;
      border: none;
      color: $text-primary;
      cursor: pointer;
    }

    span {
      font-weight: 600;
      font-size: 16px;
      color: $text-primary;
    }
  }
}

.trial-eka__mobile-artifact-btn {
  color: $cyan !important;
}

// ===== COUNTER BANNER =====
.trial-eka__counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(14, 165, 233, 0.1);
  color: #7dd3fc;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  border-bottom: 1px solid $border;

  .ov-icon { color: #7dd3fc; fill: #7dd3fc; stroke: #7dd3fc; }
  span { color: #7dd3fc; }

  &--warning {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    .ov-icon { color: #fbbf24; fill: #fbbf24; stroke: #fbbf24; }
    span { color: #fbbf24; }
  }

  &--exhausted {
    background: rgba(239, 68, 68, 0.15);
    color: #fca5a5;
    .ov-icon { color: #fca5a5; fill: #fca5a5; stroke: #fca5a5; }
    span { color: #fca5a5; }
  }
}

// ===== BODY =====
.trial-eka__body {
  display: flex;
  flex: 1;
  overflow: hidden;

  &--with-artifact {
    .trial-eka__main { flex: 1; }
  }
}

.trial-eka__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ===== WELCOME =====
.trial-eka__welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  min-height: 100%;

  h2 { font-size: 28px; font-weight: 700; color: $text-primary; margin: 16px 0 8px; }
  p { font-size: 15px; color: $text-muted; max-width: 480px; line-height: 1.6; margin: 0 0 32px; }
}

.trial-eka__welcome-avatar {
  width: 72px; height: 72px; display: flex; align-items: center; justify-content: center;
  img { width: 100%; height: 100%; object-fit: contain; }
}

.trial-eka__suggestions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  max-width: 520px;
  width: 100%;

  @media (max-width: 500px) { grid-template-columns: 1fr; }
}

.trial-eka__suggestion {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid $border;
  border-radius: 12px;
  background: $surface;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  span { color: #fff; }
  .ov-icon { color: #fff; fill: #fff; stroke: #fff; flex-shrink: 0; }

  &:hover {
    border-color: rgba(14, 165, 233, 0.3);
    background: rgba(14, 165, 233, 0.05);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
}

// ===== MESSAGES =====
.trial-eka__messages {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  scroll-behavior: smooth;

  > :deep(*) {
    max-width: 768px;
    margin-left: auto;
    margin-right: auto;
    padding-left: 16px;
    padding-right: 16px;
    color: $text-primary;
  }

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 3px; }
}

// ===== EXHAUSTED =====
.trial-eka__exhausted {
  text-align: center;
  padding: 32px 24px;
  margin: 12px 16px;
  background: $surface;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid $border;
  border-radius: 16px;

  .ov-icon { color: $orange; fill: $orange; stroke: $orange; }
  h3 { font-size: 20px; font-weight: 800; color: $text-primary; margin: 12px 0 8px; }
  p { font-size: 15px; color: $text-secondary; line-height: 1.5; margin: 0 0 24px; max-width: 420px; margin-left: auto; margin-right: auto; }
}

.trial-eka__exhausted-btns {
  display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;
}

.trial-eka__btn {
  display: inline-flex; align-items: center; padding: 12px 28px; border-radius: 50px; font-size: 15px; font-weight: 700; text-decoration: none; transition: all 0.2s;

  &--primary { background: $orange; color: #fff; box-shadow: 0 4px 12px rgba(255, 92, 0, 0.3); &:hover { background: #E04F00; transform: translateY(-2px); } }
  &--secondary { background: rgba(255, 255, 255, 0.1); border: 1px solid $border; color: $text-primary; &:hover { background: rgba(255, 255, 255, 0.15); transform: translateY(-2px); } }
}

// ===== ANSWER BUTTONS =====
.trial-eka__answer-buttons {
  display: flex; justify-content: center; gap: 8px; padding: 8px 16px 4px; flex-wrap: wrap; max-width: 768px; margin: 0 auto; width: 100%;
}

.trial-eka__answer-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid $border; border-radius: 20px; background: $surface; color: $text-primary; font-size: 13px; cursor: pointer; transition: all 0.15s; font-weight: 500;

  .ov-icon { flex-shrink: 0; }

  &:hover { border-color: $cyan; background: rgba(14, 165, 233, 0.15); color: $text-primary; }

  &--yes { border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.1); color: #6ee7b7; .ov-icon { color: #10b981; fill: #10b981; } &:hover { border-color: #10b981; background: rgba(16, 185, 129, 0.2); } }
  &--no { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.1); color: #fca5a5; .ov-icon { color: #ef4444; fill: #ef4444; } &:hover { border-color: #ef4444; background: rgba(239, 68, 68, 0.2); } }
  &--unsure { border-color: rgba(255, 255, 255, 0.15); background: rgba(255, 255, 255, 0.05); color: $text-secondary; &:hover { border-color: rgba(255, 255, 255, 0.3); background: rgba(255, 255, 255, 0.1); } }
  &--option { border-color: rgba(14, 165, 233, 0.3); background: rgba(14, 165, 233, 0.1); color: #7dd3fc; &:hover { border-color: $cyan; background: rgba(14, 165, 233, 0.2); } }
  &--toggle { border-color: $border; background: $surface; color: $text-primary; .ov-icon { color: $text-muted; fill: $text-muted; } &.selected { border-color: $cyan; background: rgba(14, 165, 233, 0.15); color: #7dd3fc; font-weight: 600; .ov-icon { color: $cyan; fill: $cyan; } } }
  &--submit { border-color: $orange; background: $orange; color: white; font-weight: 600; &:hover { background: #E04F00; } }
  &--none { border-color: $border; background: rgba(255, 255, 255, 0.05); color: $text-secondary; font-size: 12px; &:hover { border-color: rgba(255, 255, 255, 0.3); } }
}

// ===== CHIPS =====
.trial-eka__chips {
  display: flex; justify-content: center; gap: 8px; padding: 8px 16px; flex-wrap: wrap;
}

.trial-eka__chip {
  display: inline-flex; align-items: center; padding: 6px 14px; border: 1px solid rgba(255, 92, 0, 0.3); border-radius: 20px; background: rgba(255, 92, 0, 0.1); color: #fb923c; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s;

  &:hover { border-color: $orange; background: rgba(255, 92, 0, 0.15); color: $orange; }
}

// ===== INPUT =====
.trial-eka__input-wrapper {
  padding: 12px 16px 16px; max-width: 768px; margin: 0 auto; width: 100%; flex-shrink: 0;
}

.trial-eka__file-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: $surface;
  border: 1px solid $border;
  border-radius: 12px;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.trial-eka__file-info {
  display: flex; align-items: center; gap: 10px; min-width: 0;
}

.trial-eka__file-thumb {
  width: 40px; height: 40px; border-radius: 6px; object-fit: cover; flex-shrink: 0;
}

.trial-eka__file-icon {
  color: $text-muted; flex-shrink: 0;
}

.trial-eka__file-meta {
  display: flex; flex-direction: column; min-width: 0;
}

.trial-eka__file-name {
  font-size: 13px; font-weight: 500; color: $text-primary; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.trial-eka__file-size {
  font-size: 11px; color: $text-muted;
}

.trial-eka__file-remove {
  background: none; border: none; color: $text-muted; cursor: pointer; padding: 4px; border-radius: 4px; flex-shrink: 0;
  &:hover { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
}

.trial-eka__file-hidden {
  display: none;
}

.trial-eka__input-box {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid $border;
  border-radius: 24px;
  padding: 4px 4px 4px 12px;
  background: rgba(15, 23, 42, 0.8);
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);

  &:focus-within { border-color: $orange; box-shadow: 0 0 0 3px rgba(255, 92, 0, 0.1); }

  input[type="text"] {
    flex: 1; border: none; outline: none; font-size: 15px; padding: 10px 0; background: transparent; color: $text-primary;
    &::placeholder { color: $text-muted; }
    &:disabled { color: $text-muted; }
  }
}

.trial-eka__attach {
  background: none; border: none; color: $text-muted; cursor: pointer; padding: 6px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s;

  &:hover:not(:disabled) { color: $orange; background: rgba(255, 92, 0, 0.08); }
  &:disabled { color: rgba(255, 255, 255, 0.2); cursor: not-allowed; }
}

.trial-eka__send {
  width: 40px; height: 40px; border: none; border-radius: 50%; background: $orange; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0;

  .ov-icon { color: white; fill: white; stroke: white; }

  &:hover:not(:disabled) { background: #E04F00; }
  &:disabled { background: rgba(255, 255, 255, 0.1); color: $text-muted; cursor: not-allowed; .ov-icon { color: $text-muted; fill: $text-muted; stroke: $text-muted; } }
}

.trial-eka__disclaimer {
  text-align: center; font-size: 11px; color: $text-muted; margin: 8px 0 0;
}

// ===== ARTIFACT PANEL =====
.trial-eka__artifact {
  width: 420px; min-width: 420px; border-left: 1px solid $border; display: flex; flex-direction: column; flex-shrink: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);

  @media (max-width: 900px) {
    position: fixed; top: 0; right: 0; bottom: 0; width: 100%; max-width: 420px; min-width: unset; z-index: 50; border-left: none; box-shadow: -20px 0 25px -5px rgba(0, 0, 0, 0.5); background: rgba(15, 23, 42, 0.95);
  }
}

.trial-eka__artifact-header {
  display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid $border; background: rgba(0, 0, 0, 0.2);
}

.trial-eka__artifact-title {
  display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: $text-primary;
  span { color: $text-primary; }
  .ov-icon { color: $cyan; fill: $cyan; stroke: $cyan; }
}

.trial-eka__artifact-close {
  display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; border: none; background: transparent; color: $text-muted; cursor: pointer;
  .ov-icon { color: $text-muted; fill: $text-muted; stroke: $text-muted; }
  &:hover { background: rgba(255, 255, 255, 0.1); color: $text-primary; .ov-icon { color: $text-primary; fill: $text-primary; stroke: $text-primary; } }
}

.trial-eka__artifact-content {
  flex: 1; overflow-y: auto; min-height: 0; padding: 16px;
  :deep(*) { color: $text-primary; }
}

// ===== TRANSITIONS =====
.trial-artifact-slide-enter-active,
.trial-artifact-slide-leave-active { transition: all 0.3s ease; }
.trial-artifact-slide-enter-from,
.trial-artifact-slide-leave-to { opacity: 0; transform: translateX(20px); }
</style>
