import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { PharmacyOrderService } from '../services/pharmacy-order.service';
import { AbusePreventionService } from '../services/abuse-prevention.service';
import {
  CreatePharmacyOrderDto,
  CreateOTCOrderDto,
  CreatePrescriptionOrderDto,
  UpdatePharmacyOrderStatusDto,
  VerifyPrescriptionDto,
  ProcessPaymentDto,
  DispenseOrderDto,
  CancelOrderDto,
  RateOrderDto,
  SearchPharmacyOrdersDto,
  GetPatientOrdersDto,
  GetPharmacyOrdersDto,
  CompletePickupDto,
  AssignDeliveryDto,
  ValidateCartDto,
  GetRemainingAllowanceDto,
  GetPurchaseHistoryDto,
  PayWithWalletDto,
  SplitPaymentDto,
  CreatePatientDeliveryAddressDto,
  UpdatePatientDeliveryAddressDto,
} from '../dto/pharmacy-order.dto';
import { Types } from 'mongoose';
import { sendSuccessResponse } from '../../../core/responses/success.responses';

@Controller('pharmacy-orders')
export class PharmacyOrderController {
  constructor(
    private readonly orderService: PharmacyOrderService,
    private readonly abusePreventionService: AbusePreventionService,
  ) {}

  // ============ PATIENT ENDPOINTS ============

  /**
   * Create a new order (general)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Body() createOrderDto: CreatePharmacyOrderDto,
    @Request() req,
  ) {
    const order = await this.orderService.createOrder(
      createOrderDto,
      req.user.sub,
    );
    return sendSuccessResponse('Order created successfully', order);
  }

  /**
   * Create OTC order (no prescription)
   */
  @Post('otc')
  @UseGuards(JwtAuthGuard)
  async createOTCOrder(
    @Body() createOTCDto: CreateOTCOrderDto,
    @Request() req,
  ) {
    const order = await this.orderService.createOTCOrder(
      createOTCDto,
      req.user.sub,
    );
    return sendSuccessResponse('OTC order created successfully', order);
  }

  /**
   * Create prescription order
   */
  @Post('prescription')
  @UseGuards(JwtAuthGuard)
  async createPrescriptionOrder(
    @Body() createPrescriptionDto: CreatePrescriptionOrderDto,
    @Request() req,
  ) {
    const order = await this.orderService.createPrescriptionOrder(
      createPrescriptionDto,
      req.user.sub,
    );
    return sendSuccessResponse('Prescription order created successfully', order);
  }

  // ============ CART VALIDATION ENDPOINTS ============

  /**
   * Validate cart items against purchase limits
   * Call this before checkout to check for quantity limits and prescription requirements
   */
  @Post('validate-cart')
  @UseGuards(JwtAuthGuard)
  async validateCart(@Body() validateCartDto: ValidateCartDto, @Request() req) {
    const validation = await this.abusePreventionService.validateCart(
      req.user.sub,
      validateCartDto.items,
      validateCartDto.patientAge,
    );
    return sendSuccessResponse(
      validation.valid ? 'Cart validated successfully' : 'Cart has validation issues',
      validation,
    );
  }

  /**
   * Get remaining purchase allowance for a specific drug
   */
  @Get('allowance/:drugId')
  @UseGuards(JwtAuthGuard)
  async getRemainingAllowance(
    @Param('drugId') drugId: string,
    @Request() req,
  ) {
    const allowance = await this.abusePreventionService.getRemainingAllowance(
      req.user.sub,
      drugId,
    );
    return sendSuccessResponse('Allowance retrieved successfully', allowance);
  }

  /**
   * Get patient's purchase history for all drugs
   */
  @Get('purchase-history')
  @UseGuards(JwtAuthGuard)
  async getPurchaseHistory(
    @Query() queryDto: GetPurchaseHistoryDto,
    @Request() req,
  ) {
    const history = await this.abusePreventionService.getPatientPurchaseHistory(
      req.user.sub,
      queryDto.days || 30,
    );
    return sendSuccessResponse('Purchase history retrieved successfully', history);
  }

  /**
   * Get patient's orders
   */
  @Get('my-orders')
  @UseGuards(JwtAuthGuard)
  async getMyOrders(@Query() getOrdersDto: GetPatientOrdersDto, @Request() req) {
    const result = await this.orderService.getPatientOrders(
      req.user.sub,
      getOrdersDto,
    );
    return sendSuccessResponse('Orders retrieved successfully', result);
  }

