<script setup>
import {
  avatarText,
  formatDate } from '@core/utils/formatters'
import { computed } from 'vue'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})

const fullName = computed(() => props.userData.first_name + ' ' + props.userData.last_name)
const phoneNumber = computed(() => props.userData.phone.country_code + props.userData.phone.number)

const address = computed(() => {
  if(props.userData.profile.contact.address1) {
    return props.userData.profile.contact.address1
    + (props.userData.profile.contact.state? ', ' 
    + props.userData.profile.contact.state : '' )
    + (props.userData.profile.contact.country ? ', ' 
    + props.userData.profile.contact.country : '')
  } else {
    return ''
  }
})

const resolveUserStatusVariant = stat => {
  stat = stat.toLowerCase()
  if (stat === 'pending')
    return 'warning'
  if (stat === 'active')
    return 'success'
  if (stat === 'inactive')
    return 'secondary'
  
  return 'primary'
}
</script>

<template>
  <div v-if="props.userData">
    <VCardText class="text-center pt-15">
      <!-- 👉 Avatar -->
      <div class="profile-avatar-outer">
        <VAvatar
          rounded
          :size="120"
          color="primary"
          variant="tonal"
          style="border-radius: 50%"
        >
        <!-- 
          <VImg
            v-if="props.userData.profile.profile_photo"
            :src="props.userData.profile.profile_photo"
          />
        -->
          <span
            class="text-5xl font-weight-semibold"
          >
            {{ avatarText(fullName) }}
          </span>
        </VAvatar>
      </div>

      <!-- 👉 User fullName -->
      <h2
        class=" mt-4"
        style="color:#151515"
      >
        {{ fullName }}

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
      <!-- 👉 User Details list -->
      <VList class="card-list mt-2">
        <VListItem>
          <VListItemTitle class="d-flex">
            <span class="font-weight-medium mr-auto">
              ID:
            </span>
            <span
              class="patient-prof-alt-color"
            >{{ props.userData.email }}</span>
          </VListItemTitle>
        </VListItem>
        <VListItem>
          <VListItemTitle class="d-flex">
            <span class="font-weight-medium mr-auto">
              Gender:
            </span>
            <!-- <span class="patient-prof-alt-color">{{ formatDate(props.userData.profile.date_of_birth) }}</span> -->
          </VListItemTitle>
        </VListItem>

        <VSpacer class="mt-4" />

        <VListItem>
          <VListItemTitle class="d-flex">
            <span class="font-weight-medium mr-auto">
              Email:
            </span>
            <span class="sec-color">{{ props.userData.email }}</span>
          </VListItemTitle>
        </VListItem>

        <VListItem>
          <VListItemTitle class="d-flex">
            <span class="font-weight-medium mr-auto">
              Phone:
            </span>
            <span class="patient-prof-alt-color">
              {{ phoneNumber }}
            </span>
          </VListItemTitle>
        </VListItem>
            
        <VSpacer class="mt-4" />

        <VListItem>
          <VListItemTitle class="d-flex">
            <span class="font-weight-medium mr-auto">Address: </span>
          </VListItemTitle>
          <span
            class=" break-word patient-prof-alt-color"
          >
          {{ props.userData.email }}
          <!-- {{ address }} -->
          </span>
        </VListItem>
      </VList>

      <VSpacer class="mt-8" />
      
      <!-- 👉 Account Info list -->
      <VList class="card-list mt-2">
        <h6 class="text-body-1 text-medium-emphasis mt-2 mb-4">
          Account Information
        </h6>
        <VListItem>
          <VListItemTitle class="d-flex">
            <span class="font-weight-medium mr-auto">Join Date:</span>
            <span class="patient-prof-alt-color-fade">
              {{ formatDate(props.userData.created_at) }}
            </span>
          </VListItemTitle>
        </VListItem>
        <VListItem>
          <VListItemTitle class="d-flex">
            <span class="font-weight-medium mr-auto">Last Seen:</span>
            <span class="patient-prof-alt-color-fade">
              {{ props.userData.lastSeen }}
            </span>
          </VListItemTitle>
        </VListItem>
      </VList>
    </VCardText>
    <!-- !SECTION -->
  </div>
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

.profile-avatar-outside {
  border: 2px solid #E5E5E5; 
  border-radius: 50%; 
  width: 131px; 
  height: 131px; 
  margin: 0 auto; 
  padding: 4px;
}

.patient-prof-alt-color {
  color: #363636;
}

.patient-prof-alt-color-fade {
  color: #6F6F6F;
}

.break-word {
  word-wrap: break-word;
}
</style>
