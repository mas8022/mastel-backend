import { Injectable } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { UsersService } from 'src/modules/http-api/users/users.service';
import { DeleteMessageDto } from './dto/delete-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';
import { getVideoDurationInSeconds } from 'get-video-duration';
import { RedisService } from 'src/common/services/redis/redis.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UsersService,
    private readonly redisService: RedisService,
  ) {}

  async sendOnlineStatus(server: Server, client: Socket, isOnline: boolean) {
    const rawCookies: any = client.handshake.headers.cookie;
    const me: any = await this.userService.getMe(rawCookies);
    if (!me) return;

    const socketsKey = `user:${me.id}:sockets`;
    const onlineKey = `user:${me.id}:online`;

    if (isOnline) {
      // add socket
      await this.redisService.client.sadd(socketsKey, client.id);
      await this.redisService.client.set(onlineKey, '1');
    } else {
      // remove socket
      await this.redisService.client.srem(socketsKey, client.id);

      const count = await this.redisService.client.scard(socketsKey);
      if (count === 0) {
        await this.redisService.client.set(onlineKey, '0');
      }
    }

    // پیدا کردن مخاطبین
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

    // اطلاع دادن وضعیت آنلاین
    for (const contactId of contactsId) {
      const contactSocketsKey = `user:${contactId}:sockets`;
      const sockets =
        await this.redisService.client.smembers(contactSocketsKey);

      for (const socketId of sockets) {
        server.to(socketId).emit('get-online-status', {
          userId: me.id,
          isOnline,
        });
      }
    }
  }

  async getOnlineStatusContact(client: Socket, contactId: string) {
    const onlineKey = `user:${contactId}:online`;
    const isOnline = (await this.redisService.client.get(onlineKey)) === '1';

    client.emit('get-online-status-contact', {
      userId: contactId,
      isOnline,
    });
  }

  async sendMessage(server: Server, client: Socket, data: SendMessageDto) {
    const me = client.data.user;

    const senderId = me.id;
    const receiverId = Number(data.contactId);

    const fileUrl = `${process.env.LIARA_ENDPOINT}/${process.env.LIARA_BUCKET_NAME}/${data.fileKey}`;

    let duration: any = null;
    if (data.type === 'VIDEO' || data.type === 'VOICE') {
      duration = await getVideoDurationInSeconds(fileUrl).then((result: any) =>
        Math.round(result),
      );
    }

    const isExistContact = await this.prismaService.contact.findFirst({
      where: {
        OR: [
          { firstUserId: senderId, secondUserId: receiverId },
          { firstUserId: receiverId, secondUserId: senderId },
        ],
      },
    });

    if (!isExistContact) {
      await this.prismaService.contact.create({
        data: { firstUserId: senderId, secondUserId: receiverId },
      });
    }

    await this.prismaService.message.create({
      data: {
        type: data.type,
        text: data.text,
        fileUrl,
        fileKey: data.fileKey,
        mimeType: data.mimeType,
        size: data.size,
        duration,
        senderId,
        receiverId,
        replyToId: data.replyToId ?? null,
      },
    });

    this.getMessages(server, client, data.contactId);
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
      include: {
        replyTo: true,
      },
    });

    const room1 = `${senderId}-${receiverId}`;
    const room2 = `${receiverId}-${senderId}`;

    client.join(room1);
    client.join(room2);

    server.to(room1).to(room2).emit('get-messages', messages);
  }

  async deleteMessage(server: Server, client: Socket, body: DeleteMessageDto) {
    const { contactId, messageId } = body;

    await this.prismaService.message.delete({
      where: { id: Number(messageId), senderId: client.data.user.id },
    });

    this.getMessages(server, client, contactId);
  }

  async editMessage(
    server: Server,
    client: Socket,
    { messageId, text, contactId }: EditMessageDto,
  ) {
    await this.prismaService.message.update({
      where: { id: messageId },
      data: { text },
    });

    this.getMessages(server, client, contactId);
  }
}
