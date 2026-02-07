<template>
  <div class="account-page">
    <TopBar
      type="title-only"
      title="Account"
      :showButtons="true"
      @open-side-nav="$emit('openSideNav')"
    />

    <div class="account-page__body">
      <!-- Tab Navigation -->
      <div class="tabs-container">
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <v-icon :name="tab.icon" scale="0.9" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Profile Tab -->
        <transition name="fade" mode="out-in">
          <div v-if="activeTab === 'profile'" class="tab-panel profile-tab">
            <ProfileHeader
              :profile="userProfile?.profile"
              :createdAt="userProfile?.created_at"
              @editProfile="openEditProfileModal"
            />

            <div class="two-col-grid">
              <BasicInfoSection :profile="userProfile?.profile" />
              <HealthInfoSection :profile="userProfile?.profile" />
            </div>

            <ConditionsSection
              :conditions="userProfile?.pre_existing_conditions || []"
              @add="openConditionModal('add')"
              @edit="(index) => openConditionModal('edit', index)"
              @remove="(item) => confirmRemove('pre-existing-condition', item)"
            />

            <div class="two-col-grid">
              <EmergencyContacts
                :contacts="userProfile?.emergency_contacts || []"
                @add="openContactModal('add')"
                @edit="(index) => openContactModal('edit', index)"
                @remove="(item) => confirmRemove('emergency-contact', item)"
              />
              <DependentsSection
                :dependents="userProfile?.dependants || []"
                @add="openDependentModal('add')"
                @edit="(index) => openDependentModal('edit', index)"
                @remove="(item) => confirmRemove('dependent', item)"
              />
            </div>
          </div>
        </transition>

        <!-- Wallet & Billing Tab -->
        <transition name="fade" mode="out-in">
          <div v-if="activeTab === 'wallet'" class="tab-panel wallet-tab">
            <div class="wallet-main-grid">
              <WalletBalanceCard
                :balance="walletBalance"
                :allowSpecialistCharge="allowSpecialistCharge"
                :updatingSetting="updatingWalletSetting"
                @topUp="showTopUpModal = true"
                @viewHistory="scrollToTransactions"
                @toggleSpecialistCharge="toggleWalletSetting"
              />
              <HealthCreditsCard
                :credits="healthCredits"
                :canShare="canShareCredits"
                @buyCredits="scrollToPlans"
                @shareCredits="openShareCreditsModal"
              />
            </div>

            <QuickActions @navigate="handleQuickAction" />

            <div ref="plansSection">
              <PlansGrid
                :plans="healthPlans"
                :loading="loadingPlans"
                :purchasing="purchasingPlan"
                @selectPlan="openPurchaseModal"
              />
            </div>

            <div class="two-col-grid wallet-bottom-grid">
              <div ref="transactionsSection" class="grid-item-wrapper">
                <TransactionHistory
                  :transactions="filteredTransactions"
                  :loading="loadingTransactions"
                  :activeFilter="transactionFilter"
                  :hasMore="hasMoreTransactions"
                  :loadingMore="loadingMoreTransactions"
                  @filterChange="setTransactionFilter"
                  @loadMore="loadMoreTransactions"
                  @download="downloadWalletStatement"
                />
              </div>
              <div class="grid-item-wrapper">
                <AICreditsHistory
                  :transactions="creditTransactions"
                  :loading="loadingCreditTransactions"
                  :hasMore="hasMoreCreditTransactions"
                  :loadingMore="loadingMoreCreditTransactions"
                  @loadMore="loadMoreCreditTransactions"
                  @download="downloadCreditsStatement"
                />
              </div>
            </div>

            <div class="payment-methods-section">
              <PaymentMethods
                :cards="userCards"
                @addCard="addCard"
                @setDefault="setDefaultCard"
                @removeCard="removeCard"
              />
            </div>
          </div>
        </transition>

        <!-- Notifications Tab -->
        <transition name="fade" mode="out-in">
          <div v-if="activeTab === 'notifications'" class="tab-panel notifications-tab">
            <NotificationPreferences />
          </div>
        </transition>
      </div>
    </div>

    <!-- Top Up Modal -->
    <div v-if="showTopUpModal" class="modal-overlay" @click.self="showTopUpModal = false">
      <div class="top-up-modal">
        <h3>Add Funds to Wallet</h3>
        <p>Enter the amount you want to add</p>

        <div class="amount-input-wrapper">
          <span class="currency-symbol">&#8358;</span>
          <input
            type="number"
            v-model.number="topUpAmount"
            placeholder="0.00"
            min="100"
            step="100"
          />
        </div>

        <div class="quick-amounts">
          <button
            v-for="amount in quickAmounts"
            :key="amount"
            @click="topUpAmount = amount"
            :class="{ active: topUpAmount === amount }"
          >
            {{ formatPrice(amount) }}
          </button>
        </div>

        <div class="modal-actions">
          <button class="btn primary" @click="initiateTopUp" :disabled="!topUpAmount || topUpAmount < 100 || topUpLoading">
            {{ topUpLoading ? 'Processing...' : 'Continue to Payment' }}
          </button>
          <button class="btn secondary" @click="showTopUpModal = false">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Purchase Plan Modal -->
    <div v-if="showPurchaseModal" class="modal-overlay" @click.self="closePurchaseModal">
      <div class="purchase-modal">
        <div class="purchase-modal__header">
          <div class="header-icon">
            <v-icon name="hi-sparkles" scale="1.2" />
          </div>
          <div class="header-text">
            <h3>AI Health Summary Credits</h3>
            <p>Unlock AI-powered health insights</p>
          </div>
          <button class="close-btn" @click="closePurchaseModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="purchase-modal__body">
          <!-- Wallet Balance -->
          <div class="wallet-info">
            <div class="wallet-icon">
              <v-icon name="bi-wallet2" scale="1" />
            </div>
            <div class="wallet-details">
              <span class="wallet-label">Your Wallet Balance</span>
              <span class="wallet-amount">{{ formatPrice(walletBalance) }}</span>
            </div>
          </div>

          <!-- Selected Plan Details -->
          <div v-if="selectedPlan" class="plan-details">
            <div class="plan-card-preview">
              <div class="plan-icon" :class="{ subscription: selectedPlan.type === 'subscription' }">
                <v-icon :name="selectedPlan.type === 'subscription' ? 'hi-lightning-bolt' : 'hi-sparkles'" scale="1.1" />
              </div>
              <div class="plan-info">
                <h4>{{ selectedPlan.name }}</h4>
                <p v-if="selectedPlan.type === 'subscription'">
                  <strong>Unlimited</strong> access for {{ selectedPlan.duration_days || 30 }} days
                </p>
                <p v-else>
                  <strong>{{ selectedPlan.credits }}</strong> AI Health Summary credits
                </p>
              </div>
            </div>

            <!-- Transaction Summary -->
            <div class="transaction-summary">
              <div class="summary-row">
                <span class="label">Plan Price</span>
                <span class="value">{{ formatPrice(selectedPlan.price) }}</span>
              </div>
              <div class="summary-row">
                <span class="label">Current Balance</span>
                <span class="value">{{ formatPrice(walletBalance) }}</span>
              </div>
              <div class="summary-row total" :class="{ insufficient: walletBalance < selectedPlan.price }">
                <span class="label">Balance After Purchase</span>
                <span class="value">{{ formatPrice(Math.max(0, walletBalance - selectedPlan.price)) }}</span>
              </div>
            </div>

            <!-- Insufficient Balance Warning -->
            <div v-if="walletBalance < selectedPlan.price" class="insufficient-alert">
              <v-icon name="hi-exclamation-circle" scale="1" />
              <div class="alert-content">
                <strong>Insufficient Balance</strong>
                <p>You need {{ formatPrice(selectedPlan.price - walletBalance) }} more. Please top up your wallet.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="purchase-modal__footer">
          <button class="btn secondary" @click="closePurchaseModal">
            Cancel
          </button>
          <button
            v-if="walletBalance < (selectedPlan?.price || 0)"
            class="btn primary"
            @click="closePurchaseModal(); showTopUpModal = true;"
          >
            <v-icon name="hi-plus" scale="0.9" />
            Top Up Wallet
          </button>
          <button
            v-else
            class="btn primary"
            :disabled="purchasingPlan"
            @click="confirmPurchase"
          >
            {{ purchasingPlan ? 'Processing...' : 'Confirm Purchase' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Share Credits Modal -->
    <div v-if="showShareModal" class="modal-overlay" @click.self="closeShareModal">
      <div class="share-modal">
        <!-- Step 1: Search and Select -->
        <template v-if="shareStep === 1">
          <div class="share-modal__header">
            <h3>Share AI Credits</h3>
            <button class="close-btn" @click="closeShareModal">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>

          <div class="share-modal__body">
            <div class="share-balance-banner">
              <div class="banner-content">
                <span class="banner-label">Available to Share</span>
                <span class="banner-value">{{ healthCredits?.purchased || 0 }} credits</span>
              </div>
              <v-icon name="hi-sparkles" scale="1.2" />
            </div>

            <div class="share-note">
              <v-icon name="hi-information-circle" scale="0.9" />
              <span>Only purchased credits can be shared with other patients.</span>
            </div>

            <div class="form-group">
              <label>Search for a patient</label>
              <div class="search-input">
                <v-icon name="hi-search" scale="0.9" />
                <input
                  type="text"
                  v-model="searchQuery"
                  @input="onSearchInput"
                  placeholder="Enter name or email..."
                  :disabled="searching"
                />
                <span v-if="searching" class="search-loading">
                  <v-icon name="hi-refresh" scale="0.8" class="spin" />
                </span>
              </div>

              <!-- Search Results -->
              <div v-if="searchResults.length > 0" class="search-results">
                <div
                  v-for="patient in searchResults"
                  :key="patient.id"
                  class="patient-result"
                  :class="{ selected: selectedPatient?.id === patient.id }"
                  @click="selectPatient(patient)"
                >
                  <div class="patient-avatar">
                    <img v-if="patient.avatar" :src="patient.avatar" alt="" />
                    <span v-else>{{ getInitials(patient.name) }}</span>
                  </div>
                  <div class="patient-details">
                    <span class="patient-name">{{ patient.name }}</span>
                    <span class="patient-email">{{ patient.email }}</span>
                  </div>
                  <div v-if="selectedPatient?.id === patient.id" class="check-icon">
                    <v-icon name="hi-check" scale="1" />
                  </div>
                </div>
              </div>

              <div v-else-if="searchQuery.length >= 2 && !searching" class="no-results">
                <v-icon name="hi-user-group" scale="1.2" />
                <span>No patients found</span>
              </div>
            </div>

            <div v-if="selectedPatient" class="form-group">
              <label>Credits to send</label>
              <div class="credits-input">
                <input
                  type="number"
                  v-model.number="creditsToSend"
                  :min="creditSharingSettings?.min_amount || 1"
                  :max="Math.min(creditSharingSettings?.max_amount || 50, healthCredits?.purchased || 0)"
                  placeholder="Enter amount"
                />
                <span class="credits-suffix">credits</span>
              </div>
              <span class="input-hint">
                Min: {{ creditSharingSettings?.min_amount || 1 }} |
                Max: {{ Math.min(creditSharingSettings?.max_amount || 50, healthCredits?.purchased || 0) }}
              </span>
            </div>
          </div>

          <div class="share-modal__footer">
            <button class="btn secondary" @click="closeShareModal">Cancel</button>
            <button
              class="btn primary"
              :disabled="!canProceedToConfirm"
              @click="proceedToConfirmation"
            >
              Continue
            </button>
          </div>
        </template>

        <!-- Step 2: Confirmation -->
        <template v-else-if="shareStep === 2">
          <div class="share-modal__header">
            <button class="back-btn" @click="shareStep = 1">
              <v-icon name="hi-arrow-left" scale="1" />
            </button>
            <h3>Confirm Transfer</h3>
            <button class="close-btn" @click="closeShareModal">
              <v-icon name="hi-x" scale="1" />
            </button>
          </div>

          <div class="share-modal__body confirm-body">
            <div class="confirm-header">
              <v-icon name="hi-sparkles" scale="2" />
              <p class="confirm-subtitle">You're about to send</p>
              <p class="confirm-amount">{{ creditsToSend }} AI Credits</p>
              <p class="confirm-recipient">to <strong>{{ selectedPatient?.name }}</strong></p>
            </div>

            <div class="confirm-summary">
              <div class="summary-row">
                <span>Your Current Balance</span>
                <span>{{ healthCredits?.purchased }} credits</span>
              </div>
              <div class="summary-row highlight">
                <span>Credits to Send</span>
                <span>-{{ creditsToSend }} credits</span>
              </div>
              <div class="summary-divider"></div>
              <div class="summary-row total">
                <span>Remaining Balance</span>
                <span>{{ (healthCredits?.purchased || 0) - creditsToSend }} credits</span>
              </div>
            </div>

            <div class="confirm-warning">
              <v-icon name="hi-exclamation" scale="0.9" />
              <span>This action cannot be undone.</span>
            </div>
          </div>

          <div class="share-modal__footer">
            <button class="btn secondary" @click="shareStep = 1" :disabled="transferring">
              Back
            </button>
            <button
              class="btn primary"
              :disabled="transferring"
              @click="executeTransfer"
            >
              {{ transferring ? 'Sending...' : 'Confirm & Send' }}
            </button>
          </div>
        </template>

        <!-- Step 3: Success -->
        <template v-else-if="shareStep === 3">
          <div class="share-modal__body success-body">
            <div class="success-icon">
              <v-icon name="hi-check" scale="2" />
            </div>
            <h3>Transfer Successful</h3>
            <p class="success-text">
              {{ creditsToSend }} AI credits have been sent to {{ selectedPatient?.name }}
            </p>
            <p class="success-note">
              Both you and the recipient will receive email confirmations.
            </p>
            <button class="btn primary" @click="closeShareModal">Done</button>
          </div>
        </template>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div v-if="selectedModal === 'Edit Profile'" class="modal-overlay" @click.self="closeModal">
      <div class="edit-profile-modal">
        <div class="edit-profile-modal__header">
          <div class="header-content">
            <v-icon name="hi-user-circle" scale="1.3" />
            <div class="header-text">
              <h3>Edit Profile</h3>
              <p>Update your personal information</p>
            </div>
          </div>
          <button class="close-btn" @click="closeModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="edit-profile-modal__body">
          <!-- Avatar Section -->
          <div class="profile-avatar-section">
            <Avatar
              size="medium"
              :firstname="userProfile?.profile?.first_name || 'U'"
              :lastname="userProfile?.profile?.last_name || 'U'"
              :extSrc="userProfile?.profile?.profile_photo"
              v-model="profileForm.profile_photo"
            />
            <div class="avatar-info">
              <h4>{{ userProfile?.profile?.first_name }} {{ userProfile?.profile?.last_name }}</h4>
              <p>Click the edit icon to change photo</p>
            </div>
          </div>

          <!-- Personal Information Section -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-identification" scale="0.9" />
              <span>Personal Information</span>
            </div>
            <div class="form-grid two-col">
              <Text
                type="text"
                label="First Name"
                name="fname"
                v-model="userProfile.profile.first_name"
                :disabled="true"
              />
              <Text
                type="text"
                label="Last Name"
                name="lname"
                v-model="userProfile.profile.last_name"
                :disabled="true"
              />
            </div>
            <div class="form-grid three-col">
              <Dropdown
                :options="genderArray"
                label="Gender"
                :required="true"
                v-model="profileForm.gender"
              />
              <DatePicker
                Label="Date of Birth"
                v-model="userProfile.profile.date_of_birth"
                :disabled="true"
              />
              <Dropdown
                :options="maritalStatusArray"
                label="Marital Status"
                :required="true"
                v-model="profileForm.marital_status"
              />
            </div>
          </div>

          <!-- Health Information Section -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-heart" scale="0.9" />
              <span>Health Information</span>
            </div>
            <div class="form-grid three-col">
              <NumberInputSuffix
                label="Height"
                name="height"
                max-digits="3"
                :options="heightArray"
                v-model="profileForm.basic_health_info.height.unit"
                v-model:number-input="profileForm.basic_health_info.height.value"
              />
              <NumberInputSuffix
                label="Weight"
                name="weight"
                max-digits="3"
                :options="weightArray"
                v-model="profileForm.basic_health_info.weight.unit"
                v-model:number-input="profileForm.basic_health_info.weight.value"
              />
              <Dropdown
                :options="smokerArray"
                :required="true"
                label="Smoker?"
                v-model="profileForm.health_risk_factors.is_smoker"
              />
            </div>
          </div>

          <!-- Contact Information Section -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-mail" scale="0.9" />
              <span>Contact Information</span>
            </div>
            <div class="form-grid two-col">
              <Text
                type="email"
                label="Email"
                name="email"
                v-model="userProfile.profile.contact.email"
                :disabled="true"
              />
              <PhoneInput
                v-model:phone-number="profileForm.contact.phone.number"
                v-model="profileForm.contact.phone.country_code"
              />
            </div>
          </div>

          <!-- Address Section -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-location-marker" scale="0.9" />
              <span>Address</span>
            </div>
            <div class="form-grid single-col">
              <Text
                type="text"
                label="Address Line 1"
                name="address1"
                max-chars="50"
                :required="true"
                v-model="profileForm.contact.address1"
              />
            </div>
            <div class="form-grid single-col">
              <Text
                type="text"
                label="Address Line 2"
                max-chars="50"
                name="address2"
                v-model="profileForm.contact.address2"
              />
            </div>
            <div class="form-grid three-col">
              <SelectFilterInput
                name="patient-country"
                label="Country"
                position="top"
                mode="country"
                :required="true"
                v-model:country-value="profileForm.contact.country"
                @selected-item="selectedCountry"
              />
              <SelectFilterInput
                name="patient-state"
                label="State"
                position="top"
                mode="state"
                :required="true"
                :based-on="patientCountry"
                v-model:state-value="profileForm.contact.state"
              />
              <Text
                type="text"
                label="ZIP Code"
                name="zip"
                :required="true"
                v-model="profileForm.contact.zip_code"
              />
            </div>
          </div>
        </div>

        <div class="edit-profile-modal__footer">
          <button class="btn secondary" @click="closeModal">
            Cancel
          </button>
          <button class="btn primary" @click="updateProfile" :disabled="savingProfile">
            <v-icon v-if="!savingProfile" name="hi-check" scale="0.9" />
            {{ savingProfile ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Pre-existing Condition Modal -->
    <div v-if="selectedModal === 'Edit Condition'" class="modal-overlay" @click.self="closeModal">
      <div class="enhanced-modal condition-modal">
        <div class="enhanced-modal__header">
          <div class="header-content">
            <v-icon name="hi-clipboard-list" scale="1.3" />
            <div class="header-text">
              <h3>{{ conditionIndex !== null ? 'Edit' : 'Add' }} Pre-existing Condition</h3>
              <p>Document your medical conditions for better healthcare</p>
            </div>
          </div>
          <button class="close-btn" @click="closeModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="enhanced-modal__body">
          <!-- Condition Details -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-information-circle" scale="0.9" />
              <span>Condition Details</span>
            </div>
            <div class="form-grid single-col">
              <Text
                type="text"
                label="Condition Name"
                name="condition"
                :required="true"
                v-model="conditionForm.name"
              />
            </div>
            <div class="form-grid single-col">
              <AreaText
                name="description"
                label="Description"
                placeholder="Describe the condition, symptoms, and any treatments"
                rows="4"
                v-model="conditionForm.description"
              />
            </div>
          </div>

          <!-- Duration Section -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-calendar" scale="0.9" />
              <span>Duration</span>
            </div>
            <DateRangePicker
              v-model:startDate="conditionForm.start_date"
              v-model:endDate="conditionForm.end_date"
              v-model:status="conditionForm.is_condition_exists"
            />
          </div>

          <!-- Supporting Documents -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-document" scale="0.9" />
              <span>Supporting Documents</span>
            </div>
            <p class="section-hint">Upload medical reports, prescriptions, or test results</p>
            <FileUploadForm v-model="conditionForm.file" />

            <!-- Show existing document preview if editing -->
            <div v-if="conditionForm.existingFile" class="existing-document">
              <div class="doc-preview">
                <v-icon name="hi-document-text" scale="1.2" />
                <span>Existing document attached</span>
                <a :href="conditionForm.existingFile" target="_blank" class="view-link">
                  <v-icon name="hi-external-link" scale="0.8" />
                  View
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="enhanced-modal__footer">
          <button class="btn secondary" @click="closeModal">Cancel</button>
          <button class="btn primary" @click="saveCondition" :disabled="savingCondition">
            <v-icon v-if="!savingCondition" name="hi-check" scale="0.9" />
            {{ savingCondition ? 'Saving...' : 'Save Condition' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Emergency Contact Modal -->
    <div v-if="selectedModal === 'Edit Contact'" class="modal-overlay" @click.self="closeModal">
      <div class="enhanced-modal contact-modal">
        <div class="enhanced-modal__header emergency">
          <div class="header-content">
            <v-icon name="hi-phone" scale="1.3" />
            <div class="header-text">
              <h3>{{ contactIndex !== null ? 'Edit' : 'Add' }} Emergency Contact</h3>
              <p>Someone to contact in case of emergency</p>
            </div>
          </div>
          <button class="close-btn" @click="closeModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="enhanced-modal__body">
          <!-- Personal Information -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-user" scale="0.9" />
              <span>Personal Information</span>
            </div>
            <div class="form-grid two-col">
              <Text
                type="text"
                label="First Name"
                name="contact-firstname"
                :required="true"
                v-model="contactForm.first_name"
              />
              <Text
                type="text"
                label="Last Name"
                name="contact-lastname"
                :required="true"
                v-model="contactForm.last_name"
              />
            </div>
            <div class="form-grid two-col">
              <Dropdown
                :options="relationshipArray"
                label="Relationship"
                :required="true"
                v-model="contactForm.relationship"
              />
              <PhoneInput
                v-model:phone-number="contactForm.phone.number"
                v-model="contactForm.phone.country_code"
              />
            </div>
          </div>

          <!-- Address Section -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-location-marker" scale="0.9" />
              <span>Address</span>
            </div>
            <div class="form-grid single-col">
              <Text
                type="text"
                label="Address Line 1"
                max-chars="50"
                name="contact-address1"
                :required="true"
                v-model="contactForm.address1"
              />
            </div>
            <div class="form-grid single-col">
              <Text
                type="text"
                label="Address Line 2"
                max-chars="50"
                name="contact-address2"
                v-model="contactForm.address2"
              />
            </div>
            <div class="form-grid three-col">
              <SelectFilterInput
                name="contact-country"
                label="Country"
                position="top"
                mode="country"
                :required="true"
                v-model:country-value="contactForm.country"
                @selected-item="selectedContactCountry"
              />
              <SelectFilterInput
                name="contact-state"
                label="State"
                position="top"
                mode="state"
                :required="true"
                :based-on="contactCountry"
                v-model:state-value="contactForm.state"
              />
              <Text
                type="text"
                label="ZIP Code"
                name="contact-zip"
                :required="true"
                v-model="contactForm.zip_code"
              />
            </div>
          </div>
        </div>

        <div class="enhanced-modal__footer">
          <button class="btn secondary" @click="closeModal">Cancel</button>
          <button class="btn primary" @click="saveContact" :disabled="savingContact">
            <v-icon v-if="!savingContact" name="hi-check" scale="0.9" />
            {{ savingContact ? 'Saving...' : 'Save Contact' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Dependent Modal -->
    <div v-if="selectedModal === 'Edit Dependent'" class="modal-overlay" @click.self="closeModal">
      <div class="enhanced-modal dependent-modal">
        <div class="enhanced-modal__header dependent">
          <div class="header-content">
            <v-icon name="hi-users" scale="1.3" />
            <div class="header-text">
              <h3>{{ dependentIndex !== null ? 'Edit' : 'Add' }} Dependent</h3>
              <p>Add a family member or dependent to your profile</p>
            </div>
          </div>
          <button class="close-btn" @click="closeModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="enhanced-modal__body">
          <!-- Personal Information -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-identification" scale="0.9" />
              <span>Personal Information</span>
            </div>
            <div class="form-grid two-col">
              <Text
                type="text"
                label="First Name"
                name="dependent-fname"
                :required="true"
                v-model="dependentForm.first_name"
              />
              <Text
                type="text"
                label="Last Name"
                name="dependent-lname"
                :required="true"
                v-model="dependentForm.last_name"
              />
            </div>
            <div class="form-grid three-col">
              <Dropdown
                :options="genderArray"
                label="Gender"
                :required="true"
                v-model="dependentForm.gender"
              />
              <DatePicker Label="Date of Birth" v-model="dependentForm.date_of_birth" />
              <Dropdown
                :options="relationshipArray"
                label="Relationship"
                :required="true"
                v-model="dependentForm.relationship"
              />
            </div>
          </div>

          <!-- Health Information -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-heart" scale="0.9" />
              <span>Health Information</span>
            </div>
            <div class="form-grid two-col">
              <NumberInputSuffix
                label="Height"
                name="dependent-height"
                max-digits="3"
                :options="heightArray"
                v-model="dependentForm.basic_health_info.height.unit"
                v-model:number-input="dependentForm.basic_health_info.height.value"
              />
              <NumberInputSuffix
                label="Weight"
                name="dependent-weight"
                max-digits="3"
                :options="weightArray"
                v-model="dependentForm.basic_health_info.weight.unit"
                v-model:number-input="dependentForm.basic_health_info.weight.value"
              />
            </div>
          </div>

          <!-- Contact Information -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-mail" scale="0.9" />
              <span>Contact Information</span>
            </div>
            <div class="form-grid two-col">
              <Text
                type="email"
                label="Email"
                name="dependent-email"
                v-model="dependentForm.contact.email"
              />
              <PhoneInput
                v-model:phone-number="dependentForm.contact.phone.number"
                v-model="dependentForm.contact.phone.country_code"
              />
            </div>
          </div>

          <!-- Address Section -->
          <div class="form-section">
            <div class="section-header">
              <v-icon name="hi-location-marker" scale="0.9" />
              <span>Address</span>
            </div>
            <div class="form-grid single-col">
              <Text
                type="text"
                label="Address Line 1"
                name="dependent-address1"
                max-chars="50"
                v-model="dependentForm.contact.address1"
              />
            </div>
            <div class="form-grid single-col">
              <Text
                type="text"
                label="Address Line 2"
                name="dependent-address2"
                max-chars="50"
                v-model="dependentForm.contact.address2"
              />
            </div>
            <div class="form-grid three-col">
              <SelectFilterInput
                name="dependent-country"
                label="Country"
                position="top"
                mode="country"
                v-model:country-value="dependentForm.contact.country"
                @selected-item="selectedDependentCountry"
              />
              <SelectFilterInput
                name="dependent-state"
                label="State"
                position="top"
                mode="state"
                :based-on="dependentCountry"
                v-model:state-value="dependentForm.contact.state"
              />
              <Text
                type="text"
                label="ZIP Code"
                name="dependent-zip"
                v-model="dependentForm.contact.zip_code"
              />
            </div>
          </div>
        </div>

        <div class="enhanced-modal__footer">
          <button class="btn secondary" @click="closeModal">Cancel</button>
          <button class="btn primary" @click="saveDependent" :disabled="savingDependent">
            <v-icon v-if="!savingDependent" name="hi-check" scale="0.9" />
            {{ savingDependent ? 'Saving...' : 'Save Dependent' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 2FA Modals -->
    <DialogModal
      v-show="selectedModal === 'Verify Phone'"
      title="Verify Phone Number"
      @closeModal="closeModal"
    >
      <template v-slot:body>
        <div class="modal__body-content">
          <p class="align-center">Enter the 6-digit code sent to your phone number</p>
          <DigitArray
            v-model:input1="otpPhone[0]"
            v-model:input2="otpPhone[1]"
            v-model:input3="otpPhone[2]"
            v-model:input4="otpPhone[3]"
            v-model:input5="otpPhone[4]"
            v-model:input6="otpPhone[5]"
            :placeholder="['0','0','0','0','0','0']"
            @input="autoSubmitPhone"
          />
          <Button label="Resend OTP" type="tertiary" size="medium" @click="resendCode" />
        </div>
      </template>
      <template v-slot:loader>
        <Loader v-if="loadingPhone" :useOverlay="true" :rounded="true" />
      </template>
    </DialogModal>

    <DialogModal
      v-show="selectedModal === 'Auth App'"
      title="Activate Auth App"
      @closeModal="closeModal"
    >
      <template v-slot:body>
        <div v-if="!qrNext" class="modal__body-content">
          <p class="align-center">Scan the QR code with your auth app and click the button below</p>
          <img :src="qrUrl" alt="QR code" />
          <Button label="Authorize App" type="tertiary" size="medium" @click="qrNext = true" />
        </div>
        <div v-else class="modal__body-content">
          <p class="align-center">Enter the active 6-digit code from your auth app</p>
          <DigitArray
            v-model:input1="otpApp[0]"
            v-model:input2="otpApp[1]"
            v-model:input3="otpApp[2]"
            v-model:input4="otpApp[3]"
            v-model:input5="otpApp[4]"
            v-model:input6="otpApp[5]"
            :placeholder="['0','0','0','0','0','0']"
            @input="autoSubmitApp"
          />
        </div>
      </template>
      <template v-slot:loader>
        <Loader v-if="loadingApp" :useOverlay="true" :rounded="true" />
      </template>
    </DialogModal>

    <!-- Confirm Remove Modal -->
    <ModalCaution
      v-show="showRemoveModal"
      title="Remove Item"
      @closeModal="showRemoveModal = false"
      :has-footer="true"
    >
      <template v-slot:body>
        <div class="modal__content">
          <div class="caution">
            <p class="text">This action is irreversible. Are you sure you want to remove this item?</p>
          </div>
        </div>
      </template>
      <template v-slot:foot>
        <Button type="tertiary" label="No" size="small" @click="showRemoveModal = false" />
        <Button type="primary" label="Yes" size="small" :loading="removingItem" @click="executeRemove" />
      </template>
    </ModalCaution>

    <!-- Change Email/Phone Modals -->
    <ChangeEmailModal
      v-if="isChangingEmail"
      @closeChangeEmailDialog="isChangingEmail = false"
      @hasSentOtp="handleDisplayOtpDialog"
    />
    <ChangePhoneModal
      v-if="isChangingPhoneNumber"
      @closeChangePhoneDialog="isChangingPhoneNumber = false"
      @hasSentOtp="handleDisplayOtpDialog"
    />
    <ValidateOtpModal
      v-if="hasSentOtp"
      :title="otpVerificationModalTitle"
      :description="otpVerificationModalDescription"
      :payloadForOtpVerification="payloadForOtpVerification"
      @handleCloseModal="hasSentOtp = false"
      @handleReload="handleFetchUser"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from "vuex";
import io from "socket.io-client";
import axios from "axios";
import http from "@/services/http";
import { useFormatDateNumbers, useConvertToFile } from "@/Utility-functions";
import { TWO_FAS, SECURITY_UPDATE_OPTIONS, OTP_VERIFICATION_CONTENT } from "@/utilities/constants";

// Layout Components
import TopBar from "@/components/Navigation/top-bar.vue";
import Loader from "@/components/Loader/main-loader.vue";
import Button from "@/components/buttons/button-primary.vue";
import DialogModal from "@/components/modals/dialog-modal.vue";
import ModalCaution from "@/components/modals/modal-caution.vue";

// Form Components
import Text from "@/components/inputs/text.vue";
import AreaText from "@/components/inputs/area-text.vue";
import Dropdown from "@/components/inputs/select-dropdown.vue";
import DatePicker from "@/components/inputs/date-picker.vue";
import NumberInputSuffix from "@/components/inputs/digits-suffix.vue";
import PhoneInput from "@/components/inputs/phone-number.vue";
import SelectFilterInput from "@/components/inputs/select-filter-input.vue";
import DateRangePicker from "@/components/inputs/date-pickers/date-range.vue";
import FileUploadForm from "@/components/forms/File-upload-form.vue";
import Avatar from "@/components/Avatars/avatar.vue";
import DigitArray from "@/components/inputs/digit-array.vue";

// Account modals
import ChangeEmailModal from "@/components/Account/ChangeEmailModal.vue";
import ChangePhoneModal from "@/components/Account/ChangePhoneModal.vue";
import ValidateOtpModal from "@/components/Account/ValidateOtpModal.vue";

// Profile Tab Components
import ProfileHeader from "./components/ProfileTab/ProfileHeader.vue";
import BasicInfoSection from "./components/ProfileTab/BasicInfoSection.vue";
import HealthInfoSection from "./components/ProfileTab/HealthInfoSection.vue";
import ConditionsSection from "./components/ProfileTab/ConditionsSection.vue";
import EmergencyContacts from "./components/ProfileTab/EmergencyContacts.vue";
import DependentsSection from "./components/ProfileTab/DependentsSection.vue";

// Wallet Tab Components
import WalletBalanceCard from "./components/WalletTab/WalletBalanceCard.vue";
import HealthCreditsCard from "./components/WalletTab/HealthCreditsCard.vue";
import PlansGrid from "./components/WalletTab/PlansGrid.vue";
import PaymentMethods from "./components/WalletTab/PaymentMethods.vue";
import TransactionHistory from "./components/WalletTab/TransactionHistory.vue";
import AICreditsHistory from "./components/WalletTab/AICreditsHistory.vue";
import QuickActions from "./components/WalletTab/QuickActions.vue";

// Notifications Tab Components
import NotificationPreferences from "./components/NotificationsTab/NotificationPreferences.vue";

export default {
  name: "AccountPage",
  components: {
    TopBar,
    Loader,
    Button,
    DialogModal,
    ModalCaution,
    Text,
    AreaText,
    Dropdown,
    DatePicker,
    NumberInputSuffix,
    PhoneInput,
    SelectFilterInput,
    DateRangePicker,
    FileUploadForm,
    Avatar,
    DigitArray,
    ChangeEmailModal,
    ChangePhoneModal,
    ValidateOtpModal,
    ProfileHeader,
    BasicInfoSection,
    HealthInfoSection,
    ConditionsSection,
    EmergencyContacts,
    DependentsSection,
    WalletBalanceCard,
    HealthCreditsCard,
    PlansGrid,
    PaymentMethods,
    TransactionHistory,
    AICreditsHistory,
    QuickActions,
    NotificationPreferences,
  },
  emits: ["openSideNav"],
  data() {
    return {
      activeTab: "profile",
      tabs: [
        { id: "profile", label: "Profile", icon: "hi-user" },
        { id: "wallet", label: "Wallet & Billing", icon: "bi-wallet2" },
        { id: "notifications", label: "Notifications", icon: "hi-bell" },
      ],

      // Modal state
      selectedModal: null,

      // Profile form
      profileForm: this.getEmptyProfileForm(),
      patientCountry: null,
      savingProfile: false,

      // Condition form
      conditionForm: this.getEmptyConditionForm(),
      conditionIndex: null,
      savingCondition: false,

      // Contact form
      contactForm: this.getEmptyContactForm(),
      contactIndex: null,
      contactCountry: null,
      savingContact: false,

      // Dependent form
      dependentForm: this.getEmptyDependentForm(),
      dependentIndex: null,
      dependentCountry: null,
      savingDependent: false,

      // Remove confirmation
      showRemoveModal: false,
      removeType: null,
      removeItem: null,
      removingItem: false,

      // Dropdown options
      genderArray: ["Male", "Female"],
      maritalStatusArray: ["Single", "Married", "Divorced", "Widowed"],
      heightArray: ["cm", "m"],
      weightArray: ["kg", "lb"],
      smokerArray: ["Yes", "No"],
      relationshipArray: ["Brother", "Sister", "Wife", "Husband", "Father", "Mother", "Uncle", "Aunty", "Son", "Daughter", "Friend"],

      // Wallet state
      walletBalance: 0,
      allowSpecialistCharge: true,
      updatingWalletSetting: false,
      showTopUpModal: false,
      topUpAmount: null,
      topUpLoading: false,
      quickAmounts: [1000, 2000, 5000, 10000, 20000],

      // Health Credits
      healthCredits: null,
      healthPlans: [],
      loadingPlans: false,
      purchasingPlan: false,
      showPurchaseModal: false,
      selectedPlan: null,

      // Credit Sharing
      creditSharingSettings: null,
      showShareModal: false,
      shareStep: 1,
      searchQuery: '',
      searchResults: [],
      selectedPatient: null,
      creditsToSend: 1,
      searching: false,
      transferring: false,
      searchTimeout: null,

      // AI Credit Transactions
      creditTransactions: [],
      loadingCreditTransactions: false,
      loadingMoreCreditTransactions: false,
      hasMoreCreditTransactions: false,
      creditTransactionPage: 1,
      creditTransactionLimit: 10,

      // Transactions
      transactions: [],
      loadingTransactions: false,
      loadingMoreTransactions: false,
      transactionFilter: "all",
      hasMoreTransactions: false,
      transactionPage: 1,
      transactionLimit: 10,
      totalTransactions: 0,

      // Security - 2FA
      twoFAs: TWO_FAS,
      otpPhone: [],
      otpApp: [],
      loadingPhone: false,
      loadingApp: false,
      qrNext: false,

      // WhatsApp
      whatsappEnabled: false,
      updatingWhatsapp: false,

      // Email/Phone change
      isChangingEmail: false,
      isChangingPhoneNumber: false,
      hasSentOtp: false,
      otpVerificationModalTitle: "",
      otpVerificationModalDescription: "",
      payloadForOtpVerification: "",
    };
  },

  computed: {
    ...mapGetters({
      userProfile: "userprofile",
      userSettings: "usersettings",
      userCards: "cards",
      QRCode: "userAccountSettings/qrCode",
    }),

    qrUrl() {
      return this.QRCode?.data || "";
    },

    regMedium() {
      return this.userProfile?.reg_medium === "LOCAL";
    },

    formattedPhone() {
      const phone = this.userProfile?.profile?.contact?.phone;
      if (!phone?.number) return "";
      return `${phone.country_code || ""} ${phone.number}`.trim();
    },

    filteredTransactions() {
      if (this.transactionFilter === "all") return this.transactions;
      return this.transactions.filter(t =>
        t.type?.toLowerCase() === this.transactionFilter
      );
    },

    canShareCredits() {
      return this.creditSharingSettings?.enabled && (this.healthCredits?.purchased || 0) > 0;
    },

    canProceedToConfirm() {
      if (!this.selectedPatient) return false;
      if (!this.creditsToSend) return false;
      const min = this.creditSharingSettings?.min_amount || 1;
      const max = Math.min(
        this.creditSharingSettings?.max_amount || 50,
        this.healthCredits?.purchased || 0
      );
      return this.creditsToSend >= min && this.creditsToSend <= max;
    },
  },

  methods: {
    ...mapActions({
      updateTwoFA: "userAccountSettings/updatetwofactorauth",
      sendVerCode: "userAccountSettings/getPhoneVerCode",
      verifyNumber: "userAccountSettings/verifynumber",
      sendSecreteCode: "userAccountSettings/getSecreteCode",
      activateApp: "userAccountSettings/activateApp",
      updateUserProfile: "userAccountSettings/updateUserProfile",
      removeAction: "userAccountSettings/remove",
      reloadUserInfo: "authenticate",
    }),

    ...mapMutations({
      saveCards: "SET_CARDS",
    }),

    // Empty form factories
    getEmptyProfileForm() {
      return {
        profile_photo: null,
        gender: null,
        marital_status: null,
        basic_health_info: {
          height: { value: null, unit: "cm" },
          weight: { value: null, unit: "kg" },
        },
        health_risk_factors: { is_smoker: null },
        contact: {
          address1: null,
          address2: null,
          state: null,
          country: null,
          zip_code: null,
          phone: { number: null, country_code: "+234" },
        },
      };
    },

    getEmptyConditionForm() {
      return {
        _id: null,
        name: null,
        description: null,
        start_date: null,
        end_date: null,
        is_condition_exists: false,
        file: null,
        existingFile: null,
      };
    },

    getEmptyContactForm() {
      return {
        _id: null,
        first_name: null,
        last_name: null,
        relationship: null,
        phone: { number: null, country_code: null },
        address1: null,
        address2: null,
        state: null,
        country: null,
        zip_code: null,
      };
    },

    getEmptyDependentForm() {
      return {
        _id: null,
        first_name: null,
        last_name: null,
        gender: null,
        date_of_birth: null,
        relationship: null,
        basic_health_info: {
          height: { unit: null, value: null },
          weight: { unit: null, value: null },
        },
        contact: {
          email: null,
          phone: { number: null, country_code: null },
          address1: null,
          address2: null,
          state: null,
          country: null,
          zip_code: null,
        },
      };
    },

    // Modal handlers
    closeModal() {
      this.selectedModal = null;
      this.qrNext = false;
    },

    openEditProfileModal() {
      const p = this.userProfile?.profile;
      this.profileForm = {
        profile_photo: null,
        gender: p?.gender,
        marital_status: p?.marital_status,
        basic_health_info: {
          height: { value: p?.basic_health_info?.height?.value, unit: p?.basic_health_info?.height?.unit || "cm" },
          weight: { value: p?.basic_health_info?.weight?.value, unit: p?.basic_health_info?.weight?.unit || "kg" },
        },
        health_risk_factors: { is_smoker: p?.health_risk_factors?.is_smoker },
        contact: {
          address1: p?.contact?.address1,
          address2: p?.contact?.address2,
          state: p?.contact?.state,
          country: p?.contact?.country,
          zip_code: p?.contact?.zip_code,
          phone: {
            number: p?.contact?.phone?.number || null,
            country_code: p?.contact?.phone?.country_code || "+234",
          },
        },
      };
      // Set the country for state dropdown dependency
      this.patientCountry = p?.contact?.country || null;
      this.selectedModal = "Edit Profile";
    },

    async openConditionModal(action, index = null) {
      this.conditionIndex = index;
      if (action === "edit" && index !== null) {
        const cond = this.userProfile.pre_existing_conditions[index];
        this.conditionForm = {
          _id: cond._id,
          name: cond.name,
          description: cond.description,
          start_date: useFormatDateNumbers(cond.start_date),
          end_date: cond.end_date,
          is_condition_exists: cond.is_condition_exists,
          file: await useConvertToFile(cond.file),
          existingFile: cond.file?.[0]?.url || null, // Store original file URL for preview
        };
      } else {
        this.conditionForm = this.getEmptyConditionForm();
      }
      this.selectedModal = "Edit Condition";
    },

    openContactModal(action, index = null) {
      this.contactIndex = index;
      if (action === "edit" && index !== null) {
        const contact = this.userProfile.emergency_contacts[index];
        this.contactForm = {
          _id: contact._id,
          first_name: contact.first_name,
          last_name: contact.last_name,
          relationship: contact.relationship,
          phone: { number: contact.phone?.number, country_code: contact.phone?.country_code || "+234" },
          address1: contact.address1,
          address2: contact.address2,
          state: contact.state,
          country: contact.country,
          zip_code: contact.zip_code,
        };
        // Set country for state dropdown dependency
        this.contactCountry = contact.country || null;
      } else {
        this.contactForm = this.getEmptyContactForm();
        this.contactCountry = null;
      }
      this.selectedModal = "Edit Contact";
    },

    openDependentModal(action, index = null) {
      this.dependentIndex = index;
      if (action === "edit" && index !== null) {
        const dep = this.userProfile.dependants[index];
        this.dependentForm = {
          _id: dep._id,
          first_name: dep.first_name,
          last_name: dep.last_name,
          gender: dep.gender,
          date_of_birth: dep.date_of_birth ? useFormatDateNumbers(dep.date_of_birth) : null,
          relationship: dep.relationship,
          basic_health_info: {
            height: { unit: dep.basic_health_info?.height?.unit || "cm", value: dep.basic_health_info?.height?.value },
            weight: { unit: dep.basic_health_info?.weight?.unit || "kg", value: dep.basic_health_info?.weight?.value },
          },
          contact: {
            email: dep.contact?.email,
            phone: { number: dep.contact?.phone?.number, country_code: dep.contact?.phone?.country_code || "+234" },
            address1: dep.contact?.address1,
            address2: dep.contact?.address2,
            state: dep.contact?.state,
            country: dep.contact?.country,
            zip_code: dep.contact?.zip_code,
          },
        };
        // Set country for state dropdown dependency
        this.dependentCountry = dep.contact?.country || null;
      } else {
        this.dependentForm = this.getEmptyDependentForm();
        this.dependentCountry = null;
      }
      this.selectedModal = "Edit Dependent";
    },

    // Country selection handlers
    selectedCountry(evtObj) {
      if (evtObj.target === "patient-country") {
        this.patientCountry = evtObj.selectedItem;
      }
    },
    selectedContactCountry(evtObj) {
      if (evtObj.target === "contact-country") {
        this.contactCountry = evtObj.selectedItem;
      }
    },
    selectedDependentCountry(evtObj) {
      if (evtObj.target === "dependent-country") {
        this.dependentCountry = evtObj.selectedItem;
      }
    },

    // Save handlers
    async updateProfile() {
      this.savingProfile = true;
      try {
        const res = await this.updateUserProfile({ profile: this.profileForm });
        if (res) {
          this.$toast.success("Profile updated successfully");
          this.closeModal();
        } else {
          this.$toast.error("Failed to update profile. Please try again.");
        }
      } catch (error) {
        console.error("Error updating profile:", error);
        this.$toast.error("An error occurred while updating profile");
      }
      this.savingProfile = false;
    },

    async saveCondition() {
      this.savingCondition = true;
      try {
        const res = await this.updateUserProfile({
          pre_existing_conditions: this.conditionForm,
        });
        if (res) {
          this.$toast.success("Condition saved successfully");
          this.closeModal();
        } else {
          this.$toast.error("Failed to save condition");
        }
      } catch (error) {
        console.error("Error saving condition:", error);
        this.$toast.error("An error occurred while saving condition");
      }
      this.savingCondition = false;
    },

    async saveContact() {
      this.savingContact = true;
      try {
        const res = await this.updateUserProfile({
          emergency_contacts: [this.contactForm],
        });
        if (res) {
          this.$toast.success("Emergency contact saved successfully");
          this.closeModal();
        } else {
          this.$toast.error("Failed to save emergency contact");
        }
      } catch (error) {
        console.error("Error saving contact:", error);
        this.$toast.error("An error occurred while saving contact");
      }
      this.savingContact = false;
    },

    async saveDependent() {
      this.savingDependent = true;
      try {
        const res = await this.updateUserProfile({
          dependants: [this.dependentForm],
        });
        if (res) {
          this.$toast.success("Dependent saved successfully");
          this.closeModal();
        } else {
          this.$toast.error("Failed to save dependent");
        }
      } catch (error) {
        console.error("Error saving dependent:", error);
        this.$toast.error("An error occurred while saving dependent");
      }
      this.savingDependent = false;
    },

    // Remove handlers
    confirmRemove(type, item) {
      this.removeType = type;
      this.removeItem = item;
      this.showRemoveModal = true;
    },

    async executeRemove() {
      this.removingItem = true;
      try {
        const res = await this.removeAction({
          id: this.removeItem._id,
          type: this.removeType,
        });
        if (res) {
          this.$toast.success("Item removed successfully");
          this.showRemoveModal = false;
        } else {
          this.$toast.error("Failed to remove item");
        }
      } catch (error) {
        console.error("Error removing item:", error);
        this.$toast.error("An error occurred while removing item");
      }
      this.removingItem = false;
    },

    // Wallet methods
    formatPrice(price) {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(price || 0);
    },

    async fetchWalletBalance() {
      try {
        const res = await http.get("wallets/balance");
        if (res.status === 200) {
          const data = res.data?.data || res.data;
          this.walletBalance = data?.currentBalance || data?.balance || 0;
        }
      } catch (e) {
        console.error("Error fetching wallet balance:", e);
      }
    },

    async fetchTransactions(reset = true) {
      if (reset) {
        this.loadingTransactions = true;
        this.transactionPage = 1;
        this.transactions = [];
      } else {
        this.loadingMoreTransactions = true;
      }

      try {
        const res = await http.get("wallets", {
          params: {
            page: this.transactionPage,
            limit: this.transactionLimit,
          },
        });

        if (res.status === 200) {
          const responseData = res.data?.data || res.data?.result || res.data;
          const newTransactions = Array.isArray(responseData)
            ? responseData
            : (responseData.transactions || responseData.docs || []);

          // Get pagination info from response
          const total = responseData.total || responseData.totalDocs || newTransactions.length;
          const totalPages = responseData.totalPages || Math.ceil(total / this.transactionLimit);

          this.totalTransactions = total;
          this.hasMoreTransactions = this.transactionPage < totalPages;

          if (reset) {
            this.transactions = newTransactions;
          } else {
            this.transactions = [...this.transactions, ...newTransactions];
          }
        }
      } catch (e) {
        console.error("Error fetching transactions:", e);
        if (reset) {
          this.transactions = [];
        }
      }

      this.loadingTransactions = false;
      this.loadingMoreTransactions = false;
    },

    async fetchUserSettings() {
      try {
        const res = await http.get("user-settings");
        if (res.status === 200) {
          const data = res.data?.data || res.data?.result || res.data;
          this.allowSpecialistCharge = data?.defaults?.allow_specialist_wallet_charge !== false;
          this.whatsappEnabled = data?.defaults?.whatsapp_notifications === true;
        }
      } catch (e) {
        console.error("Error fetching user settings:", e);
      }
    },

    async toggleWalletSetting(value) {
      this.updatingWalletSetting = true;
      try {
        await http.patch("user-settings", {
          defaults: { allow_specialist_wallet_charge: value },
        });
        this.allowSpecialistCharge = value;
        if (value) {
          this.$toast.success("Specialists can now charge your wallet for services");
        } else {
          this.$toast.success("Specialists can no longer charge your wallet");
        }
      } catch (e) {
        console.error("Error updating wallet setting:", e);
        this.allowSpecialistCharge = !value;
        this.$toast.error("Failed to update wallet setting. Please try again.");
      }
      this.updatingWalletSetting = false;
    },

    async initiateTopUp() {
      if (!this.topUpAmount || this.topUpAmount < 100) return;
      this.topUpLoading = true;
      try {
        // Set callback URL to return to this page after payment
        const callbackUrl = `${window.location.origin}/app/patient/account?payment=wallet-topup`;
        const res = await http.post("wallets/fund", {
          amount: this.topUpAmount,
          callback_url: callbackUrl
        });
        if (res.status === 200 || res.status === 201) {
          const data = res.data?.data || res.data?.result || res.data;
          if (data.authorization_url || data.paymentUrl) {
            // Store reference for verification after redirect
            localStorage.setItem('wallet_topup_reference', data.reference);
            window.location.href = data.authorization_url || data.paymentUrl;
          } else {
            await this.fetchWalletBalance();
            await this.fetchTransactions();
            this.showTopUpModal = false;
            this.topUpAmount = null;
          }
        }
      } catch (e) {
        console.error("Error initiating top up:", e);
        alert(e.response?.data?.message || "Failed to initiate payment");
      }
      this.topUpLoading = false;
    },

    async checkPaymentReturn() {
      const urlParams = new URLSearchParams(window.location.search);
      const urlReference = urlParams.get('reference') || urlParams.get('trxref');
      const storedReference = localStorage.getItem('wallet_topup_reference');

      // Check if returning from Paystack payment (has reference in URL or stored reference)
      const reference = urlReference || storedReference;

      if (reference && (urlReference || storedReference)) {
        try {
          this.$toast.info('Verifying payment...');
          const res = await http.post('wallets/fund/verify', { reference });
          if (res.data?.data?.success || res.data?.success) {
            this.$toast.success('Wallet funded successfully!');
            localStorage.removeItem('wallet_topup_reference');
          }
        } catch (e) {
          console.error('Payment verification error:', e);
          // Don't show error if already processed
          if (!e.response?.data?.message?.includes('already processed')) {
            this.$toast.error(e.response?.data?.message || 'Payment verification failed');
          }
        }
        // Clean up URL and stored reference
        localStorage.removeItem('wallet_topup_reference');
        this.$router.replace({ path: this.$route.path, query: { tab: 'wallet' } });
      }
    },

    scrollToTransactions() {
      this.$refs.transactionsSection?.scrollIntoView({ behavior: "smooth" });
    },

    setTransactionFilter(filter) {
      this.transactionFilter = filter;
    },

    async loadMoreTransactions() {
      if (this.loadingMoreTransactions || !this.hasMoreTransactions) return;
      this.transactionPage++;
      await this.fetchTransactions(false);
    },

    // Health Credits methods
    async fetchHealthCredits() {
      try {
        const res = await http.get("claude-summary/credits");
        if (res.status === 200) {
          const data = res.data?.data || res.data;
          // Map API response to component expected format
          this.healthCredits = {
            free_remaining: data.free_credits_remaining || 0,
            free_total: 5, // Default free credits per month
            purchased: data.purchased_credits || 0,
            gifted: data.gifted_credits || 0,
            unlimited: data.has_unlimited_subscription || false,
            unlimited_expires: data.unlimited_expires_at || null,
          };
        }
      } catch (e) {
        console.error("Error fetching health credits:", e);
      }
    },

    async fetchHealthPlans() {
      this.loadingPlans = true;
      try {
        const res = await http.get("claude-summary/plans");
        if (res.status === 200) {
          this.healthPlans = res.data?.data || res.data || [];
        }
      } catch (e) {
        console.error("Error fetching health plans:", e);
      }
      this.loadingPlans = false;
    },

    scrollToPlans() {
      this.$refs.plansSection?.scrollIntoView({ behavior: "smooth" });
    },

    openPurchaseModal(plan) {
      this.selectedPlan = plan;
      this.showPurchaseModal = true;
    },

    closePurchaseModal() {
      this.showPurchaseModal = false;
      this.selectedPlan = null;
    },

    async confirmPurchase() {
      if (!this.selectedPlan) return;

      this.purchasingPlan = true;
      try {
        const res = await http.post("claude-summary/purchase", { plan_id: this.selectedPlan._id });
        if (res.status === 200 || res.status === 201) {
          await this.fetchHealthCredits();
          await this.fetchWalletBalance();
          await this.fetchTransactions();
          this.$toast.success("Plan purchased successfully!");
          this.closePurchaseModal();
        }
      } catch (e) {
        console.error("Error purchasing plan:", e);
        this.$toast.error(e.response?.data?.message || "Failed to purchase plan");
      }
      this.purchasingPlan = false;
    },

    // Credit Sharing methods
    async fetchCreditSharingSettings() {
      try {
        const res = await http.get("claude-summary/sharing/settings");
        if (res.status === 200) {
          this.creditSharingSettings = res.data?.data || res.data;
        }
      } catch (e) {
        console.error("Error fetching sharing settings:", e);
      }
    },

    openShareCreditsModal() {
      this.shareStep = 1;
      this.searchQuery = '';
      this.searchResults = [];
      this.selectedPatient = null;
      this.creditsToSend = this.creditSharingSettings?.min_amount || 1;
      this.showShareModal = true;
    },

    closeShareModal() {
      this.showShareModal = false;
      this.shareStep = 1;
      this.searchQuery = '';
      this.searchResults = [];
      this.selectedPatient = null;
    },

    onSearchInput() {
      if (this.searchTimeout) clearTimeout(this.searchTimeout);
      if (this.searchQuery.length < 2) {
        this.searchResults = [];
        return;
      }
      this.searchTimeout = setTimeout(() => this.searchPatients(), 300);
    },

    async searchPatients() {
      try {
        this.searching = true;
        const res = await http.get(`claude-summary/sharing/search?query=${encodeURIComponent(this.searchQuery)}`);
        if (res.status === 200) {
          this.searchResults = res.data?.data || res.data || [];
        }
      } catch (e) {
        console.error("Error searching patients:", e);
        this.searchResults = [];
      } finally {
        this.searching = false;
      }
    },

    selectPatient(patient) {
      if (this.selectedPatient?.id === patient.id) {
        this.selectedPatient = null;
      } else {
        this.selectedPatient = patient;
      }
    },

    getInitials(name) {
      if (!name) return '?';
      const parts = name.split(' ');
      return parts.map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('');
    },

    proceedToConfirmation() {
      if (this.canProceedToConfirm) {
        this.shareStep = 2;
      }
    },

    async executeTransfer() {
      try {
        this.transferring = true;
        const res = await http.post("claude-summary/sharing/transfer", {
          recipient_id: this.selectedPatient.id,
          credits: this.creditsToSend,
        });
        if (res.status === 200 || res.status === 201) {
          this.shareStep = 3;
          await this.fetchHealthCredits();
          await this.fetchCreditTransactions();
        }
      } catch (e) {
        console.error("Error transferring credits:", e);
        this.$toast.error(e.response?.data?.message || "Failed to transfer credits");
      } finally {
        this.transferring = false;
      }
    },

    // AI Credit Transactions methods
    async fetchCreditTransactions(append = false) {
      if (append) {
        this.loadingMoreCreditTransactions = true;
      } else {
        this.loadingCreditTransactions = true;
        this.creditTransactionPage = 1;
      }
      try {
        const res = await http.get(`claude-summary/transactions?page=${this.creditTransactionPage}&limit=${this.creditTransactionLimit}`);
        if (res.status === 200) {
          const data = res.data?.data || res.data;
          const newTransactions = data.transactions || data || [];
          if (append) {
            this.creditTransactions = [...this.creditTransactions, ...newTransactions];
          } else {
            this.creditTransactions = newTransactions;
          }
          const total = data.pagination?.total || data.total || newTransactions.length;
          this.hasMoreCreditTransactions = this.creditTransactions.length < total;
        }
      } catch (e) {
        console.error("Error fetching credit transactions:", e);
      } finally {
        this.loadingCreditTransactions = false;
        this.loadingMoreCreditTransactions = false;
      }
    },

    async loadMoreCreditTransactions() {
      if (this.loadingMoreCreditTransactions || !this.hasMoreCreditTransactions) return;
      this.creditTransactionPage++;
      await this.fetchCreditTransactions(true);
    },

    // Quick Actions handler
    handleQuickAction(action) {
      if (action === 'health-score') {
        this.$router.push('/app/patient/advanced-health-score/history');
      } else if (action === 'buy-credits') {
        this.scrollToPlans();
      } else if (action === 'cards') {
        // Scroll to payment methods section
        const paymentMethodsEl = document.querySelector('.payment-methods-section');
        paymentMethodsEl?.scrollIntoView({ behavior: 'smooth' });
      }
    },

    // Download methods
    formatDateForExport(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },

    async fetchAllWalletTransactions() {
      try {
        const res = await http.get("wallets?limit=1000");
        if (res.status === 200) {
          const data = res.data?.data || res.data;
          return Array.isArray(data) ? data : (data.transactions || []);
        }
        return [];
      } catch (e) {
        console.error("Error fetching all transactions:", e);
        return [];
      }
    },

    async fetchAllCreditTransactions() {
      try {
        const res = await http.get("claude-summary/transactions?limit=1000");
        if (res.status === 200) {
          const data = res.data?.data || res.data;
          return data.transactions || data || [];
        }
        return [];
      } catch (e) {
        console.error("Error fetching all credit transactions:", e);
        return [];
      }
    },

    async downloadWalletStatement(format) {
      this.$toast.info('Preparing download...');
      const allTransactions = await this.fetchAllWalletTransactions();
      if (allTransactions.length === 0) {
        this.$toast.warning('No transactions to download');
        return;
      }
      const data = allTransactions.map(txn => ({
        Date: this.formatDateForExport(txn.created_at || txn.createdAt),
        Description: txn.narration || txn.description || 'Transaction',
        Type: txn.type || 'N/A',
        Amount: txn.amount || 0,
      }));
      if (format === 'csv') {
        this.downloadCSV(data, 'wallet-statement');
      } else {
        this.downloadPDF(data, 'Wallet Statement', 'wallet-statement');
      }
    },

    async downloadCreditsStatement(format) {
      this.$toast.info('Preparing download...');
      const allCreditTransactions = await this.fetchAllCreditTransactions();
      if (allCreditTransactions.length === 0) {
        this.$toast.warning('No credit transactions to download');
        return;
      }
      const data = allCreditTransactions.map(txn => ({
        Date: this.formatDateForExport(txn.created_at),
        Description: this.getCreditTxnDescription(txn),
        Type: txn.transaction_type || txn.type || 'N/A',
        Credits: txn.credits || txn.amount || 1,
      }));
      if (format === 'csv') {
        this.downloadCSV(data, 'ai-credits-statement');
      } else {
        this.downloadPDF(data, 'AI Credits Statement', 'ai-credits-statement', true);
      }
    },

    getCreditTxnDescription(txn) {
      const type = txn.transaction_type?.toLowerCase() || txn.type?.toLowerCase() || '';
      if (type.includes('purchase')) return 'Credits purchased';
      if (type.includes('consumed') || type.includes('used')) return txn.description || 'Credit used for health score';
      if (type.includes('received')) return `Credits received from ${txn.sender_name || 'patient'}`;
      if (type.includes('sent') || type.includes('transfer')) return `Credits sent to ${txn.recipient_name || 'patient'}`;
      if (type.includes('gifted')) return 'Credits gifted';
      if (type.includes('free')) return 'Free monthly credits';
      return txn.description || txn.narration || 'Credit transaction';
    },

    downloadCSV(data, filename) {
      if (data.length === 0) return;
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => `"${row[h]}"`).join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.$toast.success('CSV downloaded successfully');
    },

    downloadPDF(data, title, filename, isCredits = false) {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        this.$toast.error('Please allow popups to download PDF');
        return;
      }
      const headers = Object.keys(data[0]);
      const tableRows = data.map(row =>
        `<tr>${headers.map(h => `<td style="padding: 8px; border: 1px solid #ddd;">${row[h]}</td>`).join('')}</tr>`
      ).join('');
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
            .subtitle { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: ${isCredits ? '#0891b2' : '#ea580c'}; color: white; padding: 10px; text-align: left; }
            td { padding: 8px; border: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9f9f9; }
            .footer { margin-top: 30px; font-size: 12px; color: #999; text-align: center; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-NG', {
            year: 'numeric', month: 'long', day: 'numeric'
          })}</p>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <p class="footer">Rapid Capsule - ${title}</p>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
      this.$toast.success('PDF ready for download');
    },

    // Card methods
    async addCard() {
      try {
        const res = await axios.post("cards");
        const details = {
          amount: res.data?.data?.amount,
          key: res.headers["x-paystack-key"],
          ref: res.data?.data?.reference,
        };
        this.getPaystack(details);

        const socket = io(`${process.env.VUE_APP_API_GATEWAY}/websockets`);
        socket.on("event", async (evt) => {
          if (evt.data?.status === "success") {
            const cardRes = await axios.get("cards");
            this.$store.commit("SET_CARDS", cardRes.data?.data);
            socket.disconnect();
          }
        });
      } catch (e) {
        console.error("Error adding card:", e);
      }
    },

    getPaystack(data) {
      const handler = PaystackPop.setup({
        key: data.key,
        email: this.userProfile?.profile?.contact?.email,
        amount: data.amount,
        ref: data.ref,
        callback: async (res) => {
          try {
            await axios.post("cards/verify", { reference: res.reference });
          } catch (e) {
            console.error("Error verifying card:", e);
          }
        },
      });
      handler.openIframe();
    },

    setDefaultCard(card) {
      // Implement set default card
    },

    removeCard(card) {
      // Implement remove card
    },

    // Security methods
    handlePasswordReset() {
      localStorage.clear();
      sessionStorage.clear();
      window.location = "/reset-password/request-link";
    },

    async selectedMethod(method) {
      const index = this.twoFAs.findIndex((m) => m.name === method.name);
      if (index === -1) return;

      if (method.name === "email") {
        this.twoFAs[index].isLoading = true;
        await this.updateTwoFA("EMAIL");
        this.twoFAs[index].isLoading = false;
      }

      if (method.name === "sms") {
        if (!this.userProfile?.is_phone_verified) {
          this.twoFAs[index].isLoading = true;
          const phone = this.userProfile?.profile?.contact?.phone?.number?.replace(/[-]/g, "");
          this.sendVerCode(phone);
          this.selectedModal = "Verify Phone";
        } else {
          this.twoFAs[index].isLoading = true;
          await this.updateTwoFA("SMS");
          this.twoFAs[index].isLoading = false;
        }
      }

      if (method.name === "auth_apps") {
        if (!this.userProfile?.is_auth_app_enabled) {
          this.twoFAs[index].isLoading = true;
          const token = localStorage.getItem("token") || sessionStorage.getItem("token");
          this.sendSecreteCode(token);
        } else {
          this.twoFAs[index].isLoading = true;
          await this.updateTwoFA("AUTH_APPS");
          this.twoFAs[index].isLoading = false;
        }
      }
    },

    handleChangeAction(method) {
      if (method.title === SECURITY_UPDATE_OPTIONS.EMAIL) {
        this.isChangingEmail = true;
      } else if (method.title === SECURITY_UPDATE_OPTIONS.SMS) {
        this.isChangingPhoneNumber = true;
      }
    },

    handleDisplayOtpDialog({ type, payload }) {
      this.isChangingEmail = false;
      this.isChangingPhoneNumber = false;
      this.hasSentOtp = true;
      this.payloadForOtpVerification = payload;
      this.otpVerificationModalTitle = OTP_VERIFICATION_CONTENT[type].title;
      this.otpVerificationModalDescription = OTP_VERIFICATION_CONTENT[type].description;
    },

    async handleFetchUser() {
      this.hasSentOtp = false;
      this.payloadForOtpVerification = "";
      this.otpVerificationModalTitle = "";
      this.otpVerificationModalDescription = "";
      await this.reloadUserInfo();
    },

    resendCode() {
      const phone = this.userProfile?.profile?.contact?.phone?.number;
      this.sendVerCode(phone);
    },

    async autoSubmitPhone() {
      if (this.otpPhone.length >= 6) {
        this.loadingPhone = true;
        const phone = "0" + this.userProfile?.profile?.contact?.phone?.number;
        await this.verifyNumber({ code: this.otpPhone.join(""), phone });
        this.closeModal();
        this.loadingPhone = false;
      }
    },

    async autoSubmitApp() {
      if (this.otpApp.length >= 6) {
        this.loadingApp = true;
        await this.activateApp({ code: this.otpApp.join("") });
        this.closeModal();
        this.loadingApp = false;
      }
    },

    async toggleWhatsapp(value) {
      this.updatingWhatsapp = true;
      try {
        await http.patch("user-settings", {
          defaults: { whatsapp_notifications: value },
        });
        this.whatsappEnabled = value;
      } catch (e) {
        console.error("Error updating WhatsApp setting:", e);
        this.whatsappEnabled = !value;
      }
      this.updatingWhatsapp = false;
    },
  },

  watch: {
    QRCode(value) {
      if (value) {
        this.selectedModal = "Auth App";
      }
    },

    userSettings: {
      handler(val) {
        if (val?.defaults?.twoFA_medium) {
          const medium = val.defaults.twoFA_medium.toLowerCase();
          this.twoFAs.forEach((item) => {
            item.isActive = item.name === medium;
          });
        }
      },
      immediate: true,
      deep: true,
    },
  },

  async mounted() {
    // Load Paystack script
    const scripts = document.getElementsByTagName("script");
    const hasPaystack = Array.from(scripts).some(
      (s) => s.src === "https://js.paystack.co/v1/inline.js"
    );
    if (!hasPaystack) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      document.head.appendChild(script);
    }

    // Check for wallet top-up payment return from Paystack
    await this.checkPaymentReturn();

    // Fetch wallet data
    await Promise.all([
      this.fetchWalletBalance(),
      this.fetchTransactions(),
      this.fetchUserSettings(),
      this.fetchHealthCredits(),
      this.fetchHealthPlans(),
      this.fetchCreditSharingSettings(),
      this.fetchCreditTransactions(),
    ]);

    // Check for tab param
    const tab = this.$route.query.tab;
    if (tab && ['profile', 'wallet', 'security'].includes(tab)) {
      this.activeTab = tab;
    }
  },
};
</script>

<style scoped lang="scss">
.account-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 1200px;
  width: 100%;
  flex-grow: 1;
  height: 100vh;
  background: #f9fafb;
  overflow-x: hidden;

  &__body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 24px 100px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;

    @media (max-width: 768px) {
      padding: 0 16px 100px;
    }

    @media (max-width: 480px) {
      padding: 0 8px 100px;
    }
  }
}

.tabs-container {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f9fafb;
  padding: 16px 0 20px;

  @media (max-width: 480px) {
    padding: 12px 0 16px;
  }

  .tabs {
    display: flex;
    gap: 8px;
    background: white;
    padding: 6px;
    border-radius: 12px;
    border: 2px solid #e5e7eb;
    width: fit-content;

    @media (max-width: 640px) {
      width: 100%;
      overflow-x: auto;
      gap: 4px;
      padding: 4px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      background: transparent;
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      @media (max-width: 640px) {
        padding: 10px 14px;
        font-size: 13px;
        gap: 6px;
        flex: 1;
        justify-content: center;
      }

      @media (max-width: 480px) {
        padding: 10px 12px;
        font-size: 12px;
        gap: 4px;
      }

      &:hover {
        background: #f3f4f6;
        color: #374151;
      }

      &.active {
        background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(14, 174, 196, 0.25);
      }
    }
  }
}

.tab-content {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;

  .tab-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    max-width: 100%;

    @media (max-width: 480px) {
      gap: 16px;
    }
  }
}

.two-col-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 100%;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }

  // Ensure grid children don't overflow
  > * {
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }
}

