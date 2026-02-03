<template>
  <Loader v-if="isFetching || isLoading" :useOverlay="false" style="z-index: 1" />
  <div v-else class="health-entry">
    <!-- Hero Section - Split Layout -->
    <section class="hero">
      <div class="hero__content">
        <div class="hero__badge">
          <div class="badge-pulse"></div>
          <v-icon name="hi-sparkles" />
          <span>Powered by AI</span>
        </div>
        <h1 class="hero__title">
          AI Health<br/>
          <span class="hero__title-accent">Checkup</span>
        </h1>
        <p class="hero__subtitle">
          Get instant health insights with our intelligent symptom checker trusted by thousands.
        </p>
        <div class="hero__stats">
          <div class="hero-stat">
            <span class="hero-stat__value">98%</span>
            <span class="hero-stat__label">Accuracy</span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value">5min</span>
            <span class="hero-stat__label">Average</span>
          </div>
          <div class="hero-stat__divider"></div>
          <div class="hero-stat">
            <span class="hero-stat__value">24/7</span>
            <span class="hero-stat__label">Available</span>
          </div>
        </div>
      </div>
      <div class="hero__visual">
        <div class="health-orb">
          <div class="orb-ring orb-ring--1"></div>
          <div class="orb-ring orb-ring--2"></div>
          <div class="orb-ring orb-ring--3"></div>
          <div class="orb-core">
            <v-icon name="fa-heartbeat" />
          </div>
        </div>
        <div class="floating-icons">
          <div class="float-icon float-icon--1"><v-icon name="hi-shield-check" /></div>
          <div class="float-icon float-icon--2"><v-icon name="hi-lightning-bolt" /></div>
          <div class="float-icon float-icon--3"><v-icon name="hi-chart-bar" /></div>
        </div>
      </div>
    </section>

    <!-- Bento Grid -->
    <section class="bento-grid">
      <!-- Patient Selection Card (Large) -->
      <div class="bento-card bento-card--patients">
        <div class="card-header">
          <div class="card-header__icon">
            <v-icon name="hi-users" />
          </div>
          <div class="card-header__text">
            <h3>Start Checkup</h3>
            <p>Select who this assessment is for</p>
          </div>
        </div>
        <div class="patients-grid">
          <!-- Self -->
          <button class="patient-btn patient-btn--self" @click="onSelectedPatient(userprofile, 'Self')">
            <div class="patient-btn__avatar">
              <img
                v-if="profilePhoto"
                :src="profilePhoto"
                :alt="profile.first_name"
                class="patient-btn__img"
              />
              <avatar-fixed
                v-else
                size="small"
                :firstname="profile.first_name"
                :lastname="profile.last_name"
              />
              <div class="patient-btn__verified">
                <v-icon name="hi-check" />
              </div>
            </div>
            <div class="patient-btn__info">
              <span class="patient-btn__name">Myself</span>
              <span class="patient-btn__meta">Personal checkup</span>
            </div>
            <v-icon name="hi-arrow-right" class="patient-btn__arrow" />
          </button>

          <!-- Dependants -->
          <template v-for="dependant in dependantsList" :key="dependant._id || dependant.first_name">
            <button class="patient-btn" @click="onSelectedPatient(dependant, 'Dependant')">
              <div class="patient-btn__avatar">
                <avatar-fixed
                  size="small"
                  :firstname="dependant.first_name"
                  :lastname="dependant.last_name"
                />
              </div>
              <div class="patient-btn__info">
                <span class="patient-btn__name">{{ dependant.first_name }}</span>
                <span class="patient-btn__meta">Dependant</span>
              </div>
              <v-icon name="hi-arrow-right" class="patient-btn__arrow" />
            </button>
          </template>

          <!-- Someone Else -->
          <button class="patient-btn patient-btn--add" @click="onSelectedPatient('', 'Third Party')">
            <div class="patient-btn__icon">
              <v-icon name="hi-user-add" />
            </div>
            <div class="patient-btn__info">
              <span class="patient-btn__name">Someone else</span>
              <span class="patient-btn__meta">New person</span>
            </div>
            <v-icon name="hi-arrow-right" class="patient-btn__arrow" />
          </button>
        </div>
      </div>

      <!-- How it Works Card -->
      <div class="bento-card bento-card--how">
        <div class="card-header card-header--small">
          <v-icon name="hi-light-bulb" />
          <h3>How it works</h3>
        </div>
        <div class="steps-list">
          <div class="step-item">
            <div class="step-item__number">1</div>
            <span>Answer quick questions about your symptoms</span>
          </div>
          <div class="step-item">
            <div class="step-item__number">2</div>
            <span>Our AI analyzes your responses</span>
          </div>
          <div class="step-item">
            <div class="step-item__number">3</div>
            <span>Get personalized health insights</span>
          </div>
        </div>
      </div>

      <!-- Features Card -->
      <div class="bento-card bento-card--features">
        <div class="features-grid">
          <div class="feature-box feature-box--secure">
            <div class="feature-box__icon">
              <v-icon name="hi-shield-check" />
            </div>
            <span class="feature-box__label">Secure & Private</span>
          </div>
          <div class="feature-box feature-box--ai">
            <div class="feature-box__icon">
              <v-icon name="hi-sparkles" />
            </div>
            <span class="feature-box__label">AI-Powered</span>
          </div>
          <div class="feature-box feature-box--fast">
            <div class="feature-box__icon">
              <v-icon name="hi-lightning-bolt" />
            </div>
            <span class="feature-box__label">Quick Results</span>
          </div>
          <div class="feature-box feature-box--trusted">
            <div class="feature-box__icon">
              <v-icon name="hi-badge-check" />
            </div>
            <span class="feature-box__label">Trusted</span>
          </div>
        </div>
      </div>

      <!-- History Card -->
      <div class="bento-card bento-card--history" @click="viewHistory">
        <div class="history-card__content">
          <div class="history-card__icon">
            <v-icon name="hi-clock" />
          </div>
          <div class="history-card__text">
            <h3>Checkup History</h3>
            <p>View your previous assessments</p>
          </div>
        </div>
        <v-icon name="hi-chevron-right" class="history-card__arrow" />
      </div>
    </section>

    <!-- Trust Banner -->
    <section class="trust-banner">
      <div class="trust-banner__content">
        <v-icon name="hi-information-circle" />
        <p>This tool provides general health information and is not a substitute for professional medical advice.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, inject, computed } from "vue";
