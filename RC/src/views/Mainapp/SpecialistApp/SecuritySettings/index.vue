<template>
  <div class="security-settings-page">
    <!-- Mobile Header -->
    <header class="mobile-header">
      <button class="menu-btn" @click="$emit('openSideNav')">
        <v-icon name="hi-menu-alt-2" scale="1.2" />
      </button>
      <div class="header-logo">
        <img src="/RapidCapsule_Logo.png" alt="Rapid Capsule" />
      </div>
      <button class="notification-btn" @click="$router.push('/app/specialist/notifications')">
        <v-icon name="hi-bell" scale="1.1" />
      </button>
    </header>

    <!-- Page Content -->
    <div class="page-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <v-icon name="hi-shield-check" scale="1.2" class="spinner-icon" />
        </div>
        <p>Loading security settings...</p>
      </div>

      <template v-else>
        <!-- Hero Section -->
        <section class="hero">
          <div class="hero__content">
            <button class="back-link desktop-only" @click="$router.push('/app/specialist/specialist-dashboard')">
              <v-icon name="hi-arrow-left" scale="0.85" />
              <span>Dashboard</span>
            </button>
            <div class="hero__badge">
              <div class="badge-pulse"></div>
              <v-icon name="hi-shield-check" />
              <span>Stay Protected</span>
            </div>
            <h1 class="hero__title">
              Security<br/>
              <span class="hero__title-accent">Settings</span>
            </h1>
            <p class="hero__subtitle">
              Protect your account with password management, two-factor authentication, and secure communication options.
            </p>
            <div class="hero__stats">
              <div class="hero-stat">
                <span class="hero-stat__value">{{ twoFAEnabled ? '1' : '0' }}</span>
                <span class="hero-stat__label">2FA Active</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--info">3</span>
                <span class="hero-stat__label">Methods</span>
              </div>
              <div class="hero-stat__divider"></div>
              <div class="hero-stat">
                <span class="hero-stat__value hero-stat__value--success" :class="{ 'hero-stat__value--warning': !whatsappEnabled }">
                  {{ whatsappEnabled ? 'On' : 'Off' }}
                </span>
                <span class="hero-stat__label">WhatsApp</span>
              </div>
            </div>
          </div>
          <div class="hero__visual">
            <div class="security-orb">
              <div class="orb-ring orb-ring--1"></div>
              <div class="orb-ring orb-ring--2"></div>
              <div class="orb-ring orb-ring--3"></div>
              <div class="orb-core">
                <v-icon name="hi-shield-check" />
              </div>
            </div>
            <div class="floating-icons">
              <div class="float-icon float-icon--1"><v-icon name="hi-lock-closed" /></div>
              <div class="float-icon float-icon--2"><v-icon name="hi-key" /></div>
              <div class="float-icon float-icon--3"><v-icon name="hi-finger-print" /></div>
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
              <button class="action-btn" @click="handlePasswordReset">
                <div class="action-icon sky">
                  <v-icon name="hi-key" scale="1.1" />
                </div>
                <span>Change Password</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/specialist/notification-settings')">
                <div class="action-icon violet">
                  <v-icon name="hi-bell" scale="1.1" />
                </div>
                <span>Notifications</span>
              </button>
              <button class="action-btn" @click="$router.push('/app/specialist/specialist-account')">
                <div class="action-icon emerald">
                  <v-icon name="hi-user" scale="1.1" />
                </div>
                <span>Account</span>
              </button>
              <button class="action-btn" @click="scrollToWhatsapp">
                <div class="action-icon whatsapp">
                  <v-icon name="co-whatsapp" scale="1.1" />
                </div>
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          <!-- Password Section Card -->
          <div class="bento-card password-card">
            <div class="card-header">
              <div class="header-icon">
                <v-icon name="hi-lock-closed" scale="1.1" />
              </div>
              <div class="header-text">
                <h3>Password</h3>
                <span class="header-subtitle">Manage your account password</span>
              </div>
            </div>

            <div class="password-display">
              <div class="password-dots">
                <span v-for="i in 10" :key="i" class="dot"></span>
              </div>
              <span class="password-hint">Last changed {{ lastPasswordChanged }}</span>
            </div>

            <div class="password-actions">
              <button class="action-button" @click="handlePasswordReset">
                <v-icon name="hi-pencil" scale="0.85" />
                <span>Change Password</span>
              </button>
            </div>

            <div class="password-tips">
              <div class="tip-item">
                <v-icon name="hi-check-circle" scale="0.8" />
                <span>Use at least 8 characters</span>
              </div>
              <div class="tip-item">
                <v-icon name="hi-check-circle" scale="0.8" />
                <span>Include numbers and symbols</span>
              </div>
              <div class="tip-item">
                <v-icon name="hi-check-circle" scale="0.8" />
                <span>Don't reuse passwords</span>
              </div>
            </div>
          </div>

          <!-- Two-Factor Authentication Card -->
          <div class="bento-card twofa-card">
            <div class="card-header">
              <div class="header-icon" :class="{ active: twoFAEnabled }">
                <v-icon name="hi-shield-check" scale="1.1" />
              </div>
              <div class="header-text">
                <h3>Two-Factor Authentication</h3>
                <span class="header-subtitle">
                  {{ twoFAEnabled ? `Active: ${activeMethodLabel}` : 'Add an extra layer of security' }}
                </span>
              </div>
              <div v-if="twoFAEnabled" class="status-badge enabled">
                <v-icon name="hi-check" scale="0.7" />
                Enabled
              </div>
            </div>

            <div v-if="!regMedium" class="oauth-notice">
              <v-icon name="hi-information-circle" scale="1" />
              <div class="notice-content">
                <strong>OAuth Account</strong>
                <p>Two-factor authentication is managed by your login provider (Google/Apple).</p>
              </div>
            </div>

            <div v-else class="methods-list">
              <div
                v-for="method in twoFAs"
                :key="method.name"
                class="method-item"
                :class="{ active: method.isActive, loading: method.isLoading }"
              >
                <div class="method-info">
                  <div class="method-icon">
                    <v-icon :name="getMethodIcon(method.name)" scale="1" />
                  </div>
                  <div class="method-text">
                    <span class="method-title">{{ method.title }}</span>
                    <span class="method-description">{{ getMethodDescription(method.name) }}</span>
                  </div>
                </div>

                <div class="method-actions">
                  <button
                    v-if="method.action && !method.isActive"
                    class="change-btn"
                    @click="handleChangeAction(method)"
                  >
                    {{ method.action }}
                  </button>
                  <label class="toggle-switch">
                    <input
                      type="checkbox"
                      :checked="method.isActive"
                      @change="handleToggleMethod(method)"
                      :disabled="method.isLoading"
                    />
                    <span class="slider" :class="{ loading: method.isLoading }"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- WhatsApp Settings Card -->
          <div class="bento-card whatsapp-card" ref="whatsappSection">
            <div class="card-header">
              <div class="header-icon whatsapp">
                <v-icon name="co-whatsapp" scale="1.1" />
              </div>
              <div class="header-text">
                <h3>WhatsApp Notifications</h3>
                <span class="header-subtitle">Receive updates and reminders via WhatsApp</span>
              </div>
            </div>

            <div class="whatsapp-toggle-row">
              <div class="toggle-info">
                <span class="toggle-label">Enable WhatsApp Notifications</span>
                <span class="toggle-description">Get appointment reminders and patient updates</span>
              </div>
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="whatsappEnabled"
                  @change="toggleWhatsapp($event.target.checked)"
                  :disabled="updatingWhatsapp"
                />
                <span class="slider" :class="{ loading: updatingWhatsapp }"></span>
              </label>
            </div>

            <div v-if="whatsappEnabled && formattedPhone" class="phone-display">
              <v-icon name="hi-phone" scale="0.9" />
              <span class="phone-label">Connected to:</span>
              <span class="phone-number">{{ formattedPhone }}</span>
            </div>

            <div class="whatsapp-features">
              <div class="feature-item">
                <v-icon name="hi-check" scale="0.8" />
                <span>Appointment reminders</span>
              </div>
              <div class="feature-item">
                <v-icon name="hi-check" scale="0.8" />
                <span>Patient booking alerts</span>
              </div>
              <div class="feature-item">
                <v-icon name="hi-check" scale="0.8" />
                <span>Earnings & payment updates</span>
              </div>
            </div>
          </div>

          <!-- Biometric Login Card -->
          <div class="bento-card biometric-card">
            <div class="card-header">
              <div class="header-icon" :class="{ active: biometricEnabled }">
                <v-icon name="hi-finger-print" scale="1.1" />
              </div>
              <div class="header-text">
                <h3>Biometric Login</h3>
                <span class="header-subtitle">
                  {{ biometricEnabled ? 'Face ID / Touch ID enabled' : 'Login using Face ID or fingerprint' }}
                </span>
              </div>
              <div v-if="biometricEnabled" class="status-badge enabled">
                <v-icon name="hi-check" scale="0.7" />
                Enabled
              </div>
            </div>

            <div v-if="!biometricSupported" class="biometric-notice">
              <v-icon name="hi-information-circle" scale="1" />
              <div class="notice-content">
                <strong>Not Supported</strong>
                <p>Your device or browser doesn't support biometric authentication.</p>
              </div>
            </div>

            <div v-else class="biometric-content">
              <div v-if="biometricCredentials.length > 0" class="credentials-list">
                <div
                  v-for="cred in biometricCredentials"
                  :key="cred.credentialId"
                  class="credential-item"
                >
                  <div class="credential-info">
                    <v-icon name="hi-device-mobile" scale="0.9" />
                    <div class="credential-text">
                      <span class="credential-name">{{ cred.deviceName }}</span>
                      <span class="credential-date">Added {{ formatDate(cred.created_at) }}</span>
                    </div>
                  </div>
                  <button class="delete-btn" @click="removeBiometricCredential(cred.credentialId)" :disabled="deletingCredential">
                    <v-icon name="hi-trash" scale="0.85" />
                  </button>
                </div>
              </div>

              <button
                class="biometric-setup-btn"
                @click="setupBiometric"
                :disabled="settingUpBiometric"
              >
                <v-icon name="hi-plus" scale="0.9" v-if="!settingUpBiometric" />
                <span v-if="settingUpBiometric" class="spinner-small"></span>
                <span>{{ biometricCredentials.length > 0 ? 'Add Another Device' : 'Set Up Biometric Login' }}</span>
              </button>
            </div>
          </div>

          <!-- Coming Soon Card -->
          <div class="bento-card coming-soon-card">
            <div class="coming-soon-icon sessions">
              <v-icon name="hi-device-mobile" scale="1.2" />
            </div>
            <div class="coming-soon-content">
              <h4>Active Sessions</h4>
              <p>View and manage logged-in devices</p>
            </div>
            <div class="coming-soon-badge">
              <v-icon name="hi-clock" scale="0.7" />
              <span>Coming Soon</span>
            </div>
          </div>
        </section>
      </template>
    </div>

    <!-- Verify Phone Modal -->
    <div v-if="selectedModal === 'Verify Phone'" class="modal-overlay" @click.self="closeModal">
      <div class="verify-modal">
        <div class="verify-modal__header">
          <h3>Verify Phone Number</h3>
          <button class="close-btn" @click="closeModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>
        <div class="verify-modal__body">
          <p>Enter the verification code sent to your phone</p>
          <div class="otp-input">
            <input
              v-for="(digit, index) in 6"
              :key="index"
              type="text"
              maxlength="1"
              :ref="el => otpInputs[index] = el"
              v-model="otpPhone[index]"
              @input="handleOtpInput(index, $event)"
              @keydown="handleOtpKeydown(index, $event)"
            />
          </div>
          <button class="resend-btn" @click="resendCode" :disabled="loadingPhone">
            Resend Code
          </button>
        </div>
        <div class="verify-modal__footer">
          <button class="btn primary" @click="autoSubmitPhone" :disabled="loadingPhone || otpPhone.join('').length < 6">
            {{ loadingPhone ? 'Verifying...' : 'Verify' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Auth App Modal -->
    <div v-if="selectedModal === 'Auth App'" class="modal-overlay" @click.self="closeModal">
      <div class="verify-modal auth-app-modal">
        <div class="verify-modal__header">
          <h3>Set Up Authenticator App</h3>
          <button class="close-btn" @click="closeModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>
        <div class="verify-modal__body">
          <div v-if="!qrNext" class="qr-step">
            <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
            <div class="qr-code">
              <img v-if="qrUrl" :src="qrUrl" alt="QR Code" />
              <div v-else class="qr-loading">
                <div class="spinner-small"></div>
                <span>Generating QR code...</span>
              </div>
            </div>
          </div>
          <div v-else class="verify-step">
            <p>Enter the 6-digit code from your authenticator app</p>
            <div class="otp-input">
              <input
                v-for="(digit, index) in 6"
                :key="index"
                type="text"
                maxlength="1"
                :ref="el => otpAppInputs[index] = el"
                v-model="otpApp[index]"
                @input="handleAppOtpInput(index, $event)"
                @keydown="handleAppOtpKeydown(index, $event)"
              />
            </div>
          </div>
        </div>
        <div class="verify-modal__footer">
          <template v-if="!qrNext">
            <button class="btn secondary" @click="closeModal">Cancel</button>
            <button class="btn primary" @click="qrNext = true" :disabled="!qrUrl">
              I've scanned the code
            </button>
          </template>
          <template v-else>
            <button class="btn secondary" @click="qrNext = false">Back</button>
            <button class="btn primary" @click="autoSubmitApp" :disabled="loadingApp || otpApp.join('').length < 6">
              {{ loadingApp ? 'Verifying...' : 'Verify' }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div v-if="selectedModal === 'Change Password'" class="modal-overlay" @click.self="closeModal">
      <div class="verify-modal password-modal">
        <div class="verify-modal__header">
          <div class="header-icon-wrapper">
            <v-icon name="hi-lock-closed" scale="1.2" />
          </div>
          <div class="header-content">
            <h3>Change Password</h3>
            <p class="header-subtitle">Create a strong, unique password</p>
          </div>
          <button class="close-btn" @click="closeModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="verify-modal__body password-body">
          <!-- Current Password -->
          <div class="password-field">
            <label>Current Password</label>
            <div class="input-wrapper" :class="{ error: passwordErrors.currentPassword }">
              <v-icon name="hi-lock-closed" scale="0.9" class="field-icon" />
              <input
                :type="showCurrentPassword ? 'text' : 'password'"
                v-model="passwordForm.currentPassword"
                placeholder="Enter current password"
                @input="passwordErrors.currentPassword = ''"
              />
              <button type="button" class="toggle-visibility" @click="showCurrentPassword = !showCurrentPassword">
                <v-icon :name="showCurrentPassword ? 'hi-eye-off' : 'hi-eye'" scale="0.9" />
              </button>
            </div>
            <span v-if="passwordErrors.currentPassword" class="error-text">
              <v-icon name="hi-exclamation-circle" scale="0.7" />
              {{ passwordErrors.currentPassword }}
            </span>
          </div>

          <!-- New Password -->
          <div class="password-field">
            <label>New Password</label>
            <div class="input-wrapper" :class="{ error: passwordErrors.newPassword }">
              <v-icon name="hi-key" scale="0.9" class="field-icon" />
              <input
                :type="showNewPassword ? 'text' : 'password'"
                v-model="passwordForm.newPassword"
                placeholder="Enter new password"
                @input="passwordErrors.newPassword = ''"
              />
              <button type="button" class="toggle-visibility" @click="showNewPassword = !showNewPassword">
                <v-icon :name="showNewPassword ? 'hi-eye-off' : 'hi-eye'" scale="0.9" />
              </button>
            </div>
            <div v-if="passwordForm.newPassword && passwordStrengthLabel.label" class="strength-indicator">
              <div class="strength-bar">
                <div class="strength-fill" :class="passwordStrengthLabel.class"></div>
              </div>
              <span class="strength-text" :class="passwordStrengthLabel.class">{{ passwordStrengthLabel.label }}</span>
            </div>
            <span v-if="passwordErrors.newPassword" class="error-text">
              <v-icon name="hi-exclamation-circle" scale="0.7" />
              {{ passwordErrors.newPassword }}
            </span>
          </div>

          <!-- Confirm Password -->
          <div class="password-field">
            <label>Confirm New Password</label>
            <div class="input-wrapper" :class="{ error: passwordErrors.confirmPassword, success: passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword }">
              <v-icon name="hi-shield-check" scale="0.9" class="field-icon" />
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="passwordForm.confirmPassword"
                placeholder="Confirm new password"
                @input="passwordErrors.confirmPassword = ''"
              />
              <button type="button" class="toggle-visibility" @click="showConfirmPassword = !showConfirmPassword">
                <v-icon :name="showConfirmPassword ? 'hi-eye-off' : 'hi-eye'" scale="0.9" />
              </button>
            </div>
            <span v-if="passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword" class="match-text">
              <v-icon name="hi-check-circle" scale="0.7" />
              Passwords match
            </span>
            <span v-if="passwordErrors.confirmPassword" class="error-text">
              <v-icon name="hi-exclamation-circle" scale="0.7" />
              {{ passwordErrors.confirmPassword }}
            </span>
          </div>

          <!-- Password Tips -->
          <div class="password-tips-box">
            <div class="tips-header">
              <v-icon name="hi-light-bulb" scale="0.85" />
              <span>Password Tips</span>
            </div>
            <ul class="tips-list">
              <li :class="{ met: passwordForm.newPassword.length >= 8 }">
                <v-icon :name="passwordForm.newPassword.length >= 8 ? 'hi-check-circle' : 'hi-minus-circle'" scale="0.7" />
                At least 8 characters
              </li>
              <li :class="{ met: /[A-Z]/.test(passwordForm.newPassword) && /[a-z]/.test(passwordForm.newPassword) }">
                <v-icon :name="/[A-Z]/.test(passwordForm.newPassword) && /[a-z]/.test(passwordForm.newPassword) ? 'hi-check-circle' : 'hi-minus-circle'" scale="0.7" />
                Upper and lowercase letters
              </li>
              <li :class="{ met: /\d/.test(passwordForm.newPassword) }">
                <v-icon :name="/\d/.test(passwordForm.newPassword) ? 'hi-check-circle' : 'hi-minus-circle'" scale="0.7" />
                Include numbers
              </li>
              <li :class="{ met: /[^a-zA-Z0-9]/.test(passwordForm.newPassword) }">
                <v-icon :name="/[^a-zA-Z0-9]/.test(passwordForm.newPassword) ? 'hi-check-circle' : 'hi-minus-circle'" scale="0.7" />
                Include special characters
              </li>
            </ul>
          </div>
        </div>

        <div class="verify-modal__footer password-footer">
          <button class="btn secondary" @click="closeModal" :disabled="changingPassword">
            Cancel
          </button>
          <button class="btn primary" @click="submitPasswordChange" :disabled="changingPassword">
            <span v-if="changingPassword" class="btn-loading">
              <span class="spinner-btn"></span>
              Changing...
            </span>
            <span v-else>Change Password</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import http from "@/services/http";
import { TWO_FAS, SECURITY_UPDATE_OPTIONS } from "@/utilities/constants";
import { startRegistration } from "@simplewebauthn/browser";

export default {
  name: "SpecialistSecuritySettingsPage",
  emits: ["openSideNav"],
  data() {
    return {
      loading: true,
      selectedModal: null,

      // Two-Factor Authentication
      twoFAs: JSON.parse(JSON.stringify(TWO_FAS)),
      otpPhone: [],
      otpApp: [],
      otpInputs: [],
      otpAppInputs: [],
      loadingPhone: false,
      loadingApp: false,
      qrNext: false,

      // WhatsApp
      whatsappEnabled: false,
      updatingWhatsapp: false,

      // Password Change
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
      passwordErrors: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      },
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      changingPassword: false,

      // Biometric
      biometricSupported: false,
      biometricCredentials: [],
      settingUpBiometric: false,
      deletingCredential: false,
    };
  },

  computed: {
    ...mapGetters({
      userProfile: "userprofile",
      userSettings: "usersettings",
      QRCode: "userAccountSettings/qrCode",
    }),

    qrUrl() {
      return this.QRCode?.dataUrl || "";
    },

    regMedium() {
      return this.userProfile?.reg_medium === "LOCAL";
    },

    formattedPhone() {
      const phone = this.userProfile?.profile?.contact?.phone;
      if (!phone?.number) return "";
      return `${phone.country_code || ""} ${phone.number}`.trim();
    },

    twoFAEnabled() {
      return this.twoFAs.some((m) => m.isActive);
    },

    activeMethodLabel() {
      const active = this.twoFAs.find((m) => m.isActive);
      return active?.title || "";
    },

    lastPasswordChanged() {
      return "Unknown";
    },

    passwordStrengthLabel() {
      const password = this.passwordForm.newPassword;
      if (!password) return { label: '', class: '' };
      if (password.length < 8) return { label: 'Too short', class: 'weak' };

      let strength = 0;
      if (password.length >= 8) strength++;
      if (password.length >= 12) strength++;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
      if (/\d/.test(password)) strength++;
      if (/[^a-zA-Z0-9]/.test(password)) strength++;

      if (strength <= 2) return { label: 'Weak', class: 'weak' };
      if (strength <= 3) return { label: 'Medium', class: 'medium' };
      return { label: 'Strong', class: 'strong' };
    },

    biometricEnabled() {
      return this.biometricCredentials.length > 0;
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
        const is2FAEnabled = val?.defaults?.twoFA_auth === true;
        const medium = val?.defaults?.twoFA_medium?.toLowerCase();

        this.twoFAs.forEach((item) => {
          // Method is active only if 2FA is enabled AND this is the selected method
          item.isActive = is2FAEnabled && item.name === medium;
        });
      },
      immediate: true,
      deep: true,
    },
  },

  async mounted() {
    // Check if biometric is supported
    this.biometricSupported = window.PublicKeyCredential !== undefined &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

    if (this.biometricSupported) {
      try {
        this.biometricSupported = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch (e) {
        this.biometricSupported = false;
      }
    }

    await Promise.all([
      this.fetchUserSettings(),
      this.loadBiometricCredentials(),
    ]);
    this.loading = false;
  },

  methods: {
    ...mapActions({
      updateTwoFA: "userAccountSettings/updatetwofactorauth",
      sendVerCode: "userAccountSettings/getPhoneVerCode",
      verifyNumber: "userAccountSettings/verifynumber",
      sendSecreteCode: "userAccountSettings/getSecreteCode",
      activateApp: "userAccountSettings/activateApp",
      getBiometricRegistrationOptions: "userAccountSettings/getBiometricRegistrationOptions",
      verifyBiometricRegistration: "userAccountSettings/verifyBiometricRegistration",
      getBiometricCredentials: "userAccountSettings/getBiometricCredentials",
      deleteBiometricCredential: "userAccountSettings/deleteBiometricCredential",
    }),

    async fetchUserSettings() {
      try {
        const res = await http.get("user-settings");
        if (res.status === 200) {
          const data = res.data?.data || res.data?.result || res.data;
          this.whatsappEnabled = data?.defaults?.whatsapp_notifications === true;
        }
      } catch (e) {
        console.error("Error fetching user settings:", e);
      }
    },

    // ==================== BIOMETRIC METHODS ====================

    async loadBiometricCredentials() {
      if (!this.biometricSupported) return;
      try {
        const result = await this.getBiometricCredentials();
        if (result.success) {
          this.biometricCredentials = result.credentials || [];
        }
      } catch (e) {
        console.error("Error loading biometric credentials:", e);
      }
    },

    async setupBiometric() {
      if (!this.biometricSupported) {
        this.$toast?.error?.("Biometric authentication is not supported on this device");
        return;
      }

      this.settingUpBiometric = true;
      try {
        const optionsResult = await this.getBiometricRegistrationOptions();
        if (!optionsResult.success) {
          throw new Error(optionsResult.error || "Failed to get registration options");
        }

        const credential = await startRegistration({ optionsJSON: optionsResult.options });
        const deviceName = this.getDeviceName();

        const verifyResult = await this.verifyBiometricRegistration({
          credential,
          deviceName,
        });

        if (verifyResult.success) {
          this.$toast?.success?.("Biometric login enabled successfully!");
          await this.loadBiometricCredentials();
        } else {
          throw new Error(verifyResult.error || "Failed to register biometric");
        }
      } catch (error) {
        console.error("Biometric setup error:", error);
        if (error.name === "NotAllowedError") {
          this.$toast?.error?.("Biometric registration was cancelled");
        } else if (error.name === "InvalidStateError") {
          this.$toast?.error?.("This device is already registered");
        } else {
          this.$toast?.error?.(error.message || "Failed to set up biometric login");
        }
      }
      this.settingUpBiometric = false;
    },

    async removeBiometricCredential(credentialId) {
      if (!confirm("Remove this biometric credential?")) return;

      this.deletingCredential = true;
      try {
        const result = await this.deleteBiometricCredential(credentialId);
        if (result.success) {
          this.$toast?.success?.("Biometric credential removed");
          await this.loadBiometricCredentials();
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        this.$toast?.error?.(error.message || "Failed to remove credential");
      }
      this.deletingCredential = false;
    },

    getDeviceName() {
      const ua = navigator.userAgent;
      if (/iPhone/.test(ua)) return "iPhone";
      if (/iPad/.test(ua)) return "iPad";
      if (/Macintosh/.test(ua)) return "Mac";
      if (/Android/.test(ua)) return "Android Device";
      if (/Windows/.test(ua)) return "Windows PC";
      return "Device";
    },

    formatDate(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    },

    handlePasswordReset() {
      this.passwordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
      this.passwordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
      this.selectedModal = 'Change Password';
    },

    validatePasswordForm() {
      let isValid = true;
      this.passwordErrors = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };

      if (!this.passwordForm.currentPassword) {
        this.passwordErrors.currentPassword = 'Current password is required';
        isValid = false;
      }

      if (!this.passwordForm.newPassword) {
        this.passwordErrors.newPassword = 'New password is required';
        isValid = false;
      } else if (this.passwordForm.newPassword.length < 8) {
        this.passwordErrors.newPassword = 'Password must be at least 8 characters';
        isValid = false;
      }

      if (!this.passwordForm.confirmPassword) {
        this.passwordErrors.confirmPassword = 'Please confirm your new password';
        isValid = false;
      } else if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        this.passwordErrors.confirmPassword = 'Passwords do not match';
        isValid = false;
      }

      return isValid;
    },

    async submitPasswordChange() {
      if (!this.validatePasswordForm()) return;

      this.changingPassword = true;
      try {
        await http.patch('auth/change-password', {
          current_password: this.passwordForm.currentPassword,
          new_password: this.passwordForm.newPassword,
          confirm_password: this.passwordForm.confirmPassword,
        });
        this.$toast?.success?.('Password changed successfully');
        this.closeModal();
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to change password';
        if (message.toLowerCase().includes('current password')) {
          this.passwordErrors.currentPassword = message;
        } else {
          this.$toast?.error?.(message);
        }
      }
      this.changingPassword = false;
    },

    getMethodIcon(name) {
      switch (name) {
        case "email":
          return "hi-mail";
        case "sms":
          return "hi-phone";
        case "auth_apps":
          return "hi-key";
        default:
          return "hi-shield-check";
      }
    },

    getMethodDescription(name) {
      switch (name) {
        case "email":
          return "Receive verification codes via email";
        case "sms":
          return "Receive verification codes via SMS";
        case "auth_apps":
          return "Use an authenticator app like Google Authenticator";
        default:
          return "";
      }
    },

    async handleToggleMethod(method) {
      const index = this.twoFAs.findIndex((m) => m.name === method.name);
      if (index === -1) return;

      const isCurrentlyActive = method.isActive;

      // If disabling the currently active method
      if (isCurrentlyActive) {
        this.twoFAs[index].isLoading = true;
        try {
          // Disable 2FA entirely
          await this.updateTwoFA({ enabled: false });
          this.twoFAs[index].isActive = false;
          this.$toast?.success?.("Two-factor authentication disabled");
        } catch (e) {
          this.$toast?.error?.("Failed to disable 2FA");
        }
        this.twoFAs[index].isLoading = false;
        return;
      }

      // Enabling a method
      if (method.name === "email") {
        this.twoFAs[index].isLoading = true;
        try {
          await this.updateTwoFA({ method: "EMAIL", enabled: true });
          // Deactivate other methods
          this.twoFAs.forEach((m, i) => {
            m.isActive = i === index;
          });
          this.$toast?.success?.("Email 2FA enabled");
        } catch (e) {
          this.$toast?.error?.("Failed to enable Email 2FA");
        }
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
          try {
            await this.updateTwoFA({ method: "SMS", enabled: true });
            // Deactivate other methods
            this.twoFAs.forEach((m, i) => {
              m.isActive = i === index;
            });
            this.$toast?.success?.("SMS 2FA enabled");
          } catch (e) {
            this.$toast?.error?.("Failed to enable SMS 2FA");
          }
          this.twoFAs[index].isLoading = false;
        }
      }

      if (method.name === "auth_apps") {
        if (!this.userProfile?.is_auth_app_enabled) {
          // First time setup - generate QR code
          this.twoFAs[index].isLoading = true;
          try {
            await this.sendSecreteCode();
            // Modal will open via QRCode watcher
          } catch (e) {
            this.$toast?.error?.("Failed to generate authenticator code");
            this.twoFAs[index].isLoading = false;
          }
        } else {
          // Already set up - just enable it
          this.twoFAs[index].isLoading = true;
          try {
            await this.updateTwoFA({ method: "AUTH_APPS", enabled: true });
            // Deactivate other methods
            this.twoFAs.forEach((m, i) => {
              m.isActive = i === index;
            });
            this.$toast?.success?.("Authenticator app 2FA enabled");
          } catch (e) {
            this.$toast?.error?.("Failed to enable Authenticator 2FA");
          }
          this.twoFAs[index].isLoading = false;
        }
      }
    },

    handleChangeAction(method) {
      if (method.title === SECURITY_UPDATE_OPTIONS.EMAIL) {
        // Handle email change
      } else if (method.title === SECURITY_UPDATE_OPTIONS.SMS) {
        // Handle phone change
      }
    },

    closeModal() {
      this.selectedModal = null;
      this.qrNext = false;
      this.otpPhone = [];
      this.otpApp = [];
      // Reset loading states
      this.twoFAs.forEach((m) => {
        m.isLoading = false;
      });
      // Clear QR code from store
      this.$store.commit("userAccountSettings/SET_SECRETE", null);
    },

    resendCode() {
      const phone = this.userProfile?.profile?.contact?.phone?.number;
      this.sendVerCode(phone);
    },

    handleOtpInput(index, event) {
      const value = event.target.value;
      if (value && index < 5) {
        this.otpInputs[index + 1]?.focus();
      }
    },

    handleOtpKeydown(index, event) {
      if (event.key === "Backspace" && !this.otpPhone[index] && index > 0) {
        this.otpInputs[index - 1]?.focus();
      }
    },

    handleAppOtpInput(index, event) {
      const value = event.target.value;
      if (value && index < 5) {
        this.otpAppInputs[index + 1]?.focus();
      }
    },

    handleAppOtpKeydown(index, event) {
      if (event.key === "Backspace" && !this.otpApp[index] && index > 0) {
        this.otpAppInputs[index - 1]?.focus();
      }
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
      if (this.otpApp.join("").length >= 6) {
        this.loadingApp = true;
        try {
          const result = await this.activateApp({ code: this.otpApp.join("") });
          if (result?.success) {
            // Update UI to show auth_apps as active
            this.twoFAs.forEach((m) => {
              m.isActive = m.name === "auth_apps";
              m.isLoading = false;
            });
            this.$toast?.success?.("Authenticator app 2FA enabled");
          } else {
            this.$toast?.error?.("Invalid code. Please try again.");
          }
        } catch (e) {
          this.$toast?.error?.("Failed to verify code");
        }
        this.closeModal();
        this.loadingApp = false;
        // Reset loading state for auth_apps method
        const authAppIndex = this.twoFAs.findIndex((m) => m.name === "auth_apps");
        if (authAppIndex !== -1) {
          this.twoFAs[authAppIndex].isLoading = false;
        }
      }
    },

    async toggleWhatsapp(value) {
      this.updatingWhatsapp = true;
      try {
        await http.patch("user-settings", {
          defaults: { whatsapp_notifications: value },
        });
        this.whatsappEnabled = value;
        this.$toast?.success?.(value ? "WhatsApp notifications enabled" : "WhatsApp notifications disabled");
      } catch (e) {
        console.error("Error updating WhatsApp setting:", e);
        this.whatsappEnabled = !value;
        this.$toast?.error?.("Failed to update setting");
      }
      this.updatingWhatsapp = false;
    },

    scrollToWhatsapp() {
      this.$refs.whatsappSection?.scrollIntoView({ behavior: "smooth" });
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
$whatsapp: #25D366;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
}

.security-settings-page {
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
  padding: 24px 32px 160px;

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
  padding: 48px 40px 72px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  position: relative;
  overflow: hidden;
  min-height: 460px;
  margin-bottom: 24px;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    padding: 24px 20px 32px;
    gap: 16px;
    text-align: center;
    min-height: auto;
    border-radius: 20px;
    margin-bottom: 16px;
    overflow: visible;
  }

  .hero__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2;

    @media (max-width: 768px) {
      align-items: center;
    }
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
    }

    svg {
      width: 16px;
      height: 16px;
      color: white;
      margin-left: 12px;
    }

    span {
      font-size: 13px;
      font-weight: 600;
      color: white;
      letter-spacing: 0.3px;
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
      margin-top: 8px;
      transform: scale(0.6);
      height: 140px;
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

    &--warning { color: $amber-light; }
    &--info { color: $sky-light; }
    &--success { color: $emerald-light; }
  }

  &__label {
    display: block;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__divider {
    width: 1px;
    height: 32px;
    background: rgba(255, 255, 255, 0.2);
  }
}

// Orb Animation
.security-orb {
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

  &--1 { top: 10%; right: 10%; animation-delay: 0s; }
  &--2 { bottom: 20%; right: 5%; animation-delay: 1s; }
  &--3 { bottom: 10%; left: 10%; animation-delay: 2s; }
}

@keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
@keyframes pulse-ring { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(2.5); opacity: 0; } }
@keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); } 50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

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
  padding: 24px;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 16px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 20px;

    h3 {
      font-size: 18px;
      font-weight: 700;
      color: $navy;
      margin: 0;
    }

    .header-icon {
      width: 44px;
      height: 44px;
      background: rgba($sky, 0.1);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $sky-dark;
      flex-shrink: 0;

      &.active {
        background: rgba($emerald, 0.1);
        color: $emerald;
      }

      &.whatsapp {
        background: rgba($whatsapp, 0.1);
        color: $whatsapp;
      }
    }

    .header-text {
      flex: 1;

      h3 {
        margin-bottom: 4px;
      }

      .header-subtitle {
        font-size: 13px;
        color: $gray;
      }
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;

      &.enabled {
        background: rgba($emerald, 0.1);
        color: $emerald;
      }
    }
  }
}

