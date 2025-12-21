import { Injectable } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { UsersService } from 'src/modules/http-api/users/users.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UsersService,
  ) {}

  private users = new Map<
    number,
    { sockets: Set<string>; isOnline: boolean }
  >();

  async sendOnlineStatus(server: Server, client: Socket, isOnline: boolean) {
    const rawCookies: any = client.handshake.headers.cookie;
    const me: any = await this.userService.getMe(rawCookies);

    if (!me) return;

    const user = this.users.get(me?.id) ?? {
      sockets: new Set<string>(),
      isOnline: false,
    };

    if (isOnline) {
      user.isOnline = true;
      user.sockets.add(client.id);
    } else {
      user.sockets.delete(client.id);

      if (user.sockets.size === 0) {
        user.isOnline = false;
      }
    }

    this.users.set(me.id, user);

    const rawContacts = await this.prismaService.contact.findMany({
      where: { OR: [{ firstUserId: me.id }, { secondUserId: me.id }] },
      select: {
        firstUser: { select: { id: true } },
        secondUser: { select: { id: true } },
      },
    });

    const contactsId = rawContacts.map((item) =>
      item.firstUser.id !== me.id ? item.firstUser.id : item.secondUser.id,
    );

    for (const contactId of contactsId) {
      const contact = this.users.get(contactId!);

      if (!contact) continue;

      for (const contactSocketId of contact.sockets) {
        server.to(contactSocketId).emit('get-online-status', {
          userId: me.id,
          isOnline: user.isOnline,
        });
      }
    }
  }

  async getOnlineStatusContact(
    server: Server,
    client: Socket,
    contactId: string,
  ) {
    const contact = this.users.get(Number(contactId));

    client.emit('get-online-status-contact', {
      userId: contactId,
      isOnline: contact?.isOnline,
    });
  }

  async sendMessage(
    server: Server,
    client: Socket,
    { contactId, message }: SendMessageDto,
  ) {
    const me = client.data.user;

    const senderId = me.id;
    const receiverId = Number(contactId);

    const isChatExist = await this.prismaService.contact.findFirst({
      where: {
        OR: [
          { firstUserId: senderId, secondUserId: receiverId },
          { firstUserId: receiverId, secondUserId: senderId },
        ],
      },
      select: { id: true },
    });

    if (!isChatExist) {
      await this.prismaService.contact.create({
        data: { firstUserId: senderId, secondUserId: receiverId },
      });
    }

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
    const me = client.data.user;

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
