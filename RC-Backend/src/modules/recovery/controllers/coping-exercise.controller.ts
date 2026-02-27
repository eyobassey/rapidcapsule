import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CopingExerciseService } from '../services/coping-exercise.service';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';

@ApiTags('Recovery - Coping Exercises')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('recovery/exercises')
export class CopingExerciseController {
  constructor(private readonly exerciseService: CopingExerciseService) {}

  @ApiOperation({
    summary: 'Get coping exercise history',
    description:
      'Retrieves a paginated list of coping exercises the patient has completed, optionally filtered by exercise category (e.g. breathing, grounding, journaling).',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter exercises by category',
    example: 'breathing',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: '1',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of results per page',
    example: '10',
  })
  @ApiResponse({ status: 200, description: 'Paginated exercise history returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get('history')
  async getHistory(
    @Query('category') category: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    const result = await this.exerciseService.getHistory(
      req.user.sub,
      category || undefined,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get coping exercise statistics',
    description:
      'Returns aggregated statistics about the patient\'s coping exercise usage, including total exercises completed, favourite categories, and streaks.',
  })
  @ApiResponse({ status: 200, description: 'Exercise statistics returned' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get('stats')
  async getStats(@Request() req) {
    const result = await this.exerciseService.getStats(req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({
    summary: 'Get a coping exercise by ID',
    description:
      'Retrieves the full details of a single completed coping exercise session, including the exercise type, duration, and patient feedback.',
  })
  @ApiParam({
    name: 'id',
    description: 'The MongoDB ObjectId of the coping exercise record',
    example: '663f961ebb4dc1fec5426abc',
  })
  @ApiResponse({ status: 200, description: 'Exercise details returned' })
  @ApiResponse({ status: 404, description: 'Exercise record not found' })
  @ApiResponse({ status: 401, description: 'Unauthorised - invalid or missing JWT token' })
  @Get(':id')
  async getById(@Param('id') id: string, @Request() req) {
    const result = await this.exerciseService.getById(id, req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}
