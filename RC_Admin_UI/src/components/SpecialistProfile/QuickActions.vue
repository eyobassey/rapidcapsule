<template>
  <VCard class="mb-4">
    <VCardText>
      <h6 class="text-h6 mb-4">
        Quick Actions
      </h6>

      <VRow class="g-2">
        <VCol cols="6">
          <VBtn
            variant="outlined"
            color="primary"
            size="small"
            block
            prepend-icon="bx-message"
            @click="showMessageDialog = true"
          >
            Message
          </VBtn>
        </VCol>

        <VCol cols="6">
          <VBtn
            variant="outlined"
            color="success"
            size="small"
            block
            prepend-icon="bx-phone"
            @click="callSpecialist"
          >
            Call
          </VBtn>
        </VCol>

        <VCol cols="6">
          <VBtn
            v-if="!userData.is_suspended"
            variant="outlined"
            color="warning"
            size="small"
            block
            prepend-icon="bx-block"
            @click="showSuspendDialog = true"
          >
            Suspend
          </VBtn>
          <VBtn
            v-else
            variant="outlined"
            color="success"
            size="small"
            block
            prepend-icon="bx-check-circle"
            @click="reactivateAccount"
          >
            Reactivate
          </VBtn>
        </VCol>

        <VCol cols="6">
          <VBtn
            variant="outlined"
            color="info"
            size="small"
            block
            prepend-icon="bx-edit"
            @click="showEditDialog = true"
          >
            Edit
          </VBtn>
        </VCol>

        <VCol cols="12">
          <VBtn
            variant="outlined"
            color="secondary"
            size="small"
            block
            prepend-icon="bx-calendar-plus"
            @click="showAppointmentDialog = true"
          >
            Schedule Appointment
          </VBtn>
        </VCol>

        <VCol cols="12">
          <VBtn
            variant="outlined"
            color="error"
            size="small"
            block
            prepend-icon="bx-shield-x"
            @click="showDeactivateDialog = true"
          >
            Deactivate Account
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>
    
    <!-- Suspend Account Dialog -->
    <VDialog
      v-model="showSuspendDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="text-h6">
          Suspend Specialist Account
        </VCardTitle>
        
        <VCardText>
          <p class="mb-4">
            Are you sure you want to suspend this specialist's account? They will be unable to access the platform while suspended.
          </p>
          
          <VTextField
            v-model="suspendReason"
            label="Reason for suspension"
            placeholder="Enter reason for suspension..."
            variant="outlined"
            rows="3"
            multiline
          />
        </VCardText>
        
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="showSuspendDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="warning"
            variant="flat"
            @click="suspendAccount"
            :loading="suspending"
          >
            Suspend Account
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
    
    <!-- Deactivate Account Dialog -->
    <VDialog
      v-model="showDeactivateDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="text-h6">
          Deactivate Specialist Account
        </VCardTitle>
        
        <VCardText>
          <p class="mb-4 text-error">
            <strong>Warning:</strong> This action will permanently deactivate the specialist's account. This cannot be undone.
          </p>
          
          <VTextField
            v-model="deactivateReason"
            label="Reason for deactivation"
            placeholder="Enter reason for deactivation..."
            variant="outlined"
            rows="3"
            multiline
          />
          
          <VCheckbox
            v-model="confirmDeactivation"
            label="I understand this action cannot be undone"
            color="error"
          />
        </VCardText>
        
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="showDeactivateDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="error"
            variant="flat"
            @click="deactivateAccount"
            :loading="deactivating"
            :disabled="!confirmDeactivation || !deactivateReason.trim()"
          >
            Deactivate Account
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
    
    <!-- Message Dialog -->
    <VDialog
      v-model="showMessageDialog"
      max-width="600"
    >
      <VCard>
        <VCardTitle class="text-h6">
          Send Message to Specialist
        </VCardTitle>

        <VCardText>
          <VTextField
            v-model="messageSubject"
            label="Subject"
            placeholder="Enter email subject..."
            variant="outlined"
            class="mb-4"
          />

          <VTextarea
            v-model="messageBody"
            label="Message"
            placeholder="Enter your message..."
            variant="outlined"
            rows="5"
          />
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="showMessageDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            @click="sendMessageEmail"
            :loading="sendingMessage"
            :disabled="!messageSubject.trim() || !messageBody.trim()"
          >
            Send Email
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Specialist Dialog -->
    <VDialog
      v-model="showEditDialog"
      max-width="1000"
      scrollable
    >
      <VCard>
        <VCardTitle class="text-h6 d-flex align-center">
          <VIcon icon="bx-edit" class="mr-2" />
          Edit Specialist Information
        </VCardTitle>

        <VDivider />

        <VCardText style="max-height: 70vh;">
          <!-- Personal Information Section -->
          <div class="mb-6">
            <h6 class="text-subtitle-1 font-weight-semibold mb-3">
              <VIcon icon="bx-user" size="20" class="mr-1" />
              Personal Information
            </h6>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="editForm.first_name"
                  label="First Name *"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="editForm.last_name"
                  label="Last Name *"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="editForm.gender"
                  label="Gender"
                  :items="[
                    { value: 'Male', title: 'Male' },
                    { value: 'Female', title: 'Female' },
                    { value: 'Other', title: 'Other' }
                  ]"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="editForm.date_of_birth"
                  label="Date of Birth"
                  type="date"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="editForm.marital_status"
                  label="Marital Status"
                  :items="[
                    { value: 'Single', title: 'Single' },
                    { value: 'Married', title: 'Married' },
                    { value: 'Divorced', title: 'Divorced' },
                    { value: 'Widowed', title: 'Widowed' }
                  ]"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </VCol>
            </VRow>
          </div>

          <VDivider class="my-4" />

          <!-- Contact Information Section -->
          <div class="mb-6">
            <h6 class="text-subtitle-1 font-weight-semibold mb-3">
              <VIcon icon="bx-phone" size="20" class="mr-1" />
              Contact Information
            </h6>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="editForm.email"
                  label="Email *"
                  type="email"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="3">
                <VTextField
                  v-model="editForm.country_code"
                  label="Country Code"
                  variant="outlined"
                  density="compact"
                  placeholder="+234"
                />
              </VCol>
              <VCol cols="12" md="3">
                <VTextField
                  v-model="editForm.phone"
                  label="Phone Number"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="editForm.address1"
                  label="Address Line 1"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="editForm.address2"
                  label="Address Line 2"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="editForm.state"
                  label="State/Province"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="editForm.country"
                  label="Country"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="editForm.zip_code"
                  label="ZIP/Postal Code"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
            </VRow>
          </div>

          <VDivider class="my-4" />

          <!-- Professional Practice Section (Specialist-specific) -->
          <div class="mb-6">
            <h6 class="text-subtitle-1 font-weight-semibold mb-3">
              <VIcon icon="bx-briefcase" size="20" class="mr-1" />
              Professional Practice
            </h6>
            <VRow>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="editForm.category"
                  label="Specialty Category"
                  :items="specialtyCategories"
                  variant="outlined"
                  density="compact"
                  item-title="title"
                  item-value="value"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="editForm.area_of_specialty"
                  label="Area of Specialty"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="editForm.license_number"
                  label="Medical License Number"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="editForm.years_of_practice"
                  label="Years of Practice"
                  type="number"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="editForm.consultation_fee"
                  label="Consultation Fee (₦)"
                  type="number"
                  variant="outlined"
                  density="compact"
                  prefix="₦"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="editForm.university_name"
                  label="University Name"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="editForm.university_start_year"
                  label="University Start Year"
                  type="number"
                  variant="outlined"
                  density="compact"
                  placeholder="2010"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="editForm.university_end_year"
                  label="University End Year"
                  type="number"
                  variant="outlined"
                  density="compact"
                  placeholder="2016"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="editForm.housemanship_name"
                  label="Place of Housemanship"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="editForm.housemanship_start_year"
                  label="Housemanship Start"
                  type="date"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model="editForm.housemanship_end_year"
                  label="Housemanship End"
                  type="date"
                  variant="outlined"
                  density="compact"
                />
              </VCol>
            </VRow>
          </div>

          <VDivider class="my-4" />

          <!-- Documents & Certifications Section -->
          <div class="mb-6">
            <h6 class="text-subtitle-1 font-weight-semibold mb-3">
              <VIcon icon="bx-file" size="20" class="mr-1" />
              Documents & Certifications
            </h6>

            <!-- Existing Documents -->
            <div v-if="editForm.documents.length > 0" class="mb-4">
              <VList density="compact">
                <VListItem
                  v-for="(doc, index) in editForm.documents"
                  :key="index"
                  class="mb-2"
                  border
                >
                  <template #prepend>
                    <VIcon icon="bx-file-blank" size="20" class="mr-2" />
                  </template>
                  <VListItemTitle>{{ doc.type_of_document || doc.document_type || 'Document' }}</VListItemTitle>
                  <VListItemSubtitle v-if="doc.original_name || doc.document_name">
                    {{ doc.original_name || doc.document_name }}
                  </VListItemSubtitle>
                  <template #append>
                    <VBtn
                      v-if="doc.url || doc.document_url"
                      icon="bx-download"
                      size="small"
                      variant="text"
                      color="primary"
                      @click="downloadFile(doc.url || doc.document_url)"
                      class="mr-2"
                    >
                      <VTooltip activator="parent" location="top">Download</VTooltip>
                    </VBtn>
                    <VBtn
                      icon="bx-trash"
                      size="small"
                      variant="text"
                      color="error"
                      @click="removeDocument(index)"
                    >
                      <VTooltip activator="parent" location="top">Remove</VTooltip>
                    </VBtn>
                  </template>
                </VListItem>
              </VList>
            </div>

            <!-- Add New Document Form -->
            <VCard variant="outlined" class="pa-4">
              <VRow>
                <VCol cols="12" md="4">
                  <VSelect
                    v-model="newDocument.type_of_document"
                    label="Document Type *"
                    :items="documentTypes"
                    variant="outlined"
                    density="compact"
                  />
                </VCol>
                <VCol cols="12" md="5">
                  <VFileInput
                    v-model="newDocument.file"
                    label="Upload Document"
                    variant="outlined"
                    density="compact"
                    prepend-icon=""
                    prepend-inner-icon="bx-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    show-size
                  />
                </VCol>
                <VCol cols="12" md="3">
                  <VBtn
                    color="primary"
                    variant="outlined"
                    block
                    @click="addDocument"
                    :disabled="!newDocument.type_of_document || !newDocument.file"
                  >
                    <VIcon icon="bx-plus" class="mr-1" />
                    Add Document
                  </VBtn>
                </VCol>
              </VRow>
            </VCard>
          </div>

          <VDivider class="my-4" />

          <!-- Awards Section -->
          <div class="mb-4">
            <h6 class="text-subtitle-1 font-weight-semibold mb-3">
              <VIcon icon="bx-trophy" size="20" class="mr-1" />
              Awards & Achievements
            </h6>

            <!-- Existing Awards -->
            <div v-if="editForm.awards.length > 0" class="mb-4">
              <VList density="compact">
                <VListItem
                  v-for="(award, index) in editForm.awards"
                  :key="index"
                  class="mb-2"
                  border
                >
                  <template #prepend>
                    <VIcon icon="bx-award" size="20" class="mr-2" color="warning" />
                  </template>
                  <VListItemTitle>{{ award.title || award.award_title || 'Award' }}</VListItemTitle>
                  <VListItemSubtitle v-if="award.description">{{ award.description }}</VListItemSubtitle>
                  <VListItemSubtitle v-if="award.date || award.date_received">
                    {{ award.date || award.date_received }}
                  </VListItemSubtitle>
                  <template #append>
                    <VBtn
                      v-if="(award.file && award.file.length > 0 && award.file[0].url) || award.file_url || award.award_file_url"
                      icon="bx-download"
                      size="small"
                      variant="text"
                      color="primary"
                      @click="downloadFile((award.file && award.file.length > 0 && award.file[0].url) || award.file_url || award.award_file_url)"
                      class="mr-2"
                    >
                      <VTooltip activator="parent" location="top">Download</VTooltip>
                    </VBtn>
                    <VBtn
                      icon="bx-trash"
                      size="small"
                      variant="text"
                      color="error"
                      @click="removeAward(index)"
                    >
                      <VTooltip activator="parent" location="top">Remove</VTooltip>
                    </VBtn>
                  </template>
                </VListItem>
              </VList>
            </div>

            <!-- Add New Award Form -->
            <VCard variant="outlined" class="pa-4">
              <VRow>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="newAward.title"
                    label="Award Title *"
                    variant="outlined"
                    density="compact"
                  />
                </VCol>
                <VCol cols="12" md="6">
                  <VTextField
                    v-model="newAward.date"
                    label="Date Received"
                    type="date"
                    variant="outlined"
                    density="compact"
                  />
                </VCol>
                <VCol cols="12">
                  <VTextarea
                    v-model="newAward.description"
                    label="Description"
                    variant="outlined"
                    density="compact"
                    rows="2"
                  />
                </VCol>
                <VCol cols="12" md="8">
                  <VFileInput
                    v-model="newAward.file"
                    label="Upload Award Document (Optional)"
                    variant="outlined"
                    density="compact"
                    prepend-icon=""
                    prepend-inner-icon="bx-upload"
                    accept=".pdf,.jpg,.jpeg,.png"
                    show-size
                  />
                </VCol>
                <VCol cols="12" md="4">
                  <VBtn
                    color="warning"
                    variant="outlined"
                    block
                    @click="addAward"
                    :disabled="!newAward.title"
                  >
                    <VIcon icon="bx-plus" class="mr-1" />
                    Add Award
                  </VBtn>
                </VCol>
              </VRow>
            </VCard>
          </div>
        </VCardText>

        <VDivider />

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="showEditDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            @click="saveSpecialistEdit"
            :loading="savingEdit"
          >
            <VIcon icon="bx-save" class="mr-1" />
            Save Changes
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Schedule Appointment Dialog -->
    <VDialog
      v-model="showAppointmentDialog"
      max-width="900"
      eager
    >
      <VCard>
        <VCardTitle class="text-h6 d-flex align-center">
          <VIcon icon="bx-calendar-plus" class="mr-2" />
          Schedule Appointment for Specialist
        </VCardTitle>

        <VDivider />

        <VCardText style="max-height: 60vh; overflow-y: auto;">
          <VRow>
            <!-- Patient Selection -->
            <VCol cols="12">
              <VSelect
                v-model="appointmentForm.patient_id"
                label="Select Patient *"
                :items="patients"
                placeholder="Choose a patient..."
                variant="outlined"
                :loading="loadingPatients"
                :disabled="loadingPatients"
                item-title="title"
                item-value="value"
                :menu-props="{ maxHeight: 300 }"
              />
            </VCol>

            <!-- Category -->
            <VCol cols="12" md="6">
              <VSelect
                v-model="appointmentForm.category"
                label="Specialty Category *"
                :items="specialtyCategories"
                placeholder="Choose category..."
                variant="outlined"
                item-title="title"
                item-value="value"
                :menu-props="{ maxHeight: 300 }"
              />
            </VCol>

            <!-- Appointment Type -->
            <VCol cols="12" md="6">
              <VSelect
                v-model="appointmentForm.appointment_type"
                label="Appointment Type *"
                :items="appointmentTypes"
                placeholder="Choose type..."
                variant="outlined"
                item-title="title"
                item-value="value"
                :menu-props="{ maxHeight: 300 }"
              />
            </VCol>

            <!-- Date Selection with Calendar -->
            <VCol cols="12">
              <DatePickerCalendar
                v-model="appointmentForm.appointment_date"
                label="Appointment Date *"
                mode="date"
                :min-date="new Date()"
                :expanded="true"
                :appointment-dates="specialistAppointmentDates"
              />
              <VChip
                v-if="specialistAppointmentDates.length > 0"
                size="small"
                color="info"
                class="mt-2"
              >
                <VIcon icon="mdi-information-outline" size="16" class="mr-1" />
                Blue dots indicate days with existing appointments
              </VChip>
            </VCol>

            <!-- Time and Duration -->
            <VCol cols="12" md="6">
              <VSelect
                v-model="appointmentForm.start_time"
                label="Start Time *"
                :items="timeSlots"
                variant="outlined"
                prepend-inner-icon="mdi-clock-outline"
                placeholder="Select time"
                item-title="title"
                item-value="value"
                :menu-props="{ maxHeight: 300 }"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VSelect
                v-model="appointmentForm.duration_minutes"
                label="Duration *"
                :items="durationOptions"
                variant="outlined"
                prepend-inner-icon="mdi-timer-outline"
                placeholder="Select duration"
                item-title="title"
                item-value="value"
                :menu-props="{ maxHeight: 300 }"
              />
            </VCol>

            <VCol cols="12" md="6">
              <VTextField
                v-model="appointmentForm.consultation_fee"
                label="Consultation Fee"
                type="number"
                variant="outlined"
                prefix="₦"
                placeholder="0"
              />
            </VCol>

            <!-- Meeting Channel -->
            <VCol cols="12">
              <VSelect
                v-model="appointmentForm.meeting_channel"
                label="Meeting Channel *"
                :items="meetingChannels"
                placeholder="Choose meeting channel..."
                variant="outlined"
                item-title="title"
                item-value="value"
                :menu-props="{ maxHeight: 300 }"
              />
            </VCol>

            <!-- Conditional Channel-Specific Fields -->
            <VCol v-if="appointmentForm.meeting_channel === 'whatsapp'" cols="12">
              <VTextField
                v-model="appointmentForm.whatsapp_number"
                label="WhatsApp Number *"
                variant="outlined"
                placeholder="+234 XXX XXX XXXX"
              />
            </VCol>

            <VCol v-if="appointmentForm.meeting_channel === 'phone'" cols="12">
              <VTextField
                v-model="appointmentForm.phone_number"
                label="Phone Number *"
                variant="outlined"
                placeholder="+234 XXX XXX XXXX"
              />
            </VCol>

            <VCol v-if="appointmentForm.meeting_channel === 'in_person'" cols="12">
              <VTextField
                v-model="appointmentForm.location"
                label="Meeting Location *"
                variant="outlined"
                placeholder="Enter physical address..."
              />
            </VCol>

            <!-- Timezone -->
            <VCol cols="12">
              <VSelect
                v-model="appointmentForm.timezone"
                label="Timezone"
                :items="timezones"
                placeholder="Choose timezone..."
                variant="outlined"
                item-title="title"
                item-value="value"
                :menu-props="{ maxHeight: 300 }"
              />
            </VCol>

            <!-- Notes -->
            <VCol cols="12">
              <VTextarea
                v-model="appointmentForm.patient_notes"
                label="Patient Notes (Optional)"
                placeholder="Notes that will be visible to patient..."
                variant="outlined"
                rows="2"
              />
            </VCol>

            <VCol cols="12">
              <VTextarea
                v-model="appointmentForm.admin_notes"
                label="Admin Notes (Optional)"
                placeholder="Internal admin notes..."
                variant="outlined"
                rows="2"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="outlined"
            @click="showAppointmentDialog = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="secondary"
            variant="flat"
            @click="createAppointment"
            :loading="creatingAppointment"
            :disabled="!isAppointmentFormValid"
          >
            <VIcon icon="bx-check" class="mr-1" />
            Schedule Appointment
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Success/Error Snackbar -->
    <VSnackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="3000"
    >
      {{ snackbarMessage }}
    </VSnackbar>
  </VCard>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import DatePickerCalendar from '@/components/DatePickerCalendar.vue'