import { useToast } from 'vue-toast-notification';
import AvatarFixed from "@/components/Avatars/avatar-fixed";
import Loader from "@/components/Loader/main-loader.vue";
import { mapGetters } from "@/utilities/utilityStore";
import { calculateAge } from "@/utilities/utilityFunctions";

const $toast = useToast();
const $http = inject("$http");
const { navigator, useNavigator } = inject('$_NAVIGATOR');
const { patientInfo, usePatientInfo } = inject('$_PATIENT_INFO');
const { userprofile } = mapGetters();

const profile = { ...userprofile.value.profile };
const dependants = { ...userprofile.value.dependants };
const isFetching = ref(false);

const profilePhoto = computed(() => {
  return userprofile.value?.profile?.profile_image || userprofile.value?.profile?.profile_photo;
});

const dependantsList = computed(() => {
  if (!dependants || typeof dependants !== 'object') return [];
  return Object.values(dependants).filter(d => d && d.first_name);
});

const onSelectedPatient = async (patient, patientType) => {
  isFetching.value = true;
  const payload = {
    checkup_owner_id: patient._id,
    health_check_for: patientType
  };

  await $http.$_beginHealthCheckup(payload).then(({ data }) => {
    const { current, from, to } = navigator.value;

    if (patientType === 'Self') {
      const age = calculateAge(patient?.profile?.date_of_birth);
      const gender = patient.profile.gender?.toLowerCase();
      usePatientInfo({ ...patient.profile, age, gender, patientType });
      useNavigator({ current, from: current, to: 3 });
    } else if (patientType === 'Dependant') {
      const age = calculateAge(patient?.date_of_birth);
      usePatientInfo({ ...patient, age, patientType });
      useNavigator({ current, from: current, to: 1 });
    } else if (patientType === 'Third Party') {
      usePatientInfo({ patientType });
      useNavigator({ current, from: current, to: 1 });
    }

    isFetching.value = false;
  }).catch((error) => {
    isFetching.value = false;
    $toast.error(error.message, { duration: 3000 });
  });
};

