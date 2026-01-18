<template>
  <div class="page-content">
    <TopBar showButtons type="avatar" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="create-prescription-container">
        <!-- Header -->
        <div class="page-header">
          <button class="back-btn" @click="goBack">
            <rc-icon icon-name="arrow-left" size="sm" />
          </button>
          <div class="header-content">
            <h1>Create Prescription</h1>
            <p>Add medications and set payment method</p>
          </div>
        </div>

        <!-- Progress Steps -->
        <div class="progress-steps">
          <div
            v-for="(step, index) in steps"
            :key="step.id"
            :class="['step', { active: currentStep === index, completed: currentStep > index }]"
          >
            <div class="step-number">{{ index + 1 }}</div>
            <span class="step-label">{{ step.label }}</span>
          </div>
        </div>

        <!-- Step Content -->
        <div class="step-content">
          <!-- Step 1: Select Patient -->
          <div v-if="currentStep === 0" class="step-panel">
            <h2>Select Patient</h2>
            <div class="search-patient">
              <div class="search-bar">
                <rc-icon icon-name="search" size="sm" />
                <input
                  v-model="patientSearch"
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  @input="searchPatients"
                />
              </div>
              <loader v-if="searchingPatients" :useOverlay="false" size="sm" />
              <div v-else-if="patientResults.length" class="patient-results">
                <div
                  v-for="patient in patientResults"
                  :key="patient._id"
                  :class="['patient-option', { selected: selectedPatient?._id === patient._id }]"
                  @click="selectPatient(patient)"
                >
                  <div class="patient-avatar">
                    <img v-if="patient.profile_image" :src="patient.profile_image" :alt="patient.full_name" />
                    <span v-else>{{ getInitials(patient.full_name) }}</span>
                  </div>
                  <div class="patient-info">
                    <p class="patient-name">{{ patient.full_name }}</p>
                    <p class="patient-email">{{ patient.email }}</p>
                  </div>
                  <rc-icon v-if="selectedPatient?._id === patient._id" icon-name="check" size="sm" class="check-icon" />
                </div>
              </div>
              <p v-else-if="patientSearch && !searchingPatients" class="no-results">
                No patients found
              </p>
            </div>

            <!-- Selected Patient Card -->
            <div v-if="selectedPatient" class="selected-patient-card">
              <h3>Selected Patient</h3>
              <div class="patient-details">
                <div class="patient-avatar large">
                  <img v-if="selectedPatient.profile_image" :src="selectedPatient.profile_image" :alt="selectedPatient.full_name" />
                  <span v-else>{{ getInitials(selectedPatient.full_name) }}</span>
                </div>
                <div class="patient-info">
                  <p class="patient-name">{{ selectedPatient.full_name }}</p>
                  <p class="patient-email">{{ selectedPatient.email }}</p>
                  <p class="patient-phone">{{ selectedPatient.phone || 'No phone' }}</p>
                </div>
              </div>
            </div>

            <!-- Pre-selected Drug Indicator -->
            <div v-if="preSelectedDrug" class="preselected-drug-card">
              <h3>
                <rc-icon icon-name="pill" size="sm" />
                Pre-selected Medication
              </h3>
              <div class="drug-preview">
                <div class="drug-image">
                  <img v-if="preSelectedDrug.primary_image" :src="preSelectedDrug.primary_image" :alt="preSelectedDrug.name" />
                  <rc-icon v-else icon-name="pill" size="md" />
                </div>
                <div class="drug-info">
                  <p class="drug-name">{{ preSelectedDrug.name }}</p>
                  <p class="drug-details">{{ preSelectedDrug.generic_name }} | {{ preSelectedDrug.strength }}</p>
                  <p class="drug-price">NGN {{ formatCurrency(preSelectedDrug.selling_price) }}</p>
                </div>
              </div>
              <p class="drug-note">This medication will be automatically added when you proceed to the next step.</p>
            </div>

            <loader v-if="loadingPreSelectedDrug" :useOverlay="false" size="sm" />
          </div>

          <!-- Step 2: Add Medications -->
          <div v-if="currentStep === 1" class="step-panel">
            <div class="medications-header">
              <h2>Add Medications</h2>
              <button class="btn btn-secondary" @click="openDrugSearch">
                <rc-icon icon-name="plus" size="sm" />
                Add Drug
              </button>
            </div>

            <!-- Drug Search Modal -->
            <div v-if="showDrugSearch" class="drug-search-modal">
              <div class="modal-overlay" @click="closeDrugSearch"></div>
              <div class="modal-content">
                <div class="modal-header">
                  <h3>Search Medications</h3>
                  <button class="close-btn" @click="closeDrugSearch">
                    <rc-icon icon-name="close" size="sm" />
                  </button>
                </div>
                <div class="modal-body">
                  <div class="search-bar">
                    <rc-icon icon-name="search" size="sm" />
                    <input
                      v-model="drugSearch"
                      type="text"
                      placeholder="Search by name or select a category..."
                      @input="searchDrugs"
                    />
                  </div>

                  <!-- Category Filter -->
                  <div class="category-filter-row">
                    <select
                      v-model="selectedCategory"
                      class="category-select"
                      @change="fetchDrugs"
                      :disabled="loadingCategories"
                    >
                      <option :value="null">All Categories</option>
                      <option
                        v-for="category in drugCategories"
                        :key="category._id"
                        :value="category._id"
                      >
                        {{ category.name }}
                      </option>
                    </select>
                    <span v-if="selectedCategory" class="clear-filter" @click="clearCategoryFilter">
                      <rc-icon icon-name="close" size="xs" />
                      Clear
                    </span>
                  </div>

                  <div class="search-divider" v-if="selectedCategory || drugSearch">
                    <span>{{ getSearchResultsLabel() }}</span>
                  </div>

                  <loader v-if="searchingDrugs" :useOverlay="false" size="sm" />
                  <div v-else-if="drugResults.length" class="drug-results">
                    <div
                      v-for="drug in drugResults"
                      :key="drug.batch_id || drug._id"
                      class="drug-option"
                      @click="addDrugToList(drug)"
                    >
                      <div class="drug-image">
                        <img v-if="drug.primary_image" :src="drug.primary_image" :alt="drug.name" />
                        <rc-icon v-else icon-name="pill" size="md" />
                      </div>
                      <div class="drug-info">
                        <p class="drug-name">{{ drug.name }}</p>
                        <p class="drug-details">{{ drug.generic_name }} | {{ drug.strength }}</p>
                        <p class="drug-manufacturer" v-if="drug.manufacturer">{{ drug.manufacturer }}</p>
                        <p class="drug-batch" v-if="drug.batch_number">
                          Batch: {{ drug.batch_number }}
                          <span v-if="drug.expiry_date" :class="['expiry-tag', drug.expiry_status]">
                            Exp: {{ formatDate(drug.expiry_date) }}
                          </span>
                        </p>
                        <p class="drug-price">NGN {{ formatCurrency(drug.selling_price) }}</p>
                      </div>
                      <div :class="['stock-badge', drug.quantity > 0 ? 'in-stock' : 'out-of-stock']">
                        {{ drug.quantity > 0 ? `${drug.quantity} in stock` : 'Out of stock' }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Medications List -->
            <div v-if="prescriptionItems.length" class="medications-list">
              <div
                v-for="(item, index) in prescriptionItems"
                :key="index"
                class="medication-card"
              >
                <div class="medication-header">
                  <h4>{{ item.drug_name }}</h4>
                  <button class="remove-btn" @click="removeDrug(index)">
                    <rc-icon icon-name="trash" size="sm" />
                  </button>
                </div>
                <p class="medication-details">{{ item.generic_name }} | {{ item.strength }}</p>
                <p class="medication-meta" v-if="item.manufacturer || item.batch_number">
                  <span v-if="item.manufacturer" class="mfr">{{ item.manufacturer }}</span>
                  <span v-if="item.batch_number" class="batch">Batch: {{ item.batch_number }}</span>
                </p>

                <div class="medication-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label>Quantity *</label>
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        min="1"
                        :max="item.available_quantity"
                        @change="updateTotals"
                      />
                      <span class="help-text">Available: {{ item.available_quantity }}</span>
                    </div>
                    <div class="form-group">
                      <label>Unit Price</label>
                      <input
                        :value="formatCurrency(item.unit_price)"
                        type="text"
                        disabled
                      />
                    </div>
                    <div class="form-group">
                      <label>Subtotal</label>
                      <input
                        :value="formatCurrency(item.quantity * item.unit_price)"
                        type="text"
                        disabled
                      />
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label>Dosage *</label>
                      <input
                        v-model="item.dosage"
                        type="text"
                        placeholder="e.g., 1 tablet, 5ml"
                      />
                    </div>
                    <div class="form-group">
                      <label>Frequency *</label>
                      <input
                        v-model="item.frequency"
                        type="text"
                        placeholder="e.g., twice daily"
                      />
                    </div>
                    <div class="form-group">
                      <label>Duration *</label>
                      <input
                        v-model="item.duration"
                        type="text"
                        placeholder="e.g., 7 days"
                      />
                    </div>
                  </div>
                  <div class="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      v-model="item.notes"
                      rows="2"
                      placeholder="Any special instructions..."
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-medications">
              <rc-icon icon-name="pill" size="lg" />
              <p>No medications added yet</p>
              <button class="btn btn-primary" @click="openDrugSearch">
                Add First Medication
              </button>
            </div>

            <!-- Order Summary -->
            <div v-if="prescriptionItems.length" class="order-summary">
              <h3>Order Summary</h3>
              <div class="summary-row">
                <span>Subtotal ({{ prescriptionItems.length }} items)</span>
                <span>NGN {{ formatCurrency(subtotal) }}</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span>NGN {{ formatCurrency(subtotal) }}</span>
              </div>
            </div>
          </div>

          <!-- Step 3: Payment & Delivery -->
          <div v-if="currentStep === 2" class="step-panel">
            <h2>Payment & Delivery</h2>

            <!-- Payment Method -->
            <div class="section-card">
              <h3>Payment Method</h3>
              <div class="payment-options">
                <div
                  :class="['payment-option', { selected: paymentMethod === 'specialist_wallet' }]"
                  @click="paymentMethod = 'specialist_wallet'"
                >
                  <div class="option-icon">
                    <rc-icon icon-name="wallet" size="md" />
                  </div>
                  <div class="option-info">
                    <h4>Pay from Wallet</h4>
                    <p>Use your pharmacy wallet balance</p>
                    <p class="wallet-balance">Balance: NGN {{ formatCurrency(walletBalance) }}</p>
                  </div>
                  <div class="option-check">
                    <rc-icon v-if="paymentMethod === 'specialist_wallet'" icon-name="check-circle" size="md" />
                  </div>
                </div>

                <div
                  :class="['payment-option', { selected: paymentMethod === 'patient_wallet', disabled: !selectedPatient || !allowPatientWalletCharge }]"
                  @click="selectPatientWalletPayment"
                >
                  <div class="option-icon patient-wallet">
                    <rc-icon icon-name="wallet" size="md" />
                  </div>
                  <div class="option-info">
                    <h4>Charge Patient Wallet</h4>
                    <p>Deduct from patient's wallet balance</p>
                    <loader v-if="loadingPatientWallet" :useOverlay="false" size="xs" />
                    <template v-else>
                      <p v-if="!allowPatientWalletCharge" class="charging-disabled-warning">
                        Patient has disabled wallet charges
                      </p>
                      <template v-else>
                        <p class="wallet-balance patient">Balance: NGN {{ formatCurrency(patientWalletBalance) }}</p>
                        <p v-if="patientWalletBalance < subtotal && patientWalletBalance > 0" class="partial-warning">
                          Partial payment - NGN {{ formatCurrency(subtotal - patientWalletBalance) }} remaining
                        </p>
                        <p v-if="patientWalletBalance === 0" class="no-balance-warning">
                          Patient has no wallet balance
                        </p>
                      </template>
                    </template>
                  </div>
                  <div class="option-check">
                    <rc-icon v-if="paymentMethod === 'patient_wallet'" icon-name="check-circle" size="md" />
                  </div>
                </div>

                <!-- Remaining Payment Method (for partial patient wallet payments) -->
                <div v-if="paymentMethod === 'patient_wallet' && patientWalletBalance > 0 && patientWalletBalance < subtotal" class="remaining-payment-options">
                  <label>How should the remaining amount be collected?</label>
                  <div class="remaining-options">
                    <div
                      :class="['remaining-option', { selected: remainingPaymentMethod === 'online' }]"
                      @click="remainingPaymentMethod = 'online'"
                    >
                      <rc-icon icon-name="credit-card" size="sm" />
                      <span>Online Payment</span>
                    </div>
                    <div
                      :class="['remaining-option', { selected: remainingPaymentMethod === 'cash' }]"
                      @click="remainingPaymentMethod = 'cash'"
                    >
                      <rc-icon icon-name="money" size="sm" />
                      <span>Cash on Delivery</span>
                    </div>
                  </div>
                </div>

                <div
                  :class="['payment-option', { selected: paymentMethod === 'patient_online' }]"
                  @click="paymentMethod = 'patient_online'"
                >
                  <div class="option-icon">
                    <rc-icon icon-name="credit-card" size="md" />
                  </div>
                  <div class="option-info">
                    <h4>Patient Online Payment</h4>
                    <p>Send payment link to patient</p>
                  </div>
                  <div class="option-check">
                    <rc-icon v-if="paymentMethod === 'patient_online'" icon-name="check-circle" size="md" />
                  </div>
                </div>

                <div
                  :class="['payment-option', { selected: paymentMethod === 'patient_cash' }]"
                  @click="paymentMethod = 'patient_cash'"
                >
                  <div class="option-icon">
                    <rc-icon icon-name="money" size="md" />
                  </div>
                  <div class="option-info">
                    <h4>Cash Payment</h4>
                    <p>Patient pays in cash on delivery/pickup</p>
                  </div>
                  <div class="option-check">
                    <rc-icon v-if="paymentMethod === 'patient_cash'" icon-name="check-circle" size="md" />
                  </div>
                </div>

                <!-- Send to Patient for Self-Service -->
                <div
                  :class="['payment-option send-to-patient', { selected: paymentMethod === 'send_to_patient' }]"
                  @click="paymentMethod = 'send_to_patient'"
                >
                  <div class="option-icon self-service">
                    <rc-icon icon-name="send" size="md" />
                  </div>
                  <div class="option-info">
                    <h4>Send to Patient</h4>
                    <p>Patient reviews, accepts, and pays themselves</p>
                    <p class="self-service-note">PDF generated, 48h validity</p>
                  </div>
                  <div class="option-check">
                    <rc-icon v-if="paymentMethod === 'send_to_patient'" icon-name="check-circle" size="md" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Delivery Info -->
            <div class="section-card">
              <h3>Delivery Information</h3>
              <div class="form-group">
                <label>Delivery Type</label>
                <select v-model="deliveryType" @change="onDeliveryTypeChange">
                  <option value="PICKUP">Pickup at Clinic</option>
                  <option value="DELIVERY">Home Delivery</option>
                  <option value="PICKUP_CENTER">Pickup at Pharmacy</option>
                </select>
              </div>

              <!-- Pickup Center Selection -->
              <div v-if="deliveryType === 'PICKUP_CENTER'" class="pickup-center-section">
                <label>Select Pickup Center</label>
                <div class="pickup-center-search">
                  <div class="search-bar">
                    <rc-icon icon-name="search" size="sm" />
                    <input
                      v-model="pickupCenterSearch"
                      type="text"
                      placeholder="Search pickup centers by city or state..."
                      @input="searchPickupCenters"
                    />
                  </div>
                  <button class="use-location-btn" type="button" @click="useLocationForPickup">
                    <rc-icon icon-name="navigation" size="sm" />
                    Near Me
                  </button>
                </div>

                <loader v-if="loadingPickupCenters" :useOverlay="false" size="sm" />

                <div v-else-if="pickupCenters.length > 0" class="pickup-centers-list">
                  <div
                    v-for="center in pickupCenters"
                    :key="center._id"
                    :class="['pickup-center-option', { selected: selectedPickupCenterId === center._id }]"
                    @click="selectPickupCenter(center)"
                  >
                    <div class="pickup-center-radio">
                      <input
                        type="radio"
                        :id="`pickup-${center._id}`"
                        :value="center._id"
                        v-model="selectedPickupCenterId"
                      />
                    </div>
                    <div class="pickup-center-info">
                      <h4>{{ center.name }}</h4>
                      <p class="center-address">{{ formatPickupCenterAddress(center.address) }}</p>
                      <div class="center-meta">
                        <span v-if="center.distance" class="distance">
                          <rc-icon icon-name="navigation" size="xs" />
                          {{ formatDistance(center.distance) }}
                        </span>
                        <span v-if="center.pickup_center_settings?.handling_fee" class="handling-fee">
                          Fee: NGN {{ formatCurrency(center.pickup_center_settings.handling_fee) }}
                        </span>
                      </div>
                    </div>
                    <rc-icon v-if="selectedPickupCenterId === center._id" icon-name="check-circle" size="sm" class="selected-check" />
                  </div>
                </div>

                <div v-else-if="pickupCenterSearch" class="no-pickup-centers">
                  <rc-icon icon-name="map-pin" size="md" />
                  <p>No pickup centers found</p>
                  <span>Try searching in a different location</span>
                </div>

                <!-- Selected Pickup Center Display -->
                <div v-if="selectedPickupCenter" class="selected-pickup-center">
                  <h4>Selected Pickup Center</h4>
                  <div class="pickup-details">
                    <p class="center-name">{{ selectedPickupCenter.name }}</p>
                    <p class="center-address">{{ formatPickupCenterAddress(selectedPickupCenter.address) }}</p>
                    <p v-if="selectedPickupCenter.contact?.phone" class="center-phone">
                      {{ selectedPickupCenter.contact.phone }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Home Delivery Address Section -->
              <div v-if="deliveryType === 'DELIVERY'" class="delivery-address-section">
                <!-- Saved Addresses -->
                <div v-if="savedAddresses.length > 0 || profileAddress" class="saved-addresses">
                  <label>Select an Address</label>
                  <div class="address-options">
                    <!-- Profile Address -->
                    <div
                      v-if="profileAddress"
                      :class="['address-option', { selected: selectedAddressId === 'profile_address' }]"
                      @click="selectAddress(profileAddress)"
                    >
                      <div class="address-option__header">
                        <span class="address-label">{{ profileAddress.label }}</span>
                        <span class="profile-badge">From Profile</span>
                      </div>
                      <div class="address-option__details">
                        <p class="recipient">{{ profileAddress.recipient_name }}</p>
                        <p class="address-line">{{ profileAddress.street }}</p>
                        <p class="address-line">{{ formatAddressLine(profileAddress) }}</p>
                        <p class="phone" v-if="profileAddress.phone">{{ profileAddress.phone }}</p>
                      </div>
                      <rc-icon v-if="selectedAddressId === 'profile_address'" icon-name="check-circle" size="sm" class="selected-check" />
                    </div>

                    <!-- Saved Addresses -->
                    <div
                      v-for="address in savedAddresses"
                      :key="address._id"
                      :class="['address-option', { selected: selectedAddressId === address._id }]"
                      @click="selectAddress(address)"
                    >
                      <div class="address-option__header">
                        <span class="address-label">{{ address.label }}</span>
                        <span v-if="address.is_default" class="default-badge">Default</span>
                      </div>
                      <div class="address-option__details">
                        <p class="recipient">{{ address.recipient_name }}</p>
                        <p class="address-line">{{ address.street }}</p>
                        <p class="address-line">{{ formatAddressLine(address) }}</p>
                        <p class="phone" v-if="address.phone">{{ address.phone }}</p>
                      </div>
                      <rc-icon v-if="selectedAddressId === address._id" icon-name="check-circle" size="sm" class="selected-check" />
                    </div>

                    <!-- Add New Address Option -->
                    <div
                      :class="['address-option add-new', { selected: selectedAddressId === 'new' }]"
                      @click="selectNewAddress"
                    >
                      <rc-icon icon-name="plus" size="md" />
                      <span>Add New Address</span>
                    </div>
                  </div>
                </div>

                <!-- New Address Form -->
                <div v-if="selectedAddressId === 'new' || (!savedAddresses.length && !profileAddress)" class="new-address-form">
                  <h4>{{ savedAddresses.length || profileAddress ? 'New Delivery Address' : 'Delivery Address' }}</h4>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Address Label *</label>
                      <select v-model="newAddress.label">
                        <option value="">Select label</option>
                        <option value="Home">Home</option>
                        <option value="Office">Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div class="form-group flex-2">
                      <label>Recipient Name *</label>
                      <input
                        v-model="newAddress.recipient_name"
                        type="text"
                        placeholder="Full name of person receiving delivery"
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group flex-2">
                      <label>Phone Number *</label>
                      <input
                        v-model="newAddress.phone"
                        type="tel"
                        placeholder="e.g., 08012345678"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Street Address *</label>
                    <input
                      v-model="newAddress.street"
                      type="text"
                      placeholder="House number, street name, landmark"
                    />
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>City *</label>
                      <input
                        v-model="newAddress.city"
                        type="text"
                        placeholder="City"
                      />
                    </div>
                    <div class="form-group">
                      <label>State *</label>
                      <select v-model="newAddress.state">
                        <option value="">Select state</option>
                        <option v-for="state in nigerianStates" :key="state" :value="state">{{ state }}</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Postal Code</label>
                      <input
                        v-model="newAddress.postal_code"
                        type="text"
                        placeholder="Optional"
                      />
                    </div>
                    <div class="form-group flex-2">
                      <label>Additional Info</label>
                      <input
                        v-model="newAddress.additional_info"
                        type="text"
                        placeholder="e.g., Gate code, building color"
                      />
                    </div>
                  </div>

                  <div class="form-group checkbox-group" v-if="savedAddresses.length > 0 || profileAddress">
                    <label class="checkbox-label">
                      <input type="checkbox" v-model="saveNewAddress" />
                      <span>Save this address for future use</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="section-card">
              <h3>Prescription Notes</h3>
              <div class="form-group">
                <label>Notes for Patient (Optional)</label>
                <textarea
                  v-model="prescriptionNotes"
                  rows="3"
                  placeholder="Any additional notes for the patient..."
                ></textarea>
              </div>
            </div>

            <!-- Final Summary -->
            <div class="final-summary">
              <h3>Final Summary</h3>
              <div class="summary-details">
                <div class="summary-item">
                  <span class="label">Patient</span>
                  <span class="value">{{ selectedPatient?.full_name }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Items</span>
                  <span class="value">{{ prescriptionItems.length }} medications</span>
                </div>
                <div class="summary-item">
                  <span class="label">Payment Method</span>
                  <span class="value">{{ formatPaymentMethod(paymentMethod) }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">Delivery</span>
                  <span class="value">{{ formatDeliveryType(deliveryType) }}</span>
                </div>
                <div v-if="deliveryType === 'DELIVERY' && deliveryAddressForSubmit" class="summary-item address">
                  <span class="label">Delivery Address</span>
                  <div class="value address-preview">
                    <p>{{ deliveryAddressForSubmit.recipient_name }}</p>
                    <p>{{ deliveryAddressForSubmit.street }}</p>
                    <p>{{ formatAddressLine(deliveryAddressForSubmit) }}</p>
                    <p>{{ deliveryAddressForSubmit.phone }}</p>
                  </div>
                </div>
                <div v-if="deliveryType === 'PICKUP_CENTER' && selectedPickupCenter" class="summary-item address">
                  <span class="label">Pickup Center</span>
                  <div class="value address-preview">
                    <p>{{ selectedPickupCenter.name }}</p>
                    <p>{{ formatPickupCenterAddress(selectedPickupCenter.address) }}</p>
                    <p v-if="selectedPickupCenter.contact?.phone">{{ selectedPickupCenter.contact.phone }}</p>
                  </div>
                </div>
                <div class="summary-item total">
                  <span class="label">Total Amount</span>
                  <span class="value">NGN {{ formatCurrency(subtotal) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="navigation-buttons">
          <button
            v-if="currentStep > 0"
            class="btn btn-secondary"
            @click="prevStep"
          >
            Back
          </button>
          <div class="spacer"></div>
          <button
            v-if="currentStep < steps.length - 1"
            class="btn btn-primary"
            :disabled="!canProceed"
            @click="nextStep"
          >
            Continue
          </button>
          <button
            v-else
            class="btn btn-primary"
            :disabled="!canSubmit || submitting"
            @click="submitPrescription"
          >
            {{ submitting ? 'Creating...' : 'Create Prescription' }}
          </button>
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
import { debounce } from "lodash";

export default {
  name: "CreatePrescription",
  components: {
    TopBar,
    Loader,
    RcIcon,
  },
  data() {
    return {
      currentStep: 0,
      steps: [
        { id: "patient", label: "Select Patient" },
        { id: "medications", label: "Add Medications" },
        { id: "payment", label: "Payment & Delivery" },
      ],
      // Patient Selection
      patientSearch: "",
      searchingPatients: false,
      patientResults: [],
      selectedPatient: null,
      // Drug Selection
      showDrugSearch: false,
      drugSearch: "",
      searchingDrugs: false,
      drugResults: [],
      drugCategories: [],
      selectedCategory: null,
      loadingCategories: false,
      // Pre-selected drug from URL
      preSelectedDrug: null,
      loadingPreSelectedDrug: false,
      // Prescription Items
      prescriptionItems: [],
      // Payment & Delivery
      paymentMethod: "specialist_wallet",
      deliveryType: "PICKUP",
      prescriptionNotes: "",
      walletBalance: 0,
      // Patient Wallet
      patientWalletBalance: 0,
      loadingPatientWallet: false,
      remainingPaymentMethod: "online",
      allowPatientWalletCharge: true,
      // Delivery Address
      savedAddresses: [],
      profileAddress: null,
      selectedAddressId: null,
      selectedAddress: null,
      saveNewAddress: true,
      newAddress: {
        label: "Home",
        recipient_name: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        postal_code: "",
        additional_info: "",
      },
      nigerianStates: [
        "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
        "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe",
        "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara",
        "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau",
        "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
      ],
      // Pickup Center
      pickupCenterSearch: "",
      pickupCenters: [],
      loadingPickupCenters: false,
      selectedPickupCenter: null,
      selectedPickupCenterId: null,
      // Submission
      submitting: false,
    };
  },
  computed: {
    subtotal() {
      return this.prescriptionItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
      }, 0);
    },
    canProceed() {
      if (this.currentStep === 0) {
        return !!this.selectedPatient;
      }
      if (this.currentStep === 1) {
        return this.prescriptionItems.length > 0 &&
          this.prescriptionItems.every(item => item.quantity > 0 && item.dosage && item.frequency && item.duration);
      }
      return true;
    },
    canSubmit() {
      if (!this.canProceed || !this.paymentMethod) return false;

      // Validate delivery address if home delivery is selected
      if (this.deliveryType === 'DELIVERY') {
        if (this.selectedAddressId === 'new' || (!this.savedAddresses.length && !this.profileAddress)) {
          // Validate new address form
          const addr = this.newAddress;
          return addr.label && addr.recipient_name && addr.phone && addr.street && addr.city && addr.state;
        } else {
          // Must have selected an existing address
          return !!this.selectedAddressId;
        }
      }

      // Validate pickup center if pickup at pharmacy is selected
      if (this.deliveryType === 'PICKUP_CENTER') {
        return !!this.selectedPickupCenterId;
      }

      return true;
    },
    deliveryAddressForSubmit() {
      if (this.deliveryType !== 'DELIVERY') return null;

      // If using a saved address or profile address
      if (this.selectedAddressId && this.selectedAddressId !== 'new') {
        return this.selectedAddress;
      }

      // If using new address form
      return {
        ...this.newAddress,
        country: 'Nigeria',
      };
    },
  },
  async mounted() {
    // Check for pre-selected patient from query params
    const patientId = this.$route.query.patient;
    if (patientId) {
      await this.loadPatient(patientId);
      await this.loadPatientAddresses(patientId);
    }

    // Check for pre-selected drug from query params
    const drugId = this.$route.query.drug;
    const batchId = this.$route.query.batch;
    if (drugId) {
      await this.loadPreSelectedDrug(drugId, batchId);
    }

    await this.fetchWalletBalance();
  },
  created() {
    this.debouncedPatientSearch = debounce(this.fetchPatients, 300);
    this.debouncedDrugSearch = debounce(this.fetchDrugs, 300);
  },
  methods: {
    async loadPatient(patientId) {
      try {
        const response = await apiFactory.$_getPharmacyPatientDetails(patientId);
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.selectedPatient = result;
        }
      } catch (error) {
        console.error("Error loading patient:", error);
      }
    },
    async loadPreSelectedDrug(drugId, batchId = null) {
      try {
        this.loadingPreSelectedDrug = true;
        const params = {};
        if (batchId) {
          params.batch_id = batchId;
        }
        const response = await apiFactory.$_getPharmacyDrugDetails(drugId, params);
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.preSelectedDrug = {
            ...result,
            batch_id: batchId || result.batch_id,
          };
          this.$toast.info(`${result.name} will be added to your prescription`);
        }
      } catch (error) {
        console.error("Error loading pre-selected drug:", error);
        this.$toast.error("Failed to load the selected medication");
      } finally {
        this.loadingPreSelectedDrug = false;
      }
    },
    addPreSelectedDrugToList() {
      if (!this.preSelectedDrug) return;

      const drug = this.preSelectedDrug;

      // Check if drug is out of stock
      if (drug.is_out_of_stock || drug.quantity === 0) {
        this.$toast.error("This medication is out of stock");
        this.preSelectedDrug = null;
        return;
      }

      // Check if already added
      const duplicateKey = drug.batch_id ? `${drug._id}-${drug.batch_id}` : drug._id;
      const exists = this.prescriptionItems.find(item => {
        const itemKey = item.batch_id ? `${item.drug_id}-${item.batch_id}` : item.drug_id;
        return itemKey === duplicateKey;
      });

      if (exists) {
        this.$toast.warning("This medication is already in the list");
        this.preSelectedDrug = null;
        return;
      }

      // Add to prescription items
      this.prescriptionItems.push({
        drug_id: drug._id,
        batch_id: drug.batch_id || null,
        batch_number: drug.batch_number || null,
        drug_name: drug.name,
        generic_name: drug.generic_name,
        strength: drug.strength,
        dosage_form: drug.dosage_form,
        manufacturer: drug.manufacturer || null,
        unit_price: drug.selling_price,
        quantity: 1,
        available_quantity: drug.quantity,
        expiry_date: drug.expiry_date || null,
        dosage: "",
        frequency: "",
        duration: "",
        notes: "",
      });

      // Clear the pre-selected drug
      this.preSelectedDrug = null;
    },
    async fetchWalletBalance() {
      try {
        const response = await apiFactory.$_getSpecialistWallet();
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.walletBalance = result.available_balance || 0;
        }
      } catch (error) {
        console.error("Error fetching wallet:", error);
      }
    },
    async fetchPatientWalletBalance(patientId) {
      if (!patientId) return;
      try {
        this.loadingPatientWallet = true;
        const response = await apiFactory.$_getPatientWalletBalance(patientId);
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.patientWalletBalance = result.available_balance || 0;
          this.allowPatientWalletCharge = result.allow_specialist_charge !== false;
        }
      } catch (error) {
        console.error("Error fetching patient wallet:", error);
        this.patientWalletBalance = 0;
        this.allowPatientWalletCharge = true;
      } finally {
        this.loadingPatientWallet = false;
      }
    },
    selectPatientWalletPayment() {
      if (!this.selectedPatient) {
        this.$toast.warning("Please select a patient first");
        return;
      }
      if (!this.allowPatientWalletCharge) {
        this.$toast.warning("Patient has disabled specialist wallet charges");
        return;
      }
      if (this.patientWalletBalance === 0) {
        this.$toast.warning("Patient has no wallet balance");
        return;
      }
      this.paymentMethod = "patient_wallet";
    },
    searchPatients() {
      this.debouncedPatientSearch();
    },
    async fetchPatients() {
      if (!this.patientSearch) {
        this.patientResults = [];
        return;
      }
      try {
        this.searchingPatients = true;
        const response = await apiFactory.$_searchPharmacyPatients({
          search: this.patientSearch,
          type: 'all', // Search all patients, not just those with appointments
          limit: 10,
        });
        // Backend returns: { statusCode, message, data: { total, docs, pages, perPage, currentPage } }
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.patientResults = result.docs || [];
        }
      } catch (error) {
        console.error("Error searching patients:", error);
      } finally {
        this.searchingPatients = false;
      }
    },
    selectPatient(patient) {
      this.selectedPatient = patient;
      this.patientSearch = "";
      this.patientResults = [];
      // Reset and load delivery addresses for the selected patient
      this.resetDeliveryAddresses();
      this.loadPatientAddresses(patient._id);
      // Fetch patient wallet balance
      this.fetchPatientWalletBalance(patient._id);
    },
    async loadPatientAddresses(patientId) {
      try {
        const response = await apiFactory.$_getPatientDeliveryAddresses(patientId);
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.savedAddresses = result.addresses || [];
          this.profileAddress = result.profile_address;

          // Pre-select default address if available
          const defaultAddr = this.savedAddresses.find(a => a.is_default);
          if (defaultAddr) {
            this.selectAddress(defaultAddr);
          } else if (this.profileAddress) {
            this.selectAddress(this.profileAddress);
          }
        }
      } catch (error) {
        console.error("Error loading patient addresses:", error);
      }
    },
    resetDeliveryAddresses() {
      this.savedAddresses = [];
      this.profileAddress = null;
      this.selectedAddressId = null;
      this.selectedAddress = null;
      this.newAddress = {
        label: "Home",
        recipient_name: "",
        phone: "",
        street: "",
        city: "",
        state: "",
        postal_code: "",
        additional_info: "",
      };
    },
    selectAddress(address) {
      this.selectedAddressId = address._id;
      this.selectedAddress = {
        recipient_name: address.recipient_name,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        country: address.country || 'Nigeria',
        postal_code: address.postal_code || '',
        additional_info: address.additional_info || '',
      };
    },
    selectNewAddress() {
      this.selectedAddressId = 'new';
      this.selectedAddress = null;
      // Pre-fill with patient info if available
      if (this.selectedPatient) {
        this.newAddress.recipient_name = this.selectedPatient.full_name || '';
        this.newAddress.phone = this.selectedPatient.phone || '';
      }
    },
    async saveDeliveryAddress() {
      if (!this.selectedPatient || !this.saveNewAddress) return null;

      try {
        const response = await apiFactory.$_addPatientDeliveryAddress(
          this.selectedPatient._id,
          this.newAddress
        );
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.savedAddresses.push(result);
          return result;
        }
      } catch (error) {
        console.error("Error saving address:", error);
      }
      return null;
    },
    openDrugSearch() {
      this.showDrugSearch = true;
      this.fetchDrugCategories();
    },
    closeDrugSearch() {
      this.showDrugSearch = false;
      this.drugSearch = "";
      this.drugResults = [];
      this.selectedCategory = null;
    },
    searchDrugs() {
      this.debouncedDrugSearch();
    },
    async fetchDrugCategories() {
      if (this.drugCategories.length > 0) return; // Already loaded
      try {
        this.loadingCategories = true;
        const response = await apiFactory.$_getPharmacyDrugCategories();
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.drugCategories = result || [];
        }
      } catch (error) {
        console.error("Error fetching drug categories:", error);
      } finally {
        this.loadingCategories = false;
      }
    },
    clearCategoryFilter() {
      this.selectedCategory = null;
      this.fetchDrugs();
    },
    getSearchResultsLabel() {
      if (this.selectedCategory && this.drugSearch) {
        const category = this.drugCategories.find(c => c._id === this.selectedCategory);
        return `Results in "${category?.name || 'Category'}"`;
      }
      if (this.selectedCategory) {
        const category = this.drugCategories.find(c => c._id === this.selectedCategory);
        return `Showing "${category?.name || 'Category'}"`;
      }
      return 'Search Results';
    },
    async fetchDrugs() {
      // Allow search by category OR text
      if (!this.drugSearch && !this.selectedCategory) {
        this.drugResults = [];
        return;
      }
      try {
        this.searchingDrugs = true;
        const params = {
          stock_status: "in_stock",
          limit: 20,
        };
        if (this.drugSearch) {
          params.search = this.drugSearch;
        }
        if (this.selectedCategory) {
          params.category = this.selectedCategory;
        }
        const response = await apiFactory.$_searchPharmacyDrugs(params);
        // Backend returns: { statusCode, message, data: { total, docs, pages, perPage, currentPage } }
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.drugResults = result.docs || [];
        }
      } catch (error) {
        console.error("Error searching drugs:", error);
      } finally {
        this.searchingDrugs = false;
      }
    },
    addDrugToList(drug) {
      // Check if already added (same drug + same batch)
      const duplicateKey = drug.batch_id ? `${drug._id}-${drug.batch_id}` : drug._id;
      if (this.prescriptionItems.find(item => {
        const itemKey = item.batch_id ? `${item.drug_id}-${item.batch_id}` : item.drug_id;
        return itemKey === duplicateKey;
      })) {
        this.$toast.warning("This medication batch is already in the list");
        return;
      }
      this.prescriptionItems.push({
        drug_id: drug._id,
        batch_id: drug.batch_id || null,
        batch_number: drug.batch_number || null,
        drug_name: drug.name,
        generic_name: drug.generic_name,
        strength: drug.strength,
        dosage_form: drug.dosage_form,
        manufacturer: drug.manufacturer || null,
        unit_price: drug.selling_price,
        quantity: 1,
        available_quantity: drug.quantity,
        expiry_date: drug.expiry_date || null,
        dosage: "",
        frequency: "",
        duration: "",
        notes: "",
      });
      this.showDrugSearch = false;
      this.drugSearch = "";
      this.drugResults = [];
    },
    removeDrug(index) {
      this.prescriptionItems.splice(index, 1);
    },
    updateTotals() {
      // Triggered when quantity changes
      this.$forceUpdate();
    },
    nextStep() {
      if (this.currentStep < this.steps.length - 1) {
        // When moving from patient selection to medications, add pre-selected drug
        if (this.currentStep === 0 && this.preSelectedDrug) {
          this.addPreSelectedDrugToList();
        }
        this.currentStep++;
      }
    },
    prevStep() {
      if (this.currentStep > 0) {
        this.currentStep--;
      }
    },
    goBack() {
      if (this.currentStep > 0) {
        this.prevStep();
      } else {
        this.$router.back();
      }
    },
    async submitPrescription() {
      try {
        this.submitting = true;

        // Save new address if requested
        if (this.deliveryType === 'DELIVERY' && this.selectedAddressId === 'new' && this.saveNewAddress) {
          await this.saveDeliveryAddress();
        }

        // Get delivery address for submission
        const deliveryAddress = this.deliveryAddressForSubmit;

        const payload = {
          patient_id: this.selectedPatient._id,
          items: this.prescriptionItems.map(item => ({
            drug_id: item.drug_id,
            batch_id: item.batch_id || undefined, // Include batch for correct pricing
            quantity: item.quantity,
            dosage: item.dosage,
            frequency: item.frequency,
            duration: item.duration,
            instructions: item.notes,
          })),
          payment_method: this.paymentMethod,
          delivery_address: deliveryAddress,
          patient_notes: this.prescriptionNotes,
          // Pickup center fields
          is_pickup_order: this.deliveryType === 'PICKUP_CENTER',
          pickup_pharmacy_id: this.deliveryType === 'PICKUP_CENTER' ? this.selectedPickupCenterId : undefined,
        };

        const response = await apiFactory.$_createSpecialistPrescription(payload);
        const createResult = response.data?.data || response.data?.result;

        if (createResult) {
          this.$toast.success("Prescription created successfully");

          // Handle payment based on method
          // Response structure: { prescription: {...}, stock_reserved, ... }
          const prescriptionId = createResult.prescription?._id || createResult._id;

          if (this.paymentMethod === "specialist_wallet") {
            // Auto-pay from wallet
            try {
              await apiFactory.$_payPrescriptionFromWallet(prescriptionId);
              this.$toast.success("Payment completed from wallet");
            } catch (payError) {
              console.error("Wallet payment error:", payError);
              this.$toast.warning("Prescription created but wallet payment failed");
            }
          } else if (this.paymentMethod === "patient_wallet") {
            // Charge patient wallet
            try {
              const isPartialPayment = this.patientWalletBalance < this.subtotal;
              const walletPayload = {
                allow_partial: isPartialPayment,
                remaining_payment_method: isPartialPayment ? this.remainingPaymentMethod : undefined,
              };
              const payResult = await apiFactory.$_payPrescriptionFromPatientWallet(prescriptionId, walletPayload);
              const payData = payResult.data?.data || payResult.data?.result;

              if (payData?.is_partial_payment) {
                this.$toast.info(`NGN ${this.formatCurrency(payData.wallet_amount_paid)} charged from patient wallet. Remaining: NGN ${this.formatCurrency(payData.remaining_amount)}`);
              } else {
                this.$toast.success("Payment completed from patient wallet");
              }
            } catch (payError) {
              console.error("Patient wallet payment error:", payError);
              this.$toast.warning(payError.response?.data?.message || "Prescription created but wallet payment failed");
            }
          } else if (this.paymentMethod === "patient_online") {
            // Send payment link
            try {
              await apiFactory.$_sendPrescriptionPaymentLink(prescriptionId, {
                email: this.selectedPatient.email,
              });
              this.$toast.info("Payment link sent to patient");
            } catch (linkError) {
              console.error("Send payment link error:", linkError);
            }
          } else if (this.paymentMethod === "send_to_patient") {
            // Send to patient for self-service (accept/decline/pay)
            try {
              await apiFactory.$_sendPrescriptionToPatient(prescriptionId);
              this.$toast.success("Prescription sent to patient. They will receive an email with the PDF and can accept/decline from their dashboard.");
            } catch (sendError) {
              console.error("Send to patient error:", sendError);
              this.$toast.warning(sendError.response?.data?.message || "Prescription created but failed to send to patient");
            }
          }

          this.$router.push(`/app/specialist/pharmacy/prescriptions/${prescriptionId}`);
        }
      } catch (error) {
        console.error("Error creating prescription:", error);
        this.$toast.error(error.response?.data?.message || "Failed to create prescription");
      } finally {
        this.submitting = false;
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
    formatAddressLine(address) {
      if (!address) return "";
      const parts = [];
      // Add city
      if (address.city) {
        parts.push(address.city);
      }
      // Add state only if different from city
      if (address.state && address.state !== address.city) {
        parts.push(address.state);
      }
      // Add postal code if available
      if (address.postal_code) {
        parts.push(address.postal_code);
      }
      // Add country
      if (address.country) {
        parts.push(address.country);
      }
      return parts.join(", ");
    },
    formatDate(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", {
        month: "short",
        year: "numeric",
      });
    },
    formatPaymentMethod(method) {
      const methods = {
        specialist_wallet: "Pay from Wallet",
        patient_wallet: "Charge Patient Wallet",
        patient_online: "Patient Online Payment",
        patient_cash: "Cash Payment",
        send_to_patient: "Send to Patient (Self-Service)",
      };
      return methods[method] || method;
    },

    // ============ PICKUP CENTER METHODS ============

    formatDeliveryType(type) {
      const types = {
        PICKUP: "Pickup at Clinic",
        DELIVERY: "Home Delivery",
        PICKUP_CENTER: "Pickup at Pharmacy",
      };
      return types[type] || type;
    },

    onDeliveryTypeChange() {
      // Reset pickup center selection when delivery type changes
      if (this.deliveryType !== 'PICKUP_CENTER') {
        this.selectedPickupCenter = null;
        this.selectedPickupCenterId = null;
        this.pickupCenters = [];
        this.pickupCenterSearch = "";
      }
    },

    async searchPickupCenters() {
      if (!this.pickupCenterSearch || this.pickupCenterSearch.length < 2) {
        return;
      }

      this.loadingPickupCenters = true;
      try {
        const response = await apiFactory.$_getPickupCenters({
          city: this.pickupCenterSearch,
          state: this.pickupCenterSearch,
          limit: 20,
        });
        this.pickupCenters = response.data?.data?.pickup_centers || [];
      } catch (err) {
        console.error("Error searching pickup centers:", err);
        this.pickupCenters = [];
      } finally {
        this.loadingPickupCenters = false;
      }
    },

    async useLocationForPickup() {
      if (!navigator.geolocation) {
        this.$toast.error("Geolocation is not supported by your browser");
        return;
      }

      this.loadingPickupCenters = true;
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await apiFactory.$_recommendPickupCenters({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              limit: 10,
            });
            this.pickupCenters = response.data?.data || [];
          } catch (err) {
            console.error("Error fetching nearby pickup centers:", err);
            this.$toast.error("Failed to find nearby pickup centers");
          } finally {
            this.loadingPickupCenters = false;
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          this.$toast.error("Unable to get your location. Please search manually.");
          this.loadingPickupCenters = false;
        }
      );
    },

    selectPickupCenter(center) {
      this.selectedPickupCenter = center;
      this.selectedPickupCenterId = center._id;
    },

    formatPickupCenterAddress(address) {
      if (!address) return "Address not available";
      const parts = [address.street, address.city, address.state].filter(Boolean);
      return parts.join(", ") || "Address not available";
    },

    formatDistance(distance) {
      if (!distance) return "";
      if (distance < 1) return `${Math.round(distance * 1000)}m`;
      return `${distance.toFixed(1)}km`;
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

.create-prescription-container {
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
    h1 {
      font-size: $size-24;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    p {
      font-size: $size-15;
      color: $color-g-54;
    }
  }
}

.progress-steps {
  display: flex;
  justify-content: center;
  gap: $size-32;
  margin-bottom: $size-32;
  padding: $size-20;
  background: $color-white;
  border-radius: $size-12;

  @include responsive(phone) {
    gap: $size-16;
  }
}

.step {
  display: flex;
  align-items: center;
  gap: $size-12;

  .step-number {
    width: $size-32;
    height: $size-32;
    border-radius: 50%;
    background: $color-g-90;
    color: $color-g-54;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    transition: all 0.2s ease;
  }

  .step-label {
    font-size: $size-15;
    color: $color-g-54;

    @include responsive(phone) {
      display: none;
    }
  }

  &.active .step-number {
    background: $color-pri;
    color: $color-white;
  }

  &.completed .step-number {
    background: #10b981;
    color: $color-white;
  }

  &.active .step-label,
  &.completed .step-label {
    color: $color-g-21;
    font-weight: $fw-medium;
  }
}

.step-panel {
  background: $color-white;
  padding: $size-24;
  border-radius: $size-12;
  margin-bottom: $size-20;

  h2 {
    font-size: $size-20;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-20;
  }
}

.search-bar {
  display: flex;
  align-items: center;
  gap: $size-12;
  background: $color-g-97;
  padding: $size-12 $size-16;
  border-radius: $size-10;
  margin-bottom: $size-16;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: $size-15;
    color: $color-g-21;
    background: transparent;

    &::placeholder {
      color: $color-g-67;
    }
  }
}

