<template>
  <div class="my-prescriptions">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">
        <RCIcon name="arrow-left" />
      </button>
      <h1>My Prescriptions</h1>
      <button class="add-btn" @click="$router.push('/pharmacy/upload-prescription')">
        <RCIcon name="plus" />
      </button>
    </div>

    <!-- Status Filters -->
    <div class="status-filters">
      <button
        v-for="filter in statusFilters"
        :key="filter.value"
        :class="['filter-btn', { active: activeFilter === filter.value }]"
        @click="activeFilter = filter.value"
      >
        {{ filter.label }}
        <span class="count" v-if="filter.count">{{ filter.count }}</span>
      </button>
    </div>

    <!-- Loading State -->
    <div class="loading-state" v-if="loading">
      <div class="spinner"></div>
      <p>Loading prescriptions...</p>
    </div>

    <!-- Empty State -->
    <div class="empty-state" v-else-if="filteredPrescriptions.length === 0">
      <RCIcon name="prescription" class="empty-icon" />
      <h3>No prescriptions {{ activeFilter !== 'all' ? 'with this status' : 'yet' }}</h3>
      <p>Upload your first prescription to get started with Rx medications</p>
      <button class="upload-btn" @click="$router.push('/pharmacy/upload-prescription')">
        <RCIcon name="upload" />
        Upload Prescription
      </button>
    </div>

    <!-- Prescription List -->
    <div class="prescriptions-list" v-else>
      <div
        v-for="prescription in filteredPrescriptions"
        :key="prescription._id"
        class="prescription-card"
        @click="viewPrescription(prescription._id)"
      >
        <div class="prescription-header">
          <div class="status-badge" :class="getStatusClass(prescription.verification_status)">
            {{ getStatusLabel(prescription.verification_status) }}
          </div>
          <span class="date">{{ formatDate(prescription.created_at) }}</span>
        </div>

        <div class="prescription-body">
          <div class="doctor-info" v-if="prescription.ocr_data?.doctor_name">
            <RCIcon name="user" />
            <span>Dr. {{ prescription.ocr_data.doctor_name }}</span>
          </div>
          <div class="clinic-info" v-if="prescription.ocr_data?.clinic_name">
            <RCIcon name="building" />
            <span>{{ prescription.ocr_data.clinic_name }}</span>
          </div>
          <div class="medications-info" v-if="prescription.ocr_data?.medications?.length">
            <RCIcon name="pill" />
            <span>{{ prescription.ocr_data.medications.length }} medication(s)</span>
          </div>
        </div>

        <div class="prescription-footer">
          <div class="validity" v-if="prescription.valid_until">
            <template v-if="isExpired(prescription.valid_until)">
              <span class="expired">Expired</span>
            </template>
            <template v-else>
              <span class="valid">Valid until {{ formatDate(prescription.valid_until) }}</span>
            </template>
          </div>
          <div class="usage" v-if="prescription.usage_count !== undefined">
            <span>Used {{ prescription.usage_count }} time(s)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div class="load-more" v-if="hasMore && !loading">
      <button @click="loadMore" :disabled="loadingMore">
        {{ loadingMore ? 'Loading...' : 'Load More' }}
      </button>
    </div>

    <!-- Upload FAB -->
    <button class="fab-upload" @click="$router.push('/pharmacy/upload-prescription')">
      <RCIcon name="camera" />
    </button>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import axios from "@/services/http";

