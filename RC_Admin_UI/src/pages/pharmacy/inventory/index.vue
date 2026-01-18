<template>
  <div>
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Drug Inventory</h1>
        <p class="text-subtitle-1 text-medium-emphasis">Manage pharmacy drug inventory</p>
      </div>
      <div class="d-flex gap-2">
        <VMenu>
          <template #activator="{ props }">
            <VBtn v-bind="props" variant="outlined" prepend-icon="mdi-cog">
              Manage
            </VBtn>
          </template>
          <VList>
            <VListItem :to="{ path: '/pharmacy/suppliers' }">
              <template #prepend>
                <VIcon size="small">mdi-truck-delivery</VIcon>
              </template>
              <VListItemTitle>Suppliers</VListItemTitle>
            </VListItem>
            <VDivider />
            <VListItem @click="manageDialog = 'categories'; openManageDialog()">
              <VListItemTitle>Categories</VListItemTitle>
            </VListItem>
            <VListItem @click="manageDialog = 'classifications'; openManageDialog()">
              <VListItemTitle>Classifications</VListItemTitle>
            </VListItem>
            <VListItem @click="manageDialog = 'routes'; openManageDialog()">
              <VListItemTitle>Drug Routes</VListItemTitle>
            </VListItem>
            <VListItem @click="manageDialog = 'dosage-forms'; openManageDialog()">
              <VListItemTitle>Dosage Forms</VListItemTitle>
            </VListItem>
            <VListItem @click="manageDialog = 'manufacturers'; openManageDialog()">
              <VListItemTitle>Manufacturers</VListItemTitle>
            </VListItem>
            <VDivider />
            <VListItem @click="recallManagementDialogVisible = true">
              <template #prepend>
                <VIcon size="small" color="error">mdi-alert-octagram</VIcon>
              </template>
              <VListItemTitle class="text-error">Recall Management</VListItemTitle>
            </VListItem>
            <VListItem @click="fdaSafetyStatsDialogVisible = true">
              <template #prepend>
                <VIcon size="small" color="info">mdi-shield-check</VIcon>
              </template>
              <VListItemTitle>FDA Safety Sync</VListItemTitle>
            </VListItem>
            <VDivider />
            <VListItem @click="syncInventory" :disabled="syncing">
              <VListItemTitle>Sync Inventory Status</VListItemTitle>
            </VListItem>
            <VDivider />
            <VListItem @click="seedSampleData" :disabled="seeding">
              <VListItemTitle>Seed Sample Data</VListItemTitle>
            </VListItem>
            <VListItem @click="clearSampleData" :disabled="seeding">
              <VListItemTitle class="text-error">Clear Sample Data</VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>
        <VBtn variant="outlined" prepend-icon="mdi-file-chart" @click="reportsDialogVisible = true">
          Reports
        </VBtn>
        <VBtn color="success" variant="outlined" prepend-icon="mdi-package-down" @click="openReceiveStockDialog()">
          Receive Stock
        </VBtn>
        <VBtn color="primary" prepend-icon="mdi-plus" @click="openAddDialog">
          Add Drug
        </VBtn>
      </div>
    </div>

    <!-- Stats Cards -->
    <VRow class="mb-6">
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="primary" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-pill</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.totalProducts }}</div>
              <div class="text-body-2 text-medium-emphasis">Total Products</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="success" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-package-variant-closed</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.activeBatches || 0 }}</div>
              <div class="text-body-2 text-medium-emphasis">Active Batches</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="warning" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-alert</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.lowStock }}</div>
              <div class="text-body-2 text-medium-emphasis">Low Stock</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12" sm="3">
        <VCard>
          <VCardText class="d-flex align-center">
            <VAvatar color="error" variant="tonal" size="48" class="me-4">
              <VIcon>mdi-close-circle</VIcon>
            </VAvatar>
            <div>
              <div class="text-h4 font-weight-bold">{{ stats.outOfStock }}</div>
              <div class="text-body-2 text-medium-emphasis">Out of Stock</div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Expiry Alerts Panel - Collapsible -->
    <VExpansionPanels class="mb-6" v-model="expiryAlertsExpanded">
      <VExpansionPanel value="alerts">
        <VExpansionPanelTitle>
          <div class="d-flex align-center gap-2">
            <VIcon color="warning">mdi-alert-circle</VIcon>
            <span class="font-weight-medium">Expiry Alerts</span>
            <VChip v-if="stats.expiringBatches" size="small" color="warning" variant="tonal" class="ms-2">
              {{ stats.expiringBatches }} batch{{ stats.expiringBatches !== 1 ? 'es' : '' }}
            </VChip>
          </div>
        </VExpansionPanelTitle>
        <VExpansionPanelText>
          <ExpiryAlertsPanel @alert-action="fetchInventory" />
        </VExpansionPanelText>
      </VExpansionPanel>
    </VExpansionPanels>

    <!-- Filters -->
    <VCard class="mb-6">
      <VCardText>
        <VRow>
          <VCol cols="12" md="3">
            <VTextField
              v-model="searchQuery"
              label="Search drugs..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="debouncedSearch"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VSelect
              v-model="categoryFilter"
              label="Category"
              :items="categories"
              item-title="name"
              item-value="_id"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchInventory"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VSelect
              v-model="classificationFilter"
              label="Classification"
              :items="classifications"
              item-title="name"
              item-value="_id"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchInventory"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VAutocomplete
              v-model="manufacturerFilter"
              label="Manufacturer"
              :items="manufacturers"
              item-title="name"
              item-value="_id"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchInventory"
            />
          </VCol>
          <VCol cols="12" md="3">
            <VAutocomplete
              v-model="supplierFilter"
              label="Supplier"
              :items="suppliers"
              item-title="name"
              item-value="_id"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchInventory"
            />
          </VCol>
        </VRow>
        <VRow class="mt-0">
          <VCol cols="12" md="2">
            <VSelect
              v-model="stockFilter"
              label="Stock Status"
              :items="stockOptions"
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="fetchInventory"
            />
          </VCol>
          <VCol cols="12" md="1">
            <VSelect
              v-model="itemsPerPage"
              label="Per Page"
              :items="[10, 25, 50, 100]"
              variant="outlined"
              density="compact"
              @update:model-value="fetchInventory"
            />
          </VCol>
          <VCol cols="12" md="2">
            <VCheckbox
              v-model="includeSampleData"
              label="Show Sample Data"
              density="compact"
              @update:model-value="fetchInventory"
            />
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Inventory Table -->
    <VCard>
      <VCardText>
        <VTable v-if="inventory.length > 0">
          <thead>
            <tr>
              <th style="width: 50px;"></th>
              <th>Drug</th>
              <th>Category</th>
              <th>Classification</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="drug in inventory" :key="drug._id">
              <tr :class="{ 'expanded-row': expandedDrugs[drug._id] }">
                <td>
                  <VBtn
                    icon
                    variant="text"
                    size="small"
                    @click="toggleDrugExpand(drug)"
                  >
                    <VIcon>{{ expandedDrugs[drug._id] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</VIcon>
                  </VBtn>
                </td>
                <td>
                  <div class="d-flex align-center">
                    <VAvatar size="40" color="grey-lighten-2" class="me-3 cursor-pointer" @click="editDrug(drug)">
                      <VImg v-if="getPrimaryImage(drug)" :src="getPrimaryImage(drug)" />
                      <VIcon v-else>mdi-pill</VIcon>
                    </VAvatar>
                    <div>
                      <div class="font-weight-medium">
                        <a href="#" class="text-decoration-none text-primary" @click.prevent="editDrug(drug)">
                          {{ drug.name }}
                        </a>
                        <VChip v-if="drug.is_sample_data" size="x-small" color="info" class="ms-1">Sample</VChip>
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ drug.brand_name || drug.generic_name }} - {{ drug.strength }}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <VChip v-if="drug.categories?.length" size="small" variant="tonal">
                    {{ drug.categories[0]?.name || 'Uncategorized' }}
                    <span v-if="drug.categories.length > 1" class="ml-1">+{{ drug.categories.length - 1 }}</span>
                  </VChip>
                  <span v-else class="text-medium-emphasis">Uncategorized</span>
                </td>
                <td>
                  <VTooltip location="top" v-if="drug.classification">
                    <template #activator="{ props }">
                      <VChip
                        v-bind="props"
                        :color="drug.classification.color || 'grey'"
                        size="small"
                        variant="tonal"
                      >
                        {{ drug.classification.short_code || drug.classification.name }}
                      </VChip>
                    </template>
                    <div class="text-center">
                      <div class="font-weight-bold">{{ drug.classification.name }}</div>
                      <div class="text-caption" v-if="drug.classification.description">
                        {{ drug.classification.description }}
                      </div>
                      <div class="text-caption mt-1">
                        <span v-if="drug.classification.requires_prescription">Requires Prescription</span>
                        <span v-else-if="drug.classification.requires_pharmacist_approval">Pharmacist Approval Required</span>
                        <span v-else>No Prescription Required</span>
                      </div>
                    </div>
                  </VTooltip>
                </td>
                <td>{{ formatPrice(drug.cost_price) }}</td>
                <td class="font-weight-medium">{{ formatPrice(drug.selling_price) }}</td>
                <td>
                  <VChip :color="getStockColor(drug.quantity, drug.reorder_level)" size="small">
                    {{ drug.quantity }}
                  </VChip>
                </td>
                <td>
                  <VChip :color="drug.is_available ? 'success' : 'error'" size="small" variant="tonal">
                    {{ drug.is_available ? 'Available' : 'Unavailable' }}
                  </VChip>
                </td>
                <td>
                  <VMenu>
                    <template #activator="{ props }">
                      <VBtn v-bind="props" size="small" variant="text" icon>
                        <VIcon>mdi-dots-vertical</VIcon>
                      </VBtn>
                    </template>
                    <VList density="compact">
                      <VListItem @click="editDrug(drug)">
                        <template #prepend>
                          <VIcon size="small">mdi-pencil</VIcon>
                        </template>
                        <VListItemTitle>Edit Drug</VListItemTitle>
                      </VListItem>
                      <VListItem @click="openReceiveStockDialog(drug)">
                        <template #prepend>
                          <VIcon size="small" color="success">mdi-package-down</VIcon>
                        </template>
                        <VListItemTitle>Receive Stock</VListItemTitle>
                      </VListItem>
                      <VListItem @click="toggleDrugExpand(drug)">
                        <template #prepend>
                          <VIcon size="small" color="info">mdi-format-list-bulleted</VIcon>
                        </template>
                        <VListItemTitle>{{ expandedDrugs[drug._id] ? 'Hide' : 'View' }} Batches</VListItemTitle>
                      </VListItem>
                      <VListItem @click="openDrugSafetyDialog(drug)">
                        <template #prepend>
                          <VIcon size="small" color="primary">mdi-shield-alert</VIcon>
                        </template>
                        <VListItemTitle>Safety Info</VListItemTitle>
                      </VListItem>
                      <VListItem @click="openSimilarDrugsDialog(drug)">
                        <template #prepend>
                          <VIcon size="small" color="success">mdi-link-variant</VIcon>
                        </template>
                        <VListItemTitle>Similar Drugs</VListItemTitle>
                      </VListItem>
                      <VDivider />
                      <VListItem @click="confirmDelete(drug)">
                        <template #prepend>
                          <VIcon size="small" color="error">mdi-delete</VIcon>
                        </template>
                        <VListItemTitle class="text-error">Delete Drug</VListItemTitle>
                      </VListItem>
                    </VList>
                  </VMenu>
                </td>
              </tr>
              <!-- Expanded row for batch panel -->
              <tr v-if="expandedDrugs[drug._id]" class="batch-panel-row">
                <td colspan="9" class="pa-0">
                  <BatchListPanel
                    :drug="drug"
                    @stock-updated="fetchInventory"
                    @receive-stock="openReceiveStockDialog(drug)"
                  />
                </td>
              </tr>
            </template>
          </tbody>
        </VTable>

        <VAlert v-else-if="!loading" type="info" variant="tonal">
          No drugs found matching your criteria
        </VAlert>

        <!-- Pagination -->
        <div class="d-flex justify-center mt-4" v-if="totalPages > 1">
          <VPagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="fetchInventory"
          />
        </div>
      </VCardText>
    </VCard>

    <!-- Add/Edit Drug Dialog -->
    <VDialog v-model="drugDialog" max-width="900" persistent scrollable>
      <VCard>
        <VCardTitle class="d-flex justify-space-between align-center">
          <span>{{ editingDrug ? 'Edit Drug' : 'Add New Drug' }}</span>
          <VBtn icon variant="text" @click="closeDrugDialog">
            <VIcon>mdi-close</VIcon>
          </VBtn>
        </VCardTitle>
        <VDivider />
        <VCardText style="max-height: 70vh; overflow-y: auto;">
          <VForm ref="drugForm" @submit.prevent="saveDrug">
            <!-- Basic Information -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Basic Information</div>
            <VRow>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="drugData.name"
                  label="Drug Name *"
                  :rules="[v => !!v || 'Required']"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="drugData.generic_name"
                  label="Generic Name *"
                  :rules="[v => !!v || 'Required']"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="drugData.brand_name"
                  label="Brand Name"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="drugData.manufacturer"
                  label="Manufacturer"
                  :items="manufacturers"
                  item-title="name"
                  item-value="_id"
                  clearable
                >
                  <template #item="{ item, props }">
                    <VListItem v-bind="props">
                      <template #append>
                        <span class="text-caption text-medium-emphasis">{{ item.raw.country }}</span>
                      </template>
                    </VListItem>
                  </template>
                </VSelect>
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="drugData.pharmacy_id"
                  label="Pharmacy *"
                  :items="pharmacies"
                  item-title="name"
                  item-value="_id"
                  :rules="[v => !!v || 'Required']"
                >
                  <template #item="{ item, props }">
                    <VListItem v-bind="props">
                      <template #subtitle>
                        {{ item.raw.is_platform_default ? 'Platform Default' : item.raw.address?.city || 'N/A' }}
                      </template>
                    </VListItem>
                  </template>
                </VSelect>
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="drugData.strength"
                  label="Strength *"
                  placeholder="e.g., 500mg"
                  :rules="[v => !!v || 'Required']"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model="drugData.nafdac_number"
                  label="NAFDAC Number"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Classification & Category -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Classification & Category</div>
            <VRow>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="drugData.classification"
                  label="Classification *"
                  :items="classifications"
                  item-title="name"
                  item-value="_id"
                  :rules="[v => !!v || 'Required']"
                >
                  <template #item="{ item, props }">
                    <VListItem v-bind="props">
                      <template #prepend>
                        <VAvatar size="24" :color="item.raw.color || 'grey'">
                          <span class="text-caption text-white">{{ item.raw.short_code }}</span>
                        </VAvatar>
                      </template>
                    </VListItem>
                  </template>
                </VSelect>
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="drugData.categories"
                  label="Categories"
                  :items="categories"
                  item-title="name"
                  item-value="_id"
                  multiple
                  chips
                  closable-chips
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="drugData.dosage_form"
                  label="Dosage Form"
                  :items="dosageForms"
                  item-title="name"
                  item-value="_id"
                />
              </VCol>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="drugData.route"
                  label="Administration Route"
                  :items="routes"
                  item-title="name"
                  item-value="_id"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Pricing & Inventory -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Pricing & Inventory</div>
            <VRow>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="drugData.cost_price"
                  label="Cost Price *"
                  type="number"
                  prefix="₦"
                  :rules="[v => v >= 0 || 'Must be positive']"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="drugData.selling_price"
                  label="Selling Price *"
                  type="number"
                  prefix="₦"
                  :rules="[v => v >= 0 || 'Must be positive']"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="drugData.discount_percentage"
                  label="Discount %"
                  type="number"
                  suffix="%"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="drugData.quantity"
                  label="Quantity"
                  type="number"
                  :rules="[v => v >= 0 || 'Must be positive']"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="drugData.reorder_level"
                  label="Reorder Level"
                  type="number"
                />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="drugData.pack_size"
                  label="Pack Size"
                  type="number"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Drug Images -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Drug Images</div>
            <VRow>
              <VCol cols="12">
                <div class="d-flex flex-wrap gap-3 mb-3">
                  <!-- Existing Images -->
                  <div
                    v-for="(img, index) in drugData.images"
                    :key="index"
                    class="position-relative"
                    style="width: 100px; height: 100px;"
                  >
                    <VImg
                      :src="img.url"
                      width="100"
                      height="100"
                      cover
                      class="rounded"
                      :class="{ 'border-primary border-2': img.is_primary }"
                    />
                    <div class="position-absolute" style="top: -8px; right: -8px;">
                      <VBtn
                        icon
                        size="x-small"
                        color="error"
                        @click="removeImage(index)"
                      >
                        <VIcon size="14">mdi-close</VIcon>
                      </VBtn>
                    </div>
                    <div class="position-absolute" style="bottom: 4px; left: 4px;">
                      <VBtn
                        v-if="!img.is_primary"
                        size="x-small"
                        variant="tonal"
                        @click="setPrimaryImage(index)"
                      >
                        Set Primary
                      </VBtn>
                      <VChip v-else size="x-small" color="primary">Primary</VChip>
                    </div>
                  </div>

                  <!-- Upload Button -->
                  <div
                    class="d-flex align-center justify-center border-dashed rounded cursor-pointer"
                    style="width: 100px; height: 100px; border-width: 2px;"
                    @click="triggerImageUpload"
                  >
                    <div class="text-center">
                      <VIcon size="24" color="grey">mdi-plus</VIcon>
                      <div class="text-caption text-grey">Add Image</div>
                    </div>
                  </div>

                  <!-- Generate Placeholder Button -->
                  <div
                    v-if="drugData.name"
                    class="d-flex align-center justify-center border-dashed rounded cursor-pointer"
                    style="width: 100px; height: 100px; border-width: 2px; border-color: rgb(var(--v-theme-primary));"
                    @click="generatePlaceholder"
                    :class="{ 'opacity-50 pointer-events-none': generatingPlaceholder }"
                  >
                    <div class="text-center">
                      <VProgressCircular v-if="generatingPlaceholder" size="24" indeterminate color="primary" />
                      <VIcon v-else size="24" color="primary">mdi-image-auto-adjust</VIcon>
                      <div class="text-caption text-primary">Placeholder</div>
                    </div>
                  </div>
                </div>
                <input
                  ref="imageInput"
                  type="file"
                  accept="image/*"
                  multiple
                  class="d-none"
                  @change="handleImageUpload"
                />
                <div class="text-caption text-medium-emphasis">
                  Upload up to 10 images. Max 5MB each. First image will be primary.
                  <span v-if="drugData.name" class="text-primary">Or generate a placeholder image.</span>
                </div>
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Description -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Description</div>
            <VRow>
              <VCol cols="12">
                <VTextField
                  v-model="drugData.short_description"
                  label="Short Description"
                />
              </VCol>
              <VCol cols="12">
                <VTextarea
                  v-model="drugData.description"
                  label="Full Description"
                  rows="3"
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Restrictions & Requirements -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Restrictions & Requirements</div>
            <VRow>
              <VCol cols="12" md="6">
                <VSelect
                  v-model="drugData.purchase_type"
                  :items="purchaseTypes"
                  item-title="label"
                  item-value="value"
                  label="Purchase Type *"
                  :rules="[v => !!v || 'Purchase type is required']"
                  hint="Determines how this drug can be purchased"
                  persistent-hint
                />
              </VCol>
              <VCol cols="12" md="6">
                <VTextField
                  v-model.number="drugData.max_quantity_per_order"
                  label="Max Qty Per Order"
                  type="number"
                  hint="Leave empty for no limit"
                  persistent-hint
                />
              </VCol>
              <VCol cols="12" md="4">
                <VCheckbox v-model="drugData.requires_prescription" label="Requires Prescription" />
              </VCol>
              <VCol cols="12" md="4">
                <VCheckbox v-model="drugData.requires_pharmacist_approval" label="Requires Pharmacist Approval" />
              </VCol>
              <VCol cols="12" md="4">
                <VCheckbox v-model="drugData.requires_id_verification" label="Requires ID Verification" />
              </VCol>
              <VCol cols="12" md="4">
                <VTextField
                  v-model.number="drugData.min_age"
                  label="Minimum Age"
                  type="number"
                  hint="Leave empty for no age restriction"
                  persistent-hint
                />
              </VCol>
            </VRow>

            <VDivider class="my-4" />

            <!-- Availability -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Availability</div>
            <VRow>
              <VCol cols="12" md="4">
                <VCheckbox v-model="drugData.is_active" label="Active" />
              </VCol>
              <VCol cols="12" md="4">
                <VCheckbox v-model="drugData.is_available" label="Available for Sale" />
              </VCol>
              <VCol cols="12" md="4">
                <VCheckbox v-model="drugData.is_featured" label="Featured" />
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
        <VDivider />
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="closeDrugDialog">Cancel</VBtn>
          <VBtn color="primary" @click="saveDrug" :loading="saving">
            {{ editingDrug ? 'Update' : 'Add Drug' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Stock Update Dialog -->
    <VDialog v-model="stockDialog" max-width="400">
      <VCard>
        <VCardTitle>Update Stock</VCardTitle>
        <VCardText>
          <div class="mb-4">
            <div class="font-weight-medium">{{ selectedDrug?.name }}</div>
            <div class="text-caption text-medium-emphasis">Current Stock: {{ selectedDrug?.quantity }}</div>
          </div>
          <VSelect
            v-model="stockAdjustmentType"
            label="Adjustment Type"
            :items="[
              { title: 'Add to Stock', value: 'add' },
              { title: 'Subtract from Stock', value: 'subtract' },
              { title: 'Set Stock', value: 'set' }
            ]"
            class="mb-3"
          />
          <VTextField
            v-model.number="stockQuantity"
            label="Quantity"
            type="number"
            min="0"
          />
          <VTextField
            v-model="stockReason"
            label="Reason (Optional)"
            class="mt-3"
          />
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="stockDialog = false">Cancel</VBtn>
          <VBtn color="primary" @click="updateStock" :loading="saving">Update</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Delete Confirmation Dialog -->
    <VDialog v-model="deleteDialog" max-width="400">
      <VCard>
        <VCardTitle>Delete Drug</VCardTitle>
        <VCardText>
          Are you sure you want to delete <strong>{{ selectedDrug?.name }}</strong>? This action cannot be undone.
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn variant="text" @click="deleteDialog = false">Cancel</VBtn>
          <VBtn color="error" @click="deleteDrug" :loading="saving">Delete</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Manage Dialog (Categories, Classifications, Routes, Dosage Forms) -->
    <VDialog v-model="showManageDialog" :max-width="manageDialog === 'categories' ? 920 : 600" persistent scrollable>
      <VCard class="manage-dialog-card" rounded="lg">
        <!-- Enhanced Header -->
        <div class="manage-dialog-header">
          <div class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center gap-3">
              <VAvatar
                :color="manageDialog === 'categories' ? 'primary' : 'secondary'"
                size="48"
                class="elevation-2"
              >
                <VIcon color="white" size="24">
                  {{ manageDialog === 'categories' ? 'mdi-shape-outline' : 'mdi-tag-multiple-outline' }}
                </VIcon>
              </VAvatar>
              <div>
                <h2 class="text-h6 font-weight-bold mb-0">Manage {{ manageDialogTitle }}</h2>
                <span class="text-caption text-medium-emphasis">
                  {{ manageItems.length }} {{ manageItems.length === 1 ? 'item' : 'items' }} total
                </span>
              </div>
            </div>
            <VBtn icon variant="text" density="comfortable" @click="showManageDialog = false">
              <VIcon>mdi-close</VIcon>
            </VBtn>
          </div>

          <!-- Add New Item Section -->
          <div class="add-new-section mx-4 mb-4">
            <VCard variant="tonal" color="primary" rounded="lg">
              <div class="d-flex align-center gap-3 pa-3">
                <VAvatar color="primary" size="36">
                  <VIcon size="20">mdi-plus</VIcon>
                </VAvatar>
                <VTextField
                  v-model="newItemName"
                  :placeholder="`Add new ${manageDialogSingular.toLowerCase()}...`"
                  density="compact"
                  variant="plain"
                  hide-details
                  bg-color="transparent"
                  class="flex-grow-1"
                  @keyup.enter="addNewItem"
                />
                <VBtn
                  color="primary"
                  size="small"
                  variant="elevated"
                  :disabled="!newItemName.trim()"
                  @click="addNewItem"
                >
                  <VIcon start size="18">mdi-plus</VIcon>
                  Add
                </VBtn>
              </div>
            </VCard>
          </div>

          <VDivider />
        </div>

        <!-- Hidden file input for category image upload -->
        <input
          ref="categoryImageInput"
          type="file"
          accept="image/*"
          class="d-none"
          @change="handleCategoryImageUpload"
        />

        <VCardText class="pa-4" style="max-height: 65vh; overflow-y: auto;">
          <!-- Categories Grid View -->
          <div v-if="manageDialog === 'categories'" class="categories-grid">
            <TransitionGroup name="category-list">
              <VCard
                v-for="(item, index) in manageItems"
                :key="item._id"
                :class="['category-card', { 'is-editing': editingItem === item._id }]"
                :elevation="editingItem === item._id ? 8 : 1"
                rounded="lg"
              >
                <!-- View Mode -->
                <template v-if="editingItem !== item._id">
                  <div
                    class="category-banner"
                    :class="[`gradient-${index % 6}`, { 'has-image': item.image_url }]"
                  >
                    <VImg
                      v-if="item.image_url"
                      :key="item.image_url"
                      :src="item.image_url"
                      cover
                      height="100"
                      class="category-img"
                    />
                    <div v-else class="default-banner">
                      <VIcon size="36" color="rgba(255,255,255,0.9)">{{ item.icon || 'mdi-pill' }}</VIcon>
                    </div>
                    <VChip
                      v-if="item.is_system"
                      size="x-small"
                      color="white"
                      variant="flat"
                      class="system-chip"
                    >
                      <VIcon start size="10">mdi-shield-check</VIcon>
                      System
                    </VChip>
                  </div>

                  <div class="category-body pa-3">
                    <div class="d-flex align-center justify-space-between mb-1">
                      <span class="text-subtitle-1 font-weight-bold text-truncate" style="max-width: 140px;">
                        {{ item.name }}
                      </span>
                      <VChip size="x-small" variant="outlined" color="grey">
                        {{ item.code }}
                      </VChip>
                    </div>
                    <p class="text-caption text-medium-emphasis mb-0 category-desc">
                      {{ item.description || 'No description added' }}
                    </p>
                  </div>

                  <VDivider />

                  <div class="category-footer d-flex justify-space-between align-center px-2 py-1">
                    <VChip size="x-small" variant="text" color="grey">
                      <VIcon start size="12">mdi-sort-numeric-ascending</VIcon>
                      {{ item.display_order || 0 }}
                    </VChip>
                    <div class="d-flex">
                      <VBtn
                        icon
                        variant="text"
                        size="x-small"
                        color="primary"
                        @click="startItemEdit(item)"
                      >
                        <VIcon size="18">mdi-pencil-outline</VIcon>
                        <VTooltip activator="parent" location="top">Edit</VTooltip>
                      </VBtn>
                      <VBtn
                        v-if="!item.is_system"
                        icon
                        variant="text"
                        size="x-small"
                        color="error"
                        @click="deleteManageItem(item)"
                      >
                        <VIcon size="18">mdi-delete-outline</VIcon>
                        <VTooltip activator="parent" location="top">Delete</VTooltip>
                      </VBtn>
                    </div>
                  </div>
                </template>

                <!-- Edit Mode -->
                <template v-else>
                  <div class="edit-mode-content">
                    <div class="edit-header px-3 pt-3 pb-2">
                      <VChip size="small" color="primary" variant="flat">
                        <VIcon start size="14">mdi-pencil</VIcon>
                        Editing
                      </VChip>
                    </div>

                    <div class="d-flex gap-4 px-3">
                      <!-- Image Upload Area -->
                      <div
                        class="image-upload-area"
                        :class="{ 'has-image': editingItemImageUrl }"
                        @click="triggerCategoryImageUpload"
                      >
                        <VProgressCircular
                          v-if="uploadingCategoryImage"
                          size="32"
                          width="3"
                          indeterminate
                          color="primary"
                        />
                        <template v-else-if="editingItemImageUrl">
                          <VImg
                            :key="editingItemImageUrl"
                            :src="editingItemImageUrl"
                            cover
                            class="rounded-lg"
                          />
                          <div class="image-overlay">
                            <VIcon color="white" size="24">mdi-camera-outline</VIcon>
                          </div>
                        </template>
                        <div v-else class="upload-placeholder">
                          <VIcon size="28" color="grey-lighten-1">mdi-cloud-upload-outline</VIcon>
                          <span class="text-caption text-grey mt-1">Upload</span>
                        </div>
                      </div>

                      <!-- Form Fields -->
                      <div class="flex-grow-1">
                        <VTextField
                          v-model="editingItemName"
                          label="Category Name"
                          density="compact"
                          variant="outlined"
                          hide-details
                          class="mb-3"
                          @keyup.escape="cancelItemEdit"
                        />
                        <VTextarea
                          v-model="editingItemDescription"
                          label="Description"
                          placeholder="Brief description for patients..."
                          density="compact"
                          variant="outlined"
                          rows="2"
                          hide-details
                          @keyup.escape="cancelItemEdit"
                        />
                      </div>
                    </div>

                    <VDivider class="mt-3" />

                    <div class="d-flex justify-end gap-2 pa-3">
                      <VBtn variant="text" size="small" @click="cancelItemEdit">
                        Cancel
                      </VBtn>
                      <VBtn color="primary" size="small" variant="elevated" @click="saveItemEdit(item)">
                        <VIcon start size="16">mdi-check</VIcon>
                        Save
                      </VBtn>
                    </div>
                  </div>
                </template>
              </VCard>
            </TransitionGroup>
          </div>

          <!-- List View for Non-Categories -->
          <VList v-else class="pa-0" lines="two">
            <TransitionGroup name="list">
              <VListItem
                v-for="item in manageItems"
                :key="item._id"
                :class="{ 'is-editing': editingItem === item._id }"
                class="mb-2 rounded-lg"
                border
              >
                <template #prepend>
                  <VAvatar
                    :color="item.is_system ? 'grey-lighten-3' : 'primary'"
                    :variant="item.is_system ? 'flat' : 'tonal'"
                    size="40"
                  >
                    <VIcon :color="item.is_system ? 'grey' : 'primary'" size="20">
                      {{ item.is_system ? 'mdi-lock-outline' : 'mdi-tag-outline' }}
                    </VIcon>
                  </VAvatar>
                </template>

                <template v-if="editingItem !== item._id">
                  <VListItemTitle class="font-weight-medium">
                    {{ item.name }}
                    <VChip v-if="item.is_system" size="x-small" class="ms-2" variant="tonal" color="grey">
                      System
                    </VChip>
                    <VChip v-if="item.short_code" size="x-small" variant="outlined" class="ms-1">
                      {{ item.short_code }}
                    </VChip>
                  </VListItemTitle>
                  <VListItemSubtitle v-if="item.description">
                    {{ item.description }}
                  </VListItemSubtitle>
                </template>

                <VTextField
                  v-else
                  v-model="editingItemName"
                  density="compact"
                  hide-details
                  variant="outlined"
                  autofocus
                  @keyup.escape="cancelItemEdit"
                  @keyup.enter="saveItemEdit(item)"
                />

                <template #append>
                  <template v-if="editingItem === item._id">
                    <VBtn icon variant="text" color="success" size="small" @click="saveItemEdit(item)">
                      <VIcon>mdi-check</VIcon>
                    </VBtn>
                    <VBtn icon variant="text" size="small" @click="cancelItemEdit">
                      <VIcon>mdi-close</VIcon>
                    </VBtn>
                  </template>
                  <template v-else>
                    <VBtn icon variant="text" size="small" @click="startItemEdit(item)">
                      <VIcon size="20">mdi-pencil-outline</VIcon>
                    </VBtn>
                    <VBtn
                      v-if="!item.is_system"
                      icon
                      variant="text"
                      color="error"
                      size="small"
                      @click="deleteManageItem(item)"
                    >
                      <VIcon size="20">mdi-delete-outline</VIcon>
                    </VBtn>
                  </template>
                </template>
              </VListItem>
            </TransitionGroup>
          </VList>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Receive Stock Dialog -->
    <ReceiveStockDialog
      v-model="receiveStockDialogVisible"
      :preselected-drug="preselectedDrugForReceive"
      @saved="handleStockReceived"
    />

    <!-- Recall Management Dialog -->
    <RecallManagementDialog
      v-model="recallManagementDialogVisible"
      @recalled="fetchInventory"
    />

    <!-- Inventory Reports Dialog -->
    <InventoryReportsDialog v-model="reportsDialogVisible" />

    <!-- Drug Safety Dialog -->
    <DrugSafetyDialog
      v-model="drugSafetyDialogVisible"
      :drug="selectedDrugForSafety"
    />

    <!-- Similar Drugs Dialog -->
    <SimilarDrugsDialog
      v-model="similarDrugsDialogVisible"
      :drug="selectedDrugForSimilar"
    />

    <!-- FDA Safety Sync Stats Dialog -->
    <VDialog v-model="fdaSafetyStatsDialogVisible" max-width="500" @update:model-value="val => val && fetchFdaSafetyStats()">
      <VCard>
        <VCardTitle class="d-flex align-center bg-info">
          <VIcon class="mr-2" color="white">mdi-shield-check</VIcon>
          <span class="text-white">FDA Safety Data Sync</span>
          <VSpacer />
          <VBtn icon variant="text" color="white" @click="fdaSafetyStatsDialogVisible = false">
            <VIcon>mdi-close</VIcon>
          </VBtn>
        </VCardTitle>
        <VCardText class="pt-4">
          <div v-if="loadingFdaStats" class="d-flex justify-center py-6">
            <VProgressCircular indeterminate color="primary" />
          </div>
          <template v-else-if="fdaSafetyStats">
            <VRow>
              <VCol cols="6">
                <VCard variant="tonal" color="primary" class="text-center pa-4">
                  <div class="text-h4 font-weight-bold">{{ fdaSafetyStats.total || 0 }}</div>
                  <div class="text-caption">Total Drugs</div>
                </VCard>
              </VCol>
              <VCol cols="6">
                <VCard variant="tonal" color="success" class="text-center pa-4">
                  <div class="text-h4 font-weight-bold">{{ fdaSafetyStats.synced || 0 }}</div>
                  <div class="text-caption">Synced</div>
                </VCard>
              </VCol>
              <VCol cols="6">
                <VCard variant="tonal" color="warning" class="text-center pa-4">
                  <div class="text-h4 font-weight-bold">{{ fdaSafetyStats.pending || 0 }}</div>
                  <div class="text-caption">Pending</div>
                </VCard>
              </VCol>
              <VCol cols="6">
                <VCard variant="tonal" color="error" class="text-center pa-4">
                  <div class="text-h4 font-weight-bold">{{ fdaSafetyStats.failed || 0 }}</div>
                  <div class="text-caption">Failed</div>
                </VCard>
              </VCol>
              <VCol cols="12">
                <VCard variant="tonal" color="grey" class="text-center pa-4">
                  <div class="text-h4 font-weight-bold">{{ fdaSafetyStats.noData || 0 }}</div>
                  <div class="text-caption">No FDA Data Available</div>
                </VCard>
              </VCol>
            </VRow>
            <VAlert type="info" variant="tonal" class="mt-4" density="compact">
              <div class="text-body-2">
                Safety data is automatically synced daily at 3 AM. Use manual sync to update drugs immediately.
              </div>
            </VAlert>
          </template>
          <VAlert v-else type="info" variant="tonal">
            No sync statistics available yet.
          </VAlert>
        </VCardText>
        <VDivider />
        <VCardActions class="pa-4">
          <VBtn variant="text" @click="fdaSafetyStatsDialogVisible = false">Close</VBtn>
          <VSpacer />
          <VBtn color="primary" :loading="batchSyncing" @click="triggerFdaBatchSync">
            <VIcon start>mdi-sync</VIcon>
            Sync Due Drugs
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Snackbar for notifications -->
    <VSnackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </VSnackbar>

    <!-- Loading Overlay -->
    <VOverlay v-model="loading" class="align-center justify-center" persistent>
      <VProgressCircular indeterminate size="64" color="primary" />
    </VOverlay>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import BatchListPanel from './components/BatchListPanel.vue'
import ReceiveStockDialog from './components/ReceiveStockDialog.vue'
import ExpiryAlertsPanel from './components/ExpiryAlertsPanel.vue'
import RecallManagementDialog from './components/RecallManagementDialog.vue'
import InventoryReportsDialog from './components/InventoryReportsDialog.vue'
import DrugSafetyDialog from './components/DrugSafetyDialog.vue'
import SimilarDrugsDialog from './components/SimilarDrugsDialog.vue'

// Simple debounce utility
const debounce = (fn, delay) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

const loading = ref(false)
const saving = ref(false)
const seeding = ref(false)
const syncing = ref(false)
const generatingPlaceholder = ref(false)
const imageInput = ref(null)

const inventory = ref([])
const categories = ref([])
const classifications = ref([])
const routes = ref([])
const dosageForms = ref([])
const manufacturers = ref([])
const suppliers = ref([])
const pharmacies = ref([])
const currentPage = ref(1)
const totalPages = ref(1)
const itemsPerPage = ref(25)
const searchQuery = ref('')
const categoryFilter = ref(null)
const classificationFilter = ref(null)
const stockFilter = ref(null)
const manufacturerFilter = ref(null)
const supplierFilter = ref(null)
const includeSampleData = ref(true)

const stats = ref({
  totalProducts: 0,
  lowStock: 0,
  outOfStock: 0,
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
})

const showSnackbar = (message, color = 'success') => {
  snackbar.value = { show: true, message, color }
}

const drugDialog = ref(false)
const stockDialog = ref(false)
const deleteDialog = ref(false)
const showManageDialog = ref(false)
const manageDialog = ref('categories')
const manageItems = ref([])
const newItemName = ref('')
const newItemDescription = ref('')
const editingItem = ref(null)
const editingItemName = ref('')
const editingItemDescription = ref('')
const editingItemImageUrl = ref('')
const categoryImageInput = ref(null)
const uploadingCategoryImage = ref(false)

// Batch management state
const expandedDrugs = ref({})
const receiveStockDialogVisible = ref(false)
const preselectedDrugForReceive = ref(null)
const expiryAlertsExpanded = ref([])
const recallManagementDialogVisible = ref(false)
const reportsDialogVisible = ref(false)
const drugSafetyDialogVisible = ref(false)
const selectedDrugForSafety = ref(null)
const similarDrugsDialogVisible = ref(false)
const selectedDrugForSimilar = ref(null)
const fdaSafetyStatsDialogVisible = ref(false)
const fdaSafetyStats = ref(null)
const loadingFdaStats = ref(false)
const batchSyncing = ref(false)

const editingDrug = ref(null)
const selectedDrug = ref(null)
const stockQuantity = ref(1)
const stockAdjustmentType = ref('add')
const stockReason = ref('')

const drugData = reactive({
  name: '',
  generic_name: '',
  brand_name: '',
  manufacturer: null,
  pharmacy_id: null,
  strength: '',
  nafdac_number: '',
  classification: null,
  categories: [],
  dosage_form: null,
  route: null,
  cost_price: 0,
  selling_price: 0,
  discount_percentage: 0,
  quantity: 0,
  reorder_level: 10,
  pack_size: 1,
  short_description: '',
  description: '',
  purchase_type: 'OTC_GENERAL',
  requires_prescription: false,
  requires_pharmacist_approval: false,
  requires_id_verification: false,
  min_age: null,
  max_quantity_per_order: null,
  is_active: true,
  is_available: true,
  is_featured: false,
  images: [],
})

const stockOptions = [
  { title: 'In Stock', value: 'available' },
  { title: 'Low Stock', value: 'low' },
  { title: 'Out of Stock', value: 'out' },
]

const purchaseTypes = [
  { label: 'OTC General', value: 'OTC_GENERAL' },
  { label: 'OTC Restricted', value: 'OTC_RESTRICTED' },
  { label: 'Pharmacy Only', value: 'PHARMACY_ONLY' },
  { label: 'Prescription Only', value: 'PRESCRIPTION_ONLY' },
  { label: 'Controlled Substance', value: 'CONTROLLED' },
]

const manageDialogTitle = computed(() => {
  const titles = {
    'categories': 'Categories',
    'classifications': 'Classifications',
    'routes': 'Drug Routes',
    'dosage-forms': 'Dosage Forms',
    'manufacturers': 'Manufacturers',
  }
  return titles[manageDialog.value] || 'Items'
})

const manageDialogSingular = computed(() => {
  const titles = {
    'categories': 'Category',
    'classifications': 'Classification',
    'routes': 'Route',
    'dosage-forms': 'Dosage Form',
    'manufacturers': 'Manufacturer',
  }
  return titles[manageDialog.value] || 'Item'
})

const getAuthHeaders = () => {
  const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
  return {
    'Authorization': `Bearer ${token.access_token}`,
    'Content-Type': 'application/json',
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price || 0)
}

const getStockColor = (quantity, reorderLevel = 10) => {
  if (quantity <= 0) return 'error'
  if (quantity <= reorderLevel) return 'warning'
  return 'success'
}

const getPrimaryImage = (drug) => {
  if (!drug.images || drug.images.length === 0) return null
  const primary = drug.images.find(img => img.is_primary)
  return primary?.url || drug.images[0]?.url
}

// ============ DRUG CRUD ============

const openAddDialog = () => {
  editingDrug.value = null
  // Set default pharmacy to first one if available
  const defaultPharmacy = pharmacies.value.length > 0 ? pharmacies.value[0]._id : null
  Object.assign(drugData, {
    name: '',
    generic_name: '',
    brand_name: '',
    manufacturer: null,
    pharmacy_id: defaultPharmacy,
    strength: '',
    nafdac_number: '',
    classification: null,
    categories: [],
    dosage_form: null,
    route: null,
    cost_price: 0,
    selling_price: 0,
    discount_percentage: 0,
    quantity: 0,
    reorder_level: 10,
    pack_size: 1,
    short_description: '',
    description: '',
    purchase_type: 'OTC_GENERAL',
    requires_prescription: false,
    requires_pharmacist_approval: false,
    requires_id_verification: false,
    min_age: null,
    max_quantity_per_order: null,
    is_active: true,
    is_available: true,
    is_featured: false,
    images: [],
  })
  drugDialog.value = true
}

const editDrug = (drug) => {
  editingDrug.value = drug._id
  Object.assign(drugData, {
    name: drug.name || '',
    generic_name: drug.generic_name || '',
    brand_name: drug.brand_name || '',
    manufacturer: drug.manufacturer?._id || null,
    pharmacy_id: drug.pharmacy_id?._id || drug.pharmacy_id || null,
    strength: drug.strength || '',
    nafdac_number: drug.nafdac_number || '',
    classification: drug.classification?._id || null,
    categories: drug.categories?.map(c => c._id) || [],
    dosage_form: drug.dosage_form?._id || null,
    route: drug.route?._id || null,
    cost_price: drug.cost_price || 0,
    selling_price: drug.selling_price || 0,
    discount_percentage: drug.discount_percentage || 0,
    quantity: drug.quantity || 0,
    reorder_level: drug.reorder_level || 10,
    pack_size: drug.pack_size || 1,
    short_description: drug.short_description || '',
    description: drug.description || '',
    purchase_type: drug.purchase_type || 'OTC_GENERAL',
    requires_prescription: drug.requires_prescription || false,
    requires_pharmacist_approval: drug.requires_pharmacist_approval || false,
    requires_id_verification: drug.requires_id_verification || false,
    min_age: drug.min_age || null,
    max_quantity_per_order: drug.max_quantity_per_order || null,
    is_active: drug.is_active !== false,
    is_available: drug.is_available !== false,
    is_featured: drug.is_featured || false,
    images: drug.images || [],
  })
  drugDialog.value = true
}

const closeDrugDialog = () => {
  drugDialog.value = false
  editingDrug.value = null
}

const saveDrug = async () => {
  saving.value = true
  try {
    const url = editingDrug.value
      ? `/admin-api/pharmacy/inventory/${editingDrug.value}`
      : '/admin-api/pharmacy/inventory'
    const method = editingDrug.value ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(drugData),
    })

    const data = await response.json()
    if (response.ok) {
      showSnackbar(editingDrug.value ? 'Drug updated successfully' : 'Drug added successfully')
      closeDrugDialog()
      await fetchInventory()
    } else {
      showSnackbar(data.message || 'Failed to save drug', 'error')
    }
  } catch (error) {
    console.error('Error saving drug:', error)
    showSnackbar('Error saving drug', 'error')
  } finally {
    saving.value = false
  }
}

