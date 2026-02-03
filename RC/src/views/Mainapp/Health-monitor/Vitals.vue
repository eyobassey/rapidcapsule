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
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>Health Vitals</h1>
            <p>Track and monitor your health metrics over time</p>
          </div>
          <button v-if="vitalList.length < 5" class="add-vital-btn" @click="openAddModal">
            <v-icon name="hi-plus" />
            <span>Log Vital</span>
          </button>
        </div>
      </header>

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

      <!-- Main Content -->
      <template v-if="vitalList.length">
        <!-- Vitals Overview Grid -->
        <section class="vitals-grid">
          <div
            v-for="(vital, index) in recentvitalarray"
            :key="index"
            class="vital-card"
            :class="getVitalColorClass(vital.name)"
          >
            <div class="vital-card__header">
              <div class="vital-icon">
                <v-icon :name="getVitalIcon(vital.name)" scale="1.1" />
              </div>
              <button class="edit-btn" @click="updateVital(vital)" title="Update">
                <v-icon name="hi-pencil" scale="0.75" />
              </button>
            </div>
            <div class="vital-card__body">
              <span class="vital-label">{{ vital.name }}</span>
              <div class="vital-value">
                <span class="value">{{ vital.value }}</span>
                <span class="unit">{{ vital.unit }}</span>
              </div>
            </div>
            <div class="vital-card__footer">
              <div class="status-indicator" :class="getVitalStatusClass(vital)">
                <v-icon :name="getStatusIcon(vital)" scale="0.7" />
                <span>{{ getStatusText(vital) }}</span>
              </div>
            </div>
          </div>

          <!-- BMI Card -->
          <div v-if="bmiData" class="vital-card vital-card--bmi">
            <div class="vital-card__header">
              <div class="vital-icon">
                <v-icon name="hi-scale" scale="1.1" />
              </div>
              <span class="bmi-badge" :class="bmiData.status">{{ bmiData.category }}</span>
            </div>
            <div class="vital-card__body">
              <span class="vital-label">Body Mass Index</span>
              <div class="vital-value">
                <span class="value">{{ bmiData.value }}</span>
                <span class="unit">kg/m²</span>
              </div>
            </div>
            <div class="vital-card__footer">
              <span class="bmi-note">Calculated from weight & height</span>
            </div>
          </div>

          <!-- Add Vital Card -->
          <button
            v-if="vitalList.length < 5"
            class="vital-card vital-card--add"
            @click="openAddModal"
          >
            <div class="add-icon">
              <v-icon name="hi-plus" scale="1.2" />
            </div>
            <span>Add New Vital</span>
          </button>
        </section>

        <!-- Chart Section -->
        <section class="chart-section glass-card">
          <div class="section-header">
            <div class="section-title-group">
              <h2>Vital Trends</h2>
              <p>View your health data patterns over time</p>
            </div>
            <div class="chart-controls">
              <div class="vital-tabs">
                <button
                  v-for="vital in vitalList"
                  :key="vital"
                  class="vital-tab"
                  :class="{ active: activeVitalChart === vital }"
                  @click="selectedVitalHandler(vital)"
                >
                  <v-icon :name="getVitalIcon(vital)" scale="0.85" />
                  <span>{{ getShortName(vital) }}</span>
                </button>
              </div>
              <div class="chart-actions">
                <button class="action-btn" @click="downloadChart" title="Download chart">
                  <v-icon name="hi-download" scale="0.9" />
                </button>
                <button class="action-btn" @click="handleShareChartURL" title="Share chart">
                  <v-icon name="hi-share" scale="0.9" />
                </button>
              </div>
            </div>
          </div>
          <div class="chart-container">
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
        </section>

        <!-- Quick Reference -->
        <section class="reference-section glass-card">
          <div class="section-header">
            <div class="section-title-group">
              <h2>Normal Ranges</h2>
              <p>Reference values for healthy adults</p>
            </div>
          </div>
          <div class="reference-grid">
            <div class="reference-item">
              <div class="ref-icon vital--temp">
                <v-icon name="fa-thermometer-half" scale="0.9" />
              </div>
              <div class="ref-info">
                <span class="ref-name">Temperature</span>
                <span class="ref-range">36.1 - 37.2°C</span>
              </div>
            </div>
            <div class="reference-item">
              <div class="ref-icon vital--pulse">
                <v-icon name="hi-heart" scale="0.9" />
              </div>
              <div class="ref-info">
                <span class="ref-name">Pulse Rate</span>
                <span class="ref-range">60 - 100 bpm</span>
              </div>
            </div>
            <div class="reference-item">
              <div class="ref-icon vital--pressure">
                <v-icon name="fa-heartbeat" scale="0.9" />
              </div>
              <div class="ref-info">
                <span class="ref-name">Blood Pressure</span>
                <span class="ref-range">90-120 / 60-80 mmHg</span>
              </div>
            </div>
            <div class="reference-item">
              <div class="ref-icon vital--sugar">
                <v-icon name="bi-droplet-fill" scale="0.9" />
              </div>
              <div class="ref-info">
                <span class="ref-name">Blood Sugar</span>
                <span class="ref-range">70 - 100 mg/dL</span>
              </div>
            </div>
          </div>
        </section>
      </template>
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

    getVitalIcon(name) {
      const icons = {
        "Body Temperature": "fa-thermometer-half",
        "Body Weight": "fa-weight",
        "Pulse Rate": "hi-heart",
        "Blood Sugar Level": "bi-droplet-fill",
        "Blood Pressure": "fa-heartbeat",
        "BMI": "hi-scale",
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
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 4px 24px rgba(0, 0, 0, 0.04),
    0 1px 2px rgba(0, 0, 0, 0.02);
  border-radius: 20px;
}

// Page Layout
.vitals-page {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  background: $bg;
  min-height: 100vh;
  overflow-x: hidden;
  width: 100%;
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
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 2rem 100px;
  overflow-x: hidden;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 1.25rem 1rem 100px;
  }

  @media (max-width: 375px) {
    padding: 1rem 0.75rem 100px;
  }
}

