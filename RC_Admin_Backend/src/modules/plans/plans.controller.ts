import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Types } from "mongoose";

@ApiTags('Admin Subscription Plans')
@ApiBearerAuth('JWT-auth')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @ApiOperation({ summary: 'Create subscription plan', description: 'Create a new subscription plan with pricing and trial period' })
  @ApiResponse({ status: 201, description: 'Plan created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate code' })
  async create(@Body() createPlanDto: CreatePlanDto) {
    const result = await this.plansService.createPlan(createPlanDto);
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Get()
  @ApiOperation({ summary: 'List subscription plans', description: 'Retrieve all available subscription plans' })
  @ApiResponse({ status: 200, description: 'Plan list returned' })
  async findPlans() {
    const result = await this.plansService.findPlans();
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID', description: 'Retrieve a single subscription plan by its ID' })
  @ApiParam({ name: 'id', description: 'Plan ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Plan details returned' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async findOnePlan(@Param('id') id: Types.ObjectId) {
    const result = await this.plansService.findOnePlan(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription plan', description: 'Update an existing subscription plan' })
  @ApiParam({ name: 'id', description: 'Plan ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Plan updated successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  async update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    const result = await this.plansService.updatePlan(id, updatePlanDto);
    return sendSuccessResponse(Messages.UPDATED, result);
  }
}
