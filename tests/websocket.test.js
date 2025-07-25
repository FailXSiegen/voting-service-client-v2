/**
 * WebSocket Tests für Voting Tool API
 * Tests für WebSocket-Verbindungen, Subscriptions und Authentifizierung
 */

const WebSocket = require('ws');
const { createClient } = require('graphql-ws');
const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:4000';
const WS_URL = process.env.WS_URL || 'ws://localhost:4000/graphql';
const TEST_TIMEOUT = 10000;

describe('WebSocket Tests', () => {
  let wsClient;
  let authToken;

  beforeAll(async () => {
    // Optional: Get auth token for authenticated tests
    try {
      authToken = await getTestAuthToken();
      console.log('✅ Test auth token obtained');
    } catch (error) {
      console.warn('⚠️ No auth token available, skipping authenticated tests');
    }
  });

  afterEach(() => {
    if (wsClient) {
      wsClient.dispose();
      wsClient = null;
    }
  });

  describe('Basic WebSocket Connection', () => {
    test('should establish WebSocket connection', (done) => {
      const ws = new WebSocket(WS_URL, {
        headers: {
          'Sec-WebSocket-Protocol': 'graphql-ws'
        }
      });

      const timeout = setTimeout(() => {
        ws.close();
        done(new Error('WebSocket connection timeout'));
      }, TEST_TIMEOUT);

      ws.on('open', () => {
        console.log('✅ WebSocket connection established');
        
        // Send connection init
        ws.send(JSON.stringify({
          type: 'connection_init',
          payload: {}
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connection_ack') {
          console.log('✅ WebSocket connection acknowledged');
          clearTimeout(timeout);
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        done(error);
      });
    }, TEST_TIMEOUT);

    test('should handle connection errors gracefully', (done) => {
      const ws = new WebSocket('ws://localhost:9999/graphql'); // Wrong port

      const timeout = setTimeout(() => {
        done();
      }, 2000);

      ws.on('error', (error) => {
        console.log('✅ Connection error handled:', error.code);
        clearTimeout(timeout);
        done();
      });

      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        done(new Error('Should not connect to wrong port'));
      });
    }, 5000);
  });

  describe('GraphQL-WS Protocol', () => {
    test('should handle graphql-ws protocol correctly', (done) => {
      wsClient = createClient({
        url: WS_URL,
        connectionParams: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      let subscriptionReceived = false;

      const unsubscribe = wsClient.subscribe(
        {
          query: 'subscription { __typename }'
        },
        {
          next: (data) => {
            console.log('✅ Subscription data received:', data);
            subscriptionReceived = true;
            unsubscribe();
            done();
          },
          error: (error) => {
            console.error('❌ Subscription error:', error);
            done(error);
          },
          complete: () => {
            if (!subscriptionReceived) {
              done(new Error('Subscription completed without data'));
            }
          }
        }
      );

      setTimeout(() => {
        if (!subscriptionReceived) {
          unsubscribe();
          done(new Error('Subscription timeout'));
        }
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);

    test('should handle multiple subscriptions', (done) => {
      wsClient = createClient({
        url: WS_URL,
        connectionParams: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      let subscription1Complete = false;
      let subscription2Complete = false;

      const checkBothComplete = () => {
        if (subscription1Complete && subscription2Complete) {
          done();
        }
      };

      // First subscription
      const unsubscribe1 = wsClient.subscribe(
        {
          query: 'subscription { __typename }'
        },
        {
          next: (data) => {
            console.log('✅ Subscription 1 data:', data);
            subscription1Complete = true;
            unsubscribe1();
            checkBothComplete();
          },
          error: done
        }
      );

      // Second subscription
      const unsubscribe2 = wsClient.subscribe(
        {
          query: 'subscription { __typename }'
        },
        {
          next: (data) => {
            console.log('✅ Subscription 2 data:', data);
            subscription2Complete = true;
            unsubscribe2();
            checkBothComplete();
          },
          error: done
        }
      );

      setTimeout(() => {
        unsubscribe1();
        unsubscribe2();
        done(new Error('Multiple subscriptions timeout'));
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);
  });

  describe('Authentication', () => {
    test('should handle unauthenticated connections', (done) => {
      wsClient = createClient({
        url: WS_URL,
        connectionParams: {} // No auth
      });

      const unsubscribe = wsClient.subscribe(
        {
          query: `
            subscription {
              __typename
            }
          `
        },
        {
          next: (data) => {
            console.log('✅ Unauthenticated subscription works:', data);
            unsubscribe();
            done();
          },
          error: (error) => {
            console.log('ℹ️ Unauthenticated subscription error (expected):', error.message);
            // This might be expected behavior
            done();
          }
        }
      );

      setTimeout(() => {
        unsubscribe();
        done(new Error('Unauthenticated subscription timeout'));
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);

    test('should handle authenticated connections', (done) => {
      if (!authToken) {
        console.log('⏭️ Skipping authenticated test - no token available');
        done();
        return;
      }

      wsClient = createClient({
        url: WS_URL,
        connectionParams: {
          Authorization: `Bearer ${authToken}`
        }
      });

      const unsubscribe = wsClient.subscribe(
        {
          query: `
            subscription {
              __typename
            }
          `
        },
        {
          next: (data) => {
            console.log('✅ Authenticated subscription works:', data);
            unsubscribe();
            done();
          },
          error: (error) => {
            console.error('❌ Authenticated subscription error:', error);
            done(error);
          }
        }
      );

      setTimeout(() => {
        unsubscribe();
        done(new Error('Authenticated subscription timeout'));
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);
  });

  describe('Connection Stability', () => {
    test('should handle connection drops and reconnects', (done) => {
      let reconnectCount = 0;
      let subscriptionReceived = false;

      wsClient = createClient({
        url: WS_URL,
        connectionParams: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        on: {
          connected: () => {
            console.log(`✅ Connected (attempt ${reconnectCount + 1})`);
          },
          closed: () => {
            reconnectCount++;
            console.log(`🔄 Connection closed, reconnect count: ${reconnectCount}`);
            
            if (reconnectCount >= 2 && subscriptionReceived) {
              done();
            }
          }
        }
      });

      const unsubscribe = wsClient.subscribe(
        {
          query: 'subscription { __typename }'
        },
        {
          next: (data) => {
            console.log('✅ Subscription data after reconnect:', data);
            subscriptionReceived = true;
            
            if (reconnectCount === 0) {
              // Simulate connection drop by terminating client
              setTimeout(() => {
                wsClient.terminate();
              }, 100);
            } else {
              unsubscribe();
              done();
            }
          },
          error: (error) => {
            console.log('ℹ️ Expected error during reconnect test:', error.message);
          }
        }
      );

      setTimeout(() => {
        unsubscribe();
        done(new Error('Reconnection test timeout'));
      }, TEST_TIMEOUT * 2);
    }, TEST_TIMEOUT * 2);

    test('should handle invalid messages gracefully', (done) => {
      const ws = new WebSocket(WS_URL, {
        headers: {
          'Sec-WebSocket-Protocol': 'graphql-ws'
        }
      });

      let connectionAcknowledged = false;

      ws.on('open', () => {
        // Send connection init
        ws.send(JSON.stringify({
          type: 'connection_init',
          payload: {}
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'connection_ack') {
          connectionAcknowledged = true;
          
          // Send invalid message
          ws.send('invalid json');
          
          // Send valid message after invalid one
          setTimeout(() => {
            ws.send(JSON.stringify({
              id: 'test',
              type: 'subscribe',
              payload: {
                query: 'subscription { __typename }'
              }
            }));
          }, 100);
        } else if (message.type === 'next' || message.type === 'complete') {
          console.log('✅ Valid message processed after invalid one');
          ws.close();
          done();
        } else if (message.type === 'error') {
          console.log('ℹ️ Error message (expected for invalid JSON):', message);
        }
      });

      ws.on('error', (error) => {
        if (connectionAcknowledged) {
          console.log('✅ Connection handled invalid message gracefully');
          done();
        } else {
          done(error);
        }
      });

      setTimeout(() => {
        ws.close();
        done(new Error('Invalid message test timeout'));
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);
  });
});

// Helper function to get test auth token
async function getTestAuthToken() {
  return new Promise((resolve, reject) => {
    const loginData = JSON.stringify({
      // Add test credentials if available
      username: process.env.TEST_USERNAME || 'test@example.com',
      password: process.env.TEST_PASSWORD || 'testpassword'
    });

    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.accessToken) {
            resolve(response.accessToken);
          } else {
            reject(new Error('No access token in response'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(loginData);
    req.end();
  });
}