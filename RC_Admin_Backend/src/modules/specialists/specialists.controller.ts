import { Controller, Get, Param, Query, UseGuards, Patch, Body } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SpecialistsService } from './specialists.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { SpecialistAdvancedFilterDto } from './dto/specialist-advanced-filter.dto';
import { Types } from 'mongoose';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ChangeSpecialistStatusDto } from './dto/change-specialist-status.dto';
import { AssignLanguagesDto, AssignCategoriesDto } from './dto/assign-languages.dto';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

@ApiTags('Admin Specialists')
@ApiBearerAuth('JWT-auth')
@Controller('specialists')
export class SpecialistsController {
  constructor(
    private readonly specialistsService: SpecialistsService,
    private readonly fileUploadHelper: FileUploadHelper,
  ) {}

  @Patch(':id')
  @ApiOperation({ summary: 'Change specialist status', description: 'Update a specialist profile status (Active, Suspended, Deactivated, etc.)' })
  @ApiParam({ name: 'id', description: 'Specialist user ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Specialist status updated successfully' })
  @ApiResponse({ status: 404, description: 'Specialist not found' })
  async changeSpecialistStatus(
    @Param('id') id: Types.ObjectId,
    @Body() changeSpecialistStatusDto: ChangeSpecialistStatusDto,
  ) {
    const result = await this.specialistsService.changeSpecialistStatus(
      changeSpecialistStatusDto.profileStatus,
      id,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Patch(':id/professional-practice')
  @ApiOperation({ summary: 'Update professional practice', description: 'Update a specialist professional practice details (hospital, license, availability, etc.)' })
  @ApiParam({ name: 'id', description: 'Specialist user ID', example: '507f1f77bcf86cd799439011' })
  @ApiBody({ schema: { type: 'object', properties: { hospital_name: { type: 'string', example: 'Lagos University Teaching Hospital' }, license_number: { type: 'string', example: 'MDCN/R/12345' }, years_of_experience: { type: 'number', example: 8 }, consultation_fee: { type: 'number', example: 15000 } } } })
  @ApiResponse({ status: 200, description: 'Professional practice updated successfully' })
  @ApiResponse({ status: 404, description: 'Specialist not found' })
  async updateProfessionalPractice(
    @Param('id') id: Types.ObjectId,
    @Body() updateData: any,
  ) {
    const result = await this.specialistsService.updateProfessionalPractice(
      id,
      updateData,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Get()
  @ApiOperation({ summary: 'List specialists', description: 'Retrieve a paginated, filterable list of all specialists' })
  @ApiResponse({ status: 200, description: 'Paginated specialist list returned' })
  async getSpecialists(
    @Query() specialistAdvancedFilterDto: SpecialistAdvancedFilterDto,
  ) {
    const result = await this.specialistsService.getSpecialists(
      specialistAdvancedFilterDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specialist details', description: 'Retrieve full profile and details for a single specialist' })
  @ApiParam({ name: 'id', description: 'Specialist user ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Specialist details returned' })
  @ApiResponse({ status: 404, description: 'Specialist not found' })
  async getSpecialist(@Param('id') id: Types.ObjectId) {
    const result = await this.specialistsService.getSpecialist(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('file/presigned-url')
  @ApiOperation({ summary: 'Get presigned URL', description: 'Generate a temporary presigned URL for accessing specialist files from S3' })
  @ApiQuery({ name: 'url', description: 'S3 file URL to generate presigned access for', example: 'https://s3.amazonaws.com/rapidcapsules/specialists/license.pdf' })
  @ApiResponse({ status: 200, description: 'Presigned URL generated with 1-hour expiry' })
  async getPresignedUrl(@Query('url') fileUrl: string) {
    if (!fileUrl) {
      return sendSuccessResponse('File URL is required', null);
    }
    const presignedUrl = await this.fileUploadHelper.getPresignedUrl(fileUrl, 3600); // 1 hour expiry
    return sendSuccessResponse('Presigned URL generated', { url: presignedUrl });
  }

  @Get(':id/languages-categories')
  @ApiOperation({ summary: 'Get specialist languages and categories', description: 'Retrieve the languages spoken and specialist categories assigned to a specialist' })
  @ApiParam({ name: 'id', description: 'Specialist user ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Languages and categories returned' })
  @ApiResponse({ status: 404, description: 'Specialist not found' })
  async getSpecialistLanguagesAndCategories(@Param('id') id: Types.ObjectId) {
    const result = await this.specialistsService.getSpecialistLanguagesAndCategories(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch(':id/languages')
  @ApiOperation({ summary: 'Assign languages to specialist', description: 'Replace the languages assigned to a specialist with the provided set' })
  @ApiParam({ name: 'id', description: 'Specialist user ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Languages assigned successfully' })
  @ApiResponse({ status: 404, description: 'Specialist not found' })
  async assignLanguages(
    @Param('id') id: Types.ObjectId,
    @Body() assignLanguagesDto: AssignLanguagesDto,
  ) {
    const result = await this.specialistsService.assignLanguages(
      id,
      assignLanguagesDto.language_ids,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Patch(':id/categories')
  @ApiOperation({ summary: 'Assign categories to specialist', description: 'Replace the specialist categories assigned to a specialist with the provided set' })
  @ApiParam({ name: 'id', description: 'Specialist user ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Categories assigned successfully' })
  @ApiResponse({ status: 404, description: 'Specialist not found' })
  async assignCategories(
    @Param('id') id: Types.ObjectId,
    @Body() assignCategoriesDto: AssignCategoriesDto,
  ) {
    const result = await this.specialistsService.assignCategories(
      id,
      assignCategoriesDto.category_ids,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }
}
