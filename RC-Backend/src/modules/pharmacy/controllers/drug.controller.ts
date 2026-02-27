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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { DrugService } from '../services/drug.service';
import { OpenFDAService } from '../services/openfda.service';
import {
  CreateDrugDto,
  UpdateDrugDto,
  SearchDrugsDto,
} from '../dto/drug.dto';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Pharmacy - Drugs')
@Controller('pharmacy/drugs')
export class DrugController {
  constructor(
    private readonly drugService: DrugService,
    private readonly openFDAService: OpenFDAService,
  ) {}

  // ============ PUBLIC ENDPOINTS ============

  @ApiOperation({ summary: 'Search drugs', description: 'Search drugs by name, category, manufacturer, price range, etc. Publicly accessible.' })
  @ApiResponse({ status: 200, description: 'Paginated drug search results' })
  @Get('search')
  async search(@Query() searchDto: SearchDrugsDto) {
    const result = await this.drugService.search(searchDto);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get OTC drugs', description: 'Get over-the-counter drugs available for direct purchase without prescription' })
  @ApiResponse({ status: 200, description: 'Paginated list of OTC drugs' })
  @Get('otc')
  async getOTCDrugs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.drugService.getOTCDrugs(page, limit);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get drugs by category', description: 'Get drugs filtered by category with additional filtering and sorting options' })
  @ApiResponse({ status: 200, description: 'Paginated drugs in the specified category' })
  @Get('category/:category')
  async getByCategory(
    @Param('category') category: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
    @Query('available_only') availableOnly?: string,
    @Query('search') search?: string,
    @Query('otc_only') otcOnly?: string,
    @Query('prescription_only') prescriptionOnly?: string,
    @Query('min_price') minPrice?: number,
    @Query('max_price') maxPrice?: number,
  ) {
    const result = await this.drugService.getByCategory(
      category,
      page,
      limit,
      sort,
      availableOnly === 'true',
      {
        search,
        otcOnly: otcOnly === 'true',
        prescriptionOnly: prescriptionOnly === 'true',
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      },
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get featured drugs', description: 'Get drugs marked as featured for homepage or promotional display' })
  @ApiResponse({ status: 200, description: 'List of featured drugs' })
  @Get('featured')
  async getFeaturedDrugs(@Query('limit') limit?: number) {
    const result = await this.drugService.getFeaturedDrugs(limit);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get drug categories', description: 'Get all available drug categories with counts' })
  @ApiResponse({ status: 200, description: 'List of drug categories' })
  @Get('categories')
  async getCategories() {
    const result = await this.drugService.getCategories();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get manufacturers', description: 'Get all drug manufacturers in the system' })
  @ApiResponse({ status: 200, description: 'List of manufacturers' })
  @Get('manufacturers')
  async getManufacturers() {
    const result = await this.drugService.getManufacturers();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Search drugs by symptoms', description: 'Find drugs that treat specific symptoms (comma-separated list)' })
  @ApiResponse({ status: 200, description: 'Drugs matching the symptoms' })
  @Get('symptoms')
  async searchBySymptoms(
    @Query('symptoms') symptoms: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const symptomList = symptoms.split(',').map((s) => s.trim());
    const result = await this.drugService.searchBySymptoms(
      symptomList,
      page,
      limit,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ AUTHENTICATED ENDPOINTS ============

  @ApiOperation({ summary: 'Check drug interactions', description: 'Check for potential drug interactions between multiple drugs using AI and FDA data sources' })
  @ApiResponse({ status: 200, description: 'Drug interaction analysis results' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('check-interactions')
  async checkInteractions(
    @Body('drugIds') drugIds: string[],
    @Body('data_sources') dataSources?: string[],
  ) {
    // Default to claude_ai and openfda if not specified
    const sources = dataSources && dataSources.length > 0
      ? dataSources as ('claude_ai' | 'openfda' | 'rxnav')[]
      : ['claude_ai', 'openfda'] as ('claude_ai' | 'openfda' | 'rxnav')[];
    const result = await this.drugService.checkInteractions(drugIds, sources as any);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get interaction settings', description: 'Get drug interaction check configuration for the patient UI' })
  @ApiResponse({ status: 200, description: 'Interaction settings returned' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('interaction-settings')
  async getInteractionSettings() {
    // Return default settings - can be made configurable via admin later
    const settings = {
      enabled_for_patients: true,
      data_sources: ['claude_ai', 'openfda'],
      show_severity_levels: true,
      show_disclaimer: true,
    };
    return sendSuccessResponse(Messages.RETRIEVED, settings);
  }

  // ============ ADMIN ENDPOINTS ============

  @ApiOperation({ summary: 'Create drug', description: 'Create a new drug in the pharmacy catalog (Admin only)' })
  @ApiResponse({ status: 201, description: 'Drug created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid drug data or duplicate drug' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createDrugDto: CreateDrugDto, @Request() req) {
    const result = await this.drugService.create(createDrugDto, req.user.sub);
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Get all drugs', description: 'Get all drugs in the catalog (Admin)' })
  @ApiResponse({ status: 200, description: 'List of all drugs' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    const result = await this.drugService.findAll();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get drug statistics', description: 'Get drug catalog statistics — counts by category, status, etc. (Admin)' })
  @ApiResponse({ status: 200, description: 'Drug statistics returned' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('admin/statistics')
  async getStatistics() {
    const result = await this.drugService.getStatistics();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get drug by ID', description: 'Get a single drug with full details' })
  @ApiResponse({ status: 200, description: 'Drug details returned' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.drugService.findById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Update drug', description: 'Update an existing drug in the catalog (Admin only)' })
  @ApiResponse({ status: 200, description: 'Drug updated successfully' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDrugDto: UpdateDrugDto,
    @Request() req,
  ) {
    const result = await this.drugService.update(
      id,
      updateDrugDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Soft delete drug', description: 'Soft delete a drug — marks as inactive but preserves data (Admin only)' })
  @ApiResponse({ status: 200, description: 'Drug soft deleted' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.drugService.softDelete(id, req.user.sub);
    return sendSuccessResponse(Messages.DELETED, result);
  }

  @ApiOperation({ summary: 'Permanently delete drug', description: 'Hard delete a drug — permanently removes from database. Use with caution. (Admin only)' })
  @ApiResponse({ status: 200, description: 'Drug permanently deleted' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete(':id/permanent')
  async permanentRemove(@Param('id') id: string) {
    await this.drugService.hardDelete(id);
    return sendSuccessResponse(Messages.DELETED, null);
  }

  // ============ DRUG SAFETY INFORMATION ENDPOINTS ============

  @ApiOperation({ summary: 'Get drug safety info', description: 'Get drug safety information for patient display — includes FDA data and AI summary if available' })
  @ApiResponse({ status: 200, description: 'Drug safety information returned' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  @Get(':id/safety')
  async getDrugSafetyInfo(@Param('id') id: string) {
    const result = await this.openFDAService.getSafetyInfoForPatientWithAI(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get drug safety info (admin)', description: 'Get full drug safety info including admin customizations and sync metadata (Admin only)' })
  @ApiResponse({ status: 200, description: 'Full drug safety information with admin data' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':id/safety/admin')
  async getDrugSafetyInfoAdmin(@Param('id') id: string) {
    const result = await this.openFDAService.getSafetyInfo(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Sync drug safety info from FDA', description: 'Trigger immediate sync of drug safety data from OpenFDA API (Admin only)' })
  @ApiResponse({ status: 200, description: 'Safety information synced successfully' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post(':id/safety/sync')
  async syncDrugSafetyInfo(@Param('id') id: string) {
    const result = await this.openFDAService.triggerManualSync(id);
    return sendSuccessResponse('Safety information synced successfully', result);
  }

  @ApiOperation({ summary: 'Generate AI safety summary', description: 'Use AI to generate patient-friendly bullet-point safety summary (Admin only)' })
  @ApiResponse({ status: 200, description: 'AI summary generated successfully' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post(':id/safety/ai-summary')
  async generateAISummary(@Param('id') id: string) {
    const result = await this.openFDAService.generateAISummary(id);
    return sendSuccessResponse('AI summary generated successfully', result);
  }

  // ============ SIMILAR DRUGS ENDPOINTS ============

  @ApiOperation({ summary: 'Get similar drugs', description: 'Get drugs similar to this one — matched by generic name, category, and manual links' })
  @ApiResponse({ status: 200, description: 'List of similar drugs' })
  @Get(':id/similar')
  async getSimilarDrugs(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.drugService.getSimilarDrugsFlat(id, limit || 8);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get similar drugs breakdown (admin)', description: 'Get categorized similar drugs: generic_matches, category_matches, manually_linked (Admin only)' })
  @ApiResponse({ status: 200, description: 'Detailed similar drugs breakdown' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get(':id/similar/admin')
  async getSimilarDrugsAdmin(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.drugService.getSimilarDrugs(id, limit || 20);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Link similar drug', description: 'Manually link a drug as similar to this one (Admin only)' })
  @ApiResponse({ status: 200, description: 'Drug linked successfully' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post(':id/similar/link')
  async linkSimilarDrug(
    @Param('id') id: string,
    @Body('target_drug_id') targetDrugId: string,
  ) {
    const result = await this.drugService.linkSimilarDrug(id, targetDrugId);
    return sendSuccessResponse('Drug linked successfully', result);
  }

  @ApiOperation({ summary: 'Unlink similar drug', description: 'Remove a manually linked similar drug (Admin only)' })
  @ApiResponse({ status: 200, description: 'Drug unlinked successfully' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete(':id/similar/unlink/:targetId')
  async unlinkSimilarDrug(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ) {
    const result = await this.drugService.unlinkSimilarDrug(id, targetId);
    return sendSuccessResponse('Drug unlinked successfully', result);
  }

  @ApiOperation({ summary: 'Exclude from auto-matching', description: 'Exclude a drug from auto-similar matching results (Admin only)' })
  @ApiResponse({ status: 200, description: 'Drug excluded from similar' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post(':id/similar/exclude')
  async excludeSimilarDrug(
    @Param('id') id: string,
    @Body('target_drug_id') targetDrugId: string,
  ) {
    const result = await this.drugService.excludeSimilarDrug(id, targetDrugId);
    return sendSuccessResponse('Drug excluded from similar', result);
  }

  @ApiOperation({ summary: 'Remove exclusion', description: 'Remove a drug from the exclusion list so it can appear in auto-match results again (Admin only)' })
  @ApiResponse({ status: 200, description: 'Exclusion removed' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Delete(':id/similar/exclude/:targetId')
  async removeExclusion(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ) {
    const result = await this.drugService.removeExclusion(id, targetId);
    return sendSuccessResponse('Exclusion removed', result);
  }

  @ApiOperation({ summary: 'Check AI availability', description: 'Check if AI summarization is available for drug safety info (Admin only)' })
  @ApiResponse({ status: 200, description: 'AI availability status' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('admin/ai-status')
  async getAIStatus() {
    const isAvailable = this.openFDAService.isAIAvailable();
    return sendSuccessResponse(Messages.RETRIEVED, { ai_available: isAvailable });
  }

  @ApiOperation({ summary: 'Update drug safety customizations', description: 'Update custom warnings, side effects, and display settings for drug safety info (Admin only)' })
  @ApiResponse({ status: 200, description: 'Safety customizations updated' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/safety')
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
    @Request() req,
  ) {
    const result = await this.openFDAService.updateCustomizations(
      id,
      updateDto,
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Get FDA sync statistics', description: 'Get statistics about drug safety data synchronization with OpenFDA (Admin only)' })
  @ApiResponse({ status: 200, description: 'Sync statistics returned' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('admin/safety-stats')
  async getSafetyStats() {
    const result = await this.openFDAService.getSyncStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Trigger batch safety sync', description: 'Trigger batch sync for drugs due for OpenFDA safety data update (Admin only)' })
  @ApiResponse({ status: 200, description: 'Batch sync completed' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post('admin/safety-sync-batch')
  async triggerBatchSync(@Query('batch_size') batchSize?: number) {
    const result = await this.openFDAService.syncDueForUpdate(batchSize || 10);
    return sendSuccessResponse('Batch sync completed', result);
  }
}
