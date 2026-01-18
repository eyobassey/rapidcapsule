<template>
  <div class="page-content">
    <TopBar showButtons type="avatar" @open-side-nav="$emit('openSideNav')" />
    <loader v-if="isLoading" :useOverlay="false" style="position: absolute" />
    <div v-else class="page-content__body">
      <div class="prescription-details-container">
        <!-- Header -->
        <div class="page-header">
          <button class="back-btn" @click="$router.back()">
            <rc-icon icon-name="arrow-left" size="sm" />
          </button>
          <div class="header-content">
            <h1>{{ prescription.prescription_number }}</h1>
            <span :class="['status', `status--${prescription.status?.toLowerCase()}`]">
              {{ formatStatus(prescription.status) }}
            </span>
          </div>
          <div class="header-actions" v-if="canTakeActions">
            <div class="dropdown" v-if="showActionsDropdown">
              <button class="btn btn-secondary" @click="toggleActionsMenu">
                Actions
                <rc-icon icon-name="chevron-down" size="xs" />
              </button>
              <div v-if="actionsMenuOpen" class="dropdown-menu">
                <button
                  v-if="prescription.status === 'draft'"
                  @click="sendPaymentLink"
                >
                  Send Payment Link
                </button>
                <button
                  v-if="prescription.status === 'paid'"
                  @click="showDispenseDialog = true"
                >
                  Mark as Dispensed
                </button>
                <button
                  v-if="prescription.status === 'dispensed'"
                  @click="showShipDialog = true"
                >
                  Mark as Shipped
                </button>
                <button
                  v-if="prescription.status === 'shipped'"
                  @click="showDeliverDialog = true"
                >
                  Mark as Delivered
                </button>
                <button
                  v-if="['draft', 'pending_payment', 'paid', 'processing', 'dispensed'].includes(prescription.status)"
                  class="danger"
                  @click="showCancelDialog = true"
                >
                  Cancel Prescription
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Patient Info -->
        <div class="info-card">
          <h3>Patient Information</h3>
          <div class="patient-row">
            <div class="patient-avatar">
              <img
                v-if="prescription.patient?.profile_image"
                :src="prescription.patient.profile_image"
                :alt="prescription.patient?.full_name"
              />
              <span v-else>{{ getInitials(prescription.patient?.full_name) }}</span>
            </div>
            <div class="patient-details">
              <p class="name">{{ prescription.patient?.full_name }}</p>
              <p class="email">{{ prescription.patient?.email }}</p>
              <p class="phone">{{ prescription.patient?.phone || 'No phone' }}</p>
            </div>
            <router-link
              :to="`/app/specialist/pharmacy/patients/${getPatientId}`"
              class="view-patient-btn"
            >
              View Profile
            </router-link>
          </div>
        </div>

        <!-- Medications -->
        <div class="info-card">
          <h3>Medications ({{ prescription.items?.length || 0 }})</h3>
          <div class="medications-list">
            <div
              v-for="(item, index) in prescription.items"
              :key="index"
              class="medication-item"
            >
              <div class="medication-main">
                <div class="medication-info">
                  <h4>{{ item.drug_name }}</h4>
                  <p class="generic">{{ item.generic_name || item.drug_snapshot?.generic_name }} | {{ item.drug_strength || item.drug_snapshot?.strength }}</p>
                  <p class="manufacturer" v-if="item.manufacturer || item.drug_snapshot?.manufacturer">
                    <span class="mfg-label">Mfr:</span> {{ item.manufacturer || item.drug_snapshot?.manufacturer }}
                  </p>
                </div>
                <div class="medication-quantity">
                  <span class="qty">x{{ item.quantity }}</span>
                  <span class="price">NGN {{ formatCurrency(item.unit_price * item.quantity) }}</span>
                </div>
              </div>
              <div class="medication-details">
                <div class="detail">
                  <span class="label">Dosage:</span>
                  <span class="value">{{ item.dosage || 'Not specified' }}</span>
                </div>
                <div class="detail" v-if="item.frequency">
                  <span class="label">Frequency:</span>
                  <span class="value">{{ item.frequency }}</span>
                </div>
                <div class="detail" v-if="item.duration">
                  <span class="label">Duration:</span>
                  <span class="value">{{ item.duration }}</span>
                </div>
                <div class="detail" v-if="item.instructions || item.notes">
                  <span class="label">Instructions:</span>
                  <span class="value">{{ item.instructions || item.notes }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Info -->
        <div class="info-card">
          <h3>Payment Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Subtotal</span>
              <span class="value">NGN {{ formatCurrency(prescription.subtotal) }}</span>
            </div>
            <div class="info-item" v-if="prescription.delivery_fee">
              <span class="label">Delivery Fee</span>
              <span class="value">NGN {{ formatCurrency(prescription.delivery_fee) }}</span>
            </div>
            <div class="info-item total">
              <span class="label">Total Amount</span>
              <span class="value">NGN {{ formatCurrency(prescription.total_amount) }}</span>
            </div>
          </div>
          <div class="payment-status-row">
            <div class="status-item">
              <span class="label">Payment Method</span>
              <span class="value">{{ formatPaymentMethod(prescription.payment_method) }}</span>
            </div>
            <div class="status-item">
              <span class="label">Payment Status</span>
              <span :class="['payment-badge', `payment-badge--${prescription.payment_status?.toLowerCase()}`]">
                {{ formatPaymentStatus(prescription.payment_status) }}
              </span>
            </div>
          </div>
          <!-- Linked Pharmacy Order Reference -->
          <div class="linked-order-row" v-if="prescription.linked_pharmacy_order_number">
            <div class="linked-order-info">
              <span class="label">Linked Order</span>
              <span class="linked-order-number">{{ prescription.linked_pharmacy_order_number }}</span>
              <span class="linked-order-note">Patient paid via pharmacy checkout</span>
            </div>
          </div>
        </div>

        <!-- Delivery Info -->
        <div class="info-card" v-if="prescription.delivery">
          <h3>Delivery Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Delivery Type</span>
              <span class="value">{{ prescription.delivery.type === 'PICKUP' ? 'Pickup at Clinic' : 'Home Delivery' }}</span>
            </div>
            <div class="info-item" v-if="prescription.delivery.address">
              <span class="label">Address</span>
              <span class="value">{{ prescription.delivery.address }}</span>
            </div>
            <div class="info-item" v-if="prescription.delivery.tracking_number">
              <span class="label">Tracking Number</span>
              <span class="value">{{ prescription.delivery.tracking_number }}</span>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="info-card">
          <h3>Status Timeline</h3>
          <div class="timeline">
            <div
              v-for="event in statusTimeline"
              :key="event.status"
              :class="['timeline-item', { completed: event.completed, current: event.current }]"
            >
              <div class="timeline-marker">
                <rc-icon v-if="event.completed" icon-name="check" size="xs" />
              </div>
              <div class="timeline-content">
                <p class="event-status">{{ event.label }}</p>
                <p class="event-date" v-if="event.date">{{ formatDateTime(event.date) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="info-card" v-if="prescription.notes">
          <h3>Notes</h3>
          <p class="notes-text">{{ prescription.notes }}</p>
        </div>

        <!-- Dates -->
        <div class="info-card">
          <h3>Details</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Created</span>
              <span class="value">{{ formatDateTime(prescription.created_at) }}</span>
            </div>
            <div class="info-item" v-if="prescription.updated_at">
              <span class="label">Last Updated</span>
              <span class="value">{{ formatDateTime(prescription.updated_at) }}</span>
            </div>
            <div class="info-item" v-if="prescription.reservation_expires_at">
              <span class="label">Reservation Expires</span>
              <span class="value expiring">{{ formatDateTime(prescription.reservation_expires_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel Dialog -->
    <div v-if="showCancelDialog" class="dialog-overlay">
      <div class="dialog">
        <h3>Cancel Prescription</h3>
        <p>Are you sure you want to cancel this prescription? This action cannot be undone.</p>
        <div class="form-group">
          <label>Reason for cancellation</label>
          <textarea v-model="cancelReason" rows="3" placeholder="Enter reason..."></textarea>
        </div>
        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="showCancelDialog = false">Cancel</button>
          <button class="btn btn-danger" @click="cancelPrescription" :disabled="!cancelReason">
            Confirm Cancellation
          </button>
        </div>
      </div>
    </div>

    <!-- Dispense Dialog -->
    <div v-if="showDispenseDialog" class="dialog-overlay">
      <div class="dialog">
        <h3>Mark as Dispensed</h3>
        <p>Confirm that all medications have been dispensed.</p>
        <div class="form-group">
          <label>Notes (optional)</label>
          <textarea v-model="dispenseNotes" rows="2" placeholder="Any notes..."></textarea>
        </div>
        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="showDispenseDialog = false">Cancel</button>
          <button class="btn btn-primary" @click="markDispensed">Confirm</button>
        </div>
      </div>
    </div>

    <!-- Ship Dialog -->
    <div v-if="showShipDialog" class="dialog-overlay">
      <div class="dialog">
        <h3>Mark as Shipped</h3>
        <div class="form-group">
          <label>Tracking Number (optional)</label>
          <input v-model="trackingNumber" type="text" placeholder="Enter tracking number..." />
        </div>
        <div class="form-group">
          <label>Carrier (optional)</label>
          <input v-model="carrier" type="text" placeholder="e.g., DHL, FedEx..." />
        </div>
        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="showShipDialog = false">Cancel</button>
          <button class="btn btn-primary" @click="markShipped">Confirm</button>
        </div>
      </div>
    </div>

    <!-- Deliver Dialog -->
    <div v-if="showDeliverDialog" class="dialog-overlay">
      <div class="dialog">
        <h3>Mark as Delivered</h3>
        <p>Confirm that the prescription has been delivered to the patient.</p>
        <div class="form-group">
          <label>Notes (optional)</label>
          <textarea v-model="deliverNotes" rows="2" placeholder="Any notes..."></textarea>
        </div>
        <div class="dialog-actions">
          <button class="btn btn-secondary" @click="showDeliverDialog = false">Cancel</button>
          <button class="btn btn-primary" @click="markDelivered">Confirm</button>
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
  name: "PrescriptionDetails",
  components: {
    TopBar,
    Loader,
    RcIcon,
  },
  data() {
    return {
      isLoading: true,
      prescription: {},
      actionsMenuOpen: false,
      // Dialogs
      showCancelDialog: false,
      showDispenseDialog: false,
      showShipDialog: false,
      showDeliverDialog: false,
      // Form data
      cancelReason: "",
      dispenseNotes: "",
      trackingNumber: "",
      carrier: "",
      deliverNotes: "",
    };
  },
  computed: {
    prescriptionId() {
      return this.$route.params.id;
    },
    getPatientId() {
      const patientId = this.prescription.patient_id;
      if (!patientId) return '';
      // Handle ObjectId - could be string or object
      if (typeof patientId === 'string') return patientId;
      if (patientId._id) return patientId._id;
      if (patientId.$oid) return patientId.$oid;
      return String(patientId);
    },
    canTakeActions() {
      const status = this.prescription.status?.toLowerCase();
      return !["delivered", "cancelled"].includes(status);
    },
    showActionsDropdown() {
      const status = this.prescription.status?.toLowerCase();
      return ["draft", "pending_payment", "paid", "dispensed", "shipped"].includes(status);
    },
    statusTimeline() {
      const statuses = [
        { status: "draft", label: "Created" },
        { status: "pending_payment", label: "Pending Payment" },
        { status: "paid", label: "Paid" },
        { status: "processing", label: "Processing" },
        { status: "dispensed", label: "Dispensed" },
        { status: "shipped", label: "Shipped" },
        { status: "delivered", label: "Delivered" },
      ];

      const currentStatus = this.prescription.status?.toLowerCase();
      const currentIndex = statuses.findIndex(s => s.status === currentStatus);

      return statuses.map((s, index) => ({
        ...s,
        completed: index <= currentIndex, // Include current as completed (green)
        current: index === currentIndex,
        date: this.getStatusDate(s.status),
      }));
    },
  },
  async mounted() {
    await this.fetchPrescription();
    document.addEventListener("click", this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
  },
  methods: {
    async fetchPrescription() {
      try {
        this.isLoading = true;
        const response = await apiFactory.$_getSpecialistPrescriptionDetails(this.prescriptionId);
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.prescription = result;
        }
      } catch (error) {
        console.error("Error fetching prescription:", error);
        this.$toast.error("Failed to load prescription details");
      } finally {
        this.isLoading = false;
      }
    },
    toggleActionsMenu() {
      this.actionsMenuOpen = !this.actionsMenuOpen;
    },
    handleClickOutside(event) {
      if (!event.target.closest(".dropdown")) {
        this.actionsMenuOpen = false;
      }
    },
    getStatusDate(status) {
      const statusHistory = this.prescription.status_history || [];
      const entry = statusHistory.find(h => h.status === status);
      return entry?.changed_at;
    },
    async sendPaymentLink() {
      try {
        await apiFactory.$_sendPrescriptionPaymentLink(this.prescriptionId, {
          email: this.prescription.patient?.email,
        });
        this.$toast.success("Payment link sent to patient");
        this.actionsMenuOpen = false;
      } catch (error) {
        console.error("Error sending payment link:", error);
        this.$toast.error("Failed to send payment link");
      }
    },
    async cancelPrescription() {
      try {
        await apiFactory.$_cancelSpecialistPrescription(this.prescriptionId, {
          reason: this.cancelReason,
        });
        this.$toast.success("Prescription cancelled");
        this.showCancelDialog = false;
        await this.fetchPrescription();
      } catch (error) {
        console.error("Error cancelling prescription:", error);
        this.$toast.error("Failed to cancel prescription");
      }
    },
    async markDispensed() {
      try {
        await apiFactory.$_dispensePrescription(this.prescriptionId, {
          notes: this.dispenseNotes,
        });
        this.$toast.success("Prescription marked as dispensed");
        this.showDispenseDialog = false;
        await this.fetchPrescription();
      } catch (error) {
        console.error("Error marking dispensed:", error);
        this.$toast.error("Failed to update prescription");
      }
    },
    async markShipped() {
      try {
        await apiFactory.$_shipPrescription(this.prescriptionId, {
          tracking_number: this.trackingNumber,
          carrier: this.carrier,
        });
        this.$toast.success("Prescription marked as shipped");
        this.showShipDialog = false;
        await this.fetchPrescription();
      } catch (error) {
        console.error("Error marking shipped:", error);
        this.$toast.error("Failed to update prescription");
      }
    },
    async markDelivered() {
      try {
        await apiFactory.$_deliverPrescription(this.prescriptionId, {
          notes: this.deliverNotes,
        });
        this.$toast.success("Prescription marked as delivered");
        this.showDeliverDialog = false;
        await this.fetchPrescription();
      } catch (error) {
        console.error("Error marking delivered:", error);
        this.$toast.error("Failed to update prescription");
      }
    },
    getInitials(name) {
      if (!name) return "?";
      return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    },
    formatCurrency(amount) {
      if (!amount) return "0.00";
      return Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    formatDateTime(date) {
      if (!date) return "";
      return moment(date).format("MMM D, YYYY h:mm A");
    },
    formatStatus(status) {
      if (!status) return "";
      return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    },
    formatPaymentMethod(method) {
      const methods = {
        SPECIALIST_WALLET: "Wallet Payment",
        PATIENT_ONLINE: "Patient Online Payment",
        PATIENT_CASH: "Cash Payment",
      };
      return methods[method] || method || "Not set";
    },
    formatPaymentStatus(status) {
      const statuses = {
        PENDING: "Pending",
        PROCESSING: "Processing",
        COMPLETED: "Paid",
        FAILED: "Failed",
        REFUNDED: "Refunded",
      };
      return statuses[status] || status || "N/A";
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

.prescription-details-container {
  max-width: 800px;
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
    display: flex;
    align-items: center;
    gap: $size-12;

    h1 {
      font-size: $size-22;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }

  .header-actions {
    position: relative;
  }
}

.dropdown {
  position: relative;

  &-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: $size-4;
    background: $color-white;
    border-radius: $size-8;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    min-width: 180px;
    z-index: 100;
    overflow: hidden;

    button {
      display: block;
      width: 100%;
      padding: $size-12 $size-16;
      border: none;
      background: none;
      text-align: left;
      font-size: $size-15;
      color: $color-g-36;
      cursor: pointer;

      &:hover {
        background: $color-g-97;
      }

      &.danger {
        color: #ef4444;
      }
    }
  }
}

.status {
  font-size: $size-12;
  padding: $size-4 $size-12;
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

.info-card {
  background: $color-white;
  padding: $size-20;
  border-radius: $size-12;
  margin-bottom: $size-16;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-16;
  }
}

.patient-row {
  display: flex;
  align-items: center;
  gap: $size-16;
}

.patient-avatar {
  width: $size-56;
  height: $size-56;
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
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-white;
  }
}

.patient-details {
  flex: 1;

  .name {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }

  .email,
  .phone {
    font-size: $size-12;
    color: $color-g-54;
  }
}

.view-patient-btn {
  font-size: $size-15;
  color: $color-pri;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.medications-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.medication-item {
  padding: $size-16;
  background: $color-g-97;
  border-radius: $size-10;
}

.medication-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $size-12;
}

.medication-info {
  h4 {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-2;
  }

  .generic {
    font-size: $size-12;
    color: $color-g-54;
  }

  .manufacturer {
    font-size: $size-12;
    color: $color-g-67;
    margin-top: $size-2;

    .mfg-label {
      color: $color-g-54;
      font-weight: $fw-medium;
    }
  }
}

.medication-quantity {
  text-align: right;

  .qty {
    display: block;
    font-size: $size-15;
    color: $color-g-54;
  }

  .price {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }
}

.medication-details {
  border-top: 1px solid $color-g-90;
  padding-top: $size-12;

  .detail {
    display: flex;
    gap: $size-8;
    font-size: $size-12;
    margin-bottom: $size-4;

    &:last-child {
      margin-bottom: 0;
    }

    .label {
      color: $color-g-54;
      min-width: 80px;
    }

    .value {
      color: $color-g-36;
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $size-12;

  @include responsive(phone) {
    grid-template-columns: 1fr;
  }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: $size-4;

  .label {
    font-size: $size-12;
    color: $color-g-54;
  }

  .value {
    font-size: $size-15;
    font-weight: $fw-medium;
    color: $color-g-21;

    &.expiring {
      color: #d97706;
    }
  }

  &.total {
    grid-column: span 2;
    padding-top: $size-12;
    border-top: 1px solid $color-g-92;

    @include responsive(phone) {
      grid-column: span 1;
    }

    .value {
      font-size: $size-20;
      font-weight: $fw-bold;
      color: $color-pri;
    }
  }
}

.payment-status-row {
  display: flex;
  gap: $size-24;
  margin-top: $size-16;
  padding-top: $size-16;
  border-top: 1px solid $color-g-92;

  .status-item {
    .label {
      font-size: $size-12;
      color: $color-g-54;
      display: block;
      margin-bottom: $size-4;
    }

    .value {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-36;
    }
  }
}

.payment-badge {
  font-size: $size-12;
  padding: $size-4 $size-10;
  border-radius: $size-12;
  font-weight: $fw-medium;

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

.linked-order-row {
  margin-top: $size-12;
  padding: $size-12;
  background: rgba(#3b82f6, 0.08);
  border-radius: $size-8;
  border: 1px solid rgba(#3b82f6, 0.2);

  .linked-order-info {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $size-8;

    .label {
      font-size: $size-12;
      color: $color-g-54;
    }

    .linked-order-number {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: #2563eb;
    }

    .linked-order-note {
      font-size: $size-12;
      color: $color-g-54;
      flex-basis: 100%;
      margin-top: $size-4;
    }
  }
}

.timeline {
  position: relative;
  padding-left: $size-24;

  &::before {
    content: "";
    position: absolute;
    left: 7px;
    top: 0;
    bottom: 0;
    width: 2px;
    background: $color-g-90;
  }
}

.timeline-item {
  position: relative;
  padding-bottom: $size-20;

  &:last-child {
    padding-bottom: 0;
  }

  .timeline-marker {
    position: absolute;
    left: -24px;
    top: 0;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: $color-g-90;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.completed .timeline-marker,
  &.current .timeline-marker {
    background: #10b981;
    color: $color-white;
  }

  .timeline-content {
    .event-status {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-36;
    }

    .event-date {
      font-size: $size-12;
      color: $color-g-54;
      margin-top: $size-2;
    }
  }
}

.notes-text {
  font-size: $size-15;
  color: $color-g-44;
  line-height: 1.6;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: $color-white;
  padding: $size-24;
  border-radius: $size-16;
  max-width: 400px;
  width: 90%;

  h3 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-12;
  }

  > p {
    font-size: $size-15;
    color: $color-g-54;
    margin-bottom: $size-16;
  }
}

.form-group {
  margin-bottom: $size-16;

  label {
    display: block;
    font-size: $size-12;
    font-weight: $fw-medium;
    color: $color-g-44;
    margin-bottom: $size-6;
  }

  input,
  textarea {
    width: 100%;
    padding: $size-10 $size-12;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    font-size: $size-15;
    color: $color-g-21;

    &:focus {
      outline: none;
      border-color: $color-pri;
    }
  }

  textarea {
    resize: vertical;
  }
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: $size-12;
  margin-top: $size-20;
}

.btn {
  padding: $size-10 $size-20;
  border-radius: $size-8;
  font-size: $size-15;
  font-weight: $fw-medium;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: $size-8;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &-primary {
    background: $color-pri;
    color: $color-white;

    &:hover:not(:disabled) {
      background: darken($color-pri, 10%);
    }
  }

  &-secondary {
    background: $color-g-90;
    color: $color-g-36;

    &:hover:not(:disabled) {
      background: $color-g-85;
    }
  }

  &-danger {
    background: #ef4444;
    color: $color-white;

    &:hover:not(:disabled) {
      background: darken(#ef4444, 10%);
    }
  }
}
</style>
