<template>
  <div class="page-content">
    <top-bar
      type="title-only"
      title="My Prescriptions"
      @open-side-nav="$emit('openSideNav')"
    />

    <div class="page-content__body">
      <!-- Loading State -->
      <div class="loader-container" v-if="loading">
        <Loader :useOverlay="false" :rounded="true" />
      </div>

      <!-- Main Content -->
      <div v-else class="prescriptions-container">
        <!-- Stats Cards -->
        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-card">
            <span class="stat-value stat-value--warning">{{ stats.pending_payment }}</span>
            <span class="stat-label">Pending Payment</span>
          </div>
          <div class="stat-card">
            <span class="stat-value stat-value--info">{{ stats.processing }}</span>
            <span class="stat-label">Processing</span>
          </div>
          <div class="stat-card">
            <span class="stat-value stat-value--success">{{ stats.delivered }}</span>
            <span class="stat-label">Delivered</span>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="search-bar">
            <rc-icon icon-name="search" size="sm" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search prescriptions..."
              @input="handleSearch"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <rc-icon icon-name="close" size="xs" />
            </button>
          </div>
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

        <!-- Upload Button -->
        <div class="actions-section">
          <button class="btn btn-secondary" @click="showUploadPrescription = true">
            <rc-icon icon-name="plus" size="sm" />
            Upload Prescription
          </button>
        </div>

        <!-- Results -->
        <div class="results-section">
          <div v-if="paginatedPrescriptions.length" class="prescriptions-list">
            <div
              v-for="prescription in paginatedPrescriptions"
              :key="prescription._id"
              class="prescription-card"
              @click="viewPrescription(prescription)"
            >
              <div class="prescription-card__header">
                <div class="prescription-info">
                  <span class="prescription-number">
                    {{ prescription.prescription_number || `#${prescription._id?.slice(-8).toUpperCase()}` }}
                  </span>
                  <span :class="['status', getStatusClass(prescription)]">
                    {{ formatStatus(prescription) }}
                  </span>
                </div>
                <span class="prescription-date">{{ formatDate(prescription.created_at) }}</span>
              </div>

              <!-- Doctor Info for Internal Prescriptions -->
              <div class="prescription-card__doctor" v-if="prescription.type === 'INTERNAL'">
                <div class="doctor-avatar">
                  <img
                    v-if="getDoctorPhoto(prescription)"
                    :src="getDoctorPhoto(prescription)"
                    :alt="getDoctorName(prescription)"
                  />
                  <span v-else>{{ getDoctorInitials(prescription) }}</span>
                </div>
                <div class="doctor-info">
                  <p class="doctor-name">{{ getDoctorName(prescription) }}</p>
                  <p class="doctor-specialty">{{ getDoctorSpecialty(prescription) }}</p>
                </div>
              </div>

              <!-- Order Info for Pharmacy Orders -->
              <div class="prescription-card__order" v-else-if="prescription.type === 'ORDER'">
                <div class="order-icon">
                  <rc-icon icon-name="cart" size="md" />
                </div>
                <div class="order-info">
                  <p class="order-title">{{ getPharmacyName(prescription) }}</p>
                  <p class="order-subtitle">Order placed by you</p>
                </div>
              </div>

              <!-- External Prescription Info -->
              <div class="prescription-card__external" v-else>
                <div class="external-avatar" v-if="prescription.ocr_data?.doctor_name">
                  <span>{{ getInitials(prescription.ocr_data.doctor_name) }}</span>
                </div>
                <div class="external-icon" v-else>
                  <rc-icon icon-name="upload-cloud" size="md" />
                </div>
                <div class="external-info">
                  <p class="external-title">{{ prescription.ocr_data?.doctor_name ? 'Dr. ' + prescription.ocr_data.doctor_name : 'Uploaded Prescription' }}</p>
                  <p class="external-subtitle">{{ prescription.ocr_data?.clinic_name || 'External prescription uploaded by you' }}</p>
                </div>
              </div>

              <!-- Medication Tags -->
              <div class="prescription-card__items" v-if="prescription.items?.length">
                <div class="items-preview">
                  <span
                    v-for="(item, index) in prescription.items?.slice(0, 3)"
                    :key="index"
                    class="item-tag"
                  >
                    {{ item.drug_name || item.drug }}
                  </span>
                  <span v-if="prescription.items?.length > 3" class="more-items">
                    +{{ prescription.items.length - 3 }} more
                  </span>
                </div>
              </div>

              <!-- Documents for External -->
              <div class="prescription-card__documents" v-else-if="prescription.documents?.length">
                <span class="documents-badge">
                  <rc-icon icon-name="file" size="xs" />
                  {{ prescription.documents.length }} document(s)
                </span>
              </div>

              <div class="prescription-card__footer">
                <div class="source-info">
                  <span class="source-badge" :class="prescription.type?.toLowerCase()">
                    {{ getSourceLabel(prescription) }}
                  </span>
                  <span
                    v-if="prescription.payment_status"
                    :class="['payment-status', `payment-status--${prescription.payment_status?.toLowerCase()}`]"
                  >
                    {{ formatPaymentStatus(prescription.payment_status) }}
                  </span>
                </div>
                <div class="amount" v-if="prescription.total_amount">
                  NGN {{ formatCurrency(prescription.total_amount) }}
                </div>
                <div class="view-link" v-else>
                  View Details →
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="filteredPrescriptions.length > 0" class="pagination-section">
            <div class="pagination-info">
              Showing {{ showingFrom }} - {{ showingTo }} of {{ filteredPrescriptions.length }} prescriptions
            </div>
            <div class="pagination-controls" v-if="totalPages > 1">
              <button
                class="pagination-btn"
                :disabled="currentPage === 1"
                @click="goToPage(1)"
              >
                First
              </button>
              <button
                class="pagination-btn"
                :disabled="currentPage === 1"
                @click="previousPage"
              >
                ← Previous
              </button>
              <div class="page-numbers">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  :class="['page-btn', { active: page === currentPage }]"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>
              </div>
              <button
                class="pagination-btn"
                :disabled="currentPage === totalPages"
                @click="nextPage"
              >
                Next →
              </button>
              <button
                class="pagination-btn"
                :disabled="currentPage === totalPages"
                @click="goToPage(totalPages)"
              >
                Last
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <div class="empty-icon">
              <rc-icon icon-name="prescription" size="xl" />
            </div>
            <h3>No prescriptions found</h3>
            <p v-if="searchQuery || activeTab !== 'all'">Try adjusting your filters</p>
            <p v-else>You don't have any prescriptions yet</p>
            <button class="btn btn-primary" @click="showUploadPrescription = true">
              Upload Prescription
            </button>
          </div>
        </div>
      </div>

      <!-- Upload Modal -->
      <UploadPrescriptions
        v-if="showUploadPrescription"
        @handleClose="handleCloseUpload"
      />
    </div>
  </div>