const openStockDialog = (drug) => {
  selectedDrug.value = drug
  stockQuantity.value = 1
  stockAdjustmentType.value = 'add'
  stockReason.value = ''
  stockDialog.value = true
}

const updateStock = async () => {
  saving.value = true
  try {
    const response = await fetch(`/admin-api/pharmacy/inventory/${selectedDrug.value._id}/stock`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        quantity: stockQuantity.value,
        adjustment_type: stockAdjustmentType.value,
        reason: stockReason.value,
      }),
    })

    if (response.ok) {
      showSnackbar('Stock updated successfully')
      stockDialog.value = false
      await fetchInventory()
    } else {
      showSnackbar('Failed to update stock', 'error')
    }
  } catch (error) {
    console.error('Error updating stock:', error)
    showSnackbar('Error updating stock', 'error')
  } finally {
    saving.value = false
  }
}

const confirmDelete = (drug) => {
  selectedDrug.value = drug
  deleteDialog.value = true
}

const deleteDrug = async () => {
  saving.value = true
  try {
    const response = await fetch(`/admin-api/pharmacy/inventory/${selectedDrug.value._id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (response.ok) {
      showSnackbar('Drug deleted successfully')
      deleteDialog.value = false
      await fetchInventory()
    } else {
      showSnackbar('Failed to delete drug', 'error')
    }
  } catch (error) {
    console.error('Error deleting drug:', error)
    showSnackbar('Error deleting drug', 'error')
  } finally {
    saving.value = false
  }
}

// ============ BATCH MANAGEMENT ============

const toggleDrugExpand = (drug) => {
  expandedDrugs.value[drug._id] = !expandedDrugs.value[drug._id]
}

const openReceiveStockDialog = (drug = null) => {
  preselectedDrugForReceive.value = drug
  receiveStockDialogVisible.value = true
}

const handleStockReceived = () => {
  showSnackbar('Stock received successfully')
  fetchInventory()
}

const openDrugSafetyDialog = (drug) => {
  selectedDrugForSafety.value = drug
  drugSafetyDialogVisible.value = true
}

const openSimilarDrugsDialog = (drug) => {
  selectedDrugForSimilar.value = drug
  similarDrugsDialogVisible.value = true
}

// ============ FDA SAFETY SYNC ============

const fetchFdaSafetyStats = async () => {
  loadingFdaStats.value = true
  try {
    const response = await fetch('/admin-api/pharmacy/drugs/admin/safety-stats', {
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    if (response.ok) {
      fdaSafetyStats.value = result.data || result.result
    }
  } catch (error) {
    console.error('Error fetching FDA stats:', error)
    showSnackbar('Error fetching FDA sync statistics', 'error')
  } finally {
    loadingFdaStats.value = false
  }
}

const triggerFdaBatchSync = async () => {
  batchSyncing.value = true
  try {
    const response = await fetch('/admin-api/pharmacy/drugs/admin/safety-sync-batch?batch_size=20', {
      method: 'POST',
      headers: getAuthHeaders(),
    })
    const result = await response.json()
    if (response.ok) {
      const data = result.data || result.result
      showSnackbar(`Batch sync completed: ${data?.success || 0} synced, ${data?.failed || 0} failed`)
      await fetchFdaSafetyStats()
    } else {
      showSnackbar(result.message || 'Failed to trigger batch sync', 'error')
    }
  } catch (error) {
    console.error('Error triggering batch sync:', error)
    showSnackbar('Error triggering FDA batch sync', 'error')
  } finally {
    batchSyncing.value = false
  }
}

// ============ IMAGE HANDLING ============

const triggerImageUpload = () => {
  imageInput.value?.click()
}

const handleImageUpload = async (event) => {
  const files = event.target.files
  if (!files || files.length === 0) return

  const formData = new FormData()
  for (const file of files) {
    formData.append('images', file)
  }

  saving.value = true
  try {
    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch('/admin-api/pharmacy/images/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
      },
      body: formData,
    })

    const data = await response.json()
    console.log('Upload response:', data)
    // Response format: { data: { urls: [...] } } or { result: { urls: [...] } }
    const result = data.data || data.result
    console.log('Extracted result:', result)
    if (response.ok && result && result.urls) {
      const newImages = result.urls.map((url, index) => ({
        url,
        is_primary: drugData.images.length === 0 && index === 0,
        alt_text: '',
      }))
      console.log('New images:', newImages)
      drugData.images = [...drugData.images, ...newImages]
      console.log('drugData.images after:', drugData.images)
      showSnackbar(`${newImages.length} image(s) uploaded successfully`)
    } else {
      showSnackbar(data.message || 'Failed to upload images', 'error')
    }
  } catch (error) {
    console.error('Error uploading images:', error)
    showSnackbar('Error uploading images', 'error')
  } finally {
    saving.value = false
    event.target.value = ''
  }
}

const removeImage = (index) => {
  const wasPrimary = drugData.images[index].is_primary
  drugData.images.splice(index, 1)
  if (wasPrimary && drugData.images.length > 0) {
    drugData.images[0].is_primary = true
  }
}

const setPrimaryImage = (index) => {
  drugData.images.forEach((img, i) => {
    img.is_primary = i === index
  })
}

const generatePlaceholder = async () => {
  if (!drugData.name) {
    showSnackbar('Please enter a drug name first', 'warning')
    return
  }

  generatingPlaceholder.value = true
  try {
    // Get manufacturer name if selected
    let manufacturerName = ''
    if (drugData.manufacturer) {
      const mfr = manufacturers.value.find(m => m._id === drugData.manufacturer)
      if (mfr) manufacturerName = mfr.name
    }

    const response = await fetch('/admin-api/pharmacy/images/generate-placeholder', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: drugData.name,
        strength: drugData.strength || '',
        manufacturer: manufacturerName,
      }),
    })

    const data = await response.json()
    const result = data.data || data.result

    if (response.ok && result && result.url) {
      const newImage = {
        url: result.url,
        is_primary: drugData.images.length === 0,
        alt_text: `${drugData.name} ${drugData.strength || ''} placeholder image`.trim(),
      }
      drugData.images = [...drugData.images, newImage]
      showSnackbar('Placeholder image generated successfully')
    } else {
      showSnackbar(data.message || 'Failed to generate placeholder image', 'error')
    }
  } catch (error) {
    console.error('Error generating placeholder:', error)
    showSnackbar('Error generating placeholder image', 'error')
  } finally {
    generatingPlaceholder.value = false
  }
}

// ============ MANAGE DIALOG ============

const openManageDialog = async () => {
  showManageDialog.value = true
  newItemName.value = ''
  await fetchManageItems()
}

const fetchManageItems = async () => {
  try {
    const response = await fetch(`/admin-api/pharmacy/${manageDialog.value}`, {
      headers: getAuthHeaders(),
    })
    const data = await response.json()
    if (response.ok && data.data) {
      manageItems.value = data.data
    }
  } catch (error) {
    console.error('Error fetching items:', error)
  }
}

const addNewItem = async () => {
  if (!newItemName.value.trim()) return

  try {
    const response = await fetch(`/admin-api/pharmacy/${manageDialog.value}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: newItemName.value.trim() }),
    })

    if (response.ok) {
      showSnackbar(`${manageDialogSingular.value} added successfully`)
      newItemName.value = ''
      await fetchManageItems()
      await fetchAllDropdownData()
    } else {
      const data = await response.json()
      showSnackbar(data.message || 'Failed to add item', 'error')
    }
  } catch (error) {
    console.error('Error adding item:', error)
    showSnackbar('Error adding item', 'error')
  }
}

