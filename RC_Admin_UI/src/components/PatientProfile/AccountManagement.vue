<template>
  <VCard>
    <VCardText>
      <h6 class="text-h6 mb-6">Account Management</h6>
      
      <!-- Account Status Section -->
      <VRow class="mb-6">
        <VCol cols="12">
          <h6 class="text-body-1 text-medium-emphasis mb-4">Current Status</h6>
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="d-flex align-center">
              <VIcon 
                :color="getStatusColor(userData.status)" 
                size="20" 
                class="mr-3"
              >
                {{ getStatusIcon(userData.status) }}
              </VIcon>
              <div>
                <h6 class="text-body-1 font-weight-medium">{{ userData.status || 'Active' }}</h6>
                <p class="text-caption text-medium-emphasis mb-0">
                  {{ getStatusDescription(userData.status) }}
                </p>
              </div>
            </div>
            <VChip
              :color="getStatusColor(userData.status)"
              variant="tonal"
              size="small"
            >
              {{ userData.status || 'Active' }}
            </VChip>
          </div>
        </VCol>
      </VRow>

      <VDivider class="mb-6" />

      <!-- Quick Status Actions -->
      <VRow class="mb-6">
        <VCol cols="12">
          <h6 class="text-body-1 text-medium-emphasis mb-4">Quick Actions</h6>
          <div class="d-flex flex-wrap gap-3">
            <VBtn
              v-if="userData.status !== 'suspended'"
              color="warning"
              variant="outlined"
              size="small"
              @click="openStatusChangeDialog('suspended')"
            >
              <VIcon start>mdi-account-cancel</VIcon>
              Suspend Account
            </VBtn>
            
            <VBtn
              v-if="userData.status === 'suspended'"
              color="success"
              variant="outlined"
              size="small"
              @click="openStatusChangeDialog('active')"
            >
              <VIcon start>mdi-account-check</VIcon>
              Reactivate Account
            </VBtn>
            
            <VBtn
              v-if="userData.status !== 'deactivated'"
              color="error"
              variant="outlined"
              size="small"
              @click="openStatusChangeDialog('deactivated')"
            >
              <VIcon start>mdi-account-off</VIcon>
              Deactivate Account
            </VBtn>

            <VBtn
              color="primary"
              variant="outlined"
              size="small"
              @click="resetPasswordDialog = true"
            >
              <VIcon start>mdi-lock-reset</VIcon>
              Reset Password
            </VBtn>

            <VBtn
              color="info"
              variant="outlined"
              size="small"
              @click="sendVerificationDialog = true"
            >
              <VIcon start>mdi-email-check</VIcon>
              Send Verification
            </VBtn>
          </div>
        </VCol>
      </VRow>

      <VDivider class="mb-6" />

      <!-- Premium Features Section -->
      <VRow class="mb-6">
        <VCol cols="12">
          <h6 class="text-body-1 text-medium-emphasis mb-4">Premium Features</h6>
          <VCard variant="outlined" class="pa-4">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <VIcon
                  color="primary"
                  size="24"
                  class="mr-3"
                >
                  mdi-robot
                </VIcon>
                <div>
                  <h6 class="text-body-1 font-weight-medium">Claude AI Health Summary</h6>
                  <p class="text-caption text-medium-emphasis mb-0">
                    Enable AI-generated health assessment summaries with personalized explanations and recommendations.
                  </p>
                </div>
              </div>
              <VSwitch
                v-model="claudeHealthSummaryEnabled"
                :loading="claudeToggleLoading"
                color="primary"
                hide-details
                @update:model-value="toggleClaudeHealthSummary"
              />
            </div>
            <VAlert
              v-if="claudeHealthSummaryEnabled"
              type="info"
              variant="tonal"
              class="mt-3"
              density="compact"
            >
              <VIcon start size="small">mdi-information</VIcon>
              This feature uses Claude AI to generate personalized health summaries for this patient's diagnoses.
            </VAlert>
          </VCard>
        </VCol>
      </VRow>

      <VDivider class="mb-6" />

      <!-- Account History -->
      <VRow class="mb-6">
        <VCol cols="12">
          <h6 class="text-body-1 text-medium-emphasis mb-4">Account History</h6>
          <VList class="py-0">
            <VListItem
              v-for="(history, index) in accountHistory"
              :key="index"
              class="px-0"
            >
              <template #prepend>
                <VIcon 
                  :color="history.color" 
                  size="16"
                  class="mr-3"
                >
                  {{ history.icon }}
                </VIcon>
              </template>
              <VListItemTitle class="text-body-2">
                {{ history.action }}
              </VListItemTitle>
              <VListItemSubtitle class="text-caption">
                {{ history.date }} by {{ history.admin }}
              </VListItemSubtitle>
            </VListItem>
          </VList>
        </VCol>
      </VRow>

      <VDivider class="mb-6" />

      <!-- Account Statistics -->
      <VRow>
        <VCol cols="12">
          <h6 class="text-body-1 text-medium-emphasis mb-4">Account Statistics</h6>
          <VList class="py-0">
            <VListItem class="px-0">
              <VListItemTitle class="d-flex justify-space-between">
                <span class="text-body-2">Member Since:</span>
                <span class="text-body-2 font-weight-medium">{{ formatDate(userData.created_at) }}</span>
              </VListItemTitle>
            </VListItem>
            <VListItem class="px-0">
              <VListItemTitle class="d-flex justify-space-between">
                <span class="text-body-2">Last Login:</span>
                <span class="text-body-2 font-weight-medium">
                  {{ userData.last_login_at ? formatDate(userData.last_login_at) : 'Never' }}
                </span>
              </VListItemTitle>
            </VListItem>
            <VListItem class="px-0">
              <VListItemTitle class="d-flex justify-space-between">
                <span class="text-body-2">Total Appointments:</span>
                <span class="text-body-2 font-weight-medium">{{ accountStats.totalAppointments }}</span>
              </VListItemTitle>
            </VListItem>
            <VListItem class="px-0">
              <VListItemTitle class="d-flex justify-space-between">
                <span class="text-body-2">Total Spent:</span>
                <span class="text-body-2 font-weight-medium">${{ accountStats.totalSpent }}</span>
              </VListItemTitle>
            </VListItem>
            <VListItem class="px-0">
              <VListItemTitle class="d-flex justify-space-between">
                <span class="text-body-2">Account Warnings:</span>
                <span class="text-body-2 font-weight-medium">{{ accountStats.warnings }}</span>
              </VListItemTitle>
            </VListItem>
          </VList>
        </VCol>
      </VRow>
    </VCardText>

    <!-- Status Change Dialog -->
    <VDialog v-model="statusChangeDialog" max-width="500">
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon 
            :color="getStatusColor(newStatus)" 
            class="mr-3"
          >
            {{ getStatusIcon(newStatus) }}
          </VIcon>
          {{ getActionTitle(newStatus) }}
        </VCardTitle>
        <VCardText>
          <VAlert 
            :type="getAlertType(newStatus)" 
            variant="tonal" 
            class="mb-4"
          >
            <VIcon start>mdi-information</VIcon>
            {{ getStatusWarning(newStatus) }}
          </VAlert>
          
          <VTextField
            v-model="statusReason"
            label="Reason for status change"
            placeholder="Enter reason for this action..."
            variant="outlined"
            rows="3"
            class="mb-4"
          />

          <VCheckbox
            v-model="notifyUser"
            label="Send notification to user"
            class="mb-2"
          />
          
          <VCheckbox
            v-if="newStatus === 'suspended'"
            v-model="temporarySuspension"
            label="Temporary suspension (30 days)"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn 
            color="secondary" 
            variant="outlined"
            @click="statusChangeDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn 
            :color="getStatusColor(newStatus)"
            :loading="statusUpdateLoading"
            @click="updateAccountStatus"
          >
            {{ getActionTitle(newStatus) }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Reset Password Dialog -->
    <VDialog v-model="resetPasswordDialog" max-width="400">
      <VCard>
        <VCardTitle>Reset Password</VCardTitle>
        <VCardText>
          <VAlert type="info" variant="tonal" class="mb-4">
            <VIcon start>mdi-information</VIcon>
            This will send a password reset email to the user.
          </VAlert>
          <p class="text-body-2">
            Are you sure you want to send a password reset email to <strong>{{ userData.profile?.contact?.email }}</strong>?
          </p>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn 
            color="secondary" 
            variant="outlined"
            @click="resetPasswordDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn 
            color="primary"
            :loading="resetPasswordLoading"
            @click="sendPasswordReset"
          >
            Send Reset Email
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Send Verification Dialog -->
    <VDialog v-model="sendVerificationDialog" max-width="400">
      <VCard>
        <VCardTitle>Send Verification Email</VCardTitle>
        <VCardText>
          <VAlert type="info" variant="tonal" class="mb-4">
            <VIcon start>mdi-information</VIcon>
            This will send an email verification link to the user.
          </VAlert>
          <p class="text-body-2">
            Send verification email to <strong>{{ userData.profile?.contact?.email }}</strong>?
          </p>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn 
            color="secondary" 
            variant="outlined"
            @click="sendVerificationDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn 
            color="info"
            :loading="verificationLoading"
            @click="sendVerificationEmail"
          >
            Send Verification
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Success Snackbar -->
    <VSnackbar
      v-model="successSnackbar"
      color="success"
      :timeout="3000"
    >
      {{ successMessage }}
    </VSnackbar>

    <!-- Error Snackbar -->
    <VSnackbar
      v-model="errorSnackbar"
      color="error"
      :timeout="5000"
    >
      {{ errorMessage }}
    </VSnackbar>
  </VCard>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { formatDate } from '@core/utils/formatters'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})

