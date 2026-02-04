import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import * as moment from 'moment';
import * as currency from 'currency.js';

import {
  SpecialistPrescription,
  SpecialistPrescriptionDocument,
  SpecialistPrescriptionStatus,
  PrescriptionPaymentMethod,
  PrescriptionPaymentStatus,
  PrescriptionItem,
  PatientResponse,
} from './entities/specialist-prescription.entity';
import { PrescriptionPdfService, PdfPrescriptionData } from './services/prescription-pdf.service';
import {
  StockReservation,
  StockReservationDocument,
  ReservationStatus,
} from './entities/stock-reservation.entity';
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
import { SpecialistWalletService } from '../wallets/specialist-wallet.service';
import { WalletsService } from '../wallets/wallets.service';
import { SpecialistTransactionReference } from '../wallets/entities/specialist-wallet-transaction.entity';
import { GeneralHelpers } from '../../common/helpers/general.helpers';
import { PaymentHandler } from '../../common/external/payment/payment.handler';
import { UsersService } from '../users/users.service';
import { UserSettingsService } from '../user-settings/user-settings.service';
import { PrescriptionNumberHelper } from '../../common/helpers/prescription-number.helper';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import {
  prescriptionCreatedEmail,
  prescriptionShippedEmail,
  prescriptionReadyForPickupEmail,
  prescriptionDeliveredEmail,
  prescriptionCancelledEmail,
  prescriptionRatingRequestEmail,
  PrescriptionEmailData,
  ShipmentEmailData,
  ReadyForPickupEmailData,
  CancelledEmailData,
} from '../../core/emails/mails/prescriptionEmails';
import {
  orderReadyForPickupEmail,
  pickupConfirmedEmail,
  newPickupOrderForPharmacyEmail,
  PickupReadyEmailData,
  PickupConfirmedEmailData,
  PickupOrderNotificationData,
} from '../../core/emails/mails/pickupEmails';

// Stock reservation duration in hours
const RESERVATION_HOURS = 6;

@Injectable()
export class SpecialistPrescriptionService {
  private readonly logger = new Logger(SpecialistPrescriptionService.name);

  constructor(
    @InjectModel(SpecialistPrescription.name)
    private prescriptionModel: Model<SpecialistPrescriptionDocument>,
    @InjectModel(StockReservation.name)
    private reservationModel: Model<StockReservationDocument>,
    @InjectConnection() private connection: Connection,
    private readonly walletService: SpecialistWalletService,
    private readonly patientWalletService: WalletsService,
    private readonly generalHelpers: GeneralHelpers,
    private readonly paymentHandler: PaymentHandler,
    private readonly usersService: UsersService,
    private readonly userSettingsService: UserSettingsService,
    private readonly prescriptionNumberHelper: PrescriptionNumberHelper,
    private readonly prescriptionPdfService: PrescriptionPdfService,
    private readonly fileUploadHelper: FileUploadHelper,
  ) {}

  // ============ EMAIL NOTIFICATIONS ============

