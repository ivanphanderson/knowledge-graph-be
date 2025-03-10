import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphService } from './graph.service';
import { GraphController } from './graph.controller';
import { ChatModule } from 'src/chat/chat.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [ConfigModule, ChatModule, JwtModule], 
  controllers: [GraphController],
  providers: [GraphService],
})
export class GraphModule {}
