import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { Types } from 'mongoose';

@ApiTags('Admin Categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create specialist category', description: 'Create a new specialist category (e.g. Cardiology, Dermatology)' })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate name' })
  async createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    const result = await this.categoriesService.createCategory(
      createCategoryDto,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @Get()
  @ApiOperation({ summary: 'List all categories', description: 'Retrieve all specialist categories' })
  @ApiResponse({ status: 200, description: 'List of categories returned' })
  async getCategories() {
    const result = await this.categoriesService.getCategories();
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID', description: 'Retrieve a single specialist category by its ID' })
  @ApiParam({ name: 'id', description: 'Category ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Category details returned' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategory(@Param('id') id: Types.ObjectId) {
    const result = await this.categoriesService.getCategory(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category', description: 'Update an existing specialist category name or description' })
  @ApiParam({ name: 'id', description: 'Category ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('id') id: Types.ObjectId,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const result = await this.categoriesService.updateCategory(
      id,
      updateCategoryDto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category', description: 'Permanently remove a specialist category' })
  @ApiParam({ name: 'id', description: 'Category ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('id') id: Types.ObjectId) {
    const result = await this.categoriesService.deleteCategory(id);
    return sendSuccessResponse(Messages.DELETED, result);
  }
}
