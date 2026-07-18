import { spawn } from 'child_process';
import http from 'http';

async function runTest() {
  console.log('Starting integration test for SSE transport...');

  // Spawn the server in SSE mode on port 3002
  const serverProcess = spawn('npx', ['tsx', 'src/server.ts'], {
    env: {
      ...process.env,
      TRANSPORT: 'sse',
      PORT: '3002',
      LOG_LEVEL: 'info',
    },
    shell: true,
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server stdout] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server stderr] ${data.toString().trim()}`);
  });

  // Wait 3 seconds for server to start
  await new Promise((resolve) => setTimeout(resolve, 3000));

  let sessionId = '';
  let postUrl = '';

  try {
    // 1. Establish SSE Connection
    console.log('Connecting to SSE endpoint...');
    const req = http.get('http://localhost:3002/sse', (res) => {
      console.log(`SSE response status: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        const text = chunk.toString();
        console.log(`[SSE Received] ${text.trim()}`);

        // Parse the endpoint event
        // Format of endpoint event:
        // event: endpoint
        // data: /messages?sessionId=xxxx-xxxx
        if (text.includes('event: endpoint')) {
          const match = text.match(/data:\s*([^\n\r]+)/);
          if (match) {
            postUrl = match[1];
            // Extract session ID
            const urlObj = new URL(postUrl, 'http://localhost:3002');
            sessionId = urlObj.searchParams.get('sessionId') || '';
            console.log(`Extracted Session ID: ${sessionId}`);
            console.log(`Extracted Post URL: ${postUrl}`);

            // Once we have the session ID, let's send an MCP initialize request
            sendInitializeRequest(sessionId);
          }
        }

        if (text.includes('event: message')) {
          console.log('SUCCESS: Received JSON-RPC message event on SSE stream!');
          cleanup(0);
        }
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with SSE request: ${e.message}`);
      cleanup(1);
    });

    async function sendInitializeRequest(sid: string) {
      console.log('Sending MCP initialize request...');
      const payload = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: {
            name: 'test-client',
            version: '1.0.0',
          },
        },
      };

      const postData = JSON.stringify(payload);

      const postReq = http.request(
        {
          hostname: 'localhost',
          port: 3002,
          path: `/messages?sessionId=${sid}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
          },
        },
        (postRes) => {
          console.log(`POST response status: ${postRes.statusCode}`);
          postRes.on('data', (d) => {
            console.log(`POST response body: ${d.toString().trim()}`);
          });
        }
      );

      postReq.on('error', (e) => {
        console.error(`POST request error: ${e.message}`);
        cleanup(1);
      });

      postReq.write(postData);
      postReq.end();
    }

  } catch (err) {
    console.error('Test execution error:', err);
    cleanup(1);
  }

  function cleanup(exitCode: number) {
    console.log('Cleaning up: killing server process...');
    serverProcess.kill();
    process.exit(exitCode);
  }

  // Timeout after 15 seconds
  setTimeout(() => {
    console.error('Test timed out after 15 seconds');
    cleanup(1);
  }, 15000);
}

runTest().catch((err) => {
  console.error('Failed to run test:', err);
  process.exit(1);
});
