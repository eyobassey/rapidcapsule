import { PartialType } from '@nestjs/swagger';
import { CreateSpecialistCategoryDto } from './create-specialist-category.dto';

export class UpdateSpecialistCategoryDto extends PartialType(CreateSpecialistCategoryDto) {}
