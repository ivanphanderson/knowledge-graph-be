import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatHistory } from './chat-history.entity'; // Import the ChatHistory entity
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatHistory, User]),
  ],
  providers: [ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
