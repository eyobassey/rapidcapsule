import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SpecialistPrescription,
  SpecialistPrescriptionDocument,
  SpecialistPrescriptionStatus,
  PrescriptionPaymentStatus,
} from '../entities/specialist-prescription.entity';
import { GeneralHelpers } from '../../../common/helpers/general.helpers';
import {
  refillReminderEmail,
  refillAvailableEmail,
  prescriptionExpiringEmail,
  earlyRefillDeniedEmail,
  RefillReminderEmailData,
  RefillAvailableEmailData,
  PrescriptionExpiringEmailData,
  EarlyRefillDeniedEmailData,
} from '../../../core/emails/mails/prescriptionEmails';

export interface RefillEligibility {
  is_eligible: boolean;
  reason?: string;
  next_refill_date?: Date;
  days_until_eligible?: number;
  refills_remaining?: number;
  prescription_expires_at?: Date;
  days_until_prescription_expires?: number;
}

export interface RefillHistoryItem {
  prescription_id: string;
  prescription_number: string;
  filled_at: Date;
  status: SpecialistPrescriptionStatus;
  total_amount: number;
}

@Injectable()
export class RefillService {
  private readonly logger = new Logger(RefillService.name);

  constructor(
    @InjectModel(SpecialistPrescription.name)
    private prescriptionModel: Model<SpecialistPrescriptionDocument>,
    private readonly generalHelpers: GeneralHelpers,
  ) {}

  /**
   * Check if a prescription is eligible for refill
   */
  async checkRefillEligibility(prescriptionId: string): Promise<RefillEligibility> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const now = new Date();

    // Check if prescription is refillable
    if (!prescription.is_refillable) {
      return {
        is_eligible: false,
        reason: 'This prescription is not eligible for refills',
      };
    }

    // Check if prescription status allows refills (only delivered prescriptions can be refilled)
    if (prescription.status !== SpecialistPrescriptionStatus.DELIVERED) {
      return {
        is_eligible: false,
        reason: 'Prescription must be delivered before requesting a refill',
      };
    }

    // Check remaining refills
    const refillsRemaining = prescription.refill_count - prescription.refills_used;
    if (refillsRemaining <= 0) {
      return {
        is_eligible: false,
        reason: 'No refills remaining on this prescription',
        refills_remaining: 0,
      };
    }

    // Check if prescription itself has expired
    if (prescription.prescription_valid_until && prescription.prescription_valid_until < now) {
      return {
        is_eligible: false,
        reason: 'This prescription has expired. Please consult your doctor for a new prescription.',
        prescription_expires_at: prescription.prescription_valid_until,
      };
    }

