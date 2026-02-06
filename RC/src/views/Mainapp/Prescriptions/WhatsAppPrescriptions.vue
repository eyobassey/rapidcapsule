<template>
  <div class="whatsapp-prescriptions-page">
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
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="co-whatsapp" scale="1.2" class="spinner-icon" />
        </div>
        <p>Loading WhatsApp prescriptions...</p>
      </div>

      <template v-else>
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero__content">
            <button class="back-link desktop-only" @click="$router.push('/app/patient/prescriptions')">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Prescriptions</span>
            </button>
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="co-whatsapp" />
              <span>WhatsApp Channel</span>
            </div>
            <h1 class="hero__title">
              WhatsApp<br/>
              <span class="hero__title-accent">Prescriptions</span>
            </h1>
            <p class="hero__subtitle">
              Submit prescriptions via WhatsApp and chat with pharmacists for quick processing.
            </p>
            <div class="hero__stats" v-if="isWhatsAppLinked">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ stats.total }}</span>
                <span class="hero-stat__label">Total</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--warning">{{ stats.pending }}</span>
                <span class="hero-stat__label">Review</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--info">{{ stats.inProgress }}</span>
                <span class="hero-stat__label">Progress</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--success">{{ stats.approved }}</span>
                <span class="hero-stat__label">Done</span>
              </div>
            </div>
          </div>
          <div class="hero__visual">
            <div class="whatsapp-orb">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="co-whatsapp" />
              </div>
            </div>
            <div class="floating-icons">
              <div class="float-icon float-icon--1"><v-icon name="hi-camera" /></div>
              <div class="float-icon float-icon--2"><v-icon name="hi-chat-alt-2" /></div>
              <div class="float-icon float-icon--3"><v-icon name="ri-capsule-line" /></div>
            </div>
          </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
          <!-- WhatsApp Not Linked Banner -->
          <div v-if="!isWhatsAppLinked" class="bento-card link-card">
            <div class="link-content">
              <div class="link-icon">
                <v-icon name="co-whatsapp" scale="2" />
              </div>
              <div class="link-text">
                <h3>Link Your WhatsApp</h3>
                <p>Connect your WhatsApp number to submit prescriptions via photo and chat with pharmacists directly.</p>
              </div>
              <button class="btn-link-whatsapp" @click="openLinkModal">
                <v-icon name="hi-link" scale="0.9" />
                <span>Link WhatsApp</span>
              </button>
            </div>
          </div>

          <!-- Quick Actions Card -->
          <div v-if="isWhatsAppLinked" class="bento-card actions-card">
            <div class="card-header">
              <h3>Quick Actions</h3>
              <span class="linked-badge">
                <v-icon name="hi-check-circle" scale="0.8" />
                {{ linkedNumber }}
              </span>
            </div>
            <div class="actions-row">
              <a :href="whatsappLink" target="_blank" class="action-btn primary">
                <div class="action-icon whatsapp">
                  <v-icon name="co-whatsapp" scale="1.1" />
                </div>
                <span>Send Prescription</span>
              </a>
              <button class="action-btn" @click="$router.push('/app/patient/prescriptions')">
                <div class="action-icon violet">
                  <v-icon name="ri-capsule-line" scale="1.1" />
                </div>
                <span>All Prescriptions</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/patient/pharmacy')">
                <div class="action-icon emerald">
                  <v-icon name="hi-shopping-cart" scale="1.1" />
                </div>
                <span>Order Meds</span>
              </button>
            </div>
          </div>

          <!-- How It Works Card -->
          <div v-if="isWhatsAppLinked && prescriptions.length === 0" class="bento-card howto-card">
            <div class="card-header">
              <h3>How It Works</h3>
            </div>
            <div class="steps-row">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <h4>Open WhatsApp</h4>
                  <p>Message our pharmacy</p>
                </div>
              </div>
              <div class="step-arrow">
                <v-icon name="hi-arrow-right" scale="0.8" />
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <h4>Send Photo</h4>
                  <p>Clear prescription image</p>
                </div>
              </div>
              <div class="step-arrow">
                <v-icon name="hi-arrow-right" scale="0.8" />
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <h4>Get Processed</h4>
                  <p>Pharmacist reviews it</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Filters Card -->
          <div v-if="isWhatsAppLinked && prescriptions.length > 0" class="bento-card filters-card">
            <div class="card-header">
              <h3>Filter Prescriptions</h3>
              <span class="results-count">{{ filteredPrescriptions.length }} results</span>
            </div>
            <div class="filter-pills">
              <button
                v-for="tab in statusTabs"
                :key="tab.value"
                :class="['filter-pill', { active: activeTab === tab.value }]"
                @click="setStatusFilter(tab.value)"
              >
                <span class="pill-label">{{ tab.label }}</span>
                <span v-if="getTabCount(tab.value) > 0" class="pill-count">{{ getTabCount(tab.value) }}</span>
              </button>
            </div>
          </div>

          <!-- Prescriptions List Card -->
          <div v-if="isWhatsAppLinked" class="bento-card prescriptions-card">
            <div class="card-header">
              <h3>{{ activeTabLabel }}</h3>
              <button v-if="activeTab !== 'all'" class="clear-filter" @click="setStatusFilter('all')">
                Clear filter
                <v-icon name="hi-x" scale="0.7" />
              </button>
            </div>

            <!-- Prescription Items -->
            <div v-if="filteredPrescriptions.length" class="prescriptions-list">
              <div
                v-for="prescription in filteredPrescriptions"
                :key="prescription._id"
                class="prescription-item"
                @click="viewPrescription(prescription)"
              >
                <div class="prescription-item__left">
                  <!-- Prescription Image/Avatar -->
                  <div class="prescription-avatar">
                    <img
                      v-if="prescription.image_url"
                      :src="prescription.image_url"
                      alt="Prescription"
                    />
                    <v-icon v-else name="co-whatsapp" scale="1" />
                  </div>

                  <div class="prescription-info">
                    <div class="prescription-header">
                      <span class="prescription-number">
                        #{{ prescription._id?.slice(-8).toUpperCase() }}
                      </span>
                      <span :class="['status-badge', getStatusClass(prescription.status)]">
                        {{ formatStatus(prescription.status) }}
                      </span>
                    </div>
                    <p class="prescription-source">
                      {{ formatQueueType(prescription.queue_type) }}
                      <span v-if="prescription.priority" :class="['priority-tag', `priority--${prescription.priority?.toLowerCase()}`]">
                        {{ prescription.priority }}
                      </span>
                    </p>
                    <!-- Medication Tags -->
                    <div class="medication-tags" v-if="prescription.ocr_data?.medications?.length">
                      <span
                        v-for="(med, index) in prescription.ocr_data.medications.slice(0, 2)"
                        :key="index"
                        class="med-tag"
                      >
                        {{ med.name || med.drug_name }}
                      </span>
                      <span v-if="prescription.ocr_data.medications.length > 2" class="med-tag med-tag--more">
                        +{{ prescription.ocr_data.medications.length - 2 }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="prescription-item__right">
                  <span class="prescription-date">{{ formatDate(prescription.created_at) }}</span>
                  <div class="whatsapp-badge-small">
                    <v-icon name="co-whatsapp" scale="0.7" />
                  </div>
                  <v-icon name="hi-chevron-right" scale="0.9" class="chevron" />
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state">
              <div class="empty-icon">
                <v-icon name="co-whatsapp" scale="2" />
              </div>
              <h3 v-if="prescriptions.length > 0">No prescriptions match your filter</h3>
              <h3 v-else>No WhatsApp Prescriptions Yet</h3>
              <p v-if="prescriptions.length > 0">Try selecting a different status filter</p>
              <p v-else>Send a photo of your prescription via WhatsApp to get started</p>
              <a v-if="prescriptions.length === 0" :href="whatsappLink" target="_blank" class="empty-action">
                <v-icon name="co-whatsapp" scale="0.9" />
                Send Prescription
              </a>
            </div>
          </div>
        </section>
      </template>
    </div>

    <!-- Mobile Floating Action Button -->
    <a v-if="isWhatsAppLinked" :href="whatsappLink" target="_blank" class="fab">
      <v-icon name="co-whatsapp" scale="1.2" />
    </a>

    <!-- WhatsApp Link Modal -->
    <WhatsAppLinkModal
      v-if="showLinkModal"
      @close="closeLinkModal"
      @linked="onLinked"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import moment from "moment";
import WhatsAppLinkModal from "@/components/Account/WhatsAppLinkModal.vue";

export default {
  name: "WhatsAppPrescriptions",
  components: {
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

    const activeTabLabel = computed(() => {
      const tab = statusTabs.find(t => t.value === activeTab.value);
      return tab ? `${tab.label} Prescriptions` : 'All Prescriptions';
    });

    const filteredPrescriptions = computed(() => {
      let result = [...(prescriptions.value || [])];

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
      const phoneNumber = "2348000000000"; // Replace with actual pharmacy number
      const message = encodeURIComponent("Hi, I would like to submit a prescription");
      return `https://wa.me/${phoneNumber}?text=${message}`;
    });

    const getTabCount = (tabValue) => {
      if (tabValue === 'all') return prescriptions.value?.length || 0;
      if (tabValue === 'pending') return stats.value.pending;
      if (tabValue === 'approved') return stats.value.approved;
      if (tabValue === 'in_progress') return stats.value.inProgress;
      if (tabValue === 'completed') return stats.value.approved;
      return 0;
    };

    const fetchData = async () => {
      await store.dispatch("whatsapp/fetchStatus");
      if (isWhatsAppLinked.value) {
        await store.dispatch("whatsapp/fetchPrescriptions");
      }
    };

    const goToNotifications = () => {
      router.push('/app/patient/notifications');
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
      return moment(date).format("MMM D, YYYY");
    };

    const formatStatus = (status) => {
      if (!status) return "Pending";
      const statusMap = {
        PENDING: "Pending",
        OCR_REVIEW: "Reviewing",
        MANUAL_ENTRY: "Processing",
        VERIFICATION_FAILED: "Attention",
        IN_PROGRESS: "In Progress",
        APPROVED: "Approved",
        COMPLETED: "Completed",
        REJECTED: "Rejected",
        EXPIRED: "Expired",
      };
      return statusMap[status] || status.replace(/_/g, " ");
    };

    const getStatusClass = (status) => {
      if (!status) return 'status--warning';
      const lowerStatus = status.toLowerCase();
      if (['approved', 'completed'].includes(lowerStatus)) return 'status--success';
      if (['pending', 'ocr_review', 'manual_entry'].includes(lowerStatus)) return 'status--warning';
      if (['in_progress', 'processing', 'dispensed', 'shipped'].includes(lowerStatus)) return 'status--info';
      if (['verification_failed', 'rejected', 'expired'].includes(lowerStatus)) return 'status--error';
      return 'status--default';
    };

    const formatQueueType = (type) => {
      if (!type) return "WhatsApp Submission";
      const typeMap = {
        OCR_REVIEW: "Auto-Scanned",
        MANUAL_ENTRY: "Manual Review",
        CONTROLLED_SUBSTANCE: "Controlled",
        VERIFICATION_FAILED: "Needs Verification",
        PHARMACIST_ESCALATION: "Escalated",
        CLARIFICATION_RESPONSE: "Clarification",
      };
      return typeMap[type] || "WhatsApp Submission";
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
      activeTabLabel,
      filteredPrescriptions,
      whatsappLink,
      getTabCount,
      goToNotifications,
      openLinkModal,
      closeLinkModal,
      onLinked,
      setStatusFilter,
      viewPrescription,
      formatDate,
      formatStatus,
      getStatusClass,
      formatQueueType,
    };
  },
};
</script>

<style scoped lang="scss">
// Design Tokens
$whatsapp: #25D366;
$whatsapp-dark: #128C7E;
$whatsapp-light: #DCF8C6;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.whatsapp-prescriptions-page {
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
  padding: 12px 16px;
  background: white;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #F1F5F9;

  @media (max-width: 768px) {
    display: flex;
  }

  .menu-btn, .notification-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: none;
    background: $bg;
    color: $slate;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    &:active {
      background: #E2E8F0;
    }
  }

  .header-logo {
    img {
      height: 28px;
      width: auto;
    }
  }
}

