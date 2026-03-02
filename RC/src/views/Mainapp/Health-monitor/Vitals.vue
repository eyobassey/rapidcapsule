<template>
  <div class="vitals-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="notification-btn" @click="goToNotifications">
        <v-icon name="hi-bell" scale="1.1" />
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero__content">
          <button class="back-link desktop-only" @click="$router.push('/app/patient/dashboard')">
            <v-icon name="hi-arrow-left" scale="0.85" />
            <span>Dashboard</span>
          </button>
          <div class="hero__badge">
            <div class="badge-pulse"></div>
            <v-icon name="hi-heart" />
            <span>Health Monitoring</span>
          </div>
          <h1 class="hero__title">
            Health<br/>
            <span class="hero__title-accent">Vitals</span>
          </h1>
          <p class="hero__subtitle">
            Track and monitor your health metrics over time for better wellness insights.
          </p>
          <div class="hero__stats">
            <div class="hero-stat">
              <span class="hero-stat__value">{{ vitalList.length }}</span>
              <span class="hero-stat__label">Tracked</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value hero-stat__value--success">{{ normalCount }}</span>
              <span class="hero-stat__label">Normal</span>
            </div>
            <div class="hero-stat__divider"></div>
            <div class="hero-stat">
              <span class="hero-stat__value hero-stat__value--warning">{{ alertCount }}</span>
              <span class="hero-stat__label">Alerts</span>
            </div>
          </div>
          <button class="hero-btn" @click="$router.push('/app/patient/onboarding/vitals-metrics')">
            <v-icon name="hi-pencil-alt" scale="0.9" />
            <span>Update Vitals</span>
          </button>
        </div>
        <div class="hero__visual">
          <div class="vitals-orb">
            <div class="orb-ring orb-ring--1"></div>
            <div class="orb-ring orb-ring--2"></div>
            <div class="orb-ring orb-ring--3"></div>
            <div class="orb-core">
              <v-icon name="hi-heart" />
            </div>
          </div>
          <div class="floating-icons">
            <div class="float-icon float-icon--1"><v-icon name="fa-thermometer-half" /></div>
            <div class="float-icon float-icon--2"><v-icon name="fa-heartbeat" /></div>
            <div class="float-icon float-icon--3"><v-icon name="bi-droplet-fill" /></div>
          </div>
        </div>
      </section>

      <!-- Empty State -->
      <div v-if="!vitalList.length" class="empty-state">
        <div class="empty-illustration">
          <div class="illustration-rings">
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="ring ring-3"></div>
          </div>
          <div class="illustration-icon">
            <v-icon name="hi-heart" scale="2" />
          </div>
        </div>
        <h2>Start Tracking Your Health</h2>
        <p>Add your first vital sign to begin monitoring your health metrics and see trends over time.</p>
        <button class="empty-cta" @click="openAddModal">
          <v-icon name="hi-plus" />
          Add Your First Vital
        </button>
      </div>

      <!-- Wellness Dashboard -->
      <div v-if="vitalList.length" class="wellness">
        <!-- Section Header -->
        <div class="wellness-header">
          <h2 class="wellness-header__title">Daily Wellness</h2>
          <div class="wellness-header__right">
            <button v-if="vitalList.length < 20" class="wl-add-btn" @click="openAddModal">
              <v-icon name="hi-plus" scale="0.8" />
              <span>Add Vital</span>
            </button>
            <button class="wl-icon-btn" @click="downloadChart" title="Download">
              <v-icon name="hi-download" scale="0.85" />
            </button>
            <button class="wl-icon-btn" @click="handleShareChartURL" title="Share">
              <v-icon name="hi-share" scale="0.85" />
            </button>
          </div>
        </div>

        <!-- Score Cards (Top 3 Vitals) -->
        <div class="score-row">
          <div
            v-for="(vital, idx) in topThreeVitals"
            :key="vital.name"
            class="score-card"
            :class="{ 'score-card--active': activeVitalChart === vital.name }"
            @click="selectedVitalHandler(vital.name)"
          >
            <div class="score-card__top">
              <span class="score-card__name">{{ vital.name }}</span>
              <button class="score-card__edit" @click.stop="updateVital(vital)" title="Update">
                <v-icon name="hi-pencil" scale="0.6" />
              </button>
            </div>
            <div class="score-card__mid">
              <div class="score-card__numbers">
                <span class="score-card__val">{{ vital.value }}</span>
                <span class="score-card__unit">{{ vital.unit }}</span>
              </div>
              <div class="score-card__spark" :class="getVitalColorClass(vital.name)">
                <svg viewBox="0 0 80 32" preserveAspectRatio="none">
                  <path :d="getSparklinePath(idx)" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
            <div class="score-card__badge" :class="getVitalStatusClass(vital)">
              <v-icon :name="getStatusIcon(vital)" scale="0.5" />
              <span>{{ getStatusText(vital) }}</span>
            </div>
          </div>
        </div>

        <!-- Lifestyle & Metrics -->
        <div v-if="remainingVitals.length || bmiData" class="lifestyle-section">
          <div class="lifestyle-section__head">
            <h3>Lifestyle &amp; Metrics</h3>
          </div>
          <div class="lifestyle-grid">
            <div
              v-for="vital in remainingVitals"
              :key="vital.name"
              class="lifestyle-card"
              :class="{ 'lifestyle-card--active': activeVitalChart === vital.name }"
              @click="selectedVitalHandler(vital.name)"
            >
              <div class="lifestyle-card__top">
                <div class="lifestyle-card__icon" :class="getVitalColorClass(vital.name)">
                  <v-icon :name="getVitalIcon(vital.name)" scale="0.85" />
                </div>
                <button class="lifestyle-card__edit" @click.stop="updateVital(vital)" title="Update">
                  <v-icon name="hi-pencil" scale="0.55" />
                </button>
              </div>
              <span class="lifestyle-card__label">{{ vital.name }}</span>
              <div class="lifestyle-card__value-row">
                <span class="lifestyle-card__val">{{ vital.value }}</span>
                <span class="lifestyle-card__unit">{{ vital.unit }}</span>
              </div>
              <div class="lifestyle-card__bar">
                <div
                  class="lifestyle-card__bar-fill"
                  :class="getVitalStatusClass(vital)"
                  :style="{ width: getProgressPercent(vital) + '%' }"
                ></div>
              </div>
              <div class="lifestyle-card__status" :class="getVitalStatusClass(vital)">
                <v-icon :name="getStatusIcon(vital)" scale="0.5" />
                <span>{{ getStatusText(vital) }}</span>
              </div>
            </div>

            <!-- BMI Card -->
            <div v-if="bmiData" class="lifestyle-card lifestyle-card--bmi">
              <div class="lifestyle-card__top">
                <div class="lifestyle-card__icon vital--bmi">
                  <v-icon name="hi-scale" scale="0.85" />
                </div>
              </div>
              <span class="lifestyle-card__label">BMI</span>
              <div class="lifestyle-card__value-row">
                <span class="lifestyle-card__val">{{ bmiData.value }}</span>
                <span class="lifestyle-card__unit">kg/m²</span>
              </div>
              <div class="lifestyle-card__bar">
                <div
                  class="lifestyle-card__bar-fill"
                  :class="bmiData.status"
                  :style="{ width: ((bmiData.value / 40) * 100) + '%' }"
                ></div>
              </div>
              <div class="lifestyle-card__cat-badge" :class="bmiData.status">
                {{ bmiData.category }}
              </div>
            </div>
          </div>
        </div>

        <!-- Chart Panel -->
        <div class="chart-section">
          <div class="chart-section__head">
            <div>
              <h3 class="chart-section__title">Vital Trends</h3>
              <p class="chart-section__sub">Health data patterns over time</p>
            </div>
            <div class="chart-section__actions">
              <button class="wl-icon-btn" @click="downloadChart" title="Download">
                <v-icon name="hi-download" scale="0.85" />
              </button>
              <button class="wl-icon-btn" @click="handleShareChartURL" title="Share">
                <v-icon name="hi-share" scale="0.85" />
              </button>
            </div>
          </div>
          <div class="chart-section__tabs">
            <button
              v-for="vital in vitalList"
              :key="vital"
              class="chart-tab"
              :class="{ active: activeVitalChart === vital }"
              @click="selectedVitalHandler(vital)"
            >
              <v-icon :name="getVitalIcon(vital)" scale="0.7" />
              <span>{{ getShortName(vital) }}</span>
            </button>
          </div>
          <div class="chart-section__canvas">
            <Chart
              ref="chartComponent"
              :chartData="data"
              :chartType="chart_type"
              :selectedVital="activeVitalChart"
              :patientName="patientFullName"
            />
          </div>
          <div class="chart-legend" v-if="activeVitalChart === 'Blood Pressure'">
            <div class="legend-item">
              <span class="legend-dot systolic"></span>
              <span>Systolic</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot diastolic"></span>
              <span>Diastolic</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Update Vital Modal -->
    <Teleport to="body">
      <div v-if="openModal" class="modal-overlay" @click.self="close">
        <div class="modal-container">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="modal-header__content">
              <div class="modal-icon">
                <v-icon name="hi-heart" scale="1.1" />
              </div>
              <div class="modal-title">
                <h3>{{ modalType === 'add' ? 'Log New Vital' : 'Update Vital' }}</h3>
                <p>{{ modalType === 'add' ? 'Select a vital type and enter your reading' : 'Update your measurement' }}</p>
              </div>
            </div>
            <button class="modal-close" @click="close">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="modal-body">
            <!-- Vital Type Selection (Add Mode) -->
            <div v-if="modalType === 'add'" class="vital-selection">
              <label class="field-label">Select Vital Type</label>
              <div class="vital-options">
                <button
                  v-for="vitalType in vitalDropList"
                  :key="vitalType"
                  class="vital-option"
                  :class="[getVitalColorClass(vitalType), { selected: selectedVital === vitalType }]"
                  @click="selectedVital = vitalType"
                >
                  <div class="option-icon">
                    <v-icon :name="getVitalIcon(vitalType)" scale="1" />
                  </div>
                  <div class="option-info">
                    <span class="option-name">{{ vitalType }}</span>
                    <span class="option-range">{{ getNormalRange(vitalType) }}</span>
                  </div>
                  <div v-if="selectedVital === vitalType" class="option-check">
                    <v-icon name="hi-check" scale="0.8" />
                  </div>
                </button>
              </div>
            </div>

            <!-- Selected Vital Display (Update Mode) -->
            <div v-else class="selected-vital">
              <div class="selected-vital__card" :class="getVitalColorClass(selectedVital)">
                <div class="selected-icon">
                  <v-icon :name="getVitalIcon(selectedVital)" scale="1.1" />
                </div>
                <div class="selected-info">
                  <span class="selected-name">{{ selectedVital }}</span>
                  <span class="selected-range">Normal: {{ getNormalRange(selectedVital) }}</span>
                </div>
              </div>
            </div>

            <!-- Input Section -->
            <div v-if="selectedVital" class="input-section">
              <label class="field-label">Enter Your Reading</label>

              <!-- Single Value Input -->
              <div v-if="selectedVital !== 'Blood Pressure'" class="input-row">
                <div class="input-group">
                  <input
                    type="number"
                    v-model="vital.input1.value"
                    :placeholder="getPlaceholder(selectedVital)"
                    class="value-input"
                    step="0.1"
                  />
                  <select v-model="vital.input1.unit" class="unit-select">
                    <option v-for="unit in getUnitOptions(selectedVital)" :key="unit" :value="unit">
                      {{ unit }}
                    </option>
                  </select>
                </div>
                <p class="input-hint">
                  <v-icon name="hi-information-circle" scale="0.75" />
                  {{ getInputHint(selectedVital) }}
                </p>
              </div>

              <!-- Blood Pressure Input (Two Values) -->
              <div v-else class="bp-inputs">
                <div class="bp-field">
                  <label>Systolic <span class="label-hint">(Top Number)</span></label>
                  <div class="input-group">
                    <input
                      type="number"
                      v-model="vital.input1.value"
                      placeholder="120"
                      class="value-input"
                    />
                    <span class="unit-display">mmHg</span>
                  </div>
                </div>
                <div class="bp-separator">/</div>
                <div class="bp-field">
                  <label>Diastolic <span class="label-hint">(Bottom Number)</span></label>
                  <div class="input-group">
                    <input
                      type="number"
                      v-model="vital.input2.value"
                      placeholder="80"
                      class="value-input"
                    />
                    <span class="unit-display">mmHg</span>
                  </div>
                </div>
              </div>

              <!-- Visual Indicator -->
              <div v-if="vital.input1.value" class="reading-indicator" :class="getReadingStatus()">
                <div class="indicator-track">
                  <div class="indicator-fill"></div>
                  <div class="indicator-marker" :style="{ left: getIndicatorPosition() }"></div>
                </div>
                <div class="indicator-labels">
                  <span>Low</span>
                  <span>Normal</span>
                  <span>High</span>
                </div>
                <div class="indicator-result">
                  <v-icon :name="getReadingStatusIcon()" scale="0.9" />
                  <span>{{ getReadingStatusText() }}</span>
                </div>
              </div>

              <!-- Date & Time -->
              <div class="datetime-section">
                <label class="field-label">When was this reading taken?</label>
                <div class="datetime-row">
                  <div class="datetime-field">
                    <label>Date <span class="required">*</span></label>
                    <div class="datetime-input-wrapper">
                      <v-icon name="hi-calendar" scale="0.85" />
                      <input
                        type="date"
                        v-model="vital.date"
                        :max="new Date().toISOString().split('T')[0]"
                        required
                      />
                    </div>
                  </div>
                  <div class="datetime-field">
                    <label>Time <span class="optional">(Optional)</span></label>
                    <div class="datetime-input-wrapper">
                      <v-icon name="hi-clock" scale="0.85" />
                      <input type="time" v-model="vital.time" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="modal-footer">
            <button class="btn-cancel" @click="close">Cancel</button>
            <button
              class="btn-save"
              :disabled="!canSave || loading"
              @click="addVitals(selectedVital, true)"
            >
              <template v-if="!loading">
                <v-icon name="hi-check" scale="0.9" />
                {{ modalType === 'add' ? 'Save Vital' : 'Update Vital' }}
              </template>
              <template v-else>
                <span class="spinner"></span>
                Saving...
              </template>
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import Chart from "@/components/Charts/chart-vitals.vue";
import { handleImageUploadToCloudinary } from "./functions";

