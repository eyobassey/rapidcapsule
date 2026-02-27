<template>
  <div class="companion-chat">
    <!-- Chat Header (only visible in-session) -->
    <div v-if="sessionId" class="companion-chat__header">
      <button class="companion-chat__back" @click="handleBack">
        <v-icon name="hi-arrow-left" scale="1" />
      </button>
      <div class="companion-chat__title">
        <div class="companion-chat__avatar">
          <v-icon name="hi-sparkles" scale="0.8" />
        </div>
        <div>
          <h2>Recovery Companion</h2>
          <span class="companion-chat__status">AI-powered support &middot; 24/7</span>
        </div>
      </div>
      <button
        v-if="!sessionEnded"
        class="companion-chat__end"
        @click="endSession"
      >
        End
      </button>
      <div v-else class="companion-chat__spacer"></div>
    </div>

    <!-- Pre-session: Context Selection -->
    <div v-if="!sessionId" class="companion-chat__start">
      <div class="companion-chat__start-inner">
        <section class="hero">
          <div class="hero__content">
            <button class="back-link" @click="$emit('back')">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Back</span>
            </button>
            <div class="hero__badge">
              <v-icon name="hi-sparkles" />
              <span>AI-Powered &middot; 24/7</span>
            </div>
            <h1 class="hero__title">
              Recovery<br/>
              <span class="hero__title-accent">Companion</span>
            </h1>
            <p class="hero__subtitle">
              24/7 recovery support — coping tools, exercises, and check-ins powered by EkaGPT.
            </p>
          </div>
          <div class="hero__visual">
            <div class="recovery-orb">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="hi-sparkles" scale="2" />
              </div>
            </div>
          </div>
        </section>

        <h4 class="section-heading">What's on your mind?</h4>

        <div class="context-cards">
          <button
            v-for="ctx in contextOptions"
            :key="ctx.value"
            class="context-card"
            @click="startSession(ctx.value)"
          >
            <div class="context-card__icon" :style="{ background: ctx.bg }">
              <v-icon :name="ctx.icon" scale="0.9" />
            </div>
            <span class="context-card__label">{{ ctx.label }}</span>
          </button>
        </div>

        <!-- Recent Sessions -->
        <div v-if="recentSessions.length" class="recent-sessions">
          <h4>Recent Conversations</h4>
          <div
            v-for="s in recentSessions"
            :key="s._id"
            class="recent-session"
            @click="loadSession(s._id)"
          >
            <div class="recent-session__info">
              <span class="recent-session__context">{{ formatContext(s.context) }}</span>
              <span class="recent-session__date">{{ formatDate(s.created_at) }}</span>
            </div>
            <v-icon name="hi-chevron-right" scale="0.8" />
          </div>
        </div>

        <div class="disclaimer">
          <v-icon name="hi-information-circle" scale="0.7" />
          <span>
            This AI companion provides supportive conversation, not medical advice.
            If you're in crisis, please call Samaritans: 116 123.
          </span>
        </div>
      </div>
    </div>

    <!-- Active Chat -->
    <div v-if="sessionId" class="companion-chat__messages" ref="messagesContainer">
      <div
        v-for="(msg, i) in messages"
        :key="i"
        class="message"
        :class="`message--${msg.role}`"
      >
        <div v-if="msg.role === 'assistant'" class="message__avatar">
          <v-icon name="hi-sparkles" scale="0.6" />
        </div>
        <div class="message__bubble" :class="`message__bubble--${msg.role}`">
          <p v-for="(line, j) in msg.content.split('\n').filter(l => l.trim())" :key="j">{{ line }}</p>
        </div>
      </div>

      <div v-if="thinking" class="message message--assistant">
        <div class="message__avatar">
          <v-icon name="hi-sparkles" scale="0.6" />
        </div>
        <div class="message__bubble message__bubble--assistant">
          <div class="thinking-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <!-- Session ended -->
      <div v-if="sessionEnded" class="session-ended">
        <v-icon name="hi-check-circle" scale="1" />
        <p>Session ended. A summary has been saved to your records.</p>
        <button class="session-ended__new" @click="resetSession">Start New Conversation</button>
      </div>
    </div>

    <!-- Input Bar -->
    <div v-if="sessionId && !sessionEnded" class="companion-chat__input">
      <div class="input-bar">
        <textarea
          v-model="inputMessage"
          ref="inputField"
          rows="1"
          placeholder="Type your message..."
          @keydown.enter.exact.prevent="sendMessage"
          @input="autoResize"
        ></textarea>
        <button
          class="input-bar__send"
          :disabled="!inputMessage.trim() || sending"
          @click="sendMessage"
        >
          <v-icon name="co-send" scale="1" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject, onMounted, nextTick } from "vue";
