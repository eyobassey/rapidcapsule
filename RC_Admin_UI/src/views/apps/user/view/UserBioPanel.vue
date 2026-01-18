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

const standardPlan = {
  plan: 'Standard',
  price: 99,
  benefits: [
    '10 Users',
    'Up to 10GB storage',
    'Basic Support',
  ],
}

const isUserInfoEditDialogVisible = ref(false)
const isUpgradePlanDialogVisible = ref(false)

const resolveUserStatusVariant = stat => {
  if (stat === 'pending')
    return 'warning'
  if (stat === 'active')
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
              {{ avatarText(props.userData.fullName) }}
            </span>
          </VAvatar>

          <!-- 👉 User fullName -->
          <h6 class="text-h6 mt-4">
            {{ props.userData.fullName }}
          </h6>

          <!-- 👉 Verification chip -->
          <VChip
            label
            density="compact"
            :color="resolveUserStatusVariant(props.userData.status)"
          >
            {{ props.userData.status }}
          </VChip>
        </VCardText>

       

        <!-- 👉 Details -->
        <VCardText>
          <VDivider class="my-4" />
          <!-- 👉 User Details list -->
          <VList class="card-list mt-2">
            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium me-1">License No.:</span>
                <span class="text-body-1 text-medium-emphasis">
                  @{{ props.userData.username }}
                </span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium me-1">
                  Gender:
                </span>
                <span class="text-body-1 text-medium-emphasis">{{ props.userData.gender }}</span>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium me-1">
                  DOB:
                </span>
                <span class="text-body-1 text-medium-emphasis">{{ props.userData.dob }}</span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium me-1">
                  Marital Status:
                </span>
                <VChip
                  label
                  density="compact"
                  :color="resolveUserStatusVariant(props.userData.status)"
                >
                  {{ props.userData.status }}
                </VChip>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium me-1">
                  Email:
                </span>
                <span class="text-body-1 text-medium-emphasis">{{ props.userData.email }}</span>
              </VListItemTitle>
            </VListItem>

            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium me-1">
                  Phone:
                </span>
                <span class="text-body-1 text-medium-emphasis">{{ props.userData.contact }}</span>
              </VListItemTitle>
            </VListItem>
            
            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium me-1">Address: </span>
              </VListItemTitle>
              <span class="text-capitalize text-body-1 text-medium-emphasis break-word">{{ props.userData.address }}</span>
            </VListItem>
          </VList>
          <VDivider class="my-4" />
          <!-- 👉 Earnings list -->

          <VList class="card-list mt-2">
            <h6 class="text-body-1 text-medium-emphasis mt-2 mb-4">
              Earnings
            </h6>
            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium me-1">Total:</span>
                <span class="text-body-1 text-medium-emphasis ms-3">
                  {{ props.userData.totalEarnings }}
                </span>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium me-1">Withdrawn:</span>
                <span class="text-body-1 text-medium-emphasis ms-3">
                  {{ props.userData.withdrawnEarnings }}
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
              <VListItemTitle>
                <span class="font-weight-medium me-1">Join Date:</span>
                <span class="text-body-1 text-medium-emphasis">
                  {{ props.userData.dob }}
                </span>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium me-1">Subsciption Plan:</span>
                <span class="text-body-1 text-medium-emphasis">
                  {{ props.userData.subscription }}
                </span>
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                <span class="font-weight-medium me-1">Last Seen:</span>
                <span class="text-body-1 text-medium-emphasis">
                  {{ props.userData.lastSeen }}
                </span>
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCardText>

        <!-- 👉 Edit and Suspend button -->
        <VCardText class="d-flex justify-center">
          <VBtn
            variant="elevated"
            class="me-4"
            @click="isUserInfoEditDialogVisible = true"
          >
            Edit
          </VBtn>

          <VBtn
            variant="tonal"
            color="error"
          >
            Suspend
          </VBtn>
        </VCardText>
      </VCard>
    </VCol>
    <!-- !SECTION -->
  </VRow>

  <!-- 👉 Edit user info dialog -->
  <UserInfoEditDialog
    v-model:isDialogVisible="isUserInfoEditDialogVisible"
    :user-data="props.userData"
  />

  <!-- 👉 Upgrade plan dialog -->
  <UserUpgradePlanDialog v-model:isDialogVisible="isUpgradePlanDialogVisible" />
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 0.8rem;
}

.current-plan {
  border: 2px solid rgb(var(--v-theme-primary));
}

.text-capitalize {
  text-transform: capitalize !important;
}

.break-word {
  word-wrap: break-word;
}
</style>
