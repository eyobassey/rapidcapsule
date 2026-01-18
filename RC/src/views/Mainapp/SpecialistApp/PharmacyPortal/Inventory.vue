<template>
  <div class="page-content">
    <top-bar
      type="title-with-back"
      title="Inventory Management"
      @open-side-nav="$emit('openSideNav')"
      @go-back="$router.back()"
    />

    <div class="page-content__body">
      <div class="inventory-page">
        <!-- Search and Filters -->
        <div class="filters-section">
          <div class="search-box">
            <RCIcon name="search" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search drugs..."
              @input="debouncedSearch"
            />
          </div>
          <div class="filter-row">
            <select v-model="categoryFilter" @change="loadInventory">
              <option value="">All Categories</option>
              <option v-for="cat in categories" :key="cat._id" :value="cat._id">
                {{ cat.name }}
              </option>
            </select>
            <select v-model="stockFilter" @change="loadInventory">
              <option value="">All Stock Levels</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
              <option value="available">In Stock</option>
            </select>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="inventory-stats">
          <div class="stat">
            <span class="stat-value">{{ stats.totalProducts }}</span>
            <span class="stat-label">Total Products</span>
          </div>
          <div class="stat low">
            <span class="stat-value">{{ stats.lowStock }}</span>
            <span class="stat-label">Low Stock</span>
          </div>
          <div class="stat out">
            <span class="stat-value">{{ stats.outOfStock }}</span>
            <span class="stat-label">Out of Stock</span>
          </div>
        </div>

        <!-- Add New Drug Button -->
        <div class="add-drug-section">
          <rc-button
            type="primary"
            label="+ Add New Drug"
            @click="showAddModal = true"
          />
        </div>

        <!-- Inventory List -->
        <div class="inventory-list" v-if="!loading && inventory.length > 0">
          <div
            v-for="drug in inventory"
            :key="drug._id"
            class="inventory-item"
          >
            <div class="drug-image">
              <img v-if="drug.image_url" :src="drug.image_url" :alt="drug.name" />
              <RCIcon v-else name="pill" />
            </div>
            <div class="drug-info">
              <h4>{{ drug.name }}</h4>
              <p class="drug-details">{{ drug.strength }} {{ drug.dosage_form }}</p>
              <p class="drug-category">{{ drug.category?.name || 'Uncategorized' }}</p>
              <div class="drug-prices">
                <span class="selling-price">{{ formatPrice(drug.selling_price) }}</span>
                <span class="cost-price">Cost: {{ formatPrice(drug.cost_price) }}</span>
              </div>
            </div>
            <div class="stock-info">
              <div :class="['stock-badge', stockClass(drug.quantity)]">
                {{ drug.quantity }} in stock
              </div>
              <div class="reorder-level">
                Reorder at: {{ drug.reorder_level || 10 }}
              </div>
            </div>
            <div class="item-actions">
              <button class="action-btn edit" @click="editDrug(drug)">
                <RCIcon name="edit" />
              </button>
              <button class="action-btn stock" @click="openStockModal(drug)">
                <RCIcon name="plus" />
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && inventory.length === 0" class="empty-state">
          <RCIcon name="pill" />
          <h3>No drugs found</h3>
          <p>Add drugs to your inventory to get started</p>
          <rc-button
            type="primary"
            label="Add First Drug"
            @click="showAddModal = true"
          />
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

    <!-- Add/Edit Drug Modal -->
    <div class="modal-overlay" v-if="showAddModal || showEditModal" @click="closeModals">
      <div class="modal-content" @click.stop>
        <h3>{{ showEditModal ? 'Edit Drug' : 'Add New Drug' }}</h3>
        <form @submit.prevent="saveDrug">
          <div class="form-group">
            <label>Drug Name *</label>
            <input type="text" v-model="drugForm.name" required />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Strength</label>
              <input type="text" v-model="drugForm.strength" placeholder="e.g., 500mg" />
            </div>
            <div class="form-group">
              <label>Dosage Form</label>
              <select v-model="drugForm.dosage_form">
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Cream">Cream</option>
                <option value="Ointment">Ointment</option>
                <option value="Drops">Drops</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Generic Name</label>
            <input type="text" v-model="drugForm.generic_name" />
          </div>
          <div class="form-group">
            <label>Category</label>
            <select v-model="drugForm.category">
              <option value="">Select Category</option>
              <option v-for="cat in categories" :key="cat._id" :value="cat._id">
                {{ cat.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Classification</label>
            <select v-model="drugForm.classification">
              <option value="OTC_GENERAL">OTC - General</option>
              <option value="OTC_RESTRICTED">OTC - Restricted</option>
              <option value="PHARMACY_ONLY">Pharmacy Only</option>
              <option value="PRESCRIPTION_ONLY">Prescription Only</option>
              <option value="CONTROLLED">Controlled Substance</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Cost Price *</label>
              <input type="number" v-model="drugForm.cost_price" required min="0" step="0.01" />
            </div>
            <div class="form-group">
              <label>Selling Price *</label>
              <input type="number" v-model="drugForm.selling_price" required min="0" step="0.01" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Quantity</label>
              <input type="number" v-model="drugForm.quantity" min="0" />
            </div>
            <div class="form-group">
              <label>Reorder Level</label>
              <input type="number" v-model="drugForm.reorder_level" min="0" />
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="drugForm.description" rows="3"></textarea>
          </div>
          <div class="form-group checkbox">
            <input type="checkbox" v-model="drugForm.requires_prescription" id="requiresRx" />
            <label for="requiresRx">Requires Prescription</label>
          </div>
          <div class="modal-actions">
            <rc-button type="secondary" label="Cancel" @click="closeModals" />
            <rc-button type="primary" :label="showEditModal ? 'Update' : 'Add Drug'" @click="saveDrug" />
          </div>
        </form>
      </div>
    </div>

    <!-- Stock Update Modal -->
    <div class="modal-overlay" v-if="showStockModal" @click="showStockModal = false">
      <div class="modal-content small" @click.stop>
        <h3>Update Stock</h3>
        <p class="stock-drug-name">{{ selectedDrug?.name }}</p>
        <p class="current-stock">Current Stock: {{ selectedDrug?.quantity }}</p>
        <div class="form-group">
          <label>Add Quantity</label>
          <input type="number" v-model="stockQuantity" min="1" />
        </div>
        <div class="modal-actions">
          <rc-button type="secondary" label="Cancel" @click="showStockModal = false" />
          <rc-button type="primary" label="Update Stock" @click="updateStock" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive } from "vue";
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
  name: "PharmacyInventory",
  components: {
    TopBar,
    RcButton,
    Loader,
    RCIcon,
  },
  emits: ["openSideNav"],
  setup() {
    const searchQuery = ref("");
    const categoryFilter = ref("");
    const stockFilter = ref("");
    const currentPage = ref(1);
    const itemsPerPage = 20;
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showStockModal = ref(false);
    const selectedDrug = ref(null);
    const stockQuantity = ref(1);

    const drugForm = reactive({
      name: "",
      strength: "",
      dosage_form: "Tablet",
      generic_name: "",
      category: "",
      classification: "OTC_GENERAL",
      cost_price: 0,
      selling_price: 0,
      quantity: 0,
      reorder_level: 10,
      description: "",
      requires_prescription: false,
    });

    const {
      "pharmacyPortal/fetchInventory": fetchInventory,
      "pharmacyPortal/fetchCategories": fetchCategories,
      "pharmacyPortal/addDrug": addDrugAction,
      "pharmacyPortal/updateDrug": updateDrugAction,
      "pharmacyPortal/updateStock": updateStockAction,
    } = useMapActions();

    const {
      "pharmacyPortal/getInventory": inventoryList,
      "pharmacyPortal/getCategories": categoryList,
      "pharmacyPortal/getTotalInventory": totalItems,
      "pharmacyPortal/getInventoryStats": inventoryStats,
      "pharmacyPortal/getLoading": isLoading,
    } = useMapGetters();

    const loading = computed(() => isLoading.value);
    const inventory = computed(() => inventoryList.value || []);
    const categories = computed(() => categoryList.value || []);
    const stats = computed(() => inventoryStats.value || {
      totalProducts: 0,
      lowStock: 0,
      outOfStock: 0,
    });
    const totalPages = computed(() => Math.ceil((totalItems.value || 0) / itemsPerPage));

    const formatPrice = (price) => {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
      }).format(price || 0);
    };

    const stockClass = (quantity) => {
      if (quantity <= 0) return "out";
      if (quantity <= 10) return "low";
      return "available";
    };

    const loadInventory = async () => {
      const params = {
        page: currentPage.value,
        limit: itemsPerPage,
      };

      if (searchQuery.value) params.search = searchQuery.value;
      if (categoryFilter.value) params.category = categoryFilter.value;
      if (stockFilter.value) params.stockStatus = stockFilter.value;

      await fetchInventory(params);
    };

    const debouncedSearch = debounce(() => {
      currentPage.value = 1;
      loadInventory();
    }, 500);

    const changePage = (page) => {
      currentPage.value = page;
      loadInventory();
    };

    const resetForm = () => {
      Object.assign(drugForm, {
        name: "",
        strength: "",
        dosage_form: "Tablet",
        generic_name: "",
        category: "",
        classification: "OTC_GENERAL",
        cost_price: 0,
        selling_price: 0,
        quantity: 0,
        reorder_level: 10,
        description: "",
        requires_prescription: false,
      });
    };

    const editDrug = (drug) => {
      Object.assign(drugForm, {
        _id: drug._id,
        name: drug.name,
        strength: drug.strength,
        dosage_form: drug.dosage_form,
        generic_name: drug.generic_name,
        category: drug.category?._id || "",
        classification: drug.classification,
        cost_price: drug.cost_price,
        selling_price: drug.selling_price,
        quantity: drug.quantity,
        reorder_level: drug.reorder_level,
        description: drug.description,
        requires_prescription: drug.requires_prescription,
      });
      showEditModal.value = true;
    };

    const saveDrug = async () => {
      try {
        if (showEditModal.value) {
          await updateDrugAction(drugForm);
        } else {
          await addDrugAction(drugForm);
        }
        closeModals();
        loadInventory();
      } catch (error) {
        console.error("Error saving drug:", error);
      }
    };

    const openStockModal = (drug) => {
      selectedDrug.value = drug;
      stockQuantity.value = 1;
      showStockModal.value = true;
    };

    const updateStock = async () => {
      try {
        await updateStockAction({
          drugId: selectedDrug.value._id,
          quantity: stockQuantity.value,
        });
        showStockModal.value = false;
        loadInventory();
      } catch (error) {
        console.error("Error updating stock:", error);
      }
    };

    const closeModals = () => {
      showAddModal.value = false;
      showEditModal.value = false;
      resetForm();
    };

    onMounted(async () => {
      await Promise.all([
        loadInventory(),
        fetchCategories(),
      ]);
    });

    return {
      searchQuery,
      categoryFilter,
      stockFilter,
      currentPage,
      totalPages,
      inventory,
      categories,
      stats,
      loading,
      showAddModal,
      showEditModal,
      showStockModal,
      selectedDrug,
      stockQuantity,
      drugForm,
      formatPrice,
      stockClass,
      loadInventory,
      debouncedSearch,
      changePage,
      editDrug,
      saveDrug,
      openStockModal,
      updateStock,
      closeModals,
    };
  },
};
</script>

