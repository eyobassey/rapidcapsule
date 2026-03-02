<template>
  <div class="eka-chat-wrapper" :class="{ 'is-embedded': embedded }">

    <!-- LEFT SIDEBAR (Hidden on mobile) -->
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="flex-align">
          <div class="logo-box">
            <v-icon name="gi-brain" scale="1.2" class="text-white" />
          </div>
          <span class="logo-text">Eka</span>
        </div>
        <button class="btn-icon"><v-icon name="hi-menu" /></button>
      </div>

      <div class="sidebar-content">
        <button class="btn-new-chat">
          <v-icon name="md-add" /> New Conversation
        </button>

        <h3 class="section-title">Quick Actions</h3>
        <div class="action-list">
          <button class="action-btn">
            <v-icon name="md-healthandsafety" class="text-primary" /> Health Checkup
          </button>
          <button class="action-btn">
            <v-icon name="md-showchart" class="text-secondary" /> My Vitals
          </button>
          <button class="action-btn">
            <v-icon name="md-localpharmacy" class="text-emerald" /> Prescriptions
          </button>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="user-avatar">JD</div>
          <div class="user-info">
            <span class="user-name">John Doe</span>
            <span class="user-credits">3 AI Credits</span>
          </div>
        </div>
      </div>
    </div>

    <!-- CENTER CHAT -->
    <div class="chat-main">
      <!-- Mobile Header -->
      <div class="mobile-header">
        <div class="flex-align">
          <div class="logo-box-sm">
            <v-icon name="gi-brain" class="text-white" />
          </div>
          <span class="logo-text-sm">Eka</span>
        </div>
        <button class="btn-icon"><v-icon name="hi-menu" /></button>
      </div>

      <!-- Messages Area -->
      <div class="messages-container" ref="scrollRef">
        <div class="messages-list">
          <transition-group name="msg-list">
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="message-row"
              :class="msg.role === 'user' ? 'is-user' : 'is-bot'"
            >
              <div v-if="msg.role === 'assistant'" class="bot-avatar">
                <v-icon name="gi-brain" class="text-white" scale="0.8" />
              </div>

              <div class="message-bubble" :class="msg.role === 'user' ? 'bubble-user' : 'bubble-bot'">
                {{ msg.content }}
              </div>
            </div>

            <div v-if="isTyping" class="message-row is-bot" key="typing">
              <div class="bot-avatar">
                <v-icon name="gi-brain" class="text-white" scale="0.8" />
              </div>
              <div class="message-bubble bubble-bot typing-indicator">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
              </div>
            </div>
          </transition-group>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-container">
          <transition name="fade-up">
            <div v-if="suggestions.length > 0" class="suggestions">
              <button
                v-for="(sug, idx) in suggestions"
                :key="idx"
                @click="handleSend(sug)"
                class="suggestion-btn"
              >
                {{ sug }}
              </button>
            </div>
          </transition>

          <div class="input-box-wrapper">
            <div class="input-glow"></div>
            <div class="input-box">
              <button class="btn-icon text-muted hover-primary"><v-icon name="md-add" /></button>
              <textarea
                v-model="input"
                @keydown.enter.prevent="handleSend(input)"
                placeholder="Message Eka or describe your symptoms..."
                class="chat-input"
                rows="1"
              ></textarea>
              <button
                @click="handleSend(input)"
                :disabled="!input.trim() || isTyping"
                class="btn-send"
              >
                <v-icon name="md-send" scale="0.8" />
              </button>
            </div>
          </div>
          <p class="disclaimer">Eka can make mistakes. Consider verifying important clinical information.</p>
        </div>
      </div>
    </div>

    <!-- RIGHT ARTIFACT PANEL -->
    <transition name="slide-right">
      <div v-if="activeArtifact !== 'none'" class="artifact-panel">
        <div class="artifact-header">
          <span class="artifact-title">
            <v-icon :name="activeArtifact === 'body-avatar' ? 'md-person' : 'md-description'" class="text-primary mr-2" />
            {{ activeArtifact === 'body-avatar' ? 'Symptom Locator' : 'Health Report' }}
          </span>
          <div class="flex-align">
            <button v-if="activeArtifact === 'health-report'" class="btn-icon"><v-icon name="md-filedownload" /></button>
            <button class="btn-icon" @click="activeArtifact = 'none'"><v-icon name="md-chevronright" /></button>
          </div>
        </div>

        <div class="artifact-content">
          <transition name="fade" mode="out-in">

            <!-- Body Avatar -->
            <div v-if="activeArtifact === 'body-avatar'" key="body" class="body-avatar-view">
              <p class="text-muted text-center text-sm mb-6">Select the area where you are experiencing discomfort.</p>

              <div class="body-model">
                <button class="body-part head" @click="handleBodyPartSelect('Head')"><span>Head</span></button>
                <button class="body-part chest" @click="handleBodyPartSelect('Chest')"><span>Chest</span></button>
                <button class="body-part abdomen" @click="handleBodyPartSelect('Abdomen')"><span>Abdomen</span></button>
                <button class="body-part arm-l" @click="handleBodyPartSelect('Left Arm')"></button>
                <button class="body-part arm-r" @click="handleBodyPartSelect('Right Arm')"></button>
                <button class="body-part leg-l" @click="handleBodyPartSelect('Left Leg')"></button>
                <button class="body-part leg-r" @click="handleBodyPartSelect('Right Leg')"></button>
              </div>
            </div>

            <!-- Health Report -->
            <div v-if="activeArtifact === 'health-report'" key="report" class="health-report-view">
              <div class="alert-box">
                <v-icon name="md-warning" class="text-warning mr-3" scale="1.5" />
                <div>
                  <h4 class="alert-title">Triage: Consultation</h4>
                  <p class="alert-desc">Your symptoms suggest a medical consultation is recommended within 24 hours.</p>
                </div>
              </div>

              <div class="report-section">
                <h4 class="section-heading-sm">Possible Conditions</h4>
                <div class="condition-card">
                  <div class="flex-between mb-2">
                    <span class="font-bold text-sm">Migraine</span>
                    <span class="text-xs font-bold text-primary">High Match</span>
                  </div>
                  <div class="progress-bar"><div class="progress-fill bg-primary w-85"></div></div>
                </div>
                <div class="condition-card mt-3">
                  <div class="flex-between mb-2">
                    <span class="font-bold text-sm">Tension Headache</span>
                    <span class="text-xs font-bold text-muted">Medium Match</span>
                  </div>
                  <div class="progress-bar"><div class="progress-fill bg-muted w-40"></div></div>
                </div>
              </div>

              <div class="report-section border-t">
                <h4 class="section-heading-sm">Recommendations</h4>
                <div class="recommendation">
                  <div class="rec-number">1</div>
                  <p>Rest in a quiet, dark room to help reduce sensory input which can exacerbate migraine symptoms.</p>
                </div>
                <div class="recommendation">
                  <div class="rec-number">2</div>
                  <p>Stay hydrated by drinking plenty of water, as dehydration is a common trigger.</p>
                </div>
              </div>

              <button class="btn-primary full-width mt-4 lg-btn">Book Specialist Appointment</button>
            </div>
          </transition>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false
  }
});

