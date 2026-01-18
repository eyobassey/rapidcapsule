<script setup>
import { useUserListStore } from '@/views/apps/user/useUserListStore'
import { usePatientStore } from '@/stores/patient'
import avatar6 from '@images/avatars/avatar-4.png'



import BioPanel from '@/components/PatientProfile/BioPanel.vue'
import QuickActions from '@/components/PatientProfile/QuickActions.vue'
import PatientDependents from '@/components/PatientProfile/PatientDependents.vue'
import PatientBilling from '@/components/PatientProfile/PatientBilling.vue'
import PatientAppointments from '@/components/PatientProfile/PatientAppointments.vue'
import MedicalHistory from '@/components/PatientProfile/MedicalHistory.vue'
import ActivityTimeline from '@/components/PatientProfile/ActivityTimeline.vue'
import HealthStatusOverview from '@/components/PatientProfile/HealthStatusOverview.vue'
import CommunicationHistory from '@/components/PatientProfile/CommunicationHistory.vue'
import NotesSection from '@/components/PatientProfile/NotesSection.vue'
import AccountManagement from '@/components/PatientProfile/AccountManagement.vue'
import ClaudeSummaryCredits from '@/components/PatientProfile/ClaudeSummaryCredits.vue'


const patientStore = usePatientStore()
const route = useRoute()
const patient = ref(null)
const userTab = ref(null)
let pageLoading = ref(true)
let patientError = ref(false)

// Computed property to reactively get patientId from route
const patientId = computed(() => route.params.id)

const tabs = [
  {
    // icon: 'bx-medical-bag',
    title: 'Medical History',
  },
  {
    // icon: 'bx-detail',
    title: 'Dependents',
  },
  {
    // icon: 'bx-bell',
    title: 'Billing & Subscriptions',
  },
  {
    // icon: 'bx-link',
    title: 'Appointments',
  },
  {
    // icon: 'bx-timeline',
    title: 'Activity Timeline',
  },
  {
    // icon: 'bx-health',
    title: 'Health Status',
  },
  {
    // icon: 'bx-message',
    title: 'Communications',
  },
  {
    // icon: 'bx-note',
    title: 'Notes',
  },
  {
    // icon: 'mdi-brain',
    title: 'AI Credits',
  },
  {
    // icon: 'bx-cog',
    title: 'Account Management',
  },
]


// 👉 Fetching patient
const fetchPatient = () => {
  // Clear previous patient data
  patient.value = null
  pageLoading.value = true
  patientError.value = false

  patientStore.fetchPatient(patientId.value)
    .then(response => {
      if(response == 'error') {
        pageLoading.value = false
        patientError.value = true
      }
      else{
        patient.value = response
        pageLoading.value = false
        patientError.value = false
      }
    }).catch(error => {
      console.log(error)
      pageLoading.value = false
      patientError.value = true
    })
}

// Watch for route parameter changes and refetch patient data
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    userTab.value = null // Reset tab selection
    fetchPatient()
  }
}, { immediate: true })
</script>

<template>
  <h2
    class="head-title  text-h6 mbs-20"
  >
    <span style="color:#9b9b9b !important">Patients / </span>Patient
  </h2>

  
  
    
  <VRow>
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
      <VRow>
        <!-- SECTION patient's Details -->
        <VCol cols="12">
          <VCard>
            <div
              v-if="pageLoading"
              style="height:70vh"
            >
              <VLoaderSpinner
                size="40"
                style="margin: 0 auto;
                position: relative;
                top: 40%;
                transform: translate(-50%, 50%);"
              />
            </div>
            <div
              v-else-if="patientError"
              style="height:70vh"
            >
              <div
                style="margin: 0 auto;
                position: relative;
                top: 33%; transform: translate(0, 40%);
                text-align: center"
              >
                Something went wrong <br> <br>
                <VBtn @click="fetchPatient">Try again</VBtn>
              </div>
            </div>
            <BioPanel
              v-else-if="patient && patient.user"
              :user-data="patient.user"
            />
          </VCard>
        </VCol>

        <!-- Quick Actions Panel -->
        <VCol cols="12">
          <QuickActions
            v-if="patient && patient.user && !pageLoading && !patientError"
            :user-data="patient.user"
            @refresh-patient="fetchPatient"
          />
        </VCol>
      </VRow>
    </VCol>

    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      <VCard class="h-100">
        <div
          v-if="pageLoading"
          style="height:70vh"
        >
          <VLoaderSpinner
            size="40"
            style="margin: 0 auto;
                position: relative;
                top: 40%;
                transform: translate(-50%, 50%);"
          />
        </div>
        <div
          v-else-if="patientError"
          style="height:70vh"
        >
          <div
            style="margin: 0 auto;
                position: relative;
                top: 33%; transform: translate(0, 40%);
                text-align: center"
          >
            Something went wrong <br> <br>
            <VBtn @click="fetchPatient">Try again</VBtn>
          </div>
        </div>
            
        <div v-else-if="patient">
          <VTabs
            v-model="userTab"
            class="mt-6 ml-8"
          >
            <VTab
              v-for="tab in tabs"
              :key="tab.icon"
            >
              <span>{{ tab.title }}</span>
            </VTab>
          </VTabs>

          <VWindow
            v-model="userTab"
            class="mt-6 disable-tab-transition"
            :touch="false"
          >
            <VWindowItem>
              <MedicalHistory
                v-if="patient && patient.user"
                :user-data="patient.user"
              />
            </VWindowItem>

            <VWindowItem>
              <PatientDependents
                v-if="patient && patient.user"
                :dependents="patient.user.dependants"
              />
            </VWindowItem>

            <VWindowItem>
              <PatientBilling 
                v-if="patient"
                :subscriptions="patient.subscriptions"
                :appointments="patient.appointments"
              />
            </VWindowItem>

            <VWindowItem>
              <PatientAppointments 
                v-if="patient"
                :appointments="patient.appointments"
              />
            </VWindowItem>

            <VWindowItem>
              <ActivityTimeline
                v-if="patient && patient.user"
                :user-data="patient.user"
              />
            </VWindowItem>

            <VWindowItem>
              <HealthStatusOverview
                v-if="patient && patient.user"
                :user-data="patient.user"
              />
            </VWindowItem>

            <VWindowItem>
              <CommunicationHistory
                v-if="patient && patient.user"
                :user-data="patient.user"
              />
            </VWindowItem>

            <VWindowItem>
              <NotesSection
                v-if="patient && patient.user"
                :user-data="patient.user"
              />
            </VWindowItem>

            <VWindowItem>
              <ClaudeSummaryCredits
                v-if="patient && patient.user"
                :user-data="patient.user"
              />
            </VWindowItem>

            <VWindowItem>
              <AccountManagement
                v-if="patient && patient.user"
                :user-data="patient.user"
              />
            </VWindowItem>
          </VWindow>
        </div>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
.head-title {
  margin-block-end: 30px;
}

.v-slide-group__content {
    border-bottom: 1px solid #a9a9a970 !important;
    margin-right: 35px;
}
</style>