<style scoped lang="scss">
.inventory-page {
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

    .filter-row {
      display: flex;
      gap: $size-12;

      select {
        flex: 1;
        padding: $size-10;
        border: 1px solid $color-g-85;
        border-radius: $size-8;
        font-size: $size-14;
        background: $color-white;
      }
    }
  }

  .inventory-stats {
    display: flex;
    gap: $size-12;
    margin-bottom: $size-20;

    .stat {
      flex: 1;
      background: $color-white;
      border-radius: $size-10;
      padding: $size-16;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .stat-value {
        display: block;
        font-size: $size-24;
        font-weight: 700;
        color: $color-g-21;
      }

      .stat-label {
        display: block;
        font-size: $size-12;
        color: $color-g-67;
      }

      &.low .stat-value {
        color: #ffc107;
      }

      &.out .stat-value {
        color: #dc3545;
      }
    }
  }

  .add-drug-section {
    margin-bottom: $size-20;

    button {
      width: 100%;
    }
  }

  .inventory-list {
    display: flex;
    flex-direction: column;
    gap: $size-12;

    .inventory-item {
      display: flex;
      align-items: center;
      gap: $size-12;
      background: $color-white;
      border-radius: $size-10;
      padding: $size-12;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

      .drug-image {
        width: $size-56;
        height: $size-56;
        border-radius: $size-8;
        background: $color-g-95;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: $size-8;
        }

        svg {
          width: $size-28;
          height: $size-28;
          color: $color-g-67;
        }
      }

      .drug-info {
        flex: 1;
        min-width: 0;

        h4 {
          font-size: $size-14;
          font-weight: 600;
          color: $color-g-21;
          margin-bottom: $size-2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .drug-details {
          font-size: $size-12;
          color: $color-g-44;
          margin-bottom: $size-2;
        }

        .drug-category {
          font-size: $size-11;
          color: $color-g-67;
          margin-bottom: $size-4;
        }

        .drug-prices {
          display: flex;
          gap: $size-8;
          align-items: center;

          .selling-price {
            font-size: $size-14;
            font-weight: 600;
            color: $color-pri;
          }

          .cost-price {
            font-size: $size-11;
            color: $color-g-67;
          }
        }
      }

      .stock-info {
        text-align: center;
        min-width: 80px;

        .stock-badge {
          font-size: $size-12;
          font-weight: 500;
          padding: $size-4 $size-8;
          border-radius: $size-4;
          margin-bottom: $size-4;

          &.available {
            background: #d4edda;
            color: #155724;
          }

          &.low {
            background: #fff3cd;
            color: #856404;
          }

          &.out {
            background: #f8d7da;
            color: #721c24;
          }
        }

        .reorder-level {
          font-size: $size-10;
          color: $color-g-67;
        }
      }

      .item-actions {
        display: flex;
        flex-direction: column;
        gap: $size-6;

        .action-btn {
          width: $size-32;
          height: $size-32;
          border-radius: $size-6;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;

          svg {
            width: $size-16;
            height: $size-16;
          }

          &.edit {
            background: $color-g-95;
            color: $color-g-44;

            &:hover {
              background: $color-g-85;
            }
          }

          &.stock {
            background: $color-pri;
            color: white;

            &:hover {
              background: darken($color-pri, 10%);
            }
          }
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
      margin-bottom: $size-16;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: $size-16;

  .modal-content {
    background: $color-white;
    border-radius: $size-16;
    padding: $size-24;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;

    &.small {
      max-width: 350px;
    }

    h3 {
      font-size: $size-18;
      font-weight: 600;
      margin-bottom: $size-20;
    }

    .stock-drug-name {
      font-size: $size-16;
      font-weight: 500;
      color: $color-g-21;
      margin-bottom: $size-8;
    }

    .current-stock {
      font-size: $size-14;
      color: $color-g-67;
      margin-bottom: $size-16;
    }

    .form-group {
      margin-bottom: $size-16;

      label {
        display: block;
        font-size: $size-14;
        font-weight: 500;
        color: $color-g-44;
        margin-bottom: $size-6;
      }

      input,
      select,
      textarea {
        width: 100%;
        padding: $size-10;
        border: 1px solid $color-g-85;
        border-radius: $size-8;
        font-size: $size-14;

        &:focus {
          outline: none;
          border-color: $color-pri;
        }
      }

      &.checkbox {
        display: flex;
        align-items: center;
        gap: $size-8;

        input {
          width: auto;
        }

        label {
          margin-bottom: 0;
        }
      }
    }

    .form-row {
      display: flex;
      gap: $size-12;

      .form-group {
        flex: 1;
      }
    }

    .modal-actions {
      display: flex;
      gap: $size-12;
      margin-top: $size-20;

      button {
        flex: 1;
      }
    }
  }
}

.loader-container {
  display: flex;
  justify-content: center;
  padding: $size-48;
}
</style>
