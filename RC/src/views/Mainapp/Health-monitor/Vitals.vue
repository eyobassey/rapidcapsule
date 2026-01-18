<template>
  <div class="vitals-page">
    <TopBar
      type="title-only"
      title="Vitals"
      :show-search-bar="false"
      @open-side-nav="$emit('openSideNav')"
    />

    <div class="vitals-page__content">
      <!-- Hero Banner -->
      <div class="vitals-hero">
        <div class="vitals-hero__content">
          <div class="vitals-hero__icon">
            <v-icon name="hi-heart" />
          </div>
          <h1 class="vitals-hero__title">Health Vitals</h1>
          <p class="vitals-hero__subtitle">Track and monitor your health metrics over time</p>
        </div>
        <div class="vitals-hero__decoration">
          <div class="decoration-circle decoration-circle--1"></div>
          <div class="decoration-circle decoration-circle--2"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!vitalList.length" class="vitals-empty">
        <div class="vitals-empty__illustration">
          <div class="illustration-circle">
            <v-icon name="hi-chart-bar" />
          </div>
          <div class="illustration-pulse"></div>
        </div>
        <h3 class="vitals-empty__title">Start Tracking Your Health</h3>
        <p class="vitals-empty__desc">Add your first vital to begin monitoring your health metrics</p>
        <button class="vitals-empty__btn" @click="openAddModal">
          <v-icon name="hi-plus" />
          Add Your First Vital
        </button>
      </div>

      <!-- Main Content -->
      <template v-if="vitalList.length">
        <!-- Quick Stats -->
        <div class="quick-stats">
          <div
            v-for="(vital, index) in recentvitalarray"
            :key="index"
            class="stat-card"
            :class="getVitalColorClass(vital.name)"
          >
            <div class="stat-card__icon">
              <v-icon :name="getVitalIcon(vital.name)" />
            </div>
            <div class="stat-card__content">
              <span class="stat-card__label">{{ vital.name }}</span>
              <div class="stat-card__value">
                <span class="value">{{ vital.value }}</span>
                <span class="unit">{{ vital.unit }}</span>
              </div>
            </div>
            <button class="stat-card__edit" @click="updateVital(vital)">
              <v-icon name="hi-pencil" />
            </button>
          </div>
          <!-- BMI Card (calculated from weight + height) -->
          <div
            v-if="bmiData"
            class="stat-card vital--bmi"
          >
            <div class="stat-card__icon">
              <v-icon name="hi-chart-bar" />
            </div>
            <div class="stat-card__content">
              <span class="stat-card__label">BMI</span>
              <div class="stat-card__value">
                <span class="value">{{ bmiData.value }}</span>
              </div>
            </div>
            <div class="stat-card__badge" :class="bmiData.status">
              {{ bmiData.category }}
            </div>
          </div>
          <button
            v-if="vitalList.length < 5"
            class="stat-card stat-card--add"
            @click="openAddModal"
          >
            <div class="stat-card__icon">
              <v-icon name="hi-plus" />
            </div>
            <span class="stat-card__label">Add Vital</span>
          </button>
        </div>

        <!-- Chart Section -->
        <div class="chart-section">
          <div class="chart-section__header">
            <div class="header-left">
              <h2 class="section-title">Vital Trends</h2>
              <p class="section-subtitle">View your health data over time</p>
            </div>
            <div class="header-right">
              <div class="vital-selector">
                <button
                  v-for="vital in vitalList"
                  :key="vital"
                  class="vital-tab"
                  :class="{ active: activeVitalChart === vital }"
                  @click="selectedVitalHandler(vital)"
                >
                  <v-icon :name="getVitalIcon(vital)" />
                  <span>{{ getShortName(vital) }}</span>
                </button>
              </div>
              <div class="chart-actions">
                <button class="action-btn" @click="downloadChart" title="Download">
                  <v-icon name="hi-download" />
                </button>
                <button class="action-btn" @click="handleShareChartURL" title="Share">
                  <v-icon name="hi-share" />
                </button>
              </div>
            </div>
          </div>
          <div class="chart-section__body">
            <Chart
              ref="chartComponent"
              :chartData="data"
              :chartType="chart_type"
              :selectedVital="selectedVital"
              :patientName="patientFullName"
            />
          </div>
        </div>

        <!-- History Section -->
        <div class="history-section">
          <div class="history-section__header">
            <h2 class="section-title">Recent Readings</h2>
            <p class="section-subtitle">Your latest vital measurements</p>
          </div>
          <div class="history-grid">
            <div
              v-for="(vital, index) in recentvitalarray"
              :key="index"
              class="history-card"
              :class="getVitalColorClass(vital.name)"
            >
              <div class="history-card__header">
                <div class="history-card__icon">
                  <v-icon :name="getVitalIcon(vital.name)" />
                </div>
                <div class="history-card__title">{{ vital.name }}</div>
              </div>
              <div class="history-card__value">
                <span class="value">{{ vital.value }}</span>
                <span class="unit">{{ vital.unit }}</span>
              </div>
              <div class="history-card__status" :class="getVitalStatus(vital)">
                <v-icon :name="getStatusIcon(vital)" />
                <span>{{ getStatusText(vital) }}</span>
              </div>
              <div class="history-card__footer">
                <button class="update-btn" @click="updateVital(vital)">
                  <v-icon name="hi-pencil" />
                  Update
                </button>
              </div>
            </div>
            <!-- BMI History Card -->
            <div
              v-if="bmiData"
              class="history-card vital--bmi"
            >
              <div class="history-card__header">
                <div class="history-card__icon">
                  <v-icon name="hi-chart-bar" />
                </div>
                <div class="history-card__title">BMI</div>
              </div>
              <div class="history-card__value">
                <span class="value">{{ bmiData.value }}</span>
                <span class="unit">kg/m²</span>
              </div>
              <div class="history-card__status" :class="bmiData.status">
                <v-icon :name="bmiData.status === 'status--normal' ? 'hi-check-circle' : 'hi-exclamation-circle'" />
                <span>{{ bmiData.category }}</span>
              </div>
              <div class="history-card__footer">
                <span class="bmi-note">Calculated from weight & height</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Elegant Add/Update Vital Modal -->
    <div v-if="openModal" class="vital-modal-overlay" @click.self="close">
      <div class="vital-modal">
        <!-- Header -->
        <div class="vital-modal__header">
          <div class="header-content">
            <div class="header-icon">
              <v-icon name="hi-heart" />
            </div>
            <div class="header-text">
              <h3>{{ modalType === 'add' ? 'Log New Vital' : 'Update Vital' }}</h3>
              <p>{{ modalType === 'add' ? 'Select a vital type and enter your reading' : 'Update your measurement' }}</p>
            </div>
          </div>
          <button @click="close" class="close-btn">
            <v-icon name="hi-x" />
          </button>
        </div>

        <div class="vital-modal__body">
          <!-- Vital Type Selection (only for add mode) -->
          <div v-if="modalType === 'add'" class="vital-selection">
            <label class="selection-label">Select Vital Type</label>
            <div class="vital-types">
              <button
                v-for="vitalType in vitalDropList"
                :key="vitalType"
                class="vital-type-card"
                :class="[
                  getVitalColorClass(vitalType),
                  { selected: selectedVital === vitalType }
                ]"
                @click="selectedVital = vitalType"
              >
                <div class="vital-type-card__icon">
                  <v-icon :name="getVitalIcon(vitalType)" />
                </div>
                <span class="vital-type-card__name">{{ vitalType }}</span>
                <span class="vital-type-card__range">{{ getNormalRange(vitalType) }}</span>
                <div v-if="selectedVital === vitalType" class="vital-type-card__check">
                  <v-icon name="hi-check" />
                </div>
              </button>
            </div>
          </div>

          <!-- Selected Vital Display (for update mode) -->
          <div v-else class="selected-vital-display">
            <div class="selected-vital-card" :class="getVitalColorClass(selectedVital)">
              <div class="selected-vital-card__icon">
                <v-icon :name="getVitalIcon(selectedVital)" />
              </div>
              <div class="selected-vital-card__info">
                <span class="name">{{ selectedVital }}</span>
                <span class="range">Normal: {{ getNormalRange(selectedVital) }}</span>
              </div>
            </div>
          </div>

          <!-- Input Section -->
          <div class="input-section" v-if="selectedVital">
            <label class="input-label">Enter Your Reading</label>

            <!-- Single Value Input -->
            <div v-if="selectedVital !== 'Blood Pressure'" class="single-input">
              <div class="input-group">
                <input
                  type="number"
                  v-model="vital.input1.value"
                  :placeholder="getPlaceholder(selectedVital)"
                  class="vital-input"
                  step="0.1"
                />
                <select v-model="vital.input1.unit" class="unit-select">
                  <option v-for="unit in getUnitOptions(selectedVital)" :key="unit" :value="unit">
                    {{ unit }}
                  </option>
                </select>
              </div>
              <div class="input-hint">
                <v-icon name="hi-information-circle" />
                <span>{{ getInputHint(selectedVital) }}</span>
              </div>
            </div>

            <!-- Blood Pressure Input (Two Values) -->
            <div v-else class="bp-input">
              <div class="bp-input__group">
                <label>Systolic (Top Number)</label>
                <div class="input-group">
                  <input
                    type="number"
                    v-model="vital.input1.value"
                    placeholder="120"
                    class="vital-input"
                  />
                  <span class="unit-display">mmHg</span>
                </div>
              </div>
              <div class="bp-divider">
                <span>/</span>
              </div>
              <div class="bp-input__group">
                <label>Diastolic (Bottom Number)</label>
                <div class="input-group">
                  <input
                    type="number"
                    v-model="vital.input2.value"
                    placeholder="80"
                    class="vital-input"
                  />
                  <span class="unit-display">mmHg</span>
                </div>
              </div>
            </div>

            <!-- Visual Indicator -->
            <div v-if="vital.input1.value" class="reading-indicator" :class="getReadingStatus()">
              <div class="indicator-bar">
                <div class="indicator-fill" :style="{ width: getIndicatorWidth() }"></div>
                <div class="indicator-marker" :style="{ left: getIndicatorPosition() }"></div>
              </div>
              <div class="indicator-labels">
                <span>Low</span>
                <span>Normal</span>
                <span>High</span>
              </div>
              <div class="indicator-status">
                <v-icon :name="getReadingStatusIcon()" />
                <span>{{ getReadingStatusText() }}</span>
              </div>
            </div>

            <!-- Date & Time Section -->
            <div class="datetime-section">
              <label class="input-label">When was this reading taken?</label>
              <div class="datetime-inputs">
                <div class="datetime-group">
                  <label>Date <span class="required">*</span></label>
                  <div class="input-wrapper">
                    <v-icon name="hi-calendar" />
                    <input
                      type="date"
                      v-model="vital.date"
                      class="datetime-input"
                      :max="new Date().toISOString().split('T')[0]"
                      required
                    />
                  </div>
                </div>
                <div class="datetime-group">
                  <label>Time <span class="optional">(Optional)</span></label>
                  <div class="input-wrapper">
                    <v-icon name="hi-clock" />
                    <input
                      type="time"
                      v-model="vital.time"
                      class="datetime-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="vital-modal__footer">
          <button class="cancel-btn" @click="close">Cancel</button>
          <button
            class="save-btn"
            :class="{ loading: loading }"
            :disabled="!canSave || loading"
            @click="addVitals(selectedVital, true)"
          >
            <span v-if="!loading">
              <v-icon name="hi-check" />
              {{ modalType === 'add' ? 'Save Vital' : 'Update Vital' }}
            </span>
            <span v-else class="loading-state">
              <span class="spinner"></span>
              Saving...
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import TopBar from "@/components/Navigation/top-bar.vue";
import Chart from "@/components/Charts/chart-vitals.vue";
import { handleImageUploadToCloudinary } from "./functions";