export default {
  name: "Vitals",

  emits: ["openSideNav"],

  components: {
    Chart,
  },

  data() {
    return {
      data: {},
      chart_type: "",
      query1: null,

      openModal: false,
      loading: false,
      dropList: [
        "Body Temperature",
        "Body Weight",
        "Pulse Rate",
        "Blood Sugar Level",
        "Blood Pressure",
        "Blood Oxygen (SpO2)",
        "Steps",
        "Sleep",
        "Calories Burned",
        "Distance",
        "Respiratory Rate",
        "Stress Level",
        "Body Fat",
        "Active Minutes",
        "Hydration",
        "Muscle Mass",
        "Bone Mass",
        "Body Water",
        "Visceral Fat",
        "BMR",
      ],

      selectedVital: null,
      activeVitalChart: null,
      modalType: "add",

      vital: {
        input1: { value: "", unit: "" },
        input2: { value: "", unit: "" },
        date: "",
        time: "",
      },

      isFetchingUrl: false,

      normalRanges: {
        "Body Temperature": { min: 36.1, max: 37.2, unit: "°C" },
        "Body Weight": { min: 18.5, max: 24.9, unit: "BMI" },
        "Pulse Rate": { min: 60, max: 100, unit: "bpm" },
        "Blood Sugar Level": { min: 70, max: 100, unit: "mg/dL" },
        "Blood Pressure": { systolic: { min: 90, max: 120 }, diastolic: { min: 60, max: 80 } },
        "Blood Oxygen (SpO2)": { min: 95, max: 100, unit: "%" },
        "Steps": { min: 0, max: 999999, unit: "steps" },
        "Sleep": { min: 7, max: 9, unit: "hours" },
        "Calories Burned": { min: 0, max: 999999, unit: "kcal" },
        "Distance": { min: 0, max: 999999, unit: "km" },
        "Respiratory Rate": { min: 12, max: 20, unit: "breaths/min" },
        "Stress Level": { min: 0, max: 75, unit: "score" },
        "Body Fat": { min: 10, max: 25, unit: "%" },
        "Active Minutes": { min: 0, max: 999999, unit: "min" },
        "Hydration": { min: 0, max: 999999, unit: "L" },
        "Muscle Mass": { min: 20, max: 80, unit: "kg" },
        "Bone Mass": { min: 1, max: 5, unit: "kg" },
        "Body Water": { min: 45, max: 65, unit: "%" },
        "Visceral Fat": { min: 1, max: 12, unit: "level" },
        "BMR": { min: 1000, max: 2500, unit: "kcal" },
      },

      fieldToName: {
        body_temp: "Body Temperature",
        blood_pressure: "Blood Pressure",
        blood_sugar_level: "Blood Sugar Level",
        body_weight: "Body Weight",
        pulse_rate: "Pulse Rate",
        spo2: "Blood Oxygen (SpO2)",
        steps: "Steps",
        sleep: "Sleep",
        calories_burned: "Calories Burned",
        distance: "Distance",
        respiratory_rate: "Respiratory Rate",
        stress_level: "Stress Level",
        body_fat: "Body Fat",
        active_minutes: "Active Minutes",
        hydration: "Hydration",
        muscle_mass: "Muscle Mass",
        bone_mass: "Bone Mass",
        body_water: "Body Water",
        visceral_fat: "Visceral Fat",
        bmr: "BMR",
      },

      nameToField: {
        "Body Temperature": "body_temp",
        "Body Weight": "body_weight",
        "Pulse Rate": "pulse_rate",
        "Blood Sugar Level": "blood_sugar_level",
        "Blood Pressure": "blood_pressure",
        "Blood Oxygen (SpO2)": "spo2",
        "Steps": "steps",
        "Sleep": "sleep",
        "Calories Burned": "calories_burned",
        "Distance": "distance",
        "Respiratory Rate": "respiratory_rate",
        "Stress Level": "stress_level",
        "Body Fat": "body_fat",
        "Active Minutes": "active_minutes",
        "Hydration": "hydration",
        "Muscle Mass": "muscle_mass",
        "Bone Mass": "bone_mass",
        "Body Water": "body_water",
        "Visceral Fat": "visceral_fat",
        "BMR": "bmr",
      },
    };
  },

  computed: {
    ...mapGetters({
      recentVitals: "recentVitals",
      selectedVitalRecords: "vitalsManagement/selectedVitalRecords",
      userProfile: "userprofile",
    }),

    recentvitalarray() {
      return this.getVitalArray(this.recentVitals);
    },

    vitalList() {
      const vitalArray = [];
      Object.keys(this.recentVitals).forEach((key) => {
        const name = this.fieldToName[key];
        if (name) vitalArray.push(name);
      });
      return vitalArray;
    },

    vitalDropList() {
      if (this.modalType === "add") {
        return this.dropList.filter(v => !this.vitalList.includes(v));
      }
      return this.vitalList;
    },

    canSave() {
      if (!this.selectedVital || !this.vital.date) return false;
      if (this.selectedVital === "Blood Pressure") {
        return this.vital.input1.value && this.vital.input2.value;
      }
      return this.vital.input1.value && this.vital.input1.unit;
    },

    patientFullName() {
      const profile = this.userProfile?.profile;
      if (!profile) return '';
      const firstName = profile.first_name || '';
      const lastName = profile.last_name || '';
      return `${firstName} ${lastName}`.trim();
    },

    userHeight() {
      const height = this.userProfile?.profile?.basic_health_info?.height;
      if (!height || !height.value) return null;
      return {
        value: parseFloat(height.value),
        unit: height.unit || 'cm'
      };
    },

    normalCount() {
      return this.recentvitalarray.filter(v => this.getVitalStatusClass(v) === 'status--normal').length;
    },

    alertCount() {
      return this.recentvitalarray.filter(v =>
        this.getVitalStatusClass(v) === 'status--high' ||
        this.getVitalStatusClass(v) === 'status--low'
      ).length;
    },

    bmiData() {
      const weightVital = this.recentVitals?.body_weight;
      if (!weightVital || !weightVital.value) return null;
      if (!this.userHeight) return null;

      let weightKg = parseFloat(weightVital.value);
      let heightM = this.userHeight.value;

      if (weightVital.unit === 'lb') {
        weightKg = weightKg * 0.453592;
      }

      if (this.userHeight.unit === 'cm') {
        heightM = heightM / 100;
      } else if (this.userHeight.unit === 'ft' || this.userHeight.unit === 'feet') {
        heightM = heightM * 0.3048;
      } else if (this.userHeight.unit === 'in' || this.userHeight.unit === 'inches') {
        heightM = heightM * 0.0254;
      }

      const bmi = weightKg / (heightM * heightM);

      return {
        value: bmi.toFixed(1),
        category: this.getBMICategory(bmi),
        status: this.getBMIStatus(bmi)
      };
    },

    topThreeVitals() {
      return this.recentvitalarray.slice(0, 3);
    },

    remainingVitals() {
      return this.recentvitalarray.slice(3);
    },
  },

  methods: {
    ...mapActions({
      getSelectedVitalRecords: "vitalsManagement/getSelectedVitalRecords",
      addVital: "vitalsManagement/addVitals",
      updateVitals: "vitalsManagement/updateVitals",
    }),

    goToNotifications() {
      this.$router.push('/app/patient/notifications');
    },

    getSparklinePath(index) {
      const paths = [
        'M2,24 L12,20 L22,22 L32,16 L42,18 L52,10 L62,12 L72,6 L78,8',
        'M2,28 L12,24 L22,26 L32,18 L42,22 L52,14 L62,10 L72,16 L78,6',
        'M2,20 L12,22 L22,16 L32,24 L42,14 L52,20 L62,12 L72,8 L78,10',
      ];
      return paths[index % paths.length];
    },

    getProgressPercent(vital) {
      const value = parseFloat(vital.value);
      const range = this.normalRanges[vital.name];
      if (!range || !range.min) return 50;
      if (vital.name === 'Blood Pressure') return 50;
      const span = range.max - range.min;
      if (span <= 0) return 50;
      const pct = ((value - range.min) / span) * 100;
      return Math.max(5, Math.min(100, pct));
    },

    getVitalIcon(name) {
      const icons = {
        "Body Temperature": "fa-thermometer-half",
        "Body Weight": "fa-weight",
        "Pulse Rate": "hi-heart",
        "Blood Sugar Level": "bi-droplet-fill",
        "Blood Pressure": "fa-heartbeat",
        "BMI": "hi-scale",
        "Blood Oxygen (SpO2)": "fa-lungs",
        "Steps": "fa-walking",
        "Sleep": "hi-moon",
        "Calories Burned": "fa-fire-alt",
        "Distance": "fa-running",
        "Respiratory Rate": "fa-lungs",
        "Stress Level": "hi-lightning-bolt",
        "Body Fat": "bi-droplet-fill",
        "Active Minutes": "fa-stopwatch",
        "Hydration": "io-water-outline",
        "Muscle Mass": "fa-weight",
        "Bone Mass": "fa-bone",
        "Body Water": "bi-droplet-fill",
        "Visceral Fat": "hi-chart-bar",
        "BMR": "fa-fire-alt",
      };
      return icons[name] || "hi-heart";
    },

    getBMICategory(bmi) {
      if (bmi < 18.5) return "Underweight";
      if (bmi < 25) return "Normal";
      if (bmi < 30) return "Overweight";
      return "Obese";
    },

    getBMIStatus(bmi) {
      if (bmi < 18.5) return "status--low";
      if (bmi < 25) return "status--normal";
      return "status--high";
    },

    getVitalColorClass(name) {
      const classes = {
        "Body Temperature": "vital--temp",
        "Body Weight": "vital--weight",
        "Pulse Rate": "vital--pulse",
        "Blood Sugar Level": "vital--sugar",
        "Blood Pressure": "vital--pressure",
        "BMI": "vital--bmi",
        "Blood Oxygen (SpO2)": "vital--spo2",
        "Steps": "vital--steps",
        "Sleep": "vital--sleep",
        "Calories Burned": "vital--calories",
        "Distance": "vital--distance",
        "Respiratory Rate": "vital--respiratory",
        "Stress Level": "vital--stress",
        "Body Fat": "vital--bodyfat",
        "Active Minutes": "vital--activemins",
        "Hydration": "vital--hydration",
        "Muscle Mass": "vital--muscle",
        "Bone Mass": "vital--bone",
        "Body Water": "vital--bodywater",
        "Visceral Fat": "vital--visceral",
        "BMR": "vital--bmr",
      };
      return classes[name] || "";
    },

    getShortName(name) {
      const shorts = {
        "Body Temperature": "Temp",
        "Body Weight": "Weight",
        "Pulse Rate": "Pulse",
        "Blood Sugar Level": "Sugar",
        "Blood Pressure": "BP",
        "Blood Oxygen (SpO2)": "SpO2",
        "Steps": "Steps",
        "Sleep": "Sleep",
        "Calories Burned": "Calories",
        "Distance": "Distance",
        "Respiratory Rate": "Resp",
        "Stress Level": "Stress",
        "Body Fat": "Fat %",
        "Active Minutes": "Active",
        "Hydration": "Water",
        "Muscle Mass": "Muscle",
        "Bone Mass": "Bone",
        "Body Water": "H₂O %",
        "Visceral Fat": "Visceral",
        "BMR": "BMR",
      };
      return shorts[name] || name;
    },

    getNormalRange(name) {
      const ranges = {
        "Body Temperature": "36.1-37.2°C",
        "Body Weight": "Varies by height",
        "Pulse Rate": "60-100 bpm",
        "Blood Sugar Level": "70-100 mg/dL",
        "Blood Pressure": "90-120/60-80 mmHg",
        "Blood Oxygen (SpO2)": "95-100%",
        "Steps": "7,000-10,000/day",
        "Sleep": "7-9 hours",
        "Calories Burned": "Varies by activity",
        "Distance": "Varies by activity",
        "Respiratory Rate": "12-20 breaths/min",
        "Stress Level": "0-75 (low-moderate)",
        "Body Fat": "10-25%",
        "Active Minutes": "30+ min/day",
        "Hydration": "2-3 L/day",
        "Muscle Mass": "Varies by build",
        "Bone Mass": "1-5 kg",
        "Body Water": "45-65%",
        "Visceral Fat": "1-12 (healthy)",
        "BMR": "1,200-2,000 kcal",
      };
      return ranges[name] || "";
    },

    getPlaceholder(name) {
      const placeholders = {
        "Body Temperature": "36.5",
        "Body Weight": "70",
        "Pulse Rate": "72",
        "Blood Sugar Level": "90",
        "Blood Oxygen (SpO2)": "98",
        "Steps": "8000",
        "Sleep": "7.5",
        "Calories Burned": "2000",
        "Distance": "5.0",
        "Respiratory Rate": "16",
        "Stress Level": "40",
        "Body Fat": "21",
        "Active Minutes": "45",
        "Hydration": "2.5",
        "Muscle Mass": "59",
        "Bone Mass": "3.1",
        "Body Water": "57",
        "Visceral Fat": "8",
        "BMR": "1700",
      };
      return placeholders[name] || "";
    },

    getUnitOptions(name) {
      const units = {
        "Body Temperature": ["°C", "°F"],
        "Body Weight": ["kg", "lb"],
        "Pulse Rate": ["bpm"],
        "Blood Sugar Level": ["mg/dL", "mmol/L"],
        "Blood Oxygen (SpO2)": ["%"],
        "Steps": ["steps"],
        "Sleep": ["hours"],
        "Calories Burned": ["kcal"],
        "Distance": ["km", "mi"],
        "Respiratory Rate": ["breaths/min"],
        "Stress Level": ["score"],
        "Body Fat": ["%"],
        "Active Minutes": ["min"],
        "Hydration": ["L", "mL"],
        "Muscle Mass": ["kg", "lb"],
        "Bone Mass": ["kg", "lb"],
        "Body Water": ["%"],
        "Visceral Fat": ["level"],
        "BMR": ["kcal"],
      };
      return units[name] || [];
    },

    getInputHint(name) {
      const hints = {
        "Body Temperature": "Normal body temperature is 36.1-37.2°C (97-99°F)",
        "Body Weight": "Track your weight to monitor health trends",
        "Pulse Rate": "Resting heart rate for adults is 60-100 bpm",
        "Blood Sugar Level": "Fasting blood sugar should be 70-100 mg/dL",
        "Blood Oxygen (SpO2)": "Normal blood oxygen is 95-100%",
        "Steps": "Aim for 7,000-10,000 steps per day",
        "Sleep": "Adults need 7-9 hours of sleep per night",
        "Calories Burned": "Average adult burns 1,800-2,400 kcal daily",
        "Distance": "Track distance walked, run, or cycled",
        "Respiratory Rate": "Normal breathing rate is 12-20 breaths/min",
        "Stress Level": "Lower scores indicate less stress (0-100)",
        "Body Fat": "Healthy body fat is 10-25% for men, 18-30% for women",
        "Active Minutes": "Aim for 30+ minutes of activity daily",
        "Hydration": "Adults should drink 2-3 liters of water daily",
        "Muscle Mass": "Track skeletal muscle mass from your smart scale",
        "Bone Mass": "Normal bone mass is 1-5 kg depending on frame",
        "Body Water": "Healthy body water percentage is 45-65%",
        "Visceral Fat": "Levels 1-12 are considered healthy",
        "BMR": "Basal metabolic rate - calories burned at rest",
      };
      return hints[name] || "";
    },

    getVitalStatusClass(vital) {
      const value = parseFloat(vital.value);
      const range = this.normalRanges[vital.name];

      if (!range || !range.min) return "status--normal";

      if (vital.name === "Blood Pressure") {
        const [sys, dia] = vital.value.split("/").map(Number);
        const sysRange = range.systolic;
        const diaRange = range.diastolic;

        if (sys < sysRange.min || dia < diaRange.min) return "status--low";
        if (sys > sysRange.max || dia > diaRange.max) return "status--high";
        return "status--normal";
      }

      if (value < range.min) return "status--low";
      if (value > range.max) return "status--high";
      return "status--normal";
    },

    getStatusIcon(vital) {
      const status = this.getVitalStatusClass(vital);
      if (status === "status--normal") return "hi-check-circle";
      if (status === "status--low") return "hi-arrow-down";
      return "hi-arrow-up";
    },

    getStatusText(vital) {
      const status = this.getVitalStatusClass(vital);
      if (status === "status--normal") return "Normal";
      if (status === "status--low") return "Below normal";
      return "Above normal";
    },

    getReadingStatus() {
      if (!this.vital.input1.value || !this.selectedVital) return "";
      const value = parseFloat(this.vital.input1.value);
      const range = this.normalRanges[this.selectedVital];

      if (!range || !range.min) return "";

      if (value < range.min) return "status--low";
      if (value > range.max) return "status--high";
      return "status--normal";
    },

    getReadingStatusIcon() {
      const status = this.getReadingStatus();
      if (status === "status--normal") return "hi-check-circle";
      if (status === "status--low") return "hi-arrow-down";
      return "hi-arrow-up";
    },

    getReadingStatusText() {
      const status = this.getReadingStatus();
      if (status === "status--normal") return "Within normal range";
      if (status === "status--low") return "Below normal range";
      return "Above normal range";
    },

    getIndicatorPosition() {
      if (!this.vital.input1.value || !this.selectedVital) return "50%";
      const value = parseFloat(this.vital.input1.value);
      const range = this.normalRanges[this.selectedVital];

      if (!range || !range.min) return "50%";

      const totalRange = (range.max - range.min) * 2;
      const midPoint = (range.min + range.max) / 2;
      const offset = ((value - midPoint) / totalRange) * 100 + 50;

      return Math.max(5, Math.min(95, offset)) + "%";
    },

    openAddModal() {
      this.modalType = "add";
      this.selectedVital = this.vitalDropList[0] || null;

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);

      this.vital = {
        input1: { value: "", unit: "" },
        input2: { value: "", unit: "" },
        date: today,
        time: currentTime,
      };

      if (this.selectedVital) {
        const units = this.getUnitOptions(this.selectedVital);
        if (units.length) this.vital.input1.unit = units[0];
      }

      this.openModal = true;
    },

    updateVital(val) {
      this.modalType = "update";
      this.selectedVital = val.name;

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);

      if (val.value && val.value.includes("/")) {
        const [sys, dia] = val.value.split("/");
        this.vital.input1.value = sys;
        this.vital.input2.value = dia;
      } else {
        this.vital.input1.value = val.value;
      }
      this.vital.input1.unit = val.unit;
      this.vital.input2.unit = val.unit;
      this.vital.date = today;
      this.vital.time = currentTime;

      this.openModal = true;
    },

    close() {
      this.openModal = false;
      this.vital = { input1: { value: "", unit: "" }, input2: { value: "", unit: "" }, date: "", time: "" };
    },

    async addVitals(name, close) {
      const val = this.vital.input2.value
        ? `${this.vital.input1.value}/${this.vital.input2.value}`
        : this.vital.input1.value;

      this.loading = true;

      let recordedAt = this.vital.date;
      if (this.vital.time) {
        recordedAt = `${this.vital.date}T${this.vital.time}:00`;
      }

      let res;
      if (this.modalType === "add") {
        res = await this.addVital({
          name: name,
          value: val,
          unit: this.vital.input1.unit || "mmHg",
          recorded_at: recordedAt,
        });
      } else {
        res = await this.updateVitals({
          name: name,
          value: val,
          unit: this.vital.input1.unit || "mmHg",
          recorded_at: recordedAt,
        });
      }

      if (res) {
        this.selectedVitalHandler(this.activeVitalChart);
        this.loading = false;
        this.vital = { input1: { value: "", unit: "" }, input2: { value: "", unit: "" }, date: "", time: "" };
        if (close) this.openModal = false;
      } else {
        this.loading = false;
      }
    },

    getVitalArray(val) {
      const vitalArray = [];
      Object.keys(val).forEach((key) => {
        const vitalName = this.fieldToName[key];
        if (vitalName && val[key]?.value) {
          vitalArray.push({
            name: vitalName,
            value: val[key].value,
            unit: val[key].unit || '',
          });
        }
      });
      return vitalArray;
    },

    async selectedVitalHandler(val) {
      if (!val && this.vitalList.length) {
        val = this.vitalList[0];
      }

      this.activeVitalChart = val;
      const field = this.nameToField[val];
      if (!field) return;

      this.query1 = field;

      const barChartVitals = ["Body Temperature", "Blood Sugar Level", "Steps", "Sleep", "Calories Burned", "Active Minutes", "Hydration"];
      const chartType = barChartVitals.includes(val) ? "bar" : "line";

      await this.getSelectedVitalRecords(this.query1);
      this.cleanData(this.selectedVitalRecords, chartType);
    },

    cleanData(dataObj, type) {
      const chartdata = dataObj;
      if (!chartdata || !chartdata.length) {
        this.data = { labels: [], datasets: [] };
        return;
      }

      const xAxis = chartdata.map((row) =>
        new Date(row.date).toLocaleDateString("en", { day: "2-digit", month: "short" })
      );

      let valueSet = [];

      // Blood Pressure - Dual line chart for Systolic and Diastolic
      if (this.query1 === "blood_pressure") {
        const systolicData = [];
        const diastolicData = [];

        chartdata.forEach((row) => {
          const validSysValues = [];
          const validDiaValues = [];

          row.data.forEach((item) => {
            const val = item.value;
            if (val && typeof val === 'string' && val.includes('/')) {
              const parts = val.split('/');
              const sys = parseInt(parts[0], 10);
              const dia = parseInt(parts[1], 10);

              if (!isNaN(sys)) validSysValues.push(sys);
              if (!isNaN(dia)) validDiaValues.push(dia);
            } else if (val && typeof val === 'number') {
              validSysValues.push(val);
            }
          });

          const sysAvg = validSysValues.length > 0
            ? Math.round(validSysValues.reduce((a, b) => a + b, 0) / validSysValues.length)
            : null;
          const diaAvg = validDiaValues.length > 0
            ? Math.round(validDiaValues.reduce((a, b) => a + b, 0) / validDiaValues.length)
            : null;

          systolicData.push(sysAvg);
          diastolicData.push(diaAvg);
        });

        valueSet = [
          {
            label: "Systolic",
            data: systolicData,
            backgroundColor: "rgba(79, 195, 247, 0.1)",
            borderColor: "#4FC3F7",
            pointBackgroundColor: "#fff",
            pointBorderColor: "#0288D1",
            fill: false,
          },
          {
            label: "Diastolic",
            data: diastolicData,
            backgroundColor: "rgba(244, 63, 94, 0.1)",
            borderColor: "#F43F5E",
            pointBackgroundColor: "#fff",
            pointBorderColor: "#E11D48",
            fill: false,
          },
        ];
      }
      // Body Temperature - Bar chart with orange color
      else if (this.query1 === "body_temp") {
        const tempData = chartdata.map((row) => {
          const values = row.data.map((item) => parseFloat(item.value));
          if (values.length === 1) return values[0];
          // Show range if multiple readings
          return [Math.min(...values), Math.max(...values)];
        });

        valueSet.push({
          label: "Temperature",
          data: tempData,
          backgroundColor: "rgba(249, 115, 22, 0.75)",
          borderColor: "#F97316",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 24,
        });
      }
      // Pulse Rate - Line chart with area fill
      else if (this.query1 === "pulse_rate") {
        const pulseData = chartdata.map((row) => {
          const values = row.data.map((item) => parseInt(item.value));
          return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        });

        valueSet.push({
          label: "Pulse Rate",
          data: pulseData,
          backgroundColor: "rgba(79, 195, 247, 0.15)",
          borderColor: "#4FC3F7",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#0288D1",
          fill: true,
        });
      }
      // Blood Sugar Level - Bar chart with blue color
      else if (this.query1 === "blood_sugar_level") {
        const sugarData = chartdata.map((row) => {
          const values = row.data.map((item) => parseFloat(item.value));
          if (values.length === 1) return values[0];
          return [Math.min(...values), Math.max(...values)];
        });

        valueSet.push({
          label: "Blood Sugar",
          data: sugarData,
          backgroundColor: "rgba(14, 165, 233, 0.75)",
          borderColor: "#0EA5E9",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 24,
        });
      }
      // Body Weight - Line chart with purple color and trend
      else if (this.query1 === "body_weight") {
        const weightData = chartdata.map((row) => {
          const values = row.data.map((item) => parseFloat(item.value));
          return values.reduce((a, b) => a + b, 0) / values.length;
        });

        valueSet.push({
          label: "Weight",
          data: weightData,
          backgroundColor: "rgba(139, 92, 246, 0.15)",
          borderColor: "#8B5CF6",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#7C3AED",
          fill: true,
        });
      }
      // SpO2 - Line chart with teal color
      else if (this.query1 === "spo2") {
        const spo2Data = chartdata.map((row) => {
          const values = row.data.map((item) => parseFloat(item.value));
          return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        });
        valueSet.push({
          label: "SpO2",
          data: spo2Data,
          backgroundColor: "rgba(20, 184, 166, 0.15)",
          borderColor: "#14B8A6",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#0D9488",
          fill: true,
        });
      }
      // Steps - Bar chart with green color
      else if (this.query1 === "steps") {
        const stepsData = chartdata.map((row) => {
          const values = row.data.map((item) => parseInt(item.value));
          return values.reduce((a, b) => a + b, 0);
        });
        valueSet.push({
          label: "Steps",
          data: stepsData,
          backgroundColor: "rgba(34, 197, 94, 0.75)",
          borderColor: "#22C55E",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 24,
        });
      }
      // Sleep - Bar chart with indigo color (sum all sleep sessions per day)
      else if (this.query1 === "sleep") {
        const sleepData = chartdata.map((row) => {
          const values = row.data.map((item) => parseFloat(item.value));
          return values.reduce((a, b) => a + b, 0).toFixed(1);
        });
        valueSet.push({
          label: "Sleep",
          data: sleepData,
          backgroundColor: "rgba(99, 102, 241, 0.75)",
          borderColor: "#6366F1",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 24,
        });
      }
      // Calories Burned - Bar chart with orange-red color
      else if (this.query1 === "calories_burned") {
        const calData = chartdata.map((row) => {
          const values = row.data.map((item) => parseInt(item.value));
          return values.reduce((a, b) => a + b, 0);
        });
        valueSet.push({
          label: "Calories",
          data: calData,
          backgroundColor: "rgba(239, 68, 68, 0.75)",
          borderColor: "#EF4444",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 24,
        });
      }
      // Distance - Line chart with blue color
      else if (this.query1 === "distance") {
        const distData = chartdata.map((row) => {
          const values = row.data.map((item) => parseFloat(item.value));
          return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
        });
        valueSet.push({
          label: "Distance",
          data: distData,
          backgroundColor: "rgba(59, 130, 246, 0.15)",
          borderColor: "#3B82F6",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#2563EB",
          fill: true,
        });
      }
      // Respiratory Rate - Line chart with cyan color
      else if (this.query1 === "respiratory_rate") {
        const respData = chartdata.map((row) => {
          const values = row.data.map((item) => parseInt(item.value));
          return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        });
        valueSet.push({
          label: "Resp Rate",
          data: respData,
          backgroundColor: "rgba(6, 182, 212, 0.15)",
          borderColor: "#06B6D4",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#0891B2",
          fill: true,
        });
      }
      // Stress Level - Line chart with rose color
      else if (this.query1 === "stress_level") {
        const stressData = chartdata.map((row) => {
          const values = row.data.map((item) => parseInt(item.value));
          return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        });
        valueSet.push({
          label: "Stress",
          data: stressData,
          backgroundColor: "rgba(244, 63, 94, 0.15)",
          borderColor: "#F43F5E",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#E11D48",
          fill: true,
        });
      }
      // Body Fat - Line chart with amber color
      else if (this.query1 === "body_fat") {
        const fatData = chartdata.map((row) => {
          const values = row.data.map((item) => parseFloat(item.value));
          return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
        });
        valueSet.push({
          label: "Body Fat",
          data: fatData,
          backgroundColor: "rgba(245, 158, 11, 0.15)",
          borderColor: "#F59E0B",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#D97706",
          fill: true,
        });
      }
      // Active Minutes - Bar chart with emerald color
      else if (this.query1 === "active_minutes") {
        const activeData = chartdata.map((row) => {
          const values = row.data.map((item) => parseInt(item.value));
          return values.reduce((a, b) => a + b, 0);
        });
        valueSet.push({
          label: "Active Min",
          data: activeData,
          backgroundColor: "rgba(16, 185, 129, 0.75)",
          borderColor: "#10B981",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 24,
        });
      }
      // Hydration - Bar chart with sky blue color
      else if (this.query1 === "hydration") {
        const hydData = chartdata.map((row) => {
          const values = row.data.map((item) => parseFloat(item.value));
          return (values.reduce((a, b) => a + b, 0)).toFixed(1);
        });
        valueSet.push({
          label: "Hydration",
          data: hydData,
          backgroundColor: "rgba(56, 189, 248, 0.75)",
          borderColor: "#38BDF8",
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 24,
        });
      }
      // Muscle Mass - Line chart with purple color
      else if (this.query1 === "muscle_mass") {
        const muscleData = chartdata.map((row) => {
          const values = row.data.map((item) => parseFloat(item.value));
          return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
        });
        valueSet.push({
          label: "Muscle Mass",
          data: muscleData,
          backgroundColor: "rgba(168, 85, 247, 0.15)",
          borderColor: "#A855F7",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#9333EA",
          fill: true,
        });
      }
      // Bone Mass - Line chart with stone color
      else if (this.query1 === "bone_mass") {
        const boneData = chartdata.map((row) => {
          const values = row.data.map((item) => parseFloat(item.value));
          return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
        });
        valueSet.push({
          label: "Bone Mass",
          data: boneData,
          backgroundColor: "rgba(120, 113, 108, 0.15)",
          borderColor: "#78716C",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#57534E",
          fill: true,
        });
      }
      // Body Water - Line chart with cyan color
      else if (this.query1 === "body_water") {
        const waterData = chartdata.map((row) => {
          const values = row.data.map((item) => parseFloat(item.value));
          return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
        });
        valueSet.push({
          label: "Body Water",
          data: waterData,
          backgroundColor: "rgba(34, 211, 238, 0.15)",
          borderColor: "#22D3EE",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#06B6D4",
          fill: true,
        });
      }
      // Visceral Fat - Line chart with red-orange color
      else if (this.query1 === "visceral_fat") {
        const visceralData = chartdata.map((row) => {
          const values = row.data.map((item) => parseInt(item.value));
          return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        });
        valueSet.push({
          label: "Visceral Fat",
          data: visceralData,
          backgroundColor: "rgba(251, 146, 60, 0.15)",
          borderColor: "#FB923C",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#EA580C",
          fill: true,
        });
      }
      // BMR - Line chart with warm red color
      else if (this.query1 === "bmr") {
        const bmrData = chartdata.map((row) => {
          const values = row.data.map((item) => parseInt(item.value));
          return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        });
        valueSet.push({
          label: "BMR",
          data: bmrData,
          backgroundColor: "rgba(220, 38, 38, 0.15)",
          borderColor: "#DC2626",
          pointBackgroundColor: "#fff",
          pointBorderColor: "#B91C1C",
          fill: true,
        });
      }
      // Default fallback
      else {
        const originalArray = chartdata.map((row) =>
          row.data.map((item) => parseFloat(item.value))
        );
        const avgData = originalArray.map(arr =>
          arr.reduce((a, b) => a + b, 0) / arr.length
        );

        valueSet.push({
          data: avgData,
          backgroundColor: "#4FC3F7",
          borderColor: "#4FC3F7",
          borderWidth: 3,
        });
      }

      this.data = { labels: xAxis, datasets: valueSet };
      this.chart_type = type;
    },

    downloadChart() {
      this.$refs.chartComponent?.getChartData(false);
    },

    async handleShareChartURL() {
      if (this.isFetchingUrl) return;
      const chartImgString = this.$refs.chartComponent?.getChartData(true);
      if (!chartImgString) return;

      const blob = await (await fetch(chartImgString)).blob();
      const file = new File([blob], "Chart.png", { type: "image/png" });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.VUE_APP_CLOUDINARY_PRESET);

      this.isFetchingUrl = true;
      const URL = await handleImageUploadToCloudinary(formData);
      if (URL) {
        await navigator.clipboard.writeText(URL);
        this.$toast.success("Link copied to clipboard!");
      }
      this.isFetchingUrl = false;
    },
  },

  mounted() {
    // Ensure page starts at top (parent .content is the scroll container)
    this.$nextTick(() => {
      const scrollParent = this.$el.closest('.content') || this.$el.parentElement;
      if (scrollParent) scrollParent.scrollTop = 0;
    });
  },

  watch: {
    selectedVital(newVal) {
      if (newVal && this.modalType === "add") {
        const units = this.getUnitOptions(newVal);
        if (units.length && !this.vital.input1.unit) {
          this.vital.input1.unit = units[0];
        }
      }
    },

    recentVitals: {
      handler() {
        if (this.vitalList.length && !this.activeVitalChart) {
          this.selectedVitalHandler(this.vitalList[0]);
        }
      },
      deep: true,
      immediate: true,
    },
  },
};
</script>