const deleteManageItem = async (item) => {
  try {
    const response = await fetch(`/admin-api/pharmacy/${manageDialog.value}/${item._id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (response.ok) {
      showSnackbar(`${manageDialogSingular.value} deleted successfully`)
      await fetchManageItems()
      await fetchAllDropdownData()
    } else {
      const data = await response.json()
      showSnackbar(data.message || 'Failed to delete item', 'error')
    }
  } catch (error) {
    console.error('Error deleting item:', error)
    showSnackbar('Error deleting item', 'error')
  }
}

const startItemEdit = (item) => {
  editingItem.value = item._id
  editingItemName.value = item.name
  editingItemDescription.value = item.description || ''
  editingItemImageUrl.value = item.image_url || ''
}

const cancelItemEdit = () => {
  editingItem.value = null
  editingItemName.value = ''
  editingItemDescription.value = ''
  editingItemImageUrl.value = ''
}

const triggerCategoryImageUpload = () => {
  categoryImageInput.value?.click()
}

const handleCategoryImageUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file || !editingItem.value) return

  uploadingCategoryImage.value = true
  try {
    const formData = new FormData()
    formData.append('image', file)

    const token = JSON.parse(localStorage.getItem('accessToken') || '{}')
    const response = await fetch(`/admin-api/pharmacy/categories/${editingItem.value}/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
      },
      body: formData,
    })

    const data = await response.json()
    console.log('Category image upload response:', data)
    const result = data.data || data.result

    if (response.ok && result) {
      // Handle both plain object and Mongoose document formats
      const imageUrl = result.image_url || result._doc?.image_url || ''
      console.log('Extracted image URL:', imageUrl)
      editingItemImageUrl.value = imageUrl
      // Update the item in the list immediately
      const itemIndex = manageItems.value.findIndex(i => i._id === editingItem.value)
      if (itemIndex !== -1) {
        manageItems.value[itemIndex].image_url = imageUrl
      }
      showSnackbar('Category image uploaded successfully')
    } else {
      showSnackbar(data.message || 'Failed to upload image', 'error')
    }
  } catch (error) {
    console.error('Error uploading category image:', error)
    showSnackbar('Error uploading category image', 'error')
  } finally {
    uploadingCategoryImage.value = false
    event.target.value = ''
  }
}

