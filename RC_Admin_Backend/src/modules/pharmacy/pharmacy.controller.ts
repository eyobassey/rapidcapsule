import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PharmacyService } from './pharmacy.service';
import { OpenFDAService } from './services/openfda.service';
import { Types } from 'mongoose';
import { CreateDrugCategoryDto, UpdateDrugCategoryDto } from './dto/drug-category.dto';
import { CreateDrugClassificationDto, UpdateDrugClassificationDto } from './dto/drug-classification.dto';
import { CreateDrugRouteDto, UpdateDrugRouteDto } from './dto/drug-route.dto';
import { CreateDosageFormDto, UpdateDosageFormDto } from './dto/dosage-form.dto';
import { CreateManufacturerDto, UpdateManufacturerDto } from './dto/manufacturer.dto';
import { CreateDrugDto, UpdateDrugDto, UpdateDrugStockDto } from './dto/drug.dto';
import { DeleteDrugImageDto } from './dto/drug-image.dto';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  ChangeSupplierStatusDto,
  SupplierQueryDto,
} from './dto/supplier.dto';
import {
  ReceiveStockDto,
  UpdateBatchDto,
  ChangeBatchStatusDto,
  AdjustBatchStockDto,
  ReturnToSupplierDto,
  WriteOffBatchDto,
  RecallBatchDto,
  DispenseStockDto,
  BatchQueryDto,
} from './dto/stock-batch.dto';
import { TransactionQueryDto } from './dto/stock-transaction.dto';
import { InventoryReportQueryDto } from './dto/inventory-report.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';

@Controller('pharmacy')
@UseGuards(JwtAuthGuard)
export class PharmacyController {
  constructor(
    private readonly pharmacyService: PharmacyService,
    private readonly openFDAService: OpenFDAService,
  ) {}

  // ============ CATEGORIES ============

  @Get('categories')
  async getCategories(@Query('includeInactive') includeInactive: string) {
    const categories = await this.pharmacyService.getCategories(includeInactive === 'true');
    return sendSuccessResponse('Categories retrieved successfully', categories);
  }

  @Get('categories/:id')
  async getCategoryById(@Param('id') id: string) {
    const category = await this.pharmacyService.getCategoryById(id);
    return sendSuccessResponse('Category retrieved successfully', category);
  }

  @Post('categories')
  async createCategory(@Body() dto: CreateDrugCategoryDto, @Req() req) {
    const category = await this.pharmacyService.createCategory(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Category created successfully', category);
  }

  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateDrugCategoryDto) {
    const category = await this.pharmacyService.updateCategory(id, dto);
    return sendSuccessResponse('Category updated successfully', category);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteCategory(id);
    return sendSuccessResponse('Category deleted successfully', result);
  }