// Dialog states
const statusChangeDialog = ref(false)
const resetPasswordDialog = ref(false)
const sendVerificationDialog = ref(false)

// Loading states
const statusUpdateLoading = ref(false)
const resetPasswordLoading = ref(false)
const verificationLoading = ref(false)
const claudeToggleLoading = ref(false)

// Claude Health Summary state
const claudeHealthSummaryEnabled = ref(false)

// Form data
const newStatus = ref('')
const statusReason = ref('')
const notifyUser = ref(true)
const temporarySuspension = ref(false)

// Snackbar states
const successSnackbar = ref(false)
const errorSnackbar = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Account history (mock data - would come from API)
const accountHistory = ref([
  {
    action: 'Account created',
    date: formatDate(props.userData.created_at),
    admin: 'System',
    icon: 'mdi-account-plus',
    color: 'success'
  },
  {
    action: 'Profile completed',
    date: 'Sep 1, 2025',
    admin: 'System',
    icon: 'mdi-account-check',
    color: 'info'
  },
  {
    action: 'First appointment booked',
    date: 'Sep 5, 2025',
    admin: 'System',
    icon: 'mdi-calendar-plus',
    color: 'primary'
  }
])

// Account statistics (mock data - would come from API)
const accountStats = ref({
  totalAppointments: 12,
  totalSpent: 340.50,
  warnings: 0,
  lastPasswordChange: 'Aug 15, 2025'
})