</template>

<script>
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader.vue";
import UploadPrescriptions from "./components/main/UploadPrescriptionModal.vue";
import RcIcon from "@/components/RCIcon";
import moment from "moment";
import { debounce } from "lodash";
import { mapGetters, mapActions } from "vuex";

export default {
  name: "PatientPrescriptions",
  components: {
    TopBar,
    Loader,
    UploadPrescriptions,
    RcIcon,
  },
  emits: ["openSideNav"],
  data() {
    return {
      showUploadPrescription: false,
      searchQuery: "",
      activeTab: "all",
      currentPage: 1,
      itemsPerPage: 10,
      statusTabs: [
        { label: "All", value: "all" },
        { label: "From Doctor", value: "internal" },
        { label: "My Orders", value: "orders" },
        { label: "Uploaded", value: "external" },
        { label: "Pending", value: "pending_payment" },
        { label: "Processing", value: "processing" },
        { label: "Delivered", value: "delivered" },
      ],
    };
  },
  computed: {
    ...mapGetters("prescriptions", {
      loading: "getLoadingState",
      prescriptions: "getPrescriptions",
    }),
    stats() {
      const prescriptions = this.prescriptions || [];
      return {
        total: prescriptions.length,
        pending_payment: prescriptions.filter(p =>
          p.status === 'pending_payment' ||
          p.payment_status === 'pending' ||
          p.payment_status === 'PENDING' ||
          p.status === 'PENDING'
        ).length,
        processing: prescriptions.filter(p =>
          ['processing', 'paid', 'dispensed', 'shipped', 'confirmed', 'ready_for_pickup', 'out_for_delivery']
            .includes(p.status?.toLowerCase())
        ).length,
        delivered: prescriptions.filter(p =>
          p.status === 'delivered' || p.status === 'DELIVERED' || p.status === 'COMPLETED'
        ).length,
      };
    },
    filteredPrescriptions() {
      let result = [...this.prescriptions];

      // Filter by tab
      if (this.activeTab === 'internal') {
        result = result.filter(p => p.type === 'INTERNAL');
      } else if (this.activeTab === 'orders') {
        result = result.filter(p => p.type === 'ORDER');
      } else if (this.activeTab === 'external') {
        result = result.filter(p => p.type === 'EXTERNAL');
      } else if (this.activeTab === 'pending_payment') {
        result = result.filter(p =>
          p.status === 'pending_payment' ||
          p.status === 'pending_acceptance' ||
          p.payment_status === 'pending' ||
          p.payment_status === 'PENDING' ||
          p.status === 'PENDING'
        );
      } else if (this.activeTab === 'processing') {
        result = result.filter(p =>
          ['processing', 'paid', 'dispensed', 'shipped', 'confirmed', 'ready_for_pickup', 'out_for_delivery']
            .includes(p.status?.toLowerCase())
        );
      } else if (this.activeTab === 'delivered') {
        result = result.filter(p =>
          p.status === 'delivered' || p.status === 'DELIVERED' || p.status === 'COMPLETED'
        );
      }

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(p => {
          const prescriptionNumber = (p.prescription_number || '').toLowerCase();
          const doctorName = this.getDoctorName(p).toLowerCase();
          const specialist = (p.specialist || '').toLowerCase();
          const drugs = (p.items || []).map(i => (i.drug_name || i.drug || '').toLowerCase()).join(' ');

          return prescriptionNumber.includes(query) ||
                 doctorName.includes(query) ||
                 specialist.includes(query) ||
                 drugs.includes(query);
        });
      }

      // Sort by date (newest first)
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return result;
    },
    totalPages() {
      return Math.ceil(this.filteredPrescriptions.length / this.itemsPerPage);
    },
    paginatedPrescriptions() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredPrescriptions.slice(start, end);
    },
    showingFrom() {
      if (this.filteredPrescriptions.length === 0) return 0;
      return (this.currentPage - 1) * this.itemsPerPage + 1;
    },
    showingTo() {
      const end = this.currentPage * this.itemsPerPage;
      return Math.min(end, this.filteredPrescriptions.length);
    },
    visiblePages() {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(this.totalPages, start + maxVisible - 1);

      // Adjust start if we're near the end
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      return pages;
    },
  },
  watch: {
    searchQuery() {
      // Reset to page 1 when search query changes
      this.currentPage = 1;
    },
  },
  created() {
    this.handleSearch = debounce(() => {
      // Search is reactive via computed, no action needed
    }, 300);
  },
  mounted() {
    this.fetchPrescriptions();
  },
  methods: {
    ...mapActions("prescriptions", ["fetchPrescriptions"]),
    setStatusFilter(status) {
      this.activeTab = status;
      this.currentPage = 1; // Reset to first page when filter changes
    },
    clearSearch() {
      this.searchQuery = "";
      this.currentPage = 1; // Reset to first page when search is cleared
    },
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        // Scroll to top of results
        this.$nextTick(() => {
          const resultsSection = document.querySelector('.results-section');
          if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      }
    },
    nextPage() {
      this.goToPage(this.currentPage + 1);
    },
    previousPage() {
      this.goToPage(this.currentPage - 1);
    },
    handleCloseUpload() {
      this.showUploadPrescription = false;
      this.fetchPrescriptions();
    },
    viewPrescription(prescription) {
      if (prescription.type === 'ORDER') {
        this.$router.push(`/app/patient/pharmacy/orders/${prescription._id}`);
      } else {
        this.$router.push(`/app/patient/prescriptions/details/${prescription._id}`);
      }
    },
    getPharmacyName(prescription) {
      if (prescription.pharmacy?.name) {
        return prescription.pharmacy.name;
      }
      return 'Pharmacy Order';
    },
    getSourceLabel(prescription) {
      if (prescription.type === 'INTERNAL') return 'RapidCapsule';
      if (prescription.type === 'ORDER') return 'Pharmacy Order';
      return 'Uploaded';
    },
    getDoctorPhoto(prescription) {
      if (prescription.prescription_source === 'specialist') {
        return prescription.specialist_id?.profile?.profile_image ||
               prescription.specialist_id?.profile?.profile_photo || null;
      }
      return prescription.prescribed_by?.profile?.profile_photo || null;
    },
    getDoctorName(prescription) {
      if (prescription.prescription_source === 'specialist') {
        const specialist = prescription.specialist_id;
        if (specialist?.profile) {
          return `Dr. ${specialist.profile.first_name || ''} ${specialist.profile.last_name || ''}`.trim();
        }
        return 'Doctor';
      }
      const doctor = prescription.prescribed_by;
      if (doctor?.profile) {
        return `Dr. ${doctor.profile.first_name || ''} ${doctor.profile.last_name || ''}`.trim();
      }
      return 'Doctor';
    },
    getDoctorInitials(prescription) {
      const name = this.getDoctorName(prescription);
      return name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DR';
    },
    getInitials(name) {
      if (!name) return 'RX';
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'RX';
    },
    getDoctorSpecialty(prescription) {
      if (prescription.prescription_source === 'specialist') {
        const specialist = prescription.specialist_id;
        if (specialist?.specializations?.length) {
          return specialist.specializations[0];
        }
        return 'Medical Specialist';
      }
      const practice = prescription.prescribed_by?.profile?.professional_practice;
      return practice?.area_of_specialty || 'Medical Specialist';
    },
    formatDate(date) {
      if (!date) return "";
      return moment(date).format("MMM D, YYYY");
    },
    formatCurrency(amount) {
      if (!amount) return "0.00";
      return Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    formatStatus(prescription) {
      const status = prescription.status || prescription.verification_status || prescription.payment_status;
      if (!status) {
        return prescription.type === 'EXTERNAL' ? 'Uploaded' : 'Active';
      }

      const lowerStatus = status.toLowerCase();

      // For approved uploaded prescriptions that haven't been used in an order yet,
      // show "Ready to Order" to prompt patient action
      if (lowerStatus === 'approved' && prescription.type === 'EXTERNAL' && !prescription.used_in_order) {
        return 'Ready to Order';
      }

      // Map status to user-friendly text
      const statusMap = {
        'pending': 'Pending Review',
        'verifying': 'Verifying',
        'verified': 'Verified',
        'verification_failed': 'Verification Failed',
        'under_review': 'Under Review',
        'pharmacist_review': 'Under Review',
        'tier1_processing': 'Processing',
        'tier2_processing': 'Processing',
        'tier1_passed': 'Processing',
        'tier2_passed': 'Processing',
        'tier1_failed': 'Needs Review',
        'tier2_failed': 'Needs Review',
        'clarification_needed': 'Clarification Needed',
        'clarification_received': 'Under Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'expired': 'Expired',
        'used_in_order': 'Used in Order',
        'pending_acceptance': 'Pending Acceptance',
        'pending_payment': 'Pending Payment',
        'paid': 'Paid',
        'processing': 'Processing',
        'dispensed': 'Dispensed',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
      };
      return statusMap[lowerStatus] || status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    },
    getStatusClass(prescription) {
      const status = prescription.status || prescription.verification_status || prescription.payment_status || '';
      const lowerStatus = status.toLowerCase();

      // For approved uploaded prescriptions that haven't been used, use ready_to_order class
      if (lowerStatus === 'approved' && prescription.type === 'EXTERNAL' && !prescription.used_in_order) {
        return 'status--ready_to_order';
      }

      return `status--${lowerStatus.replace(/ /g, '_')}`;
    },
    formatPaymentStatus(status) {
      if (!status) return "N/A";
      const statuses = {
        pending: "Pending",
        processing: "Processing",
        completed: "Paid",
        paid: "Paid",
        failed: "Failed",
        refunded: "Refunded",
      };
      return statuses[status.toLowerCase()] || status;
    },
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

    @include responsive(tab-landscape) {
      min-height: 100vh;
    }
  }

  &__body {
    @include flexItem(vertical) {
      gap: $size-24;
      overflow-y: auto;
      overscroll-behavior-block: contain;
      padding: $size-12 $size-48 $size-24 $size-48;
      margin-left: $size-8;
      margin-right: $size-8;

      @include scrollBar(normal);

      @include responsive(tab-landscape) {
        padding-left: $size-32;
        padding-right: $size-32;
        margin-right: $size-0;
        margin-left: $size-0;

        @include scrollBar(reset);
      }

      @include responsive(phone) {
        padding: $size-12 $size-16 $size-24 $size-16;
        margin-right: $size-0;
        margin-left: $size-0;
        overflow-x: visible;
        overflow-y: auto;

        @include scrollBar(none);
      }
    }
  }
}