import { useToast } from "vue-toast-notification";

const emit = defineEmits(["back"]);
const $http = inject("$http");
const $toast = useToast();

const sessionId = ref(null);
const messages = ref([]);
const inputMessage = ref("");
const sending = ref(false);
const thinking = ref(false);
const sessionEnded = ref(false);
const recentSessions = ref([]);
const messagesContainer = ref(null);
const inputField = ref(null);

const contextOptions = [
  { value: "craving", label: "Craving Support", icon: "hi-lightning-bolt", bg: "rgba(244, 63, 94, 0.1)" },
  { value: "anxiety", label: "Feeling Anxious", icon: "hi-exclamation", bg: "rgba(245, 158, 11, 0.1)" },
  { value: "coping", label: "Coping Strategies", icon: "hi-shield-check", bg: "rgba(16, 185, 129, 0.1)" },
  { value: "motivation", label: "Need Motivation", icon: "hi-sparkles", bg: "rgba(139, 92, 246, 0.1)" },
  { value: "sleep", label: "Sleep Issues", icon: "hi-moon", bg: "rgba(99, 102, 241, 0.1)" },
  { value: "general", label: "Just Talk", icon: "hi-chat", bg: "rgba(100, 116, 139, 0.1)" },
];

function handleBack() {
  if (sessionId.value && !sessionEnded.value) {
    // Don't navigate away mid-session, show confirm
    if (confirm("Leave this conversation? You can resume it later.")) {
      emit("back");
    }
  } else {
    emit("back");
  }
}

async function startSession(context) {
  try {
    thinking.value = true;
    const { data } = await $http.$_startCompanion({ context });
    sessionId.value = data.data.session_id;
    messages.value = [{ role: "assistant", content: data.data.greeting }];
    await scrollToBottom();
  } catch (error) {
    $toast.error(error.response?.data?.message || "Failed to start conversation");
  } finally {
    thinking.value = false;
  }
}

async function sendMessage() {
  const text = inputMessage.value.trim();
  if (!text || sending.value) return;

  messages.value.push({ role: "user", content: text });
  inputMessage.value = "";
  resetInputHeight();
  await scrollToBottom();

  sending.value = true;
  thinking.value = true;
  try {
    const { data } = await $http.$_sendCompanionMessage(sessionId.value, { message: text });
    messages.value.push({ role: "assistant", content: data.data.response });

    if (data.data.crisis_detected) {
      messages.value.push({
        role: "assistant",
        content: "I've noticed you may be going through something serious. Please remember you can reach Samaritans at 116 123 (free, 24/7), or text SHOUT to 85258. You're not alone in this.",
      });
    }
  } catch (error) {
    $toast.error("Failed to send message");
    // Remove the user message if send failed
    messages.value.pop();
  } finally {
    sending.value = false;
    thinking.value = false;
    await scrollToBottom();
  }
}

async function endSession() {
  try {
    await $http.$_endCompanionSession(sessionId.value);
    sessionEnded.value = true;
    await scrollToBottom();
  } catch {
    $toast.error("Failed to end session");
  }
}

async function loadSession(id) {
  try {
    const { data } = await $http.$_getCompanionSession(id);
    const session = data.data;
    sessionId.value = id;
    messages.value = session.structured_data?.conversation_messages || [];
    sessionEnded.value = session.structured_data?.session_ended || false;
    await scrollToBottom();
  } catch {
    $toast.error("Failed to load conversation");
  }
}

function resetSession() {
  sessionId.value = null;
  messages.value = [];
  sessionEnded.value = false;
  inputMessage.value = "";
  fetchRecentSessions();
}

