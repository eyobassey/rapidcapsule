import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SpecialistCategory,
  SpecialistCategoryDocument,
} from './entities/specialist-category.entity';

@Injectable()
export class SpecialistCategoriesService {
  constructor(
    @InjectModel(SpecialistCategory.name)
    private categoryModel: Model<SpecialistCategoryDocument>,
  ) {}

  async findAllActive(): Promise<SpecialistCategoryDocument[]> {
    return await this.categoryModel
      .find({ is_active: true })
      .sort({ display_order: 1, name: 1 })
      .exec();
  }

  async findPopular(): Promise<SpecialistCategoryDocument[]> {
    return await this.categoryModel
      .find({ is_active: true, is_popular: true })
      .sort({ display_order: 1, name: 1 })
      .exec();
  }

  async findBySlug(slug: string): Promise<SpecialistCategoryDocument | null> {
    return await this.categoryModel.findOne({
      slug: slug.toLowerCase(),
      is_active: true,
    });
  }

  async findById(id: Types.ObjectId): Promise<SpecialistCategoryDocument | null> {
    return await this.categoryModel.findOne({
      _id: id,
      is_active: true,
    });
  }

  async findByProfessionalCategory(
    professionalCategory: string,
  ): Promise<SpecialistCategoryDocument[]> {
    return await this.categoryModel
      .find({
        professional_category: professionalCategory,
        is_active: true,
      })
      .sort({ display_order: 1, name: 1 })
      .exec();
  }
}