// Actions Card
.actions-card {
  grid-column: span 12;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }

  .actions-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;

    @media (max-width: 640px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #F8FAFC;
    border: 2px solid transparent;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: $sky;
      background: $sky-light;
    }

    .action-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.sky { background: rgba($sky, 0.15); color: $sky-dark; }
      &.violet { background: rgba($violet, 0.15); color: $violet; }
      &.emerald { background: rgba($emerald, 0.15); color: $emerald; }
      &.whatsapp { background: rgba($whatsapp, 0.15); color: $whatsapp; }
    }

    span {
      font-size: 14px;
      font-weight: 600;
      color: $slate;
    }
  }
}

// Password Card
.password-card {
  grid-column: span 6;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }

  .password-display {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #F8FAFC;
    border-radius: 12px;
    margin-bottom: 16px;

    .password-dots {
      display: flex;
      gap: 6px;

      .dot {
        width: 10px;
        height: 10px;
        background: $slate;
        border-radius: 50%;
      }
    }

    .password-hint {
      font-size: 12px;
      color: $light-gray;
    }
  }

  .password-actions {
    margin-bottom: 20px;

    .action-button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: transparent;
      border: 2px solid #E5E7EB;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      color: $slate;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: $sky;
        color: $sky-dark;
        background: rgba($sky, 0.05);
      }
    }
  }

  .password-tips {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: rgba($emerald, 0.05);
    border-radius: 12px;

    .tip-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: $gray;

      svg {
        color: $emerald;
      }
    }
  }
}

