<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAdvancedHealthScoreStore } from '@/stores/advancedHealthScore'

const store = useAdvancedHealthScoreStore()

const loading = ref(false)
const snackbar = ref({ show: false, message: '', color: 'success' })
const showDialog = ref(false)
const dialogMode = ref('create') // 'create' or 'edit'
const selectedQuestion = ref(null)
const activeTab = ref(null)

// Domain options
const domainOptions = [
  { title: 'Cardiovascular Health', value: 'cardiovascular' },
  { title: 'Metabolic Health', value: 'metabolic' },
  { title: 'Mental Wellbeing', value: 'mental_wellbeing' },
  { title: 'Lifestyle Factors', value: 'lifestyle' },
  { title: 'Physical Symptoms', value: 'physical_symptoms' },
  { title: 'Preventive Care', value: 'preventive_care' },
]

// Question type options
const questionTypeOptions = [
  { title: 'Yes/No', value: 'yes_no' },
  { title: 'Single Choice', value: 'single_choice' },
  { title: 'Multiple Choice', value: 'multiple_choice' },
  { title: 'Scale (1-10)', value: 'scale' },
  { title: 'Text', value: 'text' },
]

// Form data
const defaultFormData = {
  domain: 'cardiovascular',
  domain_order: 1,
  question_order: 1,
  question_text: '',
  question_type: 'yes_no',
  options: [
    { value: 'yes', label: 'Yes', score_weight: 0 },
    { value: 'no', label: 'No', score_weight: 0 },
  ],
  scale_config: { min: 1, max: 10, min_label: 'Low', max_label: 'High' },
  is_required: true,
  help_text: '',
  is_active: true,
}

const formData = ref({ ...defaultFormData })

// Computed
const questionsByDomain = computed(() => store.questionsByDomain || {})

const domainTabs = computed(() => {
  return domainOptions.map(d => ({
    ...d,
    questions: questionsByDomain.value[d.value]?.questions || [],
    count: questionsByDomain.value[d.value]?.questions?.length || 0,
  }))
})

const showOptions = computed(() => {
  return ['yes_no', 'single_choice', 'multiple_choice'].includes(formData.value.question_type)
})

const showScale = computed(() => {
  return formData.value.question_type === 'scale'
})