.loader-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prescriptions-container {
  width: 100%;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: $size-12;
  margin-bottom: $size-24;

  @include responsive(tab-portrait) {
    grid-template-columns: repeat(2, 1fr);
  }

  @include responsive(phone) {
    grid-template-columns: repeat(2, 1fr);
    gap: $size-8;
  }
}

.stat-card {
  background: $color-white;
  padding: $size-16;
  border-radius: $size-12;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  @include responsive(phone) {
    padding: $size-12;
  }

  .stat-value {
    display: block;
    font-size: $size-28;
    font-weight: $fw-bold;
    color: $color-g-21;

    @include responsive(phone) {
      font-size: $size-22;
    }

    &--warning {
      color: #d97706;
    }

    &--info {
      color: #2563eb;
    }

    &--success {
      color: #059669;
    }
  }

  .stat-label {
    font-size: $size-12;
    color: $color-g-54;

    @include responsive(phone) {
      font-size: $size-11;
    }
  }
}

.filters-section {
  margin-bottom: $size-16;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: $size-12;
  background: $color-white;
  padding: $size-12 $size-16;
  border-radius: $size-12;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: $size-16;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: $size-15;
    color: $color-g-21;

    &::placeholder {
      color: $color-g-67;
    }
  }

  .clear-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: $size-4;
    color: $color-g-54;

    &:hover {
      color: $color-g-36;
    }
  }
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
  background: $color-white;
  font-size: $size-12;
  font-weight: $fw-medium;
  color: $color-g-44;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    border-color: $color-pri;
    color: $color-pri;
  }

  &.active {
    background: $color-pri;
    border-color: $color-pri;
    color: $color-white;
  }
}