const viewHistory = () => {
  const { current } = navigator.value;
  useNavigator({ current, from: current, to: 10 });
};
</script>

<style scoped lang="scss">
// Design System
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #334155;
$gray: #64748B;
$light-gray: #94A3B8;
$bg: #F8FAFC;
$white: #FFFFFF;

// Accent colors
$emerald: #10B981;
$emerald-light: #D1FAE5;
$violet: #8B5CF6;
$violet-light: #EDE9FE;
$amber: #F59E0B;
$amber-light: #FEF3C7;
$rose: #F43F5E;
$rose-light: #FFE4E6;

.health-entry {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 48px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 0 16px;
  }

  @media (max-width: 640px) {
    gap: 20px;
    padding-bottom: 32px;
  }
}

// ============================================
// HERO SECTION
// ============================================
.hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 40px;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 50%, $sky-darker 100%);
  border-radius: 28px;
  position: relative;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(2, 136, 209, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 32px 24px;
    gap: 24px;
    text-align: center;
  }

  &__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    z-index: 2;
  }

  &__badge {
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
      margin: 0 auto 16px;
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

  &__title {
    font-size: 48px;
    font-weight: 800;
    color: white;
    line-height: 1.1;
    margin: 0 0 16px;
    letter-spacing: -1px;

    @media (max-width: 768px) {
      font-size: 36px;
    }

    &-accent {
      background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.7) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  &__subtitle {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.85);
    line-height: 1.6;
    margin: 0 0 24px;
    max-width: 340px;

    @media (max-width: 768px) {
      font-size: 15px;
      max-width: 100%;
    }
  }

  &__stats {
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
      justify-content: center;
      padding: 14px 16px;
      gap: 16px;
    }
  }

  &__visual {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;

    @media (max-width: 768px) {
      display: none;
    }
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

    @media (max-width: 640px) {
      font-size: 20px;
    }
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

// Health Orb
.health-orb {
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
    border-style: dashed;
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
  width: 100%;
  height: 100%;
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
  animation: float 4s ease-in-out infinite;

  svg {
    width: 22px;
    height: 22px;
    color: white;
  }

  &--1 {
    top: 10px;
    right: 20px;
    animation-delay: 0s;
  }

  &--2 {
    bottom: 30px;
    right: 0;
    animation-delay: 1s;
  }

  &--3 {
    bottom: 10px;
    left: 20px;
    animation-delay: 2s;
  }
}

// ============================================
// BENTO GRID
// ============================================
.bento-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

.bento-card {
  background: $white;
  border-radius: 20px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;

  @media (max-width: 640px) {
    padding: 20px;
    border-radius: 18px;
  }

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }

  // Patients Card (spans full width)
  &--patients {
    grid-column: 1 / -1;
    background: linear-gradient(135deg, $white 0%, $sky-light 100%);
  }

  // How it works Card
  &--how {
    background: linear-gradient(135deg, $violet-light 0%, $white 100%);
  }

  // Features Card
  &--features {
    background: $white;
  }

  // History Card
  &--history {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    cursor: pointer;
    background: linear-gradient(135deg, $slate 0%, $navy 100%);
    color: white;

    @media (max-width: 640px) {
      padding: 18px 20px;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.2);

      .history-card__arrow {
        transform: translateX(4px);
      }
    }
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;

  &__icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);

    svg {
      width: 24px;
      height: 24px;
      color: white;
    }
  }

  &__text {
    h3 {
      font-size: 18px;
      font-weight: 700;
      color: $navy;
      margin: 0 0 4px;
    }

    p {
      font-size: 14px;
      color: $gray;
      margin: 0;
    }
  }

  &--small {
    gap: 10px;
    margin-bottom: 16px;

    svg {
      width: 20px;
      height: 20px;
      color: $violet;
    }

    h3 {
      font-size: 15px;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }
  }
}

