import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Conversation,
  ConversationDocument,
  ConversationType,
  ParticipantRole,
} from './entities/conversation.entity';
import { Message, MessageDocument, MessageType } from './entities/message.entity';
import { MessagingAuditService } from './messaging-audit.service';
import { MessagingUploadService } from './messaging-upload.service';
import { AuditAction } from './entities/message-audit-log.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { QueryMessagesDto, QueryConversationsDto } from './dto/query-messages.dto';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { FileUploadHelper } from '../../common/helpers/file-upload.helpers';
import { MessagingLinkPreviewService } from './messaging-link-preview.service';
import { User, UserDocument } from '../users/entities/user.entity';

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private readonly auditService: MessagingAuditService,
    private readonly uploadService: MessagingUploadService,
    private readonly fileUploadHelper: FileUploadHelper,
    private readonly linkPreviewService: MessagingLinkPreviewService,
  ) {}

  /**
   * Determine conversation type from the two participants' roles
   */
  private getConversationType(
    role1: string,
    role2: string,
  ): ConversationType {
    const roles = [role1.toLowerCase(), role2.toLowerCase()].sort();
    if (roles.includes('admin') && roles.includes('patient'))
      return ConversationType.PATIENT_ADMIN;
    if (roles.includes('admin') && roles.includes('specialist'))
      return ConversationType.SPECIALIST_ADMIN;
    return ConversationType.PATIENT_SPECIALIST;
  }

  /**
   * Map user_type to participant role
   */
  private mapUserTypeToRole(userType: string): ParticipantRole {
    switch (userType?.toLowerCase()) {
      case 'admin':
        return ParticipantRole.ADMIN;
      case 'specialist':
        return ParticipantRole.SPECIALIST;
      default:
        return ParticipantRole.PATIENT;
    }
  }

  // ===================== CONVERSATIONS =====================

  /**
   * Create or find an existing conversation between two users
   */
  async createOrFindConversation(
    userId: string,
    userType: string,
    dto: CreateConversationDto,
    ipAddress?: string,
  ) {
    const participantId = dto.participant_id;

    if (userId === participantId) {
      throw new BadRequestException('Cannot start a conversation with yourself');
    }

    // Check if conversation already exists between these two users
    const existing = await this.conversationModel.findOne({
      'participants.user': { $all: [new Types.ObjectId(userId), new Types.ObjectId(participantId)] },
      is_active: true,
    });

    if (existing) {
      return this.populateConversation(existing);
    }

    // Look up the other user to determine their role
    const otherUser = await this.conversationModel.db
      .collection('users')
      .findOne({ _id: new Types.ObjectId(participantId) });

    if (!otherUser) {
      throw new NotFoundException('User not found');
    }

    const myRole = this.mapUserTypeToRole(userType);
    const otherRole = this.mapUserTypeToRole(otherUser.user_type);
    const convType = this.getConversationType(userType, otherUser.user_type);

    const conversation = await this.conversationModel.create({
      participants: [
        { user: new Types.ObjectId(userId), role: myRole },
        { user: new Types.ObjectId(participantId), role: otherRole },
      ],
      type: convType,
      unread_counts: new Map([
        [userId, 0],
        [participantId, 0],
      ]),
      consent_given: [],
    });

    await this.auditService.log({
      action: AuditAction.CONVERSATION_CREATED,
      actor: userId,
      actor_type: userType,
      conversation: conversation._id.toString(),
      metadata: { participant_id: participantId, ip_address: ipAddress },
    });

    return this.populateConversation(conversation);
  }

  /**
   * List conversations for a user (paginated, sorted by last message)
   */
  async getConversations(userId: string, query: QueryConversationsDto) {
    const { page = 1, limit = 20, search } = query;
    const skip = (page - 1) * limit;

    const filter: any = {
      'participants.user': new Types.ObjectId(userId),
      is_active: true,
      is_archived: false,
    };

    const conversations = await this.conversationModel
      .find(filter)
      .populate('participants.user', 'profile.first_name profile.last_name profile.profile_photo email user_type')
      .sort({ 'last_message.sent_at': -1, updated_at: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.conversationModel.countDocuments(filter).exec();

    // Resolve profile photos to presigned URLs
    await Promise.all(conversations.map((c) => this.resolveProfilePhotosForConversation(c)));

    // If search is provided, filter by participant name client-side (since names are in a subdoc)
    let filtered = conversations;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = conversations.filter((conv) => {
        return conv.participants.some((p: any) => {
          if (p.user?._id?.toString() === userId) return false;
          const name = `${p.user?.profile?.first_name || ''} ${p.user?.profile?.last_name || ''}`.toLowerCase();
          return name.includes(searchLower);
        });
      });
    }

    return {
      data: filtered,
      pagination: {
        total: search ? filtered.length : total,
        page,
        limit,
        pages: Math.ceil((search ? filtered.length : total) / limit),
      },
    };
  }

  /**
   * Get single conversation details
   */
  async getConversation(conversationId: string) {
    const conversation = await this.conversationModel
      .findById(conversationId)
      .populate('participants.user', 'profile.first_name profile.last_name profile.profile_photo email user_type');

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.resolveProfilePhotosForConversation(conversation);
    return conversation;
  }

  /**
   * Archive a conversation
   */
  async archiveConversation(userId: string, userType: string, conversationId: string) {
    const conversation = await this.conversationModel.findByIdAndUpdate(
      conversationId,
      { is_archived: true },
      { new: true },
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.auditService.log({
      action: AuditAction.CONVERSATION_ARCHIVED,
      actor: userId,
      actor_type: userType,
      conversation: conversationId,
    });

    return conversation;
  }

  // ===================== MESSAGES =====================

  /**
   * Get messages for a conversation (cursor-based pagination)
   */
  async getMessages(conversationId: string, query: QueryMessagesDto) {
    const { before, limit = 50 } = query;

    const filter: any = {
      conversation: new Types.ObjectId(conversationId),
      is_deleted: false,
    };

    if (before) {
      filter._id = { $lt: new Types.ObjectId(before) };
    }

    const messages = await this.messageModel
      .find(filter)
      .populate('sender', 'profile.first_name profile.last_name profile.profile_photo user_type')
      .populate('reply_to', 'content type sender')
      .sort({ created_at: -1 })
      .limit(limit)
      .exec();

    const hasMore = messages.length === limit;

    // Resolve profile photos and attachment URLs for all messages
    await Promise.all(messages.map((m) => this.resolveMessageUrls(m)));

    return {
      data: messages.reverse(), // Return oldest first
      has_more: hasMore,
      cursor: messages.length > 0 ? messages[0]._id : null,
    };
  }

  /**
   * Send a text message
   */
  async sendMessage(
    userId: string,
    userType: string,
    conversationId: string,
    dto: SendMessageDto,
  ) {
    const message = await this.messageModel.create({
      conversation: new Types.ObjectId(conversationId),
      sender: new Types.ObjectId(userId),
      type: dto.type,
      content: dto.content,
      reply_to: dto.reply_to ? new Types.ObjectId(dto.reply_to) : undefined,
      status: { sent_at: new Date() },
    });

    // Update conversation's last_message and unread counts
    const conversation = await this.conversationModel.findById(conversationId);
    if (conversation) {
      const unreadCounts = conversation.unread_counts || new Map();
      conversation.participants.forEach((p) => {
        const pId = p.user.toString();
        if (pId !== userId) {
          unreadCounts.set(pId, (unreadCounts.get(pId) || 0) + 1);
        }
      });

      await this.conversationModel.findByIdAndUpdate(conversationId, {
        last_message: {
          content: dto.content,
          sender: new Types.ObjectId(userId),
          sent_at: new Date(),
          type: dto.type,
        },
        unread_counts: unreadCounts,
      });
    }

    await this.auditService.log({
      action: AuditAction.MESSAGE_SENT,
      actor: userId,
      actor_type: userType,
      conversation: conversationId,
      message: message._id.toString(),
    });

    // Populate sender before returning
    const populated = await this.messageModel
      .findById(message._id)
      .populate('sender', 'profile.first_name profile.last_name profile.profile_photo user_type')
      .populate('reply_to', 'content type sender');

    await this.resolveMessageUrls(populated);
    return populated;
  }

  /**
   * Send a message with file attachment
   */
  async sendAttachment(
    userId: string,
    userType: string,
    conversationId: string,
    dto: UploadAttachmentDto,
    file: Express.Multer.File,
    thumbnail?: Express.Multer.File,
  ) {
    const attachment = await this.uploadService.uploadAttachment(conversationId, file, thumbnail);

    if (dto.duration_seconds) {
      (attachment as any).duration_seconds = dto.duration_seconds;
    }

    const message = await this.messageModel.create({
      conversation: new Types.ObjectId(conversationId),
      sender: new Types.ObjectId(userId),
      type: dto.type,
      content: dto.content || '',
      attachments: [attachment],
      reply_to: dto.reply_to ? new Types.ObjectId(dto.reply_to) : undefined,
      status: { sent_at: new Date() },
    });

    // Update conversation last_message
    const contentPreview = this.getAttachmentPreview(dto.type);
    const conversation = await this.conversationModel.findById(conversationId);
    if (conversation) {
      const unreadCounts = conversation.unread_counts || new Map();
      conversation.participants.forEach((p) => {
        const pId = p.user.toString();
        if (pId !== userId) {
          unreadCounts.set(pId, (unreadCounts.get(pId) || 0) + 1);
        }
      });

      await this.conversationModel.findByIdAndUpdate(conversationId, {
        last_message: {
          content: contentPreview,
          sender: new Types.ObjectId(userId),
          sent_at: new Date(),
          type: dto.type,
        },
        unread_counts: unreadCounts,
      });
    }

    await this.auditService.log({
      action: AuditAction.MESSAGE_SENT,
      actor: userId,
      actor_type: userType,
      conversation: conversationId,
      message: message._id.toString(),
      metadata: {
        attachment_name: attachment.original_name,
        attachment_size: attachment.size_bytes,
        attachment_type: attachment.mime_type,
      },
    });

    const populated = await this.messageModel
      .findById(message._id)
      .populate('sender', 'profile.first_name profile.last_name profile.profile_photo user_type')
      .populate('reply_to', 'content type sender');

    await this.resolveMessageUrls(populated);
    return populated;
  }

  /**
   * Mark all messages in a conversation as read for a user
   */
  async markAsRead(userId: string, userType: string, conversationId: string) {
    await this.messageModel.updateMany(
      {
        conversation: new Types.ObjectId(conversationId),
        sender: { $ne: new Types.ObjectId(userId) },
        'status.read_at': null,
        is_deleted: false,
      },
      {
        $set: { 'status.read_at': new Date(), 'status.delivered_at': new Date() },
      },
    );

    // Reset unread count for this user
    await this.conversationModel.findByIdAndUpdate(conversationId, {
      $set: { [`unread_counts.${userId}`]: 0 },
    });

    await this.auditService.log({
      action: AuditAction.MESSAGE_READ,
      actor: userId,
      actor_type: userType,
      conversation: conversationId,
    });

    return { success: true };
  }

  /**
   * Soft-delete a message
   */
  async deleteMessage(userId: string, userType: string, messageId: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.sender.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageModel.findByIdAndUpdate(messageId, {
      is_deleted: true,
      deleted_at: new Date(),
      deleted_by: new Types.ObjectId(userId),
    });

    await this.auditService.log({
      action: AuditAction.MESSAGE_DELETED,
      actor: userId,
      actor_type: userType,
      conversation: message.conversation.toString(),
      message: messageId,
    });

    return { success: true, conversation_id: message.conversation.toString() };
  }

  /**
   * Get presigned download URL for an attachment
   */
  async getDownloadUrl(
    userId: string,
    userType: string,
    conversationId: string,
    messageId: string,
  ) {
    const message = await this.messageModel.findOne({
      _id: new Types.ObjectId(messageId),
      conversation: new Types.ObjectId(conversationId),
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (!message.attachments || message.attachments.length === 0) {
      throw new BadRequestException('Message has no attachments');
    }

    const attachment = message.attachments[0];
    const downloadUrl = await this.uploadService.getDownloadUrl(attachment.url);

    await this.auditService.log({
      action: AuditAction.FILE_DOWNLOADED,
      actor: userId,
      actor_type: userType,
      conversation: conversationId,
      message: messageId,
      metadata: {
        file_name: attachment.original_name,
        mime_type: attachment.mime_type,
      },
    });

    return {
      url: downloadUrl,
      original_name: attachment.original_name,
      mime_type: attachment.mime_type,
      size_bytes: attachment.size_bytes,
    };
  }

  // ===================== CONSENT =====================

  /**
   * Record messaging consent for a user
   */
  async recordConsent(userId: string, ipAddress: string) {
    // Add consent to all active conversations for this user
    await this.conversationModel.updateMany(
      { 'participants.user': new Types.ObjectId(userId) },
      {
        $addToSet: {
          consent_given: {
            user: new Types.ObjectId(userId),
            given_at: new Date(),
            ip_address: ipAddress,
          },
        },
      },
    );

    await this.auditService.log({
      action: AuditAction.CONSENT_GIVEN,
      actor: userId,
      actor_type: 'user',
      metadata: { ip_address: ipAddress },
    });

    return { success: true };
  }

  /**
   * Check if user has given consent
   */
  async hasConsent(userId: string): Promise<boolean> {
    const conversation = await this.conversationModel.findOne({
      'participants.user': new Types.ObjectId(userId),
      'consent_given.user': new Types.ObjectId(userId),
    });
    return !!conversation;
  }

  // ===================== RESTRICTIONS =====================

  /**
   * Get the user's current messaging restrictions, auto-clearing expired ones
   */
  async getUserRestrictions(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('messaging_restrictions')
      .lean();

    if (!user?.messaging_restrictions) {
      return { status: 'none', message_cap: { enabled: false } };
    }

    const r = user.messaging_restrictions;
    const now = new Date();

    // Auto-clear expired restriction
    if (r.status !== 'none' && r.expires_at && new Date(r.expires_at) <= now) {
      await this.userModel.updateOne(
        { _id: userId },
        {
          $set: {
            'messaging_restrictions.status': 'none',
            'messaging_restrictions.reason': null,
            'messaging_restrictions.restricted_by': null,
            'messaging_restrictions.restricted_at': null,
            'messaging_restrictions.expires_at': null,
          },
        },
      );
      return {
        status: 'none',
        message_cap: r.message_cap || { enabled: false },
      };
    }

    // Reset message cap if period expired
    if (r.message_cap?.enabled && r.message_cap.period_start) {
      let needsReset = false;
      const periodStart = new Date(r.message_cap.period_start);

      if (r.message_cap.period === 'daily') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        needsReset = periodStart < startOfToday;
      } else if (r.message_cap.period === 'monthly') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        needsReset = periodStart < startOfMonth;
      }

      if (needsReset) {
        await this.userModel.updateOne(
          { _id: userId },
          {
            $set: {
              'messaging_restrictions.message_cap.current_count': 0,
              'messaging_restrictions.message_cap.period_start': now,
            },
          },
        );
        r.message_cap.current_count = 0;
        r.message_cap.period_start = now;
      }
    }

    return r;
  }

  // ===================== PRESENCE =====================

  /**
   * Get presence info for a user's conversation partners
   */
  async getPresenceInfo(userId: string, onlineUserIds: string[]) {
    const conversations = await this.conversationModel
      .find({
        'participants.user': new Types.ObjectId(userId),
        is_active: true,
      })
      .populate('participants.user', 'profile.first_name profile.last_name last_login_at');

    const partnerIds = new Set<string>();
    const presenceMap: Record<string, any> = {};

    conversations.forEach((conv) => {
      conv.participants.forEach((p: any) => {
        const pId = p.user?._id?.toString();
        if (pId && pId !== userId && !partnerIds.has(pId)) {
          partnerIds.add(pId);
          presenceMap[pId] = {
            user_id: pId,
            name: `${p.user?.profile?.first_name || ''} ${p.user?.profile?.last_name || ''}`.trim(),
            status: onlineUserIds.includes(pId) ? 'online' : 'offline',
            last_seen: p.user?.last_login_at || null,
          };
        }
      });
    });

    return Object.values(presenceMap);
  }

  // ===================== USER SEARCH =====================

  /**
   * Search users by name or email for starting a new conversation
   */
  async searchUsers(userId: string, query: string) {
    const db = this.conversationModel.db;
    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const users = await db
      .collection('users')
      .find({
        _id: { $ne: new Types.ObjectId(userId) },
        status: 'Active',
        user_type: { $in: ['Patient', 'Specialist', 'Admin'] },
        $or: [
          { 'profile.first_name': searchRegex },
          { 'profile.last_name': searchRegex },
          { 'profile.contact.email': searchRegex },
        ],
      })
      .project({
        _id: 1,
        user_type: 1,
        'profile.first_name': 1,
        'profile.last_name': 1,
        'profile.profile_photo': 1,
        'profile.contact.email': 1,
        'professional_practice.category': 1,
        'professional_practice.area_of_specialty': 1,
      })
      .limit(20)
      .toArray();

    const results = await Promise.all(
      users.map(async (u: any) => ({
        _id: u._id,
        user_type: u.user_type,
        email: u.profile?.contact?.email,
        profile: {
          first_name: u.profile?.first_name,
          last_name: u.profile?.last_name,
          profile_photo: u.profile?.profile_photo
            ? await this.fileUploadHelper.resolveProfileImage(u.profile.profile_photo).catch(() => null)
            : null,
        },
        specialty: u.professional_practice?.area_of_specialty || u.professional_practice?.category || null,
      })),
    );
    return results;
  }

  /**
   * Get "My Contacts" — specialists the patient has had appointments with,
   * or patients the specialist has had appointments with
   */
  async getMyContacts(userId: string, userType: string) {
    const db = this.conversationModel.db;
    const userObjectId = new Types.ObjectId(userId);
    const isPatient = userType?.toLowerCase() !== 'specialist';

    // Find unique contact IDs from appointments
    const matchField = isPatient ? 'patient' : 'specialist';
    const contactField = isPatient ? 'specialist' : 'patient';

    const appointments = await db
      .collection('appointments')
      .aggregate([
        { $match: { [matchField]: userObjectId } },
        { $group: { _id: `$${contactField}` } },
      ])
      .toArray();

    const contactIds = appointments.map((a: any) => a._id);

    if (contactIds.length === 0) return [];

    const contacts = await db
      .collection('users')
      .find({
        _id: { $in: contactIds },
        status: 'Active',
      })
      .project({
        _id: 1,
        user_type: 1,
        'profile.first_name': 1,
        'profile.last_name': 1,
        'profile.profile_photo': 1,
        'profile.contact.email': 1,
        'professional_practice.category': 1,
        'professional_practice.area_of_specialty': 1,
      })
      .toArray();

    const results = await Promise.all(
      contacts.map(async (u: any) => ({
        _id: u._id,
        user_type: u.user_type,
        email: u.profile?.contact?.email,
        profile: {
          first_name: u.profile?.first_name,
          last_name: u.profile?.last_name,
          profile_photo: u.profile?.profile_photo
            ? await this.fileUploadHelper.resolveProfileImage(u.profile.profile_photo).catch(() => null)
            : null,
        },
        specialty: u.professional_practice?.area_of_specialty || u.professional_practice?.category || null,
      })),
    );
    return results;
  }

  // ===================== WELCOME MESSAGE =====================

  /**
   * Send a welcome message from Admin if the user hasn't received one yet.
   * Called lazily on first GET /conversations request.
   */
  async sendWelcomeMessageIfNeeded(userId: string, userType: string): Promise<void> {
    const adminUserId = process.env.WELCOME_ADMIN_USER_ID;
    if (!adminUserId) return;

    // Only for Patients and Specialists
    if (!['Patient', 'Specialist'].includes(userType)) return;

    // Quick check: already welcomed?
    const user = await this.userModel
      .findById(userId)
      .select('welcome_message_sent profile.first_name profile.last_name')
      .lean();

    if (!user || user.welcome_message_sent) return;

    try {
      // Check if conversation with admin already exists
      const existingConv = await this.conversationModel.findOne({
        'participants.user': {
          $all: [new Types.ObjectId(userId), new Types.ObjectId(adminUserId)],
        },
        is_active: true,
      });

      if (existingConv) {
        // Already has a conversation with admin — just set the flag
        await this.userModel.updateOne(
          { _id: new Types.ObjectId(userId) },
          { $set: { welcome_message_sent: true } },
        );
        return;
      }

      // Create conversation between user and admin
      const myRole = this.mapUserTypeToRole(userType);
      const convType =
        userType === 'Specialist'
          ? ConversationType.SPECIALIST_ADMIN
          : ConversationType.PATIENT_ADMIN;

      const conversation = await this.conversationModel.create({
        participants: [
          { user: new Types.ObjectId(adminUserId), role: ParticipantRole.ADMIN },
          { user: new Types.ObjectId(userId), role: myRole },
        ],
        type: convType,
        unread_counts: new Map([
          [adminUserId, 0],
          [userId, 1],
        ]),
        consent_given: [],
      });

      // Build personalized welcome message
      const firstName = user.profile?.first_name || 'there';
      const lastName = user.profile?.last_name || '';
      const content = this.buildWelcomeMessage(userType, firstName, lastName);

      // Send welcome message from admin
      const message = await this.messageModel.create({
        conversation: conversation._id,
        sender: new Types.ObjectId(adminUserId),
        type: MessageType.TEXT,
        content,
        status: { sent_at: new Date() },
      });

      // Update conversation's last_message
      await this.conversationModel.findByIdAndUpdate(conversation._id, {
        last_message: {
          content: content.substring(0, 100) + '...',
          sender: new Types.ObjectId(adminUserId),
          sent_at: new Date(),
          type: 'text',
        },
      });

      // Mark user as welcomed
      await this.userModel.updateOne(
        { _id: new Types.ObjectId(userId) },
        { $set: { welcome_message_sent: true } },
      );

      this.logger.log(
        `Welcome message sent to ${userType} ${userId} (conv: ${conversation._id})`,
      );
    } catch (err) {
      // Don't let welcome message failure break the conversations endpoint
      this.logger.error(`Failed to send welcome message to ${userId}: ${err.message}`);
    }
  }

  private buildWelcomeMessage(
    userType: string,
    firstName: string,
    lastName: string,
  ): string {
    if (userType === 'Specialist') {
      return `Welcome to Rapid Capsule Messaging!\n\nHi Dr. ${lastName}, welcome to the platform! I'm your Admin support contact — feel free to reach out anytime for assistance with your practice, patient communications, or platform features.\n\nA few guidelines for messaging:\n\n• Keep all conversations respectful and professional\n• Avoid sharing sensitive details like passwords or payment information\n• For urgent medical emergencies, always direct patients to call emergency services\n• We typically respond within 24 hours on business days\n• You can share images, documents, and files for seamless collaboration\n\nWe're excited to have you as part of the Rapid Capsule network. Don't hesitate to reach out!\n\n— Rapid Capsule Support`;
    }

    return `Welcome to Rapid Capsule Messaging!\n\nHi ${firstName}, we're glad to have you here! I'm your dedicated support contact — feel free to reach out anytime with questions, feedback, or if you need help navigating the platform.\n\nA few guidelines for messaging:\n\n• Keep all conversations respectful and professional\n• Avoid sharing sensitive details like passwords or payment information\n• For urgent medical emergencies, always call your local emergency services first\n• We typically respond within 24 hours on business days\n• You can share images, documents, and files to help us assist you better\n\nWe're here to make your healthcare journey as smooth as possible. Don't hesitate to send a message!\n\n— Rapid Capsule Support`;
  }

  // ===================== HELPERS =====================

  /**
   * Resolve S3 profile photos to presigned URLs for populated user objects
   */
  private async resolveProfilePhotosForConversation(conversation: any) {
    if (!conversation?.participants) return conversation;
    for (const p of conversation.participants) {
      if (p.user?.profile?.profile_photo) {
        try {
          const url = await this.fileUploadHelper.resolveProfileImage(p.user.profile.profile_photo);
          if (url) p.user.profile.profile_photo = url;
        } catch {}
      }
    }
    return conversation;
  }

  private async resolveProfilePhotoForMessage(message: any) {
    if (message?.sender?.profile?.profile_photo) {
      try {
        const url = await this.fileUploadHelper.resolveProfileImage(message.sender.profile.profile_photo);
        if (url) message.sender.profile.profile_photo = url;
      } catch {}
    }
    return message;
  }

  /**
   * Resolve S3 attachment URLs to presigned URLs for a message
   */
  private async resolveAttachmentUrls(message: any) {
    if (!message?.attachments?.length) return message;
    for (const att of message.attachments) {
      if (att.url) {
        try {
          att.url = await this.fileUploadHelper.getPresignedUrl(
            att.url,
            3600,
            att.mime_type || undefined,
          );
        } catch (e) {
          this.logger.error(`Error presigning attachment URL: ${e}`);
        }
      }
      if (att.thumbnail_url) {
        try {
          att.thumbnail_url = await this.fileUploadHelper.getPresignedUrl(
            att.thumbnail_url,
            3600,
            'image/jpeg',
          );
        } catch (e) {
          this.logger.error(`Error presigning thumbnail URL: ${e}`);
        }
      }
    }
    return message;
  }

  /**
   * Resolve all S3 URLs (profile photos + attachments) for a message
   */
  private async resolveMessageUrls(message: any) {
    await this.resolveProfilePhotoForMessage(message);
    await this.resolveAttachmentUrls(message);
    return message;
  }

  private async populateConversation(conversation: ConversationDocument) {
    const populated = await this.conversationModel
      .findById(conversation._id)
      .populate('participants.user', 'profile.first_name profile.last_name profile.profile_photo email user_type');
    return this.resolveProfilePhotosForConversation(populated);
  }

  /**
   * Fetch OG link previews for a message. Returns the updated message if previews were found.
   */
  async processLinkPreviews(messageId: string): Promise<any | null> {
    try {
      const previews = await this.linkPreviewService.processMessageLinks(messageId);
      if (previews.length > 0) {
        const updatedMessage = await this.messageModel
          .findById(messageId)
          .populate('sender', 'profile.first_name profile.last_name profile.profile_photo user_type')
          .populate('reply_to', 'content type sender');
        await this.resolveMessageUrls(updatedMessage);
        return updatedMessage;
      }
      return null;
    } catch (err) {
      this.logger.error(`Link preview processing error: ${err.message}`);
      return null;
    }
  }

  private getAttachmentPreview(type: MessageType): string {
    switch (type) {
      case MessageType.IMAGE:
        return '📷 Photo';
      case MessageType.VIDEO:
        return '🎥 Video';
      case MessageType.VOICE_NOTE:
        return '🎤 Voice note';
      case MessageType.FILE:
        return '📎 File';
      default:
        return '📎 Attachment';
    }
  }
}
