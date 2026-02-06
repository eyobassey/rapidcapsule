import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import {
  PharmacyOrder,
  PharmacyOrderDocument,
  PharmacyOrderStatus,
  PharmacyOrderPaymentStatus,
  PharmacyOrderType,
  DeliveryMethod,
  PrescriptionVerificationStatus,
} from '../entities/pharmacy-order.entity';
import { Drug, DrugDocument } from '../entities/drug.entity';
import { Pharmacy, PharmacyDocument } from '../entities/pharmacy.entity';
import { Inventory, InventoryDocument } from '../entities/inventory.entity';
import {
  CreatePharmacyOrderDto,
  CreateOTCOrderDto,
  CreatePrescriptionOrderDto,
  UpdatePharmacyOrderStatusDto,
  VerifyPrescriptionDto,
  ProcessPaymentDto,
  DispenseOrderDto,
  CancelOrderDto,
  RefundOrderDto,
  RateOrderDto,
  SearchPharmacyOrdersDto,
  GetPatientOrdersDto,
  GetPharmacyOrdersDto,
  CompletePickupDto,
  AssignDeliveryDto,
} from '../dto/pharmacy-order.dto';
import {
  create,
  findOne,
  updateOneAndReturn,
  countDocuments,
} from '../../../common/crud/crud';
import { InventoryService } from './inventory.service';
import { PharmacyService } from './pharmacy.service';
import { AbusePreventionService } from './abuse-prevention.service';
import { WalletsService } from '../../wallets/wallets.service';
import { PurchaseType } from '../enums';
import { SplitPaymentDto } from '../dto/pharmacy-order.dto';
import * as moment from 'moment';
import { PrescriptionNumberHelper } from '../../../common/helpers/prescription-number.helper';
import { GeneralHelpers } from '../../../common/helpers/general.helpers';
import { FileUploadHelper } from '../../../common/helpers/file-upload.helpers';
import { pharmacyRatingRequestEmail } from '../../../core/emails/mails/prescriptionEmails';
import { orderReadyForPickupEmail } from '../../../core/emails/mails/pickupEmails';
import { orderConfirmationEmail, OrderConfirmationEmailData } from '../../../core/emails/mails/orderConfirmationEmails';
import { OrderConfirmationPdfService, OrderConfirmationPdfData } from './order-confirmation-pdf.service';
import { OpenFDAService } from './openfda.service';
import {
  SpecialistPrescription,
  SpecialistPrescriptionDocument,
  SpecialistPrescriptionStatus,
  PrescriptionPaymentStatus,
} from '../../prescriptions/entities/specialist-prescription.entity';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadDocument,
} from '../entities/patient-prescription-upload.entity';
import { AccountingService } from '../../accounting/services/accounting.service';
import {
  AccountCode,
  EntryType,
  TransactionCategory,
} from '../../accounting/enums/account-codes.enum';
import { PaymentHandler } from '../../../common/external/payment/payment.handler';
import { PaymentsService } from '../../payments/payments.service';

@Injectable()
export class PharmacyOrderService {
  private readonly logger = new Logger(PharmacyOrderService.name);

  constructor(
    @InjectModel(PharmacyOrder.name)
    private readonly orderModel: Model<PharmacyOrderDocument>,
    @InjectModel(Drug.name)
    private readonly drugModel: Model<DrugDocument>,
    @InjectModel(Pharmacy.name)
    private readonly pharmacyModel: Model<PharmacyDocument>,
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(SpecialistPrescription.name)
    private readonly specialistPrescriptionModel: Model<SpecialistPrescriptionDocument>,
    @InjectModel(PatientPrescriptionUpload.name)
    private readonly patientUploadModel: Model<PatientPrescriptionUploadDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly inventoryService: InventoryService,
    private readonly pharmacyService: PharmacyService,
    @Inject(forwardRef(() => AbusePreventionService))
    private readonly abusePreventionService: AbusePreventionService,
    @Inject(forwardRef(() => WalletsService))
    private readonly walletsService: WalletsService,
    private readonly prescriptionNumberHelper: PrescriptionNumberHelper,
    private readonly generalHelpers: GeneralHelpers,
    private readonly orderConfirmationPdfService: OrderConfirmationPdfService,
    @Inject(forwardRef(() => OpenFDAService))
    private readonly openFDAService: OpenFDAService,
    private readonly fileUploadHelper: FileUploadHelper,
    private readonly accountingService: AccountingService,
    private readonly paymentHandler: PaymentHandler,
    private readonly paymentsService: PaymentsService,
  ) {}

  /**
   * Generate unique order number using the shared counter.
   * This ensures uniqueness across all prescription sources (specialist, pharmacy orders, etc.)
   * Format: RX-YYYYMMDD-0001
   */
  private async generateOrderNumber(): Promise<string> {
    return this.prescriptionNumberHelper.generatePrescriptionNumber();
  }

  /**
   * Generate pickup code
   */
  private generatePickupCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Sync payment status to linked specialist prescription.
   * When a pharmacy order is paid that was created from a specialist prescription,
   * update the specialist prescription's payment status and link the order.
   */
  private async syncPaymentToLinkedPrescription(
    order: PharmacyOrderDocument,
    paymentReference: string,
  ): Promise<void> {
    if (!order.specialist_prescription) {
      return; // No linked specialist prescription
    }

    try {
      const prescription = await this.specialistPrescriptionModel.findById(
        order.specialist_prescription,
      );

      if (!prescription) {
        this.logger.warn(
          `Linked specialist prescription ${order.specialist_prescription} not found for order ${order.order_number}`,
        );
        return;
      }

      // Update the specialist prescription with payment status and link
      await this.specialistPrescriptionModel.findByIdAndUpdate(
        order.specialist_prescription,
        {
          $set: {
            payment_status: PrescriptionPaymentStatus.PAID,
            paid_by: 'patient',
            paid_at: new Date(),
            payment_reference: paymentReference,
            linked_pharmacy_order: order._id,
            linked_pharmacy_order_number: order.order_number,
            linked_at: new Date(),
            status: SpecialistPrescriptionStatus.PAID,
          },
          $push: {
            status_history: {
              status: SpecialistPrescriptionStatus.PAID,
              changed_at: new Date(),
              note: `Patient paid via pharmacy checkout. Order: ${order.order_number}`,
            },
          },
        },
      );

      this.logger.log(
        `Synced payment status to specialist prescription ${prescription.prescription_number} from order ${order.order_number}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync payment to linked prescription: ${error.message}`,
        error.stack,
      );
      // Don't throw - order payment succeeded, this is a secondary operation
    }
  }

  /**
   * Update patient prescription upload usage when used in an order.
   * This tracks that the prescription has been used for an order.
   */
  private async updatePatientUploadUsage(
    order: PharmacyOrderDocument,
  ): Promise<void> {
    if (!order.prescription) {
      return; // No linked patient prescription upload
    }

    try {
      // Update the patient prescription upload with order linkage
      await this.patientUploadModel.findByIdAndUpdate(
        order.prescription,
        {
          $push: {
            used_in_orders: order._id,
          },
          $inc: {
            usage_count: 1,
          },
        },
      );

      this.logger.log(
        `Updated patient prescription upload ${order.prescription} usage for order ${order.order_number}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update patient prescription upload usage: ${error.message}`,
        error.stack,
      );
      // Don't throw - order payment succeeded, this is a secondary operation
    }
  }

