<template>
  <div class="quick-bio-page">
    <!-- Left Column: Bio Form -->
    <div class="form-column">
      <div class="form-content">
        <!-- Back Link -->
        <router-link
          to="/app/specialist/onboarding/dashboard"
          class="back-link"
        >
          <v-icon name="hi-arrow-left" scale="0.8" />
          Back to Setup Dashboard
        </router-link>

        <!-- Header -->
        <div class="page-header">
          <h1 class="page-title">Let's get to know you</h1>
          <p class="page-subtitle">Provide basic professional details to start your profile.</p>
        </div>

        <!-- Loading State -->
        <div v-if="!isLoaded" class="loading-state">
          <v-icon name="hi-refresh" scale="1.2" class="spin" />
          <span>Loading your profile...</span>
        </div>

        <!-- Form -->
        <form v-else @submit.prevent="handleSubmit" class="bio-form">
          <!-- Profile Photo -->
          <div class="photo-section">
            <div class="photo-upload" @click="triggerFileInput">
              <div class="photo-placeholder" :class="{ 'has-image': quickBio.profile_image_preview }">
                <img
                  v-if="quickBio.profile_image_preview"
                  :src="quickBio.profile_image_preview"
                  alt="Profile preview"
                  class="photo-preview"
                />
                <template v-else>
                  <v-icon name="hi-photograph" scale="1.2" />
                  <span>Add Photo</span>
                </template>
              </div>
              <div class="photo-add-btn">
                <v-icon name="hi-plus" scale="0.6" />
              </div>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                class="file-input"
              />
            </div>
            <div class="photo-info">
              <h3>Profile Photo (Optional)</h3>
              <p>A professional headshot builds patient trust. You can add this later.</p>
              <div class="photo-actions">
                <button type="button" class="action-link primary" @click="triggerFileInput">Upload</button>
                <span class="divider">|</span>
                <button
                  type="button"
                  class="action-link danger"
                  @click="removePhoto"
                  v-if="quickBio.profile_image_preview"
                >Remove</button>
              </div>
            </div>
          </div>

          <!-- Full Name -->
          <div class="form-group">
            <label for="fullname" class="form-label">Full Professional Name</label>
            <div class="input-with-icon">
              <v-icon name="fa-user-md" scale="0.9" class="input-icon" />
              <input
                type="text"
                id="fullname"
                v-model="quickBio.full_name"
                class="form-input"
                placeholder="e.g. Dr. Amina Okonjo"
                @input="triggerAutoSave"
              />
            </div>
          </div>

          <!-- Professional Type -->
          <div class="form-group">
            <label class="form-label">I am a...</label>
            <div class="professional-type-grid">
              <label
                v-for="type in professionalTypes"
                :key="type.value"
                class="type-card"
                :class="{ selected: quickBio.professional_type === type.value }"
              >
                <input
                  type="radio"
                  name="professional_type"
                  :value="type.value"
                  v-model="quickBio.professional_type"
                  @change="handleProfessionalTypeChange"
                />
                <div class="type-icon">
                  <v-icon :name="type.icon" scale="1.2" />
                </div>
                <span class="type-label">{{ type.label }}</span>
              </label>
            </div>
          </div>

          <!-- Specializations (shown after selecting professional type) -->
          <div class="form-group" v-if="quickBio.professional_type && availableSpecializations.length > 0">
            <label class="form-label">
              My Specialization(s)
              <span class="label-hint">(Select all that apply)</span>
            </label>
            <div class="specializations-loading" v-if="loadingSpecializations">
              <v-icon name="hi-refresh" scale="0.8" class="spin" />
              <span>Loading specializations...</span>
            </div>
            <div class="specializations-grid" v-else>
              <label
                v-for="spec in availableSpecializations"
                :key="spec._id"
                class="spec-card"
                :class="{ selected: selectedSpecializations.includes(spec._id) }"
              >
                <input
                  type="checkbox"
                  :value="spec._id"
                  v-model="selectedSpecializations"
                  @change="triggerAutoSave"
                />
                <v-icon :name="spec.icon || 'fa-stethoscope'" scale="0.9" />
                <span>{{ spec.name }}</span>
              </label>
            </div>
            <p class="field-hint" v-if="selectedSpecializations.length > 0">
              {{ selectedSpecializations.length }} specialization(s) selected
            </p>
          </div>

          <!-- Gender -->
          <div class="form-group">
            <label class="form-label">Gender</label>
            <div class="gender-grid">
              <label
                v-for="g in genderOptions"
                :key="g.value"
                class="gender-card"
                :class="{ selected: quickBio.gender === g.value }"
              >
                <input
                  type="radio"
                  name="gender"
                  :value="g.value"
                  v-model="quickBio.gender"
                  @change="triggerAutoSave"
                />
                <v-icon :name="g.icon" scale="0.9" />
                <span>{{ g.label }}</span>
              </label>
            </div>
          </div>

          <!-- Professional Bio -->
          <div class="form-group">
            <div class="label-row">
              <label for="bio" class="form-label">Professional Bio</label>
              <span class="char-count" :class="{ 'over-limit': bioLength > 300 }">
                {{ bioLength }}/300
              </span>
            </div>
            <div class="textarea-wrapper">
              <textarea
                id="bio"
                v-model="quickBio.bio"
                rows="4"
                class="form-textarea"
                placeholder="Briefly describe your experience and approach to care..."
                @input="triggerAutoSave"
              ></textarea>

              <!-- AI Tip -->
              <div class="ai-tip">
                <div class="ai-icon">
                  <v-icon name="fa-magic" scale="0.6" />
                </div>
                <p>
                  <strong>AI Tip:</strong> Add key skills (e.g., "Pediatric Surgery", "Diabetes Management") to improve triage-based matching.
                </p>
              </div>
            </div>
          </div>

          <!-- CTA Buttons -->
          <div class="form-actions">
            <button type="button" class="btn-draft" @click="saveDraft">
              Save Draft
            </button>
            <button type="submit" class="btn-continue" :disabled="!isFormValid || isSaving">
              <template v-if="isSaving">
                <v-icon name="hi-refresh" scale="0.8" class="spin" />
                Saving...
              </template>
              <template v-else>
                {{ isOnboardingComplete ? 'Save Changes' : 'Continue Setup' }}
                <v-icon v-if="!isOnboardingComplete" name="hi-arrow-right" scale="0.8" />
              </template>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Right Column: Progress & Value Props -->
    <div class="preview-column">
      <div class="preview-content">
        <!-- Setup Progress Widget -->
        <div class="progress-widget">
          <div class="widget-badge">
            <v-icon name="fa-user-md" scale="0.7" />
            Specialist Setup
          </div>

          <h3 class="widget-title">Setup Progress</h3>

          <div class="progress-steps">
            <!-- Step 1: Account (Completed) -->
            <div class="step completed">
              <div class="step-indicator">
                <v-icon name="hi-check" scale="0.5" />
              </div>
              <div class="step-line"></div>
              <span class="step-label">Account Creation</span>
            </div>

            <!-- Step 2: Quick Bio (Active) -->
            <div class="step active">
              <div class="step-indicator">
                <span>2</span>
                <div class="pulse"></div>
              </div>
              <div class="step-line"></div>
              <div class="step-content">
                <span class="step-label">Quick Bio</span>
                <p class="step-desc">Basic details & professional summary.</p>
              </div>
            </div>

            <!-- Step 3: Setup Dashboard -->
            <div class="step pending">
              <div class="step-indicator">3</div>
              <div class="step-content">
                <span class="step-label">Onboarding Hub</span>
                <p class="step-desc">Credentials, Rates & Compliance.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Trust & Value -->
        <div class="value-card">
          <h4>
            <v-icon name="hi-user-group" scale="0.9" />
            Why fill this now?
          </h4>
          <ul class="value-list">
            <li>
              <div class="value-icon ai">
                <v-icon name="fa-robot" scale="0.7" />
              </div>
              <span><strong>AI Matching:</strong> Your bio keywords help our AI instantly match you with relevant patient cases.</span>
            </li>
            <li>
              <div class="value-icon profile">
                <v-icon name="hi-user-circle" scale="0.7" />
              </div>
              <span><strong>Profile Preview:</strong> Patients see this summary before booking, increasing your conversion rate.</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Trust Badge -->
      <div class="trust-footer">
        <div class="trust-item">
          <v-icon name="hi-lock-closed" scale="0.7" />
          Data Encrypted
        </div>
        <div class="trust-divider"></div>
        <div class="trust-item support">
          <v-icon name="fa-whatsapp" scale="0.9" />
          Need help? Chat with Support
        </div>
      </div>
    </div>

    <!-- Auto-save indicator -->
    <transition name="fade">
      <div v-if="showAutoSave" class="autosave-indicator">
        <v-icon name="hi-check-circle" scale="0.8" />
        <span>Draft saved</span>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { useStore } from 'vuex';
