import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { FlowType } from '../entities/whatsapp-session.entity';
import {
  BaseFlowHandler,
  FlowHandlerResult,
  FlowContext,
} from './base-flow.handler';
import {
  PatientPrescriptionUpload,
  PatientPrescriptionUploadDocument,
} from '../../pharmacy/entities/patient-prescription-upload.entity';
import {
  PharmacyOrder,
  PharmacyOrderDocument,
  DeliveryMethod,
} from '../../pharmacy/entities/pharmacy-order.entity';
import { MESSAGES } from '../constants/messages.constant';
import { PaymentHandler } from '../../../common/external/payment/payment.handler';
import { WalletsService } from '../../wallets/wallets.service';
import { GeneralHelpers } from '../../../common/helpers/general.helpers';

/**
 * Order creation step definitions
 */
enum OrderStep {
  SHOW_SUMMARY = 0,
  SELECT_DELIVERY_METHOD = 1,
  SELECT_ADDRESS = 2,
  CONFIRM_ORDER = 3,
  PAYMENT = 4,
  COMPLETE = 5,
}

/**
 * Handles the order creation flow after prescription verification
 *
 * Flow steps:
 * 0 - Show order summary with medications
 * 1 - Select delivery method (pickup/delivery)
 * 2 - Select/confirm delivery address (if delivery)
 * 3 - Confirm order details
 * 4 - Payment (wallet or payment link)
 * 5 - Order complete
 */
@Injectable()
export class OrderFlowHandler extends BaseFlowHandler {
  readonly flowType = FlowType.ORDER_CREATION;
  private readonly logger = new Logger(OrderFlowHandler.name);

  constructor(
    @InjectModel(PatientPrescriptionUpload.name)
    private readonly prescriptionModel: Model<PatientPrescriptionUploadDocument>,
    @InjectModel(PharmacyOrder.name)
    private readonly orderModel: Model<PharmacyOrderDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly paymentHandler: PaymentHandler,
    private readonly walletsService: WalletsService,
    private readonly generalHelpers: GeneralHelpers,
  ) {
    super();
  }

  async onEnter(context: FlowContext): Promise<FlowHandlerResult> {
    // Show order summary when entering flow
    return this.showOrderSummary(context);
  }

  async handle(context: FlowContext): Promise<FlowHandlerResult> {
    const { message, session } = context;
    const text = message.body?.trim() || '';
    const step = session.flow_step;

    switch (step) {
      case OrderStep.SHOW_SUMMARY:
        return this.handleSummaryResponse(text, context);
      case OrderStep.SELECT_DELIVERY_METHOD:
        return this.handleDeliveryMethodSelection(text, context);
      case OrderStep.SELECT_ADDRESS:
        return this.handleAddressSelection(text, context);
      case OrderStep.CONFIRM_ORDER:
        return this.handleOrderConfirmation(text, context);
      case OrderStep.PAYMENT:
        return this.handlePaymentResponse(text, context);
      default:
        return this.endFlow(MESSAGES.MENU());
    }
  }

