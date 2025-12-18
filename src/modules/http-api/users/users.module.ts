import { Global, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule } from 'src/common/services/jwt/jwt.module';
import { BucketModule } from 'src/common/services/bucket/bucket.module';

@Global()
@Module({
  imports: [JwtModule, BucketModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