const messages = ref([
  {
    id: "1",
    role: "assistant",
    content: "Hello. I am Eka, your AI health companion. How can I support you today?",
  }
]);

const input = ref("");
const isTyping = ref(false);
const activeArtifact = ref("none"); // "none" | "body-avatar" | "health-report"
const suggestions = ref(["I want a health checkup", "Check my latest vitals", "Analyze a prescription"]);
const scrollRef = ref(null);

// Auto-scroll to bottom
const scrollToBottom = async () => {
  await nextTick();
  if (scrollRef.value) {
    scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
  }
};

watch([messages, isTyping], () => {
  scrollToBottom();
}, { deep: true });

const handleSend = (text) => {
  if (!text.trim()) return;

  const newUserMsg = { id: Date.now().toString(), role: "user", content: text };
  messages.value.push(newUserMsg);
  input.value = "";
  suggestions.value = [];
  isTyping.value = true;

  const lowerText = text.toLowerCase();

  // Simulated Flow
  if (lowerText.includes("checkup") || lowerText.includes("head")) {
    setTimeout(() => {
      isTyping.value = false;
      messages.value.push({
        id: Date.now().toString(),
        role: "assistant",
        content: "I can help with that. Let's start by identifying where you're feeling discomfort. Please select the area on the body model on the right.",
      });
      activeArtifact.value = "body-avatar";
    }, 1500);
  } else if (lowerText.includes("sharp pain")) {
    setTimeout(() => {
      isTyping.value = false;
      messages.value.push({
        id: Date.now().toString(),
        role: "assistant",
        content: "Thank you for sharing those details. Based on your symptoms, I have generated a preliminary health report. Please note that this is not a clinical diagnosis, but it will help guide your next steps.",
      });
      activeArtifact.value = "health-report";
      suggestions.value = ["Book a consultation", "Home care tips", "Speak to a human agent"];
    }, 2000);
  } else {
    setTimeout(() => {
      isTyping.value = false;
      messages.value.push({
        id: Date.now().toString(),
        role: "assistant",
        content: "I understand. To give you the best advice, could you provide a bit more context?",
      });
    }, 1000);
  }
};