.wallet-bottom-grid {
  @media (max-width: 480px) {
    // Force single column with explicit width constraints
    display: flex;
    flex-direction: column;
    width: 100%;
  }
}

.grid-item-wrapper {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.wallet-main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  width: 100%;
  max-width: 100%;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (max-width: 480px) {
    gap: 12px;
  }
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Top Up Modal
.modal-overlay {
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
  padding: 16px;
}

.top-up-modal {
  background: white;
  border-radius: 20px;
  padding: 28px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);

  @media (max-width: 480px) {
    padding: 20px 16px;
    border-radius: 16px;
  }

  h3 {
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 8px 0;

    @media (max-width: 480px) {
      font-size: 20px;
    }
  }

  p {
    font-size: 14px;
    color: #6b7280;
    margin: 0 0 24px 0;

    @media (max-width: 480px) {
      margin: 0 0 20px 0;
      font-size: 13px;
    }
  }

  .amount-input-wrapper {
    display: flex;
    align-items: center;
    background: #f3f4f6;
    border-radius: 12px;
    padding: 4px 20px;
    margin-bottom: 20px;

    @media (max-width: 480px) {
      padding: 4px 14px;
      margin-bottom: 16px;
    }

    .currency-symbol {
      font-size: 22px;
      font-weight: 600;
      color: #6b7280;
      margin-right: 8px;

      @media (max-width: 480px) {
        font-size: 18px;
        margin-right: 6px;
      }
    }

    input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 28px;
      font-weight: 700;
      padding: 14px 0;
      outline: none;
      color: #111827;
      min-width: 0;

      @media (max-width: 480px) {
        font-size: 22px;
        padding: 12px 0;
      }

      &::placeholder {
        color: #d1d5db;
      }
    }
  }

  .quick-amounts {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 24px;

    @media (max-width: 480px) {
      gap: 8px;
      margin-bottom: 20px;
    }

    button {
      padding: 10px 16px;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      background: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      color: #374151;

      @media (max-width: 480px) {
        padding: 8px 12px;
        font-size: 12px;
        border-radius: 8px;
      }

      &:hover {
        border-color: #0EAEC4;
        color: #0EAEC4;
      }

      &.active {
        background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
        border-color: transparent;
        color: white;
      }
    }
  }

  .modal-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;

    @media (max-width: 480px) {
      gap: 10px;
    }

    .btn {
      width: 100%;
      padding: 16px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;

      @media (max-width: 480px) {
        padding: 14px;
        font-size: 14px;
        border-radius: 10px;
      }

      &.primary {
        background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
        color: white;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(14, 174, 196, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      &.secondary {
        background: #f3f4f6;
        color: #6b7280;

        &:hover {
          background: #e5e7eb;
          color: #374151;
        }
      }
    }
  }
}

