<template>
  <div class="whatsapp-settings">
    <div class="settings-header">
      <div class="header-left">
        <div class="whatsapp-icon">
          <img src="@/assets/icons/whatsapp.svg" alt="WhatsApp" class="icon" />
        </div>
        <div class="header-text">
          <h3 class="title">WhatsApp Integration</h3>
          <p class="subtitle">
            {{ isLinked ? 'Connected' : 'Not connected' }}
          </p>
        </div>
      </div>
      <div class="status-badge" :class="{ connected: isLinked }">
        {{ isLinked ? 'Active' : 'Inactive' }}
      </div>
    </div>

    <div class="settings-body">
      <!-- Not Linked State -->
      <div v-if="!isLinked" class="not-linked">
        <p class="description">
          Link your WhatsApp number to submit prescriptions, receive order updates,
          and chat with pharmacists directly.
        </p>
        <Button
          type="primary"
          label="Link WhatsApp"
          size="medium"
          @click="openLinkModal"
        />
      </div>

      <!-- Linked State -->
      <div v-else class="linked">
        <div class="linked-info">
          <div class="info-row">
            <span class="label">Linked Number:</span>
            <span class="value">{{ linkedNumber }}</span>
          </div>
          <div class="info-row">
            <span class="label">Linked On:</span>
            <span class="value">{{ linkedDate }}</span>
          </div>
        </div>

        <div class="linked-features">
          <p class="features-label">Active Features:</p>
          <div class="feature-tags">
            <span class="tag">Prescription Upload</span>
            <span class="tag">Order Updates</span>
            <span class="tag">Pharmacist Chat</span>
          </div>
        </div>

        <div class="linked-actions">
          <Button
            type="tertiary"
            label="Unlink WhatsApp"
            size="small"
            @click="confirmUnlink"
          />
        </div>
      </div>
    </div>

    <!-- Link Modal -->
    <WhatsAppLinkModal
      v-if="showLinkModal"
      @close="closeLinkModal"
      @linked="onLinked"
    />

    <!-- Unlink Confirmation Modal -->
    <ModalCaution
      v-if="showUnlinkConfirm"
      title="Unlink WhatsApp"
      @closeModal="showUnlinkConfirm = false"
      :has-footer="true"
    >
      <template v-slot:body>
        <div class="modal__content">
          <div class="caution">
            <p class="text">
              Are you sure you want to unlink your WhatsApp number?
              You will no longer receive prescription notifications or be able to
              chat with pharmacists via WhatsApp.
            </p>
          </div>
        </div>
      </template>
      <template v-slot:foot>
        <Button
          type="tertiary"
          label="Cancel"
          size="small"
          @click="showUnlinkConfirm = false"
        />
        <Button
          type="primary"
          label="Unlink"
          size="small"
          :loading="unlinkLoading"
          @click="unlinkWhatsApp"
        />
      </template>
    </ModalCaution>

    <!-- Loading Overlay -->
    <Loader v-if="loading" :useOverlay="true" :rounded="true" />
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useToast } from "vue-toast-notification";
import Button from "@/components/buttons/button-primary.vue";
import Loader from "@/components/Loader/main-loader.vue";
import ModalCaution from "@/components/modals/modal-caution.vue";
import WhatsAppLinkModal from "./WhatsAppLinkModal.vue";

export default {
  name: "WhatsAppSettings",
  components: { Button, Loader, ModalCaution, WhatsAppLinkModal },

  setup() {
    const store = useStore();
    const $toast = useToast();

    const showLinkModal = ref(false);
    const showUnlinkConfirm = ref(false);
    const unlinkLoading = ref(false);

    const loading = computed(() => store.getters["whatsapp/isLoading"]);
    const isLinked = computed(() => store.getters["whatsapp/isLinked"]);
    const linkedNumber = computed(() => store.getters["whatsapp/linkedNumber"]);

    const linkedDate = computed(() => {
      const identity = store.state.whatsapp.identity;
      if (identity?.verified_at) {
        const date = new Date(identity.verified_at);
        return date.toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      }
      return "-";
    });

    const fetchStatus = async () => {
      try {
        await store.dispatch("whatsapp/fetchStatus");
      } catch (error) {
        // Silently handle - not linked is valid state
      }
    };

    const openLinkModal = () => {
      showLinkModal.value = true;
    };

    const closeLinkModal = () => {
      showLinkModal.value = false;
    };

    const onLinked = () => {
      fetchStatus();
    };

    const confirmUnlink = () => {
      showUnlinkConfirm.value = true;
    };

    const unlinkWhatsApp = async () => {
      unlinkLoading.value = true;

      const result = await store.dispatch("whatsapp/unlinkNumber");

      unlinkLoading.value = false;
      showUnlinkConfirm.value = false;

      if (result.success) {
        $toast.success("WhatsApp unlinked successfully");
      } else {
        $toast.error(result.message || "Failed to unlink WhatsApp");
      }
    };

    onMounted(() => {
      fetchStatus();
    });

    return {
      loading,
      isLinked,
      linkedNumber,
      linkedDate,
      showLinkModal,
      showUnlinkConfirm,
      unlinkLoading,
      openLinkModal,
      closeLinkModal,
      onLinked,
      confirmUnlink,
      unlinkWhatsApp,
    };
  },
};
</script>

<style scoped lang="scss">
.whatsapp-settings {
  background: white;
  border-radius: $size-12;
  border: 1px solid $color-g-90;
  overflow: hidden;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $size-16 $size-24;
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);

  .header-left {
    display: flex;
    align-items: center;
    gap: $size-12;

    .whatsapp-icon {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      .icon {
        width: 24px;
        height: 24px;
        filter: brightness(0) invert(1);
      }
    }

    .header-text {
      .title {
        font-size: $size-18;
        font-weight: $fw-semi-bold;
        color: white;
        margin: 0;
      }

      .subtitle {
        font-size: $size-14;
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
      }
    }
  }

  .status-badge {
    padding: $size-4 $size-12;
    border-radius: $size-16;
    font-size: $size-12;
    font-weight: $fw-medium;
    background: rgba(255, 255, 255, 0.2);
    color: white;

    &.connected {
      background: rgba(255, 255, 255, 0.3);
    }
  }
}

.settings-body {
  padding: $size-24;
}

.not-linked {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: $size-16;

  .description {
    font-size: $size-16;
    color: $color-g-44;
    line-height: 1.5;
    max-width: 400px;
  }
}

.linked {
  display: flex;
  flex-direction: column;
  gap: $size-20;
}

.linked-info {
  display: flex;
  flex-direction: column;
  gap: $size-8;

  .info-row {
    display: flex;
    align-items: center;
    gap: $size-12;

    .label {
      font-size: $size-14;
      color: $color-g-67;
      min-width: 120px;
    }

    .value {
      font-size: $size-14;
      font-weight: $fw-medium;
      color: $color-g-21;
    }
  }
}

.linked-features {
  .features-label {
    font-size: $size-14;
    color: $color-g-67;
    margin-bottom: $size-8;
  }

  .feature-tags {
    display: flex;
    flex-wrap: wrap;
    gap: $size-8;

    .tag {
      padding: $size-4 $size-12;
      background: $color-pri-t5;
      color: $color-pri-s1;
      border-radius: $size-16;
      font-size: $size-12;
      font-weight: $fw-medium;
    }
  }
}

.linked-actions {
  padding-top: $size-8;
  border-top: 1px solid $color-g-90;
}

.modal__content {
  .caution {
    .text {
      font-size: $size-16;
      color: $color-g-44;
      line-height: 1.5;
    }
  }
}
</style>
