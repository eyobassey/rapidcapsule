import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SpecialistPrescriptionService } from './specialist-prescription.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';

/**
 * Public controller for prescription verification
 * No authentication required - used for QR code scanning
 */
@ApiTags('Prescription Verification')
@Controller('prescriptions/verify')
export class PrescriptionVerifyController {
  constructor(
    private readonly prescriptionService: SpecialistPrescriptionService,
  ) {}

  @ApiOperation({ summary: 'Verify prescription by number', description: 'Public endpoint to verify a prescription by its prescription number. Used for QR code scanning — no authentication required.' })
  @ApiParam({ name: 'prescriptionNumber', description: 'The prescription number to verify', example: 'RX-20251217-0001' })
  @ApiQuery({ name: 'h', required: false, description: 'Optional verification hash from QR code', example: 'a1b2c3d4e5f6' })
  @ApiResponse({ status: 200, description: 'Prescription verified successfully with prescription details' })
  @ApiResponse({ status: 404, description: 'Prescription not found or invalid' })
  @Get(':prescriptionNumber')
  async verifyPrescription(
    @Param('prescriptionNumber') prescriptionNumber: string,
    @Query('h') hash?: string,
  ) {
    const result = await this.prescriptionService.verifyPrescription(
      prescriptionNumber,
      hash,
    );
    return sendSuccessResponse('Prescription verified successfully', result);
  }
}