export default {
  name: "Vitals",

  emits: ["openSideNav"],

  components: {
    TopBar,
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

      // Normal ranges for vitals
      normalRanges: {
        "Body Temperature": { min: 36.1, max: 37.2, unit: "°C" },
        "Body Weight": { min: 18.5, max: 24.9, unit: "BMI" },
        "Pulse Rate": { min: 60, max: 100, unit: "bpm" },
        "Blood Sugar Level": { min: 70, max: 100, unit: "mg/dL" },
        "Blood Pressure": { systolic: { min: 90, max: 120 }, diastolic: { min: 60, max: 80 } },
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
        switch (key) {
          case "body_temp": vitalArray.push("Body Temperature"); break;
          case "blood_pressure": vitalArray.push("Blood Pressure"); break;
          case "blood_sugar_level": vitalArray.push("Blood Sugar Level"); break;
          case "body_weight": vitalArray.push("Body Weight"); break;
          case "pulse_rate": vitalArray.push("Pulse Rate"); break;
        }
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

    // Patient full name for downloads
    patientFullName() {
      const profile = this.userProfile?.profile;
      if (!profile) return '';
      const firstName = profile.first_name || '';
      const lastName = profile.last_name || '';
      return `${firstName} ${lastName}`.trim();
    },

    // BMI Calculation
    userHeight() {
      const height = this.userProfile?.profile?.basic_health_info?.height;
      if (!height || !height.value) return null;
      return {
        value: parseFloat(height.value),
        unit: height.unit || 'cm'
      };
    },

    bmiData() {
      // Get weight from vitals
      const weightVital = this.recentVitals?.body_weight;
      if (!weightVital || !weightVital.value) return null;
      if (!this.userHeight) return null;

      let weightKg = parseFloat(weightVital.value);
      let heightM = this.userHeight.value;

      // Convert weight to kg if in lb
      if (weightVital.unit === 'lb') {
        weightKg = weightKg * 0.453592;
      }

      // Convert height to meters
      if (this.userHeight.unit === 'cm') {
        heightM = heightM / 100;
      } else if (this.userHeight.unit === 'ft' || this.userHeight.unit === 'feet') {
        heightM = heightM * 0.3048;
      } else if (this.userHeight.unit === 'in' || this.userHeight.unit === 'inches') {
        heightM = heightM * 0.0254;
      }

      // Calculate BMI: weight (kg) / height (m)²
      const bmi = weightKg / (heightM * heightM);

      return {
        value: bmi.toFixed(1),
        category: this.getBMICategory(bmi),
        status: this.getBMIStatus(bmi)
      };
    },
  },

  methods: {
    ...mapActions({
      getSelectedVitalRecords: "vitalsManagement/getSelectedVitalRecords",
      addVital: "vitalsManagement/addVitals",
      updateVitals: "vitalsManagement/updateVitals",
    }),

    getVitalIcon(name) {
      const icons = {
        "Body Temperature": "fa-thermometer-half",
        "Body Weight": "fa-weight",
        "Pulse Rate": "hi-heart",
        "Blood Sugar Level": "bi-droplet-fill",
        "Blood Pressure": "fa-heartbeat",
        "BMI": "hi-chart-bar",
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
      };
      return ranges[name] || "";
    },

    getPlaceholder(name) {
      const placeholders = {
        "Body Temperature": "36.5",
        "Body Weight": "70",
        "Pulse Rate": "72",
        "Blood Sugar Level": "90",
      };
      return placeholders[name] || "";
    },

    getUnitOptions(name) {
      const units = {
        "Body Temperature": ["°C", "°F"],
        "Body Weight": ["kg", "lb"],
        "Pulse Rate": ["bpm"],
        "Blood Sugar Level": ["mg/dL", "mmol/L"],
      };
      return units[name] || [];
    },

    getInputHint(name) {
      const hints = {
        "Body Temperature": "Normal body temperature is 36.1-37.2°C (97-99°F)",
        "Body Weight": "Track your weight to monitor health trends",
        "Pulse Rate": "Resting heart rate for adults is 60-100 bpm",
        "Blood Sugar Level": "Fasting blood sugar should be 70-100 mg/dL",
      };
      return hints[name] || "";
    },

    getVitalStatus(vital) {
      // Simplified status check
      return "status--normal";
    },

    getStatusIcon(vital) {
      return "hi-check-circle";
    },

    getStatusText(vital) {
      return "Within normal range";
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

    getIndicatorWidth() {
      return "100%";
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

      // Set default date to today and current time
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);

      this.vital = {
        input1: { value: "", unit: "" },
        input2: { value: "", unit: "" },
        date: today,
        time: currentTime,
      };

      // Set default unit
      if (this.selectedVital) {
        const units = this.getUnitOptions(this.selectedVital);
        if (units.length) this.vital.input1.unit = units[0];
      }

      this.openModal = true;
    },

    updateVital(val) {
      this.modalType = "update";
      this.selectedVital = val.name;

      // Set default date to today and current time for update
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 5);

      if (val.value.includes("/")) {
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

      // Combine date and time into a timestamp
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
        let vitalName = null;
        if (key === "body_temp") vitalName = "Body Temperature";
        if (key === "body_weight") vitalName = "Body Weight";
        if (key === "blood_pressure") vitalName = "Blood Pressure";
        if (key === "pulse_rate") vitalName = "Pulse Rate";
        if (key === "blood_sugar_level") vitalName = "Blood Sugar Level";

        if (vitalName) {
          vitalArray.push({
            name: vitalName,
            value: val[key].value,
            unit: val[key].unit,
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
      let chartType = null;

      switch (val) {
        case "Body Temperature":
          this.query1 = "body_temp";
          chartType = "bar";
          break;
        case "Body Weight":
          this.query1 = "body_weight";
          chartType = "line";
          break;
        case "Blood Pressure":
          this.query1 = "blood_pressure";
          chartType = "line";
          break;
        case "Blood Sugar Level":
          this.query1 = "blood_sugar_level";
          chartType = "bar";
          break;
        case "Pulse Rate":
          this.query1 = "pulse_rate";
          chartType = "bar";
          break;
      }

      await this.getSelectedVitalRecords(this.query1);
      this.cleanData(this.selectedVitalRecords, chartType);
    },

    cleanData(dataObj, type) {
      const chartdata = dataObj;
      const xAxis = chartdata.map((row) =>
        new Date(row.date).toLocaleDateString("en", { day: "2-digit", month: "short" })
      );

      let valueSet = [];
      let originalArray = chartdata.map((row) =>
        row.data.map((item) => parseFloat(item.value))
      );

      if (["body_temp", "blood_sugar_level", "pulse_rate"].includes(this.query1)) {
        const min_maxArray = [];
        for (let i = 0; i < originalArray.length; i++) {
          min_maxArray.push([Math.min(...originalArray[i]), Math.max(...originalArray[i])]);
        }
        valueSet.push({
          data: min_maxArray,
          backgroundColor: "#0EAEC4",
          borderWidth: 0,
          borderRadius: Number.MAX_VALUE,
          borderSkipped: false,
          maxBarThickness: 18,
        });
      } else if (this.query1 === "blood_pressure") {
        const diastolicArray = chartdata.map((row) => row.data.map((item) => item.value.split("/")[0]));
        const systolicArray = chartdata.map((row) => row.data.map((item) => item.value.split("/")[1]));

        valueSet = [
          {
            label: "Systolic",
            data: diastolicArray.map((arr) => [Math.min(...arr), Math.max(...arr)]),
            backgroundColor: "#0EAEC4",
            borderColor: "#0EAEC4",
            borderWidth: 3,
          },
          {
            label: "Diastolic",
            data: systolicArray.map((arr) => [Math.min(...arr), Math.max(...arr)]),
            backgroundColor: "#ec4899",
            borderColor: "#ec4899",
            borderWidth: 3,
          },
        ];
      } else {
        const transposeArray = originalArray[0]?.map((_, i) => originalArray.map((row) => row[i])) || [];
        transposeArray.forEach((arr) => {
          valueSet.push({
            data: arr,
            backgroundColor: "#0EAEC4",
            borderColor: "#0EAEC4",
            borderWidth: 4,
          });
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
.vitals-page {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  max-width: 82.67rem;
  height: 100vh;

  &__content {
    display: flex;
    flex-direction: column;
    gap: $size-32;
    overflow-y: auto;
    padding: $size-24 $size-48 $size-48;

    @include scrollBar(normal);

    @include responsive(tab-landscape) {
      padding: $size-20 $size-32 $size-32;
    }

    @include responsive(phone) {
      padding: $size-16 $size-16 $size-32;
      gap: $size-24;
    }
  }
}

// Hero Banner
.vitals-hero {
  position: relative;
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: $size-24;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(14, 174, 196, 0.3);
  overflow: hidden;
  flex-shrink: 0;
  min-height: 180px;

  @include responsive(phone) {
    padding: 32px 24px;
    border-radius: $size-16;
    min-height: 160px;
  }

  &__content {
    position: relative;
    z-index: 2;
  }

  &__icon {
    width: 72px;
    height: 72px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto $size-16;

    @include responsive(phone) {
      width: 60px;
      height: 60px;
    }

    svg {
      width: 36px;
      height: 36px;
      color: white;

      @include responsive(phone) {
        width: 28px;
        height: 28px;
      }
    }
  }

  &__title {
    font-size: $size-28;
    font-weight: $fw-bold;
    color: white;
    margin: 0 0 $size-8 0;

    @include responsive(phone) {
      font-size: $size-22;
    }
  }

  &__subtitle {
    font-size: $size-15;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;

    @include responsive(phone) {
      font-size: $size-14;
    }
  }

  &__decoration {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);

  &--1 {
    width: 200px;
    height: 200px;
    top: -60px;
    right: -40px;
  }

  &--2 {
    width: 150px;
    height: 150px;
    bottom: -40px;
    left: -30px;
  }
}

// Empty State
.vitals-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $size-64 $size-24;
  background: white;
  border-radius: $size-20;
  border: 2px solid $color-g-92;

  &__illustration {
    position: relative;
    margin-bottom: $size-24;

    .illustration-circle {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 48px;
        height: 48px;
        color: #0EAEC4;
      }
    }
  }

  &__title {
    font-size: $size-20;
    font-weight: $fw-bold;
    color: $color-black;
    margin: 0 0 $size-8 0;
  }

  &__desc {
    font-size: $size-14;
    color: $color-g-54;
    margin: 0 0 $size-24 0;
    text-align: center;
    max-width: 300px;
  }

  &__btn {
    display: flex;
    align-items: center;
    gap: $size-8;
    padding: $size-14 $size-28;
    background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
    color: white;
    border: none;
    border-radius: $size-12;
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    cursor: pointer;
    transition: all 0.3s ease;

    svg {
      width: 20px;
      height: 20px;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(14, 174, 196, 0.4);
    }
  }
}

// Quick Stats
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: $size-16;

  @include responsive(phone) {
    grid-template-columns: repeat(2, 1fr);
    gap: $size-12;
  }
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $size-12;
  padding: $size-20;
  background: white;
  border: 2px solid $color-g-92;
  border-radius: $size-16;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);

    .stat-card__edit {
      opacity: 1;
    }
  }

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 24px;
      height: 24px;
      color: white;
    }
  }

  &__content {
    text-align: center;
  }

  &__label {
    font-size: $size-12;
    color: $color-g-54;
    display: block;
    margin-bottom: $size-4;
  }

  &__value {
    .value {
      font-size: $size-24;
      font-weight: $fw-bold;
      color: $color-black;
    }

    .unit {
      font-size: $size-12;
      color: $color-g-54;
      margin-left: 2px;
    }
  }

  &__edit {
    position: absolute;
    top: $size-12;
    right: $size-12;
    background: $color-g-95;
    border: none;
    padding: $size-6;
    border-radius: 6px;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;

    svg {
      width: 14px;
      height: 14px;
      color: $color-g-54;
    }

    &:hover {
      background: $color-g-90;
    }
  }

  &--add {
    border-style: dashed;
    cursor: pointer;

    .stat-card__icon {
      background: $color-g-95;

      svg {
        color: $color-g-54;
      }
    }

    .stat-card__label {
      font-weight: $fw-medium;
    }

    &:hover {
      border-color: #0EAEC4;
      background: #ecfeff;

      .stat-card__icon {
        background: #0EAEC4;

        svg {
          color: white;
        }
      }
    }
  }

  // Color variants
  &.vital--temp .stat-card__icon { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
  &.vital--weight .stat-card__icon { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
  &.vital--pulse .stat-card__icon { background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%); }
  &.vital--sugar .stat-card__icon { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); }
  &.vital--pressure .stat-card__icon { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
  &.vital--bmi .stat-card__icon { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); }

  // BMI Badge
  &__badge {
    position: absolute;
    top: $size-12;
    right: $size-12;
    padding: $size-4 $size-10;
    border-radius: $size-6;
    font-size: $size-10;
    font-weight: $fw-semi-bold;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &.status--normal {
      background: #dcfce7;
      color: #15803d;
    }

    &.status--high {
      background: #fee2e2;
      color: #dc2626;
    }

    &.status--low {
      background: #fef3c7;
      color: #a16207;
    }
  }
}

// Chart Section
.chart-section {
  background: white;
  border-radius: $size-20;
  padding: $size-24;
  border: 2px solid $color-g-92;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-24;
    flex-wrap: wrap;
    gap: $size-16;

    .header-left {
      .section-title {
        font-size: $size-20;
        font-weight: $fw-bold;
        color: $color-black;
        margin: 0 0 $size-4 0;
      }

      .section-subtitle {
        font-size: $size-13;
        color: $color-g-54;
        margin: 0;
      }
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: $size-16;
      flex-wrap: wrap;
    }
  }

  &__body {
    min-height: 300px;
  }
}

.vital-selector {
  display: flex;
  gap: $size-8;
  flex-wrap: wrap;
}

.vital-tab {
  display: flex;
  align-items: center;
  gap: $size-6;
  padding: $size-8 $size-14;
  background: $color-g-97;
  border: 2px solid transparent;
  border-radius: $size-8;
  font-size: $size-12;
  font-weight: $fw-medium;
  color: $color-g-54;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background: $color-g-95;
  }

  &.active {
    background: #ecfeff;
    border-color: #0EAEC4;
    color: #0891b2;
  }
}

.chart-actions {
  display: flex;
  gap: $size-8;
}

.action-btn {
  width: 36px;
  height: 36px;
  background: $color-g-97;
  border: none;
  border-radius: $size-8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  svg {
    width: 18px;
    height: 18px;
    color: $color-g-54;
  }

  &:hover {
    background: #0EAEC4;

    svg {
      color: white;
    }
  }
}

// History Section
.history-section {
  &__header {
    margin-bottom: $size-20;

    .section-title {
      font-size: $size-20;
      font-weight: $fw-bold;
      color: $color-black;
      margin: 0 0 $size-4 0;
    }

    .section-subtitle {
      font-size: $size-13;
      color: $color-g-54;
      margin: 0;
    }
  }
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $size-16;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.history-card {
  background: white;
  border: 2px solid $color-g-92;
  border-radius: $size-16;
  padding: $size-20;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $size-12;
    margin-bottom: $size-16;
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 22px;
      height: 22px;
      color: white;
    }
  }

  &__title {
    font-size: $size-14;
    font-weight: $fw-semi-bold;
    color: $color-black;
  }

  &__value {
    margin-bottom: $size-12;

    .value {
      font-size: $size-32;
      font-weight: $fw-bold;
      color: $color-black;
    }

    .unit {
      font-size: $size-14;
      color: $color-g-54;
      margin-left: $size-4;
    }
  }

  &__status {
    display: flex;
    align-items: center;
    gap: $size-6;
    padding: $size-8 $size-12;
    border-radius: $size-8;
    font-size: $size-12;
    font-weight: $fw-medium;
    margin-bottom: $size-16;

    svg {
      width: 14px;
      height: 14px;
    }

    &.status--normal {
      background: #f0fdf4;
      color: #15803d;
    }

    &.status--high {
      background: #fef2f2;
      color: #dc2626;
    }

    &.status--low {
      background: #fefce8;
      color: #a16207;
    }
  }

  &__footer {
    .update-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $size-6;
      padding: $size-10 $size-16;
      background: $color-g-97;
      border: none;
      border-radius: $size-8;
      font-size: $size-13;
      font-weight: $fw-medium;
      color: $color-g-44;
      cursor: pointer;
      transition: all 0.2s ease;

      svg {
        width: 14px;
        height: 14px;
      }

      &:hover {
        background: $color-g-95;
      }
    }

    .bmi-note {
      display: block;
      text-align: center;
      font-size: $size-11;
      color: $color-g-54;
      font-style: italic;
    }
  }

  // Color variants
  &.vital--temp .history-card__icon { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
  &.vital--weight .history-card__icon { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
  &.vital--pulse .history-card__icon { background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%); }
  &.vital--sugar .history-card__icon { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); }
  &.vital--pressure .history-card__icon { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
  &.vital--bmi .history-card__icon { background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); }
}

