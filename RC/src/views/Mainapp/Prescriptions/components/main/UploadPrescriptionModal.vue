<template>
  <DialogModal
    title="Upload Prescription"
    @closeModal="$emit('handleClose')"
    :hasFooter="true"
  >
    <template v-slot:body>
      <div class="input__group">
        <Text
          class="col-2"
          type="text"
          label="Name of Professional"
          name="nameOfProfessional"
          :required="true"
          v-model="nameOfProfessional"
        />
      </div>
      <div class="input__uploadWrapper" v-if="!hasUploadedFile">
        <input
          type="file"
          class="hidden"
          ref="upload"
          accept=".pdf"
          @change="($event) => onFileChange($event)"
        />
        <rc-button
          type="text-secondary"
          label="Add file"
          size="large"
          :iconLeft="true"
          iconName="plus-colored"
          @click="$refs.upload.click()"
        />
      </div>
      <div class="input__uploadedWrapper" v-else>
        <div class="input__uploadedWrapper__leftContent">
          <p class="input__uploadedWrapper__leftContent__name">
            {{ uploadedFileInfo.name }}
          </p>
          <p class="input__uploadedWrapper__leftContent__size">
            {{ uploadedFileInfo.size }}KB
          </p>
        </div>
        <div class="input__uploadedWrapper__rightContent">
          <div
            class="input__uploadedWrapper__rightContent__wrapper"
            role="button"
            @click="clearUpload"
          >
            <Icons class="btn__close--icon" name="times-colored" />
          </div>
        </div>
      </div>
    </template>
    <template v-slot:foot>
      <Button
        type="primary"
        label="Save"
        size="medium"
        class="button"
        @click="handleUploadPrescription"
        :disabled="!hasUploadedFile || !nameOfProfessional || isLoading"
      />
    </template>
    <template v-slot:loader>
      <Loader v-if="isLoading" :useOverlay="true" :rounded="true" />
    </template>
  </DialogModal>
</template>

<script>
import { defineComponent, ref, reactive, inject } from "vue";
import { useToast } from "vue-toast-notification";
import DialogModal from "@/components/modals/dialog-modal.vue";
import Text from "@/components/inputs/text.vue";
import Button from "@/components/buttons/button-primary.vue";
import RcButton from "@/components/buttons/button-primary";
import Icons from "@/components/icons.vue";
import Loader from "@/components/Loader/main-loader.vue";
import { STATUS_CODES } from "@/utilities/constants";

export default defineComponent({
  name: "Upload Prescription",
  emits: ["handleClose"],
  components: { DialogModal, Text, Button, RcButton, Icons, Loader },

  setup: (_, { emit }) => {
    const $http = inject("$http");
    const $toast = useToast();

    const nameOfProfessional = ref("");
    const uploadedFile = ref(null);
    const hasUploadedFile = ref(false);
    const isLoading = ref(false);
    const decodedString = ref("");
    const uploadedFileInfo = reactive({
      name: "",
      size: "",
    });

    const convertfileToPDFDataURL = (fileUploaded) => {
      const file_Reader = new FileReader();

      file_Reader.readAsDataURL(fileUploaded);
      file_Reader.onload = () => {
        decodedString.value = file_Reader?.result?.toString();
      };
    };

    const onFileChange = (event) => {
      const { files } = event.target;

      if (files[0]) {
        convertfileToPDFDataURL(files[0]);
        uploadedFile.value = files[0];
        uploadedFileInfo.name = files[0].name;
        uploadedFileInfo.size = files[0].size;

        setTimeout(() => {
          hasUploadedFile.value = true;
        }, 2000);
      }
    };

    const clearUpload = () => {
      hasUploadedFile.value = false;
      uploadedFile.value = null;
      uploadedFileInfo.name = "";
      uploadedFileInfo.size = "";
    };

    const handleUploadPrescription = async () => {
      const payload = {
        specialist: nameOfProfessional.value,
        documents: [
          {
            type_of_document: "Prescriptions",
            original_name: uploadedFileInfo.name,
            url: decodedString.value,
            file_type: "application/pdf",
          },
        ],
      };

      try {
        isLoading.value = true;
        const response = await $http.$_uploadPrescriptionDocument(payload);
        console.log(response, "response");
        if (response) {
          const { statusCode: status } = response.data;

          if (status === STATUS_CODES.CREATED) {
            $toast.success("Prescription has been uploaded successfully");
            emit("handleClose");
          }
        }
      } catch (error) {
        const {
          response: {
            data: { errorMessage: serverError },
          },
        } = error;

        $toast.error(serverError || "An error has occured, please try again");
      }
      isLoading.value = false;
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
    };
  },
});
</script>

<style scoped lang="scss">
.input {
  &__uploadWrapper {
    margin-top: $size-72;

    @include flexItem(vertical) {
      justify-content: center;
      align-items: center;
    }
  }

  &__uploadedWrapper {
    background-color: #fefaf9;
    border-radius: $size-10;
    margin: $size-48 0;
    padding: $size-24 $size-11;

    @include flexItem(horizontal) {
      justify-content: space-between;
    }

    &__leftContent {
      @include flexItem(vertical) {
        gap: $size-16;
      }

      &__name {
        font-weight: 400;
        font-size: 16px;
        color: $color-g-21;
      }

      &__size {
        font-size: 12px;
        color: $color-g-54;
      }
    }

    &__rightContent {
      @include flexItem(vertical) {
        justify-content: center;
        align-items: center;
      }

      &__wrapper {
        height: fit-content;
        background-color: $color-white;
        padding: $size-12;
        border-radius: $size-10;
        cursor: pointer;
      }
    }
  }
}
</style>
