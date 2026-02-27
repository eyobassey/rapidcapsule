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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
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

@ApiTags('Pharmacy (Specialist)')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Get pharmacy dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Search and list patients' })
  @ApiResponse({ status: 200, description: 'Patient list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get patient details by ID' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Patient details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
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
  @ApiOperation({ summary: 'Get patient medical history' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Medical history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
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
  @ApiOperation({ summary: 'Get patient prescription history' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page', example: 20 })
  @ApiResponse({ status: 200, description: 'Prescription history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
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
  @ApiOperation({ summary: 'Get patient vital signs' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Vital signs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @Get('patients/:id/vitals')
  async getPatientVitals(@Param('id') id: string) {
    const result = await this.pharmacyService.getPatientVitals(
      new Types.ObjectId(id),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/patients/:id/health-checkups
   * Get patient health checkup history with pagination
   */
  @ApiOperation({ summary: 'Get patient health checkup history' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page', example: 10 })
  @ApiResponse({ status: 200, description: 'Health checkup history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @Get('patients/:id/health-checkups')
  async getPatientHealthCheckups(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.pharmacyService.getPatientHealthCheckups(
      new Types.ObjectId(id),
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/health-checkups/:id
   * Get detailed health checkup by ID with full AI assessment
   */
  @ApiOperation({ summary: 'Get health checkup details with full AI assessment' })
  @ApiParam({ name: 'id', description: 'Health checkup ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Health checkup details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Health checkup not found' })
  @Get('health-checkups/:id')
  async getHealthCheckupDetails(@Param('id') id: string) {
    const result = await this.pharmacyService.getHealthCheckupDetails(
      new Types.ObjectId(id),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/patients/:id/appointments
   * Get patient appointment history (all specialists)
   * Query params: page, limit, status, sort
   */
  @ApiOperation({ summary: 'Get patient appointment history' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page', example: 10 })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by appointment status', example: 'completed' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sort order by date', enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({ status: 200, description: 'Appointment history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @Get('patients/:id/appointments')
  async getPatientAppointments(
    @Request() req,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    const result = await this.pharmacyService.getPatientAppointments(
      new Types.ObjectId(req.user.sub),
      new Types.ObjectId(id),
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      status,
      sort || 'desc',
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/patients/:id/health-scores
   * Get patient health scores (basic and advanced)
   */
  @ApiOperation({ summary: 'Get patient health scores' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Health scores retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @Get('patients/:id/health-scores')
  async getPatientHealthScores(@Param('id') id: string) {
    const result = await this.pharmacyService.getPatientHealthScores(
      new Types.ObjectId(id),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/patients/:id/vitals/:type
   * Get patient vitals history for a specific vital type
   */
  @ApiOperation({ summary: 'Get patient vital history by type' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'type', description: 'Vital sign type (e.g., blood_pressure, heart_rate, temperature)', example: 'blood_pressure' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of records to return', example: 30 })
  @ApiResponse({ status: 200, description: 'Vital history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @Get('patients/:id/vitals/:type')
  async getPatientVitalsHistory(
    @Param('id') id: string,
    @Param('type') type: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.pharmacyService.getPatientVitalsHistory(
      new Types.ObjectId(id),
      type,
      limit ? parseInt(limit, 10) : 30,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ DRUG CATALOG ENDPOINTS ============

  /**
   * GET /api/specialist/pharmacy/drugs
   * Search drug catalog
   */
  @ApiOperation({ summary: 'Search and browse the drug catalog' })
  @ApiResponse({ status: 200, description: 'Drug catalog results retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('drugs')
  async searchDrugs(@Query() query: DrugCatalogQueryDto) {
    const result = await this.pharmacyService.searchDrugs(query);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/drugs/categories
   * Get drug categories
   */
  @ApiOperation({ summary: 'Get all drug categories' })
  @ApiResponse({ status: 200, description: 'Drug categories retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('drugs/categories')
  async getDrugCategories() {
    const result = await this.pharmacyService.getDrugCategories();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/pharmacy/drugs/manufacturers
   * Get manufacturers
   */
  @ApiOperation({ summary: 'Get all drug manufacturers' })
  @ApiResponse({ status: 200, description: 'Manufacturer list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get drug details with availability info' })
  @ApiParam({ name: 'id', description: 'Drug ID', example: '507f1f77bcf86cd799439011' })
  @ApiQuery({ name: 'batch_id', required: false, description: 'Specific batch ID to include batch-level data', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'Drug details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
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
  @ApiOperation({ summary: 'Get available stock batches for a drug' })
  @ApiParam({ name: 'id', description: 'Drug ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Drug batches retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
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
  @ApiOperation({ summary: 'Get all delivery addresses for a patient' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Delivery addresses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
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
  @ApiOperation({ summary: 'Add a new delivery address for a patient' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 201, description: 'Delivery address added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid address data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
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
  @ApiOperation({ summary: 'Update a delivery address' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'addressId', description: 'Address ID to update', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'Delivery address updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid address data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Address or patient not found' })
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
  @ApiOperation({ summary: 'Delete a delivery address' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'addressId', description: 'Address ID to delete', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'Delivery address deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Address or patient not found' })
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
  @ApiOperation({ summary: 'Set an address as the default delivery address' })
  @ApiParam({ name: 'id', description: 'Patient ID', example: '507f1f77bcf86cd799439011' })
  @ApiParam({ name: 'addressId', description: 'Address ID to set as default', example: '507f1f77bcf86cd799439012' })
  @ApiResponse({ status: 200, description: 'Default address set successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Address or patient not found' })
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
