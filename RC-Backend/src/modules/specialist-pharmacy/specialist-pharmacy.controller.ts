import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SpecialistPharmacyService } from './specialist-pharmacy.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  PatientSearchQueryDto,
  DrugCatalogQueryDto,
  DrugBatchQueryDto,
  CreateDeliveryAddressDto,
  UpdateDeliveryAddressDto,
} from './dto/specialist-pharmacy.dto';

@UseGuards(JwtAuthGuard)
@Controller('specialist/pharmacy')
export class SpecialistPharmacyController {
  constructor(
    private readonly pharmacyService: SpecialistPharmacyService,
  ) {}

  // ============ DASHBOARD ============

  /**
   * GET /api/specialist/pharmacy/dashboard
   * Get dashboard statistics
   */
  @Get('dashboard')
  async getDashboard(@Request() req) {
    const result = await this.pharmacyService.getDashboardStats(
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ PATIENT ENDPOINTS ============

  /**
   * GET /api/specialist/pharmacy/patients
   * Search patients
   */
  @Get('patients')
  async searchPatients(
    @Request() req,
    @Query() query: PatientSearchQueryDto,
  ) {
    const result = await this.pharmacyService.searchPatients(
      new Types.ObjectId(req.user.sub),
      query,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/patients/:id
   * Get patient details
   */
  @Get('patients/:id')
  async getPatientDetails(
    @Request() req,
    @Param('id') id: string,
  ) {
    const result = await this.pharmacyService.getPatientDetails(
      new Types.ObjectId(req.user.sub),
      new Types.ObjectId(id),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/patients/:id/medical-history
   * Get patient medical history
   */
  @Get('patients/:id/medical-history')
  async getPatientMedicalHistory(@Param('id') id: string) {
    const result = await this.pharmacyService.getPatientMedicalHistory(
      new Types.ObjectId(id),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/patients/:id/prescriptions
   * Get patient prescription history from this specialist
   */
  @Get('patients/:id/prescriptions')
  async getPatientPrescriptions(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.pharmacyService.getPatientPrescriptions(
      new Types.ObjectId(req.user.sub),
      new Types.ObjectId(id),
      page || 1,
      limit || 20,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/patients/:id/vitals
   * Get patient vital signs
   */
  @Get('patients/:id/vitals')
  async getPatientVitals(@Param('id') id: string) {
    const result = await this.pharmacyService.getPatientVitals(
      new Types.ObjectId(id),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/patients/:id/health-checkups
   * Get patient health checkup history
   */
  @Get('patients/:id/health-checkups')
  async getPatientHealthCheckups(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.pharmacyService.getPatientHealthCheckups(
      new Types.ObjectId(id),
      limit ? parseInt(limit, 10) : 5,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ DRUG CATALOG ENDPOINTS ============

  /**
   * GET /api/specialist/pharmacy/drugs
   * Search drug catalog
   */
  @Get('drugs')
  async searchDrugs(@Query() query: DrugCatalogQueryDto) {
    const result = await this.pharmacyService.searchDrugs(query);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/drugs/categories
   * Get drug categories
   */
  @Get('drugs/categories')
  async getDrugCategories() {
    const result = await this.pharmacyService.getDrugCategories();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/drugs/manufacturers
   * Get manufacturers
   */
  @Get('drugs/manufacturers')
  async getManufacturers() {
    const result = await this.pharmacyService.getManufacturers();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/drugs/:id
   * Get drug details with availability
   * Optional query param: batch_id to show specific batch data
   */
  @Get('drugs/:id')
  async getDrugDetails(
    @Param('id') id: string,
    @Query('batch_id') batchId?: string,
  ) {
    const result = await this.pharmacyService.getDrugDetails(
      new Types.ObjectId(id),
      batchId ? new Types.ObjectId(batchId) : undefined,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/drugs/:id/batches
   * Get available batches for a drug
   */
  @Get('drugs/:id/batches')
  async getDrugBatches(
    @Param('id') id: string,
    @Query() query: DrugBatchQueryDto,
  ) {
    const result = await this.pharmacyService.getDrugBatches(
      new Types.ObjectId(id),
      query,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ DELIVERY ADDRESS ENDPOINTS ============

  /**
   * GET /api/specialist/pharmacy/patients/:id/addresses
   * Get all delivery addresses for a patient
   */
  @Get('patients/:id/addresses')
  async getPatientAddresses(@Param('id') id: string) {
    const result = await this.pharmacyService.getPatientDeliveryAddresses(
      new Types.ObjectId(id),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * POST /api/specialist/pharmacy/patients/:id/addresses
   * Add a new delivery address for a patient
   */
  @Post('patients/:id/addresses')
  async addPatientAddress(
    @Param('id') id: string,
    @Body() dto: CreateDeliveryAddressDto,
  ) {
    const result = await this.pharmacyService.addPatientDeliveryAddress(
      new Types.ObjectId(id),
      dto,
    );
    return sendSuccessResponse('Address added successfully', result);
  }

  /**
   * PATCH /api/specialist/pharmacy/patients/:id/addresses/:addressId
   * Update a delivery address
   */
  @Patch('patients/:id/addresses/:addressId')
  async updatePatientAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateDeliveryAddressDto,
  ) {
    const result = await this.pharmacyService.updatePatientDeliveryAddress(
      new Types.ObjectId(id),
      new Types.ObjectId(addressId),
      dto,
    );
    return sendSuccessResponse('Address updated successfully', result);
  }

  /**
   * DELETE /api/specialist/pharmacy/patients/:id/addresses/:addressId
   * Delete a delivery address
   */
  @Delete('patients/:id/addresses/:addressId')
  async deletePatientAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    const result = await this.pharmacyService.deletePatientDeliveryAddress(
      new Types.ObjectId(id),
      new Types.ObjectId(addressId),
    );
    return sendSuccessResponse('Address deleted successfully', result);
  }

  /**
   * PATCH /api/specialist/pharmacy/patients/:id/addresses/:addressId/default
   * Set an address as default
   */
  @Patch('patients/:id/addresses/:addressId/default')
  async setDefaultAddress(
    @Param('id') id: string,
    @Param('addressId') addressId: string,
  ) {
    const result = await this.pharmacyService.setDefaultDeliveryAddress(
      new Types.ObjectId(id),
      new Types.ObjectId(addressId),
    );
    return sendSuccessResponse('Default address set successfully', result);
  }
}
