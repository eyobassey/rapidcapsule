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
    APPEND_USER_MESSAGE(state, content) {
      state.messages.push({ role: 'user', content, created_at: new Date() })
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

    async sendMessage({ commit, state }, message) {
      commit('CLEAR_CHECKUP_QUESTION') // Clear answer buttons when user sends
      commit('APPEND_USER_MESSAGE', message)
      commit('APPEND_ASSISTANT_MESSAGE')
      commit('SET_STREAMING', true)

      let gotContent = false

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || ''
        const baseURL = process.env.VUE_APP_API_GATEWAY || ''

        const response = await fetch(`${baseURL}/api/eka/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message,
            conversation_id: state.conversationId || undefined,
            language: state.language || 'English',
          }),
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
                }
              } else if (chunk.type === 'clear_loading') {
                commit('CLEAR_LAST_MESSAGE')
              } else if (chunk.type === 'clear_artifact') {
                commit('CLEAR_ARTIFACT')
              } else if (chunk.type === 'checkup_question' && chunk.question) {
                commit('SET_CHECKUP_QUESTION', chunk.question)
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
