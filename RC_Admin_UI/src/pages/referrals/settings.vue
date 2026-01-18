<script setup>
import { ref, onMounted, computed } from 'vue'
import { useReferralsStore } from '@/stores/referrals'

const store = useReferralsStore()

const loading = ref(false)
const saving = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })

// Form data
const formData = ref({
  is_enabled: true,
  referrer_credits: 1,
  referee_credits: 1,
  referrer_points: 50,
  referee_points: 25,
  reward_on_signup: true,
  reward_on_first_appointment: false,
  share_messages: {
    whatsapp: '',
    twitter: '',
    facebook: '',
    linkedin: '',
    email_subject: '',
    email_body: '',
    sms: '',
  },
  hero_banner: {
    title: '',
    subtitle: '',
    background_color: '#0EAEC4',
    text_color: '#ffffff',
    show_stats: true,
  },
  milestones: [],
})

// Milestone dialog
const milestoneDialog = ref(false)
const editingMilestone = ref(null)
const milestoneForm = ref({
  referrals_required: 5,
  reward_type: 'credits',
  reward_value: 2,
  badge_name: '',
  badge_icon: 'star',
})

const badgeIcons = [
  { title: 'Star', value: 'star' },
  { title: 'Trophy', value: 'trophy' },
  { title: 'Crown', value: 'crown' },
  { title: 'Shield', value: 'shield' },
]

const rewardTypes = [
  { title: 'Credits', value: 'credits' },
  { title: 'Points', value: 'points' },
]

async function fetchSettings() {
  loading.value = true
  try {
    await store.fetchSettings()
    if (store.settings) {
      formData.value = {
        ...formData.value,
        ...store.settings,
        share_messages: {
          ...formData.value.share_messages,
          ...store.settings.share_messages,
        },
        hero_banner: {
          ...formData.value.hero_banner,
          ...store.settings.hero_banner,
        },
        milestones: store.settings.milestones || [],
      }
    }
  } catch (error) {
    snackbar.value = {
      show: true,
      message: error.message || 'Failed to load settings',
      color: 'error',
    }
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await store.updateSettings(formData.value)
    snackbar.value = {
      show: true,
      message: 'Settings saved successfully',
      color: 'success',
    }
  } catch (error) {
    snackbar.value = {
      show: true,
      message: error.message || 'Failed to save settings',
      color: 'error',
    }
  } finally {
    saving.value = false
  }
}

function openMilestoneDialog(milestone = null) {
  if (milestone) {
    editingMilestone.value = milestone
    milestoneForm.value = { ...milestone }
  } else {
    editingMilestone.value = null
    milestoneForm.value = {
      referrals_required: 5,
      reward_type: 'credits',
      reward_value: 2,
      badge_name: '',
      badge_icon: 'star',
    }
  }
  milestoneDialog.value = true
}

function saveMilestone() {
  if (editingMilestone.value) {
    const index = formData.value.milestones.findIndex(
      m => m.referrals_required === editingMilestone.value.referrals_required
    )
    if (index !== -1) {
      formData.value.milestones[index] = { ...milestoneForm.value }
    }
  } else {
    formData.value.milestones.push({ ...milestoneForm.value })
  }
  formData.value.milestones.sort((a, b) => a.referrals_required - b.referrals_required)
  milestoneDialog.value = false
}

function deleteMilestone(milestone) {
  formData.value.milestones = formData.value.milestones.filter(
    m => m.referrals_required !== milestone.referrals_required
  )
}

onMounted(fetchSettings)
</script>

