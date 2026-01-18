<template>
  <div class="quick-actions">
    <div class="quick-action" @click="$emit('navigate', 'health-score')">
      <div class="action-icon health">
        <v-icon name="hi-heart" scale="1.2" />
      </div>
      <span>Health Score</span>
    </div>
    <div class="quick-action" @click="$emit('navigate', 'buy-credits')">
      <div class="action-icon credits">
        <v-icon name="hi-sparkles" scale="1.2" />
      </div>
      <span>Buy Credits</span>
    </div>
    <div class="quick-action" @click="$emit('navigate', 'cards')">
      <div class="action-icon cards">
        <v-icon name="bi-credit-card-2-back" scale="1.2" />
      </div>
      <span>Payment Methods</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "QuickActions",
  emits: ["navigate"],
};
</script>

<style scoped lang="scss">
.quick-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    gap: 10px;
    margin-bottom: 20px;
  }

  @media (max-width: 480px) {
    gap: 8px;
    margin-bottom: 16px;
  }
}

.quick-action {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 16px 12px;
    gap: 8px;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    padding: 14px 10px;
    gap: 6px;
    border-radius: 10px;
  }

  &:hover {
    border-color: transparent;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .action-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 480px) {
      width: 40px;
      height: 40px;
      border-radius: 10px;
    }

    &.health {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    &.credits {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    &.cards {
      background: rgba(14, 174, 196, 0.1);
      color: #0891b2;
    }
  }

  span {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    text-align: center;

    @media (max-width: 480px) {
      font-size: 11px;
    }
  }
}
</style>
