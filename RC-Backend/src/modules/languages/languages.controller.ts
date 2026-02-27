import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LanguagesService } from './languages.service';

@ApiTags('Languages')
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @ApiOperation({ summary: 'Get all languages', description: 'Retrieve all active supported languages' })
  @ApiResponse({ status: 200, description: 'Languages returned' })
  @Get()
  async findAll() {
    const result = await this.languagesService.findAllActive();
    return {
      message: 'Languages retrieved successfully',
      result,
    };
  }
}
