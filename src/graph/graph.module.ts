import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphService } from './graph.service';
import { GraphController } from './graph.controller';

@Module({
  imports: [ConfigModule], 
  controllers: [GraphController],
  providers: [GraphService],
})
export class GraphModule {}