  /**
   * Create a new pharmacy order
   */
  async createOrder(
    createOrderDto: CreatePharmacyOrderDto,
    patientId: Types.ObjectId,
  ): Promise<PharmacyOrderDocument> {
    // Verify pharmacy exists and is accepting orders
    const pharmacy = await this.pharmacyService.findById(createOrderDto.pharmacy);
    if (!pharmacy.is_online || pharmacy.is_suspended) {
      throw new BadRequestException('Pharmacy is not currently accepting orders');
    }

    // Validate cart against abuse prevention limits
    await this.abusePreventionService.validateBeforeOrder(
      patientId,
      createOrderDto.items,
    );

    // Process items and calculate pricing
    const processedItems = await this.processOrderItems(
      createOrderDto.items,
      createOrderDto.pharmacy,
    );

    // Determine order type
    const hasPrescriptionItems = processedItems.some(
      (item) => item.requires_prescription,
    );
    const hasOTCItems = processedItems.some(
      (item) => !item.requires_prescription,
    );

    let orderType: PharmacyOrderType;
    if (hasPrescriptionItems && hasOTCItems) {
      orderType = PharmacyOrderType.MIXED;
    } else if (hasPrescriptionItems) {
      orderType = PharmacyOrderType.PRESCRIPTION;
    } else {
      orderType = PharmacyOrderType.OTC;
    }

    // Validate prescription for prescription items
    // Either uploaded prescription or specialist prescription is acceptable
    if (hasPrescriptionItems && !createOrderDto.prescription && !createOrderDto.specialist_prescription) {
      throw new BadRequestException(
        'Prescription is required for prescription-only medications',
      );
    }

    // Calculate totals
    const subtotal = processedItems.reduce(
      (sum, item) => sum + item.total_price,
      0,
    );
    const deliveryFee =
      createOrderDto.delivery_method === DeliveryMethod.DELIVERY
        ? pharmacy.delivery_fee || 0
        : 0;
    const totalAmount = subtotal + deliveryFee;

    // Create order
    const orderData = {
      patient: patientId,
      pharmacy: new Types.ObjectId(createOrderDto.pharmacy),
      prescription: createOrderDto.prescription
        ? new Types.ObjectId(createOrderDto.prescription)
        : undefined,
      specialist_prescription: createOrderDto.specialist_prescription
        ? new Types.ObjectId(createOrderDto.specialist_prescription)
        : undefined,
      order_number: await this.generateOrderNumber(),
      order_type: orderType,
      status: PharmacyOrderStatus.PENDING,
      items: processedItems,
      subtotal,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      delivery_method: createOrderDto.delivery_method || DeliveryMethod.DELIVERY,
      delivery_address: createOrderDto.delivery_address
        ? {
            ...createOrderDto.delivery_address,
            coordinates:
              createOrderDto.delivery_address.latitude &&
              createOrderDto.delivery_address.longitude
                ? {
                    type: 'Point',
                    coordinates: [
                      createOrderDto.delivery_address.longitude,
                      createOrderDto.delivery_address.latitude,
                    ],
                  }
                : undefined,
          }
        : undefined,
      patient_notes: createOrderDto.patient_notes,
      special_instructions: createOrderDto.special_instructions,
      discount_code: createOrderDto.discount_code,
      prescription_verification_status: hasPrescriptionItems
        ? PrescriptionVerificationStatus.PENDING
        : undefined,
      pickup_code:
        createOrderDto.delivery_method === DeliveryMethod.PICKUP
          ? this.generatePickupCode()
          : undefined,
      status_history: [
        {
          status: PharmacyOrderStatus.PENDING,
          timestamp: new Date(),
        },
      ],
      created_by: patientId,
      updated_by: patientId,
    };

    const order = await create(this.orderModel, orderData);

    this.logger.log(
      `Order ${order.order_number} created by patient ${patientId}`,
    );
    return order;
  }

  /**
   * Create OTC-only order (no prescription required)
   */
  async createOTCOrder(
    createOTCDto: CreateOTCOrderDto,
    patientId: Types.ObjectId,
  ): Promise<PharmacyOrderDocument> {
    // Verify all items are OTC
    for (const item of createOTCDto.items) {
      const drug = await findOne(this.drugModel, {
        _id: new Types.ObjectId(item.drug),
      });
      if (!drug) {
        throw new NotFoundException(`Drug ${item.drug} not found`);
      }
      if (
        ![
          PurchaseType.OTC_GENERAL,
          PurchaseType.OTC_RESTRICTED,
          PurchaseType.PHARMACY_ONLY,
        ].includes(drug.purchase_type)
      ) {
        throw new BadRequestException(
          `${drug.name} requires a prescription and cannot be purchased as OTC`,
        );
      }
    }

    return this.createOrder(
      {
        pharmacy: createOTCDto.pharmacy,
        items: createOTCDto.items,
        delivery_method: createOTCDto.delivery_method,
        delivery_address: createOTCDto.delivery_address,
        patient_notes: createOTCDto.patient_notes,
        discount_code: createOTCDto.discount_code,
      },
      patientId,
    );
  }

  /**
   * Create prescription order
   */
  async createPrescriptionOrder(
    createPrescriptionDto: CreatePrescriptionOrderDto,
    patientId: Types.ObjectId,
  ): Promise<PharmacyOrderDocument> {
    return this.createOrder(
      {
        pharmacy: createPrescriptionDto.pharmacy,
        prescription: createPrescriptionDto.prescription,
        specialist_prescription: createPrescriptionDto.specialist_prescription,
        items: createPrescriptionDto.items,
        delivery_method: createPrescriptionDto.delivery_method,
        delivery_address: createPrescriptionDto.delivery_address,
        patient_notes: createPrescriptionDto.patient_notes,
        special_instructions: createPrescriptionDto.special_instructions,
      },
      patientId,
    );
  }