// Page Content
.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px 32px 100px;

  @media (max-width: 768px) {
    padding: 16px 16px 120px;
  }
}

// Loading State
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 16px;

  .loading-spinner {
    position: relative;
    width: 64px;
    height: 64px;

    .spinner-ring {
      position: absolute;
      inset: 0;
      border: 3px solid $whatsapp-light;
      border-top-color: $whatsapp;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: $whatsapp;
    }
  }

  p {
    color: $gray;
    font-size: 14px;
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ============================================
// HERO SECTION
// ============================================
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 48px 40px 56px;
  background: linear-gradient(135deg, $whatsapp 0%, $whatsapp-dark 50%, darken($whatsapp-dark, 10%) 100%);
  border-radius: 28px;
  position: relative;
  overflow: visible;
  min-height: 460px;
  margin-bottom: 24px;
  box-shadow:
    0 20px 60px rgba(37, 211, 102, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 24px 20px;
    gap: 0;
    text-align: center;
    min-height: auto;
    border-radius: 20px;
    margin-bottom: 16px;
  }

  .hero__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2;
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
      background: white;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;

      &::after {
        content: '';
        position: absolute;
        inset: -4px;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        animation: pulse-ring 2s ease-out infinite;
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

      br {
        display: none;
      }
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
    padding: 16px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    width: fit-content;

    @media (max-width: 768px) {
      width: 100%;
      justify-content: space-around;
      padding: 14px 16px;
      gap: 0;
      border-radius: 12px;
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

    &--warning {
      color: $amber-light;
    }

    &--info {
      color: $sky-light;
    }

    &--success {
      color: $emerald-light;
    }
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

// Orb Animation
.whatsapp-orb {
  position: relative;
  width: 200px;
  height: 200px;
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
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 40px rgba(255, 255, 255, 0.3),
    0 0 80px rgba(37, 211, 102, 0.3);
  animation: pulse-glow 3s ease-in-out infinite;

  svg {
    width: 48px;
    height: 48px;
    color: white;
  }
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: float 3s ease-in-out infinite;

  svg {
    width: 20px;
    height: 20px;
    color: white;
  }

  &--1 {
    top: 10%;
    right: 10%;
    animation-delay: 0s;
  }

  &--2 {
    bottom: 20%;
    right: 5%;
    animation-delay: 1s;
  }

  &--3 {
    bottom: 10%;
    left: 10%;
    animation-delay: 2s;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(37, 211, 102, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(37, 211, 102, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// ============================================
// BENTO GRID
// ============================================
.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(6, 1fr);
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.bento-card {
  @include glass-card;
  border-radius: 20px;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    @media (max-width: 768px) {
      margin-bottom: 12px;
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }

    .results-count {
      font-size: 13px;
      color: $gray;
    }

    .clear-filter {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: $whatsapp-dark;
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 500;

      &:hover {
        color: $whatsapp;
      }
    }

    .linked-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: $whatsapp-dark;
      background: $whatsapp-light;
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 500;
    }
  }
}

// Link Card
.link-card {
  grid-column: span 12;
  background: linear-gradient(135deg, $whatsapp 0%, $whatsapp-dark 100%);
  border: none;

  .link-content {
    display: flex;
    align-items: center;
    gap: 24px;

    @media (max-width: 768px) {
      flex-direction: column;
      text-align: center;
    }
  }

  .link-icon {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .link-text {
    flex: 1;

    h3 {
      font-size: 20px;
      font-weight: 700;
      color: white;
      margin: 0 0 8px;
    }

    p {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
      line-height: 1.5;
    }
  }

  .btn-link-whatsapp {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 24px;
    background: white;
    color: $whatsapp-dark;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-2px);
    }
  }
}

// Actions Card
.actions-card {
  grid-column: span 12;

  @media (max-width: 768px) {
    display: none; // Hide on mobile, use FAB instead
  }

  .actions-row {
    display: flex;
    gap: 12px;
  }

  .action-btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px 16px;
    background: $bg;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;

    &:hover {
      background: white;
      border-color: $whatsapp;
      box-shadow: 0 4px 12px rgba($whatsapp, 0.15);
      transform: translateY(-2px);
    }

    &.primary {
      background: $whatsapp-light;
      border-color: $whatsapp-light;

      &:hover {
        background: lighten($whatsapp-light, 3%);
      }
    }

    span {
      font-size: 13px;
      font-weight: 500;
      color: $slate;
    }
  }

  .action-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.whatsapp { background: $whatsapp; color: white; }
    &.emerald { background: $emerald-light; color: $emerald; }
    &.violet { background: $violet-light; color: $violet; }
  }
}

// How To Card
.howto-card {
  grid-column: span 12;

  .steps-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;

    @media (max-width: 768px) {
      flex-direction: column;
      gap: 12px;
    }
  }

  .step {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: $bg;
    border-radius: 12px;
    flex: 1;
    max-width: 200px;

    @media (max-width: 768px) {
      max-width: 100%;
      width: 100%;
    }
  }

  .step-number {
    width: 36px;
    height: 36px;
    background: $whatsapp;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
  }

  .step-content {
    h4 {
      font-size: 14px;
      font-weight: 600;
      color: $navy;
      margin: 0 0 2px;
    }

    p {
      font-size: 12px;
      color: $gray;
      margin: 0;
    }
  }

  .step-arrow {
    color: $light-gray;

    @media (max-width: 768px) {
      transform: rotate(90deg);
    }
  }
}

// Filters Card
.filters-card {
  grid-column: span 12;

  .filter-pills {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #E2E8F0;
      border-radius: 2px;
    }
  }

  .filter-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 20px;
    border: 1px solid #E2E8F0;
    background: white;
    font-size: 13px;
    font-weight: 500;
    color: $slate;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;

    &:hover {
      border-color: $whatsapp;
      color: $whatsapp-dark;
    }

    &.active {
      background: linear-gradient(135deg, $whatsapp, $whatsapp-dark);
      border-color: transparent;
      color: white;

      .pill-count {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }
    }

    .pill-count {
      background: $bg;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      color: $gray;
    }
  }
}