const saveItemEdit = async (item) => {
  if (!editingItemName.value.trim()) {
    showSnackbar('Name cannot be empty', 'error')
    return
  }

  try {
    const payload = { name: editingItemName.value.trim() }
    // Include description for categories
    if (manageDialog.value === 'categories') {
      payload.description = editingItemDescription.value.trim()
    }
    const response = await fetch(`/admin-api/pharmacy/${manageDialog.value}/${item._id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      showSnackbar(`${manageDialogSingular.value} updated successfully`)
      cancelItemEdit()
      await fetchManageItems()
      await fetchAllDropdownData()
    } else {
      const data = await response.json()
      showSnackbar(data.message || 'Failed to update item', 'error')
    }
  } catch (error) {
    console.error('Error updating item:', error)
    showSnackbar('Error updating item', 'error')
  }
}

// ============ SAMPLE DATA ============

const syncInventory = async () => {
  syncing.value = true
  try {
    const response = await fetch('/admin-api/pharmacy/inventory/sync', {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    const result = await response.json()
    if (response.ok) {
      const data = result.result || result.data
      showSnackbar(`Inventory synced: ${data?.updated || 0} drug(s) updated`)
      await fetchInventory()
    } else {
      showSnackbar(result.message || 'Failed to sync inventory', 'error')
    }
  } catch (error) {
    console.error('Error syncing inventory:', error)
    showSnackbar('Error syncing inventory', 'error')
  } finally {
    syncing.value = false
  }
}

const seedSampleData = async () => {
  seeding.value = true
  try {
    const response = await fetch('/admin-api/pharmacy/sample-data/seed', {
      method: 'POST',
      headers: getAuthHeaders(),
    })

    if (response.ok) {
      showSnackbar('Sample data seeded successfully')
      await fetchInventory()
    } else {
      showSnackbar('Failed to seed sample data', 'error')
    }
  } catch (error) {
    console.error('Error seeding data:', error)
    showSnackbar('Error seeding sample data', 'error')
  } finally {
    seeding.value = false
  }
}

const clearSampleData = async () => {
  seeding.value = true
  try {
    const response = await fetch('/admin-api/pharmacy/sample-data', {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })

    if (response.ok) {
      showSnackbar('Sample data cleared successfully')
      await fetchInventory()
    } else {
      showSnackbar('Failed to clear sample data', 'error')
    }
  } catch (error) {
    console.error('Error clearing data:', error)
    showSnackbar('Error clearing sample data', 'error')
  } finally {
    seeding.value = false
  }
}

// ============ DATA FETCHING ============

const fetchInventory = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      limit: itemsPerPage.value,
      includeSampleData: includeSampleData.value,
    })

    if (searchQuery.value) params.append('search', searchQuery.value)
    if (categoryFilter.value) params.append('category', categoryFilter.value)
    if (classificationFilter.value) params.append('classification', classificationFilter.value)
    if (stockFilter.value) params.append('stockStatus', stockFilter.value)
    if (manufacturerFilter.value) params.append('manufacturer', manufacturerFilter.value)
    if (supplierFilter.value) params.append('supplier', supplierFilter.value)

    // Fetch inventory list and summary in parallel
    const [inventoryRes, summaryRes] = await Promise.all([
      fetch(`/admin-api/pharmacy/inventory?${params}`, { headers: getAuthHeaders() }),
      fetch('/admin-api/pharmacy/inventory/summary', { headers: getAuthHeaders() }),
    ])

    const [inventoryData, summaryData] = await Promise.all([
      inventoryRes.json(),
      summaryRes.json(),
    ])

    const invData = inventoryData.result || inventoryData.data
    if (inventoryRes.ok && invData) {
      inventory.value = invData.drugs || invData
      totalPages.value = invData.totalPages || Math.ceil((invData.total || 0) / itemsPerPage.value)
      if (invData.stats) {
        stats.value = {
          ...stats.value,
          ...invData.stats,
        }
      }
    }

    const sumData = summaryData.result || summaryData.data
    if (summaryRes.ok && sumData) {
      stats.value = {
        ...stats.value,
        totalProducts: sumData.total_products,
        activeBatches: sumData.total_batches,
        activeSuppliers: sumData.active_suppliers,
        totalStockValue: sumData.total_stock_value,
        lowStock: sumData.alerts_count?.low_stock || 0,
        outOfStock: sumData.alerts_count?.out_of_stock || 0,
        expiringBatches: (sumData.alerts_count?.expired || 0) + (sumData.alerts_count?.expiring_soon || 0),
      }
    }
  } catch (error) {
    console.error('Error fetching inventory:', error)
  } finally {
    loading.value = false
  }
}

const fetchAllDropdownData = async () => {
  try {
    const [categoriesRes, classificationsRes, routesRes, dosageFormsRes, manufacturersRes, suppliersRes, pharmaciesRes] = await Promise.all([
      fetch('/admin-api/pharmacy/categories', { headers: getAuthHeaders() }),
      fetch('/admin-api/pharmacy/classifications', { headers: getAuthHeaders() }),
      fetch('/admin-api/pharmacy/routes', { headers: getAuthHeaders() }),
      fetch('/admin-api/pharmacy/dosage-forms', { headers: getAuthHeaders() }),
      fetch('/admin-api/pharmacy/manufacturers', { headers: getAuthHeaders() }),
      fetch('/admin-api/pharmacy/suppliers', { headers: getAuthHeaders() }),
      fetch('/admin-api/pharmacy/pharmacies?status=active&limit=100', { headers: getAuthHeaders() }),
    ])

    const [categoriesData, classificationsData, routesData, dosageFormsData, manufacturersData, suppliersData, pharmaciesData] = await Promise.all([
      categoriesRes.json(),
      classificationsRes.json(),
      routesRes.json(),
      dosageFormsRes.json(),
      manufacturersRes.json(),
      suppliersRes.json(),
      pharmaciesRes.json(),
    ])

    if (categoriesRes.ok && categoriesData.data) categories.value = categoriesData.data
    if (classificationsRes.ok && classificationsData.data) classifications.value = classificationsData.data
    if (routesRes.ok && routesData.data) routes.value = routesData.data
    if (dosageFormsRes.ok && dosageFormsData.data) dosageForms.value = dosageFormsData.data
    if (manufacturersRes.ok && manufacturersData.data) manufacturers.value = manufacturersData.data
    // Suppliers endpoint returns paginated result { suppliers: [...], total, totalPages }
    const suppliersResult = suppliersData.result || suppliersData.data
    if (suppliersRes.ok && suppliersResult) {
      suppliers.value = suppliersResult.suppliers || suppliersResult || []
    }
    // Pharmacies endpoint returns paginated result { pharmacies: [...], total, totalPages }
    const pharmaciesResult = pharmaciesData.result || pharmaciesData.data
    if (pharmaciesRes.ok && pharmaciesResult) {
      pharmacies.value = pharmaciesResult.pharmacies || pharmaciesResult || []
    }
  } catch (error) {
    console.error('Error fetching dropdown data:', error)
  }
}

const debouncedSearch = debounce(() => {
  currentPage.value = 1
  fetchInventory()
}, 500)

onMounted(() => {
  fetchInventory()
  fetchAllDropdownData()
})
</script>

<style scoped>
.border-dashed {
  border-style: dashed !important;
}
.border-primary {
  border-color: rgb(var(--v-theme-primary)) !important;
}
.border-2 {
  border-width: 2px !important;
}
.cursor-pointer {
  cursor: pointer;
}
.expanded-row {
  background-color: rgba(var(--v-theme-primary), 0.04);
}
.batch-panel-row {
  background-color: rgba(var(--v-theme-surface-variant), 0.3);
}
.batch-panel-row:hover {
  background-color: rgba(var(--v-theme-surface-variant), 0.3) !important;
}

/* Enhanced Manage Categories Dialog Styles */
.manage-dialog-card {
  overflow: hidden;
}

.manage-dialog-header {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.03) 0%, rgba(var(--v-theme-primary), 0.08) 100%);
}

/* Categories Grid */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.category-card {
  overflow: hidden;
  transition: all 0.3s ease;
}

.category-card:hover {
  transform: translateY(-2px);
}

.category-card.is-editing {
  grid-column: span 2;
}

@media (max-width: 600px) {
  .categories-grid {
    grid-template-columns: 1fr;
  }
  .category-card.is-editing {
    grid-column: span 1;
  }
}

/* Category Banner Gradients */
.category-banner {
  height: 100px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.category-banner.gradient-0 { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.category-banner.gradient-1 { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.category-banner.gradient-2 { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.category-banner.gradient-3 { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.category-banner.gradient-4 { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.category-banner.gradient-5 { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }

.category-banner.has-image {
  background: #f5f5f5;
}

.category-banner .category-img {
  position: absolute;
  inset: 0;
}

.default-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.system-chip {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  backdrop-filter: blur(4px);
  background: rgba(255, 255, 255, 0.9) !important;
  color: #666 !important;
}

.category-body {
  min-height: 70px;
}

.category-desc {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.category-footer {
  background: rgba(0, 0, 0, 0.02);
}

/* Edit Mode Styles */
.edit-mode-content {
  background: linear-gradient(180deg, rgba(var(--v-theme-primary), 0.04) 0%, transparent 100%);
}

.image-upload-area {
  width: 100px;
  height: 100px;
  min-width: 100px;
  border: 2px dashed rgba(var(--v-theme-primary), 0.3);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  background: rgba(var(--v-theme-primary), 0.02);
}

.image-upload-area:hover {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}

.image-upload-area.has-image {
  border: none;
}

.image-upload-area .v-img {
  position: absolute;
  inset: 0;
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.image-upload-area:hover .image-overlay {
  opacity: 1;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Transitions */
.category-list-enter-active,
.category-list-leave-active {
  transition: all 0.3s ease;
}

.category-list-enter-from,
.category-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
