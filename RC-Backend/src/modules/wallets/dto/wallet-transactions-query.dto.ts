import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletTxnQueryDto {
  @ApiProperty({
    description: 'Current page number for pagination',
    example: 1,
  })
  @IsNotEmpty()
  currentPage: number;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    example: 20,
  })
  @IsOptional()
  pageLimit: number;

  @ApiPropertyOptional({
    description: 'Filter by transaction type (e.g. credit, debit)',
    example: 'credit',
  })
  @IsOptional()
  type: string;
}