.actions-section {
  margin-bottom: $size-20;
  display: flex;
  justify-content: flex-end;
}

.prescriptions-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.prescription-card {
  background: $color-white;
  padding: $size-20;
  border-radius: $size-12;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  @include responsive(phone) {
    padding: $size-16;
  }

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
      flex-wrap: wrap;

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

  &__doctor {
    display: flex;
    align-items: center;
    gap: $size-12;
    margin-bottom: $size-16;

    .doctor-avatar {
      width: $size-44;
      height: $size-44;
      border-radius: 50%;
      background: $color-pri;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      span {
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        color: $color-white;
      }
    }

    .doctor-name {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-21;
    }

    .doctor-specialty {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  &__external {
    display: flex;
    align-items: center;
    gap: $size-12;
    margin-bottom: $size-16;

    .external-icon {
      width: $size-44;
      height: $size-44;
      border-radius: 50%;
      background: $color-g-92;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $color-g-54;
    }

    .external-avatar {
      width: $size-44;
      height: $size-44;
      border-radius: 50%;
      background: linear-gradient(135deg, $color-pri 0%, darken($color-pri, 15%) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: $fw-semi-bold;
      font-size: $size-14;
    }

    .external-title {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-21;
    }

    .external-subtitle {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  &__order {
    display: flex;
    align-items: center;
    gap: $size-12;
    margin-bottom: $size-16;

    .order-icon {
      width: $size-44;
      height: $size-44;
      border-radius: 50%;
      background: #e0f2fe;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0369a1;
    }

    .order-title {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-21;
    }

    .order-subtitle {
      font-size: $size-12;
      color: $color-g-54;
    }
  }

  &__items {
    margin-bottom: $size-16;

    .items-preview {
      display: flex;
      flex-wrap: wrap;
      gap: $size-6;
    }

    .item-tag {
      font-size: $size-12;
      padding: $size-4 $size-10;
      background: $color-g-95;
      border-radius: $size-12;
      color: $color-g-44;
    }

    .more-items {
      font-size: $size-12;
      padding: $size-4 $size-10;
      background: $color-g-90;
      border-radius: $size-12;
      color: $color-g-54;
    }
  }

  &__documents {
    margin-bottom: $size-16;

    .documents-badge {
      display: inline-flex;
      align-items: center;
      gap: $size-6;
      font-size: $size-12;
      padding: $size-4 $size-10;
      background: #e0f2fe;
      border-radius: $size-12;
      color: #0369a1;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $size-12;
    border-top: 1px solid $color-g-92;

    .source-info {
      display: flex;
      align-items: center;
      gap: $size-8;
    }

    .source-badge {
      font-size: $size-11;
      padding: $size-3 $size-8;
      border-radius: $size-8;
      font-weight: $fw-medium;

      &.internal {
        background: rgba($color-pri, 0.1);
        color: $color-pri;
      }

      &.external {
        background: $color-g-90;
        color: $color-g-54;
      }

      &.order {
        background: #e0f2fe;
        color: #0369a1;
      }
    }

    .amount {
      font-size: $size-18;
      font-weight: $fw-bold;
      color: $color-g-21;

      @include responsive(phone) {
        font-size: $size-16;
      }
    }

    .view-link {
      font-size: $size-14;
      color: $color-pri;
      font-weight: $fw-medium;
    }
  }
}

.status {
  font-size: $size-11;
  padding: $size-4 $size-10;
  border-radius: $size-12;
  font-weight: $fw-medium;
  text-transform: capitalize;

  &--draft {
    background: $color-g-90;
    color: $color-g-44;
  }

  &--pending_payment,
  &--pending {
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

  &--active,
  &--uploaded {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--verifying {
    background: rgba(#3b82f6, 0.1);
    color: #2563eb;
  }

  &--verified,
  &--approved {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--ready_to_order {
    background: linear-gradient(135deg, rgba(#f59e0b, 0.15) 0%, rgba(#f97316, 0.15) 100%);
    color: #d97706;
    font-weight: $fw-semi-bold;
    animation: pulse-subtle 2s ease-in-out infinite;
  }

  @keyframes pulse-subtle {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.8; }
  }

  &--verification_failed,
  &--rejected {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }

  &--under_review {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--expired {
    background: rgba(#6b7280, 0.1);
    color: #4b5563;
  }

  &--used_in_order {
    background: rgba(#8b5cf6, 0.1);
    color: #7c3aed;
  }

  &--pending_acceptance {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }
}

.payment-status {
  font-size: $size-11;
  padding: $size-3 $size-8;
  border-radius: $size-8;

  &--pending {
    background: rgba(#f59e0b, 0.1);
    color: #d97706;
  }

  &--completed,
  &--paid {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &--failed {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
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
    color: $color-g-67;
  }

  h3 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-44;
    margin: $size-16 0 $size-8;
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

  &-primary {
    background: $color-pri;
    color: $color-white;

    &:hover {
      background: darken($color-pri, 10%);
    }
  }

  &-secondary {
    background: $color-white;
    color: $color-pri;
    border: 1px solid $color-pri;

    &:hover {
      background: rgba($color-pri, 0.05);
    }
  }
}

.pagination-section {
  margin-top: $size-24;
  padding: $size-16 0;
  border-top: 1px solid $color-g-92;
  display: flex;
  flex-direction: column;
  gap: $size-16;
  align-items: center;

  @include responsive(tab-landscape) {
    flex-direction: column;
    gap: $size-12;
  }
}

.pagination-info {
  font-size: $size-14;
  color: $color-g-54;
  text-align: center;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: $size-8;
  flex-wrap: wrap;
  justify-content: center;

  @include responsive(phone) {
    gap: $size-6;
  }
}

.pagination-btn {
  padding: $size-8 $size-16;
  border: 1px solid $color-g-85;
  background: $color-white;
  border-radius: $size-8;
  font-size: $size-13;
  font-weight: $fw-medium;
  color: $color-g-44;
  cursor: pointer;
  transition: all 0.2s ease;

  @include responsive(phone) {
    padding: $size-6 $size-12;
    font-size: $size-12;
  }

  &:hover:not(:disabled) {
    border-color: $color-pri;
    color: $color-pri;
    background: rgba($color-pri, 0.05);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-numbers {
  display: flex;
  gap: $size-4;
}

.page-btn {
  width: $size-36;
  height: $size-36;
  border: 1px solid $color-g-85;
  background: $color-white;
  border-radius: $size-8;
  font-size: $size-14;
  font-weight: $fw-medium;
  color: $color-g-44;
  cursor: pointer;
  transition: all 0.2s ease;

  @include responsive(phone) {
    width: $size-32;
    height: $size-32;
    font-size: $size-13;
  }

  &:hover {
    border-color: $color-pri;
    color: $color-pri;
  }

  &.active {
    background: $color-pri;
    border-color: $color-pri;
    color: $color-white;
  }
}
</style>
