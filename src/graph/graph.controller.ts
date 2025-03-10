import { Controller, Post, Get, Delete, Body, Headers, UseGuards, Request  } from '@nestjs/common';
import { GraphService } from './graph.service';
import { ChatService } from 'src/chat/chat.service';
import { JwtService } from '@nestjs/jwt'; // Import JwtService to decode the token
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('graph')
export class GraphController {
    constructor(
        private readonly graphService: GraphService,
        private readonly chatService: ChatService,
        private readonly jwtService: JwtService, // Inject JwtService to decode token
    ) {}

    // API to process user prompt and return openAI API response
    @UseGuards(JwtAuthGuard)
    @Post('process-text')
    async processText(@Body() body: { query: string }, @Request() req) {
        try {
            const userId = req.user.userId; // Extract user ID from token
            
            this.chatService.createMessage(userId, body.query, 'user')
            const response = await this.graphService.processText(body.query);
            this.chatService.createMessage(userId, response, 'chatgpt')
            return { response };
        } catch (error) {
            throw new Error('Invalid or expired token');
          }
    }

    // API to store keywords of openAI API response as nodes (and its relationship) in database
    @UseGuards(JwtAuthGuard)
    @Post('store')
    async storeText(@Body() body: { query: string, msgId: number }, @Request() req) {
        try {
            const userId = req.user.userId; // Extract user ID from token
            this.chatService.setChatHistoryGraphState(body.msgId);
            const result = await this.graphService.storeGraphData(body.query, userId);

            return { message: 'Graph data stored successfully' };
        } catch (error) {
            console.log(error)
            throw new Error('Invalid or expired token');
          }
    }

    // API to retrieve cluster name on the knowledge graph
    @UseGuards(JwtAuthGuard)
    @Get('get-cluster-data')
    async getClusterName(@Request() req) {
        try {
            const userId = req.user.userId; // Extract user ID from token
            const result = await this.graphService.getClusterName(userId);
            return result;
        } catch (error) {
            console.log(error);
            throw new Error('Invalid or expired token');
          }
    }

    // API to set knowledge graph cluster name based
    @UseGuards(JwtAuthGuard)
    @Post('set-cluster-data')
    async setClusterName(@Request() req) {
        try {
            const userId = req.user.userId; // Extract user ID from token
            const result = await this.graphService.setClusterName(userId);
            return {message: "Cluster name successfully set"};
        } catch (error) {
            console.log(error);
            throw new Error('Invalid or expired token');
          }
    }

    // API to retrieve all knowledge graph data
    @UseGuards(JwtAuthGuard)
    @Get('retrieve')
    async getGraph(@Request() req) {
        const userId = req.user.userId; 
        return await this.graphService.getGraphData(userId);
    }

    // API to remove graph data
    @UseGuards(JwtAuthGuard)
    @Delete('clean')
    async cleanDatabase(@Request() req) {
        const userId = req.user.userId; 
        this.graphService.cleanDatabase(userId);
        this.chatService.removeChatHistoryByUser(userId)
        return { message: 'Graph data cleaned successfully' }
    }
}
