<template>
  <div class="templates-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero__content">
        <button class="hero__back-btn" @click="router.push('/app/specialist/clinical-notes')">
          <v-icon name="hi-arrow-left" scale="0.75" />
          <span>Clinical Notes</span>
        </button>
        <div class="hero__badge">
          <div class="badge-pulse"></div>
          <v-icon name="hi-template" />
          <span>Note Templates</span>
        </div>
        <h1 class="hero__title">
          Note<br/>
          <span class="hero__title-accent">Templates</span>
        </h1>
        <p class="hero__subtitle">Create and manage reusable clinical note templates</p>
        <div class="hero__stats" v-if="templates.length">
          <div class="hero-stat">
            <span class="hero-stat__value">{{ templates.length }}</span>
            <span class="hero-stat__label">Templates</span>
          </div>
        </div>
        <div class="hero__actions">
          <button class="hero__create-btn" @click="openCreateModal">
            <v-icon name="hi-plus" scale="0.85" />
            Create Template
          </button>
        </div>
      </div>
      <div class="hero__visual">
        <div class="dashboard-orb">
          <div class="orb-ring orb-ring--1"></div>
          <div class="orb-ring orb-ring--2"></div>
          <div class="orb-ring orb-ring--3"></div>
          <div class="orb-core">
            <v-icon name="hi-template" />
          </div>
        </div>
        <div class="floating-icons">
          <div class="float-icon float-icon--1"><v-icon name="hi-document-text" /></div>
          <div class="float-icon float-icon--2"><v-icon name="hi-clipboard-list" /></div>
          <div class="float-icon float-icon--3"><v-icon name="hi-pencil-alt" /></div>
        </div>
      </div>
    </section>

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
          class="bento-card template-card"
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
      <div v-else class="bento-card empty-section">
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
// ─── Design Tokens ───
$sky: #4FC3F7;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$emerald: #10B981;
$amber: #F59E0B;
$rose: #F43F5E;
$violet: #8B5CF6;

@mixin glass-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
}

// ─── Page Layout ───
.templates-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  padding-bottom: 100px;
  background: #F8FAFC;
  min-height: min-content;

  @media (max-width: 768px) {
    padding: 16px;
    padding-bottom: 120px;
    gap: 16px;
  }
}

// ─── Hero Section ───
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, $sky 0%, $sky-dark 55%, $sky-darker 100%);
  border-radius: 28px;
  padding: 40px 48px;
  min-height: 300px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(2, 136, 209, 0.3);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%);
    pointer-events: none;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 28px 24px;
    min-height: auto;
    border-radius: 20px;
    text-align: center;
  }
}

.hero__content {
  position: relative;
  z-index: 2;
  flex: 1;
  max-width: 500px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
}

.hero__back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 10px;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
}

.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 100px;
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 16px;

  .ov-icon {
    width: 16px;
    height: 16px;
  }
}

.badge-pulse {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  animation: pulse-glow 2s ease-in-out infinite;
}

.hero__title {
  font-size: 2.75rem;
  font-weight: 800;
  color: white;
  line-height: 1.1;
  margin: 0 0 12px;
  letter-spacing: -0.02em;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
}

.hero__title-accent {
  background: linear-gradient(135deg, #E0F7FA 0%, #B2EBF2 50%, #80DEEA 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero__subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  margin: 0 0 24px;
}

.hero__stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    justify-content: center;
    padding: 12px 16px;
  }
}

.hero-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.hero-stat__value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
}

.hero-stat__label {
  font-size: 0.6875rem;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.hero__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hero__create-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 20px;
  border-radius: 12px;
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
}

// ─── Hero Visual / Orb ───
.hero__visual {
  position: relative;
  width: 200px;
  height: 200px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 150px;
    height: 150px;
    margin-top: 20px;
  }
}

.dashboard-orb {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.12);

  &--1 {
    width: 100%;
    height: 100%;
    animation: spin-slow 20s linear infinite;
  }
  &--2 {
    width: 75%;
    height: 75%;
    animation: spin-slow 15s linear infinite reverse;
    border-style: dashed;
  }
  &--3 {
    width: 50%;
    height: 50%;
    animation: spin-slow 10s linear infinite;
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.orb-core {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  animation: pulse-glow 3s ease-in-out infinite;
  z-index: 1;

  .ov-icon {
    width: 24px;
    height: 24px;
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;

    .ov-icon {
      width: 20px;
      height: 20px;
    }
  }
}

.floating-icons {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.float-icon {
  position: absolute;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  .ov-icon {
    width: 14px;
    height: 14px;
  }

  &--1 {
    top: 10%;
    right: 5%;
    animation: float-1 6s ease-in-out infinite;
  }
  &--2 {
    bottom: 15%;
    left: 0;
    animation: float-2 7s ease-in-out infinite;
  }
  &--3 {
    top: 50%;
    right: -5%;
    animation: float-3 8s ease-in-out infinite;
  }

  @media (max-width: 768px) {
    width: 26px;
    height: 26px;
    border-radius: 7px;

    .ov-icon {
      width: 12px;
      height: 12px;
    }
  }
}

// ─── Bento Cards ───
.bento-card {
  @include glass-card;
  padding: 24px;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 16px;
  }
}

// ─── Templates List ───
.templates-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.template-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.04);
  }

  &--default {
    border-color: rgba(255, 193, 7, 0.4);
    background: linear-gradient(to bottom, rgba(255, 193, 7, 0.04) 0%, rgba(255, 255, 255, 0.92) 100%);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    @media (max-width: 640px) {
      flex-direction: column;
      gap: 8px;
    }
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: 8px;

    h3 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: $navy;
      margin: 0;
    }
  }

  &__content {
    font-size: 0.875rem;
    color: #475569;
    line-height: 1.6;
    margin: 0 0 16px;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid rgba(226, 232, 240, 0.6);

    @media (max-width: 640px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;

    @media (max-width: 640px) {
      width: 100%;
      justify-content: flex-end;
    }
  }
}

