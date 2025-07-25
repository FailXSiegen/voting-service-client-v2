#!/usr/bin/env node
// WebSocket Test für Voting Tool

const WebSocket = require('ws');

const WS_URL = process.env.WS_URL || 'wss://voting.failx.de/graphql';
const AUTH_TOKEN = process.env.AUTH_TOKEN || '';

console.log('🔌 Testing WebSocket connection to:', WS_URL);

const ws = new WebSocket(WS_URL, {
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Sec-WebSocket-Protocol': 'graphql-ws'
  }
});

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully');
  
  // Send connection init
  ws.send(JSON.stringify({
    type: 'connection_init',
    payload: {
      Authorization: `Bearer ${AUTH_TOKEN}`
    }
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('📨 Received:', message);
  
  if (message.type === 'connection_ack') {
    console.log('✅ Connection acknowledged');
    
    // Send a test subscription
    ws.send(JSON.stringify({
      id: '1',
      type: 'subscribe',
      payload: {
        query: `
          subscription {
            __typename
          }
        `
      }
    }));
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

ws.on('close', (code, reason) => {
  console.log(`🔚 WebSocket closed. Code: ${code}, Reason: ${reason}`);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏱️ Test timeout, closing connection');
  ws.close();
  process.exit(0);
}, 10000);