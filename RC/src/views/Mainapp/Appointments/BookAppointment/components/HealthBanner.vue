<template>
  <div v-if="!dismissed" class="health-banner">
    <div class="banner-content">
      <v-icon name="hi-light-bulb" scale="1.1" class="banner-icon" />
      <div class="banner-text">
        <h4>Complete a Health Checkup first</h4>
        <p>A health checkup helps specialists understand your needs better and provide more accurate consultations.</p>
      </div>
    </div>
    <div class="banner-actions">
      <button class="banner-btn-primary" @click="goToCheckup">
        Take Checkup
      </button>
      <button class="banner-btn-dismiss" @click="dismiss">
        <v-icon name="hi-x" scale="0.85" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const dismissed = ref(false);

onMounted(() => {
  dismissed.value = localStorage.getItem('booking_health_banner_dismissed') === 'true';
});

const dismiss = () => {
  dismissed.value = true;
  localStorage.setItem('booking_health_banner_dismissed', 'true');
};

const goToCheckup = () => {
  router.push({ name: 'HealthCheckup' });
};
</script>

<style scoped lang="scss">
.health-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: linear-gradient(135deg, rgba(14, 174, 196, 0.08) 0%, rgba(14, 174, 196, 0.03) 100%);
  border: 1px solid rgba(14, 174, 196, 0.2);
  border-radius: 14px;
  padding: 16px 20px;
  margin: 0 24px 16px;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    margin: 0 16px 16px;
    padding: 14px 16px;
  }
}

.banner-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.banner-icon {
  color: #0EAEC4;
  flex-shrink: 0;
  margin-top: 2px;
}

.banner-text {
  h4 {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 4px;
  }

  p {
    font-size: 13px;
    color: #6b7280;
    margin: 0;
    line-height: 1.4;
  }
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  @media (max-width: 600px) {
    width: 100%;
    justify-content: flex-end;
  }
}

.banner-btn-primary {
  padding: 8px 16px;
  background: #0EAEC4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background: #0891b2;
  }
}

.banner-btn-dismiss {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #6b7280;
  }
}
</style>
