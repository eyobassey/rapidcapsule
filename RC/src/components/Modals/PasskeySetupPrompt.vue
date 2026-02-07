<template>
  <transition name="modal-fade">
    <div v-if="show" class="passkey-prompt-overlay" @click.self="dismiss">
      <div class="passkey-prompt-modal">
        <div class="modal-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <h2 class="modal-title">Faster, Safer Login</h2>

        <p class="modal-description">
          Set up <strong>{{ biometricName }}</strong> to sign in instantly next time — no password needed.
        </p>

        <ul class="benefits-list">
          <li>
            <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <span>More secure than passwords</span>
          </li>
          <li>
            <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <span>Syncs across your devices</span>
          </li>
          <li>
            <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <span>Takes just a few seconds</span>
          </li>
        </ul>

        <div class="modal-actions">
          <button
            class="btn-primary"
            @click="setupPasskey"
            :disabled="isSettingUp"
          >
            <span v-if="isSettingUp" class="spinner"></span>
            <span v-else>Set Up Now</span>
          </button>
          <button
            class="btn-secondary"
            @click="dismiss"
            :disabled="isSettingUp"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { startRegistration } from "@simplewebauthn/browser";
import { mapActions } from "vuex";

export default {
  name: "PasskeySetupPrompt",

  props: {
    show: {
      type: Boolean,
      default: false,
    },
  },

  emits: ["close", "success"],

  data() {
    return {
      isSettingUp: false,
    };
  },

  computed: {
    biometricName() {
      const ua = navigator.userAgent;

      if (/iPhone|iPad|iPod/i.test(ua)) {
        return "Face ID";
      }
      if (/Android/i.test(ua)) {
        return "Fingerprint";
      }
      if (/Macintosh/i.test(ua)) {
        return "Touch ID";
      }
      if (/Windows/i.test(ua)) {
        return "Windows Hello";
      }
      return "Biometric Login";
    },
  },

  methods: {
    ...mapActions({
      getBiometricRegistrationOptions: "userAccountSettings/getBiometricRegistrationOptions",
      verifyBiometricRegistration: "userAccountSettings/verifyBiometricRegistration",
    }),

    dismiss() {
      this.$emit("close");
    },

    async setupPasskey() {
      this.isSettingUp = true;

      try {
        // Get registration options from server
        const optionsResult = await this.getBiometricRegistrationOptions();
        if (!optionsResult.success) {
          throw new Error(optionsResult.error || "Failed to get registration options");
        }

        // Start WebAuthn registration
        const credential = await startRegistration({ optionsJSON: optionsResult.options });

        // Get device name
        const deviceName = this.getDeviceName();

        // Verify with server
        const verifyResult = await this.verifyBiometricRegistration({
          credential,
          deviceName,
        });

        if (verifyResult.success) {
          // Mark as set up so we don't prompt again
          localStorage.setItem("rc_passkey_setup", "true");
          this.$emit("success");
          this.$emit("close");
        } else {
          throw new Error(verifyResult.error || "Failed to register");
        }
      } catch (error) {
        console.error("Passkey setup error:", error);

        if (error.name === "NotAllowedError") {
          // User cancelled - just close
          this.dismiss();
        } else if (error.name === "InvalidStateError") {
          // Already registered
          localStorage.setItem("rc_passkey_setup", "true");
          alert("This device is already set up for biometric login!");
          this.$emit("close");
        } else {
          alert(error.message || "Failed to set up. Please try again later.");
        }
      } finally {
        this.isSettingUp = false;
      }
    },

    getDeviceName() {
      const ua = navigator.userAgent;
      if (/iPhone/i.test(ua)) return "iPhone";
      if (/iPad/i.test(ua)) return "iPad";
      if (/Macintosh/i.test(ua)) return "Mac";
      if (/Android/i.test(ua)) return "Android Device";
      if (/Windows/i.test(ua)) return "Windows PC";
      return "Device";
    },
  },
};
</script>

<style scoped lang="scss">
.passkey-prompt-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.passkey-prompt-modal {
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;

  svg {
    width: 36px;
    height: 36px;
    color: white;
  }
}

.modal-title {
  font-size: 22px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 12px;
}

.modal-description {
  font-size: 15px;
  color: #64748B;
  line-height: 1.5;
  margin: 0 0 24px;

  strong {
    color: #0288D1;
  }
}

.benefits-list {
  list-style: none;
  padding: 0;
  margin: 0 0 28px;
  text-align: left;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    font-size: 14px;
    color: #334155;

    .check-icon {
      width: 20px;
      height: 20px;
      color: #10B981;
      flex-shrink: 0;
    }
  }
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primary {
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(79, 195, 247, 0.4);
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}

.btn-secondary {
  width: 100%;
  padding: 14px 24px;
  background: transparent;
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  color: #64748B;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: #CBD5E1;
    color: #475569;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Transition
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

// Mobile adjustments
@media (max-width: 480px) {
  .passkey-prompt-modal {
    padding: 24px;
    border-radius: 16px;
  }

  .modal-icon {
    width: 64px;
    height: 64px;

    svg {
      width: 32px;
      height: 32px;
    }
  }

  .modal-title {
    font-size: 20px;
  }
}
</style>
