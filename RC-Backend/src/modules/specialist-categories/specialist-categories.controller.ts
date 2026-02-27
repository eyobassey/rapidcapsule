import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SpecialistCategoriesService } from './specialist-categories.service';

@ApiTags('Specialist Categories')
@Controller('specialist-categories')
export class SpecialistCategoriesController {
  constructor(
    private readonly categoriesService: SpecialistCategoriesService,
  ) {}

  @ApiOperation({ summary: 'Get specialist categories', description: 'Retrieve all active specialist categories, optionally filtered by professional category. Returns popular and other categories separately.' })
  @ApiResponse({ status: 200, description: 'Specialist categories returned with popular/other grouping' })
  @ApiQuery({ name: 'professional_category', required: false, description: 'Filter by professional category', example: 'Doctor' })
  @Get()
  async findAll(@Query('professional_category') professionalCategory?: string) {
    let categories;

    if (professionalCategory) {
      categories = await this.categoriesService.findByProfessionalCategory(
        professionalCategory,
      );
    } else {
      categories = await this.categoriesService.findAllActive();
    }

    // Separate popular and other categories
    const popular = categories.filter((cat) => cat.is_popular);
    const others = categories.filter((cat) => !cat.is_popular);

    return {
      message: 'Specialist categories retrieved successfully',
      result: {
        all: categories,
        popular,
        others,
      },
    };
  }

  @ApiOperation({ summary: 'Get popular specialist categories', description: 'Retrieve specialist categories marked as popular for prominent display' })
  @ApiResponse({ status: 200, description: 'Popular specialist categories returned' })
  @Get('popular')
  async findPopular() {
    const result = await this.categoriesService.findPopular();
    return {
      message: 'Popular specialist categories retrieved successfully',
      result,
    };
  }
}