  /**
   * Get order by ID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrderById(@Param('id') id: string) {
    const order = await this.orderService.findById(id);
    return sendSuccessResponse('Order retrieved successfully', order);
  }

  /**
   * Get presigned URL for order confirmation PDF download
   */
  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  async getOrderPdfDownloadUrl(@Param('id') id: string, @Request() req) {
    const result = await this.orderService.getOrderPdfPresignedUrl(id, req.user.sub);
    return sendSuccessResponse('PDF download URL generated', result);
  }

  /**
   * Get order by order number
   */
  @Get('track/:orderNumber')
  @UseGuards(JwtAuthGuard)
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    const order = await this.orderService.findByOrderNumber(orderNumber);
    return sendSuccessResponse('Order retrieved successfully', order);
  }

  /**
   * Cancel order (patient)
   */
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(
    @Param('id') id: string,
    @Body() cancelDto: CancelOrderDto,
    @Request() req,
  ) {
    const order = await this.orderService.cancelOrder(id, cancelDto, req.user.sub);
    return sendSuccessResponse('Order cancelled successfully', order);
  }

  /**
   * Rate order (patient)
   */
  @Patch(':id/rate')
  @UseGuards(JwtAuthGuard)
  async rateOrder(
    @Param('id') id: string,
    @Body() rateDto: RateOrderDto,
    @Request() req,
  ) {
    const order = await this.orderService.rateOrder(id, rateDto, req.user.sub);
    return sendSuccessResponse('Order rated successfully', order);
  }

  // ============ PATIENT DELIVERY ADDRESS ENDPOINTS ============

  /**
   * Get current patient's delivery addresses
   */
  @Get('addresses/my')
  @UseGuards(JwtAuthGuard)
  async getMyAddresses(@Request() req) {
    const result = await this.orderService.getMyDeliveryAddresses(
      new Types.ObjectId(req.user.sub),
    );
    return sendSuccessResponse('Addresses retrieved successfully', result);
  }

  /**
   * Add a new delivery address for current patient
   */
  @Post('addresses/my')
  @UseGuards(JwtAuthGuard)
  async addMyAddress(
    @Body() dto: CreatePatientDeliveryAddressDto,
    @Request() req,
  ) {
    const result = await this.orderService.addMyDeliveryAddress(
      new Types.ObjectId(req.user.sub),
      dto,
    );
    return sendSuccessResponse('Address added successfully', result);
  }

  /**
   * Update a delivery address for current patient
   */
  @Patch('addresses/my/:addressId')
  @UseGuards(JwtAuthGuard)
  async updateMyAddress(
    @Param('addressId') addressId: string,
    @Body() dto: UpdatePatientDeliveryAddressDto,
    @Request() req,
  ) {
    const result = await this.orderService.updateMyDeliveryAddress(
      new Types.ObjectId(req.user.sub),
      new Types.ObjectId(addressId),
      dto,
    );
    return sendSuccessResponse('Address updated successfully', result);
  }

  /**
   * Delete a delivery address for current patient
   */
  @Delete('addresses/my/:addressId')
  @UseGuards(JwtAuthGuard)
  async deleteMyAddress(
    @Param('addressId') addressId: string,
    @Request() req,
  ) {
    const result = await this.orderService.deleteMyDeliveryAddress(
      new Types.ObjectId(req.user.sub),
      new Types.ObjectId(addressId),
    );
    return sendSuccessResponse('Address deleted successfully', result);
  }

  /**
   * Set an address as default for current patient
   */
  @Patch('addresses/my/:addressId/default')
  @UseGuards(JwtAuthGuard)
  async setMyDefaultAddress(
    @Param('addressId') addressId: string,
    @Request() req,
  ) {
    const result = await this.orderService.setMyDefaultAddress(
      new Types.ObjectId(req.user.sub),
      new Types.ObjectId(addressId),
    );
    return sendSuccessResponse('Default address set successfully', result);
  }

  // ============ PHARMACY ENDPOINTS ============

  /**
   * Get pharmacy's orders
   */
  @Get('pharmacy/:pharmacyId')
  @UseGuards(JwtAuthGuard)
  async getPharmacyOrders(
    @Param('pharmacyId') pharmacyId: string,
    @Query() getOrdersDto: GetPharmacyOrdersDto,
  ) {
    const result = await this.orderService.getPharmacyOrders(
      pharmacyId,
      getOrdersDto,
    );
    return sendSuccessResponse('Orders retrieved successfully', result);
  }

  /**
   * Update order status (pharmacy)
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdatePharmacyOrderStatusDto,
    @Request() req,
  ) {
    const order = await this.orderService.updateStatus(
      id,
      updateStatusDto,
      req.user.sub,
    );
    return sendSuccessResponse('Order status updated successfully', order);
  }

  /**
   * Verify prescription (pharmacist)
   */
  @Patch(':id/verify-prescription')
  @UseGuards(JwtAuthGuard)
  async verifyPrescription(
    @Param('id') id: string,
    @Body() verifyDto: VerifyPrescriptionDto,
    @Request() req,
  ) {
    const order = await this.orderService.verifyPrescription(
      id,
      verifyDto,
      req.user.sub,
    );
    return sendSuccessResponse('Prescription verification updated', order);
  }

  /**
   * Process payment (webhook or manual)
   */
  @Patch(':id/payment')
  @UseGuards(JwtAuthGuard)
  async processPayment(
    @Param('id') id: string,
    @Body() paymentDto: ProcessPaymentDto,
    @Request() req,
  ) {
    const order = await this.orderService.processPayment(
      id,
      paymentDto,
      req.user.sub,
    );
    return sendSuccessResponse('Payment processed successfully', order);
  }

  /**
   * Pay with wallet (full wallet payment)
   */
  @Post(':id/pay-with-wallet')
  @UseGuards(JwtAuthGuard)
  async payWithWallet(
    @Param('id') id: string,
    @Body() paymentDto: PayWithWalletDto,
    @Request() req,
  ) {
    const result = await this.orderService.payWithWallet(
      id,
      paymentDto.amount,
      req.user.sub,
    );
    return sendSuccessResponse('Wallet payment processed successfully', result);
  }

  /**
   * Split payment (partial wallet + card)
   */
  @Post(':id/split-payment')
  @UseGuards(JwtAuthGuard)
  async splitPayment(
    @Param('id') id: string,
    @Body() paymentDto: SplitPaymentDto,
    @Request() req,
  ) {
    const result = await this.orderService.processSplitPayment(
      id,
      paymentDto,
      req.user.sub,
    );
    return sendSuccessResponse('Split payment processed successfully', result);
  }

  /**
   * Initialize Paystack payment for an order
   * Returns authorization_url for redirect-based payment
   */
  @Post(':id/initialize-payment')
  @UseGuards(JwtAuthGuard)
  async initializePayment(
    @Param('id') id: string,
    @Request() req,
  ) {
    const result = await this.orderService.initializePaystackPayment(
      id,
      req.user.sub,
    );
    return sendSuccessResponse('Payment initialized successfully', result);
  }

  /**
   * Dispense order (pharmacy fulfillment)
   */
  @Patch(':id/dispense')
  @UseGuards(JwtAuthGuard)
  async dispenseOrder(
    @Param('id') id: string,
    @Body() dispenseDto: DispenseOrderDto,
    @Request() req,
  ) {
    const order = await this.orderService.dispenseOrder(
      id,
      dispenseDto,
      req.user.sub,
    );
    return sendSuccessResponse('Order dispensed successfully', order);
  }

  /**
   * Assign delivery
   */
  @Patch(':id/delivery')
  @UseGuards(JwtAuthGuard)
  async assignDelivery(
    @Param('id') id: string,
    @Body() deliveryDto: AssignDeliveryDto,
    @Request() req,
  ) {
    const order = await this.orderService.assignDelivery(
      id,
      deliveryDto,
      req.user.sub,
    );
    return sendSuccessResponse('Delivery assigned successfully', order);
  }

  /**
   * Complete pickup
   */
  @Patch(':id/pickup')
  @UseGuards(JwtAuthGuard)
  async completePickup(
    @Param('id') id: string,
    @Body() pickupDto: CompletePickupDto,
    @Request() req,
  ) {
    const order = await this.orderService.completePickup(
      id,
      pickupDto,
      req.user.sub,
    );
    return sendSuccessResponse('Pickup completed successfully', order);
  }

  // ============ ADMIN ENDPOINTS ============

  /**
   * Search orders (admin)
   */
  @Get('admin/search')
  @UseGuards(JwtAuthGuard)
  async searchOrders(@Query() searchDto: SearchPharmacyOrdersDto) {
    const result = await this.orderService.searchOrders(searchDto);
    return sendSuccessResponse('Orders retrieved successfully', result);
  }

  /**
   * Get order statistics
   */
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard)
  async getStatistics(@Query('pharmacyId') pharmacyId?: string) {
    const stats = await this.orderService.getStatistics(pharmacyId);
    return sendSuccessResponse('Statistics retrieved successfully', stats);
  }
}
