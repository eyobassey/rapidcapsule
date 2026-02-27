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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiConsumes } from '@nestjs/swagger';
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

@ApiTags('Admin Pharmacy')
@ApiBearerAuth('JWT-auth')
@Controller('pharmacy')
@UseGuards(JwtAuthGuard)
export class PharmacyController {
  constructor(
    private readonly pharmacyService: PharmacyService,
    private readonly openFDAService: OpenFDAService,
  ) {}

  // ============ CATEGORIES ============

  @Get('categories')
  @ApiOperation({ summary: 'List drug categories', description: 'Retrieve all drug categories such as Analgesics, Antibiotics, Antimalarials. Optionally include inactive categories.' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  @ApiQuery({ name: 'includeInactive', required: false, type: String, description: 'Set to "true" to include inactive categories', example: 'false' })
  async getCategories(@Query('includeInactive') includeInactive: string) {
    const categories = await this.pharmacyService.getCategories(includeInactive === 'true');
    return sendSuccessResponse('Categories retrieved successfully', categories);
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID', description: 'Retrieve a single drug category by its MongoDB ObjectId.' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ name: 'id', description: 'Category MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getCategoryById(@Param('id') id: string) {
    const category = await this.pharmacyService.getCategoryById(id);
    return sendSuccessResponse('Category retrieved successfully', category);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create drug category', description: 'Create a new drug category (e.g., Antimalarials, Cardiovascular Drugs). The authenticated admin is recorded as creator.' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate category name' })
  async createCategory(@Body() dto: CreateDrugCategoryDto, @Req() req) {
    const category = await this.pharmacyService.createCategory(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Category created successfully', category);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update drug category', description: 'Update an existing drug category name, description, or active status.' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ name: 'id', description: 'Category MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateDrugCategoryDto) {
    const category = await this.pharmacyService.updateCategory(id, dto);
    return sendSuccessResponse('Category updated successfully', category);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete drug category', description: 'Permanently delete a drug category. Ensure no drugs are assigned to this category before deleting.' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ name: 'id', description: 'Category MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async deleteCategory(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteCategory(id);
    return sendSuccessResponse('Category deleted successfully', result);
  }

  @Post('categories/:id/image')
  @ApiOperation({ summary: 'Upload category image', description: 'Upload an image for a drug category. Max file size 5MB. Accepts JPEG, PNG, or WebP formats.' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Category image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file uploaded or file exceeds 5MB limit' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiParam({ name: 'id', description: 'Category MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ description: 'Category image file', schema: { type: 'object', properties: { image: { type: 'string', format: 'binary', description: 'Image file (max 5MB)' } } } })
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
  @ApiOperation({ summary: 'List drug classifications', description: 'Retrieve all drug classifications such as OTC (Over-the-Counter), Prescription Only (POM), or Controlled Substance. Optionally include inactive.' })
  @ApiResponse({ status: 200, description: 'Classifications retrieved successfully' })
  @ApiQuery({ name: 'includeInactive', required: false, type: String, description: 'Set to "true" to include inactive classifications', example: 'false' })
  async getClassifications(@Query('includeInactive') includeInactive: string) {
    const classifications = await this.pharmacyService.getClassifications(includeInactive === 'true');
    return sendSuccessResponse('Classifications retrieved successfully', classifications);
  }

  @Get('classifications/:id')
  @ApiOperation({ summary: 'Get classification by ID', description: 'Retrieve a single drug classification by its MongoDB ObjectId.' })
  @ApiResponse({ status: 200, description: 'Classification retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Classification not found' })
  @ApiParam({ name: 'id', description: 'Classification MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getClassificationById(@Param('id') id: string) {
    const classification = await this.pharmacyService.getClassificationById(id);
    return sendSuccessResponse('Classification retrieved successfully', classification);
  }

  @Post('classifications')
  @ApiOperation({ summary: 'Create drug classification', description: 'Create a new drug classification (e.g., Prescription Only Medicine, Pharmacy Medicine). The authenticated admin is recorded as creator.' })
  @ApiResponse({ status: 201, description: 'Classification created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate classification' })
  async createClassification(@Body() dto: CreateDrugClassificationDto, @Req() req) {
    const classification = await this.pharmacyService.createClassification(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Classification created successfully', classification);
  }

  @Patch('classifications/:id')
  @ApiOperation({ summary: 'Update drug classification', description: 'Update an existing drug classification details.' })
  @ApiResponse({ status: 200, description: 'Classification updated successfully' })
  @ApiResponse({ status: 404, description: 'Classification not found' })
  @ApiParam({ name: 'id', description: 'Classification MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async updateClassification(@Param('id') id: string, @Body() dto: UpdateDrugClassificationDto) {
    const classification = await this.pharmacyService.updateClassification(id, dto);
    return sendSuccessResponse('Classification updated successfully', classification);
  }

  @Delete('classifications/:id')
  @ApiOperation({ summary: 'Delete drug classification', description: 'Permanently delete a drug classification. Ensure no drugs reference this classification before deleting.' })
  @ApiResponse({ status: 200, description: 'Classification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Classification not found' })
  @ApiParam({ name: 'id', description: 'Classification MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async deleteClassification(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteClassification(id);
    return sendSuccessResponse('Classification deleted successfully', result);
  }

  // ============ ROUTES ============

  @Get('routes')
  @ApiOperation({ summary: 'List drug administration routes', description: 'Retrieve all drug administration routes such as Oral, Intravenous, Topical, Intramuscular. Optionally include inactive routes.' })
  @ApiResponse({ status: 200, description: 'Routes retrieved successfully' })
  @ApiQuery({ name: 'includeInactive', required: false, type: String, description: 'Set to "true" to include inactive routes', example: 'false' })
  async getRoutes(@Query('includeInactive') includeInactive: string) {
    const routes = await this.pharmacyService.getRoutes(includeInactive === 'true');
    return sendSuccessResponse('Routes retrieved successfully', routes);
  }

  @Get('routes/:id')
  @ApiOperation({ summary: 'Get route by ID', description: 'Retrieve a single drug administration route by its MongoDB ObjectId.' })
  @ApiResponse({ status: 200, description: 'Route retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  @ApiParam({ name: 'id', description: 'Route MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getRouteById(@Param('id') id: string) {
    const route = await this.pharmacyService.getRouteById(id);
    return sendSuccessResponse('Route retrieved successfully', route);
  }

  @Post('routes')
  @ApiOperation({ summary: 'Create drug route', description: 'Create a new drug administration route (e.g., Sublingual, Rectal, Inhalation). The authenticated admin is recorded as creator.' })
  @ApiResponse({ status: 201, description: 'Route created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate route' })
  async createRoute(@Body() dto: CreateDrugRouteDto, @Req() req) {
    const route = await this.pharmacyService.createRoute(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Route created successfully', route);
  }

  @Patch('routes/:id')
  @ApiOperation({ summary: 'Update drug route', description: 'Update an existing drug administration route details.' })
  @ApiResponse({ status: 200, description: 'Route updated successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  @ApiParam({ name: 'id', description: 'Route MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async updateRoute(@Param('id') id: string, @Body() dto: UpdateDrugRouteDto) {
    const route = await this.pharmacyService.updateRoute(id, dto);
    return sendSuccessResponse('Route updated successfully', route);
  }

  @Delete('routes/:id')
  @ApiOperation({ summary: 'Delete drug route', description: 'Permanently delete a drug administration route. Ensure no drugs reference this route before deleting.' })
  @ApiResponse({ status: 200, description: 'Route deleted successfully' })
  @ApiResponse({ status: 404, description: 'Route not found' })
  @ApiParam({ name: 'id', description: 'Route MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async deleteRoute(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteRoute(id);
    return sendSuccessResponse('Route deleted successfully', result);
  }

  // ============ DOSAGE FORMS ============

  @Get('dosage-forms')
  @ApiOperation({ summary: 'List dosage forms', description: 'Retrieve all dosage forms such as Tablet, Capsule, Syrup, Injection, Cream. Optionally include inactive forms.' })
  @ApiResponse({ status: 200, description: 'Dosage forms retrieved successfully' })
  @ApiQuery({ name: 'includeInactive', required: false, type: String, description: 'Set to "true" to include inactive dosage forms', example: 'false' })
  async getDosageForms(@Query('includeInactive') includeInactive: string) {
    const forms = await this.pharmacyService.getDosageForms(includeInactive === 'true');
    return sendSuccessResponse('Dosage forms retrieved successfully', forms);
  }

  @Get('dosage-forms/:id')
  @ApiOperation({ summary: 'Get dosage form by ID', description: 'Retrieve a single dosage form by its MongoDB ObjectId.' })
  @ApiResponse({ status: 200, description: 'Dosage form retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Dosage form not found' })
  @ApiParam({ name: 'id', description: 'Dosage form MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getDosageFormById(@Param('id') id: string) {
    const form = await this.pharmacyService.getDosageFormById(id);
    return sendSuccessResponse('Dosage form retrieved successfully', form);
  }

  @Post('dosage-forms')
  @ApiOperation({ summary: 'Create dosage form', description: 'Create a new dosage form (e.g., Suppository, Suspension, Lozenge). The authenticated admin is recorded as creator.' })
  @ApiResponse({ status: 201, description: 'Dosage form created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate dosage form' })
  async createDosageForm(@Body() dto: CreateDosageFormDto, @Req() req) {
    const form = await this.pharmacyService.createDosageForm(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Dosage form created successfully', form);
  }

  @Patch('dosage-forms/:id')
  @ApiOperation({ summary: 'Update dosage form', description: 'Update an existing dosage form details.' })
  @ApiResponse({ status: 200, description: 'Dosage form updated successfully' })
  @ApiResponse({ status: 404, description: 'Dosage form not found' })
  @ApiParam({ name: 'id', description: 'Dosage form MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async updateDosageForm(@Param('id') id: string, @Body() dto: UpdateDosageFormDto) {
    const form = await this.pharmacyService.updateDosageForm(id, dto);
    return sendSuccessResponse('Dosage form updated successfully', form);
  }

  @Delete('dosage-forms/:id')
  @ApiOperation({ summary: 'Delete dosage form', description: 'Permanently delete a dosage form. Ensure no drugs reference this form before deleting.' })
  @ApiResponse({ status: 200, description: 'Dosage form deleted successfully' })
  @ApiResponse({ status: 404, description: 'Dosage form not found' })
  @ApiParam({ name: 'id', description: 'Dosage form MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async deleteDosageForm(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteDosageForm(id);
    return sendSuccessResponse('Dosage form deleted successfully', result);
  }

  // ============ MANUFACTURERS ============

  @Get('manufacturers')
  @ApiOperation({ summary: 'List manufacturers', description: 'Retrieve all drug manufacturers such as Emzor, May & Baker, GlaxoSmithKline, Fidson Healthcare. Optionally include inactive manufacturers.' })
  @ApiResponse({ status: 200, description: 'Manufacturers retrieved successfully' })
  @ApiQuery({ name: 'includeInactive', required: false, type: String, description: 'Set to "true" to include inactive manufacturers', example: 'false' })
  async getManufacturers(@Query('includeInactive') includeInactive: string) {
    const manufacturers = await this.pharmacyService.getManufacturers(includeInactive === 'true');
    return sendSuccessResponse('Manufacturers retrieved successfully', manufacturers);
  }

  @Get('manufacturers/:id')
  @ApiOperation({ summary: 'Get manufacturer by ID', description: 'Retrieve a single drug manufacturer by its MongoDB ObjectId.' })
  @ApiResponse({ status: 200, description: 'Manufacturer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Manufacturer not found' })
  @ApiParam({ name: 'id', description: 'Manufacturer MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getManufacturerById(@Param('id') id: string) {
    const manufacturer = await this.pharmacyService.getManufacturerById(id);
    return sendSuccessResponse('Manufacturer retrieved successfully', manufacturer);
  }

  @Post('manufacturers')
  @ApiOperation({ summary: 'Create manufacturer', description: 'Create a new drug manufacturer record (e.g., Nigerian pharmaceutical companies or international manufacturers with NAFDAC registration).' })
  @ApiResponse({ status: 201, description: 'Manufacturer created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate manufacturer' })
  async createManufacturer(@Body() dto: CreateManufacturerDto, @Req() req) {
    const manufacturer = await this.pharmacyService.createManufacturer(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Manufacturer created successfully', manufacturer);
  }

  @Patch('manufacturers/:id')
  @ApiOperation({ summary: 'Update manufacturer', description: 'Update an existing manufacturer record details.' })
  @ApiResponse({ status: 200, description: 'Manufacturer updated successfully' })
  @ApiResponse({ status: 404, description: 'Manufacturer not found' })
  @ApiParam({ name: 'id', description: 'Manufacturer MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async updateManufacturer(@Param('id') id: string, @Body() dto: UpdateManufacturerDto) {
    const manufacturer = await this.pharmacyService.updateManufacturer(id, dto);
    return sendSuccessResponse('Manufacturer updated successfully', manufacturer);
  }

  @Delete('manufacturers/:id')
  @ApiOperation({ summary: 'Delete manufacturer', description: 'Permanently delete a manufacturer record. Ensure no drugs reference this manufacturer before deleting.' })
  @ApiResponse({ status: 200, description: 'Manufacturer deleted successfully' })
  @ApiResponse({ status: 404, description: 'Manufacturer not found' })
  @ApiParam({ name: 'id', description: 'Manufacturer MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async deleteManufacturer(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteManufacturer(id);
    return sendSuccessResponse('Manufacturer deleted successfully', result);
  }

  // ============ SUPPLIERS ============

  @Get('suppliers')
  @ApiOperation({ summary: 'List suppliers', description: 'Retrieve paginated list of drug suppliers. Filter by status, category, search term, or license expiry. Supports Lagos-based and nationwide wholesale distributors.' })
  @ApiResponse({ status: 200, description: 'Suppliers retrieved successfully with pagination metadata' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Items per page', example: '25' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by supplier name or contact info', example: 'Chi Pharmaceuticals' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by supplier status', example: 'active' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by supply category', example: 'wholesale' })
  @ApiQuery({ name: 'includeInactive', required: false, type: String, description: 'Set to "true" to include inactive suppliers', example: 'false' })
  @ApiQuery({ name: 'licenseExpiringSoon', required: false, type: String, description: 'Set to "true" to filter suppliers with expiring licenses', example: 'false' })
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
  @ApiOperation({ summary: 'Get supplier by ID', description: 'Retrieve a single supplier with full details including contact info, license status, and supply history.' })
  @ApiResponse({ status: 200, description: 'Supplier retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiParam({ name: 'id', description: 'Supplier MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getSupplierById(@Param('id') id: string) {
    const supplier = await this.pharmacyService.getSupplierById(id);
    return sendSuccessResponse('Supplier retrieved successfully', supplier);
  }

  @Post('suppliers')
  @ApiOperation({ summary: 'Create supplier', description: 'Register a new drug supplier with contact details, license information, and supply categories. The authenticated admin is recorded as creator.' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate supplier' })
  async createSupplier(@Body() dto: CreateSupplierDto, @Req() req) {
    const supplier = await this.pharmacyService.createSupplier(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Supplier created successfully', supplier);
  }

  @Patch('suppliers/:id')
  @ApiOperation({ summary: 'Update supplier', description: 'Update an existing supplier record including contact details, license info, or supply categories.' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiParam({ name: 'id', description: 'Supplier MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async updateSupplier(@Param('id') id: string, @Body() dto: UpdateSupplierDto, @Req() req) {
    const supplier = await this.pharmacyService.updateSupplier(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Supplier updated successfully', supplier);
  }

  @Patch('suppliers/:id/status')
  @ApiOperation({ summary: 'Change supplier status', description: 'Activate, suspend, or deactivate a supplier. Useful for managing suppliers who fail NAFDAC compliance checks.' })
  @ApiResponse({ status: 200, description: 'Supplier status updated successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiParam({ name: 'id', description: 'Supplier MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async changeSupplierStatus(@Param('id') id: string, @Body() dto: ChangeSupplierStatusDto, @Req() req) {
    const supplier = await this.pharmacyService.changeSupplierStatus(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Supplier status updated successfully', supplier);
  }

  @Post('suppliers/:id/verify-license')
  @ApiOperation({ summary: 'Verify supplier license', description: 'Mark a supplier license as verified or unverified after NAFDAC and PCN license validation.' })
  @ApiResponse({ status: 200, description: 'Supplier license verification updated' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiParam({ name: 'id', description: 'Supplier MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ description: 'License verification status', schema: { type: 'object', required: ['is_verified'], properties: { is_verified: { type: 'boolean', example: true, description: 'Whether the supplier license has been verified' } } } })
  async verifySupplierLicense(
    @Param('id') id: string,
    @Body() body: { is_verified: boolean },
    @Req() req,
  ) {
    const supplier = await this.pharmacyService.verifySupplierLicense(id, body.is_verified, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Supplier license verification updated', supplier);
  }

  @Delete('suppliers/:id')
  @ApiOperation({ summary: 'Delete supplier', description: 'Permanently delete a supplier record. Ensure no active stock batches reference this supplier.' })
  @ApiResponse({ status: 200, description: 'Supplier deleted successfully' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  @ApiParam({ name: 'id', description: 'Supplier MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async deleteSupplier(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteSupplier(id);
    return sendSuccessResponse('Supplier deleted successfully', result);
  }

  // ============ STOCK BATCHES ============

  @Post('batches/receive')
  @ApiOperation({ summary: 'Receive stock batch', description: 'Record receipt of a new stock batch from a supplier. Includes batch number, NAFDAC number, expiry date, quantities, and cost details.' })
  @ApiResponse({ status: 201, description: 'Stock received successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - missing required fields or invalid drug/supplier reference' })
  async receiveStock(@Body() dto: ReceiveStockDto, @Req() req) {
    const userId = req.user?.sub || req.user?._id;
    const batch = await this.pharmacyService.receiveStock(dto, userId);
    return sendSuccessResponse('Stock received successfully', batch);
  }

  @Get('batches')
  @ApiOperation({ summary: 'List stock batches', description: 'Retrieve paginated list of stock batches with filters for drug, supplier, status, batch number, stock availability, and expiry. Supports sorting.' })
  @ApiResponse({ status: 200, description: 'Batches retrieved successfully with pagination metadata' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Items per page', example: '25' })
  @ApiQuery({ name: 'drug_id', required: false, type: String, description: 'Filter by drug ObjectId' })
  @ApiQuery({ name: 'supplier_id', required: false, type: String, description: 'Filter by supplier ObjectId' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by batch status (e.g., active, quarantined, recalled)', example: 'active' })
  @ApiQuery({ name: 'batch_number', required: false, type: String, description: 'Filter by batch number', example: 'BTH-2024-001' })
  @ApiQuery({ name: 'hasStock', required: false, type: String, description: 'Set to "true" to only show batches with remaining stock' })
  @ApiQuery({ name: 'expiringWithinDays', required: false, type: String, description: 'Show batches expiring within N days', example: '90' })
  @ApiQuery({ name: 'expired', required: false, type: String, description: 'Set to "true" to show only expired batches' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field', example: 'expiry_date' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction: asc or desc', example: 'asc' })
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
  @ApiOperation({ summary: 'Get expiring batches', description: 'Retrieve all stock batches expiring within the specified number of days. Defaults to 90 days. Critical for NAFDAC compliance and inventory rotation.' })
  @ApiResponse({ status: 200, description: 'Expiring batches retrieved successfully' })
  @ApiQuery({ name: 'days', required: false, type: String, description: 'Number of days to check for expiry', example: '90' })
  async getExpiringBatches(@Query('days') days: string) {
    const batches = await this.pharmacyService.getExpiringBatches(parseInt(days) || 90);
    return sendSuccessResponse('Expiring batches retrieved successfully', batches);
  }

  @Get('batches/expired')
  @ApiOperation({ summary: 'Get expired batches', description: 'Retrieve all stock batches that have passed their expiry date. These should be quarantined and disposed of per NAFDAC regulations.' })
  @ApiResponse({ status: 200, description: 'Expired batches retrieved successfully' })
  async getExpiredBatches() {
    const batches = await this.pharmacyService.getExpiredBatches();
    return sendSuccessResponse('Expired batches retrieved successfully', batches);
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Get batch by ID', description: 'Retrieve a single stock batch with full details including quantities, cost, supplier, and transaction history.' })
  @ApiResponse({ status: 200, description: 'Batch retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiParam({ name: 'id', description: 'Batch MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getBatchById(@Param('id') id: string) {
    const batch = await this.pharmacyService.getBatchById(id);
    return sendSuccessResponse('Batch retrieved successfully', batch);
  }

  @Patch('batches/:id')
  @ApiOperation({ summary: 'Update batch', description: 'Update stock batch details such as batch number, expiry date, storage conditions, or notes.' })
  @ApiResponse({ status: 200, description: 'Batch updated successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiParam({ name: 'id', description: 'Batch MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async updateBatch(@Param('id') id: string, @Body() dto: UpdateBatchDto, @Req() req) {
    const batch = await this.pharmacyService.updateBatch(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Batch updated successfully', batch);
  }

  @Delete('batches/:id')
  @ApiOperation({ summary: 'Delete batch', description: 'Permanently delete a stock batch record. Only allowed for batches with zero remaining stock.' })
  @ApiResponse({ status: 200, description: 'Batch deleted successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete batch with remaining stock' })
  @ApiParam({ name: 'id', description: 'Batch MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async deleteBatch(@Param('id') id: string, @Req() req) {
    const result = await this.pharmacyService.deleteBatch(id, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Batch deleted successfully', result);
  }

  @Patch('batches/:id/status')
  @ApiOperation({ summary: 'Change batch status', description: 'Change the status of a stock batch (e.g., active, quarantined, recalled, disposed). Used for quality control and NAFDAC compliance.' })
  @ApiResponse({ status: 200, description: 'Batch status updated successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiParam({ name: 'id', description: 'Batch MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async changeBatchStatus(@Param('id') id: string, @Body() dto: ChangeBatchStatusDto, @Req() req) {
    const batch = await this.pharmacyService.changeBatchStatus(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Batch status updated successfully', batch);
  }

  @Post('batches/:id/adjust')
  @ApiOperation({ summary: 'Adjust batch stock', description: 'Manually adjust stock quantity for a batch. Used for corrections after physical stock counts, breakage, or other discrepancies.' })
  @ApiResponse({ status: 200, description: 'Batch stock adjusted successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiResponse({ status: 400, description: 'Invalid adjustment - insufficient stock or invalid quantity' })
  @ApiParam({ name: 'id', description: 'Batch MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async adjustBatchStock(@Param('id') id: string, @Body() dto: AdjustBatchStockDto, @Req() req) {
    const batch = await this.pharmacyService.adjustBatchStock(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Batch stock adjusted successfully', batch);
  }

  @Post('batches/:id/return')
  @ApiOperation({ summary: 'Return batch to supplier', description: 'Process a return of stock to the supplier. Records the return quantity, reason, and creates a stock transaction.' })
  @ApiResponse({ status: 200, description: 'Stock returned to supplier successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiResponse({ status: 400, description: 'Insufficient stock for return' })
  @ApiParam({ name: 'id', description: 'Batch MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async returnToSupplier(@Param('id') id: string, @Body() dto: ReturnToSupplierDto, @Req() req) {
    const batch = await this.pharmacyService.returnToSupplier(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Stock returned to supplier successfully', batch);
  }

  @Post('batches/:id/writeoff')
  @ApiOperation({ summary: 'Write off batch', description: 'Write off a stock batch due to damage, contamination, or expiry. Records the write-off reason and adjusts inventory accordingly.' })
  @ApiResponse({ status: 200, description: 'Batch written off successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiParam({ name: 'id', description: 'Batch MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async writeOffBatch(@Param('id') id: string, @Body() dto: WriteOffBatchDto, @Req() req) {
    const batch = await this.pharmacyService.writeOffBatch(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Batch written off successfully', batch);
  }

  @Post('batches/:id/recall')
  @ApiOperation({ summary: 'Recall batch', description: 'Initiate a batch recall, typically due to NAFDAC safety alerts or manufacturer quality issues. Quarantines remaining stock and records recall details.' })
  @ApiResponse({ status: 200, description: 'Batch recalled successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiParam({ name: 'id', description: 'Batch MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async recallBatch(@Param('id') id: string, @Body() dto: RecallBatchDto, @Req() req) {
    const batch = await this.pharmacyService.recallBatch(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Batch recalled successfully', batch);
  }

  // ============ DRUG-SPECIFIC STOCK ============

  @Get('drugs/:drugId/batches')
  @ApiOperation({ summary: 'Get batches for a drug', description: 'Retrieve all stock batches for a specific drug. Filter by batch status and stock availability. E.g., all Paracetamol 500mg batches.' })
  @ApiResponse({ status: 200, description: 'Drug batches retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'drugId', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Items per page', example: '25' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by batch status', example: 'active' })
  @ApiQuery({ name: 'hasStock', required: false, type: String, description: 'Set to "true" to only show batches with remaining stock' })
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
  @ApiOperation({ summary: 'Get drug stock info', description: 'Retrieve aggregated stock information for a drug including total quantity across all batches, earliest expiry, and stock value.' })
  @ApiResponse({ status: 200, description: 'Drug stock info retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'drugId', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getDrugStockInfo(@Param('drugId') drugId: string) {
    const stockInfo = await this.pharmacyService.getDrugStockInfo(drugId);
    return sendSuccessResponse('Drug stock info retrieved successfully', stockInfo);
  }

  @Get('drugs/:drugId/fefo-preview')
  @ApiOperation({ summary: 'FEFO dispensing preview', description: 'Preview which batches would be selected for dispensing using FEFO (First Expiry, First Out) algorithm. Shows batch allocation for a given quantity.' })
  @ApiResponse({ status: 200, description: 'FEFO preview generated successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiResponse({ status: 400, description: 'Insufficient stock for requested quantity' })
  @ApiParam({ name: 'drugId', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiQuery({ name: 'quantity', required: false, type: String, description: 'Quantity to preview for dispensing', example: '10' })
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
  @ApiOperation({ summary: 'Dispense stock', description: 'Dispense stock from inventory using FEFO algorithm. Automatically selects batches with earliest expiry. Links to prescription or order reference.' })
  @ApiResponse({ status: 200, description: 'Stock dispensed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock or invalid drug reference' })
  async dispenseStock(@Body() dto: DispenseStockDto, @Req() req) {
    const result = await this.pharmacyService.dispenseStock(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Stock dispensed successfully', result);
  }

  // ============ TRANSACTIONS ============

  @Get('transactions')
  @ApiOperation({ summary: 'List stock transactions', description: 'Retrieve paginated stock transaction history with filters for drug, batch, supplier, transaction type, date range, and reference. Provides full audit trail for inventory movements.' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully with pagination metadata' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Items per page', example: '25' })
  @ApiQuery({ name: 'drug_id', required: false, type: String, description: 'Filter by drug ObjectId' })
  @ApiQuery({ name: 'batch_id', required: false, type: String, description: 'Filter by batch ObjectId' })
  @ApiQuery({ name: 'supplier_id', required: false, type: String, description: 'Filter by supplier ObjectId' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Transaction type (e.g., received, dispensed, adjustment, return, write_off, recall)', example: 'dispensed' })
  @ApiQuery({ name: 'reference_type', required: false, type: String, description: 'Reference type (e.g., prescription, order)', example: 'prescription' })
  @ApiQuery({ name: 'reference_number', required: false, type: String, description: 'Reference number to search' })
  @ApiQuery({ name: 'from_date', required: false, type: String, description: 'Start date filter (ISO 8601)', example: '2024-01-01' })
  @ApiQuery({ name: 'to_date', required: false, type: String, description: 'End date filter (ISO 8601)', example: '2024-12-31' })
  @ApiQuery({ name: 'excludeReversed', required: false, type: String, description: 'Set to "true" to exclude reversed transactions' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field', example: 'created_at' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction: asc or desc', example: 'desc' })
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
  @ApiOperation({ summary: 'Get transaction by ID', description: 'Retrieve a single stock transaction with full details including drug, batch, quantities, and user who performed the action.' })
  @ApiResponse({ status: 200, description: 'Transaction retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiParam({ name: 'id', description: 'Transaction MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getTransactionById(@Param('id') id: string) {
    const transaction = await this.pharmacyService.getTransactionById(id);
    return sendSuccessResponse('Transaction retrieved successfully', transaction);
  }

  @Get('drugs/:drugId/transactions')
  @ApiOperation({ summary: 'Get drug transactions', description: 'Retrieve all stock transactions for a specific drug across all batches. Useful for auditing movement history of drugs like Amoxicillin 500mg.' })
  @ApiResponse({ status: 200, description: 'Drug transactions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'drugId', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Items per page', example: '25' })
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
  @ApiOperation({ summary: 'Get batch transactions', description: 'Retrieve all stock transactions for a specific batch. Shows the complete lifecycle of a batch from receipt to dispensing.' })
  @ApiResponse({ status: 200, description: 'Batch transactions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  @ApiParam({ name: 'batchId', description: 'Batch MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Items per page', example: '25' })
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
  @ApiOperation({ summary: 'Get inventory alerts', description: 'Retrieve all active inventory alerts including low stock, out of stock, expiring soon, and expired items. Critical for pharmacy operations dashboard.' })
  @ApiResponse({ status: 200, description: 'Inventory alerts retrieved successfully' })
  async getInventoryAlerts() {
    const alerts = await this.pharmacyService.getInventoryAlerts();
    return sendSuccessResponse('Inventory alerts retrieved successfully', alerts);
  }

  @Get('inventory/summary')
  @ApiOperation({ summary: 'Get inventory summary', description: 'Retrieve a high-level summary of pharmacy inventory including total products, batches, stock value, active suppliers, and alert counts.' })
  @ApiResponse({ status: 200, description: 'Inventory summary retrieved successfully' })
  async getInventorySummary() {
    const summary = await this.pharmacyService.getInventorySummary();
    return sendSuccessResponse('Inventory summary retrieved successfully', summary);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get pharmacy dashboard', description: 'Retrieve combined dashboard data including stats (total products, stock value, alerts), recent orders, and low stock items. Formatted for the admin frontend dashboard view.' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
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
  @ApiOperation({ summary: 'Upload drug images', description: 'Upload up to 10 drug product images to S3 storage. Max 5MB per file. Accepts JPEG, PNG, or WebP. Returns the uploaded image URLs.' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Images uploaded successfully with S3 URLs' })
  @ApiResponse({ status: 400, description: 'No files uploaded or file exceeds 5MB limit' })
  @ApiBody({ description: 'Drug image files (max 10 files, 5MB each)', schema: { type: 'object', properties: { images: { type: 'array', items: { type: 'string', format: 'binary' }, description: 'Image files to upload' } } } })
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
  @ApiOperation({ summary: 'Delete drug image', description: 'Delete a drug image from S3 storage by its URL.' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully' })
  @ApiResponse({ status: 404, description: 'Image not found at the specified URL' })
  async deleteDrugImage(@Body() dto: DeleteDrugImageDto) {
    const result = await this.pharmacyService.deleteDrugImage(dto.image_url);
    return sendSuccessResponse('Image deleted successfully', result);
  }

  @Post('inventory/:id/generate-placeholder-image')
  @ApiOperation({ summary: 'Generate placeholder image for drug', description: 'Generate a colored card placeholder image for a drug using its name and category color. Uploads to S3 and assigns to the drug.' })
  @ApiResponse({ status: 200, description: 'Placeholder image generated successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async generatePlaceholderImage(@Param('id') id: string) {
    const result = await this.pharmacyService.generatePlaceholderImage(id);
    return sendSuccessResponse('Placeholder image generated successfully', result);
  }

  @Post('images/generate-placeholder')
  @ApiOperation({ summary: 'Generate placeholder from data', description: 'Generate a colored card placeholder image from provided drug data (name, strength, manufacturer) without requiring an existing drug record.' })
  @ApiResponse({ status: 200, description: 'Placeholder image generated successfully' })
  @ApiResponse({ status: 400, description: 'Drug name is required' })
  @ApiBody({ description: 'Drug data for placeholder generation', schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', example: 'Paracetamol', description: 'Drug name' }, strength: { type: 'string', example: '500mg', description: 'Drug strength' }, manufacturer: { type: 'string', example: 'Emzor', description: 'Manufacturer name' } } } })
  async generatePlaceholderImageFromData(
    @Body() body: { name: string; strength?: string; manufacturer?: string },
  ) {
    const result = await this.pharmacyService.generatePlaceholderImageFromData(body);
    return sendSuccessResponse('Placeholder image generated successfully', result);
  }

  // ============ DRUGS / INVENTORY ============

  @Get('inventory')
  @ApiOperation({ summary: 'List drugs in inventory', description: 'Retrieve paginated drug inventory with filters for search, classification (OTC/POM), category, manufacturer, supplier, and stock status. Supports Nigerian drug names and NAFDAC-registered products.' })
  @ApiResponse({ status: 200, description: 'Drugs retrieved successfully with pagination metadata' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Items per page', example: '25' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by drug name, generic name, or NAFDAC number', example: 'Amoxicillin' })
  @ApiQuery({ name: 'classification', required: false, type: String, description: 'Filter by classification ObjectId' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category ObjectId' })
  @ApiQuery({ name: 'manufacturer', required: false, type: String, description: 'Filter by manufacturer name', example: 'Emzor' })
  @ApiQuery({ name: 'supplier', required: false, type: String, description: 'Filter by supplier ObjectId' })
  @ApiQuery({ name: 'stockStatus', required: false, type: String, description: 'Filter by stock status (in_stock, low_stock, out_of_stock)', example: 'low_stock' })
  @ApiQuery({ name: 'includeInactive', required: false, type: String, description: 'Set to "true" to include inactive drugs' })
  @ApiQuery({ name: 'includeSampleData', required: false, type: String, description: 'Set to "true" to include sample/demo drugs' })
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
  @ApiOperation({ summary: 'Sync all drug quantities', description: 'Recalculate and sync the quantity field on all drug documents from their active stock batches. Fixes any discrepancies between drug.quantity and actual batch totals.' })
  @ApiResponse({ status: 200, description: 'Drug quantities synced successfully' })
  async syncAllDrugQuantities() {
    const result = await this.pharmacyService.syncAllDrugQuantities();
    return sendSuccessResponse('Drug quantities synced successfully', result);
  }

  @Get('inventory/debug-batches')
  @ApiOperation({ summary: 'Debug batch status', description: 'Retrieve debug information about batch statuses and quantities. Used for troubleshooting inventory discrepancies.' })
  @ApiResponse({ status: 200, description: 'Batch debug info retrieved' })
  async debugBatches() {
    const result = await this.pharmacyService.debugBatchStatus();
    return sendSuccessResponse('Batch debug info', result);
  }

  @Post('inventory/:id/sync')
  @ApiOperation({ summary: 'Sync single drug quantity', description: 'Recalculate and sync the quantity field for a single drug from its active stock batches.' })
  @ApiResponse({ status: 200, description: 'Drug quantity synced successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async syncDrugQuantity(@Param('id') id: string) {
    const result = await this.pharmacyService.syncSingleDrugQuantity(id);
    return sendSuccessResponse('Drug quantity synced successfully', result);
  }

  @Get('inventory/:id')
  @ApiOperation({ summary: 'Get drug by ID', description: 'Retrieve a single drug with full details including categories, classification, dosage form, route, manufacturer, images, and stock info.' })
  @ApiResponse({ status: 200, description: 'Drug retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getDrugById(@Param('id') id: string) {
    const drug = await this.pharmacyService.getDrugById(id);
    return sendSuccessResponse('Drug retrieved successfully', drug);
  }

  @Post('inventory')
  @ApiOperation({ summary: 'Create drug', description: 'Add a new drug to the pharmacy inventory. Requires name, strength, dosage form, and route. Deduplication is based on name + strength + dosage_form.' })
  @ApiResponse({ status: 201, description: 'Drug created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate drug entry' })
  async createDrug(@Body() dto: CreateDrugDto, @Req() req) {
    const drug = await this.pharmacyService.createDrug(dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Drug created successfully', drug);
  }

  @Patch('inventory/:id')
  @ApiOperation({ summary: 'Update drug', description: 'Update drug details such as name, strength, description, pricing, categories, or NAFDAC registration number.' })
  @ApiResponse({ status: 200, description: 'Drug updated successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async updateDrug(@Param('id') id: string, @Body() dto: UpdateDrugDto, @Req() req) {
    const drug = await this.pharmacyService.updateDrug(id, dto, req.user?.sub || req.user?._id);
    return sendSuccessResponse('Drug updated successfully', drug);
  }

  @Patch('inventory/:id/stock')
  @ApiOperation({ summary: 'Update drug stock settings', description: 'Update stock-related settings for a drug such as reorder level, minimum stock, maximum stock, and stock alert thresholds.' })
  @ApiResponse({ status: 200, description: 'Drug stock updated successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async updateDrugStock(@Param('id') id: string, @Body() dto: UpdateDrugStockDto) {
    const drug = await this.pharmacyService.updateDrugStock(id, dto);
    return sendSuccessResponse('Drug stock updated successfully', drug);
  }

  @Delete('inventory/:id')
  @ApiOperation({ summary: 'Delete drug', description: 'Permanently delete a drug from the inventory. Ensure all stock batches are cleared before deletion.' })
  @ApiResponse({ status: 200, description: 'Drug deleted successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async deleteDrug(@Param('id') id: string) {
    const result = await this.pharmacyService.deleteDrug(id);
    return sendSuccessResponse('Drug deleted successfully', result);
  }

  @Post('inventory/:id/images')
  @ApiOperation({ summary: 'Add drug images', description: 'Add one or more image URLs to a drug record. Images should already be uploaded to S3 via the images/upload endpoint.' })
  @ApiResponse({ status: 200, description: 'Drug images added successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ description: 'Array of image objects to add', schema: { type: 'object', required: ['images'], properties: { images: { type: 'array', items: { type: 'object', properties: { url: { type: 'string', example: 'https://rapidcapsules.s3.amazonaws.com/pharmacy/drugs/paracetamol.png' }, is_primary: { type: 'boolean', example: false }, alt_text: { type: 'string', example: 'Paracetamol 500mg tablet' } } } } } } })
  async addDrugImages(
    @Param('id') id: string,
    @Body() body: { images: { url: string; is_primary?: boolean; alt_text?: string }[] },
  ) {
    const drug = await this.pharmacyService.addDrugImages(id, body.images);
    return sendSuccessResponse('Drug images added successfully', drug);
  }

  @Delete('inventory/:id/images')
  @ApiOperation({ summary: 'Remove drug image', description: 'Remove a specific image from a drug record by its URL.' })
  @ApiResponse({ status: 200, description: 'Drug image removed successfully' })
  @ApiResponse({ status: 404, description: 'Drug or image not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ description: 'Image URL to remove', schema: { type: 'object', required: ['image_url'], properties: { image_url: { type: 'string', example: 'https://rapidcapsules.s3.amazonaws.com/pharmacy/drugs/paracetamol.png' } } } })
  async removeDrugImage(@Param('id') id: string, @Body() body: { image_url: string }) {
    const drug = await this.pharmacyService.removeDrugImage(id, body.image_url);
    return sendSuccessResponse('Drug image removed successfully', drug);
  }

  @Patch('inventory/:id/images/primary')
  @ApiOperation({ summary: 'Set primary drug image', description: 'Set a specific image as the primary display image for a drug. The primary image is shown in search results and drug listings.' })
  @ApiResponse({ status: 200, description: 'Primary image set successfully' })
  @ApiResponse({ status: 404, description: 'Drug or image not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ description: 'Image URL to set as primary', schema: { type: 'object', required: ['image_url'], properties: { image_url: { type: 'string', example: 'https://rapidcapsules.s3.amazonaws.com/pharmacy/drugs/paracetamol.png' } } } })
  async setPrimaryImage(@Param('id') id: string, @Body() body: { image_url: string }) {
    const drug = await this.pharmacyService.setPrimaryImage(id, body.image_url);
    return sendSuccessResponse('Primary image set successfully', drug);
  }

  // ============ INVENTORY REPORTS ============

  @Get('reports/stock-valuation')
  @ApiOperation({ summary: 'Stock valuation report', description: 'Generate a stock valuation report showing the monetary value of all inventory items. Supports filtering by category, manufacturer, and date range.' })
  @ApiResponse({ status: 200, description: 'Stock valuation report generated successfully' })
  async getStockValuationReport(@Query() query: InventoryReportQueryDto) {
    const report = await this.pharmacyService.getStockValuationReport(query);
    return sendSuccessResponse('Stock valuation report generated successfully', report);
  }

  @Get('reports/expiry-batch')
  @ApiOperation({ summary: 'Expiry and batch report', description: 'Generate a report of batch expiry dates and statuses. Helps track NAFDAC compliance for expired and soon-to-expire products.' })
  @ApiResponse({ status: 200, description: 'Expiry and batch report generated successfully' })
  async getExpiryBatchReport(@Query() query: InventoryReportQueryDto) {
    const report = await this.pharmacyService.getExpiryBatchReport(query);
    return sendSuccessResponse('Expiry and batch report generated successfully', report);
  }

  @Get('reports/transactions')
  @ApiOperation({ summary: 'Transaction report', description: 'Generate a comprehensive report of all stock transactions including receipts, dispensing, adjustments, returns, and write-offs.' })
  @ApiResponse({ status: 200, description: 'Transaction report generated successfully' })
  async getTransactionReport(@Query() query: InventoryReportQueryDto) {
    const report = await this.pharmacyService.getTransactionReport(query);
    return sendSuccessResponse('Transaction report generated successfully', report);
  }

  @Get('reports/manufacturers')
  @ApiOperation({ summary: 'Get manufacturers for reports', description: 'Retrieve a simplified list of manufacturers for use in report filter dropdowns.' })
  @ApiResponse({ status: 200, description: 'Manufacturers retrieved successfully' })
  async getManufacturersForReports() {
    const manufacturers = await this.pharmacyService.getManufacturersForReports();
    return sendSuccessResponse('Manufacturers retrieved successfully', manufacturers);
  }

  // ============ SAMPLE DATA ============

  @Post('sample-data/seed')
  @ApiOperation({ summary: 'Seed sample drugs', description: 'Seed the database with sample drug data for development and testing. Includes common Nigerian pharmacy drugs like Paracetamol, Amoxicillin, Artemether-Lumefantrine, etc.' })
  @ApiResponse({ status: 200, description: 'Sample drugs seeded successfully' })
  async seedSampleDrugs() {
    const result = await this.pharmacyService.seedSampleDrugs();
    return sendSuccessResponse('Sample drugs seeded successfully', result);
  }

  @Delete('sample-data')
  @ApiOperation({ summary: 'Clear sample drugs', description: 'Remove all sample/demo drug data from the database. Does not affect real drug records.' })
  @ApiResponse({ status: 200, description: 'Sample drugs cleared successfully' })
  async clearSampleDrugs() {
    const result = await this.pharmacyService.clearSampleDrugs();
    return sendSuccessResponse('Sample drugs cleared successfully', result);
  }

  // ============ INITIALIZATION ============

  @Post('initialize')
  @ApiOperation({ summary: 'Initialize pharmacy data', description: 'Initialize all pharmacy reference data including default categories, classifications, dosage forms, routes, and manufacturers. Safe to run multiple times - skips existing data.' })
  @ApiResponse({ status: 200, description: 'All pharmacy data initialized successfully' })
  async initializeAllData() {
    await this.pharmacyService.initializeAllData();
    return sendSuccessResponse('All pharmacy data initialized successfully', null);
  }

  // ============ PRESCRIPTIONS ============

  @Get('prescriptions')
  @ApiOperation({ summary: 'List prescriptions', description: 'Retrieve paginated list of prescriptions. Filter by search term, status (pending, approved, rejected, dispensed), or date.' })
  @ApiResponse({ status: 200, description: 'Prescriptions retrieved successfully with pagination metadata' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Items per page', example: '25' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by patient name, prescription ID, or drug name', example: 'Amoxicillin' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by prescription status', example: 'pending' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Filter by date (ISO 8601)', example: '2024-06-15' })
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
  @ApiOperation({ summary: 'Get prescriptions pending review', description: 'Retrieve prescriptions awaiting pharmacist review. Supports filtering by priority and sorting. Used by the pharmacist review queue.' })
  @ApiResponse({ status: 200, description: 'Pending review prescriptions retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Items per page', example: '25' })
  @ApiQuery({ name: 'priority', required: false, type: String, description: 'Filter by priority (high, medium, low)', example: 'high' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field (e.g., created_at, priority)', example: 'created_at' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction: asc or desc', example: 'desc' })
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
  @ApiOperation({ summary: 'Get review queue count', description: 'Retrieve the count of prescriptions currently in the review queue. Used for badge counters in the admin dashboard sidebar.' })
  @ApiResponse({ status: 200, description: 'Review queue count retrieved successfully' })
  async getReviewQueueCount() {
    const result = await this.pharmacyService.getReviewQueueCount();
    return sendSuccessResponse('Review queue count retrieved successfully', result);
  }

  /**
   * Get prescriptions awaiting clarification from patient
   */
  @Get('prescriptions/awaiting-clarification')
  @ApiOperation({ summary: 'Get prescriptions awaiting clarification', description: 'Retrieve prescriptions where the pharmacist has requested additional information from the patient before approval.' })
  @ApiResponse({ status: 200, description: 'Awaiting clarification prescriptions retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Items per page', example: '25' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field', example: 'created_at' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction: asc or desc', example: 'desc' })
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
  @ApiOperation({ summary: 'Get prescription by ID', description: 'Retrieve a single prescription with full details including patient info, medications, prescriber, and review status.' })
  @ApiResponse({ status: 200, description: 'Prescription retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getPrescriptionById(@Param('id') id: string) {
    const prescription = await this.pharmacyService.getPrescriptionById(id);
    return sendSuccessResponse('Prescription retrieved successfully', prescription);
  }

  @Get('prescriptions/:id/pdf')
  @ApiOperation({ summary: 'Get prescription PDF URL', description: 'Retrieve a pre-signed S3 URL for downloading the prescription PDF document.' })
  @ApiResponse({ status: 200, description: 'PDF URL retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Prescription not found or PDF not generated' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getPrescriptionPdf(@Param('id') id: string) {
    const result = await this.pharmacyService.getPrescriptionPdfUrl(id);
    return sendSuccessResponse('PDF URL retrieved successfully', result);
  }

  @Patch('prescriptions/:id/status')
  @ApiOperation({ summary: 'Update prescription status', description: 'Update the status of a prescription (e.g., pending, approved, rejected, dispensed, cancelled). Optionally include a rejection reason.' })
  @ApiResponse({ status: 200, description: 'Prescription status updated successfully' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ description: 'Status update payload', schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', example: 'approved', description: 'New prescription status' }, rejection_reason: { type: 'string', example: 'Dosage exceeds recommended maximum for patient age', description: 'Reason for rejection (required when status is rejected)' } } } })
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
  @ApiOperation({ summary: 'Get prescription review details', description: 'Retrieve detailed prescription information for pharmacist review including drug interactions, patient allergies, dosage validation, and clinical notes.' })
  @ApiResponse({ status: 200, description: 'Prescription review details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getPrescriptionReviewDetails(@Param('id') id: string) {
    const result = await this.pharmacyService.getPrescriptionReviewDetails(id);
    return sendSuccessResponse('Prescription review details retrieved successfully', result);
  }

  /**
   * Review and approve/reject a prescription
   */
  @Post('prescriptions/:id/review')
  @ApiOperation({ summary: 'Review prescription', description: 'Submit a pharmacist review decision to approve or reject a prescription. Includes optional review notes, rejection reason, and validity period.' })
  @ApiResponse({ status: 200, description: 'Prescription reviewed successfully' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @ApiResponse({ status: 400, description: 'Prescription already reviewed or invalid decision' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ description: 'Review decision payload', schema: { type: 'object', required: ['decision'], properties: { decision: { type: 'string', enum: ['APPROVED', 'REJECTED'], example: 'APPROVED', description: 'Review decision' }, review_notes: { type: 'string', example: 'Dosage verified, no drug interactions found', description: 'Pharmacist review notes' }, rejection_reason: { type: 'string', example: 'Contraindicated with patient current medications', description: 'Reason for rejection' }, valid_until: { type: 'string', example: '2024-12-31', description: 'Prescription validity end date (ISO 8601)' } } } })
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
  @ApiOperation({ summary: 'Request prescription clarification', description: 'Request additional information from the patient before approving or rejecting a prescription. Sets a response deadline and specifies what information is needed.' })
  @ApiResponse({ status: 200, description: 'Clarification request sent successfully' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ description: 'Clarification request payload', schema: { type: 'object', required: ['request_message'], properties: { request_message: { type: 'string', example: 'Please confirm your current medications and any known allergies', description: 'Message to send to the patient' }, required_information: { type: 'array', items: { type: 'string' }, example: ['Current medications', 'Known allergies', 'Pregnancy status'], description: 'List of specific information needed' }, response_deadline_days: { type: 'number', example: 3, description: 'Number of days the patient has to respond' } } } })
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
  @ApiOperation({ summary: 'Check prescription inventory', description: 'Check whether all medications in a prescription are available in stock. Returns availability status for each item and identifies alternatives if unavailable.' })
  @ApiResponse({ status: 200, description: 'Inventory check completed' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async checkPrescriptionInventory(@Param('id') id: string) {
    const result = await this.pharmacyService.checkPrescriptionInventory(id);
    return sendSuccessResponse('Inventory check completed', result);
  }

  @Post('prescriptions/:id/reserve-stock')
  @ApiOperation({ summary: 'Reserve stock for prescription', description: 'Reserve inventory stock for all medications in a prescription. Prevents stock from being dispensed to other orders while this prescription is being processed.' })
  @ApiResponse({ status: 200, description: 'Stock reservation completed' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @ApiResponse({ status: 400, description: 'Insufficient stock for one or more medications' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async reserveStockForPrescription(
    @Param('id') id: string,
    @Req() req,
  ) {
    const userId = req.user?.sub || req.user?._id;
    const result = await this.pharmacyService.reserveStockForPrescription(id, userId);
    return sendSuccessResponse('Stock reservation completed', result);
  }

  @Post('prescriptions/:id/release-stock')
  @ApiOperation({ summary: 'Release stock reservation', description: 'Release previously reserved stock for a prescription. Used when a prescription is cancelled or rejected after stock was reserved.' })
  @ApiResponse({ status: 200, description: 'Stock reservation released' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @ApiParam({ name: 'id', description: 'Prescription MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async releaseStockReservation(@Param('id') id: string) {
    const result = await this.pharmacyService.releaseStockReservation(id);
    return sendSuccessResponse('Stock reservation released', result);
  }

  // ============ ORDERS ============

  @Get('orders')
  @ApiOperation({ summary: 'List pharmacy orders', description: 'Retrieve paginated list of pharmacy orders. Filter by search term, order status, or delivery type (pickup, delivery).' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully with pagination metadata' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Items per page', example: '25' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by order ID, patient name, or drug name' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by order status (e.g., pending, processing, filled, shipped, delivered)', example: 'pending' })
  @ApiQuery({ name: 'delivery_type', required: false, type: String, description: 'Filter by delivery type (pickup, delivery)', example: 'delivery' })
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
  @ApiOperation({ summary: 'Get order by ID', description: 'Retrieve a single pharmacy order with full details including patient info, medications, payment status, and delivery information.' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getOrderById(@Param('id') id: string) {
    const order = await this.pharmacyService.getOrderById(id);
    return sendSuccessResponse('Order retrieved successfully', order);
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status', description: 'Update the status of a pharmacy order (e.g., pending, processing, filled, shipped, delivered, cancelled).' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiParam({ name: 'id', description: 'Order MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ description: 'Order status update', schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', example: 'processing', description: 'New order status' } } } })
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
  @ApiOperation({ summary: 'Fill order medications', description: 'Fill all medications for an order by dispensing stock from inventory using FEFO algorithm. Marks medications as filled and updates batch quantities.' })
  @ApiResponse({ status: 200, description: 'Order medications filled successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 400, description: 'Insufficient stock for one or more medications' })
  @ApiParam({ name: 'id', description: 'Order MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
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
  @ApiOperation({ summary: 'List pharmacies', description: 'Retrieve paginated list of registered pharmacies. Filter by verification status, state (e.g., Lagos, Abuja, Rivers), online status, or pickup center designation.' })
  @ApiResponse({ status: 200, description: 'Pharmacies retrieved successfully with pagination metadata' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 25 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by pharmacy name or address', example: 'MedPlus Lagos' })
  @ApiQuery({ name: 'verification_status', required: false, type: String, description: 'Filter by verification status (pending, verified, rejected)', example: 'verified' })
  @ApiQuery({ name: 'state', required: false, type: String, description: 'Filter by Nigerian state', example: 'Lagos' })
  @ApiQuery({ name: 'is_online', required: false, type: String, description: 'Filter by online status ("true" or "false")' })
  @ApiQuery({ name: 'is_pickup_center', required: false, type: String, description: 'Filter by pickup center designation ("true" or "false")' })
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
  @ApiOperation({ summary: 'Get pharmacy stats', description: 'Retrieve aggregate statistics for pharmacies including total count, verified count, pending verifications, online pharmacies, and pickup centers.' })
  @ApiResponse({ status: 200, description: 'Pharmacy stats retrieved successfully' })
  async getPharmacyStats() {
    const stats = await this.pharmacyService.getPharmacyStats();
    return sendSuccessResponse('Pharmacy stats retrieved successfully', stats);
  }

  @Get('pharmacies/pickup-centers')
  @ApiOperation({ summary: 'Get pickup centers', description: 'Retrieve pharmacies designated as pickup centers. Supports geo-location filtering by state, city, coordinates, and radius for finding nearby pickup points in Nigeria.' })
  @ApiResponse({ status: 200, description: 'Pickup centers retrieved successfully' })
  @ApiQuery({ name: 'state', required: false, type: String, description: 'Filter by Nigerian state', example: 'Lagos' })
  @ApiQuery({ name: 'city', required: false, type: String, description: 'Filter by city', example: 'Ikeja' })
  @ApiQuery({ name: 'latitude', required: false, type: String, description: 'Latitude for geo-search', example: '6.5244' })
  @ApiQuery({ name: 'longitude', required: false, type: String, description: 'Longitude for geo-search', example: '3.3792' })
  @ApiQuery({ name: 'radius', required: false, type: String, description: 'Radius in km for geo-search', example: '10' })
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
  @ApiOperation({ summary: 'Generate slugs for pharmacies', description: 'Generate URL-friendly slugs for all existing pharmacies that do not yet have one. Used for SEO-friendly pharmacy profile URLs.' })
  @ApiResponse({ status: 200, description: 'Slugs generated successfully' })
  async generateSlugsForPharmacies() {
    const result = await this.pharmacyService.generateSlugsForExistingPharmacies();
    return sendSuccessResponse('Slugs generated successfully', result);
  }

  @Get('pharmacies/:id')
  @ApiOperation({ summary: 'Get pharmacy by ID', description: 'Retrieve a single pharmacy with full details including address, operating hours, verification status, documents, and contact information.' })
  @ApiResponse({ status: 200, description: 'Pharmacy retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiParam({ name: 'id', description: 'Pharmacy MongoDB ObjectId', example: '693f961ebb4dc1fec542610a' })
  async getPharmacyById(@Param('id') id: string) {
    const pharmacy = await this.pharmacyService.getPharmacyById(id);
    return sendSuccessResponse('Pharmacy retrieved successfully', pharmacy);
  }

  @Post('pharmacies')
  @ApiOperation({ summary: 'Create pharmacy', description: 'Register a new pharmacy with details including name, address, PCN license number, operating hours, and contact information.' })
  @ApiResponse({ status: 201, description: 'Pharmacy created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate pharmacy' })
  @ApiBody({ description: 'Pharmacy creation payload', schema: { type: 'object', properties: { name: { type: 'string', example: 'MedPlus Pharmacy Ikeja' }, address: { type: 'string', example: '12 Allen Avenue, Ikeja, Lagos' }, state: { type: 'string', example: 'Lagos' }, city: { type: 'string', example: 'Ikeja' }, phone: { type: 'string', example: '+2348012345678' }, email: { type: 'string', example: 'ikeja@medplus.ng' }, license_number: { type: 'string', example: 'PCN/2024/001234' }, is_pickup_center: { type: 'boolean', example: true } } } })
  async createPharmacy(@Body() body: any) {
    const pharmacy = await this.pharmacyService.createPharmacy(body);
    return sendSuccessResponse('Pharmacy created successfully', pharmacy);
  }

  @Patch('pharmacies/:id')
  @ApiOperation({ summary: 'Update pharmacy', description: 'Update pharmacy details such as name, address, operating hours, contact information, or pickup center status.' })
  @ApiResponse({ status: 200, description: 'Pharmacy updated successfully' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiParam({ name: 'id', description: 'Pharmacy MongoDB ObjectId', example: '693f961ebb4dc1fec542610a' })
  @ApiBody({ description: 'Pharmacy update payload', schema: { type: 'object', properties: { name: { type: 'string', example: 'MedPlus Pharmacy Victoria Island' }, address: { type: 'string', example: '5 Akin Adesola Street, VI, Lagos' }, phone: { type: 'string', example: '+2348098765432' }, is_online: { type: 'boolean', example: true } } } })
  async updatePharmacy(@Param('id') id: string, @Body() body: any) {
    const pharmacy = await this.pharmacyService.updatePharmacy(id, body);
    return sendSuccessResponse('Pharmacy updated successfully', pharmacy);
  }

  @Patch('pharmacies/:id/verify')
  @ApiOperation({ summary: 'Verify pharmacy', description: 'Update the verification status of a pharmacy after PCN/NAFDAC license and document review. Can set to verified, pending, or rejected.' })
  @ApiResponse({ status: 200, description: 'Pharmacy verification updated successfully' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiParam({ name: 'id', description: 'Pharmacy MongoDB ObjectId', example: '693f961ebb4dc1fec542610a' })
  @ApiBody({ description: 'Verification status update', schema: { type: 'object', required: ['verification_status'], properties: { verification_status: { type: 'string', example: 'verified', description: 'Verification status (pending, verified, rejected)' }, verification_notes: { type: 'string', example: 'PCN license verified, premises inspection passed', description: 'Notes about the verification decision' } } } })
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
  @ApiOperation({ summary: 'Suspend pharmacy', description: 'Suspend a pharmacy from operating on the platform. Requires a reason for suspension such as regulatory non-compliance or quality issues.' })
  @ApiResponse({ status: 200, description: 'Pharmacy suspended successfully' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiParam({ name: 'id', description: 'Pharmacy MongoDB ObjectId', example: '693f961ebb4dc1fec542610a' })
  @ApiBody({ description: 'Suspension reason', schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string', example: 'Failed NAFDAC compliance inspection - expired drugs found on shelf', description: 'Reason for suspension' } } } })
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
  @ApiOperation({ summary: 'Reactivate pharmacy', description: 'Reactivate a previously suspended pharmacy, restoring its ability to operate on the platform.' })
  @ApiResponse({ status: 200, description: 'Pharmacy reactivated successfully' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiParam({ name: 'id', description: 'Pharmacy MongoDB ObjectId', example: '693f961ebb4dc1fec542610a' })
  async reactivatePharmacy(@Param('id') id: string, @Req() req) {
    const pharmacy = await this.pharmacyService.reactivatePharmacy(
      id,
      req.user?.sub || req.user?._id,
    );
    return sendSuccessResponse('Pharmacy reactivated successfully', pharmacy);
  }

  @Delete('pharmacies/:id')
  @ApiOperation({ summary: 'Delete pharmacy', description: 'Permanently delete a pharmacy record. Ensure all associated orders and prescriptions are resolved before deletion.' })
  @ApiResponse({ status: 200, description: 'Pharmacy deleted successfully' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiParam({ name: 'id', description: 'Pharmacy MongoDB ObjectId', example: '693f961ebb4dc1fec542610a' })
  async deletePharmacy(@Param('id') id: string) {
    const result = await this.pharmacyService.deletePharmacy(id);
    return sendSuccessResponse('Pharmacy deleted successfully', result);
  }

  // ============ PHARMACY DOCUMENTS ============

  @Post('pharmacies/:id/documents')
  @ApiOperation({ summary: 'Upload pharmacy document', description: 'Upload a compliance document for a pharmacy such as PCN license, NAFDAC certificate, premises registration, or business permit. Max 10MB.' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'No file uploaded or file exceeds 10MB limit' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiParam({ name: 'id', description: 'Pharmacy MongoDB ObjectId', example: '693f961ebb4dc1fec542610a' })
  @ApiBody({ description: 'Document file and type', schema: { type: 'object', properties: { file: { type: 'string', format: 'binary', description: 'Document file (max 10MB)' }, document_type: { type: 'string', example: 'pcn_license', description: 'Type of document (pcn_license, nafdac_certificate, premises_registration, business_permit)' } } } })
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
  @ApiOperation({ summary: 'Remove pharmacy document', description: 'Remove a document from a pharmacy record by its index in the documents array.' })
  @ApiResponse({ status: 200, description: 'Document removed successfully' })
  @ApiResponse({ status: 404, description: 'Pharmacy or document not found' })
  @ApiParam({ name: 'id', description: 'Pharmacy MongoDB ObjectId', example: '693f961ebb4dc1fec542610a' })
  @ApiParam({ name: 'docIndex', description: 'Zero-based index of the document in the documents array', example: '0' })
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
  @ApiOperation({ summary: 'Verify pharmacy document', description: 'Approve or reject a pharmacy compliance document. Rejected documents require a rejection reason explaining what is wrong.' })
  @ApiResponse({ status: 200, description: 'Document verification updated' })
  @ApiResponse({ status: 404, description: 'Pharmacy or document not found' })
  @ApiParam({ name: 'id', description: 'Pharmacy MongoDB ObjectId', example: '693f961ebb4dc1fec542610a' })
  @ApiParam({ name: 'docIndex', description: 'Zero-based index of the document in the documents array', example: '0' })
  @ApiBody({ description: 'Document verification payload', schema: { type: 'object', required: ['verified'], properties: { verified: { type: 'boolean', example: true, description: 'Whether the document is verified/approved' }, rejection_reason: { type: 'string', example: 'PCN license number does not match registered name', description: 'Reason for rejection (required when verified is false)' } } } })
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
  @ApiOperation({ summary: 'Get pharmacy document URL', description: 'Generate a pre-signed S3 URL for viewing or downloading a pharmacy document. URL expires after a short period.' })
  @ApiResponse({ status: 200, description: 'Document URL generated' })
  @ApiResponse({ status: 404, description: 'Pharmacy or document not found' })
  @ApiParam({ name: 'id', description: 'Pharmacy MongoDB ObjectId', example: '693f961ebb4dc1fec542610a' })
  @ApiParam({ name: 'docIndex', description: 'Zero-based index of the document in the documents array', example: '0' })
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
  @ApiOperation({ summary: 'List all ratings', description: 'Retrieve paginated list of pharmacy and drug ratings from patients. Filter by type, minimum rating, or maximum rating.' })
  @ApiResponse({ status: 200, description: 'Ratings retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 25 })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by rating type (pharmacy, drug, order)', example: 'pharmacy' })
  @ApiQuery({ name: 'minRating', required: false, type: Number, description: 'Minimum rating filter (1-5)', example: 3 })
  @ApiQuery({ name: 'maxRating', required: false, type: Number, description: 'Maximum rating filter (1-5)', example: 5 })
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
  @ApiOperation({ summary: 'Get ratings statistics', description: 'Retrieve aggregate statistics for ratings including average rating, total reviews, rating distribution, and trends over time.' })
  @ApiResponse({ status: 200, description: 'Ratings stats retrieved successfully' })
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
  @ApiOperation({ summary: 'Get FDA safety sync stats', description: 'Retrieve statistics about drug safety data synchronization with OpenFDA including total synced, pending, last sync time, and error counts.' })
  @ApiResponse({ status: 200, description: 'Safety stats retrieved successfully' })
  async getSafetyStats() {
    const result = await this.openFDAService.getSyncStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get drug safety info for admin (includes all metadata)
   */
  @Get('drugs/:id/safety/admin')
  @ApiOperation({ summary: 'Get drug safety info (admin)', description: 'Retrieve full drug safety information from OpenFDA for admin review. Includes warnings, adverse reactions, contraindications, drug interactions, pregnancy info, boxed warnings, and custom admin overrides.' })
  @ApiResponse({ status: 200, description: 'Drug safety info retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found or safety data not synced' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getDrugSafetyInfoAdmin(@Param('id') id: string) {
    const result = await this.openFDAService.getSafetyInfo(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Sync safety info for a drug from FDA
   */
  @Post('drugs/:id/safety/sync')
  @ApiOperation({ summary: 'Sync drug safety info from FDA', description: 'Trigger a manual sync of safety information for a specific drug from the OpenFDA API. Updates warnings, adverse reactions, and label data.' })
  @ApiResponse({ status: 200, description: 'Safety information synced successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async syncDrugSafetyInfo(@Param('id') id: string) {
    const result = await this.openFDAService.triggerManualSync(id);
    return sendSuccessResponse('Safety information synced successfully', result);
  }

  /**
   * Generate AI summary for drug safety info
   * Uses Claude AI to create patient-friendly bullet points
   */
  @Post('drugs/:id/safety/ai-summary')
  @ApiOperation({ summary: 'Generate AI safety summary', description: 'Use Claude AI to generate patient-friendly bullet point summaries of drug safety information. Simplifies complex FDA label data into readable format.' })
  @ApiResponse({ status: 200, description: 'AI summary generated successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found or safety data not available' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async generateAISummary(@Param('id') id: string) {
    const result = await this.openFDAService.generateAISummary(id);
    return sendSuccessResponse('AI summary generated successfully', result);
  }

  /**
   * Check if AI summarization is available
   */
  @Get('drugs/admin/ai-status')
  @ApiOperation({ summary: 'Check AI availability', description: 'Check whether AI summarization service (Claude) is available and configured for generating drug safety summaries.' })
  @ApiResponse({ status: 200, description: 'AI status retrieved successfully' })
  async getAIStatus() {
    const isAvailable = this.openFDAService.isAIAvailable();
    return sendSuccessResponse(Messages.RETRIEVED, { ai_available: isAvailable });
  }

  /**
   * Update drug safety customizations
   */
  @Patch('drugs/:id/safety')
  @ApiOperation({ summary: 'Update drug safety customizations', description: 'Update custom safety warnings, side effects, admin notes, and display settings for a drug. Allows admins to supplement or override FDA data with Nigeria-specific safety information.' })
  @ApiResponse({ status: 200, description: 'Drug safety customizations updated successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ description: 'Safety customization payload', schema: { type: 'object', properties: { custom_warnings: { type: 'array', items: { type: 'object', properties: { title: { type: 'string', example: 'NAFDAC Advisory' }, content: { type: 'string', example: 'This drug has been flagged for counterfeit versions in Lagos market' }, severity: { type: 'string', enum: ['info', 'warning', 'danger'], example: 'warning' } } } }, custom_side_effects: { type: 'array', items: { type: 'object', properties: { name: { type: 'string', example: 'Drowsiness' }, frequency: { type: 'string', example: 'Common' }, severity: { type: 'string', example: 'Mild' }, description: { type: 'string', example: 'May cause drowsiness, avoid driving' } } } }, admin_notes: { type: 'string', example: 'Verify NAFDAC number before dispensing' }, display_settings: { type: 'object', properties: { show_adverse_reactions: { type: 'boolean' }, show_warnings: { type: 'boolean' }, show_boxed_warning: { type: 'boolean' }, show_contraindications: { type: 'boolean' }, show_drug_interactions: { type: 'boolean' }, show_pregnancy_info: { type: 'boolean' }, show_custom_warnings: { type: 'boolean' } } }, is_enabled: { type: 'boolean', example: true } } } })
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
  @ApiOperation({ summary: 'Trigger batch safety sync', description: 'Trigger a batch synchronization of safety data from OpenFDA for drugs that are due for update. Processes a configurable number of drugs per batch.' })
  @ApiResponse({ status: 200, description: 'Batch sync completed' })
  @ApiQuery({ name: 'batch_size', required: false, type: Number, description: 'Number of drugs to sync in this batch', example: 10 })
  async triggerBatchSync(@Query('batch_size') batchSize?: number) {
    const result = await this.openFDAService.syncDueForUpdate(batchSize || 10);
    return sendSuccessResponse('Batch sync completed', result);
  }

  // ============ SIMILAR DRUGS (Related Products) ============

  /**
   * Get a single drug by ID (for similar drugs dialog)
   */
  @Get('drugs/:id')
  @ApiOperation({ summary: 'Get drug by ID', description: 'Retrieve a single drug by its MongoDB ObjectId. Used by the similar drugs dialog to display drug details.' })
  @ApiResponse({ status: 200, description: 'Drug retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  async getDrugForSimilar(@Param('id') id: string) {
    const result = await this.pharmacyService.getDrugById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Search drugs for linking
   */
  @Get('drugs')
  @ApiOperation({ summary: 'Search drugs for linking', description: 'Search drugs by name for linking as similar or related products. Excludes a specified drug from results to prevent self-linking.' })
  @ApiResponse({ status: 200, description: 'Drug search results retrieved' })
  @ApiQuery({ name: 'query', required: true, type: String, description: 'Drug name search query', example: 'Paracetamol' })
  @ApiQuery({ name: 'exclude', required: false, type: String, description: 'Drug ObjectId to exclude from results (the source drug)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of results', example: 10 })
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
  @ApiOperation({ summary: 'Get similar drugs (admin)', description: 'Retrieve similar and related drugs for admin view. Shows auto-matched, manually linked, and excluded drugs in categorized groups.' })
  @ApiResponse({ status: 200, description: 'Similar drugs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiParam({ name: 'id', description: 'Drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of similar drugs to return', example: 50 })
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
  @ApiOperation({ summary: 'Link similar drug', description: 'Manually link two drugs as similar/related products. Creates a bidirectional relationship. E.g., linking Paracetamol 500mg to Panadol 500mg.' })
  @ApiResponse({ status: 200, description: 'Drug linked successfully' })
  @ApiResponse({ status: 404, description: 'Source or target drug not found' })
  @ApiParam({ name: 'id', description: 'Source drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ description: 'Target drug to link', schema: { type: 'object', required: ['target_drug_id'], properties: { target_drug_id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d2', description: 'ObjectId of the drug to link as similar' } } } })
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
  @ApiOperation({ summary: 'Unlink similar drug', description: 'Remove the manual similar/related link between two drugs. Removes the bidirectional relationship.' })
  @ApiResponse({ status: 200, description: 'Drug unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Drug or link not found' })
  @ApiParam({ name: 'id', description: 'Source drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiParam({ name: 'targetId', description: 'Target drug MongoDB ObjectId to unlink', example: '64f1a2b3c4d5e6f7a8b9c0d2' })
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
  @ApiOperation({ summary: 'Exclude drug from auto-matching', description: 'Exclude a drug from appearing in auto-matched similar drugs results. Useful when the algorithm incorrectly matches unrelated products.' })
  @ApiResponse({ status: 200, description: 'Drug excluded from similar' })
  @ApiResponse({ status: 404, description: 'Source or target drug not found' })
  @ApiParam({ name: 'id', description: 'Source drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiBody({ description: 'Target drug to exclude', schema: { type: 'object', required: ['target_drug_id'], properties: { target_drug_id: { type: 'string', example: '64f1a2b3c4d5e6f7a8b9c0d2', description: 'ObjectId of the drug to exclude from auto-matching' } } } })
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
  @ApiOperation({ summary: 'Remove exclusion', description: 'Remove a drug from the auto-matching exclusion list, allowing it to appear again in similar drugs auto-match results.' })
  @ApiResponse({ status: 200, description: 'Exclusion removed' })
  @ApiResponse({ status: 404, description: 'Drug or exclusion not found' })
  @ApiParam({ name: 'id', description: 'Source drug MongoDB ObjectId', example: '64f1a2b3c4d5e6f7a8b9c0d1' })
  @ApiParam({ name: 'targetId', description: 'Target drug MongoDB ObjectId to remove from exclusion', example: '64f1a2b3c4d5e6f7a8b9c0d2' })
  async removeExclusion(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ) {
    const result = await this.pharmacyService.removeExclusion(id, targetId);
    return sendSuccessResponse('Exclusion removed', result);
  }

  // ============ PHARMACY PERFORMANCE REPORT ============

  @Get(':pharmacyId/performance')
  @ApiOperation({ summary: 'Get pharmacy performance report', description: 'Retrieve a performance report for a specific pharmacy including order fulfillment rates, average processing time, revenue metrics, and customer satisfaction scores over a configurable period.' })
  @ApiResponse({ status: 200, description: 'Performance report retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiParam({ name: 'pharmacyId', description: 'Pharmacy MongoDB ObjectId', example: '693f961ebb4dc1fec542610a' })
  @ApiQuery({ name: 'period', required: false, type: String, description: 'Report period (e.g., 7d, 30d, 90d, 1y)', example: '30d' })
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