function autoResize() {
  const el = inputField.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}

function resetInputHeight() {
  if (inputField.value) inputField.value.style.height = "auto";
}

async function scrollToBottom() {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function formatContext(ctx) {
  const labels = { craving: "Craving Support", anxiety: "Anxiety", coping: "Coping Strategies", motivation: "Motivation", sleep: "Sleep", general: "General" };
  return labels[ctx] || ctx || "Conversation";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

async function fetchRecentSessions() {
  try {
    const { data } = await $http.$_getCompanionSessions({ limit: 5 });
    recentSessions.value = data.data || [];
  } catch {}
}

onMounted(fetchRecentSessions);
</script>

<style scoped lang="scss">
// ─── Design Tokens ────────────────────────────────────────────────
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$emerald-dark: #059669;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$white: #FFFFFF;
$rose: #F43F5E;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.companion-chat {
  width: 100%;
  height: 100%;
  background: $bg;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  // ─── Chat Header (in-session only) ────────────────────────
  &__header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: $white;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    gap: 12px;
    flex-shrink: 0;
  }

  &__back {
    width: 40px; height: 40px; border: none; background: $bg;
    border-radius: 10px; cursor: pointer; display: flex;
    align-items: center; justify-content: center; color: $slate;
  }

  &__title {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    h2 { font-size: 16px; font-weight: 600; color: $navy; margin: 0; }
  }

  &__avatar {
    width: 36px; height: 36px; border-radius: 12px;
    background: linear-gradient(135deg, $violet-light, rgba($violet, 0.15));
    color: $violet;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  &__status { font-size: 11px; color: $light-gray; }

  &__end {
    padding: 8px 16px; border: 1px solid rgba($rose, 0.2);
    border-radius: 8px; background: $white; color: $rose;
    font-size: 13px; font-weight: 600; cursor: pointer;
    &:hover { background: rgba($rose, 0.05); }
  }

  &__spacer { width: 48px; }

  // ─── Pre-session Start Screen ─────────────────────────────
  &__start {
    flex: 1;
    overflow-y: auto;
  }

  &__start-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px 32px 100px;
    @media (max-width: 768px) { padding: 16px 16px 120px; }
  }

  // ─── Messages Area ─────────────────────────────────────────
  &__messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  // ─── Input Bar ─────────────────────────────────────────────
  &__input {
    padding: 12px 16px 24px;
    background: $white;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    flex-shrink: 0;
  }
}

// ─── Hero ──────────────────────────────────────────────────────────
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $violet 0%, #7C3AED 50%, #6D28D9 100%);
  border-radius: 28px;
  min-height: 300px;
  color: $white;
  margin-bottom: 20px;
  box-shadow: 0 20px 60px rgba(109, 40, 217, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px 32px;
    text-align: center;
    min-height: auto;
  }

  &__content { display: flex; flex-direction: column; }

  &__badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px); border-radius: 24px;
    width: fit-content; margin-bottom: 20px;
    font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
    @media (max-width: 768px) { margin: 0 auto 16px; }
  }

  &__title {
    font-size: 48px; font-weight: 800; line-height: 1.1; letter-spacing: -1px; margin: 0 0 16px;
    @media (max-width: 768px) { font-size: 28px; }
  }

  &__title-accent {
    background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }

  &__subtitle {
    font-size: 16px; opacity: 0.95; line-height: 1.6; margin: 0; max-width: 480px;
    @media (max-width: 768px) { font-size: 14px; max-width: none; }
  }

  &__visual {
    display: flex; justify-content: center; align-items: center; position: relative;
    @media (max-width: 768px) { display: none; }
  }
}

.back-link {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; color: rgba(255, 255, 255, 0.7);
  font-size: 13px; font-weight: 500; cursor: pointer; padding: 0; margin-bottom: 16px;
  transition: color 0.2s; &:hover { color: #fff; }
  @media (max-width: 768px) { margin: 0 auto 12px; }
}

// ─── Animated Orb ────────────────────────────────────────────────
.recovery-orb { position: relative; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; }
.orb-ring {
  position: absolute; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.2);
  &--1 { width: 100%; height: 100%; animation: spin-slow 20s linear infinite; }
  &--2 { width: 80%; height: 80%; animation: spin-slow 15s linear infinite reverse; }
  &--3 { width: 60%; height: 60%; animation: spin-slow 10s linear infinite; }
}
.orb-core {
  width: 100px; height: 100px; background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px); border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: $white;
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(139, 92, 246, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;
}

