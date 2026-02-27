import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { Types } from 'mongoose';
import { DeletePromotionDto } from './dto/delete-promotion.dto';
import { ChangePromotionStatusDto } from './dto/change-promotion-status.dto';
import { PromotionStatus } from './entities/promotion.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Messages } from '../../core/messages/messages';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { QueryDto } from '../../common/helpers/url-query.dto';

@ApiTags('Admin Promotions')
@ApiBearerAuth('JWT-auth')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create promotion', description: 'Create a new promotional offer with code, discount, or reward' })
  @ApiResponse({ status: 201, description: 'Promotion created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() createPromotionDto: CreatePromotionDto) {
    const result = await this.promotionsService.createPromotion(
      createPromotionDto,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Get()
  @ApiOperation({ summary: 'List promotions', description: 'Retrieve all promotions with pagination' })
  @ApiResponse({ status: 200, description: 'Promotion list returned' })
  async findAll(@Query() queryDto: QueryDto) {
    const result = await this.promotionsService.getPromotions(queryDto);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promotion by ID', description: 'Retrieve a single promotion' })
  @ApiParam({ name: 'id', description: 'Promotion ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Promotion details returned' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  async findOne(@Param('id') id: Types.ObjectId) {
    const result = await this.promotionsService.getOnePromotion(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch()
  @ApiOperation({ summary: 'Update promotion', description: 'Update an existing promotion' })
  @ApiResponse({ status: 200, description: 'Promotion updated successfully' })
  async update(@Body() updatePromotionDto: UpdatePromotionDto) {
    const result = await this.promotionsService.updatePromotion(
      { _id: updatePromotionDto.promotionId },
      updatePromotionDto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Patch('activate')
  @ApiOperation({ summary: 'Activate promotion', description: 'Set a promotion status to active' })
  @ApiResponse({ status: 200, description: 'Promotion activated successfully' })
  async activatePromotion(
    @Body() changePromotionStatusDto: ChangePromotionStatusDto,
  ) {
    const result = await this.promotionsService.updatePromotion(
      { _id: changePromotionStatusDto.promotionId },
      { status: PromotionStatus.ACTIVE },
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Patch('deactivate')
  @ApiOperation({ summary: 'Deactivate promotion', description: 'Set a promotion status to deactivated' })
  @ApiResponse({ status: 200, description: 'Promotion deactivated successfully' })
  async deactivatePromotion(
    @Body() changePromotionStatusDto: ChangePromotionStatusDto,
  ) {
    const result = await this.promotionsService.updatePromotion(
      { _id: changePromotionStatusDto.promotionId },
      { status: PromotionStatus.DEACTIVATED },
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete promotion', description: 'Permanently remove a promotion' })
  @ApiResponse({ status: 200, description: 'Promotion deleted successfully' })
  async remove(@Body() deletePromotionDto: DeletePromotionDto) {
    const result = await this.promotionsService.deletePromotion(
      deletePromotionDto.promotionId,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }
}
