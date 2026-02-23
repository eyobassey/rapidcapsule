import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ namespace: 'websockets', cors: true })
export class WebsocketGateway implements OnGatewayConnection {
  private readonly logger = new Logger(WebsocketGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(userId);
      this.logger.debug(`Client ${client.id} joined room ${userId}`);
    }
  }

  @SubscribeMessage('event')
  handleEvent(@MessageBody() data: any): void {
    this.server.emit('event', data);
  }

  /**
   * Emit a health sync event to a specific user.
   * Events: health:sync:started, health:sync:completed, health:sync:failed, health:data:new
   */
  emitToUser(userId: string, event: string, data: any): void {
    this.server.to(userId).emit(event, data);
  }
}
