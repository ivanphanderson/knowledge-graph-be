import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as neo4j from 'neo4j-driver';
import axios from 'axios';

@Injectable()
export class GraphService implements OnModuleInit, OnModuleDestroy {
    private driver: neo4j.Driver;
    private session: neo4j.Session;
    private openAI_URL = "https://dana-automation-copilot-temp2.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-08-01-preview";

    constructor(private configService: ConfigService) {
        const neo4jUri = this.configService.get<string>('NEO4J_URI') ?? 'bolt://neo4j:7687';
        const neo4jUsername = this.configService.get<string>('NEO4J_USERNAME') ?? '';
        const neo4jPassword = this.configService.get<string>('NEO4J_PASSWORD') ?? '';

        this.driver = neo4j.driver(
        neo4jUri,
        neo4j.auth.basic(
            neo4jUsername,
            neo4jPassword,
        ),
        );
        this.session = this.driver.session();
    }

    // Indicate that Neo4j database connected
    async onModuleInit() {
        console.log('Connected to Neo4j database');
    }

    async onModuleDestroy() {
        await this.session.close();
        await this.driver.close();
    }

    // Send user prompt to openAI API and return the response 
    async processText(query: string): Promise<any> {
        try {
            const response = await axios.post(
                this.openAI_URL,
                {
                    messages: [
                        {
                            role: 'system',
                            content: `Answer in maximum 3 sentences.`
                        },
                        { role: 'user', content: query }
                    ],
                },
                {
                    headers: { 'api-key': `${process.env.OPENAI_API_KEY}` },
                },
            );

            const structuredData = response.data.choices[0].message.content;
            console.log(structuredData);
            return structuredData;
        } catch (error) {
            console.error('Error processing text:', error);
            throw new Error('Failed to process text');
        }
    }

