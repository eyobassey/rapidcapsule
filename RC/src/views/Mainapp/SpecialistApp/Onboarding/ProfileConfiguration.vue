<template>
  <div class="profile-config-page">
    <!-- Main Content Area -->
    <main class="main-content">
      <!-- Center Column: Forms -->
      <div class="form-scroll-area">
        <div class="form-container">
          <!-- Header -->
          <div class="page-header">
            <h1 class="page-title">Configure Your Profile</h1>
            <p class="page-subtitle">Build a trusted profile that helps patients find you. AI uses this data for matchmaking.</p>
          </div>

          <!-- Tabs Navigation -->
          <div class="tabs-header">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="tab-btn"
              :class="{ active: activeTab === tab.id }"
              @click="scrollToSection(tab.id)"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- Form Sections -->
          <div class="sections-container">
            <!-- Bio & Details Section -->
            <section id="bio" class="form-section">
              <h2 class="section-title">
                <v-icon name="hi-user-circle" scale="1" />
                Basic Information
              </h2>

              <!-- Photo Upload -->
              <div class="photo-upload-row">
                <div class="photo-upload" @click="triggerFileInput">
                  <img
                    v-if="profileConfig.profile_image_preview || userProfile?.profile?.profile_image"
                    :src="profileConfig.profile_image_preview || userProfile?.profile?.profile_image"
                    alt="Profile"
                    class="photo-preview"
                  />
                  <div class="photo-overlay">
                    <v-icon name="hi-photograph" scale="1.2" />
                    <span>Upload</span>
                  </div>
                  <div class="photo-badge">
                    <v-icon name="hi-plus" scale="0.6" />
                  </div>
                </div>
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handlePhotoUpload"
                />
                <div class="photo-info">
                  <h3>Profile Photo</h3>
                  <p>High quality, professional headshot. JPG/PNG, max 5MB.</p>
                  <div class="photo-actions">
                    <button class="link-btn" @click="triggerFileInput">Choose File</button>
                    <span class="divider">|</span>
                    <button class="link-btn danger" @click="removePhoto">Remove</button>
                  </div>
                </div>
              </div>

              <!-- Form Fields -->
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Display Name <span class="required">*</span></label>
                  <div class="input-wrapper">
                    <input
                      v-model="profileConfig.display_name"
                      type="text"
                      placeholder="Dr. Emmanuel"
                      class="form-input"
                      :class="{ valid: profileConfig.display_name }"
                    />
                    <v-icon
                      v-if="profileConfig.display_name"
                      name="fa-check"
                      scale="0.7"
                      class="input-icon valid"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Years of Experience <span class="required">*</span></label>
                  <input
                    v-model.number="profileConfig.years_experience"
                    type="number"
                    min="0"
                    max="60"
                    placeholder="e.g. 8"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="form-group">
                <div class="label-row">
                  <label class="form-label">Professional Bio <span class="required">*</span></label>
                  <button class="ai-enhance-btn" @click="enhanceBio">
                    <v-icon name="fa-magic" scale="0.7" />
                    AI Enhance
                  </button>
                </div>
                <div class="textarea-wrapper">
                  <textarea
                    v-model="profileConfig.professional_bio"
                    rows="4"
                    maxlength="500"
                    placeholder="Describe your background, expertise, and approach to care..."
                    class="form-textarea"
                  />
                  <span class="char-count">{{ profileConfig.professional_bio?.length || 0 }}/500</span>
                </div>
                <p class="form-hint">
                  <v-icon name="hi-information-circle" scale="0.7" />
                  This will be visible to patients on your profile card.
                </p>
              </div>
            </section>

            <!-- Languages Section -->
            <section id="languages" class="form-section">
              <h2 class="section-title">
                <v-icon name="hi-globe" scale="1" />
                Languages Spoken
              </h2>
              <p class="section-description">Select languages you are fluent in to help us match you with patients.</p>

              <!-- Search -->
              <div class="search-wrapper">
                <v-icon name="hi-search" scale="0.9" class="search-icon" />
                <input
                  v-model="languageSearch"
                  type="text"
                  placeholder="Search languages (e.g. Yoruba, French)..."
                  class="search-input"
                />
              </div>

              <!-- Loading Languages -->
              <div v-if="loadingLanguages" class="loading-inline">
                <v-icon name="hi-refresh" scale="0.8" class="spin" />
                <span>Loading languages...</span>
              </div>

              <template v-else>
                <!-- Selected Languages -->
                <div class="selected-tags" v-if="selectedLanguages.length > 0">
                  <div
                    v-for="lang in selectedLanguages"
                    :key="lang._id"
                    class="language-tag"
                  >
                    {{ lang.name }}
                    <button @click="removeLanguage(lang._id)">
                      <v-icon name="hi-x" scale="0.7" />
                    </button>
                  </div>
                </div>

                <!-- Popular Languages -->
                <div class="suggestions-section">
                  <h4 class="suggestions-title">Popular in your region</h4>
                  <div class="suggestions-list">
                    <button
                      v-for="lang in (languageSearch ? filteredLanguages : suggestedLanguages)"
                      :key="lang._id"
                      class="suggestion-btn"
                      :class="{ selected: isLanguageSelected(lang._id) }"
                      @click="toggleLanguage(lang)"
                    >
                      <v-icon :name="isLanguageSelected(lang._id) ? 'hi-check' : 'hi-plus'" scale="0.6" />
                      {{ lang.name }}
                    </button>
                  </div>
                </div>
              </template>
            </section>

            <!-- Specializations Section -->
            <section id="specializations" class="form-section">
              <div class="section-header">
                <h2 class="section-title">
                  <v-icon name="fa-stethoscope" scale="1" />
                  Specializations
                </h2>
                <div class="tooltip-trigger">
                  <v-icon name="hi-question-mark-circle" scale="0.9" />
                  <div class="tooltip">
                    Add your primary specialty and any sub-specialties. This drives our search engine.
                  </div>
                </div>
              </div>

              <!-- Loading Specializations -->
              <div v-if="loadingSpecializations" class="loading-inline">
                <v-icon name="hi-refresh" scale="0.8" class="spin" />
                <span>Loading specializations...</span>
              </div>

              <template v-else-if="categories.length > 0">
                <!-- AI Suggestion Banner -->
                <div v-if="aiSuggestion && aiSuggestion.specialties?.length > 0" class="ai-suggestion-banner">
                  <div class="ai-icon">
                    <v-icon name="fa-magic" scale="0.9" />
                  </div>
                  <div class="ai-content">
                    <h4>AI Recommendation</h4>
                    <p>Based on your bio, we suggest adding:</p>
                    <div class="ai-suggestions">
                      <button
                        v-for="suggestion in aiSuggestion.specialties"
                        :key="suggestion"
                        class="ai-suggestion-btn"
                        @click="addSpecialty(suggestion)"
                      >
                        + {{ suggestion }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Primary Specialty -->
                <div class="form-group">
                  <label class="form-label">Primary Specialty</label>
                  <div class="select-wrapper">
                    <select v-model="profileConfig.primary_specialty" class="form-select">
                      <option value="">Select specialty...</option>
                      <option v-for="cat in categories" :key="cat._id" :value="cat._id">
                        {{ cat.name }}
                      </option>
                    </select>
                    <v-icon name="hi-chevron-down" scale="0.7" class="select-icon" />
                  </div>
                </div>

                <!-- Additional Specialties -->
                <div class="form-group" v-if="categories.length > 1">
                  <label class="form-label">Additional Specialties <span class="label-hint">(Select all that apply)</span></label>
                  <div class="tree-container">
                    <div class="tree-items flat">
                      <label
                        v-for="cat in categories"
                        :key="cat._id"
                        class="tree-item"
                        :class="{ 'is-primary': cat._id === profileConfig.primary_specialty }"
                      >
                        <input
                          type="checkbox"
                          :checked="profileConfig.sub_specialties.includes(cat._id)"
                          :disabled="cat._id === profileConfig.primary_specialty"
                          @change="toggleSubSpecialty(cat._id)"
                        />
                        <span>{{ cat.name }}</span>
                        <span v-if="cat._id === profileConfig.primary_specialty" class="primary-badge">Primary</span>
                      </label>
                    </div>
                  </div>
                  <p class="field-hint" v-if="profileConfig.sub_specialties.length > 0">
                    {{ profileConfig.sub_specialties.length }} additional specialization(s) selected
                  </p>
                </div>
              </template>

              <!-- No specializations available -->
              <div v-else class="empty-state">
                <v-icon name="hi-exclamation-circle" scale="1.2" />
                <p>No specializations available. Please complete your Quick Bio first to select your professional type.</p>
                <router-link to="/app/specialist/onboarding/quick-bio" class="link-btn">
                  Go to Quick Bio
                </router-link>
              </div>
            </section>

            <!-- Practice Location Section -->
            <section id="location" class="form-section">
              <h2 class="section-title">
                <v-icon name="hi-location-marker" scale="1" />
                Practice Location
              </h2>
              <p class="section-description">Your location helps patients find local specialists and determines diaspora status.</p>

              <!-- Phone Number -->
              <div class="form-group">
                <label class="form-label">Phone Number <span class="required">*</span></label>
                <div class="phone-input-row">
                  <div class="country-code-select">
                    <select v-model="profileConfig.phone_country_code" class="form-select">
                      <option value="+234">+234 (Nigeria)</option>
                      <option value="+1">+1 (US/Canada)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+91">+91 (India)</option>
                      <option value="+27">+27 (South Africa)</option>
                      <option value="+254">+254 (Kenya)</option>
                      <option value="+233">+233 (Ghana)</option>
                      <option value="+971">+971 (UAE)</option>
                      <option value="+49">+49 (Germany)</option>
                      <option value="+33">+33 (France)</option>
                      <option value="+61">+61 (Australia)</option>
                    </select>
                    <v-icon name="hi-chevron-down" scale="0.7" class="select-icon" />
                  </div>
                  <input
                    v-model="profileConfig.phone_number"
                    type="tel"
                    placeholder="8012345678"
                    class="form-input phone-input"
                    maxlength="10"
                  />
                </div>
                <p class="form-hint">
                  <v-icon name="hi-information-circle" scale="0.7" />
                  This is for patient communication and appointment reminders.
                </p>
              </div>

              <!-- Country -->
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Country <span class="required">*</span></label>
                  <div class="select-wrapper">
                    <select v-model="profileConfig.country" class="form-select" @change="onCountryChange">
                      <option value="">Select country...</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="South Africa">South Africa</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Ghana">Ghana</option>
                      <option value="United Arab Emirates">United Arab Emirates</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Australia">Australia</option>
                      <option value="India">India</option>
                      <option value="Other">Other</option>
                    </select>
                    <v-icon name="hi-chevron-down" scale="0.7" class="select-icon" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">State/Province <span class="required">*</span></label>
                  <div class="select-wrapper" v-if="profileConfig.country === 'Nigeria'">
                    <select v-model="profileConfig.state" class="form-select">
                      <option value="">Select state...</option>
                      <option v-for="state in nigerianStates" :key="state" :value="state">{{ state }}</option>
                    </select>
                    <v-icon name="hi-chevron-down" scale="0.7" class="select-icon" />
                  </div>
                  <input
                    v-else
                    v-model="profileConfig.state"
                    type="text"
                    placeholder="Enter state/province"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">City</label>
                  <input
                    v-model="profileConfig.city"
                    type="text"
                    placeholder="e.g. Lagos, Abuja"
                    class="form-input"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Practice Type</label>
                  <div class="select-wrapper">
                    <select v-model="profileConfig.practice_type" class="form-select">
                      <option value="virtual_only">Virtual Only (Telehealth)</option>
                      <option value="home_office">Home Office</option>
                      <option value="clinic">Clinic/Hospital</option>
                    </select>
                    <v-icon name="hi-chevron-down" scale="0.7" class="select-icon" />
                  </div>
                </div>
              </div>

              <div class="form-group" v-if="profileConfig.practice_type !== 'virtual_only'">
                <label class="form-label">Practice Address</label>
                <textarea
                  v-model="profileConfig.address"
                  rows="2"
                  placeholder="Enter your practice address..."
                  class="form-textarea"
                />
              </div>

              <!-- Diaspora Status Badge -->
              <div class="diaspora-status-card" :class="{ diaspora: profileConfig.is_diaspora }">
                <div class="diaspora-icon">
                  <v-icon :name="profileConfig.is_diaspora ? 'hi-globe-alt' : 'hi-home'" scale="1" />
                </div>
                <div class="diaspora-content">
                  <h4>{{ profileConfig.is_diaspora ? 'Diaspora Specialist' : 'Local Specialist' }}</h4>
                  <p>
                    {{ profileConfig.is_diaspora
                      ? 'You practice from outside Nigeria. Patients can filter to find diaspora specialists.'
                      : 'You practice within Nigeria. You will appear in local specialist searches.' }}
                  </p>
                </div>
                <div class="diaspora-toggle">
                  <label class="toggle-switch">
                    <input type="checkbox" v-model="profileConfig.is_diaspora" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </section>
          </div>

          <!-- Mobile Profile Preview (shown inline on mobile only) -->
          <section class="mobile-preview-section">
            <h3 class="mobile-preview-title">
              <v-icon name="hi-eye" scale="0.9" />
              Profile Preview
            </h3>

            <div class="mobile-preview-card">
              <div class="card-header-bg">
                <div class="availability-badge">
                  <span class="dot" />
                  Available
                </div>
              </div>

              <div class="card-avatar-wrapper">
                <div class="card-avatar">
                  <img
                    v-if="profileConfig.profile_image_preview || userProfile?.profile?.profile_image"
                    :src="profileConfig.profile_image_preview || userProfile?.profile?.profile_image"
                    alt="Profile"
                  />
                  <v-icon v-else name="hi-user" scale="1.5" />
                </div>
              </div>

              <div class="card-content">
                <div class="card-top">
                  <div>
                    <h3 class="card-name">{{ profileConfig.display_name || 'Dr. Name' }}</h3>
                    <p class="card-specialty">{{ primarySpecialtyName || 'Specialty' }}</p>
                  </div>
                  <div class="card-rating">
                    <v-icon name="hi-star" scale="0.6" />
                    <span>5.0</span>
                    <small>New</small>
                  </div>
                </div>

                <div class="card-badges">
                  <span class="badge blue">{{ profileConfig.years_experience || '?' }} Yrs Exp</span>
                  <span class="badge gray">{{ languageNames || 'Languages' }}</span>
                </div>

                <p class="card-bio">
                  {{ truncatedBio || 'Your professional bio will appear here...' }}
                </p>

                <div class="card-tags">
                  <span v-for="sub in selectedSubSpecialties.slice(0, 2)" :key="sub.id" class="card-tag">
                    {{ sub.name }}
                  </span>
                </div>

                <div class="card-actions">
                  <button class="book-btn">Book Consult</button>
                  <button class="chat-btn">
                    <v-icon name="hi-chat" scale="0.9" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Spacer for sticky footer -->
          <div class="footer-spacer"></div>
        </div>
      </div>

      <!-- Right Column: Preview (Desktop only) -->
      <aside class="preview-column">
        <div class="preview-header">
          <h3>
            <v-icon name="hi-eye" scale="0.9" />
            Live Preview
          </h3>
          <p>This is how your profile card will appear to patients in search results.</p>
        </div>

        <div class="preview-container">
          <!-- Profile Card Preview -->
          <div class="profile-card-preview">
            <!-- Card Header -->
            <div class="card-header-bg">
              <div class="availability-badge">
                <span class="dot" />
                Available
              </div>
            </div>

            <!-- Avatar -->
            <div class="card-avatar-wrapper">
              <div class="card-avatar">
                <img
                  v-if="profileConfig.profile_image_preview || userProfile?.profile?.profile_image"
                  :src="profileConfig.profile_image_preview || userProfile?.profile?.profile_image"
                  alt="Profile"
                />
                <v-icon v-else name="hi-user" scale="1.5" />
              </div>
            </div>

            <!-- Content -->
            <div class="card-content">
              <div class="card-top">
                <div>
                  <h3 class="card-name">{{ profileConfig.display_name || 'Dr. Name' }}</h3>
                  <p class="card-specialty">{{ primarySpecialtyName || 'Specialty' }}</p>
                </div>
                <div class="card-rating">
                  <v-icon name="hi-star" scale="0.6" />
                  <span>5.0</span>
                  <small>New</small>
                </div>
              </div>

              <div class="card-badges">
                <span class="badge blue">{{ profileConfig.years_experience || '?' }} Yrs Exp</span>
                <span class="badge gray">{{ languageNames || 'Languages' }}</span>
              </div>

              <p class="card-bio">
                {{ truncatedBio || 'Your professional bio will appear here...' }}
              </p>

              <div class="card-tags">
                <span v-for="sub in selectedSubSpecialties.slice(0, 2)" :key="sub.id" class="card-tag">
                  {{ sub.name }}
                </span>
              </div>

              <div class="card-actions">
                <button class="book-btn">Book Video Consult</button>
                <button class="chat-btn">
                  <v-icon name="hi-chat" scale="0.9" />
                </button>
              </div>
            </div>

            <!-- Card Footer -->
            <div class="card-footer">
              <div class="verified-badge">
                <v-icon name="hi-shield-check" scale="0.7" />
                <span>Verified Specialist</span>
              </div>
            </div>
          </div>

          <!-- Validation Toast -->
          <div class="validation-toast" :class="{ good: profileCompleteness >= 80 }">
            <div class="toast-icon">
              <v-icon name="fa-check" scale="0.6" />
            </div>
            <div>
              <strong>{{ profileCompleteness >= 80 ? 'Looking Good!' : 'Keep Going!' }}</strong>
              <span>Profile completeness: {{ profileCompleteness }}%</span>
            </div>
          </div>
        </div>
      </aside>
    </main>

    <!-- Sticky Footer Action Bar -->
    <div class="sticky-footer">
      <div class="sticky-footer-inner">
        <div class="footer-top-row">
          <button class="draft-btn" @click="saveDraft" :disabled="isSaving" v-if="!isOnboardingComplete">
            {{ isSaving ? 'Saving...' : 'Save Draft' }}
          </button>
          <span class="next-hint-mobile" v-if="!isOnboardingComplete">Next: Availability Setup</span>
        </div>
        <div class="footer-bottom-row">
          <span class="next-hint-desktop" v-if="!isOnboardingComplete">Next: Availability Setup</span>
          <button class="continue-btn" @click="saveAndContinue" :disabled="isSaving">
            <v-icon v-if="isSaving" name="hi-refresh" scale="0.8" class="spin" />
            <template v-else-if="isOnboardingComplete">
              <v-icon name="hi-check" scale="0.8" />
              Save Changes
            </template>
            <template v-else>
              Save & Continue
              <v-icon name="hi-arrow-right" scale="0.8" />
            </template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, inject } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useOnboardingState } from './composables/useOnboardingState';