  /**
   * Send prescription created email to patient
   */
  private async sendPrescriptionCreatedEmail(
    prescription: SpecialistPrescriptionDocument,
    patient: any,
    specialist: any,
  ): Promise<void> {
    try {
      const patientEmail = patient.profile?.contact?.email;
      if (!patientEmail) {
        this.logger.warn(`No email found for patient ${patient._id}`);
        return;
      }

      const emailData: PrescriptionEmailData = {
        patientName: patient.full_name || `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient',
        prescriptionNumber: prescription.prescription_number,
        specialistName: specialist.full_name || `Dr. ${specialist.profile?.first_name || ''} ${specialist.profile?.last_name || ''}`.trim(),
        specialistTitle: specialist.profile?.specialization || undefined,
        items: prescription.items.map(item => ({
          drug_name: item.drug_name,
          generic_name: item.generic_name,
          strength: item.drug_strength,
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        subtotal: prescription.subtotal,
        deliveryFee: prescription.delivery_fee || 0,
        totalAmount: prescription.total_amount,
        currency: 'NGN',
        deliveryAddress: prescription.delivery_address ? {
          recipient_name: prescription.delivery_address.recipient_name,
          street: prescription.delivery_address.street,
          city: prescription.delivery_address.city,
          state: prescription.delivery_address.state,
          phone: prescription.delivery_address.phone,
        } : undefined,
        paymentMethod: prescription.payment_method,
        notes: prescription.patient_notes,
        createdAt: moment((prescription as any).created_at || new Date()).format('MMMM D, YYYY h:mm A'),
      };

      const emailBody = prescriptionCreatedEmail(emailData);

      this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject: `New Prescription #${prescription.prescription_number} Created`,
        emailBody,
        attachments: [],
      });

      this.logger.log(`Prescription created email sent to ${patientEmail}`);
    } catch (error) {
      this.logger.error('Failed to send prescription created email', error);
    }
  }

  /**
   * Send prescription shipped email to patient
   */
  private async sendPrescriptionShippedEmail(
    prescription: SpecialistPrescriptionDocument,
    patient: any,
  ): Promise<void> {
    try {
      const patientEmail = patient.profile?.contact?.email;
      if (!patientEmail) {
        this.logger.warn(`No email found for patient ${patient._id}`);
        return;
      }

      const emailData: ShipmentEmailData = {
        patientName: patient.full_name || `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient',
        prescriptionNumber: prescription.prescription_number,
        trackingNumber: prescription.tracking_number,
        courierName: prescription.courier_name,
        estimatedDelivery: prescription.estimated_delivery
          ? moment(prescription.estimated_delivery).format('MMMM D, YYYY')
          : undefined,
        shippingMethod: prescription.shipping_method || 'Standard Delivery',
        deliveryAddress: {
          recipient_name: prescription.delivery_address?.recipient_name,
          street: prescription.delivery_address?.street || '',
          city: prescription.delivery_address?.city || '',
          state: prescription.delivery_address?.state || '',
          phone: prescription.delivery_address?.phone || '',
        },
      };

      const emailBody = prescriptionShippedEmail(emailData);

      this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject: `Your Prescription #${prescription.prescription_number} Has Been Shipped!`,
        emailBody,
        attachments: [],
      });

      this.logger.log(`Prescription shipped email sent to ${patientEmail}`);
    } catch (error) {
      this.logger.error('Failed to send prescription shipped email', error);
    }
  }

  /**
   * Send prescription ready for pickup email to patient
   */
  private async sendPrescriptionReadyForPickupEmail(
    prescription: SpecialistPrescriptionDocument,
    patient: any,
    pharmacyInfo?: { name: string; address?: string; phone?: string; hours?: string },
  ): Promise<void> {
    try {
      const patientEmail = patient.profile?.contact?.email;
      if (!patientEmail) {
        this.logger.warn(`No email found for patient ${patient._id}`);
        return;
      }

      const emailData: ReadyForPickupEmailData = {
        patientName: patient.full_name || `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient',
        prescriptionNumber: prescription.prescription_number,
        pharmacyName: pharmacyInfo?.name || 'Rapid Capsule Pharmacy',
        pharmacyAddress: pharmacyInfo?.address,
        pharmacyPhone: pharmacyInfo?.phone,
        pickupHours: pharmacyInfo?.hours || 'Mon-Fri 8am-6pm, Sat 9am-2pm',
      };

      const emailBody = prescriptionReadyForPickupEmail(emailData);

      this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject: `Your Prescription #${prescription.prescription_number} is Ready for Pickup!`,
        emailBody,
        attachments: [],
      });

      this.logger.log(`Prescription ready for pickup email sent to ${patientEmail}`);
    } catch (error) {
      this.logger.error('Failed to send prescription ready for pickup email', error);
    }
  }

  /**
   * Send prescription delivered email to patient
   */
  private async sendPrescriptionDeliveredEmail(
    prescription: SpecialistPrescriptionDocument,
    patient: any,
  ): Promise<void> {
    try {
      const patientEmail = patient.profile?.contact?.email;
      if (!patientEmail) {
        this.logger.warn(`No email found for patient ${patient._id}`);
        return;
      }

      const patientName = patient.full_name || `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient';
      const emailBody = prescriptionDeliveredEmail(patientName, prescription.prescription_number);

      this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject: `Your Prescription #${prescription.prescription_number} Has Been Delivered!`,
        emailBody,
        attachments: [],
      });

      this.logger.log(`Prescription delivered email sent to ${patientEmail}`);
    } catch (error) {
      this.logger.error('Failed to send prescription delivered email', error);
    }
  }

  /**
   * Send prescription rating request email after delivery
   */
  private async sendPrescriptionRatingRequestEmail(
    prescription: SpecialistPrescriptionDocument,
    patient: any,
  ): Promise<void> {
    try {
      const patientEmail = patient.profile?.contact?.email;
      if (!patientEmail) {
        this.logger.warn(`No email found for patient ${patient._id} for rating request`);
        return;
      }

      const patientName = patient.full_name || `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient';

      // Get specialist name from populated specialist_id
      const specialist = prescription.specialist_id as any;
      const specialistName = specialist?.profile
        ? `Dr. ${specialist.profile.first_name || ''} ${specialist.profile.last_name || ''}`.trim()
        : 'Your Specialist';

      const deliveryDate = moment(prescription.delivered_at || new Date()).format('MMMM D, YYYY');

      // Prepare items list
      const items = prescription.items.map(item => ({
        drug_name: item.drug_name,
        quantity: item.quantity,
      }));

      // Generate rating URL
      const ratingUrl = `https://rapidcapsule.com/app/patient/prescriptions/details/${prescription._id}`;

      const emailBody = prescriptionRatingRequestEmail({
        patientName,
        prescriptionNumber: prescription.prescription_number,
        specialistName,
        items,
        deliveryDate,
        ratingUrl,
      });

      this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject: `Rate Your Experience - Prescription #${prescription.prescription_number}`,
        emailBody,
        attachments: [],
      });

      // Track that the rating request email was sent
      await this.prescriptionModel.updateOne(
        { _id: prescription._id },
        { rating_request_sent_at: new Date() },
      );

      this.logger.log(`Prescription rating request email sent to ${patientEmail}`);
    } catch (error) {
      this.logger.error('Failed to send prescription rating request email', error);
    }
  }

  // ============ ID GENERATION ============

  /**
   * Generate unique prescription number using the shared counter.
   * This ensures uniqueness across all prescription sources (specialist, pharmacy orders, etc.)
   * Format: RX-YYYYMMDD-0001
   */
  private async generatePrescriptionNumber(): Promise<string> {
    return this.prescriptionNumberHelper.generatePrescriptionNumber();
  }

  /**
   * Generate unique reservation ID: RES-YYYYMMDD-0001
   */
  private async generateReservationId(): Promise<string> {
    const today = moment().format('YYYYMMDD');
    const prefix = `RES-${today}-`;

    const lastReservation = await this.reservationModel
      .findOne({ reservation_id: { $regex: `^${prefix}` } })
      .sort({ reservation_id: -1 })
      .lean();

    let sequence = 1;
    if (lastReservation) {
      const lastSequence = parseInt(
        lastReservation.reservation_id.split('-').pop() || '0',
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  /**
   * Generate unique pickup code for patient to show at pickup
   * Format: PU-XXXXXX (6 alphanumeric characters)
   */
  private generatePickupCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar looking chars (0,O,1,I)
    let code = 'PU-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ============ DRUG & STOCK ACCESS ============

  /**
   * Get drug from the shared database (pharmacy inventory)
   * Resolves manufacturer name if it's an ObjectId reference
   */
  private async getDrug(drugId: Types.ObjectId): Promise<any> {
    // Access DrugEntity from the same shared database
    const DrugModel = this.connection.collection('drugentities');
    const drug = await DrugModel.findOne({ _id: new Types.ObjectId(drugId) });

    if (!drug) {
      throw new NotFoundException(`Drug with ID ${drugId} not found`);
    }

    // Resolve manufacturer name if it's an ObjectId
    let manufacturerName = drug.manufacturer;
    if (drug.manufacturer && typeof drug.manufacturer === 'object') {
      try {
        const ManufacturerModel = this.connection.collection('manufacturerentities');
        const manufacturer = await ManufacturerModel.findOne({ _id: drug.manufacturer });
        manufacturerName = manufacturer?.name || null;
      } catch (e) {
        this.logger.warn(`Failed to resolve manufacturer for drug ${drugId}: ${e.message}`);
        manufacturerName = null;
      }
    }

    // Return drug with resolved manufacturer
    drug.manufacturer = manufacturerName;
    return drug;
  }

  /**
   * Get available batches for a drug using FEFO (First Expiry First Out)
   * Falls back to Drug.quantity if no batches exist (for backward compatibility)
   */
  private async getAvailableBatches(drugId: Types.ObjectId, quantity: number) {
    const StockBatchModel = this.connection.collection('stockbatchentities');

    // Find active batches with available stock, sorted by expiry (FEFO)
    const batches = await StockBatchModel.find({
      drug_id: new Types.ObjectId(drugId),
      status: 'active',
      quantity_available: { $gt: 0 },
      $or: [
        { no_expiry: true },
        { expiry_date: { $gt: new Date() } }, // Not expired
      ],
    })
      .sort({ no_expiry: 1, expiry_date: 1 }) // Expiring first, no_expiry last
      .toArray();

    // Calculate total available from batches
    let totalAvailable = batches.reduce(
      (sum, batch) => sum + (batch.quantity_available - (batch.quantity_reserved || 0)),
      0,
    );

    // Fallback: If no batches exist, use Drug.quantity (for seeded/legacy data)
    let useLegacyStock = false;
    if (batches.length === 0) {
      const drug = await this.getDrug(drugId);
      if (drug && drug.quantity > 0) {
        totalAvailable = drug.quantity;
        useLegacyStock = true;
      }
    }

    return {
      batches,
      totalAvailable,
      hasSufficientStock: totalAvailable >= quantity,
      useLegacyStock,
    };
  }

  /**
   * Select batches for reservation using FEFO
   * Returns empty array if using legacy stock (no batches)
   */
  private async selectBatchesForReservation(
    drugId: Types.ObjectId,
    quantity: number,
  ): Promise<{ batch_id: Types.ObjectId; quantity: number; useLegacyStock?: boolean }[]> {
    const { batches, hasSufficientStock, useLegacyStock } = await this.getAvailableBatches(
      drugId,
      quantity,
    );

    if (!hasSufficientStock) {
      throw new BadRequestException(
        `Insufficient stock for drug ${drugId}. Required: ${quantity}`,
      );
    }

    // If using legacy stock (Drug.quantity), return empty array - no batch reservations needed
    if (useLegacyStock) {
      return [];
    }

    const selectedBatches: { batch_id: Types.ObjectId; quantity: number }[] = [];
    let remainingQty = quantity;

    for (const batch of batches) {
      if (remainingQty <= 0) break;

      const availableInBatch =
        batch.quantity_available - (batch.quantity_reserved || 0);
      const takeFromBatch = Math.min(availableInBatch, remainingQty);

      if (takeFromBatch > 0) {
        selectedBatches.push({
          batch_id: new Types.ObjectId(batch._id),
          quantity: takeFromBatch,
        });
        remainingQty -= takeFromBatch;
      }
    }

    return selectedBatches;
  }

  // ============ STOCK RESERVATION ============

  /**
   * Reserve stock for prescription items
   */
  private async reserveStock(
    prescriptionId: Types.ObjectId,
    items: PrescriptionItem[],
    specialistId: Types.ObjectId,
  ): Promise<{ success: boolean; reservations: StockReservationDocument[] }> {
    const reservations: StockReservationDocument[] = [];
    const expiresAt = moment().add(RESERVATION_HOURS, 'hours').toDate();

    const StockBatchModel = this.connection.collection('stockbatchentities');

    try {
      for (const item of items) {
        const batchSelections = await this.selectBatchesForReservation(
          item.drug_id,
          item.quantity,
        );

        for (const selection of batchSelections) {
          // Increment quantity_reserved in batch
          await StockBatchModel.updateOne(
            { _id: selection.batch_id },
            { $inc: { quantity_reserved: selection.quantity } },
          );

          // Create reservation record
          const reservationId = await this.generateReservationId();
          const reservation = await this.reservationModel.create({
            reservation_id: reservationId,
            prescription_id: prescriptionId,
            drug_id: item.drug_id,
            batch_id: selection.batch_id,
            quantity: selection.quantity,
            reserved_at: new Date(),
            expires_at: expiresAt,
            status: ReservationStatus.ACTIVE,
            reserved_by: specialistId,
          });

          reservations.push(reservation);
        }
      }

      return { success: true, reservations };
    } catch (error) {
      // Rollback on error
      this.logger.error('Error reserving stock, rolling back', error);
      await this.releaseReservations(prescriptionId);
      throw error;
    }
  }

  /**
   * Confirm stock reservations (convert to actual deduction)
   */
  private async confirmReservations(prescriptionId: Types.ObjectId): Promise<void> {
    const reservations = await this.reservationModel.find({
      prescription_id: prescriptionId,
      status: ReservationStatus.ACTIVE,
    });

    const StockBatchModel = this.connection.collection('stockbatchentities');

    for (const reservation of reservations) {
      // Deduct from available and reserved
      await StockBatchModel.updateOne(
        { _id: reservation.batch_id },
        {
          $inc: {
            quantity_available: -reservation.quantity,
            quantity_reserved: -reservation.quantity,
            quantity_sold: reservation.quantity,
          },
        },
      );

      // Update reservation status
      await this.reservationModel.updateOne(
        { _id: reservation._id },
        {
          status: ReservationStatus.CONFIRMED,
          confirmed_at: new Date(),
        },
      );
    }

    // Also update Drug entity's quantity (for backward compatibility)
    const DrugModel = this.connection.collection('drugentities');
    const itemQuantities = await this.reservationModel.aggregate([
      { $match: { prescription_id: prescriptionId } },
      { $group: { _id: '$drug_id', total: { $sum: '$quantity' } } },
    ]);

    for (const item of itemQuantities) {
      await DrugModel.updateOne(
        { _id: item._id },
        { $inc: { quantity: -item.total } },
      );
    }
  }

  /**
   * Release stock reservations (on cancel or expiry)
   * Only releases ACTIVE reservations (stock not yet consumed)
   */
  private async releaseReservations(prescriptionId: Types.ObjectId): Promise<void> {
    const reservations = await this.reservationModel.find({
      prescription_id: prescriptionId,
      status: ReservationStatus.ACTIVE,
    });

    const StockBatchModel = this.connection.collection('stockbatchentities');

    for (const reservation of reservations) {
      // Release reserved quantity
      await StockBatchModel.updateOne(
        { _id: reservation.batch_id },
        { $inc: { quantity_reserved: -reservation.quantity } },
      );

      // Update reservation status
      await this.reservationModel.updateOne(
        { _id: reservation._id },
        {
          status: ReservationStatus.RELEASED,
          released_at: new Date(),
          status_reason: 'Prescription cancelled or expired',
        },
      );
    }
  }

  /**
   * Restore confirmed stock (on cancel after payment)
   * Adds back quantity_available for CONFIRMED reservations
   */
  private async restoreConfirmedStock(prescriptionId: Types.ObjectId): Promise<void> {
    const reservations = await this.reservationModel.find({
      prescription_id: prescriptionId,
      status: ReservationStatus.CONFIRMED,
    });

    if (reservations.length === 0) {
      this.logger.log(`No confirmed reservations to restore for prescription ${prescriptionId}`);
      return;
    }

    const StockBatchModel = this.connection.collection('stockbatchentities');
    const DrugModel = this.connection.collection('drugentities');

    for (const reservation of reservations) {
      // Add back to available stock and decrement sold
      await StockBatchModel.updateOne(
        { _id: reservation.batch_id },
        {
          $inc: {
            quantity_available: reservation.quantity,
            quantity_sold: -reservation.quantity,
          },
        },
      );

      // Update reservation status
      await this.reservationModel.updateOne(
        { _id: reservation._id },
        {
          status: ReservationStatus.RELEASED,
          released_at: new Date(),
          status_reason: 'Stock restored due to prescription cancellation',
        },
      );

      this.logger.log(
        `Restored ${reservation.quantity} units to batch ${reservation.batch_id} for drug ${reservation.drug_id}`,
      );
    }

    // Also restore Drug entity's quantity (backward compatibility)
    const itemQuantities = await this.reservationModel.aggregate([
      {
        $match: {
          prescription_id: new Types.ObjectId(prescriptionId),
          status: ReservationStatus.RELEASED,
          status_reason: 'Stock restored due to prescription cancellation',
        },
      },
      { $group: { _id: '$drug_id', total: { $sum: '$quantity' } } },
    ]);

    for (const item of itemQuantities) {
      await DrugModel.updateOne(
        { _id: item._id },
        { $inc: { quantity: item.total } },
      );
    }

    this.logger.log(`Restored stock for ${reservations.length} confirmed reservations`);
  }

  // ============ PRESCRIPTION CRUD ============

  /**
   * Create a new prescription
   */
  async createPrescription(
    specialistId: Types.ObjectId,
    dto: CreateSpecialistPrescriptionDto,
  ) {
    // Validate patient exists
    const patient = await this.usersService.findById(
      new Types.ObjectId(dto.patient_id),
    );
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Process items - get drug details and calculate prices
    const processedItems: PrescriptionItem[] = [];
    let subtotal = 0;

    for (const item of dto.items) {
      const drug = await this.getDrug(new Types.ObjectId(item.drug_id));

      // If batch_id is provided, check that specific batch
      let unitPrice = drug.selling_price;
      let batchManufacturer = drug.manufacturer;
      let batchId: Types.ObjectId | undefined = item.batch_id ? new Types.ObjectId(item.batch_id) : undefined;

      if (item.batch_id) {
        const StockBatchModel = this.connection.collection('stockbatchentities');
        const batch = await StockBatchModel.findOne({
          _id: new Types.ObjectId(item.batch_id),
          drug_id: new Types.ObjectId(item.drug_id),
          status: 'active',
        });

        if (!batch) {
          throw new BadRequestException(`Batch ${item.batch_id} not found for ${drug.name}`);
        }

        const availableQty = batch.quantity_available - (batch.quantity_reserved || 0);
        if (availableQty < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock in batch for ${drug.name}. Available: ${availableQty}, Required: ${item.quantity}`,
          );
        }

        // Use batch-specific price and manufacturer
        unitPrice = batch.selling_price_override || drug.selling_price;
        batchManufacturer = batch.manufacturer || drug.manufacturer;
      } else {
        // Check overall stock availability
        const { hasSufficientStock, totalAvailable } = await this.getAvailableBatches(
          new Types.ObjectId(item.drug_id),
          item.quantity,
        );

        if (!hasSufficientStock) {
          throw new BadRequestException(
            `Insufficient stock for ${drug.name}. Available: ${totalAvailable}, Required: ${item.quantity}`,
          );
        }
      }

      const totalPrice = currency(unitPrice).multiply(item.quantity).value;

      processedItems.push({
        drug_id: new Types.ObjectId(item.drug_id),
        batch_id: batchId,
        drug_name: drug.name,
        generic_name: drug.generic_name,
        drug_strength: drug.strength,
        manufacturer: batchManufacturer,
        quantity: item.quantity,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
        unit_price: unitPrice,
        total_price: totalPrice,
        stock_reserved: false,
      });

      subtotal = currency(subtotal).add(totalPrice).value;
    }

    // Handle pickup order settings
    const isPickupOrder = dto.is_pickup_order === true;
    let pickupPharmacyId: Types.ObjectId | undefined;
    let pickupCode: string | undefined;
    let pickupHandlingFee = 0;

    if (isPickupOrder && dto.pickup_pharmacy_id) {
      // Validate pickup pharmacy exists and is available
      const PharmaciesCollection = this.connection.collection('pharmacies');
      const pickupPharmacy = await PharmaciesCollection.findOne({
        _id: new Types.ObjectId(dto.pickup_pharmacy_id),
        is_active: true,
        is_suspended: false,
        is_pickup_center: true,
        verification_status: 'VERIFIED',
        'pickup_center_settings.accepts_external_orders': { $ne: false },
      });

      if (!pickupPharmacy) {
        throw new BadRequestException('Selected pickup center is not available');
      }

      pickupPharmacyId = new Types.ObjectId(dto.pickup_pharmacy_id);
      pickupCode = this.generatePickupCode();
      pickupHandlingFee = pickupPharmacy.pickup_center_settings?.handling_fee || 0;
    }

    // Calculate total - no delivery fee for pickup orders
    const deliveryFee = isPickupOrder ? pickupHandlingFee : (dto.delivery_address ? 1500 : 0);
    const discount = 0;
    const totalAmount = currency(subtotal).add(deliveryFee).subtract(discount).value;

    // Generate prescription number
    const prescriptionNumber = await this.generatePrescriptionNumber();
    const expiresAt = moment().add(RESERVATION_HOURS, 'hours').toDate();

    // Resolve linked appointments
    let linkedAppointments: Types.ObjectId[] = [];
    if (dto.linked_appointments?.length) {
      const appointmentIds = dto.linked_appointments.map(id => new Types.ObjectId(id));
      // Include legacy appointment_id if present
      if (dto.appointment_id && !dto.linked_appointments.includes(dto.appointment_id)) {
        appointmentIds.push(new Types.ObjectId(dto.appointment_id));
      }
      // Validate all appointments belong to this specialist + patient and are COMPLETED
      const AppointmentsCollection = this.connection.collection('appointments');
      const validAppointments = await AppointmentsCollection.find({
        _id: { $in: appointmentIds },
        specialist: specialistId,
        patient: new Types.ObjectId(dto.patient_id),
        status: 'COMPLETED',
      }).toArray();
      if (validAppointments.length !== appointmentIds.length) {
        throw new BadRequestException('One or more linked appointments are invalid or not completed');
      }
      linkedAppointments = appointmentIds;
    } else if (dto.appointment_id) {
      linkedAppointments = [new Types.ObjectId(dto.appointment_id)];
    }

    // Resolve linked clinical notes
    let linkedClinicalNotes: Array<{ appointment_id: Types.ObjectId; note_id: string }> = [];
    if (dto.linked_clinical_notes?.length) {
      const AppointmentsCollection = this.connection.collection('appointments');
      for (const noteRef of dto.linked_clinical_notes) {
        const appt = await AppointmentsCollection.findOne({
          _id: new Types.ObjectId(noteRef.appointment_id),
          specialist: specialistId,
          patient: new Types.ObjectId(dto.patient_id),
          'clinical_notes.note_id': noteRef.note_id,
        });
        if (!appt) {
          throw new BadRequestException(`Clinical note ${noteRef.note_id} not found in appointment ${noteRef.appointment_id}`);
        }
      }
      linkedClinicalNotes = dto.linked_clinical_notes.map(n => ({
        appointment_id: new Types.ObjectId(n.appointment_id),
        note_id: n.note_id,
      }));
    }

    // Create prescription
    const prescription = await this.prescriptionModel.create({
      prescription_number: prescriptionNumber,
      specialist_id: specialistId,
      patient_id: new Types.ObjectId(dto.patient_id),
      items: processedItems,
      subtotal,
      discount,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      payment_method: dto.payment_method,
      delivery_address: isPickupOrder ? undefined : (dto.delivery_address || this.getPatientDefaultAddress(patient)),
      clinical_notes: dto.clinical_notes,
      patient_notes: dto.patient_notes,
      appointment_id: dto.appointment_id
        ? new Types.ObjectId(dto.appointment_id)
        : undefined,
      linked_appointments: linkedAppointments.length ? linkedAppointments : undefined,
      linked_clinical_notes: linkedClinicalNotes.length ? linkedClinicalNotes : undefined,
      // Pickup order fields
      is_pickup_order: isPickupOrder,
      pickup_pharmacy_id: pickupPharmacyId,
      pickup_code: pickupCode,
      status: SpecialistPrescriptionStatus.DRAFT,
      expires_at: expiresAt,
      status_history: [
        {
          status: SpecialistPrescriptionStatus.DRAFT,
          changed_at: new Date(),
          changed_by: specialistId,
          notes: isPickupOrder ? 'Prescription created (pickup order)' : 'Prescription created',
        },
      ],
      created_by: specialistId,
    });

    // Reserve stock
    const { reservations } = await this.reserveStock(
      prescription._id,
      processedItems,
      specialistId,
    );

    // Update items with reservation info
    const updatedItems = processedItems.map((item) => {
      const itemReservation = reservations.find(
        (r) => r.drug_id.toString() === item.drug_id.toString(),
      );
      return {
        ...item,
        stock_reserved: true,
        stock_reservation_id: itemReservation?.reservation_id,
        stock_reservation_expires: expiresAt,
      };
    });

    await this.prescriptionModel.updateOne(
      { _id: prescription._id },
      { items: updatedItems },
    );

    // If submit immediately, change status
    if (dto.submit_immediately) {
      await this.updateStatus(
        prescription._id,
        SpecialistPrescriptionStatus.PENDING_PAYMENT,
        specialistId,
        'Submitted for payment',
      );
    }

    // Return updated prescription
    const result = await this.prescriptionModel.findById(prescription._id);

    // Send email notification to patient
    if (result) {
      const specialist = await this.usersService.findById(specialistId);
      this.sendPrescriptionCreatedEmail(result, patient, specialist);
    }

    return {
      prescription: result,
      stock_reserved: true,
      reservation_expires_at: expiresAt,
      payment_required: true,
      payment_amount: totalAmount,
    };
  }

  /**
   * Get patient's default address
   */
  private getPatientDefaultAddress(patient: any) {
    const contact = patient?.profile?.contact;
    if (!contact) return undefined;

    return {
      street: contact.address1 || '',
      city: contact.city || '',
      state: contact.state || '',
      country: contact.country || 'Nigeria',
      phone: contact.phone?.number
        ? `${contact.phone.country_code || ''}${contact.phone.number}`
        : '',
      recipient_name: patient.full_name,
    };
  }

  /**
   * Update prescription status
   */
  private async updateStatus(
    prescriptionId: Types.ObjectId,
    status: SpecialistPrescriptionStatus,
    changedBy: Types.ObjectId,
    notes?: string,
  ) {
    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        status,
        $push: {
          status_history: {
            status,
            changed_at: new Date(),
            changed_by: changedBy,
            notes,
          },
        },
      },
    );
  }

  /**
   * Get single prescription with patient details
   */
  async getPrescription(
    prescriptionId: Types.ObjectId,
    specialistId?: Types.ObjectId,
  ): Promise<any> {
    const filter: any = { _id: prescriptionId };
    if (specialistId) {
      filter.specialist_id = specialistId;
    }

    const prescription = await this.prescriptionModel.findOne(filter).lean();
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Fetch patient details
    const patient = await this.usersService.findById(prescription.patient_id);

    const patientProfileImage = patient
      ? await this.fileUploadHelper.resolveProfileImage(patient.profile?.profile_photo)
      : null;

    // Populate linked appointments
    let populatedLinkedAppointments: any[] = [];
    if (prescription.linked_appointments?.length) {
      const AppointmentsCollection = this.connection.collection('appointments');
      const appointments = await AppointmentsCollection.find({
        _id: { $in: prescription.linked_appointments },
      }).project({
        _id: 1,
        start_time: 1,
        status: 1,
        meeting_channel: 1,
        patient_notes: 1,
        category: 1,
        clinical_notes: 1,
      }).toArray();
      populatedLinkedAppointments = appointments.map(appt => ({
        _id: appt._id,
        start_time: appt.start_time,
        status: appt.status,
        meeting_channel: appt.meeting_channel,
        patient_notes: appt.patient_notes,
        category: appt.category,
        notes_count: appt.clinical_notes?.length || 0,
      }));
    }

    // Populate linked clinical notes
    let populatedLinkedNotes: any[] = [];
    if (prescription.linked_clinical_notes?.length) {
      const AppointmentsCollection = this.connection.collection('appointments');
      const appointmentIds = [...new Set(prescription.linked_clinical_notes.map(n => n.appointment_id))];
      const appointments = await AppointmentsCollection.find({
        _id: { $in: appointmentIds },
      }).project({
        _id: 1,
        start_time: 1,
        meeting_channel: 1,
        clinical_notes: 1,
      }).toArray();

      for (const noteRef of prescription.linked_clinical_notes) {
        const appt = appointments.find(a => a._id.toString() === noteRef.appointment_id.toString());
        if (appt) {
          const note = appt.clinical_notes?.find((n: any) => n.note_id === noteRef.note_id);
          if (note) {
            populatedLinkedNotes.push({
              appointment_id: appt._id,
              appointment_date: appt.start_time,
              meeting_channel: appt.meeting_channel,
              note_id: note.note_id,
              content: note.content,
              created_at: note.created_at,
              platform: note.platform,
              completed: note.completed,
            });
          }
        }
      }
    }

    return {
      ...prescription,
      linked_appointments_populated: populatedLinkedAppointments,
      linked_clinical_notes_populated: populatedLinkedNotes,
      patient: patient ? {
        _id: patient._id,
        full_name: patient.full_name,
        email: patient.profile?.contact?.email,
        phone: patient.profile?.contact?.phone?.number
          ? `${patient.profile.contact.phone.country_code || ''}${patient.profile.contact.phone.number}`
          : null,
        profile_image: patientProfileImage,
      } : null,
    };
  }

  // ============ LINKED RECORDS MANAGEMENT ============

  /**
   * Get completed appointments for a specialist-patient pair (for linking UI)
   */
  async getCompletedAppointments(
    specialistId: Types.ObjectId,
    patientId: Types.ObjectId,
  ) {
    const AppointmentsCollection = this.connection.collection('appointments');
    const appointments = await AppointmentsCollection.find({
      specialist: specialistId,
      patient: patientId,
      status: 'COMPLETED',
    })
      .project({
        _id: 1,
        start_time: 1,
        status: 1,
        meeting_channel: 1,
        category: 1,
        appointment_type: 1,
        clinical_notes: 1,
      })
      .sort({ start_time: -1 })
      .limit(50)
      .toArray();

    return appointments.map(appt => ({
      _id: appt._id,
      start_time: appt.start_time,
      status: appt.status,
      meeting_channel: appt.meeting_channel,
      category: appt.category,
      appointment_type: appt.appointment_type,
      clinical_notes: (appt.clinical_notes || []).map((note: any) => ({
        note_id: note.note_id,
        content_preview: note.content ? note.content.substring(0, 100) : '',
        created_at: note.created_at,
        platform: note.platform,
        completed: note.completed,
      })),
    }));
  }

  /**
   * Link appointments and/or clinical notes to an existing prescription
   */
  async linkRecords(
    prescriptionId: Types.ObjectId,
    specialistId: Types.ObjectId,
    dto: LinkRecordsDto,
  ) {
    const prescription = await this.prescriptionModel.findOne({
      _id: prescriptionId,
      specialist_id: specialistId,
    });
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const patientId = prescription.patient_id;
    const AppointmentsCollection = this.connection.collection('appointments');
    const updateOps: any = {};

    // Link appointments
    if (dto.appointments?.length) {
      const appointmentIds = dto.appointments.map(id => new Types.ObjectId(id));
      const validAppointments = await AppointmentsCollection.find({
        _id: { $in: appointmentIds },
        specialist: specialistId,
        patient: patientId,
        status: 'COMPLETED',
      }).toArray();

      if (validAppointments.length !== appointmentIds.length) {
        throw new BadRequestException('One or more appointments are invalid or not completed');
      }

      // Append only new ones (no duplicates)
      const existingIds = (prescription.linked_appointments || []).map(id => id.toString());
      const newIds = appointmentIds.filter(id => !existingIds.includes(id.toString()));
      if (newIds.length) {
        updateOps.$push = updateOps.$push || {};
        updateOps.$push.linked_appointments = { $each: newIds };
      }
    }

    // Link clinical notes
    if (dto.clinical_notes?.length) {
      for (const noteRef of dto.clinical_notes) {
        const appt = await AppointmentsCollection.findOne({
          _id: new Types.ObjectId(noteRef.appointment_id),
          specialist: specialistId,
          patient: patientId,
          'clinical_notes.note_id': noteRef.note_id,
        });
        if (!appt) {
          throw new BadRequestException(`Clinical note ${noteRef.note_id} not found in appointment ${noteRef.appointment_id}`);
        }
      }

      // Append only new ones (no duplicates)
      const existingNotes = (prescription.linked_clinical_notes || []).map(
        n => `${n.appointment_id}:${n.note_id}`,
      );
      const newNotes = dto.clinical_notes
        .filter(n => !existingNotes.includes(`${n.appointment_id}:${n.note_id}`))
        .map(n => ({
          appointment_id: new Types.ObjectId(n.appointment_id),
          note_id: n.note_id,
        }));

      if (newNotes.length) {
        updateOps.$push = updateOps.$push || {};
        updateOps.$push.linked_clinical_notes = { $each: newNotes };
      }
    }

    if (Object.keys(updateOps).length === 0) {
      return { message: 'No new records to link' };
    }

    await this.prescriptionModel.updateOne({ _id: prescriptionId }, updateOps);
    return this.getPrescription(prescriptionId, specialistId);
  }

  /**
   * Unlink appointments and/or clinical notes from a prescription
   */
  async unlinkRecords(
    prescriptionId: Types.ObjectId,
    specialistId: Types.ObjectId,
    dto: LinkRecordsDto,
  ) {
    const prescription = await this.prescriptionModel.findOne({
      _id: prescriptionId,
      specialist_id: specialistId,
    });
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const updateOps: any = {};

    if (dto.appointments?.length) {
      const removeIds = dto.appointments.map(id => new Types.ObjectId(id));
      updateOps.$pull = updateOps.$pull || {};
      updateOps.$pull.linked_appointments = { $in: removeIds };
    }

    if (dto.clinical_notes?.length) {
      // Remove matching clinical notes
      const notesToRemove = dto.clinical_notes;
      const remainingNotes = (prescription.linked_clinical_notes || []).filter(existing => {
        return !notesToRemove.some(
          toRemove => toRemove.appointment_id === existing.appointment_id.toString() && toRemove.note_id === existing.note_id,
        );
      });
      updateOps.$set = updateOps.$set || {};
      updateOps.$set.linked_clinical_notes = remainingNotes;
    }

    if (Object.keys(updateOps).length === 0) {
      return { message: 'No records to unlink' };
    }

    await this.prescriptionModel.updateOne({ _id: prescriptionId }, updateOps);
    return this.getPrescription(prescriptionId, specialistId);
  }

  /**
   * Get prescriptions linked to a specific appointment
   * Used for reverse-lookup from appointment/clinical notes views
   */
  async getPrescriptionsForAppointment(
    specialistId: Types.ObjectId,
    appointmentId: Types.ObjectId,
  ): Promise<any[]> {
    const prescriptions = await this.prescriptionModel.find({
      specialist_id: specialistId,
      $or: [
        { linked_appointments: appointmentId },
        { 'linked_clinical_notes.appointment_id': appointmentId },
      ],
    }).select('_id prescription_number status created_at linked_appointments linked_clinical_notes').lean();

    return prescriptions.map((p: any) => ({
      _id: p._id,
      prescription_number: p.prescription_number,
      status: p.status,
      created_at: p.created_at,
      linked_appointment: p.linked_appointments?.some(
        (id: any) => id.toString() === appointmentId.toString(),
      ),
      linked_notes: (p.linked_clinical_notes || [])
        .filter((n: any) => n.appointment_id?.toString() === appointmentId.toString())
        .map((n: any) => n.note_id),
    }));
  }

  /**
   * Get prescriptions linked to multiple appointments (batch)
   * Returns a map of appointmentId -> prescription summaries
   */
  async getPrescriptionsForAppointments(
    specialistId: Types.ObjectId,
    appointmentIds: Types.ObjectId[],
  ): Promise<Record<string, any[]>> {
    if (!appointmentIds.length) return {};

    const prescriptions = await this.prescriptionModel.find({
      specialist_id: specialistId,
      $or: [
        { linked_appointments: { $in: appointmentIds } },
        { 'linked_clinical_notes.appointment_id': { $in: appointmentIds } },
      ],
    }).select('_id prescription_number status created_at linked_appointments linked_clinical_notes').lean();

    const result: Record<string, any[]> = {};
    for (const apptId of appointmentIds) {
      const apptIdStr = apptId.toString();
      result[apptIdStr] = [];
      for (const p of prescriptions as any[]) {
        const linkedAppt = p.linked_appointments?.some(
          (id: any) => id.toString() === apptIdStr,
        );
        const linkedNotes = (p.linked_clinical_notes || [])
          .filter((n: any) => n.appointment_id?.toString() === apptIdStr)
          .map((n: any) => n.note_id);

        if (linkedAppt || linkedNotes.length) {
          result[apptIdStr].push({
            _id: p._id,
            prescription_number: p.prescription_number,
            status: p.status,
            created_at: p.created_at,
            linked_appointment: linkedAppt,
            linked_notes: linkedNotes,
          });
        }
      }
    }

    return result;
  }

  /**
   * Get prescriptions explicitly linked to a specific appointment for the patient
   * Uses appointment_id, linked_appointments and linked_clinical_notes references
   */
  async getPatientPrescriptionsForAppointment(
    patientId: Types.ObjectId,
    appointmentId: Types.ObjectId,
  ): Promise<any[]> {
    const prescriptions = await this.prescriptionModel.find({
      patient_id: patientId,
      $or: [
        { appointment_id: appointmentId },
        { linked_appointments: appointmentId },
        { 'linked_clinical_notes.appointment_id': appointmentId },
      ],
    }).select('_id prescription_number status created_at items').lean();

    return prescriptions.map((p: any) => ({
      _id: p._id,
      prescription_number: p.prescription_number,
      status: p.status,
      created_at: p.created_at,
      medications: (p.items || []).map((item: any) => ({
        drug_name: item.drug_name,
        strength: item.drug_strength,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
      })),
    }));
  }

  /**
   * List prescriptions for a specialist
   */
  async getSpecialistPrescriptions(
    specialistId: Types.ObjectId,
    query: SpecialistPrescriptionQueryDto,
  ) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      patient_id,
      start_date,
      end_date,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = query;

    const filter: any = { specialist_id: specialistId };

    if (status) {
      filter.status = status;
    }

    if (patient_id) {
      filter.patient_id = new Types.ObjectId(patient_id);
    }

    if (start_date || end_date) {
      filter.created_at = {};
      if (start_date) {
        filter.created_at.$gte = new Date(start_date);
      }
      if (end_date) {
        filter.created_at.$lte = new Date(end_date);
      }
    }

    // Handle search - search by prescription number or patient name
    if (search && search.trim()) {
      const searchTerm = search.trim();
      const searchRegex = new RegExp(searchTerm, 'i');

      // Find patients matching the search term
      const matchingPatients = await this.usersService.findByNameSearch(searchTerm);
      const matchingPatientIds = matchingPatients.map((p) => p._id);

      filter.$or = [
        { prescription_number: searchRegex },
        { patient_id: { $in: matchingPatientIds } },
      ];
    }

    const sortOrder = sort_order === 'asc' ? 1 : -1;
    const sortOptions: any = { [sort_by]: sortOrder };

    const [prescriptions, total] = await Promise.all([
      this.prescriptionModel
        .find(filter)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: 'patient_id',
          select: 'profile.first_name profile.last_name profile.contact.email profile.profile_photo',
        })
        .lean(),
      this.prescriptionModel.countDocuments(filter),
    ]);

    // Transform prescriptions to include patient object
    const enrichedPrescriptions = await Promise.all(
      prescriptions.map(async (prescription: any) => {
        let patient: any = null;

        if (prescription.patient_id && typeof prescription.patient_id === 'object') {
          const patientDoc = prescription.patient_id;
          const firstName = patientDoc.profile?.first_name || '';
          const lastName = patientDoc.profile?.last_name || '';
          patient = {
            _id: patientDoc._id,
            full_name: `${firstName} ${lastName}`.trim() || 'Unknown',
            email: patientDoc.profile?.contact?.email || '',
            profile_image: await this.fileUploadHelper.resolveProfileImage(patientDoc.profile?.profile_photo),
          };
        }

        return {
          ...prescription,
          patient_id: prescription.patient_id?._id || prescription.patient_id,
          patient,
        };
      }),
    );

    return this.generalHelpers.paginate(enrichedPrescriptions, page, limit, total);
  }

  /**
   * Get prescriptions for a patient (patient-facing)
   */
  async getPatientPrescriptions(
    patientId: Types.ObjectId,
    query: {
      page?: number;
      limit?: number;
      status?: string;
    },
  ) {
    const { page = 1, limit = 20, status } = query;

    const filter: any = {
      patient_id: patientId,
      // Don't show draft prescriptions to patients
      status: { $ne: SpecialistPrescriptionStatus.DRAFT },
    };

    if (status) {
      filter.status = status;
    }

    const [prescriptions, total] = await Promise.all([
      this.prescriptionModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({
          path: 'specialist_id',
          select: 'profile.first_name profile.last_name profile.specialist_info.specialties profile.profile_photo',
        })
        .lean(),
      this.prescriptionModel.countDocuments(filter),
    ]);

    // Transform prescriptions to include specialist object
    const enrichedPrescriptions = await Promise.all(
      prescriptions.map(async (prescription: any) => {
        let specialist: any = null;

        if (prescription.specialist_id && typeof prescription.specialist_id === 'object') {
          const specialistDoc = prescription.specialist_id;
          const firstName = specialistDoc.profile?.first_name || '';
          const lastName = specialistDoc.profile?.last_name || '';
          specialist = {
            _id: specialistDoc._id,
            full_name: `Dr. ${firstName} ${lastName}`.trim(),
            specialties: specialistDoc.profile?.specialist_info?.specialties || [],
            profile_image: await this.fileUploadHelper.resolveProfileImage(specialistDoc.profile?.profile_photo),
          };
        }

        return {
          ...prescription,
          specialist_id: prescription.specialist_id?._id || prescription.specialist_id,
          specialist,
        };
      }),
    );

    return this.generalHelpers.paginate(enrichedPrescriptions, page, limit, total);
  }

  /**
   * Get patient prescriptions that can be used for pharmacy orders
   * Returns prescriptions that patient can use to validate RX items in cart
   * Excludes prescriptions already paid by specialist (those are handled separately)
   * Optionally filter by drug IDs to find prescriptions covering specific drugs
   */
  async getPatientPrescriptionsForPharmacy(
    patientId: Types.ObjectId,
    drugIds?: string[],
  ) {
    // Get prescriptions that are eligible for pharmacy use:
    // - accepted: Patient accepted, pending payment
    // - pending_payment: Waiting for payment
    // - pending_acceptance: Sent to patient for review
    // NOTE: Exclude 'paid' status where specialist paid - those don't need patient action
    const eligibleStatuses = [
      SpecialistPrescriptionStatus.ACCEPTED,
      SpecialistPrescriptionStatus.PENDING_PAYMENT,
      SpecialistPrescriptionStatus.PENDING_ACCEPTANCE,
    ];

    const filter: any = {
      patient_id: patientId,
      status: { $in: eligibleStatuses },
      'items.drug_id': { $exists: true },
      // Exclude prescriptions paid by specialist
      $or: [
        { payment_status: { $ne: PrescriptionPaymentStatus.PAID } },
        { paid_by: { $ne: 'specialist' } },
      ],
    };

    // If drug IDs are provided, filter to prescriptions containing any of those drugs
    if (drugIds && drugIds.length > 0) {
      const drugObjectIds = drugIds.map((id) => new Types.ObjectId(id));
      filter['items.drug_id'] = { $in: drugObjectIds };
    }

    const prescriptions = await this.prescriptionModel
      .find(filter)
      .sort({ created_at: -1 })
      .limit(50)
      .populate({
        path: 'specialist_id',
        select:
          'profile.first_name profile.last_name profile.specialist_info.specialties profile.profile_photo',
      })
      .lean();

    // Transform prescriptions for pharmacy use
    const transformedPrescriptions = await Promise.all(prescriptions.map(async (prescription: any) => {
      let specialist: any = null;

      if (
        prescription.specialist_id &&
        typeof prescription.specialist_id === 'object'
      ) {
        const specialistDoc = prescription.specialist_id;
        const firstName = specialistDoc.profile?.first_name || '';
        const lastName = specialistDoc.profile?.last_name || '';
        specialist = {
          _id: specialistDoc._id,
          full_name: `Dr. ${firstName} ${lastName}`.trim(),
          specialties:
            specialistDoc.profile?.specialist_info?.specialties || [],
          profile_image: await this.fileUploadHelper.resolveProfileImage(specialistDoc.profile?.profile_photo),
        };
      }

      // Extract drug IDs from items for easy matching
      const coveredDrugIds = (prescription.items || [])
        .filter((item: any) => item.drug_id)
        .map((item: any) => item.drug_id.toString());

      return {
        _id: prescription._id,
        prescription_number: prescription.prescription_number,
        status: prescription.status,
        payment_status: prescription.payment_status,
        created_at: prescription.created_at,
        specialist_id:
          prescription.specialist_id?._id || prescription.specialist_id,
        specialist,
        items: prescription.items.map((item: any) => ({
          drug_id: item.drug_id?.toString(),
          drug_name: item.drug_name,
          generic_name: item.generic_name,
          drug_strength: item.drug_strength,
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
        })),
        covered_drug_ids: coveredDrugIds,
        total_amount: prescription.total_amount,
        currency: prescription.currency || 'NGN',
        expires_at: prescription.expires_at,
        acceptance_expires_at: prescription.acceptance_expires_at,
        is_expired:
          prescription.expires_at && new Date() > new Date(prescription.expires_at),
      };
    }));

    return {
      prescriptions: transformedPrescriptions,
      total: transformedPrescriptions.length,
    };
  }

  /**
   * Implicitly accept a prescription when patient selects it for pharmacy order
   * This is called when patient selects a specialist prescription to use as RX validation
   * Only works for prescriptions in pending_acceptance status
   */
  async acceptPrescriptionForPharmacyUse(
    prescriptionId: Types.ObjectId,
    patientId: Types.ObjectId,
  ) {
    const prescription = await this.prescriptionModel.findOne({
      _id: prescriptionId,
      patient_id: patientId,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Only update if in pending_acceptance status
    if (prescription.status === SpecialistPrescriptionStatus.PENDING_ACCEPTANCE) {
      prescription.status = SpecialistPrescriptionStatus.ACCEPTED;
      prescription.patient_response = PatientResponse.ACCEPTED;
      prescription.patient_responded_at = new Date();

      // Add to status history
      if (!prescription.status_history) {
        prescription.status_history = [];
      }
      prescription.status_history.push({
        status: SpecialistPrescriptionStatus.ACCEPTED,
        changed_at: new Date(),
        changed_by: patientId,
        notes: 'Implicitly accepted via pharmacy order selection',
      });

      await prescription.save();

      this.logger.log(
        `Prescription ${prescription.prescription_number} implicitly accepted by patient for pharmacy use`,
      );
    }

    return {
      prescription_id: prescription._id,
      prescription_number: prescription.prescription_number,
      status: prescription.status,
      accepted: true,
    };
  }

  /**
   * Update draft prescription
   */
  async updatePrescription(
    prescriptionId: Types.ObjectId,
    specialistId: Types.ObjectId,
    dto: UpdateSpecialistPrescriptionDto,
  ) {
    const prescription = await this.getPrescription(prescriptionId, specialistId);

    if (prescription.status !== SpecialistPrescriptionStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft prescriptions can be updated',
      );
    }

    const updateData: any = {};

    if (dto.items) {
      // Release old reservations
      await this.releaseReservations(prescriptionId);

      // Process new items
      const processedItems: PrescriptionItem[] = [];
      let subtotal = 0;

      for (const item of dto.items) {
        const drug = await this.getDrug(new Types.ObjectId(item.drug_id));
        const { hasSufficientStock, totalAvailable } = await this.getAvailableBatches(
          new Types.ObjectId(item.drug_id),
          item.quantity,
        );

        if (!hasSufficientStock) {
          throw new BadRequestException(
            `Insufficient stock for ${drug.name}. Available: ${totalAvailable}, Required: ${item.quantity}`,
          );
        }

        const unitPrice = drug.selling_price;
        const totalPrice = currency(unitPrice).multiply(item.quantity).value;

        processedItems.push({
          drug_id: new Types.ObjectId(item.drug_id),
          drug_name: drug.name,
          generic_name: drug.generic_name,
          drug_strength: drug.strength,
          manufacturer: drug.manufacturer,
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          unit_price: unitPrice,
          total_price: totalPrice,
          stock_reserved: false,
        });

        subtotal = currency(subtotal).add(totalPrice).value;
      }

      // Reserve new stock
      const expiresAt = moment().add(RESERVATION_HOURS, 'hours').toDate();
      const { reservations } = await this.reserveStock(
        prescriptionId,
        processedItems,
        specialistId,
      );

      // Update items with reservation info
      const updatedItems = processedItems.map((item) => {
        const itemReservation = reservations.find(
          (r) => r.drug_id.toString() === item.drug_id.toString(),
        );
        return {
          ...item,
          stock_reserved: true,
          stock_reservation_id: itemReservation?.reservation_id,
          stock_reservation_expires: expiresAt,
        };
      });

      updateData.items = updatedItems;
      updateData.subtotal = subtotal;
      updateData.total_amount = currency(subtotal)
        .add(prescription.delivery_fee)
        .subtract(prescription.discount)
        .value;
      updateData.expires_at = expiresAt;
    }

    if (dto.delivery_address) {
      updateData.delivery_address = dto.delivery_address;
    }

    if (dto.clinical_notes !== undefined) {
      updateData.clinical_notes = dto.clinical_notes;
    }

    if (dto.patient_notes !== undefined) {
      updateData.patient_notes = dto.patient_notes;
    }

    updateData.updated_by = specialistId;

    return this.prescriptionModel.findByIdAndUpdate(
      prescriptionId,
      updateData,
      { new: true },
    );
  }

  /**
   * Submit prescription for payment
   */
  async submitForPayment(
    prescriptionId: Types.ObjectId,
    specialistId: Types.ObjectId,
    paymentMethod: PrescriptionPaymentMethod,
  ) {
    const prescription = await this.getPrescription(prescriptionId, specialistId);

    if (prescription.status !== SpecialistPrescriptionStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft prescriptions can be submitted',
      );
    }

    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        payment_method: paymentMethod,
        status: SpecialistPrescriptionStatus.PENDING_PAYMENT,
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.PENDING_PAYMENT,
            changed_at: new Date(),
            changed_by: specialistId,
            notes: `Submitted for ${paymentMethod} payment`,
          },
        },
      },
    );

    return this.getPrescription(prescriptionId);
  }

  // ============ PAYMENT PROCESSING ============

  /**
   * Pay from specialist wallet
   */
  async payFromWallet(
    prescriptionId: Types.ObjectId,
    specialistId: Types.ObjectId,
    dto: PayFromWalletDto,
  ) {
    const prescription = await this.getPrescription(prescriptionId, specialistId);

    if (
      prescription.status !== SpecialistPrescriptionStatus.DRAFT &&
      prescription.status !== SpecialistPrescriptionStatus.PENDING_PAYMENT
    ) {
      throw new BadRequestException('Prescription is not awaiting payment');
    }

    if (prescription.payment_status === PrescriptionPaymentStatus.PAID) {
      throw new BadRequestException('Prescription is already paid');
    }

    // Check wallet balance
    const hasSufficientBalance = await this.walletService.hasSufficientBalance(
      specialistId,
      prescription.total_amount,
    );

    if (!hasSufficientBalance) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Debit wallet
    const transaction = await this.walletService.debit(
      specialistId,
      prescription.total_amount,
      SpecialistTransactionReference.PRESCRIPTION,
      prescriptionId,
      `Payment for prescription ${prescription.prescription_number}`,
    );

    // Update prescription
    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        payment_method: PrescriptionPaymentMethod.SPECIALIST_WALLET,
        payment_status: PrescriptionPaymentStatus.PAID,
        payment_reference: transaction.transaction_id,
        paid_at: new Date(),
        paid_by: 'specialist',
        wallet_transaction_id: transaction._id,
        status: SpecialistPrescriptionStatus.PAID,
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.PAID,
            changed_at: new Date(),
            changed_by: specialistId,
            notes: 'Paid from specialist wallet',
          },
        },
      },
    );

    // Confirm stock reservations
    await this.confirmReservations(prescriptionId);

    return {
      success: true,
      prescription_id: prescriptionId.toString(),
      payment_reference: transaction.transaction_id,
      message: 'Payment successful from wallet',
    };
  }

  /**
   * Get patient's wallet balance for display to specialist
   */
  async getPatientWalletBalance(patientId: Types.ObjectId) {
    try {
      // Use getUserEarnings which checks unified wallet first, then legacy
      const earnings = await this.patientWalletService.getUserEarnings(patientId);
      const availableBalance = earnings.currentBalance || 0;

      // Check if patient allows specialist wallet charges
      let allowSpecialistCharge = true; // Default to true
      try {
        const userSettings = await this.userSettingsService.findOne(patientId);
        if (userSettings?.defaults?.allow_specialist_wallet_charge === false) {
          allowSpecialistCharge = false;
        }
      } catch {
        // If no settings found, default to allowing charges
        allowSpecialistCharge = true;
      }

      // If we got earnings data without error, the wallet exists
      // (even if balance is 0)
      return {
        balance: availableBalance,
        available_balance: availableBalance,
        has_wallet: true, // Wallet exists if we got here without error
        allow_specialist_charge: allowSpecialistCharge,
      };
    } catch (error) {
      // Patient may not have a wallet yet
      return {
        balance: 0,
        available_balance: 0,
        has_wallet: false,
        allow_specialist_charge: true, // Default to true even without wallet
      };
    }
  }

  /**
   * Pay prescription from patient's wallet (auto-charge by specialist)
   */
  async payFromPatientWallet(
    prescriptionId: Types.ObjectId,
    specialistId: Types.ObjectId,
    dto: PayFromPatientWalletDto,
  ) {
    const prescription = await this.getPrescription(prescriptionId, specialistId);

    if (
      prescription.status !== SpecialistPrescriptionStatus.DRAFT &&
      prescription.status !== SpecialistPrescriptionStatus.PENDING_PAYMENT
    ) {
      throw new BadRequestException('Prescription is not awaiting payment');
    }

    if (prescription.payment_status === PrescriptionPaymentStatus.PAID) {
      throw new BadRequestException('Prescription is already paid');
    }

    // Get patient wallet balance and settings
    const { available_balance, has_wallet, allow_specialist_charge } = await this.getPatientWalletBalance(
      prescription.patient_id,
    );

    if (!has_wallet) {
      throw new BadRequestException('Patient does not have a wallet');
    }

    if (!allow_specialist_charge) {
      throw new BadRequestException('Patient has disabled specialist wallet charges. Please use another payment method.');
    }

    const totalAmount = prescription.total_amount;
    let walletAmountToPay = 0;
    let remainingAmount = 0;
    let paymentMethod: PrescriptionPaymentMethod;
    let paymentStatus: PrescriptionPaymentStatus;

    // Determine payment scenario
    if (available_balance >= totalAmount) {
      // Full payment from wallet
      walletAmountToPay = totalAmount;
      remainingAmount = 0;
      paymentMethod = PrescriptionPaymentMethod.PATIENT_WALLET;
      paymentStatus = PrescriptionPaymentStatus.PAID;
    } else if (available_balance > 0 && dto.allow_partial) {
      // Partial payment - use wallet for what's available
      walletAmountToPay = available_balance;
      remainingAmount = totalAmount - available_balance;
      paymentMethod = PrescriptionPaymentMethod.PATIENT_WALLET_PARTIAL;
      paymentStatus = PrescriptionPaymentStatus.PENDING; // Still pending remaining amount
    } else if (available_balance === 0) {
      throw new BadRequestException('Patient wallet has no balance');
    } else {
      throw new BadRequestException(
        `Insufficient wallet balance. Available: ${available_balance}, Required: ${totalAmount}. Enable partial payment to proceed.`,
      );
    }

    // Get specialist info for email
    const specialist = await this.usersService.findById(specialistId);
    const specialistName = specialist
      ? `Dr. ${specialist.profile?.first_name || ''} ${specialist.profile?.last_name || ''}`.trim()
      : 'Your Doctor';

    // Debit patient wallet
    const reference = this.generalHelpers.genTxReference();
    const { transaction } = await this.patientWalletService.debitWalletForPurchase(
      prescription.patient_id,
      walletAmountToPay,
      reference,
      `Prescription ${prescription.prescription_number} - Charged by ${specialistName}`,
    );

    // Update prescription
    const updateData: any = {
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      payment_reference: reference,
      paid_by: 'patient',
      wallet_amount_paid: walletAmountToPay,
      patient_wallet_transaction_id: transaction._id,
      $push: {
        status_history: {
          status: paymentStatus === PrescriptionPaymentStatus.PAID
            ? SpecialistPrescriptionStatus.PAID
            : SpecialistPrescriptionStatus.PENDING_PAYMENT,
          changed_at: new Date(),
          changed_by: specialistId,
          notes: walletAmountToPay === totalAmount
            ? 'Paid in full from patient wallet'
            : `Partial payment of ${walletAmountToPay} from patient wallet. Remaining: ${remainingAmount}`,
        },
      },
    };

    if (paymentStatus === PrescriptionPaymentStatus.PAID) {
      updateData.status = SpecialistPrescriptionStatus.PAID;
      updateData.paid_at = new Date();
    } else {
      updateData.status = SpecialistPrescriptionStatus.PENDING_PAYMENT;
      updateData.remaining_amount = remainingAmount;
      updateData.remaining_payment_method = dto.remaining_payment_method || 'online';
    }

    await this.prescriptionModel.updateOne({ _id: prescriptionId }, updateData);

    // If fully paid, confirm stock reservations
    if (paymentStatus === PrescriptionPaymentStatus.PAID) {
      await this.confirmReservations(prescriptionId);
    }

    // Send email notification to patient
    const patient = await this.usersService.findById(prescription.patient_id);
    if (patient) {
      await this.sendWalletChargedEmail(prescription, patient, specialist, walletAmountToPay, remainingAmount);
    }

    return {
      success: true,
      prescription_id: prescriptionId.toString(),
      payment_reference: reference,
      wallet_amount_charged: walletAmountToPay,
      remaining_amount: remainingAmount,
      payment_status: paymentStatus,
      message: walletAmountToPay === totalAmount
        ? 'Full payment completed from patient wallet'
        : `Partial payment of NGN ${walletAmountToPay} from wallet. Remaining NGN ${remainingAmount} to be paid via ${dto.remaining_payment_method || 'online payment'}`,
    };
  }

  /**
   * Send email to patient when their wallet is charged for prescription
   */
  private async sendWalletChargedEmail(
    prescription: SpecialistPrescriptionDocument,
    patient: any,
    specialist: any,
    amountCharged: number,
    remainingAmount: number,
  ): Promise<void> {
    try {
      const patientEmail = patient.profile?.contact?.email;
      if (!patientEmail) {
        this.logger.warn(`No email found for patient ${patient._id}`);
        return;
      }

      const patientName = `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient';
      const specialistName = specialist
        ? `Dr. ${specialist.profile?.first_name || ''} ${specialist.profile?.last_name || ''}`.trim()
        : 'Your Doctor';

      // Import and use the wallet charged email template
      const { walletChargedForPrescriptionEmail } = await import('../../core/emails/mails/prescriptionEmails');

      const emailData = {
        patientName,
        prescriptionNumber: prescription.prescription_number,
        specialistName,
        walletAmountCharged: amountCharged,
        remainingAmount,
        remainingPaymentMethod: prescription.remaining_payment_method as 'online' | 'cash' | undefined,
        totalAmount: prescription.total_amount,
        currency: 'NGN',
        items: prescription.items.map(item => ({
          drug_name: item.drug_name,
          generic_name: item.generic_name,
          strength: item.drug_strength,
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        deliveryAddress: prescription.delivery_address ? {
          recipient_name: prescription.delivery_address.recipient_name,
          street: prescription.delivery_address.street,
          city: prescription.delivery_address.city,
          state: prescription.delivery_address.state,
          phone: prescription.delivery_address.phone,
        } : undefined,
        notes: prescription.patient_notes,
        chargedAt: moment().format('MMMM D, YYYY h:mm A'),
      };

      const emailBody = walletChargedForPrescriptionEmail(emailData);

      this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject: `Your Wallet Was Charged for Prescription #${prescription.prescription_number}`,
        emailBody,
        attachments: [],
      });

      this.logger.log(`Wallet charged email sent to ${patientEmail}`);
    } catch (error) {
      this.logger.error('Failed to send wallet charged email', error);
    }
  }

  /**
   * Send payment link to patient
   */
  async sendPaymentLink(
    prescriptionId: Types.ObjectId,
    specialistId: Types.ObjectId,
    dto: SendPaymentLinkDto,
  ) {
    const prescription = await this.getPrescription(prescriptionId, specialistId);

    if (
      prescription.status !== SpecialistPrescriptionStatus.DRAFT &&
      prescription.status !== SpecialistPrescriptionStatus.PENDING_PAYMENT
    ) {
      throw new BadRequestException('Prescription is not awaiting payment');
    }

    // Get patient details
    const patient = await this.usersService.findById(prescription.patient_id);
    if (!patient?.profile?.contact?.email) {
      throw new BadRequestException('Patient does not have a valid email');
    }

    // Generate payment reference
    const reference = this.generalHelpers.genTxReference();

    // Initialize Paystack payment
    const paymentResponse = await this.paymentHandler.initializeTransaction(
      patient.profile.contact.email,
      prescription.total_amount * 100, // Convert to kobo
      reference,
      {
        type: 'prescription_payment',
        prescription_id: prescriptionId.toString(),
        prescription_number: prescription.prescription_number,
        specialist_id: specialistId.toString(),
        patient_id: prescription.patient_id.toString(),
      },
    );

    // Update prescription
    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        payment_method: PrescriptionPaymentMethod.PATIENT_ONLINE,
        payment_reference: reference,
        status: SpecialistPrescriptionStatus.PENDING_PAYMENT,
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.PENDING_PAYMENT,
            changed_at: new Date(),
            changed_by: specialistId,
            notes: 'Payment link sent to patient',
          },
        },
      },
    );

    // TODO: Send email to patient with payment link
    // await this.emailService.sendPrescriptionPaymentEmail(patient, prescription, paymentResponse.data.authorization_url);

    return {
      success: true,
      prescription_id: prescriptionId.toString(),
      payment_url: paymentResponse.data?.authorization_url,
      reference,
      message: 'Payment link generated. Email sent to patient.',
    };
  }

  /**
   * Process patient online payment (verify Paystack payment)
   */
  async processPatientPayment(
    prescriptionId: Types.ObjectId,
    dto: ProcessPatientPaymentDto,
  ) {
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.payment_status === PrescriptionPaymentStatus.PAID) {
      return {
        success: true,
        message: 'Payment already processed',
        prescription_id: prescriptionId.toString(),
      };
    }

    // Verify with Paystack
    const verification = await this.paymentHandler.verifyTransaction(dto.reference);

    if (verification.data?.status !== 'success') {
      await this.prescriptionModel.updateOne(
        { _id: prescriptionId },
        { payment_status: PrescriptionPaymentStatus.FAILED },
      );
      throw new BadRequestException('Payment verification failed');
    }

    const amountPaid = verification.data.amount / 100; // Convert from kobo

    if (amountPaid < prescription.total_amount) {
      throw new BadRequestException('Insufficient payment amount');
    }

    // Update prescription
    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        payment_status: PrescriptionPaymentStatus.PAID,
        paid_at: new Date(),
        paid_by: 'patient',
        status: SpecialistPrescriptionStatus.PAID,
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.PAID,
            changed_at: new Date(),
            changed_by: prescription.patient_id,
            notes: 'Patient completed online payment',
          },
        },
      },
    );

    // Confirm stock reservations
    await this.confirmReservations(prescriptionId);

    return {
      success: true,
      prescription_id: prescriptionId.toString(),
      payment_reference: dto.reference,
      message: 'Payment verified successfully',
    };
  }

  /**
   * Mark as cash payment (patient pays on delivery)
   */
  async markAsCashPayment(
    prescriptionId: Types.ObjectId,
    specialistId: Types.ObjectId,
  ) {
    const prescription = await this.getPrescription(prescriptionId, specialistId);

    if (
      prescription.status !== SpecialistPrescriptionStatus.DRAFT &&
      prescription.status !== SpecialistPrescriptionStatus.PENDING_PAYMENT
    ) {
      throw new BadRequestException('Prescription is not awaiting payment');
    }

    // Update prescription to processing (cash will be collected on delivery)
    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        payment_method: PrescriptionPaymentMethod.PATIENT_CASH,
        status: SpecialistPrescriptionStatus.PROCESSING,
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.PROCESSING,
            changed_at: new Date(),
            changed_by: specialistId,
            notes: 'Marked for cash on delivery payment',
          },
        },
      },
    );

    // Confirm stock reservations (reserve stock even though payment is pending)
    await this.confirmReservations(prescriptionId);

    return {
      success: true,
      prescription_id: prescriptionId.toString(),
      message: 'Prescription marked for cash payment on delivery',
    };
  }

  // ============ FULFILLMENT ============

  /**
   * Mark prescription as dispensed
   */
  async markAsDispensed(
    prescriptionId: Types.ObjectId,
    userId: Types.ObjectId,
    dto: DispenseDto,
  ) {
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const validStatuses = [
      SpecialistPrescriptionStatus.PAID,
      SpecialistPrescriptionStatus.PROCESSING,
    ];

    if (!validStatuses.includes(prescription.status)) {
      throw new BadRequestException(
        `Cannot dispense prescription in ${prescription.status} status`,
      );
    }

    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        status: SpecialistPrescriptionStatus.DISPENSED,
        dispensed_at: new Date(),
        dispensed_by: userId,
        dispensing_notes: dto.notes,
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.DISPENSED,
            changed_at: new Date(),
            changed_by: userId,
            notes: dto.notes || 'Items dispensed',
          },
        },
      },
    );

    const updatedPrescription = await this.prescriptionModel.findById(prescriptionId);

    // Send ready for pickup email if no delivery address (pickup order)
    if (!prescription.delivery_address || !prescription.delivery_address.street) {
      const patient = await this.usersService.findById(prescription.patient_id);
      if (patient && updatedPrescription) {
        this.sendPrescriptionReadyForPickupEmail(updatedPrescription, patient);
      }
    }

    return updatedPrescription;
  }

  /**
   * Add shipping information
   */
  async markAsShipped(
    prescriptionId: Types.ObjectId,
    userId: Types.ObjectId,
    dto: ShipDto,
  ) {
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.status !== SpecialistPrescriptionStatus.DISPENSED) {
      throw new BadRequestException('Prescription must be dispensed before shipping');
    }

    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        status: SpecialistPrescriptionStatus.SHIPPED,
        shipped_at: new Date(),
        shipping_method: dto.shipping_method,
        tracking_number: dto.tracking_number,
        courier_name: dto.courier_name,
        estimated_delivery: dto.estimated_delivery
          ? new Date(dto.estimated_delivery)
          : undefined,
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.SHIPPED,
            changed_at: new Date(),
            changed_by: userId,
            notes:
              dto.notes ||
              `Shipped via ${dto.shipping_method}${dto.tracking_number ? ` - ${dto.tracking_number}` : ''}`,
          },
        },
      },
    );

    // Send shipping notification email to patient
    const updatedPrescription = await this.prescriptionModel.findById(prescriptionId);
    const patient = await this.usersService.findById(prescription.patient_id);
    if (patient && updatedPrescription) {
      this.sendPrescriptionShippedEmail(updatedPrescription, patient);
    }

    return updatedPrescription;
  }

  /**
   * Mark as delivered
   */
  async markAsDelivered(
    prescriptionId: Types.ObjectId,
    userId: Types.ObjectId,
    dto: DeliverDto,
  ) {
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.status !== SpecialistPrescriptionStatus.SHIPPED) {
      throw new BadRequestException('Prescription must be shipped before delivery');
    }

    const updateData: any = {
      status: SpecialistPrescriptionStatus.DELIVERED,
      delivered_at: new Date(),
      delivery_confirmation: dto.confirmation,
      $push: {
        status_history: {
          status: SpecialistPrescriptionStatus.DELIVERED,
          changed_at: new Date(),
          changed_by: userId,
          notes: dto.notes || 'Delivered to patient',
        },
      },
    };

    // If cash payment, mark as paid on delivery
    if (
      prescription.payment_method === PrescriptionPaymentMethod.PATIENT_CASH &&
      prescription.payment_status !== PrescriptionPaymentStatus.PAID
    ) {
      updateData.payment_status = PrescriptionPaymentStatus.PAID;
      updateData.paid_at = new Date();
      updateData.paid_by = 'patient';
    }

    await this.prescriptionModel.updateOne({ _id: prescriptionId }, updateData);

    // Send delivery notification email to patient
    const updatedPrescription = await this.prescriptionModel.findById(prescriptionId)
      .populate('specialist_id', 'profile');
    const patient = await this.usersService.findById(prescription.patient_id);
    if (patient && updatedPrescription) {
      this.sendPrescriptionDeliveredEmail(updatedPrescription, patient);
      // Also send rating request email
      this.sendPrescriptionRatingRequestEmail(updatedPrescription, patient);
    }

    return updatedPrescription;
  }

  // ============ CANCELLATION ============

  /**
   * Cancel prescription
   */
  async cancelPrescription(
    prescriptionId: Types.ObjectId,
    userId: Types.ObjectId,
    dto: CancelPrescriptionDto,
  ) {
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const nonCancellableStatuses = [
      SpecialistPrescriptionStatus.SHIPPED,
      SpecialistPrescriptionStatus.DELIVERED,
      SpecialistPrescriptionStatus.CANCELLED,
    ];

    if (nonCancellableStatuses.includes(prescription.status)) {
      throw new BadRequestException(
        `Cannot cancel prescription in ${prescription.status} status`,
      );
    }

    // Handle stock based on prescription status
    // If payment was made (stock consumed), restore the confirmed stock
    // If not paid yet, just release active reservations
    const paidStatuses = [
      SpecialistPrescriptionStatus.PAID,
      SpecialistPrescriptionStatus.PROCESSING,
      SpecialistPrescriptionStatus.DISPENSED,
    ];

    if (paidStatuses.includes(prescription.status)) {
      // Stock was consumed - restore it
      await this.restoreConfirmedStock(prescriptionId);
      this.logger.log(`Restored confirmed stock for prescription ${prescriptionId}`);
    } else {
      // Stock was only reserved - release reservations
      await this.releaseReservations(prescriptionId);
      this.logger.log(`Released active reservations for prescription ${prescriptionId}`);
    }

    // Track refund info for email
    let refundAmount = 0;
    let refundMethod = '';

    // Log payment details for debugging
    this.logger.log(`Cancel - Prescription ${prescription.prescription_number}:`);
    this.logger.log(`  - Status: ${prescription.status}`);
    this.logger.log(`  - Payment Status: ${prescription.payment_status}`);
    this.logger.log(`  - Payment Method: ${prescription.payment_method}`);
    this.logger.log(`  - Total Amount: ${prescription.total_amount}`);

    // Process refund based on payment method
    if (prescription.payment_status === PrescriptionPaymentStatus.PAID) {
      refundAmount = prescription.total_amount;
      this.logger.log(`  - Processing refund of ${refundAmount}`);

      if (prescription.payment_method === PrescriptionPaymentMethod.SPECIALIST_WALLET) {
        // Refund to specialist wallet
        this.logger.log(`  - Refunding to specialist wallet...`);
        await this.walletService.refund(
          prescription.specialist_id,
          prescription.total_amount,
          prescriptionId,
          `Refund for cancelled prescription ${prescription.prescription_number}`,
        );
        refundMethod = 'Specialist Wallet';
        this.logger.log(`  - Wallet refund completed`);
      } else if (prescription.payment_method === PrescriptionPaymentMethod.PATIENT_CASH) {
        // Cash payment - mark as refund pending (manual refund required)
        refundMethod = 'Cash (Manual refund required)';
        this.logger.log(`  - Cash payment - manual refund required`);
      } else if (prescription.payment_method === PrescriptionPaymentMethod.PATIENT_ONLINE) {
        // Online payment - will be handled separately in future
        refundMethod = 'Original payment method (Processing)';
        this.logger.log(`  - Online payment - refund pending`);
      }
    } else {
      this.logger.log(`  - No refund needed (payment_status: ${prescription.payment_status})`);
    }

    // Update prescription
    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        status: SpecialistPrescriptionStatus.CANCELLED,
        payment_status:
          prescription.payment_status === PrescriptionPaymentStatus.PAID
            ? PrescriptionPaymentStatus.REFUNDED
            : prescription.payment_status,
        cancellation_reason: dto.reason,
        cancelled_at: new Date(),
        cancelled_by: userId,
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.CANCELLED,
            changed_at: new Date(),
            changed_by: userId,
            notes: dto.reason,
          },
        },
      },
    );

    // Send cancellation email to patient
    try {
      const patient = await this.usersService.findById(prescription.patient_id);
      if (patient) {
        await this.sendPrescriptionCancelledEmail(
          prescription,
          patient,
          dto.reason,
          refundAmount,
          refundMethod,
        );
      }
    } catch (emailError) {
      this.logger.error('Failed to send cancellation email', emailError);
    }

    return this.prescriptionModel.findById(prescriptionId);
  }

  /**
   * Send prescription cancelled email to patient
   */
  private async sendPrescriptionCancelledEmail(
    prescription: SpecialistPrescriptionDocument,
    patient: any,
    cancellationReason: string,
    refundAmount: number,
    refundMethod: string,
  ): Promise<void> {
    try {
      const patientEmail = patient.profile?.contact?.email;
      if (!patientEmail) {
        this.logger.warn(`No email found for patient ${patient._id}`);
        return;
      }

      const patientName = `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient';

      // Get specialist name
      let specialistName = '';
      try {
        const specialist = await this.usersService.findById(prescription.specialist_id);
        if (specialist) {
          const firstName = specialist.profile?.first_name || '';
          const lastName = specialist.profile?.last_name || '';
          specialistName = `Dr. ${firstName} ${lastName}`.trim();
        }
      } catch (e) {
        this.logger.warn(`Could not fetch specialist for cancelled email: ${e.message}`);
      }

      const emailData: CancelledEmailData = {
        patientName,
        prescriptionNumber: prescription.prescription_number,
        specialistName: specialistName || undefined,
        items: prescription.items.map(item => ({
          drug_name: item.drug_name,
          generic_name: item.generic_name,
          strength: item.drug_strength,
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        subtotal: prescription.subtotal,
        deliveryFee: prescription.delivery_fee || 0,
        totalAmount: prescription.total_amount,
        currency: 'NGN',
        cancellationReason,
        refundAmount: refundAmount > 0 ? refundAmount : undefined,
        refundMethod: refundAmount > 0 ? refundMethod : undefined,
        cancelledAt: moment().format('MMMM D, YYYY h:mm A'),
      };

      const emailBody = prescriptionCancelledEmail(emailData);

      this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject: `Prescription #${prescription.prescription_number} Cancelled`,
        emailBody,
        attachments: [],
      });

      this.logger.log(`Prescription cancelled email sent to ${patientEmail}`);
    } catch (error) {
      this.logger.error('Failed to send prescription cancelled email', error);
    }
  }

  // ============ BACKGROUND JOBS ============

  /**
   * Process expired reservations (called by scheduler)
   */
  async processExpiredReservations(): Promise<number> {
    const now = new Date();

    // Find prescriptions with expired reservations that are still pending payment
    const expiredPrescriptions = await this.prescriptionModel.find({
      status: {
        $in: [
          SpecialistPrescriptionStatus.DRAFT,
          SpecialistPrescriptionStatus.PENDING_PAYMENT,
        ],
      },
      expires_at: { $lte: now },
    });

    let processed = 0;

    for (const prescription of expiredPrescriptions) {
      try {
        // Release reservations
        await this.releaseReservations(prescription._id);

        // Update prescription status
        await this.prescriptionModel.updateOne(
          { _id: prescription._id },
          {
            status: SpecialistPrescriptionStatus.EXPIRED,
            $push: {
              status_history: {
                status: SpecialistPrescriptionStatus.EXPIRED,
                changed_at: new Date(),
                notes: 'Prescription expired due to payment timeout',
              },
            },
          },
        );

        processed++;

        // TODO: Send notification to specialist about expired prescription
        // await this.notificationService.sendPrescriptionExpiredNotification(prescription);
      } catch (error) {
        this.logger.error(
          `Error processing expired prescription ${prescription._id}`,
          error,
        );
      }
    }

    return processed;
  }

  /**
   * Send payment reminders (called by scheduler)
   */
  async sendPaymentReminders(): Promise<number> {
    const twoHoursAgo = moment().subtract(2, 'hours').toDate();
    const maxReminders = 2;

    const prescriptionsNeedingReminder = await this.prescriptionModel.find({
      status: SpecialistPrescriptionStatus.PENDING_PAYMENT,
      payment_method: PrescriptionPaymentMethod.PATIENT_ONLINE,
      payment_reminders_sent: { $lt: maxReminders },
      created_at: { $lte: twoHoursAgo },
      expires_at: { $gt: new Date() },
      $or: [
        { last_reminder_sent_at: { $exists: false } },
        { last_reminder_sent_at: { $lte: twoHoursAgo } },
      ],
    });

    let sent = 0;

    for (const prescription of prescriptionsNeedingReminder) {
      try {
        // TODO: Send reminder email
        // await this.emailService.sendPaymentReminderEmail(prescription);

        await this.prescriptionModel.updateOne(
          { _id: prescription._id },
          {
            $inc: { payment_reminders_sent: 1 },
            last_reminder_sent_at: new Date(),
          },
        );

        sent++;
      } catch (error) {
        this.logger.error(
          `Error sending payment reminder for prescription ${prescription._id}`,
          error,
        );
      }
    }

    return sent;
  }

  // ============ STATISTICS ============

  /**
   * Get prescription statistics for specialist
   */
  async getSpecialistStats(specialistId: Types.ObjectId) {
    const today = moment().startOf('day').toDate();
    const weekStart = moment().startOf('week').toDate();
    const monthStart = moment().startOf('month').toDate();

    const [
      todayCount,
      weekCount,
      monthCount,
      totalCount,
      pendingPayment,
      processingCount,
      deliveredCount,
      statusCounts,
    ] = await Promise.all([
      this.prescriptionModel.countDocuments({
        specialist_id: specialistId,
        created_at: { $gte: today },
      }),
      this.prescriptionModel.countDocuments({
        specialist_id: specialistId,
        created_at: { $gte: weekStart },
      }),
      this.prescriptionModel.countDocuments({
        specialist_id: specialistId,
        created_at: { $gte: monthStart },
      }),
      this.prescriptionModel.countDocuments({ specialist_id: specialistId }),
      this.prescriptionModel.countDocuments({
        specialist_id: specialistId,
        status: SpecialistPrescriptionStatus.PENDING_PAYMENT,
      }),
      this.prescriptionModel.countDocuments({
        specialist_id: specialistId,
        status: { $in: [SpecialistPrescriptionStatus.PAID, SpecialistPrescriptionStatus.DISPENSED, SpecialistPrescriptionStatus.SHIPPED] },
      }),
      this.prescriptionModel.countDocuments({
        specialist_id: specialistId,
        status: SpecialistPrescriptionStatus.DELIVERED,
      }),
      this.prescriptionModel.aggregate([
        { $match: { specialist_id: new Types.ObjectId(specialistId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const walletBalance = await this.walletService.getWalletBalance(specialistId);

    return {
      // Fields expected by frontend
      total: totalCount,
      pending_payment: pendingPayment,
      processing: processingCount,
      delivered: deliveredCount,
      // Additional fields for dashboard
      prescriptions_today: todayCount,
      prescriptions_this_week: weekCount,
      prescriptions_this_month: monthCount,
      wallet_balance: walletBalance.available_balance,
      by_status: statusCounts.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {},
      ),
    };
  }

  // ============ PATIENT SELF-SERVICE ============

  /**
   * Send prescription to patient for review and self-payment
   * Generates PDF, sends email, and sets 48-hour acceptance window
   */
  async sendToPatient(prescriptionId: Types.ObjectId, specialistId: Types.ObjectId) {
    const prescription = await this.getPrescription(prescriptionId, specialistId);

    if (prescription.status !== SpecialistPrescriptionStatus.DRAFT) {
      throw new BadRequestException(
        'Only draft prescriptions can be sent to patient',
      );
    }

    // Get patient and specialist details
    const patient = await this.usersService.findById(prescription.patient_id);
    const specialist = await this.usersService.findById(specialistId);

    if (!patient?.profile?.contact?.email) {
      throw new BadRequestException('Patient does not have a valid email address');
    }

    // Prepare PDF data
    const pdfData: PdfPrescriptionData = {
      prescription_number: prescription.prescription_number,
      created_at: prescription.created_at,
      status: SpecialistPrescriptionStatus.PENDING_ACCEPTANCE,
      valid_until: moment().add(28, 'days').toDate(),
      patient: {
        full_name: patient.full_name || `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim(),
        date_of_birth: patient.profile?.date_of_birth
          ? moment(patient.profile.date_of_birth).format('DD/MM/YYYY')
          : undefined,
        patient_id: `PAT-${patient._id.toString().slice(-6).toUpperCase()}`,
        email: patient.profile.contact.email,
        phone: patient.profile?.contact?.phone?.number
          ? `${patient.profile.contact.phone.country_code || ''}${patient.profile.contact.phone.number}`
          : undefined,
      },
      prescriber: {
        full_name: `Dr. ${specialist?.profile?.first_name || ''} ${specialist?.profile?.last_name || ''}`.trim(),
        license_number: (specialist?.profile as any)?.specialist_info?.license_number,
        specialization: (specialist?.profile as any)?.specialist_info?.specialties?.join(', '),
        facility: 'Rapid Capsules Medical',
        location: 'Lagos, Nigeria',
      },
      items: prescription.items.map((item: PrescriptionItem) => ({
        drug_name: item.drug_name,
        generic_name: item.generic_name,
        strength: item.drug_strength,
        quantity: item.quantity,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
      subtotal: prescription.subtotal,
      delivery_fee: prescription.delivery_fee || 0,
      total_amount: prescription.total_amount,
      currency: 'NGN',
      notes: prescription.clinical_notes,
    };

    // Generate PDF and upload to S3 (optional - continue even if it fails)
    let pdf_url: string | undefined;
    let pdf_hash: string | undefined;
    let pdf_buffer: Buffer | undefined;
    let presigned_pdf_url: string | undefined;
    try {
      const pdfResult = await this.prescriptionPdfService.generateAndUploadPdf(pdfData);
      pdf_url = pdfResult.pdf_url;
      pdf_hash = pdfResult.pdf_hash;
      pdf_buffer = pdfResult.pdf_buffer;
      // Get presigned URL for email download link (24 hours expiry)
      presigned_pdf_url = await this.prescriptionPdfService.getPresignedPdfUrl(pdf_url, 86400);
    } catch (pdfError) {
      this.logger.warn(`PDF generation failed for prescription ${prescriptionId}: ${pdfError.message}`);
      // Continue without PDF - email will be sent without attachment
    }

    // Set 48-hour acceptance window
    const acceptanceExpiresAt = moment().add(48, 'hours').toDate();

    // Reserve stock for 48 hours
    const { reservations } = await this.reserveStock(
      prescriptionId,
      prescription.items,
      specialistId,
    );

    // Update prescription
    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        status: SpecialistPrescriptionStatus.PENDING_ACCEPTANCE,
        pdf_url,
        pdf_hash,
        pdf_generated_at: new Date(),
        patient_response: PatientResponse.PENDING,
        acceptance_expires_at: acceptanceExpiresAt,
        expires_at: acceptanceExpiresAt, // Also update general expiry
        original_total: prescription.total_amount,
        sent_to_patient_at: new Date(),
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.PENDING_ACCEPTANCE,
            changed_at: new Date(),
            changed_by: specialistId,
            notes: 'Sent to patient for acceptance',
          },
        },
      },
    );

    // Send email to patient with PDF attachment
    await this.sendPrescriptionToPatientEmail(
      prescription,
      patient,
      specialist,
      presigned_pdf_url,
      acceptanceExpiresAt,
      pdf_buffer,
    );

    return {
      success: true,
      prescription_id: prescriptionId.toString(),
      pdf_url,
      acceptance_expires_at: acceptanceExpiresAt,
      message: 'Prescription sent to patient successfully',
    };
  }

  /**
   * Send prescription email to patient
   */
  private async sendPrescriptionToPatientEmail(
    prescription: any,
    patient: any,
    specialist: any,
    pdfUrl: string | undefined,
    expiresAt: Date,
    pdfBuffer?: Buffer,
  ): Promise<void> {
    try {
      const patientEmail = patient.profile?.contact?.email;
      if (!patientEmail) return;

      const patientName = patient.full_name || `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim();
      const specialistName = `Dr. ${specialist?.profile?.first_name || ''} ${specialist?.profile?.last_name || ''}`.trim();
      const expiryFormatted = moment(expiresAt).format('MMMM D, YYYY h:mm A');

      // Import email template
      const { prescriptionSentToPatientEmail } = await import('../../core/emails/mails/prescriptionEmails');

      const emailBody = prescriptionSentToPatientEmail({
        patientName,
        prescriptionNumber: prescription.prescription_number,
        specialistName,
        items: prescription.items.map((item: PrescriptionItem) => ({
          drug_name: item.drug_name,
          generic_name: item.generic_name,
          strength: item.drug_strength,
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        totalAmount: prescription.total_amount,
        currency: 'NGN',
        expiresAt: expiryFormatted,
        pdfUrl,
        dashboardUrl: `https://rapidcapsule.com/app/patient/prescriptions/${prescription._id}`,
      });

      // Prepare attachments - include PDF if available
      const attachments: Array<{ filename: string; content: Buffer; contentType: string }> = [];
      if (pdfBuffer) {
        attachments.push({
          filename: `Prescription-${prescription.prescription_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
      }

      this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject: `New Prescription from ${specialistName} - Action Required`,
        emailBody,
        attachments,
      });

      this.logger.log(`Prescription sent email delivered to ${patientEmail}`);
    } catch (error) {
      this.logger.error('Failed to send prescription to patient email', error);
    }
  }

  /**
   * Patient accepts prescription (full or partial)
   */
  async acceptPrescription(
    prescriptionId: Types.ObjectId,
    patientId: Types.ObjectId,
    acceptedItemIds?: string[],
  ) {
    const prescription = await this.prescriptionModel.findOne({
      _id: prescriptionId,
      patient_id: patientId,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.status !== SpecialistPrescriptionStatus.PENDING_ACCEPTANCE) {
      throw new BadRequestException('Prescription is not awaiting acceptance');
    }

    // Check if expired
    if (prescription.acceptance_expires_at && new Date() > prescription.acceptance_expires_at) {
      throw new BadRequestException('Prescription acceptance window has expired');
    }

    const isPartialAcceptance = Boolean(acceptedItemIds && acceptedItemIds.length > 0 && acceptedItemIds.length < prescription.items.length);
    const isFullAcceptance = !acceptedItemIds || acceptedItemIds.length === 0 || acceptedItemIds.length === prescription.items.length;

    // Update items with acceptance status
    // Use toObject() to get plain objects from Mongoose subdocuments
    const updatedItems = prescription.items.map((item: any) => {
      const plainItem = item.toObject ? item.toObject() : { ...item };
      const itemIdStr = plainItem._id?.toString() || plainItem.drug_id?.toString();
      const isAccepted = isFullAcceptance || (acceptedItemIds && acceptedItemIds.includes(itemIdStr));
      return {
        ...plainItem,
        patient_accepted: isAccepted,
        patient_declined_reason: isAccepted ? undefined : 'Not selected by patient',
      };
    });

    // Calculate new totals based on accepted items only
    const acceptedItems = updatedItems.filter((item: any) => item.patient_accepted);
    const newSubtotal = acceptedItems.reduce((sum: number, item: any) => {
      const price = Number(item.total_price) || 0;
      return sum + price;
    }, 0);
    const newTotal = currency(newSubtotal).add(Number(prescription.delivery_fee) || 0).value;

    // Release stock for declined items
    if (isPartialAcceptance) {
      const declinedItems = updatedItems.filter((item: any) => !item.patient_accepted);
      for (const item of declinedItems) {
        await this.releaseItemReservation(prescriptionId, item.drug_id);
      }
    }

    // Update prescription
    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        items: updatedItems,
        subtotal: newSubtotal,
        total_amount: newTotal,
        final_total: newTotal,
        status: SpecialistPrescriptionStatus.PENDING_PAYMENT,
        patient_response: isPartialAcceptance ? PatientResponse.PARTIAL : PatientResponse.ACCEPTED,
        patient_responded_at: new Date(),
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.PENDING_PAYMENT,
            changed_at: new Date(),
            changed_by: patientId,
            notes: isPartialAcceptance
              ? `Patient partially accepted (${acceptedItems.length}/${prescription.items.length} items)`
              : 'Patient accepted all items',
          },
        },
      },
    );

    // Notify specialist
    await this.sendPatientAcceptedEmail(prescription, patientId, isPartialAcceptance, acceptedItems.length, prescription.items.length);

    return {
      success: true,
      prescription_id: prescriptionId.toString(),
      accepted_items: acceptedItems.length,
      total_items: prescription.items.length,
      new_total: newTotal,
      message: isPartialAcceptance
        ? `Partial acceptance recorded (${acceptedItems.length}/${prescription.items.length} items)`
        : 'Prescription accepted successfully',
    };
  }

  /**
   * Release stock reservation for a specific item
   */
  private async releaseItemReservation(prescriptionId: Types.ObjectId, drugId: Types.ObjectId): Promise<void> {
    const reservations = await this.reservationModel.find({
      prescription_id: prescriptionId,
      drug_id: drugId,
      status: ReservationStatus.ACTIVE,
    });

    const StockBatchModel = this.connection.collection('stockbatchentities');

    for (const reservation of reservations) {
      await StockBatchModel.updateOne(
        { _id: reservation.batch_id },
        { $inc: { quantity_reserved: -reservation.quantity } },
      );

      await this.reservationModel.updateOne(
        { _id: reservation._id },
        {
          status: ReservationStatus.RELEASED,
          released_at: new Date(),
          status_reason: 'Item declined by patient',
        },
      );
    }
  }

  /**
   * Send email when patient accepts prescription
   */
  private async sendPatientAcceptedEmail(
    prescription: any,
    patientId: Types.ObjectId,
    isPartial: boolean,
    acceptedCount: number,
    totalCount: number,
  ): Promise<void> {
    try {
      const specialist = await this.usersService.findById(prescription.specialist_id);
      const patient = await this.usersService.findById(patientId);

      const specialistEmail = specialist?.profile?.contact?.email;
      if (!specialistEmail) return;

      const patientName = patient?.full_name || 'Patient';
      const specialistName = `Dr. ${specialist?.profile?.first_name || ''} ${specialist?.profile?.last_name || ''}`.trim();

      // Import email template
      const { prescriptionAcceptedByPatientEmail } = await import('../../core/emails/mails/prescriptionEmails');

      const emailBody = prescriptionAcceptedByPatientEmail({
        specialistName,
        patientName,
        prescriptionNumber: prescription.prescription_number,
        isPartial,
        acceptedCount,
        totalCount,
        totalAmount: prescription.total_amount,
        currency: 'NGN',
      });

      this.generalHelpers.generateEmailAndSend({
        email: specialistEmail,
        subject: `Prescription #${prescription.prescription_number} ${isPartial ? 'Partially ' : ''}Accepted by Patient`,
        emailBody,
        attachments: [],
      });
    } catch (error) {
      this.logger.error('Failed to send patient accepted email', error);
    }
  }

  /**
   * Patient declines prescription
   */
  async declinePrescription(
    prescriptionId: Types.ObjectId,
    patientId: Types.ObjectId,
    reason: string,
    declinedItems?: Array<{ item_id: string; reason: string }>,
  ) {
    const prescription = await this.prescriptionModel.findOne({
      _id: prescriptionId,
      patient_id: patientId,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.status !== SpecialistPrescriptionStatus.PENDING_ACCEPTANCE) {
      throw new BadRequestException('Prescription is not awaiting acceptance');
    }

    // Release all stock reservations
    await this.releaseReservations(prescriptionId);

    // Update prescription
    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        status: SpecialistPrescriptionStatus.CANCELLED,
        patient_response: PatientResponse.DECLINED,
        patient_responded_at: new Date(),
        patient_decline_reason: reason,
        cancellation_reason: `Declined by patient: ${reason}`,
        cancelled_at: new Date(),
        cancelled_by: patientId,
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.CANCELLED,
            changed_at: new Date(),
            changed_by: patientId,
            notes: `Patient declined: ${reason}`,
          },
        },
      },
    );

    // Notify specialist
    await this.sendPatientDeclinedEmail(prescription, patientId, reason);

    return {
      success: true,
      prescription_id: prescriptionId.toString(),
      message: 'Prescription declined successfully',
    };
  }

  /**
   * Send email when patient declines prescription
   */
  private async sendPatientDeclinedEmail(
    prescription: any,
    patientId: Types.ObjectId,
    reason: string,
  ): Promise<void> {
    try {
      const specialist = await this.usersService.findById(prescription.specialist_id);
      const patient = await this.usersService.findById(patientId);

      const specialistEmail = specialist?.profile?.contact?.email;
      if (!specialistEmail) return;

      const patientName = patient?.full_name || 'Patient';
      const specialistName = `Dr. ${specialist?.profile?.first_name || ''} ${specialist?.profile?.last_name || ''}`.trim();

      // Import email template
      const { prescriptionDeclinedByPatientEmail } = await import('../../core/emails/mails/prescriptionEmails');

      const emailBody = prescriptionDeclinedByPatientEmail({
        specialistName,
        patientName,
        prescriptionNumber: prescription.prescription_number,
        declineReason: reason,
        items: prescription.items.map((item: PrescriptionItem) => ({
          drug_name: item.drug_name,
          quantity: item.quantity,
        })),
      });

      this.generalHelpers.generateEmailAndSend({
        email: specialistEmail,
        subject: `Prescription #${prescription.prescription_number} Declined by Patient`,
        emailBody,
        attachments: [],
      });
    } catch (error) {
      this.logger.error('Failed to send patient declined email', error);
    }
  }

  /**
   * Recalculate prescription prices with current drug prices
   */
  async recalculatePrices(prescriptionId: Types.ObjectId): Promise<{
    original_total: number;
    new_total: number;
    price_changed: boolean;
  }> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const originalTotal = prescription.original_total || prescription.total_amount;
    let newSubtotal = 0;
    const updatedItems: PrescriptionItem[] = [];

    for (const item of prescription.items) {
      // Skip declined items
      if (item.patient_accepted === false) {
        updatedItems.push(item);
        continue;
      }

      // Get current price
      const drug = await this.getDrug(item.drug_id);
      const currentUnitPrice = drug.selling_price;
      const newTotalPrice = currency(currentUnitPrice).multiply(item.quantity).value;

      updatedItems.push({
        ...item,
        original_unit_price: item.original_unit_price || item.unit_price,
        unit_price: currentUnitPrice,
        total_price: newTotalPrice,
        price_updated_at: new Date(),
      });

      newSubtotal = currency(newSubtotal).add(newTotalPrice).value;
    }

    const newTotal = currency(newSubtotal).add(prescription.delivery_fee || 0).value;
    const priceChanged = Math.abs(newTotal - originalTotal) > 0.01;

    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        items: updatedItems,
        subtotal: newSubtotal,
        total_amount: newTotal,
        final_total: newTotal,
        prices_recalculated: true,
        prices_recalculated_at: new Date(),
      },
    );

    return {
      original_total: originalTotal,
      new_total: newTotal,
      price_changed: priceChanged,
    };
  }

  /**
   * Patient pays prescription with their wallet
   */
  async patientPayWithWallet(prescriptionId: Types.ObjectId, patientId: Types.ObjectId) {
    const prescription = await this.prescriptionModel.findOne({
      _id: prescriptionId,
      patient_id: patientId,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.status !== SpecialistPrescriptionStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Prescription is not awaiting payment');
    }

    if (prescription.payment_status === PrescriptionPaymentStatus.PAID) {
      throw new BadRequestException('Prescription is already paid');
    }

    // Recalculate prices to get current amounts
    const { new_total } = await this.recalculatePrices(prescriptionId);
    const totalAmount = new_total;

    // Check wallet balance (supports both legacy and unified wallets)
    const earnings = await this.patientWalletService.getUserEarnings(patientId);
    if (earnings.currentBalance < totalAmount) {
      throw new BadRequestException(
        `Insufficient wallet balance. Available: ${earnings.currentBalance}, Required: ${totalAmount}`,
      );
    }

    // Debit patient wallet
    const reference = this.generalHelpers.genTxReference();
    const { transaction } = await this.patientWalletService.debitWalletForPurchase(
      patientId,
      totalAmount,
      reference,
      `Prescription ${prescription.prescription_number} - Self Payment`,
    );

    // Update prescription
    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        payment_method: PrescriptionPaymentMethod.PATIENT_WALLET,
        payment_status: PrescriptionPaymentStatus.PAID,
        payment_reference: reference,
        paid_at: new Date(),
        paid_by: 'patient',
        wallet_amount_paid: totalAmount,
        patient_wallet_transaction_id: transaction._id,
        status: SpecialistPrescriptionStatus.PAID,
        final_total: totalAmount,
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.PAID,
            changed_at: new Date(),
            changed_by: patientId,
            notes: 'Patient paid with wallet',
          },
        },
      },
    );

    // Confirm stock reservations
    await this.confirmReservations(prescriptionId);

    // Notify specialist
    await this.sendPatientPaidEmail(prescription, patientId, totalAmount, 'wallet');

    return {
      success: true,
      prescription_id: prescriptionId.toString(),
      payment_reference: reference,
      amount_paid: totalAmount,
      message: 'Payment successful from wallet',
    };
  }

  /**
   * Patient initiates card payment
   */
  async patientInitiateCardPayment(prescriptionId: Types.ObjectId, patientId: Types.ObjectId) {
    const prescription = await this.prescriptionModel.findOne({
      _id: prescriptionId,
      patient_id: patientId,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.status !== SpecialistPrescriptionStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Prescription is not awaiting payment');
    }

    // Recalculate prices
    const { new_total } = await this.recalculatePrices(prescriptionId);

    // Get patient email
    const patient = await this.usersService.findById(patientId);
    if (!patient?.profile?.contact?.email) {
      throw new BadRequestException('Patient does not have a valid email');
    }

    // Generate payment reference
    const reference = this.generalHelpers.genTxReference();

    // Initialize Paystack payment
    const paymentResponse = await this.paymentHandler.initializeTransaction(
      patient.profile.contact.email,
      new_total * 100, // Convert to kobo
      reference,
      {
        type: 'prescription_self_payment',
        prescription_id: prescriptionId.toString(),
        prescription_number: prescription.prescription_number,
        patient_id: patientId.toString(),
      },
    );

    // Update prescription with payment reference
    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        payment_method: PrescriptionPaymentMethod.PATIENT_ONLINE,
        payment_reference: reference,
        final_total: new_total,
      },
    );

    return {
      success: true,
      prescription_id: prescriptionId.toString(),
      authorization_url: paymentResponse.data?.authorization_url,
      reference,
      amount: new_total,
      message: 'Payment initialized. Redirect to authorization URL.',
    };
  }

  /**
   * Verify patient card payment
   */
  async patientVerifyCardPayment(
    prescriptionId: Types.ObjectId,
    patientId: Types.ObjectId,
    reference: string,
  ) {
    const prescription = await this.prescriptionModel.findOne({
      _id: prescriptionId,
      patient_id: patientId,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.payment_status === PrescriptionPaymentStatus.PAID) {
      return {
        success: true,
        message: 'Payment already processed',
        prescription_id: prescriptionId.toString(),
      };
    }

    // Verify with Paystack
    const verification = await this.paymentHandler.verifyTransaction(reference);

    if (verification.data?.status !== 'success') {
      await this.prescriptionModel.updateOne(
        { _id: prescriptionId },
        { payment_status: PrescriptionPaymentStatus.FAILED },
      );
      throw new BadRequestException('Payment verification failed');
    }

    const amountPaid = verification.data.amount / 100; // Convert from kobo

    if (amountPaid < prescription.final_total) {
      throw new BadRequestException('Insufficient payment amount');
    }

    // Update prescription
    await this.prescriptionModel.updateOne(
      { _id: prescriptionId },
      {
        payment_status: PrescriptionPaymentStatus.PAID,
        paid_at: new Date(),
        paid_by: 'patient',
        status: SpecialistPrescriptionStatus.PAID,
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.PAID,
            changed_at: new Date(),
            changed_by: patientId,
            notes: 'Patient completed card payment',
          },
        },
      },
    );

    // Confirm stock reservations
    await this.confirmReservations(prescriptionId);

    // Notify specialist
    await this.sendPatientPaidEmail(prescription, patientId, amountPaid, 'card');

    return {
      success: true,
      prescription_id: prescriptionId.toString(),
      payment_reference: reference,
      amount_paid: amountPaid,
      message: 'Payment verified successfully',
    };
  }

  /**
   * Send email when patient pays prescription
   */
  private async sendPatientPaidEmail(
    prescription: any,
    patientId: Types.ObjectId,
    amount: number,
    method: 'wallet' | 'card',
  ): Promise<void> {
    try {
      const specialist = await this.usersService.findById(prescription.specialist_id);
      const patient = await this.usersService.findById(patientId);

      const specialistEmail = specialist?.profile?.contact?.email;
      if (!specialistEmail) return;

      const patientName = patient?.full_name || 'Patient';
      const specialistName = `Dr. ${specialist?.profile?.first_name || ''} ${specialist?.profile?.last_name || ''}`.trim();

      // Import email template
      const { prescriptionPaidByPatientEmail } = await import('../../core/emails/mails/prescriptionEmails');

      const emailBody = prescriptionPaidByPatientEmail({
        specialistName,
        patientName,
        prescriptionNumber: prescription.prescription_number,
        amountPaid: amount,
        paymentMethod: method,
        currency: 'NGN',
        paidAt: moment().format('MMMM D, YYYY h:mm A'),
      });

      this.generalHelpers.generateEmailAndSend({
        email: specialistEmail,
        subject: `Payment Received for Prescription #${prescription.prescription_number}`,
        emailBody,
        attachments: [],
      });
    } catch (error) {
      this.logger.error('Failed to send patient paid email', error);
    }
  }

  /**
   * Get prescription for patient view (with specialist details)
   */
  async getPatientPrescription(prescriptionId: Types.ObjectId, patientId: Types.ObjectId) {
    const prescription = await this.prescriptionModel
      .findOne({
        _id: prescriptionId,
        patient_id: patientId,
      })
      .lean();

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Get specialist details
    const specialist = await this.usersService.findById(prescription.specialist_id);

    // Resolve specialist profile image
    const specialistProfileImage = specialist
      ? await this.fileUploadHelper.resolveProfileImage(specialist.profile?.profile_photo)
      : null;

    // Format prescribed_by to match frontend expectations
    const prescribedBy = specialist
      ? {
          _id: specialist._id,
          profile: {
            first_name: specialist.profile?.first_name || '',
            last_name: specialist.profile?.last_name || '',
            profile_photo: specialistProfileImage,
            professional_practice: (specialist.profile as any)?.professional_practice || {
              area_of_specialty: (specialist.profile as any)?.specialist_info?.specialties?.[0] || 'General Practice',
              years_of_practice: '',
            },
            contact: {
              email: specialist.profile?.contact?.email || (specialist as any).email,
              phone: specialist.profile?.contact?.phone || null,
            },
          },
        }
      : null;

    // Populate linked appointments for patient (dates only, no clinical note content)
    let relatedAppointments: any[] = [];
    if (prescription.linked_appointments?.length) {
      const AppointmentsCollection = this.connection.collection('appointments');
      const appointments = await AppointmentsCollection.find({
        _id: { $in: prescription.linked_appointments },
      }).project({
        _id: 1,
        start_time: 1,
        meeting_channel: 1,
        category: 1,
      }).toArray();
      relatedAppointments = appointments.map(appt => ({
        _id: appt._id,
        start_time: appt.start_time,
        meeting_channel: appt.meeting_channel,
        category: appt.category,
      }));
    }

    return {
      ...prescription,
      related_appointments: relatedAppointments,
      prescribed_by: prescribedBy,
      specialist: specialist
        ? {
            _id: specialist._id,
            full_name: `Dr. ${specialist.profile?.first_name || ''} ${specialist.profile?.last_name || ''}`.trim(),
            specialties: (specialist.profile as any)?.specialist_info?.specialties || [],
            profile_image: specialistProfileImage,
          }
        : null,
    };
  }

  /**
   * Get prescription by prescription number for patient view
   */
  async getPatientPrescriptionByNumber(prescriptionNumber: string, patientId: Types.ObjectId) {
    const prescription = await this.prescriptionModel
      .findOne({
        prescription_number: prescriptionNumber,
        patient_id: patientId,
      })
      .lean();

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Get specialist details
    const specialist = await this.usersService.findById(prescription.specialist_id);

    // Resolve specialist profile image
    const specialistProfileImage = specialist
      ? await this.fileUploadHelper.resolveProfileImage(specialist.profile?.profile_photo)
      : null;

    // Format prescribed_by to match frontend expectations
    const prescribedBy = specialist
      ? {
          _id: specialist._id,
          profile: {
            first_name: specialist.profile?.first_name || '',
            last_name: specialist.profile?.last_name || '',
            profile_photo: specialistProfileImage,
            professional_practice: (specialist.profile as any)?.professional_practice || {
              area_of_specialty: (specialist.profile as any)?.specialist_info?.specialties?.[0] || 'General Practice',
              years_of_practice: '',
            },
            contact: {
              email: specialist.profile?.contact?.email || (specialist as any).email,
              phone: specialist.profile?.contact?.phone || null,
            },
          },
        }
      : null;

    return {
      ...prescription,
      prescribed_by: prescribedBy,
      specialist: specialist
        ? {
            _id: specialist._id,
            full_name: `Dr. ${specialist.profile?.first_name || ''} ${specialist.profile?.last_name || ''}`.trim(),
            specialties: (specialist.profile as any)?.specialist_info?.specialties || [],
            profile_image: specialistProfileImage,
          }
        : null,
    };
  }

  /**
   * Get PDF download URL for patient (presigned URL for secure access)
   */
  async getPrescriptionPdf(prescriptionId: Types.ObjectId, patientId: Types.ObjectId) {
    const prescription = await this.prescriptionModel.findOne({
      _id: prescriptionId,
      patient_id: patientId,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (!prescription.pdf_url) {
      throw new NotFoundException('PDF not available for this prescription');
    }

    // Generate presigned URL for secure download (24 hours expiry)
    const presignedUrl = await this.prescriptionPdfService.getPresignedPdfUrl(
      prescription.pdf_url,
      86400, // 24 hours
    );

    return {
      url: presignedUrl,
      prescription_number: prescription.prescription_number,
    };
  }

  // ============ PUBLIC VERIFICATION ============

  /**
   * Verify a prescription by prescription number (public endpoint)
   * @param prescriptionNumber The prescription number (e.g., RX-20251217-0001)
   * @param hash Optional hash to validate
   * @returns Prescription details and validation result
   */
  async verifyPrescription(
    prescriptionNumber: string,
    hash?: string,
  ): Promise<{
    valid: boolean;
    hash_valid?: boolean;
    prescription: {
      prescription_number: string;
      status: string;
      created_at: Date;
      valid_until?: Date;
      patient: {
        full_name: string;
        patient_id: string;
      };
      prescriber: {
        full_name: string;
        license_number?: string;
        specialization?: string;
      };
      items: Array<{
        drug_name: string;
        generic_name?: string;
        strength?: string;
        quantity: number;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
        unit_price?: number;
        total_price?: number;
      }>;
      total_amount: number;
      subtotal?: number;
      delivery_fee?: number;
      currency: string;
      pdf_url?: string;
      payment_status?: string;
      status_history?: Array<any>;
      delivery_address?: any;
    };
  }> {
    const UsersCollection = this.connection.collection('users');

    // Find prescription by number
    const prescription = await this.prescriptionModel.findOne({
      prescription_number: prescriptionNumber,
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Fetch patient and specialist details
    const [patient, specialist] = await Promise.all([
      prescription.patient_id
        ? UsersCollection.findOne(
            { _id: new Types.ObjectId(prescription.patient_id) },
            { projection: { 'profile.first_name': 1, 'profile.last_name': 1 } },
          )
        : null,
      prescription.specialist_id
        ? UsersCollection.findOne(
            { _id: new Types.ObjectId(prescription.specialist_id) },
            {
              projection: {
                'profile.first_name': 1,
                'profile.last_name': 1,
                'professional_practice.license_number': 1,
                'professional_practice.category': 1,
              },
            },
          )
        : null,
    ]);

    // Get created_at from timestamps (added by Mongoose)
    const createdAt = (prescription as any).created_at || new Date();

    // Validate hash if provided - compare against stored pdf_hash
    let hashValid: boolean | undefined;
    if (hash && prescription.pdf_hash) {
      hashValid = hash === prescription.pdf_hash;
    } else if (hash && !prescription.pdf_hash) {
      // No stored hash to compare against
      hashValid = undefined;
    }

    // Calculate valid until date (28 days from creation)
    const validUntil = prescription.expires_at ||
      new Date(new Date(createdAt).getTime() + 28 * 24 * 60 * 60 * 1000);

    // Get presigned PDF URL if available
    let pdfUrl: string | undefined;
    if (prescription.pdf_url) {
      try {
        pdfUrl = await this.prescriptionPdfService.getPresignedPdfUrl(
          prescription.pdf_url,
          3600, // 1 hour for verification page
        );
      } catch (e) {
        this.logger.warn(`Failed to get presigned URL for verification: ${e.message}`);
      }
    }

    return {
      valid: true,
      hash_valid: hashValid,
      prescription: {
        prescription_number: prescription.prescription_number,
        status: prescription.status,
        created_at: createdAt,
        valid_until: validUntil,
        patient: {
          full_name: patient
            ? `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim()
            : 'Unknown Patient',
          patient_id: `PAT-${prescription.patient_id.toString().slice(-6).toUpperCase()}`,
        },
        prescriber: {
          full_name: specialist
            ? `Dr. ${specialist.profile?.first_name || ''} ${specialist.profile?.last_name || ''}`.trim()
            : 'Unknown Prescriber',
          license_number: specialist?.professional_practice?.license_number,
          specialization: specialist?.professional_practice?.category,
        },
        items: prescription.items.map((item) => ({
          drug_name: item.drug_name,
          generic_name: item.generic_name,
          strength: item.drug_strength,
          quantity: item.quantity,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration,
          instructions: item.instructions,
          unit_price: item.unit_price,
          total_price: item.total_price,
        })),
        total_amount: prescription.total_amount,
        subtotal: prescription.subtotal,
        delivery_fee: prescription.delivery_fee,
        currency: prescription.currency || 'NGN',
        pdf_url: pdfUrl,
        payment_status: prescription.payment_status,
        status_history: prescription.status_history,
        delivery_address: prescription.delivery_address,
      },
    };
  }

  // ============ PHARMACY RATING ============

  /**
   * Rate a delivered prescription's pharmacy experience
   * @param prescriptionId - The prescription ID
   * @param patientId - The patient's user ID
   * @param rating - Star rating (1-5)
   * @param review - Optional review text
   */
  async ratePrescription(
    prescriptionId: string,
    patientId: string,
    rating: number,
    review?: string,
  ): Promise<SpecialistPrescriptionDocument> {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Find the prescription
    const prescription = await this.prescriptionModel.findById(prescriptionId);
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Verify the prescription belongs to this patient
    // Handle both populated and non-populated patient_id
    const prescriptionPatientId = (prescription.patient_id as any)?._id?.toString()
      || prescription.patient_id?.toString();
    if (prescriptionPatientId !== patientId) {
      throw new ForbiddenException('You can only rate your own prescriptions');
    }

    // Check if already rated
    if (prescription.rating) {
      throw new BadRequestException('This prescription has already been rated');
    }

    // Check if prescription is in a ratable status (delivered or completed)
    const ratableStatuses = ['delivered', 'completed'];
    if (!ratableStatuses.includes(prescription.status?.toLowerCase())) {
      throw new BadRequestException(
        'Prescriptions can only be rated after delivery',
      );
    }

    // Update the prescription with rating
    prescription.rating = rating;
    if (review?.trim()) {
      prescription.review = review.trim();
    }
    prescription.rated_at = new Date();
    await prescription.save();

    // Update pharmacy rating if the specialist is a pharmacist
    if (prescription.specialist_id) {
      await this.updatePharmacyRatingBySpecialist(prescription.specialist_id.toString(), rating);
    }

    this.logger.log(
      `Prescription ${prescription.prescription_number} rated ${rating} stars by patient ${patientId}`,
    );

    return prescription;
  }

  /**
   * Update pharmacy average rating by specialist ID
   * Finds the pharmacy associated with the specialist and updates its rating
   */
  private async updatePharmacyRatingBySpecialist(
    specialistId: string,
    newRating: number,
  ): Promise<void> {
    try {
      const PharmaciesCollection = this.connection.collection('pharmacies');

      // Find pharmacy by user_id (the specialist who owns the pharmacy)
      const pharmacy = await PharmaciesCollection.findOne({
        user_id: new Types.ObjectId(specialistId),
      });

      if (!pharmacy) {
        // Specialist may not be a pharmacy, which is fine
        this.logger.debug(`No pharmacy found for specialist ${specialistId}`);
        return;
      }

      const totalRatings = (pharmacy.total_ratings || 0) + 1;
      const currentTotal = (pharmacy.average_rating || 0) * (pharmacy.total_ratings || 0);
      const newAverage = (currentTotal + newRating) / totalRatings;

      await PharmaciesCollection.updateOne(
        { _id: pharmacy._id },
        {
          $set: {
            average_rating: Math.round(newAverage * 10) / 10, // Round to 1 decimal
            total_ratings: totalRatings,
          },
        },
      );

      this.logger.log(
        `Updated pharmacy ${pharmacy._id} rating: ${newAverage.toFixed(1)} (${totalRatings} ratings)`,
      );
    } catch (error) {
      this.logger.error(`Failed to update pharmacy rating: ${error.message}`);
    }
  }

  // ============ PICKUP CENTER MANAGEMENT ============

  /**
   * Set or update pickup center for a prescription
   * Patient can select where to pick up their order
   */
  async setPickupCenter(
    prescriptionId: Types.ObjectId | string,
    pickupPharmacyId: string,
    userId: Types.ObjectId,
  ): Promise<SpecialistPrescriptionDocument> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Only allow setting pickup for certain statuses
    const allowedStatuses = [
      SpecialistPrescriptionStatus.DRAFT,
      SpecialistPrescriptionStatus.PENDING_ACCEPTANCE,
      SpecialistPrescriptionStatus.ACCEPTED,
      SpecialistPrescriptionStatus.PENDING_PAYMENT,
    ];

    if (!allowedStatuses.includes(prescription.status as SpecialistPrescriptionStatus)) {
      throw new BadRequestException('Cannot change pickup center at this stage');
    }

    // Validate pickup pharmacy exists and is available
    const PharmaciesCollection = this.connection.collection('pharmacies');
    const pickupPharmacy = await PharmaciesCollection.findOne({
      _id: new Types.ObjectId(pickupPharmacyId),
      is_active: true,
      is_suspended: false,
      is_pickup_center: true,
      verification_status: 'VERIFIED',
      'pickup_center_settings.accepts_external_orders': { $ne: false },
    });

    if (!pickupPharmacy) {
      throw new BadRequestException('Selected pickup center is not available');
    }

    // Generate pickup code if not already set
    const pickupCode = prescription.pickup_code || this.generatePickupCode();

    // Update delivery fee to pickup handling fee
    const pickupHandlingFee = pickupPharmacy.pickup_center_settings?.handling_fee || 0;
    const newTotal = prescription.subtotal + pickupHandlingFee - prescription.discount;

    await this.prescriptionModel.updateOne(
      { _id: prescription._id },
      {
        is_pickup_order: true,
        pickup_pharmacy_id: new Types.ObjectId(pickupPharmacyId),
        pickup_code: pickupCode,
        delivery_fee: pickupHandlingFee,
        total_amount: newTotal,
        delivery_address: null, // Clear delivery address for pickup orders
        updated_by: userId,
      },
    );

    this.logger.log(`Set pickup center ${pickupPharmacyId} for prescription ${prescriptionId}`);

    // Send notification to pharmacy about new pickup order (if order is already paid)
    if (prescription.payment_status === PrescriptionPaymentStatus.PAID) {
      try {
        const patient = await this.usersService.findById(prescription.patient_id as Types.ObjectId);

        if (pickupPharmacy.contact?.email) {
          const emailData: PickupOrderNotificationData = {
            pharmacyName: pickupPharmacy.name || 'Pharmacy',
            prescriptionNumber: prescription.prescription_number,
            patientName: patient
              ? `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient'
              : 'Patient',
            items: prescription.items.map(item => ({
              drug_name: item.drug_name || item.drug_id?.toString() || 'Medication',
              quantity: item.quantity,
            })),
            totalAmount: prescription.total_amount || 0,
            currency: prescription.currency || 'NGN',
          };

          await this.generalHelpers.generateEmailAndSend({
            email: pickupPharmacy.contact.email,
            subject: `New Pickup Order #${prescription.prescription_number}`,
            emailBody: newPickupOrderForPharmacyEmail(emailData),
          });
          this.logger.log(`Pickup order notification sent to pharmacy ${pickupPharmacy.name}`);
        }
      } catch (emailError) {
        this.logger.error(`Failed to send pharmacy notification: ${emailError.message}`);
      }
    }

    const updated = await this.prescriptionModel.findById(prescriptionId);
    if (!updated) {
      throw new NotFoundException('Prescription not found after update');
    }
    return updated;
  }

  /**
   * Mark prescription as ready for pickup
   * Called by the pickup center pharmacy when order arrives
   */
  async markReadyForPickup(
    prescriptionId: Types.ObjectId | string,
    userId: Types.ObjectId,
    notes?: string,
  ): Promise<SpecialistPrescriptionDocument> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (!prescription.is_pickup_order) {
      throw new BadRequestException('This is not a pickup order');
    }

    // Should be in DISPENSED or SHIPPED status (order has been prepared)
    const allowedStatuses = [
      SpecialistPrescriptionStatus.DISPENSED,
      SpecialistPrescriptionStatus.SHIPPED,
    ];

    if (!allowedStatuses.includes(prescription.status as SpecialistPrescriptionStatus)) {
      throw new BadRequestException('Order must be dispensed before marking ready for pickup');
    }

    await this.prescriptionModel.updateOne(
      { _id: prescription._id },
      {
        ready_for_pickup_at: new Date(),
        updated_by: userId,
        $push: {
          status_history: {
            status: prescription.status,
            changed_at: new Date(),
            changed_by: userId,
            notes: notes || 'Order ready for pickup',
          },
        },
      },
    );

    // Send notification to patient that order is ready for pickup
    this.logger.log(`Prescription ${prescriptionId} marked ready for pickup`);

    try {
      const patient = await this.usersService.findById(prescription.patient_id as Types.ObjectId);

      // Get pickup pharmacy details
      const PharmacyModel = this.connection.model('Pharmacy');
      const pickupPharmacy = await PharmacyModel.findById(prescription.pickup_pharmacy_id);

      const patientEmail = patient?.profile?.contact?.email;
      if (patient && patientEmail && pickupPharmacy) {
        const pharmacyAddress = pickupPharmacy.address
          ? `${pickupPharmacy.address.street || ''}, ${pickupPharmacy.address.city || ''}, ${pickupPharmacy.address.state || ''}`.trim()
          : '';

        const emailData: PickupReadyEmailData = {
          patientName: `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient',
          prescriptionNumber: prescription.prescription_number,
          pickupCode: prescription.pickup_code || '',
          pickupPharmacyName: pickupPharmacy.name || 'Pickup Center',
          pickupPharmacyAddress: pharmacyAddress,
          pickupPharmacyPhone: pickupPharmacy.contact?.phone,
          items: prescription.items.map(item => ({
            drug_name: item.drug_name || item.drug_id?.toString() || 'Medication',
            quantity: item.quantity,
          })),
          totalAmount: prescription.total_amount || 0,
          currency: prescription.currency || 'NGN',
        };

        await this.generalHelpers.generateEmailAndSend({
          email: patientEmail,
          subject: `Your Order #${prescription.prescription_number} is Ready for Pickup`,
          emailBody: orderReadyForPickupEmail(emailData),
        });
        this.logger.log(`Pickup ready notification sent to ${patientEmail}`);
      }
    } catch (emailError) {
      this.logger.error(`Failed to send pickup ready notification: ${emailError.message}`);
    }

    const updated = await this.prescriptionModel.findById(prescriptionId);
    if (!updated) {
      throw new NotFoundException('Prescription not found after update');
    }
    return updated;
  }

  /**
   * Confirm patient pickup
   * Called by pickup center staff when patient collects order
   */
  async confirmPickup(
    prescriptionId: Types.ObjectId | string,
    pickupCode: string,
    confirmedBy: string,
    notes?: string,
  ): Promise<SpecialistPrescriptionDocument> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (!prescription.is_pickup_order) {
      throw new BadRequestException('This is not a pickup order');
    }

    // Verify pickup code
    if (prescription.pickup_code !== pickupCode) {
      throw new BadRequestException('Invalid pickup code');
    }

    // Should be ready for pickup
    if (!prescription.ready_for_pickup_at) {
      throw new BadRequestException('Order is not yet ready for pickup');
    }

    // Already picked up
    if (prescription.picked_up_at) {
      throw new BadRequestException('Order has already been picked up');
    }

    await this.prescriptionModel.updateOne(
      { _id: prescription._id },
      {
        picked_up_at: new Date(),
        pickup_confirmed_by: confirmedBy,
        status: SpecialistPrescriptionStatus.DELIVERED,
        delivered_at: new Date(),
        $push: {
          status_history: {
            status: SpecialistPrescriptionStatus.DELIVERED,
            changed_at: new Date(),
            changed_by: new Types.ObjectId(confirmedBy),
            notes: notes || 'Order picked up by patient',
          },
        },
      },
    );

    // Send notification to patient confirming pickup
    this.logger.log(`Prescription ${prescriptionId} picked up. Code: ${pickupCode}`);

    try {
      const patient = await this.usersService.findById(prescription.patient_id as Types.ObjectId);

      // Get pickup pharmacy details
      const PharmacyModel = this.connection.model('Pharmacy');
      const pickupPharmacy = await PharmacyModel.findById(prescription.pickup_pharmacy_id);

      const patientEmail = patient?.profile?.contact?.email;
      if (patient && patientEmail && pickupPharmacy) {
        const emailData: PickupConfirmedEmailData = {
          patientName: `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient',
          prescriptionNumber: prescription.prescription_number,
          pickupPharmacyName: pickupPharmacy.name || 'Pickup Center',
          pickupDate: moment().format('MMMM Do, YYYY [at] h:mm A'),
          items: prescription.items.map(item => ({
            drug_name: item.drug_name || item.drug_id?.toString() || 'Medication',
            quantity: item.quantity,
          })),
          totalAmount: prescription.total_amount || 0,
          currency: prescription.currency || 'NGN',
        };

        await this.generalHelpers.generateEmailAndSend({
          email: patientEmail,
          subject: `Pickup Confirmed - Order #${prescription.prescription_number}`,
          emailBody: pickupConfirmedEmail(emailData),
        });
        this.logger.log(`Pickup confirmed notification sent to ${patientEmail}`);
      }
    } catch (emailError) {
      this.logger.error(`Failed to send pickup confirmed notification: ${emailError.message}`);
    }

    const updated = await this.prescriptionModel.findById(prescriptionId);
    if (!updated) {
      throw new NotFoundException('Prescription not found after update');
    }
    return updated;
  }

  /**
   * Get prescriptions pending pickup at a specific pharmacy
   */
  async getPickupOrdersForPharmacy(
    pharmacyId: string,
    options: {
      status?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    orders: SpecialistPrescriptionDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { status, page = 1, limit = 20 } = options;

    const filter: any = {
      pickup_pharmacy_id: new Types.ObjectId(pharmacyId),
      is_pickup_order: true,
    };

    // Filter by pickup status
    if (status === 'ready') {
      filter.ready_for_pickup_at = { $ne: null };
      filter.picked_up_at = null;
    } else if (status === 'pending') {
      filter.ready_for_pickup_at = null;
      filter.status = { $in: ['paid', 'processing', 'dispensed', 'shipped'] };
    } else if (status === 'completed') {
      filter.picked_up_at = { $ne: null };
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prescriptionModel
        .find(filter)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.prescriptionModel.countDocuments(filter),
    ]);

    return {
      orders,
      total,
      page,
      limit,
    };
  }
}
