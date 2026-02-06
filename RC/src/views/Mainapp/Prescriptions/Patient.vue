<template>
  <div class="prescriptions-page">
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
          <v-icon name="ri-capsule-line" scale="1.2" class="spinner-icon" />
        </div>
        <p>Loading prescriptions...</p>
      </div>

      <template v-else>
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero__content">
            <button class="back-link desktop-only" @click="$router.push('/app/patient/dashboard')">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Dashboard</span>
            </button>
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="ri-capsule-line" />
              <span>Your Medications</span>
            </div>
            <h1 class="hero__title">
              My<br/>
              <span class="hero__title-accent">Prescriptions</span>
            </h1>
            <p class="hero__subtitle">
              View and manage all your prescriptions from doctors and uploaded documents.
            </p>
            <div class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ stats.total }}</span>
                <span class="hero-stat__label">Total</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--warning">{{ stats.pending_payment }}</span>
                <span class="hero-stat__label">Pending</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--info">{{ stats.processing }}</span>
                <span class="hero-stat__label">Processing</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--success">{{ stats.delivered }}</span>
                <span class="hero-stat__label">Delivered</span>
              </div>
            </div>
          </div>
          <div class="hero__visual">
            <div class="prescription-orb">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="ri-capsule-line" />
              </div>
            </div>
            <div class="floating-icons">
              <div class="float-icon float-icon--1"><v-icon name="hi-clipboard-check" /></div>
              <div class="float-icon float-icon--2"><v-icon name="hi-document-text" /></div>
              <div class="float-icon float-icon--3"><v-icon name="hi-shield-check" /></div>
            </div>
          </div>
        </section>

        <!-- Bento Grid -->
        <section class="bento-grid">
          <!-- Quick Actions Card -->
          <div class="bento-card actions-card">
            <div class="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div class="actions-row">
              <button class="action-btn" @click="goToUploadPrescription">
                <div class="action-icon violet">
                  <v-icon name="hi-upload" scale="1.1" />
                </div>
                <span>Upload Prescription</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/patient/prescriptions/whatsapp')">
                <div class="action-icon whatsapp">
                  <v-icon name="co-whatsapp" scale="1.1" />
                </div>
                <span>WhatsApp Prescription</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/patient/pharmacy')">
                <div class="action-icon emerald">
                  <v-icon name="hi-shopping-cart" scale="1.1" />
                </div>
                <span>Order Medications</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/patient/appointmentsv2/book')">
                <div class="action-icon sky">
                  <v-icon name="hi-video-camera" scale="1.1" />
                </div>
                <span>Consult Doctor</span>
              </button>
            </div>
          </div>

          <!-- Filters Card -->
          <div class="bento-card filters-card">
            <div class="card-header">
              <h3>Filter Prescriptions</h3>
              <span class="results-count">{{ filteredPrescriptions.length }} results</span>
            </div>
            <div class="search-bar">
              <v-icon name="hi-search" scale="0.9" class="search-icon" />
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search by drug, doctor, or prescription number..."
                @input="handleSearch"
              />
              <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
                <v-icon name="hi-x" scale="0.8" />
              </button>
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
          <div class="bento-card prescriptions-card">
            <div class="card-header">
              <h3>{{ activeTabLabel }}</h3>
              <router-link v-if="activeTab !== 'all'" to="#" class="clear-filter" @click.prevent="setStatusFilter('all')">
                Clear filter
                <v-icon name="hi-x" scale="0.7" />
              </router-link>
            </div>

            <!-- Prescription Items -->
            <div v-if="paginatedPrescriptions.length" class="prescriptions-list">
              <div
                v-for="prescription in paginatedPrescriptions"
                :key="prescription._id"
                class="prescription-item"
                @click="viewPrescription(prescription)"
              >
                <div class="prescription-item__left">
                  <!-- Doctor/Source Avatar -->
                  <div class="prescription-avatar" :class="getAvatarClass(prescription)">
                    <img
                      v-if="getDoctorPhoto(prescription)"
                      :src="getDoctorPhoto(prescription)"
                      :alt="getDoctorName(prescription)"
                    />
                    <span v-else-if="prescription.type === 'INTERNAL'">{{ getDoctorInitials(prescription) }}</span>
                    <v-icon v-else-if="prescription.type === 'ORDER'" name="hi-shopping-cart" scale="1" />
                    <v-icon v-else name="hi-upload" scale="1" />
                  </div>

                  <div class="prescription-info">
                    <div class="prescription-header">
                      <span class="prescription-number">
                        {{ prescription.prescription_number || `#${prescription._id?.slice(-8).toUpperCase()}` }}
                      </span>
                      <span :class="['status-badge', getStatusClass(prescription)]">
                        {{ formatStatus(prescription) }}
                      </span>
                    </div>
                    <p class="prescription-source">
                      {{ getSourceDescription(prescription) }}
                    </p>
                    <!-- Linked Appointment Badge -->
                    <div class="linked-appointment-badge" v-if="hasLinkedAppointment(prescription)">
                      <v-icon name="hi-video-camera" scale="0.7" />
                      <span>From Consultation</span>
                    </div>
                    <!-- Medication Tags -->
                    <div class="medication-tags" v-if="prescription.items?.length">
                      <span
                        v-for="(item, index) in prescription.items?.slice(0, 2)"
                        :key="index"
                        class="med-tag"
                      >
                        {{ item.drug_name || item.drug }}
                      </span>
                      <span v-if="prescription.items?.length > 2" class="med-tag med-tag--more">
                        +{{ prescription.items.length - 2 }}
                      </span>
                    </div>
                    <div class="documents-badge" v-else-if="prescription.documents?.length">
                      <v-icon name="hi-document" scale="0.7" />
                      <span>{{ prescription.documents.length }} document(s)</span>
                    </div>
                  </div>
                </div>

                <div class="prescription-item__right">
                  <span class="prescription-date">{{ formatDate(prescription.created_at) }}</span>
                  <div class="prescription-amount" v-if="prescription.total_amount">
                    <span class="currency">NGN</span>
                    <span class="amount">{{ formatCurrency(prescription.total_amount) }}</span>
                  </div>
                  <v-icon name="hi-chevron-right" scale="0.9" class="chevron" />
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="empty-state">
              <div class="empty-icon">
                <v-icon name="ri-capsule-line" scale="2" />
              </div>
              <h3>No prescriptions found</h3>
              <p v-if="searchQuery || activeTab !== 'all'">Try adjusting your search or filters</p>
              <p v-else>You don't have any prescriptions yet</p>
              <button class="empty-action" @click="goToUploadPrescription">
                <v-icon name="hi-upload" scale="0.9" />
                Upload Prescription
              </button>
            </div>

            <!-- Pagination -->
            <div v-if="filteredPrescriptions.length > itemsPerPage" class="pagination">
              <div class="pagination-info">
                Showing {{ showingFrom }}-{{ showingTo }} of {{ filteredPrescriptions.length }}
              </div>
              <div class="pagination-controls">
                <button
                  class="page-btn"
                  :disabled="currentPage === 1"
                  @click="previousPage"
                >
                  <v-icon name="hi-chevron-left" scale="0.8" />
                </button>
                <div class="page-numbers">
                  <button
                    v-for="page in visiblePages"
                    :key="page"
                    :class="['page-num', { active: page === currentPage }]"
                    @click="goToPage(page)"
                  >
                    {{ page }}
                  </button>
                </div>
                <button
                  class="page-btn"
                  :disabled="currentPage === totalPages"
                  @click="nextPage"
                >
                  <v-icon name="hi-chevron-right" scale="0.8" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </template>
    </div>

    <!-- Mobile Floating Action Button -->
    <button class="fab" @click="goToUploadPrescription">
      <v-icon name="hi-plus" scale="1.2" />
    </button>
  </div>
