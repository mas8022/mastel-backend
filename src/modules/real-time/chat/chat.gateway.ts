import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { SendMessageDto } from './dto/send-message';
import { UseGuards } from '@nestjs/common';
import { UserGuard } from './user.guard';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';

@UseGuards(UserGuard)
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL, credentials: true },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer() server: Server;

  async handleConnection(client: Socket) {
    this.chatService.sendOnlineStatus(this.server, client, true);
  }

  async handleDisconnect(client: Socket) {
    this.chatService.sendOnlineStatus(this.server, client, false);
  }

  @SubscribeMessage('get-online-status-contact')
  async getOnlineStatusContact(
    @ConnectedSocket() client: Socket,
    @MessageBody() contactId: string,
  ) {
    this.chatService.getOnlineStatusContact(this.server, client, contactId);
  }

  @SubscribeMessage('send-message')
  sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SendMessageDto,
  ) {
    this.chatService.sendMessage(this.server, client, data);
  }

  @SubscribeMessage('get-messages')
  async getMessages(
    @ConnectedSocket() client: Socket,
    @MessageBody() { contactId }: { contactId: string },
  ) {
    this.chatService.getMessages(this.server, client, contactId);
  }

  @SubscribeMessage('delete-message')
  async deleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: DeleteMessageDto,
  ) {
    this.chatService.deleteMessage(this.server, client, body);
  }

  @SubscribeMessage('edit-message')
  async editMessage(
    @ConnectedSocket() client:Socket,
    @MessageBody() body: EditMessageDto,
  ) {
    this.chatService.editMessage(this.server, client, body);
  }
}
