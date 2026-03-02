<template>
  <div class="screening-history">
    <div v-if="!showReportOverlay" class="screening-history__content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link" @click="$emit('back')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Back</span>
          </button>
          <div class="hero__badge">
            <v-icon name="hi-clipboard-check" />
            <span v-if="latestScreening" :class="`badge-risk--${latestScreening.risk_level}`">{{ latestScreening.risk_level }} Risk</span>
            <span v-else>Assessment</span>
          </div>
          <h1 class="hero__title">
            Screening<br/>
            <span class="hero__title-accent">History</span>
          </h1>
          <p class="hero__subtitle">
            {{ screenings.length ? `${screenings.length} screening${screenings.length !== 1 ? 's' : ''} completed. Track your progress over time.` : 'Take your first addiction screening assessment with Eka to establish a baseline.' }}
          </p>

          <div class="hero__actions">
            <button class="hero__cta" @click="goToEkaScreening">
              <v-icon name="hi-clipboard-check" scale="0.85" />
              <span>Take a Screening</span>
            </button>
            <div v-if="screenings.length" class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ screenings.length }}</span>
                <span class="hero-stat__label">Total</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value">{{ latestScreening ? latestScreening.total_score : '—' }}</span>
                <span class="hero-stat__label">Latest Score</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value" style="text-transform: capitalize;">{{ latestScreening ? latestScreening.risk_level : '—' }}</span>
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
              <v-icon name="hi-clipboard-check" scale="2" />
            </div>
          </div>
        </div>
      </section>

      <!-- Tab Filter -->
      <div class="filter-section">
        <div class="tab-filter">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-filter__btn"
            :class="{ 'tab-filter__btn--active': activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Score Trend Chart -->
      <div v-if="!loading && chartDataPoints.length >= 2" class="trend-chart-card">
        <div class="trend-chart-card__header">
          <h4>Score Trend</h4>
          <span class="trend-chart-card__sub">{{ chartInstrumentLabel }}</span>
        </div>
        <div class="trend-chart-card__canvas">
          <canvas ref="trendCanvas"></canvas>
        </div>
      </div>

      <!-- Screening List -->
      <div v-if="!loading && filteredScreenings.length" class="screening-list">
        <div
          v-for="s in filteredScreenings"
          :key="s._id"
          class="screening-card"
          @click="toggleExpand(s._id)"
        >
          <div class="screening-card__top">
            <div class="screening-card__instrument">
              <span class="screening-card__instrument-badge">{{ instrumentLabel(s.instrument) }}</span>
              <span class="screening-card__date">{{ formatDate(s.created_at) }}</span>
            </div>
            <div class="screening-card__score-col">
              <span class="screening-card__score">{{ s.total_score }}</span>
              <span class="screening-card__max">/{{ maxScore(s.instrument) }}</span>
            </div>
          </div>

          <div class="screening-card__risk-row">
            <span class="screening-card__risk-badge" :class="`risk--${s.risk_level}`">
              {{ s.risk_level }}
            </span>
            <span v-if="s.risk_zone_label" class="screening-card__risk-label">{{ s.risk_zone_label }}</span>
          </div>

          <!-- Specialist badge for clinician-administered assessments -->
          <div v-if="s.screening_type === 'specialist_administered' || s.administered_by" class="screening-card__specialist-badge">
            <v-icon name="hi-user" scale="0.55" />
            Specialist Administered
          </div>

          <!-- AI Summary (collapsed) -->
          <p v-if="s.ai_interpretation?.content?.summary && expandedId !== s._id" class="screening-card__summary">
            {{ s.ai_interpretation.content.summary }}
          </p>

          <!-- Expanded Details -->
          <div v-if="expandedId === s._id" class="screening-card__details">
            <!-- Withdrawal Clinical Action -->
            <div v-if="isWithdrawalScale(s.instrument)" class="ai-section">
              <div v-if="s.risk_zone_label" class="ai-section__block">
                <h5>Severity</h5>
                <p>{{ s.risk_zone_label }}</p>
              </div>
              <div v-if="getWithdrawalClinicalAction(s)" class="ai-section__block ai-section__block--clinical">
                <h5>Clinical Recommendation</h5>
                <p>{{ getWithdrawalClinicalAction(s) }}</p>
              </div>
              <div v-if="s.answers && Object.keys(s.answers).length" class="ai-section__block">
                <h5>Item Scores</h5>
                <div class="withdrawal-items">
                  <div v-for="(val, key) in s.answers" :key="key" class="withdrawal-item">
                    <span class="withdrawal-item__label">{{ formatItemId(key) }}</span>
                    <span class="withdrawal-item__value">{{ val }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- AI Interpretation (self-reported screenings) -->
            <div v-else-if="s.ai_interpretation?.content" class="ai-section">
              <div v-if="s.ai_interpretation.content.summary" class="ai-section__block">
                <h5>Summary</h5>
                <p>{{ s.ai_interpretation.content.summary }}</p>
              </div>
              <div v-if="s.ai_interpretation.content.risk_assessment" class="ai-section__block">
                <h5>Risk Assessment</h5>
                <p>{{ s.ai_interpretation.content.risk_assessment }}</p>
              </div>
              <div v-if="s.ai_interpretation.content.recommended_interventions?.length" class="ai-section__block">
                <h5>Recommended Actions</h5>
                <ul>
                  <li v-for="(item, i) in s.ai_interpretation.content.recommended_interventions" :key="i">{{ item }}</li>
                </ul>
              </div>
              <div v-if="s.ai_interpretation.content.motivational_message" class="ai-section__block ai-section__block--motivational">
                <p>"{{ s.ai_interpretation.content.motivational_message }}"</p>
              </div>
              <div v-if="s.ai_interpretation.content.comparison_to_previous" class="ai-section__block">
                <h5>Compared to Previous</h5>
                <p>{{ s.ai_interpretation.content.comparison_to_previous }}</p>
              </div>
            </div>
            <div v-else class="ai-section__empty">
              <v-icon name="hi-information-circle" scale="0.7" />
              <span>No AI interpretation available for this screening.</span>
            </div>

            <button
              v-if="!isWithdrawalScale(s.instrument)"
              class="screening-card__view-report"
              @click.stop="openFullReport(s)"
            >
              <v-icon name="hi-document-report" scale="0.7" />
              {{ loadingReport === s._id ? 'Loading...' : 'View Full Report' }}
            </button>

            <div class="screening-card__meta">
              <span v-if="s.duration_ms">Completed in {{ Math.round(s.duration_ms / 1000) }}s</span>
              <span v-if="s.is_baseline" class="screening-card__baseline">Baseline</span>
            </div>
          </div>

          <div class="screening-card__expand-hint">
            <v-icon :name="expandedId === s._id ? 'hi-chevron-up' : 'hi-chevron-down'" scale="0.6" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !filteredScreenings.length" class="empty-state">
        <div class="empty-state__icon">
          <v-icon name="hi-clipboard-check" scale="2.5" />
        </div>
        <h3>{{ activeTab === 'all' ? 'No screenings yet' : 'No ' + instrumentLabel(activeTab) + ' screenings' }}</h3>
        <p>Take your first addiction screening assessment with Eka to establish a baseline and track your progress.</p>
        <button class="empty-state__btn" @click="goToEkaScreening">
          <v-icon name="hi-clipboard-check" scale="0.7" />
          Take a Screening
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading screening history...</p>
      </div>
    </div>

    <!-- Full Report Overlay -->
    <div v-if="showReportOverlay && reportData" class="report-overlay">
      <div class="report-overlay__body">
        <section class="report-hero">
          <div class="report-hero__content">
            <button class="back-link" @click="showReportOverlay = false">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Back</span>
            </button>
            <div class="report-hero__badge" :class="`report-hero__badge--${reportData.risk_level}`">
              <v-icon name="hi-clipboard-check" />
              <span>{{ reportData.risk_level }} Risk</span>
            </div>
            <h1 class="report-hero__title">
              {{ reportData.instrument_name || reportData.instrument }}<br/>
              <span class="report-hero__title-accent">Report</span>
            </h1>
            <p class="report-hero__subtitle">
              Completed on {{ reportData.date ? new Date(reportData.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' }}
              &middot; Score: {{ reportData.total_score }}/{{ reportData.max_score }}
            </p>
            <div class="report-hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ reportData.total_score }}/{{ reportData.max_score }}</span>
                <span class="hero-stat__label">Score</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value" style="text-transform: capitalize;">{{ reportData.risk_level }}</span>
                <span class="hero-stat__label">Risk Level</span>
              </div>
            </div>
          </div>
          <div class="report-hero__visual">
            <div class="recovery-orb recovery-orb--report">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="hi-clipboard-check" scale="2" />
              </div>
            </div>
          </div>
        </section>

        <EkaScreeningReport :data="reportData" :patient="patientInfo" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useToast } from "vue-toast-notification";
import Chart from "chart.js/auto";
import EkaScreeningReport from "@/components/EkaChat/EkaScreeningReport.vue";
import { mapGetters } from "@/utilities/utilityStore";

const emit = defineEmits(["back"]);
const $http = inject("$http");
const { userprofile } = mapGetters();

const patientInfo = computed(() => {
  const p = userprofile.value?.profile;
  if (!p) return null;
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
  const dob = p.date_of_birth
    ? new Date(p.date_of_birth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;
  return name || dob ? { name: name || null, dob } : null;
});
const $toast = useToast();
const router = useRouter();

const loading = ref(true);
const screenings = ref([]);
const activeTab = ref("all");
const expandedId = ref(null);
const trendCanvas = ref(null);
let trendChartInstance = null;

// Report overlay state
const showReportOverlay = ref(false);
const reportData = ref(null);
const loadingReport = ref(null);

const tabs = [
  { key: "all", label: "All" },
  { key: "audit", label: "AUDIT" },
  { key: "dast10", label: "DAST-10" },
  { key: "cage", label: "CAGE" },
  { key: "assist", label: "ASSIST" },
  { key: "cows", label: "COWS" },
  { key: "ciwa_ar", label: "CIWA-Ar" },
];

const latestScreening = computed(() => screenings.value[0] || null);

const filteredScreenings = computed(() => {
  if (activeTab.value === "all") return screenings.value;
  return screenings.value.filter((s) => s.instrument === activeTab.value);
});

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id;
}

function instrumentLabel(instrument) {
  const labels = { audit: "AUDIT", dast10: "DAST-10", cage: "CAGE", assist: "ASSIST", cows: "COWS", ciwa_ar: "CIWA-Ar" };
  return labels[instrument] || instrument;
}

function maxScore(instrument) {
  const scores = { audit: 40, dast10: 10, cage: 4, assist: 39, cows: 48, ciwa_ar: 67 };
  return scores[instrument] || "?";
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

function isWithdrawalScale(instrument) {
  return instrument === 'cows' || instrument === 'ciwa_ar';
}

function formatItemId(id) {
  if (!id) return '';
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

const withdrawalClinicalActions = {
  cows: {
    mild: 'Monitor; consider comfort medications. May initiate buprenorphine induction.',
    moderate: 'Suitable for buprenorphine induction. Provide symptomatic treatment.',
    moderately_severe: 'Initiate buprenorphine induction. Consider increased monitoring.',
    severe: 'Immediate intervention required. Consider inpatient management.',
  },
  ciwa_ar: {
    mild: 'May not require medication. Monitor every 4\u20138 hours. Supportive care.',
    moderate: 'Consider medication (benzodiazepines). Monitor every 2\u20134 hours.',
    moderately_severe: 'Medication indicated. Consider intensive care monitoring. Reassess every 1\u20132 hours.',
    severe: 'Intensive care recommended. High risk of seizures and delirium tremens. Continuous monitoring.',
  },
};

function getWithdrawalClinicalAction(screening) {
  const actions = withdrawalClinicalActions[screening.instrument];
  return actions ? actions[screening.risk_level] : null;
}

function goToEkaScreening() {
  router.push({
    path: "/app/patient/eka",
    query: { prompt: "I want to take a screening assessment", tags: "recovery" },
  });
}

// ─── Chart Logic ───────────────────────────────────────────────
const riskColors = { low: "#10B981", mild: "#F59E0B", moderate: "#FB923C", high: "#FB923C", moderately_severe: "#EF4444", severe: "#F43F5E" };

const chartDataPoints = computed(() => {
  const list = filteredScreenings.value;
  if (activeTab.value === "all") {
    const instruments = [...new Set(list.map((s) => s.instrument))];
    if (instruments.length !== 1) return [];
  }
  return [...list].reverse();
});

const chartInstrumentLabel = computed(() => {
  if (!chartDataPoints.value.length) return "";
  return instrumentLabel(chartDataPoints.value[0].instrument);
});

function renderTrendChart() {
  if (!trendCanvas.value || chartDataPoints.value.length < 2) return;
  if (trendChartInstance) trendChartInstance.destroy();

  const points = chartDataPoints.value;
  const maxPossible = maxScore(points[0].instrument);

  const labels = points.map((p) =>
    new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  );
  const scores = points.map((p) => p.total_score);
  const colors = points.map((p) => riskColors[p.risk_level] || "#64748B");

  trendChartInstance = new Chart(trendCanvas.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Score",
          data: scores,
          borderColor: "#4FC3F7",
          backgroundColor: "rgba(79, 195, 247, 0.1)",
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
              return `Score: ${p.total_score}/${maxPossible}  •  ${(p.risk_level || "").toUpperCase()}`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#64748B", font: { size: 12 } } },
        y: {
          min: 0,
          max: maxPossible,
          grid: { color: "rgba(0,0,0,0.04)" },
          ticks: { color: "#64748B", font: { size: 12 }, stepSize: Math.ceil(maxPossible / 5) },
        },
      },
    },
  });
}

watch(activeTab, async () => {
  await nextTick();
  renderTrendChart();
});

// ─── Report Overlay ────────────────────────────────────────────
function getColourForRiskLevel(level) {
  const colours = { low: "#10B981", mild: "#F59E0B", moderate: "#F97316", high: "#F97316", moderately_severe: "#EF4444", severe: "#DC2626" };
  return colours[level] || "#94A3B8";
}

function getRecommendation(score, riskZones) {
  if (!riskZones) return null;
  const zone = riskZones.find((z) => score >= z.min_score && score <= z.max_score);
  return zone?.recommendation || null;
}

async function openFullReport(screening) {
  loadingReport.value = screening._id;
  try {
    const res = await $http.$_getScreeningById(screening._id);
    const s = res.data.data;
    const details = s.instrument_details || {};

    reportData.value = {
      instrument: s.instrument,
      instrument_name: details.name || instrumentLabel(s.instrument),
      total_score: s.total_score,
      max_score: details.max_score || maxScore(s.instrument),
      risk_level: s.risk_level,
      risk_zone_label: s.risk_zone_label,
      colour: getColourForRiskLevel(s.risk_level),
      recommendation: getRecommendation(s.total_score, details.risk_zones),
      risk_zones: details.risk_zones || [],
      subscale_scores: s.subscale_scores || {},
      ai_interpretation: s.ai_interpretation?.content || s.ai_interpretation || null,
      previous_score: null,
      is_baseline: s.is_baseline,
      date: s.created_at,
    };
    showReportOverlay.value = true;
  } catch {
    $toast.error("Failed to load screening report");
  } finally {
    loadingReport.value = null;
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const res = await $http.$_getScreeningHistory({ limit: 50 });
    const data = res.data.data;
    screenings.value = data.docs || data || [];
  } catch {
    $toast.error("Failed to load screening history");
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
$amber: #F59E0B;
$amber-light: #FEF3C7;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

// ─── Page ──────────────────────────────────────────────────────────
.screening-history {
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
  box-shadow: 0 20px 60px rgba(2, 136, 209, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;

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
  &__value { font-size: 24px; font-weight: 700; line-height: 1; @media (max-width: 768px) { font-size: 18px; } }
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
  box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;
}

// ─── Filter Section ──────────────────────────────────────────────
.filter-section {
  padding: 24px 0 0;
}

.tab-filter {
  display: flex; gap: 4px;
  background: $white; border-radius: 14px; padding: 4px;
  border: 1px solid rgba(0, 0, 0, 0.05); overflow-x: auto;

  &__btn {
    flex: 1; padding: 10px 8px; border: none; border-radius: 10px;
    font-size: 12px; font-weight: 600; color: $gray;
    background: transparent; cursor: pointer; white-space: nowrap; transition: all 0.2s;
    &:hover { color: $navy; }
    &--active {
      background: linear-gradient(135deg, $sky-dark, $sky-darker);
      color: $white;
      box-shadow: 0 2px 8px rgba($sky-dark, 0.3);
    }
  }
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

// ─── Screening List ─────────────────────────────────────────────
.screening-list {
  display: flex; flex-direction: column; gap: 10px;
  padding: 20px 0 0;
}

.screening-card {
  @include glass-card;
  border-radius: 16px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); }

  &__top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
  &__instrument { display: flex; flex-direction: column; gap: 2px; }
  &__instrument-badge { font-size: 13px; font-weight: 700; color: $sky-dark; }
  &__date { font-size: 12px; color: $light-gray; }
  &__score-col { display: flex; align-items: baseline; }
  &__score { font-size: 28px; font-weight: 800; color: $navy; line-height: 1; }
  &__max { font-size: 14px; color: $light-gray; font-weight: 500; }

  &__risk-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  &__risk-badge {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
    padding: 3px 10px; border-radius: 6px;
  }
  &__risk-label { font-size: 12px; color: $gray; }

  &__summary {
    font-size: 13px; color: $slate; line-height: 1.5; margin: 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  &__details { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(0, 0, 0, 0.06); }

  &__meta {
    display: flex; align-items: center; gap: 10px; margin-top: 12px;
    font-size: 11px; color: $light-gray;
  }

  &__baseline {
    background: $sky-light; color: $sky-dark; font-weight: 600;
    padding: 2px 8px; border-radius: 4px;
  }

  &__specialist-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 10px; background: rgba($sky, 0.08); border-radius: 6px;
    font-size: 11px; font-weight: 600; color: $sky-dark; margin-bottom: 6px;
    width: fit-content;
  }

  &__expand-hint { display: flex; justify-content: center; margin-top: 8px; color: $light-gray; }

  &__view-report {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    margin-top: 12px; padding: 10px 16px; width: 100%;
    border: 1px solid $sky-dark; border-radius: 10px;
    background: transparent; color: $sky-dark;
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    &:hover { background: $sky-light; }
  }
}

// ─── Risk Level Badges ──────────────────────────────────────────
.risk--low { background: $emerald-light; color: $emerald-dark; }
.risk--mild { background: $amber-light; color: darken($amber, 10%); }
.risk--moderate { background: #FFEDD5; color: #C2410C; }
.risk--high { background: #FED7AA; color: #C2410C; }
.risk--moderately_severe { background: $rose-light; color: #DC2626; }
.risk--severe { background: #FCA5A5; color: #991B1B; }

// ─── AI Section ─────────────────────────────────────────────────
.ai-section {
  display: flex; flex-direction: column; gap: 12px;

  &__block {
    h5 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; color: $sky-dark; margin: 0 0 6px; }
    p { font-size: 13px; color: $slate; line-height: 1.6; margin: 0; }
    ul { margin: 0; padding: 0 0 0 18px; li { font-size: 13px; color: $slate; line-height: 1.6; margin-bottom: 4px; } }

    &--motivational {
      background: rgba($emerald, 0.06); border-radius: 10px;
      padding: 12px; border-left: 3px solid $emerald;
      p { font-style: italic; color: $emerald-dark; }
    }
  }

  &__empty {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: $light-gray; font-style: italic;
    svg { flex-shrink: 0; }
  }
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
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: $white; font-size: 15px; font-weight: 600; border: none; cursor: pointer;
    box-shadow: 0 4px 16px rgba($sky-dark, 0.3); transition: all 0.25s;
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba($sky-dark, 0.4); }
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

// ─── Report Overlay ────────────────────────────────────────────
.report-overlay {
  width: 100%;
  min-height: 100%;
  background: $bg;

  &__body {
    max-width: 1400px; margin: 0 auto;
    padding: 24px 32px 100px; width: 100%;
    @media (max-width: 768px) { padding: 16px 16px 120px; }
  }
}

// ─── Report Hero ──────────────────────────────────────────────
.report-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  min-height: 300px;
  color: $white;
  margin-bottom: 20px;
  box-shadow: 0 20px 60px rgba(2, 136, 209, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;

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

    &--low { background: rgba($emerald, 0.3); }
    &--moderate { background: rgba($amber, 0.3); }
    &--high { background: rgba(#F97316, 0.3); }
    &--severe { background: rgba($rose, 0.3); }
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

.recovery-orb--report { position: relative; width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; }

// ─── Animations ──────────────────────────────────────────────────
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}
</style>
