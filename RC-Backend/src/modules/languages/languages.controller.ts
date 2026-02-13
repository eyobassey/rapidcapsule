import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LanguagesService } from './languages.service';

@ApiTags('Languages')
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  async findAll() {
    const result = await this.languagesService.findAllActive();
    return {
      message: 'Languages retrieved successfully',
      result,
    };
  }
}
