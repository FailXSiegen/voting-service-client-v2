const readline = require('readline');

// Simulate MCP server with logs
console.log('[2025-07-14T06:43:17.880Z] [n8n-mcp] [INFO] Node.js version: v20.19.3');
console.log('[2025-07-14T06:43:17.880Z] [n8n-mcp] [INFO] Platform: linux x64');
console.log('[2025-07-14T06:43:17.885Z] [n8n-mcp] [INFO] n8n Documentation MCP Server running on stdio transport');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);
    
    if (request.method === 'initialize') {
      // Send some more logs
      console.log('[2025-07-14T06:43:17.886Z] [n8n-mcp] [INFO] Received initialize request');
      
      // Send the actual JSON-RPC response
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'n8n-mcp',
            version: '1.0.0'
          }
        }
      };
      
      console.log(JSON.stringify(response));
      
      // Send more logs after
      console.log('[2025-07-14T06:43:17.887Z] [n8n-mcp] [INFO] Initialize complete');
    }
  } catch (e) {
    console.error('[2025-07-14T06:43:17.888Z] [n8n-mcp] [ERROR] Parse error:', e);
  }
});