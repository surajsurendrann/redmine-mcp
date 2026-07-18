import dotenv from 'dotenv';
import { z } from 'zod';

// quiet: true suppresses the '◇ injected env...' stdout message from dotenv v17 (dotenvx).
// MCP stdio transport uses stdout exclusively for JSON-RPC; any other output corrupts the stream.
dotenv.config({ quiet: true });

const configSchema = z.object({
  REDMINE_URL: z.string().url('REDMINE_URL must be a valid URL'),
  REDMINE_API_KEY: z.string().min(1, 'REDMINE_API_KEY is required'),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = configSchema.safeParse(process.env);

if (!parsed.success) {
  process.stderr.write('Invalid or missing environment variables: ' + JSON.stringify(parsed.error.format()) + '\n');
  process.stderr.write('Make sure to set REDMINE_URL and REDMINE_API_KEY in your .env file.\n');
}

// Fallbacks for initial startup without crashing immediately if keys are not fully setup
export const config = {
  REDMINE_URL: parsed.success ? parsed.data.REDMINE_URL : (process.env.REDMINE_URL || 'https://redmine.company.com'),
  REDMINE_API_KEY: parsed.success ? parsed.data.REDMINE_API_KEY : (process.env.REDMINE_API_KEY || ''),
  LOG_LEVEL: parsed.success ? parsed.data.LOG_LEVEL : (process.env.LOG_LEVEL || 'info'),
};
