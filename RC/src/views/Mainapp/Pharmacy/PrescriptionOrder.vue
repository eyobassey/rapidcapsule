<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Prescription Order"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="prescription-order-page">
        <!-- Step Indicator -->
        <div class="step-indicator">
          <div
            v-for="(step, index) in steps"
            :key="index"
            :class="['step', { active: currentStep === index, completed: currentStep > index }]"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <span class="step-label">{{ step }}</span>
          </div>
        </div>

        <!-- Step 1: Select Prescription -->
        <div class="step-content" v-if="currentStep === 0">
          <h2>Select Prescription</h2>
          <p class="step-description">Choose a prescription to order medications from</p>

          <!-- Available Prescriptions -->
          <div class="prescriptions-list" v-if="prescriptions.length > 0">
            <div
              v-for="prescription in prescriptions"
              :key="prescription._id"
              :class="['prescription-card', { selected: selectedPrescription?._id === prescription._id }]"
              @click="selectPrescription(prescription)"
            >
              <div class="prescription-header">
                <span class="prescription-id">{{ prescription.prescription_number }}</span>
                <span :class="['prescription-status', prescription.status?.toLowerCase()]">
                  {{ prescription.status }}
                </span>
              </div>
              <div class="prescription-details">
                <p class="doctor-name">Dr. {{ prescription.specialist?.profile?.first_name }} {{ prescription.specialist?.profile?.last_name }}</p>
                <p class="prescription-date">{{ formatDate(prescription.created_at) }}</p>
              </div>
              <div class="prescription-items">
                <span>{{ prescription.medications?.length || 0 }} medication(s)</span>
              </div>
            </div>
          </div>

          <!-- No Prescriptions -->
          <div v-if="prescriptions.length === 0 && !loadingPrescriptions" class="empty-state">
            <RCIcon name="file-text" />
            <h3>No prescriptions available</h3>
            <p>You don't have any active prescriptions to order from.</p>
          </div>

          <!-- Upload Option -->
          <div class="upload-section">
            <h3>Or Upload a Prescription</h3>
            <div class="upload-area" @click="triggerUpload" :class="{ 'has-file': uploadedFile }">
              <input
                type="file"
                ref="fileInput"
                @change="handleFileUpload"
                accept="image/*,.pdf"
                hidden
              />
              <RCIcon :name="uploadedFile ? 'check-circle' : 'upload'" />
              <span v-if="!uploadedFile">Click to upload prescription image or PDF</span>
              <span v-else>{{ uploadedFile.name }}</span>
              <button v-if="uploadedFile" class="remove-file" @click.stop="removeUploadedFile">
                <RCIcon name="x" />
              </button>
            </div>
            <p class="upload-note">Supported formats: JPG, PNG, PDF (max 10MB)</p>
          </div>
        </div>

        <!-- Step 2: Review Medications -->
        <div class="step-content" v-if="currentStep === 1">
          <h2>Review Medications</h2>
          <p class="step-description">Confirm the medications you want to order</p>

          <div class="medications-list">
            <div
              v-for="(medication, index) in selectedMedications"
              :key="index"
              class="medication-item"
            >
              <div class="medication-checkbox">
                <input
                  type="checkbox"
                  :id="`med-${index}`"
                  v-model="medication.selected"
                />
              </div>
              <label :for="`med-${index}`" class="medication-details">
                <h4>{{ medication.drug_name }}</h4>
                <p>{{ medication.dosage }} - {{ medication.frequency }}</p>
                <p class="duration">Duration: {{ medication.duration }}</p>
                <p class="instructions" v-if="medication.instructions">{{ medication.instructions }}</p>
              </label>
            </div>
          </div>

          <div class="prescription-note" v-if="selectedPrescription?.notes">
            <h4>Doctor's Notes</h4>
            <p>{{ selectedPrescription.notes }}</p>
          </div>
        </div>

        <!-- Step 3: Select Pharmacy -->
        <div class="step-content" v-if="currentStep === 2">
          <h2>Select Pharmacy</h2>
          <p class="step-description">Choose a pharmacy to fulfill your prescription</p>

          <div class="pharmacy-list">
            <div
              v-for="pharmacy in nearbyPharmacies"
              :key="pharmacy._id"
              :class="['pharmacy-card', { selected: selectedPharmacy?._id === pharmacy._id }]"
              @click="selectPharmacy(pharmacy)"
            >
              <div class="pharmacy-info">
                <h4>{{ pharmacy.name }}</h4>
                <p>{{ pharmacy.address }}</p>
                <div class="pharmacy-meta">
                  <span v-if="pharmacy.distance">
                    <RCIcon name="location" /> {{ formatDistance(pharmacy.distance) }}
                  </span>
                  <span :class="pharmacy.is_open ? 'open' : 'closed'">
                    {{ pharmacy.is_open ? 'Open' : 'Closed' }}
                  </span>
                </div>
              </div>
              <div class="select-indicator">
                <RCIcon :name="selectedPharmacy?._id === pharmacy._id ? 'check-circle' : 'circle'" />
              </div>
            </div>
          </div>

          <div class="loader-container" v-if="loadingPharmacies">
            <Loader :useOverlay="false" :rounded="true" />
          </div>
        </div>

        <!-- Step 4: Confirm & Submit -->
        <div class="step-content" v-if="currentStep === 3">
          <h2>Confirm Order</h2>
          <p class="step-description">Review your prescription order details</p>

          <!-- Order Summary -->
          <div class="order-summary">
            <div class="summary-section">
              <h4>Prescription</h4>
              <p>{{ selectedPrescription?.prescription_number || 'Uploaded Prescription' }}</p>
            </div>

            <div class="summary-section">
              <h4>Medications ({{ selectedMedicationsCount }})</h4>
              <ul>
                <li v-for="med in getSelectedMedications()" :key="med.drug_name">
                  {{ med.drug_name }} - {{ med.dosage }}
                </li>
              </ul>
            </div>

            <div class="summary-section">
              <h4>Pharmacy</h4>
              <p>{{ selectedPharmacy?.name }}</p>
              <p class="address">{{ selectedPharmacy?.address }}</p>
            </div>

            <div class="summary-section">
              <h4>Delivery Method</h4>
              <div class="delivery-options">
                <label :class="['delivery-option', { selected: deliveryMethod === 'DELIVERY' }]">
                  <input type="radio" v-model="deliveryMethod" value="DELIVERY" />
                  <span>Home Delivery</span>
                </label>
                <label :class="['delivery-option', { selected: deliveryMethod === 'PICKUP' }]">
                  <input type="radio" v-model="deliveryMethod" value="PICKUP" />
                  <span>Store Pickup</span>
                </label>
              </div>
            </div>

            <div class="summary-section" v-if="deliveryMethod === 'DELIVERY'">
              <h4>Delivery Address</h4>
              <textarea
                v-model="deliveryAddress"
                placeholder="Enter your delivery address..."
                rows="3"
              ></textarea>
            </div>

            <div class="summary-section">
              <h4>Contact Information</h4>
              <div class="contact-fields">
                <input type="text" v-model="contactName" placeholder="Full Name" />
                <input type="tel" v-model="contactPhone" placeholder="Phone Number" />
              </div>
            </div>
          </div>

          <div class="notice-box">
            <RCIcon name="info" />
            <p>
              The pharmacy will verify your prescription before processing.
              You may be contacted for any clarifications.
              Final pricing will be confirmed by the pharmacy.
            </p>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="navigation-buttons">
          <rc-button
            v-if="currentStep > 0"
            type="secondary"
            label="Back"
            @click="previousStep"
          />
          <rc-button
            v-if="currentStep < steps.length - 1"
            type="primary"
            :label="'Continue'"
            @click="nextStep"
            :disabled="!canProceed"
          />
          <rc-button
            v-if="currentStep === steps.length - 1"
            type="primary"
            label="Submit Order"
            @click="submitOrder"
            :loading="submitting"
            :disabled="!canSubmit"
          />
        </div>

        <!-- Loader -->
        <div class="loader-container" v-if="loadingPrescriptions">
          <Loader :useOverlay="false" :rounded="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
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
  name: "PrescriptionOrder",
  components: {
    TopBar,
    RcButton,
    Loader,
    RCIcon,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const route = useRoute();
    const fileInput = ref(null);

    const steps = ["Select Prescription", "Review Medications", "Select Pharmacy", "Confirm"];
    const currentStep = ref(0);
    const loadingPrescriptions = ref(false);
    const loadingPharmacies = ref(false);
    const submitting = ref(false);

    const prescriptions = ref([]);
    const selectedPrescription = ref(null);
    const uploadedFile = ref(null);
    const selectedMedications = ref([]);
    const nearbyPharmacies = ref([]);
    const selectedPharmacy = ref(null);
    const deliveryMethod = ref("DELIVERY");
    const deliveryAddress = ref("");
    const contactName = ref("");
    const contactPhone = ref("");

    const {
      "pharmacy/createPrescriptionOrder": createPrescriptionOrder,
      "pharmacy/fetchNearbyPharmacies": fetchNearbyPharmaciesAction,
    } = useMapActions();

    const {
      "userprofile": userProfile,
    } = useMapGetters();

    const selectedMedicationsCount = computed(() => {
      return selectedMedications.value.filter((m) => m.selected).length;
    });

    const canProceed = computed(() => {
      if (currentStep.value === 0) {
        return selectedPrescription.value || uploadedFile.value;
      }
      if (currentStep.value === 1) {
        return selectedMedicationsCount.value > 0;
      }
      if (currentStep.value === 2) {
        return selectedPharmacy.value;
      }
      return true;
    });

    const canSubmit = computed(() => {
      return (
        selectedPharmacy.value &&
        contactName.value &&
        contactPhone.value &&
        (deliveryMethod.value === "PICKUP" || deliveryAddress.value)
      );
    });

    const formatDate = (date) => {
      return moment(date).format("MMM D, YYYY");
    };

    const formatDistance = (distance) => {
      if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
      }
      return `${distance.toFixed(1)}km`;
    };

    const fetchPrescriptions = async () => {
      loadingPrescriptions.value = true;
      try {
        // Fetch user's prescriptions - this would call the prescriptions API
        // For now, using mock data
        prescriptions.value = [];
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
      } finally {
        loadingPrescriptions.value = false;
      }
    };

    const selectPrescription = (prescription) => {
      selectedPrescription.value = prescription;
      uploadedFile.value = null;
      // Pre-populate medications
      selectedMedications.value = (prescription.medications || []).map((med) => ({
        ...med,
        selected: true,
      }));
    };

    const triggerUpload = () => {
      fileInput.value?.click();
    };

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert("File size must be less than 10MB");
          return;
        }
        uploadedFile.value = file;
        selectedPrescription.value = null;
        selectedMedications.value = [];
      }
    };

    const removeUploadedFile = () => {
      uploadedFile.value = null;
      if (fileInput.value) {
        fileInput.value.value = "";
      }
    };

    const fetchPharmacies = async () => {
      loadingPharmacies.value = true;
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              await fetchNearbyPharmaciesAction({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                page: 1,
                limit: 20,
              });
            },
            () => {
              fetchNearbyPharmaciesAction({ page: 1, limit: 20 });
            }
          );
        } else {
          await fetchNearbyPharmaciesAction({ page: 1, limit: 20 });
        }
      } catch (error) {
        console.error("Error fetching pharmacies:", error);
      } finally {
        loadingPharmacies.value = false;
      }
    };

    const selectPharmacy = (pharmacy) => {
      selectedPharmacy.value = pharmacy;
    };

    const getSelectedMedications = () => {
      return selectedMedications.value.filter((m) => m.selected);
    };

    const previousStep = () => {
      if (currentStep.value > 0) {
        currentStep.value -= 1;
      }
    };

    const nextStep = () => {
      if (currentStep.value < steps.length - 1) {
        if (currentStep.value === 1) {
          fetchPharmacies();
        }
        currentStep.value += 1;
      }
    };

    const submitOrder = async () => {
      if (!canSubmit.value) return;

      submitting.value = true;
      try {
        const orderData = {
          pharmacy: selectedPharmacy.value._id,
          prescription: selectedPrescription.value?._id,
          prescription_file: uploadedFile.value,
          items: getSelectedMedications().map((med) => ({
            drug_name: med.drug_name,
            dosage: med.dosage,
            quantity: med.quantity || 1,
            instructions: med.instructions,
          })),
          delivery_method: deliveryMethod.value,
          delivery_address: deliveryMethod.value === "DELIVERY" ? deliveryAddress.value : undefined,
          contact_name: contactName.value,
          contact_phone: contactPhone.value,
        };

        const result = await createPrescriptionOrder(orderData);

        if (result && result._id) {
          router.push(`/app/patient/pharmacy/orders/${result._id}`);
        }
      } catch (error) {
        console.error("Error submitting order:", error);
        alert("Failed to submit order. Please try again.");
      } finally {
        submitting.value = false;
      }
    };

    onMounted(() => {
      fetchPrescriptions();

      // Pre-fill contact info
      if (userProfile.value) {
        contactName.value = `${userProfile.value.profile?.first_name || ""} ${userProfile.value.profile?.last_name || ""}`.trim();
        contactPhone.value = userProfile.value.profile?.phone_number || "";
      }
    });

    return {
      fileInput,
      steps,
      currentStep,
      loadingPrescriptions,
      loadingPharmacies,
      submitting,
      prescriptions,
      selectedPrescription,
      uploadedFile,
      selectedMedications,
      nearbyPharmacies,
      selectedPharmacy,
      deliveryMethod,
      deliveryAddress,
      contactName,
      contactPhone,
      selectedMedicationsCount,
      canProceed,
      canSubmit,
      formatDate,
      formatDistance,
      selectPrescription,
      triggerUpload,
      handleFileUpload,
      removeUploadedFile,
      selectPharmacy,
      getSelectedMedications,
      previousStep,
      nextStep,
      submitOrder,
    };
  },
};
</script>