export default defineComponent({
  name: "MyPrescriptions",
  components: { RCIcon },
  setup() {
    const router = useRouter();

    const prescriptions = ref([]);
    const loading = ref(true);
    const loadingMore = ref(false);
    const activeFilter = ref("all");
    const page = ref(1);
    const hasMore = ref(false);
    const stats = ref({
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
    });

    const statusFilters = computed(() => [
      { label: "All", value: "all", count: stats.value.total },
      { label: "Approved", value: "APPROVED", count: stats.value.approved },
      { label: "Pending", value: "PENDING", count: stats.value.pending },
      { label: "Rejected", value: "REJECTED", count: stats.value.rejected },
    ]);

    const filteredPrescriptions = computed(() => {
      if (activeFilter.value === "all") {
        return prescriptions.value;
      }
      return prescriptions.value.filter(
        (p) => p.verification_status === activeFilter.value ||
          (activeFilter.value === "PENDING" && isPendingStatus(p.verification_status))
      );
    });

    const isPendingStatus = (status) => {
      const pendingStatuses = [
        "PENDING",
        "TIER1_PROCESSING",
        "TIER1_PASSED",
        "TIER2_PROCESSING",
        "TIER2_PASSED",
        "PHARMACIST_REVIEW",
      ];
      return pendingStatuses.includes(status);
    };

    const fetchPrescriptions = async (pageNum = 1, append = false) => {
      try {
        if (!append) {
          loading.value = true;
        }

        const response = await axios.get("/pharmacy/prescriptions/my-uploads", {
          params: { page: pageNum, limit: 10 },
        });

        if (response.data.success) {
          const data = response.data.data;
          if (append) {
            prescriptions.value = [...prescriptions.value, ...data.uploads];
          } else {
            prescriptions.value = data.uploads;
          }
          hasMore.value = data.pagination.hasMore;
          page.value = pageNum;
        }
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
      } finally {
        loading.value = false;
        loadingMore.value = false;
      }
    };

    const fetchStats = async () => {
      try {
        const response = await axios.get("/pharmacy/prescriptions/stats/summary");
        if (response.data.success) {
          stats.value = response.data.data;
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    const loadMore = async () => {
      loadingMore.value = true;
      await fetchPrescriptions(page.value + 1, true);
    };

    const viewPrescription = (id) => {
      router.push(`/pharmacy/prescriptions/${id}`);
    };

    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const isExpired = (dateString) => {
      if (!dateString) return false;
      return new Date(dateString) < new Date();
    };

    const getStatusClass = (status) => {
      switch (status) {
        case "APPROVED":
          return "approved";
        case "REJECTED":
          return "rejected";
        case "PHARMACIST_REVIEW":
          return "review";
        case "EXPIRED":
          return "expired";
        default:
          return "pending";
      }
    };

    const getStatusLabel = (status) => {
      switch (status) {
        case "APPROVED":
          return "Approved";
        case "REJECTED":
          return "Rejected";
        case "PHARMACIST_REVIEW":
          return "In Review";
        case "EXPIRED":
          return "Expired";
        case "TIER1_PROCESSING":
        case "TIER2_PROCESSING":
          return "Processing";
        default:
          return "Pending";
      }
    };

    onMounted(() => {
      fetchPrescriptions();
      fetchStats();
    });

    return {
      prescriptions,
      loading,
      loadingMore,
      activeFilter,
      statusFilters,
      filteredPrescriptions,
      hasMore,
      loadMore,
      viewPrescription,
      formatDate,
      isExpired,
      getStatusClass,
      getStatusLabel,
    };
  },
});
</script>

<style scoped lang="scss">
.my-prescriptions {
  min-height: 100vh;
  background: $color-g-95;
  padding-bottom: $size-100;
}

.page-header {
  display: flex;
  align-items: center;
  gap: $size-12;
  padding: $size-16;
  background: $color-white;
  border-bottom: 1px solid $color-g-85;
  position: sticky;
  top: 0;
  z-index: 10;

  .back-btn,
  .add-btn {
    width: $size-40;
    height: $size-40;
    border-radius: 50%;
    border: none;
    background: $color-g-95;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    svg {
      width: $size-20;
      height: $size-20;
      color: $color-g-21;
    }
  }

  h1 {
    flex: 1;
    font-size: $size-18;
    font-weight: 600;
    color: $color-g-21;
  }
}

.status-filters {
  display: flex;
  gap: $size-8;
  padding: $size-16;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: $size-6;
    padding: $size-8 $size-16;
    background: $color-white;
    border: 1px solid $color-g-85;
    border-radius: $size-20;
    font-size: $size-14;
    color: $color-g-44;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s ease;

    &.active {
      background: $color-pri;
      border-color: $color-pri;
      color: white;

      .count {
        background: rgba(white, 0.2);
        color: white;
      }
    }

    .count {
      font-size: $size-12;
      padding: $size-2 $size-8;
      background: $color-g-95;
      border-radius: $size-10;
      color: $color-g-67;
    }
  }
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $size-64;
  gap: $size-16;

  .spinner {
    width: $size-40;
    height: $size-40;
    border: 3px solid $color-g-85;
    border-top-color: $color-pri;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  p {
    font-size: $size-14;
    color: $color-g-67;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $size-64 $size-24;
  text-align: center;

  .empty-icon {
    width: $size-64;
    height: $size-64;
    color: $color-g-67;
    margin-bottom: $size-16;
  }

  h3 {
    font-size: $size-18;
    font-weight: 600;
    color: $color-g-21;
    margin-bottom: $size-8;
  }

  p {
    font-size: $size-14;
    color: $color-g-67;
    margin-bottom: $size-24;
  }

  .upload-btn {
    display: flex;
    align-items: center;
    gap: $size-8;
    padding: $size-14 $size-24;
    background: $color-pri;
    color: white;
    border: none;
    border-radius: $size-12;
    font-size: $size-16;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: darken($color-pri, 10%);
    }

    svg {
      width: $size-20;
      height: $size-20;
    }
  }
}

.prescriptions-list {
  padding: 0 $size-16;
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.prescription-card {
  background: $color-white;
  border-radius: $size-12;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .prescription-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $size-12 $size-16;
    border-bottom: 1px solid $color-g-95;

    .status-badge {
      font-size: $size-12;
      font-weight: 600;
      padding: $size-4 $size-12;
      border-radius: $size-12;

      &.approved {
        background: rgba($color-denote-green, 0.1);
        color: $color-denote-green;
      }

      &.pending {
        background: rgba($color-denote-yellow, 0.1);
        color: $color-denote-yellow;
      }

      &.rejected,
      &.expired {
        background: rgba($color-denote-red, 0.1);
        color: $color-denote-red;
      }

      &.review {
        background: rgba($color-pri, 0.1);
        color: $color-pri;
      }
    }

    .date {
      font-size: $size-12;
      color: $color-g-67;
    }
  }

  .prescription-body {
    padding: $size-16;
    display: flex;
    flex-direction: column;
    gap: $size-8;

    > div {
      display: flex;
      align-items: center;
      gap: $size-8;
      font-size: $size-14;
      color: $color-g-44;

      svg {
        width: $size-16;
        height: $size-16;
        color: $color-g-67;
      }
    }

    .doctor-info {
      color: $color-g-21;
      font-weight: 500;
    }
  }

  .prescription-footer {
    display: flex;
    justify-content: space-between;
    padding: $size-12 $size-16;
    background: $color-g-97;
    font-size: $size-12;
    color: $color-g-67;

    .validity {
      .expired {
        color: $color-denote-red;
      }

      .valid {
        color: $color-denote-green;
      }
    }
  }
}

.load-more {
  padding: $size-16;
  text-align: center;

  button {
    padding: $size-12 $size-24;
    background: $color-white;
    border: 1px solid $color-g-85;
    border-radius: $size-8;
    font-size: $size-14;
    color: $color-g-44;
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      background: $color-g-95;
    }
  }
}

.fab-upload {
  position: fixed;
  bottom: $size-80;
  right: $size-16;
  width: $size-56;
  height: $size-56;
  border-radius: 50%;
  background: $color-pri;
  border: none;
  box-shadow: 0 4px 16px rgba($color-pri, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }

  svg {
    width: $size-24;
    height: $size-24;
    color: white;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