<style scoped lang="scss">
// Design Tokens
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$card-bg: #FFFFFF;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

// Mixins
@mixin glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(0, 0, 0, 0.02);
  border-radius: 16px;
}

// Page Layout
.vitals-page {
  width: 100%;
  min-height: 100vh;
  background: $bg;
}

// Mobile Header
.mobile-header {
  display: none;
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  padding: 1rem 1rem;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  @media (max-width: 768px) {
    display: flex;
  }

  .menu-btn,
  .notification-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: rgba(0, 0, 0, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $slate;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
      background: rgba(0, 0, 0, 0.08);
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .notification-btn {
    position: relative;

    .notification-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 8px;
      height: 8px;
      background: $rose;
      border-radius: 50%;
    }
  }

  .header-logo {
    img {
      height: 32px;
      width: auto;
    }
  }
}

.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 100px;
  }
}

// ============================================
// HERO SECTION
// ============================================
.hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 32px;
  padding: 32px 40px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 24px;
  position: relative;
  z-index: 2;
  overflow: hidden;
  margin-bottom: 24px;
  flex-shrink: 0;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px;
    gap: 0;
    text-align: center;
    border-radius: 20px;
    margin-bottom: 20px;
  }
}

.hero__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 2;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: none;
  border-radius: 12px;
  padding: 10px 16px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 20px;
  width: fit-content;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.desktop-only {
  @media (max-width: 768px) {
    display: none !important;
  }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  width: fit-content;
  margin-bottom: 20px;
  position: relative;

  @media (max-width: 768px) {
    margin: 0 auto 12px;
    padding: 6px 14px;
  }

  .badge-pulse {
    position: absolute;
    left: 12px;
    width: 8px;
    height: 8px;
    background: $emerald;
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;

    &::after {
      content: '';
      position: absolute;
      inset: -4px;
      background: rgba($emerald, 0.4);
      border-radius: 50%;
      animation: pulse-ring-hero 2s ease-out infinite;
    }

    @media (max-width: 768px) {
      left: 10px;
      width: 6px;
      height: 6px;
    }
  }

  svg {
    width: 16px;
    height: 16px;
    color: white;
    margin-left: 12px;

    @media (max-width: 768px) {
      width: 14px;
      height: 14px;
      margin-left: 10px;
    }
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: white;
    letter-spacing: 0.3px;

    @media (max-width: 768px) {
      font-size: 12px;
    }
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes pulse-ring-hero {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

.hero__title {
  font-size: 48px;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  margin: 0 0 16px;
  letter-spacing: -1px;

  @media (max-width: 768px) {
    font-size: 28px;
    margin: 0 0 8px;
    letter-spacing: -0.5px;

    br { display: none; }
  }

  .hero__title-accent {
    background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @media (max-width: 768px) {
      display: inline;
      margin-left: 6px;
    }
  }
}

.hero__subtitle {
  font-size: 18px;
  color: white;
  line-height: 1.6;
  margin: 0 0 24px;
  max-width: 400px;
  opacity: 0.95;

  @media (max-width: 768px) {
    font-size: 14px;
    max-width: 100%;
    margin: 0 0 16px;
    opacity: 0.9;
  }
}

.hero__stats {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 14px;
  width: fit-content;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-around;
    padding: 12px 16px;
    gap: 0;
    border-radius: 12px;
    margin-bottom: 16px;
  }
}

.hero-stat {
  text-align: center;

  &__value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: white;
    line-height: 1;

    @media (max-width: 768px) {
      font-size: 20px;
    }

    &--warning { color: $amber-light; }
    &--success { color: $emerald-light; }
  }

  &__label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    @media (max-width: 768px) {
      font-size: 10px;
    }
  }

  &__divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);

    @media (max-width: 768px) {
      height: 28px;
    }
  }
}

