<template>
  <div class="page-content">
    <TopBar showButtons type="avatar" @open-side-nav="$emit('openSideNav')" />
    <div class="page-content__body">
      <div class="patients-container">
        <!-- Header -->
        <div class="page-header">
          <div class="page-header__back">
            <button class="back-btn" @click="$router.back()">
              <rc-icon icon-name="arrow-left" size="sm" />
            </button>
            <div>
              <h1>Patient Search</h1>
              <p>Search and manage patient prescriptions</p>
            </div>
          </div>
        </div>

        <!-- Search & Filters -->
        <div class="search-section">
          <div class="search-bar">
            <rc-icon icon-name="search" size="sm" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name, email, or phone..."
              @input="debouncedSearch"
            />
            <button v-if="searchQuery" class="clear-btn" @click="clearSearch">
              <rc-icon icon-name="close" size="xs" />
            </button>
          </div>
          <div class="filter-tabs">
            <button
              :class="['filter-tab', { active: searchType === 'my_patients' }]"
              @click="setSearchType('my_patients')"
            >
              My Patients
            </button>
            <button
              :class="['filter-tab', { active: searchType === 'all' }]"
              @click="setSearchType('all')"
            >
              All Patients
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <loader v-if="isLoading" :useOverlay="false" />

        <!-- Results -->
        <div v-else class="results-section">
          <p class="results-count" v-if="patients.length">
            Showing {{ patients.length }} of {{ pagination.total }} patients
          </p>

          <div class="patients-list" v-if="patients.length">
            <div
              v-for="patient in patients"
              :key="patient._id"
              class="patient-card"
              @click="viewPatient(patient._id)"
            >
              <div class="patient-card__avatar">
                <img
                  v-if="patient.profile_image"
                  :src="patient.profile_image"
                  :alt="patient.full_name"
                />
                <span v-else>{{ getInitials(patient.full_name) }}</span>
              </div>
              <div class="patient-card__info">
                <h3>{{ patient.full_name }}</h3>
                <p class="patient-email">{{ patient.email }}</p>
                <p class="patient-phone">{{ patient.phone || 'No phone' }}</p>
              </div>
              <div class="patient-card__meta">
                <div class="meta-item">
                  <span class="meta-label">Gender</span>
                  <span class="meta-value">{{ patient.gender || 'N/A' }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Age</span>
                  <span class="meta-value">{{ calculateAge(patient.date_of_birth) }}</span>
                </div>
              </div>
              <div class="patient-card__stats">
                <div class="stat">
                  <span class="stat-value">{{ patient.total_appointments || 0 }}</span>
                  <span class="stat-label">Appointments</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ patient.total_prescriptions || 0 }}</span>
                  <span class="stat-label">Prescriptions</span>
                </div>
              </div>
              <div class="patient-card__arrow">
                <rc-icon icon-name="chevron-right" size="sm" />
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state">
            <rc-icon icon-name="users" size="xl" />
            <h3>No patients found</h3>
            <p v-if="searchQuery">Try adjusting your search criteria</p>
            <p v-else>Start by searching for a patient</p>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="pagination">
            <button
              class="pagination-btn"
              :disabled="pagination.page === 1"
              @click="goToPage(pagination.page - 1)"
            >
              <rc-icon icon-name="chevron-left" size="sm" />
            </button>
            <span class="pagination-info">
              Page {{ pagination.page }} of {{ pagination.totalPages }}
            </span>
            <button
              class="pagination-btn"
              :disabled="pagination.page === pagination.totalPages"
              @click="goToPage(pagination.page + 1)"
            >
              <rc-icon icon-name="chevron-right" size="sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TopBar from "@/components/Navigation/top-bar";
import Loader from "@/components/Loader/main-loader";
import RcIcon from "@/components/RCIcon";
import apiFactory from "@/services/apiFactory";
import moment from "moment";
import { debounce } from "lodash";

