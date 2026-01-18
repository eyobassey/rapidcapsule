
<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'

const props = defineProps({
  userData: {
    type: Object,
    required: true,
  },
})

const currentTab = ref(0)

// Get API base URL and token
const getApiConfig = () => {
  const tokenData = localStorage.getItem('accessToken')
  const token = tokenData ? JSON.parse(tokenData) : null

  return {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5021',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }
}

// Download file with presigned URL
const downloadFile = async (fileUrl) => {
  try {
    if (!fileUrl) return

    const config = getApiConfig()
    const response = await axios.get(
      `${config.baseURL}/specialists/file/presigned-url`,
      {
        params: { url: fileUrl },
        headers: config.headers
      }
    )

    if (response.data?.data?.url) {
      window.open(response.data.data.url, '_blank')
    }
  } catch (error) {
    console.error('Error downloading file:', error)
  }
}

// Computed properties to filter documents by type
const certifications = computed(() => {
  const docType = (doc) => doc.document_type || doc.type_of_document || doc.type
  return props.userData.documents?.filter(doc => {
    // Filter out invalid documents (must have URL)
    if (!doc.url && !doc.document_url) return false
    const type = docType(doc)
    return type === 'Certification' || type === 'Specialist Certification' || type === 'Training Certificate'
  }) || []
})

const licenses = computed(() => {
  const docType = (doc) => doc.document_type || doc.type_of_document || doc.type
  return props.userData.documents?.filter(doc => {
    // Filter out invalid documents (must have URL)
    if (!doc.url && !doc.document_url) return false
    const type = docType(doc)
    return type === 'Medical License' || type === 'License' || type === 'Professional Registration'
  }) || []
})

const awards = computed(() => {
  // Filter out invalid awards (must have title)
  return props.userData.awards?.filter(award => award.title || award.award_title) || []
})

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB')
}

</script>

<template>
  <VRow>
    <VCol
     
      cols="12"
    >
      <div
        v-if="props.userData"
        title=""
        class="mt-6 px-6 pt-4"
      >
        <VTabs
          v-model="currentTab"
          class="v-tabs-pillx"
        >
          <VTab>Certifications</VTab>
          <VTab>Licenses</VTab>
          <VTab>Awards</VTab>
        </VTabs>

        <VWindow
          v-model="currentTab"
          class="mt-5"
        >
          <!--  CERTIFICATES -->
          <VWindowItem>
            <VTable v-if="certifications.length > 0" class="text-no-wrap">
              <thead>
                <tr>
                  <th scope="col">
                    Name
                  </th>
                  <th scope="col">
                    Date Uploaded
                  </th>
                  <th scope="col">
                    Status
                  </th>
                  <th scope="col">
                    Document
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="cert in certifications"
                  :key="cert.document_url"
                >
                  <td class="d-flex align-center">
                    <div>
                      <p class="font-weight-medium mb-0 text-high-emphasis">
                        {{ cert.document_name || cert.original_name || 'Certification' }}
                      </p>
                      <p class="text-xs text-medium-emphasis mb-0">
                        {{ cert.document_type || cert.type_of_document || cert.type }}
                      </p>
                    </div>
                  </td>

                  <td>
                    {{ formatDate(cert.uploaded_at) }}
                  </td>

                  <td class="text-medium-emphasis">
                    <VChip
                      label
                      density="compact"
                      :color="cert.verified ? 'success' : 'warning'"
                    >
                      {{ cert.verified ? 'Verified' : 'Pending' }}
                    </VChip>
                  </td>

                  <td>
                    <VBtn
                      v-if="cert.url || cert.document_url"
                      size="small"
                      variant="text"
                      @click="downloadFile(cert.url || cert.document_url)"
                      icon="mdi-download"
                    />
                  </td>
                </tr>
              </tbody>
            </VTable>
            <div v-else class="notAvailable">
              <p>No certifications available</p>
            </div>
          </VWindowItem>

          <!--  LICENSES -->

          <VWindowItem>
            <VTable v-if="licenses.length > 0" class="text-no-wrap">
              <thead>
                <tr>
                  <th scope="col">
                    Name
                  </th>
                  <th scope="col">
                    Date Uploaded
                  </th>
                  <th scope="col">
                    Status
                  </th>
                  <th scope="col">
                    Document
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="license in licenses"
                  :key="license.document_url"
                >
                  <td class="d-flex align-center">
                    <div>
                      <p class="font-weight-medium mb-0 text-high-emphasis">
                        {{ license.document_name || license.original_name || 'Medical License' }}
                      </p>
                      <p class="text-xs text-medium-emphasis mb-0">
                        {{ license.document_type || license.type_of_document || license.type }}
                      </p>
                    </div>
                  </td>

                  <td>
                    {{ formatDate(license.uploaded_at) }}
                  </td>

                  <td class="text-medium-emphasis">
                    <VChip
                      label
                      density="compact"
                      :color="license.verified ? 'success' : 'warning'"
                    >
                      {{ license.verified ? 'Verified' : 'Pending' }}
                    </VChip>
                  </td>

                  <td>
                    <VBtn
                      v-if="license.url || license.document_url"
                      size="small"
                      variant="text"
                      @click="downloadFile(license.url || license.document_url)"
                      icon="mdi-download"
                    />
                  </td>
                </tr>
              </tbody>
            </VTable>
            <div v-else class="notAvailable">
              <p>No licenses available</p>
            </div>
          </VWindowItem>

          <!--  AWARDS -->
          <VWindowItem>
            <VTable v-if="awards.length > 0" class="text-no-wrap">
              <thead>
                <tr>
                  <th scope="col">
                    Award
                  </th>
                  <th scope="col">
                    Issuer
                  </th>
                  <th scope="col">
                    Date
                  </th>
                  <th scope="col">
                    File
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="award in awards"
                  :key="award.award_title || award.title"
                >
                  <td class="d-flex align-center">
                    <div>
                      <p class="font-weight-medium mb-0 text-high-emphasis">
                        {{ award.award_title || award.title }}
                      </p>
                      <p v-if="award.description" class="text-xs text-medium-emphasis mb-0">
                        {{ award.description }}
                      </p>
                    </div>
                  </td>

                  <td>
                    <span class="text-high-emphasis">{{ award.issuing_organization || award.issuer || 'N/A' }}</span>
                  </td>

                  <td>
                    {{ formatDate(award.date_received || award.date || award.year) }}
                  </td>

                  <td>
                    <VBtn
                      v-if="award.file && award.file.length > 0 && award.file[0].url"
                      size="small"
                      variant="text"
                      @click="downloadFile(award.file[0].url)"
                      icon="mdi-download"
                    />
                    <VBtn
                      v-else-if="award.award_file_url || award.file_url"
                      size="small"
                      variant="text"
                      @click="downloadFile(award.award_file_url || award.file_url)"
                      icon="mdi-download"
                    />
                  </td>
                </tr>
              </tbody>
            </VTable>
            <div v-else class="notAvailable">
              <p>No awards available</p>
            </div>
          </VWindowItem>
        </VWindow>
        <VDivider />
        <!-- 👉 project List table -->
      </div>
    </VCol>
  </VRow>
</template>

<style scoped lang="scss">
.notAvailable {
  padding: 18px;
  text-align: center;
}
</style>
