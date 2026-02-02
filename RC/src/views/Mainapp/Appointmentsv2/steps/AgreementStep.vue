<template>
  <div class="agreement-step">
    <!-- Hero Banner -->
    <div class="step-hero">
      <div class="hero-icon-wrapper">
        <v-icon name="hi-badge-check" scale="1.8" class="hero-icon" />
      </div>
      <div class="hero-text">
        <h2 class="hero-title">Terms & Consent</h2>
        <p class="hero-desc">Please review and accept the following agreements to continue with your appointment booking.</p>
      </div>
    </div>

    <!-- Select All Option -->
    <div class="select-all-row">
      <button
        class="select-all-btn"
        :class="{ active: booking.allConsentsGiven }"
        @click="toggleAllConsents"
      >
        <div class="checkbox-custom">
          <v-icon v-if="booking.allConsentsGiven" name="hi-check" scale="0.7" />
        </div>
        <span>Select all agreements</span>
      </button>
    </div>

    <!-- Consent Items -->
    <div class="consents-list">
      <consent-item
        v-model="booking.consents.telemedicine"
        title="Telemedicine Consent"
        description="I understand and consent to receive healthcare services via telemedicine technology."
        :required="true"
        @viewDetails="openDrawer('telemedicine')"
      />

      <consent-item
        v-model="booking.consents.privacy"
        title="Privacy Policy"
        description="I have read and agree to the privacy policy regarding my personal health information."
        :required="true"
        @viewDetails="openDrawer('privacy')"
      />

      <consent-item
        v-model="booking.consents.doctorMatching"
        title="Doctor Matching Data Sharing"
        description="I consent to sharing my health data for matching with appropriate healthcare providers."
        :required="true"
        @viewDetails="openDrawer('doctorMatching')"
      />

      <consent-item
        v-model="booking.consents.prescription"
        title="Prescription Verification"
        description="I understand prescriptions may require verification and in-person follow-up."
        :required="true"
        @viewDetails="openDrawer('prescription')"
      />
    </div>

    <!-- Consent Drawer -->
    <consent-drawer
      :isOpen="activeDrawer !== null"
      :title="drawerContent.title"
      @close="closeDrawer"
      @accept="acceptAndClose"
    >
      <div v-html="drawerContent.content"></div>
    </consent-drawer>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import ConsentItem from '../components/ConsentItem.vue';
import ConsentDrawer from '../components/ConsentDrawer.vue';

const booking = inject('bookingStateV2');

const activeDrawer = ref(null);

