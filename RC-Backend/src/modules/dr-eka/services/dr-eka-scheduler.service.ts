import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/entities/user.entity';
import { DrEkaService } from './dr-eka.service';

@Injectable()
export class DrEkaSchedulerService {
  private readonly logger = new Logger(DrEkaSchedulerService.name);

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly drEkaService: DrEkaService,
  ) {}

  /**
   * Daily at 6 AM — generate daily digests for all active patients
   * Processes in batches of 10 with delays to avoid Claude API rate limits.
   */
  @Cron('0 6 * * *')
  async runDailyRounds(): Promise<void> {
    this.logger.log('Dr. Eka starting daily rounds...');
    const startTime = Date.now();

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    try {
      const batchSize = 100;
      const processingBatchSize = 10;
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const patients = await this.userModel
          .find({
            user_type: 'Patient',
            status: 'Active',
            is_email_verified: true,
          })
          .select('_id')
          .skip(skip)
          .limit(batchSize)
          .lean();

        if (patients.length === 0) {
          hasMore = false;
          continue;
        }

        // Process in groups of 10 with delays
        for (let i = 0; i < patients.length; i += processingBatchSize) {
          const batch = patients.slice(i, i + processingBatchSize);

          const results = await Promise.allSettled(
            batch.map(async (patient) => {
              try {
                await this.drEkaService.generateDailyDigest(patient._id);
                successCount++;
              } catch (error) {
                this.logger.error(
                  `Daily digest failed for patient ${patient._id}: ${error.message}`,
                );
                errorCount++;
              }
              processedCount++;
            }),
          );

          // Delay between processing batches to avoid rate limits (2 seconds)
          if (i + processingBatchSize < patients.length) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }

        skip += batchSize;
        if (patients.length < batchSize) hasMore = false;
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Dr. Eka daily rounds complete: ${processedCount} patients, ${successCount} digests generated, ${errorCount} errors, ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(
        `Dr. Eka daily rounds failed: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Monday at 8 AM — generate weekly reports for all active patients
   * Processes in batches of 5 (more expensive operation).
   */
  @Cron('0 8 * * 1')
  async runWeeklyReports(): Promise<void> {
    this.logger.log('Dr. Eka starting weekly report generation...');
    const startTime = Date.now();

    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    try {
      const batchSize = 100;
      const processingBatchSize = 5;
      let skip = 0;
      let hasMore = true;

      while (hasMore) {
        const patients = await this.userModel
          .find({
            user_type: 'Patient',
            status: 'Active',
            is_email_verified: true,
          })
          .select('_id')
          .skip(skip)
          .limit(batchSize)
          .lean();

        if (patients.length === 0) {
          hasMore = false;
          continue;
        }

        // Process in groups of 5 with longer delays (weekly reports are more expensive)
        for (let i = 0; i < patients.length; i += processingBatchSize) {
          const batch = patients.slice(i, i + processingBatchSize);

          await Promise.allSettled(
            batch.map(async (patient) => {
              try {
                await this.drEkaService.generateWeeklyReport(patient._id);
                successCount++;
              } catch (error) {
                this.logger.error(
                  `Weekly report failed for patient ${patient._id}: ${error.message}`,
                );
                errorCount++;
              }
              processedCount++;
            }),
          );

          // Longer delay between batches for weekly reports (3 seconds)
          if (i + processingBatchSize < patients.length) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
          }
        }

        skip += batchSize;
        if (patients.length < batchSize) hasMore = false;
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Dr. Eka weekly reports complete: ${processedCount} patients, ${successCount} reports generated, ${errorCount} errors, ${duration}ms`,
      );
    } catch (error) {
      this.logger.error(
        `Dr. Eka weekly reports failed: ${error.message}`,
        error.stack,
      );
    }
  }
}
