<template>
  <div class="step-container">
    <div class="step-scroll">
      <div class="step-content">
        <div class="step-header">
          <div class="step-header-row">
            <button class="back-btn" @click="goBack">
              <v-icon name="hi-arrow-left" scale="0.9" />
              <span>Back</span>
            </button>
            <span class="step-badge optional">Step 6 of 9 - Recommended</span>
          </div>
          <div class="step-info">
            <h1 class="step-title">Allergies & Drug Reactions</h1>
            <p class="step-description">
              Document any allergies to help specialists prescribe safe medications.
            </p>
          </div>
        </div>

        <div class="form-sections">
          <!-- Initial Question -->
          <div class="form-section" v-if="allergies.has_allergies === null">
            <h2 class="section-title">Do you have any known allergies?</h2>
            <div class="choice-buttons">
              <button class="choice-btn" @click="allergies.has_allergies = true">
                <v-icon name="hi-exclamation-triangle" scale="1" />
                <span>Yes, I have allergies</span>
              </button>
              <button class="choice-btn safe" @click="confirmNoAllergies">
                <v-icon name="hi-shield-check" scale="1" />
                <span>No known allergies</span>
              </button>
            </div>
          </div>

          <!-- No Allergies Confirmation -->
          <div class="form-section success-state" v-else-if="allergies.has_allergies === false">
            <div class="success-icon">
              <v-icon name="hi-shield-check" scale="2" />
            </div>
            <h3>No Known Allergies</h3>
            <p>This information will be shared with specialists to ensure safe prescriptions.</p>
            <button class="link-btn" @click="allergies.has_allergies = null">
              Change answer
            </button>
          </div>

          <!-- Allergy Entry Forms -->
          <template v-else>
            <div class="form-section">
              <h2 class="section-title">Drug Allergies</h2>
              <p class="section-description">List any medications you're allergic to.</p>

              <div class="allergy-list">
                <div v-for="(allergy, index) in allergies.drug_allergies" :key="index" class="allergy-item">
                  <div class="allergy-fields">
                    <input
                      type="text"
                      v-model="allergy.drug_name"
                      class="form-input"
                      placeholder="Drug name (e.g., Penicillin)"
                    />
                    <input
                      type="text"
                      v-model="allergy.reaction"
                      class="form-input"
                      placeholder="Reaction (e.g., Rash, Swelling)"
                    />
                    <select v-model="allergy.severity" class="form-select severity-select">
                      <option value="mild">Mild</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                      <option value="life_threatening">Life-threatening</option>
                    </select>
                  </div>
                  <button class="remove-btn" @click="removeDrugAllergy(index)">
                    <v-icon name="hi-x" scale="0.8" />
                  </button>
                </div>
              </div>
              <button class="add-btn" @click="addDrugAllergy">
                <v-icon name="hi-plus" scale="0.8" />
                <span>Add Drug Allergy</span>
              </button>
            </div>

            <div class="form-section">
              <h2 class="section-title">Food Allergies</h2>
              <div class="allergy-list">
                <div v-for="(allergy, index) in allergies.food_allergies" :key="index" class="allergy-item">
                  <div class="allergy-fields">
                    <input
                      type="text"
                      v-model="allergy.food_name"
                      class="form-input"
                      placeholder="Food item (e.g., Peanuts)"
                    />
                    <input
                      type="text"
                      v-model="allergy.reaction"
                      class="form-input"
                      placeholder="Reaction"
                    />
                  </div>
                  <button class="remove-btn" @click="removeFoodAllergy(index)">
                    <v-icon name="hi-x" scale="0.8" />
                  </button>
                </div>
              </div>
              <button class="add-btn" @click="addFoodAllergy">
                <v-icon name="hi-plus" scale="0.8" />
                <span>Add Food Allergy</span>
              </button>
            </div>
          </template>
        </div>

        <div class="step-footer">
          <button class="btn-skip" @click="skipStep">
            Skip for now
          </button>
          <div class="footer-actions">
            <button class="btn-secondary" @click="saveAndExit">
              Save & Exit
            </button>
            <button class="btn-primary" @click="saveAndContinue">
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
import { ref, inject } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { usePatientOnboardingState } from './composables/usePatientOnboardingState';

