const WebSocket = require('ws');

console.log('Connecting to MCP WebSocket...');
const ws = new WebSocket('wss://n8n-mcp.failx.de/ws');

let testId = 1;

ws.on('open', () => {
  console.log('✓ Connected to WebSocket');
  
  // Test 1: Send initialize request
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
    id: testId++
  };
  
  console.log('\nSending initialize request:', JSON.stringify(initRequest, null, 2));
  ws.send(JSON.stringify(initRequest));
  
  // Test 2: After 2 seconds, send a tools/list request
  setTimeout(() => {
    const toolsRequest = {
      jsonrpc: "2.0",
      method: "tools/list",
      id: testId++
    };
    
    console.log('\nSending tools/list request:', JSON.stringify(toolsRequest, null, 2));
    ws.send(JSON.stringify(toolsRequest));
  }, 2000);
  
  // Close connection after 10 seconds
  setTimeout(() => {
    console.log('\nClosing connection...');
    ws.close();
  }, 10000);
});

ws.on('message', (data) => {
  console.log('\nReceived message:');
  try {
    const message = JSON.parse(data.toString());
    console.log(JSON.stringify(message, null, 2));
    
    // Check if it's a valid JSON-RPC response
    if (message.jsonrpc === '2.0' && message.id) {
      console.log('✓ Valid JSON-RPC response');
    }
  } catch (e) {
    console.log('Raw data:', data.toString());
    console.error('⚠ Failed to parse as JSON:', e.message);
  }
});

ws.on('error', (err) => {
  console.error('✗ WebSocket error:', err.message);
});

ws.on('close', () => {
  console.log('\n✓ Connection closed');
  process.exit(0);
});