// Purchase Modal
.purchase-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  @media (max-width: 480px) {
    border-radius: 16px;
    max-width: calc(100% - 32px);
  }

  &__header {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 24px;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 179, 8, 0.05) 100%);
    border-bottom: 1px solid #f3f4f6;

    @media (max-width: 480px) {
      padding: 20px 16px;
      gap: 12px;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;

      @media (max-width: 480px) {
        width: 40px;
        height: 40px;
        border-radius: 12px;
      }
    }

    .header-text {
      flex: 1;

      h3 {
        font-size: 20px;
        font-weight: 700;
        color: #111827;
        margin: 0 0 4px 0;

        @media (max-width: 480px) {
          font-size: 18px;
        }
      }

      p {
        font-size: 14px;
        color: #6b7280;
        margin: 0;

        @media (max-width: 480px) {
          font-size: 13px;
        }
      }
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #111827;
      }
    }
  }

  &__body {
    padding: 24px;

    @media (max-width: 480px) {
      padding: 20px 16px;
    }

    .wallet-info {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
      border-radius: 14px;
      margin-bottom: 20px;

      @media (max-width: 480px) {
        padding: 14px;
        gap: 12px;
        margin-bottom: 16px;
      }

      .wallet-icon {
        width: 44px;
        height: 44px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;

        @media (max-width: 480px) {
          width: 38px;
          height: 38px;
        }
      }

      .wallet-details {
        display: flex;
        flex-direction: column;

        .wallet-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 2px;
        }

        .wallet-amount {
          font-size: 22px;
          font-weight: 700;
          color: white;

          @media (max-width: 480px) {
            font-size: 20px;
          }
        }
      }
    }

    .plan-details {
      .plan-card-preview {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 16px;
        background: #f9fafb;
        border-radius: 12px;
        margin-bottom: 16px;

        @media (max-width: 480px) {
          padding: 14px;
          gap: 12px;
        }

        .plan-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;

          &.subscription {
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          }

          @media (max-width: 480px) {
            width: 42px;
            height: 42px;
          }
        }

        .plan-info {
          h4 {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 4px 0;

            @media (max-width: 480px) {
              font-size: 15px;
            }
          }

          p {
            font-size: 14px;
            color: #6b7280;
            margin: 0;

            strong {
              color: #111827;
            }

            @media (max-width: 480px) {
              font-size: 13px;
            }
          }
        }
      }

      .transaction-summary {
        background: #f9fafb;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;

        @media (max-width: 480px) {
          padding: 14px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;

          &:last-child {
            border-bottom: none;
          }

          .label {
            font-size: 14px;
            color: #6b7280;

            @media (max-width: 480px) {
              font-size: 13px;
            }
          }

          .value {
            font-size: 14px;
            font-weight: 600;
            color: #111827;

            @media (max-width: 480px) {
              font-size: 13px;
            }
          }

          &.total {
            padding-top: 14px;
            margin-top: 4px;

            .label {
              font-weight: 600;
              color: #111827;
            }

            .value {
              font-size: 16px;
              color: #10b981;

              @media (max-width: 480px) {
                font-size: 15px;
              }
            }

            &.insufficient .value {
              color: #ef4444;
            }
          }
        }
      }

      .insufficient-alert {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px;
        background: rgba(239, 68, 68, 0.1);
        border-radius: 12px;
        border: 1px solid rgba(239, 68, 68, 0.2);
        color: #ef4444;

        @media (max-width: 480px) {
          padding: 12px;
          gap: 10px;
        }

        .alert-content {
          strong {
            display: block;
            font-size: 14px;
            margin-bottom: 4px;

            @media (max-width: 480px) {
              font-size: 13px;
            }
          }

          p {
            font-size: 13px;
            margin: 0;
            opacity: 0.9;

            @media (max-width: 480px) {
              font-size: 12px;
            }
          }
        }
      }
    }
  }

  &__footer {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #f3f4f6;
    background: #fafafa;

    @media (max-width: 480px) {
      padding: 16px;
      gap: 10px;
    }

    .btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;

      @media (max-width: 480px) {
        padding: 12px 16px;
        font-size: 14px;
        border-radius: 10px;
      }

      &.primary {
        background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
        color: white;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(14, 174, 196, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      &.secondary {
        background: white;
        color: #6b7280;
        border: 2px solid #e5e7eb;

        &:hover {
          background: #f3f4f6;
          color: #374151;
        }
      }
    }
  }
}