  /**
   * Step 0: Show order summary from prescription
   */
  private async showOrderSummary(
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const prescriptionId = this.getFlowData<string>(context, 'prescription_id');

    if (!prescriptionId) {
      return this.endFlow(
        "No prescription found. Please upload a prescription first.\n\n" +
        MESSAGES.MENU()
      );
    }

    try {
      const prescription = await this.prescriptionModel
        .findById(prescriptionId)
        .exec();

      if (!prescription) {
        return this.endFlow(
          "Prescription not found. Please upload again.\n\n" +
          MESSAGES.MENU()
        );
      }

      // Build order summary from prescription (OCR extracted medications)
      const medications = prescription.ocr_data?.medications || [];

      if (medications.length === 0) {
        return this.endFlow(
          "No medications found in prescription. Please upload a clearer image.\n\n" +
          MESSAGES.MENU()
        );
      }

      // Format medications list
      const medList = medications
        .map((med: any, i: number) => {
          const name = med.drug_name || med.name || 'Unknown medication';
          const dosage = med.dosage || med.strength || '';
          const quantity = med.quantity || 1;
          const price = med.estimated_price || 0;
          return `${i + 1}. ${name}${dosage ? ` (${dosage})` : ''} x${quantity} - ₦${price.toLocaleString()}`;
        })
        .join('\n');

      // Calculate totals
      const subtotal = medications.reduce(
        (sum: number, med: any) => sum + (med.estimated_price || 0) * (med.quantity || 1),
        0
      );

      const response = `*Order Summary*\n\n${medList}\n\n*Subtotal:* ₦${subtotal.toLocaleString()}\n\nWould you like to proceed with this order?\n\n1. Yes, Continue\n2. No, Cancel\n\nReply with 1 or 2.`;

      return {
        response,
        newStep: OrderStep.SHOW_SUMMARY,
        newFlowData: {
          prescription_id: prescriptionId,
          medications,
          subtotal,
        },
      };
    } catch (error) {
      this.logger.error('Error showing order summary:', error);
      return this.endFlow(MESSAGES.ERROR_GENERIC);
    }
  }

  /**
   * Handle response to order summary
   */
  private async handleSummaryResponse(
    text: string,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const choice = text.toLowerCase();

    if (choice === '1' || choice.includes('yes') || choice.includes('continue')) {
      return {
        response: `How would you like to receive your order?\n\n1. Delivery (to your address)\n2. Pickup (from pharmacy)\n\nReply with 1 or 2.`,
        newStep: OrderStep.SELECT_DELIVERY_METHOD,
      };
    }

    if (choice === '2' || choice.includes('no') || choice.includes('cancel')) {
      return this.endFlow(MESSAGES.CANCELLED);
    }

    return this.respond('Please reply with 1 to continue or 2 to cancel.');
  }

  /**
   * Step 1: Handle delivery method selection
   */
  private async handleDeliveryMethodSelection(
    text: string,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const choice = text.toLowerCase();

    if (choice === '1' || choice.includes('delivery')) {
      // Get user's delivery addresses
      const addresses = await this.getUserAddresses(context.patientId);

      if (addresses.length === 0) {
        return {
          response: `Please provide your delivery address:\n\nSend your full address including:\n- Street address\n- City\n- State\n\nExample: "15 Marina Street, Victoria Island, Lagos"`,
          newStep: OrderStep.SELECT_ADDRESS,
          newFlowData: {
            delivery_method: DeliveryMethod.DELIVERY,
            needs_new_address: true,
          },
        };
      }

      // Show saved addresses
      const addressList = addresses
        .map((addr: any, i: number) =>
          `${i + 1}. ${addr.label || 'Address'}: ${addr.street}, ${addr.city}`
        )
        .join('\n');

      return {
        response: `Select a delivery address:\n\n${addressList}\n${addresses.length + 1}. Enter new address\n\nReply with a number.`,
        newStep: OrderStep.SELECT_ADDRESS,
        newFlowData: {
          delivery_method: DeliveryMethod.DELIVERY,
          saved_addresses: addresses,
        },
      };
    }

    if (choice === '2' || choice.includes('pickup')) {
      // Get nearest pharmacy (for now, use default)
      const pharmacy = await this.getDefaultPharmacy();

      return {
        response: `Your order will be ready for pickup at:\n\n*${pharmacy.name}*\n${pharmacy.address}\n${pharmacy.phone}\n\nEstimated ready time: 30-60 minutes after confirmation.\n\nConfirm order?\n1. Yes, Confirm\n2. Change Delivery Method\n3. Cancel`,
        newStep: OrderStep.CONFIRM_ORDER,
        newFlowData: {
          delivery_method: DeliveryMethod.PICKUP,
          pharmacy_id: pharmacy._id,
          pharmacy_name: pharmacy.name,
          pharmacy_address: pharmacy.address,
        },
      };
    }

    return this.respond('Please reply with 1 for delivery or 2 for pickup.');
  }

