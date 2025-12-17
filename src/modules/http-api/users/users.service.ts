import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { parse } from 'cookie';
import { JwtService } from 'src/common/services/jwt/jwt.service';
import type { FastifyRequest } from 'fastify';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async findUsers(search: string) {
    const users = await this.prismaService.user.findMany({
      where: {
        OR: [
          { phone: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      },
      take: 5,
    });

    return { status: 200, data: users };
  }

  async getMe(rawCookies: string) {
    try {
      const { access_token }: any = parse(rawCookies || '');

      const { id } = this.jwtService.verifyAccessToken(access_token);

      const me = await this.prismaService.user.findUnique({ where: { id } });

      return me;
    } catch (error) {
      return null;
    }
  }

  async getContact(req: FastifyRequest) {
    const me = req.user;

    const chats = await this.prismaService.message.findMany({
      where: {
        OR: [{ senderId: me?.id }, { receiverId: me?.id }],
      },
      select: {
        sender: {
          select: {
            id: true,
            avatar: true,
            username: true,
          },
        },
        receiver: {
          select: {
            id: true,
            avatar: true,
            username: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    const contactsMap = new Map<number, any>();

    for (const chat of chats) {
      if (chat.sender.id !== me?.id) {
        contactsMap.set(chat.sender.id, chat.sender);
      } else if (chat.receiver.id !== me?.id) {
        contactsMap.set(chat.receiver.id, chat.receiver);
      }
    }

    const contacts = Array.from(contactsMap.values());

    return { status: 200, data: contacts };
  }
}
