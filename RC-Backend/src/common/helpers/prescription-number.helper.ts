import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from '../entities/counter.entity';
import * as moment from 'moment';

@Injectable()
export class PrescriptionNumberHelper {
  private readonly logger = new Logger(PrescriptionNumberHelper.name);

  constructor(
    @InjectModel(Counter.name)
    private readonly counterModel: Model<CounterDocument>,
  ) {}

  /**
   * Generate a unique prescription/order number across the platform.
   * Format: RX-YYYYMMDD-0001
   *
   * This uses atomic operations to ensure uniqueness even under concurrent requests.
   */
  async generatePrescriptionNumber(): Promise<string> {
    const today = moment().format('YYYYMMDD');
    const counterName = `prescription_${today}`;

    // Use findOneAndUpdate with upsert to atomically increment the counter
    // This ensures no two requests get the same number
    const counter = await this.counterModel.findOneAndUpdate(
      { name: counterName },
      {
        $inc: { sequence: 1 },
        $setOnInsert: {
          prefix: 'RX',
          date_format: 'YYYYMMDD',
        }
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create if doesn't exist
      }
    );

    const sequenceNumber = counter.sequence.toString().padStart(4, '0');
    const prescriptionNumber = `RX-${today}-${sequenceNumber}`;

    this.logger.log(`Generated prescription number: ${prescriptionNumber}`);
    return prescriptionNumber;
  }

  /**
   * Get the current sequence for today (for debugging/monitoring)
   */
  async getCurrentSequence(): Promise<number> {
    const today = moment().format('YYYYMMDD');
    const counterName = `prescription_${today}`;

    const counter = await this.counterModel.findOne({ name: counterName });
    return counter?.sequence || 0;
  }
}