</template>

<script>
import moment from "moment";
import { debounce } from "lodash";
import { mapGetters, mapActions } from "vuex";

export default {
  name: "PatientPrescriptions",
  emits: ["openSideNav"],
  data() {
    return {
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
    activeTabLabel() {
      const tab = this.statusTabs.find(t => t.value === this.activeTab);
      return tab ? `${tab.label} Prescriptions` : 'All Prescriptions';
    },
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
        // Show prescriptions linked to pharmacy orders
        result = result.filter(p =>
          p.type === 'ORDER' ||
          p.linked_pharmacy_order ||
          p.used_in_orders?.length > 0
        );
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
      this.currentPage = 1;
    },
  },
  created() {
    this.handleSearch = debounce(() => {}, 300);
  },
  mounted() {
    this.fetchPrescriptions();
  },
  methods: {
    ...mapActions("prescriptions", ["fetchPrescriptions"]),
    goToNotifications() {
      this.$router.push('/app/patient/notifications');
    },
    getTabCount(tabValue) {
      if (tabValue === 'all') return this.prescriptions.length;
      if (tabValue === 'internal') return this.prescriptions.filter(p => p.type === 'INTERNAL').length;
      if (tabValue === 'orders') return this.prescriptions.filter(p =>
        p.type === 'ORDER' || p.linked_pharmacy_order || p.used_in_orders?.length > 0
      ).length;
      if (tabValue === 'external') return this.prescriptions.filter(p => p.type === 'EXTERNAL').length;
      if (tabValue === 'pending_payment') return this.stats.pending_payment;
      if (tabValue === 'processing') return this.stats.processing;
      if (tabValue === 'delivered') return this.stats.delivered;
      return 0;
    },
    setStatusFilter(status) {
      this.activeTab = status;
      this.currentPage = 1;
    },
    clearSearch() {
      this.searchQuery = "";
      this.currentPage = 1;
    },
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.$nextTick(() => {
          const card = document.querySelector('.prescriptions-card');
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    goToUploadPrescription() {
      this.$router.push({
        path: '/app/patient/pharmacy/upload-prescription',
        query: { returnTo: '/app/patient/prescriptions' }
      });
    },
    viewPrescription(prescription) {
      // Get the ID - check multiple possible fields
      const id = prescription._id || prescription.id || prescription.prescription_id;

      if (!id) {
        console.error('Prescription has no ID:', prescription);
        return;
      }

      if (prescription.type === 'ORDER') {
        this.$router.push(`/app/patient/pharmacy/orders/${id}`);
      } else {
        this.$router.push(`/app/patient/prescriptions/details/${id}`);
      }
    },
    getAvatarClass(prescription) {
      if (prescription.type === 'INTERNAL') return 'avatar--doctor';
      if (prescription.type === 'ORDER') return 'avatar--order';
      return 'avatar--upload';
    },
    getSourceDescription(prescription) {
      if (prescription.type === 'INTERNAL') {
        return this.getDoctorName(prescription) + ' • ' + this.getDoctorSpecialty(prescription);
      }
      if (prescription.type === 'ORDER') {
        return prescription.pharmacy?.name || 'Pharmacy Order';
      }
      if (prescription.ocr_data?.doctor_name) {
        return 'Dr. ' + prescription.ocr_data.doctor_name;
      }
      return 'Uploaded prescription';
    },
    getDoctorPhoto(prescription) {
      // Check specialist_id with nested profile
      if (prescription.specialist_id?.profile) {
        const profile = prescription.specialist_id.profile;
        const photo = profile.profile_photo || profile.profile_image || profile.profileImage || profile.avatar;
        if (photo) return photo;
      }
      // Check specialist_id with direct photo fields (no nested profile)
      if (prescription.specialist_id) {
        const specialist = prescription.specialist_id;
        const photo = specialist.profile_photo || specialist.profile_image || specialist.profileImage || specialist.avatar;
        if (photo) return photo;
      }
      // Check prescribed_by with nested profile
      if (prescription.prescribed_by?.profile) {
        const profile = prescription.prescribed_by.profile;
        const photo = profile.profile_photo || profile.profile_image || profile.profileImage || profile.avatar;
        if (photo) return photo;
      }
      // Check prescribed_by with direct photo fields
      if (prescription.prescribed_by) {
        const prescriber = prescription.prescribed_by;
        const photo = prescriber.profile_photo || prescriber.profile_image || prescriber.profileImage || prescriber.avatar;
        if (photo) return photo;
      }
      // Check specialist field (some APIs return this)
      if (prescription.specialist?.profile) {
        const profile = prescription.specialist.profile;
        const photo = profile.profile_photo || profile.profile_image || profile.profileImage || profile.avatar;
        if (photo) return photo;
      }
      if (prescription.specialist) {
        const specialist = prescription.specialist;
        if (typeof specialist === 'object') {
          const photo = specialist.profile_photo || specialist.profile_image || specialist.profileImage || specialist.avatar;
          if (photo) return photo;
        }
      }
      return null;
    },
    hasLinkedAppointment(prescription) {
      return !!(
        prescription.appointment_id ||
        prescription.linked_appointments?.length > 0 ||
        prescription.related_appointments?.length > 0
      );
    },
    getDoctorName(prescription) {
      // Check specialist_id first (for specialist prescriptions)
      if (prescription.specialist_id?.profile) {
        const profile = prescription.specialist_id.profile;
        const firstName = profile.first_name || profile.firstName || '';
        const lastName = profile.last_name || profile.lastName || '';
        if (firstName || lastName) {
          return `Dr. ${firstName} ${lastName}`.trim();
        }
      }
      // Check prescribed_by (legacy field)
      if (prescription.prescribed_by?.profile) {
        const profile = prescription.prescribed_by.profile;
        const firstName = profile.first_name || profile.firstName || '';
        const lastName = profile.last_name || profile.lastName || '';
        if (firstName || lastName) {
          return `Dr. ${firstName} ${lastName}`.trim();
        }
      }
      return 'Doctor';
    },
    getDoctorInitials(prescription) {
      const name = this.getDoctorName(prescription);
      return name.replace('Dr. ', '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'DR';
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

      if (lowerStatus === 'approved' && prescription.type === 'EXTERNAL' && !prescription.used_in_order) {
        return 'Ready to Order';
      }

      const statusMap = {
        'pending': 'Pending Review',
        'verifying': 'Verifying',
        'verified': 'Verified',
        'verification_failed': 'Failed',
        'under_review': 'Under Review',
        'pharmacist_review': 'Under Review',
        'tier1_processing': 'Processing',
        'tier2_processing': 'Processing',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'expired': 'Expired',
        'used_in_order': 'Used',
        'pending_acceptance': 'Pending',
        'pending_payment': 'Pay Now',
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

      if (lowerStatus === 'approved' && prescription.type === 'EXTERNAL' && !prescription.used_in_order) {
        return 'status--ready';
      }

      if (['delivered', 'completed', 'approved', 'verified'].includes(lowerStatus)) {
        return 'status--success';
      }
      if (['pending', 'pending_payment', 'pending_acceptance', 'under_review', 'verifying'].includes(lowerStatus)) {
        return 'status--warning';
      }
      if (['processing', 'paid', 'dispensed', 'shipped', 'confirmed'].includes(lowerStatus)) {
        return 'status--info';
      }
      if (['cancelled', 'rejected', 'failed', 'verification_failed', 'expired'].includes(lowerStatus)) {
        return 'status--error';
      }
      return 'status--default';
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
$emerald: #10B981;
$emerald-light: #D1FAE5;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;
$violet: #8B5CF6;
$violet-light: #EDE9FE;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.prescriptions-page {
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
      border: 3px solid $sky-light;
      border-top-color: $sky;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: $sky;
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
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  position: relative;
  overflow: visible;
  min-height: 460px;
  margin-bottom: 24px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
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
      background: $emerald;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;

      &::after {
        content: '';
        position: absolute;
        inset: -4px;
        background: rgba($emerald, 0.4);
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
.prescription-orb {
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
    0 0 80px rgba(79, 195, 247, 0.3);
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
      color: $sky-dark;
      text-decoration: none;
      font-weight: 500;

      &:hover {
        color: $sky-darker;
      }
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

    &:hover {
      background: white;
      border-color: $sky;
      box-shadow: 0 4px 12px rgba($sky, 0.15);
      transform: translateY(-2px);
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

    &.sky { background: $sky-light; color: $sky-dark; }
    &.emerald { background: $emerald-light; color: $emerald; }
    &.violet { background: $violet-light; color: $violet; }
    &.amber { background: $amber-light; color: $amber; }
    &.whatsapp { background: #DCF8C6; color: #25D366; }
  }
}

// Filters Card
.filters-card {
  grid-column: span 12;

  .search-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    background: $bg;
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid #E2E8F0;
    margin-bottom: 16px;
    transition: all 0.2s;

    &:focus-within {
      border-color: $sky;
      box-shadow: 0 0 0 3px rgba($sky, 0.1);
    }

    .search-icon {
      color: $gray;
    }

    input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      color: $navy;
      background: transparent;

      &::placeholder {
        color: $light-gray;
      }
    }

    .clear-btn {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      border: none;
      background: #E2E8F0;
      color: $gray;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: $rose-light;
        color: $rose;
      }
    }
  }

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
      border-color: $sky;
      color: $sky-dark;
    }

    &.active {
      background: linear-gradient(135deg, $sky, $sky-dark);
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
    border-color: $sky-light;
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

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  span {
    font-size: 16px;
    font-weight: 600;
    color: white;
  }

  &.avatar--doctor {
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
  }

  &.avatar--order {
    background: $emerald-light;
    color: $emerald;
  }

  &.avatar--upload {
    background: $violet-light;
    color: $violet;
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

  &.status--ready {
    background: linear-gradient(135deg, $amber-light, #FDE68A);
    color: #B45309;
    animation: pulse-subtle 2s ease-in-out infinite;
  }

  &.status--default {
    background: #F1F5F9;
    color: $slate;
  }
}

@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
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
      background: $sky-light;
      border-color: $sky-light;
      color: $sky-dark;
      font-weight: 500;
    }
  }
}

.documents-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: $violet;
  background: $violet-light;
  padding: 4px 10px;
  border-radius: 8px;
}

.linked-appointment-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: $sky-dark;
  background: $sky-light;
  padding: 3px 8px;
  border-radius: 6px;
  margin-bottom: 6px;
}

.prescription-date {
  font-size: 13px;
  color: $gray;
}

.prescription-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;

  .currency {
    font-size: 12px;
    color: $gray;
  }

  .amount {
    font-size: 16px;
    font-weight: 700;
    color: $navy;
  }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 48px 24px;

  .empty-icon {
    width: 80px;
    height: 80px;
    background: $sky-light;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    color: $sky;
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
    background: linear-gradient(135deg, $sky, $sky-dark);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($sky, 0.3);
    }
  }
}

// Pagination
.pagination {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.pagination-info {
  font-size: 13px;
  color: $gray;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #E2E8F0;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $slate;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: $sky;
    color: $sky-dark;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-num {
  width: 36px;
  height: 36px;
  border: 1px solid #E2E8F0;
  background: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: $slate;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $sky;
    color: $sky-dark;
  }

  &.active {
    background: linear-gradient(135deg, $sky, $sky-dark);
    border-color: transparent;
    color: white;
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
  background: linear-gradient(135deg, $violet, darken($violet, 10%));
  color: white;
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba($violet, 0.4);
  cursor: pointer;
  z-index: 50;
  transition: all 0.2s;

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
