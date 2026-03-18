<template>
  <div class="right__pane">
    <div class="pane__dock">
      <div class="notification-btn-wrapper" @click="goToNotifications">
        <buttonIcon
          type="primary"
          iconName="bell"
          :state="false"
        />
        <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import buttonIcon from "@/components/buttons/button-icon.vue";

export default {
  computed: {
    ...mapGetters({
      unreadCount: "notifications/getUnreadCount",
    }),
  },

  mounted() {
    this.$store.dispatch("notifications/fetchUnreadCount");
  },

  methods: {
    goToNotifications() {
      this.$router.push("/app/specialist/notifications");
    },
  },

  components: {
    buttonIcon,
  },
};
</script>

<style scoped lang="scss">
.right__pane {
  @include flexItem(horizontal) {
    position: relative;
    background-color: $color-g-95;

    @include responsive(phone) {
      background-color: transparent;
      display: none;
    }
  }

  .pane__dock {
    @include flexItem(vertical) {
      order: 2;
      gap: $size-16;
      padding: $size-32 $size-16;
      border-left: 1px solid $color-g-85;
    }

    .notification-btn-wrapper {
      position: relative;
      cursor: pointer;

      .notification-badge {
        position: absolute;
        top: -$size-4;
        right: -$size-4;
        min-width: $size-18;
        height: $size-18;
        background: $color-denote-red;
        color: white;
        border-radius: $size-10;
        font-size: $size-10;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 $size-4;
        z-index: 1;
      }
    }
  }
}
</style>