// Page Header
.page-header {
  margin-bottom: 2rem;

  .header-content {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;

    @media (max-width: 640px) {
      flex-direction: column;
    }
  }

  .header-text {
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: $navy;
      margin: 0 0 0.25rem;

      @media (max-width: 640px) {
        font-size: 1.5rem;
      }
    }

    p {
      font-size: 0.9375rem;
      color: $gray;
      margin: 0;
    }
  }

  .add-vital-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($sky, 0.35);
    }

    &:active {
      transform: scale(0.98);
    }

    svg {
      width: 18px;
      height: 18px;
    }

    @media (max-width: 640px) {
      width: 100%;
      justify-content: center;
    }
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.04);

  .empty-illustration {
    position: relative;
    width: 140px;
    height: 140px;
    margin: 0 auto 1.5rem;

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
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, $sky-light, white);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $sky;
    }
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: $navy;
    margin: 0 0 0.5rem;
  }

  p {
    font-size: 0.9375rem;
    color: $gray;
    max-width: 320px;
    margin: 0 auto 1.5rem;
    line-height: 1.5;
  }

  .empty-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.75rem;
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba($sky, 0.35);
    }

    svg {
      width: 20px;
      height: 20px;
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

// Vitals Grid
.vitals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  @media (max-width: 375px) {
    grid-template-columns: 1fr;
  }
}