import { useOnboardingState } from './composables/useOnboardingState';

const store = useStore();
const $http = inject('$http');
const { quickBio, completeStep, goToStep, saveProgress, progressPercent, stepCompletion } = useOnboardingState();

// Check if onboarding is complete (editing mode)
const isOnboardingComplete = computed(() => {
  return progressPercent.value >= 100 || stepCompletion.review;
});

const fileInput = ref(null);
const showAutoSave = ref(false);
const isSaving = ref(false);
const isLoaded = ref(false);
const loadingSpecializations = ref(false);
const availableSpecializations = ref([]);
const selectedSpecializations = ref([]);
let autoSaveTimeout = null;

const professionalTypes = [
  { value: 'Medical Doctor', label: 'Medical Doctor', icon: 'fa-user-md' },
  { value: 'Therapist', label: 'Therapist', icon: 'fa-brain' },
  { value: 'Dietitian', label: 'Dietitian', icon: 'fa-apple-alt' },
  { value: 'Care Giver', label: 'Caregiver', icon: 'hi-heart' },
  { value: 'Pharmacist', label: 'Pharmacist', icon: 'ri-capsule-line' },
  { value: 'Lab Technician', label: 'Lab Technician', icon: 'hi-beaker' },
];

const genderOptions = [
  { value: 'Female', label: 'Female', icon: 'io-female-sharp' },
  { value: 'Male', label: 'Male', icon: 'io-male-sharp' },
  { value: 'Other', label: 'Other', icon: 'hi-user' },
];

