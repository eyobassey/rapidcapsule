<template>
  <div class="page-content">
    <TopBar showButtons type="avatar" @open-side-nav="$emit('openSideNav')" />
    <loader v-if="isLoading" :useOverlay="false" style="position: absolute" />
    <div v-else class="page-content__body">
      <div class="patient-details-container">
        <!-- Header -->
        <div class="page-header">
          <button class="back-btn" @click="$router.back()">
            <rc-icon icon-name="arrow-left" size="sm" />
          </button>
          <div class="header-content">
            <h1>Patient Details</h1>
          </div>
          <button class="btn btn-primary" @click="createPrescription">
            <rc-icon icon-name="plus" size="sm" />
            New Prescription
          </button>
        </div>

        <!-- Patient Info Card -->
        <div class="patient-info-card">
          <div class="patient-avatar">
            <img
              v-if="patient.profile_image"
              :src="patient.profile_image"
              :alt="patient.full_name"
            />
            <span v-else>{{ getInitials(patient.full_name) }}</span>
          </div>
          <div class="patient-details">
            <h2>{{ patient.full_name }}</h2>
            <div class="details-grid">
              <div class="detail-item">
                <rc-icon icon-name="email" size="sm" />
                <span>{{ patient.email }}</span>
              </div>
              <div class="detail-item">
                <rc-icon icon-name="phone" size="sm" />
                <span>{{ patient.phone || 'No phone' }}</span>
              </div>
              <div class="detail-item">
                <rc-icon icon-name="calendar" size="sm" />
                <span>{{ formatDate(patient.date_of_birth) }} ({{ calculateAge(patient.date_of_birth) }})</span>
              </div>
              <div class="detail-item">
                <rc-icon icon-name="user" size="sm" />
                <span>{{ patient.gender || 'Not specified' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Medical History Tab -->
          <div v-if="activeTab === 'medical-history'" class="medical-history">
            <div class="content-card">
              <h3>Pre-existing Conditions</h3>
              <div v-if="medicalHistory.conditions?.length" class="tags-list">
                <span
                  v-for="condition in medicalHistory.conditions"
                  :key="condition"
                  class="tag"
                >
                  {{ condition }}
                </span>
              </div>
              <p v-else class="empty-text">No pre-existing conditions recorded</p>
            </div>

            <div class="content-card">
              <h3>Allergies</h3>
              <div v-if="medicalHistory.allergies?.length" class="tags-list tags-list--warning">
                <span
                  v-for="allergy in medicalHistory.allergies"
                  :key="allergy"
                  class="tag tag--warning"
                >
                  {{ allergy }}
                </span>
              </div>
              <p v-else class="empty-text">No allergies recorded</p>
            </div>

            <div class="content-card">
              <h3>Health Risk Factors</h3>
              <div v-if="Object.keys(medicalHistory.risk_factors || {}).length" class="risk-factors">
                <div
                  v-for="(value, key) in medicalHistory.risk_factors"
                  :key="key"
                  class="risk-item"
                >
                  <span class="risk-label">{{ formatRiskLabel(key) }}</span>
                  <span class="risk-value">{{ value || 'Not specified' }}</span>
                </div>
              </div>
              <p v-else class="empty-text">No risk factors recorded</p>
            </div>
          </div>

          <!-- Prescriptions Tab -->
          <div v-if="activeTab === 'prescriptions'" class="prescriptions-tab">
            <loader v-if="loadingPrescriptions" :useOverlay="false" />
            <div v-else-if="prescriptions.length" class="prescriptions-list">
              <div
                v-for="prescription in prescriptions"
                :key="prescription._id"
                class="prescription-card"
                @click="viewPrescription(prescription._id)"
              >
                <div class="prescription-header">
                  <span class="prescription-id">{{ prescription.prescription_number }}</span>
                  <span :class="['status', `status--${prescription.status?.toLowerCase()}`]">
                    {{ formatStatus(prescription.status) }}
                  </span>
                </div>
                <div class="prescription-body">
                  <p class="items-count">{{ prescription.items?.length || 0 }} medications</p>
                  <p class="prescription-date">{{ formatDate(prescription.created_at) }}</p>
                </div>
                <div class="prescription-footer">
                  <span class="amount">NGN {{ formatCurrency(prescription.total_amount) }}</span>
                  <rc-icon icon-name="chevron-right" size="sm" />
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <rc-icon icon-name="prescription" size="lg" />
              <p>No prescriptions found for this patient</p>
              <button class="btn btn-secondary" @click="createPrescription">
                Create First Prescription
              </button>
            </div>
          </div>

          <!-- Vitals Tab -->
          <div v-if="activeTab === 'vitals'" class="vitals-tab">
            <loader v-if="loadingVitals" :useOverlay="false" />
            <div v-else-if="vitals.length" class="vitals-grid">
              <div
                v-for="vital in vitals"
                :key="vital._id"
                class="vital-card"
              >
                <div class="vital-icon">
                  <rc-icon :icon-name="getVitalIcon(vital.type)" size="md" />
                </div>
                <div class="vital-info">
                  <h4>{{ formatVitalType(vital.type) }}</h4>
                  <p class="vital-value">{{ vital.value }} {{ vital.unit }}</p>
                  <p class="vital-date">{{ formatDate(vital.recorded_at) }}</p>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <rc-icon icon-name="heart" size="lg" />
              <p>No vital signs recorded</p>
            </div>
          </div>

          <!-- Health Checkups Tab -->
          <div v-if="activeTab === 'checkups'" class="checkups-tab">
            <loader v-if="loadingCheckups" :useOverlay="false" />
            <div v-else-if="healthCheckups.length" class="checkups-list">
              <div
                v-for="checkup in healthCheckups"
                :key="checkup._id"
                class="checkup-card"
              >
                <div class="checkup-header">
                  <span class="checkup-date">{{ formatDate(checkup.created_at) }}</span>
                  <span :class="['triage', `triage--${checkup.triage_level?.toLowerCase()}`]">
                    {{ checkup.triage_level || 'N/A' }}
                  </span>
                </div>
                <div class="checkup-body">
                  <h4>Primary Condition</h4>
                  <p>{{ checkup.primary_condition || 'No diagnosis' }}</p>
                </div>
                <div class="checkup-symptoms" v-if="checkup.symptoms?.length">
                  <h5>Symptoms</h5>
                  <div class="symptoms-tags">
                    <span
                      v-for="symptom in (expandedCheckupSymptoms[checkup._id] ? checkup.symptoms : checkup.symptoms.slice(0, 3))"
                      :key="symptom.id"
                      class="symptom-tag"
                    >
                      {{ symptom.name }}
                    </span>
                    <span
                      v-if="checkup.symptoms.length > 3"
                      class="more-tag clickable"
                      @click="toggleSymptoms(checkup._id)"
                    >
                      {{ expandedCheckupSymptoms[checkup._id] ? 'Show less' : `+${checkup.symptoms.length - 3} more` }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <rc-icon icon-name="clipboard" size="lg" />
              <p>No health checkups recorded</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader";
import RcIcon from "@/components/RCIcon";
import apiFactory from "@/services/apiFactory";
import moment from "moment";

export default {
  name: "PatientDetails",
  components: {
    TopBar,
    Loader,
    RcIcon,
  },
  data() {
    return {
      isLoading: true,
      loadingPrescriptions: false,
      loadingVitals: false,
      loadingCheckups: false,
      patient: {},
      medicalHistory: {},
      prescriptions: [],
      vitals: [],
      healthCheckups: [],
      expandedCheckupSymptoms: {}, // Track which checkups have symptoms expanded
      activeTab: "medical-history",
      tabs: [
        { id: "medical-history", label: "Medical History" },
        { id: "prescriptions", label: "Prescriptions" },
        { id: "vitals", label: "Vitals" },
        { id: "checkups", label: "Health Checkups" },
      ],
    };
  },
  computed: {
    patientId() {
      return this.$route.params.id;
    },
  },
  watch: {
    activeTab(newTab) {
      this.loadTabData(newTab);
    },
  },
  async mounted() {
    await this.fetchPatientDetails();
    await this.fetchMedicalHistory();
  },
  methods: {
    async fetchPatientDetails() {
      try {
        this.isLoading = true;
        const response = await apiFactory.$_getPharmacyPatientDetails(this.patientId);
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.patient = result;
        }
      } catch (error) {
        console.error("Error fetching patient details:", error);
        this.$toast.error("Failed to load patient details");
      } finally {
        this.isLoading = false;
      }
    },
    async fetchMedicalHistory() {
      try {
        const response = await apiFactory.$_getPharmacyPatientMedicalHistory(this.patientId);
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.medicalHistory = result;
        }
      } catch (error) {
        console.error("Error fetching medical history:", error);
      }
    },
    async loadTabData(tab) {
      if (tab === "prescriptions" && !this.prescriptions.length) {
        await this.fetchPrescriptions();
      } else if (tab === "vitals" && !this.vitals.length) {
        await this.fetchVitals();
      } else if (tab === "checkups" && !this.healthCheckups.length) {
        await this.fetchHealthCheckups();
      }
    },
    async fetchPrescriptions() {
      try {
        this.loadingPrescriptions = true;
        const response = await apiFactory.$_getPharmacyPatientPrescriptions(this.patientId, { page: 1, limit: 20 });
        // Backend returns: { statusCode, message, data: { total, docs, pages, perPage, currentPage } }
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.prescriptions = result.docs || [];
        }
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
      } finally {
        this.loadingPrescriptions = false;
      }
    },
    async fetchVitals() {
      try {
        this.loadingVitals = true;
        const response = await apiFactory.$_getPharmacyPatientVitals(this.patientId);
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.vitals = result || [];
        }
      } catch (error) {
        console.error("Error fetching vitals:", error);
      } finally {
        this.loadingVitals = false;
      }
    },
    async fetchHealthCheckups() {
      try {
        this.loadingCheckups = true;
        const response = await apiFactory.$_getPharmacyPatientHealthCheckups(this.patientId, 5);
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.healthCheckups = result || [];
        }
      } catch (error) {
        console.error("Error fetching health checkups:", error);
      } finally {
        this.loadingCheckups = false;
      }
    },
    createPrescription() {
      this.$router.push({
        path: "/app/specialist/pharmacy/prescriptions/create",
        query: { patient: this.patientId },
      });
    },
    viewPrescription(id) {
      this.$router.push(`/app/specialist/pharmacy/prescriptions/${id}`);
    },
    getInitials(name) {
      if (!name) return "?";
      return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    },
    formatDate(date) {
      if (!date) return "N/A";
      return moment(date).format("MMM D, YYYY");
    },
    calculateAge(dateOfBirth) {
      if (!dateOfBirth) return "N/A";
      const years = moment().diff(moment(dateOfBirth), "years");
      return `${years} years old`;
    },
    formatCurrency(amount) {
      if (!amount) return "0.00";
      return Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    formatStatus(status) {
      if (!status) return "";
      return status.replace(/_/g, " ").toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
    },
    formatRiskLabel(key) {
      return key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    },
    formatVitalType(type) {
      const types = {
        blood_pressure: "Blood Pressure",
        heart_rate: "Heart Rate",
        temperature: "Temperature",
        weight: "Weight",
        height: "Height",
        blood_sugar: "Blood Sugar",
        oxygen_saturation: "Oxygen Saturation",
      };
      return types[type] || type;
    },
    getVitalIcon(type) {
      const icons = {
        blood_pressure: "heart",
        heart_rate: "heart",
        temperature: "thermometer",
        weight: "scale",
        height: "ruler",
        blood_sugar: "droplet",
        oxygen_saturation: "lungs",
      };
      return icons[type] || "activity";
    },
    toggleSymptoms(checkupId) {
      this.expandedCheckupSymptoms = {
        ...this.expandedCheckupSymptoms,
        [checkupId]: !this.expandedCheckupSymptoms[checkupId],
      };
    },
  },
};
</script>

