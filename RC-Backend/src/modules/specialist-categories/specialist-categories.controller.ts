import { Controller, Get, Query } from '@nestjs/common';
import { SpecialistCategoriesService } from './specialist-categories.service';

@Controller('specialist-categories')
export class SpecialistCategoriesController {
  constructor(
    private readonly categoriesService: SpecialistCategoriesService,
  ) {}

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

  @Get('popular')
  async findPopular() {
    const result = await this.categoriesService.findPopular();
    return {
      message: 'Popular specialist categories retrieved successfully',
      result,
    };
  }
}
