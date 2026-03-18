import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Current account password for confirmation',
    example: 'MyP@ssw0rd!',
  })
  @IsNotEmpty()
  @IsString()
  readonly password: string;
}
