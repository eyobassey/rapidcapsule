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
import { LanguagesService } from './languages.service';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@Controller('languages')
@UseGuards(JwtAuthGuard)
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Post()
  async create(@Body() createLanguageDto: CreateLanguageDto) {
    const result = await this.languagesService.create(createLanguageDto);
    return {
      message: 'Language created successfully',
      result,
    };
  }

  @Get()
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
  async findAllActive() {
    const result = await this.languagesService.findAllActive();
    return {
      message: 'Active languages retrieved successfully',
      result,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    const result = await this.languagesService.findOne(id);
    return {
      message: 'Language retrieved successfully',
      result,
    };
  }

  @Patch(':id')
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
  async remove(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    const result = await this.languagesService.remove(id);
    return {
      message: 'Language deactivated successfully',
      result,
    };
  }

  @Post('seed')
  async seedDefaults() {
    await this.languagesService.seedDefaultLanguages();
    return {
      message: 'Default languages seeded successfully',
    };
  }
}
