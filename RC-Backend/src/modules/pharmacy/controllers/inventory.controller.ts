import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InventoryService } from '../services/inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  AdjustInventoryDto,
  ReceiveStockDto,
  ReserveStockDto,
  ReleaseStockDto,
  StockCountDto,
  SearchInventoryDto,
} from '../dto/inventory.dto';
import { sendSuccessResponse } from '../../../core/responses/success.responses';
import { Messages } from '../../../core/messages/messages';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Pharmacy - Inventory')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('pharmacy/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ============ INVENTORY CRUD ============

  /**
   * Create a new inventory record
   */
  @ApiOperation({ summary: 'Create inventory record', description: 'Create a new inventory record for a drug at a pharmacy' })
  @ApiResponse({ status: 201, description: 'Inventory record created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Post()
  async create(@Body() createInventoryDto: CreateInventoryDto, @Request() req) {
    const result = await this.inventoryService.create(
      createInventoryDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  /**
   * Search inventory
   */
  @ApiOperation({ summary: 'Search inventory', description: 'Search inventory records with filters such as pharmacy, drug, status, and stock levels' })
  @ApiResponse({ status: 200, description: 'Inventory search results returned successfully' })
  @Get('search')
  async search(@Query() searchDto: SearchInventoryDto) {
    const result = await this.inventoryService.search(searchDto);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get low stock alerts
   */
  @ApiOperation({ summary: 'Get low stock alerts', description: 'Get low stock alerts for a pharmacy, identifying items below their reorder threshold' })
  @ApiResponse({ status: 200, description: 'Low stock alerts returned successfully' })
  @Get('alerts/low-stock')
  async getLowStockAlerts(@Query('pharmacy') pharmacyId?: string) {
    const result = await this.inventoryService.getLowStockAlerts(pharmacyId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get expiry alerts
   */
  @ApiOperation({ summary: 'Get expiry alerts', description: 'Get upcoming expiry alerts for inventory items, optionally filtered by pharmacy and days ahead' })
  @ApiResponse({ status: 200, description: 'Expiry alerts returned successfully' })
  @Get('alerts/expiry')
  async getExpiryAlerts(
    @Query('pharmacy') pharmacyId?: string,
    @Query('days') daysAhead?: number,
  ) {
    const result = await this.inventoryService.getExpiryAlerts(
      pharmacyId,
      daysAhead,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get inventory summary for a pharmacy
   */
  @ApiOperation({ summary: 'Get inventory summary', description: 'Get an aggregated inventory summary for a pharmacy including total items, stock value, and alert counts' })
  @ApiResponse({ status: 200, description: 'Inventory summary returned successfully' })
  @Get('summary/:pharmacyId')
  async getSummary(@Param('pharmacyId') pharmacyId: string) {
    const result = await this.inventoryService.getSummary(pharmacyId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get inventory for a pharmacy
   */
  @ApiOperation({ summary: 'Get pharmacy inventory', description: 'Get all inventory records for a pharmacy, optionally including out-of-stock items' })
  @ApiResponse({ status: 200, description: 'Pharmacy inventory returned successfully' })
  @Get('pharmacy/:pharmacyId')
  async getByPharmacy(
    @Param('pharmacyId') pharmacyId: string,
    @Query('includeOutOfStock') includeOutOfStock?: boolean,
  ) {
    const result = await this.inventoryService.getByPharmacy(
      pharmacyId,
      includeOutOfStock,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get available stock for a drug at a pharmacy
   */
  @ApiOperation({ summary: 'Get available stock', description: 'Get the available stock quantity for a specific drug at a specific pharmacy' })
  @ApiResponse({ status: 200, description: 'Available stock returned successfully' })
  @Get('available/:pharmacyId/:drugId')
  async getAvailableStock(
    @Param('pharmacyId') pharmacyId: string,
    @Param('drugId') drugId: string,
  ) {
    const result = await this.inventoryService.getAvailableStock(
      pharmacyId,
      drugId,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get inventory by ID
   */
  @ApiOperation({ summary: 'Get inventory by ID', description: 'Get a single inventory record by its ID' })
  @ApiResponse({ status: 200, description: 'Inventory record returned successfully' })
  @ApiResponse({ status: 404, description: 'Inventory record not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.inventoryService.findById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get adjustment history for an inventory item
   */
  @ApiOperation({ summary: 'Get stock adjustment history', description: 'Get the stock adjustment history for an inventory item with pagination support' })
  @ApiResponse({ status: 200, description: 'Adjustment history returned successfully' })
  @Get(':id/history')
  async getAdjustmentHistory(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const result = await this.inventoryService.getAdjustmentHistory(
      id,
      page,
      limit,
    );
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Update inventory (non-quantity fields)
   */
  @ApiOperation({ summary: 'Update inventory record', description: 'Update non-quantity fields of an inventory record such as reorder level, location, or notes' })
  @ApiResponse({ status: 200, description: 'Inventory record updated successfully' })
  @ApiResponse({ status: 404, description: 'Inventory record not found' })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInventoryDto: UpdateInventoryDto,
    @Request() req,
  ) {
    const result = await this.inventoryService.update(
      id,
      updateInventoryDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  // ============ STOCK OPERATIONS ============

  /**
   * Receive new stock
   */
  @ApiOperation({ summary: 'Receive new stock', description: 'Receive a new stock shipment and update inventory quantities accordingly' })
  @ApiResponse({ status: 201, description: 'Stock received and inventory updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid stock receive data' })
  @Post('receive')
  async receiveStock(@Body() receiveDto: ReceiveStockDto, @Request() req) {
    const result = await this.inventoryService.receiveStock(
      receiveDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.CREATED, result);
  }

  /**
   * Adjust stock quantity
   */
  @ApiOperation({ summary: 'Adjust stock quantity', description: 'Adjust stock quantity for reasons such as damage, loss, theft, or manual correction' })
  @ApiResponse({ status: 200, description: 'Stock quantity adjusted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory record not found' })
  @Post(':id/adjust')
  async adjustStock(
    @Param('id') id: string,
    @Body() adjustDto: AdjustInventoryDto,
    @Request() req,
  ) {
    const result = await this.inventoryService.adjustStock(
      id,
      adjustDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  /**
   * Reserve stock for an order
   */
  @ApiOperation({ summary: 'Reserve stock', description: 'Reserve stock for a pending order to prevent overselling' })
  @ApiResponse({ status: 200, description: 'Stock reserved successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock available for reservation' })
  @Post('reserve')
  async reserveStock(@Body() reserveDto: ReserveStockDto, @Request() req) {
    const result = await this.inventoryService.reserveStock(
      reserveDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  /**
   * Release reserved stock
   */
  @ApiOperation({ summary: 'Release reserved stock', description: 'Release previously reserved stock back to available inventory, e.g. when an order is cancelled' })
  @ApiResponse({ status: 200, description: 'Reserved stock released successfully' })
  @ApiResponse({ status: 400, description: 'Invalid release request' })
  @Post('release')
  async releaseStock(@Body() releaseDto: ReleaseStockDto, @Request() req) {
    const result = await this.inventoryService.releaseStock(
      releaseDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  /**
   * Dispense stock (for order fulfillment)
   */
  @ApiOperation({ summary: 'Dispense stock', description: 'Dispense stock for order fulfillment, reducing the on-hand quantity' })
  @ApiResponse({ status: 200, description: 'Stock dispensed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient stock to dispense' })
  @Post(':id/dispense')
  async dispenseStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Body('orderId') orderId: string,
    @Request() req,
  ) {
    const result = await this.inventoryService.dispenseStock(
      id,
      quantity,
      orderId,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }

  /**
   * Perform stock count
   */
  @ApiOperation({ summary: 'Perform stock count', description: 'Perform a physical stock count and reconcile with system quantities' })
  @ApiResponse({ status: 200, description: 'Stock count recorded and inventory reconciled successfully' })
  @ApiResponse({ status: 404, description: 'Inventory record not found' })
  @Post(':id/stock-count')
  async performStockCount(
    @Param('id') id: string,
    @Body() stockCountDto: StockCountDto,
    @Request() req,
  ) {
    const result = await this.inventoryService.performStockCount(
      id,
      stockCountDto,
      req.user.sub,
    );
    return sendSuccessResponse(Messages.UPDATED, result);
  }
}
