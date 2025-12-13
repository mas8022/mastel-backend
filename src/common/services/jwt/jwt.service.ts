import { Injectable } from '@nestjs/common';
import { sign, verify, SignOptions } from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private readonly accessSecret = process.env.JWT_ACCESS_SECRET!;
  private readonly refreshSecret = process.env.JWT_REFRESH_SECRET!;

  private readonly accessTokenExpiresIn = '15m';
  private readonly refreshTokenExpiresIn = '7d';

  signAccessToken(payload: object): string {
    const options: SignOptions = { expiresIn: this.accessTokenExpiresIn };
    return sign(payload, this.accessSecret, options);
  }

  signRefreshToken(payload: object): string {
    const options: SignOptions = { expiresIn: this.refreshTokenExpiresIn };
    return sign(payload, this.refreshSecret, options);
  }

  verifyAccessToken<T = any>(token: string): T {
    try {
      return verify(token, this.accessSecret) as T;
    } catch {
      throw new Error('Invalid or expired access token');
    }
  }

  verifyRefreshToken<T = any>(token: string): T {
    try {
      return verify(token, this.refreshSecret) as T;
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }
}
