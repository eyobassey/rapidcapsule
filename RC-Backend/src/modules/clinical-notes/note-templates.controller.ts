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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NoteTemplatesService } from './note-templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@ApiTags('Clinical Note Templates')
@ApiBearerAuth('JWT-auth')
@Controller('clinical-notes/templates')
@UseGuards(JwtAuthGuard)
export class NoteTemplatesController {
  constructor(private readonly templatesService: NoteTemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a clinical note template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error - missing required fields' })
  async create(@Request() req: any, @Body() createTemplateDto: CreateTemplateDto) {
    const userId = req.user.sub;
    console.log('Create Template - User Sub:', userId);
    console.log('Create Template - User Sub Type:', typeof userId);
    const result = await this.templatesService.create(userId, createTemplateDto);
    console.log('Created template:', result);
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'List clinical note templates' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter templates by category', example: 'General Medicine' })
  @ApiResponse({ status: 200, description: 'Returns list of templates for the authenticated specialist' })
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
  @ApiOperation({ summary: 'Get template categories' })
  @ApiResponse({ status: 200, description: 'Returns list of distinct template categories for the specialist' })
  async getCategories(@Request() req: any) {
    const userId = req.user.sub;
    return this.templatesService.getCategories(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template by ID' })
  @ApiParam({ name: 'id', description: 'Template ID', example: '60d5ec49f1b2c72d88c1e4a7' })
  @ApiResponse({ status: 200, description: 'Returns the requested template' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template' })
  @ApiParam({ name: 'id', description: 'Template ID', example: '60d5ec49f1b2c72d88c1e4a7' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found or not owned by specialist' })
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    const userId = req.user.sub;
    return this.templatesService.update(id, userId, updateTemplateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template' })
  @ApiParam({ name: 'id', description: 'Template ID', example: '60d5ec49f1b2c72d88c1e4a7' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found or not owned by specialist' })
  async delete(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.templatesService.delete(id, userId);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a template' })
  @ApiParam({ name: 'id', description: 'Template ID', example: '60d5ec49f1b2c72d88c1e4a7' })
  @ApiResponse({ status: 201, description: 'Template archived successfully' })
  @ApiResponse({ status: 404, description: 'Template not found or not owned by specialist' })
  async archive(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.templatesService.archive(id, userId);
  }

  @Post(':id/use')
  @ApiOperation({ summary: 'Increment template usage count' })
  @ApiParam({ name: 'id', description: 'Template ID', example: '60d5ec49f1b2c72d88c1e4a7' })
  @ApiResponse({ status: 201, description: 'Usage count incremented successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async incrementUsage(@Param('id') id: string) {
    await this.templatesService.incrementUsage(id);
    return { message: 'Usage count incremented' };
  }

  @Get('default/get')
  @ApiOperation({ summary: 'Get default template' })
  @ApiResponse({ status: 200, description: 'Returns the default template for the authenticated specialist' })
  @ApiResponse({ status: 404, description: 'No default template set' })
  async getDefault(@Request() req: any) {
    const userId = req.user.sub;
    return this.templatesService.getDefaultTemplate(userId);
  }

  @Post(':id/set-default')
  @ApiOperation({ summary: 'Set a template as default' })
  @ApiParam({ name: 'id', description: 'Template ID to set as default', example: '60d5ec49f1b2c72d88c1e4a7' })
  @ApiResponse({ status: 201, description: 'Template set as default successfully' })
  @ApiResponse({ status: 404, description: 'Template not found or not owned by specialist' })
  async setAsDefault(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.templatesService.setAsDefault(id, userId);
  }

  @Post(':id/unset-default')
  @ApiOperation({ summary: 'Unset a template as default' })
  @ApiParam({ name: 'id', description: 'Template ID to unset as default', example: '60d5ec49f1b2c72d88c1e4a7' })
  @ApiResponse({ status: 201, description: 'Template unset as default successfully' })
  @ApiResponse({ status: 404, description: 'Template not found or not owned by specialist' })
  async unsetDefault(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.sub;
    return this.templatesService.unsetDefault(id, userId);
  }
}