<style scoped lang="scss">
.prescription-order-page {
  padding: $size-16;

  .step-indicator {
    display: flex;
    justify-content: space-between;
    margin-bottom: $size-32;
    padding: 0 $size-8;

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      position: relative;

      &:not(:last-child)::after {
        content: "";
        position: absolute;
        top: $size-14;
        left: 50%;
        width: 100%;
        height: 2px;
        background: $color-g-85;
      }

      &.completed::after {
        background: $color-pri;
      }

      .step-number {
        width: $size-28;
        height: $size-28;
        background: $color-g-85;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: $size-12;
        font-weight: 600;
        color: white;
        margin-bottom: $size-6;
        z-index: 1;
      }

      .step-label {
        font-size: $size-10;
        color: $color-g-67;
        text-align: center;
      }

      &.active {
        .step-number {
          background: $color-pri;
        }

        .step-label {
          color: $color-pri;
          font-weight: 500;
        }
      }

      &.completed {
        .step-number {
          background: $color-denote-green;
        }
      }
    }
  }

  .step-content {
    h2 {
      font-size: $size-20;
      font-weight: 700;
      color: $color-g-21;
      margin-bottom: $size-8;
    }

    .step-description {
      font-size: $size-14;
      color: $color-g-67;
      margin-bottom: $size-24;
    }
  }

  .prescriptions-list {
    display: flex;
    flex-direction: column;
    gap: $size-12;
    margin-bottom: $size-24;

    .prescription-card {
      background: $color-white;
      border-radius: $size-12;
      padding: $size-16;
      border: 2px solid transparent;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.selected {
        border-color: $color-pri;
        background: $color-pri-t4;
      }

      .prescription-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: $size-8;

        .prescription-id {
          font-size: $size-14;
          font-weight: 600;
          color: $color-g-21;
        }

        .prescription-status {
          font-size: $size-11;
          font-weight: 500;
          padding: $size-4 $size-8;
          border-radius: $size-4;

          &.active {
            background: #d4edda;
            color: #155724;
          }

          &.expired {
            background: #f8d7da;
            color: #721c24;
          }
        }
      }

      .prescription-details {
        margin-bottom: $size-8;

        .doctor-name {
          font-size: $size-14;
          color: $color-g-44;
        }

        .prescription-date {
          font-size: $size-12;
          color: $color-g-67;
        }
      }

      .prescription-items {
        font-size: $size-14;
        color: $color-pri;
        font-weight: 500;
      }
    }
  }

  .upload-section {
    background: $color-white;
    border-radius: $size-12;
    padding: $size-16;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    h3 {
      font-size: $size-16;
      font-weight: 600;
      color: $color-g-21;
      margin-bottom: $size-16;
    }

    .upload-area {
      border: 2px dashed $color-g-85;
      border-radius: $size-12;
      padding: $size-32;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;

      &:hover {
        border-color: $color-pri;
        background: $color-pri-t4;
      }

      &.has-file {
        border-color: $color-denote-green;
        border-style: solid;
      }

      svg {
        width: $size-40;
        height: $size-40;
        color: $color-g-67;
        margin-bottom: $size-12;
      }

      span {
        display: block;
        font-size: $size-14;
        color: $color-g-67;
      }

      .remove-file {
        position: absolute;
        top: $size-8;
        right: $size-8;
        width: $size-28;
        height: $size-28;
        background: $color-denote-red;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        svg {
          width: $size-16;
          height: $size-16;
          color: white;
          margin-bottom: 0;
        }
      }
    }

    .upload-note {
      margin-top: $size-8;
      font-size: $size-12;
      color: $color-g-67;
      text-align: center;
    }
  }

  .medications-list {
    display: flex;
    flex-direction: column;
    gap: $size-12;

    .medication-item {
      display: flex;
      gap: $size-12;
      background: $color-white;
      border-radius: $size-12;
      padding: $size-16;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .medication-checkbox {
        input {
          width: $size-20;
          height: $size-20;
          cursor: pointer;
        }
      }

      .medication-details {
        flex: 1;
        cursor: pointer;

        h4 {
          font-size: $size-15;
          font-weight: 600;
          color: $color-g-21;
          margin-bottom: $size-4;
        }

        p {
          font-size: $size-14;
          color: $color-g-67;
          margin-bottom: $size-2;
        }

        .duration {
          color: $color-g-44;
        }

        .instructions {
          font-style: italic;
          margin-top: $size-4;
        }
      }
    }
  }

  .prescription-note {
    margin-top: $size-24;
    padding: $size-16;
    background: #fff3cd;
    border-radius: $size-12;

    h4 {
      font-size: $size-14;
      font-weight: 600;
      color: #856404;
      margin-bottom: $size-8;
    }

    p {
      font-size: $size-14;
      color: #856404;
    }
  }

  .pharmacy-list {
    display: flex;
    flex-direction: column;
    gap: $size-12;

    .pharmacy-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: $color-white;
      border-radius: $size-12;
      padding: $size-16;
      border: 2px solid transparent;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.selected {
        border-color: $color-pri;
        background: $color-pri-t4;
      }

      .pharmacy-info {
        h4 {
          font-size: $size-15;
          font-weight: 600;
          color: $color-g-21;
          margin-bottom: $size-4;
        }

        p {
          font-size: $size-14;
          color: $color-g-67;
          margin-bottom: $size-8;
        }

        .pharmacy-meta {
          display: flex;
          gap: $size-12;

          span {
            font-size: $size-12;
            color: $color-g-67;
            display: flex;
            align-items: center;
            gap: $size-4;

            svg {
              width: $size-12;
              height: $size-12;
            }

            &.open {
              color: $color-denote-green;
            }

            &.closed {
              color: $color-denote-red;
            }
          }
        }
      }

      .select-indicator {
        svg {
          width: $size-24;
          height: $size-24;
          color: $color-g-85;
        }
      }

      &.selected .select-indicator svg {
        color: $color-pri;
      }
    }
  }

  .order-summary {
    background: $color-white;
    border-radius: $size-12;
    padding: $size-16;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    margin-bottom: $size-16;

    .summary-section {
      padding: $size-12 0;
      border-bottom: 1px solid $color-g-95;

      &:last-child {
        border-bottom: none;
      }

      h4 {
        font-size: $size-14;
        font-weight: 600;
        color: $color-g-44;
        margin-bottom: $size-8;
        text-transform: uppercase;
      }

      p {
        font-size: $size-14;
        color: $color-g-21;
      }

      .address {
        font-size: $size-14;
        color: $color-g-67;
      }

      ul {
        margin: 0;
        padding-left: $size-20;

        li {
          font-size: $size-14;
          color: $color-g-44;
          margin-bottom: $size-4;
        }
      }

      .delivery-options {
        display: flex;
        gap: $size-12;

        .delivery-option {
          flex: 1;
          padding: $size-12;
          border: 2px solid $color-g-85;
          border-radius: $size-8;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;

          input {
            display: none;
          }

          span {
            font-size: $size-14;
            color: $color-g-44;
          }

          &.selected {
            border-color: $color-pri;
            background: $color-pri-t4;

            span {
              color: $color-pri;
              font-weight: 500;
            }
          }
        }
      }

      textarea {
        width: 100%;
        padding: $size-12;
        border: 1px solid $color-g-85;
        border-radius: $size-8;
        font-size: $size-14;
        resize: none;

        &:focus {
          outline: none;
          border-color: $color-pri;
        }
      }

      .contact-fields {
        display: flex;
        flex-direction: column;
        gap: $size-12;

        input {
          padding: $size-12;
          border: 1px solid $color-g-85;
          border-radius: $size-8;
          font-size: $size-14;

          &:focus {
            outline: none;
            border-color: $color-pri;
          }
        }
      }
    }
  }

  .notice-box {
    display: flex;
    gap: $size-12;
    padding: $size-16;
    background: #e3f2fd;
    border-radius: $size-12;
    margin-bottom: $size-24;

    svg {
      width: $size-24;
      height: $size-24;
      color: #1976d2;
      flex-shrink: 0;
    }

    p {
      font-size: $size-14;
      color: #1565c0;
      line-height: 1.5;
    }
  }

  .navigation-buttons {
    display: flex;
    gap: $size-12;
    margin-top: $size-24;

    button {
      flex: 1;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: $size-32;
    text-align: center;

    svg {
      width: $size-56;
      height: $size-56;
      color: $color-g-67;
      margin-bottom: $size-16;
    }

    h3 {
      font-size: $size-18;
      font-weight: 600;
      margin-bottom: $size-8;
    }

    p {
      color: $color-g-67;
    }
  }
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: $size-32;
}
</style>