const store = useStore();
const router = useRouter();
const $http = inject('$http');
const {
  profileConfig,
  quickBio,
  completeStep,
  goToStep,
  saveProgress,
  progressPercent,
  stepCompletion,
} = useOnboardingState();

// Check if onboarding is already complete (editing mode vs setup mode)
const isOnboardingComplete = computed(() => {
  return progressPercent.value >= 100 || stepCompletion.review;
});

const fileInput = ref(null);
const activeTab = ref('bio');
const languageSearch = ref('');
const expandedSections = ref([]);

// Loading states
const isLoaded = ref(false);
const loadingLanguages = ref(false);
const loadingSpecializations = ref(false);

const tabs = [
  { id: 'bio', label: 'Bio & Details' },
  { id: 'languages', label: 'Languages' },
  { id: 'specializations', label: 'Specializations' },
  { id: 'location', label: 'Practice Location' },
];

const userProfile = computed(() => store.getters['userprofile']);

// Nigerian states for location dropdown
const nigerianStates = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara',
];

// Data from API
const allLanguages = ref([]);
const suggestedLanguages = ref([]);
const categories = ref([]); // Primary specialties
const availableSubSpecialties = ref([]); // Sub-specialties based on primary selection

// AI suggestion (can be computed based on bio analysis later)
const aiSuggestion = ref(null);

