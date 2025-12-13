import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { VerifyOtpCodeDto } from './dto/verify-otp-code.dto';
import { PhoneDto } from './dto/phone.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Post('verify-otp')
  async verifyOtp(@Body() body: VerifyOtpCodeDto, @Res() res: FastifyReply) {
    const { message, status, accessToken, sessionId } =
      await this.authService.verifyOtp(body);

    if (accessToken && sessionId) {
      res.setCookie('access_token', accessToken, {
        maxAge: 60 * 15,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      });

      res.setCookie('session_id', sessionId, {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return res.send({ status, message });
  }

  @Throttle({ default: { limit: 5, ttl: 60 } })
  @Post('send-otp')
  async sendOtp(@Body() body: PhoneDto, @Res() res: FastifyReply) {
    const result = await this.authService.sendOtp(body);
    return res.send(result);
  }

  @Get('refresh')
  async refreshToken(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    const { status, message, newAccessToken } =
      await this.authService.refreshToken(req.cookies);

    if (newAccessToken) {
      res.setCookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 15,
        path: '/',
      });
    }
    return res.send({ status, message });
  }

  @Delete()
  async logout(
    @Headers('cookie') rawCookies: string,
    @Res() res: FastifyReply,
  ) {
    const { status, message } = await this.authService.logout(rawCookies);

    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.clearCookie('session_id', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res.send({ message, status });
  }
}
