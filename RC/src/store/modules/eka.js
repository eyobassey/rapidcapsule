import http from '@/services/http'

export default {
  namespaced: true,

  state() {
    return {
      isOpen: false,
      messages: [],
      conversationId: null,
      conversations: [],
      isStreaming: false,
      streamingContent: '',
      language: localStorage.getItem('eka_language') || 'English',
      artifact: null,
      artifactOpen: false,
      checkupSession: null,
      checkupQuestion: null, // { text, type, items } — for interactive answer buttons
      suggestions: [], // Array<{ label, message }> — contextual follow-up chips
    }
  },

  getters: {
    isEkaOpen: (state) => state.isOpen,
    getMessages: (state) => state.messages,
    getConversationId: (state) => state.conversationId,
    getConversations: (state) => state.conversations,
    isStreaming: (state) => state.isStreaming,
    getLanguage: (state) => state.language,
    getArtifact: (state) => state.artifact,
    isArtifactOpen: (state) => state.artifactOpen,
    getCheckupSession: (state) => state.checkupSession,
    getCheckupQuestion: (state) => state.checkupQuestion,
    getSuggestions: (state) => state.suggestions,
  },

  mutations: {
    SET_OPEN(state, val) {
      state.isOpen = val
    },
    TOGGLE_OPEN(state) {
      state.isOpen = !state.isOpen
    },
    SET_MESSAGES(state, messages) {
      state.messages = messages
    },
    APPEND_USER_MESSAGE(state, payload) {
      if (typeof payload === 'string') {
        state.messages.push({ role: 'user', content: payload, created_at: new Date() })
      } else {
        state.messages.push({ role: 'user', content: payload.text, attachment: payload.attachment || null, created_at: new Date() })
      }
      // Auto-mark next exercise step when user responds during an active exercise
      if (state.artifact && state.artifact.type === 'coping_exercise' && state.artifact.data && !state.artifact.data.completed) {
        const steps = state.artifact.data.completed_steps || []
        const total = state.artifact.data.steps ? state.artifact.data.steps.length : 0
        const next = steps.length + 1
        if (next <= total) {
          state.artifact = {
            ...state.artifact,
            data: { ...state.artifact.data, completed_steps: [...steps, next] },
          }
        }
      }
    },
    APPEND_ASSISTANT_MESSAGE(state) {
      state.messages.push({ role: 'assistant', content: '', created_at: new Date() })
    },
    APPEND_TO_LAST_MESSAGE(state, text) {
      const last = state.messages[state.messages.length - 1]
      if (last && last.role === 'assistant') {
        last.content += text
      }
    },
    CLEAR_LAST_MESSAGE(state) {
      const last = state.messages[state.messages.length - 1]
      if (last && last.role === 'assistant') {
        last.content = ''
      }
    },
    SET_CONVERSATION_ID(state, id) {
      state.conversationId = id
    },
    SET_CONVERSATIONS(state, list) {
      state.conversations = list
    },
    SET_STREAMING(state, val) {
      state.isStreaming = val
    },
    CLEAR_CHAT(state) {
      state.messages = []
      state.conversationId = null
      state.artifact = null
      state.artifactOpen = false
      state.checkupSession = null
      state.checkupQuestion = null
      state.suggestions = []
    },
    SET_ARTIFACT(state, artifact) {
      state.artifact = artifact
      state.artifactOpen = true
    },
    CLEAR_ARTIFACT(state) {
      state.artifact = null
      state.artifactOpen = false
      state.checkupSession = null
    },
    UPDATE_EXERCISE_STEP(state, stepNumber) {
      if (state.artifact && state.artifact.type === 'coping_exercise' && state.artifact.data) {
        const steps = state.artifact.data.completed_steps || []
        if (!steps.includes(stepNumber)) {
          steps.push(stepNumber)
        }
        state.artifact = {
          ...state.artifact,
          data: { ...state.artifact.data, completed_steps: [...steps] },
        }
      }
    },
    COMPLETE_EXERCISE(state, data) {
      if (state.artifact && state.artifact.type === 'coping_exercise' && state.artifact.data) {
        // Include conversation messages as responses for the PDF
        const responses = state.messages
          .filter((m) => m.content && m.content.trim())
          .map((m) => ({ role: m.role, content: m.content }))
        state.artifact = {
          ...state.artifact,
          data: {
            ...state.artifact.data,
            completed_steps: data.completed_steps || [],
            completed: true,
            outcome: data.outcome,
            completed_at: data.completed_at,
            responses,
          },
        }
      }
    },
    TOGGLE_ARTIFACT(state) {
      state.artifactOpen = !state.artifactOpen
    },
    SET_CHECKUP_SESSION(state, session) {
      state.checkupSession = session
    },
    SET_CHECKUP_QUESTION(state, question) {
      state.checkupQuestion = question
    },
    CLEAR_CHECKUP_QUESTION(state) {
      state.checkupQuestion = null
    },
    SET_SUGGESTIONS(state, suggestions) {
      state.suggestions = suggestions
    },
    CLEAR_SUGGESTIONS(state) {
      state.suggestions = []
    },
    SET_LANGUAGE(state, lang) {
      state.language = lang
      localStorage.setItem('eka_language', lang)
    },
  },

  actions: {
    toggleChat({ commit }) {
      commit('TOGGLE_OPEN')
    },

    openChat({ commit }) {
      commit('SET_OPEN', true)
    },

    closeChat({ commit }) {
      commit('SET_OPEN', false)
    },

    startNewChat({ commit }) {
      commit('CLEAR_CHAT')
      // Clear stale backend checkup phases so new checkups start fresh
      try {
        http.post('/eka/clear-checkup-phase')
      } catch {}
    },

    setLanguage({ commit }, lang) {
      commit('SET_LANGUAGE', lang)
    },

    async fetchConversations({ commit }) {
      try {
        const res = await http.get('/eka/conversations')
        const data = res.data?.result || res.data?.data || []
        commit('SET_CONVERSATIONS', data)
      } catch (e) {
        console.error('Failed to load Eka conversations:', e)
      }
    },

    async loadConversation({ commit }, conversationId) {
      try {
        const res = await http.get(`/eka/conversations/${conversationId}`)
        const data = res.data?.result || res.data?.data
        if (data) {
          commit('SET_MESSAGES', data.messages || [])
          commit('SET_CONVERSATION_ID', conversationId)
        }
      } catch (e) {
        console.error('Failed to load conversation:', e)
      }
    },

    async renameConversation({ commit, state }, { conversationId, title }) {
      try {
        await http.patch(`/eka/conversations/${conversationId}`, { title })
        const updated = state.conversations.map((c) =>
          c._id === conversationId ? { ...c, title } : c,
        )
        commit('SET_CONVERSATIONS', updated)
      } catch (e) {
        console.error('Failed to rename conversation:', e)
      }
    },

    async deleteConversation({ commit, state }, conversationId) {
      try {
        await http.delete(`/eka/conversations/${conversationId}`)
        commit(
          'SET_CONVERSATIONS',
          state.conversations.filter((c) => c._id !== conversationId),
        )
        if (state.conversationId === conversationId) {
          commit('CLEAR_CHAT')
        }
      } catch (e) {
        console.error('Failed to delete conversation:', e)
      }
    },

    async fetchConversationsByTag(_, tag) {
      try {
        const res = await http.get('/eka/conversations', { params: { tag } })
        return res.data?.result || res.data?.data || []
      } catch (e) {
        console.error('Failed to load Eka conversations by tag:', e)
        return []
      }
    },

    async sendMessage({ commit, state }, payload) {
      // payload can be a string, { text, attachment }, or { text, tags }
      const messageText = typeof payload === 'string' ? payload : payload.text
      const attachment = typeof payload === 'object' ? payload.attachment : null
      const tags = typeof payload === 'object' ? payload.tags : undefined

      commit('CLEAR_CHECKUP_QUESTION') // Clear answer buttons when user sends
      commit('CLEAR_SUGGESTIONS') // Clear follow-up suggestions when user sends
      commit('APPEND_USER_MESSAGE', attachment ? { text: messageText, attachment } : messageText)
      commit('APPEND_ASSISTANT_MESSAGE')
      commit('SET_STREAMING', true)

      let gotContent = false

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
        const baseURL = process.env.VUE_APP_API_GATEWAY || ''

        const bodyPayload = {
          message: messageText,
          conversation_id: state.conversationId || undefined,
          language: state.language || 'English',
        }
        // Only include tags on the first message of a new conversation
        if (!state.conversationId && tags && tags.length > 0) {
          bodyPayload.tags = tags
        }

        const response = await fetch(`${baseURL}/api/eka/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bodyPayload),
        })

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let sseBuffer = '' // Buffer for partial SSE lines split across TCP chunks

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          sseBuffer += decoder.decode(value, { stream: true })
          const lines = sseBuffer.split('\n')

          // Keep last element in buffer — it may be an incomplete line
          sseBuffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const payload = line.slice(6).trim()
            if (payload === '[DONE]') continue

            try {
              const chunk = JSON.parse(payload)
              if (chunk.type === 'text') {
                gotContent = true
                commit('APPEND_TO_LAST_MESSAGE', chunk.content)
              } else if (chunk.type === 'done' && chunk.conversation_id) {
                commit('SET_CONVERSATION_ID', chunk.conversation_id)
              } else if (chunk.type === 'error') {
                gotContent = true
                const errorMsg = chunk.content || "Something went wrong. Please try again in a moment."
                commit('APPEND_TO_LAST_MESSAGE', errorMsg)
              } else if (chunk.type === 'artifact') {
                if (chunk.artifact_type === 'health_checkup_start') {
                  commit('SET_CHECKUP_SESSION', chunk.data)
                  commit('SET_ARTIFACT', { type: 'health_checkup_start', data: chunk.data })
                } else if (chunk.artifact_type === 'health_checkup_report') {
                  commit('SET_ARTIFACT', { type: 'health_checkup_report', data: chunk.data })
                } else if (chunk.artifact_type === 'drug_interaction_report') {
                  commit('SET_ARTIFACT', { type: 'drug_interaction_report', data: chunk.data })
                } else if (chunk.artifact_type === 'prescription_analysis') {
                  commit('SET_ARTIFACT', { type: 'prescription_analysis', data: chunk.data })
                } else if (chunk.artifact_type === 'recovery_dashboard') {
                  commit('SET_ARTIFACT', { type: 'recovery_dashboard', data: chunk.data })
                } else if (chunk.artifact_type === 'screening_report') {
                  commit('SET_ARTIFACT', { type: 'screening_report', data: chunk.data })
                } else if (chunk.artifact_type === 'coping_exercise') {
                  commit('SET_ARTIFACT', { type: 'coping_exercise', data: chunk.data })
                } else if (chunk.artifact_type === 'exercise_step_update') {
                  commit('UPDATE_EXERCISE_STEP', chunk.data.step)
                } else if (chunk.artifact_type === 'exercise_complete') {
                  commit('COMPLETE_EXERCISE', chunk.data)
                } else if (chunk.artifact_type === 'safety_plan') {
                  commit('SET_ARTIFACT', { type: 'safety_plan', data: chunk.data })
                } else if (chunk.artifact_type === 'risk_assessment') {
                  commit('SET_ARTIFACT', { type: 'risk_assessment', data: chunk.data })
                }
              } else if (chunk.type === 'clear_loading') {
                commit('CLEAR_LAST_MESSAGE')
              } else if (chunk.type === 'clear_artifact') {
                commit('CLEAR_ARTIFACT')
              } else if (chunk.type === 'checkup_question' && chunk.question) {
                commit('SET_CHECKUP_QUESTION', chunk.question)
              } else if (chunk.type === 'suggestions' && chunk.suggestions) {
                commit('SET_SUGGESTIONS', chunk.suggestions)
              }
            } catch {}
          }
        }

        // If stream ended without any content, show a friendly fallback
        if (!gotContent) {
          commit(
            'APPEND_TO_LAST_MESSAGE',
            "Oops! I wasn't able to respond just now — my brain is taking a quick nap. Give me a moment and try again!\n\nIn the meantime, you can:\n- [[View your vitals|vitals]]\n- [[Browse the pharmacy|pharmacy]]\n- [[Book an appointment|book_appointment]]",
          )
        }
      } catch (error) {
        console.error('Eka chat error:', error)
        if (!gotContent) {
          commit(
            'APPEND_TO_LAST_MESSAGE',
            "I'm having a little trouble connecting right now. This usually resolves in a minute or two — please try again shortly!\n\nWhile you wait, you can still:\n- [[View your vitals|vitals]]\n- [[Check your prescriptions|prescriptions]]\n- [[Book an appointment|book_appointment]]",
          )
        }
      } finally {
        commit('SET_STREAMING', false)
      }
    },
  },
}