// Get authentication token
const getAuthToken = () => {
  const session = JSON.parse(localStorage.getItem('admin_session') || '{}')
  return session.access_token
}

// Status helper methods
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'success'
    case 'suspended': return 'warning'
    case 'deactivated': return 'error'
    case 'pending': return 'info'
    default: return 'success'
  }
}

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'mdi-account-check'
    case 'suspended': return 'mdi-account-cancel'
    case 'deactivated': return 'mdi-account-off'
    case 'pending': return 'mdi-account-clock'
    default: return 'mdi-account-check'
  }
}

const getStatusDescription = (status) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'Account is active and fully functional'
    case 'suspended': return 'Account access is temporarily restricted'
    case 'deactivated': return 'Account has been permanently deactivated'
    case 'pending': return 'Account is pending verification'
    default: return 'Account is active and fully functional'
  }
}

const getActionTitle = (status) => {
  switch (status?.toLowerCase()) {
    case 'suspended': return 'Suspend Account'
    case 'active': return 'Activate Account'
    case 'deactivated': return 'Deactivate Account'
    default: return 'Update Status'
  }
}

const getStatusWarning = (status) => {
  switch (status?.toLowerCase()) {
    case 'suspended': return 'Suspending this account will prevent the user from accessing their account and services.'
    case 'active': return 'This will restore full access to the user\'s account and services.'
    case 'deactivated': return 'Deactivating this account will permanently disable access. This action should be used with caution.'
    default: return 'This action will change the account status.'
  }
}

