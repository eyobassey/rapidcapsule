<template>
  <div class="prescription-details">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">
        <RCIcon name="arrow-left" />
      </button>
      <h1>Prescription Details</h1>
      <button class="menu-btn" v-if="prescription" @click="showMenu = !showMenu">
        <RCIcon name="more-vertical" />
      </button>
    </div>

    <!-- Dropdown Menu -->
    <div class="dropdown-menu" v-if="showMenu">
      <button @click="retryVerification" v-if="canRetry">
        <RCIcon name="refresh" />
        Retry Verification
      </button>
      <button @click="deletePrescription" v-if="canDelete" class="danger">
        <RCIcon name="trash" />
        Delete
      </button>
    </div>

    <!-- Loading State -->
    <div class="loading-state" v-if="loading">
      <div class="spinner"></div>
      <p>Loading prescription...</p>
    </div>

    <!-- Error State -->
    <div class="error-state" v-else-if="error">
      <RCIcon name="alert-circle" class="error-icon" />
      <h3>Failed to load prescription</h3>
      <p>{{ error }}</p>
      <button @click="fetchPrescription">Try Again</button>
    </div>

    <!-- Prescription Content -->
    <div class="prescription-content" v-else-if="prescription">
      <!-- Status Banner -->
      <div class="status-banner" :class="getStatusClass(prescription.verification_status)">
        <div class="status-icon">
          <RCIcon :name="getStatusIcon(prescription.verification_status)" />
        </div>
        <div class="status-info">
          <h3>{{ getStatusLabel(prescription.verification_status) }}</h3>
          <p>{{ getStatusDescription(prescription.verification_status) }}</p>
        </div>
      </div>

      <!-- Image Preview -->
      <div class="image-section">
        <h4>Prescription Image</h4>
        <div class="image-container" @click="showImageModal = true">
          <img
            v-if="prescription.presignedUrl"
            :src="prescription.presignedUrl"
            alt="Prescription"
          />
          <div class="image-overlay">
            <RCIcon name="zoom-in" />
            <span>Tap to enlarge</span>
          </div>
        </div>
      </div>

      <!-- Extracted Information -->
      <div class="info-section" v-if="prescription.ocr_data">
        <h4>Extracted Information</h4>

        <div class="info-card">
          <div class="info-item" v-if="prescription.ocr_data.doctor_name">
            <label>Doctor Name</label>
            <span>Dr. {{ prescription.ocr_data.doctor_name }}</span>
          </div>
          <div class="info-item" v-if="prescription.ocr_data.clinic_name">
            <label>Clinic/Hospital</label>
            <span>{{ prescription.ocr_data.clinic_name }}</span>
          </div>
          <div class="info-item" v-if="prescription.ocr_data.clinic_address">
            <label>Address</label>
            <span>{{ prescription.ocr_data.clinic_address }}</span>
          </div>
          <div class="info-item" v-if="prescription.ocr_data.doctor_license">
            <label>License Number</label>
            <span>{{ prescription.ocr_data.doctor_license }}</span>
          </div>
          <div class="info-item" v-if="prescription.ocr_data.prescription_date">
            <label>Prescription Date</label>
            <span>{{ formatDate(prescription.ocr_data.prescription_date) }}</span>
          </div>
          <div class="info-item" v-if="prescription.ocr_data.confidence">
            <label>OCR Confidence</label>
            <span>{{ prescription.ocr_data.confidence.toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- Medications -->
      <div class="medications-section" v-if="prescription.ocr_data?.medications?.length">
        <h4>Medications</h4>
        <div class="medications-list">
          <div
            v-for="(med, index) in prescription.ocr_data.medications"
            :key="index"
            class="medication-item"
          >
            <div class="med-header">
              <span class="med-name">{{ med.name }}</span>
              <span class="med-dosage" v-if="med.dosage">{{ med.dosage }}</span>
            </div>
            <div class="med-details">
              <span v-if="med.quantity">Qty: {{ med.quantity }}</span>
              <span v-if="med.instructions">{{ med.instructions }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Verification Details -->
      <div class="verification-section" v-if="verification">
        <h4>Verification Details</h4>
        <div class="verification-card">
          <div class="verification-scores">
            <div class="score-item">
              <span class="score-value">{{ verification.overallScore || 0 }}%</span>
              <span class="score-label">Overall Score</span>
            </div>
            <div class="score-item">
              <span class="score-value">{{ verification.confidenceScore || 0 }}%</span>
              <span class="score-label">Confidence</span>
            </div>
            <div class="score-item" v-if="verification.fraudDetection">
              <span
                class="score-value"
                :class="{ danger: verification.fraudDetection.score > 50 }"
              >
                {{ verification.fraudDetection.riskLevel }}
              </span>
              <span class="score-label">Risk Level</span>
            </div>
          </div>

          <div class="tier-results">
            <div class="tier-item">
              <span class="tier-name">Tier 1 (Initial Checks)</span>
              <span class="tier-status" :class="getTierStatusClass(verification.tier1?.result)">
                {{ verification.tier1?.result || 'PENDING' }}
              </span>
            </div>
            <div class="tier-item">
              <span class="tier-name">Tier 2 (AI Analysis)</span>
              <span class="tier-status" :class="getTierStatusClass(verification.tier2?.result)">
                {{ verification.tier2?.result || 'PENDING' }}
              </span>
            </div>
            <div class="tier-item" v-if="verification.pharmacistReview?.status !== 'NOT_REQUIRED'">
              <span class="tier-name">Pharmacist Review</span>
              <span class="tier-status" :class="getReviewStatusClass(verification.pharmacistReview?.result)">
                {{ verification.pharmacistReview?.result || 'PENDING' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Validity Period -->
      <div class="validity-section" v-if="prescription.valid_from || prescription.valid_until">
        <h4>Validity</h4>
        <div class="validity-card">
          <div class="validity-item" v-if="prescription.valid_from">
            <label>Valid From</label>
            <span>{{ formatDate(prescription.valid_from) }}</span>
          </div>
          <div class="validity-item" v-if="prescription.valid_until">
            <label>Valid Until</label>
            <span :class="{ expired: isExpired(prescription.valid_until) }">
              {{ formatDate(prescription.valid_until) }}
              <span v-if="isExpired(prescription.valid_until)">(Expired)</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Usage History -->
      <div class="usage-section" v-if="prescription.used_in_orders?.length">
        <h4>Usage History</h4>
        <p class="usage-count">
          Used {{ prescription.usage_count }} of {{ prescription.max_usage || 'unlimited' }} times
        </p>
        <div class="orders-list">
          <div
            v-for="orderId in prescription.used_in_orders"
            :key="orderId"
            class="order-item"
            @click="viewOrder(orderId)"
          >
            <RCIcon name="shopping-bag" />
            <span>Order #{{ orderId.slice(-8) }}</span>
            <RCIcon name="chevron-right" />
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-section" v-if="prescription.verification_status === 'APPROVED'">
        <button class="primary-btn" @click="$router.push('/pharmacy')">
          <RCIcon name="shopping-bag" />
          Use for Purchase
        </button>
      </div>
    </div>

    <!-- Image Modal -->
    <div class="image-modal" v-if="showImageModal" @click="showImageModal = false">
      <img :src="prescription?.presignedUrl" alt="Prescription Full" />
      <button class="close-btn" @click.stop="showImageModal = false">
        <RCIcon name="close" />
      </button>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import axios from "@/services/http";

export default defineComponent({
  name: "PrescriptionDetails",
  components: { RCIcon },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const prescription = ref(null);
    const verification = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const showMenu = ref(false);
    const showImageModal = ref(false);

    const canRetry = computed(() => {
      const status = prescription.value?.verification_status;
      return ["TIER1_FAILED", "TIER2_FAILED", "REJECTED"].includes(status);
    });

    const canDelete = computed(() => {
      const status = prescription.value?.verification_status;
      return (
        !prescription.value?.used_in_orders?.length &&
        ["PENDING", "TIER1_FAILED", "TIER2_FAILED", "REJECTED"].includes(status)
      );
    });

    const fetchPrescription = async () => {
      loading.value = true;
      error.value = null;

      try {
        const prescriptionId = route.params.id;
        const response = await axios.get(
          `/pharmacy/prescriptions/${prescriptionId}`
        );

        if (response.data.success) {
          prescription.value = response.data.data;

          // Fetch verification details
          const verificationRes = await axios.get(
            `/pharmacy/prescriptions/${prescriptionId}/verification`
          );
          if (verificationRes.data.success) {
            verification.value = verificationRes.data.data.verification;
          }
        } else {
          throw new Error(response.data.message);
        }
      } catch (err) {
        error.value = err.response?.data?.message || err.message || "Failed to load";
      } finally {
        loading.value = false;
      }
    };

    const retryVerification = async () => {
      showMenu.value = false;
      try {
        const response = await axios.post(
          `/pharmacy/prescriptions/${route.params.id}/retry-verification`
        );
        if (response.data.success) {
          await fetchPrescription();
        }
      } catch (err) {
        console.error("Retry failed:", err);
      }
    };

    const deletePrescription = async () => {
      showMenu.value = false;
      if (!confirm("Are you sure you want to delete this prescription?")) return;

      try {
        const response = await axios.delete(
          `/pharmacy/prescriptions/${route.params.id}`
        );
        if (response.data.success) {
          router.push("/pharmacy/my-prescriptions");
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    };

    const viewOrder = (orderId) => {
      router.push(`/pharmacy/orders/${orderId}`);
    };

    const formatDate = (dateString) => {
      if (!dateString) return "";
      return new Date(dateString).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    };

    const isExpired = (dateString) => {
      return new Date(dateString) < new Date();
    };

    const getStatusClass = (status) => {
      switch (status) {
        case "APPROVED":
          return "approved";
        case "REJECTED":
          return "rejected";
        case "PHARMACIST_REVIEW":
          return "review";
        default:
          return "pending";
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case "APPROVED":
          return "check-circle";
        case "REJECTED":
          return "x-circle";
        case "PHARMACIST_REVIEW":
          return "user";
        default:
          return "clock";
      }
    };

    const getStatusLabel = (status) => {
      switch (status) {
        case "APPROVED":
          return "Verified & Approved";
        case "REJECTED":
          return "Verification Failed";
        case "PHARMACIST_REVIEW":
          return "Under Review";
        case "TIER1_PROCESSING":
        case "TIER2_PROCESSING":
          return "Processing";
        default:
          return "Pending Verification";
      }
    };

    const getStatusDescription = (status) => {
      switch (status) {
        case "APPROVED":
          return "Your prescription has been verified and can be used for purchases";
        case "REJECTED":
          return "The prescription could not be verified. Please upload a clearer image.";
        case "PHARMACIST_REVIEW":
          return "A pharmacist is reviewing your prescription";
        default:
          return "Your prescription is being verified by our AI system";
      }
    };

    const getTierStatusClass = (result) => {
      switch (result) {
        case "PASSED":
          return "passed";
        case "FAILED":
          return "failed";
        case "NEEDS_REVIEW":
          return "review";
        default:
          return "pending";
      }
    };

    const getReviewStatusClass = (result) => {
      switch (result) {
        case "APPROVED":
          return "passed";
        case "REJECTED":
          return "failed";
        case "NEEDS_CLARIFICATION":
          return "review";
        default:
          return "pending";
      }
    };

    onMounted(() => {
      fetchPrescription();
    });

    return {
      prescription,
      verification,
      loading,
      error,
      showMenu,
      showImageModal,
      canRetry,
      canDelete,
      fetchPrescription,
      retryVerification,
      deletePrescription,
      viewOrder,
      formatDate,
      isExpired,
      getStatusClass,
      getStatusIcon,
      getStatusLabel,
      getStatusDescription,
      getTierStatusClass,
      getReviewStatusClass,
    };
  },
});
</script>

<style scoped lang="scss">
.prescription-details {
  min-height: 100vh;
  background: $color-g-95;
  padding-bottom: $size-24;
}

.page-header {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-16;
  background: $color-white;
  border-bottom: 1px solid $color-g-85;
  position: sticky;
  top: 0;
  z-index: 10;

  .back-btn,
  .menu-btn {
    width: $size-40;
    height: $size-40;
    border-radius: 50%;
    border: none;
    background: $color-g-95;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    svg {
      width: $size-20;
      height: $size-20;
      color: $color-g-21;
    }
  }

  h1 {
    flex: 1;
    font-size: $size-18;
    font-weight: 600;
    color: $color-g-21;
  }
}

.dropdown-menu {
  position: fixed;
  top: $size-64;
  right: $size-16;
  background: $color-white;
  border-radius: $size-12;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 20;
  overflow: hidden;

  button {
    display: flex;
    align-items: center;
    gap: $size-12;
    width: 100%;
    padding: $size-14 $size-20;
    border: none;
    background: none;
    font-size: $size-14;
    color: $color-g-21;
    cursor: pointer;

    &:hover {
      background: $color-g-95;
    }

    &.danger {
      color: $color-denote-red;
    }

    svg {
      width: $size-18;
      height: $size-18;
    }
  }
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $size-64;
  text-align: center;

  .spinner {
    width: $size-40;
    height: $size-40;
    border: 3px solid $color-g-85;
    border-top-color: $color-pri;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .error-icon {
    width: $size-48;
    height: $size-48;
    color: $color-denote-red;
    margin-bottom: $size-16;
  }

  h3 {
    font-size: $size-18;
    font-weight: 600;
    color: $color-g-21;
    margin-bottom: $size-8;
  }

  p {
    font-size: $size-14;
    color: $color-g-67;
    margin-bottom: $size-16;
  }

  button {
    padding: $size-12 $size-24;
    background: $color-pri;
    color: white;
    border: none;
    border-radius: $size-8;
    font-size: $size-14;
    cursor: pointer;
  }
}

.prescription-content {
  padding: $size-16;
}

.status-banner {
  display: flex;
  align-items: center;
  gap: $size-16;
  padding: $size-16;
  border-radius: $size-12;
  margin-bottom: $size-16;

  &.approved {
    background: rgba($color-denote-green, 0.1);

    .status-icon {
      background: $color-denote-green;
    }
  }

  &.rejected {
    background: rgba($color-denote-red, 0.1);

    .status-icon {
      background: $color-denote-red;
    }
  }

  &.review {
    background: rgba($color-pri, 0.1);

    .status-icon {
      background: $color-pri;
    }
  }

  &.pending {
    background: rgba($color-denote-yellow, 0.1);

    .status-icon {
      background: $color-denote-yellow;
    }
  }

  .status-icon {
    width: $size-48;
    height: $size-48;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: $size-24;
      height: $size-24;
      color: white;
    }
  }

  .status-info {
    flex: 1;

    h3 {
      font-size: $size-16;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    p {
      font-size: $size-14;
      color: $color-g-44;
    }
  }
}

.image-section,
.info-section,
.medications-section,
.verification-section,
.validity-section,
.usage-section,
.action-section {
  margin-bottom: $size-16;

  h4 {
    font-size: $size-14;
    font-weight: 600;
    color: $color-g-44;
    margin-bottom: $size-12;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.image-container {
  position: relative;
  background: $color-white;
  border-radius: $size-12;
  overflow: hidden;
  cursor: pointer;

  img {
    width: 100%;
    max-height: 300px;
    object-fit: contain;
  }

  .image-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: $size-12;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-8;
    color: white;
    font-size: $size-14;

    svg {
      width: $size-18;
      height: $size-18;
    }
  }
}

.info-card,
.validity-card {
  background: $color-white;
  border-radius: $size-12;
  padding: $size-16;

  .info-item,
  .validity-item {
    display: flex;
    justify-content: space-between;
    padding: $size-10 0;
    border-bottom: 1px solid $color-g-95;

    &:last-child {
      border-bottom: none;
    }

    label {
      font-size: $size-14;
      color: $color-g-67;
    }

    span {
      font-size: $size-14;
      font-weight: 500;
      color: $color-g-21;

      &.expired {
        color: $color-denote-red;
      }
    }
  }
}

.medications-list {
  background: $color-white;
  border-radius: $size-12;
  overflow: hidden;

  .medication-item {
    padding: $size-16;
    border-bottom: 1px solid $color-g-95;

    &:last-child {
      border-bottom: none;
    }

    .med-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: $size-4;

      .med-name {
        font-size: $size-14;
        font-weight: 600;
        color: $color-g-21;
      }

      .med-dosage {
        font-size: $size-14;
        color: $color-pri;
      }
    }

    .med-details {
      font-size: $size-12;
      color: $color-g-67;
      display: flex;
      gap: $size-16;
    }
  }
}

.verification-card {
  background: $color-white;
  border-radius: $size-12;
  overflow: hidden;

  .verification-scores {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-bottom: 1px solid $color-g-95;

    .score-item {
      padding: $size-16;
      text-align: center;
      border-right: 1px solid $color-g-95;

      &:last-child {
        border-right: none;
      }

      .score-value {
        display: block;
        font-size: $size-20;
        font-weight: 700;
        color: $color-pri;
        margin-bottom: $size-4;

        &.danger {
          color: $color-denote-red;
        }
      }

      .score-label {
        font-size: $size-12;
        color: $color-g-67;
      }
    }
  }

  .tier-results {
    padding: $size-16;

    .tier-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $size-8 0;

      .tier-name {
        font-size: $size-14;
        color: $color-g-44;
      }

      .tier-status {
        font-size: $size-12;
        font-weight: 600;
        padding: $size-4 $size-10;
        border-radius: $size-4;

        &.passed {
          background: rgba($color-denote-green, 0.1);
          color: $color-denote-green;
        }

        &.failed {
          background: rgba($color-denote-red, 0.1);
          color: $color-denote-red;
        }

        &.review {
          background: rgba($color-denote-yellow, 0.1);
          color: $color-denote-yellow;
        }

        &.pending {
          background: $color-g-95;
          color: $color-g-67;
        }
      }
    }
  }
}

.usage-count {
  font-size: $size-14;
  color: $color-g-44;
  margin-bottom: $size-12;
}

.orders-list {
  background: $color-white;
  border-radius: $size-12;

  .order-item {
    display: flex;
    align-items: center;
    gap: $size-12;
    padding: $size-14 $size-16;
    border-bottom: 1px solid $color-g-95;
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    svg {
      width: $size-18;
      height: $size-18;
      color: $color-g-67;
    }

    span {
      flex: 1;
      font-size: $size-14;
      color: $color-g-21;
    }
  }
}

.action-section {
  .primary-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-8;
    padding: $size-16;
    background: $color-pri;
    color: white;
    border: none;
    border-radius: $size-12;
    font-size: $size-16;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: darken($color-pri, 10%);
    }

    svg {
      width: $size-20;
      height: $size-20;
    }
  }
}

.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    max-width: 100%;
    max-height: 90vh;
    object-fit: contain;
  }

  .close-btn {
    position: absolute;
    top: $size-16;
    right: $size-16;
    width: $size-44;
    height: $size-44;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    svg {
      width: $size-24;
      height: $size-24;
      color: white;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