  /**
   * Process order items - validate drugs, check inventory, calculate prices
   */
  private async processOrderItems(
    items: { drug: string; quantity: number; dosage_instructions?: string; duration_days?: number; batch_id?: string }[],
    pharmacyId: string,
  ): Promise<any[]> {
    const processedItems: any[] = [];

    for (const item of items) {
      const drug = await findOne(this.drugModel, {
        _id: new Types.ObjectId(item.drug),
        is_active: true,
      });

      if (!drug) {
        throw new NotFoundException(`Drug ${item.drug} not found`);
      }

      // Check inventory at pharmacy
      const inventoryResult = await this.inventoryService.getAvailableStock(
        pharmacyId,
        item.drug,
      );

      if (inventoryResult.totalAvailable < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${drug.name}. Available: ${inventoryResult.totalAvailable}`,
        );
      }

      // Get price from stock batch, inventory, or drug (in order of priority)
      let unitPrice = 0;
      let discountPercentage = 0;

      // Check stockbatchentities for the batch price
      const StockBatchCollection = this.connection.collection('stockbatchentities');
      let activeBatch: any = null;

      // If a specific batch_id was provided, use that batch
      if (item.batch_id) {
        activeBatch = await StockBatchCollection.findOne({
          _id: new Types.ObjectId(item.batch_id),
          drug_id: new Types.ObjectId(item.drug),
          status: 'active',
          quantity_available: { $gt: 0 },
        });
      }

      // If no specific batch or batch not found, find any active batch
      if (!activeBatch) {
        activeBatch = await StockBatchCollection.findOne({
          drug_id: new Types.ObjectId(item.drug),
          status: 'active',
          quantity_available: { $gt: 0 },
          $or: [{ no_expiry: true }, { expiry_date: { $gt: new Date() } }],
        });
      }

      if (activeBatch?.selling_price_override) {
        unitPrice = activeBatch.selling_price_override;
        discountPercentage = activeBatch.discount_percentage || 0;
      } else {
        // Fall back to inventory price
        const inventory = await findOne(this.inventoryModel, {
          pharmacy: new Types.ObjectId(pharmacyId),
          drug: new Types.ObjectId(item.drug),
          is_active: true,
          is_available_for_sale: true,
        });

        unitPrice = inventory?.selling_price || drug.selling_price || 0;
        discountPercentage = inventory?.discount_percentage || 0;
      }
      const discountAmount = (unitPrice * discountPercentage) / 100;
      const finalUnitPrice = unitPrice - discountAmount;
      const totalPrice = finalUnitPrice * item.quantity;

      // Get manufacturer from batch or drug - can be string or ObjectId reference
      let manufacturerName = null;
      const rawManufacturer = activeBatch?.manufacturer || drug.manufacturer || null;
      if (rawManufacturer) {
        // Check if it's an ObjectId (either ObjectId instance or valid ObjectId string)
        const isObjectId = rawManufacturer instanceof Types.ObjectId ||
          (typeof rawManufacturer === 'string' && /^[a-f\d]{24}$/i.test(rawManufacturer));

        if (isObjectId) {
          const ManufacturerCollection = this.connection.collection('manufacturerentities');
          try {
            const manufacturerId = typeof rawManufacturer === 'string'
              ? new Types.ObjectId(rawManufacturer)
              : rawManufacturer;
            const manufacturerDoc = await ManufacturerCollection.findOne({ _id: manufacturerId });
            manufacturerName = manufacturerDoc?.name || null;
          } catch {
            manufacturerName = null;
          }
        } else {
          // It's already a string name
          manufacturerName = rawManufacturer;
        }
      }

      // Resolve dosage_form to its name - always stored as ObjectId reference
      let dosageFormName = null;
      if (drug.dosage_form) {
        const DosageFormCollection = this.connection.collection('dosageformentities');
        try {
          const dosageFormId = drug.dosage_form instanceof Types.ObjectId
            ? drug.dosage_form
            : new Types.ObjectId(drug.dosage_form);
          const dosageFormDoc = await DosageFormCollection.findOne({ _id: dosageFormId });
          dosageFormName = dosageFormDoc?.name || null;
        } catch {
          // If conversion fails, it might already be the name (shouldn't happen based on data)
          dosageFormName = typeof drug.dosage_form === 'string' ? drug.dosage_form : null;
        }
      }

      processedItems.push({
        drug: new Types.ObjectId(item.drug),
        drug_name: drug.name,
        generic_name: drug.generic_name,
        strength: drug.strength,
        dosage_form: dosageFormName,
        manufacturer: manufacturerName,
        quantity: item.quantity,
        unit_price: finalUnitPrice,
        total_price: totalPrice,
        discount_applied: discountAmount * item.quantity,
        requires_prescription: drug.requires_prescription,
        prescription_verified: false,
        dosage_instructions: item.dosage_instructions,
        duration_days: item.duration_days,
        refills_remaining: 0,
      });
    }

    return processedItems;
  }

  /**
   * Find order by ID
   */
  async findById(id: Types.ObjectId | string): Promise<PharmacyOrderDocument> {
    const order = await this.orderModel
      .findById(new Types.ObjectId(id))
      .populate('patient', 'profile.first_name profile.last_name profile.contact')
      .populate('pharmacy', 'name address phone')
      .populate('items.drug', 'name generic_name strength dosage_form manufacturer images')
      .exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Transform order to add drug_image to each item from populated drug
    const orderObj = order.toObject({ virtuals: true });
    if (orderObj.items && Array.isArray(orderObj.items)) {
      orderObj.items = orderObj.items.map((item: any) => {
        // Get primary image from populated drug
        let drugImage = null;
        if (item.drug && item.drug.images && item.drug.images.length > 0) {
          const primaryImage = item.drug.images.find((img: any) => img.is_primary);
          drugImage = primaryImage ? primaryImage.url : item.drug.images[0].url;
        }
        return {
          ...item,
          drug_image: drugImage,
          manufacturer: item.drug?.manufacturer || item.manufacturer,
        };
      });
    }

    // Return the transformed object (cast back to document type for compatibility)
    return orderObj as unknown as PharmacyOrderDocument;
  }

  /**
   * Get a fresh presigned URL for the order confirmation PDF
   * @param orderId - The order ID
   * @param patientId - The patient ID (for authorization)
   * @param expiresIn - Expiration time in seconds (default: 1 hour)
   */
  async getOrderPdfPresignedUrl(
    orderId: Types.ObjectId | string,
    patientId: Types.ObjectId | string,
    expiresIn: number = 3600,
  ): Promise<{ presigned_url: string; expires_in: number }> {
    const order = await this.orderModel.findById(new Types.ObjectId(orderId)).exec();

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Verify ownership
    if (order.patient.toString() !== patientId.toString()) {
      throw new ForbiddenException('You do not have access to this order');
    }

    if (!order.confirmation_pdf_url) {
      throw new NotFoundException('Order confirmation PDF not found');
    }

    const presignedUrl = await this.fileUploadHelper.getPresignedUrl(
      order.confirmation_pdf_url,
      expiresIn,
    );

    return { presigned_url: presignedUrl, expires_in: expiresIn };
  }

  /**
   * Find order by order number
   */
  async findByOrderNumber(
    orderNumber: string,
  ): Promise<PharmacyOrderDocument | null> {
    return this.orderModel
      .findOne({ order_number: orderNumber })
      .populate('patient', 'profile.first_name profile.last_name')
      .populate('pharmacy', 'name address')
      .exec();
  }

  /**
   * Get patient's orders
   */
  async getPatientOrders(
    patientId: Types.ObjectId,
    getOrdersDto: GetPatientOrdersDto,
  ): Promise<{ orders: PharmacyOrderDocument[]; total: number }> {
    const { status, page = 1, limit = 20 } = getOrdersDto;

    const filter: any = {
      patient: patientId,
      is_active: true,
    };

    if (status) {
      filter.status = status;
    }

    const offset = (page - 1) * limit;
    const total = await countDocuments(this.orderModel, filter);

    const orders = await this.orderModel
      .find(filter)
      .populate('pharmacy', 'name address phone')
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .exec();

    return { orders, total };
  }

  /**
   * Get pharmacy's orders
   */
  async getPharmacyOrders(
    pharmacyId: Types.ObjectId | string,
    getOrdersDto: GetPharmacyOrdersDto,
  ): Promise<{ orders: PharmacyOrderDocument[]; total: number }> {
    const { status, pending_verification, ready_to_dispense, page = 1, limit = 20 } =
      getOrdersDto;

    const filter: any = {
      pharmacy: new Types.ObjectId(pharmacyId),
      is_active: true,
    };

    if (status) {
      filter.status = status;
    }

    if (pending_verification) {
      filter.prescription_verification_status =
        PrescriptionVerificationStatus.PENDING;
    }

    if (ready_to_dispense) {
      filter.payment_status = PharmacyOrderPaymentStatus.PAID;
      filter.$or = [
        { prescription_verification_status: PrescriptionVerificationStatus.VERIFIED },
        { prescription_verification_status: { $exists: false } },
      ];
      filter.status = { $in: [PharmacyOrderStatus.CONFIRMED, PharmacyOrderStatus.PROCESSING] };
    }

    const offset = (page - 1) * limit;
    const total = await countDocuments(this.orderModel, filter);

    const orders = await this.orderModel
      .find(filter)
      .populate('patient', 'profile.first_name profile.last_name profile.contact')
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .exec();

    return { orders, total };
  }

  /**
   * Update order status
   */
  async updateStatus(
    orderId: Types.ObjectId | string,
    updateStatusDto: UpdatePharmacyOrderStatusDto,
    userId: Types.ObjectId,
  ): Promise<PharmacyOrderDocument> {
    const order = await this.findById(orderId);

    // Validate status transition
    this.validateStatusTransition(order.status, updateStatusDto.status);

    const updatedOrder = await updateOneAndReturn(
      this.orderModel,
      { _id: order._id },
      {
        status: updateStatusDto.status,
        updated_by: userId,
        ...(updateStatusDto.status === PharmacyOrderStatus.READY_FOR_PICKUP && {
          ready_for_pickup_at: new Date(),
          pickup_deadline: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        }),
        ...(updateStatusDto.status === PharmacyOrderStatus.DELIVERED && {
          actual_delivery_date: new Date(),
        }),
      },
    );

    // Send appropriate emails based on new status
    if (updateStatusDto.status === PharmacyOrderStatus.READY_FOR_PICKUP) {
      this.sendReadyForPickupEmail(order, updatedOrder);
    }

    if (updateStatusDto.status === PharmacyOrderStatus.DELIVERED) {
      this.sendRatingRequestEmail(order);
    }

    this.logger.log(`Order ${order.order_number} status updated to ${updateStatusDto.status}`);
    return updatedOrder;
  }

  /**
   * Send rating request email to patient after order delivery
   */
  private async sendRatingRequestEmail(order: PharmacyOrderDocument): Promise<void> {
    try {
      // Get patient info
      const UsersCollection = this.connection.collection('users');
      const patientId = (order.patient as any)?._id || order.patient;
      const patient = await UsersCollection.findOne(
        { _id: new Types.ObjectId(patientId) },
        { projection: { email: 1, 'profile.first_name': 1, 'profile.last_name': 1, 'profile.contact.email': 1 } },
      );

      const patientEmail = patient?.email || patient?.profile?.contact?.email;
      if (!patientEmail) {
        this.logger.warn(`Cannot send rating email for order ${order.order_number}: Patient email not found`);
        return;
      }

      // Get pharmacy info
      const pharmacyId = (order.pharmacy as any)?._id || order.pharmacy;
      const pharmacy = await this.pharmacyModel.findById(pharmacyId).select('name').exec();

      const patientName = `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Valued Customer';
      const pharmacyName = (pharmacy as any)?.name || 'Rapid Capsule Pharmacy';
      const deliveryDate = moment().format('MMMM D, YYYY');

      // Prepare items list
      const items = order.items.map(item => ({
        drug_name: item.drug_name,
        quantity: item.quantity,
      }));

      // Generate rating URL
      const ratingUrl = `https://rapidcapsule.com/app/patient/orders/${order._id}/rate`;

      const emailBody = pharmacyRatingRequestEmail({
        patientName,
        orderNumber: order.order_number,
        pharmacyName,
        items,
        deliveryDate,
        ratingUrl,
      });

      this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject: `Rate Your Experience - Order #${order.order_number}`,
        emailBody,
      });

      // Track that the rating request email was sent
      await this.orderModel.updateOne(
        { _id: order._id },
        { rating_request_sent_at: new Date() },
      );

      this.logger.log(`Rating request email sent for order ${order.order_number} to ${patientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send rating request email for order ${order.order_number}: ${error.message}`);
    }
  }

  /**
   * Send ready for pickup email to patient
   */
  private async sendReadyForPickupEmail(
    order: PharmacyOrderDocument,
    updatedOrder: PharmacyOrderDocument,
  ): Promise<void> {
    try {
      // Get patient info
      const UsersCollection = this.connection.collection('users');
      const patientId = (order.patient as any)?._id || order.patient;
      const patient = await UsersCollection.findOne(
        { _id: new Types.ObjectId(patientId) },
        { projection: { email: 1, 'profile.first_name': 1, 'profile.last_name': 1, 'profile.contact.email': 1 } },
      );

      const patientEmail = patient?.email || patient?.profile?.contact?.email;
      if (!patientEmail) {
        this.logger.warn(`Cannot send pickup ready email for order ${order.order_number}: Patient email not found`);
        return;
      }

      // Get pharmacy info
      const pharmacyId = (order.pharmacy as any)?._id || order.pharmacy;
      const pharmacy = await this.pharmacyModel.findById(pharmacyId).exec();

      const patientName = `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Valued Customer';
      const pharmacyName = (pharmacy as any)?.name || 'Rapid Capsule Pharmacy';
      const pharmacyAddress = (pharmacy as any)?.address || '';
      const pharmacyPhone = (pharmacy as any)?.phone || '';

      // Prepare items list
      const items = order.items.map(item => ({
        drug_name: item.drug_name,
        quantity: item.quantity,
      }));

      const emailBody = orderReadyForPickupEmail({
        patientName,
        prescriptionNumber: order.order_number,
        pickupCode: updatedOrder.pickup_code || order.pickup_code || 'N/A',
        pickupPharmacyName: pharmacyName,
        pickupPharmacyAddress: pharmacyAddress,
        pickupPharmacyPhone: pharmacyPhone,
        items,
        totalAmount: order.total_amount,
        currency: 'NGN',
      });

      this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject: `Your Order is Ready for Pickup - ${order.order_number}`,
        emailBody,
      });

      this.logger.log(`Ready for pickup email sent for order ${order.order_number} to ${patientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send ready for pickup email for order ${order.order_number}: ${error.message}`);
    }
  }

  /**
   * Send order confirmation email and generate PDF after successful payment
   */
  async sendOrderConfirmationEmail(
    order: PharmacyOrderDocument,
    drugInteractions?: any[],
    drugSafetyInfo?: any[],
    verificationScore?: number,
  ): Promise<void> {
    try {
      // Get patient info
      const UsersCollection = this.connection.collection('users');
      const patientId = (order.patient as any)?._id || order.patient;
      const patient = await UsersCollection.findOne(
        { _id: new Types.ObjectId(patientId) },
        { projection: { 'profile.first_name': 1, 'profile.last_name': 1, 'profile.contact': 1 } },
      );

      // Email is stored at profile.contact.email
      const patientEmail = patient?.profile?.contact?.email;
      if (!patientEmail) {
        this.logger.warn(`Cannot send confirmation email for order ${order.order_number}: Patient email not found`);
        return;
      }

      // Get pharmacy info
      const pharmacyId = (order.pharmacy as any)?._id || order.pharmacy;
      const pharmacy = await this.pharmacyModel.findById(pharmacyId).exec();

      const patientName = `${patient.profile?.first_name || ''} ${patient.profile?.last_name || ''}`.trim() || 'Valued Customer';
      const pharmacyName = (pharmacy as any)?.name || 'Rapid Capsules Pharmacy';
      const pharmacyAddress = (pharmacy as any)?.address || '';
      const pharmacyPhone = (pharmacy as any)?.phone || '';

      // Determine if pharmacist review is needed
      const requiresPharmacistReview = verificationScore ? verificationScore < 90 : false;

      // Update order with interaction and safety data
      const updateData: any = {
        confirmation_email_sent_at: new Date(),
      };

      if (drugInteractions && drugInteractions.length > 0) {
        updateData.drug_interactions = drugInteractions;
        updateData.has_interaction_warnings = true;
      }

      if (drugSafetyInfo && drugSafetyInfo.length > 0) {
        updateData.drug_safety_info = drugSafetyInfo;
      }

      if (verificationScore !== undefined) {
        updateData.verification_score = verificationScore;
        updateData.requires_pharmacist_review = requiresPharmacistReview;
        if (requiresPharmacistReview) {
          updateData.pharmacist_review_reason = 'Prescription verification score below threshold';
        }
      }

      // Prepare PDF data
      const pdfData: OrderConfirmationPdfData = {
        order_number: order.order_number,
        order_type: order.order_type,
        created_at: order['created_at'] || new Date(),
        status: order.status,
        patient: {
          full_name: patientName,
          email: patientEmail,
          phone: patient.profile?.contact?.phone?.number || '',
        },
        pharmacy: {
          name: pharmacyName,
          address: pharmacyAddress,
          phone: pharmacyPhone,
        },
        items: order.items.map(item => ({
          drug_name: item.drug_name,
          generic_name: item.generic_name,
          strength: item.strength,
          dosage_form: item.dosage_form,
          manufacturer: item.manufacturer,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          requires_prescription: item.requires_prescription,
          dosage_instructions: item.dosage_instructions,
        })),
        subtotal: order.subtotal,
        discount_amount: order.discount_amount || 0,
        delivery_fee: order.delivery_fee || 0,
        total_amount: order.total_amount,
        currency: 'NGN',
        payment_method: order.payment_method || 'CARD',
        wallet_amount_paid: order.wallet_amount_paid,
        card_amount_paid: order.card_amount_paid,
        paid_at: order.paid_at,
        delivery_method: order.delivery_method,
        delivery_address: order.delivery_address ? {
          recipient_name: order.delivery_address.recipient_name,
          address_line1: order.delivery_address.address_line1,
          address_line2: order.delivery_address.address_line2,
          city: order.delivery_address.city,
          state: order.delivery_address.state,
          phone: order.delivery_address.phone,
        } : undefined,
        estimated_delivery_date: order.estimated_delivery_date,
        pickup_code: order.pickup_code,
        verification_score: verificationScore,
        requires_pharmacist_review: requiresPharmacistReview,
        drug_interactions: drugInteractions?.map(i => ({
          drug1_name: i.drug1_name,
          drug2_name: i.drug2_name,
          severity: i.severity,
          description: i.description,
          recommendation: i.recommendation,
        })),
        has_interaction_warnings: drugInteractions && drugInteractions.length > 0,
        drug_safety_info: drugSafetyInfo?.map(s => ({
          drug_name: s.drug_name,
          ai_summary: s.ai_summary,
          boxed_warning: s.boxed_warning,
        })),
      };

      // Generate PDF
      let pdfPresignedUrl: string | undefined;
      try {
        const pdfResult = await this.orderConfirmationPdfService.generateAndUploadPdf(pdfData);
        updateData.confirmation_pdf_url = pdfResult.pdf_url;
        updateData.confirmation_pdf_hash = pdfResult.pdf_hash;
        // Use presigned URL for email (valid for 7 days)
        pdfPresignedUrl = pdfResult.pdf_presigned_url;
        this.logger.log(`Order confirmation PDF generated for ${order.order_number}`);
      } catch (pdfError) {
        this.logger.error(`Failed to generate PDF for order ${order.order_number}: ${pdfError.message}`);
      }

      // Update order with all the data
      await this.orderModel.updateOne({ _id: order._id }, { $set: updateData });

      // Prepare email data
      const emailData: OrderConfirmationEmailData = {
        patientName,
        orderNumber: order.order_number,
        orderType: order.order_type,
        orderDate: moment(order['created_at'] || new Date()).format('MMMM D, YYYY [at] h:mm A'),
        items: order.items.map(item => ({
          drug_name: item.drug_name,
          generic_name: item.generic_name,
          strength: item.strength,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          requires_prescription: item.requires_prescription,
          dosage_instructions: item.dosage_instructions,
        })),
        subtotal: order.subtotal,
        discountAmount: order.discount_amount || 0,
        deliveryFee: order.delivery_fee || 0,
        totalAmount: order.total_amount,
        currency: 'NGN',
        paymentMethod: order.payment_method || 'CARD',
        walletAmountPaid: order.wallet_amount_paid,
        cardAmountPaid: order.card_amount_paid,
        deliveryMethod: order.delivery_method,
        deliveryAddress: order.delivery_address ? {
          recipientName: order.delivery_address.recipient_name,
          addressLine1: order.delivery_address.address_line1,
          addressLine2: order.delivery_address.address_line2,
          city: order.delivery_address.city,
          state: order.delivery_address.state,
          phone: order.delivery_address.phone,
        } : undefined,
        estimatedDeliveryDate: order.estimated_delivery_date
          ? moment(order.estimated_delivery_date).format('MMMM D, YYYY')
          : undefined,
        pickupCode: order.pickup_code,
        pharmacyName,
        pharmacyAddress,
        pharmacyPhone,
        verificationScore,
        requiresPharmacistReview,
        drugInteractions: drugInteractions?.map(i => ({
          drug1Name: i.drug1_name,
          drug2Name: i.drug2_name,
          severity: i.severity,
          description: i.description,
          recommendation: i.recommendation,
        })),
        hasInteractionWarnings: drugInteractions && drugInteractions.length > 0,
        drugSafetyInfo: drugSafetyInfo?.map(s => ({
          drugName: s.drug_name,
          keyPoints: s.ai_summary?.key_points,
          commonSideEffects: s.ai_summary?.common_side_effects,
          seriousWarnings: s.ai_summary?.serious_warnings,
        })),
        orderDetailsUrl: `https://rapidcapsule.com/app/patient/pharmacy/orders/${order._id}`,
        pdfDownloadUrl: pdfPresignedUrl,
      };

      const emailBody = orderConfirmationEmail(emailData);

      // Send email
      await this.generalHelpers.generateEmailAndSend({
        email: patientEmail,
        subject: `Order Confirmed - ${order.order_number}`,
        emailBody,
      });

      this.logger.log(`Order confirmation email sent for ${order.order_number} to ${patientEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation email for ${order.order_number}: ${error.message}`, error.stack);
    }
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: PharmacyOrderStatus,
    newStatus: PharmacyOrderStatus,
  ): void {
    const validTransitions: Record<PharmacyOrderStatus, PharmacyOrderStatus[]> = {
      [PharmacyOrderStatus.PENDING]: [
        PharmacyOrderStatus.CONFIRMED,
        PharmacyOrderStatus.CANCELLED,
      ],
      [PharmacyOrderStatus.CONFIRMED]: [
        PharmacyOrderStatus.PROCESSING,
        PharmacyOrderStatus.CANCELLED,
      ],
      [PharmacyOrderStatus.PROCESSING]: [
        PharmacyOrderStatus.READY_FOR_PICKUP,
        PharmacyOrderStatus.OUT_FOR_DELIVERY,
        PharmacyOrderStatus.CANCELLED,
      ],
      [PharmacyOrderStatus.READY_FOR_PICKUP]: [
        PharmacyOrderStatus.COMPLETED,
        PharmacyOrderStatus.CANCELLED,
      ],
      [PharmacyOrderStatus.OUT_FOR_DELIVERY]: [
        PharmacyOrderStatus.DELIVERED,
        PharmacyOrderStatus.CANCELLED,
      ],
      [PharmacyOrderStatus.DELIVERED]: [PharmacyOrderStatus.COMPLETED],
      [PharmacyOrderStatus.COMPLETED]: [PharmacyOrderStatus.REFUNDED],
      [PharmacyOrderStatus.CANCELLED]: [],
      [PharmacyOrderStatus.REFUNDED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Verify prescription for order
   */
  async verifyPrescription(
    orderId: Types.ObjectId | string,
    verifyDto: VerifyPrescriptionDto,
    pharmacistId: Types.ObjectId,
  ): Promise<PharmacyOrderDocument> {
    const order = await this.findById(orderId);

    if (!order.prescription) {
      throw new BadRequestException('This order does not have a prescription');
    }

    const updateData: any = {
      prescription_verification_status: verifyDto.verification_status,
      verification_notes: verifyDto.verification_notes,
      verified_by: pharmacistId,
      verified_at: new Date(),
      updated_by: pharmacistId,
    };

    if (verifyDto.verification_status === PrescriptionVerificationStatus.REJECTED) {
      updateData.rejection_reason = verifyDto.rejection_reason;
    }

    if (verifyDto.verification_status === PrescriptionVerificationStatus.VERIFIED) {
      // Mark all prescription items as verified
      const updatedItems = order.items.map((item) => ({
        ...item,
        prescription_verified: item.requires_prescription ? true : item.prescription_verified,
      }));
      updateData.items = updatedItems;
    }

    const updatedOrder = await updateOneAndReturn(
      this.orderModel,
      { _id: order._id },
      updateData,
    );

    this.logger.log(
      `Prescription for order ${order.order_number} ${verifyDto.verification_status.toLowerCase()}`,
    );
    return updatedOrder;
  }

  /**
   * Process payment for order
   */
  async processPayment(
    orderId: Types.ObjectId | string,
    paymentDto: ProcessPaymentDto,
    userId: Types.ObjectId,
  ): Promise<PharmacyOrderDocument> {
    const order = await this.findById(orderId);

    if (order.payment_status === PharmacyOrderPaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    // For card payment verification from Paystack redirect, use order total if amount is 0
    const paymentAmount = paymentDto.amount > 0 ? paymentDto.amount : order.total_amount;

    if (paymentAmount < order.total_amount) {
      throw new BadRequestException('Payment amount is less than order total');
    }

    const updatedOrder = await updateOneAndReturn(
      this.orderModel,
      { _id: order._id },
      {
        payment_status: PharmacyOrderPaymentStatus.PAID,
        payment_method: paymentDto.payment_method,
        payment_reference: paymentDto.payment_reference,
        paid_at: new Date(),
        amount_paid: paymentAmount,
        status: PharmacyOrderStatus.CONFIRMED,
        updated_by: userId,
      },
    );

    // Record card payment in chart of accounts (double-entry)
    // DEBIT: Cash/Paystack (Asset increases - money received)
    // CREDIT: Payable to Pharmacy (Liability increases - we owe the pharmacy)
    if (paymentDto.payment_method === 'CARD') {
      try {
        // Get pharmacy info for to_name field
        const pharmacyId = (order.pharmacy as any)?._id || order.pharmacy;
        const PharmaciesCollection = this.connection.collection('pharmacies');
        const pharmacy = await PharmaciesCollection.findOne(
          { _id: new Types.ObjectId(pharmacyId.toString()) },
          { projection: { name: 1 } },
        );
        const pharmacyName = pharmacy?.name || 'Unknown Pharmacy';

        await this.accountingService.createAndPostBatch({
          category: TransactionCategory.PHARMACY_ORDER_PAYMENT,
          description: `Pharmacy order card payment: ${order.order_number}`,
          entries: [
            {
              account_code: AccountCode.CASH_PAYSTACK,
              entry_type: EntryType.DEBIT,
              amount: paymentAmount,
              description: `Card payment received - ${order.order_number}`,
              user_id: userId,
            },
            {
              account_code: AccountCode.PAYABLE_PHARMACY,
              entry_type: EntryType.CREDIT,
              amount: paymentAmount,
              description: `Payable to pharmacy - ${order.order_number}`,
              user_id: userId,
            },
          ],
          from_user: userId,
          to_name: pharmacyName,
          reference_type: 'PharmacyOrder',
          reference_id: order._id,
          external_reference: paymentDto.payment_reference,
          performed_by: userId,
          metadata: {
            order_number: order.order_number,
            pharmacy_id: pharmacyId?.toString(),
            pharmacy_name: pharmacyName,
            payment_method: paymentDto.payment_method,
          },
        });
        this.logger.log(`Accounting entries recorded for card payment - ${order.order_number}`);
      } catch (accountingError) {
        this.logger.error(
          `Failed to record accounting entries for order ${order.order_number}: ${accountingError.message}`,
        );
        // Don't fail the payment - accounting can be reconciled later
      }

      // Create a wallet transaction record for visibility in transaction history
      try {
        const WalletTxnCollection = this.connection.collection('wallettransactions');
        const WalletsCollection = this.connection.collection('wallets');

        // Find or create a wallet for the user
        let wallet = await WalletsCollection.findOne({ userId: userId });
        if (!wallet) {
          // Create a minimal wallet for transaction tracking
          const result = await WalletsCollection.insertOne({
            userId: userId,
            available_balance: 0,
            ledger_balance: 0,
            created_at: new Date(),
            updated_at: new Date(),
          });
          wallet = { _id: result.insertedId };
        }

        // Create transaction record (does NOT affect balance - just for history)
        await WalletTxnCollection.insertOne({
          walletId: wallet._id,
          userId: userId,
          amount: paymentAmount,
          type: 'Debit',
          narration: `Pharmacy Order ${order.order_number} - Card Payment`,
          reference: paymentDto.payment_reference,
          created_at: new Date(),
          updated_at: new Date(),
        });
        this.logger.log(`Wallet transaction record created for card payment - ${order.order_number}`);
      } catch (txnError) {
        this.logger.error(
          `Failed to create wallet transaction record for order ${order.order_number}: ${txnError.message}`,
        );
        // Don't fail - this is just for visibility
      }
    }

    // Sync payment status to linked specialist prescription if any
    await this.syncPaymentToLinkedPrescription(updatedOrder, paymentDto.payment_reference);

    // Update patient prescription upload usage if any
    await this.updatePatientUploadUsage(updatedOrder);

    // Send order confirmation email (async, don't await to not block response)
    this.sendOrderConfirmationEmail(updatedOrder);

    this.logger.log(`Payment processed for order ${order.order_number}`);
    return updatedOrder;
  }

  /**
   * Dispense order (pharmacy fulfillment)
   */
  async dispenseOrder(
    orderId: Types.ObjectId | string,
    dispenseDto: DispenseOrderDto,
    pharmacistId: Types.ObjectId,
  ): Promise<PharmacyOrderDocument> {
    const order = await this.findById(orderId);

    // Validate order can be dispensed
    if (order.payment_status !== PharmacyOrderPaymentStatus.PAID) {
      throw new BadRequestException('Order must be paid before dispensing');
    }

    const hasPrescriptionItems = order.items.some(
      (item) => item.requires_prescription,
    );
    if (
      hasPrescriptionItems &&
      order.prescription_verification_status !== PrescriptionVerificationStatus.VERIFIED
    ) {
      throw new BadRequestException(
        'Prescription must be verified before dispensing',
      );
    }

    // Process each item - reserve/dispense from inventory
    for (const dispenseItem of dispenseDto.items) {
      await this.inventoryService.dispenseStock(
        dispenseItem.inventory,
        dispenseItem.quantity,
        order._id.toString(),
        pharmacistId,
      );
    }

    // Update order items with batch info
    const updatedItems = order.items.map((item) => {
      const dispenseInfo = dispenseDto.items.find(
        (d) => d.drug === item.drug.toString(),
      );
      if (dispenseInfo) {
        return {
          ...item,
          inventory: new Types.ObjectId(dispenseInfo.inventory),
          batch_number: dispenseInfo.batch_number,
        };
      }
      return item;
    });

    const updatedOrder = await updateOneAndReturn(
      this.orderModel,
      { _id: order._id },
      {
        items: updatedItems,
        dispensed_by: pharmacistId,
        dispensed_at: new Date(),
        dispensing_notes: dispenseDto.dispensing_notes,
        status:
          order.delivery_method === DeliveryMethod.PICKUP
            ? PharmacyOrderStatus.READY_FOR_PICKUP
            : PharmacyOrderStatus.OUT_FOR_DELIVERY,
        updated_by: pharmacistId,
      },
    );

    this.logger.log(`Order ${order.order_number} dispensed`);

    // Send ready for pickup email if order is for pickup
    if (order.delivery_method === DeliveryMethod.PICKUP) {
      this.sendReadyForPickupEmail(order, updatedOrder);
    }

    return updatedOrder;
  }

  /**
   * Complete pickup
   */
  async completePickup(
    orderId: Types.ObjectId | string,
    pickupDto: CompletePickupDto,
    staffId: Types.ObjectId,
  ): Promise<PharmacyOrderDocument> {
    const order = await this.findById(orderId);

    if (order.delivery_method !== DeliveryMethod.PICKUP) {
      throw new BadRequestException('This order is not for pickup');
    }

    if (order.pickup_code !== pickupDto.pickup_code) {
      throw new BadRequestException('Invalid pickup code');
    }

    if (order.status !== PharmacyOrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException('Order is not ready for pickup');
    }

    const updatedOrder = await updateOneAndReturn(
      this.orderModel,
      { _id: order._id },
      {
        status: PharmacyOrderStatus.COMPLETED,
        picked_up_at: new Date(),
        picked_up_by: staffId,
        updated_by: staffId,
      },
    );

    // Send rating request email after pickup completion
    this.sendRatingRequestEmail(order);

    this.logger.log(`Order ${order.order_number} picked up`);
    return updatedOrder;
  }

  /**
   * Assign delivery
   */
  async assignDelivery(
    orderId: Types.ObjectId | string,
    deliveryDto: AssignDeliveryDto,
    staffId: Types.ObjectId,
  ): Promise<PharmacyOrderDocument> {
    const order = await this.findById(orderId);

    const updatedOrder = await updateOneAndReturn(
      this.orderModel,
      { _id: order._id },
      {
        delivery_tracking_number: deliveryDto.tracking_number,
        estimated_delivery_date: deliveryDto.estimated_delivery_date
          ? new Date(deliveryDto.estimated_delivery_date)
          : undefined,
        delivery_notes: deliveryDto.delivery_notes,
        status: PharmacyOrderStatus.OUT_FOR_DELIVERY,
        updated_by: staffId,
      },
    );

    this.logger.log(`Delivery assigned for order ${order.order_number}`);
    return updatedOrder;
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: Types.ObjectId | string,
    cancelDto: CancelOrderDto,
    userId: Types.ObjectId,
  ): Promise<PharmacyOrderDocument> {
    const order = await this.findById(orderId);

    const nonCancellableStatuses = [
      PharmacyOrderStatus.DELIVERED,
      PharmacyOrderStatus.COMPLETED,
      PharmacyOrderStatus.CANCELLED,
      PharmacyOrderStatus.REFUNDED,
    ];

    if (nonCancellableStatuses.includes(order.status)) {
      throw new BadRequestException(
        `Order in ${order.status} status cannot be cancelled`,
      );
    }

    // If inventory was reserved, release it
    // TODO: Implement inventory release logic

    const updatedOrder = await updateOneAndReturn(
      this.orderModel,
      { _id: order._id },
      {
        status: PharmacyOrderStatus.CANCELLED,
        cancelled_by: userId,
        cancelled_at: new Date(),
        cancellation_reason: cancelDto.cancellation_reason,
        updated_by: userId,
      },
    );

    this.logger.log(`Order ${order.order_number} cancelled`);
    return updatedOrder;
  }

  /**
   * Rate order
   */
  async rateOrder(
    orderId: Types.ObjectId | string,
    rateDto: RateOrderDto,
    patientId: Types.ObjectId,
  ): Promise<PharmacyOrderDocument> {
    const order = await this.findById(orderId);

    // Handle both populated and non-populated patient field
    const orderPatientId = (order.patient as any)?._id?.toString()
      || order.patient?.toString();
    if (orderPatientId !== patientId.toString()) {
      throw new ForbiddenException('You can only rate your own orders');
    }

    if (
      order.status !== PharmacyOrderStatus.COMPLETED &&
      order.status !== PharmacyOrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Order must be completed or delivered before rating',
      );
    }

    const updatedOrder = await updateOneAndReturn(
      this.orderModel,
      { _id: order._id },
      {
        rating: rateDto.rating,
        review: rateDto.review,
        rated_at: new Date(),
        updated_by: patientId,
      },
    );

    // Update pharmacy rating
    // Handle both populated and non-populated pharmacy field
    const pharmacyId = (order.pharmacy as any)?._id?.toString()
      || order.pharmacy?.toString();
    await this.pharmacyService.updateRating(pharmacyId, rateDto.rating);

    this.logger.log(`Order ${order.order_number} rated: ${rateDto.rating}/5`);
    return updatedOrder;
  }

  /**
   * Search orders (admin)
   */
  async searchOrders(
    searchDto: SearchPharmacyOrdersDto,
  ): Promise<{ orders: PharmacyOrderDocument[]; total: number }> {
    const {
      patient,
      pharmacy,
      status,
      order_type,
      payment_status,
      order_number,
      date_from,
      date_to,
      has_prescription,
      prescription_verification_status,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = searchDto;

    const filter: any = { is_active: true };

    if (patient) filter.patient = new Types.ObjectId(patient);
    if (pharmacy) filter.pharmacy = new Types.ObjectId(pharmacy);
    if (status) filter.status = status;
    if (order_type) filter.order_type = order_type;
    if (payment_status) filter.payment_status = payment_status;
    if (order_number) filter.order_number = { $regex: order_number, $options: 'i' };
    if (has_prescription !== undefined) {
      filter.prescription = has_prescription ? { $exists: true } : { $exists: false };
    }
    if (prescription_verification_status) {
      filter.prescription_verification_status = prescription_verification_status;
    }

    if (date_from || date_to) {
      filter.created_at = {};
      if (date_from) filter.created_at.$gte = new Date(date_from);
      if (date_to) filter.created_at.$lte = new Date(date_to);
    }

    const offset = (page - 1) * limit;
    const total = await countDocuments(this.orderModel, filter);

    const sortObj = {};
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1;

    const orders = await this.orderModel
      .find(filter)
      .populate('patient', 'profile.first_name profile.last_name')
      .populate('pharmacy', 'name')
      .sort(sortObj)
      .skip(offset)
      .limit(limit)
      .exec();

    return { orders, total };
  }

  /**
   * Get order statistics
   */
  async getStatistics(
    pharmacyId?: string,
  ): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    const filter: any = { is_active: true };
    if (pharmacyId) {
      filter.pharmacy = new Types.ObjectId(pharmacyId);
    }

    const total = await countDocuments(this.orderModel, filter);
    const pending = await countDocuments(this.orderModel, {
      ...filter,
      status: PharmacyOrderStatus.PENDING,
    });
    const processing = await countDocuments(this.orderModel, {
      ...filter,
      status: { $in: [PharmacyOrderStatus.CONFIRMED, PharmacyOrderStatus.PROCESSING] },
    });
    const completed = await countDocuments(this.orderModel, {
      ...filter,
      status: PharmacyOrderStatus.COMPLETED,
    });
    const cancelled = await countDocuments(this.orderModel, {
      ...filter,
      status: PharmacyOrderStatus.CANCELLED,
    });

    const revenueResult = await this.orderModel.aggregate([
      {
        $match: {
          ...filter,
          payment_status: PharmacyOrderPaymentStatus.PAID,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total_amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const paidCount = revenueResult[0]?.count || 0;
    const averageOrderValue = paidCount > 0 ? totalRevenue / paidCount : 0;

    return {
      total,
      pending,
      processing,
      completed,
      cancelled,
      totalRevenue,
      averageOrderValue,
    };
  }

  /**
   * Pay for order using wallet balance
   */
  async payWithWallet(
    orderId: Types.ObjectId | string,
    amount: number,
    userId: Types.ObjectId,
  ): Promise<{ order: PharmacyOrderDocument; newBalance: number }> {
    const order = await this.findById(orderId);

    // Verify order belongs to user (patient may be populated object or ObjectId)
    const patientId = (order.patient as any)?._id || order.patient;
    if (patientId.toString() !== userId.toString()) {
      throw new ForbiddenException('You are not authorized to pay for this order');
    }

    if (order.payment_status === PharmacyOrderPaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    // Use order's actual total amount for payment (ignore frontend amount mismatch)
    const paymentAmount = order.total_amount;

    // Check wallet balance against order total (supports both legacy and unified wallets)
    const earnings = await this.walletsService.getUserEarnings(userId);
    if (earnings.currentBalance < paymentAmount) {
      throw new BadRequestException(
        `Insufficient wallet balance. Required: ${paymentAmount}, Available: ${earnings.currentBalance}`,
      );
    }

    // Generate payment reference
    const paymentReference = `WALLET-${Date.now()}`;

    // Actually deduct from wallet and create transaction record
    const { newBalance } = await this.walletsService.debitWalletForPurchase(
      userId,
      paymentAmount,
      paymentReference,
      `Pharmacy Order Payment - ${order.order_number}`,
    );

    // Update order
    const updatedOrder = await updateOneAndReturn(
      this.orderModel,
      { _id: order._id },
      {
        payment_status: PharmacyOrderPaymentStatus.PAID,
        payment_method: 'WALLET',
        payment_reference: paymentReference,
        paid_at: new Date(),
        amount_paid: paymentAmount,
        wallet_amount_paid: paymentAmount,
        status: PharmacyOrderStatus.CONFIRMED,
        updated_by: userId,
      },
    );

    // Sync payment status to linked specialist prescription if any
    await this.syncPaymentToLinkedPrescription(updatedOrder, paymentReference);

    // Update patient prescription upload usage if any
    await this.updatePatientUploadUsage(updatedOrder);

    // Send order confirmation email (async, don't await to not block response)
    this.sendOrderConfirmationEmail(updatedOrder);

    this.logger.log(`Wallet payment of ${paymentAmount} processed for order ${order.order_number}`);
    return { order: updatedOrder, newBalance };
  }

  /**
   * Process split payment (wallet + card)
   */
  async processSplitPayment(
    orderId: Types.ObjectId | string,
    paymentDto: SplitPaymentDto,
    userId: Types.ObjectId,
  ): Promise<{ order: PharmacyOrderDocument; newBalance: number }> {
    const order = await this.findById(orderId);

    // Verify order belongs to user (patient may be populated object or ObjectId)
    const patientId = (order.patient as any)?._id || order.patient;
    if (patientId.toString() !== userId.toString()) {
      throw new ForbiddenException('You are not authorized to pay for this order');
    }

    if (order.payment_status === PharmacyOrderPaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    const totalPaid = paymentDto.wallet_amount + paymentDto.card_amount;
    if (totalPaid < order.total_amount) {
      throw new BadRequestException('Total payment amount is less than order total');
    }

    // Debit wallet if paying with wallet
    let newBalance = 0;
    if (paymentDto.wallet_amount > 0) {
      const earnings = await this.walletsService.getUserEarnings(userId);
      if (earnings.currentBalance < paymentDto.wallet_amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // Generate wallet reference for the split payment
      const walletReference = `WALLET-SPLIT-${Date.now()}`;

      // Actually deduct from wallet and create transaction record
      const debitResult = await this.walletsService.debitWalletForPurchase(
        userId,
        paymentDto.wallet_amount,
        walletReference,
        `Pharmacy Order Split Payment (Wallet Portion) - ${order.order_number}`,
      );
      newBalance = debitResult.newBalance;
    }

    // Update order with split payment info
    const updatedOrder = await updateOneAndReturn(
      this.orderModel,
      { _id: order._id },
      {
        payment_status: PharmacyOrderPaymentStatus.PAID,
        payment_method: paymentDto.wallet_amount > 0 ? 'SPLIT' : 'CARD',
        payment_reference: paymentDto.card_payment_reference,
        paid_at: new Date(),
        amount_paid: totalPaid,
        wallet_amount_paid: paymentDto.wallet_amount,
        card_amount_paid: paymentDto.card_amount,
        status: PharmacyOrderStatus.CONFIRMED,
        updated_by: userId,
      },
    );

    // Record card portion in chart of accounts (double-entry)
    // Note: Wallet portion is already recorded by walletsService.debitWalletForPurchase
    // DEBIT: Cash/Paystack (Asset increases - money received)
    // CREDIT: Payable to Pharmacy (Liability increases - we owe the pharmacy)
    if (paymentDto.card_amount > 0) {
      try {
        // Get pharmacy info for to_name field
        const pharmacyId = (order.pharmacy as any)?._id || order.pharmacy;
        const PharmaciesCollection = this.connection.collection('pharmacies');
        const pharmacy = await PharmaciesCollection.findOne(
          { _id: new Types.ObjectId(pharmacyId.toString()) },
          { projection: { name: 1 } },
        );
        const pharmacyName = pharmacy?.name || 'Unknown Pharmacy';

        await this.accountingService.createAndPostBatch({
          category: TransactionCategory.PHARMACY_ORDER_PAYMENT,
          description: `Pharmacy order split payment (card portion): ${order.order_number}`,
          entries: [
            {
              account_code: AccountCode.CASH_PAYSTACK,
              entry_type: EntryType.DEBIT,
              amount: paymentDto.card_amount,
              description: `Card payment received (split) - ${order.order_number}`,
              user_id: userId,
            },
            {
              account_code: AccountCode.PAYABLE_PHARMACY,
              entry_type: EntryType.CREDIT,
              amount: paymentDto.card_amount,
              description: `Payable to pharmacy (card portion) - ${order.order_number}`,
              user_id: userId,
            },
          ],
          from_user: userId,
          to_name: pharmacyName,
          reference_type: 'PharmacyOrder',
          reference_id: order._id,
          external_reference: paymentDto.card_payment_reference,
          performed_by: userId,
          metadata: {
            order_number: order.order_number,
            pharmacy_id: pharmacyId?.toString(),
            pharmacy_name: pharmacyName,
            payment_method: 'SPLIT',
            wallet_amount: paymentDto.wallet_amount,
            card_amount: paymentDto.card_amount,
          },
        });
        this.logger.log(`Accounting entries recorded for card portion of split payment - ${order.order_number}`);
      } catch (accountingError) {
        this.logger.error(
          `Failed to record accounting entries for split payment card portion ${order.order_number}: ${accountingError.message}`,
        );
        // Don't fail the payment - accounting can be reconciled later
      }
    }

    // Sync payment status to linked specialist prescription if any
    await this.syncPaymentToLinkedPrescription(updatedOrder, paymentDto.card_payment_reference);

    // Update patient prescription upload usage if any
    await this.updatePatientUploadUsage(updatedOrder);

    // Send order confirmation email (async, don't await to not block response)
    this.sendOrderConfirmationEmail(updatedOrder);

    this.logger.log(
      `Split payment (Wallet: ${paymentDto.wallet_amount}, Card: ${paymentDto.card_amount}) processed for order ${order.order_number}`,
    );
    return { order: updatedOrder, newBalance };
  }

  /**
   * Initialize Paystack payment for an order
   * Returns authorization_url for redirect-based payment (like appointments v2)
   */
  async initializePaystackPayment(
    orderId: Types.ObjectId | string,
    userId: Types.ObjectId,
  ): Promise<{
    authorization_url: string;
    payment_reference: string;
    order_id: string;
  }> {
    const order = await this.findById(orderId);

    // Verify order belongs to user
    const patientId = (order.patient as any)?._id || order.patient;
    if (patientId.toString() !== userId.toString()) {
      throw new ForbiddenException('You are not authorized to pay for this order');
    }

    if (order.payment_status === PharmacyOrderPaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    // Get user email - email is stored at profile.contact.email
    const UsersCollection = this.connection.collection('users');
    const userObjectId = typeof userId === 'string' ? new Types.ObjectId(userId) : userId;

    const user = await UsersCollection.findOne(
      { _id: userObjectId },
      { projection: { 'profile.contact.email': 1 } },
    );

    const userEmail = user?.profile?.contact?.email;
    if (!userEmail) {
      this.logger.error(`User email not found for userId: ${userId}`);
      throw new BadRequestException('User email not found');
    }

    // Generate payment reference
    const paymentReference = `RCPH-${order.order_number}-${Date.now()}`;
    const amount = order.total_amount;

    // Get the callback URL for redirect after payment
    const callbackUrl = `${process.env.FRONTEND_URL || 'https://rapidcapsule.com'}/app/patient/pharmacy/orders/${order._id}?payment=verify&reference=${paymentReference}`;

    // Initialize Paystack transaction
    const paymentResponse = await this.paymentHandler.initializeTransaction(
      userEmail,
      amount,
      paymentReference,
      {
        order_id: order._id.toString(),
        order_number: order.order_number,
        source: 'WEB_PHARMACY',
        payment_for: 'PHARMACY_ORDER',
        callback_url: callbackUrl,
      },
    );

    if (!paymentResponse?.data?.status || !paymentResponse.data.data?.authorization_url) {
      this.logger.error(`Failed to initialize Paystack payment for order ${order.order_number}`);
      throw new BadRequestException('Failed to initialize payment. Please try again.');
    }

    // Update order with payment reference
    await this.orderModel.updateOne(
      { _id: order._id },
      {
        payment_reference: paymentReference,
        updated_by: userId,
      },
    );

    // Create Payment record for webhook to find
    await this.paymentsService.create(
      userObjectId,
      paymentReference,
      amount,
      'Pharmacy Order',
    );

    this.logger.log(`Paystack payment initialized for order ${order.order_number} - ref: ${paymentReference}`);

    return {
      authorization_url: paymentResponse.data.data.authorization_url,
      payment_reference: paymentReference,
      order_id: order._id.toString(),
    };
  }

  // ============ PATIENT DELIVERY ADDRESS METHODS ============

  /**
   * Get all delivery addresses for the authenticated patient
   */
  async getMyDeliveryAddresses(userId: Types.ObjectId) {
    const UsersCollection = this.connection.collection('users');

    const user = await UsersCollection.findOne(
      { _id: userId },
      { projection: { delivery_addresses: 1, profile: 1 } },
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addresses = user.delivery_addresses || [];

    // Also include the profile address as a default option if it exists
    const profileAddress = user.profile?.contact;
    let defaultAddress: any = null;

    if (profileAddress?.address1) {
      const city = profileAddress.address2 || profileAddress.state || '';
      const fullName = `${user.profile?.first_name || ''} ${user.profile?.last_name || ''}`.trim();
      const phone = profileAddress.phone
        ? `${profileAddress.phone.country_code || ''}${profileAddress.phone.number || ''}`
        : '';

      defaultAddress = {
        _id: 'profile_address',
        label: 'Profile Address',
        recipient_name: fullName,
        phone: phone,
        street: profileAddress.address1,
        city: city,
        state: profileAddress.state || '',
        country: profileAddress.country || 'Nigeria',
        postal_code: profileAddress.zip_code || '',
        additional_info: '',
        is_default: addresses.length === 0,
        is_profile_address: true,
      };
    }

    return {
      addresses: defaultAddress ? [defaultAddress, ...addresses] : addresses,
      profile_address: defaultAddress,
    };
  }

  /**
   * Add a new delivery address for the authenticated patient
   */
  async addMyDeliveryAddress(
    userId: Types.ObjectId,
    dto: {
      label: string;
      recipient_name: string;
      phone: string;
      street: string;
      city: string;
      state: string;
      country?: string;
      postal_code?: string;
      additional_info?: string;
      is_default?: boolean;
    },
  ) {
    const UsersCollection = this.connection.collection('users');

    const user = await UsersCollection.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newAddress = {
      _id: new Types.ObjectId(),
      label: dto.label,
      recipient_name: dto.recipient_name,
      phone: dto.phone,
      street: dto.street,
      city: dto.city,
      state: dto.state,
      country: dto.country || 'Nigeria',
      postal_code: dto.postal_code || '',
      additional_info: dto.additional_info || '',
      is_default: dto.is_default || false,
      created_at: new Date(),
    };

    // If this is being set as default, unset other defaults
    if (dto.is_default) {
      await UsersCollection.updateOne(
        { _id: userId },
        { $set: { 'delivery_addresses.$[].is_default': false } },
      );
    }

    await UsersCollection.updateOne(
      { _id: userId },
      { $push: { delivery_addresses: newAddress } },
    );

    return newAddress;
  }

  /**
   * Update a delivery address for the authenticated patient
   */
  async updateMyDeliveryAddress(
    userId: Types.ObjectId,
    addressId: Types.ObjectId,
    dto: {
      label?: string;
      recipient_name?: string;
      phone?: string;
      street?: string;
      city?: string;
      state?: string;
      country?: string;
      postal_code?: string;
      additional_info?: string;
      is_default?: boolean;
    },
  ) {
    const UsersCollection = this.connection.collection('users');

    const user = await UsersCollection.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addressIndex = (user.delivery_addresses || []).findIndex(
      (addr: any) => addr._id.toString() === addressId.toString(),
    );

    if (addressIndex === -1) {
      throw new NotFoundException('Address not found');
    }

    // Build update object
    const updateFields: any = {};
    if (dto.label !== undefined) updateFields[`delivery_addresses.${addressIndex}.label`] = dto.label;
    if (dto.recipient_name !== undefined) updateFields[`delivery_addresses.${addressIndex}.recipient_name`] = dto.recipient_name;
    if (dto.phone !== undefined) updateFields[`delivery_addresses.${addressIndex}.phone`] = dto.phone;
    if (dto.street !== undefined) updateFields[`delivery_addresses.${addressIndex}.street`] = dto.street;
    if (dto.city !== undefined) updateFields[`delivery_addresses.${addressIndex}.city`] = dto.city;
    if (dto.state !== undefined) updateFields[`delivery_addresses.${addressIndex}.state`] = dto.state;
    if (dto.country !== undefined) updateFields[`delivery_addresses.${addressIndex}.country`] = dto.country;
    if (dto.postal_code !== undefined) updateFields[`delivery_addresses.${addressIndex}.postal_code`] = dto.postal_code;
    if (dto.additional_info !== undefined) updateFields[`delivery_addresses.${addressIndex}.additional_info`] = dto.additional_info;

    // If setting as default, unset other defaults first
    if (dto.is_default) {
      await UsersCollection.updateOne(
        { _id: userId },
        { $set: { 'delivery_addresses.$[].is_default': false } },
      );
      updateFields[`delivery_addresses.${addressIndex}.is_default`] = true;
    }

    if (Object.keys(updateFields).length > 0) {
      await UsersCollection.updateOne(
        { _id: userId },
        { $set: updateFields },
      );
    }

    // Fetch and return updated address
    const updatedUser = await UsersCollection.findOne({ _id: userId });
    return updatedUser?.delivery_addresses?.[addressIndex];
  }

  /**
   * Delete a delivery address for the authenticated patient
   */
  async deleteMyDeliveryAddress(userId: Types.ObjectId, addressId: Types.ObjectId) {
    const UsersCollection = this.connection.collection('users');

    const user = await UsersCollection.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addressExists = (user.delivery_addresses || []).some(
      (addr: any) => addr._id.toString() === addressId.toString(),
    );

    if (!addressExists) {
      throw new NotFoundException('Address not found');
    }

    await UsersCollection.updateOne(
      { _id: userId },
      { $pull: { delivery_addresses: { _id: addressId } } },
    );

    return { success: true };
  }

  /**
   * Set an address as default for the authenticated patient
   */
  async setMyDefaultAddress(userId: Types.ObjectId, addressId: Types.ObjectId) {
    const UsersCollection = this.connection.collection('users');

    const user = await UsersCollection.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addressIndex = (user.delivery_addresses || []).findIndex(
      (addr: any) => addr._id.toString() === addressId.toString(),
    );

    if (addressIndex === -1) {
      throw new NotFoundException('Address not found');
    }

    // Unset all defaults first
    await UsersCollection.updateOne(
      { _id: userId },
      { $set: { 'delivery_addresses.$[].is_default': false } },
    );

    // Set the specified address as default
    await UsersCollection.updateOne(
      { _id: userId, 'delivery_addresses._id': addressId },
      { $set: { 'delivery_addresses.$.is_default': true } },
    );

    return { success: true };
  }
}
