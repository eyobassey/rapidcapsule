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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
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

@ApiTags('Pharmacy - Orders')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Create a new pharmacy order', description: 'Creates a new pharmacy order for the authenticated patient. Supports both OTC and prescription items in a single order.' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data or validation failure' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Create OTC order without prescription', description: 'Creates an over-the-counter order that does not require a prescription. Only OTC-classified drugs are allowed.' })
  @ApiResponse({ status: 201, description: 'OTC order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data or non-OTC drug included' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Create prescription order', description: 'Creates an order for prescription drugs. Requires a valid prescription ID to be attached to the order.' })
  @ApiResponse({ status: 201, description: 'Prescription order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data or missing prescription' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Validate cart items against purchase limits', description: 'Validates all items in the cart before checkout. Checks quantity limits, prescription requirements, and abuse prevention rules for the authenticated patient.' })
  @ApiResponse({ status: 200, description: 'Cart validation result returned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid cart data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get remaining purchase allowance for a drug', description: 'Returns the remaining purchase allowance for a specific drug based on abuse prevention rules and the patient\'s recent purchase history.' })
  @ApiResponse({ status: 200, description: 'Allowance retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Drug not found' })
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
  @ApiOperation({ summary: 'Get patient drug purchase history', description: 'Returns the authenticated patient\'s drug purchase history over a configurable number of days. Defaults to the last 30 days.' })
  @ApiResponse({ status: 200, description: 'Purchase history retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get patient orders', description: 'Returns a paginated list of the authenticated patient\'s pharmacy orders. Supports filtering by status and date range.' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Get order by ID', description: 'Retrieves a single pharmacy order by its unique identifier. Returns full order details including items, status, and payment information.' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrderById(@Param('id') id: string) {
    const order = await this.orderService.findById(id);
    return sendSuccessResponse('Order retrieved successfully', order);
  }

  /**
   * Get presigned URL for order confirmation PDF download
   */
  @ApiOperation({ summary: 'Get PDF download URL for order', description: 'Generates a presigned URL for downloading the order confirmation PDF. Only accessible by the patient who placed the order.' })
  @ApiResponse({ status: 200, description: 'PDF download URL generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get(':id/pdf')
  @UseGuards(JwtAuthGuard)
  async getOrderPdfDownloadUrl(@Param('id') id: string, @Request() req) {
    const result = await this.orderService.getOrderPdfPresignedUrl(id, req.user.sub);
    return sendSuccessResponse('PDF download URL generated', result);
  }

  /**
   * Get order by order number
   */
  @ApiOperation({ summary: 'Track order by order number', description: 'Retrieves order details using the human-readable order number. Useful for tracking order status.' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get('track/:orderNumber')
  @UseGuards(JwtAuthGuard)
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    const order = await this.orderService.findByOrderNumber(orderNumber);
    return sendSuccessResponse('Order retrieved successfully', order);
  }

  /**
   * Cancel order (patient)
   */
  @ApiOperation({ summary: 'Cancel order', description: 'Cancels an existing order. Only the patient who placed the order can cancel it, and only if the order has not yet been dispensed.' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled in its current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiOperation({ summary: 'Rate order', description: 'Allows the patient to rate a completed order. Only applicable for orders that have been delivered or picked up.' })
  @ApiResponse({ status: 200, description: 'Order rated successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be rated in its current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiOperation({ summary: 'Get patient delivery addresses', description: 'Returns all saved delivery addresses for the authenticated patient, including the default address indicator.' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Add delivery address', description: 'Adds a new delivery address to the authenticated patient\'s saved addresses. Can optionally be set as the default address.' })
  @ApiResponse({ status: 201, description: 'Address added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid address data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
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
  @ApiOperation({ summary: 'Update delivery address', description: 'Updates an existing delivery address for the authenticated patient. Partial updates are supported.' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid address data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Address not found' })
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
  @ApiOperation({ summary: 'Delete delivery address', description: 'Removes a delivery address from the authenticated patient\'s saved addresses. Cannot delete the default address without first setting another as default.' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Address not found' })
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
  @ApiOperation({ summary: 'Set default delivery address', description: 'Sets the specified address as the default delivery address for the authenticated patient. The previous default address is unset automatically.' })
  @ApiResponse({ status: 200, description: 'Default address set successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Address not found' })
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
  @ApiOperation({ summary: 'Get pharmacy orders', description: 'Returns a paginated list of orders for a specific pharmacy. Supports filtering by status, date range, and other criteria.' })
  @ApiResponse({ status: 200, description: 'Pharmacy orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Pharmacy not found' })
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
  @ApiOperation({ summary: 'Update order status', description: 'Updates the status of an order. Typically used by pharmacy staff to advance the order through its lifecycle (e.g., confirmed, preparing, ready).' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiOperation({ summary: 'Verify prescription', description: 'Allows a pharmacist to verify or reject the prescription attached to an order. Required before prescription orders can be dispensed.' })
  @ApiResponse({ status: 200, description: 'Prescription verification updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid verification data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiOperation({ summary: 'Process payment', description: 'Processes payment for an order. Can be triggered via webhook callback or manual confirmation. Updates payment status and order state accordingly.' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data or payment already processed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiOperation({ summary: 'Pay with wallet', description: 'Processes full payment for an order using the patient\'s wallet balance. The wallet must have sufficient funds to cover the total order amount.' })
  @ApiResponse({ status: 200, description: 'Wallet payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient wallet balance or invalid payment' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiOperation({ summary: 'Split payment between wallet and card', description: 'Processes a split payment where part is deducted from the patient\'s wallet and the remainder is charged to a card via Paystack.' })
  @ApiResponse({ status: 200, description: 'Split payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment amounts or insufficient wallet balance' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiOperation({ summary: 'Initialize Paystack payment', description: 'Initializes a Paystack payment transaction for the order. Returns an authorization URL that the client should redirect the patient to for payment completion.' })
  @ApiResponse({ status: 200, description: 'Payment initialized successfully with authorization URL' })
  @ApiResponse({ status: 400, description: 'Order is not in a payable state' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiOperation({ summary: 'Dispense order', description: 'Marks an order as dispensed by the pharmacy. Records dispensing details including batch numbers and expiry dates. Order must be in a dispensable state.' })
  @ApiResponse({ status: 200, description: 'Order dispensed successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be dispensed in its current status' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiOperation({ summary: 'Assign delivery to order', description: 'Assigns a delivery agent and delivery details to a dispensed order. Transitions the order to delivery-in-progress status.' })
  @ApiResponse({ status: 200, description: 'Delivery assigned successfully' })
  @ApiResponse({ status: 400, description: 'Order is not in a deliverable state' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiOperation({ summary: 'Complete order pickup', description: 'Marks an order as picked up by the patient. Completes the order fulfillment process for pickup-type orders.' })
  @ApiResponse({ status: 200, description: 'Pickup completed successfully' })
  @ApiResponse({ status: 400, description: 'Order is not in a pickable state' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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
  @ApiOperation({ summary: 'Search orders (admin)', description: 'Allows administrators to search across all pharmacy orders with advanced filters including patient name, order number, status, pharmacy, and date range.' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('admin/search')
  @UseGuards(JwtAuthGuard)
  async searchOrders(@Query() searchDto: SearchPharmacyOrdersDto) {
    const result = await this.orderService.searchOrders(searchDto);
    return sendSuccessResponse('Orders retrieved successfully', result);
  }

  /**
   * Get order statistics
   */
  @ApiOperation({ summary: 'Get order statistics (admin)', description: 'Returns aggregated order statistics including total orders, revenue, status distribution, and trends. Can be filtered by pharmacy ID.' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard)
  async getStatistics(@Query('pharmacyId') pharmacyId?: string) {
    const stats = await this.orderService.getStatistics(pharmacyId);
    return sendSuccessResponse('Statistics retrieved successfully', stats);
  }
}