// Two-Factor Auth Card
.twofa-card {
  grid-column: span 6;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }

  .oauth-notice {
    display: flex;
    gap: 14px;
    padding: 16px;
    background: rgba($sky, 0.05);
    border-radius: 12px;

    svg {
      color: $sky-dark;
      flex-shrink: 0;
    }

    .notice-content {
      strong {
        display: block;
        font-size: 14px;
        color: $navy;
        margin-bottom: 4px;
      }

      p {
        font-size: 13px;
        color: $gray;
        margin: 0;
      }
    }
  }

  .methods-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .method-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #F8FAFC;
    border-radius: 12px;
    border: 2px solid transparent;
    transition: all 0.2s ease;
    gap: 12px;

    @media (max-width: 480px) {
      padding: 12px;
      flex-wrap: wrap;
    }

    &:hover {
      background: #F1F5F9;
    }

    &.active {
      background: rgba($sky, 0.05);
      border-color: rgba($sky, 0.2);
    }

    &.loading {
      opacity: 0.7;
    }

    .method-info {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
      min-width: 0;

      .method-icon {
        width: 40px;
        height: 40px;
        background: white;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $gray;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .method-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;

        .method-title {
          font-size: 14px;
          font-weight: 600;
          color: $navy;
        }

        .method-description {
          font-size: 12px;
          color: $gray;
        }
      }
    }

    .method-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .change-btn {
        padding: 6px 12px;
        background: transparent;
        border: 1px solid #D1D5DB;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        color: $sky-dark;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: $sky;
          background: rgba($sky, 0.05);
        }
      }
    }
  }
}

