#!/usr/bin/env node
/**
 * WebSocket Health Check für Voting Tool API
 * Testet sowohl HTTP als auch WebSocket-Verbindungen
 */

const WebSocket = require('ws');
const http = require('http');
const https = require('https');

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.APP_PORT || 4000;
const PROTOCOL = process.env.NODE_ENV === 'production' ? 'https' : 'http';
const WS_PROTOCOL = process.env.NODE_ENV === 'production' ? 'wss' : 'ws';

const TIMEOUT = 5000; // 5 seconds timeout
const HEALTH_CHECK_TIMEOUT = 10000; // 10 seconds for full health check

console.log(`🏥 Starting health check for ${HOST}:${PORT}`);

async function checkHttpHealth() {
  return new Promise((resolve, reject) => {
    const graphqlQuery = JSON.stringify({
      query: '{ __typename }'
    });

    const options = {
      hostname: HOST,
      port: PORT,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(graphqlQuery)
      },
      timeout: TIMEOUT
    };

    const client = PROTOCOL === 'https' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ HTTP GraphQL endpoint is healthy');
          resolve(true);
        } else {
          console.error(`❌ HTTP GraphQL endpoint returned status ${res.statusCode}`);
          reject(new Error(`HTTP Status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ HTTP health check failed:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('❌ HTTP health check timeout');
      req.destroy();
      reject(new Error('HTTP timeout'));
    });

    req.write(graphqlQuery);
    req.end();
  });
}

async function checkWebSocketHealth() {
  return new Promise((resolve, reject) => {
    const wsUrl = `${WS_PROTOCOL}://${HOST}:${PORT}/graphql`;
    console.log(`🔌 Testing WebSocket connection to: ${wsUrl}`);

    // Try without subprotocol first, then with graphql-ws
    const ws = new WebSocket(wsUrl, {
      timeout: TIMEOUT
    });

    let connectionAcknowledged = false;
    let subscriptionWorking = false;

    const cleanup = () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };

    const timeout = setTimeout(() => {
      console.error('❌ WebSocket health check timeout');
      cleanup();
      reject(new Error('WebSocket timeout'));
    }, TIMEOUT);

    ws.on('open', () => {
      console.log('🔌 WebSocket connected');
      
      // Send connection init
      ws.send(JSON.stringify({
        type: 'connection_init',
        payload: {}
      }));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 WebSocket message:', message.type);
        
        if (message.type === 'connection_ack') {
          console.log('✅ WebSocket connection acknowledged');
          connectionAcknowledged = true;
          
          // Send a test subscription
          ws.send(JSON.stringify({
            id: 'health-check',
            type: 'subscribe',
            payload: {
              query: 'subscription { __typename }'
            }
          }));
        } else if (message.type === 'next' || message.type === 'complete') {
          console.log('✅ WebSocket subscription working');
          subscriptionWorking = true;
          clearTimeout(timeout);
          cleanup();
          resolve(true);
        } else if (message.type === 'error') {
          console.error('❌ WebSocket subscription error:', message.payload);
          clearTimeout(timeout);
          cleanup();
          reject(new Error('WebSocket subscription error'));
        }
      } catch (error) {
        console.error('❌ Error parsing WebSocket message:', error.message);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      clearTimeout(timeout);
      cleanup();
      reject(error);
    });

    ws.on('close', (code, reason) => {
      if (!subscriptionWorking && !connectionAcknowledged) {
        console.error(`❌ WebSocket closed unexpectedly. Code: ${code}, Reason: ${reason}`);
        clearTimeout(timeout);
        reject(new Error(`WebSocket closed: ${code} ${reason}`));
      }
    });
  });
}

async function checkDatabaseConnection() {
  return new Promise((resolve, reject) => {
    const dbQuery = JSON.stringify({
      query: `
        query {
          __schema {
            queryType {
              name
            }
          }
        }
      `
    });

    const options = {
      hostname: HOST,
      port: PORT,
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dbQuery)
      },
      timeout: TIMEOUT
    };

    const client = PROTOCOL === 'https' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.data && response.data.__schema) {
            console.log('✅ Database connection is healthy');
            resolve(true);
          } else {
            console.error('❌ Database schema query failed');
            reject(new Error('Database schema unavailable'));
          }
        } catch (error) {
          console.error('❌ Database health check failed:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Database health check failed:', error.message);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('❌ Database health check timeout');
      req.destroy();
      reject(new Error('Database timeout'));
    });

    req.write(dbQuery);
    req.end();
  });
}

async function runHealthCheck() {
  const startTime = Date.now();
  let httpHealthy = false;
  let wsHealthy = false;
  let dbHealthy = false;

  try {
    // Check HTTP Health
    await checkHttpHealth();
    httpHealthy = true;
  } catch (error) {
    console.error('HTTP health check failed:', error.message);
  }

  try {
    // Check WebSocket Health
    await checkWebSocketHealth();
    wsHealthy = true;
  } catch (error) {
    console.error('WebSocket health check failed:', error.message);
  }

  try {
    // Check Database Connection
    await checkDatabaseConnection();
    dbHealthy = true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
  }

  const duration = Date.now() - startTime;
  console.log(`⏱️ Health check completed in ${duration}ms`);

  console.log('\n📊 Health Check Results:');
  console.log(`HTTP GraphQL: ${httpHealthy ? '✅' : '❌'}`);
  console.log(`WebSocket: ${wsHealthy ? '✅' : '❌'}`);
  console.log(`Database: ${dbHealthy ? '✅' : '❌'}`);

  // Exit with appropriate code
  if (httpHealthy && wsHealthy && dbHealthy) {
    console.log('\n🎉 All health checks passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some health checks failed!');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, exiting...');
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, exiting...');
  process.exit(1);
});

// Set overall timeout
setTimeout(() => {
  console.error('⏰ Overall health check timeout');
  process.exit(1);
}, HEALTH_CHECK_TIMEOUT);

// Run the health check
runHealthCheck().catch((error) => {
  console.error('💥 Health check failed:', error.message);
  process.exit(1);
});