const getAlertType = (status) => {
  switch (status?.toLowerCase()) {
    case 'suspended': return 'warning'
    case 'active': return 'success'
    case 'deactivated': return 'error'
    default: return 'info'
  }
}

// Open status change dialog
const openStatusChangeDialog = (status) => {
  newStatus.value = status
  statusReason.value = ''
  notifyUser.value = true
  temporarySuspension.value = false
  statusChangeDialog.value = true
}

// Update account status
const updateAccountStatus = async () => {
  if (!statusReason.value.trim()) {
    errorMessage.value = 'Please provide a reason for the status change'
    errorSnackbar.value = true
    return
  }

  statusUpdateLoading.value = true
  
  try {
    const token = getAuthToken()
    const response = await fetch(`/admin-api/dashboard/patient/${props.userData._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        status: newStatus.value,
        reason: statusReason.value,
        notify_user: notifyUser.value,
        temporary: temporarySuspension.value,
        admin_id: JSON.parse(localStorage.getItem('admin_session') || '{}').user_id
      })
    })

    const result = await response.json()
    
    if (response.ok) {
      // Update local data
      props.userData.status = newStatus.value
      
      // Add to history
      accountHistory.value.unshift({
        action: `Account ${newStatus.value}`,
        date: new Date().toLocaleDateString(),
        admin: 'Admin User',
        icon: getStatusIcon(newStatus.value),
        color: getStatusColor(newStatus.value)
      })
      
      successMessage.value = `Account status updated to ${newStatus.value}`
      successSnackbar.value = true
      statusChangeDialog.value = false
    } else {
      throw new Error(result.message || 'Failed to update status')
    }
  } catch (error) {
    console.error('Error updating status:', error)
    errorMessage.value = error.message || 'Failed to update account status'
    errorSnackbar.value = true
  } finally {
    statusUpdateLoading.value = false
  }
}

// Send password reset
const sendPasswordReset = async () => {
  resetPasswordLoading.value = true
  
  try {
    const token = getAuthToken()
    const response = await fetch(`/admin-api/dashboard/patient/${props.userData._id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        admin_id: JSON.parse(localStorage.getItem('admin_session') || '{}').user_id
      })
    })

    const result = await response.json()
    
    if (response.ok) {
      successMessage.value = 'Password reset email sent successfully'
      successSnackbar.value = true
      resetPasswordDialog.value = false
      
      // Add to history
      accountHistory.value.unshift({
        action: 'Password reset email sent',
        date: new Date().toLocaleDateString(),
        admin: 'Admin User',
        icon: 'mdi-lock-reset',
        color: 'primary'
      })
    } else {
      throw new Error(result.message || 'Failed to send reset email')
    }
  } catch (error) {
    console.error('Error sending password reset:', error)
    errorMessage.value = error.message || 'Failed to send password reset email'
    errorSnackbar.value = true
  } finally {
    resetPasswordLoading.value = false
  }
}

