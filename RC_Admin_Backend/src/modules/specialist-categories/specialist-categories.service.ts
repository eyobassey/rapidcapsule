import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SpecialistCategory,
  SpecialistCategoryDocument,
  ProfessionalCategoryType,
} from './entities/specialist-category.entity';
import { CreateSpecialistCategoryDto } from './dto/create-specialist-category.dto';
import { UpdateSpecialistCategoryDto } from './dto/update-specialist-category.dto';
import {
  create,
  find,
  findOne,
  updateOneAndReturn,
  countDocuments,
} from '../../common/crud/crud';

@Injectable()
export class SpecialistCategoriesService {
  constructor(
    @InjectModel(SpecialistCategory.name)
    private categoryModel: Model<SpecialistCategoryDocument>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async create(
    createCategoryDto: CreateSpecialistCategoryDto,
  ): Promise<SpecialistCategoryDocument> {
    const slug = createCategoryDto.slug || this.generateSlug(createCategoryDto.name);

    // Check for existing category with same slug
    const existing = await findOne(this.categoryModel, { slug });
    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }

    return await create(this.categoryModel, {
      ...createCategoryDto,
      slug,
    });
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    is_active?: boolean;
    is_popular?: boolean;
    professional_category?: string;
    search?: string;
  }): Promise<{
    data: SpecialistCategoryDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const query: any = {};

    if (options?.is_active !== undefined) {
      query.is_active = options.is_active;
    }

    if (options?.is_popular !== undefined) {
      query.is_popular = options.is_popular;
    }

    if (options?.professional_category) {
      query.professional_category = options.professional_category;
    }

    if (options?.search) {
      query.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.categoryModel
        .find(query)
        .sort({ display_order: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      countDocuments(this.categoryModel, query),
    ]);

    return { data, total, page, limit };
  }

  async findAllActive(): Promise<SpecialistCategoryDocument[]> {
    return await this.categoryModel.find({ is_active: true }).sort({ display_order: 1, name: 1 }).exec();
  }

  async findPopular(): Promise<SpecialistCategoryDocument[]> {
    return await this.categoryModel
      .find({ is_active: true, is_popular: true })
      .sort({ display_order: 1, name: 1 })
      .exec();
  }

  async findOne(id: Types.ObjectId): Promise<SpecialistCategoryDocument> {
    const category = await findOne(this.categoryModel, { _id: id });
    if (!category) {
      throw new NotFoundException('Specialist category not found');
    }
    return category;
  }

  async findBySlug(slug: string): Promise<SpecialistCategoryDocument | null> {
    return await findOne(this.categoryModel, { slug: slug.toLowerCase() });
  }

  async update(
    id: Types.ObjectId,
    updateCategoryDto: UpdateSpecialistCategoryDto,
  ): Promise<SpecialistCategoryDocument> {
    // Check if category exists
    await this.findOne(id);

    // Check for slug conflicts
    if (updateCategoryDto.slug || updateCategoryDto.name) {
      const newSlug =
        updateCategoryDto.slug ||
        (updateCategoryDto.name ? this.generateSlug(updateCategoryDto.name) : null);

      if (newSlug) {
        const existing = await findOne(this.categoryModel, {
          slug: newSlug,
          _id: { $ne: id },
        });
        if (existing) {
          throw new ConflictException('Category with this slug already exists');
        }
        updateCategoryDto.slug = newSlug;
      }
    }

    return await updateOneAndReturn(
      this.categoryModel,
      { _id: id },
      updateCategoryDto,
    );
  }

  async remove(id: Types.ObjectId): Promise<SpecialistCategoryDocument> {
    // Soft delete by setting is_active to false
    await this.findOne(id);
    return await updateOneAndReturn(
      this.categoryModel,
      { _id: id },
      { is_active: false },
    );
  }

  async hardDelete(id: Types.ObjectId): Promise<boolean> {
    const result = await this.categoryModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async seedDefaultCategories(): Promise<void> {
    const defaultCategories = [
      {
        name: 'General Practitioner',
        slug: 'general-practitioner',
        description: 'Primary care physician for general health concerns',
        icon: 'fa-user-md',
        professional_category: ProfessionalCategoryType.MEDICAL_DOCTOR,
        is_popular: true,
        display_order: 1,
      },
      {
        name: 'Pediatrician',
        slug: 'pediatrician',
        description: 'Specialist in child healthcare from infancy to adolescence',
        icon: 'fa-baby',
        professional_category: ProfessionalCategoryType.SPECIALIST,
        is_popular: true,
        display_order: 2,
      },
      {
        name: 'Dermatologist',
        slug: 'dermatologist',
        description: 'Specialist in skin, hair, and nail conditions',
        icon: 'fa-allergies',
        professional_category: ProfessionalCategoryType.SPECIALIST,
        is_popular: true,
        display_order: 3,
      },
      {
        name: 'Cardiologist',
        slug: 'cardiologist',
        description: 'Heart and cardiovascular system specialist',
        icon: 'fa-heartbeat',
        professional_category: ProfessionalCategoryType.SPECIALIST,
        is_popular: true,
        display_order: 4,
      },
      {
        name: 'Gynecologist',
        slug: 'gynecologist',
        description: "Specialist in women's reproductive health",
        icon: 'fa-female',
        professional_category: ProfessionalCategoryType.SPECIALIST,
        is_popular: true,
        display_order: 5,
      },
      {
        name: 'Psychiatrist',
        slug: 'psychiatrist',
        description: 'Mental health specialist for diagnosis and medication',
        icon: 'fa-brain',
        professional_category: ProfessionalCategoryType.THERAPIST,
        is_popular: true,
        display_order: 6,
      },
      {
        name: 'Orthopedic Surgeon',
        slug: 'orthopedic-surgeon',
        description: 'Specialist in bones, joints, and musculoskeletal system',
        icon: 'fa-bone',
        professional_category: ProfessionalCategoryType.SPECIALIST,
        is_popular: false,
        display_order: 7,
      },
      {
        name: 'Neurologist',
        slug: 'neurologist',
        description: 'Specialist in brain and nervous system disorders',
        icon: 'fa-brain',
        professional_category: ProfessionalCategoryType.SPECIALIST,
        is_popular: false,
        display_order: 8,
      },
      {
        name: 'Endocrinologist',
        slug: 'endocrinologist',
        description: 'Hormone and metabolism specialist',
        icon: 'fa-pills',
        professional_category: ProfessionalCategoryType.SPECIALIST,
        is_popular: false,
        display_order: 9,
      },
      {
        name: 'Gastroenterologist',
        slug: 'gastroenterologist',
        description: 'Digestive system specialist',
        icon: 'fa-stomach',
        professional_category: ProfessionalCategoryType.SPECIALIST,
        is_popular: false,
        display_order: 10,
      },
      {
        name: 'Pulmonologist',
        slug: 'pulmonologist',
        description: 'Lung and respiratory specialist',
        icon: 'fa-lungs',
        professional_category: ProfessionalCategoryType.SPECIALIST,
        is_popular: false,
        display_order: 11,
      },
      {
        name: 'Urologist',
        slug: 'urologist',
        description: 'Specialist in urinary tract and male reproductive health',
        icon: 'fa-kidneys',
        professional_category: ProfessionalCategoryType.SPECIALIST,
        is_popular: false,
        display_order: 12,
      },
      {
        name: 'Ophthalmologist',
        slug: 'ophthalmologist',
        description: 'Eye and vision specialist',
        icon: 'fa-eye',
        professional_category: ProfessionalCategoryType.SPECIALIST,
        is_popular: false,
        display_order: 13,
      },
      {
        name: 'ENT Specialist',
        slug: 'ent-specialist',
        description: 'Ear, nose, and throat specialist',
        icon: 'fa-head-side-cough',
        professional_category: ProfessionalCategoryType.SPECIALIST,
        is_popular: false,
        display_order: 14,
      },
      {
        name: 'Pharmacist',
        slug: 'pharmacist',
        description: 'Medication and drug therapy expert',
        icon: 'fa-prescription-bottle-alt',
        professional_category: ProfessionalCategoryType.PHARMACIST,
        is_popular: false,
        display_order: 15,
      },
      {
        name: 'Psychologist',
        slug: 'psychologist',
        description: 'Mental health counseling and therapy specialist',
        icon: 'fa-comments',
        professional_category: ProfessionalCategoryType.THERAPIST,
        is_popular: false,
        display_order: 16,
      },
    ];

    for (const category of defaultCategories) {
      const existing = await this.findBySlug(category.slug);
      if (!existing) {
        await create(this.categoryModel, { ...category, is_active: true });
      }
    }
  }
}