  /**
   * Step 2: Handle address selection
   */
  private async handleAddressSelection(
    text: string,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const needsNewAddress = this.getFlowData<boolean>(context, 'needs_new_address');
    const savedAddresses = this.getFlowData<any[]>(context, 'saved_addresses') || [];

    if (needsNewAddress) {
      // User is entering a new address
      if (text.length < 10) {
        return this.respond('Please provide a complete address (street, city, state).');
      }

      // Parse the address (simple parsing)
      const parts = text.split(',').map(p => p.trim());
      const address = {
        street: parts[0] || text,
        city: parts[1] || '',
        state: parts[2] || 'Lagos',
      };

      const pharmacy = await this.getDefaultPharmacy();
      const subtotal = this.getFlowData<number>(context, 'subtotal') || 0;
      const deliveryFee = 1500; // Default delivery fee
      const total = subtotal + deliveryFee;

      return {
        response: `*Delivery Details*\n\nAddress: ${address.street}${address.city ? ', ' + address.city : ''}${address.state ? ', ' + address.state : ''}\n\nSubtotal: ₦${subtotal.toLocaleString()}\nDelivery: ₦${deliveryFee.toLocaleString()}\n*Total: ₦${total.toLocaleString()}*\n\nConfirm order?\n1. Yes, Confirm\n2. Change Address\n3. Cancel`,
        newStep: OrderStep.CONFIRM_ORDER,
        newFlowData: {
          delivery_address: address,
          delivery_fee: deliveryFee,
          total_amount: total,
          pharmacy_id: pharmacy._id,
        },
      };
    }

    // User is selecting from saved addresses
    const choice = parseInt(text, 10);

    if (isNaN(choice) || choice < 1) {
      return this.respond('Please reply with a valid number.');
    }

    if (choice === savedAddresses.length + 1) {
      // User wants to enter new address
      return {
        response: `Please provide your delivery address:\n\nSend your full address including:\n- Street address\n- City\n- State\n\nExample: "15 Marina Street, Victoria Island, Lagos"`,
        newFlowData: { needs_new_address: true },
      };
    }

    if (choice > savedAddresses.length + 1) {
      return this.respond(`Please select a number between 1 and ${savedAddresses.length + 1}.`);
    }

    // Selected a saved address
    const selectedAddress = savedAddresses[choice - 1];
    const pharmacy = await this.getDefaultPharmacy();
    const subtotal = this.getFlowData<number>(context, 'subtotal') || 0;
    const deliveryFee = 1500;
    const total = subtotal + deliveryFee;

    return {
      response: `*Delivery Details*\n\nAddress: ${selectedAddress.street}, ${selectedAddress.city}\n\nSubtotal: ₦${subtotal.toLocaleString()}\nDelivery: ₦${deliveryFee.toLocaleString()}\n*Total: ₦${total.toLocaleString()}*\n\nConfirm order?\n1. Yes, Confirm\n2. Change Address\n3. Cancel`,
      newStep: OrderStep.CONFIRM_ORDER,
      newFlowData: {
        delivery_address: selectedAddress,
        delivery_fee: deliveryFee,
        total_amount: total,
        pharmacy_id: pharmacy._id,
      },
    };
  }

