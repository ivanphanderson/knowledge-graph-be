import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Neo4jModule } from 'nest-neo4j';
import { GraphModule } from './graph/graph.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load environment variables

    Neo4jModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        scheme: 'neo4j', // Use 'bolt' if needed
        host: configService.get<string>('NEO4J_HOST', 'neo4j'), // Default: localhost
        port: configService.get<number>('NEO4J_PORT', 7687), // Default: 7687
        username: configService.get<string>('NEO4J_USERNAME', ''),
        password: configService.get<string>('NEO4J_PASSWORD', ''),
        database: configService.get<string>('NEO4J_DATABASE', ''), // Default: neo4j
      }),
    }),

    GraphModule, // Knowledge graph module
  ],
  controllers: [AppController],  // Ensure this is included
  providers: [AppService],       // Ensure this is included
})
export class AppModule {}
