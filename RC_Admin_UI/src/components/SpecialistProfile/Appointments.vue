
<script setup>
import moment from 'moment'

const props = defineProps({
  appointments: {
    type: [Array, Object],
    default: () => [],
  },
})

const currentTab = ref(0)
const isAppointmentDetailsVisible = ref(false)
const selectedAppointment = ref(null)

const showAppointmentDetails = (appointment) => {
  selectedAppointment.value = appointment
  isAppointmentDetailsVisible.value = true
}

// Compute filtered appointments based on tab
const filteredAppointments = computed(() => {
  // Handle both array and paginated object format
  const allAppointments = Array.isArray(props.appointments)
    ? props.appointments
    : (props.appointments?.docs || [])

  if (!allAppointments || allAppointments.length === 0) return []

  const now = new Date()

  switch (currentTab.value) {
    case 0: // All
      return allAppointments
    case 1: // Upcoming (future appointments)
      return allAppointments.filter(apt => {
        const appointmentDate = new Date(apt.start_time || apt.appointment_date)
        return appointmentDate > now
      })
    case 2: // Completed
      return allAppointments.filter(apt =>
        apt.status === 'Completed' ||
        apt.status === 'COMPLETED' ||
        apt.status === 'Done'
      )
    case 3: // Rescheduled (appointments with rescheduled_at field)
      return allAppointments.filter(apt => apt.rescheduled_at !== undefined && apt.rescheduled_at !== null)
    case 4: // Canceled
      return allAppointments.filter(apt =>
        apt.status === 'Cancelled' ||
        apt.status === 'CANCELLED' ||
        apt.status === 'Canceled' ||
        apt.status === 'CANCELED'
      )
    case 5: // Missed (past appointments that are still OPEN)
      return allAppointments.filter(apt => {
        const appointmentDate = new Date(apt.start_time || apt.appointment_date)
        const isOpen = apt.status === 'OPEN' || apt.status === 'Scheduled'
        return isOpen && appointmentDate < now
      })
    default:
      return allAppointments
  }
})

const formatDate = (date) => {
  return moment(date).format('DD/MM/YYYY')
}

const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'N/A'
  const today = new Date()
  const birthDate = new Date(dateOfBirth)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// Compute display status (show "Rescheduled" or "Missed" based on appointment state)
const getDisplayStatus = (appointment) => {
  const now = new Date()
  const appointmentDate = new Date(appointment.start_time || appointment.appointment_date)
  const isOpen = appointment.status === 'OPEN' || appointment.status === 'Scheduled'

  // Check if rescheduled (has rescheduled_at field)
  if (appointment.rescheduled_at) {
    return 'Rescheduled'
  }

  // Check if missed (past date with OPEN status)
  if (isOpen && appointmentDate < now) {
    return 'Missed'
  }

  return appointment.status
}

const resolveUserStatusVariant = stat => {
  const statLower = stat?.toLowerCase()
  if (statLower === 'open' || statLower === 'scheduled' || statLower === 'confirmed')
    return 'primary'
  if (statLower === 'completed')
    return 'success'
  if (statLower === 'cancelled' || statLower === 'canceled')
    return 'error'
  if (statLower === 'rescheduled')
    return 'warning'
  if (statLower === 'missed')
    return 'secondary'

  return 'secondary'
}
</script>