const router = useRouter();
const store = useStore();
const $http = inject('$http');
const { allergies, completeStep, saveProgress, goToStep } = usePatientOnboardingState();

const isSaving = ref(false);

const goBack = () => goToStep(5);

const confirmNoAllergies = () => {
  allergies.has_allergies = false;
  allergies.drug_allergies = [];
  allergies.food_allergies = [];
};

const addDrugAllergy = () => {
  allergies.drug_allergies.push({ drug_name: '', reaction: '', severity: 'moderate' });
};

const removeDrugAllergy = (index) => {
  allergies.drug_allergies.splice(index, 1);
};

const addFoodAllergy = () => {
  allergies.food_allergies.push({ food_name: '', reaction: '', severity: 'moderate' });
};

const removeFoodAllergy = (index) => {
  allergies.food_allergies.splice(index, 1);
};

// Save allergies to backend
const saveAllergiesToBackend = async () => {
  if (allergies.has_allergies === null) return true;

  try {
    isSaving.value = true;
    await $http.$_updateUser({
      allergies: {
        has_allergies: allergies.has_allergies,
        drug_allergies: allergies.drug_allergies.filter(a => a.drug_name),
        food_allergies: allergies.food_allergies.filter(a => a.food_name),
        environmental_allergies: allergies.environmental_allergies?.filter(a => a.allergen) || [],
        other_allergies: allergies.other_allergies?.filter(a => a.allergen) || [],
      },
    });
    // Refresh user profile in store
    await store.dispatch('authenticate', localStorage.getItem('token') || sessionStorage.getItem('token'));
    return true;
  } catch (error) {
    console.error('Failed to save allergies:', error);
    return false;
  } finally {
    isSaving.value = false;
  }
};

const skipStep = () => {
  saveProgress();
  goToStep(7);
};

const saveAndExit = async () => {
  await saveAllergiesToBackend();
  saveProgress();
  router.push({ name: 'Patient Dashboard' });
};

const saveAndContinue = async () => {
  const saved = await saveAllergiesToBackend();

  if (allergies.has_allergies !== null && saved) {
    completeStep('allergies');
  }
  saveProgress();
  goToStep(7);
};
</script>

<style scoped lang="scss">
@import './styles/step-common.scss';

.choice-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;

  @media (max-width: 640px) {
    flex-direction: column;
  }
}

.choice-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  background: #FFF7ED;
  border: 2px solid #FDBA74;
  border-radius: 1rem;
  color: #EA580C;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #FFEDD5;
    border-color: #FB923C;
  }

  &.safe {
    background: #F0FDF4;
    border-color: #86EFAC;
    color: #16A34A;

    &:hover {
      background: #DCFCE7;
      border-color: #4ADE80;
    }
  }
}

.success-state {
  text-align: center;
  padding: 3rem 2rem;

  .success-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    background: #D1FAE5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #10B981;
  }

  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #10B981;
    margin: 0 0 0.5rem 0;
  }

  p {
    font-size: 0.9375rem;
    color: #64748B;
    margin: 0 0 1.5rem 0;
  }
}

.link-btn {
  background: none;
  border: none;
  color: #4FC3F7;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.allergy-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.allergy-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.allergy-fields {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 120px;
  gap: 0.75rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.severity-select {
  width: auto;
}

.remove-btn {
  padding: 0.75rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  color: #64748B;
  cursor: pointer;

  &:hover {
    background: #FEE2E2;
    border-color: #FECACA;
    color: #DC2626;
  }
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: 2px dashed #CBD5E1;
  border-radius: 0.5rem;
  color: #64748B;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    border-color: #4FC3F7;
    color: #0288D1;
  }
}

/* Mobile Styles */
@media (max-width: 768px) {
  .choice-btn {
    padding: 1.5rem;
    font-size: 0.9375rem;
  }

  .success-state {
    padding: 2rem 1.5rem;

    .success-icon {
      width: 64px;
      height: 64px;
    }

    h3 {
      font-size: 1.125rem;
    }

    p {
      font-size: 0.875rem;
    }
  }

  .allergy-item {
    flex-direction: column;
    align-items: stretch;
  }

  .allergy-fields {
    grid-template-columns: 1fr;

    .form-input, .form-select {
      font-size: 1rem;
    }
  }

  .remove-btn {
    align-self: flex-end;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
    padding: 1rem;
  }
}
</style>