// Methods
const fetchQuestions = async () => {
  loading.value = true
  try {
    await store.fetchQuestionsByDomain()
    if (!activeTab.value && domainTabs.value.length) {
      activeTab.value = domainTabs.value[0].value
    }
  } catch (error) {
    snackbar.value = { show: true, message: 'Failed to load questions', color: 'error' }
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  dialogMode.value = 'create'
  formData.value = { ...defaultFormData }
  // Set domain based on active tab
  if (activeTab.value) {
    formData.value.domain = activeTab.value
    const domain = domainOptions.find(d => d.value === activeTab.value)
    formData.value.domain_order = domain ? domainOptions.indexOf(domain) + 1 : 1
  }
  // Set next question order
  const domainQuestions = questionsByDomain.value[formData.value.domain]?.questions || []
  formData.value.question_order = domainQuestions.length + 1
  showDialog.value = true
}

const openEditDialog = (question) => {
  dialogMode.value = 'edit'
  selectedQuestion.value = question
  formData.value = {
    domain: question.domain,
    domain_order: question.domain_order,
    question_order: question.question_order,
    question_text: question.question_text,
    question_type: question.question_type,
    options: question.options?.length ? [...question.options] : [
      { value: 'yes', label: 'Yes', score_weight: 0 },
      { value: 'no', label: 'No', score_weight: 0 },
    ],
    scale_config: question.scale_config || { min: 1, max: 10, min_label: 'Low', max_label: 'High' },
    is_required: question.is_required ?? true,
    help_text: question.help_text || '',
    is_active: question.is_active ?? true,
  }
  showDialog.value = true
}

const saveQuestion = async () => {
  try {
    const adminId = localStorage.getItem('adminId') || 'admin'

    if (dialogMode.value === 'create') {
      await store.createQuestion(formData.value, adminId)
      snackbar.value = { show: true, message: 'Question created successfully', color: 'success' }
    } else {
      await store.updateQuestion(selectedQuestion.value._id, formData.value)
      snackbar.value = { show: true, message: 'Question updated successfully', color: 'success' }
    }

    showDialog.value = false
    await fetchQuestions()
  } catch (error) {
    snackbar.value = { show: true, message: error.message || 'Failed to save question', color: 'error' }
  }
}

const deleteQuestion = async (question) => {
  if (!confirm(`Are you sure you want to delete this question?\n\n"${question.question_text}"`)) {
    return
  }

  try {
    await store.deleteQuestion(question._id)
    snackbar.value = { show: true, message: 'Question deleted successfully', color: 'success' }
    await fetchQuestions()
  } catch (error) {
    snackbar.value = { show: true, message: error.message || 'Failed to delete question', color: 'error' }
  }
}

const toggleQuestionActive = async (question) => {
  try {
    await store.updateQuestion(question._id, { is_active: !question.is_active })
    snackbar.value = {
      show: true,
      message: `Question ${!question.is_active ? 'activated' : 'deactivated'}`,
      color: 'success'
    }
    await fetchQuestions()
  } catch (error) {
    snackbar.value = { show: true, message: 'Failed to update question', color: 'error' }
  }
}

const addOption = () => {
  formData.value.options.push({ value: '', label: '', score_weight: 0 })
}

const removeOption = (index) => {
  if (formData.value.options.length > 2) {
    formData.value.options.splice(index, 1)
  }
}

const getQuestionTypeLabel = (type) => {
  return questionTypeOptions.find(t => t.value === type)?.title || type
}

const getQuestionTypeColor = (type) => {
  const colors = {
    yes_no: 'primary',
    single_choice: 'info',
    multiple_choice: 'warning',
    scale: 'success',
    text: 'secondary',
  }
  return colors[type] || 'default'
}

onMounted(() => {
  fetchQuestions()
})
</script>

<template>
  <div>
    <!-- Header -->
    <VCard class="mb-6" color="primary" variant="tonal">
      <VCardText class="d-flex align-center justify-space-between flex-wrap" style="gap: 16px">
        <div>
          <h2 class="text-h4 font-weight-bold mb-2">Questions Management</h2>
          <p class="text-subtitle-1 mb-0">Manage assessment questions by health domain</p>
        </div>
        <div class="d-flex" style="gap: 12px">
          <VBtn color="secondary" variant="outlined" :to="{ name: 'advanced-health-score' }">
            <VIcon start>mdi-arrow-left</VIcon>
            Back
          </VBtn>
          <VBtn color="primary" @click="openCreateDialog">
            <VIcon start>mdi-plus</VIcon>
            Add Question
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Domain Tabs -->
    <VCard :loading="loading">
      <VTabs v-model="activeTab" color="primary" slider-color="primary">
        <VTab
          v-for="domain in domainTabs"
          :key="domain.value"
          :value="domain.value"
        >
          {{ domain.title }}
          <VChip size="x-small" class="ms-2" color="primary" variant="tonal">
            {{ domain.count }}
          </VChip>
        </VTab>
      </VTabs>

      <VDivider />

      <VWindow v-model="activeTab">
        <VWindowItem
          v-for="domain in domainTabs"
          :key="domain.value"
          :value="domain.value"
        >
          <VCardText>
            <div v-if="domain.questions.length === 0" class="text-center py-8">
              <VIcon size="64" color="grey-lighten-1" class="mb-4">mdi-help-circle-outline</VIcon>
              <p class="text-medium-emphasis">No questions in this domain yet</p>
              <VBtn color="primary" variant="outlined" @click="openCreateDialog" class="mt-2">
                Add First Question
              </VBtn>
            </div>

            <VList v-else lines="three">
              <template v-for="(question, index) in domain.questions" :key="question._id">
                <VListItem>
                  <template #prepend>
                    <VAvatar color="primary" variant="tonal" size="40">
                      {{ question.question_order }}
                    </VAvatar>
                  </template>

                  <VListItemTitle class="font-weight-medium">
                    {{ question.question_text }}
                  </VListItemTitle>

                  <VListItemSubtitle>
                    <div class="d-flex align-center mt-1" style="gap: 8px">
                      <VChip :color="getQuestionTypeColor(question.question_type)" size="x-small">
                        {{ getQuestionTypeLabel(question.question_type) }}
                      </VChip>
                      <VChip v-if="question.is_required" color="error" size="x-small" variant="outlined">
                        Required
                      </VChip>
                      <VChip v-if="!question.is_active" color="warning" size="x-small">
                        Inactive
                      </VChip>
                      <span v-if="question.help_text" class="text-caption text-grey">
                        <VIcon size="14" class="me-1">mdi-information</VIcon>
                        {{ question.help_text }}
                      </span>
                    </div>
                  </VListItemSubtitle>

                  <template #append>
                    <div class="d-flex align-center" style="gap: 4px">
                      <VBtn icon variant="text" size="small" @click="openEditDialog(question)">
                        <VIcon>mdi-pencil</VIcon>
                      </VBtn>
                      <VBtn
                        icon
                        variant="text"
                        size="small"
                        :color="question.is_active ? 'warning' : 'success'"
                        @click="toggleQuestionActive(question)"
                      >
                        <VIcon>{{ question.is_active ? 'mdi-eye-off' : 'mdi-eye' }}</VIcon>
                      </VBtn>
                      <VBtn icon variant="text" size="small" color="error" @click="deleteQuestion(question)">
                        <VIcon>mdi-delete</VIcon>
                      </VBtn>
                    </div>
                  </template>
                </VListItem>
                <VDivider v-if="index < domain.questions.length - 1" />
              </template>
            </VList>
          </VCardText>
        </VWindowItem>
      </VWindow>
    </VCard>

    <!-- Create/Edit Dialog -->
    <VDialog v-model="showDialog" max-width="700" persistent>
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <span>{{ dialogMode === 'create' ? 'Add New Question' : 'Edit Question' }}</span>
          <VBtn icon variant="text" @click="showDialog = false">
            <VIcon>mdi-close</VIcon>
          </VBtn>
        </VCardTitle>

        <VDivider />

        <VCardText class="pt-4">
          <VForm @submit.prevent="saveQuestion">
            <VRow>
              <!-- Question Text -->
              <VCol cols="12">
                <VTextarea
                  v-model="formData.question_text"
                  label="Question Text"
                  variant="outlined"
                  rows="2"
                  required
                />
              </VCol>

              <!-- Domain & Type -->
              <VCol cols="12" md="6">
                <VSelect
                  v-model="formData.domain"
                  :items="domainOptions"
                  item-title="title"
                  item-value="value"
                  label="Health Domain"
                  variant="outlined"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="formData.question_type"
                  :items="questionTypeOptions"
                  item-title="title"
                  item-value="value"
                  label="Question Type"
                  variant="outlined"
                />
              </VCol>

              <!-- Order -->
              <VCol cols="6" md="3">
                <VTextField
                  v-model.number="formData.domain_order"
                  label="Domain Order"
                  type="number"
                  variant="outlined"
                  :min="1"
                  :max="10"
                />
              </VCol>
              <VCol cols="6" md="3">
                <VTextField
                  v-model.number="formData.question_order"
                  label="Question Order"
                  type="number"
                  variant="outlined"
                  :min="1"
                  :max="50"
                />
              </VCol>

              <!-- Toggles -->
              <VCol cols="6" md="3">
                <VSwitch
                  v-model="formData.is_required"
                  label="Required"
                  color="primary"
                />
              </VCol>
              <VCol cols="6" md="3">
                <VSwitch
                  v-model="formData.is_active"
                  label="Active"
                  color="success"
                />
              </VCol>

              <!-- Help Text -->
              <VCol cols="12">
                <VTextField
                  v-model="formData.help_text"
                  label="Help Text (optional)"
                  variant="outlined"
                  hint="Additional guidance shown to the patient"
                />
              </VCol>

              <!-- Options for Choice Questions -->
              <VCol cols="12" v-if="showOptions">
                <VCard variant="outlined">
                  <VCardTitle class="text-subtitle-1 d-flex align-center justify-space-between">
                    <span>Answer Options</span>
                    <VBtn size="small" color="primary" variant="text" @click="addOption">
                      <VIcon start>mdi-plus</VIcon>
                      Add Option
                    </VBtn>
                  </VCardTitle>
                  <VCardText>
                    <div v-for="(option, index) in formData.options" :key="index" class="mb-3">
                      <VRow align="center">
                        <VCol cols="4">
                          <VTextField
                            v-model="option.value"
                            label="Value"
                            variant="outlined"
                            density="compact"
                          />
                        </VCol>
                        <VCol cols="4">
                          <VTextField
                            v-model="option.label"
                            label="Label"
                            variant="outlined"
                            density="compact"
                          />
                        </VCol>
                        <VCol cols="3">
                          <VTextField
                            v-model.number="option.score_weight"
                            label="Score Weight"
                            type="number"
                            variant="outlined"
                            density="compact"
                            :min="-10"
                            :max="10"
                          />
                        </VCol>
                        <VCol cols="1">
                          <VBtn
                            icon
                            variant="text"
                            color="error"
                            size="small"
                            @click="removeOption(index)"
                            :disabled="formData.options.length <= 2"
                          >
                            <VIcon>mdi-delete</VIcon>
                          </VBtn>
                        </VCol>
                      </VRow>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <!-- Scale Config -->
              <VCol cols="12" v-if="showScale">
                <VCard variant="outlined">
                  <VCardTitle class="text-subtitle-1">Scale Configuration</VCardTitle>
                  <VCardText>
                    <VRow>
                      <VCol cols="6" md="3">
                        <VTextField
                          v-model.number="formData.scale_config.min"
                          label="Min Value"
                          type="number"
                          variant="outlined"
                          density="compact"
                        />
                      </VCol>
                      <VCol cols="6" md="3">
                        <VTextField
                          v-model.number="formData.scale_config.max"
                          label="Max Value"
                          type="number"
                          variant="outlined"
                          density="compact"
                        />
                      </VCol>
                      <VCol cols="6" md="3">
                        <VTextField
                          v-model="formData.scale_config.min_label"
                          label="Min Label"
                          variant="outlined"
                          density="compact"
                        />
                      </VCol>
                      <VCol cols="6" md="3">
                        <VTextField
                          v-model="formData.scale_config.max_label"
                          label="Max Label"
                          variant="outlined"
                          density="compact"
                        />
                      </VCol>
                    </VRow>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4">
          <VSpacer />
          <VBtn color="secondary" variant="outlined" @click="showDialog = false">
            Cancel
          </VBtn>
          <VBtn color="primary" @click="saveQuestion" :loading="store.loading">
            {{ dialogMode === 'create' ? 'Create Question' : 'Save Changes' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>
  </div>
</template>
