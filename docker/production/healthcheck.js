#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const service = process.argv[2] || 'api';

async function checkApiHealth() {
  // Check HTTP GraphQL endpoint
  const graphqlQuery = JSON.stringify({
    query: '{ __typename }'
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 4000,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(graphqlQuery)
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve('HTTP GraphQL endpoint is healthy');
        } else {
          reject(new Error(`GraphQL returned status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`GraphQL health check failed: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('GraphQL health check timeout'));
    });

    req.write(graphqlQuery);
    req.end();
  });
}

async function checkWebSocketHealth() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://127.0.0.1:4000/graphql', {
      headers: {
        'Sec-WebSocket-Protocol': 'graphql-ws'
      },
      timeout: 3000
    });

    let connectionAcknowledged = false;

    const timeout = setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
      reject(new Error('WebSocket health check timeout'));
    }, 3000);

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'connection_init',
        payload: {}
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'connection_ack') {
          connectionAcknowledged = true;
          clearTimeout(timeout);
          ws.close();
          resolve('WebSocket connection is healthy');
        }
      } catch (error) {
        clearTimeout(timeout);
        ws.close();
        reject(new Error('WebSocket message parsing failed'));
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`WebSocket error: ${error.message}`));
    });

    ws.on('close', (code) => {
      if (!connectionAcknowledged && code !== 1000) {
        clearTimeout(timeout);
        reject(new Error(`WebSocket closed unexpectedly: ${code}`));
      }
    });
  });
}

function checkHealth(service) {
  return new Promise(async (resolve, reject) => {
    if (service === 'api') {
      try {
        // Check both HTTP and WebSocket
        await checkApiHealth();
        await checkWebSocketHealth();
        resolve('API (HTTP + WebSocket) is healthy');
      } catch (error) {
        reject(error);
      }
    } else if (service === 'consumer') {
      // Check if consumer process is running by checking for recent log activity
      try {
        const logPath = '/app/logs/consumer.log';
        if (fs.existsSync(logPath)) {
          const stats = fs.statSync(logPath);
          const now = new Date();
          const mtime = new Date(stats.mtime);
          const diffMinutes = (now - mtime) / (1000 * 60);
          
          if (diffMinutes < 10) {
            resolve('Consumer is healthy');
          } else {
            reject(new Error('Consumer log is too old'));
          }
        } else {
          // If log doesn't exist, assume it's starting up
          resolve('Consumer is starting');
        }
      } catch (error) {
        reject(new Error(`Consumer health check failed: ${error.message}`));
      }
    } else {
      reject(new Error(`Unknown service: ${service}`));
    }
  });
}

checkHealth(service)
  .then((message) => {
    console.log(message);
    process.exit(0);
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });