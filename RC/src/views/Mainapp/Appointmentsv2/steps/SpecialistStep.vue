<template>
  <div class="specialist-step">
    <!-- Book Again Mode - Show only the pre-selected specialist -->
    <template v-if="isBookAgainMode && preSelectedSpecialist">
      <div class="step-hero book-again-hero">
        <div class="hero-icon-wrapper">
          <v-icon name="hi-refresh" scale="1.8" class="hero-icon" />
        </div>
        <div class="hero-text">
          <h2 class="hero-title">Book Again</h2>
          <p class="hero-desc">You're rebooking with your previous specialist. Confirm to continue.</p>
        </div>
      </div>

      <div class="book-again-card">
        <div class="book-again-badge">
          <v-icon name="hi-clock" scale="0.8" />
          Previous Specialist
        </div>
        <doctor-card
          :fullName="preSelectedSpecialist.full_name"
          :firstName="preSelectedSpecialist.profile?.first_name"
          :lastName="preSelectedSpecialist.profile?.last_name"
          :profileImage="preSelectedSpecialist.profile?.profile_photo || preSelectedSpecialist.profile?.profile_image"
          :specialty="preSelectedSpecialist.professional_practice?.area_of_specialty || booking.category.specialist_category"
          :yearsExperience="preSelectedSpecialist.years_experience"
          :rating="preSelectedSpecialist.average_rating"
          :reviewCount="preSelectedSpecialist.review_count || 0"
          :price="preSelectedSpecialist.consultation_fee || preSelectedSpecialist.price || 10000"
          :duration="30"
          :country="preSelectedSpecialist.country"
          :countryFlag="getCountryFlag(preSelectedSpecialist.country)"
          :isDiaspora="preSelectedSpecialist.is_diaspora"
          :isSelected="true"
          @select="selectSpecialist(preSelectedSpecialist)"
        />
        <p class="book-again-note">
          <v-icon name="hi-information-circle" scale="0.8" />
          Want a different specialist?
          <button class="link-btn" @click="switchToNormalMode">Browse all specialists</button>
        </p>
      </div>
    </template>

    <!-- Normal Mode - Show all specialists -->
    <template v-else>
      <!-- Hero Banner -->
      <div class="step-hero">
        <div class="hero-icon-wrapper">
          <v-icon name="hi-user" scale="1.8" class="hero-icon" />
        </div>
        <div class="hero-text">
          <h2 class="hero-title">Choose Your Specialist</h2>
          <p class="hero-desc">Select a healthcare provider for your appointment. Use filters to find the perfect match.</p>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
      <div class="filter-group">
        <!-- Gender Filter -->
        <div class="filter-dropdown">
          <label class="filter-label">Gender</label>
          <select v-model="filters.gender" class="filter-select">
            <option value="">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <!-- Language Filter -->
        <div class="filter-dropdown">
          <label class="filter-label">Language</label>
          <select v-model="filters.language" class="filter-select" :disabled="loadingLanguages">
            <option value="">{{ loadingLanguages ? 'Loading...' : 'Any' }}</option>
            <option v-for="lang in languages" :key="lang.code || lang.name" :value="lang.name">
              {{ lang.name }}
            </option>
          </select>
        </div>

        <!-- Price Range Filter -->
        <div class="filter-dropdown">
          <label class="filter-label">Price Range</label>
          <select v-model="filters.priceRange" class="filter-select">
            <option value="">Any</option>
            <option value="0-10000">Under NGN 10,000</option>
            <option value="10000-20000">NGN 10,000 - 20,000</option>
            <option value="20000-50000">NGN 20,000 - 50,000</option>
            <option value="50000+">Above NGN 50,000</option>
          </select>
        </div>
      </div>

      <!-- Diaspora Toggle -->
      <div class="diaspora-toggle">
        <label class="toggle-label">
          <input
            type="checkbox"
            v-model="filters.diasporaOnly"
            class="toggle-input"
          />
          <span class="toggle-switch"></span>
          <span class="toggle-text">
            <v-icon name="hi-globe" scale="0.8" />
            Diaspora Specialists
          </span>
        </label>
      </div>
    </div>

    <!-- Results Info -->
    <div class="results-info">
      <span class="results-count">{{ filteredSpecialists.length }} specialists available</span>
      <span class="results-for" v-if="booking.schedule.date">
        for {{ formattedDate }} at {{ formattedTime }}
      </span>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <loader :useOverlay="false" style="position: relative" />
      <span>Finding available specialists...</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredSpecialists.length === 0" class="empty-state">
      <v-icon name="hi-user-group" scale="2" />
      <h3>No Specialists Found</h3>
      <p>Try adjusting your filters or selecting a different time</p>
      <button class="reset-filters-btn" @click="resetFilters">
        Reset Filters
      </button>
    </div>

    <!-- Specialists Grid -->
    <div v-else class="specialists-grid">
      <doctor-card
        v-for="doc in filteredSpecialists"
        :key="doc._id || doc.id"
        :fullName="doc.full_name"
        :firstName="doc.profile?.first_name"
        :lastName="doc.profile?.last_name"
        :profileImage="doc.profile?.profile_photo || doc.profile?.profile_image"
        :specialty="doc.professional_practice?.area_of_specialty || doc.specialty || booking.category.specialist_category"
        :yearsExperience="doc.years_experience"
        :rating="doc.average_rating"
        :reviewCount="doc.review_count || 0"
        :price="doc.consultation_fee || doc.price || 10000"
        :duration="30"
        :country="doc.country"
        :countryFlag="getCountryFlag(doc.country)"
        :isDiaspora="doc.is_diaspora"
        :isAiMatch="doc.is_ai_match"
        :isSelected="booking.specialist.id === (doc._id || doc.id)"
        @select="selectSpecialist(doc)"
      />
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, inject, onMounted, watch } from 'vue';
import { format, parseISO } from 'date-fns';
import DoctorCard from '../components/DoctorCard.vue';
import Loader from '@/components/Loader/main-loader.vue';
import apiFactory from '@/services/apiFactory';

const $http = inject('$_HTTP');
const booking = inject('bookingStateV2');

const specialists = ref([]);
const isLoading = ref(false);
const languages = ref([]);
const loadingLanguages = ref(false);

// Book Again mode state
const preSelectedSpecialist = ref(null);
const forceNormalMode = ref(false);

const isBookAgainMode = computed(() => {
  return !!booking.preSelectedSpecialistId && !forceNormalMode.value && preSelectedSpecialist.value;
});

const switchToNormalMode = () => {
  forceNormalMode.value = true;
};

const filters = reactive({
  gender: '',
  language: '',
  priceRange: '',
  diasporaOnly: false,
});

// Fetch languages from API
const fetchLanguages = async () => {
  loadingLanguages.value = true;
  try {
    const response = await apiFactory.$_getLanguages();
    if (response.data && Array.isArray(response.data)) {
      languages.value = response.data;
    }
  } catch (error) {
    console.error('Failed to fetch languages:', error);
    // Fallback to default languages if API fails
    languages.value = [
      { name: 'English', code: 'en' },
      { name: 'French', code: 'fr' },
      { name: 'Yoruba', code: 'yo' },
      { name: 'Hausa', code: 'ha' },
      { name: 'Igbo', code: 'ig' },
    ];
  } finally {
    loadingLanguages.value = false;
  }
};

const formattedDate = computed(() => {
  if (!booking.schedule.date) return '';
  try {
    const date = typeof booking.schedule.date === 'string'
      ? parseISO(booking.schedule.date)
      : booking.schedule.date;
    return format(date, 'MMM d, yyyy');
  } catch {
    return booking.schedule.date;
  }
});

const formattedTime = computed(() => {
  const time = booking.schedule.time;
  if (!time) return '';
  if (time.includes('AM') || time.includes('PM')) return time;
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
});

const filteredSpecialists = computed(() => {
  // Ensure specialists.value is an array before spreading
  const specialistsList = Array.isArray(specialists.value) ? specialists.value : [];
  let result = [...specialistsList];

  // Gender filter
  if (filters.gender) {
    result = result.filter(doc =>
      doc.profile?.gender?.toLowerCase() === filters.gender.toLowerCase()
    );
  }

  // Language filter
  if (filters.language) {
    result = result.filter(doc =>
      doc.languages?.includes(filters.language) ||
      doc.profile?.languages?.includes(filters.language)
    );
  }

  // Price range filter
  if (filters.priceRange) {
    const price = doc => doc.consultation_fee || doc.price || 10000;
    switch (filters.priceRange) {
      case '0-10000':
        result = result.filter(doc => price(doc) < 10000);
        break;
      case '10000-20000':
        result = result.filter(doc => price(doc) >= 10000 && price(doc) < 20000);
        break;
      case '20000-50000':
        result = result.filter(doc => price(doc) >= 20000 && price(doc) < 50000);
        break;
      case '50000+':
        result = result.filter(doc => price(doc) >= 50000);
        break;
    }
  }

  // Diaspora filter
  if (filters.diasporaOnly) {
    result = result.filter(doc => doc.is_diaspora);
  }

  // Sort: AI matches first, then by rating
  result.sort((a, b) => {
    if (a.is_ai_match && !b.is_ai_match) return -1;
    if (!a.is_ai_match && b.is_ai_match) return 1;
    return (b.average_rating || 0) - (a.average_rating || 0);
  });

  return result;
});

const getCountryFlag = (country) => {
  const countryFlags = {
    'Nigeria': 'https://flagcdn.com/w40/ng.png',
    'United Kingdom': 'https://flagcdn.com/w40/gb.png',
    'United States': 'https://flagcdn.com/w40/us.png',
    'Canada': 'https://flagcdn.com/w40/ca.png',
    'Ghana': 'https://flagcdn.com/w40/gh.png',
    'South Africa': 'https://flagcdn.com/w40/za.png',
  };
  return countryFlags[country] || '';
};

const selectSpecialist = (doc) => {
  booking.setSpecialist({
    id: doc._id || doc.id,
    full_name: doc.full_name,
    profile: doc.profile,
    average_rating: doc.average_rating,
    review_count: doc.review_count || 0,
    professional_practice: doc.professional_practice,
    price: doc.consultation_fee || doc.price,
    isDiaspora: doc.is_diaspora,
  });
};

const resetFilters = () => {
  filters.gender = '';
  filters.language = '';
  filters.priceRange = '';
  filters.diasporaOnly = false;
};

// Fetch a specific specialist by ID (for Book Again flow)
const fetchPreSelectedSpecialist = async (specialistId) => {
  try {
    const { data } = await $http.$_getOneUser(specialistId);
    const specialist = data?.result || data?.data || data;
    if (specialist) {
      // Ensure full_name is available
      if (!specialist.full_name && specialist.profile) {
        specialist.full_name = `${specialist.profile.first_name || ''} ${specialist.profile.last_name || ''}`.trim();
      }
      preSelectedSpecialist.value = specialist;
      // Auto-select this specialist
      selectSpecialist(specialist);
    }
  } catch (error) {
    console.error('Error fetching pre-selected specialist:', error);
    // If we can't fetch the specialist, fall back to normal mode
    forceNormalMode.value = true;
  }
};

const fetchSpecialists = async () => {
  isLoading.value = true;

  // Skip API call if required data is missing
  if (!booking.category.professional_category || !booking.schedule.date) {
    generateMockSpecialists();
    isLoading.value = false;
    return;
  }

  try {
    // Parse the date - handle both ISO format and toDateString() format like "Tue Jan 27 2026"
    const dateStr = booking.schedule.date;
    let dateObj;
    if (typeof dateStr === 'string') {
      dateObj = new Date(dateStr);
    } else {
      dateObj = dateStr;
    }
    const formattedDateStr = format(dateObj, 'yyyy-MM-dd');

    const payload = {
      professional_category: booking.category.professional_category,
      specialist_category: booking.category.specialist_category,
      time_zone: booking.schedule.timezone,
      availabilityDates: [{
        date: new Date(formattedDateStr),
        time: booking.schedule.time,
      }],
    };

    const { data } = await $http.$_getAvailableSpecialists(payload);
    // Backend returns { message, result } format - result may be object with date keys
    const result = data?.result || data?.data || data || [];
    // If result is an object (keyed by date), extract all specialists
    let allSpecialists = [];
    if (Array.isArray(result)) {
      allSpecialists = result;
    } else if (typeof result === 'object' && result !== null) {
      // Result is keyed by date like { "2026-01-27": [...specialists] }
      allSpecialists = Object.values(result).flat();
    }
    specialists.value = allSpecialists;

    // Mark first one as AI match if category was AI suggested
    if (booking.category.aiSuggested && specialists.value.length > 0) {
      specialists.value[0].is_ai_match = true;
    }
  } catch (error) {
    console.error('Error fetching specialists:', error);
    // Generate mock data for demo
    generateMockSpecialists();
  } finally {
    isLoading.value = false;
  }
};

const generateMockSpecialists = () => {
  specialists.value = [
    {
      _id: 'mock1',
      full_name: 'Dr. Adaeze Okonkwo',
      profile: { first_name: 'Adaeze', last_name: 'Okonkwo', gender: 'female' },
      professional_practice: booking.category.specialist_category,
      years_experience: 12,
      average_rating: 4.9,
      review_count: 156,
      consultation_fee: 15000,
      country: 'Nigeria',
      is_diaspora: false,
      is_ai_match: booking.category.aiSuggested,
      languages: ['English', 'Igbo'],
    },
    {
      _id: 'mock2',
      full_name: 'Dr. Chukwuemeka Eze',
      profile: { first_name: 'Chukwuemeka', last_name: 'Eze', gender: 'male' },
      professional_practice: booking.category.specialist_category,
      years_experience: 8,
      average_rating: 4.7,
      review_count: 89,
      consultation_fee: 12000,
      country: 'Nigeria',
      is_diaspora: false,
      languages: ['English', 'Igbo'],
    },
    {
      _id: 'mock3',
      full_name: 'Dr. Folake Adeyemi',
      profile: { first_name: 'Folake', last_name: 'Adeyemi', gender: 'female' },
      professional_practice: booking.category.specialist_category,
      years_experience: 15,
      average_rating: 4.8,
      review_count: 234,
      consultation_fee: 20000,
      country: 'United Kingdom',
      is_diaspora: true,
      languages: ['English', 'Yoruba'],
    },
    {
      _id: 'mock4',
      full_name: 'Dr. Ibrahim Musa',
      profile: { first_name: 'Ibrahim', last_name: 'Musa', gender: 'male' },
      professional_practice: booking.category.specialist_category,
      years_experience: 6,
      average_rating: 4.5,
      review_count: 45,
      consultation_fee: 10000,
      country: 'Nigeria',
      is_diaspora: false,
      languages: ['English', 'Hausa'],
    },
  ];
};

onMounted(async () => {
  fetchLanguages();

  // Check if this is a "Book Again" flow with a pre-selected specialist
  if (booking.preSelectedSpecialistId) {
    isLoading.value = true;
    await fetchPreSelectedSpecialist(booking.preSelectedSpecialistId);
    isLoading.value = false;
  }

  // Also fetch all specialists (needed if user switches to normal mode)
  if (booking.category.professional_category && booking.schedule.date) {
    await fetchSpecialists();
  } else {
    // Generate mock data if required data is missing
    generateMockSpecialists();
  }
});
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;

.specialist-step {
  padding: 20px 24px 40px;
  max-width: 1000px;
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
  margin-bottom: 24px;
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
}

.hero-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.5;
}

.filter-bar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.filter-group {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
  }
}

.filter-dropdown {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;

  @media (max-width: 600px) {
    min-width: 100%;
  }
}

.filter-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.filter-select {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #374151;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: $v2-sky;
  }
}

.diaspora-toggle {
  .toggle-label {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }

  .toggle-input {
    display: none;

    &:checked + .toggle-switch {
      background: $v2-sky;

      &::after {
        transform: translateX(18px);
      }
    }
  }

  .toggle-switch {
    position: relative;
    width: 42px;
    height: 24px;
    background: #d1d5db;
    border-radius: 12px;
    transition: background 0.2s ease;

    &::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
  }

  .toggle-text {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
  }
}

.results-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #6b7280;
}

.results-count {
  font-weight: 600;
  color: #1f2937;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;

  svg {
    color: #d1d5db;
    margin-bottom: 16px;
  }

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px;
  }

  p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
}

.loading-state span {
  margin-top: 16px;
  font-size: 14px;
  color: #6b7280;
}

.reset-filters-btn {
  margin-top: 20px;
  padding: 10px 20px;
  border: 2px solid $v2-sky;
  border-radius: 10px;
  background: white;
  font-size: 14px;
  font-weight: 600;
  color: $v2-sky-dark;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: $v2-sky-light;
  }
}

.specialists-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

// Book Again Mode Styles
.book-again-hero {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%) !important;
}

.book-again-card {
  max-width: 500px;
  margin: 0 auto;
  padding: 24px;
  background: white;
  border: 2px solid $v2-sky;
  border-radius: 18px;
  box-shadow: 0 8px 32px rgba(79, 195, 247, 0.15);
}

.book-again-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #FFF3E0;
  color: #F57C00;
  font-size: 12px;
  font-weight: 700;
  border-radius: 20px;
  margin-bottom: 16px;
}

.book-again-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  font-size: 13px;
  color: #6b7280;

  svg {
    color: #9ca3af;
  }
}

.link-btn {
  background: none;
  border: none;
  color: $v2-sky-dark;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;

  &:hover {
    color: $v2-sky;
  }
}
</style>