// Dialog Modal overrides
.modal__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  width: 100%;
}

.modal__body-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 24px 8px 32px;
  width: 100%;
  max-width: 500px;

  p {
    font-size: 16px;
    color: #6b7280;
    text-align: center;
  }

  img {
    max-width: 200px;
    border-radius: 12px;
  }
}

.body__inputs {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.input__group {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.input__group--row {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.caution {
  display: flex;
  gap: 24px;
  width: 95%;

  .text {
    text-align: left;
    font-size: 16px;
    color: #374151;
    line-height: 1.5;
  }
}

.align-center {
  text-align: center;
}

// Edit Profile Modal
.edit-profile-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    max-width: 100%;
    max-height: 95vh;
    border-radius: 20px 20px 0 0;
    margin-top: auto;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: linear-gradient(135deg, rgba(14, 174, 196, 0.08) 0%, rgba(8, 145, 178, 0.04) 100%);
    border-bottom: 1px solid #e5e7eb;

    @media (max-width: 480px) {
      padding: 16px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 14px;
      color: #0EAEC4;

      @media (max-width: 480px) {
        gap: 10px;
      }

      .header-text {
        h3 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 2px 0;

          @media (max-width: 480px) {
            font-size: 18px;
          }
        }

        p {
          font-size: 13px;
          color: #6b7280;
          margin: 0;

          @media (max-width: 480px) {
            font-size: 12px;
          }
        }
      }
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #ef4444;
      }
    }
  }

  &__body {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;

    @media (max-width: 480px) {
      padding: 16px;
      gap: 20px;
    }

    // Avatar Section
    .profile-avatar-section {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 16px;
      border: 1px solid #e5e7eb;

      @media (max-width: 480px) {
        flex-direction: column;
        text-align: center;
        padding: 16px;
        gap: 12px;
      }

      .avatar-info {
        h4 {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 4px 0;

          @media (max-width: 480px) {
            font-size: 16px;
          }
        }

        p {
          font-size: 13px;
          color: #6b7280;
          margin: 0;

          @media (max-width: 480px) {
            font-size: 12px;
          }
        }
      }
    }

    // Form Sections
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 16px;

      @media (max-width: 480px) {
        gap: 12px;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #0EAEC4;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;

        span {
          font-size: 15px;
          font-weight: 600;
          color: #374151;

          @media (max-width: 480px) {
            font-size: 14px;
          }
        }
      }
    }

    // Form Grid layouts
    .form-grid {
      display: grid;
      gap: 16px;

      @media (max-width: 480px) {
        gap: 12px;
      }

      &.single-col {
        grid-template-columns: 1fr;
      }

      &.two-col {
        grid-template-columns: repeat(2, 1fr);

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      &.three-col {
        grid-template-columns: repeat(3, 1fr);

        @media (max-width: 768px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 480px) {
          grid-template-columns: 1fr;
        }
      }
    }
  }

  &__footer {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #e5e7eb;
    background: #fafafa;

    @media (max-width: 480px) {
      padding: 16px;
      gap: 10px;
    }

    .btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;

      @media (max-width: 480px) {
        padding: 12px 16px;
        font-size: 14px;
        border-radius: 10px;
      }

      &.primary {
        background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
        color: white;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(14, 174, 196, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      &.secondary {
        background: white;
        color: #6b7280;
        border: 2px solid #e5e7eb;

        &:hover {
          background: #f3f4f6;
          color: #374151;
        }
      }
    }
  }
}

