<template>
  <div class="conditions-section">
    <div class="section-header">
      <h3 class="section-title">Pre-existing Conditions</h3>
      <button class="add-btn" @click="$emit('add')">
        <v-icon name="hi-plus" scale="0.9" />
        Add Condition
      </button>
    </div>

    <div v-if="conditions.length === 0" class="empty-state">
      <div class="empty-icon">
        <v-icon name="hi-clipboard-list" scale="2" />
      </div>
      <p class="empty-text">No pre-existing conditions added</p>
      <p class="empty-hint">Add any medical conditions you have for better healthcare</p>
    </div>

    <div v-else class="conditions-list">
      <div
        v-for="(condition, index) in conditions"
        :key="condition._id || index"
        class="condition-card"
      >
        <div class="condition-info">
          <div class="condition-header">
            <h4 class="condition-name">{{ condition.name }}</h4>
            <span
              class="condition-status"
              :class="{ active: condition.is_condition_exists }"
            >
              {{ condition.is_condition_exists ? 'Ongoing' : 'Resolved' }}
            </span>
          </div>
          <p v-if="condition.description" class="condition-description">
            {{ condition.description }}
          </p>
          <p class="condition-dates">
            {{ formatDate(condition.start_date) }} -
            {{ condition.end_date ? formatDate(condition.end_date) : 'Present' }}
          </p>
          <a
            v-if="condition.file && condition.file.length > 0 && condition.file[0]?.url"
            :href="condition.file[0].url"
            target="_blank"
            class="document-link"
            @click.stop
          >
            <v-icon name="hi-document-text" scale="0.8" />
            View Document
          </a>
        </div>
        <div class="condition-actions">
          <button class="action-btn edit" @click="$emit('edit', index)">
            <v-icon name="hi-pencil" scale="0.8" />
          </button>
          <button class="action-btn delete" @click="$emit('remove', condition)">
            <v-icon name="hi-x" scale="0.9" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ConditionsSection",
  props: {
    conditions: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["add", "edit", "remove"],
  methods: {
    formatDate(date) {
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    },
  },
};
</script>

<style scoped lang="scss">
.conditions-section {
  background: white;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  padding: 24px;
  transition: all 0.3s ease;

  @media (max-width: 480px) {
    padding: 16px;
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

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: white;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(14, 174, 196, 0.3);
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 32px 16px;

    .empty-icon {
      color: #d1d5db;
      margin-bottom: 12px;
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

  .conditions-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .condition-card {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      transition: all 0.2s ease;

      &:hover {
        background: #f3f4f6;
      }

      .condition-info {
        flex: 1;
        min-width: 0;

        .condition-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;

          .condition-name {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }

          .condition-status {
            padding: 2px 8px;
            background: #e5e7eb;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;

            &.active {
              background: rgba(239, 68, 68, 0.1);
              color: #ef4444;
            }
          }
        }

        .condition-description {
          font-size: 13px;
          color: #6b7280;
          margin: 0 0 6px 0;
          line-height: 1.4;
        }

        .condition-dates {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }

        .document-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding: 6px 12px;
          background: linear-gradient(135deg, rgba(14, 174, 196, 0.1) 0%, rgba(8, 145, 178, 0.05) 100%);
          border: 1px solid rgba(14, 174, 196, 0.2);
          border-radius: 8px;
          color: #0EAEC4;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;

          &:hover {
            background: linear-gradient(135deg, rgba(14, 174, 196, 0.2) 0%, rgba(8, 145, 178, 0.1) 100%);
            border-color: #0EAEC4;
            transform: translateY(-1px);
          }
        }
      }

      .condition-actions {
        display: flex;
        gap: 8px;
        margin-left: 12px;

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;

          &.edit {
            background: rgba(14, 174, 196, 0.1);
            color: #0EAEC4;

            &:hover {
              background: rgba(14, 174, 196, 0.2);
            }
          }

          &.delete {
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;

            &:hover {
              background: rgba(239, 68, 68, 0.2);
            }
          }
        }
      }
    }
  }
}
</style>
