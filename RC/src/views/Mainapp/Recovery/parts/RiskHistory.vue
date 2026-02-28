<template>
  <div class="risk-history">
    <div v-if="!showReportOverlay" class="risk-history__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-shield-exclamation" />
            <span v-if="latestReport" :class="`badge-risk--${latestReport.level}`">{{ latestReport.level }} Risk</span>
            <span v-else>Assessment</span>
          </div>
          <h1 class="hero__title">
            Risk<br/>
            <span class="hero__title-accent">Assessments</span>
          </h1>
          <p class="hero__subtitle">
            {{ reports.length ? `${reports.length} assessment${reports.length !== 1 ? 's' : ''} completed. Monitor your relapse risk over time.` : 'Ask Eka to assess your relapse risk level to begin tracking.' }}
          </p>

          <div class="hero__actions">
            <button class="hero__cta" @click="goToEkaRisk">
              <v-icon name="hi-shield-exclamation" scale="0.85" />
              <span>Check Risk Level</span>
            </button>
            <div v-if="reports.length" class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ reports.length }}</span>
                <span class="hero-stat__label">Total</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ latestReport ? latestReport.score : '—' }}<small v-if="latestReport">/100</small></span>
                <span class="hero-stat__label">Latest Score</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value" style="text-transform: capitalize;">{{ latestReport ? latestReport.level : '—' }}</span>
                <span class="hero-stat__label">Risk Level</span>
              </div>
            </div>
          </div>
        </div>

        <div class="hero__visual">
          <div class="recovery-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-shield-exclamation" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <!-- Score Trend Chart -->
      <div v-if="!loading && chartDataPoints.length >= 2" class="trend-chart-card">
        <div class="trend-chart-card__header">
          <h4>Risk Score Trend</h4>
          <span class="trend-chart-card__sub">0–100 scale</span>
        </div>
        <div class="trend-chart-card__canvas">
          <canvas ref="trendCanvas"></canvas>
        </div>
      </div>

      <!-- Report List -->
      <div v-if="!loading && reports.length" class="report-list">
        <div
          v-for="r in reports"
          :key="r._id"
          class="report-card"
          @click="toggleExpand(r._id)"
        >
          <div class="report-card__top">
            <div class="report-card__date-col">
              <span class="report-card__date">{{ formatDate(r.created_at) }}</span>
              <span v-if="r.context_summary" class="report-card__context">{{ truncate(r.context_summary, 60) }}</span>
            </div>
            <div class="report-card__score-col">
              <span class="report-card__score">{{ r.score }}</span>
              <span class="report-card__max">/100</span>
            </div>
          </div>

          <div class="report-card__risk-row">
            <span class="report-card__risk-badge" :class="`risk--${r.level}`">
              {{ r.level }}
            </span>
            <span v-if="r.previous_score != null" class="report-card__change" :class="scoreChangeClass(r)">
              {{ scoreChangeText(r) }}
            </span>
          </div>

          <!-- Collapsed: top factors preview -->
          <p v-if="r.top_factors?.length && expandedId !== r._id" class="report-card__summary">
            Top factors: {{ r.top_factors.slice(0, 3).map(f => f.label).join(', ') }}
          </p>

          <!-- Expanded Details -->
          <div v-if="expandedId === r._id" class="report-card__details">
            <!-- Category Breakdown -->
            <div v-if="r.categories" class="categories-section">
              <h5>Signal Breakdown</h5>
              <div class="category-bars">
                <div
                  v-for="cat in categoryList(r.categories)"
                  :key="cat.key"
                  class="category-bar"
                >
                  <div class="category-bar__header">
                    <span class="category-bar__name">{{ cat.label }}</span>
                    <span class="category-bar__score">{{ cat.score }}/100</span>
                  </div>
                  <div class="category-bar__track">
                    <div
                      class="category-bar__fill"
                      :style="{ width: cat.score + '%', background: levelColor(levelFromScore(cat.score)) }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Top Factors -->
            <div v-if="r.top_factors?.length" class="factors-section">
              <h5>Contributing Factors</h5>
              <ul>
                <li v-for="(f, i) in r.top_factors" :key="i">
                  <strong>{{ f.label }}</strong>
                  <span v-if="f.recommendation"> — {{ f.recommendation }}</span>
                </li>
              </ul>
            </div>

            <!-- Trend -->
            <div v-if="r.trend" class="trend-section">
              <h5>Trend</h5>
              <p>
                Direction: <strong>{{ r.trend.direction }}</strong>
                <span v-if="r.trend.change_7d != null"> &middot; 7d change: {{ r.trend.change_7d > 0 ? '+' : '' }}{{ r.trend.change_7d }}</span>
                <span v-if="r.trend.change_30d != null"> &middot; 30d change: {{ r.trend.change_30d > 0 ? '+' : '' }}{{ r.trend.change_30d }}</span>
              </p>
            </div>

            <!-- Suggestions -->
            <div v-if="r.suggestions?.length" class="suggestions-section">
              <h5>Suggestions</h5>
              <ul>
                <li v-for="(s, i) in r.suggestions" :key="i">{{ s.text }}</li>
              </ul>
            </div>

            <!-- Context Summary -->
            <div v-if="r.context_summary" class="context-section">
              <h5>Eka's Notes</h5>
              <p>{{ r.context_summary }}</p>
            </div>

            <div class="report-card__actions">
              <button class="report-card__download" @click.stop="downloadPdf(r)">
                <v-icon name="hi-download" scale="0.7" />
                Download PDF
              </button>
              <button class="report-card__open-eka" @click.stop="openInEka(r)">
                <v-icon name="hi-chat" scale="0.7" />
                Open in Eka
              </button>
            </div>
          </div>

          <div class="report-card__expand-hint">
            <v-icon :name="expandedId === r._id ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.6" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !reports.length" class="empty-state">
        <div class="empty-state__icon">
          <v-icon name="hi-shield-exclamation" scale="2.5" />
        </div>
        <h3>No risk assessments yet</h3>
        <p>Ask Eka to check your relapse risk level. Your assessment history will appear here.</p>
        <button class="empty-state__btn" @click="goToEkaRisk">
          <v-icon name="hi-shield-exclamation" scale="0.7" />
          Check Risk Level
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading risk assessment history...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";
import Chart from "chart.js/auto";
import { jsPDF } from "jspdf";
import { mapGetters } from "@/utilities/utilityStore";

