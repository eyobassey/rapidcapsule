<template>
  <div class="page-content">
    <top-bar
      type="title-only"
      title="WhatsApp Prescriptions"
      @open-side-nav="$emit('openSideNav')"
    />

    <div class="page-content__body">
      <!-- WhatsApp Not Linked Banner -->
      <div v-if="!isWhatsAppLinked" class="link-banner">
        <div class="banner-content">
          <div class="banner-icon">
            <img src="@/assets/icons/whatsapp.svg" alt="WhatsApp" class="icon" />
          </div>
          <div class="banner-text">
            <h3>Link Your WhatsApp</h3>
            <p>Connect your WhatsApp to submit prescriptions via photo and chat with pharmacists.</p>
          </div>
          <button class="btn btn-primary" @click="openLinkModal">
            Link WhatsApp
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loader-container" v-if="loading">
        <Loader :useOverlay="false" :rounded="true" />
      </div>

      <!-- Main Content -->
      <div v-else-if="isWhatsAppLinked" class="prescriptions-container">
        <!-- WhatsApp Info Card -->
        <div class="whatsapp-info-card">
          <div class="info-header">
            <div class="whatsapp-badge">
              <img src="@/assets/icons/whatsapp.svg" alt="WhatsApp" class="badge-icon" />
              <span>{{ linkedNumber }}</span>
            </div>
            <span class="status-active">Active</span>
          </div>
          <div class="info-stats">
            <div class="stat">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">Total Submitted</span>
            </div>
            <div class="stat">
              <span class="stat-value stat-value--warning">{{ stats.pending }}</span>
              <span class="stat-label">Under Review</span>
            </div>
            <div class="stat">
              <span class="stat-value stat-value--success">{{ stats.approved }}</span>
              <span class="stat-label">Approved</span>
            </div>
            <div class="stat">
              <span class="stat-value stat-value--info">{{ stats.inProgress }}</span>
              <span class="stat-label">In Progress</span>
            </div>
          </div>
        </div>

        <!-- How It Works Section -->
        <div class="how-it-works" v-if="prescriptions.length === 0">
          <h3>How to Submit Prescriptions via WhatsApp</h3>
          <div class="steps">
            <div class="step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>Open WhatsApp</h4>
                <p>Send a message to our pharmacy number</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>Take a Photo</h4>
                <p>Capture a clear image of your prescription</p>
              </div>
            </div>
            <div class="step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>Send & Wait</h4>
                <p>Our pharmacist will review and process your order</p>
              </div>
            </div>
          </div>
          <div class="whatsapp-cta">
            <p>Ready to send a prescription?</p>
            <a :href="whatsappLink" target="_blank" class="btn btn-whatsapp">
              <img src="@/assets/icons/whatsapp.svg" alt="WhatsApp" class="btn-icon" />
              Open WhatsApp
            </a>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-section" v-if="prescriptions.length > 0">
          <div class="filter-tabs">
            <button
              v-for="tab in statusTabs"
              :key="tab.value"
              :class="['filter-tab', { active: activeTab === tab.value }]"
              @click="setStatusFilter(tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>
        </div>

        <!-- Prescriptions List -->
        <div class="results-section" v-if="filteredPrescriptions.length > 0">
          <div class="prescriptions-list">
            <div
              v-for="prescription in filteredPrescriptions"
              :key="prescription._id"
              class="prescription-card"
              @click="viewPrescription(prescription)"
            >
              <div class="prescription-card__header">
                <div class="prescription-info">
                  <span class="prescription-number">
                    #{{ prescription._id?.slice(-8).toUpperCase() }}
                  </span>
                  <span :class="['status', `status--${prescription.status?.toLowerCase()}`]">
                    {{ formatStatus(prescription.status) }}
                  </span>
                </div>
                <span class="prescription-date">{{ formatDate(prescription.created_at) }}</span>
              </div>

              <div class="prescription-card__content">
                <div class="prescription-image" v-if="prescription.image_url">
                  <img :src="prescription.image_url" alt="Prescription" />
                </div>
                <div class="prescription-details">
                  <div class="detail-row" v-if="prescription.queue_type">
                    <span class="label">Type:</span>
                    <span class="value">{{ formatQueueType(prescription.queue_type) }}</span>
                  </div>
                  <div class="detail-row" v-if="prescription.ocr_data?.medications?.length">
                    <span class="label">Medications:</span>
                    <span class="value">{{ prescription.ocr_data.medications.length }} item(s)</span>
                  </div>
                  <div class="detail-row" v-if="prescription.priority">
                    <span class="label">Priority:</span>
                    <span :class="['priority-badge', `priority--${prescription.priority?.toLowerCase()}`]">
                      {{ prescription.priority }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Medications Preview -->
              <div class="prescription-card__medications" v-if="prescription.ocr_data?.medications?.length">
                <div class="medications-list">
                  <span
                    v-for="(med, index) in prescription.ocr_data.medications.slice(0, 3)"
                    :key="index"
                    class="med-tag"
                  >
                    {{ med.name || med.drug_name }}
                  </span>
                  <span v-if="prescription.ocr_data.medications.length > 3" class="more-meds">
                    +{{ prescription.ocr_data.medications.length - 3 }} more
                  </span>
                </div>
              </div>

              <div class="prescription-card__footer">
                <div class="source-info">
                  <span class="source-badge whatsapp">
                    <img src="@/assets/icons/whatsapp.svg" alt="WhatsApp" class="source-icon" />
                    WhatsApp
                  </span>
                </div>
                <div class="view-link">
                  View Details
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="prescriptions.length > 0" class="empty-state">
          <div class="empty-icon">
            <rc-icon icon-name="prescription" size="xl" />
          </div>
          <h3>No prescriptions match your filter</h3>
          <p>Try selecting a different status filter</p>
        </div>

        <!-- First Time Empty State -->
        <div v-else class="empty-state first-time">
          <div class="empty-icon whatsapp">
            <img src="@/assets/icons/whatsapp.svg" alt="WhatsApp" class="icon" />
          </div>
          <h3>No WhatsApp Prescriptions Yet</h3>
          <p>Send a photo of your prescription via WhatsApp to get started</p>
          <a :href="whatsappLink" target="_blank" class="btn btn-whatsapp">
            <img src="@/assets/icons/whatsapp.svg" alt="WhatsApp" class="btn-icon" />
            Send Prescription
          </a>
        </div>
      </div>

      <!-- WhatsApp Link Modal -->
      <WhatsAppLinkModal
        v-if="showLinkModal"
        @close="closeLinkModal"
        @linked="onLinked"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import moment from "moment";
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader.vue";
import RcIcon from "@/components/RCIcon";
import WhatsAppLinkModal from "@/components/Account/WhatsAppLinkModal.vue";

export default {
  name: "WhatsAppPrescriptions",
  components: {
    TopBar,
    Loader,
    RcIcon,
    WhatsAppLinkModal,
  },
  emits: ["openSideNav"],

  setup() {
    const store = useStore();
    const router = useRouter();

    const showLinkModal = ref(false);
    const activeTab = ref("all");

    const statusTabs = [
      { label: "All", value: "all" },
      { label: "Under Review", value: "pending" },
      { label: "Approved", value: "approved" },
      { label: "In Progress", value: "in_progress" },
      { label: "Completed", value: "completed" },
    ];

    const loading = computed(() => store.getters["whatsapp/isLoading"]);
    const isWhatsAppLinked = computed(() => store.getters["whatsapp/isLinked"]);
    const linkedNumber = computed(() => store.getters["whatsapp/linkedNumber"]);
    const prescriptions = computed(() => store.getters["whatsapp/prescriptionList"]);

    const stats = computed(() => {
      const items = prescriptions.value || [];
      return {
        total: items.length,
        pending: items.filter(p =>
          ["PENDING", "OCR_REVIEW", "MANUAL_ENTRY", "VERIFICATION_FAILED"].includes(p.status)
        ).length,
        approved: items.filter(p => p.status === "APPROVED" || p.status === "COMPLETED").length,
        inProgress: items.filter(p =>
          ["IN_PROGRESS", "PROCESSING", "DISPENSED", "SHIPPED"].includes(p.status)
        ).length,
      };
    });

    const filteredPrescriptions = computed(() => {
      let result = [...prescriptions.value];

      if (activeTab.value === "pending") {
        result = result.filter(p =>
          ["PENDING", "OCR_REVIEW", "MANUAL_ENTRY", "VERIFICATION_FAILED"].includes(p.status)
        );
      } else if (activeTab.value === "approved") {
        result = result.filter(p => p.status === "APPROVED");
      } else if (activeTab.value === "in_progress") {
        result = result.filter(p =>
          ["IN_PROGRESS", "PROCESSING", "DISPENSED", "SHIPPED"].includes(p.status)
        );
      } else if (activeTab.value === "completed") {
        result = result.filter(p => p.status === "COMPLETED");
      }

      // Sort by date (newest first)
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return result;
    });

    const whatsappLink = computed(() => {
      // Replace with your pharmacy WhatsApp number
      const phoneNumber = "2348000000000"; // Example number
      const message = encodeURIComponent("Hi, I would like to submit a prescription");
      return `https://wa.me/${phoneNumber}?text=${message}`;
    });

    const fetchData = async () => {
      await store.dispatch("whatsapp/fetchStatus");
      if (isWhatsAppLinked.value) {
        await store.dispatch("whatsapp/fetchPrescriptions");
      }
    };

    const openLinkModal = () => {
      showLinkModal.value = true;
    };

    const closeLinkModal = () => {
      showLinkModal.value = false;
    };

    const onLinked = () => {
      fetchData();
    };

    const setStatusFilter = (status) => {
      activeTab.value = status;
    };

    const viewPrescription = (prescription) => {
      router.push(`/app/patient/prescriptions/whatsapp/${prescription._id}`);
    };

    const formatDate = (date) => {
      if (!date) return "";
      return moment(date).format("MMM D, YYYY h:mm A");
    };

    const formatStatus = (status) => {
      if (!status) return "Pending";
      const statusMap = {
        PENDING: "Pending Review",
        OCR_REVIEW: "Under Review",
        MANUAL_ENTRY: "Processing",
        VERIFICATION_FAILED: "Needs Attention",
        IN_PROGRESS: "In Progress",
        APPROVED: "Approved",
        COMPLETED: "Completed",
        REJECTED: "Rejected",
        EXPIRED: "Expired",
      };
      return statusMap[status] || status.replace(/_/g, " ");
    };

    const formatQueueType = (type) => {
      if (!type) return "Standard";
      const typeMap = {
        OCR_REVIEW: "Auto-Scanned",
        MANUAL_ENTRY: "Manual Review",
        CONTROLLED_SUBSTANCE: "Controlled",
        VERIFICATION_FAILED: "Needs Verification",
        PHARMACIST_ESCALATION: "Escalated",
        CLARIFICATION_RESPONSE: "Clarification",
      };
      return typeMap[type] || type.replace(/_/g, " ");
    };

    onMounted(() => {
      fetchData();
    });

    return {
      showLinkModal,
      activeTab,
      statusTabs,
      loading,
      isWhatsAppLinked,
      linkedNumber,
      prescriptions,
      stats,
      filteredPrescriptions,
      whatsappLink,
      openLinkModal,
      closeLinkModal,
      onLinked,
      setStatusFilter,
      viewPrescription,
      formatDate,
      formatStatus,
      formatQueueType,
    };
  },
};
</script>

<style scoped lang="scss">
.page-content {
  @include flexItem(vertical) {
    gap: $size-12;
    flex-grow: 1;
    max-width: 82.67rem;
    height: 100vh;
  }

  &__body {
    @include flexItem(vertical) {
      gap: $size-24;
      overflow-y: auto;
      padding: $size-12 $size-48 $size-24 $size-48;
      margin-left: $size-8;
      margin-right: $size-8;

      @include scrollBar(normal);

      @include responsive(tab-landscape) {
        padding-left: $size-32;
        padding-right: $size-32;
        margin: 0;
      }

      @include responsive(phone) {
        padding: $size-12 $size-16 $size-24 $size-16;
        margin: 0;
      }
    }
  }
}

.link-banner {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  border-radius: $size-16;
  padding: $size-24;
  margin-bottom: $size-24;

  .banner-content {
    display: flex;
    align-items: center;
    gap: $size-20;

    @include responsive(phone) {
      flex-direction: column;
      text-align: center;
    }
  }

  .banner-icon {
    width: 64px;
    height: 64px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .icon {
      width: 36px;
      height: 36px;
      filter: brightness(0) invert(1);
    }
  }

  .banner-text {
    flex: 1;

    h3 {
      color: white;
      font-size: $size-20;
      font-weight: $fw-semi-bold;
      margin-bottom: $size-4;
    }

    p {
      color: rgba(255, 255, 255, 0.9);
      font-size: $size-14;
    }
  }
}

.loader-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.prescriptions-container {
  width: 100%;
}

.whatsapp-info-card {
  background: white;
  border-radius: $size-16;
  padding: $size-24;
  margin-bottom: $size-24;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $size-20;
  }

  .whatsapp-badge {
    display: flex;
    align-items: center;
    gap: $size-8;
    background: #25D366;
    color: white;
    padding: $size-8 $size-16;
    border-radius: $size-24;
    font-weight: $fw-medium;

    .badge-icon {
      width: 20px;
      height: 20px;
      filter: brightness(0) invert(1);
    }
  }

  .status-active {
    color: #059669;
    font-weight: $fw-medium;
    font-size: $size-14;
  }

  .info-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $size-16;

    @include responsive(phone) {
      grid-template-columns: repeat(2, 1fr);
    }

    .stat {
      text-align: center;
      padding: $size-12;
      background: $color-g-97;
      border-radius: $size-8;

      .stat-value {
        display: block;
        font-size: $size-24;
        font-weight: $fw-bold;
        color: $color-g-21;

        &--warning {
          color: #d97706;
        }

        &--success {
          color: #059669;
        }

        &--info {
          color: #2563eb;
        }
      }

      .stat-label {
        font-size: $size-12;
        color: $color-g-54;
      }
    }
  }
}