// Initialize on mount
onMounted(async () => {
  await loadExistingData();
  isLoaded.value = true;
});

// Load existing data from user profile and quick bio
const loadExistingData = async () => {
  const profile = userProfile.value?.profile;
  const practice = userProfile.value?.professional_practice;
  const existingCategories = userProfile.value?.specialist_categories;
  const existingLanguages = userProfile.value?.languages;

  // Load from QuickBio first (takes precedence for this session)
  if (quickBio.full_name && !profileConfig.display_name) {
    profileConfig.display_name = quickBio.full_name;
  }
  if (quickBio.bio && !profileConfig.professional_bio) {
    profileConfig.professional_bio = quickBio.bio;
  }
  if (quickBio.profile_image_preview && !profileConfig.profile_image_preview) {
    profileConfig.profile_image_preview = quickBio.profile_image_preview;
  }

  // Load from user profile (database)
  if (profile) {
    // Display name from first_name + last_name
    if (!profileConfig.display_name && (profile.first_name || profile.last_name)) {
      const title = practice?.category === 'Medical Doctor' ? 'Dr. ' : '';
      profileConfig.display_name = `${title}${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }

    // Profile photo
    if (profile.profile_photo && !profileConfig.profile_image_preview) {
      profileConfig.profile_image_preview = profile.profile_photo;
    }
  }

  if (practice) {
    // Years of experience
    if (practice.years_of_practice && !profileConfig.years_experience) {
      profileConfig.years_experience = parseInt(practice.years_of_practice) || null;
    }

    // Bio from area_of_specialty if not set
    if (practice.area_of_specialty && !profileConfig.professional_bio) {
      profileConfig.professional_bio = practice.area_of_specialty;
    }
  }

  // Load location data from profile.contact
  if (profile?.contact) {
    const contact = profile.contact;
    if (contact.phone?.country_code && !profileConfig.phone_country_code) {
      profileConfig.phone_country_code = contact.phone.country_code;
    }
    if (contact.phone?.number && !profileConfig.phone_number) {
      profileConfig.phone_number = contact.phone.number;
    }
    if (contact.country && !profileConfig.country) {
      profileConfig.country = contact.country;
    }
    if (contact.state && !profileConfig.state) {
      profileConfig.state = contact.state;
    }
    if (contact.city && !profileConfig.city) {
      profileConfig.city = contact.city;
    }
    if (contact.address1 && !profileConfig.address) {
      profileConfig.address = contact.address1;
    }
    if (contact.practice_type && !profileConfig.practice_type) {
      profileConfig.practice_type = contact.practice_type;
    }
    if (contact.is_diaspora !== undefined) {
      profileConfig.is_diaspora = contact.is_diaspora;
    } else if (contact.country) {
      // Auto-determine diaspora status if not set
      profileConfig.is_diaspora = contact.country.toLowerCase() !== 'nigeria';
    }
  }

  // Fetch languages from API
  await fetchLanguages();

  // Load existing languages from user profile
  if (existingLanguages && existingLanguages.length > 0) {
    profileConfig.languages = existingLanguages.map(lang =>
      typeof lang === 'object' ? lang._id : lang
    );
  }

  // Fetch specializations based on professional type
  const professionalType = quickBio.professional_type || practice?.category;
  if (professionalType) {
    await fetchSpecializations(professionalType);
  }

  // Load existing specialist categories
  if (existingCategories && existingCategories.length > 0) {
    const categoryIds = existingCategories.map(cat =>
      typeof cat === 'object' ? cat._id : cat
    );

    // Set primary specialty (first one)
    if (!profileConfig.primary_specialty && categoryIds.length > 0) {
      profileConfig.primary_specialty = categoryIds[0];
    }

    // Set sub-specialties (rest of them)
    if (profileConfig.sub_specialties.length === 0 && categoryIds.length > 1) {
      profileConfig.sub_specialties = categoryIds.slice(1);
    }
  }
};

// Fetch languages from API
const fetchLanguages = async () => {
  loadingLanguages.value = true;
  try {
    const response = await $http.$_getLanguages();
    let languages = [];

    if (response?.data?.data) {
      languages = response.data.data;
    } else if (response?.data) {
      languages = Array.isArray(response.data) ? response.data : [];
    }

    allLanguages.value = languages;

    // Set suggested languages (popular ones or first 6)
    const popular = languages.filter(l => l.is_popular);
    suggestedLanguages.value = popular.length > 0 ? popular.slice(0, 6) : languages.slice(0, 6);
  } catch (error) {
    console.error('Failed to fetch languages:', error);
    // Fallback to common languages
    suggestedLanguages.value = [
      { _id: 'en', name: 'English' },
      { _id: 'yo', name: 'Yoruba' },
      { _id: 'ha', name: 'Hausa' },
      { _id: 'ig', name: 'Igbo' },
      { _id: 'sw', name: 'Swahili' },
      { _id: 'fr', name: 'French' },
    ];
    allLanguages.value = suggestedLanguages.value;
  } finally {
    loadingLanguages.value = false;
  }
};

// Fetch specializations based on professional type
const fetchSpecializations = async (professionalType) => {
  if (!professionalType) {
    categories.value = [];
    availableSubSpecialties.value = [];
    return;
  }

  loadingSpecializations.value = true;
  try {
    // Map professional types to API values
    const categoryMap = {
      'Medical Doctor': 'Medical Doctor',
      'Therapist': 'Therapist',
      'Dietitian': 'Specialist',
      'Care Giver': 'Specialist',
      'Pharmacist': 'Pharmacist',
      'Lab Technician': 'Specialist',
    };

    const apiCategory = categoryMap[professionalType] || 'Specialist';
    const response = await $http.$_getSpecialistCategories({ professional_category: apiCategory });

    let fetchedCategories = [];
    if (response?.data?.data?.all) {
      fetchedCategories = response.data.data.all;
    } else if (response?.data?.all) {
      fetchedCategories = response.data.all;
    } else if (response?.all) {
      fetchedCategories = response.all;
    }

    categories.value = fetchedCategories;

    // Filter existing selections to valid ones
    if (profileConfig.primary_specialty) {
      const validIds = fetchedCategories.map(c => c._id);
      if (!validIds.includes(profileConfig.primary_specialty)) {
        profileConfig.primary_specialty = '';
      }
    }

    if (profileConfig.sub_specialties.length > 0) {
      const validIds = fetchedCategories.map(c => c._id);
      profileConfig.sub_specialties = profileConfig.sub_specialties.filter(id =>
        validIds.includes(id)
      );
    }

    // Expand first category by default
    if (fetchedCategories.length > 0 && expandedSections.value.length === 0) {
      expandedSections.value = [fetchedCategories[0]._id];
    }
  } catch (error) {
    console.error('Failed to fetch specializations:', error);
    categories.value = [];
  } finally {
    loadingSpecializations.value = false;
  }
};

// Watch for primary specialty changes to update sub-specialties display
watch(() => profileConfig.primary_specialty, (newVal) => {
  if (newVal) {
    // When primary specialty changes, expand that section
    if (!expandedSections.value.includes(newVal)) {
      expandedSections.value = [newVal];
    }
  }
});

// Computed
const selectedLanguages = computed(() => {
  return allLanguages.value.filter(l =>
    profileConfig.languages.includes(l._id)
  );
});

const languageNames = computed(() => {
  return selectedLanguages.value.map(l => l.name).join(', ') || '';
});

const primarySpecialtyName = computed(() => {
  const cat = categories.value.find(c => c._id === profileConfig.primary_specialty);
  return cat?.name || '';
});

const selectedSubSpecialties = computed(() => {
  return categories.value.filter(cat =>
    profileConfig.sub_specialties.includes(cat._id)
  );
});

// Categories for tree display (group by parent or show flat list)
const categoriesWithSubs = computed(() => {
  // For now, show all categories as sub-specialty options
  // In the future, this could be grouped by parent category if API supports it
  return categories.value;
});

const truncatedBio = computed(() => {
  const bio = profileConfig.professional_bio || '';
  return bio.length > 120 ? bio.substring(0, 120) + '...' : bio;
});

const profileCompleteness = computed(() => {
  let score = 0;
  if (profileConfig.display_name) score += 20;
  if (profileConfig.years_experience) score += 15;
  if (profileConfig.professional_bio?.length > 50) score += 25;
  if (profileConfig.languages.length > 0) score += 20;
  if (profileConfig.primary_specialty) score += 20;
  return Math.min(100, score);
});

// Filtered languages based on search
const filteredLanguages = computed(() => {
  if (!languageSearch.value) {
    return suggestedLanguages.value;
  }
  const search = languageSearch.value.toLowerCase();
  return allLanguages.value.filter(l =>
    l.name.toLowerCase().includes(search)
  );
});

// Methods
const scrollToSection = (sectionId) => {
  activeTab.value = sectionId;
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handlePhotoUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      profileConfig.profile_image_preview = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removePhoto = () => {
  profileConfig.profile_image_preview = '';
  if (fileInput.value) fileInput.value.value = '';
};

const isLanguageSelected = (langId) => {
  return profileConfig.languages.includes(langId);
};

const toggleLanguage = (lang) => {
  const langId = lang._id || lang.id;
  const index = profileConfig.languages.indexOf(langId);
  if (index === -1) {
    profileConfig.languages.push(langId);
  } else {
    profileConfig.languages.splice(index, 1);
  }
};

const removeLanguage = (langId) => {
  const index = profileConfig.languages.indexOf(langId);
  if (index !== -1) {
    profileConfig.languages.splice(index, 1);
  }
};

const toggleTreeSection = (catId) => {
  const index = expandedSections.value.indexOf(catId);
  if (index === -1) {
    expandedSections.value.push(catId);
  } else {
    expandedSections.value.splice(index, 1);
  }
};

const toggleSubSpecialty = (catId) => {
  const index = profileConfig.sub_specialties.indexOf(catId);
  if (index === -1) {
    profileConfig.sub_specialties.push(catId);
  } else {
    profileConfig.sub_specialties.splice(index, 1);
  }
};

const addSpecialty = (name) => {
  const category = categories.value.find(c => c.name === name);
  if (category && !profileConfig.sub_specialties.includes(category._id)) {
    profileConfig.sub_specialties.push(category._id);
  }
};

const enhanceBio = () => {
  console.log('AI enhance bio');
};

// Auto-set diaspora status when country changes
const onCountryChange = () => {
  profileConfig.is_diaspora = profileConfig.country.toLowerCase() !== 'nigeria';
  // Reset state when country changes
  if (profileConfig.country !== 'Nigeria') {
    profileConfig.state = '';
  }
};

const isSaving = ref(false);

const saveDraft = async () => {
  saveProgress();
  await saveToBackend();
};

const saveToBackend = async () => {
  isSaving.value = true;
  try {
    const userId = userProfile.value?._id;
    if (!userId) return;

    // Build the update payload
    const payload = {
      profile: {
        contact: {
          phone: {
            country_code: profileConfig.phone_country_code,
            number: profileConfig.phone_number,
          },
          address1: profileConfig.address,
          city: profileConfig.city,
          state: profileConfig.state,
          country: profileConfig.country,
          is_diaspora: profileConfig.is_diaspora,
          practice_type: profileConfig.practice_type,
        },
        professional_bio: profileConfig.professional_bio,
      },
      professional_practice: {
        years_of_practice: profileConfig.years_experience?.toString() || '',
      },
      languages: profileConfig.languages,
      specialist_categories: [
        profileConfig.primary_specialty,
        ...profileConfig.sub_specialties,
      ].filter(Boolean),
    };

    await $http.$_updateCurrentUser({ userId, payload });
    console.log('Profile saved successfully');
  } catch (error) {
    console.error('Failed to save profile:', error);
  } finally {
    isSaving.value = false;
  }
};

const saveAndContinue = async () => {
  saveProgress();
  await saveToBackend();
  completeStep('profileConfig');

  // If onboarding is complete, just save and stay. Otherwise, continue to next step.
  if (!isOnboardingComplete.value) {
    goToStep(5);
  }
};
</script>

<style scoped lang="scss">
.profile-config-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  width: 100%;
  align-items: center;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  width: 100%;
  max-width: 1400px;
}

.form-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 2.5rem;
  scroll-behavior: smooth;
}

.form-container {
  max-width: 720px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1A365D;
  font-family: 'Poppins', system-ui, sans-serif;
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #64748B;
  margin: 0;
}

.tabs-header {
  display: flex;
  gap: 2rem;
  border-bottom: 1px solid #E2E8F0;
  margin-bottom: 2rem;
  background: transparent;
  padding-top: 0.5rem;
}

.tab-btn {
  padding-bottom: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #1A365D;
  }

  &.active {
    color: #0288D1;
    font-weight: 700;
    border-bottom-color: #0288D1;
  }
}

.sections-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  border: 1px solid #E2E8F0;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 1.5rem 0;

  svg {
    color: #4FC3F7;
  }
}

.section-description {
  font-size: 0.875rem;
  color: #64748B;
  margin: -1rem 0 1rem 0;
}

.photo-upload-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.photo-upload {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: #F1F5F9;
  border: 2px dashed #CBD5E1;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.2s;

  &:hover {
    border-color: #4FC3F7;
  }
}

.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  color: white;
  transition: background 0.2s;

  span {
    font-size: 0.625rem;
    font-weight: 500;
    margin-top: 0.25rem;
  }
}

.photo-upload:hover .photo-overlay {
  background: rgba(0, 0, 0, 0.3);
}

.photo-badge {
  position: absolute;
  bottom: -4px;
  right: -4px;
  width: 24px;
  height: 24px;
  background: #FF9800;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.photo-info {
  h3 {
    font-size: 0.875rem;
    font-weight: 700;
    color: #334155;
    margin: 0;
  }

  p {
    font-size: 0.75rem;
    color: #64748B;
    margin: 0.25rem 0 0.5rem 0;
  }
}

.photo-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.link-btn {
  background: none;
  border: none;
  font-size: 0.75rem;
  font-weight: 700;
  color: #4FC3F7;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 0.375rem;
}

.required {
  color: #EF4444;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.375rem;
}

.input-wrapper {
  position: relative;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: #334155;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4FC3F7;
    box-shadow: 0 0 0 4px rgba(79, 195, 247, 0.1);
  }
}

.form-input.valid {
  padding-right: 2.5rem;
}

.input-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);

  &.valid {
    color: #4CAF50;
  }
}

.textarea-wrapper {
  position: relative;
}

.form-textarea {
  resize: none;
}

.char-count {
  position: absolute;
  bottom: 0.5rem;
  right: 0.75rem;
  font-size: 0.625rem;
  color: #94A3B8;
}

.form-hint {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.625rem;
  color: #94A3B8;
  margin-top: 0.5rem;
}

.ai-enhance-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: none;
  border: none;
  font-size: 0.625rem;
  font-weight: 700;
  color: #FF9800;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: background 0.2s;

  &:hover {
    background: #FFF3E0;
  }
}

.select-wrapper {
  position: relative;
}

.form-select {
  appearance: none;
  padding-right: 2.5rem;
}

.select-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  pointer-events: none;
}

.search-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
}

.search-input {
  width: 100%;
  padding: 0.625rem 0.75rem 0.625rem 2.5rem;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #4FC3F7;
  }
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.language-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #E1F5FE;
  color: #0288D1;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 9999px;
  border: 1px solid rgba(79, 195, 247, 0.2);

  button {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
    display: flex;

    &:hover {
      color: #1A365D;
    }
  }
}

.suggestions-section {
  border-top: 1px solid #F1F5F9;
  padding-top: 1rem;
}

.suggestions-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  margin: 0 0 0.75rem 0;
}

.suggestions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.suggestion-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: none;
  border: 1px solid #E2E8F0;
  border-radius: 9999px;
  font-size: 0.75rem;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #4FC3F7;
    color: #4FC3F7;
  }

  &.selected {
    background: #E1F5FE;
    border-color: #4FC3F7;
    color: #0288D1;
  }
}

.ai-suggestion-banner {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: linear-gradient(135deg, #E1F5FE 0%, white 100%);
  border: 1px solid rgba(79, 195, 247, 0.2);
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.ai-icon {
  width: 32px;
  height: 32px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4FC3F7;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.ai-content {
  h4 {
    font-size: 0.875rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0;
  }

  p {
    font-size: 0.75rem;
    color: #64748B;
    margin: 0.25rem 0 0.5rem 0;
  }
}

.ai-suggestions {
  display: flex;
  gap: 0.5rem;
}

.ai-suggestion-btn {
  padding: 0.375rem 0.75rem;
  background: white;
  border: 1px solid rgba(79, 195, 247, 0.3);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0288D1;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:hover {
    background: #4FC3F7;
    color: white;
  }
}

.tree-container {
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  overflow: hidden;
}

.tree-section {
  border-bottom: 1px solid #F1F5F9;

  &:last-child {
    border-bottom: none;
  }
}

.tree-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #F8FAFC;
  font-size: 0.875rem;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #F1F5F9;
  }

  svg {
    color: #94A3B8;
  }
}

.tree-items {
  padding: 0.75rem 0.75rem 0.75rem 2rem;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tree-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;

  input {
    width: 16px;
    height: 16px;
    accent-color: #4FC3F7;
  }

  span {
    font-size: 0.875rem;
    color: #64748B;
  }

  &:hover span {
    color: #1A365D;
  }
}

.tooltip-trigger {
  position: relative;
  color: #94A3B8;
  cursor: help;
}

.tooltip {
  position: absolute;
  right: 0;
  bottom: 100%;
  margin-bottom: 0.5rem;
  width: 200px;
  padding: 0.5rem;
  background: #1E293B;
  color: white;
  font-size: 0.75rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s;
  z-index: 50;
}

.tooltip-trigger:hover .tooltip {
  opacity: 1;
  visibility: visible;
}

.footer-spacer {
  height: 5rem;
}

/* Preview Column */
.preview-column {
  width: 400px;
  background: white;
  border-left: 1px solid #E2E8F0;
  display: none;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: -10px 0 30px -10px rgba(0, 0, 0, 0.03);
}

@media (min-width: 1280px) {
  .preview-column {
    display: flex;
  }
}

.preview-header {
  padding: 1.5rem;
  border-bottom: 1px solid #F1F5F9;
  background: rgba(248, 250, 252, 0.5);

  h3 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0;

    svg {
      color: #94A3B8;
    }
  }

  p {
    font-size: 0.75rem;
    color: #64748B;
    margin: 0.25rem 0 0 0;
  }
}

.preview-container {
  flex: 1;
  padding: 2rem;
  background: rgba(248, 250, 252, 0.5);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.profile-card-preview {
  width: 100%;
  max-width: 320px;
  background: white;
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  border: 1px solid #F1F5F9;
  transition: transform 0.3s;

  &:hover {
    transform: scale(1.02);
  }
}

.card-header-bg {
  height: 96px;
  background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
  position: relative;
  border-radius: 1.5rem 1.5rem 0 0;
  overflow: hidden;
}

.availability-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 700;
  color: white;

  .dot {
    width: 6px;
    height: 6px;
    background: #4ADE80;
    border-radius: 50%;
  }
}

.card-avatar-wrapper {
  padding: 0 1.5rem;
  position: relative;
  z-index: 10;
  margin-top: -40px;
}

.card-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #F1F5F9;
  border: 4px solid white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94A3B8;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.card-content {
  padding: 0.75rem 1.5rem 1.5rem;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.card-name {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1E293B;
  margin: 0;
}

.card-specialty {
  font-size: 0.75rem;
  font-weight: 700;
  color: #4FC3F7;
  margin: 0;
}

.card-rating {
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  svg {
    color: #F59E0B;
  }

  span {
    font-size: 0.75rem;
    font-weight: 700;
    color: #F59E0B;
  }

  small {
    font-size: 0.625rem;
    color: #94A3B8;
  }
}

.card-badges {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.badge {
  font-size: 0.625rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;

  &.blue {
    background: #EFF6FF;
    color: #2563EB;
    border: 1px solid #DBEAFE;
  }

  &.gray {
    background: #F1F5F9;
    color: #64748B;
    border: 1px solid #E2E8F0;
  }
}

.card-bio {
  font-size: 0.75rem;
  color: #64748B;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 1.5rem;
}

.card-tag {
  font-size: 0.625rem;
  padding: 0.25rem 0.5rem;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 9999px;
  color: #64748B;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
}

.book-btn {
  flex: 1;
  padding: 0.625rem;
  background: #4FC3F7;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);
}

.chat-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 0.75rem;
  color: #64748B;
}

.card-footer {
  padding: 0.75rem 1.5rem;
  background: #F8FAFC;
  border-top: 1px solid #F1F5F9;
  border-radius: 0 0 1.5rem 1.5rem;
}

.verified-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.625rem;
  font-weight: 500;
  color: #64748B;

  svg {
    color: #4CAF50;
  }
}

.validation-toast {
  position: absolute;
  bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  animation: float 6s ease-in-out infinite;

  &.good {
    border-color: #D1FAE5;
  }
}

.toast-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FEF3C7;
  color: #F59E0B;

  .validation-toast.good & {
    background: #D1FAE5;
    color: #4CAF50;
  }
}

.validation-toast strong {
  display: block;
  font-size: 0.75rem;
  color: #1E293B;
}

.validation-toast span {
  display: block;
  font-size: 0.625rem;
  color: #64748B;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* Sticky Footer */
.sticky-footer {
  position: fixed;
  bottom: 0;
  left: 260px;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 2.5rem;
  background: white;
  border-top: 1px solid #E2E8F0;
  flex-shrink: 0;
  z-index: 50;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

.sticky-footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1400px;
}

.footer-top-row {
  display: none;
}

.footer-bottom-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  justify-content: space-between;
}

.draft-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748B;
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;

  &:hover {
    background: #F8FAFC;
    color: #1E293B;
  }
}

.next-hint-desktop {
  font-size: 0.75rem;
  color: #94A3B8;
  display: none;

  @media (min-width: 768px) {
    display: block;
  }
}

.next-hint-mobile {
  display: none;
}

.continue-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: #FF9800;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  transition: all 0.2s;

  &:hover {
    background: #F57C00;
    box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
  }
}

/* Loading and empty states */
.loading-inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #64748B;
  font-size: 0.875rem;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  text-align: center;
  color: #94A3B8;

  svg {
    color: #CBD5E1;
  }

  p {
    font-size: 0.875rem;
    margin: 0;
    max-width: 300px;
  }
}

.label-hint {
  font-weight: 400;
  color: #94A3B8;
  font-size: 0.75rem;
}

.field-hint {
  font-size: 0.75rem;
  color: #64748B;
  margin-top: 0.5rem;
}

.tree-items.flat {
  padding: 0.75rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
}

.tree-item.is-primary {
  opacity: 0.6;

  span {
    color: #94A3B8;
  }
}

.primary-badge {
  font-size: 0.625rem;
  font-weight: 700;
  color: #4FC3F7;
  background: #E1F5FE;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  margin-left: auto;
}

.hidden {
  display: none;
}

/* Practice Location styles */
.phone-input-row {
  display: flex;
  gap: 0.5rem;
}

.country-code-select {
  position: relative;
  width: 140px;
  flex-shrink: 0;
}

.country-code-select .form-select {
  padding-right: 2rem;
}

.phone-input {
  flex: 1;
}

.diaspora-status-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 0.75rem;
  margin-top: 1rem;
}

.diaspora-status-card.diaspora {
  background: #EFF6FF;
  border-color: #BFDBFE;
}

.diaspora-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #22C55E;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}

.diaspora-status-card.diaspora .diaspora-icon {
  color: #3B82F6;
}

.diaspora-content {
  flex: 1;
}

.diaspora-content h4 {
  font-size: 0.875rem;
  font-weight: 700;
  color: #166534;
  margin: 0;
}

.diaspora-status-card.diaspora .diaspora-content h4 {
  color: #1D4ED8;
}

.diaspora-content p {
  font-size: 0.75rem;
  color: #64748B;
  margin: 0.25rem 0 0 0;
}

.diaspora-toggle {
  flex-shrink: 0;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: #CBD5E1;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #3B82F6;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

/* Mobile Preview Section (hidden on desktop) */
.mobile-preview-section {
  display: block;
  background: white;
  border-radius: 1rem;
  padding: 1.25rem;
  border: 1px solid #E2E8F0;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.05);

  @media (min-width: 1280px) {
    display: none;
  }
}

.mobile-preview-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1A365D;
  margin: 0 0 1rem 0;

  svg {
    color: #94A3B8;
  }
}

.mobile-preview-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  border: 1px solid #F1F5F9;
  overflow: hidden;

  .card-header-bg {
    height: 80px;
  }

  .card-avatar-wrapper {
    padding: 0 1rem;
  }

  .card-avatar {
    width: 64px;
    height: 64px;
    margin-top: -32px;
  }

  .card-content {
    padding: 0.5rem 1rem 1rem;
  }

  .card-name {
    font-size: 1rem;
  }

  .card-specialty {
    font-size: 0.625rem;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .form-scroll-area {
    padding: 1rem;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .page-title {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
  }

  .page-subtitle {
    font-size: 0.75rem;
  }

  .tabs-header {
    gap: 1rem;
    margin-bottom: 1.5rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .tab-btn {
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .sections-container {
    gap: 1rem;
  }

  .form-section {
    padding: 1.25rem;
    border-radius: 1rem;
  }

  .section-title {
    font-size: 1rem;
    margin-bottom: 1.25rem;
  }

  .photo-upload-row {
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .photo-upload {
    width: 80px;
    height: 80px;
  }

  .photo-info {
    h3 {
      font-size: 0.75rem;
    }

    p {
      font-size: 0.625rem;
    }
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-label {
    font-size: 0.625rem;
  }

  .form-input,
  .form-select,
  .form-textarea {
    font-size: 0.875rem;
    padding: 0.625rem 0.75rem;
  }

  .ai-enhance-btn {
    font-size: 0.5625rem;
  }

  .form-hint {
    font-size: 0.5625rem;
  }

  .ai-suggestion-banner {
    padding: 0.75rem;
    gap: 0.625rem;
  }

  .ai-icon {
    width: 28px;
    height: 28px;
  }

  .ai-content {
    h4 {
      font-size: 0.75rem;
    }

    p {
      font-size: 0.625rem;
    }
  }

  .ai-suggestion-btn {
    font-size: 0.625rem;
    padding: 0.375rem 0.625rem;
  }

  .footer-spacer {
    height: 8rem;
  }

  /* Mobile Footer */
  .sticky-footer {
    left: 0;
    padding: 0.75rem 1rem;
  }

  .sticky-footer-inner {
    flex-direction: column;
    gap: 0.5rem;
  }

  .footer-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-bottom: 0.25rem;
  }

  .footer-bottom-row {
    flex-direction: column;
    gap: 0;
    width: 100%;
  }

  .draft-btn {
    font-size: 0.75rem;
    font-weight: 500;
    padding: 0;
  }

  .next-hint-desktop {
    display: none;
  }

  .next-hint-mobile {
    display: block;
    font-size: 0.625rem;
    color: #94A3B8;
  }

  .continue-btn {
    width: 100%;
    justify-content: center;
    padding: 0.875rem 1.5rem;
    font-size: 0.875rem;
    border-radius: 0.75rem;
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
  }
}

/* Very small mobile */
@media (max-width: 375px) {
  .form-scroll-area {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.125rem;
  }

  .tabs-header {
    gap: 0.75rem;
  }

  .photo-upload {
    width: 72px;
    height: 72px;
  }
}
</style>
