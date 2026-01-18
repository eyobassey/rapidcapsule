import { IsMongoId, IsNotEmpty } from 'class-validator';

export class PurchasePlanDto {
  @IsMongoId()
  @IsNotEmpty()
  plan_id: string;
}