// Send verification email
const sendVerificationEmail = async () => {
  verificationLoading.value = true
  
  try {
    const token = getAuthToken()
    const response = await fetch(`/admin-api/dashboard/patient/${props.userData._id}/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        admin_id: JSON.parse(localStorage.getItem('admin_session') || '{}').user_id
      })
    })

    const result = await response.json()
    
    if (response.ok) {
      successMessage.value = 'Verification email sent successfully'
      successSnackbar.value = true
      sendVerificationDialog.value = false
      
      // Add to history
      accountHistory.value.unshift({
        action: 'Verification email sent',
        date: new Date().toLocaleDateString(),
        admin: 'Admin User',
        icon: 'mdi-email-check',
        color: 'info'
      })
    } else {
      throw new Error(result.message || 'Failed to send verification email')
    }
  } catch (error) {
    console.error('Error sending verification email:', error)
    errorMessage.value = error.message || 'Failed to send verification email'
    errorSnackbar.value = true
  } finally {
    verificationLoading.value = false
  }
}

// Toggle Claude Health Summary
const toggleClaudeHealthSummary = async (enabled) => {
  claudeToggleLoading.value = true

  try {
    const token = getAuthToken()
    const response = await fetch(`/admin-api/dashboard/patient/${props.userData._id}/claude-health-summary`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        enabled: enabled,
        admin_id: JSON.parse(localStorage.getItem('admin_session') || '{}').user_id
      })
    })

    const result = await response.json()

    if (response.ok) {
      successMessage.value = `Claude AI Health Summary ${enabled ? 'enabled' : 'disabled'} successfully`
      successSnackbar.value = true

      // Add to history
      accountHistory.value.unshift({
        action: `Claude AI Health Summary ${enabled ? 'enabled' : 'disabled'}`,
        date: new Date().toLocaleDateString(),
        admin: 'Admin User',
        icon: 'mdi-robot',
        color: enabled ? 'primary' : 'secondary'
      })
    } else {
      throw new Error(result.message || 'Failed to update Claude Health Summary setting')
    }
  } catch (error) {
    console.error('Error toggling Claude Health Summary:', error)
    // Revert the toggle
    claudeHealthSummaryEnabled.value = !enabled
    errorMessage.value = error.message || 'Failed to update Claude Health Summary setting'
    errorSnackbar.value = true
  } finally {
    claudeToggleLoading.value = false
  }
}

// Load Claude Health Summary status
const loadClaudeHealthSummaryStatus = async () => {
  if (!props.userData?._id) {
    console.log('User data not available yet for Claude status check')
    return
  }

  try {
    const token = getAuthToken()
    const response = await fetch(`/admin-api/dashboard/patient/${props.userData._id}/claude-health-summary-status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.statusCode === 200) {
        claudeHealthSummaryEnabled.value = result.data.enable_claude_health_summary || false
      }
    }
  } catch (error) {
    console.log('Claude Health Summary status not available:', error)
  }
}

// Load account statistics on mount
onMounted(async () => {
  if (!props.userData?._id) {
    console.log('User data not available on mount')
    return
  }

  // Load Claude Health Summary status
  loadClaudeHealthSummaryStatus()

  try {
    const token = getAuthToken()
    const response = await fetch(`/admin-api/dashboard/patient/${props.userData._id}/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const result = await response.json()
      if (result.statusCode === 200) {
        accountStats.value = {
          ...accountStats.value,
          ...result.data
        }
      }
    }
  } catch (error) {
    console.log('Stats not available:', error)
  }
})
</script>

<style scoped>
.v-list-item {
  min-height: auto !important;
  padding-block: 4px;
}

.v-list-item__prepend {
  align-self: flex-start;
  margin-top: 2px;
}
</style>