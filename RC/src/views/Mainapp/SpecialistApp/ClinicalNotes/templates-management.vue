<template>
  <div class="page-content">
    <TopBar showButtons type="title-only" title="Clinical Notes / Templates" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="templates-container">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-content">
            <button class="hero-back" @click="router.push('/app/specialist/clinical-notes')">
              <v-icon name="hi-arrow-left" scale="0.75" />
              Clinical Notes
            </button>
            <h1 class="hero-title">
              <v-icon name="hi-template" scale="1" />
              Note Templates
            </h1>
            <p class="hero-subtitle">Create and manage reusable clinical note templates</p>
          </div>
          <div class="hero-right">
            <div v-if="templates.length" class="hero-stat-pill">
              <span class="hero-stat-pill__value">{{ templates.length }}</span>
              <span class="hero-stat-pill__label">Templates</span>
            </div>
            <button class="hero-action-btn" @click="openCreateModal">
              <v-icon name="hi-plus" scale="0.85" />
              Create Template
            </button>
          </div>
        </div>

        <!-- Shimmer Loading -->
        <template v-if="isLoading">
          <div class="skeleton-card" v-for="i in 3" :key="i" />
        </template>

        <!-- Templates List -->
        <template v-else>
          <div v-if="templates.length" class="templates-list">
            <div
              v-for="template in templates"
              :key="template._id"
              class="template-card"
              :class="{ 'template-card--default': template.is_default }"
            >
              <div class="template-card__header">
                <div class="template-card__title-row">
                  <h3>{{ template.name }}</h3>
                  <v-icon v-if="template.is_default" name="hi-star" scale="0.85" class="default-star" />
                </div>
                <span v-if="template.category" class="category-badge">{{ template.category }}</span>
              </div>

              <p class="template-card__content">{{ truncate(template.content, 150) }}</p>

              <div class="template-card__footer">
                <div class="template-card__meta">
                  <span class="usage-count">
                    <v-icon name="hi-clipboard-list" scale="0.65" />
                    Used {{ template.usage_count || 0 }} times
                  </span>
                  <span v-if="template.is_default" class="default-badge">Default</span>
                </div>
                <div class="template-card__actions">
                  <button
                    v-if="!template.is_default"
                    class="action-btn"
                    @click="setAsDefault(template._id)"
                  >
                    Set Default
                  </button>
                  <button
                    v-else
                    class="action-btn"
                    @click="unsetDefault(template._id)"
                  >
                    Unset Default
                  </button>
                  <button class="action-btn" @click="editTemplate(template)">
                    Edit
                  </button>
                  <button
                    v-if="template.usage_count > 0"
                    class="action-btn action-btn--danger"
                    @click="archiveTemplate(template)"
                  >
                    Archive
                  </button>
                  <button
                    v-else
                    class="action-btn action-btn--danger"
                    @click="deleteTemplate(template)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-section">
            <div class="empty-section__icon">
              <v-icon name="hi-template" scale="1.8" />
            </div>
            <h3>No templates yet</h3>
            <p>Create your first clinical note template to speed up documentation</p>
            <button class="empty-section__action" @click="openCreateModal">
              <v-icon name="hi-plus" scale="0.8" />
              Create Template
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal-panel">
          <div class="modal-panel__header">
            <div class="modal-header-info">
              <v-icon name="hi-template" scale="0.9" />
              <h2>{{ editingTemplate ? 'Edit Template' : 'Create Template' }}</h2>
            </div>
            <button class="close-btn" @click="closeModal">
              <v-icon name="hi-x" scale="0.9" />
            </button>
          </div>

          <div class="modal-panel__body">
            <div class="form-group">
              <label>
                Template Name <span class="required">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="e.g., Follow-up Assessment, Initial Consultation"
              />
              <span class="field-hint">Give your template a descriptive name for quick identification</span>
            </div>

            <div class="form-group">
              <label>Category</label>
              <input
                v-model="formData.category"
                type="text"
                placeholder="e.g., Assessment, Follow-up, Diagnosis, Treatment Plan"
              />
              <span class="field-hint">Group templates by type for easy filtering</span>
            </div>

            <div class="form-group">
              <label>
                Template Content <span class="required">*</span>
              </label>
              <textarea
                v-model="formData.content"
                placeholder="Enter template content...&#10;&#10;Example:&#10;Chief Complaint:&#10;&#10;History of Present Illness:&#10;&#10;Assessment:&#10;&#10;Plan:"
                rows="12"
              />
              <span class="field-hint">Use consistent formatting with headings and sections for readability</span>
            </div>

            <label class="checkbox-field">
              <input type="checkbox" v-model="formData.is_public" />
              <span>Make this template public</span>
            </label>
            <span class="field-hint">Public templates are visible to all specialists; private templates are only for you</span>
          </div>

          <div class="modal-panel__footer">
            <button class="btn btn--secondary" @click="closeModal">Cancel</button>
            <button class="btn btn--primary" :disabled="isSaving" @click="saveTemplate">
              <span v-if="isSaving" class="btn-loader" />
              {{ isSaving ? 'Saving...' : (editingTemplate ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Confirm Dialog -->
    <Teleport to="body">
      <div v-if="confirmDialog.show" class="modal-overlay" @click.self="confirmDialog.show = false">
        <div class="confirm-panel">
          <div class="confirm-panel__icon">
            <v-icon name="hi-exclamation" scale="1.2" />
          </div>
          <h3>{{ confirmDialog.title }}</h3>
          <p>{{ confirmDialog.message }}</p>
          <div class="confirm-panel__actions">
            <button class="btn btn--secondary" @click="confirmDialog.show = false">Cancel</button>
            <button class="btn btn--danger" @click="confirmDialog.onConfirm">
              {{ confirmDialog.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toast-notification';
import TopBar from '@/components/Navigation/top-bar';
import apiFactory from '@/services/apiFactory';

defineEmits(['openSideNav']);

const router = useRouter();
const $toast = useToast();

const isLoading = ref(true);
const isSaving = ref(false);
const isModalOpen = ref(false);
const templates = ref([]);
const editingTemplate = ref(null);
const formData = ref({
  name: '',
  content: '',
  category: '',
  is_public: false
});

const confirmDialog = reactive({
  show: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  onConfirm: () => {}
});

function showConfirm(title, message, confirmLabel, onConfirm) {
  confirmDialog.title = title;
  confirmDialog.message = message;
  confirmDialog.confirmLabel = confirmLabel;
  confirmDialog.onConfirm = () => {
    confirmDialog.show = false;
    onConfirm();
  };
  confirmDialog.show = true;
}

function truncate(text, length) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function openCreateModal() {
  editingTemplate.value = null;
  formData.value = { name: '', content: '', category: '', is_public: false };
  isModalOpen.value = true;
}

function editTemplate(template) {
  editingTemplate.value = template;
  formData.value = {
    name: template.name,
    content: template.content,
    category: template.category || '',
    is_public: template.is_public || false
  };
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  editingTemplate.value = null;
}

async function fetchTemplates() {
  try {
    isLoading.value = true;
    const response = await apiFactory.$_getTemplates();
    templates.value = response.data?.data || [];
  } catch (error) {
    console.error('Error fetching templates:', error);
    $toast.error('Failed to load templates');
  } finally {
    isLoading.value = false;
  }
}

async function saveTemplate() {
  if (!formData.value.name || !formData.value.content) {
    $toast.error('Name and content are required');
    return;
  }

  isSaving.value = true;
  try {
    if (editingTemplate.value) {
      await apiFactory.$_updateTemplate(editingTemplate.value._id, formData.value);
      $toast.success('Template updated successfully');
    } else {
      await apiFactory.$_createTemplate(formData.value);
      $toast.success('Template created successfully');
    }

    closeModal();
    await fetchTemplates();
  } catch (error) {
    console.error('Error saving template:', error);
    $toast.error('Failed to save template');
  } finally {
    isSaving.value = false;
  }
}

function deleteTemplate(template) {
  showConfirm(
    'Delete Template',
    template.usage_count > 0
      ? `This template has been used in ${template.usage_count} clinical note(s). Deleting it won't affect existing notes. Are you sure?`
      : 'Are you sure you want to delete this template?',
    'Delete',
    async () => {
      try {
        await apiFactory.$_deleteTemplate(template._id);
        $toast.success('Template deleted successfully');
        await fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        $toast.error(error.response?.data?.message || 'Failed to delete template');
      }
    }
  );
}

function archiveTemplate(template) {
  showConfirm(
    'Archive Template',
    `This template has been used in ${template.usage_count} clinical note(s) and cannot be deleted. Do you want to archive it? Archived templates will no longer appear in your list.`,
    'Archive',
    async () => {
      try {
        await apiFactory.$_archiveTemplate(template._id);
        $toast.success('Template archived successfully');
        await fetchTemplates();
      } catch (error) {
        console.error('Error archiving template:', error);
        $toast.error(error.response?.data?.message || 'Failed to archive template');
      }
    }
  );
}

async function setAsDefault(templateId) {
  try {
    await apiFactory.$_setTemplateAsDefault(templateId);
    $toast.success('Template set as default');
    await fetchTemplates();
  } catch (error) {
    console.error('Error setting default template:', error);
    $toast.error('Failed to set default template');
  }
}

async function unsetDefault(templateId) {
  try {
    await apiFactory.$_unsetTemplateDefault(templateId);
    $toast.success('Default template unset');
    await fetchTemplates();
  } catch (error) {
    console.error('Error unsetting default template:', error);
    $toast.error('Failed to unset default template');
  }
}

onMounted(() => {
  fetchTemplates();
});
</script>

<style scoped lang="scss">
.page-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  padding: 0 128px;

  @include responsive(tab-portrait) {
    padding: 0;
  }

  @include responsive(phone) {
    padding: 0;
  }

  &__body {
    width: 100%;
    padding: $size-24 $size-32;
    overflow-y: auto;

    @include responsive(phone) {
      padding: $size-16;
    }

    &::-webkit-scrollbar {
      display: none;
    }
  }
}

.templates-container {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: $size-24;
  padding-bottom: $size-32;
}

// Hero Section
.hero-section {
  background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 50%, #0e7490 100%);
  border-radius: $size-20;
  padding: $size-24 $size-28;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(14, 174, 196, 0.25);
  color: white;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  @include responsive(tab-portrait) {
    flex-direction: column;
    gap: $size-20;
    padding: $size-20;
    border-radius: $size-16;
  }

  @include responsive(phone) {
    padding: $size-16;
    border-radius: $size-12;
  }

  .hero-content {
    z-index: 1;

    .hero-back {
      display: inline-flex;
      align-items: center;
      gap: $size-4;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      font-size: $size-12;
      font-weight: $fw-medium;
      padding: $size-4 $size-10;
      border-radius: $size-8;
      cursor: pointer;
      margin-bottom: $size-12;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }

    .hero-title {
      display: flex;
      align-items: center;
      gap: $size-8;
      font-size: $size-20;
      font-weight: $fw-bold;
      margin-bottom: $size-4;
    }

    .hero-subtitle {
      font-size: $size-13;
      opacity: 0.85;
    }
  }

  .hero-right {
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: $size-14;

    @include responsive(tab-portrait) {
      align-items: flex-start;
      width: 100%;
    }
  }

  .hero-stat-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255, 255, 255, 0.15);
    padding: $size-10 $size-16;
    border-radius: $size-10;

    &__value {
      font-size: $size-20;
      font-weight: $fw-bold;
      line-height: 1.2;
    }

    &__label {
      font-size: $size-10;
      opacity: 0.85;
      font-weight: $fw-medium;
    }
  }

  .hero-action-btn {
    display: flex;
    align-items: center;
    gap: $size-8;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: $size-10;
    padding: $size-10 $size-20;
    font-size: $size-14;
    font-weight: $fw-semi-bold;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

// Templates List
.templates-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.template-card {
  background: white;
  border-radius: $size-16;
  padding: $size-20;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  }

  &--default {
    border: 1px solid rgba(#FFC107, 0.4);
    background: linear-gradient(to bottom, rgba(255, 193, 7, 0.03) 0%, white 100%);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-12;

    @include responsive(phone) {
      flex-direction: column;
      gap: $size-8;
    }
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: $size-8;

    h3 {
      font-size: $size-15;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
    }
  }

  &__content {
    font-size: $size-14;
    color: $color-g-36;
    line-height: 1.6;
    margin-bottom: $size-16;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: $size-14;
    border-top: 1px solid $color-g-92;

    @include responsive(phone) {
      flex-direction: column;
      align-items: flex-start;
      gap: $size-12;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $size-12;
  }

  &__actions {
    display: flex;
    gap: $size-8;
    flex-wrap: wrap;

    @include responsive(phone) {
      width: 100%;
      justify-content: flex-end;
    }
  }
}

.default-star {
  color: #FFC107;
}

.category-badge {
  font-size: $size-11;
  color: #0891b2;
  background: rgba(14, 174, 196, 0.1);
  padding: $size-4 $size-10;
  border-radius: $size-12;
  font-weight: $fw-medium;
}

.usage-count {
  display: flex;
  align-items: center;
  gap: $size-4;
  font-size: $size-12;
  color: $color-g-54;
}

.default-badge {
  font-size: $size-11;
  font-weight: $fw-semi-bold;
  color: #FF8F00;
  background: rgba(255, 193, 7, 0.15);
  padding: $size-2 $size-8;
  border-radius: $size-12;
}

.action-btn {
  padding: $size-6 $size-12;
  background: rgba(14, 174, 196, 0.06);
  color: #0891b2;
  border: none;
  border-radius: $size-6;
  font-size: $size-12;
  font-weight: $fw-semi-bold;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(14, 174, 196, 0.14);
  }

  &--danger {
    background: rgba(#ef4444, 0.06);
    color: #dc2626;

    &:hover {
      background: rgba(#ef4444, 0.14);
    }
  }
}

// Empty State
.empty-section {
  text-align: center;
  padding: $size-32 $size-20;
  background: $color-g-97;
  border-radius: $size-12;

  &__icon {
    width: 64px;
    height: 64px;
    margin: 0 auto $size-14;
    border-radius: 50%;
    background: rgba(14, 174, 196, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0EAEC4;
  }

  h3 {
    font-size: $size-15;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-6;
  }

  p {
    font-size: $size-13;
    color: $color-g-54;
    margin-bottom: $size-16;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: $size-6;
    background: rgba(14, 174, 196, 0.1);
    color: #0EAEC4;
    border: none;
    border-radius: $size-8;
    padding: $size-10 $size-18;
    font-size: $size-13;
    font-weight: $fw-semi-bold;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(14, 174, 196, 0.18);
    }
  }
}

// Modal
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $size-20;
  animation: fadeIn 0.2s ease;
}

.modal-panel {
  background: white;
  border-radius: $size-20;
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.25s ease;

  @include responsive(phone) {
    max-width: 100%;
    max-height: 90vh;
    border-radius: $size-16;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-20 $size-24;
    border-bottom: 1px solid $color-g-92;

    .modal-header-info {
      display: flex;
      align-items: center;
      gap: $size-8;
      color: #0891b2;

      h2 {
        font-size: $size-16;
        font-weight: $fw-semi-bold;
        color: $color-g-21;
      }
    }

    .close-btn {
      background: $color-g-97;
      border: none;
      border-radius: $size-8;
      padding: $size-8;
      cursor: pointer;
      color: $color-g-54;
      transition: all 0.2s ease;

      &:hover {
        background: $color-g-92;
        color: $color-g-21;
      }
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: $size-24;
    display: flex;
    flex-direction: column;
    gap: $size-20;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: $size-12;
    padding: $size-16 $size-24;
    border-top: 1px solid $color-g-92;

    @include responsive(phone) {
      flex-direction: column-reverse;
    }
  }
}

// Confirm Dialog
.confirm-panel {
  background: white;
  border-radius: $size-16;
  padding: $size-28;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.25s ease;

  &__icon {
    width: 48px;
    height: 48px;
    margin: 0 auto $size-16;
    border-radius: 50%;
    background: rgba(#f59e0b, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #d97706;
  }

  h3 {
    font-size: $size-16;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
    margin-bottom: $size-8;
  }

  p {
    font-size: $size-14;
    color: $color-g-54;
    line-height: 1.5;
    margin-bottom: $size-20;
  }

  &__actions {
    display: flex;
    gap: $size-12;
    justify-content: center;

    @include responsive(phone) {
      flex-direction: column-reverse;
    }
  }
}

// Form
.form-group {
  display: flex;
  flex-direction: column;
  gap: $size-8;

  label {
    font-size: $size-14;
    font-weight: $fw-medium;
    color: $color-g-21;

    .required {
      color: #ef4444;
    }
  }

  input[type="text"] {
    padding: $size-12 $size-14;
    border: 1px solid $color-g-85;
    border-radius: $size-10;
    font-size: $size-14;
    color: $color-g-21;

    &:focus {
      outline: none;
      border-color: #0EAEC4;
    }

    &::placeholder {
      color: $color-g-67;
    }
  }

  textarea {
    width: 100%;
    padding: $size-14;
    border: 1px solid $color-g-85;
    border-radius: $size-12;
    font-size: $size-14;
    line-height: 1.6;
    color: $color-g-21;
    resize: vertical;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: #0EAEC4;
    }

    &::placeholder {
      color: $color-g-67;
    }
  }
}

.field-hint {
  font-size: $size-12;
  color: $color-g-54;
  font-style: italic;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: $size-8;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #0EAEC4;
  }

  span {
    font-size: $size-14;
    color: $color-g-36;
    font-weight: $fw-medium;
  }
}

// Buttons
.btn {
  padding: $size-10 $size-20;
  border-radius: $size-10;
  font-size: $size-14;
  font-weight: $fw-semi-bold;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: $size-6;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--primary {
    background: #0EAEC4;
    color: white;

    &:hover:not(:disabled) {
      background: #0891b2;
    }
  }

  &--secondary {
    background: $color-g-97;
    color: $color-g-36;

    &:hover:not(:disabled) {
      background: $color-g-92;
    }
  }

  &--danger {
    background: #ef4444;
    color: white;

    &:hover:not(:disabled) {
      background: #dc2626;
    }
  }

  @include responsive(phone) {
    width: 100%;
    justify-content: center;
  }
}

.btn-loader {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

// Skeleton
.skeleton-card {
  height: 140px;
  border-radius: $size-16;
  background: linear-gradient(90deg, $color-g-92 25%, $color-g-97 50%, $color-g-92 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
