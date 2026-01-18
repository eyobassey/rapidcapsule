<template>
  <div class="page-content">
    <TopBar showButtons type="avatar" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="container-root">
        <div class="templates-container">
          <!-- Header -->
          <div class="templates-header">
            <div>
              <h1 class="heading-h1">Note Templates</h1>
              <p class="text-body">Create and manage reusable clinical note templates</p>
            </div>
            <rc-button
              label="Create Template"
              type="primary"
              @click="openCreateModal"
            />
          </div>

          <!-- Loading -->
          <loader v-if="isLoading" :useOverlay="false" />

          <!-- Templates List -->
          <div v-else-if="templates.length > 0" class="templates-list">
            <div v-for="template in templates" :key="template._id" class="template-card" :class="{ 'template-card--default': template.is_default }">
              <div class="template-card__header">
                <div class="template-card__title-row">
                  <h3 class="template-card__name">{{ template.name }}</h3>
                  <rc-icon v-if="template.is_default" icon-name="star" size="md" class="default-star" />
                </div>
                <span v-if="template.category" class="template-card__category">{{ template.category }}</span>
              </div>
              <p class="template-card__content">{{ truncate(template.content, 150) }}</p>
              <div class="template-card__footer">
                <div class="template-card__meta">
                  <span class="template-card__usage">Used {{ template.usage_count || 0 }} times</span>
                  <span v-if="template.is_default" class="template-card__default-badge">Default</span>
                </div>
                <div class="template-card__actions">
                  <rc-button
                    v-if="!template.is_default"
                    label="Set Default"
                    type="tertiary"
                    size="small"
                    @click="setAsDefault(template._id)"
                  />
                  <rc-button
                    v-else
                    label="Unset Default"
                    type="tertiary"
                    size="small"
                    @click="unsetDefault(template._id)"
                  />
                  <rc-button label="Edit" type="tertiary" size="small" @click="editTemplate(template)" />
                  <rc-button
                    v-if="template.usage_count > 0"
                    label="Archive"
                    type="tertiary"
                    size="small"
                    @click="archiveTemplate(template)"
                  />
                  <rc-button
                    v-else
                    label="Delete"
                    type="tertiary"
                    size="small"
                    @click="deleteTemplate(template)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <rc-icon icon-name="list" size="xl" />
            <h3>No templates yet</h3>
            <p>Create your first clinical note template to speed up documentation</p>
            <rc-button label="Create Template" type="primary" @click="openCreateModal" />
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <dialog-modal
      v-if="isModalOpen"
      :title="editingTemplate ? 'Edit Template' : 'Create Template'"
      @closeModal="closeModal"
      :has-footer="true"
    >
      <template v-slot:body>
        <div class="template-form">
          <div class="form-group">
            <label>
              Template Name *
              <tooltip text="Give your template a descriptive name that helps you identify it quickly">
                <span class="tooltip-icon">ℹ️</span>
              </tooltip>
            </label>
            <input-box
              v-model="formData.name"
              placeholder="e.g., Follow-up Assessment, Initial Consultation"
            />
          </div>

          <div class="form-group">
            <label>
              Category (Optional)
              <tooltip text="Group similar templates together. Examples: 'Assessment', 'Follow-up', 'Diagnosis', 'Treatment Plan', 'Lab Results'. This helps organize and filter templates.">
                <span class="tooltip-icon">ℹ️</span>
              </tooltip>
            </label>
            <input-box
              v-model="formData.category"
              placeholder="e.g., Assessment, Follow-up, Diagnosis, Treatment Plan"
            />
            <span class="field-hint">Group templates by type for easy filtering (e.g., Assessment, Follow-up, Diagnosis)</span>
          </div>

          <div class="form-group">
            <label>
              Template Content *
              <tooltip text="Write the template text you want to reuse. You can include headings, sections, and placeholders for patient-specific information.">
                <span class="tooltip-icon">ℹ️</span>
              </tooltip>
            </label>
            <area-text
              v-model="formData.content"
              placeholder="Enter template content...&#10;&#10;Example:&#10;Chief Complaint:&#10;&#10;History of Present Illness:&#10;&#10;Assessment:&#10;&#10;Plan:"
              :rows="12"
            />
            <span class="field-hint">Pro tip: Use consistent formatting with headings and sections for better readability</span>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.is_public" />
              <span>
                Make this template public
                <tooltip text="Public templates can be used by all specialists on the platform. Keep it private if it contains specialty-specific information.">
                  <span class="tooltip-icon">ℹ️</span>
                </tooltip>
              </span>
            </label>
            <span class="field-hint">Public templates are visible to all specialists; private templates are only for you</span>
          </div>
        </div>
      </template>

      <template v-slot:foot>
        <div class="modal-footer">
          <rc-button label="Cancel" type="tertiary" @click="closeModal" />
          <rc-button
            :label="editingTemplate ? 'Update' : 'Create'"
            type="primary"
            :loading="isSaving"
            @click="saveTemplate"
          />
        </div>
      </template>
    </dialog-modal>
  </div>
