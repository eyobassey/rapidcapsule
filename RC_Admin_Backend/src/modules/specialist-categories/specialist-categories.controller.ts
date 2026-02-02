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
import { Types } from 'mongoose';
import { SpecialistCategoriesService } from './specialist-categories.service';
import { CreateSpecialistCategoryDto } from './dto/create-specialist-category.dto';
import { UpdateSpecialistCategoryDto } from './dto/update-specialist-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@Controller('specialist-categories')
@UseGuards(JwtAuthGuard)
export class SpecialistCategoriesController {
  constructor(
    private readonly categoriesService: SpecialistCategoriesService,
  ) {}

  @Post()
  async create(@Body() createCategoryDto: CreateSpecialistCategoryDto) {
    const result = await this.categoriesService.create(createCategoryDto);
    return {
      message: 'Specialist category created successfully',
      result,
    };
  }

  @Get()
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
  async findAllActive() {
    const result = await this.categoriesService.findAllActive();
    return {
      message: 'Active specialist categories retrieved successfully',
      result,
    };
  }

  @Get('popular')
  async findPopular() {
    const result = await this.categoriesService.findPopular();
    return {
      message: 'Popular specialist categories retrieved successfully',
      result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    const result = await this.categoriesService.findOne(id);
    return {
      message: 'Specialist category retrieved successfully',
      result,
    };
  }

  @Patch(':id')
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
  async remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    const result = await this.categoriesService.remove(id);
    return {
      message: 'Specialist category deactivated successfully',
      result,
    };
  }

  @Post('seed')
  async seedDefaults() {
    await this.categoriesService.seedDefaultCategories();
    return {
      message: 'Default specialist categories seeded successfully',
    };
  }
}
