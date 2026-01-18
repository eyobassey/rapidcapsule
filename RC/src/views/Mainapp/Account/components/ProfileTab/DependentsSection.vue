<template>
  <div class="dependents-section">
    <div class="section-header">
      <h3 class="section-title">Dependents</h3>
      <button class="add-btn" @click="$emit('add')">
        <v-icon name="hi-plus" scale="0.9" />
        Add Dependent
      </button>
    </div>

    <div v-if="dependents.length === 0" class="empty-state">
      <div class="empty-icon">
        <v-icon name="hi-users" scale="2" />
      </div>
      <p class="empty-text">No dependents added</p>
      <p class="empty-hint">Add family members under your care</p>
    </div>

    <div v-else class="dependents-list">
      <div
        v-for="(dependent, index) in dependents"
        :key="dependent._id || index"
        class="dependent-card"
      >
        <div class="dependent-avatar">
          {{ getInitials(dependent) }}
        </div>
        <div class="dependent-info">
          <h4 class="dependent-name">{{ dependent.first_name }} {{ dependent.last_name }}</h4>
          <div class="dependent-meta">
            <span class="relationship-badge">{{ dependent.relationship }}</span>
            <span v-if="dependent.gender" class="gender">{{ dependent.gender }}</span>
          </div>
          <p v-if="dependent.date_of_birth" class="dependent-dob">
            Born {{ formatDate(dependent.date_of_birth) }}
          </p>
        </div>
        <div class="dependent-actions">
          <button class="action-btn edit" @click="$emit('edit', index)">
            <v-icon name="hi-pencil" scale="0.8" />
          </button>
          <button class="action-btn delete" @click="$emit('remove', dependent)">
            <v-icon name="hi-x" scale="0.9" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DependentsSection",
  props: {
    dependents: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["add", "edit", "remove"],
  methods: {
    getInitials(dependent) {
      const first = dependent.first_name?.[0] || "";
      const last = dependent.last_name?.[0] || "";
      return (first + last).toUpperCase();
    },
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
.dependents-section {
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

  .dependents-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;

    .dependent-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      transition: all 0.2s ease;

      &:hover {
        background: #f3f4f6;
      }

      .dependent-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 700;
        flex-shrink: 0;
      }

      .dependent-info {
        flex: 1;
        min-width: 0;

        .dependent-name {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 6px 0;
        }

        .dependent-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;

          .relationship-badge {
            padding: 2px 8px;
            background: rgba(99, 102, 241, 0.1);
            color: #6366f1;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 600;
          }

          .gender {
            font-size: 12px;
            color: #6b7280;
          }
        }

        .dependent-dob {
          font-size: 12px;
          color: #9ca3af;
          margin: 0;
        }
      }

      .dependent-actions {
        display: flex;
        gap: 6px;

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
