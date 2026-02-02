import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConsultationService, ConsultationServiceDocument } from './entities/consultation-service.entity';

@Injectable()
export class ConsultationServicesService {
  constructor(
    @InjectModel(ConsultationService.name)
    private consultationServiceModel: Model<ConsultationServiceDocument>,
  ) {}

  async findAll(): Promise<ConsultationService[]> {
    return this.consultationServiceModel
      .find({ is_active: true })
      .sort({ display_order: 1 })
      .exec();
  }

  async findBySlug(slug: string): Promise<ConsultationService | null> {
    return this.consultationServiceModel.findOne({ slug, is_active: true }).exec();
  }

  async findDefaults(): Promise<ConsultationService[]> {
    return this.consultationServiceModel
      .find({ is_active: true, is_default: true })
      .sort({ display_order: 1 })
      .exec();
  }
}
