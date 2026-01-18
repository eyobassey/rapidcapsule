<template>
  <div class="contacts-section">
    <div class="section-header">
      <h3 class="section-title">Emergency Contacts</h3>
      <button class="add-btn" @click="$emit('add')">
        <v-icon name="hi-plus" scale="0.9" />
        Add Contact
      </button>
    </div>

    <div v-if="contacts.length === 0" class="empty-state">
      <div class="empty-icon">
        <v-icon name="io-call-outline" scale="2" />
      </div>
      <p class="empty-text">No emergency contacts added</p>
      <p class="empty-hint">Add trusted contacts for emergencies</p>
    </div>

    <div v-else class="contacts-list">
      <div
        v-for="(contact, index) in contacts"
        :key="contact._id || index"
        class="contact-card"
      >
        <div class="contact-avatar">
          {{ getInitials(contact) }}
        </div>
        <div class="contact-info">
          <h4 class="contact-name">{{ contact.first_name }} {{ contact.last_name }}</h4>
          <p class="contact-relationship">{{ contact.relationship }}</p>
          <p class="contact-phone">{{ formatPhone(contact.phone) }}</p>
        </div>
        <div class="contact-actions">
          <button class="action-btn edit" @click="$emit('edit', index)">
            <v-icon name="hi-pencil" scale="0.8" />
          </button>
          <button class="action-btn delete" @click="$emit('remove', contact)">
            <v-icon name="hi-x" scale="0.9" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "EmergencyContacts",
  props: {
    contacts: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["add", "edit", "remove"],
  methods: {
    getInitials(contact) {
      const first = contact.first_name?.[0] || "";
      const last = contact.last_name?.[0] || "";
      return (first + last).toUpperCase();
    },
    formatPhone(phone) {
      if (!phone?.number) return "";
      const code = phone.country_code || "";
      return `${code} ${phone.number}`.trim();
    },
  },
};
</script>

<style scoped lang="scss">
.contacts-section {
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

  .contacts-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 12px;

    .contact-card {
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

      .contact-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: 700;
        flex-shrink: 0;
      }

      .contact-info {
        flex: 1;
        min-width: 0;

        .contact-name {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 2px 0;
        }

        .contact-relationship {
          font-size: 12px;
          color: #0EAEC4;
          font-weight: 500;
          margin: 0 0 4px 0;
        }

        .contact-phone {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }
      }

      .contact-actions {
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
