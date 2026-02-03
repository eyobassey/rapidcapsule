<template>
  <div class="step-container">
    <div class="step-scroll">
      <div class="step-content">
        <!-- Step Header -->
        <div class="step-header">
          <div class="step-header-row">
            <button class="back-btn" @click="goBack">
              <v-icon name="hi-arrow-left" scale="0.9" />
              <span>Back</span>
            </button>
            <span class="step-badge required">Step 2 of 9 - Required</span>
          </div>
          <div class="step-info">
            <h1 class="step-title">Personal Details</h1>
            <p class="step-description">
              Tell us about yourself. This information helps us provide personalized healthcare.
            </p>
          </div>
        </div>

        <!-- Form Content -->
        <div class="form-sections">
          <!-- Profile Photo Section -->
          <div class="form-section">
            <h2 class="section-title">Profile Photo</h2>
            <div class="photo-upload-area">
              <div class="photo-preview" :class="{ 'has-image': personalDetails.profile_image_preview }">
                <img v-if="personalDetails.profile_image_preview" :src="personalDetails.profile_image_preview" alt="Profile" />
                <v-icon v-else name="hi-user" scale="2" />
              </div>
              <div class="photo-actions">
                <label class="upload-btn">
                  <v-icon name="hi-camera" scale="0.8" />
                  <span>{{ personalDetails.profile_image_preview ? 'Change Photo' : 'Upload Photo' }}</span>
                  <input type="file" accept="image/*" @change="handlePhotoUpload" hidden />
                </label>
                <button v-if="personalDetails.profile_image_preview" class="remove-btn" @click="removePhoto">
                  <v-icon name="hi-trash" scale="0.8" />
                  <span>Remove</span>
                </button>
              </div>
              <p class="photo-hint">JPG, PNG or GIF. Max size 5MB.</p>
            </div>
          </div>

          <!-- Basic Information Section -->
          <div class="form-section">
            <h2 class="section-title">Basic Information</h2>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label required">First Name</label>
                <input
                  type="text"
                  v-model="personalDetails.first_name"
                  class="form-input"
                  placeholder="Enter your first name"
                />
              </div>
              <div class="form-group">
                <label class="form-label required">Last Name</label>
                <input
                  type="text"
                  v-model="personalDetails.last_name"
                  class="form-input"
                  placeholder="Enter your last name"
                />
              </div>
              <div class="form-group">
                <label class="form-label required">Date of Birth</label>
                <input
                  type="date"
                  v-model="personalDetails.date_of_birth"
                  class="form-input"
                  :max="maxDate"
                />
              </div>
              <div class="form-group">
                <label class="form-label required">Gender</label>
                <div class="radio-group">
                  <label class="radio-option" :class="{ selected: personalDetails.gender === 'Male' }">
                    <input type="radio" v-model="personalDetails.gender" value="Male" />
                    <v-icon name="hi-user" scale="0.8" />
                    <span>Male</span>
                  </label>
                  <label class="radio-option" :class="{ selected: personalDetails.gender === 'Female' }">
                    <input type="radio" v-model="personalDetails.gender" value="Female" />
                    <v-icon name="hi-user" scale="0.8" />
                    <span>Female</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Information Section -->
          <div class="form-section">
            <h2 class="section-title">Contact Information</h2>
            <div class="form-grid">
              <div class="form-group full-width">
                <label class="form-label required">Phone Number</label>
                <div class="phone-input-group">
                  <select v-model="personalDetails.phone_country_code" class="country-code-select">
                    <option value="+234">+234 (NG)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+91">+91 (IN)</option>
                    <option value="+27">+27 (ZA)</option>
                    <option value="+233">+233 (GH)</option>
                    <option value="+254">+254 (KE)</option>
                  </select>
                  <input
                    type="tel"
                    v-model="personalDetails.phone_number"
                    class="form-input phone-input"
                    placeholder="8012345678"
                    maxlength="10"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Health Information Section -->
          <div class="form-section">
            <h2 class="section-title">Basic Health Information</h2>
            <p class="section-description">This helps specialists provide better care.</p>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Blood Type</label>
                <select v-model="personalDetails.blood_type" class="form-select">
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Genotype</label>
                <select v-model="personalDetails.genotype" class="form-select">
                  <option value="">Select genotype</option>
                  <option value="AA">AA</option>
                  <option value="AS">AS</option>
                  <option value="SS">SS</option>
                  <option value="AC">AC</option>
                  <option value="SC">SC</option>
                  <option value="CC">CC</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Marital Status</label>
                <select v-model="personalDetails.marital_status" class="form-select">
                  <option value="">Select status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                  <option value="widowed">Widowed</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Occupation</label>
                <input
                  type="text"
                  v-model="personalDetails.occupation"
                  class="form-input"
                  placeholder="e.g., Software Engineer"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="step-footer">
          <div class="footer-info">
            <v-icon name="hi-information-circle" scale="0.8" />
            <span>Fields marked with * are required</span>
          </div>
          <div class="footer-actions">
            <button class="btn-secondary" @click="saveAndExit">
              Save & Exit
            </button>
            <button class="btn-primary" @click="saveAndContinue" :disabled="!isValid">
              <span>Continue</span>
              <v-icon name="hi-arrow-right" scale="0.8" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, inject, getCurrentInstance } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { usePatientOnboardingState } from './composables/usePatientOnboardingState';

