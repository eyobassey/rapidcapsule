<template>
  <div class="modal-overlay" @click.self="$emit('handleClose')">
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-icon">
          <v-icon name="hi-upload" scale="1.2" />
        </div>
        <div class="header-text">
          <h2>Upload Prescription</h2>
          <p>Upload a valid prescription from your healthcare provider</p>
        </div>
        <button class="close-btn" @click="$emit('handleClose')">
          <v-icon name="hi-x" scale="1" />
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <!-- Professional Name Input -->
        <div class="form-group">
          <label class="form-label">
            Name of Professional
            <span class="required">*</span>
          </label>
          <div class="input-wrapper">
            <v-icon name="hi-user" scale="0.9" class="input-icon" />
            <input
              type="text"
              v-model="nameOfProfessional"
              placeholder="Enter the prescribing doctor's name"
              class="form-input"
            />
          </div>
        </div>

        <!-- File Upload Area -->
        <div class="upload-section">
          <label class="form-label">
            Prescription Document
            <span class="required">*</span>
          </label>

          <!-- Drop Zone (when no file) -->
          <div
            v-if="!hasUploadedFile"
            class="drop-zone"
            :class="{ 'drop-zone--active': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="handleDrop"
            @click="$refs.upload.click()"
          >
            <input
              type="file"
              class="hidden"
              ref="upload"
              accept=".pdf,image/*"
              @change="onFileChange"
            />
            <div class="drop-zone-content">
              <div class="upload-icon">
                <v-icon name="hi-cloud-upload" scale="2" />
              </div>
              <h4>Drop your file here or click to browse</h4>
              <p>Supports: PDF, JPG, PNG (Max 10MB)</p>
            </div>
          </div>

          <!-- Uploaded File Preview -->
          <div v-else class="file-preview">
            <div class="file-info">
              <div class="file-icon">
                <v-icon name="hi-document-text" scale="1.5" />
              </div>
              <div class="file-details">
                <p class="file-name">{{ uploadedFileInfo.name }}</p>
                <p class="file-size">{{ formatFileSize(uploadedFileInfo.size) }}</p>
              </div>
            </div>
            <div class="file-actions">
              <button class="remove-btn" @click="clearUpload">
                <v-icon name="hi-trash" scale="0.9" />
              </button>
            </div>
            <div class="upload-progress" v-if="isProcessing">
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
              <span>Processing...</span>
            </div>
            <div class="upload-success" v-else>
              <v-icon name="hi-check-circle" scale="0.9" />
              <span>Ready to upload</span>
            </div>
          </div>
        </div>

        <!-- Info Notice -->
        <div class="info-notice">
          <v-icon name="hi-information-circle" scale="0.9" />
          <p>Make sure the prescription is clearly visible and includes the doctor's signature</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button class="btn-outline" @click="$emit('handleClose')">
          Cancel
        </button>
        <button
          class="btn-primary"
          @click="handleUploadPrescription"
          :disabled="!hasUploadedFile || !nameOfProfessional || isLoading"
        >
          <v-icon v-if="isLoading" name="hi-refresh" scale="0.9" class="spin" />
          <v-icon v-else name="hi-upload" scale="0.9" />
          {{ isLoading ? 'Uploading...' : 'Upload Prescription' }}
        </button>
      </div>

      <!-- Loader -->
      <div v-if="isLoading" class="loading-overlay">
        <Loader :useOverlay="false" />
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, inject } from "vue";
import { useToast } from "vue-toast-notification";
import Loader from "@/components/Loader/main-loader.vue";
import { STATUS_CODES } from "@/utilities/constants";

export default defineComponent({
  name: "UploadPrescriptionModal",
  emits: ["handleClose"],
  components: { Loader },

  setup: (_, { emit }) => {
    const $http = inject("$http");
    const $toast = useToast();

    const nameOfProfessional = ref("");
    const uploadedFile = ref(null);
    const hasUploadedFile = ref(false);
    const isLoading = ref(false);
    const isProcessing = ref(false);
    const isDragging = ref(false);
    const decodedString = ref("");
    const uploadedFileInfo = reactive({
      name: "",
      size: 0,
    });

    const formatFileSize = (bytes) => {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const convertFileToDataURL = (fileUploaded) => {
      return new Promise((resolve) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(fileUploaded);
        fileReader.onload = () => {
          resolve(fileReader?.result?.toString());
        };
      });
    };

    const processFile = async (file) => {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        $toast.error("File size must be less than 10MB");
        return false;
      }

      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        $toast.error("Please upload a PDF or image file");
        return false;
      }

      isProcessing.value = true;

      try {
        decodedString.value = await convertFileToDataURL(file);
        uploadedFile.value = file;
        uploadedFileInfo.name = file.name;
        uploadedFileInfo.size = file.size;
        hasUploadedFile.value = true;
      } catch (error) {
        $toast.error("Failed to process file");
        return false;
      } finally {
        isProcessing.value = false;
      }

      return true;
    };

    const onFileChange = async (event) => {
      const { files } = event.target;
      if (files[0]) {
        await processFile(files[0]);
      }
    };

    const handleDrop = async (event) => {
      isDragging.value = false;
      const files = event.dataTransfer?.files;
      if (files && files[0]) {
        await processFile(files[0]);
      }
    };

    const clearUpload = () => {
      hasUploadedFile.value = false;
      uploadedFile.value = null;
      uploadedFileInfo.name = "";
      uploadedFileInfo.size = 0;
      decodedString.value = "";
    };

    const handleUploadPrescription = async () => {
      const payload = {
        specialist: nameOfProfessional.value,
        documents: [
          {
            type_of_document: "Prescriptions",
            original_name: uploadedFileInfo.name,
            url: decodedString.value,
            file_type: uploadedFile.value?.type || "application/pdf",
          },
        ],
      };

      try {
        isLoading.value = true;
        const response = await $http.$_uploadPrescriptionDocument(payload);

        if (response) {
          const { statusCode: status } = response.data;

          if (status === STATUS_CODES.CREATED) {
            $toast.success("Prescription uploaded successfully!");
            emit("handleClose");
          }
        }
      } catch (error) {
        const serverError = error?.response?.data?.errorMessage;
        $toast.error(serverError || "Failed to upload prescription. Please try again.");
      } finally {
        isLoading.value = false;
      }
    };

    return {
      nameOfProfessional,
      onFileChange,
      uploadedFile,
      handleUploadPrescription,
      hasUploadedFile,
      uploadedFileInfo,
      clearUpload,
      decodedString,
      isLoading,
      isProcessing,
      isDragging,
      handleDrop,
      formatFileSize,
    };
  },
});
</script>

