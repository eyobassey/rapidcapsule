import { PartialType } from '@nestjs/mapped-types';
import { CreateConsultationServiceDto } from './create-consultation-service.dto';

export class UpdateConsultationServiceDto extends PartialType(CreateConsultationServiceDto) {}