    // Check if it's too early for refill
    if (prescription.next_refill_date && prescription.next_refill_date > now) {
      const daysUntilEligible = Math.ceil(
        (prescription.next_refill_date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        is_eligible: false,
        reason: `Too early for refill. You can request a refill on ${prescription.next_refill_date.toLocaleDateString()}.`,
        next_refill_date: prescription.next_refill_date,
        days_until_eligible: daysUntilEligible,
        refills_remaining: refillsRemaining,
      };
    }

    // Calculate days until prescription expires
    let daysUntilExpires: number | undefined;
    if (prescription.prescription_valid_until) {
      daysUntilExpires = Math.ceil(
        (prescription.prescription_valid_until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return {
      is_eligible: true,
      refills_remaining: refillsRemaining,
      prescription_expires_at: prescription.prescription_valid_until,
      days_until_prescription_expires: daysUntilExpires,
    };
  }

  /**
   * Calculate the next refill date based on prescription details
   */
  calculateNextRefillDate(lastFillDate: Date, daysSupply: number, allowEarlyRefillDays = 3): Date {
    // Allow refill a few days early (common practice to avoid gaps in medication)
    const nextRefillDate = new Date(lastFillDate);
    nextRefillDate.setDate(nextRefillDate.getDate() + daysSupply - allowEarlyRefillDays);
    return nextRefillDate;
  }

  /**
   * Request a refill for an existing prescription
   */
  async requestRefill(
    prescriptionId: string,
    patientId: string,
    deliveryAddress?: any,
  ): Promise<SpecialistPrescriptionDocument> {
    // Check eligibility first
    const eligibility = await this.checkRefillEligibility(prescriptionId);

    if (!eligibility.is_eligible) {
      throw new BadRequestException(eligibility.reason || 'Not eligible for refill');
    }

    const originalPrescription = await this.prescriptionModel
      .findById(prescriptionId)
      .populate('specialist_id', 'email profile')
      .populate('patient_id', 'email profile');

    if (!originalPrescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Verify patient owns this prescription
    if (originalPrescription.patient_id.toString() !== patientId) {
      throw new BadRequestException('You are not authorized to refill this prescription');
    }

    // Generate new prescription number for refill
    const prescriptionNumber = await this.generateRefillPrescriptionNumber(
      originalPrescription.prescription_number
    );

    // Create refill prescription with same items and settings
    const refillPrescription = new this.prescriptionModel({
      prescription_number: prescriptionNumber,
      specialist_id: originalPrescription.specialist_id,
      patient_id: originalPrescription.patient_id,
      items: originalPrescription.items.map(item => ({
        ...item,
        stock_reserved: false,
        stock_reservation_id: undefined,
        stock_reservation_expires: undefined,
        patient_accepted: true, // Auto-accept for refills
      })),
      subtotal: originalPrescription.subtotal,
      discount: 0,
      delivery_fee: originalPrescription.delivery_fee,
      total_amount: originalPrescription.total_amount,
      currency: originalPrescription.currency,
      payment_method: originalPrescription.payment_method,
      payment_status: PrescriptionPaymentStatus.PENDING,
      delivery_address: deliveryAddress || originalPrescription.delivery_address,
      status: SpecialistPrescriptionStatus.PENDING_PAYMENT,
      status_history: [{
        status: SpecialistPrescriptionStatus.PENDING_PAYMENT,
        changed_at: new Date(),
        changed_by: new Types.ObjectId(patientId),
        notes: 'Refill requested',
      }],
      clinical_notes: originalPrescription.clinical_notes,
      patient_notes: originalPrescription.patient_notes,
      // Refill-specific fields
      is_refillable: originalPrescription.is_refillable,
      refill_count: originalPrescription.refill_count,
      refills_used: originalPrescription.refills_used + 1,
      days_supply: originalPrescription.days_supply,
      prescription_valid_until: originalPrescription.prescription_valid_until,
      original_prescription_id: originalPrescription._id,
      is_refill: true,
      // Set expiry for payment (6 hours)
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000),
    });

    await refillPrescription.save();

    // Update original prescription's refill count
    originalPrescription.refills_used += 1;
    originalPrescription.last_fill_date = new Date();

    // Calculate next refill date
    if (originalPrescription.days_supply) {
      originalPrescription.next_refill_date = this.calculateNextRefillDate(
        new Date(),
        originalPrescription.days_supply
      );
    }

    await originalPrescription.save();

    this.logger.log(`Refill created: ${prescriptionNumber} for original ${originalPrescription.prescription_number}`);

    return refillPrescription;
  }

  /**
   * Generate prescription number for refill (e.g., RX-20251217-0001-R2)
   */
  private async generateRefillPrescriptionNumber(originalNumber: string): Promise<string> {
    // Find how many refills exist for this prescription
    const refillCount = await this.prescriptionModel.countDocuments({
      prescription_number: { $regex: `^${originalNumber}-R` },
    });

    return `${originalNumber}-R${refillCount + 1}`;
  }

  /**
   * Send refill reminder email to patient
   */
  async sendRefillReminder(prescriptionId: string): Promise<void> {
    const prescription = await this.prescriptionModel
      .findById(prescriptionId)
      .populate('patient_id', 'email profile');

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const patient = prescription.patient_id as any;
    if (!patient?.email) {
      this.logger.warn(`Cannot send refill reminder - no email for patient on prescription ${prescriptionId}`);
      return;
    }

    const daysRemaining = prescription.days_supply
      ? Math.max(0, Math.ceil(
          ((prescription.next_refill_date?.getTime() || Date.now()) - Date.now()) / (1000 * 60 * 60 * 24)
        ) + 3) // Add back the early refill days
      : 3;

    // Get the first item for the email (or could show all)
    const primaryItem = prescription.items[0];

    const emailData: RefillReminderEmailData = {
      patientName: `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient',
      drugName: primaryItem?.drug_name || 'Your medication',
      genericName: primaryItem?.generic_name,
      strength: primaryItem?.drug_strength,
      currentQuantity: primaryItem?.quantity || 0,
      daysRemaining,
      lastFillDate: prescription.last_fill_date?.toLocaleDateString() || 'N/A',
      prescriptionNumber: prescription.prescription_number,
      refillUrl: `https://rapidcapsule.com/app/patient/prescriptions/${prescription._id}?action=refill`,
    };

    const emailHtml = refillReminderEmail(emailData);

    await this.generalHelpers.generateEmailAndSend({
      email: patient.email,
      subject: `Refill Reminder: ${primaryItem?.drug_name || 'Your Medication'}`,
      emailBody: emailHtml,
    });

    // Update reminder tracking
    prescription.refill_reminder_sent_at = new Date();
    prescription.refill_reminders_sent = (prescription.refill_reminders_sent || 0) + 1;
    await prescription.save();

    this.logger.log(`Refill reminder sent for prescription ${prescription.prescription_number}`);
  }

  /**
   * Send notification when refill becomes available
   */
  async sendRefillAvailableNotification(prescriptionId: string): Promise<void> {
    const prescription = await this.prescriptionModel
      .findById(prescriptionId)
      .populate('patient_id', 'email profile');

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const patient = prescription.patient_id as any;
    if (!patient?.email) return;

    const primaryItem = prescription.items[0];
    const refillsRemaining = prescription.refill_count - prescription.refills_used;

    const emailData: RefillAvailableEmailData = {
      patientName: `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient',
      drugName: primaryItem?.drug_name || 'Your medication',
      genericName: primaryItem?.generic_name,
      strength: primaryItem?.drug_strength,
      originalPrescriptionNumber: prescription.prescription_number,
      remainingRefills: refillsRemaining,
      expiryDate: prescription.prescription_valid_until?.toLocaleDateString(),
      refillUrl: `https://rapidcapsule.com/app/patient/prescriptions/${prescription._id}?action=refill`,
    };

    const emailHtml = refillAvailableEmail(emailData);

    await this.generalHelpers.generateEmailAndSend({
      email: patient.email,
      subject: `Your Refill is Ready: ${primaryItem?.drug_name || 'Medication'}`,
      emailBody: emailHtml,
    });

    this.logger.log(`Refill available notification sent for ${prescription.prescription_number}`);
  }

  /**
   * Send notification when prescription is expiring soon
   */
  async sendPrescriptionExpiringNotification(prescriptionId: string): Promise<void> {
    const prescription = await this.prescriptionModel
      .findById(prescriptionId)
      .populate('patient_id', 'email profile')
      .populate('specialist_id', 'profile');

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const patient = prescription.patient_id as any;
    const specialist = prescription.specialist_id as any;
    if (!patient?.email) return;

    const daysUntilExpiry = prescription.prescription_valid_until
      ? Math.ceil(
          (prescription.prescription_valid_until.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    const primaryItem = prescription.items[0];
    const refillsRemaining = prescription.refill_count - prescription.refills_used;
    const specialistName = specialist?.profile
      ? `Dr. ${specialist.profile.first_name || ''} ${specialist.profile.last_name || ''}`.trim()
      : 'Your doctor';

    const emailData: PrescriptionExpiringEmailData = {
      patientName: `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient',
      prescriptionNumber: prescription.prescription_number,
      drugName: primaryItem?.drug_name || 'Your medication',
      genericName: primaryItem?.generic_name,
      expiryDate: prescription.prescription_valid_until?.toLocaleDateString() || 'Soon',
      daysUntilExpiry,
      remainingRefills: refillsRemaining,
      specialistName,
      renewalUrl: 'https://rapidcapsule.com/app/patient/appointments',
    };

    const emailHtml = prescriptionExpiringEmail(emailData);

    await this.generalHelpers.generateEmailAndSend({
      email: patient.email,
      subject: `Prescription Expiring Soon: ${primaryItem?.drug_name || 'Medication'}`,
      emailBody: emailHtml,
    });

    this.logger.log(`Prescription expiring notification sent for ${prescription.prescription_number}`);
  }

  /**
   * Send notification when early refill is denied
   */
  async sendEarlyRefillDeniedNotification(
    prescriptionId: string,
    reason: string,
  ): Promise<void> {
    const prescription = await this.prescriptionModel
      .findById(prescriptionId)
      .populate('patient_id', 'email profile');

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const patient = prescription.patient_id as any;
    if (!patient?.email) return;

    const primaryItem = prescription.items[0];
    const daysUntilEligible = prescription.next_refill_date
      ? Math.ceil(
          (prescription.next_refill_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : 0;

    const emailData: EarlyRefillDeniedEmailData = {
      patientName: `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Patient',
      drugName: primaryItem?.drug_name || 'Your medication',
      genericName: primaryItem?.generic_name,
      lastFillDate: prescription.last_fill_date?.toLocaleDateString() || 'N/A',
      nextEligibleDate: prescription.next_refill_date?.toLocaleDateString() || 'Soon',
      daysUntilEligible,
      reason,
    };

    const emailHtml = earlyRefillDeniedEmail(emailData);

    await this.generalHelpers.generateEmailAndSend({
      email: patient.email,
      subject: 'Refill Request Update',
      emailBody: emailHtml,
    });

    this.logger.log(`Early refill denied notification sent for ${prescription.prescription_number}`);
  }

  /**
   * Get refill history for a prescription
   */
  async getRefillHistory(prescriptionId: string): Promise<RefillHistoryItem[]> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Find the original prescription if this is a refill
    const originalId = prescription.is_refill
      ? prescription.original_prescription_id
      : prescription._id;

    // Get all refills for this prescription
    const refills = await this.prescriptionModel
      .find({
        $or: [
          { _id: originalId },
          { original_prescription_id: originalId },
        ],
      })
      .sort({ created_at: 1 });

    return refills.map(refill => ({
      prescription_id: refill._id.toString(),
      prescription_number: refill.prescription_number,
      filled_at: refill.last_fill_date || refill.delivered_at || (refill as any).created_at,
      status: refill.status,
      total_amount: refill.total_amount,
    }));
  }

  /**
   * Get prescriptions due for refill reminders
   * Returns prescriptions where:
   * - is_refillable is true
   * - status is DELIVERED
   * - refills_remaining > 0
   * - next_refill_date is within reminderDays
   * - hasn't received a reminder in the last 24 hours
   */
  async getPrescriptionsDueForReminder(reminderDays = 3): Promise<SpecialistPrescriptionDocument[]> {
    const now = new Date();
    const reminderDate = new Date(now);
    reminderDate.setDate(reminderDate.getDate() + reminderDays);

    const twentyFourHoursAgo = new Date(now);
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return this.prescriptionModel.find({
      is_refillable: true,
      status: SpecialistPrescriptionStatus.DELIVERED,
      next_refill_date: { $lte: reminderDate, $gte: now },
      $expr: { $lt: ['$refills_used', '$refill_count'] }, // Has remaining refills
      $or: [
        { refill_reminder_sent_at: { $exists: false } },
        { refill_reminder_sent_at: { $lt: twentyFourHoursAgo } },
      ],
    });
  }

  /**
   * Get prescriptions expiring soon
   */
  async getPrescriptionsExpiringSoon(daysBeforeExpiry = 14): Promise<SpecialistPrescriptionDocument[]> {
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry);

    return this.prescriptionModel.find({
      is_refillable: true,
      status: SpecialistPrescriptionStatus.DELIVERED,
      prescription_valid_until: { $lte: expiryDate, $gte: now },
      $expr: { $lt: ['$refills_used', '$refill_count'] }, // Has remaining refills
    });
  }

  /**
   * Mark a prescription as delivered and set up refill tracking
   */
  async setupRefillTracking(
    prescriptionId: string,
    daysSupply: number,
    refillCount: number,
    prescriptionValidDays = 365,
  ): Promise<SpecialistPrescriptionDocument> {
    const prescription = await this.prescriptionModel.findById(prescriptionId);
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    const now = new Date();

    prescription.is_refillable = refillCount > 0;
    prescription.refill_count = refillCount;
    prescription.days_supply = daysSupply;
    prescription.last_fill_date = now;
    prescription.next_refill_date = this.calculateNextRefillDate(now, daysSupply);
    prescription.prescription_valid_until = new Date(
      now.getTime() + prescriptionValidDays * 24 * 60 * 60 * 1000
    );

    await prescription.save();

    this.logger.log(
      `Refill tracking set up for ${prescription.prescription_number}: ${refillCount} refills, ${daysSupply} days supply`
    );

    return prescription;
  }
}
