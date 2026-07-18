import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
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

// Start the server using stdio transport
async function run() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('Redmine MCP Server running on stdio');
}

run().catch((error) => {
    logger.fatal({ error }, 'Fatal error running Redmine MCP Server');
    process.exit(1);
});
