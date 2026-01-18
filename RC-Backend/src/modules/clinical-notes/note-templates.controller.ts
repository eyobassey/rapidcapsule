import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NoteTemplatesService } from './note-templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Controller('clinical-notes/templates')
@UseGuards(JwtAuthGuard)
export class NoteTemplatesController {
  constructor(private readonly templatesService: NoteTemplatesService) {}

  @Post()
  async create(@Request() req: any, @Body() createTemplateDto: CreateTemplateDto) {
    const userId = req.user.sub;
    console.log('Create Template - User Sub:', userId);
    console.log('Create Template - User Sub Type:', typeof userId);
    const result = await this.templatesService.create(userId, createTemplateDto);
    console.log('Created template:', result);
    return result;
  }

  @Get()
  async findAll(@Request() req: any, @Query('category') category?: string) {
    const userId = req.user.sub;
    console.log('Find Templates - User Sub:', userId);
    console.log('Find Templates - User Sub Type:', typeof userId);
    let templates;
    if (category) {
      templates = await this.templatesService.findByCategory(userId, category);
    } else {
      templates = await this.templatesService.findAll(userId);
    }
    console.log('Found templates count:', templates?.length || 0);
    console.log('Templates:', JSON.stringify(templates));
    console.log('Returning result to frontend');
    return { result: templates };
  }

  @Get('categories')
  async getCategories(@Request() req: any) {
    const userId = req.user.sub;
    return this.templatesService.getCategories(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    const userId = req.user.sub;
    return this.templatesService.update(id, userId, updateTemplateDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.templatesService.delete(id, userId);
  }

  @Post(':id/archive')
  async archive(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.templatesService.archive(id, userId);
  }

  @Post(':id/use')
  async incrementUsage(@Param('id') id: string) {
    await this.templatesService.incrementUsage(id);
    return { message: 'Usage count incremented' };
  }

  @Get('default/get')
  async getDefault(@Request() req: any) {
    const userId = req.user.sub;
    return this.templatesService.getDefaultTemplate(userId);
  }

  @Post(':id/set-default')
  async setAsDefault(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.templatesService.setAsDefault(id, userId);
  }

  @Post(':id/unset-default')
  async unsetDefault(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.templatesService.unsetDefault(id, userId);
  }
}