// Modal Styles
.vital-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $size-16;
}

.vital-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);

  &__header {
    background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
    padding: $size-24;
    border-radius: 20px 20px 0 0;
    position: relative;

    .header-content {
      display: flex;
      align-items: center;
      gap: $size-16;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      svg {
        width: 24px;
        height: 24px;
        color: white;
      }
    }

    .header-text {
      flex: 1;

      h3 {
        margin: 0;
        font-size: $size-18;
        font-weight: $fw-bold;
        color: white;
      }

      p {
        margin: 4px 0 0;
        font-size: $size-13;
        color: rgba(255, 255, 255, 0.85);
      }
    }

    .close-btn {
      position: absolute;
      top: $size-16;
      right: $size-16;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      padding: $size-8;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }

      svg {
        width: 20px;
        height: 20px;
        color: white;
      }
    }
  }

  &__body {
    padding: $size-24;
  }

  &__footer {
    display: flex;
    gap: $size-12;
    padding: $size-20 $size-24;
    border-top: 1px solid $color-g-92;

    .cancel-btn {
      flex: 1;
      padding: $size-14;
      background: $color-g-97;
      border: none;
      border-radius: $size-12;
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-g-44;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: $color-g-95;
      }
    }

    .save-btn {
      flex: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: $size-8;
      padding: $size-14;
      background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
      border: none;
      border-radius: $size-12;
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;

      svg {
        width: 18px;
        height: 18px;
      }

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(14, 174, 196, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .loading-state {
        display: flex;
        align-items: center;
        gap: $size-8;

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      }
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// Vital Selection
.vital-selection {
  margin-bottom: $size-24;

  .selection-label {
    display: block;
    font-size: $size-13;
    font-weight: $fw-semi-bold;
    color: $color-g-44;
    margin-bottom: $size-12;
  }
}

.vital-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-12;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.vital-type-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $size-8;
  padding: $size-16;
  background: $color-g-97;
  border: 2px solid transparent;
  border-radius: $size-12;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    background: white;
    border-color: $color-g-90;
  }

  &.selected {
    background: white;
    border-color: #0EAEC4;
    box-shadow: 0 4px 12px rgba(14, 174, 196, 0.15);
  }

  &__icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 20px;
      height: 20px;
      color: white;
    }
  }

  &__name {
    font-size: $size-13;
    font-weight: $fw-semi-bold;
    color: $color-black;
  }

  &__range {
    font-size: $size-11;
    color: $color-g-54;
  }

  &__check {
    position: absolute;
    top: $size-8;
    right: $size-8;
    width: 20px;
    height: 20px;
    background: #0EAEC4;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 12px;
      height: 12px;
      color: white;
    }
  }

  // Color variants
  &.vital--temp .vital-type-card__icon { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
  &.vital--weight .vital-type-card__icon { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
  &.vital--pulse .vital-type-card__icon { background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%); }
  &.vital--sugar .vital-type-card__icon { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); }
  &.vital--pressure .vital-type-card__icon { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
}

