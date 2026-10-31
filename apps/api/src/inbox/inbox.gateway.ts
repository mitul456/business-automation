import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WsMessageEvent, WsConversationUpdateEvent } from '@omniflow/shared';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class InboxGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(InboxGateway.name);

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      client.join(`tenant:${tenantId}`);
      this.logger.log(`Client ${client.id} joined room tenant:${tenantId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join:conversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string
  ) {
    client.join(`conversation:${conversationId}`);
    return { status: 'joined', conversationId };
  }

  @SubscribeMessage('leave:conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string
  ) {
    client.leave(`conversation:${conversationId}`);
    return { status: 'left', conversationId };
  }

  /**
   * Broadcast message to conversation room and tenant inbox
   */
  emitNewMessage(event: WsMessageEvent) {
    this.server.to(`conversation:${event.conversationId}`).emit('message:new', event);
    this.server.to(`tenant:${event.tenantId}`).emit('inbox:message_received', event);
  }

  /**
   * Broadcast conversation state changes (status, unread count, assignment)
   */
  emitConversationUpdate(event: WsConversationUpdateEvent) {
    this.server.to(`tenant:${event.tenantId}`).emit('conversation:updated', event);
  }
}