<style scoped lang="scss">
.page-content {
  @include flexItem(vertical) {
    width: 100%;
    height: 100%;
    background-color: $color-g-97;
  }

  &__body {
    flex-grow: 1;
    overflow-y: auto;
    padding: $size-24;

    @include responsive(tab-portrait) {
      padding: $size-16;
    }
  }
}

.patient-details-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: $size-16;
  margin-bottom: $size-24;

  .back-btn {
    width: $size-40;
    height: $size-40;
    border-radius: 50%;
    border: none;
    background: $color-white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    &:hover {
      background: $color-g-95;
    }
  }

  .header-content {
    flex: 1;

    h1 {
      font-size: $size-24;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }
}

.patient-info-card {
  display: flex;
  gap: $size-24;
  background: $color-white;
  padding: $size-24;
  border-radius: $size-16;
  margin-bottom: $size-24;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  @include responsive(phone) {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}

.patient-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: $color-pri;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    font-size: $size-32;
    font-weight: $fw-bold;
    color: $color-white;
  }
}

.patient-details {
  flex: 1;

  h2 {
    font-size: $size-24;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-16;
  }
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-12;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.detail-item {
  display: flex;
  align-items: center;
  gap: $size-8;
  color: $color-g-54;
  font-size: $size-15;

  .icons {
    flex-shrink: 0;
  }
}

.tabs {
  display: flex;
  gap: $size-4;
  margin-bottom: $size-24;
  border-bottom: 1px solid $color-g-90;
  overflow-x: auto;
}

.tab {
  padding: $size-12 $size-20;
  border: none;
  background: none;
  font-size: $size-15;
  font-weight: $fw-medium;
  color: $color-g-54;
  cursor: pointer;
  position: relative;
  white-space: nowrap;

  &:hover {
    color: $color-g-36;
  }

  &.active {
    color: $color-pri;

    &::after {
      content: "";
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: $color-pri;
    }
  }
}

.tab-content {
  min-height: 300px;
}

.content-card {
  background: $color-white;
  padding: $size-20;
  border-radius: $size-12;
  margin-bottom: $size-16;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-12;
  }
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: $size-8;
}