.how-it-works {
  background: white;
  border-radius: $size-16;
  padding: $size-32;
  margin-bottom: $size-24;
  text-align: center;

  h3 {
    font-size: $size-20;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-32;
  }

  .steps {
    display: flex;
    justify-content: center;
    gap: $size-32;
    margin-bottom: $size-32;

    @include responsive(phone) {
      flex-direction: column;
      gap: $size-24;
    }
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 200px;

    .step-number {
      width: 48px;
      height: 48px;
      background: #25D366;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: $size-20;
      font-weight: $fw-bold;
      margin-bottom: $size-12;
    }

    .step-content {
      h4 {
        font-size: $size-16;
        font-weight: $fw-semi-bold;
        color: $color-g-21;
        margin-bottom: $size-4;
      }

      p {
        font-size: $size-14;
        color: $color-g-54;
      }
    }
  }

  .whatsapp-cta {
    padding-top: $size-24;
    border-top: 1px solid $color-g-92;

    p {
      font-size: $size-16;
      color: $color-g-44;
      margin-bottom: $size-16;
    }
  }
}

.filters-section {
  margin-bottom: $size-20;
}

.filter-tabs {
  display: flex;
  gap: $size-8;
  overflow-x: auto;
  padding-bottom: $size-4;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: $color-g-85;
    border-radius: 2px;
  }
}