const router = useRouter();
const store = useStore();
const $http = inject('$http');
const $toast = getCurrentInstance().appContext.config.globalProperties.$toast;

const {
  personalDetails,
  completeStep,
  saveProgress,
  goToStep,
} = usePatientOnboardingState();

const userProfile = computed(() => store.getters['userprofile']);

// Max date for DOB (must be at least 12 years old)
const maxDate = computed(() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 12);
  return date.toISOString().split('T')[0];
});

// Validation
const isValid = computed(() => {
  return (
    personalDetails.first_name?.trim() &&
    personalDetails.last_name?.trim() &&
    personalDetails.date_of_birth &&
    personalDetails.gender &&
    personalDetails.phone_number?.length >= 10
  );
});

// Load existing data from profile
onMounted(() => {
  const profile = userProfile.value?.profile;
  if (profile) {
    if (profile.first_name) personalDetails.first_name = profile.first_name;
    if (profile.last_name) personalDetails.last_name = profile.last_name;
    if (profile.date_of_birth) personalDetails.date_of_birth = profile.date_of_birth;
    if (profile.gender) personalDetails.gender = profile.gender;
    if (profile.contact?.phone?.country_code) personalDetails.phone_country_code = profile.contact.phone.country_code;
    if (profile.contact?.phone?.number) personalDetails.phone_number = profile.contact.phone.number;
    if (profile.blood_type) personalDetails.blood_type = profile.blood_type;
    if (profile.genotype) personalDetails.genotype = profile.genotype;
    if (profile.marital_status) personalDetails.marital_status = profile.marital_status;
    if (profile.occupation) personalDetails.occupation = profile.occupation;
    if (profile.profile_photo) personalDetails.profile_image_preview = profile.profile_photo;
  }
});

const handlePhotoUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    alert('File size must be less than 5MB');
    return;
  }

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    personalDetails.profile_image_preview = e.target.result;
  };
  reader.readAsDataURL(file);

  personalDetails.profile_image = file;
};

const removePhoto = () => {
  personalDetails.profile_image = null;
  personalDetails.profile_image_preview = '';
};

const goBack = () => {
  goToStep(1);
};

const saveAndExit = async () => {
  await saveToBackend();
  saveProgress();
  router.push({ name: 'Patient Dashboard' });
};

const saveAndContinue = async () => {
  // Validate required fields with toast messages
  if (!personalDetails.first_name?.trim()) {
    $toast.error('Please enter your first name');
    return;
  }
  if (!personalDetails.last_name?.trim()) {
    $toast.error('Please enter your last name');
    return;
  }
  if (!personalDetails.date_of_birth) {
    $toast.error('Please enter your date of birth');
    return;
  }
  if (!personalDetails.gender) {
    $toast.error('Please select your gender');
    return;
  }
  if (!personalDetails.phone_number || personalDetails.phone_number.length < 10) {
    $toast.error('Please enter a valid phone number');
    return;
  }

  await saveToBackend();
  completeStep('personalDetails');
  saveProgress();
  goToStep(3); // Go to Address & Emergency
};

const saveToBackend = async () => {
  try {
    const payload = {
      profile: {
        first_name: personalDetails.first_name,
        last_name: personalDetails.last_name,
        date_of_birth: personalDetails.date_of_birth,
        gender: personalDetails.gender,
        contact: {
          phone: {
            country_code: personalDetails.phone_country_code,
            number: personalDetails.phone_number,
          },
        },
        blood_type: personalDetails.blood_type,
        genotype: personalDetails.genotype,
        marital_status: personalDetails.marital_status,
        occupation: personalDetails.occupation,
      },
    };

    // Upload photo if a new image was selected (File object)
    if (personalDetails.profile_image instanceof File) {
      // Convert file to base64 data URL
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(personalDetails.profile_image);
      });
      payload.profile.profile_photo = base64;
    }

    await $http.$_updateUser(payload);

    // Refresh user profile in store
    await store.dispatch('authenticate', localStorage.getItem('token') || sessionStorage.getItem('token'));
  } catch (error) {
    console.error('Failed to save personal details:', error);
  }
};
</script>

<style scoped lang="scss">
.step-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
}

.step-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.step-content {
  width: 100%;
  max-width: 800px;
}

.step-header {
  margin-bottom: 2rem;
}

.step-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F1F5F9;
    border-color: #CBD5E1;
  }
}

.step-info {
  margin-bottom: 1rem;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;

  &.required {
    background: #FEE2E2;
    color: #DC2626;
  }

  &.optional {
    background: #F1F5F9;
    color: #64748B;
  }
}

