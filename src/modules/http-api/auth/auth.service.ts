import { PhoneDto } from './dto/phone.dto';
import { Injectable } from '@nestjs/common';
import { VerifyOtpCodeDto } from './dto/verify-otp-code.dto';
import { randomUUID } from 'crypto';
import { parse } from 'cookie';
import { PrismaService } from 'src/common/services/prisma/prisma.service';
import { JwtService } from 'src/common/services/jwt/jwt.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async sendOtp({ phone }: PhoneDto) {
    try {
      const code = Math.floor(10000 + Math.random() * 90000).toString();

      await fetch('http://ippanel.com/api/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          op: 'pattern',
          user: process.env.FARAZSMS_USER,
          pass: process.env.FARAZSMS_PASS,
          fromNum: process.env.FARAZSMS_FROM_NUM,
          toNum: phone,
          patternCode: process.env.FARAZSMS_PATTERN_CODE,
          inputData: [{ 'verification-code': code }],
        }),
      });


      await this.prismaService.otp.deleteMany({ where: { phone } });
      await this.prismaService.otp.create({ data: { code, phone } });

      return { status: 200, message: 'کد ارسال شد' };
    } catch (error) {
      return { status: 500, message: 'خطا در ارسال کد' };
    }
  }

  async verifyOtp({ code, phone }: VerifyOtpCodeDto) {
    const otp = await this.prismaService.otp.findUnique({
      where: { phone },
    });

    if (!otp) {
      return { message: 'کد تأیید منقضی شده یا پیدا نشد', status: 403 };
    }

    if (otp.code != code) {
      return { message: 'کد تأیید نامعتبر است', status: 401 };
    }

    await this.prismaService.otp.delete({ where: { phone } });

    let user = await this.prismaService.user.findUnique({
      where: { phone },
    });

    if (!user) {
      let username: string = '';

      while (true) {
        username = Math.random().toString(36).substring(2, 10);

        const isExist = await this.prismaService.user.findUnique({
          where: { username },
        });

        if (!isExist) break;
      }

      user = await this.prismaService.user.create({
        data: {
          username,
          phone,
        },
      });
    }

    const sessionId = randomUUID();

    const refreshToken = this.jwtService.signRefreshToken({
      id: user.id,
    });

    const accessToken = this.jwtService.signAccessToken({
      id: user.id,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prismaService.session.create({
      data: {
        sessionId,
        refreshToken,
        expiresAt,
      },
    });

    return {
      message: 'ورود با موفقیت انجام شد',
      status: 200,
      accessToken,
      sessionId,
    };
  }

  async refreshToken(cookies: any) {
    try {
      const { access_token, session_id } = cookies;

      try {
        this.jwtService.verifyAccessToken(access_token);
        return { status: 200 };
      } catch {}

      if (!session_id) {
        return { status: 403, message: 'لطفاً وارد حساب شوید' };
      }

      const session = await this.prismaService.session.findUnique({
        where: { sessionId: session_id },
      });

      if (!session?.expiresAt || Date.now() > session?.expiresAt.getTime()) {
        return { status: 403, message: 'لطفاً وارد حساب شوید' };
      }

      try {
        const sessionPayload = this.jwtService.verifyRefreshToken(
          session.refreshToken,
        );

        const newAccessToken = this.jwtService.signAccessToken({
          id: sessionPayload.id,
          role: sessionPayload.role,
        });

        return {
          status: 200,
          newAccessToken,
        };
      } catch {
        return {
          status: 403,
          message: 'توکن نامعتبر است. لطفاً دوباره وارد شوید',
        };
      }
    } catch (error) {
      return {
        status: 500,
        message: 'اینترنت خود را بررسی کنید',
      };
    }
  }

  async logout(rawCookies: string) {
    const { session_id } = parse(rawCookies || '');

    if (!session_id) {
      return { status: 400, message: 'شناسه نشست پیدا نشد' };
    }

    await this.prismaService.session.delete({
      where: { sessionId: session_id },
    });

    return { status: 200, message: 'با موفقیت خارج شدید' };
  }
}
