<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Prescription Details"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="prescription-details-page" v-if="!loading && prescription">
        <!-- Prescription Header -->
        <div class="header-card">
          <div class="header-main">
            <h2>{{ prescription.prescription_number }}</h2>
            <div :class="['status-badge', statusClass]">
              {{ formatStatus(prescription.status) }}
            </div>
          </div>
          <div class="header-meta">
            <span>
              <RCIcon name="calendar" />
              Issued: {{ formatDate(prescription.created_at) }}
            </span>
            <span v-if="prescription.expiry_date" :class="{ expired: isExpired }">
              <RCIcon name="clock" />
              {{ isExpired ? 'Expired' : 'Expires' }}: {{ formatDate(prescription.expiry_date) }}
            </span>
          </div>
        </div>

        <!-- Patient & Doctor Info -->
        <div class="info-cards">
          <div class="info-card">
            <h4>Patient Information</h4>
            <div class="info-row">
              <span class="label">Name</span>
              <span class="value">
                {{ prescription.patient?.profile?.first_name }}
                {{ prescription.patient?.profile?.last_name }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">Phone</span>
              <span class="value">{{ prescription.patient?.profile?.phone_number || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Email</span>
              <span class="value">{{ prescription.patient?.email || 'N/A' }}</span>
            </div>
          </div>

          <div class="info-card">
            <h4>Prescribing Physician</h4>
            <div class="info-row">
              <span class="label">Doctor</span>
              <span class="value">
                Dr. {{ prescription.specialist?.profile?.first_name }}
                {{ prescription.specialist?.profile?.last_name }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">Specialization</span>
              <span class="value">{{ prescription.specialist?.profile?.specialization || 'General Practice' }}</span>
            </div>
            <div class="info-row">
              <span class="label">License No.</span>
              <span class="value">{{ prescription.specialist?.profile?.license_number || 'N/A' }}</span>
            </div>
          </div>
        </div>

        <!-- Medications -->
        <div class="section-card">
          <h3>Prescribed Medications</h3>
          <div class="medications-list">
            <div
              v-for="(med, index) in prescription.medications"
              :key="index"
              class="medication-item"
            >
              <div class="med-header">
                <div class="med-name">
                  <h4>{{ med.drug_name }}</h4>
                  <span class="med-strength">{{ med.strength }} {{ med.dosage_form }}</span>
                </div>
                <div :class="['fill-status', med.is_filled ? 'filled' : 'unfilled']">
                  {{ med.is_filled ? 'Filled' : 'Not Filled' }}
                </div>
              </div>
              <div class="med-details">
                <div class="detail">
                  <span class="label">Quantity</span>
                  <span class="value">{{ med.quantity }}</span>
                </div>
                <div class="detail">
                  <span class="label">Dosage</span>
                  <span class="value">{{ med.dosage }}</span>
                </div>
                <div class="detail">
                  <span class="label">Frequency</span>
                  <span class="value">{{ med.frequency }}</span>
                </div>
                <div class="detail" v-if="med.duration">
                  <span class="label">Duration</span>
                  <span class="value">{{ med.duration }}</span>
                </div>
              </div>
              <div class="med-instructions" v-if="med.instructions">
                <span class="label">Instructions:</span>
                <p>{{ med.instructions }}</p>
              </div>
              <div class="fill-action" v-if="!med.is_filled && canFill">
                <rc-button
                  type="secondary"
                  label="Mark as Filled"
                  @click="fillMedication(index)"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Refill Information -->
        <div class="section-card" v-if="prescription.refills_allowed > 0">
          <h3>Refill Information</h3>
          <div class="refill-info">
            <div class="refill-stat">
              <span class="value">{{ prescription.refills_remaining }}</span>
              <span class="label">Refills Remaining</span>
            </div>
            <div class="refill-stat">
              <span class="value">{{ prescription.refills_allowed }}</span>
              <span class="label">Total Allowed</span>
            </div>
            <div class="refill-stat">
              <span class="value">{{ prescription.refills_used || 0 }}</span>
              <span class="label">Used</span>
            </div>
          </div>
          <div class="refill-history" v-if="prescription.refill_history?.length > 0">
            <h4>Refill History</h4>
            <div
              v-for="(refill, index) in prescription.refill_history"
              :key="index"
              class="refill-entry"
            >
              <span class="refill-date">{{ formatDate(refill.date) }}</span>
              <span class="refill-pharmacy">{{ refill.pharmacy_name }}</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="section-card" v-if="prescription.notes">
          <h3>Doctor's Notes</h3>
          <p class="notes-text">{{ prescription.notes }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <rc-button
            v-if="canFill && !allMedicationsFilled"
            type="primary"
            label="Fill All Medications"
            @click="fillAllMedications"
          />
          <rc-button
            v-if="canRefill"
            type="primary"
            label="Process Refill"
            @click="processRefill"
          />
          <rc-button
            type="secondary"
            label="Create Order from Prescription"
            @click="createOrder"
          />
          <rc-button
            type="secondary"
            label="Print Prescription"
            @click="printPrescription"
          />
        </div>
      </div>

      <!-- Loader -->
      <div class="loader-container" v-if="loading">
        <Loader :useOverlay="false" :rounded="true" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";
import moment from "moment";

export default {
  name: "PharmacyPrescriptionDetails",
  components: {
    TopBar,
    RcButton,
    Loader,
    RCIcon,
  },
  emits: ["openSideNav"],
  setup() {
    const route = useRoute();
    const router = useRouter();

    const {
      "pharmacyPortal/fetchPrescriptionDetails": fetchPrescriptionDetails,
      "pharmacyPortal/fillMedication": fillMedicationAction,
      "pharmacyPortal/fillAllMedications": fillAllMedicationsAction,
      "pharmacyPortal/processRefill": processRefillAction,
    } = useMapActions();

    const {
      "pharmacyPortal/getCurrentPrescription": currentPrescription,
      "pharmacyPortal/getLoading": isLoading,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);
    const prescription = computed(() => currentPrescription.value);

    const formatDate = (date) => moment(date).format("MMM D, YYYY");

    const formatStatus = (status) => {
      const statusMap = {
        PENDING: "Pending",
        PARTIALLY_FILLED: "Partially Filled",
        FILLED: "Filled",
        EXPIRED: "Expired",
        CANCELLED: "Cancelled",
      };
      return statusMap[status] || status;
    };

    const statusClass = computed(() => {
      const statusClasses = {
        PENDING: "pending",
        PARTIALLY_FILLED: "partial",
        FILLED: "filled",
        EXPIRED: "expired",
        CANCELLED: "cancelled",
      };
      return statusClasses[prescription.value?.status] || "pending";
    });

    const isExpired = computed(() =>
      prescription.value?.expiry_date
        ? moment(prescription.value.expiry_date).isBefore(moment())
        : false
    );

    const canFill = computed(() =>
      !isExpired.value &&
      ["PENDING", "PARTIALLY_FILLED"].includes(prescription.value?.status)
    );

    const allMedicationsFilled = computed(() =>
      prescription.value?.medications?.every((med) => med.is_filled)
    );

    const canRefill = computed(() =>
      !isExpired.value &&
      prescription.value?.status === "FILLED" &&
      (prescription.value?.refills_remaining || 0) > 0
    );

    const fillMedication = async (medicationIndex) => {
      try {
        await fillMedicationAction({
          prescriptionId: route.params.id,
          medicationIndex,
        });
        await fetchPrescriptionDetails(route.params.id);
      } catch (error) {
        console.error("Error filling medication:", error);
      }
    };

    const fillAllMedications = async () => {
      try {
        await fillAllMedicationsAction(route.params.id);
        await fetchPrescriptionDetails(route.params.id);
      } catch (error) {
        console.error("Error filling all medications:", error);
      }
    };

    const processRefill = async () => {
      try {
        await processRefillAction(route.params.id);
        await fetchPrescriptionDetails(route.params.id);
      } catch (error) {
        console.error("Error processing refill:", error);
      }
    };

    const createOrder = () => {
      router.push({
        path: "/app/specialist/pharmacy-portal/orders/new",
        query: { prescriptionId: route.params.id },
      });
    };

    const printPrescription = () => {
      window.print();
    };

    onMounted(() => {
      fetchPrescriptionDetails(route.params.id);
    });

    return {
      prescription,
      loading,
      statusClass,
      isExpired,
      canFill,
      allMedicationsFilled,
      canRefill,
      formatDate,
      formatStatus,
      fillMedication,
      fillAllMedications,
      processRefill,
      createOrder,
      printPrescription,
    };
  },
};
</script>

<style scoped lang="scss">
.prescription-details-page {
  padding: $size-16;

  .header-card {
    background: $color-white;
    border-radius: $size-12;
    padding: $size-20;
    margin-bottom: $size-16;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $size-12;

      h2 {
        font-size: $size-20;
        font-weight: 700;
        color: $color-g-21;
      }

      .status-badge {
        font-size: $size-12;
        font-weight: 600;
        padding: $size-6 $size-12;
        border-radius: $size-6;

        &.pending { background: #fff3cd; color: #856404; }
        &.partial { background: #cce5ff; color: #004085; }
        &.filled { background: #d4edda; color: #155724; }
        &.expired, &.cancelled { background: #f8d7da; color: #721c24; }
      }
    }

    .header-meta {
      display: flex;
      flex-wrap: wrap;
      gap: $size-16;

      span {
        display: flex;
        align-items: center;
        gap: $size-6;
        font-size: $size-14;
        color: $color-g-67;

        svg {
          width: $size-14;
          height: $size-14;
        }

        &.expired {
          color: #dc3545;
        }
      }
    }
  }

  .info-cards {
    display: grid;
    grid-template-columns: 1fr;
    gap: $size-16;
    margin-bottom: $size-16;

    @include responsive(tablet) {
      grid-template-columns: repeat(2, 1fr);
    }

    .info-card {
      background: $color-white;
      border-radius: $size-12;
      padding: $size-16;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      h4 {
        font-size: $size-14;
        font-weight: 600;
        color: $color-g-21;
        margin-bottom: $size-12;
        padding-bottom: $size-8;
        border-bottom: 1px solid $color-g-95;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        padding: $size-6 0;

        .label {
          font-size: $size-14;
          color: $color-g-67;
        }

        .value {
          font-size: $size-14;
          color: $color-g-21;
          font-weight: 500;
        }
      }
    }
  }

  .section-card {
    background: $color-white;
    border-radius: $size-12;
    padding: $size-20;
    margin-bottom: $size-16;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    h3 {
      font-size: $size-16;
      font-weight: 600;
      margin-bottom: $size-16;
      padding-bottom: $size-12;
      border-bottom: 1px solid $color-g-95;
    }
  }

  .medications-list {
    display: flex;
    flex-direction: column;
    gap: $size-16;

    .medication-item {
      padding: $size-16;
      background: $color-g-97;
      border-radius: $size-10;

      .med-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: $size-12;

        .med-name {
          h4 {
            font-size: $size-16;
            font-weight: 600;
            color: $color-g-21;
            margin-bottom: $size-2;
          }

          .med-strength {
            font-size: $size-14;
            color: $color-g-67;
          }
        }

        .fill-status {
          font-size: $size-11;
          font-weight: 500;
          padding: $size-4 $size-8;
          border-radius: $size-4;

          &.filled {
            background: #d4edda;
            color: #155724;
          }

          &.unfilled {
            background: #fff3cd;
            color: #856404;
          }
        }
      }

      .med-details {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: $size-8;
        margin-bottom: $size-12;

        @include responsive(tablet) {
          grid-template-columns: repeat(4, 1fr);
        }

        .detail {
          .label {
            display: block;
            font-size: $size-11;
            color: $color-g-67;
          }

          .value {
            display: block;
            font-size: $size-14;
            color: $color-g-21;
            font-weight: 500;
          }
        }
      }

      .med-instructions {
        padding-top: $size-12;
        border-top: 1px solid $color-g-90;

        .label {
          font-size: $size-12;
          color: $color-g-67;
          font-weight: 500;
        }

        p {
          font-size: $size-14;
          color: $color-g-44;
          margin-top: $size-4;
        }
      }

      .fill-action {
        margin-top: $size-12;

        button {
          width: 100%;
        }
      }
    }
  }

  .refill-info {
    display: flex;
    justify-content: space-around;
    padding: $size-16 0;
    border-bottom: 1px solid $color-g-95;
    margin-bottom: $size-16;

    .refill-stat {
      text-align: center;

      .value {
        display: block;
        font-size: $size-24;
        font-weight: 700;
        color: $color-pri;
      }

      .label {
        display: block;
        font-size: $size-12;
        color: $color-g-67;
      }
    }
  }

  .refill-history {
    h4 {
      font-size: $size-14;
      font-weight: 600;
      margin-bottom: $size-12;
    }

    .refill-entry {
      display: flex;
      justify-content: space-between;
      padding: $size-8 0;
      border-bottom: 1px solid $color-g-95;

      &:last-child {
        border-bottom: none;
      }

      .refill-date {
        font-size: $size-14;
        color: $color-g-21;
      }

      .refill-pharmacy {
        font-size: $size-14;
        color: $color-g-67;
      }
    }
  }

  .notes-text {
    font-size: $size-14;
    color: $color-g-44;
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: $size-12;
    padding-top: $size-16;

    button {
      width: 100%;
    }
  }
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: $size-48;
}

@media print {
  .action-buttons {
    display: none;
  }
}
</style>