<template>
  <VRow>
    <VCol
      cols="12"
    >
      <VCard
        title=""
        class="mt-6 px-6 pt-4"
      >
        <VTabs
          v-model="currentTab"
          class="v-tabs-pillx"
        >
          <VTab>All</VTab>
          <VTab>Upcoming</VTab>
          <VTab>Completed</VTab>
          <VTab>Rescheduled</VTab>
          <VTab>Canceled</VTab>
          <VTab>Missed</VTab>
        </VTabs>

        <VWindow
          v-model="currentTab"
          class="mt-5"
        >
          <!--  ALL TABS -->
          <VWindowItem
            v-for="tab in 6"
            :key="tab"
          >
            <VTable
              v-if="filteredAppointments.length > 0"
              class="text-no-wrap"
            >
              <thead>
                <tr>
                  <th scope="col">
                    Patient
                  </th>
                  <th scope="col">
                    Date
                  </th>
                  <th scope="col">
                    Duration
                  </th>
                  <th scope="col">
                    Status
                  </th>
                  <th scope="col">
                    Fee
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="appointment in filteredAppointments"
                  :key="appointment._id"
                >
                  <td class="d-flex align-center">
                    <span
                      class="patient-name-link"
                      @click="showAppointmentDetails(appointment)"
                    >
                      {{ appointment.patient?.profile?.first_name || 'N/A' }} {{ appointment.patient?.profile?.last_name || '' }}
                    </span>
                  </td>

                  <td>
                    <div class="d-flex align-center gap-2">
                      <span class="text-high-emphasis">{{ formatDate(appointment.start_time || appointment.appointment_date) }}</span>
                      <VTooltip
                        v-if="appointment.rescheduled_at"
                        location="top"
                      >
                        <template #activator="{ props }">
                          <VIcon
                            v-bind="props"
                            size="18"
                            color="warning"
                            icon="bx-refresh"
                          />
                        </template>
                        <span>Rescheduled on {{ formatDate(appointment.rescheduled_at) }}</span>
                      </VTooltip>
                    </div>
                  </td>
                  <td>
                    <span class="text-high-emphasis">{{ formatDuration(appointment.duration_minutes || 30) }}</span>
                  </td>

                  <td class="text-medium-emphasis">
                    <VChip
                      label
                      density="compact"
                      :color="resolveUserStatusVariant(getDisplayStatus(appointment))"
                    >
                      {{ getDisplayStatus(appointment) }}
                    </VChip>
                  </td>

                  <td class="text-medium-emphasis">
                    ₦{{ (appointment.appointment_fee || appointment.consultation_fee || 0).toLocaleString() }}
                  </td>
                </tr>
              </tbody>
            </VTable>
            <div
              v-else
              class="notAvailable"
            >
              <p>No appointments found</p>
            </div>
          </VWindowItem>
        </VWindow>
        <VDivider />
        <!-- 👉 project List table -->
      </VCard>
    </VCol>
  </VRow>

  <!-- Appointment Details Dialog -->
  <VDialog
    v-model="isAppointmentDetailsVisible"
    max-width="800"
  >
    <VCard v-if="selectedAppointment">
      <VCardTitle class="d-flex justify-space-between align-center">
        <span>Appointment Details</span>
        <VBtn
          icon="mdi-close"
          variant="text"
          @click="isAppointmentDetailsVisible = false"
        />
      </VCardTitle>

      <VDivider />

      <VCardText>
        <VRow>
          <!-- Patient Information -->
          <VCol cols="12" md="6">
            <div class="text-h6 mb-3">Patient Information</div>
            <div class="mb-2">
              <strong>Name:</strong>
              {{ selectedAppointment.patient?.profile?.first_name || 'N/A' }}
              {{ selectedAppointment.patient?.profile?.last_name || '' }}
            </div>
            <div class="mb-2">
              <strong>Email:</strong>
              {{ selectedAppointment.patient?.profile?.contact?.email || 'N/A' }}
            </div>
            <div class="mb-2">
              <strong>Phone:</strong>
              <span v-if="selectedAppointment.patient?.profile?.contact?.phone">
                {{ selectedAppointment.patient.profile.contact.phone.country_code }}
                {{ selectedAppointment.patient.profile.contact.phone.number }}
              </span>
              <span v-else>N/A</span>
            </div>
            <div class="mb-2">
              <strong>Gender:</strong>
              {{ selectedAppointment.patient?.profile?.gender || 'N/A' }}
            </div>
            <div class="mb-2">
              <strong>Date of Birth:</strong>
              {{ selectedAppointment.patient?.profile?.date_of_birth ? formatDate(selectedAppointment.patient.profile.date_of_birth) : 'N/A' }}
            </div>
            <div class="mb-2">
              <strong>Age:</strong>
              {{ calculateAge(selectedAppointment.patient?.profile?.date_of_birth) }} years
            </div>
          </VCol>

          <!-- Appointment Details -->
          <VCol cols="12" md="6">
            <div class="text-h6 mb-3">Appointment Details</div>
            <div class="mb-2">
              <strong>Date & Time:</strong>
              {{ formatDate(selectedAppointment.start_time || selectedAppointment.appointment_date) }}
            </div>
            <div class="mb-2">
              <strong>Duration:</strong>
              {{ formatDuration(selectedAppointment.duration_minutes || 30) }}
            </div>
            <div class="mb-2">
              <strong>Type:</strong>
              {{ selectedAppointment.appointment_type || 'Consultation' }}
            </div>
            <div class="mb-2">
              <strong>Channel:</strong>
              {{ selectedAppointment.appointment_channel || 'Video Call' }}
            </div>
            <div class="mb-2">
              <strong>Status:</strong>
              <VChip
                label
                density="compact"
                class="ml-2"
                :color="resolveUserStatusVariant(getDisplayStatus(selectedAppointment))"
              >
                {{ getDisplayStatus(selectedAppointment) }}
              </VChip>
            </div>
            <div v-if="selectedAppointment.rescheduled_at" class="mb-2">
              <strong>Rescheduled On:</strong>
              {{ formatDate(selectedAppointment.rescheduled_at) }}
            </div>
          </VCol>

          <!-- Meeting Information -->
          <VCol v-if="selectedAppointment.meeting_url || selectedAppointment.join_url" cols="12">
            <VDivider class="my-4" />
            <div class="text-h6 mb-3">Meeting Information</div>
            <div class="mb-2">
              <strong>Meeting URL:</strong>
              <a
                :href="selectedAppointment.meeting_url || selectedAppointment.join_url"
                target="_blank"
                class="ml-2"
              >
                Join Meeting
              </a>
            </div>
            <div v-if="selectedAppointment.meeting_id" class="mb-2">
              <strong>Meeting ID:</strong> {{ selectedAppointment.meeting_id }}
            </div>
          </VCol>

          <!-- Payment Information -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <div class="text-h6 mb-3">Payment Information</div>
            <div class="mb-2">
              <strong>Consultation Fee:</strong>
              ₦{{ (selectedAppointment.appointment_fee || selectedAppointment.consultation_fee || 0).toLocaleString() }}
            </div>
            <div class="mb-2">
              <strong>Payment Status:</strong>
              <VChip
                label
                density="compact"
                class="ml-2"
                :color="selectedAppointment.payment_status === 'PAID' ? 'success' : 'warning'"
              >
                {{ selectedAppointment.payment_status || 'PENDING' }}
              </VChip>
            </div>
          </VCol>

          <!-- Notes Section -->
          <VCol v-if="selectedAppointment.patient_notes || selectedAppointment.private_notes || selectedAppointment.clinical_notes" cols="12">
            <VDivider class="my-4" />
            <div class="text-h6 mb-3">Notes</div>
            <div v-if="selectedAppointment.patient_notes" class="mb-3">
              <strong>Patient Notes:</strong>
              <div class="pa-2 bg-grey-lighten-4 rounded mt-1">
                {{ selectedAppointment.patient_notes }}
              </div>
            </div>
            <div v-if="selectedAppointment.private_notes" class="mb-3">
              <strong>Private Notes:</strong>
              <div class="pa-2 bg-grey-lighten-4 rounded mt-1">
                {{ selectedAppointment.private_notes }}
              </div>
            </div>
            <div v-if="selectedAppointment.clinical_notes" class="mb-3">
              <strong>Clinical Notes:</strong>
              <div class="pa-2 bg-grey-lighten-4 rounded mt-1">
                {{ selectedAppointment.clinical_notes }}
              </div>
            </div>
          </VCol>
        </VRow>
      </VCardText>

      <VDivider />

      <VCardActions>
        <VSpacer />
        <VBtn
          color="primary"
          variant="text"
          @click="isAppointmentDetailsVisible = false"
        >
          Close
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">
.notAvailable {
  padding: 18px;
  text-align: center;
}

.patient-name-link {
  color: #1976d2;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    text-decoration: underline;
    color: #1565c0;
  }
}
</style>