  @Post('categories/:id/image')
  @UseInterceptors(
    FilesInterceptor('image', 1, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
    }),
  )
  async uploadCategoryImage(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const file = files?.[0];
    if (!file) {
      throw new Error('No file uploaded');
    }
    const result = await this.pharmacyService.uploadCategoryImage(id, file);
    return sendSuccessResponse('Category image uploaded successfully', result);
  }

  // ============ CLASSIFICATIONS ============

  @Get('classifications')
  async getClassifications(@Query('includeInactive') includeInactive: string) {
    const classifications = await this.pharmacyService.getClassifications(includeInactive === 'true');
    return sendSuccessResponse('Classifications retrieved successfully', classifications);
  }

  @Get('classifications/:id')
  async getClassificationById(@Param('id') id: string) {
    const classification = await this.pharmacyService.getClassificationById(id);
    return sendSuccessResponse('Classification retrieved successfully', classification);
  }

  @Post('classifications')
  async createClassification(@Body() dto: CreateDrugClassificationDto, @Req() req) {
    const classification = await this.pharmacyService.createClassification(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Classification created successfully', classification);
  }

  @Patch('classifications/:id')
  async updateClassification(@Param('id') id: string, @Body() dto: UpdateDrugClassificationDto) {
    const classification = await this.pharmacyService.updateClassification(id, dto);
    return sendSuccessResponse('Classification updated successfully', classification);
  }

  @Delete('classifications/:id')
  async deleteClassification(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteClassification(id);
    return sendSuccessResponse('Classification deleted successfully', result);
  }

  // ============ ROUTES ============

  @Get('routes')
  async getRoutes(@Query('includeInactive') includeInactive: string) {
    const routes = await this.pharmacyService.getRoutes(includeInactive === 'true');
    return sendSuccessResponse('Routes retrieved successfully', routes);
  }

  @Get('routes/:id')
  async getRouteById(@Param('id') id: string) {
    const route = await this.pharmacyService.getRouteById(id);
    return sendSuccessResponse('Route retrieved successfully', route);
  }

  @Post('routes')
  async createRoute(@Body() dto: CreateDrugRouteDto, @Req() req) {
    const route = await this.pharmacyService.createRoute(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Route created successfully', route);
  }

  @Patch('routes/:id')
  async updateRoute(@Param('id') id: string, @Body() dto: UpdateDrugRouteDto) {
    const route = await this.pharmacyService.updateRoute(id, dto);
    return sendSuccessResponse('Route updated successfully', route);
  }

  @Delete('routes/:id')
  async deleteRoute(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteRoute(id);
    return sendSuccessResponse('Route deleted successfully', result);
  }

  // ============ DOSAGE FORMS ============

  @Get('dosage-forms')
  async getDosageForms(@Query('includeInactive') includeInactive: string) {
    const forms = await this.pharmacyService.getDosageForms(includeInactive === 'true');
    return sendSuccessResponse('Dosage forms retrieved successfully', forms);
  }

  @Get('dosage-forms/:id')
  async getDosageFormById(@Param('id') id: string) {
    const form = await this.pharmacyService.getDosageFormById(id);
    return sendSuccessResponse('Dosage form retrieved successfully', form);
  }

  @Post('dosage-forms')
  async createDosageForm(@Body() dto: CreateDosageFormDto, @Req() req) {
    const form = await this.pharmacyService.createDosageForm(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Dosage form created successfully', form);
  }

  @Patch('dosage-forms/:id')
  async updateDosageForm(@Param('id') id: string, @Body() dto: UpdateDosageFormDto) {
    const form = await this.pharmacyService.updateDosageForm(id, dto);
    return sendSuccessResponse('Dosage form updated successfully', form);
  }

  @Delete('dosage-forms/:id')
  async deleteDosageForm(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteDosageForm(id);
    return sendSuccessResponse('Dosage form deleted successfully', result);
  }

  // ============ MANUFACTURERS ============

  @Get('manufacturers')
  async getManufacturers(@Query('includeInactive') includeInactive: string) {
    const manufacturers = await this.pharmacyService.getManufacturers(includeInactive === 'true');
    return sendSuccessResponse('Manufacturers retrieved successfully', manufacturers);
  }

  @Get('manufacturers/:id')
  async getManufacturerById(@Param('id') id: string) {
    const manufacturer = await this.pharmacyService.getManufacturerById(id);
    return sendSuccessResponse('Manufacturer retrieved successfully', manufacturer);
  }

  @Post('manufacturers')
  async createManufacturer(@Body() dto: CreateManufacturerDto, @Req() req) {
    const manufacturer = await this.pharmacyService.createManufacturer(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Manufacturer created successfully', manufacturer);
  }

  @Patch('manufacturers/:id')
  async updateManufacturer(@Param('id') id: string, @Body() dto: UpdateManufacturerDto) {
    const manufacturer = await this.pharmacyService.updateManufacturer(id, dto);
    return sendSuccessResponse('Manufacturer updated successfully', manufacturer);
  }

  @Delete('manufacturers/:id')
  async deleteManufacturer(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteManufacturer(id);
    return sendSuccessResponse('Manufacturer deleted successfully', result);
  }

  // ============ SUPPLIERS ============

  @Get('suppliers')
  async getSuppliers(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('status') status: string,
    @Query('category') category: string,
    @Query('includeInactive') includeInactive: string,
    @Query('licenseExpiringSoon') licenseExpiringSoon: string,
  ) {
    const result = await this.pharmacyService.getSuppliers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
      search,
      status: status as any,
      category,
      includeInactive: includeInactive === 'true',
      licenseExpiringSoon: licenseExpiringSoon === 'true',
    });
    return sendSuccessResponse('Suppliers retrieved successfully', result);
  }

  @Get('suppliers/:id')
  async getSupplierById(@Param('id') id: string) {
    const supplier = await this.pharmacyService.getSupplierById(id);
    return sendSuccessResponse('Supplier retrieved successfully', supplier);
  }

  @Post('suppliers')
  async createSupplier(@Body() dto: CreateSupplierDto, @Req() req) {
    const supplier = await this.pharmacyService.createSupplier(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Supplier created successfully', supplier);
  }

  @Patch('suppliers/:id')
  async updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto, @Req() req) {
    const supplier = await this.pharmacyService.updateSupplier(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Supplier updated successfully', supplier);
  }

  @Patch('suppliers/:id/status')
  async changeSupplierStatus(@Param('id') id: string, @Body() dto: ChangeSupplierStatusDto, @Req() req) {
    const supplier = await this.pharmacyService.changeSupplierStatus(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Supplier status updated successfully', supplier);
  }

  @Post('suppliers/:id/verify-license')
  async verifySupplierLicense(
    @Param('id') id: string,
    @Body() body: { is_verified: boolean },
    @Req() req,
  ) {
    const supplier = await this.pharmacyService.verifySupplierLicense(id, body.is_verified, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Supplier license verification updated', supplier);
  }

  @Delete('suppliers/:id')
  async deleteSupplier(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteSupplier(id);
    return sendSuccessResponse('Supplier deleted successfully', result);
  }

  // ============ STOCK BATCHES ============

  @Post('batches/receive')
  async receiveStock(@Body() dto: ReceiveStockDto, @Req() req) {
    const userId = req.user?.sub || req.user?._id;
    const batch = await this.pharmacyService.receiveStock(dto, userId);
    return sendSuccessResponse('Stock received successfully', batch);
  }

  @Get('batches')
  async getBatches(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('drug_id') drug_id: string,
    @Query('supplier_id') supplier_id: string,
    @Query('status') status: string,
    @Query('batch_number') batch_number: string,
    @Query('hasStock') hasStock: string,
    @Query('expiringWithinDays') expiringWithinDays: string,
    @Query('expired') expired: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
  ) {
    const result = await this.pharmacyService.getBatches({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
      drug_id,
      supplier_id,
      status: status as any,
      batch_number,
      hasStock: hasStock === 'true',
      expiringWithinDays: expiringWithinDays ? parseInt(expiringWithinDays) : undefined,
      expired: expired === 'true',
      sortBy,
      sortOrder: sortOrder as any,
    });
    return sendSuccessResponse('Batches retrieved successfully', result);
  }

  @Get('batches/expiring')
  async getExpiringBatches(@Query('days') days: string) {
    const batches = await this.pharmacyService.getExpiringBatches(parseInt(days) || 90);
    return sendSuccessResponse('Expiring batches retrieved successfully', batches);
  }

  @Get('batches/expired')
  async getExpiredBatches() {
    const batches = await this.pharmacyService.getExpiredBatches();
    return sendSuccessResponse('Expired batches retrieved successfully', batches);
  }

  @Get('batches/:id')
  async getBatchById(@Param('id') id: string) {
    const batch = await this.pharmacyService.getBatchById(id);
    return sendSuccessResponse('Batch retrieved successfully', batch);
  }

  @Patch('batches/:id')
  async updateBatch(@Param('id') id: string, @Body() dto: UpdateBatchDto, @Req() req) {
    const batch = await this.pharmacyService.updateBatch(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Batch updated successfully', batch);
  }

  @Delete('batches/:id')
  async deleteBatch(@Param('id') id: string, @Req() req) {
    const result = await this.pharmacyService.deleteBatch(id, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Batch deleted successfully', result);
  }

  @Patch('batches/:id/status')
  async changeBatchStatus(@Param('id') id: string, @Body() dto: ChangeBatchStatusDto, @Req() req) {
    const batch = await this.pharmacyService.changeBatchStatus(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Batch status updated successfully', batch);
  }

  @Post('batches/:id/adjust')
  async adjustBatchStock(@Param('id') id: string, @Body() dto: AdjustBatchStockDto, @Req() req) {
    const batch = await this.pharmacyService.adjustBatchStock(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Batch stock adjusted successfully', batch);
  }

  @Post('batches/:id/return')
  async returnToSupplier(@Param('id') id: string, @Body() dto: ReturnToSupplierDto, @Req() req) {
    const batch = await this.pharmacyService.returnToSupplier(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Stock returned to supplier successfully', batch);
  }

  @Post('batches/:id/writeoff')
  async writeOffBatch(@Param('id') id: string, @Body() dto: WriteOffBatchDto, @Req() req) {
    const batch = await this.pharmacyService.writeOffBatch(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Batch written off successfully', batch);
  }

  @Post('batches/:id/recall')
  async recallBatch(@Param('id') id: string, @Body() dto: RecallBatchDto, @Req() req) {
    const batch = await this.pharmacyService.recallBatch(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Batch recalled successfully', batch);
  }

  // ============ DRUG-SPECIFIC STOCK ============

  @Get('drugs/:drugId/batches')
  async getDrugBatches(
    @Param('drugId') drugId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status: string,
    @Query('hasStock') hasStock: string,
  ) {
    const result = await this.pharmacyService.getDrugBatches(drugId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
      status: status as any,
      hasStock: hasStock === 'true',
    });
    return sendSuccessResponse('Drug batches retrieved successfully', result);
  }

  @Get('drugs/:drugId/stock')
  async getDrugStockInfo(@Param('drugId') drugId: string) {
    const stockInfo = await this.pharmacyService.getDrugStockInfo(drugId);
    return sendSuccessResponse('Drug stock info retrieved successfully', stockInfo);
  }

  @Get('drugs/:drugId/fefo-preview')
  async getFefoPreview(
    @Param('drugId') drugId: string,
    @Query('quantity') quantity: string,
  ) {
    const preview = await this.pharmacyService.selectBatchesForDispensing(
      drugId,
      parseInt(quantity) || 1,
    );
    return sendSuccessResponse('FEFO preview generated successfully', preview);
  }

  // ============ DISPENSING ============

  @Post('dispense')
  async dispenseStock(@Body() dto: DispenseStockDto, @Req() req) {
    const result = await this.pharmacyService.dispenseStock(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Stock dispensed successfully', result);
  }

  // ============ TRANSACTIONS ============

  @Get('transactions')
  async getTransactions(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('drug_id') drug_id: string,
    @Query('batch_id') batch_id: string,
    @Query('supplier_id') supplier_id: string,
    @Query('type') type: string,
    @Query('reference_type') reference_type: string,
    @Query('reference_number') reference_number: string,
    @Query('from_date') from_date: string,
    @Query('to_date') to_date: string,
    @Query('excludeReversed') excludeReversed: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
  ) {
    const result = await this.pharmacyService.getTransactions({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
      drug_id,
      batch_id,
      supplier_id,
      type: type as any,
      reference_type: reference_type as any,
      reference_number,
      from_date: from_date ? new Date(from_date) : undefined,
      to_date: to_date ? new Date(to_date) : undefined,
      excludeReversed: excludeReversed === 'true',
      sortBy,
      sortOrder: sortOrder as any,
    });
    return sendSuccessResponse('Transactions retrieved successfully', result);
  }

  @Get('transactions/:id')
  async getTransactionById(@Param('id') id: string) {
    const transaction = await this.pharmacyService.getTransactionById(id);
    return sendSuccessResponse('Transaction retrieved successfully', transaction);
  }

  @Get('drugs/:drugId/transactions')
  async getDrugTransactions(
    @Param('drugId') drugId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const result = await this.pharmacyService.getDrugTransactions(drugId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
    });
    return sendSuccessResponse('Drug transactions retrieved successfully', result);
  }

  @Get('batches/:batchId/transactions')
  async getBatchTransactions(
    @Param('batchId') batchId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const result = await this.pharmacyService.getBatchTransactions(batchId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
    });
    return sendSuccessResponse('Batch transactions retrieved successfully', result);
  }

  // ============ INVENTORY ALERTS & SUMMARY ============

  @Get('inventory/alerts')
  async getInventoryAlerts() {
    const alerts = await this.pharmacyService.getInventoryAlerts();
    return sendSuccessResponse('Inventory alerts retrieved successfully', alerts);
  }

  @Get('inventory/summary')
  async getInventorySummary() {
    const summary = await this.pharmacyService.getInventorySummary();
    return sendSuccessResponse('Inventory summary retrieved successfully', summary);
  }

  @Get('dashboard')
  async getPharmacyDashboard() {
    const summary = await this.pharmacyService.getInventorySummary();
    const alerts = await this.pharmacyService.getInventoryAlerts();

    // Transform to dashboard format expected by frontend
    const dashboardData = {
      stats: {
        totalProducts: summary.total_products,
        totalBatches: summary.total_batches,
        totalStockValue: summary.total_stock_value,
        activeSuppliers: summary.active_suppliers,
        expiredItems: summary.alerts_count.expired,
        expiringSoon: summary.alerts_count.expiring_soon,
        lowStock: summary.alerts_count.low_stock,
        outOfStock: summary.alerts_count.out_of_stock,
      },
      recentOrders: [], // Placeholder - orders not yet implemented
      lowStockItems: alerts.low_stock || [],
    };

    return sendSuccessResponse('Dashboard data retrieved successfully', dashboardData);
  }

  // ============ IMAGE UPLOAD ============

  @Post('images/upload')
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
      },
    }),
  )
  async uploadDrugImages(@UploadedFiles() files: Express.Multer.File[]) {
    const result = await this.pharmacyService.uploadDrugImages(files);
    return sendSuccessResponse('Images uploaded successfully', result);
  }

  @Delete('images')
  async deleteDrugImage(@Body() dto: DeleteDrugImageDto) {
    const result = await this.pharmacyService.deleteDrugImage(dto.image_url);
    return sendSuccessResponse('Image deleted successfully', result);
  }

  @Post('inventory/:id/generate-placeholder-image')
  async generatePlaceholderImage(@Param('id') id: string) {
    const result = await this.pharmacyService.generatePlaceholderImage(id);
    return sendSuccessResponse('Placeholder image generated successfully', result);
  }

  @Post('images/generate-placeholder')
  async generatePlaceholderImageFromData(
    @Body() body: { name: string; strength?: string; manufacturer?: string },
  ) {
    const result = await this.pharmacyService.generatePlaceholderImageFromData(body);
    return sendSuccessResponse('Placeholder image generated successfully', result);
  }

  // ============ DRUGS / INVENTORY ============

  @Get('inventory')
  async getDrugs(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('classification') classification: string,
    @Query('category') category: string,
    @Query('manufacturer') manufacturer: string,
    @Query('supplier') supplier: string,
    @Query('stockStatus') stockStatus: string,
    @Query('includeInactive') includeInactive: string,
    @Query('includeSampleData') includeSampleData: string,
  ) {
    const result = await this.pharmacyService.getDrugs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
      search,
      classification,
      category,
      manufacturer,
      supplier,
      stockStatus: stockStatus as any,
      includeInactive: includeInactive === 'true',
      includeSampleData: includeSampleData === 'true',
    });
    return sendSuccessResponse('Drugs retrieved successfully', result);
  }

  // Sync routes must come BEFORE :id routes to avoid being matched as id parameter
  @Post('inventory/sync')
  async syncAllDrugQuantities() {
    const result = await this.pharmacyService.syncAllDrugQuantities();
    return sendSuccessResponse('Drug quantities synced successfully', result);
  }

  @Get('inventory/debug-batches')
  async debugBatches() {
    const result = await this.pharmacyService.debugBatchStatus();
    return sendSuccessResponse('Batch debug info', result);
  }

  @Post('inventory/:id/sync')
  async syncDrugQuantity(@Param('id') id: string) {
    const result = await this.pharmacyService.syncSingleDrugQuantity(id);
    return sendSuccessResponse('Drug quantity synced successfully', result);
  }

  @Get('inventory/:id')
  async getDrugById(@Param('id') id: string) {
    const drug = await this.pharmacyService.getDrugById(id);
    return sendSuccessResponse('Drug retrieved successfully', drug);
  }

  @Post('inventory')
  async createDrug(@Body() dto: CreateDrugDto, @Req() req) {
    const drug = await this.pharmacyService.createDrug(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Drug created successfully', drug);
  }

  @Patch('inventory/:id')
  async updateDrug(@Param('id') id: string, @Body() dto: UpdateDrugDto, @Req() req) {
    const drug = await this.pharmacyService.updateDrug(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Drug updated successfully', drug);
  }

  @Patch('inventory/:id/stock')
  async updateDrugStock(@Param('id') id: string, @Body() dto: UpdateDrugStockDto) {
    const drug = await this.pharmacyService.updateDrugStock(id, dto);
    return sendSuccessResponse('Drug stock updated successfully', drug);
  }

  @Delete('inventory/:id')
  async deleteDrug(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteDrug(id);
    return sendSuccessResponse('Drug deleted successfully', result);
  }

  @Post('inventory/:id/images')
  async addDrugImages(
    @Param('id') id: string,
    @Body() body: { images: { url: string; is_primary?: boolean; alt_text?: string }[] },
  ) {
    const drug = await this.pharmacyService.addDrugImages(id, body.images);
    return sendSuccessResponse('Drug images added successfully', drug);
  }

  @Delete('inventory/:id/images')
  async removeDrugImage(@Param('id') id: string, @Body() body: { image_url: string }) {
    const drug = await this.pharmacyService.removeDrugImage(id, body.image_url);
    return sendSuccessResponse('Drug image removed successfully', drug);
  }

  @Patch('inventory/:id/images/primary')
  async setPrimaryImage(@Param('id') id: string, @Body() body: { image_url: string }) {
    const drug = await this.pharmacyService.setPrimaryImage(id, body.image_url);
    return sendSuccessResponse('Primary image set successfully', drug);
  }

  // ============ INVENTORY REPORTS ============

  @Get('reports/stock-valuation')
  async getStockValuationReport(@Query() query: InventoryReportQueryDto) {
    const report = await this.pharmacyService.getStockValuationReport(query);
    return sendSuccessResponse('Stock valuation report generated successfully', report);
  }

  @Get('reports/expiry-batch')
  async getExpiryBatchReport(@Query() query: InventoryReportQueryDto) {
    const report = await this.pharmacyService.getExpiryBatchReport(query);
    return sendSuccessResponse('Expiry and batch report generated successfully', report);
  }

  @Get('reports/transactions')
  async getTransactionReport(@Query() query: InventoryReportQueryDto) {
    const report = await this.pharmacyService.getTransactionReport(query);
    return sendSuccessResponse('Transaction report generated successfully', report);
  }

  @Get('reports/manufacturers')
  async getManufacturersForReports() {
    const manufacturers = await this.pharmacyService.getManufacturersForReports();
    return sendSuccessResponse('Manufacturers retrieved successfully', manufacturers);
  }

  // ============ SAMPLE DATA ============

  @Post('sample-data/seed')
  async seedSampleDrugs() {
    const result = await this.pharmacyService.seedSampleDrugs();
    return sendSuccessResponse('Sample drugs seeded successfully', result);
  }

  @Delete('sample-data')
  async clearSampleDrugs() {
    const result = await this.pharmacyService.clearSampleDrugs();
    return sendSuccessResponse('Sample drugs cleared successfully', result);
  }

  // ============ INITIALIZATION ============

  @Post('initialize')
  async initializeAllData() {
    await this.pharmacyService.initializeAllData();
    return sendSuccessResponse('All pharmacy data initialized successfully', null);
  }

  // ============ PRESCRIPTIONS ============

  @Get('prescriptions')
  async getPrescriptions(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('status') status: string,
    @Query('date') date: string,
  ) {
    const result = await this.pharmacyService.getPrescriptions({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
      search,
      status,
      date,
    });
    return sendSuccessResponse('Prescriptions retrieved successfully', result);
  }

  // ============ PRESCRIPTION REVIEW SYSTEM ============
  // NOTE: These static routes MUST come before the :id parameter route

  /**
   * Get prescriptions pending pharmacist review
   */
  @Get('prescriptions/pending-review')
  async getPrescriptionsPendingReview(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('priority') priority: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
  ) {
    const result = await this.pharmacyService.getPrescriptionsPendingReview({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
      priority: priority as any,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });
    return sendSuccessResponse('Pending review prescriptions retrieved successfully', result);
  }

  /**
   * Get count of prescriptions in review queue
   */
  @Get('prescriptions/review-queue-count')
  async getReviewQueueCount() {
    const result = await this.pharmacyService.getReviewQueueCount();
    return sendSuccessResponse('Review queue count retrieved successfully', result);
  }

  /**
   * Get prescriptions awaiting clarification from patient
   */
  @Get('prescriptions/awaiting-clarification')
  async getPrescriptionsAwaitingClarification(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
  ) {
    const result = await this.pharmacyService.getPrescriptionsAwaitingClarification({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });
    return sendSuccessResponse('Awaiting clarification prescriptions retrieved successfully', result);
  }

  // Dynamic :id routes come after static routes
  @Get('prescriptions/:id')
  async getPrescriptionById(@Param('id') id: string) {
    const prescription = await this.pharmacyService.getPrescriptionById(id);
    return sendSuccessResponse('Prescription retrieved successfully', prescription);
  }

  @Get('prescriptions/:id/pdf')
  async getPrescriptionPdf(@Param('id') id: string) {
    const result = await this.pharmacyService.getPrescriptionPdfUrl(id);
    return sendSuccessResponse('PDF URL retrieved successfully', result);
  }

  @Patch('prescriptions/:id/status')
  async updatePrescriptionStatus(
    @Param('id') id: string,
    @Body() body: { status: string; rejection_reason?: string },
  ) {
    const result = await this.pharmacyService.updatePrescriptionStatus(id, body.status, body.rejection_reason);
    return sendSuccessResponse('Prescription status updated successfully', result);
  }

  /**
   * Get detailed prescription info for pharmacist review
   */
  @Get('prescriptions/:id/review-details')
  async getPrescriptionReviewDetails(@Param('id') id: string) {
    const result = await this.pharmacyService.getPrescriptionReviewDetails(id);
    return sendSuccessResponse('Prescription review details retrieved successfully', result);
  }

  /**
   * Review and approve/reject a prescription
   */
  @Post('prescriptions/:id/review')
  async reviewPrescription(
    @Param('id') id: string,
    @Body() body: {
      decision: 'APPROVED' | 'REJECTED';
      review_notes?: string;
      rejection_reason?: string;
      valid_until?: string;
    },
    @Req() req,
  ) {
    const reviewerId = req.user?.sub || req.user?._id;
    const result = await this.pharmacyService.reviewPrescription(
      id,
      reviewerId,
      body.decision,
      {
        review_notes: body.review_notes,
        rejection_reason: body.rejection_reason,
        valid_until: body.valid_until ? new Date(body.valid_until) : undefined,
      },
    );
    return sendSuccessResponse(
      body.decision === 'APPROVED'
        ? 'Prescription approved successfully'
        : 'Prescription rejected',
      result,
    );
  }

  /**
   * Request clarification from patient
   */
  @Post('prescriptions/:id/request-clarification')
  async requestClarification(
    @Param('id') id: string,
    @Body() body: {
      request_message: string;
      required_information?: string[];
      response_deadline_days?: number;
    },
    @Req() req,
  ) {
    const requesterId = req.user?.sub || req.user?._id;
    const result = await this.pharmacyService.requestClarification(
      id,
      requesterId,
      body,
    );
    return sendSuccessResponse('Clarification request sent successfully', result);
  }

  // ============ INVENTORY CHECK ============

  @Get('prescriptions/:id/inventory-check')
  async checkPrescriptionInventory(@Param('id') id: string) {
    const result = await this.pharmacyService.checkPrescriptionInventory(id);
    return sendSuccessResponse('Inventory check completed', result);
  }

  @Post('prescriptions/:id/reserve-stock')
  async reserveStockForPrescription(
    @Param('id') id: string,
    @Req() req,
  ) {
    const userId = req.user?.sub || req.user?._id;
    const result = await this.pharmacyService.reserveStockForPrescription(id, userId);
    return sendSuccessResponse('Stock reservation completed', result);
  }

  @Post('prescriptions/:id/release-stock')
  async releaseStockReservation(@Param('id') id: string) {
    const result = await this.pharmacyService.releaseStockReservation(id);
    return sendSuccessResponse('Stock reservation released', result);
  }

  // ============ ORDERS ============

  @Get('orders')
  async getOrders(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('status') status: string,
    @Query('delivery_type') delivery_type: string,
  ) {
    const result = await this.pharmacyService.getOrders({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 25,
      search,
      status,
      delivery_type,
    });
    return sendSuccessResponse('Orders retrieved successfully', result);
  }

  @Get('orders/:id')
  async getOrderById(@Param('id') id: string) {
    const order = await this.pharmacyService.getOrderById(id);
    return sendSuccessResponse('Order retrieved successfully', order);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req,
  ) {
    const order = await this.pharmacyService.updateOrderStatus(
      id,
      body.status,
      req.user?.sub || req.user?._id,
    );
    return sendSuccessResponse('Order status updated successfully', order);
  }

  @Patch('orders/:id/fill')
  async fillOrderMedications(
    @Param('id') id: string,
    @Req() req,
  ) {
    const order = await this.pharmacyService.fillOrderMedications(
      id,
      req.user?.sub || req.user?._id,
    );
    return sendSuccessResponse('Order medications filled successfully', order);
  }

  // ============ PHARMACY MANAGEMENT ============

  @Get('pharmacies')
  async getPharmacies(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('verification_status') verification_status?: string,
    @Query('state') state?: string,
    @Query('is_online') is_online?: string,
    @Query('is_pickup_center') is_pickup_center?: string,
  ) {
    const result = await this.pharmacyService.getPharmacies({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
      search,
      verification_status,
      state,
      is_online: is_online === 'true' ? true : is_online === 'false' ? false : undefined,
      is_pickup_center: is_pickup_center === 'true' ? true : is_pickup_center === 'false' ? false : undefined,
    });
    return sendSuccessResponse('Pharmacies retrieved successfully', result);
  }

  @Get('pharmacies/stats')
  async getPharmacyStats() {
    const stats = await this.pharmacyService.getPharmacyStats();
    return sendSuccessResponse('Pharmacy stats retrieved successfully', stats);
  }

  @Get('pharmacies/pickup-centers')
  async getPickupCenters(
    @Query('state') state?: string,
    @Query('city') city?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radius') radius?: string,
  ) {
    const result = await this.pharmacyService.getPickupCenters({
      state,
      city,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radius: radius ? parseFloat(radius) : undefined,
    });
    return sendSuccessResponse('Pickup centers retrieved successfully', result);
  }

  @Post('pharmacies/generate-slugs')
  async generateSlugsForPharmacies() {
    const result = await this.pharmacyService.generateSlugsForExistingPharmacies();
    return sendSuccessResponse('Slugs generated successfully', result);
  }

  @Get('pharmacies/:id')
  async getPharmacyById(@Param('id') id: string) {
    const pharmacy = await this.pharmacyService.getPharmacyById(id);
    return sendSuccessResponse('Pharmacy retrieved successfully', pharmacy);
  }

  @Post('pharmacies')
  async createPharmacy(@Body() body: any) {
    const pharmacy = await this.pharmacyService.createPharmacy(body);
    return sendSuccessResponse('Pharmacy created successfully', pharmacy);
  }

  @Patch('pharmacies/:id')
  async updatePharmacy(@Param('id') id: string, @Body() body: any) {
    const pharmacy = await this.pharmacyService.updatePharmacy(id, body);
    return sendSuccessResponse('Pharmacy updated successfully', pharmacy);
  }

  @Patch('pharmacies/:id/verify')
  async verifyPharmacy(
    @Param('id') id: string,
    @Body() body: { verification_status: string; verification_notes?: string },
    @Req() req,
  ) {
    const pharmacy = await this.pharmacyService.verifyPharmacy(
      id,
      body,
      req.user?.sub || req.user?._id,
    );
    return sendSuccessResponse('Pharmacy verification updated successfully', pharmacy);
  }

  @Patch('pharmacies/:id/suspend')
  async suspendPharmacy(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req,
  ) {
    const pharmacy = await this.pharmacyService.suspendPharmacy(
      id,
      body.reason,
      req.user?.sub || req.user?._id,
    );
    return sendSuccessResponse('Pharmacy suspended successfully', pharmacy);
  }

  @Patch('pharmacies/:id/reactivate')
  async reactivatePharmacy(@Param('id') id: string, @Req() req) {
    const pharmacy = await this.pharmacyService.reactivatePharmacy(
      id,
      req.user?.sub || req.user?._id,
    );
    return sendSuccessResponse('Pharmacy reactivated successfully', pharmacy);
  }

  @Delete('pharmacies/:id')
  async deletePharmacy(@Param('id') id: string) {
    const result = await this.pharmacyService.deletePharmacy(id);
    return sendSuccessResponse('Pharmacy deleted successfully', result);
  }

  // ============ PHARMACY DOCUMENTS ============

  @Post('pharmacies/:id/documents')
  @UseInterceptors(
    FilesInterceptor('file', 1, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async uploadPharmacyDocument(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('document_type') documentType: string,
    @Req() req,
  ) {
    const file = files?.[0];
    if (!file) {
      throw new Error('No file uploaded');
    }
    const result = await this.pharmacyService.uploadPharmacyDocument(
      id,
      file,
      documentType,
      req.user?.sub || req.user?._id,
    );
    return sendSuccessResponse('Document uploaded successfully', result);
  }

  @Delete('pharmacies/:id/documents/:docIndex')
  async removePharmacyDocument(
    @Param('id') id: string,
    @Param('docIndex') docIndex: string,
    @Req() req,
  ) {
    const result = await this.pharmacyService.removePharmacyDocument(
      id,
      parseInt(docIndex),
      req.user?.sub || req.user?._id,
    );
    return sendSuccessResponse('Document removed successfully', result);
  }

  @Patch('pharmacies/:id/documents/:docIndex/verify')
  async verifyPharmacyDocument(
    @Param('id') id: string,
    @Param('docIndex') docIndex: string,
    @Body() body: { verified: boolean; rejection_reason?: string },
    @Req() req,
  ) {
    const result = await this.pharmacyService.verifyPharmacyDocument(
      id,
      parseInt(docIndex),
      body.verified,
      body.rejection_reason,
      req.user?.sub || req.user?._id,
    );
    return sendSuccessResponse(
      body.verified ? 'Document verified successfully' : 'Document rejected',
      result,
    );
  }

  @Get('pharmacies/:id/documents/:docIndex/view')
  async getPharmacyDocumentUrl(
    @Param('id') id: string,
    @Param('docIndex') docIndex: string,
  ) {
    const result = await this.pharmacyService.getPharmacyDocumentPresignedUrl(
      id,
      parseInt(docIndex),
    );
    return sendSuccessResponse('Document URL generated', result);
  }

  // ============ RATINGS & REVIEWS ============

  @Get('ratings')
  async getAllRatings(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('minRating') minRating?: number,
    @Query('maxRating') maxRating?: number,
  ) {
    const result = await this.pharmacyService.getAllRatings({
      page: page || 1,
      limit: limit || 25,
      type,
      minRating,
      maxRating,
    });
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('ratings/stats')
  async getRatingsStats() {
    const result = await this.pharmacyService.getRatingsStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ DRUG SAFETY INFORMATION ============
  // NOTE: These routes must come BEFORE :pharmacyId/performance to avoid route conflicts

  /**
   * Get FDA sync statistics
   */
  @Get('drugs/admin/safety-stats')
  async getSafetyStats() {
    const result = await this.openFDAService.getSyncStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get drug safety info for admin (includes all metadata)
   */
  @Get('drugs/:id/safety/admin')
  async getDrugSafetyInfoAdmin(@Param('id') id: string) {
    const result = await this.openFDAService.getSafetyInfo(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Sync safety info for a drug from FDA
   */
  @Post('drugs/:id/safety/sync')
  async syncDrugSafetyInfo(@Param('id') id: string) {
    const result = await this.openFDAService.triggerManualSync(id);
    return sendSuccessResponse('Safety information synced successfully', result);
  }

  /**
   * Generate AI summary for drug safety info
   * Uses Claude AI to create patient-friendly bullet points
   */
  @Post('drugs/:id/safety/ai-summary')
  async generateAISummary(@Param('id') id: string) {
    const result = await this.openFDAService.generateAISummary(id);
    return sendSuccessResponse('AI summary generated successfully', result);
  }

  /**
   * Check if AI summarization is available
   */
  @Get('drugs/admin/ai-status')
  async getAIStatus() {
    const isAvailable = this.openFDAService.isAIAvailable();
    return sendSuccessResponse(Messages.RETRIEVED, { ai_available: isAvailable });
  }

  /**
   * Update drug safety customizations
   */
  @Patch('drugs/:id/safety')
  async updateDrugSafetyInfo(
    @Param('id') id: string,
    @Body()
    updateDto: {
      custom_warnings?: {
        title: string;
        content: string;
        severity: 'info' | 'warning' | 'danger';
      }[];
      custom_side_effects?: {
        name: string;
        frequency?: string;
        severity?: string;
        description?: string;
      }[];
      admin_notes?: string;
      display_settings?: {
        show_adverse_reactions?: boolean;
        show_warnings?: boolean;
        show_boxed_warning?: boolean;
        show_contraindications?: boolean;
        show_drug_interactions?: boolean;
        show_pregnancy_info?: boolean;
        show_custom_warnings?: boolean;
      };
      is_enabled?: boolean;
    },
    @Req() req,
  ) {
    const result = await this.openFDAService.updateCustomizations(
      id,
      updateDto,
      new Types.ObjectId(req.user.sub || req.user._id),
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  /**
   * Trigger batch sync for drugs due for update
   */
  @Post('drugs/admin/safety-sync-batch')
  async triggerBatchSync(@Query('batch_size') batchSize?: number) {
    const result = await this.openFDAService.syncDueForUpdate(batchSize || 10);
    return sendSuccessResponse('Batch sync completed', result);
  }

  // ============ SIMILAR DRUGS (Related Products) ============

  /**
   * Get a single drug by ID (for similar drugs dialog)
   */
  @Get('drugs/:id')
  async getDrugForSimilar(@Param('id') id: string) {
    const result = await this.pharmacyService.getDrugById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Search drugs for linking
   */
  @Get('drugs')
  async searchDrugsForSimilar(
    @Query('query') query: string,
    @Query('exclude') excludeDrugId?: string,
    @Query('limit') limit?: number,
  ) {
    if (!query) {
      return sendSuccessResponse(Messages.RETRIEVED, []);
    }
    const result = await this.pharmacyService.searchDrugsForLinking(
      query,
      excludeDrugId || '',
      limit || 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get similar drugs for admin (categorized view)
   */
  @Get('drugs/:id/similar/admin')
  async getSimilarDrugsAdmin(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.pharmacyService.getSimilarDrugs(id, limit || 50);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Manually link a drug as similar
   */
  @Post('drugs/:id/similar/link')
  async linkSimilarDrug(
    @Param('id') id: string,
    @Body('target_drug_id') targetDrugId: string,
  ) {
    const result = await this.pharmacyService.linkSimilarDrug(id, targetDrugId);
    return sendSuccessResponse('Drug linked successfully', result);
  }

  /**
   * Unlink a drug from similar
   */
  @Delete('drugs/:id/similar/unlink/:targetId')
  async unlinkSimilarDrug(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ) {
    const result = await this.pharmacyService.unlinkSimilarDrug(id, targetId);
    return sendSuccessResponse('Drug unlinked successfully', result);
  }

  /**
   * Exclude a drug from auto-matching
   */
  @Post('drugs/:id/similar/exclude')
  async excludeSimilarDrug(
    @Param('id') id: string,
    @Body('target_drug_id') targetDrugId: string,
  ) {
    const result = await this.pharmacyService.excludeSimilarDrug(id, targetDrugId);
    return sendSuccessResponse('Drug excluded from similar', result);
  }

  /**
   * Remove a drug from exclusion list
   */
  @Delete('drugs/:id/similar/exclude/:targetId')
  async removeExclusion(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ) {
    const result = await this.pharmacyService.removeExclusion(id, targetId);
    return sendSuccessResponse('Exclusion removed', result);
  }

  // ============ PHARMACY PERFORMANCE REPORT ============

  @Get(':pharmacyId/performance')
  async getPharmacyPerformance(
    @Param('pharmacyId') pharmacyId: string,
    @Query('period') period?: string,
  ) {
    const result = await this.pharmacyService.getPharmacyPerformance(
      pharmacyId,
      period || '30d',
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
