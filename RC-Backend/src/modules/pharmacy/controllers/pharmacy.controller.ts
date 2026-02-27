import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PharmacyService } from '../services/pharmacy.service';
import {
  CreatePharmacyDto,
  UpdatePharmacyDto,
  SearchPharmaciesDto,
  VerifyPharmacyDto,
  SuspendPharmacyDto,
} from '../dto/pharmacy.dto';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Pharmacy - Pharmacies')
@Controller('pharmacy/pharmacies')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  // ============ PUBLIC ENDPOINTS ============

  /**
   * Search pharmacies - publicly accessible
   */
  @ApiOperation({ summary: 'Search pharmacies', description: 'Publicly accessible search across all pharmacies by name, location, services, or operating hours' })
  @ApiResponse({ status: 200, description: 'Pharmacies matching search criteria returned' })
  @Get('search')
  async search(@Query() searchDto: SearchPharmaciesDto) {
    const result = await this.pharmacyService.search(searchDto);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get pharmacies currently accepting orders
   */
  @ApiOperation({ summary: 'Get pharmacies accepting orders', description: 'Retrieve pharmacies that are currently online and accepting new orders' })
  @ApiResponse({ status: 200, description: 'List of pharmacies accepting orders' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page', example: 20 })
  @Get('accepting-orders')
  async getAcceptingOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.pharmacyService.getAcceptingOrders(page, limit);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get pharmacies by delivery zone
   */
  @ApiOperation({ summary: 'Get pharmacies by delivery zone', description: 'Retrieve pharmacies that deliver to a specific geographic zone or area' })
  @ApiResponse({ status: 200, description: 'Pharmacies serving the specified delivery zone' })
  @ApiParam({ name: 'zone', description: 'Delivery zone name or code', example: 'Lagos-Mainland' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page', example: 20 })
  @Get('delivery-zone/:zone')
  async getByDeliveryZone(
    @Param('zone') zone: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.pharmacyService.getByDeliveryZone(
      zone,
      page,
      limit,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get nearby pharmacies
   */
  @ApiOperation({ summary: 'Get nearby pharmacies', description: 'Find pharmacies near a geographic coordinate within a given radius (km)' })
  @ApiResponse({ status: 200, description: 'Nearby pharmacies sorted by distance' })
  @ApiQuery({ name: 'latitude', required: true, description: 'Latitude coordinate', example: 6.5244 })
  @ApiQuery({ name: 'longitude', required: true, description: 'Longitude coordinate', example: 3.3792 })
  @ApiQuery({ name: 'radius', required: false, description: 'Search radius in km (default: 10)', example: 10 })
  @ApiQuery({ name: 'limit', required: false, description: 'Max results to return', example: 20 })
  @Get('nearby')
  async getNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.pharmacyService.getNearby(
      latitude,
      longitude,
      radius,
      limit,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ PICKUP CENTER ENDPOINTS ============

  /**
   * Get available pickup centers
   * Patients can use this to find pharmacies where they can pick up their orders
   */
  @ApiOperation({ summary: 'Get pickup centers', description: 'Find available pharmacy pickup centers, optionally filtered by location, state, city, or refrigeration capability' })
  @ApiResponse({ status: 200, description: 'Pickup centers matching search criteria' })
  @ApiQuery({ name: 'latitude', required: false, description: 'Latitude for location-based search', example: '6.5244' })
  @ApiQuery({ name: 'longitude', required: false, description: 'Longitude for location-based search', example: '3.3792' })
  @ApiQuery({ name: 'radius', required: false, description: 'Search radius in km', example: '10' })
  @ApiQuery({ name: 'state', required: false, description: 'Filter by state', example: 'Lagos' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city', example: 'Ikeja' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: '1' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page', example: '20' })
  @ApiQuery({ name: 'accepts_refrigerated', required: false, description: 'Filter by refrigerated storage capability', example: 'true' })
  @Get('pickup-centers')
  async getPickupCenters(
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radius') radius?: string,
    @Query('state') state?: string,
    @Query('city') city?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('accepts_refrigerated') accepts_refrigerated?: string,
  ) {
    const result = await this.pharmacyService.getPickupCenters({
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      radiusKm: radius ? parseFloat(radius) : undefined,
      state,
      city,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      accepts_refrigerated: accepts_refrigerated === 'true' ? true : accepts_refrigerated === 'false' ? false : undefined,
    });
    return sendSuccessResponse('Pickup centers retrieved successfully', result);
  }

  /**
   * Get recommended pickup centers based on location
   */
  @ApiOperation({ summary: 'Recommend pickup centers', description: 'Get AI-ranked pickup center recommendations based on patient location and medication requirements' })
  @ApiResponse({ status: 200, description: 'Ranked list of recommended pickup centers' })
  @ApiQuery({ name: 'latitude', required: true, description: 'Patient latitude', example: '6.5244' })
  @ApiQuery({ name: 'longitude', required: true, description: 'Patient longitude', example: '3.3792' })
  @ApiQuery({ name: 'needs_refrigeration', required: false, description: 'Whether order requires cold-chain storage', example: 'false' })
  @ApiQuery({ name: 'limit', required: false, description: 'Max recommendations to return', example: '5' })
  @Get('pickup-centers/recommend')
  async recommendPickupCenters(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('needs_refrigeration') needs_refrigeration?: string,
    @Query('limit') limit?: string,
  ) {
    if (!latitude || !longitude) {
      return sendSuccessResponse('Location required for recommendations', []);
    }
    const result = await this.pharmacyService.recommendPickupCenters({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      needs_refrigeration: needs_refrigeration === 'true',
      limit: limit ? parseInt(limit) : 5,
    });
    return sendSuccessResponse('Pickup centers recommended successfully', result);
  }

  /**
   * Get a specific pickup center by ID
   */
  @ApiOperation({ summary: 'Get pickup center by ID', description: 'Retrieve details for a specific pharmacy pickup center' })
  @ApiResponse({ status: 200, description: 'Pickup center details returned' })
  @ApiResponse({ status: 404, description: 'Pickup center not found' })
  @ApiParam({ name: 'id', description: 'Pickup center ID', example: '507f1f77bcf86cd799439011' })
  @Get('pickup-centers/:id')
  async getPickupCenter(@Param('id') id: string) {
    const result = await this.pharmacyService.getPickupCenterById(id);
    return sendSuccessResponse('Pickup center retrieved successfully', result);
  }

  /**
   * Get a single pharmacy by ID
   */
  @ApiOperation({ summary: 'Get pharmacy by ID', description: 'Retrieve detailed information for a specific pharmacy' })
  @ApiResponse({ status: 200, description: 'Pharmacy details returned' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiParam({ name: 'id', description: 'Pharmacy ID', example: '507f1f77bcf86cd799439011' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.pharmacyService.findById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ AUTHENTICATED ENDPOINTS ============

  /**
   * Register a new pharmacy
   */
  @ApiOperation({ summary: 'Register pharmacy', description: 'Register a new pharmacy on the platform. Requires authentication.' })
  @ApiResponse({ status: 201, description: 'Pharmacy registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid pharmacy data' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createPharmacyDto: CreatePharmacyDto, @Request() req) {
    const result = await this.pharmacyService.create(
      createPharmacyDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  /**
   * Update pharmacy profile
   */
  @ApiOperation({ summary: 'Update pharmacy', description: 'Update pharmacy profile information such as name, address, operating hours, or services' })
  @ApiResponse({ status: 200, description: 'Pharmacy updated successfully' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePharmacyDto: UpdatePharmacyDto,
    @Request() req,
  ) {
    const result = await this.pharmacyService.update(
      id,
      updatePharmacyDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  /**
   * Set pharmacy online/offline status
   */
  @ApiOperation({ summary: 'Set online status', description: 'Toggle pharmacy online/offline status to control order acceptance' })
  @ApiResponse({ status: 200, description: 'Online status updated' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/online-status')
  async setOnlineStatus(
    @Param('id') id: string,
    @Body('is_online') isOnline: boolean,
    @Body('reason') reason?: string,
  ) {
    const result = await this.pharmacyService.setOnlineStatus(
      id,
      isOnline,
      reason,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Get all pharmacies (Admin)
   */
  @ApiOperation({ summary: 'Get all pharmacies (Admin)', description: 'Retrieve all registered pharmacies. Admin use for platform oversight.' })
  @ApiResponse({ status: 200, description: 'All pharmacies returned' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    const result = await this.pharmacyService.findAll();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get pharmacy statistics (Admin)
   */
  @ApiOperation({ summary: 'Get pharmacy statistics (Admin)', description: 'Retrieve aggregate pharmacy statistics including counts by status, verification, and activity metrics' })
  @ApiResponse({ status: 200, description: 'Pharmacy statistics returned' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('admin/statistics')
  async getStatistics() {
    const result = await this.pharmacyService.getStatistics();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Verify a pharmacy (Admin only)
   */
  @ApiOperation({ summary: 'Verify pharmacy (Admin)', description: 'Approve or reject a pharmacy verification application after reviewing submitted documents' })
  @ApiResponse({ status: 200, description: 'Pharmacy verification status updated' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/verify')
  async verify(
    @Param('id') id: string,
    @Body() verifyDto: VerifyPharmacyDto,
    @Request() req,
  ) {
    const result = await this.pharmacyService.verify(
      id,
      verifyDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  /**
   * Suspend a pharmacy (Admin only)
   */
  @ApiOperation({ summary: 'Suspend pharmacy (Admin)', description: 'Suspend a pharmacy with a reason. Suspended pharmacies cannot accept orders.' })
  @ApiResponse({ status: 200, description: 'Pharmacy suspended successfully' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/suspend')
  async suspend(
    @Param('id') id: string,
    @Body() suspendDto: SuspendPharmacyDto,
    @Request() req,
  ) {
    const result = await this.pharmacyService.suspend(
      id,
      suspendDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  /**
   * Reactivate a suspended pharmacy (Admin only)
   */
  @ApiOperation({ summary: 'Reactivate pharmacy (Admin)', description: 'Reactivate a previously suspended pharmacy, restoring its ability to accept orders' })
  @ApiResponse({ status: 200, description: 'Pharmacy reactivated successfully' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/reactivate')
  async reactivate(@Param('id') id: string, @Request() req) {
    const result = await this.pharmacyService.reactivate(id, req.user.sub);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  /**
   * Update pharmacy rating (Internal/System use)
   */
  @ApiOperation({ summary: 'Update pharmacy rating', description: 'Update a pharmacy aggregate rating. Typically called internally after a patient submits a rating.' })
  @ApiResponse({ status: 200, description: 'Pharmacy rating updated' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/rating')
  async updateRating(
    @Param('id') id: string,
    @Body('rating') rating: number,
  ) {
    const result = await this.pharmacyService.updateRating(id, rating);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  /**
   * Soft delete a pharmacy (Admin only)
   */
  @ApiOperation({ summary: 'Delete pharmacy (Admin)', description: 'Soft-delete a pharmacy. The record is preserved but marked as deleted and hidden from public searches.' })
  @ApiResponse({ status: 200, description: 'Pharmacy deleted successfully' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.pharmacyService.softDelete(id, req.user.sub);
    return sendSuccessResponse(Messages.DELETED, result);
  }
}
