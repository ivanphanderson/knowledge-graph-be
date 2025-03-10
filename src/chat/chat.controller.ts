import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) {}

    // API to retrieve user whole  chat history
    @Get('history')
    @UseGuards(JwtAuthGuard)
    async getChatHistory(@Request() req) {
        console.log("Decoded User:", req.user); // Debugging log
        return this.chatService.getChatHistory(Number(req.user.userId));
    }
}
