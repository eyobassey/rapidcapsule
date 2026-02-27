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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { SpecialistCategoriesService } from './specialist-categories.service';
import { CreateSpecialistCategoryDto } from './dto/create-specialist-category.dto';
import { UpdateSpecialistCategoryDto } from './dto/update-specialist-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Admin Specialist Categories')
@ApiBearerAuth('JWT-auth')
@Controller('specialist-categories')
@UseGuards(JwtAuthGuard)
export class SpecialistCategoriesController {
  constructor(
    private readonly categoriesService: SpecialistCategoriesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create specialist category', description: 'Create a new specialist category (e.g. Cardiology, Dermatology)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate name' })
  async create(@Body() createCategoryDto: CreateSpecialistCategoryDto) {
    const result = await this.categoriesService.create(createCategoryDto);
    return {
      message: 'Specialist category created successfully',
      result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List specialist categories', description: 'Retrieve paginated, filterable list of specialist categories' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '50' })
  @ApiQuery({ name: 'is_active', required: false, example: 'true' })
  @ApiQuery({ name: 'is_popular', required: false, example: 'true' })
  @ApiQuery({ name: 'professional_category', required: false, example: 'Medical Doctor' })
  @ApiQuery({ name: 'search', required: false, example: 'cardio' })
  @ApiResponse({ status: 200, description: 'Paginated category list returned' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('is_active') is_active?: string,
    @Query('is_popular') is_popular?: string,
    @Query('professional_category') professional_category?: string,
    @Query('search') search?: string,
  ) {
    const options = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      is_popular: is_popular !== undefined ? is_popular === 'true' : undefined,
      professional_category,
      search,
    };
    const data = await this.categoriesService.findAll(options);
    return {
      message: 'Specialist categories retrieved successfully',
      result: data.data,
      meta: {
        total: data.total,
        page: data.page,
        limit: data.limit,
        totalPages: Math.ceil(data.total / data.limit),
      },
    };
  }

  @Get('active')
  @ApiOperation({ summary: 'List active categories', description: 'Retrieve only active specialist categories' })
  @ApiResponse({ status: 200, description: 'Active categories returned' })
  async findAllActive() {
    const result = await this.categoriesService.findAllActive();
    return {
      message: 'Active specialist categories retrieved successfully',
      result,
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'List popular categories', description: 'Retrieve specialist categories marked as popular/featured' })
  @ApiResponse({ status: 200, description: 'Popular categories returned' })
  async findPopular() {
    const result = await this.categoriesService.findPopular();
    return {
      message: 'Popular specialist categories retrieved successfully',
      result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID', description: 'Retrieve a single specialist category' })
  @ApiParam({ name: 'id', description: 'Category ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Category details returned' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    const result = await this.categoriesService.findOne(id);
    return {
      message: 'Specialist category retrieved successfully',
      result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update specialist category', description: 'Update an existing specialist category' })
  @ApiParam({ name: 'id', description: 'Category ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateCategoryDto: UpdateSpecialistCategoryDto,
  ) {
    const result = await this.categoriesService.update(id, updateCategoryDto);
    return {
      message: 'Specialist category updated successfully',
      result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete specialist category', description: 'Deactivate a specialist category' })
  @ApiParam({ name: 'id', description: 'Category ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Category deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    const result = await this.categoriesService.remove(id);
    return {
      message: 'Specialist category deactivated successfully',
      result,
    };
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default categories', description: 'Populate the database with default specialist categories' })
  @ApiResponse({ status: 201, description: 'Default categories seeded' })
  async seedDefaults() {
    await this.categoriesService.seedDefaultCategories();
    return {
      message: 'Default specialist categories seeded successfully',
    };
  }
}