<template>
  <VRow>
    <VCol cols="12">
      <div class="d-flex justify-space-between align-center mb-4">
        <div>
          <h4 class="text-h4 font-weight-bold">Referral Settings</h4>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Configure your referral program rewards and messages
          </p>
        </div>
        <VBtn
          color="primary"
          :loading="saving"
          @click="saveSettings"
        >
          <VIcon start icon="bx-save" />
          Save Changes
        </VBtn>
      </div>
    </VCol>

    <!-- General Settings -->
    <VCol cols="12" md="6">
      <VCard>
        <VCardTitle>General Settings</VCardTitle>
        <VCardText>
          <VSwitch
            v-model="formData.is_enabled"
            label="Enable Referral Program"
            color="primary"
            class="mb-4"
          />

          <VDivider class="mb-4" />

          <h6 class="text-h6 mb-3">Reward Configuration</h6>

          <VRow>
            <VCol cols="6">
              <VTextField
                v-model.number="formData.referrer_credits"
                type="number"
                label="Referrer Credits"
                hint="Credits given to the referrer"
                persistent-hint
              />
            </VCol>
            <VCol cols="6">
              <VTextField
                v-model.number="formData.referee_credits"
                type="number"
                label="Referee Credits"
                hint="Credits given to new user"
                persistent-hint
              />
            </VCol>
            <VCol cols="6">
              <VTextField
                v-model.number="formData.referrer_points"
                type="number"
                label="Referrer Points"
                hint="Points given to the referrer"
                persistent-hint
              />
            </VCol>
            <VCol cols="6">
              <VTextField
                v-model.number="formData.referee_points"
                type="number"
                label="Referee Points"
                hint="Points given to new user"
                persistent-hint
              />
            </VCol>
          </VRow>

          <VDivider class="my-4" />

          <h6 class="text-h6 mb-3">Reward Trigger</h6>

          <VRadioGroup v-model="formData.reward_on_signup">
            <VRadio
              :value="true"
              label="Reward on signup (immediately)"
            />
            <VRadio
              :value="false"
              label="Reward after first appointment"
            />
          </VRadioGroup>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Hero Banner Settings -->
    <VCol cols="12" md="6">
      <VCard>
        <VCardTitle>Hero Banner</VCardTitle>
        <VCardText>
          <VTextField
            v-model="formData.hero_banner.title"
            label="Banner Title"
            placeholder="Share the Gift of Health"
            class="mb-4"
          />

          <VTextarea
            v-model="formData.hero_banner.subtitle"
            label="Banner Subtitle"
            placeholder="Invite friends to Rapid Capsule and earn rewards"
            rows="2"
            class="mb-4"
          />

          <VRow>
            <VCol cols="6">
              <div class="mb-2">Background Color</div>
              <VTextField
                v-model="formData.hero_banner.background_color"
                type="color"
                hide-details
              />
            </VCol>
            <VCol cols="6">
              <div class="mb-2">Text Color</div>
              <VTextField
                v-model="formData.hero_banner.text_color"
                type="color"
                hide-details
              />
            </VCol>
          </VRow>

          <VSwitch
            v-model="formData.hero_banner.show_stats"
            label="Show Statistics in Banner"
            color="primary"
            class="mt-4"
          />

          <!-- Preview -->
          <div class="mt-4">
            <div class="text-caption mb-2">Preview</div>
            <div
              class="pa-4 rounded-lg"
              :style="{
                background: `linear-gradient(135deg, ${formData.hero_banner.background_color} 0%, ${formData.hero_banner.background_color}dd 100%)`,
                color: formData.hero_banner.text_color,
              }"
            >
              <h5 class="text-h6 font-weight-bold mb-1">
                {{ formData.hero_banner.title || 'Banner Title' }}
              </h5>
              <p class="text-body-2 mb-0" style="opacity: 0.9">
                {{ formData.hero_banner.subtitle || 'Banner subtitle text' }}
              </p>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Share Messages -->
    <VCol cols="12">
      <VCard>
        <VCardTitle>Share Messages</VCardTitle>
        <VCardSubtitle>
          Customize the messages users see when sharing. Use {link} as placeholder for the referral link.
        </VCardSubtitle>
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <VTextarea
                v-model="formData.share_messages.whatsapp"
                label="WhatsApp Message"
                rows="3"
                placeholder="Hey! Check out Rapid Capsule... {link}"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextarea
                v-model="formData.share_messages.twitter"
                label="Twitter Message"
                rows="3"
                placeholder="I just discovered @RapidCapsule... {link}"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextarea
                v-model="formData.share_messages.facebook"
                label="Facebook Message"
                rows="3"
                placeholder="Taking charge of my health with Rapid Capsule... {link}"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextarea
                v-model="formData.share_messages.linkedin"
                label="LinkedIn Message"
                rows="3"
                placeholder="Excited to share Rapid Capsule... {link}"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextField
                v-model="formData.share_messages.email_subject"
                label="Email Subject"
                placeholder="I thought you'd love this - Free AI Health Credits!"
              />
              <VTextarea
                v-model="formData.share_messages.email_body"
                label="Email Body"
                rows="4"
                placeholder="Hi there! I've been using Rapid Capsule... {link}"
                class="mt-3"
              />
            </VCol>
            <VCol cols="12" md="6">
              <VTextarea
                v-model="formData.share_messages.sms"
                label="SMS Message"
                rows="3"
                placeholder="Check out Rapid Capsule! {link}"
              />
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>

    <!-- Milestones -->
    <VCol cols="12">
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>Milestones</span>
          <VBtn
            color="primary"
            size="small"
            @click="openMilestoneDialog()"
          >
            <VIcon start icon="bx-plus" />
            Add Milestone
          </VBtn>
        </VCardTitle>
        <VCardText>
          <VTable v-if="formData.milestones.length > 0">
            <thead>
              <tr>
                <th>Badge</th>
                <th>Referrals Required</th>
                <th>Reward</th>
                <th class="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="milestone in formData.milestones" :key="milestone.referrals_required">
                <td>
                  <div class="d-flex align-center gap-2">
                    <VAvatar color="primary" variant="tonal" size="32">
                      <VIcon :icon="'bx-' + milestone.badge_icon" size="18" />
                    </VAvatar>
                    <span class="font-weight-medium">{{ milestone.badge_name }}</span>
                  </div>
                </td>
                <td>{{ milestone.referrals_required }} referrals</td>
                <td>
                  <VChip size="small" color="success" variant="tonal">
                    +{{ milestone.reward_value }} {{ milestone.reward_type }}
                  </VChip>
                </td>
                <td class="text-end">
                  <VBtn
                    icon
                    size="small"
                    variant="text"
                    @click="openMilestoneDialog(milestone)"
                  >
                    <VIcon icon="bx-edit" />
                  </VBtn>
                  <VBtn
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    @click="deleteMilestone(milestone)"
                  >
                    <VIcon icon="bx-trash" />
                  </VBtn>
                </td>
              </tr>
            </tbody>
          </VTable>
          <div v-else class="text-center py-8 text-medium-emphasis">
            No milestones configured. Add milestones to motivate users to refer more friends.
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <!-- Milestone Dialog -->
  <VDialog v-model="milestoneDialog" max-width="500">
    <VCard>
      <VCardTitle>
        {{ editingMilestone ? 'Edit Milestone' : 'Add Milestone' }}
      </VCardTitle>
      <VCardText>
        <VTextField
          v-model="milestoneForm.badge_name"
          label="Badge Name"
          placeholder="e.g., Health Advocate"
          class="mb-4"
        />
        <VTextField
          v-model.number="milestoneForm.referrals_required"
          type="number"
          label="Referrals Required"
          class="mb-4"
        />
        <VRow>
          <VCol cols="6">
            <VSelect
              v-model="milestoneForm.reward_type"
              :items="rewardTypes"
              label="Reward Type"
            />
          </VCol>
          <VCol cols="6">
            <VTextField
              v-model.number="milestoneForm.reward_value"
              type="number"
              label="Reward Value"
            />
          </VCol>
        </VRow>
        <VSelect
          v-model="milestoneForm.badge_icon"
          :items="badgeIcons"
          label="Badge Icon"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn variant="text" @click="milestoneDialog = false">Cancel</VBtn>
        <VBtn color="primary" @click="saveMilestone">Save</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Snackbar -->
  <VSnackbar
    v-model="snackbar.show"
    :color="snackbar.color"
    location="top end"
  >
    {{ snackbar.message }}
  </VSnackbar>

  <!-- Loading Overlay -->
  <VOverlay
    v-model="loading"
    class="align-center justify-center"
    persistent
  >
    <VProgressCircular indeterminate size="64" />
  </VOverlay>
</template>