const emit = defineEmits(["back"]);
const $http = inject("$http");
const $toast = useToast();
const router = useRouter();
const { userprofile } = mapGetters();

const loading = ref(true);
const reports = ref([]);
const expandedId = ref(null);
const trendCanvas = ref(null);
let trendChartInstance = null;

const latestReport = computed(() => reports.value[0] || null);

const chartDataPoints = computed(() => [...reports.value].reverse());

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

function scoreChangeClass(r) {
  const diff = r.score - r.previous_score;
  if (diff > 0) return "change--up";
  if (diff < 0) return "change--down";
  return "change--same";
}

function scoreChangeText(r) {
  const diff = r.score - r.previous_score;
  if (diff > 0) return `+${diff} from previous`;
  if (diff < 0) return `${diff} from previous`;
  return "No change";
}

const categoryLabels = {
  self_reported: "Self-Reported",
  behavioral: "Behavioral",
  physiological: "Physiological",
  clinical: "Clinical",
  contextual: "Contextual",
};

function categoryList(categories) {
  if (!categories) return [];
  return Object.entries(categories)
    .filter(([, v]) => v && typeof v.score === "number")
    .map(([key, v]) => ({
      key,
      label: categoryLabels[key] || key,
      score: Math.round(v.score),
    }));
}

function levelFromScore(score) {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "moderate";
  return "low";
}

function levelColor(level) {
  const colors = { low: "#10B981", moderate: "#F59E0B", high: "#FB923C", critical: "#F43F5E" };
  return colors[level] || "#94A3B8";
}

function goToEkaRisk() {
  router.push({
    path: "/app/patient/eka",
    query: { prompt: "What's my current relapse risk level?", tags: "recovery" },
  });
}

function openInEka(report) {
  if (report.conversation_id) {
    router.push({
      path: "/app/patient/eka",
      query: { conversation: report.conversation_id },
    });
  } else {
    goToEkaRisk();
  }
}

// ─── Chart Logic ───────────────────────────────────────────────
const riskColors = { low: "#10B981", moderate: "#F59E0B", high: "#FB923C", critical: "#F43F5E" };

