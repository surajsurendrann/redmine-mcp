import pino from 'pino';
import { config } from '../config/index.js';

// MCP stdio transport uses stdout for JSON-RPC communication.
// All logging MUST go to stderr to avoid corrupting the protocol stream.
export const logger = pino(
  { level: config.LOG_LEVEL || 'info' },
  process.stderr
);