.hero-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  white-space: nowrap;
  background: white;
  color: $sky-dark;
  width: fit-content;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 12px 20px;
  }
}

.hero__visual {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  @media (max-width: 768px) {
    display: none;
  }
}

// Orb Animation
.vitals-orb {
  position: relative;
  width: 180px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);

  &--1 {
    width: 100%;
    height: 100%;
    animation: spin-slow 20s linear infinite;
  }

  &--2 {
    width: 80%;
    height: 80%;
    animation: spin-slow 15s linear infinite reverse;
  }

  &--3 {
    width: 60%;
    height: 60%;
    animation: spin-slow 10s linear infinite;
  }
}

.orb-core {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 40px rgba(255, 255, 255, 0.3),
    0 0 80px rgba(79, 195, 247, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;

  svg {
    width: 36px;
    height: 36px;
    color: white;
  }
}

.floating-icons {
  position: absolute;
  inset: -20px;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;

  svg {
    width: 18px;
    height: 18px;
    color: white;
  }

  &--1 { top: 0; right: 0; animation-delay: 0s; }
  &--2 { bottom: 10%; right: -10%; animation-delay: 1s; }
  &--3 { bottom: 0; left: 0; animation-delay: 2s; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.04);

  .empty-illustration {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 1.25rem;

    .illustration-rings {
      position: absolute;
      inset: 0;

      .ring {
        position: absolute;
        border-radius: 50%;
        border: 2px solid $sky-light;
        animation: pulse-ring 2s ease-in-out infinite;

        &.ring-1 {
          inset: 0;
          animation-delay: 0s;
        }

        &.ring-2 {
          inset: 15px;
          animation-delay: 0.3s;
        }

        &.ring-3 {
          inset: 30px;
          animation-delay: 0.6s;
        }
      }
    }

    .illustration-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, $sky-light, white);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $sky;
    }
  }

  h2 {
    font-size: 1.125rem;
    font-weight: 700;
    color: $navy;
    margin: 0 0 0.5rem;
  }

  p {
    font-size: 0.875rem;
    color: $gray;
    max-width: 300px;
    margin: 0 auto 1.25rem;
    line-height: 1.5;
  }

  .empty-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($sky, 0.35);
    }

    svg {
      width: 18px;
      height: 18px;
    }
  }
}

