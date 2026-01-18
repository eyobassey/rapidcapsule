<template>
  <VDialog v-model="dialogOpen" max-width="1000" persistent scrollable>
    <VCard>
      <VCardTitle class="d-flex align-center bg-primary">
        <VIcon class="mr-2" color="white">mdi-link-variant</VIcon>
        <span class="text-white">Similar Medications</span>
        <VSpacer />
        <VBtn icon variant="text" color="white" @click="close">
          <VIcon>mdi-close</VIcon>
        </VBtn>
      </VCardTitle>

      <VCardText class="pt-4" style="max-height: 70vh;">
        <!-- Drug Info Header -->
        <VCard v-if="drug" variant="tonal" class="mb-4">
          <VCardText class="d-flex align-center">
            <VAvatar size="48" color="grey-lighten-2" class="mr-3">
              <VImg v-if="drugImage" :src="drugImage" />
              <VIcon v-else>mdi-pill</VIcon>
            </VAvatar>
            <div class="flex-grow-1">
              <div class="text-h6">{{ drug.name }}</div>
              <div class="text-body-2 text-medium-emphasis">
                {{ drug.generic_name }} {{ drug.strength }}
              </div>
            </div>
          </VCardText>
        </VCard>

        <!-- Loading State -->
        <div v-if="loading" class="d-flex justify-center py-8">
          <VProgressCircular indeterminate color="primary" />
        </div>

        <template v-else>
          <!-- Stats Summary -->
          <VRow class="mb-4">
            <VCol cols="4">
              <VCard variant="outlined" class="text-center pa-3">
                <div class="text-h5 text-primary">{{ similarData.generic_matches?.length || 0 }}</div>
                <div class="text-caption text-medium-emphasis">Same Generic Name</div>
              </VCard>
            </VCol>
            <VCol cols="4">
              <VCard variant="outlined" class="text-center pa-3">
                <div class="text-h5 text-info">{{ similarData.category_matches?.length || 0 }}</div>
                <div class="text-caption text-medium-emphasis">Same Category</div>
              </VCard>
            </VCol>
            <VCol cols="4">
              <VCard variant="outlined" class="text-center pa-3">
                <div class="text-h5 text-success">{{ similarData.manually_linked?.length || 0 }}</div>
                <div class="text-caption text-medium-emphasis">Manually Linked</div>
              </VCard>
            </VCol>
          </VRow>

          <!-- Link New Drug Section -->
          <VCard variant="outlined" class="mb-4">
            <VCardText>
              <div class="d-flex align-center ga-3">
                <VAutocomplete
                  v-model="selectedDrugToLink"
                  :items="searchResults"
                  :loading="searching"
                  item-title="display_name"
                  item-value="_id"
                  return-object
                  label="Search for drug to link"
                  placeholder="Type drug name..."
                  prepend-inner-icon="mdi-magnify"
                  density="compact"
                  hide-details
                  clearable
                  class="flex-grow-1"
                  @update:search="searchDrugs"
                >
                  <template #item="{ item, props }">
                    <VListItem v-bind="props">
                      <template #prepend>
                        <VAvatar size="32" color="grey-lighten-2">
                          <VImg v-if="item.raw.image_url" :src="item.raw.image_url" />
                          <VIcon v-else size="16">mdi-pill</VIcon>
                        </VAvatar>
                      </template>
                      <VListItemTitle>{{ item.raw.name }}</VListItemTitle>
                      <VListItemSubtitle>{{ item.raw.generic_name }} {{ item.raw.strength }}</VListItemSubtitle>
                    </VListItem>
                  </template>
                </VAutocomplete>
                <VBtn
                  color="success"
                  variant="elevated"
                  :disabled="!selectedDrugToLink"
                  :loading="linking"
                  @click="linkDrug"
                >
                  <VIcon start>mdi-link-plus</VIcon>
                  Link
                </VBtn>
              </div>
            </VCardText>
          </VCard>

          <!-- Tabs for Different Categories -->
          <VTabs v-model="activeTab" color="primary" class="mb-4">
            <VTab value="generic">
              <VIcon start>mdi-pill</VIcon>
              Same Generic ({{ similarData.generic_matches?.length || 0 }})
            </VTab>
            <VTab value="category">
              <VIcon start>mdi-folder-outline</VIcon>
              Same Category ({{ similarData.category_matches?.length || 0 }})
            </VTab>
            <VTab value="manual">
              <VIcon start>mdi-link-variant</VIcon>
              Manually Linked ({{ similarData.manually_linked?.length || 0 }})
            </VTab>
            <VTab value="excluded">
              <VIcon start>mdi-eye-off</VIcon>
              Excluded ({{ excludedDrugs.length }})
            </VTab>
          </VTabs>

          <VWindow v-model="activeTab">
            <!-- Generic Matches Tab -->
            <VWindowItem value="generic">
              <VAlert v-if="!similarData.generic_matches?.length" type="info" variant="tonal" class="mb-4">
                No other drugs found with the same generic name ({{ drug?.generic_name }}).
              </VAlert>
              <VList v-else density="compact">
                <VListItem
                  v-for="item in similarData.generic_matches"
                  :key="item._id"
                  class="mb-2 rounded border"
                >
                  <template #prepend>
                    <VAvatar size="40" color="grey-lighten-2" class="mr-3">
                      <VImg v-if="item.image_url" :src="item.image_url" />
                      <VIcon v-else>mdi-pill</VIcon>
                    </VAvatar>
                  </template>
                  <VListItemTitle>{{ item.name }}</VListItemTitle>
                  <VListItemSubtitle>
                    {{ item.generic_name }} {{ item.strength }}
                    <span v-if="item.manufacturer">· {{ item.manufacturer }}</span>
                  </VListItemSubtitle>
                  <template #append>
                    <VChip size="x-small" color="primary" variant="outlined" class="mr-2">
                      Generic Match
                    </VChip>
                    <VBtn
                      icon
                      size="small"
                      color="error"
                      variant="text"
                      title="Exclude from similar"
                      @click="excludeDrug(item)"
                    >
                      <VIcon size="18">mdi-eye-off</VIcon>
                    </VBtn>
                  </template>
                </VListItem>
              </VList>
            </VWindowItem>

            <!-- Category Matches Tab -->
            <VWindowItem value="category">
              <VAlert v-if="!similarData.category_matches?.length" type="info" variant="tonal" class="mb-4">
                No other drugs found in the same therapeutic category.
              </VAlert>
              <VList v-else density="compact">
                <VListItem
                  v-for="item in similarData.category_matches"
                  :key="item._id"
                  class="mb-2 rounded border"
                >
                  <template #prepend>
                    <VAvatar size="40" color="grey-lighten-2" class="mr-3">
                      <VImg v-if="item.image_url" :src="item.image_url" />
                      <VIcon v-else>mdi-pill</VIcon>
                    </VAvatar>
                  </template>
                  <VListItemTitle>{{ item.name }}</VListItemTitle>
                  <VListItemSubtitle>
                    {{ item.generic_name }} {{ item.strength }}
                    <span v-if="item.manufacturer">· {{ item.manufacturer }}</span>
                  </VListItemSubtitle>
                  <template #append>
                    <VChip size="x-small" color="info" variant="outlined" class="mr-2">
                      Category Match
                    </VChip>
                    <VBtn
                      icon
                      size="small"
                      color="error"
                      variant="text"
                      title="Exclude from similar"
                      @click="excludeDrug(item)"
                    >
                      <VIcon size="18">mdi-eye-off</VIcon>
                    </VBtn>
                  </template>
                </VListItem>
              </VList>
            </VWindowItem>

            <!-- Manually Linked Tab -->
            <VWindowItem value="manual">
              <VAlert v-if="!similarData.manually_linked?.length" type="info" variant="tonal" class="mb-4">
                No drugs have been manually linked. Use the search above to add links.
              </VAlert>
              <VList v-else density="compact">
                <VListItem
                  v-for="item in similarData.manually_linked"
                  :key="item._id"
                  class="mb-2 rounded border"
                >
                  <template #prepend>
                    <VAvatar size="40" color="grey-lighten-2" class="mr-3">
                      <VImg v-if="item.image_url" :src="item.image_url" />
                      <VIcon v-else>mdi-pill</VIcon>
                    </VAvatar>
                  </template>
                  <VListItemTitle>{{ item.name }}</VListItemTitle>
                  <VListItemSubtitle>
                    {{ item.generic_name }} {{ item.strength }}
                    <span v-if="item.manufacturer">· {{ item.manufacturer }}</span>
                  </VListItemSubtitle>
                  <template #append>
                    <VChip size="x-small" color="success" variant="outlined" class="mr-2">
                      Manual Link
                    </VChip>
                    <VBtn
                      icon
                      size="small"
                      color="error"
                      variant="text"
                      title="Remove link"
                      @click="unlinkDrug(item)"
                    >
                      <VIcon size="18">mdi-link-off</VIcon>
                    </VBtn>
                  </template>
                </VListItem>
              </VList>
            </VWindowItem>

            <!-- Excluded Tab -->
            <VWindowItem value="excluded">
              <VAlert v-if="!excludedDrugs.length" type="info" variant="tonal" class="mb-4">
                No drugs have been excluded from similar medications.
              </VAlert>
              <VList v-else density="compact">
                <VListItem
                  v-for="item in excludedDrugs"
                  :key="item._id"
                  class="mb-2 rounded border"
                >
                  <template #prepend>
                    <VAvatar size="40" color="grey-lighten-2" class="mr-3">
                      <VImg v-if="item.image_url" :src="item.image_url" />
                      <VIcon v-else>mdi-pill</VIcon>
                    </VAvatar>
                  </template>
                  <VListItemTitle class="text-medium-emphasis">{{ item.name }}</VListItemTitle>
                  <VListItemSubtitle>
                    {{ item.generic_name }} {{ item.strength }}
                  </VListItemSubtitle>
                  <template #append>
                    <VChip size="x-small" color="grey" variant="outlined" class="mr-2">
                      Excluded
                    </VChip>
                    <VBtn
                      icon
                      size="small"
                      color="success"
                      variant="text"
                      title="Restore to similar"
                      @click="removeExclusion(item)"
                    >
                      <VIcon size="18">mdi-eye</VIcon>
                    </VBtn>
                  </template>
                </VListItem>
              </VList>
            </VWindowItem>
          </VWindow>
        </template>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VBtn variant="text" @click="close">Close</VBtn>
        <VSpacer />
        <VBtn color="primary" variant="text" :loading="loading" @click="refresh">
          <VIcon start>mdi-refresh</VIcon>
          Refresh
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  drug: Object,
})