</template>

<script>
import { ref, onMounted, inject } from 'vue';
import { useToast } from 'vue-toast-notification';
import TopBar from '@/components/Navigation/top-bar';
import Loader from '@/components/Loader/main-loader';
import DialogModal from '@/components/modals/dialog-modal';
import RcButton from '@/components/buttons/button-primary';
import RcIcon from '@/components/RCIcon';
import InputBox from '@/components/inputs/text';
import AreaText from '@/components/inputs/textarea';
import Tooltip from '@/components/Tooltip/tooltip';

export default {
  name: 'TemplatesManagement',
  components: {
    TopBar,
    Loader,
    DialogModal,
    RcButton,
    RcIcon,
    InputBox,
    AreaText,
    Tooltip
  },
  emits: ['openSideNav'],
  setup() {
    const $http = inject('$_HTTP');
    const toast = useToast();

    const isLoading = ref(false);
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

    const fetchTemplates = async () => {
      isLoading.value = true;
      try {
        const response = await $http.$_getTemplates();
        // Response interceptor wraps data in { statusCode, message, data: result }
        templates.value = response.data?.data || [];
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast.error('Failed to load templates');
      } finally {
        isLoading.value = false;
      }
    };

    const openCreateModal = () => {
      editingTemplate.value = null;
      formData.value = { name: '', content: '', category: '', is_public: false };
      isModalOpen.value = true;
    };

    const editTemplate = (template) => {
      editingTemplate.value = template;
      formData.value = {
        name: template.name,
        content: template.content,
        category: template.category || '',
        is_public: template.is_public || false
      };
      isModalOpen.value = true;
    };

    const closeModal = () => {
      isModalOpen.value = false;
      editingTemplate.value = null;
    };

    const saveTemplate = async () => {
      if (!formData.value.name || !formData.value.content) {
        toast.error('Name and content are required');
        return;
      }

      isSaving.value = true;
      try {
        if (editingTemplate.value) {
          await $http.$_updateTemplate(editingTemplate.value._id, formData.value);
          toast.success('Template updated successfully');
        } else {
          await $http.$_createTemplate(formData.value);
          toast.success('Template created successfully');
        }

        closeModal();
        await fetchTemplates();
      } catch (error) {
        console.error('Error saving template:', error);
        toast.error('Failed to save template');
      } finally {
        isSaving.value = false;
      }
    };

    const deleteTemplate = async (template) => {
      const confirmMessage = template.usage_count > 0
        ? `This template has been used in ${template.usage_count} clinical note(s). Deleting it won't affect existing notes. Are you sure you want to delete it?`
        : 'Are you sure you want to delete this template?';

      if (!confirm(confirmMessage)) return;

      try {
        await $http.$_deleteTemplate(template._id);
        toast.success('Template deleted successfully');
        await fetchTemplates();
      } catch (error) {
        console.error('Error deleting template:', error);
        const errorMessage = error.response?.data?.message || 'Failed to delete template';
        toast.error(errorMessage);
      }
    };

    const archiveTemplate = async (template) => {
      const confirmMessage = `This template has been used in ${template.usage_count} clinical note(s) and cannot be deleted. Do you want to archive it? Archived templates will no longer appear in your templates list.`;

      if (!confirm(confirmMessage)) return;

      try {
        await $http.$_archiveTemplate(template._id);
        toast.success('Template archived successfully');
        await fetchTemplates();
      } catch (error) {
        console.error('Error archiving template:', error);
        const errorMessage = error.response?.data?.message || 'Failed to archive template';
        toast.error(errorMessage);
      }
    };

    const setAsDefault = async (templateId) => {
      try {
        await $http.$_setTemplateAsDefault(templateId);
        toast.success('Template set as default');
        await fetchTemplates();
      } catch (error) {
        console.error('Error setting default template:', error);
        toast.error('Failed to set default template');
      }
    };

    const unsetDefault = async (templateId) => {
      try {
        await $http.$_unsetTemplateDefault(templateId);
        toast.success('Default template unset');
        await fetchTemplates();
      } catch (error) {
        console.error('Error unsetting default template:', error);
        toast.error('Failed to unset default template');
      }
    };

    const truncate = (text, length) => {
      return text.length > length ? text.substring(0, length) + '...' : text;
    };

    onMounted(() => {
      fetchTemplates();
    });

    return {
      isLoading,
      isSaving,
      isModalOpen,
      templates,
      editingTemplate,
      formData,
      openCreateModal,
      editTemplate,
      closeModal,
      saveTemplate,
      deleteTemplate,
      archiveTemplate,
      setAsDefault,
      unsetDefault,
      truncate
    };
  }
};
</script>