.filter-tab {
  padding: $size-8 $size-16;
  border-radius: $size-20;
  border: 1px solid $color-g-85;
  background: white;
  font-size: $size-12;
  font-weight: $fw-medium;
  color: $color-g-44;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    border-color: #25D366;
    color: #25D366;
  }

  &.active {
    background: #25D366;
    border-color: #25D366;
    color: white;
  }
}

.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.prescription-card {
  background: white;
  padding: $size-20;
  border-radius: $size-12;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-16;

    .prescription-info {
      display: flex;
      align-items: center;
      gap: $size-12;

      .prescription-number {
        font-size: $size-16;
        font-weight: $fw-semi-bold;
        color: $color-g-21;
      }
    }

    .prescription-date {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  &__content {
    display: flex;
    gap: $size-16;
    margin-bottom: $size-16;

    .prescription-image {
      width: 80px;
      height: 80px;
      border-radius: $size-8;
      overflow: hidden;
      flex-shrink: 0;
      background: $color-g-95;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .prescription-details {
      flex: 1;

      .detail-row {
        display: flex;
        gap: $size-8;
        margin-bottom: $size-4;

        .label {
          font-size: $size-13;
          color: $color-g-54;
        }

        .value {
          font-size: $size-13;
          color: $color-g-21;
          font-weight: $fw-medium;
        }
      }
    }
  }

  &__medications {
    margin-bottom: $size-16;

    .medications-list {
      display: flex;
      flex-wrap: wrap;
      gap: $size-6;
    }

    .med-tag {
      font-size: $size-12;
      padding: $size-4 $size-10;
      background: $color-g-95;
      border-radius: $size-12;
      color: $color-g-44;
    }

    .more-meds {
      font-size: $size-12;
      padding: $size-4 $size-10;
      background: $color-g-90;
      border-radius: $size-12;
      color: $color-g-54;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $size-12;
    border-top: 1px solid $color-g-92;

    .source-badge {
      display: inline-flex;
      align-items: center;
      gap: $size-6;
      font-size: $size-11;
      padding: $size-3 $size-10;
      border-radius: $size-8;
      font-weight: $fw-medium;

      &.whatsapp {
        background: rgba(#25D366, 0.1);
        color: #128C7E;

        .source-icon {
          width: 14px;
          height: 14px;
        }
      }
    }

    .view-link {
      font-size: $size-14;
      color: #25D366;
      font-weight: $fw-medium;
    }
  }
}

.status {
  font-size: $size-11;
  padding: $size-4 $size-10;
  border-radius: $size-12;
  font-weight: $fw-medium;

  &--pending,
  &--ocr_review,
  &--manual_entry {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--in_progress,
  &--processing {
    background: rgba(#3b82f6, 0.1);
    color: #2563eb;
  }

  &--approved,
  &--completed {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--verification_failed,
  &--rejected {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }
}

.priority-badge {
  font-size: $size-11;
  padding: $size-2 $size-8;
  border-radius: $size-8;
  font-weight: $fw-medium;

  &.priority--urgent {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }

  &.priority--high {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &.priority--normal {
    background: rgba(#3b82f6, 0.1);
    color: #2563eb;
  }

  &.priority--low {
    background: $color-g-90;
    color: $color-g-54;
  }
}

.empty-state {
  text-align: center;
  padding: $size-64 $size-24;
  color: $color-g-54;

  .empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto $size-16;
    background: $color-g-95;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &.whatsapp {
      background: rgba(#25D366, 0.1);

      .icon {
        width: 40px;
        height: 40px;
      }
    }
  }

  h3 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-44;
    margin-bottom: $size-8;
  }

  p {
    font-size: $size-15;
    margin-bottom: $size-20;
  }
}

.btn {
  padding: $size-12 $size-20;
  border-radius: $size-8;
  font-size: $size-14;
  font-weight: $fw-medium;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: $size-8;
  text-decoration: none;

  &-primary {
    background: white;
    color: #25D366;

    &:hover {
      background: rgba(255, 255, 255, 0.9);
    }
  }

  &-whatsapp {
    background: #25D366;
    color: white;

    &:hover {
      background: #128C7E;
    }

    .btn-icon {
      width: 20px;
      height: 20px;
      filter: brightness(0) invert(1);
    }
  }
}
</style>
