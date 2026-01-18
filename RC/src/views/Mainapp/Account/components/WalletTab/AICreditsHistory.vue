<template>
  <div class="ai-credits-history">
    <div class="section-header">
      <h3 class="section-title">AI Credits History</h3>
      <div class="header-actions">
        <div class="download-btns" v-if="transactions.length > 0">
          <button class="download-btn" @click="$emit('download', 'csv')" title="Download CSV">
            <v-icon name="hi-document-text" scale="0.85" />
            <span>CSV</span>
          </button>
          <button class="download-btn" @click="$emit('download', 'pdf')" title="Download PDF">
            <v-icon name="hi-download" scale="0.85" />
            <span>PDF</span>
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <Loader :useOverlay="false" />
    </div>

    <div v-else-if="transactions.length === 0" class="empty-state">
      <div class="empty-icon">
        <v-icon name="hi-sparkles" scale="2" />
      </div>
      <p class="empty-text">No credit transactions yet</p>
      <p class="empty-hint">Your AI credit history will appear here</p>
    </div>

    <div v-else class="transactions-list">
      <div
        v-for="txn in transactions"
        :key="txn._id"
        class="transaction-item"
      >
        <div class="txn-icon" :class="getTxnClass(txn)">
          <v-icon :name="getTxnIcon(txn)" scale="0.9" />
        </div>
        <div class="txn-details">
          <span class="txn-description">{{ getTxnDescription(txn) }}</span>
          <span class="txn-date">{{ formatDate(txn.created_at) }}</span>
        </div>
        <div class="txn-amount" :class="getTxnClass(txn)">
          {{ getTxnSign(txn) }}{{ txn.credits || txn.amount || 1 }} credit{{ (txn.credits || txn.amount || 1) > 1 ? 's' : '' }}
        </div>
      </div>
    </div>

    <div v-if="transactions.length > 0 && hasMore" class="load-more">
      <button class="load-more-btn" @click="$emit('loadMore')" :disabled="loadingMore">
        {{ loadingMore ? 'Loading...' : 'Load More' }}
      </button>
    </div>
  </div>
</template>

<script>
import Loader from "@/components/Loader/main-loader.vue";

export default {
  name: "AICreditsHistory",
  components: {
    Loader,
  },
  props: {
    transactions: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
    hasMore: {
      type: Boolean,
      default: false,
    },
    loadingMore: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["loadMore", "download"],
  methods: {
    getTxnClass(txn) {
      const type = txn.transaction_type?.toLowerCase() || txn.type?.toLowerCase();
      if (type?.includes('purchase') || type?.includes('received') || type?.includes('gifted') || type?.includes('free')) {
        return 'credit';
      }
      return 'debit';
    },
    getTxnIcon(txn) {
      const type = txn.transaction_type?.toLowerCase() || txn.type?.toLowerCase();
      if (type?.includes('purchase') || type?.includes('received') || type?.includes('gifted') || type?.includes('free')) {
        return 'hi-arrow-down';
      }
      return 'hi-arrow-up';
    },
    getTxnSign(txn) {
      const type = txn.transaction_type?.toLowerCase() || txn.type?.toLowerCase();
      if (type?.includes('purchase') || type?.includes('received') || type?.includes('gifted') || type?.includes('free')) {
        return '+';
      }
      return '-';
    },
    getTxnDescription(txn) {
      const type = txn.transaction_type?.toLowerCase() || txn.type?.toLowerCase() || '';
      if (type.includes('purchase')) return 'Credits purchased';
      if (type.includes('consumed') || type.includes('used')) return txn.description || 'Credit used for health score';
      if (type.includes('received')) return `Credits received from ${txn.sender_name || 'patient'}`;
      if (type.includes('sent') || type.includes('transfer')) return `Credits sent to ${txn.recipient_name || 'patient'}`;
      if (type.includes('gifted')) return 'Credits gifted';
      if (type.includes('free')) return 'Free monthly credits';
      return txn.description || txn.narration || 'Credit transaction';
    },
    formatDate(dateString) {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
};
</script>

<style scoped lang="scss">
.ai-credits-history {
  background: white;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  padding: 24px;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 12px;
  }

  &:hover {
    border-color: transparent;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;

    @media (max-width: 480px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 12px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 0;

      @media (max-width: 480px) {
        font-size: 16px;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .download-btns {
      display: flex;
      gap: 6px;

      @media (max-width: 480px) {
        gap: 4px;
      }
    }

    .download-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: #f3f4f6;
      border: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;

      @media (max-width: 480px) {
        padding: 5px 8px;
        font-size: 11px;
      }

      &:hover {
        background: #e5e7eb;
        color: #374151;
      }
    }
  }

  .loading-state {
    display: flex;
    justify-content: center;
    padding: 40px;
  }

  .empty-state {
    text-align: center;
    padding: 40px 16px;

    .empty-icon {
      color: #f59e0b;
      margin-bottom: 12px;
      opacity: 0.5;
    }

    .empty-text {
      font-size: 15px;
      font-weight: 600;
      color: #6b7280;
      margin: 0 0 4px 0;
    }

    .empty-hint {
      font-size: 13px;
      color: #9ca3af;
      margin: 0;
    }
  }

  .transactions-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    max-width: 100%;
    overflow: hidden;

    .transaction-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 10px;
      transition: all 0.2s ease;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
      overflow: hidden;

      @media (max-width: 480px) {
        gap: 6px;
        padding: 8px;
      }

      &:hover {
        background: #f3f4f6;
      }

      .txn-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        @media (max-width: 480px) {
          width: 28px;
          height: 28px;
          border-radius: 6px;
        }

        &.credit {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        &.debit {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }
      }

      .txn-details {
        flex: 1;
        min-width: 0;
        max-width: 100%;
        overflow: hidden;

        .txn-description {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #111827;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;

          @media (max-width: 480px) {
            font-size: 11px;
          }
        }

        .txn-date {
          display: block;
          font-size: 11px;
          color: #9ca3af;

          @media (max-width: 480px) {
            font-size: 10px;
          }
        }
      }

      .txn-amount {
        font-size: 14px;
        font-weight: 700;
        flex-shrink: 0;
        white-space: nowrap;
        text-align: right;

        @media (max-width: 480px) {
          font-size: 11px;
        }

        &.credit {
          color: #10b981;
        }

        &.debit {
          color: #ef4444;
        }
      }
    }
  }

  .load-more {
    display: flex;
    justify-content: center;
    margin-top: 16px;

    .load-more-btn {
      padding: 10px 24px;
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: #e5e7eb;
        color: #374151;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}
</style>