.tag {
  padding: $size-6 $size-12;
  border-radius: $size-16;
  font-size: $size-12;
  background: rgba($color-pri, 0.1);
  color: $color-pri;

  &--warning {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }
}

.risk-factors {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-12;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.risk-item {
  display: flex;
  justify-content: space-between;
  padding: $size-10;
  background: $color-g-97;
  border-radius: $size-8;

  .risk-label {
    font-size: $size-12;
    color: $color-g-54;
  }

  .risk-value {
    font-size: $size-12;
    font-weight: $fw-medium;
    color: $color-g-36;
  }
}

.empty-text {
  font-size: $size-15;
  color: $color-g-54;
  font-style: italic;
}

.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.prescription-card {
  background: $color-white;
  padding: $size-16;
  border-radius: $size-12;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .prescription-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $size-12;

    .prescription-id {
      font-size: $size-15;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }

  .prescription-body {
    margin-bottom: $size-12;

    .items-count {
      font-size: $size-12;
      color: $color-g-44;
    }

    .prescription-date {
      font-size: $size-12;
      color: $color-g-54;
      margin-top: $size-4;
    }
  }

  .prescription-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .amount {
      font-size: $size-16;
      font-weight: $fw-semi-bold;
      color: $color-pri;
    }
  }
}

.status {
  font-size: $size-11;
  padding: $size-4 $size-10;
  border-radius: $size-12;
  font-weight: $fw-medium;
  text-transform: uppercase;

  &--draft {
    background: $color-g-90;
    color: $color-g-44;
  }

  &--pending_payment {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--paid,
  &--processing {
    background: rgba(#3b82f6, 0.1);
    color: #2563eb;
  }

  &--dispensed,
  &--shipped {
    background: rgba(#8b5cf6, 0.1);
    color: #7c3aed;
  }

  &--delivered {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--cancelled {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }
}

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: $size-16;

  @include responsive(tab-landscape) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.vital-card {
  display: flex;
  gap: $size-16;
  background: $color-white;
  padding: $size-16;
  border-radius: $size-12;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  .vital-icon {
    width: $size-48;
    height: $size-48;
    border-radius: $size-12;
    background: rgba($color-pri, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-pri;
  }

  .vital-info {
    h4 {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-44;
      margin-bottom: $size-4;
    }

    .vital-value {
      font-size: $size-18;
      font-weight: $fw-bold;
      color: $color-g-21;
    }

    .vital-date {
      font-size: $size-12;
      color: $color-g-54;
      margin-top: $size-4;
    }
  }
}

.checkups-list {
  display: flex;
  flex-direction: column;
  gap: $size-16;
}

.checkup-card {
  background: $color-white;
  padding: $size-20;
  border-radius: $size-12;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  .checkup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $size-12;

    .checkup-date {
      font-size: $size-12;
      color: $color-g-54;
    }

    .triage {
      font-size: $size-11;
      padding: $size-4 $size-10;
      border-radius: $size-12;
      font-weight: $fw-medium;
      text-transform: uppercase;

      &--emergency {
        background: rgba(#ef4444, 0.1);
        color: #dc2626;
      }

      &--consultation_24 {
        background: rgba(#f59e0b, 0.1);
        color: #d97706;
      }

      &--consultation {
        background: rgba(#3b82f6, 0.1);
        color: #2563eb;
      }

      &--self_care {
        background: rgba(#10b981, 0.1);
        color: #059669;
      }
    }
  }

  .checkup-body {
    margin-bottom: $size-12;

    h4 {
      font-size: $size-12;
      color: $color-g-54;
      margin-bottom: $size-4;
    }

    p {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-21;
    }
  }

  .checkup-symptoms {
    h5 {
      font-size: $size-12;
      color: $color-g-54;
      margin-bottom: $size-8;
    }

    .symptoms-tags {
      display: flex;
      flex-wrap: wrap;
      gap: $size-6;
    }

    .symptom-tag {
      font-size: $size-12;
      padding: $size-4 $size-10;
      background: $color-g-95;
      border-radius: $size-12;
      color: $color-g-44;
    }

    .more-tag {
      font-size: $size-12;
      padding: $size-4 $size-10;
      background: $color-g-90;
      border-radius: $size-12;
      color: $color-g-54;

      &.clickable {
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: $color-pri;
          color: $color-white;
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: $size-48 $size-24;
  color: $color-g-54;

  p {
    font-size: $size-15;
    margin: $size-16 0;
  }
}

.btn {
  padding: $size-12 $size-20;
  border-radius: $size-8;
  font-size: $size-15;
  font-weight: $fw-medium;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: $size-8;

  &-primary {
    background: $color-pri;
    color: $color-white;

    &:hover {
      background: darken($color-pri, 10%);
    }
  }

  &-secondary {
    background: $color-g-90;
    color: $color-g-36;

    &:hover {
      background: $color-g-85;
    }
  }
}
</style>
