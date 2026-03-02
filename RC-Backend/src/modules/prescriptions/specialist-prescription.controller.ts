import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { SpecialistPrescriptionService } from './specialist-prescription.service';
import { sendSuccessResponse } from '../../core/responses/success.responses';
import { Messages } from '../../core/messages/messages';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateSpecialistPrescriptionDto,
  UpdateSpecialistPrescriptionDto,
  SpecialistPrescriptionQueryDto,
  PayFromWalletDto,
  PayFromPatientWalletDto,
  SendPaymentLinkDto,
  ProcessPatientPaymentDto,
  DispenseDto,
  ShipDto,
  DeliverDto,
  CancelPrescriptionDto,
  LinkRecordsDto,
} from './dto/specialist-prescription.dto';
import { PrescriptionPaymentMethod } from './entities/specialist-prescription.entity';
import { RefillService } from './services/refill.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Specialist Prescriptions')
@ApiBearerAuth('JWT-auth')
@Controller('specialist/prescriptions')
export class SpecialistPrescriptionController {
  constructor(
    private readonly prescriptionService: SpecialistPrescriptionService,
  ) {}

  // ============ PRESCRIPTION CRUD ============

  @ApiOperation({ summary: 'Create specialist prescription', description: 'Create a new prescription for a patient with medication items, delivery address, and payment method' })
  @ApiResponse({ status: 201, description: 'Prescription created with stock reservation details' })
  @ApiResponse({ status: 400, description: 'Invalid prescription data or insufficient stock' })
  @UseGuards(JwtAuthGuard)
  @Post()
  async createPrescription(
    @Request() req,
    @Body() dto: CreateSpecialistPrescriptionDto,
  ) {
    const result = await this.prescriptionService.createPrescription(
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  @ApiOperation({ summary: 'List specialist prescriptions', description: 'List all prescriptions created by the authenticated specialist with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of prescriptions' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getPrescriptions(
    @Request() req,
    @Query() query: SpecialistPrescriptionQueryDto,
  ) {
    const result = await this.prescriptionService.getSpecialistPrescriptions(
      new Types.ObjectId(req.user.sub),
      query,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get prescription statistics', description: 'Get prescription statistics for the authenticated specialist (counts by status, revenue, etc.)' })
  @ApiResponse({ status: 200, description: 'Prescription statistics returned' })
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats(@Request() req) {
    const result = await this.prescriptionService.getSpecialistStats(
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get patient wallet balance', description: 'Check a patient\'s wallet balance before initiating wallet payment for a prescription' })
  @ApiResponse({ status: 200, description: 'Patient wallet balance returned' })
  @ApiResponse({ status: 404, description: 'Patient not found' })
  @UseGuards(JwtAuthGuard)
  @Get('patient/:patientId/wallet-balance')
  async getPatientWalletBalance(@Param('patientId') patientId: string) {
    const result = await this.prescriptionService.getPatientWalletBalance(
      new Types.ObjectId(patientId),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get linkable appointments', description: 'Get completed appointments between this specialist and a patient, for linking to prescriptions' })
  @ApiResponse({ status: 200, description: 'List of completed appointments returned' })
  @UseGuards(JwtAuthGuard)
  @Get('linkable-appointments/:patientId')
  async getLinkableAppointments(
    @Request() req,
    @Param('patientId') patientId: string,
  ) {
    const result = await this.prescriptionService.getCompletedAppointments(
      new Types.ObjectId(req.user.sub),
      new Types.ObjectId(patientId),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get prescriptions for appointment', description: 'Get all prescriptions linked to a specific appointment (reverse-lookup)' })
  @ApiResponse({ status: 200, description: 'Prescriptions for the appointment returned' })
  @UseGuards(JwtAuthGuard)
  @Get('for-appointment/:appointmentId')
  async getPrescriptionsForAppointment(
    @Request() req,
    @Param('appointmentId') appointmentId: string,
  ) {
    const result = await this.prescriptionService.getPrescriptionsForAppointment(
      new Types.ObjectId(req.user.sub),
      new Types.ObjectId(appointmentId),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Batch get prescriptions for appointments', description: 'Get prescriptions linked to multiple appointments in a single request' })
  @ApiResponse({ status: 200, description: 'Prescriptions grouped by appointment returned' })
  @UseGuards(JwtAuthGuard)
  @Post('for-appointments')
  async getPrescriptionsForAppointments(
    @Request() req,
    @Body('appointment_ids') appointmentIds: string[],
  ) {
    const ids = (appointmentIds || []).map(id => new Types.ObjectId(id));
    const result = await this.prescriptionService.getPrescriptionsForAppointments(
      new Types.ObjectId(req.user.sub),
      ids,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get single prescription', description: 'Get detailed information for a specific prescription' })
  @ApiResponse({ status: 200, description: 'Prescription details returned' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getPrescription(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.getPrescription(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Update draft prescription', description: 'Update items, delivery address, or notes on a draft prescription' })
  @ApiResponse({ status: 200, description: 'Prescription updated successfully' })
  @ApiResponse({ status: 400, description: 'Prescription is not in draft status' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updatePrescription(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateSpecialistPrescriptionDto,
  ) {
    const result = await this.prescriptionService.updatePrescription(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Cancel prescription (DELETE)', description: 'Cancel a prescription using DELETE method (legacy endpoint)' })
  @ApiResponse({ status: 200, description: 'Prescription cancelled' })
  @ApiResponse({ status: 400, description: 'Prescription cannot be cancelled in current status' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async cancelPrescriptionDelete(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CancelPrescriptionDto,
  ) {
    const result = await this.prescriptionService.cancelPrescription(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse(Messages.DELETED, result);
  }

  @ApiOperation({ summary: 'Cancel prescription', description: 'Cancel a prescription with a reason' })
  @ApiResponse({ status: 200, description: 'Prescription cancelled' })
  @ApiResponse({ status: 400, description: 'Prescription cannot be cancelled in current status' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancelPrescription(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CancelPrescriptionDto,
  ) {
    const result = await this.prescriptionService.cancelPrescription(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse(Messages.DELETED, result);
  }

  // ============ SUBMISSION ============

  @ApiOperation({ summary: 'Submit for payment', description: 'Submit a draft prescription for payment processing with the selected payment method' })
  @ApiResponse({ status: 200, description: 'Prescription submitted for payment' })
  @ApiResponse({ status: 400, description: 'Invalid payment method or prescription not in draft status' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  async submitForPayment(
    @Request() req,
    @Param('id') id: string,
    @Body('payment_method') paymentMethod: PrescriptionPaymentMethod,
  ) {
    const result = await this.prescriptionService.submitForPayment(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      paymentMethod,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  // ============ PAYMENT ============

  @ApiOperation({ summary: 'Pay from specialist wallet', description: 'Pay for the prescription from the specialist\'s wallet balance' })
  @ApiResponse({ status: 200, description: 'Payment processed from wallet' })
  @ApiResponse({ status: 400, description: 'Insufficient wallet balance' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay/wallet')
  async payFromWallet(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: PayFromWalletDto,
  ) {
    const result = await this.prescriptionService.payFromWallet(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }

  @ApiOperation({ summary: 'Pay from patient wallet', description: 'Charge the patient\'s wallet directly. Supports full and partial payments.' })
  @ApiResponse({ status: 200, description: 'Payment processed from patient wallet' })
  @ApiResponse({ status: 400, description: 'Insufficient balance (if partial not allowed)' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay/patient-wallet')
  async payFromPatientWallet(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: PayFromPatientWalletDto,
  ) {
    const result = await this.prescriptionService.payFromPatientWallet(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }

  @ApiOperation({ summary: 'Send payment link to patient', description: 'Send an email to the patient with a Paystack payment link for the prescription' })
  @ApiResponse({ status: 200, description: 'Payment link sent to patient' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay/send-link')
  async sendPaymentLink(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: SendPaymentLinkDto,
  ) {
    const result = await this.prescriptionService.sendPaymentLink(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Mark as cash payment', description: 'Mark the prescription for cash payment on delivery' })
  @ApiResponse({ status: 200, description: 'Prescription marked for cash payment' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay/cash')
  async markAsCashPayment(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.markAsCashPayment(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  // ============ SEND TO PATIENT ============

  @ApiOperation({ summary: 'Send prescription to patient', description: 'Send prescription to patient for review and self-payment. Generates PDF and sets 48-hour acceptance window.' })
  @ApiResponse({ status: 200, description: 'Prescription sent to patient with PDF generated' })
  @ApiResponse({ status: 400, description: 'Prescription not in valid state for sending' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/send-to-patient')
  async sendToPatient(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.sendToPatient(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  // ============ FULFILLMENT ============

  @ApiOperation({ summary: 'Mark as dispensed', description: 'Mark the prescription as dispensed by the pharmacy' })
  @ApiResponse({ status: 200, description: 'Prescription marked as dispensed' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/dispense')
  async markAsDispensed(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: DispenseDto,
  ) {
    const result = await this.prescriptionService.markAsDispensed(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Mark as shipped', description: 'Add shipping information and mark the prescription as shipped' })
  @ApiResponse({ status: 200, description: 'Prescription marked as shipped with tracking info' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/ship')
  async markAsShipped(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ShipDto,
  ) {
    const result = await this.prescriptionService.markAsShipped(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Mark as delivered', description: 'Mark the prescription as delivered to the patient' })
  @ApiResponse({ status: 200, description: 'Prescription marked as delivered' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/deliver')
  async markAsDelivered(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: DeliverDto,
  ) {
    const result = await this.prescriptionService.markAsDelivered(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  // ============ LINKED RECORDS ============

  @ApiOperation({ summary: 'Link records to prescription', description: 'Link appointments, health checkups, and/or clinical notes to a prescription' })
  @ApiResponse({ status: 200, description: 'Records linked successfully' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/link-records')
  async linkRecords(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: LinkRecordsDto,
  ) {
    const result = await this.prescriptionService.linkRecords(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Unlink records from prescription', description: 'Remove linked appointments, health checkups, and/or clinical notes from a prescription' })
  @ApiResponse({ status: 200, description: 'Records unlinked successfully' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/unlink-records')
  async unlinkRecords(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: LinkRecordsDto,
  ) {
    const result = await this.prescriptionService.unlinkRecords(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  // ============ PDF & SHARING ============

  @ApiOperation({ summary: 'Get prescription PDF', description: 'Get the PDF download URL for a prescription (specialist access)' })
  @ApiResponse({ status: 200, description: 'PDF URL returned' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @UseGuards(JwtAuthGuard)
  @Get(':id/pdf')
  async getPrescriptionPdf(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.getPrescriptionPdfForSpecialist(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Share prescription via email', description: 'Send the prescription to the patient\'s email with optional PDF attachment' })
  @ApiResponse({ status: 200, description: 'Prescription shared via email' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/share/email')
  async sharePrescriptionEmail(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { recipient_email?: string; include_pdf?: boolean },
  ) {
    const result = await this.prescriptionService.sharePrescriptionByEmail(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      dto.recipient_email,
      dto.include_pdf ?? true,
    );
    return sendSuccessResponse('Prescription shared successfully', result);
  }

  // ============ PRESCRIPTION COUNTS ============

  @ApiOperation({ summary: 'Get prescription counts for checkups', description: 'Get prescription counts for multiple health checkups in a single request' })
  @ApiResponse({ status: 200, description: 'Prescription counts per checkup returned' })
  @UseGuards(JwtAuthGuard)
  @Post('checkup-counts')
  async getPrescriptionCountsForCheckups(
    @Request() req,
    @Body('checkup_ids') checkupIds: string[],
  ) {
    const result = await this.prescriptionService.getPrescriptionCountsForCheckups(
      checkupIds.map((id) => new Types.ObjectId(id)),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get prescription counts for appointments', description: 'Get prescription counts for multiple appointments in a single request' })
  @ApiResponse({ status: 200, description: 'Prescription counts per appointment returned' })
  @UseGuards(JwtAuthGuard)
  @Post('appointment-counts')
  async getPrescriptionCountsForAppointments(
    @Request() req,
    @Body('appointment_ids') appointmentIds: string[],
  ) {
    const result = await this.prescriptionService.getPrescriptionCountsForAppointments(
      appointmentIds.map((id) => new Types.ObjectId(id)),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get prescriptions by health checkup', description: 'Get all prescriptions linked to a specific health checkup' })
  @ApiResponse({ status: 200, description: 'Prescriptions for the checkup returned' })
  @UseGuards(JwtAuthGuard)
  @Get('by-checkup/:checkupId')
  async getPrescriptionsByCheckup(
    @Request() req,
    @Param('checkupId') checkupId: string,
  ) {
    const result = await this.prescriptionService.getPrescriptionsByHealthCheckup(
      new Types.ObjectId(checkupId),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }
}

// ============ PATIENT ENDPOINTS ============

@ApiTags('Patient Prescriptions')
@ApiBearerAuth('JWT-auth')
@Controller('patient/prescriptions')
export class PatientPrescriptionController {
  constructor(
    private readonly prescriptionService: SpecialistPrescriptionService,
    private readonly refillService: RefillService,
  ) {}

  @ApiOperation({ summary: 'Get my prescriptions', description: 'Get paginated list of prescriptions created by specialists for the authenticated patient' })
  @ApiResponse({ status: 200, description: 'Paginated prescriptions returned' })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getMyPrescriptions(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const result = await this.prescriptionService.getPatientPrescriptions(
      new Types.ObjectId(req.user.sub),
      { page: page || 1, limit: limit || 20, status },
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get my wallet balance', description: 'Get the authenticated patient\'s wallet balance for prescription self-payment' })
  @ApiResponse({ status: 200, description: 'Wallet balance returned' })
  @UseGuards(JwtAuthGuard)
  @Get('wallet-balance')
  async getMyWalletBalance(@Request() req) {
    const result = await this.prescriptionService.getPatientWalletBalance(
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get prescriptions for pharmacy order', description: 'Get specialist prescriptions that can be used for pharmacy orders. Returns paid/accepted prescriptions with drug_id references.' })
  @ApiResponse({ status: 200, description: 'Eligible prescriptions returned' })
  @UseGuards(JwtAuthGuard)
  @Get('for-pharmacy')
  async getPrescriptionsForPharmacy(
    @Request() req,
    @Query('drug_ids') drugIds?: string,
  ) {
    // Parse drug_ids if provided (comma-separated list)
    const parsedDrugIds = drugIds
      ? drugIds.split(',').map((id) => id.trim()).filter(Boolean)
      : undefined;

    const result = await this.prescriptionService.getPatientPrescriptionsForPharmacy(
      new Types.ObjectId(req.user.sub),
      parsedDrugIds,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get prescriptions for appointment', description: 'Get prescriptions linked to a specific appointment for the authenticated patient' })
  @ApiResponse({ status: 200, description: 'Prescriptions for the appointment returned' })
  @UseGuards(JwtAuthGuard)
  @Get('for-appointment/:appointmentId')
  async getPrescriptionsForAppointment(
    @Request() req,
    @Param('appointmentId') appointmentId: string,
  ) {
    const result = await this.prescriptionService.getPatientPrescriptionsForAppointment(
      new Types.ObjectId(req.user.sub),
      new Types.ObjectId(appointmentId),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Accept prescription for pharmacy use', description: 'Implicitly accept a prescription when selecting it for a pharmacy order' })
  @ApiResponse({ status: 200, description: 'Prescription accepted for pharmacy use' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/accept-for-pharmacy')
  async acceptPrescriptionForPharmacy(
    @Request() req,
    @Param('id') id: string,
  ) {
    const result = await this.prescriptionService.acceptPrescriptionForPharmacyUse(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse('Prescription accepted for pharmacy use', result);
  }

  @ApiOperation({ summary: 'Get prescription by number', description: 'Look up a prescription by its prescription number (e.g., RX-20251217-0001)' })
  @ApiResponse({ status: 200, description: 'Prescription details returned' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @UseGuards(JwtAuthGuard)
  @Get('by-number/:prescriptionNumber')
  async getPrescriptionByNumber(
    @Request() req,
    @Param('prescriptionNumber') prescriptionNumber: string,
  ) {
    const result = await this.prescriptionService.getPatientPrescriptionByNumber(
      prescriptionNumber,
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get prescription details', description: 'Get detailed information for a specific prescription belonging to the patient' })
  @ApiResponse({ status: 200, description: 'Prescription details returned' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getPrescriptionDetails(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.getPatientPrescription(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Get prescription PDF', description: 'Get the PDF download URL for a prescription' })
  @ApiResponse({ status: 200, description: 'PDF URL returned' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @UseGuards(JwtAuthGuard)
  @Get(':id/pdf')
  async getPrescriptionPdf(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.getPrescriptionPdf(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Accept prescription', description: 'Accept a prescription fully or partially by specifying accepted item IDs' })
  @ApiResponse({ status: 200, description: 'Prescription accepted' })
  @ApiResponse({ status: 400, description: 'Prescription not in pending_acceptance status' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/accept')
  async acceptPrescription(
    @Request() req,
    @Param('id') id: string,
    @Body('accepted_items') acceptedItems?: string[],
  ) {
    const result = await this.prescriptionService.acceptPrescription(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      acceptedItems,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Decline prescription', description: 'Decline a prescription with a reason, optionally declining specific items' })
  @ApiResponse({ status: 200, description: 'Prescription declined' })
  @ApiResponse({ status: 400, description: 'Prescription not in pending_acceptance status' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/decline')
  async declinePrescription(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('declined_items') declinedItems?: Array<{ item_id: string; reason: string }>,
  ) {
    const result = await this.prescriptionService.declinePrescription(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      reason,
      declinedItems,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  @ApiOperation({ summary: 'Pay with wallet', description: 'Pay for a prescription from the patient\'s wallet balance' })
  @ApiResponse({ status: 200, description: 'Payment processed from wallet' })
  @ApiResponse({ status: 400, description: 'Insufficient wallet balance' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay/wallet')
  async payWithWallet(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.patientPayWithWallet(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }

  @ApiOperation({ summary: 'Initialize card payment', description: 'Initialize a Paystack card payment transaction for the prescription' })
  @ApiResponse({ status: 200, description: 'Payment initialized with authorization URL' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay/card/initialize')
  async initializeCardPayment(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.patientInitiateCardPayment(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Verify card payment', description: 'Verify a Paystack card payment reference for the prescription' })
  @ApiResponse({ status: 200, description: 'Payment verified and prescription updated' })
  @ApiResponse({ status: 400, description: 'Invalid or failed payment reference' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay/card/verify')
  async verifyCardPayment(
    @Request() req,
    @Param('id') id: string,
    @Body('reference') reference: string,
  ) {
    const result = await this.prescriptionService.patientVerifyCardPayment(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      reference,
    );
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }

  @ApiOperation({ summary: 'Get wallet balance for prescription', description: 'Get the patient\'s wallet balance for self-payment on a specific prescription' })
  @ApiResponse({ status: 200, description: 'Wallet balance returned' })
  @UseGuards(JwtAuthGuard)
  @Get(':id/wallet-balance')
  async getWalletBalance(@Request() req) {
    const result = await this.prescriptionService.getPatientWalletBalance(
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ REFILL MANAGEMENT ============

  @ApiOperation({ summary: 'Check refill eligibility', description: 'Check if a prescription is eligible for refill based on refill count and expiry' })
  @ApiResponse({ status: 200, description: 'Refill eligibility status returned' })
  @UseGuards(JwtAuthGuard)
  @Get(':id/refill/eligibility')
  async checkRefillEligibility(@Request() req, @Param('id') id: string) {
    const result = await this.refillService.checkRefillEligibility(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Request prescription refill', description: 'Request a refill for an eligible prescription with optional delivery address' })
  @ApiResponse({ status: 200, description: 'Refill requested successfully' })
  @ApiResponse({ status: 400, description: 'Prescription not eligible for refill' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/refill')
  async requestRefill(
    @Request() req,
    @Param('id') id: string,
    @Body('delivery_address') deliveryAddress?: any,
  ) {
    const result = await this.refillService.requestRefill(
      id,
      req.user.sub,
      deliveryAddress,
    );
    return sendSuccessResponse('Refill requested successfully', result);
  }

  @ApiOperation({ summary: 'Get refill history', description: 'Get the refill history for a prescription' })
  @ApiResponse({ status: 200, description: 'Refill history returned' })
  @UseGuards(JwtAuthGuard)
  @Get(':id/refill/history')
  async getRefillHistory(@Request() req, @Param('id') id: string) {
    const result = await this.refillService.getRefillHistory(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  @ApiOperation({ summary: 'Check MAT refill eligibility', description: 'Check MAT-specific refill eligibility including appointment attendance, screening compliance, sobriety logging, and crisis event checks' })
  @ApiResponse({ status: 200, description: 'MAT refill eligibility status returned' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @ApiParam({ name: 'id', description: 'Prescription ID', example: '507f1f77bcf86cd799439011' })
  @UseGuards(JwtAuthGuard)
  @Get(':id/refill/mat-eligibility')
  async checkMATRefillEligibility(@Request() req, @Param('id') id: string) {
    const result = await this.refillService.checkMATRefillEligibility(id, req.user.sub);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ PHARMACY RATING ============

  @ApiOperation({ summary: 'Rate prescription experience', description: 'Rate the pharmacy experience for a delivered prescription (1-5 stars)' })
  @ApiResponse({ status: 200, description: 'Rating submitted successfully' })
  @ApiResponse({ status: 400, description: 'Prescription not in delivered status' })
  @UseGuards(JwtAuthGuard)
  @Post(':id/rate')
  async ratePrescription(
    @Request() req,
    @Param('id') id: string,
    @Body('rating') rating: number,
    @Body('review') review?: string,
  ) {
    const result = await this.prescriptionService.ratePrescription(
      id,
      req.user.sub,
      rating,
      review,
    );
    return sendSuccessResponse('Rating submitted successfully', result);
  }
}

// ============ PUBLIC ENDPOINTS FOR PATIENT PAYMENT ============

@ApiTags('Prescription Payments')
@Controller('prescriptions')
export class PrescriptionPaymentController {
  constructor(
    private readonly prescriptionService: SpecialistPrescriptionService,
  ) {}

  @ApiOperation({ summary: 'Process patient online payment', description: 'Verify a Paystack payment reference for a prescription. Public endpoint — no authentication required (patient clicks payment link).' })
  @ApiResponse({ status: 200, description: 'Payment verified and prescription updated' })
  @ApiResponse({ status: 400, description: 'Invalid or failed payment reference' })
  @Post(':id/pay/patient')
  async processPatientPayment(
    @Param('id') id: string,
    @Body() dto: ProcessPatientPaymentDto,
  ) {
    const result = await this.prescriptionService.processPatientPayment(
      new Types.ObjectId(id),
      dto,
    );
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }

  @ApiOperation({ summary: 'Check payment status', description: 'Check the current payment and prescription status (for frontend polling after payment)' })
  @ApiResponse({ status: 200, description: 'Payment status returned' })
  @Get(':id/pay/verify')
  async verifyPaymentStatus(@Param('id') id: string) {
    const prescription = await this.prescriptionService.getPrescription(
      new Types.ObjectId(id),
    );
    return sendSuccessResponse(Messages.RETRIEVED, {
      prescription_id: id,
      payment_status: prescription.payment_status,
      status: prescription.status,
    });
  }

  @ApiOperation({ summary: 'Get public prescription details', description: 'Get limited prescription details for the payment page. No authentication required.' })
  @ApiResponse({ status: 200, description: 'Public prescription details returned (items, totals, payment status)' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  @Get(':id/public')
  async getPublicPrescription(@Param('id') id: string) {
    const prescription = await this.prescriptionService.getPrescription(
      new Types.ObjectId(id),
    );
    return sendSuccessResponse(Messages.RETRIEVED, {
      prescription_number: prescription.prescription_number,
      items: prescription.items.map((item) => ({
        drug_name: item.drug_name,
        quantity: item.quantity,
        total_price: item.total_price,
      })),
      subtotal: prescription.subtotal,
      delivery_fee: prescription.delivery_fee,
      total_amount: prescription.total_amount,
      currency: prescription.currency,
      payment_status: prescription.payment_status,
      expires_at: prescription.expires_at,
      is_pickup_order: prescription.is_pickup_order,
      pickup_pharmacy_id: prescription.pickup_pharmacy_id,
    });
  }

  // ============ PICKUP CENTER ENDPOINTS ============

  @ApiOperation({ summary: 'Set pickup center', description: 'Set or update the pickup center pharmacy for a prescription' })
  @ApiResponse({ status: 200, description: 'Pickup center set successfully' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/pickup-center')
  async setPickupCenter(
    @Param('id') id: string,
    @Body('pickup_pharmacy_id') pickupPharmacyId: string,
    @Request() req,
  ) {
    const result = await this.prescriptionService.setPickupCenter(
      new Types.ObjectId(id),
      pickupPharmacyId,
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse('Pickup center set successfully', result);
  }

  @ApiOperation({ summary: 'Mark ready for pickup', description: 'Mark a prescription as ready for pickup. Called by pickup center staff when the order arrives.' })
  @ApiResponse({ status: 200, description: 'Order marked ready for pickup' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Patch(':id/ready-for-pickup')
  async markReadyForPickup(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @Request() req,
  ) {
    const result = await this.prescriptionService.markReadyForPickup(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
      notes,
    );
    return sendSuccessResponse('Order marked ready for pickup', result);
  }

  @ApiOperation({ summary: 'Confirm patient pickup', description: 'Confirm that the patient has collected their order. Called by pickup center staff.' })
  @ApiResponse({ status: 200, description: 'Pickup confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid pickup code' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Post(':id/confirm-pickup')
  async confirmPickup(
    @Param('id') id: string,
    @Body('pickup_code') pickupCode: string,
    @Body('notes') notes: string,
    @Request() req,
  ) {
    const result = await this.prescriptionService.confirmPickup(
      new Types.ObjectId(id),
      pickupCode,
      req.user.sub,
      notes,
    );
    return sendSuccessResponse('Pickup confirmed successfully', result);
  }

  @ApiOperation({ summary: 'Get pickup orders for pharmacy', description: 'Get all pickup orders for a specific pharmacy with optional status filter and pagination' })
  @ApiResponse({ status: 200, description: 'Pickup orders retrieved' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('pickup-orders/:pharmacyId')
  async getPickupOrdersForPharmacy(
    @Param('pharmacyId') pharmacyId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.prescriptionService.getPickupOrdersForPharmacy(
      pharmacyId,
      {
        status,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 20,
      },
    );
    return sendSuccessResponse('Pickup orders retrieved', result);
  }
}
