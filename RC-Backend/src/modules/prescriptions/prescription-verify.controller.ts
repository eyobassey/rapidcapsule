import { Controller, Get, Param, Query } from '@nestjs/common';
import { SpecialistPrescriptionService } from './specialist-prescription.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';

/**
 * Public controller for prescription verification
 * No authentication required - used for QR code scanning
 */
@Controller('prescriptions/verify')
export class PrescriptionVerifyController {
  constructor(
    private readonly prescriptionService: SpecialistPrescriptionService,
  ) {}

  /**
   * GET /api/prescriptions/verify/:prescriptionNumber
   * Verify a prescription by its prescription number
   * @param prescriptionNumber The prescription number (e.g., RX-20251217-0001)
   * @param h Optional hash to validate (from QR code)
   */
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
