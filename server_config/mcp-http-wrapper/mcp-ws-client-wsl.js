#!/usr/bin/env node
const WebSocket = require('ws');

let ws;
let connected = false;

function connect() {
  ws = new WebSocket('wss://n8n-mcp.failx.de/ws');

  ws.on('open', () => {
    connected = true;
    console.error('WebSocket connected');

    // Starte stdin reading erst nach successful connection
    process.stdin.on('data', (data) => {
      if (connected && ws.readyState === WebSocket.OPEN) {
        try {
          const message = JSON.parse(data.toString().trim());
          ws.send(JSON.stringify(message));
        } catch (e) {
          console.error('Invalid JSON from stdin:', e.message);
        }
      }
    });
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(JSON.stringify(message));
    } catch (e) {
      console.error('Invalid JSON from server:', e.message);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
    process.exit(1);
  });

  ws.on('close', () => {
    connected = false;
    console.error('WebSocket closed');
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  if (ws) ws.close();
  process.exit(0);
});

connect();