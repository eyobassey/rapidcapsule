import { IsArray, IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class AssignLanguagesDto {
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  language_ids: Types.ObjectId[];
}

export class AssignCategoriesDto {
  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  category_ids: Types.ObjectId[];
}
