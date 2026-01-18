<script setup>
import {
  avatarText,
} from '@core/utils/formatters'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:userData'])

const isUserInfoEditDialogVisible = ref(false)
const editForm = ref({
  category: '',
  specialization: '',
  years_of_experience: '',
  consultation_fee: '',
})

const specialistCategories = [
  'General Practitioner',
  'Medical Doctor',
  'Pharmacist',
  'Therapist',
  'Nurse',
  'Physiotherapist',
]

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

const saveChanges = async () => {
  // Emit update event to parent
  emit('update:userData', editForm.value)
  isUserInfoEditDialogVisible.value = false
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
