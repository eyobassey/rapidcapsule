<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Prescriptions"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="prescriptions-page">
        <!-- Search and Filters -->
        <div class="filters-section">
          <div class="search-box">
            <RCIcon name="search" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search by prescription number or patient..."
              @input="debouncedSearch"
            />
          </div>
          <div class="filter-chips">
            <button
              :class="['filter-chip', { active: statusFilter === 'all' }]"
              @click="setStatusFilter('all')"
            >
              All
            </button>
            <button
              :class="['filter-chip', { active: statusFilter === 'PENDING' }]"
              @click="setStatusFilter('PENDING')"
            >
              Pending
            </button>
            <button
              :class="['filter-chip', { active: statusFilter === 'PARTIALLY_FILLED' }]"
              @click="setStatusFilter('PARTIALLY_FILLED')"
            >
              Partial
            </button>
            <button
              :class="['filter-chip', { active: statusFilter === 'FILLED' }]"
              @click="setStatusFilter('FILLED')"
            >
              Filled
            </button>
            <button
              :class="['filter-chip', { active: statusFilter === 'EXPIRED' }]"
              @click="setStatusFilter('EXPIRED')"
            >
              Expired
            </button>
          </div>
        </div>

        <!-- Prescriptions List -->
        <div class="prescriptions-list" v-if="!loading && prescriptions.length > 0">
          <div
            v-for="prescription in prescriptions"
            :key="prescription._id"
            class="prescription-card"
            @click="viewPrescriptionDetails(prescription._id)"
          >
            <div class="prescription-header">
              <div class="prescription-number">
                <span class="number">{{ prescription.prescription_number }}</span>
                <span class="date">{{ formatDate(prescription.created_at) }}</span>
              </div>
              <div :class="['prescription-status', statusClass(prescription.status)]">
                {{ formatStatus(prescription.status) }}
              </div>
            </div>

            <div class="prescription-body">
              <div class="patient-info">
                <RCIcon name="user" />
                <div class="details">
                  <span class="name">
                    {{ prescription.patient?.profile?.first_name }}
                    {{ prescription.patient?.profile?.last_name }}
                  </span>
                  <span class="doctor">
                    Dr. {{ prescription.specialist?.profile?.first_name }}
                    {{ prescription.specialist?.profile?.last_name }}
                  </span>
                </div>
              </div>
              <div class="items-count">
                <span class="count">{{ prescription.medications?.length || 0 }}</span>
                <span class="label">Items</span>
              </div>
            </div>

            <div class="prescription-footer">
              <div class="expiry-info" v-if="prescription.expiry_date">
                <RCIcon name="calendar" />
                <span :class="{ expired: isExpired(prescription.expiry_date) }">
                  {{ isExpired(prescription.expiry_date) ? 'Expired' : 'Expires' }}:
                  {{ formatDate(prescription.expiry_date) }}
                </span>
              </div>
              <div class="refills-info" v-if="prescription.refills_allowed > 0">
                <span>Refills: {{ prescription.refills_remaining || 0 }} / {{ prescription.refills_allowed }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && prescriptions.length === 0" class="empty-state">
          <RCIcon name="prescription" />
          <h3>No prescriptions found</h3>
          <p>{{ searchQuery ? 'Try a different search term' : 'No prescriptions match the selected filter' }}</p>
        </div>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            Previous
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            Next
          </button>
        </div>

        <!-- Loader -->
        <div class="loader-container" v-if="loading">
          <Loader :useOverlay="false" :rounded="true" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader.vue";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";
import { debounce } from "lodash";
import moment from "moment";

export default {
  name: "PharmacyPrescriptions",
  components: {
    TopBar,
    Loader,
    RCIcon,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const searchQuery = ref("");
    const statusFilter = ref("all");
    const currentPage = ref(1);
    const itemsPerPage = 10;

    const {
      "pharmacyPortal/fetchPrescriptions": fetchPrescriptions,
    } = useMapActions();

    const {
      "pharmacyPortal/getPrescriptions": prescriptionList,
      "pharmacyPortal/getTotalPrescriptions": totalPrescriptions,
      "pharmacyPortal/getLoading": isLoading,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);
    const prescriptions = computed(() => prescriptionList.value || []);
    const totalPages = computed(() => Math.ceil((totalPrescriptions.value || 0) / itemsPerPage));

    const formatDate = (date) => moment(date).format("MMM D, YYYY");

    const formatStatus = (status) => {
      const statusMap = {
        PENDING: "Pending",
        PARTIALLY_FILLED: "Partially Filled",
        FILLED: "Filled",
        EXPIRED: "Expired",
        CANCELLED: "Cancelled",
      };
      return statusMap[status] || status;
    };

    const statusClass = (status) => {
      const statusClasses = {
        PENDING: "pending",
        PARTIALLY_FILLED: "partial",
        FILLED: "filled",
        EXPIRED: "expired",
        CANCELLED: "cancelled",
      };
      return statusClasses[status] || "pending";
    };

    const isExpired = (date) => moment(date).isBefore(moment());

    const loadPrescriptions = async () => {
      const params = {
        page: currentPage.value,
        limit: itemsPerPage,
      };

      if (statusFilter.value !== "all") {
        params.status = statusFilter.value;
      }

      if (searchQuery.value) {
        params.search = searchQuery.value;
      }

      await fetchPrescriptions(params);
    };

    const setStatusFilter = (status) => {
      statusFilter.value = status;
      currentPage.value = 1;
      loadPrescriptions();
    };

    const debouncedSearch = debounce(() => {
      currentPage.value = 1;
      loadPrescriptions();
    }, 500);

    const changePage = (page) => {
      currentPage.value = page;
      loadPrescriptions();
    };

    const viewPrescriptionDetails = (prescriptionId) => {
      router.push(`/app/specialist/pharmacy-portal/prescriptions/${prescriptionId}`);
    };

    onMounted(() => {
      loadPrescriptions();
    });

    return {
      searchQuery,
      statusFilter,
      currentPage,
      totalPages,
      prescriptions,
      loading,
      formatDate,
      formatStatus,
      statusClass,
      isExpired,
      setStatusFilter,
      debouncedSearch,
      changePage,
      viewPrescriptionDetails,
    };
  },
};
</script>

<style scoped lang="scss">
.prescriptions-page {
  padding: $size-16;

  .filters-section {
    margin-bottom: $size-20;

    .search-box {
      display: flex;
      align-items: center;
      background: $color-white;
      border-radius: $size-10;
      padding: $size-12 $size-16;
      margin-bottom: $size-12;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      svg {
        width: $size-20;
        height: $size-20;
        color: $color-g-67;
        margin-right: $size-12;
      }

      input {
        flex: 1;
        border: none;
        outline: none;
        font-size: $size-16;
        background: transparent;

        &::placeholder {
          color: $color-g-67;
        }
      }
    }

    .filter-chips {
      display: flex;
      gap: $size-8;
      overflow-x: auto;
      padding-bottom: $size-4;

      &::-webkit-scrollbar {
        display: none;
      }

      .filter-chip {
        padding: $size-8 $size-16;
        border: 1px solid $color-g-85;
        border-radius: $size-20;
        background: $color-white;
        font-size: $size-14;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          border-color: $color-pri;
        }

        &.active {
          background: $color-pri;
          border-color: $color-pri;
          color: white;
        }
      }
    }
  }

  .prescriptions-list {
    display: flex;
    flex-direction: column;
    gap: $size-12;

    .prescription-card {
      background: $color-white;
      border-radius: $size-12;
      padding: $size-16;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .prescription-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: $size-12;

        .prescription-number {
          display: flex;
          flex-direction: column;
          gap: $size-4;

          .number {
            font-size: $size-14;
            font-weight: 600;
            color: $color-g-21;
          }

          .date {
            font-size: $size-12;
            color: $color-g-67;
          }
        }

        .prescription-status {
          font-size: $size-11;
          font-weight: 500;
          padding: $size-4 $size-8;
          border-radius: $size-4;

          &.pending {
            background: #fff3cd;
            color: #856404;
          }

          &.partial {
            background: #cce5ff;
            color: #004085;
          }

          &.filled {
            background: #d4edda;
            color: #155724;
          }

          &.expired,
          &.cancelled {
            background: #f8d7da;
            color: #721c24;
          }
        }
      }

      .prescription-body {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $size-12 0;
        border-top: 1px solid $color-g-95;
        border-bottom: 1px solid $color-g-95;

        .patient-info {
          display: flex;
          align-items: center;
          gap: $size-10;

          svg {
            width: $size-20;
            height: $size-20;
            color: $color-g-67;
          }

          .details {
            display: flex;
            flex-direction: column;

            .name {
              font-size: $size-14;
              font-weight: 500;
              color: $color-g-21;
            }

            .doctor {
              font-size: $size-12;
              color: $color-g-67;
            }
          }
        }

        .items-count {
          text-align: center;

          .count {
            display: block;
            font-size: $size-20;
            font-weight: 700;
            color: $color-pri;
          }

          .label {
            display: block;
            font-size: $size-11;
            color: $color-g-67;
          }
        }
      }

      .prescription-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: $size-12;

        .expiry-info {
          display: flex;
          align-items: center;
          gap: $size-6;
          font-size: $size-12;
          color: $color-g-67;

          svg {
            width: $size-14;
            height: $size-14;
          }

          .expired {
            color: #dc3545;
          }
        }

        .refills-info {
          font-size: $size-12;
          color: $color-g-44;
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $size-48;
    text-align: center;
    background: $color-white;
    border-radius: $size-12;

    svg {
      width: $size-64;
      height: $size-64;
      color: $color-g-67;
      margin-bottom: $size-16;
    }

    h3 {
      font-size: $size-18;
      font-weight: 600;
      margin-bottom: $size-8;
    }

    p {
      color: $color-g-67;
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: $size-16;
    margin-top: $size-24;

    .page-btn {
      padding: $size-10 $size-20;
      border: 1px solid $color-g-85;
      border-radius: $size-8;
      background: $color-white;
      font-size: $size-14;
      cursor: pointer;

      &:hover:not(:disabled) {
        border-color: $color-pri;
        color: $color-pri;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .page-info {
      font-size: $size-14;
      color: $color-g-44;
    }
  }
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: $size-48;
}
</style>
