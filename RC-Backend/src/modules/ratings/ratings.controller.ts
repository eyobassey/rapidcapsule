import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { Types } from 'mongoose';
import { SpecialistAverageRating } from './dto/SpecialistAverageRating';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Ratings')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @ApiOperation({ summary: 'Create rating', description: 'Submit a rating and optional review for a specialist after a consultation' })
  @ApiResponse({ status: 201, description: 'Rating created' })
  @ApiResponse({ status: 400, description: 'Invalid rating data' })
  @Post()
  async createRating(@Body() createRatingDto: CreateRatingDto, @Request() req) {
    const result = await this.ratingsService.createRating(
      createRatingDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'Get specialist average rating', description: 'Calculate and return the average rating for a specific specialist' })
  @ApiResponse({ status: 200, description: 'Average rating returned' })
  @Post('average')
  async getSpecialistAverageRating(
    @Body() specialistAverageRating: SpecialistAverageRating,
  ) {
    const result = await this.ratingsService.getSpecialistAverageRating(
      specialistAverageRating.specialistId,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get specialist ratings', description: 'Retrieve all individual ratings and reviews for a specific specialist' })
  @ApiResponse({ status: 200, description: 'Specialist ratings returned' })
  @ApiParam({ name: 'id', description: 'Specialist user ID', example: '507f1f77bcf86cd799439011' })
  @Get(':id')
  async getSpecialistRatings(@Param('id') id: Types.ObjectId) {
    const result = await this.ratingsService.getSpecialistRatings(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