// Patients Grid
.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}

.patient-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: $white;
  border: 2px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.25s ease;
  text-align: left;

  &:hover {
    border-color: $sky;
    background: $white;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(79, 195, 247, 0.15);

    .patient-btn__arrow {
      transform: translateX(4px);
      color: $sky-dark;
    }
  }

  &--self {
    border-color: rgba($sky, 0.3);
    background: linear-gradient(135deg, rgba($sky-light, 0.5) 0%, $white 100%);
  }

  &--add {
    border-style: dashed;
    border-color: rgba(0, 0, 0, 0.1);

    &:hover {
      border-style: solid;

      .patient-btn__icon {
        background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
        svg { color: white; }
      }
    }
  }

  &__avatar {
    position: relative;
    flex-shrink: 0;

    :deep(.avatar) {
      width: 44px !important;
      height: 44px !important;
      font-size: 16px !important;
      border-radius: 12px !important;
    }
  }

  &__img {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    object-fit: cover;
  }

  &__verified {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 18px;
    height: 18px;
    background: $emerald;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid $white;

    svg {
      width: 10px;
      height: 10px;
      color: white;
    }
  }

  &__icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.25s ease;

    svg {
      width: 22px;
      height: 22px;
      color: $gray;
    }
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    display: block;
    font-size: 15px;
    font-weight: 600;
    color: $navy;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    display: block;
    font-size: 12px;
    color: $gray;
    margin-top: 2px;
  }

  &__arrow {
    width: 18px;
    height: 18px;
    color: $light-gray;
    flex-shrink: 0;
    transition: all 0.25s ease;
  }
}

// Steps List
.steps-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 12px;

  &__number {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, $violet 0%, darken($violet, 10%) 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }

  span {
    font-size: 14px;
    color: $slate;
    line-height: 1.4;
  }
}

// Features Grid
.features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.feature-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 12px;
  background: $bg;
  border-radius: 14px;
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &__icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 22px;
      height: 22px;
    }
  }

  &__label {
    font-size: 12px;
    font-weight: 600;
    color: $slate;
    text-align: center;
  }

  &--secure .feature-box__icon {
    background: linear-gradient(135deg, $sky-light 0%, lighten($sky-light, 3%) 100%);
    svg { color: $sky-dark; }
  }

  &--ai .feature-box__icon {
    background: linear-gradient(135deg, $violet-light 0%, lighten($violet-light, 3%) 100%);
    svg { color: $violet; }
  }

  &--fast .feature-box__icon {
    background: linear-gradient(135deg, $amber-light 0%, lighten($amber-light, 3%) 100%);
    svg { color: $amber; }
  }

  &--trusted .feature-box__icon {
    background: linear-gradient(135deg, $emerald-light 0%, lighten($emerald-light, 3%) 100%);
    svg { color: $emerald; }
  }
}

// History Card Content
.history-card {
  &__content {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 22px;
      height: 22px;
      color: white;
    }
  }

  &__text {
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: white;
      margin: 0 0 4px;
    }

    p {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.7);
      margin: 0;
    }
  }

  &__arrow {
    width: 20px;
    height: 20px;
    color: rgba(255, 255, 255, 0.7);
    transition: all 0.25s ease;
  }
}

// ============================================
// TRUST BANNER
// ============================================
.trust-banner {
  padding: 16px 20px;
  background: $bg;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.04);

  &__content {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    svg {
      width: 18px;
      height: 18px;
      color: $gray;
      flex-shrink: 0;
      margin-top: 1px;
    }

    p {
      font-size: 13px;
      color: $gray;
      line-height: 1.5;
      margin: 0;
    }
  }
}

// ============================================
// ANIMATIONS
// ============================================
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

@keyframes pulse-ring {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 40px rgba(255, 255, 255, 0.3), 0 0 80px rgba(79, 195, 247, 0.3); }
  50% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.4), 0 0 100px rgba(79, 195, 247, 0.4); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>
