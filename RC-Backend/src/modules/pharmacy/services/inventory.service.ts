import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Types, Connection } from 'mongoose';
import { Inventory, InventoryDocument } from '../entities/inventory.entity';
import {
  InventoryAdjustment,
  InventoryAdjustmentDocument,
} from '../entities/inventory-adjustment.entity';
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
import {
  create,
  findOne,
  find,
  updateOneAndReturn,
  countDocuments,
  findAndCountAll,
} from '../../../common/crud/crud';
import { AdjustmentReason, StockStatus } from '../enums';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(
    @InjectModel(Inventory.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    @InjectModel(InventoryAdjustment.name)
    private readonly adjustmentModel: Model<InventoryAdjustmentDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  /**
   * Create a new inventory record
   */
  async create(
    createInventoryDto: CreateInventoryDto,
    userId?: Types.ObjectId,
  ): Promise<InventoryDocument> {
    // Check for duplicate batch
    const existing = await findOne(this.inventoryModel, {
      pharmacy: new Types.ObjectId(createInventoryDto.pharmacy),
      drug: new Types.ObjectId(createInventoryDto.drug),
      batch_number: createInventoryDto.batch_number,
    });

    if (existing) {
      throw new BadRequestException(
        `Inventory record for this drug batch already exists. Use stock adjustment to modify quantity.`,
      );
    }

    const inventoryData = {
      ...createInventoryDto,
      pharmacy: new Types.ObjectId(createInventoryDto.pharmacy),
      drug: new Types.ObjectId(createInventoryDto.drug),
      created_by: userId,
      updated_by: userId,
    };

    const inventory = await create(this.inventoryModel, inventoryData);

    // Log the initial stock as a received adjustment
    if (userId) {
      await this.logAdjustment(
        inventory._id,
        {
          reason: AdjustmentReason.RECEIVED,
          quantity_change: createInventoryDto.quantity_on_hand,
          notes: 'Initial stock entry',
        },
        0,
        createInventoryDto.quantity_on_hand,
        userId,
      );
    }

    this.logger.log(
      `Created inventory: Pharmacy ${createInventoryDto.pharmacy}, Drug ${createInventoryDto.drug}, Batch ${createInventoryDto.batch_number}`,
    );
    return inventory;
  }

  /**
   * Find inventory by ID
   */
  async findById(id: Types.ObjectId | string): Promise<InventoryDocument> {
    const inventory = await findOne(this.inventoryModel, {
      _id: new Types.ObjectId(id),
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory record with ID ${id} not found`);
    }

    return inventory;
  }

  /**
   * Find inventory by pharmacy, drug, and batch
   */
  async findByBatch(
    pharmacyId: string,
    drugId: string,
    batchNumber: string,
  ): Promise<InventoryDocument | null> {
    return await findOne(this.inventoryModel, {
      pharmacy: new Types.ObjectId(pharmacyId),
      drug: new Types.ObjectId(drugId),
      batch_number: batchNumber,
    });
  }

  /**
   * Update inventory
   */
  async update(
    id: Types.ObjectId | string,
    updateInventoryDto: UpdateInventoryDto,
    userId?: Types.ObjectId,
  ): Promise<InventoryDocument> {
    const inventory = await this.findById(id);

    // Don't allow direct quantity updates - use adjustment methods
    if (updateInventoryDto.quantity_on_hand !== undefined) {
      throw new BadRequestException(
        'Cannot directly update quantity. Use stock adjustment methods.',
      );
    }

    const updatedInventory = await updateOneAndReturn(
      this.inventoryModel,
      { _id: inventory._id },
      { ...updateInventoryDto, updated_by: userId },
    );

    this.logger.log(`Updated inventory: ${id}`);
    return updatedInventory;
  }

  /**
   * Adjust inventory quantity
   */
  async adjustStock(
    id: Types.ObjectId | string,
    adjustDto: AdjustInventoryDto,
    userId: Types.ObjectId,
  ): Promise<InventoryDocument> {
    const inventory = await this.findById(id);

    const newQuantity = inventory.quantity_on_hand + adjustDto.quantity_change;

    if (newQuantity < 0) {
      throw new BadRequestException(
        `Cannot reduce quantity below 0. Current: ${inventory.quantity_on_hand}, Change: ${adjustDto.quantity_change}`,
      );
    }

    // Log the adjustment
    await this.logAdjustment(
      inventory._id,
      adjustDto,
      inventory.quantity_on_hand,
      newQuantity,
      userId,
    );

    // Update the inventory
    const updatedInventory = await updateOneAndReturn(
      this.inventoryModel,
      { _id: inventory._id },
      {
        quantity_on_hand: newQuantity,
        updated_by: userId,
      },
    );

    this.logger.log(
      `Adjusted inventory ${id}: ${adjustDto.reason}, ${adjustDto.quantity_change > 0 ? '+' : ''}${adjustDto.quantity_change}`,
    );
    return updatedInventory;
  }

  /**
   * Receive new stock
   */
  async receiveStock(
    receiveDto: ReceiveStockDto,
    userId: Types.ObjectId,
  ): Promise<InventoryDocument> {
    // Check if batch already exists
    let inventory = await this.findByBatch(
      receiveDto.pharmacy,
      receiveDto.drug,
      receiveDto.batch_number,
    );

    if (inventory) {
      // Add to existing batch
      return await this.adjustStock(
        inventory._id,
        {
          reason: AdjustmentReason.RECEIVED,
          quantity_change: receiveDto.quantity,
          notes: `Received from ${receiveDto.supplier_name || 'supplier'}`,
          reference_number: receiveDto.supplier_invoice,
        },
        userId,
      );
    }

    // Create new inventory record
    return await this.create(
      {
        pharmacy: receiveDto.pharmacy,
        drug: receiveDto.drug,
        batch_number: receiveDto.batch_number,
        expiry_date: receiveDto.expiry_date,
        quantity_on_hand: receiveDto.quantity,
        cost_price: receiveDto.cost_price,
        selling_price: receiveDto.selling_price,
        manufacture_date: receiveDto.manufacture_date,
        supplier_name: receiveDto.supplier_name,
        supplier_invoice: receiveDto.supplier_invoice,
        storage_location: receiveDto.storage_location,
        storage_condition: receiveDto.storage_condition,
        received_date: new Date().toISOString(),
      },
      userId,
    );
  }

  /**
   * Reserve stock for an order
   */
  async reserveStock(
    reserveDto: ReserveStockDto,
    userId: Types.ObjectId,
  ): Promise<InventoryDocument> {
    const inventory = await this.findById(reserveDto.inventory_id);

    const available =
      inventory.quantity_on_hand -
      inventory.quantity_reserved -
      inventory.quantity_damaged;

    if (reserveDto.quantity > available) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${available}, Requested: ${reserveDto.quantity}`,
      );
    }

    // Log the reservation
    await this.logAdjustment(
      inventory._id,
      {
        reason: AdjustmentReason.RESERVED,
        quantity_change: reserveDto.quantity,
        notes: `Reserved for order ${reserveDto.order_id || 'pending'}`,
        reference_type: 'Order',
        reference_id: reserveDto.order_id,
      },
      inventory.quantity_reserved,
      inventory.quantity_reserved + reserveDto.quantity,
      userId,
    );

    // Update reserved quantity
    const updatedInventory = await updateOneAndReturn(
      this.inventoryModel,
      { _id: inventory._id },
      {
        quantity_reserved: inventory.quantity_reserved + reserveDto.quantity,
        updated_by: userId,
      },
    );

    this.logger.log(
      `Reserved ${reserveDto.quantity} units from inventory ${reserveDto.inventory_id}`,
    );
    return updatedInventory;
  }

  /**
   * Release reserved stock
   */
  async releaseStock(
    releaseDto: ReleaseStockDto,
    userId: Types.ObjectId,
  ): Promise<InventoryDocument> {
    const inventory = await this.findById(releaseDto.inventory_id);

    if (releaseDto.quantity > inventory.quantity_reserved) {
      throw new BadRequestException(
        `Cannot release more than reserved. Reserved: ${inventory.quantity_reserved}, Requested: ${releaseDto.quantity}`,
      );
    }

    // Log the release
    await this.logAdjustment(
      inventory._id,
      {
        reason: AdjustmentReason.UNRESERVED,
        quantity_change: -releaseDto.quantity,
        notes: `Released from order ${releaseDto.order_id || 'unknown'}`,
        reference_type: 'Order',
        reference_id: releaseDto.order_id,
      },
      inventory.quantity_reserved,
      inventory.quantity_reserved - releaseDto.quantity,
      userId,
    );

    // Update reserved quantity
    const updatedInventory = await updateOneAndReturn(
      this.inventoryModel,
      { _id: inventory._id },
      {
        quantity_reserved: inventory.quantity_reserved - releaseDto.quantity,
        updated_by: userId,
      },
    );

    this.logger.log(
      `Released ${releaseDto.quantity} units from inventory ${releaseDto.inventory_id}`,
    );
    return updatedInventory;
  }

  /**
   * Dispense stock (fulfilling an order)
   */
  async dispenseStock(
    inventoryId: string,
    quantity: number,
    orderId: string,
    userId: Types.ObjectId,
  ): Promise<InventoryDocument> {
    const inventory = await this.findById(inventoryId);

    if (quantity > inventory.quantity_on_hand) {
      throw new BadRequestException('Insufficient stock to dispense');
    }

    // Log the dispensing
    await this.logAdjustment(
      inventory._id,
      {
        reason: AdjustmentReason.DISPENSED,
        quantity_change: -quantity,
        notes: `Dispensed for order ${orderId}`,
        reference_type: 'Order',
        reference_id: orderId,
      },
      inventory.quantity_on_hand,
      inventory.quantity_on_hand - quantity,
      userId,
    );

    // Also reduce reserved if applicable
    const reservedReduction = Math.min(quantity, inventory.quantity_reserved);

    // Update quantities
    const updatedInventory = await updateOneAndReturn(
      this.inventoryModel,
      { _id: inventory._id },
      {
        quantity_on_hand: inventory.quantity_on_hand - quantity,
        quantity_reserved: inventory.quantity_reserved - reservedReduction,
        updated_by: userId,
      },
    );

    this.logger.log(`Dispensed ${quantity} units from inventory ${inventoryId}`);
    return updatedInventory;
  }

  /**
   * Perform stock count
   */
  async performStockCount(
    id: Types.ObjectId | string,
    stockCountDto: StockCountDto,
    userId: Types.ObjectId,
  ): Promise<InventoryDocument> {
    const inventory = await this.findById(id);

    const difference = stockCountDto.counted_quantity - inventory.quantity_on_hand;

    if (difference !== 0) {
      // Log the adjustment
      await this.logAdjustment(
        inventory._id,
        {
          reason: AdjustmentReason.COUNTING_ADJUSTMENT,
          quantity_change: difference,
          notes: stockCountDto.notes || 'Physical stock count adjustment',
        },
        inventory.quantity_on_hand,
        stockCountDto.counted_quantity,
        userId,
      );
    }

    // Update inventory
    const updatedInventory = await updateOneAndReturn(
      this.inventoryModel,
      { _id: inventory._id },
      {
        quantity_on_hand: stockCountDto.counted_quantity,
        last_stock_count_date: new Date(),
        last_stock_count_quantity: stockCountDto.counted_quantity,
        last_stock_count_by: userId,
        updated_by: userId,
      },
    );

    this.logger.log(`Stock count performed for inventory ${id}`);
    return updatedInventory;
  }

  /**
   * Search inventory
   */
  async search(searchDto: SearchInventoryDto): Promise<{
    inventory: InventoryDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      pharmacy,
      drug,
      stock_status,
      is_low_stock,
      is_expiring_soon,
      is_expired,
      is_available_for_sale,
      batch_number,
      expiry_before,
      expiry_after,
      page = 1,
      limit = 20,
      sort_by = 'expiry_date',
      sort_order = 'asc',
    } = searchDto;

    // Build query
    const filter: any = { is_active: true };

    if (pharmacy) {
      filter.pharmacy = new Types.ObjectId(pharmacy);
    }

    if (drug) {
      filter.drug = new Types.ObjectId(drug);
    }

    if (stock_status) {
      filter.stock_status = stock_status;
    }

    if (is_low_stock) {
      filter.$expr = { $lte: ['$quantity_on_hand', '$reorder_level'] };
    }

    if (is_expiring_soon) {
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      filter.expiry_date = { $lte: ninetyDaysFromNow, $gt: new Date() };
    }

    if (is_expired) {
      filter.expiry_date = { $lt: new Date() };
    }

    if (is_available_for_sale !== undefined) {
      filter.is_available_for_sale = is_available_for_sale;
    }

    if (batch_number) {
      filter.batch_number = batch_number;
    }

    if (expiry_before) {
      filter.expiry_date = { ...filter.expiry_date, $lt: new Date(expiry_before) };
    }

    if (expiry_after) {
      filter.expiry_date = { ...filter.expiry_date, $gt: new Date(expiry_after) };
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const total = await countDocuments(this.inventoryModel, filter);

    // Build sort
    const sortObj = {};
    sortObj[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Get inventory with pagination
    const inventory = await this.inventoryModel
      .find(filter)
      .populate('drug', 'name generic_name strength dosage_form')
      .populate('pharmacy', 'name')
      .sort(sortObj)
      .skip(offset)
      .limit(limit)
      .exec();

    return {
      inventory,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get inventory for a pharmacy
   */
  async getByPharmacy(
    pharmacyId: string,
    includeOutOfStock = false,
  ): Promise<InventoryDocument[]> {
    const filter: any = {
      pharmacy: new Types.ObjectId(pharmacyId),
      is_active: true,
    };

    if (!includeOutOfStock) {
      filter.quantity_on_hand = { $gt: 0 };
    }

    return await this.inventoryModel
      .find(filter)
      .populate('drug')
      .sort({ expiry_date: 1 }) // FEFO - First Expiry First Out
      .exec();
  }

  /**
   * Get available stock for a drug at a pharmacy
   * Checks stockbatchentities first, then falls back to inventories, then drug quantity
   */
  async getAvailableStock(
    pharmacyId: string,
    drugId: string,
  ): Promise<{
    totalAvailable: number;
    batches: { batchNumber: string; available: number; expiryDate: Date | null }[];
  }> {
    const StockBatchCollection = this.connection.collection('stockbatchentities');
    const DrugsCollection = this.connection.collection('drugentities');

    let totalAvailable = 0;
    const batches: { batchNumber: string; available: number; expiryDate: Date | null }[] = [];

    // First, check stockbatchentities collection
    const stockBatches = await StockBatchCollection.find({
      drug_id: new Types.ObjectId(drugId),
      status: 'active',
      quantity_available: { $gt: 0 },
      $or: [
        { no_expiry: true },
        { expiry_date: { $gt: new Date() } },
      ],
    }).toArray();

    if (stockBatches.length > 0) {
      for (const batch of stockBatches) {
        const available = batch.quantity_available - (batch.quantity_reserved || 0);
        if (available > 0) {
          totalAvailable += available;
          batches.push({
            batchNumber: batch.batch_number,
            available,
            expiryDate: batch.expiry_date,
          });
        }
      }
    }

    // If no stock in batches, check inventories collection (legacy)
    if (totalAvailable === 0) {
      const inventoryItems = await find(this.inventoryModel, {
        pharmacy: new Types.ObjectId(pharmacyId),
        drug: new Types.ObjectId(drugId),
        is_active: true,
        is_available_for_sale: true,
        expiry_date: { $gt: new Date() },
        quantity_on_hand: { $gt: 0 },
      });

      for (const item of inventoryItems) {
        const available =
          item.quantity_on_hand - item.quantity_reserved - item.quantity_damaged;
        if (available > 0) {
          totalAvailable += available;
          batches.push({
            batchNumber: item.batch_number,
            available,
            expiryDate: item.expiry_date,
          });
        }
      }
    }

    // If still no stock, fall back to drug's legacy quantity field (for seeded data)
    if (totalAvailable === 0) {
      const drug = await DrugsCollection.findOne({
        _id: new Types.ObjectId(drugId),
      });

      if (drug && drug.quantity > 0) {
        totalAvailable = drug.quantity;
        batches.push({
          batchNumber: 'LEGACY',
          available: drug.quantity,
          expiryDate: null,
        });
      }
    }

    return { totalAvailable, batches };
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(pharmacyId?: string): Promise<InventoryDocument[]> {
    const filter: any = {
      is_active: true,
      $expr: { $lte: ['$quantity_on_hand', '$reorder_level'] },
      stock_status: { $in: [StockStatus.LOW_STOCK, StockStatus.OUT_OF_STOCK] },
    };

    if (pharmacyId) {
      filter.pharmacy = new Types.ObjectId(pharmacyId);
    }

    return await this.inventoryModel
      .find(filter)
      .populate('drug', 'name generic_name')
      .populate('pharmacy', 'name')
      .exec();
  }

  /**
   * Get expiring soon alerts
   */
  async getExpiryAlerts(
    pharmacyId?: string,
    daysAhead = 90,
  ): Promise<InventoryDocument[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const filter: any = {
      is_active: true,
      expiry_date: { $lte: futureDate, $gt: new Date() },
      quantity_on_hand: { $gt: 0 },
    };

    if (pharmacyId) {
      filter.pharmacy = new Types.ObjectId(pharmacyId);
    }

    return await this.inventoryModel
      .find(filter)
      .populate('drug', 'name generic_name')
      .populate('pharmacy', 'name')
      .sort({ expiry_date: 1 })
      .exec();
  }

  /**
   * Get inventory summary for a pharmacy
   */
  async getSummary(pharmacyId: string): Promise<{
    totalItems: number;
    totalQuantity: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringSoonCount: number;
    expiredCount: number;
  }> {
    const pharmacy = new Types.ObjectId(pharmacyId);
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const [summary] = await this.inventoryModel.aggregate([
      { $match: { pharmacy, is_active: true } },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity_on_hand' },
          totalValue: {
            $sum: { $multiply: ['$quantity_on_hand', '$cost_price'] },
          },
          lowStockCount: {
            $sum: {
              $cond: [
                { $lte: ['$quantity_on_hand', '$reorder_level'] },
                1,
                0,
              ],
            },
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$quantity_on_hand', 0] }, 1, 0] },
          },
          expiringSoonCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lte: ['$expiry_date', ninetyDaysFromNow] },
                    { $gt: ['$expiry_date', new Date()] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          expiredCount: {
            $sum: { $cond: [{ $lt: ['$expiry_date', new Date()] }, 1, 0] },
          },
        },
      },
    ]);

    return (
      summary || {
        totalItems: 0,
        totalQuantity: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        expiringSoonCount: 0,
        expiredCount: 0,
      }
    );
  }

  /**
   * Log an inventory adjustment
   */
  private async logAdjustment(
    inventoryId: Types.ObjectId,
    adjustDto: AdjustInventoryDto,
    quantityBefore: number,
    quantityAfter: number,
    userId: Types.ObjectId,
  ): Promise<InventoryAdjustmentDocument> {
    const inventory = await this.findById(inventoryId);

    return await create(this.adjustmentModel, {
      inventory: inventoryId,
      pharmacy: inventory.pharmacy,
      drug: inventory.drug,
      batch_number: inventory.batch_number,
      reason: adjustDto.reason,
      quantity_change: adjustDto.quantity_change,
      quantity_before: quantityBefore,
      quantity_after: quantityAfter,
      reference_type: adjustDto.reference_type,
      reference_id: adjustDto.reference_id
        ? new Types.ObjectId(adjustDto.reference_id)
        : undefined,
      reference_number: adjustDto.reference_number,
      notes: adjustDto.notes,
      unit_cost: adjustDto.unit_cost || inventory.cost_price,
      total_value:
        Math.abs(adjustDto.quantity_change) *
        (adjustDto.unit_cost || inventory.cost_price),
      performed_by: userId,
      performed_at: new Date(),
    });
  }

  /**
   * Get adjustment history for an inventory item
   */
  async getAdjustmentHistory(
    inventoryId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    adjustments: InventoryAdjustmentDocument[];
    total: number;
  }> {
    const filter = { inventory: new Types.ObjectId(inventoryId) };
    const offset = (page - 1) * limit;

    const total = await countDocuments(this.adjustmentModel, filter);
    const adjustments = await this.adjustmentModel
      .find(filter)
      .populate('performed_by', 'profile.first_name profile.last_name')
      .sort({ performed_at: -1 })
      .skip(offset)
      .limit(limit)
      .exec();

    return { adjustments, total };
  }
}
