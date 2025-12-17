import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { UsersModule } from 'src/modules/http-api/users/users.module';

@Module({
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
