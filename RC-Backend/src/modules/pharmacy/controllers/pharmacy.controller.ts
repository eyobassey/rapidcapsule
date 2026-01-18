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

@Controller('pharmacy/pharmacies')
export class PharmacyController {
  constructor(private readonly pharmacyService: PharmacyService) {}

  // ============ PUBLIC ENDPOINTS ============

  /**
   * Search pharmacies - publicly accessible
   */
  @Get('search')
  async search(@Query() searchDto: SearchPharmaciesDto) {
    const result = await this.pharmacyService.search(searchDto);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get pharmacies currently accepting orders
   */
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
  @Get('pickup-centers/:id')
  async getPickupCenter(@Param('id') id: string) {
    const result = await this.pharmacyService.getPickupCenterById(id);
    return sendSuccessResponse('Pickup center retrieved successfully', result);
  }

  /**
   * Get a single pharmacy by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.pharmacyService.findById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ AUTHENTICATED ENDPOINTS ============

  /**
   * Register a new pharmacy
   */
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
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    const result = await this.pharmacyService.findAll();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get pharmacy statistics (Admin)
   */
  @UseGuards(JwtAuthGuard)
  @Get('admin/statistics')
  async getStatistics() {
    const result = await this.pharmacyService.getStatistics();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Verify a pharmacy (Admin only)
   */
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
  @UseGuards(JwtAuthGuard)
  @Patch(':id/reactivate')
  async reactivate(@Param('id') id: string, @Request() req) {
    const result = await this.pharmacyService.reactivate(id, req.user.sub);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  /**
   * Update pharmacy rating (Internal/System use)
   */
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
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.pharmacyService.softDelete(id, req.user.sub);
    return sendSuccessResponse(Messages.DELETED, result);
  }
}
