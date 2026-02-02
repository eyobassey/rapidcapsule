<template>
  <div class="step-container">
    <div class="step-scroll">
      <div class="step-content">
        <div class="step-header">
          <button class="back-btn" @click="goBack">
            <v-icon name="hi-arrow-left" scale="0.9" />
            <span>Back</span>
          </button>
          <div class="step-info">
            <span class="step-badge optional">Step 4 of 9 - Optional</span>
            <h1 class="step-title">Dependants & Family Members</h1>
            <p class="step-description">
              Add family members whose health you manage. You can book appointments and track health records for them.
            </p>
          </div>
        </div>

        <div class="form-sections">
          <div class="form-section">
            <div class="empty-state" v-if="!dependants.has_dependants && dependants.dependants.length === 0">
              <div class="empty-icon">
                <v-icon name="hi-users" scale="2" />
              </div>
              <h3>No Dependants Added</h3>
              <p>Add family members like children, elderly parents, or others you care for.</p>
              <button class="btn-primary" @click="openAddModal">
                <v-icon name="hi-plus" scale="0.8" />
                <span>Add Dependant</span>
              </button>
            </div>

            <div v-else>
              <div class="dependant-list">
                <div v-for="(dep, index) in dependants.dependants" :key="index" class="dependant-card">
                  <div class="dependant-avatar">
                    <v-icon name="hi-user" scale="1.2" />
                  </div>
                  <div class="dependant-info">
                    <h4>{{ dep.first_name }} {{ dep.last_name }}</h4>
                    <p>{{ dep.relationship }} • {{ calculateAge(dep.date_of_birth) }} years old</p>
                  </div>
                  <button class="edit-btn" @click="openEditModal(index)">
                    <v-icon name="hi-pencil" scale="0.8" />
                  </button>
                  <button class="remove-btn" @click="removeDependant(index)">
                    <v-icon name="hi-trash" scale="0.8" />
                  </button>
                </div>
              </div>
              <button class="add-another-btn" @click="openAddModal">
                <v-icon name="hi-plus" scale="0.8" />
                <span>Add Another Dependant</span>
              </button>
            </div>
          </div>
        </div>

        <div class="step-footer">
          <button class="btn-skip" @click="skipStep">
            Skip for now
          </button>
          <div class="footer-actions">
            <button class="btn-secondary" @click="saveAndExit">
              Save & Exit
            </button>
            <button class="btn-primary" @click="saveAndContinue" :disabled="isSaving">
              <span>{{ isSaving ? 'Saving...' : 'Continue' }}</span>
              <v-icon v-if="!isSaving" name="hi-arrow-right" scale="0.8" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dependant Form Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="dependant-modal">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit Dependant' : 'Add Dependant' }}</h3>
          <button class="close-btn" @click="closeModal">
            <v-icon name="hi-x" scale="1" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label required">First Name</label>
              <input
                type="text"
                v-model="formData.first_name"
                class="form-input"
                placeholder="Enter first name"
              />
            </div>
            <div class="form-group">
              <label class="form-label required">Last Name</label>
              <input
                type="text"
                v-model="formData.last_name"
                class="form-input"
                placeholder="Enter last name"
              />
            </div>
            <div class="form-group">
              <label class="form-label required">Date of Birth</label>
              <input
                type="date"
                v-model="formData.date_of_birth"
                class="form-input"
                :max="todayDate"
              />
            </div>
            <div class="form-group">
              <label class="form-label required">Gender</label>
              <select v-model="formData.gender" class="form-select">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label class="form-label required">Relationship</label>
              <select v-model="formData.relationship" class="form-select">
                <option value="">Select relationship</option>
                <option value="Child">Child</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Wife">Wife</option>
                <option value="Husband">Husband</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Friend">Friend</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Blood Type (Optional)</label>
              <select v-model="formData.blood_type" class="form-select">
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
              <label class="form-label">Genotype (Optional)</label>
              <select v-model="formData.genotype" class="form-select">
                <option value="">Select genotype</option>
                <option value="AA">AA</option>
                <option value="AS">AS</option>
                <option value="SS">SS</option>
                <option value="AC">AC</option>
                <option value="SC">SC</option>
                <option value="CC">CC</option>
              </select>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn-primary" @click="saveDependant" :disabled="!isFormValid">
            {{ isEditing ? 'Update' : 'Add' }} Dependant
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, getCurrentInstance } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { usePatientOnboardingState } from './composables/usePatientOnboardingState';

const $toast = getCurrentInstance().appContext.config.globalProperties.$toast;

const router = useRouter();
const store = useStore();
const $http = inject('$http');
const { dependants, completeStep, saveProgress, goToStep, skipStep: skip } = usePatientOnboardingState();

const isSaving = ref(false);
const showModal = ref(false);
const isEditing = ref(false);
const editingIndex = ref(-1);

const formData = ref({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: '',
  relationship: '',
  blood_type: '',
  genotype: '',
});

const todayDate = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const isFormValid = computed(() => {
  return (
    formData.value.first_name?.trim() &&
    formData.value.last_name?.trim() &&
    formData.value.date_of_birth &&
    formData.value.gender &&
    formData.value.relationship
  );
});

const goBack = () => goToStep(3);

