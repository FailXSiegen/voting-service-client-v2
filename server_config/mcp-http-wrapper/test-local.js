const { spawn } = require('child_process');

console.log('Testing MCP locally...\n');

// Simulate what the WebSocket server does
const mcpProcess = spawn('node', ['./test-mock-mcp.js']);

let buffer = '';

// Test initialize request
const initRequest = {
  jsonrpc: "2.0",
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  },
  id: 1
};

console.log('Sending:', JSON.stringify(initRequest));
mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');

mcpProcess.stdout.on('data', (data) => {
  const message = data.toString();
  const lines = message.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    // Skip log messages (they contain timestamps)
    if (line.includes('[INFO]') || line.includes('[ERROR]') || line.includes('[WARN]')) {
      console.log('Filtered log:', line.substring(0, 100) + '...');
      continue;
    }
    
    try {
      // Try to parse as JSON to ensure it's a valid JSON-RPC message
      const parsed = JSON.parse(line);
      console.log('Valid JSON-RPC:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      // Not JSON, skip it
      console.log('Skipping non-JSON:', line.substring(0, 50) + '...');
    }
  }
});

mcpProcess.stderr.on('data', (data) => {
  console.error('MCP Error:', data.toString());
});

mcpProcess.on('exit', (code) => {
  console.log('MCP process exited with code:', code);
});

// Close after 3 seconds
setTimeout(() => {
  mcpProcess.kill();
  process.exit(0);
}, 3000);