// Selected Vital Display
.selected-vital-display {
  margin-bottom: $size-24;
}

.selected-vital-card {
  display: flex;
  align-items: center;
  gap: $size-16;
  padding: $size-16;
  background: $color-g-97;
  border-radius: $size-12;

  &__icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 24px;
      height: 24px;
      color: white;
    }
  }

  &__info {
    .name {
      display: block;
      font-size: $size-15;
      font-weight: $fw-semi-bold;
      color: $color-black;
    }

    .range {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  &.vital--temp .selected-vital-card__icon { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
  &.vital--weight .selected-vital-card__icon { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
  &.vital--pulse .selected-vital-card__icon { background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%); }
  &.vital--sugar .selected-vital-card__icon { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); }
  &.vital--pressure .selected-vital-card__icon { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); }
}

// Input Section
.input-section {
  .input-label {
    display: block;
    font-size: $size-13;
    font-weight: $fw-semi-bold;
    color: $color-g-44;
    margin-bottom: $size-12;
  }
}

.single-input {
  .input-group {
    display: flex;
    gap: $size-12;
    margin-bottom: $size-12;
  }

  .vital-input {
    flex: 1;
    padding: $size-14 $size-16;
    border: 2px solid $color-g-90;
    border-radius: $size-10;
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-black;
    transition: all 0.2s ease;

    &:focus {
      outline: none;
      border-color: #0EAEC4;
    }

    &::placeholder {
      color: $color-g-77;
      font-weight: $fw-regular;
    }
  }

  .unit-select {
    width: 100px;
    padding: $size-14 $size-12;
    border: 2px solid $color-g-90;
    border-radius: $size-10;
    font-size: $size-14;
    font-weight: $fw-medium;
    color: $color-black;
    background: white;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: #0EAEC4;
    }
  }

  .input-hint {
    display: flex;
    align-items: center;
    gap: $size-6;
    font-size: $size-12;
    color: $color-g-54;

    svg {
      width: 14px;
      height: 14px;
      color: #0ea5e9;
    }
  }
}

