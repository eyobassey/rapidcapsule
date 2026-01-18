<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Select Pharmacy"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="select-pharmacy-page">
        <!-- Location Search -->
        <div class="location-section">
          <div class="location-input">
            <RCIcon name="location" />
            <input
              type="text"
              v-model="locationQuery"
              placeholder="Enter your location..."
              @input="debouncedLocationSearch"
            />
            <button class="use-location-btn" @click="useCurrentLocation">
              <RCIcon name="crosshair" />
            </button>
          </div>
          <p class="location-hint" v-if="currentAddress">
            <RCIcon name="map-pin" />
            {{ currentAddress }}
          </p>
        </div>

        <!-- Filter Options -->
        <div class="filter-section">
          <div class="filter-chips">
            <button
              :class="['filter-chip', { active: filterBy === 'all' }]"
              @click="filterBy = 'all'"
            >
              All
            </button>
            <button
              :class="['filter-chip', { active: filterBy === 'open' }]"
              @click="filterBy = 'open'"
            >
              Open Now
            </button>
            <button
              :class="['filter-chip', { active: filterBy === 'delivery' }]"
              @click="filterBy = 'delivery'"
            >
              Delivery
            </button>
            <button
              :class="['filter-chip', { active: filterBy === 'pickup' }]"
              @click="filterBy = 'pickup'"
            >
              Pickup
            </button>
          </div>
        </div>

        <!-- Pharmacies List -->
        <div class="pharmacies-list" v-if="!loading && filteredPharmacies.length > 0">
          <div
            v-for="pharmacy in filteredPharmacies"
            :key="pharmacy._id"
            :class="['pharmacy-card', { selected: selectedPharmacy?._id === pharmacy._id }]"
            @click="selectPharmacy(pharmacy)"
          >
            <div class="pharmacy-header">
              <div class="pharmacy-logo">
                <img v-if="pharmacy.logo_url" :src="pharmacy.logo_url" :alt="pharmacy.name" />
                <RCIcon v-else name="pharmacy" />
              </div>
              <div class="pharmacy-info">
                <h4>{{ pharmacy.name }}</h4>
                <p class="pharmacy-address">{{ pharmacy.address }}</p>
                <div class="pharmacy-meta">
                  <span class="distance" v-if="pharmacy.distance">
                    <RCIcon name="location" />
                    {{ formatDistance(pharmacy.distance) }}
                  </span>
                  <span :class="['status', pharmacy.is_open ? 'open' : 'closed']">
                    {{ pharmacy.is_open ? 'Open' : 'Closed' }}
                  </span>
                </div>
              </div>
              <div class="select-indicator">
                <RCIcon :name="selectedPharmacy?._id === pharmacy._id ? 'check-circle' : 'circle'" />
              </div>
            </div>

            <div class="pharmacy-details">
              <div class="detail-row">
                <span class="label">Operating Hours:</span>
                <span class="value">{{ pharmacy.operating_hours || '9:00 AM - 9:00 PM' }}</span>
              </div>
              <div class="detail-row" v-if="pharmacy.phone">
                <span class="label">Phone:</span>
                <span class="value">{{ pharmacy.phone }}</span>
              </div>
              <div class="delivery-options">
                <span v-if="pharmacy.offers_delivery" class="option">
                  <RCIcon name="truck" />
                  Delivery Available
                </span>
                <span v-if="pharmacy.offers_pickup" class="option">
                  <RCIcon name="package" />
                  Pickup Available
                </span>
              </div>
            </div>

            <div class="pharmacy-rating" v-if="pharmacy.rating">
              <div class="stars">
                <RCIcon name="star" v-for="n in 5" :key="n" :class="{ filled: n <= pharmacy.rating }" />
              </div>
              <span class="rating-text">{{ pharmacy.rating.toFixed(1) }} ({{ pharmacy.review_count || 0 }} reviews)</span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && filteredPharmacies.length === 0" class="empty-state">
          <RCIcon name="pharmacy" />
          <h3>No pharmacies found</h3>
          <p>Try adjusting your location or filters</p>
          <rc-button
            type="secondary"
            label="Use Current Location"
            @click="useCurrentLocation"
          />
        </div>

        <!-- Loader -->
        <div class="loader-container" v-if="loading">
          <Loader :useOverlay="false" :rounded="true" />
        </div>

        <!-- Continue Button -->
        <div class="action-section" v-if="selectedPharmacy">
          <div class="selected-pharmacy-summary">
            <strong>Selected:</strong> {{ selectedPharmacy.name }}
          </div>
          <rc-button
            type="primary"
            label="Continue to Checkout"
            @click="continueToCheckout"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import TopBar from "@/components/Navigation/top-bar";