  /**
   * Step 3: Handle order confirmation
   */
  private async handleOrderConfirmation(
    text: string,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const choice = text.toLowerCase();

    if (choice === '1' || choice.includes('yes') || choice.includes('confirm')) {
      // Get wallet balance
      const walletBalance = await this.getWalletBalance(context.patientId);
      const totalAmount = this.getFlowData<number>(context, 'total_amount') ||
        this.getFlowData<number>(context, 'subtotal') || 0;

      let response = `*Payment Options*\n\nTotal: ₦${totalAmount.toLocaleString()}\n`;

      if (walletBalance >= totalAmount) {
        response += `\nWallet Balance: ₦${walletBalance.toLocaleString()} ✓\n\n1. Pay with Wallet\n2. Pay with Card\n3. Cancel`;
      } else if (walletBalance > 0) {
        response += `\nWallet Balance: ₦${walletBalance.toLocaleString()}\n\n1. Pay ₦${walletBalance.toLocaleString()} from Wallet + ₦${(totalAmount - walletBalance).toLocaleString()} Card\n2. Pay Full Amount with Card\n3. Cancel`;
      } else {
        response += `\n1. Pay with Card\n2. Cancel`;
      }

      response += `\n\nReply with a number.`;

      return {
        response,
        newStep: OrderStep.PAYMENT,
        newFlowData: {
          wallet_balance: walletBalance,
        },
      };
    }

    if (choice === '2' || choice.includes('change')) {
      return {
        response: `How would you like to receive your order?\n\n1. Delivery (to your address)\n2. Pickup (from pharmacy)\n\nReply with 1 or 2.`,
        newStep: OrderStep.SELECT_DELIVERY_METHOD,
      };
    }

    if (choice === '3' || choice.includes('cancel')) {
      return this.endFlow(MESSAGES.CANCELLED);
    }

    return this.respond('Please reply with 1 to confirm, 2 to change, or 3 to cancel.');
  }

  /**
   * Step 4: Handle payment response
   */
  private async handlePaymentResponse(
    text: string,
    context: FlowContext,
  ): Promise<FlowHandlerResult> {
    const choice = text.toLowerCase();
    const walletBalance = this.getFlowData<number>(context, 'wallet_balance') || 0;
    const totalAmount = this.getFlowData<number>(context, 'total_amount') ||
      this.getFlowData<number>(context, 'subtotal') || 0;

    // Check for cancel
    if (choice.includes('cancel') || choice === '3' || (walletBalance === 0 && choice === '2')) {
      return this.endFlow(MESSAGES.CANCELLED);
    }

    try {
      // Determine payment method based on choice
      let paymentMethod = 'CARD';
      let walletPortion = 0;
      let cardPortion = totalAmount;

      if (walletBalance >= totalAmount && (choice === '1' || choice.includes('wallet'))) {
        paymentMethod = 'WALLET';
        walletPortion = totalAmount;
        cardPortion = 0;
      } else if (walletBalance > 0 && choice === '1') {
        paymentMethod = 'SPLIT';
        walletPortion = walletBalance;
        cardPortion = totalAmount - walletBalance;
      }

      // Create the order first (status: PENDING)
      const order = await this.createOrder(context, paymentMethod, walletPortion, cardPortion);

      if (paymentMethod === 'WALLET') {
        // Process wallet payment immediately
        try {
          await this.processWalletPayment(context.patientId, totalAmount, order);

          // Update order status to CONFIRMED
          await this.orderModel.updateOne(
            { _id: order._id },
            {
              status: 'CONFIRMED',
              payment_status: 'PAID',
              paid_at: new Date(),
              wallet_amount_paid: totalAmount,
            }
          );

          return {
            response: MESSAGES.ORDER_CREATED(
              order.order_number,
              this.getEstimatedDelivery(context)
            ),
            endFlow: true,
            newFlowData: { order_id: order._id },
          };
        } catch (walletError) {
          this.logger.error('Wallet payment failed:', walletError);
          // Delete the pending order
          await this.orderModel.deleteOne({ _id: order._id });
          return this.respond(
            "Sorry, your wallet payment failed. Please try again or use card payment.\n\n1. Try Again\n2. Cancel"
          );
        }
      }

      // For CARD or SPLIT payment, generate Paystack payment link
      if (paymentMethod === 'SPLIT' && walletPortion > 0) {
        // Deduct wallet portion first
        try {
          await this.processWalletPayment(context.patientId, walletPortion, order);
          await this.orderModel.updateOne(
            { _id: order._id },
            { wallet_amount_paid: walletPortion }
          );
        } catch (walletError) {
          this.logger.error('Wallet portion payment failed:', walletError);
          await this.orderModel.deleteOne({ _id: order._id });
          return this.respond(
            "Sorry, your wallet payment failed. Please try again.\n\n1. Try Again\n2. Cancel"
          );
        }
      }

      // Generate Paystack payment link for card portion
      const paymentResult = await this.generatePaymentLink(order, context.patientId, cardPortion);

      if (!paymentResult.success) {
        return this.respond(
          "Sorry, we couldn't generate a payment link. Please try again.\n\n1. Try Again\n2. Cancel"
        );
      }

      return {
        response: MESSAGES.ORDER_PAYMENT_LINK(paymentResult.paymentUrl!),
        newStep: OrderStep.COMPLETE,
        newFlowData: {
          order_id: order._id,
          order_number: order.order_number,
          payment_url: paymentResult.paymentUrl!,
          payment_reference: paymentResult.reference!,
        },
      };
    } catch (error) {
      this.logger.error('Error processing order:', error);
      return this.respond(
        "Sorry, there was an error processing your order. Please try again.\n\n1. Try Again\n2. Cancel"
      );
    }
  }