const props = defineProps({
  userData: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['refresh-specialist'])

const router = useRouter()

// Dialog states
const showSuspendDialog = ref(false)
const showDeactivateDialog = ref(false)
const showMessageDialog = ref(false)
const showEditDialog = ref(false)
const showAppointmentDialog = ref(false)
const datePickerMenu = ref(false)

// Form states
const suspendReason = ref('')
const deactivateReason = ref('')
const confirmDeactivation = ref(false)
const messageSubject = ref('')
const messageBody = ref('')
const editForm = ref({
  // Personal Information
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  country_code: '',
  gender: '',
  date_of_birth: '',
  marital_status: '',
  // Contact Information
  address1: '',
  address2: '',
  state: '',
  country: '',
  zip_code: '',
  // Professional Practice (Specialist-specific)
  category: '',
  area_of_specialty: '',
  university_name: '',
  university_start_year: '',
  university_end_year: '',
  housemanship_name: '',
  housemanship_start_year: '',
  housemanship_end_year: '',
  license_number: '',
  years_of_practice: '',
  consultation_fee: null,
  // Documents/Certifications
  documents: [],
  // Awards
  awards: []
})

// Document types for dropdown
const documentTypes = ref([
  { value: 'Medical License', title: 'Medical License' },
  { value: 'Degree Certificate', title: 'Degree Certificate' },
  { value: 'Specialist Certification', title: 'Specialist Certification' },
  { value: 'Professional Registration', title: 'Professional Registration' },
  { value: 'Training Certificate', title: 'Training Certificate' },
  { value: 'Other', title: 'Other' }
])
const appointmentForm = ref({
  patient_id: '',
  specialist_id: '',
  category: '',
  appointment_date: '',
  start_time: '',
  duration_minutes: 30,
  timezone: 'Africa/Lagos',
  appointment_type: '',
  consultation_fee: 0,
  patient_notes: '',
  admin_notes: '',
  meeting_channel: 'zoom',
  whatsapp_number: '',
  location: '',
  phone_number: ''
})

// Dropdown options
const specialtyCategories = ref([
  { value: 'General Practice', title: 'General Practice' },
  { value: 'Cardiology', title: 'Cardiology' },
  { value: 'Dermatology', title: 'Dermatology' },
  { value: 'Pediatrics', title: 'Pediatrics' },
  { value: 'Psychiatry', title: 'Psychiatry' },
  { value: 'Orthopedics', title: 'Orthopedics' },
  { value: 'Neurology', title: 'Neurology' },
  { value: 'Gynecology', title: 'Gynecology' },
  { value: 'Ophthalmology', title: 'Ophthalmology' },
  { value: 'ENT', title: 'ENT (Ear, Nose, Throat)' },
  { value: 'Urology', title: 'Urology' },
  { value: 'Oncology', title: 'Oncology' },
  { value: 'Endocrinology', title: 'Endocrinology' },
  { value: 'Gastroenterology', title: 'Gastroenterology' },
  { value: 'Nephrology', title: 'Nephrology' },
  { value: 'Pulmonology', title: 'Pulmonology' },
  { value: 'Rheumatology', title: 'Rheumatology' },
  { value: 'Hematology', title: 'Hematology' },
  { value: 'Infectious Disease', title: 'Infectious Disease' },
  { value: 'Physical Therapy', title: 'Physical Therapy' },
  { value: 'Nutrition', title: 'Nutrition & Dietetics' },
  { value: 'Mental Health', title: 'Mental Health / Psychology' },
  { value: 'Other', title: 'Other' }
])

const appointmentTypes = ref([
  { value: 'Initial Consultation', title: 'Initial Consultation' },
  { value: 'Follow-up', title: 'Follow-up' },
  { value: 'Check-up', title: 'Check-up' },
  { value: 'Emergency', title: 'Emergency' },
  { value: 'Routine', title: 'Routine' },
  { value: 'Specialist Referral', title: 'Specialist Referral' },
  { value: 'Lab Results Review', title: 'Lab Results Review' },
  { value: 'Prescription Refill', title: 'Prescription Refill' },
  { value: 'Second Opinion', title: 'Second Opinion' },
  { value: 'Post-operative', title: 'Post-operative' },
  { value: 'Therapy Session', title: 'Therapy Session' },
  { value: 'Vaccination', title: 'Vaccination' },
  { value: 'Other', title: 'Other' }
])

const meetingChannels = ref([
  { value: 'zoom', title: 'Zoom Video Call' },
  // { value: 'google_meet', title: 'Google Meet' }, // TODO: Implement Google Meet integration
  // { value: 'microsoft_teams', title: 'Microsoft Teams' }, // TODO: Implement Microsoft Teams integration
  { value: 'whatsapp', title: 'WhatsApp Call' },
  { value: 'phone', title: 'Phone Call' },
  { value: 'in_person', title: 'In-Person Visit' }
])

const timezones = ref([
  { value: 'Africa/Lagos', title: 'West Africa Time (WAT)' },
  { value: 'UTC', title: 'UTC' },
  { value: 'America/New_York', title: 'Eastern Time (ET)' },
  { value: 'America/Chicago', title: 'Central Time (CT)' },
  { value: 'America/Los_Angeles', title: 'Pacific Time (PT)' },
  { value: 'Europe/London', title: 'British Time (GMT/BST)' },
  { value: 'Europe/Paris', title: 'Central European Time (CET)' },
  { value: 'Asia/Dubai', title: 'Gulf Standard Time (GST)' },
  { value: 'Asia/Kolkata', title: 'India Standard Time (IST)' },
  { value: 'Asia/Tokyo', title: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', title: 'Australian Eastern Time (AET)' }
])

// Generate time slots (9 AM to 5 PM in 30-minute intervals)
const timeSlots = computed(() => {
  const slots = []
  for (let hour = 9; hour < 17; hour++) {
    for (let minute of [0, 30]) {
      const displayHour = hour > 12 ? hour - 12 : hour
      const period = hour >= 12 ? 'PM' : 'AM'
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const time12 = `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
      slots.push({
        value: time24,
        title: time12
      })
    }
  }
  return slots
})

// Duration options
const durationOptions = [
  { value: 15, title: '15 minutes' },
  { value: 30, title: '30 minutes' },
  { value: 45, title: '45 minutes' },
  { value: 60, title: '1 hour' },
  { value: 90, title: '1.5 hours' },
  { value: 120, title: '2 hours' }
]

// Computed validation
const isAppointmentFormValid = computed(() => {
  const form = appointmentForm.value
  const baseValid = form.patient_id && form.category && form.appointment_date &&
                    form.start_time && form.appointment_type && form.meeting_channel

  // Channel-specific validation
  if (form.meeting_channel === 'whatsapp' && !form.whatsapp_number) return false
  if (form.meeting_channel === 'phone' && !form.phone_number) return false
  if (form.meeting_channel === 'in_person' && !form.location) return false

  return baseValid
})

// Format selected date for display
const formattedDate = computed(() => {
  if (!appointmentForm.value.appointment_date) return ''

  try {
    const date = new Date(appointmentForm.value.appointment_date)
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  } catch (error) {
    return appointmentForm.value.appointment_date
  }
})

// Loading states
const suspending = ref(false)
const deactivating = ref(false)
const sendingMessage = ref(false)
const savingEdit = ref(false)
const creatingAppointment = ref(false)

// Snackbar states
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Patients list
const patients = ref([])
const loadingPatients = ref(false)
const specialistAppointmentDates = ref([])

// New document and award forms
const newDocument = ref({
  type_of_document: '',
  file: null
})

const newAward = ref({
  title: '',
  description: '',
  date: '',
  file: null
})

// File upload state
const uploadingFile = ref(false)

// Methods to manage documents
const addDocument = () => {
  if (!newDocument.value.type_of_document || !newDocument.value.file) {
    showNotification('Please select document type and file', 'error')
    return
  }

  // Add document to the list (file will be uploaded when saving)
  editForm.value.documents.push({
    type_of_document: newDocument.value.type_of_document,
    file: newDocument.value.file[0], // VFileInput returns array
    original_name: newDocument.value.file[0]?.name,
    file_type: newDocument.value.file[0]?.type,
    url: '', // Will be set after upload
    isNew: true // Flag to identify new documents
  })

  // Reset form
  newDocument.value = {
    type_of_document: '',
    file: null
  }

  showNotification('Document added. Save changes to upload.', 'success')
}

const removeDocument = (index) => {
  editForm.value.documents.splice(index, 1)
  showNotification('Document removed', 'info')
}

// Methods to manage awards
const addAward = () => {
  if (!newAward.value.title) {
    showNotification('Please enter award title', 'error')
    return
  }

  const award = {
    title: newAward.value.title,
    description: newAward.value.description,
    date: newAward.value.date,
    file: newAward.value.file ? [{
      file: newAward.value.file[0],
      original_name: newAward.value.file[0]?.name,
      file_type: newAward.value.file[0]?.type,
      url: '',
      isNew: true
    }] : [],
    isNew: true
  }

  editForm.value.awards.push(award)

  // Reset form
  newAward.value = {
    title: '',
    description: '',
    date: '',
    file: null
  }

  showNotification('Award added. Save changes to upload.', 'success')
}

const removeAward = (index) => {
  editForm.value.awards.splice(index, 1)
  showNotification('Award removed', 'info')
}

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

// Fetch active patients
const fetchActivePatients = async () => {
  loadingPatients.value = true

  try {
    const config = getApiConfig()
    console.log('Fetching active patients from:', `${config.baseURL}/dashboard/patients/active`)

    const response = await axios.get(
      `${config.baseURL}/dashboard/patients/active`,
      { headers: config.headers }
    )

    console.log('Patients response:', response.data)

    // The API returns data in response.data.data or response.data.result
    const patientData = response.data.data || response.data.result || []

    if (response.status === 200 && patientData && patientData.length > 0) {
      patients.value = patientData.map(patient => ({
        value: patient.id,
        title: `${patient.name} - ${patient.email || ''}`
      }))
      console.log('Mapped patients:', patients.value)
    } else {
      console.warn('No patients found. Response:', response.data)
      showNotification('No active patients found in the system', 'warning')
      patients.value = []
    }
  } catch (error) {
    console.error('Error fetching patients:', error)
    showNotification('Failed to load patients', 'error')
  } finally {
    loadingPatients.value = false
  }
}

// Fetch specialist's existing appointments
const fetchSpecialistAppointments = async (specialistId) => {
  if (!specialistId) {
    specialistAppointmentDates.value = []
    return
  }

  try {
    const config = getApiConfig()
    // Use admin backend to fetch appointments
    const response = await axios.get(
      `${config.baseURL}/dashboard/specialist/${specialistId}/appointments`,
      {
        headers: config.headers,
        params: {
          status: 'scheduled',
          from_date: new Date().toISOString().split('T')[0]
        }
      }
    )

    const appointments = response.data.data || response.data.result || []

    // Extract unique dates from appointments
    const dates = appointments.map(apt => {
      const dateStr = apt.appointment_date || apt.start_time
      return new Date(dateStr)
    }).filter(date => !isNaN(date.getTime()))

    specialistAppointmentDates.value = dates
    console.log('Specialist appointment dates:', dates)
  } catch (error) {
    console.error('Error fetching specialist appointments:', error)
    // Don't show error to user, just clear the dots
    specialistAppointmentDates.value = []
  }
}

// Quick action methods
const sendMessageEmail = async () => {
  if (!messageSubject.value.trim() || !messageBody.value.trim()) {
    showNotification('Please fill in both subject and message', 'error')
    return
  }

  sendingMessage.value = true

  try {
    const config = getApiConfig()
    const tokenData = localStorage.getItem('accessToken')
    const adminSession = tokenData ? JSON.parse(tokenData) : null

    const response = await axios.post(
      `${config.baseURL}/dashboard/specialist/${props.userData._id}/send-message`,
      {
        subject: messageSubject.value,
        message: messageBody.value,
        admin_id: adminSession?.user_id || adminSession?._id || 'admin'
      },
      { headers: config.headers }
    )

    console.log('Send message response:', response)

    // Close dialog and clear form
    showMessageDialog.value = false
    messageSubject.value = ''
    messageBody.value = ''

    // Show notification after a short delay to ensure dialog is closed
    setTimeout(() => {
      showNotification('Message sent successfully to specialist', 'success')
    }, 100)
  } catch (error) {
    console.error('Error sending message:', error)
    showNotification('Failed to send message. Please try again.', 'error')
  } finally {
    sendingMessage.value = false
  }
}

const callSpecialist = () => {
  const phoneNumber = props.userData.profile?.contact?.phone?.number || props.userData.profile?.contact?.phone
  const countryCode = props.userData.profile?.contact?.phone?.country_code || ''

  if (phoneNumber) {
    const fullPhone = countryCode ? `${countryCode}${phoneNumber}` : phoneNumber
    window.open(`tel:${fullPhone}`)
  } else {
    showNotification('No phone number available for this specialist', 'warning')
  }
}

// Watch for edit dialog opening to populate form
watch(showEditDialog, (isOpen) => {
  if (isOpen) {
    editForm.value = {
      // Personal Information
      first_name: props.userData.profile?.first_name || '',
      last_name: props.userData.profile?.last_name || '',
      email: props.userData.profile?.contact?.email || '',
      phone: props.userData.profile?.contact?.phone?.number || props.userData.profile?.contact?.phone || '',
      country_code: props.userData.profile?.contact?.phone?.country_code || '+234',
      gender: props.userData.profile?.gender || '',
      date_of_birth: props.userData.profile?.date_of_birth || '',
      marital_status: props.userData.profile?.marital_status || '',
      // Contact Information
      address1: props.userData.profile?.contact?.address1 || '',
      address2: props.userData.profile?.contact?.address2 || '',
      state: props.userData.profile?.contact?.state || '',
      country: props.userData.profile?.contact?.country || '',
      zip_code: props.userData.profile?.contact?.zip_code || '',
      // Professional Practice
      category: props.userData.professional_practice?.category || '',
      area_of_specialty: props.userData.professional_practice?.area_of_specialty || '',
      university_name: props.userData.professional_practice?.university?.name || '',
      university_start_year: props.userData.professional_practice?.university?.start_year || '',
      university_end_year: props.userData.professional_practice?.university?.end_year || '',
      housemanship_name: props.userData.professional_practice?.place_of_housemanship?.name || '',
      housemanship_start_year: props.userData.professional_practice?.place_of_housemanship?.start_year || '',
      housemanship_end_year: props.userData.professional_practice?.place_of_housemanship?.end_year || '',
      license_number: props.userData.professional_practice?.license_number || '',
      years_of_practice: props.userData.professional_practice?.years_of_practice || '',
      consultation_fee: props.userData.professional_practice?.consultation_fee || null,
      // Documents/Certifications - mark all existing as NOT new, filter out invalid ones
      documents: props.userData.documents ? props.userData.documents
        .filter(doc => doc.url || doc.document_url)  // Only include documents with a URL
        .map(doc => ({
          ...doc,
          isNew: false  // Explicitly mark existing documents as not new
        })) : [],
      // Awards - mark all existing as NOT new, filter out invalid ones
      awards: props.userData.awards ? props.userData.awards
        .filter(award => award.title || award.award_title)  // Only include awards with a title
        .map(award => ({
          ...award,
          isNew: false  // Explicitly mark existing awards as not new
        })) : []
    }
  }
})

// Watch for appointment dialog opening to load patients and specialist's appointments
watch(showAppointmentDialog, (isOpen) => {
  if (isOpen) {
    fetchActivePatients()
    // Fetch this specialist's existing appointments to show on calendar
    if (props.userData._id) {
      fetchSpecialistAppointments(props.userData._id)
    }
  } else {
    specialistAppointmentDates.value = []
  }
})

const saveSpecialistEdit = async () => {
  savingEdit.value = true

  try {
    const config = getApiConfig()

    console.log('Saving specialist edit, form data:', editForm.value)

    // Log documents and awards to debug
    console.log('Documents:', editForm.value.documents.map(d => ({ isNew: d.isNew, hasFile: !!d.file, fileType: typeof d.file })))
    console.log('Awards:', editForm.value.awards.map(a => ({ isNew: a.isNew, hasFile: !!a.file, fileLength: a.file?.length })))

    // Check if there are ACTUAL new files to upload (File objects)
    const hasNewDocFiles = editForm.value.documents.some(doc => doc.isNew && doc.file instanceof File)
    const hasNewAwardFiles = editForm.value.awards.some(award => award.isNew && award.file && award.file.length > 0 && award.file[0].file instanceof File)
    const hasNewFiles = hasNewDocFiles || hasNewAwardFiles

    console.log('Has new doc files:', hasNewDocFiles, 'Has new award files:', hasNewAwardFiles, 'Total has new files:', hasNewFiles)

    if (hasNewFiles) {
      // Use FormData for file uploads
      const formData = new FormData()

      // Add basic fields
      formData.append('first_name', editForm.value.first_name)
      formData.append('last_name', editForm.value.last_name)
      formData.append('email', editForm.value.email)
      formData.append('phone', editForm.value.phone)
      formData.append('country_code', editForm.value.country_code)
      formData.append('gender', editForm.value.gender)
      formData.append('date_of_birth', editForm.value.date_of_birth)
      formData.append('marital_status', editForm.value.marital_status)
      formData.append('address1', editForm.value.address1)
      formData.append('address2', editForm.value.address2)
      formData.append('state', editForm.value.state)
      formData.append('country', editForm.value.country)
      formData.append('zip_code', editForm.value.zip_code)

      // Professional practice
      formData.append('professional_practice', JSON.stringify({
        category: editForm.value.category,
        area_of_specialty: editForm.value.area_of_specialty,
        license_number: editForm.value.license_number,
        years_of_practice: editForm.value.years_of_practice,
        consultation_fee: editForm.value.consultation_fee,
        university: {
          name: editForm.value.university_name,
          start_year: editForm.value.university_start_year,
          end_year: editForm.value.university_end_year
        },
        place_of_housemanship: {
          name: editForm.value.housemanship_name,
          start_year: editForm.value.housemanship_start_year,
          end_year: editForm.value.housemanship_end_year
        }
      }))

      // Handle documents
      const existingDocuments = editForm.value.documents.filter(doc => !doc.isNew)
      const newDocuments = editForm.value.documents.filter(doc => doc.isNew)

      formData.append('existing_documents', JSON.stringify(existingDocuments))
      newDocuments.forEach((doc, index) => {
        formData.append(`document_${index}`, doc.file)
        formData.append(`document_${index}_type`, doc.type_of_document)
      })

      // Handle awards
      const existingAwards = editForm.value.awards.filter(award => !award.isNew)
      const newAwards = editForm.value.awards.filter(award => award.isNew)

      formData.append('existing_awards', JSON.stringify(existingAwards))
      newAwards.forEach((award, index) => {
        formData.append(`award_${index}_title`, award.title)
        formData.append(`award_${index}_description`, award.description)
        formData.append(`award_${index}_date`, award.date)
        if (award.file && award.file.length > 0 && award.file[0].file) {
          formData.append(`award_${index}_file`, award.file[0].file)
        }
      })

      const response = await axios.patch(
        `${config.baseURL}/dashboard/specialist/${props.userData._id}/update-profile`,
        formData,
        {
          headers: {
            ...config.headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.status === 200) {
        showNotification('Specialist information updated successfully', 'success')
        showEditDialog.value = false
        emit('refresh-specialist')
      }
    } else {
      // No files to upload, use JSON
      const updatePayload = {
        // Personal Information
        first_name: editForm.value.first_name,
        last_name: editForm.value.last_name,
        email: editForm.value.email,
        phone: editForm.value.phone,
        country_code: editForm.value.country_code,
        gender: editForm.value.gender,
        date_of_birth: editForm.value.date_of_birth,
        marital_status: editForm.value.marital_status,
        // Contact Information
        address1: editForm.value.address1,
        address2: editForm.value.address2,
        state: editForm.value.state,
        country: editForm.value.country,
        zip_code: editForm.value.zip_code,
        // Professional Practice (Specialist-specific)
        professional_practice: {
          category: editForm.value.category,
          area_of_specialty: editForm.value.area_of_specialty,
          license_number: editForm.value.license_number,
          years_of_practice: editForm.value.years_of_practice,
          consultation_fee: editForm.value.consultation_fee,
          university: {
            name: editForm.value.university_name,
            start_year: editForm.value.university_start_year,
            end_year: editForm.value.university_end_year
          },
          place_of_housemanship: {
            name: editForm.value.housemanship_name,
            start_year: editForm.value.housemanship_start_year,
            end_year: editForm.value.housemanship_end_year
          }
        },
        // Documents and Awards (no new files)
        documents: editForm.value.documents,
        awards: editForm.value.awards
      }

      console.log('Sending JSON payload:', JSON.stringify(updatePayload, null, 2))

      const response = await axios.patch(
        `${config.baseURL}/dashboard/specialist/${props.userData._id}/update-profile`,
        updatePayload,
        { headers: config.headers }
      )

      if (response.status === 200) {
        showNotification('Specialist information updated successfully', 'success')
        showEditDialog.value = false
        emit('refresh-specialist')
      }
    }
  } catch (error) {
    console.error('Error updating specialist:', error)
    showNotification('Failed to update specialist information. Please try again.', 'error')
  } finally {
    savingEdit.value = false
  }
}

const createAppointment = async () => {
  if (!isAppointmentFormValid.value) {
    showNotification('Please fill in all required fields', 'error')
    return
  }

  creatingAppointment.value = true

  try {
    const config = getApiConfig()

    // Convert date to YYYY-MM-DD format (v-calendar returns Date object)
    const dateStr = appointmentForm.value.appointment_date instanceof Date
      ? appointmentForm.value.appointment_date.toISOString().split('T')[0]
      : appointmentForm.value.appointment_date

    // Prepare appointment data
    const appointmentData = {
      patient_id: appointmentForm.value.patient_id,
      specialist_id: props.userData._id,
      category: appointmentForm.value.category,
      appointment_date: dateStr,
      start_time: `${dateStr}T${appointmentForm.value.start_time}:00`,
      duration_minutes: parseInt(appointmentForm.value.duration_minutes) || 30,
      timezone: appointmentForm.value.timezone || 'Africa/Lagos',
      appointment_type: appointmentForm.value.appointment_type,
      consultation_fee: parseFloat(appointmentForm.value.consultation_fee) || 0,
      patient_notes: appointmentForm.value.patient_notes || '',
      admin_notes: appointmentForm.value.admin_notes || '',
      meeting_channel: appointmentForm.value.meeting_channel
    }

    // Add channel-specific fields
    if (appointmentForm.value.meeting_channel === 'whatsapp') {
      appointmentData.whatsapp_number = appointmentForm.value.whatsapp_number
    } else if (appointmentForm.value.meeting_channel === 'phone') {
      appointmentData.phone_number = appointmentForm.value.phone_number
    } else if (appointmentForm.value.meeting_channel === 'in_person') {
      appointmentData.location = appointmentForm.value.location
    }

    console.log('Creating appointment with data:', appointmentData)

    const response = await axios.post(
      `${config.baseURL}/appointments/create`,
      appointmentData,
      { headers: config.headers }
    )

    console.log('Appointment creation response:', response)

    if (response.data.success || response.status === 200 || response.status === 201) {
      showNotification('Appointment scheduled successfully! Emails sent to both patient and specialist.', 'success')
      showAppointmentDialog.value = false

      // Reset form
      appointmentForm.value = {
        patient_id: '',
        specialist_id: '',
        category: '',
        appointment_date: '',
        start_time: '',
        duration_minutes: 30,
        timezone: 'Africa/Lagos',
        appointment_type: '',
        consultation_fee: 0,
        patient_notes: '',
        admin_notes: '',
        meeting_channel: 'zoom',
        whatsapp_number: '',
        location: '',
        phone_number: ''
      }

      emit('refresh-specialist')
    }
  } catch (error) {
    console.error('Error creating appointment:', error)
    const errorMessage = error.response?.data?.message ||
                        error.response?.data?.error ||
                        'Failed to schedule appointment. Please try again.'
    showNotification(errorMessage, 'error')
  } finally {
    creatingAppointment.value = false
  }
}

const reactivateAccount = async () => {
  if (!confirm('Are you sure you want to reactivate this specialist\'s account?')) {
    return
  }

  suspending.value = true

  try {
    const config = getApiConfig()
    const response = await axios.patch(
      `${config.baseURL}/dashboard/specialist/${props.userData._id}/status`,
      {
        status: 'active',
        reason: 'Account reactivated by admin',
        notify_user: true,
        temporary: false,
        admin_id: JSON.parse(localStorage.getItem('admin_session')).user_id
      },
      { headers: config.headers }
    )

    if (response.status === 200) {
      showNotification('Specialist account reactivated successfully. Email notification sent.', 'success')
      emit('refresh-specialist')
    }
  } catch (error) {
    console.error('Reactivate account error:', error)
    showNotification('Failed to reactivate account. Please try again.', 'error')
  } finally {
    suspending.value = false
  }
}

// Account management methods
const suspendAccount = async () => {
  if (!suspendReason.value.trim()) {
    showNotification('Please provide a reason for suspension', 'error')
    return
  }

  suspending.value = true

  try {
    const config = getApiConfig()
    const token = JSON.parse(localStorage.getItem('admin_session'))
    const response = await axios.patch(
      `${config.baseURL}/dashboard/specialist/${props.userData._id}/suspend`,
      {
        reason: suspendReason.value,
        suspended_by: token.user_id
      },
      { headers: config.headers }
    )

    if (response.status === 200) {
      showNotification('Specialist account suspended successfully. Email notification sent.', 'success')
      showSuspendDialog.value = false
      suspendReason.value = ''
      emit('refresh-specialist')
    }
  } catch (error) {
    console.error('Suspend account error:', error)
    showNotification('Failed to suspend account. Please try again.', 'error')
  } finally {
    suspending.value = false
  }
}

const deactivateAccount = async () => {
  if (!deactivateReason.value.trim() || !confirmDeactivation.value) {
    return
  }

  deactivating.value = true

  try {
    const config = getApiConfig()
    const token = JSON.parse(localStorage.getItem('admin_session'))
    const response = await axios.patch(
      `${config.baseURL}/dashboard/specialist/${props.userData._id}/deactivate`,
      {
        reason: deactivateReason.value,
        deactivated_by: token.user_id
      },
      { headers: config.headers }
    )

    if (response.status === 200) {
      showNotification('Specialist account deactivated successfully. Email notification sent.', 'success')
      showDeactivateDialog.value = false
      deactivateReason.value = ''
      confirmDeactivation.value = false
      // Navigate back to specialists list after deactivation
      setTimeout(() => {
        router.push('/specialists')
      }, 2000)
    }
  } catch (error) {
    console.error('Deactivate account error:', error)
    showNotification('Failed to deactivate account. Please try again.', 'error')
  } finally {
    deactivating.value = false
  }
}

// Utility methods
const showNotification = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}
</script>

<style scoped>
.v-btn {
  text-transform: none;
  font-weight: 500;
}

.v-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.text-h6 {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 600;
}
</style>