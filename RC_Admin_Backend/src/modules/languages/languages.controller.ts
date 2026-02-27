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
import { LanguagesService } from './languages.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Admin Languages')
@ApiBearerAuth('JWT-auth')
@Controller('languages')
@UseGuards(JwtAuthGuard)
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Post()
  @ApiOperation({ summary: 'Create language', description: 'Add a new language to the platform for specialist language assignment' })
  @ApiResponse({ status: 201, description: 'Language created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or duplicate code' })
  async create(@Body() createLanguageDto: CreateLanguageDto) {
    const result = await this.languagesService.create(createLanguageDto);
    return {
      message: 'Language created successfully',
      result,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List languages', description: 'Retrieve paginated, filterable list of languages' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'limit', required: false, example: '50' })
  @ApiQuery({ name: 'is_active', required: false, example: 'true' })
  @ApiQuery({ name: 'search', required: false, example: 'Yoruba' })
  @ApiResponse({ status: 200, description: 'Paginated language list returned' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('is_active') is_active?: string,
    @Query('search') search?: string,
  ) {
    const options = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      is_active: is_active !== undefined ? is_active === 'true' : undefined,
      search,
    };
    const data = await this.languagesService.findAll(options);
    return {
      message: 'Languages retrieved successfully',
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
  @ApiOperation({ summary: 'List active languages', description: 'Retrieve only active languages' })
  @ApiResponse({ status: 200, description: 'Active languages returned' })
  async findAllActive() {
    const result = await this.languagesService.findAllActive();
    return {
      message: 'Active languages retrieved successfully',
      result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get language by ID', description: 'Retrieve a single language by its ID' })
  @ApiParam({ name: 'id', description: 'Language ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Language details returned' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    const result = await this.languagesService.findOne(id);
    return {
      message: 'Language retrieved successfully',
      result,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update language', description: 'Update an existing language' })
  @ApiParam({ name: 'id', description: 'Language ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Language updated successfully' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() updateLanguageDto: UpdateLanguageDto,
  ) {
    const result = await this.languagesService.update(id, updateLanguageDto);
    return {
      message: 'Language updated successfully',
      result,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete language', description: 'Deactivate a language' })
  @ApiParam({ name: 'id', description: 'Language ID', example: '507f1f77bcf86cd799439011' })
  @ApiResponse({ status: 200, description: 'Language deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Language not found' })
  async remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    const result = await this.languagesService.remove(id);
    return {
      message: 'Language deactivated successfully',
      result,
    };
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default languages', description: 'Populate the database with default languages (English, Yoruba, Igbo, Hausa, etc.)' })
  @ApiResponse({ status: 201, description: 'Default languages seeded' })
  async seedDefaults() {
    await this.languagesService.seedDefaultLanguages();
    return {
      message: 'Default languages seeded successfully',
    };
  }
}