const drawerContents = {
  telemedicine: {
    title: 'Telemedicine Consent',
    content: `
      <h4>Understanding Telemedicine</h4>
      <p>Telemedicine involves the use of electronic communications to enable healthcare providers to deliver services remotely. This may include video consultations, audio calls, or text-based messaging.</p>

      <h4>Benefits and Limitations</h4>
      <ul>
        <li>Convenient access to healthcare from your location</li>
        <li>Reduced travel time and waiting periods</li>
        <li>May not be suitable for all medical conditions</li>
        <li>Physical examination limitations apply</li>
      </ul>

      <h4>Your Responsibilities</h4>
      <p>You agree to provide accurate and complete information about your health history, current symptoms, and any medications you are taking. You understand that incomplete or inaccurate information may affect the quality of care.</p>

      <h4>Emergency Situations</h4>
      <p>If you are experiencing a medical emergency, please call your local emergency services immediately. Telemedicine is not a substitute for emergency care.</p>
    `,
  },
  privacy: {
    title: 'Privacy Policy',
    content: `
      <h4>Information We Collect</h4>
      <p>We collect personal information including your name, contact details, health history, and consultation records to provide you with healthcare services.</p>

      <h4>How We Use Your Information</h4>
      <ul>
        <li>To provide and improve our healthcare services</li>
        <li>To match you with appropriate healthcare providers</li>
        <li>To communicate with you about your appointments</li>
        <li>To comply with legal and regulatory requirements</li>
      </ul>

      <h4>Data Security</h4>
      <p>We implement industry-standard security measures to protect your personal health information. All data is encrypted in transit and at rest.</p>

      <h4>Your Rights</h4>
      <p>You have the right to access, correct, or request deletion of your personal information. Contact our support team to exercise these rights.</p>
    `,
  },
  doctorMatching: {
    title: 'Doctor Matching Data Sharing',
    content: `
      <h4>How We Match You with Specialists</h4>
      <p>To provide you with the best possible care, we use your health information to match you with appropriate healthcare specialists.</p>

      <h4>Information Shared</h4>
      <ul>
        <li>Your symptoms and health concerns</li>
        <li>Relevant medical history</li>
        <li>Preferred consultation method</li>
        <li>Scheduling preferences</li>
      </ul>

      <h4>Specialist Access</h4>
      <p>Healthcare providers will have access to relevant health information necessary for your consultation. They are bound by professional confidentiality obligations.</p>

      <h4>AI-Assisted Matching</h4>
      <p>We may use AI technology to suggest specialists based on your health profile. Final selection remains your choice.</p>
    `,
  },
  prescription: {
    title: 'Prescription Verification',
    content: `
      <h4>Prescription Process</h4>
      <p>Prescriptions issued through telemedicine consultations are subject to verification and may require additional steps before fulfillment.</p>

      <h4>Controlled Substances</h4>
      <p>Certain medications, including controlled substances, may not be prescribed through telemedicine and may require an in-person evaluation.</p>

      <h4>Pharmacy Coordination</h4>
      <ul>
        <li>Prescriptions will be sent electronically to your chosen pharmacy</li>
        <li>You may need to provide identification when picking up medications</li>
        <li>Some prescriptions may require prior authorization from insurance</li>
      </ul>

      <h4>Follow-up Care</h4>
      <p>You understand that some conditions may require in-person follow-up care, laboratory tests, or additional consultations with specialists.</p>
    `,
  },
};

const drawerContent = computed(() => {
  if (!activeDrawer.value) return { title: '', content: '' };
  return drawerContents[activeDrawer.value] || { title: '', content: '' };
});

const openDrawer = (type) => {
  activeDrawer.value = type;
};

const closeDrawer = () => {
  activeDrawer.value = null;
};

const acceptAndClose = () => {
  if (activeDrawer.value) {
    booking.consents[activeDrawer.value] = true;
  }
  closeDrawer();
};

const toggleAllConsents = () => {
  const newValue = !booking.allConsentsGiven;
  booking.setAllConsents(newValue);
};
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-success: #4CAF50;

.agreement-step {
  padding: 20px 24px 40px;
  max-width: 700px;
  margin: 0 auto;

  @media (max-width: 600px) {
    padding: 16px 16px 32px;
  }
}

.step-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 28px 32px;
  background: linear-gradient(135deg, $v2-sky 0%, $v2-sky-dark 100%);
  border-radius: 18px;
  margin-bottom: 28px;
  box-shadow: 0 8px 32px rgba(79, 195, 247, 0.25);

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    padding: 24px 20px;
    gap: 14px;
  }
}

.hero-icon-wrapper {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  flex-shrink: 0;
  backdrop-filter: blur(8px);

  @media (max-width: 600px) {
    width: 56px;
    height: 56px;
  }
}

.hero-icon {
  color: white;
}

.hero-text {
  flex: 1;
}

.hero-title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin: 0 0 6px;
  line-height: 1.3;

  @media (max-width: 600px) {
    font-size: 18px;
  }
}

.hero-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.5;

  @media (max-width: 600px) {
    font-size: 13px;
  }
}

.select-all-row {
  margin-bottom: 20px;
}

.select-all-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  font-size: 14px;
  font-weight: 500;
  color: #4b5563;

  &:hover {
    border-color: #d1d5db;
  }

  &.active {
    border-color: $v2-success;
    background: linear-gradient(135deg, rgba($v2-success, 0.05) 0%, #f9fafb 100%);
    color: $v2-success;

    .checkbox-custom {
      background: $v2-success;
      border-color: $v2-success;
      color: white;
    }
  }

  .checkbox-custom {
    width: 22px;
    height: 22px;
    border: 2px solid #d1d5db;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
}

.consents-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