.step-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 0.5rem 0;
  font-family: 'Poppins', system-ui, sans-serif;
}

.step-description {
  font-size: 0.9375rem;
  color: #64748B;
  margin: 0;
}

.form-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 0.5rem 0;
}

.section-description {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0 0 1.25rem 0;
}

.photo-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #F8FAFC;
  border-radius: 0.75rem;
}

.photo-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &.has-image {
    border: 3px solid #4FC3F7;
  }
}

.photo-actions {
  display: flex;
  gap: 0.75rem;
}

.upload-btn, .remove-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn {
  background: #4FC3F7;
  border: none;
  color: white;

  &:hover {
    background: #0288D1;
  }
}

.remove-btn {
  background: white;
  border: 1px solid #E2E8F0;
  color: #64748B;

  &:hover {
    background: #FEE2E2;
    border-color: #FECACA;
    color: #DC2626;
  }
}

.photo-hint {
  font-size: 0.75rem;
  color: #94A3B8;
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &.full-width {
    grid-column: span 2;

    @media (max-width: 640px) {
      grid-column: span 1;
    }
  }
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;

  &.required::after {
    content: ' *';
    color: #DC2626;
  }
}

.form-input, .form-select {
  padding: 0.75rem 1rem;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  color: #1A365D;
  background: white;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4FC3F7;
    box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.1);
  }

  &::placeholder {
    color: #94A3B8;
  }
}

.phone-input-group {
  display: flex;
  gap: 0.5rem;
}

.country-code-select {
  width: 120px;
  padding: 0.75rem;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #1A365D;
  background: white;
}

.phone-input {
  flex: 1;
}

.radio-group {
  display: flex;
  gap: 0.75rem;
}

.radio-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748B;

  input {
    display: none;
  }

  &:hover {
    border-color: #CBD5E1;
  }

  &.selected {
    border-color: #4FC3F7;
    background: #E1F5FE;
    color: #0288D1;
  }
}

.step-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #E2E8F0;

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 1rem;
  }
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: #64748B;
}

.footer-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-secondary {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F8FAFC;
    border-color: #CBD5E1;
  }
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #4FC3F7 0%, #0288D1 100%);
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);

  &:hover:not(:disabled) {
    box-shadow: 0 6px 16px rgba(79, 195, 247, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .step-scroll {
    padding: 1rem;
  }

  .step-content {
    max-width: 100%;
  }

  .step-header {
    margin-bottom: 1.25rem;
  }

  .step-header-row {
    margin-bottom: 1rem;
  }

  .back-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;

    span {
      display: none;
    }
  }

  .step-badge {
    font-size: 0.625rem;
    padding: 0.25rem 0.5rem;
  }

  .step-title {
    font-size: 1.375rem;
    line-height: 1.3;
  }

  .step-description {
    font-size: 0.875rem;
  }

  .form-sections {
    gap: 1.25rem;
  }

  .form-section {
    padding: 1.25rem;
    border-radius: 0.75rem;
  }

  .section-title {
    font-size: 0.9375rem;
  }

  .section-description {
    font-size: 0.8125rem;
    margin-bottom: 1rem;
  }

  /* Photo Upload - Mobile Optimized */
  .photo-upload-area {
    padding: 1.25rem;
  }

  .photo-preview {
    width: 100px;
    height: 100px;
  }

  .photo-actions {
    flex-direction: column;
    width: 100%;
    gap: 0.5rem;
  }

  .upload-btn, .remove-btn {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
  }

  /* Form Grid - Single Column */
  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-group.full-width {
    grid-column: span 1;
  }

  .form-label {
    font-size: 0.8125rem;
  }

  .form-input, .form-select {
    padding: 0.875rem 1rem;
    font-size: 1rem; /* Prevent iOS zoom */
  }

  /* Phone Input - Stack on very small screens */
  .phone-input-group {
    flex-direction: column;
    gap: 0.75rem;
  }

  .country-code-select {
    width: 100%;
    padding: 0.875rem;
    font-size: 1rem;
  }

  /* Radio Buttons - Better Touch Targets */
  .radio-group {
    flex-direction: column;
    gap: 0.5rem;
  }

  .radio-option {
    padding: 1rem;
    justify-content: flex-start;
  }

  /* Footer - Full Width Buttons */
  .step-footer {
    flex-direction: column-reverse;
    gap: 1rem;
    padding-top: 1.25rem;
    margin-top: 1.5rem;
  }

  .footer-info {
    font-size: 0.75rem;
    text-align: center;
  }

  .footer-actions {
    width: 100%;
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn-secondary, .btn-primary {
    width: 100%;
    justify-content: center;
    padding: 1rem 1.5rem;
  }
}

/* Extra small screens */
@media (max-width: 380px) {
  .step-scroll {
    padding: 0.75rem;
  }

  .form-section {
    padding: 1rem;
  }

  .step-title {
    font-size: 1.25rem;
  }
}
</style>
