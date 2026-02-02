import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Language, LanguageDocument } from './entities/language.entity';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectModel(Language.name) private languageModel: Model<LanguageDocument>,
  ) {}

  async findAllActive(): Promise<LanguageDocument[]> {
    return await this.languageModel
      .find({ is_active: true })
      .sort({ name: 1 })
      .exec();
  }

  async findByCode(code: string): Promise<LanguageDocument | null> {
    return await this.languageModel.findOne({
      code: code.toLowerCase(),
      is_active: true,
    });
  }

  async findByCodes(codes: string[]): Promise<LanguageDocument[]> {
    const lowerCodes = codes.map((c) => c.toLowerCase());
    return await this.languageModel.find({
      code: { $in: lowerCodes },
      is_active: true,
    });
  }
}
