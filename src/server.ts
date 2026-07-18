import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { redmineService } from './services/index.js';
import { handleToolCall, toolsDefinition } from './tools/index.js';

// Initialize the Model Context Protocol server
const server = new Server(
    {
        name: 'redmine-mcp-server',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Register list tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.info('List tools request received');
    return {
        tools: toolsDefinition,
    };
});

// Register call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info({ name, args }, 'Call tool request received');
    try {
        return await handleToolCall(name, args || {}, redmineService);
    } catch (error: any) {
        logger.error({ error, name }, 'Error executing tool');
        return {
            isError: true,
            content: [{ type: 'text', text: error.message || 'Unknown error' }],
        };
    }
});

// Start the server using the configured transport
async function run() {
    if (config.TRANSPORT === 'sse') {
        const app = express();
        app.use(express.json());

        // Simple CORS middleware
        app.use((req, res, next) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });

        // Store active SSE transports by sessionId
        const transports = new Map<string, SSEServerTransport>();

        app.get('/sse', async (req, res) => {
            logger.info('New SSE connection requested');
            const transport = new SSEServerTransport('/messages', res);
            transports.set(transport.sessionId, transport);

            transport.onclose = () => {
                logger.info({ sessionId: transport.sessionId }, 'SSE connection closed');
                transports.delete(transport.sessionId);
            };

            await server.connect(transport);
        });

        app.post('/messages', async (req, res) => {
            const sessionId = req.query.sessionId as string;
            if (!sessionId) {
                res.status(400).send('Missing sessionId');
                return;
            }
            const transport = transports.get(sessionId);
            if (!transport) {
                res.status(404).send('Session not found or expired');
                return;
            }
            await transport.handlePostMessage(req, res, req.body);
        });

        const port = parseInt(config.PORT, 10);
        app.listen(port, () => {
            logger.info(`Redmine MCP Server running on SSE at http://localhost:${port}`);
        });
    } else {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        logger.info('Redmine MCP Server running on stdio');
    }
}

run().catch((error) => {
    logger.fatal({ error }, 'Fatal error running Redmine MCP Server');
    process.exit(1);
});
