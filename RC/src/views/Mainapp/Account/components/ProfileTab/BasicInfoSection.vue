<template>
  <div class="info-section">
    <div class="section-header">
      <h3 class="section-title">Personal Information</h3>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Full Name</span>
        <span class="info-value">{{ fullName }}</span>
      </div>

      <div class="info-item">
        <span class="info-label">Date of Birth</span>
        <span class="info-value">{{ formattedDob }}</span>
      </div>

      <div class="info-item">
        <span class="info-label">Gender</span>
        <span class="info-value">{{ profile?.gender || 'Not specified' }}</span>
      </div>

      <div class="info-item">
        <span class="info-label">Marital Status</span>
        <span class="info-value">{{ profile?.marital_status || 'Not specified' }}</span>
      </div>

      <div class="info-item">
        <span class="info-label">Phone Number</span>
        <span class="info-value">{{ formattedPhone }}</span>
      </div>

      <div class="info-item">
        <span class="info-label">Email</span>
        <span class="info-value">{{ profile?.contact?.email || 'Not provided' }}</span>
      </div>

      <div class="info-item full-width">
        <span class="info-label">Address</span>
        <span class="info-value">{{ fullAddress }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BasicInfoSection",
  props: {
    profile: {
      type: Object,
      default: () => ({}),
    },
  },
  computed: {
    fullName() {
      if (!this.profile?.first_name) return "Not provided";
      return `${this.profile.first_name} ${this.profile.last_name || ""}`.trim();
    },
    formattedDob() {
      if (!this.profile?.date_of_birth) return "Not provided";
      const date = new Date(this.profile.date_of_birth);
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    },
    formattedPhone() {
      const phone = this.profile?.contact?.phone;
      if (!phone?.number) return "Not provided";
      const code = phone.country_code || "";
      return `${code} ${phone.number}`.trim();
    },
    fullAddress() {
      const contact = this.profile?.contact;
      if (!contact?.address1) return "Not provided";

      const parts = [
        contact.address1,
        contact.address2,
        contact.state,
        contact.country,
        contact.zip_code,
      ].filter(Boolean);

      return parts.join(", ");
    },
  },
};
</script>

<style scoped lang="scss">
.info-section {
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
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      &.full-width {
        grid-column: 1 / -1;
      }

      .info-label {
        font-size: 12px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .info-value {
        font-size: 15px;
        font-weight: 500;
        color: #374151;
      }
    }
  }
}
</style>
