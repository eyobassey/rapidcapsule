<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
  avatarText,
} from '@core/utils/formatters'
import { useLanguagesStore } from '@/stores/languages'
import { useSpecialistCategoriesStore } from '@/stores/specialist-categories'
import { useSpecialistStore } from '@/stores/specialist'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:userData'])

const languagesStore = useLanguagesStore()
const categoriesStore = useSpecialistCategoriesStore()
const specialistStore = useSpecialistStore()

const isUserInfoEditDialogVisible = ref(false)
const isLanguagesCategoriesDialogVisible = ref(false)
const savingLanguagesCategories = ref(false)

const editForm = ref({
  category: '',
  specialization: '',
  years_of_experience: '',
  consultation_fee: '',
})

const languagesCategoriesForm = ref({
  selectedLanguages: [],
  selectedCategories: [],
})

// Current assignments from the specialist
const currentLanguages = ref([])
const currentCategories = ref([])

const specialistCategories = [
  'General Practitioner',
  'Medical Doctor',
  'Pharmacist',
  'Therapist',
  'Nurse',
  'Physiotherapist',
]

// Computed for dropdown items
const languageOptions = computed(() => {
  return languagesStore.languages.map(l => ({
    title: l.name,
    value: l._id,
  }))
})

const categoryOptions = computed(() => {
  return categoriesStore.categories.map(c => ({
    title: c.name,
    value: c._id,
  }))
})

// Load languages and categories on mount
onMounted(async () => {
  await Promise.all([
    languagesStore.fetchLanguages({ limit: 100 }),
    categoriesStore.fetchCategories({ limit: 100 }),
  ])
  await loadSpecialistAssignments()
})

// Watch for userData changes to reload assignments
watch(() => props.userData?._id, async () => {
  if (props.userData?._id) {
    await loadSpecialistAssignments()
  }
})

const loadSpecialistAssignments = async () => {
  if (!props.userData?._id) return

  const data = await specialistStore.getSpecialistLanguagesAndCategories(props.userData._id)
  if (data) {
    currentLanguages.value = data.languages || []
    currentCategories.value = data.specialist_categories || []
  }
}

const openEditDialog = () => {
  editForm.value = {
    category: props.userData.professional_practice?.category || '',
    // Map backend field names to frontend field names
    specialization: props.userData.professional_practice?.area_of_specialty || '',
    years_of_experience: props.userData.professional_practice?.years_of_practice || '',
    consultation_fee: props.userData.professional_practice?.consultation_fee || '',
  }
  isUserInfoEditDialogVisible.value = true
}

const openLanguagesCategoriesDialog = () => {
  languagesCategoriesForm.value = {
    selectedLanguages: currentLanguages.value.map(l => l._id),
    selectedCategories: currentCategories.value.map(c => c._id),
  }
  isLanguagesCategoriesDialogVisible.value = true
}

const saveChanges = async () => {
  // Emit update event to parent
  emit('update:userData', editForm.value)
  isUserInfoEditDialogVisible.value = false
}

const saveLanguagesCategories = async () => {
  if (!props.userData?._id) return

  savingLanguagesCategories.value = true
  try {
    const [langResult, catResult] = await Promise.all([
      specialistStore.assignLanguages(props.userData._id, languagesCategoriesForm.value.selectedLanguages),
      specialistStore.assignCategories(props.userData._id, languagesCategoriesForm.value.selectedCategories),
    ])

    if (langResult !== 'error' && catResult !== 'error') {
      await loadSpecialistAssignments()
      isLanguagesCategoriesDialogVisible.value = false
    }
  } finally {
    savingLanguagesCategories.value = false
  }
}

const resolveUserStatusVariant = stat => {
  if (stat === 'pending')
    return 'warning'
  if (stat === 'Active')
    return 'success'
  if (stat === 'inactive')
    return 'secondary'
  
  return 'primary'
}

const resolveUserRoleVariant = role => {
  if (role === 'subscriber')
    return {
      color: 'primary',
      icon: 'bx-user',
    }
  if (role === 'author')
    return {
      color: 'warning',
      icon: 'bx-cog',
    }
  if (role === 'maintainer')
    return {
      color: 'success',
      icon: 'bx-data',
    }
  if (role === 'editor')
    return {
      color: 'info',
      icon: 'bx-pencil',
    }
  if (role === 'admin')
    return {
      color: 'error',
      icon: 'bx-server',
    }
  
  return {
    color: 'primary',
    icon: 'bx-user',
  }
}
</script>