const calculateAge = (dob) => {
  if (!dob) return '—';
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const resetForm = () => {
  formData.value = {
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    relationship: '',
    blood_type: '',
    genotype: '',
  };
};

const openAddModal = () => {
  resetForm();
  isEditing.value = false;
  editingIndex.value = -1;
  showModal.value = true;
};

// Helper to format date for HTML date input (YYYY-MM-DD)
const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  // Handle ISO date strings like "1983-09-15T00:00:00.000Z"
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    return dateValue.split('T')[0];
  }
  // Handle Date objects
  if (dateValue instanceof Date) {
    return dateValue.toISOString().split('T')[0];
  }
  // Already in YYYY-MM-DD format
  return dateValue;
};

const openEditModal = (index) => {
  const dep = dependants.dependants[index];
  formData.value = {
    first_name: dep.first_name || '',
    last_name: dep.last_name || '',
    date_of_birth: formatDateForInput(dep.date_of_birth),
    gender: dep.gender || '',
    relationship: dep.relationship || '',
    blood_type: dep.blood_type || '',
    genotype: dep.genotype || '',
  };
  isEditing.value = true;
  editingIndex.value = index;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  resetForm();
};

const saveDependant = () => {
  // Validate required fields with toast messages
  if (!formData.value.first_name?.trim()) {
    $toast.error('Please enter dependant first name');
    return;
  }
  if (!formData.value.last_name?.trim()) {
    $toast.error('Please enter dependant last name');
    return;
  }
  if (!formData.value.date_of_birth) {
    $toast.error('Please enter dependant date of birth');
    return;
  }
  if (!formData.value.gender) {
    $toast.error('Please select dependant gender');
    return;
  }
  if (!formData.value.relationship) {
    $toast.error('Please select relationship to dependant');
    return;
  }

  const newDependant = { ...formData.value };

  if (isEditing.value && editingIndex.value >= 0) {
    // Update existing dependant
    dependants.dependants[editingIndex.value] = newDependant;
  } else {
    // Add new dependant
    dependants.has_dependants = true;
    dependants.dependants.push(newDependant);
  }

  closeModal();
  saveProgress();
};

const removeDependant = (index) => {
  if (confirm('Are you sure you want to remove this dependant?')) {
    dependants.dependants.splice(index, 1);
    if (dependants.dependants.length === 0) {
      dependants.has_dependants = false;
    }
    saveProgress();
  }
};

// Save dependants to backend using apiFactory method
const saveDependantsToBackend = async () => {
  const validDependants = dependants.dependants.filter(d => d.first_name && d.last_name);

  try {
    isSaving.value = true;
    await $http.$_updateUser({
      dependants: validDependants,
    });
    // Refresh user profile in store
    await store.dispatch('authenticate', localStorage.getItem('token') || sessionStorage.getItem('token'));
    return true;
  } catch (error) {
    console.error('Failed to save dependants:', error);
    return false;
  } finally {
    isSaving.value = false;
  }
};

const skipStep = () => {
  skip();
  goToStep(5);
};

const saveAndExit = async () => {
  await saveDependantsToBackend();
  saveProgress();
  router.push({ name: 'Patient Dashboard' });
};

const saveAndContinue = async () => {
  const saved = await saveDependantsToBackend();

  if (dependants.dependants.length > 0 && saved) {
    completeStep('dependants');
  }
  saveProgress();
  goToStep(5);
};
</script>

<style scoped lang="scss">
@import './styles/step-common.scss';

.empty-state {
  text-align: center;
  padding: 3rem 2rem;

  .empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    background: #E1F5FE;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0288D1;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0 0 0.5rem 0;
  }

  p {
    font-size: 0.9375rem;
    color: #64748B;
    margin: 0 0 1.5rem 0;
  }
}

.dependant-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.dependant-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #F8FAFC;
  border-radius: 0.75rem;
}

.dependant-avatar {
  width: 48px;
  height: 48px;
  background: #E2E8F0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748B;
}

.dependant-info {
  flex: 1;

  h4 {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1A365D;
    margin: 0 0 0.25rem 0;
  }

  p {
    font-size: 0.8125rem;
    color: #64748B;
    margin: 0;
  }
}

.edit-btn, .remove-btn {
  padding: 0.5rem;
  background: white;
  border: 1px solid #E2E8F0;
  border-radius: 0.5rem;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #F1F5F9;
  }
}

.remove-btn:hover {
  background: #FEE2E2;
  border-color: #FECACA;
  color: #DC2626;
}

.add-another-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem;
  background: transparent;
  border: 2px dashed #CBD5E1;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748B;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #4FC3F7;
    color: #0288D1;
  }
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
  padding: 1rem;
}

.dependant-modal {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #E2E8F0;

  h3 {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1A365D;
    margin: 0;
  }

  .close-btn {
    padding: 0.5rem;
    background: transparent;
    border: none;
    color: #64748B;
    cursor: pointer;
    border-radius: 0.5rem;
    transition: all 0.2s;

    &:hover {
      background: #F1F5F9;
      color: #1A365D;
    }
  }
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;

    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }

  .form-group {
    &.full-width {
      grid-column: 1 / -1;
    }
  }

  .form-label {
    display: block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.375rem;

    &.required::after {
      content: ' *';
      color: #DC2626;
    }
  }

  .form-input, .form-select {
    width: 100%;
    padding: 0.75rem 1rem;
    background: #F8FAFC;
    border: 2px solid #E2E8F0;
    border-radius: 0.625rem;
    font-size: 0.9375rem;
    color: #1A365D;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #4FC3F7;
      background: white;
    }

    &::placeholder {
      color: #94A3B8;
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #E2E8F0;
  background: #F8FAFC;
}
</style>