<style scoped lang="scss">
.templates-container {
  padding: $size-24;
}

.templates-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: $size-32;

  h1 {
    font-size: $size-32;
    font-weight: $fw-bold;
    color: $color-g-21;
    margin-bottom: $size-8;
  }

  p {
    font-size: $size-16;
    color: $color-g-44;
  }
}

.templates-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: $size-20;
}

.template-card {
  background: $color-white;
  border: 1px solid $color-g-90;
  border-radius: $size-12;
  padding: $size-20;
  transition: all 0.2s;

  &:hover {
    border-color: $color-pri;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &--default {
    border-color: #FFC107;
    background: linear-gradient(to bottom, rgba(255, 193, 7, 0.05) 0%, $color-white 100%);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $size-12;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: $size-8;
  }

  &__name {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-21;
  }

  &__category {
    font-size: $size-12;
    color: $color-pri;
    background: rgba($color-pri, 0.1);
    padding: $size-4 $size-12;
    border-radius: $size-16;
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
    padding-top: $size-12;
    border-top: 1px solid $color-g-92;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: $size-12;
  }

  &__usage {
    font-size: $size-12;
    color: $color-g-54;
  }

  &__default-badge {
    font-size: $size-11;
    font-weight: $fw-semi-bold;
    color: #FF8F00;
    background: rgba(255, 193, 7, 0.15);
    padding: $size-2 $size-8;
    border-radius: $size-12;
  }

  &__actions {
    display: flex;
    gap: $size-8;
    flex-wrap: wrap;
  }
}

.default-star {
  color: #FFC107;
}

.empty-state {
  text-align: center;
  padding: $size-64 $size-24;

  h3 {
    font-size: $size-20;
    font-weight: $fw-semi-bold;
    color: $color-g-36;
    margin: $size-24 0 $size-8;
  }

  p {
    font-size: $size-16;
    color: $color-g-54;
    margin-bottom: $size-24;
  }
}

.template-form {
  display: flex;
  flex-direction: column;
  gap: $size-20;

  .form-group {
    display: flex;
    flex-direction: column;
    gap: $size-8;

    label {
      font-size: $size-14;
      font-weight: $fw-medium;
      color: $color-g-21;
    }
  }

  .checkbox-label {
    flex-direction: row;
    align-items: center;
    gap: $size-8;
    cursor: pointer;

    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: $color-pri;
    }

    span {
      font-weight: $fw-regular;
    }
  }
}

.tooltip-icon {
  display: inline-block;
  margin-left: $size-4;
  font-size: $size-14;
  cursor: help;
  opacity: 0.7;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.field-hint {
  display: block;
  font-size: $size-12;
  color: $color-g-54;
  margin-top: $size-4;
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: $size-12;
  padding: $size-16;
}

// Responsive Design
@media (max-width: 768px) {
  .templates-container {
    padding: $size-16;
  }

  .templates-header {
    flex-direction: column;
    align-items: stretch;
    gap: $size-16;
    margin-bottom: $size-24;

    h1 {
      font-size: $size-24;
      margin-bottom: $size-4;
    }

    p {
      font-size: $size-14;
      margin-bottom: $size-12;
    }
  }

  .templates-list {
    grid-template-columns: 1fr;
    gap: $size-16;
  }

  .template-card {
    padding: $size-16;

    &__header {
      flex-wrap: wrap;
      gap: $size-8;
    }

    &__name {
      font-size: $size-16;
      flex: 1 1 100%;
    }

    &__category {
      font-size: $size-11;
      padding: $size-2 $size-8;
    }

    &__content {
      font-size: $size-12;
    }

    &__footer {
      flex-direction: column;
      align-items: flex-start;
      gap: $size-12;
    }

    &__actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

  .empty-state {
    padding: $size-48 $size-16;

    h3 {
      font-size: $size-18;
    }

    p {
      font-size: $size-14;
    }
  }

  .modal-footer {
    flex-direction: column-reverse;
    gap: $size-8;

    button {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .templates-header {
    h1 {
      font-size: $size-20;
    }

    p {
      font-size: $size-12;
    }
  }

  .template-card {
    padding: $size-12;

    &__name {
      font-size: $size-15;
    }

    &__content {
      font-size: $size-12;
    }
  }

  .empty-state {
    padding: $size-32 $size-12;
  }
}
</style>
