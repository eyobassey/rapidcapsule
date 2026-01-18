<script setup>
import { useLifeguardStore } from '@/stores/lifeguard'



import BioPanel from '@/components/LifeguardProfile/BioPanel.vue'
import Donations from '@/components/LifeguardProfile/Donations.vue'
import Beneficiaries from '@/components/LifeguardProfile/Beneficiaries.vue'


const lifeguardStore = useLifeguardStore()
const route = useRoute()
const lifeguard = ref(null)
const userTab = ref(null)
let pageLoading = ref(true)
let lifeguardError = ref(false)

// Computed property to reactively get lifeguardId from route
const lifeguardId = computed(() => route.params.id)

const tabs = [
  {
    // icon: 'bx-detail',
    title: 'Donation History',
  },
  {
    // icon: 'bx-bell',
    title: 'Beneficiaries',
  },
]


// 👉 Fetching lifeguard
const fetchLifeguard = () => {
  // Clear previous lifeguard data
  lifeguard.value = null
  pageLoading.value = true
  lifeguardError.value = false

  lifeguardStore.fetchLifeguard(lifeguardId.value)
    .then(response => {
      if(response == 'error') {
        pageLoading.value = false
        lifeguardError.value = true
      }
      else{
        lifeguard.value = response
        console.log(lifeguard.value);
        pageLoading.value = false
        lifeguardError.value = false
      }
    }).catch(error => {
      console.log(error)
      pageLoading.value = false
      lifeguardError.value = true
    })
}

// Watch for route parameter changes and refetch lifeguard data
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    userTab.value = null // Reset tab selection
    fetchLifeguard()
  }
}, { immediate: true })
</script>

<template>
  <h2
    class="head-title  text-h6 mbs-20"
  >
    <span style="color:#9b9b9b !important">LifeGuards / </span>Details
  </h2>

  
  
    
  <VRow>
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
      <VRow>
        <!-- SECTION Lifeguard's Details -->
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
              v-else-if="lifeguardError || !lifeguard"
              style="height:70vh"
            >
              <div
                style="margin: 0 auto;
                position: relative;
                top: 33%; transform: translate(0, 40%);
                text-align: center"
              >
                Something went wrong <br> <br>
                <VBtn @click="fetchLifeguard">
                  Try again
                </VBtn>
              </div>
            </div>
            <BioPanel
              v-else
              :user-data="lifeguard"
            />
          </VCard>
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
          v-else-if="lifeguardError || !lifeguard"
          style="height:70vh"
        >
          <div
            style="margin: 0 auto;
                position: relative;
                top: 33%; transform: translate(0, 40%);
                text-align: center"
          >
            Something went wrong <br> <br>
            <VBtn @click="fetchLifeguard">
              Try again
            </VBtn>
          </div>
        </div>
            
        <div v-else>
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
              <Donations
                v-if="lifeguard.preferences"
                :donations="lifeguard.preferences"
              />
            </VWindowItem>

            <VWindowItem>
              <Beneficiaries 
                v-if="lifeguard.beneficiaries"
                :beneficiaries="lifeguard.beneficiaries"
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