const handleBodyPartSelect = (part) => {
  const newUserMsg = { id: Date.now().toString(), role: "user", content: `I'm having issues with my ${part}` };
  messages.value.push(newUserMsg);
  isTyping.value = true;

  setTimeout(() => {
    isTyping.value = false;
    messages.value.push({
      id: Date.now().toString(),
      role: "assistant",
      content: `I understand you're experiencing discomfort in your ${part}. Could you describe the type of pain and if you have any other symptoms like nausea or lightheadedness?`,
    });
    suggestions.value = ["Sharp pain with nausea", "Throbbing ache", "Dull, constant pressure"];
  }, 1500);
};
</script>

<style lang="scss">
/* NON-SCOPED overrides to beat App.vue global styles */
.eka-chat-wrapper,
.eka-chat-wrapper *,
.eka-chat-wrapper *::before,
.eka-chat-wrapper *::after {
  color: inherit;
  font-family: inherit;
  box-sizing: border-box;
}

.eka-chat-wrapper {
  color: #f8fafc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
}

.eka-chat-wrapper .logo-text,
.eka-chat-wrapper .logo-text-sm,
.eka-chat-wrapper .section-heading-sm {
  font-family: 'Outfit', sans-serif;
}

/* Explicit button colors so inherit doesn't break them */
.eka-chat-wrapper .btn-primary { color: #fff; }
.eka-chat-wrapper .btn-send { color: #fff; }
.eka-chat-wrapper .bubble-user { color: #0f172a; }
</style>

<style scoped lang="scss">
/* EkaChat Variables */
.eka-chat-wrapper {
  --bg-color: #0f172a;
  --panel-bg: rgba(15, 23, 42, 0.6);
  --border: rgba(255, 255, 255, 0.1);
  --text-main: #f8fafc;
  --text-muted: #64748b;
  --primary: #0ea5e9;
  --primary-glow: rgba(14, 165, 233, 0.2);
  --secondary: #f97316;
  --emerald: #10b981;
  --warning: #f59e0b;

  display: flex;
  background-color: var(--bg-color);
  color: var(--text-main);
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', sans-serif;
  height: 100vh; /* Default full screen */


  &.is-embedded {
    height: 100%;
    border-radius: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    background-color: var(--panel-bg);
    backdrop-filter: blur(16px);
    position: relative;
    z-index: 10;
  }
}

/* Utilities */
.flex-align { display: flex; align-items: center; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.text-white { color: #fff; }
.text-muted { color: var(--text-muted); }
.text-primary { color: var(--primary); }
.text-secondary { color: var(--secondary); }
.text-emerald { color: var(--emerald); }
.text-warning { color: var(--warning); }
.font-bold { font-weight: 700; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.text-center { text-align: center; }
.full-width { width: 100%; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mr-2 { margin-right: 0.5rem; }
.mr-3 { margin-right: 0.75rem; }
.border-t { border-top: 1px solid var(--border); padding-top: 1rem; }

/* Buttons */
.btn-icon { background: none; border: none; color: var(--text-main); cursor: pointer; padding: 0.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; &:hover { background-color: rgba(255,255,255,0.1); } }
.btn-primary { background-color: var(--primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 999px; font-weight: 500; cursor: pointer; transition: background 0.3s; &:hover { filter: brightness(0.9); } }
.lg-btn { padding: 1rem; font-size: 1rem; }

/* Sidebar */
.sidebar {
  display: none;
  width: 280px;
  flex-direction: column;
  border-right: 1px solid var(--border);
  background-color: rgba(15, 23, 42, 0.3);
  backdrop-filter: blur(12px);
  z-index: 10;
  @media (min-width: 1024px) { display: flex; }
}

.sidebar-header { padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.logo-box { width: 2rem; height: 2rem; border-radius: 0.5rem; background: linear-gradient(to bottom right, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; margin-right: 0.5rem; }
.logo-text { font-family: 'Outfit', sans-serif; font-weight: bold; font-size: 1.125rem; }

.sidebar-content { padding: 1rem; flex: 1; }
.btn-new-chat { width: 100%; display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 0.75rem; background-color: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text-main); font-size: 0.875rem; cursor: pointer; margin-bottom: 1.5rem; transition: background 0.2s; &:hover { background-color: rgba(255,255,255,0.1); } }
.section-title { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; padding: 0 0.5rem; }
.action-list { display: flex; flex-direction: column; gap: 0.25rem; }
.action-btn { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.75rem; border-radius: 0.5rem; background: none; border: none; color: rgba(255,255,255,0.8); font-size: 0.875rem; font-weight: 500; text-align: left; cursor: pointer; transition: background 0.2s; &:hover { background-color: rgba(255,255,255,0.05); } }

.sidebar-footer { padding: 1rem; border-top: 1px solid var(--border); }
.user-profile { display: flex; align-items: center; gap: 0.75rem; padding: 0 0.5rem; }
.user-avatar { width: 2.5rem; height: 2.5rem; border-radius: 50%; background-color: var(--primary-glow); color: var(--primary); font-weight: bold; display: flex; align-items: center; justify-content: center; }
.user-info { display: flex; flex-direction: column; }
.user-name { font-size: 0.875rem; font-weight: bold; }
.user-credits { font-size: 0.75rem; color: var(--text-muted); }

/* Chat Main */
.chat-main { flex: 1; display: flex; flex-direction: column; position: relative; z-index: 0; }
.mobile-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border); background-color: rgba(15,23,42,0.8); backdrop-filter: blur(12px); position: absolute; top: 0; width: 100%; z-index: 20; @media (min-width: 1024px) { display: none; } }
.logo-box-sm { width: 2rem; height: 2rem; border-radius: 0.5rem; background: linear-gradient(to bottom right, var(--primary), var(--secondary)); display: flex; align-items: center; justify-content: center; margin-right: 0.5rem; }
.logo-text-sm { font-family: 'Outfit', sans-serif; font-weight: bold; }

.messages-container { flex: 1; overflow-y: auto; padding: 1rem; padding-top: 5rem; padding-bottom: 8rem; scroll-behavior: smooth; @media (min-width: 1024px) { padding-top: 2rem; } }
.messages-list { max-width: 48rem; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }

/* Messages */
.message-row { display: flex; gap: 1rem; &.is-user { justify-content: flex-end; } &.is-bot { justify-content: flex-start; } }
.bot-avatar { width: 2rem; height: 2rem; border-radius: 50%; background-color: var(--primary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.25rem; box-shadow: 0 4px 6px -1px var(--primary-glow); }
.message-bubble { max-width: 80%; padding: 0.875rem 1.25rem; border-radius: 1rem; font-size: 0.9375rem; line-height: 1.6; }
.bubble-user { background-color: var(--text-main); color: var(--bg-color); border-top-right-radius: 0.25rem; }
.bubble-bot { background-color: rgba(15,23,42,0.6); backdrop-filter: blur(16px); border: 1px solid var(--border); color: var(--text-main); border-top-left-radius: 0.25rem; }

/* Typing Indicator */
.typing-indicator { display: flex; align-items: center; gap: 0.375rem; padding: 1rem 1.25rem; }
.dot { width: 0.5rem; height: 0.5rem; border-radius: 50%; background-color: rgba(14,165,233,0.6); animation: typeBounce 1s infinite; &:nth-child(2) { animation-delay: 0.2s; } &:nth-child(3) { animation-delay: 0.4s; } }
@keyframes typeBounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }

/* Message Animations */
.msg-list-enter-active, .msg-list-leave-active { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.msg-list-enter-from { opacity: 0; transform: translateY(10px) scale(0.95); }
.msg-list-leave-to { opacity: 0; transform: scale(0.9); }

/* Input Area */
.input-area { position: absolute; bottom: 0; left: 0; width: 100%; padding: 1rem; background: linear-gradient(to top, var(--bg-color) 70%, transparent); z-index: 20; }
.input-container { max-width: 48rem; margin: 0 auto; position: relative; }
.suggestions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
.suggestion-btn { padding: 0.5rem 1rem; border-radius: 999px; background-color: var(--panel-bg); border: 1px solid var(--border); color: rgba(255,255,255,0.8); font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; &:hover { background-color: rgba(14,165,233,0.05); border-color: rgba(14,165,233,0.3); } }
.input-box-wrapper { position: relative; }
.input-glow { position: absolute; inset: -0.25rem; background: linear-gradient(to right, rgba(14,165,233,0.3), rgba(249,115,22,0.3)); border-radius: 1.5rem; filter: blur(8px); opacity: 0.25; transition: opacity 0.5s; }
.input-box-wrapper:hover .input-glow { opacity: 0.5; }
.input-box { position: relative; background-color: rgba(15,23,42,0.8); border: 1px solid var(--border); border-radius: 1rem; display: flex; align-items: flex-end; padding: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); }
.chat-input { flex: 1; background: transparent; border: none; color: var(--text-main); font-size: 0.9375rem; padding: 0.75rem 0.5rem; resize: none; min-height: 44px; max-height: 8rem; outline: none; font-family: inherit; &::placeholder { color: var(--text-muted); } }
.btn-send { background-color: var(--primary); color: white; border: none; width: 2.25rem; height: 2.25rem; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; cursor: pointer; margin-bottom: 0.25rem; flex-shrink: 0; transition: transform 0.1s; &:active:not(:disabled) { transform: scale(0.95); } &:disabled { opacity: 0.5; cursor: not-allowed; } }
.disclaimer { text-align: center; font-size: 0.625rem; font-weight: 500; color: var(--text-muted); margin-top: 0.5rem; }

/* Right Artifact Panel */
.artifact-panel { display: none; width: 400px; flex-direction: column; border-left: 1px solid var(--border); background-color: rgba(15,23,42,0.4); backdrop-filter: blur(24px); z-index: 20; box-shadow: -20px 0 25px -5px rgba(0,0,0,0.5); @media (min-width: 1280px) { display: flex; } }
.artifact-header { padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background-color: rgba(0,0,0,0.2); }
.artifact-title { display: flex; align-items: center; font-size: 0.875rem; font-weight: 600; }
.artifact-content { flex: 1; overflow-y: auto; padding: 1.5rem; }

/* Slide Transitions */
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.slide-right-enter-from, .slide-right-leave-to { opacity: 0; transform: translateX(100px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-up-enter-active, .fade-up-leave-active { transition: all 0.3s ease; }
.fade-up-enter-from, .fade-up-leave-to { opacity: 0; transform: translateY(10px); }

/* Body Avatar Visuals */
.body-model { position: relative; width: 12rem; height: 400px; margin: 0 auto; }
.body-part { position: absolute; background-color: rgba(14,165,233,0.05); border: 2px solid rgba(14,165,233,0.4); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; span { font-size: 0.75rem; font-weight: bold; color: var(--primary); opacity: 0; transition: opacity 0.3s; } &:hover { background-color: rgba(14,165,233,0.2); border-color: var(--primary); span { opacity: 1; } } }
.head { top: 0; left: 50%; transform: translateX(-50%); width: 4rem; height: 5rem; border-radius: 30px; }
.chest { top: 90px; left: 50%; transform: translateX(-50%); width: 6rem; height: 8rem; border-radius: 1.5rem; }
.abdomen { top: 230px; left: 50%; transform: translateX(-50%); width: 5rem; height: 4rem; border-radius: 1rem; }
.arm-l { top: 100px; left: -1rem; width: 2rem; height: 10rem; border-radius: 999px; transform-origin: top; transform: rotate(12deg); }
.arm-r { top: 100px; right: -1rem; width: 2rem; height: 10rem; border-radius: 999px; transform-origin: top; transform: rotate(-12deg); }
.leg-l { top: 300px; left: 2rem; width: 2.5rem; height: 12rem; border-radius: 999px; }
.leg-r { top: 300px; right: 2rem; width: 2.5rem; height: 12rem; border-radius: 999px; }

/* Health Report Visuals */
.alert-box { display: flex; padding: 1rem; border-radius: 1rem; background: linear-gradient(to right, rgba(245,158,11,0.2), rgba(249,115,22,0.2)); border: 1px solid rgba(245,158,11,0.3); margin-bottom: 1.5rem; }
.alert-title { font-weight: bold; color: var(--warning); margin-bottom: 0.25rem; font-size: 1rem; }
.alert-desc { font-size: 0.875rem; color: rgba(245,158,11,0.8); }
.section-heading-sm { font-family: 'Outfit', sans-serif; font-size: 1.125rem; font-weight: 600; margin-bottom: 0.75rem; }
.condition-card { background-color: var(--bg-color); padding: 0.75rem; border-radius: 0.75rem; border: 1px solid var(--border); }
.progress-bar { width: 100%; height: 0.375rem; background-color: var(--muted); border-radius: 999px; overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999px; &.bg-primary { background-color: var(--primary); } &.bg-muted { background-color: rgba(255,255,255,0.3); } &.w-85 { width: 85%; } &.w-40 { width: 40%; } }
.report-section { margin-top: 1.5rem; }
.recommendation { display: flex; gap: 0.75rem; margin-bottom: 1rem; p { font-size: 0.875rem; color: rgba(255,255,255,0.8); line-height: 1.6; } }
.rec-number { width: 1.5rem; height: 1.5rem; border-radius: 50%; background-color: rgba(14,165,233,0.1); color: var(--primary); font-size: 0.75rem; font-weight: bold; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.125rem; }
</style>