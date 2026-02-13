import { PartialType } from '@nestjs/swagger';
import { VerifyTransactionDto } from './verify-transaction.dto';

export class UpdateTransactionDto extends PartialType(VerifyTransactionDto) {}
