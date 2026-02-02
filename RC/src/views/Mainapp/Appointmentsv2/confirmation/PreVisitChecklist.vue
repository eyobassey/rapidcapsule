<template>
  <div class="pre-visit-checklist">
    <h3 class="checklist-title">
      <v-icon name="hi-clipboard-check" scale="1" />
      Pre-Visit Checklist
    </h3>
    <p class="checklist-desc">Complete these steps to prepare for your appointment</p>

    <div class="checklist-items">
      <div
        v-for="item in checklistItems"
        :key="item.id"
        class="checklist-item"
        :class="{ completed: item.completed }"
      >
        <button class="item-checkbox" @click="toggleItem(item.id)">
          <v-icon v-if="item.completed" name="hi-check" scale="0.7" />
        </button>
        <div class="item-content">
          <div class="item-header">
            <span class="item-title">{{ item.title }}</span>
            <span class="item-badge" v-if="item.badge" :class="item.badge.type">
              {{ item.badge.text }}
            </span>
          </div>
          <p class="item-description">{{ item.description }}</p>
          <button
            v-if="item.action"
            class="item-action"
            @click="handleAction(item.action)"
          >
            {{ item.actionLabel }}
            <v-icon name="hi-arrow-right" scale="0.7" />
          </button>
        </div>
      </div>
    </div>

    <div class="checklist-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
      <span class="progress-text">{{ completedCount }} of {{ checklistItems.length }} completed</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const checklistItems = ref([
  {
    id: 'device',
    title: 'Test Your Device',
    description: 'Ensure your camera and microphone are working properly for the video call.',
    completed: false,
    action: 'test-device',
    actionLabel: 'Run device test',
    badge: null,
  },
  {
    id: 'vitals',
    title: 'Update Your Vitals',
    description: 'Record your latest vitals (blood pressure, weight, temperature) for the doctor.',
    completed: false,
    action: 'update-vitals',
    actionLabel: 'Update vitals',
    badge: { text: 'Recommended', type: 'recommended' },
  },
  {
    id: 'symptoms',
    title: 'Prepare Symptom Notes',
    description: 'Write down your symptoms, when they started, and any questions for the doctor.',
    completed: false,
    action: null,
    actionLabel: null,
    badge: null,
  },
  {
    id: 'medications',
    title: 'List Current Medications',
    description: 'Have a list of any medications, supplements, or vitamins you are currently taking.',
    completed: false,
    action: null,
    actionLabel: null,
    badge: null,
  },
  {
    id: 'quiet',
    title: 'Find a Quiet Space',
    description: 'Ensure you have a private, quiet location with good lighting for your consultation.',
    completed: false,
    action: null,
    actionLabel: null,
    badge: null,
  },
]);

const completedCount = computed(() => {
  return checklistItems.value.filter(item => item.completed).length;
});

const progressPercent = computed(() => {
  return (completedCount.value / checklistItems.value.length) * 100;
});

const toggleItem = (id) => {
  const item = checklistItems.value.find(i => i.id === id);
  if (item) {
    item.completed = !item.completed;
  }
};

const handleAction = (action) => {
  switch (action) {
    case 'test-device':
      // Open device test modal or navigate
      window.open('https://webcamtests.com/', '_blank');
      break;
    case 'update-vitals':
      router.push('/app/patient/health-monitor/vitals');
      break;
  }
};
</script>

<style scoped lang="scss">
$v2-sky: #4FC3F7;
$v2-sky-light: #E1F5FE;
$v2-sky-dark: #0288D1;
$v2-success: #4CAF50;
$v2-success-light: #E8F5E9;
$v2-orange: #FF9800;
$v2-orange-light: #FFF3E0;

.pre-visit-checklist {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
}

.checklist-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 6px;

  svg {
    color: $v2-sky;
  }
}

.checklist-desc {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 20px;
}

.checklist-items {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.checklist-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    border-color: $v2-sky;
  }

  &.completed {
    background: $v2-success-light;
    border-color: rgba($v2-success, 0.2);

    .item-checkbox {
      background: $v2-success;
      border-color: $v2-success;
      color: white;
    }

    .item-title {
      text-decoration: line-through;
      color: #6b7280;
    }
  }
}

.item-checkbox {
  width: 26px;
  height: 26px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;

  &:hover {
    border-color: $v2-sky;
  }
}

.item-content {
  flex: 1;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  transition: all 0.2s ease;
}

.item-badge {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;

  &.recommended {
    background: $v2-orange-light;
    color: $v2-orange;
  }
}

.item-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.item-action {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  padding: 0;
  border: none;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: $v2-sky-dark;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: $v2-sky;
    gap: 6px;
  }
}

.checklist-progress {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, $v2-sky 0%, $v2-success 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  color: #6b7280;
  white-space: nowrap;
}
</style>
