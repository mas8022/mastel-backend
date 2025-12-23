import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { parse } from 'cookie';
import { JwtService } from 'src/common/services/jwt/jwt.service';
import type { FastifyRequest } from 'fastify';
import { EditProfileDto } from './dto/edit-profile.dto';
import { FileValidator } from 'src/common/validators/file.validator';
import { BucketService } from 'src/common/services/bucket/bucket.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly bucketService: BucketService,
  ) {}

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

  async findUsers(search: string, req: FastifyRequest) {
    const me = req.user;

    const users = await this.prismaService.user.findMany({
      where: {
        OR: [
          { phone: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
        NOT: {
          id: me?.id,
        },
      },
      take: 5,
    });

    return { status: 200, data: users };
  }

  async getContacts(req: FastifyRequest) {
    const me = req.user;

    const rawContacts = await this.prismaService.contact.findMany({
      where: { OR: [{ firstUserId: me?.id }, { secondUserId: me?.id }] },
      select: {
        firstUser: { select: { id: true, avatar: true, username: true } },
        secondUser: { select: { id: true, avatar: true, username: true } },
      },
    });

    const contacts = rawContacts.map((item) => {
      if (item.firstUser.id !== me?.id) return item.firstUser;
      if (item.secondUser.id !== me.id) return item.secondUser;
    });

    return { status: 200, data: contacts };
  }

  async editProfile(
    req: FastifyRequest,
    files: any,
    { username, bio }: EditProfileDto,
  ) {
    const isExistUsername = await this.prismaService.user.findFirst({
      where: { username: username.trim() },
    });

    if (isExistUsername) {
      return {
        status: 405,
        message: 'این نام کاربری گرفته شده است',
      };
    }

    const me = req.user;

    let avatarAddress: string | null = null;

    if (files?.avatar?.[0]) {
      const file = files.avatar[0];

      FileValidator.validateJpgFile(file);

      avatarAddress = await this.bucketService.uploadFile(file);
    }

    const updateData: any = {
      username,
      bio,
    };

    if (avatarAddress) {
      updateData.avatar = avatarAddress;
    }

    await this.prismaService.user.update({
      where: {
        id: me?.id,
      },
      data: updateData,
    });

    return {
      status: 200,
      message: 'ویرایش با موفقیت انجام شد',
    };
  }

  async getContact(id: string) {
    const contact = await this.prismaService.user.findUnique({
      where: { id: Number(id) },
      select: {
        avatar: true,
        bio: true,
        id: true,
        username: true,
      },
    });

    if (!contact) throw new NotFoundException('این کاربر وجود ندارد');

    return { status: 200, data: contact };
  }
}
