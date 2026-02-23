<script setup>
const props = defineProps({
  stats: { type: Object, required: true },
})
</script>

<template>
  <VRow>
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4">
        <div class="d-flex align-center gap-3">
          <VAvatar color="primary" variant="tonal" size="48">
            <VIcon icon="bx-message-square-dots" size="24" />
          </VAvatar>
          <div>
            <div class="text-h5 font-weight-bold">{{ stats.conversations?.total || 0 }}</div>
            <div class="text-body-2 text-medium-emphasis">Total Conversations</div>
          </div>
        </div>
      </VCard>
    </VCol>
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4">
        <div class="d-flex align-center gap-3">
          <VAvatar color="success" variant="tonal" size="48">
            <VIcon icon="bx-check-circle" size="24" />
          </VAvatar>
          <div>
            <div class="text-h5 font-weight-bold">{{ stats.conversations?.active || 0 }}</div>
            <div class="text-body-2 text-medium-emphasis">Active Conversations</div>
          </div>
        </div>
      </VCard>
    </VCol>
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4">
        <div class="d-flex align-center gap-3">
          <VAvatar color="info" variant="tonal" size="48">
            <VIcon icon="bx-envelope" size="24" />
          </VAvatar>
          <div>
            <div class="text-h5 font-weight-bold">{{ stats.messages?.today || 0 }}</div>
            <div class="text-body-2 text-medium-emphasis">Messages Today</div>
          </div>
        </div>
      </VCard>
    </VCol>
    <VCol cols="12" sm="6" md="3">
      <VCard class="pa-4">
        <div class="d-flex align-center gap-3">
          <VAvatar color="warning" variant="tonal" size="48">
            <VIcon icon="bx-trending-up" size="24" />
          </VAvatar>
          <div>
            <div class="text-h5 font-weight-bold">{{ stats.messages?.this_week || 0 }}</div>
            <div class="text-body-2 text-medium-emphasis">Messages This Week</div>
          </div>
        </div>
      </VCard>
    </VCol>
  </VRow>
</template>
