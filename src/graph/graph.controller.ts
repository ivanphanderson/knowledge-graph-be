import { Controller, Post, Get, Delete, Body } from '@nestjs/common';
import { GraphService } from './graph.service';

@Controller('graph')
export class GraphController {
    constructor(private readonly graphService: GraphService) {}

    // API to process user prompt and return openAI API response
    @Post('process-text')
    async processText(@Body() body: { query: string }) {
        const response = await this.graphService.processText(body.query);
        return { response };
    }

    // API to store keywords of openAI API response as nodes (and its relationship) in database
    @Post('store')
    async storeText(@Body() body: { query: string }) {
        const result = await this.graphService.storeGraphData(body.query);
        return { message: 'Graph data stored successfully' };
    }

    // API to retrieve all knowledge graph data
    @Get('retrieve')
    async getGraph() {
        return await this.graphService.getGraphData();
    }

    // API to remove graph data
    @Delete('clean')
    async cleanDatabase() {
        this.graphService.cleanDatabase();
        return { message: 'Graph data cleaned successfully' }
    }
}
