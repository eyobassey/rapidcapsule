<template>
  <div class="profile-header">
    <div class="profile-header__avatar-section">
      <div class="avatar-wrapper" @click="$emit('editProfile')">
        <AvatarFixed
          size="large"
          :firstname="profile?.first_name"
          :lastname="profile?.last_name"
          :image="profile?.profile_photo"
        />
        <div class="avatar-edit-overlay">
          <v-icon name="hi-pencil" scale="1" />
        </div>
      </div>
    </div>

    <div class="profile-header__info">
      <div class="name-row">
        <h1 class="profile-name">{{ fullName }}</h1>
        <span class="member-badge">
          <v-icon name="hi-shield-check" scale="0.8" />
          Member
        </span>
      </div>

      <p class="profile-email">{{ profile?.contact?.email }}</p>

      <div class="profile-meta">
        <span class="meta-item">
          <v-icon name="hi-calendar" scale="0.85" />
          Joined {{ memberSince }}
        </span>
        <span class="meta-divider">|</span>
        <span class="meta-item">
          <v-icon name="hi-user" scale="0.85" />
          {{ profile?.gender || 'Not specified' }}
        </span>
      </div>
    </div>

    <button class="edit-btn" @click="$emit('editProfile')">
      <v-icon name="hi-pencil" scale="0.9" />
      Edit Profile
    </button>
  </div>
</template>

<script>
import AvatarFixed from "@/components/Avatars/avatar-fixed.vue";

export default {
  name: "ProfileHeader",
  components: {
    AvatarFixed,
  },
  props: {
    profile: {
      type: Object,
      default: () => ({}),
    },
    createdAt: {
      type: String,
      default: "",
    },
  },
  emits: ["editProfile"],
  computed: {
    fullName() {
      if (!this.profile?.first_name) return "User";
      return `${this.profile.first_name} ${this.profile.last_name || ""}`.trim();
    },
    memberSince() {
      if (!this.createdAt) return "Recently";
      const date = new Date(this.createdAt);
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    },
  },
};
</script>

<style scoped lang="scss">
.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px;
  background: white;
  border-radius: 16px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;

  &:hover {
    border-color: transparent;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    padding: 24px 16px;
    gap: 16px;
  }

  @media (max-width: 480px) {
    padding: 20px 14px;
    border-radius: 12px;
  }

  &__avatar-section {
    flex-shrink: 0;

    .avatar-wrapper {
      position: relative;
      cursor: pointer;

      .avatar-edit-overlay {
        position: absolute;
        bottom: 4px;
        right: 4px;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #0EAEC4 0%, #0891b2 100%);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        border: 3px solid white;
        transition: transform 0.2s ease;
      }

      &:hover .avatar-edit-overlay {
        transform: scale(1.1);
      }
    }
  }

  &__info {
    flex: 1;
    min-width: 0;

    .name-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 8px;
      }
    }

    .profile-name {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 0;

      @media (max-width: 480px) {
        font-size: 20px;
      }
    }

    .member-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: linear-gradient(135deg, rgba(14, 174, 196, 0.1) 0%, rgba(8, 145, 178, 0.1) 100%);
      color: #0891b2;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .profile-email {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 12px 0;
    }

    .profile-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #9ca3af;
      font-size: 13px;

      @media (max-width: 768px) {
        justify-content: center;
        flex-wrap: wrap;
      }

      .meta-item {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .meta-divider {
        color: #e5e7eb;
      }
    }
  }

  .edit-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: transparent;
    border: 2px solid #e5e7eb;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #f9fafb;
      border-color: #0EAEC4;
      color: #0EAEC4;
    }

    @media (max-width: 768px) {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