// WhatsApp Card
.whatsapp-card {
  grid-column: span 6;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }

  .whatsapp-toggle-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #F8FAFC;
    border-radius: 12px;
    margin-bottom: 16px;

    .toggle-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .toggle-label {
        font-size: 14px;
        font-weight: 600;
        color: $navy;
      }

      .toggle-description {
        font-size: 12px;
        color: $gray;
      }
    }
  }

  .phone-display {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba($whatsapp, 0.1);
    border-radius: 10px;
    margin-bottom: 16px;

    svg {
      color: $whatsapp;
    }

    .phone-label {
      font-size: 12px;
      color: $gray;
    }

    .phone-number {
      font-size: 14px;
      font-weight: 600;
      color: $whatsapp;
    }
  }

  .whatsapp-features {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: rgba($whatsapp, 0.05);
    border-radius: 12px;

    .feature-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: $gray;

      svg {
        color: $whatsapp;
      }
    }
  }
}

// Biometric Card
.biometric-card {
  grid-column: span 6;

  @media (max-width: 1024px) {
    grid-column: span 6;
  }

  .biometric-notice {
    display: flex;
    gap: 14px;
    padding: 16px;
    background: rgba($gray, 0.05);
    border-radius: 12px;

    svg {
      color: $gray;
      flex-shrink: 0;
    }

    .notice-content {
      strong {
        display: block;
        font-size: 14px;
        color: $navy;
        margin-bottom: 4px;
      }

      p {
        font-size: 13px;
        color: $gray;
        margin: 0;
      }
    }
  }

  .biometric-content {
    .credentials-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 16px;
    }

    .credential-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      background: #F8FAFC;
      border-radius: 12px;
      border: 1px solid #E5E7EB;

      .credential-info {
        display: flex;
        align-items: center;
        gap: 12px;

        svg {
          color: $violet;
        }

        .credential-text {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .credential-name {
            font-size: 14px;
            font-weight: 600;
            color: $navy;
          }

          .credential-date {
            font-size: 12px;
            color: $gray;
          }
        }
      }

      .delete-btn {
        width: 36px;
        height: 36px;
        border: none;
        background: rgba($rose, 0.1);
        color: $rose;
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;

        &:hover {
          background: rgba($rose, 0.2);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    .biometric-setup-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 14px 20px;
      background: linear-gradient(135deg, $violet 0%, darken($violet, 10%) 100%);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba($violet, 0.3);
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
      }

      .spinner-small {
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }
  }
}

