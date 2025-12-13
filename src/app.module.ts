import { Module } from '@nestjs/common';
import { PrismaModule } from './common/services/prisma/prisma.module';
import { JwtModule } from './common/services/jwt/jwt.module';
import { AuthModule } from './modules/http-api/auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UsersModule } from './module/http-api/users/users.module';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 20,
        },
      ],
      ignoreUserAgents: [/googlebot/i],
    }),
    PrismaModule,
    JwtModule,
    AuthModule,
    UsersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
