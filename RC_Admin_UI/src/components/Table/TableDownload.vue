<script setup>
import html2pdf from "html2pdf.js"

const props = defineProps({
  btnTitle: {
    type: String,
    default: 'Download',
    required: false,
  },
  dialogTitle: {
    type: String,
    default: 'Download',
    required: false,
  },
  downloadBtn: {
    type: String,
    default: 'bx:cloud-download',
    required: false,
  },
  items: {
    type: Array,
    required: true,
  },
  itemElementId: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    required: false,
    default: 'rc-download',
  },
})

const emit = defineEmits([
  'download',
])

const isDownloadDialogVisible = ref(false)

const downloadOption = ref('')

const downloadItem = () => {
  if(downloadOption) {
    if(downloadOption.value == 'PDF')
      exportToPDF()
    isDownloadDialogVisible.value = false
  }
}

// 👉 export to pdf
const exportToPDF = () => {
  html2pdf(document.getElementById(props.itemElementId), {
    margin: 1,
    filename: props.itemName + '.pdf',
  })
}
</script>


<template>
  <!-- Dialog Activator -->
  <VBtn
    :prepend-icon="downloadBtn"
    color="#EAEAEA"
    class="table-filter-btn"
    @click="isDownloadDialogVisible = true"
  >
    <span class="table-download-btn-text">{{ btnTitle }}</span> 
  </VBtn> 
  <VDialog
    class="download-dialog"
    max-width="450"
    :model-value="isDownloadDialogVisible"
    @update:model-value="val => $emit('update:isDownloadDialogVisible', val)"
  >
    <!-- Dialog Content -->
    <VCard :title="dialogTitle">
      <DialogCloseBtn
        variant="text"
        size="small"
        style="color: #F16439 !important"
        @click="isDownloadDialogVisible = false"
      />
      <VDivider class="my-3" />
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            sm="8"
          >
            <VSelect
              v-model="downloadOption"
              :items="items"
            />
          </VCol>
        </VRow>
      </VCardText>

      <VCardText class="d-flex justify-end gap-2">
        <VBtn
          :prepend-icon="downloadBtn"
          @click.prevent="downloadItem"
        >
          {{ btnTitle }}
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
.download-dialog {
  .v-card.v-theme--light.v-card--density-default.v-card--variant-elevated {
    border-radius: 24px !important;
  }
  .v-card-title {
    font-weight: 600;
    color: #000;
  }

  .v-field__append-inner{
   padding: 8px 0 !important;
  }

  .v-field__field {
    height: 35px !important;
  }

  .v-field__input{
  padding: 8px !important;
  }
}

.table-filter-btn {
  color: #363636;
}
</style>
