import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SubstanceHistoryDto } from './create-recovery-profile.dto';

export class AddSubstancesDto {
  @ApiProperty({
    description: 'Array of new substance history entries to add to the recovery profile',
    type: [SubstanceHistoryDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubstanceHistoryDto)
  readonly substances: SubstanceHistoryDto[];
}
