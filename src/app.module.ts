import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Neo4jModule } from 'nest-neo4j';
import { GraphModule } from './graph/graph.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';

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

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'postgres',
      port: 5432,
      username: 'myuser',
      password: 'mypassword',
      database: 'mydatabase',
      autoLoadEntities: true,
      synchronize: true, 
    }), 

    GraphModule, // Knowledge graph module
    UserModule, 
    AuthModule, 
    ChatModule,
  ],
  controllers: [AppController],  // Ensure this is included
  providers: [AppService],       // Ensure this is included
})
export class AppModule {}