<template>
  <VRow>
    <!-- SECTION User Details -->
    <VCol cols="12">
      <VCard v-if="props.userData">
        <VCardText class="text-center pt-15">
          <!-- 👉 Avatar -->
          <VAvatar
            rounded
            :size="120"
            color="primary"
            variant="tonal"
          >
            <VImg
              v-if="props.userData.avatar"
              :src="props.userData.avatar"
            />
            <span
              v-else
              class="text-5xl font-weight-semibold"
            >
              {{ avatarText(props.userData.profile.first_name) }}
            </span>
          </VAvatar>

          <!-- 👉 User fullName -->
          <h2
            class=" mt-4"
            style="color:#151515"
          >
            {{ `${props.userData.profile.first_name} ${props.userData.profile.last_name}` }}
            <!-- 👉 Verification chip -->
            <VChip
              label
              density="compact"
              :color="resolveUserStatusVariant(props.userData.status)"
            >
              {{ props.userData.status }}
            </VChip>
          </h2>
        </VCardText>

       

        <!-- 👉 Details -->
        <VCardText>
          <VDivider class="my-4" />
          <!-- 👉 User Details list -->
          <VList class="card-list mt-2">
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="field-name me-auto">License No.:</span>
                <span class="alt-color">
                  {{ props.userData.professional_practice?.license_number }}
                </span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="field-name me-auto">
                  Gender:
                </span>
                <span class="alt-color patient-prof-alt-color">{{ props.userData.profile.gender }}</span>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="field-name me-auto">
                  DOB:
                </span>
                <span class="alt-color">{{ props.userData.profile.date_of_birth }}</span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="field-name me-auto">
                  Marital Status:
                </span>
                <span class="alt-color">{{ props.userData.profile.marital_status }}</span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="field-name me-auto">
                  Email:
                </span>
                <span class="email-color">{{ props.userData.profile.contact.email }}</span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="field-name me-auto">
                  Phone:
                </span>
                <span class="alt-color">{{ props.userData.profile.contact.phone.country_code + props.userData.profile.contact.phone.number }}</span>
              </VListItemTitle>
            </VListItem>
            
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="field-name me-auto">Address: </span>
              </VListItemTitle>
              <span class="text-capitalize alt-color break-word">{{ props.userData.profile.contact.address1 }}</span>
            </VListItem>
          </VList>
          <VDivider class="my-4" />
          <!-- 👉 Practice Info -->
          <VList class="card-list mt-2">
            <div class="d-flex justify-space-between align-center mb-4">
              <h6 class="text-body-1 text-medium-emphasis mt-2">
                Professional Practice
              </h6>
              <VBtn
                size="small"
                variant="outlined"
                color="primary"
                @click="openEditDialog"
              >
                Edit Details
              </VBtn>
            </div>
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="font-weight-medium me-auto">Category:</span>
                <span class="alt-color ms-3">
                  {{ props.userData.professional_practice?.category || 'N/A' }}
                </span>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="font-weight-medium me-auto">Specialization:</span>
                <span class="alt-color ms-3">
                  {{ props.userData.professional_practice?.area_of_specialty || 'N/A' }}
                </span>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="font-weight-medium me-auto">Years of Experience:</span>
                <span class="alt-color ms-3">
                  {{ props.userData.professional_practice?.years_of_practice || 'N/A' }}
                </span>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="font-weight-medium me-auto">Consultation Fee:</span>
                <span class="alt-color ms-3">
                  ₦{{ props.userData.professional_practice?.consultation_fee?.toLocaleString() || 'N/A' }}
                </span>
              </VListItemTitle>
            </VListItem>
          </VList>
          <VDivider class="my-4" />

          <!-- 👉 Languages & Specialist Categories -->
          <VList class="card-list mt-2">
            <div class="d-flex justify-space-between align-center mb-4">
              <h6 class="text-body-1 text-medium-emphasis mt-2">
                Languages & Specialist Categories
              </h6>
              <VBtn
                size="small"
                variant="outlined"
                color="primary"
                @click="openLanguagesCategoriesDialog"
              >
                Edit
              </VBtn>
            </div>
            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium">Languages:</span>
              </VListItemTitle>
              <div class="mt-2">
                <VChip
                  v-for="lang in currentLanguages"
                  :key="lang._id"
                  size="small"
                  color="primary"
                  variant="tonal"
                  class="me-2 mb-2"
                >
                  {{ lang.name }}
                </VChip>
                <span v-if="currentLanguages.length === 0" class="text-medium-emphasis">
                  No languages assigned
                </span>
              </div>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium">Specialist Categories:</span>
              </VListItemTitle>
              <div class="mt-2">
                <VChip
                  v-for="cat in currentCategories"
                  :key="cat._id"
                  size="small"
                  color="info"
                  variant="tonal"
                  class="me-2 mb-2"
                >
                  {{ cat.name }}
                </VChip>
                <span v-if="currentCategories.length === 0" class="text-medium-emphasis">
                  No categories assigned
                </span>
              </div>
            </VListItem>
          </VList>

          <VDivider class="my-4" />

          <!-- 👉 Earnings list -->
          <VList class="card-list mt-2">
            <h6 class="text-body-1 text-medium-emphasis mt-2 mb-4">
              Earnings
            </h6>
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="font-weight-medium me-auto">Total Earned:</span>
                <span class="alt-color ms-3">
                  ₦{{ props.userData.earnings?.totalEarnings?.toLocaleString() || '0' }}
                </span>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="font-weight-medium me-auto">Withdrawn:</span>
                <span class="alt-color ms-3">
                  ₦{{ props.userData.earnings?.totalWithdrawals?.toLocaleString() || '0' }}
                </span>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="font-weight-medium me-auto">Balance:</span>
                <span class="alt-color ms-3 font-weight-bold">
                  ₦{{ ((props.userData.earnings?.totalEarnings || 0) - (props.userData.earnings?.totalWithdrawals || 0)).toLocaleString() }}
                </span>
              </VListItemTitle>
            </VListItem>
          </VList>
          <VDivider class="my-4" />
          
          <!-- 👉 Account Info list -->
          <VList class="card-list mt-2">
            <h6 class="text-body-1 text-medium-emphasis mt-2 mb-4">
              Account Information
            </h6>
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="font-weight-medium me-auto">Join Date:</span>
                <span class="alt-color">
                  {{ props.userData.created_at.slice(0, 10) }}
                </span>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="font-weight-medium me-auto">Subsciption Plan:</span>
                <span class="alt-color">
                  {{ props.userData.plan }}
                </span>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle class="d-flex">
                <span class="font-weight-medium me-auto">Last Seen:</span>
                <span class="alt-color">
                  {{ props.userData.updated_at.slice(0,10) }}
                </span>
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </VCol>
    <!-- !SECTION -->

    <!-- 👉 Edit Professional Details Dialog -->
    <VDialog
      v-model="isUserInfoEditDialogVisible"
      max-width="600"
    >
      <VCard title="Edit Professional Details">
        <VCardText>
          <VForm @submit.prevent="saveChanges">
            <VRow>
              <VCol cols="12">
                <VSelect
                  v-model="editForm.category"
                  label="Practice Category"
                  :items="specialistCategories"
                  density="compact"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="editForm.specialization"
                  label="Specialization"
                  density="compact"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="editForm.years_of_experience"
                  label="Years of Experience"
                  type="number"
                  density="compact"
                />
              </VCol>

              <VCol cols="12">
                <VTextField
                  v-model="editForm.consultation_fee"
                  label="Consultation Fee (₦)"
                  type="number"
                  density="compact"
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            color="error"
            variant="outlined"
            @click="isUserInfoEditDialogVisible = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="success"
            @click="saveChanges"
          >
            Save Changes
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- 👉 Edit Languages & Categories Dialog -->
    <VDialog
      v-model="isLanguagesCategoriesDialogVisible"
      max-width="600"
    >
      <VCard title="Edit Languages & Specialist Categories">
        <VCardText>
          <VForm @submit.prevent="saveLanguagesCategories">
            <VRow>
              <VCol cols="12">
                <VSelect
                  v-model="languagesCategoriesForm.selectedLanguages"
                  label="Languages Spoken"
                  :items="languageOptions"
                  item-title="title"
                  item-value="value"
                  multiple
                  chips
                  closable-chips
                  density="compact"
                  hint="Select all languages this specialist speaks"
                  persistent-hint
                />
              </VCol>

              <VCol cols="12">
                <VSelect
                  v-model="languagesCategoriesForm.selectedCategories"
                  label="Specialist Categories"
                  :items="categoryOptions"
                  item-title="title"
                  item-value="value"
                  multiple
                  chips
                  closable-chips
                  density="compact"
                  hint="Select all specialist categories this specialist belongs to"
                  persistent-hint
                />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            color="error"
            variant="outlined"
            @click="isLanguagesCategoriesDialogVisible = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="success"
            :loading="savingLanguagesCategories"
            @click="saveLanguagesCategories"
          >
            Save Changes
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VRow>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 0.8rem;
}

.current-plan {
  border: 2px solid rgb(var(--v-theme-primary));
}

.alt-color {
  color: #363636;
}

.email-color {
  color: #008C99;
}

.field-name {
  color: #6F6F6F;
  font-size: 16px;
}

.text-capitalize {
  text-transform: capitalize !important;
}

.break-word {
  word-wrap: break-word;
}
</style>
