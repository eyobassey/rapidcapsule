import { PartialType } from '@nestjs/mapped-types';
import { CreateSpecialistCategoryDto } from './create-specialist-category.dto';

export class UpdateSpecialistCategoryDto extends PartialType(CreateSpecialistCategoryDto) {}
