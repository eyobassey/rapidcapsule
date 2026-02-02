import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConsultationService, ConsultationServiceDocument } from './entities/consultation-service.entity';
import { CreateConsultationServiceDto } from './dto/create-consultation-service.dto';
import { UpdateConsultationServiceDto } from './dto/update-consultation-service.dto';

@Injectable()
export class ConsultationServicesService {
  constructor(
    @InjectModel(ConsultationService.name)
    private consultationServiceModel: Model<ConsultationServiceDocument>,
  ) {}

  async create(createDto: CreateConsultationServiceDto): Promise<ConsultationService> {
    // Check if slug already exists
    const existing = await this.consultationServiceModel.findOne({ slug: createDto.slug });
    if (existing) {
      throw new ConflictException(`Service with slug "${createDto.slug}" already exists`);
    }

    // Auto-generate slug if not provided
    if (!createDto.slug) {
      createDto.slug = this.generateSlug(createDto.name);
    }

    // Get highest display_order if not provided
    if (createDto.display_order === undefined) {
      const highest = await this.consultationServiceModel
        .findOne()
        .sort({ display_order: -1 })
        .select('display_order');
      createDto.display_order = (highest?.display_order || 0) + 1;
    }

    const service = new this.consultationServiceModel(createDto);
    return service.save();
  }

  async findAll(includeInactive = false): Promise<ConsultationService[]> {
    const query = includeInactive ? {} : { is_active: true };
    return this.consultationServiceModel
      .find(query)
      .sort({ display_order: 1 })
      .exec();
  }

  async findOne(id: string): Promise<ConsultationService> {
    const service = await this.consultationServiceModel.findById(id).exec();
    if (!service) {
      throw new NotFoundException(`Consultation service with ID "${id}" not found`);
    }
    return service;
  }

  async findBySlug(slug: string): Promise<ConsultationService> {
    const service = await this.consultationServiceModel.findOne({ slug }).exec();
    if (!service) {
      throw new NotFoundException(`Consultation service with slug "${slug}" not found`);
    }
    return service;
  }

  async update(id: string, updateDto: UpdateConsultationServiceDto): Promise<ConsultationService> {
    // Check slug uniqueness if being updated
    if (updateDto.slug) {
      const existing = await this.consultationServiceModel.findOne({
        slug: updateDto.slug,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictException(`Service with slug "${updateDto.slug}" already exists`);
      }
    }

    const service = await this.consultationServiceModel
      .findByIdAndUpdate(id, { $set: updateDto }, { new: true })
      .exec();

    if (!service) {
      throw new NotFoundException(`Consultation service with ID "${id}" not found`);
    }

    return service;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const result = await this.consultationServiceModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Consultation service with ID "${id}" not found`);
    }
    return { deleted: true };
  }

  async softDelete(id: string): Promise<ConsultationService> {
    return this.update(id, { is_active: false });
  }

  async reorder(orderedIds: string[]): Promise<{ success: boolean }> {
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { display_order: index } },
      },
    }));

    await this.consultationServiceModel.bulkWrite(bulkOps);
    return { success: true };
  }

  async seedDefaultServices(): Promise<{ created: number; skipped: number }> {
    const defaultServices = [
      {
        name: 'Video Consultation',
        slug: 'video_consultation',
        description: 'Standard 30 min video call with patient.',
        icon: 'hi-video-camera',
        icon_color: '#1976D2',
        icon_bg_color: '#E3F2FD',
        pricing_type: 'routine_urgent',
        min_rate: 2000,
        is_default: true,
        display_order: 1,
        show_ai_badge: true,
      },
      {
        name: 'Audio Consultation',
        slug: 'audio_consultation',
        description: 'Voice-only consultation via phone or WhatsApp.',
        icon: 'hi-phone',
        icon_color: '#F57C00',
        icon_bg_color: '#FFF3E0',
        pricing_type: 'routine_urgent',
        min_rate: 1500,
        is_default: true,
        display_order: 2,
        show_ai_badge: true,
      },
      {
        name: 'Chat Consultation',
        slug: 'chat_consultation',
        description: 'Asynchronous text-based consultation (24hr window).',
        icon: 'hi-chat-alt-2',
        icon_color: '#7B1FA2',
        icon_bg_color: '#F3E5F5',
        pricing_type: 'flat',
        min_rate: 1000,
        is_default: true,
        display_order: 3,
        info_text: 'Chat consults are great for follow-ups and minor inquiries.',
      },
      {
        name: 'Prescription Review',
        slug: 'prescription_review',
        description: 'Review and renew existing prescriptions.',
        icon: 'hi-clipboard-list',
        icon_color: '#00897B',
        icon_bg_color: '#E0F2F1',
        pricing_type: 'flat',
        min_rate: 1000,
        is_default: false,
        display_order: 4,
        info_text: 'Patients can request prescription reviews for existing medications.',
      },
      {
        name: 'Lab Test Result Review',
        slug: 'lab_test_review',
        description: 'Review and interpret laboratory test results.',
        icon: 'hi-document-text',
        icon_color: '#5C6BC0',
        icon_bg_color: '#E8EAF6',
        pricing_type: 'flat',
        min_rate: 2000,
        is_default: false,
        display_order: 5,
        info_text: 'Help patients understand their lab results and next steps.',
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const serviceData of defaultServices) {
      const existing = await this.consultationServiceModel.findOne({ slug: serviceData.slug });
      if (!existing) {
        await this.consultationServiceModel.create(serviceData);
        created++;
      } else {
        skipped++;
      }
    }

    return { created, skipped };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }
}
