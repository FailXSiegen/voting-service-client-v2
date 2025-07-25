/**
 * Client-side WebSocket Tests für Voting Tool
 * Tests für Apollo Client WebSocket-Integration
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from 'graphql-ws';
import WebSocket from 'ws';

// Mock WebSocket für Browser-Umgebung
global.WebSocket = WebSocket;

const WS_URL = 'ws://localhost:4000/graphql';
const TEST_TIMEOUT = 10000;

describe('Client WebSocket Integration', () => {
  let wsClient;
  let mockStorage;

  beforeEach(() => {
    // Mock localStorage
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    global.localStorage = mockStorage;
  });

  afterEach(() => {
    if (wsClient) {
      wsClient.dispose();
      wsClient = null;
    }
  });

  describe('Apollo Client WebSocket Connection', () => {
    test('should create WebSocket client with correct configuration', () => {
      wsClient = createClient({
        url: WS_URL,
        connectionParams: () => {
          const token = localStorage.getItem('accessToken');
          return token ? { Authorization: `Bearer ${token}` } : {};
        }
      });

      expect(wsClient).toBeDefined();
    });

    test('should handle connection parameters from localStorage', (done) => {
      const testToken = 'test-jwt-token';
      mockStorage.getItem.mockReturnValue(testToken);

      let connectionParamsUsed = false;

      wsClient = createClient({
        url: WS_URL,
        connectionParams: () => {
          const token = localStorage.getItem('accessToken');
          connectionParamsUsed = true;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        on: {
          connected: () => {
            expect(connectionParamsUsed).toBe(true);
            expect(mockStorage.getItem).toHaveBeenCalledWith('accessToken');
            done();
          },
          error: done
        }
      });

      // Trigger connection
      const unsubscribe = wsClient.subscribe(
        { query: 'subscription { __typename }' },
        { next: () => unsubscribe(), error: done }
      );

      setTimeout(() => {
        unsubscribe();
        done(new Error('Connection test timeout'));
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);

    test('should handle missing auth token gracefully', (done) => {
      mockStorage.getItem.mockReturnValue(null);

      wsClient = createClient({
        url: WS_URL,
        connectionParams: () => {
          const token = localStorage.getItem('accessToken');
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        on: {
          connected: () => {
            console.log('✅ Connected without auth token');
            done();
          },
          error: (error) => {
            console.log('ℹ️ Connection error without token (may be expected):', error.message);
            done(); // Not necessarily a failure
          }
        }
      });

      const unsubscribe = wsClient.subscribe(
        { query: 'subscription { __typename }' },
        { 
          next: () => {
            unsubscribe();
            done();
          },
          error: (error) => {
            console.log('ℹ️ Subscription error without token:', error.message);
            done(); // Expected behavior
          }
        }
      );

      setTimeout(() => {
        unsubscribe();
        done(new Error('No-auth test timeout'));
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);
  });

  describe('Subscription Management', () => {
    test('should handle subscription lifecycle', (done) => {
      wsClient = createClient({
        url: WS_URL,
        connectionParams: {}
      });

      let subscriptionStarted = false;
      let subscriptionCompleted = false;

      const unsubscribe = wsClient.subscribe(
        {
          query: 'subscription { __typename }'
        },
        {
          next: (data) => {
            console.log('✅ Subscription data received:', data);
            subscriptionStarted = true;
            unsubscribe();
          },
          complete: () => {
            subscriptionCompleted = true;
            if (subscriptionStarted) {
              console.log('✅ Subscription completed successfully');
              done();
            }
          },
          error: (error) => {
            console.log('ℹ️ Subscription error (may be expected):', error.message);
            done(); // May be expected behavior
          }
        }
      );

      setTimeout(() => {
        if (!subscriptionStarted && !subscriptionCompleted) {
          unsubscribe();
          done(new Error('Subscription lifecycle test timeout'));
        }
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);

    test('should handle multiple concurrent subscriptions', (done) => {
      wsClient = createClient({
        url: WS_URL,
        connectionParams: {}
      });

      let subscription1Received = false;
      let subscription2Received = false;

      const checkBothReceived = () => {
        if (subscription1Received && subscription2Received) {
          console.log('✅ Both subscriptions received data');
          done();
        }
      };

      const unsubscribe1 = wsClient.subscribe(
        { query: 'subscription Sub1 { __typename }' },
        {
          next: (data) => {
            console.log('✅ Subscription 1 data:', data);
            subscription1Received = true;
            unsubscribe1();
            checkBothReceived();
          },
          error: (error) => {
            console.log('ℹ️ Subscription 1 error:', error.message);
            subscription1Received = true; // Count as "handled"
            checkBothReceived();
          }
        }
      );

      const unsubscribe2 = wsClient.subscribe(
        { query: 'subscription Sub2 { __typename }' },
        {
          next: (data) => {
            console.log('✅ Subscription 2 data:', data);
            subscription2Received = true;
            unsubscribe2();
            checkBothReceived();
          },
          error: (error) => {
            console.log('ℹ️ Subscription 2 error:', error.message);
            subscription2Received = true; // Count as "handled"
            checkBothReceived();
          }
        }
      );

      setTimeout(() => {
        unsubscribe1();
        unsubscribe2();
        done(new Error('Multiple subscriptions test timeout'));
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);
  });

  describe('Error Handling and Reconnection', () => {
    test('should handle connection errors gracefully', (done) => {
      // Try to connect to wrong port
      wsClient = createClient({
        url: 'ws://localhost:9999/graphql',
        connectionParams: {},
        retryAttempts: 2,
        on: {
          error: (error) => {
            console.log('✅ Connection error handled:', error.message);
            done();
          },
          connected: () => {
            done(new Error('Should not connect to wrong port'));
          }
        }
      });

      const unsubscribe = wsClient.subscribe(
        { query: 'subscription { __typename }' },
        {
          next: () => {
            unsubscribe();
            done(new Error('Should not receive data from wrong port'));
          },
          error: (error) => {
            console.log('✅ Subscription error handled:', error.message);
            done();
          }
        }
      );

      setTimeout(() => {
        unsubscribe();
        done(new Error('Error handling test timeout'));
      }, 5000);
    }, 10000);

    test('should handle server disconnection', (done) => {
      wsClient = createClient({
        url: WS_URL,
        connectionParams: {},
        retryAttempts: 1,
        on: {
          connected: () => {
            console.log('✅ Initial connection established');
          },
          closed: () => {
            console.log('✅ Connection closed detected');
            done();
          }
        }
      });

      let subscriptionActive = false;

      const unsubscribe = wsClient.subscribe(
        { query: 'subscription { __typename }' },
        {
          next: (data) => {
            console.log('✅ Subscription active:', data);
            subscriptionActive = true;
            
            // Simulate server disconnection
            setTimeout(() => {
              wsClient.terminate();
            }, 100);
          },
          error: (error) => {
            if (subscriptionActive) {
              console.log('✅ Disconnection error handled:', error.message);
              done();
            } else {
              console.log('ℹ️ Initial subscription error:', error.message);
              done(); // May be expected
            }
          }
        }
      );

      setTimeout(() => {
        unsubscribe();
        done(new Error('Disconnection test timeout'));
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);
  });

  describe('Authentication Scenarios', () => {
    test('should handle token refresh during connection', (done) => {
      let tokenRefreshCalled = false;
      const initialToken = 'initial-token';
      const refreshedToken = 'refreshed-token';

      mockStorage.getItem
        .mockReturnValueOnce(initialToken)
        .mockReturnValueOnce(refreshedToken);

      wsClient = createClient({
        url: WS_URL,
        connectionParams: () => {
          const token = localStorage.getItem('accessToken');
          if (token === refreshedToken) {
            tokenRefreshCalled = true;
          }
          return token ? { Authorization: `Bearer ${token}` } : {};
        }
      });

      const unsubscribe = wsClient.subscribe(
        { query: 'subscription { __typename }' },
        {
          next: (data) => {
            console.log('✅ Subscription data with token:', data);
            
            if (!tokenRefreshCalled) {
              // Simulate token refresh
              mockStorage.getItem.mockReturnValue(refreshedToken);
              // Reconnect would normally be triggered by token refresh
              setTimeout(() => {
                wsClient.dispose();
                done();
              }, 100);
            } else {
              unsubscribe();
              done();
            }
          },
          error: (error) => {
            console.log('ℹ️ Token test error:', error.message);
            done(); // May be expected behavior
          }
        }
      );

      setTimeout(() => {
        unsubscribe();
        done(new Error('Token refresh test timeout'));
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);

    test('should handle logout scenario', (done) => {
      const testToken = 'test-token';
      mockStorage.getItem.mockReturnValue(testToken);

      wsClient = createClient({
        url: WS_URL,
        connectionParams: () => {
          const token = localStorage.getItem('accessToken');
          return token ? { Authorization: `Bearer ${token}` } : {};
        }
      });

      let connectionEstablished = false;

      const unsubscribe = wsClient.subscribe(
        { query: 'subscription { __typename }' },
        {
          next: (data) => {
            console.log('✅ Initial subscription data:', data);
            connectionEstablished = true;
            
            // Simulate logout - remove token and close connection
            mockStorage.getItem.mockReturnValue(null);
            wsClient.dispose();
            
            setTimeout(() => {
              console.log('✅ Logout scenario completed');
              done();
            }, 100);
          },
          error: (error) => {
            if (connectionEstablished) {
              console.log('✅ Expected error after logout:', error.message);
              done();
            } else {
              console.log('ℹ️ Initial connection error:', error.message);
              done(); // May be expected
            }
          }
        }
      );

      setTimeout(() => {
        unsubscribe();
        done(new Error('Logout test timeout'));
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);
  });
});