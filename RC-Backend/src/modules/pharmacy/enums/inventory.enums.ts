/**
 * Inventory-related Enums
 */

/**
 * Stock status for inventory items
 */
export enum StockStatus {
  IN_STOCK = 'IN_STOCK', // Adequate stock available
  LOW_STOCK = 'LOW_STOCK', // Below reorder level
  OUT_OF_STOCK = 'OUT_OF_STOCK', // No stock available
  DISCONTINUED = 'DISCONTINUED', // Product discontinued
  EXPIRED = 'EXPIRED', // All stock expired
}

/**
 * Inventory adjustment reasons
 */
export enum AdjustmentReason {
  RECEIVED = 'RECEIVED', // Stock received from supplier
  SOLD = 'SOLD', // Sold to customer
  RETURNED_BY_CUSTOMER = 'RETURNED_BY_CUSTOMER', // Customer return
  RETURNED_TO_SUPPLIER = 'RETURNED_TO_SUPPLIER', // Supplier return
  DAMAGED = 'DAMAGED', // Damaged goods
  EXPIRED = 'EXPIRED', // Expired goods
  STOLEN = 'STOLEN', // Theft
  COUNTING_ADJUSTMENT = 'COUNTING_ADJUSTMENT', // Physical count adjustment
  TRANSFER_IN = 'TRANSFER_IN', // Transferred from another location
  TRANSFER_OUT = 'TRANSFER_OUT', // Transferred to another location
  DISPENSED = 'DISPENSED', // Dispensed against prescription
  RESERVED = 'RESERVED', // Reserved for pending order
  UNRESERVED = 'UNRESERVED', // Released from reservation
  RECALLED = 'RECALLED', // Manufacturer recall
  OTHER = 'OTHER', // Other adjustment
}

/**
 * Storage conditions for medications
 */
export enum StorageCondition {
  ROOM_TEMPERATURE = 'ROOM_TEMPERATURE', // 15-25°C
  COOL = 'COOL', // 8-15°C
  REFRIGERATED = 'REFRIGERATED', // 2-8°C
  FROZEN = 'FROZEN', // Below -15°C
  PROTECT_FROM_LIGHT = 'PROTECT_FROM_LIGHT',
  PROTECT_FROM_MOISTURE = 'PROTECT_FROM_MOISTURE',
  CONTROLLED_ROOM_TEMPERATURE = 'CONTROLLED_ROOM_TEMPERATURE',
}

/**
 * Dispensing method - FIFO vs FEFO
 */
export enum DispensingMethod {
  FIFO = 'FIFO', // First In, First Out
  FEFO = 'FEFO', // First Expiry, First Out (recommended for medications)
}