<style scoped lang="scss">
// Design System Variables
$sky: #4FC3F7;
$sky-light: #E1F5FE;
$sky-dark: #0288D1;
$sky-darker: #01579B;
$navy: #0F172A;
$slate: #64748B;
$gray-50: #F8FAFC;
$gray-100: #F1F5F9;
$gray-200: #E2E8F0;
$gray-300: #CBD5E1;
$success: #10B981;
$danger: #EF4444;

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
}

.modal-container {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  position: relative;

  @media (max-width: 480px) {
    border-radius: 16px;
    max-height: 95vh;
  }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px 24px 0;
  position: relative;

  .header-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;
    flex-shrink: 0;
  }

  .header-text {
    flex: 1;

    h2 {
      font-size: 20px;
      font-weight: 700;
      color: $navy;
      margin-bottom: 4px;
    }

    p {
      font-size: 14px;
      color: $slate;
    }
  }

  .close-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: none;
    background: $gray-100;
    color: $slate;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    &:hover {
      background: $gray-200;
      color: $navy;
    }
  }
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: $navy;
  margin-bottom: 8px;

  .required {
    color: $danger;
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .input-icon {
    position: absolute;
    left: 14px;
    color: $slate;
    pointer-events: none;
  }

  .form-input {
    width: 100%;
    padding: 14px 14px 14px 44px;
    border: 2px solid $gray-200;
    border-radius: 12px;
    font-size: 15px;
    font-family: inherit;
    transition: all 0.2s;
    background: $gray-50;

    &::placeholder {
      color: $slate;
    }

    &:focus {
      outline: none;
      border-color: $sky;
      background: white;
      box-shadow: 0 0 0 4px rgba($sky, 0.1);
    }
  }
}

.upload-section {
  margin-bottom: 24px;
}

.drop-zone {
  border: 2px dashed $gray-300;
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: $gray-50;

  &:hover,
  &--active {
    border-color: $sky;
    background: $sky-light;

    .upload-icon {
      color: $sky-dark;
      transform: scale(1.1);
    }
  }

  .upload-icon {
    color: $slate;
    margin-bottom: 16px;
    transition: all 0.2s;
  }

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: $navy;
    margin-bottom: 8px;
  }

  p {
    font-size: 13px;
    color: $slate;
  }
}

.hidden {
  display: none;
}

.file-preview {
  background: $gray-50;
  border: 2px solid $gray-200;
  border-radius: 16px;
  padding: 16px;

  .file-info {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 12px;
  }

  .file-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, $sky-light 0%, rgba($sky, 0.2) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $sky-dark;
    flex-shrink: 0;
  }

  .file-details {
    flex: 1;
    min-width: 0;

    .file-name {
      font-size: 14px;
      font-weight: 600;
      color: $navy;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .file-size {
      font-size: 13px;
      color: $slate;
    }
  }

  .file-actions {
    .remove-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: none;
      background: rgba($danger, 0.1);
      color: $danger;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: rgba($danger, 0.2);
      }
    }
  }

  .upload-progress {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid $gray-200;

    .progress-bar {
      flex: 1;
      height: 6px;
      background: $gray-200;
      border-radius: 3px;
      overflow: hidden;

      .progress-fill {
        height: 100%;
        width: 70%;
        background: linear-gradient(90deg, $sky 0%, $sky-dark 100%);
        border-radius: 3px;
        animation: progress 1.5s ease-in-out infinite;
      }
    }

    span {
      font-size: 13px;
      color: $slate;
    }
  }

  .upload-success {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 12px;
    border-top: 1px solid $gray-200;
    color: $success;
    font-size: 13px;
    font-weight: 500;
  }
}

.info-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: $sky-light;
  border-radius: 12px;
  border: 1px solid rgba($sky, 0.3);
  color: $sky-darker;

  p {
    font-size: 13px;
    line-height: 1.5;
    flex: 1;
  }
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid $gray-200;
  background: $gray-50;
  border-radius: 0 0 20px 20px;

  @media (max-width: 480px) {
    flex-direction: column-reverse;
  }
}

.btn-outline,
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-outline {
  background: white;
  border: 2px solid $gray-300;
  color: $slate;

  &:hover:not(:disabled) {
    border-color: $navy;
    color: $navy;
  }
}

.btn-primary {
  background: linear-gradient(135deg, $sky 0%, $sky-dark 100%);
  border: none;
  color: white;

  &:hover:not(:disabled) {
    box-shadow: 0 8px 20px rgba($sky-dark, 0.3);
    transform: translateY(-1px);
  }
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
}

@keyframes progress {
  0% {
    width: 0%;
  }
  50% {
    width: 70%;
  }
  100% {
    width: 100%;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
