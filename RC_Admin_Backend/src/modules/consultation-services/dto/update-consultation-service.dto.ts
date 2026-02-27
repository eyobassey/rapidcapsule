import { PartialType } from '@nestjs/swagger';
import { CreateConsultationServiceDto } from './create-consultation-service.dto';

export class UpdateConsultationServiceDto extends PartialType(CreateConsultationServiceDto) {}