const userProfile = computed(() => store.getters['userprofile']);
const userId = computed(() => userProfile.value?._id);

const bioLength = computed(() => quickBio.bio?.length || 0);

// Load existing data from user profile on mount
onMounted(() => {
  loadExistingData();
});

const loadExistingData = async () => {
  const profile = userProfile.value?.profile;
  const practice = userProfile.value?.professional_practice;
  const existingCategories = userProfile.value?.specialist_categories;

  if (profile) {
    // Full name from first_name + last_name
    if (profile.first_name || profile.last_name) {
      const title = practice?.category === 'Medical Doctor' ? 'Dr. ' : '';
      quickBio.full_name = quickBio.full_name || `${title}${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }

    // Gender (map backend format to our format)
    if (profile.gender && !quickBio.gender) {
      quickBio.gender = profile.gender; // Backend uses 'Male', 'Female'
    }

    // Profile photo
    if (profile.profile_photo && !quickBio.profile_image_preview) {
      quickBio.profile_image_preview = profile.profile_photo;
    }
  }

  if (practice) {
    // Professional type / category
    if (practice.category && !quickBio.professional_type) {
      quickBio.professional_type = practice.category;
      // Fetch specializations for this professional type and filter existing selections
      await fetchSpecializations(practice.category, true);
    }

    // Use area_of_specialty as bio if no bio set
    if (practice.area_of_specialty && !quickBio.bio) {
      quickBio.bio = practice.area_of_specialty;
    }
  }

  // Load existing specialist categories
  if (existingCategories && existingCategories.length > 0) {
    // Handle both populated objects and plain IDs
    selectedSpecializations.value = existingCategories.map(cat =>
      typeof cat === 'object' ? cat._id : cat
    );
  }

  isLoaded.value = true;
};

// Fetch specializations based on professional type
const fetchSpecializations = async (professionalType, filterExisting = false) => {
  if (!professionalType) {
    availableSpecializations.value = [];
    return;
  }

  loadingSpecializations.value = true;

  try {
    // Map our professional types to the API's professional_category values
    const categoryMap = {
      'Medical Doctor': 'Medical Doctor',
      'Therapist': 'Therapist',
      'Dietitian': 'Specialist', // Dietitians may fall under Specialist
      'Care Giver': 'Specialist',
      'Pharmacist': 'Pharmacist',
      'Lab Technician': 'Specialist',
    };

    const apiCategory = categoryMap[professionalType] || 'Specialist';
    const response = await $http.$_getSpecialistCategories({ professional_category: apiCategory });

    // Response structure: { statusCode, message, data: { all, popular, others } }
    // Axios wraps in response.data, so we check multiple paths
    let categories = [];
    if (response?.data?.data?.all) {
      categories = response.data.data.all;
    } else if (response?.data?.all) {
      categories = response.data.all;
    } else if (response?.all) {
      categories = response.all;
    }

    availableSpecializations.value = categories;

    // Filter selected specializations to only include valid ones for this professional type
    if (filterExisting && selectedSpecializations.value.length > 0) {
      const availableIds = categories.map(c => c._id);
      selectedSpecializations.value = selectedSpecializations.value.filter(id =>
        availableIds.includes(id)
      );
    }
  } catch (error) {
    console.error('Failed to fetch specializations:', error);
    availableSpecializations.value = [];
  } finally {
    loadingSpecializations.value = false;
  }
};

// Handle professional type change
const handleProfessionalTypeChange = async () => {
  triggerAutoSave();
  // Clear previous selections when changing professional type
  selectedSpecializations.value = [];
  await fetchSpecializations(quickBio.professional_type);
};

const isFormValid = computed(() => {
  return quickBio.full_name?.trim() &&
         quickBio.professional_type &&
         quickBio.gender;
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    quickBio.profile_image = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      quickBio.profile_image_preview = e.target.result;
    };
    reader.readAsDataURL(file);
    triggerAutoSave();
  }
};

const removePhoto = () => {
  quickBio.profile_image = null;
  quickBio.profile_image_preview = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  triggerAutoSave();
};

const triggerAutoSave = () => {
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    saveProgress();
    showAutoSave.value = true;
    setTimeout(() => {
      showAutoSave.value = false;
    }, 2000);
  }, 1000);
};

const saveDraft = async () => {
  await saveToBackend();
  saveProgress();
  showAutoSave.value = true;
  setTimeout(() => {
    showAutoSave.value = false;
  }, 2000);
};

const saveToBackend = async () => {
  if (!userId.value || isSaving.value) return;

  isSaving.value = true;

  try {
    // Parse full name into first and last name
    const nameParts = quickBio.full_name?.trim().split(' ') || [];
    // Remove Dr. prefix if present
    const cleanedParts = nameParts.filter(p => !p.toLowerCase().match(/^dr\.?$/));
    const firstName = cleanedParts[0] || '';
    const lastName = cleanedParts.slice(1).join(' ') || '';

    const payload = {
      profile: {
        first_name: firstName,
        last_name: lastName,
        gender: quickBio.gender,
      },
      professional_practice: {
        category: quickBio.professional_type,
        area_of_specialty: quickBio.bio || '',
      },
      // Include selected specializations
      specialist_categories: selectedSpecializations.value,
    };

    // Convert profile photo to base64 if it's a new file
    if (quickBio.profile_image instanceof File) {
      const base64 = await fileToBase64(quickBio.profile_image);
      payload.profile.profile_photo = base64;
    }

    await $http.$_updateCurrentUser({ userId: userId.value, payload });

    // Refresh user profile in store
    await store.dispatch('authenticate', localStorage.getItem('token') || sessionStorage.getItem('token'));

  } catch (error) {
    console.error('Failed to save profile:', error);
  } finally {
    isSaving.value = false;
  }
};

// Helper to convert File to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const handleSubmit = async () => {
  if (isFormValid.value) {
    await saveToBackend();
    saveProgress();
    completeStep('quickBio');

    // If onboarding is complete, stay on page. Otherwise, continue to next step.
    if (!isOnboardingComplete.value) {
      goToStep(3);
    }
  }
};
</script>

<style scoped lang="scss">
.quick-bio-page {
  display: flex;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.form-column {
  flex: 7;
  overflow-y: auto;
  padding: 2.5rem 4rem;
  background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
}

.form-content {
  max-width: 560px;
  margin: 0 auto;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #94A3B8;
  text-decoration: none;
  margin-bottom: 2rem;
  transition: color 0.2s;

  &:hover {
    color: #1A365D;
  }
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: #1A365D;
  font-family: 'Poppins', system-ui, sans-serif;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 0.9375rem;
  color: #64748B;
  margin: 0;
}

.bio-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Photo Section */
.photo-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
}

.photo-upload {
  position: relative;
  cursor: pointer;
}

.photo-placeholder {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #F1F5F9;
  border: 2px dashed #CBD5E1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94A3B8;
  font-size: 0.625rem;
  font-weight: 500;
  transition: all 0.2s;
  overflow: hidden;

  &:hover {
    border-color: #4FC3F7;
    background: rgba(79, 195, 247, 0.05);
    color: #4FC3F7;
  }

  &.has-image {
    border-style: solid;
    border-color: #4FC3F7;
  }
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-add-btn {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4FC3F7;
  border: 1px solid #E2E8F0;
}

.file-input {
  display: none;
}

.photo-info {
  flex: 1;

  h3 {
    font-size: 0.875rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.75rem;
    color: #64748B;
    margin: 0 0 0.5rem 0;
  }
}

.photo-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-link {
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;

  &.primary {
    color: #4FC3F7;

    &:hover {
      color: #0288D1;
    }
  }

  &.danger {
    color: #64748B;

    &:hover {
      color: #EF4444;
    }
  }
}

.divider {
  color: #CBD5E1;
}

/* Form Groups */
.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
  margin-bottom: 0.5rem;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.char-count {
  font-size: 0.75rem;
  color: #94A3B8;

  &.over-limit {
    color: #EF4444;
  }
}

.input-with-icon {
  position: relative;

  .input-icon {
    position: absolute;
    left: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94A3B8;
  }
}

.form-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.5rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: #1A365D;
  transition: all 0.2s;

  &::placeholder {
    color: #94A3B8;
  }

  &:focus {
    outline: none;
    border-color: #4FC3F7;
    box-shadow: 0 0 0 4px rgba(79, 195, 247, 0.15);
  }
}

/* Professional Type Grid */
.professional-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.type-card {
  position: relative;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .type-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem 0.5rem;
    background: white;
    border: 1px solid #E2E8F0;
    border-radius: 0.75rem;
    color: #64748B;
    transition: all 0.2s;
  }

  .type-label {
    font-size: 0.75rem;
    font-weight: 500;
    text-align: center;
  }

  &:hover .type-icon {
    border-color: rgba(79, 195, 247, 0.5);
  }

  &.selected .type-icon {
    background: #E1F5FE;
    border-color: #4FC3F7;
    color: #0288D1;
    box-shadow: 0 0 0 2px #4FC3F7;
  }
}

/* Specializations Section */
.label-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: #94A3B8;
  margin-left: 0.25rem;
}

.specializations-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #64748B;
  font-size: 0.875rem;
}

.specializations-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.spec-card {
  position: relative;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  color: #64748B;
  font-size: 0.75rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(79, 195, 247, 0.5);
    background: #F8FAFC;
  }

  &.selected {
    background: #E1F5FE;
    border-color: #4FC3F7;
    color: #0288D1;

    &::after {
      content: '';
      position: absolute;
      top: 4px;
      right: 4px;
      width: 6px;
      height: 6px;
      background: #4FC3F7;
      border-radius: 50%;
    }
  }
}

.field-hint {
  font-size: 0.75rem;
  color: #4FC3F7;
  font-weight: 500;
  margin-top: 0.5rem;
}

/* Gender Grid */
.gender-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.gender-card {
  position: relative;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  color: #64748B;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(79, 195, 247, 0.5);
  }

  &.selected {
    background: #E1F5FE;
    border-color: #4FC3F7;
    color: #0288D1;
    box-shadow: 0 0 0 2px #4FC3F7;
  }
}

/* Textarea */
.textarea-wrapper {
  position: relative;
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: #1A365D;
  resize: none;
  font-family: inherit;
  transition: all 0.2s;

  &::placeholder {
    color: #94A3B8;
  }

  &:focus {
    outline: none;
    border-color: #4FC3F7;
    box-shadow: 0 0 0 4px rgba(79, 195, 247, 0.15);
  }
}

.ai-tip {
  position: absolute;
  bottom: -1rem;
  right: 1rem;
  transform: translateY(50%);
  background: white;
  border: 1px solid rgba(79, 195, 247, 0.2);
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  max-width: 280px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 10;

  .ai-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #4FC3F7 0%, #9C27B0 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  p {
    font-size: 0.625rem;
    color: #64748B;
    margin: 0;
    line-height: 1.4;

    strong {
      color: #1A365D;
    }
  }
}

/* Form Actions */
.form-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-top: 2rem;
  margin-top: 1rem;
}

.btn-draft {
  padding: 1rem 1.5rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F8FAFC;
  }
}

.btn-continue {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: #FF9800;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #F57C00;
    box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

/* Preview Column */
.preview-column {
  flex: 5;
  background: white;
  border-left: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 256px;
    height: 256px;
    background: rgba(79, 195, 247, 0.1);
    border-radius: 0 0 0 100%;
    pointer-events: none;
  }
}

.preview-content {
  flex: 1;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2.5rem;
}

/* Progress Widget */
.progress-widget {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid #E2E8F0;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
  position: relative;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.widget-badge {
  position: absolute;
  top: -0.75rem;
  right: -0.75rem;
  background: #1A365D;
  color: white;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.widget-title {
  font-size: 0.6875rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 1.5rem 0;
}

.progress-steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  position: relative;
}

.step-indicator {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.step-line {
  position: absolute;
  left: 13px;
  top: 28px;
  width: 2px;
  height: calc(100% + 1rem);
  background: #E2E8F0;
  z-index: 0;
}

.step.completed .step-indicator {
  background: #4CAF50;
  color: white;
}

.step.completed .step-line {
  background: #4CAF50;
}

.step.completed .step-label {
  color: #94A3B8;
  text-decoration: line-through;
}

.step.active .step-indicator {
  background: #4FC3F7;
  color: white;
  box-shadow: 0 0 0 4px rgba(79, 195, 247, 0.2);

  .pulse {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #4FC3F7;
    animation: pulse 2s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0; transform: scale(1.5); }
}

.step.active .step-content {
  background: rgba(79, 195, 247, 0.1);
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(79, 195, 247, 0.2);
  margin-top: -0.5rem;
}

.step.pending .step-indicator {
  background: #F1F5F9;
  color: #94A3B8;
}

.step-label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
}

.step-desc {
  font-size: 0.75rem;
  color: #64748B;
  margin: 0.25rem 0 0 0;
}

.step.pending {
  opacity: 0.5;
}

/* Value Card */
.value-card {
  background: linear-gradient(135deg, #F8FAFC 0%, white 100%);
  border: 1px solid #E2E8F0;
  border-radius: 1rem;
  padding: 1.5rem;

  h4 {
    font-size: 0.875rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0 0 1rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    svg {
      color: #FF9800;
    }
  }
}

.value-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  li {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    font-size: 0.8125rem;
    color: #64748B;
    line-height: 1.5;

    strong {
      color: #1A365D;
    }
  }
}

.value-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;

  &.ai {
    background: #E3F2FD;
    color: #1976D2;
  }

  &.profile {
    background: #F3E5F5;
    color: #7B1FA2;
  }
}

/* Trust Footer */
.trust-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #E2E8F0;
  background: #F8FAFC;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #94A3B8;

  &.support {
    color: #64748B;
    cursor: pointer;

    svg {
      color: #25D366;
    }

    &:hover {
      color: #1A365D;
    }
  }
}

.trust-divider {
  width: 1px;
  height: 12px;
  background: #CBD5E1;
}

/* Autosave Indicator */
.autosave-indicator {
  position: fixed;
  top: 5.5rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748B;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 100;

  svg {
    color: #4FC3F7;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #64748B;
  font-size: 0.875rem;
  font-weight: 500;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 1024px) {
  .preview-column {
    display: none;
  }

  .form-column {
    flex: 1;
    padding: 1.5rem;
  }

  .professional-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .specializations-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .professional-type-grid,
  .gender-grid,
  .specializations-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-draft {
    width: 100%;
  }
}
</style>