    // Store important keywords from openAI API response as graph nodes
    async storeGraphData(message: any, userId: number) {
        const session = this.driver.session();

        const response = await axios.post(
        this.openAI_URL,
        {
            messages: [
            {
                role: 'system',
                content: `Extract keywords and relationship from the text. 
                Provide at least three relationships for each keyword. 
                Make sure only one single word for each node (example: Artificial Intelligence become 'artificial' and 'intelligence'). 
                More than one word is strictly prohibited. 
                Less than three relationships is strictly prohibited. 
                Make sure all node have at least three relationships 
                (example: artificial has relationship with 'intelligence', 'machine', and 'human'). 
                Remove plural and superlative etc. 
                Return a JSON list of: nodes list and a json list of the relationship in format: source: node1, target: node2.
                Do not write any intro or outro in the text.
                Even if the text provided does not contain enough information to extract meaningful keywords and relationships, just return the json of it without "JSON" word in the beginning
                Example: {"nodes": [a,b,c,...], "relationships": [{"source": a, "target": b}, {"source": b, "target": c}, ...]}`
            },
            { role: 'user', content: message }
            ],
        },
        {
            headers: { 'api-key': `${process.env.OPENAI_API_KEY}` },
        },
        );

        const rawContent = response.data.choices[0]?.message?.content.trim();
        const cleanContent = rawContent.replace(/`+/g, ""); // Remove backticks
        const data = JSON.parse(cleanContent);

        try {
            // Merge all node from openAI response
            for (const node of data.nodes) {
                await session.run(
                `MERGE (n:Keyword {name: $name, userId: $userId})
                ON CREATE SET n.size = 1, n.userId = $userId
                ON MATCH SET n.size = n.size + 1 RETURN n`,
                { name: node.toLowerCase(), userId: userId }
                );
            }

            // Merge all relationship from openAI response
            for (const relationship of data.relationships) {
                await session.run(
                `
                MATCH   (a:Keyword {name: $source, userId: $userId}), 
                        (b:Keyword {name: $target, userId: $userId})
                MERGE (a)-[:RELATED_TO]->(b)
                `,
                { source: relationship.source.toLowerCase(), target: relationship.target.toLowerCase() , userId: userId}
                );
            }

            // Drop existing cluster
            await session.run(`CALL gds.graph.exists('$userId') YIELD exists
                        WITH exists
                        WHERE exists
                        CALL gds.graph.drop('$userId') YIELD graphName
                        RETURN graphName`, {userId: userId});

            // Assign graph name to gds in neo4j
            await session.run(`
                CALL gds.graph.project(
                    '$userId', // Graph Name
                    'Keyword', // Node Label
                    'RELATED_TO' // Relationship Type
                );
            `, {userId: userId});

            // Reassign cluster id to each node
            await session.run(
                `CALL gds.louvain.write('$userId', { writeProperty: 'community' })`
            , {userId: userId});

            return { message: 'Graph data stored successfully' };
        } finally {
            await session.close();
        }
    }

    // Method to assign cluster name
    async setClusterName(userId: number) {
        const session = this.driver.session();
        const result = await session.run(`
            MATCH (n:Keyword)
            WHERE n.userId = $userId
            RETURN n.community AS community, COLLECT(n.name) AS keywords
        `, { userId: userId });

        const communities = result.records.map(record => ({
            community: record.get('community').toNumber(),
            keywords: record.get('keywords'),
        }));
        
        const prompt = `Assign a meaningful category name based on the following keywords for each community:\n\n` + 
        communities.map(c => `${c.community}: [${c.keywords.join(', ')}]`).join('\n') + 
            `\n\nProvide concise names.`;

        const response = await axios.post(
        this.openAI_URL,
            {
            messages: [
                {
                    role: 'system',
                    content: `Return the answer in json format with: {"sent id": category}, example: {"2": "Orange Juice", "3": "Information Request"}: . Do not write any intro or outro in the text.`
                },
                { role: 'user', content: prompt }
            ],
            },
            {
                headers: { 'api-key': `${process.env.OPENAI_API_KEY}` },
            },
        );
        const structuredData = response.data.choices[0].message.content;
        console.log(structuredData);

        const data = JSON.parse(structuredData);

        for (const [community, name] of Object.entries(data)) {
            await session.run(
                `MATCH (n:Keyword) WHERE n.community = $community AND n.userId = $userId
                SET n.communityName = $name`,
                { community: parseInt(community), userId: userId, name }
            );
        }
    }

    // Method to retrieve cluster name
    async getClusterName(userId: number) {
        const session = this.driver.session();

        const nodesQuery = await session.run('MATCH (n) WHERE n.userId = $userId RETURN n', {userId: userId});
        const nodes = nodesQuery.records.map(record => {
            const node = record.get('n');
            return {
                id: node.identity.toNumber(),
                name: node.properties.name,
                type: node.labels[0],
                community: node.properties.community.low,
                size: node.properties.size.low,
                cluster: node.properties.communityName
            };
        });


        return { nodes };
    }

    // Method to retrieve all nodes and its relationship for knowledge graph data
    async getGraphData(userId: number): Promise<any> {
        const session = this.driver.session();
        
        try {
            const nodesQuery = await session.run('MATCH (n) WHERE n.userId = $userId RETURN n', {userId: userId});
            const nodes = nodesQuery.records.map(record => {
                const node = record.get('n');
                return {
                    id: node.identity.toNumber(),
                    name: node.properties.name,
                    type: node.labels[0],
                    community: node.properties.community.low,
                    size: node.properties.size.low,
                    cluster: node.properties.communityName
                };
            });

            // Get all relationships
            const relQuery = await session.run(
                'MATCH (a)-[r]->(b) WHERE a.userId = $userId AND b.userId = $userId RETURN a, r, b', {userId: userId}
            );
            const links = relQuery.records.map(record => ({
                source: record.get('a').identity.toNumber(),
                target: record.get('b').identity.toNumber(),
                type: record.get('r').type,
            }));

            return { nodes, links };
        } finally {
            await session.close();
        }
    }

    // Method to clean (remove) all graph in databasse
    async cleanDatabase(userId: number): Promise<string> {
        const session = this.driver.session();
        try {
            await session.run('MATCH (n) WHERE n.userId = $userId DETACH DELETE n', {userId: userId}); 
            return 'Database cleaned successfully';
        } catch (error) {
            console.error('Error cleaning database:', error);
            throw new Error('Failed to clean database');
        } finally {
            await session.close();
        }
    }

}
