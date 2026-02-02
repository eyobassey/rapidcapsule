import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Language, LanguageDocument } from './entities/language.entity';
import { CreateLanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';
import {
  create,
  find,
  findOne,
  updateOneAndReturn,
  countDocuments,
} from '../../common/crud/crud';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectModel(Language.name) private languageModel: Model<LanguageDocument>,
  ) {}

  async create(createLanguageDto: CreateLanguageDto): Promise<LanguageDocument> {
    // Check for existing language with same name or code
    const existing = await findOne(this.languageModel, {
      $or: [
        { name: createLanguageDto.name },
        { code: createLanguageDto.code.toLowerCase() },
      ],
    });

    if (existing) {
      throw new ConflictException('Language with this name or code already exists');
    }

    return await create(this.languageModel, {
      ...createLanguageDto,
      code: createLanguageDto.code.toLowerCase(),
    });
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    is_active?: boolean;
    search?: string;
  }): Promise<{
    data: LanguageDocument[];
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

    if (options?.search) {
      query.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { code: { $regex: options.search, $options: 'i' } },
        { native_name: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.languageModel
        .find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      countDocuments(this.languageModel, query),
    ]);

    return { data, total, page, limit };
  }

  async findAllActive(): Promise<LanguageDocument[]> {
    return await this.languageModel.find({ is_active: true }).sort({ name: 1 }).exec();
  }

  async findOne(id: Types.ObjectId): Promise<LanguageDocument> {
    const language = await findOne(this.languageModel, { _id: id });
    if (!language) {
      throw new NotFoundException('Language not found');
    }
    return language;
  }

  async findByCode(code: string): Promise<LanguageDocument | null> {
    return await findOne(this.languageModel, { code: code.toLowerCase() });
  }

  async update(
    id: Types.ObjectId,
    updateLanguageDto: UpdateLanguageDto,
  ): Promise<LanguageDocument> {
    // Check if language exists
    await this.findOne(id);

    // Check for conflicts with other languages
    if (updateLanguageDto.name || updateLanguageDto.code) {
      const conflictQuery: any = { _id: { $ne: id } };
      const orConditions = [];

      if (updateLanguageDto.name) {
        orConditions.push({ name: updateLanguageDto.name });
      }
      if (updateLanguageDto.code) {
        orConditions.push({ code: updateLanguageDto.code.toLowerCase() });
      }

      if (orConditions.length > 0) {
        conflictQuery.$or = orConditions;
        const existing = await findOne(this.languageModel, conflictQuery);
        if (existing) {
          throw new ConflictException('Language with this name or code already exists');
        }
      }
    }

    const updateData = { ...updateLanguageDto };
    if (updateData.code) {
      updateData.code = updateData.code.toLowerCase();
    }

    return await updateOneAndReturn(
      this.languageModel,
      { _id: id },
      updateData,
    );
  }

  async remove(id: Types.ObjectId): Promise<LanguageDocument> {
    // Soft delete by setting is_active to false
    await this.findOne(id);
    return await updateOneAndReturn(
      this.languageModel,
      { _id: id },
      { is_active: false },
    );
  }

  async hardDelete(id: Types.ObjectId): Promise<boolean> {
    const result = await this.languageModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }

  async seedDefaultLanguages(): Promise<void> {
    const defaultLanguages = [
      { name: 'English', code: 'en', native_name: 'English' },
      { name: 'Hausa', code: 'ha', native_name: 'Hausa' },
      { name: 'Yoruba', code: 'yo', native_name: 'Yoruba' },
      { name: 'Igbo', code: 'ig', native_name: 'Igbo' },
      { name: 'French', code: 'fr', native_name: 'Francais' },
      { name: 'Arabic', code: 'ar', native_name: 'العربية' },
      { name: 'Portuguese', code: 'pt', native_name: 'Portugues' },
      { name: 'Spanish', code: 'es', native_name: 'Espanol' },
      { name: 'Swahili', code: 'sw', native_name: 'Kiswahili' },
      { name: 'Pidgin English', code: 'pcm', native_name: 'Naija' },
    ];

    for (const lang of defaultLanguages) {
      const existing = await this.findByCode(lang.code);
      if (!existing) {
        await create(this.languageModel, { ...lang, is_active: true });
      }
    }
  }
}
