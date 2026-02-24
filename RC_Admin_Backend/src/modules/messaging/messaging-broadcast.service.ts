import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import axios, { AxiosInstance } from 'axios';
import * as FormData from 'form-data';
import { MessagingSessionService } from './messaging-session.service';
import {
  MessageBroadcast,
  MessageBroadcastDocument,
} from './entities/message-broadcast.entity';

const PATIENT_API_BASE = `http://127.0.0.1:${process.env.PATIENT_API_PORT || 5020}/api`;

@Injectable()
export class MessagingBroadcastService implements OnModuleInit {
  private readonly logger = new Logger(MessagingBroadcastService.name);

  // Throttling configuration
  private readonly BATCH_SIZE_TEXT = 10;
  private readonly BATCH_SIZE_ATTACHMENT = 5;
  private readonly BATCH_DELAY_MS = 500;
  private readonly MAX_STORED_ERRORS = 50;

  constructor(
    @InjectModel(MessageBroadcast.name)
    private broadcastModel: Model<MessageBroadcastDocument>,
    @InjectConnection()
    private connection: Connection,
    private readonly sessionService: MessagingSessionService,
  ) {}

  /**
   * On startup, mark any stale "processing" broadcasts as failed.
   * This handles the case where the process crashed mid-broadcast.
   */
  async onModuleInit() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const stale = await this.broadcastModel.updateMany(
      { status: 'processing', updated_at: { $lt: tenMinutesAgo } },
      {
        $set: { status: 'failed', completed_at: new Date() },
        $push: {
          errors: {
            recipient_id: 'system',
            error: 'Process restarted; broadcast did not complete',
            batch: 0,
          },
        },
      },
    );
    if (stale.modifiedCount > 0) {
      this.logger.warn(
        `Marked ${stale.modifiedCount} stale broadcast(s) as failed on startup`,
      );
    }
  }

  /**
   * Start a broadcast. Returns immediately with a broadcast ID.
   * The actual sending runs in the background.
   */
  async broadcast(
    adminId: string,
    dto: {
      recipient_ids?: string[];
      recipient_type?: 'Patient' | 'Specialist' | 'all';
      content: string;
      file?: Express.Multer.File;
      thumbnail?: Express.Multer.File;
      attachment_type?: string;
    },
  ) {
    const hasFile = !!dto.file;
    if (!dto.content?.trim() && !hasFile) {
      throw new BadRequestException(
        'Message content or file attachment is required',
      );
    }

    if (!dto.recipient_ids?.length && !dto.recipient_type) {
      throw new BadRequestException(
        'Either recipient_ids or recipient_type is required',
      );
    }

    // Resolve recipients
    const session = await this.sessionService.initSession(adminId);
    const usersCollection = this.connection.db.collection('users');
    const shadowUserId = new Types.ObjectId(session.messaging_user_id);
    let recipientIds: string[];

    if (dto.recipient_ids?.length) {
      recipientIds = dto.recipient_ids;
    } else {
      const query: any = {
        status: 'Active',
        _id: { $ne: shadowUserId },
      };
      if (dto.recipient_type !== 'all') {
        query.user_type = dto.recipient_type;
      } else {
        query.user_type = { $in: ['Patient', 'Specialist'] };
      }

      const users = await usersCollection
        .find(query, { projection: { _id: 1 } })
        .toArray();
      recipientIds = users.map((u) => u._id.toString());
    }

    if (recipientIds.length === 0) {
      throw new BadRequestException('No recipients found for the broadcast');
    }

    const batchSize = hasFile
      ? this.BATCH_SIZE_ATTACHMENT
      : this.BATCH_SIZE_TEXT;

    // Create broadcast record
    const broadcast = await this.broadcastModel.create({
      admin_id: new Types.ObjectId(adminId),
      status: 'pending',
      recipient_type: dto.recipient_ids?.length
        ? 'custom'
        : dto.recipient_type,
      content: (dto.content || '').trim(),
      has_attachment: hasFile,
      attachment_filename: dto.file?.originalname,
      attachment_type: dto.attachment_type,
      total_recipients: recipientIds.length,
      total_batches: Math.ceil(recipientIds.length / batchSize),
    });

    this.logger.log(
      `Broadcast ${broadcast._id} created: ${hasFile ? 'attachment' : 'text'} to ${recipientIds.length} recipients`,
    );

    // Fire and forget — process in background
    setImmediate(() => {
      this.processBroadcast(
        broadcast._id.toString(),
        adminId,
        recipientIds,
        dto,
      ).catch((err) => {
        this.logger.error(
          `Broadcast ${broadcast._id} crashed: ${err.message}`,
        );
        this.broadcastModel
          .findByIdAndUpdate(broadcast._id, {
            status: 'failed',
            completed_at: new Date(),
            $push: {
              errors: {
                recipient_id: 'system',
                error: `Unexpected error: ${err.message}`,
                batch: 0,
              },
            },
          })
          .catch(() => {});
      });
    });

    return {
      broadcast_id: broadcast._id.toString(),
      total_recipients: recipientIds.length,
      status: 'pending',
    };
  }

  /**
   * Background processing: sends messages in throttled batches with progress tracking.
   */
  private async processBroadcast(
    broadcastId: string,
    adminId: string,
    recipientIds: string[],
    dto: {
      content: string;
      file?: Express.Multer.File;
      thumbnail?: Express.Multer.File;
      attachment_type?: string;
    },
  ): Promise<void> {
    // Mark as processing
    await this.broadcastModel.findByIdAndUpdate(broadcastId, {
      status: 'processing',
      started_at: new Date(),
    });

    const hasFile = !!dto.file;
    const BATCH_SIZE = hasFile
      ? this.BATCH_SIZE_ATTACHMENT
      : this.BATCH_SIZE_TEXT;
    const content = (dto.content || '').trim();

    // Get admin session JWT for patient API
    const session = await this.sessionService.initSession(adminId);
    const patientApi = axios.create({
      baseURL: PATIENT_API_BASE,
      timeout: hasFile ? 30000 : 15000,
      headers: { Authorization: `Bearer ${session.messaging_token}` },
    });

    let totalSent = 0;
    let totalFailed = 0;
    const errors: { recipient_id: string; error: string; batch: number }[] = [];

    for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const batch = recipientIds.slice(i, i + BATCH_SIZE);

      // Check for cancellation before each batch
      const current = await this.broadcastModel
        .findById(broadcastId)
        .select('status')
        .lean();
      if (current?.status === 'cancelled') {
        this.logger.log(
          `Broadcast ${broadcastId} cancelled at batch ${batchNumber}`,
        );
        await this.broadcastModel.findByIdAndUpdate(broadcastId, {
          completed_at: new Date(),
        });
        return;
      }

      // Process batch
      const results = await Promise.allSettled(
        batch.map((recipientId) =>
          this.sendToRecipient(patientApi, recipientId, content, hasFile, dto),
        ),
      );

      // Tally results
      for (let j = 0; j < results.length; j++) {
        const r = results[j];
        if (r.status === 'fulfilled') {
          totalSent++;
        } else {
          totalFailed++;
          if (errors.length < this.MAX_STORED_ERRORS) {
            errors.push({
              recipient_id: batch[j],
              error: r.reason?.message || 'Unknown error',
              batch: batchNumber,
            });
          }
        }
      }

      // Update progress in MongoDB
      await this.broadcastModel.findByIdAndUpdate(broadcastId, {
        sent_count: totalSent,
        failed_count: totalFailed,
        current_batch: batchNumber,
        errors: errors.slice(-this.MAX_STORED_ERRORS),
      });

      // Throttle: wait before next batch
      if (i + BATCH_SIZE < recipientIds.length) {
        await this.delay(this.BATCH_DELAY_MS);
      }
    }

    // Finalize
    const finalStatus =
      totalSent === 0 && totalFailed > 0 ? 'failed' : 'completed';
    await this.broadcastModel.findByIdAndUpdate(broadcastId, {
      status: finalStatus,
      sent_count: totalSent,
      failed_count: totalFailed,
      completed_at: new Date(),
      errors: errors.slice(-this.MAX_STORED_ERRORS),
    });

    this.logger.log(
      `Broadcast ${broadcastId} ${finalStatus}: ${totalSent}/${recipientIds.length} sent, ${totalFailed} failed`,
    );
  }

  /**
   * Send a message to a single recipient (create conversation + send message/attachment).
   */
  private async sendToRecipient(
    patientApi: AxiosInstance,
    recipientId: string,
    content: string,
    hasFile: boolean,
    dto: {
      file?: Express.Multer.File;
      thumbnail?: Express.Multer.File;
      attachment_type?: string;
    },
  ): Promise<void> {
    // Find or create conversation
    const convRes = await patientApi.post('/messaging/conversations', {
      participant_id: recipientId,
    });

    const conv = convRes.data?.data?.result || convRes.data?.data;
    if (!conv?._id) {
      throw new Error(
        `Failed to create conversation for recipient ${recipientId}`,
      );
    }

    if (hasFile) {
      const form = new FormData();
      form.append('file', dto.file.buffer, {
        filename: dto.file.originalname,
        contentType: dto.file.mimetype,
      });
      form.append('type', dto.attachment_type || 'file');
      if (dto.thumbnail) {
        form.append('thumbnail', dto.thumbnail.buffer, {
          filename: dto.thumbnail.originalname || 'thumbnail.jpg',
          contentType: dto.thumbnail.mimetype || 'image/jpeg',
        });
      }

      await patientApi.post(
        `/messaging/conversations/${conv._id}/messages/attachment`,
        form,
        { headers: form.getHeaders(), timeout: 30000 },
      );

      // Send text as a separate message if provided
      if (content) {
        await patientApi.post(
          `/messaging/conversations/${conv._id}/messages`,
          { content, type: 'text' },
        );
      }
    } else {
      await patientApi.post(
        `/messaging/conversations/${conv._id}/messages`,
        { content, type: 'text' },
      );
    }
  }

  /**
   * Get the current status/progress of a broadcast.
   */
  async getBroadcastStatus(broadcastId: string) {
    const broadcast = await this.broadcastModel.findById(broadcastId).lean();
    if (!broadcast) {
      throw new NotFoundException('Broadcast not found');
    }
    return broadcast;
  }

  /**
   * Cancel an in-progress broadcast.
   * The background loop checks for cancellation before each batch.
   */
  async cancelBroadcast(broadcastId: string) {
    const broadcast = await this.broadcastModel.findById(broadcastId).lean();
    if (!broadcast) {
      throw new NotFoundException('Broadcast not found');
    }
    if (broadcast.status !== 'pending' && broadcast.status !== 'processing') {
      throw new BadRequestException(
        `Broadcast cannot be cancelled (already ${broadcast.status})`,
      );
    }
    await this.broadcastModel.findByIdAndUpdate(broadcastId, {
      status: 'cancelled',
    });
    return { broadcast_id: broadcastId, status: 'cancelled' };
  }

  /**
   * Get broadcast history for an admin (paginated).
   */
  async getBroadcastHistory(adminId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const query = { admin_id: new Types.ObjectId(adminId) };
    const [data, total] = await Promise.all([
      this.broadcastModel
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.broadcastModel.countDocuments(query),
    ]);
    return {
      data,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
