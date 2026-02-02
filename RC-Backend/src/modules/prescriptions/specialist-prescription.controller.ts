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

@Controller('specialist/prescriptions')
export class SpecialistPrescriptionController {
  constructor(
    private readonly prescriptionService: SpecialistPrescriptionService,
  ) {}

  // ============ PRESCRIPTION CRUD ============

  /**
   * POST /api/specialist/prescriptions
   * Create a new prescription
   */
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

  /**
   * GET /api/specialist/prescriptions
   * List prescriptions for the logged-in specialist
   */
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

  /**
   * GET /api/specialist/prescriptions/stats
   * Get prescription statistics for the specialist
   */
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getStats(@Request() req) {
    const result = await this.prescriptionService.getSpecialistStats(
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/prescriptions/patient/:patientId/wallet-balance
   * Get patient's wallet balance for prescription payment
   */
  @UseGuards(JwtAuthGuard)
  @Get('patient/:patientId/wallet-balance')
  async getPatientWalletBalance(@Param('patientId') patientId: string) {
    const result = await this.prescriptionService.getPatientWalletBalance(
      new Types.ObjectId(patientId),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/specialist/prescriptions/linkable-appointments/:patientId
   * Get completed appointments for a specialist-patient pair (for linking UI)
   */
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

  /**
   * GET /api/specialist/prescriptions/for-appointment/:appointmentId
   * Get prescriptions linked to a specific appointment (reverse-lookup)
   */
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

  /**
   * POST /api/specialist/prescriptions/for-appointments
   * Get prescriptions linked to multiple appointments (batch reverse-lookup)
   */
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

  /**
   * GET /api/specialist/prescriptions/:id
   * Get single prescription details
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getPrescription(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.getPrescription(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * PATCH /api/specialist/prescriptions/:id
   * Update a draft prescription
   */
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

  /**
   * DELETE /api/specialist/prescriptions/:id
   * Cancel a prescription (legacy)
   */
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

  /**
   * POST /api/specialist/prescriptions/:id/cancel
   * Cancel a prescription
   */
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

  /**
   * POST /api/specialist/prescriptions/:id/submit
   * Submit prescription for payment
   */
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

  /**
   * POST /api/specialist/prescriptions/:id/pay/wallet
   * Pay from specialist wallet
   */
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

  /**
   * POST /api/specialist/prescriptions/:id/pay/patient-wallet
   * Charge patient's wallet directly (specialist initiates)
   * Supports full and partial payments
   */
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

  /**
   * POST /api/specialist/prescriptions/:id/pay/send-link
   * Send payment link to patient
   */
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

  /**
   * POST /api/specialist/prescriptions/:id/pay/cash
   * Mark prescription for cash payment on delivery
   */
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

  /**
   * POST /api/specialist/prescriptions/:id/send-to-patient
   * Send prescription to patient for review and self-payment
   * Generates PDF and sets 48-hour acceptance window
   */
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

  /**
   * POST /api/specialist/prescriptions/:id/dispense
   * Mark prescription as dispensed
   */
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

  /**
   * POST /api/specialist/prescriptions/:id/ship
   * Add shipping information
   */
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

  /**
   * POST /api/specialist/prescriptions/:id/deliver
   * Mark prescription as delivered
   */
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

  /**
   * POST /api/specialist/prescriptions/:id/link-records
   * Link appointments and/or clinical notes to a prescription
   */
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

  /**
   * POST /api/specialist/prescriptions/:id/unlink-records
   * Unlink appointments and/or clinical notes from a prescription
   */
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
}

// ============ PATIENT ENDPOINTS ============

@Controller('patient/prescriptions')
export class PatientPrescriptionController {
  constructor(
    private readonly prescriptionService: SpecialistPrescriptionService,
    private readonly refillService: RefillService,
  ) {}

  /**
   * GET /api/patient/prescriptions
   * Get prescriptions created by specialists for this patient
   */
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

  /**
   * GET /api/patient/prescriptions/wallet-balance
   * Get patient's wallet balance for self-payment (static route - must come before :id)
   */
  @UseGuards(JwtAuthGuard)
  @Get('wallet-balance')
  async getMyWalletBalance(@Request() req) {
    const result = await this.prescriptionService.getPatientWalletBalance(
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/patient/prescriptions/for-pharmacy
   * Get specialist prescriptions that can be used for pharmacy orders
   * Returns prescriptions with paid/accepted status that have drug_id references
   */
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

  /**
   * GET /api/patient/prescriptions/for-appointment/:appointmentId
   * Get prescriptions linked to a specific appointment for this patient
   */
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

  /**
   * POST /api/patient/prescriptions/:id/accept-for-pharmacy
   * Implicitly accept a prescription when patient selects it for pharmacy order
   * This updates prescriptions in pending_acceptance status to accepted
   */
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

  /**
   * GET /api/patient/prescriptions/by-number/:prescriptionNumber
   * Get a prescription by its prescription number (static route - must come before :id)
   */
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

  /**
   * GET /api/patient/prescriptions/:id
   * Get a specific prescription details for this patient
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getPrescriptionDetails(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.getPatientPrescription(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * GET /api/patient/prescriptions/:id/pdf
   * Get PDF download URL for prescription
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/pdf')
  async getPrescriptionPdf(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.getPrescriptionPdf(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * POST /api/patient/prescriptions/:id/accept
   * Accept prescription (full or partial)
   */
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

  /**
   * POST /api/patient/prescriptions/:id/decline
   * Decline prescription
   */
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

  /**
   * POST /api/patient/prescriptions/:id/pay/wallet
   * Pay prescription from patient's wallet
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay/wallet')
  async payWithWallet(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.patientPayWithWallet(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.TRANSACTION_VERIFIED, result);
  }

  /**
   * POST /api/patient/prescriptions/:id/pay/card/initialize
   * Initialize card payment for prescription
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay/card/initialize')
  async initializeCardPayment(@Request() req, @Param('id') id: string) {
    const result = await this.prescriptionService.patientInitiateCardPayment(
      new Types.ObjectId(id),
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * POST /api/patient/prescriptions/:id/pay/card/verify
   * Verify card payment for prescription
   */
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

  /**
   * GET /api/patient/prescriptions/:id/wallet-balance
   * Get patient's wallet balance for self-payment
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/wallet-balance')
  async getWalletBalance(@Request() req) {
    const result = await this.prescriptionService.getPatientWalletBalance(
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ REFILL MANAGEMENT ============

  /**
   * GET /api/patient/prescriptions/:id/refill/eligibility
   * Check if prescription is eligible for refill
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/refill/eligibility')
  async checkRefillEligibility(@Request() req, @Param('id') id: string) {
    const result = await this.refillService.checkRefillEligibility(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * POST /api/patient/prescriptions/:id/refill
   * Request a refill for prescription
   */
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

  /**
   * GET /api/patient/prescriptions/:id/refill/history
   * Get refill history for a prescription
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/refill/history')
  async getRefillHistory(@Request() req, @Param('id') id: string) {
    const result = await this.refillService.getRefillHistory(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  // ============ PHARMACY RATING ============

  /**
   * POST /api/patient/prescriptions/:id/rate
   * Rate the pharmacy experience for a delivered prescription
   */
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

@Controller('prescriptions')
export class PrescriptionPaymentController {
  constructor(
    private readonly prescriptionService: SpecialistPrescriptionService,
  ) {}

  /**
   * POST /api/prescriptions/:id/pay/patient
   * Process patient online payment (verify Paystack payment)
   * Public endpoint - no auth required as patient clicks payment link
   */
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

  /**
   * GET /api/prescriptions/:id/pay/verify
   * Verify payment status (for frontend to check payment)
   */
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

  /**
   * GET /api/prescriptions/:id/public
   * Get prescription details for payment page (limited info)
   */
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

  /**
   * PATCH /api/prescriptions/:id/pickup-center
   * Set or update pickup center for a prescription
   * Patient can select where to pick up their order
   */
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

  /**
   * PATCH /api/prescriptions/:id/ready-for-pickup
   * Mark prescription as ready for pickup
   * Called by pickup center staff when order arrives
   */
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

  /**
   * POST /api/prescriptions/:id/confirm-pickup
   * Confirm patient pickup
   * Called by pickup center staff when patient collects order
   */
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

  /**
   * GET /api/prescriptions/pickup-orders/:pharmacyId
   * Get all pickup orders for a specific pharmacy
   */
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