import RcButton from "@/components/buttons/button-primary";
import Loader from "@/components/Loader/main-loader.vue";
import RCIcon from "@/components/RCIcon/RCIcon.vue";
import {
  mapActions as useMapActions,
  mapGetters as useMapGetters,
} from "@/utilities/utilityStore";
import { debounce } from "lodash";

export default {
  name: "SelectPharmacy",
  components: {
    TopBar,
    RcButton,
    Loader,
    RCIcon,
  },
  emits: ["openSideNav"],
  setup() {
    const router = useRouter();
    const route = useRoute();
    const locationQuery = ref("");
    const currentAddress = ref("");
    const filterBy = ref("all");
    const selectedPharmacy = ref(null);
    const userCoordinates = ref(null);

    const {
      "pharmacy/fetchNearbyPharmacies": fetchNearbyPharmacies,
      "pharmacy/fetchAcceptingPharmacies": fetchAcceptingPharmacies,
      "pharmacy/setSelectedPharmacy": setSelectedPharmacy,
    } = useMapActions();

    const {
      "pharmacy/getNearbyPharmacies": pharmacies,
      "pharmacy/getLoading": isLoading,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);

    const filteredPharmacies = computed(() => {
      let result = pharmacies.value || [];

      if (filterBy.value === "open") {
        result = result.filter((p) => p.is_open);
      } else if (filterBy.value === "delivery") {
        result = result.filter((p) => p.offers_delivery);
      } else if (filterBy.value === "pickup") {
        result = result.filter((p) => p.offers_pickup);
      }

      return result;
    });

    const formatDistance = (distance) => {
      if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
      }
      return `${distance.toFixed(1)}km`;
    };

    const useCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            userCoordinates.value = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            currentAddress.value = "Using your current location";
            await fetchPharmacies();
          },
          async (error) => {
            console.error("Geolocation error:", error);
            // Fallback to fetching all accepting pharmacies
            currentAddress.value = "Showing all available pharmacies";
            await fetchAcceptingPharmacies({ page: 1, limit: 20 });
          }
        );
      } else {
        // Fallback to fetching all accepting pharmacies
        currentAddress.value = "Showing all available pharmacies";
        fetchAcceptingPharmacies({ page: 1, limit: 20 });
      }
    };

    const fetchPharmacies = async () => {
      const params = {
        page: 1,
        limit: 20,
      };

      if (userCoordinates.value) {
        params.latitude = userCoordinates.value.latitude;
        params.longitude = userCoordinates.value.longitude;
        await fetchNearbyPharmacies(params);
      } else {
        // No coordinates, fetch all accepting pharmacies
        await fetchAcceptingPharmacies({ page: 1, limit: 20 });
      }
    };

    const debouncedLocationSearch = debounce(() => {
      if (locationQuery.value.length >= 3) {
        fetchPharmacies();
      }
    }, 500);

    const selectPharmacy = (pharmacy) => {
      selectedPharmacy.value = pharmacy;
    };

    const continueToCheckout = () => {
      if (selectedPharmacy.value) {
        setSelectedPharmacy(selectedPharmacy.value);
        router.push("/app/patient/pharmacy/checkout");
      }
    };

    onMounted(() => {
      // Try to get user's current location on mount
      useCurrentLocation();
    });

    return {
      locationQuery,
      currentAddress,
      filterBy,
      selectedPharmacy,
      pharmacies,
      filteredPharmacies,
      loading,
      formatDistance,
      useCurrentLocation,
      debouncedLocationSearch,
      selectPharmacy,
      continueToCheckout,
    };
  },
};
</script>