// Prescriptions Card
.prescriptions-card {
  grid-column: span 12;
}

.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prescription-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: $bg;
  border-radius: 14px;
  border: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.2s;

  @media (max-width: 768px) {
    padding: 14px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  &:hover {
    background: white;
    border-color: $whatsapp-light;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    transform: translateX(4px);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
    min-width: 0;

    @media (max-width: 768px) {
      width: 100%;
    }
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;

    @media (max-width: 768px) {
      width: 100%;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid #E2E8F0;
    }

    .chevron {
      color: $light-gray;

      @media (max-width: 768px) {
        display: none;
      }
    }
  }
}

.prescription-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  background: $whatsapp-light;
  color: $whatsapp-dark;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.prescription-info {
  flex: 1;
  min-width: 0;

  .prescription-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
    flex-wrap: wrap;
  }

  .prescription-number {
    font-size: 15px;
    font-weight: 600;
    color: $navy;
  }

  .prescription-source {
    font-size: 13px;
    color: $gray;
    margin: 0 0 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;

  &.status--success {
    background: $emerald-light;
    color: $emerald;
  }

  &.status--warning {
    background: $amber-light;
    color: $amber;
  }

  &.status--info {
    background: $sky-light;
    color: $sky-dark;
  }

  &.status--error {
    background: $rose-light;
    color: $rose;
  }

  &.status--default {
    background: #F1F5F9;
    color: $slate;
  }
}

