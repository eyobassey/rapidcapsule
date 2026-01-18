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

@Controller('pharmacy/drugs')
export class DrugController {
  constructor(
    private readonly drugService: DrugService,
    private readonly openFDAService: OpenFDAService,
  ) {}

  // ============ PUBLIC ENDPOINTS ============

  /**
   * Search drugs - publicly accessible
   */
  @Get('search')
  async search(@Query() searchDto: SearchDrugsDto) {
    const result = await this.drugService.search(searchDto);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get OTC drugs for direct purchase
   */
  @Get('otc')
  async getOTCDrugs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.drugService.getOTCDrugs(page, limit);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get drugs by category with filtering support
   */
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

  /**
   * Get featured drugs
   */
  @Get('featured')
  async getFeaturedDrugs(@Query('limit') limit?: number) {
    const result = await this.drugService.getFeaturedDrugs(limit);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get all drug categories
   */
  @Get('categories')
  async getCategories() {
    const result = await this.drugService.getCategories();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get all manufacturers
   */
  @Get('manufacturers')
  async getManufacturers() {
    const result = await this.drugService.getManufacturers();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Search drugs by symptoms
   */
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

  /**
   * Get a single drug by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.drugService.findById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ AUTHENTICATED ENDPOINTS ============

  /**
   * Check drug interactions using configured data sources
   * @param drugIds Array of drug IDs to check
   * @param data_sources Optional array of data sources to use ('claude_ai', 'openfda', 'rxnav')
   */
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

  // ============ ADMIN ENDPOINTS ============

  /**
   * Create a new drug (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createDrugDto: CreateDrugDto, @Request() req) {
    const result = await this.drugService.create(createDrugDto, req.user.sub);
    return sendSuccessResponse(Messages.CREATED, result);
  }

  /**
   * Get all drugs (Admin)
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll() {
    const result = await this.drugService.findAll();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get drug statistics (Admin)
   */
  @UseGuards(JwtAuthGuard)
  @Get('admin/statistics')
  async getStatistics() {
    const result = await this.drugService.getStatistics();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Update a drug (Admin only)
   */
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

  /**
   * Soft delete a drug (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.drugService.softDelete(id, req.user.sub);
    return sendSuccessResponse(Messages.DELETED, result);
  }

  /**
   * Hard delete a drug (Admin only - use with caution)
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/permanent')
  async permanentRemove(@Param('id') id: string) {
    await this.drugService.hardDelete(id);
    return sendSuccessResponse(Messages.DELETED, null);
  }

  // ============ DRUG SAFETY INFORMATION ENDPOINTS ============

  /**
   * Get drug safety info for patient display
   * Public endpoint - returns AI summary (if available) + full info
   */
  @Get(':id/safety')
  async getDrugSafetyInfo(@Param('id') id: string) {
    const result = await this.openFDAService.getSafetyInfoForPatientWithAI(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get full drug safety info (Admin only)
   * Returns all data including admin customizations and sync metadata
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/safety/admin')
  async getDrugSafetyInfoAdmin(@Param('id') id: string) {
    const result = await this.openFDAService.getSafetyInfo(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Initialize/Sync safety info for a drug from FDA (Admin only)
   * Triggers immediate sync with OpenFDA API
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/safety/sync')
  async syncDrugSafetyInfo(@Param('id') id: string) {
    const result = await this.openFDAService.triggerManualSync(id);
    return sendSuccessResponse('Safety information synced successfully', result);
  }

  /**
   * Generate AI summary for drug safety info (Admin only)
   * Uses Claude AI to create patient-friendly bullet points
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/safety/ai-summary')
  async generateAISummary(@Param('id') id: string) {
    const result = await this.openFDAService.generateAISummary(id);
    return sendSuccessResponse('AI summary generated successfully', result);
  }

  // ============ SIMILAR DRUGS ENDPOINTS ============

  /**
   * Get similar drugs for patient display
   * Returns drugs matching by: generic name, category, and manual links
   */
  @Get(':id/similar')
  async getSimilarDrugs(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.drugService.getSimilarDrugsFlat(id, limit || 8);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get detailed similar drugs breakdown (Admin only)
   * Returns categorized results: generic_matches, category_matches, manually_linked
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/similar/admin')
  async getSimilarDrugsAdmin(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    const result = await this.drugService.getSimilarDrugs(id, limit || 20);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Manually link a drug as similar (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/similar/link')
  async linkSimilarDrug(
    @Param('id') id: string,
    @Body('target_drug_id') targetDrugId: string,
  ) {
    const result = await this.drugService.linkSimilarDrug(id, targetDrugId);
    return sendSuccessResponse('Drug linked successfully', result);
  }

  /**
   * Unlink a drug from similar (Admin only)
   * This removes from manually_linked_drugs
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/similar/unlink/:targetId')
  async unlinkSimilarDrug(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ) {
    const result = await this.drugService.unlinkSimilarDrug(id, targetId);
    return sendSuccessResponse('Drug unlinked successfully', result);
  }

  /**
   * Exclude a drug from auto-matching (Admin only)
   * This adds to excluded_similar_drugs - removes from auto-match results
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/similar/exclude')
  async excludeSimilarDrug(
    @Param('id') id: string,
    @Body('target_drug_id') targetDrugId: string,
  ) {
    const result = await this.drugService.excludeSimilarDrug(id, targetDrugId);
    return sendSuccessResponse('Drug excluded from similar', result);
  }

  /**
   * Remove a drug from exclusion list (Admin only)
   * This allows the drug to appear in auto-match results again
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/similar/exclude/:targetId')
  async removeExclusion(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ) {
    const result = await this.drugService.removeExclusion(id, targetId);
    return sendSuccessResponse('Exclusion removed', result);
  }

  /**
   * Check if AI summarization is available
   */
  @UseGuards(JwtAuthGuard)
  @Get('admin/ai-status')
  async getAIStatus() {
    const isAvailable = this.openFDAService.isAIAvailable();
    return sendSuccessResponse(Messages.RETRIEVED, { ai_available: isAvailable });
  }

  /**
   * Update drug safety customizations (Admin only)
   * Update custom warnings, side effects, display settings
   */
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

  /**
   * Get FDA sync statistics (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Get('admin/safety-stats')
  async getSafetyStats() {
    const result = await this.openFDAService.getSyncStats();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Trigger batch sync for drugs due for update (Admin only)
   */
  @UseGuards(JwtAuthGuard)
  @Post('admin/safety-sync-batch')
  async triggerBatchSync(@Query('batch_size') batchSize?: number) {
    const result = await this.openFDAService.syncDueForUpdate(batchSize || 10);
    return sendSuccessResponse('Batch sync completed', result);
  }
}