  /**
   * Get user's saved delivery addresses
   */
  private async getUserAddresses(patientId?: Types.ObjectId): Promise<any[]> {
    if (!patientId) return [];

    try {
      const UsersCollection = this.connection.collection('users');
      const user = await UsersCollection.findOne(
        { _id: patientId },
        { projection: { delivery_addresses: 1 } }
      );
      return user?.delivery_addresses || [];
    } catch (error) {
      this.logger.error('Error fetching user addresses:', error);
      return [];
    }
  }

  /**
   * Get wallet balance for user
   */
  private async getWalletBalance(patientId?: Types.ObjectId): Promise<number> {
    if (!patientId) return 0;

    try {
      const WalletsCollection = this.connection.collection('wallets');
      const wallet = await WalletsCollection.findOne({ user: patientId });
      return wallet?.available_balance || 0;
    } catch (error) {
      this.logger.error('Error fetching wallet balance:', error);
      return 0;
    }
  }

  /**
   * Get default pharmacy
   */
  private async getDefaultPharmacy(): Promise<any> {
    try {
      const PharmacyCollection = this.connection.collection('pharmacies');
      const pharmacy = await PharmacyCollection.findOne({
        is_online: true,
        is_suspended: { $ne: true },
      });

      return pharmacy || {
        _id: new Types.ObjectId(),
        name: 'Rapid Capsule Pharmacy',
        address: 'Victoria Island, Lagos',
        phone: '+234 800 RAPID CAPSULE',
      };
    } catch (error) {
      this.logger.error('Error fetching pharmacy:', error);
      return {
        _id: new Types.ObjectId(),
        name: 'Rapid Capsule Pharmacy',
        address: 'Victoria Island, Lagos',
        phone: '+234 800 RAPID CAPSULE',
      };
    }
  }