function renderTrendChart() {
  if (!trendCanvas.value || chartDataPoints.value.length < 2) return;
  if (trendChartInstance) trendChartInstance.destroy();

  const points = chartDataPoints.value;
  const labels = points.map((p) =>
    new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  );
  const scores = points.map((p) => p.score);
  const colors = points.map((p) => riskColors[p.level] || "#64748B");

  trendChartInstance = new Chart(trendCanvas.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Risk Score",
          data: scores,
          borderColor: "#0288D1",
          backgroundColor: "rgba(2, 136, 209, 0.1)",
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: colors,
          pointBorderColor: colors,
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.9)",
          cornerRadius: 8,
          titleFont: { size: 13 },
          bodyFont: { size: 13 },
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const p = points[ctx.dataIndex];
              return `Score: ${p.score}/100  •  ${(p.level || "").toUpperCase()}`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748B", font: { size: 12 } } },
        y: {
          min: 0,
          max: 100,
          grid: { color: "rgba(0,0,0,0.04)" },
          ticks: { color: "#64748B", font: { size: 12 }, stepSize: 25 },
        },
      },
    },
  });
}

// ─── PDF Download ───────────────────────────────────────────────
async function loadLogo() {
  try {
    const res = await fetch("/RapidCapsule_Logo.png");
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

async function downloadPdf(report) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const centerX = w / 2;
  let y = 15;

  // Header band
  doc.setFillColor(1, 87, 155);
  doc.rect(0, 0, w, 42, "F");

  const logo = await loadLogo();
  if (logo) {
    const logoH = 16;
    const logoW = logoH * (400 / 331);
    doc.addImage(logo, "PNG", centerX - logoW / 2, 4, logoW, logoH);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text("EkaGPT Risk Assessment Report", centerX, 30, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(200, 220, 255);
  const dateStr = new Date(report.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  doc.text(dateStr, centerX, 37, { align: "center" });

  doc.setDrawColor(255, 92, 0);
  doc.setLineWidth(1);
  doc.line(0, 42, w, 42);

  y = 52;

  // Patient info
  const p = userprofile.value?.profile;
  if (p) {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
    if (name) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text("Patient:", 20, y);
      doc.setFont("helvetica", "normal");
      doc.text(name, 42, y);
      y += 6;
    }
    if (p.date_of_birth) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text("DOB:", 20, y);
      doc.setFont("helvetica", "normal");
      const dob = new Date(p.date_of_birth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      doc.text(dob, 36, y);
      y += 6;
    }
    y += 2;
  }

  // Risk Score + Level
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text(`Risk Score: ${report.score}/100`, 14, y);
  const lc = levelColor(report.level);
  const rgb = hexToRgb(lc);
  doc.setTextColor(rgb.r, rgb.g, rgb.b);
  doc.text(`Level: ${report.level.toUpperCase()}`, w - 14, y, { align: "right" });
  y += 12;

  // Category Breakdown
  if (report.categories) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text("Signal Breakdown", 14, y);
    y += 8;

    const cats = categoryList(report.categories);
    for (const cat of cats) {
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(51, 65, 85);
      doc.text(`${cat.label}: ${cat.score}/100`, 14, y);
      // Bar background
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(70, y - 3.5, 100, 5, 1.5, 1.5, "F");
      // Bar fill
      const bc = hexToRgb(levelColor(levelFromScore(cat.score)));
      doc.setFillColor(bc.r, bc.g, bc.b);
      doc.roundedRect(70, y - 3.5, Math.max(cat.score, 2), 5, 1.5, 1.5, "F");
      y += 8;
    }
    y += 4;
  }

  // Top Factors
  if (report.top_factors?.length) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text("Top Contributing Factors", 14, y);
    y += 8;

    for (const f of report.top_factors) {
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(51, 65, 85);
      const line = `• ${f.label}${f.recommendation ? ' — ' + f.recommendation : ''}`;
      const lines = doc.splitTextToSize(line, w - 28);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 2;
      if (y > 270) { doc.addPage(); y = 15; }
    }
    y += 4;
  }

  // Trend
  if (report.trend) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text("Trend", 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.setTextColor(51, 65, 85);
    let trendText = `Direction: ${report.trend.direction}`;
    if (report.trend.change_7d != null) trendText += ` | 7-day change: ${report.trend.change_7d > 0 ? '+' : ''}${report.trend.change_7d}`;
    if (report.trend.change_30d != null) trendText += ` | 30-day change: ${report.trend.change_30d > 0 ? '+' : ''}${report.trend.change_30d}`;
    doc.text(trendText, 14, y);
    y += 10;
  }

  // Suggestions
  if (report.suggestions?.length) {
    if (y > 250) { doc.addPage(); y = 15; }
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont(undefined, "bold");
    doc.text("Suggestions", 14, y);
    y += 7;
    for (const s of report.suggestions) {
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(`• ${s.text}`, w - 28);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 2;
      if (y > 270) { doc.addPage(); y = 15; }
    }
    y += 4;
  }

  // Disclaimer
  if (y > 255) { doc.addPage(); y = 15; }
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const disclaimer = "This report is for informational purposes only and does not constitute medical advice. Always consult a qualified healthcare professional.";
  const dLines = doc.splitTextToSize(disclaimer, w - 28);
  doc.text(dLines, 14, y);

  // Footer
  const ph = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Rapid Capsule — Predictive Relapse Risk Engine", 14, ph - 10);
  doc.text(dateStr, w - 14, ph - 10, { align: "right" });

  const fileName = `Risk-Assessment-${new Date(report.created_at).toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 100, g: 116, b: 139 };
}

// ─── Fetch Data ─────────────────────────────────────────────────
async function fetchData() {
  loading.value = true;
  try {
    const res = await $http.$_getRiskAssessmentReports({ limit: 50 });
    const data = res.data.data;
    reports.value = data.reports || [];
  } catch {
    $toast.error("Failed to load risk assessment history");
  } finally {
    loading.value = false;
    await nextTick();
    renderTrendChart();
  }
}

onMounted(fetchData);
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
$rose-light: #FFE4E6;
$rose-dark: #BE123C;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$orange: #FB923C;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

// ─── Page ──────────────────────────────────────────────────────────
.risk-history {
  width: 100%;
  min-height: 100%;
  background: $bg;

  &__content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 24px 32px 100px;
    @media (max-width: 768px) { padding: 16px 16px 120px; }
  }
}

// ─── Hero ──────────────────────────────────────────────────────────
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  min-height: 320px;
  color: $white;
  margin-bottom: 20px;
  box-shadow: 0 20px 60px rgba($sky-dark, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;

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
    font-size: 16px; opacity: 0.95; line-height: 1.6; margin: 0 0 28px; max-width: 480px;
    @media (max-width: 768px) { font-size: 14px; max-width: none; }
  }

  &__actions {
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
    @media (max-width: 768px) { flex-direction: column; gap: 12px; }
  }

  &__cta {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px; border-radius: 16px;
    background: rgba(255, 255, 255, 0.95); color: $sky-darker;
    font-size: 15px; font-weight: 700; border: none; cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transition: all 0.25s;
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2); background: #fff; }
    @media (max-width: 768px) { width: 100%; justify-content: center; }
  }

  &__stats {
    display: flex; align-items: center; gap: 20px;
    padding: 16px 20px; background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px); border-radius: 16px; width: fit-content;
    @media (max-width: 768px) { width: 100%; justify-content: space-around; gap: 10px; padding: 12px 14px; }
  }

  &__visual {
    display: flex; justify-content: center; align-items: center; position: relative;
    @media (max-width: 768px) { display: none; }
  }
}

.hero-stat {
  display: flex; flex-direction: column; align-items: center;
  &__value {
    font-size: 24px; font-weight: 700; line-height: 1;
    small { font-size: 13px; font-weight: 500; opacity: 0.6; }
    @media (max-width: 768px) { font-size: 18px; }
  }
  &__label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; margin-top: 4px; }
  &__divider { width: 1px; height: 32px; background: rgba(255, 255, 255, 0.2); }
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
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba($sky, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;
}

// ─── Trend Chart Card ──────────────────────────────────────────
.trend-chart-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;
  margin: 20px 0 0;

  &__header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
    h4 { font-size: 14px; font-weight: 600; color: $navy; margin: 0; }
  }

  &__sub {
    font-size: 11px; color: $gray; background: rgba(0, 0, 0, 0.04);
    padding: 3px 8px; border-radius: 6px;
  }

  &__canvas {
    height: 220px; position: relative;
    @media (max-width: 640px) { height: 180px; }
  }
}

// ─── Report List ─────────────────────────────────────────────────
.report-list {
  display: flex; flex-direction: column; gap: 10px;
  padding: 20px 0 0;
}

.report-card {
  @include glass-card;
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); }

  &__top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
  &__date-col { display: flex; flex-direction: column; gap: 2px; }
  &__date { font-size: 13px; font-weight: 600; color: $slate; }
  &__context { font-size: 12px; color: $light-gray; }
  &__score-col { display: flex; align-items: baseline; }
  &__score { font-size: 28px; font-weight: 800; color: $navy; line-height: 1; }
  &__max { font-size: 14px; color: $light-gray; font-weight: 500; }

  &__risk-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  &__risk-badge {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
    padding: 3px 10px; border-radius: 6px;
  }
  &__change {
    font-size: 11px; font-weight: 600;
  }

  &__summary {
    font-size: 13px; color: $slate; line-height: 1.5; margin: 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  &__details { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.06); }

  &__actions {
    display: flex; gap: 8px; margin-top: 14px;
    @media (max-width: 640px) { flex-direction: column; }
  }

  &__download,
  &__open-eka {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    flex: 1; padding: 10px 16px;
    border-radius: 10px;
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  }

  &__download {
    border: 1px solid $sky-dark; background: transparent; color: $sky-dark;
    &:hover { background: $sky-light; }
  }

  &__open-eka {
    border: 1px solid $sky-dark; background: transparent; color: $sky-dark;
    &:hover { background: $sky-light; }
  }

  &__expand-hint { display: flex; justify-content: center; margin-top: 8px; color: $light-gray; }
}

// ─── Score Change ────────────────────────────────────────────────
.change--up { color: $rose; }
.change--down { color: $emerald; }
.change--same { color: $gray; }

// ─── Risk Level Badges ──────────────────────────────────────────
.risk--low { background: $emerald-light; color: $emerald-dark; }
.risk--moderate { background: $amber-light; color: darken($amber, 10%); }
.risk--high { background: #FED7AA; color: #C2410C; }
.risk--critical { background: $rose-light; color: $rose; }

// ─── Detail Sections ─────────────────────────────────────────────
.categories-section,
.factors-section,
.trend-section,
.suggestions-section,
.context-section {
  margin-bottom: 14px;

  h5 {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.3px; color: $sky-dark; margin: 0 0 8px;
  }
  p { font-size: 13px; color: $slate; line-height: 1.6; margin: 0; }
  ul {
    margin: 0; padding: 0 0 0 18px;
    li { font-size: 13px; color: $slate; line-height: 1.6; margin-bottom: 4px; }
  }
}

.category-bars {
  display: flex; flex-direction: column; gap: 8px;
}

.category-bar {
  &__header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;
  }
  &__name { font-size: 12px; font-weight: 500; color: $slate; }
  &__score { font-size: 11px; color: $gray; }
  &__track {
    height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden;
  }
  &__fill {
    height: 100%; border-radius: 3px; transition: width 0.5s ease;
  }
}

.context-section {
  background: rgba($sky, 0.04); border-radius: 10px;
  padding: 12px; border-left: 3px solid $sky;
  p { color: $sky-dark; font-style: italic; }
}

// ─── Empty State ────────────────────────────────────────────────
.empty-state {
  text-align: center; padding: 48px 0;

  &__icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, $sky-light, rgba($sky, 0.15));
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; color: $sky-dark;
  }

  h3 { font-size: 18px; font-weight: 700; color: $navy; margin: 0 0 8px; }
  p { font-size: 14px; color: $gray; margin: 0 0 24px; line-height: 1.5; max-width: 360px; margin-left: auto; margin-right: auto; }

  &__btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px; border-radius: 14px;
    background: linear-gradient(135deg, $sky-dark, $sky-darker);
    color: $white; font-size: 15px; font-weight: 600; border: none; cursor: pointer;
    box-shadow: 0 4px 16px rgba($sky-darker, 0.3); transition: all 0.25s;
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba($sky-darker, 0.4); }
  }
}

// ─── Loading ─────────────────────────────────────────────────────
.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 400px; gap: 16px; color: $gray; font-size: 14px;
}
.loading-spinner {
  width: 36px; height: 36px; border: 3px solid rgba($sky, 0.2);
  border-top-color: $sky; border-radius: 50%; animation: spin 0.8s linear infinite;
}

// ─── Animations ──────────────────────────────────────────────────
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba($sky, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba($sky, 0.4); }
}
</style>
