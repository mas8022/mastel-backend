import { Module } from '@nestjs/common';
import { PrismaModule } from './common/services/prisma/prisma.module';
import { JwtModule } from './common/services/jwt/jwt.module';
import { AuthModule } from './modules/http-api/auth/auth.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ChatModule } from './modules/real-time/chat/chat.module';
import { UsersModule } from './modules/http-api/users/users.module';
import { BucketModule } from './common/services/bucket/bucket.module';
import { UploadModule } from './modules/http-api/upload/upload.module';
import { CallModule } from './modules/real-time/call/call.module';
import { RedisModule } from './common/services/redis/redis.module';

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
    ChatModule,
    UsersModule,
    BucketModule,
    UploadModule,
    CallModule,
    RedisModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
