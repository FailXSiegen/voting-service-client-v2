const express = require('express');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    status: 'MCP HTTP Proxy running',
    endpoints: {
      websocket: 'wss://n8n-mcp.failx.de/ws',
      health: 'https://n8n-mcp.failx.de/health'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const server = app.listen(port, () => {
  console.log(`MCP HTTP Proxy listening on port ${port}`);
});

const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection from:', req.socket.remoteAddress);
  
  const mcpProcess = spawn('docker', [
    'exec', '-i', 'n8n-mcp',
    'node', '/app/dist/mcp/index.js'
  ], {
    env: {
      ...process.env,
      N8N_API_KEY: process.env.N8N_API_KEY,
      N8N_API_URL: process.env.N8N_API_URL || 'http://n8n:5678'
    }
  });

  let buffer = '';

  ws.on('message', (data) => {
    console.log('Received:', data.toString().substring(0, 100) + '...');
    // MCP expects line-delimited JSON
    mcpProcess.stdin.write(data + '\n');
  });

  mcpProcess.stdout.on('data', (data) => {
    const message = data.toString();
    // Filter out log messages and only send JSON-RPC messages
    const lines = message.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Skip log messages (they contain timestamps)
      if (line.includes('[INFO]') || line.includes('[ERROR]') || line.includes('[WARN]')) {
        console.log('Filtered log:', line.substring(0, 100) + '...');
        continue;
      }
      
      try {
        // Try to parse as JSON to ensure it's a valid JSON-RPC message
        JSON.parse(line);
        console.log('Sending JSON-RPC:', line.substring(0, 100) + '...');
        ws.send(line);
      } catch (e) {
        // Not JSON, skip it
        console.log('Skipping non-JSON:', line.substring(0, 50) + '...');
      }
    }
  });

  mcpProcess.stderr.on('data', (data) => {
    console.error('MCP Error:', data.toString());
    ws.send(JSON.stringify({
      error: data.toString()
    }));
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    mcpProcess.kill();
  });

  mcpProcess.on('exit', (code) => {
    console.log('MCP process exited with code:', code);
    ws.close();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    mcpProcess.kill();
  });
});