// Enhanced Modal (Condition, Contact, Dependent)
.enhanced-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    max-width: 100%;
    max-height: 95vh;
    border-radius: 20px 20px 0 0;
    margin-top: auto;
  }

  &.condition-modal {
    max-width: 560px;
  }

  &.contact-modal {
    max-width: 640px;
  }

  &.dependent-modal {
    max-width: 680px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    background: linear-gradient(135deg, rgba(14, 174, 196, 0.08) 0%, rgba(8, 145, 178, 0.04) 100%);
    border-bottom: 1px solid #e5e7eb;

    @media (max-width: 480px) {
      padding: 16px;
    }

    &.emergency {
      background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.04) 100%);

      .header-content {
        color: #ef4444;
      }
    }

    &.dependent {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(124, 58, 237, 0.04) 100%);

      .header-content {
        color: #8b5cf6;
      }
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 14px;
      color: #0EAEC4;

      @media (max-width: 480px) {
        gap: 10px;
      }

      .header-text {
        h3 {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 2px 0;

          @media (max-width: 480px) {
            font-size: 18px;
          }
        }

        p {
          font-size: 13px;
          color: #6b7280;
          margin: 0;

          @media (max-width: 480px) {
            font-size: 12px;
          }
        }
      }
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6b7280;
      transition: all 0.2s ease;
      flex-shrink: 0;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
        color: #ef4444;
      }
    }
  }

  &__body {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 24px;

    @media (max-width: 480px) {
      padding: 16px;
      gap: 20px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 16px;

      @media (max-width: 480px) {
        gap: 12px;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #0EAEC4;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;

        span {
          font-size: 15px;
          font-weight: 600;
          color: #374151;

          @media (max-width: 480px) {
            font-size: 14px;
          }
        }
      }

      .section-hint {
        font-size: 13px;
        color: #6b7280;
        margin: -8px 0 8px 0;

        @media (max-width: 480px) {
          font-size: 12px;
        }
      }
    }

    .form-grid {
      display: grid;
      gap: 16px;

      @media (max-width: 480px) {
        gap: 12px;
      }

      &.single-col {
        grid-template-columns: 1fr;
      }

      &.two-col {
        grid-template-columns: repeat(2, 1fr);

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      &.three-col {
        grid-template-columns: repeat(3, 1fr);

        @media (max-width: 768px) {
          grid-template-columns: repeat(2, 1fr);
        }

        @media (max-width: 480px) {
          grid-template-columns: 1fr;
        }
      }
    }

    .existing-document {
      margin-top: 12px;

      .doc-preview {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1px solid #86efac;
        border-radius: 12px;
        color: #16a34a;

        @media (max-width: 480px) {
          padding: 12px;
          gap: 10px;
        }

        span {
          flex: 1;
          font-size: 14px;
          font-weight: 500;

          @media (max-width: 480px) {
            font-size: 13px;
          }
        }

        .view-link {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: #16a34a;
          color: white;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;

          @media (max-width: 480px) {
            padding: 5px 10px;
            font-size: 12px;
          }

          &:hover {
            background: #15803d;
            transform: translateY(-1px);
          }
        }
      }
    }
  }

  &__footer {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #e5e7eb;
    background: #fafafa;

    @media (max-width: 480px) {
      padding: 16px;
      gap: 10px;
    }

    .btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;

      @media (max-width: 480px) {
        padding: 12px 16px;
        font-size: 14px;
        border-radius: 10px;
      }

      &.primary {
        background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
        color: white;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(14, 174, 196, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      &.secondary {
        background: white;
        color: #6b7280;
        border: 2px solid #e5e7eb;

        &:hover {
          background: #f3f4f6;
          color: #374151;
        }
      }
    }
  }
}

// Payment Methods Section
.payment-methods-section {
  margin-top: 24px;

  @media (max-width: 480px) {
    margin-top: 16px;
  }
}

// Share Credits Modal
.share-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2);

  @media (max-width: 480px) {
    border-radius: 16px;
    max-height: 85vh;
    margin: 0 16px;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #e5e7eb;

    @media (max-width: 480px) {
      padding: 16px;
    }

    h3 {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 0;
      flex: 1;
      text-align: center;
    }

    .close-btn, .back-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f3f4f6;
      border: none;
      border-radius: 10px;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #e5e7eb;
        color: #374151;
      }
    }
  }

  &__body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;

    @media (max-width: 480px) {
      padding: 16px;
    }

    .share-balance-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, rgba(14, 174, 196, 0.1) 0%, rgba(8, 145, 178, 0.1) 100%);
      border: 1px solid rgba(14, 174, 196, 0.3);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 16px;
      color: #0891b2;

      .banner-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .banner-label {
        font-size: 12px;
        opacity: 0.8;
      }

      .banner-value {
        font-size: 20px;
        font-weight: 700;
      }
    }

    .share-note {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #92400e;
    }

    .form-group {
      margin-bottom: 20px;

      label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 8px;
      }
    }

    .search-input {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px 14px;
      transition: all 0.2s ease;

      &:focus-within {
        border-color: #0891b2;
        background: white;
      }

      svg {
        color: #9ca3af;
        flex-shrink: 0;
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 14px;
        color: #111827;
        outline: none;

        &::placeholder {
          color: #9ca3af;
        }
      }

      .search-loading svg {
        animation: spin 1s linear infinite;
      }
    }

    .search-results {
      margin-top: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      max-height: 200px;
      overflow-y: auto;
    }

    .patient-result {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      border-bottom: 1px solid #f3f4f6;

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #f9fafb;
      }

      &.selected {
        background: rgba(14, 174, 196, 0.1);
      }

      .patient-avatar {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 600;
        font-size: 14px;
        overflow: hidden;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .patient-details {
        flex: 1;
        min-width: 0;

        .patient-name {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .patient-email {
          display: block;
          font-size: 12px;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .check-icon {
        width: 24px;
        height: 24px;
        background: #10b981;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      }
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px;
      text-align: center;
      color: #9ca3af;

      span {
        font-size: 13px;
      }
    }

    .credits-input {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      padding: 12px 14px;
      transition: all 0.2s ease;

      &:focus-within {
        border-color: #0891b2;
        background: white;
      }

      input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        outline: none;
        width: 100%;

        &::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }
      }

      .credits-suffix {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
      }
    }

    .input-hint {
      display: block;
      font-size: 12px;
      color: #9ca3af;
      margin-top: 6px;
    }

    &.confirm-body {
      text-align: center;
    }

    .confirm-header {
      padding: 20px 0;
      color: #0891b2;

      .confirm-subtitle {
        font-size: 14px;
        color: #6b7280;
        margin: 12px 0 4px;
      }

      .confirm-amount {
        font-size: 28px;
        font-weight: 700;
        color: #0891b2;
        margin: 0;
      }

      .confirm-recipient {
        font-size: 14px;
        color: #6b7280;
        margin: 4px 0 0;

        strong {
          color: #111827;
        }
      }
    }

    .confirm-summary {
      background: #f9fafb;
      border-radius: 12px;
      padding: 16px;
      margin: 16px 0;
      text-align: left;

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        font-size: 14px;
        color: #6b7280;

        &.highlight {
          color: #ef4444;
        }

        &.total {
          font-weight: 600;
          color: #111827;
        }
      }

      .summary-divider {
        height: 1px;
        background: #e5e7eb;
        margin: 8px 0;
      }
    }

    .confirm-warning {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #fef3c7;
      border-radius: 8px;
      font-size: 13px;
      color: #92400e;
    }

    &.success-body {
      text-align: center;
      padding: 40px 24px;

      .success-icon {
        width: 64px;
        height: 64px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        margin: 0 auto 20px;
      }

      h3 {
        font-size: 20px;
        font-weight: 700;
        color: #111827;
        margin: 0 0 8px;
      }

      .success-text {
        font-size: 15px;
        color: #6b7280;
        margin: 0 0 8px;
      }

      .success-note {
        font-size: 13px;
        color: #9ca3af;
        margin: 0 0 24px;
      }

      .btn {
        width: 100%;
      }
    }
  }

  &__footer {
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #e5e7eb;

    @media (max-width: 480px) {
      padding: 16px;
    }

    .btn {
      flex: 1;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;

      &.primary {
        background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
        color: white;

        &:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(14, 174, 196, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      &.secondary {
        background: white;
        color: #6b7280;
        border: 2px solid #e5e7eb;

        &:hover:not(:disabled) {
          background: #f3f4f6;
          color: #374151;
        }

        &:disabled {
          opacity: 0.6;
        }
      }
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
