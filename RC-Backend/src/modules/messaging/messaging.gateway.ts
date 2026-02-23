import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from './entities/conversation.entity';
import { Message, MessageDocument } from './entities/message.entity';

interface ConnectedUser {
  socketId: string;
  userId: string;
  userType: string;
  connectedAt: Date;
}

@WebSocketGateway({
  namespace: 'messaging',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagingGateway.name);
  private connectedUsers: Map<string, ConnectedUser[]> = new Map();
  private heartbeats: Map<string, Date> = new Map();
  private disconnectTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private jwtService: JwtService,
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      let decoded: any;
      try {
        decoded = this.jwtService.verify(token as string);
      } catch (err) {
        this.logger.warn(`Invalid token for client ${client.id}`);
        client.disconnect();
        return;
      }

      const userId = decoded.sub;
      const userType = decoded.user_type || 'patient';

      // Store userId on socket for later use
      (client as any).userId = userId;
      (client as any).userType = userType;

      // Join user-specific room
      client.join(`user:${userId}`);

      // Track connected user
      const userConnections = this.connectedUsers.get(userId) || [];
      userConnections.push({
        socketId: client.id,
        userId,
        userType,
        connectedAt: new Date(),
      });
      this.connectedUsers.set(userId, userConnections);
      this.heartbeats.set(userId, new Date());

      // Cancel any pending disconnect timer
      const timer = this.disconnectTimers.get(userId);
      if (timer) {
        clearTimeout(timer);
        this.disconnectTimers.delete(userId);
      }

      // Auto-join all conversation rooms
      const conversations = await this.conversationModel.find({
        'participants.user': new Types.ObjectId(userId),
        is_active: true,
      });

      conversations.forEach((conv) => {
        client.join(`conversation:${conv._id}`);
      });

      this.logger.log(`User ${userId} connected to messaging (socket: ${client.id})`);

      // Notify conversation partners about online status
      await this.broadcastPresence(userId, 'online');

      // Build initial presence map of all conversation partners for this user
      const partnerPresence: Record<string, string> = {};
      conversations.forEach((conv) => {
        conv.participants.forEach((p) => {
          const pId = p.user.toString();
          if (pId !== userId && !partnerPresence[pId]) {
            partnerPresence[pId] = this.connectedUsers.has(pId) ? 'online' : 'offline';
          }
        });
      });

      client.emit('connected', {
        message: 'Connected to messaging',
        socketId: client.id,
        conversations: conversations.map((c) => c._id.toString()),
        presence: partnerPresence,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (!userId) return;

    const userConnections = this.connectedUsers.get(userId) || [];
    const updatedConnections = userConnections.filter((conn) => conn.socketId !== client.id);

    if (updatedConnections.length > 0) {
      this.connectedUsers.set(userId, updatedConnections);
    } else {
      // All connections for this user are gone — debounce offline status
      this.disconnectTimers.set(
        userId,
        setTimeout(async () => {
          this.connectedUsers.delete(userId);
          this.heartbeats.delete(userId);
          this.disconnectTimers.delete(userId);
          await this.broadcastPresence(userId, 'offline');
        }, 10000), // 10-second debounce
      );
    }

    this.logger.log(`User ${userId} disconnected from messaging (socket: ${client.id})`);
  }

  @SubscribeMessage('join_conversations')
  async handleJoinConversations(
    @MessageBody() data: { conversationIds: string[] },
    @ConnectedSocket() client: Socket,
  ) {
    if (data.conversationIds) {
      data.conversationIds.forEach((id) => {
        client.join(`conversation:${id}`);
      });
    }
  }

  @SubscribeMessage('typing_start')
  handleTypingStart(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client as any).userId;
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client as any).userId;
    client.to(`conversation:${data.conversationId}`).emit('user_typing', {
      conversationId: data.conversationId,
      userId,
      isTyping: false,
    });
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() data: { conversationId: string; messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = (client as any).userId;

    // Update read status in DB
    await this.messageModel.updateMany(
      {
        conversation: new Types.ObjectId(data.conversationId),
        sender: { $ne: new Types.ObjectId(userId) },
        _id: { $lte: new Types.ObjectId(data.messageId) },
        'status.read_at': null,
      },
      {
        $set: { 'status.read_at': new Date(), 'status.delivered_at': new Date() },
      },
    );

    // Reset unread count
    await this.conversationModel.findByIdAndUpdate(data.conversationId, {
      $set: { [`unread_counts.${userId}`]: 0 },
    });

    // Notify other participants
    client.to(`conversation:${data.conversationId}`).emit('message_read', {
      conversationId: data.conversationId,
      messageId: data.messageId,
      readBy: userId,
      read_at: new Date(),
    });
  }

  @SubscribeMessage('heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      this.heartbeats.set(userId, new Date());
    }
    client.emit('heartbeat_ack', { timestamp: new Date().toISOString() });
  }

  // ===================== PUBLIC METHODS (called from service) =====================

  /**
   * Emit a new message to conversation participants
   */
  emitNewMessage(conversationId: string, message: any, conversation: any) {
    this.server.to(`conversation:${conversationId}`).emit('new_message', {
      message,
      conversation,
    });
  }

  /**
   * Emit message delivered confirmation
   */
  emitMessageDelivered(conversationId: string, messageId: string, userId: string) {
    this.server.to(`conversation:${conversationId}`).emit('message_delivered', {
      messageId,
      conversationId,
      delivered_at: new Date(),
    });
  }

  /**
   * Emit that all messages in a conversation have been read by a user
   */
  emitMessagesRead(conversationId: string, readByUserId: string) {
    this.server.to(`conversation:${conversationId}`).emit('messages_read', {
      conversationId,
      readBy: readByUserId,
      read_at: new Date(),
    });
  }

  /**
   * Emit message deleted event
   */
  emitMessageDeleted(conversationId: string, messageId: string) {
    this.server.to(`conversation:${conversationId}`).emit('message_deleted', {
      messageId,
      conversationId,
    });
  }

  /**
   * Emit conversation updated event
   */
  emitConversationUpdated(conversationId: string, conversation: any) {
    this.server.to(`conversation:${conversationId}`).emit('conversation_updated', {
      conversation,
    });
  }

  /**
   * Check if a user is currently online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get all online user IDs
   */
  getOnlineUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Notify a specific user's room
   */
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Join a user's active sockets to a conversation room
   * (used when a new conversation is created)
   */
  joinUserToConversation(userId: string, conversationId: string) {
    // Use the user-specific room to join all their sockets to the conversation room
    this.server.in(`user:${userId}`).socketsJoin(`conversation:${conversationId}`);
  }

  // ===================== PRIVATE =====================

  private async broadcastPresence(userId: string, status: 'online' | 'offline' | 'away') {
    const conversations = await this.conversationModel.find({
      'participants.user': new Types.ObjectId(userId),
      is_active: true,
    });

    const partnerIds = new Set<string>();
    conversations.forEach((conv) => {
      conv.participants.forEach((p) => {
        const pId = p.user.toString();
        if (pId !== userId) partnerIds.add(pId);
      });
    });

    const presenceData = {
      userId,
      status,
      lastSeen: status === 'offline' ? new Date() : null,
    };

    partnerIds.forEach((partnerId) => {
      this.server.to(`user:${partnerId}`).emit('presence_update', presenceData);
    });
  }
}