export default {
  name: "PharmacyPatients",
  components: {
    TopBar,
    Loader,
    RcIcon,
  },
  data() {
    return {
      isLoading: false,
      searchQuery: "",
      searchType: "my_patients",
      patients: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  },
  created() {
    this.debouncedSearch = debounce(this.searchPatients, 300);
  },
  async mounted() {
    await this.searchPatients();
  },
  methods: {
    async searchPatients() {
      try {
        this.isLoading = true;
        const params = {
          search: this.searchQuery || undefined,
          type: this.searchType,
          page: this.pagination.page,
          limit: this.pagination.limit,
        };
        const response = await apiFactory.$_searchPharmacyPatients(params);
        // Backend returns: { statusCode, message, data: { total, docs, pages, perPage, currentPage } }
        const result = response.data?.data || response.data?.result;
        if (result) {
          this.patients = result.docs || [];
          this.pagination = {
            ...this.pagination,
            total: result.total || 0,
            totalPages: result.pages || 0,
          };
        }
      } catch (error) {
        console.error("Error searching patients:", error);
        this.$toast.error("Failed to search patients");
      } finally {
        this.isLoading = false;
      }
    },
    setSearchType(type) {
      this.searchType = type;
      this.pagination.page = 1;
      this.searchPatients();
    },
    clearSearch() {
      this.searchQuery = "";
      this.pagination.page = 1;
      this.searchPatients();
    },
    goToPage(page) {
      this.pagination.page = page;
      this.searchPatients();
    },
    viewPatient(patientId) {
      this.$router.push(`/app/specialist/pharmacy/patients/${patientId}`);
    },
    getInitials(name) {
      if (!name) return "?";
      return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    },
    calculateAge(dateOfBirth) {
      if (!dateOfBirth) return "N/A";
      const years = moment().diff(moment(dateOfBirth), "years");
      return `${years} yrs`;
    },
  },
};
</script>

<style scoped lang="scss">
.page-content {
  @include flexItem(vertical) {
    width: 100%;
    height: 100%;
    background-color: $color-g-97;
  }

  &__body {
    flex-grow: 1;
    overflow-y: auto;
    padding: $size-24;

    @include responsive(tab-portrait) {
      padding: $size-16;
    }
  }
}

.patients-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: $size-24;

  &__back {
    display: flex;
    align-items: center;
    gap: $size-16;

    .back-btn {
      width: $size-40;
      height: $size-40;
      border-radius: 50%;
      border: none;
      background: $color-white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      &:hover {
        background: $color-g-95;
      }
    }

    h1 {
      font-size: $size-24;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    p {
      font-size: $size-15;
      color: $color-g-54;
    }
  }
}

.search-section {
  margin-bottom: $size-24;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: $size-12;
  background: $color-white;
  padding: $size-12 $size-16;
  border-radius: $size-12;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: $size-16;

  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: $size-15;
    color: $color-g-21;

    &::placeholder {
      color: $color-g-67;
    }
  }

  .clear-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: $size-4;
    color: $color-g-54;

    &:hover {
      color: $color-g-36;
    }
  }
}

.filter-tabs {
  display: flex;
  gap: $size-8;
}

.filter-tab {
  padding: $size-10 $size-20;
  border-radius: $size-8;
  border: 1px solid $color-g-85;
  background: $color-white;
  font-size: $size-15;
  font-weight: $fw-medium;
  color: $color-g-44;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: $color-pri;
    color: $color-pri;
  }

  &.active {
    background: $color-pri;
    border-color: $color-pri;
    color: $color-white;
  }
}

.results-section {
  min-height: 200px;
}

.results-count {
  font-size: $size-15;
  color: $color-g-54;
  margin-bottom: $size-16;
}

.patients-list {
  display: flex;
  flex-direction: column;
  gap: $size-12;
}

.patient-card {
  display: flex;
  align-items: center;
  gap: $size-16;
  background: $color-white;
  padding: $size-16 $size-20;
  border-radius: $size-12;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__avatar {
    width: $size-56;
    height: $size-56;
    border-radius: 50%;
    background: $color-pri;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    span {
      font-size: $size-18;
      font-weight: $fw-semi-bold;
      color: $color-white;
    }
  }

  &__info {
    flex: 2;
    min-width: 0;

    h3 {
      font-size: $size-16;
      font-weight: $fw-semi-bold;
      color: $color-g-21;
      margin-bottom: $size-4;
    }

    .patient-email,
    .patient-phone {
      font-size: $size-12;
      color: $color-g-54;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .patient-phone {
      margin-top: $size-2;
    }
  }

  &__meta {
    display: flex;
    gap: $size-24;
    flex: 1;

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: $size-4;
    }

    .meta-label {
      font-size: $size-11;
      color: $color-g-54;
      text-transform: uppercase;
    }

    .meta-value {
      font-size: $size-15;
      font-weight: $fw-medium;
      color: $color-g-36;
    }
  }

  &__stats {
    display: flex;
    gap: $size-20;
    flex: 1;

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: $size-2;
    }

    .stat-value {
      font-size: $size-20;
      font-weight: $fw-bold;
      color: $color-pri;
    }

    .stat-label {
      font-size: $size-11;
      color: $color-g-54;
    }
  }

  &__arrow {
    color: $color-g-54;
  }

  @include responsive(tab-landscape) {
    flex-wrap: wrap;

    &__avatar,
    &__info {
      flex: unset;
    }

    &__info {
      flex: 1;
    }

    &__meta,
    &__stats {
      flex: unset;
      width: 100%;
      justify-content: flex-start;
      padding-top: $size-12;
      border-top: 1px solid $color-g-92;
      margin-top: $size-8;
    }

    &__arrow {
      display: none;
    }
  }
}

.empty-state {
  text-align: center;
  padding: $size-64 $size-24;
  color: $color-g-54;

  h3 {
    font-size: $size-18;
    font-weight: $fw-semi-bold;
    color: $color-g-44;
    margin: $size-16 0 $size-8;
  }

  p {
    font-size: $size-15;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $size-16;
  margin-top: $size-24;

  &-btn {
    width: $size-40;
    height: $size-40;
    border-radius: $size-8;
    border: 1px solid $color-g-85;
    background: $color-white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
      border-color: $color-pri;
      color: $color-pri;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &-info {
    font-size: $size-15;
    color: $color-g-54;
  }
}
</style>