.bp-input {
  display: flex;
  align-items: flex-end;
  gap: $size-12;

  @include responsive(phone) {
    flex-direction: column;
    align-items: stretch;
  }

  &__group {
    flex: 1;

    label {
      display: block;
      font-size: $size-12;
      color: $color-g-54;
      margin-bottom: $size-8;
    }

    .input-group {
      display: flex;
      gap: $size-8;
    }

    .vital-input {
      flex: 1;
      padding: $size-14 $size-16;
      border: 2px solid $color-g-90;
      border-radius: $size-10;
      font-size: $size-18;
      font-weight: $fw-semi-bold;
      color: $color-black;

      &:focus {
        outline: none;
        border-color: #0EAEC4;
      }
    }

    .unit-display {
      display: flex;
      align-items: center;
      padding: 0 $size-12;
      background: $color-g-97;
      border-radius: $size-10;
      font-size: $size-13;
      font-weight: $fw-medium;
      color: $color-g-54;
    }
  }

  .bp-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: $size-12;

    span {
      font-size: $size-24;
      font-weight: $fw-bold;
      color: $color-g-77;
    }

    @include responsive(phone) {
      display: none;
    }
  }
}

// Reading Indicator
.reading-indicator {
  margin-top: $size-20;
  padding: $size-16;
  background: $color-g-97;
  border-radius: $size-12;

  .indicator-bar {
    position: relative;
    height: 8px;
    background: linear-gradient(90deg, #fbbf24, #22c55e, #22c55e, #ef4444);
    border-radius: 4px;
    margin-bottom: $size-8;
  }

  .indicator-marker {
    position: absolute;
    top: -4px;
    width: 16px;
    height: 16px;
    background: white;
    border: 3px solid $color-black;
    border-radius: 50%;
    transform: translateX(-50%);
    transition: left 0.3s ease;
  }

  .indicator-labels {
    display: flex;
    justify-content: space-between;
    font-size: $size-11;
    color: $color-g-54;
    margin-bottom: $size-12;
  }

  .indicator-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-6;
    font-size: $size-13;
    font-weight: $fw-semi-bold;

    svg {
      width: 16px;
      height: 16px;
    }
  }

  &.status--normal .indicator-status {
    color: #15803d;
  }

  &.status--high .indicator-status {
    color: #dc2626;
  }

  &.status--low .indicator-status {
    color: #a16207;
  }
}

