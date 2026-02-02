import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpecialistCategoriesService } from './specialist-categories.service';
import { SpecialistCategoriesController } from './specialist-categories.controller';
import {
  SpecialistCategory,
  SpecialistCategorySchema,
} from './entities/specialist-category.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SpecialistCategory.name, schema: SpecialistCategorySchema },
    ]),
  ],
  controllers: [SpecialistCategoriesController],
  providers: [SpecialistCategoriesService],
  exports: [SpecialistCategoriesService, MongooseModule],
})
export class SpecialistCategoriesModule {}