// ─── Section Heading ───────────────────────────────────────────
.section-heading {
  font-size: 16px;
  font-weight: 600;
  color: $navy;
  margin: 0 0 14px;
}

// ─── Context Cards ─────────────────────────────────────────────
.context-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 28px;
  @media (max-width: 480px) { grid-template-columns: repeat(2, 1fr); }
}

.context-card {
  @include glass-card;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s;

  &:hover { border-color: $violet; box-shadow: 0 8px 32px rgba($violet, 0.12); transform: translateY(-2px); }

  &__icon {
    width: 44px; height: 44px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
  }

  &__label { font-size: 13px; font-weight: 600; color: $navy; text-align: center; }
}

// ─── Recent Sessions ────────────────────────────────────────────
.recent-sessions {
  margin-bottom: 20px;
  h4 { font-size: 14px; font-weight: 600; color: $navy; margin: 0 0 10px; }
}

.recent-session {
  @include glass-card;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 14px;
  cursor: pointer;
  margin-bottom: 8px;
  transition: all 0.2s;

  &:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06); }

  &__info { display: flex; flex-direction: column; gap: 2px; }
  &__context { font-size: 14px; font-weight: 500; color: $navy; }
  &__date { font-size: 12px; color: $light-gray; }
  svg { color: $light-gray; }
}

.disclaimer {
  display: flex;
  gap: 8px;
  padding: 14px 16px;
  background: rgba($amber-light, 0.5);
  border-radius: 12px;
  font-size: 12px;
  color: $gray;
  line-height: 1.5;
  svg { color: $amber; flex-shrink: 0; margin-top: 1px; }
}

// ─── Messages (unchanged) ──────────────────────────────────────
.message {
  display: flex;
  gap: 10px;
  max-width: 85%;

  &--user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  &--assistant { align-self: flex-start; }

  &__avatar {
    width: 32px; height: 32px; border-radius: 10px;
    background: linear-gradient(135deg, $violet-light, rgba($violet, 0.2));
    color: $violet;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  &__bubble {
    padding: 14px 18px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.6;

    p { margin: 0 0 8px; &:last-child { margin: 0; } }

    &--user {
      background: linear-gradient(135deg, $sky, $sky-dark);
      color: $white;
      border-bottom-right-radius: 6px;
    }

    &--assistant {
      background: $white;
      color: $navy;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-bottom-left-radius: 6px;
    }
  }
}

.thinking-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;

  span {
    width: 8px; height: 8px; border-radius: 50%;
    background: $light-gray;
    animation: dot-bounce 1.4s ease-in-out infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

// ─── Session Ended ──────────────────────────────────────────────
.session-ended {
  text-align: center;
  padding: 24px;
  background: $emerald-light;
  border-radius: 16px;
  color: $emerald-dark;

  p { font-size: 14px; margin: 8px 0 16px; }

  &__new {
    padding: 10px 20px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: $white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    &:hover { box-shadow: 0 4px 12px rgba($sky, 0.3); }
  }
}

// ─── Input Bar ──────────────────────────────────────────────────
.input-bar {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  background: $bg;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  padding: 8px 8px 8px 16px;
  max-width: 640px;
  margin: 0 auto;

  textarea {
    flex: 1;
    border: none;
    background: transparent;
    resize: none;
    font-size: 14px;
    color: $navy;
    outline: none;
    font-family: inherit;
    max-height: 120px;
    padding: 6px 0;
    line-height: 1.5;
    &::placeholder { color: $light-gray; }
  }

  &__send {
    width: 40px; height: 40px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: $white;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: all 0.2s;

    &:hover:not(:disabled) { background: $sky-dark; }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
}

// ─── Animations ────────────────────────────────────────────────
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(139, 92, 246, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(139, 92, 246, 0.4); }
}
</style>
