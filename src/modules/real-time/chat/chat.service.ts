import { Injectable } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { UsersService } from 'src/modules/http-api/users/users.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userservice: UsersService,
  ) {}

  async sendMessage(
    server: Server,
    client: Socket,
    { contactId, message }: SendMessageDto,
  ) {
    const rawCookie: any = client.handshake.headers.cookie;

    const me: any = await this.userservice.getMe(rawCookie);

    const senderId = me.id;
    const receiverId = Number(contactId);

    await this.prismaService.message.create({
      data: { text: message, senderId, receiverId },
    });

    const messages = await this.prismaService.message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    const room1 = `${senderId}-${receiverId}`;
    const room2 = `${receiverId}-${senderId}`;

    server.to(room1).to(room2).emit('get-messages', messages);
  }

  async getMessages(server: Server, client: Socket, contactId: string) {
    const rawCookie: any = client.handshake.headers.cookie;

    const me: any = await this.userservice.getMe(rawCookie);

    const senderId = me.id;
    const receiverId = Number(contactId);

    const messages = await this.prismaService.message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    const room1 = `${senderId}-${receiverId}`;
    const room2 = `${receiverId}-${senderId}`;

    client.join(room1);
    client.join(room2);

    server.to(room1).to(room2).emit('get-messages', messages);
  }
}