.default-star {
  color: #FFC107;
}

.category-badge {
  font-size: 0.6875rem;
  color: $sky-dark;
  background: rgba(79, 195, 247, 0.1);
  padding: 4px 10px;
  border-radius: 100px;
  font-weight: 500;
}

.usage-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #64748B;
}

.default-badge {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #FF8F00;
  background: rgba(255, 193, 7, 0.15);
  padding: 2px 8px;
  border-radius: 100px;
}

.action-btn {
  padding: 6px 14px;
  background: rgba(79, 195, 247, 0.08);
  color: $sky-dark;
  border: none;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    background: rgba(79, 195, 247, 0.16);
    transform: translateY(-1px);
  }

  &--danger {
    background: rgba(239, 68, 68, 0.08);
    color: #DC2626;

    &:hover {
      background: rgba(239, 68, 68, 0.16);
    }
  }
}

// ─── Empty State ───
.empty-section {
  text-align: center;
  padding: 48px 24px;

  &__icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(79, 195, 247, 0.12) 0%, rgba(79, 195, 247, 0.04) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1E293B;
    margin: 0 0 8px;
  }

  p {
    font-size: 0.875rem;
    color: #64748B;
    margin: 0 0 20px;
  }

  &__action {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;
    border: none;
    border-radius: 12px;
    padding: 10px 20px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 195, 247, 0.4);
    }
  }
}

// ─── Modal ───
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

.modal-panel {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 560px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.25s ease;

  @media (max-width: 640px) {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 16px;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(226, 232, 240, 0.6);

    .modal-header-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: $sky-dark;

      h2 {
        font-size: 1rem;
        font-weight: 600;
        color: #1E293B;
        margin: 0;
      }
    }

    .close-btn {
      background: rgba(241, 245, 249, 0.8);
      border: none;
      border-radius: 8px;
      padding: 8px;
      cursor: pointer;
      color: #64748B;
      transition: all 0.2s ease;

      &:hover {
        background: #E2E8F0;
        color: #1E293B;
      }
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid rgba(226, 232, 240, 0.6);

    @media (max-width: 640px) {
      flex-direction: column-reverse;
    }
  }
}

// ─── Confirm Dialog ───
.confirm-panel {
  background: white;
  border-radius: 20px;
  padding: 32px;
  width: 100%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.25s ease;

  &__icon {
    width: 48px;
    height: 48px;
    margin: 0 auto 16px;
    border-radius: 50%;
    background: rgba(245, 158, 11, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #D97706;
  }

  h3 {
    font-size: 1rem;
    font-weight: 600;
    color: #1E293B;
    margin: 0 0 8px;
  }

  p {
    font-size: 0.875rem;
    color: #64748B;
    line-height: 1.5;
    margin: 0 0 24px;
  }

  &__actions {
    display: flex;
    gap: 12px;
    justify-content: center;

    @media (max-width: 640px) {
      flex-direction: column-reverse;
    }
  }
}

// ─── Form ───
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;

  label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1E293B;

    .required {
      color: #EF4444;
    }
  }

  input[type="text"] {
    padding: 12px 14px;
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 12px;
    font-size: 0.875rem;
    color: #1E293B;
    background: rgba(255, 255, 255, 0.7);
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: $sky;
      box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.12);
    }

    &::placeholder {
      color: #94A3B8;
    }
  }

  textarea {
    width: 100%;
    padding: 14px;
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 12px;
    font-size: 0.875rem;
    line-height: 1.6;
    color: #1E293B;
    resize: vertical;
    font-family: inherit;
    background: rgba(255, 255, 255, 0.7);
    transition: all 0.3s ease;

    &:focus {
      outline: none;
      border-color: $sky;
      box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.12);
    }

    &::placeholder {
      color: #94A3B8;
    }
  }
}

.field-hint {
  font-size: 0.75rem;
  color: #64748B;
  font-style: italic;
}

.checkbox-field {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: $sky;
  }

  span {
    font-size: 0.875rem;
    color: #475569;
    font-weight: 500;
  }
}

// ─── Buttons ───
.btn {
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &--primary {
    background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(79, 195, 247, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(79, 195, 247, 0.4);
    }
  }

  &--secondary {
    background: rgba(241, 245, 249, 0.8);
    color: #475569;

    &:hover:not(:disabled) {
      background: #E2E8F0;
    }
  }

  &--danger {
    background: #EF4444;
    color: white;

    &:hover:not(:disabled) {
      background: #DC2626;
    }
  }

  @media (max-width: 640px) {
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

// ─── Skeleton ───
.skeleton-card {
  @include glass-card;
  height: 140px;
  background: linear-gradient(90deg,
    rgba(255,255,255,0.92) 25%,
    rgba(248,250,252,0.95) 50%,
    rgba(255,255,255,0.92) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

// ─── Animations ───
@keyframes pulse-glow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes float-1 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(5deg); }
}

@keyframes float-2 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(-5deg); }
}

@keyframes float-3 {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(3deg); }
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
