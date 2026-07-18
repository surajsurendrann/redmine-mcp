# Redmine Model Context Protocol (MCP) Server

A Model Context Protocol (MCP) server that connects to a Redmine instance, allowing LLM clients (such as Claude Desktop or Cursor) to interact with Redmine projects, issues, timesheets, and time logs.

## Features & Tools

This server provides the following tools to the MCP client:

| Tool Name | Description | Arguments / Inputs |
| :--- | :--- | :--- |
| `redmine_list_projects` | Lists all visible projects in Redmine. | None |
| `redmine_list_issues` | Lists issues with optional filters. | `project_id` (string), `status_id` (string, e.g. open/closed/\*), `assigned_to_id` (string or "me"), `limit` (number) |
| `redmine_get_issue` | Retrieves detailed information of a specific issue by its ID. | `id` (number, required) |
| `redmine_create_issue` | Creates a new issue in a specific project. | `project_id` (string, required), `subject` (string, required), `description` (string) |
| `redmine_get_timesheet` | Gets time entries (timesheet) for the authenticated user. | `from` (YYYY-MM-DD), `to` (YYYY-MM-DD), `project_id` (string), `limit` (number), `offset` (number) |
| `redmine_log_time` | Logs spent hours on an issue or project. | `hours` (number, required), `issue_id` (number) or `project_id` (number), `activity_id` (number), `comments` (string, max 255 chars), `spent_on` (YYYY-MM-DD), `user_id` (number, requires admin permissions) |
| `redmine_list_time_entry_activities` | Lists the available time entry activities (e.g., Development, Design) and their IDs. | None |
| `redmine_get_my_permissions` | Gets current user info, project memberships, and roles. | None |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- Access to a Redmine instance with REST API enabled (and an API key generated)

### Setup & Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables. Create a `.env` file in the root directory:
   ```env
   REDMINE_URL=https://your-redmine-domain.com
   REDMINE_API_KEY=your_redmine_api_key_here
   LOG_LEVEL=info
   TRANSPORT=stdio
   PORT=3000
   ```

   - **`REDMINE_URL`**: The base URL of your Redmine instance (e.g., `https://redmine.yourcompany.com`).
   - **`REDMINE_API_KEY`**: Your personal Redmine API access key (found under the "My Account" page in Redmine).
   - **`LOG_LEVEL`**: The minimum logging severity level (e.g., `info`, `debug`, `warn`, `error`). Defaults to `info`.
   - **`TRANSPORT`**: The server communication protocol. Options are `stdio` (default) for local stdin/stdout, or `sse` to run the server over HTTP Server-Sent Events.
   - **`PORT`**: The port to bind to when running in `sse` transport mode. Defaults to `3000`.

### Development & Testing

- To run the server in development mode (watches for file changes using `tsx`):
  ```bash
  npm run dev
  ```

- To run a connection check/test script:
  ```bash
  npx tsx src/test.ts
  ```

- To build the project:
  ```bash
  npm run build
  ```

- To run the built server in production mode:
  ```bash
  npm start
  ```

### Running as a Remote SSE Server

If you want to run the server remotely and connect to it over HTTP (Server-Sent Events) rather than using local stdin/stdout:

1. Configure `.env` to use the `sse` transport and define a port:
   ```env
   TRANSPORT=sse
   PORT=3000
   ```

2. Start the server:
   ```bash
   npm start
   ```

   *(Or run `npm run dev` to run it with tsx watch in development mode)*

3. The server will run on `http://localhost:3000` (or your configured port).
   - The SSE connection endpoint is: `GET /sse`
   - The client message endpoint is: `POST /messages`

## Integration with MCP Clients

### Claude Desktop

To use this server with Claude Desktop, add it to your `claude_desktop_config.json` configuration file:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the server configuration under the `mcpServers` object:

```json
{
  "mcpServers": {
    "redmine-mcp": {
      "command": "node",
      "args": [
        "/path/to/redmine-mcp/dist/server.js"
      ],
      "env": {
        "REDMINE_URL": "https://your-redmine-domain.com",
        "REDMINE_API_KEY": "your_redmine_api_key_here"
      }
    }
  }
}
```

Make sure to run `npm run build` in the server directory before starting Claude Desktop so that `dist/server.js` exists.

## Technical Details

- **Stdio Transport**: The server communicates via standard input/output.
- **Stderr Logging**: Because the stdout stream is dedicated strictly to JSON-RPC messages for the MCP protocol, all server application logs (using Pino) are routed to `process.stderr` to prevent protocol stream corruption.
- **Old Redmine Compatibility**: The `redmine_log_time` tool sends XML-formatted POST requests to `/time_entries.xml`. This prevents potential 404 errors on older Redmine instances (such as those running on Ruby 1.8.7) which do not support JSON payloads for creating time entries.