// Coming Soon Cards
.coming-soon-card {
  grid-column: span 6;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%);

  @media (max-width: 1024px) {
    grid-column: span 3;
  }

  @media (max-width: 768px) {
    padding: 20px;
  }

  .coming-soon-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.biometric {
      background: linear-gradient(135deg, rgba($violet, 0.1) 0%, rgba($violet, 0.2) 100%);
      color: $violet;
    }

    &.sessions {
      background: linear-gradient(135deg, rgba($sky, 0.1) 0%, rgba($sky, 0.2) 100%);
      color: $sky-dark;
    }
  }

  .coming-soon-content {
    flex: 1;

    h4 {
      font-size: 16px;
      font-weight: 700;
      color: $navy;
      margin: 0 0 4px;
    }

    p {
      font-size: 13px;
      color: $gray;
      margin: 0;
    }
  }

  .coming-soon-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: rgba($gray, 0.1);
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    color: $gray;
    white-space: nowrap;
  }
}

// Toggle Switch
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;

    &:checked + .slider {
      background-color: $sky;
    }

    &:checked + .slider:before {
      transform: translateX(20px);
    }

    &:disabled + .slider {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #D1D5DB;
    transition: 0.3s;
    border-radius: 24px;

    &.loading {
      animation: pulse-loading 1s infinite;
    }

    &:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
}