.priority-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;

  &.priority--urgent {
    background: $rose-light;
    color: $rose;
  }

  &.priority--high {
    background: $amber-light;
    color: $amber;
  }

  &.priority--normal {
    background: $sky-light;
    color: $sky-dark;
  }

  &.priority--low {
    background: #F1F5F9;
    color: $gray;
  }
}

.medication-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  .med-tag {
    font-size: 11px;
    padding: 4px 10px;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 8px;
    color: $slate;

    &--more {
      background: $whatsapp-light;
      border-color: $whatsapp-light;
      color: $whatsapp-dark;
      font-weight: 500;
    }
  }
}

.prescription-date {
  font-size: 13px;
  color: $gray;
}

.whatsapp-badge-small {
  width: 28px;
  height: 28px;
  background: $whatsapp-light;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $whatsapp-dark;
}

// Empty State
.empty-state {
  text-align: center;
  padding: 48px 24px;

  .empty-icon {
    width: 80px;
    height: 80px;
    background: $whatsapp-light;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: $whatsapp;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: $navy;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: $gray;
    margin: 0 0 20px;
  }

  .empty-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, $whatsapp, $whatsapp-dark);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($whatsapp, 0.3);
    }
  }
}

// Floating Action Button
.fab {
  display: none;
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, $whatsapp, $whatsapp-dark);
  color: white;
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba($whatsapp, 0.4);
  cursor: pointer;
  z-index: 50;
  transition: all 0.2s;
  text-decoration: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