const emit = defineEmits(['update:modelValue'])

// Helper to get auth token
const getAuthToken = () => {
  try {
    const tokenData = JSON.parse(localStorage.getItem('accessToken') || '{}')
    return tokenData.access_token || ''
  } catch (e) {
    return ''
  }
}

const dialogOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const loading = ref(false)
const syncing = ref(false)
const linking = ref(false)
const searching = ref(false)
const activeTab = ref('generic')

const similarData = ref({
  generic_matches: [],
  category_matches: [],
  manually_linked: [],
})

const excludedDrugs = ref([])
const searchResults = ref([])
const selectedDrugToLink = ref(null)

// Computed
const drugImage = computed(() => {
  if (!props.drug) return null
  return props.drug.image_url || props.drug.images?.[0]?.url || null
})

// Watchers
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.drug) {
    await fetchSimilarDrugs()
    await fetchExcludedDrugs()
  }
})

// Methods
const close = () => {
  dialogOpen.value = false
}

const refresh = async () => {
  await fetchSimilarDrugs()
  await fetchExcludedDrugs()
}

const fetchSimilarDrugs = async () => {
  if (!props.drug?._id) return

  loading.value = true
  try {
    const token = getAuthToken()
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/pharmacy/drugs/${props.drug._id}/similar/admin?limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (response.ok) {
      const data = await response.json()
      similarData.value = data.data || data.result || data
    }
  } catch (error) {
    console.error('Error fetching similar drugs:', error)
  } finally {
    loading.value = false
  }
}