  /**
   * Create the pharmacy order
   */
  private async createOrder(
    context: FlowContext,
    paymentMethod: string,
    walletPortion: number = 0,
    cardPortion: number = 0,
  ): Promise<any> {
    const prescriptionId = this.getFlowData<string>(context, 'prescription_id');
    const medications = this.getFlowData<any[]>(context, 'medications') || [];
    const deliveryMethod = this.getFlowData<DeliveryMethod>(context, 'delivery_method');
    const deliveryAddress = this.getFlowData<any>(context, 'delivery_address');
    const pharmacyId = this.getFlowData<string>(context, 'pharmacy_id');
    const subtotal = this.getFlowData<number>(context, 'subtotal') || 0;
    const deliveryFee = this.getFlowData<number>(context, 'delivery_fee') || 0;
    const totalAmount = this.getFlowData<number>(context, 'total_amount') || subtotal;

    // Generate order number
    const orderNumber = `RX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Generate payment reference for tracking
    const paymentReference = this.generalHelpers.genTxReference();

    const orderData = {
      patient: context.patientId,
      pharmacy: pharmacyId ? new Types.ObjectId(pharmacyId) : undefined,
      prescription: prescriptionId ? new Types.ObjectId(prescriptionId) : undefined,
      order_number: orderNumber,
      order_type: 'PRESCRIPTION',
      status: 'PENDING', // Always start as PENDING, update after payment
      items: medications.map((med: any) => ({
        drug_name: med.drug_name || med.name,
        generic_name: med.generic_name,
        strength: med.dosage || med.strength,
        quantity: med.quantity || 1,
        unit_price: med.estimated_price || 0,
        total_price: (med.estimated_price || 0) * (med.quantity || 1),
        requires_prescription: true,
      })),
      subtotal,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      delivery_method: deliveryMethod,
      delivery_address: deliveryAddress ? {
        address_line1: deliveryAddress.street,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
      } : undefined,
      payment_method: paymentMethod,
      payment_status: 'PENDING',
      payment_reference: paymentReference,
      wallet_amount_paid: 0,
      card_amount_paid: 0,
      source: 'WHATSAPP',
      whatsapp_number: context.session?.whatsapp_number,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const order = await this.orderModel.create(orderData);
    this.logger.log(`WhatsApp order created: ${order.order_number} (ref: ${paymentReference})`);
    return order;
  }

  /**
   * Process wallet payment - deduct from user's wallet
   */
  private async processWalletPayment(
    patientId: Types.ObjectId | undefined,
    amount: number,
    order: any,
  ): Promise<void> {
    if (!patientId) {
      throw new Error('Patient ID required for wallet payment');
    }

    const reference = `WA-${order.order_number}`;
    const narration = `Pharmacy Order ${order.order_number}`;

    await this.walletsService.debitWalletForPurchase(
      patientId,
      amount,
      reference,
      narration,
    );

    this.logger.log(`Wallet debited ₦${amount} for order ${order.order_number}`);
  }

  /**
   * Generate Paystack payment link
   */
  private async generatePaymentLink(
    order: any,
    patientId: Types.ObjectId | undefined,
    amount: number,
  ): Promise<{ success: boolean; paymentUrl?: string; reference?: string }> {
    try {
      // Get patient email
      let email = 'customer@rapidcapsule.com';
      if (patientId) {
        const UsersCollection = this.connection.collection('users');
        const user = await UsersCollection.findOne(
          { _id: patientId },
          { projection: { 'profile.contact.email': 1 } }
        );
        email = user?.profile?.contact?.email || email;
      }

      // Generate unique reference
      const reference = `WA-PAY-${order.order_number}-${Date.now()}`;

      // Call Paystack to initialize transaction
      const response = await this.paymentHandler.initializeTransaction(
        email,
        amount,
        reference,
        {
          order_id: order._id.toString(),
          order_number: order.order_number,
          source: 'WHATSAPP',
          payment_for: 'PRESCRIPTION',
        },
      );

      if (response?.data?.status && response.data.data?.authorization_url) {
        // Update order with payment reference
        await this.orderModel.updateOne(
          { _id: order._id },
          { payment_reference: reference }
        );

        this.logger.log(`Paystack payment link generated for order ${order.order_number}: ${reference}`);

        return {
          success: true,
          paymentUrl: response.data.data.authorization_url,
          reference,
        };
      }

      this.logger.error('Paystack response missing authorization_url:', response);
      return { success: false };
    } catch (error) {
      this.logger.error('Error generating Paystack payment link:', error);
      return { success: false };
    }
  }

  /**
   * Get estimated delivery time
   */
  private getEstimatedDelivery(context: FlowContext): string {
    const deliveryMethod = this.getFlowData<DeliveryMethod>(context, 'delivery_method');

    if (deliveryMethod === DeliveryMethod.PICKUP) {
      return '30-60 minutes';
    }

    return '2-4 hours';
  }
}
