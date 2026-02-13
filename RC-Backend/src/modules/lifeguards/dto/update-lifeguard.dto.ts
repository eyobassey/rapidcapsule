import { PartialType } from '@nestjs/swagger';
import { CreateLifeguardDto } from './create-lifeguard.dto';

export class UpdateLifeguardDto extends PartialType(CreateLifeguardDto) {}
