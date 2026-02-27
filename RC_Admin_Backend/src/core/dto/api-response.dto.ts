import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ description: 'HTTP status code', example: 200 })
  statusCode: number;

  @ApiProperty({ description: 'Response message', example: 'Success' })
  message: string;

  @ApiPropertyOptional({ description: 'Response payload' })
  data?: T;
}

export class ApiPaginatedResponseDto<T = any> extends ApiResponseDto {
  @ApiProperty({
    description: 'Paginated response payload',
    example: {
      result: [],
      total: 150,
      page: 1,
      limit: 20,
      totalPages: 8,
    },
  })
  declare data: {
    result: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ApiErrorResponseDto {
  @ApiProperty({ description: 'HTTP status code', example: 400 })
  statusCode: number;

  @ApiProperty({
    description: 'Error message or array of validation errors',
    example: 'Validation failed',
  })
  message: string | string[];

  @ApiProperty({ description: 'Error type', example: 'Bad Request' })
  error: string;
}