.vital-card {
  @include glass-card;
  padding: 1.25rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  box-sizing: border-box;
  min-width: 0;

  @media (max-width: 640px) {
    padding: 1rem;

    .edit-btn {
      opacity: 1;
    }
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);

    .edit-btn {
      opacity: 1;
    }
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1rem;

    @media (max-width: 640px) {
      margin-bottom: 0.75rem;
    }
  }

  .vital-icon {
    width: 44px;
    height: 44px;
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

  .edit-btn {
    width: 28px;
    height: 28px;
    background: rgba(0, 0, 0, 0.04);
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s;
    color: $gray;
    flex-shrink: 0;

    &:hover {
      background: rgba(0, 0, 0, 0.08);
      color: $slate;
    }
  }

  &__body {
    margin-bottom: 0.75rem;
    overflow: hidden;

    .vital-label {
      display: block;
      font-size: 0.75rem;
      color: $gray;
      margin-bottom: 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      @media (max-width: 640px) {
        font-size: 0.6875rem;
      }
    }

    .vital-value {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      flex-wrap: wrap;

      .value {
        font-size: 1.5rem;
        font-weight: 700;
        color: $navy;
        line-height: 1;

        @media (max-width: 640px) {
          font-size: 1.25rem;
        }
      }

      .unit {
        font-size: 0.75rem;
        color: $gray;
      }
    }
  }

  &__footer {
    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      white-space: nowrap;

      @media (max-width: 640px) {
        font-size: 0.5625rem;
        padding: 0.2rem 0.4rem;
      }

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

  // Color variants
  &.vital--temp .vital-icon { background: linear-gradient(135deg, #f97316, #ea580c); }
  &.vital--weight .vital-icon { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
  &.vital--pulse .vital-icon { background: linear-gradient(135deg, $sky, $sky-dark); }
  &.vital--sugar .vital-icon { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
  &.vital--pressure .vital-icon { background: linear-gradient(135deg, #ec4899, #db2777); }

  // BMI Card
  &--bmi {
    .vital-icon {
      background: linear-gradient(135deg, #14b8a6, #0d9488);
    }

    .bmi-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;

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

    .bmi-note {
      font-size: 0.6875rem;
      color: $light-gray;
      font-style: italic;
    }
  }

  // Add Card
  &--add {
    border: 2px dashed rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    min-height: 160px;
    cursor: pointer;

    &:hover {
      border-color: $sky;
      background: $sky-light;

      .add-icon {
        background: $sky;
        color: white;
      }
    }

    .add-icon {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      background: rgba(0, 0, 0, 0.04);
      display: flex;
      align-items: center;
      justify-content: center;
      color: $gray;
      transition: all 0.2s;
    }

    span {
      font-size: 0.875rem;
      font-weight: 500;
      color: $gray;
    }
  }
}

// Glass Card
.glass-card {
  @include glass-card;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  overflow: hidden;
  box-sizing: border-box;
  width: 100%;

  @media (max-width: 640px) {
    padding: 1rem;
    border-radius: 16px;
  }
}

// Section Header
.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.25rem;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-title-group {
    min-width: 0;

    h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: $navy;
      margin: 0 0 0.125rem;

      @media (max-width: 640px) {
        font-size: 1rem;
      }
    }

    p {
      font-size: 0.8125rem;
      color: $gray;
      margin: 0;

      @media (max-width: 640px) {
        font-size: 0.75rem;
      }
    }
  }
}

// Chart Section
.chart-section {
  overflow: hidden;

  .chart-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      width: 100%;
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
  }

  .vital-tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-bottom: 2px;

    &::-webkit-scrollbar {
      display: none;
    }

    @media (max-width: 640px) {
      flex-wrap: nowrap;
      width: 100%;
    }
  }

  .vital-tab {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.5rem 0.75rem;
    background: $bg;
    border: 2px solid transparent;
    border-radius: 10px;
    font-size: 0.75rem;
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

    @media (max-width: 640px) {
      padding: 0.4rem 0.6rem;
      font-size: 0.6875rem;
    }
  }

  .chart-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;

    @media (max-width: 768px) {
      align-self: flex-end;
    }
  }

  .action-btn {
    width: 36px;
    height: 36px;
    background: $bg;
    border: none;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $gray;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;

    &:hover {
      background: $sky;
      color: white;
    }

    @media (max-width: 640px) {
      width: 32px;
      height: 32px;
    }
  }

  .chart-container {
    background: $bg;
    border-radius: 12px;
    overflow: hidden;
    min-height: 250px;
    width: 100%;

    @media (max-width: 640px) {
      min-height: 200px;
      border-radius: 8px;
    }
  }

  .chart-legend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 1rem;

    @media (max-width: 640px) {
      gap: 1rem;
      margin-top: 0.75rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: $slate;

      @media (max-width: 640px) {
        font-size: 0.75rem;
        gap: 0.375rem;
      }

      .legend-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;

        @media (max-width: 640px) {
          width: 10px;
          height: 10px;
        }

        &.systolic {
          background: $sky;
        }

        &.diastolic {
          background: $rose;
        }
      }
    }
  }
}

// Reference Section
.reference-section {
  .reference-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.75rem;

    @media (max-width: 640px) {
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }

    @media (max-width: 375px) {
      grid-template-columns: 1fr;
    }
  }

  .reference-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: $bg;
    border-radius: 12px;
    min-width: 0;

    @media (max-width: 640px) {
      gap: 0.5rem;
      padding: 0.625rem;
    }

    .ref-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;

      @media (max-width: 640px) {
        width: 32px;
        height: 32px;
        border-radius: 8px;
      }

      &.vital--temp { background: linear-gradient(135deg, #f97316, #ea580c); }
      &.vital--pulse { background: linear-gradient(135deg, $sky, $sky-dark); }
      &.vital--pressure { background: linear-gradient(135deg, #ec4899, #db2777); }
      &.vital--sugar { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
    }

    .ref-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
      overflow: hidden;

      .ref-name {
        font-size: 0.75rem;
        font-weight: 500;
        color: $slate;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        @media (max-width: 640px) {
          font-size: 0.6875rem;
        }
      }

      .ref-range {
        font-size: 0.6875rem;
        color: $gray;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        @media (max-width: 640px) {
          font-size: 0.625rem;
        }
      }
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
