import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  UseGuards,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateAdminSettingDto } from './dto/update-admin-setting.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { AddRateDto } from './dto/add-rate.dto';
import { Types } from 'mongoose';
import { UpdateRateDto } from './dto/update-rate.dto';
import { RateAdvancedFilterDto } from './dto/rate-advanced-filter.dto';
import { UpdateSplitRatioDto } from './dto/update-split-ratio.dto';
import { AddSplitRatioDto } from './dto/add-split-ratio.dto';

@ApiTags('Admin Settings')
@ApiBearerAuth('JWT-auth')
@Controller('settings')
export class SettingsController {
  constructor(private readonly adminSettingsService: SettingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create admin settings', description: 'Initialise the global admin settings document with default values for payment provider, rates, and split ratios.' })
  @ApiResponse({ status: 201, description: 'Admin settings document created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async create() {
    const result = await this.adminSettingsService.create();
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Get()
  @ApiOperation({ summary: 'Get admin settings', description: 'Retrieve the current global admin settings including payment provider, specialist rates, and split ratios.' })
  @ApiResponse({ status: 200, description: 'Admin settings retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async findOne() {
    const result = await this.adminSettingsService.findOne();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('rates')
  @ApiOperation({ summary: 'Get specialist rates', description: 'Retrieve specialist consultation rates with optional filtering by category, specialization, and rate range.' })
  @ApiResponse({ status: 200, description: 'Specialist rates retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getRates(@Query() rateAdvancedFilterDto: RateAdvancedFilterDto) {
    const result = await this.adminSettingsService.getRates(
      rateAdvancedFilterDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('rates')
  @ApiOperation({ summary: 'Add specialist rate', description: 'Add a new specialist consultation rate for a given category and specialization (e.g. Cardiology at NGN 15,000 per session).' })
  @ApiResponse({ status: 201, description: 'Specialist rate added successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async addRate(@Body() addRateDto: AddRateDto) {
    const result = await this.adminSettingsService.addRate(addRateDto);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Patch('rates')
  @ApiOperation({ summary: 'Update specialist rate', description: 'Update an existing specialist consultation rate by its ID, including category, specialization, and rate amount.' })
  @ApiResponse({ status: 200, description: 'Specialist rate updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Rate not found.' })
  async updateRate(@Body() updateRateDto: UpdateRateDto) {
    const result = await this.adminSettingsService.updateRate(updateRateDto);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Delete('rates/:id')
  @ApiOperation({ summary: 'Delete specialist rate', description: 'Remove a specialist consultation rate from the system by its ID.' })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectId of the rate to delete', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Specialist rate deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Rate not found.' })
  async removeRate(@Param('id') id: Types.ObjectId) {
    const result = await this.adminSettingsService.deleteRate(id);
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Patch()
  @ApiOperation({ summary: 'Update default settings', description: 'Update the global default admin settings such as the payment provider (Paystack, Flutterwave, or Stripe).' })
  @ApiResponse({ status: 200, description: 'Default settings updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async updateDefaults(@Body() updateAdminSettingDto: UpdateAdminSettingDto) {
    const result = await this.adminSettingsService.updateDefaults(
      updateAdminSettingDto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Get('split-ratio')
  @ApiOperation({ summary: 'Get split ratios', description: 'Retrieve all payment split ratios that define how revenue is distributed between the platform and specialists.' })
  @ApiResponse({ status: 200, description: 'Split ratios retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getSplitRatio() {
    const result = await this.adminSettingsService.getSplitRatio();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Post('split-ratio')
  @ApiOperation({ summary: 'Add split ratio', description: 'Add a new payment split ratio entry (e.g. Platform Commission at 20%).' })
  @ApiResponse({ status: 201, description: 'Split ratio created successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async addSplitRatio(@Body() addSplitRatioDto: AddSplitRatioDto) {
    const result = await this.adminSettingsService.addSplitRatio(
      addSplitRatioDto,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Patch('split-ratio')
  @ApiOperation({ summary: 'Update split ratio', description: 'Update an existing payment split ratio by its ID, modifying the display name or percentage.' })
  @ApiResponse({ status: 200, description: 'Split ratio updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Split ratio not found.' })
  async updateSplitRatio(@Body() updateSplitRatioDto: UpdateSplitRatioDto) {
    const result = await this.adminSettingsService.updateSplitRatio(
      updateSplitRatioDto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Delete('split-ratio/:id')
  @ApiOperation({ summary: 'Delete split ratio', description: 'Remove a payment split ratio entry from the system by its ID.' })
  @ApiParam({ name: 'id', description: 'The MongoDB ObjectId of the split ratio to delete', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Split ratio deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  @ApiResponse({ status: 404, description: 'Split ratio not found.' })
  async removeSplitRatio(@Param('id') id: Types.ObjectId) {
    const result = await this.adminSettingsService.deleteSplitRatio(id);
    return sendSuccessResponse(Messages.DELETED, result);
  }

  // Drug Interaction Settings
  @Get('drug-interactions')
  @ApiOperation({ summary: 'Get drug interaction settings', description: 'Retrieve the current drug interaction feature configuration including patient/specialist visibility toggles, severity display, and disclaimer text.' })
  @ApiResponse({ status: 200, description: 'Drug interaction settings retrieved successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async getDrugInteractionSettings() {
    const result = await this.adminSettingsService.getDrugInteractionSettings();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch('drug-interactions')
  @ApiOperation({ summary: 'Update drug interaction settings', description: 'Update the drug interaction feature configuration such as enabling/disabling the feature for patients or specialists, toggling severity levels, and modifying the disclaimer text.' })
  @ApiBody({ schema: { type: 'object', properties: { enabled_for_patients: { type: 'boolean', example: true, description: 'Whether drug interaction checks are visible to patients' }, enabled_for_specialists: { type: 'boolean', example: true, description: 'Whether drug interaction checks are visible to specialists' }, show_severity_levels: { type: 'boolean', example: true, description: 'Whether to display severity level indicators' }, disclaimer_text: { type: 'string', example: 'Drug interaction data is provided for informational purposes only. Always consult your healthcare provider.', description: 'Disclaimer text shown alongside interaction results' } } } })
  @ApiResponse({ status: 200, description: 'Drug interaction settings updated successfully.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token.' })
  async updateDrugInteractionSettings(
    @Body() updateDto: {
      enabled_for_patients?: boolean;
      enabled_for_specialists?: boolean;
      show_severity_levels?: boolean;
      disclaimer_text?: string;
    },
  ) {
    const result = await this.adminSettingsService.updateDrugInteractionSettings(updateDto);
    return sendSuccessResponse(Messages.UPDATED, result);
  }
}