const fetchExcludedDrugs = async () => {
  if (!props.drug?._id) return

  try {
    // Fetch the drug's excluded_similar_drugs and resolve them
    const token = getAuthToken()
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/pharmacy/drugs/${props.drug._id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (response.ok) {
      const data = await response.json()
      const drugData = data.data || data.result || data

      // Fetch details for each excluded drug
      if (drugData.excluded_similar_drugs?.length > 0) {
        const excludedPromises = drugData.excluded_similar_drugs.map(async (id) => {
          try {
            const resp = await fetch(
              `${import.meta.env.VITE_API_BASE_URL}/pharmacy/drugs/${id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            )
            if (resp.ok) {
              const d = await resp.json()
              return d.data || d.result || d
            }
          } catch (e) {
            console.error('Error fetching excluded drug:', e)
          }
          return null
        })

        const results = await Promise.all(excludedPromises)
        excludedDrugs.value = results.filter(Boolean)
      } else {
        excludedDrugs.value = []
      }
    }
  } catch (error) {
    console.error('Error fetching excluded drugs:', error)
  }
}

let searchTimeout = null
const searchDrugs = async (query) => {
  if (!query || query.length < 2) {
    searchResults.value = []
    return
  }

  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    searching.value = true
    try {
      const token = getAuthToken()
      const excludeParam = props.drug?._id ? `&exclude=${props.drug._id}` : ''
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/pharmacy/drugs?query=${encodeURIComponent(query)}&limit=10${excludeParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.ok) {
        const data = await response.json()
        // Response structure is { data: [...] } - direct array, not { data: { drugs: [...] } }
        const drugs = Array.isArray(data.data) ? data.data : (data.data?.drugs || data.result?.drugs || data.drugs || [])
        // Filter out the current drug and format display name
        searchResults.value = drugs
          .filter((d) => d._id !== props.drug?._id)
          .map((d) => ({
            ...d,
            display_name: `${d.name} - ${d.generic_name || ''} ${d.strength || ''}`.trim(),
          }))
      }
    } catch (error) {
      console.error('Error searching drugs:', error)
    } finally {
      searching.value = false
    }
  }, 300)
}

const linkDrug = async () => {
  if (!selectedDrugToLink.value || !props.drug?._id) return

  linking.value = true
  try {
    const token = getAuthToken()
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/pharmacy/drugs/${props.drug._id}/similar/link`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target_drug_id: selectedDrugToLink.value._id }),
      }
    )

    if (response.ok) {
      selectedDrugToLink.value = null
      await fetchSimilarDrugs()
    }
  } catch (error) {
    console.error('Error linking drug:', error)
  } finally {
    linking.value = false
  }
}

const unlinkDrug = async (targetDrug) => {
  if (!props.drug?._id || !targetDrug?._id) return

  try {
    const token = getAuthToken()
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/pharmacy/drugs/${props.drug._id}/similar/unlink/${targetDrug._id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (response.ok) {
      await fetchSimilarDrugs()
    }
  } catch (error) {
    console.error('Error unlinking drug:', error)
  }
}

const excludeDrug = async (targetDrug) => {
  if (!props.drug?._id || !targetDrug?._id) return

  try {
    const token = getAuthToken()
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/pharmacy/drugs/${props.drug._id}/similar/exclude`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target_drug_id: targetDrug._id }),
      }
    )

    if (response.ok) {
      await fetchSimilarDrugs()
      await fetchExcludedDrugs()
    }
  } catch (error) {
    console.error('Error excluding drug:', error)
  }
}

const removeExclusion = async (targetDrug) => {
  if (!props.drug?._id || !targetDrug?._id) return

  try {
    const token = getAuthToken()
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/pharmacy/drugs/${props.drug._id}/similar/exclude/${targetDrug._id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (response.ok) {
      await fetchSimilarDrugs()
      await fetchExcludedDrugs()
    }
  } catch (error) {
    console.error('Error removing exclusion:', error)
  }
}
</script>
