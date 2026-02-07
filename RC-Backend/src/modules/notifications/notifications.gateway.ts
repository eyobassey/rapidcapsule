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

interface ConnectedUser {
  socketId: string;
  userId: string;
  userType: string;
  connectedAt: Date;
}

@WebSocketGateway({
  namespace: 'notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers: Map<string, ConnectedUser[]> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      const userId = client.handshake.query?.userId as string;

      if (!userId) {
        this.logger.warn(`Client ${client.id} connected without userId`);
        client.disconnect();
        return;
      }

      // Optionally verify token
      let userType = 'patient';
      if (token) {
        try {
          const decoded = this.jwtService.verify(token as string);
          userType = decoded.user_type || 'patient';
        } catch (err) {
          this.logger.warn(`Invalid token for client ${client.id}`);
        }
      }

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

      this.logger.log(`User ${userId} connected (socket: ${client.id})`);

      // Send acknowledgment
      client.emit('connected', {
        message: 'Connected to notifications',
        socketId: client.id,
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query?.userId as string;

    if (userId) {
      const userConnections = this.connectedUsers.get(userId) || [];
      const updatedConnections = userConnections.filter((conn) => conn.socketId !== client.id);

      if (updatedConnections.length > 0) {
        this.connectedUsers.set(userId, updatedConnections);
      } else {
        this.connectedUsers.delete(userId);
      }

      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    if (data.userId) {
      client.join(`user:${data.userId}`);
      this.logger.log(`Client ${client.id} subscribed to user:${data.userId}`);
    }
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ): void {
    if (data.userId) {
      client.leave(`user:${data.userId}`);
      this.logger.log(`Client ${client.id} unsubscribed from user:${data.userId}`);
    }
  }

  // Send notification to a specific user
  sendToUser(userId: string, event: string, data: any): void {
    this.server.to(`user:${userId}`).emit(event, data);
    this.logger.debug(`Sent ${event} to user ${userId}`);
  }

  // Send notification to multiple users
  sendToUsers(userIds: string[], event: string, data: any): void {
    userIds.forEach((userId) => {
      this.sendToUser(userId, event, data);
    });
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any): void {
    this.server.emit(event, data);
    this.logger.debug(`Broadcast ${event} to all clients`);
  }

  // Broadcast to a specific user type
  broadcastToUserType(userType: string, event: string, data: any): void {
    this.connectedUsers.forEach((connections, userId) => {
      const matchingConnections = connections.filter((conn) => conn.userType === userType);
      if (matchingConnections.length > 0) {
        this.sendToUser(userId, event, data);
      }
    });
  }

  // Get online status of a user
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get count of connected users
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get all connected user IDs
  getConnectedUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}
