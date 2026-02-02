import { Controller, Get, Param, Query, UseGuards, Patch, Body } from "@nestjs/common";
import { SpecialistsService } from './specialists.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { SpecialistAdvancedFilterDto } from './dto/specialist-advanced-filter.dto';
import { Types } from 'mongoose';
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { ChangeSpecialistStatusDto } from './dto/change-specialist-status.dto';
import { AssignLanguagesDto, AssignCategoriesDto } from './dto/assign-languages.dto';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';

@Controller('specialists')
export class SpecialistsController {
  constructor(
    private readonly specialistsService: SpecialistsService,
    private readonly fileUploadHelper: FileUploadHelper,
  ) {}

  @Patch(':id')
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
  async getSpecialists(
    @Query() specialistAdvancedFilterDto: SpecialistAdvancedFilterDto,
  ) {
    const result = await this.specialistsService.getSpecialists(
      specialistAdvancedFilterDto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get(':id')
  async getSpecialist(@Param('id') id: Types.ObjectId) {
    const result = await this.specialistsService.getSpecialist(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get('file/presigned-url')
  async getPresignedUrl(@Query('url') fileUrl: string) {
    if (!fileUrl) {
      return sendSuccessResponse('File URL is required', null);
    }
    const presignedUrl = await this.fileUploadHelper.getPresignedUrl(fileUrl, 3600); // 1 hour expiry
    return sendSuccessResponse('Presigned URL generated', { url: presignedUrl });
  }

  @Get(':id/languages-categories')
  async getSpecialistLanguagesAndCategories(@Param('id') id: Types.ObjectId) {
    const result = await this.specialistsService.getSpecialistLanguagesAndCategories(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch(':id/languages')
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
