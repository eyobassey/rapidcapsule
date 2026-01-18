import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NoteTemplate, NoteTemplateDocument } from './entities/note-template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class NoteTemplatesService {
  constructor(
    @InjectModel(NoteTemplate.name)
    private templateModel: Model<NoteTemplateDocument>,
  ) {}

  /**
   * Create a new note template
   */
  async create(specialistId: string, createTemplateDto: CreateTemplateDto) {
    if (!specialistId) {
      throw new Error('User ID is required to create a template');
    }

    console.log('Service Create - Specialist ID:', specialistId);
    console.log('Service Create - Specialist ID Type:', typeof specialistId);

    // If this template is set as default, unset other defaults
    if (createTemplateDto.is_default) {
      await this.templateModel.updateMany(
        { created_by: new Types.ObjectId(specialistId), is_default: true },
        { $set: { is_default: false } }
      );
    }

    const createdByObjectId = new Types.ObjectId(specialistId);
    console.log('Service Create - Created By ObjectId:', createdByObjectId);

    const template = new this.templateModel({
      ...createTemplateDto,
      created_by: createdByObjectId,
    });

    await template.save();
    console.log('Service Create - Saved template:', template.toObject());
    return template;
  }

  /**
   * Get all templates for a specialist (their own + public templates)
   */
  async findAll(specialistId: string) {
    console.log('Service FindAll - Specialist ID:', specialistId);
    console.log('Service FindAll - Specialist ID Type:', typeof specialistId);

    const objectId = new Types.ObjectId(specialistId);
    console.log('Service FindAll - ObjectId:', objectId);

    const query = {
      $or: [
        { created_by: objectId, is_active: true },
        { is_public: true, is_active: true }
      ]
    };
    console.log('Service FindAll - Query:', JSON.stringify(query));

    const templates = await this.templateModel
      .find(query)
      .sort({ is_default: -1, usage_count: -1, createdAt: -1 })
      .lean();

    console.log('Service FindAll - Found templates:', templates.length);
    console.log('Service FindAll - Templates:', JSON.stringify(templates));

    return templates;
  }

  /**
   * Get templates by category
   */
  async findByCategory(specialistId: string, category: string) {
    const templates = await this.templateModel
      .find({
        $or: [
          { created_by: new Types.ObjectId(specialistId), is_active: true, category },
          { is_public: true, is_active: true, category }
        ]
      })
      .sort({ is_default: -1, usage_count: -1 })
      .lean();

    return templates;
  }

  /**
   * Get a single template
   */
  async findOne(templateId: string) {
    const template = await this.templateModel.findById(templateId);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return template;
  }

  /**
   * Update a template
   */
  async update(
    templateId: string,
    specialistId: string,
    updateTemplateDto: UpdateTemplateDto,
  ) {
    const template = await this.templateModel.findById(templateId);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Only allow owner to update their template
    if (template.created_by.toString() !== new Types.ObjectId(specialistId).toString()) {
      throw new ForbiddenException('You can only update your own templates');
    }

    // If setting this template as default, unset other defaults
    if (updateTemplateDto.is_default && !template.is_default) {
      await this.templateModel.updateMany(
        {
          created_by: new Types.ObjectId(specialistId),
          is_default: true,
          _id: { $ne: templateId }
        },
        { $set: { is_default: false } }
      );
    }

    Object.assign(template, updateTemplateDto);
    await template.save();

    return template;
  }

  /**
   * Delete a template (soft delete by setting is_active to false)
   * Prevents deletion if template has been used (usage_count > 0)
   */
  async delete(templateId: string, specialistId: string) {
    const template = await this.templateModel.findById(templateId);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Only allow owner to delete their template
    if (template.created_by.toString() !== new Types.ObjectId(specialistId).toString()) {
      throw new ForbiddenException('You can only delete your own templates');
    }

    // Prevent deletion if template has been used
    if (template.usage_count > 0) {
      throw new ForbiddenException(
        `This template has been used in ${template.usage_count} clinical note(s) and cannot be deleted. Please archive it instead.`
      );
    }

    template.is_active = false;
    await template.save();

    return { message: 'Template deleted successfully' };
  }

  /**
   * Archive a template (soft delete for used templates)
   */
  async archive(templateId: string, specialistId: string) {
    const template = await this.templateModel.findById(templateId);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Only allow owner to archive their template
    if (template.created_by.toString() !== new Types.ObjectId(specialistId).toString()) {
      throw new ForbiddenException('You can only archive your own templates');
    }

    template.is_active = false;
    await template.save();

    return { message: 'Template archived successfully' };
  }

  /**
   * Increment usage count when template is used
   */
  async incrementUsage(templateId: string) {
    await this.templateModel.findByIdAndUpdate(
      templateId,
      { $inc: { usage_count: 1 } }
    );
  }

  /**
   * Get template categories
   */
  async getCategories(specialistId: string) {
    const categories = await this.templateModel.distinct('category', {
      $or: [
        { created_by: new Types.ObjectId(specialistId), is_active: true },
        { is_public: true, is_active: true }
      ]
    });

    return categories.filter(Boolean); // Remove null/undefined values
  }

  /**
   * Get default template for a specialist
   */
  async getDefaultTemplate(specialistId: string) {
    const template = await this.templateModel.findOne({
      created_by: new Types.ObjectId(specialistId),
      is_default: true,
      is_active: true
    });

    return template;
  }

  /**
   * Set a template as default
   */
  async setAsDefault(templateId: string, specialistId: string) {
    const template = await this.templateModel.findById(templateId);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Only allow owner to set their template as default
    if (template.created_by.toString() !== new Types.ObjectId(specialistId).toString()) {
      throw new ForbiddenException('You can only set your own templates as default');
    }

    // Unset other defaults
    await this.templateModel.updateMany(
      { created_by: new Types.ObjectId(specialistId), is_default: true },
      { $set: { is_default: false } }
    );

    // Set this template as default
    template.is_default = true;
    await template.save();

    return template;
  }

  /**
   * Unset default template
   */
  async unsetDefault(templateId: string, specialistId: string) {
    const template = await this.templateModel.findById(templateId);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Only allow owner to unset their template
    if (template.created_by.toString() !== new Types.ObjectId(specialistId).toString()) {
      throw new ForbiddenException('You can only modify your own templates');
    }

    template.is_default = false;
    await template.save();

    return template;
  }
}