@keyframes pulse-loading {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

// Modal Styles
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.verify-modal {
  background: white;
  border-radius: 20px;
  max-width: 400px;
  width: 100%;
  overflow: hidden;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #F1F5F9;

    h3 {
      font-size: 18px;
      font-weight: 700;
      color: $navy;
      margin: 0;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: none;
      background: $bg;
      color: $gray;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      &:hover {
        background: #E2E8F0;
      }
    }
  }

  &__body {
    padding: 24px;
    text-align: center;

    p {
      font-size: 14px;
      color: $gray;
      margin: 0 0 24px;
    }

    .qr-step, .verify-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .qr-code {
      width: 200px;
      height: 200px;
      background: #F8FAFC;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .qr-placeholder {
        color: $light-gray;
      }

      .qr-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        color: $gray;
        font-size: 13px;

        .spinner-small {
          width: 32px;
          height: 32px;
          border: 3px solid #E5E7EB;
          border-top-color: $sky;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .otp-input {
      display: flex;
      gap: 8px;
      justify-content: center;

      input {
        width: 48px;
        height: 56px;
        border: 2px solid #E5E7EB;
        border-radius: 12px;
        font-size: 24px;
        font-weight: 700;
        text-align: center;
        color: $navy;
        transition: all 0.2s ease;

        &:focus {
          outline: none;
          border-color: $sky;
          box-shadow: 0 0 0 3px rgba($sky, 0.1);
        }
      }
    }

    .resend-btn {
      background: none;
      border: none;
      color: $sky-dark;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      padding: 8px 16px;
      border-radius: 8px;

      &:hover {
        background: $sky-light;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  &__footer {
    display: flex;
    gap: 12px;
    padding: 16px 24px 24px;
    justify-content: center;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &.primary {
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border: none;
    color: white;

    &:hover {
      box-shadow: 0 4px 12px rgba($sky, 0.3);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &.secondary {
    background: transparent;
    border: 2px solid #E5E7EB;
    color: $slate;

    &:hover {
      border-color: $sky;
      color: $sky-dark;
    }
  }
}

// Password Modal Styles
.password-modal {
  max-width: 440px;

  .verify-modal__header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 24px 24px 20px;

    .header-icon-wrapper {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, rgba($sky, 0.15) 0%, rgba($sky-dark, 0.15) 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $sky-dark;
      flex-shrink: 0;
    }

    .header-content {
      flex: 1;

      h3 {
        margin: 0 0 4px;
      }

      .header-subtitle {
        font-size: 13px;
        color: $gray;
        margin: 0;
      }
    }

    .close-btn {
      margin-top: -4px;
    }
  }

  .password-body {
    padding: 0 24px 24px;
    text-align: left;
  }

  .password-field {
    margin-bottom: 20px;

    label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: $slate;
      margin-bottom: 8px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #F8FAFC;
      border: 2px solid #E5E7EB;
      border-radius: 12px;
      transition: all 0.2s ease;

      &:focus-within {
        border-color: $sky;
        background: white;
        box-shadow: 0 0 0 3px rgba($sky, 0.1);
      }

      &.error {
        border-color: $rose;
        background: rgba($rose, 0.02);

        &:focus-within {
          box-shadow: 0 0 0 3px rgba($rose, 0.1);
        }
      }

      &.success {
        border-color: $emerald;

        &:focus-within {
          box-shadow: 0 0 0 3px rgba($emerald, 0.1);
        }
      }

      .field-icon {
        position: absolute;
        left: 14px;
        color: $light-gray;
        pointer-events: none;
      }

      input {
        flex: 1;
        padding: 14px 44px;
        border: none;
        background: transparent;
        font-size: 14px;
        color: $navy;

        &::placeholder {
          color: $light-gray;
        }

        &:focus {
          outline: none;
        }
      }

      .toggle-visibility {
        position: absolute;
        right: 12px;
        width: 32px;
        height: 32px;
        border: none;
        background: transparent;
        color: $light-gray;
        cursor: pointer;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;

        &:hover {
          background: #E5E7EB;
          color: $slate;
        }
      }
    }

    .error-text {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: $rose;
      margin-top: 8px;

      svg {
        flex-shrink: 0;
      }
    }

    .match-text {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: $emerald;
      margin-top: 8px;

      svg {
        flex-shrink: 0;
      }
    }

    .strength-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 10px;

      .strength-bar {
        flex: 1;
        height: 4px;
        background: #E5E7EB;
        border-radius: 2px;
        overflow: hidden;

        .strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: all 0.3s ease;

          &.weak {
            width: 33%;
            background: $rose;
          }

          &.medium {
            width: 66%;
            background: $amber;
          }

          &.strong {
            width: 100%;
            background: $emerald;
          }
        }
      }

      .strength-text {
        font-size: 12px;
        font-weight: 600;

        &.weak { color: $rose; }
        &.medium { color: $amber; }
        &.strong { color: $emerald; }
      }
    }
  }

  .password-tips-box {
    background: linear-gradient(135deg, rgba($sky, 0.05) 0%, rgba($sky-dark, 0.05) 100%);
    border: 1px solid rgba($sky, 0.1);
    border-radius: 14px;
    padding: 16px;

    .tips-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 600;
      color: $sky-dark;
      margin-bottom: 12px;
    }

    .tips-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;

      @media (max-width: 400px) {
        grid-template-columns: 1fr;
      }

      li {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: $gray;
        transition: all 0.2s ease;

        svg {
          color: $light-gray;
          flex-shrink: 0;
        }

        &.met {
          color: $emerald;

          svg {
            color: $emerald;
          }
        }
      }
    }
  }

  .password-footer {
    padding: 16px 24px 24px;
    gap: 12px;

    .btn {
      flex: 1;
    }

    .btn-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      .spinner-btn {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