<style scoped lang="scss">
.select-pharmacy-page {
  padding: $size-16;
  padding-bottom: 120px;

  .location-section {
    margin-bottom: $size-20;

    .location-input {
      display: flex;
      align-items: center;
      background: $color-white;
      border-radius: $size-12;
      padding: $size-12 $size-16;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      > svg {
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

      .use-location-btn {
        padding: $size-8;
        border: none;
        background: $color-pri-t4;
        border-radius: $size-8;
        cursor: pointer;

        svg {
          width: $size-18;
          height: $size-18;
          color: $color-pri;
        }
      }
    }

    .location-hint {
      display: flex;
      align-items: center;
      gap: $size-6;
      margin-top: $size-8;
      font-size: $size-12;
      color: $color-g-67;

      svg {
        width: $size-14;
        height: $size-14;
      }
    }
  }

  .filter-section {
    margin-bottom: $size-20;

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

  .pharmacies-list {
    display: flex;
    flex-direction: column;
    gap: $size-16;

    .pharmacy-card {
      background: $color-white;
      border-radius: $size-12;
      padding: $size-16;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      &.selected {
        border-color: $color-pri;
        background: $color-pri-t4;
      }

      .pharmacy-header {
        display: flex;
        gap: $size-12;
        margin-bottom: $size-12;

        .pharmacy-logo {
          width: $size-56;
          height: $size-56;
          background: $color-g-95;
          border-radius: $size-10;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: $size-10;
          }

          svg {
            width: $size-28;
            height: $size-28;
            color: $color-g-67;
          }
        }

        .pharmacy-info {
          flex: 1;

          h4 {
            font-size: $size-16;
            font-weight: 600;
            color: $color-g-21;
            margin-bottom: $size-4;
          }

          .pharmacy-address {
            font-size: $size-14;
            color: $color-g-67;
            margin-bottom: $size-8;
          }

          .pharmacy-meta {
            display: flex;
            align-items: center;
            gap: $size-12;

            .distance {
              display: flex;
              align-items: center;
              gap: $size-4;
              font-size: $size-12;
              color: $color-g-44;

              svg {
                width: $size-12;
                height: $size-12;
              }
            }

            .status {
              font-size: $size-11;
              font-weight: 500;
              padding: $size-2 $size-8;
              border-radius: $size-4;

              &.open {
                background: #d4edda;
                color: #155724;
              }

              &.closed {
                background: #f8d7da;
                color: #721c24;
              }
            }
          }
        }

        .select-indicator {
          svg {
            width: $size-24;
            height: $size-24;
            color: $color-g-85;
          }
        }
      }

      &.selected .select-indicator svg {
        color: $color-pri;
      }

      .pharmacy-details {
        padding: $size-12 0;
        border-top: 1px solid $color-g-95;
        border-bottom: 1px solid $color-g-95;

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: $size-14;
          margin-bottom: $size-6;

          .label {
            color: $color-g-67;
          }

          .value {
            color: $color-g-44;
            font-weight: 500;
          }
        }

        .delivery-options {
          display: flex;
          gap: $size-12;
          margin-top: $size-8;

          .option {
            display: flex;
            align-items: center;
            gap: $size-4;
            font-size: $size-12;
            color: $color-denote-green;

            svg {
              width: $size-14;
              height: $size-14;
            }
          }
        }
      }

      .pharmacy-rating {
        display: flex;
        align-items: center;
        gap: $size-8;
        margin-top: $size-12;

        .stars {
          display: flex;
          gap: $size-2;

          svg {
            width: $size-14;
            height: $size-14;
            color: $color-g-85;

            &.filled {
              color: #ffc107;
            }
          }
        }

        .rating-text {
          font-size: $size-12;
          color: $color-g-67;
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

    svg {
      width: $size-64;
      height: $size-64;
      color: $color-g-67;
      margin-bottom: $size-16;
    }

    h3 {
      font-size: $size-20;
      font-weight: 600;
      margin-bottom: $size-8;
    }

    p {
      color: $color-g-67;
      margin-bottom: $size-24;
    }
  }

  .action-section {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: $size-16;
    background: $color-white;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.1);

    .selected-pharmacy-summary {
      font-size: $size-14;
      color: $color-g-44;
      margin-bottom: $size-12;
      text-align: center;

      strong {
        color: $color-g-21;
      }
    }

    button {
      width: 100%;
    }
  }
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: $size-48;
}
</style>