.patient-results,
.drug-results {
  max-height: 300px;
  overflow-y: auto;
}

.patient-option,
.drug-option {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-12;
  border-radius: $size-8;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: $color-g-97;
  }

  &.selected {
    background: rgba($color-pri, 0.1);
  }
}

.patient-avatar {
  width: $size-44;
  height: $size-44;
  border-radius: 50%;
  background: $color-pri;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  &.large {
    width: $size-64;
    height: $size-64;
  }

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

.patient-info {
  flex: 1;

  .patient-name {
    font-size: $size-15;
    font-weight: $fw-medium;
    color: $color-g-21;
  }

  .patient-email,
  .patient-phone {
    font-size: $size-12;
    color: $color-g-54;
  }
}

.check-icon {
  color: $color-pri;
}

.selected-patient-card {
  margin-top: $size-24;
  padding: $size-20;
  background: rgba($color-pri, 0.05);
  border: 1px solid rgba($color-pri, 0.2);
  border-radius: $size-12;

  h3 {
    font-size: $size-15;
    font-weight: $fw-medium;
    color: $color-g-54;
    margin-bottom: $size-12;
  }

  .patient-details {
    display: flex;
    align-items: center;
    gap: $size-16;
  }
}

.preselected-drug-card {
  margin-top: $size-16;
  padding: $size-20;
  background: rgba(#10b981, 0.05);
  border: 1px solid rgba(#10b981, 0.2);
  border-radius: $size-12;

  h3 {
    font-size: $size-15;
    font-weight: $fw-medium;
    color: #059669;
    margin-bottom: $size-12;
    display: flex;
    align-items: center;
    gap: $size-8;
  }

  .drug-preview {
    display: flex;
    align-items: center;
    gap: $size-12;

    .drug-image {
      width: $size-56;
      height: $size-56;
      border-radius: $size-8;
      background: $color-white;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid rgba(#10b981, 0.2);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .drug-info {
      flex: 1;

      .drug-name {
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        color: $color-g-21;
      }

      .drug-details {
        font-size: $size-12;
        color: $color-g-54;
        margin-top: $size-2;
      }

      .drug-price {
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        color: #059669;
        margin-top: $size-4;
      }
    }
  }

  .drug-note {
    font-size: $size-12;
    color: $color-g-54;
    margin-top: $size-12;
    font-style: italic;
  }
}

.medications-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $size-20;

  h2 {
    margin-bottom: 0;
  }
}

.drug-search-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;

  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    position: relative;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    background: $color-white;
    border-radius: $size-16;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-16 $size-20;
    border-bottom: 1px solid $color-g-92;

    h3 {
      font-size: $size-18;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }

    .close-btn {
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

  .modal-body {
    padding: $size-20;
    max-height: calc(80vh - 70px);
    overflow-y: auto;
  }
}

.category-filter-row {
  display: flex;
  align-items: center;
  gap: $size-12;
  margin-bottom: $size-12;

  .category-select {
    flex: 1;
    padding: $size-10 $size-12;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    font-size: $size-14;
    color: $color-g-21;
    background: $color-white;
    cursor: pointer;

    &:focus {
      outline: none;
      border-color: $color-pri;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .clear-filter {
    display: flex;
    align-items: center;
    gap: $size-4;
    font-size: $size-12;
    color: $color-g-54;
    cursor: pointer;
    padding: $size-6 $size-10;
    border-radius: $size-6;
    transition: all 0.2s ease;

    &:hover {
      color: $color-pri;
      background: rgba($color-pri, 0.1);
    }
  }
}

.search-divider {
  display: flex;
  align-items: center;
  margin: $size-16 0 $size-12;

  span {
    font-size: $size-12;
    font-weight: $fw-medium;
    color: $color-g-54;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background: $color-g-90;
    margin-left: $size-12;
  }
}

.drug-option {
  padding: $size-12;
  border-bottom: 1px solid $color-g-95;

  &:last-child {
    border-bottom: none;
  }
}

.drug-image {
  width: $size-56;
  height: $size-56;
  border-radius: $size-8;
  background: $color-g-97;
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
}

.drug-info {
  flex: 1;

  .drug-name {
    font-size: $size-15;
    font-weight: $fw-medium;
    color: $color-g-21;
  }

  .drug-details {
    font-size: $size-12;
    color: $color-g-54;
  }

  .drug-manufacturer {
    font-size: $size-11;
    color: $color-g-67;
    margin-top: $size-2;
  }

  .drug-batch {
    font-size: $size-11;
    color: $color-g-54;
    margin-top: $size-2;
    display: flex;
    align-items: center;
    gap: $size-8;

    .expiry-tag {
      font-size: $size-10;
      padding: 2px 6px;
      border-radius: 4px;
      background: $color-g-95;
      color: $color-g-54;

      &.warning {
        background: #fef3c7;
        color: #d97706;
      }

      &.critical {
        background: #fee2e2;
        color: #dc2626;
      }
    }
  }

  .drug-price {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-pri;
    margin-top: $size-4;
  }
}

.stock-badge {
  font-size: $size-11;
  padding: $size-4 $size-8;
  border-radius: $size-12;

  &.in-stock {
    background: rgba(#10b981, 0.1);
    color: #059669;
  }

  &.out-of-stock {
    background: rgba(#ef4444, 0.1);
    color: #dc2626;
  }
}

.medications-list {
  display: flex;
  flex-direction: column;
  gap: $size-16;
}

.medication-card {
  padding: $size-20;
  background: $color-g-97;
  border-radius: $size-12;

  .medication-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-4;

    h4 {
      font-size: $size-16;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }

    .remove-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #ef4444;
      padding: $size-4;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  .medication-details {
    font-size: $size-12;
    color: $color-g-54;
    margin-bottom: $size-4;
  }

  .medication-meta {
    font-size: $size-11;
    color: $color-g-67;
    margin-bottom: $size-16;
    display: flex;
    gap: $size-12;

    .mfr {
      font-weight: $fw-medium;
    }

    .batch {
      color: $color-g-54;
    }
  }
}

.medication-form {
  .form-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $size-12;
    margin-bottom: $size-12;

    @include responsive(phone) {
      grid-template-columns: 1fr;
    }
  }

  .flex-2 {
    grid-column: span 2;

    @include responsive(phone) {
      grid-column: span 1;
    }
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: $size-6;

  label {
    font-size: $size-12;
    font-weight: $fw-medium;
    color: $color-g-44;
  }

  input,
  select,
  textarea {
    padding: $size-10 $size-12;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    font-size: $size-15;
    color: $color-g-21;

    &:focus {
      outline: none;
      border-color: $color-pri;
    }

    &:disabled {
      background: $color-g-95;
      color: $color-g-54;
    }
  }

  textarea {
    resize: vertical;
  }

  .help-text {
    font-size: $size-11;
    color: $color-g-54;
  }
}

.empty-medications {
  text-align: center;
  padding: $size-48;
  color: $color-g-54;

  p {
    margin: $size-16 0;
  }
}

.order-summary {
  margin-top: $size-24;
  padding: $size-20;
  background: $color-g-97;
  border-radius: $size-12;

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-16;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: $size-8 0;
    font-size: $size-15;
    color: $color-g-44;

    &.total {
      border-top: 1px solid $color-g-85;
      padding-top: $size-12;
      margin-top: $size-8;
      font-size: $size-16;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }
}

.section-card {
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

.payment-options {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: $size-16;
  padding: $size-16;
  border: 2px solid $color-g-90;
  border-radius: $size-12;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $color-g-77;
  }

  &.selected {
    border-color: $color-pri;
    background: rgba($color-pri, 0.03);
  }

  .option-icon {
    width: $size-48;
    height: $size-48;
    border-radius: $size-12;
    background: $color-g-95;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $color-g-44;
  }

  .option-info {
    flex: 1;

    h4 {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-21;
      margin-bottom: $size-2;
    }

    p {
      font-size: $size-12;
      color: $color-g-54;
    }

    .wallet-balance {
      margin-top: $size-4;
      font-size: $size-15;
      font-weight: $fw-semi-bold;
      color: $color-pri;
    }
  }

  .option-check {
    color: $color-pri;
  }

  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;

    &:hover {
      border-color: $color-g-90;
    }
  }

  .option-icon.patient-wallet {
    background: rgba(#10b981, 0.1);
    color: #10b981;
  }

  .wallet-balance.patient {
    color: #10b981;
  }

  .partial-warning {
    color: #f59e0b;
    font-size: $size-11;
    margin-top: $size-4;
    font-weight: $fw-medium;
  }

  .no-balance-warning {
    color: #ef4444;
    font-size: $size-11;
    margin-top: $size-4;
    font-weight: $fw-medium;
  }

  .charging-disabled-warning {
    color: #6b7280;
    font-size: $size-12;
    margin-top: $size-4;
    font-weight: $fw-medium;
    font-style: italic;
  }

  .option-icon.self-service {
    background: rgba(#8b5cf6, 0.1);
    color: #8b5cf6;
  }

  .self-service-note {
    color: #8b5cf6 !important;
    font-size: $size-11 !important;
    font-weight: $fw-medium;
    margin-top: $size-4;
  }
}

.remaining-payment-options {
  padding: $size-16;
  background: $color-g-97;
  border-radius: $size-10;
  margin-top: -$size-4;

  > label {
    font-size: $size-13;
    font-weight: $fw-medium;
    color: $color-g-36;
    display: block;
    margin-bottom: $size-12;
  }

  .remaining-options {
    display: flex;
    gap: $size-12;
  }

  .remaining-option {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-8;
    padding: $size-12;
    border: 2px solid $color-g-85;
    border-radius: $size-8;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: $size-13;
    color: $color-g-44;

    &:hover {
      border-color: $color-g-67;
    }

    &.selected {
      border-color: $color-pri;
      background: rgba($color-pri, 0.05);
      color: $color-pri;
    }
  }
}

.final-summary {
  background: rgba($color-pri, 0.05);
  border: 1px solid rgba($color-pri, 0.2);
  padding: $size-20;
  border-radius: $size-12;

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-16;
  }

  .summary-details {
    display: flex;
    flex-direction: column;
    gap: $size-12;
  }

  .summary-item {
    display: flex;
    justify-content: space-between;
    font-size: $size-15;

    .label {
      color: $color-g-54;
    }

    .value {
      font-weight: $fw-medium;
      color: $color-g-21;
    }

    &.total {
      padding-top: $size-12;
      border-top: 1px solid rgba($color-pri, 0.2);
      font-size: $size-16;

      .value {
        font-weight: $fw-bold;
        color: $color-pri;
      }
    }
  }
}

.navigation-buttons {
  display: flex;
  gap: $size-12;
  margin-top: $size-24;

  .spacer {
    flex: 1;
  }
}

.btn {
  padding: $size-12 $size-24;
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
}

.no-results {
  text-align: center;
  padding: $size-24;
  color: $color-g-54;
}

// Delivery Address Styles
.delivery-address-section {
  margin-top: $size-16;
}

.saved-addresses {
  > label {
    font-size: $size-14;
    font-weight: $fw-medium;
    color: $color-g-36;
    margin-bottom: $size-12;
    display: block;
  }
}

.address-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: $size-12;
  margin-bottom: $size-16;
}

.address-option {
  padding: $size-16;
  border: 2px solid $color-g-90;
  border-radius: $size-12;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: $color-g-77;
  }

  &.selected {
    border-color: $color-pri;
    background: rgba($color-pri, 0.03);
  }

  &.add-new {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $size-12;
    min-height: 140px;
    color: $color-g-54;
    border-style: dashed;

    &:hover {
      color: $color-pri;
      border-color: $color-pri;
    }
  }

  .selected-check {
    position: absolute;
    top: $size-12;
    right: $size-12;
    color: $color-pri;
  }

  &__header {
    display: flex;
    align-items: center;
    gap: $size-8;
    margin-bottom: $size-8;

    .address-label {
      font-size: $size-14;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }

    .default-badge,
    .profile-badge {
      font-size: $size-11;
      padding: $size-2 $size-8;
      border-radius: $size-12;
      font-weight: $fw-medium;
    }

    .default-badge {
      background: rgba(#10b981, 0.1);
      color: #10b981;
    }

    .profile-badge {
      background: rgba($color-pri, 0.1);
      color: $color-pri;
    }
  }

  &__details {
    .recipient {
      font-size: $size-14;
      font-weight: $fw-medium;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    .address-line {
      font-size: $size-12;
      color: $color-g-54;
      line-height: 1.4;
    }

    .phone {
      font-size: $size-12;
      color: $color-g-44;
      margin-top: $size-6;
    }
  }
}

.new-address-form {
  background: $color-g-97;
  padding: $size-20;
  border-radius: $size-12;

  h4 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-16;
  }
}

.checkbox-group {
  margin-top: $size-12;

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: $size-10;
    cursor: pointer;
    font-size: $size-14;
    color: $color-g-44;

    input[type="checkbox"] {
      width: $size-18;
      height: $size-18;
      accent-color: $color-pri;
      cursor: pointer;
    }
  }
}

.summary-item.address {
  flex-direction: column;
  align-items: flex-start;
  gap: $size-8;

  .address-preview {
    font-weight: normal;

    p {
      font-size: $size-14;
      line-height: 1.5;
      color: $color-g-44;
      margin: 0;
    }
  }
}

// Pickup Center Styles
.pickup-center-section {
  margin-top: $size-16;

  .pickup-center-search {
    display: flex;
    gap: $size-12;
    margin-bottom: $size-16;

    .search-input-wrapper {
      flex: 1;
      position: relative;

      input {
        width: 100%;
        padding: $size-12 $size-16;
        padding-left: $size-40;
        border: 1px solid $color-g-85;
        border-radius: $size-10;
        font-size: $size-14;
        transition: border-color 0.2s ease;

        &:focus {
          outline: none;
          border-color: $color-pri;
        }

        &::placeholder {
          color: $color-g-67;
        }
      }

      .search-icon {
        position: absolute;
        left: $size-12;
        top: 50%;
        transform: translateY(-50%);
        color: $color-g-54;
      }
    }

    .location-btn {
      display: flex;
      align-items: center;
      gap: $size-8;
      padding: $size-12 $size-16;
      background: rgba($color-pri, 0.1);
      color: $color-pri;
      border: none;
      border-radius: $size-10;
      font-size: $size-14;
      font-weight: $fw-medium;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        background: rgba($color-pri, 0.15);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  .pickup-centers-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $size-12;
    padding: $size-24;
    color: $color-g-54;
    font-size: $size-14;
  }

  .pickup-centers-list {
    display: flex;
    flex-direction: column;
    gap: $size-12;
    max-height: 300px;
    overflow-y: auto;
    padding-right: $size-4;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: $color-g-95;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: $color-g-77;
      border-radius: 3px;
    }
  }

  .pickup-center-option {
    display: flex;
    align-items: flex-start;
    gap: $size-12;
    padding: $size-16;
    border: 2px solid $color-g-90;
    border-radius: $size-12;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: $color-g-77;
      background: $color-g-97;
    }

    &.selected {
      border-color: #10b981;
      background: rgba(#10b981, 0.03);
    }

    .pickup-icon {
      width: $size-40;
      height: $size-40;
      border-radius: $size-10;
      background: rgba(#10b981, 0.1);
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .pickup-info {
      flex: 1;
      min-width: 0;

      .pickup-name {
        font-size: $size-15;
        font-weight: $fw-semi-bold;
        color: $color-g-21;
        margin-bottom: $size-4;
      }

      .pickup-address {
        font-size: $size-13;
        color: $color-g-54;
        line-height: 1.4;
        margin-bottom: $size-6;
      }

      .pickup-meta {
        display: flex;
        align-items: center;
        gap: $size-12;
        font-size: $size-12;
        color: $color-g-67;

        .distance {
          display: flex;
          align-items: center;
          gap: $size-4;
          color: #10b981;
          font-weight: $fw-medium;
        }

        .hours {
          display: flex;
          align-items: center;
          gap: $size-4;
        }
      }
    }

    .selected-check {
      color: #10b981;
      flex-shrink: 0;
    }
  }

  .no-pickup-centers {
    text-align: center;
    padding: $size-32;
    color: $color-g-54;

    svg {
      margin-bottom: $size-12;
      color: $color-g-77;
    }

    p {
      font-size: $size-14;
      margin: 0;
    }
  }

  .selected-pickup-center {
    padding: $size-16;
    background: rgba(#10b981, 0.05);
    border: 1px solid rgba(#10b981, 0.2);
    border-radius: $size-12;
    margin-top: $size-16;

    .selected-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: $size-12;

      h4 {
        font-size: $size-14;
        font-weight: $fw-semi-bold;
        color: #10b981;
        display: flex;
        align-items: center;
        gap: $size-8;
      }

      .change-btn {
        font-size: $size-13;
        color: $color-pri;
        background: none;
        border: none;
        cursor: pointer;
        font-weight: $fw-medium;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .selected-details {
      .pharmacy-name {
        font-size: $size-15;
        font-weight: $fw-medium;
        color: $color-g-21;
        margin-bottom: $size-4;
      }

      .pharmacy-address {
        font-size: $size-13;
        color: $color-g-54;
        line-height: 1.4;
      }

      .pharmacy-hours {
        font-size: $size-12;
        color: $color-g-67;
        margin-top: $size-8;
        display: flex;
        align-items: center;
        gap: $size-6;
      }
    }
  }
}
</style>