// Date & Time Section
.datetime-section {
  margin-top: $size-24;
  padding-top: $size-20;
  border-top: 1px solid $color-g-92;

  .input-label {
    display: block;
    font-size: $size-13;
    font-weight: $fw-semi-bold;
    color: $color-g-44;
    margin-bottom: $size-12;
  }
}

.datetime-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $size-16;

  @include responsive(phone) {
    grid-template-columns: 1fr;
    gap: $size-12;
  }
}

.datetime-group {
  label {
    display: block;
    font-size: $size-12;
    color: $color-g-54;
    margin-bottom: $size-8;

    .required {
      color: #ef4444;
    }

    .optional {
      color: $color-g-77;
      font-weight: $fw-regular;
    }
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;

    svg {
      position: absolute;
      left: $size-12;
      width: 18px;
      height: 18px;
      color: $color-g-54;
      pointer-events: none;
    }

    .datetime-input {
      width: 100%;
      padding: $size-12 $size-12 $size-12 $size-40;
      border: 2px solid $color-g-90;
      border-radius: $size-10;
      font-size: $size-14;
      font-weight: $fw-medium;
      color: $color-black;
      background: white;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: #0EAEC4;
      }

      &::-webkit-calendar-picker-indicator {
        cursor: pointer;
        opacity: 0.6;

        &:hover {
          opacity: 1;
        }
      }
    }
  }
}
</style>
