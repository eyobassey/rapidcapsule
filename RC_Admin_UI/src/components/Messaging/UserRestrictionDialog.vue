<script setup>
import { ref, computed, watch } from 'vue'
import axios from '@axios'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  users: { type: Array, default: () => [] }, // [{ _id, name, user_type }]
})

const emit = defineEmits(['update:modelValue', 'applied'])

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// Form state
const restrictionType = ref('read_only')
const isIndefinite = ref(true)
const durationValue = ref(24)
const durationUnit = ref('hours')
const reason = ref('')
const enableMessageCap = ref(false)
const capLimit = ref(50)
const capPeriod = ref('daily')
const loading = ref(false)
const error = ref('')

const durationUnits = [
  { title: 'Hours', value: 'hours' },
  { title: 'Days', value: 'days' },
  { title: 'Weeks', value: 'weeks' },
  { title: 'Months', value: 'months' },
]

const userIds = computed(() => props.users.map((u) => u._id))

// Reset form when dialog opens
watch(show, (v) => {
  if (v) {
    restrictionType.value = 'read_only'
    isIndefinite.value = true
    durationValue.value = 24
    durationUnit.value = 'hours'
    reason.value = ''
    enableMessageCap.value = false
    capLimit.value = 50
    capPeriod.value = 'daily'
    error.value = ''
  }
})

const apply = async () => {
  if (!userIds.value.length) return
  loading.value = true
  error.value = ''

  try {
    // Apply restriction
    const restrictionPayload = {
      user_ids: userIds.value,
      type: restrictionType.value,
      reason: reason.value || undefined,
      duration: isIndefinite.value
        ? undefined
        : { value: durationValue.value, unit: durationUnit.value },
    }

    const { data } = await axios.post(
      `${apiBaseUrl}/messaging/restrictions`,
      restrictionPayload,
    )

    // Apply message cap if enabled
    if (enableMessageCap.value) {
      await axios.post(`${apiBaseUrl}/messaging/restrictions/message-cap`, {
        user_ids: userIds.value,
        limit: capLimit.value,
        period: capPeriod.value,
      })
    }

    emit('applied', {
      restriction: data?.result || data?.data,
      users: props.users,
      type: restrictionType.value,
    })
    show.value = false
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'Failed to apply restriction'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VDialog v-model="show" max-width="560" persistent>
    <VCard>
      <VCardTitle class="d-flex align-center gap-2 pa-4">
        <VIcon icon="bx-shield-x" color="warning" />
        <span>Restrict User Messaging</span>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-4">
        <!-- Affected users -->
        <div class="mb-4">
          <div class="text-caption text-medium-emphasis mb-1">Affected User(s)</div>
          <div class="d-flex gap-2 flex-wrap">
            <VChip
              v-for="user in users"
              :key="user._id"
              size="small"
              variant="tonal"
              :color="user.user_type === 'Specialist' ? 'success' : 'primary'"
            >
              {{ user.name }}
              <span class="text-caption ml-1">({{ user.user_type }})</span>
            </VChip>
          </div>
        </div>

        <!-- Restriction type -->
        <div class="mb-4">
          <div class="text-subtitle-2 mb-2">Restriction Type</div>
          <VRadioGroup v-model="restrictionType" inline hide-details>
            <VRadio label="Read-Only" value="read_only">
              <template #label>
                <div>
                  <span class="font-weight-medium">Read-Only</span>
                  <div class="text-caption text-medium-emphasis">Can receive but not send messages</div>
                </div>
              </template>
            </VRadio>
            <VRadio label="Full Block" value="blocked">
              <template #label>
                <div>
                  <span class="font-weight-medium">Full Block</span>
                  <div class="text-caption text-medium-emphasis">Cannot send or receive messages</div>
                </div>
              </template>
            </VRadio>
          </VRadioGroup>
        </div>

        <!-- Duration -->
        <div class="mb-4">
          <div class="text-subtitle-2 mb-2">Duration</div>
          <VSwitch
            v-model="isIndefinite"
            label="Indefinite (manual lift required)"
            hide-details
            density="compact"
            class="mb-2"
          />
          <div v-if="!isIndefinite" class="d-flex gap-3 align-center">
            <VTextField
              v-model.number="durationValue"
              type="number"
              label="Duration"
              min="1"
              density="compact"
              hide-details
              style="max-width: 120px"
            />
            <VSelect
              v-model="durationUnit"
              :items="durationUnits"
              label="Unit"
              density="compact"
              hide-details
              style="max-width: 160px"
            />
          </div>
        </div>

        <!-- Reason -->
        <div class="mb-4">
          <VTextarea
            v-model="reason"
            label="Reason (recommended)"
            placeholder="Describe why this restriction is being applied..."
            rows="2"
            auto-grow
            density="compact"
            hide-details
          />
        </div>

        <!-- Message cap -->
        <VExpansionPanels variant="accordion" class="mb-2">
          <VExpansionPanel>
            <VExpansionPanelTitle>
              <div class="d-flex align-center gap-2">
                <VIcon icon="bx-message-alt-x" size="20" />
                <span>Message Cap</span>
                <VChip v-if="enableMessageCap" size="x-small" color="info" variant="tonal">
                  {{ capLimit }}/{{ capPeriod }}
                </VChip>
              </div>
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <VSwitch
                v-model="enableMessageCap"
                label="Enable message cap"
                hide-details
                density="compact"
                class="mb-3"
              />
              <div v-if="enableMessageCap" class="d-flex gap-3 align-center">
                <VTextField
                  v-model.number="capLimit"
                  type="number"
                  label="Message limit"
                  min="1"
                  density="compact"
                  hide-details
                  style="max-width: 140px"
                />
                <VSelect
                  v-model="capPeriod"
                  :items="[{ title: 'Per Day', value: 'daily' }, { title: 'Per Month', value: 'monthly' }]"
                  label="Period"
                  density="compact"
                  hide-details
                  style="max-width: 160px"
                />
              </div>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>

        <!-- Error -->
        <VAlert v-if="error" type="error" density="compact" class="mt-3">
          {{ error }}
        </VAlert>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn variant="text" @click="show = false" :disabled="loading">Cancel</VBtn>
        <VBtn
          :color="restrictionType === 'blocked' ? 'error' : 'warning'"
          :loading="loading"
          @click="apply"
        >
          Apply {{ restrictionType === 'blocked' ? 'Block' : 'Restriction' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
