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

@UseGuards(JwtAuthGuard)
@Controller('pharmacy/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ============ INVENTORY CRUD ============

  /**
   * Create a new inventory record
   */
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
  @Get('search')
  async search(@Query() searchDto: SearchInventoryDto) {
    const result = await this.inventoryService.search(searchDto);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get low stock alerts
   */
  @Get('alerts/low-stock')
  async getLowStockAlerts(@Query('pharmacy') pharmacyId?: string) {
    const result = await this.inventoryService.getLowStockAlerts(pharmacyId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get expiry alerts
   */
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
  @Get('summary/:pharmacyId')
  async getSummary(@Param('pharmacyId') pharmacyId: string) {
    const result = await this.inventoryService.getSummary(pharmacyId);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get inventory for a pharmacy
   */
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
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.inventoryService.findById(id);
    return sendSuccessResponse(Messages.RETRIEVED, result);
  }

  /**
   * Get adjustment history for an inventory item
   */
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