@keyframes pulse-ring {
  0%, 100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.2;
  }
}

// ============================================
// WELLNESS DASHBOARD
// ============================================
.wellness {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// Section Header
.wellness-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: $navy;
    margin: 0;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.wl-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  background: $sky-light;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: $sky-dark;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $sky;
    color: white;
  }
}

.wl-icon-btn {
  width: 36px;
  height: 36px;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $gray;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: $sky-light;
    color: $sky-dark;
  }
}

// ============================================
// SCORE CARDS (Top 3 Vitals)
// ============================================
.score-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  @media (min-width: 769px) and (max-width: 1024px) {
    gap: 12px;
  }
}

.score-card {
  @include glass-card;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03);
  }

  &--active {
    border-color: rgba($sky, 0.5);
    box-shadow: 0 4px 20px rgba($sky, 0.12), 0 1px 2px rgba(0, 0, 0, 0.02);
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  &__name {
    font-size: 13px;
    font-weight: 500;
    color: $gray;
  }

  &__edit {
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $light-gray;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s;

    .score-card:hover & {
      opacity: 1;
    }

    &:hover {
      background: $sky-light;
      color: $sky-dark;
    }
  }

  &__mid {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__numbers {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  &__val {
    font-size: 36px;
    font-weight: 700;
    color: $navy;
    line-height: 1;
    letter-spacing: -0.5px;

    @media (max-width: 768px) {
      font-size: 30px;
    }
  }

  &__unit {
    font-size: 14px;
    color: $gray;
    font-weight: 500;
  }

  &__spark {
    width: 80px;
    height: 32px;
    flex-shrink: 0;

    svg {
      width: 100%;
      height: 100%;
    }

    &.vital--temp { color: #f97316; }
    &.vital--weight { color: #8b5cf6; }
    &.vital--pulse { color: $sky; }
    &.vital--sugar { color: #0ea5e9; }
    &.vital--pressure { color: #ec4899; }
    &.vital--spo2 { color: #14b8a6; }
    &.vital--steps { color: #22c55e; }
    &.vital--sleep { color: #6366f1; }
    &.vital--calories { color: #ef4444; }
    &.vital--distance { color: #3b82f6; }
    &.vital--respiratory { color: #06b6d4; }
    &.vital--stress { color: #f43f5e; }
    &.vital--bodyfat { color: #f59e0b; }
    &.vital--activemins { color: #10b981; }
    &.vital--hydration { color: #38bdf8; }
    &.vital--muscle { color: #a855f7; }
    &.vital--bone { color: #78716c; }
    &.vital--bodywater { color: #22d3ee; }
    &.vital--visceral { color: #fb923c; }
    &.vital--bmr { color: #dc2626; }
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 20px;
    width: fit-content;

    &.status--normal {
      background: $emerald-light;
      color: darken($emerald, 10%);
    }

    &.status--high {
      background: $rose-light;
      color: $rose;
    }

    &.status--low {
      background: $amber-light;
      color: darken($amber, 10%);
    }
  }
}

// ============================================
// LIFESTYLE & METRICS (Remaining Vitals)
// ============================================
.lifestyle-section {
  &__head {
    margin-bottom: 16px;

    h3 {
      font-size: 18px;
      font-weight: 700;
      color: $navy;
      margin: 0;
    }
  }
}

.lifestyle-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
}

.lifestyle-card {
  @include glass-card;
  padding: 18px;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.02);
  }

  &--active {
    border-color: rgba($sky, 0.5);
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;

    &.vital--temp { background: linear-gradient(135deg, #f97316, #ea580c); }
    &.vital--weight { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    &.vital--pulse { background: linear-gradient(135deg, $sky, $sky-dark); }
    &.vital--sugar { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
    &.vital--pressure { background: linear-gradient(135deg, #ec4899, #db2777); }
    &.vital--spo2 { background: linear-gradient(135deg, #14b8a6, #0d9488); }
    &.vital--steps { background: linear-gradient(135deg, #22c55e, #16a34a); }
    &.vital--sleep { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    &.vital--calories { background: linear-gradient(135deg, #ef4444, #dc2626); }
    &.vital--distance { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    &.vital--respiratory { background: linear-gradient(135deg, #06b6d4, #0891b2); }
    &.vital--stress { background: linear-gradient(135deg, #f43f5e, #e11d48); }
    &.vital--bodyfat { background: linear-gradient(135deg, #f59e0b, #d97706); }
    &.vital--activemins { background: linear-gradient(135deg, #10b981, #059669); }
    &.vital--hydration { background: linear-gradient(135deg, #38bdf8, #0284c7); }
    &.vital--muscle { background: linear-gradient(135deg, #a855f7, #9333ea); }
    &.vital--bone { background: linear-gradient(135deg, #78716c, #57534e); }
    &.vital--bodywater { background: linear-gradient(135deg, #22d3ee, #06b6d4); }
    &.vital--visceral { background: linear-gradient(135deg, #fb923c, #ea580c); }
    &.vital--bmr { background: linear-gradient(135deg, #dc2626, #b91c1c); }
    &.vital--bmi { background: linear-gradient(135deg, #14b8a6, #0d9488); }
  }

  &__edit {
    width: 26px;
    height: 26px;
    background: transparent;
    border: none;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $light-gray;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s;

    .lifestyle-card:hover & {
      opacity: 1;
    }

    &:hover {
      background: $sky-light;
      color: $sky-dark;
    }
  }

  &__label {
    font-size: 12px;
    font-weight: 500;
    color: $gray;
    margin-bottom: 4px;
  }

  &__value-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-bottom: 12px;
  }

  &__val {
    font-size: 24px;
    font-weight: 700;
    color: $navy;
    line-height: 1;

    @media (max-width: 640px) {
      font-size: 20px;
    }
  }

  &__unit {
    font-size: 12px;
    color: $gray;
    font-weight: 500;
  }

  &__bar {
    height: 6px;
    background: rgba(0, 0, 0, 0.06);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 10px;
  }

  &__bar-fill {
    height: 100%;
    border-radius: 10px;
    transition: width 0.6s ease;

    &.status--normal { background: linear-gradient(90deg, lighten($emerald, 10%), $emerald); }
    &.status--high { background: linear-gradient(90deg, lighten($rose, 10%), $rose); }
    &.status--low { background: linear-gradient(90deg, lighten($amber, 10%), $amber); }
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;

    &.status--normal { color: $emerald; }
    &.status--high { color: $rose; }
    &.status--low { color: $amber; }
  }

  &__cat-badge {
    display: inline-flex;
    align-items: center;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    width: fit-content;

    &.status--normal { background: $emerald-light; color: darken($emerald, 10%); }
    &.status--high { background: $rose-light; color: $rose; }
    &.status--low { background: $amber-light; color: darken($amber, 10%); }
  }
}

// ============================================
// CHART SECTION
// ============================================
.chart-section {
  @include glass-card;
  padding: 24px;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 16px;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 18px;
    font-weight: 700;
    color: $navy;
    margin: 0 0 4px;
  }

  &__sub {
    font-size: 13px;
    color: $gray;
    margin: 0;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  &__tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-bottom: 4px;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__canvas {
    flex: 1;
    background: $bg;
    border-radius: 12px;
    overflow: hidden;
    min-height: 340px;
    display: flex;
    flex-direction: column;

    :deep(.chart-wrapper) {
      flex: 1;
      min-height: 100%;
    }

    @media (max-width: 768px) {
      min-height: 280px;
    }
  }
}

.chart-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: $bg;
  border: 2px solid transparent;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: $gray;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: white;
    border-color: rgba(0, 0, 0, 0.06);
  }

  &.active {
    background: $sky-light;
    border-color: $sky;
    color: $sky-dark;
  }
}

.chart-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: $slate;

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;

      &.systolic { background: $sky; }
      &.diastolic { background: $rose; }
    }
  }
}

// Modal Styles
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;

  @media (max-width: 640px) {
    padding: 0.5rem;
    align-items: flex-end;
  }
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);

  @media (max-width: 640px) {
    max-height: 95vh;
    border-radius: 20px 20px 0 0;
  }
}

.modal-header {
  background: linear-gradient(135deg, $sky, $sky-dark);
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-radius: 20px 20px 0 0;

  @media (max-width: 640px) {
    padding: 1.25rem 1rem;
  }

  &__content {
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 0;

    @media (max-width: 640px) {
      gap: 0.75rem;
    }
  }

  .modal-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;

    @media (max-width: 640px) {
      width: 40px;
      height: 40px;
    }
  }

  .modal-title {
    min-width: 0;

    h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: white;
      margin: 0 0 0.25rem;

      @media (max-width: 640px) {
        font-size: 1rem;
      }
    }

    p {
      font-size: 0.8125rem;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;

      @media (max-width: 640px) {
        font-size: 0.75rem;
      }
    }
  }

  .modal-close {
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.15);
    border: none;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    @media (max-width: 640px) {
      width: 32px;
      height: 32px;
    }
  }
}

.modal-body {
  padding: 1.5rem;

  @media (max-width: 640px) {
    padding: 1rem;
  }
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);

  @media (max-width: 640px) {
    padding: 1rem;
    gap: 0.5rem;
  }

  .btn-cancel {
    flex: 1;
    padding: 0.875rem;
    background: $bg;
    border: none;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    color: $gray;
    cursor: pointer;
    transition: all 0.2s;

    @media (max-width: 640px) {
      padding: 0.75rem;
      font-size: 0.8125rem;
    }

    &:hover {
      background: darken($bg, 3%);
    }
  }

  .btn-save {
    flex: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem;
    background: linear-gradient(135deg, $sky, $sky-dark);
    border: none;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.2s;

    @media (max-width: 640px) {
      padding: 0.75rem;
      font-size: 0.8125rem;
    }

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($sky, 0.35);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Field Styles
.field-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: $slate;
  margin-bottom: 0.75rem;
}

// Vital Selection
.vital-selection {
  margin-bottom: 1.5rem;
}

.vital-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.vital-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  background: $bg;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  &:hover {
    background: white;
    border-color: rgba(0, 0, 0, 0.06);
  }

  &.selected {
    background: white;
    border-color: $sky;
    box-shadow: 0 4px 12px rgba($sky, 0.15);
  }

  .option-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .option-info {
    flex: 1;
    min-width: 0;

    .option-name {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: $navy;
      margin-bottom: 0.125rem;
    }

    .option-range {
      font-size: 0.6875rem;
      color: $gray;
    }
  }

  .option-check {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 20px;
    height: 20px;
    background: $sky;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  &.vital--temp .option-icon { background: linear-gradient(135deg, #f97316, #ea580c); }
  &.vital--weight .option-icon { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
  &.vital--pulse .option-icon { background: linear-gradient(135deg, $sky, $sky-dark); }
  &.vital--sugar .option-icon { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
  &.vital--pressure .option-icon { background: linear-gradient(135deg, #ec4899, #db2777); }
  &.vital--spo2 .option-icon { background: linear-gradient(135deg, #14b8a6, #0d9488); }
  &.vital--steps .option-icon { background: linear-gradient(135deg, #22c55e, #16a34a); }
  &.vital--sleep .option-icon { background: linear-gradient(135deg, #6366f1, #4f46e5); }
  &.vital--calories .option-icon { background: linear-gradient(135deg, #ef4444, #dc2626); }
  &.vital--distance .option-icon { background: linear-gradient(135deg, #3b82f6, #2563eb); }
  &.vital--respiratory .option-icon { background: linear-gradient(135deg, #06b6d4, #0891b2); }
  &.vital--stress .option-icon { background: linear-gradient(135deg, #f43f5e, #e11d48); }
  &.vital--bodyfat .option-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
  &.vital--activemins .option-icon { background: linear-gradient(135deg, #10b981, #059669); }
  &.vital--hydration .option-icon { background: linear-gradient(135deg, #38bdf8, #0284c7); }
  &.vital--muscle .option-icon { background: linear-gradient(135deg, #a855f7, #9333ea); }
  &.vital--bone .option-icon { background: linear-gradient(135deg, #78716c, #57534e); }
  &.vital--bodywater .option-icon { background: linear-gradient(135deg, #22d3ee, #06b6d4); }
  &.vital--visceral .option-icon { background: linear-gradient(135deg, #fb923c, #ea580c); }
  &.vital--bmr .option-icon { background: linear-gradient(135deg, #dc2626, #b91c1c); }
}

// Selected Vital
.selected-vital {
  margin-bottom: 1.5rem;

  &__card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: $bg;
    border-radius: 12px;

    .selected-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .selected-info {
      .selected-name {
        display: block;
        font-size: 0.9375rem;
        font-weight: 600;
        color: $navy;
        margin-bottom: 0.125rem;
      }

      .selected-range {
        font-size: 0.75rem;
        color: $gray;
      }
    }

    &.vital--temp .selected-icon { background: linear-gradient(135deg, #f97316, #ea580c); }
    &.vital--weight .selected-icon { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
    &.vital--pulse .selected-icon { background: linear-gradient(135deg, $sky, $sky-dark); }
    &.vital--sugar .selected-icon { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
    &.vital--pressure .selected-icon { background: linear-gradient(135deg, #ec4899, #db2777); }
    &.vital--spo2 .selected-icon { background: linear-gradient(135deg, #14b8a6, #0d9488); }
    &.vital--steps .selected-icon { background: linear-gradient(135deg, #22c55e, #16a34a); }
    &.vital--sleep .selected-icon { background: linear-gradient(135deg, #6366f1, #4f46e5); }
    &.vital--calories .selected-icon { background: linear-gradient(135deg, #ef4444, #dc2626); }
    &.vital--distance .selected-icon { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    &.vital--respiratory .selected-icon { background: linear-gradient(135deg, #06b6d4, #0891b2); }
    &.vital--stress .selected-icon { background: linear-gradient(135deg, #f43f5e, #e11d48); }
    &.vital--bodyfat .selected-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
    &.vital--activemins .selected-icon { background: linear-gradient(135deg, #10b981, #059669); }
    &.vital--hydration .selected-icon { background: linear-gradient(135deg, #38bdf8, #0284c7); }
    &.vital--muscle .selected-icon { background: linear-gradient(135deg, #a855f7, #9333ea); }
    &.vital--bone .selected-icon { background: linear-gradient(135deg, #78716c, #57534e); }
    &.vital--bodywater .selected-icon { background: linear-gradient(135deg, #22d3ee, #06b6d4); }
    &.vital--visceral .selected-icon { background: linear-gradient(135deg, #fb923c, #ea580c); }
    &.vital--bmr .selected-icon { background: linear-gradient(135deg, #dc2626, #b91c1c); }
  }
}

// Input Section
.input-section {
  .input-row {
    margin-bottom: 1rem;
  }

  .input-group {
    display: flex;
    gap: 0.75rem;
  }

  .value-input {
    flex: 1;
    padding: 0.875rem 1rem;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    font-size: 1.125rem;
    font-weight: 600;
    color: $navy;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: $sky;
    }

    &::placeholder {
      color: $light-gray;
      font-weight: 400;
    }
  }

  .unit-select {
    width: 90px;
    padding: 0.875rem 0.75rem;
    border: 2px solid rgba(0, 0, 0, 0.08);
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 500;
    color: $navy;
    background: white;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: $sky;
    }
  }

  .input-hint {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    margin-top: 0.5rem;
    font-size: 0.75rem;
    color: $gray;

    svg {
      color: $sky;
    }
  }
}

// Blood Pressure Inputs
.bp-inputs {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  margin-bottom: 1rem;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }

  .bp-field {
    flex: 1;

    label {
      display: block;
      font-size: 0.75rem;
      color: $gray;
      margin-bottom: 0.5rem;

      .label-hint {
        color: $light-gray;
      }
    }

    .input-group {
      display: flex;
      gap: 0.5rem;
    }

    .value-input {
      flex: 1;
      padding: 0.875rem 1rem;
      border: 2px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      font-size: 1.125rem;
      font-weight: 600;
      color: $navy;

      &:focus {
        outline: none;
        border-color: $sky;
      }
    }

    .unit-display {
      display: flex;
      align-items: center;
      padding: 0 0.75rem;
      background: $bg;
      border-radius: 12px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: $gray;
    }
  }

  .bp-separator {
    font-size: 1.5rem;
    font-weight: 700;
    color: $light-gray;
    padding-bottom: 0.75rem;

    @media (max-width: 480px) {
      display: none;
    }
  }
}

// Reading Indicator
.reading-indicator {
  padding: 1rem;
  background: $bg;
  border-radius: 12px;
  margin-bottom: 1.5rem;

  .indicator-track {
    position: relative;
    height: 8px;
    background: linear-gradient(90deg, $amber, $emerald, $emerald, $rose);
    border-radius: 4px;
    margin-bottom: 0.5rem;
  }

  .indicator-marker {
    position: absolute;
    top: -4px;
    width: 16px;
    height: 16px;
    background: white;
    border: 3px solid $navy;
    border-radius: 50%;
    transform: translateX(-50%);
    transition: left 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  .indicator-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.6875rem;
    color: $gray;
    margin-bottom: 0.75rem;
  }

  .indicator-result {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    font-size: 0.8125rem;
    font-weight: 600;
  }

  &.status--normal .indicator-result {
    color: darken($emerald, 5%);
  }

  &.status--high .indicator-result {
    color: $rose;
  }

  &.status--low .indicator-result {
    color: darken($amber, 10%);
  }
}

// Date & Time Section
.datetime-section {
  padding-top: 1.25rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.datetime-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

.datetime-field {
  label {
    display: block;
    font-size: 0.75rem;
    color: $gray;
    margin-bottom: 0.5rem;

    .required {
      color: $rose;
    }

    .optional {
      color: $light-gray;
      font-weight: 400;
    }
  }

  .datetime-input-wrapper {
    position: relative;

    svg {
      position: absolute;
      left: 0.875rem;
      top: 50%;
      transform: translateY(-50%);
      color: $gray;
      pointer-events: none;
    }

    input {
      width: 100%;
      padding: 0.75rem 0.875rem 0.75rem 2.5rem;
      border: 2px solid rgba(0, 0, 0, 0.08);
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      color: $navy;
      background: white;

      &:focus {
        outline: none;
        border-color: $sky;
      }
    }
  }
}
</style>
